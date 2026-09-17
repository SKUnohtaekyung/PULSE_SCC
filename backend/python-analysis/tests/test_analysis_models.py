import base64
from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from scc_analysis.analysis.models import (
    AdviceOutput,
    AnalyzeResponse,
    CollectedReview,
    EvidenceReference,
    InsightOutput,
    PersonaImage,
    PersonaOutput,
    StructuredAnalysis,
)


def _persona() -> PersonaOutput:
    evidence = [EvidenceReference(review_index=0, excerpt="음식이 맛있고 친절해요.")]
    return PersonaOutput(
        rank=1,
        topic_review_count=1,
        label="맛의 일관성을 보는 손님",
        summary="대표 메뉴 경험을 중요하게 보는 상황",
        caveat="실제 개인이나 전체 고객 구성을 의미하지 않습니다.",
        image_prompt="대표 메뉴를 살피는 식사 상황",
        image_alt_text="대표 메뉴를 살피는 가상 손님 상황",
        insights=[
            InsightOutput(
                kind=kind,
                review_fact="리뷰에서 확인된 사실",
                ai_interpretation="가능성",
                evidence=evidence,
            )
            for kind in ("POSITIVE", "NEGATIVE", "PERCEPTION", "PRIORITY")
        ],
        advice=[
            AdviceOutput(
                review_fact="사실",
                suggested_action="검토 행동",
                ai_interpretation="해석",
                evidence=evidence,
            )
        ],
    )


def test_response_rejects_evidence_outside_review_collection() -> None:
    persona = _persona()
    persona.insights[0].evidence[0].review_index = 1
    now = datetime.now(UTC)
    with pytest.raises(ValidationError):
        AnalyzeResponse(
            job_id="job",
            collected_review_count=1,
            valid_review_count=1,
            contains_reviews_older_than_two_years=False,
            collected_at=now,
            analyzed_at=now,
            reviews=[
                CollectedReview(content="review", normalized_content="review", content_hash="hash")
            ],
            analysis=StructuredAnalysis(personas=[persona]),
            images=[PersonaImage(rank=1, content_base64=base64.b64encode(b"png").decode())],
        )
