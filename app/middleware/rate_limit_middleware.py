"""Simple in-memory rate limiting middleware."""
import time
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

# In-memory storage: {ip: [timestamps]}
# For a real production app, use Redis.
# For this SQLite-based API, in-memory is a good middle ground.
_rate_limit_store = defaultdict(list)

SENSITIVE_LIMIT = 30       # Max requests per window for sensitive paths
SENSITIVE_WINDOW = 60      # Window in seconds for sensitive paths
GLOBAL_LIMIT = 200         # Max requests per window for all paths
GLOBAL_WINDOW = 60         # Window in seconds for all paths

SENSITIVE_PATHS = [
    "/api/v1/auth/login",
    "/api/v1/backup/create",
    "/api/v1/backup/restore",
    "/api/v1/invoices/checkout",
    "/api/v1/returns",
    "/api/v1/users/reset-pin",
]


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = GLOBAL_LIMIT, window: int = GLOBAL_WINDOW):
        super().__init__(app)
        self.limit = limit
        self.window = window

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        path = request.url.path
        now = time.time()

        # Clean old timestamps
        _rate_limit_store[client_ip] = [t for t in _rate_limit_store[client_ip] if now - t < self.window]

        # Check sensitive paths (stricter limit)
        if any(path == p for p in SENSITIVE_PATHS):
            if len(_rate_limit_store[client_ip]) >= SENSITIVE_LIMIT:
                logger.warning(f"Rate limit exceeded for IP: {client_ip} on sensitive path: {path}")
                raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")

        # Global rate limit (all endpoints)
        if len(_rate_limit_store[client_ip]) >= GLOBAL_LIMIT:
            logger.warning(f"Global rate limit exceeded for IP: {client_ip}")
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")

        _rate_limit_store[client_ip].append(now)
        return await call_next(request)
