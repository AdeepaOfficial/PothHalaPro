@echo off
setlocal enabledelayedexpansion

title PothHalaPro - QA Automated Test Suite Runner

echo ==============================================================================
echo              POTHAHALAPRO - AUTOMATED QA TEST SUITE RUNNER
echo ==============================================================================
echo.

:: Detect Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is required to execute automated unit tests.
    echo Please install Node.js v18 or higher, or ensure node is in your system PATH.
    echo.
    exit /b 1
)

:: Navigate to project root if executed from within tests directory
set "SCRIPT_DIR=%~dp0"
set "ROOT_DIR=%SCRIPT_DIR%.."
cd /d "%ROOT_DIR%"

echo [INFO] Environment: Node.js runtime detected:
node -v
echo [INFO] Executing all QA unit test suites...
echo.

node tests\test_runner.js
set "TEST_EXIT_CODE=%ERRORLEVEL%"

if %TEST_EXIT_CODE% equ 0 (
    echo [SUCCESS] All PothHalaPro automated QA test suites completed successfully.
    exit /b 0
) else (
    echo [FAILURE] One or more QA tests failed. Review the test execution summary above.
    exit /b %TEST_EXIT_CODE%
)
