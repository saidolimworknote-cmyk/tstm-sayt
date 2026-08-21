<?php
/* ============================================================
   TSTM — mahalliy server yo'naltiruvchisi (router)
   ------------------------------------------------------------
   Faqat PHP'ning O'Z serveri uchun. Ishga tushirish:

       tools\ISHGA_TUSHIRISH.bat
   yoki qo'lda:
       php -S localhost:8000 router.php

   NEGA KERAK
   ----------
   Hostingda himoyani `.htaccess` (Apache) bajaradi: `config.php`,
   `db.php`, `backups\*.sql` kabi fayllarni brauzerdan yopadi va
   xavfsizlik sarlavhalarini (CSP va h.k.) qo'yadi.

   PHP'ning o'z serveri `.htaccess` ni UMUMAN O'QIMAYDI. Usiz
   `http://localhost:8000/config.php` baza parolini ko'rsatib
   qo'yardi. Shuning uchun bu fayl `.htaccess` dagi AYNI
   qoidalarni PHP tilida takrorlaydi.

   MUHIM: `.htaccess` o'zgarsa — bu faylni ham yangilang.
   Ular juftlik: biri Apache uchun, biri mahalliy server uchun.

   Hostingga bu fayl KETMAYDI (`tools\deploy.ps1` uni chetlab
   o'tadi) — u yerda Apache + .htaccess ishlaydi.
   ============================================================ */

/* -------------------- 0. So'ralgan yo'l -------------------- */
$root = __DIR__;
$uri  = (string)parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$uri  = rawurldecode($uri);

// Papkadan chiqib ketishga urinish (../) — realpath bilan kesiladi.
$full = realpath($root . str_replace('/', DIRECTORY_SEPARATOR, $uri));
if ($full === false || strncmp($full, $root, strlen($root)) !== 0) {
  javob(404, 'Topilmadi');
}

/* -------------------- 1. Papka bo'lsa -------------------- */
// Apache'dagi `DirectoryIndex index.html index.php` + `Options -Indexes`.
if (is_dir($full)) {
  // Yo'l `/` bilan tugamasa — nisbiy havolalar buziladi, Apache kabi
  // yo'naltiramiz: /docs -> /docs/
  if ($uri !== '' && substr($uri, -1) !== '/') {
    header('Location: ' . $uri . '/', true, 301);
    exit;
  }
  $topildi = false;
  foreach (['index.html', 'index.php'] as $ix) {
    $c = $full . DIRECTORY_SEPARATOR . $ix;
    if (is_file($c)) { $full = $c; $topildi = true; break; }
  }
  // `Options -Indexes` — papka ro'yxatini hech qachon ko'rsatmaymiz.
  if (!$topildi) javob(403, 'Papka ro‘yxati yopiq');
}

$nom = basename($full);
$kgt = strtolower(pathinfo($full, PATHINFO_EXTENSION));

/* -------------------- 2. Taqiqlar (.htaccess nusxasi) -------------------- */

// RedirectMatch 404 (?i)/\.(idea|claude|git|vscode|env)(/|$)
// Xizmatchi papkalar butunlay "yo'q" ko'rinadi (403 emas, 404 — mavjudligini
// ham oshkor qilmaydi).
if (preg_match('~[/\\\\]\.(idea|claude|git|vscode|env)([/\\\\]|$)~i', substr($full, strlen($root)))) {
  javob(404, 'Topilmadi');
}

// <FilesMatch "^\.(htaccess|htpasswd|git)">
if (preg_match('~^\.(htaccess|htpasswd|git)~i', $nom)) javob(403, 'Yopiq');

// `tools\` va `tests\` - ishlab chiqish vositalari. Hostingga umuman
// ketmaydi (deploy.ps1 chetlab o'tadi), lekin mahalliy serverda loyiha
// ildizidan uzatilardi. Ichida .php skriptlar bor (rasm-tekshir.php),
// ular veb orqali ISHGA TUSHIB, baza tarkibini oshkor qilishi mumkin edi.
// (Skriptlarning o'zida ham `PHP_SAPI !== 'cli'` himoyasi bor - ikki qatlam.)
if (preg_match('~^[/\\\\](tools|tests|backups|data)([/\\\\]|$)~i', substr($full, strlen($root)))) {
  javob(404, 'Topilmadi');
}

// <FilesMatch "^(db|seed|config|config\.sample)\.php$">
// Baza qatlami va sozlamalar — ichida parol bor, hech qachon berilmaydi.
// `router.php` .htaccess'da yo'q edi (u faqat shu yerda mavjud), lekin
// o'zini o'zi uzatib yubormasligi uchun shu ro'yxatga qo'shildi.
if (preg_match('~^(db|seed|config|config\.sample|router)\.php$~i', $nom)) javob(403, 'Yopiq');

// <FilesMatch "\.(json)$">  — cache_public.json, views.json, login_attempts.json
// (oxirgi ikkitasida IP va hisoblagichlar bor).
// <FilesMatch "\.(md|log|bak|sql|ini)$"> — hujjatlar va baza dumplari.
// .ps1/.bat — .htaccess'da yo'q, chunki hostingda `tools\` umuman bo'lmaydi.
// Mahalliy serverda esa loyiha ildizidan uzatiladi, shuning uchun yopamiz.
if (in_array($kgt, ['json', 'md', 'log', 'bak', 'tmp', 'sql', 'ini', 'ps1', 'bat', 'cmd'], true)) {
  javob(403, 'Yopiq');
}

/* -------------------- 3. Fayl yo'q bo'lsa -------------------- */
if (!is_file($full)) javob(404, 'Topilmadi');

/* -------------------- 4. PHP fayllar -------------------- */
// `false` qaytarsak — serverning o'zi PHP'ni ijro etadi. Bu holatda shu
// yerda qo'yilgan sarlavhalar SAQLANADI (router va skript bitta so'rovda
// ishlaydi), shuning uchun avval sarlavhalarni qo'yamiz.
if ($kgt === 'php') {
  sarlavhalar($nom);
  return false;
}

/* -------------------- 5. Statik fayllar -------------------- */
// DIQQAT: `return false` qilsak, serverning o'zi faylni uzatadi va bu
// yerdagi sarlavhalarni TASHLAB YUBORADI (tekshirilgan). Ya'ni CSP va
// himoya sarlavhalari html/js/css ga yetib bormaydi. Shuning uchun
// statik fayllarni O'ZIMIZ uzatamiz.
sarlavhalar($nom);
header('Content-Type: ' . mimeTuri($kgt));
header('Content-Length: ' . filesize($full));
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'HEAD') readfile($full);
exit;


/* ==================== Yordamchilar ==================== */

function sarlavhalar($nom) {
  // .htaccess dagi `Header always set ...` bilan bir xil ro'yxat.
  header('X-Content-Type-Options: nosniff');
  header('X-Frame-Options: SAMEORIGIN');
  header('Referrer-Policy: strict-origin-when-cross-origin');
  header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
  header("Content-Security-Policy: default-src 'self'; script-src 'self' https://translate.google.com https://translate.googleapis.com https://www.gstatic.com; style-src 'self' https://www.gstatic.com; font-src 'self' data:; img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com https://www.google.com https://www.gstatic.com https://translate.googleapis.com; frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://www.google.com; connect-src 'self' https://translate.googleapis.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'");

  // admin.html — qidiruv tizimlariga tushmasin.
  if (strcasecmp($nom, 'admin.html') === 0) {
    header('X-Robots-Tag: noindex, nofollow, noarchive');
  }

  // ATAYLAB .htaccess'dan FARQ QILADI:
  // hostingda css/js/rasm bir yilga keshlanadi (`mod_expires`), bu yerda esa
  // HECH NARSA keshlanmaydi. Sabab — ishlab chiqishda eng ko'p vaqt yeydigan
  // nosozlik: css/js o'zgartirilgan, brauzer esa eskisini ko'rsatadi.
  header('Cache-Control: no-cache, no-store, must-revalidate');
  header('Pragma: no-cache');
  header('Expires: 0');
}

function mimeTuri($kgt) {
  static $m = [
    'html' => 'text/html; charset=UTF-8',
    'htm'  => 'text/html; charset=UTF-8',
    'css'  => 'text/css; charset=UTF-8',
    'js'   => 'text/javascript; charset=UTF-8',
    'mjs'  => 'text/javascript; charset=UTF-8',
    'xml'  => 'application/xml; charset=UTF-8',
    'txt'  => 'text/plain; charset=UTF-8',
    'svg'  => 'image/svg+xml',
    'png'  => 'image/png',
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif'  => 'image/gif',
    'webp' => 'image/webp',
    'avif' => 'image/avif',
    'ico'  => 'image/x-icon',
    // .htaccess dagi `AddType` bilan bir xil
    'woff2'=> 'font/woff2',
    'woff' => 'font/woff',
    'ttf'  => 'font/ttf',
    'otf'  => 'font/otf',
    'eot'  => 'application/vnd.ms-fontobject',
    'pdf'  => 'application/pdf',
    'doc'  => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls'  => 'application/vnd.ms-excel',
    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt'  => 'application/vnd.ms-powerpoint',
    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'mp4'  => 'video/mp4',
    'webm' => 'video/webm',
    'mp3'  => 'audio/mpeg',
    'ogg'  => 'audio/ogg',
    'zip'  => 'application/zip',
    'webmanifest' => 'application/manifest+json',
  ];
  return $m[$kgt] ?? 'application/octet-stream';
}

function javob($kod, $matn) {
  http_response_code($kod);
  header('Content-Type: text/html; charset=UTF-8');
  header('X-Content-Type-Options: nosniff');
  echo '<!doctype html><meta charset="utf-8"><title>' . $kod . '</title>'
     . '<body style="font:16px system-ui;padding:40px">'
     . '<h1>' . $kod . '</h1><p>' . htmlspecialchars($matn, ENT_QUOTES, 'UTF-8') . '</p>';
  exit;
}
