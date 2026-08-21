# ==================================================================
# TSTM - KONTENTNI GIT GA CHIQARISH
# ------------------------------------------------------------------
# Bazadagi sayt kontentini `data\baza.sql` fayliga yozadi. O'sha fayl
# git orqali ko'chadi, ya'ni boshqa kompyuterda `git clone` qilgan
# odam AYNI saytni - ayni yangiliklar, ekspertlar, rasm havolalari
# bilan - ko'radi.
#
# NEGA KERAK
#   Rasm FAYLLARI `uploads\` da va git bilan ko'chadi. Ularga HAVOLA
#   esa bazada. Ilgari baza git'da bo'lmagani uchun yangi kompyuterda
#   fayllar bor, havolalar yo'q edi - rasmlar ko'rinmasdi. Bu skript
#   aynan o'sha bo'shliqni yopadi.
#
# NIMA CHIQADI, NIMA CHIQMAYDI
#   Kontent (chiqadi)  - yangiliklar, voqealar, ekspertlar, nashrlar,
#                        media, hamkorlar, sahifalar, sozlamalar.
#   Maxfiy (CHIQMAYDI) - admin parol xeshi, tashrifchi xabarlari,
#                        obunachi emaillari, push kalitlari, IP
#                        manzillar, jurnal va hisoblagichlar.
#   Ya'ni `data\baza.sql` ni ko'rgan odam saytni tiklay oladi, lekin
#   unga KIRA olmaydi va hech kimning shaxsiy ma'lumotini ko'rmaydi.
#
# ISHLATISH
#   powershell -ExecutionPolicy Bypass -File tools\kontent-eksport.ps1
#   (kontentni admin'da o'zgartirgach ishga tushiring, so'ng git commit)
# ==================================================================
param(
  [string]$Chiqish = ''
)

$ErrorActionPreference = 'Stop'
$sayt = Split-Path $PSScriptRoot -Parent
if ($Chiqish -eq '') { $Chiqish = Join-Path $sayt 'data\baza.sql' }

function Ok($m)   { Write-Host "  [OK]   $m" -ForegroundColor Green }
function Ogoh($m) { Write-Host "  [OGOH] $m" -ForegroundColor Yellow }
function Xato($m) { Write-Host "  [XATO] $m" -ForegroundColor Red }

# ---- Kontent jadvallari ------------------------------------------
# DIQQAT: yangi jadval qo'shsangiz, uni SHU ro'yxatga yoki quyidagi
# izohdagi "chiqmaydi" ro'yxatiga ONGLI ravishda joylang. Ro'yxatda
# bo'lmagan jadval eksportga TUSHMAYDI - ya'ni sukut bo'yicha maxfiy.
$KONTENT = @(
  'news',          # yangiliklar
  'events',        # voqealar (konferensiya, uchrashuv, davra suhbati)
  'experts',       # rahbariyat va ekspertlar
  'publications',  # nashrlar (maqola, ma'ruza, tahlil, kitob)
  'media',         # foto/video/infografika
  'media_posts',   # "Ekspertlarimiz OAVda"
  'partners',      # hamkorlar
  'hero_slides',   # bosh sahifa slayderi
  'pages',         # statik sahifalar
  'settings',      # sayt sozlamalari (nom, manzil, ijtimoiy tarmoqlar)
  'users',         # admin panel foydalanuvchilari ro'yxati (PAROLSIZ -
                   #   parol faqat `auth` jadvalida, u chiqmaydi)
  'schema_meta'    # sxema versiyasi (migratsiya uchun)
)
# CHIQMAYDI (ataylab):
#   auth           - admin paroli (bcrypt xeshi)
#   login_attempts - IP manzillar, brute-force holati
#   messages       - tashrifchilar yuborgan xabarlar (shaxsiy ma'lumot)
#   subscribers    - obunachi emaillari (shaxsiy ma'lumot)
#   push_subs      - brauzer push obunalari (qurilmaga bog'liq)
#   push_vapid     - push imzo kalitlari (MAXFIY)
#   msg_throttle   - IP bo'yicha spam hisoblagichi
#   audit_log      - kim nima qilgani jurnali
#   error_log      - xatolar jurnali
#   views          - ko'rishlar hisoblagichi

# ---- Baza sozlamalari config.php dan ------------------------------
$cfg = Join-Path $sayt 'config.php'
if (-not (Test-Path $cfg)) { Xato "config.php topilmadi. Avval saytni bir marta ishga tushiring."; exit 1 }
$t = [System.IO.File]::ReadAllText($cfg, [System.Text.Encoding]::UTF8)
function Cfg($k, $def) { if ($t -match "'$k'\s*=>\s*'([^']*)'") { return $Matches[1] } else { return $def } }
$dbHost = Cfg 'db_host' '127.0.0.1'
$dbPort = Cfg 'db_port' '3307'
$dbName = Cfg 'db_name' 'tstm'
$dbUser = Cfg 'db_user' 'tstm'
$dbPass = Cfg 'db_pass' ''

# ---- mariadb-dump ni topish ---------------------------------------
$dump = Join-Path $sayt 'runtime\mysql\bin\mariadb-dump.exe'
if (-not (Test-Path $dump)) {
  $dump = Join-Path $sayt 'runtime\mysql\bin\mysqldump.exe'
  if (-not (Test-Path $dump)) { Xato "mariadb-dump topilmadi: runtime\mysql\bin\"; exit 1 }
}

Write-Host ""
Write-Host "TSTM - kontent eksporti" -ForegroundColor Cyan
Write-Host ("=" * 60)
Write-Host "  Baza:   $dbName @ ${dbHost}:${dbPort}"
Write-Host "  Natija: $Chiqish"
Write-Host ""

# ---- Eksport ------------------------------------------------------
$a = @('-h', $dbHost, '-P', $dbPort, '-u', $dbUser)
if ($dbPass -ne '') { $a += "-p$dbPass" }
$a += @(
  '--default-character-set=utf8mb4',
  '--single-transaction',        # jadvallarni qulflamaydi
  '--skip-dump-date',            # HAR eksportda sana o'zgarib, git'da
                                 #   soxta o'zgarish ko'rinmasin
  '--skip-comments',             # versiya izohlari ham shunday
  '--add-drop-table',            # qayta import toza bo'lsin
  '--complete-insert',           # ustun nomlari yozilsin: sxema
                                 #   o'zgarsa ham import buzilmaydi
  '--databases', $dbName,
  '--tables'
) + $KONTENT

$sqlDir = Split-Path $Chiqish -Parent
if (-not (Test-Path $sqlDir)) { New-Item -ItemType Directory -Force $sqlDir | Out-Null }

# stderr ni 2>&1 bilan yig'maymiz: PS 5.1 uni NativeCommandError ga
# aylantirib, exit kodi 0 bo'lsa ham xato ko'rsatadi.
$out = & $dump $a
if ($LASTEXITCODE -ne 0) { Xato "eksport yiqildi (kod $LASTEXITCODE)"; exit 1 }

# `--databases` USE/CREATE DATABASE qatorlarini qo'shadi - ular kerak,
# chunki import bo'sh serverga ham tushishi mumkin.
$sarlavha = @"
-- ==================================================================
-- TSTM - sayt kontenti
-- ------------------------------------------------------------------
-- Bu faylni QO'LDA tahrir qilmang. U `tools\kontent-eksport.ps1`
-- tomonidan bazadan yasaladi va `tools\ishga-tushur.ps1` tomonidan
-- bo'sh bazaga avtomatik import qilinadi.
--
-- ICHIDA BOR:  yangiliklar, voqealar, ekspertlar, nashrlar, media,
--              hamkorlar, sahifalar, sozlamalar, admin foydalanuvchi
--              ro'yxati (parolsiz).
-- ICHIDA YO'Q: admin paroli, tashrifchi xabarlari, obunachi
--              emaillari, push kalitlari, IP manzillar, jurnallar.
--
-- Rasm fayllari bu yerda EMAS - ular `uploads\` da, git bilan birga
-- ko'chadi. Bu fayl ularga HAVOLA saqlaydi. Mosligini tekshirish:
--     powershell -File tools\rasm-tekshir.ps1
-- ==================================================================

"@
[System.IO.File]::WriteAllText($Chiqish, $sarlavha + ($out -join "`r`n") + "`r`n", (New-Object System.Text.UTF8Encoding($false)))

$kb = [math]::Round((Get-Item $Chiqish).Length / 1KB, 1)
Ok "$($KONTENT.Count) jadval, $kb KB"
Write-Host ""
Write-Host "  Endi o'zgarishni saqlash uchun:" -ForegroundColor DarkGray
Write-Host "     git add data/baza.sql uploads && git commit -m ""kontent yangilandi""" -ForegroundColor DarkGray
