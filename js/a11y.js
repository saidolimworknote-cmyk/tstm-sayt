/* ============================================================
   TSTM — Maxsus imkoniyatlar (gov.uz uslubida)
   Hammasi tekin: standart veb-texnologiyalar + brauzer Web Speech API.
   ============================================================ */
(function (w) {
  var KEY = 'tstm_a11y';
  var LKEY = 'tstm_site_lang';
  var lang = (function(){ try { return localStorage.getItem(LKEY) || 'uz'; } catch{ return 'uz'; } })();

  var STR = {
    title:    { uz: 'Maxsus imkoniyatlar', ru: 'Специальные возможности', en: 'Accessibility' },
    mDef:     { uz: 'Oddiy ko‘rinish', ru: 'Обычный вид', en: 'Normal view' },
    mContrast:{ uz: 'Yuqori kontrastli ko‘rinish', ru: 'Высококонтрастный вид', en: 'High contrast view' },
    mGray:    { uz: 'Rangsiz ko‘rinish', ru: 'Бесцветный вид', en: 'Grayscale view' },
    mNoimg:   { uz: 'Rasmsiz ko‘rinish', ru: 'Вид без изображений', en: 'No images view' },
    fontSize: { uz: "Shrift o\u2018lchami:", ru: 'Размер шрифта:', en: 'Font size:' },
    scale:    { uz: 'Masshtab:', ru: 'Масштаб:', en: 'Scale:' },
    reader:   { uz: 'Ekran suxandoni:', ru: 'Экранный диктор:', en: 'Screen reader:' },
    onoff:    { uz: "Yoqish / O\u2018chirish", ru: 'Вкл / Выкл', en: 'On / Off' },
    male:     { uz: 'Erkak ovozi', ru: 'Мужской голос', en: 'Male voice' },
    female:   { uz: 'Ayol ovozi', ru: 'Женский голос', en: 'Female voice' },
    translate:{ uz: 'Google tarjimon:', ru: 'Google переводчик:', en: 'Google translate:' },
    pickLang: { uz: 'Tilni tanlang', ru: 'Выберите язык', en: 'Select language' },
    readMode: { uz: "O\u2018qish rejimi", ru: 'Режим чтения', en: 'Reading mode' },
    reset:    { uz: "Boshlang\u2018ich holatga qaytarish", ru: 'Сбросить настройки', en: 'Reset to default' },
    close:    { uz: 'Yopish', ru: 'Закрыть', en: 'Close' },
    readerHint:{ uz: "Yoqilganda: matn ustiga bosing \u2014 ovozli o\u2018qiladi.", ru: 'При включении: нажмите на текст — он будет озвучен.', en: 'When on: click any text to hear it read aloud.' },
    transHint:{ uz: 'Sahifani istalgan tilga tarjima qiladi (Google).', ru: 'Переводит страницу на любой язык (Google).', en: 'Translates the page to any language (Google).' },
    exitRead: { uz: "O\u2018qish rejimidan chiqish", ru: 'Выйти из режима чтения', en: 'Exit reading mode' }
  };
  function t(k){ var o = STR[k]; return o ? (o[lang] || o.uz) : k; }

  var defaults = { scheme: 'def', font: 2, scale: 0, reader: false, voice: 'male' };
  function load(){ try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch{ return Object.assign({}, defaults); } }
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(state)); } catch{} }
  var state = load();

  var FONTS = [0.85, 0.92, 1, 1.12, 1.25, 1.4]; // 6 pog'ona (slider)
  var SCALES = [1, 1.1, 1.25, 1.4]; // masshtab

  // Har bir matn elementini asl o'lchamiga nisbatan masshtablaymiz.
  // Sayt px'da qurilgani uchun (root font-size ta'sir qilmaydi) — yagona ishonchli yo'l shu.
  var FS_SEL = 'h1,h2,h3,h4,h5,h6,p,li,a,span,button,label,input,textarea,select,td,th,blockquote,figcaption,small,strong,b,em,i,dt,dd,cite,summary,div,section,article,header,footer,nav,main,aside';
  function fsExcluded(n){ return n.closest('.a11y-panel') || n.closest('.a11y-overlay') || n.closest('#a11y-read-overlay'); }
  var fontDirty = false;
  function scaleFonts(){
    var f = FONTS[state.font] != null ? FONTS[state.font] : 1;
    if (f === 1 && !fontDirty) return; // standart 100% va hali masshtablanmagan — ortiqcha ish shart emas
    var nodes = document.querySelectorAll(FS_SEL), i, n;
    // 1) asl o'lchamni bir marta xotiraga olamiz (faqat o'qish)
    for (i = 0; i < nodes.length; i++){ n = nodes[i]; if (fsExcluded(n)) continue;
      if (n.getAttribute('data-a11y-fs') == null){ n.setAttribute('data-a11y-fs', String(parseFloat(getComputedStyle(n).fontSize) || 0)); } }
    // 2) masshtablaymiz (faqat yozish)
    for (i = 0; i < nodes.length; i++){ n = nodes[i]; if (fsExcluded(n)) continue;
      var b = parseFloat(n.getAttribute('data-a11y-fs')); if (!b) continue;
      n.style.fontSize = (f === 1 ? '' : (b * f).toFixed(2) + 'px'); }
    fontDirty = (f !== 1);
  }

  function apply(){
    var el = document.documentElement;
    el.setAttribute('data-a11y-scheme', state.scheme);
    // Tashrifchi tanlovi → sayt standart temasi (site-common hisoblab qo'yadi) → light
    var realTheme = 'light'; try { realTheme = localStorage.getItem('tstm_site_theme') || window.TSTM_SITE_THEME || 'light'; } catch{}
    if (state.scheme === 'gray') el.setAttribute('data-theme','dark');
    else if (state.scheme === 'contrast' || state.scheme === 'noimg') el.setAttribute('data-theme','light');
    else el.setAttribute('data-theme', realTheme);
    try { document.body.style.zoom = SCALES[state.scale] || 1; } catch{}
    el.classList.toggle('a11y-active', state.scheme !== 'def' || state.font !== 2 || state.scale !== 0);
    try { scaleFonts(); } catch{}
  }

  // ---- styles (tashqi a11y.css) ----
  // Qat'iy CSP (style-src 'self') skript orqali joylashtirilgan <style> elementini
  // ham bloklaydi. Shuning uchun uslublar tashqi a11y.css'da va <link> orqali
  // yuklanadi (barcha sahifalar ildiz papkada — nisbiy yo'l to'g'ri ishlaydi).
  var cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = 'css/a11y.css?v=3';
  document.head.appendChild(cssLink);

  var ICONS = {
    sun:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4"/></svg>',
    half: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>',
    contrast:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5" fill="currentColor"/></svg>',
    img:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m3 17 5-4 4 3 3-3 6 5"/></svg>'
  };

  // available browser voices
  var voices = [];
  function loadVoices(){ try { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch{ voices = []; } }
  if (window.speechSynthesis) { loadVoices(); try { speechSynthesis.onvoiceschanged = loadVoices; } catch{} }
  function pickVoice(){
    if (!voices.length) loadVoices();
    var pref = lang === 'ru' ? 'ru' : (lang === 'en' ? 'en' : 'uz');
    var byLang = voices.filter(function(v){ return v.lang && v.lang.toLowerCase().indexOf(pref) === 0; });
    var pool = byLang.length ? byLang : voices;
    if (!pool.length) return null;
    // erkak/ayol taxminiy: ayol uchun ko'pincha 2-ovoz yoki nomida 'female'
    var female = pool.find(function(v){ return /female|ayol|жен|zira|elena/i.test(v.name); });
    var male = pool.find(function(v){ return /male|erkak|муж|david|pavel/i.test(v.name); });
    if (state.voice === 'female') return female || pool[1] || pool[0];
    return male || pool[0];
  }
  function speak(text){
    if (!window.speechSynthesis || !text) return;
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      var v = pickVoice(); if (v) u.voice = v;
      u.lang = v ? v.lang : (lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ');
      u.rate = 0.96;
      speechSynthesis.speak(u);
    } catch{}
  }
  // reader click handler
  var readerBound = false;
  function readerClick(e){
    var el = e.target.closest('p,h1,h2,h3,h4,h5,li,a,span,button,td,th,figcaption,blockquote,.lead');
    if (!el || el.closest('.a11y-panel')) return;
    var txt = (el.innerText || el.textContent || '').trim();
    if (txt) { speak(txt); document.querySelectorAll('.a11y-read-hl').forEach(function(x){x.classList.remove('a11y-read-hl');}); el.classList.add('a11y-read-hl'); }
  }
  function setReader(on){
    state.reader = on;
    document.documentElement.classList.toggle('a11y-reading-on', on);
    if (on && !readerBound) { document.addEventListener('click', readerClick, true); readerBound = true; }
    if (!on) { try { speechSynthesis.cancel(); } catch{} document.querySelectorAll('.a11y-read-hl').forEach(function(x){x.classList.remove('a11y-read-hl');}); }
  }

  // ---- Google Translate (tekin widget) ----
  var GT_LANGS = 'uz,ru,en,kk,ky,tg,tk,tr,ar,zh-CN,fr,de,es,ko,ja';
  function ensureGoogleTranslate(cb){
    if (window.__gtLoaded) { cb && cb(); return; }
    window.googleTranslateElementInit = function(){
      try { new google.translate.TranslateElement({ pageLanguage: lang, includedLanguages: GT_LANGS, autoDisplay: false }, 'a11y-gt-host'); } catch{}
      window.__gtLoaded = true; cb && cb();
    };
    var sc = document.createElement('script');
    sc.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    sc.onerror = function(){ cb && cb(true); };
    document.body.appendChild(sc);
  }
  function doTranslate(target){
    ensureGoogleTranslate(function(err){
      if (err) { return; }
      var tryer = function(n){
        var sel = document.querySelector('#a11y-gt-host select.goog-te-combo') || document.querySelector('select.goog-te-combo');
        if (sel){ sel.value = target; sel.dispatchEvent(new Event('change')); }
        else if (n > 0) setTimeout(function(){ tryer(n-1); }, 250);
      };
      tryer(12);
    });
  }

  function rangeHTML(id, count, idx, fmt){
    // Dinamik joylashuvlar (dots left, fill width, bub left) inline style bilan
    // emas — CSP style-src 'unsafe-inline'siz. Foizlar data-p'da; buildPanel'dagi
    // forEach ularni DOM'ga qo'ygach .style orqali beradi (skriptli uslub ruxsat).
    var dots = '';
    for (var i = 0; i < count; i++){ dots += '<i data-p="'+(i/(count-1)*100)+'"></i>'; }
    return '<div class="a11y-range" data-rid="'+id+'" data-count="'+count+'">'
      + '<input type="range" min="0" max="'+(count-1)+'" step="1" value="'+idx+'">'
      + '<div class="fill"></div>'
      + '<div class="dots">'+dots+'</div>'
      + '<div class="bub">'+fmt(idx)+'</div></div>';
  }

  function buildPanel(){
    var ov = document.createElement('div'); ov.className = 'a11y-overlay';
    var p = document.createElement('div'); p.className = 'a11y-panel'; p.setAttribute('role','dialog'); p.setAttribute('aria-modal','true'); p.setAttribute('aria-label', t('title'));

    var fontPct = function(i){ return Math.round(FONTS[i] * 100) + '%'; };
    var scalePct = function(i){ return Math.round(SCALES[i] * 100) + '%'; };

    p.innerHTML =
      '<div class="a11y-h"><button class="x" aria-label="'+t('close')+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg></button><h3>'+t('title')+'</h3></div>'
      + '<div class="a11y-icons">'
        + '<button class="a11y-ic'+(state.scheme==='def'?' on':'')+'" data-sch="def" title="'+t('mDef')+'">'+ICONS.sun+'</button>'
        + '<button class="a11y-ic'+(state.scheme==='contrast'?' on':'')+'" data-sch="contrast" title="'+t('mContrast')+'">'+ICONS.half+'</button>'
        + '<button class="a11y-ic'+(state.scheme==='gray'?' on':'')+'" data-sch="gray" title="'+t('mGray')+'">'+ICONS.contrast+'</button>'
        + '<button class="a11y-ic'+(state.scheme==='noimg'?' on':'')+'" data-sch="noimg" title="'+t('mNoimg')+'">'+ICONS.img+'</button>'
      + '</div>'
      + '<div class="a11y-s"><div class="lbl">'+t('fontSize')+'</div>'+rangeHTML('font', FONTS.length, state.font, fontPct)+'</div>'
      + '<div class="a11y-s"><div class="lbl">'+t('scale')+'</div>'+rangeHTML('scale', SCALES.length, state.scale, scalePct)+'</div>'
      + '<div class="a11y-s"><div class="lbl">'+t('reader')+'<button class="a11y-help" type="button" data-help aria-label="?">?</button></div>'
        + '<label class="a11y-check"><input type="checkbox" id="a11y-reader" '+(state.reader?'checked':'')+'><span>'+t('onoff')+'</span></label>'
        + '<div class="a11y-radios" id="a11y-voices">'
          + '<label class="a11y-radio'+(state.reader?'':' dim')+'"><input type="radio" name="a11yvoice" value="male" '+(state.voice==='male'?'checked':'')+'><span>'+t('male')+'</span></label>'
          + '<label class="a11y-radio'+(state.reader?'':' dim')+'"><input type="radio" name="a11yvoice" value="female" '+(state.voice==='female'?'checked':'')+'><span>'+t('female')+'</span></label>'
        + '</div><div class="a11y-hint" hidden>'+t('readerHint')+'</div></div>'
      + '<div class="a11y-s"><div class="lbl">'+t('translate')+'<button class="a11y-help" type="button" data-help aria-label="?">?</button></div>'
        + '<select class="a11y-sel" id="a11y-gt"><option value="">'+t('pickLang')+'</option>'
          + '<option value="uz">O\u2018zbekcha</option><option value="ru">Русский</option><option value="en">English</option>'
          + '<option value="kk">Қазақша</option><option value="ky">Кыргызча</option><option value="tg">Тоҷикӣ</option>'
          + '<option value="tr">Türkçe</option><option value="ar">العربية</option><option value="zh-CN">中文</option>'
          + '<option value="fr">Français</option><option value="de">Deutsch</option><option value="es">Español</option>'
          + '<option value="ko">한국어</option><option value="ja">日本語</option>'
        + '</select><div class="a11y-hint" hidden>'+t('transHint')+'</div><div id="a11y-gt-host" hidden></div></div>'
      + '<button class="a11y-bigbtn" id="a11y-readmode">'+t('readMode')+'</button>'
      + '<button class="a11y-reset" id="a11y-reset">'+t('reset')+'</button>';

    document.body.appendChild(ov); document.body.appendChild(p);

    var lastFocus = null;
    function open(opener){ lastFocus = opener || document.activeElement; p.classList.add('open'); ov.classList.add('open'); setTimeout(function(){ try { p.querySelector('.x').focus(); } catch{} }, 60); }
    function close(){ p.classList.remove('open'); ov.classList.remove('open'); try { if (lastFocus && lastFocus.focus) lastFocus.focus(); } catch{} }
    ov.addEventListener('click', close);
    p.querySelector('.x').addEventListener('click', close);
    // Escape bilan yopish (WCAG)
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && p.classList.contains('open')) close(); });

    // scheme icons
    p.querySelectorAll('.a11y-ic[data-sch]').forEach(function(b){ b.addEventListener('click', function(){
      state.scheme = b.dataset.sch;
      p.querySelectorAll('.a11y-ic[data-sch]').forEach(function(x){ x.classList.toggle('on', x===b); });
      save(); apply();
    }); });
    // images toggle removed — 4th icon is now the "noimg" scheme (handled above)

    // ranges
    p.querySelectorAll('.a11y-range').forEach(function(r){
      var input = r.querySelector('input'), fill = r.querySelector('.fill'), bub = r.querySelector('.bub');
      var rid = r.dataset.rid, count = +r.dataset.count;
      var fmt = rid === 'font' ? fontPct : scalePct;
      // Boshlang'ich joylashuvlar (ilgari inline style edi — endi CSP uchun .style orqali).
      r.querySelectorAll('.dots i').forEach(function(d){ d.style.left = d.dataset.p + '%'; });
      var pct0 = (+input.value)/(count-1)*100;
      fill.style.width = pct0 + '%'; bub.style.left = pct0 + '%';
      input.addEventListener('input', function(){
        var v = +input.value, pct = v/(count-1)*100;
        fill.style.width = pct + '%'; bub.style.left = pct + '%'; bub.textContent = fmt(v);
        if (rid === 'font') state.font = v; else state.scale = v;
        save(); apply();
      });
    });

    // reader
    var rc = p.querySelector('#a11y-reader');
    rc.addEventListener('change', function(){
      setReader(rc.checked);
      p.querySelectorAll('#a11y-voices .a11y-radio').forEach(function(x){ x.classList.toggle('dim', !rc.checked); });
      save();
    });
    p.querySelectorAll('input[name=a11yvoice]').forEach(function(r){ r.addEventListener('change', function(){ state.voice = r.value; save(); }); });

    // "?" yordam tugmalari — izohni ochib/yopadi (gov.uz uslubi)
    p.querySelectorAll('.a11y-help[data-help]').forEach(function(b){ b.addEventListener('click', function(){
      var s = b.closest('.a11y-s'); var h = s && s.querySelector('.a11y-hint'); if (h) h.hidden = !h.hidden;
    }); });

    // google translate
    p.querySelector('#a11y-gt').addEventListener('change', function(e){ if (e.target.value) doTranslate(e.target.value); });

    // reading mode
    p.querySelector('#a11y-readmode').addEventListener('click', function(){ close(); toggleReadingMode(); });

    // reset
    p.querySelector('#a11y-reset').addEventListener('click', function(){
      state = Object.assign({}, defaults); save(); apply(); setReader(false);
      try { document.body.style.zoom = 1; } catch{}
      // refresh controls
      p.querySelectorAll('.a11y-ic[data-sch]').forEach(function(x){ x.classList.toggle('on', x.dataset.sch===state.scheme); });
      p.querySelectorAll('.a11y-range').forEach(function(r){
        var input=r.querySelector('input'), fill=r.querySelector('.fill'), bub=r.querySelector('.bub');
        var rid=r.dataset.rid, count=+r.dataset.count, idx= rid==='font'?state.font:state.scale, fmt= rid==='font'?fontPct:scalePct;
        input.value=idx; var pct=idx/(count-1)*100; fill.style.width=pct+'%'; bub.style.left=pct+'%'; bub.textContent=fmt(idx);
      });
      rc.checked=false; p.querySelectorAll('#a11y-voices .a11y-radio').forEach(function(x){x.classList.add('dim');});
    });

    w.__a11yOpen = open;
  }

  // ---- O'qish rejimi (reading mode) — toza tipografik oqim ----
  function closeReading(){ var o = document.getElementById('a11y-read-overlay'); if (o){ o.remove(); document.body.style.overflow=''; } }
  function toggleReadingMode(){
    if (document.getElementById('a11y-read-overlay')) { closeReading(); return; }
    var main = document.querySelector('main') || document.querySelector('.article') || document.body;
    var clone = main.cloneNode(true);
    // UI / bezak bloklarni butunlay olib tashlaymiz (faqat o'qiladigan kontent qoladi)
    clone.querySelectorAll('header,footer,nav,.a11y-panel,.a11y-overlay,.hero,.hero-ctrl,.hero-arrows,.slide-dots,.dot,.dots,.gs-ov,.sub-ov,.mnav,.page-banner .crumb,.filterbar,.tabs,.share-row,.act-row,.socials,.arrow-link,.go,.badge,.tag,button,svg,form,input,select,textarea,iframe,style,script,noscript,.ph').forEach(function(x){ x.remove(); });
    // barcha klass va inline-uslublarni olib tashlaymiz -> grid/card yo'qoladi, toza matn oqimi qoladi
    clone.querySelectorAll('*').forEach(function(el){ el.removeAttribute('class'); el.removeAttribute('style'); el.removeAttribute('data-a11y-fs'); el.removeAttribute('data-l'); });
    // rasmning yo'qolib qolgan (lazy) manbasini tiklaymiz
    clone.querySelectorAll('img').forEach(function(im){ var ds = im.getAttribute('data-src'); if (ds && !im.getAttribute('src')) im.setAttribute('src', ds); im.removeAttribute('loading'); });
    var ov = document.createElement('div'); ov.id = 'a11y-read-overlay';
    ov.setAttribute('role','dialog'); ov.setAttribute('aria-label', t('readMode'));
    var bar = '<div class="a11y-read-bar"><b>'+t('readMode')+'</b><button id="a11y-read-x" type="button">✕ '+t('exitRead')+'</button></div>';
    var wrap = document.createElement('div'); wrap.className = 'a11y-read-body';
    wrap.innerHTML = clone.innerHTML;
    ov.innerHTML = bar; ov.appendChild(wrap);
    document.body.appendChild(ov); document.body.style.overflow='hidden';
    document.getElementById('a11y-read-x').addEventListener('click', closeReading);
    document.getElementById('a11y-read-x').focus();
    document.addEventListener('keydown', function onEsc(e){ if (e.key === 'Escape'){ closeReading(); document.removeEventListener('keydown', onEsc); } });
  }

  function init(){
    apply();
    if (state.reader) setReader(true);
    buildPanel();
    // EVENT DELEGATION — dinamik header/drawer tugmalari uchun ham ishonchli
    document.addEventListener('click', function(e){
      var t = e.target;
      var trig = t && t.closest ? t.closest('.a11y-btn, [data-a11y-open]') : null;
      if (!trig) return;
      e.preventDefault();
      if (w.__a11yOpen) w.__a11yOpen(trig);
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  w.A11Y = { open: function(){ if(w.__a11yOpen) w.__a11yOpen(); }, apply: apply };
})(window);
