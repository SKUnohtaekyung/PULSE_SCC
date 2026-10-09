import base64
import calendar
from collections.abc import Callable
from datetime import date

import openai
from openai import OpenAI
from pydantic import ValidationError

from scc_analysis.analysis import progress
from scc_analysis.analysis.models import (
    CollectedReview,
    PersonaImage,
    StructuredAnalysis,
)

SYSTEM_PROMPT = """당신은 음식점 공개 리뷰를 근거로 손님 사용 상황을 구조화하는 분석가입니다.
반드시 제공된 리뷰만 근거로 사용하세요. 연령, 성별, 직업 같은 인구통계를 추정하지 마세요.
리뷰에서 반복해서 확인되는 토픽만 만드세요. 3개를 채우려고 근거 리뷰가 적은 토픽을 만들지
마세요. 반복 토픽이 1개면 1개, 2개면 2개만 만듭니다. 3개보다 많으면 근거 리뷰가 많은 상위
3개만 남기고, topic_review_count 에는 그 토픽을 뒷받침하는 리뷰 수를 적으세요.
각 토픽마다 POSITIVE, NEGATIVE, PERCEPTION,
PRIORITY 관점을 정확히 하나씩 작성하세요. 모든 사실과 제안은 evidence의 review_index로
실제 리뷰에 연결되어야 합니다. 매출 상승이나 확정적인 효과를 보장하지 마세요.
image_prompt는 그 손님 유형의 이름(label)을 보고 바로 떠오르는 가상 인물 한 명의 상반신 인물
사진으로 작성하세요. 누가 봐도 그 손님 유형이라고 알 수 있게, 그 상황의 손님다운 옷차림과 표정,
분위기를 적고, 그 유형을 드러내는 물건 하나를 손에 들게 하세요(예: 든든히 먹는 손님은 숟가락,
포장해 가는 손님은 포장 봉투, 기다리는 손님은 휴대폰). 글자나 숫자가 보이는 물건은 피하세요.
손님 유형마다 서로 다른 사람으로
보이게 하세요. 사람은 특정 인물을 재현하지 않는 일반적인 모습으로 묘사하고, 리뷰에 근거가 없는
나이·성별·직업은 지정하지 마세요. 배경과 장소는 적지 마세요.
review_index 를 제외한 모든 글(label, summary, caveat, review_fact, ai_interpretation,
suggested_action, image_alt_text, limitations)은 가게 사장님이 그대로 읽는 문장입니다.
쉬운 우리말로 쓰세요. 리뷰 번호, 번호 목록, "몇 번 리뷰", "[12]" 같은 번호 표기, 번호 범위,
영어 필드 이름(insight, advice, caveat, POSITIVE 등), 토픽·인덱스·임베딩·RAG 같은 분석 용어를
쓰지 마세요. "토픽" 대신 "손님 유형"이라고 쓰세요.
방문 횟수·시간·가격 같은 숫자는 단위를 붙여 쓰세요.
글은 짧게 쓰세요. 사장님이 휴대폰 화면에서 한눈에 읽습니다. 아래 길이를 넘기지 마세요.
- label: 15자 이내의 손님 유형 이름
- summary: 두 문장 이내, 합쳐서 70자 이내
- ai_interpretation, review_fact, suggested_action: 각각 한 문장, 45자 이내
- caveat: 한 문장, 40자 이내
- limitations: 가장 중요한 것부터 최대 3개, 각각 한 문장, 45자 이내
한 칸에 쓴 내용을 다른 칸에서 되풀이하지 마세요.
꾸미는 말과 "~로 보입니다" 같은 긴 맺음말을 줄이세요.
caveat 에는 이 손님 유형을 읽을 때 주의할 점을 한 문장으로만 쓰세요. 근거 리뷰 목록을 적지 마세요.
limitations 에는 분석을 어떻게 했는지가 아니라 사장님이 결과를 읽을 때 알아야 할 한계만
최대 3개 쓰세요. 한 리뷰가 여러 손님 유형에 함께 들어가 유형별 리뷰 수의 합이 전체 리뷰 수와
다를 수 있다면 그 사실을 알려 주세요."""


class AnalysisConfigurationError(RuntimeError):
    pass


class AnalysisOutputInvalidError(RuntimeError):
    """모델 출력이 구조화 스키마나 근거 연결 검증을 통과하지 못했다(API.md 5.3, 재시도 대상)."""


class ImageGenerationError(RuntimeError):
    """페르소나 이미지를 만들지 못했다(API.md 5.3 IMAGE_GENERATION_FAILED, 재시도 대상)."""


class ModelServiceUnavailableError(RuntimeError):
    """OpenAI 호출이 연결·한도·서버 오류로 실패했다(재시도 대상)."""


class OpenAiReviewAnalyzer:
    def __init__(self, *, api_key: str | None, analysis_model: str, image_model: str) -> None:
        if not api_key:
            raise AnalysisConfigurationError("OPENAI_API_KEY가 설정되지 않았습니다.")
        self.client = OpenAI(api_key=api_key)
        self.analysis_model = analysis_model
        self.image_model = image_model

    def analyze(
        self,
        reviews: list[CollectedReview],
        on_step: Callable[[str], None] | None = None,
    ) -> tuple[StructuredAnalysis, list[PersonaImage]]:
        """on_step 은 각 단계의 일을 시작하기 직전에 그 단계 이름으로 불린다."""
        report = on_step or (lambda step: None)
        report(progress.ANALYZING)
        review_lines = "\n".join(
            f"[{index}] {review.normalized_content[:1200]}" for index, review in enumerate(reviews)
        )
        try:
            response = self._parse(review_lines)
        except ValidationError as error:
            # 오류 문자열에는 모델 출력과 리뷰 인용이 들어 있으므로 원인으로만 연결한다.
            raise AnalysisOutputInvalidError(
                "구조화된 분석 결과가 검증을 통과하지 못했습니다."
            ) from error
        except openai.APIError as error:
            raise ModelServiceUnavailableError("분석 모델을 호출하지 못했습니다.") from error
        analysis = response.output_parsed
        if analysis is None:
            raise AnalysisOutputInvalidError("OpenAI가 구조화된 분석 결과를 반환하지 않았습니다.")
        report(progress.GENERATING_IMAGE)
        images = []
        for persona in analysis.personas:
            try:
                images.append(self._generate_image(persona.rank, persona.image_prompt))
            except (openai.APIError, ValueError, RuntimeError) as error:
                raise ImageGenerationError("손님 유형 이미지를 만들지 못했습니다.") from error
        return analysis, images

    def _parse(self, review_lines: str):
        return self.client.responses.parse(
            model=self.analysis_model,
            input=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"다음 리뷰를 분석하세요.\n{review_lines}"},
            ],
            text_format=StructuredAnalysis,
        )

    def _generate_image(self, rank: int, prompt: str) -> PersonaImage:
        response = self.client.images.generate(
            model=self.image_model,
            prompt=(
                # 사진풍 상반신 인물과 단색 배경으로 만든다(PRD §7 페르소나 취급 규칙 6,
                # 2026-10-05 결정). 실제 손님을 묘사하는 것이 아니므로 특정 인물로 식별되지
                # 않아야 한다(기능명세 IMAGE-004). 아래 구도·조명·배경 값은 잠정값이다.
                # 배경색·구도 세부 규칙은 참고 이미지를 받은 뒤 정한다(PRD §13-9).
                # 인물은 손님 유형 이름과 닮아 보여야 한다(2026-10-09 사용자 요청). 그 유형을
                # 드러내는 옷차림·표정·손에 든 물건 하나는 image_prompt가 정한다.
                "Square photorealistic chest-up portrait of one fictional person, "
                "like a profile picture, identical framing and lighting across every image. "
                "The person is centred and facing the camera, soft even studio lighting. "
                "Their clothing, expression and the single item they hold must make the "
                "customer type described below recognisable at a glance. "
                "Plain single-colour light background with no scenery, props behind the "
                "person, gradients, or patterns. "
                "The person is entirely fictional and must not resemble any real or "
                "identifiable person. "
                "No text, letters, numbers, logos, or watermarks. " + prompt
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
