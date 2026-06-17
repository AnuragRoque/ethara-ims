from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.order_item import OrderItem


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        # Second line of defence behind the application-level rules.
        CheckConstraint("price >= 0", name="ck_products_price_non_negative"),
        CheckConstraint("quantity >= 0", name="ck_products_quantity_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product")

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<Product id={self.id} sku={self.sku!r} qty={self.quantity}>"
