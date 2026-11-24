const css = `
  .for-pharmacies,.for-pharmacies *{box-sizing:border-box}
  .for-pharmacies{min-height:76vh;padding:34px 0 74px;background:linear-gradient(180deg,#f3faf5 0,#fff 360px);color:#17291d;font-family:'DM Sans','Segoe UI',system-ui,sans-serif;overflow:clip}
  .fp-wrap{width:min(1040px,calc(100% - 44px));margin:auto}
  .fp-hero{position:relative;isolation:isolate;overflow:hidden;padding:clamp(28px,5vw,52px);border:1px solid #ffffff42;border-radius:25px;background:radial-gradient(circle at 86% 10%,#9aefb94c,transparent 27%),linear-gradient(115deg,#103923,#0d633a 66%,#168e50);color:#fff;box-shadow:0 19px 46px #0d44231c;animation:fp-rise .5s ease both}
  .fp-hero:after{content:'✚';position:absolute;z-index:-1;right:8%;top:50%;transform:translateY(-50%) rotate(-8deg);width:125px;height:125px;display:grid;place-items:center;border:1px solid #ffffff3b;border-radius:34px;background:#ffffff16;color:#e4ffed;font-size:59px;text-shadow:0 0 25px #a3f2c5;box-shadow:inset 0 1px #ffffff38,0 14px 34px #062c1933;backdrop-filter:blur(12px)}
  .fp-kicker{color:#dcf8e4;font-size:10px;font-weight:900;letter-spacing:.14em}
  .fp-hero h1{max-width:690px;margin:13px 0 10px;color:#fff;font-size:clamp(32px,5vw,49px);line-height:1.04;letter-spacing:-.05em}
  .fp-hero p{max-width:660px;margin:0;color:#d5efdd;font-size:13px;line-height:1.8}
  .fp-cta-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
  .fp-button{display:inline-flex;justify-content:center;align-items:center;min-height:42px;padding:10px 15px;border:1px solid #ffffff48;border-radius:11px;background:#ffffff12;color:#f5fff8;text-decoration:none;font-size:10px;font-weight:850;cursor:pointer;transition:transform .2s,background .2s,box-shadow .2s}
  .fp-button:hover{transform:translateY(-2px);background:#ffffff24;box-shadow:0 8px 19px #062c1933}
  .fp-button.primary{border-color:#a3f2c5;background:#b7f5cf;color:#103b22}
  .fp-button.primary:hover{background:#d5f9e1;box-shadow:0 8px 20px #062c1938}
  .fp-section{padding-top:28px}
  .fp-section h2{margin:0 0 8px;color:#203126;font-size:clamp(20px,3vw,26px);letter-spacing:-.04em}
  .fp-section>p{max-width:790px;margin:0;color:#748178;font-size:12px;line-height:1.8}
  .fp-separation{display:grid;grid-template-columns:auto 1fr;gap:13px;margin-top:17px;padding:17px;border:1px solid #dce9df;border-radius:17px;background:linear-gradient(135deg,#f2faf4,#fff);box-shadow:0 8px 24px #102d1908}
  .fp-mark{width:39px;height:39px;display:grid;place-items:center;border:1px solid #d5e9da;border-radius:13px;background:#eaf8ef;color:#18834a;font-size:17px}
  .fp-separation strong{display:block;margin:2px 0 5px;color:#23452d;font-size:12px}
  .fp-separation p{margin:0;color:#718076;font-size:11px;line-height:1.75}
  .fp-links{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}
  .fp-link{padding:10px 13px;border:1px solid #d8e9dd;border-radius:11px;background:#fff;color:#287146;font-size:10px;font-weight:850;cursor:pointer;transition:transform .2s,background .2s,border-color .2s}
  .fp-link:hover{transform:translateY(-2px);border-color:#abd9b8;background:#eff9f2}
  @keyframes fp-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @media(max-width:560px){.fp-wrap{width:calc(100% - 28px)}.fp-hero{padding:24px 19px}.fp-hero:after{top:auto;right:13px;bottom:13px;transform:rotate(-8deg);width:59px;height:59px;font-size:29px;opacity:.76}.fp-hero h1{font-size:33px}.fp-hero p{max-width:88%;font-size:11px}.fp-section>p{font-size:11px}.fp-separation{padding:14px}.fp-links{display:grid}.fp-link{width:100%}}
  @media(prefers-reduced-motion:reduce){.for-pharmacies *,.for-pharmacies *:before,.for-pharmacies *:after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
`;

export default function ForPharmacies({ onNavigate }) {
  return (
    <main className="for-pharmacies">
      <style>{css}</style>
      <div className="fp-wrap">
        <header className="fp-hero">
          <span className="fp-kicker">FOR PHARMACIES & ORGANIZATIONS</span>
          <h1>Be part of helping people find nearby pharmacies.</h1>
          <p>PharmaLink’s customer experience brings medicine discovery and pharmacy listings together. Pharmacy and organization users have a separate account view from customers.</p>
          <div className="fp-cta-row">
            <a className="fp-button primary" href="#/login">Continue to existing sign-in →</a>
            <button className="fp-button" type="button" onClick={() => onNavigate?.("pharmacies")}>View customer pharmacy listings</button>
          </div>
        </header>

        <section className="fp-section" aria-labelledby="fp-account-title">
          <h2 id="fp-account-title">Your organization account stays separate</h2>
          <p>Use the existing sign-in flow for your pharmacy or organization account. After signing in, continue to the organization view already set up in your app. This page does not replace that view or add account, inventory, restocking, payment, or order-management features.</p>
          <div className="fp-separation">
            <span className="fp-mark" aria-hidden="true">▣</span>
            <div><strong>This page is an information page—not your organization dashboard.</strong><p>Customer-facing medicine and pharmacy listings are separate from private organization account pages. No organization data or management controls are shown here.</p></div>
          </div>
          <div className="fp-links" aria-label="Other PharmaLink pages">
            <button className="fp-link" type="button" onClick={() => onNavigate?.("find")}>See the customer medicine search</button>
            <button className="fp-link" type="button" onClick={() => onNavigate?.("how")}>How the customer journey works</button>
          </div>
        </section>
      </div>
    </main>
  );
}
