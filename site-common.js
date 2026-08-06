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
    const def = { uz: 'logo-mark.png', ru: 'logo-mark-ru.png', en: 'logo-mark-en.png' };
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
  // "Bosh sahifa - Hi-Fi.html" dagi qo'lda yozilgan menyu bilan BIR XIL bo'lishi
  // shart — u alohida nusxa, o'zgartirsangiz ikkalasini ham yangilang).
  // `keys` — qaysi sahifalarda bu band "active" bo'lib yonishi. Bir band bir
  // nechta sahifaga javob beradi (masalan Voqealar = yangiliklar + tadbirlar),
  // chunki alohida menyu bandlari olib tashlandi, sahifalar esa qoldi.
  const NAV = [
    { tk: 'nav_about', href: 'markaz-haqida.html', keys: ['about'], children: [
      { tk: 'nav_about_leadership', href: 'rahbariyat.html' },
      { tk: 'nav_about_experts', href: 'rahbariyat.html' }
    ]},
    { tk: 'nav_happenings', href: 'yangiliklar.html', keys: ['news','events'], children: [
      { tk: 'nav_hap_news', href: 'yangiliklar.html' },
      { tk: 'nav_hap_experts', href: 'rahbariyat.html' },
      { tk: 'nav_hap_events', href: 'tadbirlar.html' }
    ]},
    { tk: 'nav_analytics', href: 'nashrlar.html', keys: ['pubs','research'], children: [
      { tk: 'nav_an_reports', href: 'nashrlar.html?type=Hisobot' },
      { tk: 'nav_an_articles', href: 'nashrlar.html?type=Maqola' },
      { tk: 'nav_an_books', href: 'nashrlar.html?type=Kitob' }
    ]},
    { tk: 'nav_media', href: 'media.html', keys: ['media'], children: [
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
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-6.6 7.5L21.7 21h-6l-4.7-6.1L5.6 21H2.5l7-8L2 3h6.2l4.2 5.6L17.5 3Zm-1 16h1.6L7.6 4.7H5.9L16.5 19Z"/></svg>'
  };

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
      return `<div class="item${active}"><a href="${n.href}">${esc(T(n.tk))}${car}</a>${drop}</div>`;
    }).join('');

    const el = document.createElement('header');
    el.id = 'hdr';
    el.className = 'solid';
    el.innerHTML = `
      <div class="util"><div class="wrap">
        <span>${esc(T('util_country'))}</span>
        <a href="mailto:${esc(s.email||'info@markaz.uz')}">${esc(s.email||'info@markaz.uz')}</a>
        <a href="tel:${esc((s.phone||'').replace(/\s/g,''))}">${esc(s.phone||'+998 71 000 00 00')}</a>
        <span class="sp"></span>
        <div class="langs" role="group" aria-label="Til / Язык / Language">${langButtons()}</div>
      </div></div>
      <div class="bar"><div class="wrap">
        <a class="brand brand-row" href="Bosh sahifa - Hi-Fi.html" aria-label="${esc(SN)}">
          <img class="logo logo-c" src="logo-mark.png" alt="${esc(SN)}">
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
    const DEFLOGO = { uz: 'logo-mark.png', ru: 'logo-mark-ru.png', en: 'logo-mark-en.png' };
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
      NAV.map(n => `<a href="${n.href}">${esc(T(n.tk))}</a>` +
        (n.children ? n.children.map(c => `<a class="sub" href="${c.href}">${esc(T(c.tk))}</a>`).join('') : '')
      ).join('');
    document.body.appendChild(drawer);
    const closeDrawer = () => { drawer.classList.remove('open'); el.querySelector('#navBurger').setAttribute('aria-expanded','false'); document.body.style.overflow=''; };
    el.querySelector('#navBurger').addEventListener('click', ()=> { drawer.classList.add('open'); el.querySelector('#navBurger').setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; });
    drawer.querySelector('#mClose').addEventListener('click', closeDrawer);
    // Menyu havolasi / utilita tugmasi bosilganda drawer yopilsin (a11y & qidiruv panel ustidan ochilsin)
    drawer.querySelectorAll('a, .a11y-btn').forEach(a => a.addEventListener('click', closeDrawer));

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

    // Brend matnini joyga moslash (layout hisoblangandan keyin + oyna o'lchami o'zgarganda)
    requestAnimationFrame(fitBrand);
    let fitT; w.addEventListener('resize', () => { clearTimeout(fitT); fitT = setTimeout(fitBrand, 150); });
  }

  // ---------- FOOTER ----------
  // Havola ustunlari yuqoridagi NAV massividan chiziladi — menyu o'zgarsa footer
  // o'zi ergashadi. Ilgari ular qo'lda yozilgani uchun menyu qayta guruhlangach
  // footer eski bo'limlarni (Tadqiqotlar/Nashrlar) ko'rsatib qolgan edi.
  // "Aloqa" ustuni (manzil/e-pochta/telefon) ataylab YO'Q: menyuda "Aloqa"
  // bandi bor va tepadagi util qatorida e-pochta bilan telefon turibdi.
  function renderFooter(){
    const s = settings();
    const soc = s.social || {};
    const B = brandLines(), SN = shortName();
    const el = document.createElement('footer');
    el.innerHTML = `<div class="wrap">
      <div class="f-top">
        <div>
          <div class="f-brand">
            <img class="flogo-c" src="${(s.logos && s.logos[lang]) || s.logo || ({uz:'logo-mark.png',ru:'logo-mark-ru.png',en:'logo-mark-en.png'}[lang]) || 'logo-mark.png'}" alt="${esc(SN)}">
            <img class="flogo-w" src="logo-mark-white.png" alt="${esc(SN)}">
            <span class="fd"></span>
            <span><b>${esc(B.top)}</b><small>${esc(B.bot)}</small></span>
          </div>
          <p class="f-about">${esc(T('footer_about'))}</p>
          <div class="socials">${[
            {u:soc.telegram, i:ICON.tg, n:'Telegram'},
            {u:soc.youtube,  i:ICON.yt, n:'YouTube'},
            {u:soc.facebook, i:ICON.fb, n:'Facebook'},
            {u:soc.x,        i:ICON.x,  n:'X'}
          ].filter(l => l.u && l.u !== '#')
           .map(l => `<a href="${safeUrl(l.u)}" target="_blank" rel="noopener" aria-label="${l.n}">${l.i}</a>`).join('')}</div>
        </div>
        ${NAV.filter(n => n.children && n.children.length).map(n => `<div class="f-col"><h5>${esc(T(n.tk))}</h5>${
          n.children.map(c => `<a href="${c.href}">${esc(T(c.tk))}</a>`).join('')
        }</div>`).join('')}
      </div>
      <div class="f-bot">
        <span>${esc(T('footer_copyright'))}</span>
        <div class="foot-links"><a href="#">${esc(T('footer_privacy'))}</a><a href="#">${esc(T('footer_terms'))}</a></div>
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

  // ---------- banner background ----------
  // sahifa fayli -> banner kaliti
  const BANNER_MAP = {
    'yangiliklar.html':'news','yangilik.html':'news','tadbirlar.html':'events',
    'nashrlar.html':'pubs','nashr.html':'pubs','tadqiqotlar.html':'research','yonalish.html':'research',
    'markaz-haqida.html':'about','rahbariyat.html':'leadership','media.html':'media',
    'aloqa.html':'contact','qidiruv.html':'search'
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
    const el = document.querySelector('.page-banner');
    if (el && url){
      el.classList.add('has-img');
      // CSS qiymatiga qo'shtirnoq/qavs tushsa url() dan chiqib boshqa e'lon
      // qo'shish mumkin edi — shuning uchun kodlab beramiz.
      el.style.setProperty('--banner-img', `url("${encodeURI(url).replace(/"/g, '%22')}")`);
    }
  }

  // ---------- Obuna (subscribe) modali ----------
  // Mantiq subscribe.js faylida (bosh sahifa ham shundan foydalanadi).
  // Bu yerda nusxa TUTMANG — ilgari ikkita nusxa bo'lgani uchun bosh
  // sahifada eski e-pochtali oyna qolib ketgan edi.

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
    var cssHref = abs('print.css');

    var html = ''
      + '<div class="ph">' + (logo ? '<img src="' + logo + '" alt="">' : '') + '<div><b>' + esc(org) + '</b><span>' + esc(tag) + '</span></div></div>'
      + '<h1>' + esc(opts.title || '') + '</h1>'
      + (opts.meta ? '<div class="meta">' + opts.meta + '</div>' : '')
      + (opts.lead ? '<div class="lead">' + opts.lead + '</div>' : '')
      + (img ? '<div class="img"><img src="' + img + '" alt=""></div>' : '')
      + '<div class="content">' + (opts.content || '') + '</div>'
      + '<div class="foot"><span>' + esc(T('print_source')) + ': ' + esc(location.href) + '</span><span>' + esc(T('print_date')) + ': ' + date + '</span></div>';

    var fonts = '<link href="https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">';
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
    // rasm(lar) yuklanishini kutamiz, aks holda 1.5s dan so'ng baribir chop qilamiz
    var imgs = doc.images, left = imgs ? imgs.length : 0;
    if (left) {
      var tick = function () { if (--left <= 0) go(); };
      for (var i = 0; i < imgs.length; i++) {
        if (imgs[i].complete) tick();
        else { imgs[i].onload = tick; imgs[i].onerror = tick; }
      }
      setTimeout(go, 1500);
    } else {
      setTimeout(go, 350);
    }
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
    try { applyBanner(opts.active); } catch(e){ console.error('applyBanner:', e); }
    try { renderFooter(); } catch(e){ console.error('renderFooter:', e); }
    try { if (w.I18N) w.I18N.translate(document); } catch(e){ console.error(e); }
    initReveal();
    try { if (w.Subscribe) w.Subscribe.arm(); } catch(e){ console.error('subscribe:', e); }
  }

  // Obuna oynasi subscribe.js dan keladi; u yuklanmagan sahifada shunchaki jim turadi.
  function showSubscribe(){ if (w.Subscribe) w.Subscribe.show(); }

  w.Site = { initPage, renderHeader, renderFooter, mlGet, dispTitle, esc, safeUrl, fmtDate, dayMonth, qs, settings, lang, brandLogo, t: T, ICON, NAV, initReveal, showSubscribe, printDoc };
})(window);
