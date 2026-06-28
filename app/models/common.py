from pydantic import BaseModel, Field
from typing import Any, Optional, List, Generic, TypeVar

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    """Standard API response envelope."""
    ok: bool = Field(..., description="Whether the request succeeded")
    data: Optional[T] = Field(None, description="Response payload")
    error: Optional[dict] = Field(None, description="Error details if ok=false")


class PaginationMeta(BaseModel):
    """Pagination metadata."""
    page: int = 1
    limit: int = 50
    total: int = 0
    total_pages: int = 0


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response with items and meta."""
    items: List[T] = []
    pagination: PaginationMeta = PaginationMeta()
