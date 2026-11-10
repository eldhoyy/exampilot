import data from "@/data/november-2026-timetables.json";

export type ApprovedPaper = {
  semester:number; scheme:number; slot:string; date:string;
  start:string; end:string; code:string; title:string;
};
type ProfileLike = { branch:string; semester:string; scheme:string };
const papers = data.exams as ApprovedPaper[];

const prefixes:Record<string,string[]> = {
  mechanical:["PCMET","PBMET","MET","MPT","MUT","MCN"],
  civil:["PCAGT","PBAGT","PCPET","PBCET","PCCET","CET","AGT"],
  computer:["PCCST","PBCST","PCITT","PBITT","CST","ITT"],
  "computer science":["PCCST","PBCST","PCITT","PBITT","CST","ITT"],
  "artificial intelligence":["PCAIT","PBAIT","PCAMT","PBCMT","AIT","ADT"],
  "ai & ds":["PCAIT","PBAIT","PCAMT","PBCMT","AIT","ADT"],
  electrical:["PCEET","PBEET","EET"],
  electronics:["PCECT","PBECT","PCEBT","PEECT","ECT","EBT"],
  "electronics and communication":["PCECT","PBECT","PCEBT","PEECT","ECT"],
  chemical:["PCCHT","PBCHT","CHT"],
  biotechnology:["PCBBT","PBBBT","BBT","BTT"],
  "food technology":["PCFTT","PBFTT","FTT"],
  "information technology":["PCITT","PBITT","ITT"],
  "instrumentation":["PCICT","PBICT","ICT"],
  "automobile":["PCAUT","PBAUT","AUT"],
  "aerospace":["PCAOT","PBAOT","AOT"],
  "cyber security":["PCCCT","PCCDT","CCT","CDT"],
  "robotics":["PCBRT","PBRAT","RAT","RIT"],
};
const commonCodes = new Set(["GYMAT301","GAMAT301","GDMAT301","GNEST305","GAEST305","UCHUT346","UCHUT347"]);

export function getApprovedPapers(profile:ProfileLike):ApprovedPaper[] {
  const semester=Number(String(profile.semester).match(/\d+/)?.[0]);
  const scheme=Number(String(profile.scheme).match(/\d{4}/)?.[0]);
  const branch=profile.branch.toLowerCase();
  const key=Object.keys(prefixes).sort((a,b)=>b.length-a.length).find(k=>branch.includes(k));
  const allowed=key?prefixes[key]:[];
  return papers.filter(p=>p.semester===semester && p.scheme===scheme &&
    (commonCodes.has(p.code) || allowed.some(prefix=>p.code.startsWith(prefix))));
}
