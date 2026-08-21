/* diag.js — Diagnostika ("compiler oynasi").
 *
 * Nima qiladi:
 *   1) JS xatolari, promise rejection, tarmoq xatolari (fetch/XHR/404) va
 *      console chiqishini yig'adi;
 *   2) har bir xatoga O'QISHLI SABAB va nima qilish kerakligini yozadi;
 *   3) serverga jimgina yuboradi (admin panelda "Xatoliklar" bo'limida ko'rinadi);
 *   4) panelni FAQAT adminga yoki `?debug=1` bilan ko'rsatadi.
 *
 * MUHIM: bu fayl boshqa barcha skriptlardan OLDIN yuklanishi kerak — aks holda
 * undan avval yuz bergan xatolar ushlanmay qoladi.
 *
 * CSP: inline skript yo'q, uslub <style> orqali bir marta qo'shiladi (style-src
 * 'unsafe-inline' loyihada allaqachon ruxsat etilgan, script-src esa 'self').
 */
(function (w) {
  'use strict';

  var API = 'api.php';
  var MAX = 300;                 // xotirada saqlanadigan yozuvlar chegarasi
  var events = [];               // {kind, msg, src, line, col, stack, cause, hint, at}
  var counts = { error: 0, warn: 0, net: 0, log: 0 };
  var sentFp = Object.create(null); // serverga yuborilgan barmoq izlari (takror yubormaslik)
  var panel = null, listEl = null, badgeEl = null, filter = 'all';
  var booted = false;

  /* ---------------- Sabab izohlash ----------------
     Xato matnini tanib, o'zbekcha SABAB va TAVSIYA beradi. Ro'yxat yuqoridan
     pastga tekshiriladi — birinchi mos kelgani ishlatiladi. */
  var RULES = [
    { re: /is not a function/i,
      cause: 'Chaqirilayotgan narsa funksiya emas (undefined yoki boshqa tur).',
      hint: 'Skript yuklanish tartibini tekshiring: site-common.js / admin-store.js sahifadan oldin ulanganmi? Kesh versiyasi (?v=) eskirgan bo\'lishi ham mumkin.' },
    { re: /(cannot read propert|reading '|of undefined|of null)/i,
      cause: 'Mavjud bo\'lmagan obyektning maydoni o\'qilmoqda (ma\'lumot bo\'sh yoki to\'liq emas).',
      hint: 'Admin panelda shu yozuvni oching — majburiy maydon (sarlavha, sana, rasm) to\'ldirilmagan bo\'lishi mumkin.' },
    { re: /is not defined/i,
      cause: 'O\'zgaruvchi yoki global mavjud emas.',
      hint: 'Kerakli .js fayl sahifaga ulanmagan yoki noto\'g\'ri tartibda ulangan. HTML\'dagi <script src> ro\'yxatini tekshiring.' },
    { re: /unexpected token|syntax error/i,
      cause: 'JS sintaksis xatosi — fayl to\'liq yuklanmagan yoki buzilgan.',
      hint: 'Faylni qayta saqlang va brauzer keshini tozalang (Ctrl+F5). PowerShell bilan tahrirlangan bo\'lsa, kodlash buzilgan bo\'lishi mumkin.' },
    { re: /content security policy|refused to (execute|load|connect)/i,
      cause: 'CSP (xavfsizlik siyosati) resursni bloklandi.',
      hint: 'Inline <script> yoki tashqi manba ishlatilgan. Kodni alohida .js faylga chiqaring — loyihada script-src \'self\'.' },
    { re: /failed to fetch|networkerror|load failed/i,
      cause: 'Serverga ulanib bo\'lmadi.',
      hint: 'Sayt serveri ishlayaptimi? tools\\ISHGA_TUSHIRISH.bat ni bosing. Manzil to\'g\'rimi?' },
    { re: /quota|storage/i,
      cause: 'Brauzer xotirasi (localStorage) to\'lgan.',
      hint: 'Brauzer sozlamalaridan shu sayt ma\'lumotlarini tozalang.' },
    { re: /json|unexpected end of/i,
      cause: 'Serverdan noto\'g\'ri (JSON emas) javob keldi.',
      hint: 'api.php PHP xatosi qaytargan bo\'lishi mumkin — quyidagi "server" turidagi yozuvlarni ko\'ring.' },
    // Brauzer boshqa origin'dan kelgan skript xatosining tafsilotini bermaydi —
    // faqat "Script error." deydi. Bu ko'pincha tashqi skript (Google Translate,
    // YouTube) yoki brauzer kengaytmasidan keladi.
    { re: /^script error\.?$/i,
      cause: 'Tashqi (boshqa domendagi) skriptda xato — brauzer xavfsizlik sababli tafsilotni bermaydi.',
      hint: 'Odatda Google Translate, YouTube yoki brauzer kengaytmasidan keladi va saytga ta\'sir qilmaydi. Takrorlansa, kengaytmalarni o\'chirib tekshiring.' }
  ];
  function explain(msg) {
    var s = String(msg || '');
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i].re.test(s)) return { cause: RULES[i].cause, hint: RULES[i].hint };
    }
    return { cause: '', hint: '' };
  }
  // Tarmoq/resurs xatolari uchun status va URL bo'yicha alohida izoh
  function explainNet(status, url) {
    var u = String(url || '');
    if (status === 404) {
      if (/^uploads\//.test(u) || /\/uploads\//.test(u)) {
        return { cause: 'Yuklangan fayl serverda topilmadi (404).',
                 hint: 'Fayl uploads/ papkasida yo\'q. Havola bazada, fayl esa diskda - ikkisini tools/rasm-tekshir.php solishtiradi.' };
      }
      if (/\.js(\?|$)/.test(u) || /\.css(\?|$)/.test(u)) {
        return { cause: 'Skript/uslub fayli topilmadi (404).',
                 hint: 'Fayl nomi yoki ?v= versiyasi noto\'g\'ri bo\'lishi mumkin. HTML\'dagi yo\'lni tekshiring.' };
      }
      return { cause: 'Manzil topilmadi (404).', hint: 'URL to\'g\'riligini tekshiring.' };
    }
    if (status === 401) return { cause: 'Sessiya tugagan yoki tizimga kirilmagan (401).', hint: 'Admin panelga qayta kiring.' };
    if (status === 403) return { cause: 'Ruxsat yo\'q (403) — CSRF tokeni yaroqsiz yoki fayl himoyalangan.', hint: 'Sahifani yangilang (F5); token yangilanadi.' };
    if (status === 413) return { cause: 'Fayl hajmi chegaradan katta (413).', hint: 'Rasm uchun 12 MB, hujjat uchun 30 MB chegarasi bor.' };
    if (status >= 500) return { cause: 'Server ichki xatosi (' + status + ').', hint: 'PHP xatosi — quyidagi "server" yozuvlarini yoki Apache error.log\'ni ko\'ring.' };
    if (status === 0) return { cause: 'So\'rov yuborilmadi (tarmoq uzilgan yoki bloklangan).', hint: 'Apache ishlayaptimi? Brauzer kengaytmasi bloklamayaptimi?' };
    return { cause: 'Tarmoq so\'rovi muvaffaqiyatsiz (' + status + ').', hint: '' };
  }

  /* ---------------- Yig'ish ---------------- */
  function fpOf(e) {
    // Barmoq izi: bir xil xato takror yozilmasin
    return (e.kind + '|' + e.msg + '|' + (e.src || '') + '|' + (e.line || '')).slice(0, 200);
  }
  function push(kind, msg, extra) {
    extra = extra || {};
    var ex = extra.cause ? { cause: extra.cause, hint: extra.hint || '' } : explain(msg);
    var ev = {
      kind: kind,
      msg: String(msg == null ? '' : msg).slice(0, 500),
      src: extra.src || '', line: extra.line || 0, col: extra.col || 0,
      stack: extra.stack || '', cause: ex.cause, hint: ex.hint,
      at: new Date()
    };
    events.push(ev);
    if (events.length > MAX) events.shift();
    if (kind === 'error' || kind === 'server') counts.error++;
    else if (kind === 'warn') counts.warn++;
    else if (kind === 'net') counts.net++;
    else counts.log++;
    render();
    if (kind === 'error' || kind === 'net' || kind === 'server') report(ev);
    return ev;
  }

  /* ---------------- Serverga yuborish ---------------- */
  function report(ev) {
    var fp = fpOf(ev);
    if (sentFp[fp]) return;      // shu sessiyada allaqachon yuborilgan
    sentFp[fp] = 1;
    try {
      var body = JSON.stringify({
        kind: ev.kind, message: ev.msg, source: ev.src, line: ev.line, col: ev.col,
        stack: String(ev.stack || '').slice(0, 2000), page: location.pathname + location.search,
        cause: ev.cause
      });
      // keepalive: sahifa yopilayotganda ham yetib boradi
      w.fetch(API + '?action=client_error', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: body, keepalive: true
      })['catch'](function () {});
    } catch {}
  }

  /* Diagnostikaning O'Z so'rovlari kuzatilmaydi. Aks holda halqa hosil bo'ladi:
     `error_log` admin bo'lmaganda 401 qaytaradi -> uni "tarmoq xatosi" deb yozamiz
     -> serverga yuboramiz -> jurnal o'sha 401 bilan to'ladi. */
  function isOwnRequest(url) {
    var u = String(url || '');
    return u.indexOf('client_error') !== -1 || u.indexOf('error_log') !== -1 ||
           u.indexOf('error_resolve') !== -1 || u.indexOf('action=session') !== -1;
  }

  /* ---------------- Ilgaklar (hooks) ---------------- */
  function hookErrors() {
    w.addEventListener('error', function (e) {
      // Resurs (img/script/link) yuklanmagan bo'lsa — target element bo'ladi
      var t = e.target;
      if (t && t !== w && (t.tagName === 'IMG' || t.tagName === 'SCRIPT' || t.tagName === 'LINK')) {
        var url = t.src || t.href || '';
        var ex = explainNet(404, url);
        push('net', t.tagName.toLowerCase() + ' yuklanmadi: ' + url, { src: url, cause: ex.cause, hint: ex.hint });
        return;
      }
      push('error', e.message || 'Noma\'lum xato',
        { src: e.filename || '', line: e.lineno || 0, col: e.colno || 0, stack: e.error && e.error.stack });
    }, true); // capture: resurs xatolari ko'pikka chiqmaydi

    w.addEventListener('unhandledrejection', function (e) {
      var r = e.reason;
      var m = (r && (r.message || r)) || 'Promise rad etildi';
      push('error', 'Ushlanmagan promise: ' + m, { stack: r && r.stack });
    });
  }

  function hookNetwork() {
    // fetch
    if (w.fetch) {
      var of = w.fetch;
      w.fetch = function (input, init) {
        var url = (typeof input === 'string') ? input : (input && input.url) || '';
        return of.apply(this, arguments).then(function (res) {
          // diagnostikaning o'z so'rovini kuzatmaymiz (cheksiz halqa bo'lmasin)
          if (!res.ok && !isOwnRequest(url)) {
            var ex = explainNet(res.status, url);
            push('net', res.status + ' ' + (res.statusText || '') + ' — ' + url,
              { src: url, cause: ex.cause, hint: ex.hint });
          }
          return res;
        })['catch'](function (err) {
          if (!isOwnRequest(url)) {
            var ex = explainNet(0, url);
            push('net', 'So\'rov muvaffaqiyatsiz — ' + url + ' (' + (err && err.message) + ')',
              { src: url, cause: ex.cause, hint: ex.hint });
          }
          throw err;
        });
      };
    }
    // XMLHttpRequest (admin-store.js saqlashda ishlatadi)
    var XP = w.XMLHttpRequest && w.XMLHttpRequest.prototype;
    if (XP && XP.open && XP.send) {
      var oo = XP.open, os = XP.send;
      XP.open = function (m, u) { this.__diagUrl = u; return oo.apply(this, arguments); };
      XP.send = function () {
        var self = this;
        self.addEventListener('loadend', function () {
          var u = self.__diagUrl || '';
          if (isOwnRequest(u)) return;
          if (self.status === 0 || self.status >= 400) {
            var ex = explainNet(self.status, u);
            push('net', (self.status || 'ULANMADI') + ' — ' + u, { src: u, cause: ex.cause, hint: ex.hint });
          }
        });
        return os.apply(this, arguments);
      };
    }
  }

  function hookConsole() {
    ['log', 'warn', 'error', 'info'].forEach(function (lvl) {
      var orig = console[lvl];
      if (typeof orig !== 'function') return;
      console[lvl] = function () {
        try {
          var parts = [];
          for (var i = 0; i < arguments.length; i++) {
            var a = arguments[i];
            parts.push(typeof a === 'object' ? safeJson(a) : String(a));
          }
          var text = parts.join(' ');
          // console.error/warn diagnostikada ham xato/ogohlantirish sifatida ko'rinadi
          if (lvl === 'error') push('error', text);
          else if (lvl === 'warn') push('warn', text);
          else push('log', text);
        } catch {}
        return orig.apply(console, arguments);
      };
    });
  }
  function safeJson(o) { try { return JSON.stringify(o); } catch { return String(o); } }

  /* ---------------- Server (PHP) xatolarini olish ---------------- */
  // api.php javobida `__phpError` bo'lsa, uni ham ko'rsatamiz.
  // Server xatolarini FAQAT admin o'qiy oladi. Shuning uchun avval sessiyani
  // tekshiramiz — aks holda har bir sahifada 401 so'rov ketadi va brauzer
  // konsolida keraksiz qizil satr paydo bo'ladi (jurnalga tushmasa ham).
  function pollServer() {
    w.fetch(API + '?action=session', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (s) {
        if (!s || !s.authed) return;
        return w.fetch(API + '?action=error_log&limit=20&kind=php-fatal', { headers: { Accept: 'application/json' } })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (j) {
            if (!j || !j.ok || !j.rows) return;
            j.rows.forEach(function (r) {
              push('server', r.message, { src: r.source, line: r.line, cause: r.cause || 'PHP server xatosi.',
                hint: 'api.php yoki db.php ichidagi xato. Qator raqamiga qarang.' });
            });
          });
      })['catch'](function () {});
  }

  /* Uslublar tashqi diag.css da. Qat'iy CSP (style-src 'self') skript orqali
     joylashtirilgan <style> elementini bloklaydi — ilgari shu sababli panel va
     tugma umuman uslubsiz chiqardi. a11y.css bilan bir xil yechim: <link>. */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function hhmmss(d) { return two(d.getHours()) + ':' + two(d.getMinutes()) + ':' + two(d.getSeconds()); }

  function buildPanel() {
    var st = document.createElement('link'); st.rel = 'stylesheet'; st.href = 'css/diag.css?v=1'; document.head.appendChild(st);

    var fab = document.createElement('button');
    fab.id = 'diagFab'; fab.type = 'button';
    fab.innerHTML = '<span>⚙ DIAGNOSTIKA</span><span class="diag-b e" id="diagFabN">0</span>';
    fab.onclick = function () { fab.style.display = 'none'; panel.style.display = 'flex'; render(); };
    document.body.appendChild(fab);

    panel = document.createElement('div');
    panel.id = 'diagPanel'; panel.style.display = 'none';
    panel.innerHTML =
      '<div id="diagHead">' +
        '<span class="ttl">Diagnostika</span>' +
        '<span class="diag-b e" id="diagNE">0</span>' +
        '<span class="diag-b w" id="diagNW">0</span>' +
        '<span class="diag-b n" id="diagNN">0</span>' +
        '<span class="sp"></span>' +
        '<button type="button" id="diagCopy" title="Hammasini nusxalash">⧉</button>' +
        '<button type="button" id="diagClear" title="Tozalash">🗑</button>' +
        '<button type="button" id="diagClose" title="Yopish">✕</button>' +
      '</div>' +
      '<div id="diagTabs">' +
        '<button type="button" data-f="all" class="on">Hammasi</button>' +
        '<button type="button" data-f="error">Xatolar</button>' +
        '<button type="button" data-f="net">Tarmoq</button>' +
        '<button type="button" data-f="warn">Ogohlantirish</button>' +
        '<button type="button" data-f="log">Log</button>' +
      '</div>' +
      '<div id="diagList"></div>';
    document.body.appendChild(panel);

    listEl = panel.querySelector('#diagList');
    badgeEl = { e: panel.querySelector('#diagNE'), w: panel.querySelector('#diagNW'), n: panel.querySelector('#diagNN'), fab: fab.querySelector('#diagFabN'), fab_: fab };

    panel.querySelector('#diagClose').onclick = function (e) {
      e.stopPropagation(); panel.style.display = 'none'; fab.style.display = 'flex';
    };
    panel.querySelector('#diagClear').onclick = function (e) {
      e.stopPropagation(); events = []; counts = { error: 0, warn: 0, net: 0, log: 0 }; render();
    };
    panel.querySelector('#diagCopy').onclick = function (e) {
      e.stopPropagation();
      var txt = events.map(function (v) {
        return '[' + hhmmss(v.at) + '] ' + v.kind.toUpperCase() + ': ' + v.msg +
          (v.src ? '\n    ' + v.src + ':' + v.line + ':' + v.col : '') +
          (v.cause ? '\n    SABAB: ' + v.cause : '') +
          (v.hint ? '\n    YECHIM: ' + v.hint : '');
      }).join('\n\n');
      try { navigator.clipboard.writeText(txt); this.textContent = '✓'; var b = this; setTimeout(function () { b.textContent = '⧉'; }, 1200); } catch {}
    };
    panel.querySelectorAll('#diagTabs button').forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        filter = b.getAttribute('data-f');
        panel.querySelectorAll('#diagTabs button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        render();
      };
    });
  }

  function render() {
    if (!listEl) return;
    badgeEl.e.textContent = counts.error;
    badgeEl.w.textContent = counts.warn;
    badgeEl.n.textContent = counts.net;
    badgeEl.fab.textContent = counts.error + counts.net;
    badgeEl.fab.className = 'diag-b ' + ((counts.error + counts.net) ? 'e' : 'n');

    var rows = events.filter(function (v) {
      if (filter === 'all') return true;
      if (filter === 'error') return v.kind === 'error' || v.kind === 'server';
      return v.kind === filter;
    }).slice().reverse();

    if (!rows.length) {
      listEl.innerHTML = '<div id="diagEmpty">Hozircha yozuv yo\'q — sahifa toza ishlayapti.</div>';
      return;
    }
    listEl.innerHTML = rows.map(function (v) {
      var loc = v.src ? esc(v.src.replace(/^.*\//, '')) + (v.line ? ':' + v.line + (v.col ? ':' + v.col : '') : '') : '';
      return '<div class="diag-i ' + esc(v.kind) + '">' +
        '<div class="m">' + esc(v.msg) + '</div>' +
        '<div class="loc">' + (loc ? loc + ' · ' : '') + hhmmss(v.at) + '</div>' +
        (v.cause ? '<div class="why"><b>SABAB:</b> ' + esc(v.cause) +
          (v.hint ? '<span class="fix"><b>YECHIM:</b> ' + esc(v.hint) + '</span>' : '') + '</div>' : '') +
        (v.stack ? '<details><summary>stack</summary><pre>' + esc(v.stack) + '</pre></details>' : '') +
      '</div>';
    }).join('');
  }

  /* ---------------- Ko'rinish qoidasi ----------------
     Panel FAQAT: (a) `?debug=1` bo'lsa, (b) admin sessiyasi bo'lsa, yoki
     (c) admin.html sahifasida. Oddiy tashrifchi hech narsa ko'rmaydi —
     lekin xatolar baribir jimgina serverga yoziladi. */
  function debugFlag() {
    try {
      if (/[?&]debug=1/.test(location.search)) { sessionStorage.setItem('tstm_debug', '1'); return true; }
      if (/[?&]debug=0/.test(location.search)) { sessionStorage.removeItem('tstm_debug'); return false; }
      return sessionStorage.getItem('tstm_debug') === '1';
    } catch { return false; }
  }
  function isAdminPage() { return /admin\.html$/i.test(location.pathname); }

  function maybeShowPanel() {
    if (booted) return;
    booted = true;
    buildPanel();
    render();
    if (debugFlag()) { panel.style.display = 'flex'; badgeEl.fab_.style.display = 'none'; }
    pollServer();
  }

  /* ---------------- Ishga tushirish ---------------- */
  // Ilgaklar DARHOL o'rnatiladi (DOM kutilmaydi) — erta xatolar ham ushlansin.
  hookErrors();
  hookNetwork();
  hookConsole();

  function boot() {
    if (debugFlag() || isAdminPage()) { maybeShowPanel(); return; }
    // Admin sessiyasi bo'lsa ham ko'rsatamiz
    w.fetch(API + '?action=session', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && j.authed) maybeShowPanel(); })['catch'](function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ---------------- Tashqi API ---------------- */
  w.Diag = {
    show: function () { maybeShowPanel(); if (panel) { panel.style.display = 'flex'; if (badgeEl) badgeEl.fab_.style.display = 'none'; } },
    hide: function () { if (panel) panel.style.display = 'none'; },
    events: function () { return events.slice(); },
    counts: function () { return { error: counts.error, warn: counts.warn, net: counts.net, log: counts.log }; },
    // Qo'lda yozib qo'yish: Diag.note('nimadir bo\'ldi')
    note: function (m) { return push('log', m); }
  };
})(window);
