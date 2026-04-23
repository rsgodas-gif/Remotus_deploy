from core.database import Base
from sqlalchemy import Column, Integer, String, Text


class ProgramDays(Base):
    """Day-based exercises for standardized programs such as Be skausmo-10."""

    __tablename__ = "program_days"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    program_name = Column(String, nullable=False)
    day_number = Column(Integer, nullable=False)
    order_index = Column(Integer, nullable=False)
    exercise_name = Column(String, nullable=False)
    sets = Column(String, nullable=False)
    reps_or_time = Column(String, nullable=False)
    instructions = Column(Text, nullable=False)  # JSON string list of 3-4 steps
    video_link = Column(String, nullable=True, default="")
