from app.database.connection import get_connection
from app.models.attendance import AttendanceCreate, AttendanceUpdate, AttendanceFilter
from typing import List, Optional

def create_attendance(data: AttendanceCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO attendance_records (user_id, user_name, date, check_in, status, notes, branch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (data.user_id, data.user_name, data.date, data.check_in, data.status, data.notes, data.branch_id))
    conn.commit()
    return cursor.lastrowid

def update_attendance(attendance_id: int, data: AttendanceUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    fields = []
    values = []
    if data.check_out is not None:
        fields.append("check_out = ?")
        values.append(data.check_out)
    if data.hours_worked is not None:
        fields.append("hours_worked = ?")
        values.append(data.hours_worked)
    if data.overtime_hours is not None:
        fields.append("overtime_hours = ?")
        values.append(data.overtime_hours)
    if data.status is not None:
        fields.append("status = ?")
        values.append(data.status)
    if data.notes is not None:
        fields.append("notes = ?")
        values.append(data.notes)
    
    if not fields: return False
    
    values.append(attendance_id)
    cursor.execute(f"UPDATE attendance_records SET {', '.join(fields)} WHERE id = ?", tuple(values))
    conn.commit()
    return cursor.rowcount > 0

def list_attendance(filter: AttendanceFilter):
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM attendance_records WHERE 1=1"
    params = []
    if filter.user_id:
        query += " AND user_id = ?"
        params.append(filter.user_id)
    if filter.start_date:
        query += " AND date >= ?"
        params.append(filter.start_date)
    if filter.end_date:
        query += " AND date <= ?"
        params.append(filter.end_date)
    if filter.branch_id:
        query += " AND branch_id = ?"
        params.append(filter.branch_id)
    
    query += " ORDER BY date DESC, check_in DESC"
    cursor.execute(query, tuple(params))
    return [dict(row) for row in cursor.fetchall()]

def get_attendance_stats(user_id: int, month: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(*) as days_present, SUM(hours_worked) as total_hours, SUM(overtime_hours) as total_overtime
        FROM attendance_records
        WHERE user_id = ? AND date LIKE ? AND status = 'present'
    """, (user_id, f"{month}%"))
    return dict(cursor.fetchone())
