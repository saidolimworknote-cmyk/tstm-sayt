/* yonalish.html sahifasining skripti.
   Ilgari HTML ichida inline turardi. CSP 'unsafe-inline' siz ishlashi uchun
   alohida faylga ko'chirildi — sahifada faqat <script src> qoladi. */
  Site.initPage({ active:'research', render(){
    const T = Site.t;
    const ICONS = {
      diplo:'<path d="M12 3v18M5 7l7-4 7 4M5 7v8l7 4 7-4V7M3 21h18"/>',
      shield:'<path d="M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6z"/>',
      trade:'<path d="M3 7h18M3 7l3-4h12l3 4M5 7v13h14V7M9 11h6"/>',
      globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.8 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.8-3.8-9S9.5 5.5 12 3Z"/>',
      chart:'<path d="M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-7"/>',
      energy:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'
    };
    // yo'nalish ta'rifi: ikon, kalit, nashr kategoriyasi, fokus chiplar
    const AREAS = [
      { ic:'diplo',  key:'dir1', cat:'Tashqi siyosat',  focus:['Diplomatiya','Ikki tomonlama','Xalqaro tashkilotlar'] },
      { ic:'shield', key:'dir2', cat:'Xavfsizlik',      focus:['Barqarorlik','Mudofaa','Tahdidlar'] },
      { ic:'trade',  key:'dir3', cat:'Iqtisodiyot',     focus:['Savdo','Investitsiya','Transport yo\'laklari'] },
      { ic:'globe',  key:'dir4', cat:'Markaziy Osiyo',  focus:['Suv-energetika','Chegara','Mintaqaviy aloqalar'] },
      { ic:'chart',  key:'dir5', cat:'Diplomatiya',     focus:['Prognozlash','Geosiyosat','Ssenariylar'] },
      { ic:'energy', key:'dir6', cat:'',                focus:['Energetika','Iqlim','Barqaror rivojlanish'] }
    ];
    let id = parseInt(Site.qs('id'), 10);
    if(isNaN(id) || id < 0 || id >= AREAS.length) id = 0;
    const a = AREAS[id];
    const title = T(a.key + '_t');

    document.title = title + ' — TSTM';
    document.getElementById('cr').textContent = title;
    document.getElementById('yotitle').textContent = title;
    document.getElementById('yolead').textContent = T(a.key + '_d');
    document.getElementById('yoicon').innerHTML = ICONS[a.ic];
    document.getElementById('yobody').textContent = T(a.key + '_long');
    document.getElementById('yofocus').innerHTML = a.focus.map(f=>`<span class="ch">${Site.esc(f)}</span>`).join('');

    // shu kategoriyadagi nashrlar
    let pubs = Store.all('publications').filter(p=>p.status==='published');
    if(a.cat) pubs = pubs.filter(p=> (p.category||'') === a.cat);
    pubs.sort((x,y)=>String(y.year||'').localeCompare(String(x.year||'')));
    const el = document.getElementById('pubs');
    if(!pubs.length){
      el.innerHTML = `<div class="empty col-span-full"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/></svg><div class="t">${T('yo_none')}</div></div>`;
    } else {
      el.innerHTML = pubs.map(p=>`
        <article class="pub rv">
          <div class="cover">${p.type?`<span class="badge">${Site.esc(Site.mlGet(p.type))}</span>`:''}${p.cover?`<img src="${Site.safeUrl(p.cover)}" alt="">`:`<div class="ph abs-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/></svg></div>`}</div>
          <div class="body"><div class="t">${Site.esc(Site.mlGet(p.category||''))}${p.year?' · '+Site.esc(p.year):''}</div><h3>${Site.esc(Site.dispTitle(p))}</h3>
            <a class="dl" href="${Site.safeUrl(p.pdf) || '#'}" ${p.pdf?'download':''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" stroke-linecap="round" stroke-linejoin="round"/></svg>${p.pdf?T('download_pdf'):T('soon')}</a>
          </div>
        </article>`).join('');
    }
    Site.initReveal();
  }});
