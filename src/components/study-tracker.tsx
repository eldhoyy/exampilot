"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Coffee, Flame, Pause, Play, RotateCcw, Square, Timer, TrendingUp } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

type Session = { date: string; seconds: number; subject: string };
const KEY = "exampilot-study-sessions";
const pad = (n:number) => String(n).padStart(2,"0");
const dateKey = (d:Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const clock = (s:number) => `${pad(Math.floor(s/3600))}:${pad(Math.floor(s%3600/60))}:${pad(s%60)}`;

export default function StudyTracker() {
  const reduceMotion = useReducedMotion();
  const [sessions,setSessions] = useState<Session[]>([]);
  const [subject,setSubject] = useState("");
  const [mode,setMode] = useState<"idle"|"focus"|"paused"|"rest">("idle");
  const [seconds,setSeconds] = useState(0);
  const [restLeft,setRestLeft] = useState(600);
  const [savedPulse,setSavedPulse] = useState(false);

  useEffect(()=>{try{setSessions(JSON.parse(localStorage.getItem(KEY)||"[]") as Session[]);}catch{setSessions([]);}},[]);
  useEffect(()=>{
    if(mode!=="focus"&&mode!=="rest")return;
    const id=window.setInterval(()=>{if(mode==="focus")setSeconds(v=>v+1);else setRestLeft(v=>Math.max(0,v-1));},1000);
    return ()=>window.clearInterval(id);
  },[mode]);
  useEffect(()=>{if(mode==="rest"&&restLeft===0)setMode("idle");},[mode,restLeft]);

  const today=dateKey(new Date());
  const todaySeconds=sessions.filter(s=>s.date===today).reduce((n,s)=>n+s.seconds,0)+(mode==="focus"?seconds:0);
  const weekSeconds=sessions.filter(s=>{const d=new Date(s.date+"T00:00:00");const now=new Date();const start=new Date(now);start.setDate(now.getDate()-6);start.setHours(0,0,0,0);return d>=start&&d<=now;}).reduce((n,s)=>n+s.seconds,0)+(mode==="focus"?seconds:0);
  const streak=useMemo(()=>{const days=new Set(sessions.filter(s=>s.seconds>=60).map(s=>s.date));if(todaySeconds>=60)days.add(today);let count=0;const d=new Date();if(!days.has(dateKey(d)))d.setDate(d.getDate()-1);while(days.has(dateKey(d))){count++;d.setDate(d.getDate()-1);}return count;},[sessions,todaySeconds,today]);
  function finish(){if(seconds>=60){const next=[...sessions,{date:today,seconds,subject:subject.trim()||"Study session"}];setSessions(next);localStorage.setItem(KEY,JSON.stringify(next));window.dispatchEvent(new Event("exampilot:study-sessions-updated"));setSavedPulse(true);}setSeconds(0);setMode("idle");}
  return <section className="panel mb-5 overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><p className="eyebrow">FOCUS ROOM</p><h2 className="mt-1 text-lg font-extrabold">Make this session count</h2></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${mode==="focus"?"bg-emerald-50 text-emerald-700":mode==="rest"?"bg-amber-50 text-amber-700":"bg-slate-100 text-slate-600"}`}>{mode==="focus"?"Focus in progress":mode==="rest"?"Taking a break":mode==="paused"?"Paused":"Ready when you are"}</span></div>
    <div className="grid gap-5 p-5 md:grid-cols-[1.2fr_1fr]">
      <div className="rounded-2xl bg-[#163b36] p-5 text-white"><div className="flex items-center gap-2 text-xs font-semibold text-blue-200"><Timer size={15}/> {mode==="rest"?"REST TIMER":"FOCUS TIMER"}</div><div className="my-5 text-center font-mono text-5xl font-bold tracking-tight tabular-nums">{clock(mode==="rest"?restLeft:seconds)}</div>
        <input aria-label="Subject for this focus session" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="What are you studying? (optional)" className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-300"/>
        {savedPulse&&<motion.div initial={{opacity:0,scale:.82,y:6}} animate={{opacity:1,scale:1,y:0}} transition={reduceMotion?{duration:0}:{type:"spring",stiffness:420,damping:24}} className="mt-3 flex items-center justify-center gap-2 text-sm font-bold text-emerald-300"><CheckCircle2 size={17}/> Session saved. Nice work.</motion.div>}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {mode==="idle"&&<button onClick={()=>{setSavedPulse(false);setMode("focus")}} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#14213d]"><Play size={16}/> Start studying</button>}
          {mode==="focus"&&<><button onClick={()=>setMode("paused")} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold"><Pause size={16}/> Pause</button><button onClick={()=>{setRestLeft(600);setMode("rest");}} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-[#14213d]"><Coffee size={16}/> Take 10-min rest</button><button onClick={finish} className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-[#14213d]"><Square size={15}/> Finish</button></>}
          {mode==="paused"&&<><button onClick={()=>setMode("focus")} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#14213d]"><Play size={16}/> Resume</button><button onClick={finish} className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-[#14213d]"><Square size={15}/> Finish session</button></>}
          {mode==="rest"&&<button onClick={()=>setMode("focus")} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#14213d]"><RotateCcw size={16}/> End rest · Resume</button>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[var(--surface-muted)] p-4"><Flame className="mb-3 text-[var(--accent)]" size={20}/><p className="text-2xl font-extrabold">{streak} days</p><p className="mt-1 text-xs text-slate-500">Current streak</p></div>
        <div className="rounded-2xl bg-[var(--surface-muted)] p-4"><Timer className="mb-3 text-[var(--accent)]" size={20}/><p className="text-2xl font-extrabold">{Math.floor(todaySeconds/3600)}h {Math.floor(todaySeconds%3600/60)}m</p><p className="mt-1 text-xs text-slate-500">Studied today</p></div>
        <div className="col-span-2 rounded-2xl bg-[var(--surface-muted)] p-4"><div className="mb-2 flex items-center justify-between"><p className="text-sm font-bold">Last 7 days</p><TrendingUp size={17} className="text-[var(--accent)]"/></div><p className="text-2xl font-extrabold">{Math.floor(weekSeconds/3600)}h {Math.floor(weekSeconds%3600/60)}m</p><p className="mt-1 text-xs text-slate-500">Total focused time · completed sessions are saved on this device</p></div>
      </div>
    </div>
  </section>;
}
