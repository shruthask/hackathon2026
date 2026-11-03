"""
Scanner: Missing Image Alt Text

Checks <img> tags for missing `alt` attributes on meaningful content images.
Follows WCAG 2.1 — 1.1.1 Non-text Content (Level A):
- alt="" is valid for purely decorative images (WCAG H67).
- Flags images with NO alt attribute.
- Flags images with alt="" if the image is the SOLE content of a link (anchor).
- Skips hidden, template, and 1x1 tracking pixel images to avoid false positives.
"""

from __future__ import annotations

import re
from bs4 import BeautifulSoup, Tag

from app.models.schemas import Issue, Severity


def _css_selector(tag: Tag) -> str:
    """Build a robust CSS selector path."""
    if tag.get("id"):
        return f"#{tag['id']}"
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
    parts.append(tag.name)
    if tag.get("class"):
        parts[-1] = f'{tag.name}.{".".join(tag["class"])}'
    return " > ".join(parts)


def _is_ignorable_image(img: Tag) -> bool:
    """Filter out non-visible, template, or tracking images."""
    # Inside template, noscript, or hidden containers
    for p in img.parents:
        if p.name in ("template", "noscript"):
            return True
        if p.get("aria-hidden") == "true" or p.has_attr("hidden"):
            return True

    # Element itself is hidden or presentation
    if img.get("role") in ("presentation", "none") or img.get("aria-hidden") == "true":
        return True
    if img.has_attr("hidden"):
        return True

    style = (img.get("style") or "").lower()
    if "display:none" in style or "visibility:hidden" in style:
        return True

    # 1x1 tracking pixels or empty templates
    src = (img.get("src") or "").strip()
    width = img.get("width")
    height = img.get("height")
    if (width == "1" and height == "1") or (width == "0" or height == "0"):
        return True
    if not src and not img.get("srcset") and not img.get("data-src"):
        return True  # unhydrated skeleton or empty template

    return False


def scan(html: str) -> list[Issue]:
    """Return a list of Issue objects for images with missing alt text."""
    soup = BeautifulSoup(html, "lxml")
    issues: list[Issue] = []

    for img in soup.find_all("img"):
        if _is_ignorable_image(img):
            continue

        alt = img.get("alt")
        parent_link = img.find_parent("a")
        is_sole_link_content = False
        if parent_link:
            link_text = parent_link.get_text(strip=True)
            other_imgs = parent_link.find_all("img")
            if not link_text and len(other_imgs) == 1:
                is_sole_link_content = True

        if alt is None:
            if is_sole_link_content:
                msg = "Image inside a link has no `alt` attribute, making the link inaccessible to screen readers."
                fix = 'Add alt="Link destination description" to describe where this link navigates.'
            else:
                msg = "This <img> has no `alt` attribute at all."
                fix = 'Add alt="descriptive text" (or alt="" if purely decorative).'
        elif alt.strip() == "" and is_sole_link_content:
            msg = "This <img> has alt=\"\" but is the sole content of a link, creating an unlabelled link."
            fix = 'Provide descriptive alt text for the link destination, e.g. alt="Home page".'
        else:
            continue  # alt is present, or decorative alt="" on non-link image → valid WCAG H67

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
                wcag_criteria="1.1.1 Non-text Content (Level A)",
            )
        )

    return issues
