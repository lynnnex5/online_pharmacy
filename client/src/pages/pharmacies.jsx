import { useEffect, useMemo, useRef, useState } from "react";
import { CartLink } from "./cart.jsx";

const pharmacyData = [
  { id: "afya", name: "Afya Plus Pharmacy", area: "Town Centre", km: 0.8, hours: "8:00 AM – 9:00 PM", delivery: "30–45 min", icon: "✚", tone: "mint" },
  { id: "karibu", name: "Karibu Chemist", area: "Market Road", km: 1.4, hours: "Open 24 hours", delivery: "40–60 min", icon: "＋", tone: "sun" },
  { id: "tumaini", name: "Tumaini Pharmacy", area: "Hospital Road", km: 2.3, hours: "7:30 AM – 8:00 PM", delivery: "45–60 min", icon: "✿", tone: "lavender" },
  { id: "mwanga", name: "Mwanga Pharmacy", area: "Station Road", km: 3.6, hours: "8:00 AM – 10:00 PM", delivery: "60–75 min", icon: "✚", tone: "peach" },
  { id: "upendo", name: "Upendo Chemists", area: "Estate Gate", km: 5.1, hours: "8:30 AM – 7:30 PM", delivery: "75–90 min", icon: "＋", tone: "mint" },
];

const css = `
  .pharmacy-page,.pharmacy-page *{box-sizing:border-box}.pharmacy-page{min-height:76vh;padding:30px 0 70px;color:#17291d;background:linear-gradient(180deg,#f4faf6 0,#fff 320px);font-family:'DM Sans','Segoe UI',system-ui,sans-serif;overflow:clip}
  .pharmacy-container{width:min(1190px,calc(100% - 44px));margin:0 auto}.pharmacy-in{animation:pharmacy-in .48s cubic-bezier(.2,.7,.25,1) both}@keyframes pharmacy-in{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}@keyframes pharmacy-pop{from{opacity:0;transform:scale(.975)}to{opacity:1;transform:scale(1)}}
  .pharmacy-hero{position:relative;isolation:isolate;overflow:hidden;padding:clamp(24px,5vw,44px);border:1px solid #ffffff35;border-radius:24px;background:radial-gradient(circle at 88% 9%,#75dfa54a,transparent 26%),linear-gradient(115deg,#113d26,#0c5d36 65%,#148950);color:white;box-shadow:0 18px 42px #0d44231a}
  .pharmacy-hero:after{content:'⌖';position:absolute;right:7%;top:50%;z-index:-1;transform:translateY(-50%) rotate(-8deg);display:grid;place-items:center;width:150px;height:150px;border:1px solid #ffffff34;border-radius:38px;background:linear-gradient(145deg,#ffffff29,#ffffff08);color:#eafff0;font-size:78px;text-shadow:0 0 28px #98ffc0a8;box-shadow:inset 0 1px #ffffff2c,0 16px 38px #062c1930;backdrop-filter:blur(10px)}
  .pharmacy-kicker{display:inline-flex;align-items:center;gap:8px;padding:7px 11px;border:1px solid #ffffff3a;border-radius:99px;background:#ffffff12;color:#dff8e7;font-size:10px;font-weight:850;letter-spacing:.1em;text-transform:uppercase}.pharmacy-hero h1{max-width:650px;margin:15px 0 9px;color:white;font-size:clamp(30px,5vw,48px);font-weight:900;letter-spacing:-.05em;line-height:1.04}.pharmacy-hero p{max-width:580px;margin:0;color:#d0ead9;font-size:13px;line-height:1.75}
  .pharmacy-toolbar{display:flex;align-items:center;gap:10px;margin:20px 0 13px;padding:10px;border:1px solid #e2ece4;border-radius:16px;background:#ffffffd9;box-shadow:0 10px 26px #102d1908;backdrop-filter:blur(12px)}.pharmacy-search{display:flex;flex:1;align-items:center;gap:9px;min-width:180px;padding:0 12px;border:1px solid #e4ede6;border-radius:11px;background:#fbfdfb;color:#6e8475}.pharmacy-search input{width:100%;min-width:0;padding:12px 0;border:0;outline:0;background:transparent;color:#24372a;font-size:12px}.pharmacy-search input::placeholder{color:#94a198}.pharmacy-select{padding:11px 12px;border:1px solid #e4ede6;border-radius:11px;background:#fbfdfb;color:#506256;font-size:11px;font-weight:750}.pharmacy-filter{display:flex;gap:8px;overflow:auto;padding:3px 0 12px;scrollbar-width:thin}.pharmacy-chip{flex:0 0 auto;padding:8px 12px;border:1px solid #e2ebe4;border-radius:999px;background:#fff;color:#607065;font-size:10px;font-weight:800;transition:transform .18s,border-color .18s,color .18s,background .18s}.pharmacy-chip:hover{transform:translateY(-1px);border-color:#a8dabb;color:#167b44}.pharmacy-chip.on{border-color:#9ed7b3;background:#e9f8ee;color:#11743e;box-shadow:0 0 0 2px #20c77a10}.pharmacy-gps{padding:10px 12px;border:1px solid #cde6d4;border-radius:11px;background:#eff9f2;color:#167642;font-size:10px;font-weight:850;white-space:nowrap;cursor:pointer;transition:background .2s,box-shadow .2s,transform .2s}.pharmacy-gps:hover{transform:translateY(-1px);background:#e0f4e7;box-shadow:0 0 17px #159b5824}.pharmacy-location-message{margin:-3px 0 13px;color:#64746a;font-size:10px;line-height:1.6;animation:pharmacy-in .2s ease both}.pharmacy-live-dot{display:inline-block;width:7px;height:7px;margin-right:5px;border-radius:50%;background:#21bc70;box-shadow:0 0 10px #21bc70;animation:pharmacy-pulse 1.5s ease infinite}@keyframes pharmacy-pulse{50%{opacity:.45;transform:scale(.8)}}
  .pharmacy-results-head{display:flex;justify-content:space-between;align-items:end;gap:12px;margin:9px 0 14px}.pharmacy-results-head h2{margin:0;color:#1c3022;font-size:20px;font-weight:900;letter-spacing:-.035em}.pharmacy-results-head p{margin:5px 0 0;color:#7b897f;font-size:11px}.pharmacy-count{color:#829087;font-size:10px;white-space:nowrap}
  .pharmacy-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.pharmacy-card{position:relative;overflow:hidden;border:1px solid #e4ece5;border-radius:18px;background:linear-gradient(145deg,#fff,#fbfdfb);box-shadow:0 7px 20px #102d1908;animation:pharmacy-in .45s ease both;transition:transform .22s,border-color .22s,box-shadow .22s}.pharmacy-card:hover{transform:translateY(-4px);border-color:#b9e1c6;box-shadow:0 15px 34px #102d1913}.pharmacy-card:before{content:'';position:absolute;inset:0 0 auto;height:3px;background:linear-gradient(90deg,#20c77a,#a3f2c5);transform:scaleX(0);transform-origin:left;transition:transform .26s}.pharmacy-card:hover:before{transform:scaleX(1)}.pharmacy-card-top{display:flex;align-items:center;gap:12px;padding:17px 16px 13px}.pharmacy-icon{flex:0 0 auto;width:52px;height:52px;display:grid;place-items:center;border:1px solid #ffffff;border-radius:16px;font-size:24px;font-weight:900;box-shadow:0 7px 15px #173d2410}.pharmacy-icon.mint{background:#e1f7e9;color:#21834a}.pharmacy-icon.sun{background:#fff2d9;color:#9b7020}.pharmacy-icon.lavender{background:#eceeff;color:#5362a3}.pharmacy-icon.peach{background:#ffede4;color:#aa6642}.pharmacy-title{min-width:0;flex:1}.pharmacy-title h3{overflow:hidden;margin:0;color:#1c3022;font-size:14px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}.pharmacy-title p{margin:5px 0 0;color:#77857b;font-size:10px}.pharmacy-badge{margin-left:auto;padding:5px 7px;border:1px solid #dceee1;border-radius:999px;background:#f1faf4;color:#2e7950;font-size:8px;font-weight:850;white-space:nowrap}
  .pharmacy-info{display:grid;gap:9px;margin:0 16px;padding:13px 0;border-top:1px solid #edf1ed;border-bottom:1px solid #edf1ed}.pharmacy-info-row{display:flex;align-items:center;gap:8px;color:#65756a;font-size:10px}.pharmacy-info-icon{width:21px;height:21px;display:grid;place-items:center;border-radius:7px;background:#eff8f1;color:#168149;font-size:11px}.pharmacy-card-actions{display:flex;gap:8px;padding:13px 16px 16px}.pharmacy-action{flex:1;min-height:38px;padding:8px 10px;border:1px solid #dce9df;border-radius:11px;background:#fff;color:#42634c;font-size:10px;font-weight:850;transition:transform .18s,border-color .18s,color .18s,background .18s,box-shadow .18s}.pharmacy-action:hover{transform:translateY(-1px);border-color:#aad9b8;color:#137a43;box-shadow:0 5px 13px #126c3a15}.pharmacy-action.primary{border-color:#159b58;background:linear-gradient(135deg,#1db96c,#0f9250);color:#fff}.pharmacy-action.primary:hover{background:#0d7c43;box-shadow:0 7px 17px #159b5838}
  .pharmacy-note{margin-top:17px;padding:12px 14px;border:1px solid #f0e2c2;border-radius:13px;background:#fffbf1;color:#766642;font-size:10px;line-height:1.7}.pharmacy-empty{grid-column:1/-1;padding:36px 20px;border:1px dashed #cbdacf;border-radius:17px;color:#718076;text-align:center;font-size:13px;background:#ffffffad}
  .pharmacy-detail-backdrop{position:fixed;inset:0;z-index:260;display:grid;place-items:center;padding:18px;background:#07150dcc;backdrop-filter:blur(8px);animation:pharmacy-in .18s ease both}.pharmacy-detail{width:min(480px,100%);padding:22px;border:1px solid #ffffff60;border-radius:22px;background:linear-gradient(145deg,#fffffffa,#f3faf5f5);box-shadow:0 26px 85px #0005;animation:pharmacy-pop .22s cubic-bezier(.2,.75,.25,1) both}.pharmacy-detail-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.pharmacy-detail h2{margin:6px 0;color:#173321;font-size:22px;letter-spacing:-.04em}.pharmacy-close{width:34px;height:34px;border:1px solid #dce9df;border-radius:10px;background:#fff;color:#385343;font-size:18px;cursor:pointer}.pharmacy-detail p{color:#69796e;font-size:12px;line-height:1.75}.pharmacy-detail-actions{display:flex;gap:9px;margin-top:16px}.pharmacy-toast{position:fixed;z-index:300;left:50%;bottom:24px;max-width:calc(100% - 28px);transform:translateX(-50%);padding:12px 16px;border:1px solid #d4ebda;border-radius:13px;background:#f5fff7;color:#155b32;font-size:11px;font-weight:850;box-shadow:0 12px 32px #0b2c1930;animation:pharmacy-pop .2s ease both}
  @media(max-width:900px){.pharmacy-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pharmacy-hero:after{right:5%;width:115px;height:115px;font-size:58px}}
  @media(max-width:620px){.pharmacy-container{width:calc(100% - 28px)}.pharmacy-page{padding-top:22px}.pharmacy-hero{padding:23px 19px;border-radius:20px}.pharmacy-hero:after{right:12px;top:auto;bottom:12px;transform:rotate(-8deg);width:70px;height:70px;border-radius:19px;font-size:37px;opacity:.78}.pharmacy-hero h1{max-width:88%;font-size:34px}.pharmacy-hero p{max-width:82%;font-size:11px}.pharmacy-toolbar{flex-wrap:wrap;padding:8px}.pharmacy-search{flex-basis:100%}.pharmacy-select{flex:1}.pharmacy-grid{gap:9px}.pharmacy-card-top{gap:9px;padding:13px 11px 10px}.pharmacy-icon{width:43px;height:43px;border-radius:14px;font-size:20px}.pharmacy-title h3{font-size:12px}.pharmacy-title p{font-size:9px}.pharmacy-badge{padding:4px 5px;font-size:7px}.pharmacy-info{margin:0 11px;padding:11px 0;gap:8px}.pharmacy-info-row{font-size:9px}.pharmacy-card-actions{gap:6px;padding:10px 11px 12px}.pharmacy-action{padding:7px 5px;font-size:9px}}
  @media(max-width:390px){.pharmacy-grid{grid-template-columns:1fr}.pharmacy-hero h1{max-width:100%;font-size:31px}.pharmacy-hero p{max-width:100%;padding-right:38px}.pharmacy-card-top{padding:15px 14px 11px}.pharmacy-info{margin:0 14px}.pharmacy-card-actions{padding:11px 14px 14px}}
  @media(prefers-reduced-motion:reduce){.pharmacy-page *,.pharmacy-page *:before,.pharmacy-page *:after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
`;

export default function Pharmacies({ user, onNavigate }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All pharmacies");
  const [sort, setSort] = useState("nearest");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");
  const [location, setLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [watchingLocation, setWatchingLocation] = useState(false);
  const locationWatch = useRef(null);

  useEffect(() => () => {
    if (locationWatch.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(locationWatch.current);
  }, []);

  const listings = useMemo(() => {
    const term = query.trim().toLowerCase();
    return pharmacyData
      .filter((pharmacy) => !term || `${pharmacy.name} ${pharmacy.area}`.toLowerCase().includes(term))
      .filter((pharmacy) => filter !== "24-hour" || pharmacy.hours === "Open 24 hours")
      .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : a.km - b.km);
  }, [query, filter, sort]);

  function showMap(pharmacy) {
    const around = location ? ` near ${location.latitude},${location.longitude}` : "";
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pharmacy.name}, ${pharmacy.area}, Kenya${around}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function toggleLocation() {
    if (locationWatch.current !== null) {
      navigator.geolocation.clearWatch(locationWatch.current);
      locationWatch.current = null;
      setWatchingLocation(false);
      setLocationMessage("Live location paused. Your coordinates remain only in this page's memory.");
      return;
    }
    if (!navigator.geolocation) {
      setLocationMessage("This browser does not provide GPS location. Try a current browser over HTTPS.");
      return;
    }
    setLocationMessage("Waiting for your browser's location permission…");
    locationWatch.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy });
        setWatchingLocation(true);
        setLocationMessage(`Live location is active (about ±${Math.round(position.coords.accuracy)} m). Coordinates stay in page memory and are not sent to PharmaLink. Choosing a map link shares them with Google Maps.`);
      },
      (error) => {
        if (locationWatch.current !== null) navigator.geolocation.clearWatch(locationWatch.current);
        locationWatch.current = null;
        setWatchingLocation(false);
        setLocationMessage(error.code === 1 ? "Location permission was denied. You can enable it in your browser settings." : "Could not read your location. Check device location services and try again.");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  }

  function notify(message) {
    setToast(message);
    window.clearTimeout(window.__pharmalinkPharmacyToast);
    window.__pharmalinkPharmacyToast = window.setTimeout(() => setToast(""), 2400);
  }

  return (
    <main className="pharmacy-page">
      <style>{css}</style>
      <div className="pharmacy-container">
        <header className="pharmacy-hero pharmacy-in">
          <span className="pharmacy-kicker"><span aria-hidden="true">●</span> NEARBY PHARMACY DIRECTORY</span>
          <h1>Your local pharmacy, a little closer.</h1>
          <p>Explore example pharmacy listings by area and distance. Contact the pharmacy to confirm its address, opening hours and current medicine availability.</p>
        </header>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}><CartLink user={user} onNavigate={onNavigate} className="pharmacy-gps" label="View shared cart" /></div>
        <section className="pharmacy-toolbar pharmacy-in" aria-label="Search and sort pharmacies">
          <label className="pharmacy-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pharmacy or area" aria-label="Search pharmacies by name or area"/><button type="button" onClick={() => setQuery("")} aria-label="Clear pharmacy search" style={{border:0,background:'transparent',color:'#74877a',fontSize:16,cursor:'pointer'}}>×</button></label>
          <label style={{position:'absolute',width:1,height:1,padding:0,margin:-1,overflow:'hidden',clip:'rect(0,0,0,0)',whiteSpace:'nowrap',border:0}}>Sort pharmacies</label>
          <select className="pharmacy-select" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort pharmacies"><option value="nearest">Nearest first</option><option value="name">Name A–Z</option></select>
          <button type="button" className="pharmacy-gps" onClick={toggleLocation}>{watchingLocation ? "Pause live GPS" : location ? "Refresh GPS" : "Use my location"}</button>
        </section>
        {locationMessage&&<p className="pharmacy-location-message" role="status" aria-live="polite">{location&&<i className="pharmacy-live-dot"/>}{locationMessage}{location&&<> <button type="button" className="pharmacy-chip on" style={{marginLeft:7}} onClick={()=>window.open(`https://www.google.com/maps/search/pharmacy/@${location.latitude},${location.longitude},14z`,"_blank","noopener,noreferrer")}>Search pharmacies around me ↗</button></>}</p>}

        <div className="pharmacy-filter" role="group" aria-label="Filter pharmacies">
          {["All pharmacies", "24-hour"].map((item) => <button key={item} type="button" className={`pharmacy-chip${filter===item?' on':''}`} aria-pressed={filter===item} onClick={() => setFilter(item)}>{item === "24-hour" ? "Open 24 hours" : item}</button>)}
        </div>

        <div className="pharmacy-results-head"><div><h2>Pharmacies to explore</h2><p>Example locations · distance sorted for browsing</p></div><span className="pharmacy-count">{listings.length} sample {listings.length === 1 ? "listing" : "listings"}</span></div>

        <section className="pharmacy-grid" aria-label="Pharmacy listings">
          {listings.length ? listings.map((pharmacy, index) => <article className="pharmacy-card" key={pharmacy.id} style={{animationDelay:`${Math.min(index*55,220)}ms`}}>
            <div className="pharmacy-card-top"><span className={`pharmacy-icon ${pharmacy.tone}`} aria-hidden="true">{pharmacy.icon}</span><div className="pharmacy-title"><h3>{pharmacy.name}</h3><p>{pharmacy.area} · {pharmacy.km.toFixed(1)} km away</p></div><span className="pharmacy-badge">SAMPLE</span></div>
            <div className="pharmacy-info"><div className="pharmacy-info-row"><span className="pharmacy-info-icon" aria-hidden="true">◷</span><span>{pharmacy.hours}</span></div><div className="pharmacy-info-row"><span className="pharmacy-info-icon" aria-hidden="true">↗</span><span>Illustrative delivery estimate: {pharmacy.delivery}</span></div></div>
            <div className="pharmacy-card-actions"><button className="pharmacy-action" type="button" onClick={() => setSelected(pharmacy)}>Listing details</button><button className="pharmacy-action" type="button" onClick={() => onNavigate?.("find")}>Browse medicines</button><button className="pharmacy-action primary" type="button" onClick={() => showMap(pharmacy)}>Search map ↗</button></div>
          </article>) : <div className="pharmacy-empty">No sample pharmacies match this search. Try a different pharmacy name or area.</div>}
        </section>

        <aside className="pharmacy-note"><strong>Important:</strong> These names, locations, hours, distances and delivery estimates are illustrative and are not verified businesses or live availability. The map button performs a general name-and-area search, not a verified pharmacy pin. Please confirm directly with a licensed pharmacy.</aside>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginTop:19}}><button className="pharmacy-action" type="button" style={{flex:'0 0 auto',padding:'10px 14px'}} onClick={() => onNavigate?.('home')}>← Back to home</button><button className="pharmacy-action primary" type="button" style={{flex:'0 0 auto',padding:'10px 14px'}} onClick={() => onNavigate?.('find')}>Find a medicine →</button></div>
      </div>

      {selected && <div className="pharmacy-detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="pharmacy-detail" role="dialog" aria-modal="true" aria-labelledby="pharmacy-dialog-title"><div className="pharmacy-detail-head"><div><span className="pharmacy-kicker" style={{background:'#eaf8ef',borderColor:'#d5ecdc',color:'#18834a'}}>SAMPLE LISTING</span><h2 id="pharmacy-dialog-title">{selected.name}</h2></div><button className="pharmacy-close" type="button" aria-label="Close listing details" onClick={() => setSelected(null)}>×</button></div><p><strong>Area:</strong> {selected.area}<br/><strong>Example distance:</strong> {selected.km.toFixed(1)} km<br/><strong>Example hours:</strong> {selected.hours}<br/><strong>Illustrative delivery estimate:</strong> {selected.delivery}</p><p>These details are demonstration content, not verified business information. Call or visit a licensed pharmacy to confirm before relying on them.</p><div className="pharmacy-detail-actions"><button className="pharmacy-action primary" type="button" onClick={() => showMap(selected)}>Search map ↗</button><button className="pharmacy-action" type="button" onClick={() => setSelected(null)}>Close</button></div></section></div>}
      {toast && <div className="pharmacy-toast" role="status" aria-live="polite">{toast}</div>}
    </main>
  );
}
