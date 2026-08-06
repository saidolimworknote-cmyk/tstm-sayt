# TSTM — avtomatlashtirilgan smoke / xavfsizlik testi
# ==================================================================
# Har o'zgarishdan keyin ishga tushiring — sayt buzilmaganini va asosiy
# xavfsizlik himoyalari joyida ekanini tekshiradi.
#
# Ishlatish:
#   powershell -ExecutionPolicy Bypass -File tests\smoke.ps1
#   powershell -ExecutionPolicy Bypass -File tests\smoke.ps1 -Base http://localhost/tstm-sayt
#
# Chiqish kodi: 0 = hammasi o'tdi, 1 = kamida bitta test yiqildi (CI uchun).
#
# ESLATMA: bu testlar FAQAT ommaviy (autentifikatsiyasiz) yuzani tekshiradi —
# admin paroli talab qilinmaydi, shuning uchun xavfsiz va istalgan vaqtda
# ishga tushirsa bo'ladi. Admin CRUD testlari alohida (qo'lda parol bilan).
# ==================================================================
param([string]$Base = 'http://localhost/tstm-sayt')

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
$pages = 'Bosh sahifa - Hi-Fi.html','nashrlar.html','yangiliklar.html','aloqa.html',
         'media.html','rahbariyat.html','markaz-haqida.html','tadqiqotlar.html',
         'tadbirlar.html','yonalish.html','oav.html','sharh.html','admin.html'
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
$h = Head "$Base/Bosh%20sahifa%20-%20Hi-Fi.html"
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
foreach ($f in 'config.php','db.php','seed.php','data.json','.htaccess','.gitignore','SECURITY.md','views.json') {
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
