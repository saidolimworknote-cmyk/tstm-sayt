<?php
/* ============================================================
   TSTM — standart boshlang'ich kontent (seed)
   Bo'sh bazani to'ldirishning YAGONA yo'li (2026-08-07 dan; ilgari
   data.json dan import ham bor edi). Auth paroli bo'sh qoladi — birinchi
   kirish config.php dagi `admin_bootstrap_password` orqali bo'ladi va
   o'sha zahoti bcrypt bilan xeshlanib saqlanadi. U bo'sh bo'lsa
   parolsiz kirish MUMKIN EMAS (qarang: config.sample.php).
   ============================================================ */
function default_seed() {
  $ml = function ($uz, $ru = '', $en = '') { return ['uz' => $uz, 'ru' => $ru, 'en' => $en]; };
  $p = function ($s) { return '<p>' . $s . '</p>'; };
  return [
    'settings' => [
      'siteName' => $ml(
        'Tashqi siyosiy tadqiqotlar va xalqaro tashabbuslar markazi',
        'Центр внешнеполитических исследований и международных инициатив',
        'Center for Foreign Policy Research and International Initiatives'
      ),
      'shortName' => 'TSTM',
      'address' => $ml("Mahmudjon G'ofurov ko'chasi, Toshkent", 'ул. Махмуджона Гофурова, Ташкент', 'Mahmudjon Gofurov St., Tashkent'),
      'email' => 'info@markaz.uz',
      'phone' => '+998 71 000 00 00',
      'social' => ['telegram' => 'https://t.me/', 'youtube' => '#', 'facebook' => '#', 'x' => '#'],
      'langs' => ['uz' => true, 'ru' => true, 'en' => true],
      'theme' => 'light',
      'logo' => '',
      'logos' => ['uz' => '', 'ru' => '', 'en' => ''],
      'banners' => [],
      'stats' => [
        ['n' => '300+', 'c' => $ml('Tadqiqot va hisobot', 'Исследований и отчётов', 'Studies & reports')],
        ['n' => '45', 'c' => $ml('Ekspert va tahlilchi', 'Экспертов и аналитиков', 'Experts & analysts')],
        ['n' => '60', 'c' => $ml('Xalqaro hamkor', 'Международных партнёров', 'International partners')],
        ['n' => '32', 'c' => $ml('Yillik tajriba', 'Года опыта', 'Years of experience')],
      ],
    ],
    'auth' => ['username' => 'markaz_admini', 'password' => ''],
    'users' => [
      ['id' => uidgen(), 'name' => 'Bosh administrator', 'login' => 'markaz_admini', 'email' => 'admin@markaz.uz', 'role' => 'Administrator', 'status' => 'active', 'last' => '2026-06-13'],
    ],
    'news' => [
      ['id' => uidgen(), 'title' => $ml('Markaz ekspertlari Markaziy Osiyo bo\'yicha xalqaro forumda ma\'ruza qildi', 'Эксперты центра выступили на международном форуме по Центральной Азии', ''), 'category' => 'Diplomatiya', 'date' => '2026-06-13', 'status' => 'published', 'cover' => '', 'excerpt' => $ml('Forum doirasida mintaqaviy hamkorlik masalalari muhokama qilindi.'), 'body' => $ml($p('Forum doirasida mintaqaviy hamkorlik masalalari muhokama qilindi.'))],
      ['id' => uidgen(), 'title' => $ml('Yangi hisobot: mintaqaviy savdo-iqtisodiy aloqalar dinamikasi'), 'category' => 'Tahlil', 'date' => '2026-06-12', 'status' => 'published', 'cover' => '', 'excerpt' => $ml(''), 'body' => $ml($p('Mintaqaviy savdo-iqtisodiy aloqalar dinamikasi tahlili.'))],
    ],
    'events' => [
      ['id' => uidgen(), 'title' => $ml('Markaziy Osiyo xavfsizligi bo\'yicha xalqaro konferensiya'), 'date' => '2026-06-24', 'time' => '10:00', 'location' => $ml('Toshkent'), 'type' => 'Konferensiya', 'status' => 'published', 'body' => $ml($p('Xalqaro konferensiya.'))],
    ],
    'experts' => [
      ['id' => uidgen(), 'name' => $ml('Bobur Rahimov'), 'role' => $ml('Direktor'), 'sub' => $ml('Siyosiy fanlar doktori'), 'photo' => '', 'bio' => $ml(''), 'order' => 1],
      ['id' => uidgen(), 'name' => $ml('Nodira Yusupova'), 'role' => $ml('Direktor o\'rinbosari'), 'sub' => $ml('Xalqaro munosabatlar bo\'yicha'), 'photo' => '', 'bio' => $ml(''), 'order' => 2],
    ],
    'publications' => [
      ['id' => uidgen(), 'title' => $ml('Markaziy Osiyoda yangi diplomatik arxitektura'), 'type' => 'Hisobot', 'category' => 'Tashqi siyosat', 'region' => 'Markaziy Osiyo', 'author' => 'Bobur Rahimov', 'year' => '2026', 'status' => 'published', 'cover' => '', 'pdf' => '', 'desc' => $ml('')],
    ],
    'heroSlides' => [
      ['id' => uidgen(), 'category' => $ml('Tahlil'), 'headline' => $ml('Markaziy Osiyo xavfsizligi va yangi diplomatik istiqbollar'), 'link' => '#', 'image' => '', 'status' => 'published', 'order' => 1],
    ],
    'partners' => [
      ['id' => uidgen(), 'name' => 'BMT Mintaqaviy markazi', 'url' => '#', 'logo' => ''],
      ['id' => uidgen(), 'name' => 'OSCE', 'url' => '#', 'logo' => ''],
    ],
    'pages' => [
      ['id' => uidgen(), 'title' => $ml('Markaz haqida', 'О центре', 'About'), 'slug' => 'markaz-haqida', 'body' => $ml($p('Markaz mustaqil tahliliy muassasa.')), 'status' => 'published'],
      ['id' => uidgen(), 'title' => $ml('Maqsad va vazifalar', 'Цели и задачи', 'Mission'), 'slug' => 'maqsad', 'body' => $ml($p('Dalillarga asoslangan tahlil.')), 'status' => 'published'],
    ],
    'media' => [
      ['id' => uidgen(), 'type' => 'video', 'url' => 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'title' => $ml('Markaz faoliyati haqida qisqacha', 'Кратко о деятельности центра', 'About the center'), 'date' => '2026-06-10'],
    ],
    'messages' => [],
  ];
}
