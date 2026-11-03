"""
Router: /api/scan

Accepts HTML or Live DOM audit reports via:
  POST /api/scan/html       — raw HTML string in JSON body
  POST /api/scan/url        — URL; backend fetches the page
  POST /api/scan/file       — HTML file upload
  POST /api/scan/audit-sync — In-browser extension audit report sync
  GET  /api/scan/latest     — Get most recently synced audit report
"""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, File, HTTPException, UploadFile
import httpx

from app.models.schemas import ScanHTMLRequest, ScanURLRequest, ScanResponse
from app.services.scanner_service import run_all_scanners

router = APIRouter()

# In-memory store for recent audit reports (for cross-laptop synchronization)
_RECENT_REPORTS: list[ScanResponse] = []


@router.post("/html", response_model=ScanResponse)
async def scan_html(body: ScanHTMLRequest):
    """Scan raw HTML code pasted by the user or sent by clients."""
    if not body.html.strip():
        raise HTTPException(status_code=400, detail="Empty HTML provided.")
    return run_all_scanners(body.html, source="html")


@router.post("/url", response_model=ScanResponse)
async def scan_url(body: ScanURLRequest):
    """Fetch a URL and scan the returned HTML."""
    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=15,
            headers={"User-Agent": "Lantern-Accessibility-Auditor/1.0"}
        ) as client:
            resp = await client.get(body.url)
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Could not fetch URL: {exc}")

    return run_all_scanners(resp.text, source="url", url=body.url)


@router.post("/file", response_model=ScanResponse)
async def scan_file(file: UploadFile = File(...)):
    """Scan an uploaded HTML file."""
    if file.content_type and "html" not in file.content_type:
        raise HTTPException(status_code=400, detail="File must be an HTML document.")
    content = (await file.read()).decode("utf-8", errors="replace")
    return run_all_scanners(content, source="file")


@router.post("/audit-sync", response_model=dict)
async def sync_audit_report(report: ScanResponse):
    """Receive and store a live in-browser DOM audit report from the Chrome extension."""
    _RECENT_REPORTS.append(report)
    if len(_RECENT_REPORTS) > 50:
        _RECENT_REPORTS.pop(0)
    return {
        "status": "synced",
        "total_issues": report.total_issues,
        "score": report.score,
        "grade": report.grade,
        "url": report.url,
    }


@router.get("/latest", response_model=Optional[ScanResponse])
async def get_latest_audit_report():
    """Retrieve the most recently synced audit report."""
    if not _RECENT_REPORTS:
        return None
    return _RECENT_REPORTS[-1]
