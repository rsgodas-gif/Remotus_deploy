# Re:Motus

Patient-facing back pain rehabilitation app: React frontend, FastAPI backend, SQL database.

## Prerequisites

- **Node.js** 18+ and **pnpm** 8 (`corepack enable` or install pnpm globally)
- **Python** 3.11+ (3.10+ usually works) with `pip`
- A **`.env`** for the backend with at least **`DATABASE_URL`** (see below)

## Project layout

- `app/frontend` — Vite + React + TypeScript
- `app/backend` — FastAPI + SQLAlchemy (async)

## 1. Backend

```bash
cd app/backend
python -m venv .venv
```

Activate the venv (Windows PowerShell: `.\.venv\Scripts\Activate.ps1`), then:

```bash
pip install -r requirements.txt
copy .env.example .env
```

(On macOS/Linux use `cp .env.example .env`.)

Edit **`.env`** and set **`DATABASE_URL`**. For local SQLite:

```env
DATABASE_URL=sqlite+aiosqlite:///./app.db
```

Start the API (recommended local baseline: **8001**):

```bash
py -3.12 -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

Health check: `http://127.0.0.1:8001/health`

## 2. Frontend

In a second terminal:

```bash
cd app/frontend
pnpm install
copy .env.example .env.local
pnpm run dev
```

(On macOS/Linux use `cp .env.example .env.local`.)

Open **`http://localhost:3000`** (or the port shown in the terminal). Vite proxies **`/api`** to **`http://localhost:8000`**, so the browser can call the backend through the dev server.

If you build or preview without that proxy, set **`VITE_API_BASE_URL`** in `.env.local` to your backend origin (see `app/frontend/.env.example`).

Recommended frontend local env:

```env
VITE_API_BASE_URL=http://127.0.0.1:8001
VITE_PROXY_TARGET=http://127.0.0.1:8001
```

`VITE_PROXY_TARGET` controls the Vite dev proxy target for `/api/*`. Keep it aligned with the backend port.

## Runtime config (`/api/config`)

The SPA may fetch **`GET /api/config`** for `{ "API_BASE_URL": "..." }`. The FastAPI app serves this in development; if it fails, the client falls back to **`VITE_API_BASE_URL`** or **`http://127.0.0.1:8000`** (see `app/frontend/src/lib/config.ts`).

## Seed data

With an empty database, **`mock_data/*.json`** can populate **patients** and **programs** on startup (unless `MGX_IGNORE_INIT_DATA` is set). Adjust data there or in the DB for your environment.

## Documentation

- `app/backend/README.md` — backend template notes
- `app/frontend/README.md` — frontend stack notes

## Security note

This codebase was exported for self-hosting. Before exposing it to the public internet, review API authentication, CORS, and secrets. Pilot-style patient login is not production-grade security on its own.
