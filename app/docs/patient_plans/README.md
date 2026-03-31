# Patient Week Plan Inputs

These Markdown files are **editing inputs** only.

- Rule 1: Markdown is for editing. **DB is runtime source of truth**.
- Rule 2: Sync uses **replace-only per patient+week scope** (no blind append).

Runtime flow:

1. `Exercise_Library.md` + files in this folder
2. `backend/scripts/sync_patient_week_plans.py`
3. writes `programs` table in DB
4. frontend reads DB and renders exercises

## File naming

Use one file per patient alias and week:

- `rimute.b/week-02.md`
- `sigita.s/week-02.md`
- `alina.g/week-02.md`
- `rita.l/week-02.md`
- `laura.r/week-02.md`

## Required format

```md
# Patient Week Plan
patient_alias: rimute.b
week: 2

## Group: Aktyvacija | emoji: 🔹 | order: 1
- id: 7 | time_reps: 2x8 kvėpavimo ciklai | short_instruction: Lėtai, ramiai kvėpuoti.
- id: 24 | time_reps: 2x10

## Group: Stabilizacija | emoji: 🧱 | order: 2
- id: 30 | time_reps: 3x10
- id: 13 | time_reps: 3x20s
```

`id` must exist in `app/docs/Exercise_Library.md`.

## Sync commands

From `app/backend`:

```bash
py -3.12 scripts/sync_patient_week_plans.py --dry-run
py -3.12 scripts/sync_patient_week_plans.py
```
