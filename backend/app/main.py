"""FastAPI application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.config import settings
from app.database import Base, engine
from app.routers import customers, dashboard, orders, products


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (idempotent). For real schema migrations a tool
    # like Alembic would be used, but create_all is sufficient here.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Inventory & Order Management System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    """Backstop for DB constraint violations not caught at the route level."""
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Database constraint violation"},
    )


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)
