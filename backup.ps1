# TSTM — zaxira nusxa olish skripti
# ------------------------------------------------------------------
# Bazani (mysqldump) + yuklangan fayllarni (uploads/) bitta papkaga arxivlaydi.
# Ishlatish:   powershell -ExecutionPolicy Bypass -File backup.ps1
# Natija:      backups\tstm-YYYYMMDD-HHmmss\  (sql + uploads.zip + meta.txt)
#
# Tiklash uchun: restore.ps1 ni ishga tushiring.
# ------------------------------------------------------------------
$ErrorActionPreference = 'Stop'

# --- Sozlamalar (config.php dan o'qiladi, bo'lmasa XAMPP standarti) ---
$root   = Split-Path -Parent $MyInvocation.MyCommand.Path
$mysqldump = 'C:\xampp\mysql\bin\mysqldump.exe'
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

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dir = Join-Path $root "backups\tstm-$stamp"
New-Item -ItemType Directory -Force $dir | Out-Null
Write-Host "Zaxira papkasi: $dir"

# --- 1. Baza dump ---
$sqlFile = Join-Path $dir 'database.sql'
$dumpArgs = @('-h', $dbHost, '-P', $dbPort, '-u', $dbUser)
if ($dbPass -ne '') { $dumpArgs += "-p$dbPass" }
$dumpArgs += @('--databases', $dbName, '--routines', '--events', '--single-transaction', '--default-character-set=utf8mb4', "--result-file=$sqlFile")
& $mysqldump @dumpArgs
if (-not (Test-Path $sqlFile) -or (Get-Item $sqlFile).Length -lt 100) { throw "Baza dump muvaffaqiyatsiz!" }
$sqlKB = [math]::Round((Get-Item $sqlFile).Length/1KB, 1)
Write-Host "  [1/3] Baza dump: $sqlKB KB"

# --- 2. uploads/ arxivi ---
$uploads = Join-Path $root 'uploads'
$zipFile = Join-Path $dir 'uploads.zip'
if (Test-Path $uploads) {
  Compress-Archive -Path "$uploads\*" -DestinationPath $zipFile -Force -ErrorAction SilentlyContinue
  $zipKB = if (Test-Path $zipFile) { [math]::Round((Get-Item $zipFile).Length/1KB, 1) } else { 0 }
  Write-Host "  [2/3] uploads.zip: $zipKB KB"
} else {
  Write-Host "  [2/3] uploads/ yo'q - o'tkazib yuborildi"
}

# --- 3. Meta ma'lumot ---
$meta = @"
TSTM zaxira nusxasi
Sana:     $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Baza:     $dbName @ $dbHost`:$dbPort
SQL:      database.sql ($sqlKB KB)
Uploads:  uploads.zip
Tiklash:  powershell -ExecutionPolicy Bypass -File restore.ps1 -From "$dir"
"@
Set-Content -Path (Join-Path $dir 'meta.txt') -Value $meta -Encoding utf8
Write-Host "  [3/3] meta.txt yozildi"

# --- Eski zaxiralarni tozalash (oxirgi 14 tasi qoladi) ---
$all = Get-ChildItem (Join-Path $root 'backups') -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
if ($all.Count -gt 14) {
  $all | Select-Object -Skip 14 | ForEach-Object { Remove-Item $_.FullName -Recurse -Force; Write-Host "  Eski zaxira o'chirildi: $($_.Name)" }
}

Write-Host ""
Write-Host "TAYYOR. Zaxira: $dir"
