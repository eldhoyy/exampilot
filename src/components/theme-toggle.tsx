"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("exampilot-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = saved ? saved === "dark" : prefersDark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    setDark(next);
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("exampilot-theme", next ? "dark" : "light");
  }
  return <button type="button" onClick={toggle} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} className="icon-button"><span className="sr-only">{dark ? "Light mode" : "Dark mode"}</span>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button>;
}
