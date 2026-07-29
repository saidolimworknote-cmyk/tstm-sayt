/* tadbirlar.html sahifasining skripti.
   Ilgari HTML ichida inline turardi. CSP 'unsafe-inline' siz ishlashi uchun
   alohida faylga ko'chirildi — sahifada faqat <script src> qoladi. */
  Site.initPage({ active:'events', render(){
    const T = Site.t, esc = Site.esc, ml = Site.mlGet;
    const ICON = {
      clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/></svg>',
      pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>'
    };
    const strip = (h) => String(h||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
    const clip = (s,n) => (s.length>n ? s.slice(0,n).replace(/\s+\S*$/,'')+'…' : s);
    const now = new Date(); now.setHours(0,0,0,0);
    const today = now.toISOString().slice(0,10);
    const DAY = 86400000;

    const all = Store.all('events').filter(e=>e.status==='published');
    const up = all.filter(e=>(e.date||'')>=today).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const past = all.filter(e=>(e.date||'')<today).sort((a,b)=>String(b.date).localeCompare(String(a.date)));

    // kelgusi tadbir — boy kartochka
    function card(e){
      const d = Site.dayMonth(e.date);
      const yy = (String(e.date||'').split('-')[0]) || '';
      const loc = ml(e.location);
      const type = ml(e.type);
      const desc = clip(strip(ml(e.body)), 150);
      // yaqinlik belgisi: bugun / 7 kun ichida
      let badge = '';
      const diff = Math.round((new Date(e.date) - now) / DAY);
      if (diff === 0) badge = `<span class="ev-soon">${esc(T('ev_today'))}</span>`;
      else if (diff > 0 && diff <= 7) badge = `<span class="ev-soon">${esc(T('ev_soon'))}</span>`;
      return `<article class="ev-card rv">
        <div class="ev-cal"><span class="dd">${esc(d.dd||'—')}</span><span class="mm">${esc(d.mm||'')}</span>${yy?`<span class="yy">${esc(yy)}</span>`:''}</div>
        <div class="ev-cbody">
          <div class="ev-top">${type?`<span class="ev-type">${esc(type)}</span>`:''}${badge}</div>
          <h3>${esc(ml(e.title))}</h3>
          ${desc?`<p class="ev-desc">${esc(desc)}</p>`:''}
          <div class="ev-meta">${e.time?`<span>${ICON.clock}${esc(e.time)}</span>`:''}${loc?`<span>${ICON.pin}${esc(loc)}</span>`:''}</div>
        </div>
      </article>`;
    }
    // o'tgan tadbir — ixcham qator
    function pastRow(e){
      const p = String(e.date||'').split('-');
      const dateStr = p.length===3 ? `${p[2]} ${Site.dayMonth(e.date).mm} ${p[0]}` : '';
      const type = ml(e.type);
      return `<div class="ev-past-row rv">
        <div class="ev-pdate">${esc(dateStr)}</div>
        <div class="ev-ptitle">${esc(ml(e.title))}</div>
        ${type?`<div class="ev-ptype">${esc(type)}</div>`:''}
      </div>`;
    }

    document.getElementById('upcoming').innerHTML = up.length
      ? `<div class="ev-head"><div class="kicker">${esc(T('ev_upcoming'))}</div><span class="ev-count">${up.length}</span></div><div class="ev-list">${up.map(card).join('')}</div>`
      : `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg><div class="t">${esc(T('ev_none'))}</div></div>`;
    document.getElementById('past').innerHTML = past.length
      ? `<div class="ev-section"><div class="ev-head"><div class="kicker">${esc(T('ev_past'))}</div><span class="ev-count">${past.length}</span></div><div class="ev-past-list">${past.map(pastRow).join('')}</div></div>` : '';
    if (window.Site && Site.initReveal) Site.initReveal();
  }});
