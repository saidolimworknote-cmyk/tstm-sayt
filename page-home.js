/* index.html sahifasining skripti.
   Ilgari HTML ichida inline turardi. CSP 'unsafe-inline' siz ishlashi uchun
   alohida faylga ko'chirildi — sahifada faqat <script src> qoladi. */
  // ---- yoqilgan tillar (admin -> Sozlamalar -> "Tillar") ----
  // Sozlama yuklanmagan bo'lsa (offline) — uchalasi ham yoqilgan deb hisoblaymiz.
  function enabledLangs(){
    var L = ((window.Store && Store.settings && Store.settings()) || {}).langs || {};
    var on = ['uz','ru','en'].filter(function(l){ return L[l] !== false; });
    return on.length ? on : ['uz'];   // sayt tilsiz qolmasin
  }
  // ---- til (i18n) ----
  if (window.I18N) {
    var _on = enabledLangs();
    // Joriy til o'chirib qo'yilgan bo'lsa — ruxsat etilgan birinchi tilga o'tamiz
    if (_on.indexOf(I18N.lang) < 0) { I18N.setLang(_on[0]); }
    I18N.translate(document);
    document.querySelectorAll('.langs span[data-l], #mLangs span[data-l]').forEach(sp => {
      if (_on.indexOf(sp.dataset.l) < 0) { sp.remove(); return; }   // o'chirilgan til ko'rinmasin
      sp.classList.toggle('on', sp.dataset.l === I18N.lang);
      sp.addEventListener('click', () => I18N.setLang(sp.dataset.l));
    });
  }
  // ---- brend nomi + qisqa nom (admin -> Sozlamalar -> "Markaz nomi" / "Qisqa nom") ----
  // Brend ikki qatorli lockup, sozlamadagi nom esa bitta matn — uni so'z chegarasidan
  // ikki muvozanatli qatorga bo'lamiz. Nom bo'sh bo'lsa HTML'dagi standart matn qoladi.
  (function(){
    try {
      var st = (window.Store && Store.settings && Store.settings()) || {};
      var lg = (window.I18N ? I18N.lang : 'uz');
      var nmv = st.siteName;
      var nm = String((nmv && typeof nmv === 'object' ? (nmv[lg]||nmv.uz||nmv.ru||nmv.en) : nmv) || '').trim();
      var sn = String(st.shortName || 'TSTM');
      document.querySelectorAll('img[alt="TSTM"], .brand[aria-label="TSTM"]').forEach(function(el){
        if (el.tagName === 'IMG') el.alt = sn; else el.setAttribute('aria-label', sn);
      });
      if (!nm) return;
      document.title = nm;
      var ws = nm.split(/\s+/), top = nm.toUpperCase(), bot = '';
      if (ws.length > 1) {
        var cut = 1, best = Infinity;
        for (var i = 1; i < ws.length; i++){
          var d = Math.abs(ws.slice(0,i).join(' ').length - ws.slice(i).join(' ').length);
          if (ws[i-1].length <= 3) d += 12;   // qisqa bog'lovchi qator oxirida osilib qolmasin
          if (d < best) { best = d; cut = i; }
        }
        top = ws.slice(0,cut).join(' ').toUpperCase(); bot = ws.slice(cut).join(' ');
      }
      // data-i18n olib tashlanadi — aks holda keyingi I18N.translate() ustidan yozadi
      document.querySelectorAll('[data-i18n="org_name"]').forEach(function(el){ el.removeAttribute('data-i18n'); el.textContent = top; });
      document.querySelectorAll('[data-i18n="org_tagline"]').forEach(function(el){ el.removeAttribute('data-i18n'); el.textContent = bot; });
    } catch{}
  })();
  // ---- brend matnini header'dagi joyga moslash ----
  // Nom sozlamadan keladi, uzunligi oldindan noma'lum. Standart o'zbekcha nom
  // 17px'da sig'adi (tegilmaydi); uzunroq RU/EN nomlari 12px'gacha kichrayadi.
  function fitBrand(){
    try {
      var nm = document.querySelector('header .brand .nm');
      if (!nm) return;
      var b = nm.querySelector('b'), sm = nm.querySelector('small');
      if (!b) return;
      var nav = document.querySelector('header nav.main');
      var burger = document.getElementById('navBurger');
      var stop = (nav && nav.offsetParent !== null) ? nav
               : ((burger && burger.offsetParent !== null) ? burger : null);
      if (!stop) return;
      var limit = stop.getBoundingClientRect().left - nm.getBoundingClientRect().left - 18;
      if (!(limit > 80)) return;   // o'lchov ishonchsiz — tegmaymiz
      var size = 17, guard = 0;
      b.style.fontSize = size+'px'; if (sm) sm.style.fontSize = size+'px';
      while (size > 12 && nm.scrollWidth > limit && guard++ < 40) {
        size -= 0.5;
        b.style.fontSize = size+'px'; if (sm) sm.style.fontSize = size+'px';
      }
    } catch{}
  }
  requestAnimationFrame(fitBrand);
  var _fitT; window.addEventListener('resize', function(){ clearTimeout(_fitT); _fitT = setTimeout(fitBrand, 150); });
  // ---- obuna (subscribe) modali ----
  // Mantiq subscribe.js faylida — ichki sahifalar bilan BIR XIL nusxa.
  // Ilgari bu yerda alohida (e-pochta so'raydigan) nusxa turardi va push
  // versiyasiga o'tilganda yangilanmay qolgan edi: bosh sahifaga kirgan
  // odam hamon eski oynani ko'rardi. Nusxa ko'chirmang.
  try { if (window.Subscribe) window.Subscribe.arm(); } catch(e){ console.error("subscribe:", e); }
  // ---- ochiluvchi ro'yxat: BOSISH bilan ochish ----
  // Sahifasi yo'q "guruh" bandi (Markaz haqida) hech qayerga olib bormaydi,
  // shuning uchun bosishga javob berishi SHART — sensorli ekranda hover yo'q.
  // Ichki sahifalardagi egizagi: site-common.js -> renderHeader ("Ochiluvchi
  // ro'yxat"). Bosh sahifa site-common.js ni YUKLAMAYDI, shuning uchun bu
  // mantiq shu yerda takrorlanadi — birini o'zgartirsangiz ikkinchisini ham.
  (function(){
    var groups = document.querySelectorAll('header nav.main .item.is-group');
    if (!groups.length) return;
    function closeGroups(except){
      groups.forEach(function(g){
        if (g === except) return;
        g.classList.remove('open');
        var b = g.querySelector('[aria-expanded]'); if (b) b.setAttribute('aria-expanded','false');
      });
    }
    groups.forEach(function(g){
      var btn = g.querySelector('[role=button]');
      if (!btn) return;
      function toggle(){
        var on = !g.classList.contains('open');
        closeGroups(g);
        g.classList.toggle('open', on);
        btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      }
      btn.addEventListener('click', toggle);
      btn.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
      g.addEventListener('mouseleave', function(){ closeGroups(); });
    });
    document.addEventListener('click', function(e){
      // `closest` faqat elementlarda bor (site-common.js dagi egizagi kabi).
      var t = e.target;
      if (!t || typeof t.closest !== 'function' || !t.closest('header nav.main .item.is-group')) closeGroups();
    });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeGroups(); });
  })();
  // ---- mobil menyu ----
  (function(){
    var mnav = document.getElementById('mnav');
    var bg = document.getElementById('navBurger');
    var cl = document.getElementById('mClose');
    // klaviatura: role=button elementlar Enter/Space bilan ishlasin
    document.querySelectorAll('.ic[role=button], .langs span[role=button], #navBurger').forEach(function(b){
      b.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); b.click(); } });
    });
    if (bg && mnav) bg.addEventListener('click', function(){ mnav.classList.add('open'); });
    if (cl && mnav) cl.addEventListener('click', function(){ mnav.classList.remove('open'); });
    // menyu havolasi / a11y / qidiruv bosilganda drawer yopilsin (panel/qidiruv uning ustidan ochilsin)
    if (mnav) mnav.querySelectorAll('a, .a11y-btn').forEach(function(x){ x.addEventListener('click', function(){ mnav.classList.remove('open'); }); });
    // Escape bilan drawer yopilsin
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && mnav && mnav.classList.contains('open')) mnav.classList.remove('open'); });
  })();
  // ---- til bo'yicha logotip ----
  try {
    var _lg = (window.I18N ? I18N.lang : 'uz');
    var _st = (window.Store && Store.settings && Store.settings()) || {};
    var _defLogo = {uz:'logo-mark.png',ru:'logo-mark-ru.png',en:'logo-mark-en.png'};
    var _logo = (_st.logos && _st.logos[_lg]) || _st.logo || _defLogo[_lg] || _defLogo.uz;
    if (_logo) document.querySelectorAll('.brand-logo').forEach(function(img){ img.src = _logo; });
  } catch{}
  // ---- aloqa ma'lumotlari (sozlamalardan — header util + footer) ----
  try {
    var _cs = (window.Store && Store.settings && Store.settings()) || {};
    var _cml = function(v){ if(v && typeof v==='object'){ var L=(window.I18N?I18N.lang:'uz'); return v[L]||v.uz||v.ru||v.en||''; } return v||''; };
    var _email = _cs.email || 'info@cfps.uz';
    var _phone = _cs.phone || '+998 71 239 36 55';
    var _tel   = 'tel:' + _phone.replace(/[^\d+]/g,'');
    var _setLink = function(id, txt, href){ var el=document.getElementById(id); if(!el) return; if(txt!=null) el.textContent=txt; if(href!=null) el.href=href; };
    _setLink('utilEmail', _email, 'mailto:'+_email);
    _setLink('utilPhone', _phone, _tel);
    // Footerdagi ixcham aloqa bloki (.f-meta): manzil + e-pochta.
    // Telefon ataylab yo'q — u tepadagi util qatorida turibdi.
    _setLink('fEmail', _email, 'mailto:'+_email);
    var _fa = document.getElementById('fAddr');
    if(_fa) _fa.textContent = _cml(_cs.address) || "Toshkent sh., O'zbekiston";
    // ijtimoiy tarmoqlar — faqat to'ldirilganlari ko'rinadi ("#"/bo'sh bo'lsa yashiriladi)
    var _soc = _cs.social || {};
    [['fsTelegram',_soc.telegram],['fsYoutube',_soc.youtube],['fsFacebook',_soc.facebook],['fsX',_soc.x]].forEach(function(p){
      var a = document.getElementById(p[0]); if(!a) return;
      if (p[1] && p[1] !== '#'){ a.href = p[1]; a.style.display=''; }
      else { a.style.display='none'; }
    });
  } catch{}
  // ---- theme (light/dark) with persistence ----
  const THEME_KEY = 'tstm_site_theme';
  const sunIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.4 4.4l1.4 1.4M18.2 18.2l1.4 1.4M2.5 12h2M19.5 12h2M4.4 19.6l1.4-1.4M18.2 5.8l1.4-1.4"/></svg>';
  const moonIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
  function applySiteTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    const icon = t === 'dark' ? sunIcon : moonIcon;
    document.querySelectorAll('.theme-tog').forEach(b => b.innerHTML = icon);
  }
  // Tashrifchi o'zi tanlagan tema ustun; tanlamagan bo'lsa — admindagi standart tema.
  let siteTheme = 'light';
  try { siteTheme = localStorage.getItem(THEME_KEY) || ((window.Store && Store.settings && Store.settings()) || {}).theme || 'light'; } catch{}
  applySiteTheme(siteTheme);
  document.querySelectorAll('.theme-tog').forEach(b => b.addEventListener('click', () => {
    siteTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, siteTheme); } catch{}
    applySiteTheme(siteTheme);
  }));

  // ---- build hero from latest 4 published news (CMS-connected) ----
  const mlGet = (v) => { if (v && typeof v === 'object') { const L = (window.I18N ? I18N.lang : 'uz'); return v[L] || v.uz || v.ru || v.en || ''; } return (window.I18N ? I18N.tl(v || '') : (v || '')); };
  const fmtDate = (d) => { if(!d) return ''; const p = d.split('-'); return p[2]+'.'+p[1]+'.'+p[0]; };
  const ctaMore = (window.I18N ? I18N.t('read_more') : "Batafsil o'qish");
  // cover'siz slaydlar uchun boy institutsional fon (gradient background-IMAGE'ga beriladi)
  const slotSolid = '#0a2236'; // qattiq zaxira rang (background-color uchun — gradient bu yerda ishlamaydi)
  const heroFallbacks = [
    'radial-gradient(1100px 560px at 80% 8%, rgba(52,182,255,.20), transparent 60%),radial-gradient(820px 520px at 6% 104%, rgba(15,86,137,.42), transparent 56%),linear-gradient(135deg,#0e3a5a 0%,#0a2438 46%,#081726 100%)',
    'radial-gradient(1000px 540px at 88% 12%, rgba(52,182,255,.16), transparent 58%),radial-gradient(760px 500px at 4% 100%, rgba(20,60,92,.44), transparent 55%),linear-gradient(140deg,#123a52 0%,#0b2438 48%,#081824 100%)',
    'radial-gradient(1150px 560px at 74% 6%, rgba(60,151,207,.18), transparent 60%),radial-gradient(820px 520px at 10% 106%, rgba(15,70,110,.40), transparent 55%),linear-gradient(135deg,#0f3247 0%,#0a2032 48%,#07131f 100%)',
    'radial-gradient(1050px 540px at 84% 10%, rgba(52,182,255,.17), transparent 58%),radial-gradient(780px 500px at 6% 102%, rgba(18,64,96,.42), transparent 56%),linear-gradient(140deg,#103a54 0%,#0a2130 48%,#08161f 100%)'
  ];
  /* Hero manbasi \u2014 ikki bosqichli:
     1) Admin "Hero slayder" bo'limidagi rasmli published slaydlar (muharrir nazorati)
     2) Ular bo'lmasa \u2014 so'nggi 5 published yangilik (avtomatik zaxira)
     Rasmsiz slayd hero'ni gradient fonga tushirib yuboradi, shuning uchun
     1-bosqich faqat rasmi borlarini oladi. */
  function heroItems(){
    try {
      const slides = Store.all('heroSlides')
        .filter(s => s.status === 'published' && s.image)
        .sort((a,b) => (a.order||0) - (b.order||0));
      if(slides.length) return slides.map(s => ({
        cat: s.category || '', title: s.headline, href: s.link || '', img: s.image || '', date: ''
      }));
    } catch{}
    try {
      return Store.all('news')
        .filter(n => n.status === 'published')
        .sort((a,b) => String(b.date||'').localeCompare(String(a.date||'')))
        .slice(0,5)
        .map(n => ({
          cat: n.category || 'Yangilik', title: n.title, href: 'yangilik.html?id='+n.id,
          img: n.cover || '', date: n.date || ''
        }));
    } catch{ return []; }
  }
  function buildHero(){
    const items = heroItems();
    const wrapEl = document.getElementById('heroSlides');
    function dotsRow(count, active){
      let s='';
      for(let j=0;j<count;j++){
        s += '<div class="dot'+(j===active?' on':'')+'" data-g="'+j+'"><span class="num">'+String(j+1).padStart(2,'0')+'</span><span class="ln"></span></div>';
      }
      return '<div class="slide-dots">'+s+'</div>';
    }
    // Hero fon rasmi DINAMIK. HTML ichiga inline style bilan yozmaymiz (CSP
    // style-src'da 'unsafe-inline' yo'q). O'rniga: --slot-bg ni wrapEl'ga bir
    // marta beramiz (bolalar meros oladi), fon rasmini esa DOM'ga qo'ygandan
    // keyin .style.backgroundImage orqali beramiz (skriptli uslub CSP'da ruxsat).
    wrapEl.style.setProperty('--slot-bg', slotSolid);
    // safeUrl javascript:/data: sxemalarini bloklaydi; ' va " CSS url() dan
    // chiqib ketishning oldini oladi.
    function heroBgVal(it, i){
      return (it && it.img)
        ? "url('"+safeUrl(it.img).replace(/'/g,"%27").replace(/"/g,"%22")+"')"
        : heroFallbacks[i % heroFallbacks.length];
    }
    if(!items.length){
      wrapEl.innerHTML = '<div class="slide on"><div class="heroimg"></div><div class="scrim"></div></div>';
      wrapEl.querySelector('.heroimg').style.backgroundImage = heroFallbacks[0];
      return;
    }
    wrapEl.innerHTML = items.map((it,i) => {
      // sana faqat yangiliklarda bor \u2014 slaydlarda yorliqning o'zi qoladi
      const kick = [esc(mlGet(it.cat)), fmtDate(it.date)].filter(Boolean).join(' \u00b7 ');
      const h2 = '<h2>'+esc(mlGet(it.title))+'</h2>';
      // havolasi yo'q (yoki '#') slayd bosiladigan bo'lmasin
      const head = (it.href && it.href !== '#')
        ? '<a class="slide-h2link" href="'+safeUrl(it.href)+'">'+h2+'</a>'
        : h2;
      return '<div class="slide'+(i===0?' on':'')+'" data-i="'+i+'">'
        + '<div class="heroimg"></div>'
        + '<div class="scrim"></div>'
        + '<div class="slide-body"><div class="wrap">'
        + '<div class="slide-panel">'
        + (kick ? '<div class="kicker slide-cat">'+kick+'</div>' : '')
        + head
        + (items.length>1 ? dotsRow(items.length, i) : '')
        + '</div>'
        + '</div></div></div>';
    }).join('');
    // Fon rasmlarini DOM'ga qo'ygandan keyin beramiz.
    wrapEl.querySelectorAll('.slide').forEach((slide, i) => {
      const hi = slide.querySelector('.heroimg');
      if (hi) hi.style.backgroundImage = heroBgVal(items[i], i);
    });
  }
  buildHero();

  // ---- render homepage sections from Store (CMS-connected) ----
  // Umumiy yordamchilar (ilgari faqat ayrim bloklar ichida mahalliy e'lon qilingan edi)
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  // Lokal safeUrl — site-common.js'dagi Site.safeUrl bilan bir xil mantiq (bu fayl
  // alohida nusxa). MUHIM: Site.safeUrl ISHLATMANG — bu skript buildHero()/renderHome()ni
  // SINXRON chaqiradi, o'sha payt window.Site hali yuklanmagan bo'lishi mumkin
  // (ReferenceError butun sahifani sindiradi). Lokal nusxa Site'ga bog'liq emas.
  function safeUrl(u){
    const s = String(u==null?'':u).trim();
    if(!s) return '';
    const probe = s.split('').filter(ch=>ch>' ').join('').toLowerCase();
    if(/^(javascript|vbscript|file):/.test(probe)) return '';
    if(/^data:/.test(probe) && !/^data:image\//.test(probe)) return '';
    return esc(s);
  }
  function T(k){ return window.I18N ? I18N.t(k) : k; }
  function mlg(v){ if (v && typeof v==='object'){ const L=(window.I18N?I18N.lang:'uz'); return v[L]||v.uz||v.ru||v.en||''; } return (window.I18N?I18N.tl(v||''):(v||'')); }
  // Nashr kartalarida qisqa (displey) sarlavha — bo'sh bo'lsa to'liq sarlavha.
  // site-common.js'dagi Site.dispTitle bilan bir xil mantiq (bu fayl alohida nusxa).
  function dispT(it){ if(!it) return ''; const s=mlg(it.shortTitle); return (s&&String(s).trim())?s:mlg(it.title); }
  function imgTag(src, fallbackData){
    // src saqlangan (admin nazoratidagi) qiymat — safeUrl javascript:/data: sxemalarini
    // bloklaydi. Boshqa sahifalar ham shunday qiladi (site-common.js).
    return src ? '<img src="'+safeUrl(src)+'" alt="" class="img-cover">' : '';
  }
  function renderHome(){
    // Tadbirlar bu yerda o'qilmaydi — bosh sahifada tadbirlar bo'limi yo'q
    // (pastdagi izohga qarang). Ular `tadbirlar.html` sahifasida ko'rsatiladi.
    let news=[],pubs=[],exps=[];
    try{
      news = Store.all('news').filter(n=>n.status==='published').sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
      pubs = Store.all('publications').filter(p=>p.status==='published').slice(0,3);
      exps = Store.all('experts').sort((a,b)=>(a.order||0)-(b.order||0)).slice(0,4);
    }catch{ return; }

    // ---- Bo'sh holat ----
    // HTML ichida har bir bo'lim uchun namuna kontent yozib qo'yilgan edi
    // (soxta yangilik sarlavhalari, o'ylab topilgan ekspert ismlari va h.k.).
    // Baza bo'sh bo'lganda o'sha to'qima matn HAQIQIY ma'lumotdek ko'rinardi —
    // toza o'rnatishda yoki bo'lim tozalanganda xatoga olib keladi.
    // Endi bunday holatda ochiq-oydin "hozircha ma'lumot yo'q" chiqadi.
    const EMPTY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 10h8M8 14h5" stroke-linecap="round"/></svg>';
    const emptyState = (key) => '<div class="empty-state">' + EMPTY_ICON + '<div class="t">' + esc(T(key)) + '</div></div>';

    // STATS — admin paneldan (settings.stats). Sozlama bo'sh bo'lsa butun
    // bo'lim yashiriladi: raqamsiz "statistika" lentasi ma'nosiz.
    try{
      const sd = (Store.settings().stats)||[];
      const sc = document.querySelector('.stats');
      if(sc){
        if(sd.length){
          sc.innerHTML = sd.map(function(s){ return '<div class="stat"><div class="n">'+esc(mlg(s.n))+'</div><div class="c">'+esc(mlg(s.c))+'</div></div>'; }).join('');
        } else {
          const sec = sc.closest('section');
          if(sec) sec.hidden = true; else sc.hidden = true;
        }
      }
    }catch{}

    // NEWS: featured + list
    const ng = document.querySelector('.news-grid');
    if(ng && !news.length){ ng.innerHTML = emptyState('home_no_news'); }
    else if(ng){
      const f = news[0]; const rest = news.slice(1,6);
      ng.innerHTML =
        '<a class="feat rv" href="yangilik.html?id='+f.id+'">'
        + (f.cover?'<div class="ph ph-flush">'+imgTag(f.cover)+'</div>':'<div class="ph" data-l="asosiy yangilik"></div>')
        + '<div class="fbody">'
        + '<div class="meta">'+(f.category?'<span class="tag">'+esc(mlg(f.category))+'</span>':'')+'<span class="d mono muted">'+fmtDate(f.date)+'</span></div>'
        + '<h3>'+esc(mlg(f.title))+'</h3>'
        + (mlg(f.excerpt)?'<p>'+esc(mlg(f.excerpt))+'</p>':'')
        + '</div>'
        + '</a>'
        + '<div class="nlist rv">'
        + rest.map(n=>'<a class="nitem" href="yangilik.html?id='+n.id+'">'
            + (n.cover?'<div class="ph ph-flush">'+imgTag(n.cover)+'</div>':'<div class="ph" data-l="foto"></div>')
            + '<div class="nbody"><div class="d">'+fmtDate(n.date)+(n.category?' · '+esc(mlg(n.category)):'')+'</div><h4>'+esc(mlg(n.title))+'</h4></div></a>').join('')
        + '</div>';
    }

    // PUBLICATIONS
    const pg = document.querySelector('.pub-grid');
    if(pg && !pubs.length){ pg.innerHTML = emptyState('home_no_pubs'); }
    else if(pg){
      pg.innerHTML = pubs.map(p=>'<a class="pub rv" href="nashr.html?id='+p.id+'">'
        + '<div class="cover">'+(p.type?'<span class="badge">'+esc(mlg(p.type))+'</span>':'')
        + (p.cover?imgTag(p.cover):'<div class="ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/></svg></div>')+'</div>'
        + '<div class="body"><div class="t">'+esc(mlg(p.category||''))+(p.year?' · '+esc(p.year):'')+'</div><h3>'+esc(dispT(p))+'</h3>'
        + '<span class="dl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>'+ctaMore+'</span>'
        + '</div></a>').join('');
    }

    // EXPERTS
    const eg = document.querySelector('.exp-grid');
    if(eg && !exps.length){ eg.innerHTML = emptyState('home_no_experts'); }
    else if(eg){
      eg.innerHTML = exps.map(e=>'<a class="exp rv" href="expert.html?id='+e.id+'">'
        + (e.photo?'<div class="ph ph-flush">'+imgTag(e.photo)+'</div>':'<div class="ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="9" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></svg></div>')
        + '<div class="role">'+esc(mlg(e.role))+'</div><h4>'+esc(mlg(e.name))+'</h4><div class="sub">'+esc(mlg(e.sub))+'</div></a>').join('');
    }

    // PARTNERS — avto-aylanma lenta (marquee)
    const pm = document.getElementById('partnersMarquee');
    if(pm){
      let partners=[]; try{ partners = Store.all('partners'); }catch{}
      if(partners.length){
        // monogramma: nomdan bosh harflar
        const initials = n => { const w=String(n||'?').trim().split(/\s+/); return (w.length>=2 ? (w[0][0]+w[1][0]) : String(n||'?').slice(0,2)).toUpperCase(); };
        // nomdan barqaror rang (harmonik palitra)
        const MC = ['#0f5689','#1d6a94','#2e7d6b','#8a5a2b','#5b5ea6','#9a3b52','#3a7ca5','#726a95'];
        // Rang indeksi (0..7) — home.css'dagi .pmono-c{idx} klassiga mos (inline style o'rniga).
        const colorIdx = n => { let h=0; const s=String(n||''); for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h%MC.length; };
        const tile = p => {
          const inner = p.logo
            ? '<img src="'+safeUrl(p.logo)+'" alt="'+esc(p.name)+'">'
            : '<span class="pmono pmono-c'+colorIdx(p.name)+'">'+esc(initials(p.name))+'</span><span class="pname">'+esc(p.name)+'</span>';
          const cls = 'plogo'+(p.logo?'':' mono');
          return (p.url && p.url!=='#')
            ? '<a class="'+cls+'" href="'+safeUrl(p.url)+'" target="_blank" rel="noopener" title="'+esc(p.name)+'">'+inner+'</a>'
            : '<div class="'+cls+'" title="'+esc(p.name)+'">'+inner+'</div>';
        };
        const oneSet = partners.map(tile).join('');
        const track = document.createElement('div'); track.className='ptrack';
        track.innerHTML = '<div class="pset">'+oneSet+'</div>';
        pm.appendChild(track);
        // o'lchab, seamless loop uchun yetarli nusxa quramiz
        requestAnimationFrame(function(){
          const baseW = track.firstChild.getBoundingClientRect().width || track.scrollWidth || 1;
          const cw = pm.clientWidth || 1;
          const reps = Math.max(2, Math.ceil((cw*2)/baseW));
          let sets=''; for(let i=0;i<reps;i++) sets += '<div class="pset"'+(i?' aria-hidden="true"':'')+'>'+oneSet+'</div>';
          track.innerHTML = sets;
          const dur = Math.max(20, baseW/46); // ~46px/s — vazmin sur'at
          track.style.setProperty('--pdur', dur.toFixed(1)+'s');
          track.style.setProperty('--pshift', (100/reps).toFixed(4)+'%');
        });
      } else {
        // Hamkor yo'q — butun bo'lim yashiriladi (sarlavhasi bor, ichi bo'sh
        // lenta ma'nosiz). closest() null qaytarishi mumkin — tekshiramiz.
        const sec = pm.closest('section');
        if(sec) sec.style.display='none'; else pm.style.display='none';
      }
    }

    // TADBIRLAR bo'limi bosh sahifada ATAYLAB yo'q — HTML'da `.events` elementi
    // ham yo'q, shuning uchun uni to'ldiradigan kod ham olib tashlandi (o'lik
    // shox bo'lib qolgan edi: querySelector hamisha null qaytarardi).
    //
    // Qaytarmoqchi bo'lsangiz e'tiborga oling: eski kod kelgusi tadbir
    // topilmasa O'TGANlariga tushib ketardi — bosh sahifada eskirgan sanalar
    // chiqib, sayt tashlab qo'yilgandek ko'rinardi. Yangi variantda faqat
    // kelgusi tadbirlar ko'rsatilsin, ular bo'lmasa bo'lim yashirilsin.
    // Tadbirlar hozir ham `tadbirlar.html` sahifasida to'liq ko'rinadi.
  }
  // MUHIM: renderHome xato bersa ham skript davom etsin — aks holda pastdagi
  // reveal (.rv) ulanmay qoladi va butun sahifa opacity:0 da "ko'rinmas" bo'ladi
  // (2026-07-16: api.php buzilganda aynan shu yuz bergan edi).
  try { renderHome(); } catch(e){ console.error('renderHome:', e); }

  // ---- hero slider ----
  try {
    const hero = document.getElementById('hero');
    const slides = [...document.querySelectorAll('.slide')];
    const dots = [...document.querySelectorAll('.dot')];
    let cur = 0, timer = null, DUR = 6000;
    function go(n){
      cur = (n + slides.length) % slides.length;
      slides.forEach((s,i)=>s.classList.toggle('on', i===cur));
      dots.forEach(d=>d.classList.toggle('on', +d.dataset.g===cur));
    }
    function restart(){ clearInterval(timer); timer = setInterval(()=>go(cur+1), DUR); }
    function jump(n){ go(n); restart(); }
    dots.forEach(d=>d.addEventListener('click',()=>jump(+d.dataset.g)));
    document.getElementById('next').addEventListener('click',()=>jump(cur+1));
    document.getElementById('prev').addEventListener('click',()=>jump(cur-1));
    if(slides.length > 1) restart();
    // pause on hover
    hero.addEventListener('mouseenter',()=>clearInterval(timer));
    hero.addEventListener('mouseleave',()=>{ if(slides.length>1) restart(); });
  } catch(e){ console.error('hero slider:', e); }

  // ---- reveal on scroll ----
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es)=>{
      es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    },{threshold:.12, rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('.rv').forEach(el=>io.observe(el));
  } else {
    // juda eski brauzer — animatsiyasiz bo'lsa ham kontent ko'rinsin
    document.querySelectorAll('.rv').forEach(el=>el.classList.add('in'));
  }

  // ---- language switch (visual) ----
  document.querySelectorAll('.langs').forEach(g=>{
    g.addEventListener('click',e=>{
      if(e.target.tagName==='SPAN'){ [...g.children].forEach(s=>s.classList.remove('on')); e.target.classList.add('on'); }
    });
  });
