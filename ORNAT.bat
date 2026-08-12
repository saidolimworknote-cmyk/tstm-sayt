@echo off
REM TSTM saytini yangi kompyuterga o'rnatish.
REM Bu faylni ikki marta bosing. ORNAT.ps1 yonida turishi shart.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ORNAT.ps1" %*
echo.
echo Yopish uchun istalgan tugmani bosing...
pause >nul
