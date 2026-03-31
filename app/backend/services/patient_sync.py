"""
Data sync service for patients and programs.
Ensures records in the database match the expected mock data.
Runs on startup to fix any stale/incorrect records from old seeds.
"""
import json
import logging
from pathlib import Path

from core.database import db_manager
from sqlalchemy import select, text
from models.patients import Patients

logger = logging.getLogger(__name__)

MOCK_DATA_DIR = Path(__file__).resolve().parent.parent / "mock_data"


async def sync_patients():
    """Sync patient records from mock_data/patients.json to the database.

    Updates existing records and inserts missing ones based on email match.
    """
    if not db_manager.engine:
        logger.warning("Database engine not ready; skipping patient sync")
        return

    patients_file = MOCK_DATA_DIR / "patients.json"
    if not patients_file.exists():
        logger.info("No patients.json found; skipping patient sync")
        return

    try:
        raw_records = json.loads(patients_file.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        logger.error("Invalid JSON in patients.json: %s", exc)
        return

    if not isinstance(raw_records, list) or not raw_records:
        logger.warning("patients.json is empty or not a list; skipping sync")
        return

    # Ensure new columns exist in the database
    try:
        async with db_manager.engine.begin() as conn:
            # Add login_alias column if it doesn't exist
            try:
                await conn.execute(text(
                    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS login_alias VARCHAR DEFAULT ''"
                ))
                logger.info("Ensured login_alias column exists")
            except Exception as col_err:
                logger.warning("Could not add login_alias column (may already exist): %s", col_err)

            # Add problem_situation column if it doesn't exist
            try:
                await conn.execute(text(
                    "ALTER TABLE patients ADD COLUMN IF NOT EXISTS problem_situation VARCHAR DEFAULT ''"
                ))
                logger.info("Ensured problem_situation column exists")
            except Exception as col_err:
                logger.warning("Could not add problem_situation column (may already exist): %s", col_err)
    except Exception as e:
        logger.error("Failed to ensure new columns: %s", e, exc_info=True)

    try:
        async with db_manager.async_session_maker() as session:
            async with session.begin():
                result = await session.execute(select(Patients))
                existing = {p.email.lower().strip(): p for p in result.scalars().all()}

                for record in raw_records:
                    email = record.get("email", "").strip().lower()
                    if not email:
                        continue

                    sync_fields = [
                        "name", "phone", "assigned_program", "week",
                        "access_allowed", "login_alias", "problem_situation"
                    ]

                    if email in existing:
                        patient = existing[email]
                        updated = False
                        for field in sync_fields:
                            new_val = record.get(field)
                            if new_val is not None:
                                current_val = getattr(patient, field, None)
                                if current_val != new_val:
                                    setattr(patient, field, new_val)
                                    updated = True
                        if updated:
                            logger.info("Updated patient record for %s", email)
                    else:
                        new_patient = Patients(
                            name=record.get("name", ""),
                            email=record.get("email", ""),
                            phone=record.get("phone", ""),
                            assigned_program=record.get("assigned_program", ""),
                            week=record.get("week", 1),
                            access_allowed=record.get("access_allowed", True),
                            login_alias=record.get("login_alias", ""),
                            problem_situation=record.get("problem_situation", ""),
                        )
                        session.add(new_patient)
                        logger.info("Inserted new patient record for %s", email)

        logger.info("Patient sync completed successfully")
    except Exception as e:
        logger.error("Patient sync failed: %s", e, exc_info=True)


async def sync_programs():
    """Sync program/exercise records from mock_data/programs.json to the database.

    This performs a full replace: deletes all existing program rows and re-inserts
    from the JSON file. This ensures exercise data is always up-to-date and
    program names match what patients expect.
    """
    if not db_manager.engine:
        logger.warning("Database engine not ready; skipping programs sync")
        return

    programs_file = MOCK_DATA_DIR / "programs.json"
    if not programs_file.exists():
        logger.info("No programs.json found; skipping programs sync")
        return

    try:
        raw_records = json.loads(programs_file.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        logger.error("Invalid JSON in programs.json: %s", exc)
        return

    if not isinstance(raw_records, list) or not raw_records:
        logger.warning("programs.json is empty or not a list; skipping sync")
        return

    try:
        async with db_manager.engine.begin() as conn:
            # Check what program names currently exist
            result = await conn.execute(text("SELECT DISTINCT program_name FROM programs"))
            existing_names = {row[0] for row in result.fetchall()}

            # Check what program names are in the JSON
            json_names = {r.get("program_name", "") for r in raw_records}

            # If there are old English names or missing Lithuanian names, do a full reseed
            old_english_names = {n for n in existing_names if "Program" in n and "programa" not in n.lower()}
            missing_names = json_names - existing_names

            if old_english_names or missing_names:
                logger.info(
                    "Programs need resync. Old names: %s, Missing: %s",
                    old_english_names, missing_names
                )
                # Delete all and re-insert
                await conn.execute(text("DELETE FROM programs"))
                logger.info("Cleared programs table for resync")

                # Insert all records from JSON
                for record in raw_records:
                    await conn.execute(
                        text(
                            "INSERT INTO programs "
                            "(program_name, week, exercise_group, exercise_group_emoji, "
                            "exercise_group_order, exercise_name, time_reps, video_link, "
                            "short_instruction, exercise_order) "
                            "VALUES (:program_name, :week, :exercise_group, :exercise_group_emoji, "
                            ":exercise_group_order, :exercise_name, :time_reps, :video_link, "
                            ":short_instruction, :exercise_order)"
                        ),
                        {
                            "program_name": record.get("program_name", ""),
                            "week": record.get("week", 1),
                            "exercise_group": record.get("exercise_group", ""),
                            "exercise_group_emoji": record.get("exercise_group_emoji", "📋"),
                            "exercise_group_order": record.get("exercise_group_order", 0),
                            "exercise_name": record.get("exercise_name", ""),
                            "time_reps": record.get("time_reps", ""),
                            "video_link": record.get("video_link", ""),
                            "short_instruction": record.get("short_instruction", ""),
                            "exercise_order": record.get("exercise_order", 0),
                        }
                    )

                logger.info("Inserted %d program records from programs.json", len(raw_records))
            else:
                logger.info("Programs data is up-to-date, no sync needed")

        logger.info("Programs sync completed successfully")
    except Exception as e:
        logger.error("Programs sync failed: %s", e, exc_info=True)