import hashlib
import ipaddress
import json
import re
import socket
from collections.abc import Iterable, Iterator
from datetime import date, datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlparse

from playwright.async_api import Browser, Frame, Page, async_playwright

from scc_analysis.analysis.models import CollectedReview

ALLOWED_NAVER_HOSTS = {"map.naver.com", "m.place.naver.com"}
COLLECTION_NAVER_HOSTS = {*ALLOWED_NAVER_HOSTS, "pcmap.place.naver.com"}
REVIEW_SELECTORS = (
    "li[class*='place_apply_pui'] a[class='pui__GStJHb']",
    ".pui__vn15t2 a",
    ".pui__vn15t2",
    ".zPfVt",
    "[data-pui-click-code='rvshowmore']",
    "li[class*='place_apply_pui'] [class*='text']",
)


REVIEW_TYPENAME = "VisitorReview"

# 네이버 응답에서 연도가 있는 날짜는 이 필드뿐이다. visited/created 는 "9.13.일" 형식이라
# 연도가 없고, 리뷰 본문에는 날짜가 거의 적히지 않는다. 이 필드를 쓰지 않으면
# written_at 이 사실상 항상 None 이 되어 PRD FR-009 의 2년 초과 경고가 발동하지 않는다.
STRUCTURED_DATE_FIELD = "representativeVisitDateTime"

# ADR-002 "지켜야 할 것" 2번 — 작성자 식별정보는 리뷰와 같은 객체에 들어오므로
# 구조화 추출에서 명시적으로 읽지 않는다. 아래 필드는 어떤 경로로도 저장하지 않는다.
AUTHOR_FIELDS = frozenset({"author", "nickname", "userIdno", "loginIdno"})

_MATCH_KEY_LENGTH = 40

# 네이버가 화면에 표시하는 방문일은 KST 기준이다. 늦은 밤 방문은 UTC 날짜와 하루
# 어긋나므로 표시값과 같은 기준으로 맞춘다.
KST = timezone(timedelta(hours=9))


class ReviewCollectionError(RuntimeError):
    def __init__(self, code: str, message: str, *, retryable: bool) -> None:
        super().__init__(message)
        self.code = code
        self.retryable = retryable


def validate_public_naver_url(url: str) -> str:
    parsed = urlparse(url.strip())
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED_NAVER_HOSTS:
        raise ReviewCollectionError(
            "INVALID_NAVER_PLACE_URL",
            "지원하는 네이버 지도 HTTPS 주소가 아닙니다.",
            retryable=False,
        )
    _reject_non_public_host(parsed.hostname)
    return parsed.geturl()


def review_collection_url(url: str) -> str:
    parsed = urlparse(validate_public_naver_url(url))
    match = re.search(r"/place/(\d+)", parsed.path)
    if parsed.hostname == "map.naver.com" and match:
        place_id = match.group(1)
        return f"https://pcmap.place.naver.com/restaurant/{place_id}/review/visitor"
    return parsed.geturl()


def validate_collection_page_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in COLLECTION_NAVER_HOSTS:
        raise ReviewCollectionError(
            "INVALID_NAVER_PLACE_URL", "허용되지 않은 주소로 이동했습니다.", retryable=False
        )
    _reject_non_public_host(parsed.hostname)


def _reject_non_public_host(hostname: str) -> None:
    try:
        addresses = socket.getaddrinfo(hostname, 443, type=socket.SOCK_STREAM)
    except socket.gaierror as error:
        raise ReviewCollectionError(
            "STORE_NOT_FOUND", "네이버 가게 주소를 확인할 수 없습니다.", retryable=False
        ) from error
    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise ReviewCollectionError(
                "INVALID_NAVER_PLACE_URL", "공개 주소만 수집할 수 있습니다.", retryable=False
            )


def normalize_review_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def build_reviews(
    texts: Iterable[str],
    limit: int,
    date_index: "ReviewDateIndex | None" = None,
) -> list[CollectedReview]:
    reviews: list[CollectedReview] = []
    seen: set[str] = set()
    for raw in texts:
        normalized = normalize_review_text(raw)
        if len(normalized) < 10 or len(normalized) > 4000:
            continue
        digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
        if digest in seen:
            continue
        seen.add(digest)
        reviews.append(
            CollectedReview(
                content=normalized,
                normalized_content=normalized,
                content_hash=digest,
                written_at=_written_at_for(normalized, date_index),
            )
        )
        if len(reviews) >= limit:
            break
    return reviews


def _written_at_for(normalized: str, date_index: "ReviewDateIndex | None") -> date | None:
    """Prefer the structured timestamp, then fall back to a date typed into the body."""
    if date_index is not None and len(date_index):
        matched = date_index.get(match_key(normalized))
        if matched is not None:
            return matched
    return _extract_date(normalized)


def match_key(text: str) -> str:
    """Join a DOM-scraped body to its structured record.

    The DOM text and the GraphQL body can differ in trailing whitespace or truncation,
    so only a normalized prefix is compared.
    """
    return normalize_review_text(text)[:_MATCH_KEY_LENGTH]


def iter_review_nodes(payload: Any) -> Iterator[dict[str, Any]]:
    if isinstance(payload, dict):
        if payload.get("__typename") == REVIEW_TYPENAME:
            yield payload
        for value in payload.values():
            yield from iter_review_nodes(value)
    elif isinstance(payload, list):
        for value in payload:
            yield from iter_review_nodes(value)


class ReviewDateIndex:
    """Body prefix to visit date, built from payloads the page fetched on its own.

    Only `body` and the timestamp are read. Author identifiers sit on the same node and
    are never read, so nothing here can carry them (ADR-002 "지켜야 할 것" 2번).

    Two different reviews can share a body prefix, and an identical short body can appear
    twice with different visit dates. Picking one would silently attach a stranger's date,
    which is the guessing this module exists to avoid. A key with conflicting dates is
    dropped instead, leaving `written_at` as None.
    """

    def __init__(self) -> None:
        self._dates: dict[str, date] = {}
        self._ambiguous: set[str] = set()

    def add(self, payload: Any) -> None:
        for node in iter_review_nodes(payload):
            body = node.get("body")
            if not isinstance(body, str) or not body.strip():
                continue
            written_at = _iso_date(node.get(STRUCTURED_DATE_FIELD))
            if written_at is None:
                continue
            key = match_key(body)
            if key in self._ambiguous:
                continue
            existing = self._dates.get(key)
            if existing is None:
                self._dates[key] = written_at
            elif existing != written_at:
                del self._dates[key]
                self._ambiguous.add(key)

    def get(self, key: str) -> date | None:
        return self._dates.get(key)

    @property
    def ambiguous_count(self) -> int:
        return len(self._ambiguous)

    def __len__(self) -> int:
        return len(self._dates)


def build_date_index(payloads: Iterable[Any]) -> ReviewDateIndex:
    index = ReviewDateIndex()
    for payload in payloads:
        index.add(payload)
    return index


def _iso_date(value: Any) -> date | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(KST).date()
    except ValueError:
        return None


def parse_apollo_state(html: str) -> dict[str, Any] | None:
    marker = html.find("window.__APOLLO_STATE__")
    if marker < 0:
        return None
    start = html.find("{", marker)
    if start < 0:
        return None
    try:
        state, _ = json.JSONDecoder().raw_decode(html[start:])
    except json.JSONDecodeError:
        return None
    return state


def _extract_date(text: str) -> date | None:
    match = re.search(r"(20\d{2})[.\-/년 ]\s*(\d{1,2})[.\-/월 ]\s*(\d{1,2})", text)
    if not match:
        return None
    try:
        return date(*(int(part) for part in match.groups()))
    except ValueError:
        return None


class NaverPublicReviewCollector:
    def __init__(self, *, limit: int, timeout_seconds: int) -> None:
        self.limit = limit
        self.timeout_ms = timeout_seconds * 1000

    async def collect(self, url: str) -> list[CollectedReview]:
        target = review_collection_url(url)
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=True)
            try:
                return await self._collect_from_browser(browser, target)
            finally:
                await browser.close()

    async def _collect_from_browser(self, browser: Browser, target: str) -> list[CollectedReview]:
        page = await browser.new_page(locale="ko-KR")
        page.set_default_timeout(self.timeout_ms)

        # 스크롤로 추가 로드되는 리뷰의 날짜는 GraphQL 응답에만 있다. 페이지가 스스로
        # 보내는 요청의 응답을 읽는다. 별도 요청을 만들지 않는다.
        # 응답 원본에는 닉네임·userIdno 가 들어 있으므로 보관하지 않고 즉시 날짜만
        # 추려 버린다. 보관하지 않으면 이후 로깅으로도 유출될 수 없다.
        date_index = ReviewDateIndex()

        async def capture(response: Any) -> None:
            if "graphql" not in response.url.lower():
                return
            try:
                payload = await response.json()
            except Exception:  # JSON이 아니면 날짜 보강만 건너뛴다
                return
            date_index.add(payload)

        page.on("response", capture)
        try:
            await page.goto(target, wait_until="domcontentloaded", timeout=self.timeout_ms)
            validate_collection_page_url(page.url)
            await self._open_review_surface(page)
            texts = await self._extract_review_texts(page)
            for state in await self._apollo_states(page):
                date_index.add(state)
        except ReviewCollectionError:
            raise
        except Exception as error:
            raise ReviewCollectionError(
                "REVIEW_COLLECTION_BLOCKED",
                "네이버 공개 리뷰를 가져오지 못했습니다. 페이지 변경 또는 접근 제한일 수 있습니다.",
                retryable=True,
            ) from error
        finally:
            await page.close()

        reviews = build_reviews(texts, self.limit, date_index)
        if not reviews:
            raise ReviewCollectionError(
                "REVIEW_COLLECTION_BLOCKED",
                "공개 리뷰 본문을 확인하지 못했습니다.",
                retryable=True,
            )
        return reviews

    async def _open_review_surface(self, page: Page) -> None:
        if "접근이 제한" in await page.locator("body").inner_text():
            raise ReviewCollectionError(
                "REVIEW_COLLECTION_BLOCKED", "네이버에서 접근을 제한했습니다.", retryable=True
            )
        if not any("/review/visitor" in frame.url for frame in page.frames):
            frames = [
                page.main_frame,
                *[frame for frame in page.frames if frame != page.main_frame],
            ]
            for frame in frames:
                review_tab = frame.get_by_role("link", name=re.compile("리뷰"))
                if await review_tab.count():
                    await review_tab.first.click()
                    await page.wait_for_timeout(1200)
                    break
        for _ in range(12):
            clicked = False
            for frame in [page.main_frame, *page.frames]:
                for label in ("더보기", "리뷰 더보기", "방문자 리뷰 더보기"):
                    button = frame.get_by_role("button", name=re.compile(label))
                    if await button.count() and await button.last.is_visible():
                        await button.last.click()
                        await page.wait_for_timeout(350)
                        clicked = True
                        break
                if clicked:
                    break
            if not clicked:
                break
        await self._load_visible_review_items(page)

    async def _load_visible_review_items(self, page: Page) -> None:
        review_frames: list[Frame] = []
        for _ in range(20):
            review_frames = [frame for frame in page.frames if "/review/visitor" in frame.url]
            if review_frames:
                break
            await page.wait_for_timeout(500)
        if not review_frames:
            return
        for frame in review_frames:
            await frame.wait_for_load_state("domcontentloaded")
            for _ in range(20):
                if await frame.evaluate("document.body.scrollHeight") > 3000:
                    break
                await page.wait_for_timeout(500)
            previous_position = -1
            stagnant = 0
            for _ in range(24):
                await frame.evaluate("window.scrollBy(0, 700)")
                await page.wait_for_timeout(250)
                position = await frame.evaluate("window.scrollY")
                if position == previous_position:
                    stagnant += 1
                else:
                    stagnant = 0
                previous_position = position
                if stagnant >= 3:
                    break

            await frame.locator(".pui__vn15t2").first.wait_for(timeout=self.timeout_ms)

            expanders = frame.locator("a.pui__wFzIYl")
            for index in range(min(await expanders.count(), self.limit)):
                expander = expanders.nth(index)
                if await expander.is_visible():
                    await expander.click()

    async def _apollo_states(self, page: Page) -> list[Any]:
        states: list[Any] = []
        for frame in [page.main_frame, *page.frames]:
            try:
                state = parse_apollo_state(await frame.content())
            except Exception:  # 프레임이 닫혔으면 날짜 보강만 건너뛴다
                continue
            if state is not None:
                states.append(state)
        return states

    async def _extract_review_texts(self, page: Page) -> list[str]:
        result: list[str] = []
        frames: list[Frame] = [page.main_frame, *page.frames]
        for frame in frames:
            for selector in REVIEW_SELECTORS:
                locator = frame.locator(selector)
                count = min(await locator.count(), self.limit * 2)
                for index in range(count):
                    text = await locator.nth(index).inner_text()
                    if text:
                        result.append(text)
        return result
