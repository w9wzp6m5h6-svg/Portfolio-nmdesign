@echo off
rem Double-click to open the portfolio in your browser (Windows).
cd /d "%~dp0"
set "DIST=..\dist"
if not exist "%DIST%" set "DIST=.\dist"
where node >nul 2>nul
if %errorlevel%==0 (
  node serve.mjs "%DIST%"
  goto :eof
)
where py >nul 2>nul
if %errorlevel%==0 (
  echo Node.js not found - using Python. Open http://localhost:4173/
  start "" "http://localhost:4173/"
  py -m http.server 4173 --directory "%DIST%"
  goto :eof
)
echo Install Node.js (https://nodejs.org) or Python 3, then double-click again.
pause
