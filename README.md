# AccessLens / Lantern — Website Accessibility Auditing Platform

> **Make the Web Accessible to Everyone.**  
> *College Hackathon 2026 | WEB-04*

Lantern / AccessLens is an automated web accessibility diagnostic suite designed for developers. It scans live websites, raw HTML fragments, and uploaded documents for missing alt text, heading hierarchy skips, unlabelled form controls, and low colour contrast—then explains each fix in plain language with copyable remediation code.

---

## 1. Quick Start Commands

### Frontend Platform (Laptop 2)
```bash
cd frontend
npm install
npm run dev
# The website will be live at http://localhost:5173
```
> **Note on Windows PowerShell**: If your terminal encounters `npm.ps1 cannot be loaded because running scripts is disabled`, run `npm.cmd run dev` or set execution policy `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.

### Core Backend & API (Laptop 1)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Chrome Extension (Laptop 3)
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `extension/` folder
4. Make sure the backend is running on `localhost:8000`

### Test Pages (Laptop 4)
Open `test-pages/broken-bakery.html` or other test files in any browser, or use the built-in quick test buttons directly in the frontend dashboard.

---

## 2. UI/UX Architecture: Light Space Aesthetic

* **Clean White & Soft Canvas**: Primarily `#ffffff` and `#f8fafc` with slate borders (`border-slate-200`) and high-contrast typography meeting WCAG AAA readability.
* **Authentic Logo Asset**: Renders the exact Lantern logo asset preserving true proportions and crisp layout.

---

## 3. Feature Set

### A. Tri-Vector Audit Ingestion
1. **Website URL Scanner**: Validates HTTP/HTTPS syntax and transmits live requests to the backend crawler.
2. **Raw HTML Paste Editor**: Resizable editor with line/character counts and sample test loaders.
3. **HTML File Upload**: Drag-and-drop or file picker accepting `.html` and `.htm` files up to 5MB.

### B. Full Backend Integration & Honest Demo Mode
* **Live FastAPI Integration**: Connects to `http://localhost:8000`:
  * `GET /health` — Real-time connection status badge.
  * `POST /api/scan/url` — Real website audit via FastAPI crawler.
  * `POST /api/scan/html` — Raw HTML audit via BeautifulSoup4 / Playwright.
  * `POST /api/scan/file` — Multipart document upload scan.
  * `POST /api/export/csv` — CSV report stream download.
  * `POST /api/scan/audit-sync` — Chrome extension sync endpoint.

### C. Results Dashboard with Actionable Remediation
* **Score & Letter Grade**: Health score (0–100) and grade (A–F) matching backend formulas.
* **Severity Counters**: Critical (Blocks users), Serious (Major barrier), Moderate (Hurts usability).
* **Developer Fix Snippets**: Concrete corrected HTML with a one-click **"Copy Fix"** button and direct link to official W3C WCAG success criteria documentation.
* **Search & Filters**: Instant filtering by search keyword and category (Images, Headings, Forms, Contrast).
* **Export Engine**: One-click **Export CSV**, **Export JSON**, and **Print / PDF Report**.

### D. Before & After Rescan Comparison
* An interactive comparison showing flawed test pages with violations dropping after applying fixes.

### E. Manual Testing Guide
* Complete interactive checklist covering keyboard-only navigation, screen reader checks, zoom tests, and color contrast.
