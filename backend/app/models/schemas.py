"""
Pydantic schemas for scan requests and responses.

Every scanner produces a list of `Issue` objects.  The API wraps them in a
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
    severity: Severity
    element: str = Field(
        ...,
        description="The HTML snippet of the offending element (truncated).",
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
        description="'url', 'html', or 'file' — how the HTML was provided.",
    )
    url: Optional[str] = None
    total_issues: int
    summary: dict[str, int] = Field(
        default_factory=dict,
        description="Count of issues per severity: {'critical': 2, 'serious': 1, …}",
    )
    issues: list[Issue]
    disclaimer: str = Field(
        default=(
            "⚠️ This automated scan checks a limited set of accessibility rules. "
            "It does NOT guarantee full WCAG 2.1 compliance. "
            "Manual testing with assistive technologies (screen readers, keyboard-only "
            "navigation) is essential for a thorough audit."
        ),
    )
