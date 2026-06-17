"""Order service — business logic for order creation, listing, and deletion.

The critical transactional order-creation logic (stock validation,
``SELECT ... FOR UPDATE``, decrement, snapshot, and atomic commit) will
be implemented in Phase 3.  For now, this module exposes the function
signatures so routers can import them.
"""

from __future__ import annotations

from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate


def list_orders(db: Session) -> list[Order]:
    """Return all orders with their line items eagerly loaded."""
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .order_by(Order.id)
        .all()
    )


def get_order(db: Session, order_id: int) -> Order | None:
    """Return a single order (with items) or ``None``."""
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )


def create_order(db: Session, payload: OrderCreate) -> Order:
    """Create a new order — transactional, with stock validation."""
    customer = db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer {payload.customer_id} not found."
        )

    # Combine quantities for duplicate product_ids in the request
    product_quantities: dict[int, int] = {}
    for item in payload.items:
        product_quantities[item.product_id] = product_quantities.get(item.product_id, 0) + item.quantity

    # Sort product IDs to prevent deadlocks when taking row locks
    product_ids = sorted(list(product_quantities.keys()))

    # Fetch products and lock the rows
    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids))
        .order_by(Product.id)
        .with_for_update()
        .all()
    )
    product_map = {p.id: p for p in products}

    # Validate all requested products exist
    for pid in product_ids:
        if pid not in product_map:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {pid} not found."
            )

    total_amount = Decimal("0.00")
    order_items_to_create = []

    # Validate stock, decrement, and compute totals
    for pid, qty in product_quantities.items():
        product = product_map[pid]
        if product.quantity < qty:
            # We raise an HTTP exception, which will cause FastAPI to return a response
            # and SQLAlchemy's session to rollback the transaction, releasing the locks.
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). Requested: {qty}, Available: {product.quantity}."
            )
        
        product.quantity -= qty
        subtotal = product.price * qty
        total_amount += subtotal

        order_items_to_create.append(
            OrderItem(
                product_id=pid,
                quantity=qty,
                unit_price=product.price,
                subtotal=subtotal
            )
        )

    # Persist
    order = Order(
        customer_id=payload.customer_id,
        total_amount=total_amount,
        items=order_items_to_create
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    return order


def delete_order(db: Session, order: Order) -> None:
    """Cancel / delete an order and restock inventory."""
    # Sort product IDs to avoid deadlocks
    product_ids = sorted([item.product_id for item in order.items])
    
    if product_ids:
        # Take row locks on the products
        products = (
            db.query(Product)
            .filter(Product.id.in_(product_ids))
            .order_by(Product.id)
            .with_for_update()
            .all()
        )
        product_map = {p.id: p for p in products}

        # Increment stock back
        for item in order.items:
            if item.product_id in product_map:
                product_map[item.product_id].quantity += item.quantity

    db.delete(order)
    db.commit()
