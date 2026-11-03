"""
Lantern – FastAPI Application Entry Point

This is the central server that receives HTML (raw code, file upload, or URL)
from both the React frontend and the Chrome extension, runs the accessibility
scanners, and returns a standardized JSON report.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import scan, health, export

app = FastAPI(
    title="Lantern – Accessibility Checker API",
    description="Scan web pages for common accessibility issues and get actionable fixes.",
    version="0.1.0",
)

# --- CORS -----------------------------------------------------------
# Allow requests from the React dev server AND the Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # React dev server
        "http://localhost:5173",      # Vite dev server
        "chrome-extension://*",       # Chrome extension
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---------------------------------------------------------
app.include_router(health.router, tags=["Health"])
app.include_router(scan.router, prefix="/api/scan", tags=["Scan"])
app.include_router(export.router, prefix="/api/export", tags=["Export"])
