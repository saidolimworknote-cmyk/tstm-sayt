@echo off
REM ==================================================================
REM TSTM saytini mahalliy ishga tushirish.
REM Bu faylni ikki marta bosing. ishga-tushur.ps1 yonida turishi shart.
REM
REM XAMPP Control Panel, Apache va htdocs junction'i endi KERAK EMAS —
REM sayt shu papkadan to'g'ridan-to'g'ri uzatiladi.
REM
REM To'xtatish: shu oynada Ctrl+C yoki oynani yopish.
REM ==================================================================
chcp 65001 >nul
title TSTM - mahalliy server
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ishga-tushur.ps1" %*
echo.
echo Yopish uchun istalgan tugmani bosing...
pause >nul
