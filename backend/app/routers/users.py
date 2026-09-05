from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.user import UserUpdate, PasswordChange
from app.security.deps import get_current_user
from app.security.passwords import hash_password, verify_password

router = APIRouter(prefix="/api/v1", tags=["Users"])

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
async def update_my_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.name is not None:
        current_user.name = payload.name
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url

    current_user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/me/change-password")
async def change_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_PASSWORD", "message": "Incorrect current password."}},
        )

    current_user.password_hash = hash_password(payload.new_password)
    current_user.updated_at = datetime.utcnow()
    await db.commit()

    return {"message": "Password updated successfully."}

@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Cascades will automatically delete URLs, Clicks, Refresh Tokens, and API Keys
    await db.delete(current_user)
    await db.commit()

    return {"message": "Account and all associated links and analytics successfully deleted."}
