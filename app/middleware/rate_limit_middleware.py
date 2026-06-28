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

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 60, window: int = 60):
        super().__init__(app)
        self.limit = limit    # Max requests
        self.window = window  # Window in seconds
        
    async def dispatch(self, request: Request, call_next):
        # Specific sensitive endpoints
        path = request.url.path
        sensitive_paths = [
            "/api/v1/auth/login",
            "/api/v1/backup/create",
            "/api/v1/backup/restore",
            "/api/v1/invoices/checkout",
            "/api/v1/returns",
            "/api/v1/users/reset-pin"
        ]
        
        if any(path == p for p in sensitive_paths):
            client_ip = request.client.host
            now = time.time()
            
            # Clean old timestamps
            _rate_limit_store[client_ip] = [t for t in _rate_limit_store[client_ip] if now - t < self.window]
            
            if len(_rate_limit_store[client_ip]) >= self.limit:
                logger.warning(f"Rate limit exceeded for IP: {client_ip} on path: {path}")
                raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
            
            _rate_limit_store[client_ip].append(now)
            
        return await call_next(request)
