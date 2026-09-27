import base64
import time
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
    reader_facing,
)


def _persona(
    rank: int = 1, topic_review_count: int = 1, label: str = "맛의 일관성을 보는 손님"
) -> PersonaOutput:
    evidence = [EvidenceReference(review_index=0, excerpt="음식이 맛있고 친절해요.")]
    return PersonaOutput(
        rank=rank,
        topic_review_count=topic_review_count,
        label=label,
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


def test_one_or_two_topics_are_returned_as_they_are() -> None:
    assert [p.rank for p in StructuredAnalysis(personas=[_persona()]).personas] == [1]
    two = StructuredAnalysis(personas=[_persona(1, 40, "가"), _persona(2, 20, "나")])
    assert [(p.rank, p.label) for p in two.personas] == [(1, "가"), (2, "나")]


def test_ranks_follow_topic_review_count() -> None:
    analysis = StructuredAnalysis(
        personas=[_persona(1, 12, "적은"), _persona(2, 56, "많은"), _persona(3, 30, "중간")]
    )

    assert [(p.rank, p.label) for p in analysis.personas] == [(1, "많은"), (2, "중간"), (3, "적은")]


def test_equal_topic_review_counts_keep_the_model_order() -> None:
    analysis = StructuredAnalysis(personas=[_persona(2, 30, "둘째"), _persona(1, 30, "첫째")])

    assert [(p.rank, p.label) for p in analysis.personas] == [(1, "첫째"), (2, "둘째")]


def test_more_than_three_topics_are_rejected() -> None:
    # rank 4 는 PersonaOutput 에서 먼저 막히므로, 목록 길이 제한만 따로 확인한다.
    personas = [_persona(rank, 10).model_dump() for rank in (1, 2, 3, 3)]

    with pytest.raises(ValidationError, match="at most 3"):
        StructuredAnalysis.model_validate({"personas": personas})


# 2026-09-28 실제 분석에서 사장님 화면에 그대로 나온 문장들이다.
_LEAKED_CAVEAT = (
    "실제 동반 방문과 동반 방문 추천·계획을 함께 집계했으며, 특정 인구집단의 선호로 "
    "일반화하지 않았습니다. 근거 리뷰: 0, 1, 3, 4, 6, 7, 8, 18, 21."
)
_LEAKED_LIMITATIONS = [
    "제공된 120개 항목 중 100~119는 앞선 리뷰와 본문이 동일하고 끝에 '접기'가 붙은 중복으로 "
    "판단해 제외했습니다. 집계 기준은 0~99의 100개 비중복 리뷰이며, 작성자가 서로 다른지는 "
    "확인할 수 없습니다.",
    "각 토픽의 caveat에 전체 집계 인덱스를 기재하고, insight와 advice에는 해당 설명의 대표 "
    "근거를 연결했습니다.",
    "토픽은 식사 사용 상황을 기준으로 분류했습니다. 한 리뷰는 여러 토픽에 포함될 수 있어 "
    "토픽별 수의 합은 전체 리뷰 수와 다릅니다.",
    "금정·산본 등 지점 언급이 섞여 있어 모든 메뉴, 리필 조건, 가격, 대기 경험이 한 지점에 "
    "동일하게 적용된다고 볼 수 없습니다.",
    "NEGATIVE는 확인된 대기와 행사 종료 아쉬움 등을 제한적으로 다뤘습니다. 쭈꾸미 양이 적다는 "
    "68번 리뷰는 단독 사례이므로 별도 토픽을 만들지 않았습니다. 제안의 효과나 매출 상승은 "
    "보장하지 않습니다.",
]


def test_caveat_drops_the_review_index_list() -> None:
    persona = _persona()
    persona = PersonaOutput.model_validate({**persona.model_dump(), "caveat": _LEAKED_CAVEAT})

    assert persona.caveat == (
        "실제 동반 방문과 동반 방문 추천·계획을 함께 집계했으며, 특정 인구집단의 선호로 "
        "일반화하지 않았습니다."
    )


def test_caveat_made_only_of_internal_detail_falls_back_to_a_plain_notice() -> None:
    persona = PersonaOutput.model_validate(
        {**_persona().model_dump(), "caveat": "근거 리뷰: 0, 1, 3, 4."}
    )

    assert (
        persona.caveat
        == "리뷰에서 반복된 상황을 묶은 유형이며 실제 개인이나 전체 손님을 뜻하지 않습니다."
    )


def test_limitations_keep_only_reader_facing_sentences() -> None:
    analysis = StructuredAnalysis(personas=[_persona()], limitations=_LEAKED_LIMITATIONS)

    assert analysis.limitations == [
        "금정·산본 등 지점 언급이 섞여 있어 모든 메뉴, 리필 조건, 가격, 대기 경험이 한 지점에 "
        "동일하게 적용된다고 볼 수 없습니다.",
        "제안의 효과나 매출 상승은 보장하지 않습니다.",
    ]


@pytest.mark.parametrize(
    "sentence",
    [
        "100~119가 중복으로 보여 제외했습니다.",
        "100~119를 제외했습니다.",
        "리뷰 100~119에서 중복이 보였습니다.",
        "0번~99번을 기준으로 했습니다.",
        "리뷰 [68]은 단독 사례입니다.",
        "#68 리뷰는 단독 사례입니다.",
        "리뷰 68번에서는 양이 적다고 했습니다.",
        "근거 리뷰 3, 7에서 확인됩니다.",
        "근거 리뷰: 0, 1, 3.",
        "0, 1, 3, 4번이 해당합니다.",
        "insight와 advice에 근거를 연결했습니다.",
        "NEGATIVE 관점은 제한적으로 다뤘습니다.",
        "토픽별 수의 합은 전체와 다릅니다.",
        "임베딩으로 비슷한 리뷰를 묶었습니다.",
        "RAG 지식은 쓰지 않았습니다.",
        # 2차 검토에서 나온 변형
        "68번은 단독 사례입니다.",
        "68번과 70번은 중복입니다.",
        "100번부터 119번까지는 중복입니다.",
        "100번대 이후는 중복입니다.",
        "근거는 0, 1, 3, 4번.",
        "리뷰(68)는 단독 사례입니다.",
        "Review 68은 단독 사례입니다.",
        "topic별로 나눴습니다.",
        "insights와 연결했습니다.",
        "review_fact에 적었습니다.",
        "ai_interpretation을 붙였습니다.",
        # 3차 검토에서 나온 변형
        "리뷰 3은 단독 사례입니다.",
        "리뷰3, 리뷰7에서 확인됩니다.",
        "근거: 3.",
    ],
)
def test_sentences_pointing_at_review_numbers_or_internal_terms_are_dropped(
    sentence: str,
) -> None:
    assert reader_facing(sentence) == ""


@pytest.mark.parametrize(
    "sentence",
    [
        "예약 후 30분 정도 기다린 사례가 있습니다.",
        "오후 2~3시에는 비교적 한산하다는 평가도 있습니다.",
        "2~3번째 방문한 손님이 많습니다.",
        "주 2~3번 방문한다는 단골 언급이 있습니다.",
        "3, 4, 5월 리뷰가 많습니다.",
        "메뉴는 9,000, 12,000, 15,000원대로 나뉩니다.",
        "단체 예약은 1,200,000원 이상이라는 언급이 있습니다.",
        "Positive한 분위기라는 말이 있습니다.",
        "리뷰 120건을 분석했습니다.",
        "1인, 2인, 4인 좌석 언급이 있습니다.",
        "평점 4.5점이라는 언급이 있습니다.",
        "2024.03.05 방문 리뷰가 있습니다.",
        "10~20% 할인 행사가 있었습니다.",
        "한 리뷰가 여러 손님 유형에 함께 들어가 유형별 리뷰 수의 합은 전체와 다를 수 있습니다.",
        # 2차 검토에서 나온 일반 문장. 단위 목록에 없는 단위와 조사가 붙은 횟수 표현이다.
        "가격대는 1~2만 원대입니다.",
        "1~2만원대 메뉴가 많습니다.",
        "2~3만원대 코스가 있습니다.",
        "5~6천원대 메뉴가 있습니다.",
        "2~3팀이 기다린 사례가 있습니다.",
        "소주 1~2병을 곁들였습니다.",
        "3~4가지 메뉴를 주문했습니다.",
        "2~3종 반찬이 나옵니다.",
        "2~3접시를 추가했다는 리뷰가 있습니다.",
        "1~2차 모임 장소로 언급됩니다.",
        "주 2~3번은 온다는 단골이 있습니다.",
        "하루 1~2번만 운영합니다.",
        "2~3번의 재방문 언급이 있습니다.",
        "리뷰 2~3개에서만 언급됩니다.",
        "근거 리뷰 2~3개에서만 확인됩니다.",
        "리뷰 10여 건에서 언급됩니다.",
        "리뷰 1,000건 이상이 쌓였습니다.",
        "1, 2, 3위 메뉴가 고르게 언급됩니다.",
        "11:30~13:00 사이 혼잡합니다.",
        # 3차 검토에서 나온 "근거" 문장. 이 도메인의 기본 어휘라 번호가 아니면 남아야 한다.
        "근거 리뷰가 1, 2월에 몰려 있습니다.",
        "근거 리뷰 중 2번 이상 방문했다는 언급은 적습니다.",
        "근거가 된 리뷰 3, 4건은 같은 날 작성되었습니다.",
        "근거 리뷰 중 1,2인 방문이 많습니다.",
        "근거 리뷰 12,000원 메뉴 언급이 많습니다.",
        "근거가 된 가격 12,000원 메뉴가 있습니다.",
        "근거로 든 메뉴는 1,000원 추가입니다.",
        "근거가 약해 3번째 방문 여부는 알 수 없습니다.",
        "근거가 약한 1, 2인 방문은 제외했습니다.",
    ],
)
def test_sentences_with_ordinary_numbers_are_kept(sentence: str) -> None:
    assert reader_facing(sentence) == sentence


def test_a_long_number_list_is_checked_quickly() -> None:
    started = time.perf_counter()

    assert reader_facing("1, " * 20000 + "1.") == ""
    assert time.perf_counter() - started < 1
