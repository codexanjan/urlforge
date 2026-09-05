from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class ApiKeyCreatedResponse(BaseModel):
    id: str
    name: str
    key: str # The raw secret, displayed only once upon creation
    key_prefix: str
    created_at: datetime

class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    created_at: datetime
    last_used_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
