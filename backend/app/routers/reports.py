from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.report import AbuseReport, ReportStatus
from app.schemas.report import ReportCreate, ReportResponse, ReportUpdate
from app.security.deps import require_admin
from app.analytics.collector import hash_ip
from app.middleware.rate_limit import get_client_ip

router = APIRouter(prefix="/api/v1/reports", tags=["Abuse Reports"])

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def submit_abuse_report(
    request: Request,
    payload: ReportCreate,
    db: AsyncSession = Depends(get_db),
):
    ip_addr = get_client_ip(request)
    report = AbuseReport(
        short_url=payload.short_url.strip(),
        reason=payload.reason,
        description=payload.description,
        reporter_ip_hash=hash_ip(ip_addr),
        status=ReportStatus.PENDING,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    return report

@router.get("", response_model=List[ReportResponse])
async def list_abuse_reports(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AbuseReport).order_by(desc(AbuseReport.created_at)).limit(100)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.patch("/{report_id}", response_model=ReportResponse)
async def update_abuse_report(
    report_id: str,
    payload: ReportUpdate,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AbuseReport).where(AbuseReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "REPORT_NOT_FOUND", "message": "Report not found."}},
        )

    report.status = payload.status
    await db.commit()
    await db.refresh(report)
    return report
