import copy
import logging
from contextvars import ContextVar
from typing import Any

from uvicorn.config import LOGGING_CONFIG

# 요청을 처리하는 동안의 분석 작업 ID. asyncio.to_thread 는 호출 시점의 context 를 복사하므로
# 분석 스레드 안에서 남긴 로그에도 같은 ID 가 붙는다.
current_job_id: ContextVar[str] = ContextVar("scc_job_id", default="-")

LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s job=%(job_id)s %(message)s"


class JobIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.job_id = current_job_id.get()
        return True


def log_config() -> dict[str, Any]:
    """uvicorn 기본 설정에 이 서비스 로거만 더한다.

    설정이 없으면 서비스 로그는 logging 의 lastResort 로 레벨·시각 없이 메시지만 나오고,
    INFO 는 버려진다. uvicorn 자체 로그 형식은 바꾸지 않는다.
    """
    config = copy.deepcopy(LOGGING_CONFIG)
    config["filters"] = {
        **config.get("filters", {}),
        "job_id": {"()": "scc_analysis.core.logs.JobIdFilter"},
    }
    config["formatters"]["scc"] = {"format": LOG_FORMAT}
    config["handlers"]["scc"] = {
        "class": "logging.StreamHandler",
        "formatter": "scc",
        "filters": ["job_id"],
        "stream": "ext://sys.stderr",
    }
    config["loggers"]["scc_analysis"] = {
        "handlers": ["scc"],
        "level": "INFO",
        "propagate": False,
    }
    return config
