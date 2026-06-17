"""Customer service — business logic for customer CRUD."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate


def list_customers(db: Session) -> list[Customer]:
    """Return all customers ordered by id."""
    return db.query(Customer).order_by(Customer.id).all()


def get_customer(db: Session, customer_id: int) -> Customer | None:
    """Return a single customer or ``None`` if not found."""
    return db.get(Customer, customer_id)


def create_customer(db: Session, payload: CustomerCreate) -> Customer:
    """Create a new customer.

    Raises ``IntegrityError`` (handled by the router) if the email is
    already taken.
    """
    customer = Customer(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer: Customer) -> None:
    """Delete a customer."""
    db.delete(customer)
    db.commit()
