/**
 * Lantern – Popup Controller
 *
 * Manages Start Scan Screen with Persistent Privacy Consent,
 * Direct Script Execution (no port timeout drops), In-Page
 * Inspector Navigation, and CSV Report Export.
 */

let currentReport = null;
let activeTabId = null;
let currentHostname = "current page";
let currentCategory = "all";
let activeSeverities = new Set(["critical", "serious", "moderate", "minor"]);
let searchKeyword = "";
let areHighlightsVisible = true;

// ── DOM Elements ────────────────────────────────────────────────────
const initialStateEl = document.getElementById("initial-state");
const loadingStateEl = document.getElementById("loading-state");
const loadingStepMsgEl = document.getElementById("loading-step-msg");
const resultsDashboardEl = document.getElementById("results-dashboard");

const errorBannerEl = document.getElementById("error-banner");
const errorBannerTextEl = document.getElementById("error-banner-text");

const siteBadgeEl = document.getElementById("site-badge");
const welcomeSiteNameEl = document.getElementById("welcome-site-name");
const privacyCheckbox = document.getElementById("privacy-consent-checkbox");
const startScanBtn = document.getElementById("start-scan-btn");
const rescanBtn = document.getElementById("rescan-btn");
const resetViewBtn = document.getElementById("reset-view-btn");

const toggleHighlightsBtn = document.getElementById("toggle-highlights-btn");
const exportCsvBtn = document.getElementById("export-csv-btn");
const searchInput = document.getElementById("search-input");

const scoreValEl = document.getElementById("score-val");
const scoreGradeEl = document.getElementById("score-grade");
const scoreTitleEl = document.getElementById("score-title");
const statsSummaryEl = document.getElementById("stats-summary");
const auditDurationEl = document.getElementById("audit-duration");

const countCriticalEl = document.getElementById("count-critical");
const countSeriousEl = document.getElementById("count-serious");
const countModerateEl = document.getElementById("count-moderate");
const countMinorEl = document.getElementById("count-minor");

const issueListEl = document.getElementById("issue-list");
const emptyFilterMsgEl = document.getElementById("empty-filter-msg");

// ── Resilient Active Tab Finder ─────────────────────────────────────
async function getActiveWebTab() {
  // Query 1: Current browser window active tab
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs.find((t) => t && t.id && !t.url?.startsWith("chrome-extension://"));
    if (tab) return tab;
  } catch (e) {}

  // Query 2: Last focused window active tab
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs.find((t) => t && t.id && !t.url?.startsWith("chrome-extension://"));
    if (tab) return tab;
  } catch (e) {}

  // Query 3: Any active web tab
  try {
    const tabs = await chrome.tabs.query({ active: true });
    const tab = tabs.find((t) => t && t.id && !t.url?.startsWith("chrome-extension://"));
    if (tab) return tab;
  } catch (e) {}

  return null;
}

function showError(msg) {
  loadingStateEl.classList.add("hidden");
  initialStateEl.classList.remove("hidden");
  if (errorBannerEl && errorBannerTextEl) {
    errorBannerTextEl.textContent = msg;
    errorBannerEl.classList.remove("hidden");
  }
}

function hideError() {
  if (errorBannerEl) {
    errorBannerEl.classList.add("hidden");
  }
}

// ── Initialization ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const tab = await getActiveWebTab();
  if (tab) {
    activeTabId = tab.id;
    try {
      const urlObj = new URL(tab.url || "");
      currentHostname = urlObj.hostname || "local page";
    } catch (e) {
      currentHostname = "local page";
    }

    const url = tab.url || "";
    if (
      url.startsWith("chrome://") ||
      url.startsWith("edge://") ||
      url.startsWith("about:")
    ) {
      showError("Cannot audit internal browser pages. Please open a website (like YouTube, Wikipedia, or your own site) and reopen Lantern.");
      startScanBtn.disabled = true;
    } else if (url.startsWith("file://") && chrome.extension && chrome.extension.isAllowedFileSchemeAccess) {
      chrome.extension.isAllowedFileSchemeAccess((isAllowed) => {
        if (!isAllowed) {
          showError("Local file detected: To audit local files, please go to chrome://extensions -> Lantern 'Details', and enable 'Allow access to file URLs'.");
        }
      });
    }
  }

  siteBadgeEl.textContent = currentHostname;
  welcomeSiteNameEl.textContent = currentHostname;

  const privacyCardEl = document.getElementById("privacy-card");
  const privacyAgreedBadgeEl = document.getElementById("privacy-agreed-badge");

  // Check persistent privacy agreement in chrome.storage.local
  chrome.storage.local.get(["lantern_privacy_agreed"], (result) => {
    if (result && result.lantern_privacy_agreed) {
      if (privacyCardEl) privacyCardEl.classList.add("hidden");
      if (privacyAgreedBadgeEl) privacyAgreedBadgeEl.classList.remove("hidden");
      startScanBtn.disabled = false;
    }
  });

  // Privacy agreement controls Start Scan button state
  if (privacyCheckbox) {
    privacyCheckbox.addEventListener("change", () => {
      startScanBtn.disabled = !privacyCheckbox.checked;
    });
  }

  // Start Scan button click
  startScanBtn.addEventListener("click", () => {
    hideError();
    // Remember consent permanently
    chrome.storage.local.set({ lantern_privacy_agreed: true });
    triggerScan();
  });

  rescanBtn.addEventListener("click", triggerScan);

  // Return to Start Screen / Privacy Settings
  resetViewBtn.addEventListener("click", () => {
    resultsDashboardEl.classList.add("hidden");
    loadingStateEl.classList.add("hidden");
    initialStateEl.classList.remove("hidden");
    rescanBtn.classList.add("hidden");
    resetViewBtn.classList.add("hidden");
  });

  // Severity Pills click
  document.querySelectorAll(".sev-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const sev = pill.getAttribute("data-filter");
      if (activeSeverities.has(sev)) {
        if (activeSeverities.size > 1) {
          activeSeverities.delete(sev);
          pill.classList.remove("active");
        }
      } else {
        activeSeverities.add(sev);
        pill.classList.add("active");
      }
      renderFilteredIssues();
    });
  });

  // Category Tabs click
  document.querySelectorAll(".cat-tab").forEach((tabBtn) => {
    tabBtn.addEventListener("click", () => {
      document.querySelectorAll(".cat-tab").forEach((b) => b.classList.remove("active"));
      tabBtn.classList.add("active");
      currentCategory = tabBtn.getAttribute("data-cat");
      renderFilteredIssues();
    });
  });

  // Search input
  searchInput.addEventListener("input", (e) => {
    searchKeyword = e.target.value.trim().toLowerCase();
    renderFilteredIssues();
  });

  // Toggle Highlights on page
  toggleHighlightsBtn.addEventListener("click", () => {
    areHighlightsVisible = !areHighlightsVisible;
    toggleHighlightsBtn.classList.toggle("active", areHighlightsVisible);
    const labelSpan = toggleHighlightsBtn.querySelector(".btn-label");
    if (labelSpan) {
      labelSpan.textContent = areHighlightsVisible ? "Outlines" : "Hidden";
    }

    if (activeTabId) {
      toggleHighlightsDirect(activeTabId, areHighlightsVisible);
    }
  });

  // Export CSV
  exportCsvBtn.addEventListener("click", exportResultsToCSV);
});

// ── Direct Execution Core (Eliminates Port Disconnection Errors) ─────
async function runAuditDirect(tabId) {
  // 1. Inject highlight styles
  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ["styles/highlight.css"],
  }).catch(() => {});

  // 2. Inject auditor and highlighter scripts
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content/auditor.js", "content/highlighter.js"],
  });

  // 3. Execute audit directly in the page context
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      if (typeof window.lanternRunAudit === "function") {
        return window.lanternRunAudit();
      }
      return null;
    },
  });

  const report = results?.[0]?.result;
  if (!report) {
    throw new Error("Audit engine did not return results. The page may have blocked script execution or is still loading.");
  }

  // 4. Apply in-page highlights
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (issues) => {
      if (typeof window.lanternApplyHighlights === "function") {
        window.lanternApplyHighlights(issues);
      }
    },
    args: [report.issues || []],
  }).catch(() => {});

  // 5. Best-effort async sync to FastAPI backend (if running)
  fetch("http://localhost:8000/api/scan/audit-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  }).catch(() => {});

  return report;
}

async function focusIssueDirect(tabId, elementId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (elId) => {
        if (typeof window.lanternFocusIssue === "function") {
          return window.lanternFocusIssue(elId);
        }
        return false;
      },
      args: [elementId],
    });
  } catch (e) {
    chrome.runtime.sendMessage({ action: "focus-issue", tabId, elementId }, () => {
      if (chrome.runtime.lastError) {}
    });
  }
}

async function toggleHighlightsDirect(tabId, visible) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (vis) => {
        if (typeof window.lanternToggleHighlights === "function") {
          window.lanternToggleHighlights(vis);
        }
      },
      args: [visible],
    });
  } catch (e) {
    chrome.runtime.sendMessage({ action: "toggle-highlights", tabId, visible }, () => {
      if (chrome.runtime.lastError) {}
    });
  }
}

// ── Trigger Scan with Step Feedback ─────────────────────────────────
async function triggerScan() {
  hideError();

  // Ensure active tab is resolved
  const tab = await getActiveWebTab();
  if (!tab || !tab.id) {
    showError("No active web page detected. Please open any webpage (http://, https://, or file://) and try again.");
    return;
  }
  activeTabId = tab.id;

  const url = tab.url || "";
  if (
    url.startsWith("chrome://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:")
  ) {
    showError("Cannot audit internal browser pages. Please open any web page (e.g. YouTube, Wikipedia, or your own site).");
    return;
  }

  initialStateEl.classList.add("hidden");
  resultsDashboardEl.classList.add("hidden");
  loadingStateEl.classList.remove("hidden");

  // Animate loading step messages
  let step = 0;
  const steps = [
    "Traversing live DOM nodes and shadow roots…",
    "Computing relative luminance & color contrast…",
    "Checking form labels and interactive controls…",
    "Verifying heading hierarchy and image alt tags…",
  ];
  const stepInterval = setInterval(() => {
    step = (step + 1) % steps.length;
    if (loadingStepMsgEl) {
      loadingStepMsgEl.textContent = steps[step];
    }
  }, 450);

  try {
    const report = await runAuditDirect(activeTabId);
    clearInterval(stepInterval);
    loadingStateEl.classList.add("hidden");
    currentReport = report;
    renderDashboard(currentReport);

    // Reveal header navigation buttons
    rescanBtn.classList.remove("hidden");
    resetViewBtn.classList.remove("hidden");
  } catch (err) {
    clearInterval(stepInterval);
    console.error("Direct audit error:", err);
    // Fall back to service worker if direct scripting encountered an edge case
    chrome.runtime.sendMessage(
      { action: "scan-page", tabId: activeTabId },
      (response) => {
        if (chrome.runtime.lastError || !response?.success) {
          const msg = response?.error || err.message || "Could not complete scan on this webpage.";
          showError(msg);
          return;
        }
        loadingStateEl.classList.add("hidden");
        currentReport = response.data;
        renderDashboard(currentReport);
        rescanBtn.classList.remove("hidden");
        resetViewBtn.classList.remove("hidden");
      }
    );
  }
}

// ── Render Dashboard ────────────────────────────────────────────────
function renderDashboard(report) {
  resultsDashboardEl.classList.remove("hidden");

  // 1. Scorecard Hero
  const score = report.score ?? 100;
  const grade = report.grade ?? "A";
  scoreValEl.textContent = score;
  scoreGradeEl.textContent = grade;
  scoreGradeEl.className = `grade-badge grade-${grade.toLowerCase()}`;

  if (score >= 90) scoreTitleEl.textContent = "Excellent Accessibility";
  else if (score >= 80) scoreTitleEl.textContent = "Good Accessibility";
  else if (score >= 70) scoreTitleEl.textContent = "Needs Attention";
  else scoreTitleEl.textContent = "Significant Accessibility Barriers";

  statsSummaryEl.textContent = `Found ${report.total_issues} issue(s) on ${report.hostname || currentHostname}`;
  const durationTextEl = document.getElementById("audit-duration-text");
  if (durationTextEl) {
    durationTextEl.textContent = `${report.duration_ms || 24}ms`;
  } else if (auditDurationEl) {
    auditDurationEl.textContent = `${report.duration_ms || 24}ms`;
  }

  // 2. Counters
  countCriticalEl.textContent = report.summary?.critical || 0;
  countSeriousEl.textContent = report.summary?.serious || 0;
  countModerateEl.textContent = report.summary?.moderate || 0;
  countMinorEl.textContent = report.summary?.minor || 0;

  // 3. Render issues
  renderFilteredIssues();
}

// ── Filter and Display Issues ───────────────────────────────────────
function renderFilteredIssues() {
  if (!currentReport) return;

  const filtered = currentReport.issues.filter((issue) => {
    // Severity filter
    if (!activeSeverities.has(issue.severity)) return false;

    // Category filter
    if (currentCategory !== "all") {
      const issueCat = (issue.category || "general").toLowerCase();
      if (issueCat !== currentCategory) return false;
    }

    // Search keyword
    if (searchKeyword) {
      const haystack = `${issue.rule_id} ${issue.message} ${issue.element} ${issue.how_to_fix}`.toLowerCase();
      if (!haystack.includes(searchKeyword)) return false;
    }

    return true;
  });

  issueListEl.innerHTML = "";

  if (filtered.length === 0) {
    emptyFilterMsgEl.classList.remove("hidden");
  } else {
    emptyFilterMsgEl.classList.add("hidden");
  }

  for (const issue of filtered) {
    const li = document.createElement("li");
    li.className = `issue-card ${issue.severity}`;

    li.innerHTML = `
      <div class="card-top">
        <span class="card-tag ${issue.severity}">${issue.severity}</span>
        <span class="rule-id">${escapeHtml(issue.rule_id)}</span>
        ${
          issue.element_id
            ? `<button class="inspect-btn" data-element-id="${escapeHtml(issue.element_id)}" title="Scroll & Inspect Element">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>
                <span>Inspect</span>
               </button>`
            : ""
        }
      </div>
      <p class="card-msg">${escapeHtml(issue.message)}</p>
      <code class="code-snippet">${escapeHtml(issue.element)}</code>
      <details class="card-details">
        <summary>How to fix</summary>
        <div class="card-fix-content">
          ${escapeHtml(issue.how_to_fix)}
          ${issue.wcag_criteria ? `<div class="wcag-ref">WCAG: ${escapeHtml(issue.wcag_criteria)}</div>` : ""}
        </div>
      </details>
    `;

    // Bind Inspect Button to scroll directly to the DOM element
    const inspectBtn = li.querySelector(".inspect-btn");
    if (inspectBtn) {
      inspectBtn.addEventListener("click", () => {
        const elId = inspectBtn.getAttribute("data-element-id");
        if (elId && activeTabId) {
          focusIssueDirect(activeTabId, elId);
        }
      });
    }

    issueListEl.appendChild(li);
  }
}

// ── Export Results to CSV ───────────────────────────────────────────
function exportResultsToCSV() {
  if (!currentReport || !currentReport.issues.length) {
    alert("No issues to export!");
    return;
  }

  const headers = ["rule_id", "category", "severity", "element", "message", "how_to_fix", "wcag_criteria"];
  const rows = currentReport.issues.map((i) => [
    `"${(i.rule_id || "").replace(/"/g, '""')}"`,
    `"${(i.category || "general").replace(/"/g, '""')}"`,
    `"${(i.severity || "").replace(/"/g, '""')}"`,
    `"${(i.element || "").replace(/"/g, '""')}"`,
    `"${(i.message || "").replace(/"/g, '""')}"`,
    `"${(i.how_to_fix || "").replace(/"/g, '""')}"`,
    `"${(i.wcag_criteria || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  const host = currentReport.hostname || currentHostname || "page";
  a.download = `lantern-audit-${host}-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
