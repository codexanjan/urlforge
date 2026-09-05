from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.api_key import ApiKey
from app.schemas.api_key import (
    ApiKeyCreate,
    ApiKeyCreatedResponse,
    ApiKeyResponse,
)
from app.security.deps import get_current_user
from app.security.api_keys import generate_api_key

router = APIRouter(prefix="/api/v1/api-keys", tags=["API Keys"])

@router.post("", response_model=ApiKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_new_api_key(
    payload: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    full_key, prefix, key_hash = generate_api_key()

    api_key_record = ApiKey(
        user_id=current_user.id,
        name=payload.name,
        key_prefix=prefix,
        key_hash=key_hash,
    )
    db.add(api_key_record)
    await db.commit()
    await db.refresh(api_key_record)

    return ApiKeyCreatedResponse(
        id=api_key_record.id,
        name=api_key_record.name,
        key=full_key, # Returned once only!
        key_prefix=prefix,
        created_at=api_key_record.created_at,
    )

@router.get("", response_model=List[ApiKeyResponse])
async def list_user_api_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ApiKey)
        .where(ApiKey.user_id == current_user.id)
        .order_by(desc(ApiKey.created_at))
    )
    result = await db.execute(stmt)
    keys = result.scalars().all()

    return [
        ApiKeyResponse(
            id=k.id,
            name=k.name,
            key_prefix=k.key_prefix,
            created_at=k.created_at,
            last_used_at=k.last_used_at,
            revoked_at=k.revoked_at,
            is_active=k.revoked_at is None,
        )
        for k in keys
    ]

@router.delete("/{key_id}")
async def revoke_api_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == current_user.id)
    )
    key_record = result.scalar_one_or_none()
    if not key_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "KEY_NOT_FOUND", "message": "API key not found."}},
        )

    if key_record.revoked_at is None:
        key_record.revoked_at = datetime.utcnow()
        await db.commit()

    return {"message": "API key successfully revoked."}
