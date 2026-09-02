<?php
/* ============================================================
   VirusTotal API v3 — yuklangan hujjatlarni (PDF/Word) tekshirish.

   Ixtiyoriy: faqat backend/config.php'da 'virustotal_api_key' berilgan
   bo'lsa ishlaydi (config.sample.php'da bo'sh qoldirilgan — standart
   holatda O'CHIQ, hech narsani bloklamaydi). Bepul kalit:
   virustotal.com/gui/join-us (kunlik/daqiqalik so'rov limiti bor —
   Public API 4 so'rov/daqiqa, shuning uchun faqat hujjat (PDF/Word)
   yuklashda ishlatiladi, rasm yuklashda EMAS — u ancha tez-tez
   bo'ladi va limitni zudlik bilan tugatardi).

   Qarang: SECURITY.md 12-bo'lim (avval "antivirus yo'q" deb qayd etilgan).
   ============================================================ */

// Faylni VirusTotal'ga yuboradi va tahlil natijasini CHEKLANGAN vaqt ichida
// kutadi. Qaytadi:
//   ['status' => 'clean']                — hech qanday dvigatel zararli demadi
//   ['status' => 'malicious', 'n' => N]  — N ta dvigatel zararli/shubhali dedi
//   ['status' => 'timeout']              — tahlil vaqt ichida tugamadi
//   ['status' => 'skip']                 — API kaliti yo'q yoki tarmoq/xizmat xatosi
// 'timeout' va 'skip' holatlarida chaqiruvchi kod faylni RAD ETMAYDI —
// VirusTotal'ning o'zi ishlamay qolishi butun yuklash funksiyasini
// to'xtatib qo'ymasligi kerak (mavjud imzo/kengaytma tekshiruvi baribir
// ishlagan bo'ladi).
function vt_scan_file($apiKey, $bin, $filename) {
  $apiKey = trim((string)$apiKey);
  if ($apiKey === '') return ['status' => 'skip'];

  $boundary = '----tstmvt' . bin2hex(random_bytes(8));
  $body = "--$boundary\r\n"
        . "Content-Disposition: form-data; name=\"file\"; filename=\"" . addslashes($filename) . "\"\r\n"
        . "Content-Type: application/octet-stream\r\n\r\n"
        . $bin . "\r\n--$boundary--\r\n";

  $ch = curl_init('https://www.virustotal.com/api/v3/files');
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => [
      'x-apikey: ' . $apiKey,
      'Content-Type: multipart/form-data; boundary=' . $boundary,
      'Content-Length: ' . strlen($body),
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
  ]);
  $res = curl_exec($ch);
  $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($code !== 200 || !$res) return ['status' => 'skip'];
  $j = json_decode($res, true);
  $analysisId = isset($j['data']['id']) ? (string)$j['data']['id'] : '';
  if ($analysisId === '') return ['status' => 'skip'];

  // Tahlil darhol tugamaydi — bir necha soniyadan o'nlab soniyagacha
  // davom etishi mumkin. PHP so'rov vaqti cheklangan (max_execution_time,
  // TOPSHIRISH.md: 60s), shuning uchun cheklangan vaqt ichida so'raymiz;
  // tugamasa yuqoridagi qoida bo'yicha 'timeout' qaytariladi (rad etilmaydi).
  $deadline = time() + 25;
  while (time() < $deadline) {
    sleep(2);
    $ch = curl_init('https://www.virustotal.com/api/v3/analyses/' . rawurlencode($analysisId));
    curl_setopt_array($ch, [
      CURLOPT_HTTPHEADER => ['x-apikey: ' . $apiKey],
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => 10,
    ]);
    $res = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code !== 200 || !$res) continue;
    $j = json_decode($res, true);
    $status = isset($j['data']['attributes']['status']) ? $j['data']['attributes']['status'] : '';
    if ($status === 'completed') {
      $stats = isset($j['data']['attributes']['stats']) ? $j['data']['attributes']['stats'] : [];
      $bad = (int)(isset($stats['malicious']) ? $stats['malicious'] : 0)
           + (int)(isset($stats['suspicious']) ? $stats['suspicious'] : 0);
      return $bad > 0 ? ['status' => 'malicious', 'n' => $bad] : ['status' => 'clean'];
    }
  }
  return ['status' => 'timeout'];
}
