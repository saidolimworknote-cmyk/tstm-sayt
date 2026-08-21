# TSTM — zaxira nusxa olish skripti
# ------------------------------------------------------------------
# Bazani (mysqldump) + yuklangan fayllarni (uploads/) bitta papkaga arxivlaydi.
# Ishlatish:   powershell -ExecutionPolicy Bypass -File tools\backup.ps1
#              powershell -ExecutionPolicy Bypass -File tools\backup.ps1 -Quiet   # jadval uchun
# Natija:      backups\tstm-YYYYMMDD-HHmmss\  (sql + uploads.zip + meta.txt)
#              + ikkinchi nusxa boshqa diskda ($MirrorTo)
#
# Tiklash uchun: restore.ps1 ni ishga tushiring.
#
# Yuklamalar uchun YAGONA joy bor: loyiha papkasidagi uploads\. 2026-08-21
# gacha sayt Apache orqali C:\xampp\htdocs\ dan uzatilar va admin yuklagan
# fayl faqat o'sha yerda paydo bo'lardi - shuning uchun skript ikkita manbani
# birlashtirardi. Endi bunday ikkilanish yo'q.
# ------------------------------------------------------------------
param(
  [switch]$Quiet,
  [string]$MirrorTo = 'D:\linuxserver2026\tstm-backups'
)
$ErrorActionPreference = 'Stop'
function Say($m, $c = 'Gray') { if (-not $Quiet) { Write-Host $m -ForegroundColor $c } }

# --- Sozlamalar (config.php dan o'qiladi) ---
$root   = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)   # tools dan ildizga
# Loyihaning O'Z MariaDB'si (runtime\mysql). 2026-08-21 gacha bu yerda
# 'C:\xampp\mysql\bin\mysqldump.exe' turardi - XAMPP olib tashlanganda
# zaxira olish jimgina ishlamay qolardi.
$mysqldump = Join-Path $root 'runtime\mysql\bin\mariadb-dump.exe'
if (-not (Test-Path $mysqldump)) { $mysqldump = 'mariadb-dump.exe' }   # PATH dan
$dbHost = '127.0.0.1'; $dbPort = '3307'; $dbName = 'tstm'; $dbUser = 'tstm'; $dbPass = ''

$cfg = Join-Path $root 'backend\config.php'
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
Say "Zaxira papkasi: $dir"

# --- 1. Baza dump ---
$sqlFile = Join-Path $dir 'database.sql'
$dumpArgs = @('-h', $dbHost, '-P', $dbPort, '-u', $dbUser)
if ($dbPass -ne '') { $dumpArgs += "-p$dbPass" }
$dumpArgs += @('--databases', $dbName, '--routines', '--events', '--single-transaction', '--default-character-set=utf8mb4', "--result-file=$sqlFile")
& $mysqldump @dumpArgs
if (-not (Test-Path $sqlFile) -or (Get-Item $sqlFile).Length -lt 100) { throw "Baza dump muvaffaqiyatsiz!" }
$sqlKB = [math]::Round((Get-Item $sqlFile).Length/1KB, 1)
Say "  [1/4] Baza dump: $sqlKB KB" 'Green'

# --- 2. uploads/ arxivi ---
# Ro'yxat ko'rinishida qoldirilgan: kelajakda yana bir manba qo'shilsa
# (masalan hostingdan tushirilgan nusxa) shu yerga qo'shiladi.
$sources = @(
  (Join-Path $root 'uploads')
) | Where-Object { Test-Path $_ } | Select-Object -Unique

$zipFile = Join-Path $dir 'uploads.zip'
$fileCount = 0
if ($sources.Count) {
  $staging = Join-Path $env:TEMP "tstm-bk-$PID"
  Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force $staging | Out-Null

  foreach ($s in $sources) {
    foreach ($f in Get-ChildItem $s -File -Force -ErrorAction SilentlyContinue) {
      Copy-Item $f.FullName (Join-Path $staging $f.Name) -Force
    }
  }
  $fileCount = (Get-ChildItem $staging -File -Force).Count

  Compress-Archive -Path "$staging\*" -DestinationPath $zipFile -Force
  Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue
  $zipKB = if (Test-Path $zipFile) { [math]::Round((Get-Item $zipFile).Length/1KB, 1) } else { 0 }
  Say "  [2/4] uploads.zip: $fileCount fayl, $zipKB KB" 'Green'
} else {
  Say "  [2/4] uploads/ topilmadi - o'tkazib yuborildi" 'Yellow'
}

# --- 3. Meta ma'lumot ---
$meta = @"
TSTM zaxira nusxasi
Sana:     $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Baza:     $dbName @ $dbHost`:$dbPort
SQL:      database.sql ($sqlKB KB)
Uploads:  uploads.zip ($fileCount fayl)
Manbalar: $($sources -join ' + ')
Tiklash:  powershell -ExecutionPolicy Bypass -File tools\restore.ps1 -From "$dir"
"@
Set-Content -Path (Join-Path $dir 'meta.txt') -Value $meta -Encoding utf8
Say "  [3/4] meta.txt yozildi" 'Green'

# --- 4. Boshqa diskka ikkinchi nusxa ---
# C: ni yo'qotsak yoki xato buyruq C: dagi hamma narsani o'chirsa — bu nusxa qoladi.
$mirrorOk = $false
if ($MirrorTo -ne '') {
  try {
    New-Item -ItemType Directory -Force $MirrorTo -ErrorAction Stop | Out-Null
    $dst = Join-Path $MirrorTo "tstm-$stamp"
    Copy-Item $dir $dst -Recurse -Force -ErrorAction Stop
    $mirrorOk = $true
    Say "  [4/4] Ikkinchi nusxa: $dst" 'Green'
    # Tozalash pastda, Invoke-Prune orqali — ikkala joyda bir xil siyosat bilan
  } catch {
    Say "  [4/4] OGOHLANTIRISH: ikkinchi nusxa olinmadi ($MirrorTo) - $($_.Exception.Message)" 'Yellow'
  }
} else {
  Say "  [4/4] Ikkinchi nusxa o'chirilgan (-MirrorTo '')" 'Yellow'
}

# --- Eski zaxiralarni tozalash ---
# Skript kuniga bir necha marta ishlagani uchun "oxirgi 14 ta" degan qoida
# atigi 2 kunlik tarix qoldirardi. Buning o'rniga bosqichli (pog'onali) saqlash:
#   * oxirgi 3 kunniki  — HAMMASI (soatlik aniqlik: "bugun buzilgan"ni qaytarish)
#   * 3-90 kun oralig'i — har kunning ENG OXIRGISI (kunlik aniqlik)
#   * 90 kundan eski    — o'chiriladi
# 6 MB x ~100 nusxa = ~600 MB. Diskda joy bor, ma'lumot esa qaytmaydi.
function Invoke-Prune($base) {
  $items = Get-ChildItem $base -Directory -ErrorAction SilentlyContinue |
           Where-Object { $_.Name -match '^tstm-(\d{8})-(\d{6})$' }
  if (-not $items) { return }
  $now = Get-Date
  $keep = @{}
  $byDay = @{}
  foreach ($i in $items) {
    if ($i.Name -notmatch '^tstm-(\d{8})-(\d{6})$') { continue }
    $day = $Matches[1]
    $when = [datetime]::ParseExact("$($Matches[1])$($Matches[2])", 'yyyyMMddHHmmss', $null)
    $age = ($now - $when).TotalDays
    if ($age -le 3) { $keep[$i.Name] = $true; continue }      # yaqin tarix — hammasi
    if ($age -gt 90) { continue }                              # juda eski — o'chadi
    if (-not $byDay.ContainsKey($day) -or $i.Name -gt $byDay[$day]) { $byDay[$day] = $i.Name }
  }
  foreach ($n in $byDay.Values) { $keep[$n] = $true }          # har kunning oxirgisi
  foreach ($i in $items) {
    if (-not $keep.ContainsKey($i.Name)) {
      Remove-Item $i.FullName -Recurse -Force -ErrorAction SilentlyContinue
      Say "  Eski zaxira o'chirildi: $($i.Name)"
    }
  }
}
Invoke-Prune (Join-Path $root 'backups')
if ($mirrorOk) { Invoke-Prune $MirrorTo }

# --- Jurnal (jadval bo'yicha ishlaganda natijani ko'rish uchun) ---
$logLine = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  OK  sql=${sqlKB}KB  fayl=$fileCount  nusxa=$(if($mirrorOk){'ha'}else{'yoq'})"
Add-Content -Path (Join-Path $root 'backups\backup.log') -Value $logLine -Encoding utf8

Say ""
Say "TAYYOR. Zaxira: $dir" 'Cyan'
