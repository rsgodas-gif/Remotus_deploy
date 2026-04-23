import json
from collections import defaultdict
from datetime import date
from typing import List

from core.database import get_db
from fastapi import APIRouter, Depends, HTTPException
from models.patient_day_exercise_completion import PatientDayExerciseCompletion
from models.patient_day_submission import PatientDaySubmission
from models.patients import Patients
from models.program_days import ProgramDays
from pydantic import BaseModel, Field
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

PROGRAM_NAME = "Be skausmo-10"
TOTAL_DAYS = 10

router = APIRouter(prefix="/api/v1/be-skausmo-10", tags=["be-skausmo-10"])


class MarkExerciseRequest(BaseModel):
    patient_id: int
    day_number: int = Field(..., ge=1, le=TOTAL_DAYS)
    order_index: int = Field(..., ge=1)
    completed: bool = True


class SubmitDayPainRequest(BaseModel):
    patient_id: int
    day_number: int = Field(..., ge=1, le=TOTAL_DAYS)
    pain_today: int = Field(..., ge=0, le=10)


async def _get_patient_or_404(db: AsyncSession, patient_id: int) -> Patients:
    patient = (await db.execute(select(Patients).where(Patients.id == patient_id))).scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Pacientas nerastas")
    return patient


async def _get_unlocked_day(db: AsyncSession, patient_id: int) -> int:
    rows = (
        await db.execute(
            select(PatientDaySubmission.day_number)
            .where(
                and_(
                    PatientDaySubmission.patient_id == patient_id,
                    PatientDaySubmission.program_name == PROGRAM_NAME,
                )
            )
            .order_by(PatientDaySubmission.day_number.asc())
        )
    ).scalars().all()
    submitted = set(rows)
    unlocked = 1
    while unlocked in submitted and unlocked < TOTAL_DAYS:
        unlocked += 1
    if len(submitted) >= TOTAL_DAYS:
        return TOTAL_DAYS
    return unlocked


async def _load_state(db: AsyncSession, patient_id: int):
    exercises = (
        await db.execute(
            select(ProgramDays)
            .where(ProgramDays.program_name == PROGRAM_NAME)
            .order_by(ProgramDays.day_number.asc(), ProgramDays.order_index.asc())
        )
    ).scalars().all()

    completions = (
        await db.execute(
            select(PatientDayExerciseCompletion)
            .where(
                and_(
                    PatientDayExerciseCompletion.patient_id == patient_id,
                    PatientDayExerciseCompletion.program_name == PROGRAM_NAME,
                )
            )
        )
    ).scalars().all()
    completion_map = {(r.day_number, r.order_index): bool(r.completed) for r in completions}

    submissions = (
        await db.execute(
            select(PatientDaySubmission)
            .where(
                and_(
                    PatientDaySubmission.patient_id == patient_id,
                    PatientDaySubmission.program_name == PROGRAM_NAME,
                )
            )
            .order_by(PatientDaySubmission.day_number.asc())
        )
    ).scalars().all()
    submission_by_day = {s.day_number: s for s in submissions}

    unlocked_day = await _get_unlocked_day(db, patient_id)

    grouped = defaultdict(list)
    for ex in exercises:
        steps = []
        try:
            steps = json.loads(ex.instructions or "[]")
        except json.JSONDecodeError:
            steps = [ex.instructions] if ex.instructions else []
        grouped[ex.day_number].append(
            {
                "id": ex.id,
                "day_number": ex.day_number,
                "order_index": ex.order_index,
                "exercise_name": ex.exercise_name,
                "sets": ex.sets,
                "reps_or_time": ex.reps_or_time,
                "instructions": steps,
                "video_link": ex.video_link,
                "completed": completion_map.get((ex.day_number, ex.order_index), False),
            }
        )

    days = []
    for day in range(1, TOTAL_DAYS + 1):
        day_exercises = grouped.get(day, [])
        done_count = len([e for e in day_exercises if e["completed"]])
        all_done = len(day_exercises) > 0 and done_count == len(day_exercises)
        submitted = submission_by_day.get(day)
        is_completed = submitted is not None
        is_locked = day > unlocked_day
        days.append(
            {
                "day_number": day,
                "locked": is_locked,
                "completed": is_completed,
                "all_exercises_completed": all_done,
                "pain_today": submitted.pain_today if submitted else None,
                "submitted_at": submitted.submitted_at.isoformat() if submitted else None,
                "exercises": day_exercises,
            }
        )

    return {
        "program_name": PROGRAM_NAME,
        "title": "10 dienų programa",
        "unlocked_day": unlocked_day,
        "program_completed": len(submission_by_day) >= TOTAL_DAYS,
        "days": days,
    }


@router.get("/state")
async def get_state(patient_id: int, db: AsyncSession = Depends(get_db)):
    patient = await _get_patient_or_404(db, patient_id)
    if patient.assigned_program != PROGRAM_NAME:
        raise HTTPException(status_code=400, detail="Ši būsena skirta tik Be skausmo-10 programai")
    return await _load_state(db, patient_id)


@router.post("/exercises/complete")
async def mark_exercise_completed(payload: MarkExerciseRequest, db: AsyncSession = Depends(get_db)):
    patient = await _get_patient_or_404(db, payload.patient_id)
    if patient.assigned_program != PROGRAM_NAME:
        raise HTTPException(status_code=400, detail="Neteisinga programa")

    unlocked = await _get_unlocked_day(db, payload.patient_id)
    if payload.day_number > unlocked:
        raise HTTPException(status_code=400, detail="Diena užrakinta")

    ex = (
        await db.execute(
            select(ProgramDays).where(
                and_(
                    ProgramDays.program_name == PROGRAM_NAME,
                    ProgramDays.day_number == payload.day_number,
                    ProgramDays.order_index == payload.order_index,
                )
            )
        )
    ).scalar_one_or_none()
    if not ex:
        raise HTTPException(status_code=404, detail="Pratimas nerastas")

    existing = (
        await db.execute(
            select(PatientDayExerciseCompletion).where(
                and_(
                    PatientDayExerciseCompletion.patient_id == payload.patient_id,
                    PatientDayExerciseCompletion.program_name == PROGRAM_NAME,
                    PatientDayExerciseCompletion.day_number == payload.day_number,
                    PatientDayExerciseCompletion.order_index == payload.order_index,
                )
            )
        )
    ).scalar_one_or_none()

    if existing:
        existing.completed = payload.completed
    else:
        db.add(
            PatientDayExerciseCompletion(
                patient_id=payload.patient_id,
                program_name=PROGRAM_NAME,
                day_number=payload.day_number,
                order_index=payload.order_index,
                completed=payload.completed,
            )
        )
    await db.commit()
    return await _load_state(db, payload.patient_id)


@router.post("/submit-day")
async def submit_day(payload: SubmitDayPainRequest, db: AsyncSession = Depends(get_db)):
    patient = await _get_patient_or_404(db, payload.patient_id)
    if patient.assigned_program != PROGRAM_NAME:
        raise HTTPException(status_code=400, detail="Neteisinga programa")

    unlocked = await _get_unlocked_day(db, payload.patient_id)
    if payload.day_number != unlocked:
        raise HTTPException(status_code=400, detail="Galima pateikti tik atrakintą dieną")

    existing_submission = (
        await db.execute(
            select(PatientDaySubmission).where(
                and_(
                    PatientDaySubmission.patient_id == payload.patient_id,
                    PatientDaySubmission.program_name == PROGRAM_NAME,
                    PatientDaySubmission.day_number == payload.day_number,
                )
            )
        )
    ).scalar_one_or_none()
    if existing_submission:
        raise HTTPException(status_code=400, detail="Šios dienos įvertinimas jau pateiktas")

    total = (
        await db.execute(
            select(func.count()).select_from(ProgramDays).where(
                and_(ProgramDays.program_name == PROGRAM_NAME, ProgramDays.day_number == payload.day_number)
            )
        )
    ).scalar() or 0
    completed = (
        await db.execute(
            select(func.count()).select_from(PatientDayExerciseCompletion).where(
                and_(
                    PatientDayExerciseCompletion.patient_id == payload.patient_id,
                    PatientDayExerciseCompletion.program_name == PROGRAM_NAME,
                    PatientDayExerciseCompletion.day_number == payload.day_number,
                    PatientDayExerciseCompletion.completed == True,  # noqa: E712
                )
            )
        )
    ).scalar() or 0
    if total == 0 or completed < total:
        raise HTTPException(status_code=400, detail="Pirmiausia pažymėkite visus dienos pratimus")

    db.add(
        PatientDaySubmission(
            patient_id=payload.patient_id,
            program_name=PROGRAM_NAME,
            day_number=payload.day_number,
            pain_today=payload.pain_today,
        )
    )
    patient.week = min(payload.day_number + 1, TOTAL_DAYS)
    await db.commit()
    return await _load_state(db, payload.patient_id)
