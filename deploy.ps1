# TSTM — hostingga yuklash paketini yig'ish
# ==================================================================
# Loyihadan FAQAT serverga kerakli fayllarni ajratib, zip qiladi.
#
# Ishlatish:
#   powershell -ExecutionPolicy Bypass -File deploy.ps1
#   powershell -ExecutionPolicy Bypass -File deploy.ps1 -Out "D:\paket"
#   powershell -ExecutionPolicy Bypass -File deploy.ps1 -NoZip   # faqat papka
#
# NEGA SKRIPT, QO'LDA EMAS:
#   1) `.htaccess` va `uploads\.htaccess` — nuqta bilan boshlanadi. FTP
#      mijozlari va Windows Explorer ularni ko'pincha YASHIRADI. Ular
#      ko'chmasa saytning BUTUN himoya qatlami yo'qoladi (CSP, maxfiy
#      fayllarni to'sish, uploads ichida PHP ishlamasligi). Skript ularni
#      ataylab qo'shadi va oxirida borligini TEKSHIRADI.
#   2) `backups\` 114 MB va ichida parol xeshi bor — u hech qachon veb
#      papkaga tushmasligi kerak.
#   3) `config.php` da mahalliy baza paroli bor — serverdagisi boshqacha.
# ==================================================================
param(
  [string]$Out = "$env:USERPROFILE\Desktop\tstm-deploy",
  [string]$Domain = '',
  [switch]$NoZip
)

$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$pkg = Join-Path $Out "tstm-$stamp"

Write-Host "TSTM deploy paketi" -ForegroundColor Cyan
Write-Host ("=" * 60)
Write-Host "Manba:  $src"
Write-Host "Natija: $pkg"
Write-Host ""

# ---- Serverga KETMAYDIGAN narsalar --------------------------------
# Papkalar
$skipDirs = @('backups', '.git', '.idea', '.claude', '.vscode', 'tests', 'node_modules')
# Aniq fayl nomlari
$skipFiles = @(
  'config.php',              # serverda o'ziniki yaratiladi (baza paroli)
  'data.json',               # eskirgan ombor, ichida parol xeshi
  'login_attempts.json',     # brute-force holati
  'views.json',              # ko'rishlar hisoblagichi
  'cache_public.json',       # avtomatik yasaladi
  'deploy.ps1',              # shu skriptning o'zi
  'backup.ps1', 'restore.ps1',   # Windows zaxira vositalari
  'koch.ps1', 'ORNAT.ps1', 'ORNAT.bat',  # boshqa PC ga ko'chirish vositalari
  'eslint.config.mjs', '.stylelintrc.json',  # ishlab chiqish vositalari
  '.gitignore'
)
# Kengaytmalar (hujjatlar serverda kerak emas; .htaccess ularni baribir to'sadi)
$skipExt = @('.md', '.log', '.bak', '.tmp', '.zip', '.sql')

if (Test-Path $pkg) { Remove-Item $pkg -Recurse -Force }
New-Item -ItemType Directory -Path $pkg -Force | Out-Null

# ---- Nusxalash ----------------------------------------------------
$copied = 0; $bytes = 0
Get-ChildItem $src -Recurse -Force -File | ForEach-Object {
  $rel = $_.FullName.Substring($src.Length).TrimStart('\')
  $top = ($rel -split '\\')[0]

  if ($skipDirs -contains $top) { return }
  if ($skipFiles -contains $_.Name) { return }
  if ($skipExt -contains $_.Extension.ToLower()) { return }
  if ($_.Name -like '_*') { return }          # vaqtinchalik sinov stendlari

  $dest = Join-Path $pkg $rel
  $destDir = Split-Path $dest -Parent
  if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
  Copy-Item $_.FullName $dest -Force
  $script:copied++
  $script:bytes += $_.Length
}

Write-Host ("Ko'chirildi: {0} fayl, {1:N1} MB" -f $copied, ($bytes / 1MB))
Write-Host ""

# ---- Domenni yozish -----------------------------------------------
# `sitemap.xml` va `robots.txt` da `SIZNING-DOMENINGIZ.uz` joy egallovchisi
# turadi. Uni LOYIHADA emas, PAKETDA almashtiramiz: shunda loyiha muhitdan
# mustaqil qoladi (sinov domeni va asosiy domen uchun bir xil manba), domen
# esa faqat yuklanadigan nusxaga tushadi.
if ($Domain -ne '') {
  $d = $Domain.Trim() -replace '^https?://', '' -replace '/+$', ''
  foreach ($f in @('sitemap.xml', 'robots.txt')) {
    $p = Join-Path $pkg $f
    $t = [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)
    $t = $t.Replace('SIZNING-DOMENINGIZ.uz', $d)
    # BOM'siz UTF-8: fayllar veb orqali beriladi, BOM XML'ni buzishi mumkin
    [System.IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding $false))
  }
  Write-Host ("Domen yozildi: {0}" -f $d)
  Write-Host ""
}

# ---- TEKSHIRUV: bo'lishi SHART bo'lgan fayllar --------------------
# Bittasi yetishmasa sayt hostingda buziladi yoki himoyasiz qoladi.
$must = @(
  '.htaccess',            # butun xavfsizlik qatlami
  'uploads\.htaccess',    # uploads ichida PHP ishlamasligi
  'index.html',           # bosh sahifa
  'api.php', 'db.php', 'seed.php',
  'sw.js',                # ildizda turishi shart (push scope)
  'robots.txt', 'sitemap.xml',
  'config.sample.php'     # serverda config.php uchun namuna
)
$missing = @()
foreach ($m in $must) {
  if (-not (Test-Path (Join-Path $pkg $m))) { $missing += $m }
}

# ---- TEKSHIRUV: bo'lMASLIGI shart bo'lgan fayllar -----------------
$forbidden = @('config.php', 'data.json', 'backups', '.git')
$leaked = @()
foreach ($f in $forbidden) {
  if (Test-Path (Join-Path $pkg $f)) { $leaked += $f }
}

Write-Host "Tekshiruv" -ForegroundColor Cyan
if ($missing.Count -eq 0) {
  Write-Host "  [OK]   majburiy fayllar joyida (.htaccess ikkalasi ham)"
} else {
  Write-Host ("  [XATO] YETISHMAYDI: {0}" -f ($missing -join ', ')) -ForegroundColor Red
}
if ($leaked.Count -eq 0) {
  Write-Host "  [OK]   maxfiy fayllar paketga tushmagan"
} else {
  Write-Host ("  [XATO] PAKETDA MAXFIY FAYL: {0}" -f ($leaked -join ', ')) -ForegroundColor Red
}

# Domen joy egallovchisi hali almashtirilmaganmi?
$sm = Get-Content (Join-Path $pkg 'sitemap.xml') -Raw -Encoding UTF8
if ($sm -match 'SIZNING-DOMENINGIZ') {
  Write-Host "  [OGOH] sitemap.xml/robots.txt da domen hali qo'yilmagan" -ForegroundColor Yellow
} else {
  Write-Host "  [OK]   domen yozilgan"
}

# ---- Zip ----------------------------------------------------------
if (-not $NoZip) {
  $zip = "$pkg.zip"
  if (Test-Path $zip) { Remove-Item $zip -Force }

  # ZIP QO'LDA YIG'ILADI - `Compress-Archive` ISHLATILMAYDI.
  #
  # PowerShell 5.1 dagi Compress-Archive papka ichidagi yo'llarni Windows
  # ajratgichi bilan yozadi: `uploads\.htaccess`. ZIP standarti esa faqat
  # to'g'ri slashni (`/`) tan oladi. Natijada Linux serverda `unzip` buni
  # papka deb emas, nomida teskari slash bo'lgan YAGONA fayl deb ochadi:
  #   - `uploads/` papkasi umuman paydo bo'lmaydi -> barcha rasm va PDF 404
  #   - `uploads/.htaccess` himoyasi yo'qoladi
  # O'lchangan: 98 fayldan 25 tasi shu holatda edi (uploads ichidagilar).
  # Quyidagi kod har bir yozuvni to'g'ri slash bilan yozadi.
  Add-Type -AssemblyName System.IO.Compression | Out-Null
  Add-Type -AssemblyName System.IO.Compression.FileSystem | Out-Null

  $fs = [System.IO.File]::Open($zip, [System.IO.FileMode]::CreateNew)
  $arc = New-Object System.IO.Compression.ZipArchive -ArgumentList $fs, ([System.IO.Compression.ZipArchiveMode]::Create)
  try {
    Get-ChildItem $pkg -Recurse -Force -File | ForEach-Object {
      $rel = $_.FullName.Substring($pkg.Length).TrimStart('\').Replace('\', '/')
      $entry = $arc.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
      $stream = $entry.Open()
      $data = [System.IO.File]::ReadAllBytes($_.FullName)
      $stream.Write($data, 0, $data.Length)
      $stream.Close()
    }
  } finally {
    $arc.Dispose()
    $fs.Dispose()
  }

  # Tekshiramiz: bitta ham teskari slash qolmasin
  $check = [System.IO.Compression.ZipFile]::OpenRead($zip)
  $badSep = @($check.Entries | Where-Object { $_.FullName -match '\\' }).Count
  $total = $check.Entries.Count
  $check.Dispose()

  $zsize = (Get-Item $zip).Length
  Write-Host ""
  if ($badSep -eq 0) {
    Write-Host ("  [OK]   zip yo'llari to'g'ri slash bilan ({0} yozuv)" -f $total)
  } else {
    Write-Host ("  [XATO] zip'da {0} ta teskari slashli yo'l qoldi" -f $badSep) -ForegroundColor Red
    $script:missing += 'zip-separator'
  }
  Write-Host ("Arxiv: {0} ({1:N1} MB)" -f $zip, ($zsize / 1MB)) -ForegroundColor Green
}

# ---- Topshiriq hujjati -------------------------------------------
# TOPSHIRISH.md paket ICHIGA tushmaydi (.md kengaytmasi chiqarib tashlangan va
# .htaccess uni baribir to'sadi), lekin u o'rnatuvchi mutaxassislar uchun
# zarur. Shuning uchun zip YONIGA qo'yiladi - topshiriladigan to'plam shu:
#   tstm-<sana>.zip + hosting-import.sql + TOPSHIRISH.md
$doc = Join-Path $src 'TOPSHIRISH.md'
if (Test-Path $doc) {
  Copy-Item $doc (Join-Path $Out 'TOPSHIRISH.md') -Force
  Write-Host "  [OK]   TOPSHIRISH.md paket yoniga qo'yildi"
}

Write-Host ""
if ($missing.Count -gt 0 -or $leaked.Count -gt 0) {
  # DIQQAT: bu satr ichida uzun tire (em dash) ISHLATILMAYDI. PowerShell 5.1
  # BOM'siz .ps1 faylni ANSI kod sahifasi bilan o'qiydi va uzun tirening
  # baytlari qo'shtirnoqqa aylanib satrni erta yopadi -> butun skript
  # "string is missing the terminator" xatosi bilan yiqiladi. Izohlarda uzun
  # tire xavfsiz (backup.ps1 da ham bor), satr ICHIDA esa yo'q.
  Write-Host "PAKET TAYYOR EMAS - yuqoridagi xatolarni tuzating." -ForegroundColor Red
  exit 1
}
Write-Host "Paket tayyor." -ForegroundColor Green
Write-Host "Keyingi qadam: DEPLOY.md dagi 5-qadam (fayllarni serverga yuklash)."
