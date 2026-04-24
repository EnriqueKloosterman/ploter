@echo off
title PlotWeaver Launcher
echo ===================================================
echo Iniciando el ecosistema de PlotWeaver...
echo ===================================================
echo.

echo [1/2] Levantando el Servidor Backend (MongoDB y Express)...
start "PlotWeaver - Backend (Servidor)" cmd /k "cd server && pnpm dev"

echo [2/2] Levantando el Entorno Visual (React y Vite)...
start "PlotWeaver - Frontend (Cliente)" cmd /k "cd client && pnpm dev"

echo.
echo Los servidores estan corriendo en ventanas de apoyo. 
echo Cerrando este lanzador principal en 3 segundos...
timeout /t 3 /nobreak >nul
exit
