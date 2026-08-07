# TSTM — zaxiradan tiklash skripti
# ------------------------------------------------------------------
# backup.ps1 yaratgan zaxirani tiklaydi (baza + uploads).
# Ishlatish:
#   powershell -ExecutionPolicy Bypass -File restore.ps1 -From "backups\tstm-YYYYMMDD-HHmmss"
#   powershell -ExecutionPolicy Bypass -File restore.ps1            # eng oxirgi zaxirani tiklaydi
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
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mysql = 'C:\xampp\mysql\bin\mysql.exe'
$dbHost = '127.0.0.1'; $dbPort = '3306'; $dbName = 'tstm'; $dbUser = 'root'; $dbPass = ''

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
$mysqlArgs = @('-h', $dbHost, '-P', $dbPort, '-u', $dbUser)
if ($dbPass -ne '') { $mysqlArgs += "-p$dbPass" }

# Dump `--databases` bilan olingan, ya'ni ichida `CREATE DATABASE tstm` va
# `USE tstm` bor. Standart tiklashda (o'sha nomga) buni to'g'ridan-to'g'ri
# yuboramiz. Boshqa nomga (-Db, sinov) tiklaganda esa bu qatorlar dumpni asl
# bazaga yo'naltirib yuboradi — shuning uchun ularni olib tashlab, maqsad
# bazani o'zimiz yaratamiz va aniq ko'rsatamiz.
& $mysql @mysqlArgs -e "CREATE DATABASE IF NOT EXISTS ``$dbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
$sqlText = Get-Content $sqlFile -Raw
# `CREATE DATABASE ...` va `USE \`...\`;` qatorlarini olib tashlaymiz (maqsad bazaga aniq yo'naltirish uchun)
$sqlText = ($sqlText -split "`n" | Where-Object { $_ -notmatch '^\s*(CREATE DATABASE|USE `)' }) -join "`n"
$tmp = Join-Path $env:TEMP "tstm-restore-$PID.sql"
Set-Content -Path $tmp -Value $sqlText -Encoding utf8 -NoNewline
Get-Content $tmp | & $mysql @mysqlArgs $dbName
Remove-Item $tmp -Force -ErrorAction SilentlyContinue
Write-Host "  [1/2] Baza tiklandi -> $dbName"

# --- 2. uploads tiklash ---
# IKKALA joyga ham tiklaymiz: loyiha papkasi VA XAMPP deploy (jonli sayt shundan
# o'qiydi). Faqat bittasiga tiklansa sayt hamon singan rasmlarni ko'rsatadi.
$zipFile = Join-Path $From 'uploads.zip'
if ((Test-Path $zipFile) -and $Db -eq '') {
  $targets = @( (Join-Path $root 'uploads'), 'C:\xampp\htdocs\tstm-sayt\uploads' ) | Select-Object -Unique
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
Write-Host "TAYYOR. Baza '$dbName' tiklandi."
