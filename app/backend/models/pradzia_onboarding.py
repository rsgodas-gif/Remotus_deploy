from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func


class PradziaOnboarding(Base):
    """Tracks /pradzia activation submissions (post-payment onboarding)."""

    __tablename__ = "pradzia_onboarding"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    patient_id = Column(Integer, nullable=False)
    email = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    pain_before = Column(Integer, nullable=False)
    pain_after = Column(Integer, nullable=False)
    source = Column(String, nullable=False, default="pradzia")
    routine_completed = Column(Boolean, nullable=False, default=True)
    completed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
