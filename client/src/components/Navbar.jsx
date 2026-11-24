import { useEffect, useState } from "react";
import { readCart, subscribeToCart } from "../pages/cart";

const LINKS = [
  ["Home", "home"],
  ["Find medicine", "find"],
  ["Pharmacies", "pharmacies"],
  ["How it works", "how"],
  ["For pharmacies", "restock"],
  ["FAQ", "faq"],
  ["Cart", "cart"],
];

export default function Navbar({ user, onLogout, onNavigate, activeRoute }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = (user?.name || user?.email || "Account").split(/[ @]/)[0];
  const [cartCount, setCartCount] = useState(() => readCart(user).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0));

  useEffect(() => subscribeToCart(user, () => setCartCount(readCart(user).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0))), [user]);

  function goToSection(id) {
    setMenuOpen(false);
    if (onNavigate) {
      onNavigate(id);
      return;
    }
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function isActive(id) {
    return activeRoute === `/${id}`;
  }

  return (
    <>
      <style>{`
        .pl-navbar, .pl-navbar * { box-sizing: border-box; }
        .pl-navbar {
          --pl-green: #20c77a;
          --pl-mint: #a3f2c5;
          position: sticky; top: 0; z-index: 100;
          color: #f2f8f4;
          background: linear-gradient(110deg,rgba(5,20,12,.91),rgba(9,35,21,.78));
          border-bottom: 1px solid rgba(197, 231, 209, .13);
          -webkit-backdrop-filter: blur(18px);
          backdrop-filter: blur(18px);
          animation: pl-nav-in .55s ease both;
          box-shadow: 0 8px 28px rgba(3,18,10,.13), inset 0 1px rgba(255,255,255,.035);
        }
        @keyframes pl-nav-in { from { opacity: 0; transform: translateY(-12px) } to { opacity: 1; transform: translateY(0) } }
        .pl-nav-inner {
          width: min(1320px, calc(100% - 40px)); min-height: 68px; margin: auto;
          display: flex; align-items: center; gap: 18px;
        }
        .pl-brand {
          display: inline-flex; align-items: center; gap: 9px; flex: 0 0 auto;
          color: #f4fbf7; text-decoration: none; font-size: 18px; font-weight: 850;
          letter-spacing: -.04em; white-space: nowrap;
        }
        .pl-brand-mark {
          width: 31px; height: 31px; display: grid; place-items: center;
          border-radius: 10px; color: #04170c; font-size: 20px; font-weight: 900;
          background: linear-gradient(145deg, #31db8a, #0d9b58);
          box-shadow: 0 0 18px rgba(32,199,122,.24);
        }
        .pl-nav-links { display: flex; align-items: center; justify-content: flex-end; gap: 2px; margin-left: auto; }
        .pl-nav-link {
          position: relative; border: 0; background: transparent; color: #bdd0c3;
          padding: 10px 9px; font-size: 12px; font-weight: 650; cursor: pointer;
          transition: color .2s ease, background .2s ease; border-radius: 8px;
        }
        .pl-nav-link::after {
          content: ''; position: absolute; left: 10px; right: 10px; bottom: 4px;
          height: 2px; border-radius: 2px; background: var(--pl-mint);
          transform: scaleX(0); transform-origin: left; transition: transform .22s ease;
        }
        .pl-nav-link:hover, .pl-nav-link:focus-visible, .pl-nav-link.pl-active { color: #fff; background: rgba(32,199,122,.09); }
        .pl-nav-link:hover::after, .pl-nav-link:focus-visible::after, .pl-nav-link.pl-active::after { transform: scaleX(1); }
        .pl-nav-link.pl-active { color: var(--pl-mint); }
        .pl-cart-count { display:inline-grid;min-width:18px;height:18px;place-items:center;margin-left:5px;padding:0 5px;border:1px solid rgba(163,242,197,.26);border-radius:999px;background:rgba(32,199,122,.16);color:#d9ffe7;font-size:9px;font-weight:900;vertical-align:middle; }
        .pl-account { display: flex; align-items: center; gap: 8px; color: #dcebe1; font-size: 12px; white-space: nowrap; }
        .pl-avatar { width: 29px; height: 29px; display: grid; place-items: center; border-radius: 50%; color: #04170c; background: linear-gradient(145deg,#31db8a,#0d9b58); font-weight: 900; }
        .pl-logout, .pl-menu-button {
          min-height: 36px; padding: 7px 11px; border: 1px solid rgba(197,231,209,.2);
          border-radius: 10px; color: #e2f0e6; background: rgba(255,255,255,.035);
          font-size: 12px; font-weight: 700; cursor: pointer;
          transition: color .2s, border-color .2s, background .2s, box-shadow .2s;
        }
        .pl-logout:hover, .pl-menu-button:hover { color: var(--pl-mint); border-color: rgba(32,199,122,.6); background: rgba(32,199,122,.1); box-shadow: 0 0 16px rgba(32,199,122,.12); }
        .pl-menu-button { display: none; }
        @media (max-width: 1020px) {
          .pl-nav-inner { gap: 10px; width: min(100% - 28px, 1320px); }
          .pl-nav-link { padding-inline: 7px; font-size: 11px; }
          .pl-account-name { display: none; }
        }
        @media (max-width: 760px) {
          .pl-nav-inner { min-height: 60px; flex-wrap: wrap; gap: 8px; padding: 9px 0; }
          .pl-brand { font-size: 16px; }
          .pl-menu-button { display: inline-flex; align-items: center; margin-left: auto; }
          .pl-account { order: 2; }
          .pl-logout { order: 3; }
          .pl-nav-links { display: flex; order: 4; width: 100%; margin: 0; padding: 0; flex-direction: column; align-items: stretch; border-top: 1px solid transparent; max-height: 0; opacity: 0; overflow: hidden; transform: translateY(-7px); pointer-events: none; transition: max-height .28s ease, opacity .2s ease, transform .24s ease, padding .24s ease, border-color .24s ease; }
          .pl-nav-links.pl-open { max-height: 390px; opacity: 1; transform: translateY(0); pointer-events: auto; padding: 7px 0 3px; border-color: rgba(197,231,209,.1); }
          .pl-nav-link { width: 100%; text-align: left; padding: 12px 10px; font-size: 13px; }
          .pl-nav-link::after { left: 10px; right: auto; width: 44px; bottom: 6px; }
        }
        @media (prefers-reduced-motion: reduce) { .pl-navbar, .pl-navbar * { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
      `}</style>
      <header className="pl-navbar">
        <div className="pl-nav-inner">
            <button className="pl-brand" onClick={() => goToSection("home")} aria-label="PharmaLink home">
            <span className="pl-brand-mark" aria-hidden="true">+</span>
            <span>PharmaLink</span>
          </button>
          <button className="pl-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="pl-nav-links">
            {menuOpen ? "Close" : "Menu"}
          </button>
          <nav id="pl-nav-links" className={`pl-nav-links${menuOpen ? " pl-open" : ""}`} aria-label="Main navigation">
            {LINKS.map(([label, id]) => (
              <button key={id} className={`pl-nav-link${isActive(id) ? " pl-active" : ""}`} aria-current={isActive(id) ? "page" : undefined} onClick={() => goToSection(id)}>{label}{id === "cart" && cartCount > 0 && <span className="pl-cart-count" aria-label={`${cartCount} items`}>{cartCount}</span>}</button>
            ))}
          </nav>
          <div className="pl-account" title={user?.name || user?.email || "Signed-in account"}>
            <span className="pl-avatar" aria-hidden="true">{firstName.charAt(0).toUpperCase()}</span>
            <span className="pl-account-name">{firstName}</span>
          </div>
          <button className="pl-logout" onClick={onLogout}>Log out</button>
        </div>
      </header>
    </>
  );
}
