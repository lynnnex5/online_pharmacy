const LINKS = [
  ["Home", "home"],
  ["Find medicine", "find"],
  ["Pharmacies", "pharmacies"],
  ["How it works", "how"],
  ["For pharmacies", "restock"],
  ["FAQ", "faq"],
];

export default function Footer({ onNavigate }) {
  function goToSection(id) {
    if (onNavigate) {
      onNavigate(id);
      return;
    }
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (id === "home") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <style>{`
        .pl-footer, .pl-footer * { box-sizing: border-box; }
        .pl-footer {
          color: #a9bdb0; background: linear-gradient(110deg,rgba(4,17,10,.96),rgba(8,31,19,.9));
          border-top: 1px solid rgba(197,231,209,.13);
          padding: 38px 20px 20px; animation: pl-footer-in .65s ease both;
          -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px);
          box-shadow: 0 -12px 36px rgba(3,18,10,.1), inset 0 1px rgba(255,255,255,.025);
        }
        @keyframes pl-footer-in { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        .pl-footer-inner { width: min(1220px,100%); margin: auto; }
        .pl-footer-top { display: grid; grid-template-columns: minmax(220px,1.5fr) 1fr 1fr; gap: 34px; padding-bottom: 26px; border-bottom: 1px solid rgba(197,231,209,.12); }
        .pl-footer-brand { color: #f0faf3; font-size: 17px; font-weight: 850; letter-spacing: -.035em; }
        .pl-footer-copy { max-width: 400px; margin-top: 9px; color: #9fb4a5; font-size: 12px; line-height: 1.75; }
        .pl-footer h3 { margin: 1px 0 10px; color: #e9f5ed; font-size: 12px; font-weight: 800; letter-spacing: .04em; }
        .pl-footer-links { display: grid; justify-items: start; gap: 6px; }
        .pl-footer-link { position: relative; border: 0; padding: 3px 0; background: none; color: #9fb4a5; font-size: 12px; cursor: pointer; transition: color .2s ease; }
        .pl-footer-link::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 1px; background: #a3f2c5; transform: scaleX(0); transform-origin: left; transition: transform .2s ease; }
        .pl-footer-link:hover { color: #a3f2c5; }
        .pl-footer-link:hover::after { transform: scaleX(1); }
        .pl-footer-bottom { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; padding-top: 17px; color: #718879; font-size: 10px; line-height: 1.6; }
        @media (max-width: 700px) { .pl-footer-top { grid-template-columns: 1fr 1fr; gap: 22px; } .pl-footer-top > :first-child { grid-column: 1 / -1; } }
        @media (max-width: 390px) { .pl-footer { padding-inline: 16px; } .pl-footer-top { grid-template-columns: 1fr; } .pl-footer-top > :first-child { grid-column: auto; } }
        @media (prefers-reduced-motion: reduce) { .pl-footer, .pl-footer * { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
      `}</style>
      <footer className="pl-footer">
        <div className="pl-footer-inner">
          <div className="pl-footer-top">
            <div>
              <div className="pl-footer-brand">PharmaLink</div>
              <p className="pl-footer-copy">A pharmacy-access demonstration. Listing details and availability are illustrative; confirm information with a licensed pharmacy.</p>
            </div>
            <div>
              <h3>EXPLORE</h3>
              <div className="pl-footer-links">
                {LINKS.map(([label, id]) => <button key={id} className="pl-footer-link" onClick={() => goToSection(id)}>{label}</button>)}
              </div>
            </div>
            <div>
              <h3>IMPORTANT</h3>
              <p className="pl-footer-copy" style={{ marginTop: 0 }}>PharmaLink does not diagnose, prescribe, verify sample stock, process payment, or dispatch delivery in this frontend demo.</p>
            </div>
          </div>
          <div className="pl-footer-bottom">
            <span>© {new Date().getFullYear()} PharmaLink · Frontend demonstration Made By Rose </span>
            <span>For medicine questions, consult a licensed clinician or pharmacist.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
