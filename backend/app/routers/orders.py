"""Orders router — endpoints for order management."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.order import OrderCreate, OrderRead
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post(
    "",
    response_model=OrderRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create an order",
)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
) -> OrderRead:
    # Full transactional logic (stock check, decrement, etc.) in Phase 3.
    order = order_service.create_order(db, payload)
    return order  # type: ignore[return-value]


@router.get(
    "",
    response_model=list[OrderRead],
    summary="List all orders",
)
def list_orders(db: Session = Depends(get_db)) -> list[OrderRead]:
    return order_service.list_orders(db)  # type: ignore[return-value]


@router.get(
    "/{order_id}",
    response_model=OrderRead,
    summary="Get an order with line items",
)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
) -> OrderRead:
    order = order_service.get_order(db, order_id)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found.",
        )
    return order  # type: ignore[return-value]


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete / cancel an order",
)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
):
    order = order_service.get_order(db, order_id)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found.",
        )
    order_service.delete_order(db, order)
