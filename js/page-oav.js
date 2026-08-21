/* oav.html — "Bizning ekspertlar OAVlarda" ro'yxati.
   Tuzilishi page-tadbirlar.js bilan bir xil; farqi: filtr kategoriya emas,
   OAV NOMI (outlet) bo'yicha, va kartada ekspert ismi ko'rsatiladi. */
  Site.initPage({ active:'oav', render(){
    const wrap = document.getElementById('list');
    const fb = document.getElementById('filters');
    const all = Store.all('mediaPosts').filter(p => p.status==='published')
      .sort((a,b)=> String(b.date||'').localeCompare(String(a.date||'')));

    // Filtr chiplar — bazadagi OAV nomlaridan yig'iladi (bo'shlari tashlanadi)
    const outlets = ['', ...Array.from(new Set(all.map(p=>p.outlet).filter(Boolean))).sort()];
    let active = Site.qs('outlet') || '';
    if(outlets.indexOf(active)<0) active='';

    function imgHTML(p){
      return p.cover
        ? `<img src="${Site.safeUrl(p.cover)}" alt="">`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/></svg>`;
    }
    function draw(){
      // Bitta ham OAV nomi kiritilmagan bo'lsa filtr qatorini umuman chizmaymiz
      if(outlets.length > 1){
        fb.innerHTML = outlets.map(o=>`<button class="fchip ${o===active?'on':''}" data-o="${Site.esc(o)}">${o===''?Site.esc(Site.t('all')):Site.esc(o)}</button>`).join('');
        fb.querySelectorAll('.fchip').forEach(b=> b.onclick=()=>{ active=b.dataset.o; draw(); });
      } else { fb.innerHTML = ''; }

      const items = active==='' ? all : all.filter(p=>p.outlet===active);
      if(!items.length){
        wrap.innerHTML = `<div class="empty col-span-full"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/></svg><div class="t">${Site.esc(Site.t(active===''?'oav_empty':'oav_empty_o'))}</div></div>`;
        return;
      }
      wrap.innerHTML = items.map(p=>`
        <a class="ncard rv" href="sharh.html?id=${p.id}">
          <div class="img ph">${imgHTML(p)}
            ${p.outlet?`<span class="tag">${Site.esc(p.outlet)}</span>`:''}
            <div class="ovl"><h3>${Site.esc(Site.mlGet(p.title))}</h3></div>
          </div>
          <div class="body">
            ${p.expert?`<span class="oav-exp">${Site.esc(p.expert)}</span>`:''}
            <span class="dt">${Site.fmtDate(p.date)}</span>
          </div>
        </a>`).join('');
      Site.initReveal();
    }
    draw();
  }});
