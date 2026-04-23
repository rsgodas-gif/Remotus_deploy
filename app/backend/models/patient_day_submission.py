from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func


class PatientDaySubmission(Base):
    """End-of-day submission for day-based programs (pain score + unlock)."""

    __tablename__ = "patient_day_submission"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    patient_id = Column(Integer, nullable=False)
    program_name = Column(String, nullable=False)
    day_number = Column(Integer, nullable=False)
    pain_today = Column(Integer, nullable=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
