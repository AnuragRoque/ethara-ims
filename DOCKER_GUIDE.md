# Docker, Explained — How This Project Runs in Containers

A learning guide to the Phase 8 containerization of the Ethara Inventory Management System.
Read top to bottom; by the end you'll understand *every* file we added and *why*.

---

## 1. The 10-second mental model

Your app has **three separate programs** that must run together:

1. **PostgreSQL** — the database (stores products, customers, orders).
2. **FastAPI backend** — the API (business logic, talks to Postgres).
3. **React frontend** — the website (runs in the user's browser, talks to the API).

Without Docker, *you* would have to install Postgres, install Python + dependencies,
install Node, run migrations, start three terminals, and hope everyone's machine is set
up identically. **Docker packages each program with everything it needs into an "image",
and `docker compose` starts all three together with one command.**

```
            ┌─────────────────────────────────────────────┐
  Browser → │  frontend (Nginx :80)  →  serves the React   │
  :3000     │                            static files      │
            └─────────────────────────────────────────────┘
                              │  (browser then calls the API directly)
                              ▼
            ┌─────────────────────────────────────────────┐
  :8000  →  │  backend (Gunicorn + FastAPI :8000)         │
            └─────────────────────────────────────────────┘
                              │  (internal network, host "db")
                              ▼
            ┌─────────────────────────────────────────────┐
            │  db (PostgreSQL :5432)  →  named volume      │
            │                            "pgdata" on disk  │
            └─────────────────────────────────────────────┘
```

---

## 2. Vocabulary you need (just five words)

| Term | What it actually is | Real-world analogy |
|---|---|---|
| **Image** | A frozen, read-only snapshot of a program + its OS libraries + deps. | A cake recipe baked into a ready-to-ship box. |
| **Container** | A *running instance* of an image. | The actual cake you eat; you can bake many from one recipe. |
| **Dockerfile** | The script that *builds* an image, step by step. | The recipe card. |
| **Volume** | Disk storage that lives **outside** the container so data survives restarts. | An external hard drive you plug into different computers. |
| **Compose** | A YAML file that defines + starts multiple containers as one system. | The conductor coordinating the orchestra. |

Key idea: **containers are disposable.** Delete one, start a fresh one — identical every
time. That's the whole point. Anything you want to *keep* (the database) must live in a **volume**.

---

## 3. The files we added (the map)

```
ethara-inventory-management-system/
├── docker-compose.yml        ← the conductor: defines all 3 services
├── .env                      ← real secrets/config (NOT committed)
├── .env.example              ← template of what .env needs (committed)
├── .gitattributes            ← forces LF line endings on .sh (Windows safety)
│
├── backend/
│   ├── Dockerfile            ← recipe to build the API image
│   ├── entrypoint.sh         ← what runs when the API container starts
│   └── .dockerignore         ← files to keep OUT of the image
│
└── frontend/
    ├── Dockerfile            ← recipe to build the website image
    ├── nginx.conf            ← web-server config (SPA routing)
    └── .dockerignore
```

We'll now walk each one.

---

## 4. The backend image — `backend/Dockerfile`

This uses a **multi-stage build**. That means we use one throwaway image to *install* things,
then copy only the finished result into a smaller final image. Result: a lean image with no
build junk.

```dockerfile
# ── Stage 1: "builder" — install Python packages into a clean folder ──
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt ./
RUN pip install --prefix=/install -r requirements.txt
```

- `FROM python:3.12-slim` — start from a minimal official image that already has Python 3.12.
  `slim` = stripped down (no docs, no extra tools) → smaller, faster.
- `COPY requirements.txt ./` then `pip install` — we copy **only** the requirements file first,
  *not* the whole app. Why? **Docker layer caching.** Each line is a cached layer. As long as
  `requirements.txt` doesn't change, Docker reuses the cached "installed packages" layer and
  skips re-downloading everything — even if you edit your Python code. Huge speed win.
- `--prefix=/install` — dump the installed packages into `/install` so we can grab them in stage 2.

```dockerfile
# ── Stage 2: "runtime" — the actual image we ship ──
FROM python:3.12-slim AS runtime
COPY --from=builder /install /usr/local   # copy the installed packages over
WORKDIR /app
COPY . .                                   # now copy the application code
```

- `COPY --from=builder /install /usr/local` — pull the pre-installed packages from stage 1.
  The builder stage (with pip's caches, etc.) is **thrown away**; only this clean copy remains.

```dockerfile
RUN chmod +x entrypoint.sh \
    && useradd --create-home --uid 1000 appuser \
    && chown -R appuser:appuser /app
USER appuser
```

- **Security best practice: don't run as root.** We create a normal user `appuser` and switch to
  it with `USER appuser`. If the app is ever compromised, the attacker isn't root inside the container.
- `chmod +x entrypoint.sh` makes our startup script executable.

```dockerfile
EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
```

- `EXPOSE 8000` — documents that the app listens on port 8000 (informational).
- `ENTRYPOINT` — the command that runs when the container starts → our script (next section).

---

## 5. The backend startup script — `backend/entrypoint.sh`

A container needs to do three things *every time it boots*. We put them in order:

```sh
#!/bin/sh
set -e   # if any command fails, stop immediately (don't start a broken server)

# 1) Make the database schema match our code.
alembic upgrade head

# 2) (Optional) Put demo data in, but only if asked, and never duplicate it.
if [ "${SEED_ON_STARTUP:-false}" = "true" ]; then
  python -m app.seed
fi

# 3) Start the real web server.
exec gunicorn app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --workers "${WEB_CONCURRENCY:-2}"
```

Why each part matters:

- **`alembic upgrade head`** runs your database migrations. On a brand-new database this *creates
  all the tables*. On an existing one it does nothing. This is why a fresh `docker compose up`
  "just works" — the schema builds itself. (You saw this in the logs: `Running upgrade -> 9f276651ea3e`.)
- **Seeding** is guarded by `SEED_ON_STARTUP` and the seed script itself skips rows that already
  exist (it's *idempotent*). That's why restarting didn't create duplicate products.
- **`gunicorn ... UvicornWorker`** — Gunicorn is a battle-tested production server that runs
  multiple worker processes (here, 2). Each worker is a Uvicorn (ASGI) process running FastAPI.
  This is the production way to serve FastAPI — far more robust than `uvicorn --reload` (which is
  for local dev only).
- **`exec`** replaces the shell with gunicorn so signals (like "stop") reach gunicorn directly.

> 💡 **Why `.gitattributes` forces LF on `.sh`:** Windows editors love saving files with `CRLF`
> line endings. Linux shells choke on that (`entrypoint.sh: not found`). The `.gitattributes`
> rule guarantees the script keeps Unix (`LF`) endings no matter who clones the repo.

---

## 6. The frontend image — `frontend/Dockerfile`

The frontend is *also* multi-stage, but the two stages do very different jobs: **build the site**,
then **serve the site**.

```dockerfile
# ── Stage 1: build the React app into plain static files ──
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci                       # install exact dependency versions
COPY . .
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build                # → produces /app/dist (HTML/CSS/JS)
```

- `node:22-alpine` — Node.js on Alpine Linux (tiny). We only need Node to *build*; we won't ship it.
- `npm ci` — like `npm install` but stricter/faster, using `package-lock.json` for reproducibility.
- **`ARG VITE_API_BASE_URL`** — this is the important one. **Vite "bakes" environment variables
  into the JavaScript at build time.** The compiled site is just static files; it can't read env
  vars later. So the API URL must be supplied *now*, during the build, as a build argument.

```dockerfile
# ── Stage 2: serve those static files with Nginx ──
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- We throw away Node entirely and use **Nginx**, a fast, tiny web server, to serve the `dist/`
  folder. The final image has *no Node, no source code* — just static files + Nginx. Very small.
- `COPY --from=build /app/dist ...` grabs the built site from stage 1.

### Why the frontend talks to `localhost:8000`, not `backend:8000`

This trips everyone up. The React code runs in **your browser**, *not* inside the Docker network.
Your browser only knows about ports published to your host machine. So it calls
`http://localhost:8000` — which Compose maps to the backend container. The backend, by contrast,
runs *inside* the Docker network and reaches Postgres at the hostname `db` (see below).

---

## 7. The web-server config — `frontend/nginx.conf`

One block matters most:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

React Router does **client-side routing** — URLs like `/products` and `/orders` aren't real files
on disk; React draws them in the browser. But if a user refreshes on `/products`, the browser asks
Nginx for a file called `/products`, which doesn't exist → normally a 404.

`try_files $uri $uri/ /index.html` says: *"Try to find the requested file; if it doesn't exist,
fall back to `index.html`."* That hands control to React Router, which then renders the right page.
**This single line is what makes a single-page app work behind a real web server.**

The rest of the file just adds gzip compression and long-cache headers for the hashed asset files.

---

## 8. The conductor — `docker-compose.yml`

This file defines the three services and how they relate. Let's read it as three stories.

### Service `db` (PostgreSQL)

```yaml
db:
  image: postgres:16-alpine        # use the official image as-is (no Dockerfile needed)
  environment:
    POSTGRES_USER: ${POSTGRES_USER}        # values pulled from .env
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_DB: ${POSTGRES_DB}
  volumes:
    - pgdata:/var/lib/postgresql/data       # ← persistence lives here
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
```

- **`volumes: pgdata:/var/lib/postgresql/data`** is the magic. Postgres stores its data in
  `/var/lib/postgresql/data` *inside* the container. We mount the named volume `pgdata` there, so
  the data actually lives on your host's disk, **outside** the container. Delete/recreate the
  container → data is still there. That's why your product survived `down` then `up`.
- **`healthcheck`** runs `pg_isready` repeatedly. Postgres takes a few seconds to be ready to accept
  connections. The healthcheck lets other services *wait* for it (next service).

### Service `backend` (FastAPI)

```yaml
backend:
  build:
    context: ./backend            # build from backend/Dockerfile
  environment:
    DATABASE_URL: postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
    CORS_ORIGINS: ${CORS_ORIGINS:-http://localhost:3000}
    SEED_ON_STARTUP: ${SEED_ON_STARTUP:-true}
  depends_on:
    db:
      condition: service_healthy   # ← don't start until db's healthcheck passes
  ports:
    - "8000:8000"                  # host:container  →  localhost:8000 reaches the API
```

- **`@db:5432`** — notice the database host is literally **`db`**, the service name. Compose gives
  every service a DNS name on its private network equal to its name. So the backend finds Postgres at
  `db`. (Your browser can't use this name — only containers can.)
- **`depends_on: db: condition: service_healthy`** — the backend waits until Postgres is *actually
  ready*, not just started. This prevents the classic "connection refused on boot" race.
- **`ports: "8000:8000"`** — maps container port 8000 to your machine's port 8000. The left number
  is your host; the right is inside the container.
- **`${CORS_ORIGINS:-http://localhost:3000}`** — the `:-` provides a default if the var is unset.

### Service `frontend` (Nginx)

```yaml
frontend:
  build:
    context: ./frontend
    args:
      VITE_API_BASE_URL: ${VITE_API_BASE_URL:-http://localhost:8000}  # build-time, baked in
  depends_on:
    backend:
      condition: service_healthy
  ports:
    - "3000:80"                    # localhost:3000 → Nginx port 80
```

- The API URL is passed as a **build arg** (because Vite bakes it in at build time — section 6).
- Maps your `localhost:3000` to Nginx's internal port `80`.

### And the volume declaration

```yaml
volumes:
  pgdata:
```

This one line *declares* the named volume that the `db` service mounts. Docker creates and manages it.

---

## 9. Where the secrets live — `.env` vs `.env.example`

A grading criterion (and good practice) is **"no hardcoded credentials."** Here's how we satisfy it:

- **`.env`** — holds the *real* values (`POSTGRES_PASSWORD=...`). It is **git-ignored**, so it never
  gets committed. Compose automatically reads it and substitutes `${VARIABLES}` in the YAML.
- **`.env.example`** — a committed *template* with placeholder values (`change-me`). It documents
  every variable a new developer must set. To run the project, you copy it: `cp .env.example .env`
  and fill in real values.

So the repository contains **zero** real passwords, yet anyone can see exactly what's needed.

```
.env.example  (committed, placeholders)  ──copy──▶  .env  (local, real values, git-ignored)
                                                      │
                                          docker compose reads ${VARS}
                                                      ▼
                                          injected into containers as env vars
```

---

## 10. What actually happened when you ran `docker compose up`

The exact sequence (you can match this against the logs we saw):

1. **Compose reads `.env`** and substitutes all `${...}` values into the YAML.
2. **Builds images** (only if not already built): backend and frontend Dockerfiles run.
3. **Creates the `pgdata` volume** and the private network.
4. **Starts `db`** → runs `pg_isready` healthcheck until Postgres reports *healthy*.
5. **Starts `backend`** (waited for db healthy) → runs `entrypoint.sh`:
   `alembic upgrade head` (builds tables) → seed (6 products, 3 customers) → gunicorn starts.
   → its own healthcheck hits `/health` until *healthy*.
6. **Starts `frontend`** (waited for backend healthy) → Nginx serves the pre-built site.
7. You open `http://localhost:3000` (site) and `http://localhost:8000/docs` (API docs).

---

## 11. The commands you'll actually use (cheat sheet)

```bash
# Build images and start everything (detached / in the background)
docker compose up -d --build

# Watch logs (all services, live). Ctrl+C to stop watching (doesn't stop the app).
docker compose logs -f

# Logs for just one service
docker compose logs -f backend

# See what's running and whether it's healthy
docker compose ps

# Stop and remove containers + network — BUT KEEP the database volume
docker compose down

# Stop AND delete the database volume (wipes all data — fresh start next time)
docker compose down -v

# Rebuild after changing code (e.g. backend changes)
docker compose up -d --build backend

# Open a shell inside the running backend container (to poke around)
docker compose exec backend sh

# Run a one-off command, e.g. re-seed manually
docker compose exec backend python -m app.seed
```

**The two `down` variants are the ones to internalize:**
- `docker compose down` → safe; your data persists (volume kept).
- `docker compose down -v` → nuclear; deletes the `pgdata` volume and all rows.

---

## 12. How we proved it works (the acceptance test)

The headline requirement: *data must survive a restart.* We tested it literally:

1. `POST /products` a marker product → got `id: 7`.
2. `docker compose down` (containers destroyed, volume kept).
3. `docker compose up -d` (brand-new containers).
4. `GET /products/7` → **still there.** And the seed didn't duplicate (still 6 base products).

That confirms the named volume is doing its job and the boot sequence is idempotent.

---

## 13. Common gotchas (so future-you doesn't panic)

| Symptom | Cause | Fix |
|---|---|---|
| `entrypoint.sh: not found` | Script saved with Windows CRLF endings | The `.gitattributes` rule prevents this; if it slips, re-save as LF. |
| Frontend loads but API calls fail | `VITE_API_BASE_URL` baked wrong at build time | Rebuild frontend with the correct arg: `docker compose up --build frontend`. |
| `connection refused` to db on boot | App started before Postgres was ready | Already handled by `depends_on: condition: service_healthy`. |
| Port 3000/8000 already in use | Something else is using the port | Stop the other process, or change the host port in `ports:` (e.g. `"3001:80"`). |
| Changed code but container shows old behavior | Image not rebuilt | Add `--build`: `docker compose up -d --build`. |
| Data unexpectedly gone | You ran `down -v` | `-v` deletes the volume. Use plain `down` to keep data. |

---

## 14. Want to go deeper?

- **Layer caching:** reorder Dockerfile lines so the things that change *least* (dependencies)
  come *before* the things that change *most* (your source). That's why `COPY requirements.txt`
  comes before `COPY . .`.
- **Image size:** run `docker images` and compare. Multi-stage builds are why the final images are
  small — the build tools never make it into the shipped image.
- **`docker compose config`** — prints the fully-resolved compose file with all `${VARS}` filled in.
  Great for debugging "what value is actually being used?"

---

*Generated as part of Phase 8 (Containerization). Pair this with `PROJECT_PLAN.md` to see how
this phase fits the overall build.*
