import asyncio
from datetime import UTC, date, datetime

from scc_analysis.analysis.models import AnalyzeRequest, AnalyzeResponse
from scc_analysis.analysis.openai_analyzer import OpenAiReviewAnalyzer, contains_old_reviews
from scc_analysis.collection.naver import NaverPublicReviewCollector
from scc_analysis.core.config import get_settings


async def run_analysis(request: AnalyzeRequest) -> AnalyzeResponse:
    settings = get_settings()
    collector = NaverPublicReviewCollector(
        limit=settings.review_collection_limit,
        timeout_seconds=settings.review_collection_timeout_seconds,
    )
    collected_at = datetime.now(UTC)
    reviews = await collector.collect(request.naver_place_url)
    if len(reviews) < 50:
        raise ValueError(f"INSUFFICIENT_VALID_REVIEWS:{len(reviews)}")
    analyzer = OpenAiReviewAnalyzer(
        api_key=settings.openai_api_key.get_secret_value() if settings.openai_api_key else None,
        analysis_model=settings.openai_analysis_model,
        image_model=settings.openai_image_model,
    )
    analysis, images = await asyncio.to_thread(analyzer.analyze, reviews)
    return AnalyzeResponse(
        job_id=request.job_id,
        collected_review_count=len(reviews),
        valid_review_count=len(reviews),
        contains_reviews_older_than_two_years=contains_old_reviews(reviews, date.today()),
        collected_at=collected_at,
        analyzed_at=datetime.now(UTC),
        reviews=reviews,
        analysis=analysis,
        images=images,
        model_versions={
            "analysis": settings.openai_analysis_model,
            "image": settings.openai_image_model,
        },
    )
