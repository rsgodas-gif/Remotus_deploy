import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.patients import Patients

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["patient-auth"])


class PatientLoginRequest(BaseModel):
    """Login with email, phone, or username alias"""
    identifier: str  # email, phone, or login alias


class PatientLoginResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    assigned_program: str
    week: int
    access_allowed: bool
    login_alias: Optional[str] = ""
    problem_situation: Optional[str] = ""

    class Config:
        from_attributes = True


@router.post("/patient-login", response_model=PatientLoginResponse)
async def patient_login(
    data: PatientLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate patient by email, phone number, or username alias. No password required."""
    identifier = data.identifier.strip()
    identifier_lower = identifier.lower()
    if not identifier:
        raise HTTPException(status_code=400, detail="Įveskite el. paštą, telefono numerį arba vartotojo vardą")

    try:
        # Case-insensitive email match + exact phone match + case-insensitive alias match
        query = select(Patients).where(
            or_(
                func.lower(Patients.email) == identifier_lower,
                Patients.phone == identifier,
                func.lower(Patients.login_alias) == identifier_lower,
            )
        )
        result = await db.execute(query)
        patient = result.scalar_one_or_none()

        if not patient:
            logger.warning(f"Patient not found for identifier: {identifier_lower}")
            raise HTTPException(
                status_code=404,
                detail="Pacientas nerastas. Patikrinkite el. paštą, telefono numerį arba vartotojo vardą."
            )

        return patient

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Patient login error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Serverio klaida: {str(e)}")