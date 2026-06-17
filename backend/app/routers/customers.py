"""Customers router — CRUD endpoints for customers."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.customer import CustomerCreate, CustomerRead
from app.services import customer_service

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post(
    "",
    response_model=CustomerRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a customer",
)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
) -> CustomerRead:
    try:
        customer = customer_service.create_customer(db, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A customer with email '{payload.email}' already exists.",
        )
    return customer  # type: ignore[return-value]


@router.get(
    "",
    response_model=list[CustomerRead],
    summary="List all customers",
)
def list_customers(db: Session = Depends(get_db)) -> list[CustomerRead]:
    return customer_service.list_customers(db)  # type: ignore[return-value]


@router.get(
    "/{customer_id}",
    response_model=CustomerRead,
    summary="Get a customer by ID",
)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
) -> CustomerRead:
    customer = customer_service.get_customer(db, customer_id)
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer {customer_id} not found.",
        )
    return customer  # type: ignore[return-value]


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete a customer",
)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):
    customer = customer_service.get_customer(db, customer_id)
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer {customer_id} not found.",
        )
    customer_service.delete_customer(db, customer)
