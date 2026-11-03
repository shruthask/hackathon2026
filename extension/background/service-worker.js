/**
 * Lantern – Background Service Worker
 *
 * Orchestrates communication between the popup UI, the content script,
 * and the FastAPI backend.
 *
 * Flow:
 *   1. Popup sends "scan-page" message.
 *   2. Service worker injects a script to grab the page's HTML.
 *   3. HTML is POST-ed to the backend /api/scan/html endpoint.
 *   4. Results are forwarded to the content script for highlighting
 *      AND back to the popup for the summary panel.
 */

const API_BASE = "http://localhost:8000";

// ── Listen for messages from popup ──────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "scan-page") {
    handleScanPage(message.tabId)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // keep the message channel open for async response
  }
});

async function handleScanPage(tabId) {
  // 1. Grab the page's outer HTML via scripting API
  const [{ result: html }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => document.documentElement.outerHTML,
  });

  // 2. Send to backend
  const response = await fetch(`${API_BASE}/api/scan/html`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html }),
  });

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  const data = await response.json();

  // 3. Forward results to content script for highlighting
  chrome.tabs.sendMessage(tabId, {
    action: "highlight-issues",
    issues: data.issues,
  });

  return data;
}
