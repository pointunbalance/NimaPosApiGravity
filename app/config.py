"""Centralized application configuration."""
import os
import secrets

# --- Paths ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "pos_api.db")
BACKUP_DIR = os.path.join(DATA_DIR, "backups")

# --- JWT ---
_jwt_key_path = os.path.join(DATA_DIR, "jwt_secret.key")
def _load_or_create_jwt_secret() -> str:
    """Load JWT secret from file, or create and persist a new one."""
    if os.path.exists(_jwt_key_path):
        with open(_jwt_key_path, "r") as f:
            return f.read().strip()
    new_secret = secrets.token_hex(32)
    os.makedirs(os.path.dirname(_jwt_key_path), exist_ok=True)
    with open(_jwt_key_path, "w") as f:
        f.write(new_secret)
    return new_secret

JWT_SECRET = os.environ.get("JWT_SECRET") or _load_or_create_jwt_secret()
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 12

# --- API ---
API_VERSION = "2.29.0"
API_PREFIX = "/api/v1"
APP_NAME = "NimaPOS API"
BUILD_DATE = "2026-03-01"

# --- Business Defaults ---
DEFAULT_BRANCH_ID = 1
LOW_STOCK_THRESHOLD = 10
TOP_PRODUCTS_LIMIT = 20
PAGINATION_DEFAULT_LIMIT = 50
PAGINATION_MAX_LIMIT = 200

# --- Ensure dirs exist ---
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(BACKUP_DIR, exist_ok=True)
