"""
One-off: set Patricija's problem_situation and current week for Week 2 rollout.
Does not touch other patients. Requires DATABASE_URL in backend .env (SQLite).
"""
import sqlite3
from pathlib import Path

from dotenv import load_dotenv

from sync_patient_week_plans import sqlite_path_from_database_url


def main() -> None:
    backend_dir = Path(__file__).resolve().parent.parent
    load_dotenv(backend_dir / ".env", override=True)
    import os

    database_url = (os.environ.get("DATABASE_URL") or os.environ.get("database_url") or "").strip()
    if not database_url:
        raise ValueError("DATABASE_URL/database_url missing. Set it in backend .env")
    db_path = sqlite_path_from_database_url(database_url)
    if not db_path.exists():
        raise FileNotFoundError(f"SQLite DB not found: {db_path}")

    conn = sqlite3.connect(str(db_path))
    try:
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE patients
            SET problem_situation = ?, week = ?
            WHERE login_alias = ?
            """,
            (
                "Krūtininės dalies mobilumo stoka ir mentės stabilumo sutrikimas",
                2,
                "patricija.j",
            ),
        )
        if cur.rowcount != 1:
            raise RuntimeError(f"Expected 1 row updated, got {cur.rowcount}")
        conn.commit()
        print("patricija.j: problem_situation + week updated.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
