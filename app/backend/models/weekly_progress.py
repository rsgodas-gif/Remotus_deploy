from core.database import Base
from sqlalchemy import Column, Integer, String


class Weekly_progress(Base):
    __tablename__ = "weekly_progress"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    patient_id = Column(Integer, nullable=False)
    week = Column(Integer, nullable=False)
    pain_avg = Column(Integer, nullable=False)
    pain_spread = Column(String, nullable=True)
    pain_relief = Column(String, nullable=True)
    pain_worsen = Column(String, nullable=True)
    movement = Column(Integer, nullable=False)
    energy = Column(Integer, nullable=False)
    exercise_frequency = Column(Integer, nullable=False)
    how_feeling = Column(String, nullable=True)
    hard_exercises = Column(String, nullable=True)
    liked_exercises = Column(String, nullable=True)
    progress_exercises = Column(String, nullable=True)
    other_notes = Column(String, nullable=True)
    entry_date = Column(String, nullable=False)