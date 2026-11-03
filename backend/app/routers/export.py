"""
Router: /api/export

Receives a ScanResponse payload and returns it as CSV or PDF.
(Laptop 4 will flesh out WeasyPrint PDF generation — this is a stub
so the API contract exists from day one.)
"""

from __future__ import annotations

import csv
import io

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import ScanResponse

router = APIRouter()


@router.post("/csv")
async def export_csv(report: ScanResponse):
    """Return the scan results as a downloadable CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["rule_id", "severity", "element", "message", "how_to_fix", "wcag_criteria"])

    for issue in report.issues:
        writer.writerow([
            issue.rule_id,
            issue.severity.value,
            issue.element,
            issue.message,
            issue.how_to_fix,
            issue.wcag_criteria or "",
        ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=lantern-report.csv"},
    )


@router.post("/pdf")
async def export_pdf(report: ScanResponse):
    """Stub — Laptop 4 will implement PDF generation with WeasyPrint."""
    raise HTTPException(
        status_code=501,
        detail="PDF export is under development (Laptop 4).",
    )
