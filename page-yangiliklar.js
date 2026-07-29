/* yangiliklar.html sahifasining skripti.
   Ilgari HTML ichida inline turardi. CSP 'unsafe-inline' siz ishlashi uchun
   alohida faylga ko'chirildi — sahifada faqat <script src> qoladi. */
  Site.initPage({ active:'news', render(){
    const wrap = document.getElementById('list');
    const fb = document.getElementById('filters');
    let all = Store.all('news').filter(n => n.status==='published')
      .sort((a,b)=> String(b.date||'').localeCompare(String(a.date||'')));
    const cats = ['', ...Array.from(new Set(all.map(n=>n.category).filter(Boolean)))];
    let active = Site.qs('cat') || '';
    if(cats.indexOf(active)<0) active='';

    function imgHTML(n){
      return n.cover
        ? `<img src="${Site.safeUrl(n.cover)}" alt="">`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m3 17 5-4 4 3 3-3 6 5"/></svg>`;
    }
    function draw(){
      fb.innerHTML = cats.map(c=>`<button class="fchip ${c===active?'on':''}" data-c="${Site.esc(c)}">${c===''?Site.esc(Site.t('all')):Site.esc(Site.mlGet(c))}</button>`).join('');
      fb.querySelectorAll('.fchip').forEach(b=> b.onclick=()=>{ active=b.dataset.c; draw(); });
      const items = active==='' ? all : all.filter(n=>n.category===active);
      if(!items.length){ wrap.innerHTML = `<div class="empty" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14h8"/></svg><div class="t">${Site.esc(Site.t('no_news_cat'))}</div></div>`; return; }
      wrap.innerHTML = items.map(n=>`
        <a class="ncard rv" href="yangilik.html?id=${n.id}">
          <div class="img ph">${imgHTML(n)}
            ${n.category?`<span class="tag">${Site.esc(Site.mlGet(n.category))}</span>`:''}
            <div class="ovl"><h3>${Site.esc(Site.mlGet(n.title))}</h3></div>
          </div>
          <div class="body"><span class="dt">${Site.fmtDate(n.date)}</span><span class="dt vct" data-vid="${n.id}" style="margin-left:auto;display:inline-flex;align-items:center;gap:5px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" style="width:14px;height:14px"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg><b>·</b></span></div>
        </a>`).join('');
      Site.initReveal();
      // ko'rishlar sonini (faqat o'qish, sanamasdan) ko'rsatamiz
      wrap.querySelectorAll('.vct').forEach(function(el){
        Store.getView('news', el.dataset.vid, function(c){ var b=el.querySelector('b'); if(b) b.textContent = c; });
      });
    }
    draw();
  }});
