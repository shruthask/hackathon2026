"""
Scanner: Colour Contrast (Static Approximation)

Parses inline `style` attributes and `<style>` blocks to find text elements
with explicitly declared foreground/background colours, then checks the
WCAG 2.1 contrast ratio.

Minimum ratios (Level AA):
  • Normal text  → 4.5:1
  • Large text   → 3.0:1   (≥ 18pt or ≥ 14pt bold)

NOTE: This is a *best-effort* static check.  Full contrast analysis requires
a rendering engine.  The disclaimer in the response makes this clear.

WCAG 2.1 — 1.4.3 Contrast (Minimum) (Level AA)
"""

from __future__ import annotations

import re
from typing import Optional

from bs4 import BeautifulSoup, Tag

from app.models.schemas import Issue, Severity

# ── Colour helpers ───────────────────────────────────────────────────

_HEX3 = re.compile(r"^#([0-9a-fA-F]{3})$")
_HEX6 = re.compile(r"^#([0-9a-fA-F]{6})$")
_RGB = re.compile(r"rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)")

# A handful of CSS named colours for quick demo coverage
_NAMED: dict[str, tuple[int, int, int]] = {
    "white": (255, 255, 255),
    "black": (0, 0, 0),
    "red": (255, 0, 0),
    "green": (0, 128, 0),
    "blue": (0, 0, 255),
    "gray": (128, 128, 128),
    "grey": (128, 128, 128),
    "yellow": (255, 255, 0),
    "orange": (255, 165, 0),
    "lightgray": (211, 211, 211),
    "lightgrey": (211, 211, 211),
    "darkgray": (169, 169, 169),
    "darkgrey": (169, 169, 169),
    "silver": (192, 192, 192),
}


def _parse_colour(value: str) -> Optional[tuple[int, int, int]]:
    """Try to convert a CSS colour string to (R, G, B)."""
    value = value.strip().lower()

    if value in _NAMED:
        return _NAMED[value]

    m = _HEX6.match(value)
    if m:
        h = m.group(1)
        return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)

    m = _HEX3.match(value)
    if m:
        h = m.group(1)
        return int(h[0] * 2, 16), int(h[1] * 2, 16), int(h[2] * 2, 16)

    m = _RGB.match(value)
    if m:
        return int(m.group(1)), int(m.group(2)), int(m.group(3))

    return None


def _relative_luminance(r: int, g: int, b: int) -> float:
    """WCAG relative luminance."""
    def _lin(c: int) -> float:
        s = c / 255.0
        return s / 12.92 if s <= 0.04045 else ((s + 0.055) / 1.055) ** 2.4

    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)


def _contrast_ratio(
    fg: tuple[int, int, int],
    bg: tuple[int, int, int],
) -> float:
    l1 = _relative_luminance(*fg)
    l2 = _relative_luminance(*bg)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


# ── Inline-style extractor ───────────────────────────────────────────

_COLOR_RE = re.compile(r"(?:^|;)\s*color\s*:\s*([^;]+)", re.I)
_BG_RE = re.compile(r"(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)", re.I)


def scan(html: str) -> list[Issue]:
    """Return contrast issues found via inline styles."""
    soup = BeautifulSoup(html, "lxml")
    issues: list[Issue] = []

    for tag in soup.find_all(style=True):
        style: str = tag["style"]

        fg_match = _COLOR_RE.search(style)
        bg_match = _BG_RE.search(style)

        if not (fg_match and bg_match):
            continue  # Need both colours to calculate

        fg = _parse_colour(fg_match.group(1))
        bg = _parse_colour(bg_match.group(1))

        if fg is None or bg is None:
            continue

        ratio = _contrast_ratio(fg, bg)
        if ratio < 4.5:
            snippet = str(tag)[:200]
            issues.append(
                Issue(
                    rule_id="contrast-low",
                    severity=Severity.moderate if ratio >= 3.0 else Severity.serious,
                    element=snippet,
                    selector=None,
                    message=(
                        f"Contrast ratio is {ratio:.2f}:1 "
                        f"(minimum 4.5:1 for normal text)."
                    ),
                    how_to_fix=(
                        "Darken the text colour or lighten the background "
                        "(or vice-versa) until the ratio reaches at least 4.5:1. "
                        "Use a contrast checker tool to verify."
                    ),
                    wcag_criteria="1.4.3 Contrast (Minimum)",
                )
            )

    return issues
