/* hamkorlar.html sahifasining skripti.

   Hamkorlar TOIFA bo'yicha guruhlanadi. Toifa bazada o'zbekcha satr sifatida
   turadi (admin -> Hamkorlar -> Toifa), saytda esa tashrifchining tiliga
   o'giriladi: CAT_KEY xaritasi satrni i18n kalitiga bog'laydi. Admin'dagi
   PARTNER_CATS ro'yxatiga yangi toifa qo'shilsa — shu xaritaga va i18n.js ga
   ham qator qo'shing, aks holda hamkor "Boshqa hamkorlar" guruhiga tushadi.

   TUZILMA QOIDASI (2026-08-19): sahifa ma'lumot MIQDORIGA moslashadi.
   Bazada bor-yo'g'i bir necha hamkor bo'lsa (va toifa/davlat/logotip
   kiritilmagan bo'lsa) filtr chiplari, qidiruv maydoni, guruh sarlavhalari va
   ma'nosiz raqamlar CHIZILMAYDI — ular bo'sh sahifani yanada bo'shroq
   ko'rsatardi. Admin ma'lumotni to'ldirgani sayin shu elementlar o'zi paydo
   bo'ladi. Har bir ostona quyida `SHOW_*` nomlari bilan bitta joyda yozilgan.

   Logotip yuklanmagan hamkor uchun nom bosh harflaridan monogramma chiziladi —
   bo'sh kataklar qolmaydi. */
  Site.initPage({ active:'about', render(){
    const T = Site.t, esc = Site.esc;

    // Boshqaruv elementlari qachon ko'rinishi. Qidiruv ostonasi: bir ekranga
    // sig'adigan ro'yxatda qidiruv maydoni ortiqcha, ko'z bilan topish tezroq.
    const SHOW_SEARCH_FROM = 9;   // shuncha va undan ko'p hamkor bo'lsa qidiruv
    const SHOW_FILTER_FROM = 2;   // shuncha va undan ko'p TOIFA bo'lsa chiplar

    // Guruhlar tartibi ham shu ro'yxatdan olinadi (admin ro'yxati bilan bir xil).
    const CAT_KEY = {
      'Xalqaro tashkilotlar':      'pcat_intl',
      'Ilmiy-tadqiqot markazlari': 'pcat_think',
      'Universitetlar':            'pcat_uni',
      'Davlat organlari':          'pcat_gov',
      'Diplomatik vakolatxonalar': 'pcat_diplo'
    };
    const ORDER = Object.keys(CAT_KEY);
    const OTHER = '';                                  // toifasiz hamkorlar
    const catLabel = (c) => c && CAT_KEY[c] ? T(CAT_KEY[c]) : T('pcat_other');

    const $ = (id) => document.getElementById(id);
    const elStats  = $('ptStats'), elBar = $('ptBar'), elFilter = $('ptFilter'),
          elSearchBox = $('ptSearchBox'), elSearch = $('ptSearch'),
          elCount = $('ptCount'), elGroups = $('ptGroups');

    const list = Store.all('partners')
      .filter(p => (p.name || '').trim())
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'uz'));

    if(!list.length){
      elStats.innerHTML = '';
      elGroups.innerHTML = `<div class="empty"><div class="t">${esc(T('partners_empty'))}</div></div>`;
      Site.initReveal();
      return;
    }

    // ---- raqamlar: faqat MAZMUNLI ko'rsatkichlar ----
    // Davlat yoki toifa kiritilmagan bo'lsa o'sha ustun umuman chizilmaydi;
    // qolgan ustunlar butun kenglikni teng bo'lishadi (--n).
    const countries = new Set(list.map(p => (p.country || '').trim()).filter(Boolean));
    const cats = new Set(list.map(p => (p.category || '').trim()).filter(Boolean));
    const stats = [
      { n: list.length,    c: T('partners_stat_orgs') },
      { n: countries.size, c: T('partners_stat_geo')  },
      { n: cats.size,      c: T('partners_stat_cats') }
    ].filter(x => x.n > 0);
    elStats.style.setProperty('--n', String(stats.length));
    elStats.innerHTML = stats.map(x =>
      `<div class="s"><div class="n">${esc(String(x.n))}</div><div class="c">${esc(x.c)}</div></div>`).join('');

    // ---- guruhlar: faqat hamkori BOR toifalar chiziladi ----
    const groups = ORDER.concat([OTHER])
      .map(c => ({ cat: c, items: list.filter(p => (p.category || '') === c) }))
      .filter(g => g.items.length);

    // ---- bitta hamkor kartasi ----
    // Logotipsiz hamkor uchun monogramma: nomning birinchi ikki so'zi bosh
    // harfi (lotin bo'lmagan yozuvda ham ishlaydi — kesib olinadi, aylantirilmaydi).
    // Nom bir so'zdan iborat bo'lsa (OSCE, CICA, CABAR — hamkorlar ro'yxatida
    // ko'p uchraydi) bitta harf qoladi va turli tashkilotlar bir xil ko'rinadi,
    // shuning uchun bunday holatda so'zning dastlabki IKKI harfi olinadi.
    const monogram = (name) => {
      const w = String(name).trim().split(/\s+/);
      const m = w.length > 1 ? w.slice(0, 2).map(x => x.charAt(0)).join('') : w[0].slice(0, 2);
      return m.toUpperCase();
    };
    const linkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 10.5 13.5"/><path d="M18 14v5a1.8 1.8 0 0 1-1.8 1.8H5A1.8 1.8 0 0 1 3.2 19V7.8A1.8 1.8 0 0 1 5 6h5"/></svg>';

    // Qidiruv uchun normallashtirish: registr va apostrof shakllari (' ’ `)
    // farq qilmasin — "bo'yicha" va "bo’yicha" bir xil topilsin.
    const norm = (v) => String(v || '').toLowerCase().replace(/[‘’'`ʻʼ]/g, "'");

    const card = (p) => {
      const name = String(p.name);
      const url = (p.url && p.url !== '#') ? Site.safeUrl(p.url) : '';
      const logo = p.logo ? `<img src="${Site.safeUrl(p.logo)}" alt="${esc(name)}" loading="lazy">`
                          : `<span class="mono">${esc(monogram(name))}</span>`;
      const country = (p.country || '').trim();
      const descr = (Site.mlGet(p.descr) || '').trim();
      // Qidiruv maydoni: nom + davlat + tavsif + toifa yorlig'i.
      const hay = esc(norm([name, country, descr, catLabel(p.category || '')].join(' ')));
      const inner = `<div class="pt-logo">${logo}</div>
        <div class="pt-body">
          <h3>${esc(name)}</h3>
          ${country ? `<div class="pt-geo">${esc(country)}</div>` : ''}
          ${descr ? `<p>${esc(descr)}</p>` : ''}
          ${url ? `<span class="pt-go">${linkIcon}${esc(T('partners_visit'))}</span>` : ''}
        </div>`;
      // Havolasi yo'q hamkor — oddiy karta (bosilmaydigan), bosilsa nima
      // bo'lishini va'da qilib qo'ymaslik uchun <a> ATAYLAB ishlatilmaydi.
      return url
        ? `<a class="pt-card is-link" data-s="${hay}" href="${url}" target="_blank" rel="noopener">${inner}</a>`
        : `<div class="pt-card" data-s="${hay}">${inner}</div>`;
    };

    // Hech bir hamkorda davlat / tavsif / havola bo'lmasa (admin faqat nom va
    // toifani kiritgan) batafsil karta ichi bo'm-bo'sh qoladi: keng qatorlar
    // yarim bo'sh ko'rinadi. Shunday holatda ro'yxat "logotip devori"
    // ko'rinishiga o'tadi — logotip tepada, nom ostida, qatorda ko'proq
    // element. Admin bironta maydonni to'ldirishi bilan batafsil ko'rinish
    // o'zi qaytadi (uslublar — page-hamkorlar.css, `.pt-wall`).
    const rich = list.some(p => (p.country || '').trim()
      || (Site.mlGet(p.descr) || '').trim()
      || (p.url && p.url !== '#'));
    elGroups.classList.toggle('pt-wall', !rich);

    elGroups.innerHTML = groups.map(g => `
      <section class="pt-group rv" data-cat="${esc(g.cat)}">
        <div class="pt-ghead"><h2>${esc(catLabel(g.cat))}</h2><span class="cnt">${g.items.length}</span></div>
        <div class="pt-grid">${g.items.map(card).join('')}</div>
      </section>`).join('')
      + `<div class="empty is-hidden" id="ptNone">
           <div class="t">${esc(T('partners_none'))}</div>
           <button type="button" class="btn outline mt-20" id="ptReset">${esc(T('partners_reset'))}</button>
         </div>`;

    const elNone = $('ptNone');
    const cards = Array.from(elGroups.querySelectorAll('.pt-card'));
    const groupEls = Array.from(elGroups.querySelectorAll('.pt-group'));

    // Yagona toifasiz guruhda sarlavha ortiqcha — ro'yxatning o'zi yetarli.
    const onlyUngrouped = groups.length === 1 && groups[0].cat === OTHER;
    if(onlyUngrouped){
      const h = elGroups.querySelector('.pt-ghead');
      if(h) h.classList.add('is-hidden');
    }

    // ---- boshqaruv qatori: har bir qismi o'z ostonasiga qarab ----
    const useFilter = groups.length >= SHOW_FILTER_FROM;
    const useSearch = list.length >= SHOW_SEARCH_FROM;

    if(useFilter){
      elFilter.classList.remove('is-hidden');
      const chips = [{ cat:'*', label:T('partners_filter_all'), n:list.length }]
        .concat(groups.map(g => ({ cat:g.cat, label:catLabel(g.cat), n:g.items.length })));
      elFilter.innerHTML = chips.map((c, i) =>
        `<button type="button" class="fchip${i ? '' : ' on'}" data-cat="${esc(c.cat)}" aria-pressed="${i ? 'false' : 'true'}">${esc(c.label)}<span class="fc-n">${c.n}</span></button>`).join('');
    } else {
      elFilter.classList.add('is-hidden');
    }

    if(useSearch){
      elSearchBox.classList.remove('is-hidden');
      elSearch.setAttribute('placeholder', T('partners_search_ph'));
      elSearch.setAttribute('aria-label', T('partners_search_ph'));
    }

    if(useFilter || useSearch) elBar.classList.remove('is-hidden');

    // ---- filtrlash ----
    let cat = '*', q = '';
    function apply(){
      let shown = 0;
      cards.forEach(c => {
        const okCat = cat === '*' || (c.closest('.pt-group').dataset.cat === cat);
        const okQ = !q || c.dataset.s.indexOf(q) >= 0;
        const on = okCat && okQ;
        c.classList.toggle('is-hidden', !on);
        if(on) shown++;
      });
      // Ichida ko'rinadigan kartasi qolmagan guruh sarlavhasi bilan yashiriladi
      groupEls.forEach(g => {
        const any = g.querySelector('.pt-card:not(.is-hidden)');
        g.classList.toggle('is-hidden', !any);
      });
      elNone.classList.toggle('is-hidden', shown > 0);
      // Hisoblagich faqat filtr FAOL bo'lganda kerak: filtrsiz holatda bu
      // raqam yuqoridagi "Hamkor tashkilot" ustunini takrorlagan bo'lardi.
      const active = q || cat !== '*';
      elCount.classList.toggle('is-hidden', !active || shown === 0);
      if(active) elCount.textContent = shown + ' ' + T('partners_found');
    }

    if(useFilter){
      elFilter.addEventListener('click', (e) => {
        const b = e.target.closest('.fchip'); if(!b) return;
        cat = b.dataset.cat;
        elFilter.querySelectorAll('.fchip').forEach(x => {
          const on = x === b;
          x.classList.toggle('on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        apply();
      });
    }
    if(useSearch){
      elSearch.addEventListener('input', () => { q = norm(elSearch.value).trim(); apply(); });
    }
    $('ptReset').addEventListener('click', () => {
      cat = '*'; q = '';
      if(useSearch) elSearch.value = '';
      if(useFilter){
        elFilter.querySelectorAll('.fchip').forEach((x, i) => {
          x.classList.toggle('on', i === 0);
          x.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
        });
      }
      apply();
    });

    Site.initReveal();
  }});
