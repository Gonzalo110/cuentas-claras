@echo off
title Cuentas Claras - Iniciando...
color 0A

echo.
echo  ========================================
echo    CUENTAS CLARAS - Gastos Compartidos
echo  ========================================
echo.

:: Verificar Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python no esta instalado o no esta en PATH.
    echo Descargalo de https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Verificar Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado o no esta en PATH.
    echo Descargalo de https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Python y Node.js detectados
echo.

:: ---- BACKEND ----
echo [1/4] Configurando backend...
cd /d "%~dp0backend"

if not exist "venv" (
    echo       Creando entorno virtual...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo [2/4] Instalando dependencias de Python...
pip install -r requirements.txt --quiet 2>nul

:: ---- FRONTEND ----
echo [3/4] Instalando dependencias de frontend...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    call npm install --silent 2>nul
) else (
    echo       node_modules ya existe, saltando...
)

:: ---- INICIAR AMBOS ----
echo [4/4] Iniciando servidores...
echo.
echo  ----------------------------------------
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo   Frontend: http://localhost:5173
echo  ----------------------------------------
echo.
echo   Presiona Ctrl+C en cada ventana para detener.
echo.

:: Iniciar backend en ventana separada
cd /d "%~dp0backend"
start "Cuentas Claras - Backend" cmd /k "title Cuentas Claras - Backend (FastAPI) & color 0B & call venv\Scripts\activate.bat & echo. & echo [BACKEND] Iniciando FastAPI en puerto 8000... & echo. & uvicorn app.main:app --reload --port 8000"

:: Esperar 2 segundos para que el backend arranque primero
timeout /t 2 /nobreak >nul

:: Iniciar frontend en ventana separada
cd /d "%~dp0frontend"
start "Cuentas Claras - Frontend" cmd /k "title Cuentas Claras - Frontend (React) & color 0D & echo. & echo [FRONTEND] Iniciando React en puerto 5173... & echo. & npm run dev"

:: Esperar 3 segundos y abrir el navegador
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo  [LISTO] La app se abrio en tu navegador.
echo  Se abrieron 2 ventanas de terminal (backend y frontend).
echo  Cerra ambas ventanas para detener la app.
echo.
pause
