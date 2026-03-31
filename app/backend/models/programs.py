from core.database import Base
from sqlalchemy import Column, Integer, String


class Programs(Base):
    __tablename__ = "programs"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    program_name = Column(String, nullable=False)
    week = Column(Integer, nullable=False)
    exercise_group = Column(String, nullable=False)
    exercise_group_emoji = Column(String, nullable=True)
    exercise_group_order = Column(Integer, nullable=True)
    exercise_name = Column(String, nullable=False)
    time_reps = Column(String, nullable=False)
    video_link = Column(String, nullable=False)
    short_instruction = Column(String, nullable=True)
    exercise_order = Column(Integer, nullable=True)