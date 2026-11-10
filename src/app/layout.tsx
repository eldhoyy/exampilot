import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import ActivityTracker from "@/components/activity-tracker";
import AppShell from "@/components/app-shell";
import "./globals.css";
const displayFont=Space_Grotesk({subsets:["latin"],variable:"--font-space-grotesk",display:"swap"});
const bodyFont=DM_Sans({subsets:["latin"],variable:"--font-dm-sans",display:"swap"});
export const metadata:Metadata={title:{default:"ExamPilot — Your KTU study desk",template:"%s · ExamPilot"},description:"A practical exam planner for KTU B.Tech students. Organise subjects, exam dates and focused study sessions.",applicationName:"ExamPilot",manifest:"/manifest.json",openGraph:{title:"ExamPilot — Your KTU study desk",description:"Plan your KTU exams with your subjects, dates and daily focus.",siteName:"ExamPilot",type:"website"},twitter:{card:"summary_large_image",title:"ExamPilot — Your KTU study desk",description:"A practical exam planner for KTU B.Tech students."}};
export const viewport:Viewport={themeColor:[{media:"(prefers-color-scheme: light)",color:"#f6f3ec"},{media:"(prefers-color-scheme: dark)",color:"#151d1b"}],width:"device-width",initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`} suppressHydrationWarning><body><AppShell><div className="page-enter">{children}</div></AppShell><ActivityTracker/></body></html>}
