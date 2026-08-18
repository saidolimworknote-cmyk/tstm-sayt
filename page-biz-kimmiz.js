/* biz-kimmiz.html sahifasining skripti.

   2026-08-19: `markaz-haqida.html` shu sahifaga BIRLASHTIRILDI (menyudagi
   "Markaz haqida" endi sahifasiz guruh — site-common.js dagi NAV[].group).
   Shu sababli bu yerga eski `page-markaz-haqida.js` dan uch narsa ko'chdi:
   tadqiqot yo'nalishlari kartalari, "Maqsad va vazifalar" matni va admin'ning
   "markaz-haqida" sahifa matni. Admin kiritgan hech bir matn yo'qolmasligi
   uchun uchala matn bloki ham saqlab qolindi; bo'shi ko'rinmaydi.

   Kartalar va bosqichlar matni i18n'dan keladi — ular markaz faoliyatining
   DOIMIY tavsifi. Institutsional matnlar esa admin panel -> Sahifalar dan
   olinadi (kodda o'ylab topilgan sana turmasin). */
  Site.initPage({ active:'about', render(){
    const T = Site.t, esc = Site.esc;
    const s = Store.settings();

    // ---- bayonot: admin (settings.aboutIntro) mavjud bo'lsa ustunlik beriladi ----
    // Ilgari bu sozlama faqat markaz-haqida.html da ishlardi; sahifa
    // birlashtirilgach admin'ning matni yo'qolmasin deb shu yerga ko'chirildi.
    const introEl = document.querySelector('[data-i18n-html="who_statement"]');
    if(introEl){
      const intro = (s.aboutIntro && s.aboutIntro[Site.lang]) || (s.aboutIntro && s.aboutIntro.uz);
      if(intro){ introEl.removeAttribute('data-i18n-html'); introEl.innerHTML = esc(intro); }
    }

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

    // ---- tadqiqot yo'nalishlari (markaz-haqida.html dan ko'chdi) ----
    const DI = {
      diplo:'<path d="M12 3v18M5 7l7-4 7 4M5 7v8l7 4 7-4V7M3 21h18"/>',
      shield:'<path d="M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6z"/>',
      trade:'<path d="M3 7h18M3 7l3-4h12l3 4M5 7v13h14V7M9 11h6"/>',
      globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.8 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.8-3.8-9S9.5 5.5 12 3Z"/>',
      chart:'<path d="M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-7"/>',
      energy:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'
    };
    const areas = [
      { ic:'diplo',  t:T('dir1_t'), d:T('dir1_d') },
      { ic:'shield', t:T('dir2_t'), d:T('dir2_d') },
      { ic:'trade',  t:T('dir3_t'), d:T('dir3_d') },
      { ic:'globe',  t:T('dir4_t'), d:T('dir4_d') },
      { ic:'chart',  t:T('dir5_t'), d:T('dir5_d') },
      { ic:'energy', t:T('dir6_t'), d:T('dir6_d') }
    ];
    document.getElementById('areas').innerHTML = areas.map((a,i)=>`
      <a class="rcard" href="yonalish.html?id=${i}">
        <span class="num">${String(i+1).padStart(2,'0')}</span>
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${DI[a.ic]}</svg></div>
        <h3>${esc(a.t)}</h3>
        <p>${esc(a.d)}</p>
        <span class="go">${esc(T('yo_about'))} →</span>
      </a>`).join('');

    // ---- ishlash uslubi: 4 bosqich ----
    const steps = [1,2,3,4].map(i => ({ t:T('who_how'+i+'_t'), d:T('who_how'+i+'_d') }));
    document.getElementById('whoSteps').innerHTML = steps.map((s,i)=>`
      <li class="wstep">
        <div class="n">${String(i+1).padStart(2,'0')}</div>
        <h3>${esc(s.t)}</h3>
        <p>${esc(s.d)}</p>
      </li>`).join('');

    // ---- statistika (admin sozlamalaridan; bo'lmasa standart) ----
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

    // ---- admin matnlari: uchtasi ham ixtiyoriy, bo'lmasa bo'lim ko'rinmaydi ----
    // Ilgari "Maqsad va vazifalar" matn bo'lmasa "tez orada" deb turardi;
    // bo'sh va'da o'rniga endi bo'lim butunlay chizilmaydi (boshqa matn
    // bloklari bilan bir xil qoida).
    const pages = Store.all('pages').filter(p => p.status === 'published');
    const bodyOf = (slug) => { const pg = pages.find(p => p.slug === slug); return pg ? (Site.mlGet(pg.body)||'').trim() : ''; };
    const fill = (slug, bodyId, secId) => {
      const html = bodyOf(slug);
      if(!html) return;
      document.getElementById(bodyId).innerHTML = html;
      document.getElementById(secId).classList.remove('is-hidden');
    };
    fill('maqsad',        'goalBody',  'goalSec');
    fill('markaz-haqida', 'aboutBody', 'aboutBodySec');
    fill('biz-kimmiz',    'whoStory',  'whoStorySec');

    Site.initReveal();
  }});
