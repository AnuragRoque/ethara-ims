"""Pydantic request / response schemas for Customers."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerCreate(BaseModel):
    """Body for POST /customers."""

    full_name: str = Field(..., min_length=1, max_length=255, examples=["Ava Sharma"])
    email: EmailStr = Field(..., examples=["ava.sharma@example.com"])
    phone: str | None = Field(None, max_length=32, examples=["+1-555-0101"])


class CustomerRead(BaseModel):
    """Response model returned from customer endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    phone: str | None = None
    created_at: datetime
