"""Simple in-memory rate limiting middleware with separate sensitive/global counters."""
import time
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

# Separate in-memory stores for sensitive vs global limits.
# For a real production app, use Redis.
_sensitive_store: dict[str, list[float]] = defaultdict(list)
_global_store: dict[str, list[float]] = defaultdict(list)

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


def _prune(store: dict[str, list[float]], ip: str, window: int, now: float):
    """Remove timestamps older than the window."""
    store[ip] = [t for t in store[ip] if now - t < window]


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = GLOBAL_LIMIT, window: int = GLOBAL_WINDOW):
        super().__init__(app)
        self.limit = limit
        self.window = window

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        path = request.url.path
        now = time.time()

        # Check sensitive paths (stricter limit, separate counter)
        if any(path == p for p in SENSITIVE_PATHS):
            _prune(_sensitive_store, client_ip, SENSITIVE_WINDOW, now)
            if len(_sensitive_store[client_ip]) >= SENSITIVE_LIMIT:
                logger.warning(f"Rate limit exceeded for IP: {client_ip} on sensitive path: {path}")
                raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
            _sensitive_store[client_ip].append(now)

        # Global rate limit (separate counter)
        _prune(_global_store, client_ip, self.window, now)
        if len(_global_store[client_ip]) >= self.limit:
            logger.warning(f"Global rate limit exceeded for IP: {client_ip}")
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")

        _global_store[client_ip].append(now)
        return await call_next(request)
