from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func


class PatientDayExerciseCompletion(Base):
    """Per-exercise completion tracking for day-based programs."""

    __tablename__ = "patient_day_exercise_completion"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    patient_id = Column(Integer, nullable=False)
    program_name = Column(String, nullable=False)
    day_number = Column(Integer, nullable=False)
    order_index = Column(Integer, nullable=False)
    completed = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
