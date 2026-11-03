# Lantern – Website Accessibility Checker

> WEB-04 | Hackathon 2026

Scan a web page for common accessibility issues and explain how to fix them.

## Quick Start

### Backend (Laptop 1)
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

### Test Page (Laptop 4)
Open `test-pages/broken-bakery.html` in any browser.

## API Endpoints

| Method | Path              | Description                |
|--------|-------------------|----------------------------|
| GET    | `/health`         | Health check               |
| POST   | `/api/scan/html`  | Scan raw HTML              |
| POST   | `/api/scan/url`   | Fetch & scan a URL         |
| POST   | `/api/scan/file`  | Scan an uploaded HTML file |
| POST   | `/api/export/csv` | Download report as CSV     |
| POST   | `/api/export/pdf` | *(stub – Laptop 4)*       |
