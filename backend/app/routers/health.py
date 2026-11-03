"""
Router: Health check

GET /health — returns {"status": "ok"} for uptime monitoring.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok"}
