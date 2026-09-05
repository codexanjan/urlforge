from datetime import datetime
from fastapi import APIRouter, Depends, Request, Response, BackgroundTasks, status
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, AsyncSessionLocal
from app.models.url import URL
from app.analytics.collector import record_click_event
from app.middleware.rate_limit import get_client_ip

router = APIRouter(tags=["Redirect"])

ERROR_PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — URLForge</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg: #090d16;
            --card: #111827;
            --border: #1f293d;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --accent: #6366f1;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            background: var(--bg);
            color: var(--text-primary);
            font-family: 'Inter', -apple-system, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
        }}
        .card {{
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 16px;
            max-width: 480px;
            width: 100%;
            padding: 2.5rem;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }}
        .badge {{
            display: inline-block;
            padding: 0.35rem 0.85rem;
            border-radius: 9999px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 1.25rem;
            background: rgba(99, 102, 241, 0.15);
            color: #818cf8;
            border: 1px solid rgba(99, 102, 241, 0.3);
        }}
        h1 {{ font-size: 1.6rem; font-weight: 700; margin-bottom: 0.75rem; letter-spacing: -0.02em; }}
        p {{ color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.75rem; }}
        .btn {{
            display: inline-block;
            background: var(--accent);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.9rem;
            transition: opacity 0.15s;
        }}
        .btn:hover {{ opacity: 0.9; }}
        .footer {{ margin-top: 2rem; font-size: 0.8rem; color: #64748b; }}
    </style>
</head>
<body>
    <div class="card">
        <div class="badge">{badge}</div>
        <h1>{heading}</h1>
        <p>{message}</p>
        <a href="/" class="btn">Create Your Own Short Link</a>
        <div class="footer">URLForge — Short links. Smart analytics. Total control.</div>
    </div>
</body>
</html>
"""

async def background_record_click(
    url_id: str,
    ip_address: str,
    user_agent: str,
    referrer: str,
    country: str,
    region: str,
    city: str,
):
    """Executes in background task to not slow down redirect"""
    try:
        async with AsyncSessionLocal() as session:
            await record_click_event(
                db=session,
                url_id=url_id,
                ip_address=ip_address,
                user_agent_str=user_agent,
                raw_referrer=referrer,
                country=country,
                region=region,
                city=city,
            )
    except Exception:
        pass

@router.get("/{short_code}")
async def redirect_to_destination(
    short_code: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    clean_code = short_code.strip()

    stmt = select(URL).where(
        or_(
            URL.short_code == clean_code,
            URL.custom_alias == clean_code,
        )
    )
    res = await db.execute(stmt)
    url = res.scalar_one_or_none()

    # 1. Not found
    if not url:
        accepts_html = "text/html" in request.headers.get("accept", "")
        if accepts_html:
            return HTMLResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content=ERROR_PAGE_TEMPLATE.format(
                    title="404 Not Found",
                    badge="404 Not Found",
                    heading="Short link not found",
                    message="The requested link does not exist or may have been permanently removed.",
                ),
            )
        return Response(
            status_code=status.HTTP_404_NOT_FOUND,
            content='{"error":{"code":"NOT_FOUND","message":"Short link not found."}}',
            media_type="application/json",
        )

    # 2. Disabled
    if not url.is_active:
        accepts_html = "text/html" in request.headers.get("accept", "")
        if accepts_html:
            return HTMLResponse(
                status_code=status.HTTP_410_GONE,
                content=ERROR_PAGE_TEMPLATE.format(
                    title="Link Disabled",
                    badge="Inactive",
                    heading="This link is currently disabled",
                    message="The creator has temporarily or permanently paused access to this destination.",
                ),
            )
        return Response(
            status_code=status.HTTP_410_GONE,
            content='{"error":{"code":"LINK_DISABLED","message":"This link is currently disabled."}}',
            media_type="application/json",
        )

    # 3. Expired
    if url.expires_at and url.expires_at <= datetime.utcnow():
        accepts_html = "text/html" in request.headers.get("accept", "")
        if accepts_html:
            return HTMLResponse(
                status_code=status.HTTP_410_GONE,
                content=ERROR_PAGE_TEMPLATE.format(
                    title="Link Expired",
                    badge="Expired",
                    heading="This link has expired",
                    message="The expiration date for this short link has passed.",
                ),
            )
        return Response(
            status_code=status.HTTP_410_GONE,
            content='{"error":{"code":"LINK_EXPIRED","message":"This link has expired."}}',
            media_type="application/json",
        )

    # Extract client metadata for click event
    ip_addr = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "")
    referrer = request.headers.get("referer", "")
    country = request.headers.get("cf-ipcountry") or request.headers.get("x-country-code")
    region = request.headers.get("x-geo-region")
    city = request.headers.get("x-geo-city")

    # In tests or normal runs, record click
    # Track directly via current session to ensure test visibility if background task uses different engine
    await record_click_event(
        db=db,
        url_id=url.id,
        ip_address=ip_addr,
        user_agent_str=user_agent,
        raw_referrer=referrer,
        country=country,
        region=region,
        city=city,
    )

    # Perform 302 redirect
    return RedirectResponse(url=url.original_url, status_code=status.HTTP_302_FOUND)
