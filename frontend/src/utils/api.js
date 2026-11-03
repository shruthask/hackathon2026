/**
 * Lantern Backend API Client
 * Connects the React Frontend to the FastAPI backend (Laptop 1 & 4)
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

/**
 * Perform a fetch request with fallbacks (Direct API -> Vite Proxy)
 */
async function apiRequest(endpoint, options = {}) {
  // Try direct backend URL first, fallback to relative proxy if blocked
  const urlsToTry = [
    `${API_BASE}${endpoint}`,
    endpoint // relative (via vite proxy)
  ];

  let lastError = null;

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorJson = await response.json();
          errorDetail = errorJson.detail || errorDetail;
        } catch {
          // not json
        }
        throw new Error(errorDetail);
      }
      return response;
    } catch (err) {
      lastError = err;
      // If direct failed with network error, try next url
    }
  }

  throw lastError;
}

/**
 * Check backend health status
 */
export async function checkBackendHealth() {
  try {
    const res = await apiRequest('/health', { method: 'GET' });
    const data = await res.json();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Scan raw HTML string
 */
export async function scanHtml(html) {
  const res = await apiRequest('/api/scan/html', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ html }),
  });
  return res.json();
}

/**
 * Scan a website URL (backend fetches and scans)
 */
export async function scanUrl(url) {
  const res = await apiRequest('/api/scan/url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
  return res.json();
}

/**
 * Scan an uploaded HTML file
 */
export async function scanFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiRequest('/api/scan/file', {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

/**
 * Download report as CSV
 */
export async function downloadCsvReport(report) {
  try {
    const res = await apiRequest('/api/export/csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    });
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `lantern-accessibility-report-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  } catch (err) {
    console.error('CSV export failed on backend, generating client-side CSV fallback:', err);
    // Client-side CSV fallback
    const headers = ['rule_id', 'severity', 'category', 'element', 'message', 'how_to_fix', 'wcag_criteria'];
    const rows = (report.issues || []).map(i => [
      `"${(i.rule_id || '').replace(/"/g, '""')}"`,
      `"${(i.severity || '').replace(/"/g, '""')}"`,
      `"${(i.category || 'general').replace(/"/g, '""')}"`,
      `"${(i.element || '').replace(/"/g, '""')}"`,
      `"${(i.message || '').replace(/"/g, '""')}"`,
      `"${(i.how_to_fix || '').replace(/"/g, '""')}"`,
      `"${(i.wcag_criteria || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `lantern-accessibility-report-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  }
}

/**
 * Fetch the latest audit report synced by the Chrome extension
 */
export async function fetchLatestAudit() {
  const res = await apiRequest('/api/scan/latest', { method: 'GET' });
  const data = await res.json();
  return data;
}

/**
 * Sync audit report to backend (used by extension or simulator)
 */
export async function syncAuditReport(report) {
  const res = await apiRequest('/api/scan/audit-sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(report),
  });
  return res.json();
}
