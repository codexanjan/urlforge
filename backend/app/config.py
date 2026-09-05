from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json
import os

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # App base URLs
    SHORT_DOMAIN: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    
    # CORS Origins
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./urlforge.db"
    SYNC_DATABASE_URL: str = "sqlite:///./urlforge.db"

    # Redis (Optional)
    REDIS_URL: str = ""

    # Security & JWT
    JWT_SECRET_KEY: str = "urlforge-super-secret-development-key-change-in-production-32bytes-min"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Rate Limiting (requests per minute)
    RATE_LIMIT_ANONYMOUS: int = 10
    RATE_LIMIT_AUTHENTICATED: int = 60
    RATE_LIMIT_LOGIN: int = 5
    RATE_LIMIT_REGISTER: int = 3

    # Default Admin
    ADMIN_EMAIL: str = "admin@urlforge.app"
    ADMIN_PASSWORD: str = "AdminSecurePass123!"

    # Analytics Settings
    ANALYTICS_RETENTION_DAYS: int = 365

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
