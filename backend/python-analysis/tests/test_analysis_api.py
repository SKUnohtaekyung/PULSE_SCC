import asyncio
import logging
import socket
import threading
import time
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from pydantic import BaseModel, SecretStr, ValidationError

from scc_analysis.analysis import pipeline, progress
from scc_analysis.analysis.models import AnalyzeRequest, CollectedReview
from scc_analysis.analysis.openai_analyzer import (
    AnalysisOutputInvalidError,
    ImageGenerationError,
    ModelServiceUnavailableError,
    OpenAiReviewAnalyzer,
)
from scc_analysis.api import analysis as analysis_api
from scc_analysis.collection import naver
from scc_analysis.collection.naver import CollectedReviewBatch, ReviewCollectionError
from scc_analysis.core.config import Settings
from scc_analysis.main import app

_BODY = {
    "job_id": "job-1",
    "store_name": "테스트 매장",
    "category": "한식",
    "naver_place_url": "https://map.naver.com/p/entry/place/1",
}
_PATH = "/internal/v1/analysis-jobs"


def _token(monkeypatch: pytest.MonkeyPatch, value: str | None) -> None:
    configured = SecretStr(value) if value is not None else None
    monkeypatch.setattr(
        analysis_api, "get_settings", lambda: SimpleNamespace(service_token=configured)
    )


def _failing_with(monkeypatch: pytest.MonkeyPatch, error: Exception) -> None:
    async def fail(request: object) -> None:
        raise error

    monkeypatch.setattr(analysis_api, "run_analysis", fail)


# ---------- 서비스 토큰 ----------


@pytest.mark.parametrize(
    ("configured", "sent"),
    [("secret", None), ("secret", "wrong"), (None, "anything"), ("", "")],
)
def test_requests_without_the_right_service_token_are_rejected(
    monkeypatch: pytest.MonkeyPatch, configured: str | None, sent: str | None
) -> None:
    _token(monkeypatch, configured)
    headers = {"X-SCC-Service-Token": sent} if sent is not None else {}

    response = TestClient(app).post(_PATH, json=_BODY, headers=headers)

    assert response.status_code == 401


def test_the_token_is_checked_before_the_body_so_input_is_not_echoed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _token(monkeypatch, "secret")

    response = TestClient(app).post(_PATH, json={"store_name": "비밀 입력값"})

    assert response.status_code == 401
    assert "비밀 입력값" not in response.text


# ---------- Spring 에 주는 오류 형태 ----------


def test_too_few_reviews_carry_the_count_and_threshold(monkeypatch: pytest.MonkeyPatch) -> None:
    _token(monkeypatch, "secret")
    _failing_with(monkeypatch, ValueError("INSUFFICIENT_VALID_REVIEWS:49"))

    response = TestClient(app).post(_PATH, json=_BODY, headers={"X-SCC-Service-Token": "secret"})

    assert response.status_code == 422
    assert response.json()["detail"] == {
        "code": "INSUFFICIENT_VALID_REVIEWS",
        "message": "유효 리뷰가 49건으로 분석 기준 50건보다 적습니다.",
        "retryable": False,
        "valid_review_count": 49,
        "minimum_valid_review_count": 50,
    }


class _Strict(BaseModel):
    count: int


def _validation_error() -> ValidationError:
    try:
        _Strict(count="리뷰 원문 조각이 담긴 모델 출력")  # type: ignore[arg-type]
    except ValidationError as error:
        return error
    raise AssertionError("ValidationError 가 나지 않았다")


@pytest.mark.parametrize(
    ("error", "status", "code"),
    [
        (AnalysisOutputInvalidError("x"), 502, "ANALYSIS_OUTPUT_INVALID"),
        (_validation_error(), 502, "ANALYSIS_OUTPUT_INVALID"),
        (ImageGenerationError("x"), 502, "IMAGE_GENERATION_FAILED"),
        (ModelServiceUnavailableError("x"), 503, "INTERNAL_ANALYSIS_SERVICE_UNAVAILABLE"),
        (
            ReviewCollectionError("REVIEW_COLLECTION_BLOCKED", "막힘", retryable=True),
            422,
            "REVIEW_COLLECTION_BLOCKED",
        ),
    ],
)
def test_model_and_collection_failures_become_structured_retryable_errors(
    monkeypatch: pytest.MonkeyPatch, error: Exception, status: int, code: str
) -> None:
    _token(monkeypatch, "secret")
    _failing_with(monkeypatch, error)

    response = TestClient(app).post(_PATH, json=_BODY, headers={"X-SCC-Service-Token": "secret"})

    assert response.status_code == status
    assert response.json()["detail"]["code"] == code
    assert response.json()["detail"]["retryable"] is True
    assert "리뷰 원문 조각" not in response.text


# ---------- 수집 대상 주소 ----------


def _resolves_to(monkeypatch: pytest.MonkeyPatch, address: str) -> None:
    family = socket.AF_INET6 if ":" in address else socket.AF_INET
    monkeypatch.setattr(
        naver.socket,
        "getaddrinfo",
        lambda *args, **kwargs: [(family, socket.SOCK_STREAM, 6, "", (address, 443))],
    )


@pytest.mark.parametrize(
    "address",
    [
        "127.0.0.1",
        "10.0.0.5",
        "172.16.0.1",
        "192.168.0.1",
        "169.254.169.254",
        "100.100.100.200",
        "224.0.0.1",
        "0.0.0.0",
        "::1",
        "fd00::1",
        "::ffff:127.0.0.1",
    ],
)
def test_hosts_resolving_to_non_public_addresses_are_rejected(
    monkeypatch: pytest.MonkeyPatch, address: str
) -> None:
    _resolves_to(monkeypatch, address)

    with pytest.raises(ReviewCollectionError) as raised:
        naver._reject_non_public_host("m.place.naver.com")

    assert raised.value.code == "INVALID_NAVER_PLACE_URL"
    assert raised.value.retryable is False


def test_a_host_resolving_to_a_public_address_is_allowed(monkeypatch: pytest.MonkeyPatch) -> None:
    _resolves_to(monkeypatch, "223.130.195.95")

    naver._reject_non_public_host("m.place.naver.com")


def test_a_temporary_name_lookup_failure_is_retryable(monkeypatch: pytest.MonkeyPatch) -> None:
    def fail(*args: object, **kwargs: object) -> None:
        raise socket.gaierror("temporary failure")

    monkeypatch.setattr(naver.socket, "getaddrinfo", fail)

    with pytest.raises(ReviewCollectionError) as raised:
        naver._reject_non_public_host("m.place.naver.com")

    assert raised.value.code == "REVIEW_COLLECTION_BLOCKED"
    assert raised.value.retryable is True


@pytest.mark.parametrize(
    "url",
    [
        "http://m.place.naver.com/restaurant/1/review/visitor",
        "https://evil.example.com/restaurant/1",
        "https://m.place.naver.com.evil.example/restaurant/1",
    ],
)
def test_the_page_after_redirects_must_stay_on_an_allowed_https_host(
    monkeypatch: pytest.MonkeyPatch, url: str
) -> None:
    _resolves_to(monkeypatch, "223.130.195.95")

    with pytest.raises(ReviewCollectionError) as raised:
        naver.validate_collection_page_url(url)

    assert raised.value.code == "INVALID_NAVER_PLACE_URL"


def test_an_allowed_host_that_now_resolves_privately_is_rejected_after_redirect(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _resolves_to(monkeypatch, "10.1.2.3")

    with pytest.raises(ReviewCollectionError):
        naver.validate_collection_page_url(
            "https://pcmap.place.naver.com/restaurant/1/review/visitor"
        )


# ---------- 진행 단계 ----------

_PROGRESS_PATH = "/internal/v1/analysis-jobs/job-1/progress"
_AUTH = {"X-SCC-Service-Token": "secret"}


def test_progress_requires_the_service_token(monkeypatch: pytest.MonkeyPatch) -> None:
    _token(monkeypatch, "secret")

    response = TestClient(app).get(_PROGRESS_PATH)

    assert response.status_code == 401


def test_progress_of_a_job_this_process_is_not_running_is_not_found(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _token(monkeypatch, "secret")

    response = TestClient(app).get(_PROGRESS_PATH, headers=_AUTH)

    assert response.status_code == 404


def test_progress_reports_the_step_the_job_is_on(monkeypatch: pytest.MonkeyPatch) -> None:
    _token(monkeypatch, "secret")
    progress.set_step("job-1", progress.ANALYZING)
    try:
        response = TestClient(app).get(_PROGRESS_PATH, headers=_AUTH)
    finally:
        progress.clear("job-1")

    assert response.status_code == 200
    assert response.json() == {"job_id": "job-1", "progress_step": "ANALYZING"}


def test_the_step_is_forgotten_once_the_job_ends(monkeypatch: pytest.MonkeyPatch) -> None:
    _token(monkeypatch, "secret")

    async def fail_midway(request: object) -> None:
        progress.set_step("job-1", progress.COLLECTING_REVIEWS)
        raise ReviewCollectionError("REVIEW_COLLECTION_BLOCKED", "차단", retryable=True)

    monkeypatch.setattr(analysis_api, "run_analysis", fail_midway)
    client = TestClient(app)

    client.post(_PATH, json=_BODY, headers=_AUTH)

    assert client.get(_PROGRESS_PATH, headers=_AUTH).status_code == 404


def test_the_analyzer_reports_each_step_just_before_doing_it(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    analyzer = OpenAiReviewAnalyzer(api_key="test", analysis_model="m", image_model="i")
    events: list[str] = []
    persona = _fake_persona(1)

    def parse(review_lines: str) -> SimpleNamespace:
        events.append("parse")
        return SimpleNamespace(output_parsed=SimpleNamespace(personas=[persona]))

    def generate_image(rank: int, prompt: str) -> str:
        events.append("image")
        return "image"

    monkeypatch.setattr(analyzer, "_parse", parse)
    monkeypatch.setattr(analyzer, "_generate_image", generate_image)

    analyzer.analyze(_REVIEWS, on_step=events.append)

    assert events == ["ANALYZING", "parse", "GENERATING_IMAGE", "image"]


# ---------- 분석기: 근거 확인 순서, 이미지 동시 생성, 추론 강도 ----------

_REVIEWS = [
    CollectedReview(content="정말 맛있어요", normalized_content="정말 맛있어요", content_hash="h")
]


def _fake_persona(rank: int, excerpt: str = "맛있어요") -> SimpleNamespace:
    evidence = [SimpleNamespace(review_index=0, excerpt=excerpt)]
    return SimpleNamespace(
        rank=rank,
        image_prompt=f"prompt-{rank}",
        topic_review_count=1,
        insights=[SimpleNamespace(evidence=evidence)],
        advice=[],
    )


def _analyzer_returning(
    monkeypatch: pytest.MonkeyPatch, personas: list[SimpleNamespace], usage: object = None
) -> OpenAiReviewAnalyzer:
    analyzer = OpenAiReviewAnalyzer(api_key="test", analysis_model="m", image_model="i")
    response = SimpleNamespace(output_parsed=SimpleNamespace(personas=personas), usage=usage)
    monkeypatch.setattr(analyzer, "_parse", lambda review_lines: response)
    return analyzer


def test_a_quote_that_is_not_in_the_review_stops_before_any_image_is_made(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # 2026-10-13 실측에서 모델이 두 구절을 "..." 로 이어 붙여 인용했다.
    analyzer = _analyzer_returning(monkeypatch, [_fake_persona(1, excerpt="정말 ... 맛있어요")])
    made: list[int] = []
    events: list[str] = []
    monkeypatch.setattr(analyzer, "_generate_image", lambda rank, prompt: made.append(rank))

    with pytest.raises(AnalysisOutputInvalidError):
        analyzer.analyze(_REVIEWS, on_step=events.append)

    assert made == []
    assert events == ["ANALYZING"]


def test_images_are_requested_together_and_returned_in_persona_order(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    analyzer = _analyzer_returning(monkeypatch, [_fake_persona(rank) for rank in (1, 2, 3)])
    together = threading.Barrier(3, timeout=5)

    def generate_image(rank: int, prompt: str) -> str:
        together.wait()  # 세 요청이 함께 떠 있어야 풀린다. 차례로 부르면 시간 초과로 실패한다.
        time.sleep(0.05 * (3 - rank))  # 1순위가 가장 늦게 끝난다.
        return f"{prompt}-image"

    monkeypatch.setattr(analyzer, "_generate_image", generate_image)

    _, images = analyzer.analyze(_REVIEWS)

    assert images == ["prompt-1-image", "prompt-2-image", "prompt-3-image"]


def test_one_image_that_cannot_be_made_fails_the_whole_set(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    analyzer = _analyzer_returning(monkeypatch, [_fake_persona(rank) for rank in (1, 2)])

    def generate_image(rank: int, prompt: str) -> str:
        if rank == 2:
            raise RuntimeError("OpenAI 이미지 응답에 base64 데이터가 없습니다.")
        return "image"

    monkeypatch.setattr(analyzer, "_generate_image", generate_image)

    with pytest.raises(ImageGenerationError):
        analyzer.analyze(_REVIEWS)


@pytest.mark.parametrize(
    ("effort", "expected"), [("low", {"reasoning": {"effort": "low"}}), (None, {})]
)
def test_the_reasoning_effort_is_sent_only_when_it_is_set(
    effort: str | None, expected: dict[str, object]
) -> None:
    analyzer = OpenAiReviewAnalyzer(
        api_key="test", analysis_model="m", image_model="i", reasoning_effort=effort
    )
    sent: dict[str, object] = {}
    analyzer.client = SimpleNamespace(
        responses=SimpleNamespace(parse=lambda **options: sent.update(options))
    )

    analyzer._parse("[0] 리뷰")

    assert sent["model"] == "m"
    assert {key: value for key, value in sent.items() if key == "reasoning"} == expected


def test_the_pipeline_hands_the_configured_reasoning_effort_to_the_analyzer(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: dict[str, object] = {}

    class Collector:
        def __init__(self, **options: object) -> None:
            pass

        async def collect(self, url: str) -> CollectedReviewBatch:
            return CollectedReviewBatch(collected_review_count=50, reviews=_REVIEWS * 50)

    class Analyzer:
        def __init__(self, **options: object) -> None:
            captured.update(options)

        def analyze(self, reviews: object, on_step: object = None) -> None:
            raise AnalysisOutputInvalidError("여기까지만 본다")

    monkeypatch.delenv("SCC_OPENAI_ANALYSIS_REASONING_EFFORT", raising=False)
    monkeypatch.setattr(pipeline, "NaverPublicReviewCollector", Collector)
    monkeypatch.setattr(pipeline, "OpenAiReviewAnalyzer", Analyzer)
    monkeypatch.setattr(
        pipeline, "get_settings", lambda: Settings(_env_file=None, openai_api_key="key")
    )
    # run_analysis 는 단계를 기록만 한다. 지우는 것은 API 핸들러라 여기서 직접 지운다.
    request = AnalyzeRequest(**{**_BODY, "job_id": "job-pipeline"})

    try:
        with pytest.raises(AnalysisOutputInvalidError):
            asyncio.run(pipeline.run_analysis(request))
    finally:
        progress.clear(request.job_id)

    assert captured["reasoning_effort"] == "low"


def test_a_reasoning_effort_outside_the_known_values_is_rejected() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, openai_analysis_reasoning_effort="fast")


def test_the_model_call_log_carries_token_counts_but_no_review_text(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    usage = SimpleNamespace(
        input_tokens=10210,
        output_tokens=3476,
        output_tokens_details=SimpleNamespace(reasoning_tokens=680),
    )
    analyzer = _analyzer_returning(monkeypatch, [_fake_persona(1)], usage=usage)
    monkeypatch.setattr(analyzer, "_generate_image", lambda rank, prompt: "image")

    with caplog.at_level(logging.INFO, logger="scc_analysis.analysis.openai_analyzer"):
        analyzer.analyze(_REVIEWS)

    messages = [record.getMessage() for record in caplog.records]
    assert any("입력 10210토큰, 출력 3476토큰(그중 추론 680)" in message for message in messages)
    assert any("이미지 1장" in message for message in messages)
    assert not any("맛있어요" in message for message in messages)
