"""Pydantic request / response schemas for Products."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    """Body for POST /products."""

    name: str = Field(..., min_length=1, max_length=255, examples=["Mechanical Keyboard"])
    sku: str = Field(..., min_length=1, max_length=64, examples=["KB-MECH-87"])
    price: Decimal = Field(..., ge=0, decimal_places=2, examples=[89.99])
    quantity: int = Field(..., ge=0, examples=[40])


class ProductUpdate(BaseModel):
    """Body for PUT /products/{id}.  All fields optional for partial updates."""

    name: str | None = Field(None, min_length=1, max_length=255)
    sku: str | None = Field(None, min_length=1, max_length=64)
    price: Decimal | None = Field(None, ge=0, decimal_places=2)
    quantity: int | None = Field(None, ge=0)


class ProductRead(BaseModel):
    """Response model returned from product endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sku: str
    price: Decimal
    quantity: int
    created_at: datetime
    updated_at: datetime | None = None
