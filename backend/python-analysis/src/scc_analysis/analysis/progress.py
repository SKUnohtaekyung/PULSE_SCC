import threading

# 처리 중인 분석 작업이 지금 어느 단계에 있는지를 기억한다. Spring 이 주기적으로 읽어
# 공개 작업 상태의 progressStep 에 옮긴다(API.md 5.2).
#
# 실제로 그 단계의 일을 시작할 때만 기록한다. 시간에 맞춰 넘기지 않는다.
# 한 프로세스 안의 메모리에만 둔다. 프로세스가 죽으면 요청도 함께 끊기고, Spring 은
# 임대 만료로 작업을 다시 큐에 넣으므로 단계를 따로 보존할 필요가 없다.

COLLECTING_REVIEWS = "COLLECTING_REVIEWS"
ANALYZING = "ANALYZING"
GENERATING_IMAGE = "GENERATING_IMAGE"

_lock = threading.Lock()
_steps: dict[str, str] = {}


def set_step(job_id: str, step: str) -> None:
    # 분석은 asyncio.to_thread 로 다른 스레드에서 돌므로 잠근다.
    with _lock:
        _steps[job_id] = step


def get_step(job_id: str) -> str | None:
    with _lock:
        return _steps.get(job_id)


def clear(job_id: str) -> None:
    with _lock:
        _steps.pop(job_id, None)
