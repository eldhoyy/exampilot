#!/usr/bin/env python3
"""Discover KTU timetable data sources without inventing or verifying exam dates.

This diagnostic crawler inspects the rendered SPA, frames, scripts, links and
public JSON network responses. It only records explicit timetable links found
on approved KTU hosts; discovery is not verification.
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
    """Render the portal and inspect public timetable-related resources."""
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(ignore_https_errors=True)
        page = context.new_page()
        responses, request_urls = [], set()

        def observe_request(request):
            try:
                parsed = urlparse(request.url)
                if parsed.scheme in ("https", "http"):
                    request_urls.add(request.url[:1200])
            except Exception:
                pass

        def observe_response(response):
            try:
                parsed = urlparse(response.url)
                ctype = response.headers.get("content-type", "").lower()
                url_lower = response.url.lower()
                relevant = any(w in url_lower for w in (
                    "exam", "time", "table", "notice", "notification",
                    "api", "document", "file", "media", "announcement"
                ))
                if relevant or "json" in ctype:
                    item = {
                        "url": response.url[:1200],
                        "status": response.status,
                        "content_type": ctype[:120],
                        "host": parsed.hostname,
                    }
                    # Only inspect public GET JSON responses; never log request headers/cookies.
                    if request.method == "GET" and "json" in ctype and response.ok:
                        try:
                            body = response.text()
                            item["body_preview"] = body[:5000]
                        except Exception as exc:
                            item["body_read_error"] = str(exc)[:200]
                    responses.append(item)
            except Exception:
                pass

        page.on("request", observe_request)
        page.on("response", observe_response)
        page.goto(url, wait_until="domcontentloaded", timeout=60000)
        final = urlparse(page.url)
        if final.scheme != "https" or final.hostname not in HOSTS:
            browser.close()
            raise RuntimeError(f"KTU portal redirected outside official host allowlist: {page.url}")

        try:
            page.wait_for_load_state("networkidle", timeout=25000)
        except Exception:
            pass
        page.wait_for_timeout(7000)
        for _ in range(5):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(1200)

        # Capture rendered anchors with their nearest visible row/card context.
        items = page.locator("a").evaluate_all("""anchors => anchors.map(a => {
          const row = a.closest('tr, li, article, [class*=card], [class*=item]');
          const container = row || a.parentElement;
          return { text: (container?.innerText || a.innerText || '').trim(),
                   href: a.href, title: a.title || '' };
        })""")
        body_text = page.locator("body").inner_text(timeout=10000)
        frames = page.locator("iframe").evaluate_all(
            "els => els.map(e => ({src:e.src, title:e.title, name:e.name}))"
        )
        scripts = page.locator("script[src]").evaluate_all("els => els.map(e => e.src)")
        resource_urls = page.evaluate(
            "() => performance.getEntriesByType('resource').map(e => e.name).slice(-500)"
        )
        # Inspect likely tab controls and data-bearing DOM attributes.
        controls = page.locator("button,[role=tab],[role=button]").evaluate_all("""els =>
          els.map(e => ({text:(e.innerText||e.getAttribute('aria-label')||'').trim(),
                         role:e.getAttribute('role'), href:e.getAttribute('href'),
                         dataUrl:e.getAttribute('data-url')})).filter(x => x.text || x.href || x.dataUrl)
        """)
        browser.close()

    seen, links = set(), []
    for item in items:
        href = item.get("href", "")
        if href and href not in seen:
            seen.add(href)
            links.append((item.get("text", "") or item.get("title", ""), href))

    print("=== RENDERED PAGE TEXT ===")
    print(body_text[:12000])
    print("=== IFRAMES ===")
    print(json.dumps(frames, ensure_ascii=False)[:12000])
    print("=== SCRIPT URLS ===")
    print(json.dumps(scripts, ensure_ascii=False)[:16000])
    print("=== TAB / BUTTON CONTROLS ===")
    print(json.dumps(controls, ensure_ascii=False)[:12000])
    print("=== RELEVANT / JSON NETWORK RESPONSES (public response previews only) ===")
    for item in responses[:160]:
        print(json.dumps(item, ensure_ascii=False)[:6500])
    print("=== RESOURCE URLS ===")
    for resource in resource_urls:
        if any(w in resource.lower() for w in ("exam", "time", "table", "notice", "api", "document", "file")):
            print(str(resource)[:1200])
    print(f"=== TOTAL REQUEST URLS OBSERVED: {len(request_urls)} ===")
    return links

def official(url):
    p = urlparse(url)
    return p.scheme == "https" and p.hostname in HOSTS

def scope(title):
    text = title.lower().replace("b.tech", "btech").replace("b tech", "btech")
    if not re.search(r"btech|bachelor of technology", text):
        return None
    if not re.search(r"timetable|time table|date sheet|datesheet", text):
        return None
    sm = re.search(r"\bs\s*([1-8])\b", text)
    if not sm:
        return None
    yr = re.search(r"(2019|2024)\s*scheme", text)
    return int(sm.group(1)), int(yr.group(1)) if yr else None

def main():
    if not SUPABASE_URL or not SERVICE_KEY:
        print("Discovery skipped: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY secrets are required.")
        return 0
    links = get_links(PORTAL)
    candidates = []
    for label, href in links:
        title = " ".join(label.split())
        match = scope(title)
        url = urljoin(PORTAL, href or "")
        if match and official(url):
            semester, _scheme = match
            candidates.append({
                "notice_title": title[:500], "notice_url": url,
                "document_url": url if url.lower().endswith(".pdf") else None,
                "discovered_from_url": PORTAL, "semester": semester,
                "scheme_id": None, "exam_session": None, "status": "discovered"
            })
    print(f"Official KTU page returned {len(links)} rendered links; {len(candidates)} explicit title-matched timetable candidates.")
    if not candidates:
        print("No explicit timetable links found. Diagnostic output above is for source discovery only; no exam dates were inferred or published.")
        return 0

    headers = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
               "Content-Type": "application/json",
               "Prefer": "resolution=merge-duplicates,return=minimal"}
    def rest(path):
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
    for candidate in candidates:
        candidate["university_id"] = university_id
        candidate["programme_id"] = programme_id
        req = Request(
            f"{SUPABASE_URL}/rest/v1/timetable_discovery_candidates?on_conflict=university_id,notice_url",
            data=json.dumps(candidate).encode(),
            headers={**headers, "Prefer": "resolution=merge-duplicates,return=minimal"},
            method="POST"
        )
        with urlopen(req, timeout=25) as response:
            response.read()
    print(f"Recorded {len(candidates)} candidate(s) as discovered; verification is still required.")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"Discovery failed safely: {exc}", file=sys.stderr)
        sys.exit(1)
