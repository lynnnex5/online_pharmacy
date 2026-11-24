import { useEffect, useMemo, useRef, useState } from "react";

const categories = [
  { name: "All", icon: "✦" },
  { name: "Pain relief", icon: "✚" },
  { name: "Cold & allergy", icon: "✿" },
  { name: "Vitamins", icon: "☼" },
  { name: "First aid", icon: "＋" },
  { name: "Daily care", icon: "◉" },
];

const medicines = [
  { id: "m1", name: "Paracetamol 500mg", detail: "Tablets · pack of 20", category: "Pain relief", price: 55, pharmacy: "Afya Plus Pharmacy", time: "25–35 min", tag: "Popular" },
  { id: "m2", name: "Cetirizine 10mg", detail: "Tablets · pack of 10", category: "Cold & allergy", price: 80, pharmacy: "Karibu Chemist", time: "20–30 min", tag: "Good value" },
  { id: "m3", name: "Vitamin C 1000mg", detail: "Effervescent · pack of 10", category: "Vitamins", price: 420, pharmacy: "Afya Plus Pharmacy", time: "25–35 min", tag: "Top rated" },
  { id: "m4", name: "First aid essentials", detail: "Bandages · antiseptic · cotton", category: "First aid", price: 260, pharmacy: "Tumaini Pharmacy", time: "35–45 min", tag: "Everyday" },
  { id: "m5", name: "Ibuprofen 400mg", detail: "Tablets · pack of 20", category: "Pain relief", price: 110, pharmacy: "Karibu Chemist", time: "20–30 min", tag: "Popular" },
  { id: "m6", name: "Daily wellness care", detail: "Personal care essentials", category: "Daily care", price: 180, pharmacy: "Afya Plus Pharmacy", time: "25–35 min", tag: "Nearby" },
];

const pharmacies = [
  { name: "Afya Plus Pharmacy", area: "Town Centre", distance: "0.8 km", time: "25–35 min", rating: "4.8", tint: "#dff6e9", icon: "✚" },
  { name: "Karibu Chemist", area: "Market Road", distance: "1.4 km", time: "20–30 min", rating: "4.7", tint: "#fff0d7", icon: "＋" },
  { name: "Tumaini Pharmacy", area: "Hospital Road", distance: "2.3 km", time: "35–45 min", rating: "4.9", tint: "#e7eaff", icon: "✿" },
];

const faqs = [
  ["Are these pharmacy listings live?", "No. The prices, stock, ratings, distances and pharmacy details on this page are illustrative sample content."],
  ["Can I rely on the listed price or availability?", "Please contact the pharmacy to confirm current price, stock, opening hours and any prescription requirements before you travel."],
  ["Does PharmaLink give medical advice?", "No. This page is for browsing sample listings, not for diagnosis or treatment advice. Ask a licensed clinician or pharmacist about medicines."],
];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home({ user, onNavigate }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [basket, setBasket] = useState([]);
  const [toast, setToast] = useState("");
  const [openFaq, setOpenFaq] = useState(0);
  const [location, setLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [watchingLocation, setWatchingLocation] = useState(false);
  const locationWatch = useRef(null);
  const firstName = (user?.name || "there").trim().split(/\s+/)[0];

  useEffect(() => {
    const nodes = document.querySelectorAll(".ph-home .ph-section, .ph-home .ph-callout");
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) return undefined;
    nodes.forEach((node) => node.classList.add("ph-scroll-reveal"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("ph-is-visible", entry.isIntersecting));
    }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (locationWatch.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(locationWatch.current);
  }, []);

  function toggleLiveLocation() {
    if (locationWatch.current !== null) {
      navigator.geolocation.clearWatch(locationWatch.current);
      locationWatch.current = null;
      setWatchingLocation(false);
      setLocationMessage("Live location paused. Your location was not saved.");
      return;
    }
    if (!navigator.geolocation) {
      setLocationMessage("This browser does not provide location. Try a current browser over HTTPS.");
      return;
    }
    setLocationMessage("Requesting your permission…");
    locationWatch.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy });
        setWatchingLocation(true);
        setLocationMessage("Your coordinates stay in this page and are not sent to PharmaLink. Opening a map link shares them with Google Maps.");
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

  const visibleMedicines = useMemo(() => {
    const term = query.trim().toLowerCase();
    return medicines.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesQuery = !term || `${item.name} ${item.detail} ${item.category} ${item.pharmacy}`.toLowerCase().includes(term);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  function addToBasket(item) {
    setBasket((current) => [...current, item]);
    setToast(`${item.name} added to your demo basket`);
    window.clearTimeout(window.__pharmalinkToastTimer);
    window.__pharmalinkToastTimer = window.setTimeout(() => setToast(""), 2400);
  }

  function submitSearch(event) {
    event.preventDefault();
    setActiveCategory("All");
    if (query.trim()) {
      try { sessionStorage.setItem("pharmalink_search_query", query.trim()); } catch { /* storage may be unavailable */ }
    }
    if (onNavigate) {
      onNavigate("find");
      return;
    }
    scrollToSection("find");
  }

  return (
    <main className="ph-home">
      <style>{`
        .ph-home, .ph-home * { box-sizing: border-box; }
        .ph-home {
          --ph-green: #159b58; --ph-bright: #29c879; --ph-mint: #d8f7e5;
          --ph-ink: #14241a; --ph-muted: #69776d; --ph-line: #e7eee8;
          --ph-paper: #f6faf7; color: var(--ph-ink); background: #fff;
          font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
          padding-bottom: 32px; overflow: clip;
        }
        .ph-home button, .ph-home input { font: inherit; }
        .ph-home button { cursor: pointer; }
        .ph-container { width: min(1190px, calc(100% - 44px)); margin: 0 auto; }
        .ph-enter { animation: ph-rise .62s cubic-bezier(.2,.7,.25,1) both; }
        @keyframes ph-rise { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes ph-soft-glow { 0%,100% { box-shadow: 0 8px 24px #0b65341a } 50% { box-shadow: 0 12px 32px #0b653433 } }
        .ph-welcome { display:flex; justify-content:space-between; align-items:center; gap:20px; padding:24px 0 16px; }
        .ph-welcome h1 { margin:0; color:#13251a; font-size:clamp(23px,3vw,31px); line-height:1.18; letter-spacing:-.04em; font-weight:850; }
        .ph-welcome p { margin:7px 0 0; color:#718076; font-size:13px; }
        .ph-location { flex:0 0 auto; display:flex; align-items:center; gap:9px; padding:9px 10px; border:1px solid #e1ece4; border-radius:15px; background:linear-gradient(145deg,#ffffffed,#f4faf6e8); box-shadow:0 7px 22px #102d1910,inset 0 1px #fff; backdrop-filter:blur(12px); }
        .ph-location-pin { width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:#e7f8ee;color:#118448;font-size:17px; }
        .ph-location small { display:block;color:#869188;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase; }
        .ph-location strong { display:block;margin-top:2px;color:#25372a;font-size:12px; }
        .ph-location-actions { display:flex;align-items:center;gap:5px; }
        .ph-location-action { border:1px solid #cfe6d5;border-radius:9px;padding:7px 9px;background:#ecf9f0;color:#147b43;font-size:9px;font-weight:850;white-space:nowrap;transition:background .18s,box-shadow .18s,transform .18s; }
        .ph-location-action:hover { transform:translateY(-1px);background:#d9f3e2;box-shadow:0 0 16px #159b5826; }
        .ph-location-message { margin:-7px 0 12px auto;max-width:390px;color:#758278;font-size:10px;line-height:1.55;text-align:right;animation:ph-toast-in .2s ease both; }
        .ph-live-dot { display:inline-block;width:7px;height:7px;margin-right:5px;border-radius:50%;background:#20bd70;box-shadow:0 0 10px #20bd70;animation:ph-live-pulse 1.5s ease infinite; }
        @keyframes ph-live-pulse { 50% { opacity:.45;transform:scale(.8); } }
        .ph-hero { position:relative; isolation:isolate; min-height:270px; display:flex; align-items:center; overflow:hidden; border-radius:25px; padding:clamp(27px,5vw,58px); background:radial-gradient(ellipse at 83% 14%,#66dfa06b,transparent 29%),linear-gradient(115deg,#123d27,#0d6037 61%,#148c4d); color:#fff; animation:ph-rise .65s ease both; }
        .ph-hero::before,.ph-hero::after { content:'';position:absolute;z-index:-1;border:1px solid #ffffff18;border-radius:50%; }
        .ph-hero::before { width:330px;height:330px;right:3%;top:-135px; }
        .ph-hero::after { width:230px;height:230px;right:13%;bottom:-150px; }
        .ph-hero-copy { width:min(600px,100%); }
        .ph-kicker { display:inline-flex;align-items:center;gap:8px;padding:7px 11px;border:1px solid #ffffff38;border-radius:99px;background:#ffffff15;color:#e6ffef;font-size:11px;font-weight:750;letter-spacing:.025em; }
        .ph-kicker-dot { width:7px;height:7px;border-radius:50%;background:#8df4b7;box-shadow:0 0 12px #8df4b7; }
        .ph-hero h2 { max-width:570px;margin:16px 0 10px;color:#fff;font-size:clamp(30px,5vw,52px);font-weight:900;line-height:1.04;letter-spacing:-.055em; }
        .ph-hero h2 span { color:#b7f5cf; }
        .ph-hero p { max-width:500px;margin:0;color:#d5efde;font-size:14px;line-height:1.7; }
        .ph-search { display:flex;align-items:center;gap:9px;max-width:590px;margin-top:22px;padding:6px 7px 6px 15px;border:1px solid #ffffff4c;border-radius:15px;background:#fff;box-shadow:0 12px 35px #062c1938; }
        .ph-search-icon { color:#648071;font-size:19px; }
        .ph-search input { flex:1;min-width:0;border:0;outline:0;padding:9px 0;color:#26372c;background:transparent;font-size:13px; }
        .ph-search input::placeholder { color:#92a098; }
        .ph-search button { min-height:42px;padding:0 16px;border:0;border-radius:11px;background:#159b58;color:#fff;font-size:12px;font-weight:800;transition:background .2s,transform .2s,box-shadow .2s; }
        .ph-search button:hover { background:#0d8148;transform:translateY(-1px);box-shadow:0 7px 16px #126c3a38; }
        .ph-hero-aside { position:absolute;right:8%;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:165px;height:165px;border:1px solid #ffffff35;border-radius:34px;background:linear-gradient(145deg,#ffffff26,#ffffff08);box-shadow:inset 0 1px #ffffff30,0 16px 45px #082d1933;backdrop-filter:blur(10px);animation:ph-soft-glow 4s ease infinite; }
        .ph-bag-icon { width:92px;height:92px;display:grid;place-items:center;border-radius:27px;background:#effff4;color:#137b43;font-size:46px;transform:rotate(-7deg);box-shadow:0 14px 28px #062c1940; }
        .ph-bubble { position:absolute;right:-16px;bottom:13px;padding:8px 12px;border:1px solid #ffffff70;border-radius:12px;background:#fff;color:#185534;font-size:11px;font-weight:850;box-shadow:0 8px 24px #062c1935; }
        .ph-section { padding-top:43px;scroll-margin-top:86px; }
        .ph-scroll-reveal { opacity:0; transform:translateY(17px); filter:blur(2px); transition:opacity .55s ease,transform .55s cubic-bezier(.2,.7,.25,1),filter .55s ease; }
        .ph-scroll-reveal.ph-is-visible { opacity:1; transform:none; filter:blur(0); }
        .ph-section-head { display:flex;justify-content:space-between;align-items:end;gap:14px;margin-bottom:18px; }
        .ph-eyebrow { color:#17864b;font-size:10px;font-weight:850;letter-spacing:.12em;text-transform:uppercase; }
        .ph-section-head h2 { margin:5px 0 0;color:#17291d;font-size:clamp(20px,3vw,27px);font-weight:850;letter-spacing:-.04em; }
        .ph-section-head p { margin:5px 0 0;color:#7b887e;font-size:12px;line-height:1.6; }
        .ph-text-button { border:0;padding:7px 0;background:none;color:#148449;font-size:12px;font-weight:800;white-space:nowrap; }
        .ph-text-button:hover { color:#0a6033;text-decoration:underline;text-underline-offset:4px; }
        .ph-category-row { display:flex;gap:10px;overflow-x:auto;padding:3px 2px 10px;scrollbar-width:thin; }
        .ph-category { flex:0 0 auto;display:flex;align-items:center;gap:9px;min-height:49px;padding:8px 14px;border:1px solid #e6eee7;border-radius:15px;background:#fff;color:#58685d;font-size:12px;font-weight:750;box-shadow:0 3px 12px #102d1908;transition:transform .2s,border-color .2s,background .2s,color .2s,box-shadow .2s; }
        .ph-category:hover { transform:translateY(-2px);border-color:#abd9bb;box-shadow:0 8px 18px #102d1912; }
        .ph-category.is-active { border-color:#a5dabb;background:#eaf8ef;color:#137b43;box-shadow:0 0 0 2px #20c77a12; }
        .ph-category-icon { width:29px;height:29px;display:grid;place-items:center;border-radius:10px;background:#eff8f1;color:#21864d;font-size:15px; }
        .ph-category.is-active .ph-category-icon { background:#d4f2df; }
        .ph-product-grid { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px; }
        .ph-product { overflow:hidden;border:1px solid #e6eee7;border-radius:18px;background:#fff;box-shadow:0 5px 18px #102d1909;transition:transform .22s,border-color .22s,box-shadow .22s; }
        .ph-product:hover { transform:translateY(-4px);border-color:#c2e5ce;box-shadow:0 14px 30px #102d1914; }
        .ph-product-art { position:relative;height:118px;display:grid;place-items:center;overflow:hidden;background:linear-gradient(135deg,#eaf8ef,#f6fbf7); }
        .ph-product-art::before { content:'';position:absolute;width:140px;height:140px;right:-28px;top:-68px;border-radius:50%;background:#bce9ca88; }
        .ph-product-symbol { position:relative;width:67px;height:67px;display:grid;place-items:center;border:1px solid #d9eddf;border-radius:21px;background:#ffffffd9;color:#18834a;font-size:31px;box-shadow:0 8px 22px #155f3219;transform:rotate(-5deg); }
        .ph-product-tag { position:absolute;left:12px;top:12px;padding:5px 8px;border-radius:99px;background:#fff;color:#407153;font-size:9px;font-weight:800;box-shadow:0 3px 9px #102d1910; }
        .ph-product-body { padding:14px; }
        .ph-product h3 { margin:0;color:#1d2e23;font-size:14px;font-weight:850; }
        .ph-product-detail { margin:5px 0 10px;color:#7e8a81;font-size:11px; }
        .ph-product-pharmacy { display:flex;align-items:center;gap:6px;color:#67786c;font-size:10px; }
        .ph-product-pharmacy b { color:#53665a;font-weight:750; }
        .ph-product-bottom { display:flex;justify-content:space-between;align-items:center;gap:9px;margin-top:13px;padding-top:12px;border-top:1px solid #edf1ed; }
        .ph-price { color:#183723;font-size:15px;font-weight:900; }
        .ph-price small { color:#839087;font-size:9px;font-weight:600; }
        .ph-add { width:34px;height:34px;display:grid;place-items:center;border:1px solid #bee3ca;border-radius:11px;background:#eaf8ef;color:#127841;font-size:20px;font-weight:700;transition:transform .18s,background .18s,color .18s; }
        .ph-add:hover { transform:scale(1.06);background:#159b58;color:#fff; }
        .ph-empty { grid-column:1/-1;padding:30px;border:1px dashed #cbdacf;border-radius:17px;color:#738178;text-align:center;font-size:13px; }
        .ph-pharmacy-grid { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px; }
        .ph-pharmacy { display:flex;align-items:center;gap:13px;padding:15px;border:1px solid #e6eee7;border-radius:17px;background:#fff;box-shadow:0 4px 15px #102d1908;transition:transform .2s,box-shadow .2s; }
        .ph-pharmacy:hover { transform:translateY(-3px);box-shadow:0 12px 24px #102d1911; }
        .ph-pharmacy-mark { flex:0 0 auto;width:52px;height:52px;display:grid;place-items:center;border-radius:16px;font-size:23px;font-weight:900;color:#28764a; }
        .ph-pharmacy-copy { min-width:0;flex:1; }
        .ph-pharmacy h3 { overflow:hidden;margin:0;color:#203126;font-size:12px;font-weight:850;text-overflow:ellipsis;white-space:nowrap; }
        .ph-pharmacy p { margin:5px 0 0;color:#7b897f;font-size:10px; }
        .ph-rating { display:inline-flex;align-items:center;gap:4px;margin-top:7px;color:#526458;font-size:10px;font-weight:750; }
        .ph-rating span { color:#e8a12a; }
        .ph-note { margin-top:15px;color:#8a958d;font-size:10px;line-height:1.6; }
        .ph-callout { display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:38px;padding:22px 24px;border:1px solid #d7eadc;border-radius:19px;background:linear-gradient(100deg,#f0faf3,#f8fcf9); }
        .ph-callout h2 { margin:0;color:#183623;font-size:18px;font-weight:850;letter-spacing:-.03em; }
        .ph-callout p { margin:6px 0 0;color:#6e7e72;font-size:12px;line-height:1.6; }
        .ph-callout button { flex:0 0 auto;min-height:41px;padding:0 15px;border:0;border-radius:12px;background:#159b58;color:#fff;font-size:11px;font-weight:850;transition:background .2s,transform .2s; }
        .ph-callout button:hover { transform:translateY(-1px);background:#0e7d45; }
        .ph-toast { position:fixed;z-index:150;left:50%;bottom:24px;transform:translateX(-50%);max-width:calc(100% - 28px);padding:12px 17px;border:1px solid #d2ebda;border-radius:13px;background:#f4fff7;color:#155c32;font-size:12px;font-weight:800;box-shadow:0 12px 32px #0b2c1930;animation:ph-toast-in .22s ease both; }
        @keyframes ph-toast-in { from { opacity:0; transform:translate(-50%,10px) } to { opacity:1; transform:translate(-50%,0) } }
        @media (max-width:900px) { .ph-product-grid,.ph-pharmacy-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .ph-hero-aside { right:5%;width:125px;height:125px;border-radius:27px; } .ph-bag-icon { width:72px;height:72px;border-radius:22px;font-size:36px; } .ph-hero-copy { width:72%; } }
        @media (max-width:620px) { .ph-container { width:calc(100% - 28px); } .ph-welcome { align-items:flex-start;padding:19px 0 14px; } .ph-location { gap:6px;padding:7px; } .ph-location-actions { flex-direction:column;align-items:stretch; } .ph-location-action { padding:5px 6px;font-size:8px; } .ph-location-pin { width:29px;height:29px; } .ph-location strong { max-width:92px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px; } .ph-location small { font-size:8px; } .ph-location-message { font-size:9px; } .ph-hero { min-height:300px;align-items:flex-start;padding:25px 19px;border-radius:21px; } .ph-hero-copy { width:100%; } .ph-hero h2 { max-width:390px;font-size:clamp(32px,9vw,45px); } .ph-hero p { max-width:380px;font-size:12px; } .ph-hero-aside { width:78px;height:78px;right:16px;top:auto;bottom:14px;transform:none;border-radius:20px;opacity:.82; } .ph-bag-icon { width:49px;height:49px;border-radius:15px;font-size:25px; } .ph-bubble { right:-8px;bottom:-5px;padding:6px 8px;font-size:8px; } .ph-search { margin-top:18px;gap:6px;padding-left:11px; } .ph-search input { font-size:11px; } .ph-search button { min-height:39px;padding:0 11px;font-size:10px; } .ph-section { padding-top:34px;scroll-margin-top:72px; } .ph-section-head { align-items:flex-start; } .ph-product-grid { grid-template-columns:repeat(2,minmax(0,1fr));gap:10px; } .ph-product-art { height:94px; } .ph-product-body { padding:11px; } .ph-product h3 { font-size:12px; } .ph-product-detail { font-size:9px;line-height:1.4; } .ph-product-pharmacy { font-size:9px; } .ph-product-bottom { margin-top:10px;padding-top:9px; } .ph-price { font-size:13px; } .ph-add { width:31px;height:31px; } .ph-pharmacy-grid { grid-template-columns:1fr; } .ph-pharmacy { padding:12px; } .ph-callout { align-items:flex-start;flex-direction:column;margin-top:28px;padding:18px; } }
        @media (max-width:380px) { .ph-welcome h1 { font-size:21px; } .ph-location { max-width:132px; } .ph-product-grid { grid-template-columns:1fr; } .ph-product-art { height:112px; } .ph-product-body { padding:14px; } }
        @media (prefers-reduced-motion:reduce) { .ph-home *, .ph-home *::before, .ph-home *::after { animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important; } }
      `}</style>

      <div className="ph-container">
        <header className="ph-welcome ph-enter">
          <div>
            <h1>{firstName === "there" ? "Good to see you" : `Good to see you, ${firstName}`} <span aria-hidden="true">✦</span></h1>
            <p>Your nearby pharmacy picks, all in one place.</p>
          </div>
          <div className="ph-location" aria-label="Your location settings">
            <span className="ph-location-pin" aria-hidden="true">⌖</span>
            <span><small>{location ? <><i className="ph-live-dot"/>LIVE LOCATION</> : "LOCATION"}</small><strong>{location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Set your area"}</strong></span>
            <span className="ph-location-actions"><button className="ph-location-action" type="button" onClick={toggleLiveLocation}>{watchingLocation ? "Pause GPS" : location ? "Refresh GPS" : "Use GPS"}</button>{location&&<button className="ph-location-action" type="button" onClick={()=>window.open(`https://www.google.com/maps/search/pharmacy/@${location.latitude},${location.longitude},14z`,"_blank","noopener,noreferrer")}>Map ↗</button>}</span>
          </div>
        </header>
        {locationMessage&&<p className="ph-location-message" role="status" aria-live="polite">{locationMessage}</p>}

        <section className="ph-hero" aria-labelledby="ph-hero-title">
          <div className="ph-hero-copy">
            <span className="ph-kicker"><i className="ph-kicker-dot" /> YOUR HEALTH, A LITTLE CLOSER</span>
            <h2 id="ph-hero-title">Find what you need.<br/><span>From pharmacies nearby.</span></h2>
            <p>Explore sample medicine listings and nearby pharmacy options. Check availability with the pharmacy before you travel.</p>
            <form className="ph-search" role="search" onSubmit={submitSearch}>
              <span className="ph-search-icon" aria-hidden="true">⌕</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search medicines or health essentials" aria-label="Search medicines or health essentials" />
              <button type="submit">Search</button>
            </form>
          </div>
          <div className="ph-hero-aside" aria-hidden="true"><div className="ph-bag-icon">✚</div><span className="ph-bubble">Nearby picks</span></div>
        </section>

        <section className="ph-section" aria-labelledby="ph-categories-title">
          <div className="ph-section-head"><div><div className="ph-eyebrow">Browse your way</div><h2 id="ph-categories-title">What are you looking for?</h2></div></div>
          <div className="ph-category-row" role="group" aria-label="Filter by category">
            {categories.map((category) => <button key={category.name} type="button" className={`ph-category${activeCategory === category.name ? " is-active" : ""}`} aria-pressed={activeCategory === category.name} onClick={() => { setActiveCategory(category.name); scrollToSection("find"); }}><span className="ph-category-icon" aria-hidden="true">{category.icon}</span>{category.name}</button>)}
          </div>
        </section>

        <section id="find" className="ph-section" aria-labelledby="ph-find-title">
          <div className="ph-section-head">
            <div><div className="ph-eyebrow">Handy nearby finds</div><h2 id="ph-find-title">Popular right now</h2><p>Example catalogue listings · Sample prices in KES</p></div>
            <button className="ph-text-button" type="button" onClick={() => onNavigate ? onNavigate("find") : scrollToSection("find")}>Find all medicines →</button>
          </div>
          <div className="ph-product-grid">
            {visibleMedicines.length ? visibleMedicines.map((item) => <article className="ph-product" key={item.id}>
              <div className="ph-product-art"><span className="ph-product-tag">{item.tag}</span><span className="ph-product-symbol" aria-hidden="true">{item.category === "Vitamins" ? "☼" : item.category === "First aid" ? "＋" : item.category === "Cold & allergy" ? "✿" : "✚"}</span></div>
              <div className="ph-product-body"><h3>{item.name}</h3><p className="ph-product-detail">{item.detail}</p><div className="ph-product-pharmacy"><span aria-hidden="true">⌖</span><b>{item.pharmacy}</b><span>· {item.time}</span></div><div className="ph-product-bottom"><span className="ph-price">KES {item.price.toLocaleString("en-KE")} <small>sample</small></span><button className="ph-add" type="button" aria-label={`Add ${item.name} to demo basket`} onClick={() => addToBasket(item)}>+</button></div></div>
            </article>) : <div className="ph-empty">No sample items match that search. Try another name or choose “All”.</div>}
          </div>
          <p className="ph-note">Sample catalogue only. This page does not confirm stock, provide a diagnosis, or process orders or payments. Ask a licensed pharmacist about medicine suitability and prescription requirements.</p>
        </section>

        <section id="pharmacies" className="ph-section" aria-labelledby="ph-pharmacies-title">
          <div className="ph-section-head"><div><div className="ph-eyebrow">Around you</div><h2 id="ph-pharmacies-title">Pharmacies to explore</h2><p>Illustrative nearby listings · details are not verified</p></div><button className="ph-text-button" type="button" onClick={() => window.open("https://www.google.com/maps/search/pharmacy+near+Town+Centre+Kenya", "_blank", "noopener,noreferrer")}>Explore map ↗</button></div>
          <div className="ph-pharmacy-grid">{pharmacies.map((pharmacy) => <article className="ph-pharmacy" key={pharmacy.name}><div className="ph-pharmacy-mark" style={{background:pharmacy.tint}} aria-hidden="true">{pharmacy.icon}</div><div className="ph-pharmacy-copy"><h3>{pharmacy.name}</h3><p>{pharmacy.area} · {pharmacy.distance} · {pharmacy.time}</p><span className="ph-rating"><span aria-hidden="true">★</span>{pharmacy.rating} <span style={{color:"#9aa59c",fontWeight:500}}>sample rating</span></span></div></article>)}</div>
          <p className="ph-note">Pharmacy names, distances, ratings and opening details shown here are example content, not verified business information.</p>
        </section>

        <section id="how" className="ph-callout"><div><h2>A little easier, one step at a time.</h2><p>Compare sample listings, then contact a licensed pharmacy to confirm availability before making a trip.</p></div><button type="button" onClick={() => scrollToSection("find")}>Explore listings →</button></section>

        <section id="restock" className="ph-callout" style={{marginTop:16,background:'linear-gradient(110deg,#f6f8ff,#fbfcff)',borderColor:'#e3e6f4'}}>
          <div><h2>Are you a pharmacy partner?</h2><p>Pharmacy and organization accounts use their own dedicated workspace. Sign in with your organization account to access that view.</p></div>
          <button type="button" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>Back to top ↑</button>
        </section>

        <section id="faq" className="ph-section" aria-labelledby="ph-faq-title">
          <div className="ph-section-head"><div><div className="ph-eyebrow">A few useful notes</div><h2 id="ph-faq-title">Frequently asked questions</h2></div></div>
          <div style={{display:'grid',gap:10,maxWidth:820}}>
            {faqs.map(([question,answer],index)=><article key={question} style={{border:'1px solid #e6eee7',borderRadius:15,background:'#fff',overflow:'hidden'}}>
              <button type="button" aria-expanded={openFaq===index} onClick={()=>setOpenFaq(openFaq===index?-1:index)} style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,padding:'15px 17px',border:0,background:'transparent',color:'#203126',fontSize:13,fontWeight:800,textAlign:'left',cursor:'pointer'}}>{question}<span style={{color:'#159b58',fontSize:18}}>{openFaq===index?'−':'+'}</span></button>
              {openFaq===index&&<p style={{padding:'0 17px 16px',margin:0,color:'#718076',fontSize:12,lineHeight:1.75}}>{answer}</p>}
            </article>)}
          </div>
        </section>
      </div>
      {basket.length > 0 && <div className="ph-toast" role="status" aria-live="polite">{toast || `${basket.length} item${basket.length === 1 ? "" : "s"} in your demo basket`}</div>}
    </main>
  );
}
