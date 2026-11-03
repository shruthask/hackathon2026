"""
Scanner: Heading Order / Hierarchy

Detects heading-level skips (e.g. <h1> → <h3> with no <h2>) and flags pages
that start with a heading other than <h1>.

WCAG 2.1 — 1.3.1 Info and Relationships (Level A)
"""

from __future__ import annotations

from bs4 import BeautifulSoup, Tag

from app.models.schemas import Issue, Severity


def scan(html: str) -> list[Issue]:
    """Return issues for heading-order violations."""
    soup = BeautifulSoup(html, "lxml")
    issues: list[Issue] = []

    headings: list[Tag] = soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"])

    if not headings:
        return issues

    # Check: first heading should be h1
    first = headings[0]
    first_level = int(first.name[1])
    if first_level != 1:
        issues.append(
            Issue(
                rule_id="heading-order-first",
                severity=Severity.serious,
                element=str(first)[:200],
                selector=None,
                message=f"Page starts with <{first.name}> instead of <h1>.",
                how_to_fix="Add an <h1> as the first heading on the page to establish the document outline.",
                wcag_criteria="1.3.1 Info and Relationships",
            )
        )

    # Check: no level should jump by more than 1
    prev_level = first_level
    for heading in headings[1:]:
        curr_level = int(heading.name[1])
        if curr_level > prev_level + 1:
            issues.append(
                Issue(
                    rule_id="heading-order-skip",
                    severity=Severity.serious,
                    element=str(heading)[:200],
                    selector=None,
                    message=(
                        f"Heading level jumped from <h{prev_level}> to "
                        f"<{heading.name}>, skipping <h{prev_level + 1}>."
                    ),
                    how_to_fix=(
                        f"Change this to <h{prev_level + 1}>, or add a "
                        f"<h{prev_level + 1}> section before this heading."
                    ),
                    wcag_criteria="1.3.1 Info and Relationships",
                )
            )
        prev_level = curr_level

    return issues
