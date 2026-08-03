/* markaz-haqida.html sahifasining skripti.
   Ilgari HTML ichida inline turardi. CSP 'unsafe-inline' siz ishlashi uchun
   alohida faylga ko'chirildi — sahifada faqat <script src> qoladi. */
  Site.initPage({ active:'about', render(){
    const T = Site.t, esc = Site.esc;
    const s = Store.settings();

    // ---- missiya bayonoti: admin (settings.aboutIntro) mavjud bo'lsa ustunlik beriladi ----
    const introEl = document.querySelector('[data-i18n-html="mission_lead"]');
    if(introEl){
      const intro = (s.aboutIntro && s.aboutIntro[Site.lang]) || (s.aboutIntro && s.aboutIntro.uz);
      if(intro){ introEl.removeAttribute('data-i18n-html'); introEl.innerHTML = esc(intro); }
    }

    // ---- faoliyat yo'nalishlari (effektli: ikonkali, porlaydigan kartalar) ----
    const I = {
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
        <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${I[a.ic]}</svg></div>
        <h3>${esc(a.t)}</h3>
        <p>${esc(a.d)}</p>
        <span class="go">${esc(T('yo_about'))} →</span>
      </a>`).join('');

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

    // ---- admin matnlari (mavjud bo'lsagina ko'rsatiladi) ----
    const pages = Store.all('pages').filter(p=>p.status==='published');
    const bodyOf = (slug) => { const pg = pages.find(p=>p.slug===slug); return pg ? (Site.mlGet(pg.body)||'').trim() : ''; };

    const aboutHtml = bodyOf('markaz-haqida');
    if(aboutHtml){
      document.getElementById('aboutBody').innerHTML = aboutHtml;
      document.getElementById('aboutBodySec').classList.remove('is-hidden');
    }

    const goalHtml = bodyOf('maqsad');
    document.getElementById('goalBody').innerHTML = goalHtml || '<p class="muted">'+esc(T('soon_text'))+'</p>';

    Site.initReveal();
  }});
