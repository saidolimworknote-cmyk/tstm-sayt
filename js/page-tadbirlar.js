/* Voqealar bo'limining barcha ro'yxat sahifalari uchun umumiy skript:
   tadbirlar.html (barchasi), uchrashuvlar.html, davra-suhbatlari.html,
   konferensiyalar.html, markaz-hayoti.html.

   ASOSIY QOIDA (2026-08-19): sahifalar bir xil shablon EMAS. Ilgari beshtasi
   ham aynan bir xil ro'yxatni chizardi va faqat sarlavhasi bilan farq qilardi.
   Endi har bir bo'lim o'z faoliyat turiga MOS formatda ko'rsatiladi:

     uchrashuvlar     -> `register` : rasmiy reyestr (sana | mavzu | manzil).
                         Diplomatik uchrashuvlar qayd etiladi, o'qilmaydi —
                         muhimi sana, tomonlar va joy bir qarashda ko'rinsin.
     davra-suhbatlari -> `topics`   : muhokama kartalari. Bu yerda MAVZU asosiy,
                         shuning uchun sarlavha yirik va tavsif ko'rinadi.
     konferensiyalar  -> `posts`    : yangiliklar uslubidagi post kartalari,
                         yangidan eskiga BITTA oqimda. Bu yerda "kelgusi /
                         o'tgan" AJRATILMAYDI (2026-08-20): markaz bo'lajak
                         yig'ilishlarni oldindan e'lon qilmaydi, shuning uchun
                         afisha mantiqi ortiqcha edi va sahifa ko'pincha bo'sh
                         "Kelgusi konferensiya yo'q" bloki bilan ochilardi.
     markaz-hayoti    -> `gallery`  : foto lenta. Ichki hayot — vizual janr;
                         muqova rasmi bo'lmasa karta matn ko'rinishida qoladi.
     tadbirlar.html   -> `mixed`    : butun bo'limning umumiy taqvimi.

   Format HTML'da e'lon qilinadi: <main data-ekind="meet"> (CSP inline
   skriptga ruxsat bermaydi, shuning uchun sozlama DOM orqali uzatiladi).
   Tur -> bo'lim mosligi site-common.js dagi `EVENT_KINDS` da — bitta joyda.

   Rasmiy veb-sayt talablari nuqtai nazaridan barcha formatlarda umumiy:
   har bir yozuvda ANIQ sana, o'z doimiy sahifasiga havola (`tadbir.html?id=`)
   va o'tgan voqealar uchun YIL bo'yicha arxiv. */
Site.initPage({
  active: 'events',
  render() {
    const T = Site.t, esc = Site.esc, ml = Site.mlGet;
    const mainEl = document.querySelector('main');
    const kindId = (mainEl ? (mainEl.getAttribute('data-ekind') || '') : '').trim();

    /* ---------- bo'lim ichi navigatsiyasi ---------- */
    const tabsEl = document.getElementById('evTabs');
    if (tabsEl) {
      const cur = decodeURIComponent((location.pathname.split('/').pop() || '').toLowerCase());
      const tabs = [{ href: 'tadbirlar.html', tk: 'all' }]
        .concat(Site.EVENT_KINDS.map(k => ({ href: k.page, tk: k.tk })));
      tabsEl.innerHTML = '<div class="tabs">' + tabs.map(t =>
        `<a href="${t.href}" class="tab-link${t.href.toLowerCase() === cur ? ' on' : ''}">${esc(T(t.tk))}</a>`
      ).join('') + '</div>';
    }

    /* ---------- ma'lumot ---------- */
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const today = now.toISOString().slice(0, 10);

    let all = Store.all('events').filter(e => e.status === 'published');
    if (kindId) all = all.filter(e => { const k = Site.eventKind(e.type); return !!k && k.id === kindId; });

    const up   = all.filter(e => (e.date || '') >= today).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const past = all.filter(e => (e.date || '') <  today).sort((a, b) => String(b.date).localeCompare(String(a.date)));

    /* ---------- umumiy bo'laklar ---------- */
    const ICON = {
      clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/></svg>',
      pin:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
      cal:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>',
      photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m3 17 5-4 4 3 3-3 6 5"/></svg>'
    };
    const strip = (h) => String(h || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const clip  = (s, n) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s);
    const href  = (e) => 'tadbir.html?id=' + encodeURIComponent(e.id);
    const year  = (e) => String(e.date || '').slice(0, 4);
    const dmy   = (e) => { const p = String(e.date || '').split('-'); return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : ''; };
    const badge = (e) => {
      if (!e.date) return '';
      const d = Math.round((new Date(e.date) - now) / 86400000);
      if (d === 0) return `<span class="ev-soon">${esc(T('ev_today'))}</span>`;
      if (d > 0 && d <= 7) return `<span class="ev-soon">${esc(T('ev_soon'))}</span>`;
      return '';
    };
    const empty = (tk) => `<div class="empty">${ICON.cal}<div class="t">${esc(T(tk))}</div></div>`;
    const head  = (tk, n) => `<div class="ev-head"><div class="kicker">${esc(T(tk))}</div>${n ? `<span class="ev-count">${n}</span>` : ''}</div>`;

    /* ---------- format 1: reyestr (uchrashuvlar) ----------
       Zich, rasmiy qator: sana | mavzu | manzil. Ustunlar tekislangan —
       ro'yxatni ko'z bilan sana bo'yicha kuzatish oson bo'lsin. */
    const regRow = (e) => `<a class="reg-row rv" href="${href(e)}">
      <span class="reg-date">${esc(dmy(e))}</span>
      <span class="reg-main"><span class="reg-title">${esc(ml(e.title))}</span>${badge(e)}</span>
      <span class="reg-loc">${ml(e.location) ? ICON.pin + esc(ml(e.location)) : ''}</span>
    </a>`;
    const register = (list) => `<div class="reg-list">${list.map(regRow).join('')}</div>`;

    /* ---------- format 2: muhokama kartalari (davra suhbatlari) ----------
       Mavzu birinchi o'rinda: yirik sarlavha + tavsifdan parcha. */
    const topicCard = (e) => {
      const d = clip(strip(ml(e.excerpt) || ml(e.body)), 190);
      return `<a class="topic-card rv" href="${href(e)}">
        <div class="tc-top"><span class="tc-date">${esc(dmy(e))}</span>${badge(e)}</div>
        <h3>${esc(ml(e.title))}</h3>
        ${d ? `<p>${esc(d)}</p>` : ''}
        <div class="tc-meta">${e.time ? `<span>${ICON.clock}${esc(e.time)}</span>` : ''}${ml(e.location) ? `<span>${ICON.pin}${esc(ml(e.location))}</span>` : ''}</div>
      </a>`;
    };
    const topics = (list) => `<div class="topic-grid">${list.map(topicCard).join('')}</div>`;

    const evCard = (e) => {
      const d = Site.dayMonth(e.date), yy = year(e), desc = clip(strip(ml(e.excerpt) || ml(e.body)), 150);
      return `<a class="ev-card rv" href="${href(e)}">
        <div class="ev-cal"><span class="dd">${esc(d.dd || '—')}</span><span class="mm">${esc(d.mm || '')}</span>${yy ? `<span class="yy">${esc(yy)}</span>` : ''}</div>
        <div class="ev-cbody">
          <div class="ev-top">${ml(e.type) ? `<span class="ev-type">${esc(ml(e.type))}</span>` : ''}${badge(e)}</div>
          <h3>${esc(ml(e.title))}</h3>
          ${desc ? `<p class="ev-desc">${esc(desc)}</p>` : ''}
          <div class="ev-meta">${e.time ? `<span>${ICON.clock}${esc(e.time)}</span>` : ''}${ml(e.location) ? `<span>${ICON.pin}${esc(ml(e.location))}</span>` : ''}</div>
        </div>
      </a>`;
    };
    /* ---------- format 6: post kartalari (konferensiyalar) ----------
       2026-08-20: konferensiyalar "kelgusi / o'tgan" deb AJRATILMAYDI —
       markaz bo'lajak yig'ilishlarni oldindan e'lon qilmaydi, shuning uchun
       afisha ("eng yaqini") mantiqi ortiqcha edi va sahifa ko'pincha bo'sh
       "Kelgusi konferensiya yo'q" bloki bilan ochilardi. Endi bitta oqim:
       yangidan eskiga, yangiliklar bilan bir xil karta (`.ncard`).
       Rasm to'plami bo'lsa muqova ustida "N" belgisi chiqadi. */
    const postCard = (e) => {
      const ph = Array.isArray(e.photos) ? e.photos : [];
      const cover = e.cover || (ph[0] && ph[0].url) || '';
      const loc = ml(e.location);
      return `<a class="ncard rv" href="${href(e)}">
        <div class="img ph">${cover
          ? `<img src="${Site.safeUrl(cover)}" alt="" loading="lazy">`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m3 17 5-4 4 3 3-3 6 5"/></svg>`}
          ${ml(e.type) ? `<span class="tag">${esc(ml(e.type))}</span>` : ''}
          ${ph.length > 1 ? `<span class="ph-count">${ICON.photo}${ph.length}</span>` : ''}
          <div class="ovl"><h3>${esc(ml(e.title))}</h3></div>
        </div>
        <div class="body"><span class="dt">${esc(Site.fmtDate(e.date))}</span>${
          loc ? `<span class="dt ev-loc">${ICON.pin}${esc(loc)}</span>` : ''}</div>
      </a>`;
    };
    const posts = (list) => `<div class="cards">${list.map(postCard).join('')}</div>`;

    /* ---------- format 4: foto lenta (markaz hayoti) ----------
       Ichki hayot vizual janr. Muqova yuklanmagan bo'lsa karta buzilmaydi —
       rasm o'rniga sana bilan neytral zamin chiziladi. */
    const lifeCard = (e) => `<a class="life-card rv" href="${href(e)}">
      <div class="lc-ph">${e.cover
        ? `<img src="${Site.safeUrl(e.cover)}" alt="" loading="lazy">`
        : `<div class="lc-none">${ICON.photo}</div>`}
        <span class="lc-date">${esc(dmy(e))}</span></div>
      <div class="lc-body"><h3>${esc(ml(e.title))}</h3>
        ${ml(e.location) ? `<div class="lc-loc">${ICON.pin}${esc(ml(e.location))}</div>` : ''}</div>
    </a>`;
    const gallery = (list) => `<div class="life-grid">${list.map(lifeCard).join('')}</div>`;

    /* ---------- format 5: umumiy taqvim (tadbirlar.html) ---------- */
    const mixed = (list) => `<div class="ev-list">${list.map(evCard).join('')}</div>`;

    /* ---------- bo'lim sozlamalari ---------- */
    const LAYOUT = {
      meet:  { up: register, ar: register, upTk: 'ev_up_meet',  arTk: 'ev_ar_meet',  noneTk: 'ev_none_meet'  },
      round: { up: topics,   ar: topics,   upTk: 'ev_up_round', arTk: 'ev_ar_round', noneTk: 'ev_none_round' },
      // `single` — kelgusi/o'tgan ajratilmaydi, hammasi bitta oqimda
      conf:  { single: posts, noneTk: 'ev_none_conf' },
      life:  { up: gallery,  ar: gallery,  upTk: 'ev_up_life',  arTk: 'ev_ar_life',  noneTk: 'ev_none_life'  },
      all:   { up: mixed,    ar: register, upTk: 'ev_upcoming', arTk: 'ev_past',     noneTk: 'ev_none'       }
    };
    const L = LAYOUT[kindId] || LAYOUT.all;

    /* ---------- kelgusi ---------- */
    /* 2026-08-20: kelgusi voqea yo'q, LEKIN arxivda bor bo'lsa "Kelgusi ... yo'q"
       degan katta bo'sh blok CHIZILMAYDI. Ilgari u sahifaning boshini butunlay
       egallab turardi va o'tkazilgan tadbir pastda, ekrandan tashqarida qolardi
       — admin yangi konferensiya qo'shib, sahifani ochib "ko'rinmayapti" degan
       xulosaga kelardi. Bo'sh holat endi faqat bo'lim HAQIQATAN bo'sh
       bo'lganda (na kelgusi, na o'tgan) ko'rsatiladi. */
    const upEl = document.getElementById('upcoming');
    if (upEl) {
      if (L.single) {
        // Bitta oqim: yangidan eskiga. Sarlavha yozilmaydi — bo'lim nomi
        // bannerda allaqachon turibdi, ikkinchi marta takrorlash ortiqcha.
        const hammasi = all.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
        upEl.innerHTML = hammasi.length ? L.single(hammasi) : empty(L.noneTk);
      } else if (up.length) upEl.innerHTML = head(L.upTk, up.length) + L.up(up);
      else if (past.length) upEl.innerHTML = '';
      else upEl.innerHTML = head(L.upTk, 0) + empty(L.noneTk);
    }

    /* ---------- arxiv: YIL bo'yicha ----------
       Rasmiy saytda o'tgan tadbirlar yo'qolmaydi — ular yil kesimida
       saqlanadi. Yil filtri FAQAT bir nechta yil to'planganda paydo bo'ladi:
       bitta yilda u hech narsani filtrlamaydi va faqat halaqit berardi. */
    const arEl = document.getElementById('archive');
    if (arEl) {
      // `single` bo'limda arxiv YO'Q — hamma narsa yuqoridagi bitta oqimda
      if (L.single || !past.length) { arEl.innerHTML = ''; }
      else {
        const years = [...new Set(past.map(year).filter(Boolean))];
        const groups = years.map(y => ({ y, items: past.filter(e => year(e) === y) }));
        const chips = years.length > 1
          ? `<div class="mfilter ev-years" id="evYears">`
            + `<button type="button" class="fchip on" data-y="*" aria-pressed="true">${esc(T('partners_filter_all'))}<span class="fc-n">${past.length}</span></button>`
            + groups.map(g => `<button type="button" class="fchip" data-y="${esc(g.y)}" aria-pressed="false">${esc(g.y)}<span class="fc-n">${g.items.length}</span></button>`).join('')
            + `</div>`
          : '';
        arEl.innerHTML = `<div class="ev-section">${head(L.arTk, past.length)}${chips}`
          + groups.map(g => `<section class="ev-year" data-y="${esc(g.y)}">`
              + (years.length > 1 ? `<h3 class="ev-yhead">${esc(g.y)}</h3>` : '')
              + L.ar(g.items) + `</section>`).join('')
          + `</div>`;

        const chipBox = document.getElementById('evYears');
        if (chipBox) {
          chipBox.addEventListener('click', (e) => {
            const b = e.target.closest('.fchip'); if (!b) return;
            const y = b.dataset.y;
            chipBox.querySelectorAll('.fchip').forEach(x => {
              const on = x === b;
              x.classList.toggle('on', on);
              x.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
            arEl.querySelectorAll('.ev-year').forEach(sec => {
              sec.classList.toggle('is-hidden', y !== '*' && sec.dataset.y !== y);
            });
          });
        }
      }
    }

    Site.initReveal();
  }
});
