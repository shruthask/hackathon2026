/**
 * Lantern – Popup Controller
 *
 * Manages scan triggering, interactive filters, search, score dial,
 * in-page inspector scrolling, and CSV export.
 */

let currentReport = null;
let activeTabId = null;
let currentCategory = "all";
let activeSeverities = new Set(["critical", "serious", "moderate", "minor"]);
let searchKeyword = "";
let areHighlightsVisible = true;

// DOM Elements
const initialStateEl = document.getElementById("initial-state");
const loadingStateEl = document.getElementById("loading-state");
const resultsDashboardEl = document.getElementById("results-dashboard");
const siteBadgeEl = document.getElementById("site-badge");

const startScanBtn = document.getElementById("start-scan-btn");
const rescanBtn = document.getElementById("rescan-btn");
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
      siteBadgeEl.textContent = urlObj.hostname || "local page";
      siteBadgeEl.classList.remove("hidden");
    } catch (e) {
      siteBadgeEl.classList.add("hidden");
    }
  }

  // Bind Listeners
  startScanBtn.addEventListener("click", triggerScan);
  rescanBtn.addEventListener("click", triggerScan);

  // Auto-scan on popup open for instant feedback
  triggerScan();

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

// ── Trigger Scan ────────────────────────────────────────────────────
async function triggerScan() {
  if (!activeTabId) return;

  initialStateEl.classList.add("hidden");
  resultsDashboardEl.classList.add("hidden");
  loadingStateEl.classList.remove("hidden");

  chrome.runtime.sendMessage(
    { action: "scan-page", tabId: activeTabId },
    (response) => {
      loadingStateEl.classList.add("hidden");

      if (!response || !response.success) {
        initialStateEl.classList.remove("hidden");
        const msg = response?.error || "Could not complete scan.";
        initialStateEl.querySelector("p").textContent = `⚠️ Error: ${msg}`;
        return;
      }

      currentReport = response.data;
      renderDashboard(currentReport);
    }
  );
}

// ── Render Dashboard ────────────────────────────────────────────────
function renderDashboard(report) {
  resultsDashboardEl.classList.remove("hidden");

  // 1. Scorecard
  const score = report.score ?? 100;
  const grade = report.grade ?? "A";
  scoreValEl.textContent = score;
  scoreGradeEl.textContent = grade;
  scoreGradeEl.className = `grade-badge grade-${grade.toLowerCase()}`;

  if (score >= 90) scoreTitleEl.textContent = "Excellent Accessibility";
  else if (score >= 80) scoreTitleEl.textContent = "Good Accessibility";
  else if (score >= 70) scoreTitleEl.textContent = "Needs Attention";
  else scoreTitleEl.textContent = "Significant Accessibility Barriers";

  statsSummaryEl.textContent = `Found ${report.total_issues} issue(s) on ${report.hostname || "this page"}`;
  auditDurationEl.textContent = `⚡ ${report.duration_ms || 18}ms`;

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

    // Bind Inspect Button
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
  const host = currentReport.hostname || "page";
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
