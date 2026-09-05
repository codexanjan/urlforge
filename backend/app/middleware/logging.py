import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from fastapi import Request, Response

logger = logging.getLogger("urlforge.access")

class LoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        start_time = time.time()

        response: Response = await call_next(request)
        duration_ms = round((time.time() - start_time) * 1000, 2)

        # Append Request-ID to response header
        response.headers["X-Request-ID"] = request_id

        # Skip spamming logs for test/health checks if desired
        if request.url.path != "/health":
            logger.info(
                f"[{request_id}] {request.method} {request.url.path} "
                f"status={response.status_code} duration={duration_ms}ms"
            )

        return response
