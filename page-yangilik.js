/* yangilik.html sahifasining skripti.
   Ilgari HTML ichida inline turardi. CSP 'unsafe-inline' siz ishlashi uchun
   alohida faylga ko'chirildi — sahifada faqat <script src> qoladi. */
  Site.initPage({ active:'news', render(){
    const id = Site.qs('id');
    const n = id ? Store.find('news', id) : null;
    const main = document.getElementById('main');
    const T = Site.t;
    if(!n){
      main.innerHTML = `<div class="page-banner"><div class="wrap"><div class="crumb"><a href="Bosh sahifa - Hi-Fi.html">${T('home')}</a><span class="sep">/</span><a href="yangiliklar.html">${T('nav_news')}</a></div><h1>${T('not_found_t')}</h1></div></div>
        <section class="block"><div class="wrap"><div class="empty"><div class="t">${T('not_found_t')}</div><div style="margin-top:20px"><a class="btn outline" href="yangiliklar.html">← ${T('all_news')}</a></div></div></div></section>`;
      return;
    }
    document.title = Site.mlGet(n.title) + ' — TSTM';
    const bodyRaw = Site.mlGet(n.body);
    const excerpt = Site.mlGet(n.excerpt);
    // Admin yozgan "Qisqa anons" (excerpt) — HAR DOIM ko'rishlar tagida, rasm ustida
    // standfirst (yetakchi paragraf) sifatida ko'rsatiladi.
    const standfirst = excerpt ? `<p class="art-lead">${Site.esc(excerpt)}</p>` : '';
    // Asosiy matn: to'liq matn bo'lsa — o'sha. Agar to'liq matn aynan anonsning o'zi
    // bo'lsa (seed shunday) yoki umuman bo'sh bo'lsa — takrorlamaymiz (anons yuqorida chiqdi).
    const bodyText = (bodyRaw||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
    const exNorm = (excerpt||'').replace(/\s+/g,' ').trim();
    const bodyIsExcerpt = !!(exNorm && bodyText === exNorm);
    const body = (bodyRaw && !bodyIsExcerpt) ? bodyRaw
               : (excerpt ? '' : '<p class="muted">'+Site.esc(T('soon_text'))+'</p>');
    // related
    const related = Store.all('news').filter(x=>x.status==='published' && x.id!==n.id)
      .sort((a,b)=> String(b.date||'').localeCompare(String(a.date||''))).slice(0,3);
    const I = Site.ICON;
    // chop etish uchun: rasmiy sarlavha (idora nomi) + manba/sana footeri
    const printHead = `<div class="print-head"><img src="logo-mark.png" alt=""><div class="ph-txt"><b>${Site.esc(T('org_name'))}</b><span>${Site.esc(T('org_tagline'))}</span></div></div>`;
    const printFoot = `<div class="print-foot"><span>${Site.esc(T('print_source'))}: ${Site.esc(location.href)}</span><span>${Site.esc(T('print_date'))}: ${Site.fmtDate(new Date().toISOString().slice(0,10))}</span></div>`;
    main.innerHTML = `${printHead}
      <div class="page-banner"><div class="wrap">
        <div class="crumb"><a href="Bosh sahifa - Hi-Fi.html">${T('home')}</a><span class="sep">/</span><a href="yangiliklar.html">${T('nav_news')}</a><span class="sep">/</span><span>${n.category?Site.esc(Site.mlGet(n.category)):T('search_k_news')}</span></div>
        <h1>${Site.esc(Site.mlGet(n.title))}</h1>
      </div></div>
      <section class="block"><div class="wrap"><div class="article">
        <div class="meta">${n.category?`<span class="tag">${Site.esc(Site.mlGet(n.category))}</span>`:''}<span class="dt mono muted">${Site.fmtDate(n.date)}</span><span class="dt mono muted" id="viewct" style="display:inline-flex;align-items:center;gap:6px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" style="width:15px;height:15px"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg><b id="viewn">·</b> ${T('views_label')}</span></div>
        ${standfirst}
        ${n.cover?`<div class="hero-img"><img src="${Site.safeUrl(n.cover)}" alt=""></div>`:''}
        <div class="content">${body}</div>
        <div class="act-row" id="actRow">
          <button class="act-btn" data-act="print"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>${T('act_print')}</button>
          <button class="act-btn" data-act="link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg><span data-lbl>${T('act_link')}</span></button>
          <button class="act-btn" data-act="share"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>${T('act_share')}</button>
        </div>
        ${printFoot}
      </div></div></section>
      ${related.length?`<section class="block related-sec" style="padding-top:0"><div class="wrap">
        <div class="sec-head"><div><div class="kicker">${T('read_again')}</div><h2>${T('related_news')}</h2></div><a class="arrow-link" href="yangiliklar.html">${T('view_all')} →</a></div>
        <div class="cards">${related.map(r=>`
          <a class="ncard rv" href="yangilik.html?id=${r.id}">
            <div class="img ph">${r.cover?`<img src="${Site.safeUrl(r.cover)}" alt="">`:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m3 17 5-4 4 3 3-3 6 5"/></svg>`}
              ${r.category?`<span class="tag">${Site.esc(Site.mlGet(r.category))}</span>`:''}
              <div class="ovl"><h3>${Site.esc(Site.mlGet(r.title))}</h3></div>
            </div>
            <div class="body"><span class="dt">${Site.fmtDate(r.date)}</span></div>
          </a>`).join('')}</div>
      </div></section>`:''}`;
    Site.initReveal();
    // ko'rishlar sonini sanaymiz (har ochilganda +1) va ko'rsatamiz
    Store.bumpView('news', n.id, function(c){ var el=document.getElementById('viewn'); if(el) el.textContent = c; });
    // action buttons: chop etish / havola / ulashish
    (function(){
      var row=document.getElementById('actRow'); if(!row) return;
      var title=Site.mlGet(n.title), url=location.href;
      row.querySelector('[data-act=print]').onclick=function(){
        var metaHtml = (n.category?'<span class="tag">'+Site.esc(Site.mlGet(n.category))+'</span>':'')+'<span>'+Site.fmtDate(n.date)+'</span>';
        Site.printDoc({ title:title, meta:metaHtml, lead: excerpt?Site.esc(excerpt):'', image:n.cover||'', content: body });
      };
      row.querySelector('[data-act=link]').onclick=function(){
        var btn=this, lbl=btn.querySelector('[data-lbl]'), old=lbl.textContent;
        function done(){ btn.classList.add('copied'); lbl.textContent=T('link_copied'); setTimeout(function(){ btn.classList.remove('copied'); lbl.textContent=old; },1800); }
        if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(done,done); }
        else { var t=document.createElement('textarea'); t.value=url; document.body.appendChild(t); t.select(); try{document.execCommand('copy');}catch(e){} t.remove(); done(); }
      };
      row.querySelector('[data-act=share]').onclick=function(){
        if(navigator.share){ navigator.share({title:title, url:url}).catch(function(){}); }
        else { window.open('https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(title),'_blank'); }
      };
    })();
  }});
