#!/usr/bin/env python3
"""Discover KTU B.Tech timetable notices from independent publication sources.

A secondary portal is used for discovery and hosting the linked original PDF;
the PDF contents still need parsing/review before any exam dates are published.
No dates are inferred from page titles or search snippets.
"""
from __future__ import annotations

import hashlib
import io
import json
import os
import re
import sys
from datetime import datetime
from urllib.parse import quote, urljoin, urlparse
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

from bs4 import BeautifulSoup
from pypdf import PdfReader

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
USER_AGENT = "ExamPilotTimetableBot/1.0 (+https://github.com/eldhoyy/exampilot)"

# Sources are intentionally explicit. A PDF host is accepted only when its URL
# is linked from one of these trusted publisher pages.
SOURCES = [
    # Detailed notification index and original linked PDF files.
    {"name": "KTU Notes", "index": "https://ktunotes.in/notifications/",
     "hosts": {"ktunotes.in", "www.ktunotes.in"}},
    # Semester/department timetable portal (2024 scheme and supply listings).
    {"name": "KTU Notes Live", "index": "https://timetable.ktunotes.live/",
     "hosts": {"timetable.ktunotes.live"}},
    # KTU Magic publishes department-wise timetable updates; some schedules
    # are linked from its community posts and must be manually sourced if not crawlable.
    {"name": "KTU Magic", "index": "https://www.ktumagic.in/index.php",
     "hosts": {"ktumagic.in", "www.ktumagic.in"}},
    {"name": "KSU Student Assist Cell S3",
     "index": "https://sac.ksucet.in/notifications/btech-s3-2024-scheme-exam-timetable-nov-2026",
     "hosts": {"sac.ksucet.in"}},
]
TIMETABLE_RE = re.compile(
    r"(?:detailed\s*)?time\s*table|timetable|date\s*sheet", re.I
)
BTECH_RE = re.compile(r"b\s*\.?\s*tech|bachelor\s+of\s+technology", re.I)
SEM_RE = re.compile(r"\bS\s*([1-8])\b", re.I)
SCHEME_RE = re.compile(r"\b(2019|2024)\s*scheme\b", re.I)
DATE_RE = re.compile(r"(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})", re.I)


def fetch(url: str, limit: int = 8_000_000) -> tuple[bytes, str, str]:
    req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/pdf,*/*"})
    with urlopen(req, timeout=35) as response:
        final_url = response.geturl()
        content_type = response.headers.get("Content-Type", "").lower()
        body = response.read(limit + 1)
        if len(body) > limit:
            raise RuntimeError(f"Response too large: {url}")
        return body, content_type, final_url


def allowed_publisher(url: str, hosts: set[str]) -> bool:
    p = urlparse(url)
    return p.scheme == "https" and p.hostname in hosts


def extract_candidate_title(text: str):
    title = " ".join((text or "").split())
    if not BTECH_RE.search(title) or not TIMETABLE_RE.search(title):
        return None
    sm = SEM_RE.search(title)
    if not sm:
        return None
    scheme = SCHEME_RE.search(title)
    return int(sm.group(1)), int(scheme.group(1)) if scheme else None


def inspect_pdf(url: str, candidate_scope_semester: int | None = None, candidate_scope_scheme: int | None = None) -> dict:
    """Download and extract text for review; extraction alone never verifies dates."""
    body, content_type, final_url = fetch(url, 20_000_000)
    if not body.startswith(b"%PDF-"):
        raise RuntimeError(f"Linked document is not a PDF (content-type={content_type})")
    reader = PdfReader(io.BytesIO(body), strict=False)
    pages = []
    for page in reader.pages[:30]:
        pages.append(page.extract_text() or "")
    extracted = "\n\n".join(pages).strip()
    if not extracted:
        raise RuntimeError("PDF contains no extractable text; OCR/review is required")
    header = " ".join(extracted[:5000].split())
    # Record only explicit evidence. Do not derive exam events from partial text.
    document_no = re.search(r"KTU\s*/\s*[^\n]{0,100}", header, re.I)
    published = re.search(r"\b(\d{1,2}\.\d{1,2}\.\d{4})\b", header)
    scope = re.search(r"\bS\s*([1-8])\b.{0,100}?\b(2019|2024)\s*scheme\b", header, re.I)
    metadata = {
        "document_number": document_no.group(0) if document_no else None,
        "document_date": published.group(1) if published else None,
        "semester_in_pdf": int(scope.group(1)) if scope else None,
        "scheme_in_pdf": int(scope.group(2)) if scope else None,
        "page_count": len(reader.pages),
        "pdf_url_final": final_url,
        "text_characters": len(extracted),
        "extraction_method": "pypdf",
        "requires_human_review": True,
    }
    scope_matches = (
        metadata["semester_in_pdf"] == candidate_scope_semester
        and metadata["scheme_in_pdf"] == candidate_scope_scheme
    ) if candidate_scope_semester and candidate_scope_scheme else None
    metadata["notice_scope_matches_pdf"] = scope_matches
    review_note = (
        "PDF scope does not match the notice title; manual investigation required. No exam dates are published."
        if scope_matches is False else
        "Text extracted automatically. Exam dates are NOT published; verify the original PDF, scope, every paper code/date/time, and revisions before approval."
    )
    return {
        "document_sha256": hashlib.sha256(body).hexdigest(),
        "document_content_type": content_type,
        "extracted_text": extracted[:150000],
        "extracted_metadata": metadata,
        "parsed_at": datetime.now().astimezone().isoformat(),
        "status": "under_review",
        "review_notes": review_note,
    }


def discover_from_source(source: dict) -> list[dict]:
    name, index = source["name"], source["index"]
    hosts = source["hosts"]
    found: dict[str, dict] = {}
    print(f"\n=== SOURCE: {name} ({index}) ===")
    try:
        html, _ctype, final_index = fetch(index, 5_000_000)
        if not allowed_publisher(final_index, hosts):
            raise RuntimeError(f"Publisher redirected outside allowlist: {final_index}")
    except Exception as exc:
        print(f"Source unavailable; continuing with other sources: {exc}")
        return []

    soup = BeautifulSoup(html, "html.parser")
    anchors = soup.find_all("a", href=True)
    print(f"Index page links inspected: {len(anchors)}")
    detail_pages = []
    page_heading = " ".join((soup.title.get_text(" ", strip=True) if soup.title else "").split())
    page_scope = extract_candidate_title(page_heading)
    if page_scope:
        detail_pages.append({"url": final_index, "title": page_heading or name, "scope": page_scope})
    for a in anchors:
        label = " ".join(a.get_text(" ", strip=True).split())
        scope = extract_candidate_title(label)
        if not scope:
            continue
        detail = urljoin(final_index, a["href"])
        if not allowed_publisher(detail, hosts):
            continue
        if detail not in {x["url"] for x in detail_pages}:
            detail_pages.append({"url": detail, "title": label, "scope": scope})

    print(f"Timetable notice pages matched: {len(detail_pages)}")
    for notice in detail_pages[:100]:
        try:
            page_bytes, _ctype, final_detail = fetch(notice["url"], 5_000_000)
            if not allowed_publisher(final_detail, hosts):
                print(f"Skipped redirected notice: {final_detail}")
                continue
            detail_soup = BeautifulSoup(page_bytes, "html.parser")
            pdf_links = []
            for a in detail_soup.find_all("a", href=True):
                href = urljoin(final_detail, a["href"])
                label = " ".join(a.get_text(" ", strip=True).split()).lower()
                if ".pdf" in urlparse(href).path.lower() or "download pdf" in label or "open full pdf" in label:
                    if urlparse(href).scheme == "https":
                        pdf_links.append(href)
            # Prefer the most explicit PDF/download link and keep its exact URL.
            pdf_url = next((u for u in pdf_links if ".pdf" in urlparse(u).path.lower()), None)
            if not pdf_url and pdf_links:
                pdf_url = pdf_links[0]
            if not pdf_url:
                print(f"No PDF link on matched notice: {final_detail}")
                continue

            # Keep publication date as a label only; the PDF remains the authority.
            page_text = detail_soup.get_text(" ", strip=True)
            published = None
            m = re.search(r"(?:Published|Date)\s*[:：]?\s*(Nov\s+\d{1,2},\s+\d{4}|\d{1,2}[./-]\d{1,2}[./-]\d{4})", page_text, re.I)
            if m:
                published = m.group(1)
            semester, scheme = notice["scope"]
            key = final_detail
            found[key] = {
                "notice_title": notice["title"][:500],
                "notice_url": final_detail,
                "document_url": pdf_url,
                "discovered_from_url": index,
                "semester": semester,
                "scheme_id": None,
                "exam_session": None,
                "status": "discovered",
                "_source_name": name,
                "_scheme_label": scheme,
                "_published_label": published,
            }
            print(f"Candidate: S{semester} / {scheme or 'scheme not stated'} / PDF found")
        except Exception as exc:
            print(f"Notice inspection failed safely ({notice['url']}): {exc}")

    return list(found.values())


def main():
    if not SUPABASE_URL or not SERVICE_KEY:
        print("Discovery skipped: Supabase secrets are not configured.")
        return 0

    all_candidates = {}
    for source in SOURCES:
        for item in discover_from_source(source):
            all_candidates[item["notice_url"]] = item

    candidates = list(all_candidates.values())
    print(f"\nTotal unique timetable notices discovered: {len(candidates)}")
    if not candidates:
        print("No timetable candidates found across configured sources. No dates were inferred or published.")
        return 0

    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    def rest(path: str):
        req = Request(f"{SUPABASE_URL}/rest/v1/{path}", headers=headers)
        with urlopen(req, timeout=25) as response:
            return json.loads(response.read() or b"[]")

    universities = rest("universities?short_name=eq.KTU&select=id")
    if not universities:
        raise RuntimeError("KTU university seed is missing in Supabase.")
    university_id = universities[0]["id"]
    programmes = rest("programmes?university_id=eq." + university_id + "&short_name=eq.B.Tech&select=id")
    if not programmes:
        raise RuntimeError("B.Tech programme seed is missing in Supabase.")
    programme_id = programmes[0]["id"]
    scheme_rows = rest("academic_schemes?university_id=eq." + quote(university_id, safe="") + "&select=id,scheme_year")
    scheme_ids = {int(row["scheme_year"]): row["id"] for row in scheme_rows if row.get("scheme_year")}

    saved = 0
    for candidate in candidates:
        candidate["university_id"] = university_id
        candidate["programme_id"] = programme_id
        scheme_year = candidate.get("_scheme_label")
        candidate["scheme_id"] = scheme_ids.get(int(scheme_year)) if scheme_year else None
        # Extract text from the exact PDF linked by the discovered notice.
        # This creates a review packet only; it does not create exam_events.
        try:
            extracted = inspect_pdf(candidate["document_url"], candidate.get("semester"), candidate.get("_scheme_label"))
            candidate.update(extracted)
            print(f"PDF extracted for review: {candidate['notice_title']}")
        except Exception as exc:
            candidate["review_notes"] = f"PDF extraction unavailable; manual review required: {exc}"[:2000]
            print(f"PDF extraction deferred safely: {exc}")
        candidate_status = candidate.get("status", "discovered")
        print(f"Candidate review status: {candidate['notice_title'][:100]} -> {candidate_status}")
        for key in ("_source_name", "_scheme_label", "_published_label"):
            candidate.pop(key, None)
        lookup = (
            "timetable_discovery_candidates?university_id=eq."
            + quote(university_id, safe="")
            + "&notice_url=eq." + quote(candidate["notice_url"], safe="")
            + "&select=id,status"
        )
        existing_rows = rest(lookup)
        if existing_rows:
            existing = existing_rows[0]
            if existing["status"] in {"verified", "rejected", "superseded"}:
                print(f"Preserved terminal review decision ({existing['status']}): {candidate['notice_title'][:100]}")
                continue
            evidence = {
                key: candidate[key]
                for key in ("scheme_id", "programme_id", "semester", "document_url", "document_sha256", "document_content_type", "extracted_text", "extracted_metadata", "parsed_at")
                if key in candidate
            }
            if evidence:
                patch_body = json.dumps(evidence).encode()
                req = Request(
                    f"{SUPABASE_URL}/rest/v1/timetable_discovery_candidates?id=eq.{quote(existing['id'], safe='')}",
                    data=patch_body, headers=headers, method="PATCH",
                )
                with urlopen(req, timeout=25) as response:
                    response.read()
                print(f"Updated PDF evidence; preserved review status={existing['status']}")
        else:
            payload = json.dumps(candidate).encode()
            req = Request(
                f"{SUPABASE_URL}/rest/v1/timetable_discovery_candidates",
                data=payload, headers=headers, method="POST",
            )
            with urlopen(req, timeout=25) as response:
                response.read()
            print(f"Inserted new candidate with status={candidate.get('status', 'discovered')}")
        saved += 1

    print(f"Upserted {saved} timetable candidate(s) in Supabase; see per-candidate status above.")
    print("IMPORTANT: discovered does not mean verified; no exam dates were imported.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (HTTPError, URLError) as exc:
        print(f"Discovery failed safely due to network/HTTP error: {exc}", file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        print(f"Discovery failed safely: {exc}", file=sys.stderr)
        sys.exit(1)
