@echo off
REM Arranca la API con node (evita el bloqueo de npm.ps1 en PowerShell)
cd /d "%~dp0"
node index.js
pause