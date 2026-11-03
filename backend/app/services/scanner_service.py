"""
Scan Orchestrator

Runs every registered scanner against the provided HTML and merges the
results into a single ScanResponse.
"""

from __future__ import annotations

from collections import Counter

from app.models.schemas import Issue, ScanResponse
from app.scanners import alt_text, heading_order, form_labels, contrast

# Register scanners here — add new modules to this list
_SCANNERS = [
    alt_text,
    heading_order,
    form_labels,
    contrast,
]


def run_all_scanners(html: str, source: str = "html", url: str | None = None) -> ScanResponse:
    """Execute every scanner and aggregate results."""
    all_issues: list[Issue] = []

    for scanner in _SCANNERS:
        all_issues.extend(scanner.scan(html))

    # Build severity summary
    summary = dict(Counter(issue.severity.value for issue in all_issues))

    return ScanResponse(
        source=source,
        url=url,
        total_issues=len(all_issues),
        summary=summary,
        issues=all_issues,
    )
