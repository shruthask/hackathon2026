"""
Scan Orchestrator

Runs every registered scanner against the provided HTML and merges the
results into a single ScanResponse with score and grade.
"""

from __future__ import annotations

from collections import Counter
from urllib.parse import urlparse

from app.models.schemas import Issue, ScanResponse
from app.scanners import alt_text, heading_order, form_labels, contrast

_SCANNERS = [
    alt_text,
    heading_order,
    form_labels,
    contrast,
]


def calculate_score_and_grade(issues: list[Issue]) -> tuple[int, str]:
    deductions = {
        "critical": 12,
        "serious": 6,
        "moderate": 3,
        "minor": 1,
    }
    score = 100
    for issue in issues:
        score -= deductions.get(issue.severity.value, 2)
    score = max(0, min(100, score))

    if score >= 90:
        grade = "A"
    elif score >= 80:
        grade = "B"
    elif score >= 70:
        grade = "C"
    elif score >= 60:
        grade = "D"
    else:
        grade = "F"

    return score, grade


def run_all_scanners(html: str, source: str = "html", url: str | None = None) -> ScanResponse:
    """Execute every scanner and aggregate results."""
    all_issues: list[Issue] = []

    for scanner in _SCANNERS:
        all_issues.extend(scanner.scan(html))

    # Build severity summary
    summary = dict(Counter(issue.severity.value for issue in all_issues))
    score, grade = calculate_score_and_grade(all_issues)

    hostname = None
    if url:
        try:
            hostname = urlparse(url).hostname
        except Exception:
            hostname = None

    return ScanResponse(
        source=source,
        url=url,
        hostname=hostname,
        total_issues=len(all_issues),
        score=score,
        grade=grade,
        summary=summary,
        issues=all_issues,
    )
