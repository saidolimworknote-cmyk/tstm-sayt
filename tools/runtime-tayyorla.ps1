# ==================================================================
# TSTM - PORTATIV RUNTIME NI YIG'ISH (PHP + MariaDB)
# ------------------------------------------------------------------
# Bu skript `runtime\php` va `runtime\mysql` papkalarini rasmiy
# manbalardan yig'adi. Natija REPOGA QO'SHILADI - shuning uchun uni
# har kuni ishlatish shart emas: faqat versiyani yangilaganda.
#
# NEGA RUNTIME REPO ICHIDA
#   Loyiha boshqa kompyuterda hech narsa o'rnatmasdan ishlashi kerak.
#   PHP ham, MariaDB ham repo ichida kelgani uchun yangi PC da
#   `git clone` + `ISHGA.bat` kifoya - XAMPP ham, MySQL o'rnatish ham
#   talab qilinmaydi.
#
# NEGA HAMMASI EMAS, FAQAT KERAKLI QISM
#   To'liq paketlar 350 MB dan oshadi (test fayllari, debug belgilari,
#   ishlatilmaydigan kengaytmalar, 20 tilda xato matnlari). Loyihaga
#   ularning hech biri kerak emas. Quyidagi ro'yxatlar - kod haqiqatan
#   ishlatadigan narsalarning O'ZI (~52 MB).
#
# ISHLATISH
#   powershell -ExecutionPolicy Bypass -File tools\runtime-tayyorla.ps1
#
# Kalitlar
#   -Kesh "D:\yuklamalar"   zip larni shu papkada saqlaydi/qidiradi
#   -Force                  mavjud runtime\ ustidan qayta yozadi
# ==================================================================
param(
  [string]$Kesh = '',
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$sayt    = Split-Path $PSScriptRoot -Parent
$runtime = Join-Path $sayt 'runtime'
if ($Kesh -eq '') { $Kesh = Join-Path $env:TEMP 'tstm-runtime-kesh' }

function Bosqich($n, $m) { Write-Host ""; Write-Host "[$n] $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "  [OK]   $m" -ForegroundColor Green }
function Ogoh($m) { Write-Host "  [OGOH] $m" -ForegroundColor Yellow }

# ---- Manbalar -----------------------------------------------------
# sha256 qiymatlari rasmiy ro'yxatlardan olingan. Yuklangan fayl shu
# bilan tekshiriladi - buzilgan yoki almashtirilgan arxiv o'tmaydi.
$PHP = @{
  Ver  = '8.3.33'
  Url  = 'https://windows.php.net/downloads/releases/php-8.3.33-Win32-vs16-x64.zip'
  Sha  = 'b089e370ff99eb7038b0d22617dec2f3a1d0e93ca26b11fd218f2f5b60422271'
  Zip  = 'php-8.3.33-Win32-vs16-x64.zip'
}
$MDB = @{
  Ver  = '11.4.12'
  Url  = 'https://archive.mariadb.org/mariadb-11.4.12/winx64-packages/mariadb-11.4.12-winx64.zip'
  Sha  = '4db7f8003d4a64ac8042b771c6d34ed04c7ffae8cf52775275b72f2bd4dd17a9'
  Zip  = 'mariadb-11.4.12-winx64.zip'
  Dir  = 'mariadb-11.4.12-winx64'
}

# ---- PHP dan olinadigan fayllar -----------------------------------
# Ildizdagi DLL lar: openssl (php_openssl + https), curl ning bog'liqliklari.
$PHP_ROOT = @(
  'php.exe',
  'php8ts.dll',
  'libcrypto-3-x64.dll', 'libssl-3-x64.dll',   # openssl_* funksiyalari va TLS
  'libssh2.dll', 'nghttp2.dll',                 # curl bog'liqliklari
  'brotlicommon.dll', 'brotlidec.dll'           # curl: brotli siqilgan javoblar
)
# Kengaytmalar: kod HAQIQATAN ishlatadiganlari.
#   pdo_mysql - butun baza qatlami (db.php)
#   openssl   - push-bildirishnoma imzosi (VAPID: openssl_sign, openssl_pkey_*)
#   mbstring  - mb_strtolower / mb_substr (ko'p tilli matn)
#   curl      - push xizmatiga so'rov yuborish
# QO'SHILMAYDI: fileinfo (7.7 MB, kodda finfo_* yo'q), opcache, gd, intl,
# sqlite, pgsql va h.k. - hech biri ishlatilmaydi.
$PHP_EXT = @('php_pdo_mysql.dll', 'php_openssl.dll', 'php_mbstring.dll', 'php_curl.dll')
# extras\ssl\openssl.cnf - push-bildirishnoma (VAPID) kalitini yasash uchun
# SHART. Usiz `openssl_pkey_new` "configuration file routines::no such file"
# bilan jimgina yiqiladi va obuna butunlay ishlamay qoladi (o'lchandi).
$PHP_EXTRAS = @('extras\ssl\openssl.cnf')

# ---- MariaDB dan olinadigan fayllar -------------------------------
# mariadbd.exe - atigi 13 KB stub, butun server server.dll ichida.
$MDB_BIN = @(
  'mariadbd.exe', 'server.dll',        # server
  # mysqld.exe - o'sha serverning ESKI nomdagi stubi (13 KB).
  # `mariadb-install-db.exe` ichida aynan shu nom qattiq yozilgan va
  # usiz "is not recognized as an internal or external command" xatosi
  # bilan yiqiladi. mysql.exe / mysqldump.exe esa stub EMAS (4.6 MB
  # to'liq nusxa) - ular olinmaydi, o'rniga mariadb*.exe ishlatiladi.
  'mysqld.exe',
  'mariadb.exe',                        # klient (baza.sql ni import qilish)
  'mariadb-dump.exe',                   # eksport (kontentni git ga chiqarish)
  'mariadb-install-db.exe',             # bo'sh data papkasini yaratish
  'libcurl.dll', 'zlib1.dll',
  'msvcp140.dll', 'msvcp140_1.dll', 'msvcp140_2.dll',
  'msvcp140_atomic_wait.dll', 'msvcp140_codecvt_ids.dll',
  'vcruntime140.dll', 'vcruntime140_1.dll', 'concrt140.dll'
)
# share\: faqat inglizcha xato matnlari va kodlash jadvallari.
# Qolgan 19 til va Mongo jar fayllari (2.3 MB) kerak emas.
$MDB_SHARE = @('english', 'charsets')

# ---- 1. Yuklab olish ----------------------------------------------
function Ol($paket) {
  $yol = Join-Path $Kesh $paket.Zip
  if (Test-Path $yol) {
    $h = (Get-FileHash $yol -Algorithm SHA256).Hash.ToLower()
    if ($h -eq $paket.Sha) { Ok "keshdan: $($paket.Zip)"; return $yol }
    Ogoh "keshdagi nusxa buzuq - qayta yuklanmoqda"
    Remove-Item $yol -Force
  }
  Write-Host "  yuklanmoqda: $($paket.Zip)"
  # Progress ko'rsatkichi Invoke-WebRequest ni bir necha barobar sekinlashtiradi.
  $eski = $ProgressPreference; $ProgressPreference = 'SilentlyContinue'
  try { Invoke-WebRequest $paket.Url -OutFile $yol -UseBasicParsing }
  finally { $ProgressPreference = $eski }

  $h = (Get-FileHash $yol -Algorithm SHA256).Hash.ToLower()
  if ($h -ne $paket.Sha) {
    Remove-Item $yol -Force -ErrorAction SilentlyContinue
    throw "sha256 mos kelmadi: $($paket.Zip)`n  kutilgan: $($paket.Sha)`n  olingan : $h"
  }
  Ok "yuklandi va sha256 tasdiqlandi: $($paket.Zip)"
  return $yol
}

Write-Host ""
Write-Host "TSTM - portativ runtime yig'ish" -ForegroundColor Cyan
Write-Host ("=" * 60)
Write-Host "  PHP     $($PHP.Ver)"
Write-Host "  MariaDB $($MDB.Ver)"
Write-Host "  Natija  $runtime"

if ((Test-Path $runtime) -and -not $Force) {
  Ogoh "runtime\ allaqachon bor. Qayta yig'ish uchun: -Force"
  exit 0
}

New-Item -ItemType Directory -Force $Kesh | Out-Null

Bosqich 1 "Paketlar"
$phpZip = Ol $PHP
$mdbZip = Ol $MDB

Bosqich 2 "Ochilmoqda"
$tmp = Join-Path $Kesh ('ochish-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item -ItemType Directory -Force $tmp | Out-Null
try {
  Expand-Archive $phpZip -DestinationPath (Join-Path $tmp 'php') -Force
  Expand-Archive $mdbZip -DestinationPath $tmp -Force
  Ok "ikkala arxiv ochildi"

  $phpSrc = Join-Path $tmp 'php'
  $mdbSrc = Join-Path $tmp $MDB.Dir
  if (-not (Test-Path $mdbSrc)) { throw "MariaDB papkasi topilmadi: $mdbSrc" }

  # ---- 3. PHP ------------------------------------------------------
  Bosqich 3 "runtime\php yig'ilmoqda"
  if (Test-Path (Join-Path $runtime 'php')) { Remove-Item (Join-Path $runtime 'php') -Recurse -Force }
  $phpDst = Join-Path $runtime 'php'
  New-Item -ItemType Directory -Force (Join-Path $phpDst 'ext') | Out-Null
  foreach ($f in $PHP_ROOT) {
    $s = Join-Path $phpSrc $f
    if (-not (Test-Path $s)) { throw "PHP faylida yo'q: $f" }
    Copy-Item $s (Join-Path $phpDst $f) -Force
  }
  foreach ($f in $PHP_EXT) {
    $s = Join-Path $phpSrc "ext\$f"
    if (-not (Test-Path $s)) { throw "PHP kengaytmasi yo'q: $f" }
    Copy-Item $s (Join-Path $phpDst "ext\$f") -Force
  }
  foreach ($f in $PHP_EXTRAS) {
    $s = Join-Path $phpSrc $f
    if (-not (Test-Path $s)) { throw "PHP qo'shimchasi yo'q: $f" }
    $d = Join-Path $phpDst $f
    $dd = Split-Path $d -Parent
    if (-not (Test-Path $dd)) { New-Item -ItemType Directory -Force $dd | Out-Null }
    Copy-Item $s $d -Force
  }
  # Litsenziya matnlari saqlanadi (PHP License).
  foreach ($f in @('license.txt', 'LICENSE')) {
    $s = Join-Path $phpSrc $f
    if (Test-Path $s) { Copy-Item $s (Join-Path $phpDst 'LITSENZIYA.txt') -Force }
  }
  Ok "$($PHP_ROOT.Count) fayl + $($PHP_EXT.Count) kengaytma"

  # ---- 4. MariaDB --------------------------------------------------
  Bosqich 4 "runtime\mysql yig'ilmoqda"
  if (Test-Path (Join-Path $runtime 'mysql')) { Remove-Item (Join-Path $runtime 'mysql') -Recurse -Force }
  $mdbDst = Join-Path $runtime 'mysql'
  New-Item -ItemType Directory -Force (Join-Path $mdbDst 'bin') | Out-Null
  New-Item -ItemType Directory -Force (Join-Path $mdbDst 'share') | Out-Null
  foreach ($f in $MDB_BIN) {
    $s = Join-Path $mdbSrc "bin\$f"
    if (-not (Test-Path $s)) { throw "MariaDB faylida yo'q: bin\$f" }
    Copy-Item $s (Join-Path $mdbDst "bin\$f") -Force
  }
  foreach ($d in $MDB_SHARE) {
    $s = Join-Path $mdbSrc "share\$d"
    if (-not (Test-Path $s)) { throw "MariaDB share\$d topilmadi" }
    Copy-Item $s (Join-Path $mdbDst 'share') -Recurse -Force
  }
  # GPL talabi: litsenziya matni paket bilan birga bo'lishi kerak.
  Copy-Item (Join-Path $mdbSrc 'COPYING') (Join-Path $mdbDst 'LITSENZIYA.txt') -Force
  Ok ("$($MDB_BIN.Count) fayl + share\: " + ($MDB_SHARE -join ', '))
} finally {
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
}

# ---- 5. Manifest ---------------------------------------------------
Bosqich 5 "Manifest"
$mb = [math]::Round((Get-ChildItem $runtime -Recurse -File | Measure-Object Length -Sum).Sum / 1MB, 1)
@"
TSTM - portativ runtime
=======================
Bu papka `tools\runtime-tayyorla.ps1` tomonidan RASMIY manbalardan
yig'ilgan. Qo'lda tahrir qilmang - versiyani yangilash uchun skriptni
qayta ishga tushiring.

PHP       $($PHP.Ver)   $($PHP.Url)
MariaDB   $($MDB.Ver)   $($MDB.Url)

Yig'ilgan: $(Get-Date -Format 'yyyy-MM-dd HH:mm')
Hajmi:     $mb MB

Litsenziyalar: php\LITSENZIYA.txt (PHP License), mysql\LITSENZIYA.txt (GPLv2)
"@ | Set-Content (Join-Path $runtime 'VERSIYA.txt') -Encoding utf8

Write-Host ""
Write-Host ("=" * 60)
Write-Host "TAYYOR - runtime\ yig'ildi ($mb MB)" -ForegroundColor Green
Write-Host "  runtime\php\php.exe"
Write-Host "  runtime\mysql\bin\mariadbd.exe"
