/**
 * Lantern – Background Service Worker
 *
 * Orchestrates communication between Popup UI, Content Auditor, and Backend.
 *
 * Designed to audit ANY public, intranet, or local website:
 * - Direct execution via chrome.scripting ensures 100% reliability even on existing tabs
 * - Traverses live rendered DOM including Shadow DOM
 * - Computes real contrast and filters out skeletons and hidden templates
 * - Syncs report to FastAPI backend for reporting and CSV/PDF export
 */

const API_BASE = "http://localhost:8000";

// ── Listen for messages from popup ──────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "scan-page") {
    handleScanPage(message.tabId)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // asynchronous response
  }

  if (
    message.action === "focus-issue" ||
    message.action === "toggle-highlights" ||
    message.action === "clear-highlights"
  ) {
    chrome.tabs.sendMessage(message.tabId, message, (resp) => {
      sendResponse(resp || { success: true });
    });
    return true;
  }
});

/**
 * Audit active tab using in-browser DOM auditor
 */
async function handleScanPage(tabId) {
  const tab = await chrome.tabs.get(tabId);
  const url = tab.url || "";

  if (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:")
  ) {
    throw new Error("Cannot audit internal browser pages. Please open any web page (http://, https://, or file://).");
  }

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
  const [{ result: report }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => (window.lanternRunAudit ? window.lanternRunAudit() : null),
  });

  if (!report) {
    throw new Error("Audit engine failed to initialize on this webpage.");
  }

  // 4. Trigger in-page visual highlights
  chrome.tabs.sendMessage(tabId, {
    action: "highlight-issues",
    issues: report.issues,
  }).catch(() => {});

  // 5. Best-effort async sync to FastAPI backend (if running)
  trySyncBackend(report).catch(() => {});

  return report;
}

async function trySyncBackend(report) {
  try {
    await fetch(`${API_BASE}/api/scan/audit-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
  } catch (e) {
    // Backend offline is normal in extension standalone mode
  }
}
