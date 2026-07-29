<?php
/* ============================================================
   TSTM — PHP backend (MySQL / MariaDB)
   ------------------------------------------------------------
   • PDO prepared statements (SQL-injection'dan himoya)
   • Tranzaksiyalar (atomiklik)
   • Sessiya autentifikatsiyasi + bcrypt + brute-force himoya
   • CSRF token (yozuv amallariga)
   • Granular CRUD (upsert/remove) — concurrency xavfsiz
   ============================================================ */

error_reporting(0);
@ini_set('display_errors', '0');

require_once __DIR__ . '/db.php';

// ---- Sessiya cookie (xavfsiz) ----
$__https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
session_set_cookie_params([
  'lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax', 'secure' => $__https,
]);
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// ---- CSRF token (sessiya bilan bog'liq) ----
if (empty($_SESSION['csrf'])) {
  $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

// Login/parol KODDA saqlanmaydi. Ular config.php dan keladi (git'ga tushmaydi),
// bo'lmasa — birinchi kirish paroli umuman yo'q va parolsiz kirib bo'lmaydi.
// Qarang: config.sample.php.
$DEFAULT_USER = (string)cfg('admin_user', 'markaz_admini');
$DEFAULT_PASS = (string)cfg('admin_bootstrap_password', '');
$LOGIN_MAX_ATTEMPTS = 5;
$LOGIN_LOCK_SECONDS = 600;

$action = isset($_GET['action']) ? $_GET['action'] : '';

/* -------------------- Helperlar -------------------- */
function jexit($arr, $code = 200) { http_response_code($code); echo json_encode($arr, JSON_UNESCAPED_UNICODE); exit; }
function body_json() {
  $raw = file_get_contents('php://input');
  if ($raw === false) return [];
  $raw = ltrim($raw, "\xEF\xBB\xBF"); // ba'zi klient/proksilar qo'shadigan BOM'ni olib tashlaymiz
  $d = json_decode($raw, true);
  return is_array($d) ? $d : [];
}
function client_ip() { return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown'; }

function require_auth() {
  if (empty($_SESSION['tstm_admin'])) jexit(['ok' => false, 'error' => 'unauthorized'], 401);
}
function require_csrf() {
  $h = isset($_SERVER['HTTP_X_CSRF_TOKEN']) ? $_SERVER['HTTP_X_CSRF_TOKEN'] : '';
  if (empty($_SESSION['csrf']) || !is_string($h) || !hash_equals($_SESSION['csrf'], $h)) {
    jexit(['ok' => false, 'error' => 'bad_csrf'], 403);
  }
}
function audit($pdo, $action, $coll = '', $id = '') {
  try {
    $st = $pdo->prepare("INSERT INTO audit_log (action, coll, item_id, ip) VALUES (:a,:c,:i,:ip)");
    $st->execute([':a' => $action, ':c' => $coll, ':i' => (string)$id, ':ip' => client_ip()]);
    // Jurnal cheksiz o'smasin: 180 kundan eski yozuvlar tozalanadi. Har safar
    // emas, ~1% hollarda — har bir yozuvda DELETE ishlatish ortiqcha yuk bo'lardi.
    if (mt_rand(1, 100) === 1) {
      $pdo->exec("DELETE FROM audit_log WHERE at < (NOW() - INTERVAL 180 DAY)");
    }
  } catch (Exception $e) {}
}

/* Spam hisoblagichlarining eskilarini tozalash (msg_throttle cheksiz o'smasin).
   Har bir yozuv `hits` ichida vaqt tamg'alari massivini saqlaydi; eng oxirgi
   urinishdan bir kun o'tgan bo'lsa, qator umuman keraksiz. */
function prune_throttle($pdo) {
  try {
    if (mt_rand(1, 50) !== 1) return;
    $cut = time() - 86400;
    foreach ($pdo->query("SELECT ip, hits FROM msg_throttle")->fetchAll() as $r) {
      $h = json_decode($r['hits'], true);
      $last = (is_array($h) && $h) ? max($h) : 0;
      if ($last < $cut) {
        $d = $pdo->prepare("DELETE FROM msg_throttle WHERE ip = :ip");
        $d->execute([':ip' => $r['ip']]);
      }
    }
  } catch (Exception $e) {}
}

/* -------------------- DB ulanish + birinchi ishga tushirish -------------------- */
try {
  $pdo = db();
  db_bootstrap_if_empty($pdo);
} catch (Exception $e) {
  // DB mavjud emas — frontend localStorage rejimiga tushadi
  jexit(['ok' => false, 'error' => 'db_unavailable'], 503);
}

/* -------------------- Marshrutlash -------------------- */
switch ($action) {

  case 'load':
    // Ommaviy: sayt kontenti. Shaxsiy bo'limlar (murojaatlar, obunachilar,
    // admin foydalanuvchilar) faqat tizimga kirgan admin uchun to'liq qaytadi —
    // qolganlarga bo'sh massiv. Qarang: db.php -> $PRIVATE_COLLS.
    echo json_encode(db_load_all($pdo, !empty($_SESSION['tstm_admin'])), JSON_UNESCAPED_UNICODE);
    break;

  case 'csrf':
    echo json_encode(['token' => $_SESSION['csrf']]);
    break;

  case 'session':
    echo json_encode(['authed' => !empty($_SESSION['tstm_admin']), 'csrf' => $_SESSION['csrf']]);
    break;

  case 'upsert': {
    require_auth(); require_csrf();
    $b = body_json();
    $coll = isset($b['coll']) ? $b['coll'] : '';
    $item = isset($b['item']) && is_array($b['item']) ? $b['item'] : null;
    global $SCHEMA;
    if (!isset($SCHEMA[$coll]) || $item === null) jexit(['ok' => false, 'error' => 'bad_request'], 400);
    try {
      $saved = coll_upsert($pdo, $coll, $item);
      audit($pdo, 'upsert', $coll, isset($saved['id']) ? $saved['id'] : '');
      jexit(['ok' => true, 'item' => $saved]);
    } catch (Exception $e) { jexit(['ok' => false, 'error' => 'db'], 500); }
    break;
  }

  case 'remove': {
    require_auth(); require_csrf();
    $b = body_json();
    $coll = isset($b['coll']) ? $b['coll'] : '';
    $id = isset($b['id']) ? $b['id'] : '';
    global $SCHEMA;
    if (!isset($SCHEMA[$coll]) || $id === '') jexit(['ok' => false, 'error' => 'bad_request'], 400);
    try {
      coll_delete($pdo, $coll, $id);
      audit($pdo, 'remove', $coll, $id);
      jexit(['ok' => true]);
    } catch (Exception $e) { jexit(['ok' => false, 'error' => 'db'], 500); }
    break;
  }

  case 'settings': {
    require_auth(); require_csrf();
    $b = body_json();
    $s = isset($b['settings']) && is_array($b['settings']) ? $b['settings'] : null;
    if ($s === null) jexit(['ok' => false, 'error' => 'bad_request'], 400);
    try {
      settings_save($pdo, $s);
      audit($pdo, 'settings');
      jexit(['ok' => true]);
    } catch (Exception $e) { jexit(['ok' => false, 'error' => 'db'], 500); }
    break;
  }

  case 'save': {
    // To'liq db almashtirish (reset/patch uchun zaxira yo'l). Auth serverda qoladi.
    require_auth(); require_csrf();
    $b = body_json();
    if (!$b) jexit(['ok' => false, 'error' => 'empty'], 400);
    unset($b['auth']); // client auth e'tiborga olinmaydi
    try {
      db_import($pdo, $b + ['auth' => auth_load($pdo)]);
      audit($pdo, 'save');
      jexit(['ok' => true]);
    } catch (Exception $e) { jexit(['ok' => false, 'error' => 'db'], 500); }
    break;
  }

  case 'reset': {
    require_auth(); require_csrf();
    require_once __DIR__ . '/seed.php';
    $seed = default_seed();
    $seed['auth'] = auth_load($pdo); // parol saqlanadi
    try {
      db_import($pdo, $seed);
      audit($pdo, 'reset');
      jexit(['ok' => true]);
    } catch (Exception $e) { jexit(['ok' => false, 'error' => 'db'], 500); }
    break;
  }

  case 'login': {
    global $DEFAULT_USER, $DEFAULT_PASS, $LOGIN_MAX_ATTEMPTS, $LOGIN_LOCK_SECONDS;
    $ip = client_ip(); $now = time();

    // eski urinishlarni tozalash
    $pdo->prepare("DELETE FROM login_attempts WHERE t < :t")->execute([':t' => $now - 3600]);
    $st = $pdo->prepare("SELECT cnt, t, locked_until FROM login_attempts WHERE ip = :ip");
    $st->execute([':ip' => $ip]);
    $rec = $st->fetch() ?: ['cnt' => 0, 't' => $now, 'locked_until' => 0];
    if (!empty($rec['locked_until']) && $rec['locked_until'] > $now) {
      jexit(['ok' => false, 'error' => 'locked', 'retry_after' => (int)$rec['locked_until'] - $now], 429);
    }

    $b = body_json();
    $u = isset($b['u']) ? trim((string)$b['u']) : '';
    $p = isset($b['p']) ? (string)$b['p'] : '';

    $a = auth_load($pdo);
    $validUser = ($a && !empty($a['username'])) ? $a['username'] : $DEFAULT_USER;
    $hash = ($a && !empty($a['password_hash'])) ? $a['password_hash'] : '';

    $ok = false;
    if ($u !== '' && hash_equals((string)$validUser, $u)) {
      if ($hash !== '' && password_verify($p, $hash)) {
        $ok = true;
      } elseif ($hash === '' && $DEFAULT_PASS !== '' && $p !== '' && hash_equals($DEFAULT_PASS, $p)) {
        // Baza yangi (xesh bo'sh) va config.php da birinchi kirish paroli
        // berilgan — u bilan kirildi, endi bcrypt xeshlab saqlaymiz.
        // $DEFAULT_PASS/$p bo'sh bo'lsa bu shox UMUMAN ishlamaydi: aks holda
        // hash_equals('','') === true bo'lib, parolsiz kirish ochilardi.
        $ok = true;
        auth_save($pdo, $validUser, password_hash($p, PASSWORD_DEFAULT));
      }
    }

    if ($ok) {
      $pdo->prepare("DELETE FROM login_attempts WHERE ip = :ip")->execute([':ip' => $ip]);
      session_regenerate_id(true);
      $_SESSION['tstm_admin'] = true;
      audit($pdo, 'login');
      echo json_encode(['ok' => true, 'csrf' => $_SESSION['csrf']]);
    } else {
      $cnt = (int)$rec['cnt'] + 1;
      $locked = 0;
      if ($cnt >= $LOGIN_MAX_ATTEMPTS) { $locked = $now + $LOGIN_LOCK_SECONDS; $cnt = 0; }
      $up = $pdo->prepare("INSERT INTO login_attempts (ip, cnt, t, locked_until) VALUES (:ip,:c,:t,:l)
                           ON DUPLICATE KEY UPDATE cnt=VALUES(cnt), t=VALUES(t), locked_until=VALUES(locked_until)");
      $up->execute([':ip' => $ip, ':c' => $cnt, ':t' => $now, ':l' => $locked]);
      echo json_encode(['ok' => false]);
    }
    break;
  }

  case 'change_password': {
    require_auth(); require_csrf();
    $b = body_json();
    $cur = isset($b['current']) ? (string)$b['current'] : '';
    $new = isset($b['new']) ? (string)$b['new'] : '';
    // Kamida 12 belgi. Tekshiruv SERVERDA — brauzerdagi tekshiruvni chetlab
    // o'tib to'g'ridan-to'g'ri API'ga so'rov yuborish mumkin.
    if (strlen($new) < 12) jexit(['ok' => false, 'error' => 'weak'], 400);
    if ($new === $cur) jexit(['ok' => false, 'error' => 'same'], 400);
    $a = auth_load($pdo);
    $hash = ($a && !empty($a['password_hash'])) ? $a['password_hash'] : '';
    global $DEFAULT_PASS;
    // Xesh bo'sh bo'lganda ham bo'sh joriy parol qabul qilinmaydi (hash_equals('','') === true tuzog'i)
    $curOk = ($hash !== '')
      ? password_verify($cur, $hash)
      : ($DEFAULT_PASS !== '' && $cur !== '' && hash_equals($DEFAULT_PASS, $cur));
    if (!$curOk) jexit(['ok' => false, 'error' => 'wrong_current'], 403);
    auth_save($pdo, ($a ? $a['username'] : $DEFAULT_USER), password_hash($new, PASSWORD_DEFAULT));
    audit($pdo, 'change_password');
    jexit(['ok' => true]);
    break;
  }

  case 'logout':
    unset($_SESSION['tstm_admin']);
    session_regenerate_id(true);
    echo json_encode(['ok' => true]);
    break;

  case 'upload': {
    require_auth(); require_csrf();
    $b = body_json();
    $data = isset($b['data']) ? $b['data'] : '';
    if (!$data || strpos($data, 'data:') !== 0) jexit(['ok' => false, 'error' => 'no data'], 400);
    // SVG qasddan ruxsat etilmagan (XSS xavfi)
    if (!preg_match('#^data:image/(png|jpe?g|webp|gif);base64,#i', $data, $mm)) jexit(['ok' => false, 'error' => 'bad type'], 400);
    $ext = strtolower($mm[1]); if ($ext === 'jpeg') $ext = 'jpg';
    $bin = base64_decode(substr($data, strpos($data, ',') + 1), true);
    if ($bin === false || $bin === '') jexit(['ok' => false, 'error' => 'decode'], 400);
    // Hajm chegarasi — hujjat yuklashda bor edi, rasmda yo'q edi: bitta so'rov
    // bilan diskni to'ldirib yuborish mumkin bo'lardi.
    if (strlen($bin) > 12 * 1024 * 1024) jexit(['ok' => false, 'error' => 'too large'], 413);
    $info = @getimagesizefromstring($bin);
    $allowed = ['png' => 'image/png', 'jpg' => 'image/jpeg', 'webp' => 'image/webp', 'gif' => 'image/gif'];
    if ($info === false || !isset($allowed[$ext]) || $info['mime'] !== $allowed[$ext]) jexit(['ok' => false, 'error' => 'not a valid image'], 400);
    $dir = __DIR__ . '/uploads';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    $name = 'img_' . date('Ymd_His') . '_' . substr(md5($bin . mt_rand()), 0, 8) . '.' . $ext;
    if (file_put_contents($dir . '/' . $name, $bin, LOCK_EX) === false) jexit(['ok' => false, 'error' => 'write'], 500);
    jexit(['ok' => true, 'path' => 'uploads/' . $name]);
    break;
  }

  case 'upload_pdf': {
    // Nomiga qaramay — PDF va Word (.doc/.docx) hujjatlarini qabul qiladi.
    require_auth(); require_csrf();
    $b = body_json();
    $data = isset($b['data']) ? $b['data'] : '';
    if (!$data || strpos($data, 'data:') !== 0) jexit(['ok' => false, 'error' => 'no data'], 400);
    // brauzer/OS turli mime-type qaytarishi mumkin (masalan .docx uchun ba'zan
    // application/octet-stream) — shuning uchun mime'ga emas, faqat fayl imzosiga ishonamiz.
    if (!preg_match('#^data:[^;,]*;base64,#i', $data)) jexit(['ok' => false, 'error' => 'bad type'], 400);
    $bin = base64_decode(substr($data, strpos($data, ',') + 1), true);
    if ($bin === false || $bin === '') jexit(['ok' => false, 'error' => 'decode'], 400);
    if (strlen($bin) > 30 * 1024 * 1024) jexit(['ok' => false, 'error' => 'too large'], 413);
    // haqiqiy turini fayl imzosi (magic bytes) bilan aniqlaymiz — kengaytma/mime-type niqobidan himoya
    if (substr($bin, 0, 5) === '%PDF-') { $ext = 'pdf'; }
    elseif (substr($bin, 0, 4) === "\xD0\xCF\x11\xE0") { $ext = 'doc'; }  // eski .doc (OLE2 konteyner)
    elseif (substr($bin, 0, 4) === "PK\x03\x04") { $ext = 'docx'; }      // .docx (ZIP asosli)
    else { jexit(['ok' => false, 'error' => 'not a valid pdf or word file'], 400); }
    $dir = __DIR__ . '/uploads';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    $name = 'doc_' . date('Ymd_His') . '_' . substr(md5($bin . mt_rand()), 0, 8) . '.' . $ext;
    if (file_put_contents($dir . '/' . $name, $bin, LOCK_EX) === false) jexit(['ok' => false, 'error' => 'write'], 500);
    jexit(['ok' => true, 'path' => 'uploads/' . $name]);
    break;
  }

  case 'upload_html': {
    require_auth(); require_csrf();
    $b = body_json();
    $html = isset($b['html']) ? (string)$b['html'] : '';
    if ($html === '') jexit(['ok' => false, 'error' => 'no data'], 400);
    if (strlen($html) > 3145728) jexit(['ok' => false, 'error' => 'too large'], 413);
    $dir = __DIR__ . '/uploads';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    $name = 'info_' . date('Ymd_His') . '_' . substr(md5($html . mt_rand()), 0, 8) . '.html';
    if (file_put_contents($dir . '/' . $name, $html, LOCK_EX) === false) jexit(['ok' => false, 'error' => 'write'], 500);
    jexit(['ok' => true, 'path' => 'uploads/' . $name]);
    break;
  }

  case 'message': {
    // Ommaviy: foydalanuvchi murojaati (auth talab qilinmaydi). Spam himoyasi bilan.
    $b = body_json();
    if (!$b) jexit(['ok' => false], 400);
    $MSG_WINDOW = 600; $MSG_MAX = 5; $now = time(); $ip = client_ip();

    // throttle (msg_throttle jadvali)
    $st = $pdo->prepare("SELECT hits FROM msg_throttle WHERE ip = :ip");
    $st->execute([':ip' => $ip]);
    $row = $st->fetch();
    $hits = $row ? json_decode($row['hits'], true) : [];
    if (!is_array($hits)) $hits = [];
    $hits = array_values(array_filter($hits, function ($t) use ($now, $MSG_WINDOW) { return $now - $t < $MSG_WINDOW; }));
    if (count($hits) >= $MSG_MAX) jexit(['ok' => false, 'error' => 'too_many'], 429);

    $inText  = isset($b['text']) ? trim(strip_tags($b['text'])) : '';
    $inEmail = isset($b['email']) ? trim(strip_tags($b['email'])) : '';
    if ($inText === '' && $inEmail === '') jexit(['ok' => false, 'error' => 'empty'], 400);

    $msg = [
      'id' => uidgen(),
      'name' => isset($b['name']) ? substr(strip_tags($b['name']), 0, 200) : '',
      'email' => substr($inEmail, 0, 200),
      'subject' => isset($b['subject']) ? substr(strip_tags($b['subject']), 0, 300) : '',
      'text' => substr($inText, 0, 5000),
      'date' => date('Y-m-d'),
      'read' => false,
    ];
    try {
      coll_upsert($pdo, 'messages', $msg);
      // eng yangi 5000 tasini saqlaymiz
      $pdo->exec("DELETE FROM messages WHERE id NOT IN (SELECT id FROM (SELECT id FROM messages ORDER BY created_at DESC LIMIT 5000) x)");
      $hits[] = $now;
      $up = $pdo->prepare("INSERT INTO msg_throttle (ip, hits) VALUES (:ip,:h) ON DUPLICATE KEY UPDATE hits=VALUES(hits)");
      $up->execute([':ip' => $ip, ':h' => json_encode($hits)]);
      prune_throttle($pdo);
      jexit(['ok' => true]);
    } catch (Exception $e) { jexit(['ok' => false, 'error' => 'db'], 500); }
    break;
  }

  case 'subscribe': {
    // Ommaviy: yangiliklarga obuna. Murojaatdan ALOHIDA — o'z jadvali va o'z
    // spam limiti bor (avval obuna 'messages'ga yozilib, fuqaro murojaatlari
    // qutisiga aralashib ketardi va ularning limitini yeb qo'yardi).
    $b = body_json();
    if (!$b) jexit(['ok' => false, 'error' => 'bad_request'], 400);

    $email = isset($b['email']) ? trim(strip_tags((string)$b['email'])) : '';
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 191) {
      jexit(['ok' => false, 'error' => 'bad_email'], 400);
    }
    $email = mb_strtolower($email);

    // Spam himoyasi: bitta IP 10 daqiqada 3 martadan ko'p obuna bo'lolmaydi
    $SUB_WINDOW = 600; $SUB_MAX = 3; $now = time(); $ip = client_ip();
    $tkey = 'sub:' . $ip;
    $st = $pdo->prepare("SELECT hits FROM msg_throttle WHERE ip = :ip");
    $st->execute([':ip' => $tkey]);
    $row = $st->fetch();
    $hits = $row ? json_decode($row['hits'], true) : [];
    if (!is_array($hits)) $hits = [];
    $hits = array_values(array_filter($hits, function ($t) use ($now, $SUB_WINDOW) { return $now - $t < $SUB_WINDOW; }));
    if (count($hits) >= $SUB_MAX) jexit(['ok' => false, 'error' => 'too_many'], 429);

    $lang = isset($b['lang']) ? preg_replace('/[^a-z]/', '', substr((string)$b['lang'], 0, 5)) : '';

    try {
      // Takror obuna yangi yozuv yaratmaydi — mavjudini yangilaydi (email UNIQUE).
      // Avval bekor qilgan bo'lsa, qayta obuna bo'lishi mumkin.
      $ins = $pdo->prepare(
        "INSERT INTO subscribers (id, email, lang, status, source, date)
         VALUES (:id, :e, :l, 'active', 'modal', :d)
         ON DUPLICATE KEY UPDATE lang = VALUES(lang), status = 'active'"
      );
      $ins->execute([':id' => uidgen(), ':e' => $email, ':l' => $lang, ':d' => date('Y-m-d')]);

      $hits[] = $now;
      $up = $pdo->prepare("INSERT INTO msg_throttle (ip, hits) VALUES (:ip,:h) ON DUPLICATE KEY UPDATE hits=VALUES(hits)");
      $up->execute([':ip' => $tkey, ':h' => json_encode($hits)]);
      prune_throttle($pdo);
      jexit(['ok' => true]);
    } catch (Exception $e) { jexit(['ok' => false, 'error' => 'db'], 500); }
    break;
  }

  case 'view': {
    // Ommaviy hisoblagich. Kalit oldin faqat tozalanardi, lekin CHEKLANMASDI —
    // ixtiyoriy `coll`/`id` bilan cheksiz yangi qator yaratib, views jadvalini
    // shishirib yuborish mumkin edi. Endi: faqat ma'lum bo'limlar + uzunlik
    // chegarasi + yozuv haqiqatan bazada bormi degan tekshiruv.
    global $SCHEMA;
    $b = body_json();
    $coll = isset($b['coll']) ? preg_replace('/[^a-z]/i', '', (string)$b['coll']) : '';
    $iid  = isset($b['id']) ? substr(preg_replace('/[^a-z0-9]/i', '', (string)$b['id']), 0, 40) : '';
    if (!$coll || !$iid || !isset($SCHEMA[$coll])) jexit(['count' => 0]);
    // Mavjud bo'lmagan id uchun qator ochmaymiz
    $chk = $pdo->prepare("SELECT 1 FROM `" . $SCHEMA[$coll]['table'] . "` WHERE id = :id");
    $chk->execute([':id' => $iid]);
    if (!$chk->fetch()) jexit(['count' => 0]);
    $key = $coll . ':' . $iid;
    $up = $pdo->prepare("INSERT INTO views (k, cnt) VALUES (:k, 1) ON DUPLICATE KEY UPDATE cnt = cnt + 1");
    $up->execute([':k' => $key]);
    $st = $pdo->prepare("SELECT cnt FROM views WHERE k = :k");
    $st->execute([':k' => $key]);
    $r = $st->fetch();
    jexit(['count' => $r ? (int)$r['cnt'] : 0]);
    break;
  }

  case 'views': {
    $rows = $pdo->query("SELECT k, cnt FROM views")->fetchAll();
    $out = [];
    foreach ($rows as $r) $out[$r['k']] = (int)$r['cnt'];
    echo json_encode($out, JSON_UNESCAPED_UNICODE);
    break;
  }

  default:
    jexit(['ok' => false, 'error' => 'unknown action'], 404);
}
