@echo off
rem Launcher for reset-db.ps1. Arguments are passed through, e.g.  reset-db.cmd -DryRun
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0reset-db.ps1" %*
echo.
pause
