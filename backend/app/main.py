"""Ethara Inventory Management System — FastAPI application entry point.

Start locally with:
    uvicorn app.main:app --reload --port 8000
"""

from __future__ import annotations

from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.database import engine
from app.routers import (
    customers_router,
    dashboard_router,
    orders_router,
    products_router,
)

logger = logging.getLogger(__name__)

# ── Lifespan ────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Verify DB connectivity once on startup."""
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("[OK] Database connection verified.")
    yield
    # Shutdown: nothing to clean up for now.
    engine.dispose()
    print("[STOP] Database connections disposed.")


# ── App ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="Ethara Inventory Management System",
    description=(
        "Production-ready inventory & order management API. "
        "Manage products, customers, and orders with full "
        "transactional stock management."
    ),
    version="0.1.0",
    lifespan=lifespan,
)


# ── Middleware ──────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Exception Handlers ──────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Return a uniform JSON structure for unhandled 500s instead of generic text."""
    logger.exception("Unhandled internal server error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )


# ── Routers ─────────────────────────────────────────────────────────

app.include_router(products_router)
app.include_router(customers_router)
app.include_router(orders_router)
app.include_router(dashboard_router)


# ── Health check ────────────────────────────────────────────────────

@app.get("/health", tags=["Health"], summary="Health check")
def health_check() -> dict[str, str]:
    """Returns 200 if the service is running."""
    return {"status": "healthy"}
