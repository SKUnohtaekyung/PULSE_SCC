from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="SCC_",
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: Literal["local", "test", "production"] = "local"
    host: str = "127.0.0.1"
    port: int = 8000
    database_url: SecretStr | None = None
    service_token: SecretStr | None = None
    openai_api_key: SecretStr | None = None
    openai_analysis_model: str = "gpt-6-astra"
    openai_image_model: str = "gpt-image-2.5-sunburst"
    review_collection_limit: int = 120
    review_collection_timeout_seconds: int = 45


@lru_cache
def get_settings() -> Settings:
    return Settings()
