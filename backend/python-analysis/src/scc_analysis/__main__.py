import sys

import uvicorn

from scc_analysis.core.config import get_settings

# Windows 에서 reload 를 켜면 uvicorn 이 SelectorEventLoop 를 고른다
# (uvicorn/loops/asyncio.py — win32 이고 use_subprocess 면 Selector).
# Selector 루프는 asyncio 서브프로세스를 지원하지 않아서 Playwright 가 브라우저를
# 띄우지 못하고 NotImplementedError 로 죽는다. 리뷰 수집이 서버 안에서만 실패하고
# 스크립트로는 동작하던 원인이다.
#
# uvicorn 은 loop 에 "module:attr" 형태의 커스텀 루프 팩토리를 받는다
# (Config.get_loop_factory). 이 경로로 Proactor 루프를 강제한다.
WINDOWS_LOOP_FACTORY = "asyncio:ProactorEventLoop"


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "scc_analysis.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "local",
        loop=WINDOWS_LOOP_FACTORY if sys.platform == "win32" else "auto",
    )


if __name__ == "__main__":
    main()
