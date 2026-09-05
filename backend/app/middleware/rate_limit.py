import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, HTTPException, status
from app.config import settings

class SlidingWindowRateLimiter:
    def __init__(self):
        # key -> list of timestamps
        self.requests: Dict[str, List[float]] = defaultdict(list)
        self.last_cleanup = time.time()

    def _cleanup(self, now: float, window_seconds: float = 60.0):
        # Periodically prune stale entries
        if now - self.last_cleanup > 60:
            for key in list(self.requests.keys()):
                self.requests[key] = [t for t in self.requests[key] if now - t < window_seconds]
                if not self.requests[key]:
                    del self.requests[key]
            self.last_cleanup = now

    def is_rate_limited(self, key: str, max_requests: int, window_seconds: float = 60.0) -> Tuple[bool, int]:
        now = time.time()
        self._cleanup(now, window_seconds)

        # Filter out timestamps older than window
        valid_timestamps = [t for t in self.requests[key] if now - t < window_seconds]
        self.requests[key] = valid_timestamps

        if len(valid_timestamps) >= max_requests:
            oldest = valid_timestamps[0]
            retry_after = max(1, int(window_seconds - (now - oldest)))
            return True, retry_after

        self.requests[key].append(now)
        return False, 0

limiter = SlidingWindowRateLimiter()

def get_client_ip(request: Request) -> str:
    # Check standard proxy headers
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "127.0.0.1"

async def check_rate_limit(
    request: Request,
    key_prefix: str,
    limit: int,
    window_seconds: int = 60,
):
    ip = get_client_ip(request)
    limit_key = f"{key_prefix}:{ip}"

    limited, retry_after = limiter.is_rate_limited(limit_key, limit, float(window_seconds))
    if limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": {
                    "code": "RATE_LIMITED",
                    "message": "Too many requests. Please try again later.",
                    "retry_after_seconds": retry_after,
                }
            },
            headers={"Retry-After": str(retry_after)},
        )
