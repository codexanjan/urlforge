from typing import List, Optional
from pydantic import BaseModel

class AnalyticsOverview(BaseModel):
    total_clicks: int
    unique_visitors: int
    clicks_today: int
    clicks_this_week: int
    clicks_this_month: int
    human_clicks: int
    bot_clicks: int

class TimelinePoint(BaseModel):
    date: str
    clicks: int
    unique_visitors: int
    bot_clicks: int

class BreakdownItem(BaseModel):
    name: str
    count: int
    percentage: float

class URLAnalyticsResponse(BaseModel):
    url_id: str
    short_url: str
    original_url: str
    overview: AnalyticsOverview
    timeline: List[TimelinePoint]
    devices: List[BreakdownItem]
    browsers: List[BreakdownItem]
    operating_systems: List[BreakdownItem]
    referrers: List[BreakdownItem]
    countries: List[BreakdownItem]
