import data from "@/data/november-2026-timetables.json";

export type ApprovedPaper = {
  semester:number; scheme:number; slot:string; date:string;
  start:string; end:string; code:string; title:string;
};
type ProfileLike = { branch:string; semester:string; scheme:string };
const papers = data.exams as ApprovedPaper[];

const prefixes:Record<string,string[]> = {
  "computer science":["PCCST","PBCST","PCITT","PBITT","CST","ITT"],
  "electronics and communication":["PCECT","PBECT","PCEBT","PEECT","ECT"],
  "electronics and instrumentation":["PCAET","PCEIT","PCICT","PBICT","AET","ICT","IET"],
  "artificial intelligence":["PCAIT","PBAIT","PCAMT","PBCMT","AIT","ADT"],
  "naval architecture":["PCNST","PBNST","NST","SBT"],
  "information technology":["PCITT","PBITT","ITT"],
  "food technology":["PCFTT","PBFTT","FTT"],
  "fire and safety":["PCSFT","PBSFT","FST"],
  "safety and fire":["PCSFT","PBSFT","FST"],
  "biomedical":["PCBMT","PBBMT","BMT","EBT"],
  "biotechnology":["PCBBT","PBBBT","BBT","BTT"],
  "mechatronics":["PCAMT","MRT","MTT","MUT"],
  "mechanical":["PCMET","PBMET","MET","MPT","MUT","MCN"],
  "agricultural":["PCAGT","PBAGT","AGT"],
  "aerospace":["PCAOT","PBAOT","AOT"],
  "automobile":["PCAUT","PBAUT","AUT"],
  "polymer":["PCPOT","PBPOT","POT"],
  "robotics":["PCBRT","PBRAT","RAT","RIT"],
  "cyber security":["PCCCT","PCCDT","CCT","CDT"],
  "chemical":["PCCHT","PBCHT","CHT"],
  "civil":["PCAGT","PBAGT","PCPET","PBCET","PCCET","CET","AGT"],
  "electrical":["PCEET","PBEET","EET"],
  "electronics":["PCECT","PBECT","PCEBT","PEECT","ECT","EBT"],
  "instrumentation":["PCICT","PBICT","ICT"],
  "computer":["PCCST","PBCST","PCITT","PBITT","CST","ITT"],
  "ai & ds":["PCAIT","PBAIT","PCAMT","PBCMT","AIT","ADT"]
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
