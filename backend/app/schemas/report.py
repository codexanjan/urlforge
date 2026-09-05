from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.report import ReportStatus

class ReportCreate(BaseModel):
    short_url: str = Field(..., max_length=255)
    reason: str = Field(..., max_length=50) # phishing, malware, spam, illegal, other
    description: Optional[str] = Field(None, max_length=1000)

class ReportResponse(BaseModel):
    id: str
    short_url: str
    reason: str
    description: Optional[str] = None
    status: ReportStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ReportUpdate(BaseModel):
    status: ReportStatus
