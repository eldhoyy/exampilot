#!/usr/bin/env python3
"""Extract the published KTU B.Tech S5/S7 November 2026 PDFs into website data.

The PDF is the source. This script does not infer department ownership from a
course title; it preserves every paper code and groups papers by the slot
explicitly encoded in the KTU timetable.
"""
from __future__ import annotations
import json, re
from pathlib import Path
from urllib.request import Request, urlopen
from pypdf import PdfReader
import io

OUT = Path("src/data/november-2026-timetables.json")
DOCS = [
    {
        "semester": 5, "scheme": 2024,
        "documentNumber": "KTU/EX-II#1/1833/2025",
        "title": "Detailed Time Table of B.Tech S5 (R) Exam November 2026, including (WP) (R) (2024 Scheme)",
        "url": "https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-time-table-of-b-tech-s5-r-exam-november-2026-includ-1794048414.pdf",
        "slots": {
            "501": ("A", "2026-11-23", "13:30", "16:00"),
            "502": ("B", "2026-11-27", "14:00", "16:30"),
            "503": ("C", "2026-12-01", "13:30", "16:00"),
            "504": ("D", "2026-12-03", "13:30", "16:00"),
            "E": ("E", "2026-12-07", "13:30", "16:00"),
        },
    },
    {
        "semester": 7, "scheme": 2019,
        "documentNumber": "KTU/SOEX-IV/2122/2024",
        "title": "Detailed Timetable of B.Tech S7 (R, S) Examinations, November 2026 (2019 Scheme) / Working Professionals",
        "url": "https://objectstorage.ap-hyderabad-1.oraclecloud.com/n/axpwhs6wi8wr/b/ktunotes-files/o/notifications/2026/11/detailed-timetable-of-b-tech-s7-r-s-examinations-november-20-1794048779.pdf",
        "slots": {
            "401": ("A", "2026-11-23", "09:30", "12:30"),
            "B": ("B", "2026-11-25", "09:30", "12:30"),
            "C": ("C", "2026-11-27", "09:30", "12:30"),
            "D": ("D", "2026-12-02", "09:30", "12:30"),
        },
    },
]

def extract(doc: dict) -> list[dict]:
    request = Request(doc["url"], headers={"User-Agent": "ExamPilot/1.0"})
    with urlopen(request, timeout=45) as response:
        body = response.read(20_000_001)
    if not body.startswith(b"%PDF-") or len(body) > 20_000_000:
        raise RuntimeError(f"Invalid or oversized PDF for S{doc['semester']}")
    reader = PdfReader(io.BytesIO(body), strict=False)
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    if not text.strip():
        raise RuntimeError(f"No selectable text in S{doc['semester']} PDF")
    rows = []
    seen = set()
    for line in text.splitlines():
        match = re.search(r"\b([A-Z]{2,5}\d{3})\s*[-–]\s*(.+?)\s*$", line.strip())
        if not match:
            continue
        code, title = match.group(1), match.group(2).strip()
        if code in seen:
            continue
        seen.add(code)
        if doc["semester"] == 5:
            suffix = code[-3:]
            key = suffix if suffix in {"501", "502", "503", "504"} else ("E" if code.startswith("PE") else None)
            if key is None:
                continue
        else:
            if code == "MCN401":
                key = "D"
            elif code.endswith("401"):
                key = "401"
            elif code.endswith(("413", "423", "433", "443", "453", "463", "473")):
                key = "B"
            elif code.endswith(("415", "425", "427", "435", "445", "455", "465")):
                key = "C"
            else:
                continue
        slot, date, start, end = doc["slots"][key]
        rows.append({
            "semester": doc["semester"], "scheme": doc["scheme"],
            "slot": slot, "date": date, "start": start, "end": end,
            "code": code, "title": title,
        })
    if not rows:
        raise RuntimeError(f"No timetable rows extracted for S{doc['semester']}")
    return rows

def main():
    exams = []
    for doc in DOCS:
        rows = extract(doc)
        exams.extend(rows)
        print(f"S{doc['semester']} ({doc['scheme']} scheme): extracted {len(rows)} papers")
    exams.sort(key=lambda row: (row["semester"], row["date"], row["code"]))
    payload = {
        "sourceDate": "2026-11-07",
        "publisher": "KTU Notes (host of the KTU-issued PDF)",
        "documents": [{k: doc[k] for k in ("semester", "scheme", "documentNumber", "title", "url")} for doc in DOCS],
        "exams": exams,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(exams)} total timetable rows to {OUT}")

if __name__ == "__main__":
    main()
