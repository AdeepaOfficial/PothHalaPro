@echo off
setlocal
cd /d "%~dp0"
echo ===============================================================
echo  PothHalaPro - All-in-One Bookshop & Education Print Studio
echo  Sri Lanka 1:1 Scale Millimeter Print System
echo ===============================================================

if not exist "bin" mkdir "bin"

echo Compiling Java Server...
javac -d bin src\server\PothHalaServer.java
if errorlevel 1 (
    echo [ERROR] Compilation failed. Please ensure JDK 21+ is installed.
    pause
    exit /b 1
)

echo Starting PothHalaServer on http://localhost:8080...
start /b java -cp bin server.PothHalaServer

timeout /t 2 >nul
echo Opening PothHalaPro in your browser...
start http://localhost:8080

echo Server is active. Close this window to stop the server.
pause
