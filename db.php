<?php
/* ============================================================
   TSTM — MySQL (MariaDB) ma'lumotlar qatlami
   ------------------------------------------------------------
   • PDO + prepared statements (SQL-injection'dan himoya)
   • Avtomatik baza + jadval yaratish (indekslar bilan)
   • Tranzaksiyalar (atomiklik)
   • collection -> jadval xaritasi ($SCHEMA)
   api.php shu fayldan foydalanadi.
   ============================================================ */

/* -------------------- Sozlamalar --------------------
   Maxfiy qiymatlar (baza paroli, birinchi kirish paroli) KODDA saqlanmaydi —
   ular git'ga tushmaydigan `config.php` faylidan o'qiladi. Namuna uchun:
   `config.sample.php` ni `config.php` deb nusxalang.

   config.php bo'lmasa — quyidagi XAMPP standartlariga qaytamiz, ya'ni
   mahalliy ishlab chiqish hech qanday sozlashsiz ishlayveradi.
-------------------------------------------------------------------------- */
$CFG = [];
if (is_file(__DIR__ . '/config.php')) {
  $__c = require __DIR__ . '/config.php';
  if (is_array($__c)) $CFG = $__c;
}
function cfg($k, $def = '') { global $CFG; return array_key_exists($k, $CFG) ? $CFG[$k] : $def; }

$DB_HOST = cfg('db_host', '127.0.0.1');
$DB_PORT = cfg('db_port', '3306');
$DB_NAME = cfg('db_name', 'tstm');
$DB_USER = cfg('db_user', 'root');
$DB_PASS = cfg('db_pass', '');
$DB_CHARSET = 'utf8mb4';

/* -------------------- Collection -> jadval xaritasi --------------------
   type: 'str' | 'date' | 'int' | 'bool' | 'json'
   key  = frontend JSON kaliti (masalan 'order'), col = DB ustuni (masalan 'sort_order').
   Bir xil bo'lsa faqat 'key' berilsa kifoya. Har jadvalda PK = `id` (VARCHAR).
--------------------------------------------------------------------------- */
$SCHEMA = [
  'users' => ['table' => 'users', 'cols' => [
    ['key' => 'name'], ['key' => 'login'], ['key' => 'email'],
    ['key' => 'role'], ['key' => 'status'], ['key' => 'last'],
  ]],
  'news' => ['table' => 'news', 'cols' => [
    ['key' => 'title', 'type' => 'json'], ['key' => 'category'],
    ['key' => 'date', 'type' => 'date'], ['key' => 'status'], ['key' => 'cover'],
    ['key' => 'excerpt', 'type' => 'json'], ['key' => 'body', 'type' => 'json'],
    ['key' => 'region'], ['key' => 'author'],
  ]],
  // "Bizning ekspertlar OAVlarda" — ekspertlarimizning ommaviy axborot
  // vositalaridagi sharhlari. Tuzilishi yangilikka o'xshash, ustiga uchta
  // maydon: kim (expert), qayerda (outlet) va asl manba havolasi (source).
  'mediaPosts' => ['table' => 'media_posts', 'cols' => [
    ['key' => 'title', 'type' => 'json'], ['key' => 'excerpt', 'type' => 'json'],
    ['key' => 'body', 'type' => 'json'],
    ['key' => 'expert'], ['key' => 'outlet'], ['key' => 'source'],
    ['key' => 'category'], ['key' => 'date', 'type' => 'date'],
    ['key' => 'cover'], ['key' => 'status'],
  ]],
  'events' => ['table' => 'events', 'cols' => [
    ['key' => 'title', 'type' => 'json'], ['key' => 'date', 'type' => 'date'],
    ['key' => 'time'], ['key' => 'location', 'type' => 'json'],
    ['key' => 'type'], ['key' => 'status'], ['key' => 'body', 'type' => 'json'],
  ]],
  'experts' => ['table' => 'experts', 'cols' => [
    ['key' => 'name', 'type' => 'json'], ['key' => 'role', 'type' => 'json'],
    ['key' => 'sub', 'type' => 'json'], ['key' => 'photo'],
    ['key' => 'bio', 'type' => 'json'], ['key' => 'expertise', 'type' => 'json'],
    ['key' => 'phone'], ['key' => 'email'], ['key' => 'url'], ['key' => 'hours'],
    // Qaysi sahifada ko'rinadi: 'Rahbariyat' -> rahbariyat.html,
    // boshqa har qanday qiymat (jumladan bo'sh) -> ekspertlar.html.
    ['key' => 'kind'],
    ['key' => 'order', 'col' => 'sort_order', 'type' => 'int'],
  ]],
  'publications' => ['table' => 'publications', 'cols' => [
    ['key' => 'title', 'type' => 'json'],
    // Qisqa (displey) sarlavha — banner va ro'yxat kartalarida ishlatiladi.
    // Bo'sh bo'lsa to'liq `title` ishlatiladi (Site.dispTitle qarang).
    ['key' => 'shortTitle', 'col' => 'short_title', 'type' => 'json'],
    ['key' => 'type'], ['key' => 'category'],
    ['key' => 'region'], ['key' => 'author'], ['key' => 'year'], ['key' => 'status'],
    ['key' => 'cover'], ['key' => 'pdf'], ['key' => 'desc', 'col' => 'descr', 'type' => 'json'],
  ]],
  'heroSlides' => ['table' => 'hero_slides', 'cols' => [
    ['key' => 'category', 'type' => 'json'], ['key' => 'headline', 'type' => 'json'],
    ['key' => 'link'], ['key' => 'image'], ['key' => 'status'],
    ['key' => 'order', 'col' => 'sort_order', 'type' => 'int'],
  ]],
  'partners' => ['table' => 'partners', 'cols' => [
    ['key' => 'name'], ['key' => 'url'], ['key' => 'logo'],
  ]],
  'pages' => ['table' => 'pages', 'cols' => [
    ['key' => 'title', 'type' => 'json'], ['key' => 'slug'],
    ['key' => 'body', 'type' => 'json'], ['key' => 'status'],
  ]],
  'media' => ['table' => 'media', 'cols' => [
    ['key' => 'type'], ['key' => 'url'], ['key' => 'title', 'type' => 'json'],
    ['key' => 'date', 'type' => 'date'], ['key' => 'photos', 'type' => 'json'],
    ['key' => 'cover'], ['key' => 'kind'], ['key' => 'name'], ['key' => 'thumb'],
  ]],
  'messages' => ['table' => 'messages', 'cols' => [
    ['key' => 'name'], ['key' => 'email'], ['key' => 'subject'],
    ['key' => 'text'], ['key' => 'date', 'type' => 'date'],
    ['key' => 'read', 'col' => 'is_read', 'type' => 'bool'],
  ]],
  'subscribers' => ['table' => 'subscribers', 'cols' => [
    ['key' => 'email'], ['key' => 'lang'], ['key' => 'status'],
    ['key' => 'source'], ['key' => 'date', 'type' => 'date'],
  ]],
];

// load() javobidagi collection tartibi (eski data.json bilan bir xil ko'rinish uchun)
$COLL_ORDER = ['users', 'news', 'mediaPosts', 'events', 'experts', 'publications', 'heroSlides', 'partners', 'pages', 'media', 'messages', 'subscribers'];

// Ommaviy 'load' javobida BO'SH qaytadigan bo'limlar — shaxsiy ma'lumot.
// Yangi shaxsiy bo'lim qo'shsangiz, uni shu yerga ham yozing.
$PRIVATE_COLLS = ['users', 'messages', 'subscribers'];

/* -------------------- Ulanish -------------------- */
function db() {
  static $pdo = null;
  if ($pdo !== null) return $pdo;
  global $DB_HOST, $DB_PORT, $DB_NAME, $DB_USER, $DB_PASS, $DB_CHARSET;

  // 1) Serverga ulanamiz (baza hali bo'lmasligi mumkin) va bazani yaratamiz
  $dsn0 = "mysql:host=$DB_HOST;port=$DB_PORT;charset=$DB_CHARSET";
  $opt = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
  ];
  $root = new PDO($dsn0, $DB_USER, $DB_PASS, $opt);
  $root->exec("CREATE DATABASE IF NOT EXISTS `$DB_NAME` CHARACTER SET $DB_CHARSET COLLATE {$DB_CHARSET}_unicode_ci");

  // 2) Bazaga ulanamiz
  $dsn = "mysql:host=$DB_HOST;port=$DB_PORT;dbname=$DB_NAME;charset=$DB_CHARSET";
  $pdo = new PDO($dsn, $DB_USER, $DB_PASS, $opt);
  provision($pdo);
  return $pdo;
}

/* -------------------- Jadvallarni yaratish (indekslar bilan) -------------------- */
function provision($pdo) {
  $c = "utf8mb4";
  $tail = " ENGINE=InnoDB DEFAULT CHARSET=$c COLLATE {$c}_unicode_ci";

  $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
    id TINYINT PRIMARY KEY DEFAULT 1,
    data LONGTEXT NOT NULL
  )$tail");

  $pdo->exec("CREATE TABLE IF NOT EXISTS auth (
    id TINYINT PRIMARY KEY DEFAULT 1,
    username VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255) NOT NULL DEFAULT ''
  )$tail");

  // seq = qo'shilish tartibi (auto-increment). ORDER BY seq DESC => eng yangisi birinchi (frontend unshift bilan mos)
  $seq = "seq BIGINT NOT NULL AUTO_INCREMENT, UNIQUE KEY seq_idx (seq)";

  $pdo->exec("CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(40) PRIMARY KEY,
    name VARCHAR(255), login VARCHAR(191), email VARCHAR(191),
    role VARCHAR(80), status VARCHAR(40), last VARCHAR(20),
    $seq, INDEX(status)
  )$tail");

  $pdo->exec("CREATE TABLE IF NOT EXISTS news (
    id VARCHAR(40) PRIMARY KEY,
    title LONGTEXT, category VARCHAR(120), date DATE NULL, status VARCHAR(40),
    cover VARCHAR(500), excerpt LONGTEXT, body LONGTEXT,
    region VARCHAR(120), author VARCHAR(191),
    $seq, INDEX(status), INDEX(date), INDEX(category)
  )$tail");

  $pdo->exec("CREATE TABLE IF NOT EXISTS media_posts (
    id VARCHAR(40) PRIMARY KEY,
    title LONGTEXT, excerpt LONGTEXT, body LONGTEXT,
    expert VARCHAR(191), outlet VARCHAR(191), source VARCHAR(500),
    category VARCHAR(120), date DATE NULL, cover VARCHAR(500), status VARCHAR(40),
    $seq, INDEX(status), INDEX(date), INDEX(outlet)
  )$tail");

  $pdo->exec("CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(40) PRIMARY KEY,
    title LONGTEXT, date DATE NULL, time VARCHAR(20), location LONGTEXT,
    type VARCHAR(120), status VARCHAR(40), body LONGTEXT,
    $seq, INDEX(status), INDEX(date)
  )$tail");

  $pdo->exec("CREATE TABLE IF NOT EXISTS experts (
    id VARCHAR(40) PRIMARY KEY,
    name LONGTEXT, role LONGTEXT, sub LONGTEXT, photo VARCHAR(500),
    bio LONGTEXT, expertise LONGTEXT,
    phone VARCHAR(80), email VARCHAR(191), url VARCHAR(500), hours VARCHAR(191),
    kind VARCHAR(40), sort_order INT DEFAULT 0,
    $seq, INDEX(sort_order), INDEX(kind)
  )$tail");

  $pdo->exec("CREATE TABLE IF NOT EXISTS publications (
    id VARCHAR(40) PRIMARY KEY,
    title LONGTEXT, short_title LONGTEXT, type VARCHAR(120), category VARCHAR(120), region VARCHAR(120),
    author VARCHAR(191), year VARCHAR(10), status VARCHAR(40),
    cover VARCHAR(500), pdf VARCHAR(500), descr LONGTEXT,
    $seq, INDEX(status), INDEX(category), INDEX(year)
  )$tail");

  $pdo->exec("CREATE TABLE IF NOT EXISTS hero_slides (
    id VARCHAR(40) PRIMARY KEY,
    category LONGTEXT, headline LONGTEXT, link VARCHAR(500), image VARCHAR(500),
    status VARCHAR(40), sort_order INT DEFAULT 0,
    $seq, INDEX(status), INDEX(sort_order)
  )$tail");

  $pdo->exec("CREATE TABLE IF NOT EXISTS partners (
    id VARCHAR(40) PRIMARY KEY,
    name VARCHAR(255), url VARCHAR(500), logo VARCHAR(500),
    $seq
  )$tail");

  $pdo->exec("CREATE TABLE IF NOT EXISTS pages (
    id VARCHAR(40) PRIMARY KEY,
    title LONGTEXT, slug VARCHAR(191), body LONGTEXT, status VARCHAR(40),
    $seq, INDEX(slug), INDEX(status)
  )$tail");

  $pdo->exec("CREATE TABLE IF NOT EXISTS media (
    id VARCHAR(40) PRIMARY KEY,
    type VARCHAR(40), url VARCHAR(500), title LONGTEXT, date DATE NULL,
    photos LONGTEXT, cover VARCHAR(500), kind VARCHAR(40),
    name VARCHAR(255), thumb VARCHAR(500),
    $seq, INDEX(type)
  )$tail");

  $pdo->exec("CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(40) PRIMARY KEY,
    name VARCHAR(255), email VARCHAR(191), subject VARCHAR(400),
    text LONGTEXT, date DATE NULL, is_read TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(is_read), INDEX(created_at)
  )$tail");

  // Obunachilar. email UNIQUE — bir odam ikki marta obuna bo'lsa yangi yozuv
  // yaratilmaydi (coll_upsert id bo'yicha ishlaydi, shuning uchun takrorni
  // api.php'dagi 'subscribe' amali email bo'yicha tekshiradi).
  $pdo->exec("CREATE TABLE IF NOT EXISTS subscribers (
    id VARCHAR(40) PRIMARY KEY,
    email VARCHAR(191) NOT NULL, lang VARCHAR(5), status VARCHAR(20) DEFAULT 'active',
    source VARCHAR(40), date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    $seq, UNIQUE KEY email_idx (email), INDEX(status)
  )$tail");

  $pdo->exec("CREATE TABLE IF NOT EXISTS views (
    k VARCHAR(120) PRIMARY KEY,
    cnt INT DEFAULT 0
  )$tail");

  $pdo->exec("CREATE TABLE IF NOT EXISTS login_attempts (
    ip VARCHAR(64) PRIMARY KEY,
    cnt INT DEFAULT 0, t INT DEFAULT 0, locked_until INT DEFAULT 0
  )$tail");

  $pdo->exec("CREATE TABLE IF NOT EXISTS msg_throttle (
    ip VARCHAR(64) PRIMARY KEY,
    hits LONGTEXT
  )$tail");

  $pdo->exec("CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(40), coll VARCHAR(40), item_id VARCHAR(40),
    ip VARCHAR(64), at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(at)
  )$tail");

  /* Diagnostika jurnali — brauzerdagi JS/tarmoq xatolari va serverdagi PHP
     xatolari. `fp` (fingerprint) bir xil xatoni takrorlab yozmaslik uchun:
     yangi hodisa kelganda `hits` oshiriladi, `last_at` yangilanadi. */
  $pdo->exec("CREATE TABLE IF NOT EXISTS error_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fp CHAR(32) NOT NULL,
    kind VARCHAR(20) NOT NULL,
    message VARCHAR(500) NOT NULL,
    source VARCHAR(300), line INT, col INT,
    stack TEXT, page VARCHAR(300), ua VARCHAR(300),
    cause VARCHAR(300),
    hits INT NOT NULL DEFAULT 1,
    resolved TINYINT(1) NOT NULL DEFAULT 0,
    first_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_fp (fp),
    INDEX(last_at), INDEX(kind), INDEX(resolved)
  )$tail");

  /* Push-bildirishnoma obunalari (brauzer). E-pochta EMAS — bu yerda shaxsiy
     ma'lumot saqlanmaydi: `endpoint` brauzer bergan anonim manzil, `p256dh`/`auth`
     esa shifrlash kalitlari. Kim ekanini aniqlab bo'lmaydi. */
  $pdo->exec("CREATE TABLE IF NOT EXISTS push_subs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    endpoint VARCHAR(500) NOT NULL,
    p256dh VARCHAR(200), auth VARCHAR(100),
    lang VARCHAR(5) DEFAULT 'uz',
    ua VARCHAR(200),
    fails INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ep (endpoint(191)),
    INDEX(created_at)
  )$tail");

  /* VAPID kalit jufti — server o'zini push xizmatiga tanitadi.
     Bir marta yasaladi va shu yerda qoladi (parol xeshi kabi, bazada). */
  $pdo->exec("CREATE TABLE IF NOT EXISTS push_vapid (
    id TINYINT PRIMARY KEY,
    public_key VARCHAR(200) NOT NULL,
    private_pem TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )$tail");

  migrate($pdo);
}

/* -------------------- Web Push: VAPID kalitlari --------------------
   Kalitlar bir marta yasaladi va bazada saqlanadi. Ochiq kalit brauzerga
   beriladi, maxfiy kalit HECH QACHON serverdan chiqmaydi. */
function vapid_keys($pdo) {
  $r = $pdo->query("SELECT public_key, private_pem FROM push_vapid WHERE id=1")->fetch();
  if ($r) return ['public' => $r['public_key'], 'pem' => $r['private_pem']];

  // XAMPP'da openssl.cnf yo'li sozlanmagan bo'lishi mumkin — mavjudini topamiz.
  $conf = null;
  foreach (['C:/xampp/apache/conf/openssl.cnf', 'C:/xampp/php/extras/openssl/openssl.cnf',
            '/etc/ssl/openssl.cnf', '/usr/lib/ssl/openssl.cnf'] as $c) {
    if (@is_file($c)) { $conf = $c; break; }
  }
  $args = ['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC];
  if ($conf) $args['config'] = $conf;

  $key = @openssl_pkey_new($args);
  if (!$key) return null;
  $det = openssl_pkey_get_details($key);
  if (empty($det['ec']['x']) || empty($det['ec']['y'])) return null;

  // Ochiq kalit push standarti talab qilgan siqilmagan (uncompressed) shaklda:
  // 0x04 || X(32) || Y(32), so'ng base64url.
  $pub = b64url_encode("\x04" . str_pad($det['ec']['x'], 32, "\0", STR_PAD_LEFT)
                             . str_pad($det['ec']['y'], 32, "\0", STR_PAD_LEFT));
  $pem = '';
  if ($conf) @openssl_pkey_export($key, $pem, null, ['config' => $conf]);
  else @openssl_pkey_export($key, $pem);
  if (!$pem) return null;

  $st = $pdo->prepare("INSERT INTO push_vapid (id, public_key, private_pem) VALUES (1,:p,:k)
                       ON DUPLICATE KEY UPDATE public_key=VALUES(public_key), private_pem=VALUES(private_pem)");
  $st->execute([':p' => $pub, ':k' => $pem]);
  return ['public' => $pub, 'pem' => $pem];
}

/* base64url — push standarti oddiy base64 emas, shu shaklni talab qiladi. */
function b64url_encode($b) { return rtrim(strtr(base64_encode($b), '+/', '-_'), '='); }

/* -------------------- Migratsiya --------------------
   CREATE TABLE IF NOT EXISTS mavjud jadvalga yangi ustun QO'SHMAYDI.
   Shuning uchun sxemaga ustun qo'shilganda uni shu yerda ham e'lon qiling —
   eski bazalar ham avtomatik yangilanadi.
--------------------------------------------------------------------------- */
function migrate($pdo) {
  ensure_cols($pdo, 'experts', [
    'expertise' => 'LONGTEXT',
    'phone'     => 'VARCHAR(80)',
    'email'     => 'VARCHAR(191)',
    'url'       => 'VARCHAR(500)',
    'hours'     => 'VARCHAR(191)',
    // Rahbariyat/Ekspertlar sahifalarga ajratish uchun (2026-08-06)
    'kind'      => 'VARCHAR(40)',
  ]);
  ensure_cols($pdo, 'publications', [
    'short_title' => 'LONGTEXT',
  ]);
}

// Jadvalda yo'q ustunlarni qo'shadi (bor bo'lsa tegmaydi)
function ensure_cols($pdo, $table, $defs) {
  $have = [];
  foreach ($pdo->query("SHOW COLUMNS FROM `$table`")->fetchAll() as $r) {
    $have[strtolower($r['Field'])] = true;
  }
  foreach ($defs as $col => $ddl) {
    if (isset($have[strtolower($col)])) continue;
    $pdo->exec("ALTER TABLE `$table` ADD COLUMN `$col` $ddl");
  }
}

/* -------------------- Qiymatlarni kodlash/dekodlash -------------------- */
// DB'dan o'qilgan xom qiymatni frontend kutgan turga o'giradi
function decode_val($type, $raw) {
  if ($raw === null) return ($type === 'json') ? null : (($type === 'bool') ? false : (($type === 'int') ? 0 : ''));
  switch ($type) {
    case 'json': $d = json_decode($raw, true); return $d;
    case 'bool': return (bool)((int)$raw);
    case 'int':  return (int)$raw;
    case 'date': return $raw ? substr((string)$raw, 0, 10) : '';
    default:     return (string)$raw;
  }
}
// Frontend qiymatini DB'ga yozish uchun tayyorlaydi
function encode_val($type, $v) {
  switch ($type) {
    case 'json': return ($v === null) ? null : json_encode($v, JSON_UNESCAPED_UNICODE);
    case 'bool': return !empty($v) ? 1 : 0;
    case 'int':  return (int)$v;
    case 'date': $s = is_string($v) ? substr($v, 0, 10) : ''; return preg_match('/^\d{4}-\d{2}-\d{2}$/', $s) ? $s : null;
    default:     return ($v === null) ? '' : (string)$v;
  }
}

/* -------------------- Bitta collection'ni o'qish -------------------- */
function coll_load($pdo, $coll) {
  global $SCHEMA;
  if (!isset($SCHEMA[$coll])) return [];
  $t = $SCHEMA[$coll]['table'];
  if ($coll === 'experts' || $coll === 'heroSlides') $order = ' ORDER BY sort_order ASC, seq DESC';
  elseif ($coll === 'messages') $order = ' ORDER BY created_at DESC';
  else $order = ' ORDER BY seq DESC'; // eng yangi qo'shilgani birinchi
  $rows = $pdo->query("SELECT * FROM `$t`$order")->fetchAll();
  $out = [];
  foreach ($rows as $r) $out[] = row_to_item($coll, $r);
  return $out;
}

/* Bazadagi satrni klient kutadigan yozuvga o'giradi.
   coll_load() va coll_find() ikkalasi ham shu funksiyani ishlatadi — mantiq
   bitta joyda turishi uchun. */
function row_to_item($coll, $r) {
  global $SCHEMA;
  $item = ['id' => $r['id']];
  foreach ($SCHEMA[$coll]['cols'] as $c) {
    $col = isset($c['col']) ? $c['col'] : $c['key'];
    $type = isset($c['type']) ? $c['type'] : 'str';
    $val = array_key_exists($col, $r) ? $r[$col] : null;
    $dec = decode_val($type, $val);
    // json bo'sh bo'lsa (null) — kalitni tushirib qoldiramiz (eski sparse ko'rinish)
    if ($type === 'json' && $dec === null) continue;
    $item[$c['key']] = $dec;
  }
  return $item;
}

/* Bitta yozuvni id bo'yicha TO'LIQ qaytaradi (og'ir maydonlar qisqartirilmaydi).
   `action=item` endpointi shuni ishlatadi. */
function coll_find($pdo, $coll, $id) {
  global $SCHEMA;
  if (!isset($SCHEMA[$coll])) return null;
  $t = $SCHEMA[$coll]['table'];
  $st = $pdo->prepare("SELECT * FROM `$t` WHERE id = :id LIMIT 1");
  $st->execute([':id' => (string)$id]);
  $r = $st->fetch();
  return $r ? row_to_item($coll, $r) : null;
}

/* -------------------- Bitta yozuvni upsert qilish -------------------- */
function coll_upsert($pdo, $coll, $item) {
  global $SCHEMA;
  if (!isset($SCHEMA[$coll])) return false;
  $t = $SCHEMA[$coll]['table'];
  if (empty($item['id'])) $item['id'] = uidgen();

  $colNames = ['id'];
  $place = [':id'];
  $params = [':id' => (string)$item['id']];
  $updates = [];
  foreach ($SCHEMA[$coll]['cols'] as $c) {
    $col = isset($c['col']) ? $c['col'] : $c['key'];
    $type = isset($c['type']) ? $c['type'] : 'str';
    $val = array_key_exists($c['key'], $item) ? $item[$c['key']] : null;
    $colNames[] = "`$col`";
    $place[] = ":$col";
    $params[":$col"] = encode_val($type, $val);
    $updates[] = "`$col`=VALUES(`$col`)";
  }
  $sql = "INSERT INTO `$t` (" . implode(',', $colNames) . ") VALUES (" . implode(',', $place) . ") "
       . "ON DUPLICATE KEY UPDATE " . implode(',', $updates);
  $st = $pdo->prepare($sql);
  $st->execute($params);
  cache_invalidate(); // kontent o'zgardi — ommaviy javob qaytadan yasalsin
  return $item;
}

/* -------------------- Bitta yozuvni o'chirish -------------------- */
function coll_delete($pdo, $coll, $id) {
  global $SCHEMA;
  if (!isset($SCHEMA[$coll])) return false;
  $t = $SCHEMA[$coll]['table'];
  $st = $pdo->prepare("DELETE FROM `$t` WHERE id = :id");
  $st->execute([':id' => (string)$id]);
  cache_invalidate();
  return true;
}

/* -------------------- Bitta collection'ni to'liq almashtirish (tranzaksiya ichida chaqiriladi) -------------------- */
function coll_replace($pdo, $coll, $items) {
  global $SCHEMA;
  if (!isset($SCHEMA[$coll])) return;
  $t = $SCHEMA[$coll]['table'];
  $pdo->exec("DELETE FROM `$t`");
  if (!is_array($items)) return;
  // Teskari tartibda kiritamiz: massivning [0]-elementi eng katta seq'ni oladi,
  // shunda coll_load (ORDER BY seq DESC) massiv tartibini aynan saqlaydi.
  foreach (array_reverse(array_values($items)) as $it) { if (is_array($it)) coll_upsert($pdo, $coll, $it); }
}

/* -------------------- Settings -------------------- */
function settings_load($pdo) {
  $r = $pdo->query("SELECT data FROM settings WHERE id=1")->fetch();
  if (!$r) return null;
  return json_decode($r['data'], true);
}
function settings_save($pdo, $obj) {
  $st = $pdo->prepare("INSERT INTO settings (id, data) VALUES (1, :d) ON DUPLICATE KEY UPDATE data=VALUES(data)");
  $st->execute([':d' => json_encode($obj, JSON_UNESCAPED_UNICODE)]);
  cache_invalidate(); // sozlamalar ommaviy javobda ham bor
}

/* -------------------- Auth -------------------- */
function auth_load($pdo) {
  $r = $pdo->query("SELECT username, password_hash FROM auth WHERE id=1")->fetch();
  return $r ?: null;
}
function auth_save($pdo, $username, $hash) {
  $st = $pdo->prepare("INSERT INTO auth (id, username, password_hash) VALUES (1, :u, :h)
                       ON DUPLICATE KEY UPDATE username=VALUES(username), password_hash=VALUES(password_hash)");
  $st->execute([':u' => $username, ':h' => $hash]);
}

/* -------------------- Butun bazani o'qish (frontend uchun to'liq obyekt) -------------------- */
// $private = TRUE faqat tizimga kirgan admin uchun (api.php sessiyani tekshiradi).
//
// XAVFSIZLIK: 'load' ommaviy endpoint — sayt kontentini shu orqali oladi.
// Shaxsiy bo'limlar (fuqaro murojaatlari, obunachilar e-pochtasi, admin
// foydalanuvchilar) ommaviy chaqiruvda BO'SH qaytadi. Kalitning o'zi qoladi,
// chunki admin-store.js ensureShape() yo'q kalitni "buzuq" deb hisoblab,
// serverga qayta yozishga urinadi.
/* Og'ir maydonlar: ommaviy `load` javobiga TO'LIQ holda tushmaydi.
   Format: 'kolleksiya' => ['maydon', ...].

   NEGA: nashrning `desc` maydoni Word'dan joylashtirilgan matn bo'lib, uch tilda
   ~190 KB joy oladi. 7 ta nashrda bu 1.3 MB — va u HAR BIR sahifada, hatto
   "Aloqa" sahifasida ham yuklanardi. Kontent o'sgani sayin javob chiziqli
   o'sadi: 150 ta nashrda ~28 MB bo'lardi va sayt amalda ishlamay qolardi.

   To'liq matn faqat bitta joyda kerak — `nashr.html?id=X`. U endi uni alohida
   `action=item` so'rovi bilan oladi. */
$HEAVY_FIELDS = ['publications' => ['desc']];

/* Og'ir maydonni qidiruv uchun soddalashtiradi: HTML teglari olib tashlanadi va
   uzunligi cheklanadi. Bu qidiruvni BUZMAYDI, aksincha yaxshilaydi — ilgari
   indeksda `<span style=...>` kabi markup ham bor edi va "style" so'zini
   qidirsangiz matnga aloqasi yo'q natijalar chiqardi. */
function slim_text($v, $maxPerLang = 6000) {
  $one = function ($s) use ($maxPerLang) {
    $t = strip_tags((string)$s);
    $t = html_entity_decode($t, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $t = preg_replace('/\s+/u', ' ', $t);
    $t = trim($t);
    return mb_substr($t, 0, $maxPerLang);
  };
  if (is_array($v)) { $o = []; foreach ($v as $lang => $s) $o[$lang] = $one($s); return $o; }
  return $one($v);
}

/* -------------------- Ommaviy javob keshi --------------------
   `load` javobini yig'ish ~43 ms oladi (baza o'qish + JSON dekodlash +
   `slim_text`). Bu HAR BIR sahifa ochilishida takrorlanardi va serverning
   asosiy to'sig'i edi.

   Kontent faqat admin yozganda o'zgaradi, ya'ni javobni bir marta yasab,
   keyingi so'rovlarga tayyor faylni berish mumkin. Natija: ~43 ms -> ~0.1 ms.

   MUHIM: kesh FAQAT ommaviy (autentifikatsiyasiz) javob uchun. Admin panel
   to'liq ma'lumot oladi va keshdan O'QIMAYDI — aks holda tahrirdan keyin eski
   holatni ko'rib qolardi.

   Kesh fayli `.json` kengaytmasi bilan — u `.htaccess` orqali tashqaridan
   allaqachon 403 qaytaradi. */
function cache_file() { return __DIR__ . '/cache_public.json'; }

/* Kontent o'zgarganda chaqiriladi — keyingi so'rov javobni qaytadan yasaydi. */
function cache_invalidate() { @unlink(cache_file()); }

/* Ommaviy javobni keshdan qaytaradi. Kesh yo'q bo'lsa — yasaydi va saqlaydi. */
function db_load_public_cached($pdo) {
  $f = cache_file();
  $hit = @file_get_contents($f);
  // Yengil yaxlitlik tekshiruvi: kesh fayli bo'sh emas, lekin buzuq (yarim
  // yozilgan yoki qo'lda buzilgan) bo'lsa uni tarqatmaymiz. To'liq json_decode
  // keshning tezlik afzalligini yo'qqa chiqaradi (~43 ms), shuning uchun faqat
  // JSON obyektining chegara belgilarini tekshiramiz: '{' bilan boshlanib '}'
  // bilan tugashi shart. Buzuq bo'lsa — pastda qaytadan yasaladi.
  if ($hit !== false && $hit !== '') {
    $trim = trim($hit);
    if ($trim !== '' && $trim[0] === '{' && substr($trim, -1) === '}') return $hit;
    @unlink($f); // buzuq keshni tozalaymiz — keyingi so'rov toza yasaydi
  }
  $json = json_encode(db_load_all($pdo, false), JSON_UNESCAPED_UNICODE);
  // Atomik yozish: yarim yozilgan fayl o'qilib qolmasin (bir vaqtda ikki so'rov).
  $tmp = $f . '.' . getmypid() . '.tmp';
  if (@file_put_contents($tmp, $json, LOCK_EX) !== false) {
    if (!@rename($tmp, $f)) @unlink($tmp);
  }
  return $json;
}

function db_load_all($pdo, $private = false) {
  global $COLL_ORDER, $PRIVATE_COLLS, $HEAVY_FIELDS;
  $out = [];
  $s = settings_load($pdo);
  if ($s !== null) $out['settings'] = $s;
  $a = auth_load($pdo);
  // Parol xeshi HECH QACHON clientga chiqmaydi. Admin login nomi ham faqat
  // kirgandan keyin — aks holda u brute-force uchun tayyor yarim ma'lumot.
  $out['auth'] = ['username' => ($private && $a) ? $a['username'] : ''];
  foreach ($COLL_ORDER as $coll) {
    if (!$private && in_array($coll, $PRIVATE_COLLS, true)) { $out[$coll] = []; continue; }
    $items = coll_load($pdo, $coll);
    // Admin panelga TO'LIQ ma'lumot kerak (tahrirlash uchun) — faqat ommaviy
    // javobda soddalashtiramiz.
    if (!$private && isset($HEAVY_FIELDS[$coll])) {
      foreach ($items as &$it) {
        foreach ($HEAVY_FIELDS[$coll] as $f) {
          if (isset($it[$f])) $it[$f] = slim_text($it[$f]);
        }
      }
      unset($it);
    }
    $out[$coll] = $items;
  }
  return $out;
}

/* -------------------- id generatori (client uid uslubi) -------------------- */
function uidgen() {
  return base_convert((string)mt_rand(1, PHP_INT_MAX), 10, 36) . base_convert((string)mt_rand(1, 0x7fffffff), 10, 36);
}

/* -------------------- Bazada hech narsa yo'qmi? (birinchi ishga tushirish) -------------------- */
function db_is_empty($pdo) {
  $n = (int)$pdo->query("SELECT COUNT(*) c FROM auth")->fetch()['c'];
  $s = (int)$pdo->query("SELECT COUNT(*) c FROM settings")->fetch()['c'];
  return ($n === 0 && $s === 0);
}

/* -------------------- To'liq db massivini bazaga import qilish (tranzaksiya) --------------------
   $db = eski data.json ko'rinishidagi massiv (settings, auth, users, news, ...).
   Collection'lar to'liq almashtiriladi. Auth xeshi saqlanadi. */
function db_import($pdo, $db) {
  global $COLL_ORDER;
  if (!is_array($db)) return false;
  $pdo->beginTransaction();
  try {
    // settings
    if (isset($db['settings']) && is_array($db['settings'])) settings_save($pdo, $db['settings']);

    // auth — xesh yoki oddiy parol yoki bo'sh
    $username = 'markaz_admini';
    $hash = '';
    if (isset($db['auth']) && is_array($db['auth'])) {
      $a = $db['auth'];
      if (!empty($a['username'])) $username = $a['username'];
      if (!empty($a['passwordHash'])) $hash = $a['passwordHash'];
      elseif (!empty($a['password'])) $hash = password_hash((string)$a['password'], PASSWORD_DEFAULT);
    }
    auth_save($pdo, $username, $hash);

    // collection'lar
    foreach ($COLL_ORDER as $coll) {
      if (isset($db[$coll]) && is_array($db[$coll])) coll_replace($pdo, $coll, $db[$coll]);
    }
    $pdo->commit();
    return true;
  } catch (Exception $e) {
    $pdo->rollBack();
    return false;
  }
}

/* -------------------- Birinchi ishga tushirish: data.json'dan yoki standart seed'dan to'ldirish -------------------- */
function db_bootstrap_if_empty($pdo) {
  if (!db_is_empty($pdo)) return;
  $jsonFile = __DIR__ . '/data.json';
  $db = null;
  if (file_exists($jsonFile)) {
    $raw = file_get_contents($jsonFile);
    $db = json_decode($raw, true);
  }
  if (!is_array($db)) {
    require_once __DIR__ . '/seed.php';
    $db = default_seed();
  }
  db_import($pdo, $db);
}
