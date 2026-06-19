# Ethara Inventory Management System

A full-stack inventory and order management application. It handles products, customers,
and orders with proper transactional stock control, a summary dashboard, and a containerised
setup that runs the whole stack with a single command.

**Live demo**

- Frontend: https://ethara-ims-navy.vercel.app/
- Backend API (Swagger docs at `/docs`): https://ethara-backend-rjga.onrender.com/

> The backend runs on a free Render instance, so the first request after a period of
> inactivity can take 30–60 seconds to wake up. After that it responds normally.

---

## What it does

- Manage products (name, SKU, price, stock quantity) with full create/read/update/delete.
- Manage customers, with unique email enforcement.
- Place orders against multiple products at once. Stock is checked and decremented inside a
  single database transaction, and the order total is always computed on the server.
- A dashboard with summary counts and a low-stock list so you can see what needs reordering.

---

## Tech stack

**Backend**
- Python with FastAPI
- SQLAlchemy 2.0 (ORM) and Alembic (migrations)
- Pydantic v2 for request/response validation
- PostgreSQL, accessed through psycopg 3
- Uvicorn / Gunicorn for serving
- pytest for the business-logic tests

**Frontend**
- React 19 with Vite
- React Router for navigation
- TanStack Query and Axios for data fetching and caching
- Tailwind CSS for styling
- Recharts for the dashboard charts

**Infrastructure**
- Docker (multi-stage builds) and Docker Compose
- Render for the backend and managed Postgres, Vercel for the frontend

---

## Data model

Four tables. Orders reference multiple products through an `order_items` join table.

```
products       id, name, sku (unique), price, quantity, created_at, updated_at
customers      id, full_name, email (unique), phone, created_at
orders         id, customer_id (fk), total_amount, status, created_at
order_items    id, order_id (fk), product_id (fk), quantity, unit_price, subtotal
```

A few deliberate choices:

- `unit_price` is snapshotted onto each order item, so historical orders stay correct even if
  a product's price changes later.
- Database-level constraints (`unique` SKU/email, `quantity >= 0`, `price >= 0`) back up the
  application checks as a second line of defence.
- The stock check and decrement happen in one transaction with row locking, so two orders
  placed at the same time can't oversell the same product.

---

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/products` | Create product |
| GET | `/products` | List products |
| GET | `/products/{id}` | Get one product |
| PUT | `/products/{id}` | Update product |
| DELETE | `/products/{id}` | Delete product |
| POST | `/customers` | Create customer |
| GET | `/customers` | List customers |
| GET | `/customers/{id}` | Get one customer |
| DELETE | `/customers/{id}` | Delete customer |
| POST | `/orders` | Create order (checks stock, computes total) |
| GET | `/orders` | List orders |
| GET | `/orders/{id}` | Get order with line items |
| DELETE | `/orders/{id}` | Delete order |
| GET | `/dashboard/stats` | Counts and low-stock list |

Status codes follow the obvious conventions: 201 on create, 204 on delete, 404 for missing
records, 409 for conflicts (duplicate SKU or email), 400 for business-rule failures (such as
insufficient stock), and 422 for invalid request bodies. The full interactive contract is on
the `/docs` page.

---

## Running locally

### With Docker (recommended)

This is the simplest way and brings up Postgres, the backend, and the frontend together.

```bash
cp .env.example .env      # adjust values if you want
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000 (docs at http://localhost:8000/docs)

The database uses a named volume, so data survives `docker compose down` and a restart.

### Without Docker

Backend (needs a local PostgreSQL running):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head             # apply migrations
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

---

## Environment variables

Copy `.env.example` to `.env` and fill in real values. Nothing is hardcoded; everything
sensitive comes from the environment.

| Variable | Used by | Notes |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | db, backend | Database credentials |
| `DATABASE_URL` | backend | Full connection string; takes precedence when set (used in production) |
| `CORS_ORIGINS` | backend | Comma-separated list of allowed frontend origins |
| `LOW_STOCK_THRESHOLD` | backend | Quantity below which a product is flagged low stock (default 10) |
| `SEED_ON_STARTUP` | backend | Seeds demo data on first boot; set to `false` in production |
| `VITE_API_BASE_URL` | frontend | Backend URL, inlined into the build by Vite |

---

## Tests

The backend has pytest coverage for the high-risk paths: duplicate SKU, duplicate email,
insufficient-stock orders, and correct total/stock computation.

```bash
cd backend
pytest
```

---

## How it was built

The work was done in clear phases, finishing and verifying each one before moving to the next
rather than building everything at once.

**Phase 0 — Foundations.** Set up the monorepo layout (`/backend`, `/frontend`,
`docker-compose.yml`), the `.gitignore`, and the environment variables up front so secrets and
config were decided before any feature code.

**Phase 1 — Database design.** Modelled the four tables in SQLAlchemy with their constraints,
initialised Alembic, and generated the first migration so a fresh database could be built from
scratch.

**Phase 2 — Backend core.** Scaffolded FastAPI with a layered structure (models, schemas,
routers, services, config), wired up the database connection from the environment, added CORS
and a health check, and confirmed the Swagger docs rendered against a live database.

**Phase 3 — Feature APIs and business logic.** Built the full CRUD for products and customers
and the order endpoint, which is the core of the app: it validates references, checks stock,
decrements inventory, snapshots prices, and computes the total server-side, all in one
transaction. This is where most of the care went.

**Phase 4 — Hardening.** Added central exception handling for a consistent JSON error shape,
double-checked every status code, and wrote pytest tests for the business rules most likely to
break.

**Phase 5 — Frontend foundation.** Scaffolded the React app with Vite, set up routing, a single
Axios client driven by an environment variable, and the shared layout, table, modal, and toast
components.

**Phase 6 — Frontend features.** Built out the four screens: Products, Customers, Orders (with a
line-item builder and running total), and the Dashboard. Backend errors such as "insufficient
stock" are surfaced to the user instead of failing silently.

**Phase 7 — UI polish.** Made the layout responsive, added client-side form validation on top
of the server validation, and added loading and empty states, toasts, and consistent styling
throughout. The app also includes a chat-style assistant widget (currently a UI preview running
in demo mode).

**Phase 8 — Containerisation.** Wrote multi-stage Dockerfiles for both services (Nginx serves
the built frontend), added `.dockerignore` files, and composed the three services together with
a healthcheck on the database and a named volume for persistence. No credentials live in the
images.

**Phase 9 — Deployment.** Deployed the backend and a managed Postgres on Render and the
frontend on Vercel, then wired CORS and the API base URL on both sides so the two live
deployments talk to each other.

---

## Project structure

```
backend/
  app/
    core/         configuration
    models/       SQLAlchemy models
    schemas/      Pydantic schemas
    routers/      API endpoints
    services/     business logic
    main.py       app entry point
  alembic/        migrations
  tests/          pytest suite
frontend/
  src/
    api/          axios client
    components/    layout and reusable UI
    pages/        Dashboard, Products, Customers, Orders
docker-compose.yml
render.yaml
```
