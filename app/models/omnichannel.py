from pydantic import BaseModel
from typing import Optional, List

class PlatformMappingCreate(BaseModel):
    internal_product_id: int
    external_platform: str
    external_id: str
    sync_enabled: bool = True

class SyncLogCreate(BaseModel):
    platform: str
    event_type: str
    status: str
    payload_json: Optional[str] = None
    error_message: Optional[str] = None

class ProductSyncStatus(BaseModel):
    product_id: int
    product_name: str
    platform: str
    external_id: str
    sync_enabled: bool
    last_sync_at: Optional[str]
    current_stock: float
