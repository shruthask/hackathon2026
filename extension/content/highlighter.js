/**
 * Lantern – Interactive In-Page Element Highlighter & Inspector
 *
 * High-visibility visual overlay system that highlights accessibility violations
 * across ANY website, framework (React, Vue, Angular, Lit), and Shadow DOM:
 * - Traverses open Shadow DOM roots to find flagged elements
 * - Direct inline style fallback so highlights display even if CSP blocks stylesheets
 * - High-contrast outline + ambient glow halo + badge pin
 * - Smooth scroll-to-element and pulse animation on issue selection
 */

(function () {
  window.__LANTERN_HIGHLIGHTER_LOADED__ = true;

  const SEVERITY_COLORS = {
    critical: "#dc2626", // Red
    serious: "#ea580c",  // Orange
    moderate: "#ca8a04", // Amber/Yellow
    minor: "#475569",    // Slate
  };

  let activeHighlights = [];
  let isHighlightsVisible = true;
  let activeTooltip = null;

  // ── Inject Guaranteed Fallback CSS into Head ────────────────────
  function ensureHighlightStylesInjected() {
    if (document.getElementById("lantern-core-styles")) return;
    const style = document.createElement("style");
    style.id = "lantern-core-styles";
    style.textContent = `
      .lantern-element-flagged {
        outline-style: solid !important;
        outline-width: 3px !important;
        outline-offset: 2px !important;
        transition: outline-color 0.2s, box-shadow 0.2s !important;
      }
      .lantern-border-critical { outline-color: #dc2626 !important; box-shadow: 0 0 0 2px #fecaca, 0 0 10px rgba(220, 38, 38, 0.45) !important; }
      .lantern-border-serious  { outline-color: #ea580c !important; box-shadow: 0 0 0 2px #fed7aa, 0 0 10px rgba(234, 88, 12, 0.45) !important; }
      .lantern-border-moderate { outline-color: #ca8a04 !important; box-shadow: 0 0 0 2px #fef08a, 0 0 10px rgba(202, 138, 4, 0.45) !important; }
      .lantern-border-minor    { outline-color: #475569 !important; box-shadow: 0 0 0 2px #e2e8f0, 0 0 8px rgba(71, 85, 105, 0.35) !important; }
      .lantern-suppress-outline { outline: none !important; box-shadow: none !important; }
      
      @keyframes lanternPulseGlow {
        0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.8) !important; }
        50% { box-shadow: 0 0 0 18px rgba(220, 38, 38, 0) !important; }
        100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0) !important; }
      }
      .lantern-element-pulse {
        animation: lanternPulseGlow 1.2s ease-out 2 !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // ── Deep Element Finder (Light DOM + Shadow DOM) ────────────────
  function findElementDeep(id, selector) {
    function search(root) {
      if (!root) return null;

      // 1. Search by data-lantern-id
      if (id) {
        try {
          const el = root.querySelector(`[data-lantern-id="${CSS.escape(id)}"]`);
          if (el) return el;
        } catch (e) {}
      }

      // 2. Search by selector fallback
      if (selector) {
        try {
          const el = root.querySelector(selector);
          if (el && el !== document.documentElement && el !== document.body) return el;
        } catch (e) {}
      }

      // 3. Search children's shadow roots recursively
      const children = root.querySelectorAll ? root.querySelectorAll("*") : [];
      for (let i = 0; i < children.length; i++) {
        if (children[i].shadowRoot) {
          const found = search(children[i].shadowRoot);
          if (found) return found;
        }
      }
      return null;
    }

    return search(document);
  }

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

    function clearRoot(root) {
      if (!root) return;
      const flagged = root.querySelectorAll ? root.querySelectorAll("[data-lantern-flagged]") : [];
      flagged.forEach((el) => {
        el.removeAttribute("data-lantern-flagged");
        el.classList.remove(
          "lantern-element-flagged",
          "lantern-border-critical",
          "lantern-border-serious",
          "lantern-border-moderate",
          "lantern-border-minor",
          "lantern-element-pulse"
        );
        el.style.removeProperty("outline");
        el.style.removeProperty("outline-offset");
        el.style.removeProperty("box-shadow");
      });

      const all = root.querySelectorAll ? root.querySelectorAll("*") : [];
      for (let i = 0; i < all.length; i++) {
        if (all[i].shadowRoot) clearRoot(all[i].shadowRoot);
      }
    }
    clearRoot(document);
    activeHighlights = [];
  }

  function setHighlightsVisibility(visible) {
    isHighlightsVisible = visible;
    const displayVal = visible ? "" : "none";
    document.querySelectorAll(".lantern-injected-badge").forEach((el) => {
      el.style.display = displayVal;
    });

    function toggleRoot(root) {
      if (!root) return;
      const flagged = root.querySelectorAll ? root.querySelectorAll("[data-lantern-flagged]") : [];
      flagged.forEach((el) => {
        if (!visible) {
          el.classList.add("lantern-suppress-outline");
          el.style.setProperty("outline", "none", "important");
          el.style.setProperty("box-shadow", "none", "important");
        } else {
          el.classList.remove("lantern-suppress-outline");
          const sev = el.getAttribute("data-lantern-flagged");
          const color = SEVERITY_COLORS[sev] || "#dc2626";
          el.style.setProperty("outline", `3px solid ${color}`, "important");
          el.style.setProperty("outline-offset", "2px", "important");
          el.style.setProperty("box-shadow", `0 0 0 2px #fff, 0 0 10px ${color}80`, "important");
        }
      });
      const all = root.querySelectorAll ? root.querySelectorAll("*") : [];
      for (let i = 0; i < all.length; i++) {
        if (all[i].shadowRoot) toggleRoot(all[i].shadowRoot);
      }
    }
    toggleRoot(document);
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
        ${issue.wcag_criteria ? `<div class="lantern-wcag-ref">WCAG: ${escapeHtml(issue.wcag_criteria)}</div>` : ""}
      </div>
    `;

    tooltip.querySelector(".lantern-close-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      removeTooltip();
    });

    document.body.appendChild(tooltip);
    activeTooltip = tooltip;

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

  // ── Core Highlight Application ──────────────────────────────────
  window.lanternApplyHighlights = function (issues) {
    ensureHighlightStylesInjected();
    clearAllHighlights();
    activeHighlights = issues || [];

    for (const issue of activeHighlights) {
      const targetEl = findElementDeep(issue.element_id, issue.selector);
      if (!targetEl || targetEl === document.documentElement || targetEl === document.body) {
        continue;
      }

      const color = SEVERITY_COLORS[issue.severity] || "#dc2626";

      // Mark attribute
      targetEl.setAttribute("data-lantern-flagged", issue.severity);
      targetEl.classList.add("lantern-element-flagged", `lantern-border-${issue.severity}`);

      // Apply direct inline styles as 100% reliable guarantee against CSP or stylesheet overrides
      targetEl.style.setProperty("outline", `3px solid ${color}`, "important");
      targetEl.style.setProperty("outline-offset", "2px", "important");
      targetEl.style.setProperty("box-shadow", `0 0 0 2px #fff, 0 0 10px ${color}80`, "important");

      // Inject small severity badge pin
      const badge = document.createElement("button");
      badge.className = `lantern-injected-badge lantern-bg-${issue.severity}`;
      badge.textContent = `${issue.severity.slice(0, 4).toUpperCase()} · ${issue.rule_id}`;
      badge.setAttribute("data-lantern-badge-for", issue.element_id || "");

      const updateBadgePos = () => {
        const rect = targetEl.getBoundingClientRect();
        badge.style.top = `${Math.max(0, window.scrollY + rect.top - 20)}px`;
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
  };

  // ── Smooth Scroll & Inspect ─────────────────────────────────────
  window.lanternFocusIssue = function (elementId) {
    const targetEl = findElementDeep(elementId, null);
    if (!targetEl) return false;

    targetEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

    targetEl.classList.remove("lantern-element-pulse");
    void targetEl.offsetWidth; // reflow
    targetEl.classList.add("lantern-element-pulse");

    const issue = activeHighlights.find((item) => item.element_id === elementId);
    if (issue) {
      setTimeout(() => {
        showInteractiveTooltip(targetEl, issue);
      }, 350);
    }

    return true;
  };

  // ── Runtime Message Listener ────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "highlight-issues") {
      window.lanternApplyHighlights(message.issues || []);
      sendResponse({ success: true, count: message.issues?.length || 0 });
      return true;
    }

    if (message.action === "focus-issue") {
      const found = window.lanternFocusIssue(message.elementId);
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

  window.addEventListener(
    "scroll",
    () => {
      document.querySelectorAll(".lantern-injected-badge").forEach((badge) => {
        const id = badge.getAttribute("data-lantern-badge-for");
        if (id) {
          const el = findElementDeep(id, null);
          if (el) {
            const rect = el.getBoundingClientRect();
            badge.style.top = `${Math.max(0, window.scrollY + rect.top - 20)}px`;
            badge.style.left = `${Math.max(0, window.scrollX + rect.left)}px`;
          }
        }
      });
    },
    { passive: true }
  );
})();
