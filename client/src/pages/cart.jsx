import { useEffect, useMemo, useState } from "react";

const CART_EVENT = "pharmalink:cart-updated";

function accountCartKey(user) {
  const identity = user?.id || user?.email || user?.username || "signed-in";
  return `pharmalink_cart_${encodeURIComponent(String(identity).trim().toLowerCase())}`;
}

export function readCart(user) {
  try {
    const value = JSON.parse(localStorage.getItem(accountCartKey(user)) || "[]");
    return Array.isArray(value) ? value.filter((item) => item && typeof item.id === "string" && typeof item.name === "string" && Number.isFinite(Number(item.price))) : [];
  } catch {
    return [];
  }
}

function writeCart(user, items) {
  try {
    localStorage.setItem(accountCartKey(user), JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { key: accountCartKey(user) } }));
    return items;
  } catch {
    return readCart(user);
  }
}

export function addCartItem(user, product) {
  const normalized = {
    id: String(product.id),
    name: String(product.name),
    form: String(product.form || product.detail || ""),
    category: String(product.category || "Medicine"),
    price: Number(product.price) || 0,
    pharmacy: String(product.pharmacy || "Sample pharmacy"),
    area: String(product.area || ""),
    icon: String(product.icon || "✚"),
    quantity: 1,
  };
  const cart = readCart(user);
  const existing = cart.find((item) => item.id === normalized.id && item.pharmacy === normalized.pharmacy);
  if (existing) {
    return writeCart(user, cart.map((item) => item === existing ? { ...item, quantity: Math.max(1, Number(item.quantity) || 1) + 1 } : item));
  }
  return writeCart(user, [...cart, normalized]);
}

export function setCartQuantity(user, id, pharmacy, quantity) {
  const nextQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
  return writeCart(user, readCart(user).map((item) => item.id === id && item.pharmacy === pharmacy ? { ...item, quantity: nextQuantity } : item));
}

export function removeCartItem(user, id, pharmacy) {
  return writeCart(user, readCart(user).filter((item) => !(item.id === id && item.pharmacy === pharmacy)));
}

export function clearCart(user) {
  return writeCart(user, []);
}

export function subscribeToCart(user, callback) {
  const key = accountCartKey(user);
  const handleCart = (event) => {
    if (!event.detail || event.detail.key === key) callback();
  };
  const handleStorage = (event) => {
    if (event.key === key) callback();
  };
  window.addEventListener(CART_EVENT, handleCart);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CART_EVENT, handleCart);
    window.removeEventListener("storage", handleStorage);
  };
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
  @media(prefers-reduced-motion:reduce){.cart-page *,.cart-page *:before,.cart-page *:after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
`;

function money(value) {
  return `KES ${Number(value || 0).toLocaleString("en-KE")}`;
}

export default function Cart({ user, onNavigate }) {
  const [items, setItems] = useState(() => readCart(user));
  const [confirmClear, setConfirmClear] = useState(false);

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

  return (
    <main className="cart-page">
      <style>{css}</style>
      <div className="cart-wrap">
        <header className="cart-hero">
          <span className="cart-kicker">YOUR PHARMALINK CART</span>
          <h1>Medicines you’ve added.</h1>
          <p>Review the sample medicine items you selected while browsing. They stay in this browser for your signed-in account.</p>
        </header>

        <div className="cart-layout">
          <section className="cart-list" aria-label="Items in your cart" aria-live="polite">
            {items.length ? items.map((item, index) => (
              <article className="cart-item" key={`${item.id}-${item.pharmacy}`} style={{ animationDelay: `${Math.min(index * 45, 200)}ms` }}>
                <span className="cart-item-icon" aria-hidden="true">{item.icon || "✚"}</span>
                <div className="cart-item-main"><h2>{item.name}</h2><p>{item.form}{item.category ? ` · ${item.category}` : ""}<br/>{item.pharmacy}{item.area ? ` · ${item.area}` : ""}</p><span className="cart-sample">SAMPLE LISTING · NOT PURCHASED</span></div>
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
              <div className="cart-summary-row"><span>Pharmacy listings</span><strong>{new Set(items.map((item) => item.pharmacy)).size}</strong></div>
              <div className="cart-total"><span>Sample subtotal</span><strong>{money(total)}</strong></div>
              <p className="cart-disclaimer">Sample prices only—not a purchase total. This frontend does not place orders or process payment. Confirm price, stock and prescription requirements directly with a licensed pharmacy.</p>
              <button className="cart-continue" type="button" onClick={() => onNavigate?.("find")}>Continue browsing</button>
              {items.length > 0 && <button className="cart-clear" type="button" onClick={() => setConfirmClear(true)}>{confirmClear ? "Confirm clear cart" : "Clear cart"}</button>}
              {confirmClear && <button className="cart-clear" type="button" onClick={() => setConfirmClear(false)}>Keep my items</button>}
              {confirmClear && <button className="cart-clear" type="button" style={{borderColor:'#ebc7c4',color:'#9d4842'}} onClick={emptyCart}>Yes, clear all items</button>}
            </div>
          </aside>
        </div>
        <p className="cart-note">Cart contents are stored in this browser under the current signed-in account. They are not purchase records and are not sent to a pharmacy or server.</p>
      </div>
    </main>
  );
}
