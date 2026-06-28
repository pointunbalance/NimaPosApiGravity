import sqlite3
import logging
from datetime import datetime
from typing import List, Optional
from app.database.connection import get_db_connection
from app.models.lms import LMSArticleCreate, LMSArticleUpdate, TrainingLogCreate

logger = logging.getLogger(__name__)

def create_article(article: LMSArticleCreate) -> int:
    with get_db_connection() as conn:
        cursor = conn.execute(
            """INSERT INTO lms_articles (title, category, content_markdown, author_id, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (article.title, article.category, article.content_markdown, article.author_id, datetime.now().isoformat(), datetime.now().isoformat())
        )
        return cursor.lastrowid

def get_articles(category: Optional[str] = None) -> List[dict]:
    with get_db_connection() as conn:
        query = "SELECT * FROM lms_articles"
        params = []
        if category:
            query += " WHERE category = ?"
            params.append(category)
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

def get_article(article_id: int) -> Optional[dict]:
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM lms_articles WHERE id = ?", (article_id,)).fetchone()
        return dict(row) if row else None

def log_training_completion(log: TrainingLogCreate):
    with get_db_connection() as conn:
        conn.execute(
            "INSERT INTO employee_training_logs (user_id, article_id, completed_at, score) VALUES (?, ?, ?, ?)",
            (log.user_id, log.article_id, datetime.now().isoformat(), log.score)
        )

def get_employee_training_summary(user_id: int) -> List[dict]:
    with get_db_connection() as conn:
        rows = conn.execute("""
            SELECT l.*, a.title as article_title, a.category
            FROM employee_training_logs l
            JOIN lms_articles a ON l.article_id = a.id
            WHERE l.user_id = ?
        """, (user_id,)).fetchall()
        return [dict(r) for r in rows]
