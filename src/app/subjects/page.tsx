"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Plus, Trash2 } from "lucide-react";
type Subject={id:string;title:string;code:string;difficulty:string;examDate:string};
export default function SubjectsPage(){
 const [items,setItems]=useState<Subject[]>([]);
 const [title,setTitle]=useState(""); const [code,setCode]=useState(""); const [difficulty,setDifficulty]=useState("medium"); const [examDate,setExamDate]=useState("");
 useEffect(()=>{try{setItems(JSON.parse(localStorage.getItem("exampilot-subjects")||"[]"))}catch{}},[]);
 function persist(next:Subject[]){setItems(next);localStorage.setItem("exampilot-subjects",JSON.stringify(next))}
 function add(){if(!title.trim())return;persist([...items,{id:crypto.randomUUID(),title:title.trim(),code:code.trim(),difficulty,examDate}]);setTitle("");setCode("");setExamDate("")}
 return <main className="min-h-screen px-4 py-7 sm:px-8"><div className="mx-auto max-w-3xl"><Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16}/> Dashboard</Link><p className="eyebrow mb-2">YOUR CURRICULUM</p><h1 className="text-3xl font-extrabold">Subjects</h1><p className="mt-2 text-sm text-slate-500">Add your subjects manually while the official KTU catalogue is being prepared.</p>
 <section className="panel mt-6 space-y-4 p-5"><h2 className="font-bold">Add a subject</h2><input className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" placeholder="Subject name" value={title} onChange={e=>setTitle(e.target.value)}/><div className="grid gap-3 sm:grid-cols-3"><input className="rounded-xl border border-slate-200 px-3 py-3 text-sm" placeholder="Subject code" value={code} onChange={e=>setCode(e.target.value)}/><select className="rounded-xl border border-slate-200 px-3 py-3 text-sm" value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select><input aria-label="Exam date" type="date" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" value={examDate} onChange={e=>setExamDate(e.target.value)}/></div><button onClick={add} className="inline-flex items-center gap-2 rounded-xl bg-[#315efb] px-4 py-3 text-sm font-bold text-white"><Plus size={16}/> Add subject</button></section>
 <section className="mt-5 space-y-3">{items.map(s=><div key={s.id} className="panel flex items-center gap-3 p-4"><BookOpen className="text-blue-600"/><div className="min-w-0 flex-1"><p className="font-bold">{s.title}</p><p className="text-xs text-slate-400">{s.code||"No code"} · {s.difficulty} · {s.examDate||"Exam date not set"}</p></div><button aria-label="Remove subject" onClick={()=>persist(items.filter(x=>x.id!==s.id))} className="p-2 text-slate-400"><Trash2 size={16}/></button></div>)}</section>
 </div></main>
}
