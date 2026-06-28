from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class WebhookEndpointCreate(BaseModel):
    url: str
    secret: Optional[str] = None # Will auto-generate if None
    events: List[str] # e.g. ["invoice.created", "stock.low"]

class WebhookEndpointOut(BaseModel):
    id: int
    url: str
    events: List[str]
    is_active: bool
    created_at: str

class WebhookTestRequest(BaseModel):
    url: str
    event: str = "ping"
