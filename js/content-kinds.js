/* content-kinds.js — "kontent turi -> qaysi sayt sahifasida ko'rinadi" jadvali.

   NEGA ALOHIDA FAYL (2026-08-20):
   Admin voqea/nashr turini BITTA satr sifatida saqlaydi (`events.type`,
   `publications.type`), sayt esa uni 4 tadan sahifaga taqsimlaydi. Bu moslik
   ilgari faqat `site-common.js` da turardi va admin panel uni KO'RA OLMASDI
   (admin.html site-common.js ni yuklamaydi). Natijada admin tur tanlaganda
   yozuv saytda qayerda chiqishini bilmasdi — "Brifing" tanlagan odam uni
   `uchrashuvlar.html` da qidirmasdi.

   Endi jadval shu yerda, BITTA joyda, va ikkala olam ham shu fayldan o'qiydi:
     • sayt  — site-common.js orqali (Site.EVENT_KINDS, Site.eventKind, ...)
     • admin — to'g'ridan-to'g'ri (ContentKinds.eventKind, ...)

   YANGI TUR QO'SHISH: `admin-ui.js` dagi `opts` ro'yxatiga qiymat qo'shsangiz,
   shu yerdagi tegishli turning `types` ro'yxatiga ham qo'shing — aks holda
   yozuv faqat umumiy sahifada (tadbirlar.html / nashrlar.html) ko'rinadi.

   Maydonlar:
     id     — ichki identifikator (sahifadagi `data-ekind` / `data-pkind`)
     page   — sayt sahifasining fayli
     tk     — i18n kaliti (sayt shu bilan tarjima qiladi)
     label  — o'zbekcha nom (admin panel uchun; unda i18n.js yo'q)
     types  — admin ro'yxatidagi ANIQ qiymatlar
     re     — zaxira moslik: qo'lda kiritilgan yoki eskirgan qiymatlar uchun
*/
(function (w) {
  'use strict';

  /* ---------- Voqea turlari (Voqealar bo'limi) ----------
     `events.type` bitta satr; sayt uni 4 ta sahifaga taqsimlaydi.
     Ilgari bu uzun if-zanjiri sifatida page-tadbirlar.js ichida turardi va
     voqeaning o'z sahifasi (tadbir.html) uni takrorlashga majbur bo'lardi. */
  var EVENT_KINDS = [
    { id: 'meet',  page: 'uchrashuvlar.html',     tk: 'nav_ev_meetings',
      label: 'Uchrashuvlar', singular: 'uchrashuv',
      types: ['Uchrashuv', 'Brifing'],
      re: /uchrashuv|muzokara|brifing|meeting|talks|briefing|встреч|переговор|брифинг/ },
    { id: 'round', page: 'davra-suhbatlari.html', tk: 'nav_ev_roundtables',
      label: 'Davra suhbatlari', singular: 'davra suhbati',
      types: ['Davra suhbati'],
      re: /davra|muhokama|roundtable|round table|discussion|круглый стол|обсужден|дискусс/ },
    { id: 'conf',  page: 'konferensiyalar.html',  tk: 'nav_ev_conferences',
      label: 'Konferensiyalar', singular: 'konferensiya',
      types: ['Konferensiya', 'Forum', 'Taqdimot'],
      re: /konferensiy|simpozium|forum|taqdimot|conference|symposium|presentation|конференц|симпозиум|форум|презентац/ },
    { id: 'life',  page: 'markaz-hayoti.html',    tk: 'nav_ev_life',
      label: 'Markaz hayoti', singular: 'voqea',
      types: ['Markaz hayoti', "Ta'lim dasturi"],
      re: /markaz hayoti|ta'lim|maktab|seminar|trening|center life|training|school|workshop|жизнь центр|образовательн|семинар|тренинг|школ/ }
  ];

  /* ---------- Nashr turlari (Tadqiqotlar bo'limi) ----------
     NEGA KERAK BO'LDI: 2026-08-12 da menyudagi "Hisobotlar" bandi "Tahlillar"
     deb qayta nomlangan va sahifa `Tahlil` turini filtrlaydigan qilingan,
     lekin BAZADAGI yozuvlar `Hisobot` turida qolgan. Natijada tahlillar.html
     butunlay bo'sh turardi va 7 ta nashrdan 4 tasi hech bir kichik sahifada
     ko'rinmasdi (faqat nashrlar.html da). Endi eski nom ham `reports` ga
     olib keladi.

     Moslik ikki bosqichda: avval ANIQ qiymat (`types`), keyin kalit so'z
     (`re`). Aniq moslik birinchi bo'lgani MUHIM: "Tahliliy sharh" -> maqolalar,
     "Tahlil" -> tahlillar, garchi ikkalasida ham "tahlil" bo'lsa ham. */
  var PUB_KINDS = [
    { id: 'articles', page: 'maqolalar.html', tk: 'nav_an_articles',
      label: 'Maqolalar', singular: 'maqola',
      types: ['Maqola', 'Tahliliy sharh'],
      re: /maqola|sharh|article|commentary|стать|обзор|коммент/ },
    { id: 'lectures', page: 'maruzalar.html', tk: 'nav_an_lectures',
      label: "Ma'ruzalar", singular: "ma'ruza",
      types: ["Ma'ruza", 'Taqdimot'],
      re: /ma'ruza|taqdimot|ma'ruzasi|lecture|presentation|доклад|лекц|презентац/ },
    { id: 'reports',  page: 'tahlillar.html', tk: 'nav_an_reports',
      label: 'Tahlillar', singular: 'tahlil',
      // `Hisobot` — 2026-08-12 gacha ishlatilgan nom, bazada hamon uchraydi.
      types: ['Tahlil', 'Hisobot', "Statistik to'plam"],
      re: /tahlil|hisobot|report|analys|analit|отчёт|отчет|анализ|аналит|статистич/ },
    { id: 'books',    page: 'kitoblar.html',  tk: 'nav_an_books',
      label: 'Kitoblar', singular: 'kitob',
      types: ['Monografiya', 'Kitob'],
      re: /monografi|kitob|book|monograph|монограф|книг/ }
  ];

  // Ko'p tilli qiymat ham, oddiy satr ham qabul qilinadi. Apostrofning turli
  // shakllari (' ’ ʻ ʼ `) bir xil hisoblanadi — "Ta'lim" va "Ta’lim" bir tur.
  function norm(type) {
    var v = (type && typeof type === 'object')
      ? Object.keys(type).map(function (k) { return type[k]; }).join(' ')
      : String(type || '');
    return v.toLowerCase().replace(/[‘’ʻʼ`]/g, "'").trim();
  }

  // Nashrlar bilan bir xil ikki bosqichli moslik: avval ANIQ qiymat, keyin
  // kalit so'z. Voqealar uchun ilgari faqat `re` bor edi; hozirgi 8 ta admin
  // qiymati uchun ikkala yo'l ham AYNI natijani beradi (tekshirilgan), lekin
  // `types` ni ham hisobga olish `admin-ui.js` dagi ro'yxat bilan bu jadvalni
  // bir xil o'qiladigan qiladi — yangi tur qo'shgan odam `re` ni yozishni
  // unutsa ham moslik ishlayveradi.
  function eventKind(type) {
    var t = norm(type);
    if (!t) return null;
    return EVENT_KINDS.find(function (k) {
      return k.types.some(function (x) { return norm(x) === t; });
    }) || EVENT_KINDS.find(function (k) { return k.re.test(t); }) || null;
  }
  // Sahifa fayli -> tur (data-ekind bo'lmagan holat uchun zaxira)
  function eventKindById(id) {
    return EVENT_KINDS.find(function (k) { return k.id === id; }) || null;
  }

  function pubKind(type) {
    var t = norm(type);
    if (!t) return null;
    return PUB_KINDS.find(function (k) {
      return k.types.some(function (x) { return norm(x) === t; });
    }) || PUB_KINDS.find(function (k) { return k.re.test(t); }) || null;
  }
  function pubKindById(id) {
    return PUB_KINDS.find(function (k) { return k.id === id; }) || null;
  }

  /* Admin panel uchun: kolleksiya kaliti bo'yicha to'g'ri jadvalni tanlaydi.
     `events` -> EVENT_KINDS, `publications` -> PUB_KINDS, boshqasi -> null. */
  function kindFor(coll, type) {
    if (coll === 'events') return eventKind(type);
    if (coll === 'publications') return pubKind(type);
    return null;
  }
  // Kolleksiyaning umumiy (barchasi ko'rinadigan) sahifasi
  function fallbackPage(coll) {
    if (coll === 'events') return { page: 'tadbirlar.html', label: 'Tadbirlar (umumiy)' };
    if (coll === 'publications') return { page: 'nashrlar.html', label: 'Nashrlar (umumiy)' };
    return null;
  }
  /* Saytning MENYUSIDAGI bo'lim nomi. Sayt sahifasining sarlavhasidan farq
     qiladi: menyuda "Tadqiqotlar", sahifaning o'zida esa "Tadqiqotlar va
     nashrlar". Admin panelda menyudagi nom ishlatiladi — ikkalasi bir xil
     o'qilsin. Manba: site-common.js -> NAV (nav_analytics / nav_happenings). */
  function sectionOf(coll) {
    if (coll === 'events') return 'Voqealar';
    if (coll === 'publications') return 'Tadqiqotlar';
    return '';
  }
  // Kolleksiyaning bo'limlari (admin yon menyusi shundan quriladi)
  function kindsOf(coll) {
    if (coll === 'events') return EVENT_KINDS;
    if (coll === 'publications') return PUB_KINDS;
    return [];
  }
  function kindById(coll, id) {
    return kindsOf(coll).find(function (k) { return k.id === id; }) || null;
  }

  w.ContentKinds = {
    EVENT_KINDS: EVENT_KINDS, PUB_KINDS: PUB_KINDS,
    eventKind: eventKind, eventKindById: eventKindById,
    pubKind: pubKind, pubKindById: pubKindById,
    kindFor: kindFor, fallbackPage: fallbackPage,
    kindsOf: kindsOf, kindById: kindById, sectionOf: sectionOf
  };
})(window);
