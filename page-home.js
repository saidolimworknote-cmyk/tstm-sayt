/* Bosh sahifa - Hi-Fi.html sahifasining skripti.
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
    } catch(e){}
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
    } catch(e){}
  }
  requestAnimationFrame(fitBrand);
  var _fitT; window.addEventListener('resize', function(){ clearTimeout(_fitT); _fitT = setTimeout(fitBrand, 150); });
  // ---- obuna (subscribe) modali — tashrif boshida bir marta ----
  // MUHIM: "obuna bo'ldingiz" xabari FAQAT server tasdiqlagandan keyin chiqadi.
  // Avval Store.addMessage natijasi umuman tekshirilmasdi — e-pochta hech qayerga
  // yozilmasa ham foydalanuvchi obuna bo'ldim deb o'ylab ketardi (site-common.js
  // dagi nusxa tuzatilganda bu inline nusxa e'tibordan chetda qolgan edi).
  (function(){
    var SEEN='tstm_sub_seen', SNOOZE='tstm_sub_snooze';
    try {
      if (localStorage.getItem(SEEN)) return;
      var _t = parseInt(localStorage.getItem(SNOOZE)||'0',10);
      if (_t && Date.now() < _t) return;   // xatodan keyin yopilgan — 1 kun kutamiz
    } catch(e){}
    var T=function(k){ return window.I18N? I18N.t(k):k; };
    setTimeout(function(){
      var ov=document.createElement('div');
      ov.setAttribute('style','position:fixed;inset:0;z-index:99997;background:rgba(8,16,28,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:.3s;font-family:var(--sans)');
      ov.innerHTML='<div style="position:relative;background:var(--panel,#fff);color:var(--ink,#16181b);max-width:440px;width:100%;border-radius:14px;padding:38px 34px 28px;text-align:center;box-shadow:0 40px 90px -30px rgba(0,0,0,.5)">'
        +'<button data-x style="position:absolute;top:12px;right:16px;background:none;border:0;font-size:1.625rem;line-height:1;color:var(--muted,#888);cursor:pointer">&times;</button>'
        +'<div style="width:60px;height:60px;border-radius:50%;background:var(--accent-soft,#e4eef6);color:var(--accent,#0D4483);display:flex;align-items:center;justify-content:center;margin:0 auto 18px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="width:28px;height:28px"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></div>'
        +'<h3 style="font-family:var(--serif,Georgia);font-weight:600;font-size:1.4375rem;margin:0 0 10px">'+T('sub_title')+'</h3>'
        +'<p style="color:var(--ink-2,#555);font-size:0.90625rem;line-height:1.6;margin:0 0 22px">'+T('sub_text')+'</p>'
        +'<form data-f novalidate style="display:flex;gap:8px"><input type="email" name="email" autocomplete="email" inputmode="email" spellcheck="false" autocapitalize="off" placeholder="'+T('sub_ph')+'" aria-label="'+T('sub_ph')+'" style="flex:1;border:1px solid var(--line,#e6e6e2);background:var(--bg-2,#f6f5f2);padding:13px 15px;font-size:0.9375rem;color:var(--ink,#16181b);outline:none;border-radius:8px"><button type="submit" style="background:var(--accent,#0D4483);color:#fff;border:0;padding:13px 22px;border-radius:8px;font-family:var(--mono,monospace);font-size:0.75rem;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;white-space:nowrap">'+T('sub_btn')+'</button></form>'
        +'<div data-err role="alert" style="display:none;color:#c0392b;font-size:0.8125rem;text-align:left;margin-top:9px;line-height:1.45"></div>'
        +'<div data-ok style="display:none;color:var(--accent,#0D4483);font-weight:600;font-size:0.9375rem;padding:14px 0">'+T('sub_ok')+'<div style="font-weight:400;color:var(--ink-2,#555);font-size:0.8125rem;margin-top:6px">'+T('sub_ok_text')+'</div></div>'
        +'<button data-later style="margin-top:16px;background:none;border:0;color:var(--muted,#888);font-size:0.8125rem;cursor:pointer;text-decoration:underline">'+T('sub_later')+'</button></div>';
      // dismiss=true — ataylab yopdi yoki obuna bo'ldi: boshqa ko'rsatmaymiz.
      // dismiss=false — xato bo'lgandan keyin yopildi: 1 kundan so'ng yana taklif qilamiz.
      var closed=false;
      function close(dismiss){
        if(closed) return; closed=true;
        try{ if(dismiss!==false) localStorage.setItem(SEEN,'1'); else localStorage.setItem(SNOOZE,String(Date.now()+86400000)); }catch(e){}
        document.removeEventListener('keydown',onKey,true);
        ov.style.opacity='0'; setTimeout(function(){ ov.remove(); },300);
      }
      var form=ov.querySelector('[data-f]'), input=form.querySelector('input');
      var btn=form.querySelector('button'), errEl=ov.querySelector('[data-err]');
      var okDone=false;   // muvaffaqiyatli obunadan keyin yopilish "dismiss" bo'lsin
      function onKey(e){ if(e.key==='Escape'){ e.preventDefault(); close(okDone||!errShown()); } }
      function errShown(){ return errEl.style.display==='block'; }
      function showErr(k){
        errEl.textContent=T(k); errEl.style.display='block';
        input.style.borderColor='#c0392b';
        try{ input.focus(); }catch(e){}   // tugma disabled bo'lganda fokus yo'qolmasin
      }
      document.body.appendChild(ov); requestAnimationFrame(function(){ ov.style.opacity='1'; });
      document.addEventListener('keydown',onKey,true);
      // Fon yoki "keyinroq"/× bosilsa — ataylab yopish, lekin xatodan keyin snooze
      ov.addEventListener('click',function(e){ if(e.target===ov) close(!errShown()); });
      ov.querySelector('[data-x]').addEventListener('click',function(){ close(!errShown()); });
      ov.querySelector('[data-later]').addEventListener('click',function(){ close(true); });
      input.addEventListener('input',function(){ errEl.style.display='none'; input.style.borderColor='var(--line,#e6e6e2)'; });
      var emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      form.addEventListener('submit',function(e){
        e.preventDefault();
        if(btn.disabled) return;                       // ikki marta yuborishdan himoya
        var em=input.value.trim();
        if(!emailRe.test(em)){ showErr('sub_err_email'); return; }
        btn.disabled=true; btn.style.opacity='.6'; btn.style.cursor='default';
        errEl.style.display='none'; input.style.borderColor='var(--line,#e6e6e2)';
        Promise.resolve(Store.subscribe(em,(window.I18N?I18N.lang:'uz'))).then(function(res){
          if(res && res.ok){
            okDone=true;
            form.style.display='none'; errEl.style.display='none';
            ov.querySelector('[data-ok]').style.display='block';
            try{ localStorage.setItem(SEEN,'1'); }catch(err){}
            setTimeout(function(){ close(true); },2600);
            return;
          }
          var err=(res && res.error)||'failed';
          showErr(err==='too_many'?'sub_err_many':err==='bad_email'?'sub_err_email':'sub_err_fail');
        }).catch(function(){ showErr('sub_err_fail'); }).then(function(){
          if(!okDone){ btn.disabled=false; btn.style.opacity=''; btn.style.cursor='pointer'; }
        });
      });
    }, 3000);
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
  } catch(e){}
  // ---- aloqa ma'lumotlari (sozlamalardan — header util + footer) ----
  try {
    var _cs = (window.Store && Store.settings && Store.settings()) || {};
    var _cml = function(v){ if(v && typeof v==='object'){ var L=(window.I18N?I18N.lang:'uz'); return v[L]||v.uz||v.ru||v.en||''; } return v||''; };
    var _email = _cs.email || 'info@markaz.uz';
    var _phone = _cs.phone || '+998 71 000 00 00';
    var _addr  = _cml(_cs.address) || "Toshkent sh., O'zbekiston";
    var _tel   = 'tel:' + _phone.replace(/[^\d+]/g,'');
    var _setLink = function(id, txt, href){ var el=document.getElementById(id); if(!el) return; if(txt!=null) el.textContent=txt; if(href!=null) el.href=href; };
    _setLink('utilEmail', _email, 'mailto:'+_email);
    _setLink('utilPhone', _phone, _tel);
    _setLink('fEmail', _email, 'mailto:'+_email);
    _setLink('fPhone', _phone, _tel);
    var _fa = document.getElementById('fAddr'); if(_fa) _fa.textContent = _addr;
    // ijtimoiy tarmoqlar — faqat to'ldirilganlari ko'rinadi ("#"/bo'sh bo'lsa yashiriladi)
    var _soc = _cs.social || {};
    [['fsTelegram',_soc.telegram],['fsYoutube',_soc.youtube],['fsFacebook',_soc.facebook],['fsX',_soc.x]].forEach(function(p){
      var a = document.getElementById(p[0]); if(!a) return;
      if (p[1] && p[1] !== '#'){ a.href = p[1]; a.style.display=''; }
      else { a.style.display='none'; }
    });
  } catch(e){}
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
  try { siteTheme = localStorage.getItem(THEME_KEY) || ((window.Store && Store.settings && Store.settings()) || {}).theme || 'light'; } catch(e){}
  applySiteTheme(siteTheme);
  document.querySelectorAll('.theme-tog').forEach(b => b.addEventListener('click', () => {
    siteTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, siteTheme); } catch(e){}
    applySiteTheme(siteTheme);
  }));

  // ---- header solid on scroll ----
  const hdr = document.getElementById('hdr');
  const hero = document.getElementById('hero');
  function onScroll(){
    const t = hero.offsetHeight - 90;
    hdr.classList.toggle('solid', window.scrollY > t);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  // ---- build hero from latest 4 published news (CMS-connected) ----
  const mlGet = (v) => { if (v && typeof v === 'object') { const L = (window.I18N ? I18N.lang : 'uz'); return v[L] || v.uz || v.ru || v.en || ''; } return (window.I18N ? I18N.tl(v || '') : (v || '')); };
  const fmtDate = (d) => { if(!d) return ''; const p = d.split('-'); return p[2]+'.'+p[1]+'.'+p[0]; };
  const ctaText = (window.I18N ? I18N.t('hero_cta') : "Batafsil o'qish");
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
    } catch(e){}
    try {
      return Store.all('news')
        .filter(n => n.status === 'published')
        .sort((a,b) => String(b.date||'').localeCompare(String(a.date||'')))
        .slice(0,5)
        .map(n => ({
          cat: n.category || 'Yangilik', title: n.title, href: 'yangilik.html?id='+n.id,
          img: n.cover || '', date: n.date || ''
        }));
    } catch(e){ return []; }
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
    if(!items.length){
      wrapEl.innerHTML = '<div class="slide on"><div class="heroimg" style="background-image:'+heroFallbacks[0]+';--slot-bg:'+slotSolid+'"></div><div class="scrim"></div></div>';
      return;
    }
    wrapEl.innerHTML = items.map((it,i) => {
      const bg = it.img
        ? 'background-image:url(\''+it.img.replace(/'/g,"%27")+'\');--slot-bg:'+slotSolid
        : 'background-image:'+heroFallbacks[i%heroFallbacks.length]+';--slot-bg:'+slotSolid;
      // sana faqat yangiliklarda bor \u2014 slaydlarda yorliqning o'zi qoladi
      const kick = [mlGet(it.cat), fmtDate(it.date)].filter(Boolean).join(' \u00b7 ');
      const h2 = '<h2>'+mlGet(it.title)+'</h2>';
      // havolasi yo'q (yoki '#') slayd bosiladigan bo'lmasin
      const head = (it.href && it.href !== '#')
        ? '<a class="slide-h2link" href="'+it.href.replace(/"/g,'%22')+'">'+h2+'</a>'
        : h2;
      return '<div class="slide'+(i===0?' on':'')+'" data-i="'+i+'">'
        + '<div class="heroimg" style="'+bg+'"></div>'
        + '<div class="scrim"></div>'
        + '<div class="slide-body"><div class="wrap">'
        + '<div class="slide-panel">'
        + (kick ? '<div class="kicker slide-cat">'+kick+'</div>' : '')
        + head
        + (items.length>1 ? dotsRow(items.length, i) : '')
        + '</div>'
        + '</div></div></div>';
    }).join('');
  }
  buildHero();

  // ---- render homepage sections from Store (CMS-connected) ----
  function mlg(v){ if (v && typeof v==='object'){ const L=(window.I18N?I18N.lang:'uz'); return v[L]||v.uz||v.ru||v.en||''; } return (window.I18N?I18N.tl(v||''):(v||'')); }
  // Nashr kartalarida qisqa (displey) sarlavha — bo'sh bo'lsa to'liq sarlavha.
  // site-common.js'dagi Site.dispTitle bilan bir xil mantiq (bu fayl alohida nusxa).
  function dispT(it){ if(!it) return ''; const s=mlg(it.shortTitle); return (s&&String(s).trim())?s:mlg(it.title); }
  const MON = (window.I18N ? I18N.months() : ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']);
  function imgTag(src, fallbackData){
    return src ? '<img src="'+src+'" alt="" style="width:100%;height:100%;object-fit:cover">' : '';
  }
  function renderHome(){
    let news=[],pubs=[],exps=[],events=[];
    try{
      news = Store.all('news').filter(n=>n.status==='published').sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
      pubs = Store.all('publications').filter(p=>p.status==='published').slice(0,3);
      exps = Store.all('experts').sort((a,b)=>(a.order||0)-(b.order||0)).slice(0,4);
      const today = new Date().toISOString().slice(0,10);
      events = Store.all('events').filter(e=>e.status==='published').sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
      const up = events.filter(e=>(e.date||'')>=today); events = (up.length?up:events).slice(0,3);
    }catch(e){ return; }

    // STATS — admin paneldan (settings.stats)
    try{
      const sd = (Store.settings().stats)||[];
      const sc = document.querySelector('.stats');
      if(sc && sd.length){
        sc.innerHTML = sd.map(function(s){ return '<div class="stat"><div class="n">'+mlg(s.n)+'</div><div class="c">'+mlg(s.c)+'</div></div>'; }).join('');
      }
    }catch(e){}

    // NEWS: featured + list
    const ng = document.querySelector('.news-grid');
    if(ng && news.length){
      const f = news[0]; const rest = news.slice(1,6);
      ng.innerHTML =
        '<a class="feat rv" href="yangilik.html?id='+f.id+'" style="cursor:pointer">'
        + (f.cover?'<div class="ph" style="padding:0">'+imgTag(f.cover)+'</div>':'<div class="ph" data-l="asosiy yangilik"></div>')
        + '<div class="meta">'+(f.category?'<span class="tag">'+mlg(f.category)+'</span>':'')+'<span class="d mono muted">'+fmtDate(f.date)+'</span></div>'
        + '<h3>'+mlg(f.title)+'</h3>'
        + (mlg(f.excerpt)?'<p>'+mlg(f.excerpt)+'</p>':'')
        + '</a>'
        + '<div class="nlist rv">'
        + rest.map(n=>'<a class="nitem" href="yangilik.html?id='+n.id+'">'
            + (n.cover?'<div class="ph" style="padding:0">'+imgTag(n.cover)+'</div>':'<div class="ph" data-l="foto"></div>')
            + '<div><div class="d">'+fmtDate(n.date)+(n.category?' · '+mlg(n.category):'')+'</div><h4>'+mlg(n.title)+'</h4></div></a>').join('')
        + '</div>';
    }

    // PUBLICATIONS
    const pg = document.querySelector('.pub-grid');
    if(pg && pubs.length){
      pg.innerHTML = pubs.map(p=>'<a class="pub rv" href="nashr.html?id='+p.id+'" style="cursor:pointer">'
        + '<div class="cover">'+(p.type?'<span class="badge">'+mlg(p.type)+'</span>':'')
        + (p.cover?imgTag(p.cover):'<div class="ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/></svg></div>')+'</div>'
        + '<div class="body"><div class="t">'+mlg(p.category||'')+(p.year?' · '+p.year:'')+'</div><h3>'+dispT(p)+'</h3>'
        + '<span class="dl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>'+ctaMore+'</span>'
        + '</div></a>').join('');
    }

    // EXPERTS
    const eg = document.querySelector('.exp-grid');
    if(eg && exps.length){
      eg.innerHTML = exps.map(e=>'<a class="exp rv" href="expert.html?id='+e.id+'" style="cursor:pointer">'
        + (e.photo?'<div class="ph" style="padding:0">'+imgTag(e.photo)+'</div>':'<div class="ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="9" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></svg></div>')
        + '<div class="role">'+mlg(e.role)+'</div><h4>'+mlg(e.name)+'</h4><div class="sub">'+mlg(e.sub)+'</div></a>').join('');
    }

    // PARTNERS — avto-aylanma lenta (marquee)
    const pm = document.getElementById('partnersMarquee');
    if(pm){
      let partners=[]; try{ partners = Store.all('partners'); }catch(e){}
      if(partners.length){
        const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
        // monogramma: nomdan bosh harflar
        const initials = n => { const w=String(n||'?').trim().split(/\s+/); return (w.length>=2 ? (w[0][0]+w[1][0]) : String(n||'?').slice(0,2)).toUpperCase(); };
        // nomdan barqaror rang (harmonik palitra)
        const MC = ['#0f5689','#1d6a94','#2e7d6b','#8a5a2b','#5b5ea6','#9a3b52','#3a7ca5','#726a95'];
        const colorFor = n => { let h=0; const s=String(n||''); for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return MC[h%MC.length]; };
        const tile = p => {
          const inner = p.logo
            ? '<img src="'+Site.safeUrl(p.logo)+'" alt="'+esc(p.name)+'">'
            : '<span class="pmono" style="background:'+colorFor(p.name)+'">'+esc(initials(p.name))+'</span><span class="pname">'+esc(p.name)+'</span>';
          const cls = 'plogo'+(p.logo?'':' mono');
          return (p.url && p.url!=='#')
            ? '<a class="'+cls+'" href="'+Site.safeUrl(p.url)+'" target="_blank" rel="noopener" title="'+esc(p.name)+'">'+inner+'</a>'
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
      } else { pm.closest('section').style.display='none'; }
    }

    // EVENTS
    const evWrap = document.querySelector('.events .rv');
    if(evWrap && events.length){
      evWrap.innerHTML = events.map(e=>{
        const p=String(e.date||'').split('-'); const dd=p[2]||''; const mm=MON[parseInt(p[1],10)-1]||'';
        return '<a class="ev" href="tadbirlar.html" style="cursor:pointer;color:inherit">'
          + '<div class="date"><span class="dd">'+dd+'</span><span class="mm">'+mm+'</span></div>'
          + '<div><h3>'+mlg(e.title)+'</h3><div class="loc">'+(e.time?'◷ '+e.time+' · ':'')+mlg(e.location)+'</div></div>'
          + '</a>';
      }).join('');
    }
  }
  // MUHIM: renderHome xato bersa ham skript davom etsin — aks holda pastdagi
  // reveal (.rv) ulanmay qoladi va butun sahifa opacity:0 da "ko'rinmas" bo'ladi
  // (2026-07-16: api.php buzilganda aynan shu yuz bergan edi).
  try { renderHome(); } catch(e){ console.error('renderHome:', e); }

  // ---- hero slider ----
  try {
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
