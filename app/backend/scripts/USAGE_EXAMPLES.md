# `upsert_patient_program_week_sqlite.py` — usage examples

Default DB: **`/app/app.db`**, or set **`REMOTUS_SQLITE_DB`**, or pass **`--db-path`**.

On Railway, run from the directory that contains **`scripts/`** (often **`/app`**):

```bash
cd /app
```

---

## Patricija — week 2 payload (dry-run)

```bash
python scripts/upsert_patient_program_week_sqlite.py \
  --db-path /app/app.db \
  --patricija-week2 \
  --dry-run
```

---

## Patricija — week 2 (apply, with backup under `/tmp`)

```bash
python scripts/upsert_patient_program_week_sqlite.py \
  --db-path /app/app.db \
  --patricija-week2 \
  --backup-dir /tmp
```

---

## Verify-only (read-only — after apply or anytime)

Uses **`patients.assigned_program`** automatically; only pass alias and program week to list:

```bash
python scripts/upsert_patient_program_week_sqlite.py \
  --db-path /app/app.db \
  --verify-only \
  --login-alias patricija.j \
  --week 2
```

---

## Railway one-liner (non-interactive SSH)

```bash
railway ssh -s Remotus_deploy -- \
  python /app/scripts/upsert_patient_program_week_sqlite.py \
  --db-path /app/app.db --patricija-week2 --dry-run
```

---

## Future: another patient / week (when payload exists)

Today, **non–Patricija** runs require a **hardcoded exercise list** in the script (or a future JSON flag). Once you add a tuple list or preset flag for that patient:

```bash
python scripts/upsert_patient_program_week_sqlite.py \
  --db-path /app/app.db \
  --login-alias OTHER.ALIAS \
  --program-name "Personalizuota – Exact Name J." \
  --week 3 \
  --problem-situation "Exact Lithuanian text" \
  --backup-dir /tmp
```

Until that payload exists in code, the script will exit with an error unless you use **`--patricija-week2`** or extend **`PATRICIJA_WEEK2_ROWS`** / add a new preset.

---

## Local machine against a copied `app.db` (optional)

```bash
cd app/backend
set REMOTUS_SQLITE_DB=C:\path\to\copy-of-app.db
python scripts/upsert_patient_program_week_sqlite.py --patricija-week2 --dry-run
```

Only use a **copy** of production for experiments; verify path before apply.
