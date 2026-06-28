"""Fleet router — Vehicles, Drivers, and Fuel."""
from fastapi import APIRouter, Depends, HTTPException
from app.models.common import ApiResponse
from app.models.fleet import VehicleCreate, VehicleUpdate, DriverAssignmentRequest, FuelLogCreate
from app.repositories import fleet_repo
from app.middleware.auth_middleware import require_role

router = APIRouter(prefix="/fleet", tags=["Fleet & Logistics"])

@router.post("/vehicles", response_model=ApiResponse, summary="Register a vehicle")
def create_vehicle(v: VehicleCreate, user: dict = Depends(require_role(["manager", "owner"]))):
    """Adds a new vehicle to the company fleet."""
    v_id = fleet_repo.create_vehicle(v.dict())
    return ApiResponse(ok=True, data={"vehicle_id": v_id, "message": "Vehicle registered successfully"})

@router.get("/vehicles", response_model=ApiResponse, summary="List all active vehicles")
def list_vehicles(user: dict = Depends(require_role(["staff", "manager", "owner"]))):
    """Returns a list of all active vehicles in the fleet."""
    data = fleet_repo.get_all_vehicles()
    return ApiResponse(ok=True, data=data)

@router.post("/assign", response_model=ApiResponse, summary="Assign driver to vehicle")
def assign_driver(req: DriverAssignmentRequest, user: dict = Depends(require_role(["manager", "owner"]))):
    """Assigns a driver (user) to a specific vehicle."""
    fleet_repo.assign_driver(req.vehicle_id, req.driver_id, req.notes)
    return ApiResponse(ok=True, data={"message": "Driver assigned. Vehicle status updated to 'in_transit'"})

@router.post("/fuel", response_model=ApiResponse, summary="Record refueling")
def log_fuel(req: FuelLogCreate, user: dict = Depends(require_role(["staff", "manager", "owner"]))):
    """Logs fuel consumption and cost for a vehicle. Updates odometer reading."""
    fleet_repo.log_fuel(req.dict())
    return ApiResponse(ok=True, data={"message": "Fuel log recorded"})

@router.get("/vehicles/{v_id}/history", response_model=ApiResponse, summary="Get vehicle history")
def get_history(v_id: int, user: dict = Depends(require_role(["manager", "owner"]))):
    """Retrieves assignment and fuel history for a specific vehicle."""
    data = fleet_repo.get_vehicle_history(v_id)
    return ApiResponse(ok=True, data=data)

@router.put("/vehicles/{v_id}", response_model=ApiResponse, summary="Update vehicle info")
def update_vehicle(v_id: int, v: VehicleUpdate, user: dict = Depends(require_role(["manager", "owner"]))):
    """Updates vehicle details, status, or odometer."""
    fleet_repo.update_vehicle(v_id, v.dict(exclude_unset=True))
    return ApiResponse(ok=True, data={"message": "Vehicle updated"})
