/* ============================================================
   TSTM — Maxsus imkoniyatlar (gov.uz uslubida)
   Hammasi tekin: standart veb-texnologiyalar + brauzer Web Speech API.
   ============================================================ */
(function (w) {
  var KEY = 'tstm_a11y';
  var LKEY = 'tstm_site_lang';
  var lang = (function(){ try { return localStorage.getItem(LKEY) || 'uz'; } catch(e){ return 'uz'; } })();

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
  function load(){ try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch(e){ return Object.assign({}, defaults); } }
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e){} }
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
    var realTheme = 'light'; try { realTheme = localStorage.getItem('tstm_site_theme') || window.TSTM_SITE_THEME || 'light'; } catch(e){}
    if (state.scheme === 'gray') el.setAttribute('data-theme','dark');
    else if (state.scheme === 'contrast' || state.scheme === 'noimg') el.setAttribute('data-theme','light');
    else el.setAttribute('data-theme', realTheme);
    try { document.body.style.zoom = SCALES[state.scale] || 1; } catch(e){}
    el.classList.toggle('a11y-active', state.scheme !== 'def' || state.font !== 2 || state.scale !== 0);
    try { scaleFonts(); } catch(e){}
  }

  // ---- styles ----
  var css = document.createElement('style');
  css.textContent = [
    'html[data-a11y-scheme="contrast"] body > *:not(.a11y-panel):not(.a11y-overlay):not(#a11y-read-overlay){filter:grayscale(1) contrast(1.35);}',
    'html[data-a11y-scheme="gray"] body > *:not(.a11y-panel):not(.a11y-overlay):not(#a11y-read-overlay){filter:grayscale(1);}',
    'html[data-a11y-scheme="noimg"] body > *:not(.a11y-panel):not(.a11y-overlay):not(#a11y-read-overlay){filter:grayscale(1);}',
    'html[data-a11y-scheme="noimg"] img{opacity:0 !important;}',
    'html[data-a11y-scheme="noimg"] .heroimg,html[data-a11y-scheme="noimg"] .ph,html[data-a11y-scheme="noimg"] [style*="background-image"]{background-image:none !important;}',
    'html.a11y-active[data-a11y-scheme="noimg"] .page-banner{background-image:none !important;}',
    /* reader highlight */
    '.a11y-reading-on *{cursor:help;}',
    '.a11y-read-hl{outline:3px solid #0D4483 !important;outline-offset:2px;background:rgba(13,68,131,.08) !important;}',
    /* ===== O'QISH REJIMI — toza, kitobsimon (gov.uz uslubi) ===== */
    '#a11y-read-overlay{position:fixed;inset:0;z-index:99999;background:#f6f4ee;overflow-y:auto;}',
    '.a11y-read-bar{position:sticky;top:0;z-index:2;background:#0D4483;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:15px 26px;font-family:"Inter",system-ui,sans-serif;box-shadow:0 2px 16px rgba(0,0,0,.18);}',
    '.a11y-read-bar b{font-family:"Spectral",Georgia,serif;font-weight:600;font-size:18px;}',
    '#a11y-read-x{background:rgba(255,255,255,.16);border:0;color:#fff;padding:10px 18px;border-radius:8px;cursor:pointer;font-size:13px;font-family:inherit;transition:background .15s;}',
    '#a11y-read-x:hover{background:rgba(255,255,255,.3);}',
    '.a11y-read-body{max-width:740px;margin:0 auto;padding:52px 28px 100px;font-family:Georgia,"Spectral",serif;font-size:20px;line-height:1.85;color:#1e1e1e;}',
    '.a11y-read-body>*{max-width:100%;}',
    '.a11y-read-body h1{font-size:35px;line-height:1.18;margin:0 0 26px;font-weight:700;letter-spacing:-.01em;}',
    '.a11y-read-body h2{font-size:27px;line-height:1.25;margin:44px 0 16px;font-weight:700;}',
    '.a11y-read-body h3,.a11y-read-body h4{font-size:22px;line-height:1.3;margin:34px 0 12px;font-weight:600;}',
    '.a11y-read-body p{margin:0 0 22px;}',
    '.a11y-read-body ul,.a11y-read-body ol{margin:0 0 24px;padding-left:28px;}',
    '.a11y-read-body li{margin-bottom:10px;}',
    '.a11y-read-body a{color:#0a4163;text-decoration:underline;text-underline-offset:2px;}',
    '.a11y-read-body img{display:block;max-width:100%;height:auto;margin:30px auto;border-radius:10px;}',
    '.a11y-read-body blockquote{margin:30px 0;padding:8px 0 8px 22px;border-left:4px solid #0D4483;font-style:italic;color:#3a3a3a;}',
    '.a11y-read-body figure{margin:30px 0;}',
    '.a11y-read-body figcaption{font-size:15px;color:#6a6a6a;text-align:center;margin-top:10px;font-family:"Inter",sans-serif;}',
    '.a11y-read-body hr{border:0;border-top:1px solid #dcd6ca;margin:38px 0;}',
    '@media(max-width:760px){.a11y-read-bar{padding:13px 16px;}.a11y-read-body{padding:34px 18px 72px;font-size:18px;}.a11y-read-body h1{font-size:28px;}.a11y-read-body h2{font-size:23px;}}',
    /* panel */
    '.a11y-panel{position:fixed;top:0;right:0;bottom:0;width:430px;max-width:92vw;background:#fff;color:#1a1a1a;z-index:99999;box-shadow:-10px 0 40px rgba(0,0,0,.25);transform:translateX(100%);transition:transform .3s;overflow-y:auto;font-family:"Inter",system-ui,sans-serif;border-left:4px solid #0D4483;}',
    '.a11y-panel.open{transform:none;}',
    '.a11y-panel *{letter-spacing:normal !important;}',
    '.a11y-h{display:flex;align-items:center;gap:10px;padding:20px 24px;border-bottom:1px solid #e6e6e2;}',
    '.a11y-h .x{background:none;border:0;cursor:pointer;width:34px;height:34px;display:flex;align-items:center;justify-content:center;color:#333;border-radius:6px;flex:none;}',
    '.a11y-h .x:hover{background:#f0f0f0;}',
    '.a11y-h .x svg{width:24px;height:24px;}',
    '.a11y-h h3{font-family:"Spectral",Georgia,serif;font-weight:600;font-size:21px;margin:0 auto;text-align:center;color:#1a1a1a;}',
    '.a11y-icons{display:flex;gap:12px;padding:20px 24px 6px;}',
    '.a11y-ic{width:54px;height:46px;border:0;border-radius:8px;background:#8a9099;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s;}',
    '.a11y-ic:hover{background:#6d747d;}',
    '.a11y-ic.on{background:#0D4483;}',
    '.a11y-ic svg{width:24px;height:24px;}',
    '.a11y-s{padding:16px 24px;border-bottom:1px solid #eee;}',
    '.a11y-s .lbl{font-size:15px;color:#1a1a1a;margin-bottom:14px;font-weight:500;display:flex;align-items:center;justify-content:space-between;}',
    '.a11y-help{width:24px;height:24px;border-radius:6px;background:#e4eef6;color:#0D4483;border:0;cursor:pointer;font-size:13px;font-weight:700;flex:none;display:flex;align-items:center;justify-content:center;transition:.15s;}',
    '.a11y-help:hover{background:#0D4483;color:#fff;}',
    '.a11y-hint[hidden]{display:none;}',
    /* range slider */
    '.a11y-range{position:relative;padding:4px 0 26px;}',
    // Kulrang yo'lak endi ::before da chiziladi. Sabab: input'ning O'ZI 6px bo'lsa,
    // mobilda barmoq bilan ushlab bo'lmaydi (thumb 20px ko'rinsa ham, bosish
    // maydoni input qutisi bilan cheklangan). Endi input 24px (WCAG 2.5.8), lekin
    // manfiy margin uni avvalgi 6px joyiga qaytaradi — ko'rinish o'zgarmaydi.
    '.a11y-range::before{content:"";position:absolute;top:4px;left:0;right:0;height:6px;border-radius:4px;background:#dfe3e8;}',
    '.a11y-range input[type=range]{width:100%;-webkit-appearance:none;appearance:none;height:24px;background:transparent;outline:none;margin:-9px 0;position:relative;z-index:1;}',
    '.a11y-range input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid #0D4483;cursor:pointer;}',
    '.a11y-range input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid #0D4483;cursor:pointer;}',
    '.a11y-range .fill{position:absolute;top:4px;left:0;height:6px;border-radius:4px;background:#0D4483;pointer-events:none;}',
    '.a11y-range .dots{position:absolute;top:5px;left:0;right:0;height:8px;pointer-events:none;}',
    '.a11y-range .dots i{position:absolute;width:4px;height:4px;border-radius:50%;background:#9aa3ad;transform:translateX(-50%);}',
    '.a11y-range .bub{position:absolute;top:24px;transform:translateX(-50%);background:#5a6066;color:#fff;font-size:11px;font-family:"IBM Plex Mono",monospace;padding:2px 7px;border-radius:4px;white-space:nowrap;}',
    '.a11y-range .bub::before{content:"";position:absolute;top:-4px;left:50%;transform:translateX(-50%);border:4px solid transparent;border-bottom-color:#5a6066;border-top:0;}',
    /* checkbox + radio */
    '.a11y-check{display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14.5px;margin-bottom:14px;min-height:24px;}',
    '.a11y-check input{width:20px;height:20px;accent-color:#0D4483;cursor:pointer;}',
    '.a11y-radios{display:flex;gap:24px;}',
    // min-height: label — haqiqiy tap nishoni (radio o'zi 18px). WCAG 2.5.8 -> 24px.
    '.a11y-radio{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;min-height:24px;}',
    '.a11y-radio input{width:18px;height:18px;accent-color:#0D4483;cursor:pointer;}',
    '.a11y-radio.dim{opacity:.45;}',
    '.a11y-hint{font-size:12px;color:#777c83;margin-top:6px;line-height:1.5;}',
    '.a11y-sel{width:100%;font-family:inherit;font-size:14.5px;color:#1a1a1a;background:#fff;border:1px solid #d6d6d0;border-radius:6px;padding:13px 14px;outline:none;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238a909a\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:34px;}',
    '.a11y-bigbtn{margin:0 24px 16px;width:calc(100% - 48px);padding:15px;border:1px solid #1a1a1a;background:#fff;color:#1a1a1a;border-radius:8px;cursor:pointer;font-family:"Spectral",Georgia,serif;font-size:16px;font-weight:600;transition:.15s;}',
    '.a11y-bigbtn:hover{background:#1a1a1a;color:#fff;}',
    '.a11y-bigbtn.on{background:#0D4483;color:#fff;border-color:#0D4483;}',
    '.a11y-reset{margin:6px 24px 24px;width:calc(100% - 48px);padding:15px;border:0;background:#eef0f3;color:#5a6066;border-radius:8px;cursor:pointer;font-size:14px;transition:.15s;}',
    '.a11y-reset:hover{background:#0D4483;color:#fff;}',
    '.a11y-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:99998;opacity:0;visibility:hidden;transition:.3s;}',
    '.a11y-overlay.open{opacity:1;visibility:visible;}',
    /* google translate cosmetic cleanup */
    '.goog-te-banner-frame{display:none !important;}body{top:0 !important;}',
    '#goog-gt-tt,.goog-te-balloon-frame{display:none !important;}.goog-text-highlight{background:none !important;box-shadow:none !important;}',
    /* ===== QORONG‘U (dark) REJIM — panel sayt temasiga moslashadi ===== */
    'html[data-theme="dark"] .a11y-panel{background:var(--panel);color:var(--ink);border-left-color:var(--accent);box-shadow:-10px 0 40px rgba(0,0,0,.55);}',
    'html[data-theme="dark"] .a11y-h{border-bottom-color:var(--line);}',
    'html[data-theme="dark"] .a11y-h h3{color:var(--ink);}',
    'html[data-theme="dark"] .a11y-h .x{color:var(--ink-2);}',
    'html[data-theme="dark"] .a11y-h .x:hover{background:var(--bg-3);}',
    'html[data-theme="dark"] .a11y-ic{background:var(--bg-3);}',
    'html[data-theme="dark"] .a11y-ic:hover{background:#35456a;}',
    'html[data-theme="dark"] .a11y-ic.on{background:var(--accent);}',
    'html[data-theme="dark"] .a11y-s{border-bottom-color:var(--line);}',
    'html[data-theme="dark"] .a11y-s .lbl{color:var(--ink);}',
    'html[data-theme="dark"] .a11y-check,html[data-theme="dark"] .a11y-radio{color:var(--ink);}',
    'html[data-theme="dark"] .a11y-check input,html[data-theme="dark"] .a11y-radio input{accent-color:var(--accent);}',
    'html[data-theme="dark"] .a11y-hint{color:var(--muted);}',
    'html[data-theme="dark"] .a11y-range::before{background:var(--line);}',
    'html[data-theme="dark"] .a11y-range .fill{background:var(--accent);}',
    'html[data-theme="dark"] .a11y-range .dots i{background:#45557a;}',
    'html[data-theme="dark"] .a11y-range input[type=range]::-webkit-slider-thumb{border-color:var(--accent);background:var(--panel);}',
    'html[data-theme="dark"] .a11y-range input[type=range]::-moz-range-thumb{border-color:var(--accent);background:var(--panel);}',
    'html[data-theme="dark"] .a11y-sel{background:var(--bg);color:var(--ink);border-color:var(--line);}',
    'html[data-theme="dark"] .a11y-bigbtn{background:transparent;color:var(--ink);border-color:#46557a;}',
    'html[data-theme="dark"] .a11y-bigbtn:hover{background:var(--ink);color:var(--panel);}',
    'html[data-theme="dark"] .a11y-bigbtn.on{background:var(--accent);color:#fff;border-color:var(--accent);}',
    'html[data-theme="dark"] .a11y-reset{background:var(--bg-3);color:var(--ink-2);}',
    'html[data-theme="dark"] .a11y-reset:hover{background:var(--accent);color:#fff;}',
    'html[data-theme="dark"] .a11y-help{background:var(--accent-soft);color:var(--accent-d);}',
    'html[data-theme="dark"] .a11y-help:hover{background:var(--accent);color:#fff;}',
    '@media(max-width:760px){.a11y-panel{width:360px;}}'
  ].join('\n');
  document.head.appendChild(css);

  var ICONS = {
    sun:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4"/></svg>',
    half: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>',
    contrast:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5" fill="currentColor"/></svg>',
    img:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m3 17 5-4 4 3 3-3 6 5"/></svg>'
  };

  // available browser voices
  var voices = [];
  function loadVoices(){ try { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch(e){ voices = []; } }
  if (window.speechSynthesis) { loadVoices(); try { speechSynthesis.onvoiceschanged = loadVoices; } catch(e){} }
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
    } catch(e){}
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
    if (!on) { try { speechSynthesis.cancel(); } catch(e){} document.querySelectorAll('.a11y-read-hl').forEach(function(x){x.classList.remove('a11y-read-hl');}); }
  }

  // ---- Google Translate (tekin widget) ----
  var GT_LANGS = 'uz,ru,en,kk,ky,tg,tk,tr,ar,zh-CN,fr,de,es,ko,ja';
  function ensureGoogleTranslate(cb){
    if (window.__gtLoaded) { cb && cb(); return; }
    window.googleTranslateElementInit = function(){
      try { new google.translate.TranslateElement({ pageLanguage: lang, includedLanguages: GT_LANGS, autoDisplay: false }, 'a11y-gt-host'); } catch(e){}
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
    var dots = '';
    for (var i = 0; i < count; i++){ dots += '<i style="left:'+(i/(count-1)*100)+'%"></i>'; }
    var pct = idx/(count-1)*100;
    return '<div class="a11y-range" data-rid="'+id+'" data-count="'+count+'">'
      + '<input type="range" min="0" max="'+(count-1)+'" step="1" value="'+idx+'">'
      + '<div class="fill" style="width:'+pct+'%"></div>'
      + '<div class="dots">'+dots+'</div>'
      + '<div class="bub" style="left:'+pct+'%">'+fmt(idx)+'</div></div>';
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
        + '</select><div class="a11y-hint" hidden>'+t('transHint')+'</div><div id="a11y-gt-host" style="display:none"></div></div>'
      + '<button class="a11y-bigbtn" id="a11y-readmode">'+t('readMode')+'</button>'
      + '<button class="a11y-reset" id="a11y-reset">'+t('reset')+'</button>';

    document.body.appendChild(ov); document.body.appendChild(p);

    var lastFocus = null;
    function open(opener){ lastFocus = opener || document.activeElement; p.classList.add('open'); ov.classList.add('open'); setTimeout(function(){ try { p.querySelector('.x').focus(); } catch(e){} }, 60); }
    function close(){ p.classList.remove('open'); ov.classList.remove('open'); try { if (lastFocus && lastFocus.focus) lastFocus.focus(); } catch(e){} }
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
      try { document.body.style.zoom = 1; } catch(e){}
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
    clone.querySelectorAll('header,footer,nav,.a11y-panel,.a11y-overlay,.hero,.hero-ctrl,.hero-arrows,.slide-dots,.dot,.dots,.gs-ov,.sub-ov,#scrollProgress,.mnav,.page-banner .crumb,.filterbar,.tabs,.share-row,.act-row,.socials,.arrow-link,.go,.badge,.tag,button,svg,form,input,select,textarea,iframe,style,script,noscript,.ph').forEach(function(x){ x.remove(); });
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
