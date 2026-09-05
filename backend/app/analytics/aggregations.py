from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import select, func, distinct, case, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.click import Click
from app.models.url import URL
from app.schemas.analytics import (
    AnalyticsOverview,
    TimelinePoint,
    BreakdownItem,
    URLAnalyticsResponse,
)

async def get_url_analytics(
    db: AsyncSession,
    url: URL,
    days: int = 30,
) -> URLAnalyticsResponse:
    now = datetime.utcnow()
    start_of_today = datetime(now.year, now.month, now.day)
    start_of_week = now - timedelta(days=7)
    start_of_month = now - timedelta(days=30)
    filter_start = now - timedelta(days=days) if days > 0 else None

    # Base query for url_id
    url_clicks_filter = [Click.url_id == url.id]
    if filter_start:
        url_clicks_filter.append(Click.timestamp >= filter_start)

    # 1. Overview counts
    total_clicks = url.click_count

    # Unique visitors
    unique_stmt = select(func.count(distinct(Click.ip_hash))).where(Click.url_id == url.id)
    unique_res = await db.execute(unique_stmt)
    unique_visitors = unique_res.scalar() or 0

    # Today
    today_stmt = select(func.count(Click.id)).where(Click.url_id == url.id, Click.timestamp >= start_of_today)
    today_res = await db.execute(today_stmt)
    clicks_today = today_res.scalar() or 0

    # Week
    week_stmt = select(func.count(Click.id)).where(Click.url_id == url.id, Click.timestamp >= start_of_week)
    week_res = await db.execute(week_stmt)
    clicks_this_week = week_res.scalar() or 0

    # Month
    month_stmt = select(func.count(Click.id)).where(Click.url_id == url.id, Click.timestamp >= start_of_month)
    month_res = await db.execute(month_stmt)
    clicks_this_month = month_res.scalar() or 0

    # Bot vs Human
    bot_stmt = select(
        func.count(case((Click.is_bot == True, 1))),
        func.count(case((Click.is_bot == False, 1))),
    ).where(Click.url_id == url.id)
    bot_res = await db.execute(bot_stmt)
    bot_row = bot_res.first()
    bot_clicks = bot_row[0] if bot_row else 0
    human_clicks = bot_row[1] if bot_row else 0

    overview = AnalyticsOverview(
        total_clicks=total_clicks,
        unique_visitors=unique_visitors,
        clicks_today=clicks_today,
        clicks_this_week=clicks_this_week,
        clicks_this_month=clicks_this_month,
        human_clicks=human_clicks,
        bot_clicks=bot_clicks,
    )

    # 2. Timeline Aggregation
    # In SQLite & Postgres, func.date(Click.timestamp) yields 'YYYY-MM-DD'
    timeline_stmt = (
        select(
            func.date(Click.timestamp).label("click_date"),
            func.count(Click.id).label("total"),
            func.count(distinct(Click.ip_hash)).label("uniques"),
            func.count(case((Click.is_bot == True, 1))).label("bots"),
        )
        .where(*url_clicks_filter)
        .group_by(func.date(Click.timestamp))
        .order_by(func.date(Click.timestamp).asc())
    )
    timeline_res = await db.execute(timeline_stmt)
    timeline: List[TimelinePoint] = [
        TimelinePoint(
            date=str(row.click_date),
            clicks=row.total or 0,
            unique_visitors=row.uniques or 0,
            bot_clicks=row.bots or 0,
        )
        for row in timeline_res.all()
    ]

    # If timeline is empty, provide a point for today
    if not timeline:
        timeline = [
            TimelinePoint(
                date=now.strftime("%Y-%m-%d"),
                clicks=0,
                unique_visitors=0,
                bot_clicks=0,
            )
        ]

    # Helper for category breakdown
    async def get_breakdown(column) -> List[BreakdownItem]:
        stmt = (
            select(
                func.coalesce(column, "Unknown").label("label"),
                func.count(Click.id).label("count"),
            )
            .where(*url_clicks_filter)
            .group_by(column)
            .order_by(desc("count"))
            .limit(10)
        )
        res = await db.execute(stmt)
        rows = res.all()
        subtotal = sum(r.count for r in rows) or 1
        return [
            BreakdownItem(
                name=str(r.label),
                count=r.count,
                percentage=round((r.count / subtotal) * 100, 1),
            )
            for r in rows
        ]

    devices = await get_breakdown(Click.device_type)
    browsers = await get_breakdown(Click.browser)
    operating_systems = await get_breakdown(Click.operating_system)
    referrers = await get_breakdown(Click.referrer)
    countries = await get_breakdown(Click.country)

    short_url = f"{url.short_code}"

    return URLAnalyticsResponse(
        url_id=url.id,
        short_url=short_url,
        original_url=url.original_url,
        overview=overview,
        timeline=timeline,
        devices=devices,
        browsers=browsers,
        operating_systems=operating_systems,
        referrers=referrers,
        countries=countries,
    )
