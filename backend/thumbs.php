<?php
/* ============================================================
   TSTM — video muqovalarini SERVER TOMONDA olib kelish.

   NEGA BU FAYL BOR (2026-08-24)
   Ilgari video muqovasi to'g'ridan-to'g'ri `img.youtube.com` dan
   ko'rsatilardi. Ya'ni Media sahifasini ochgan HAR BIR tashrifchining
   IP manzili va brauzer ma'lumoti hech nima bosmasdan turib Google'ga
   ketardi. Endi muqova admin video qo'shgan paytda BIR MARTA server
   tomonidan yuklab olinadi va saytning o'z `uploads/` papkasida yotadi —
   tashrifchi tomonidan YouTube'ga so'rov umuman ketmaydi.

   Pleyerning o'zi YouTube'da qoladi, lekin u FAQAT tashrifchi "play"
   bosganda yuklanadi (js/page-media.js -> lbRender) — bu ongli tanlov.

   SSRF HAQIDA: bu yerda foydalanuvchi bergan URL ishlatilmaydi. Manzil
   kodda qat'iy yozilgan (`img.youtube.com`), o'zgaruvchi qism esa faqat
   11 belgili YouTube identifikatori bo'lib, u `yt_thumb_valid_id()` da
   qat'iy naqsh bilan tekshiriladi. Qayta yo'naltirish ham o'chirilgan
   (FOLLOWLOCATION=false), ya'ni javob boshqa xostga olib keta olmaydi.
   ============================================================ */

/* YouTube identifikatori — qat'iy 11 ta belgi (harf, raqam, `-`, `_`).
   Boshqa hech qanday satr manzilga tushmaydi. */
function yt_thumb_valid_id($vid) {
  return is_string($vid) && preg_match('/^[A-Za-z0-9_-]{11}$/', $vid) === 1;
}

/* Bitta HTTPS GET. TLS tekshiruvi HAR DOIM yoqiq.
   Windows'dagi portativ PHP'da CA to'plami sozlanmagan — o'sha yerda
   `CURLSSLOPT_NATIVE_CA` operatsion tizimning ishonch do'konidan
   foydalanadi. Linux hostingda esa tizim CA to'plami o'zi ishlaydi.
   Tekshiruvni O'CHIRMANG: usiz ulanishni o'rtadan ushlab, muqova
   o'rniga boshqa fayl tiqishtirish mumkin bo'lardi. */
function yt_thumb_http_get($url, $maxBytes = 4194304) {
  if (!function_exists('curl_init')) return '';
  $ch = curl_init($url);
  $opt = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 6,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_USERAGENT      => 'TSTM-site/1.0',
  ];
  if (defined('CURLSSLOPT_NATIVE_CA')) $opt[CURLOPT_SSL_OPTIONS] = CURLSSLOPT_NATIVE_CA;
  curl_setopt_array($ch, $opt);
  $out  = curl_exec($ch);
  $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($out === false || $code !== 200) return '';
  if (strlen($out) > $maxBytes) return '';
  return $out;
}

/* Muqovani eng sifatlisidan boshlab qidiradi.
   TUZOQ: `maxresdefault.jpg` har bir videoda mavjud emas va YouTube u
   yo'q bo'lganda 404 emas, ba'zan 120x90 KULRANG o'rinbosar rasm
   qaytaradi. Shuning uchun kenglik ham tekshiriladi (frontend'dagi
   `naturalWidth <= 120` tekshiruvi bilan bir xil mantiq).
   Muvaffaqiyatda ['bin' => ..., 'quality' => ...], aks holda null. */
function yt_thumb_fetch($vid) {
  if (!yt_thumb_valid_id($vid)) return null;
  foreach (['maxresdefault', 'hqdefault', 'mqdefault'] as $q) {
    $bin = yt_thumb_http_get('https://img.youtube.com/vi/' . $vid . '/' . $q . '.jpg');
    if ($bin === '') continue;
    $info = @getimagesizefromstring($bin);
    if ($info === false || $info['mime'] !== 'image/jpeg') continue;
    if ($info[0] <= 120) continue;               // kulrang o'rinbosar
    return ['bin' => $bin, 'quality' => $q, 'w' => $info[0], 'h' => $info[1]];
  }
  return null;
}

/* Faylni `uploads/` ga yozadi va sayt ishlatadigan NISBIY yo'lni qaytaradi.
   Nom shakli api.php dagi `upload_nomi()` bilan bir xil, lekin o'sha
   funksiya ATAYLAB chaqirilmaydi: bu fayl api.php'siz ham (masalan bir
   martalik to'ldirish skriptidan) ishlashi kerak. */
function yt_thumb_save($bin, $vid) {
  $dir = dirname(__DIR__) . '/uploads';
  if (!is_dir($dir) && !@mkdir($dir, 0775, true)) return '';
  $name = 'video-muqova_' . date('Ymd_His') . '_' . substr(md5($bin . $vid), 0, 8) . '.jpg';
  if (file_put_contents($dir . '/' . $name, $bin, LOCK_EX) === false) return '';
  return 'uploads/' . $name;
}

/* Qulaylik uchun: olib kelish + saqlash. Bo'lmasa bo'sh satr. */
function yt_thumb_localize($vid) {
  $got = yt_thumb_fetch($vid);
  if ($got === null) return '';
  return yt_thumb_save($got['bin'], $vid);
}
