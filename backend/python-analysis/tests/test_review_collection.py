import json
from datetime import date

import pytest

from scc_analysis.collection.naver import (
    AUTHOR_FIELDS,
    ReviewCollectionError,
    build_date_index,
    build_reviews,
    match_key,
    parse_apollo_state,
    review_collection_url,
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


def test_converts_map_place_url_to_public_review_surface(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("scc_analysis.collection.naver._reject_non_public_host", lambda _: None)
    assert review_collection_url("https://map.naver.com/p/search/store/place/2017974390") == (
        "https://pcmap.place.naver.com/restaurant/2017974390/review/visitor"
    )


def _review_node(body: str, iso: str | None) -> dict:
    """Field set observed on m.place.naver.com (2026-09-18). Values are synthetic."""
    return {
        "__typename": "VisitorReview",
        "id": "r1",
        "body": body,
        "rating": 5,
        "visited": "9.13.일",
        "created": "9.13.일",
        "representativeVisitDateTime": iso,
        "author": {"__ref": "VisitorReviewAuthor:a1"},
        "nickname": "홍길동",
        "userIdno": "uid1",
        "loginIdno": "login1",
    }


def test_structured_timestamp_supplies_the_written_date() -> None:
    body = "국물이 진하고 반찬도 정갈했어요. 재방문 의사 있습니다."
    index = build_date_index(
        [{"data": {"visitorReviews": {"items": [_review_node(body, "2026-09-13T04:38:00.000Z")]}}}]
    )

    reviews = build_reviews([body], 10, index)

    assert reviews[0].written_at == date(2026, 9, 13)


def test_written_date_stays_none_without_a_structured_timestamp() -> None:
    body = "국물이 진하고 반찬도 정갈했어요. 재방문 의사 있습니다."

    reviews = build_reviews([body], 10, build_date_index([]))

    # 본문에 날짜가 없으면 추정하지 않는다. 기존 정규식 방식이 이 상태로 고정돼 있었다.
    assert reviews[0].written_at is None


def test_body_text_date_is_still_used_as_a_fallback() -> None:
    reviews = build_reviews(["2025.03.04 방문했는데 국물이 진했어요."], 10, {})

    assert reviews[0].written_at == date(2025, 3, 4)


def test_date_index_matches_a_truncated_dom_body() -> None:
    full = "국물이 진하고 반찬도 정갈했어요. 다음에도 또 오고 싶습니다."
    index = build_date_index([{"items": [_review_node(full, "2026-09-13T04:38:00.000Z")]}])

    reviews = build_reviews([full[:45]], 10, index)

    assert reviews[0].written_at == date(2026, 9, 13)


def test_date_index_never_carries_author_identifiers() -> None:
    body = "국물이 진하고 반찬도 정갈했어요."
    index = build_date_index([{"items": [_review_node(body, "2026-09-13T04:38:00.000Z")]}])

    serialized = json.dumps({str(k): str(v) for k, v in index.items()}, ensure_ascii=False)
    for leaked in ("홍길동", "uid1", "login1", "VisitorReviewAuthor"):
        assert leaked not in serialized
    for field in AUTHOR_FIELDS:
        assert field not in serialized


def test_reviews_built_from_the_index_expose_no_author_fields() -> None:
    body = "국물이 진하고 반찬도 정갈했어요."
    index = build_date_index([{"items": [_review_node(body, "2026-09-13T04:38:00.000Z")]}])

    review = build_reviews([body], 10, index)[0]

    assert set(review.model_dump()) == {
        "content",
        "normalized_content",
        "content_hash",
        "rating",
        "written_at",
    }


def test_invalid_timestamp_is_ignored_rather_than_guessed() -> None:
    body = "국물이 진하고 반찬도 정갈했어요."

    assert build_date_index([{"items": [_review_node(body, "9.13.일")]}]) == {}
    assert build_date_index([{"items": [_review_node(body, None)]}]) == {}


def test_reads_the_apollo_state_out_of_a_page() -> None:
    body = "국물이 진하고 반찬도 정갈했어요."
    state = {"VisitorReview:r1": _review_node(body, "2026-09-13T04:38:00.000Z")}
    html = "<html><script>window.__APOLLO_STATE__ = " + json.dumps(state) + ";</script></html>"

    index = build_date_index([parse_apollo_state(html)])

    assert index[match_key(body)] == date(2026, 9, 13)


def test_page_without_apollo_state_is_not_an_error() -> None:
    assert parse_apollo_state("<html><body>제한되었습니다</body></html>") is None
    assert (
        parse_apollo_state("<html><script>window.__APOLLO_STATE__ = not-json;</script></html>")
        is None
    )
