"use client";

import Link from "next/link";
import {motion} from "motion/react";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, GraduationCap, Home, Library, Target, UserRound } from "lucide-react";

export const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Study plan", href: "/study-plan", icon: CalendarDays },
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "Timetable", href: "/timetable", icon: GraduationCap },
  { label: "Study materials", href: "/study-materials", icon: Library },
  { label: "Progress", href: "/progress", icon: Target },
  { label: "Academic profile", href: "/profile", icon: UserRound },
];

export default function Sidebar() {
  const pathname = usePathname();
  return <aside className="sidebar hidden md:flex">
    <Link href="/" className="brand-lockup"><span className="brand-mark"><GraduationCap size={21}/></span><span><strong>ExamPilot</strong><small>KTU STUDY DESK</small></span></Link>
    <p className="nav-caption">YOUR WORKSPACE</p>
    <nav className="sidebar-nav" aria-label="Main navigation">
      {navItems.map(({label,href,icon:Icon}) => {
        const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`nav-link ${active ? "active" : ""}`}>{active&&<motion.span layoutId="sidebar-active-pill" className="absolute inset-0 rounded-xl bg-[var(--surface-muted)]" transition={{type:"spring",stiffness:420,damping:34}}/>}<span className="relative z-10"><Icon size={18}/></span><span className="relative z-10">{label}</span></Link>;
      })}
    </nav>
    <div className="sidebar-note"><span className="note-rule"/><p>KTU exams, minus the last-minute scramble.</p></div>
  </aside>;
}
