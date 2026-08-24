/* ============================================================
   TSTM — umumiy sayt logikasi (header + footer + helperlar)
   Har bir ichki sahifa shu fayldan header/footer oladi.
   ============================================================ */
(function (w) {
  // ---------- helpers ----------
  const lang = (function(){ try { return localStorage.getItem('tstm_site_lang') || 'uz'; } catch{ return 'uz'; } })();
  const T = (k) => (w.I18N ? w.I18N.t(k) : k);
  const mlGet = (v, l) => {
    if (v && typeof v === 'object') return v[l || lang] || v.uz || v.ru || v.en || '';
    // oddiy satr — kategoriya/tur kabi yorliqlarni lug'at orqali tarjima qilishga urinamiz
    return w.I18N ? w.I18N.tl(v || '', l) : (v || '');
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // ---------- Xavfsiz URL ----------
  // src/href atributiga qo'yiladigan har qanday saqlangan qiymat (rasm yo'li, PDF
  // havolasi, hamkor sayti) shu yerdan o'tadi. Ikki ish qiladi:
  //   1) `javascript:` / `vbscript:` / rasm bo'lmagan `data:` sxemalarini bloklaydi
  //      — aks holda kontent muharriri bosilganda kod ishga tushadigan havola
  //      qoldirishi mumkin edi;
  //   2) natijani esc() qiladi — qiymat ichidagi qo'shtirnoq atributdan chiqib
  //      ketib yangi atribut (masalan onerror=) qo'sha olmaydi.
  const safeUrl = (u) => {
    const s = String(u == null ? '' : u).trim();
    if (!s) return '';
    // Brauzer URL sxemasidan boshqaruv belgilari va probelni tashlab yuboradi,
    // shuning uchun tekshirishdan oldin biz ham ularni olib tashlaymiz.
    const probe = s.split("").filter(function (ch) { return ch > " "; }).join("").toLowerCase();
    if (/^(javascript|vbscript|file):/.test(probe)) return '';
    if (/^data:/.test(probe) && !/^data:image\//.test(probe)) return '';
    return esc(s);
  };
  // ---------- Displey sarlavha ----------
  // Nashrlarning ilmiy sarlavhalari juda uzun bo'lishi mumkin (145 belgigacha) —
  // ular bannerni va ro'yxat kartalarini buzadi. Admin ixtiyoriy "Qisqa sarlavha"
  // yozishi mumkin: BOR bo'lsa banner/karta/brauzer sarlavhasida o'sha ishlatiladi,
  // YO'Q bo'lsa to'liq sarlavhaga qaytamiz (eski yozuvlar tahrirsiz ishlayveradi).
  // To'liq sarlavha nashr sahifasi ichida alohida blokda hamisha to'liq ko'rsatiladi.
  const dispTitle = (it, l) => {
    if (!it) return '';
    const s = mlGet(it.shortTitle, l);
    return (s && String(s).trim()) ? s : mlGet(it.title, l);
  };
  const MONTHS = (w.I18N ? w.I18N.months() : ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']);
  const fmtDate = (d) => { if(!d) return ''; const p = String(d).split('-'); return p[2]+'.'+p[1]+'.'+p[0]; };
  const dayMonth = (d) => { if(!d) return {dd:'',mm:''}; const p = String(d).split('-'); return { dd: p[2], mm: MONTHS[parseInt(p[1],10)-1] || '' }; };
  const qs = (k) => new URLSearchParams(location.search).get(k);
  const settings = () => { try { return Store.settings(); } catch{ return {}; } };
  // Joriy tilga mos logo yo'li. Sozlamada maxsus logo bo'lsa — o'sha, aks holda
  // til bo'yicha standart. Header/footer/chop etish — hammasi shu orqali.
  function brandLogo(){
    const s = settings();
    const def = { uz: 'img/logo-mark.png', ru: 'img/logo-mark-ru.png', en: 'img/logo-mark-en.png' };
    return (s.logos && s.logos[lang]) || s.logo || def[lang] || def.uz;
  }

  // ---------- Brend nomi (admin -> Sozlamalar -> "Markaz nomi") ----------
  // Brend ikki qatorli lockup, admindagi `siteName` esa bitta matn. Nomni so'z
  // chegarasidan ikki muvozanatli qatorga bo'lamiz (mavjud dizayn shakli saqlanadi).
  // Nom bo'sh bo'lsa — i18n'dagi standart matnga qaytamiz.
  function brandLines(){
    const nm = String(mlGet(settings().siteName) || '').trim();
    if (!nm) return { top: T('org_name'), bot: T('org_tagline') };
    const ws = nm.split(/\s+/);
    if (ws.length < 2) return { top: nm.toUpperCase(), bot: '' };
    let cut = 1, best = Infinity;
    for (let i = 1; i < ws.length; i++){
      let d = Math.abs(ws.slice(0, i).join(' ').length - ws.slice(i).join(' ').length);
      // Qisqa bog'lovchi ("va", "и", "and") qator oxirida osilib qolmasin
      if (ws[i - 1].length <= 3) d += 12;
      if (d < best) { best = d; cut = i; }
    }
    return { top: ws.slice(0, cut).join(' ').toUpperCase(), bot: ws.slice(cut).join(' ') };
  }
  const shortName = () => String(settings().shortName || 'TSTM');
  // Bir qatorli TO'LIQ nom — chop etilgan hujjat, muallif o'rni va shunga
  // o'xshash joylar uchun. Lockup emas, ya'ni bo'linmaydi va katta harfga
  // aylantirilmaydi. Ilgari bunday joylarda T('org_name') ishlatilardi va u
  // nomning faqat BIRINCHI YARMINI (ustiga katta harflarda) berardi.
  const orgName = () => String(mlGet(settings().siteName) || '').trim() || T('org_full');

  // Nom sozlamadan keladi, ya'ni uzunligi oldindan noma'lum. Brend matni menyu
  // ustiga chiqib ketmasligi uchun mavjud joyga qarab shriftni kichraytiramiz.
  // Standart o'zbekcha nom 17px'da sig'adi — unga tegilmaydi; uzunroq RU/EN
  // nomlari esa 12px'gacha kichrayadi.
  function fitBrand(){
    const nm = document.querySelector('header .brand .nm');
    if (!nm) return;
    const b = nm.querySelector('b'), sm = nm.querySelector('small');
    if (!b) return;
    // O'ng tomondagi to'siq — ko'rinib turgan menyu yoki burger tugmasi
    const nav = document.querySelector('header nav.main');
    const burger = document.querySelector('header #navBurger');
    const stop = (nav && nav.offsetParent !== null) ? nav
               : ((burger && burger.offsetParent !== null) ? burger : null);
    if (!stop) return;
    const limit = stop.getBoundingClientRect().left - nm.getBoundingClientRect().left - 18;
    if (!(limit > 80)) return; // o'lchov ishonchsiz — tegmaymiz
    let size = 17, guard = 0;
    b.style.fontSize = size + 'px'; if (sm) sm.style.fontSize = size + 'px';
    while (size > 12 && nm.scrollWidth > limit && guard++ < 40) {
      size -= 0.5;
      b.style.fontSize = size + 'px'; if (sm) sm.style.fontSize = size + 'px';
    }
  }

  // ---------- Yoqilgan tillar (admin -> Sozlamalar -> "Tillar") ----------
  // Sozlama yuklanmagan bo'lsa (offline) — uchalasi ham yoqilgan deb hisoblaymiz.
  const ALL_LANGS = ['uz', 'ru', 'en'];
  function enabledLangs(){
    const L = settings().langs || {};
    const on = ALL_LANGS.filter(l => L[l] !== false);
    return on.length ? on : ['uz']; // hammasi o'chirilgan bo'lsa sayt tilsiz qolmasin
  }
  // Joriy til o'chirib qo'yilgan bo'lsa — ruxsat etilgan birinchi tilga o'tamiz.
  // Qayta yuklangach lang ro'yxatda bo'ladi, ya'ni takror reload bo'lmaydi.
  (function(){
    try {
      const on = enabledLangs();
      if (on.indexOf(lang) < 0) { localStorage.setItem('tstm_site_lang', on[0]); location.reload(); }
    } catch{}
  })();
  // Til almashtirgich tugmalari — faqat yoqilgan tillar
  const LANG_LABEL = { uz: "O'zbekcha", ru: 'Русский', en: 'English' };
  function langButtons(cls){
    return enabledLangs().map(l =>
      `<span class="${lang === l ? 'on' : ''}" data-l="${l}" role="button" tabindex="0" aria-label="${esc(LANG_LABEL[l])}" aria-pressed="${lang === l}">${l.toUpperCase()}</span>`
    ).join('');
  }

  // ---------- nav model ----------
  // 2026-08-04: menyu 7 banddan 4 banga qayta guruhlandi (bosh sahifadagi
  // "index.html" dagi qo'lda yozilgan menyu bilan BIR XIL bo'lishi
  // shart — u alohida nusxa, o'zgartirsangiz ikkalasini ham yangilang).
  // `keys` — qaysi sahifalarda bu band "active" bo'lib yonishi. Bir band bir
  // nechta sahifaga javob beradi (masalan Voqealar = tadbirlar + uchrashuvlar),
  // chunki alohida menyu bandlari olib tashlandi, sahifalar esa qoldi.
  const NAV = [
    // `group: true` — bu band SAHIFA EMAS, faqat ochiluvchi ro'yxat sarlavhasi
    // (2026-08-19). Bosilganda hech qayerga o'tmaydi, ostidagi 4 bo'lim ochiladi.
    // Ilgari u `markaz-haqida.html` ga olib borardi; o'sha sahifaning kontenti
    // `biz-kimmiz.html` ga ko'chirildi, eski manzil esa o'sha yerga yo'naltiradi.
    { tk: 'nav_about', group: true, keys: ['about','who','partners'], children: [
      { tk: 'nav_about_who',      href: 'biz-kimmiz.html' },
      { tk: 'nav_about_leadership', href: 'rahbariyat.html' },
      { tk: 'nav_about_experts',  href: 'ekspertlar.html' },
      { tk: 'nav_about_partners', href: 'hamkorlar.html' }
    ]},
    { tk: 'nav_happenings', href: 'tadbirlar.html', keys: ['events','meetings','roundtables','conferences','life'], children: [
      { tk: 'nav_ev_meetings', href: 'uchrashuvlar.html' },
      { tk: 'nav_ev_roundtables', href: 'davra-suhbatlari.html' },
      { tk: 'nav_ev_conferences', href: 'konferensiyalar.html' },
      { tk: 'nav_ev_life', href: 'markaz-hayoti.html' }
    ]},
    // 2026-08-12: "Tahlillar" -> "Tadqiqotlar"ga o'zgardi (nav_analytics'ning
    // matni i18n.js da). Ichidagi eski "Hisobotlar" bandi endi "Tahlillar" deb
    // ataladi (kalit — nav_an_reports — ATAYLAB o'zgarmadi, faqat matni;
    // nav_hap_experts'ni Media'ga ko'chirganda ham xuddi shu naqsh ishlatilgan
    // edi). Yangi "Ma'ruzalar" bandi qo'shildi.
    { tk: 'nav_analytics', href: 'nashrlar.html', keys: ['pubs','research'], children: [
      { tk: 'nav_an_articles', href: 'maqolalar.html' },
      { tk: 'nav_an_lectures', href: 'maruzalar.html' },
      { tk: 'nav_an_reports', href: 'tahlillar.html' },
      { tk: 'nav_an_books', href: 'kitoblar.html' }
    ]},
    // 2026-08-12: "Bizning ekspertlarimiz OAVlarda" Voqealar'dan bu yerga
    // ko'chirildi (birinchi band) — mazmunan Media bilan bir xil toifa.
    { tk: 'nav_media', href: 'media.html', keys: ['media','oav'], children: [
      { tk: 'nav_hap_experts', href: 'oav.html' },
      { tk: 'nav_media_photo', href: 'media.html?tab=photo' },
      { tk: 'nav_media_video', href: 'media.html?tab=video' },
      { tk: 'nav_media_info', href: 'media.html?tab=info' }
    ]},
    // Ochiluvchi ro'yxatsiz yakka band — to'g'ridan-to'g'ri aloqa sahifasiga.
    // Footer bunday bandlarni ustun qilib chizmaydi (renderFooter'dagi filter).
    { tk: 'nav_contact', href: 'aloqa.html', keys: ['contact'] }
  ];

  const ICON = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3" stroke-linecap="round"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.4 4.4l1.4 1.4M18.2 18.2l1.4 1.4M2.5 12h2M19.5 12h2M4.4 19.6l1.4-1.4M18.2 5.8l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
    burger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    a11y: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    tg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 4.3 2.9 11.4c-.9.4-.9 1.6.1 1.9l4.6 1.4 1.8 5.6c.2.7 1.1.9 1.6.3l2.5-2.5 4.7 3.5c.6.4 1.4 0 1.5-.7L23 5.4c.2-.9-.7-1.5-1.5-1.1Z"/></svg>',
    yt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.2-.4-4.7c-.2-.8-.9-1.5-1.7-1.7C19.4 5.2 12 5.2 12 5.2s-7.4 0-8.9.4c-.8.2-1.5.9-1.7 1.7C1 8.8 1 12 1 12s0 3.2.4 4.7c.2.8.9 1.5 1.7 1.7 1.5.4 8.9.4 8.9.4s7.4 0 8.9-.4c.8-.2 1.5-.9 1.7-1.7C23 15.2 23 12 23 12ZM9.8 15.3V8.7l6 3.3-6 3.3Z"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-6.6 7.5L21.7 21h-6l-4.7-6.1L5.6 21H2.5l7-8L2 3h6.2l4.2 5.6L17.5 3Zm-1 16h1.6L7.6 4.7H5.9L16.5 19Z"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" stroke="none"/></svg>',
    li: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C21.4 8.65 22 10.9 22 14v7h-4v-6.2c0-1.5-.03-3.4-2.08-3.4-2.08 0-2.4 1.6-2.4 3.3V21h-4V9Z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7.2 8.5 6 8.5-6"/></svg>'
  };

  /* Sozlamalardagi ijtimoiy tarmoqlar — BITTA joyda. Ilgari bu ro'yxat
     footerda ham, aloqa sahifasida ham alohida yozilgan edi: yangi tarmoq
     qo'shilsa, biri yangilanib ikkinchisi eskicha qolib ketardi.
     Bo'sh yoki "#" qiymat = tarmoq yo'q, chizilmaydi. */
  function socialLinks(){
    const soc = settings().social || {};
    return [
      { u: soc.telegram,  i: ICON.tg, n: 'Telegram' },
      { u: soc.youtube,   i: ICON.yt, n: 'YouTube' },
      { u: soc.facebook,  i: ICON.fb, n: 'Facebook' },
      { u: soc.x,         i: ICON.x,  n: 'X' },
      { u: soc.instagram, i: ICON.ig, n: 'Instagram' },
      { u: soc.linkedin,  i: ICON.li, n: 'LinkedIn' }
    ].filter(l => l.u && l.u !== '#');
  }

  /* Mualliflik qatori: sozlamada {yil} bo'lsa joriy yilga almashadi —
     shunda yil o'zgarganda hech kim hech narsani qo'lda tuzatmaydi. */
  function copyrightText(){
    const v = mlGet(settings().copyright) || T('footer_copyright');
    return String(v).replace(/{(yil|year|god|год)}/gi, new Date().getFullYear());
  }

  // ---------- THEME ----------
  const THEME_KEY = 'tstm_site_theme';
  function applyTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    document.querySelectorAll('.theme-tog').forEach(b => b.innerHTML = t === 'dark' ? ICON.sun : ICON.moon);
  }
  // Tashrifchi o'zi tanlagan tema ustun; tanlamagan bo'lsa — admindagi standart tema.
  let theme = 'light';
  try { theme = localStorage.getItem(THEME_KEY) || settings().theme || 'light'; } catch{}
  // apply immediately (before render) to avoid flash
  document.documentElement.setAttribute('data-theme', theme);
  window.TSTM_SITE_THEME = theme; // a11y.js shu qiymatni hurmat qiladi (admin standart temasi yo'qolmasin)
  function toggleTheme(){
    theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, theme); } catch{}
    window.TSTM_SITE_THEME = theme;
    applyTheme(theme);
  }

  // ---------- HEADER ----------
  function renderHeader(activeKey){
    const s = settings();
    const B = brandLines(), SN = shortName();
    // <title> dagi qisqa nom ("Yangiliklar — TSTM") ham sozlamadan kelsin
    document.title = document.title.replace(/—\s*TSTM\s*$/, '— ' + SN);
    const navHTML = NAV.map(n => {
      const car = n.children ? ' <i class="car"></i>' : '';
      const drop = n.children ? '<div class="drop">' + n.children.map(c => `<a href="${c.href}">${esc(T(c.tk))}</a>`).join('') + '</div>' : '';
      const active = (n.keys || [n.key]).indexOf(activeKey) >= 0 ? ' active' : '';
      // Sahifasi yo'q band (`group`) <a> emas, <span role=button> bo'ladi:
      // bosilganda ro'yxat ochiladi, hech qayerga o'tilmaydi. Klaviatura va
      // skrin-riderlar uchun aria-haspopup/aria-expanded qo'yiladi.
      const label = n.group
        ? `<span role="button" tabindex="0" aria-haspopup="true" aria-expanded="false">${esc(T(n.tk))}${car}</span>`
        : `<a href="${n.href}">${esc(T(n.tk))}${car}</a>`;
      return `<div class="item${active}${n.group ? ' is-group' : ''}">${label}${drop}</div>`;
    }).join('');

    const el = document.createElement('header');
    el.id = 'hdr';
    el.className = 'solid';
    el.innerHTML = `
      <div class="util"><div class="wrap">
        <span>${esc(T('util_country'))}</span>
        <a href="mailto:${esc(s.email||'info@cfps.uz')}">${esc(s.email||'info@cfps.uz')}</a>
        <a href="tel:${esc((s.phone||'').replace(/\s/g,''))}">${esc(s.phone||'+998 71 239 36 55')}</a>
        <span class="sp"></span>
        <div class="langs" role="group" aria-label="Til / Язык / Language">${langButtons()}</div>
      </div></div>
      <div class="bar"><div class="wrap">
        <a class="brand brand-row" href="index.html" aria-label="${esc(SN)}">
          <img class="logo logo-c" src="img/logo-mark.png" alt="${esc(SN)}">
          <span class="divider"></span>
          <span class="nm"><b>${esc(B.top)}</b><small>${esc(B.bot)}</small></span>
        </a>
        <nav class="main" aria-label="${esc(T('a11y_mainnav')||'Asosiy menyu')}">
          ${navHTML}
          <div class="ic theme-tog" title="Rejim" role="button" tabindex="0" aria-label="${esc(T('theme_toggle')||'Yorug\u2018/quyuq rejim')}"></div>
          <div class="ic a11y-btn" title="${esc(T('a11y_title'))}" role="button" tabindex="0" aria-label="${esc(T('a11y_title'))}">${ICON.a11y}</div>
          <a class="ic" href="#" data-gs-open role="button" title="${esc(T('search_title'))}" aria-label="${esc(T('search_title'))}">${ICON.search}</a>
        </nav>
        <div class="nav-burger" id="navBurger" role="button" tabindex="0" aria-label="${esc(T('a11y_menu')||'Menyu')}" aria-expanded="false">${ICON.burger}</div>
      </div></div>`;
    document.body.prepend(el);
    // skip-to-content havola (WCAG: klaviatura foydalanuvchilari uchun)
    if (!document.getElementById('skip-link')) {
      const sk = document.createElement('a');
      sk.id = 'skip-link'; sk.href = '#main-content'; sk.className = 'skip-link';
      sk.textContent = T('a11y_skip') || 'Asosiy kontentga o\u2018tish';
      document.body.prepend(sk);
    }
    var mainEl = document.querySelector('main'); if (mainEl && !mainEl.id) { mainEl.id = 'main-content'; mainEl.setAttribute('role','main'); }

    // logo override from settings (til bo'yicha) + standart 3 tilli marka
    const DEFLOGO = { uz: 'img/logo-mark.png', ru: 'img/logo-mark-ru.png', en: 'img/logo-mark-en.png' };
    const lg = (s.logos && s.logos[lang]) || s.logo || DEFLOGO[lang] || DEFLOGO.uz;
    if (lg) el.querySelectorAll('.brand .logo').forEach(img => img.src = lg);

    // mobile drawer
    const drawer = document.createElement('div');
    drawer.className = 'mnav';
    // Drawer boshida til almashtirgich + tema tugmasi (mobil foydalanuvchi uchun — bosh sahifadagidek)
    drawer.innerHTML =
      `<div class="mnav-head">
        <span class="ic theme-tog" role="button" tabindex="0" aria-label="${esc(T('theme_toggle')||'Yorug‘/quyuq rejim')}"></span>
        <span class="ic a11y-btn" role="button" tabindex="0" title="${esc(T('a11y_title'))}" aria-label="${esc(T('a11y_title'))}">${ICON.a11y}</span>
        <a class="ic" href="#" data-gs-open role="button" title="${esc(T('search_title'))}" aria-label="${esc(T('search_title'))}">${ICON.search}</a>
        <div class="mnav-langs" role="group" aria-label="Til / Язык / Language">${langButtons()}</div>
        <div class="close" id="mClose" role="button" tabindex="0" aria-label="${esc(T('close')||'Yopish')}">${ICON.close}</div>
      </div>` +
      NAV.map(n => (n.group
          ? `<div class="mgroup">${esc(T(n.tk))}</div>`
          : `<a href="${n.href}">${esc(T(n.tk))}</a>`) +
        (n.children ? n.children.map(c => `<a class="sub" href="${c.href}">${esc(T(c.tk))}</a>`).join('') : '')
      ).join('');
    document.body.appendChild(drawer);
    const closeDrawer = () => { drawer.classList.remove('open'); el.querySelector('#navBurger').setAttribute('aria-expanded','false'); document.body.style.overflow=''; };
    el.querySelector('#navBurger').addEventListener('click', ()=> { drawer.classList.add('open'); el.querySelector('#navBurger').setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; });
    drawer.querySelector('#mClose').addEventListener('click', closeDrawer);
    // Menyu havolasi / utilita tugmasi bosilganda drawer yopilsin (a11y & qidiruv panel ustidan ochilsin)
    drawer.querySelectorAll('a, .a11y-btn').forEach(a => a.addEventListener('click', closeDrawer));

    // ---------- Ochiluvchi ro'yxat: BOSISH bilan ochish ----------
    // Desktopda ro'yxat hover bilan ochiladi (CSS), lekin sahifasi yo'q "guruh"
    // bandi (`NAV[].group`) uchun bosish ham ishlashi SHART: sensorli ekranda
    // hover yo'q, va band endi hech qayerga olib bormaydi — bosishga javob
    // bermasa foydalanuvchi uni "buzuq" deb o'ylaydi.
    const groups = el.querySelectorAll('nav.main .item.is-group');
    const closeGroups = (except) => groups.forEach(g => {
      if (g === except) return;
      g.classList.remove('open');
      const b = g.querySelector('[aria-expanded]'); if (b) b.setAttribute('aria-expanded', 'false');
    });
    groups.forEach(g => {
      const btn = g.querySelector('[role=button]');
      if (!btn) return;
      const toggle = () => {
        const on = !g.classList.contains('open');
        closeGroups(g);
        g.classList.toggle('open', on);
        btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      };
      btn.addEventListener('click', toggle);
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
      // Sichqoncha banddan chiqib ketganda ochiq holat osilib qolmasin
      // (hover bilan ochilgan ro'yxat ustiga bosilsa .open qo'shilib qolardi).
      g.addEventListener('mouseleave', () => closeGroups());
    });
    if (groups.length){
      document.addEventListener('click', (e) => {
        // `closest` faqat elementlarda bor — hujjat/oyna nishoniga tushsa ham
        // xatosiz ishlashi uchun metodning o'zi tekshiriladi.
        const t = e.target;
        if (!t || typeof t.closest !== 'function' || !t.closest('nav.main .item.is-group')) closeGroups();
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeGroups(); });
    }

    // theme toggles
    applyTheme(document.documentElement.getAttribute('data-theme'));
    document.querySelectorAll('.theme-tog').forEach(b => b.addEventListener('click', toggleTheme));
    // language (header util paneli + mobil drawer ichidagi tugmalar)
    document.querySelectorAll('.langs span, .mnav-langs span').forEach(sp => {
      const go = () => { try { localStorage.setItem('tstm_site_lang', sp.dataset.l); } catch{} location.reload(); };
      sp.addEventListener('click', go);
      sp.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    // klaviatura: ic role=button elementlari Enter/Space bilan ishlasin (header + drawer)
    el.querySelectorAll('.ic[role=button], #navBurger').forEach(b => {
      b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); } });
    });
    drawer.querySelectorAll('.ic[role=button], #mClose').forEach(b => {
      b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); } });
    });
    // Escape bilan drawer yopilsin
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer(); });

    // Header BALANDLIGI CSS o'zgaruvchisiga yoziladi: bo'lim navigatsiyasi
    // (.secnav) aynan uning ostiga yopishishi kerak, balandlik esa ekran
    // kengligiga qarab o'zgaradi — qattiq raqam yozib bo'lmaydi.
    // O'lchov DARHOL olinadi: header allaqachon DOMda (prepend qilingan), va
    // requestAnimationFrame fonda turgan oynada umuman chaqirilmaydi — o'sha
    // yo'l bilan qilinganda o'zgaruvchi bo'sh qolib, .secnav header ostiga
    // kirib ketardi. Keyingi o'zgarishlar (oyna kengligi, shrift kattaligi)
    // uchun kuzatuvchilar qo'shiladi.
    const setHdrH = () => document.documentElement.style.setProperty('--hdr-h', el.offsetHeight + 'px');
    setHdrH();
    w.addEventListener('resize', setHdrH);
    if (w.ResizeObserver) { try { new ResizeObserver(setHdrH).observe(el); } catch{} }

    // Brend matnini joyga moslash (layout hisoblangandan keyin + oyna o'lchami o'zgarganda)
    requestAnimationFrame(fitBrand);
    let fitT; w.addEventListener('resize', () => { clearTimeout(fitT); fitT = setTimeout(fitBrand, 150); });
  }

  // ---------- FOOTER ----------
  // Havola ustunlari yuqoridagi NAV massividan chiziladi — menyu o'zgarsa footer
  // o'zi ergashadi. Ilgari ular qo'lda yozilgani uchun menyu qayta guruhlangach
  // footer eski bo'limlarni (Tadqiqotlar/Nashrlar) ko'rsatib qolgan edi.
  // Alohida "Aloqa" USTUNI ataylab yo'q (menyuda "Aloqa" bandi bor, telefon esa
  // tepadagi util qatorida). Manzil bilan e-pochta `.f-meta` blokida — 4 havola
  // ustunidan KEYIN chiziladi va CSS orqali (`.f-top>.f-meta`, site.css) ular
  // OSTIGA joylashadi (2026-08-12: ilgari brend ustuni ichida, chapda edi).
  /* Huquqiy havolalar. Sozlamada manzil ko'rsatilmagan bo'lsa havola
     CHIZILMAYDI — ilgari ikkalasi ham href="#" bo'lib, bosilganda sahifa
     joyida qolardi va tashrifchi havola buzuq deb o'ylardi. */
  function legalLinks(){
    const lg = settings().legal || {};
    const a = [
      { u: lg.privacy, tk: 'footer_privacy' },
      { u: lg.terms,   tk: 'footer_terms' }
    ].filter(l => l.u && String(l.u).trim() && l.u !== '#')
     .map(l => `<a href="${safeUrl(l.u)}">${esc(T(l.tk))}</a>`).join('');
    return a ? `<div class="foot-links">${a}</div>` : '';
  }

  function renderFooter(){
    const s = settings();
    const B = brandLines(), SN = shortName();
    const el = document.createElement('footer');
    el.innerHTML = `<div class="wrap">
      <div class="f-top">
        <div>
          <div class="f-brand">
            <img class="flogo-c" src="${(s.logos && s.logos[lang]) || s.logo || ({uz:'img/logo-mark.png',ru:'img/logo-mark-ru.png',en:'img/logo-mark-en.png'}[lang]) || 'img/logo-mark.png'}" alt="${esc(SN)}">
            <img class="flogo-w" src="img/logo-mark-white.png" alt="${esc(SN)}">
            <span class="fd"></span>
            <span><b>${esc(B.top)}</b><small>${esc(B.bot)}</small></span>
          </div>
          <p class="f-about">${esc(mlGet(s.footerAbout) || T('footer_about'))}</p>
          <div class="socials">${socialLinks()
            .map(l => `<a href="${safeUrl(l.u)}" target="_blank" rel="noopener" aria-label="${l.n}">${l.i}</a>`).join('')}</div>
        </div>
        ${NAV.filter(n => n.children && n.children.length).map(n => `<div class="f-col"><h5>${esc(T(n.tk))}</h5>${
          n.children.map(c => `<a href="${c.href}">${esc(T(c.tk))}</a>`).join('')
        }</div>`).join('')}
        <!-- Manzil/e-pochta. 2026-08-12: brend ustunidan bu yerga ko'chirildi —
             endi sayt arxitekturasi (havola ustunlari) OSTIDA turadi
             (CSS: .f-top greater-than .f-meta, site.css). -->
        <div class="f-meta">
          <div>${ICON.pin}<span>${esc(mlGet(s.address)||"Toshkent sh., O'zbekiston")}</span></div>
          <div>${ICON.mail}<a href="mailto:${esc(s.email||'info@cfps.uz')}">${esc(s.email||'info@cfps.uz')}</a></div>
        </div>
      </div>
      <div class="f-bot">
        <span>${esc(copyrightText())}</span>
        ${legalLinks()}
      </div>
    </div>`;
    document.body.appendChild(el);
  }

  // ---------- reveal-on-scroll ----------
  function initReveal(){
    if (!('IntersectionObserver' in window)) {
      // juda eski brauzer — animatsiyasiz bo'lsa ham kontent ko'rinsin
      document.querySelectorAll('.rv').forEach(el=>el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((es)=>{
      es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    },{threshold:.1, rootMargin:'0px 0px -6% 0px'});
    document.querySelectorAll('.rv').forEach(el=>io.observe(el));
  }

  /* ---------- Kontent turlari: "qaysi sahifada ko'rinadi" ----------
     Jadvalning O'ZI `content-kinds.js` da (2026-08-20 da shu yerdan ko'chirildi)
     Sabab: admin panel ham xuddi shu moslikka muhtoj, lekin u site-common.js
     ni yuklamaydi. Bu yerda faqat qayta e'lon: mavjud `Site.eventKind(...)`
     chaqiruvlari o'zgarmasin.

     Fayl yuklanmagan bo'lsa sayt YIQILMAYDI: barcha voqea/nashr o'zining
     umumiy sahifasida (tadbirlar.html / nashrlar.html) ko'rinaveradi. */
  const CK = w.ContentKinds || {};
  const EVENT_KINDS = CK.EVENT_KINDS || [];
  const PUB_KINDS   = CK.PUB_KINDS   || [];
  const eventKind     = CK.eventKind     || (() => null);
  const eventKindById = CK.eventKindById || (() => null);
  const pubKind       = CK.pubKind       || (() => null);
  const pubKindById   = CK.pubKindById   || (() => null);

  // ---------- Bo'lim ichi navigatsiyasi (section rail) ----------
  // "Markaz haqida" menyusi endi sahifasiz GURUH (NAV[].group) — bo'limning
  // 4 sahifasi o'rtasida yurish uchun ilgari hub sahifa (markaz-haqida.html)
  // xizmat qilardi, u esa `biz-kimmiz.html` ga birlashtirildi. Uning o'rnini
  // banner ostidagi shu qator bosadi: tashrifchi qaysi bo'limda turganini
  // ko'radi va bir bosishda qardosh sahifaga o'tadi.
  //
  // Ro'yxat NAV dan olinadi — menyu o'zgarsa bu qator ham o'zgaradi, alohida
  // nusxa saqlanmaydi. Faqat `group` bandlar uchun chiziladi: sahifasi BOR
  // bo'limlarda (Voqealar, Tadqiqotlar, Media) o'sha sahifaning o'zi shu
  // vazifani bajaradi.
  function currentFile(){
    return decodeURIComponent((location.pathname.split('/').pop() || 'index.html').toLowerCase());
  }
  function renderSectionNav(){
    const file = currentFile();
    const grp = NAV.find(n => n.group && (n.children || []).some(c => c.href.split('?')[0].toLowerCase() === file));
    if (!grp) return;
    const banner = document.querySelector('.page-banner');
    if (!banner || document.querySelector('.secnav')) return;
    const el = document.createElement('nav');
    el.className = 'secnav';
    el.setAttribute('aria-label', T(grp.tk));
    el.innerHTML = '<div class="wrap"><span class="secnav-t">' + esc(T(grp.tk)) + '</span>'
      + grp.children.map(c => {
          const on = c.href.split('?')[0].toLowerCase() === file;
          return `<a href="${c.href}"${on ? ' class="on" aria-current="page"' : ''}>${esc(T(c.tk))}</a>`;
        }).join('')
      + '</div>';
    banner.insertAdjacentElement('afterend', el);
  }

  // ---------- Non ushoqlari (breadcrumb) ----------
  // Zanjir MENYUDAN (NAV) quriladi va boshqa hech qayerdan emas.
  //
  // NEGA (2026-08-24): ilgari har bir sahifa o'z zanjirini qo'lda yozardi va
  // yozuv sahifalari (nashr/tadbir/sharh/ekspert) zanjirning oxiriga
  // KONTENTNING O'Z TOIFASINI qo'yardi — "Bosh sahifa / Nashrlar / Siyosat"
  // kabi. Na "Nashrlar", na "Siyosat" menyuda bor: birinchisi menyuda
  // "Tadqiqotlar" deb ataladi, ikkinchisi esa umuman bo'lim emas, admin
  // kiritadigan erkin yorliq. Tashrifchi zanjirni bosib borsa, mavjud
  // bo'lmagan bo'limga ishonib qolardi.
  //
  // Endi qoida bitta: zanjirdagi HAR BIR band — menyuda haqiqatan bor
  // bo'lim. Oxirgi band joriy sahifaning O'ZI bo'lsa havola emas (u yerdasiz),
  // aks holda havola (yozuv sahifasidan ro'yxatga qaytish yo'li).
  //
  // Menyuda yo'q, lekin bo'limga tegishli sahifalar shu yerda qo'lda
  // bog'lanadi — ular menyuda ko'rinmaydi, ammo zanjirda o'z o'rni bor.
  const CRUMB_EXTRA = {
    'tadqiqotlar.html': [{ tk:'nav_analytics', href:'nashrlar.html' }, { tk:'p_research_title', href:'tadqiqotlar.html' }],
    'yonalish.html':    [{ tk:'nav_analytics', href:'nashrlar.html' }, { tk:'p_research_title', href:'tadqiqotlar.html' }]
  };
  function crumbTrail(file){
    for (const top of NAV){
      const th = (top.href || '').split('?')[0].toLowerCase();
      if (th && th === file) return [{ tk: top.tk, href: top.href }];
      for (const ch of (top.children || [])){
        if (ch.href.split('?')[0].toLowerCase() === file){
          // `group` bandning sahifasi yo'q — matn bo'lib qoladi, havola emas.
          return [{ tk: top.tk, href: top.group ? '' : top.href }, { tk: ch.tk, href: ch.href }];
        }
      }
    }
    return CRUMB_EXTRA[file] || null;
  }
  // file — zanjir QAYSI sahifagacha borishi (yozuv sahifasida: uning ro'yxati).
  // tail — oxiriga qo'shiladigan erkin matn (ism, sarlavha). Havola bo'lmaydi.
  function crumbHTML(file, tail){
    const cur = currentFile();
    const trail = crumbTrail(String(file || cur).toLowerCase());
    let h = `<a href="index.html" data-i18n="home">${esc(T('home'))}</a>`;
    (trail || []).forEach(p => {
      const same = p.href && p.href.split('?')[0].toLowerCase() === cur;
      const lab = esc(T(p.tk));
      h += '<span class="sep">/</span>';
      h += (p.href && !same)
        ? `<a href="${p.href}" data-i18n="${p.tk}">${lab}</a>`
        : `<span data-i18n="${p.tk}">${lab}</span>`;
    });
    if (tail) h += `<span class="sep">/</span><span>${esc(tail)}</span>`;
    return h;
  }
  // Statik sahifalarning HTML dagi zanjirini shu qoidaga moslab qayta chizadi.
  // Yozuv sahifalari (nashr.html va h.k.) NAV da yo'q — ularga tegilmaydi,
  // ular Site.crumbHTML() ni o'zlari, o'z ro'yxat sahifasi bilan chaqiradi.
  function renderCrumb(){
    const el = document.querySelector('.page-banner .crumb');
    if (!el || !crumbTrail(currentFile())) return;
    // yonalish.html oxirgi bandni o'zi yozadi (#cr) — uni saqlab qolamiz.
    const keep = el.querySelector('#cr');
    el.innerHTML = crumbHTML();
    if (keep){
      el.insertAdjacentHTML('beforeend', '<span class="sep">/</span>');
      el.appendChild(keep);
    }
  }

  // ---------- banner background ----------
  // sahifa fayli -> banner kaliti
  const BANNER_MAP = {
    'tadbirlar.html':'events',
    'uchrashuvlar.html':'events','davra-suhbatlari.html':'events','konferensiyalar.html':'events','markaz-hayoti.html':'events',
    'nashrlar.html':'pubs','nashr.html':'pubs','tadqiqotlar.html':'research','yonalish.html':'research',
    // "Tahlillar" bo'limining uch sahifasi nashrlar bilan bir xil bannerni oladi
    'tahlillar.html':'pubs','maqolalar.html':'pubs','kitoblar.html':'pubs','maruzalar.html':'pubs',
    'biz-kimmiz.html':'about','rahbariyat.html':'leadership','ekspertlar.html':'experts','hamkorlar.html':'about','media.html':'media',
    // Xodim sahifasi: `active` kaliti 'about' (peshtoq) edi — odam sahifasiga
    // bino rasmi mos kelmaydi, ekspertlar tarmog'i mos keladi.
    'expert.html':'experts',
    'aloqa.html':'contact','qidiruv.html':'search',
    'oav.html':'oav','sharh.html':'oav'
  };
  // Har bo'limning STANDART banneri — `img/banners/` dagi vektor infografikalar
  // (`tools\bannerlar-yasa.php` yasaydi). Admin panelda uya bo'sh bo'lsa shu
  // ishlatiladi; admin o'z rasmini yuklasa, u ustidan yozadi.
  // NEGA KERAK: aks holda sozlamalar bo'sh bo'lgan har bir sahifa tekis ko'k
  // fon bilan ochilardi va 10 ta bannerni qo'lda yuklamaguncha shunday qolardi.
  const BANNER_DEF = {
    events:1, pubs:1, research:1, about:1, leadership:1,
    experts:1, media:1, contact:1, search:1, oav:1
  };
  function applyBanner(activeKey){
    const banners = (settings() || {}).banners || {};
    const file = decodeURIComponent((location.pathname.split('/').pop() || '').toLowerCase());
    const key = BANNER_MAP[file] || activeKey;
    if (!key) return;
    let url = banners[key];
    const CK = 'tstm_banner_' + key;
    const loadedOk = banners && Object.keys(banners).length > 0; // store yuklandi
    try {
      if (url) localStorage.setItem(CK, url);
      else if (loadedOk) localStorage.removeItem(CK); // admin o'chirgan — zaxirani tozalaymiz
      else url = localStorage.getItem(CK) || ''; // store bo'sh (reload lahzasi) — zaxiradan
    } catch{}
    if (!url && BANNER_DEF[key]) url = 'img/banners/' + key + '.svg';
    const el = document.querySelector('.page-banner');
    if (el && url){
      el.classList.add('has-img');
      // TUZOQ (2026-08-24 da topildi): CSS o'ZGARUVCHISI ichidagi nisbiy
      // `url()` brauzerda HUJJATGA emas, o'zgaruvchi ISHLATILGAN stylesheet
      // manziliga nisbatan hisoblanadi. `background-image:var(--banner-img)`
      // esa `css/site.css` da — ya'ni `uploads/x.jpg` deb bersak, brauzer
      // `css/uploads/x.jpg` ni so'raydi va 404 oladi. Shu sabab admin
      // yuklagan bannerlar HECH QACHON ko'rinmagan: sahifa tekis ko'k
      // qolaverib, sabab ko'rinmas edi (xato konsolda ham chiqmaydi).
      // Yechim: to'liq (mutlaq) manzilga aylantiramiz — u holda hech qanday
      // "nisbatan" qolmaydi. new URL() manzilni o'zi to'g'ri kodlaydi.
      let abs = url;
      try { abs = new URL(url, document.baseURI).href; } catch{}
      el.style.setProperty('--banner-img', `url("${abs.replace(/"/g, '%22')}")`);
    }
  }

  // ---------- Obuna (subscribe) modali ----------
  // Mantiq subscribe.js faylida (bosh sahifa ham shundan foydalanadi).
  // Bu yerda nusxa TUTMANG — ilgari ikkita nusxa bo'lgani uchun bosh
  // sahifada eski e-pochtali oyna qolib ketgan edi.

  /* ---------- Chop etish: rasmiy blank (letterhead) ----------
     Ikkita chop etish yo'li bor va IKKALASI ham shu blankni ishlatadi:
       1) "Chop etish" tugmasi -> printDoc() -> yashirin iframe + print.css;
       2) brauzerning o'z chop etishi (Ctrl+P) -> sahifadagi `.print-head` /
          `.print-foot` bloklari + site.css dagi @media print.
     Markaz nomi HAMISHA admin sozlamasidan (`settings.siteName`) olinadi.
     2026-08-20 gacha `.print-head` to'rtta page-*.js da alohida-alohida
     yasalar va nomni i18n'dagi qotib qolgan T('org_name') dan olardi — ya'ni
     admin nomni almashtirsa ham qog'ozda ESKI nom chiqaverardi (ruschada esa
     nomning faqat yarmi). Endi manba bitta: shu ikki funksiya. */
  function printHeadHTML(){
    const B = brandLines();
    return '<div class="print-head"><img src="' + safeUrl(brandLogo()) + '" alt="">'
         + '<div class="ph-txt"><b>' + esc(B.top) + '</b><span>' + esc(B.bot) + '</span></div></div>';
  }
  // extra — qo'shimcha o'rta ustun (masalan ekspert sharhidagi "Asl nashr").
  function printFootHTML(extra){
    return '<div class="print-foot"><span>' + esc(T('print_source')) + ': ' + esc(location.href) + '</span>'
         + (extra || '')
         + '<span>' + esc(T('print_date')) + ': ' + esc(fmtDate(new Date().toISOString().slice(0, 10))) + '</span></div>';
  }

  /* Ro'yxat sahifalari (hamkorlar, rahbariyat, tadbirlar, tadqiqotlar, biz
     kimmiz...) o'z CSS'ida chop etishda `header, footer, .page-banner` ni
     yashiradi. Natijada qog'ozda na idora nomi, na sahifa sarlavhasi qolardi —
     kimdan kelgani noma'lum kartalar ro'yxati chiqardi. Shu sabab blankni
     `initPage()` da BARCHA ichki sahifaga qo'yamiz; batafsil sahifalar uni
     o'zi qo'ygan bo'lsa (`.print-head` allaqachon bor) tegmaymiz. */
  function injectPrintFrame(){
    const main = document.querySelector('main');
    if (!main || main.querySelector('.print-head')) return;
    const h1 = main.querySelector('.page-banner h1');
    const wrap = document.createElement('div');
    wrap.className = 'print-frame-top';
    wrap.innerHTML = printHeadHTML()
      + (h1 ? '<div class="print-title">' + esc(h1.textContent.trim()) + '</div>' : '');
    main.insertBefore(wrap, main.firstChild);
    const foot = document.createElement('div');
    foot.className = 'print-frame-bot';
    foot.innerHTML = printFootHTML();
    main.appendChild(foot);
  }

  // ---------- Chop etish (print) — toza, mustaqil hujjat ----------
  // Sahifaning murakkab tuzilishiga bog'liq bo'lmasligi uchun chop qilinadigan
  // kontentni yashirin iframe ichida yangidan, toza tartibda quramiz va o'shani chop qilamiz.
  function printDoc(opts){
    opts = opts || {};
    var abs = function (u) { try { return u ? new URL(u, location.href).href : ''; } catch { return u || ''; } };
    var _b = brandLines(); var org = _b.top, tag = _b.bot;
    var date = fmtDate(new Date().toISOString().slice(0, 10));
    // Logo joriy tilga qarab tanlanadi (sarlavha/matn tarjima bo'lgani kabi).
    var logo = abs(brandLogo());
    var img = opts.image ? abs(opts.image) : '';

    // Chop etish uslublari endi tashqi print.css'da (CSP: iframe ota-sahifa
    // CSP'sini meros oladi, inline <style> bloklanadi — 'self' link ruxsat).
    // Iframe about:blank bo'lgani uchun nisbiy URL ishlamaydi -> abs() bilan.
    // Versiya SHART: bu fayl HTML'da <link> bilan ulanmagani uchun boshqa
    // joyda kesh buzilmaydi — o'zgartirsangiz raqamni oshiring.
    var cssHref = abs('css/print.css?v=4');

    // Asl manba (tashqi nashr havolasi) — ekspert sharhlarida hujjatning
    // ishonchliligi uchun muhim, shuning uchun footerga chiqadi.
    var origin = opts.sourceUrl ? '<span>' + esc(T('print_orig')) + ': ' + esc(opts.sourceUrl) + '</span>' : '';

    var html = ''
      + '<div class="ph">' + (logo ? '<img src="' + logo + '" alt="">' : '') + '<div><b>' + esc(org) + '</b><span>' + esc(tag) + '</span></div></div>'
      + '<h1>' + esc(opts.title || '') + '</h1>'
      + (opts.meta ? '<div class="meta">' + opts.meta + '</div>' : '')
      + (opts.byline ? '<div class="byline">' + opts.byline + '</div>' : '')
      + (opts.lead ? '<div class="lead">' + opts.lead + '</div>' : '')
      + (img ? '<div class="img"><img src="' + img + '" alt=""></div>' : '')
      + '<div class="content">' + (opts.content || '') + '</div>'
      + '<div class="foot"><span>' + esc(T('print_source')) + ': ' + esc(location.href) + '</span>' + origin + '<span>' + esc(T('print_date')) + ': ' + date + '</span></div>';

    // Shrift ta'riflari o'z serverimizdan (ilgari Google Fonts'dan kelardi).
    // Iframe ALOHIDA hujjat — ota-sahifadagi @font-face unga MEROS BO'LMAYDI,
    // shuning uchun fonts.css bu yerda qaytadan ulanishi shart. Aks holda
    // print.css dagi 'Montserrat' hech qachon yuklanmay, chop etilgan hujjat
    // zaxira shriftda chiqib ketardi.
    var fonts = '<link rel="stylesheet" href="' + abs('css/fonts.css?v=1') + '">';
    var ifr = document.createElement('iframe');
    ifr.setAttribute('aria-hidden', 'true');
    ifr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;';
    document.body.appendChild(ifr);
    var doc = ifr.contentWindow.document;
    doc.open();
    doc.write('<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8"><title>' + esc(opts.title || 'TSTM') + '</title>' + fonts + '<link rel="stylesheet" href="' + cssHref + '"></head><body>' + html + '</body></html>');
    doc.close();

    var printed = false;
    var go = function () {
      if (printed) return; printed = true;
      try { ifr.contentWindow.focus(); ifr.contentWindow.print(); } catch {}
      setTimeout(function () { try { ifr.remove(); } catch {} }, 1200);
    };
    // Chop qilishdan oldin IKKALASINI kutamiz: (1) print.css yuklanishi va
    // (2) rasm(lar). Ilgari faqat rasm kutilardi — uslub yetib ulgurmagan
    // holatda hujjat butunlay bezaksiz chiqib ketishi mumkin edi. Rasmsiz
    // sahifada esa qat'iy 350ms kutilardi, bu ham o'sha poygaga ochiq edi.
    var imgs = doc.images;
    var pending = 1 + (imgs ? imgs.length : 0); // 1 = uslub
    var tick = function () { if (--pending <= 0) go(); };
    var link = doc.querySelector('link[rel="stylesheet"][href*="print.css"]');
    if (!link) tick();
    else if (link.sheet) tick();               // kesh: allaqachon tayyor
    else { link.onload = tick; link.onerror = tick; }
    if (imgs) for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].complete) tick();
      else { imgs[i].onload = tick; imgs[i].onerror = tick; }
    }
    // Qat'iy chegara: nimadir osilib qolsa ham foydalanuvchi kutib qolmaydi.
    setTimeout(go, 2500);
  }

  // ---------- page bootstrap ----------
  // Har bir bosqich alohida himoyalangan: bittasi yiqilsa ham qolganlari
  // (ayniqsa initReveal) ishlashi SHART — aks holda .rv elementlar opacity:0
  // da qolib, sahifa "ko'rinmas" bo'ladi (2026-07-16 dagi api.php avariyasi saboqi).
  function initPage(opts){
    opts = opts || {};
    document.body.classList.add('inner');
    try { renderHeader(opts.active); } catch(e){ console.error('renderHeader:', e); }
    try { if (w.I18N) w.I18N.translate(document); } catch(e){ console.error(e); }
    if (typeof opts.render === 'function') {
      try { opts.render(); } catch(e){ console.error(e); }
    }
    try { renderCrumb(); } catch(e){ console.error('renderCrumb:', e); }
    try { applyBanner(opts.active); } catch(e){ console.error('applyBanner:', e); }
    try { renderSectionNav(); } catch(e){ console.error('renderSectionNav:', e); }
    try { renderFooter(); } catch(e){ console.error('renderFooter:', e); }
    try { injectPrintFrame(); } catch(e){ console.error('injectPrintFrame:', e); }
    try { if (w.I18N) w.I18N.translate(document); } catch(e){ console.error(e); }
    try { enhanceSelects(document); } catch(e){ console.error('enhanceSelects:', e); }
    initReveal();
    try { if (w.Subscribe) w.Subscribe.arm(); } catch(e){ console.error('subscribe:', e); }
  }

  // Obuna oynasi subscribe.js dan keladi; u yuklanmagan sahifada shunchaki jim turadi.
  function showSubscribe(){ if (w.Subscribe) w.Subscribe.show(); }

  /* ---------- Maxsus tanlagich (custom select) ----------
     MUAMMO: native <select> ning YOPIQ holatini uslublash mumkin, lekin
     bosilganda ochiladigan ro'yxatni operatsion tizim chizadi — unga
     border-radius BERIB BO'LMAYDI (Chrome/Firefox `option` radiusini
     e'tiborsiz qoldiradi). Shu sababli "Tahlillar" sahifalaridagi filtrlar
     bosilganda qirrali, sayt uslubiga yot ro'yxat chiqardi.

     YECHIM: native <select> DOMda QOLADI (mavjud kod uning `.value` va
     `change` hodisasiga tayanadi — page-nashrlar.js:122), faqat ko'rinishi
     yashiriladi. Ustiga o'z tugmamiz va ro'yxatimiz quriladi; tanlanganda
     native select'ning qiymati o'rnatilib, `change` yuboriladi.

     Variantlar keyinroq to'ldirilsa ham ishlasin deb MutationObserver bilan
     kuzatiladi — page-nashrlar.js ro'yxatni render paytida to'ldiradi. */
  function enhanceSelect(sel){
    if (!sel || sel._csel) return;
    var box = sel.parentElement;
    if (!box) return;
    sel._csel = true;
    box.classList.add('csel-host');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'csel-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    var lab = sel.getAttribute('aria-label');
    if (lab) btn.setAttribute('aria-label', lab);
    btn.innerHTML = '<span class="csel-val"></span><span class="csel-car" aria-hidden="true"></span>';

    var pop = document.createElement('div');
    pop.className = 'csel-pop';
    pop.setAttribute('role', 'listbox');
    if (lab) pop.setAttribute('aria-label', lab);

    box.appendChild(btn);
    box.appendChild(pop);

    function opts(){ return Array.prototype.slice.call(pop.children); }
    function open(){ return box.classList.contains('csel-open'); }

    function sync(){
      var list = Array.prototype.slice.call(sel.options);
      pop.innerHTML = '';
      list.forEach(function(o){
        var it = document.createElement('div');
        it.className = 'csel-opt';
        it.setAttribute('role', 'option');
        it.dataset.v = o.value;
        it.textContent = o.textContent;
        it.setAttribute('aria-selected', o.value === sel.value ? 'true' : 'false');
        if (o.value === sel.value) it.classList.add('on');
        pop.appendChild(it);
      });
      var cur = list.filter(function(o){ return o.value === sel.value; })[0];
      btn.querySelector('.csel-val').textContent = cur ? cur.textContent : '';
    }

    function setOpen(v){
      box.classList.toggle('csel-open', v);
      btn.setAttribute('aria-expanded', v ? 'true' : 'false');
      if (v) {
        var on = pop.querySelector('.csel-opt.on') || pop.firstChild;
        if (on) { on.classList.add('cur'); on.scrollIntoView({ block: 'nearest' }); }
      } else {
        opts().forEach(function(o){ o.classList.remove('cur'); });
      }
    }

    function pick(el){
      if (!el) return;
      sel.value = el.dataset.v;
      sync();
      setOpen(false);
      btn.focus();
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function move(step){
      var list = opts();
      if (!list.length) return;
      var i = list.findIndex(function(o){ return o.classList.contains('cur'); });
      if (i < 0) i = list.findIndex(function(o){ return o.classList.contains('on'); });
      var n = Math.max(0, Math.min(list.length - 1, (i < 0 ? 0 : i) + step));
      list.forEach(function(o){ o.classList.remove('cur'); });
      list[n].classList.add('cur');
      list[n].scrollIntoView({ block: 'nearest' });
    }

    btn.addEventListener('click', function(e){ e.stopPropagation(); setOpen(!open()); });
    pop.addEventListener('click', function(e){
      e.stopPropagation();
      var o = e.target.closest('.csel-opt');
      if (o) pick(o);
    });
    /* BITTA keydown ishlovchisi. Ilgari ikkitasi bor edi (tugmada va
       konteynerda) — hodisa tugmadan konteynerga KO'TARILGANI uchun har bosish
       ikki marta ishlanardi: ArrowDown ikki qadam tashlardi, Enter esa ro'yxatni
       ochib darhol yopib yuborardi. Shuning uchun hammasi shu yerda. */
    box.addEventListener('keydown', function(e){
      if (!open()) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault(); setOpen(true);
          if (e.key === 'ArrowDown') move(1);
          else if (e.key === 'ArrowUp') move(-1);
        }
        return;
      }
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); btn.focus(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Home') { e.preventDefault(); move(-999); }
      else if (e.key === 'End') { e.preventDefault(); move(999); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(pop.querySelector('.csel-opt.cur')); }
      else if (e.key === 'Tab') setOpen(false);
    });
    document.addEventListener('click', function(){ if (open()) setOpen(false); });

    // Variantlar keyinroq to'ldirilishi/o'zgarishi mumkin
    try { new MutationObserver(sync).observe(sel, { childList: true }); } catch {}
    sync();
  }

  // Sahifadagi barcha tanlagichlarni bezaymiz. Maxsus imkoniyatlar panelidagi
  // (.a11y-sel) tanlagichga TEGILMAYDI — u yerda native element ekran
  // o'quvchilari uchun ishonchliroq.
  function enhanceSelects(root){
    (root || document).querySelectorAll('select:not(.a11y-sel)').forEach(enhanceSelect);
  }

  w.Site = { initPage, renderHeader, renderFooter, renderSectionNav, crumbHTML, EVENT_KINDS, eventKind, eventKindById, PUB_KINDS, pubKind, pubKindById, mlGet, dispTitle, esc, safeUrl, fmtDate, dayMonth, qs, settings, lang, brandLogo, brandLines, orgName, shortName, socialLinks, copyrightText, t: T, ICON, NAV, initReveal, showSubscribe, printDoc, printHeadHTML, printFootHTML, enhanceSelect, enhanceSelects };
})(window);
