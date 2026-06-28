from fastapi import APIRouter, Depends, HTTPException
from app.models.attendance import AttendanceCreate, AttendanceUpdate, AttendanceFilter
from app.repositories import attendance_repo
from app.middleware.auth_middleware import require_role
from typing import List

router = APIRouter(prefix="/attendance", tags=["HR & Payroll"])

@router.post("/", dependencies=[Depends(require_role(["owner", "admin"]))], summary="Record new employee attendance")
def create_entry(data: AttendanceCreate):
    res = attendance_repo.create_attendance(data)
    if not res: raise HTTPException(status_code=400, detail="Failed to create entry")
    return {"id": res, "message": "Attendance record created"}

@router.put("/{id}", dependencies=[Depends(require_role(["owner", "admin"]))], summary="Modify an existing attendance record")
def update_entry(id: int, data: AttendanceUpdate):
    if not attendance_repo.update_attendance(id, data):
        raise HTTPException(status_code=404, detail="Record not found")
    return {"message": "Attendance record updated"}

@router.put("/{id}/check-out", summary="Process employee check-out")
def check_out(id: int, user: dict = Depends(require_role(["cashier", "manager", "owner"]))):
    """Marks an employee as left and calculates hours worked."""
    from datetime import datetime
    conn = attendance_repo.get_connection()
    row = conn.execute("SELECT * FROM attendance_records WHERE id = ?", (id,)).fetchone()
    if not row: raise HTTPException(404, "Record not found")
    if row["check_out"]: raise HTTPException(400, "Already checked out")
    
    check_in_time = datetime.strptime(row["check_in"], "%H:%M:%S")
    now = datetime.now()
    check_out_str = now.strftime("%H:%M:%S")
    
    # Calculate duration
    duration = now - datetime.combine(now.date(), check_in_time.time())
    hours = round(duration.total_seconds() / 3600, 2)
    overtime = max(0, hours - 8) # Standard 8h shift
    
    attendance_repo.update_attendance(id, AttendanceUpdate(
        check_out=check_out_str,
        hours_worked=hours,
        overtime_hours=overtime,
        status="present"
    ))
    return {"ok": True, "check_out": check_out_str, "hours": hours, "overtime": overtime}

@router.get("/", dependencies=[Depends(require_role(["owner", "admin"]))], summary="List and filter attendance records")
def list_entries(user_id: int = None, start_date: str = None, end_date: str = None, branch_id: int = None):
    filter = AttendanceFilter(user_id=user_id, start_date=start_date, end_date=end_date, branch_id=branch_id)
    return attendance_repo.list_attendance(filter)

@router.get("/stats/{user_id}/{month}", dependencies=[Depends(require_role(["owner", "admin"]))], summary="Get attendance statistics for an employee")
def get_stats(user_id: int, month: str):
    return attendance_repo.get_attendance_stats(user_id, month)
