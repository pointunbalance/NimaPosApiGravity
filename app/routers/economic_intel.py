"""Router for Economic Intelligence & Risk Advisory."""
from fastapi import APIRouter, Depends
from app.models.common import ApiResponse
from app.repositories import economic_intel_repo
from app.middleware.auth_middleware import require_role

router = APIRouter(prefix="/economic-intel", tags=["Economic Intelligence"])

@router.get("/forecast", response_model=ApiResponse, summary="Get predictive price adjustments")
def get_forecast(user: dict = Depends(require_role(["manager", "owner"]))):
    """Returns predictive price adjustments based on global market surges and risk events."""
    forecast = economic_intel_repo.calculate_risk_forecast()
    return ApiResponse(ok=True, data=forecast)

@router.get("/signals", response_model=ApiResponse, summary="Get current market signals")
def get_signals():
    """Returns the list of monitored market indicators (Gold, Oil, etc.)."""
    signals = economic_intel_repo.get_market_signals()
    return ApiResponse(ok=True, data=signals)

@router.post("/signals", response_model=ApiResponse, summary="Update a market signal")
def update_signal(signal_type: str, value: float, user: dict = Depends(require_role(["owner"]))):
    """Updates the current value of a market indicator and recalculates trends."""
    economic_intel_repo.update_signal(signal_type, value)
    return ApiResponse(ok=True, data={"message": f"Signal {signal_type} updated to {value}"})

@router.post("/events", response_model=ApiResponse, summary="Declare a global risk event")
def declare_event(data: dict, user: dict = Depends(require_role(["owner"]))):
    """Declares a global risk event (War, Pandemics, etc.) that affects specific categories."""
    event_id = economic_intel_repo.create_global_event(data)
    return ApiResponse(ok=True, data={"id": event_id})
