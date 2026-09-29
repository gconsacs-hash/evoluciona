@echo off
title Evoluciona
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   No se encontro Node.js en este equipo.
  echo   Descargalo desde https://nodejs.org e instalalo, luego vuelve a abrir este archivo.
  echo.
  pause
  exit /b 1
)

start "" http://localhost:4173
node servidor.js
pause
