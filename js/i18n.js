/* ============================================================
   TSTM — i18n (UZ / RU / EN) tarjima tizimi
   Lug'at + tarjima dvigateli. Boshqa skriptlardan oldin yuklanadi.
   Ishlatish:
     t('nav_about')               -> joriy tildagi matn
     I18N.lang                    -> 'uz' | 'ru' | 'en'
     I18N.setLang('ru')           -> tilni o'zgartiradi + sahifani yangilaydi
     I18N.translate(root)         -> [data-i18n] elementlarini tarjima qiladi
   HTML:
     <h1 data-i18n="p_events_title"></h1>
     <input data-i18n-ph="search_ph">
   ============================================================ */
(function (w) {
  const KEY = 'tstm_site_lang';
  let lang = 'uz';
  try { lang = localStorage.getItem(KEY) || 'uz'; } catch {}
  if (['uz','ru','en'].indexOf(lang) < 0) lang = 'uz';

  const MONTHS = {
    uz: ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'],
    ru: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
    en: ['January','February','March','April','May','June','July','August','September','October','November','December']
  };


  const D = {
    /* ---- util bar ---- */
    util_country: { uz: "O'zbekiston Respublikasi", ru: 'Республика Узбекистан', en: 'Republic of Uzbekistan' },
    theme_title:  { uz: 'Yorug\'/quyuq rejim', ru: 'Светлая/тёмная тема', en: 'Light/dark mode' },
    search_title: { uz: 'Qidiruv', ru: 'Поиск', en: 'Search' },

    /* ---- navigation ---- */
    nav_about:            { uz: 'Markaz haqida', ru: 'О центре', en: 'About' },
    nav_about_who:        { uz: 'Biz haqimizda', ru: 'Кто мы', en: 'Who we are' },
    nav_about_leadership: { uz: 'Rahbariyat', ru: 'Руководство', en: 'Leadership' },
    nav_about_partners:   { uz: 'Hamkorlar', ru: 'Партнёры', en: 'Partners' },
    nav_research:         { uz: 'Tadqiqotlar', ru: 'Исследования', en: 'Research' },
    nav_pubs:             { uz: 'Nashrlar', ru: 'Публикации', en: 'Publications' },
    nav_events:           { uz: 'Tadbirlar', ru: 'Мероприятия', en: 'Events' },
    nav_media:            { uz: 'Media', ru: 'Медиа', en: 'Media' },
    nav_media_photo:      { uz: 'Fotogalereya', ru: 'Фотогалерея', en: 'Photo gallery' },
    nav_media_video:      { uz: 'Videomateriallar', ru: 'Видеоматериалы', en: 'Videos' },
    nav_media_info:       { uz: 'Infografika', ru: 'Инфографика', en: 'Infographics' },
    nav_contact:          { uz: 'Aloqa', ru: 'Контакты', en: 'Contacts' },

    /* Bosh sahifa menyusi 2026-08-04 da qayta guruhlandi: "Tadqiqotlar" ->
       "Voqealar" (yangilik/ekspert/tadbir), "Nashrlar" -> "Tahlillar"
       (hisobot/maqola/kitob). Eski kalitlar ichki sahifalarda hali ishlatiladi,
       shuning uchun o'chirilmadi. */
    nav_about_experts:    { uz: 'Ekspertlar', ru: 'Эксперты', en: 'Experts' },
    /* Markaz haqida bo'limining 4 sahifasi uchun sarlavha/lead kalitlari */
    p_who_title:          { uz: 'Biz haqimizda', ru: 'Кто мы', en: 'Who we are' },
    /* 2026-08-23: banner ostidagi qator qayta yozildi. Ilgari "Mustaqil
       tahliliy markaz — missiya, qadriyatlar va faoliyat yo'nalishlari" deb
       turardi, lekin (1) sanab o'tilgan bo'limlar sahifadan olib tashlandi va
       (2) markazning rasmiy ta'rifi "MUSTAQIL" emas — u davlat ilmiy-tadqiqot
       va tahliliy markazi. Shu sabab matn sahifadagi rasmiy ta'rifga
       moslandi. Ru/En shu yerda tarjima qilindi (qisqa xizmat matni). */
    p_who_lead:           { uz: "O'zbekiston Respublikasi tashqi siyosati bo'yicha davlat ilmiy-tadqiqot va tahliliy markazi.", ru: 'Государственный научно-исследовательский и аналитический центр по внешней политике Республики Узбекистан.', en: 'State research and analytical center for the foreign policy of the Republic of Uzbekistan.' },
    p_partners_title:     { uz: 'Hamkorlar', ru: 'Партнёры', en: 'Partners' },
    p_partners_lead:      { uz: "Xalqaro hamkor tashkilotlar, ilmiy muassasalar va diplomatik hamkorlar.", ru: 'Международные партнёрские организации, научные учреждения и дипломатические партнёры.', en: 'International partner organizations, research institutions and diplomatic partners.' },
    partners_empty:       { uz: "Hamkorlar hozircha kiritilmagan.", ru: 'Партнёры пока не добавлены.', en: 'No partners have been added yet.' },
    partners_visit:       { uz: 'Saytga o\'tish', ru: 'Перейти на сайт', en: 'Visit website' },
    /* Bosh sahifadagi "Xalqaro hamkorlar" bo'limining havola matni. */
    partners_all_title:   { uz: 'Xalqaro hamkorlar to\'liq ro\'yxati', ru: 'Полный список международных партнёров', en: 'Full list of international partners' },
    /* Nomi "partners_" bilan boshlansa ham, bu kalit endi FAQAT tadbirlar
       sahifasida ishlatiladi (page-tadbirlar.js — o'tgan voqealar yil filtri,
       "Barchasi" chipi). Hamkorlar sahifasidagi filtr 2026-08-23 da olib
       tashlangan; kalit nomini o'zgartirmadim, chunki u ikkinchi bir joyda
       ham paydo bo'lib qolsa qidirib topish qiyinlashardi — o'chirmang. */
    partners_filter_all:  { uz: 'Barchasi', ru: 'Все', en: 'All' },
    /* hamkorlar.html dagi YAGONA sarlavha. Kalit nomi tarixiy ("intro" —
       ilgari ostida kirish matni va raqamlar bloki turardi), matni esa
       2026-08-23 da ikki marta o'zgardi: "Birgalikda ishlaymiz" ->
       "Birgalikda xalqaro maydonda" -> hozirgisi. */
    partners_intro_title: { uz: 'Bizning xalqaro maydondagi hamkorlarimiz', ru: 'Наши партнёры на международной арене', en: 'Our partners on the international stage' },
    /* 2026-08-20: `partners_cta_*` (ochiq "Hamkorlik qilishni istaysizmi?"
       taklifi) olib tashlandi — markaz hamma bilan hamkorlik qilavermaydi va
       saytda ochiq chaqiriq qoldirish noto'g'ri kutish uyg'otardi.

       2026-08-23: hamkorlar sahifasidan toifa filtri, qidiruv maydoni, toifa
       guruhlari, raqamlar bloki va kirish matni olib tashlandi — sarlavhadan
       keyin darhol kartalar boshlanadi. Ular bilan ishlagan kalitlar ham
       o'chirildi: `partners_all_kicker`, `partners_intro_text`,
       `partners_search_ph`, `partners_found`, `partners_none`,
       `partners_reset`, `partners_stat_orgs|geo|cats`, `partners_show_all`
       va `pcat_*` (6 ta toifa nomi). `partners_filter_all` esa QOLDI —
       uni tadbirlar sahifasi ishlatadi (yuqoriga qarang).
       DIQQAT: toifa maydoni admin panelda QOLDI (`PARTNER_CATS`, admin-ui.js)
       va bazaga yozilaveradi — u endi saytda ko'rsatilmaydi, xolos. Guruhlash
       qaytarilsa `pcat_*` kalitlarini ham qaytarish kerak bo'ladi. */


    /* ---- biz-kimmiz.html ----
       2026-08-23: sahifa butunlay qayta yozildi — o'nta bo'lim o'rniga bitta
       matn bloki qoldi. O'chirilgan kalitlar: `who_kicker`, `who_statement`,
       `who_p1|p2`, `who_do_kicker|title`, `who_do1..4_t|d`,
       `who_how_kicker|title`, `who_how1..4_t|d`, `who_story_kicker|title`,
       `who_facts_kicker|title`, `who_cta_title|text`, `val1..3_t|d`,
       `about_values_kicker|title`, `about_dir_all`, `about_goal_kicker`,
       `about_intro_kicker`, `p_about_title`, `nav_about_goal`.
       `dir*` va `stat_*` kalitlariga TEGILMADI — ularni bosh sahifa
       (index.html) va tadqiqotlar sahifasi ishlatadi.

       MATN BU YERDA EMAS. Sahifaning sarlavhasi ham, matni ham BAZADA:
       admin panel -> Markaz haqida -> "Biz kimmiz" (`pages`, slug
       `biz-kimmiz`). Bir muddat matn shu faylda `who_org_title` /
       `who_body1..5` kalitlarida turgan edi — ular o'chirildi, chunki ikkita
       manba (kod + baza) muqarrar ravishda bir-biridan chetga chiqadi.
       Uch tilga tarjima ham o'sha yerda, admin muharririda (avto-tarjima
       tugmasi bilan) qilinadi. Quyidagi yagona kalit — matn umuman
       kiritilmagan holat uchun. */
    who_empty:            { uz: 'Sahifa matni hozircha kiritilmagan.', ru: 'Текст страницы пока не добавлен.', en: 'The page text has not been added yet.' },

    /* ---- markaz-haqida.html: bo'lim kartalari (4 sahifaga yo'l) ---- */
    about_secs_kicker:    { uz: 'Bo’limlar', ru: 'Разделы', en: 'Sections' },
    about_secs_title:     { uz: 'Markaz haqida bo’limlari', ru: 'Разделы о центре', en: 'Sections about the center' },
    about_sec_who_d:      { uz: "Missiya, faoliyat shakllari va ishlash uslubimiz.", ru: 'Миссия, формы деятельности и наш метод работы.', en: 'Mission, forms of activity and how we work.' },
    about_sec_lead_d:     { uz: "Direktor va uning o’rinbosarlari — aloqa ma’lumotlari bilan.", ru: 'Директор и его заместители — с контактными данными.', en: 'The director and deputy directors — with contact details.' },
    about_sec_exp_d:      { uz: "Tahlilchilar va ilmiy xodimlar, ekspertiza yo’nalishlari bo’yicha.", ru: 'Аналитики и научные сотрудники по направлениям экспертизы.', en: 'Analysts and research staff, by area of expertise.' },
    about_sec_part_d:     { uz: "Xalqaro tashkilotlar, ilmiy markazlar va universitetlar.", ru: 'Международные организации, научные центры и университеты.', en: 'International organizations, research centers and universities.' },
    nav_happenings:       { uz: 'Voqealar', ru: 'События', en: 'Happenings' },
    nav_hap_experts:      { uz: 'Bizning ekspertlar OAVlarda', ru: 'Наши эксперты в СМИ', en: 'Our experts in the media' },
    nav_hap_events:       { uz: 'Tadbirlar TSTM', ru: 'Мероприятия ЦВПИ', en: 'CFPS events' },
    /* Voqealar (Events) bo'limi 4 sub-kategoriyasi: Uchrashuvlar, Davra suhbatlari, Konferensiyalar, Markaz hayoti */
    nav_ev_meetings:      { uz: 'Uchrashuvlar', ru: 'Встречи', en: 'Meetings' },
    nav_ev_roundtables:   { uz: 'Davra suhbatlari', ru: 'Круглые столы', en: 'Roundtables' },
    nav_ev_conferences:   { uz: 'Konferensiyalar', ru: 'Конференции', en: 'Conferences' },
    nav_ev_life:          { uz: 'Markaz hayoti', ru: 'Жизнь центра', en: 'Center Life' },
    p_meetings_title:     { uz: 'Uchrashuvlar', ru: 'Встречи', en: 'Meetings' },
    p_meetings_lead:      { uz: "Markazda o'tkazilgan xalqaro va mahalliy uchrashuvlar, muzokaralar va muloqotlar.", ru: 'Международные и локальные встречи, переговоры и диалоги в Центре.', en: 'International and local meetings, negotiations and dialogues at the Center.' },
    p_roundtables_title:  { uz: 'Davra suhbatlari', ru: 'Круглые столы', en: 'Roundtables' },
    p_roundtables_lead:   { uz: "Dolzarb mavzular bo'yicha ekspertlar va mutaxassislar ishtirokidagi davra suhbatlari hamda muhokamalar.", ru: 'Круглые столы и дискуссии с участием экспертов по актуальным темам.', en: 'Roundtables and discussions featuring experts on topical issues.' },
    p_conferences_title:  { uz: 'Konferensiyalar', ru: 'Конференции', en: 'Conferences' },
    p_conferences_lead:   { uz: "Xalqaro va mintaqaviy ilmiy-amaliy konferensiyalar, forumlar va simpoziumlar.", ru: 'Международные и региональные научно-практические конференции и форумы.', en: 'International and regional scientific and practical conferences and forums.' },
    p_center_life_title:  { uz: 'Markaz hayoti', ru: 'Жизнь центра', en: 'Center Life' },
    p_center_life_lead:   { uz: "Markaz faoliyati, ichki tadbirlari, ta'lim dasturlari va jamoaviy loyihalar.", ru: 'Деятельность центра, внутренние мероприятия, образовательные программы и командные проекты.', en: 'Center activities, internal events, educational programs, and team projects.' },
    /* 2026-08-12: bo'lim nomi "Tahlillar" dan "Tadqiqotlar"ga o'zgardi, ichidagi
       "Hisobotlar" bandi esa "Tahlillar" bo'lib qoldi (nav_an_reports kaliti
       ATAYLAB nav_an_analysis ga o'zgartirilmadi — pastda alohida izoh bor). */
    nav_analytics:        { uz: 'Tadqiqotlar', ru: 'Исследования', en: 'Research' },
    nav_an_reports:       { uz: 'Tahlillar', ru: 'Аналитика', en: 'Analysis' },
    nav_an_articles:      { uz: 'Maqolalar', ru: 'Статьи', en: 'Articles' },
    nav_an_books:         { uz: 'Kitoblar', ru: 'Книги', en: 'Books' },
    nav_an_lectures:      { uz: "Ma'ruzalar", ru: 'Лекции', en: 'Lectures' },

    /* ---- common ---- */
    home:         { uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' },
    read_more:    { uz: "Batafsil o'qish", ru: 'Подробнее', en: 'Read more' },
    more:         { uz: 'Batafsil', ru: 'Подробнее', en: 'More' },
    view_all:     { uz: 'Barchasi', ru: 'Все', en: 'View all' },
    all:          { uz: 'Hammasi', ru: 'Все', en: 'All' },
    /* ---- "Bizning ekspertlar OAVlarda" (oav.html / sharh.html) ---- */
    all_oav:      { uz: 'Barcha sharhlar', ru: 'Все комментарии', en: 'All commentary' },
    related_oav:  { uz: 'Boshqa sharhlar', ru: 'Другие комментарии', en: 'More commentary' },
    oav_expert:   { uz: 'Ekspert', ru: 'Эксперт', en: 'Expert' },
    oav_outlet:   { uz: 'Nashr', ru: 'Издание', en: 'Outlet' },
    oav_source:   { uz: 'Asl manbaga o‘tish', ru: 'Перейти к источнику', en: 'Go to the source' },
    oav_empty:    { uz: 'Hozircha sharhlar yo‘q', ru: 'Комментариев пока нет', en: 'No commentary yet' },
    oav_empty_o:  { uz: 'Bu nashrda sharh yo‘q', ru: 'В этом издании нет комментариев', en: 'No commentary from this outlet' },
    all_pubs:     { uz: 'Barcha nashrlar', ru: 'Все публикации', en: 'All publications' },
    all_dirs:     { uz: "Barcha yo'nalishlar", ru: 'Все направления', en: 'All areas' },
    all_team:     { uz: 'Butun jamoa', ru: 'Вся команда', en: 'Full team' },
    download_pdf: { uz: 'Faylni yuklab olish', ru: 'Скачать файл', en: 'Download file' },
    soon:         { uz: 'Tez orada', ru: 'Скоро', en: 'Coming soon' },
    read_again:   { uz: "Yana o'qing", ru: 'Читайте также', en: 'Read also' },
    related_pubs: { uz: 'Tegishli nashrlar', ru: 'Похожие публикации', en: 'Related publications' },
    pub_about:    { uz: 'Nashr haqida', ru: 'О публикации', en: 'About publication' },
    pub_fulltitle:{ uz: "To'liq nomi", ru: 'Полное название', en: 'Full title' },
    pub_type:     { uz: 'Turi', ru: 'Тип', en: 'Type' },
    pub_year:     { uz: 'Yil', ru: 'Год', en: 'Year' },
    pub_dir:      { uz: "Yo'nalish", ru: 'Направление', en: 'Area' },
    share:        { uz: 'Ulashish:', ru: 'Поделиться:', en: 'Share:' },
    act_print:    { uz: 'Chop etish', ru: 'Печать', en: 'Print' },
    act_link:     { uz: 'Havola', ru: 'Ссылка', en: 'Link' },
    act_share:    { uz: 'Ulashish', ru: 'Поделиться', en: 'Share' },
    link_copied:  { uz: 'Havola nusxalandi', ru: 'Ссылка скопирована', en: 'Link copied' },
    print_source: { uz: 'Manba', ru: 'Источник', en: 'Source' },
    print_date:   { uz: 'Chop etilgan sana', ru: 'Дата печати', en: 'Printed on' },
    print_orig:   { uz: 'Asl nashr', ru: 'Первоисточник', en: 'Original publication' },
    not_found_t:  { uz: 'Topilmadi', ru: 'Не найдено', en: 'Not found' },

    /* ---- hero ---- */

    /* ---- homepage: mission ---- */
    mission_idxlbl: { uz: 'Markaz haqida', ru: 'О центре', en: 'About the center' },
    mission_lead: {
      uz: "Mustaqil tahlil va dalillarga asoslangan tashqi siyosat uchun ekspert markazi.",
      ru: 'Экспертный центр независимого анализа и доказательной внешней политики.',
      en: 'An expert center for independent analysis and evidence-based foreign policy.'
    },
    mission_p1: {
      uz: "Markaz Markaziy Osiyo va global jarayonlarni chuqur o'rganadi, davlat organlari va jamoatchilik uchun ekspert-tahliliy materiallar tayyorlaydi hamda xalqaro ilmiy hamkorlikni mustahkamlashga ko'maklashadi.",
      ru: 'Центр проводит углублённое изучение процессов в Центральной Азии и мире, готовит экспертно-аналитические материалы для государственных органов и общественности, а также содействует укреплению международного научного сотрудничества.',
      en: 'The center conducts in-depth study of processes in Central Asia and globally, prepares expert and analytical materials for government bodies and the public, and helps strengthen international academic cooperation.'
    },
    mission_p2: {
      uz: "Faoliyatimiz xolislik, ilmiy asoslanganlik va xalqaro hamkorlik tamoyillariga tayanadi. Markaz mintaqaviy barqarorlik va davlat manfaatlariga xizmat qiluvchi strategik tavsiyalar ishlab chiqadi.",
      ru: 'Наша деятельность основана на принципах объективности, научной обоснованности и международного сотрудничества. Центр разрабатывает стратегические рекомендации, служащие региональной стабильности и государственным интересам.',
      en: 'Our work is grounded in objectivity, scientific rigor and international cooperation. The center develops strategic recommendations that serve regional stability and national interests.'
    },
    mission_more: { uz: 'Markaz haqida batafsil', ru: 'Подробнее о центре', en: 'About the center' },

    stat_research: { uz: 'Tadqiqot va hisobot', ru: 'Исследования и доклады', en: 'Research & reports' },
    stat_experts:  { uz: 'Ekspert va tahlilchi', ru: 'Эксперты и аналитики', en: 'Experts & analysts' },
    stat_partners: { uz: 'Xalqaro hamkor', ru: 'Международные партнёры', en: 'International partners' },
    stat_years:    { uz: 'Yillik tajriba', ru: 'Лет опыта', en: 'Years of experience' },

    /* ---- homepage: section heads ---- */
    dir_kicker:   { uz: "Faoliyat yo'nalishlari", ru: 'Направления деятельности', en: 'Areas of activity' },
    dir_title:    { uz: "Tadqiqot yo'nalishlarimiz", ru: 'Наши направления исследований', en: 'Our research areas' },
    pubs_kicker:  { uz: 'Tadqiqotlar va nashrlar', ru: 'Исследования и публикации', en: 'Research & publications' },
    pubs_title:   { uz: 'Asosiy hisobotlar', ru: 'Основные доклады', en: 'Key reports' },
    team_kicker:  { uz: 'Jamoa', ru: 'Команда', en: 'Team' },
    team_title:   { uz: 'Ekspertlar va rahbariyat', ru: 'Эксперты и руководство', en: 'Experts & leadership' },
    partners_kicker:{ uz: 'Hamkorlik', ru: 'Сотрудничество', en: 'Partnership' },
    partners_title:{ uz: 'Xalqaro hamkorlar', ru: 'Международные партнёры', en: 'International partners' },

    /* ---- research directions (6) ---- */
    dir1_t: { uz: 'Tashqi siyosat va diplomatiya', ru: 'Внешняя политика и дипломатия', en: 'Foreign policy & diplomacy' },
    dir1_d: { uz: "Mintaqaviy va global diplomatik jarayonlar, ikki va ko'p tomonlama munosabatlar tahlili.", ru: 'Анализ региональных и глобальных дипломатических процессов, двусторонних и многосторонних отношений.', en: 'Analysis of regional and global diplomatic processes, bilateral and multilateral relations.' },
    dir2_t: { uz: 'Mintaqaviy xavfsizlik', ru: 'Региональная безопасность', en: 'Regional security' },
    dir2_d: { uz: "Markaziy Osiyodagi barqarorlik, mudofaa va xavfsizlik masalalari bo'yicha strategik baholash.", ru: 'Стратегическая оценка вопросов стабильности, обороны и безопасности в Центральной Азии.', en: 'Strategic assessment of stability, defense and security issues in Central Asia.' },
    dir3_t: { uz: 'Xalqaro iqtisodiy hamkorlik', ru: 'Международное экономическое сотрудничество', en: 'International economic cooperation' },
    dir3_d: { uz: "Savdo, investitsiya va transport yo'laklari, iqtisodiy integratsiya istiqbollari.", ru: 'Торговля, инвестиции и транспортные коридоры, перспективы экономической интеграции.', en: 'Trade, investment and transport corridors, prospects for economic integration.' },
    dir4_t: { uz: 'Markaziy Osiyo tadqiqotlari', ru: 'Исследования Центральной Азии', en: 'Central Asia studies' },
    dir4_d: { uz: 'Mintaqa mamlakatlari munosabatlari, suv-energetika va chegara masalalari.', ru: 'Отношения стран региона, водно-энергетические и пограничные вопросы.', en: 'Relations among regional states, water-energy and border issues.' },
    dir5_t: { uz: 'Global jarayonlar va prognozlash', ru: 'Глобальные процессы и прогнозирование', en: 'Global processes & forecasting' },
    dir5_d: { uz: "Xalqaro tartibdagi o'zgarishlar, geosiyosiy ssenariylar va strategik prognozlar.", ru: 'Изменения в международном порядке, геополитические сценарии и стратегические прогнозы.', en: 'Shifts in the international order, geopolitical scenarios and strategic forecasts.' },
    dir6_t: { uz: 'Energetika va barqarorlik', ru: 'Энергетика и устойчивость', en: 'Energy & sustainability' },
    dir6_d: { uz: 'Energetika xavfsizligi, iqlim siyosati va barqaror rivojlanish maqsadlari tahlili.', ru: 'Анализ энергетической безопасности, климатической политики и целей устойчивого развития.', en: 'Analysis of energy security, climate policy and sustainable development goals.' },
    yo_about: { uz: "Yo'nalish haqida", ru: 'О направлении', en: 'About the area' },
    yo_pubs: { uz: 'Shu yo\'nalishdagi nashrlar', ru: 'Публикации по направлению', en: 'Publications in this area' },
    yo_none: { uz: "Bu yo'nalish bo'yicha nashr hozircha yo'q.", ru: 'Публикаций по этому направлению пока нет.', en: 'No publications in this area yet.' },
    dir1_long: { uz: "Markaz tashqi siyosat va diplomatiya yo'nalishida O'zbekistonning xalqaro maydondagi manfaatlarini ilmiy asosda tahlil qiladi. Ikki va ko'p tomonlama munosabatlar, xalqaro tashkilotlar bilan hamkorlik hamda diplomatik tashabbuslar chuqur o'rganiladi.", ru: 'В направлении внешней политики и дипломатии Центр на научной основе анализирует интересы Узбекистана на международной арене, изучает двусторонние и многосторонние отношения, сотрудничество с международными организациями и дипломатические инициативы.', en: 'In the foreign policy and diplomacy area, the Center analyzes Uzbekistan\u2019s interests on the international stage on a scientific basis, studying bilateral and multilateral relations, cooperation with international organizations and diplomatic initiatives.' },
    dir2_long: { uz: "Mintaqaviy xavfsizlik yo'nalishi Markaziy Osiyodagi barqarorlik, qarama-qarshiliklarning oldini olish, mudofaa va zamonaviy xavfsizlik tahdidlarini qamrab oladi. Ekspertlar strategik baholash va amaliy tavsiyalar tayyorlaydi.", ru: 'Направление региональной безопасности охватывает стабильность в Центральной Азии, предотвращение конфликтов, оборону и современные угрозы безопасности. Эксперты готовят стратегические оценки и практические рекомендации.', en: 'The regional security area covers stability in Central Asia, conflict prevention, defense and contemporary security threats. Experts prepare strategic assessments and practical recommendations.' },
    dir3_long: { uz: "Xalqaro iqtisodiy hamkorlik yo'nalishida savdo, investitsiya, transport-logistika yo'laklari va mintaqaviy iqtisodiy integratsiya masalalari tahlil qilinadi.", ru: 'В направлении международного экономического сотрудничества анализируются торговля, инвестиции, транспортно-логистические коридоры и вопросы региональной экономической интеграции.', en: 'The international economic cooperation area analyzes trade, investment, transport and logistics corridors, and regional economic integration.' },
    dir4_long: { uz: "Markaziy Osiyo tadqiqotlari yo'nalishi mintaqa mamlakatlari o'rtasidagi munosabatlar, suv-energetika resurslari, chegara va umumiy rivojlanish masalalarini qamrab oladi.", ru: 'Направление исследований Центральной Азии охватывает отношения между странами региона, водно-энергетические ресурсы, пограничные вопросы и общее развитие.', en: 'The Central Asia studies area covers relations among regional states, water-energy resources, border issues and shared development.' },
    dir5_long: { uz: "Global jarayonlar va prognozlash yo'nalishi xalqaro tartibdagi tub o'zgarishlar, geosiyosiy ssenariylar va uzoq muddatli strategik prognozlarni ishlab chiqishga qaratilgan.", ru: 'Направление глобальных процессов и прогнозирования сосредоточено на фундаментальных изменениях международного порядка, геополитических сценариях и долгосрочных стратегических прогнозах.', en: 'The global processes and forecasting area focuses on fundamental shifts in the international order, geopolitical scenarios and long-term strategic forecasts.' },
    dir6_long: { uz: "Energetika va barqarorlik yo'nalishi energetika xavfsizligi, iqlim siyosati va barqaror rivojlanish maqsadlari bo'yicha tahliliy materiallar tayyorlaydi.", ru: 'Направление энергетики и устойчивости готовит аналитические материалы по энергетической безопасности, климатической политике и целям устойчивого развития.', en: 'The energy and sustainability area produces analytical materials on energy security, climate policy and sustainable development goals.' },

    /* ---- footer ---- */
    footer_about:    { uz: "Mustaqil tahliliy markaz. Tashqi siyosat, mintaqaviy xavfsizlik va xalqaro hamkorlik bo'yicha ekspert-tahliliy tadqiqotlar.", ru: 'Независимый аналитический центр. Экспертно-аналитические исследования по внешней политике, региональной безопасности и международному сотрудничеству.', en: 'Independent think tank. Expert and analytical research on foreign policy, regional security and international cooperation.' },
    footer_address:  { uz: 'Manzil', ru: 'Адрес', en: 'Address' },
    footer_email:    { uz: 'E-pochta', ru: 'Эл. почта', en: 'Email' },
    footer_phone:    { uz: 'Telefon', ru: 'Телефон', en: 'Phone' },
    footer_privacy:  { uz: 'Maxfiylik siyosati', ru: 'Политика конфиденциальности', en: 'Privacy policy' },
    footer_terms:    { uz: 'Saytdan foydalanish', ru: 'Условия использования', en: 'Terms of use' },
    footer_copyright:{ uz: '© 2026 Tashqi siyosiy tadqiqotlar va xalqaro tashabbuslar markazi', ru: '© 2026 Центр внешнеполитических исследований и международных инициатив', en: '© 2026 Center for Foreign Policy Research and International Initiatives' },
    /* Markaz nomi. Haqiqiy manba — admin → Sozlamalar → "Markaz nomi"
       (`settings.siteName`); bu yerdagilar sozlama BO'SH bo'lgandagi zaxira.
       `org_full` — bir qatorli to'liq nom (chop etish, muallif o'rni va h.k.),
       `org_name`/`org_tagline` — logotip yonidagi ikki qatorli lockup va
       index.html dagi statik matn (JS yuklanguncha ko'rinadigan).
       2026-08-20: ruscha zaxira YARIM nom edi ("ЦЕНТР ВНЕШНЕПОЛИТИЧЕСКИХ" +
       "Исследований"), ya'ni "и международных инициатив" butunlay tushib
       qolardi. Uchala til ham endi to'liq nomni beradi. */
    org_full:        { uz: 'Tashqi siyosiy tadqiqotlar va xalqaro tashabbuslar markazi', ru: 'Центр внешнеполитических исследований и международных инициатив', en: 'Center for Foreign Policy Research and International Initiatives' },
    org_tagline:     { uz: 'VA XALQARO TASHABBUSLAR MARKAZI', ru: 'И МЕЖДУНАРОДНЫХ ИНИЦИАТИВ', en: 'AND INTERNATIONAL INITIATIVES' },
    org_name:        { uz: 'TASHQI SIYOSIY TADQIQOTLAR', ru: 'ЦЕНТР ВНЕШНЕПОЛИТИЧЕСКИХ ИССЛЕДОВАНИЙ', en: 'CENTER FOR FOREIGN POLICY RESEARCH' },

    /* ---- page banners ---- */
    p_oav_title:   { uz: 'Bizning ekspertlar OAVlarda', ru: 'Наши эксперты в СМИ', en: 'Our experts in the media' },
    p_oav_lead:    { uz: "Markaz ekspertlarining ommaviy axborot vositalaridagi sharhlari, intervyulari va chiqishlari.", ru: 'Комментарии, интервью и выступления экспертов центра в средствах массовой информации.', en: 'Commentary, interviews and appearances by the center’s experts in the media.' },
    p_events_title:{ uz: 'Tadbirlar taqvimi', ru: 'Календарь мероприятий', en: 'Events calendar' },
    p_events_lead: { uz: "Konferensiyalar, davra suhbatlari, brifinglar va ta'lim dasturlari — markaz tashkil etadigan tadbirlar.", ru: 'Конференции, круглые столы, брифинги и образовательные программы — мероприятия центра.', en: 'Conferences, roundtables, briefings and educational programs organized by the center.' },
    p_pubs_title:  { uz: 'Tadqiqotlar va nashrlar', ru: 'Исследования и публикации', en: 'Research & publications' },
    p_pubs_lead:   { uz: "Tahlillar, maqolalar, ma'ruzalar va kitoblar — yuklab olish uchun ochiq.", ru: 'Аналитика, статьи, лекции и книги — доступны для скачивания.', en: 'Analysis, articles, lectures and books — open for download.' },
    p_research_title:{ uz: "Tadqiqot yo'nalishlari", ru: 'Направления исследований', en: 'Research areas' },
    p_research_lead:{ uz: 'Markaz olib boradigan asosiy tahliliy va ilmiy tadqiqot yo\'nalishlari.', ru: 'Основные аналитические и научно-исследовательские направления центра.', en: 'Core analytical and academic research areas of the center.' },
    p_research_recent:{ uz: "So'nggi tadqiqotlar", ru: 'Последние исследования', en: 'Recent research' },
    p_research_recent_t:{ uz: 'Yangi hisobotlar', ru: 'Новые доклады', en: 'New reports' },
    p_leadership_title:{ uz: 'Rahbariyat', ru: 'Руководство', en: 'Leadership' },
    p_experts_title:{ uz: 'Ekspertlar', ru: 'Эксперты', en: 'Experts' },
    p_experts_lead:{ uz: 'Markaz ekspertlari — tahlilchilar va ilmiy xodimlar.', ru: 'Эксперты центра — аналитики и научные сотрудники.', en: 'The center experts — analysts and research staff.' },
    /* ---- "Tahlillar" bo'limining alohida sahifalari ---- */
    p_reports_title:{ uz: 'Tahlillar', ru: 'Аналитика', en: 'Analysis' },
    p_reports_lead:{ uz: 'Markazning tahliliy materiallari va statistik to‘plamlari.', ru: 'Аналитические материалы и статистические сборники центра.', en: 'Analytical materials and statistical collections.' },
    p_lectures_title:{ uz: "Ma'ruzalar", ru: 'Лекции', en: 'Lectures' },
    p_lectures_lead:{ uz: 'Markaz ekspertlarining ma’ruza matnlari va taqdimotlari.', ru: 'Тексты лекций и презентации экспертов центра.', en: 'Lecture texts and presentations by the center’s experts.' },
    p_articles_title:{ uz: 'Maqolalar', ru: 'Статьи', en: 'Articles' },
    p_articles_lead:{ uz: 'Ekspert maqolalari va tahliliy sharhlar.', ru: 'Экспертные статьи и аналитические обзоры.', en: 'Expert articles and analytical reviews.' },
    p_books_title:{ uz: 'Kitoblar', ru: 'Книги', en: 'Books' },
    p_books_lead:{ uz: 'Monografiyalar va kitob shaklidagi ilmiy nashrlar.', ru: 'Монографии и научные издания в форме книг.', en: 'Monographs and book-format academic publications.' },
    p_leadership_lead:{ uz: 'Markaz rahbariyati — direktor va uning o‘rinbosarlari.', ru: 'Руководство центра — директор и его заместители.', en: 'The center\u2019s leadership — the director and deputy directors.' },
    p_media_title: { uz: 'Media kutubxona', ru: 'Медиатека', en: 'Media library' },
    p_media_lead:  { uz: 'Markaz tadbirlari va faoliyatidan fotosuratlar, videomateriallar va infografika.', ru: 'Фотографии, видеоматериалы и инфографика о мероприятиях и деятельности центра.', en: 'Photos, videos and infographics from the center\u2019s events and activities.' },
    p_contact_title:{ uz: "Biz bilan bog'laning", ru: 'Свяжитесь с нами', en: 'Get in touch' },
    p_contact_lead:{ uz: "Savol, taklif yoki hamkorlik bo'yicha murojaat — biz bilan bog'laning.", ru: 'Вопросы, предложения или сотрудничество — свяжитесь с нами.', en: 'Questions, suggestions or partnership — contact us.' },

    /* ---- events page ---- */
    ev_upcoming: { uz: 'Kelgusi tadbirlar', ru: 'Предстоящие мероприятия', en: 'Upcoming events' },
    ev_past:     { uz: "O'tgan tadbirlar", ru: 'Прошедшие мероприятия', en: 'Past events' },
    ev_none:     { uz: "Hozircha rejalashtirilgan tadbir yo'q", ru: 'Пока нет запланированных мероприятий', en: 'No scheduled events yet' },
    ev_soon:     { uz: 'Tez orada', ru: 'Скоро', en: 'Soon' },
    ev_today:    { uz: 'Bugun', ru: 'Сегодня', en: 'Today' },

    /* ---- Voqealar bo'limi: har bir sahifa o'z faoliyat turiga MOS
       sarlavhalar bilan ishlaydi (page-tadbirlar.js dagi LAYOUT). Umumiy
       "Kelgusi tadbirlar / O'tgan tadbirlar" juftligi tadbirlar.html
       (barcha voqealar) sahifasida qoladi. ---- */
    ev_up_meet:   { uz: 'Rejalashtirilgan uchrashuvlar', ru: 'Запланированные встречи', en: 'Scheduled meetings' },
    ev_ar_meet:   { uz: "O’tkazilgan uchrashuvlar", ru: 'Проведённые встречи', en: 'Meetings held' },
    ev_up_round:  { uz: 'Rejalashtirilgan muhokamalar', ru: 'Запланированные обсуждения', en: 'Scheduled discussions' },
    ev_ar_round:  { uz: "O’tkazilgan davra suhbatlari", ru: 'Проведённые круглые столы', en: 'Roundtables held' },
    ev_up_conf:   { uz: 'Kelgusi konferensiyalar', ru: 'Предстоящие конференции', en: 'Upcoming conferences' },
    ev_ar_conf:   { uz: "O’tkazilgan konferensiyalar", ru: 'Проведённые конференции', en: 'Conferences held' },
    ev_up_life:   { uz: 'Yaqin kunlarda', ru: 'В ближайшее время', en: 'Coming up' },
    ev_ar_life:   { uz: 'Lavhalar', ru: 'Хроника', en: 'Chronicle' },

    ev_none_meet:  { uz: "Rejalashtirilgan uchrashuv yo’q", ru: 'Запланированных встреч нет', en: 'No scheduled meetings' },
    ev_none_round: { uz: "Rejalashtirilgan muhokama yo’q", ru: 'Запланированных обсуждений нет', en: 'No scheduled discussions' },
    ev_none_conf:  { uz: "Kelgusi konferensiya yo’q", ru: 'Предстоящих конференций нет', en: 'No upcoming conferences' },
    ev_none_life:  { uz: "Yaqin kunlarga tadbir rejalashtirilmagan", ru: 'На ближайшее время мероприятий не запланировано', en: 'Nothing scheduled for the coming days' },
    ev_ar_none:    { uz: "Arxivda hozircha yozuv yo’q", ru: 'В архиве пока нет записей', en: 'The archive is empty for now' },

    /* Voqea sahifasi (tadbir.html) */
    ev_when:      { uz: 'Sana', ru: 'Дата', en: 'Date' },
    ev_time_l:    { uz: 'Boshlanish vaqti', ru: 'Время начала', en: 'Start time' },
    ev_where:     { uz: 'Manzil', ru: 'Место проведения', en: 'Venue' },
    ev_type_l:    { uz: 'Voqea turi', ru: 'Тип мероприятия', en: 'Event type' },
    ev_details:   { uz: 'Batafsil', ru: 'Подробнее', en: 'Details' },
    ev_ics:       { uz: "Taqvimga qo’shish", ru: 'Добавить в календарь', en: 'Add to calendar' },
    ev_related:   { uz: "Shu bo’limdagi boshqa voqealar", ru: 'Другие события этого раздела', en: 'Other events in this section' },
    ev_year_from: { uz: 'Yil', ru: 'Год', en: 'Year' },

    /* ---- media page ---- */
    m_empty_photo: { uz: 'Hozircha rasm yuklanmagan', ru: 'Фотографии пока не загружены', en: 'No photos uploaded yet' },
    m_soon_video:  { uz: "Videomateriallar tez orada qo'shiladi", ru: 'Видеоматериалы скоро появятся', en: 'Videos coming soon' },
    m_soon_info:   { uz: "Infografika tez orada qo'shiladi", ru: 'Инфографика скоро появится', en: 'Infographics coming soon' },
    m_press_kicker:{ uz: 'Matbuot xizmati', ru: 'Пресс-служба', en: 'Press service' },
    m_press_title: { uz: 'Ommaviy axborot vositalari uchun', ru: 'Для средств массовой информации', en: 'For media & press' },
    m_press_desc:  { uz: "Intervyu, sharh yoki markaz materiallaridan foydalanish bo'yicha murojaatlar uchun matbuot xizmatimizga bog'laning.", ru: 'По вопросам интервью, комментариев и использования материалов центра обращайтесь в нашу пресс-службу.', en: 'For interviews, comments or use of our materials, get in touch with our press service.' },
    m_press_cta:   { uz: "Bog'lanish", ru: 'Связаться', en: 'Get in touch' },
    m_interactive: { uz: 'Interaktiv infografika', ru: 'Интерактивная инфографика', en: 'Interactive infographic' },
    m_open:        { uz: 'Ochish', ru: 'Открыть', en: 'Open' },
    m_back_albums: { uz: 'Barcha albomlar', ru: 'Все альбомы', en: 'All albums' },

    /* ---- contact form ---- */
    c_name:    { uz: 'Ism familiya', ru: 'Имя и фамилия', en: 'Full name' },
    c_name_ph: { uz: "To'liq ism", ru: 'Полное имя', en: 'Full name' },
    c_email:   { uz: 'E-pochta', ru: 'Эл. почта', en: 'Email' },
    c_subject: { uz: 'Mavzu', ru: 'Тема', en: 'Subject' },
    c_subject_ph:{ uz: 'Murojaat mavzusi', ru: 'Тема обращения', en: 'Message subject' },
    c_message: { uz: 'Xabar', ru: 'Сообщение', en: 'Message' },
    c_message_ph:{ uz: "Xabaringizni yozing...", ru: 'Напишите ваше сообщение...', en: 'Write your message...' },
    c_send:    { uz: 'Xabar yuborish', ru: 'Отправить сообщение', en: 'Send message' },
    c_thanks:  { uz: 'Rahmat! Murojaatingiz qabul qilindi.', ru: 'Спасибо! Ваше обращение принято.', en: 'Thank you! Your message has been received.' },
    c_hours:   { uz: 'Ish vaqti', ru: 'Часы работы', en: 'Working hours' },
    c_hours_v: { uz: 'Dush–Juma · 09:00–18:00', ru: 'Пн–Пт · 09:00–18:00', en: 'Mon–Fri · 09:00–18:00' },
    c_info_title:{ uz: "Aloqa ma'lumotlari", ru: 'Контактная информация', en: 'Contact details' },
    c_form_title:{ uz: 'Xabar qoldiring', ru: 'Оставьте сообщение', en: 'Leave a message' },
    c_open_map:{ uz: 'Xaritada ochish', ru: 'Открыть на карте', en: 'Open in map' },
    c_sending: { uz: 'Yuborilmoqda…', ru: 'Отправка…', en: 'Sending…' },
    c_fill:    { uz: "Iltimos, majburiy maydonlarni to'ldiring.", ru: 'Пожалуйста, заполните обязательные поля.', en: 'Please fill in the required fields.' },
    c_invalid_email:{ uz: "To'g'ri e-pochta manzilini kiriting.", ru: 'Введите корректный адрес эл. почты.', en: 'Please enter a valid email address.' },
    c_toomany: { uz: "Juda ko'p urinish. Iltimos, birozdan so'ng qayta yuboring.", ru: 'Слишком много попыток. Повторите чуть позже.', en: 'Too many attempts. Please try again shortly.' },
    c_error:   { uz: "Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.", ru: 'Произошла ошибка. Попробуйте позже.', en: 'Something went wrong. Please try again later.' },

    /* ---- search page ---- */
    search_ph:   { uz: "Kalit so'z kiriting...", ru: 'Введите ключевое слово...', en: 'Enter a keyword...' },
    search_k_oav: { uz: 'Ekspert sharhi', ru: 'Комментарий эксперта', en: 'Expert commentary' },
    search_k_pub: { uz: 'Nashr', ru: 'Публикация', en: 'Publication' },
    search_k_event:{ uz: 'Tadbir', ru: 'Мероприятие', en: 'Event' },
    search_k_page:{ uz: 'Sahifa', ru: 'Страница', en: 'Page' },
    search_k_expert:{ uz: 'Ekspert', ru: 'Эксперт', en: 'Expert' },
    search_results:{ uz: 'ta natija', ru: 'результат(ов)', en: 'result(s)' },
    search_none:  { uz: "bo'yicha natija topilmadi", ru: '— ничего не найдено', en: '— no results found' },
    search_recent:{ uz: "So'nggi qidiruvlar", ru: 'Недавние запросы', en: 'Recent searches' },
    search_popular:{ uz: 'Ommabop', ru: 'Популярное', en: 'Popular' },
    search_hint:  { uz: "Qidirish uchun yozing yoki quyidan tanlang", ru: 'Введите запрос или выберите ниже', en: 'Type to search or pick below' },
    search_clear: { uz: 'Tozalash', ru: 'Очистить', en: 'Clear' },
    close:        { uz: 'Yopish', ru: 'Закрыть', en: 'Close' },
    /* Voqea sahifasidagi rasm slayderi (2026-08-20). Faqat skrin-rider va
       sichqoncha uchun yorliq — ekranda matn ko'rinmaydi (strelka ikonkasi). */
    ev_photo_prev:{ uz: 'Oldingi rasm', ru: 'Предыдущее фото', en: 'Previous photo' },
    ev_photo_next:{ uz: 'Keyingi rasm', ru: 'Следующее фото', en: 'Next photo' },
    f_author:     { uz: 'Muallif', ru: 'Автор', en: 'Author' },
    f_all:        { uz: 'Hammasi', ru: 'Все', en: 'All' },
    a11y_title:   { uz: 'Maxsus imkoniyatlar', ru: 'Спец. возможности', en: 'Accessibility' },
    a11y_mainnav: { uz: 'Asosiy menyu', ru: 'Главное меню', en: 'Main menu' },
    a11y_menu:    { uz: 'Menyu', ru: 'Меню', en: 'Menu' },
    a11y_skip:    { uz: "Asosiy kontentga o\u2018tish", ru: 'Перейти к содержимому', en: 'Skip to content' },
    theme_toggle: { uz: "Yorug\u2018/quyuq rejim", ru: 'Светлый/тёмный режим', en: 'Light/dark mode' },
    expert_bio:    { uz: 'Biografiya', ru: 'Биография', en: 'Biography' },
    expert_expertise:{ uz: 'Ekspertiza yo‘nalishlari', ru: 'Области экспертизы', en: 'Areas of expertise' },
    expert_contact: { uz: 'Aloqa', ru: 'Контакты', en: 'Contact' },
    expert_pubs:    { uz: 'Nashrlari', ru: 'Публикации', en: 'Publications' },
    expert_none_pub:{ uz: 'Hozircha nashr yo‘q', ru: 'Пока нет публикаций', en: 'No publications yet' },
    views_label:   { uz: 'ko\u2018rishlar', ru: 'просмотров', en: 'views' },
    sub_title:     { uz: 'Yangi tadqiqotlardan xabardor bo‘ling', ru: 'Узнавайте о новых исследованиях', en: 'Stay informed on new research' },
    sub_text:      { uz: 'Markaz yangi tahlil yoki nashr e’lon qilganda brauzeringiz sizga xabar beradi.', ru: 'Браузер уведомит вас, когда центр опубликует новую аналитику или издание.', en: 'Your browser will notify you when the center publishes new analysis or a report.' },
    sub_btn:       { uz: 'Obuna bo‘lish', ru: 'Подписаться', en: 'Subscribe' },
    sub_ok:        { uz: 'Obuna bo‘ldingiz', ru: 'Вы подписались', en: 'You are subscribed' },
    sub_later:     { uz: 'Keyinroq', ru: 'Позже', en: 'Later' },
    sub_ok_text:   { uz: 'Yangi nashr chiqqanda xabar keladi. Istagan vaqtda brauzer sozlamalaridan o‘chirishingiz mumkin.', ru: 'Вы получите уведомление о новой публикации. Отключить можно в настройках браузера в любой момент.', en: 'You’ll get a notification when new work is published. You can turn it off in your browser settings at any time.' },
    sub_perk_noemail: { uz: 'E-pochta so‘ralmaydi', ru: 'E-mail не требуется', en: 'No email required' },
    sub_perk_off:  { uz: 'Istalgan vaqtda o‘chirasiz', ru: 'Отключается в любой момент', en: 'Turn it off anytime' },
    sub_blocked:   { uz: 'Bildirishnoma bloklangan', ru: 'Уведомления заблокированы', en: 'Notifications are blocked' },
    sub_blocked_text: { uz: 'Brauzer bu sayt uchun bildirishnomani rad etgan. Yoqish uchun manzil qatoridagi qulf belgisini bosing va “Bildirishnomalar” bandiga ruxsat bering.', ru: 'Браузер запретил уведомления для этого сайта. Чтобы включить, нажмите значок замка в адресной строке и разрешите «Уведомления».', en: 'Your browser has blocked notifications for this site. To enable them, click the lock icon in the address bar and allow “Notifications”.' },
    sub_err_fail:  { uz: 'Obuna qilib bo‘lmadi. Keyinroq urinib ko‘ring.', ru: 'Не удалось подписаться. Попробуйте позже.', en: 'Couldn’t subscribe. Please try again later.' },
    sub_badge:     { uz: 'Axborot xizmati', ru: 'Информационная служба', en: 'Information service' },

    /* ---- about page: sections ---- */
    about_cta_title:    { uz: 'Markaz jamoasi va hamkorlik', ru: 'Команда центра и сотрудничество', en: 'Our team & cooperation' },
    about_cta_text:     { uz: "Ekspertlarimiz bilan tanishing yoki hamkorlik va murojaatlar bo'yicha biz bilan bog'laning.", ru: 'Познакомьтесь с нашими экспертами или свяжитесь с нами по вопросам сотрудничества и обращений.', en: 'Meet our experts, or get in touch with us about cooperation and inquiries.' },

    /* ---- about page sidenav fallback / misc ---- */
    soon_text:   { uz: "Matn tez orada qo'shiladi.", ru: 'Текст скоро будет добавлен.', en: 'Text coming soon.' },
    none_data:   { uz: "Ma'lumot yo'q", ru: 'Нет данных', en: 'No data' },
    no_pubs:     { uz: 'Nashr topilmadi', ru: 'Публикации не найдены', en: 'No publications found' },

    /* ---- bosh sahifa: bo'lim bo'sh bo'lgandagi holat ----
       Ilgari bu bo'limlarda namuna uchun yozilgan to'qima kontent (soxta
       yangilik sarlavhalari, o'ylab topilgan ekspert ismlari) turardi va
       baza bo'sh bo'lsa u haqiqiy ma'lumotdek ko'rinardi. */
    home_no_pubs:    { uz: "Hozircha nashr yo'q", ru: 'Публикаций пока нет', en: 'No publications yet' },
    home_no_experts: { uz: "Ma'lumot hozircha kiritilmagan", ru: 'Данные пока не добавлены', en: 'No information added yet' }
  };

  function t(key, l) {
    const e = D[key];
    if (!e) return key;
    return e[l || lang] || e.uz || '';
  }

  /* ---- Yorliq lug'ati: kategoriya / tur / hudud kabi qisqa matnlarni tarjima qiladi.
     Kontent (sarlavha, matn) admin'da 3 tilda saqlanadi; bu esa oddiy satr sifatida
     saqlanadigan taksonomiya yorliqlari uchun. Lug'atda yo'q bo'lsa — asl matn qoladi. ---- */
  const LBL = {
    'Diplomatiya':            { ru: 'Дипломатия', en: 'Diplomacy' },
    'Tashqi siyosat':         { ru: 'Внешняя политика', en: 'Foreign policy' },
    'Xavfsizlik':             { ru: 'Безопасность', en: 'Security' },
    'Mintaqaviy xavfsizlik':  { ru: 'Региональная безопасность', en: 'Regional security' },
    'Iqtisodiyot':            { ru: 'Экономика', en: 'Economy' },
    'Iqtisodiy hamkorlik':    { ru: 'Экономическое сотрудничество', en: 'Economic cooperation' },
    'Markaziy Osiyo':         { ru: 'Центральная Азия', en: 'Central Asia' },
    'Hamkorlik':              { ru: 'Сотрудничество', en: 'Cooperation' },
    'Tahlil':                 { ru: 'Аналитика', en: 'Analysis' },
    'Tadbir':                 { ru: 'Мероприятие', en: 'Event' },
    'Hisobot':                { ru: 'Отчёт', en: 'Report' },
    'Tahliliy sharh':         { ru: 'Аналитический обзор', en: 'Analytical review' },
    'Monografiya':            { ru: 'Монография', en: 'Monograph' },
    'Nashr':                  { ru: 'Публикация', en: 'Publication' },
    'Maqola':                 { ru: 'Статья', en: 'Article' },
    "Ma'ruza":                { ru: 'Лекция', en: 'Lecture' },
    'Forum':                  { ru: 'Форум', en: 'Forum' },
    'Konferensiya':           { ru: 'Конференция', en: 'Conference' },
    'Seminar':                { ru: 'Семинар', en: 'Seminar' },
    'Uchrashuv':              { ru: 'Встреча', en: 'Meeting' },
    'Kelishuv':               { ru: 'Соглашение', en: 'Agreement' },
    'Global':                 { ru: 'Глобальный', en: 'Global' }
  };
  function tl(s, l) {
    if (!s || typeof s !== 'string') return s || '';
    const e = LBL[s.trim()];
    if (!e) return s;
    const L = l || lang;
    return L === 'uz' ? s : (e[L] || s);
  }
  function translate(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(el => {
      const v = t(el.getAttribute('data-i18n'));
      if (v) el.textContent = v;
    });
    (root || document).querySelectorAll('[data-i18n-ph]').forEach(el => {
      const v = t(el.getAttribute('data-i18n-ph'));
      if (v) el.setAttribute('placeholder', v);
    });
    (root || document).querySelectorAll('[data-i18n-html]').forEach(el => {
      const v = t(el.getAttribute('data-i18n-html'));
      if (v) el.innerHTML = v;
    });
    // Ikonka tugmalari (qidiruv/tema/maxsus imkoniyatlar) — matni yo'q, faqat
    // aria-label/title. Ichki sahifalarda renderHeader ularni tilga qarab yasaydi,
    // bosh sahifada esa header statik — shuning uchun shu yerda tarjima qilinadi.
    (root || document).querySelectorAll('[data-i18n-aria]').forEach(el => {
      const v = t(el.getAttribute('data-i18n-aria'));
      if (v) el.setAttribute('aria-label', v);
    });
    (root || document).querySelectorAll('[data-i18n-title]').forEach(el => {
      const v = t(el.getAttribute('data-i18n-title'));
      if (v) el.setAttribute('title', v);
    });
  }
  function setLang(l) {
    if (['uz','ru','en'].indexOf(l) < 0) return;
    try { localStorage.setItem(KEY, l); } catch {}
    lang = l;
    location.reload();
  }

  w.I18N = { get lang(){ return lang; }, t, tl, translate, setLang, months: () => MONTHS[lang] || MONTHS.uz, dict: D, labels: LBL };
  w.t = t;
  document.documentElement.setAttribute('lang', lang);
})(window);
