import argparse
import re
import sqlite3
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from dotenv import load_dotenv


LIB_ROW_RE = re.compile(
    r"^\|\s*(\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*(https?://[^|]+)\|\s*$"
)
GROUP_RE = re.compile(r"^##\s*Group:\s*(.+?)\s*\|\s*emoji:\s*(.+?)\s*\|\s*order:\s*(\d+)\s*$")
EXERCISE_RE = re.compile(
    r"^-\s*id:\s*(\d+)\s*\|\s*time_reps:\s*([^|]+?)(?:\s*\|\s*short_instruction:\s*(.*))?$"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Sync patient week plans from Markdown into programs table (replace-only per program_name+week)."
    )
    parser.add_argument(
        "--library",
        default="../../docs/Exercise_Library.md",
        help="Path to Exercise_Library.md (default: ../../docs/Exercise_Library.md)",
    )
    parser.add_argument(
        "--plans-dir",
        default="../../docs/patient_plans",
        help="Path to patient plans directory (default: ../../docs/patient_plans)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Validate and print actions without writing DB.")
    return parser.parse_args()


def load_library(path: Path) -> Dict[int, Dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(f"Exercise library file not found: {path}")

    library: Dict[int, Dict[str, str]] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        match = LIB_ROW_RE.match(line.strip())
        if not match:
            continue
        exercise_id = int(match.group(1))
        library[exercise_id] = {
            "lt_name": match.group(2).strip(),
            "en_name": match.group(3).strip(),
            "description": match.group(4).strip(),
            "recommendation": match.group(5).strip(),
            "video_link": match.group(6).strip(),
        }
    if not library:
        raise ValueError("No exercise rows parsed from Exercise_Library.md")
    return library


def parse_plan(plan_path: Path) -> Tuple[str, int, List[Dict[str, object]]]:
    patient_alias: Optional[str] = None
    week: Optional[int] = None
    current_group: Optional[Dict[str, object]] = None
    rows: List[Dict[str, object]] = []

    for raw_line in plan_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("# ") or line.startswith("<!--"):
            continue

        if line.lower().startswith("patient_alias:"):
            patient_alias = line.split(":", 1)[1].strip()
            continue
        if line.lower().startswith("week:"):
            week = int(line.split(":", 1)[1].strip())
            continue

        group_match = GROUP_RE.match(line)
        if group_match:
            current_group = {
                "name": group_match.group(1).strip(),
                "emoji": group_match.group(2).strip(),
                "order": int(group_match.group(3)),
            }
            continue

        ex_match = EXERCISE_RE.match(line)
        if ex_match:
            if not current_group:
                raise ValueError(f"{plan_path}: Exercise row found before any group header")
            rows.append(
                {
                    "exercise_id": int(ex_match.group(1)),
                    "time_reps": ex_match.group(2).strip(),
                    "short_instruction_override": (ex_match.group(3) or "").strip(),
                    "group_name": current_group["name"],
                    "group_emoji": current_group["emoji"],
                    "group_order": current_group["order"],
                }
            )

    if not patient_alias:
        raise ValueError(f"{plan_path}: missing 'patient_alias:'")
    if week is None:
        raise ValueError(f"{plan_path}: missing 'week:'")
    if not rows:
        raise ValueError(f"{plan_path}: no exercises parsed")

    return patient_alias, week, rows


def sqlite_path_from_database_url(database_url: str) -> Path:
    # Expected: sqlite+aiosqlite:///./app.db or sqlite:///./app.db
    if not database_url.startswith("sqlite"):
        raise ValueError(
            "This script currently supports sqlite DATABASE_URL only "
            "(e.g. sqlite+aiosqlite:///./app.db)."
        )
    marker = ":///"
    if marker not in database_url:
        raise ValueError(f"Unexpected sqlite DATABASE_URL format: {database_url}")
    raw = database_url.split(marker, 1)[1]
    return Path(raw).expanduser().resolve()


def main() -> None:
    args = parse_args()
    script_dir = Path(__file__).resolve().parent
    backend_dir = script_dir.parent
    # Use project .env as authoritative source for this sync tool.
    load_dotenv(backend_dir / ".env", override=True)

    database_url = (
        __import__("os").environ.get("DATABASE_URL")
        or __import__("os").environ.get("database_url")
        or ""
    ).strip()
    if not database_url:
        raise ValueError("DATABASE_URL/database_url missing. Set it in backend .env")

    db_path = sqlite_path_from_database_url(database_url)
    if not db_path.exists():
        raise FileNotFoundError(f"SQLite DB not found: {db_path}")

    library_path = (script_dir / args.library).resolve()
    plans_dir = (script_dir / args.plans_dir).resolve()
    if not plans_dir.exists():
        raise FileNotFoundError(f"Plans directory not found: {plans_dir}")

    library = load_library(library_path)
    plan_files = sorted(plans_dir.glob("**/week-*.md"))
    if not plan_files:
        raise ValueError(f"No week plan files found under {plans_dir}")

    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()

    try:
        for plan_file in plan_files:
            patient_alias, week, plan_rows = parse_plan(plan_file)

            patient_row = cur.execute(
                "SELECT assigned_program FROM patients WHERE login_alias = ?",
                (patient_alias,),
            ).fetchone()
            if not patient_row:
                raise ValueError(f"{plan_file}: patient alias not found in DB: {patient_alias}")

            program_name = patient_row[0]
            final_rows = []
            for idx, item in enumerate(plan_rows, start=1):
                ex_id = item["exercise_id"]  # type: ignore[index]
                if ex_id not in library:
                    raise ValueError(f"{plan_file}: exercise id {ex_id} not found in Exercise_Library.md")
                ex = library[ex_id]
                final_rows.append(
                    (
                        program_name,
                        week,
                        item["group_name"],
                        item["group_emoji"],
                        item["group_order"],
                        ex["lt_name"],
                        item["time_reps"],
                        ex["video_link"],
                        item["short_instruction_override"] or ex["description"],
                        idx,
                    )
                )

            print(f"[PLAN] {patient_alias} -> {program_name} week {week} ({len(final_rows)} exercises)")

            if args.dry_run:
                continue

            # Rule 2: replace-only for this target scope
            cur.execute("DELETE FROM programs WHERE program_name = ? AND week = ?", (program_name, week))
            cur.executemany(
                """
                INSERT INTO programs (
                    program_name, week,
                    exercise_group, exercise_group_emoji, exercise_group_order,
                    exercise_name, time_reps, video_link, short_instruction, exercise_order
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                final_rows,
            )

        if args.dry_run:
            print("\nDry run complete. No DB changes were written.")
        else:
            conn.commit()
            print("\nSync complete. DB updated successfully.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
