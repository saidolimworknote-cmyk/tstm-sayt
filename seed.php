<?php
/* ============================================================
   TSTM — standart boshlang'ich kontent (seed)
   Bo'sh bazani to'ldirishning YAGONA yo'li (2026-08-07 dan; ilgari
   data.json dan import ham bor edi). Auth paroli bo'sh qoladi — birinchi
   kirish config.php dagi `admin_bootstrap_password` orqali bo'ladi va
   o'sha zahoti bcrypt bilan xeshlanib saqlanadi. U bo'sh bo'lsa
   parolsiz kirish MUMKIN EMAS (qarang: config.sample.php).
   ============================================================ */
/* Sozlamalarning standart qiymatlari — ALOHIDA funksiya, chunki ular bo'sh
   bazani to'ldirishdan tashqari YANA bir joyda kerak: db.php dagi
   settings_load() saqlangan sozlamalarni shu standartlar USTIGA qo'yadi.
   Aks holda eski bazaga keyin qo'shilgan kalit (masalan 'workHours')
   umuman yetib bormasdi va admin panelda bo'sh maydon ko'rinardi. */
function default_settings() {
  $ml = function ($uz, $ru = '', $en = '') { return ['uz' => $uz, 'ru' => $ru, 'en' => $en]; };
  return [
      /* RU/EN qo'lda tasdiqlangan (2026-08-12) — avtomatik tarjimaga
         ISHONILMAYDI: header/footerdagi brend nomi shu matndan ikki
         muvozanatli qatorga bo'linadi (page-home.js/site-common.js
         brandLines()), shuning uchun so'zma-so'z aniq bo'lishi shart. */
      'siteName' => $ml(
        'Tashqi siyosiy tadqiqotlar va xalqaro tashabbuslar markazi',
        'Центр Внешнеполитических Исследований',
        'Center for Foreign Policy Studies'
      ),
      'shortName' => 'TSTM',
      'address' => $ml("Mahmudjon G'ofurov ko'chasi, Toshkent", 'ул. Махмуджона Гофурова, Ташкент', 'Mahmudjon Gofurov St., Tashkent'),
      'email' => 'info@cfps.uz',
      'phone' => '+998 71 239 36 55',
      'social' => ['telegram' => 'https://t.me/', 'youtube' => '#', 'facebook' => '#', 'x' => '#', 'instagram' => '', 'linkedin' => ''],
      // Aloqa sahifasidagi "Ish vaqti" qatori. Ilgari i18n.js ichida qotib
      // turardi (c_hours_v) — admin uni o'zgartira olmasdi.
      'workHours' => $ml('Dush–Juma · 09:00–18:00', 'Пн–Пт · 09:00–18:00', 'Mon–Fri · 09:00–18:00'),
      // Footerdagi brend ostidagi qisqa tavsif (ilgari i18n: footer_about).
      'footerAbout' => $ml(
        "Mustaqil tahliliy markaz. Tashqi siyosat, mintaqaviy xavfsizlik va xalqaro hamkorlik bo'yicha ekspert-tahliliy tadqiqotlar.",
        'Независимый аналитический центр. Экспертно-аналитические исследования по внешней политике, региональной безопасности и международному сотрудничеству.',
        'Independent think tank. Expert and analytical research on foreign policy, regional security and international cooperation.'
      ),
      // Footerning pastki qatori. {yil} — joriy yilga almashadi, shuning uchun
      // sana hech qachon eskirmaydi (ilgari i18n'da "© 2026 ..." qotib turardi).
      'copyright' => $ml(
        '© {yil} Tashqi siyosiy tadqiqotlar va xalqaro tashabbuslar markazi',
        '© {yil} Центр внешнеполитических исследований и международных инициатив',
        '© {yil} Center for Foreign Policy Research and International Initiatives'
      ),
      // Footerdagi huquqiy havolalar. Bo'sh bo'lsa havola UMUMAN chizilmaydi —
      // ilgari ikkalasi ham href="#" bo'lib, bosilganda hech qayerga eltmasdi.
      'legal' => ['privacy' => '', 'terms' => ''],
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
  ];
}

function default_seed() {
  $ml = function ($uz, $ru = '', $en = '') { return ['uz' => $uz, 'ru' => $ru, 'en' => $en]; };
  $p = function ($s) { return '<p>' . $s . '</p>'; };
  return [
    'settings' => default_settings(),
    'auth' => ['username' => 'markaz_admini', 'password' => ''],
    'users' => [
      ['id' => uidgen(), 'name' => 'Bosh administrator', 'login' => 'markaz_admini', 'email' => 'admin@markaz.uz', 'role' => 'Administrator', 'status' => 'active', 'last' => '2026-06-13'],
    ],
    'news' => [
      ['id' => uidgen(), 'title' => $ml('Markaz ekspertlari Markaziy Osiyo bo\'yicha xalqaro forumda ma\'ruza qildi', 'Эксперты центра выступили на международном форуме по Центральной Азии', ''), 'category' => 'Diplomatiya', 'date' => '2026-06-13', 'status' => 'published', 'cover' => '', 'excerpt' => $ml('Forum doirasida mintaqaviy hamkorlik masalalari muhokama qilindi.'), 'body' => $ml($p('Forum doirasida mintaqaviy hamkorlik masalalari muhokama qilindi.'))],
      ['id' => uidgen(), 'title' => $ml('Yangi hisobot: mintaqaviy savdo-iqtisodiy aloqalar dinamikasi'), 'category' => 'Tahlil', 'date' => '2026-06-12', 'status' => 'published', 'cover' => '', 'excerpt' => $ml(''), 'body' => $ml($p('Mintaqaviy savdo-iqtisodiy aloqalar dinamikasi tahlili.'))],
    ],
    'events' => [
      ['id' => uidgen(), 'title' => $ml('BMT Mintaqaviy markazi vakillari bilan oliy darajadagi uchrashuv', 'Встреча высокого уровня с представителями Регионального центра ООН', 'High-level meeting with representatives of the UN Regional Center'), 'date' => '2026-08-28', 'time' => '11:00', 'location' => $ml('Toshkent, TSTM majlislar zali', 'Ташкент, конференц-зал ЦВПИ', 'Tashkent, CFPS conference hall'), 'type' => 'Uchrashuv', 'status' => 'published', 'body' => $ml($p('BMTning Markaziy Osiyo uchun profilaktik diplomatiya bo\'yicha mintaqaviy markazi delegatsiyasi bilan uchrashuv.'))],
      ['id' => uidgen(), 'title' => $ml('Ekspert muhokamasi: yangi geosiyosiy haqiqatlar va mintaqaviy integratsiya', 'Экспертное обсуждение: новые геополитические реалии и региональная интеграция', 'Expert discussion: new geopolitical realities and regional integration'), 'date' => '2026-09-02', 'time' => '15:00', 'location' => $ml('Markaz binosi', 'Здание Центра', 'Center building'), 'type' => 'Davra suhbati', 'status' => 'published', 'body' => $ml($p('Mintaqadagi yangi geosiyosiy haqiqatlar bo\'yicha davra suhbati.'))],
      ['id' => uidgen(), 'title' => $ml('Markaziy Osiyo xavfsizligi va barqarorligi bo\'yicha xalqaro konferensiya', 'Международная конференция по безопасности и стабильности в Центральной Азии', 'International Conference on Security and Stability in Central Asia'), 'date' => '2026-09-15', 'time' => '10:00', 'location' => $ml('Toshkent', 'Ташкент', 'Tashkent'), 'type' => 'Konferensiya', 'status' => 'published', 'body' => $ml($p('Xalqaro konferensiya.'))],
      ['id' => uidgen(), 'title' => $ml('Yosh tadqiqotchilar uchun yozgi ekspert maktabi va taqdimot kuni', 'Летняя экспертная школа и день презентаций для молодых исследователей', 'Summer expert school and presentation day for young researchers'), 'date' => '2026-08-30', 'time' => '09:30', 'location' => $ml('Markaz binosi + Onlayn', 'Здание Центра + Онлайн', 'Center building + Online'), 'type' => 'Markaz hayoti', 'status' => 'published', 'body' => $ml($p('Yozgi maktab bitiruvchilarining loyihalar taqdimoti.'))],
    ],
    'experts' => [
      ['id' => uidgen(), 'name' => $ml('Bobur Rahimov'), 'role' => $ml('Direktor'), 'sub' => $ml('Siyosiy fanlar doktori'), 'photo' => '', 'bio' => $ml(''), 'order' => 1],
      ['id' => uidgen(), 'name' => $ml('Nodira Yusupova'), 'role' => $ml('Direktor o\'rinbosari'), 'sub' => $ml('Xalqaro munosabatlar bo\'yicha'), 'photo' => '', 'bio' => $ml(''), 'order' => 2],
    ],
    'publications' => [
      ['id' => uidgen(), 'title' => $ml('Markaziy Osiyoda yangi diplomatik arxitektura'), 'type' => 'Tahlil', 'category' => 'Tashqi siyosat', 'region' => 'Markaziy Osiyo', 'author' => 'Bobur Rahimov', 'year' => '2026', 'status' => 'published', 'cover' => '', 'pdf' => '', 'desc' => $ml('')],
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
