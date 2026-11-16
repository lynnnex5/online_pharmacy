import { useState, useEffect, useMemo, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Settings                                                           */
/* ------------------------------------------------------------------ */

const BRAND = "PharmaLink";
const LOGO_SRC = "/logo.png";
const DELIVERY_FEE = 150; /* sample flat fee per pharmacy */
const MPESA_SIMULATION_ONLY = true; // Local presentation mode; no Safaricom request and no funds movement.
const ADMIN_DEMO_PASSWORD = "123456789"; // Demo-only client-side gate; replace with server auth before deployment.
const ORDERS_KEY = "pharmalink_demo_orders_v1";
const PAYMENT_EVENTS_KEY = "pharmalink_simulated_payment_events_v1";
const CONFIG_KEY = "pharmalink_demo_integration_config_v1";
const HOSPITAL_IMAGE = "/kenya-hospital-illustration-optimized.jpg";
const MEDICINE_IMAGE = "/medicine-assortment-illustration-optimized.jpg";
const readLocal = (key, fallback) => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
};
const csvEscape = (value) => {
  const text = String(value ?? "");
  const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
};

/* Images from /public (no "public/" in the URL) */
const HERO = [HOSPITAL_IMAGE, MEDICINE_IMAGE];
const IMG_WHO = HOSPITAL_IMAGE;
const IMG_CTA = MEDICINE_IMAGE;

const NAV = [
  ["Home", "home"],
  ["Find medicine", "find"],
  ["Pharmacies", "pharmacies"],
  ["How it works", "how"],
  ["For pharmacies", "restock"],
  ["FAQ", "faq"],
];

/* ------------------------------------------------------------------ */
/*  Sample data (replace with your PHP/MySQL API later)                */
/* ------------------------------------------------------------------ */

const PHARMACIES = [
  { id: "afya", name: "Afya Plus Pharmacy", area: "Town Centre", km: 0.8, hours: "8:00 AM – 9:00 PM", delivery: "30–45 min" },
  { id: "karibu", name: "Karibu Chemist", area: "Market Road", km: 1.4, hours: "Open 24 hours", delivery: "40–60 min" },
  { id: "tumaini", name: "Tumaini Pharmacy", area: "Hospital Road", km: 2.3, hours: "7:30 AM – 8:00 PM", delivery: "45–60 min" },
  { id: "mwanga", name: "Mwanga Pharmacy", area: "Station Road", km: 3.6, hours: "8:00 AM – 10:00 PM", delivery: "60–75 min" },
  { id: "upendo", name: "Upendo Chemists", area: "Estate Gate", km: 5.1, hours: "8:30 AM – 7:30 PM", delivery: "75–90 min" },
];

/* offers: pharmacyId -> [price in KES, units in stock] */
const MEDS = [
  { id: "m1", name: "Paracetamol 500mg", form: "Tablets, pack of 20", cat: "Pain & fever", rx: false,
    offers: { afya: [60, 48], karibu: [55, 120], tumaini: [70, 0], mwanga: [50, 30], upendo: [65, 12] } },
  { id: "m2", name: "Ibuprofen 400mg", form: "Tablets, pack of 20", cat: "Pain & fever", rx: false,
    offers: { afya: [120, 25], karibu: [110, 60], tumaini: [130, 8], mwanga: [105, 0] } },
  { id: "m3", name: "Amoxicillin 500mg", form: "Capsules, pack of 21", cat: "Antibiotics", rx: true,
    offers: { afya: [380, 6], karibu: [350, 40], tumaini: [400, 15], upendo: [360, 0] } },
  { id: "m4", name: "Metformin 500mg", form: "Tablets, pack of 30", cat: "Chronic care", rx: true,
    offers: { afya: [250, 22], karibu: [230, 35], mwanga: [240, 9], upendo: [260, 18] } },
  { id: "m5", name: "Amlodipine 5mg", form: "Tablets, pack of 30", cat: "Chronic care", rx: true,
    offers: { afya: [300, 14], tumaini: [280, 26], mwanga: [310, 0], upendo: [290, 11] } },
  { id: "m6", name: "Cetirizine 10mg", form: "Tablets, pack of 10", cat: "Allergy", rx: false,
    offers: { afya: [90, 30], karibu: [80, 52], tumaini: [95, 20], mwanga: [85, 7] } },
  { id: "m7", name: "Salbutamol Inhaler 100mcg", form: "200 doses", cat: "Respiratory", rx: true,
    offers: { karibu: [650, 10], tumaini: [620, 5], mwanga: [670, 0] } },
  { id: "m8", name: "Vitamin C 1000mg", form: "Effervescent, pack of 10", cat: "Vitamins", rx: false,
    offers: { afya: [450, 18], karibu: [420, 33], upendo: [440, 9] } },
  { id: "m9", name: "ORS Sachets", form: "Pack of 10", cat: "Rehydration", rx: false,
    offers: { afya: [180, 40], karibu: [160, 75], tumaini: [170, 0], mwanga: [165, 22], upendo: [175, 16] } },
  { id: "m10", name: "Omeprazole 20mg", form: "Capsules, pack of 14", cat: "Stomach", rx: false,
    offers: { afya: [200, 12], karibu: [185, 28], tumaini: [210, 0], mwanga: [190, 14] } },
];

const MEDICINE_INFO = {
  m1: {
    shortUse: "Pain relief and fever reduction (general information).",
    whatItIs: "Paracetamol (also called acetaminophen) is a pain reliever and fever reducer. Strength and approved uses depend on the specific product label.",
    commonUses: ["Temporary relief of mild to moderate pain, such as headache or toothache.", "Temporary reduction of fever. Product indications vary by label."],
    safetyNotes: ["Too much can cause severe liver injury. Check all medicines for duplicate paracetamol/acetaminophen ingredients.", "Liver disease, heavy alcohol use, pregnancy, or other medicines may affect suitability; consult a clinician or pharmacist."],
    disclaimer: "This does not identify the cause of pain or fever or determine the right medicine for a person. Follow the product label and professional advice; overdose may be an emergency.",
    sources: [{title:"MedlinePlus: Acetaminophen Drug Information",url:"https://medlineplus.gov/druginfo/meds/a681004.html"},{title:"FDA: Acetaminophen",url:"https://www.fda.gov/drugs/safe-use-over-counter-pain-relievers-and-fever-reducers/acetaminophen"},{title:"NHS: Paracetamol for adults",url:"https://www.nhs.uk/medicines/paracetamol-for-adults/"}],
  },
  m2: {
    shortUse: "Pain, fever, and inflammation relief (general information).",
    whatItIs: "Ibuprofen is a non-steroidal anti-inflammatory drug (NSAID) that can reduce pain, fever, and inflammation. Product approvals differ.",
    commonUses: ["Some products are used for short-term pain or fever.", "Some prescription products have additional uses for inflammatory conditions; use depends on clinical assessment and the label."],
    safetyNotes: ["NSAIDs can cause serious stomach or intestinal bleeding and may increase cardiovascular risks.", "Ask a professional first with a history of ulcers, bleeding, kidney, liver or heart problems, NSAID allergy, pregnancy, or use of blood thinners or other NSAIDs."],
    disclaimer: "This information cannot determine whether ibuprofen is suitable. Follow the specific label and ask a clinician or pharmacist, especially if you have other conditions or take other medicines.",
    sources: [{title:"MedlinePlus: Ibuprofen Drug Information",url:"https://medlineplus.gov/druginfo/meds/a682159.html"},{title:"NHS: Ibuprofen for adults",url:"https://www.nhs.uk/medicines/ibuprofen-for-adults/"},{title:"FDA: Nonsteroidal Anti-inflammatory Drugs",url:"https://www.fda.gov/drugs/postmarket-drug-safety-information-patients-and-providers/nonsteroidal-anti-inflammatory-drugs-nsaids"}],
  },
  m3: {
    shortUse: "Antibiotic for certain bacterial infections only when prescribed.",
    whatItIs: "Amoxicillin is a penicillin-class antibiotic used against certain susceptible bacteria. It does not treat viral infections such as colds or flu.",
    commonUses: ["A clinician may prescribe it for certain bacterial infections, depending on diagnosis, local guidance, and the product label.", "Some regimens use it with other medicines for specific infections; it is not appropriate for every infection."],
    safetyNotes: ["A serious allergy to penicillin or related antibiotics can make it unsafe; seek urgent help for severe allergic symptoms.", "Antibiotics should only be used when prescribed for a bacterial infection. Unnecessary use contributes to antimicrobial resistance.", "Persistent or severe diarrhoea, rash, or other unexpected effects require professional advice."],
    disclaimer: "Do not self-diagnose or use leftover antibiotics. A clinician determines whether an infection is bacterial and which treatment is appropriate.",
    sources: [{title:"MedlinePlus: Amoxicillin Drug Information",url:"https://medlineplus.gov/druginfo/meds/a685001.html"},{title:"DailyMed: Amoxicillin capsule prescribing information",url:"https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=80a04b8a-110e-0aea-e053-2a91aa0ad057"}],
  },
  m4: {
    shortUse: "Blood-glucose medicine used in type 2 diabetes care.",
    whatItIs: "Metformin is a biguanide medicine that helps lower blood glucose. Formulations and approved uses vary by product.",
    commonUses: ["Often used as part of care for type 2 diabetes, alongside an individualized care plan.", "A clinician may use it with other treatments depending on the person and product label."],
    safetyNotes: ["Rarely, metformin can cause serious lactic acidosis; kidney function and acute illness or dehydration are important safety considerations.", "Tell a clinician about kidney or liver problems, heart conditions, heavy alcohol use, other medicines, and planned imaging procedures.", "Stomach upset can occur; longer-term use may be associated with low vitamin B12."],
    disclaimer: "Only a qualified clinician can diagnose diabetes and decide whether metformin is appropriate. This card is not a treatment plan.",
    sources: [{title:"MedlinePlus: Metformin Drug Information",url:"https://medlineplus.gov/druginfo/meds/a696005.html"},{title:"NHS: About metformin",url:"https://www.nhs.uk/medicines/metformin/about-metformin/"},{title:"FDA: Glucophage prescribing information",url:"https://www.accessdata.fda.gov/drugsatfda_docs/label/2017/020357s037s039,021202s021s023lbl.pdf"}],
  },
  m5: {
    shortUse: "Blood-pressure and certain heart-related conditions (clinician assessed).",
    whatItIs: "Amlodipine is a calcium-channel blocker that relaxes blood vessels. The 5 mg listing is a sample strength, not a recommendation.",
    commonUses: ["May be prescribed for high blood pressure.", "Some product labels include certain types of angina or coronary artery disease."],
    safetyNotes: ["Swelling of the ankles, dizziness, flushing, or headache can occur.", "Heart or liver conditions, pregnancy, breastfeeding, allergies, and medicine interactions should be reviewed by a professional.", "Worsening chest pain, fainting, or serious allergic symptoms need prompt medical assessment."],
    disclaimer: "High blood pressure often has no symptoms. A clinician must assess blood pressure and medical history before treatment decisions.",
    sources: [{title:"MedlinePlus: Amlodipine Drug Information",url:"https://medlineplus.gov/druginfo/meds/a692044.html"},{title:"NHS: Amlodipine",url:"https://www.nhs.uk/medicines/amlodipine/"},{title:"FDA: Norvasc prescribing information",url:"https://www.accessdata.fda.gov/drugsatfda_docs/label/2011/019787s047lbl.pdf"}],
  },
  m6: {
    shortUse: "Antihistamine for some allergy symptoms and hives.",
    whatItIs: "Cetirizine is an antihistamine that blocks histamine involved in some allergy symptoms. Uses depend on product labeling.",
    commonUses: ["Some products are used for sneezing, runny nose, itchy or watery eyes, and other allergy symptoms.", "Some labels include relief of hives (urticaria)."],
    safetyNotes: ["It may cause drowsiness or tiredness; alcohol and sedating medicines can increase this effect.", "Kidney or liver conditions, pregnancy, breastfeeding, or allergy to cetirizine or related ingredients warrant professional advice."],
    disclaimer: "Allergy-like symptoms can have other causes. Seek emergency care for trouble breathing or swelling of the face, lips, or tongue.",
    sources: [{title:"MedlinePlus: Cetirizine Drug Information",url:"https://medlineplus.gov/druginfo/meds/a623043.html"},{title:"NHS: About cetirizine",url:"https://www.nhs.uk/medicines/cetirizine/about-cetirizine/"},{title:"DailyMed: Cetirizine 10 mg label",url:"https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=d78223ba-80d5-47f8-e053-2a95a90aebdb"}],
  },
  m7: {
    shortUse: "Inhaled reliever for certain asthma/COPD symptoms when prescribed.",
    whatItIs: "Salbutamol (called albuterol in the United States) is a short-acting bronchodilator inhaled to relax airway muscles. Products and devices vary.",
    commonUses: ["A clinician may prescribe it for wheezing or breathing difficulty associated with asthma or COPD, according to the product label.", "Some labels include prevention of exercise-related breathing symptoms."],
    safetyNotes: ["Use only as directed for the specific inhaler; device technique matters.", "Tremor, nervousness, or a fast heartbeat can occur. Heart rhythm or heart disease, high blood pressure, thyroid disease, diabetes, and other medicines should be discussed with a clinician.", "Worsening breathing or a reliever seeming less effective needs prompt clinical advice."],
    disclaimer: "Breathlessness can be an emergency and has many causes. This card is not a diagnosis or inhaler instruction; follow the prescribed plan and device leaflet.",
    sources: [{title:"NHS: About salbutamol inhalers",url:"https://www.nhs.uk/medicines/salbutamol-inhaler/about-salbutamol-inhalers/"},{title:"MedlinePlus: Albuterol Oral Inhalation",url:"https://medlineplus.gov/druginfo/meds/a682145.html"},{title:"FDA: ProAir HFA label",url:"https://www.accessdata.fda.gov/drugsatfda_docs/label/2019/021457s036lbl.pdf"}],
  },
  m8: {
    shortUse: "Vitamin C supplement; use depends on dietary need and product label.",
    whatItIs: "Vitamin C (ascorbic acid) is a nutrient involved in collagen formation and other normal body functions. A supplement is not a substitute for a balanced diet or clinical assessment.",
    commonUses: ["Supplementation may be used when dietary intake is insufficient.", "Vitamin C is used to prevent or treat deficiency such as scurvy under appropriate guidance."],
    safetyNotes: ["High supplemental amounts can cause digestive effects such as diarrhoea or stomach discomfort.", "Kidney conditions, other supplements or medicines, pregnancy, and product ingredients may affect suitability; ask a professional."],
    disclaimer: "Symptoms do not establish vitamin deficiency. A health professional can assess whether supplementation is needed and appropriate.",
    sources: [{title:"MedlinePlus: Ascorbic Acid Drug Information",url:"https://medlineplus.gov/druginfo/meds/a682583.html"},{title:"NHS: Vitamin C",url:"https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-c/"},{title:"NIH Office of Dietary Supplements: Vitamin C",url:"https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/"}],
  },
  m9: {
    shortUse: "Oral rehydration salts help replace fluid and salts lost through diarrhoea.",
    whatItIs: "ORS sachets contain glucose and salts that are dissolved in water to make an oral rehydration solution. Exact composition and mixing instructions depend on the packet.",
    commonUses: ["Used to help prevent or treat dehydration associated with diarrhoea and fluid loss, when appropriate for the person and product."],
    safetyNotes: ["Mix only exactly as the product label states; incorrect dilution can be dangerous.", "ORS does not treat the underlying cause of diarrhoea.", "Severe dehydration, confusion, fainting, inability to drink, or very little urine needs urgent medical attention."],
    disclaimer: "A clinician or pharmacist should assess the cause and severity of dehydration, especially in infants, older adults, or people with chronic illness.",
    sources: [{title:"WHO: Oral rehydration salts",url:"https://www.who.int/publications/i/item/WHO-FCH-CAH-06.1"},{title:"MedlinePlus: Dehydration",url:"https://medlineplus.gov/dehydration.html"}],
  },
  m10: {
    shortUse: "Reduces stomach acid; used for selected acid-related conditions.",
    whatItIs: "Omeprazole is a proton pump inhibitor that reduces stomach acid. Indications and duration depend on the specific product label and a clinician's assessment.",
    commonUses: ["Some products are used for reflux-related conditions and ulcers.", "Some clinician-directed treatment regimens combine it with other medicines for specific infections or excess-acid conditions."],
    safetyNotes: ["Omeprazole can interact with other medicines; ask a pharmacist to check a complete medication list.", "Long-term use may have additional risks and should be reviewed by a clinician.", "Blood in vomit, black stools, difficulty swallowing, unexplained weight loss, or chest pain needs prompt medical assessment."],
    disclaimer: "Heartburn and stomach symptoms can have serious causes. This card does not diagnose or determine whether omeprazole is suitable.",
    sources: [{title:"MedlinePlus: Omeprazole Drug Information",url:"https://medlineplus.gov/druginfo/meds/a693050.html"},{title:"NHS: Omeprazole",url:"https://www.nhs.uk/medicines/omeprazole/"}],
  },
};
const MEDICINE_TOPICS = [
  {id:"All",label:"All topics",medicineIds:MEDS.map((m)=>m.id)},
  {id:"pain-fever",label:"Pain or fever",medicineIds:["m1","m2"]},
  {id:"bacterial-infection",label:"Certain bacterial infections · clinician only",medicineIds:["m3"]},
  {id:"type-2-diabetes",label:"Type 2 diabetes care",medicineIds:["m4"]},
  {id:"blood-pressure",label:"High blood pressure",medicineIds:["m5"]},
  {id:"allergy",label:"Allergy symptoms or hives",medicineIds:["m6"]},
  {id:"breathing",label:"Asthma/COPD reliever · prescribed",medicineIds:["m7"]},
  {id:"vitamin-c",label:"Vitamin C deficiency / supplement",medicineIds:["m8"]},
  {id:"fluid-loss",label:"Diarrhoea-related fluid loss",medicineIds:["m9"]},
  {id:"acid-related",label:"Acid reflux / ulcers",medicineIds:["m10"]},
];

const CATEGORIES = ["All", "Pain & fever", "Antibiotics", "Chronic care", "Allergy", "Respiratory", "Vitamins", "Rehydration", "Stomach"];

const RESTOCK = [
  { id: "r1", med: "Amoxicillin 500mg", have: 6, min: 20, from: "Karibu Chemist", avail: 140, price: 280 },
  { id: "r2", med: "Metformin 500mg", have: 12, min: 30, from: "Upendo Chemists", avail: 90, price: 190 },
  { id: "r3", med: "ORS Sachets", have: 4, min: 25, from: "Mwanga Pharmacy", avail: 200, price: 130 },
];

const STEPS = [
  ["search", "Search", "Type a medicine name to search the fixed sample listings in this browser."],
  ["bars", "Compare", "See price, stock level and distance side by side, and spot the best price."],
  ["cart", "Checkout demo", "Review a sample cart; a configured Daraja sandbox can send an STK test prompt and record callback-confirmed status."],
  ["truck", "Receive", "A real deployment would need pharmacy confirmation and delivery dispatch; this preview simulates neither."],
];

const FEATURES = [
  ["search", "Search sample medicine listings", "Explore the demonstration catalogue and sample pharmacy offers."],
  ["bars", "Price comparison", "Compare prices across pharmacies so you can choose what is affordable."],
  ["pin", "Nearby pharmacy locations", "See how far each pharmacy is and which one is closest to you."],
  ["truck", "Delivery flow preview", "See an illustrative delivery workflow; this demo does not dispatch or confirm deliveries."],
  ["network", "Restocking workflow preview", "See an example of how a pharmacy-to-pharmacy stock request could appear."],
  ["box", "Inventory management", "Real pharmacy inventory, batch and expiry tracking require a verified connected pharmacy system."],
];

const WHO = [
  ["user", "Elderly people", "Illustrative goal: make medicine information easier to compare without travelling between shops."],
  ["heart", "People with chronic conditions", "Illustrative goal: help people review medicine listings and plan questions for a pharmacist."],
  ["home", "Rural and remote residents", "Explore how verified pharmacy listings could improve access once real partners are connected."],
  ["pin", "People in new areas", "See the intended location-search experience; the sample listings are not verified businesses."],
];

const FAQ = [
  ["How does this preview show availability?", "This presentation uses fixed sample inventory and prices. The sandbox payment service checks its own demonstration catalog, but neither data source is connected to real pharmacy systems or current stock."],
  ["Do I need a prescription?", "Prescription requirements depend on the actual product and Kenyan rules. This demo does not upload, review or verify prescriptions, and its sample flags are not legal classification. Ask a licensed pharmacist."],
  ["Can I group items from more than one pharmacy?", "The demo cart groups sample items by pharmacy and can calculate a combined sandbox checkout. Payment confirmation does not send orders to those pharmacies or arrange separate deliveries."],
  ["How do pharmacies restock from each other?", "The restock section is an interaction preview only. It does not contact a pharmacy, create a purchase order, or update either inventory."],
  ["Are the pharmacy listings verified?", "No. Names, locations, hours, prices and delivery estimates in this preview are illustrative sample data, not verified businesses."],
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const SESSION_KEY = "pharmalink_session";
const kes = (n) => "KES " + Number(n).toLocaleString("en-KE");
const statusOf = (stock) => (stock <= 0 ? "out" : stock <= 10 ? "low" : "in");
const STATUS_LABEL = { in: "In stock", low: "Low stock", out: "Out of stock" };

const P = {
  search: ["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", "m20 20-4-4"],
  pin: ["M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z", "M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"],
  truck: ["M3 6h11v10H3z", "M14 10h4l3 3v3h-7z", "M7 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0", "M17 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"],
  shield: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", "m9 12 2 2 4-4"],
  network: ["M12 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z", "M5 21.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z", "M19 21.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z", "M12 7.5v4M12 11.5 6.5 17M12 11.5l5.5 5.5"],
  cart: ["M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6", "M10 21m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0", "M18 21m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7v5l3 2"],
  check: ["m5 12 5 5 9-10"],
  x: ["M6 6l12 12M18 6 6 18"],
  menu: ["M4 6h16M4 12h16M4 18h16"],
  plus: ["M12 5v14M5 12h14"],
  minus: ["M5 12h14"],
  logout: ["M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4", "m16 17 5-5-5-5", "M21 12H9"],
  bars: ["M4 20V10M10 20V4M16 20v-8M22 20H2"],
  box: ["M21 8 12 3 3 8v8l9 5 9-5z", "m3 8 9 5 9-5", "M12 13v8"],
  heart: ["M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"],
  arrow: ["M5 12h14", "m13 6 6 6-6 6"],
  chev: ["m6 9 6 6 6-6"],
  user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 21c0-4 4-6 8-6s8 2 8 6"],
  home: ["m3 11 9-8 9 8", "M5 10v10h14V10"],
  cross: ["M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"],
};

function Ic({ n, size = 20, sw = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      {(P[n] || []).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const CSS = `
.hp{--g:#20c77a;--gd:#13a965;--deep:#06160e;--deep2:#0a2015;--surface:#0d281b;--surface2:#102f20;--mint:#a3f2c5;--ink:#f2f8f4;--muted:#b3c7ba;--subtle:#829b8b;--line:rgba(197,231,209,.13);--soft:#0a2016;--glow:rgba(32,199,122,.18);width:100%;min-height:100vh;min-height:100svh;position:relative;isolation:isolate;overflow-x:clip;background:var(--deep);color:var(--ink);font-family:'Montserrat','Segoe UI',system-ui,-apple-system,sans-serif;line-height:1.6;letter-spacing:.005em;color-scheme:dark}
.hp *{box-sizing:border-box}.hp button,.hp input,.hp select{font:inherit}.hp button{cursor:pointer}.hp h1,.hp h2,.hp h3,.hp h4,.hp p{margin:0}.hp button:focus-visible,.hp input:focus-visible,.hp select:focus-visible{outline:2px solid var(--mint);outline-offset:3px}
.hp-wrap{width:calc(100% - 44px);max-width:1220px;margin:0 auto}.hp-sec{padding:clamp(78px,9vw,126px) 0;scroll-margin-top:80px}.hp-sec.alt{background:linear-gradient(130deg,#091d13,#0b2418 58%,#091b12);border-block:1px solid rgba(197,231,209,.035)}
.hp-eyebrow{display:inline-flex;align-items:center;gap:10px;color:var(--mint);font-size:11px;font-weight:800;letter-spacing:.19em;text-transform:uppercase}.hp-eyebrow:before{content:"";width:21px;height:1px;background:var(--g)}.hp-h2{font-size:clamp(29px,4vw,46px);line-height:1.12;letter-spacing:-.045em;font-weight:750;margin:12px 0 15px;color:#f3faf5}.hp-lead{max-width:620px;color:#b0c4b7;font-size:15px;line-height:1.8}.hp-head{max-width:740px;margin-bottom:42px}.hp-head.center{text-align:center;margin-inline:auto}.hp-head.center .hp-lead{margin-inline:auto}
.hp-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:46px;padding:11px 21px;border:1px solid rgba(135,244,183,.24);border-radius:13px;background:linear-gradient(135deg,#20c77a,#0e9b58);color:#03140b;font-weight:800;font-size:14px;box-shadow:0 8px 25px rgba(19,169,101,.16);transition:transform .25s,box-shadow .25s,filter .25s,border-color .25s}.hp-btn:hover{transform:translateY(-3px);filter:brightness(1.08);box-shadow:0 12px 32px rgba(32,199,122,.28),0 0 24px rgba(32,199,122,.12)}.hp-btn.ghost{color:#e8f5ed;background:rgba(6,22,14,.26);border-color:rgba(226,247,235,.32);box-shadow:none}.hp-btn.ghost:hover{border-color:var(--mint);background:rgba(32,199,122,.1);box-shadow:0 0 22px rgba(32,199,122,.13)}.hp-btn.light{background:#d6f7e4;color:#082113;border-color:transparent}.hp-btn.light:hover{background:#a3f2c5}.hp-btn.sm{min-height:36px;padding:7px 13px;border-radius:10px;font-size:12px}.hp-btn:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}.hp-btn.done{background:#163e29;color:#a3f2c5;border-color:#23563a}
/* Compact, calm sticky navigation */
.hp-nav{position:sticky;top:0;z-index:50;background:rgba(5,20,12,.82);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(197,231,209,.1)}.hp-nav-in{width:calc(100% - 40px);max-width:1320px;min-height:62px;margin:0 auto;display:flex;align-items:center;gap:18px}.hp-brand{display:flex;align-items:center;gap:9px;color:#f0faf3;font-weight:800;font-size:17px;letter-spacing:-.04em;background:none;border:0;padding:0;white-space:nowrap}.hp-brand img{height:34px;width:auto;object-fit:contain}.hp-mark{width:30px;height:30px;border-radius:9px;background:linear-gradient(145deg,#20c77a,#0e8950);display:grid;place-items:center;color:#04170c;box-shadow:0 0 22px rgba(32,199,122,.2)}.hp-links{display:flex;gap:3px;margin-left:auto;align-items:center}.hp-links button{position:relative;background:none;border:0;color:#b9ccbf;font-size:12px;font-weight:650;padding:8px 10px;border-radius:9px;transition:color .2s,background .2s}.hp-links button:after{content:"";position:absolute;bottom:4px;left:10px;right:10px;height:1px;background:var(--mint);transform:scaleX(0);transition:transform .25s}.hp-links button:hover{color:#fff;background:rgba(255,255,255,.035)}.hp-links button:hover:after{transform:scaleX(1)}.hp-tools{display:flex;align-items:center;gap:8px}.hp-icon-btn{position:relative;width:36px;height:36px;border-radius:11px;border:1px solid var(--line);background:rgba(255,255,255,.035);color:#d8e9df;display:grid;place-items:center;transition:all .2s}.hp-icon-btn:hover{color:var(--mint);border-color:rgba(32,199,122,.48);background:rgba(32,199,122,.1);box-shadow:0 0 18px rgba(32,199,122,.13);transform:translateY(-1px)}.hp-badge{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;border-radius:10px;background:var(--mint);color:#06160e;font-size:10px;font-weight:900;display:grid;place-items:center;padding:0 4px}.hp-user{display:flex;align-items:center;gap:7px;color:#d8e9df;font-size:12px;font-weight:650;padding:3px 10px 3px 3px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.035)}.hp-av{width:27px;height:27px;border-radius:50%;background:linear-gradient(145deg,#20c77a,#0b8050);color:#04170c;display:grid;place-items:center;font-weight:900;font-size:12px}.hp-burger{display:none}.hp-mobile{display:flex;flex-direction:column;gap:2px;background:rgba(5,20,12,.98);padding:8px max(20px,calc((100% - 1220px)/2)) 15px;border-top:1px solid var(--line);animation:hp-drop .22s ease both}.hp-mobile button{background:none;border:0;color:#d4e6da;text-align:left;padding:11px 8px;font-size:14px;font-weight:600;border-bottom:1px solid rgba(197,231,209,.07)}.hp-mobile button:hover{color:var(--mint)}
/* Photo-led hero */
.hp-hero{position:relative;min-height:clamp(620px,calc(100svh - 62px),900px);display:flex;align-items:center;color:#fff;overflow:hidden;background:#04160d}.hp-hero-bg{position:absolute;inset:0}.hp-hero-bg div{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;opacity:0;transform:scale(1.04);transition:opacity 1.35s ease,transform 8s ease}.hp-hero-bg div.on{opacity:1;transform:scale(1)}.hp-hero-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,17,10,.9) 0%,rgba(3,17,10,.73) 47%,rgba(3,17,10,.27) 100%),linear-gradient(0deg,rgba(3,17,10,.62),transparent 44%)}.hp-hero-in{position:relative;z-index:2;width:min(100% - 44px,1220px);margin:0 auto;padding:92px 0 136px;animation:hp-arrive .8s both}.hp-hello{display:inline-flex;align-items:center;gap:9px;padding:7px 12px;border-radius:999px;background:rgba(8,35,21,.55);border:1px solid rgba(188,248,211,.22);color:#d7f7e2;font-size:12px;font-weight:650;backdrop-filter:blur(12px)}.hp-hero h1{font-size:clamp(43px,6.2vw,78px);line-height:1.01;font-weight:780;letter-spacing:-.055em;margin:23px 0 18px;max-width:820px;color:#f5fbf7}.hp-hero h1 span{color:var(--mint)}.hp-hero p.sub{font-size:clamp(15px,1.55vw,18px);line-height:1.75;max-width:580px;color:rgba(237,248,240,.83)}.hp-search{margin-top:29px;max-width:670px;background:rgba(7,24,15,.79);border:1px solid rgba(210,243,220,.27);border-radius:16px;padding:6px;display:flex;gap:8px;box-shadow:0 20px 50px rgba(0,0,0,.24);backdrop-filter:blur(16px);transition:border-color .25s,box-shadow .25s}.hp-search:focus-within{border-color:rgba(126,232,176,.66);box-shadow:0 0 0 4px rgba(32,199,122,.1),0 20px 50px rgba(0,0,0,.28)}.hp-search-f{flex:1;display:flex;align-items:center;gap:10px;padding-left:13px;color:#a9c2b1;min-width:0}.hp-search input{flex:1;border:0;outline:0;font-size:14px;font-family:inherit;color:#f4fbf6;background:transparent;min-width:0;padding:11px 0}.hp-search input::placeholder{color:#92aa9a}.hp-search .hp-btn{border-radius:11px;min-height:42px}.hp-pop{display:flex;flex-wrap:wrap;gap:7px;margin-top:17px;align-items:center;font-size:11px;color:#c1d1c7}.hp-pop button{border:1px solid rgba(219,245,227,.18);background:rgba(9,36,21,.5);color:#deeee3;border-radius:999px;padding:6px 11px;font-size:11px;font-weight:650;transition:all .2s}.hp-pop button:hover{border-color:rgba(126,232,176,.65);color:var(--mint);background:rgba(32,199,122,.13);transform:translateY(-2px)}.hp-slide-controls{display:flex;align-items:center;gap:7px;margin-top:29px}.hp-slide-dot{width:20px;height:3px;border:0;border-radius:4px;padding:0;background:rgba(255,255,255,.35);transition:width .3s,background .3s}.hp-slide-dot.active{width:42px;background:var(--mint)}.hp-slide-dot:hover{background:#fff}
/* Stats */
.hp-stats{position:relative;z-index:4;margin:-60px auto 0;display:grid;grid-template-columns:repeat(4,1fr);background:rgba(8,30,18,.92);border:1px solid rgba(196,236,209,.14);border-radius:19px;box-shadow:0 25px 70px rgba(0,0,0,.23),inset 0 1px rgba(255,255,255,.035);overflow:hidden;backdrop-filter:blur(18px)}.hp-stat{padding:24px 24px;border-right:1px solid var(--line)}.hp-stat:last-child{border:0}.hp-stat b{display:block;font-size:clamp(24px,3vw,35px);font-weight:800;color:var(--mint);line-height:1.15;letter-spacing:-.045em;font-variant-numeric:tabular-nums}.hp-stat span{display:block;font-size:12px;color:#cad9cf;margin-top:7px;line-height:1.5}.hp-stat small{display:block;margin-top:5px;font-size:10px;color:#82998b}
/* Search and product results */
.hp-tools-bar{display:flex;flex-wrap:wrap;gap:11px;align-items:center;margin-bottom:17px}.hp-big-in{flex:1;min-width:220px;display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:12px;padding:0 15px;background:#0b2417;color:#9db2a3;transition:border-color .2s,box-shadow .2s}.hp-big-in:focus-within{border-color:rgba(32,199,122,.7);box-shadow:0 0 0 3px rgba(32,199,122,.1)}.hp-big-in input{flex:1;border:0;outline:0;font-size:13px;font-family:inherit;padding:12px 0;color:#edf7f0;background:transparent;min-width:0}.hp-big-in input::placeholder{color:#82998b}.hp-sel{border:1px solid var(--line);border-radius:12px;padding:11px 14px;font-family:inherit;font-size:12px;font-weight:600;color:#d7e7dc;background:#0b2417;outline:none}.hp-sel option{background:#0b2417}.hp-chk{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#c6d6cb;cursor:pointer;user-select:none}.hp-chk input{width:16px;height:16px;accent-color:var(--g)}.hp-chips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:27px}.hp-chip{border:1px solid var(--line);background:#0b2417;border-radius:999px;padding:6px 12px;font-size:11px;font-weight:650;color:#b9cbbf;transition:all .2s}.hp-chip:hover{border-color:rgba(32,199,122,.55);color:var(--mint);transform:translateY(-2px)}.hp-chip.on{background:#16442c;border-color:rgba(32,199,122,.48);color:#b2f3cd;box-shadow:0 0 17px rgba(32,199,122,.08)}.hp-results{display:grid;grid-template-columns:1fr 1fr;gap:16px}.hp-med{border:1px solid var(--line);border-radius:17px;background:linear-gradient(145deg,#0e291b,#0a2116);overflow:hidden;transition:transform .28s,border-color .28s,box-shadow .28s}.hp-med:hover{transform:translateY(-5px);border-color:rgba(32,199,122,.4);box-shadow:0 18px 45px rgba(0,0,0,.24),0 0 28px rgba(32,199,122,.08)}.hp-med-h{padding:15px 16px;display:flex;justify-content:space-between;gap:10px;align-items:flex-start;border-bottom:1px solid var(--line);background:rgba(255,255,255,.018)}.hp-med-h h3{font-size:14px;font-weight:750;color:#edf7f0}.hp-med-h p{font-size:11px;color:#98b0a0;margin-top:3px}.hp-rx{font-size:9px;font-weight:700;color:#f1c986;background:rgba(169,115,34,.14);border:1px solid rgba(241,201,134,.14);border-radius:999px;padding:4px 8px;white-space:nowrap}.hp-otc{font-size:9px;font-weight:700;color:#a3f2c5;background:rgba(32,199,122,.1);border-radius:999px;padding:4px 8px;white-space:nowrap}.hp-row{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:11px 15px;border-bottom:1px solid rgba(197,231,209,.075)}.hp-row:last-child{border:0}.hp-row b{font-size:12px;font-weight:700;color:#dfebe2;display:block}.hp-row small{font-size:10px;color:#91a899;display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:4px}.hp-price{font-weight:800;font-size:12px;text-align:right;color:#e5f3e9}.hp-best{display:block;font-size:8px;font-weight:850;color:var(--mint);text-transform:uppercase;letter-spacing:.08em}.hp-pill{font-size:9px;font-weight:700;border-radius:999px;padding:2px 7px}.hp-pill.in{background:rgba(32,199,122,.13);color:#a3f2c5}.hp-pill.low{background:rgba(241,201,134,.13);color:#f1c986}.hp-pill.out{background:rgba(238,123,123,.13);color:#f29c9c}.hp-empty{grid-column:1/-1;text-align:center;padding:42px 20px;border:1px dashed rgba(197,231,209,.2);border-radius:17px;color:#b7c9bd}.hp-more{text-align:center;margin-top:25px}.hp-note{margin-top:16px;font-size:11px;color:#82998b;line-height:1.65}
/* Cards, grids, step tiles */
.hp-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px}.hp-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px}.hp-grid4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:17px}.hp-card{position:relative;background:linear-gradient(145deg,rgba(16,47,32,.82),rgba(10,32,21,.95));border:1px solid rgba(197,231,209,.105);border-radius:18px;padding:23px;transition:transform .32s cubic-bezier(.2,.75,.25,1),border-color .28s,box-shadow .3s;overflow:hidden}.hp-card:before{content:"";position:absolute;inset:0;background:radial-gradient(360px circle at var(--mx,50%) var(--my,0%),rgba(32,199,122,.13),transparent 54%);opacity:0;transition:opacity .3s;pointer-events:none}.hp-card:hover{transform:translateY(-7px);border-color:rgba(67,223,142,.45);box-shadow:0 20px 50px rgba(0,0,0,.2),0 0 32px rgba(32,199,122,.13)}.hp-card:hover:before{opacity:1}.hp-card>*{position:relative}.hp-ico{width:43px;height:43px;border-radius:13px;background:rgba(32,199,122,.12);border:1px solid rgba(32,199,122,.15);color:var(--mint);display:grid;place-items:center;margin-bottom:17px;transition:box-shadow .3s,transform .3s}.hp-card:hover .hp-ico{transform:translateY(-2px);box-shadow:0 0 22px rgba(32,199,122,.2)}.hp-card h3{font-size:14px;font-weight:750;color:#eff8f2;margin-bottom:6px}.hp-card p{font-size:12px;color:#a9bdb0;line-height:1.75}.hp-meta{display:flex;flex-direction:column;gap:7px;margin-top:13px;font-size:11px;color:#adbfB3}.hp-meta span{display:flex;align-items:center;gap:8px}.hp-meta svg{color:var(--mint)}.hp-ver{display:inline-flex;align-items:center;gap:5px;font-size:9px;font-weight:750;color:#a3f2c5;background:rgba(32,199,122,.1);border-radius:999px;padding:4px 9px;margin-top:13px}.hp-num{position:absolute;top:14px;right:18px;font-size:38px;font-weight:800;color:rgba(163,242,197,.13);line-height:1}.hp-step{min-height:215px}
/* Image-backed story panel and glass cards */
.hp-band{position:relative;color:#f4faf6;background:#06160e;background-size:cover;background-position:center;background-attachment:fixed}.hp-band:before{content:"";position:absolute;inset:0;background:linear-gradient(100deg,rgba(4,19,12,.92),rgba(4,19,12,.76) 58%,rgba(4,19,12,.68))}.hp-band>.hp-wrap{position:relative;z-index:1}.hp-band .hp-h2{color:#f3faf5}.hp-band .hp-lead{color:#c0d1c6}.hp-glass{background:rgba(9,34,21,.55);border:1px solid rgba(218,246,227,.17);border-radius:17px;padding:20px;backdrop-filter:blur(14px);transition:transform .3s,border-color .3s,background .3s,box-shadow .3s}.hp-glass:hover{transform:translateY(-6px);border-color:rgba(126,232,176,.47);background:rgba(16,59,35,.68);box-shadow:0 18px 44px rgba(0,0,0,.25),0 0 25px rgba(32,199,122,.12)}.hp-glass .hp-ico{background:rgba(32,199,122,.14);color:var(--mint)}.hp-glass h3{font-size:13px;font-weight:750;margin-bottom:6px;color:#f1f9f4}.hp-glass p{font-size:11px;color:#c0d1c6;line-height:1.7}
/* Pharmacy restock panel */
.hp-rs-wrap{border:1px solid var(--line);border-radius:18px;overflow:hidden;background:#0b2417;box-shadow:0 12px 35px rgba(0,0,0,.14)}.hp-rs-h,.hp-rs{display:grid;grid-template-columns:1.3fr 1.1fr 1.4fr auto;gap:14px;align-items:center;padding:14px 17px}.hp-rs-h{background:#102e1f;font-size:9px;font-weight:800;color:#9fb5a5;text-transform:uppercase;letter-spacing:.1em}.hp-rs{border-top:1px solid var(--line);font-size:12px;color:#d9e9de}.hp-rs b{font-weight:700}.hp-rs small{display:block;color:#91a899;font-size:10px}.hp-bar{height:6px;border-radius:4px;background:#1c3928;margin-top:6px;overflow:hidden}.hp-bar i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,#e1ad54,#e5c878)}.hp-split{display:grid;grid-template-columns:.85fr 1.15fr;gap:clamp(32px,6vw,78px);align-items:start}.hp-list{list-style:none;padding:0;margin:19px 0 0;display:flex;flex-direction:column;gap:12px}.hp-list li{display:flex;gap:10px;font-size:12px;color:#c0d1c6}.hp-list li svg{color:var(--mint);margin-top:2px;flex:none}
/* FAQ and footer */
.hp-faq{max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:9px}.hp-q{border:1px solid var(--line);border-radius:14px;background:rgba(13,40,27,.68);overflow:hidden;transition:border-color .25s,box-shadow .25s,transform .25s}.hp-q:hover{border-color:rgba(32,199,122,.28);box-shadow:0 9px 26px rgba(0,0,0,.12)}.hp-q button{width:100%;display:flex;justify-content:space-between;align-items:center;gap:14px;background:none;border:0;text-align:left;padding:16px 18px;font-size:13px;font-weight:700;color:#e7f2ea}.hp-q button svg{transition:transform .25s;color:var(--mint);flex:none}.hp-q.open button svg{transform:rotate(180deg)}.hp-q div{max-height:0;overflow:hidden;transition:max-height .35s ease,padding .35s ease;padding:0 18px;font-size:12px;color:#aebfb4;line-height:1.75}.hp-q.open div{max-height:280px;padding:0 18px 17px}.hp-cta{text-align:center;padding:100px 0}.hp-cta:before{background:linear-gradient(90deg,rgba(4,19,12,.9),rgba(4,19,12,.74))}.hp-cta h2{font-size:clamp(32px,5vw,54px);font-weight:800;line-height:1.08;max-width:720px;margin:0 auto 14px;letter-spacing:-.05em;color:#f5fbf7}.hp-cta p{max-width:530px;margin:0 auto 25px;color:#c6d8cc;font-size:14px}.hp-foot{background:#04120b;color:#a6b9ac;padding:48px 0 25px;border-top:1px solid rgba(197,231,209,.1);font-size:12px}.hp-foot-g{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:34px;padding-bottom:27px;border-bottom:1px solid rgba(197,231,209,.1)}.hp-foot h4{margin:0 0 12px;color:#e7f4eb;font-size:12px;font-weight:750}.hp-foot button.lk{display:block;background:none;border:0;color:#a6b9ac;padding:5px 0;font-size:12px;text-align:left;transition:color .2s,transform .2s}.hp-foot button.lk:hover{color:var(--mint);transform:translateX(3px)}.hp-foot-b{padding-top:18px;display:flex;flex-direction:column;gap:6px;font-size:10px;color:#72897a;line-height:1.6}
/* Cart drawer and feedback */
.hp-ov{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.65);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);display:flex;justify-content:flex-end;animation:hp-fade .22s ease both}.hp-drawer{width:min(430px,100%);height:100%;background:#091d12;color:#ecf6ef;display:flex;flex-direction:column;animation:hp-in .32s cubic-bezier(.2,.75,.25,1);border-left:1px solid var(--line);box-shadow:-25px 0 70px rgba(0,0,0,.35)}@keyframes hp-in{from{transform:translateX(38px);opacity:.6}to{transform:none;opacity:1}}@keyframes hp-fade{from{opacity:0}to{opacity:1}}@keyframes hp-drop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}.hp-dh{display:flex;justify-content:space-between;align-items:center;padding:17px 19px;border-bottom:1px solid var(--line)}.hp-dh h3{font-size:15px;font-weight:800}.hp-db{flex:1;overflow-y:auto;padding:16px 19px}.hp-df{padding:16px 19px;border-top:1px solid var(--line);background:#0d281b}.hp-x{width:34px;height:34px;border-radius:10px;border:1px solid var(--line);background:#102b1c;color:#d8e9df;display:grid;place-items:center}.hp-x:hover{border-color:rgba(32,199,122,.5);color:var(--mint)}.hp-grp{margin-bottom:17px}.hp-grp h4{margin:0 0 8px;font-size:11px;font-weight:800;color:var(--mint);display:flex;align-items:center;gap:6px}.hp-ci{display:grid;grid-template-columns:1fr auto;gap:8px;padding:10px 0;border-bottom:1px solid var(--line);font-size:12px}.hp-ci b{font-weight:700;color:#e7f2ea}.hp-ci small{color:#91a899;display:block}.hp-qty{display:inline-flex;align-items:center;gap:8px;margin-top:6px}.hp-qty button{width:25px;height:25px;border-radius:8px;border:1px solid var(--line);background:#102b1c;display:grid;place-items:center;color:#e5f1e9}.hp-qty button:hover{border-color:var(--g);color:var(--mint)}.hp-tot{display:flex;justify-content:space-between;font-size:12px;padding:3px 0;color:#bdcec2}.hp-tot.big{font-size:15px;font-weight:800;padding-top:8px;color:#f1f8f3}.hp-ok{text-align:center;padding:28px 10px}.hp-ok .hp-ico{margin:0 auto 14px;width:58px;height:58px;border-radius:50%;background:#15472d;color:var(--mint)}.hp-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:300;background:#d9f8e5;color:#062012;padding:11px 17px;border-radius:12px;font-size:12px;font-weight:750;box-shadow:0 12px 36px rgba(0,0,0,.32);display:flex;align-items:center;gap:8px;animation:hp-toast-in .28s ease both}@keyframes hp-toast-in{from{transform:translate(-50%,12px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
/* Scroll in and out reveals; observer toggles .is-visible in either direction */
.hp-reveal{opacity:0;transform:translateY(24px);filter:blur(3px);transition:opacity .65s ease,transform .65s cubic-bezier(.2,.75,.25,1),filter .65s ease}.hp-reveal.is-visible{opacity:1;transform:none;filter:blur(0)}.hp-reveal:nth-child(2){transition-delay:.06s}.hp-reveal:nth-child(3){transition-delay:.12s}.hp-reveal:nth-child(4){transition-delay:.18s}.hp-card,.hp-med,.hp-glass,.hp-stat{will-change:transform,opacity}.hp-stat.hp-reveal{transition-delay:0s}
@media(max-width:1120px){.hp-links{display:none}.hp-burger{display:grid}.hp-tools{margin-left:auto}.hp-grid3,.hp-grid4{grid-template-columns:repeat(2,minmax(0,1fr))}.hp-results{grid-template-columns:1fr}.hp-split{grid-template-columns:1fr;gap:29px}.hp-foot-g{grid-template-columns:1.3fr 1fr 1fr}}
@media(max-width:700px){.hp-wrap,.hp-hero-in{width:calc(100% - 34px)}.hp-sec{padding:70px 0}.hp-nav-in{width:calc(100% - 30px);min-height:58px;gap:10px}.hp-brand{font-size:15px}.hp-brand img{height:30px}.hp-tools{gap:6px}.hp-icon-btn{width:34px;height:34px}.hp-user{padding:2px 7px 2px 2px;font-size:10px}.hp-av{width:25px;height:25px}.hp-hero{min-height:calc(100svh - 58px);min-height:max(660px,calc(100svh - 58px));align-items:flex-end}.hp-hero-bg div{background-position:58% center}.hp-hero-shade{background:linear-gradient(90deg,rgba(3,17,10,.83),rgba(3,17,10,.52)),linear-gradient(0deg,rgba(3,17,10,.72),transparent 75%)}.hp-hero-in{padding:74px 0 106px}.hp-hero h1{font-size:clamp(42px,11vw,62px);margin:18px 0 14px}.hp-hero p.sub{font-size:14px}.hp-search{margin-top:22px;border-radius:14px}.hp-search input{font-size:12px}.hp-search .hp-btn{padding:9px 14px;min-height:39px;font-size:12px}.hp-pop{font-size:10px}.hp-pop button{font-size:10px}.hp-stats{margin-top:-38px;grid-template-columns:repeat(2,minmax(0,1fr));border-radius:15px}.hp-stat{padding:17px 15px;border-bottom:1px solid var(--line)}.hp-stat:nth-child(2){border-right:0}.hp-stat:nth-last-child(-n+2){border-bottom:0}.hp-stat b{font-size:26px}.hp-stat span{font-size:10px}.hp-stat small{font-size:9px}.hp-head{margin-bottom:29px}.hp-h2{font-size:clamp(28px,7vw,38px)}.hp-lead{font-size:13px}.hp-grid2,.hp-grid3,.hp-grid4{grid-template-columns:1fr}.hp-card{padding:19px}.hp-card p{font-size:12px}.hp-tools-bar{align-items:stretch}.hp-big-in{min-width:100%;border-radius:11px}.hp-sel{flex:1;min-width:0}.hp-row{grid-template-columns:minmax(0,1fr) auto;gap:9px;padding:10px 12px}.hp-row>button{grid-column:1/-1;width:100%}.hp-row small{font-size:9px}.hp-price{font-size:11px}.hp-med-h{padding:13px 12px}.hp-med-h h3{font-size:13px}.hp-rs-h{display:none}.hp-rs{grid-template-columns:1fr;gap:8px;padding:14px}.hp-foot-g{grid-template-columns:1fr 1fr;gap:22px}.hp-foot-g>div:first-child{grid-column:1/-1}.hp-band{background-attachment:scroll}.hp-cta{padding:75px 0}.hp-q button{padding:15px;font-size:12px}.hp-q div{font-size:11px}.hp-reveal{transform:translateY(17px);filter:blur(2px)}}
@media(max-width:390px){.hp-user{display:none}.hp-hero h1{font-size:40px}.hp-search-f{padding-left:7px;gap:6px}.hp-search .hp-btn{padding:8px 10px}.hp-stat{padding:14px 11px}.hp-foot-g{grid-template-columns:1fr}.hp-foot-g>div:first-child{grid-column:auto}}
@media(prefers-reduced-motion:reduce){.hp-reveal{opacity:1!important;transform:none!important;filter:none!important;transition:none!important}.hp *{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}.hp-hero-bg div{transform:none!important}}
/* M-Pesa checkout controls, styled to match the original forest-green system */
.hp-pay-label{display:block;margin:14px 0 6px;color:#d5e7dc;font-size:12px;font-weight:800}.hp-pay-phone{display:flex;align-items:center;gap:8px;padding:0 12px;border:1px solid rgba(197,231,209,.2);border-radius:12px;background:#0b2417;color:#d5e7dc}.hp-pay-phone span{font-size:11px;font-weight:800;white-space:nowrap}.hp-pay-phone input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#f2f8f4;font-size:13px;padding:12px 0}.hp-pay-phone input::placeholder{color:#82998b}.hp-pay-phone input:disabled{opacity:.65}.hp-pay-phone:focus-within{border-color:#20c77a;box-shadow:0 0 0 3px rgba(32,199,122,.12)}.hp-pay-help{margin-top:7px;color:#91a899;font-size:10px;line-height:1.55}.hp-mpesa-btn{background:linear-gradient(110deg,#20c77a,#0e9b58);color:#03140b;border:1px solid rgba(135,244,183,.3);box-shadow:0 8px 22px rgba(19,169,101,.2)}.hp-mpesa-btn:hover{background:linear-gradient(110deg,#36d58a,#0eaa60)}.hp-mpesa-btn:disabled{filter:grayscale(.2);opacity:.7}.hp-mpesa-mark{display:grid;place-items:center;width:23px;height:23px;border-radius:7px;background:#06160e;color:#a3f2c5;font-size:13px;font-weight:950}.hp-pay-state{display:grid;gap:5px;margin-top:12px;padding:11px 12px;border:1px solid rgba(197,231,209,.17);border-radius:12px;background:#102b1c;color:#d8e9df;font-size:11px}.hp-pay-state b{font-size:12px}.hp-pay-state.paid{background:#103824;border-color:#237348;color:#a3f2c5}.hp-pay-state.failed,.hp-pay-state.review{background:#332817;border-color:#70521b;color:#f1c986}.hp-pay-state .hp-btn{justify-self:start;margin-top:4px}.hp-pay-secure{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:9px;color:#91a899;font-size:9px}.hp-pay-secure svg{color:#a3f2c5}
@media(max-width:700px){.hp-pay-secure{font-size:8px}.hp-drawer{border-left:0;border-radius:18px 18px 0 0}}

`;

function CountUp({ value, suffix = "", duration = 1150 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      setCount(value);
      return;
    }
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const started = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(value * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      observer.disconnect();
    }, { threshold: 0.45 });
    observer.observe(node);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [value, duration]);
  return <b ref={ref}>{count.toLocaleString("en")} {suffix}</b>;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home({ user, onLogout }) {
  const first = ((user && user.name) || "there").split(" ")[0];
  const initial = first.charAt(0).toUpperCase();

  const [slide, setSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const [heroQ, setHeroQ] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [healthTopic, setHealthTopic] = useState("All");
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [sortBy, setSortBy] = useState("price");
  const [inStockOnly, setInStockOnly] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const [rxConfirmed, setRxConfirmed] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaPayment, setMpesaPayment] = useState(null);
  const [simPrompt, setSimPrompt] = useState(null);
  const [paymentEvents, setPaymentEvents] = useState(() => readLocal(PAYMENT_EVENTS_KEY, []));
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminTab, setAdminTab] = useState("records");
  const [orderSearch, setOrderSearch] = useState("");
  const [orders, setOrders] = useState(() => readLocal(ORDERS_KEY, []));
  const [pharmacyLocations, setPharmacyLocations] = useState(() => readLocal("pharmalink_demo_locations_v1", PHARMACIES.map((pharmacy) => ({ id: pharmacy.id, address: "", latitude: "", longitude: "", verified: false }))));
  const [integrationConfig, setIntegrationConfig] = useState(() => readLocal(CONFIG_KEY, {
    facilityName: "", kmpdcRegistration: "", county: "", facilityLevel: "",
    dhaStatus: "Planning", nhieBaseUrl: "", organizationId: "", clientId: "",
    webhookUrl: "", dataController: "", odpcStatus: "Not assessed", consentUrl: "",
    pharmacySystem: "", mapRegion: "", notes: "",
  }));
  const [toast, setToast] = useState("");
  const [requested, setRequested] = useState({});
  const [openFaq, setOpenFaq] = useState(0);
  const toastTimer = useRef(null);

  /* page setup */
  useEffect(() => {
    document.title = `Home | ${BRAND}`;
    document.body.style.margin = "0";
    document.body.style.background = "#06160e";
    window.scrollTo(0, 0);
    if (!document.getElementById("pl-font")) {
      const l = document.createElement("link");
      l.id = "pl-font";
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(l);
    }
    HERO.forEach((src) => {
      const im = new Image();
      im.onerror = () => console.warn("Image not found:", src);
      im.src = src;
    });
  }, []);

  /* Scroll reveal repeats on entry and exit to keep sections lively without blocking interaction. */
  useEffect(() => {
    const targets = document.querySelectorAll(".hp .hp-sec, .hp .hp-stat, .hp .hp-card, .hp .hp-med, .hp .hp-glass, .hp .hp-rs-wrap, .hp .hp-faq");
    if (!("IntersectionObserver" in window) || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    targets.forEach((node) => node.classList.add("hp-reveal"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting));
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    targets.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  /* hero slideshow */
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % HERO.length), 6000);
    return () => clearInterval(id);
  }, []);

  /* drawer: lock scroll + Escape */
  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : "";
    const k = (e) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", k);
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [cartOpen]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => { try { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); } catch { /* storage unavailable */ } }, [orders]);
  useEffect(() => { try { localStorage.setItem(PAYMENT_EVENTS_KEY, JSON.stringify(paymentEvents)); } catch { /* storage unavailable */ } }, [paymentEvents]);
  useEffect(() => { try { localStorage.setItem(CONFIG_KEY, JSON.stringify(integrationConfig)); } catch { /* storage unavailable */ } }, [integrationConfig]);
  useEffect(() => { try { localStorage.setItem("pharmalink_demo_locations_v1", JSON.stringify(pharmacyLocations)); } catch { /* storage unavailable */ } }, [pharmacyLocations]);
  useEffect(() => {
    if (!adminOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => { if (event.key === "Escape") { setAdminOpen(false); setAdminAuthed(false); } };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [adminOpen]);

  const flash = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3200);
  };
  const adminLogin = (event) => {
    event.preventDefault();
    if (adminPassword === ADMIN_DEMO_PASSWORD) {
      setAdminAuthed(true); setAdminPassword(""); setAdminTab("records");
    } else flash("Incorrect demo admin password.");
  };
  const exportOrdersCsv = () => {
    const rows = [["Order reference", "Created at", "Customer", "Pharmacy", "Medicine", "Quantity", "Unit price KES", "Line total KES", "Delivery fee KES", "Order total KES", "Prescription item", "Payment method", "Payment status", "M-Pesa receipt", "Status"]];
    orders.forEach((record) => (record.items || []).forEach((item) => rows.push([
      record.ref, record.createdAt, record.customer, item.pharmacyName, item.medicineName,
      item.quantity, item.unitPrice, item.lineTotal, record.deliveryFee, record.total,
      item.prescriptionRequired ? "Yes" : "No", record.paymentMethod || "", record.paymentStatus || "", record.receipt || "", record.status,
    ])));
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `pharmalink-demo-orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const exportOrdersJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), orders }, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = `pharmalink-demo-orders-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /* Scroll with buttons (not #links, because the app uses the URL hash for routing) */
  const go = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* search */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEDS.filter((m) => {
      const info = MEDICINE_INFO[m.id];
      const searchable = [m.name, m.cat, m.form, info?.whatItIs, info?.shortUse, ...(info?.commonUses || [])].join(" ").toLowerCase();
      const topic = MEDICINE_TOPICS.find((candidate) => candidate.id === healthTopic);
      return (category === "All" || m.cat === category) &&
        (healthTopic === "All" || (topic?.medicineIds || []).includes(m.id)) &&
        (!q || searchable.includes(q));
    })
      .map((m) => {
        let rows = PHARMACIES.filter((p) => m.offers[p.id]).map((p) => ({
          p,
          price: m.offers[p.id][0],
          stock: m.offers[p.id][1],
        }));
        if (inStockOnly) rows = rows.filter((r) => r.stock > 0);
        rows.sort(sortBy === "price" ? (a, b) => a.price - b.price : (a, b) => a.p.km - b.p.km);
        const inStock = rows.filter((r) => r.stock > 0).map((r) => r.price);
        const best = inStock.length ? Math.min(...inStock) : null;
        return { m, rows, best };
      })
      .filter((x) => x.rows.length);
  }, [query, category, healthTopic, sortBy, inStockOnly]);

  const visible = showAll ? results : results.slice(0, 4);
  const sampleOfferCount = MEDS.reduce((count, medicine) => count + Object.keys(medicine.offers).length, 0);

  const submitHero = (e) => {
    e.preventDefault();
    setQuery(heroQ);
    setCategory("All");
    setHealthTopic("All");
    setShowAll(false);
    go("find");
  };
  const quick = (term) => {
    setHeroQ(term);
    setQuery(term);
    setCategory("All");
    setHealthTopic("All");
    setShowAll(false);
    go("find");
  };

  /* cart */
  const addToCart = (m, r) => {
    const key = m.id + "-" + r.p.id;
    const ex = cart.find((i) => i.key === key);
    if (ex && ex.qty >= r.stock) {
      flash(`Only ${r.stock} left at ${r.p.name}`);
      return;
    }
    setCart((c) =>
      ex
        ? c.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i))
        : [...c, { key, medicineId: m.id, pharmacyId: r.p.id, name: m.name, pharm: r.p.name, price: r.price, qty: 1, stock: r.stock, rx: m.rx }]
    );
    flash(`${m.name} added to cart`);
  };
  const changeQty = (key, d) =>
    setCart((c) =>
      c
        .map((i) => (i.key === key ? { ...i, qty: Math.min(i.stock, i.qty + d) } : i))
        .filter((i) => i.qty > 0)
    );

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const groups = useMemo(() => {
    const g = {};
    cart.forEach((i) => {
      (g[i.pharm] = g[i.pharm] || []).push(i);
    });
    return Object.entries(g);
  }, [cart]);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryTotal = groups.length * DELIVERY_FEE;
  const total = subtotal + deliveryTotal;
  const hasRx = cart.some((i) => i.rx);
  const paymentInProgress = Boolean(mpesaPayment && ["starting", "checking", "pending"].includes(mpesaPayment.status));

  const completePaidOrder = (paymentInfo) => {
    const simulated = !!paymentInfo.simulated;
    const method = simulated ? "M-Pesa simulator" : "M-Pesa";
    const record = {
      ref: paymentInfo.reference, createdAt: new Date().toISOString(), customer: (user && user.name) || "Guest",
      items: cart.map((item) => ({
        medicineName: item.name, pharmacyName: item.pharm, pharmacyId: item.pharmacyId,
        quantity: item.qty, unitPrice: item.price, lineTotal: item.price * item.qty,
        prescriptionRequired: !!item.rx,
      })),
      subtotal, deliveryFee: deliveryTotal, total,
      status: simulated ? "SIMULATED APPROVAL · no real transaction" : "M-Pesa payment confirmed · demo fulfillment only",
      paymentStatus: simulated ? "SIMULATED · approved · no money moved" : "Paid · server callback confirmed",
      paymentMethod: method, receipt: paymentInfo.receipt || "", paymentId: paymentInfo.paymentId,
      mode: simulated ? "Local M-Pesa simulator" : "Presentation demo",
    };
    setOrders((current) => [record, ...current]);
    setOrder({ ref: record.ref, total, pharmacies: groups.length, paymentMethod: method, receipt: record.receipt, simulated });
    setCart([]); setRxConfirmed(false);
    setMpesaPayment({ status: "paid", simulated, message: simulated ? "Simulation approved. No Safaricom request was made and no money moved." : "Payment confirmed by the payment server.", reference: record.ref, receipt: record.receipt });
  };

  const pollMpesaPayment = async (paymentInfo) => {
    setMpesaPayment({ ...paymentInfo, status: "checking", message: "Waiting for Safaricom’s payment callback…" });
    for (let attempt = 0; attempt < 45; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const response = await fetch(`/api/payments/mpesa/status/${encodeURIComponent(paymentInfo.paymentId)}`, {
          method: "GET", cache: "no-store", headers: { Authorization: `Bearer ${paymentInfo.pollToken}` },
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Unable to check payment status.");
        if (result.status === "paid") { completePaidOrder({ ...paymentInfo, receipt: result.receipt || "" }); return; }
        if (["failed", "cancelled", "review"].includes(result.status)) {
          setMpesaPayment({ ...paymentInfo, status: result.status, message: result.message || (result.status === "review" ? "Payment needs manual verification. Do not retry yet." : "Payment was not completed. You can try again.") });
          return;
        }
      } catch (error) {
        setMpesaPayment({ ...paymentInfo, status: "pending", message: error.message || "Payment status is not available yet. Check again shortly." });
        return;
      }
    }
    setMpesaPayment({ ...paymentInfo, status: "pending", message: "Still waiting for confirmation. Do not send another prompt; check the payment status again." });
  };

  const payWithMpesa = async () => {
    if (hasRx && !rxConfirmed) { flash("Confirm you have a valid prescription to present. This demo cannot verify or dispense prescriptions."); return; }
    if (!mpesaPhone.trim()) { flash("Enter the Kenyan M-Pesa phone number to receive the prompt."); return; }
    if (mpesaPayment && ["starting", "checking", "pending"].includes(mpesaPayment.status)) { flash("An M-Pesa request is already in progress. Check its status before retrying."); return; }
    if (mpesaPayment?.status === "review") { flash("This payment needs manual verification. Do not send another prompt yet."); return; }
    const idempotencyKey = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (digit) => { const value = Math.floor(Math.random() * 16); return (digit === "x" ? value : (value & 3) | 8).toString(16); });
    const reference = `PL-${idempotencyKey.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
    setMpesaPayment({ status: "starting", message: "Connecting securely to the payment service…" });
    try {
      const response = await fetch("/api/payments/mpesa/stk-push", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ reference, phoneNumber: mpesaPhone, quotedTotal: total, items: cart.map((item) => ({ medicineId: item.medicineId, pharmacyId: item.pharmacyId, quantity: item.qty })) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = response.status === 404 || response.status === 405
          ? "Payment API is not connected to this website. Start mpesa-backend and proxy /api requests to it; then add Daraja sandbox credentials and a public callback URL. No payment was started."
          : result.message || (response.status === 503
            ? "Payment API is running but its Daraja sandbox settings are incomplete. Configure the backend environment variables and public callback URL. No payment was started."
            : "Payment request failed. Check the backend connection and configuration; no confirmed payment was recorded.");
        const failure = new Error(message); failure.status = response.status; throw failure;
      }
      if (typeof result.paymentId !== "string" || typeof result.pollToken !== "string") {
        throw new Error("The website returned a page instead of the payment API response. Configure the hosting /api reverse proxy to mpesa-backend. No STK prompt was started.");
      }
      const context = { paymentId: result.paymentId, pollToken: result.pollToken, reference, amount: result.amount, customerMessage: result.customerMessage };
      setMpesaPayment({ ...context, status: "pending", message: result.customerMessage || "Prompt requested. Check your phone and enter your M-Pesa PIN there if you choose to pay. Never share your PIN." });
      await pollMpesaPayment(context);
    } catch (error) {
      const uncertain = error.status === 409 || /outcome is uncertain|manual review/i.test(error.message || "");
      const unavailable = error instanceof TypeError;
      setMpesaPayment({ status: uncertain ? "review" : "failed", message: unavailable ? "Cannot reach the payment API. Deploy or start mpesa-backend, proxy the website’s /api route to it, and configure Daraja sandbox credentials plus a public callback URL. No payment was started." : (error.message || "Could not start the M-Pesa prompt. Your cart has not been charged.") });
    }
  };

  const startMpesaSimulation = () => {
    if (hasRx && !rxConfirmed) { flash("Confirm that you have a prescription to present. This demo does not verify prescriptions."); return; }
    if (mpesaPayment && ["starting", "checking", "pending"].includes(mpesaPayment.status)) { flash("A simulated prompt is already open. Resolve it before starting another."); return; }
    const raw = mpesaPhone.trim().replace(/[\s()-]/g, "");
    let normalized = raw.startsWith("+") ? raw : raw.startsWith("0") ? `+254${raw.slice(1)}` : raw.startsWith("254") ? `+${raw}` : `+254${raw}`;
    if (!/^\+254(?:7|1)\d{8}$/.test(normalized)) { flash("Enter a Kenyan mobile number such as 0712 345 678."); return; }
    const randomId = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase() : String(Date.now()).slice(-8);
    const reference = `PL-${randomId}`;
    const prompt = { reference, phone: normalized, amount: total, startedAt: new Date().toISOString(), simulated: true };
    setMpesaPayment({ ...prompt, status: "pending", message: "Local simulator prompt opened. Choose an outcome below; this is not a Safaricom transaction." });
    setSimPrompt(prompt);
  };

  const finishMpesaSimulation = (outcome) => {
    if (!simPrompt) return;
    const prompt = simPrompt;
    const simulatedReceipt = outcome === "approved" ? `SIM-${Date.now().toString().slice(-10)}` : "";
    const status = outcome === "approved" ? "SIMULATED_APPROVED" : outcome === "cancelled" ? "SIMULATED_CANCELLED" : outcome === "rejected" ? "SIMULATED_REJECTED" : "SIMULATED_TIMEOUT";
    const event = {
      id: `${prompt.reference}-${outcome}`, reference: prompt.reference, createdAt: new Date().toISOString(),
      phoneMasked: `${"•".repeat(Math.max(0, prompt.phone.length - 4))}${prompt.phone.slice(-4)}`,
      amount: prompt.amount, status, receipt: simulatedReceipt, mode: "SIMULATION ONLY",
    };
    setPaymentEvents((current) => [event, ...current]);
    setSimPrompt(null);
    if (outcome === "approved") {
      setMpesaPayment({ ...prompt, status: "checking", message: "Simulating the payment result… no network request is being made." });
      window.setTimeout(() => completePaidOrder({ ...prompt, paymentId: `SIM-${prompt.reference}`, receipt: simulatedReceipt, simulated: true }), 450);
    } else {
      const message = outcome === "cancelled" ? "Simulated cancellation. No real payment was made and your cart is unchanged." : outcome === "rejected" ? "Simulated payment rejection. No real payment was made and your cart is unchanged." : "Simulated prompt timeout. No real payment was made and your cart is unchanged.";
      setMpesaPayment({ ...prompt, status: "failed", simulated: true, message });
    }
  };

  const closeDrawer = () => {
    setCartOpen(false);
    if (order) { setMpesaPayment(null); setMpesaPhone(""); }
    setOrder(null);
    setRxConfirmed(false);
  };

  return (
    <div className="hp">
      <style>{CSS}</style>

      {/* ---------- Navbar ---------- */}
      <header className="hp-nav">
        <div className="hp-nav-in">
          <button className="hp-brand" onClick={() => go("home")} aria-label={`${BRAND} home`}>
            {logoOk ? (
              <img src={LOGO_SRC} alt={BRAND} onError={() => setLogoOk(false)} />
            ) : (
              <>
                <span className="hp-mark"><Ic n="cross" size={20} sw={2.5} /></span>
                <span>{BRAND}</span>
              </>
            )}
          </button>
          <nav className="hp-links" aria-label="Main">
            {NAV.map(([label, id]) => (
              <button key={id} onClick={() => go(id)}>{label}</button>
            ))}
          </nav>
          <div className="hp-tools">
            <button className="hp-icon-btn" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${cartCount} items`}>
              <Ic n="cart" size={20} />
              {cartCount > 0 && <span className="hp-badge">{cartCount}</span>}
            </button>
            <div className="hp-user">
              <span className="hp-av">{initial}</span>
              <span className="nm">{first}</span>
            </div>
            <button className="hp-btn sm ghost" onClick={() => { setAdminOpen(true); setMenuOpen(false); setAdminAuthed(false); }} aria-label="Open admin records">Admin records</button>
            <button className="hp-icon-btn" onClick={onLogout} aria-label="Log out" title="Log out">
              <Ic n="logout" size={19} />
            </button>
            <button className="hp-icon-btn hp-burger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" aria-expanded={menuOpen}>
              <Ic n={menuOpen ? "x" : "menu"} size={20} />
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="hp-mobile">
            {NAV.map(([label, id]) => (
              <button key={id} onClick={() => go(id)}>{label}</button>
            ))}
          </div>
        )}
      </header>

      {/* ---------- Hero ---------- */}
      <section id="home" className="hp-hero" aria-label="PharmaLink home">
        <div className="hp-hero-bg" aria-hidden="true">
          {HERO.map((src, i) => (
            <div key={src} className={i === slide ? "on" : ""} style={{ backgroundImage: `url("${src}")` }} />
          ))}
        </div>
        <div className="hp-hero-shade" />
        <div className="hp-hero-in">
          <span className="hp-hello">
            <Ic n="heart" size={16} /> Welcome back, {first}
          </span>
          <h1>
            Compare medicines across <span>sample pharmacy listings</span>
          </h1>
          <p className="sub">
            Search the sample catalogue, compare listed prices and stock, then explore the ordering flow in
            this presentation demo. No live pharmacy inventory is connected.
          </p>
          <form className="hp-search" onSubmit={submitHero} role="search">
            <label className="hp-search-f">
              <Ic n="search" size={20} />
              <input
                value={heroQ}
                onChange={(e) => setHeroQ(e.target.value)}
                placeholder="Search a medicine, e.g. Paracetamol"
                aria-label="Search medicine"
              />
            </label>
            <button type="submit" className="hp-btn">Search</button>
          </form>
          <div className="hp-pop">
            <span>Popular:</span>
            {["Paracetamol", "Amoxicillin", "Metformin", "ORS"].map((t) => (
              <button key={t} type="button" onClick={() => quick(t)}>{t}</button>
            ))}
          </div>
          <div className="hp-slide-controls" role="group" aria-label="Choose hero image">
            {HERO.map((src, i) => (
              <button
                key={src}
                className={"hp-slide-dot" + (i === slide ? " active" : "")}
                type="button"
                onClick={() => setSlide(i)}
                aria-label={`Show image ${i + 1}`}
                aria-pressed={i === slide}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <div className="hp-wrap">
        <div className="hp-stats">
          <div className="hp-stat hp-reveal">
            <CountUp value={PHARMACIES.length} />
            <span>sample pharmacy listings</span>
            <small>Demonstration data only</small>
          </div>
          <div className="hp-stat hp-reveal">
            <CountUp value={CATEGORIES.length - 1} />
            <span>sample medicine categories</span>
            <small>Demonstration data only</small>
          </div>
          <div className="hp-stat hp-reveal">
            <CountUp value={sampleOfferCount} />
            <span>sample pharmacy price listings</span>
            <small>Demonstration data only</small>
          </div>
          <div className="hp-stat hp-reveal">
            <CountUp value={MEDS.length} />
            <span>medicines you can compare right now</span>
            <small>Sample data</small>
          </div>
        </div>
      </div>

      {/* ---------- Find medicine ---------- */}
      <section id="find" className="hp-sec">
        <div className="hp-wrap">
          <div className="hp-head">
            <div className="hp-eyebrow">Find medicine</div>
            <h2 className="hp-h2">Search, compare and order in one place</h2>
            <p className="hp-lead">
              Compare sample pharmacy listings, listed prices and distance. The lowest in-stock sample price is highlighted.
            </p>
          </div>

          <div className="hp-tools-bar">
            <label className="hp-big-in">
              <Ic n="search" size={19} />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowAll(false);
                }}
                placeholder="Search by medicine, category or form"
                aria-label="Search medicines"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  style={{ background: "none", border: "none", color: "inherit", display: "flex" }}
                >
                  <Ic n="x" size={17} />
                </button>
              )}
            </label>
            <select className="hp-sel" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort pharmacies">
              <option value="price">Sort: Lowest price</option>
              <option value="distance">Sort: Nearest first</option>
            </select>
            <label className="hp-chk">
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
              In stock only
            </label>
          </div>

          <div className="hp-chips">
            {CATEGORIES.map((c) => {
              const on = category === c;
              return (
                <button
                  key={c}
                  className={"hp-chip" + (on ? " on" : "")}
                  onClick={() => {
                    setCategory(c);
                    setShowAll(false);
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>

          <div style={{ margin: "-12px 0 22px" }}>
            <p style={{ color: "#b3c7ba", fontSize: 12, marginBottom: 8 }}>Browse by health topic (educational shortcuts, not diagnosis or treatment advice)</p>
            <div className="hp-chips">{MEDICINE_TOPICS.map((topic) => <button key={topic.id} className={"hp-chip" + (healthTopic === topic.id ? " on" : "")} onClick={() => { setHealthTopic(topic.id); setShowAll(false); }}>{topic.label}</button>)}</div>
            {healthTopic !== "All" && <p className="hp-note">Topic filters show general-use information only. They do not determine what medicine is appropriate for you; ask a licensed pharmacist or clinician.</p>}
          </div>

          <div className="hp-results">
            {visible.length === 0 && (
              <div className="hp-empty">
                <b>No medicines found.</b>
                <p style={{ marginTop: 6 }}>
                  Try another name, or turn off “In stock only” to see every pharmacy that lists it.
                </p>
              </div>
            )}
            {visible.map(({ m, rows, best }) => (
              <article className="hp-med" key={m.id}>
                <div className="hp-med-h">
                  <img src={MEDICINE_IMAGE} alt="Generic illustrative medicine packaging, not this product's actual pack." loading="lazy" style={{ width: 72, height: 62, objectFit: "cover", borderRadius: 10, flex: "0 0 auto" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3>{m.name}</h3>
                    <p>{m.form} · {m.cat}</p>
                    <p style={{ color: "#a3f2c5", marginTop: 7, maxWidth: 360 }}>{MEDICINE_INFO[m.id]?.shortUse || "Open details for general medicine information."}</p>
                    <button className="hp-btn sm ghost" style={{ marginTop: 8 }} onClick={() => setSelectedMedicine(m)}>Medicine information</button>
                  </div>
                  {m.rx ? <span className="hp-rx">Sample: Rx flag</span> : <span className="hp-otc">Sample: non-Rx flag</span>}
                </div>
                {rows.map((r) => {
                  const st = statusOf(r.stock);
                  const isBest = best !== null && r.stock > 0 && r.price === best;
                  return (
                    <div className="hp-row" key={r.p.id}>
                      <div>
                        <b>{r.p.name}</b>
                        <small>
                          <Ic n="pin" size={13} /> {r.p.km} km · {r.p.area}
                          <button type="button" onClick={() => setSelectedPharmacy(r.p)} style={{ border: 0, background: "transparent", color: "#a3f2c5", padding: 0, fontSize: 10, textDecoration: "underline" }}>Map search</button>
                          <span className={"hp-pill " + st}>
                            {STATUS_LABEL[st]}{st === "low" ? ` (${r.stock})` : ""}
                          </span>
                        </small>
                      </div>
                      <div className="hp-price">
                        {isBest && <span className="hp-best">Best price</span>}
                        {kes(r.price)}
                      </div>
                      <button className="hp-btn sm" disabled={r.stock <= 0} onClick={() => addToCart(m, r)} aria-label={`Add ${m.name} from ${r.p.name} to cart`}>
                        <Ic n="plus" size={14} sw={2.5} /> Add
                      </button>
                    </div>
                  );
                })}
              </article>
            ))}
          </div>

          {results.length > 4 && (
            <div className="hp-more">
              <button className="hp-btn" onClick={() => setShowAll((s) => !s)}>
                {showAll ? "Show fewer medicines" : `Show all medicines (${results.length})`}
              </button>
            </div>
          )}
          <p className="hp-note">
            Prices, stock, delivery estimates, and pharmacy details are illustrative sample data. This page has no live pharmacy feed or connected database.
          </p>
        </div>
      </section>

      {/* ---------- Pharmacies ---------- */}
      <section id="pharmacies" className="hp-sec alt">
        <div className="hp-wrap">
          <div className="hp-head">
            <div className="hp-eyebrow">Nearby pharmacies</div>
            <h2 className="hp-h2">Partner pharmacy examples, closest first</h2>
            <p className="hp-lead">These sample listings illustrate how partner locations could appear. They are not verified live businesses.</p>
          </div>
          <div className="hp-grid3">
            {[...PHARMACIES].sort((a, b) => a.km - b.km).map((p) => (
              <div className="hp-card" key={p.id}>
                <div className="hp-ico"><Ic n="pin" size={22} /></div>
                <h3>{p.name}</h3>
                <p>{p.area} · {p.km} km away</p>
                <div className="hp-meta">
                  <span><Ic n="clock" size={16} /> {p.hours}</span>
                  <span><Ic n="truck" size={16} /> Delivery in {p.delivery}</span>
                </div>
                <span className="hp-ver"><Ic n="shield" size={13} sw={2.5} /> Sample partner listing</span>
                <button className="hp-btn sm ghost" style={{ display: "flex", marginTop: 13 }} onClick={() => setSelectedPharmacy(p)}>Open Google Maps search</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Kenya integration references ---------- */}
      <section id="kenya-integrations" className="hp-sec alt">
        <div className="hp-wrap">
          <div className="hp-head">
            <div className="hp-eyebrow">Kenya integration planning</div>
            <h2 className="hp-h2">Illustrative facilities and medicine imagery</h2>
            <p className="hp-lead">The images below are illustrative, not photos of a named hospital or a specific medicine brand. Official facility verification and approved data exchange must be completed before any real connection.</p>
          </div>
          <div className="hp-grid2">
            <article className="hp-card" style={{ padding: 0 }}>
              <img src={HOSPITAL_IMAGE} alt="Illustrative, unbranded Kenyan county hospital exterior; not a photograph of a named hospital." style={{ display: "block", width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: "17px 17px 0 0" }} />
              <div style={{ padding: 20 }}><h3>Facility directory source</h3><p>KMPDC publishes a licensed health-facility register with names, registration numbers, ownership, type, level, county, and status. This demo does not connect to the register or verify any facility automatically.</p><a className="hp-btn sm ghost" href="https://registers.kmpdc.go.ke/healthFacilities/getLicensedPublicHealthFacilities/" target="_blank" rel="noreferrer" style={{ marginTop: 12, textDecoration: "none" }}>Open KMPDC public register</a></div>
            </article>
            <article className="hp-card" style={{ padding: 0 }}>
              <img src={MEDICINE_IMAGE} alt="Illustrative assortment of unbranded medicine packs and pharmacy supplies." style={{ display: "block", width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: "17px 17px 0 0" }} />
              <div style={{ padding: 20 }}><h3>Medicines remain sample listings</h3><p>Product images and catalog records should come from authorized product data and verified pharmacy inventory. Do not use generated packaging as a medicine identification tool.</p><button className="hp-btn sm" onClick={() => go("find")}>Browse demo catalogue</button></div>
            </article>
          </div>
          <p className="hp-note">Digital health interoperability in Kenya is subject to Digital Health Agency requirements. The settings page records planning variables only; it does not connect to a hospital, NHIE, SHA, KMPDC, or pharmacy API.</p>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="hp-sec">
        <div className="hp-wrap">
          <div className="hp-head">
            <div className="hp-eyebrow">How it works</div>
            <h2 className="hp-h2">From search to your door in four steps</h2>
          </div>
          <div className="hp-grid4">
            {STEPS.map(([icon, title, text], i) => (
              <div className="hp-card hp-step" key={title}>
                <span className="hp-num">{i + 1}</span>
                <div className="hp-ico"><Ic n={icon} size={22} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="hp-sec alt">
        <div className="hp-wrap">
          <div className="hp-head">
            <div className="hp-eyebrow">What PharmaLink does</div>
            <h2 className="hp-h2">One platform for patients and pharmacies</h2>
            <p className="hp-lead">
              Most online pharmacies only serve their own branches. PharmaLink connects independent pharmacies
              so availability is shared and medicine is easier to reach.
            </p>
          </div>
          <div className="hp-grid3">
            {FEATURES.map(([icon, title, text]) => (
              <div className="hp-card" key={title}>
                <div className="hp-ico"><Ic n={icon} size={22} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Who it's for (image band) ---------- */}
      <section className="hp-sec hp-band" style={{ backgroundImage: `url("${IMG_WHO}")` }}>
        <div className="hp-wrap">
          <div className="hp-head">
            <div className="hp-eyebrow" style={{ color: "var(--mint)" }}>Built for people who struggle most</div>
            <h2 className="hp-h2">Access to medicine should not depend on distance</h2>
            <p className="hp-lead">
              Long journeys and repeated pharmacy visits delay treatment and raise transport costs. PharmaLink
              is designed to remove both.
            </p>
          </div>
          <div className="hp-grid4">
            {WHO.map(([icon, title, text]) => (
              <div className="hp-glass" key={title}>
                <div className="hp-ico"><Ic n={icon} size={22} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- For pharmacies / restock ---------- */}
      <section id="restock" className="hp-sec">
        <div className="hp-wrap hp-split">
          <div>
            <div className="hp-eyebrow">For pharmacies</div>
            <h2 className="hp-h2">Restock from each other, not from scratch</h2>
            <p className="hp-lead">
              When a medicine runs low, send a request to a partner pharmacy that has surplus. Shortages shrink
              and fewer medicines expire on the shelf.
            </p>
            <ul className="hp-list">
              <li><Ic n="check" size={18} sw={2.5} /> See low-stock alerts against your reorder level</li>
              <li><Ic n="check" size={18} sw={2.5} /> Find partners that hold surplus stock</li>
              <li><Ic n="check" size={18} sw={2.5} /> Request stock in one click and track the response</li>
              <li><Ic n="check" size={18} sw={2.5} /> Keep inventory accurate so customers see real availability</li>
            </ul>
          </div>
          <div>
            <div className="hp-rs-wrap">
              <div className="hp-rs-h">
                <span>Medicine</span><span>Your stock</span><span>Partner offer</span><span />
              </div>
              {RESTOCK.map((r) => {
                const done = !!requested[r.id];
                const pct = Math.min(100, Math.round((r.have / r.min) * 100));
                return (
                  <div className="hp-rs" key={r.id}>
                    <div><b>{r.med}</b><small>Reorder level: {r.min}</small></div>
                    <div>
                      <b>{r.have} units</b>
                      <div className="hp-bar" aria-hidden="true"><i style={{ width: pct + "%" }} /></div>
                    </div>
                    <div><b>{r.from}</b><small>{r.avail} units · {kes(r.price)} each</small></div>
                    <button
                      className={"hp-btn sm" + (done ? " done" : "")}
                      disabled={done}
                      onClick={() => {
                        setRequested((o) => ({ ...o, [r.id]: true }));
                        flash("Demo request recorded locally only; no pharmacy was contacted.");
                      }}
                    >
                      {done ? (<><Ic n="check" size={14} sw={3} /> Requested</>) : "Request stock"}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="hp-note">Preview of the restocking tool. Sample data only.</p>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="hp-sec alt">
        <div className="hp-wrap">
          <div className="hp-head" style={{ textAlign: "center" }}>
            <div className="hp-eyebrow">Questions</div>
            <h2 className="hp-h2">Frequently asked questions</h2>
          </div>
          <div className="hp-faq">
            {FAQ.map(([q, a], i) => (
              <div className={"hp-q" + (openFaq === i ? " open" : "")} key={q}>
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}>
                  {q} <Ic n="chev" size={20} />
                </button>
                <div>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA (image band) ---------- */}
      <section className="hp-band hp-cta" style={{ backgroundImage: `url("${IMG_CTA}")` }}>
        <div className="hp-wrap">
          <h2>Ready to find your medicine?</h2>
          <p>Compare illustrative medicine listings. Verify real stock, pharmacy credentials, payment terms and delivery directly with a licensed pharmacy.</p>
          <button className="hp-btn light" onClick={() => go("find")}>
            Search medicines <Ic n="arrow" size={18} sw={2.5} />
          </button>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="hp-foot">
        <div className="hp-wrap">
          <div className="hp-foot-g">
            <div>
              <h4>{BRAND}</h4>
              <p style={{ maxWidth: 360 }}>
                A presentation prototype illustrating a pharmacy search, comparison, cart, and stock-request experience. Sample data only; not connected to pharmacies.
              </p>
            </div>
            <div>
              <h4>Explore</h4>
              {NAV.slice(1).map(([label, id]) => (
                <button className="lk" key={id} onClick={() => go(id)}>{label}</button>
              ))}
            </div>
            <div>
              <h4>Account</h4>
              <button className="lk" onClick={() => setCartOpen(true)}>My cart</button>
              <button className="lk" onClick={onLogout}>Log out</button>
            </div>
          </div>
          <div className="hp-foot-b">
            <span>
              {BRAND} helps you find and order medicine. It does not diagnose, prescribe or give treatment
              advice. Always follow your pharmacist’s or doctor’s guidance.
            </span>
            <span>
              {BRAND} does not diagnose, prescribe or give treatment advice. Always follow a licensed pharmacist’s or doctor’s guidance. · Online Pharmacy Management System project
            </span>
          </div>
        </div>
      </footer>

      {/* ---------- Cart drawer ---------- */}
      {cartOpen && (
        <div className="hp-ov" onMouseDown={(e) => e.target === e.currentTarget && closeDrawer()}>
          <aside className="hp-drawer" role="dialog" aria-modal="true" aria-label="Your cart">
            <div className="hp-dh">
              <h3>{order ? (order.simulated ? "Simulation complete" : "Order placed") : `Your cart (${cartCount})`}</h3>
              <button className="hp-x" onClick={closeDrawer} aria-label="Close cart"><Ic n="x" size={18} /></button>
            </div>

            {order ? (
              <div className="hp-db">
                <div className="hp-ok">
                  <div className="hp-ico"><Ic n="check" size={30} sw={3} /></div>
                  <h3 style={{ fontSize: 20, fontWeight: 800 }}>Thank you, {first}!</h3>
                  <p style={{ color: "var(--muted)", marginTop: 8, fontSize: 14 }}>
                    {order.simulated ? <>Simulated M-Pesa approval for <b>{order.ref}</b> ({kes(order.total)}). No money moved{order.receipt ? <>. Simulated receipt: <b>{order.receipt}</b></> : null}.</> : <>M-Pesa payment for <b>{order.ref}</b> ({kes(order.total)}) is confirmed{order.receipt ? <>. Receipt: <b>{order.receipt}</b></> : null}.</>}
                  </p>
                  <p style={{ color: "#8aa093", marginTop: 10, fontSize: 12 }}>
                    {order.simulated ? "Simulation record saved in this browser only. No Safaricom callback occurred; this build does not send orders to pharmacies or dispatch delivery." : "Payment callback confirmation is recorded. This presentation build still does not send the order to a real pharmacy or dispatch delivery."}
                  </p>
                  <button className="hp-btn" style={{ marginTop: 22 }} onClick={closeDrawer}>Continue shopping</button>
                </div>
              </div>
            ) : cart.length === 0 ? (
              <div className="hp-db">
                <div className="hp-ok">
                  <div className="hp-ico" style={{ background: "#e3f6ec", color: "var(--gd)" }}><Ic n="cart" size={28} /></div>
                  <h3 style={{ fontSize: 18, fontWeight: 800 }}>Your cart is empty</h3>
                  <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>Search for a medicine and add it from the pharmacy you prefer.</p>
                  <button className="hp-btn" style={{ marginTop: 20 }} onClick={() => { closeDrawer(); go("find"); }}>Find medicine</button>
                </div>
              </div>
            ) : (
              <>
                <div className="hp-db">
                  {groups.map(([pharm, items]) => (
                    <div className="hp-grp" key={pharm}>
                      <h4><Ic n="pin" size={14} /> {pharm}</h4>
                      {items.map((i) => (
                        <div className="hp-ci" key={i.key}>
                          <div>
                            <b>{i.name}</b>
                            <small>{kes(i.price)} each{i.rx ? " · Prescription required" : ""}</small>
                            <div className="hp-qty">
                              <button onClick={() => changeQty(i.key, -1)} disabled={paymentInProgress} aria-label={`Remove one ${i.name}`}><Ic n="minus" size={13} sw={3} /></button>
                              <b>{i.qty}</b>
                              <button onClick={() => changeQty(i.key, 1)} disabled={i.qty >= i.stock || paymentInProgress} aria-label={`Add one ${i.name}`}><Ic n="plus" size={13} sw={3} /></button>
                            </div>
                          </div>
                          <b>{kes(i.price * i.qty)}</b>
                        </div>
                      ))}
                    </div>
                  ))}
                  {hasRx && (
                    <div style={{ fontSize: 12.5, color: "#8a5a00", background: "#fff3d6", borderRadius: 12, padding: "10px 12px" }}>
                      <p style={{ margin: 0 }}>This preview does not upload or validate prescriptions. A real pharmacy must verify a valid prescription before dispensing.</p>
                      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 9, cursor: "pointer" }}>
                        <input type="checkbox" checked={rxConfirmed} disabled={paymentInProgress} onChange={(e) => setRxConfirmed(e.target.checked)} />
                        <span>I confirm I have a valid prescription to present to the pharmacy.</span>
                      </label>
                    </div>
                  )}
                </div>
                <div className="hp-df">
                  <div className="hp-tot"><span>Subtotal</span><span>{kes(subtotal)}</span></div>
                  <div className="hp-tot"><span>Delivery ({groups.length} pharmac{groups.length > 1 ? "ies" : "y"})</span><span>{kes(deliveryTotal)}</span></div>
                  <div className="hp-tot big"><span>Total</span><span>{kes(total)}</span></div>
                  <label className="hp-pay-label" htmlFor="mpesa-phone">{MPESA_SIMULATION_ONLY ? "Phone number shown in simulator" : "M-Pesa phone number"}</label>
                  <div className="hp-pay-phone"><span>{MPESA_SIMULATION_ONLY ? "KE · SIM" : "KE +254"}</span><input id="mpesa-phone" type="tel" inputMode="tel" autoComplete="tel" value={mpesaPhone} disabled={paymentInProgress} onChange={(event) => setMpesaPhone(event.target.value)} placeholder="0712 345 678" aria-describedby="mpesa-help" /></div>
                  <p id="mpesa-help" className="hp-pay-help">{MPESA_SIMULATION_ONLY ? "SIMULATION ONLY: a mock prompt will appear here. Nothing is sent to Safaricom, no PIN is entered, and no money moves." : "We send an STK prompt to this phone. Enter your PIN only in the M-Pesa prompt on your device; PharmaLink never asks for your PIN."}</p>
                  {mpesaPayment && <div className={`hp-pay-state ${mpesaPayment.status}`} role="status" aria-live="polite"><b>{mpesaPayment.status === "paid" ? (mpesaPayment.simulated ? "Simulation approved" : "Payment confirmed") : mpesaPayment.status === "pending" || mpesaPayment.status === "checking" ? (mpesaPayment.simulated ? "Simulated prompt open" : "Waiting for payment") : mpesaPayment.status === "review" ? "Manual review required" : (mpesaPayment.simulated ? "Simulation ended" : "Payment not completed")}</b><span>{mpesaPayment.message}</span>{mpesaPayment.status === "pending" && !mpesaPayment.simulated && <button type="button" className="hp-btn sm ghost" onClick={() => pollMpesaPayment(mpesaPayment)}>Check status</button>}</div>}
                  <button className="hp-btn hp-mpesa-btn" style={{ width: "100%", marginTop: 12 }} onClick={MPESA_SIMULATION_ONLY ? startMpesaSimulation : payWithMpesa} disabled={!!mpesaPayment && ["starting", "checking", "pending", "paid", "review"].includes(mpesaPayment.status)}><span className="hp-mpesa-mark">M</span>{mpesaPayment?.status === "starting" ? "Starting…" : mpesaPayment?.status === "checking" || mpesaPayment?.status === "pending" ? "Prompt open · choose outcome" : mpesaPayment?.status === "paid" ? (mpesaPayment.simulated ? "Simulation approved" : "Paid") : mpesaPayment?.status === "review" ? "Manual review required" : (MPESA_SIMULATION_ONLY ? "Start M-Pesa simulation" : "Pay with M-Pesa")}</button>
                  <p className="hp-pay-secure"><Ic n="shield" size={14} />{MPESA_SIMULATION_ONLY ? "Local simulator · no Safaricom connection · no real funds" : "Server-side Daraja credentials · callback-confirmed status · PIN never collected"}</p><p className="hp-pay-help" style={{ textAlign: "center", marginTop: 6 }}>This presentation build does not submit paid orders to pharmacies or dispatch deliveries.</p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {simPrompt && (
        <div className="hp-ov" style={{ justifyContent: "center", alignItems: "center", padding: 16 }} role="presentation">
          <section className="hp-drawer hp-sim-prompt" role="dialog" aria-modal="true" aria-label="Simulated mobile-money payment prompt" style={{ width: "min(420px,100%)", height: "auto", maxHeight: "92vh", border: "1px solid rgba(163,242,197,.22)", borderRadius: 20, overflow: "hidden" }}>
            <div className="hp-dh"><div><h3>Mobile-money prompt</h3><small style={{ color: "#f1c986", fontWeight: 850, letterSpacing: ".08em" }}>SIMULATION ONLY</small></div><button className="hp-x" onClick={() => finishMpesaSimulation("cancelled")} aria-label="Cancel simulated prompt"><Ic n="x" size={18} /></button></div>
            <div className="hp-db" style={{ padding: 22 }}>
              <div style={{ border: "1px solid rgba(163,242,197,.2)", borderRadius: 17, padding: 20, background: "linear-gradient(150deg,#102f20,#0a2016)", textAlign: "center" }}>
                <div style={{ color: "#a3f2c5", fontSize: 12, fontWeight: 900, letterSpacing: ".16em" }}>M-PESA · DEMO</div>
                <h2 style={{ fontSize: 28, margin: "13px 0 2px", color: "#f2f8f4" }}>{kes(simPrompt.amount)}</h2>
                <p style={{ color: "#b3c7ba", fontSize: 12 }}>PharmaLink presentation checkout</p>
                <div style={{ textAlign: "left", display: "grid", gap: 8, marginTop: 18, paddingTop: 15, borderTop: "1px solid rgba(197,231,209,.14)", color: "#dbe9df", fontSize: 12 }}><span>Phone: <b>{simPrompt.phone}</b></span><span>Account: <b>{simPrompt.reference}</b></span><span>Request: <b>STK-style prompt demonstration</b></span></div>
              </div>
              <p role="note" style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "#332817", color: "#f1c986", fontSize: 11, lineHeight: 1.6 }}><b>Not a real M-Pesa screen.</b> This local simulation does not contact Safaricom, send an actual phone prompt, collect a PIN, or move money.</p>
              <div style={{ display: "grid", gap: 9, marginTop: 14 }}><button className="hp-btn hp-mpesa-btn" onClick={() => finishMpesaSimulation("approved")}>Approve simulation · no money moved</button><button className="hp-btn ghost" onClick={() => finishMpesaSimulation("rejected")}>Simulate a rejected payment</button><button className="hp-btn ghost" onClick={() => finishMpesaSimulation("cancelled")}>Cancel simulated request</button><button className="hp-btn ghost" onClick={() => finishMpesaSimulation("timeout")}>Simulate no response / timeout</button></div>
            </div>
          </section>
        </div>
      )}

      {selectedMedicine && (
        <div className="hp-ov" onMouseDown={(event) => event.target === event.currentTarget && setSelectedMedicine(null)}>
          <section className="hp-drawer" role="dialog" aria-modal="true" aria-label={`${selectedMedicine.name} information`} style={{ width: "min(720px,100%)", overflowY: "auto" }}>
            <div className="hp-dh"><h3>Medicine information</h3><button className="hp-x" onClick={() => setSelectedMedicine(null)} aria-label="Close medicine information"><Ic n="x" size={18} /></button></div>
            <div className="hp-db">
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
                <img src={MEDICINE_IMAGE} alt="Illustrative unbranded medicine packs, not a product image." style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 13 }} />
                <div><p className="hp-eyebrow">{selectedMedicine.cat}</p><h2 style={{ fontSize: 24, marginTop: 6 }}>{selectedMedicine.name}</h2><p style={{ color: "#b3c7ba", fontSize: 12 }}>{selectedMedicine.form}</p></div>
              </div>
              {MEDICINE_INFO[selectedMedicine.id] ? <>
                <article className="hp-card" style={{ marginBottom: 12 }}><h3>What it is</h3><p style={{ marginTop: 7 }}>{MEDICINE_INFO[selectedMedicine.id].whatItIs}</p></article>
                <article className="hp-card" style={{ marginBottom: 12 }}><h3>Common uses</h3><ul className="hp-list">{MEDICINE_INFO[selectedMedicine.id].commonUses.map((use, index) => <li key={index}><Ic n="check" size={16} />{use}</li>)}</ul></article>
                <article className="hp-card" style={{ marginBottom: 12 }}><h3>Safety notes</h3><ul className="hp-list">{MEDICINE_INFO[selectedMedicine.id].safetyNotes.map((note, index) => <li key={index}><Ic n="shield" size={16} />{note}</li>)}</ul></article>
                <p className="hp-note" style={{ color: "#f1c986" }}>{MEDICINE_INFO[selectedMedicine.id].disclaimer}</p>
                <details style={{ marginTop: 16, fontSize: 12 }}><summary style={{ cursor: "pointer", color: "#a3f2c5" }}>Sources and further reading</summary><ul className="hp-list">{MEDICINE_INFO[selectedMedicine.id].sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" style={{ color: "#a3f2c5" }}>{source.title}</a></li>)}</ul></details>
              </> : <p className="hp-note">Verified general information is not yet available for this item.</p>}
            </div>
          </section>
        </div>
      )}
      {selectedPharmacy && (() => {
        const location = pharmacyLocations.find((entry) => entry.id === selectedPharmacy.id) || {};
        const hasCoords = Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude)) && location.latitude !== "" && location.longitude !== "" && Math.abs(Number(location.latitude)) <= 90 && Math.abs(Number(location.longitude)) <= 180;
        const mapQuery = hasCoords ? `${location.latitude},${location.longitude}` : [location.address, selectedPharmacy.name, selectedPharmacy.area, integrationConfig.mapRegion, "Kenya"].filter(Boolean).join(", ");
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
        const mapEmbed = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
        return <div className="hp-ov" onMouseDown={(event) => event.target === event.currentTarget && setSelectedPharmacy(null)}>
          <section className="hp-drawer" role="dialog" aria-modal="true" aria-label="Pharmacy map search" style={{ width: "min(760px,100%)", overflowY: "auto" }}>
            <div className="hp-dh"><div><h3>Map search · {selectedPharmacy.name}</h3><small style={{ color: "#b3c7ba" }}>{location.address || selectedPharmacy.area}{hasCoords ? " · coordinate pin configured (verify before publishing)" : " · area/name search only"}</small></div><button className="hp-x" onClick={() => setSelectedPharmacy(null)} aria-label="Close map"><Ic n="x" size={18} /></button></div>
            <div className="hp-db"><iframe title={`Google Maps search for ${selectedPharmacy.name}`} src={mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" style={{ width: "100%", height: 390, border: 0, borderRadius: 14, background: "#0b2417" }} />
              <p className="hp-note" style={{ color: "#f1c986" }}>{hasCoords ? "Map centered on the coordinates entered in the admin settings; this demo has not verified the business or pin." : "This is a name-and-area search, not a confirmed pharmacy pin. The example pharmacy and area may be fictional. Enter verified address/coordinates in admin settings before directing customers."}</p>
              <a href={mapUrl} target="_blank" rel="noreferrer" className="hp-btn sm" style={{ marginTop: 10, textDecoration: "none" }}>Open full Google Maps search</a>
            </div>
          </section>
        </div>;
      })()}

      {adminOpen && (
        <div className="hp-admin" style={{ position: "fixed", inset: 0, zIndex: 500, background: "#06160e", overflowY: "auto", color: "#f2f8f4", padding: "20px clamp(14px,4vw,46px) 50px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", borderBottom: "1px solid rgba(197,231,209,.16)", paddingBottom: 16, marginBottom: 24 }}>
              <div><p style={{ color: "#a3f2c5", fontSize: 11, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase" }}>PharmaLink · administration</p><h1 style={{ fontSize: "clamp(24px,4vw,38px)", margin: "5px 0 0" }}>Order records & integration settings</h1></div>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                {adminAuthed && <button className="hp-btn sm ghost" onClick={() => { setAdminAuthed(false); setAdminPassword(""); }}>Lock</button>}
                <button className="hp-btn sm ghost" onClick={() => { setAdminOpen(false); setAdminAuthed(false); }}>Back to homepage</button>
              </div>
            </header>
            {!adminAuthed ? (
              <section className="hp-card" style={{ maxWidth: 480, margin: "60px auto", padding: 28 }}>
                <div className="hp-eyebrow">Admin sign-in</div><h2 style={{ fontSize: 24, margin: "8px 0" }}>Rose’s demo records</h2>
                <p style={{ color: "#b3c7ba", fontSize: 13, marginBottom: 18 }}>Enter the demo password to view local order records and integration planning fields.</p>
                <form onSubmit={adminLogin}>
                  <label htmlFor="admin-password" style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Admin password</label>
                  <input id="admin-password" type="password" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} className="hp-sel" style={{ width: "100%", marginBottom: 12 }} />
                  <button className="hp-btn" type="submit" style={{ width: "100%" }}>Open records</button>
                </form>
                <p className="hp-note" style={{ color: "#f1c986" }}>Security notice: this is a front-end demo gate with the password in the JSX source. It is not authentication and must not protect real records. Use a server-side account system before deployment.</p>
              </section>
            ) : (
              <>
                <div className="hp-grid4" style={{ marginBottom: 20 }}>
                  <div className="hp-card"><small style={{ color: "#b3c7ba" }}>Demo order records</small><div style={{ color: "#a3f2c5", fontSize: 30, fontWeight: 800 }}>{orders.length}</div></div>
                  <div className="hp-card"><small style={{ color: "#b3c7ba" }}>Recorded line items</small><div style={{ color: "#a3f2c5", fontSize: 30, fontWeight: 800 }}>{orders.reduce((n, record) => n + (record.items || []).length, 0)}</div></div>
                  <div className="hp-card"><small style={{ color: "#b3c7ba" }}>Demo gross order value</small><div style={{ color: "#a3f2c5", fontSize: 25, fontWeight: 800 }}>{kes(orders.reduce((n, record) => n + (Number(record.total) || 0), 0))}</div></div>
                  <div className="hp-card"><small style={{ color: "#b3c7ba" }}>Storage / connection</small><div style={{ color: "#f1c986", fontSize: 14, fontWeight: 800, marginTop: 9 }}>Browser only · Not connected</div></div>
                </div>
                <div className="hp-tools-bar" style={{ marginBottom: 18 }}>
                  <button className={"hp-chip" + (adminTab === "records" ? " on" : "")} onClick={() => setAdminTab("records")}>Order database</button>
                  <button className={"hp-chip" + (adminTab === "payments" ? " on" : "")} onClick={() => setAdminTab("payments")}>Simulated payments</button>
                  <button className={"hp-chip" + (adminTab === "integrations" ? " on" : "")} onClick={() => setAdminTab("integrations")}>Kenya integrations</button>
                  <span style={{ flex: 1 }} />
                  {adminTab === "records" && <><button className="hp-btn sm ghost" onClick={exportOrdersCsv} disabled={!orders.length}>Export CSV</button><button className="hp-btn sm ghost" onClick={exportOrdersJson} disabled={!orders.length}>Export JSON</button></>}
                </div>
                {adminTab === "records" ? (
                  <section>
                    <div className="hp-card" style={{ marginBottom: 16 }}><label style={{ display: "block", fontSize: 12, marginBottom: 7 }} htmlFor="order-search">Filter by order, customer, pharmacy, or medicine</label><input id="order-search" className="hp-sel" value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="Search records" style={{ width: "100%" }} /></div>
                    {orders.length === 0 ? <div className="hp-empty">No demo orders yet. Add a sample item to the cart and approve a simulated payment; its line items will appear here with SIMULATED status.</div> : (
                      <div style={{ display: "grid", gap: 13 }}>
                        {orders.filter((record) => JSON.stringify(record).toLowerCase().includes(orderSearch.toLowerCase())).map((record) => (
                          <article className="hp-card" key={record.ref}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
                              <div><h2 style={{ fontSize: 17 }}>{record.ref}</h2><p style={{ color: "#b3c7ba", fontSize: 12 }}>{new Date(record.createdAt).toLocaleString("en-KE")} · Customer: {record.customer}</p></div>
                              <div style={{ textAlign: "right" }}><span className="hp-pill low">{record.status}</span><p style={{ fontSize: 16, fontWeight: 800, marginTop: 6 }}>{kes(record.total)}</p></div>
                            </div>
                            <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700, fontSize: 12 }}><thead><tr>{["Pharmacy", "Medicine", "Qty", "Unit price", "Line total", "Rx"].map((title) => <th key={title} style={{ textAlign: "left", color: "#a3f2c5", padding: "9px 8px", borderBottom: "1px solid rgba(197,231,209,.16)" }}>{title}</th>)}</tr></thead><tbody>{record.items.map((item, i) => <tr key={record.ref + i}>{[item.pharmacyName, item.medicineName, item.quantity, kes(item.unitPrice), kes(item.lineTotal), item.prescriptionRequired ? "Yes" : "No"].map((value, j) => <td key={j} style={{ padding: "9px 8px", borderBottom: "1px solid rgba(197,231,209,.08)" }}>{value}</td>)}</tr>)}</tbody></table></div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 22, flexWrap: "wrap", fontSize: 12, marginTop: 12, color: "#b3c7ba" }}><span>Subtotal: {kes(record.subtotal)}</span><span>Delivery: {kes(record.deliveryFee)}</span><b style={{ color: "#e7f2ea" }}>Total: {kes(record.total)}</b><span>Payment: {record.paymentStatus}</span></div>
                          </article>
                        ))}
                      </div>
                    )}
                    <p className="hp-note">Records are stored in this browser’s localStorage only. They are not encrypted, synchronized, or suitable for patient-identifiable or real business records.</p>
                  </section>
                ) : adminTab === "payments" ? (
                  <section>
                    <div className="hp-card" style={{ marginBottom: 14, borderColor: "rgba(241,201,134,.3)" }}><div className="hp-eyebrow">Simulation only</div><p style={{ marginTop: 8 }}>These are locally generated outcomes, not Safaricom transactions. No STK request, PIN, callback, or funds movement occurred.</p></div>
                    {paymentEvents.length ? <div style={{ display: "grid", gap: 12 }}>{paymentEvents.map((event) => <article className="hp-card" key={event.id} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 12, alignItems: "center" }}><div><small className="hp-note">Reference</small><b style={{ display: "block" }}>{event.reference}</b></div><div><small className="hp-note">Time</small><b style={{ display: "block" }}>{new Date(event.createdAt).toLocaleString("en-KE")}</b></div><div><small className="hp-note">Phone shown</small><b style={{ display: "block" }}>{event.phoneMasked}</b></div><div><small className="hp-note">Amount</small><b style={{ display: "block" }}>{kes(event.amount)}</b></div><div><small className="hp-note">Result</small><b style={{ display: "block", color: "#f1c986" }}>{event.status}</b></div><div><small className="hp-note">Receipt</small><b style={{ display: "block" }}>{event.receipt || "None · not approved"}</b></div></article>)}</div> : <div className="hp-empty">No simulated prompt attempts yet. Run the cart simulator to record approved, rejected, cancelled, or timed-out outcomes.</div>}
                    <p className="hp-note">The simulator transaction log is stored in this browser’s localStorage and is for presentation use only.</p>
                  </section>
                ) : (
                  <section className="hp-grid2" style={{ alignItems: "start" }}>
                    <form className="hp-card" onSubmit={(event) => { event.preventDefault(); flash("Integration planning settings saved on this browser."); }}>
                      <div className="hp-eyebrow">Configuration variables</div><h2 style={{ fontSize: 20, margin: "8px 0 14px" }}>Facility & connection planning</h2>
                      {[ ["facilityName", "Facility / pharmacy name"], ["kmpdcRegistration", "KMPDC facility registration number"], ["county", "County"], ["facilityLevel", "Facility level / type"], ["nhieBaseUrl", "Approved NHIE / interface base URL"], ["organizationId", "Organization / facility identifier"], ["clientId", "Integration client ID (non-secret)"], ["webhookUrl", "Webhook / callback URL"], ["dataController", "Data controller / DPO contact"], ["consentUrl", "Patient consent / privacy notice URL"], ["pharmacySystem", "Existing pharmacy / hospital system" ], ["mapRegion", "Map search area / town (verify exact address)" ] ].map(([key, label]) => <label key={key} style={{ display: "block", fontSize: 11, fontWeight: 700, margin: "10px 0 0" }}>{label}<input className="hp-sel" style={{ display: "block", width: "100%", marginTop: 5 }} value={integrationConfig[key] || ""} onChange={(event) => setIntegrationConfig((config) => ({ ...config, [key]: event.target.value }))} placeholder="Enter only non-secret planning data" /></label>)}
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginTop: 10 }}>DHA certification status<select className="hp-sel" style={{ display: "block", width: "100%", marginTop: 5 }} value={integrationConfig.dhaStatus} onChange={(event) => setIntegrationConfig((config) => ({ ...config, dhaStatus: event.target.value }))}>{["Planning", "Not started", "In progress", "Submitted", "Certified"].map((value) => <option key={value}>{value}</option>)}</select></label>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginTop: 10 }}>ODPC / privacy assessment status<select className="hp-sel" style={{ display: "block", width: "100%", marginTop: 5 }} value={integrationConfig.odpcStatus} onChange={(event) => setIntegrationConfig((config) => ({ ...config, odpcStatus: event.target.value }))}>{["Not assessed", "Planning", "In progress", "Reviewed"].map((value) => <option key={value}>{value}</option>)}</select></label>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginTop: 10 }}>Notes<textarea className="hp-sel" style={{ display: "block", width: "100%", minHeight: 90, marginTop: 5 }} value={integrationConfig.notes || ""} onChange={(event) => setIntegrationConfig((config) => ({ ...config, notes: event.target.value }))} placeholder="Integration owner, approvals, test environment, scope..." /></label>
                      <div style={{ borderTop: "1px solid rgba(197,231,209,.16)", marginTop: 18, paddingTop: 14 }}><h3 style={{ fontSize: 15 }}>Pharmacy map locations</h3><p className="hp-note">Enter verified full addresses or coordinates. Demo locations are blank/unverified by default.</p>
                        {PHARMACIES.map((pharmacy) => { const location = pharmacyLocations.find((entry) => entry.id === pharmacy.id) || { id: pharmacy.id, address: "", latitude: "", longitude: "", verified: false }; return <div key={pharmacy.id} style={{ borderTop: "1px solid rgba(197,231,209,.09)", padding: "12px 0" }}><b style={{ fontSize: 12 }}>{pharmacy.name}</b><input className="hp-sel" style={{ width: "100%", marginTop: 6 }} value={location.address || ""} placeholder="Verified street address / landmark" onChange={(event) => setPharmacyLocations((all) => all.map((item) => item.id === pharmacy.id ? { ...item, address: event.target.value, verified: false } : item))} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 7 }}><input className="hp-sel" type="number" step="any" value={location.latitude || ""} placeholder="Latitude" aria-label={`${pharmacy.name} latitude`} onChange={(event) => setPharmacyLocations((all) => all.map((item) => item.id === pharmacy.id ? { ...item, latitude: event.target.value, verified: false } : item))} /><input className="hp-sel" type="number" step="any" value={location.longitude || ""} placeholder="Longitude" aria-label={`${pharmacy.name} longitude`} onChange={(event) => setPharmacyLocations((all) => all.map((item) => item.id === pharmacy.id ? { ...item, longitude: event.target.value, verified: false } : item))} /></div></div>; })}
                      </div>
                      <p className="hp-note" style={{ color: "#f1c986" }}>Never paste passwords, API secrets, private keys, or real patient information here. These fields are saved as plain text in browser storage. There is no connection test or API call.</p>
                      <button className="hp-btn sm" type="submit" style={{ marginTop: 12 }}>Save planning fields</button>
                    </form>
                    <div style={{ display: "grid", gap: 14 }}>
                      <article className="hp-card"><h3>Kenya digital-health pathway</h3><p style={{ marginTop: 8 }}>The Digital Health Agency publishes certification and regulatory guidance for systems exchanging health data. The page records planning details only; a production connection requires approved technical onboarding, security review, data-protection work, and the relevant facility permissions.</p><a className="hp-btn sm ghost" href="https://certification.dha.go.ke/regulatory-guide" target="_blank" rel="noreferrer" style={{ marginTop: 12, textDecoration: "none" }}>DHA regulatory guide</a></article>
                      <article className="hp-card"><h3>Real facility reference example</h3><p style={{ marginTop: 8 }}>KMPDC’s public licensed-facility register currently lists Kiambu County Referral Hospital as a Level 4A hospital in Kiambu County. This is a directory example only; PharmaLink has no affiliation or data link with it.</p><a className="hp-btn sm ghost" href="https://registers.kmpdc.go.ke/healthFacilities/getLicensedPublicHealthFacilities/" target="_blank" rel="noreferrer" style={{ marginTop: 12, textDecoration: "none" }}>Verify in KMPDC register</a></article>
                      <article className="hp-card"><h3>Integration fields to confirm with each partner</h3><ul className="hp-list"><li><Ic n="check" size={16} /> Legal organization name and active facility licence</li><li><Ic n="check" size={16} /> Approved endpoint, sandbox, data scope, and identity method</li><li><Ic n="check" size={16} /> Consent, data controller, retention, and incident process</li><li><Ic n="check" size={16} /> Stock units, pack sizes, batch/expiry, price, and update frequency</li><li><Ic n="check" size={16} /> Named technical contact and written authorization</li></ul></article>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="hp-toast" role="status" style={{ zIndex: 700 }}>
          <Ic n="check" size={16} sw={3} /> {toast}
        </div>
      )}
    </div>
  );
}