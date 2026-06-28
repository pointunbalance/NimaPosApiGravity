import sqlite3
from app.config import DB_PATH

def patch_db():
    print(f"Patching database at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    tables_to_add = [
        """CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            customer_id INTEGER,
            description TEXT,
            budget REAL DEFAULT 0.0,
            start_date TEXT,
            end_date TEXT,
            status TEXT DEFAULT 'planning',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(customer_id) REFERENCES customers(id)
        )""",
        """CREATE TABLE IF NOT EXISTS wbs_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            allocated_budget REAL DEFAULT 0.0,
            estimated_hours REAL DEFAULT 0.0,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )""",
        """CREATE TABLE IF NOT EXISTS project_timesheets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            task_id INTEGER,
            employee_id INTEGER,
            date TEXT NOT NULL,
            hours_worked REAL NOT NULL,
            hourly_rate REAL NOT NULL,
            total_cost REAL NOT NULL,
            note TEXT,
            FOREIGN KEY(project_id) REFERENCES projects(id),
            FOREIGN KEY(task_id) REFERENCES wbs_tasks(id),
            FOREIGN KEY(employee_id) REFERENCES users(id)
        )""",
        """CREATE TABLE IF NOT EXISTS project_materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            task_id INTEGER,
            product_id INTEGER NOT NULL,
            quantity REAL NOT NULL,
            unit_cost REAL NOT NULL,
            total_cost REAL NOT NULL,
            date_consumed TEXT NOT NULL,
            note TEXT,
            FOREIGN KEY(project_id) REFERENCES projects(id),
            FOREIGN KEY(task_id) REFERENCES wbs_tasks(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
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
    print("Database patching for Phase 19 (Projects & Costing) complete.")

if __name__ == "__main__":
    patch_db()
