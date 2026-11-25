import { useEffect, useMemo, useState } from "react";

const CART_EVENT = "pharmalink:cart-updated";
const ACTIVE_ACCOUNT_KEY = "pharmalink_active_cart_account_v1";
const ANONYMOUS_ACCOUNT = "signed-in";

function identityFor(user) {
  const identity = user?.id || user?.email || user?.username;
  if (identity) return String(identity).trim().toLowerCase();
  try { return sessionStorage.getItem(ACTIVE_ACCOUNT_KEY) || ANONYMOUS_ACCOUNT; }
  catch { return ANONYMOUS_ACCOUNT; }
}

export function accountCartKey(user) {
  return `pharmalink_cart_${encodeURIComponent(identityFor(user))}`;
}

export function readCart(user) {
  try {
    const value = JSON.parse(localStorage.getItem(accountCartKey(user)) || "[]");
    if (!Array.isArray(value)) return [];
    const migrated = [];
    for (const raw of value) {
      if (!raw || typeof raw.name !== "string" || !Number.isFinite(Number(raw.price))) continue;
      const item = {
        ...raw,
        id: stableItemId(raw),
        form: String(raw.form || raw.detail || ""),
        category: String(raw.category || "Medicine"),
        price: Math.max(0, Number(raw.price) || 0),
        pharmacy: String(raw.pharmacy || "Sample pharmacy"),
        quantity: Math.max(1, Math.min(999, Math.floor(Number(raw.quantity) || 1))),
      };
      const existing = migrated.find((entry) => entry.id === item.id);
      if (existing) existing.quantity = Math.min(999, existing.quantity + item.quantity);
      else migrated.push(item);
    }
    return migrated;
  } catch { return []; }
}

function writeCart(user, items) {
  try {
    const key = accountCartKey(user);
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { key } }));
    return items;
  } catch { return readCart(user); }
}

function stableItemId(product) {
  const name = String(product.name || "Medicine").trim().toLowerCase();
  const form = String(product.form || product.detail || "").trim().toLowerCase();
  const pharmacy = String(product.pharmacy || "Sample pharmacy").trim().toLowerCase();
  return `medicine:${encodeURIComponent(`${name}|${form}|${pharmacy}`)}`;
}

export function addCartItem(user, product) {
  if (!product || !product.name) return readCart(user);
  const normalized = {
    id: stableItemId(product),
    catalogId: String(product.id || ""),
    name: String(product.name),
    form: String(product.form || product.detail || ""),
    category: String(product.category || "Medicine"),
    price: Math.max(0, Number(product.price) || 0),
    pharmacy: String(product.pharmacy || "Sample pharmacy"),
    area: String(product.area || ""),
    icon: String(product.icon || "✚"),
    description: String(product.description || ""),
    stock: String(product.stock || ""),
    rx: Boolean(product.rx),
    quantity: 1,
  };
  const cart = readCart(user);
  const existing = cart.find((item) => item.id === normalized.id);
  if (existing) {
    return writeCart(user, cart.map((item) => item.id === normalized.id
      ? { ...item, quantity: Math.max(1, Number(item.quantity) || 1) + 1 }
      : item));
  }
  return writeCart(user, [...cart, normalized]);
}

export function setCartQuantity(user, id, pharmacy, quantity) {
  const nextQuantity = Math.max(1, Math.min(999, Math.floor(Number(quantity) || 1)));
  return writeCart(user, readCart(user).map((item) => item.id === id && item.pharmacy === pharmacy ? { ...item, quantity: nextQuantity } : item));
}

export function removeCartItem(user, id, pharmacy) {
  return writeCart(user, readCart(user).filter((item) => !(item.id === id && item.pharmacy === pharmacy)));
}

export function clearCart(user) { return writeCart(user, []); }

export function subscribeToCart(user, callback) {
  const key = accountCartKey(user);
  const handleCart = (event) => { if (!event.detail || event.detail.key === key) callback(); };
  const handleStorage = (event) => { if (event.key === key) callback(); };
  window.addEventListener(CART_EVENT, handleCart);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CART_EVENT, handleCart);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useCart(user) {
  const [items, setItems] = useState(() => readCart(user));
  useEffect(() => {
    const identity = user?.id || user?.email || user?.username;
    if (identity) {
      try { sessionStorage.setItem(ACTIVE_ACCOUNT_KEY, String(identity).trim().toLowerCase()); } catch { /* storage unavailable */ }
    }
    setItems(readCart(user));
    return subscribeToCart(user, () => setItems(readCart(user)));
  }, [user?.id, user?.email, user?.username]);
  return { items, count: items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0), add: (product) => addCartItem(user, product) };
}

export function CartLink({ user, onNavigate, className = "", label = "View cart" }) {
  const { count } = useCart(user);
  const goToCart = () => {
    if (onNavigate) onNavigate("cart");
    else if (typeof window !== "undefined") window.location.hash = "#/cart";
  };
  return <button type="button" className={className} onClick={goToCart} style={{ fontFamily: "inherit", cursor: "pointer" }} aria-label={`${label}, ${count} selected item${count === 1 ? "" : "s"}`}>
    {label}<span aria-live="polite" style={{ marginLeft: 7, minWidth: 20, display: "inline-grid", placeItems: "center", padding: "2px 6px", borderRadius: 99, background: "#e5f6eb", color: "#137b43", fontWeight: 900 }}>{count}</span>
  </button>;
}

const css = `
  .cart-page,.cart-page *{box-sizing:border-box}
  .cart-page{min-height:76vh;padding:32px 0 72px;background:linear-gradient(180deg,#f3faf5 0,#fff 360px);color:#17291d;font-family:'DM Sans','Segoe UI',system-ui,sans-serif;overflow:clip}
  .cart-wrap{width:min(1100px,calc(100% - 44px));margin:auto}
  .cart-hero{position:relative;isolation:isolate;overflow:hidden;padding:clamp(25px,4vw,40px);border:1px solid #ffffff42;border-radius:23px;background:radial-gradient(circle at 87% 9%,#a0f0bd4a,transparent 27%),linear-gradient(115deg,#103923,#0d633a 66%,#168e50);color:#fff;box-shadow:0 18px 40px #0e46231b;animation:cart-rise .45s ease both}
  .cart-hero:after{content:'▣';position:absolute;z-index:-1;right:8%;top:50%;transform:translateY(-50%) rotate(-7deg);width:104px;height:104px;display:grid;place-items:center;border:1px solid #ffffff3a;border-radius:29px;background:#ffffff16;color:#e4ffed;font-size:48px;text-shadow:0 0 24px #a3f2c5;box-shadow:inset 0 1px #ffffff38,0 14px 30px #062c1930;backdrop-filter:blur(12px)}
  .cart-kicker{color:#dcf8e4;font-size:10px;font-weight:900;letter-spacing:.14em}.cart-hero h1{max-width:700px;margin:10px 0 8px;color:#fff;font-size:clamp(31px,5vw,44px);line-height:1.05;letter-spacing:-.05em}.cart-hero p{max-width:680px;margin:0;color:#d5efdd;font-size:12px;line-height:1.75}
  .cart-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;align-items:start;gap:16px;margin-top:20px}.cart-list{display:grid;gap:10px}.cart-item{display:grid;grid-template-columns:56px minmax(0,1fr) auto;align-items:center;gap:13px;padding:14px;border:1px solid #e3ece5;border-radius:17px;background:linear-gradient(145deg,#ffffffed,#f8fcf9);box-shadow:0 7px 19px #102d1908;animation:cart-rise .34s ease both;transition:transform .18s,border-color .18s,box-shadow .18s}.cart-item:hover{transform:translateY(-2px);border-color:#b7dec2;box-shadow:0 12px 26px #102d1910}.cart-item-icon{width:55px;height:55px;display:grid;place-items:center;border:1px solid #d9ecdf;border-radius:17px;background:linear-gradient(145deg,#effaf2,#e3f5e9);color:#178249;font-size:25px}.cart-item-main{min-width:0}.cart-item-main h2{margin:0;color:#203126;font-size:13px;font-weight:900}.cart-item-main p{margin:4px 0 0;color:#76837a;font-size:10px;line-height:1.55}.cart-sample{display:inline-block;margin-top:6px;padding:4px 7px;border:1px solid #f0e2c2;border-radius:7px;background:#fffbf1;color:#826d40;font-size:8px;font-weight:850}.cart-item-controls{display:flex;align-items:center;justify-content:flex-end;gap:7px}.cart-line-price{min-width:72px;color:#183723;text-align:right;font-size:12px;font-weight:900}.cart-line-price small{display:block;margin-top:3px;color:#849087;font-size:8px;font-weight:600}.cart-qty{display:flex;align-items:center;gap:6px;padding:4px;border:1px solid #e0eae2;border-radius:11px;background:#fff}.cart-qty button{width:25px;height:25px;border:1px solid #dfebe1;border-radius:8px;background:#f6fbf7;color:#187c45;font-size:15px;font-weight:800;cursor:pointer;transition:background .16s,transform .16s}.cart-qty button:hover{transform:scale(1.05);background:#e1f4e7}.cart-qty span{min-width:17px;color:#35483b;text-align:center;font-size:10px;font-weight:850}.cart-remove{width:30px;height:30px;border:1px solid #f0d9d7;border-radius:9px;background:#fff8f7;color:#ab514b;font-size:14px;cursor:pointer;transition:background .16s,transform .16s}.cart-remove:hover{transform:scale(1.05);background:#ffe9e6}.cart-summary{position:sticky;top:88px;padding:17px;border:1px solid #e1ebe3;border-radius:17px;background:linear-gradient(145deg,#ffffffed,#f5faf6);box-shadow:0 9px 24px #102d1909}.cart-summary h2{margin:0 0 13px;color:#203126;font-size:14px}.cart-summary-row{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid #edf1ed;color:#758178;font-size:10px}.cart-summary-row strong{color:#294131}.cart-total{display:flex;justify-content:space-between;gap:10px;padding:13px 0 4px;border-top:1px solid #dfe9e2;color:#1c3925;font-size:12px;font-weight:900}.cart-total strong{font-size:15px}.cart-disclaimer{margin:11px 0 0;padding:10px;border:1px solid #f0e2c2;border-radius:11px;background:#fffbf1;color:#756642;font-size:9px;line-height:1.7}.cart-continue,.cart-clear{width:100%;min-height:39px;margin-top:10px;padding:9px 12px;border:1px solid #159b58;border-radius:11px;background:#159b58;color:#fff;font-size:10px;font-weight:850;cursor:pointer;transition:transform .18s,box-shadow .18s,background .18s}.cart-continue:hover{transform:translateY(-1px);background:#0e8047;box-shadow:0 7px 16px #159b5832}.cart-clear{border-color:#e1eae3;background:#fff;color:#597061}.cart-clear:hover{background:#f3f8f4}.cart-empty{padding:30px 22px;border:1px dashed #c7d9cc;border-radius:18px;background:#ffffffbc;text-align:center;animation:cart-rise .35s ease both}.cart-empty-icon{width:59px;height:59px;margin:0 auto 13px;display:grid;place-items:center;border:1px solid #d9ecdf;border-radius:20px;background:#eff9f2;color:#18834a;font-size:25px}.cart-empty h2{margin:0;color:#203126;font-size:17px}.cart-empty p{max-width:400px;margin:8px auto 14px;color:#748178;font-size:11px;line-height:1.75}.cart-empty button{padding:10px 14px;border:1px solid #159b58;border-radius:10px;background:#159b58;color:#fff;font-size:10px;font-weight:850;cursor:pointer;transition:transform .18s,background .18s}.cart-empty button:hover{transform:translateY(-1px);background:#0e8047}.cart-note{margin-top:15px;color:#87938a;font-size:9px;line-height:1.7}
  @keyframes cart-rise{from{opacity:0;transform:translateY(11px)}to{opacity:1;transform:translateY(0)}}
  @media(max-width:800px){.cart-layout{grid-template-columns:1fr}.cart-summary{position:static}.cart-summary-inner{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}.cart-summary h2,.cart-total,.cart-disclaimer,.cart-continue,.cart-clear{grid-column:1/-1}}
  @media(max-width:560px){.cart-wrap{width:calc(100% - 28px)}.cart-hero{padding:23px 18px}.cart-hero:after{top:auto;right:12px;bottom:11px;transform:rotate(-7deg);width:57px;height:57px;font-size:27px;opacity:.76}.cart-hero h1{font-size:32px}.cart-hero p{max-width:88%;font-size:11px}.cart-item{grid-template-columns:43px minmax(0,1fr);gap:10px;padding:11px}.cart-item-icon{width:43px;height:43px;border-radius:14px;font-size:19px}.cart-item-main h2{font-size:11px}.cart-item-main p{font-size:9px}.cart-item-controls{grid-column:2;justify-content:space-between}.cart-line-price{text-align:left}.cart-summary-inner{display:block}.cart-summary h2,.cart-total,.cart-disclaimer,.cart-continue,.cart-clear{grid-column:auto}}
  .cart-modal-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:18px;background:#07180ecc;backdrop-filter:blur(5px);overflow:auto}
  .cart-checkout-modal{position:relative;width:min(100%,480px);max-height:calc(100vh - 36px);overflow:auto;padding:25px;border:1px solid #dfeae2;border-radius:20px;background:#fff;box-shadow:0 24px 70px #0004;animation:cart-rise .25s ease both}
  .cart-checkout-modal h2{margin:8px 0;color:#203126;font-size:22px;letter-spacing:-.03em}
  .cart-checkout-modal>p{color:#748178;font-size:11px;line-height:1.7}
  .cart-modal-close{position:absolute;top:12px;right:12px;width:32px;height:32px;border:1px solid #e4ece5;border-radius:10px;background:#f7fbf8;color:#4e6656;font-size:20px;cursor:pointer}
  .cart-modal-total{display:flex;justify-content:space-between;align-items:center;margin:15px 0;padding:13px;border:1px solid #dcebe0;border-radius:12px;background:#f4faf5;color:#5f7464;font-size:12px}
  .cart-modal-total strong{color:#163d25;font-size:18px}
  .cart-checkout-modal label{display:block;margin:12px 0 6px;color:#35483b;font-size:11px;font-weight:800}
  .cart-checkout-modal input{width:100%;padding:12px;border:1px solid #d9e6dc;border-radius:10px;background:#fff;color:#203126;font:inherit;font-size:13px;outline:none}
  .cart-checkout-modal input:focus{border-color:#159b58;box-shadow:0 0 0 3px #159b5818}
  .cart-checkout-error{margin:8px 0;color:#b0443d!important;font-weight:700}
  .cart-demo-warning{margin:12px 0 0!important;padding:9px;border:1px solid #f0e2c2;border-radius:9px;background:#fffbf1;color:#806c40!important;text-align:center;font-size:9px!important;font-weight:900;letter-spacing:.04em}
  .cart-success-mark{width:48px;height:48px;display:grid;place-items:center;margin:0 auto 10px;border-radius:50%;background:#e6f7ed;color:#14834a;font-size:25px;font-weight:900}
  .cart-receipt-modal{text-align:center}
  .cart-receipt-lead{padding:10px;border-radius:10px;background:#fffbf1;color:#806c40!important}
  .cart-receipt-reference{margin:14px 0;padding:14px;border:1px dashed #9ed2ad;border-radius:12px;background:#f3faf5}
  .cart-receipt-reference span{display:block;color:#68806f;font-size:9px;font-weight:900;letter-spacing:.12em}
  .cart-receipt-reference strong{display:block;margin-top:6px;color:#117a42;font-size:20px;letter-spacing:.04em}
  .cart-receipt-modal .cart-summary-row,.cart-receipt-modal .cart-total{text-align:left}
  .cart-receipt-items{margin:12px 0;padding:10px;border:1px solid #edf1ed;border-radius:10px;text-align:left}
  .cart-receipt-items div{display:flex;justify-content:space-between;gap:10px;padding:7px 0;color:#68766d;font-size:10px;border-bottom:1px solid #edf1ed}
  .cart-receipt-items div:last-child{border-bottom:0}
  .cart-receipt-items strong{color:#294131;white-space:nowrap}
  @media(max-width:800px){.cart-layout{grid-template-columns:1fr}.cart-summary{position:static}.cart-summary-inner{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}.cart-summary h2,.cart-total,.cart-disclaimer,.cart-continue,.cart-clear{grid-column:1/-1}}
  @media(max-width:560px){.cart-wrap{width:calc(100% - 28px)}.cart-hero{padding:23px 18px}.cart-hero:after{top:auto;right:12px;bottom:11px;transform:rotate(-7deg);width:57px;height:57px;font-size:27px;opacity:.76}.cart-hero h1{font-size:32px}.cart-hero p{max-width:88%;font-size:11px}.cart-item{grid-template-columns:43px minmax(0,1fr);gap:10px;padding:11px}.cart-item-icon{width:43px;height:43px;border-radius:14px;font-size:19px}.cart-item-main h2{font-size:11px}.cart-item-main p{font-size:9px}.cart-item-controls{grid-column:2;justify-content:space-between}.cart-line-price{text-align:left}.cart-summary-inner{display:block}.cart-summary h2,.cart-total,.cart-disclaimer,.cart-continue,.cart-clear{grid-column:auto}.cart-checkout-modal{padding:21px 17px}}
  @media(prefers-reduced-motion:reduce){.cart-page *,.cart-page *:before,.cart-page *:after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
`;

function money(value) {
  return `KES ${Number(value || 0).toLocaleString("en-KE")}`;
}

export default function Cart({ user, onNavigate }) {
  const [items, setItems] = useState(() => readCart(user));
  const [confirmClear, setConfirmClear] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    setItems(readCart(user));
    return subscribeToCart(user, () => setItems(readCart(user)));
  }, [user]);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0), [items]);
  const total = useMemo(() => items.reduce((sum, item) => sum + (Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1), 0), [items]);

  function changeQuantity(item, amount) {
    const next = Math.max(1, Number(item.quantity || 1) + amount);
    setItems(setCartQuantity(user, item.id, item.pharmacy, next));
  }

  function deleteItem(item) {
    setItems(removeCartItem(user, item.id, item.pharmacy));
  }

  function emptyCart() {
    setItems(clearCart(user));
    setConfirmClear(false);
  }

  function normalizeKenyanPhone(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
    if (/^254[17]\d{8}$/.test(digits)) return digits;
    if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
    return null;
  }

  function simulateCheckout(event) {
    event.preventDefault();
    setCheckoutError("");

    const normalizedPhone = normalizeKenyanPhone(checkoutPhone);
    if (!normalizedPhone) {
      setCheckoutError("Enter a valid Kenyan mobile number (e.g. 0712345678 or 254712345678).");
      return;
    }
    if (!items.length) {
      setCheckoutError("Your cart is empty. Add medicines before checkout.");
      return;
    }

    const orderReference = `TEST-PH-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const purchasedItems = items.map((item) => ({
      ...item,
      quantity: Math.max(1, Number(item.quantity) || 1),
      lineTotal: (Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1),
    }));

    setReceipt({
      reference: orderReference,
      phone: `+${normalizedPhone}`,
      createdAt: new Date().toLocaleString("en-KE"),
      items: purchasedItems,
      total,
    });

    // This is a frontend-only demonstration; no payment or order is sent to a server.
    setItems(clearCart(user));
    setCheckoutOpen(false);
    setCheckoutPhone("");
    setCheckoutError("");
  }

  return (
    <main className="cart-page">
      <style>{css}</style>
      <div className="cart-wrap">
        <header className="cart-hero">
          <span className="cart-kicker">YOUR PHARMALINK CART</span>
          <h1>Medicines you’ve added.</h1>
          <p>Every medicine selected from the Home and Find Medicine cards is collected here, grouped by product and pharmacy. Adjust quantities, remove individual selections, or continue browsing. Items remain local to this browser/account.</p>
        </header>

        <div className="cart-layout">
          <section className="cart-list" aria-label="Items in your cart" aria-live="polite">
            {items.length ? items.map((item, index) => (
              <article className="cart-item" key={`${item.id}-${item.pharmacy}`} style={{ animationDelay: `${Math.min(index * 45, 200)}ms` }}>
                <span className="cart-item-icon" aria-hidden="true">{item.icon || "✚"}</span>
                <div className="cart-item-main"><h2>{item.name}</h2><p>{item.form}{item.category ? ` · ${item.category}` : ""}<br/><strong>{item.pharmacy}</strong>{item.area ? ` · ${item.area}` : ""}{item.stock ? <><br/>Sample availability: {item.stock}</> : null}{item.rx ? <><br/>Prescription flag: sample only</> : null}</p>{item.description && <p style={{ marginTop: 7, padding: "7px 9px", borderLeft: "2px solid #b7dec2", background: "#f4faf5", color: "#617267", borderRadius: "0 8px 8px 0" }}>{item.description}</p>}<span className="cart-sample">SAMPLE LISTING · NOT PURCHASED</span></div>
                <div className="cart-item-controls">
                  <span className="cart-line-price">{money(Number(item.price) * Number(item.quantity || 1))}<small>{money(item.price)} each</small></span>
                  <div className="cart-qty" aria-label={`Quantity for ${item.name}`}><button type="button" aria-label={`Remove one ${item.name}`} onClick={() => changeQuantity(item, -1)}>−</button><span aria-live="polite">{item.quantity || 1}</span><button type="button" aria-label={`Add one ${item.name}`} onClick={() => changeQuantity(item, 1)}>+</button></div>
                  <button className="cart-remove" type="button" aria-label={`Remove ${item.name} from cart`} title="Remove item" onClick={() => deleteItem(item)}>×</button>
                </div>
              </article>
            )) : (
              <div className="cart-empty"><span className="cart-empty-icon" aria-hidden="true">▣</span><h2>Your cart is empty</h2><p>Add a medicine from the sample catalogue using its + button. Your selected items will appear here.</p><button type="button" onClick={() => onNavigate?.("find")}>Browse medicines →</button></div>
            )}
          </section>

          <aside className="cart-summary" aria-label="Cart summary">
            <h2>Cart summary</h2>
            <div className="cart-summary-inner">
              <div className="cart-summary-row"><span>Selected items</span><strong>{itemCount}</strong></div>
              <div className="cart-summary-row"><span>Distinct medicines</span><strong>{items.length}</strong></div>
              <div className="cart-summary-row"><span>Different pharmacy listings</span><strong>{new Set(items.map((item) => item.pharmacy)).size}</strong></div>
              <div className="cart-total"><span>Sample subtotal</span><strong>{money(total)}</strong></div>
              <p className="cart-disclaimer">Demo prices only. Checkout is a simulated payment experience; no real M-Pesa payment or order is created yet. Confirm medicine price, stock and prescription requirements with a licensed pharmacy.</p>
              <button className="cart-continue" type="button" onClick={() => onNavigate?.("find")}>Continue browsing</button>
              {items.length > 0 && <button className="cart-continue" type="button" style={{ background: "#0e633a", borderColor: "#0e633a" }} onClick={() => { setCheckoutError(""); setCheckoutOpen(true); }}>Proceed to checkout</button>}
              {items.length > 0 && <button className="cart-clear" type="button" onClick={() => setConfirmClear(true)}>{confirmClear ? "Confirm clear cart" : "Clear cart"}</button>}
              {confirmClear && <button className="cart-clear" type="button" onClick={() => setConfirmClear(false)}>Keep my items</button>}
              {confirmClear && <button className="cart-clear" type="button" style={{borderColor:'#ebc7c4',color:'#9d4842'}} onClick={emptyCart}>Yes, clear all items</button>}
            </div>
          </aside>
        </div>
        {checkoutOpen && (
          <div className="cart-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setCheckoutOpen(false); }}>
            <section className="cart-checkout-modal" role="dialog" aria-modal="true" aria-labelledby="cart-checkout-title">
              <button type="button" className="cart-modal-close" aria-label="Close checkout" onClick={() => setCheckoutOpen(false)}>×</button>
              <span className="cart-kicker" style={{ color: "#16834a" }}>DEMO CHECKOUT</span>
              <h2 id="cart-checkout-title">Simulated M-Pesa payment</h2>
              <p>Enter the phone number you would use for M-Pesa. This demonstration will not send an STK prompt, charge money, or ask for your real M-Pesa PIN.</p>
              <div className="cart-modal-total"><span>Demo total</span><strong>{money(total)}</strong></div>
              <form onSubmit={simulateCheckout}>
                <label htmlFor="cart-checkout-phone">M-Pesa phone number</label>
                <input id="cart-checkout-phone" type="tel" autoComplete="tel" placeholder="0712345678" value={checkoutPhone} onChange={(event) => setCheckoutPhone(event.target.value)} />
                {checkoutError && <p className="cart-checkout-error" role="alert">{checkoutError}</p>}
                <button className="cart-continue" type="submit">Simulate payment &amp; confirm demo order</button>
                <button className="cart-clear" type="button" onClick={() => setCheckoutOpen(false)}>Go back to cart</button>
              </form>
              <p className="cart-demo-warning">DEMO ONLY · No real payment · No order saved to Neon yet</p>
            </section>
          </div>
        )}

        {receipt && (
          <div className="cart-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setReceipt(null); }}>
            <section className="cart-checkout-modal cart-receipt-modal" role="dialog" aria-modal="true" aria-labelledby="cart-receipt-title">
              <span className="cart-success-mark" aria-hidden="true">✓</span>
              <h2 id="cart-receipt-title">Demo checkout complete!</h2>
              <p className="cart-receipt-lead">This is a simulated confirmation only. No money was charged and the order was not saved to the database.</p>
              <div className="cart-receipt-reference"><span>DEMO REFERENCE</span><strong>{receipt.reference}</strong></div>
              <div className="cart-summary-row"><span>Phone</span><strong>{receipt.phone}</strong></div>
              <div className="cart-summary-row"><span>Date</span><strong>{receipt.createdAt}</strong></div>
              <div className="cart-summary-row"><span>Items</span><strong>{receipt.items.reduce((n, item) => n + item.quantity, 0)}</strong></div>
              <div className="cart-total"><span>Demo total</span><strong>{money(receipt.total)}</strong></div>
              <div className="cart-receipt-items">
                {receipt.items.map((item) => <div key={`${item.id}-${item.pharmacy}`}><span>{item.name} × {item.quantity}</span><strong>{money(item.lineTotal)}</strong></div>)}
              </div>
              <button className="cart-continue" type="button" onClick={() => { setReceipt(null); onNavigate?.("find"); }}>Continue browsing</button>
              <button className="cart-clear" type="button" onClick={() => setReceipt(null)}>Close receipt</button>
            </section>
          </div>
        )}

        <p className="cart-note">Cart contents are stored in this browser under the current signed-in account. The demo checkout does not send orders or payments to a server or Neon database.</p>
      </div>
    </main>
  );
}
