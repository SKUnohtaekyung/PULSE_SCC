import pytest

from scc_analysis.collection.naver import (
    ReviewCollectionError,
    build_reviews,
    validate_public_naver_url,
)


def test_normalize_and_deduplicate_reviews() -> None:
    reviews = build_reviews(
        ["  음식이   정말 맛있고 친절해요.  ", "음식이 정말 맛있고 친절해요."], 10
    )
    assert len(reviews) == 1
    assert reviews[0].normalized_content == "음식이 정말 맛있고 친절해요."


def test_rejects_non_naver_and_non_https_urls(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("scc_analysis.collection.naver._reject_non_public_host", lambda _: None)
    with pytest.raises(ReviewCollectionError) as error:
        validate_public_naver_url("http://map.naver.com/example")
    assert error.value.code == "INVALID_NAVER_PLACE_URL"

    with pytest.raises(ReviewCollectionError):
        validate_public_naver_url("https://example.com/place")


def test_accepts_supported_naver_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("scc_analysis.collection.naver._reject_non_public_host", lambda _: None)
    assert validate_public_naver_url("https://map.naver.com/p/entry/place/123") == (
        "https://map.naver.com/p/entry/place/123"
    )
