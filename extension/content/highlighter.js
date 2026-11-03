/**
 * Lantern – Interactive In-Page Element Highlighter & Inspector (WAVE-Inspired)
 *
 * High-visibility visual overlay system that highlights accessibility violations,
 * features, and keyboard focus order across ANY website and Shadow DOM:
 * - Traverses open Shadow DOM roots to find flagged elements
 * - Direct inline style fallback so highlights display even if CSP blocks stylesheets
 * - Distinct visual indicator badges for Errors, Alerts, and Positive Features
 * - Tab 3 Sequential Numbered Order Pins on focusable elements
 * - Styles ON/OFF toggle without breaking Lantern overlays
 * - Interactive tooltips with code snippets, suggested fixes, and 1-click copy
 */

(function () {
  window.__LANTERN_HIGHLIGHTER_LOADED__ = true;

  const SEVERITY_COLORS = {
    critical: "#dc2626", // Red
    serious: "#ea580c",  // Orange
    moderate: "#ca8a04", // Amber/Yellow
    minor: "#475569",    // Slate
    feature: "#16a34a",  // Emerald Green
  };

  let activeHighlights = [];
  let activeFocusOrder = [];
  let isHighlightsVisible = true;
  let activeTooltip = null;
  let stylesDisabled = false;

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
      .lantern-border-feature  { outline-color: #16a34a !important; box-shadow: 0 0 0 2px #dcfce7, 0 0 10px rgba(22, 163, 74, 0.45) !important; }
      .lantern-suppress-outline { outline: none !important; box-shadow: none !important; }
      
      @keyframes lanternPulseGlow {
        0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.9) !important; }
        50% { box-shadow: 0 0 0 18px rgba(249, 115, 22, 0) !important; }
        100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0) !important; }
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
    document.querySelectorAll(".lantern-order-badge").forEach((el) => el.remove());

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
          "lantern-border-feature",
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

  // ── Styles ON/OFF Toggle Feature ─────────────────────────────────
  window.lanternToggleStyles = function (enable) {
    stylesDisabled = !enable;

    // Toggle document.styleSheets
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      try {
        if (sheet.ownerNode && sheet.ownerNode.id === "lantern-core-styles") continue;
        sheet.disabled = !enable;
      } catch (e) {}
    }

    // Toggle stylesheet and style elements
    const styleNodes = document.querySelectorAll('link[rel="stylesheet"], style');
    styleNodes.forEach((node) => {
      if (node.id === "lantern-core-styles") return;
      if (!enable) {
        node.setAttribute("data-lantern-disabled-style", "true");
        node.disabled = true;
      } else {
        if (node.hasAttribute("data-lantern-disabled-style")) {
          node.removeAttribute("data-lantern-disabled-style");
          node.disabled = false;
        }
      }
    });

    ensureHighlightStylesInjected();
    return { success: true, stylesEnabled: enable };
  };

  // ── Interactive Tooltip Display ──────────────────────────────────
  function showInteractiveTooltip(el, issue) {
    removeTooltip();

    const isFeature = issue.severity === "feature";
    const color = SEVERITY_COLORS[issue.severity] || (isFeature ? "#16a34a" : "#dc2626");
    const badgeLabel = isFeature ? "FEATURE" : issue.severity.toUpperCase();

    const tooltip = document.createElement("div");
    tooltip.className = "lantern-interactive-tooltip";
    tooltip.innerHTML = `
      <div class="lantern-tooltip-header" style="background: ${color}">
        <span class="lantern-badge-tag">${badgeLabel}</span>
        <span class="lantern-rule-name">${escapeHtml(issue.rule_id || "accessibility-check")}</span>
        <button class="lantern-close-btn" title="Close">&times;</button>
      </div>
      <div class="lantern-tooltip-body">
        <p class="lantern-msg">${escapeHtml(issue.message)}</p>
        ${
          issue.element
            ? `<div class="lantern-code-preview">${escapeHtml(issue.element)}</div>`
            : ""
        }
        <div class="lantern-fix-box">
          <div class="lantern-fix-title">${isFeature ? "✓ Accessibility Benefit:" : "💡 Suggested Correction:"}</div>
          <div class="lantern-fix-text">${escapeHtml(issue.how_to_fix || "Follow WCAG authoring practices.")}</div>
        </div>
        <div class="lantern-tooltip-actions">
          ${
            issue.wcag_criteria
              ? `<span class="lantern-wcag-ref">WCAG: ${escapeHtml(issue.wcag_criteria)}</span>`
              : `<span></span>`
          }
          <button class="lantern-copy-btn" id="lantern-copy-fix-btn" title="Copy fix suggestion">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy Fix
          </button>
        </div>
      </div>
    `;

    tooltip.querySelector(".lantern-close-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      removeTooltip();
    });

    const copyBtn = tooltip.querySelector("#lantern-copy-fix-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(issue.how_to_fix || "").then(() => {
          copyBtn.textContent = "Copied!";
          setTimeout(() => {
            copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy Fix`;
          }, 1800);
        });
      });
    }

    document.body.appendChild(tooltip);
    activeTooltip = tooltip;

    const rect = el.getBoundingClientRect();
    const tooltipHeight = 220;
    const tooltipWidth = 340;

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
  window.lanternApplyHighlights = function (issues, features = []) {
    ensureHighlightStylesInjected();
    clearAllHighlights();
    activeHighlights = [...(issues || []), ...(features || [])];

    for (const item of activeHighlights) {
      const targetEl = findElementDeep(item.element_id, item.selector);
      if (!targetEl || targetEl === document.documentElement || targetEl === document.body) {
        continue;
      }

      const color = SEVERITY_COLORS[item.severity] || "#dc2626";

      // Mark element attribute & classes
      targetEl.setAttribute("data-lantern-flagged", item.severity);
      targetEl.classList.add("lantern-element-flagged", `lantern-border-${item.severity}`);

      // Apply direct inline styles as guarantee against stylesheet overrides
      targetEl.style.setProperty("outline", `3px solid ${color}`, "important");
      targetEl.style.setProperty("outline-offset", "2px", "important");
      targetEl.style.setProperty("box-shadow", `0 0 0 2px #fff, 0 0 10px ${color}80`, "important");

      // Inject small visual indicator badge pin
      const badge = document.createElement("button");
      badge.className = `lantern-injected-badge lantern-bg-${item.severity}`;
      const prefix = item.severity === "feature" ? "✓" : item.severity.slice(0, 4).toUpperCase();
      badge.textContent = `${prefix} · ${item.rule_id || "rule"}`;
      badge.setAttribute("data-lantern-badge-for", item.element_id || "");

      const updateBadgePos = () => {
        const rect = targetEl.getBoundingClientRect();
        badge.style.top = `${Math.max(0, window.scrollY + rect.top - 22)}px`;
        badge.style.left = `${Math.max(0, window.scrollX + rect.left)}px`;
      };

      updateBadgePos();

      badge.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showInteractiveTooltip(targetEl, item);
      });

      document.body.appendChild(badge);
    }
  };

  // ── Tab 3: Show Keyboard Focus Order on Page ─────────────────────
  window.lanternShowFocusOrder = function (items) {
    document.querySelectorAll(".lantern-order-badge").forEach((b) => b.remove());
    activeFocusOrder = items || [];

    activeFocusOrder.forEach((item) => {
      const el = findElementDeep(item.element_id, item.selector);
      if (!el) return;

      const badge = document.createElement("div");
      badge.className = `lantern-order-badge ${item.is_suspicious_tabindex ? "suspicious" : ""}`;
      badge.textContent = item.order;
      badge.setAttribute("data-lantern-order-id", item.element_id);
      badge.setAttribute("title", `Order #${item.order}: <${item.tag}> "${item.accessible_name}" (tabindex: ${item.tabindex})`);

      const rect = el.getBoundingClientRect();
      badge.style.top = `${Math.max(0, window.scrollY + rect.top - 10)}px`;
      badge.style.left = `${Math.max(0, window.scrollX + rect.left - 10)}px`;

      badge.addEventListener("click", (e) => {
        e.stopPropagation();
        window.lanternFocusOrderItem(item.order);
      });

      document.body.appendChild(badge);
    });
  };

  window.lanternHideFocusOrder = function () {
    document.querySelectorAll(".lantern-order-badge").forEach((b) => b.remove());
    activeFocusOrder = [];
  };

  window.lanternFocusOrderItem = function (orderNumber) {
    const item = activeFocusOrder.find((i) => i.order === orderNumber);
    if (!item) return false;

    const targetEl = findElementDeep(item.element_id, item.selector);
    if (!targetEl) return false;

    // Pulse target element
    targetEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    targetEl.classList.remove("lantern-element-pulse");
    void targetEl.offsetWidth;
    targetEl.classList.add("lantern-element-pulse");

    // Highlight the active order badge
    document.querySelectorAll(".lantern-order-badge").forEach((b) => b.classList.remove("active"));
    const activeBadge = document.querySelector(`.lantern-order-badge[data-lantern-order-id="${CSS.escape(item.element_id)}"]`);
    if (activeBadge) activeBadge.classList.add("active");

    return true;
  };

  // ── Smooth Scroll & Inspect ─────────────────────────────────────
  window.lanternFocusIssue = function (elementId) {
    const targetEl = findElementDeep(elementId, null);
    if (!targetEl) return false;

    targetEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

    targetEl.classList.remove("lantern-element-pulse");
    void targetEl.offsetWidth;
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
      window.lanternApplyHighlights(message.issues || [], message.features || []);
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

    if (message.action === "toggle-styles") {
      const res = window.lanternToggleStyles(message.enable);
      sendResponse(res);
      return true;
    }

    if (message.action === "show-focus-order") {
      window.lanternShowFocusOrder(message.items || []);
      sendResponse({ success: true });
      return true;
    }

    if (message.action === "hide-focus-order") {
      window.lanternHideFocusOrder();
      sendResponse({ success: true });
      return true;
    }

    if (message.action === "focus-order-item") {
      const ok = window.lanternFocusOrderItem(message.orderNumber);
      sendResponse({ success: ok });
      return true;
    }
  });

  // ── Dynamic Position Updates on Scroll and Window Resize ────────
  function updateAllPositions() {
    // 1. Update indicator badges
    document.querySelectorAll(".lantern-injected-badge").forEach((badge) => {
      const id = badge.getAttribute("data-lantern-badge-for");
      if (id) {
        const el = findElementDeep(id, null);
        if (el) {
          const rect = el.getBoundingClientRect();
          badge.style.top = `${Math.max(0, window.scrollY + rect.top - 22)}px`;
          badge.style.left = `${Math.max(0, window.scrollX + rect.left)}px`;
        }
      }
    });

    // 2. Update order badges
    document.querySelectorAll(".lantern-order-badge").forEach((badge) => {
      const id = badge.getAttribute("data-lantern-order-id");
      if (id) {
        const el = findElementDeep(id, null);
        if (el) {
          const rect = el.getBoundingClientRect();
          badge.style.top = `${Math.max(0, window.scrollY + rect.top - 10)}px`;
          badge.style.left = `${Math.max(0, window.scrollX + rect.left - 10)}px`;
        }
      }
    });
  }

  window.addEventListener("scroll", updateAllPositions, { passive: true });
  window.addEventListener("resize", updateAllPositions, { passive: true });
})();
