import uvicorn

from scc_analysis.core.config import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "scc_analysis.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "local",
    )


if __name__ == "__main__":
    main()
