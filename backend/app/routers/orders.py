from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/orders", tags=["orders"])


def _get_order_or_404(db: Session, order_id: int) -> models.Order:
    order = db.get(models.Order, order_id)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found",
        )
    return order


@router.post("", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db)):
    # Validate customer.
    customer = db.get(models.Customer, payload.customer_id)
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer {payload.customer_id} not found",
        )

    
    requested: dict[int, int] = {}
    for item in payload.items:
        requested[item.product_id] = requested.get(item.product_id, 0) + item.quantity

    order = models.Order(customer_id=customer.id, total_amount=Decimal("0"))
    total = Decimal("0")

    for product_id, qty in requested.items():
        product = db.get(models.Product, product_id)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {product_id} not found",
            )
        if product.quantity < qty:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Insufficient stock for product '{product.name}' "
                    f"(requested {qty}, available {product.quantity})"
                ),
            )

        unit_price = product.price
        subtotal = unit_price * qty
        total += subtotal

        # Reduce available stock.
        product.quantity -= qty

        order.items.append(
            models.OrderItem(
                product_id=product.id,
                quantity=qty,
                unit_price=unit_price,
                subtotal=subtotal,
            )
        )

    order.total_amount = total
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=list[schemas.OrderOut])
def list_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).order_by(models.Order.id).all()


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    return _get_order_or_404(db, order_id)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = _get_order_or_404(db, order_id)
    # Cancelling an order returns its reserved stock to inventory.
    for item in order.items:
        product = db.get(models.Product, item.product_id)
        if product is not None:
            product.quantity += item.quantity
    db.delete(order)
    db.commit()
