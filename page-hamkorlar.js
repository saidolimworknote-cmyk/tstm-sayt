/* hamkorlar.html sahifasining skripti.
   Hamkorlar TOIFA bo'yicha guruhlanadi. Toifa bazada o'zbekcha satr sifatida
   turadi (admin -> Hamkorlar -> Toifa), saytda esa tashrifchining tiliga
   o'giriladi: CAT_KEY xaritasi satrni i18n kalitiga bog'laydi. Admin'dagi
   PARTNER_CATS ro'yxatiga yangi toifa qo'shilsa — shu xaritaga va i18n.js ga
   ham qator qo'shing, aks holda hamkor "Boshqa hamkorlar" guruhiga tushadi.
   Logotip yuklanmagan hamkorlar uchun nom bosh harflaridan monogramma
   chiziladi — bo'sh kataklar qolmaydi. */
  Site.initPage({ active:'about', render(){
    const T = Site.t, esc = Site.esc;

    // Guruhlar tartibi ham shu ro'yxatdan olinadi (admin ro'yxati bilan bir xil).
    const CAT_KEY = {
      'Xalqaro tashkilotlar':      'pcat_intl',
      'Ilmiy-tadqiqot markazlari': 'pcat_think',
      'Universitetlar':            'pcat_uni',
      'Davlat organlari':          'pcat_gov',
      'Diplomatik vakolatxonalar': 'pcat_diplo'
    };
    const ORDER = Object.keys(CAT_KEY);
    const OTHER = '';                                  // toifasiz hamkorlar
    const catLabel = (c) => c && CAT_KEY[c] ? T(CAT_KEY[c]) : T('pcat_other');

    const wrapEl = document.getElementById('ptGroups');
    const list = Store.all('partners')
      .filter(p => (p.name || '').trim())
      .sort((a,b) => String(a.name).localeCompare(String(b.name), 'uz'));

    if(!list.length){
      document.getElementById('ptStats').innerHTML = '';
      document.getElementById('ptFilter').innerHTML = '';
      wrapEl.innerHTML = `<div class="empty"><div class="t">${esc(T('partners_empty'))}</div></div>`;
      Site.initReveal();
      return;
    }

    // ---- raqamlar: tashkilot / davlat / yo'nalish soni ----
    const countries = new Set(list.map(p => (p.country||'').trim()).filter(Boolean));
    const cats = new Set(list.map(p => (p.category||'').trim()).filter(Boolean));
    const stats = [
      { n: list.length, c: T('partners_stat_orgs') },
      { n: countries.size, c: T('partners_stat_geo') },
      { n: cats.size, c: T('partners_stat_cats') }
    ].filter(x => x.n > 0);
    document.getElementById('ptStats').innerHTML = stats.map(x =>
      `<div class="s"><div class="n">${esc(String(x.n))}</div><div class="c">${esc(x.c)}</div></div>`).join('');

    // ---- guruhlar: faqat hamkori BOR toifalar chiziladi ----
    const groups = ORDER.concat([OTHER])
      .map(c => ({ cat:c, items:list.filter(p => (p.category||'') === c) }))
      .filter(g => g.items.length);

    // ---- bitta hamkor kartasi ----
    // Logotipsiz hamkor uchun monogramma: nomning birinchi ikki so'zi bosh
    // harfi (lotin bo'lmagan yozuvda ham ishlaydi — kesib olinadi, aylantirilmaydi).
    const monogram = (name) => String(name).trim().split(/\s+/).slice(0,2)
      .map(w => w.charAt(0)).join('').toUpperCase().slice(0,2);
    const linkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 10.5 13.5"/><path d="M18 14v5a1.8 1.8 0 0 1-1.8 1.8H5A1.8 1.8 0 0 1 3.2 19V7.8A1.8 1.8 0 0 1 5 6h5"/></svg>';

    const card = (p) => {
      const name = String(p.name);
      const url = (p.url && p.url !== '#') ? Site.safeUrl(p.url) : '';
      const logo = p.logo ? `<img src="${Site.safeUrl(p.logo)}" alt="${esc(name)}" loading="lazy">`
                          : `<span class="mono">${esc(monogram(name))}</span>`;
      const descr = (Site.mlGet(p.descr) || '').trim();
      const inner = `<div class="pt-logo">${logo}</div>
        <div class="pt-body">
          <h3>${esc(name)}</h3>
          ${p.country ? `<div class="pt-geo">${esc(p.country)}</div>` : ''}
          ${descr ? `<p>${esc(descr)}</p>` : ''}
          ${url ? `<span class="pt-go">${linkIcon}${esc(T('partners_visit'))}</span>` : ''}
        </div>`;
      // Havolasi yo'q hamkor — oddiy karta (bosilmaydigan), bosilsa nima
      // bo'lishini va'da qilib qo'ymaslik uchun <a> ATAYLAB ishlatilmaydi.
      return url
        ? `<a class="pt-card is-link" href="${url}" target="_blank" rel="noopener">${inner}</a>`
        : `<div class="pt-card">${inner}</div>`;
    };

    wrapEl.innerHTML = groups.map(g => `
      <section class="pt-group rv" data-cat="${esc(g.cat)}">
        <div class="pt-ghead"><h2>${esc(catLabel(g.cat))}</h2><span class="cnt">${g.items.length}</span></div>
        <div class="pt-grid">${g.items.map(card).join('')}</div>
      </section>`).join('');

    // ---- toifa filtri (bittadan ortiq guruh bo'lgandagina ko'rsatiladi) ----
    const fEl = document.getElementById('ptFilter');
    if(groups.length > 1){
      const chips = [{ cat:'*', label:T('partners_filter_all'), n:list.length }]
        .concat(groups.map(g => ({ cat:g.cat, label:catLabel(g.cat), n:g.items.length })));
      fEl.innerHTML = chips.map((c,i) =>
        `<button type="button" class="fchip${i?'':' on'}" data-cat="${esc(c.cat)}" aria-pressed="${i?'false':'true'}">${esc(c.label)}<span class="fc-n">${c.n}</span></button>`).join('');
      fEl.addEventListener('click', (e) => {
        const b = e.target.closest('.fchip'); if(!b) return;
        const cat = b.dataset.cat;
        fEl.querySelectorAll('.fchip').forEach(x => {
          const on = x === b;
          x.classList.toggle('on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        wrapEl.querySelectorAll('.pt-group').forEach(g => {
          g.classList.toggle('is-hidden', cat !== '*' && g.dataset.cat !== cat);
        });
      });
    } else {
      fEl.classList.add('is-hidden');
      // Yagona guruh bo'lsa uning sarlavhasi ham ortiqcha — ro'yxatning o'zi yetarli.
      if(groups.length === 1 && groups[0].cat === OTHER){
        const h = wrapEl.querySelector('.pt-ghead');
        if(h) h.classList.add('is-hidden');
      }
    }

    Site.initReveal();
  }});
