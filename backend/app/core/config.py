
from functools import lru_cache
from pathlib import Path

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[3]
ENV_FILE = REPO_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Preferred: a complete connection string (set in prod / compose).
    DATABASE_URL: str | None = None

    # Fallback parts for local dev when DATABASE_URL is not provided.
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "ethara_ims"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # Comma-separated list of origins the frontend is served from.
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://127.0.0.1:5173,http://127.0.0.1:5174"

    # Products below this quantity are flagged as low stock on the dashboard.
    LOW_STOCK_THRESHOLD: int = 10

    @computed_field  # type: ignore[prop-decorator]
    @property
    def sqlalchemy_url(self) -> str:
        """Resolve the SQLAlchemy connection URL, pinned to the psycopg (v3) driver."""
        if self.DATABASE_URL:
            return self._with_psycopg_driver(self.DATABASE_URL)
        return (
            f"postgresql+psycopg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @staticmethod
    def _with_psycopg_driver(url: str) -> str:
        """Force the psycopg (v3) driver on managed-host connection strings.

        Render/Heroku/Railway hand out ``postgres://`` or ``postgresql://`` URLs,
        which SQLAlchemy maps to the psycopg2 driver we don't install. Rewrite
        them to ``postgresql+psycopg://``. URLs that already name a driver
        (e.g. ``postgresql+psycopg://``) are left untouched.
        """
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://") :]
        if url.startswith("postgresql://"):
            url = "postgresql+psycopg://" + url[len("postgresql://") :]
        return url

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
