from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime

class SegmentBase(BaseModel):
    name: str = Field(..., description="Segment name", examples=["VIPs"])
    criteria_json: str = Field('{}', description="Rules for segmenting")

class SegmentCreate(SegmentBase):
    pass

class SegmentOut(SegmentBase):
    id: int
    created_at: str

class CampaignBase(BaseModel):
    name: str = Field(..., description="Campaign name", examples=["Eid Offer"])
    type: str = Field(..., description="Campaign type (sms, email)")
    segment_id: int = Field(..., description="Target segment ID")
    message_template: str = Field(..., description="Template body")
    scheduled_at: Optional[str] = None

class CampaignCreate(CampaignBase):
    pass

class CampaignOut(CampaignBase):
    id: int
    status: str
    created_at: str

class InteractionLogCreate(BaseModel):
    customer_id: int = Field(...)
    type: str = Field(..., description="Type of interaction (call, email, visit, sms)")
    notes: str = Field(..., description="Outcome or summary of the interaction")

class InteractionLogOut(BaseModel):
    id: int
    customer_id: int
    type: str
    notes: str
    user_id: int
    created_at: str
    agent_name: Optional[str] = None
