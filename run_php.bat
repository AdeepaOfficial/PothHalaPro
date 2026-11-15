@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
echo ===============================================================
echo  PothHalaPro - All-in-One Bookshop & Education Print Studio
echo  PHP REST API & Web Server Launcher
echo ===============================================================

set "PHP_CMD="

:: Check if php is in PATH
where php >nul 2>&1
if not errorlevel 1 (
    set "PHP_CMD=php"
) else if exist "C:\xampp\php\php.exe" (
    set "PHP_CMD=C:\xampp\php\php.exe"
) else if exist "C:\wamp64\bin\php\php8.2.13\php.exe" (
    set "PHP_CMD=C:\wamp64\bin\php\php8.2.13\php.exe"
) else (
    for /d %%D in ("C:\wamp64\bin\php\php*") do (
        if exist "%%D\php.exe" set "PHP_CMD=%%D\php.exe"
    )
)

if "%PHP_CMD%"=="" (
    echo [ERROR] PHP executable not found in PATH or standard XAMPP/WAMP directories.
    echo Please ensure XAMPP (C:\xampp) or WAMP (C:\wamp64) is installed, or add PHP to PATH.
    pause
    exit /b 1
)

echo Found PHP at: %PHP_CMD%
echo Starting PothHalaPro on http://localhost:8080...
start /b "" "%PHP_CMD%" -S localhost:8080 -t public

timeout /t 2 >nul
echo Opening PothHalaPro in your browser...
start http://localhost:8080

echo Server is running on http://localhost:8080. Close this window to stop.
pause
