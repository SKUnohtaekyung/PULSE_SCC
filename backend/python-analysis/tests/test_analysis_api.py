import socket
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from pydantic import BaseModel, SecretStr, ValidationError

from scc_analysis.analysis.openai_analyzer import (
    AnalysisOutputInvalidError,
    ImageGenerationError,
    ModelServiceUnavailableError,
)
from scc_analysis.api import analysis as analysis_api
from scc_analysis.collection import naver
from scc_analysis.collection.naver import ReviewCollectionError
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
