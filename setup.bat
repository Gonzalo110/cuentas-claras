@echo off
title Cuentas Claras - Instalacion
color 0E

echo.
echo  ========================================
echo    CUENTAS CLARAS - Instalacion inicial
echo  ========================================
echo.

:: ---- VERIFICAR PYTHON ----
echo [1/6] Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Python no esta instalado o no esta en PATH.
    echo  Descargalo de https://www.python.org/downloads/
    echo  IMPORTANTE: Marca "Add Python to PATH" al instalar.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version 2^>^&1') do echo       %%i detectado

:: ---- VERIFICAR NODE ----
echo.
echo [2/6] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Node.js no esta instalado o no esta en PATH.
    echo  Descargalo de https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version 2^>^&1') do echo       Node %%i detectado
for /f "tokens=*" %%i in ('npm --version 2^>^&1') do echo       npm %%i detectado

:: ---- ENTORNO VIRTUAL PYTHON ----
echo.
echo [3/6] Creando entorno virtual de Python...
cd /d "%~dp0backend"

if exist "venv" (
    echo       El entorno virtual ya existe. Eliminando para reinstalar...
    rmdir /s /q venv
)

python -m venv venv
if %errorlevel% neq 0 (
    echo  [ERROR] No se pudo crear el entorno virtual.
    pause
    exit /b 1
)
echo       venv creado en backend\venv

:: ---- DEPENDENCIAS PYTHON ----
echo.
echo [4/6] Instalando dependencias de Python...
call venv\Scripts\activate.bat
pip install --upgrade pip --quiet 2>nul
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo  [ERROR] Fallo la instalacion de dependencias de Python.
    pause
    exit /b 1
)
echo.
echo       Dependencias de Python instaladas correctamente.

:: ---- ARCHIVO .env ----
echo.
echo [5/6] Configurando archivo .env del backend...
cd /d "%~dp0backend"
if not exist ".env" (
    copy .env.example .env >nul
    echo       .env creado desde .env.example
    echo       IMPORTANTE: Edita backend\.env con tus credenciales de Mercado Pago.
) else (
    echo       .env ya existe, no se sobreescribe.
)

:: ---- DEPENDENCIAS NODE ----
echo.
echo [6/6] Instalando dependencias de frontend (npm install)...
cd /d "%~dp0frontend"

if exist "node_modules" (
    echo       node_modules ya existe. Eliminando para reinstalar...
    rmdir /s /q node_modules
)

call npm install
if %errorlevel% neq 0 (
    echo  [ERROR] Fallo la instalacion de dependencias de Node.
    pause
    exit /b 1
)
echo.
echo       Dependencias de Node instaladas correctamente.

:: ---- VERIFICACION FINAL ----
echo.
echo.
color 0A
echo  ========================================
echo        INSTALACION COMPLETADA
echo  ========================================
echo.
echo  Todo listo. Estructura instalada:
echo.
echo    backend\venv\          Entorno virtual Python
echo    backend\.env           Variables de entorno
echo    backend\requirements   FastAPI, SQLAlchemy, JWT, etc.
echo    frontend\node_modules\ React, Tailwind, etc.
echo.
echo  ----------------------------------------
echo   SIGUIENTE PASO:
echo   Ejecuta start.bat para iniciar la app.
echo  ----------------------------------------
echo.
pause
