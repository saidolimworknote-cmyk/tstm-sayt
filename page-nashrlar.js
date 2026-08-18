/* Tadqiqotlar bo'limining barcha ro'yxat sahifalari uchun umumiy skript:
   nashrlar.html (barchasi), maqolalar.html, maruzalar.html, tahlillar.html,
   kitoblar.html.

   ASOSIY QOIDA (2026-08-19): sahifalar bir xil shablon EMAS — Voqealar
   bo'limidagi kabi har bir sahifa o'z nashr turiga MOS formatda chiziladi:

     maqolalar  -> `reading` : o'qish ro'yxati. Maqola matn janri, shuning
                    uchun sarlavha va annotatsiya keng qatorda, muqova esa
                    kichik yordamchi rasm.
     maruzalar  -> `talks`   : ma'ruzachi birinchi o'rinda. Ma'ruzada
                    "kim aytdi" sarlavhadan kam ahamiyatli emas.
     tahlillar  -> `reports` : muqovali kartalar + hudud/toifa. Rasmiy
                    tahliliy mahsulot — muqova va PDF asosiy.
     kitoblar   -> `shelf`   : kitob javoni. Muqova tik (3:4) va yirik.
     nashrlar.html -> `reports` (butun bo'limning umumiy ro'yxati).

   Format <main data-pkind="..."> da e'lon qilinadi (CSP inline skriptga
   ruxsat bermaydi). Tur -> bo'lim mosligi site-common.js dagi `PUB_KINDS` da.

   BOSHQARUV QATORI ma'lumot miqdoriga moslashadi (Hamkorlar sahifasidagi
   qoida): qidiruv, saralash, tur tanlagichi va toifa chiplari faqat
   haqiqatan foydali bo'lganda ko'rinadi. */
  Site.initPage({ active:'pubs', render(){
    const T = Site.t, esc = Site.esc, ml = Site.mlGet;
    const L = (window.I18N ? I18N.lang : 'uz');
    const TT = {
      ph:  {uz:"Nashrlarni qidirish…", ru:"Поиск публикаций…", en:"Search publications…"},
      allT:{uz:"Barcha turlar", ru:"Все типы", en:"All types"},
      sNew:{uz:"Avval yangi", ru:"Сначала новые", en:"Newest first"},
      sOld:{uz:"Avval eski", ru:"Сначала старые", en:"Oldest first"},
      sAz: {uz:"Nomi (A–Z)", ru:"Название (А–Я)", en:"Title (A–Z)"},
      cnt: {uz:"ta nashr", ru:"публикаций", en:"publications"},
      authL:{uz:"Ekspert nashrlari", ru:"Публикации эксперта", en:"Expert’s publications"},
      clearL:{uz:"Barcha nashrlar", ru:"Все публикации", en:"All publications"}
    };
    const tt = k => (TT[k][L] || TT[k].uz);

    // Boshqaruv elementlari qachon ko'rinadi (ostonalar bitta joyda)
    const SHOW_SEARCH_FROM = 6;   // shuncha nashrdan boshlab qidiruv
    const SHOW_SORT_FROM   = 2;   // shuncha nashrdan boshlab saralash
    const SHOW_CHIPS_FROM  = 2;   // shuncha TOIFAdan boshlab chiplar

    const wrap = document.getElementById('list');
    const fb = document.getElementById('filters');
    const qEl = document.getElementById('q');
    const typeSel = document.getElementById('typeSel');
    const sortSel = document.getElementById('sortSel');
    const countEl = document.getElementById('count');

    // Qaysi bo'lim: <main data-pkind="reports"> ... Atribut bo'lmasa
    // (nashrlar.html) — cheklov yo'q, barcha nashrlar chiqadi.
    const scopeEl = document.querySelector('[data-pkind]');
    const kind = scopeEl ? Site.pubKindById(scopeEl.dataset.pkind) : null;

    let allPubs = Store.all('publications').filter(p => p.status === 'published');
    if (kind) {
      // Tur -> bo'lim mosligi PUB_KINDS orqali: eskirgan nomlar (masalan
      // "Hisobot") ham to'g'ri sahifaga tushadi, ilgari ular yo'qolib qolardi.
      allPubs = allPubs.filter(p => { const k = Site.pubKind(p.type); return !!k && k.id === kind.id; });
    }

    const cats  = ['', ...Array.from(new Set(allPubs.map(p => p.category).filter(Boolean)))];
    const types = Array.from(new Set(allPubs.map(p => p.type).filter(Boolean)));

    let cat = (Site.qs('cat') || '').replace(/\+/g, ' '); if (cats.indexOf(cat) < 0) cat = '';
    // ?type=<tur> — bosh sahifadagi menyu shu bilan kelishi mumkin.
    let type = (Site.qs('type') || '').replace(/\+/g, ' '); if (types.indexOf(type) < 0) type = '';
    let q = '', sort = 'new';
    // Ekspert sahifasidan "Barchasini ko'rish" -> ?author=<ism>
    const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const author = (Site.qs('author') || '').replace(/\+/g, ' ').trim();

    /* ---------- boshqaruv qatori: keraksizini yashiramiz ---------- */
    const hideBox = (el) => { const b = el && el.closest('.pubsel, .pubsearch'); if (b) b.style.display = 'none'; };
    qEl.placeholder = tt('ph');
    if (allPubs.length < SHOW_SEARCH_FROM) hideBox(qEl);

    typeSel.innerHTML = `<option value="">${esc(tt('allT'))}</option>` + types.map(t => `<option value="${esc(t)}">${esc(ml(t))}</option>`).join('');
    if (type) typeSel.value = type;
    if (types.length < 2) hideBox(typeSel);

    sortSel.innerHTML = `<option value="new">${esc(tt('sNew'))}</option><option value="old">${esc(tt('sOld'))}</option><option value="az">${esc(tt('sAz'))}</option>`;
    if (allPubs.length < SHOW_SORT_FROM) hideBox(sortSel);

    const dlSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const arrowSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const bookSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/></svg>`;
    const micSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>`;
    const phCover = `<div class="ph abs-cover">${bookSvg}</div>`;
    const coverHTML = p => p.cover ? `<img src="${Site.safeUrl(p.cover)}" alt="" loading="lazy">` : phCover;
    const href = p => `nashr.html?id=${encodeURIComponent(p.id)}`;
    const fileExt = p => (String(p.pdf).match(/\.(\w+)$/) || [, 'FAYL'])[1].toUpperCase();
    const pdfLink = p => p.pdf ? `<a class="dl pdf" href="${Site.safeUrl(p.pdf)}" download>${dlSvg}${esc(fileExt(p))}</a>` : '';
    const strip = h => String(h || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const clip = (s, n) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s);

    /* ---------- format 1: o'qish ro'yxati (maqolalar) ----------
       Maqola — matn janri: sarlavha va annotatsiya keng qatorda, muqova
       kichik yordamchi rasm sifatida chapda. */
    const readingRow = (p) => {
      const ex = clip(strip(ml(p.desc || '')), 240);
      return `<article class="art-row rv">
        <a class="ar-thumb" href="${href(p)}" tabindex="-1" aria-hidden="true">${coverHTML(p)}</a>
        <div class="ar-body">
          <div class="ar-meta">${p.type ? `<span class="ar-type">${esc(ml(p.type))}</span>` : ''}${ml(p.category || '') ? `<span>${esc(ml(p.category))}</span>` : ''}${p.year ? `<span>${esc(p.year)}</span>` : ''}</div>
          <h3><a href="${href(p)}" title="${esc(ml(p.title))}">${esc(Site.dispTitle(p))}</a></h3>
          ${ex ? `<p class="ar-ex">${esc(ex)}</p>` : ''}
          <div class="ar-foot">
            ${p.author ? `<span class="ar-author">${esc(p.author)}</span>` : '<span></span>'}
            <span class="ar-acts"><a class="dl" href="${href(p)}">${arrowSvg}${esc(T('read_more') || 'Batafsil')}</a>${pdfLink(p)}</span>
          </div>
        </div>
      </article>`;
    };
    const reading = (items) => `<div class="art-list">${items.map(readingRow).join('')}</div>`;

    /* ---------- format 2: ma'ruzalar ----------
       Ma'ruzada "kim aytdi" sarlavhadan kam ahamiyatli emas, shuning uchun
       muallif kartaning tepasida, ikonka bilan ajratib ko'rsatiladi. */
    const talkCard = (p) => `<a class="talk-card rv" href="${href(p)}">
      <div class="tk-head"><span class="tk-ico">${micSvg}</span>
        <span class="tk-author">${esc(p.author || T('org_name'))}</span></div>
      <h3>${esc(Site.dispTitle(p))}</h3>
      <div class="tk-meta">${ml(p.category || '') ? `<span>${esc(ml(p.category))}</span>` : ''}${p.year ? `<span>${esc(p.year)}</span>` : ''}</div>
      ${p.pdf ? `<span class="tk-file">${dlSvg}${esc(fileExt(p))}</span>` : ''}
    </a>`;
    const talks = (items) => `<div class="talk-grid">${items.map(talkCard).join('')}</div>`;

    /* ---------- format 3: tahliliy mahsulot (tahlillar + nashrlar.html) ----------
       Mavjud muqovali karta — rasmiy hisobot uchun to'g'ri format. Hudud
       (region) qo'shildi: tahlilning qamrovi bir qarashda ko'rinsin. */
    const reportCard = (p) => `<div class="pub rv">
      <a class="cover-link" href="${href(p)}" aria-label="${esc(Site.dispTitle(p))}"><div class="cover">${p.type ? `<span class="badge">${esc(ml(p.type))}</span>` : ''}${coverHTML(p)}</div></a>
      <div class="body">
        <div class="t">${esc(ml(p.category || ''))}${p.year ? ' · ' + esc(p.year) : ''}${p.region ? ' · ' + esc(ml(p.region)) : ''}</div>
        <h3><a href="${href(p)}" title="${esc(ml(p.title))}">${esc(Site.dispTitle(p))}</a></h3>
        ${p.author ? `<div class="pub-author">${esc(p.author)}</div>` : ''}
        <div class="pub-actions">
          <a class="dl" href="${href(p)}">${arrowSvg}${esc(T('read_more') || 'Batafsil')}</a>
          ${pdfLink(p)}
        </div>
      </div>
    </div>`;
    const reports = (items) => `<div class="pub-grid">${items.map(reportCard).join('')}</div>`;

    /* ---------- format 4: kitob javoni (kitoblar) ----------
       Kitobda muqova asosiy taniqlik belgisi: u tik (3:4) va yirik, qatorda
       to'rtta. Muqova yuklanmagan bo'lsa neytral "muqova" chiziladi. */
    const bookCard = (p) => `<a class="book rv" href="${href(p)}">
      <div class="bk-cover">${coverHTML(p)}</div>
      <div class="bk-body">
        <h3>${esc(Site.dispTitle(p))}</h3>
        <div class="bk-meta">${p.author ? `<span>${esc(p.author)}</span>` : ''}${p.year ? `<span>${esc(p.year)}</span>` : ''}</div>
        ${p.pdf ? `<span class="bk-file">${dlSvg}${esc(fileExt(p))}</span>` : ''}
      </div>
    </a>`;
    const shelf = (items) => `<div class="book-shelf">${items.map(bookCard).join('')}</div>`;

    const LAYOUT = { articles: reading, lectures: talks, reports: reports, books: shelf };
    const renderList = (kind && LAYOUT[kind.id]) || reports;

    /* ---------- filtr va chizish ---------- */
    function chips(){
      // Bitta toifada chiplar hech narsani filtrlamaydi — chizmaymiz.
      if (cats.length - 1 < SHOW_CHIPS_FROM) { fb.style.display = 'none'; return; }
      fb.innerHTML = cats.map(c => `<button type="button" class="fchip ${c === cat ? 'on' : ''}" data-c="${esc(c)}" aria-pressed="${c === cat}">${c === '' ? esc(T('all')) : esc(ml(c))}</button>`).join('');
      fb.querySelectorAll('.fchip').forEach(b => b.onclick = () => { cat = b.dataset.c; render2(); });
    }
    function filtered(){
      let items = allPubs.slice();
      if (author) { const n = norm(author); items = items.filter(p => { const a = norm(p.author); return a && (a.indexOf(n) > -1 || n.indexOf(a) > -1); }); }
      if (cat)  items = items.filter(p => p.category === cat);
      if (type) items = items.filter(p => p.type === type);
      if (q) {
        const s = q.toLowerCase();
        // qidiruv ikkala sarlavhani ham qamraydi — foydalanuvchi qisqa yoki
        // to'liq nomdagi so'zni yozsa ham nashr topiladi
        items = items.filter(p => [ml(p.title), ml(p.shortTitle || ''), ml(p.category || ''), ml(p.type || ''), (p.author || ''), String(p.year || '')]
          .join(' ').toLowerCase().includes(s));
      }
      items.sort((a, b) => {
        if (sort === 'az') return Site.dispTitle(a).localeCompare(Site.dispTitle(b));
        const cmp = String(b.year || '').localeCompare(String(a.year || ''));
        return sort === 'old' ? -cmp : cmp;
      });
      return items;
    }
    function render2(){
      chips();
      const items = filtered();
      countEl.textContent = items.length + ' ' + tt('cnt');
      wrap.innerHTML = items.length
        ? renderList(items)
        : `<div class="empty"><div class="t">${esc(T('no_pubs'))}</div></div>`;
      Site.initReveal();
    }

    // Ekspertdan kelgan bo'lsa — kimning nashrlari ekanini ko'rsatuvchi chip + tozalash
    if (author) {
      const note = document.createElement('div');
      note.className = 'author-note';
      note.innerHTML = `<span class="an-lab">${esc(tt('authL'))}: <b>${esc(author)}</b></span>`
        + `<a class="an-clear" href="nashrlar.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>${esc(tt('clearL'))}</a>`;
      countEl.parentNode.insertBefore(note, countEl);
    }

    qEl.oninput = () => { q = qEl.value.trim(); render2(); };
    typeSel.onchange = () => { type = typeSel.value; render2(); };
    sortSel.onchange = () => { sort = sortSel.value; render2(); };
    render2();
  }});
