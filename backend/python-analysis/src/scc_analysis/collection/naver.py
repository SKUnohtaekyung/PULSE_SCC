import hashlib
import ipaddress
import re
import socket
from collections.abc import Iterable
from datetime import date
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


def build_reviews(texts: Iterable[str], limit: int) -> list[CollectedReview]:
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
                written_at=_extract_date(normalized),
            )
        )
        if len(reviews) >= limit:
            break
    return reviews


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
        try:
            await page.goto(target, wait_until="domcontentloaded", timeout=self.timeout_ms)
            validate_collection_page_url(page.url)
            await self._open_review_surface(page)
            texts = await self._extract_review_texts(page)
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

        reviews = build_reviews(texts, self.limit)
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
