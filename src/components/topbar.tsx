"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

export default function Topbar() {
  const [name,setName] = useState("");
  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem("exampilot-profile-draft") || "null") as {name?:string}|null;
      setName(profile?.name?.trim() || "");
    } catch { setName(""); }
  }, []);
  const initial = name ? Array.from(name)[0].toUpperCase() : "S";
  return <header className="topbar">
    <div className="flex items-center gap-3"><span className="brand-mark md:hidden"><Menu size={19}/></span><div><p className="topbar-title">Your study desk</p><p className="topbar-subtitle">APJ Abdul Kalam Technological University</p></div></div>
    <div className="flex items-center gap-3"><ThemeToggle/><Link href="/profile" aria-label="Open academic profile" className="avatar">{initial}</Link></div>
  </header>;
}
