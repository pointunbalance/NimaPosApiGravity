"""Router for Price Monitoring and Smart Advisory."""
from fastapi import APIRouter, Depends
from app.models.common import ApiResponse
from app.repositories import price_advisory_repo
from app.middleware.auth_middleware import require_role

router = APIRouter(prefix="/price-advisory", tags=["Price Advisory"])

@router.get("/suggestions", response_model=ApiResponse, summary="Get currency-based price suggestions")
def get_suggestions(user: dict = Depends(require_role(["manager", "owner"]))):
    """Returns products whose cost has changed due to currency sync."""
    suggestions = price_advisory_repo.get_price_suggestions()
    return ApiResponse(ok=True, data=suggestions)

@router.get("/optimization", response_model=ApiResponse, summary="Get margin optimization suggestions")
def get_optimization(user: dict = Depends(require_role(["manager", "owner"]))):
    """Returns products whose margin deviates from dynamic rules (price tiers/velocity)."""
    suggestions = price_advisory_repo.get_optimization_suggestions()
    return ApiResponse(ok=True, data=suggestions)

@router.post("/apply", response_model=ApiResponse, summary="Apply suggested price adjustments")
def apply_suggestions(suggestions: list, user: dict = Depends(require_role(["owner"]))):
    """Bulk updates product prices based on provided suggestions."""
    price_advisory_repo.apply_suggestions(suggestions)
    return ApiResponse(ok=True, data={"message": f"Successfully updated {len(suggestions)} items"})

@router.post("/rules", response_model=ApiResponse, summary="Create a pricing rule")
def create_rule(data: dict, user: dict = Depends(require_role(["owner"]))):
    """Adds a new dynamic margin rule (e.g. category-specific or cost-tier specific)."""
    rule_id = price_advisory_repo.pricing_rules_repo.create(data)
    return ApiResponse(ok=True, data={"id": rule_id})
