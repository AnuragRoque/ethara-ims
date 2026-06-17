"""Products router — CRUD endpoints for inventory products."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.services import product_service

router = APIRouter(prefix="/products", tags=["Products"])


@router.post(
    "",
    response_model=ProductRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a product",
)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
) -> ProductRead:
    try:
        product = product_service.create_product(db, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A product with SKU '{payload.sku}' already exists.",
        )
    return product  # type: ignore[return-value]


@router.get(
    "",
    response_model=list[ProductRead],
    summary="List all products",
)
def list_products(db: Session = Depends(get_db)) -> list[ProductRead]:
    return product_service.list_products(db)  # type: ignore[return-value]


@router.get(
    "/{product_id}",
    response_model=ProductRead,
    summary="Get a product by ID",
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
) -> ProductRead:
    product = product_service.get_product(db, product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found.",
        )
    return product  # type: ignore[return-value]


@router.put(
    "/{product_id}",
    response_model=ProductRead,
    summary="Update a product",
)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
) -> ProductRead:
    product = product_service.get_product(db, product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found.",
        )
    try:
        updated = product_service.update_product(db, product, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A product with SKU '{payload.sku}' already exists.",
        )
    return updated  # type: ignore[return-value]


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete a product",
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = product_service.get_product(db, product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found.",
        )
    product_service.delete_product(db, product)
