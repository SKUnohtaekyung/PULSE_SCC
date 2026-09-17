import hmac

from fastapi import APIRouter, Header, HTTPException, status

from scc_analysis.analysis.models import AnalyzeRequest, AnalyzeResponse
from scc_analysis.analysis.openai_analyzer import AnalysisConfigurationError
from scc_analysis.analysis.pipeline import run_analysis
from scc_analysis.collection.naver import ReviewCollectionError
from scc_analysis.core.config import get_settings

router = APIRouter(tags=["analysis"])


def _authorize(service_token: str | None) -> None:
    configured = get_settings().service_token
    expected = configured.get_secret_value() if configured else ""
    if not expected or not service_token or not hmac.compare_digest(expected, service_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid service token"
        )


@router.post("/analysis-jobs", response_model=AnalyzeResponse)
async def analyze(
    request: AnalyzeRequest,
    x_scc_service_token: str | None = Header(default=None),
) -> AnalyzeResponse:
    _authorize(x_scc_service_token)
    try:
        return await run_analysis(request)
    except ReviewCollectionError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": error.code, "message": str(error), "retryable": error.retryable},
        ) from error
    except AnalysisConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "ANALYSIS_CONFIGURATION_MISSING",
                "message": str(error),
                "retryable": False,
            },
        ) from error
    except ValueError as error:
        if str(error).startswith("INSUFFICIENT_VALID_REVIEWS:"):
            count = int(str(error).split(":", maxsplit=1)[1])
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail={
                    "code": "INSUFFICIENT_VALID_REVIEWS",
                    "message": f"유효 리뷰가 {count}건으로 분석 기준 50건보다 적습니다.",
                    "retryable": False,
                },
            ) from error
        raise
