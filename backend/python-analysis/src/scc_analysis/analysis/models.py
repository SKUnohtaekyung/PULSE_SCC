import re
from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

Industry = Literal["한식", "중식", "일식", "양식", "카페/디저트", "주점", "기타"]
InsightKind = Literal["POSITIVE", "NEGATIVE", "PERCEPTION", "PRIORITY"]

# 사장님이 읽는 문장(caveat, limitations)에 새면 안 되는 내부 표현. 모델에게도 쓰지 말라고
# 지시하지만 어길 때가 있어 한 번 더 거른다(기능명세 RESULT-007 쉬운 표현).
#
# 분석기는 리뷰를 "[번호] 본문" 으로 넘기므로 모델이 그 번호를 문장에 옮겨 적는다. 그런데 방문
# 횟수·시간·가격처럼 사장님이 읽어야 할 숫자도 같은 모양이다. 숫자 뒤에 올 수 있는 단위는 끝이
# 없으므로(팀·병·가지·만 원 …) 단위를 허용하는 대신, 숫자 바로 뒤에 조사가 붙어 숫자 자체가
# 가리키는 대상으로 쓰였을 때("100~119는", "68번은")만 리뷰 번호로 본다.
# 조사 뒤에는 공백이나 문장 끝이 온다. 그래야 "3~4가지"의 "가"를 조사로 읽지 않는다.
_PARTICLE = (
    r"(?:은|는|이|가|을|를|의|에서|에게|에|까지|와|과|으로|로|도|부터|만(?!\s*원))"
    r"(?:은|는|도|만)?(?=\s|$|[.,!?)])"
)
_ENDS_AS_NOUN = r"(?=" + _PARTICLE + r"|\s*[.,!?)]|\s*$)"
_INTERNAL_PATTERNS = (
    r"\[\s*\d+\s*\]",  # [68] — 분석기가 리뷰에 붙이는 번호 형식
    r"#\s*\d+",
    r"리뷰\s*\(\s*\d+\s*\)",  # 리뷰(68)
    r"(?<![A-Za-z])[Rr]eview\s*#?\s*\d+",
    r"\d+\s*번째?\s*리뷰",  # 68번 리뷰
    r"리뷰\s*#?\s*\d+\s*번",  # 리뷰 68번
    # 근거 리뷰: 0, 1 / 근거 리뷰 3, 7에서 / 근거는 0, 1번. — 다른 번호 패턴처럼 번호 끝에 조사나
    # 문장 끝이 올 때만 본다("근거 리뷰가 1, 2월에", "근거가 된 리뷰 3, 4건"은 남김).
    r"근거[^.!?\d]{0,8}\d++(?:\s*+,\s*+\d++)*+\s*번?" + _ENDS_AS_NOUN,
    # 리뷰 3은 / 리뷰3, 리뷰7에서 (리뷰 120건, 리뷰 1,000건, 리뷰 3, 4건은 남김)
    r"리뷰\s*\d++(?:,\d{3})*+(?:\s*+,\s*+\d++)*+" + _ENDS_AS_NOUN,
    r"\d++\s*~\s*\d++" + _ENDS_AS_NOUN,  # 100~119는 (2~3팀, 1~2만 원은 남김)
    r"\d++\s*번\s*~\s*\d++",  # 0번~99번
    r"\d{2,}\s*번\s*(?:대(?=\s)|" + _PARTICLE + r")",  # 68번은, 68번과, 100번부터, 100번대
    # 0, 1, 3 — 목록의 첫 숫자에서만 시작해 긴 입력에서도 선형으로 끝난다(3, 4, 5월은 남김).
    r"(?<![\d,])(?<!,\s)\d++(?:\s*+,\s*+\d++){2,}+\s*번?" + _ENDS_AS_NOUN,
    r"인덱스|토픽|임베딩|(?<![A-Za-z])(?:RAG|index)(?![A-Za-z])",
    # 영어 필드명은 대소문자를 구분한다. "Positive한 분위기" 같은 표현은 남긴다.
    r"(?<![A-Za-z_])(?:insights?|advice|caveat|evidence|review_index|review_fact"
    r"|ai_interpretation|suggested_action|image_alt_text|image_prompt|topic_review_count|topics?"
    r"|POSITIVE|NEGATIVE|PERCEPTION|PRIORITY)(?![A-Za-z_])",
)
_INTERNAL_MARKERS = re.compile("|".join(_INTERNAL_PATTERNS))
_SENTENCE_END = re.compile(r"(?<=[.!?])\s+")


def reader_facing(text: str) -> str:
    """Drop sentences that expose review indexes or internal field names."""
    kept = [
        sentence
        for sentence in _SENTENCE_END.split(text.strip())
        if sentence and not _INTERNAL_MARKERS.search(sentence)
    ]
    return " ".join(kept)


_DEFAULT_CAVEAT = "리뷰에서 반복된 상황을 묶은 유형이며 실제 개인이나 전체 손님을 뜻하지 않습니다."
# 손님 유형은 근거 리뷰 수 상위 3개까지다(PERSONA-002, 2026-09-27 사용자 결정).
_MAX_PERSONAS = 3


class AnalyzeRequest(BaseModel):
    job_id: str
    store_name: str = Field(min_length=1, max_length=255)
    category: Industry
    naver_place_url: str


class CollectedReview(BaseModel):
    content: str
    normalized_content: str
    content_hash: str
    rating: float | None = None
    written_at: date | None = None


class EvidenceReference(BaseModel):
    review_index: int = Field(ge=0)
    excerpt: str = Field(min_length=1, max_length=500)


class InsightOutput(BaseModel):
    kind: InsightKind
    review_fact: str = Field(min_length=1, max_length=1000)
    ai_interpretation: str = Field(min_length=1, max_length=1000)
    evidence: list[EvidenceReference] = Field(min_length=1, max_length=2)


class AdviceOutput(BaseModel):
    review_fact: str = Field(min_length=1, max_length=1000)
    suggested_action: str = Field(min_length=1, max_length=1000)
    ai_interpretation: str = Field(min_length=1, max_length=1000)
    evidence: list[EvidenceReference] = Field(min_length=1, max_length=2)


class PersonaOutput(BaseModel):
    rank: int = Field(ge=1, le=3)
    topic_review_count: int = Field(gt=0)
    label: str = Field(min_length=1, max_length=255)
    summary: str = Field(min_length=1, max_length=1000)
    caveat: str = Field(min_length=1, max_length=1000)
    image_prompt: str = Field(min_length=1, max_length=2000)
    image_alt_text: str = Field(min_length=1, max_length=500)
    insights: list[InsightOutput] = Field(min_length=4, max_length=4)
    advice: list[AdviceOutput] = Field(min_length=1, max_length=3)

    @field_validator("caveat")
    @classmethod
    def keep_caveat_reader_facing(cls, value: str) -> str:
        return reader_facing(value) or _DEFAULT_CAVEAT

    @field_validator("insights")
    @classmethod
    def require_all_perspectives(cls, value: list[InsightOutput]) -> list[InsightOutput]:
        expected = {"POSITIVE", "NEGATIVE", "PERCEPTION", "PRIORITY"}
        if {item.kind for item in value} != expected:
            raise ValueError("Each persona must contain all four insight kinds")
        return value


class StructuredAnalysis(BaseModel):
    personas: list[PersonaOutput] = Field(min_length=1, max_length=_MAX_PERSONAS)
    limitations: list[str] = Field(default_factory=list, max_length=5)

    @field_validator("limitations")
    @classmethod
    def keep_limitations_reader_facing(cls, value: list[str]) -> list[str]:
        # 항목 길이에는 스키마 상한이 없다. 비정상적으로 긴 출력에서 필터가 느려지지 않도록
        # caveat 상한과 같은 1,000자까지만 본다.
        return [cleaned for item in value if (cleaned := reader_facing(item[:1000]))]

    @field_validator("personas", mode="before")
    @classmethod
    def keep_top_three_personas(cls, value: Any) -> Any:
        # 스키마는 3개 상한(maxItems)을 모델에 보내지만 Structured Outputs 가 이를 강제하는지
        # 공식 문서로 확인하지 못했다. 넘치면 검증 실패가 재시도로 이어져 수집·모델 호출이
        # 반복되므로, 근거 리뷰 수 상위 3개만 남기고 순위를 다시 매긴다(PERSONA-002).
        # 모델이 매긴 rank 는 정렬의 동률 기준으로만 쓰므로 범위·연속 검사는 여기서 풀리고,
        # 잘려 나간 항목은 검증하지 않는다. rank·리뷰 수가 정수가 아니면 자르지 않고 거부한다.
        if not isinstance(value, list) or len(value) <= _MAX_PERSONAS:
            return value
        if not all(
            isinstance(item, dict)
            and isinstance(item.get("topic_review_count"), int)
            and isinstance(item.get("rank"), int)
            for item in value
        ):
            return value
        ordered = sorted(value, key=lambda item: (-item["topic_review_count"], item["rank"]))
        return [
            {**item, "rank": rank} for rank, item in enumerate(ordered[:_MAX_PERSONAS], start=1)
        ]

    @field_validator("personas")
    @classmethod
    def require_contiguous_ranks(cls, value: list[PersonaOutput]) -> list[PersonaOutput]:
        ranks = sorted(item.rank for item in value)
        if ranks != list(range(1, len(value) + 1)):
            raise ValueError("Persona ranks must be contiguous from one")
        # 순위는 근거 리뷰 수로 정한다(PERSONA-002 상위 토픽). 모델이 매긴 순위가 이와
        # 어긋나면 리뷰 수 순으로 다시 매긴다. 수가 같으면 모델 순위를 따른다.
        ordered = sorted(value, key=lambda item: (-item.topic_review_count, item.rank))
        return [
            item.model_copy(update={"rank": rank}) for rank, item in enumerate(ordered, start=1)
        ]


class PersonaImage(BaseModel):
    rank: int
    content_base64: str
    media_type: Literal["image/png"] = "image/png"


class AnalyzeResponse(BaseModel):
    job_id: str
    collected_review_count: int
    valid_review_count: int
    contains_reviews_older_than_two_years: bool
    collected_at: datetime
    analyzed_at: datetime
    reviews: list[CollectedReview]
    analysis: StructuredAnalysis
    images: list[PersonaImage]
    model_versions: dict[str, str] = Field(default_factory=dict)
    schema_version: Literal["1.0"] = "1.0"

    @model_validator(mode="after")
    def validate_evidence_and_images(self) -> "AnalyzeResponse":
        review_count = len(self.reviews)
        for persona in self.analysis.personas:
            for item in [*persona.insights, *persona.advice]:
                if any(reference.review_index >= review_count for reference in item.evidence):
                    raise ValueError("Evidence reference points outside the review collection")
        if {item.rank for item in self.images} != {item.rank for item in self.analysis.personas}:
            raise ValueError("Every persona must have exactly one generated image")
        return self
