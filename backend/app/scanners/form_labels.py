"""
Scanner: Form Label Association

Checks that every <input>, <select>, and <textarea> has an associated label —
either through a wrapping <label>, a matching `for`/`id` pair, or an
`aria-label` / `aria-labelledby` attribute.

Hidden and submit/button inputs are excluded.

WCAG 2.1 — 1.3.1 Info and Relationships (Level A)
             3.3.2 Labels or Instructions (Level A)
"""

from __future__ import annotations

from bs4 import BeautifulSoup, Tag

from app.models.schemas import Issue, Severity

# Input types that don't need a visible label
_EXEMPT_TYPES = {"hidden", "submit", "button", "reset", "image"}


def _has_associated_label(tag: Tag, soup: BeautifulSoup) -> bool:
    """Return True if the form control has an accessible label."""
    # 1. aria-label or aria-labelledby
    if tag.get("aria-label") or tag.get("aria-labelledby"):
        return True

    # 2. Wrapping <label>
    parent_label = tag.find_parent("label")
    if parent_label is not None:
        return True

    # 3. for/id association
    tag_id = tag.get("id")
    if tag_id:
        label = soup.find("label", attrs={"for": tag_id})
        if label is not None:
            return True

    # 4. title attribute (fallback)
    if tag.get("title"):
        return True

    return False


def scan(html: str) -> list[Issue]:
    """Return issues for form controls without labels."""
    soup = BeautifulSoup(html, "lxml")
    issues: list[Issue] = []

    for tag in soup.find_all(["input", "select", "textarea"]):
        # Skip exempt types
        input_type = (tag.get("type") or "text").lower()
        if tag.name == "input" and input_type in _EXEMPT_TYPES:
            continue

        if not _has_associated_label(tag, soup):
            snippet = str(tag)[:200]
            issues.append(
                Issue(
                    rule_id="form-label-missing",
                    category="forms",
                    severity=Severity.critical,
                    element=snippet,
                    selector=None,
                    message=f"This <{tag.name}> has no associated label.",
                    how_to_fix=(
                        f'Add a <label for="{tag.get("id", "INPUT_ID")}"> element, '
                        f"or wrap this control inside a <label>. "
                        f'Alternatively, add an aria-label="…" attribute.'
                    ),
                    wcag_criteria="1.3.1 Info and Relationships / 3.3.2 Labels or Instructions",
                )
            )

    return issues
