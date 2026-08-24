/* tadbir.html — bitta voqeaning DOIMIY sahifasi (`tadbir.html?id=...`).

   Nega kerak (2026-08-19): ilgari voqealar faqat ro'yxatlarda ko'rinardi va
   admin yozgan tavsif 150 belgida kesilardi — ya'ni matn hech qachon to'liq
   o'qilmasdi. Rasmiy veb-saytda esa har bir tadbir uchun doimiy, havola
   qilinadigan va chop etiladigan sahifa bo'lishi kerak: sana, boshlanish
   vaqti, manzil, turi va to'liq bayon bir joyda tursin.

   Tuzilishi sharh.html (page-sharh.js) bilan ataylab bir xil: bir xil
   `.article`, `.act-row`, chop etish sarlavhasi va "ko'rishlar" hisoblagichi —
   tashrifchi uchun sayt bo'ylab bitta o'qish tajribasi. */
Site.initPage({ active: 'events', render(){
  const T = Site.t, esc = Site.esc, ml = Site.mlGet;
  const main = document.getElementById('main');
  const id = Site.qs('id');
  const ev = id ? Store.find('events', id) : null;

  // E'lon qilinmagan voqea ommaviy API'ga tushmaydi, lekin havola eskirgan
  // bo'lishi mumkin — shu sababli "topilmadi" holati ham qamrab olinadi.
  if(!ev || ev.status !== 'published'){
    main.innerHTML = `<div class="page-banner"><div class="wrap">
        <div class="crumb">${Site.crumbHTML('tadbirlar.html')}</div>
        <h1>${esc(T('not_found_t'))}</h1>
      </div></div>
      <section class="block"><div class="wrap"><div class="empty">
        <div class="t">${esc(T('not_found_t'))}</div>
        <div class="mt-20"><a class="btn outline" href="tadbirlar.html">← ${esc(T('nav_happenings'))}</a></div>
      </div></div></section>`;
    return;
  }

  const title = ml(ev.title);
  const kind  = Site.eventKind(ev.type);          // qaysi bo'limga tegishli
  const backHref = kind ? kind.page : 'tadbirlar.html';
  const backLbl  = kind ? T(kind.tk) : T('nav_happenings');
  const typeLbl  = ml(ev.type);
  const loc      = ml(ev.location);
  const bodyHtml = (ml(ev.body) || '').trim();
  document.title = title + ' — ' + Site.shortName();

  // "Bugun" / "Tez orada" belgisi — ro'yxatlardagi bilan bir xil qoida.
  const now = new Date(); now.setHours(0,0,0,0);
  const diff = ev.date ? Math.round((new Date(ev.date) - now) / 86400000) : null;
  let badge = '';
  if (diff === 0) badge = `<span class="ev-soon">${esc(T('ev_today'))}</span>`;
  else if (diff > 0 && diff <= 7) badge = `<span class="ev-soon">${esc(T('ev_soon'))}</span>`;

  const ICO = {
    cal:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/></svg>',
    pin:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    tag:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 11V4h7l11 11-7 7z"/><circle cx="7.5" cy="7.5" r="1.4"/></svg>'
  };
  // Rasmiy sahifada asosiy ma'lumotlar bir qarashda ko'rinishi kerak — shuning
  // uchun ular matn ichida emas, alohida "faktlar" jadvalida turadi.
  const fact = (ico, label, value) => value
    ? `<div class="evf"><div class="evf-i">${ico}</div><div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div></div>` : '';
  const facts = fact(ICO.cal, T('ev_when'), Site.fmtDate(ev.date))
              + fact(ICO.clock, T('ev_time_l'), ev.time)
              + fact(ICO.pin, T('ev_where'), loc)
              + fact(ICO.tag, T('ev_type_l'), typeLbl);

  const printHead = Site.printHeadHTML();
  const printFoot = Site.printFootHTML();

  /* ---------- Rasm slayderi (2026-08-20) ----------
     Voqeaga 10 tagacha rasm biriktiriladi (`events.photos`). Bitta rasm bo'lsa
     oddiy surat, bir nechtasi bo'lsa — yon strelka, nuqta va barmoq bilan
     surish (swipe) ishlaydigan slayder. Rasm bosilsa to'liq ekranda ochiladi.
     Muqova (`cover`) alohida maydon: agar to'plamda bo'lmasa, birinchi
     bo'lib qo'shiladi — admin muqova qo'yib, rasm to'plamini bo'sh qoldirsa
     ham sahifa avvalgidek ko'rinadi. */
  const photos = (Array.isArray(ev.photos) ? ev.photos : [])
    .map(p => (p && p.url) || '').filter(Boolean);
  if (ev.cover && photos.indexOf(ev.cover) < 0) photos.unshift(ev.cover);

  const sliderHTML = !photos.length ? '' : (photos.length === 1
    ? `<div class="hero-img"><img src="${Site.safeUrl(photos[0])}" alt=""></div>`
    : `<div class="ev-slider" id="evSlider">
        <div class="evs-view">
          <div class="evs-track" data-track>${photos.map(u =>
            `<div class="evs-slide"><img src="${Site.safeUrl(u)}" alt="" loading="lazy"></div>`).join('')}</div>
          <button type="button" class="evs-nav evs-prev" data-prev aria-label="${esc(T('ev_photo_prev'))}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button type="button" class="evs-nav evs-next" data-next aria-label="${esc(T('ev_photo_next'))}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <span class="evs-count" data-count>1 / ${photos.length}</span>
        </div>
        <div class="evs-dots" data-dots>${photos.map((_, i) =>
          `<button type="button" class="evs-dot${i ? '' : ' on'}" data-go="${i}" aria-label="${i + 1}"></button>`).join('')}</div>
      </div>`);

  // Shu bo'limdagi boshqa voqealar — sanaga eng yaqinlari
  const related = Store.all('events')
    .filter(x => x.status === 'published' && x.id !== ev.id)
    .filter(x => { const k = Site.eventKind(x.type); return kind ? (k && k.id === kind.id) : true; })
    .sort((a,b) => Math.abs(new Date(a.date) - new Date(ev.date)) - Math.abs(new Date(b.date) - new Date(ev.date)))
    .slice(0,3);

  main.innerHTML = `${printHead}
    <div class="page-banner"><div class="wrap">
      <div class="crumb">${Site.crumbHTML(backHref)}</div>
      <h1>${esc(title)}</h1>
    </div></div>
    <section class="block"><div class="wrap"><div class="article">
      <div class="meta">${typeLbl ? `<span class="tag">${esc(typeLbl)}</span>` : ''}${badge}<span class="dt mono muted">${esc(Site.fmtDate(ev.date))}</span><span class="dt mono muted vct-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="ico-15"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg><b id="viewn">·</b> ${esc(T('views_label'))}</span></div>
      ${sliderHTML}
      <dl class="ev-facts">${facts}</dl>
      <div class="content">${bodyHtml || '<p class="muted">' + esc(T('soon_text')) + '</p>'}</div>
      <div class="act-row" id="actRow">
        <button class="act-btn" data-act="ics"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4M9 14h6M12 11v6"/></svg>${esc(T('ev_ics'))}</button>
        <button class="act-btn" data-act="print"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>${esc(T('act_print'))}</button>
        <button class="act-btn" data-act="link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg><span data-lbl>${esc(T('act_link'))}</span></button>
        <button class="act-btn" data-act="share"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>${esc(T('act_share'))}</button>
      </div>
      ${printFoot}
    </div></div></section>
    ${related.length ? `<section class="block related-sec pt0"><div class="wrap">
      <div class="sec-head"><div><h2>${esc(T('ev_related'))}</h2></div><a class="arrow-link" href="${backHref}">${esc(T('view_all'))} →</a></div>
      <div class="ev-list">${related.map(r => {
        const d = Site.dayMonth(r.date), yy = String(r.date || '').split('-')[0] || '';
        return `<a class="ev-card rv" href="tadbir.html?id=${encodeURIComponent(r.id)}">
          <div class="ev-cal"><span class="dd">${esc(d.dd || '—')}</span><span class="mm">${esc(d.mm || '')}</span>${yy ? `<span class="yy">${esc(yy)}</span>` : ''}</div>
          <div class="ev-cbody"><h3>${esc(ml(r.title))}</h3>
            <div class="ev-meta">${r.time ? `<span>${ICO.clock}${esc(r.time)}</span>` : ''}${ml(r.location) ? `<span>${ICO.pin}${esc(ml(r.location))}</span>` : ''}</div>
          </div></a>`;
      }).join('')}</div>
    </div></section>` : ''}`;

  Site.initReveal();
  Store.bumpView('events', ev.id, function(c){ const el = document.getElementById('viewn'); if(el) el.textContent = c; });

  /* ---- slayder harakati ----
     Sof CSS transform bilan: `translateX(-i * 100%)`. Kutubxona yo'q.
     CSP eslatmasi: inline `style=""` bloklangan, lekin `el.style.x = ...`
     (CSSOM) ruxsat etilgan — site-common.js dagi banner ham shunday ishlaydi. */
  (function initSlider(){
    const box = document.getElementById('evSlider');
    if (!box) return;
    const track = box.querySelector('[data-track]');
    const dots  = [...box.querySelectorAll('[data-go]')];
    const cnt   = box.querySelector('[data-count]');
    const n = dots.length;
    let i = 0;

    function show(k){
      i = (k + n) % n;
      track.style.transform = 'translateX(' + (-i * 100) + '%)';
      dots.forEach((d, x) => d.classList.toggle('on', x === i));
      if (cnt) cnt.textContent = (i + 1) + ' / ' + n;
    }
    box.querySelector('[data-prev]').onclick = () => show(i - 1);
    box.querySelector('[data-next]').onclick = () => show(i + 1);
    dots.forEach((d, x) => { d.onclick = () => show(x); });

    // Klaviatura: slayder ko'rinib turganda chap/o'ng strelkalar ishlaydi
    document.addEventListener('keydown', (e) => {
      if (document.querySelector('.evfs.open')) return;   // to'liq ekran o'zi boshqaradi
      if (e.key === 'ArrowLeft') show(i - 1);
      else if (e.key === 'ArrowRight') show(i + 1);
    });

    // Barmoq bilan surish. 40px dan kam siljish — bosish deb hisoblanadi
    // (aks holda rasmni ochmoqchi bo'lgan odam slaydni surib yuborardi).
    let x0 = null, dx = 0;
    const view = box.querySelector('.evs-view');
    view.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; dx = 0; }, { passive: true });
    view.addEventListener('touchmove',  (e) => { if (x0 !== null) dx = e.touches[0].clientX - x0; }, { passive: true });
    view.addEventListener('touchend',   () => {
      if (x0 !== null && Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });

    /* To'liq ekran ko'rish. Overlay HTML'da EMAS — kerak bo'lganda yasaladi:
       rasmsiz voqealarda bekorga DOM band qilmaydi. */
    let fs = null;
    function openFs(){
      if (!fs) {
        fs = document.createElement('div');
        fs.className = 'evfs';
        fs.innerHTML = '<button type="button" class="evfs-x" aria-label="' + esc(T('close')) + '">'
          + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'
          + '<img alt="">';
        document.body.appendChild(fs);
        fs.querySelector('.evfs-x').onclick = closeFs;
        fs.onclick = (e) => { if (e.target === fs) closeFs(); };
      }
      fs.querySelector('img').src = box.querySelectorAll('.evs-slide img')[i].src;
      fs.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeFs(){
      if (!fs) return;
      fs.classList.remove('open');
      fs.querySelector('img').removeAttribute('src');   // xotirani bo'shatamiz
      document.body.style.overflow = '';
    }
    box.querySelectorAll('.evs-slide img').forEach(im => { im.onclick = openFs; });
    document.addEventListener('keydown', (e) => {
      if (!fs || !fs.classList.contains('open')) return;
      if (e.key === 'Escape') closeFs();
      else if (e.key === 'ArrowLeft')  { show(i - 1); openFs(); }
      else if (e.key === 'ArrowRight') { show(i + 1); openFs(); }
    });
  })();

  /* ---- amal tugmalari ---- */
  const row = document.getElementById('actRow');
  const url = location.href;

  /* "Taqvimga qo'shish" — .ics fayli brauzerda YASALADI (server kerak emas).
     Rasmiy tadbir sahifalarining odatiy elementi: tashrifchi sanani qo'lda
     ko'chirmaydi. Vaqt zonasi ko'rsatilmaydi — voqea mahalliy vaqtda bo'ladi
     va ko'pchilik taqvim ilovasi zonasiz qiymatni o'z zonasida ochadi. */
  row.querySelector('[data-act=ics]').onclick = function(){
    const pad = (n) => String(n).padStart(2, '0');
    const d = String(ev.date || '').replace(/-/g, '');
    if(!d) return;
    const hm = /^(\d{1,2}):(\d{2})/.exec(ev.time || '');
    const start = hm ? d + 'T' + pad(hm[1]) + hm[2] + '00' : d;
    // Vaqti ko'rsatilmagan voqea — kun bo'yi (DTEND ertangi kun)
    let endLine;
    if(hm){
      const e = new Date(Number(d.slice(0,4)), Number(d.slice(4,6)) - 1, Number(d.slice(6,8)), Number(hm[1]) + 2, Number(hm[2]));
      endLine = 'DTEND:' + e.getFullYear() + pad(e.getMonth()+1) + pad(e.getDate()) + 'T' + pad(e.getHours()) + pad(e.getMinutes()) + '00';
    } else {
      const e = new Date(Number(d.slice(0,4)), Number(d.slice(4,6)) - 1, Number(d.slice(6,8)) + 1);
      endLine = 'DTEND;VALUE=DATE:' + e.getFullYear() + pad(e.getMonth()+1) + pad(e.getDate());
    }
    // iCalendar matnida ; , \ va yangi qator qochiriladi (RFC 5545)
    const ics = (v) => String(v || '').replace(/\\/g, '\\\\').replace(/[;,]/g, m => '\\' + m).replace(/\r?\n/g, '\\n');
    const plain = bodyHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600);
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TSTM//Voqealar//UZ', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + ev.id + '@tstm',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''),
      (hm ? 'DTSTART:' + start : 'DTSTART;VALUE=DATE:' + start),
      endLine,
      'SUMMARY:' + ics(title),
      loc ? 'LOCATION:' + ics(loc) : '',
      plain ? 'DESCRIPTION:' + ics(plain) : '',
      'URL:' + ics(url),
      'END:VEVENT', 'END:VCALENDAR'
    ].filter(Boolean);
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60) || 'voqea') + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  row.querySelector('[data-act=print]').onclick = function(){
    const metaHtml = (typeLbl ? '<span class="tag">' + esc(typeLbl) + '</span>' : '')
                   + '<span>' + esc(Site.fmtDate(ev.date)) + (ev.time ? ', ' + esc(ev.time) : '') + '</span>'
                   + (loc ? '<span>' + esc(loc) + '</span>' : '');
    Site.printDoc({ title: title, meta: metaHtml, image: ev.cover || '', content: bodyHtml });
  };

  row.querySelector('[data-act=link]').onclick = function(){
    const btn = this, lbl = btn.querySelector('[data-lbl]'), old = lbl.textContent;
    const done = () => { btn.classList.add('copied'); lbl.textContent = T('link_copied'); setTimeout(() => { btn.classList.remove('copied'); lbl.textContent = old; }, 1800); };
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(done, done); }
    else { const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); try{ document.execCommand('copy'); }catch{} t.remove(); done(); }
  };

  row.querySelector('[data-act=share]').onclick = function(){
    if(navigator.share){ navigator.share({ title: title, url: url }).catch(function(){}); }
    else { window.open('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(title), '_blank'); }
  };
}});
