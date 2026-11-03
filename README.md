# AccessLens — Website Accessibility Auditing Platform

> **Make the Web Accessible to Everyone.**  
> *College Hackathon 2026 | WEB-04 | Laptop 2 Platform*

AccessLens is an automated web accessibility diagnostic suite designed for developers. It scans live websites, raw HTML fragments, and uploaded documents for missing alt text, heading hierarchy skips, unlabelled form controls, and low colour contrast—then explains each fix in plain language with copyable remediation code.

---

## 1. Quick Start Commands

### Frontend (Laptop 2)
```powershell
cd frontend
npm install
npm run dev
```
> **Note on Windows PowerShell**: If your terminal encounters `npm.ps1 cannot be loaded because running scripts is disabled`, run `npm.cmd run dev` or set execution policy `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

### Teammate Backend (Laptop 1)
```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 2. Root Cause Analysis: Blank Page Resolution

During the initial load, the browser rendered an unhandled runtime error during React's mount cycle:
* **The Root Cause**: `src/utils/localScanner.js` called `new URL(url).hostname` when calculating domain metrics. When initialized with local filenames such as `'broken-bakery.html'` or `'fixed-bakery.html'` in `BeforeAfterRescan.jsx`, the JavaScript standard `URL` constructor threw an uncaught `TypeError: Invalid URL: broken-bakery.html`. Because React catches unhandled render exceptions by unmounting the entire component tree, the browser presented a blank page.
* **The Fix**: Replaced naive URL parsing with safe domain extraction (`safeHostname` with `try / catch` fallback) across all local scanner routines. Added `base: './'` to `vite.config.js` to ensure reliable asset resolution.

---

## 3. UI/UX Architecture: Light Space Aesthetic

Inspired by product-focused developer tools like MagicPod, the interface delivers:
* **Clean White & Soft Off-White Canvas**: Primarily `#ffffff` and `#f8fafc` with slate borders (`border-slate-200`) and high-contrast typography (`#0f172a`, `#1e293b`) meeting WCAG AAA readability.
* **Minimalist Space Theme**: Fine orbital trajectory arcs (`strokeDasharray`), subtle celestial coordinates (`RA 18h 36m • Dec +38° 47′`), and micro-stardust field.
* **Authentic Logo Asset**: Renders the exact Lantern logo asset (`/lantern-logo.png`) preserving true proportions, high transparency, and crisp layout without black borders.

---

## 4. Feature Set

### A. Tri-Vector Audit Ingestion
1. **Website URL Scanner**: Validates HTTP/HTTPS syntax and transmits live requests to the backend crawler.
2. **Raw HTML Paste Editor**: Resizable monospace editor with line/character counts, "Clear" button, and "Load Sample HTML (Broken Bakery)" one-click helper. (Untrusted input is never executed in DOM).
3. **HTML File Upload**: Drag-and-drop or file picker accepting `.html` and `.htm` files up to 5MB with metadata preview.

### B. Full Backend Integration & Honest Demo Mode
* **Live FastAPI Integration**: Connects to `http://localhost:8000`:
  * `GET /health` — Real-time connection status badge in navigation bar.
  * `POST /api/scan/url` — Real website audit via FastAPI crawler.
  * `POST /api/scan/html` — Raw HTML audit via BeautifulSoup4 / Playwright.
  * `POST /api/scan/file` — Multipart document upload scan.
  * `POST /api/export/csv` — CSV report stream download.
* **Honest Fallback**: If the FastAPI server is offline on localhost:8000, the UI provides clear restart instructions and an explicitly labeled **`[Explore in In-Browser DEMO MODE]`** action (never faking mock results as real server scans).

### C. Results Dashboard with Actionable Remediation
* **Score & Letter Grade**: Health score (0–100) and grade (A–F) matching backend formulas.
* **Severity Counters**: Critical (Blocks users), Serious (Major barrier), Moderate (Hurts usability).
* **Developer Fix Snippets**: Concrete corrected HTML with a one-click **"Copy Fix"** button and direct link to official W3C WCAG success criteria documentation.
* **Search & Filters**: Instant filtering by search keyword and category (Images, Headings, Forms, Contrast).
* **Export Engine**: One-click **Export CSV**, **Export JSON**, and **Print / PDF Report**.

### D. Before & After Rescan Comparison
* An interactive comparison showing the flawed test page (`test-pages/broken-bakery.html`) with 7 violations dropping to **0 violations (-100% reduction)** after applying Lantern fixes.

### E. Manual Testing Guide
* Complete 9-point interactive checklist:
  1. Keyboard-Only Navigation
  2. Visible Focus Indicators
  3. Logical Heading Structure
  4. Form Labels & Error Messages
  5. Image Alternative Text
  6. Colour Contrast & Legibility
  7. Screen-Reader Considerations
  8. Zoom & Responsive Layout (200%)
  9. Meaningful Links & Buttons
* Prominent disclaimer that automated scans find only ~30–40% of barriers and manual verification is mandatory.
