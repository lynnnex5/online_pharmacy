import { useEffect, useState } from "react";
import Login from "./pages/login";
import Home from "./pages/home";
import FindMedicine from "./pages/find-medicine";
import Pharmacies from "./pages/pharmacies";
import HowItWorks from "./pages/how";
import ForPharmacies from "./pages/restock";
import FAQ from "./pages/faq";
import Cart from "./pages/cart";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const SESSION_KEY = "pharmalink_session";
const EXIT_MS = 170;

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function readRoute() {
  return window.location.hash.replace(/^#/, "") || "/home";
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [user, setUser] = useState(readSession);
  const [leaving, setLeaving] = useState(false);
  const pageRoutes = ["/home", "/find", "/pharmacies", "/how", "/restock", "/faq", "/cart"];
  const signedInRoute = pageRoutes.includes(route);

  useEffect(() => {
    function syncAppState() {
      setRoute(readRoute());
      setUser(readSession());
      setLeaving(false);
    }
    window.addEventListener("hashchange", syncAppState);
    window.addEventListener("storage", syncAppState);
    return () => {
      window.removeEventListener("hashchange", syncAppState);
      window.removeEventListener("storage", syncAppState);
    };
  }, []);

  useEffect(() => {
    if (signedInRoute && !user) window.location.hash = "/login";
  }, [signedInRoute, user]);

  function logout() {
    setLeaving(true);
    window.setTimeout(() => {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      setUser(null);
      window.location.hash = "/login";
    }, EXIT_MS);
  }

  function navigate(destination) {
    if (["home", "find", "pharmacies", "how", "restock", "faq", "cart"].includes(destination)) {
      if (route === `/${destination}`) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setLeaving(true);
      window.setTimeout(() => {
        window.location.hash = `/${destination}`;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, EXIT_MS);
      return;
    }
    if (route === "/home") {
      document.getElementById(destination)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setLeaving(true);
    window.setTimeout(() => {
      window.location.hash = "/home";
      window.setTimeout(() => document.getElementById(destination)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }, EXIT_MS);
  }

  if (!signedInRoute) return <Login />;
  if (!user) return null;

  const pages = {
    "/home": Home,
    "/find": FindMedicine,
    "/pharmacies": Pharmacies,
    "/how": HowItWorks,
    "/restock": ForPharmacies,
    "/faq": FAQ,
    "/cart": Cart,
  };
  const Page = pages[route] || Home;
  return (
    <div className={`pharmalink-authenticated-app${leaving ? " is-leaving" : ""}`}>
      <Navbar key={`navbar-${route}`} user={user} onLogout={logout} onNavigate={navigate} activeRoute={route} />
      <div key={`page-${route}`} className="pharmalink-route-transition"><Page user={user} onNavigate={navigate} /></div>
      <Footer key={`footer-${route}`} onNavigate={navigate} />
      <style>{`@keyframes pharmalink-page-in{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}.pharmalink-route-transition{animation:pharmalink-page-in .34s ease both}.pharmalink-authenticated-app.is-leaving .pl-navbar,.pharmalink-authenticated-app.is-leaving .pl-footer,.pharmalink-authenticated-app.is-leaving .pharmalink-route-transition{opacity:0;transform:translateY(9px);filter:blur(2px);transition:opacity .16s ease,transform .16s ease,filter .16s ease;pointer-events:none}@media(prefers-reduced-motion:reduce){.pharmalink-route-transition{animation:none}.pharmalink-authenticated-app.is-leaving .pl-navbar,.pharmalink-authenticated-app.is-leaving .pl-footer,.pharmalink-authenticated-app.is-leaving .pharmalink-route-transition{transition:none}}`}</style>
    </div>
  );
}
