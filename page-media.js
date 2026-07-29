/* media.html sahifasining skripti.
   Ilgari HTML ichida inline turardi. CSP 'unsafe-inline' siz ishlashi uchun
   alohida faylga ko'chirildi — sahifada faqat <script src> qoladi. */
  Site.initPage({ active:'media', render(){
    const T = Site.t, esc = Site.esc, ml = Site.mlGet, safeUrl = Site.safeUrl;
    // Lightbox rasmi — HTML matni orqali emas, DOM orqali quriladi.
    const imgEl = (src)=>{ const im = document.createElement('img'); im.src = src || ''; im.alt = ''; return im; };
    const s = Site.settings();
    const gal = document.getElementById('gal');
    const tabsEl = document.getElementById('tabs');
    const kickerEl = document.getElementById('mKicker');
    const countEl = document.getElementById('mCount');
    let tab = Site.qs('tab') || 'photo';
    let albumId = Site.qs('album') || '';
    const fmtDate = (d)=>{ if(!d) return ''; const p=String(d).slice(0,10).split('-'); return p.length===3 ? p[2]+'.'+p[1]+'.'+p[0] : d; };

    // ---- lightbox ----
    const lb = document.getElementById('lb'), lbBody = document.getElementById('lbBody');
    function closeLb(){ lb.classList.remove('open'); lbBody.innerHTML=''; }
    document.getElementById('lbClose').onclick = closeLb;
    lb.onclick = (e)=>{ if(e.target===lb) closeLb(); };
    document.addEventListener('keydown', e=>{ if(e.key==='Escape' && lb.classList.contains('open')) closeLb(); });
    const ytId = (u)=>{ const m=String(u||'').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/); return m?m[1]:''; };

    // ---- kategoriyalar ----
    const TYPES = [
      { t:'photo', tk:'nav_media_photo', empty:'m_empty_photo' },
      { t:'video', tk:'nav_media_video', empty:'m_soon_video' },
      { t:'info',  tk:'nav_media_info',  empty:'m_soon_info'  }
    ];
    const EMPTY_ICON = {
      photo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m3 17 5-4 4 3 3-3 6 5"/></svg>',
      video:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none"/></svg>',
      info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 16v-3M12 16V9M16 16v-5" stroke-linecap="round"/></svg>'
    };
    const BACK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>';
    const CAM_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m3 17 5-4 4 3 3-3 6 5"/></svg>';

    const all = Store.all('media');
    const byType = (t) => all.filter(m => (m.type||'photo')===t);

    // ---- foto albomlari (isrs.uz uslubi) ----
    // Haqiqiy `type:'album'` yozuvlar + eskirgan tekis `type:'photo'` rasmlar bitta "Umumiy suratlar" albomiga jamlanadi.
    function getAlbums(){
      const arr = all.filter(m=>m.type==='album').map(a=>{
        const photos = Array.isArray(a.photos) ? a.photos : [];
        return { id:a.id, title:a.title||{}, date:a.date||'', photos, cover: a.cover || (photos[0]&&photos[0].url) || '' };
      });
      const loose = all.filter(m => (m.type||'photo')==='photo');
      if(loose.length){
        arr.push({ id:'__loose', title:{uz:'Umumiy suratlar',ru:'Общие фотографии',en:'General photos'}, date:'',
          photos: loose.map(m=>({url:m.url, title:m.title||{}})), cover: loose[0].url });
      }
      return arr;
    }

    // ---- filtr chiplar (kategoriya + son) ----
    tabsEl.innerHTML = TYPES.map(x=>{
      const n = x.t==='photo' ? getAlbums().length : byType(x.t).length;
      return `<button class="fchip${x.t===tab?' on':''}" type="button" data-t="${x.t}">${esc(T(x.tk))}<span class="fc-n">${n}</span></button>`;
    }).join('');

    function empty(type){
      const meta = TYPES.find(x=>x.t===type) || TYPES[0];
      gal.innerHTML = `<div class="empty" style="grid-column:1/-1">${EMPTY_ICON[type]||EMPTY_ICON.photo}<div class="t">${esc(T(meta.empty))}</div></div>`;
    }

    function draw(){
      tabsEl.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b.dataset.t===tab));
      const meta = TYPES.find(x=>x.t===tab) || TYPES[0];
      kickerEl.textContent = T(meta.tk);

      if(tab==='photo'){ drawPhotos(); return; }

      const items = byType(tab);
      countEl.textContent = items.length;
      if(!items.length){ empty(tab); return; }

      if(tab==='video'){
        // YouTube havola — tayyor video ko'rinadi, bosilganda O'SHA JOYNING O'ZIDA (inline) ijro
        gal.innerHTML = items.map(m=>{
          const id=ytId(m.url); const th=m.thumb || (id?`https://img.youtube.com/vi/${id}/hqdefault.jpg`:'');
          return `<div class="gtile rv" data-vid="${id}" data-title="${esc(ml(m.title)||'')}">${th?`<img src="${safeUrl(th)}" alt="">`:''}<div class="play"><span><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z"/></svg></span></div>${ml(m.title)?`<div class="vt">${esc(ml(m.title))}</div>`:''}</div>`;
        }).join('');
        gal.querySelectorAll('.gtile').forEach(t=> t.onclick=()=>{
          const id=t.dataset.vid; if(!id || t.classList.contains('playing')) return;
          t.classList.add('playing');
          // MUHIM: dataset qiymatlari HTML matniga QAYTA qo'shilmaydi. `data-*` ni
          // yozganda esc() qilingan, lekin `t.dataset.title` uni DEKODLANGAN holda
          // qaytaradi — innerHTML shabloniga tashlansa qo'shtirnoq atributdan chiqib
          // ketardi. Shuning uchun elementni DOM orqali quramiz (parser ishlamaydi).
          const fr = document.createElement('iframe');
          fr.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1&color=white';
          fr.title = t.dataset.title || '';
          fr.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
          fr.allowFullscreen = true;
          t.replaceChildren(fr);
        });
      } else if(tab==='info'){
        // interaktiv infografika (HTML) yoki eski statik rasm
        gal.innerHTML = items.map(m=>{
          const t = ml(m.title)||m.name||'';
          if(m.kind==='html' || /\.html?$/i.test(m.url||'')){
            return `<div class="gtile info-card rv" data-html="${esc(m.url)}" data-title="${esc(t)}">
              <div class="ic-inner">
                <svg class="ic-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 16v-3M12 16V9M16 16v-5" stroke-linecap="round"/></svg>
                <div class="ic-k">${esc(T('m_interactive'))}</div>
                <div class="ic-t">${esc(t)}</div>
                <div class="ic-open">${esc(T('m_open'))} <span aria-hidden="true">&rarr;</span></div>
              </div></div>`;
          }
          return `<div class="gtile rv" data-src="${esc(m.url)}"><img src="${safeUrl(m.url)}" alt="${esc(t)}">${t?`<div class="vt">${esc(t)}</div>`:''}</div>`;
        }).join('');
        gal.querySelectorAll('.gtile').forEach(el=> el.onclick=()=>{
          if(el.dataset.html){
            // SANDBOX: allow-same-origin YO'Q — skript sayt origin'iga tegolmaydi.
            // src/title dataset'dan DEKODLANGAN holda keladi, shuning uchun HTML
            // matniga emas, DOM xossalariga yozamiz (yuqoridagi izohga qarang).
            const fr = document.createElement('iframe');
            fr.className = 'lb-frame tall';
            fr.src = el.dataset.html;
            fr.setAttribute('sandbox', 'allow-scripts allow-popups allow-forms allow-downloads');
            fr.referrerPolicy = 'no-referrer';
            fr.title = el.dataset.title || '';
            lbBody.replaceChildren(fr);
          } else {
            lbBody.replaceChildren(imgEl(el.dataset.src));
          }
          lb.classList.add('open');
        });
      }
      if (Site.initReveal) Site.initReveal();
    }

    // ---- foto: albom ro'yxati (kartalar) yoki albom ichidagi rasmlar ----
    function drawPhotos(){
      const albums = getAlbums();
      if(albumId){
        const al = albums.find(a=>a.id===albumId);
        if(!al){ albumId=''; drawPhotos(); return; }
        countEl.textContent = al.photos.length;
        const head = `<div class="album-head">
            <button class="album-back" type="button" id="albBack">${BACK_SVG}${esc(T('m_back_albums'))}</button>
            <div class="album-h"><h2>${esc(ml(al.title)||'')}</h2>${al.date?`<span class="album-date">${esc(fmtDate(al.date))}</span>`:''}</div>
          </div>`;
        gal.innerHTML = head + (al.photos.length
          ? al.photos.map(p=>`<div class="gtile rv" data-src="${esc(p.url)}"><img src="${safeUrl(p.url)}" alt="${esc(ml(p.title)||'')}">${ml(p.title)?`<div class="vt">${esc(ml(p.title))}</div>`:''}</div>`).join('')
          : `<div class="empty" style="grid-column:1/-1">${EMPTY_ICON.photo}<div class="t">${esc(T('m_empty_photo'))}</div></div>`);
        gal.querySelector('#albBack').onclick = ()=>{ albumId=''; pushUrl(); draw(); };
        gal.querySelectorAll('.gtile[data-src]').forEach(t=> t.onclick=()=>{ lbBody.replaceChildren(imgEl(t.dataset.src)); lb.classList.add('open'); });
      } else {
        countEl.textContent = albums.length;
        if(!albums.length){ empty('photo'); return; }
        gal.innerHTML = albums.map(a=>`<div class="gtile album rv" data-album="${esc(a.id)}">
            ${a.cover?`<img src="${safeUrl(a.cover)}" alt="${esc(ml(a.title)||'')}">`:`<div class="vthumb">${EMPTY_ICON.photo}</div>`}
            <span class="album-badge">${CAM_SVG}${a.photos.length}</span>
            <div class="vt"><span class="al-t">${esc(ml(a.title)||'')}</span>${a.date?`<span class="al-d">${esc(fmtDate(a.date))}</span>`:''}</div>
          </div>`).join('');
        gal.querySelectorAll('.gtile[data-album]').forEach(el=> el.onclick=()=>{ albumId=el.dataset.album; pushUrl(); draw(); });
      }
      if (Site.initReveal) Site.initReveal();
    }

    function pushUrl(){
      try{ const u=new URL(location.href); u.searchParams.set('tab',tab);
        if(tab==='photo'&&albumId) u.searchParams.set('album',albumId); else u.searchParams.delete('album');
        history.pushState({},'',u); }catch(e){}
    }
    window.addEventListener('popstate', ()=>{ tab=Site.qs('tab')||'photo'; albumId=Site.qs('album')||''; draw(); });

    tabsEl.querySelectorAll('button').forEach(b=> b.onclick=()=>{ tab=b.dataset.t; albumId=''; pushUrl(); draw(); });
    draw();

    // ---- matbuot xizmati ----
    const email = s.email || 'info@markaz.uz';
    const press = document.getElementById('press');
    if (press) press.innerHTML = `
      <div class="pl">
        <div class="pico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 11l16-6v14L3 13v-2Z"/><path d="M8 12.5V19l3 .8"/><path d="M19 8a3 3 0 0 1 0 8" stroke-linecap="round"/></svg></div>
        <div>
          <div class="pk">${esc(T('m_press_kicker'))}</div>
          <h2>${esc(T('m_press_title'))}</h2>
          <p>${esc(T('m_press_desc'))}</p>
        </div>
      </div>
      <div class="pcta"><a class="btn" href="mailto:${esc(email)}"><span>${esc(T('m_press_cta'))}</span> →</a></div>`;
    if (Site.initReveal) Site.initReveal();
  }});
