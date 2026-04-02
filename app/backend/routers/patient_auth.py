import logging
import re
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.patients import Patients
from models.pradzia_onboarding import PradziaOnboarding
from models.weekly_progress import Weekly_progress

logger = logging.getLogger(__name__)

BE_SKAUSMO_14_PROGRAM = "Be skausmo 14"
PRADZIA_PLACEHOLDER_PHONE = "—"

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


class PradziaCompleteRequest(BaseModel):
    """POST /pradzia form: creates/updates patient, logs them in via returned session payload."""

    first_name: str = Field(..., min_length=1, max_length=120)
    last_name: str = Field(..., min_length=1, max_length=120)
    email: str = Field(..., min_length=3, max_length=254)
    pain_before: int = Field(..., ge=1, le=10)
    pain_after: int = Field(..., ge=1, le=10)

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_names(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Laukas negali būti tuščias")
        return s

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        s = (v or "").strip().lower()
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", s):
            raise ValueError("Neteisingas el. paštas")
        return s


async def _unique_login_alias(db: AsyncSession, base: str, exclude_patient_id: Optional[int]) -> str:
    slug = re.sub(r"[^a-z0-9._-]", "", base.lower())[:40] or "user"
    candidate = slug
    suffix = 1
    while True:
        q = select(Patients).where(func.lower(Patients.login_alias) == candidate.lower())
        res = await db.execute(q)
        existing = res.scalar_one_or_none()
        if existing is None or (exclude_patient_id is not None and existing.id == exclude_patient_id):
            return candidate
        suffix += 1
        candidate = f"{slug}_{suffix}"


@router.post("/pradzia-complete", response_model=PatientLoginResponse)
async def pradzia_complete(
    data: PradziaCompleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Upsert patient by email after /pradzia onboarding; returns same shape as patient-login for session storage."""
    email_norm = str(data.email).strip().lower()
    full_name = f"{data.first_name} {data.last_name}".strip()

    try:
        q = select(Patients).where(func.lower(Patients.email) == email_norm)
        res = await db.execute(q)
        patient = res.scalar_one_or_none()

        if patient:
            patient.email = email_norm
            patient.name = full_name
            patient.assigned_program = BE_SKAUSMO_14_PROGRAM
            patient.week = 1
            patient.access_allowed = True
            if not (patient.phone or "").strip():
                patient.phone = PRADZIA_PLACEHOLDER_PHONE
            if not (patient.login_alias or "").strip():
                local = email_norm.split("@", 1)[0]
                patient.login_alias = await _unique_login_alias(db, local, patient.id)
        else:
            local = email_norm.split("@", 1)[0]
            alias = await _unique_login_alias(db, local, None)
            patient = Patients(
                name=full_name,
                email=email_norm,
                phone=PRADZIA_PLACEHOLDER_PHONE,
                assigned_program=BE_SKAUSMO_14_PROGRAM,
                week=1,
                access_allowed=True,
                login_alias=alias,
                problem_situation="",
            )
            db.add(patient)
            await db.flush()

        db.add(
            PradziaOnboarding(
                patient_id=patient.id,
                email=email_norm,
                first_name=data.first_name,
                last_name=data.last_name,
                pain_before=data.pain_before,
                pain_after=data.pain_after,
                source="pradzia",
                routine_completed=True,
            )
        )

        # One baseline row so weekly lock does not trap new users on /progresas before first workout.
        cnt_q = select(func.count()).select_from(Weekly_progress).where(Weekly_progress.patient_id == patient.id)
        cnt_res = await db.execute(cnt_q)
        if (cnt_res.scalar() or 0) == 0:
            today = date.today().isoformat()
            db.add(
                Weekly_progress(
                    patient_id=patient.id,
                    week=1,
                    pain_avg=data.pain_after,
                    pain_spread="",
                    movement=5,
                    energy=5,
                    exercise_frequency=5,
                    entry_date=today,
                )
            )

        await db.commit()
        await db.refresh(patient)
        return patient

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error("pradzia_complete error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Serverio klaida. Bandykite dar kartą.") from e