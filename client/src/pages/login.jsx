import {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from "react";
import { createPortal } from "react-dom";

/* ------------------------------------------------------------------ */
/*  Settings                                                           */
/* ------------------------------------------------------------------ */

const BRAND = "PharmaLink";
const LOGO_SRC = "/logo.png";
const LOGO_HOME = "/";
const REDIRECT_AFTER_AUTH = "#/home";
const GOOGLE_CLIENT_ID =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_GOOGLE_CLIENT_ID) ||
  "";

/*
  Images live in your /public folder and are served from the site root,
  so the URL must start with "/" and must NOT include "public/".
  Rename "medicine cabinet.png" to "medicine-cabinet.png" when you can.
*/
const SLIDES = [
  "/medicine cabinet.png",
  "/meds.png",
  "/pharmaceutical-industry.jpg",
  "/pharmacy.jpg",
  "/pexels-karola-g-4021813.jpg",
  "/pharmacy_24_bg.avif",
].map((s) => encodeURI(s));

const CAPTIONS = [
  "Medicine delivered to your door, anywhere in the country",
  "See which pharmacies have your prescription in stock, live",
  "Verified pharmacies working together as one network",
  "Order in minutes and track every delivery in real time",
  "Refills and reminders that keep your family covered",
  "Care that reaches every town, not just the city",
];

const TAGLINES = [
  "Find your medicine across every partner pharmacy",
  "Delivered to you, wherever you are in the country",
  "Verified pharmacies. Trusted care.",
];

const SLIDE_MS = 6000;
const FONT = "'Montserrat','Segoe UI',system-ui,-apple-system,sans-serif";

/* Pharmacy colours: medical green, mint, white, deep green */
const THEME = {
  green: "#10b265",
  mint: "#7ee8b0",
  deep: "#04150d",
  soft: "#d8f8e8",
};

/* ------------------------------------------------------------------ */
/*  Colour helpers                                                     */
/* ------------------------------------------------------------------ */

const hexToRgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = (c) =>
  "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const mix = (a, b, t) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A.map((v, i) => v + (B[i] - v) * t));
};
const rgba = (hex, a) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}][\p{L}\s'’.-]{1,59}$/u;
const normPhone = (p) => p.replace(/[^\d+]/g, "");
const PHONE_RE = /^\+?\d{9,15}$/;

const getRules = (ctx = {}) => {
  const rules = [
    { id: "len", label: "At least 8 characters", test: (p) => p.length >= 8 && p.length <= 64 },
    { id: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { id: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
    { id: "num", label: "One number", test: (p) => /\d/.test(p) },
    { id: "special", label: "One special character", test: (p) => /[^A-Za-z0-9\s]/.test(p) },
    { id: "space", label: "No spaces", test: (p) => !/\s/.test(p) },
  ];
  const tokens = [
    (ctx.email || "").split("@")[0],
    ...(ctx.name || "").trim().split(/\s+/),
  ]
    .map((s) => s.toLowerCase())
    .filter((s) => s.length >= 3);
  if (tokens.length) {
    rules.push({
      id: "personal",
      label: "No name or email in it",
      test: (p) => !tokens.some((tk) => p.toLowerCase().includes(tk)),
    });
  }
  return rules;
};

function validateSignup(v) {
  const e = {};
  const name = v.name.trim();
  if (!NAME_RE.test(name)) e.name = "Enter your full name using letters only";
  else if (name.split(/\s+/).length < 2) e.name = "Enter your first and last name";
  if (!PHONE_RE.test(normPhone(v.phone))) e.phone = "Enter a valid phone number (9 to 15 digits)";
  if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter a valid email address";
  if (!v.password) e.password = "Create a password";
  else if (getRules(v).some((r) => !r.test(v.password)))
    e.password = "Your password does not meet all the rules below";
  if (!v.confirm) e.confirm = "Confirm your password";
  else if (v.confirm !== v.password) e.confirm = "The passwords do not match";
  if (!v.terms) e.terms = "Accept the terms to create your account";
  return e;
}

/* ------------------------------------------------------------------ */
/*  Account service (browser storage; swap for your API when ready)    */
/* ------------------------------------------------------------------ */

const USERS_KEY = "pharmalink_users";
const SESSION_KEY = "pharmalink_session";

const readUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
};
const writeUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));

const toHex = (buf) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
const makeSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)));
const hashPassword = async (password, salt) =>
  toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + password)));

async function registerUser({ name, phone, email, password }) {
  const users = readUsers();
  const mail = email.trim().toLowerCase();
  const tel = normPhone(phone);
  if (users.some((u) => u.email === mail))
    throw new Error("An account with this email already exists. Log in instead.");
  if (users.some((u) => u.phone === tel))
    throw new Error("An account with this phone number already exists.");
  const salt = makeSalt();
  const user = {
    id: "u_" + Date.now().toString(36) + makeSalt().slice(0, 6),
    name: name.trim(),
    phone: tel,
    email: mail,
    salt,
    hash: await hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  };
  writeUsers([...users, user]);
  return user;
}

async function loginUser({ identifier, password }) {
  const key = identifier.trim().toLowerCase();
  const tel = normPhone(identifier);
  const user = readUsers().find(
    (u) => u.email === key || (PHONE_RE.test(tel) && u.phone === tel)
  );
  if (!user) throw new Error("We could not find an account with those details.");
  if ((await hashPassword(password, user.salt)) !== user.hash)
    throw new Error("Incorrect password. Try again or reset it.");
  return user;
}

const userExists = (email) =>
  readUsers().some((u) => u.email === email.trim().toLowerCase());

async function resetPassword(email, password) {
  const users = readUsers();
  const idx = users.findIndex((u) => u.email === email.trim().toLowerCase());
  if (idx < 0) throw new Error("No account found with that email.");
  const salt = makeSalt();
  users[idx] = { ...users[idx], salt, hash: await hashPassword(password, salt) };
  writeUsers(users);
}

function startSession(user, remember) {
  const data = JSON.stringify({
    id: user.id,
    name: user.name,
    email: user.email,
    picture: user.picture || null,
    provider: user.provider || "password",
    at: Date.now(),
  });
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, data);
}

/* ------------------------------------------------------------------ */
/*  Google sign-in                                                     */
/* ------------------------------------------------------------------ */

function loadGoogle() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.oauth2)
      return resolve();
    const fail = () =>
      reject(new Error("Could not reach Google. Check your connection and try again."));
    const existing = document.getElementById("google-gsi");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", fail);
      return;
    }
    const s = document.createElement("script");
    s.id = "google-gsi";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = fail;
    document.head.appendChild(s);
  });
}

async function googleSignIn() {
  if (!GOOGLE_CLIENT_ID)
    throw new Error(
      "Google sign-in is not set up yet. Add VITE_GOOGLE_CLIENT_ID to your .env file and restart the dev server."
    );
  await loadGoogle();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      callback: async (resp) => {
        if (resp.error) return reject(new Error("Google sign-in was cancelled."));
        try {
          const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${resp.access_token}` },
          });
          if (!r.ok) throw new Error();
          const p = await r.json();
          resolve({
            id: "g_" + p.sub,
            name: p.name || p.email,
            email: p.email,
            picture: p.picture,
            provider: "google",
          });
        } catch {
          reject(new Error("Could not read your Google profile. Try again."));
        }
      },
      error_callback: () => reject(new Error("Google sign-in was cancelled.")),
    });
    client.requestAccessToken();
  });
}

/* ------------------------------------------------------------------ */
/*  Small hooks                                                        */
/* ------------------------------------------------------------------ */

const ThemeCtx = createContext(THEME);
const useTheme = () => useContext(ThemeCtx);

function useHover() {
  const [h, setH] = useState(false);
  return [
    h,
    {
      onMouseEnter: () => setH(true),
      onMouseLeave: () => setH(false),
      onFocus: () => setH(true),
      onBlur: () => setH(false),
    },
  ];
}

function useWidth() {
  const [w, setW] = useState(typeof window === "undefined" ? 1024 : window.innerWidth);
  useEffect(() => {
    const f = () => setW(window.innerWidth);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return w;
}

function useReducedMotion() {
  const [r, setR] = useState(
    typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => setR(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

function useShake() {
  const [x, setX] = useState(0);
  const run = useCallback(() => {
    [-12, 10, -8, 6, -3, 0].forEach((v, i) => setTimeout(() => setX(v), i * 70));
  }, []);
  return [x, run];
}

const readRoute = () =>
  window.location.hash.replace(/^#/, "") === "/signup" ? "/signup" : "/login";
const navigate = (p) => {
  window.location.hash = p;
};

function useRoute() {
  const [r, setR] = useState(readRoute);
  useEffect(() => {
    const f = () => {
      setR(readRoute());
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return r;
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

const Icon = ({ children, size = 20, stroke = 2, fill = "none", color = "currentColor", style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ flexShrink: 0, ...style }}
  >
    {children}
  </svg>
);

const I = {
  user: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </Icon>
  ),
  lock: (p) => (
    <Icon {...p}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Icon>
  ),
  mail: (p) => (
    <Icon {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </Icon>
  ),
  phone: (p) => (
    <Icon {...p}>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </Icon>
  ),
  eye: (p) => (
    <Icon {...p}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  ),
  eyeOff: (p) => (
    <Icon {...p}>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A9.8 9.8 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.7 9.7 0 0 0 4.2-1" />
    </Icon>
  ),
  check: (p) => (
    <Icon {...p}>
      <path d="m5 12 5 5 9-10" />
    </Icon>
  ),
  x: (p) => (
    <Icon {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  ),
  alert: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 16.5v.5" />
    </Icon>
  ),
  left: (p) => (
    <Icon {...p}>
      <path d="m15 5-7 7 7 7" />
    </Icon>
  ),
  right: (p) => (
    <Icon {...p}>
      <path d="m9 5 7 7-7 7" />
    </Icon>
  ),
  truck: (p) => (
    <Icon {...p}>
      <path d="M3 6h11v10H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </Icon>
  ),
  network: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <path d="M12 7.5v4M12 11.5 6.5 17M12 11.5l5.5 5.5" />
    </Icon>
  ),
  shield: (p) => (
    <Icon {...p}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  ),
  google: (p) => (
    <Icon {...p} stroke={0} fill="none">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.35z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.23-2.5c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.07v2.58A10 10 0 0 0 12 22z" />
      <path fill="#FBBC05" d="M6.41 13.91a6 6 0 0 1 0-3.82V7.51H3.07a10 10 0 0 0 0 8.98l3.34-2.58z" />
      <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.99 14.7 2 12 2a10 10 0 0 0-8.93 5.51l3.34 2.58C7.2 7.74 9.4 5.98 12 5.98z" />
    </Icon>
  ),
};

/* ------------------------------------------------------------------ */
/*  Shared building blocks                                             */
/* ------------------------------------------------------------------ */

function Logo({ size = 54 }) {
  const t = useTheme();
  const [ok, setOk] = useState(true);
  const [hover, bind] = useHover();
  return (
    <a
      href={LOGO_HOME}
      aria-label={`${BRAND} home`}
      {...bind}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        textDecoration: "none",
        color: "#fff",
        outline: "none",
        transform: hover ? "scale(1.06)" : "scale(1)",
        filter: `drop-shadow(0 0 ${hover ? 14 : 5}px ${rgba(t.green, hover ? 0.95 : 0.45)})`,
        transition: "transform .3s ease, filter .3s ease",
      }}
    >
      {ok ? (
        <img
          src={LOGO_SRC}
          alt={BRAND}
          onError={() => setOk(false)}
          style={{ height: size, width: "auto", objectFit: "contain" }}
        />
      ) : (
        <>
          <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 40 40" aria-hidden="true">
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor={t.green} />
                <stop offset="1" stopColor={t.mint} />
              </linearGradient>
            </defs>
            <rect width="40" height="40" rx="12" fill="url(#lg)" />
            <path d="M17 9h6v8h8v6h-8v8h-6v-8H9v-6h8z" fill="#ffffff" />
          </svg>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: 0.3 }}>{BRAND}</span>
        </>
      )}
    </a>
  );
}

function Spinner({ color }) {
  const [a, setA] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setA((v) => (v + 30) % 360), 60);
    return () => clearInterval(i);
  }, []);
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ transform: `rotate(${a}deg)` }} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeOpacity=".25" strokeWidth="3" />
      <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Ripple({ x, y, color }) {
  const [g, setG] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setG(true)));
    return () => cancelAnimationFrame(r);
  }, []);
  return (
    <span
      style={{
        position: "absolute",
        left: x - 10,
        top: y - 10,
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: color,
        transform: `scale(${g ? 24 : 0})`,
        opacity: g ? 0 : 0.55,
        transition: "transform .7s ease-out, opacity .7s ease-out",
        pointerEvents: "none",
      }}
    />
  );
}

function Btn({ children, type = "button", onClick, busy, busyText, disabled, variant = "primary" }) {
  const t = useTheme();
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const [ripples, setRipples] = useState([]);
  const off = disabled || busy;
  const primary = variant === "primary";

  const addRipple = (e) => {
    const b = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setRipples((r) => [...r, { id, x: e.clientX - b.left, y: e.clientY - b.top }]);
    setTimeout(() => setRipples((r) => r.filter((i) => i.id !== id)), 700);
  };

  return (
    <button
      type={type}
      disabled={off}
      onClick={(e) => {
        if (off) return;
        addRipple(e);
        if (onClick) onClick(e);
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPress(false);
      }}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: 54,
        borderRadius: 999,
        border: primary ? "none" : `1px solid ${rgba("#ffffff", hover ? 0.6 : 0.28)}`,
        cursor: off ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        fontSize: 16,
        fontWeight: 700,
        letterSpacing: 0.3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: primary ? t.deep : "#fff",
        backgroundImage: primary
          ? `linear-gradient(120deg, ${t.green}, ${mix(t.green, t.mint, 0.5)} 55%, ${t.mint})`
          : "none",
        backgroundColor: primary ? "transparent" : rgba("#ffffff", hover ? 0.16 : 0.08),
        backdropFilter: primary ? undefined : "blur(10px)",
        WebkitBackdropFilter: primary ? undefined : "blur(10px)",
        boxShadow: primary
          ? `0 ${hover ? 12 : 7}px ${hover ? 38 : 24}px ${rgba(t.green, hover ? 0.7 : 0.42)}, 0 0 ${hover ? 26 : 0}px ${rgba(t.mint, 0.55)}, inset 0 1px 0 ${rgba("#ffffff", 0.5)}`
          : `0 0 ${hover ? 28 : 0}px ${rgba(t.green, 0.55)}, inset 0 1px 0 ${rgba("#ffffff", 0.2)}`,
        transform: `translateY(${hover && !off ? -2 : 0}px) scale(${press && !off ? 0.98 : 1})`,
        opacity: off ? 0.75 : 1,
        transition: "transform .2s ease, box-shadow .3s ease, border-color .3s ease",
        outline: "none",
      }}
    >
      {primary && (
        <span
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: hover ? "120%" : "-60%",
            width: "40%",
            transform: "skewX(-20deg)",
            backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent)",
            transition: "left .8s ease",
            pointerEvents: "none",
          }}
        />
      )}
      {ripples.map((r) => (
        <Ripple key={r.id} x={r.x} y={r.y} color={primary ? rgba("#ffffff", 0.9) : rgba(t.green, 0.9)} />
      ))}
      <span style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
        {busy ? (
          <>
            <Spinner color={primary ? t.deep : "#fff"} />
            {busyText || "Please wait"}
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
}

function Field({
  icon: Ic,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  right,
  name,
  autoComplete,
  inputMode,
  maxLength,
  autoFocus,
}) {
  const t = useTheme();
  const [hover, bind] = useHover();
  const [focus, setFocus] = useState(false);
  const [auto, setAuto] = useState(false);
  const inputRef = useRef(null);

  /* Browser autofill fills the input without a React change event.
     Detect it so the label lifts and React state stays in sync. */
  useEffect(() => {
    const check = () => {
      const el = inputRef.current;
      if (!el) return;
      let filled = false;
      try {
        filled = el.matches(":-webkit-autofill") || el.matches(":autofill");
      } catch {
        /* selector not supported */
      }
      if (el.value && el.value !== value) onChange(el.value);
      setAuto(filled || !!el.value);
    };
    const timers = [50, 250, 600, 1200, 2500].map((ms) => setTimeout(check, ms));
    const el = inputRef.current;
    const onAnim = (e) => {
      if (e.animationName === "pl-autofill-start") check();
    };
    if (el) el.addEventListener("animationstart", onAnim);
    return () => {
      timers.forEach(clearTimeout);
      if (el) el.removeEventListener("animationstart", onAnim);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value.length === 0 && !focus) setAuto(false);
  }, [value, focus]);

  const lifted = focus || value.length > 0 || auto;
  const glow = focus ? 1 : hover ? 0.7 : 0;
  const bad = !!error;
  const edge = bad ? "#ff7a90" : t.mint;

  return (
    <div style={{ marginBottom: bad ? 6 : 18 }}>
      <div
        onMouseEnter={bind.onMouseEnter}
        onMouseLeave={bind.onMouseLeave}
        style={{
          position: "relative",
          height: 58,
          borderRadius: 999,
          backgroundImage: `linear-gradient(145deg, ${rgba("#ffffff", 0.1)}, ${rgba(t.deep, 0.45)})`,
          border: `1px solid ${rgba(edge, focus ? 0.95 : hover ? 0.65 : bad ? 0.7 : 0.25)}`,
          boxShadow: `-3px -3px 10px ${rgba("#ffffff", 0.08 + 0.22 * glow)}, 6px 8px 16px rgba(0,0,0,.35), 0 0 ${30 * glow}px ${rgba(bad ? "#ff7a90" : t.green, 0.6)}`,
          transform: `translateY(${hover || focus ? -1 : 0}px)`,
          transition: "box-shadow .3s ease, border-color .3s ease, transform .3s ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 20,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            color: focus || hover ? t.mint : t.soft,
            filter: focus ? `drop-shadow(0 0 6px ${rgba(t.mint, 0.9)})` : "none",
            transition: "color .3s ease, filter .3s ease",
            pointerEvents: "none",
          }}
        >
          <Ic size={20} />
        </span>
        <label
          htmlFor={name}
          style={{
            position: "absolute",
            left: 56,
            top: lifted ? 8 : 20,
            fontSize: lifted ? 11 : 15,
            lineHeight: 1.1,
            fontWeight: 500,
            color: lifted ? t.mint : rgba("#ffffff", 0.75),
            transition: "top .25s ease, font-size .25s ease, color .25s ease",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {label}
        </label>
        <input
          ref={inputRef}
          id={name}
          name={name}
          type={type}
          value={value}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => {
            setFocus(false);
            if (inputRef.current && inputRef.current.value !== value) onChange(inputRef.current.value);
            if (onBlur) onBlur();
          }}
          aria-invalid={bad}
          style={{
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            padding: right ? "25px 54px 6px 56px" : "25px 20px 6px 56px",
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#fff",
            fontSize: 15,
            lineHeight: "20px",
            fontFamily: "inherit",
            borderRadius: 999,
          }}
        />
        {right && (
          <span
            style={{
              position: "absolute",
              right: 12,
              top: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            {right}
          </span>
        )}
      </div>
      {bad && (
        <div role="alert" style={{ color: "#ff9fb0", fontSize: 12, margin: "6px 0 10px 18px", lineHeight: 1.35 }}>
          {error}
        </div>
      )}
    </div>
  );
}

function EyeToggle({ shown, onToggle }) {
  const t = useTheme();
  const [hover, bind] = useHover();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Hide password" : "Show password"}
      {...bind}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "none",
        background: hover ? rgba("#ffffff", 0.12) : "transparent",
        color: hover ? t.mint : t.soft,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        filter: hover ? `drop-shadow(0 0 6px ${rgba(t.mint, 0.9)})` : "none",
        transition: "all .25s ease",
        outline: "none",
      }}
    >
      {shown ? <I.eyeOff size={19} /> : <I.eye size={19} />}
    </button>
  );
}

function Check({ checked, onChange, error, children }) {
  const t = useTheme();
  const [hover, bind] = useHover();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      {...bind}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 14,
        textAlign: "left",
        outline: "none",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          flexShrink: 0,
          border: `2px solid ${error ? "#ff7a90" : t.green}`,
          backgroundImage: checked ? `linear-gradient(135deg, ${t.green}, ${t.mint})` : "none",
          backgroundColor: checked ? "transparent" : rgba("#ffffff", 0.06),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 ${hover || checked ? 16 : 0}px ${rgba(t.green, 0.7)}`,
          transition: "all .25s ease",
        }}
      >
        <span
          style={{
            display: "flex",
            transform: checked ? "scale(1)" : "scale(0)",
            transition: "transform .25s ease",
          }}
        >
          <I.check size={14} stroke={3} color={t.deep} />
        </span>
      </span>
      <span>{children}</span>
    </button>
  );
}

function TextLink({ href, onClick, children, italic, style }) {
  const t = useTheme();
  const [hover, bind] = useHover();
  const common = {
    ...bind,
    style: {
      color: hover ? t.soft : t.mint,
      fontStyle: italic ? "italic" : "normal",
      fontWeight: 600,
      fontSize: "inherit",
      fontFamily: "inherit",
      textDecoration: hover ? "underline" : "none",
      textShadow: hover ? `0 0 12px ${rgba(t.mint, 0.9)}` : "none",
      transition: "color .25s ease, text-shadow .25s ease",
      cursor: "pointer",
      outline: "none",
      background: "none",
      border: "none",
      padding: 0,
      ...style,
    },
  };
  return href ? (
    <a href={href} {...common}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} {...common}>
      {children}
    </button>
  );
}

function Msg({ kind, children }) {
  const t = useTheme();
  const err = kind === "error";
  const c = err ? "#ff8fa3" : t.mint;
  return (
    <div
      role={err ? "alert" : "status"}
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "10px 14px",
        borderRadius: 16,
        marginBottom: 16,
        fontSize: 13,
        lineHeight: 1.45,
        background: rgba(c, 0.12),
        border: `1px solid ${rgba(c, 0.5)}`,
        color: err ? "#ffc9d2" : "#fff",
        boxShadow: `0 0 18px ${rgba(c, 0.22)}`,
      }}
    >
      <span style={{ color: c, marginTop: 1, display: "flex" }}>
        {err ? <I.alert size={17} /> : <I.check size={17} stroke={2.5} />}
      </span>
      <span>{children}</span>
    </div>
  );
}

function Divider({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 16px", color: "rgba(255,255,255,.75)", fontSize: 13, fontWeight: 600 }}>
      <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.2)" }} />
      {children}
      <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.2)" }} />
    </div>
  );
}

function Tagline() {
  const t = useTheme();
  const [i, setI] = useState(0);
  const [vis, setVis] = useState(true);
  useEffect(() => {
    let swap;
    const id = setInterval(() => {
      setVis(false);
      swap = setTimeout(() => {
        setI((n) => (n + 1) % TAGLINES.length);
        setVis(true);
      }, 450);
    }, 3800);
    return () => {
      clearInterval(id);
      clearTimeout(swap);
    };
  }, []);
  return (
    <div style={{ minHeight: 20, marginTop: 8, fontSize: 13, color: t.soft, opacity: vis ? 0.95 : 0, transform: vis ? "translateY(0)" : "translateY(6px)", transition: "opacity .45s ease, transform .45s ease" }}>
      {TAGLINES[i]}
    </div>
  );
}

function CardHeader({ eyebrow, title, tagline }) {
  const t = useTheme();
  return (
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      <Logo />
      <div style={{ marginTop: 14, fontSize: 14, fontWeight: 500, color: t.soft }}>{eyebrow}</div>
      <h1
        style={{
          margin: "4px 0 0",
          fontSize: 28,
          lineHeight: 1.2,
          fontWeight: 800,
          backgroundImage: `linear-gradient(100deg, #ffffff 10%, ${t.soft} 45%, ${t.mint} 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
          filter: `drop-shadow(0 0 14px ${rgba(t.green, 0.45)})`,
        }}
      >
        {title}
      </h1>
      {tagline && <Tagline />}
    </div>
  );
}

function GlassCard({ children, shakeX = 0, width = 440 }) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, mx: 50, my: 50, on: false });
  const w = useWidth();

  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const move = (e) => {
    if (!ref.current) return;
    const b = ref.current.getBoundingClientRect();
    const px = (e.clientX - b.left) / b.width;
    const py = (e.clientY - b.top) / b.height;
    setTilt({
      x: reduced ? 0 : (py - 0.5) * -3,
      y: reduced ? 0 : (px - 0.5) * 3,
      mx: px * 100,
      my: py * 100,
      on: true,
    });
  };

  return (
    <div
      style={{
        width: `min(${width}px, 100%)`,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(26px)",
        transition: "opacity .9s ease, transform .9s cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <div
        ref={ref}
        onMouseMove={move}
        onMouseLeave={() => setTilt({ x: 0, y: 0, mx: 50, my: 50, on: false })}
        style={{
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
          borderRadius: 32,
          padding: w < 420 ? "28px 18px 22px" : "34px 30px 26px",
          backgroundImage: `linear-gradient(145deg, ${rgba("#ffffff", 0.16)}, ${rgba(t.deep, 0.62)})`,
          backdropFilter: "blur(22px) saturate(160%)",
          WebkitBackdropFilter: "blur(22px) saturate(160%)",
          border: `1px solid ${rgba("#ffffff", 0.22)}`,
          boxShadow: `0 30px 80px rgba(0,0,0,.55), 0 0 ${tilt.on ? 80 : 50}px ${rgba(t.green, tilt.on ? 0.42 : 0.3)}, inset 0 1px 0 ${rgba("#ffffff", 0.35)}`,
          transform: `perspective(1100px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateX(${shakeX}px)`,
          transition: "transform .15s ease-out, box-shadow .5s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: tilt.on ? 1 : 0,
            backgroundImage: `radial-gradient(420px circle at ${tilt.mx}% ${tilt.my}%, ${rgba(t.mint, 0.18)}, transparent 60%)`,
            transition: "opacity .4s ease",
          }}
        />
        <div style={{ position: "relative" }}>{children}</div>
      </div>
    </div>
  );
}

function WelcomeOverlay({ name }) {
  const t = useTheme();
  const on = !!name;
  useEffect(() => {
    if (!name) return;
    const id = setTimeout(() => window.location.assign(REDIRECT_AFTER_AUTH), 1700);
    return () => clearTimeout(id);
  }, [name]);
  return (
    <div
      aria-live="polite"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        textAlign: "center",
        padding: 24,
        background: rgba(t.deep, 0.88),
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        opacity: on ? 1 : 0,
        pointerEvents: on ? "auto" : "none",
        transition: "opacity .5s ease",
      }}
    >
      <div
        style={{
          width: 86,
          height: 86,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `linear-gradient(135deg, ${t.green}, ${t.mint})`,
          boxShadow: `0 0 50px ${rgba(t.green, 0.8)}, 0 0 90px ${rgba(t.mint, 0.4)}`,
          transform: on ? "scale(1)" : "scale(.5)",
          transition: "transform .6s cubic-bezier(.2,1.4,.4,1)",
        }}
      >
        <I.check size={42} stroke={3} color={t.deep} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>Welcome, {(name || "").split(" ")[0]}</div>
      <div style={{ fontSize: 14, color: t.soft }}>Taking you to your dashboard</div>
    </div>
  );
}

function GoogleButton({ label, onSuccess, onError, disabled }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    loadGoogle().catch(() => {});
  }, []);
  const go = async () => {
    setBusy(true);
    try {
      onSuccess(await googleSignIn());
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Btn variant="ghost" onClick={go} busy={busy} busyText="Connecting to Google" disabled={disabled}>
      <I.google size={22} />
      {label}
    </Btn>
  );
}

function RuleList({ password, ctx }) {
  const t = useTheme();
  const rules = getRules(ctx);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px 12px", margin: "2px 6px 16px" }}>
      {rules.map((r) => {
        const ok = r.test(password);
        return (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: ok ? t.mint : "rgba(255,255,255,.65)", transition: "color .3s ease" }}>
            <span
              style={{
                width: 16,
                height: 16,
                flexShrink: 0,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: ok ? t.mint : rgba("#ffffff", 0.12),
                color: ok ? t.deep : "rgba(255,255,255,.65)",
                boxShadow: ok ? `0 0 10px ${rgba(t.mint, 0.8)}` : "none",
                transition: "all .3s ease",
              }}
            >
              {ok ? <I.check size={10} stroke={3.5} /> : <I.x size={9} stroke={3} />}
            </span>
            {r.label}
          </div>
        );
      })}
    </div>
  );
}

function StrengthBar({ password }) {
  const t = useTheme();
  const passed = getRules().filter((r) => r.test(password)).length + (password.length >= 12 ? 1 : 0);
  const level = !password ? 0 : passed <= 3 ? 1 : passed <= 5 ? 2 : passed <= 6 ? 3 : 4;
  const colors = ["#ff6b81", "#f2b84b", t.mint, t.green];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 6px 12px" }}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            background: i < level ? colors[level - 1] : rgba("#ffffff", 0.14),
            boxShadow: i < level ? `0 0 10px ${rgba(colors[level - 1], 0.8)}` : "none",
            transition: "all .35s ease",
          }}
        />
      ))}
      <span style={{ width: 52, textAlign: "right", fontSize: 12, fontWeight: 700, color: level ? colors[level - 1] : "transparent" }}>
        {labels[level] || "-"}
      </span>
    </div>
  );
}

function FeatureChips() {
  const items = [
    [I.truck, "Nationwide delivery"],
    [I.network, "Live pharmacy stock"],
    [I.shield, "Verified pharmacists"],
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 20, maxWidth: 460 }}>
      {items.map(([Ic, text]) => (
        <Chip key={text} Ic={Ic} text={text} />
      ))}
    </div>
  );
}

function Chip({ Ic, text }) {
  const t = useTheme();
  const [hover, bind] = useHover();
  return (
    <div
      {...bind}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 14px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        color: "#fff",
        background: rgba(t.deep, hover ? 0.7 : 0.5),
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: `1px solid ${rgba(t.mint, hover ? 0.8 : 0.28)}`,
        boxShadow: `0 0 ${hover ? 24 : 0}px ${rgba(t.green, 0.65)}`,
        transform: `translateY(${hover ? -3 : 0}px)`,
        transition: "all .3s ease",
        cursor: "default",
      }}
    >
      <span style={{ color: t.mint, display: "flex" }}>
        <Ic size={17} />
      </span>
      {text}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Forgot password                                                    */
/* ------------------------------------------------------------------ */

function ForgotModal({ onClose, onDone }) {
  const t = useTheme();
  const [vis, setVis] = useState(false);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const r = requestAnimationFrame(() => setVis(true));
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => {
      cancelAnimationFrame(r);
      window.removeEventListener("keydown", k);
    };
  }, [onClose]);

  const findAccount = (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) return setErr("Enter the email address you signed up with.");
    if (!userExists(email)) return setErr("No account found with that email.");
    setErr("");
    setStep(2);
  };

  const save = async (e) => {
    e.preventDefault();
    if (getRules({ email }).some((r) => !r.test(pw))) return setErr("Your password does not meet all the rules below.");
    if (pw !== pw2) return setErr("The passwords do not match.");
    setBusy(true);
    try {
      await resetPassword(email, pw);
      onDone(email.trim().toLowerCase());
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        overflowY: "auto",
        background: "rgba(0,0,0,.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        opacity: vis ? 1 : 0,
        transition: "opacity .35s ease",
        fontFamily: FONT,
        color: "#fff",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reset password"
        style={{
          width: "min(420px, 100%)",
          boxSizing: "border-box",
          padding: "28px 24px 24px",
          borderRadius: 28,
          backgroundImage: `linear-gradient(145deg, ${rgba("#ffffff", 0.16)}, ${rgba(t.deep, 0.92)})`,
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: `1px solid ${rgba("#ffffff", 0.22)}`,
          boxShadow: `0 30px 80px rgba(0,0,0,.6), 0 0 60px ${rgba(t.green, 0.35)}`,
          transform: vis ? "translateY(0) scale(1)" : "translateY(20px) scale(.97)",
          transition: "transform .45s cubic-bezier(.2,.9,.3,1)",
        }}
      >
        <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800 }}>
          {step === 1 ? "Reset your password" : "Create a new password"}
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 13.5, lineHeight: 1.5, color: t.soft }}>
          {step === 1
            ? "Enter the email address linked to your account."
            : `Choose a new password for ${email.trim().toLowerCase()}.`}
        </p>
        {err && <Msg kind="error">{err}</Msg>}
        {step === 1 ? (
          <form onSubmit={findAccount} noValidate>
            <Field icon={I.mail} label="Email address" name="reset-email" type="email" autoComplete="email" autoFocus value={email} onChange={setEmail} />
            <Btn type="submit">Continue</Btn>
          </form>
        ) : (
          <form onSubmit={save} noValidate>
            <Field
              icon={I.lock}
              label="New password"
              name="reset-pw"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              autoFocus
              value={pw}
              onChange={setPw}
              right={<EyeToggle shown={show} onToggle={() => setShow((s) => !s)} />}
            />
            <StrengthBar password={pw} />
            <RuleList password={pw} ctx={{ email }} />
            <Field icon={I.lock} label="Confirm new password" name="reset-pw2" type={show ? "text" : "password"} autoComplete="new-password" value={pw2} onChange={setPw2} />
            <Btn type="submit" busy={busy} busyText="Saving">Save new password</Btn>
          </form>
        )}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13.5 }}>
          <TextLink onClick={onClose}>Back to log in</TextLink>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ------------------------------------------------------------------ */
/*  Login page                                                         */
/* ------------------------------------------------------------------ */

function LoginPage({ notice, setNotice, prefill }) {
  const [id, setId] = useState(prefill || "");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [welcome, setWelcome] = useState(null);
  const [forgot, setForgot] = useState(false);
  const [sx, shake] = useShake();

  useEffect(() => {
    document.title = `Log in | ${BRAND}`;
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!id.trim()) errs.id = "Enter your email or phone number";
    if (!pw) errs.pw = "Enter your password";
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return shake();
    setNotice("");
    setBusy(true);
    try {
      const user = await loginUser({ identifier: id, password: pw });
      startSession(user, remember);
      setWelcome(user.name);
    } catch (x) {
      setFormError(x.message);
      shake();
    } finally {
      setBusy(false);
    }
  };

  const googleOk = (user) => {
    startSession(user, remember);
    setWelcome(user.name);
  };
  const googleFail = (m) => {
    setFormError(m);
    shake();
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <GlassCard shakeX={sx}>
        <WelcomeOverlay name={welcome} />
        <CardHeader eyebrow="Welcome home" title="Log in to your account" tagline />
        {notice && <Msg kind="ok">{notice}</Msg>}
        {formError && <Msg kind="error">{formError}</Msg>}
        <form onSubmit={submit} noValidate>
          <Field
            icon={I.user}
            label="Email or phone number"
            name="identifier"
            autoComplete="username"
            value={id}
            onChange={setId}
            error={errors.id}
          />
          <Field
            icon={I.lock}
            label="Password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={pw}
            onChange={setPw}
            error={errors.pw}
            right={<EyeToggle shown={show} onToggle={() => setShow((s) => !s)} />}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, margin: "4px 4px 22px" }}>
            <Check checked={remember} onChange={setRemember}>Remember me</Check>
            <TextLink italic onClick={() => setForgot(true)} style={{ fontSize: 14 }}>Forgot password?</TextLink>
          </div>
          <Btn type="submit" busy={busy} busyText="Signing in">Log In</Btn>
        </form>
        <Divider>or sign in with</Divider>
        <GoogleButton label="Continue with Google" onSuccess={googleOk} onError={googleFail} disabled={busy} />
        <p style={{ margin: "22px 0 0", textAlign: "center", fontSize: 14, color: "rgba(255,255,255,.85)" }}>
          New to {BRAND}? <TextLink href="#/signup">Create an account</TextLink>
        </p>
      </GlassCard>
      <FeatureChips />
      {forgot && (
        <ForgotModal
          onClose={() => setForgot(false)}
          onDone={(email) => {
            setForgot(false);
            setId(email);
            setPw("");
            setFormError("");
            setNotice("Password updated. Log in with your new password.");
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sign up page                                                       */
/* ------------------------------------------------------------------ */

function SignUpPage({ onCreated }) {
  const [v, setV] = useState({ name: "", phone: "", email: "", password: "", confirm: "", terms: false });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [welcome, setWelcome] = useState(null);
  const [sx, shake] = useShake();

  useEffect(() => {
    document.title = `Create account | ${BRAND}`;
  }, []);

  const set = (k) => (val) => setV((o) => ({ ...o, [k]: val }));
  const touch = (k) => () => setTouched((o) => ({ ...o, [k]: true }));
  const errors = validateSignup(v);
  const err = (k) => ((touched[k] || submitted) && errors[k]) || "";

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormError("");
    if (Object.keys(errors).length) return shake();
    setBusy(true);
    try {
      const user = await registerUser(v);
      onCreated(user.email);
    } catch (x) {
      setFormError(x.message);
      shake();
    } finally {
      setBusy(false);
    }
  };

  const googleOk = (user) => {
    startSession(user, true);
    setWelcome(user.name);
  };
  const googleFail = (m) => {
    setFormError(m);
    shake();
  };

  const eye = <EyeToggle shown={show} onToggle={() => setShow((s) => !s)} />;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <GlassCard shakeX={sx} width={480}>
        <WelcomeOverlay name={welcome} />
        <CardHeader eyebrow="Join the network" title="Create your account" />
        {formError && <Msg kind="error">{formError}</Msg>}
        <form onSubmit={submit} noValidate>
          <Field icon={I.user} label="Full name" name="name" autoComplete="name" value={v.name} onChange={set("name")} onBlur={touch("name")} error={err("name")} maxLength={60} />
          <Field icon={I.phone} label="Phone number" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={v.phone} onChange={set("phone")} onBlur={touch("phone")} error={err("phone")} maxLength={20} />
          <Field icon={I.mail} label="Email address" name="email" type="email" autoComplete="email" value={v.email} onChange={set("email")} onBlur={touch("email")} error={err("email")} />
          <Field icon={I.lock} label="Password" name="new-password" type={show ? "text" : "password"} autoComplete="new-password" value={v.password} onChange={set("password")} onBlur={touch("password")} error={err("password")} right={eye} maxLength={64} />
          {(v.password || touched.password || submitted) && (
            <>
              <StrengthBar password={v.password} />
              <RuleList password={v.password} ctx={v} />
            </>
          )}
          <Field icon={I.lock} label="Confirm password" name="confirm-password" type={show ? "text" : "password"} autoComplete="new-password" value={v.confirm} onChange={set("confirm")} onBlur={touch("confirm")} error={err("confirm")} maxLength={64} />
          <div style={{ margin: "2px 4px 22px" }}>
            <Check checked={v.terms} onChange={set("terms")} error={!!err("terms")}>
              I agree to the terms of service and privacy policy
            </Check>
            {err("terms") && (
              <div role="alert" style={{ color: "#ff9fb0", fontSize: 12, margin: "6px 0 0 32px" }}>{err("terms")}</div>
            )}
          </div>
          <Btn type="submit" busy={busy} busyText="Creating account">Create account</Btn>
        </form>
        <Divider>or sign up with</Divider>
        <GoogleButton label="Sign up with Google" onSuccess={googleOk} onError={googleFail} disabled={busy} />
        <p style={{ margin: "22px 0 0", textAlign: "center", fontSize: 14, color: "rgba(255,255,255,.85)" }}>
          Already have an account? <TextLink href="#/login">Log in</TextLink>
        </p>
      </GlassCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shell: image carousel background and controls                      */
/* ------------------------------------------------------------------ */

function GlowIcon({ onClick, label, children }) {
  const t = useTheme();
  const [hover, bind] = useHover();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      {...bind}
      style={{
        width: 38,
        height: 38,
        flexShrink: 0,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: hover ? t.deep : "#fff",
        backgroundImage: hover ? `linear-gradient(135deg, ${t.green}, ${t.mint})` : "none",
        backgroundColor: hover ? "transparent" : rgba("#ffffff", 0.1),
        border: `1px solid ${rgba("#ffffff", hover ? 0.6 : 0.25)}`,
        boxShadow: `0 0 ${hover ? 22 : 0}px ${rgba(t.green, 0.85)}`,
        transform: hover ? "scale(1.1)" : "scale(1)",
        cursor: "pointer",
        transition: "all .3s ease",
        outline: "none",
      }}
    >
      {children}
    </button>
  );
}

function Dot({ active, onClick, label }) {
  const t = useTheme();
  const [hover, bind] = useHover();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active}
      {...bind}
      style={{
        width: active ? 26 : 9,
        height: 9,
        padding: 0,
        borderRadius: 5,
        border: "none",
        cursor: "pointer",
        background: active ? t.mint : rgba("#ffffff", hover ? 0.85 : 0.4),
        boxShadow: `0 0 ${active || hover ? 12 : 0}px ${rgba(active ? t.mint : t.green, 0.9)}`,
        transition: "all .35s ease",
        outline: "none",
      }}
    />
  );
}

function Shell({ children }) {
  const reduced = useReducedMotion();
  const w = useWidth();
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.background = "#000";

    if (!document.getElementById("pl-font")) {
      const l = document.createElement("link");
      l.id = "pl-font";
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(l);
    }

    /* Autofill styling: keep inputs transparent with white text and
       fire an animation so Field can detect browser autofill. */
    if (!document.getElementById("pl-autofill")) {
      const s = document.createElement("style");
      s.id = "pl-autofill";
      s.textContent = `
        @keyframes pl-autofill-start { from { opacity: 1; } to { opacity: 1; } }
        input:-webkit-autofill {
          animation-name: pl-autofill-start;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff;
          transition: background-color 99999s ease-in-out 0s;
          -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
        }
        input:autofill {
          animation-name: pl-autofill-start;
        }
      `;
      document.head.appendChild(s);
    }

    SLIDES.forEach((src) => {
      const im = new Image();
      im.onerror = () => console.warn("Carousel image not found:", src);
      im.src = src;
    });
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setSlide((s) => (s + 1) % SLIDES.length), SLIDE_MS);
    return () => clearTimeout(id);
  }, [slide]);

  const go = (d) => setSlide((s) => (s + d + SLIDES.length) % SLIDES.length);

  return (
    <ThemeCtx.Provider value={THEME}>
      <div
        style={{ position: "relative", minHeight: "100vh", background: "#000", color: "#fff", fontFamily: FONT, overflowX: "hidden" }}
      >
        {/* Background carousel: images only */}
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", background: "#000" }}>
          {SLIDES.map((src, i) => {
            const active = i === slide;
            return (
              <div
                key={src}
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url("${src}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  opacity: active ? 1 : 0,
                  transform: active && !reduced ? "scale(1.12)" : "scale(1)",
                  transition: `opacity 1.6s ease-in-out, transform ${active ? SLIDE_MS + 1600 : 1600}ms linear`,
                }}
              />
            );
          })}
          {/* Neutral dark shade so text stays readable (no colour tint) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "linear-gradient(180deg, rgba(0,0,0,.45), rgba(0,0,0,.65))",
            }}
          />
        </div>

        {/* Page content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            minHeight: "100vh",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: `48px 16px ${w < 600 ? 150 : 130}px`,
          }}
        >
          {children}
        </div>

        {/* Carousel controls */}
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 16,
            transform: "translateX(-50%)",
            zIndex: 6,
            width: "min(560px, calc(100% - 24px))",
            boxSizing: "border-box",
            padding: "12px 14px 14px",
            borderRadius: 26,
            background: "rgba(0,0,0,.5)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: `1px solid ${rgba("#ffffff", 0.2)}`,
            boxShadow: `0 10px 40px rgba(0,0,0,.4), 0 0 30px ${rgba(THEME.green, 0.28)}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <GlowIcon label="Previous image" onClick={() => go(-1)}>
              <I.left size={18} stroke={2.5} />
            </GlowIcon>
            <div style={{ position: "relative", flex: 1, height: 40 }}>
              {CAPTIONS.map((c, i) => (
                <div
                  key={c}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    fontSize: w < 480 ? 12 : 13.5,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    opacity: i === slide ? 1 : 0,
                    transform: i === slide ? "translateY(0)" : "translateY(8px)",
                    transition: "opacity .8s ease, transform .8s ease",
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
            <GlowIcon label="Next image" onClick={() => go(1)}>
              <I.right size={18} stroke={2.5} />
            </GlowIcon>
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 10 }}>
            {SLIDES.map((s, i) => (
              <Dot key={s} active={i === slide} label={`Show image ${i + 1}`} onClick={() => setSlide(i)} />
            ))}
          </div>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Root                                                               */
/* ------------------------------------------------------------------ */

export default function AuthPages() {
  const route = useRoute();
  const [notice, setNotice] = useState("");
  const [prefill, setPrefill] = useState("");

  return (
    <Shell>
      {route === "/signup" ? (
        <SignUpPage
          onCreated={(email) => {
            setPrefill(email);
            setNotice("Your account is ready. Log in to continue.");
            navigate("/login");
          }}
        />
      ) : (
        <LoginPage notice={notice} setNotice={setNotice} prefill={prefill} />
      )}
    </Shell>
  );
}