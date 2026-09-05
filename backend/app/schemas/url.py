from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class URLCreate(BaseModel):
    original_url: str = Field(..., max_length=2048, description="Target destination URL")
    custom_alias: Optional[str] = Field(None, min_length=3, max_length=32, pattern=r"^[a-zA-Z0-9_-]+$")
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    expires_at: Optional[datetime] = None

class URLUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None
    original_url: Optional[str] = Field(None, max_length=2048)

class URLResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    original_url: str
    short_code: str
    custom_alias: Optional[str] = None
    short_url: str
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    expires_at: Optional[datetime] = None
    click_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class URLListResponse(BaseModel):
    items: List[URLResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
