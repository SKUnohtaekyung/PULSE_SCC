@echo off
rem Double-click launcher for demo-start.ps1. Extra arguments are passed through,
rem e.g.  demo-start.cmd -InstallApk   or   demo-start.cmd -Stop
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0demo-start.ps1" %*
echo.
pause
