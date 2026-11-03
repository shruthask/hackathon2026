"""
Pydantic schemas for scan requests and responses.

Every scanner produces a list of `Issue` objects. The API wraps them in a
`ScanResponse` so the React frontend and Chrome extension always receive
the same JSON shape.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Severity levels ──────────────────────────────────────────────────
class Severity(str, Enum):
    critical = "critical"  # Blocks access entirely (e.g. no alt text on info image)
    serious = "serious"    # Major barrier (e.g. skipped heading levels)
    moderate = "moderate"  # Usability issue (e.g. low contrast)
    minor = "minor"        # Best-practice suggestion


# ── A single accessibility issue ─────────────────────────────────────
class Issue(BaseModel):
    """One detected accessibility problem."""

    rule_id: str = Field(
        ...,
        description="Machine-readable rule identifier, e.g. 'img-alt-missing'.",
    )
    category: Optional[str] = Field(
        "general",
        description="Issue domain: 'images', 'forms', 'headings', 'contrast', 'navigation', 'general'",
    )
    severity: Severity
    element: str = Field(
        ...,
        description="The HTML snippet of the offending element (truncated).",
    )
    element_id: Optional[str] = Field(
        None,
        description="In-page live DOM identifier for high-precision inspection.",
    )
    selector: Optional[str] = Field(
        None,
        description="CSS selector that uniquely identifies the element on the page.",
    )
    message: str = Field(
        ...,
        description="Human-readable explanation of the problem.",
    )
    how_to_fix: str = Field(
        ...,
        description="Concrete fix suggestion the user can copy-paste.",
    )
    wcag_criteria: Optional[str] = Field(
        None,
        description="Related WCAG 2.1 success criterion, e.g. '1.1.1 Non-text Content'.",
    )


# ── Request bodies ───────────────────────────────────────────────────
class ScanHTMLRequest(BaseModel):
    """Client sends raw HTML code to scan."""
    html: str


class ScanURLRequest(BaseModel):
    """Client sends a URL; backend fetches & scans it."""
    url: str


# ── Response ─────────────────────────────────────────────────────────
class ScanResponse(BaseModel):
    """Standardized response returned to every client."""

    source: str = Field(
        ...,
        description="'url', 'html', 'file', or 'live-dom' — how the audit was performed.",
    )
    url: Optional[str] = None
    page_title: Optional[str] = None
    hostname: Optional[str] = None
    total_issues: int
    score: Optional[int] = Field(
        100,
        description="Accessibility health score from 0 to 100.",
    )
    grade: Optional[str] = Field(
        "A",
        description="Letter grade (A, B, C, D, F) based on violation density.",
    )
    duration_ms: Optional[int] = None
    summary: dict[str, int] = Field(
        default_factory=dict,
        description="Count of issues per severity: {'critical': 2, 'serious': 1, …}",
    )
    issues: list[Issue]
    details_categories: Optional[dict] = None
    focus_order: Optional[list] = None
    structure_tree: Optional[list] = None
    contrast_items: Optional[list] = None
    disclaimer: str = Field(
        default=(
            "⚠️ This automated scan checks a limited set of accessibility rules. "
            "It does NOT guarantee full WCAG 2.1 compliance. "
            "Manual testing with assistive technologies (screen readers, keyboard-only "
            "navigation) is essential for a thorough audit."
        ),
    )
