from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

Industry = Literal["한식", "중식", "일식", "양식", "카페/디저트", "주점", "기타"]
InsightKind = Literal["POSITIVE", "NEGATIVE", "PERCEPTION", "PRIORITY"]


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

    @field_validator("insights")
    @classmethod
    def require_all_perspectives(cls, value: list[InsightOutput]) -> list[InsightOutput]:
        expected = {"POSITIVE", "NEGATIVE", "PERCEPTION", "PRIORITY"}
        if {item.kind for item in value} != expected:
            raise ValueError("Each persona must contain all four insight kinds")
        return value


class StructuredAnalysis(BaseModel):
    personas: list[PersonaOutput] = Field(min_length=1, max_length=3)
    limitations: list[str] = Field(default_factory=list, max_length=5)

    @field_validator("personas")
    @classmethod
    def require_contiguous_ranks(cls, value: list[PersonaOutput]) -> list[PersonaOutput]:
        ranks = sorted(item.rank for item in value)
        if ranks != list(range(1, len(value) + 1)):
            raise ValueError("Persona ranks must be contiguous from one")
        return sorted(value, key=lambda item: item.rank)


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
