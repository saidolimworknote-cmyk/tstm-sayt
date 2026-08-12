# TSTM - YANGI KOMPYUTERGA O'RNATISH
# ==================================================================
# Bu skript koch.ps1 yasagan paket ICHIDA keladi. U yangi kompyuterda
# saytni to'liq ishga tushiradi:
#   1) XAMPP ni topadi va MySQL ishlayotganini tekshiradi
#   2) baza.sql ni import qiladi (barcha kontent, admin paroli, obunachilar)
#   3) sayt fayllarini loyiha papkasiga va XAMPP htdocs ga ko'chiradi
#   4) config.php ni joyiga qo'yadi va natijani tekshiradi
#
# Ishlatish (yangi PC da, zip ochilgandan keyin):
#   ORNAT.bat ni ikki marta bosing
# yoki
#   powershell -ExecutionPolicy Bypass -File ORNAT.ps1
#
# Qo'shimcha kalitlar:
#   -Sayt "D:\ish\tstm-sayt"   loyiha papkasi (standart: Ish stoli)
#   -Xampp "D:\xampp"          XAMPP boshqa diskda bo'lsa
#   -Htdocs "C:\web\tstm"      jonli papka boshqa joyda bo'lsa
#   -DbUser root -DbPass "x"   MySQL root paroli boshqacha bo'lsa
#   -Force                     mavjud baza/papkani ustidan yozish
#   -SkipDb                    bazani import qilmaslik (faqat fayllar)
# ==================================================================
param(
  [string]$Sayt  = "$env:USERPROFILE\Desktop\tstm-sayt",
  [string]$Xampp = '',
  [string]$Htdocs = '',
  [string]$DbUser = '',
  [string]$DbPass = '__ASK__',
  [switch]$Force,
  [switch]$SkipDb
)

$ErrorActionPreference = 'Stop'
$pkg = $PSScriptRoot
$err = @()

function Bosqich($n, $m) { Write-Host ""; Write-Host "[$n] $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "  [OK]   $m" -ForegroundColor Green }
function Ogoh($m) { Write-Host "  [OGOH] $m" -ForegroundColor Yellow }
function Xato($m) { Write-Host "  [XATO] $m" -ForegroundColor Red; $script:err += $m }

Write-Host ""
Write-Host "TSTM saytini o'rnatish" -ForegroundColor Cyan
Write-Host ("=" * 60)

# ---- 0. Paket butunligi -------------------------------------------
$srcDir = Join-Path $pkg 'sayt'
$sqlFile = Join-Path $pkg 'baza.sql'
if (-not (Test-Path $srcDir)) {
  Write-Host ""
  Write-Host "XATO: '$srcDir' topilmadi." -ForegroundColor Red
  Write-Host "ORNAT.ps1 ni zip ICHIDAGI asosiy papkadan ishga tushiring" -ForegroundColor Red
  Write-Host "(yonida 'sayt' papkasi va 'baza.sql' turgan joydan)." -ForegroundColor Red
  exit 1
}
if (-not $SkipDb -and -not (Test-Path $sqlFile)) {
  Write-Host ""
  Write-Host "XATO: baza.sql topilmadi. Zip to'liq ochilmagan bo'lishi mumkin." -ForegroundColor Red
  exit 1
}

# ---- 1. XAMPP ------------------------------------------------------
Bosqich 1 "XAMPP qidirilmoqda"
if ($Xampp -eq '') {
  foreach ($c in @('C:\xampp', 'D:\xampp', 'E:\xampp', "$env:USERPROFILE\xampp")) {
    if (Test-Path (Join-Path $c 'mysql\bin\mysql.exe')) { $Xampp = $c; break }
  }
}
if ($Xampp -eq '' -or -not (Test-Path (Join-Path $Xampp 'mysql\bin\mysql.exe'))) {
  Write-Host ""
  Write-Host "XATO: XAMPP topilmadi." -ForegroundColor Red
  Write-Host "  1) https://www.apachefriends.org dan XAMPP (PHP 8.2) ni o'rnating" -ForegroundColor Yellow
  Write-Host "  2) Keyin shu skriptni qayta ishga tushiring" -ForegroundColor Yellow
  Write-Host "  Agar XAMPP boshqa diskda bo'lsa:  ORNAT.ps1 -Xampp ""D:\xampp""" -ForegroundColor Yellow
  exit 1
}
$mysql  = Join-Path $Xampp 'mysql\bin\mysql.exe'
$htdocs = if ($Htdocs -ne '') { $Htdocs } else { Join-Path $Xampp 'htdocs\tstm-sayt' }
Ok "XAMPP: $Xampp"
$phpExe = Join-Path $Xampp 'php\php.exe'
if (Test-Path $phpExe) {
  $ver = (& $phpExe -r 'echo PHP_VERSION;')
  if ($ver -match '^(\d+)\.(\d+)') {
    if ([int]$Matches[1] -lt 8) { Ogoh "PHP $ver - sayt PHP 8.0+ talab qiladi" } else { Ok "PHP $ver" }
  }
}

# ---- 2. Baza ma'lumotlari ------------------------------------------
# Manba config.php dan o'qiymiz: bazaning nomi va foydalanuvchisi shu yerda.
$dbName = 'tstm'; $cfgUser = 'root'; $cfgPass = ''
$cfgSrc = Join-Path $srcDir 'config.php'
if (Test-Path $cfgSrc) {
  $t = [System.IO.File]::ReadAllText($cfgSrc, [System.Text.Encoding]::UTF8)
  if ($t -match "'db_name'\s*=>\s*'([^']*)'") { $dbName  = $Matches[1] }
  if ($t -match "'db_user'\s*=>\s*'([^']*)'") { $cfgUser = $Matches[1] }
  if ($t -match "'db_pass'\s*=>\s*'([^']*)'") { $cfgPass = $Matches[1] }
}
if ($DbUser -eq '') { $DbUser = $cfgUser }
if ($DbPass -eq '__ASK__') { $DbPass = $cfgPass }

function Mysql-Args {
  $a = @('-u', $DbUser)
  if ($DbPass -ne '') { $a += "-p$DbPass" }
  $a += '--default-character-set=utf8mb4'
  return $a
}

if (-not $SkipDb) {
  Bosqich 2 "MySQL ulanishi tekshirilmoqda"
  # stderr ni 2>&1 bilan yig'maymiz: PS 5.1 uni NativeCommandError ga aylantirib,
  # exit kodi 0 bo'lsa ham xato ko'rsatadi. Faqat $LASTEXITCODE ga qaraymiz.
  & $mysql (Mysql-Args) -e 'SELECT 1;' | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "XATO: MySQL ga ulanib bo'lmadi." -ForegroundColor Red
    Write-Host "  1) XAMPP Control Panel ni oching" -ForegroundColor Yellow
    Write-Host "  2) MySQL yonidagi 'Start' tugmasini bosing (yashil bo'lsin)" -ForegroundColor Yellow
    Write-Host "  3) Shu skriptni qayta ishga tushiring" -ForegroundColor Yellow
    Write-Host "  Agar root paroli qo'yilgan bo'lsa:  ORNAT.ps1 -DbPass ""parolingiz""" -ForegroundColor Yellow
    exit 1
  }
  Ok "MySQL ishlayapti ($DbUser)"

  # ---- 3. Import ---------------------------------------------------
  Bosqich 3 "Baza import qilinmoqda ($dbName)"
  $exists = & $mysql (Mysql-Args) -N -e "SHOW DATABASES LIKE '$dbName';" 2>$null
  if ($exists -match $dbName) {
    if (-not $Force) {
      Write-Host ""
      Write-Host "XATO: '$dbName' bazasi bu kompyuterda ALLAQACHON bor." -ForegroundColor Red
      Write-Host "  Ustidan yozish uchun (ichidagi hamma narsa o'chadi):" -ForegroundColor Yellow
      Write-Host "     powershell -ExecutionPolicy Bypass -File ORNAT.ps1 -Force" -ForegroundColor Yellow
      Write-Host "  Faqat fayllarni ko'chirish uchun:" -ForegroundColor Yellow
      Write-Host "     powershell -ExecutionPolicy Bypass -File ORNAT.ps1 -SkipDb" -ForegroundColor Yellow
      exit 1
    }
    Ogoh "'$dbName' bazasi bor edi - -Force berilgani uchun o'chirilyapti"
    & $mysql (Mysql-Args) -e "DROP DATABASE ``$dbName``;" | Out-Null
  }

  # SOURCE ishlatiladi: PowerShell 5.1 da '<' ni qo'llab-quvvatlamaydi,
  # Get-Content | mysql esa UTF-8 matnni buzadi (kirill/lotin belgilar).
  $sqlPath = (Resolve-Path $sqlFile).Path.Replace('\', '/')
  & $mysql (Mysql-Args) -e "SET NAMES utf8mb4; SOURCE $sqlPath;"
  if ($LASTEXITCODE -ne 0) { Xato "import xatolik bilan tugadi" }

  $cnt = & $mysql (Mysql-Args) -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$dbName';" 2>$null
  if ([int]$cnt -gt 0) { Ok "$cnt ta jadval import qilindi" } else { Xato "baza bo'sh qoldi" }
} else {
  Bosqich 2 "Baza o'tkazib yuborildi (-SkipDb)"
}

# ---- 4. Fayllar ----------------------------------------------------
function Copy-Tree($from, $to, $skipTop) {
  if (-not (Test-Path $to)) { New-Item -ItemType Directory -Force $to | Out-Null }
  $n = 0
  Get-ChildItem $from -Recurse -Force -File | ForEach-Object {
    $rel = $_.FullName.Substring($from.Length).TrimStart('\')
    $top = ($rel -split '\\')[0]
    if ($skipTop -contains $top) { return }
    $dest = Join-Path $to $rel
    $dd = Split-Path $dest -Parent
    if (-not (Test-Path $dd)) { New-Item -ItemType Directory -Force $dd | Out-Null }
    Copy-Item $_.FullName $dest -Force
    $n++
  }
  return $n
}

Bosqich 4 "Loyiha papkasi: $Sayt"
if ((Test-Path $Sayt) -and (Get-ChildItem $Sayt -Force -ErrorAction SilentlyContinue) -and -not $Force) {
  Ogoh "papka bo'sh emas - ustidan yozilmadi. -Force bering yoki -Sayt bilan boshqa yo'l ko'rsating"
} else {
  $n = Copy-Tree $srcDir $Sayt @()
  Ok "$n fayl ko'chirildi"
}

Bosqich 5 "XAMPP htdocs: $htdocs"
# htdocs jonli nusxa - ishlab chiqish artefaktlari (.git va h.k.) u yerda kerak emas.
# DIQQAT: robocopy /MIR ISHLATILMAYDI - u bir marta 80 ta yuklamani o'chirgan.
$n = Copy-Tree $srcDir $htdocs @('.git', '.idea', '.claude', 'backups', 'tests')
Ok "$n fayl ko'chirildi"

# ---- 6. config.php --------------------------------------------------
Bosqich 6 "Sozlamalar tekshirilmoqda"
foreach ($d in @($Sayt, $htdocs)) {
  $c = Join-Path $d 'config.php'
  if (Test-Path $c) { Ok "config.php joyida: $d" }
  else {
    $s = Join-Path $d 'config.sample.php'
    if (Test-Path $s) { Copy-Item $s $c -Force; Ogoh "config.php namunadan yaratildi: $d (baza parolini tekshiring)" }
    else { Xato "config.php yo'q: $d" }
  }
}
foreach ($f in @('.htaccess', 'uploads\.htaccess')) {
  if (Test-Path (Join-Path $htdocs $f)) { Ok "$f joyida" } else { Xato "$f yetishmayapti (himoya qatlami)" }
}
$upl = @(Get-ChildItem (Join-Path $htdocs 'uploads') -File -Force -ErrorAction SilentlyContinue).Count
Ok "uploads: $upl fayl"

# ---- 7. Jonli tekshiruv ---------------------------------------------
Bosqich 7 "Sayt javob beryaptimi"
$url = 'http://localhost/tstm-sayt/'
try {
  $r = Invoke-WebRequest "$url`api.php?action=load" -UseBasicParsing -TimeoutSec 8
  if ($r.Content -match '"ok"\s*:\s*true' -or $r.StatusCode -eq 200) { Ok "api.php javob berdi (HTTP $($r.StatusCode))" }
  else { Ogoh "api.php kutilmagan javob qaytardi" }
} catch {
  Ogoh "Apache hali ishlamayapti. XAMPP Control Panel da 'Apache' -> Start bosing."
}

# ---- Xulosa ---------------------------------------------------------
Write-Host ""
Write-Host ("=" * 60)
if ($err.Count -eq 0) {
  Write-Host "TAYYOR. Sayt o'rnatildi." -ForegroundColor Green
} else {
  Write-Host "TUGADI, LEKIN XATOLAR BOR:" -ForegroundColor Red
  foreach ($e in $err) { Write-Host "  - $e" -ForegroundColor Red }
}
Write-Host ""
Write-Host "  Sayt:        $url" -ForegroundColor Cyan
Write-Host "  Admin:       ${url}admin.html" -ForegroundColor Cyan
Write-Host "  Loyiha:      $Sayt"
Write-Host "  Baza:        $dbName (XAMPP MySQL)"
Write-Host ""
Write-Host "  Admin login va PAROL eski kompyuterdagi bilan bir xil"
Write-Host "  (parol xeshi baza ichida ko'chib keldi)."
Write-Host ""
if ($err.Count -gt 0) { exit 1 }
