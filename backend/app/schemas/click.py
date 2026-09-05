from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ClickResponse(BaseModel):
    id: str
    url_id: str
    timestamp: datetime
    ip_hash: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    operating_system: Optional[str] = None
    referrer: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    is_bot: bool

    model_config = ConfigDict(from_attributes=True)
