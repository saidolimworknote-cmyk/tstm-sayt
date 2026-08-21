# ==================================================================
# TSTM - SAYTNI MAHALLIY ISHGA TUSHIRISH
# ------------------------------------------------------------------
# Bitta kirish nuqtasi. Hech narsa o'rnatilgan bo'lishi shart emas:
# PHP ham, MariaDB ham loyiha ichida (`runtime\`) keladi.
#
# NIMA QILADI
#   1) PHP ni topadi          (runtime\php -> PATH -> XAMPP)
#   2) MariaDB ni ko'taradi   (runtime\mysql, port 3307)
#   3) BIRINCHI marta bo'lsa: baza va foydalanuvchi yaratadi,
#      tasodifiy parol bilan `config.php` yozadi
#   4) Baza bo'sh bo'lsa: `data\baza.sql` dan kontentni import qiladi
#   5) Sayt serverini ko'taradi va brauzerni ochadi
#
# YANGI KOMPYUTERDA
#   git clone ... && tools\ISHGA_TUSHIRISH.bat
#   Boshqa hech narsa kerak emas - XAMPP ham, MySQL o'rnatish ham.
#
# TO'XTATISH
#   Shu oynada Ctrl+C yoki oynani yopish. Ikkala server ham to'xtaydi.
#
# Kalitlar
#   -Port 8080       sayt porti (standart: 8000, band bo'lsa keyingisi)
#   -NoBrauzer       brauzerni ochmasin
#   -Php "D:\php\php.exe"   boshqa PHP ishlatish
# ==================================================================
param(
  [int]$Port = 8000,
  [switch]$NoBrauzer,
  [string]$Php = ''
)

$ErrorActionPreference = 'Stop'
$sayt = Split-Path $PSScriptRoot -Parent

function Ok($m)   { Write-Host "  [OK]   $m" -ForegroundColor Green }
function Ogoh($m) { Write-Host "  [OGOH] $m" -ForegroundColor Yellow }
function Xato($m) { Write-Host "  [XATO] $m" -ForegroundColor Red }

# --- Port holati --------------------------------------------------
# Ulanadimi: masofadagi xizmat javob beryaptimi.
function Port-Ulanadi([string]$xost, [int]$p, [int]$msKut = 400) {
  $c = New-Object System.Net.Sockets.TcpClient
  try {
    $r = $c.BeginConnect($xost, $p, $null, $null)
    if (-not $r.AsyncWaitHandle.WaitOne($msKut, $false)) { return $false }
    $c.EndConnect($r); return $true
  } catch { return $false } finally { $c.Close() }
}
# Tinglanmoqda: shu kompyuterda portni kimdir band qilganmi.
# NEGA TcpClient EMAS: PowerShell 5.1 (.NET Framework) dagi TcpClient
# faqat IPv4, `php -S localhost:PORT` esa Windows'da IPv6 (::1) ga
# bog'lanadi - band port BO'SH ko'rinib qolardi.
function Port-Tinglanmoqda([int]$p) {
  try { return ($null -ne (Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction Stop)) }
  catch { return (Port-Ulanadi '127.0.0.1' $p) }
}

# --- config.php dan qiymat o'qish ---------------------------------
function CfgOqi($matn, $kalit, $standart) {
  if ($matn -match "'$kalit'\s*=>\s*'([^']*)'") { return $Matches[1] }
  return $standart
}

# --- MariaDB mijozini chaqirish -----------------------------------
# PS 5.1 TUZOG'I: native buyruqning stderr'ini PowerShell ICHIDA
# yo'naltirsak ("2>$null"), har bir qator NativeCommandError ga
# o'raladi. Yuqorida $ErrorActionPreference = 'Stop' turgani uchun
# bu TERMINATING xato bo'ladi va skript o'rtada uzilib qoladi.
# mariadb.exe esa oddiy OGOHLANTIRISHNI ham stderr ga yozadi
# (masalan parolsiz kirishda "--ssl-verify-server-cert is disabled")
# - ya'ni hech qanday xato bo'lmasa ham skript yiqilardi. Aynan shu
# sabab toza klonda birinchi ishga tushirish bajarilmasdan to'xtardi.
# Yechim: faqat shu chaqiruv davomida 'Continue' ga o'tamiz. Xatoni
# baribir yo'qotmaymiz - chaqiruvchi $LASTEXITCODE ni tekshiradi.
function Mdb {
  $eski = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { & $mdb @args 2>$null } finally { $ErrorActionPreference = $eski }
}

# DIQQAT: bu uchtasi `try` dan OLDIN e'lon qilinadi. Aks holda try ning
# boshida xato chiqsa, `finally` ularni ko'rmaydi va o'zining "null"
# xatosi bilan ASL xatoni yashirib qo'yadi.
$phpProc = $null
$dbProc  = $null
$vaqtSql = ''

Write-Host ""
Write-Host "TSTM - mahalliy server" -ForegroundColor Cyan
Write-Host ("=" * 60)

try {

# ---- 1. PHP -------------------------------------------------------
$phpIni = ''
$phpExt = ''
if ($Php -eq '') {
  $ichki = Join-Path $sayt 'runtime\php\php.exe'
  if (Test-Path $ichki) { $Php = $ichki }
}
if ($Php -eq '') {
  $cmd = Get-Command php.exe -ErrorAction SilentlyContinue
  if ($cmd) { $Php = $cmd.Source; Ogoh "runtime\php topilmadi - tizimdagi PHP ishlatilyapti" }
}
if ($Php -eq '') {
  foreach ($c in @('C:\xampp\php\php.exe', 'D:\xampp\php\php.exe')) {
    if (Test-Path $c) { $Php = $c; Ogoh "XAMPP dagi PHP ishlatilyapti (eskirgan bo'lishi mumkin)"; break }
  }
}
if ($Php -eq '' -or -not (Test-Path $Php)) {
  Xato "php.exe topilmadi."
  Write-Host "  runtime\php yig'ish uchun:" -ForegroundColor Yellow
  Write-Host "     powershell -ExecutionPolicy Bypass -File tools\runtime-tayyorla.ps1" -ForegroundColor Yellow
  exit 1
}
# Loyihaning O'Z php.ini si bo'lsa - o'shani beramiz, ya'ni sozlamalar
# har kompyuterda bir xil. extension_dir ni MUTLAQ yo'l bilan qayta
# yozamiz: nisbiy yo'l joriy papkaga bog'liq va ishonchsiz.
$ini = Join-Path (Split-Path $Php -Parent) 'php.ini'
if (Test-Path $ini) {
  $phpIni = $ini
  $phpExt = Join-Path (Split-Path $Php -Parent) 'ext'
}
# `php -v` bir NECHA qator qaytaradi. Massivda `-match` filtr sifatida
# ishlaydi va $Matches ni TO'LDIRMAYDI - shuning uchun birinchi qatorni
# olamiz. `-n` php.ini ni o'qimaydi: versiyani bilish uchun kifoya va
# sozlama xatolari bu bosqichda xalaqit bermaydi.
$ver = (& $Php -n -v | Select-Object -First 1)
if ($ver -match 'PHP (\d+\.\d+\.\d+)') { $ver = $Matches[1] }
Ok "PHP $ver"

# pdo_mysql bo'lmasa baza umuman ochilmaydi.
# `php -m` ishlatiladi, `php -r` emas: PowerShell 5.1 native exe ga
# uzatilgan argument ichidagi qo'shtirnoqni yeb qo'yadi.
$mArgs = @()
if ($phpIni -ne '') { $mArgs += @('-c', $phpIni, '-d', "extension_dir=$phpExt") }
$mods = @(& $Php $mArgs -m)
if ($mods -notcontains 'pdo_mysql') {
  Xato "PHP'da pdo_mysql kengaytmasi yo'q"
  exit 1
}

# ---- 2. Sozlamalar ------------------------------------------------
$cfgYol  = Join-Path $sayt 'backend\config.php'
$birinchi = -not (Test-Path $cfgYol)
$dbPort = 3307; $dbHost = '127.0.0.1'; $dbName = 'tstm'; $dbUser = 'tstm'; $dbPass = ''
if (-not $birinchi) {
  $t = [System.IO.File]::ReadAllText($cfgYol, [System.Text.Encoding]::UTF8)
  $dbHost = CfgOqi $t 'db_host' $dbHost
  $dbPort = [int](CfgOqi $t 'db_port' $dbPort)
  $dbName = CfgOqi $t 'db_name' $dbName
  $dbUser = CfgOqi $t 'db_user' $dbUser
  $dbPass = CfgOqi $t 'db_pass' ''
}

# ---- 3. MariaDB ---------------------------------------------------
$mdbd   = Join-Path $sayt 'runtime\mysql\bin\mariadbd.exe'
$mdb    = Join-Path $sayt 'runtime\mysql\bin\mariadb.exe'
$mdbIni = Join-Path $sayt 'runtime\mysql\bin\mariadb-install-db.exe'
$dataDir = Join-Path $sayt 'data\mysql-data'
$portativ = (Test-Path $mdbd)

if ($portativ) {
  if (Port-Ulanadi $dbHost $dbPort) {
    Ok "MariaDB allaqachon ishlayapti (${dbHost}:${dbPort})"
  } else {
    if (-not (Test-Path $dataDir)) {
      Write-Host "  baza katalogi yaratilmoqda (birinchi marta, biroz vaqt oladi)..."
      & $mdbIni --datadir="$dataDir" | Out-Null
      if ($LASTEXITCODE -ne 0) { Xato "baza katalogini yaratib bo'lmadi"; exit 1 }
      Ok "baza katalogi yaratildi"
    }
    $dbProc = Start-Process -FilePath $mdbd `
      -ArgumentList @("--datadir=$dataDir", "--port=$dbPort", '--bind-address=127.0.0.1', '--console') `
      -WorkingDirectory $sayt -WindowStyle Hidden -PassThru
    for ($i = 0; $i -lt 60; $i++) {
      if (Port-Ulanadi $dbHost $dbPort) { break }
      Start-Sleep -Milliseconds 500
    }
    if (-not (Port-Ulanadi $dbHost $dbPort)) { Xato "MariaDB ko'tarilmadi"; exit 1 }
    Ok "MariaDB ko'tarildi (portativ, port $dbPort)"
  }
} else {
  if (Port-Ulanadi $dbHost $dbPort) { Ok "MySQL javob beryapti (${dbHost}:${dbPort})" }
  else {
    Xato "MariaDB topilmadi va ${dbHost}:${dbPort} da hech kim javob bermayapti."
    Write-Host "  runtime\mysql yig'ish uchun:" -ForegroundColor Yellow
    Write-Host "     powershell -ExecutionPolicy Bypass -File tools\runtime-tayyorla.ps1" -ForegroundColor Yellow
    exit 1
  }
}

# ---- 4. Birinchi ishga tushirish: baza + config.php ---------------
# SQL buyruqlari vaqtinchalik faylga yoziladi va SOURCE bilan
# bajariladi. Sabab: parolni buyruq qatoriga qo'ysak, u jarayonlar
# ro'yxatida (Task Manager) ko'rinib qoladi.
# (yuqorida e'lon qilingan)
if ($birinchi) {
  Write-Host "  birinchi ishga tushirish - baza sozlanmoqda..."
  # Parol .NET ning kriptografik generatoridan (Get-Random EMAS - u
  # taxmin qilinadigan psevdo-tasodifiy).
  $bayt = New-Object byte[] 16
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bayt)
  $yangiPass = -join ($bayt | ForEach-Object { $_.ToString('x2') })

  # Admin panelga BIRINCHI kirish paroli. U ham shu yerda yasaladi va
  # config.php ga yoziladi (git'ga tushmaydi, har kompyuterda o'ziniki).
  # Alifboda chalkashadigan belgilar YO'Q (0/O, 1/l/I) - parol ekranda
  # o'qilib, qo'lda kiritiladi. Bu parol FAQAT auth jadvali bo'sh
  # ekan ishlaydi: admin o'z parolini qo'ygan zahoti api.php dagi
  # bootstrap shoxi butunlay o'lik bo'ladi (api.php:415).
  $alifbo = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz'
  $bayt2 = New-Object byte[] 16
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bayt2)
  $adminPass = -join (0..15 | ForEach-Object {
    $ch = $alifbo[$bayt2[$_] % $alifbo.Length]
    if ($_ -gt 0 -and $_ % 4 -eq 0) { "-$ch" } else { "$ch" }
  })

  $vaqtSql = Join-Path $env:TEMP ("tstm-sozla-" + [guid]::NewGuid().ToString('N').Substring(0,8) + ".sql")
  @"
CREATE DATABASE IF NOT EXISTS ``$dbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$dbUser'@'localhost' IDENTIFIED BY '$yangiPass';
CREATE USER IF NOT EXISTS '$dbUser'@'127.0.0.1' IDENTIFIED BY '$yangiPass';
GRANT ALL PRIVILEGES ON ``$dbName``.* TO '$dbUser'@'localhost';
GRANT ALL PRIVILEGES ON ``$dbName``.* TO '$dbUser'@'127.0.0.1';
DROP DATABASE IF EXISTS test;
FLUSH PRIVILEGES;
"@ | Set-Content $vaqtSql -Encoding ascii

  $src = $vaqtSql.Replace('\', '/')
  Mdb -h $dbHost -P $dbPort -u root -e "SOURCE $src;" | Out-Null
  if ($LASTEXITCODE -ne 0) { Xato "bazani sozlab bo'lmadi"; exit 1 }
  Remove-Item $vaqtSql -Force -ErrorAction SilentlyContinue; $vaqtSql = ''

  # backend\config.php - parol SHU YERDA, git'ga tushmaydi (.gitignore).
  $namuna = Join-Path $sayt 'backend\config.sample.php'
  $matn = @"
<?php
/* TSTM - mahalliy sozlamalar. Git'ga TUSHMAYDI.
   Bu faylni tools\ishga-tushur.ps1 birinchi ishga tushirishda
   AVTOMATIK yaratdi. Baza paroli tasodifiy generatsiya qilingan,
   ya'ni har kompyuterda o'ziniki. Izohlar: backend\config.sample.php */

return [
  'db_host' => '$dbHost',
  'db_port' => '$dbPort',
  'db_name' => '$dbName',
  'db_user' => '$dbUser',
  'db_pass' => '$yangiPass',

  'admin_user' => 'markaz_admini',
  'admin_bootstrap_password' => '$adminPass',
];
"@
  [System.IO.File]::WriteAllText($cfgYol, $matn, (New-Object System.Text.UTF8Encoding($false)))
  $dbPass = $yangiPass
  Ok "baza va backend\config.php yaratildi (parol tasodifiy)"
}

# ---- 5. Kontent importi -------------------------------------------
# Baza bo'sh bo'lsa - `data\baza.sql` dan yangiliklar, ekspertlar,
# rasm havolalari va sozlamalar tiklanadi. Aynan shu qadam yangi
# kompyuterda saytni "bo'm-bo'sh" emas, TO'LIQ qilib ochadi.
$sqlYol = Join-Path $sayt 'data\baza.sql'
$jadval = Mdb -h $dbHost -P $dbPort -u $dbUser "-p$dbPass" -N -B -e `
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$dbName';"
if ($LASTEXITCODE -eq 0 -and [int]$jadval -eq 0 -and (Test-Path $sqlYol)) {
  Write-Host "  baza bo'sh - kontent import qilinmoqda..."
  $src = (Resolve-Path $sqlYol).Path.Replace('\', '/')
  # $dbName POZITSIYALI argument sifatida beriladi - "USE tstm" ni
  # o'rniga o'tadi. Usiz mariadb "No database selected" deb HAR BIR
  # buyruqni rad etardi (dump ichida USE yo'q, chunki u ko'chma
  # bo'lishi kerak). --abort-source-on-error esa xatoda darhol
  # to'xtatadi va nolga teng bo'lmagan chiqish kodi qaytaradi:
  # usiz mariadb xatolarga qaramay 0 qaytarib, import "muvaffaqiyatli"
  # ko'rinardi.
  Mdb -h $dbHost -P $dbPort -u $dbUser "-p$dbPass" --default-character-set=utf8mb4 `
    --abort-source-on-error $dbName -e "SET NAMES utf8mb4; SOURCE $src;" | Out-Null
  $importOk = ($LASTEXITCODE -eq 0)
  $n = Mdb -h $dbHost -P $dbPort -u $dbUser "-p$dbPass" -N -B -e `
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$dbName';"
  # Faqat chiqish kodiga ishonmaymiz - jadval SONI haqiqiy dalil.
  if (-not $importOk -or [int]$n -eq 0) {
    Xato "kontent importi bajarilmadi (jadval: $n)"
    Write-Host "     data\baza.sql ni tekshiring yoki qo'lda import qiling" -ForegroundColor Yellow
    exit 1
  }
  Ok "kontent import qilindi ($n jadval)"
} elseif ([int]$jadval -gt 0) {
  Ok "baza joyida ($jadval jadval)"
}

# ---- 5b. Admin panelga birinchi kirish -----------------------------
# Sayt ochilishi bilan admin panel HAM ochilishi kerak. Yangi
# kompyuterda auth jadvali bo'sh bo'ladi - ya'ni hech kim parol
# qo'ymagan - va kirishning yagona yo'li config.php dagi bootstrap
# parol. U tasodifiy yasalgani uchun foydalanuvchi uni BILMAYDI,
# shuning uchun shu yerda bir marta ekranda ko'rsatamiz. Aks holda
# sayt ishlaydi-yu, admin panel qulflangan bo'lib qolardi.
$bootPass = ''
$cfgMatn = ''
if (Test-Path $cfgYol) {
  $cfgMatn = [System.IO.File]::ReadAllText($cfgYol, [System.Text.Encoding]::UTF8)
  $bootPass = CfgOqi $cfgMatn 'admin_bootstrap_password' ''
}
if ($bootPass -ne '') {
  # auth jadvali bu bosqichda hali YO'Q bo'lishi mumkin: uni db.php
  # birinchi API chaqiruvida yaratadi. U holda so'rov xato beradi -
  # buni ham "parol hali qo'yilmagan" deb qabul qilamiz.
  $hash = Mdb -h $dbHost -P $dbPort -u $dbUser "-p$dbPass" -N -B $dbName -e `
    "SELECT COALESCE(MAX(password_hash),'') FROM auth;"
  if ($LASTEXITCODE -ne 0 -or "$hash".Trim() -eq '') {
    $adminLogin = CfgOqi $cfgMatn 'admin_user' 'markaz_admini'
    Write-Host ""
    Write-Host "  ADMIN PANELGA BIRINCHI KIRISH" -ForegroundColor Yellow
    Write-Host "     login:  $adminLogin" -ForegroundColor Yellow
    Write-Host "     parol:  $bootPass" -ForegroundColor Yellow
    Write-Host "     Kirgach parolni DARHOL o'zgartiring - shundan keyin" -ForegroundColor DarkYellow
    Write-Host "     bu parol ishlamay qoladi (backend\config.php da qoladi, xolos)." -ForegroundColor DarkYellow
  }
}

# ---- 6. Sayt porti ------------------------------------------------
$boshPort = $Port
while (Port-Tinglanmoqda $Port) {
  Ogoh "$Port porti band (sayt allaqachon ishlayotgan bo'lishi mumkin)"
  $Port++
  if ($Port -gt $boshPort + 20) { Xato "bo'sh port topilmadi"; exit 1 }
}
$url = "http://localhost:$Port/"

# ---- 7. Sayt serveri ----------------------------------------------
$router = Join-Path $sayt 'router.php'
if (-not (Test-Path $router)) { Xato "router.php topilmadi"; exit 1 }
# Sessiya fayllari uchun papka (php.ini da data\sessions ko'rsatilgan).
$sessDir = Join-Path $sayt 'data\sessions'
if (-not (Test-Path $sessDir)) { New-Item -ItemType Directory -Force $sessDir | Out-Null }

Write-Host ""
Write-Host "  Sayt:   $url" -ForegroundColor Cyan
Write-Host "  Admin:  ${url}admin.html" -ForegroundColor Cyan
Write-Host "  Papka:  $sayt"
Write-Host ""
Write-Host "  To'xtatish uchun: Ctrl+C" -ForegroundColor DarkGray
Write-Host ("=" * 60)
Write-Host ""

$phpArgs = @()
if ($phpIni -ne '') { $phpArgs += @('-c', $phpIni, '-d', "extension_dir=$phpExt") }
$phpArgs += @('-S', "localhost:$Port", '-t', $sayt, $router)

$phpProc = Start-Process -FilePath $Php -ArgumentList $phpArgs -WorkingDirectory $sayt -NoNewWindow -PassThru

for ($i = 0; $i -lt 40; $i++) {
  if (Port-Tinglanmoqda $Port) { break }
  Start-Sleep -Milliseconds 250
}
if (-not $NoBrauzer) { Start-Process $url }
Wait-Process -Id $phpProc.Id

} finally {
  # Ctrl+C, xato yoki oyna yopilganda hech qanday jarayon orqada
  # qolmasligi kerak - aks holda keyingi ishga tushirishda port band
  # bo'lib, tushunarsiz xatolar chiqadi.
  if ($vaqtSql -ne '' -and (Test-Path $vaqtSql)) { Remove-Item $vaqtSql -Force -ErrorAction SilentlyContinue }
  if ($phpProc -and -not $phpProc.HasExited) {
    Stop-Process -Id $phpProc.Id -Force -ErrorAction SilentlyContinue
  }
  if ($dbProc -and -not $dbProc.HasExited) {
    # Avval muloyim: SHUTDOWN buyrug'i InnoDB ni to'g'ri yopadi va
    # keyingi ishga tushirishda "crash recovery" bo'lmaydi.
    try {
      Mdb -h $dbHost -P $dbPort -u root -e 'SHUTDOWN;' | Out-Null
      $dbProc.WaitForExit(10000) | Out-Null
    } catch { }
    if (-not $dbProc.HasExited) { Stop-Process -Id $dbProc.Id -Force -ErrorAction SilentlyContinue }
  }
  if ($phpProc -or $dbProc) {
    Write-Host ""
    Write-Host "Serverlar to'xtatildi." -ForegroundColor DarkGray
  }
}
