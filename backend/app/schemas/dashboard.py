"""Pydantic response schemas for the Dashboard."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class LowStockProduct(BaseModel):
    """A product whose quantity is below the configured threshold."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sku: str
    quantity: int


class DashboardStats(BaseModel):
    """Response for GET /dashboard/stats."""

    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: list[LowStockProduct] = []
