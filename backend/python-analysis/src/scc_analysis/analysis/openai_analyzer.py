import base64
import calendar
from datetime import date

from openai import OpenAI

from scc_analysis.analysis.models import (
    CollectedReview,
    PersonaImage,
    StructuredAnalysis,
)

SYSTEM_PROMPT = """당신은 음식점 공개 리뷰를 근거로 손님 사용 상황을 구조화하는 분석가입니다.
반드시 제공된 리뷰만 근거로 사용하세요. 연령, 성별, 직업 같은 인구통계를 추정하지 마세요.
최대 3개의 반복 토픽을 빈도 순으로 만들고, 각 토픽마다 POSITIVE, NEGATIVE, PERCEPTION,
PRIORITY 관점을 정확히 하나씩 작성하세요. 모든 사실과 제안은 evidence의 review_index로
실제 리뷰에 연결되어야 합니다. 매출 상승이나 확정적인 효과를 보장하지 마세요.
image_prompt는 그 토픽의 식사 장면을 사람이 등장하는 따뜻한 에디토리얼 일러스트로 작성하세요.
사람은 특정 인물을 재현하지 않는 일반적인 모습으로 묘사하고, 나이·성별·직업을 지정하지 마세요.
얼굴 생김새보다 무엇을 하고 있는지(덜어 담기, 함께 나눠 먹기, 메뉴판 살펴보기)를 적으세요."""


class AnalysisConfigurationError(RuntimeError):
    pass


class OpenAiReviewAnalyzer:
    def __init__(self, *, api_key: str | None, analysis_model: str, image_model: str) -> None:
        if not api_key:
            raise AnalysisConfigurationError("OPENAI_API_KEY가 설정되지 않았습니다.")
        self.client = OpenAI(api_key=api_key)
        self.analysis_model = analysis_model
        self.image_model = image_model

    def analyze(
        self, reviews: list[CollectedReview]
    ) -> tuple[StructuredAnalysis, list[PersonaImage]]:
        review_lines = "\n".join(
            f"[{index}] {review.normalized_content[:1200]}" for index, review in enumerate(reviews)
        )
        response = self.client.responses.parse(
            model=self.analysis_model,
            input=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"다음 리뷰를 분석하세요.\n{review_lines}"},
            ],
            text_format=StructuredAnalysis,
        )
        analysis = response.output_parsed
        if analysis is None:
            raise RuntimeError("OpenAI가 구조화된 분석 결과를 반환하지 않았습니다.")
        images = [
            self._generate_image(persona.rank, persona.image_prompt)
            for persona in analysis.personas
        ]
        return analysis, images

    def _generate_image(self, rank: int, prompt: str) -> PersonaImage:
        response = self.client.images.generate(
            model=self.image_model,
            prompt=(
                # 페르소나 이미지이므로 사람이 등장해야 상황이 읽힌다. 다만 실제 손님을
                # 묘사하는 것이 아니므로 특정 인물로 식별되지 않아야 하고, 나이·성별·직업을
                # 단정하지 않는다(기능명세 IMAGE-001 비식별 가상 이미지).
                "Square mobile app illustration in a warm editorial vector style, "
                "identical style across every image. "
                "Show one or two stylised people in the dining scene, drawn simply with "
                "soft rounded shapes and minimal facial detail, seen from a slight distance "
                "or three-quarter angle. "
                "They must not resemble any identifiable person and must not signal a "
                "specific age, gender, or occupation. "
                "No text, letters, numbers, logos, or photorealism. " + prompt
            ),
            size="1024x1024",
            quality="low",
        )
        item = response.data[0]
        if not item.b64_json:
            raise RuntimeError("OpenAI 이미지 응답에 base64 데이터가 없습니다.")
        base64.b64decode(item.b64_json, validate=True)
        return PersonaImage(rank=rank, content_base64=item.b64_json)


def contains_old_reviews(reviews: list[CollectedReview], today: date) -> bool:
    cutoff_year = today.year - 2
    cutoff = date(
        cutoff_year,
        today.month,
        min(today.day, calendar.monthrange(cutoff_year, today.month)[1]),
    )
    return any(review.written_at is not None and review.written_at < cutoff for review in reviews)
