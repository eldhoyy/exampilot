import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
const allowedFeatures = new Set(["home","study_plan","timetable","study_materials","ai_tutor","subjects","onboarding","profile","progress"]);
const RATE_WINDOW=60_000;const RATE_MAX=30;
const requests=new Map<string,{count:number;start:number}>();
function clientIp(request:Request){return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||request.headers.get("x-real-ip")||"unknown"}
function limited(ip:string){const now=Date.now();let item=requests.get(ip);if(!item||now-item.start>RATE_WINDOW){item={count:0,start:now};requests.set(ip,item)}item.count++;return item.count>RATE_MAX}

export async function POST(request:Request){
 if(Number(request.headers.get("content-length")||0)>4096)return NextResponse.json({error:"Event payload is too large."},{status:413});
 if(limited(clientIp(request)))return NextResponse.json({error:"Too many events. Try again shortly."},{status:429,headers:{"Retry-After":"60"}});
 let body:Record<string,unknown>;
 try{const raw=await request.text();if(raw.length>4096)return NextResponse.json({error:"Event payload is too large."},{status:413});body=JSON.parse(raw) as Record<string,unknown>}catch{return NextResponse.json({error:"Invalid event."},{status:400})}
 const visitorId=typeof body.visitor_id==="string"&&/^[0-9a-f-]{36}$/i.test(body.visitor_id)?body.visitor_id:"";
 const feature=typeof body.feature==="string"?body.feature:"";
 if(!visitorId||!allowedFeatures.has(feature))return NextResponse.json({error:"Invalid event details."},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!serviceKey)return NextResponse.json({error:"Usage tracking is not configured."},{status:503});
 const clean=(value:unknown,max:number)=>typeof value==="string"?value.trim().slice(0,max):null;
 const supabase=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {error}=await supabase.from("usage_events").insert({visitor_id:visitorId,display_name:clean(body.display_name,100),branch:clean(body.branch,120),semester:clean(body.semester,12),feature,path:clean(body.path,200)});
 if(error)return NextResponse.json({error:"Could not record usage."},{status:500});
 return NextResponse.json({success:true},{status:201});
}