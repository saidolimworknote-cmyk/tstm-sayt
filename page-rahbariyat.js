/* Rahbariyat VA Ekspertlar sahifalarining umumiy skripti.
   Ikkala sahifa bir xil ro'yxatni chizadi, farqi faqat KIMNI ko'rsatishida:
   `<div id="grid" data-kind="Rahbariyat">` bo'lsa faqat rahbariyat, aks holda
   qolganlari (kind bo'sh yoki "Ekspert"). Filtr HTML'dan data-atribut orqali
   keladi — CSP inline skriptga ruxsat bermaydi. */
  Site.initPage({ active:'about', render(){
    const T = Site.t;
    const el = document.getElementById('grid');
    const only = (el && el.dataset.kind) || '';   // '' => ekspertlar
    let exp = Store.all('experts')
      .filter(e => only === 'Rahbariyat' ? e.kind === 'Rahbariyat' : e.kind !== 'Rahbariyat')
      .sort((a,b)=>(a.order||0)-(b.order||0));
    if(!exp.length){ el.innerHTML=`<div class="empty"><div class="t">${T('none_data')}</div></div>`; return; }
    const I = {
      phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
      mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
      link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
      clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
    };
    el.innerHTML = exp.map(e=>{
      const photo = e.photo ? `<img src="${Site.safeUrl(e.photo)}" alt="">` : `<div class="ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="9" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/></svg></div>`;
      const contacts = [
        e.phone ? `<a href="tel:${Site.esc(e.phone.replace(/\s+/g,''))}">${I.phone}${Site.esc(e.phone)}</a>` : '',
        e.email ? `<a href="mailto:${Site.esc(e.email)}">${I.mail}${Site.esc(e.email)}</a>` : '',
        e.url ? `<a href="${Site.safeUrl(e.url)}" target="_blank" rel="noopener">${I.link}${Site.esc(e.url)}</a>` : '',
        e.hours ? `<span>${I.clock}${Site.esc(e.hours)}</span>` : ''
      ].filter(Boolean).join('');
      const tags = Site.mlGet(e.expertise||'').split(/[,;·|]/).map(s=>s.trim()).filter(Boolean);
      return `<div class="off-card rv">
        <a class="off-main" href="expert.html?id=${e.id}">
          <div class="off-photo">${photo}</div>
          <div class="off-info">
            <div class="role">${Site.esc(Site.mlGet(e.role))}</div>
            <h3>${Site.esc(Site.mlGet(e.name))}</h3>
            <div class="sub">${Site.esc(Site.mlGet(e.sub))}</div>
            ${tags.length?`<div class="off-tags">${tags.map(t=>`<span>${Site.esc(t)}</span>`).join('')}</div>`:''}
          </div>
        </a>
        ${contacts ? `<div class="off-contact">${contacts}</div>` : ''}
      </div>`;
    }).join('');
    Site.initReveal();
  }});
