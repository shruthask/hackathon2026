"""
Scanner: Missing Image Alt Text

Checks every <img> tag for a missing, empty, or purely-whitespace `alt`
attribute.  Decorative images that have `role="presentation"` or
`aria-hidden="true"` are intentionally skipped.

WCAG 2.1 — 1.1.1 Non-text Content (Level A)
"""

from __future__ import annotations

from bs4 import BeautifulSoup, Tag

from app.models.schemas import Issue, Severity


def _css_selector(tag: Tag) -> str:
    """Build a rough CSS selector path for highlighting."""
    parts: list[str] = []
    for parent in tag.parents:
        if parent.name == "[document]":
            break
        idx = 1
        for sibling in parent.children:
            if isinstance(sibling, Tag):
                if sibling is parent:
                    break
                if sibling.name == parent.name:
                    idx += 1
        parts.append(f"{parent.name}:nth-of-type({idx})")
    parts.reverse()
    # Append the tag itself
    parts.append(tag.name)
    if tag.get("id"):
        parts[-1] = f'{tag.name}#{tag["id"]}'
    elif tag.get("class"):
        parts[-1] = f'{tag.name}.{".".join(tag["class"])}'
    return " > ".join(parts)


def scan(html: str) -> list[Issue]:
    """Return a list of Issue objects for images with missing alt text."""
    soup = BeautifulSoup(html, "lxml")
    issues: list[Issue] = []

    for img in soup.find_all("img"):
        # Skip intentionally decorative images
        if img.get("role") == "presentation" or img.get("aria-hidden") == "true":
            continue

        alt = img.get("alt")
        if alt is None:
            msg = "This <img> has no `alt` attribute at all."
            fix = 'Add alt="descriptive text" (or alt="" if purely decorative).'
        elif alt.strip() == "":
            # Empty alt is valid for decorative images — flag only if no
            # explicit decorative role was set (already filtered above).
            msg = "This <img> has an empty `alt` attribute but is not marked as decorative."
            fix = (
                'If decorative, add role="presentation". '
                'Otherwise, write a meaningful alt description.'
            )
        else:
            continue  # alt is present and non-empty → OK

        snippet = str(img)[:200]
        issues.append(
            Issue(
                rule_id="img-alt-missing",
                category="images",
                severity=Severity.critical,
                element=snippet,
                selector=_css_selector(img),
                message=msg,
                how_to_fix=fix,
                wcag_criteria="1.1.1 Non-text Content",
            )
        )

    return issues
