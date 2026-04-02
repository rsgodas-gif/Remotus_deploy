# Re:Motus — production database runbook

Operational facts (confirmed for the current live stack):

| Item | Value |
|------|--------|
| **Live backend** | Railway service **`Remotus_deploy`** |
| **Production database** | **SQLite** file **`/app/app.db`** inside that service’s container |
| **Not production** | Railway Postgres plugin **`Postgres-EKdv`** is **not** the live app database today. Do not run patient/program updates against it expecting the app to change. |

Local development often uses **`app/backend/app.db`** (or another path from `.env`). That file is **not** the same as **`/app/app.db`** on Railway unless you explicitly copy or sync it.

---

## Standard path for patient program week updates

Use the committed script (deployed with the backend):

**`scripts/upsert_patient_program_week_sqlite.py`**

See **`scripts/USAGE_EXAMPLES.md`** for copy-paste commands.

---

## Safe workflow (production)

1. **Deploy**  
   Merge/push the branch Railway builds so the script and any payload changes are in the image.

2. **`railway ssh`**  
   Connect to **`Remotus_deploy`** (or your linked service), e.g.  
   `railway ssh -s Remotus_deploy`

3. **Dry-run**  
   Run the script with **`--dry-run`** against **`/app/app.db`**. Confirm printed **patient**, **`assigned_program`**, and **target `programs.week`** match intent.

4. **Apply**  
   Run the same command **without** `--dry-run` (use **`--backup-dir`** such as `/tmp`). Confirm backup path printed.

5. **Verify**  
   Run **`--verify-only`** for the same **`login_alias`** and **`week`**, or spot-check in the app.

---

## Rules

1. **Never modify production by guessing the DB target.**  
   Confirm you are on **`Remotus_deploy`**, using **`/app/app.db`**, before any write.

2. **Always verify before apply:** patient row exists, **`login_alias`** correct, **`assigned_program`** equals the **`--program-name`** you pass, and the **program `week`** you replace is the one you intend (this is **`programs.week`**, not necessarily the same as **`patients.week`**).

3. **Do not assume local SQLite scripts hit production.**  
   `sync_patient_week_plans.py` and similar tools that read **local** `.env` / **`DATABASE_URL`** update **whatever file that URL points to** — usually **not** Railway’s **`/app/app.db`** unless you deliberately point them there.

4. **Postgres-EKdv**  
   Treat as unrelated to current live patient data until the architecture explicitly moves the app to Postgres.

---

## Quick reference — files on the live container

Typical layout:

- **`/app/main.py`**, **`/app/core/`**, **`/app/models/`** — backend root  
- **`/app/app.db`** — SQLite production database  
- **`/app/scripts/upsert_patient_program_week_sqlite.py`** — operational upsert (after deploy)

Override DB path only with **`--db-path`** or env **`REMOTUS_SQLITE_DB`** when you have a verified reason.
