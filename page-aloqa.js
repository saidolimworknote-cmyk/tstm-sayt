/* aloqa.html sahifasining skripti.
   Ilgari HTML ichida inline turardi. CSP 'unsafe-inline' siz ishlashi uchun
   alohida faylga ko'chirildi — sahifada faqat <script src> qoladi. */
  Site.initPage({ active:'contact', render(){
    const T = Site.t, esc = Site.esc, safeUrl = Site.safeUrl;
    const s = Site.settings();
    const I = {
      pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
      mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
      phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
      clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
    };
    const addr  = Site.mlGet(s.address) || "Toshkent sh., O'zbekiston";
    const email = s.email || 'info@cfps.uz';
    const phone = s.phone || '+998 71 239 36 55';
    const rows = [
      {i:I.pin,   lab:T('footer_address'), val: addr},
      {i:I.mail,  lab:T('footer_email'),   val: email, href:'mailto:'+email},
      {i:I.phone, lab:T('footer_phone'),   val: phone, href:'tel:'+phone.replace(/\s/g,'')},
      {i:I.clock, lab:T('c_hours'),        val: T('c_hours_v')}
    ];
    document.getElementById('cinfo').innerHTML = rows.map(r=>{
      const v = r.href ? `<a class="val" href="${safeUrl(r.href)}">${esc(r.val)}</a>` : `<div class="val">${esc(r.val)}</div>`;
      return `<div class="crow"><div class="ci">${r.i}</div><div><div class="lab">${esc(r.lab)}</div>${v}</div></div>`;
    }).join('');

    // ijtimoiy tarmoqlar (sozlamalarda "#"/bo'sh bo'lmaganlari)
    const soc = s.social || {}, SI = Site.ICON;
    const links = [
      {u:soc.telegram, i:SI.tg, n:'Telegram'},
      {u:soc.youtube,  i:SI.yt, n:'YouTube'},
      {u:soc.facebook, i:SI.fb, n:'Facebook'},
      {u:soc.x,        i:SI.x,  n:'X'}
    ].filter(l => l.u && l.u !== '#');
    const cs = document.getElementById('csocial');
    if (cs) cs.innerHTML = links.map(l=>`<a href="${esc(l.u)}" target="_blank" rel="noopener" aria-label="${esc(l.n)}" title="${esc(l.n)}">${l.i}</a>`).join('');

    // xarita paneli: manzil
    const ma = document.getElementById('mapAddr'); if (ma) ma.textContent = addr;

    // xarita: admin sozlamasidagi "xarita joyi" (koordinata afzal — aniq pin). Bo'sh bo'lsa standart.
    (function(){
      const DEF = '41.310961,69.246750';
      const mq  = (s.mapQuery != null && String(s.mapQuery).trim() !== '') ? String(s.mapQuery).trim() : DEF;
      const enc = encodeURIComponent(mq);
      const lang = (window.I18N ? I18N.lang : 'uz');
      const frame = document.getElementById('mapFrame');
      const open  = document.getElementById('mapOpen');
      if (frame){ frame.src = 'https://www.google.com/maps?q='+enc+'&hl='+lang+'&z=17&output=embed'; frame.title = addr || mq; }
      if (open)   open.href = 'https://www.google.com/maps?q='+enc;
    })();
  }});
