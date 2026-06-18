# Deployment Runbook — Phase 9

Goal: four working public links.

1. **GitHub repo** — `https://github.com/AnuragRoque/ethara-ims`
2. **Docker Hub image** — `docker.io/anurag2050/ethara-backend`
3. **Live backend API** (Render) — `https://<backend>.onrender.com/docs`
4. **Live frontend** (Vercel) — `https://<frontend>.vercel.app`

The stack: **Postgres + backend on Render**, **frontend on Vercel**, **backend image mirrored to Docker Hub**.

```
  Vercel (frontend)  ──HTTPS──▶  Render (backend API)  ──▶  Render (Postgres)
        ▲                                                         
        └── VITE_API_BASE_URL points here          CORS_ORIGINS points back at Vercel
```

> ⚠️ The two URLs must point at each other. Backend `CORS_ORIGINS` must include the Vercel URL,
> and the frontend's `VITE_API_BASE_URL` must be the Render URL. This is the #1 cause of
> "works locally, broken in prod."

---

## Prerequisites (one-time)

- A **GitHub** account with this repo pushed (already done).
- A free **Docker Hub** account → https://hub.docker.com
- A free **Render** account → https://render.com (sign in with GitHub)
- A free **Vercel** account → https://vercel.com (sign in with GitHub)

---

## Step 1 — Push the latest code to GitHub

Render and Vercel deploy *from GitHub*, so your deploy config (`render.yaml`, `vercel.json`,
the production fixes) must be on the remote first.

```powershell
git add -A
git commit -m "feat: deployment config (render blueprint, vercel, prod fixes)"
git push origin main
```

---

## Step 2 — Publish the backend image to Docker Hub

This satisfies the "published image" deliverable. The image is published under your Docker Hub
account `anurag2050` (already done in this project — commands shown for reference / re-publishing).

```powershell
# Log in (opens a browser or prompts for a Personal Access Token)
docker login

# Build the backend image for the standard linux/amd64 cloud platform
docker build -t anurag2050/ethara-backend:latest --platform linux/amd64 ./backend

# Push it
docker push anurag2050/ethara-backend:latest
```

Your public image link will be: `https://hub.docker.com/r/anurag2050/ethara-backend`

> 💡 `--platform linux/amd64` matters: most cloud hosts run amd64. Building on an ARM machine
> without this flag can produce an image they can't run.

---

## Step 3 — Deploy the backend + database on Render (Blueprint)

The repo includes [`render.yaml`](render.yaml), which provisions **both** a managed Postgres and
the backend in one go.

1. Render dashboard → **New** → **Blueprint**.
2. Connect your GitHub and pick the **ethara-ims** repo.
3. Render reads `render.yaml` and shows two resources: `ethara-db` (Postgres) and
   `ethara-backend` (web service). Click **Apply**.
4. Render will:
   - create the Postgres DB,
   - inject its connection string into the backend as `DATABASE_URL`,
   - build `backend/Dockerfile`,
   - run your `entrypoint.sh` → **migrations apply on boot**, demo data seeds, gunicorn starts.
5. Wait for the backend to go **Live**, then open `https://<backend>.onrender.com/docs`.
   You should see Swagger. Hit `GET /products` — seeded data should return.

> One value is intentionally left blank: **`CORS_ORIGINS`** (marked `sync: false`). You'll set it
> in Step 5 once you know the Vercel URL.

**Alternative (deploy the Docker Hub image instead of building):** New → Web Service → Deploy an
existing image → `docker.io/anurag2050/ethara-backend:latest`, then add a Render Postgres and set
`DATABASE_URL`, `CORS_ORIGINS`, `LOW_STOCK_THRESHOLD`, `SEED_ON_STARTUP` manually. The Blueprint
path above is simpler.

---

## Step 4 — Deploy the frontend on Vercel

1. Vercel dashboard → **Add New** → **Project** → import the **ethara-ims** repo.
2. **Root Directory:** set to **`frontend`** (important — the app isn't at the repo root).
3. Framework preset auto-detects **Vite**. Build command `npm run build`, output `dist`
   (already declared in [`frontend/vercel.json`](frontend/vercel.json), which also adds the SPA
   rewrite so React Router deep links work).
4. **Environment Variables** → add:
   | Name | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://<backend>.onrender.com`  *(your Render URL, no trailing slash)* |
5. **Deploy.** When done, note your URL, e.g. `https://ethara-ims.vercel.app`.

> Vite inlines `VITE_API_BASE_URL` at **build time**. If you change it later, you must
> **redeploy** the frontend for the new value to take effect.

---

## Step 5 — Wire CORS back (the part everyone forgets)

Now that you have the Vercel URL, tell the backend to trust it.

1. Render → `ethara-backend` → **Environment** → set:
   ```
   CORS_ORIGINS = https://ethara-ims.vercel.app
   ```
   (Use your real Vercel URL. Comma-separate if you have multiple, e.g. a preview domain.)
2. Save → Render redeploys the backend automatically.

---

## Step 6 — Verify the live system

From a **fresh browser tab** (not localhost):

- [ ] Open the Vercel URL → the dashboard loads with seeded data.
- [ ] Open browser DevTools → **Console** and **Network** → no CORS errors, no mixed-content warnings.
- [ ] Add a product → it appears (a real round-trip to Render + Postgres).
- [ ] Place an order with more quantity than stock → you see the "insufficient stock" error.
- [ ] Refresh on a deep route (e.g. `/orders`) → page loads (SPA rewrite working).
- [ ] Open `https://<backend>.onrender.com/docs` → Swagger works.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Frontend loads but every API call fails with a CORS error | `CORS_ORIGINS` doesn't include the exact Vercel URL | Set it in Render (Step 5); must match scheme + host exactly, no trailing slash. |
| API calls go to `localhost:8000` in production | `VITE_API_BASE_URL` not set at build time | Set it in Vercel env, then **redeploy** the frontend. |
| Backend boot crash: `No module named 'psycopg2'` | Raw `postgres://` URL hit the wrong driver | Already handled — our config rewrites it to `postgresql+psycopg://`. Confirm you deployed the latest commit. |
| Backend "deploy failed / no open ports detected" | App not binding to Render's `$PORT` | Already handled — `entrypoint.sh` binds `$PORT`. Confirm latest commit deployed. |
| First request after idle takes 30–60s | Render free tier cold-starts (service sleeps) | Expected on free tier. Wait it out, or upgrade. Warm it before a demo. |
| Render Postgres stopped working after a month | Free Postgres expires (~30 days) | Create a new free DB and update `DATABASE_URL`, or upgrade the plan. |

---

## The four links to submit (fill in once live)

```
GitHub:      https://github.com/AnuragRoque/ethara-ims
Docker Hub:  https://hub.docker.com/r/anurag2050/ethara-backend
Backend:     https://<backend>.onrender.com/docs
Frontend:    https://<frontend>.vercel.app
```
