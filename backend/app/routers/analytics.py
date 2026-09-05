import csv
import io
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.models.url import URL
from app.models.click import Click
from app.schemas.analytics import URLAnalyticsResponse
from app.schemas.click import ClickResponse
from app.security.deps import get_current_user
from app.analytics.aggregations import get_url_analytics

router = APIRouter(prefix="/api/v1/urls/{url_id}", tags=["Analytics"])

async def check_url_access(url_id: str, current_user: User, db: AsyncSession) -> URL:
    result = await db.execute(select(URL).where(URL.id == url_id))
    url = result.scalar_one_or_none()
    if not url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "Short link not found."}},
        )
    if url.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "FORBIDDEN", "message": "Access to this link analytics is denied."}},
        )
    return url

@router.get("/analytics", response_model=URLAnalyticsResponse)
async def get_analytics(
    url_id: str,
    days: int = Query(30, ge=0, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    url = await check_url_access(url_id, current_user, db)
    return await get_url_analytics(db=db, url=url, days=days)

@router.get("/clicks", response_model=List[ClickResponse])
async def get_clicks(
    url_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    url = await check_url_access(url_id, current_user, db)

    offset = (page - 1) * page_size
    stmt = (
        select(Click)
        .where(Click.url_id == url.id)
        .order_by(desc(Click.timestamp))
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    clicks = result.scalars().all()
    return clicks

@router.get("/export")
async def export_analytics(
    url_id: str,
    format: str = Query("csv", pattern="^(csv|json)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    url = await check_url_access(url_id, current_user, db)

    stmt = select(Click).where(Click.url_id == url.id).order_by(desc(Click.timestamp))
    res = await db.execute(stmt)
    clicks = res.scalars().all()

    if format == "json":
        data = [
            {
                "timestamp": c.timestamp.isoformat(),
                "device_type": c.device_type,
                "browser": c.browser,
                "operating_system": c.operating_system,
                "referrer": c.referrer,
                "country": c.country,
                "region": c.region,
                "city": c.city,
                "is_bot": c.is_bot,
            }
            for c in clicks
        ]
        return Response(
            content=json.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=clicks_{url.short_code}.json"},
        )
    else:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Timestamp",
            "Device",
            "Browser",
            "Operating System",
            "Referrer",
            "Country",
            "Region",
            "City",
            "Is Bot",
        ])
        for c in clicks:
            writer.writerow([
                c.timestamp.isoformat(),
                c.device_type or "Unknown",
                c.browser or "Unknown",
                c.operating_system or "Unknown",
                c.referrer or "Direct",
                c.country or "Unknown",
                c.region or "Unknown",
                c.city or "Unknown",
                "Yes" if c.is_bot else "No",
            ])
        csv_bytes = output.getvalue().encode("utf-8")
        return Response(
            content=csv_bytes,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=clicks_{url.short_code}.csv"},
        )
