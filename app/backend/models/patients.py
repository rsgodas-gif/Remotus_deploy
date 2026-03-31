from core.database import Base
from sqlalchemy import Boolean, Column, Integer, String


class Patients(Base):
    __tablename__ = "patients"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    assigned_program = Column(String, nullable=False)
    week = Column(Integer, nullable=False)
    access_allowed = Column(Boolean, nullable=False)
    login_alias = Column(String, nullable=True, default="")
    problem_situation = Column(String, nullable=True, default="")