from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/products", tags=["products"])


def _get_product_or_404(db: Session, product_id: int) -> models.Product:
    product = db.get(models.Product, product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found",
        )
    return product


@router.post("", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    if db.query(models.Product).filter(models.Product.sku == payload.sku).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"SKU '{payload.sku}' already exists",
        )
    product = models.Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=list[schemas.ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).order_by(models.Product.id).all()


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return _get_product_or_404(db, product_id)


@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    payload: schemas.ProductUpdate,
    db: Session = Depends(get_db),
):
    product = _get_product_or_404(db, product_id)
    data = payload.model_dump(exclude_unset=True)

    new_sku = data.get("sku")
    if new_sku and new_sku != product.sku:
        if db.query(models.Product).filter(models.Product.sku == new_sku).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"SKU '{new_sku}' already exists",
            )

    for field, value in data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = _get_product_or_404(db, product_id)
    if product.order_items:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a product that is referenced by existing orders",
        )
    db.delete(product)
    db.commit()
