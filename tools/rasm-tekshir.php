<?php
/* ============================================================
   TSTM - RASM VA HUJJATLAR YAXLITLIGINI TEKSHIRISH
   ------------------------------------------------------------
   Savolga javob beradi: QAYSI RASM QAYERDA ISHLATILADI?

   Ilgari `uploads\` papkasida 33 ta fayl `img_20260727_083521_
   c98afb9b.jpg` ko'rinishida yotardi va ularning qaysi biri
   qaysi ekspertga yoki nashrga tegishli ekanini bilib bo'lmasdi.

   NIMA QILADI
     1) Bazadagi HAR BIR `uploads/...` havolasini topadi
        (oddiy ustunlar ham, JSON ichidagilari ham - slayder
        rasmlari, sozlamalardagi logotip va bannerlar)
     2) Har bir havola uchun: qaysi jadval, qaysi yozuv, qaysi
        maydon va yozuvning SARLAVHASI
     3) Buzuq havolalar (baza ko'rsatadi, disk yo'q)
     4) Yetim fayllar (diskda bor, hech kim ishlatmaydi)

   ISHLATISH
     runtime\php\php.exe tools\rasm-tekshir.php
     runtime\php\php.exe tools\rasm-tekshir.php --nomla
        ^ fayllarni MAZMUNLI nomga o'zgartiradi va baza
          havolalarini AYNI paytda yangilaydi (tranzaksiyada).

   Chiqish kodi: 0 = hammasi joyida, 1 = muammo topildi (CI uchun).
   ============================================================ */

// Bu skript FAQAT buyruq qatoridan ishlaydi. Veb orqali chaqirilsa
// baza tarkibini oshkor qilib qo'yardi.
if (PHP_SAPI !== 'cli') { http_response_code(403); exit('CLI only'); }

$ildiz = dirname(__DIR__);
require $ildiz . '/db.php';

$nomla = in_array('--nomla', $argv, true);

/* -------------------- Baza ulanishi -------------------- */
$pdo = db();

/* -------------------- Barcha matn ustunlarini topish --------------------
   Ustunlarni QO'LDA sanab chiqmaymiz: yangi maydon qo'shilganda ro'yxatni
   yangilash unutiladi va tekshiruv jimgina to'liqsiz bo'lib qoladi.
   Buning o'rniga bazadan barcha matn ustunlarini so'raymiz va ularning
   ichidan `uploads/...` naqshini qidiramiz. JSON ustunlar ham shu yo'l
   bilan qamrab olinadi.                                                  */
$dbNomi = $pdo->query('SELECT DATABASE()')->fetchColumn();
$ustunlar = $pdo->prepare(
  "SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = :d
      AND data_type IN ('varchar','text','mediumtext','longtext','json','char')
    ORDER BY table_name, ordinal_position"
);
$ustunlar->execute([':d' => $dbNomi]);

/* Yozuvning "insonga tushunarli" nomi qaysi ustunda turishi mumkin.
   Ko'p ustunlar ko'p tilli JSON: {"uz":"...","ru":"..."}. */
$NOM_USTUNLARI = ['title', 'name', 'headline', 'shortTitle', 'short_title'];

function insonNomi($qiymat) {
  if ($qiymat === null || $qiymat === '') return '';
  $j = json_decode($qiymat, true);
  if (is_array($j)) {
    foreach (['uz', 'ru', 'en'] as $t) {
      if (!empty($j[$t]) && is_string($j[$t])) return $j[$t];
    }
    return '';
  }
  return (string)$qiymat;
}

/* -------------------- Havolalarni yig'ish -------------------- */
$havolalar = [];   // fayl nomi => [ ['jadval'=>..,'id'=>..,'ustun'=>..,'nom'=>..], ... ]
$jadvalUstun = []; // jadval => [ustunlar]

foreach ($ustunlar as $u) {
  $jadvalUstun[$u['table_name']][] = $u['column_name'];
}

foreach ($jadvalUstun as $jadval => $ustunRoyxati) {
  // `id` ustuni bormi (yozuvni ko'rsatish uchun)
  $idBor = in_array('id', array_map('strtolower', $ustunRoyxati), true);
  try {
    $qatorlar = $pdo->query("SELECT * FROM `$jadval`")->fetchAll(PDO::FETCH_ASSOC);
  } catch (Throwable $e) { continue; }

  foreach ($qatorlar as $q) {
    // Yozuvning nomi (sarlavhasi)
    $nom = '';
    foreach ($NOM_USTUNLARI as $nu) {
      if (isset($q[$nu])) { $nom = insonNomi($q[$nu]); if ($nom !== '') break; }
    }
    $id = $idBor && isset($q['id']) ? (string)$q['id'] : '-';

    foreach ($ustunRoyxati as $ust) {
      if (!isset($q[$ust]) || !is_string($q[$ust]) || $q[$ust] === '') continue;
      // JSON ichida yo'l `uploads\/x.jpg` ko'rinishida qochirilgan bo'lishi mumkin.
      $matn = str_replace('\\/', '/', $q[$ust]);
      if (preg_match_all('~uploads/([A-Za-z0-9._-]+)~', $matn, $mm)) {
        foreach (array_unique($mm[1]) as $fayl) {
          $havolalar[$fayl][] = [
            'jadval' => $jadval, 'id' => $id, 'ustun' => $ust, 'nom' => $nom,
          ];
        }
      }
    }
  }
}

/* -------------------- Diskdagi fayllar -------------------- */
$uploadsDir = $ildiz . '/uploads';
$diskda = [];
foreach (scandir($uploadsDir) ?: [] as $f) {
  if ($f === '.' || $f === '..' || $f === '.htaccess') continue;
  if (is_file($uploadsDir . '/' . $f)) $diskda[$f] = filesize($uploadsDir . '/' . $f);
}

/* -------------------- Hisobot -------------------- */
function sarlavha($s) { echo "\n" . $s . "\n" . str_repeat('=', 66) . "\n"; }

$buzuq = [];   // bazada bor, diskda yo'q
$yetim = [];   // diskda bor, bazada yo'q

foreach ($havolalar as $fayl => $_) if (!isset($diskda[$fayl])) $buzuq[] = $fayl;
foreach ($diskda as $fayl => $_) if (!isset($havolalar[$fayl])) $yetim[] = $fayl;

sarlavha('QAYSI FAYL QAYERDA ISHLATILADI');
if (!$havolalar) {
  echo "  (bazada birorta ham uploads havolasi yo'q)\n";
} else {
  ksort($havolalar);
  foreach ($havolalar as $fayl => $joylar) {
    $bor = isset($diskda[$fayl]);
    $kb  = $bor ? round($diskda[$fayl] / 1024) . ' KB' : 'DISKDA YO`Q';
    printf("  %-46s %s\n", $fayl, $kb);
    foreach ($joylar as $j) {
      $nom = $j['nom'] !== '' ? ' "' . mb_substr($j['nom'], 0, 46) . '"' : '';
      printf("      -> %s.%s  [%s]%s\n", $j['jadval'], $j['ustun'], $j['id'], $nom);
    }
  }
}

sarlavha('BUZUQ HAVOLALAR (baza ko`rsatadi, fayl yo`q -> rasm ko`rinmaydi)');
if (!$buzuq) echo "  yo`q - hamma havola joyida\n";
else foreach ($buzuq as $f) {
  echo "  $f\n";
  foreach ($havolalar[$f] as $j) printf("      -> %s.%s [%s]\n", $j['jadval'], $j['ustun'], $j['id']);
}

sarlavha('YETIM FAYLLAR (diskda bor, hech kim ishlatmaydi)');
if (!$yetim) echo "  yo`q\n";
else {
  $jami = 0;
  foreach ($yetim as $f) { $jami += $diskda[$f]; printf("  %-46s %s KB\n", $f, round($diskda[$f] / 1024)); }
  printf("  --- %d ta fayl, jami %s KB ---\n", count($yetim), round($jami / 1024));
  echo "  Bular eski yuklamalar bo`lishi mumkin. O`chirishdan oldin\n";
  echo "  ko`zdan kechiring - avtomatik O`CHIRILMAYDI.\n";
}

/* -------------------- Qayta nomlash -------------------- */
if ($nomla) {
  sarlavha('MAZMUNLI NOMGA O`ZGARTIRISH');
  $ozgardi = 0; $otkazildi = 0;

  foreach ($havolalar as $fayl => $joylar) {
    if (!isset($diskda[$fayl])) { $otkazildi++; continue; }

    /* Bitta fayl BIR NECHTA turli yozuvda ishlatilishi mumkin (masalan
       bitta surat ham nashr muqovasi, ham albom rasmi). Bunday faylni
       bitta yozuvning sarlavhasi bilan atash YANGLISH bo'ladi - nom
       qolgan yozuvlarga to'g'ri kelmaydi va chalkashlik faqat ortadi.
       Shuning uchun faqat YAGONA egasi bor fayllar qayta nomlanadi. */
    $egalar = [];
    foreach ($joylar as $j) { $egalar[$j['jadval'] . ':' . $j['id']] = true; }
    if (count($egalar) > 1) {
      printf("  [BO`LINGAN] %-38s %d ta yozuvda - nomlanmadi\n", $fayl, count($egalar));
      $otkazildi++;
      continue;
    }

    // Nom manbasi: yozuvning sarlavhasi. Bo'sh bo'lsa - jadval nomi.
    $manba = '';
    foreach ($joylar as $j) { if ($j['nom'] !== '') { $manba = $j['nom']; break; } }
    if ($manba === '') $manba = $joylar[0]['jadval'];

    $ext = strtolower(pathinfo($fayl, PATHINFO_EXTENSION));
    // Asl nomdagi sana va tasodifiy qismni SAQLAYMIZ: fayl yagona
    // bo'lib qolsin va eski zaxiralar bilan bog'lash mumkin bo'lsin.
    $quyruq = '';
    if (preg_match('~(\d{8}_\d{6}_[0-9a-f]{8})~', $fayl, $m)) $quyruq = $m[1];
    else $quyruq = date('Ymd_His') . '_' . substr(md5($fayl), 0, 8);

    $yangi = slugla($manba) . '_' . $quyruq . '.' . $ext;
    if ($yangi === $fayl) { $otkazildi++; continue; }
    if (isset($diskda[$yangi])) { echo "  [O`TKAZILDI] $yangi allaqachon bor\n"; $otkazildi++; continue; }

    // Avval BAZA (tranzaksiyada), keyin disk. Agar baza yiqilsa fayl
    // tegilmagan qoladi; agar disk yiqilsa bazani qaytaramiz.
    $pdo->beginTransaction();
    try {
      foreach ($joylar as $j) {
        $st = $pdo->prepare(
          "UPDATE `{$j['jadval']}` SET `{$j['ustun']}` = REPLACE(`{$j['ustun']}`, :eski, :yangi)
            WHERE `{$j['ustun']}` LIKE :naqsh"
        );
        $st->execute([':eski' => $fayl, ':yangi' => $yangi, ':naqsh' => '%' . $fayl . '%']);
      }
      if (!rename($uploadsDir . '/' . $fayl, $uploadsDir . '/' . $yangi)) {
        throw new RuntimeException('faylni qayta nomlab bo`lmadi');
      }
      $pdo->commit();
      printf("  %-44s -> %s\n", $fayl, $yangi);
      $ozgardi++;
    } catch (Throwable $e) {
      $pdo->rollBack();
      echo "  [XATO] $fayl : " . $e->getMessage() . "\n";
    }
  }
  echo "\n  $ozgardi ta fayl qayta nomlandi, $otkazildi ta o`tkazib yuborildi.\n";
  if ($ozgardi) {
    echo "\n  Endi kontentni git uchun yangilang:\n";
    echo "     powershell -File tools\\kontent-eksport.ps1\n";
  }
}

/* -------------------- Xulosa -------------------- */
sarlavha('XULOSA');
printf("  bazadagi havola : %d ta\n", count($havolalar));
printf("  diskdagi fayl   : %d ta\n", count($diskda));
printf("  buzuq havola    : %d ta\n", count($buzuq));
printf("  yetim fayl      : %d ta\n", count($yetim));
echo "\n";

exit(count($buzuq) > 0 ? 1 : 0);
