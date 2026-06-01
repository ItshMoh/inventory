from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Full SQLAlchemy database URL, e.g.
    # postgresql+psycopg2://user:password@host:5432/dbname
    database_url: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5432/inventory"
    )

    low_stock_threshold: int = 10

    # CORS: comma-separated list of allowed frontend origins.
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("database_url")
    @classmethod
    def _normalize_db_url(cls, v: str) -> str:
        # Hosts like Render hand out "postgres://..." which SQLAlchemy 2.0
        # rejects. Force the explicit psycopg2 driver for any plain scheme.
        if v.startswith("postgres://"):
            return "postgresql+psycopg2://" + v[len("postgres://") :]
        if v.startswith("postgresql://"):
            return "postgresql+psycopg2://" + v[len("postgresql://") :]
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
