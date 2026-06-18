# syntax=docker/dockerfile:1

# ───────────────────────── Stage 1: build dependencies ─────────────────────────
# Install Python packages into an isolated prefix so the runtime image stays slim.
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app
COPY requirements.txt ./
RUN pip install --prefix=/install -r requirements.txt

# ───────────────────────────── Stage 2: runtime ────────────────────────────────
FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Bring in the pre-built dependencies only — no build tooling in the final image.
COPY --from=builder /install /usr/local

WORKDIR /app
COPY . .

# Run migrations + server as an unprivileged user (never root).
RUN chmod +x entrypoint.sh \
    && useradd --create-home --uid 1000 appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Applies Alembic migrations, optionally seeds, then launches Gunicorn/Uvicorn.
ENTRYPOINT ["./entrypoint.sh"]
