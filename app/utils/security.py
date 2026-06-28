"""JWT token and PIN hashing utilities."""
import hashlib
import os
import time
import jwt
from app.config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRY_HOURS


# ──────────────────────────────────────────────
# PIN Hashing (PBKDF2-HMAC-SHA256)
# ──────────────────────────────────────────────

def hash_pin(pin: str) -> tuple[str, str]:
    """Hash a PIN and return (hash_hex, salt_hex)."""
    salt = os.urandom(16).hex()
    pin_hash = hashlib.pbkdf2_hmac(
        "sha256", pin.encode(), bytes.fromhex(salt), 100_000
    ).hex()
    return pin_hash, salt


def verify_pin(pin: str, stored_hash: str, stored_salt: str) -> bool:
    """Verify a PIN against stored hash and salt."""
    import hmac
    computed = hashlib.pbkdf2_hmac(
        "sha256", pin.encode(), bytes.fromhex(stored_salt), 100_000
    ).hex()
    return hmac.compare_digest(computed, stored_hash)


# ──────────────────────────────────────────────
# JWT Tokens
# ──────────────────────────────────────────────

def create_token(user_id: int, username: str, role: str, branch_id: int) -> tuple[str, int]:
    """Create a JWT token. Returns (token_string, expires_in_seconds)."""
    expires_in = JWT_EXPIRY_HOURS * 3600
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "branch_id": branch_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + expires_in,
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, expires_in


def decode_token(token: str) -> dict:
    """Decode and verify a JWT token. Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
