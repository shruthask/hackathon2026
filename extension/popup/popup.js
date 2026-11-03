/**
 * Popup script – wired to the "Scan This Page" button.
 *
 * Sends a message to the service worker, then renders results
 * inside the popup panel.
 */

const scanBtn = document.getElementById("scan-btn");
const statusEl = document.getElementById("status");
const summaryEl = document.getElementById("summary");
const issueList = document.getElementById("issue-list");
const disclaimerEl = document.getElementById("disclaimer");

scanBtn.addEventListener("click", async () => {
  // Reset UI
  statusEl.textContent = "Scanning…";
  statusEl.className = "info";
  summaryEl.classList.add("hidden");
  issueList.innerHTML = "";
  disclaimerEl.classList.add("hidden");

  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Ask the service worker to scan
  chrome.runtime.sendMessage(
    { action: "scan-page", tabId: tab.id },
    (response) => {
      if (!response || !response.success) {
        statusEl.textContent = `Error: ${response?.error || "Unknown"}`;
        statusEl.className = "error";
        return;
      }

      const data = response.data;

      // Status
      if (data.total_issues === 0) {
        statusEl.textContent = "✅ No issues found!";
        statusEl.className = "success";
      } else {
        statusEl.textContent = `Found ${data.total_issues} issue(s)`;
        statusEl.className = "warning";
      }

      // Summary pills
      document.getElementById("count-critical").textContent = data.summary.critical || 0;
      document.getElementById("count-serious").textContent = data.summary.serious || 0;
      document.getElementById("count-moderate").textContent = data.summary.moderate || 0;
      document.getElementById("count-minor").textContent = data.summary.minor || 0;
      summaryEl.classList.remove("hidden");

      // Issue list
      for (const issue of data.issues) {
        const li = document.createElement("li");
        li.className = `issue ${issue.severity}`;
        li.innerHTML = `
          <strong>${issue.rule_id}</strong>
          <span class="severity-badge ${issue.severity}">${issue.severity}</span>
          <p>${issue.message}</p>
          <details>
            <summary>How to fix</summary>
            <p>${issue.how_to_fix}</p>
            <code>${escapeHtml(issue.element)}</code>
          </details>
        `;
        issueList.appendChild(li);
      }

      // Disclaimer
      disclaimerEl.classList.remove("hidden");
    }
  );
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
