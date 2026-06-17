"""Pydantic request / response schemas for Orders & Order Items."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# ── Order Item schemas ──────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    """A single line item in an order-creation request."""

    product_id: int = Field(..., examples=[1])
    quantity: int = Field(..., gt=0, examples=[2])


class OrderItemRead(BaseModel):
    """A line item as returned in order responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    subtotal: Decimal


# ── Order schemas ───────────────────────────────────────────────────

class OrderCreate(BaseModel):
    """Body for POST /orders."""

    customer_id: int = Field(..., examples=[1])
    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderRead(BaseModel):
    """Response model returned from order endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    total_amount: Decimal
    status: str
    created_at: datetime
    items: list[OrderItemRead] = []
