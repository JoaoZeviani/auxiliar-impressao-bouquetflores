@echo off
setlocal
set "APP_DIR=%~dp0"
set "TARGET=%APP_DIR%abrir-programa.bat"
set "ICON=%APP_DIR%assets\icon.ico"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$W=New-Object -ComObject WScript.Shell; $D=[Environment]::GetFolderPath('Desktop'); $S=$W.CreateShortcut((Join-Path $D 'Auxiliar de Impressao - Bouquet Flores.lnk')); $S.TargetPath='%TARGET%'; $S.WorkingDirectory='%APP_DIR%'; $S.IconLocation='%ICON%'; $S.Save()"
echo Atalho criado na Area de Trabalho.
pause
