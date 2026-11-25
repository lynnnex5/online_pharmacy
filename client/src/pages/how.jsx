import { useState } from "react";
import { CartLink } from "./cart.jsx";

const steps = [
  {
    number: "01",
    title: "Choose how to start",
    body: "Search for a medicine, or open the pharmacy list to browse by name and area.",
    detail: "You can browse without sharing your location. On Home or Pharmacies, choose “Use my location” only if you want the browser to request GPS permission.",
    icon: "⌕",
  },
  {
    number: "02",
    title: "Explore the listings",
    body: "Use the medicine search, categories and pharmacy filters to explore the example catalogue.",
    detail: "The current names, prices, distances, stock, hours and delivery estimates are sample content. Selecting a medicine from any Home or Find Medicine card adds it to your shared cart. GPS can open a map search, but it does not turn sample listings into verified nearby stores.",
    icon: "▤",
  },
  {
    number: "03",
    title: "Review your shared cart",
    body: "Select a medicine card to add it to the same cart used across Home and Find Medicine.",
    detail: "The cart groups identical product-and-pharmacy listings, shows quantity and sample line totals, and keeps its contents in this browser. It is not an order or a reservation.",
    icon: "▣",
  },
  {
    number: "04",
    title: "Check with the pharmacy",
    body: "Before travelling or making a medicine decision, confirm the details with a licensed pharmacy.",
    detail: "Ask about the actual product, current price and availability, opening hours, and any prescription requirements. Talk to a pharmacist or clinician about whether a medicine is right for you.",
    icon: "✚",
  },
];

const css = `
  .hiw-page,.hiw-page *{box-sizing:border-box}
  .hiw-page{min-height:76vh;padding:32px 0 72px;background:linear-gradient(180deg,#f2faf4 0,#fff 360px);color:#17291d;font-family:'DM Sans','Segoe UI',system-ui,sans-serif;overflow:clip}
  .hiw-wrap{width:min(1120px,calc(100% - 44px));margin:auto}
  .hiw-hero{position:relative;isolation:isolate;overflow:hidden;padding:clamp(27px,5vw,49px);border:1px solid #ffffff45;border-radius:25px;background:radial-gradient(circle at 85% 10%,#9bf0ba52,transparent 28%),linear-gradient(115deg,#103923,#0d633a 66%,#168e50);color:#fff;box-shadow:0 18px 44px #0e46231b;animation:hiw-rise .5s ease both}
  .hiw-hero:after{content:'→';position:absolute;z-index:-1;right:8%;top:50%;transform:translateY(-50%) rotate(-8deg);width:130px;height:130px;display:grid;place-items:center;border:1px solid #ffffff3c;border-radius:35px;background:#ffffff16;color:#e4ffed;font-size:65px;text-shadow:0 0 24px #a3f2c5;box-shadow:inset 0 1px #ffffff3c,0 14px 34px #062c1930;backdrop-filter:blur(12px)}
  .hiw-kicker{color:#dcf8e4;font-size:10px;font-weight:900;letter-spacing:.14em}
  .hiw-hero h1{max-width:700px;margin:12px 0 10px;color:#fff;font-size:clamp(32px,5vw,49px);line-height:1.04;letter-spacing:-.05em}
  .hiw-hero p{max-width:650px;margin:0;color:#d5efdd;font-size:13px;line-height:1.75}
  .hiw-path{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:20px;color:#e2f8e9;font-size:10px;font-weight:800}
  .hiw-path span{padding:7px 10px;border:1px solid #ffffff30;border-radius:99px;background:#ffffff12}
  .hiw-path i{color:#a5e8bb;font-style:normal}
  .hiw-section-head{margin:30px 0 14px}.hiw-section-head h2{margin:0;color:#1d3023;font-size:clamp(20px,3vw,27px);letter-spacing:-.04em}.hiw-section-head p{margin:6px 0 0;color:#78857b;font-size:12px;line-height:1.6}
  .hiw-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}
  .hiw-card{position:relative;display:flex;flex-direction:column;min-height:230px;padding:19px;border:1px solid #e2ece4;border-radius:19px;background:linear-gradient(145deg,#ffffffed,#f5fbf7);box-shadow:0 9px 25px #102d1909;animation:hiw-rise .45s ease both;transition:transform .22s,border-color .22s,box-shadow .22s}
  .hiw-card:hover,.hiw-card.open{transform:translateY(-3px);border-color:#acdaba;box-shadow:0 15px 32px #102d1912}
  .hiw-card-top{display:flex;justify-content:space-between;align-items:center;gap:10px}.hiw-index{color:#91aa98;font-size:11px;font-weight:900;letter-spacing:.08em}.hiw-icon{width:41px;height:41px;display:grid;place-items:center;border:1px solid #d7ebdd;border-radius:14px;background:#eaf8ef;color:#18834a;font-size:19px;box-shadow:0 5px 15px #126c3a12}
  .hiw-card h3{margin:16px 0 7px;color:#203126;font-size:15px;font-weight:900}.hiw-card p{margin:0;color:#718076;font-size:11px;line-height:1.75}.hiw-more{margin-top:auto;padding:12px 0 0;border:0;background:transparent;color:#157c45;text-align:left;font-size:10px;font-weight:850;cursor:pointer}.hiw-more:hover{text-decoration:underline;text-underline-offset:3px}.hiw-detail{margin-top:10px!important;padding-top:10px;border-top:1px solid #e7efe9;animation:hiw-reveal .2s ease both}
  .hiw-privacy{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:start;margin-top:17px;padding:15px 16px;border:1px solid #d8e9dd;border-radius:15px;background:linear-gradient(100deg,#eff9f2,#fbfefc)}.hiw-privacy-icon{width:31px;height:31px;display:grid;place-items:center;border-radius:10px;background:#ddf3e4;color:#157c45;font-size:15px}.hiw-privacy strong{display:block;margin-bottom:4px;color:#24452e;font-size:11px}.hiw-privacy p{margin:0;color:#718076;font-size:10px;line-height:1.7}
  .hiw-actions{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:19px;padding:18px 20px;border:1px solid #d7eadc;border-radius:17px;background:linear-gradient(100deg,#f0faf3,#fbfdfb)}.hiw-actions h2{margin:0;color:#1c3a26;font-size:15px}.hiw-actions p{margin:5px 0 0;color:#718076;font-size:10px;line-height:1.6}.hiw-buttons{display:flex;gap:8px;flex-wrap:wrap}.hiw-button{padding:10px 13px;border:1px solid #159b58;border-radius:11px;background:#159b58;color:#fff;font-size:10px;font-weight:850;cursor:pointer;transition:transform .2s,box-shadow .2s,background .2s}.hiw-button:hover{transform:translateY(-2px);background:#0e8148;box-shadow:0 8px 19px #159b5835}.hiw-button.secondary{border-color:#d7e8dc;background:#fff;color:#267146}.hiw-button.secondary:hover{background:#eff9f2;box-shadow:0 7px 16px #126c3a12}
  @keyframes hiw-rise{from{opacity:0;transform:translateY(13px)}to{opacity:1;transform:translateY(0)}}@keyframes hiw-reveal{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
  @media(max-width:760px){.hiw-steps{grid-template-columns:1fr}.hiw-card{min-height:0}.hiw-hero:after{right:5%;width:84px;height:84px;border-radius:24px;font-size:40px;opacity:.72}}
  @media(max-width:520px){.hiw-wrap{width:calc(100% - 28px)}.hiw-hero{padding:24px 19px}.hiw-hero:after{top:auto;right:13px;bottom:12px;transform:rotate(-8deg);width:57px;height:57px;font-size:29px}.hiw-hero h1{font-size:33px}.hiw-hero p{max-width:88%;font-size:11px}.hiw-path{max-width:85%;font-size:9px}.hiw-card{padding:16px}.hiw-actions{align-items:flex-start;flex-direction:column;padding:16px}.hiw-buttons{width:100%}.hiw-button{flex:1}}
  @media(prefers-reduced-motion:reduce){.hiw-page *,.hiw-page *:before,.hiw-page *:after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
`;

export default function HowItWorks({ user, onNavigate }) {
  const [open, setOpen] = useState(0);

  return (
    <main className="hiw-page">
      <style>{css}</style>
      <div className="hiw-wrap">
        <header className="hiw-hero">
          <span className="hiw-kicker">HOW PHARMALINK WORKS</span>
          <h1>Find a medicine. Explore nearby pharmacies.</h1>
          <p>PharmaLink brings medicine search and pharmacy listings together. Browse the example information, then confirm the real details with a pharmacy before you act.</p>
          <div className="hiw-path" aria-label="Customer journey"><span>Search</span><i>→</i><span>Explore</span><i>→</i><span>Confirm with pharmacy</span></div>
        </header>

        <div className="hiw-section-head">
          <h2>Your journey, step by step</h2>
          <p>These steps describe what you can do in the current customer-facing frontend.</p>
        </div>

        <section className="hiw-steps" aria-label="Customer journey steps">
          {steps.map((step, index) => (
            <article className={`hiw-card${open === index ? " open" : ""}`} key={step.number} style={{ animationDelay: `${index * 65}ms` }}>
              <div className="hiw-card-top"><span className="hiw-index">STEP {step.number}</span><span className="hiw-icon" aria-hidden="true">{step.icon}</span></div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <button className="hiw-more" type="button" aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)}>{open === index ? "Hide details −" : "More about this step +"}</button>
              {open === index && <p className="hiw-detail">{step.detail}</p>}
            </article>
          ))}
        </section>

        <aside className="hiw-privacy">
          <span className="hiw-privacy-icon" aria-hidden="true">⌖</span>
          <div><strong>Location is optional and opt-in</strong><p>Choose the location button on Home or Pharmacies if you want to share your device location with the browser. It is not sent to PharmaLink. If you open a map link, that link shares your coordinates with Google Maps. Sample pharmacy distances are not live or calculated from GPS.</p></div>
        </aside>

        <aside className="hiw-actions">
          <div><h2>Ready to explore?</h2><p>Start with the sample medicine catalogue or browse the example pharmacy list.</p></div>
          <div className="hiw-buttons">
            <button className="hiw-button" type="button" onClick={() => onNavigate?.("find")}>Find medicine</button>
            <button className="hiw-button secondary" type="button" onClick={() => onNavigate?.("pharmacies")}>Browse pharmacies</button>
            <CartLink user={user} onNavigate={onNavigate} className="hiw-button secondary" label="Open cart" />
          </div>
        </aside>
      </div>
    </main>
  );
}
