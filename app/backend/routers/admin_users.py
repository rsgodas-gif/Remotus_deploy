import os
from datetime import datetime, timezone
from typing import List, Optional

from core.database import get_db
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.patient_day_exercise_completion import PatientDayExerciseCompletion
from models.patient_day_submission import PatientDaySubmission
from models.patients import Patients
from models.pradzia_onboarding import PradziaOnboarding

router = APIRouter(prefix="/api/admin", tags=["admin-users"])


class AdminUserRow(BaseModel):
    patient_id: int
    name: str
    email: str
    login_alias: str
    assigned_program: str
    week: int
    access_allowed: bool
    pradzia_completed_at: Optional[str] = None
    completed_exercises_count: int
    submitted_days_count: int
    last_exercise_completed_at: Optional[str] = None
    last_day_submitted_at: Optional[str] = None
    last_activity: Optional[str] = None
    funnel_stage: str
    status: str


class AdminUsersResponse(BaseModel):
    environment: str
    users: List[AdminUserRow]


def _to_iso(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


def _activity_bucket(last_activity: datetime) -> str:
    now_utc = datetime.now(timezone.utc)
    if last_activity.tzinfo is None:
        last_activity = last_activity.replace(tzinfo=timezone.utc)
    days_ago = (now_utc - last_activity).days

    if days_ago <= 2:
        return "active"
    if 3 <= days_ago <= 5:
        return "at_risk"
    return "inactive"


def _environment_label() -> str:
    env = (os.getenv("ENVIRONMENT") or "").strip().lower()
    if env in {"prod", "production"}:
        return "production"
    if os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_PROJECT_ID"):
        return "production"
    return "local"


@router.get("/users", response_model=AdminUsersResponse)
async def get_admin_users(
    x_admin_password: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    expected_password = (os.getenv("ADMIN_PASSWORD") or "").strip()
    if not expected_password:
        raise HTTPException(status_code=500, detail="ADMIN_PASSWORD is not configured")
    if not x_admin_password or x_admin_password != expected_password:
        raise HTTPException(status_code=401, detail="Unauthorized")

    latest_pradzia_subq = (
        select(
            PradziaOnboarding.patient_id.label("patient_id"),
            func.max(PradziaOnboarding.completed_at).label("pradzia_completed_at"),
        )
        .group_by(PradziaOnboarding.patient_id)
        .subquery()
    )

    exercise_stats_subq = (
        select(
            PatientDayExerciseCompletion.patient_id.label("patient_id"),
            func.count(PatientDayExerciseCompletion.id).label("completed_exercises_count"),
            func.max(PatientDayExerciseCompletion.completed_at).label("last_exercise_completed_at"),
        )
        .where(PatientDayExerciseCompletion.completed == True)  # noqa: E712
        .group_by(PatientDayExerciseCompletion.patient_id)
        .subquery()
    )

    submission_stats_subq = (
        select(
            PatientDaySubmission.patient_id.label("patient_id"),
            func.count(PatientDaySubmission.id).label("submitted_days_count"),
            func.max(PatientDaySubmission.submitted_at).label("last_day_submitted_at"),
        )
        .group_by(PatientDaySubmission.patient_id)
        .subquery()
    )

    # No local payment/order persistence table exists right now, so paid_only stage is skipped.
    has_payment_order_records = False

    query = (
        select(
            Patients.id.label("patient_id"),
            Patients.name,
            Patients.email,
            Patients.login_alias,
            Patients.assigned_program,
            Patients.week,
            Patients.access_allowed,
            latest_pradzia_subq.c.pradzia_completed_at,
            exercise_stats_subq.c.completed_exercises_count,
            submission_stats_subq.c.submitted_days_count,
            exercise_stats_subq.c.last_exercise_completed_at,
            submission_stats_subq.c.last_day_submitted_at,
        )
        .outerjoin(latest_pradzia_subq, latest_pradzia_subq.c.patient_id == Patients.id)
        .outerjoin(exercise_stats_subq, exercise_stats_subq.c.patient_id == Patients.id)
        .outerjoin(submission_stats_subq, submission_stats_subq.c.patient_id == Patients.id)
        .order_by(latest_pradzia_subq.c.pradzia_completed_at.desc(), Patients.id.desc())
    )

    rows = (await db.execute(query)).all()

    response: List[AdminUserRow] = []
    for row in rows:
        pradzia_completed_at = row.pradzia_completed_at
        if not has_payment_order_records and pradzia_completed_at is None:
            # Skip users with no /pradzia row when paid-only stage cannot be derived.
            continue

        last_exercise_completed_at = row.last_exercise_completed_at
        last_day_submitted_at = row.last_day_submitted_at

        last_activity = None
        if last_exercise_completed_at and last_day_submitted_at:
            last_activity = max(last_exercise_completed_at, last_day_submitted_at)
        else:
            last_activity = last_exercise_completed_at or last_day_submitted_at

        completed_exercises_count = int(row.completed_exercises_count or 0)
        submitted_days_count = int(row.submitted_days_count or 0)

        if pradzia_completed_at is None and has_payment_order_records:
            funnel_stage = "paid_only"
        elif completed_exercises_count == 0 and submitted_days_count == 0:
            funnel_stage = "onboarded_no_activity"
        elif last_activity is not None:
            funnel_stage = _activity_bucket(last_activity)
        else:
            funnel_stage = "onboarded_no_activity"

        response.append(
            AdminUserRow(
                patient_id=row.patient_id,
                name=row.name,
                email=row.email,
                login_alias=row.login_alias or "",
                assigned_program=row.assigned_program,
                week=row.week,
                access_allowed=row.access_allowed,
                pradzia_completed_at=_to_iso(pradzia_completed_at),
                completed_exercises_count=completed_exercises_count,
                submitted_days_count=submitted_days_count,
                last_exercise_completed_at=_to_iso(last_exercise_completed_at),
                last_day_submitted_at=_to_iso(last_day_submitted_at),
                last_activity=_to_iso(last_activity),
                funnel_stage=funnel_stage,
                status=funnel_stage,
            )
        )

    return AdminUsersResponse(
        environment=_environment_label(),
        users=response,
    )
