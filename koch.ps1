# TSTM - BUTUN SAYTNI BITTA FAYLGA YIG'ISH (boshqa kompyuterga ko'chirish)
# ==================================================================
# Natija: Ish stolida BITTA zip fayl - TSTM-SAYT-<sana>.zip
# Uning ichida:
#   sayt\        - loyihaning butun nusxasi (kod, rasm, uploads, git tarixi)
#   baza.sql     - MySQL bazasining to'liq dumpi (kontent + admin paroli)
#   ORNAT.ps1    - yangi kompyuterda hammasini o'rnatuvchi skript
#   ORNAT.bat    - shu skriptni ikki marta bosib ishga tushirish uchun
#   OQING.txt    - qadamma-qadam yo'riqnoma
#
# Ishlatish:
#   powershell -ExecutionPolicy Bypass -File koch.ps1
#   powershell -ExecutionPolicy Bypass -File koch.ps1 -Out "D:\"
#   powershell -ExecutionPolicy Bypass -File koch.ps1 -NoGit         # git tarixisiz (yengilroq)
#   powershell -ExecutionPolicy Bypass -File koch.ps1 -WithBackups   # eski zaxiralar ham (~113 MB)
#
# NEGA SKRIPT, QO'LDA EMAS:
#   1) `.htaccess` va `uploads\.htaccess` nuqta bilan boshlanadi - Explorer va
#      FTP ularni yashiradi. Ko'chmasa saytning butun himoya qatlami yo'qoladi.
#   2) uploads IKKI joyda: loyihada va C:\xampp\htdocs\... da. Admin orqali
#      yuklangan fayllar FAQAT htdocs da bo'ladi. Ikkalasi birlashtiriladi.
#   3) Baza fayl emas - u MySQL ichida. Dumpsiz ko'chirilgan sayt BO'SH bo'ladi.
#   4) Compress-Archive zip ichida teskari slash yozadi - bu Linux/unzip da
#      papkalarni buzadi. Zip qo'lda, to'g'ri slash bilan yig'iladi.
# ==================================================================
param(
  [string]$Out = "$env:USERPROFILE\Desktop",
  [switch]$NoGit,
  [switch]$WithBackups
)

$ErrorActionPreference = 'Stop'
$src   = $PSScriptRoot
$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$stage = Join-Path $env:TEMP "tstm-koch-$PID"
$zip   = Join-Path $Out "TSTM-SAYT-$stamp.zip"
$errs  = @()

function Ok($m)   { Write-Host "  [OK]   $m" -ForegroundColor Green }
function Ogoh($m) { Write-Host "  [OGOH] $m" -ForegroundColor Yellow }
function Xato($m) { Write-Host "  [XATO] $m" -ForegroundColor Red; $script:errs += $m }

Write-Host ""
Write-Host "TSTM - ko'chirish paketi" -ForegroundColor Cyan
Write-Host ("=" * 60)
Write-Host "Manba:  $src"
Write-Host "Natija: $zip"

if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Force $stage | Out-Null
$saytDir = Join-Path $stage 'sayt'
New-Item -ItemType Directory -Force $saytDir | Out-Null

# ---- 1. Baza dumpi -------------------------------------------------
Write-Host ""
Write-Host "[1/5] Baza dumpi" -ForegroundColor Cyan
$mysqldump = 'C:\xampp\mysql\bin\mysqldump.exe'
$dbHost = '127.0.0.1'; $dbPort = '3306'; $dbName = 'tstm'; $dbUser = 'root'; $dbPass = ''
$cfg = Join-Path $src 'config.php'
if (Test-Path $cfg) {
  $t = [System.IO.File]::ReadAllText($cfg, [System.Text.Encoding]::UTF8)
  if ($t -match "'db_name'\s*=>\s*'([^']*)'") { $dbName = $Matches[1] }
  if ($t -match "'db_user'\s*=>\s*'([^']*)'") { $dbUser = $Matches[1] }
  if ($t -match "'db_pass'\s*=>\s*'([^']*)'") { $dbPass = $Matches[1] }
  if ($t -match "'db_host'\s*=>\s*'([^']*)'") { $dbHost = $Matches[1] }
  if ($t -match "'db_port'\s*=>\s*'([^']*)'") { $dbPort = $Matches[1] }
} else {
  Ogoh "config.php topilmadi - XAMPP standart sozlamalari ishlatilyapti"
}
if (-not (Test-Path $mysqldump)) { Xato "mysqldump.exe topilmadi: $mysqldump"; }

$sqlFile = Join-Path $stage 'baza.sql'
$a = @('-h', $dbHost, '-P', $dbPort, '-u', $dbUser)
if ($dbPass -ne '') { $a += "-p$dbPass" }
# --databases: dumpga CREATE DATABASE va USE qo'shadi, shunda yangi kompyuterda
# bazani oldindan qo'lda yaratish shart emas.
$a += @('--databases', $dbName, '--routines', '--events', '--single-transaction',
        '--default-character-set=utf8mb4', "--result-file=$sqlFile")
& $mysqldump @a
if ((Test-Path $sqlFile) -and (Get-Item $sqlFile).Length -gt 1000) {
  $tables = @(Select-String -Path $sqlFile -Pattern '^CREATE TABLE').Count
  Ok ("baza.sql: {0:N1} MB, {1} jadval" -f ((Get-Item $sqlFile).Length/1MB), $tables)
} else {
  Xato "baza dumpi olinmadi (MySQL ishlayaptimi?)"
}

# ---- 2. Sayt fayllari ----------------------------------------------
Write-Host ""
Write-Host "[2/5] Sayt fayllari" -ForegroundColor Cyan
$skipDirs = @('.idea', 'node_modules')
if (-not $WithBackups) { $skipDirs += 'backups' }
if ($NoGit)            { $skipDirs += '.git' }

$copied = 0; $bytes = 0
Get-ChildItem $src -Recurse -Force -File | ForEach-Object {
  $rel = $_.FullName.Substring($src.Length).TrimStart('\')
  $top = ($rel -split '\\')[0]
  if ($skipDirs -contains $top) { return }
  if ($_.Extension -eq '.zip')  { return }   # eski paketlar qayta o'ralmasin
  if ($_.Name -like '_*')       { return }   # vaqtinchalik sinov stendlari
  $dest = Join-Path $saytDir $rel
  $dd = Split-Path $dest -Parent
  if (-not (Test-Path $dd)) { New-Item -ItemType Directory -Force $dd | Out-Null }
  Copy-Item $_.FullName $dest -Force
  $script:copied++; $script:bytes += $_.Length
}
Ok ("{0} fayl, {1:N1} MB" -f $copied, ($bytes/1MB))

# ---- 3. htdocs dagi uploads ni birlashtirish ------------------------
# Admin panel orqali yuklangan rasm va PDF lar FAQAT htdocs da paydo bo'ladi
# va loyihaga qaytmaydi. 2026-08-07 da aynan shu sabab 80 ta fayl yo'qolgan.
Write-Host ""
Write-Host "[3/5] Yuklangan fayllar (uploads)" -ForegroundColor Cyan
$liveUploads = 'C:\xampp\htdocs\tstm-sayt\uploads'
$dstUploads  = Join-Path $saytDir 'uploads'
if (-not (Test-Path $dstUploads)) { New-Item -ItemType Directory -Force $dstUploads | Out-Null }
$added = 0
if (Test-Path $liveUploads) {
  foreach ($f in Get-ChildItem $liveUploads -File -Force) {
    $d = Join-Path $dstUploads $f.Name
    if (-not (Test-Path $d)) { $added++ }
    Copy-Item $f.FullName $d -Force
  }
  Ok "htdocs dan birlashtirildi (shundan $added tasi loyihada yo'q edi)"
} else {
  Ogoh "htdocs nusxasi topilmadi: $liveUploads"
}
$uplCount = @(Get-ChildItem $dstUploads -File -Force).Count
Ok "jami uploads: $uplCount fayl"

# ---- 4. O'rnatuvchi va yo'riqnoma ----------------------------------
Write-Host ""
Write-Host "[4/5] O'rnatuvchi qo'shilmoqda" -ForegroundColor Cyan
foreach ($f in @('ORNAT.ps1', 'ORNAT.bat')) {
  $p = Join-Path $src $f
  if (Test-Path $p) { Copy-Item $p (Join-Path $stage $f) -Force; Ok $f }
  else { Xato "$f loyihada topilmadi" }
}

$oqing = @"
TSTM SAYTI - YANGI KOMPYUTERGA O'RNATISH
========================================
Paket sanasi: $(Get-Date -Format 'yyyy-MM-dd HH:mm')
Ichida: sayt fayllari ($copied ta), MySQL bazasi ($dbName), $uplCount ta yuklama.


QADAM 1. XAMPP o'rnating (agar yo'q bo'lsa)
------------------------------------------
https://www.apachefriends.org  ->  XAMPP for Windows (PHP 8.2)
Standart yo'l C:\xampp bo'lsin.


QADAM 2. XAMPP Control Panel da ikkita xizmatni yoqing
------------------------------------------------------
  Apache  ->  Start
  MySQL   ->  Start
Ikkalasi ham YASHIL bo'lishi kerak.


QADAM 3. Shu zip ni ochib, ORNAT.bat ni IKKI MARTA bosing
---------------------------------------------------------
Skript o'zi hammasini qiladi:
  - bazani import qiladi
  - fayllarni Ish stoliga (tstm-sayt) va C:\xampp\htdocs\tstm-sayt ga ko'chiradi
  - sozlamalarni tekshiradi

Agar PowerShell ochilmasa, papkada o'ng tugma -> "Open in Terminal" -> :
  powershell -ExecutionPolicy Bypass -File ORNAT.ps1


QADAM 4. Saytni oching
----------------------
  Sayt:   http://localhost/tstm-sayt/
  Admin:  http://localhost/tstm-sayt/admin.html

Admin login va PAROL eski kompyuterdagi bilan BIR XIL - parol xeshi
baza ichida ko'chib keldi, uni qaytadan o'rnatish shart emas.


MUAMMO BO'LSA
-------------
"XAMPP topilmadi"          ->  ORNAT.ps1 -Xampp "D:\xampp"
"MySQL ga ulanib bo'lmadi" ->  XAMPP da MySQL ni Start qiling;
                               root paroli bo'lsa: ORNAT.ps1 -DbPass "parol"
"baza allaqachon bor"      ->  ORNAT.ps1 -Force   (eski baza o'chadi)
"papka bo'sh emas"         ->  ORNAT.ps1 -Force   yoki -Sayt "D:\ish\tstm-sayt"
Faqat fayllarni ko'chirish ->  ORNAT.ps1 -SkipDb


PAKET ICHIDA NIMA BOR
---------------------
  sayt\        loyihaning to'liq nusxasi (kod, rasm, uploads$(if(-not $NoGit){", git tarixi"}))
  baza.sql     MySQL dumpi: barcha kontent, foydalanuvchilar, obunachilar
  ORNAT.ps1    o'rnatuvchi skript
  ORNAT.bat    ikki marta bosish uchun
  OQING.txt    shu fayl
$(if(-not $WithBackups){"
ESLATMA: eski zaxira nusxalar (backups\, ~113 MB) paketga QO'SHILMADI.
Kerak bo'lsa:  koch.ps1 -WithBackups
"})
"@
[System.IO.File]::WriteAllText((Join-Path $stage 'OQING.txt'), $oqing, (New-Object System.Text.UTF8Encoding $true))
Ok "OQING.txt"

# ---- Tekshiruv: bo'lishi SHART bo'lgan fayllar ---------------------
$must = @('sayt\.htaccess', 'sayt\uploads\.htaccess', 'sayt\index.html', 'sayt\admin.html',
          'sayt\api.php', 'sayt\db.php', 'sayt\config.php', 'baza.sql', 'ORNAT.ps1')
foreach ($m in $must) {
  if (-not (Test-Path (Join-Path $stage $m))) { Xato "paketda yo'q: $m" }
}
if ($errs.Count -eq 0) { Ok "majburiy fayllar joyida (yashirin .htaccess lar ham)" }

# ---- 5. Bitta faylga o'rash ----------------------------------------
Write-Host ""
Write-Host "[5/5] Zip yig'ilmoqda" -ForegroundColor Cyan
if (Test-Path $zip) { Remove-Item $zip -Force }
if (-not (Test-Path $Out)) { New-Item -ItemType Directory -Force $Out | Out-Null }

Add-Type -AssemblyName System.IO.Compression | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem | Out-Null
$fs  = [System.IO.File]::Open($zip, [System.IO.FileMode]::CreateNew)
$arc = New-Object System.IO.Compression.ZipArchive -ArgumentList $fs, ([System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem $stage -Recurse -Force -File | ForEach-Object {
    $rel = $_.FullName.Substring($stage.Length).TrimStart('\').Replace('\', '/')
    $e = $arc.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
    $st = $e.Open()
    $data = [System.IO.File]::ReadAllBytes($_.FullName)
    $st.Write($data, 0, $data.Length)
    $st.Close()
  }
} finally {
  $arc.Dispose(); $fs.Dispose()
}

$check = [System.IO.Compression.ZipFile]::OpenRead($zip)
$total = $check.Entries.Count
$bad   = @($check.Entries | Where-Object { $_.FullName -match '\\' }).Count
$hasHt = @($check.Entries | Where-Object { $_.FullName -eq 'sayt/uploads/.htaccess' }).Count
$hasSql= @($check.Entries | Where-Object { $_.FullName -eq 'baza.sql' }).Count
$check.Dispose()

if ($bad -eq 0)   { Ok "$total yozuv, yo'llar to'g'ri slash bilan" } else { Xato "$bad ta teskari slashli yo'l qoldi" }
if ($hasHt -eq 1) { Ok "yashirin uploads/.htaccess zip ichida" }     else { Xato "uploads/.htaccess zip ichiga tushmadi" }
if ($hasSql -eq 1){ Ok "baza.sql zip ichida" }                       else { Xato "baza.sql zip ichiga tushmadi" }

Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host ("=" * 60)
if ($errs.Count -gt 0) {
  Write-Host "PAKET TAYYOR EMAS - yuqoridagi xatolarni tuzating." -ForegroundColor Red
  exit 1
}
Write-Host ("TAYYOR: {0}  ({1:N1} MB)" -f $zip, ((Get-Item $zip).Length/1MB)) -ForegroundColor Green
Write-Host ""
Write-Host "Shu BITTA faylni yangi kompyuterga ko'chiring (fleshka/Telegram/disk),"
Write-Host "u yerda oching va ORNAT.bat ni ikki marta bosing. Tamom."
