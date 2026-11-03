/**
 * Content Script – Highlighter
 *
 * Receives issue data from the service worker and injects visual
 * overlays on the page to show the user exactly where each
 * accessibility violation occurs.
 */

// ── Remove previous highlights ──────────────────────────────────
function clearHighlights() {
  document.querySelectorAll(".lantern-highlight").forEach((el) => el.remove());
  document
    .querySelectorAll("[data-lantern-flagged]")
    .forEach((el) => el.removeAttribute("data-lantern-flagged"));
}

// ── Severity → colour mapping ───────────────────────────────────
const SEVERITY_COLORS = {
  critical: "#d32f2f",
  serious: "#e65100",
  moderate: "#f9a825",
  minor: "#78909c",
};

// ── Draw a highlight overlay on a DOM element ───────────────────
function highlightElement(el, issue) {
  el.setAttribute("data-lantern-flagged", "true");
  el.style.outline = `3px solid ${SEVERITY_COLORS[issue.severity] || "#d32f2f"}`;
  el.style.outlineOffset = "2px";

  // Tooltip badge
  const badge = document.createElement("div");
  badge.className = "lantern-highlight";
  badge.textContent = issue.rule_id;
  badge.title = `${issue.message}\n\nFix: ${issue.how_to_fix}`;
  badge.style.cssText = `
    position: absolute;
    background: ${SEVERITY_COLORS[issue.severity] || "#d32f2f"};
    color: #fff;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    z-index: 999999;
    pointer-events: auto;
    cursor: help;
    font-family: system-ui, sans-serif;
  `;

  // Position badge near the element
  const rect = el.getBoundingClientRect();
  badge.style.top = `${window.scrollY + rect.top - 18}px`;
  badge.style.left = `${window.scrollX + rect.left}px`;

  document.body.appendChild(badge);
}

// ── Listen for results from the service worker ──────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "highlight-issues") {
    clearHighlights();

    for (const issue of message.issues) {
      // Try to locate the element on the page using the CSS selector
      if (issue.selector) {
        try {
          const el = document.querySelector(issue.selector);
          if (el) {
            highlightElement(el, issue);
            continue;
          }
        } catch {
          // Selector may be invalid — fall through
        }
      }

      // Fallback: try matching by snippet tag name + attributes
      // (best-effort for images, inputs, etc.)
      const parser = new DOMParser();
      const doc = parser.parseFromString(issue.element, "text/html");
      const parsed = doc.body.firstElementChild;
      if (parsed) {
        const tag = parsed.tagName.toLowerCase();
        const candidates = document.querySelectorAll(tag);
        for (const candidate of candidates) {
          if (candidate.outerHTML.includes(issue.element.slice(1, 60))) {
            highlightElement(candidate, issue);
            break;
          }
        }
      }
    }

    sendResponse({ highlighted: true });
  }
});
