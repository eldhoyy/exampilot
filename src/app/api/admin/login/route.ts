import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { adminCookie, createAdminSessionToken } from "@/lib/admin-auth";

export const runtime = "nodejs";
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string,{count:number;windowStart:number;lockedUntil:number}>();

function clientIp(request:Request){return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||request.headers.get("x-real-ip")||"unknown"}
function safeEqual(a:string,b:string){const left=Buffer.from(a);const right=Buffer.from(b);return left.length===right.length&&timingSafeEqual(left,right)}
function rateLimit(ip:string){
 const now=Date.now();let entry=attempts.get(ip);
 if(!entry||now-entry.windowStart>WINDOW_MS){entry={count:0,windowStart:now,lockedUntil:0};attempts.set(ip,entry)}
 if(entry.lockedUntil>now)return {blocked:true,retry:Math.ceil((entry.lockedUntil-now)/1000)};
 if(entry.count>=MAX_ATTEMPTS){entry.lockedUntil=now+LOCKOUT_MS;return {blocked:true,retry:Math.ceil(LOCKOUT_MS/1000)}}
 return {blocked:false,entry};
}
export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Request rejected."},{status:403});
 const ip=clientIp(request);const limit=rateLimit(ip);
 if(limit.blocked)return NextResponse.json({error:"Too many login attempts. Try again in 15 minutes."},{status:429,headers:{"Retry-After":String(limit.retry)}});
 const configuredPassword=process.env.ADMIN_PASSWORD;
 const configuredUsername=(process.env.ADMIN_USERNAME||"admin@exampilot.com").trim().toLowerCase();
 const configuredSecret=process.env.ADMIN_SESSION_SECRET;
 if(!configuredPassword||!configuredSecret||configuredSecret.length<32)return NextResponse.json({error:"Admin login is not configured yet."},{status:503});
 const length=Number(request.headers.get("content-length")||0);
 if(length>2048)return NextResponse.json({error:"Request is too large."},{status:413});
 let body:{username?:string;password?:string};
 try{const raw=await request.text();if(raw.length>2048)return NextResponse.json({error:"Request is too large."},{status:413});body=JSON.parse(raw) as {username?:string;password?:string}}catch{return NextResponse.json({error:"Invalid request."},{status:400})}
 const username=typeof body.username==="string"?body.username.trim().toLowerCase():"";
 const password=typeof body.password==="string"?body.password:"";
 const entry=limit.entry;
 if(!safeEqual(username,configuredUsername)||!safeEqual(password,configuredPassword)){
  if(entry){entry.count+=1;if(entry.count>=MAX_ATTEMPTS)entry.lockedUntil=Date.now()+LOCKOUT_MS}
  await new Promise(resolve=>setTimeout(resolve,400));
  return NextResponse.json({error:entry&&entry.count>=MAX_ATTEMPTS?"Too many attempts. Try again in 15 minutes.":"Incorrect username or password."},{status:entry&&entry.count>=MAX_ATTEMPTS?429:401});
 }
 attempts.delete(ip);
 const response=NextResponse.json({success:true});
 response.cookies.set(adminCookie.name,createAdminSessionToken(),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:adminCookie.maxAge});
 return response;
}