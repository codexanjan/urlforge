from fastapi import APIRouter
from app.database import check_db_health

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    db_ok = await check_db_health()
    status_str = "ok" if db_ok else "degraded"
    return {
        "status": status_str,
        "database": "ok" if db_ok else "error",
        "service": "URLForge API",
    }
