# TSTM — zaxiradan tiklash skripti
# ------------------------------------------------------------------
# backup.ps1 yaratgan zaxirani tiklaydi (baza + uploads).
# Ishlatish:
#   powershell -ExecutionPolicy Bypass -File tools\restore.ps1 -From "backups\tstm-YYYYMMDD-HHmmss"
#   powershell -ExecutionPolicy Bypass -File tools\restore.ps1            # eng oxirgi zaxirani tiklaydi
#
# DIQQAT: bu joriy bazaning ustiga yozadi. Avval tasdiqlash so'raladi.
# -Force bilan tasdiqlashsiz ishlaydi. -Db bilan boshqa bazaga tiklash mumkin
# (masalan sinov uchun: -Db tstm_restore_test).
# ------------------------------------------------------------------
param(
  [string]$From = '',
  [string]$Db = '',
  [switch]$Force
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)   # tools dan ildizga
# Loyihaning O'Z MariaDB klienti (runtime\mysql). 2026-08-21 gacha bu yerda
# 'C:\xampp\mysql\bin\mysql.exe' turardi.
$mysql = Join-Path $root 'runtime\mysql\bin\mariadb.exe'
if (-not (Test-Path $mysql)) { $mysql = 'mariadb.exe' }   # PATH dan

# PS 5.1 tuzog'i: native buyruqning stderr'ini PowerShell ichida
# yo'naltirsak, har bir qator NativeCommandError ga o'raladi va yuqoridagi
# $ErrorActionPreference = 'Stop' tufayli skript uzilib qoladi. mariadb.exe
# esa oddiy ogohlantirishni ham stderr ga yozadi. Shu chaqiruv davomida
# 'Continue' ga o'tamiz - xato $LASTEXITCODE orqali baribir ushlanadi.
function Mdb {
  $eski = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { & $mysql @args 2>$null } finally { $ErrorActionPreference = $eski }
}
$dbHost = '127.0.0.1'; $dbPort = '3307'; $dbName = 'tstm'; $dbUser = 'tstm'; $dbPass = ''

$cfg = Join-Path $root 'config.php'
if (Test-Path $cfg) {
  $txt = Get-Content $cfg -Raw
  if ($txt -match "'db_name'\s*=>\s*'([^']*)'") { $dbName = $Matches[1] }
  if ($txt -match "'db_user'\s*=>\s*'([^']*)'") { $dbUser = $Matches[1] }
  if ($txt -match "'db_pass'\s*=>\s*'([^']*)'") { $dbPass = $Matches[1] }
  if ($txt -match "'db_host'\s*=>\s*'([^']*)'") { $dbHost = $Matches[1] }
  if ($txt -match "'db_port'\s*=>\s*'([^']*)'") { $dbPort = $Matches[1] }
}
if ($Db -ne '') { $dbName = $Db }  # boshqa bazaga tiklash (sinov)

# --- Zaxira papkasini aniqlash ---
if ($From -eq '') {
  $latest = Get-ChildItem (Join-Path $root 'backups') -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
  if (-not $latest) { throw "backups\ ichida zaxira topilmadi. -From bilan yo'l bering." }
  $From = $latest.FullName
}
if (-not (Test-Path $From)) { throw "Zaxira papkasi topilmadi: $From" }
$sqlFile = Join-Path $From 'database.sql'
if (-not (Test-Path $sqlFile)) { throw "database.sql topilmadi: $From" }

Write-Host "Tiklanadigan zaxira: $From"
Write-Host "Maqsad baza:        $dbName @ $dbHost`:$dbPort"
if (-not $Force) {
  $ans = Read-Host "Bu '$dbName' bazasi ustiga yozadi. Davom etilsinmi? (ha/yoq)"
  if ($ans -ne 'ha') { Write-Host "Bekor qilindi."; exit }
}

# --- 1. Baza tiklash ---
# Kim bilan ulanamiz. Odatdagi tiklash (o'sha bazaga) config.php dagi
# cheklangan foydalanuvchi bilan bo'ladi. -Db bilan BOSHQA bazaga
# tiklaganda esa u yaramaydi: `tstm` foydalanuvchisiga faqat `tstm`
# bazasiga huquq berilgan (bu ATAYLAB shunday), ya'ni yangi baza yaratib
# ham bo'lmaydi. Bunday holda mahalliy `root` bilan ulanamiz - baza
# yaratish ma'muriy amal va MariaDB faqat 127.0.0.1 ni tinglaydi.
$cfgDb = $dbName
if (Test-Path $cfg) { if ((Get-Content $cfg -Raw) -match "'db_name'\s*=>\s*'([^']*)'") { $cfgDb = $Matches[1] } }
if ($dbName -ne $cfgDb) {
  $mysqlArgs = @('-h', $dbHost, '-P', $dbPort, '-u', 'root')
  Write-Host "  (boshqa bazaga tiklash - mahalliy 'root' bilan ulanadi)" -ForegroundColor DarkGray
} else {
  $mysqlArgs = @('-h', $dbHost, '-P', $dbPort, '-u', $dbUser)
  if ($dbPass -ne '') { $mysqlArgs += "-p$dbPass" }
}

Mdb @mysqlArgs -e "CREATE DATABASE IF NOT EXISTS ``$dbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "'$dbName' bazasini yaratib bo'lmadi (huquq yetarli emasmi?)" }

# Dump `--databases` bilan olingan, ya'ni ichida `CREATE DATABASE tstm` va
# `USE tstm` bor. Ularni olib tashlaymiz va maqsad bazani o'zimiz aniq
# ko'rsatamiz - aks holda -Db bilan sinov tiklashi ASL bazaga tushib ketardi.
$sqlText = Get-Content $sqlFile -Raw
$sqlText = ($sqlText -split "`n" | Where-Object { $_ -notmatch '^\s*(CREATE DATABASE|USE `)' }) -join "`n"
$tmp = Join-Path $env:TEMP "tstm-restore-$PID.sql"
# BOM SIZ yozamiz: Set-Content -Encoding utf8 PS 5.1 da BOM qo'shadi va u
# faylning birinchi buyrug'iga yopishib, importni yiqitishi mumkin.
[System.IO.File]::WriteAllText($tmp, $sqlText, (New-Object System.Text.UTF8Encoding($false)))

# SOURCE bilan yuboramiz (`Get-Content | exe` EMAS): quvur PowerShell orqali
# o'tganda 1.5 MB matn qayta kodlanadi va o'zbekcha/kirillcha belgilar
# buzilishi mumkin. --abort-source-on-error birinchi xatoda to'xtatadi va
# nolga teng bo'lmagan chiqish kodi qaytaradi.
$src = $tmp.Replace('\', '/')
Mdb @mysqlArgs --default-character-set=utf8mb4 --abort-source-on-error $dbName `
  -e "SET NAMES utf8mb4; SOURCE $src;" | Out-Null
$importOk = ($LASTEXITCODE -eq 0)
Remove-Item $tmp -Force -ErrorAction SilentlyContinue

# Chiqish kodining o'zi yetarli emas - jadval SONI haqiqiy dalil.
# Ilgari bu tekshiruv YO'Q edi: tiklash butunlay yiqilsa ham skript
# "TAYYOR" deb yozardi, ya'ni ofat paytida soxta xotirjamlik berardi.
$jadval = Mdb @mysqlArgs -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$dbName';"
if (-not $importOk -or [int]$jadval -eq 0) {
  throw "Tiklash BAJARILMADI ('$dbName' da $jadval jadval). Asl baza o'zgarmagan bo'lishi mumkin - zaxira faylini tekshiring."
}
Write-Host "  [1/2] Baza tiklandi -> $dbName ($jadval jadval)"

# --- 2. uploads tiklash ---
# IKKALA joyga ham tiklaymiz: loyiha papkasi VA XAMPP deploy (jonli sayt shundan
# o'qiydi). Faqat bittasiga tiklansa sayt hamon singan rasmlarni ko'rsatadi.
$zipFile = Join-Path $From 'uploads.zip'
if ((Test-Path $zipFile) -and $Db -eq '') {
  # Yuklamalar uchun YAGONA joy - loyiha papkasi. Ilgari ikkinchi manzil
  # 'C:\xampp\htdocs\tstm-sayt\uploads' ham bor edi (Apache o'sha yerdan
  # uzatardi); 2026-08-21 dan sayt loyiha papkasidan ishlaydi.
  $targets = @( (Join-Path $root 'uploads') ) | Select-Object -Unique
  foreach ($t in $targets) {
    try {
      New-Item -ItemType Directory -Force $t -ErrorAction Stop | Out-Null
      Expand-Archive -Path $zipFile -DestinationPath $t -Force -ErrorAction Stop
      Write-Host "  [2/2] uploads/ tiklandi -> $t"
    } catch {
      Write-Host "  [2/2] OGOHLANTIRISH: tiklanmadi -> $t  ($($_.Exception.Message))" -ForegroundColor Yellow
    }
  }
} elseif ($Db -ne '') {
  Write-Host "  [2/2] uploads o'tkazib yuborildi (sinov bazasiga tiklash)"
} else {
  Write-Host "  [2/2] uploads.zip yo'q"
}

Write-Host ""
Write-Host "TAYYOR. Baza '$dbName' tiklandi ($jadval jadval)."
