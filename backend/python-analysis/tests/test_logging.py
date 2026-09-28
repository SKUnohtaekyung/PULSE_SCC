import asyncio
import logging
import os
import re
import subprocess
import sys
import textwrap
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import SecretStr

from scc_analysis.analysis.models import AnalyzeRequest
from scc_analysis.api import analysis as analysis_api
from scc_analysis.collection.naver import ReviewCollectionError
from scc_analysis.core.logs import current_job_id, log_config
from scc_analysis.main import app

_REQUEST = {
    "job_id": "job-123",
    "store_name": "테스트 매장",
    "category": "한식",
    "naver_place_url": "https://map.naver.com/p/entry/place/1",
}


def test_service_log_lines_carry_time_level_logger_and_job_id() -> None:
    # 로그 설정은 전역 상태라 다른 테스트에 번지지 않게 자식 프로세스에서 적용한다.
    script = textwrap.dedent(
        """
        import asyncio, logging, logging.config
        from scc_analysis.core.logs import current_job_id, log_config

        logging.config.dictConfig(log_config())
        log = logging.getLogger("scc_analysis.analysis.models")
        log.info("바깥")
        current_job_id.set("job-123")
        log.warning("요청 안")
        asyncio.run(asyncio.to_thread(log.info, "분석 스레드 안"))
        logging.getLogger("uvicorn.error").info("uvicorn 로그")
        """
    )
    result = subprocess.run(
        [sys.executable, "-c", script],
        capture_output=True,
        check=True,
        encoding="utf-8",
        env={**os.environ, "PYTHONIOENCODING": "utf-8"},
    )
    lines = result.stderr.splitlines()

    prefix = r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3} (\w+) scc_analysis\.analysis\.models "
    expected = [
        ("INFO", "job=- 바깥"),
        ("WARNING", "job=job-123 요청 안"),
        ("INFO", "job=job-123 분석 스레드 안"),
    ]
    assert len(lines) == 4, lines
    for line, (level, rest) in zip(lines, expected, strict=False):
        match = re.match(prefix + re.escape(rest) + "$", line)
        assert match is not None, line
        assert match.group(1) == level
    assert lines[3] == "INFO:     uvicorn 로그"


def test_analysis_request_logs_run_under_its_job_id(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    seen: list[str] = []

    async def fail(request: object) -> None:
        seen.append(current_job_id.get())
        raise ReviewCollectionError("REVIEW_COLLECTION_BLOCKED", "막힘", retryable=True)

    monkeypatch.setattr(analysis_api, "run_analysis", fail)
    monkeypatch.setattr(
        analysis_api, "get_settings", lambda: SimpleNamespace(service_token=SecretStr("t"))
    )

    with caplog.at_level(logging.INFO, logger="scc_analysis"):
        response = TestClient(app).post(
            "/internal/v1/analysis-jobs", json=_REQUEST, headers={"X-SCC-Service-Token": "t"}
        )

    assert response.status_code == 422
    assert seen == ["job-123"]
    messages = [record.getMessage() for record in caplog.records]
    assert messages[0] == "분석 요청을 받았습니다."
    assert messages[1].startswith("분석이 실패했습니다: REVIEW_COLLECTION_BLOCKED (")


def test_job_id_is_cleared_after_the_request(monkeypatch: pytest.MonkeyPatch) -> None:
    # TestClient 는 앱을 다른 컨텍스트에서 돌리므로, 같은 컨텍스트에서 직접 await 해 확인한다.
    async def fail(request: object) -> None:
        raise ReviewCollectionError("REVIEW_COLLECTION_BLOCKED", "막힘", retryable=True)

    monkeypatch.setattr(analysis_api, "run_analysis", fail)
    monkeypatch.setattr(
        analysis_api, "get_settings", lambda: SimpleNamespace(service_token=SecretStr("t"))
    )

    async def call() -> str:
        with pytest.raises(HTTPException):
            await analysis_api.analyze(AnalyzeRequest(**_REQUEST), x_scc_service_token="t")
        return current_job_id.get()

    assert asyncio.run(call()) == "-"


def test_log_config_keeps_uvicorn_loggers() -> None:
    config = log_config()

    assert {"uvicorn", "uvicorn.error", "uvicorn.access", "scc_analysis"} <= set(config["loggers"])
    assert config["loggers"]["scc_analysis"]["propagate"] is False
