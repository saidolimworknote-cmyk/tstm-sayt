/* nashrlar.html sahifasining skripti.
   Ilgari HTML ichida inline turardi. CSP 'unsafe-inline' siz ishlashi uchun
   alohida faylga ko'chirildi — sahifada faqat <script src> qoladi. */
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

    const wrap = document.getElementById('list');
    const fb = document.getElementById('filters');
    const qEl = document.getElementById('q');
    const typeSel = document.getElementById('typeSel');
    const sortSel = document.getElementById('sortSel');
    const countEl = document.getElementById('count');

    const allPubs = Store.all('publications').filter(p=>p.status==='published');
    const cats  = ['', ...Array.from(new Set(allPubs.map(p=>p.category).filter(Boolean)))];
    const types = Array.from(new Set(allPubs.map(p=>p.type).filter(Boolean)));

    let cat = (Site.qs('cat')||'').replace(/\+/g,' '); if(cats.indexOf(cat)<0) cat='';
    let type='', q='', sort='new';
    // Ekspert sahifasidan "Barchasini ko'rish" -> ?author=<ism> bilan keladi:
    // faqat shu muallif nashrlarini ko'rsatamiz. Muallif maydonida ism+unvon
    // bo'lishi mumkin, shuning uchun ikki tomonlama "ichida bormi" tekshiruvi.
    const norm = s => String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
    const author = (Site.qs('author')||'').replace(/\+/g,' ').trim();

    qEl.placeholder = tt('ph');
    typeSel.innerHTML = `<option value="">${esc(tt('allT'))}</option>` + types.map(t=>`<option value="${esc(t)}">${esc(ml(t))}</option>`).join('');
    sortSel.innerHTML = `<option value="new">${esc(tt('sNew'))}</option><option value="old">${esc(tt('sOld'))}</option><option value="az">${esc(tt('sAz'))}</option>`;

    const phCover = `<div class="ph abs-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/></svg></div>`;
    const coverHTML = p => p.cover ? `<img src="${Site.safeUrl(p.cover)}" alt="">` : phCover;
    const dlSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const arrowSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    function chips(){
      fb.innerHTML = cats.map(c=>`<button class="fchip ${c===cat?'on':''}" data-c="${esc(c)}">${c===''?esc(T('all')):esc(ml(c))}</button>`).join('');
      fb.querySelectorAll('.fchip').forEach(b=> b.onclick=()=>{ cat=b.dataset.c; render2(); });
    }
    function filtered(){
      let items = allPubs.slice();
      if(author){ const n = norm(author); items = items.filter(p=>{ const a = norm(p.author); return a && (a.indexOf(n) > -1 || n.indexOf(a) > -1); }); }
      if(cat)  items = items.filter(p=>p.category===cat);
      if(type) items = items.filter(p=>p.type===type);
      if(q){
        const s = q.toLowerCase();
        // qidiruv ikkala sarlavhani ham qamraydi — foydalanuvchi qisqa yoki to'liq
        // nomdagi so'zni yozsa ham nashr topiladi
        items = items.filter(p=> [ml(p.title), ml(p.shortTitle||''), ml(p.category||''), ml(p.type||''), (p.author||''), String(p.year||'')]
          .join(' ').toLowerCase().includes(s));
      }
      items.sort((a,b)=>{
        if(sort==='az') return Site.dispTitle(a).localeCompare(Site.dispTitle(b));
        const cmp = String(b.year||'').localeCompare(String(a.year||''));
        return sort==='old' ? -cmp : cmp;
      });
      return items;
    }
    function render2(){
      chips();
      const items = filtered();
      countEl.textContent = items.length + ' ' + tt('cnt');
      if(!items.length){ wrap.innerHTML = `<div class="empty col-span-full"><div class="t">${esc(T('no_pubs'))}</div></div>`; return; }
      wrap.innerHTML = items.map(p=>{
        const href = `nashr.html?id=${p.id}`;
        return `<div class="pub rv">
          <a class="cover-link" href="${href}" aria-label="${esc(Site.dispTitle(p))}"><div class="cover">${p.type?`<span class="badge">${esc(ml(p.type))}</span>`:''}${coverHTML(p)}</div></a>
          <div class="body">
            <div class="t">${esc(ml(p.category||''))}${p.year?' · '+esc(p.year):''}</div>
            <h3><a href="${href}" title="${esc(ml(p.title))}">${esc(Site.dispTitle(p))}</a></h3>
            <div class="pub-actions">
              <a class="dl" href="${href}">${arrowSvg}${esc(T('read_more')||'Batafsil')}</a>
              ${p.pdf?`<a class="dl pdf" href="${Site.safeUrl(p.pdf)}" download>${dlSvg}${esc((String(p.pdf).match(/\.(\w+)$/)||[,'FAYL'])[1].toUpperCase())}</a>`:''}
            </div>
          </div>
        </div>`;
      }).join('');
      Site.initReveal();
    }

    // Ekspertdan kelgan bo'lsa — kimning nashrlari ekanini ko'rsatuvchi chip + tozalash
    if(author){
      const note = document.createElement('div');
      note.className = 'author-note';
      note.innerHTML = `<span class="an-lab">${esc(tt('authL'))}: <b>${esc(author)}</b></span>`
        + `<a class="an-clear" href="nashrlar.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>${esc(tt('clearL'))}</a>`;
      countEl.parentNode.insertBefore(note, countEl);
    }

    qEl.oninput = ()=>{ q=qEl.value.trim(); render2(); };
    typeSel.onchange = ()=>{ type=typeSel.value; render2(); };
    sortSel.onchange = ()=>{ sort=sortSel.value; render2(); };
    render2();
  }});
