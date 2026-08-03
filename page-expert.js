/* expert.html sahifasining skripti.
   Ilgari HTML ichida inline turardi. CSP 'unsafe-inline' siz ishlashi uchun
   alohida faylga ko'chirildi — sahifada faqat <script src> qoladi. */
  Site.initPage({ active:'about', render(){
    const T = Site.t, esc = Site.esc, ml = Site.mlGet;
    const id = Site.qs('id');
    const e = id ? Store.find('experts', id) : null;
    const main = document.getElementById('main');
    if(!e){
      main.innerHTML = `<div class="page-banner"><div class="wrap"><div class="crumb"><a href="Bosh sahifa - Hi-Fi.html">${T('home')}</a><span class="sep">/</span><a href="rahbariyat.html">${T('nav_about_leadership')}</a></div><h1>${T('not_found_t')||'Topilmadi'}</h1></div></div>
        <section class="block"><div class="wrap"><div class="empty"><div class="t">${T('not_found_t')}</div><div class="mt-20"><a class="btn outline" href="rahbariyat.html">← ${T('all_team')}</a></div></div></div></section>`;
      return;
    }
    const name = ml(e.name);
    document.title = name + ' — TSTM';
    const bio = ml(e.bio);

    // Muallif maydoni ekspert ismiga mos kelsa — uning materiali deb hisoblaymiz.
    // MUHIM: muallif maydoniga endi ism-familiya BILAN BIRGA unvon yoziladi
    // (masalan "Daria Gorelkina, bosh ilmiy xodim"), shuning uchun qat'iy tenglik
    // yetmaydi — ikki tomonlama "ichida bormi" tekshiruvi qilamiz (registr va
    // ortiqcha bo'shliqlarga bog'liq bo'lmagan holda).
    const norm = s => String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
    const byThisExpert = it => {
      const a = norm(it.author), n = norm(name);
      if(!a || !n) return false;
      return a.indexOf(n) > -1 || n.indexOf(a) > -1;
    };
    const pubsAll = Store.all('publications')
      .filter(p => p.status==='published' && byThisExpert(p))
      .sort((a,b)=>String(b.year||'').localeCompare(String(a.year||'')));
    // Ekspert sahifasida faqat eng yangi 4 tasi; qolgani "Barchasini ko'rish" orqali
    // nashrlar sahifasida (shu ekspert filtri bilan) ko'rinadi.
    const PUB_LIMIT = 4;
    const pubs = pubsAll.slice(0, PUB_LIMIT);

    // "Tashqi siyosat, Xavfsizlik" -> chiplar; nashrlar sahifasidagi filtrga havola qiladi
    const tags = ml(e.expertise||'').split(/[,;·|]/).map(s=>s.trim()).filter(Boolean);

    const I = Site.ICON;
    const IC = {
      mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
      phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
      link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
      clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
    };
    const phSvg = `<div class="ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="12" cy="9" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></svg></div>`;
    const phCover = `<div class="ph abs-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/></svg></div>`;
    const dlSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const arrowSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const contactRows = [
      e.email ? `<a href="mailto:${esc(e.email)}">${IC.mail}${esc(e.email)}</a>` : '',
      e.phone ? `<a href="tel:${esc(e.phone.replace(/\s+/g,''))}">${IC.phone}${esc(e.phone)}</a>` : '',
      e.url   ? `<a href="${Site.safeUrl(e.url)}" target="_blank" rel="noopener">${IC.link}${esc(e.url.replace(/^https?:\/\//,''))}</a>` : '',
      e.hours ? `<span class="row">${IC.clock}${esc(e.hours)}</span>` : ''
    ].filter(Boolean).join('');

    main.innerHTML = `
      <div class="page-banner"><div class="wrap">
        <div class="crumb"><a href="Bosh sahifa - Hi-Fi.html">${T('home')}</a><span class="sep">/</span><a href="rahbariyat.html">${T('nav_about_leadership')}</a><span class="sep">/</span><span>${esc(name)}</span></div>
      </div></div>
      <section class="block"><div class="wrap"><div class="exp-detail">
        <div>
          <div class="photo">${e.photo?`<img src="${Site.safeUrl(e.photo)}" alt="${esc(name)}">`:phSvg}</div>
          ${contactRows?`<div class="exp-contact"><div class="lab">${T('expert_contact')}</div>${contactRows}</div>`:''}
        </div>
        <div>
          <div class="role">${esc(ml(e.role))}</div>
          <h1>${esc(name)}</h1>
          <div class="sub">${esc(ml(e.sub))}</div>
          ${tags.length?`<div class="kicker kick-m0-12">${T('expert_expertise')}</div>
            <div class="exp-tags">${tags.map(t=>`<a href="nashrlar.html?cat=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</div>`:''}
          ${bio?`<div class="kicker kick-m8-14">${T('expert_bio')}</div><div class="prose">${bio}</div>`:''}
          <div class="share-row"><span class="lab">${T('share')||'Ulashish'}</span>
            <a href="#" aria-label="Telegram">${I.tg}</a><a href="#" aria-label="Facebook">${I.fb}</a><a href="#" aria-label="X">${I.x}</a>
          </div>
        </div>
      </div></div></section>

      <section class="block pt0"><div class="wrap">
        <div class="sec-head"><div><div class="kicker">${T('expert_pubs')}</div></div>${pubsAll.length>PUB_LIMIT?`<a class="arrow-link" href="nashrlar.html?author=${encodeURIComponent(name)}">${T('view_all')} →</a>`:''}</div>
        ${pubs.length?`<div class="pub-grid">${pubs.map(p=>{
          const href = `nashr.html?id=${p.id}`;
          return `<div class="pub rv">
            <a class="cover-link" href="${href}" aria-label="${esc(Site.dispTitle(p))}"><div class="cover">${p.type?`<span class="badge">${esc(ml(p.type))}</span>`:''}${p.cover?`<img src="${Site.safeUrl(p.cover)}" alt="">`:phCover}</div></a>
            <div class="body">
              <div class="t">${esc(ml(p.category||''))}${p.year?' · '+esc(p.year):''}</div>
              <h3><a href="${href}" title="${esc(ml(p.title))}">${esc(Site.dispTitle(p))}</a></h3>
              <div class="pub-actions">
                <a class="dl" href="${href}">${arrowSvg}${esc(T('read_more')||'Batafsil')}</a>
                ${p.pdf?`<a class="dl pdf" href="${Site.safeUrl(p.pdf)}" download>${dlSvg}PDF</a>`:''}
              </div>
            </div>
          </div>`;
        }).join('')}</div>`
        :`<div class="empty"><div class="t">${T('expert_none_pub')}</div></div>`}
      </div></section>`;
    Site.initReveal();
  }});
