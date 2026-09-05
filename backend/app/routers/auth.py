from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole
from app.models.refresh_token import RefreshToken
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    Token,
    TokenRefresh,
    UserResponse,
)
from app.security.passwords import hash_password, verify_password
from app.security.tokens import (
    create_access_token,
    generate_refresh_token,
    hash_token,
)
from app.middleware.rate_limit import check_rate_limit

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    payload: UserRegister,
    db: AsyncSession = Depends(get_db),
):
    await check_rate_limit(request, "auth:register", settings.RATE_LIMIT_REGISTER)

    # Check duplicate email
    existing = await db.execute(select(User).where(User.email == payload.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": {"code": "EMAIL_EXISTS", "message": "An account with this email already exists."}},
        )

    # Check if this is the first user; make them ADMIN if configured
    is_admin = False
    count_users = await db.execute(select(User.id).limit(1))
    if count_users.first() is None or payload.email.lower() == settings.ADMIN_EMAIL.lower():
        is_admin = True

    new_user = User(
        name=payload.name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=UserRole.ADMIN if is_admin else UserRole.USER,
        is_active=True,
        is_verified=True,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    payload: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    await check_rate_limit(request, "auth:login", settings.RATE_LIMIT_LOGIN)

    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "INVALID_CREDENTIALS", "message": "Incorrect email or password."}},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "ACCOUNT_DISABLED", "message": "This account is disabled."}},
        )

    # Update last login
    user.last_login_at = datetime.utcnow()

    # Issue access token
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role.value}
    )

    # Issue refresh token
    raw_refresh = generate_refresh_token()
    refresh_hash = hash_token(raw_refresh)
    refresh_days = 30 if payload.remember_me else settings.REFRESH_TOKEN_EXPIRE_DAYS
    refresh_expires = datetime.utcnow() + timedelta(days=refresh_days)

    refresh_record = RefreshToken(
        user_id=user.id,
        token_hash=refresh_hash,
        expires_at=refresh_expires,
    )
    db.add(refresh_record)
    await db.commit()

    return Token(
        access_token=access_token,
        refresh_token=raw_refresh,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

@router.post("/refresh", response_model=Token)
async def refresh_tokens(
    payload: TokenRefresh,
    db: AsyncSession = Depends(get_db),
):
    refresh_hash = hash_token(payload.refresh_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == refresh_hash,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.utcnow(),
        )
    )
    old_token = result.scalar_one_or_none()

    if not old_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "INVALID_REFRESH_TOKEN", "message": "Invalid or expired refresh token."}},
        )

    # Revoke old refresh token (rotation)
    old_token.revoked_at = datetime.utcnow()

    # Lookup user
    user_res = await db.execute(select(User).where(User.id == old_token.user_id))
    user = user_res.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "USER_INACTIVE", "message": "User inactive or deleted."}},
        )

    # Issue new token pair
    new_access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role.value}
    )
    new_raw_refresh = generate_refresh_token()
    new_refresh_hash = hash_token(new_raw_refresh)
    new_refresh = RefreshToken(
        user_id=user.id,
        token_hash=new_refresh_hash,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_refresh)
    await db.commit()

    return Token(
        access_token=new_access_token,
        refresh_token=new_raw_refresh,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

@router.post("/logout")
async def logout(
    payload: TokenRefresh,
    db: AsyncSession = Depends(get_db),
):
    refresh_hash = hash_token(payload.refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == refresh_hash)
    )
    token_record = result.scalar_one_or_none()
    if token_record and not token_record.revoked_at:
        token_record.revoked_at = datetime.utcnow()
        await db.commit()

    return {"message": "Logged out successfully."}
