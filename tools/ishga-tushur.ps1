# ==================================================================
# TSTM - saytni MAHALLIY ishga tushirish (XAMPP Control Panel'siz)
# ------------------------------------------------------------------
# NIMA QILADI
#   1) php.exe ni topadi (PATH -> XAMPP)
#   2) MySQL javob berayotganini tekshiradi (kerak bo'lsa xizmatni yoqadi)
#   3) PHP'ning o'z serverini loyiha papkasidan ko'taradi
#   4) brauzerda saytni ochadi
#
# NEGA APACHE YO'Q
#   Sayt shu papkadan TO'G'RIDAN-TO'G'RI uzatiladi. `htdocs\sayt`
#   junction'i, XAMPP Control Panel va Apache endi kerak emas -
#   ular faqat ortiqcha qadam edi. Himoya (`.htaccess` qoidalari)
#   `router.php` ichida takrorlangan.
#
# TO'XTATISH
#   Shu oynada Ctrl+C bosing yoki oynani yoping.
#
# ISHLATISH
#   tools\ISHGA_TUSHIRISH.bat            (ikki marta bosing)
#   powershell -ExecutionPolicy Bypass -File tools\ishga-tushur.ps1
#
# Qo'shimcha kalitlar
#   -Port 8080        boshqa port (standart: 8000)
#   -NoBrauzer        brauzerni ochmasin
#   -Php "D:\php\php.exe"   php.exe boshqa joyda bo'lsa
# ==================================================================
param(
  [int]$Port = 8000,
  [switch]$NoBrauzer,
  [string]$Php = ''
)

$ErrorActionPreference = 'Stop'
$sayt = Split-Path $PSScriptRoot -Parent   # skript tools\ ichida, loyiha ildizi yuqorida

function Ok($m)   { Write-Host "  [OK]   $m" -ForegroundColor Green }
function Ogoh($m) { Write-Host "  [OGOH] $m" -ForegroundColor Yellow }
function Xato($m) { Write-Host "  [XATO] $m" -ForegroundColor Red }

# --- Port holatini tekshirish uchun IKKI funksiya ---------------------
# Ular ataylab ajratilgan, chunki savol ikki xil:
#   Ulanadimi   -> "MySQL javob beryaptimi" (manzil uzoqda ham bo'lishi mumkin)
#   Tinglanmoqda-> "shu kompyuterda bu portni kimdir band qilganmi"

# MySQL uchun: haqiqiy ulanishga urinish. Test-NetConnection sekin, TcpClient tez.
function Port-Ulanadi([string]$xost, [int]$p, [int]$msKut = 400) {
  $c = New-Object System.Net.Sockets.TcpClient
  try {
    $r = $c.BeginConnect($xost, $p, $null, $null)
    if (-not $r.AsyncWaitHandle.WaitOne($msKut, $false)) { return $false }
    $c.EndConnect($r); return $true
  } catch { return $false } finally { $c.Close() }
}

# O'z serverimiz porti uchun: kim tinglayotganini OPERATSION TIZIMDAN so'raymiz.
# NEGA TcpClient EMAS: PowerShell 5.1 (.NET Framework) dagi `TcpClient` faqat
# IPv4 (AddressFamily.InterNetwork) bilan ishlaydi, `php -S localhost:PORT`
# esa Windows'da IPv6 (::1) ga bog'lanadi. Ya'ni TcpClient band portni BO'SH
# deb ko'rsatardi va ikkinchi nusxa xuddi shu portga urinib, jimgina buzilgan
# holat yasardi. Get-NetTCPConnection ikkala oilani ham ko'radi.
function Port-Tinglanmoqda([int]$p) {
  try {
    $x = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction Stop
    return ($null -ne $x)
  } catch {
    # Get-NetTCPConnection yo'q bo'lsa (juda eski Windows) - IPv4 bilan chamalaymiz.
    return (Port-Ulanadi '127.0.0.1' $p)
  }
}

Write-Host ""
Write-Host "TSTM - mahalliy server" -ForegroundColor Cyan
Write-Host ("=" * 60)

# ---- 1. PHP -------------------------------------------------------
if ($Php -eq '') {
  $cmd = Get-Command php.exe -ErrorAction SilentlyContinue
  if ($cmd) { $Php = $cmd.Source }
}
if ($Php -eq '' -or -not (Test-Path $Php)) {
  foreach ($c in @('C:\xampp\php\php.exe', 'D:\xampp\php\php.exe',
                   'E:\xampp\php\php.exe', "$env:USERPROFILE\xampp\php\php.exe")) {
    if (Test-Path $c) { $Php = $c; break }
  }
}
if ($Php -eq '' -or -not (Test-Path $Php)) {
  Write-Host ""
  Xato "php.exe topilmadi."
  Write-Host "  Sayt PHP'da yozilgan - usiz ishga tushmaydi." -ForegroundColor Yellow
  Write-Host "  Yechim: https://windows.php.net/download dan PHP 8.2+ (Thread Safe, x64)" -ForegroundColor Yellow
  Write-Host "  yuklab, papkasini PATH ga qo'shing. Yoki yo'lini ko'rsating:" -ForegroundColor Yellow
  Write-Host "     tools\ishga-tushur.ps1 -Php ""D:\php\php.exe""" -ForegroundColor Yellow
  exit 1
}
$ver = (& $Php -r 'echo PHP_VERSION;')
Ok "PHP $ver  ($Php)"
if ($ver -match '^(\d+)\.(\d+)' -and [int]$Matches[1] -lt 8) { Ogoh "sayt PHP 8.0+ talab qiladi" }

# pdo_mysql bo'lmasa baza umuman ochilmaydi - oldindan aytamiz.
# `php -m` ishlatiladi, `php -r` emas: PowerShell 5.1 native exe ga
# uzatilayotgan argument ichidagi qo'shtirnoqni yeb qo'yadi va PHP kodi
# buzilib ketadi. `-m` esa argumentsiz, har bir kengaytmani alohida qatorda beradi.
$mods = @(& $Php -m)
if ($mods -notcontains 'pdo_mysql') {
  Xato "PHP'da pdo_mysql kengaytmasi yo'q"
  Write-Host "  php.ini da 'extension=pdo_mysql' qatorini yoqing." -ForegroundColor Yellow
  exit 1
}

# ---- 2. MySQL -----------------------------------------------------
# Baza porti config.php dan o'qiladi (odatda 3306).
$dbPort = 3306; $dbHost = '127.0.0.1'
$cfg = Join-Path $sayt 'config.php'
if (Test-Path $cfg) {
  $t = [System.IO.File]::ReadAllText($cfg, [System.Text.Encoding]::UTF8)
  if ($t -match "'db_port'\s*=>\s*'(\d+)'") { $dbPort = [int]$Matches[1] }
  if ($t -match "'db_host'\s*=>\s*'([^']*)'") { $dbHost = $Matches[1] }
}

if (Port-Ulanadi $dbHost $dbPort) {
  Ok "MySQL javob beryapti (${dbHost}:${dbPort})"
} else {
  Ogoh "MySQL javob bermayapti - xizmat yoqilmoqda..."
  $svc = Get-Service -Name 'mysql*' -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($svc) {
    try { Start-Service $svc.Name -ErrorAction Stop } catch {
      Xato "'$($svc.Name)' xizmatini yoqib bo'lmadi (administrator huquqi kerak bo'lishi mumkin)"
    }
    for ($i = 0; $i -lt 20; $i++) { if (Port-Ulanadi $dbHost $dbPort) { break }; Start-Sleep -Milliseconds 500 }
  }
  if (Port-Ulanadi $dbHost $dbPort) {
    Ok "MySQL ko'tarildi (${dbHost}:${dbPort})"
  } else {
    Xato "MySQL ishga tushmadi."
    Write-Host "  Sayt ochiladi, lekin kontent ko'rinmaydi (baza yo'q)." -ForegroundColor Yellow
    Write-Host "  Qo'lda yoqish:  net start mysql   (administrator PowerShell'da)" -ForegroundColor Yellow
    Write-Host ""
  }
}

# ---- 3. Port ------------------------------------------------------
# Band bo'lsa keyingisiga o'tamiz: sayt ikkinchi marta ishga tushirilganda
# xato bermay, yonidagi portda ochilaveradi.
$boshPort = $Port
while (Port-Tinglanmoqda $Port) {
  # Ehtimol sayt allaqachon ishlayapti - shuni aytamiz va keyingi portga o'tamiz.
  Ogoh "$Port porti band (sayt allaqachon ishlayotgan bo'lishi mumkin)"
  $Port++
  if ($Port -gt $boshPort + 20) { Xato "bo'sh port topilmadi"; exit 1 }
}
$url = "http://localhost:$Port/"

# ---- 4. Server ----------------------------------------------------
$router = Join-Path $sayt 'router.php'
if (-not (Test-Path $router)) { Xato "router.php topilmadi: $router"; exit 1 }

Write-Host ""
Write-Host "  Sayt:   $url" -ForegroundColor Cyan
Write-Host "  Admin:  ${url}admin.html" -ForegroundColor Cyan
Write-Host "  Papka:  $sayt"
Write-Host ""
Write-Host "  To'xtatish uchun: Ctrl+C" -ForegroundColor DarkGray
Write-Host ("=" * 60)
Write-Host ""

# `.htaccess` dagi php_value'lar mahalliy serverda ishlamaydi (u .htaccess
# o'qimaydi), shuning uchun ayni chegaralarni buyruq qatoridan beramiz.
$phpArgs = @(
  '-d', 'upload_max_filesize=64M',
  '-d', 'post_max_size=64M',
  '-d', 'memory_limit=256M',
  '-S', "localhost:$Port",
  '-t', $sayt,
  $router
)

$srv = Start-Process -FilePath $Php -ArgumentList $phpArgs -WorkingDirectory $sayt -NoNewWindow -PassThru
try {
  # Server ko'tarilishini kutib, keyin brauzerni ochamiz - aks holda
  # brauzer "ulanib bo'lmadi" sahifasini ko'rsatib qo'yadi.
  for ($i = 0; $i -lt 40; $i++) {
    if (Port-Tinglanmoqda $Port) { break }
    Start-Sleep -Milliseconds 250
  }
  if (-not $NoBrauzer) { Start-Process $url }
  Wait-Process -Id $srv.Id
} finally {
  # Ctrl+C yoki oyna yopilganda php.exe orqada qolib ketmasin.
  if ($srv -and -not $srv.HasExited) {
    Stop-Process -Id $srv.Id -Force -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "Server to'xtatildi." -ForegroundColor DarkGray
  }
}
