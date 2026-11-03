/**
 * Lantern – Background Service Worker
 *
 * Orchestrates communication between Popup UI, Content Auditor, and Backend.
 *
 * Designed to audit ANY public, intranet, or local website:
 * - Direct execution via chrome.scripting ensures 100% reliability without
 *   "Receiving end does not exist" port connection errors
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

  if (message.action === "focus-issue") {
    chrome.scripting
      .executeScript({
        target: { tabId: message.tabId },
        func: (elId) => {
          if (window.lanternFocusIssue) {
            return window.lanternFocusIssue(elId);
          }
          return false;
        },
        args: [message.elementId],
      })
      .then(([res]) => {
        sendResponse({ success: res?.result ?? true });
      })
      .catch((err) => {
        // Fallback message with safe error suppression
        chrome.tabs.sendMessage(message.tabId, message, (resp) => {
          if (chrome.runtime.lastError) {
            const _ignored = chrome.runtime.lastError.message;
          }
          sendResponse(resp || { success: false });
        });
      });
    return true;
  }

  if (message.action === "toggle-highlights") {
    chrome.scripting
      .executeScript({
        target: { tabId: message.tabId },
        func: (visible) => {
          if (window.lanternToggleHighlights) {
            window.lanternToggleHighlights(visible);
          }
        },
        args: [message.visible],
      })
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((err) => {
        chrome.tabs.sendMessage(message.tabId, message, (resp) => {
          if (chrome.runtime.lastError) {
            const _ignored = chrome.runtime.lastError.message;
          }
          sendResponse(resp || { success: true });
        });
      });
    return true;
  }

  if (message.action === "clear-highlights") {
    chrome.scripting
      .executeScript({
        target: { tabId: message.tabId },
        func: () => {
          if (window.lanternClearHighlights) {
            window.lanternClearHighlights();
          }
        },
      })
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(() => {
        sendResponse({ success: true });
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

  // 4. Trigger in-page visual highlights directly
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (issues) => {
      if (window.lanternApplyHighlights) {
        window.lanternApplyHighlights(issues);
      }
    },
    args: [report.issues],
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
