"""Helper utilities — pagination, date formatting."""
import math
from datetime import date, datetime
from app.config import PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT


def paginate(page: int = 1, limit: int = PAGINATION_DEFAULT_LIMIT):
    """Normalize page/limit and return (offset, limit, page)."""
    page = max(1, page)
    limit = max(1, min(limit, PAGINATION_MAX_LIMIT))
    offset = (page - 1) * limit
    return offset, limit, page


def pagination_meta(total: int, page: int, limit: int) -> dict:
    """Build pagination metadata dict."""
    return {
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": math.ceil(total / limit) if limit > 0 else 0,
    }


def today_str() -> str:
    """Return today's date as YYYY-MM-DD."""
    return date.today().isoformat()


def now_str() -> str:
    """Return current datetime as ISO string."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def safe_float(value, default: float = 0.0) -> float:
    """Safely convert to float."""
    try:
        return float(value) if value is not None else default
    except (ValueError, TypeError):
        return default


def safe_int(value, default: int = 0) -> int:
    """Safely convert to int."""
    try:
        return int(value) if value is not None else default
    except (ValueError, TypeError):
        return default


def row_to_dict(row) -> dict:
    """Convert sqlite3.Row to dict."""
    if row is None:
        return {}
    return dict(row)


def rows_to_list(rows) -> list[dict]:
    """Convert list of sqlite3.Row to list of dicts."""
    return [dict(r) for r in rows] if rows else []
