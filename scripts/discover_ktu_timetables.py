#!/usr/bin/env python3
"""Discover KTU B.Tech timetable notices; never publishes or verifies exam dates.

The official KTU portal is JavaScript-rendered. This conservative crawler reads
its server-rendered links and records matching official-host links as candidates.
It intentionally does not promote documents or invent exam events.
"""
from __future__ import annotations
import json, os, re, sys
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from playwright.sync_api import sync_playwright

PORTAL = "https://ktu.edu.in/exam/Timetable"
HOSTS = {"ktu.edu.in", "www.ktu.edu.in", "app.ktu.edu.in"}
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

def get_links(url):
    # Render the official portal because its public page is a JavaScript app.
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(7000)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(1500)
        items = page.locator("a").evaluate_all("""anchors => anchors.map(a => {
          const row = a.closest('tr, li, article, [class*=card], [class*=item]');
          const container = row || a.parentElement;
          return { text: (container?.innerText || a.innerText || '').trim(), href: a.href };
        })""")
        browser.close()
        # Remove duplicate links while preserving their rendered row labels.
        seen = set()
        result = []
        for item in items:
            href = item.get("href", "")
            if href and href not in seen:
                seen.add(href)
                result.append((item.get("text", ""), href))
        return result

def official(url):
    p=urlparse(url)
    return p.scheme == "https" and p.hostname in HOSTS

def scope(title):
    text=title.lower().replace("b.tech","btech").replace("b tech","btech")
    if not re.search(r"btech|bachelor of technology", text): return None
    if not re.search(r"timetable|time table|date sheet|datesheet", text): return None
    sm=re.search(r"\bs\s*([1-8])\b", text)
    if not sm: return None
    yr=re.search(r"(2019|2024)\s*scheme", text)
    return int(sm.group(1)), int(yr.group(1)) if yr else None

def main():
    if not SUPABASE_URL or not SERVICE_KEY:
        print("Discovery skipped: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY secrets are required.")
        return 0
    links=get_links(PORTAL)
    candidates=[]
    for label, href in links:
        title=" ".join(label.split())
        match=scope(title)
        url=urljoin(PORTAL, href or "")
        if match and official(url):
            semester, scheme=match
            candidates.append({
                "notice_title": title[:500], "notice_url": url,
                "document_url": url if url.lower().endswith(".pdf") else None,
                "discovered_from_url": PORTAL, "semester": semester,
                "scheme_id": None, "exam_session": None,
                "status": "discovered"
            })
    print(f"Official KTU page returned {len(links)} links; {len(candidates)} timetable candidates.")
    if not candidates:
        print("No static timetable links found. KTU currently serves this page as a JavaScript app; no dates were inferred.")
        return 0

    # Resolve KTU university and B.Tech programme IDs; scheme is resolved only
    # when a title explicitly names it. Candidate records remain unverified.
    headers={"apikey":SERVICE_KEY,"Authorization":f"Bearer {SERVICE_KEY}","Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=minimal"}
    def rest(path):
        req=Request(f"{SUPABASE_URL}/rest/v1/{path}",headers=headers)
        with urlopen(req,timeout=25) as response: return json.loads(response.read() or b"[]")
    universities=rest("universities?short_name=eq.KTU&select=id")
    if not universities: raise RuntimeError("KTU university seed is missing in Supabase.")
    university_id=universities[0]["id"]
    programmes=rest("programmes?university_id=eq."+university_id+"&short_name=eq.B.Tech&select=id")
    if not programmes: raise RuntimeError("B.Tech programme seed is missing in Supabase.")
    programme_id=programmes[0]["id"]
    scheme_rows=rest("academic_schemes?university_id=eq."+university_id+"&select=id,scheme_year")
    scheme_ids={int(row["scheme_year"]):row["id"] for row in scheme_rows if row.get("scheme_year")}
    for candidate in candidates:
        candidate["university_id"]=university_id
        candidate["programme_id"]=programme_id
        # Keep an unspecified scheme null; never guess from semester number.
        scheme_year=next((year for year in (2019, 2024) if year in scheme_ids and candidate["notice_title"].lower().find(str(year)) >= 0), None)
        candidate["scheme_id"]=scheme_ids.get(scheme_year) if scheme_year else None
        req=Request(f"{SUPABASE_URL}/rest/v1/timetable_discovery_candidates?on_conflict=university_id,notice_url",data=json.dumps(candidate).encode(),headers={**headers,"Prefer":"resolution=merge-duplicates,return=minimal"},method="POST")
        with urlopen(req,timeout=25) as response: response.read()
    print(f"Recorded {len(candidates)} candidate(s) as discovered; manual verification is still required.")
    return 0

if __name__ == "__main__":
    try: sys.exit(main())
    except Exception as exc:
        print(f"Discovery failed safely: {exc}", file=sys.stderr); sys.exit(1)
