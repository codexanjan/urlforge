import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Click(Base):
    __tablename__ = "clicks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    url_id: Mapped[str] = mapped_column(String(36), ForeignKey("urls.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    ip_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    referrer: Mapped[str | None] = mapped_column(String(512), nullable=True)
    country: Mapped[str | None] = mapped_column(String(64), nullable=True)
    region: Mapped[str | None] = mapped_column(String(64), nullable=True)
    city: Mapped[str | None] = mapped_column(String(64), nullable=True)
    device_type: Mapped[str | None] = mapped_column(String(32), nullable=True)   # desktop, mobile, tablet, bot, other
    browser: Mapped[str | None] = mapped_column(String(64), nullable=True)       # Chrome, Safari, Firefox, Edge, etc.
    operating_system: Mapped[str | None] = mapped_column(String(64), nullable=True) # Windows, macOS, Linux, iOS, Android, etc.
    is_bot: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationship
    url = relationship("URL", back_populates="clicks")

    __table_args__ = (
        Index("ix_clicks_url_timestamp", "url_id", "timestamp"),
        Index("ix_clicks_url_device", "url_id", "device_type"),
        Index("ix_clicks_url_browser", "url_id", "browser"),
    )
