/* sharh.html — bitta ekspert sharhi (to'liq matn).
   Tuzilishi page-yangilik.js bilan bir xil. Farqi: ekspert/nashr qatori
   (.oav-byline) va matndan keyin "Asl manbaga o'tish" tashqi havolasi. */
  Site.initPage({ active:'oav', render(){
    const id = Site.qs('id');
    const p = id ? Store.find('mediaPosts', id) : null;
    const main = document.getElementById('main');
    const T = Site.t;
    if(!p || p.status!=='published'){
      main.innerHTML = `<div class="page-banner"><div class="wrap"><div class="crumb"><a href="Bosh sahifa - Hi-Fi.html">${T('home')}</a><span class="sep">/</span><a href="oav.html">${T('nav_hap_experts')}</a></div><h1>${T('not_found_t')}</h1></div></div>
        <section class="block"><div class="wrap"><div class="empty"><div class="t">${T('not_found_t')}</div><div class="mt-20"><a class="btn outline" href="oav.html">← ${T('all_oav')}</a></div></div></div></section>`;
      return;
    }
    document.title = Site.mlGet(p.title) + ' — TSTM';

    const bodyRaw = Site.mlGet(p.body);
    const excerpt = Site.mlGet(p.excerpt);
    const standfirst = excerpt ? `<p class="art-lead">${Site.esc(excerpt)}</p>` : '';
    // Asosiy matn to'liq anonsning nusxasi bo'lsa takrorlamaymiz (page-yangilik.js dagidek)
    const bodyText = (bodyRaw||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
    const exNorm = (excerpt||'').replace(/\s+/g,' ').trim();
    const body = (bodyRaw && !(exNorm && bodyText === exNorm)) ? bodyRaw
               : (excerpt ? '' : '<p class="muted">'+Site.esc(T('soon_text'))+'</p>');

    const ICO_MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/></svg>';
    const ICO_PERSON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>';
    const ICO_EXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';

    const byline = (p.expert || p.outlet) ? `<div class="oav-byline">
      ${p.expert?`<div>${ICO_PERSON}<span class="lab">${Site.esc(T('oav_expert'))}</span><span class="val">${Site.esc(p.expert)}</span></div>`:''}
      ${p.outlet?`<div>${ICO_MIC}<span class="lab">${Site.esc(T('oav_outlet'))}</span><span class="val">${Site.esc(p.outlet)}</span></div>`:''}
    </div>` : '';

    // safeUrl() javascript:/data: kabi xavfli sxemalarni bloklaydi — admin
    // kiritgan manzil bo'lsa ham filtrdan o'tkazamiz.
    const srcUrl = p.source ? Site.safeUrl(p.source) : '';
    const srcBtn = (srcUrl && srcUrl !== '#') ? `<a class="oav-src" href="${srcUrl}" target="_blank" rel="noopener nofollow">${ICO_EXT}${Site.esc(T('oav_source'))}</a>` : '';

    const related = Store.all('mediaPosts').filter(x=>x.status==='published' && x.id!==p.id)
      .sort((a,b)=> String(b.date||'').localeCompare(String(a.date||''))).slice(0,3);

    const printHead = `<div class="print-head"><img src="${Site.safeUrl(Site.brandLogo())}" alt=""><div class="ph-txt"><b>${Site.esc(T('org_name'))}</b><span>${Site.esc(T('org_tagline'))}</span></div></div>`;
    // Brauzerning o'z chop etishi (Ctrl+P) uchun footer. Asl nashr havolasi
    // shu yerda ham bo'lsin — qog'ozda tugmani bosib bo'lmaydi.
    const printFoot = `<div class="print-foot"><span>${Site.esc(T('print_source'))}: ${Site.esc(location.href)}</span>${
      srcUrl ? `<span>${Site.esc(T('print_orig'))}: ${Site.esc(p.source)}</span>` : ''
    }<span>${Site.esc(T('print_date'))}: ${Site.fmtDate(new Date().toISOString().slice(0,10))}</span></div>`;

    main.innerHTML = `${printHead}
      <div class="page-banner"><div class="wrap">
        <div class="crumb"><a href="Bosh sahifa - Hi-Fi.html">${T('home')}</a><span class="sep">/</span><a href="oav.html">${T('nav_hap_experts')}</a>${p.outlet?`<span class="sep">/</span><span>${Site.esc(p.outlet)}</span>`:''}</div>
        <h1>${Site.esc(Site.mlGet(p.title))}</h1>
      </div></div>
      <section class="block"><div class="wrap"><div class="article">
        <div class="meta">${p.category?`<span class="tag">${Site.esc(Site.mlGet(p.category))}</span>`:''}<span class="dt mono muted">${Site.fmtDate(p.date)}</span><span class="dt mono muted vct-badge" id="viewct"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="ico-15"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg><b id="viewn">·</b> ${T('views_label')}</span></div>
        ${byline}
        ${standfirst}
        ${p.cover?`<div class="hero-img"><img src="${Site.safeUrl(p.cover)}" alt=""></div>`:''}
        <div class="content">${body}</div>
        ${srcBtn}
        <div class="act-row" id="actRow">
          <button class="act-btn" data-act="print"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>${T('act_print')}</button>
          <button class="act-btn" data-act="link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg><span data-lbl>${T('act_link')}</span></button>
          <button class="act-btn" data-act="share"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>${T('act_share')}</button>
        </div>
        ${printFoot}
      </div></div></section>
      ${related.length?`<section class="block related-sec pt0"><div class="wrap">
        <div class="sec-head"><div><div class="kicker">${T('read_again')}</div><h2>${T('related_oav')}</h2></div><a class="arrow-link" href="oav.html">${T('view_all')} →</a></div>
        <div class="cards">${related.map(r=>`
          <a class="ncard rv" href="sharh.html?id=${r.id}">
            <div class="img ph">${r.cover?`<img src="${Site.safeUrl(r.cover)}" alt="">`:ICO_MIC}
              ${r.outlet?`<span class="tag">${Site.esc(r.outlet)}</span>`:''}
              <div class="ovl"><h3>${Site.esc(Site.mlGet(r.title))}</h3></div>
            </div>
            <div class="body">${r.expert?`<span class="oav-exp">${Site.esc(r.expert)}</span>`:''}<span class="dt">${Site.fmtDate(r.date)}</span></div>
          </a>`).join('')}</div>
      </div></section>`:''}`;
    Site.initReveal();

    Store.bumpView('mediaPosts', p.id, function(c){ var el=document.getElementById('viewn'); if(el) el.textContent = c; });

    (function(){
      var row=document.getElementById('actRow'); if(!row) return;
      var title=Site.mlGet(p.title), url=location.href;
      row.querySelector('[data-act=print]').onclick=function(){
        // Meta qatorida faqat mavzu va sana; kim/qayerda esa alohida imzo
        // blokida (chop etilgan hujjatda bu ikkalasi eng muhim ma'lumot).
        var metaHtml = (p.category?'<span class="tag">'+Site.esc(Site.mlGet(p.category))+'</span>':'')
                     + '<span>'+Site.fmtDate(p.date)+'</span>';
        var bylineHtml = (p.expert?'<div><span class="lab">'+Site.esc(T('oav_expert'))+'</span><span class="val">'+Site.esc(p.expert)+'</span></div>':'')
                       + (p.outlet?'<div><span class="lab">'+Site.esc(T('oav_outlet'))+'</span><span class="val">'+Site.esc(p.outlet)+'</span></div>':'');
        Site.printDoc({ title:title, meta:metaHtml, byline:bylineHtml,
          lead: excerpt?Site.esc(excerpt):'', image:p.cover||'', content: body,
          sourceUrl: p.source||'' });
      };
      row.querySelector('[data-act=link]').onclick=function(){
        var btn=this, lbl=btn.querySelector('[data-lbl]'), old=lbl.textContent;
        function done(){ btn.classList.add('copied'); lbl.textContent=T('link_copied'); setTimeout(function(){ btn.classList.remove('copied'); lbl.textContent=old; },1800); }
        if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(done,done); }
        else { var t=document.createElement('textarea'); t.value=url; document.body.appendChild(t); t.select(); try{document.execCommand('copy');}catch{} t.remove(); done(); }
      };
      row.querySelector('[data-act=share]').onclick=function(){
        if(navigator.share){ navigator.share({title:title, url:url}).catch(function(){}); }
        else { window.open('https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(title),'_blank'); }
      };
    })();
  }});
