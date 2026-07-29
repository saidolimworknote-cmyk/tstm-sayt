/* nashr.html sahifasining skripti.
   Ilgari HTML ichida inline turardi. CSP 'unsafe-inline' siz ishlashi uchun
   alohida faylga ko'chirildi — sahifada faqat <script src> qoladi. */
  Site.initPage({ active:'pubs', render(){
    const T = Site.t;
    const id = Site.qs('id');
    const p = id ? Store.find('publications', id) : null;
    const main = document.getElementById('main');
    if(!p || p.status!=='published'){
      main.innerHTML = `<div class="page-banner"><div class="wrap"><div class="crumb"><a href="Bosh sahifa - Hi-Fi.html">${T('home')}</a><span class="sep">/</span><a href="nashrlar.html">${T('nav_pubs')}</a></div><h1>${T('not_found_t')}</h1></div></div>
        <section class="block"><div class="wrap"><div class="empty"><div class="t">${T('not_found_t')}</div><div style="margin-top:20px"><a class="btn outline" href="nashrlar.html">← ${T('all_pubs')}</a></div></div></div></section>`;
      return;
    }
    // Banner/brauzer sarlavhasida qisqa (displey) sarlavha, sahifa ichida to'liq nomi.
    const fullTitle = Site.mlGet(p.title);
    const dispT = Site.dispTitle(p);
    // To'liq nomni alohida blokda ko'rsatamiz: qisqa sarlavha yozilgan bo'lsa (banner
    // undan farq qiladi) YOKI sarlavha bannerga sig'maydigan darajada uzun bo'lsa
    // (2 qator ≈ 68 belgi — .page-banner.tight cheklovi) — matn hech qachon yo'qolmaydi.
    const showFull = fullTitle !== dispT || fullTitle.length > 68;
    document.title = dispT + ' — TSTM';
    const I = Site.ICON;
    // chop etish uchun: rasmiy sarlavha (idora nomi) + manba/sana footeri
    const printHead = `<div class="print-head"><img src="logo-mark.png" alt=""><div class="ph-txt"><b>${Site.esc(T('org_name'))}</b><span>${Site.esc(T('org_tagline'))}</span></div></div>`;
    const printFoot = `<div class="print-foot"><span>${Site.esc(T('print_source'))}: ${Site.esc(location.href)}</span><span>${Site.esc(T('print_date'))}: ${Site.fmtDate(new Date().toISOString().slice(0,10))}</span></div>`;
    const desc = Site.mlGet(p.desc) || '<p class="muted">'+Site.esc(T('soon_text'))+'</p>';
    const phSvg = `<div class="ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/></svg></div>`;
    const dlBtn = p.pdf
      ? `<a class="btn dlbtn" href="${Site.safeUrl(p.pdf)}" download><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" stroke-linecap="round" stroke-linejoin="round"/></svg>${T('download_pdf')}</a>`
      : `<button class="btn outline dlbtn" disabled style="opacity:.6;cursor:default">${T('soon')}</button>`;
    const meta = [
      p.type ? {k:T('pub_type'), v:Site.mlGet(p.type)} : null,
      p.category ? {k:T('pub_dir'), v:Site.mlGet(p.category)} : null,
      p.year ? {k:T('pub_year'), v:p.year} : null
    ].filter(Boolean);

    // Muallif imzosi — maqola OXIRIDA, o'ngda. Maydonga ism-familiya va unvon
    // birga yoziladi (masalan "Daria Gorelkina, bosh ilmiy xodim"), shuning uchun
    // uni bo'lmasdan bir butun matn sifatida chiqaramiz.
    const byline = p.author
      ? `<div class="pub-byline"><span class="lab">${Site.esc(T('f_author'))}</span><span class="nm">${Site.esc(p.author)}</span></div>`
      : '';
    // Chop etish hujjatida ham xuddi shu imzo bo'lsin (printDoc'ning o'z CSS'i bor —
    // shuning uchun bu yerda inline uslub bilan beriladi).
    const bylinePrint = p.author
      ? `<div style="margin-top:22px;padding-top:12px;border-top:1px solid #ccc;text-align:right">`
        + `<div style="font-family:'IBM Plex Mono',monospace;font-size:8.5pt;letter-spacing:.12em;text-transform:uppercase;color:#555;margin-bottom:5px">${Site.esc(T('f_author'))}</div>`
        + `<div style="font-family:'Spectral',Georgia,serif;font-size:12pt;color:#000">${Site.esc(p.author)}</div></div>`
      : '';

    // related (same category)
    const related = Store.all('publications').filter(x=>x.status==='published' && x.id!==p.id && (!p.category || x.category===p.category))
      .sort((a,b)=>String(b.year||'').localeCompare(String(a.year||''))).slice(0,3);

    main.innerHTML = `${printHead}
      <div class="page-banner tight${showFull?' has-full':''}"><div class="wrap">
        <div class="crumb"><a href="Bosh sahifa - Hi-Fi.html">${T('home')}</a><span class="sep">/</span><a href="nashrlar.html">${T('nav_pubs')}</a><span class="sep">/</span><span>${p.category?Site.esc(Site.mlGet(p.category)):Site.esc(T('search_k_pub'))}</span></div>
        <h1>${Site.esc(dispT)}</h1>
        ${showFull?`<div class="ptitle">${Site.esc(fullTitle)}</div>`:''}
      </div></div>
      <section class="block"><div class="wrap"><div class="pub-detail">
        <div>
          <div class="cov">${p.type?`<span class="badge">${Site.esc(Site.mlGet(p.type))}</span>`:''}${p.cover?`<img src="${p.cover}" alt="">`:phSvg}</div>
          ${dlBtn}
          ${meta.length?`<div class="metalist">${meta.map(m=>`<div class="r"><span class="k">${Site.esc(m.k)}</span><span class="v">${Site.esc(m.v)}</span></div>`).join('')}</div>`:''}
        </div>
        <div>
          ${showFull?`<div class="full-title">
            <div class="ft-lab">${Site.esc(T('pub_fulltitle'))}</div>
            <h2>${Site.esc(fullTitle)}</h2>
          </div>`:''}
          <div class="kicker" style="margin-bottom:18px">${T('pub_about')}</div>
          <div class="prose">${desc}</div>
          ${byline}
          <div class="act-row" id="actRow">
            <button class="act-btn" data-act="print"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>${T('act_print')}</button>
            <button class="act-btn" data-act="link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg><span data-lbl>${T('act_link')}</span></button>
            <button class="act-btn" data-act="share"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>${T('act_share')}</button>
          </div>
          ${printFoot}
        </div>
      </div></div></section>
      ${related.length?`<section class="block related-sec" style="padding-top:0"><div class="wrap">
        <div class="sec-head"><div><div class="kicker">${T('read_again')}</div><h2>${T('related_pubs')}</h2></div><a class="arrow-link" href="nashrlar.html">${T('view_all')||'Barchasi'} →</a></div>
        <div class="pub-grid">${related.map(r=>`
          <a class="pub rv" href="nashr.html?id=${r.id}" style="cursor:pointer">
            <div class="cover">${r.type?`<span class="badge">${Site.esc(Site.mlGet(r.type))}</span>`:''}${r.cover?`<img src="${r.cover}" alt="">`:phSvg}</div>
            <div class="body"><div class="t">${Site.esc(Site.mlGet(r.category||''))}${r.year?' · '+Site.esc(r.year):''}</div><h3>${Site.esc(Site.dispTitle(r))}</h3></div>
          </a>`).join('')}</div>
      </div></section>`:''}`;
    Site.initReveal();
    (function(){
      var row=document.getElementById('actRow'); if(!row) return;
      // Chop etishda rasmiy hujjat kerak — TO'LIQ nom; ulashishda esa ixcham displey nomi.
      var title=dispT, url=location.href;
      row.querySelector('[data-act=print]').onclick=function(){
        var metaHtml = meta.map(function(m){ return '<span>'+Site.esc(m.k)+': '+Site.esc(m.v)+'</span>'; }).join('');
        Site.printDoc({ title:fullTitle, meta:metaHtml, image:p.cover||'', content: desc + bylinePrint });
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
