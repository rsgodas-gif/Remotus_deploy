#!/usr/bin/env python3
"""
Safe operational script: replace one program_name + week slice in programs, update one patient's problem_situation.
Does not change patient.week or weekly_progress. SQLite only.

Env:
  REMOTUS_SQLITE_DB  — database path (default: /app/app.db)

Example:
  python scripts/upsert_patient_program_week_sqlite.py --patricija-week2 --dry-run
"""
from __future__ import annotations

import argparse
import json
import os
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Sequence, Tuple

# Default production path inside Railway service Remotus_deploy
DEFAULT_DB_PATH = "/app/app.db"
ENV_DB_VAR = "REMOTUS_SQLITE_DB"

# Unicode en dash — must match DB value exactly
DEFAULT_PATRICIJA_PROGRAM = "Personalizuota – Patricija J."

PATRICIJA_PROBLEM_W2 = "Krūtininės dalies mobilumo stoka ir mentės stabilumo sutrikimas"

# Order matches Exercise_Library.md descriptions + YouTube links; exercise_order 1..12
PATRICIJA_WEEK2_ROWS: List[Tuple[str, str, int, str, str, str, str]] = [
    # (group, emoji, group_order, exercise_name, time_reps, video_link, short_instruction)
    (
        "Apšilimas",
        "🔥",
        1,
        "Kelių permetimas gulint",
        "2x10",
        "https://youtu.be/gDJsRwBLYKQ?si=5quCGUeoVlFG43Pz",
        "Lying on the back, flexing knee till 90 degrees, then rotating it over the other leg, touching the other side of the floor (flexed leg over the extended one, crossing the extended one and touching the other side of the floor. Then using different leg to do the same (crossing while flex and touching other side).",
    ),
    (
        "Stabilizacija",
        "🧱",
        2,
        "Paukštis-šuo pratimas",
        "2x8",
        "https://youtu.be/bitPXu7LqHY?si=FfXEHsSg9VrO8qff",
        "On hands and knees extending opposite arm and leg, then iterating.",
    ),
    (
        "Stabilizacija",
        "🧱",
        2,
        "Šoninė lenta nuo kelių",
        "2x12s",
        "https://youtu.be/qT66F5Ps2dk?si=njxNG3ll8jZldxCi",
        "Side plank performed with knees on the ground.",
    ),
    (
        "Stabilizacija",
        "🧱",
        2,
        "Mentės pritraukimas stovint",
        "2x12",
        "https://youtu.be/J6g81-ovY38",
        "Stand upright with arms by your sides and gently pull your shoulder blades back and down, keeping the chest open and neck relaxed.",
    ),
    (
        "Stabilizacija",
        "🧱",
        2,
        "Mentės stūmimas stovint",
        "2x10",
        "https://youtube.com/shorts/-wxTRxm90_c?feature=share",
        "Stand with arms extended forward and gently push your shoulder blades forward without bending the elbows, then return to neutral.",
    ),
    (
        "Stabilizacija",
        "🧱",
        2,
        "Krūtinės pakėlimas gulint ant pilvo",
        "2x10",
        "https://youtu.be/_qDGzBPB3hA",
        "Lie face down and gently lift the chest slightly off the floor while keeping the pelvis and legs relaxed.",
    ),
    (
        "Krūtininė dalis",
        "📐",
        3,
        "Sieninis rankų slydimas aukštyn",
        "2x10",
        "https://youtube.com/shorts/sHO9iD0jEFc?feature=share",
        "Standing with your back against the wall, keep arms against the wall and slowly slide them upward overhead while maintaining contact.",
    ),
    (
        "Krūtininė dalis",
        "📐",
        3,
        "Atversta knyga gulint rankomis",
        "2x10",
        "https://youtu.be/cmSa-iSgoEA",
        "Lying on your side with knees bent and arms extended in front, rotate the top arm across the body and open the chest while following the hand with your eyes.",
    ),
    (
        "Krūtininė dalis",
        "📐",
        3,
        "Rankų kėlimas Y forma gulint",
        "2x10",
        "https://youtu.be/y5DJfj6qOP8",
        "Lie face down with arms extended overhead in a Y position and slowly lift them while maintaining a neutral spine.",
    ),
    (
        "Krūtininė dalis",
        "📐",
        3,
        "Rankų kėlimas T forma gulint",
        "2x10",
        "https://youtu.be/SFt4tBsl2Ck",
        "Lie face down with arms extended out to the sides in a T position and gently lift them off the ground while keeping the neck neutral.",
    ),
    (
        "Krūtininė dalis",
        "📐",
        3,
        "Rankų rotacijos gulint ant pilvo",
        "2x10",
        "https://youtu.be/_PBezgHtEIw",
        "Lie on your stomach with arms out to the sides and rotate them slowly up and down through the shoulder joint while keeping the torso stable.",
    ),
    (
        "Dekompresija",
        "🌿",
        4,
        "Vaiko poza",
        "2x45s",
        "https://youtu.be/_IDUZZ6uFdU?si=8UZtT-ixIHNsDbC1",
        "Kneeling with hips back and arms extended forward on the floor.",
    ),
]

INSERT_SQL = """
INSERT INTO programs (
    program_name, week,
    exercise_group, exercise_group_emoji, exercise_group_order,
    exercise_name, time_reps, video_link, short_instruction, exercise_order
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""


def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    return {k: row[k] for k in row.keys()}


def fetch_patient(conn: sqlite3.Connection, login_alias: str) -> sqlite3.Row | None:
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM patients WHERE login_alias = ?",
        (login_alias,),
    )
    return cur.fetchone()


def fetch_program_week(
    conn: sqlite3.Connection, program_name: str, week: int
) -> List[Dict[str, Any]]:
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(
        """
        SELECT * FROM programs
        WHERE program_name = ? AND week = ?
        ORDER BY exercise_order ASC, id ASC
        """,
        (program_name, week),
    )
    rows = cur.fetchall()
    return [row_to_dict(r) for r in rows]


def build_insert_rows(
    program_name: str, week: int, exercises: Sequence[Tuple[str, str, int, str, str, str, str]]
) -> List[Tuple[Any, ...]]:
    out: List[Tuple[Any, ...]] = []
    for i, (g, emoji, g_order, name, reps, link, instr) in enumerate(exercises, start=1):
        out.append(
            (
                program_name,
                week,
                g,
                emoji,
                g_order,
                name,
                reps,
                link,
                instr,
                i,
            )
        )
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="Upsert one program week in SQLite (single patient scope).")
    parser.add_argument("--db-path", default=None, help=f"SQLite file (default: env {ENV_DB_VAR} or {DEFAULT_DB_PATH})")
    parser.add_argument("--login-alias", default=None, help="Patient login_alias")
    parser.add_argument("--program-name", default=None, help="Must match patients.assigned_program")
    parser.add_argument("--week", type=int, default=None, help="Program week number to replace")
    parser.add_argument("--problem-situation", default=None, help="New problem_situation text for this patient")
    parser.add_argument(
        "--patricija-week2",
        action="store_true",
        help="Use hardcoded Patricija week 2 exercise payload and defaults (alias patricija.j, program name, week 2, problem text)",
    )
    parser.add_argument(
        "--backup-dir",
        default=".",
        help="Directory for JSON backup before writes (ignored on --dry-run)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Print plan only; no backup file, no DB writes")
    parser.add_argument(
        "--verify-only",
        action="store_true",
        help="Read-only: print patient + program rows for --login-alias and --week (uses assigned_program)",
    )
    args = parser.parse_args()

    db_path = args.db_path or os.environ.get(ENV_DB_VAR) or DEFAULT_DB_PATH
    db_path_p = Path(db_path)

    if args.verify_only:
        if not args.login_alias or args.week is None:
            print("--verify-only requires --login-alias and --week", file=sys.stderr)
            return 2
        if not db_path_p.exists():
            print(f"Database file not found: {db_path_p}", file=sys.stderr)
            return 1
        conn = sqlite3.connect(str(db_path_p))
        conn.row_factory = sqlite3.Row
        try:
            print("=== Verify-only (read-only) ===")
            print(f"Database file: {db_path_p.resolve()}")
            patient = fetch_patient(conn, args.login_alias)
            if patient is None:
                print(f"No patient login_alias={args.login_alias!r}")
                return 1
            pdict = {k: patient[k] for k in patient.keys()}
            print(
                "Patient identity: "
                f"id={pdict.get('id')} | name={pdict.get('name')!r} | login_alias={pdict.get('login_alias')!r}"
            )
            print(f"assigned_program: {pdict.get('assigned_program')!r}")
            print(f"patient.week (UI): {pdict.get('week')}")
            prog = pdict.get("assigned_program")
            rows = fetch_program_week(conn, prog, args.week)
            print(f"Target programs.week: {args.week} | existing row count: {len(rows)}")
            print("--- Full JSON ---")
            print(json.dumps({"patient": pdict, "program_name": prog, "week": args.week, "rows": rows}, ensure_ascii=False, indent=2))
        finally:
            conn.close()
        return 0

    if args.patricija_week2:
        args.login_alias = args.login_alias or "patricija.j"
        args.program_name = args.program_name or DEFAULT_PATRICIJA_PROGRAM
        args.week = 2 if args.week is None else args.week
        args.problem_situation = args.problem_situation or PATRICIJA_PROBLEM_W2
        exercises = PATRICIJA_WEEK2_ROWS
    else:
        exercises = []
        if args.week is None or not args.login_alias or not args.program_name or args.problem_situation is None:
            print("Without --patricija-week2, you must pass --login-alias, --program-name, --week, --problem-situation", file=sys.stderr)
            print("and implement custom exercise payload in script for non-Patricija runs.", file=sys.stderr)
            return 2

    if args.week is None or not args.login_alias or not args.program_name or args.problem_situation is None:
        print("Missing required arguments.", file=sys.stderr)
        return 2

    if not exercises:
        print("No exercise payload. Use --patricija-week2.", file=sys.stderr)
        return 2
    if not db_path_p.exists():
        print(f"Database file not found: {db_path_p}", file=sys.stderr)
        return 1

    conn = sqlite3.connect(str(db_path_p))
    conn.row_factory = sqlite3.Row
    try:
        print("=== Database file ===")
        print(str(db_path_p.resolve()))
        patient = fetch_patient(conn, args.login_alias)
        print("\n=== Target patient (identity) ===")
        if patient is None:
            print(f"No patient with login_alias={args.login_alias!r}")
            return 1
        pdict = {k: patient[k] for k in patient.keys()}
        print(
            "Patient identity: "
            f"id={pdict.get('id')} | name={pdict.get('name')!r} | login_alias={pdict.get('login_alias')!r}"
        )
        print(f"assigned_program: {pdict.get('assigned_program')!r}")
        print(f"patient.week (UI current week; NOT modified by this script): {pdict.get('week')}")
        print("\n--- Full patient row (before) ---")
        print(json.dumps(pdict, ensure_ascii=False, indent=2))

        if pdict.get("assigned_program") != args.program_name:
            print(
                f"\nABORT: assigned_program mismatch.\n  DB:  {pdict.get('assigned_program')!r}\n  Arg: {args.program_name!r}",
                file=sys.stderr,
            )
            return 1

        print("\n=== Target programs slice ===")
        print(f"program_name (must match assigned_program): {args.program_name!r}")
        print(f"week (programs.week to replace): {args.week}")

        existing = fetch_program_week(conn, args.program_name, args.week)
        existing_count = len(existing)
        print(f"\nExisting row count (programs for this name+week): {existing_count}")
        print("--- Existing rows (full) ---")
        print(json.dumps(existing, ensure_ascii=False, indent=2))

        insert_rows = build_insert_rows(args.program_name, args.week, exercises)
        insert_count = len(insert_rows)
        print("\n=== Planned changes ===")
        print(f"Will DELETE then INSERT: existing row count {existing_count} → inserted row count {insert_count}")
        print(f"Will UPDATE patients.problem_situation (where id={pdict['id']} AND login_alias={args.login_alias!r})")
        print(f"New problem_situation: {args.problem_situation!r}")
        print("patient.week: unchanged")

        if args.dry_run:
            print("\n=== Summary (dry-run) ===")
            print(f"Database: {db_path_p.resolve()}")
            print(f"Existing program rows: {existing_count} | Would insert: {insert_count}")
            print(f"Would set problem_situation to: {args.problem_situation!r}")
            print("[DRY-RUN] No backup written; no DB changes.")
            return 0

        backup = {
            "exported_at_utc": datetime.now(timezone.utc).isoformat(),
            "db_path": str(db_path_p.resolve()),
            "patient_before": pdict,
            "programs_before": existing,
        }
        backup_dir = Path(args.backup_dir)
        backup_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        safe_alias = "".join(c if c.isalnum() or c in "._-" else "_" for c in args.login_alias)
        backup_path = backup_dir / f"backup_program_week_{safe_alias}_w{args.week}_{ts}.json"
        backup_path.write_text(json.dumps(backup, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\nWrote backup: {backup_path.resolve()}")

        cur = conn.cursor()
        cur.execute("BEGIN IMMEDIATE")
        try:
            cur.execute(
                "DELETE FROM programs WHERE program_name = ? AND week = ?",
                (args.program_name, args.week),
            )
            deleted = cur.rowcount
            cur.executemany(INSERT_SQL, insert_rows)
            cur.execute(
                """
                UPDATE patients
                SET problem_situation = ?
                WHERE id = ? AND login_alias = ?
                """,
                (args.problem_situation, pdict["id"], args.login_alias),
            )
            if cur.rowcount != 1:
                raise RuntimeError(f"UPDATE patients expected 1 row, got {cur.rowcount}")
            conn.commit()
            print("\n=== Result (applied) ===")
            print(f"Database: {db_path_p.resolve()}")
            print(f"Patient identity: id={pdict['id']} | login_alias={args.login_alias!r}")
            print(f"programs: deleted {deleted} row(s), inserted {insert_count} row(s) (program_name + week={args.week})")
            print(f"patients.problem_situation updated to: {args.problem_situation!r}")
            print(f"patient.week (unchanged): {pdict.get('week')}")
        except Exception:
            conn.rollback()
            raise
    finally:
        conn.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
