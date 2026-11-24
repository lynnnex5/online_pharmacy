import { useEffect, useMemo, useRef, useState } from "react";

const products = [
  { id: "m1", name: "Paracetamol 500mg", form: "Tablets · pack of 20", category: "Pain relief", price: 55, pharmacy: "Karibu Chemist", area: "Market Road", distance: 1.4, stock: "In stock", rx: false, icon: "✚", description: "Sample listing for a commonly stocked pain-relief medicine. This page does not determine whether it is suitable for an individual." },
  { id: "m2", name: "Ibuprofen 400mg", form: "Tablets · pack of 20", category: "Pain relief", price: 110, pharmacy: "Afya Plus Pharmacy", area: "Town Centre", distance: 0.8, stock: "In stock", rx: false, icon: "✚", description: "Sample listing only. Read the approved product label and speak with a pharmacist about suitability and precautions." },
  { id: "m3", name: "Cetirizine 10mg", form: "Tablets · pack of 10", category: "Cold & allergy", price: 80, pharmacy: "Karibu Chemist", area: "Market Road", distance: 1.4, stock: "Low stock", rx: false, icon: "✿", description: "Illustrative listing for general browsing. Allergy-like symptoms can have different causes; consult a health professional when unsure." },
  { id: "m4", name: "Vitamin C 1000mg", form: "Effervescent · pack of 10", category: "Vitamins", price: 420, pharmacy: "Tumaini Pharmacy", area: "Hospital Road", distance: 2.3, stock: "In stock", rx: false, icon: "☼", description: "Sample supplement listing. Follow the product label and ask a pharmacist if you have a medical condition or take other medicines." },
  { id: "m5", name: "Amoxicillin 500mg", form: "Capsules · pack of 21", category: "Antibiotics", price: 350, pharmacy: "Tumaini Pharmacy", area: "Hospital Road", distance: 2.3, stock: "In stock", rx: true, icon: "✚", description: "This sample item is marked as prescription-related for demonstration. Antibiotics should only be used when prescribed by a qualified clinician." },
  { id: "m6", name: "Oral rehydration salts", form: "Sachets · pack of 10", category: "First aid", price: 160, pharmacy: "Afya Plus Pharmacy", area: "Town Centre", distance: 0.8, stock: "In stock", rx: false, icon: "＋", description: "Illustrative product listing. Prepare only according to the exact instructions on the product packet." },
  { id: "m7", name: "Metformin 500mg", form: "Tablets · pack of 30", category: "Chronic care", price: 230, pharmacy: "Karibu Chemist", area: "Market Road", distance: 1.4, stock: "In stock", rx: true, icon: "◉", description: "Example listing only; this is not a recommendation. A clinician determines whether this medicine is appropriate." },
  { id: "m8", name: "Amlodipine 5mg", form: "Tablets · pack of 30", category: "Chronic care", price: 280, pharmacy: "Tumaini Pharmacy", area: "Hospital Road", distance: 2.3, stock: "Low stock", rx: true, icon: "◉", description: "Example listing only. A licensed clinician must assess a person's blood pressure and medical history before treatment decisions." },
];

const categoryOptions = ["All categories", ...new Set(products.map((product) => product.category))];
const styles = `
  .fm-page,.fm-page *{box-sizing:border-box}.fm-page{--fm-green:#159b58;--fm-dark:#143a25;--fm-ink:#16271c;--fm-muted:#718076;--fm-line:#e5eee7;min-height:76vh;padding:30px 0 70px;color:var(--fm-ink);background:linear-gradient(180deg,#f6faf7 0,#fff 270px);font-family:'DM Sans','Segoe UI',system-ui,sans-serif;overflow:clip}
  .fm-container{width:min(1190px,calc(100% - 44px));margin:0 auto}.fm-fade{animation:fm-rise .48s cubic-bezier(.2,.7,.25,1) both}@keyframes fm-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes fm-pop{from{opacity:0;transform:translateY(10px) scale(.975)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes fm-backdrop{from{opacity:0}to{opacity:1}}
  .fm-top{display:flex;align-items:end;justify-content:space-between;gap:20px;margin:5px 0 22px}.fm-eyebrow{color:#168149;font-size:10px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.fm-top h1{margin:6px 0 8px;color:#17291d;font-size:clamp(29px,4.8vw,44px);font-weight:900;letter-spacing:-.05em;line-height:1.05}.fm-top p{max-width:620px;margin:0;color:#758278;font-size:13px;line-height:1.65}.fm-basket{display:flex;align-items:center;gap:8px;flex:0 0 auto;padding:10px 13px;border:1px solid #dcebe0;border-radius:13px;background:#fff;color:#1a693c;font-size:12px;font-weight:850;box-shadow:0 7px 22px #102d190c}
  .fm-search-wrap{display:grid;grid-template-columns:minmax(0,1fr) 190px 170px;gap:10px;padding:11px;border:1px solid #dfeae2;border-radius:18px;background:#ffffffdf;box-shadow:0 12px 30px #102d190a;backdrop-filter:blur(12px)}.fm-searchbox{display:flex;align-items:center;gap:10px;min-width:0;padding:0 13px;border:1px solid #e5eee7;border-radius:12px;background:#fbfdfb;color:#668071}.fm-searchbox input{width:100%;min-width:0;padding:12px 0;border:0;outline:0;background:transparent;color:#203126;font-size:12px}.fm-control{min-width:0;padding:11px 12px;border:1px solid #e5eee7;border-radius:12px;background:#fbfdfb;color:#425448;font-size:11px;font-weight:700}.fm-filterbar{display:flex;align-items:center;gap:8px;overflow:auto;padding:17px 1px 7px;scrollbar-width:thin}.fm-chip{flex:0 0 auto;padding:8px 12px;border:1px solid #e2ebe4;border-radius:999px;background:#fff;color:#607065;font-size:10px;font-weight:800;transition:color .18s,border-color .18s,background .18s,transform .18s}.fm-chip:hover{transform:translateY(-1px);border-color:#abd9bb;color:#137b43}.fm-chip.on{border-color:#9ed7b3;background:#e9f8ee;color:#11743e;box-shadow:0 0 0 2px #20c77a10}.fm-count{margin-left:auto;color:#87948b;font-size:10px;white-space:nowrap}
  .fm-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:14px}.fm-card{display:flex;flex-direction:column;min-width:0;overflow:hidden;border:1px solid #e5eee7;border-radius:17px;background:#fff;box-shadow:0 6px 18px #102d1908;animation:fm-rise .45s ease both;transition:transform .2s,border-color .2s,box-shadow .2s}.fm-card:hover{transform:translateY(-4px);border-color:#b9e1c6;box-shadow:0 14px 30px #102d1914}.fm-art{position:relative;height:98px;display:grid;place-items:center;background:radial-gradient(circle at 77% 10%,#c9efd6 0,transparent 32%),linear-gradient(130deg,#eaf8ef,#f8fcf9)}.fm-art-icon{width:59px;height:59px;display:grid;place-items:center;border:1px solid #d9ecde;border-radius:19px;background:#ffffffdc;color:#19824a;font-size:27px;box-shadow:0 8px 20px #155f3217;transform:rotate(-4deg)}.fm-stock{position:absolute;right:10px;top:10px;padding:5px 8px;border-radius:999px;background:#fff;color:#27764a;font-size:9px;font-weight:800;box-shadow:0 3px 10px #102d1910}.fm-stock.low{color:#a36b15;background:#fff8e9}.fm-body{display:flex;flex:1;flex-direction:column;padding:13px}.fm-cat{color:#18834a;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.fm-body h2{margin:5px 0 4px;color:#203126;font-size:14px;font-weight:850;line-height:1.35}.fm-form{margin:0;color:#7b887e;font-size:10px}.fm-pharm{display:flex;align-items:center;gap:5px;margin-top:12px;color:#6e7e72;font-size:10px}.fm-rx{display:inline-block;margin-top:8px;padding:4px 7px;border:1px solid #f2e1bd;border-radius:8px;background:#fff9eb;color:#946414;font-size:9px;font-weight:800}.fm-foot{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-top:auto;padding-top:12px}.fm-price{color:#183723;font-size:14px;font-weight:900}.fm-price small{display:block;margin-top:2px;color:#87938a;font-size:9px;font-weight:600}.fm-actions{display:flex;gap:6px}.fm-iconbutton{width:33px;height:33px;display:grid;place-items:center;border:1px solid #d8eade;border-radius:10px;background:#f0faf3;color:#157c45;font-size:15px;font-weight:800;transition:transform .18s,background .18s,color .18s}.fm-iconbutton:hover{transform:scale(1.05);background:#159b58;color:white}.fm-detailbutton{padding:0 10px;border:1px solid #e0eae2;border-radius:10px;background:white;color:#617268;font-size:9px;font-weight:800;transition:border-color .18s,color .18s}.fm-detailbutton:hover{border-color:#9ed7b3;color:#137b43}.fm-empty{grid-column:1/-1;padding:38px 20px;border:1px dashed #c9d8cd;border-radius:17px;background:#ffffff88;color:#718076;text-align:center;font-size:13px}.fm-notice{margin-top:18px;padding:12px 14px;border:1px solid #f1e4c5;border-radius:13px;background:#fffbf2;color:#786944;font-size:10px;line-height:1.7}
  .fm-modal-backdrop{position:fixed;inset:0;z-index:250;display:grid;place-items:center;padding:18px;background:#07150dcc;backdrop-filter:blur(8px);animation:fm-backdrop .2s ease both}.fm-modal{width:min(520px,100%);max-height:min(85vh,720px);overflow:auto;padding:23px;border:1px solid #ffffff5c;border-radius:22px;background:linear-gradient(145deg,#fffffffa,#f3faf5f5);color:#182b1f;box-shadow:0 28px 90px #0005;animation:fm-pop .25s cubic-bezier(.2,.75,.25,1) both}.fm-modal-backdrop.is-closing{animation:fm-backdrop-out .18s ease both;pointer-events:none}.fm-modal-backdrop.is-closing .fm-modal{animation:fm-pop-out .18s ease both}@keyframes fm-backdrop-out{to{opacity:0}}@keyframes fm-pop-out{to{opacity:0;transform:translateY(8px) scale(.975)}}.fm-modal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}.fm-modal h2{margin:4px 0 0;color:#173321;font-size:23px;letter-spacing:-.04em}.fm-modal p{color:#637369;font-size:12px;line-height:1.75}.fm-close{width:34px;height:34px;border:1px solid #dce9df;border-radius:11px;background:#fff;color:#385343;font-size:17px;cursor:pointer}.fm-modal-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:17px}.fm-cta{padding:11px 14px;border:0;border-radius:11px;background:#159b58;color:#fff;font-size:11px;font-weight:850;cursor:pointer;transition:background .18s,transform .18s}.fm-cta:hover{transform:translateY(-1px);background:#0d7c43}.fm-cta.secondary{border:1px solid #dce9df;background:#fff;color:#43604b}.fm-toast{position:fixed;z-index:300;left:50%;bottom:24px;max-width:calc(100% - 28px);transform:translateX(-50%);padding:12px 16px;border:1px solid #d4ebda;border-radius:13px;background:#f5fff7;color:#155b32;font-size:11px;font-weight:850;box-shadow:0 12px 32px #0b2c1930;animation:fm-pop .22s ease both}
  @media(max-width:900px){.fm-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.fm-search-wrap{grid-template-columns:minmax(0,1fr) 170px}.fm-search-wrap .fm-control:last-child{grid-column:2}}
  @media(max-width:620px){.fm-page{padding-top:22px}.fm-container{width:calc(100% - 28px)}.fm-top{align-items:flex-start}.fm-top h1{font-size:32px}.fm-top p{font-size:11px}.fm-search-wrap{grid-template-columns:1fr 1fr;padding:8px;gap:7px}.fm-searchbox{grid-column:1/-1}.fm-control{font-size:10px}.fm-search-wrap .fm-control:last-child{grid-column:auto}.fm-grid{gap:9px}.fm-art{height:82px}.fm-art-icon{width:50px;height:50px;font-size:23px}.fm-body{padding:10px}.fm-body h2{font-size:12px}.fm-pharm{font-size:9px}.fm-foot{gap:5px}.fm-price{font-size:12px}.fm-iconbutton{width:30px;height:30px}.fm-detailbutton{padding:0 7px;font-size:8px}}
  @media(max-width:390px){.fm-top{display:block}.fm-basket{margin-top:14px}.fm-grid{grid-template-columns:1fr}.fm-card{display:grid;grid-template-columns:82px 1fr}.fm-art{height:100%;min-height:130px}.fm-stock{right:4px;top:7px;padding:4px 5px;font-size:8px}.fm-body{min-height:130px}.fm-actions{gap:4px}}
  @media(prefers-reduced-motion:reduce){.fm-page *,.fm-page *::before,.fm-page *::after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
`;

export default function FindMedicine({ onNavigate }) {
  const [query, setQuery] = useState(() => {
    try {
      const value = sessionStorage.getItem("pharmalink_search_query") || "";
      sessionStorage.removeItem("pharmalink_search_query");
      return value;
    } catch { return ""; }
  });
  const [category, setCategory] = useState("All categories");
  const [sort, setSort] = useState("price");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [basket, setBasket] = useState([]);
  const [selected, setSelected] = useState(null);
  const [closing, setClosing] = useState(false);
  const [toast, setToast] = useState("");
  const closeTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  function closeDetails() {
    if (!selected || closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      setSelected(null);
      setClosing(false);
    }, 180);
  }

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products
      .filter((item) => (category === "All categories" || item.category === category))
      .filter((item) => !inStockOnly || item.stock === "In stock")
      .filter((item) => !term || `${item.name} ${item.form} ${item.category} ${item.pharmacy} ${item.area}`.toLowerCase().includes(term))
      .sort((a, b) => sort === "distance" ? a.distance - b.distance : a.price - b.price);
  }, [query, category, sort, inStockOnly]);

  function addToBasket(item) {
    setBasket((current) => [...current, item]);
    setToast(`${item.name} added to your demo basket`);
    window.clearTimeout(window.__pharmalinkFindToast);
    window.__pharmalinkFindToast = window.setTimeout(() => setToast(""), 2400);
  }

  return (
    <main className="fm-page">
      <style>{styles}</style>
      <div className="fm-container">
        <header className="fm-top fm-fade">
          <div><div className="fm-eyebrow">PharmaLink · sample catalogue</div><h1>Find medicine</h1><p>Search the sample listings, then compare example prices and pharmacy locations. Confirm current details directly with a licensed pharmacy.</p></div>
          <div className="fm-basket" aria-live="polite"><span aria-hidden="true">▣</span> Demo basket <strong>{basket.length}</strong></div>
        </header>

        <section className="fm-search-wrap fm-fade" aria-label="Search and filter listings">
          <label className="fm-searchbox"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Medicine name, category, pharmacy…" aria-label="Search sample medicine listings"/><button type="button" onClick={() => setQuery("")} aria-label="Clear search" style={{border:0,background:'transparent',color:'#738278',fontSize:15,cursor:'pointer'}}>×</button></label>
          <label><span style={{position:'absolute',width:1,height:1,padding:0,margin:-1,overflow:'hidden',clip:'rect(0,0,0,0)',whiteSpace:'nowrap',border:0}}>Sort results</span><select className="fm-control" value={sort} onChange={(event)=>setSort(event.target.value)} style={{width:'100%'}}><option value="price">Sort: price</option><option value="distance">Sort: nearest</option></select></label>
          <label style={{display:'flex',alignItems:'center',gap:8,padding:'0 8px',color:'#5f7064',fontSize:10,fontWeight:750}}><input type="checkbox" checked={inStockOnly} onChange={(event)=>setInStockOnly(event.target.checked)} style={{accentColor:'#159b58'}}/> In stock only</label>
        </section>

        <div className="fm-filterbar" role="group" aria-label="Filter by medicine category">
          {categoryOptions.map((option)=><button key={option} type="button" className={`fm-chip${category===option?' on':''}`} aria-pressed={category===option} onClick={()=>setCategory(option)}>{option}</button>)}
          <span className="fm-count">{results.length} sample result{results.length===1?'':'s'}</span>
        </div>

        <section className="fm-grid" aria-label="Medicine listings">
          {results.length ? results.map((item,index)=><article key={item.id} className="fm-card" style={{animationDelay:`${Math.min(index*45,225)}ms`}}>
            <div className="fm-art"><span className={`fm-stock${item.stock==='Low stock'?' low':''}`}>{item.stock}</span><span className="fm-art-icon" aria-hidden="true">{item.icon}</span></div>
            <div className="fm-body"><span className="fm-cat">{item.category}</span><h2>{item.name}</h2><p className="fm-form">{item.form}</p><div className="fm-pharm"><span aria-hidden="true">⌖</span>{item.pharmacy} · {item.distance} km</div>{item.rx&&<span className="fm-rx">Prescription-related · sample flag</span>}
              <div className="fm-foot"><span className="fm-price">KES {item.price.toLocaleString('en-KE')}<small>Sample price · confirm with pharmacy</small></span><div className="fm-actions"><button className="fm-detailbutton" type="button" onClick={()=>setSelected(item)}>Details</button><button className="fm-iconbutton" type="button" aria-label={`Add ${item.name} to demo basket`} onClick={()=>addToBasket(item)}>+</button></div></div>
            </div>
          </article>) : <div className="fm-empty">No sample listings match your filters. Try another search or choose “All categories”.</div>}
        </section>

        <aside className="fm-notice"><strong>Important:</strong> Catalogue entries, availability, prices, pharmacy names, locations and prescription flags are illustrative sample data. This frontend does not diagnose, prescribe, verify prescriptions, process payments or send orders. Ask a licensed clinician or pharmacist about medicine suitability and requirements.</aside>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginTop:19}}><button type="button" className="fm-cta secondary" onClick={()=>onNavigate?.('home')}>← Back to home</button><button type="button" className="fm-cta secondary" onClick={()=>onNavigate?.('pharmacies')}>Browse nearby pharmacies →</button></div>
      </div>

      {selected&&<div className={`fm-modal-backdrop${closing?' is-closing':''}`} role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)closeDetails()}}><section className="fm-modal" role="dialog" aria-modal="true" aria-labelledby="fm-modal-title"><div className="fm-modal-head"><div><div className="fm-eyebrow">General product information · sample listing</div><h2 id="fm-modal-title">{selected.name}</h2></div><button className="fm-close" type="button" aria-label="Close details" onClick={closeDetails}>×</button></div><p style={{marginTop:17}}>{selected.description}</p><p><strong>Listing details:</strong> {selected.form} · {selected.category} · example price KES {selected.price.toLocaleString('en-KE')} at {selected.pharmacy}.</p><p style={{padding:12,borderRadius:12,background:'#fff8e9',color:'#78633b'}}>Confirm product, current price, stock and prescription requirements with a licensed pharmacist. This information is not a recommendation or treatment plan.</p><div className="fm-modal-actions"><button className="fm-cta" type="button" onClick={()=>{addToBasket(selected);closeDetails()}}>Add to demo basket</button><button className="fm-cta secondary" type="button" onClick={closeDetails}>Close</button></div></section></div>}
      {toast&&<div className="fm-toast" role="status" aria-live="polite">{toast} · {basket.length} in basket</div>}
    </main>
  );
}
