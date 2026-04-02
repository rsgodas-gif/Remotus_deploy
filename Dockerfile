# Backend API (FastAPI). Build context = repository root so this works when Railway
# service has no "Root Directory" set (Railpack otherwise only sees app/ + vercel.json).
FROM python:3.12-slim-bookworm

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY app/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/backend .

EXPOSE 8000

# Railway sets PORT
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
