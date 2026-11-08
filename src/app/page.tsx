import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight, BookOpen, CalendarDays, ChevronRight,
  Clock3, Compass, GraduationCap, LayoutDashboard, Library, MessageCircle,
  MoreHorizontal, Plus, Settings2, Sparkles, Target, TrendingUp, Zap,
} from "lucide-react";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "My study plan", icon: CalendarDays },
  { label: "Subjects", icon: BookOpen },
  { label: "Study materials", icon: Library },
  { label: "AI doubt solver", icon: MessageCircle },
];

export default function Home() {
  return (
    <div className="app-shell flex">
      <aside className="sidebar hidden min-h-screen shrink-0 flex-col px-5 py-6 md:flex">
        <Link href="/" className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#315efb] text-white shadow-lg shadow-blue-200"><GraduationCap size={22} /></div>
          <div><div className="text-[19px] font-extrabold tracking-tight text-[#14213d]">ExamPilot</div><div className="text-[11px] font-medium text-slate-400">STUDY WITH DIRECTION</div></div>
        </Link>
        <div className="eyebrow mb-3 px-3">Workspace</div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ label, icon: Icon, active }) => {
            const href = label === "Overview" ? "/" : label === "My study plan" ? "/study-plan" : label === "Subjects" ? "/subjects" : label === "Study materials" ? "/study-materials" : "/ai-tutor";
            return <Link key={label} href={href} className={`nav-link ${active ? "active" : ""}`}><Icon size={18} />{label}{label === "AI doubt solver" && <span className="ml-auto rounded-full bg-[#e8edff] px-2 py-0.5 text-[10px] text-[#315efb]">AI</span>}</Link>;
          })}
        </nav>
        <div className="eyebrow mb-3 mt-9 px-3">Personal</div>
        <Link href="/onboarding" className="nav-link"><Target size={18}/>Goals & progress</Link>
        <Link href="/onboarding" className="nav-link"><Settings2 size={18}/>Academic profile</Link>
        <div className="mt-auto rounded-2xl bg-[#f3f6ff] p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#315efb]"><Sparkles size={17}/></div>
          <p className="text-sm font-bold text-[#1c2c50]">Small steps add up.</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">A clear plan makes exam preparation feel manageable.</p>
        </div>
      </aside>

      <main className="main-area">
        <header className="flex items-center justify-between border-b border-[#e8edf5] bg-white px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#315efb] text-white md:hidden"><GraduationCap size={19}/></div>
            <div><p className="text-sm font-bold text-[#14213d]">Your workspace</p><p className="text-xs text-slate-400">Your academic journey starts here</p></div>
          </div>
          <div className="flex items-center gap-3"><span className="hidden rounded-full border border-[#e8edf5] px-3 py-2 text-xs font-semibold text-slate-500 sm:inline-flex">KTU · B.Tech</span><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9efff] text-sm font-bold text-[#315efb]">E</div></div>
        </header>

        <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9">
          <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><p className="mb-2 text-sm font-semibold text-[#315efb]">YOUR EXAM PREPARATION, IN ONE PLACE</p><h1 className="text-3xl font-extrabold tracking-tight text-[#14213d] sm:text-[38px]">Good evening<span className="text-[#315efb]">.</span></h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Build a study routine that fits your exams, your subjects and your pace.</p></div>
            <Link href="/onboarding" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#315efb] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#244fe8]"><Plus size={17}/> Set up my study plan</Link>
          </section>

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="panel p-5"><div className="mb-4 flex items-center justify-between"><span className="eyebrow">Study streak</span><span className="rounded-xl bg-orange-50 p-2 text-orange-500"><Zap size={17}/></span></div><div className="stat-value">—</div><p className="mt-2 text-xs text-slate-400">Start your first study session</p></div>
            <div className="panel p-5"><div className="mb-4 flex items-center justify-between"><span className="eyebrow">Study time</span><span className="rounded-xl bg-blue-50 p-2 text-blue-600"><Clock3 size={17}/></span></div><div className="stat-value">0h 00m</div><p className="mt-2 text-xs text-slate-400">Tracked this week</p></div>
            <div className="panel p-5"><div className="mb-4 flex items-center justify-between"><span className="eyebrow">Subjects</span><span className="rounded-xl bg-violet-50 p-2 text-violet-600"><BookOpen size={17}/></span></div><div className="stat-value">0</div><p className="mt-2 text-xs text-slate-400">Add your current semester</p></div>
            <div className="panel p-5"><div className="mb-4 flex items-center justify-between"><span className="eyebrow">Plan completion</span><span className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><TrendingUp size={17}/></span></div><div className="stat-value">0%</div><p className="mt-2 text-xs text-slate-400">Your progress starts here</p></div>
          </section>

          <section className="mb-6 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#edf0f6] px-5 py-4 sm:px-6"><div><h2 className="font-bold text-[#14213d]">Today&apos;s focus</h2><p className="mt-1 text-xs text-slate-400">Your daily study schedule will appear here</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">Not started</span></div>
              <div className="flex flex-col items-center px-6 py-10 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#315efb]"><CalendarDays size={25}/></div><h3 className="font-bold text-[#14213d]">Your day, thoughtfully planned.</h3><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Add your exam timetable and subjects. ExamPilot can then help organize focused study sessions and breaks.</p><Link href="/onboarding" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#dce5ff] px-4 py-2.5 text-sm font-bold text-[#315efb] hover:bg-[#f5f7ff]">Get started <ArrowRight size={16}/></Link></div>
            </div>
            <div className="panel p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold text-[#14213d]">Quick actions</h2><p className="mt-1 text-xs text-slate-400">Jump back into your workflow</p></div><MoreHorizontal size={19} className="text-slate-400"/></div><div className="flex flex-col gap-3"><QuickAction icon={<CalendarDays size={18}/>} title="Add exam timetable" description="Enter dates or upload a PDF" /><QuickAction icon={<BookOpen size={18}/>} title="Add your subjects" description="Choose branch, semester and scheme" /><QuickAction icon={<MessageCircle size={18}/>} title="Ask a study doubt" description="Get help understanding a topic" /></div><div className="mt-5 rounded-xl bg-[#f5f7ff] p-3 text-xs leading-5 text-slate-500"><Compass size={15} className="mr-1 inline text-[#315efb]"/> Your dashboard will become personalized after setup.</div></div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
            <div className="panel p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold text-[#14213d]">Your subjects</h2><p className="mt-1 text-xs text-slate-400">A preview of how subject tracking will look</p></div><button className="text-xs font-bold text-[#315efb]">View all <ChevronRight size={14} className="inline"/></button></div><div className="flex flex-col items-center py-7 text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1f4fa] text-slate-400"><Library size={21}/></div><p className="text-sm font-semibold text-[#263653]">No subjects added yet</p><p className="mt-1 text-xs text-slate-400">Your official syllabus and modules will be linked here.</p></div></div>
            <div className="panel p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><div className="rounded-xl bg-violet-50 p-2 text-violet-600"><Sparkles size={17}/></div><div><h2 className="font-bold text-[#14213d]">ExamPilot AI</h2><p className="text-xs text-slate-400">Your academic companion</p></div></div><p className="text-sm leading-6 text-slate-500">Ask for a simple explanation, a step-by-step solution or an exam-style answer grounded in your syllabus.</p><div className="mt-4 rounded-xl border border-dashed border-[#dce3ef] p-3 text-xs text-slate-400">AI tutor setup coming in a later development stage.</div></div>
          </section>
          <footer className="mt-8 flex flex-col gap-2 border-t border-[#e8edf5] pt-5 text-[11px] text-slate-400 sm:flex-row sm:justify-between"><span>ExamPilot · Built for focused learning</span><span>Academic data and timetable verification will be enabled during setup.</span></footer>
        </div>
      </main>
    </div>
  );
}

function QuickAction({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <Link href="/onboarding" className="flex items-center gap-3 rounded-xl border border-[#edf0f6] p-3 text-left transition hover:border-[#cbd8ff] hover:bg-[#fafbff]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#315efb]">{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#263653]">{title}</span><span className="mt-1 block text-xs text-slate-400">{description}</span></span><ChevronRight size={16} className="text-slate-300"/></Link>;
}
