/**
 * Lantern – Interactive In-Page Element Highlighter & Inspector
 *
 * Visual overlay system that highlights accessibility violations directly
 * on any live website with:
 * - Outline bounding boxes color-coded by WCAG severity
 * - Interactive hover & click tooltip cards with code fixes
 * - Smooth scroll-to-element and pulse animation on issue selection
 * - Clean show/hide toggle that leaves no permanent DOM garbage
 */

(function () {
  if (window.__LANTERN_HIGHLIGHTER_LOADED__) return;
  window.__LANTERN_HIGHLIGHTER_LOADED__ = true;

  const SEVERITY_COLORS = {
    critical: "#dc2626", // Red-600
    serious: "#ea580c",  // Orange-600
    moderate: "#ca8a04", // Yellow-600
    minor: "#475569",    // Slate-600
  };

  let activeHighlights = [];
  let isHighlightsVisible = true;
  let activeTooltip = null;

  function removeTooltip() {
    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
    }
  }

  function clearAllHighlights() {
    removeTooltip();
    document.querySelectorAll(".lantern-injected-badge").forEach((el) => el.remove());
    document.querySelectorAll(".lantern-injected-overlay").forEach((el) => el.remove());
    document.querySelectorAll("[data-lantern-flagged]").forEach((el) => {
      el.removeAttribute("data-lantern-flagged");
      el.classList.remove("lantern-element-flagged", "lantern-element-pulse");
    });
    activeHighlights = [];
  }

  function setHighlightsVisibility(visible) {
    isHighlightsVisible = visible;
    const displayVal = visible ? "" : "none";
    document.querySelectorAll(".lantern-injected-badge").forEach((el) => {
      el.style.display = displayVal;
    });
    document.querySelectorAll("[data-lantern-flagged]").forEach((el) => {
      if (!visible) {
        el.classList.add("lantern-suppress-outline");
      } else {
        el.classList.remove("lantern-suppress-outline");
      }
    });
  }

  function showInteractiveTooltip(el, issue) {
    removeTooltip();

    const color = SEVERITY_COLORS[issue.severity] || "#dc2626";
    const tooltip = document.createElement("div");
    tooltip.className = "lantern-interactive-tooltip";
    tooltip.innerHTML = `
      <div class="lantern-tooltip-header" style="background: ${color}">
        <span class="lantern-badge-tag">${issue.severity.toUpperCase()}</span>
        <span class="lantern-rule-name">${issue.rule_id}</span>
        <button class="lantern-close-btn" title="Close">&times;</button>
      </div>
      <div class="lantern-tooltip-body">
        <p class="lantern-msg">${escapeHtml(issue.message)}</p>
        <div class="lantern-fix-box">
          <div class="lantern-fix-title">💡 How to Fix:</div>
          <div class="lantern-fix-text">${escapeHtml(issue.how_to_fix)}</div>
        </div>
        ${issue.wcag_criteria ? `<div class="lantern-wcag-ref">📌 ${escapeHtml(issue.wcag_criteria)}</div>` : ""}
      </div>
    `;

    tooltip.querySelector(".lantern-close-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      removeTooltip();
    });

    document.body.appendChild(tooltip);
    activeTooltip = tooltip;

    // Position tooltip safely near the element
    const rect = el.getBoundingClientRect();
    const tooltipHeight = 180;
    const tooltipWidth = 320;

    let top = window.scrollY + rect.bottom + 8;
    if (rect.bottom + tooltipHeight > window.innerHeight && rect.top > tooltipHeight) {
      top = window.scrollY + rect.top - tooltipHeight - 8;
    }

    let left = window.scrollX + rect.left;
    if (rect.left + tooltipWidth > window.innerWidth) {
      left = Math.max(10, window.scrollX + window.innerWidth - tooltipWidth - 20);
    }

    tooltip.style.top = `${Math.max(10, top)}px`;
    tooltip.style.left = `${Math.max(10, left)}px`;
  }

  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function applyHighlights(issues) {
    clearAllHighlights();
    activeHighlights = issues;

    for (const issue of issues) {
      let targetEl = null;

      if (issue.element_id) {
        targetEl = document.querySelector(`[data-lantern-id="${CSS.escape(issue.element_id)}"]`);
      }

      if (!targetEl && issue.selector) {
        try {
          targetEl = document.querySelector(issue.selector);
        } catch (e) {
          // invalid selector fallback
        }
      }

      if (!targetEl || targetEl === document.documentElement || targetEl === document.body) {
        continue;
      }

      targetEl.setAttribute("data-lantern-flagged", issue.severity);
      targetEl.classList.add("lantern-element-flagged", `lantern-border-${issue.severity}`);

      // Inject small severity pill badge at top-left
      const badge = document.createElement("button");
      badge.className = `lantern-injected-badge lantern-bg-${issue.severity}`;
      badge.textContent = `${issue.severity.slice(0, 4).toUpperCase()} · ${issue.rule_id}`;
      badge.setAttribute("data-lantern-badge-for", issue.element_id || "");

      const updateBadgePos = () => {
        const rect = targetEl.getBoundingClientRect();
        badge.style.top = `${Math.max(0, window.scrollY + rect.top - 18)}px`;
        badge.style.left = `${Math.max(0, window.scrollX + rect.left)}px`;
      };

      updateBadgePos();

      badge.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showInteractiveTooltip(targetEl, issue);
      });

      document.body.appendChild(badge);
    }
  }

  function focusAndScrollToIssue(elementId) {
    let targetEl = document.querySelector(`[data-lantern-id="${CSS.escape(elementId)}"]`);
    if (!targetEl) return false;

    // Scroll smoothly to center of viewport
    targetEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

    // Apply glow pulse effect
    targetEl.classList.remove("lantern-element-pulse");
    void targetEl.offsetWidth; // trigger reflow
    targetEl.classList.add("lantern-element-pulse");

    // Match issue
    const issue = activeHighlights.find((item) => item.element_id === elementId);
    if (issue) {
      setTimeout(() => {
        showInteractiveTooltip(targetEl, issue);
      }, 350);
    }

    return true;
  }

  // ── Runtime Message Listener ────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "highlight-issues") {
      applyHighlights(message.issues || []);
      sendResponse({ success: true, count: message.issues?.length || 0 });
      return true;
    }

    if (message.action === "focus-issue") {
      const found = focusAndScrollToIssue(message.elementId);
      sendResponse({ success: found });
      return true;
    }

    if (message.action === "toggle-highlights") {
      setHighlightsVisibility(message.visible);
      sendResponse({ success: true, visible: message.visible });
      return true;
    }

    if (message.action === "clear-highlights") {
      clearAllHighlights();
      sendResponse({ success: true });
      return true;
    }
  });

  // Reposition badges on window resize / scroll
  window.addEventListener(
    "resize",
    () => {
      document.querySelectorAll(".lantern-injected-badge").forEach((badge) => {
        const id = badge.getAttribute("data-lantern-badge-for");
        if (id) {
          const el = document.querySelector(`[data-lantern-id="${CSS.escape(id)}"]`);
          if (el) {
            const rect = el.getBoundingClientRect();
            badge.style.top = `${Math.max(0, window.scrollY + rect.top - 18)}px`;
            badge.style.left = `${Math.max(0, window.scrollX + rect.left)}px`;
          }
        }
      });
    },
    { passive: true }
  );
})();
