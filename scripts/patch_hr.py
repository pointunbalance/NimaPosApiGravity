import sqlite3
from app.config import DB_PATH

def patch_db():
    print(f"Patching database at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    tables_to_add = [
        """CREATE TABLE IF NOT EXISTS hr_job_postings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            department TEXT NOT NULL,
            description TEXT,
            requirements TEXT,
            status TEXT DEFAULT 'open',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            closed_at DATETIME
        )""",
        """CREATE TABLE IF NOT EXISTS hr_applicants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            resume_url TEXT,
            status TEXT DEFAULT 'applied',
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(job_id) REFERENCES hr_job_postings(id)
        )""",
        """CREATE TABLE IF NOT EXISTS hr_interviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            applicant_id INTEGER NOT NULL,
            interviewer_id INTEGER NOT NULL,
            scheduled_at TEXT NOT NULL,
            feedback TEXT,
            rating INTEGER,
            status TEXT DEFAULT 'scheduled',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(applicant_id) REFERENCES hr_applicants(id),
            FOREIGN KEY(interviewer_id) REFERENCES users(id)
        )"""
    ]
    
    for table_sql in tables_to_add:
        try:
            cursor.execute(table_sql)
            print("Table processed successfully.")
        except Exception as e:
            print(f"Error creating table: {e}")
                
    conn.commit()
    conn.close()
    print("Database patching for Phase 20 (HR Recruitment) complete.")

if __name__ == "__main__":
    patch_db()
