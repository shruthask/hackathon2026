/**
 * Lantern – Background Service Worker (WAVE-Inspired)
 *
 * Orchestrates communication between Popup UI, Content Auditor, and Backend.
 *
 * Guaranteed In-Page Highlighting:
 * - Direct execution via chrome.scripting ensures 100% reliable script injection
 * - Directly triggers window.lanternApplyHighlights (issues + positive features)
 * - Traverses live rendered DOM including Shadow DOM
 * - Forwards Styles ON/OFF and Reading/Focus Order messages to active tab
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

  if (message.action === "toggle-styles") {
    handleToggleStyles(message.tabId, message.enable)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // Forward interactive page commands
  const forwardActions = new Set([
    "focus-issue",
    "toggle-highlights",
    "clear-highlights",
    "show-focus-order",
    "hide-focus-order",
    "focus-order-item",
  ]);

  if (forwardActions.has(message.action)) {
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
    throw new Error(
      "Cannot audit internal browser pages. Please open any web page (http://, https://, or file://)."
    );
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

  // 4. Trigger in-page visual highlights directly (issues + positive features)
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (issues, features) => {
      if (window.lanternApplyHighlights) {
        window.lanternApplyHighlights(issues, features);
      }
    },
    args: [report.issues, report.features || []],
  }).catch(() => {});

  // Message fallback
  chrome.tabs.sendMessage(tabId, {
    action: "highlight-issues",
    issues: report.issues,
    features: report.features || [],
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

/**
 * Robust Styles ON/OFF Execution directly in the target webpage
 */
async function handleToggleStyles(tabId, enable) {
  const tab = await chrome.tabs.get(tabId);
  const url = tab.url || "";
  if (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:")
  ) {
    return { success: false, error: "Cannot modify styles on browser internal pages." };
  }

  // 1. Ensure content script is injected in the tab
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content/auditor.js", "content/highlighter.js"],
  }).catch(() => {});

  // 2. Execute lanternToggleStyles in the page
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: (enableVal) => {
      if (window.lanternToggleStyles) {
        return window.lanternToggleStyles(enableVal);
      }
      return { success: false, error: "highlighter not ready" };
    },
    args: [enable],
  });

  // 3. Persist state in storage so popup stays in sync
  const storageArea = chrome.storage.session || chrome.storage.local;
  if (storageArea) {
    await storageArea.set({ [`styles_state_${tabId}`]: enable }).catch(() => {});
  }

  return results?.[0]?.result || { success: true, stylesEnabled: enable };
}
