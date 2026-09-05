from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db, check_db_health
from app.models.user import User
from app.models.url import URL
from app.models.click import Click
from app.models.report import AbuseReport, ReportStatus
from app.schemas.auth import UserResponse
from app.security.deps import require_admin

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

class AdminStatsResponse(BaseModel):
    total_users: int
    total_urls: int
    active_urls: int
    total_clicks: int
    pending_reports: int
    system_health: str

class URLStatusUpdate(BaseModel):
    is_active: bool

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    users_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    urls_count = (await db.execute(select(func.count(URL.id)))).scalar() or 0
    active_urls = (await db.execute(select(func.count(URL.id)).where(URL.is_active == True))).scalar() or 0
    clicks_count = (await db.execute(select(func.count(Click.id)))).scalar() or 0
    pending_reports = (
        await db.execute(select(func.count(AbuseReport.id)).where(AbuseReport.status == ReportStatus.PENDING))
    ).scalar() or 0

    db_healthy = await check_db_health()

    return AdminStatsResponse(
        total_users=users_count,
        total_urls=urls_count,
        active_urls=active_urls,
        total_clicks=clicks_count,
        pending_reports=pending_reports,
        system_health="Operational" if db_healthy else "Degraded",
    )

@router.get("/users")
async def list_admin_users(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).order_by(User.created_at.desc()).limit(100)
    result = await db.execute(stmt)
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "last_login_at": u.last_login_at,
        }
        for u in users
    ]

@router.patch("/urls/{url_id}/status")
async def set_url_active_status(
    url_id: str,
    payload: URLStatusUpdate,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(URL).where(URL.id == url_id))
    url = result.scalar_one_or_none()
    if not url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "URL not found."}},
        )

    url.is_active = payload.is_active
    await db.commit()

    return {"message": f"URL status updated to {'active' if payload.is_active else 'disabled'}."}
