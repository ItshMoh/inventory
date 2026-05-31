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

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
