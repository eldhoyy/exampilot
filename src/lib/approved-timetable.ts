import data from "@/data/november-2026-timetables.json";

export type ApprovedPaper = {
  semester:number; scheme:number; slot:string; date:string;
  start:string; end:string; code:string; title:string;
};
type ProfileLike = { branch:string; semester:string; scheme:string };
const papers = data.exams as ApprovedPaper[];

/**
 * Exact department families represented in the supplied timetable PDFs.
 * S3/S5 use 2024-scheme prefixes; S7 uses the shorter 2019-scheme prefixes.
 * Keep these explicit: a broad substring match can leak another branch's papers.
 */
type BranchFamily = {
  aliases:string[];
  s3:string[];
  s5:string[];
  s7:string[];
  maths?:string[];
};
const branches:BranchFamily[] = [
 {aliases:["mechanical"],s3:["PCMET","PBMET"],s5:["PCMET","PBMET","PEMET"],s7:["MET"],maths:["GYMAT301"]},
 {aliases:["computer science and engineering","computer science"],s3:["PCCST","PBCST"],s5:["PCCST","PBCST","PECST"],s7:["CST"],maths:["GAMAT301"]},
 {aliases:["civil"],s3:["PCCET","PBCET","PCCVT"],s5:["PCCET","PBCET","PCCVT","PECET"],s7:["CET"],maths:["GYMAT301"]},
 {aliases:["electrical and electronics","electrical"],s3:["PCEET","PBEET"],s5:["PCEET","PBEET","PEEET"],s7:["EET"],maths:["GYMAT301"]},
 {aliases:["electronics and communication","electronics & communication"],s3:["PCECT","PBECT"],s5:["PCECT","PBECT","PEECT"],s7:["ECT"],maths:["GYMAT301"]},
 {aliases:["artificial intelligence and data science","ai & ds","ai and ds"],s3:["PCAIT","PBAIT","PBADT"],s5:["PCAIT","PBAIT","PBADT","PEAIT","PEADT"],s7:["AIT","ADT"],maths:["GAMAT301"]},
 {aliases:["artificial intelligence and machine learning","ai & ml","ai and ml"],s3:["PCAMT","PBCMT"],s5:["PCAMT","PBCMT","PECMT","PEAMT"],s7:["CMT"],maths:["GAMAT301"]},
 {aliases:["automobile"],s3:["PCAUT","PBAUT"],s5:["PCAUT","PBAUT","PEAUT"],s7:["AUT"],maths:["GYMAT301"]},
 {aliases:["chemical"],s3:["PCCHT","PBCHT"],s5:["PCCHT","PBCHT","PECHT"],s7:["CHT"],maths:["GDMAT301"]},
 {aliases:["biomedical"],s3:["PCBMT","PBBMT","PBEBT"],s5:["PCBMT","PBBMT","PBEBT","PEBMT","PEEBT"],s7:["BMT","EBT"],maths:["GDMAT301"]},
 {aliases:["information technology"],s3:["PCITT","PBITT"],s5:["PCITT","PBITT","PEITT"],s7:["ITT"],maths:["GAMAT301"]},
 {aliases:["aerospace","aeronautical"],s3:["PCAOT","PBAOT"],s5:["PCAOT","PBAOT","PEAOT"],s7:["AOT"],maths:["GYMAT301"]},
 {aliases:["agricultural"],s3:["PCAGT","PBAGT"],s5:["PCAGT","PBAGT","PEAGT"],s7:["AGT"],maths:["GDMAT301"]},
 {aliases:["biotechnology"],s3:["PCBBT","PBBBT"],s5:["PCBBT","PBBBT","PEBBT"],s7:["BTT"],maths:["GDMAT301"]},
 {aliases:["food technology"],s3:["PCFTT","PBFTT"],s5:["PCFTT","PBFTT","PEFTT"],s7:["FTT"],maths:["GDMAT301"]},
 {aliases:["electronics and instrumentation","instrumentation"],s3:["PCAET","PCEIT","PCICT","PBICT","PBEIT"],s5:["PCAET","PCEIT","PCICT","PBICT","PBEIT","PEAET","PEICT","PEIET"],s7:["AET","ICT","IET"],maths:["GYMAT301"]},
 {aliases:["naval architecture"],s3:["PCNST","PBNST"],s5:["PCNST","PBNST","PENST"],s7:["NST","SBT"],maths:["GYMAT301"]},
 {aliases:["polymer"],s3:["PCPOT","PBPOT"],s5:["PCPOT","PBPOT","PEPOT"],s7:["POT"],maths:["GDMAT301"]},
 {aliases:["fire and safety","safety and fire"],s3:["PCSFT","PBSFT"],s5:["PCSFT","PBSFT","PESFT"],s7:["FST"],maths:["GDMAT301"]},
 {aliases:["robotics"],s3:["PCBRT","PBBRT","PCRAT","PBRAT","PBRUT"],s5:["PCBRT","PBBRT","PCRAT","PBRAT","PBRUT","PEBRT","PERAT","PERUT"],s7:["RAT","RIT"],maths:["GYMAT301"]},
 {aliases:["mechatronics"],s3:["PCMRT","PBMRT"],s5:["PCMRT","PBMRT","PEMRT"],s7:["MRT"],maths:["GYMAT301"]},
 {aliases:["automotive"],s3:["PCMUT"],s5:["PCMUT","PBMUT","PEMUT"],s7:["MUT"],maths:["GYMAT301"]},
 {aliases:["production engineering"],s3:["PCPET","PBPET"],s5:["PCPET","PBPET","PEPET"],s7:["PET"],maths:["GYMAT301"]}
];

const sharedCodes = new Set(["GNEST305"]);
const electiveAlternatives = new Set(["UCHUT346","UCHUT347"]);

function familyFor(branch:string):BranchFamily|undefined {
 const normalized=branch.toLowerCase().replace(/\s+/g," ").trim();
 return branches
  .flatMap(item=>item.aliases.map(alias=>({item,alias})))
  .sort((a,b)=>b.alias.length-a.alias.length)
  .find(({alias})=>normalized===alias || normalized.includes(alias))?.item;
}

export function getApprovedPapers(profile:ProfileLike):ApprovedPaper[] {
 const semester=Number(String(profile.semester).match(/\d+/)?.[0]);
 const scheme=Number(String(profile.scheme).match(/\d{4}/)?.[0]);
 const family=familyFor(profile.branch);
 if(!family || ![3,5,7].includes(semester)) return [];
 const allowed=semester===3?family.s3:semester===5?family.s5:family.s7;
 const math=semester===3?family.maths||[]:[];
 return papers.filter(p=>
   p.semester===semester && p.scheme===scheme &&
   (sharedCodes.has(p.code) || math.includes(p.code) ||
    allowed.some(prefix=>p.code.startsWith(prefix)))
 );
}

/** Elective alternatives are exposed separately so the planner never schedules both as compulsory. */
export function getApprovedElectiveAlternatives(profile:ProfileLike):ApprovedPaper[] {
 const semester=Number(String(profile.semester).match(/\d+/)?.[0]);
 const scheme=Number(String(profile.scheme).match(/\d{4}/)?.[0]);
 if(semester!==3 || scheme!==2024) return [];
 return papers.filter(p=>p.semester===semester && p.scheme===scheme && electiveAlternatives.has(p.code));
}
