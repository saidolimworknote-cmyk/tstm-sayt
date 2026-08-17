/* tadbirlar.html, uchrashuvlar.html, davra-suhbatlari.html,
   konferensiyalar.html, markaz-hayoti.html sahifalari uchun umumiy skript. */
Site.initPage({
  active: 'events',
  render() {
    const T = Site.t, esc = Site.esc, ml = Site.mlGet;
    const mainEl = document.querySelector('main');
    const targetType = (mainEl ? (mainEl.getAttribute('data-etype') || '') : '').trim();

    // 1. Voqealar bo'limlari uchun sub-navigatsiya (Tablar)
    const tabsContainer = document.getElementById('evTabs');
    if (tabsContainer) {
      const curPath = (location.pathname.split('/').pop() || '').toLowerCase();
      const tabs = [
        { href: 'tadbirlar.html', tk: 'all', active: curPath === 'tadbirlar.html' || !targetType },
        { href: 'uchrashuvlar.html', tk: 'nav_ev_meetings', active: curPath === 'uchrashuvlar.html' || targetType.toLowerCase() === 'uchrashuv' },
        { href: 'davra-suhbatlari.html', tk: 'nav_ev_roundtables', active: curPath === 'davra-suhbatlari.html' || targetType.toLowerCase() === 'davra suhbati' },
        { href: 'konferensiyalar.html', tk: 'nav_ev_conferences', active: curPath === 'konferensiyalar.html' || targetType.toLowerCase() === 'konferensiya' },
        { href: 'markaz-hayoti.html', tk: 'nav_ev_life', active: curPath === 'markaz-hayoti.html' || targetType.toLowerCase() === 'markaz hayoti' }
      ];
      tabsContainer.innerHTML = `<div class="tabs">` +
        tabs.map(t => `<a href="${t.href}" class="tab-link${t.active ? ' on' : ''}">${esc(T(t.tk))}</a>`).join('') +
        `</div>`;
    }

    const ICON = {
      clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/></svg>',
      pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>'
    };
    const strip = (h) => String(h || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const clip = (s, n) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const today = now.toISOString().slice(0, 10);
    const DAY = 86400000;

    let all = Store.all('events').filter(e => e.status === 'published');

    // Toifa bo'yicha aniq filtr
    if (targetType) {
      const norm = (s) => String(s || '').toLowerCase().trim();
      const target = norm(targetType);
      all = all.filter(e => {
        const raw = norm(e.type);
        const uz = norm(typeof e.type === 'object' ? e.type.uz : e.type);
        const ru = norm(typeof e.type === 'object' ? e.type.ru : '');
        const en = norm(typeof e.type === 'object' ? e.type.en : '');
        const allT = `${raw} ${uz} ${ru} ${en}`;

        if (target.includes('uchrashuv') || target.includes('meeting') || target.includes('встреч')) {
          return allT.includes('uchrashuv') || allT.includes('meeting') || allT.includes('встреч');
        }
        if (target.includes('davra') || target.includes('roundtable') || target.includes('круглый')) {
          return allT.includes('davra') || allT.includes('roundtable') || allT.includes('круглый');
        }
        if (target.includes('konferensiya') || target.includes('conference') || target.includes('конференц') || target.includes('forum') || target.includes('simpozium')) {
          return allT.includes('konferensiy') || allT.includes('conference') || allT.includes('конференц') || allT.includes('forum') || allT.includes('simpozium');
        }
        if (target.includes('markaz') || target.includes('life') || target.includes('жизнь') || target.includes("ta'lim")) {
          return allT.includes('markaz hayoti') || allT.includes('center life') || allT.includes('жизнь') || allT.includes("ta'lim") || allT.includes('maktab');
        }
        return allT.includes(target);
      });
    }

    const up = all.filter(e => (e.date || '') >= today).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const past = all.filter(e => (e.date || '') < today).sort((a, b) => String(b.date).localeCompare(String(a.date)));

    // Kelgusi tadbir — to'liq kartochka
    function card(e) {
      const d = Site.dayMonth(e.date);
      const yy = (String(e.date || '').split('-')[0]) || '';
      const loc = ml(e.location);
      const type = ml(e.type);
      const desc = clip(strip(ml(e.body)), 150);
      let badge = '';
      const diff = Math.round((new Date(e.date) - now) / DAY);
      if (diff === 0) badge = `<span class="ev-soon">${esc(T('ev_today'))}</span>`;
      else if (diff > 0 && diff <= 7) badge = `<span class="ev-soon">${esc(T('ev_soon'))}</span>`;
      return `<article class="ev-card rv">
        <div class="ev-cal"><span class="dd">${esc(d.dd || '—')}</span><span class="mm">${esc(d.mm || '')}</span>${yy ? `<span class="yy">${esc(yy)}</span>` : ''}</div>
        <div class="ev-cbody">
          <div class="ev-top">${type ? `<span class="ev-type">${esc(type)}</span>` : ''}${badge}</div>
          <h3>${esc(ml(e.title))}</h3>
          ${desc ? `<p class="ev-desc">${esc(desc)}</p>` : ''}
          <div class="ev-meta">${e.time ? `<span>${ICON.clock}${esc(e.time)}</span>` : ''}${loc ? `<span>${ICON.pin}${esc(loc)}</span>` : ''}</div>
        </div>
      </article>`;
    }

    // O'tgan tadbir — ixcham qator
    function pastRow(e) {
      const p = String(e.date || '').split('-');
      const dateStr = p.length === 3 ? `${p[2]} ${Site.dayMonth(e.date).mm} ${p[0]}` : '';
      const type = ml(e.type);
      return `<div class="ev-past-row rv">
        <div class="ev-pdate">${esc(dateStr)}</div>
        <div class="ev-ptitle">${esc(ml(e.title))}</div>
        ${type ? `<div class="ev-ptype">${esc(type)}</div>` : ''}
      </div>`;
    }

    const upEl = document.getElementById('upcoming');
    const pastEl = document.getElementById('past');

    if (upEl) {
      upEl.innerHTML = up.length
        ? `<div class="ev-head"><div class="kicker">${esc(T('ev_upcoming'))}</div><span class="ev-count">${up.length}</span></div><div class="ev-list">${up.map(card).join('')}</div>`
        : `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg><div class="t">${esc(T('ev_none'))}</div></div>`;
    }

    if (pastEl) {
      pastEl.innerHTML = past.length
        ? `<div class="ev-section"><div class="ev-head"><div class="kicker">${esc(T('ev_past'))}</div><span class="ev-count">${past.length}</span></div><div class="ev-past-list">${past.map(pastRow).join('')}</div></div>`
        : '';
    }

    if (window.Site && Site.initReveal) Site.initReveal();
  }
});
