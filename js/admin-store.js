/* ============================================================
   TSTM Admin — ma'lumotlar ombori
   Server rejimi: api.php orqali MySQL bazasi bilan ishlaydi (saytni
   tools/ISHGA_TUSHIRISH.bat ochadi - PHP loyihaning o'zida keladi).
   PHP bo'lmasa (fayl file:// bilan ochilganda): localStorage'ga qaytadi.
   ============================================================ */
(function (w) {
  const DB_KEY = 'tstm_admin_db_v1';
  const SESS_KEY = 'tstm_admin_sess_v1';
  const API = 'api.php';
  let API_OK = false; // server PHP backend mavjudmi

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const ml = (uz, ru, en) => ({ uz: uz || '', ru: ru || '', en: en || '' });
  const p = (s) => '<p>' + s + '</p>';

  // ---------- Seed data (saytdagi kontentdan) ----------
  function seed() {
    return {
      settings: {
        // RU/EN qo'lda tasdiqlangan (2026-08-12) — avtomatik tarjimaga ISHONILMAYDI:
        // header/footerdagi brend nomi shu matndan ikki muvozanatli qatorga
        // bo'linadi (page-home.js/site-common.js brandLines()), shuning uchun
        // so'zma-so'z aniq bo'lishi shart. (seed.php'da ham xuddi shu qiymat bor.)
        siteName: ml(
          'Tashqi siyosiy tadqiqotlar va xalqaro tashabbuslar markazi',
          'Центр Внешнеполитических Исследований',
          'Center for Foreign Policy Studies'
        ),
        shortName: 'TSTM',
        address: ml("Mahmudjon G'ofurov ko'chasi, Toshkent", 'ул. Махмуджона Гофурова, Ташкент', 'Mahmudjon Gofurov St., Tashkent'),
        email: 'info@cfps.uz',
        phone: '+998 71 239 36 55',
        mapQuery: '41.310961,69.246750', // xarita joyi: koordinata "lat,lng" yoki manzil (Google Maps)
        social: { telegram: 'https://t.me/', youtube: '#', facebook: '#', x: '#' },
        langs: { uz: true, ru: true, en: true },
        theme: 'light',
        logo: '', // (eski) UZ uchun, orqaga moslik
        logos: { uz: '', ru: '', en: '' }, // til bo'yicha logotip (dataURL yoki uploads/ yo'li)
        banners: {}, // har bo'lim uchun banner foni
        stats: [
          { n: '300+', c: { uz: 'Tadqiqot va hisobot', ru: 'Исследований и отчётов', en: 'Studies & reports' } },
          { n: '45', c: { uz: 'Ekspert va tahlilchi', ru: 'Экспертов и аналитиков', en: 'Experts & analysts' } },
          { n: '60', c: { uz: 'Xalqaro hamkor', ru: 'Международных партнёров', en: 'International partners' } },
          { n: '32', c: { uz: 'Yillik tajriba', ru: 'Года опыта', en: 'Years of experience' } }
        ]
      },
      // Xavfsizlik: haqiqiy parol faqat serverda (api.php + MySQL `auth` jadvali, xesh holida) saqlanadi.
      // Bu ochiq fayl (admin-store.js) hech qanday parolni oshkor qilmasin.
      auth: { username: 'markaz_admini', password: '' },
      users: [
        { id: uid(), name: 'Bosh administrator', login: 'markaz_admini', email: 'admin@markaz.uz', role: 'Administrator', status: 'active', last: '2026-06-13' },
        { id: uid(), name: 'Dilnoza Karimova', login: 'd.karimova', email: 'd.karimova@markaz.uz', role: 'Muharrir', status: 'active', last: '2026-06-12' },
        { id: uid(), name: 'Akmal Tursunov', login: 'a.tursunov', email: 'a.tursunov@markaz.uz', role: 'Moderator', status: 'inactive', last: '2026-05-30' }
      ],
      events: [
        { id: uid(), title: ml('Markaziy Osiyo xavfsizligi bo\'yicha xalqaro konferensiya', '', ''), date: '2026-06-24', time: '10:00', location: ml('Toshkent', '', ''), type: 'Konferensiya', status: 'published', body: ml(p('Xalqaro konferensiya.'), '', '') },
        { id: uid(), title: ml('Ekspert muhokamasi: yangi geosiyosiy haqiqatlar', '', ''), date: '2026-07-02', time: '15:00', location: ml('Markaz binosi', '', ''), type: 'Davra suhbati', status: 'published', body: ml('', '', '') },
        { id: uid(), title: ml('Yosh tadqiqotchilar uchun yozgi ekspert maktabi', '', ''), date: '2026-07-15', time: '09:30', location: ml('Onlayn + Toshkent', '', ''), type: 'Ta\'lim dasturi', status: 'published', body: ml('', '', '') }
      ],
      experts: [
        { id: uid(), name: ml('Bobur Rahimov', '', ''), role: ml('Direktor', '', ''), sub: ml('Siyosiy fanlar doktori', '', ''), photo: '', bio: ml('', '', ''), order: 1 },
        { id: uid(), name: ml('Nodira Yusupova', '', ''), role: ml('Direktor o\'rinbosari', '', ''), sub: ml('Xalqaro munosabatlar bo\'yicha', '', ''), photo: '', bio: ml('', '', ''), order: 2 },
        { id: uid(), name: ml('Sardor Aliyev', '', ''), role: ml('Yetakchi ekspert', '', ''), sub: ml('Mintaqaviy xavfsizlik', '', ''), photo: '', bio: ml('', '', ''), order: 3 },
        { id: uid(), name: ml('Kamola Ergasheva', '', ''), role: ml('Bosh ilmiy xodim', '', ''), sub: ml('Iqtisodiy diplomatiya', '', ''), photo: '', bio: ml('', '', ''), order: 4 }
      ],
      publications: [
        { id: uid(), title: ml('Markaziy Osiyoda yangi diplomatik arxitektura', '', ''), type: 'Tahlil', category: 'Tashqi siyosat', region: 'Markaziy Osiyo', author: 'Bobur Rahimov', year: '2026', status: 'published', cover: '', pdf: 'markaziy-osiyo-arxitektura.pdf', desc: ml('', '', '') },
        { id: uid(), title: ml('Mintaqaviy transport yo\'laklari va savdo istiqbollari', '', ''), type: 'Tahliliy sharh', category: 'Iqtisodiyot', region: 'Markaziy Osiyo', author: 'Kamola Ergasheva', year: '2026', status: 'published', cover: '', pdf: 'transport-yolaklari.pdf', desc: ml('', '', '') },
        { id: uid(), title: ml('Mintaqaviy xavfsizlik: tahdidlar va imkoniyatlar', '', ''), type: 'Monografiya', category: 'Xavfsizlik', region: 'Markaziy Osiyo', author: 'Sardor Aliyev', year: '2025', status: 'published', cover: '', pdf: 'mintaqaviy-xavfsizlik.pdf', desc: ml('', '', '') }
      ],
      heroSlides: [
        { id: uid(), category: ml('Tahlil', '', ''), headline: ml('Markaziy Osiyo xavfsizligi va yangi diplomatik istiqbollar', '', ''), link: '#', image: '', status: 'published', order: 1 },
        { id: uid(), category: ml('Xalqaro tadbir', '', ''), headline: ml('Termiz dialogi mintaqaviy hamkorlik sari yo\'l ochmoqda', '', ''), link: '#', image: '', status: 'published', order: 2 },
        { id: uid(), category: ml('Nashr', '', ''), headline: ml('Tashqi siyosat sharhi: yilning yetakchi tendensiyalari', '', ''), link: '#', image: '', status: 'published', order: 3 }
      ],
      partners: [
        { id: uid(), name: 'BMT Mintaqaviy markazi', url: '#', logo: '' },
        { id: uid(), name: 'Konrad Adenauer fondi', url: '#', logo: '' },
        { id: uid(), name: 'OSCE', url: '#', logo: '' },
        { id: uid(), name: 'CICA', url: '#', logo: '' },
        { id: uid(), name: 'TIKA', url: '#', logo: '' },
        { id: uid(), name: 'CABAR', url: '#', logo: '' }
      ],
      pages: [
        { id: uid(), title: ml('Markaz haqida', 'О центре', 'About'), slug: 'markaz-haqida', body: ml(p('Markaz mustaqil tahliliy muassasa bo\'lib, tashqi siyosat, mintaqaviy xavfsizlik va xalqaro hamkorlik masalalarini o\'rganadi.'), '', ''), status: 'published' },
        { id: uid(), title: ml('Maqsad va vazifalar', 'Цели и задачи', 'Mission'), slug: 'maqsad', body: ml(p('Dalillarga asoslangan tahlil va ekspert tavsiyalari tayyorlash.'), '', ''), status: 'published' },
        { id: uid(), title: ml('Rahbariyat', 'Руководство', 'Leadership'), slug: 'rahbariyat', body: ml('', '', ''), status: 'published' },
        { id: uid(), title: ml('Tuzilma', 'Структура', 'Structure'), slug: 'tuzilma', body: ml('', '', ''), status: 'draft' },
        { id: uid(), title: ml('Tarix', 'История', 'History'), slug: 'tarix', body: ml('', '', ''), status: 'published' }
      ],
      media: [
        { id: uid(), type: 'video', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', title: ml('Markaz faoliyati haqida qisqacha', 'Кратко о деятельности центра', 'About the center'), date: '2026-06-10' }
      ],
      messages: [],
      subscribers: []
    };
  }

  // ---------- Core (PHP API + localStorage fallback) ----------
  let _db = null;

  // sync GET (faqat dastlabki yuklash uchun) — server rejimida api.php ishlaydi
  function apiLoadSync() {
    try {
      const x = new XMLHttpRequest();
      x.open('GET', API + '?action=load', false); // sync
      x.send(null);
      if (x.status >= 200 && x.status < 300) {
        const txt = (x.responseText || '').trim();
        if (!txt || txt === 'null') return { ok: true, data: null }; // server bor, lekin data yo'q
        return { ok: true, data: JSON.parse(txt) };
      }
    } catch {}
    return { ok: false, data: null };
  }
  let saveInFlight = false, saveQueueLatest = null;
  function apiSave(db) {
    // Poyga holatini oldini olish: saqlashlarni QAT'IY ketma-ket, navbat bilan yuboramiz.
    // Agar bir nechta saqlash tez-tez chaqirilsa (masalan rasm yuklash + forma saqlash),
    // faqat ENG SO'NGGI holat navbatga qo'yiladi va oldingi so'rov tugagach yuboriladi —
    // shu bilan "eski javob keyin kelib, yangi ma'lumotni ustidan bosib yozib qo'yishi" oldi olinadi.
    saveQueueLatest = db;
    if (saveInFlight) return; // hozir jo'natilayotgan so'rov tugagach, navbatdagi eng so'nggisi yuboriladi
    sendNext();
    function sendNext() {
      if (saveQueueLatest === null) return;
      const payload = saveQueueLatest; saveQueueLatest = null;
      saveInFlight = true;
      try {
        const x = new XMLHttpRequest();
        x.open('POST', API + '?action=save', true); // async
        x.setRequestHeader('Content-Type', 'application/json');
        const t = getCsrf(); if (t) x.setRequestHeader('X-CSRF-Token', t);
        x.onreadystatechange = () => {
          if (x.readyState === 4) {
            if (!(x.status >= 200 && x.status < 300)) {
              try { window.dispatchEvent(new CustomEvent('tstm-save-failed', { detail: { status: x.status } })); } catch {}
            }
            saveInFlight = false;
            sendNext(); // navbatda yana narsa bo'lsa (eng so'nggi holat), endi yuboramiz
          }
        };
        x.send(JSON.stringify(payload));
      } catch { saveInFlight = false; }
    }
  }

  // ---------- CSRF token (yozuv amallari uchun) ----------
  let CSRF = null;
  function getCsrf() {
    if (CSRF) return CSRF;
    try {
      const x = new XMLHttpRequest();
      x.open('GET', API + '?action=csrf', false); // sync — faqat admin yozuvidan oldin, kamdan-kam
      x.send(null);
      if (x.status >= 200 && x.status < 300) CSRF = (JSON.parse(x.responseText || '{}').token) || null;
    } catch {}
    return CSRF;
  }

  // ---------- Granular yozuv navbati (tartibni saqlaydi, poyga holatidan himoya) ----------
  let wq = [], wBusy = false;
  function apiWrite(action, payload) {
    if (!API_OK) return;
    wq.push({ action, payload });
    pumpWrite();
  }
  function pumpWrite() {
    if (wBusy || !wq.length) return;
    wBusy = true;
    const job = wq.shift();
    try {
      const x = new XMLHttpRequest();
      x.open('POST', API + '?action=' + job.action, true);
      x.setRequestHeader('Content-Type', 'application/json');
      const t = getCsrf(); if (t) x.setRequestHeader('X-CSRF-Token', t);
      x.onreadystatechange = () => {
        if (x.readyState === 4) {
          if (!(x.status >= 200 && x.status < 300)) {
            try { window.dispatchEvent(new CustomEvent('tstm-save-failed', { detail: { status: x.status, action: job.action } })); } catch {}
          }
          wBusy = false; pumpWrite();
        }
      };
      x.send(JSON.stringify(job.payload));
    } catch { wBusy = false; }
  }

  // db'da har bir kerakli bo'lim borligini ta'minlaydi (buzuq/eski data.json'ni tuzatadi)
  function ensureShape(db) {
    if (!db || typeof db !== 'object') return seed();
    const base = seed();
    let changed = false;
    Object.keys(base).forEach(k => {
      if (db[k] === undefined || db[k] === null) { db[k] = base[k]; changed = true; }
    });
    // settings ichidagi maydonlarni ham to'ldiramiz
    if (db.settings && typeof db.settings === 'object') {
      Object.keys(base.settings).forEach(k => {
        if (db.settings[k] === undefined) { db.settings[k] = base.settings[k]; changed = true; }
      });
    }
    db.__patched = changed;
    return db;
  }

  function load() {
    if (_db) return _db;
    const res = apiLoadSync();
    if (res.ok) {
      API_OK = true;
      if (res.data && typeof res.data === 'object' && Object.keys(res.data).length) {
        _db = ensureShape(res.data);
        if (_db.__patched) { delete _db.__patched; apiSave(_db); } // to'ldirilgan bo'lsa serverга qayta yozamiz
        else { delete _db.__patched; }
      } else {
        _db = seed(); apiSave(_db); // birinchi ishga tushirish yoki bo'sh data.json: seed yozamiz
      }
      return _db;
    }
    // fallback: localStorage
    try {
      const raw = localStorage.getItem(DB_KEY);
      _db = raw ? ensureShape(JSON.parse(raw)) : seed();
      if (_db.__patched) delete _db.__patched;
    } catch { _db = seed(); }
    return _db;
  }
  // localStorage zaxirasi (PHP yo'q rejimida asosiy saqlash)
  function backup() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(_db)); } catch {}
  }
  function reset() {
    if (API_OK) {
      // serverda reseed (parol saqlanadi), so'ng yangi holatni qayta yuklaymiz
      try {
        const x = new XMLHttpRequest();
        x.open('POST', API + '?action=reset', false);
        const t = getCsrf(); if (t) x.setRequestHeader('X-CSRF-Token', t);
        x.send(null);
      } catch {}
      _db = null; load();
    } else {
      _db = seed();
    }
    backup();
  }

  // ---------- Collections ----------
  function all(coll) { return (load()[coll] || []).slice(); }
  function find(coll, id) { return (load()[coll] || []).find(x => x.id === id) || null; }
  function upsert(coll, item) {
    const db = load();
    if (!db[coll]) db[coll] = [];
    if (item.id) {
      const i = db[coll].findIndex(x => x.id === item.id);
      if (i >= 0) db[coll][i] = item; else db[coll].unshift(item);
    } else {
      item.id = uid();
      db[coll].unshift(item);
    }
    // granular: faqat shu yozuvni serverga yuboramiz (poyga holatidan xavfsiz)
    apiWrite('upsert', { coll: coll, item: item });
    backup();
    return item;
  }
  function remove(coll, id) {
    const db = load();
    db[coll] = (db[coll] || []).filter(x => x.id !== id);
    apiWrite('remove', { coll: coll, id: id });
    backup();
  }

  // ---------- Settings ----------
  function settings() { return load().settings; }
  function setSettings(s) {
    const merged = Object.assign({}, load().settings, s);
    load().settings = merged;
    apiWrite('settings', { settings: merged });
    backup();
  }

  // ---------- Auth / session ----------
  // Muvaffaqiyatsiz kirishning SABABI. checkLogin() ATAYLAB boolean qaytaradi
  // (obyekt qaytsa `if (ok)` truthy bo'lib bloklangan holatda ham panelga kirib
  // ketardi), shuning uchun sabab alohida shu yerda turadi va UI uni
  // loginError() orqali o'qiydi.
  //   { code: 'locked', retryAfter } — juda ko'p xato urinish (429)
  //   { code: 'network' }            — serverga umuman yetib borilmadi
  //   { code: 'need_2fa' }           — parol to'g'ri, autentifikator kodi kerak
  //   null                           — oddiy xato login yoki parol
  let _loginErr = null;
  function loginError() { return _loginErr; }

  // Promise<boolean> qaytaradi (async fetch — brauzerni bloklamaydi)
  function checkLogin(u, pw) {
    load();
    _loginErr = null;
    // Server rejimi: parolni serverda tekshirib, PHP sessiyasini ochamiz
    if (API_OK) {
      return fetch(API + '?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ u: u.trim(), p: pw })
      })
        // 429 — juda ko'p xato urinish, IP vaqtincha bloklangan. Ilgari bu
        // shunchaki `!r.ok` bo'lib "login yoki parol noto'g'ri" deb ko'rsatilardi
        // va admin nega hech narsa o'tmayotganini bilolmasdi.
        .then(r => {
          if (r.status === 429) {
            return r.json().catch(() => ({})).then(j => {
              _loginErr = { code: 'locked', retryAfter: Math.max(0, parseInt(j.retry_after, 10) || 0) };
              return null;
            });
          }
          return r.ok ? r.json() : null;
        })
        .then(r => {
          if (r && r.csrf) CSRF = r.csrf;
          // Parol to'g'ri, lekin 2FA kod kutilmoqda — bu "xato" emas, UI
          // alohida qadam sifatida ko'rsatishi kerak.
          if (r && r.need_2fa) { _loginErr = { code: 'need_2fa' }; return false; }
          // Kirishdan OLDIN yuklangan ma'lumotda shaxsiy bo'limlar (murojaatlar,
          // obunachilar, foydalanuvchilar) bo'sh edi — server ularni faqat
          // sessiyasi bor adminga beradi. Kirgach keshni tashlab, to'liq
          // ma'lumotni qayta o'qiymiz.
          if (r && r.ok) { _db = null; load(); }
          return !!(r && r.ok);
        })
        // Serverga yetib borilmadi (Apache o'chiq, tarmoq uzildi) — bu ham
        // "parol noto'g'ri" emas. Sababini aytmasak, admin parolni bekorga
        // qayta-qayta terib, o'zini 429 blokiga tiqib qo'yadi.
        .catch(() => { _loginErr = { code: 'network' }; return false; });
    }
    // fallback: PHP ishlamayotganda. Bo'sh zaxira parol bilan kirishni taqiqlaymiz
    // (haqiqiy autentifikatsiya faqat server tomonda — api.php orqali bo'ladi).
    const a = load().auth;
    return Promise.resolve(!!pw && u.trim() === a.username && pw === a.password);
  }
  // 2FA kodi (yoki bir martalik zaxira kod) bilan kirishni yakunlaydi.
  // checkLogin() need_2fa qaytargandan keyin, o'sha sessiya ichida chaqiriladi.
  function verify2fa(code) {
    if (!API_OK) return Promise.resolve(false);
    _loginErr = null;
    return fetch(API + '?action=login_2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: String(code || '').trim() })
    })
      .then(r => {
        if (r.status === 429) {
          return r.json().catch(() => ({})).then(j => {
            _loginErr = { code: 'locked', retryAfter: Math.max(0, parseInt(j.retry_after, 10) || 0) };
            return null;
          });
        }
        return r.json().catch(() => null);
      })
      .then(r => {
        if (r && r.csrf) CSRF = r.csrf;
        if (r && r.error === 'expired') _loginErr = { code: 'expired' };
        if (r && r.ok) { _db = null; load(); }
        return !!(r && r.ok);
      })
      .catch(() => { _loginErr = { code: 'network' }; return false; });
  }
  // ---------- 2FA sozlash (Sozlamalar -> Xavfsizlik) ----------
  function twoFAStatus() {
    if (!API_OK) return Promise.resolve({ ok: false, enabled: false });
    return fetch(API + '?action=2fa_status', { headers: { 'Accept': 'application/json' } })
      .then(r => r.ok ? r.json() : null)
      .then(j => (j && j.ok) ? j : { ok: false, enabled: false })
      .catch(() => ({ ok: false, enabled: false }));
  }
  // Yangi maxfiy kalitni boshlaydi (hali yoqmaydi). { ok, secret, uri }
  function twoFASetup() {
    if (!API_OK) return Promise.resolve({ ok: false });
    return fetch(API + '?action=2fa_setup', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() || '' }, body: '{}'
    })
      .then(r => r.json().catch(() => ({})))
      .then(j => (j && j.ok) ? j : { ok: false })
      .catch(() => ({ ok: false, error: 'network' }));
  }
  // Sozlashni bitta amaldagi kod bilan tasdiqlaydi va yoqadi. { ok, recovery: [...] }
  function twoFAConfirm(code) {
    if (!API_OK) return Promise.resolve({ ok: false });
    return fetch(API + '?action=2fa_confirm', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() || '' },
      body: JSON.stringify({ code: String(code || '').trim() })
    })
      .then(r => r.json().catch(() => ({})))
      .then(j => (j && j.ok) ? j : { ok: false, error: (j && j.error) || 'failed' })
      .catch(() => ({ ok: false, error: 'network' }));
  }
  function twoFADisable(password) {
    if (!API_OK) return Promise.resolve({ ok: false });
    return fetch(API + '?action=2fa_disable', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() || '' },
      body: JSON.stringify({ password: password || '' })
    })
      .then(r => r.json().catch(() => ({})))
      .then(j => (j && j.ok) ? { ok: true } : { ok: false, error: (j && j.error) || 'failed' })
      .catch(() => ({ ok: false, error: 'network' }));
  }
  // Parolni almashtirish. Tekshiruv va xeshlash butunlay serverda
  // (api.php -> change_password): joriy parol tasdiqlanadi, yangisi bcrypt
  // bilan xeshlanib saqlanadi. Bu yerda parol hech qayerga yozilmaydi.
  function changePassword(current, next) {
    if (!API_OK) return Promise.resolve({ ok: false, error: 'no_server' });
    const t = getCsrf();
    return fetch(API + '?action=change_password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': t || '' },
      body: JSON.stringify({ current: current, new: next })
    })
      .then(r => r.json().catch(() => ({})))
      .then(j => (j && j.ok) ? { ok: true } : { ok: false, error: (j && j.error) || 'failed' })
      .catch(() => ({ ok: false, error: 'network' }));
  }
  // Audit jurnalini serverdan o'qish (faqat admin). O'qish amali — CSRF shart emas.
  // Qaytadi: { ok, rows:[{action,coll,item_id,ip,at}], actions:[...], total }.
  function auditLog(opts) {
    if (!API_OK) return Promise.resolve({ ok: false, error: 'no_server', rows: [] });
    opts = opts || {};
    var qs = '?action=audit_log';
    if (opts.limit) qs += '&limit=' + encodeURIComponent(opts.limit);
    if (opts.act) qs += '&act=' + encodeURIComponent(opts.act);
    return fetch(API + qs, { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return (j && j.ok) ? j : { ok: false, rows: [], actions: [], total: 0 }; })
      .catch(function () { return { ok: false, error: 'network', rows: [], actions: [], total: 0 }; });
  }
  // Push-bildirishnoma: obunachilar soni (faqat admin).
  function pushStats() {
    if (!API_OK) return Promise.resolve({ ok: false, count: 0, ready: false });
    return fetch(API + '?action=push_stats', { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return (j && j.ok) ? j : { ok: false, count: 0, ready: false }; })
      .catch(function () { return { ok: false, count: 0, ready: false }; });
  }
  // Barcha obunachilarga bildirishnoma yuborish (faqat admin, CSRF bilan).
  // Qaytadi: { ok, sent, gone, failed }.
  function pushSend() {
    if (!API_OK) return Promise.resolve({ ok: false, error: 'no_server' });
    var t = getCsrf();
    return fetch(API + '?action=push_send', {
      method: 'POST',
      headers: { 'X-CSRF-Token': t || '', 'Accept': 'application/json' }
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) { return (j && j.ok) ? j : { ok: false, error: (j && j.error) || 'failed' }; })
      .catch(function () { return { ok: false, error: 'network' }; });
  }
  // Bitta yozuvni serverdan TO'LIQ olish (og'ir maydonlar bilan).
  //
  // NEGA KERAK: ommaviy `load` javobida nashr matni (`desc`) joy tejash uchun
  // qisqartirilgan holda keladi — aks holda har bir sahifa 1.3 MB yuklardi.
  // Batafsil sahifa to'liq matnni shu funksiya orqali oladi.
  // Qaytadi: { ok, item } yoki { ok:false }.
  function item(coll, id) {
    if (!API_OK) return Promise.resolve({ ok: false, error: 'no_server' });
    var qs = '?action=item&coll=' + encodeURIComponent(coll) + '&id=' + encodeURIComponent(id);
    return fetch(API + qs, { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return (j && j.ok) ? j : { ok: false }; })
      .catch(function () { return { ok: false, error: 'network' }; });
  }
  // Diagnostika jurnalini o'qish (faqat admin). O'qish amali — CSRF shart emas.
  // Qaytadi: { ok, rows:[{id,kind,message,source,line,cause,hits,last_at,...}], kinds:[...], open, total }.
  function errorLog(opts) {
    if (!API_OK) return Promise.resolve({ ok: false, error: 'no_server', rows: [], kinds: [], open: 0, total: 0 });
    opts = opts || {};
    var qs = '?action=error_log';
    if (opts.limit) qs += '&limit=' + encodeURIComponent(opts.limit);
    if (opts.kind) qs += '&kind=' + encodeURIComponent(opts.kind);
    if (opts.resolved) qs += '&resolved=1';
    return fetch(API + qs, { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return (j && j.ok) ? j : { ok: false, rows: [], kinds: [], open: 0, total: 0 }; })
      .catch(function () { return { ok: false, error: 'network', rows: [], kinds: [], open: 0, total: 0 }; });
  }
  // Xatoni "hal qilindi" deb belgilash. `id` o'rniga 'all' berilsa — hammasi.
  function errorResolve(id) {
    if (!API_OK) return Promise.resolve({ ok: false, error: 'no_server' });
    var qs = (id === 'all') ? '?action=error_resolve&all=1' : '?action=error_resolve&id=' + encodeURIComponent(id);
    var t = getCsrf();
    return fetch(API + qs, { headers: { 'X-CSRF-Token': t || '', 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return (j && j.ok) ? { ok: true } : { ok: false, error: (j && j.error) || 'failed' }; })
      .catch(function () { return { ok: false, error: 'network' }; });
  }
  function login() { sessionStorage.setItem(SESS_KEY, '1'); }
  function logout() {
    sessionStorage.removeItem(SESS_KEY);
    CSRF = null;
    if (API_OK) { try { const x = new XMLHttpRequest(); x.open('GET', API + '?action=logout', true); x.send(null); } catch{} }
  }
  function isAuthed() { return sessionStorage.getItem(SESS_KEY) === '1'; }

  // Sessiyani SERVERDAN tasdiqlash.
  //
  // isAuthed() faqat sessionStorage'ni o'qiydi — uni brauzer konsolidan
  // qo'lda o'rnatib qo'yish mumkin. Server bunday "adminni" hech qachon
  // qabul qilmaydi (barcha yozuv amallari 401 qaytaradi, shaxsiy bo'limlar
  // bo'sh keladi), lekin admin interfeysining O'ZI ochilib qolardi —
  // ma'lumotsiz bo'lsa ham, bu auditda kamchilik sifatida yoziladi.
  //
  // Shuning uchun panel ochilishidan oldin server so'raladi: haqiqatan
  // sessiya bormi? Yo'q bo'lsa — mahalliy bayroq tozalanadi va login
  // ekrani ko'rsatiladi.
  function verifySession() {
    if (!API_OK) return Promise.resolve(isAuthed()); // PHP yo'q rejimi (mahalliy sinov)
    return fetch(API + '?action=session', { headers: { 'Accept': 'application/json' } })
      .then(r => r.ok ? r.json() : null)
      .then(function (s) {
        var ok = !!(s && s.authed);
        if (ok) { if (s.csrf) CSRF = s.csrf; sessionStorage.setItem(SESS_KEY, '1'); }
        else { sessionStorage.removeItem(SESS_KEY); CSRF = null; }
        return ok;
      })
      .catch(function () {
        // Tarmoq uzilgan — mavjud holatni saqlaymiz, serverdan ma'lumot
        // baribir kelmaydi, ya'ni bo'sh panel ochiladi.
        return isAuthed();
      });
  }

  // ---------- Rasm yuklash (server fayli) ----------
  // dataURL beriladi; PHP bor bo'lsa serverga fayl qilib yozadi va yo'l qaytaradi.
  // PHP yo'q bo'lsa dataURL'ning o'zini qaytaradi (localStorage rejimi).
  //
  // hint — fayl nomi MAZMUNLI bo'lishi uchun kontekst ("ekspert", "banner",
  //   "yangilik" va h.k.). Server uni tozalab fayl nomiga qo'shadi, ya'ni
  //   `uploads\` ichida qaysi rasm qayerga tegishli ekani ko'rinib turadi.
  //
  // MUHIM (2026-08-21 da tuzatilgan): ilgari yuklash MUVAFFAQIYATSIZ bo'lsa
  //   `cb(dataURL)` chaqirilardi — ya'ni butun rasm base64 holida BAZAGA
  //   yozilib ketardi. Natijada baza shishardi, rasm `uploads\` da bo'lmagani
  //   uchun zaxira va ko'chirishda yo'qolardi. Endi xatoda BO'SH qaytadi va
  //   chaqiruvchi foydalanuvchiga xabar beradi (uploadPdf shunday ishlagan).
  function uploadImage(dataURL, cb, hint) {
    if (!dataURL) { cb('', 'no data'); return; }
    // localStorage rejimi: server yo'q, dataURL'ning o'zi saqlanadi.
    if (!API_OK || dataURL.indexOf('data:') !== 0) { cb(dataURL); return; }
    try {
      const x = new XMLHttpRequest();
      x.open('POST', API + '?action=upload', true);
      x.setRequestHeader('Content-Type', 'application/json');
      const t = getCsrf(); if (t) x.setRequestHeader('X-CSRF-Token', t);
      x.onreadystatechange = () => {
        if (x.readyState === 4) {
          try {
            const r = JSON.parse(x.responseText || '{}');
            if (r && r.ok && r.path) cb(r.path, null);
            else cb('', (r && r.error) || 'upload_failed');
          } catch { cb('', 'upload_failed'); }
        }
      };
      x.send(JSON.stringify({ data: dataURL, hint: hint || '' }));
    } catch { cb('', 'upload_failed'); }
  }

  // ---------- Video muqovasi: YouTube'dan SERVER orqali olinadi ----------
  // Brauzer YouTube'ga o'zi murojaat qilmaydi — so'rovni server bajaradi va
  // rasmni `uploads/` ga saqlaydi. Shu sababli Media sahifasini ochgan
  // tashrifchi YouTube'ga ko'rinmaydi (batafsil: backend/thumbs.php).
  // Muqova topilmasa bu XATO EMAS — video baribir saqlanadi, shuning uchun
  // cb('') chaqiriladi va chaqiruvchi davom etaveradi.
  function videoThumb(vid, cb) {
    if (!API_OK || !vid) { cb(''); return; }
    try {
      const x = new XMLHttpRequest();
      x.open('POST', API + '?action=video_thumb', true);
      x.setRequestHeader('Content-Type', 'application/json');
      const t = getCsrf(); if (t) x.setRequestHeader('X-CSRF-Token', t);
      x.onreadystatechange = () => {
        if (x.readyState === 4) {
          try {
            const r = JSON.parse(x.responseText || '{}');
            cb(r && r.ok && r.path ? r.path : '');
          } catch { cb(''); }
        }
      };
      x.send(JSON.stringify({ id: vid }));
    } catch { cb(''); }
  }

  // ---------- Hujjat yuklash: PDF yoki Word (server fayli) ----------
  // dataURL (data:<mime>;base64,...) beriladi, serverga fayl qilib yozadi, yo'lini qaytaradi.
  // Haqiqiy tur serverda fayl imzosi (magic bytes) bilan aniqlanadi — mime'ga ishonilmaydi.
  // Rasmdan farqli o'laroq — muvaffaqiyatsizlikda dataURL'ga qaytarilmaydi (fayl bir necha MB bo'lishi
  // mumkin, bazaga base64 holida yozib yuborish shishirib yuboradi) — cb(path, error) chaqiriladi.
  function uploadPdf(dataURL, cb) {
    if (!dataURL) { cb('', 'no data'); return; }
    if (!API_OK) { cb('', 'server_unavailable'); return; }
    try {
      const x = new XMLHttpRequest();
      x.open('POST', API + '?action=upload_pdf', true);
      x.setRequestHeader('Content-Type', 'application/json');
      const t = getCsrf(); if (t) x.setRequestHeader('X-CSRF-Token', t);
      x.onreadystatechange = () => {
        if (x.readyState === 4) {
          try {
            const r = JSON.parse(x.responseText || '{}');
            if (r && r.ok && r.path) cb(r.path, null); else cb('', (r && r.error) || 'upload_failed');
          } catch { cb('', 'upload_failed'); }
        }
      };
      x.send(JSON.stringify({ data: dataURL }));
    } catch { cb('', 'upload_failed'); }
  }

  // ---------- Interaktiv infografika HTML faylini yuklash ----------
  // Xom HTML matnini serverga yuboradi, uploads/ ga .html fayl qilib yozadi, yo'lini qaytaradi.
  function uploadHtml(html, name, cb) {
    if (typeof name === 'function') { cb = name; name = ''; }
    if (!html) { cb(''); return; }
    if (!API_OK) { cb(''); return; }
    try {
      const x = new XMLHttpRequest();
      x.open('POST', API + '?action=upload_html', true);
      x.setRequestHeader('Content-Type', 'application/json');
      const t = getCsrf(); if (t) x.setRequestHeader('X-CSRF-Token', t);
      x.onreadystatechange = () => {
        if (x.readyState === 4) {
          try { const r = JSON.parse(x.responseText || '{}'); cb(r && r.ok && r.path ? r.path : ''); }
          catch { cb(''); }
        }
      };
      x.send(JSON.stringify({ html: html, name: name || '' }));
    } catch { cb(''); }
  }

  // ---------- Public: foydalanuvchi murojaati (faqat xabar qo'shadi) ----------
  // Promise<{ok:boolean, error?:string}> qaytaradi — chaqiruvchi haqiqiy natijaga qarab
  // muvaffaqiyat / xato / 'too_many' (spam cheklovi) xabarini ko'rsata oladi.
  function addMessage(msg) {
    load();
    msg = Object.assign({ date: new Date().toISOString().slice(0, 10), read: false }, msg);
    if (API_OK) {
      return fetch(API + '?action=message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.ok && j && j.ok) return { ok: true };
          if (r.status === 429) return { ok: false, error: 'too_many' };
          return { ok: false, error: (j && j.error) || 'failed' };
        });
      }).catch(function () { return { ok: false, error: 'network' }; });
    }
    // fallback: localStorage (PHP yo'q)
    upsert('messages', msg);
    return Promise.resolve({ ok: true });
  }

  // ---------- Public: yangiliklarga obuna ----------
  // Promise<{ok:boolean, error?:string}> — chaqiruvchi HAQIQIY natijaga qarab
  // xabar ko'rsatishi shart (avval natija tekshirilmay doim "obuna bo'ldingiz"
  // deb ko'rsatilardi — e-pochta hech qayerga yozilmasa ham).
  // error: 'bad_email' | 'too_many' | 'network' | 'db' | 'offline'
  function subscribe(email, lang) {
    load();
    if (!API_OK) return Promise.resolve({ ok: false, error: 'offline' });
    return fetch(API + '?action=subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, lang: lang || '' })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.ok && j && j.ok) return { ok: true };
        if (r.status === 429) return { ok: false, error: 'too_many' };
        return { ok: false, error: (j && j.error) || 'failed' };
      });
    }).catch(function () { return { ok: false, error: 'network' }; });
  }

  // ---------- Ko'rishlar soni (view counter) ----------
  function bumpView(coll, id, cb) {
    if (!id) { cb && cb(0); return; }
    if (API_OK) {
      try {
        const x = new XMLHttpRequest();
        x.open('POST', API + '?action=view', true);
        x.setRequestHeader('Content-Type', 'application/json');
        x.onreadystatechange = function(){ if (x.readyState===4){ try{ var r=JSON.parse(x.responseText||'{}'); cb && cb(r.count||0); }catch{ cb && cb(0); } } };
        x.send(JSON.stringify({ coll: coll, id: id }));
        return;
      } catch {}
    }
    // fallback: localStorage
    try {
      var k = 'tstm_views'; var v = JSON.parse(localStorage.getItem(k) || '{}');
      var key = coll + ':' + id; v[key] = (v[key] || 0) + 1;
      localStorage.setItem(k, JSON.stringify(v)); cb && cb(v[key]);
    } catch { cb && cb(0); }
  }
  function getView(coll, id, cb) {
    if (API_OK) {
      try {
        const x = new XMLHttpRequest();
        x.open('GET', API + '?action=views', true);
        x.onreadystatechange = function(){ if (x.readyState===4){ try{ var r=JSON.parse(x.responseText||'{}'); cb && cb((r[coll+':'+id])||0); }catch{ cb && cb(0); } } };
        x.send(null);
        return;
      } catch {}
    }
    try { var v = JSON.parse(localStorage.getItem('tstm_views') || '{}'); cb && cb(v[coll+':'+id] || 0); }
    catch { cb && cb(0); }
  }

  w.Store = {
    uid, ml, all, find, upsert, remove, settings, setSettings,
    checkLogin, loginError, verify2fa, twoFAStatus, twoFASetup, twoFAConfirm, twoFADisable, changePassword, login, logout, isAuthed, verifySession, auditLog, errorLog, errorResolve, item, pushStats, pushSend, addMessage, subscribe, uploadImage, uploadPdf, uploadHtml, videoThumb, bumpView, getView, reset, raw: load
  };
})(window);
