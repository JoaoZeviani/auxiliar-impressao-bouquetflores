@echo off
setlocal
set "APP_DIR=%~dp0"
set "HTML=%APP_DIR%index.html"
set "URL=file:///%HTML:\=/%"
set "USERDATA=%APP_DIR%dados\perfil-navegador"

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%URL%" --user-data-dir="%USERDATA%"
  exit /b
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%URL%" --user-data-dir="%USERDATA%"
  exit /b
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
  start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="%URL%" --user-data-dir="%USERDATA%"
  exit /b
)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%URL%" --user-data-dir="%USERDATA%"
  exit /b
)

start "" "%HTML%"
