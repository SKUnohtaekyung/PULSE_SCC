import hmac
import logging
import time

from fastapi import APIRouter, Header, HTTPException, status

from scc_analysis.analysis.models import AnalyzeRequest, AnalyzeResponse
from scc_analysis.analysis.openai_analyzer import AnalysisConfigurationError
from scc_analysis.analysis.pipeline import MINIMUM_VALID_REVIEWS, run_analysis
from scc_analysis.collection.naver import ReviewCollectionError
from scc_analysis.core.config import get_settings
from scc_analysis.core.logs import current_job_id

logger = logging.getLogger(__name__)
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
    started = time.monotonic()
    token = current_job_id.set(request.job_id)
    try:
        logger.info("분석 요청을 받았습니다.")
        response = await _run(request)
    except HTTPException as error:
        code = error.detail.get("code") if isinstance(error.detail, dict) else error.status_code
        logger.warning("분석이 실패했습니다: %s (%.0f초)", code, time.monotonic() - started)
        raise
    except Exception as error:
        # traceback 은 uvicorn 이 남긴다. 검증 오류에는 모델 출력·리뷰 인용이 들어 있을 수
        # 있어 여기서는 예외 이름만 남긴다.
        logger.warning(
            "분석이 실패했습니다: %s (%.0f초)", type(error).__name__, time.monotonic() - started
        )
        raise
    else:
        logger.info(
            "분석을 마쳤습니다: 유효 리뷰 %d건, 손님 유형 %d개 (%.0f초)",
            response.valid_review_count,
            len(response.analysis.personas),
            time.monotonic() - started,
        )
        return response
    finally:
        current_job_id.reset(token)


async def _run(request: AnalyzeRequest) -> AnalyzeResponse:
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
                    "message": f"유효 리뷰가 {count}건으로 분석 기준 {MINIMUM_VALID_REVIEWS}건보다 적습니다.",
                    "retryable": False,
                    # 앱이 '현재 N건 / 기준 50건'을 보여 줄 수 있게 구조화해 넘긴다(REVIEW-008).
                    "valid_review_count": count,
                    "minimum_valid_review_count": MINIMUM_VALID_REVIEWS,
                },
            ) from error
        raise
