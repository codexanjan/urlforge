from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import select, func, or_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole
from app.models.url import URL
from app.schemas.url import (
    URLCreate,
    URLUpdate,
    URLResponse,
    URLListResponse,
)
from app.security.deps import get_current_user, get_optional_user
from app.utils.base62 import generate_short_code
from app.utils.validators import validate_and_normalize_url, validate_custom_alias
from app.middleware.rate_limit import check_rate_limit
from app.services.qr_service import generate_qr_png, generate_qr_svg

router = APIRouter(prefix="/api/v1/urls", tags=["URLs"])

def format_url_response(url: URL) -> URLResponse:
    code = url.custom_alias or url.short_code
    full_short_url = f"{settings.SHORT_DOMAIN}/{code}"
    return URLResponse(
        id=url.id,
        user_id=url.user_id,
        original_url=url.original_url,
        short_code=url.short_code,
        custom_alias=url.custom_alias,
        short_url=full_short_url,
        title=url.title,
        description=url.description,
        is_active=url.is_active,
        expires_at=url.expires_at,
        click_count=url.click_count,
        created_at=url.created_at,
        updated_at=url.updated_at,
    )

@router.post("", response_model=URLResponse, status_code=status.HTTP_201_CREATED)
async def create_url(
    request: Request,
    payload: URLCreate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    # Rate limit based on auth status
    limit = settings.RATE_LIMIT_AUTHENTICATED if current_user else settings.RATE_LIMIT_ANONYMOUS
    prefix = f"url:create:{current_user.id}" if current_user else "url:create:anon"
    await check_rate_limit(request, prefix, limit)

    # Validate destination URL
    is_valid_url, normalized_url, url_err = validate_and_normalize_url(payload.original_url)
    if not is_valid_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_URL", "message": url_err}},
        )

    # Validate expiration date
    if payload.expires_at and payload.expires_at <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_EXPIRATION", "message": "Expiration date must be in the future."}},
        )

    # Custom alias handling
    custom_alias_clean = None
    if payload.custom_alias:
        custom_alias_clean = payload.custom_alias.strip()
        is_valid_alias, alias_err = validate_custom_alias(custom_alias_clean)
        if not is_valid_alias:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": {"code": "INVALID_ALIAS", "message": alias_err}},
            )

        # Check uniqueness in DB (both short_code and custom_alias)
        collision = await db.execute(
            select(URL.id).where(
                or_(
                    URL.custom_alias == custom_alias_clean,
                    URL.short_code == custom_alias_clean,
                )
            )
        )
        if collision.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"error": {"code": "ALIAS_TAKEN", "message": "This alias is already taken."}},
            )

    # Collision-resistant short code generation
    short_code = None
    for _ in range(5):
        candidate = generate_short_code()
        code_check = await db.execute(
            select(URL.id).where(
                or_(
                    URL.short_code == candidate,
                    URL.custom_alias == candidate,
                )
            )
        )
        if not code_check.scalar_one_or_none():
            short_code = candidate
            break

    if not short_code:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "CODE_GEN_FAILED", "message": "Could not generate unique short code. Try again."}},
        )

    new_url = URL(
        user_id=current_user.id if current_user else None,
        original_url=normalized_url,
        short_code=short_code,
        custom_alias=custom_alias_clean,
        title=payload.title,
        description=payload.description,
        expires_at=payload.expires_at,
        is_active=True,
    )
    db.add(new_url)
    await db.commit()
    await db.refresh(new_url)

    return format_url_response(new_url)

@router.get("", response_model=URLListResponse)
async def list_urls(
    search: Optional[str] = None,
    filter_status: str = Query("all", pattern="^(all|active|disabled|expired)$"),
    sort: str = Query("newest", pattern="^(newest|oldest|clicks_desc|clicks_asc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.utcnow()
    query = select(URL).where(URL.user_id == current_user.id)

    # Search filter
    if search:
        search_term = f"%{search.strip()}%"
        query = query.where(
            or_(
                URL.short_code.ilike(search_term),
                URL.custom_alias.ilike(search_term),
                URL.original_url.ilike(search_term),
                URL.title.ilike(search_term),
            )
        )

    # Status filter
    if filter_status == "active":
        query = query.where(URL.is_active == True, or_(URL.expires_at.is_(None), URL.expires_at > now))
    elif filter_status == "disabled":
        query = query.where(URL.is_active == False)
    elif filter_status == "expired":
        query = query.where(URL.expires_at.is_not(None), URL.expires_at <= now)

    # Sorting
    if sort == "newest":
        query = query.order_by(desc(URL.created_at))
    elif sort == "oldest":
        query = query.order_by(asc(URL.created_at))
    elif sort == "clicks_desc":
        query = query.order_by(desc(URL.click_count))
    elif sort == "clicks_asc":
        query = query.order_by(asc(URL.click_count))

    # Total count
    count_stmt = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    items_stmt = query.offset(offset).limit(page_size)
    items_res = await db.execute(items_stmt)
    urls = items_res.scalars().all()

    total_pages = max(1, (total + page_size - 1) // page_size)

    return URLListResponse(
        items=[format_url_response(u) for u in urls],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )

@router.get("/{url_id}", response_model=URLResponse)
async def get_url(
    url_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
            detail={"error": {"code": "FORBIDDEN", "message": "You do not have access to this link."}},
        )

    return format_url_response(url)

@router.patch("/{url_id}", response_model=URLResponse)
async def update_url(
    url_id: str,
    payload: URLUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
            detail={"error": {"code": "FORBIDDEN", "message": "You do not have access to this link."}},
        )

    if payload.original_url is not None:
        is_valid, norm_url, err = validate_and_normalize_url(payload.original_url)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": {"code": "INVALID_URL", "message": err}},
            )
        url.original_url = norm_url

    if payload.title is not None:
        url.title = payload.title
    if payload.description is not None:
        url.description = payload.description
    if payload.is_active is not None:
        url.is_active = payload.is_active
    if payload.expires_at is not None:
        url.expires_at = payload.expires_at

    url.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(url)

    return format_url_response(url)

@router.delete("/{url_id}", status_code=status.HTTP_200_OK)
async def delete_url(
    url_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
            detail={"error": {"code": "FORBIDDEN", "message": "You do not have permission to delete this link."}},
        )

    await db.delete(url)
    await db.commit()

    return {"message": "Short link deleted successfully."}

@router.get("/{url_id}/qr")
async def get_url_qr(
    url_id: str,
    format: str = Query("svg", pattern="^(svg|png)$"),
    size: int = Query(10, ge=4, le=40),
    border: int = Query(4, ge=1, le=10),
    error_correction: str = Query("M", pattern="^(L|M|Q|H)$"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(URL).where(URL.id == url_id))
    url = result.scalar_one_or_none()
    if not url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "Short link not found."}},
        )

    code = url.custom_alias or url.short_code
    short_url = f"{settings.SHORT_DOMAIN}/{code}"

    if format == "png":
        png_bytes = generate_qr_png(
            short_url,
            box_size=size,
            border=border,
            error_correction=error_correction,
        )
        return Response(content=png_bytes, media_type="image/png")
    else:
        svg_content = generate_qr_svg(
            short_url,
            box_size=size,
            border=border,
            error_correction=error_correction,
        )
        return Response(content=svg_content, media_type="image/svg+xml")
