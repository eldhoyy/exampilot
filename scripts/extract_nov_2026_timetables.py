#!/usr/bin/env python3
"""Build the ExamPilot November 2026 timetable from the three user-approved PDFs."""
from __future__ import annotations
import io, json, re
from pathlib import Path
from urllib.request import Request, urlopen
from pypdf import PdfReader

OUT = Path("src/data/november-2026-timetables.json")
DOCS = [
 {"semester":3,"scheme":2024,"documentNumber":"KTU/SOEX-IV/2122/2024","title":"B.Tech S3 November 2026 (2024 Scheme)","url":"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s3-r-s-examinations-november-20-1794048058.pdf"},
 {"semester":5,"scheme":2024,"documentNumber":"KTU/EX-II#1/1833/2025","title":"B.Tech S5 November 2026 (2024 Scheme)","url":"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-time-table-of-b-tech-s5-r-exam-november-2026-includ-1794048414.pdf"},
 {"semester":7,"scheme":2019,"documentNumber":"KTU/SOEX-IV/2122/2024","title":"B.Tech S7 November 2026 (2019 Scheme)","url":"https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s7-r-s-examinations-november-20-1794048779.pdf"},
]
SLOTS = {
 3: {"A":("2026-11-24","13:30","16:00"),"B":("2026-11-26","13:30","16:00"),"C":("2026-11-30","13:30","16:00"),"D":("2026-12-02","13:30","16:00"),"F":("2026-12-05","13:30","16:00"),"G":("2026-12-08","13:30","16:00")},
 5: {"A":("2026-11-23","13:30","16:00"),"B":("2026-11-27","14:00","16:30"),"C":("2026-12-01","13:30","16:00"),"D":("2026-12-03","13:30","16:00"),"E":("2026-12-07","13:30","16:00")},
 7: {"A":("2026-11-23","09:30","12:30"),"B":("2026-11-25","09:30","12:30"),"C":("2026-11-27","09:30","12:30"),"D":("2026-12-02","09:30","12:30")},
}
def slot_for(semester:int, code:str):
 suffix=code[-3:]
 if semester==3:
  if code.startswith("UCHUT"): return "G"
  return {"301":"A","302":"B","303":"C","304":"D","305":"F"}.get(suffix)
 if semester==5:
  if code.startswith("PE"): return "E"
  return {"501":"A","502":"B","503":"C","504":"D"}.get(suffix)
 if code=="MCN401": return "D"
 if suffix=="401": return "A"
 if suffix in {"413","423","433","443","453","463","473"}: return "B"
 if suffix in {"415","425","427","435","445","455","465"}: return "C"
 return None

def extract(doc):
 req=Request(doc["url"],headers={"User-Agent":"ExamPilot/1.0"})
 with urlopen(req,timeout=60) as response: body=response.read(20_000_001)
 if not body.startswith(b"%PDF-") or len(body)>20_000_000: raise RuntimeError("Invalid or oversized PDF")
 reader=PdfReader(io.BytesIO(body),strict=False)
 text="\n".join(page.extract_text() or "" for page in reader.pages)
 if not text.strip(): raise RuntimeError("PDF has no selectable text")
 rows=[]; seen=set()
 for line in text.splitlines():
  match=re.match(r"^\s*([A-Z]{2,5}\d{3})\s*[-–]\s*(.+?)\s*$",line)
  if not match: continue
  code,title=match.group(1), " ".join(match.group(2).split())
  title=re.sub(r"\\s+\\d{2}\\.\\d{2}\\.\\d{4}.*$","",title).strip()
  if code in seen: continue
  seen.add(code)
  slot=slot_for(doc["semester"],code)
  if not slot: continue
  date,start,end=SLOTS[doc["semester"]][slot]
  rows.append({"semester":doc["semester"],"scheme":doc["scheme"],"slot":slot,"date":date,"start":start,"end":end,"code":code,"title":title})
 if not rows: raise RuntimeError(f"No timetable rows extracted for S{doc['semester']}")
 print(f"S{doc['semester']}: {len(rows)} papers")
 return rows

def main():
 exams=[]
 for doc in DOCS: exams.extend(extract(doc))
 exams.sort(key=lambda x:(x["semester"],x["date"],x["code"]))
 payload={"sourceDate":"2026-11-07","publisher":"User-approved timetable PDFs hosted by KTU Notes","documents":DOCS,"exams":exams}
 OUT.parent.mkdir(parents=True,exist_ok=True)
 OUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(f"Wrote {len(exams)} papers to {OUT}")
if __name__=="__main__": main()
