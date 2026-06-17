"""Router package — exposes each feature router for main.py to include."""

from app.routers.customers import router as customers_router
from app.routers.dashboard import router as dashboard_router
from app.routers.orders import router as orders_router
from app.routers.products import router as products_router

__all__ = [
    "customers_router",
    "dashboard_router",
    "orders_router",
    "products_router",
]
