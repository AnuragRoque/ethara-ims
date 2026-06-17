"""Product service — business logic for product CRUD.

All functions accept a SQLAlchemy ``Session`` and return ORM model
instances (or raise appropriate HTTP exceptions).  Routers call these
functions; they should never contain direct DB queries themselves.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def list_products(db: Session) -> list[Product]:
    """Return all products ordered by id."""
    return db.query(Product).order_by(Product.id).all()


def get_product(db: Session, product_id: int) -> Product | None:
    """Return a single product or ``None`` if not found."""
    return db.get(Product, product_id)


def create_product(db: Session, payload: ProductCreate) -> Product:
    """Create a new product.

    Raises ``IntegrityError`` (handled by the router) if the SKU is
    already taken.
    """
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product: Product, payload: ProductUpdate) -> Product:
    """Apply partial updates to an existing product.

    The caller is responsible for fetching the product first and passing
    it in (so the router can return 404 before reaching this layer).
    """
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: Product) -> None:
    """Delete a product."""
    db.delete(product)
    db.commit()
