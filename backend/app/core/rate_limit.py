import sys
import time
from collections import defaultdict
from fastapi import HTTPException, status
from app.core.config import settings

class SimpleLimiter:
    """
    In-memory rate limiter tracking timestamps per client IP.
    This limiter is suitable for the current single-instance deployment.
    It is not a distributed rate limiter.
    """
    def __init__(self, requests_limit: int, window_seconds: int):
        self.limit = requests_limit
        self.window = window_seconds
        self.history = defaultdict(list)

    def check(self, ip: str, force: bool = False):
        # Bypass rate limiter during unit tests to avoid collision between tests
        if settings.ENVIRONMENT.strip().lower() == "testing" and not force:
            return

        now = time.time()
        # Filter timestamps within window
        self.history[ip] = [t for t in self.history[ip] if now - t < self.window]
        
        if len(self.history[ip]) >= self.limit:
            # Calculate remaining wait time for Retry-After header
            oldest_allowed = self.history[ip][0]
            retry_after = int(self.window - (now - oldest_allowed))
            if retry_after <= 0:
                retry_after = 1
            
            headers = {"Retry-After": str(retry_after)}
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
                headers=headers
            )
        
        self.history[ip].append(now)

# Centralized Limiter Instances (Section 4)
login_limiter = SimpleLimiter(
    requests_limit=settings.LOGIN_RATE_LIMIT,
    window_seconds=settings.LOGIN_RATE_WINDOW
)

ai_limiter = SimpleLimiter(
    requests_limit=settings.ASSISTANT_RATE_LIMIT,
    window_seconds=settings.ASSISTANT_RATE_WINDOW
)
