/* tadqiqotlar.html sahifasining skripti.
   Ilgari HTML ichida inline turardi. CSP 'unsafe-inline' siz ishlashi uchun
   alohida faylga ko'chirildi — sahifada faqat <script src> qoladi. */
  Site.initPage({ active:'research', render(){
    const T = Site.t;
    const I = {
      diplo:'<path d="M12 3v18M5 7l7-4 7 4M5 7v8l7 4 7-4V7M3 21h18"/>',
      shield:'<path d="M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6z"/>',
      trade:'<path d="M3 7h18M3 7l3-4h12l3 4M5 7v13h14V7M9 11h6"/>',
      globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.8 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.8-3.8-9S9.5 5.5 12 3Z"/>',
      chart:'<path d="M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-7"/>',
      energy:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'
    };
    const areas = [
      { ic:'diplo', t:T('dir1_t'), d:T('dir1_d') },
      { ic:'shield', t:T('dir2_t'), d:T('dir2_d') },
      { ic:'trade', t:T('dir3_t'), d:T('dir3_d') },
      { ic:'globe', t:T('dir4_t'), d:T('dir4_d') },
      { ic:'chart', t:T('dir5_t'), d:T('dir5_d') },
      { ic:'energy', t:T('dir6_t'), d:T('dir6_d') }
    ];
    document.getElementById('areas').innerHTML = areas.map((a,i)=>`
      <a class="rcard rv" href="yonalish.html?id=${i}">
        <span class="num">${String(i+1).padStart(2,'0')}</span>
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${I[a.ic]}</svg></div>
        <h3>${Site.esc(a.t)}</h3>
        <p>${Site.esc(a.d)}</p>
        <span class="go">${T('yo_about')} →</span>
      </a>`).join('');

    const recent = Store.all('publications').filter(p=>p.status==='published')
      .sort((a,b)=>String(b.year||'').localeCompare(String(a.year||''))).slice(0,3);
    const el = document.getElementById('recent');
    if(!recent.length){ el.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="t">${T('no_pubs')}</div></div>`; }
    else el.innerHTML = recent.map(p=>`
      <a class="pub rv" href="nashr.html?id=${p.id}" style="cursor:pointer">
        <div class="cover">${p.type?`<span class="badge">${Site.esc(Site.mlGet(p.type))}</span>`:''}${p.cover?`<img src="${p.cover}" alt="">`:`<div class="ph" style="position:absolute;inset:0;border:0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/></svg></div>`}</div>
        <div class="body"><div class="t">${Site.esc(Site.mlGet(p.category||''))}${p.year?' · '+Site.esc(p.year):''}</div><h3>${Site.esc(Site.dispTitle(p))}</h3>
          <span class="dl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>${T('read_more')}</span>
        </div>
      </a>`).join('');
    Site.initReveal();
  }});
