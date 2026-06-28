"""Portfolio schemas."""
from pydantic import BaseModel
from typing import Optional
from .studio import EventType


class PortfolioCreate(BaseModel):
    title: str
    category: EventType
    media_type: str # image | video
    url: str
    video_link: Optional[str] = None
    date: Optional[str] = None

class PortfolioUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[EventType] = None
    media_type: Optional[str] = None
    url: Optional[str] = None
    video_link: Optional[str] = None
    date: Optional[str] = None
