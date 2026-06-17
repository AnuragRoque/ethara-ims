"""Dashboard service — aggregated stats for the front page."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.customer import Customer
from app.models.order import Order
from app.models.product import Product
from app.schemas.dashboard import DashboardStats, LowStockProduct


def get_dashboard_stats(db: Session) -> DashboardStats:
    """Compute and return summary statistics."""
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()

    low_stock_rows = (
        db.query(Product)
        .filter(Product.quantity < settings.LOW_STOCK_THRESHOLD)
        .order_by(Product.quantity)
        .all()
    )

    return DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=[
            LowStockProduct.model_validate(p) for p in low_stock_rows
        ],
    )
