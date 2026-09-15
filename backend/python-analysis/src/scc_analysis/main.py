from fastapi import FastAPI

from scc_analysis.api.health import router as health_router
from scc_analysis.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    docs_url = None if settings.environment == "production" else "/docs"

    application = FastAPI(
        title="SCC Analysis Service",
        version="0.1.0",
        docs_url=docs_url,
        redoc_url=None,
    )
    application.include_router(health_router, prefix="/internal/v1")
    return application


app = create_app()
