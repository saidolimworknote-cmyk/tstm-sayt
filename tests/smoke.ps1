# TSTM - avtomatlashtirilgan smoke / xavfsizlik testi
# ==================================================================
# Har o'zgarishdan keyin ishga tushiring - sayt buzilmaganini va asosiy
# xavfsizlik himoyalari joyida ekanini tekshiradi.
#
# Ishlatish:
#   powershell -ExecutionPolicy Bypass -File tests\smoke.ps1
#   powershell -ExecutionPolicy Bypass -File tests\smoke.ps1 -Base http://localhost:8080
#
# Chiqish kodi: 0 = hammasi o'tdi, 1 = kamida bitta test yiqildi (CI uchun).
#
# ESLATMA: bu testlar FAQAT ommaviy (autentifikatsiyasiz) yuzani tekshiradi -
# admin paroli talab qilinmaydi, shuning uchun xavfsiz va istalgan vaqtda
# ishga tushirsa bo'ladi. Admin CRUD testlari alohida (qo'lda parol bilan).
# ==================================================================
# Standart manzil - `tools\ISHGA_TUSHIRISH.bat` ochadigan port.
# (2026-08-21 gacha `http://localhost/tstm-sayt` edi: sayt Apache va htdocs
#  orqali ochilardi. Endi PHP'ning o'z serveri loyiha papkasidan uzatadi.)
param([string]$Base = 'http://localhost:8000')

$pass = 0; $fail = 0; $failed = @()
function Check($name, $cond, $detail='') {
  if ($cond) { $script:pass++; Write-Host ("  [OK]   {0}" -f $name) }
  else { $script:fail++; $script:failed += $name; Write-Host ("  [FAIL] {0}  {1}" -f $name, $detail) -ForegroundColor Red }
}
function Get2($url) { try { Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 20 -MaximumRedirection 3 } catch { $_.Exception.Response } }
function Head($url) { & curl.exe -s -D - -o NUL $url }
function Post2($url,$obj,$hdr) { $p=@{Uri=$url;Method='POST';UseBasicParsing=$true;TimeoutSec=20;Body=($obj|ConvertTo-Json -Compress -Depth 6);ContentType='application/json'}; if($hdr){$p.Headers=$hdr}; try{Invoke-WebRequest @p}catch{$_.Exception.Response} }
function Code($r){ if($r -and $r.StatusCode){[int]$r.StatusCode}else{0} }

Write-Host "TSTM smoke testi -> $Base"
Write-Host ("=" * 60)

# ---- 1. Sahifalar yuklanadi (200) ----
Write-Host "`n[1] Sahifalar 200 qaytaradi"
$pages = 'index.html','nashrlar.html','aloqa.html',
         'media.html','rahbariyat.html','markaz-haqida.html','tadqiqotlar.html',
         'tadbirlar.html','yonalish.html','oav.html','sharh.html',
         'ekspertlar.html','tahlillar.html','maruzalar.html','maqolalar.html','kitoblar.html',
         'uchrashuvlar.html','davra-suhbatlari.html','konferensiyalar.html','markaz-hayoti.html',
         'biz-kimmiz.html','hamkorlar.html','tadbir.html','admin.html'
foreach ($p in $pages) {
  $r = Get2 "$Base/$([uri]::EscapeDataString($p))"
  Check "sahifa: $p" ((Code $r) -eq 200) "status=$(Code $r)"
}

# ---- 2. API load kontrakti ----
Write-Host "`n[2] API load kontrakti"
$r = Get2 "$Base/api.php?action=load"
Check "load 200" ((Code $r) -eq 200)
$json = $null; try { $json = $r.Content | ConvertFrom-Json } catch {}
Check "load haqiqiy JSON" ($json -ne $null)
if ($json) {
  foreach ($k in 'news','mediaPosts','publications','experts','events','pages','settings') {
    Check "load kaliti: $k" ($null -ne $json.PSObject.Properties[$k])
  }
  # Maxfiy bo'limlar anonim so'rovda BO'SH bo'lishi kerak
  Check "maxfiy 'users' anonimda bo'sh" (@($json.users).Count -eq 0) "sizib chiqdi!"
  Check "maxfiy 'messages' anonimda bo'sh" (@($json.messages).Count -eq 0) "sizib chiqdi!"
  Check "maxfiy 'subscribers' anonimda bo'sh" (@($json.subscribers).Count -eq 0) "sizib chiqdi!"
  Check "parol xeshi sizmaydi" (-not ($r.Content -match 'password_hash|\$2y\$'))
}

# ---- 3. Xavfsizlik sarlavhalari ----
Write-Host "`n[3] Xavfsizlik sarlavhalari"
$h = Head "$Base/index.html"
Check "Content-Security-Policy" ($h -match 'Content-Security-Policy:')
Check "X-Content-Type-Options: nosniff" ($h -match 'X-Content-Type-Options:\s*nosniff')
Check "X-Frame-Options" ($h -match 'X-Frame-Options:')
Check "Referrer-Policy" ($h -match 'Referrer-Policy:')
Check "CSP object-src none" ($h -match "object-src 'none'")
# CSP qat'iyligi (2026-08-03): ommaviy sahifada inline skript ham, inline uslub ham bloklangan.
$cspLine = ($h -split "`n" | Where-Object { $_ -match 'Content-Security-Policy:' }) -join ' '
$styleSrc = if ($cspLine -match 'style-src([^;]*)') { $Matches[1] } else { '' }
$scriptSrc = if ($cspLine -match 'script-src([^;]*)') { $Matches[1] } else { '' }
Check "ommaviy CSP script-src'da unsafe-inline YO'Q" (-not ($scriptSrc -match 'unsafe-inline')) "inline skript ochiq!"
Check "ommaviy CSP style-src'da unsafe-inline YO'Q" (-not ($styleSrc -match 'unsafe-inline')) "inline uslub ochiq!"
$ha = Head "$Base/admin.html"
Check "admin noindex (X-Robots-Tag)" ($ha -match 'X-Robots-Tag:.*noindex')

# ---- 4. Maxfiy fayllar HTTP orqali bloklangan ----
Write-Host "`n[4] Maxfiy fayllar bloklangan (403/404)"
# 2026-08-20: hujjatlar `docs\` ga ko'chdi. `.htaccess` dagi to'siq FAYL NOMIGA
# qaraydi (FilesMatch), ya'ni papka ichida ham ishlaydi - shuni tekshiramiz.
#
# 2026-08-22: `db.php`, `seed.php`, `config.php` ildizdan `backend\` ga ko'chdi.
# Ikkala manzil ham sinaladi: YANGI yo'l (papka to'sig'i ishlayaptimi) va ESKI
# ildiz yo'li (fayl nomi bo'yicha to'siq saqlanib qolganmi - kimdir fayllarni
# ildizga qaytarsa himoya o'z-o'zidan yo'qolmasligi kerak).
foreach ($f in 'backend/config.php','backend/db.php','backend/seed.php','backend/config.sample.php',
               'config.php','db.php','seed.php',
               'data.json','.htaccess','.gitignore','docs/SECURITY.md') {
  $r = Get2 "$Base/$f"
  Check "bloklangan: $f" ((Code $r) -in 403,404) "status=$(Code $r)"
}

# ---- 5. uploads/ da PHP bajarilmaydi ----
Write-Host "`n[5] uploads/ da PHP bajarilmaydi"
$r = Get2 "$Base/uploads/nonexistent-probe.php"
Check "uploads PHP -> 403/404 (bajarilmaydi)" ((Code $r) -in 403,404) "status=$(Code $r)"

# ---- 6. Auth himoyasi (anonim yozuv rad etiladi) ----
Write-Host "`n[6] Yozuv amallari auth talab qiladi"
$r = Post2 "$Base/api.php?action=upsert" @{ coll='news'; item=@{id='smoke-probe';title=@{uz='x'}} } $null
Check "anonim upsert rad etiladi" ((Code $r) -in 401,403) "status=$(Code $r)"
$r = Post2 "$Base/api.php?action=remove" @{ coll='news'; id='x' } $null
Check "anonim remove rad etiladi" ((Code $r) -in 401,403) "status=$(Code $r)"

# ---- 7. Kirish validatsiyasi ----
Write-Host "`n[7] Kirish validatsiyasi"
$r = Post2 "$Base/api.php?action=subscribe" @{ email='notanemail' } $null
Check "yaroqsiz email rad (400)" ((Code $r) -eq 400) "status=$(Code $r)"
$r = Post2 "$Base/api.php?action=push_subscribe" @{ endpoint='https://evil.com/x' } $null
Check "SSRF endpoint rad (400)" ((Code $r) -eq 400) "status=$(Code $r)"
$r = Post2 "$Base/api.php?action=item&coll=users&id=1" @{} $null
$rg = Get2 "$Base/api.php?action=item&coll=users&id=1"
Check "maxfiy kolleksiya item rad (401/404)" ((Code $rg) -in 401,404) "status=$(Code $rg)"

# ---- 8. Menyu havolalari o'lik emas ----
# NEGA KERAK: menyu ikki joyda yoziladi - site-common.js dagi NAV (ichki
# sahifalar) va index.html dagi qo'lda yozilgan nusxa (bosh sahifa). Biri
# yangilanib ikkinchisi qolib ketsa yoki band sahifasi yaratilmasa, tashrifchi
# menyudan 404 ga tushadi (2026-08-17 da "Biz kimmiz"/"Hamkorlar" bilan aynan
# shunday bo'lgan). Shu ro'yxat ikkala nusxadagi BARCHA ichki havolani qamraydi.
Write-Host "`n[8] Menyu havolalari 200 qaytaradi"
$navLinks = 'biz-kimmiz.html','rahbariyat.html','ekspertlar.html','hamkorlar.html',
            'uchrashuvlar.html','davra-suhbatlari.html','konferensiyalar.html','markaz-hayoti.html',
            'maqolalar.html','maruzalar.html','tahlillar.html','kitoblar.html',
            'oav.html','media.html?tab=photo','media.html?tab=video','media.html?tab=info',
            'markaz-haqida.html','tadbirlar.html','nashrlar.html','aloqa.html'
foreach ($l in $navLinks) {
  $r = Get2 "$Base/$l"
  Check "menyu havolasi: $l" ((Code $r) -eq 200) "status=$(Code $r)"
}

# ---- 9. Menyuning IKKI nusxasi bir xilmi ----
# NEGA KERAK: menyu ikki joyda yoziladi va ular AYRILIB ketdi. `nav_news`
# bandi `site-common.js` dagi NAV ga ham, `index.html` ga ham yozilmagan edi,
# holbuki `yangiliklar.html` sahifasi bor va admin panelda "Yangiliklar"
# bo'limi ishlar edi. Natijada admin yangilik qo'shsa, uni saytning menyusidan
# topib bo'lmasdi. Yuqoridagi [8] buni TUTA OLMAYDI - u faqat havola tirikmi
# deb qaraydi, havolaning menyuda BOR-YO'QLIGINI emas.
Write-Host "`n[9] Menyuning ikki nusxasi mos keladi"
$root = Split-Path $PSScriptRoot -Parent
$sc = Get-Content (Join-Path $root 'js\site-common.js') -Raw -Encoding UTF8
$ix = Get-Content (Join-Path $root 'index.html') -Raw -Encoding UTF8
# `const NAV = [ ... ];` blokidagi barcha href
$navBlock = [regex]::Match($sc, '(?s)const NAV = \[.*?\n  \];')
if (-not $navBlock.Success) {
  Check "site-common.js dagi NAV topildi" $false "regex mos kelmadi"
} else {
  $hrefs = [regex]::Matches($navBlock.Value, "href:\s*'([^']+)'") |
           ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
  Check "NAV bo'sh emas" ($hrefs.Count -gt 0) "topilgan: $($hrefs.Count)"
  foreach ($h in $hrefs) {
    Check "index.html menyusida ham bor: $h" ($ix -match [regex]::Escape("href=`"$h`"")) 'index.html dagi qo''lda yozilgan menyuga qo''shing'
  }
}

# ---- 10. Admin menyusi sayt menyusiga mos keladimi ----
# Alohida skript (`tests\menyu-mos.js`), chunki u HTTP emas - MANBA fayllarni
# o'qiydi. Node bo'lmasa o'tkazib yuboriladi: smoke.ps1 hech qanday tashqi
# vositaga bog'liq bo'lmasligi kerak.
Write-Host "`n[10] Admin menyusi sayt menyusiga mos"
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$navTest = Join-Path $PSScriptRoot 'menyu-mos.js'
if (-not $nodeCmd) {
  Write-Host "  [O'TKAZILDI] node topilmadi - qo'lda: node tests\menyu-mos.js" -ForegroundColor DarkGray
} elseif (-not (Test-Path $navTest)) {
  Check "menyu-mos.js mavjud" $false 'fayl yo''q'
} else {
  $out = & $nodeCmd.Source $navTest 2>&1
  $code = $LASTEXITCODE
  Check "admin va sayt menyusi mos" ($code -eq 0) 'batafsili: node tests\menyu-mos.js'
  if ($code -ne 0) { $out | Where-Object { $_ -match '\[XATO\]' } | ForEach-Object { Write-Host "         $_" -ForegroundColor Red } }
}

Write-Host "`n[11] data\baza.sql kodlashi butun"
# NEGA BU TEST BOR
#   2026-08-24 da tools\kontent-eksport.ps1 dump chiqishini PowerShell
#   o'zgaruvchisiga ushlagan edi. PS 5.1 native dasturning chiqishini
#   konsol kod sahifasi (o'sha kompyuterda CP857) bilan dekodlaydi, ya'ni
#   UTF-8 baytlar buzilib qaytadan yozilgan. Natijada BUTUN bazadagi
#   ruscha matnlar va tire/qo'shtirnoq/daraja belgilari nobud bo'lib
#   git orqali ikkinchi kompyuterga ko'chgan. Buzilish faylga TINCHGINA
#   tushgani uchun uni faqat sayt ochilganda payqash mumkin edi.
#   Endi eksportning o'zi to'xtaydi, bu test esa ikkinchi to'siq:
#   buzuq baza.sql commit'ga yetib borsa ham, shu yerda ushlanadi.
$bazaSql = Join-Path $root 'data\baza.sql'
if (-not (Test-Path $bazaSql)) {
  Check "data\baza.sql mavjud" $false 'fayl yo''q'
} else {
  # QAT'IY UTF-8: bitta yaroqsiz bayt ham istisno ko'taradi.
  $utf8Qat = New-Object System.Text.UTF8Encoding($false, $true)
  $matn = $null
  try { $matn = $utf8Qat.GetString([System.IO.File]::ReadAllBytes($bazaSql)) } catch { }
  Check "baza.sql haqiqiy UTF-8" ($null -ne $matn) 'yaroqsiz baytlar bor'
  if ($null -ne $matn) {
    # Ramka/blok belgilari (U+2500..U+25A0) va U+FFFD - OEM buzilishining izi.
    # Naqsh belgi KODLARIDAN quriladi: bu skript sof ASCII bo'lishi kerak.
    $naqsh = "[" + [char]0xFFFD + [char]0x2500 + "-" + [char]0x25A0 + "]"
    Check "baza.sql da buzilgan belgi yo'q" (-not ($matn -match $naqsh)) 'CP857/OEM buzilishi alomati'
    # Qator oxiri: fayl .gitattributes bo'yicha LF. CR paydo bo'lsa,
    # demak kimdir uni CRLF bilan qayta yozgan va git farqi shishadi.
    Check "baza.sql qator oxirlari LF" (-not $matn.Contains([char]13)) 'ichida CR bor'
  }
}

# ---- Xulosa ----
Write-Host "`n$("=" * 60)"
Write-Host ("NATIJA: {0} o'tdi, {1} yiqildi" -f $pass, $fail)
if ($fail -gt 0) {
  Write-Host "Yiqilgan testlar:" -ForegroundColor Red
  $failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
  exit 1
} else {
  Write-Host "Hammasi o'tdi." -ForegroundColor Green
  exit 0
}
