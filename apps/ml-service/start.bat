@echo off
echo ========================================
echo ClinixSol ML Service Startup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

echo Checking virtual environment...
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo Virtual environment created successfully
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing/Updating dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Checking for trained model...
if not exist models\disease_model.pkl (
    echo Model not found. Training model...
    echo This may take a few minutes...
    echo.
    python scripts\train_model.py
    if errorlevel 1 (
        echo ERROR: Model training failed
        pause
        exit /b 1
    )
) else (
    echo Model found!
)

echo.
echo ========================================
echo Starting ML Service on port 5001...
echo ========================================
echo.
echo Access endpoints:
echo - Health Check: http://localhost:5001/health
echo - Symptoms: http://localhost:5001/symptoms/all
echo - Predict: POST http://localhost:5001/predict
echo.
echo Press Ctrl+C to stop the service
echo ========================================
echo.

python app\main.py
