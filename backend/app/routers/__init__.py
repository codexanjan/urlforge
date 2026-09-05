from app.routers.health import router as health_router
from app.routers.auth import router as auth_router
from app.routers.urls import router as urls_router
from app.routers.redirect import router as redirect_router
from app.routers.analytics import router as analytics_router
from app.routers.api_keys import router as api_keys_router
from app.routers.users import router as users_router
from app.routers.reports import router as reports_router
from app.routers.admin import router as admin_router

__all__ = [
    "health_router",
    "auth_router",
    "urls_router",
    "redirect_router",
    "analytics_router",
    "api_keys_router",
    "users_router",
    "reports_router",
    "admin_router",
]
