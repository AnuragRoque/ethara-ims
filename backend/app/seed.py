

from __future__ import annotations

from decimal import Decimal

from app.database import SessionLocal
from app.models import Customer, Product

PRODUCTS = [
    {"name": "Mechanical Keyboard", "sku": "KB-MECH-87", "price": Decimal("89.99"), "quantity": 40},
    {"name": "Wireless Mouse", "sku": "MS-WL-200", "price": Decimal("29.50"), "quantity": 120},
    {"name": "27\" 4K Monitor", "sku": "MON-4K-27", "price": Decimal("329.00"), "quantity": 15},
    {"name": "USB-C Hub (7-in-1)", "sku": "HUB-USBC-7", "price": Decimal("45.00"), "quantity": 8},  # low stock
    {"name": "Noise-Cancelling Headphones", "sku": "HP-NC-900", "price": Decimal("199.99"), "quantity": 25},
    {"name": "Laptop Stand (Aluminium)", "sku": "STD-AL-01", "price": Decimal("39.95"), "quantity": 3},  # low stock
]

CUSTOMERS = [
    {"full_name": "Ava Sharma", "email": "ava.sharma@example.com", "phone": "+1-555-0101"},
    {"full_name": "Liam Patel", "email": "liam.patel@example.com", "phone": "+1-555-0102"},
    {"full_name": "Noah Kim", "email": "noah.kim@example.com", "phone": None},
]


def seed() -> None:
    with SessionLocal() as db:
        existing_skus = {sku for (sku,) in db.query(Product.sku).all()}
        new_products = [Product(**p) for p in PRODUCTS if p["sku"] not in existing_skus]
        db.add_all(new_products)

        existing_emails = {email for (email,) in db.query(Customer.email).all()}
        new_customers = [Customer(**c) for c in CUSTOMERS if c["email"] not in existing_emails]
        db.add_all(new_customers)

        db.commit()

        print(
            f"Seed complete: +{len(new_products)} products "
            f"(skipped {len(PRODUCTS) - len(new_products)}), "
            f"+{len(new_customers)} customers "
            f"(skipped {len(CUSTOMERS) - len(new_customers)})."
        )


if __name__ == "__main__":
    seed()
