from types import SimpleNamespace

from scc_analysis import __main__ as runtime


def test_runtime_uses_service_settings(monkeypatch) -> None:
    captured: dict[str, object] = {}
    settings = SimpleNamespace(host="127.0.0.2", port=18001, environment="test")

    monkeypatch.setattr(runtime, "get_settings", lambda: settings)
    monkeypatch.setattr(
        runtime.uvicorn,
        "run",
        lambda application, **options: captured.update(
            application=application,
            **options,
        ),
    )

    runtime.main()

    assert captured == {
        "application": "scc_analysis.main:app",
        "host": "127.0.0.2",
        "port": 18001,
        "reload": False,
    }
