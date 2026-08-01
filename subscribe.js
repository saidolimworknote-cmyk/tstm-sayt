/* ============================================================
   TSTM — obuna oynasi (push-bildirishnoma)

   NEGA ALOHIDA FAYL: bu oyna BARCHA sahifalarda kerak, jumladan bosh
   sahifada ham. Bosh sahifa esa site-common.js ni YUKLAMAYDI (uning o'z
   header/footer nusxasi bor va site-common.js yuklansa tema qiymatini
   qayta yozib yuboradi). Ilgari shu sababli oynaning ikkita nusxasi bor
   edi: site-common.js dagi yangisi va page-home.js ichidagi eski
   e-pochtali nusxasi — bosh sahifaga kirgan odam eskisini ko'rardi.
   Endi mantiq faqat SHU YERDA. Nusxa ko'chirmang.

   E-pochta SO'RALMAYDI. Foydalanuvchi bitta tugmani bosadi, brauzer o'z
   ruxsat oynasini ko'rsatadi va shu bilan tamom. Serverda shaxsiy ma'lumot
   saqlanmaydi — faqat brauzer bergan anonim manzil.

   Bu oyna brauzerning O'Z ruxsat so'rovidan OLDIN chiqadi ("yumshoq so'rov").
   Sababi: brauzer ruxsatini foydalanuvchi bir marta rad etsa, uni qayta
   so'rab bo'lmaydi — u qo'lda sozlamalardan yoqishi kerak bo'ladi. Shuning
   uchun avval o'zimiz tushuntiramiz va faqat rozi bo'lgandagina brauzerga
   o'tkazamiz.
   ============================================================ */
(function (w) {
  var lang = (function(){ try { return localStorage.getItem('tstm_site_lang') || 'uz'; } catch{ return 'uz'; } })();
  var T = function (k) { return w.I18N ? w.I18N.t(k) : k; };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  var SUB_SEEN = 'tstm_sub_seen';     // muvaffaqiyatli obuna yoki ataylab yopish
  var SUB_SNOOZE = 'tstm_sub_snooze'; // vaqtincha (xatodan keyin qayta urinish uchun)

  function subSeen(){
    try {
      if (localStorage.getItem(SUB_SEEN)) return true;
      var t = parseInt(localStorage.getItem(SUB_SNOOZE) || '0', 10);
      return t && Date.now() < t;
    } catch{ return false; }
  }

  function pushSupported(){
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // VAPID ochiq kaliti base64url matn — PushManager esa Uint8Array kutadi.
  function b64ToBytes(s){
    var pad = new Array((4 - s.length % 4) % 4 + 1).join('=');
    var raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function showSubscribe(){
    if (subSeen()) return;
    // Brauzer qo'llab-quvvatlamasa (yoki HTTPS yo'q bo'lsa) — bezovta qilmaymiz.
    if (!pushSupported()) return;
    // Ruxsat allaqachon berilgan yoki rad etilgan bo'lsa — so'rashning ma'nosi yo'q.
    if (Notification.permission !== 'default') return;
    // Oyna allaqachon ochiq bo'lsa ikkinchisini qo'shmaymiz.
    if (document.querySelector('.sub-ov')) return;

    var lastFocus = document.activeElement;
    var ov = document.createElement('div');
    ov.className = 'sub-ov';
    ov.innerHTML = '<div class="sub-modal" role="dialog" aria-modal="true" aria-labelledby="subTitle" tabindex="-1">'
      + '<button class="sub-x" type="button" aria-label="' + esc(T('close') || 'Yopish') + '">'
      +   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>'
      + '</button>'
      + '<div class="sub-body">'
      +   '<div class="sub-head">'
      +     '<div class="sub-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">'
      +       '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke-linecap="round" stroke-linejoin="round"/>'
      +       '<path d="M13.7 21a2 2 0 0 1-3.4 0" stroke-linecap="round"/></svg></div>'
      +     '<span class="sub-badge">' + esc(T('sub_badge')) + '</span>'
      +   '</div>'
      +   '<h3 id="subTitle">' + esc(T('sub_title')) + '</h3>'
      +   '<p class="sub-lead">' + esc(T('sub_text')) + '</p>'
      +   '<ul class="sub-perks">'
      +     '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 12.5 9.5 18 20 7" stroke-linecap="round" stroke-linejoin="round"/></svg>' + esc(T('sub_perk_noemail')) + '</li>'
      +     '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 12.5 9.5 18 20 7" stroke-linecap="round" stroke-linejoin="round"/></svg>' + esc(T('sub_perk_off')) + '</li>'
      +   '</ul>'
      +   '<div class="sub-actions">'
      // `btn` sinfi ATAYLAB yo'q: u faqat site.css da bor, bosh sahifada esa
      // yo'q edi — tugma ikki sahifada ikki xil chiqardi. Uslub subscribe.css da.
      +     '<button type="button" class="sub-go">'
      +       '<span class="lbl">' + esc(T('sub_btn')) + '</span><span class="sub-spin" aria-hidden="true"></span>'
      +     '</button>'
      +     '<button type="button" class="sub-later">' + esc(T('sub_later')) + '</button>'
      +   '</div>'
      +   '<div class="sub-alert" role="alert"></div>'
      + '</div>'
      + '<div class="sub-done" role="status">'
      +   '<div class="sub-done-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12.5 9.5 18 20 7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
      +   '<h3>' + esc(T('sub_ok')) + '</h3><p>' + esc(T('sub_ok_text')) + '</p>'
      + '</div>'
      + '<div class="sub-blocked" role="status">'
      +   '<div class="sub-done-ic warn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
      +   '<h3>' + esc(T('sub_blocked')) + '</h3><p>' + esc(T('sub_blocked_text')) + '</p>'
      + '</div>'
      + '</div>';

    var modal = ov.querySelector('.sub-modal');
    var goBtn = ov.querySelector('.sub-go');
    var alertEl = ov.querySelector('.sub-alert');

    var closed = false;
    // dismiss=true — ataylab yopdi yoki natija chiqdi: boshqa ko'rsatmaymiz.
    // dismiss=false — texnik xato: 1 kundan so'ng yana taklif qilamiz.
    function close(dismiss){
      if (closed) return; closed = true;
      try {
        if (dismiss) localStorage.setItem(SUB_SEEN, '1');
        else localStorage.setItem(SUB_SNOOZE, String(Date.now() + 86400000));
      } catch{}
      document.removeEventListener('keydown', onKey, true);
      ov.classList.remove('open');
      setTimeout(function(){ ov.remove(); try { lastFocus && lastFocus.focus(); } catch{} }, 300);
    }

    function onKey(e){
      if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
      if (e.key !== 'Tab') return;
      // Fokus modal ichida qolsin (fokus tuzog'i)
      var f = modal.querySelectorAll('button, a[href]');
      var vis = [];
      for (var i = 0; i < f.length; i++) if (f[i].offsetParent !== null && !f[i].disabled) vis.push(f[i]);
      if (!vis.length) return;
      var first = vis[0], last = vis[vis.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function showErr(key){
      alertEl.textContent = T(key);
      alertEl.classList.add('show');
      goBtn.disabled = false; goBtn.classList.remove('loading');
      try { goBtn.focus(); } catch{}
    }

    document.body.appendChild(ov);
    // Fokus MODALGA beriladi (tugmaga emas): chaqirilmagan oyna bo'lgani uchun
    // tasodifan Enter bosilsa obuna qilib qo'ymasin. Ekran o'quvchi matnni o'qiydi.
    requestAnimationFrame(function(){
      ov.classList.add('open');
      try { modal.focus(); } catch{}
    });
    document.addEventListener('keydown', onKey, true);

    ov.addEventListener('click', function(e){ if (e.target === ov) close(true); });
    ov.querySelector('.sub-x').addEventListener('click', function(){ close(true); });
    ov.querySelector('.sub-later').addEventListener('click', function(){ close(true); });

    goBtn.addEventListener('click', function(){
      if (goBtn.disabled) return;
      goBtn.disabled = true; goBtn.classList.add('loading');
      alertEl.classList.remove('show');
      doSubscribe().then(function(res){
        if (res === 'ok') {
          modal.classList.add('done');
          try { localStorage.setItem(SUB_SEEN, '1'); } catch{}
          setTimeout(function(){ close(true); }, 2800);
        } else if (res === 'denied') {
          // Brauzer darajasida bloklandi — qayta so'rab bo'lmaydi, tushuntiramiz.
          modal.classList.add('blocked');
          try { localStorage.setItem(SUB_SEEN, '1'); } catch{}
          setTimeout(function(){ close(true); }, 4500);
        } else {
          showErr('sub_err_fail');
        }
      }).catch(function(){ showErr('sub_err_fail'); });
    });
  }

  /* Oynani QACHON ko'rsatish.

     Ilgari u sahifa ochilgandan 2.5-3 soniya keyin chiqardi — foydalanuvchi hali
     hech narsa o'qimasdan turib taklif olardi va odatda o'ylamasdan yopardi.
     Push uchun bu ayniqsa zararli: brauzer ruxsati bir marta rad etilsa,
     qaytadan so'rab bo'lmaydi.

     Endi taklif foydalanuvchi QIZIQISH BILDIRGANDAN keyin chiqadi:
       • sahifaning ~40% i aylantirilganda, YOKI
       • 25 soniya o'qigandan keyin (uzun sahifada skroll kam bo'lishi mumkin).
     Qaysi biri oldin bo'lsa — o'sha. */
  function armSubscribePrompt(){
    if (subSeen() || !pushSupported() || Notification.permission !== 'default') return;

    var fired = false;
    var timer = null;

    function fire(){
      if (fired) return; fired = true;
      window.removeEventListener('scroll', onScroll);
      if (timer) clearTimeout(timer);
      showSubscribe();
    }
    function onScroll(){
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      if (max <= 0) return;                       // aylantiriladigan joy yo'q
      if ((h.scrollTop || document.body.scrollTop) / max >= 0.4) fire();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    timer = setTimeout(fire, 25000);
  }

  /* Ruxsat so'rash -> service worker -> obuna -> serverga saqlash.
     Qaytadi: 'ok' | 'denied' | 'fail'. */
  function doSubscribe(){
    return Promise.resolve()
      .then(function(){ return Notification.requestPermission(); })
      .then(function(perm){
        if (perm === 'denied') return 'denied';
        if (perm !== 'granted') return 'fail';   // foydalanuvchi brauzer oynasini yopdi
        return navigator.serviceWorker.register('sw.js')
          .then(function(reg){
            return navigator.serviceWorker.ready.then(function(){ return reg; });
          })
          .then(function(reg){
            // Tilni SW o'qiy oladigan joyga yozamiz — bildirishnoma matni
            // foydalanuvchi tanlagan tilda chiqsin.
            try {
              caches.open('tstm-push').then(function(c){
                c.put('lang', new Response(lang || 'uz'));
              });
            } catch{}
            return fetch('api.php?action=push_key', { headers: { Accept: 'application/json' } })
              .then(function(r){ return r.json(); })
              .then(function(j){
                if (!j || !j.ok || !j.key) throw new Error('no key');
                return reg.pushManager.subscribe({
                  userVisibleOnly: true,               // standart talabi
                  applicationServerKey: b64ToBytes(j.key)
                });
              });
          })
          .then(function(sub){
            var s = sub.toJSON ? sub.toJSON() : {};
            var k = s.keys || {};
            return fetch('api.php?action=push_subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpoint: sub.endpoint,
                p256dh: k.p256dh || '', auth: k.auth || '',
                lang: lang || 'uz'
              })
            });
          })
          .then(function(r){ return r.ok ? 'ok' : 'fail'; });
      })
      .catch(function(){ return 'fail'; });
  }

  w.Subscribe = { show: showSubscribe, arm: armSubscribePrompt, supported: pushSupported };
})(window);
