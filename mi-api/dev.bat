@echo off
REM Arranca la API con nodemon (evita el bloqueo de npm.ps1 en PowerShell)
cd /d "%~dp0"
npm.cmd run dev
pause