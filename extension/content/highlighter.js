/**
 * Lantern – Universal High-Visibility Overlay & Element Inspector
 *
 * Provides 100% reliable in-page visual highlighting on ANY website:
 * - Recursively searches Shadow DOM roots (YouTube, Web Components, SPAs)
 * - Uses a dedicated top-level overlay layer (#lantern-highlighter-root) so
 *   highlights are NEVER clipped by parent overflow:hidden or transform styles
 * - Viewport-accurate bounding boxes with severity color coding & glowing halos
 * - Smooth scroll-to-element and pulse animation on issue selection
 */

(function () {
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
  let overlayRoot = null;
  let trackedItems = []; // { el, issue, boxEl, badgeEl }

  // ── Helper: Deep Search inside Light & Shadow DOM ───────────────
  function findElementDeep(elementId, selector, root = document) {
    if (!elementId && !selector) return null;

    function search(node) {
      if (!node) return null;

      if (node.nodeType === Node.ELEMENT_NODE) {
        if (elementId && node.getAttribute("data-lantern-id") === elementId) {
          return node;
        }
        if (selector) {
          try {
            if (node.matches && node.matches(selector)) {
              return node;
            }
          } catch (e) {}
        }
        if (node.shadowRoot) {
          const foundInShadow = search(node.shadowRoot);
          if (foundInShadow) return foundInShadow;
        }
      }

      const children = node.children || [];
      for (let i = 0; i < children.length; i++) {
        const found = search(children[i]);
        if (found) return found;
      }
      return null;
    }

    return search(root);
  }

  // ── Overlay Root Container ──────────────────────────────────────
  function getOrCreateOverlayRoot() {
    if (!overlayRoot || !document.contains(overlayRoot)) {
      overlayRoot = document.getElementById("lantern-highlighter-root");
      if (!overlayRoot) {
        overlayRoot = document.createElement("div");
        overlayRoot.id = "lantern-highlighter-root";
        document.body.appendChild(overlayRoot);
      }
    }
    return overlayRoot;
  }

  function removeTooltip() {
    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
    }
  }

  function clearAllHighlights() {
    removeTooltip();
    if (overlayRoot) {
      overlayRoot.innerHTML = "";
    }
    document.querySelectorAll("[data-lantern-flagged]").forEach((el) => {
      el.removeAttribute("data-lantern-flagged");
      el.classList.remove("lantern-element-flagged", "lantern-element-pulse");
    });
    activeHighlights = [];
    trackedItems = [];
  }

  function setHighlightsVisibility(visible) {
    isHighlightsVisible = visible;
    if (overlayRoot) {
      overlayRoot.style.display = visible ? "" : "none";
    }
    if (!visible) removeTooltip();
  }

  function updateOverlayPositions() {
    if (!isHighlightsVisible) return;
    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    for (const item of trackedItems) {
      const { el, boxEl, badgeEl } = item;
      if (!el || !document.contains(el)) continue;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      const top = scrollY + rect.top;
      const left = scrollX + rect.left;

      boxEl.style.top = `${top - 2}px`;
      boxEl.style.left = `${left - 2}px`;
      boxEl.style.width = `${Math.max(16, rect.width + 4)}px`;
      boxEl.style.height = `${Math.max(16, rect.height + 4)}px`;

      if (badgeEl) {
        badgeEl.style.top = `${Math.max(0, top - 20)}px`;
        badgeEl.style.left = `${Math.max(0, left)}px`;
      }
    }
  }

  function showInteractiveTooltip(el, issue) {
    removeTooltip();

    const color = SEVERITY_COLORS[issue.severity] || "#dc2626";
    const tooltip = document.createElement("div");
    tooltip.className = "lantern-interactive-tooltip";
    tooltip.innerHTML = `
      <div class="lantern-tooltip-header" style="background: ${color}">
        <span class="lantern-badge-tag">${issue.severity.toUpperCase()}</span>
        <span class="lantern-rule-name">${escapeHtml(issue.rule_id)}</span>
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

    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const rect = el.getBoundingClientRect();
    const tooltipHeight = 180;
    const tooltipWidth = 330;

    let top = scrollY + rect.bottom + 8;
    if (rect.bottom + tooltipHeight > window.innerHeight && rect.top > tooltipHeight) {
      top = scrollY + rect.top - tooltipHeight - 8;
    }

    let left = scrollX + rect.left;
    if (rect.left + tooltipWidth > window.innerWidth) {
      left = Math.max(10, scrollX + window.innerWidth - tooltipWidth - 20);
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
    const root = getOrCreateOverlayRoot();

    for (const issue of issues) {
      const targetEl = findElementDeep(issue.element_id, issue.selector);
      if (!targetEl || targetEl === document.documentElement || targetEl === document.body) {
        continue;
      }

      const rect = targetEl.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset || 0;
      const scrollY = window.scrollY || window.pageYOffset || 0;

      // 1. Create Floating Viewport-Accurate Overlay Box
      const box = document.createElement("div");
      box.className = `lantern-overlay-box lantern-overlay-${issue.severity}`;
      box.setAttribute("data-lantern-overlay-id", issue.element_id || "");
      box.style.top = `${scrollY + rect.top - 2}px`;
      box.style.left = `${scrollX + rect.left - 2}px`;
      box.style.width = `${Math.max(16, rect.width + 4)}px`;
      box.style.height = `${Math.max(16, rect.height + 4)}px`;

      // 2. Create Severity Badge Pin on top of the box
      const badge = document.createElement("button");
      badge.className = `lantern-injected-badge lantern-bg-${issue.severity}`;
      badge.textContent = `${issue.severity.slice(0, 4).toUpperCase()} · ${issue.rule_id}`;
      badge.style.top = `${Math.max(0, scrollY + rect.top - 20)}px`;
      badge.style.left = `${Math.max(0, scrollX + rect.left)}px`;

      badge.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showInteractiveTooltip(targetEl, issue);
      });

      root.appendChild(box);
      root.appendChild(badge);

      trackedItems.push({
        el: targetEl,
        issue,
        boxEl: box,
        badgeEl: badge,
      });
    }
  }

  function focusAndScrollToIssue(elementId) {
    const targetEl = findElementDeep(elementId, null);
    if (!targetEl) return false;

    // Smooth scroll directly to center of viewport
    targetEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

    // Update overlay bounding rects during and after scroll
    setTimeout(updateOverlayPositions, 100);
    setTimeout(updateOverlayPositions, 350);

    // Apply pulse glow effect on the floating overlay box
    const match = trackedItems.find((item) => item.issue.element_id === elementId);
    if (match && match.boxEl) {
      match.boxEl.classList.remove("lantern-overlay-pulse");
      void match.boxEl.offsetWidth; // trigger reflow
      match.boxEl.classList.add("lantern-overlay-pulse");
    }

    if (match) {
      setTimeout(() => {
        showInteractiveTooltip(targetEl, match.issue);
      }, 400);
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

  // Keep overlay boxes aligned on scroll and resize
  window.addEventListener("scroll", updateOverlayPositions, { passive: true });
  window.addEventListener("resize", updateOverlayPositions, { passive: true });
})();
