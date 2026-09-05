from datetime import datetime
from typing import Optional
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.models.api_key import ApiKey
from app.security.tokens import decode_access_token
from app.security.api_keys import hash_api_key

security_bearer = HTTPBearer(auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
    api_key: Optional[str] = Security(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> User:
    # 1. Try Bearer token
    if auth and auth.credentials:
        payload = decode_access_token(auth.credentials)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": {"code": "INVALID_TOKEN", "message": "Invalid or expired access token."}},
                headers={"WWW-Authenticate": "Bearer"},
            )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": {"code": "INVALID_TOKEN", "message": "Malformed token payload."}},
            )
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": {"code": "USER_INACTIVE", "message": "User account not found or inactive."}},
            )
        return user

    # 2. Try API key
    if api_key:
        hashed = hash_api_key(api_key)
        result = await db.execute(
            select(ApiKey).where(ApiKey.key_hash == hashed, ApiKey.revoked_at.is_(None))
        )
        api_key_record = result.scalar_one_or_none()
        if not api_key_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": {"code": "INVALID_API_KEY", "message": "Invalid or revoked API key."}},
            )
        # Update last used timestamp
        api_key_record.last_used_at = datetime.utcnow()
        await db.commit()

        result = await db.execute(select(User).where(User.id == api_key_record.user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": {"code": "USER_INACTIVE", "message": "User account not found or inactive."}},
            )
        return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"error": {"code": "AUTH_REQUIRED", "message": "Authentication required."}},
        headers={"WWW-Authenticate": "Bearer"},
    )

async def get_optional_user(
    auth: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
    api_key: Optional[str] = Security(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    if (auth and auth.credentials) or api_key:
        try:
            return await get_current_user(auth=auth, api_key=api_key, db=db)
        except HTTPException:
            return None
    return None

async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "FORBIDDEN", "message": "Administrator access required."}},
        )
    return current_user
