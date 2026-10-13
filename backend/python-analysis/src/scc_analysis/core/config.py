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
    # 분석 모델이 답을 쓰기 전에 추론에 들이는 정도. 지원하는 값은 모델마다 다르다
    # (OpenAI 문서는 gpt-6-astra 가 none 을 받지 않는다고 적는다). 2026-10-13 같은 리뷰
    # 120건으로 한 번씩 잰 값은 medium(모델 기본값) 115초, low 68초였고 손님 유형과 근거
    # 수준은 비슷했다.
    openai_analysis_reasoning_effort: Literal[
        "none", "minimal", "low", "medium", "high", "xhigh", "max"
    ] = "low"
    openai_image_model: str = "gpt-image-2.5-sunburst"
    review_collection_limit: int = 120
    review_collection_timeout_seconds: int = 45


@lru_cache
def get_settings() -> Settings:
    return Settings()
