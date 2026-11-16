import React, { useState, useEffect } from 'react';
import Login from './pages/login';
import Home from './pages/home';

const SESSION_KEY = "pharmalink_session";

const readSession = () => {
  try {
    return JSON.parse(
      sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)
    );
  } catch {
    return null;
  }
};
const readHash = () => window.location.hash.replace(/^#/, "");

export default function App() {
  const [hash, setHash] = useState(readHash);
  const [user, setUser] = useState(readSession);

  useEffect(() => {
    const onChange = () => {
      setHash(readHash());
      setUser(readSession());
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const onHome = hash === "/home";

  useEffect(() => {
    if (onHome && !user) window.location.hash = "/login";
  }, [onHome, user]);

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
    window.location.hash = "/login";
  };

  if (onHome && user) return <Home user={user} onLogout={logout} />;
  if (onHome) return null;
  return <Login />;
}