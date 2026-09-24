import sys
from types import SimpleNamespace

import pytest

from scc_analysis import __main__ as runtime


def run_main(monkeypatch, platform: str, environment: str = "test") -> dict[str, object]:
    captured: dict[str, object] = {}
    settings = SimpleNamespace(host="127.0.0.2", port=18001, environment=environment)

    monkeypatch.setattr(runtime, "get_settings", lambda: settings)
    monkeypatch.setattr(runtime.sys, "platform", platform)
    monkeypatch.setattr(
        runtime.uvicorn,
        "run",
        lambda application, **options: captured.update(application=application, **options),
    )

    runtime.main()
    return captured


def test_runtime_uses_service_settings(monkeypatch) -> None:
    captured = run_main(monkeypatch, "linux")

    assert captured == {
        "application": "scc_analysis.main:app",
        "host": "127.0.0.2",
        "port": 18001,
        "reload": False,
        "loop": "auto",
    }


def test_reload_follows_the_local_environment(monkeypatch) -> None:
    assert run_main(monkeypatch, "linux", environment="local")["reload"] is True
    assert run_main(monkeypatch, "linux", environment="production")["reload"] is False


def test_windows_pins_the_proactor_loop(monkeypatch) -> None:
    """Windows 에서는 Proactor 루프를 강제해야 한다.

    uvicorn 은 reload 를 켜면 Windows 에서 SelectorEventLoop 를 고르는데, 그 루프는
    asyncio 서브프로세스를 지원하지 않아 Playwright 가 브라우저를 띄우지 못한다.
    reload 가 켜진 조합에서 특히 중요하므로 함께 고정한다.
    """
    captured = run_main(monkeypatch, "win32", environment="local")

    assert captured["loop"] == runtime.WINDOWS_LOOP_FACTORY
    assert captured["reload"] is True


@pytest.mark.skipif(sys.platform != "win32", reason="Windows 전용 루프 팩토리")
def test_the_pinned_loop_factory_supports_subprocesses() -> None:
    """팩토리 문자열이 실제로 서브프로세스를 지원하는 루프를 만드는지 확인한다.

    문자열 오타나 uvicorn 의 해석 방식 변경을 조기에 잡는다.
    """
    import asyncio

    from uvicorn.importer import import_from_string

    factory = import_from_string(runtime.WINDOWS_LOOP_FACTORY)
    loop = factory()
    try:

        async def echo() -> str:
            process = await asyncio.create_subprocess_exec(
                "cmd", "/c", "echo ok", stdout=asyncio.subprocess.PIPE
            )
            stdout, _ = await process.communicate()
            return stdout.decode().strip()

        assert loop.run_until_complete(echo()) == "ok"
    finally:
        loop.close()
