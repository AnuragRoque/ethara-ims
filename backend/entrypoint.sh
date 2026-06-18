#!/bin/sh
# Backend container entrypoint:
#   1. apply database migrations  2. optionally seed demo data  3. serve the API
set -e

echo "==> Applying database migrations (alembic upgrade head)"
alembic upgrade head

if [ "${SEED_ON_STARTUP:-false}" = "true" ]; then
  echo "==> Seeding database (idempotent — skips rows that already exist)"
  python -m app.seed
fi

# Bind to $PORT when the host provides one (Render/Heroku); default to 8000 locally.
echo "==> Starting Gunicorn with Uvicorn workers on 0.0.0.0:${PORT:-8000}"
exec gunicorn app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${WEB_CONCURRENCY:-2}" \
  --access-logfile - \
  --error-logfile -
