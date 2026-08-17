/* biz-kimmiz.html sahifasining skripti.
   Sahifa uch qismdan iborat: faoliyat shakllari (kartalar), ishlash uslubi
   (bosqichlar) va admin matni. Kartalar matni i18n'dan keladi — ular markaz
   faoliyatining DOIMIY tavsifi. Institutsional tarix esa admin panel ->
   Sahifalar -> slug `biz-kimmiz` dan olinadi; matn bo'lmasa bo'lim yashirin
   qoladi (kodda o'ylab topilgan sana turmasin). */
  Site.initPage({ active:'about', render(){
    const T = Site.t, esc = Site.esc;

    // ---- faoliyat shakllari: har biri tegishli bo'limga havola ----
    const I = {
      research:'<path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3"/><circle cx="16" cy="6" r="2.2"/>',
      expert:'<path d="M12 3 4 6.5v5c0 4.6 3.4 7.7 8 9.5 4.6-1.8 8-4.9 8-9.5v-5z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
      dialog:'<path d="M4 5h11a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7"/><path d="M17 9h3a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1v3l-3-3"/>',
      share:'<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H19M8.5 7.5h7M8.5 11h5"/>'
    };
    const acts = [
      { ic:'research', t:T('who_do1_t'), d:T('who_do1_d'), href:'tadqiqotlar.html' },
      { ic:'expert',   t:T('who_do2_t'), d:T('who_do2_d'), href:'ekspertlar.html' },
      { ic:'dialog',   t:T('who_do3_t'), d:T('who_do3_d'), href:'tadbirlar.html' },
      { ic:'share',    t:T('who_do4_t'), d:T('who_do4_d'), href:'nashrlar.html' }
    ];
    document.getElementById('whoDo').innerHTML = acts.map(a=>`
      <a class="scard" href="${a.href}">
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${I[a.ic]}</svg></div>
        <h3>${esc(a.t)}</h3>
        <p>${esc(a.d)}</p>
        <span class="go">${esc(T('more'))} →</span>
      </a>`).join('');

    // ---- ishlash uslubi: 4 bosqich ----
    const steps = [1,2,3,4].map(i => ({ t:T('who_how'+i+'_t'), d:T('who_how'+i+'_d') }));
    document.getElementById('whoSteps').innerHTML = steps.map((s,i)=>`
      <li class="wstep">
        <div class="n">${String(i+1).padStart(2,'0')}</div>
        <h3>${esc(s.t)}</h3>
        <p>${esc(s.d)}</p>
      </li>`).join('');

    // ---- statistika (markaz-haqida bilan bir xil manba: admin sozlamalari) ----
    const s = Store.settings();
    const defStats = [
      { n:'300+', c:T('stat_research') },
      { n:'45',   c:T('stat_experts')  },
      { n:'60',   c:T('stat_partners') },
      { n:'32',   c:T('stat_years')    }
    ];
    const stats = (Array.isArray(s.stats) && s.stats.length)
      ? s.stats.map(x => ({ n:x.n, c:Site.mlGet(x.c) }))
      : defStats;
    document.getElementById('statband').innerHTML = stats.map(x=>
      `<div class="s"><div class="n">${esc(x.n)}</div><div class="c">${esc(x.c)}</div></div>`).join('');

    // ---- admin matni (bo'lmasa bo'lim ko'rinmaydi) ----
    const pg = Store.all('pages').find(p => p.status === 'published' && p.slug === 'biz-kimmiz');
    const html = pg ? (Site.mlGet(pg.body)||'').trim() : '';
    if(html){
      document.getElementById('whoStory').innerHTML = html;
      document.getElementById('whoStorySec').classList.remove('is-hidden');
    }

    Site.initReveal();
  }});
