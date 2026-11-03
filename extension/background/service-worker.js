/**
 * Lantern – Background Service Worker
 *
 * Orchestrates communication between the Popup UI, Content Auditor,
 * and the optional FastAPI backend.
 *
 * Designed to audit ANY public, intranet, or local website:
 * - Dynamic injection ensures content scripts run even on pre-existing tabs
 * - Runs live in-browser DOM audits for 100% computed accuracy
 * - Gracefully attempts backend sync for export and team reporting
 */

const API_BASE = "http://localhost:8000";

// ── Handle incoming messages ────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "scan-page") {
    handleScanPage(message.tabId)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // asynchronous response
  }

  if (message.action === "focus-issue" || message.action === "toggle-highlights" || message.action === "clear-highlights") {
    chrome.tabs.sendMessage(message.tabId, message, (resp) => {
      sendResponse(resp || { success: true });
    });
    return true;
  }
});

/**
 * Ensures content scripts are injected before messaging
 */
async function ensureScriptsInjected(tabId) {
  try {
    // Ping to see if auditor is already listening
    const ping = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: "run-dom-audit" }, (res) => {
        if (chrome.runtime.lastError || !res) {
          resolve(false);
        } else {
          resolve(res);
        }
      });
    });

    if (ping && ping.success) {
      return ping.data;
    }
  } catch (e) {
    // fall through to injection
  }

  // Inject CSS
  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ["styles/highlight.css"],
  }).catch(() => {});

  // Inject Scripts in order
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content/auditor.js", "content/highlighter.js"],
  });

  return null;
}

/**
 * Run the scan on the given tab
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

  // 1. Ensure scripts are injected and get report
  let report = await ensureScriptsInjected(tabId);

  if (!report) {
    // Scripts were freshly injected, run audit now
    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { action: "run-dom-audit" }, (resp) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!resp || !resp.success) {
          reject(new Error(resp?.error || "Audit failed"));
        } else {
          resolve(resp.data);
        }
      });
    });
    report = response;
  }

  // 2. Trigger in-page highlighting
  chrome.tabs.sendMessage(tabId, {
    action: "highlight-issues",
    issues: report.issues,
  });

  // 3. Best-effort async sync to FastAPI backend (if running)
  trySyncBackend(report).catch(() => {});

  return report;
}

async function trySyncBackend(report) {
  try {
    const res = await fetch(`${API_BASE}/api/scan/audit-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    if (res.ok) {
      console.log("[Lantern SW] Report synced to backend successfully.");
    }
  } catch (e) {
    // Backend offline is normal in extension standalone mode
  }
}
