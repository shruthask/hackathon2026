"""
Router: /api/scan

Accepts HTML via three methods:
  POST /api/scan/html   — raw HTML string in JSON body
  POST /api/scan/url    — URL; backend fetches the page
  POST /api/scan/file   — HTML file upload
"""

from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile
import httpx

from app.models.schemas import ScanHTMLRequest, ScanURLRequest, ScanResponse
from app.services.scanner_service import run_all_scanners

router = APIRouter()


@router.post("/html", response_model=ScanResponse)
async def scan_html(body: ScanHTMLRequest):
    """Scan raw HTML code pasted by the user or sent by the extension."""
    if not body.html.strip():
        raise HTTPException(status_code=400, detail="Empty HTML provided.")
    return run_all_scanners(body.html, source="html")


@router.post("/url", response_model=ScanResponse)
async def scan_url(body: ScanURLRequest):
    """Fetch a URL and scan the returned HTML."""
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
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
