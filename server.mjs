import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import Database from "better-sqlite3";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "24kb", strict: true }));
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (process.env.NODE_ENV === "production") res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

const PORT = Number(process.env.PORT || 3001);
const MPESA_ENV = process.env.MPESA_ENV || "sandbox";
const DARAJA_BASE = MPESA_ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
const MAX_ITEMS = 30;
const PAYMENT_POLL_SECRET = process.env.PAYMENT_POLL_SECRET || "";
const CALLBACK_TOKEN = process.env.MPESA_CALLBACK_TOKEN || "";
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || "";
const CATALOG_FILE = path.resolve(process.env.MPESA_CATALOG_FILE || path.join(__dirname, "catalog.demo.json"));
const DB_FILE = path.resolve(process.env.PAYMENT_DB_FILE || path.join(__dirname, "payments.sqlite"));
const DELIVERY_FEE_KES = Number(process.env.DELIVERY_FEE_KES || 150);
const MAX_AMOUNT_KES = Number(process.env.MPESA_MAX_AMOUNT_KES || 250000);
const LIVE_ENABLED = process.env.MPESA_LIVE_PAYMENTS_ENABLED === "true";
const TRANSACTION_TYPE = process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline";
const PARTY_B = process.env.MPESA_PARTY_B || process.env.MPESA_SHORTCODE || "";
const APP_ORIGIN = process.env.APP_ORIGIN || "";

const db = new Database(DB_FILE);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    payment_id TEXT PRIMARY KEY,
    idempotency_key TEXT NOT NULL UNIQUE,
    order_reference TEXT NOT NULL,
    amount_kes INTEGER NOT NULL,
    phone_number TEXT NOT NULL,
    items_json TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('initiating','pending','paid','failed','review')),
    customer_message TEXT,
    checkout_request_id TEXT UNIQUE,
    merchant_request_id TEXT,
    receipt_number TEXT,
    result_code TEXT,
    result_description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(order_reference);
`);

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
function pollTokenFor(paymentId) {
  return crypto.createHmac("sha256", PAYMENT_POLL_SECRET).update(paymentId).digest("hex");
}
function normalizePhone(input) {
  let digits = String(input ?? "").trim().replace(/[\s()-]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("0")) digits = `254${digits.slice(1)}`;
  else if (/^(?:7|1)\d{8}$/.test(digits)) digits = `254${digits}`;
  if (!/^254(?:7|1)\d{8}$/.test(digits)) return null;
  return digits;
}
function getCatalog() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, "utf8"));
  if (!catalog || !catalog.medicines || !catalog.pharmacies || !Number.isInteger(catalog.deliveryFeeKes)) throw new Error("Catalog file is invalid.");
  if (catalog.deliveryFeeKes !== DELIVERY_FEE_KES) throw new Error("The server delivery-fee setting does not match the catalog. Update both before checkout.");
  if (MPESA_ENV === "production") {
    if (!LIVE_ENABLED || catalog.environment !== "production" || catalog.liveCatalogVerified !== true) {
      throw new Error("Live payments are disabled until a verified production catalog is configured by the operator.");
    }
  }
  return catalog;
}
function ensureConfiguration() {
  if (!["sandbox", "production"].includes(MPESA_ENV)) throw new Error("MPESA_ENV must be sandbox or production.");
  const required = ["MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_SHORTCODE", "MPESA_PASSKEY", "MPESA_CALLBACK_URL", "MPESA_CALLBACK_TOKEN", "PAYMENT_POLL_SECRET"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error("Payment server is not configured. Missing secure environment variables: " + missing.join(", "));
  if (Buffer.byteLength(CALLBACK_TOKEN) < 32 || Buffer.byteLength(PAYMENT_POLL_SECRET) < 32) throw new Error("Payment callback and polling secrets must each be at least 32 characters.");
  if (!/^Customer(?:PayBill|BuyGoods)Online$/.test(TRANSACTION_TYPE)) throw new Error("Invalid M-Pesa transaction type setting.");
  const callback = new URL(CALLBACK_URL);
  if (callback.pathname !== `/api/payments/callback/${CALLBACK_TOKEN}`) throw new Error("Callback URL path must match the configured private callback token route.");
  if (MPESA_ENV === "production" && callback.protocol !== "https:") throw new Error("Production callback URL must use HTTPS.");
  if (callback.hostname === "localhost" || callback.hostname === "127.0.0.1") throw new Error("Safaricom must be able to reach a public callback URL.");
  if (!Number.isInteger(DELIVERY_FEE_KES) || DELIVERY_FEE_KES < 0) throw new Error("Invalid delivery fee configuration.");
  if (!Number.isInteger(MAX_AMOUNT_KES) || MAX_AMOUNT_KES < 1) throw new Error("Invalid maximum payment amount configuration.");
}
let tokenCache = { accessToken: "", expiresAt: 0 };
async function darajaAccessToken() {
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt) return tokenCache.accessToken;
  const basic = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");
  const response = await fetch(`${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${basic}` }, signal: AbortSignal.timeout(12000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) throw new Error("Daraja authorization failed; verify the environment and server credentials.");
  const lifetime = Math.max(60, Number(body.expires_in) || 3599);
  tokenCache = { accessToken: body.access_token, expiresAt: Date.now() + Math.max(30, lifetime - 90) * 1000 };
  return tokenCache.accessToken;
}
function darajaTimestamp() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (name) => parts.find((entry) => entry.type === name)?.value || "00";
  return `${part("year")}${part("month")}${part("day")}${part("hour")}${part("minute")}${part("second")}`;
}
function darajaPassword(timestamp) {
  return Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString("base64");
}
async function postDaraja(endpoint, body) {
  const accessToken = await darajaAccessToken();
  const response = await fetch(`${DARAJA_BASE}${endpoint}`, {
    method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    tokenCache = { accessToken: "", expiresAt: 0 };
    throw new Error("Daraja could not accept the payment request. Check your app, shortcode, passkey, and environment.");
  }
  return data;
}
function computeOrder(catalog, items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > MAX_ITEMS) throw new Error("Your cart is empty or contains too many items.");
  let subtotal = 0;
  const pharmacies = new Set();
  const verifiedItems = [];
  for (const row of items) {
    if (!row || typeof row.medicineId !== "string" || typeof row.pharmacyId !== "string" || !Number.isInteger(row.quantity) || row.quantity < 1 || row.quantity > 100) throw new Error("The cart contains an invalid item.");
    const medicine = catalog.medicines[row.medicineId];
    const pharmacy = catalog.pharmacies[row.pharmacyId];
    const offer = medicine?.offers?.[row.pharmacyId];
    if (!medicine?.active || !pharmacy?.active || !offer || !Number.isInteger(offer.priceKes) || !Number.isInteger(offer.stock)) throw new Error("A cart item is no longer available.");
    if (row.quantity > offer.stock) throw new Error(`Only ${offer.stock} units are available for ${medicine.name} at ${pharmacy.name}.`);
    if (MPESA_ENV === "production" && (catalog.environment !== "production" || !catalog.liveCatalogVerified || !medicine.verified || !pharmacy.verified || medicine.requiresPrescription)) throw new Error("This live checkout cannot process sample, unverified, or prescription-only catalogue items. Ask the pharmacy to verify availability and prescription requirements directly.");
    const lineTotal = offer.priceKes * row.quantity;
    subtotal += lineTotal;
    pharmacies.add(row.pharmacyId);
    verifiedItems.push({ medicineId: row.medicineId, medicineName: medicine.name, pharmacyId: row.pharmacyId, pharmacyName: pharmacy.name, quantity: row.quantity, unitPrice: offer.priceKes, lineTotal, prescriptionRequired: !!medicine.requiresPrescription });
  }
  const deliveryFee = catalog.deliveryFeeKes * pharmacies.size;
  const amount = subtotal + deliveryFee;
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > MAX_AMOUNT_KES) throw new Error(`The total must be a whole-KES amount no greater than ${MAX_AMOUNT_KES}.`);
  return { subtotal, deliveryFee, amount, pharmacies: pharmacies.size, items: verifiedItems };
}

const stkLimiter = rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false, message: { message: "Too many payment prompts. Wait a minute before trying again." } });
app.get("/api/payments/health", (_req, res) => res.status(200).json({ ok: true, environment: MPESA_ENV }));
app.post("/api/payments/mpesa/stk-push", stkLimiter, async (req, res) => {
  try {
    if (APP_ORIGIN && req.get("origin") && new URL(req.get("origin")).origin !== new URL(APP_ORIGIN).origin) return res.status(403).json({ message: "Request origin is not allowed." });
    ensureConfiguration();
    const phoneNumber = normalizePhone(req.body?.phoneNumber);
    const reference = String(req.body?.reference || "");
    const idempotencyKey = String(req.get("Idempotency-Key") || "");
    if (!phoneNumber) return res.status(400).json({ message: "Enter a valid Kenyan mobile number beginning 07, 01, or +254." });
    if (!/^PL-[A-Z0-9]{8}$/.test(reference)) return res.status(400).json({ message: "Invalid order reference." });
    if (!/^[0-9a-f-]{36}$/i.test(idempotencyKey)) return res.status(400).json({ message: "Invalid checkout request key." });
    const catalog = getCatalog();
    const order = computeOrder(catalog, req.body?.items);
    if (Number(req.body?.quotedTotal) !== order.amount) return res.status(409).json({ message: "The server-side order total differs from the cart. Refresh the page and review the updated price before paying." });

    const existing = db.prepare("SELECT * FROM payments WHERE idempotency_key = ?").get(idempotencyKey);
    if (existing) return res.status(200).json({ paymentId: existing.payment_id, pollToken: pollTokenFor(existing.payment_id), amount: existing.amount_kes, customerMessage: existing.customer_message || "This payment request already exists. Check its status." });

    const paymentId = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO payments(payment_id,idempotency_key,order_reference,amount_kes,phone_number,items_json,status,created_at,updated_at)
      VALUES(?,?,?,?,?,?,'initiating',?,?)`).run(paymentId, idempotencyKey, reference, order.amount, phoneNumber, JSON.stringify(order.items), now, now);

    const timestamp = darajaTimestamp();
    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: darajaPassword(timestamp),
      Timestamp: timestamp,
      TransactionType: TRANSACTION_TYPE,
      Amount: order.amount,
      PartyA: phoneNumber,
      PartyB,
      PhoneNumber: phoneNumber,
      CallBackURL: CALLBACK_URL,
      AccountReference: reference.slice(0, 12),
      TransactionDesc: "OrderPayment",
    };
    let result;
    try {
      result = await postDaraja("/mpesa/stkpush/v1/processrequest", payload);
    } catch (error) {
      db.prepare("UPDATE payments SET status='review',result_description=?,updated_at=? WHERE payment_id=? AND status='initiating'").run("Daraja response was ambiguous. Check the Safaricom portal before attempting another prompt.", new Date().toISOString(), paymentId);
      throw new Error("Payment request outcome is uncertain. Do not retry yet; check the Daraja portal or contact support.");
    }
    if (String(result.ResponseCode) !== "0" || !result.CheckoutRequestID) {
      db.prepare("UPDATE payments SET status='failed', result_description=?, updated_at=? WHERE payment_id=?").run(String(result.ResponseDescription || result.errorMessage || "Daraja rejected the request.").slice(0, 400), new Date().toISOString(), paymentId);
      return res.status(502).json({ message: "Safaricom did not accept the STK prompt. No payment is confirmed." });
    }
    const message = String(result.CustomerMessage || "Check your phone for the M-Pesa prompt. Enter your PIN only in the M-Pesa prompt if you choose to pay.").slice(0, 250);
    db.prepare(`UPDATE payments SET status='pending',checkout_request_id=?,merchant_request_id=?,customer_message=?,updated_at=? WHERE payment_id=?`)
      .run(String(result.CheckoutRequestID), String(result.MerchantRequestID || "").slice(0, 120), message, new Date().toISOString(), paymentId);
    return res.status(202).json({ paymentId, pollToken: pollTokenFor(paymentId), amount: order.amount, customerMessage: message });
  } catch (error) {
    const message = error?.message || "Could not start M-Pesa checkout.";
    const code = message.includes("not configured") || message.includes("Live payments are disabled") || message.includes("production callback") || message.includes("Callback URL") || message.includes("secure environment") ? 503 : message.includes("outcome is uncertain") ? 409 : 400;
    return res.status(code).json({ message });
  }
});

app.get("/api/payments/mpesa/status/:paymentId", (req, res) => {
  const payment = db.prepare("SELECT payment_id,order_reference,amount_kes,status,receipt_number,result_description,customer_message FROM payments WHERE payment_id=?").get(req.params.paymentId);
  if (!payment) return res.status(404).json({ message: "Payment record not found." });
  const supplied = String(req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!supplied || !safeEqual(supplied, pollTokenFor(payment.payment_id))) return res.status(401).json({ message: "Payment status token is invalid." });
  return res.status(200).json({ paymentId: payment.payment_id, reference: payment.order_reference, amount: payment.amount_kes, status: payment.status, receipt: payment.receipt_number || "", message: payment.status === "review" ? "Payment details did not match the expected order; manual review is required." : payment.status === "failed" ? (payment.result_description || "Payment was not completed.") : payment.customer_message || "Waiting for Safaricom payment callback." });
});

app.post("/api/payments/callback/:token", (req, res) => {
  if (!CALLBACK_TOKEN || !safeEqual(req.params.token, CALLBACK_TOKEN)) return res.status(404).end();
  const callback = req.body?.Body?.stkCallback;
  if (!callback || typeof callback.CheckoutRequestID !== "string" || callback.CheckoutRequestID.length > 120) return res.status(400).json({ message: "Invalid callback payload." });
  const payment = db.prepare("SELECT * FROM payments WHERE checkout_request_id=?").get(callback.CheckoutRequestID);
  if (!payment) return res.status(200).json({ ResultCode: 0, ResultDesc: "Acknowledged" });
  const now = new Date().toISOString();
  if (payment.status === "paid" || payment.status === "failed" || payment.status === "review") return res.status(200).json({ ResultCode: 0, ResultDesc: "Acknowledged" });
  const resultCode = String(callback.ResultCode ?? "");
  const resultDescription = String(callback.ResultDesc || "").slice(0, 400);
  if (resultCode !== "0") {
    db.prepare("UPDATE payments SET status='failed',result_code=?,result_description=?,updated_at=? WHERE payment_id=? AND status='pending'").run(resultCode, resultDescription, now, payment.payment_id);
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Acknowledged" });
  }
  const metadata = Object.fromEntries((callback.CallbackMetadata?.Item || []).filter((item) => item && typeof item.Name === "string").map((item) => [item.Name, item.Value]));
  const amount = Number(metadata.Amount);
  const phone = normalizePhone(String(metadata.PhoneNumber ?? ""));
  const receipt = String(metadata.MpesaReceiptNumber || "");
  if (!Number.isInteger(amount) || amount !== payment.amount_kes || phone !== payment.phone_number || !/^[A-Z0-9]{8,16}$/.test(receipt)) {
    db.prepare("UPDATE payments SET status='review',result_code=?,result_description=?,updated_at=? WHERE payment_id=? AND status='pending'").run(resultCode, "Callback amount, payer, or receipt did not match the order; manual review required.", now, payment.payment_id);
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Acknowledged" });
  }
  db.prepare("UPDATE payments SET status='paid',receipt_number=?,result_code=?,result_description=?,updated_at=? WHERE payment_id=? AND status='pending'").run(receipt, resultCode, resultDescription, now, payment.payment_id);
  return res.status(200).json({ ResultCode: 0, ResultDesc: "Acknowledged" });
});

app.use((error, _req, res, _next) => {
  if (error?.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON request." });
  return res.status(500).json({ message: "Unexpected payment service error." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`PharmaLink payment API listening on port ${PORT}; environment=${MPESA_ENV}; database=${DB_FILE}`);
  if (MPESA_ENV === "production") console.warn("Live M-Pesa mode: confirm production Daraja keys, HTTPS callback, and verified catalog before accepting payments.");
});
