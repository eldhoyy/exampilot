"use client";
import {animate,motion,useInView,useMotionValue,useReducedMotion,useTransform} from "motion/react";
import {useEffect,useRef} from "react";
export default function CountUp({value,suffix=""}:{value:number;suffix?:string}){
 const ref=useRef<HTMLSpanElement>(null);
 const inView=useInView(ref,{once:true,margin:"0px 0px -30px 0px"});
 const reduce=useReducedMotion();
 const count=useMotionValue(reduce?value:0);
 const rounded=useTransform(count,n=>Math.round(n));
 useEffect(()=>{if(!inView)return;const controls=animate(count,value,{duration:reduce?0:.65,ease:"easeOut"});return ()=>controls.stop()},[inView,value,count,reduce]);
 return <span ref={ref} className="tabular-nums"><motion.span>{rounded}</motion.span>{suffix}</span>;
}
