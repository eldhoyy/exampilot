"use client";

import { useEffect, useMemo, useState } from "react";
import { buildStudyPlan, localDateISO, type StudySubject } from "@/lib/planner";
import { getApprovedPapers } from "@/lib/approved-timetable";

export type SavedSubject = {id:string;title:string;code:string;difficulty:"easy"|"medium"|"hard";examDate:string;modules:number;verified?:boolean;sourceTitle?:string};
export type SavedSession = {date:string;seconds:number;subject:string};
export type StudentProfile = {name?:string;branch?:string;semester?:string;scheme?:string;programme?:string};
export type PlannedTask = {date:string;subjectId:string;subject:string;minutes:number;reason:string};
const SESSION_KEY="exampilot-study-sessions";
const DONE_KEY="exampilot-completed-plan-tasks";

export function useStudyData(){
 const [ready,setReady]=useState(false);
 const [subjects,setSubjects]=useState<SavedSubject[]>([]);
 const [sessions,setSessions]=useState<SavedSession[]>([]);
 const [profile,setProfile]=useState<StudentProfile|null>(null);
 const [completed,setCompleted]=useState<string[]>([]);
 const [demo,setDemo]=useState(false);
 const [planStartDate,setPlanStartDate]=useState(localDateISO(new Date()));
 const [excludedCodes,setExcludedCodes]=useState<string[]>([]);
 const [difficultyMap,setDifficultyMap]=useState<Record<string,"easy"|"medium"|"hard">>({});
 useEffect(()=>{
  try{
   const parse=<T,>(key:string,fallback:T):T=>{try{const value=localStorage.getItem(key);return value?JSON.parse(value) as T:fallback}catch{return fallback}};
   setSubjects(parse<SavedSubject[]>("exampilot-subjects",[]));
   setSessions(parse<SavedSession[]>(SESSION_KEY,[]));
   setProfile(parse<StudentProfile|null>("exampilot-profile-draft",null));
   setCompleted(parse<string[]>(DONE_KEY,[]));
   setDemo(localStorage.getItem("exampilot-demo-data")==="yes");
   const start=localStorage.getItem("exampilot-plan-start-date");if(start&&/^\d{4}-\d{2}-\d{2}$/.test(start))setPlanStartDate(start);
   setExcludedCodes(parse<string[]>("exampilot-excluded-subjects",[]));
   setDifficultyMap(parse<Record<string,"easy"|"medium"|"hard">>("exampilot-difficulty",{}));
  }finally{setReady(true)}
 },[]);
 const allSubjects=useMemo(()=>{
  const localCodes=new Set(subjects.map(s=>s.code).filter(Boolean));
  const official=profile?.branch&&profile?.semester&&profile?.scheme
   ?getApprovedPapers({branch:profile.branch,semester:profile.semester,scheme:profile.scheme}).filter(p=>!localCodes.has(p.code)&&!excludedCodes.includes(p.code)).map(p=>({id:p.code,code:p.code,title:p.title,examDate:p.date,difficulty:difficultyMap[p.code]||"medium",modules:5,verified:false,sourceTitle:"User-approved timetable PDF"}))
   :[];
  return [...official,...subjects];
 },[subjects,profile,excludedCodes,difficultyMap]);
 const plan=useMemo(()=>{
  const valid=allSubjects.filter(s=>s.title&&s.examDate);
  const planner:StudySubject[]=valid.map(s=>({id:s.id,title:s.title,examDate:s.examDate,difficulty:s.difficulty||"medium",modules:Math.max(1,s.modules||5),completedModules:0}));
  return buildStudyPlan(planner,240,new Date(planStartDate+"T00:00:00"),50,10) as PlannedTask[];
 },[allSubjects,planStartDate]);
 const upcoming=useMemo(()=>allSubjects.filter(s=>s.examDate>=localDateISO(new Date())).sort((a,b)=>a.examDate.localeCompare(b.examDate))[0]||null,[allSubjects]);
 const completedCount=completed.filter(id=>plan.some((task,i)=>taskKey(task,i)===id)).length;
 const completion=plan.length?Math.round(completedCount/plan.length*100):0;
 const today=localDateISO(new Date());
 const todayTasks=plan.map((task,index)=>({...task,key:taskKey(task,index),done:completed.includes(taskKey(task,index))})).filter(task=>task.date===today);
 const weekSeconds=sessions.filter(s=>{const day=new Date(s.date+"T00:00:00");const start=new Date();start.setDate(start.getDate()-6);start.setHours(0,0,0,0);return day>=start&&day<=new Date();}).reduce((sum,s)=>sum+s.seconds,0);
 const streak=useMemo(()=>{const days=new Set(sessions.filter(s=>s.seconds>=60).map(s=>s.date));let cursor=new Date();if(!days.has(localDateISO(cursor)))cursor.setDate(cursor.getDate()-1);let n=0;while(days.has(localDateISO(cursor))){n++;cursor.setDate(cursor.getDate()-1)}return n},[sessions]);
 function toggleTask(key:string){const next=completed.includes(key)?completed.filter(item=>item!==key):[...completed,key];setCompleted(next);localStorage.setItem(DONE_KEY,JSON.stringify(next))}
 function loadDemo(){
  const rows:SavedSubject[]=[
   {id:"demo-pcmet501",code:"PCMET501",title:"Dynamics of Machinery",difficulty:"hard",examDate:"2026-11-23",modules:5,verified:true,sourceTitle:"Demo · November 2026 KTU timetable"},
   {id:"demo-pcmet502",code:"PCMET502",title:"Advanced Manufacturing Engineering",difficulty:"medium",examDate:"2026-11-27",modules:5,verified:true,sourceTitle:"Demo · November 2026 KTU timetable"},
   {id:"demo-pcmet503",code:"PCMET503",title:"Mechanical Measurements and Quality Control",difficulty:"medium",examDate:"2026-12-01",modules:5,verified:true,sourceTitle:"Demo · November 2026 KTU timetable"},
   {id:"demo-pcmet504",code:"PCMET504",title:"Computer Aided Design and Manufacturing",difficulty:"easy",examDate:"2026-12-03",modules:5,verified:true,sourceTitle:"Demo · November 2026 KTU timetable"}
  ];
  localStorage.setItem("exampilot-subjects",JSON.stringify(rows));
  localStorage.setItem("exampilot-demo-data","yes");
  localStorage.removeItem(DONE_KEY);
  setSubjects(rows);setCompleted([]);setDemo(true);
 }
 function clearDemo(){if(!demo)return;localStorage.removeItem("exampilot-subjects");localStorage.removeItem("exampilot-demo-data");localStorage.removeItem(DONE_KEY);setSubjects([]);setCompleted([]);setDemo(false)}
 return {ready,subjects:allSubjects,sessions,profile,plan,upcoming,weekSeconds,streak,completion,todayTasks,demo,toggleTask,loadDemo,clearDemo,planStartDate};
}
export function taskKey(task:PlannedTask,index:number){return task.date+"|"+task.subjectId+"|"+index}
