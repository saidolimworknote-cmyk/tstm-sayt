@echo off
chcp 65001 >nul
title TSTM Saytini Ishga Tushirish
echo ======================================================
echo    TSTM Saytini XAMPP orqali ishga tushirish
echo ======================================================
echo.

REM XAMPP MySQL va Apache xizmatlarini tekshirish / ishga tushirish
if exist "C:\xampp\mysql_start.bat" (
    echo [1/3] MySQL ishga tushirilmoqda...
    start /min "" "C:\xampp\mysql_start.bat"
)

if exist "C:\xampp\apache_start.bat" (
    echo [2/3] Apache ishga tushirilmoqda...
    start /min "" "C:\xampp\apache_start.bat"
)

timeout /t 2 /nobreak >nul

echo [3/3] Brauzerda sayt ochilmoqda: http://localhost/sayt/
start "" "http://localhost/sayt/"

echo.
echo Sayt muvaffaqiyatli ochildi!
echo Boshqaruv paneli: http://localhost/sayt/admin.html
echo.
timeout /t 3 >nul
exit
