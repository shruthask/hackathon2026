/**
 * Lantern – Popup Controller
 *
 * Manages Start Scan Screen with Privacy Consent, Interactive Filters,
 * In-Page Inspector Navigation, and CSV Report Export.
 */

let currentReport = null;
let activeTabId = null;
let currentHostname = "current page";
let currentCategory = "all";
let activeSeverities = new Set(["critical", "serious", "moderate", "minor"]);
let searchKeyword = "";
let areHighlightsVisible = true;

// DOM Elements
const initialStateEl = document.getElementById("initial-state");
const loadingStateEl = document.getElementById("loading-state");
const loadingStepMsgEl = document.getElementById("loading-step-msg");
const resultsDashboardEl = document.getElementById("results-dashboard");

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

// ── Initialization ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    activeTabId = tab.id;
    try {
      const urlObj = new URL(tab.url || "");
      currentHostname = urlObj.hostname || "local page";
    } catch (e) {
      currentHostname = "local page";
    }
  }

  siteBadgeEl.textContent = currentHostname;
  welcomeSiteNameEl.textContent = currentHostname;

  // Privacy agreement controls Start Scan button state
  privacyCheckbox.addEventListener("change", () => {
    startScanBtn.disabled = !privacyCheckbox.checked;
  });

  // Start & Rescan buttons
  startScanBtn.addEventListener("click", () => {
    if (privacyCheckbox.checked) {
      triggerScan();
    }
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
    toggleHighlightsBtn.textContent = areHighlightsVisible ? "👁️ Outlines" : "🚫 Hidden";

    if (activeTabId) {
      chrome.runtime.sendMessage({
        action: "toggle-highlights",
        tabId: activeTabId,
        visible: areHighlightsVisible,
      });
    }
  });

  // Export CSV
  exportCsvBtn.addEventListener("click", exportResultsToCSV);
});

// ── Trigger Scan with Step Feedback ─────────────────────────────────
async function triggerScan() {
  if (!activeTabId) return;

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

  chrome.runtime.sendMessage(
    { action: "scan-page", tabId: activeTabId },
    (response) => {
      clearInterval(stepInterval);
      loadingStateEl.classList.add("hidden");

      if (!response || !response.success) {
        initialStateEl.classList.remove("hidden");
        const msg = response?.error || "Could not complete scan.";
        alert(`Audit Error: ${msg}`);
        return;
      }

      currentReport = response.data;
      renderDashboard(currentReport);

      // Reveal header navigation buttons
      rescanBtn.classList.remove("hidden");
      resetViewBtn.classList.remove("hidden");
    }
  );
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
  auditDurationEl.textContent = `⚡ ${report.duration_ms || 24}ms`;

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
            ? `<button class="inspect-btn" data-element-id="${escapeHtml(issue.element_id)}">
                🎯 Inspect
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
          ${issue.wcag_criteria ? `<div class="wcag-ref">📌 WCAG: ${escapeHtml(issue.wcag_criteria)}</div>` : ""}
        </div>
      </details>
    `;

    // Bind Inspect Button to scroll directly to the DOM element
    const inspectBtn = li.querySelector(".inspect-btn");
    if (inspectBtn) {
      inspectBtn.addEventListener("click", () => {
        const elId = inspectBtn.getAttribute("data-element-id");
        if (elId && activeTabId) {
          chrome.runtime.sendMessage({
            action: "focus-issue",
            tabId: activeTabId,
            elementId: elId,
          });
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
