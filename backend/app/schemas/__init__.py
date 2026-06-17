"""Convenience re-exports for all Pydantic schemas."""

from app.schemas.customer import CustomerCreate, CustomerRead
from app.schemas.dashboard import DashboardStats, LowStockProduct
from app.schemas.order import OrderCreate, OrderItemCreate, OrderItemRead, OrderRead
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate

__all__ = [
    "CustomerCreate",
    "CustomerRead",
    "DashboardStats",
    "LowStockProduct",
    "OrderCreate",
    "OrderItemCreate",
    "OrderItemRead",
    "OrderRead",
    "ProductCreate",
    "ProductRead",
    "ProductUpdate",
]
