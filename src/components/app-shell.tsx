"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, Home, MoreHorizontal, GraduationCap } from "lucide-react";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";

const tabs = [
  {label:"Home",href:"/",icon:Home},
  {label:"Plan",href:"/study-plan",icon:CalendarDays},
  {label:"Subjects",href:"/subjects",icon:BookOpen},
  {label:"Timetable",href:"/timetable",icon:GraduationCap},
  {label:"More",href:"/progress",icon:MoreHorizontal},
];

export default function AppShell({children}:{children:React.ReactNode}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;
  return <div className="app-shell"><Sidebar/><div className="main-area"><Topbar/><main className="page-content">{children}<footer className="site-footer"><span>Built by a KTU student, for KTU students.</span><Link href="/admin/login">Admin</Link></footer></main></div>
    <nav className="mobile-tabs" aria-label="Mobile navigation">{tabs.map(({label,href,icon:Icon})=>{const active=href==="/" ? pathname==="/" : pathname===href||pathname.startsWith(href+"/");return <Link key={href} href={href} aria-current={active?"page":undefined} className={`mobile-tab ${active?"active":""}`}><Icon size={19}/><span>{label}</span></Link>;})}</nav>
  </div>;
}
