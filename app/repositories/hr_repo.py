"""HR Recruitment & Talent Management Repository."""
from app.database.connection import get_connection
from app.utils.helpers import row_to_dict, rows_to_list, now_str

# ── Job Postings ──
def create_job_posting(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO hr_job_postings (title, department, description, requirements, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (data["title"], data["department"], data.get("description", ""), data.get("requirements", ""), data.get("status", "open"), now_str())
    )
    conn.commit()
    return cursor.lastrowid

def get_job_postings(status: str = None):
    conn = get_connection()
    if status:
        rows = conn.execute("SELECT * FROM hr_job_postings WHERE status = ? ORDER BY id DESC", (status,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM hr_job_postings ORDER BY id DESC").fetchall()
    return rows_to_list(rows)

def get_job_posting(job_id: int):
    row = get_connection().execute("SELECT * FROM hr_job_postings WHERE id = ?", (job_id,)).fetchone()
    return row_to_dict(row) if row else None

# ── Applicants ──
def create_applicant(data: dict) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO hr_applicants (job_id, first_name, last_name, email, phone, resume_url, status, applied_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (data["job_id"], data["first_name"], data["last_name"], data["email"], data.get("phone", ""), 
         data.get("resume_url", ""), data.get("status", "applied"), now_str())
    )
    conn.commit()
    return cursor.lastrowid

def get_applicants_by_job(job_id: int):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM hr_applicants WHERE job_id = ? ORDER BY id DESC", (job_id,)).fetchall()
    return rows_to_list(rows)

def update_applicant_status(applicant_id: int, status: str) -> bool:
    conn = get_connection()
    cursor = conn.execute("UPDATE hr_applicants SET status = ? WHERE id = ?", (status, applicant_id))
    conn.commit()
    return cursor.rowcount > 0

# ── Interviews ──
def schedule_interview(data: dict) -> int:
    conn = get_connection()
    
    # Update applicant status
    conn.execute("UPDATE hr_applicants SET status = 'interviewing' WHERE id = ?", (data["applicant_id"],))
    
    cursor = conn.execute(
        """INSERT INTO hr_interviews (applicant_id, interviewer_id, scheduled_at, status, created_at)
           VALUES (?, ?, ?, ?, ?)""",
        (data["applicant_id"], data["interviewer_id"], data["scheduled_at"], data.get("status", "scheduled"), now_str())
    )
    conn.commit()
    return cursor.lastrowid

def log_interview_feedback(interview_id: int, data: dict) -> bool:
    conn = get_connection()
    cursor = conn.execute(
        """UPDATE hr_interviews 
           SET feedback = ?, rating = ?, status = ?
           WHERE id = ?""",
        (data["feedback"], data["rating"], data.get("status", "completed"), interview_id)
    )
    conn.commit()
    return cursor.rowcount > 0

def get_interviews_by_applicant(applicant_id: int):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM hr_interviews WHERE applicant_id = ? ORDER BY scheduled_at ASC", (applicant_id,)).fetchall()
    return rows_to_list(rows)
