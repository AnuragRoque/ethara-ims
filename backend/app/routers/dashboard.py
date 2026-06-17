"""Dashboard router — aggregate stats endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.dashboard import DashboardStats
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/stats",
    response_model=DashboardStats,
    summary="Get dashboard statistics",
)
def get_stats(db: Session = Depends(get_db)) -> DashboardStats:
    return dashboard_service.get_dashboard_stats(db)
