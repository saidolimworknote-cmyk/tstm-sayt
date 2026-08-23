/* hamkorlar.html sahifasining skripti.

   2026-08-23 da sahifa SODDALASHTIRILDI. Ilgari bu yerda toifa filtri
   chiplari, qidiruv maydoni, toifa bo'yicha guruhlash, natija hisoblagichi va
   ro'yxatni qisqartirib turadigan "barcha hamkorlarni ko'rish" tugmasi bor
   edi — hammasi olib tashlandi. Endi mantiq bitta: BARCHA hamkor alifbo
   tartibida bitta to'rga chiziladi, ro'yxat uzaysa sahifa pastga davom etadi
   (sahifalash ham, "yana yuklash" ham yo'q).

   Toifa (`partners.category`) admin panelda hamon tahrirlanadi va bazada
   saqlanadi — faqat saytda ko'rsatilmaydi (ilgari guruh sarlavhalarini
   yasardi). Shu sababli i18n dagi `pcat_*` kalitlari hozir ishlatilmaydi.

   Logotip yuklanmagan hamkor uchun nom bosh harflaridan monogramma chiziladi —
   bo'sh kataklar qolmaydi. */
  Site.initPage({ active:'about', render(){
    const T = Site.t, esc = Site.esc;
    const elGrid = document.getElementById('ptGrid');

    const list = Store.all('partners')
      .filter(p => (p.name || '').trim())
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'uz'));

    if(!list.length){
      elGrid.innerHTML = `<div class="empty"><div class="t">${esc(T('partners_empty'))}</div></div>`;
      Site.initReveal();
      return;
    }

    // Logotipsiz hamkor uchun monogramma: nomning birinchi ikki so'zi bosh
    // harfi (lotin bo'lmagan yozuvda ham ishlaydi — kesib olinadi,
    // aylantirilmaydi). Nom bir so'zdan iborat bo'lsa (OSCE, CICA, CABAR —
    // hamkorlar ro'yxatida ko'p uchraydi) bitta harf qoladi va turli
    // tashkilotlar bir xil ko'rinadi, shuning uchun bunday holatda so'zning
    // dastlabki IKKI harfi olinadi.
    const monogram = (name) => {
      const w = String(name).trim().split(/\s+/);
      const m = w.length > 1 ? w.slice(0, 2).map(x => x.charAt(0)).join('') : w[0].slice(0, 2);
      return m.toUpperCase();
    };
    // Kartaning o'ng pastki burchagidagi strelka (dumaloq fon — CSS: .pt-arrow).
    const arrowIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13"/><path d="m12 5 7 7-7 7"/></svg>';

    const card = (p) => {
      const name = String(p.name);
      const url = (p.url && p.url !== '#') ? Site.safeUrl(p.url) : '';
      const logo = p.logo ? `<img src="${Site.safeUrl(p.logo)}" alt="${esc(name)}" loading="lazy">`
                          : `<span class="mono">${esc(monogram(name))}</span>`;
      const country = (p.country || '').trim();
      const descr = (Site.mlGet(p.descr) || '').trim();
      // Logotip ikki qatlamli oltiburchak ichida: tashqisi hoshiya rangi,
      // ichkisi oq zamin (shaklni CSS beradi — .pt-hex / .pt-hex-in).
      const inner = `<div class="pt-main">
          <div class="pt-hex"><div class="pt-hex-in">${logo}</div></div>
          <div class="pt-body">
            <h3>${esc(name)}</h3>
            ${country ? `<span class="pt-geo">${esc(country)}</span>` : ''}
            ${descr ? `<p>${esc(descr)}</p>` : ''}
          </div>
        </div>`
        // Strelka — bosiladigan kartada. Havolasi yo'q hamkorda u chizilmaydi:
        // aks holda burchakdagi "o'tish" belgisi hech qayerga olib bormasdi.
        + (url ? `<span class="pt-arrow" aria-hidden="true">${arrowIcon}</span>` : '');
      // Havolasi yo'q hamkor — oddiy karta (bosilmaydigan), bosilsa nima
      // bo'lishini va'da qilib qo'ymaslik uchun <a> ATAYLAB ishlatilmaydi.
      return url
        ? `<a class="pt-card is-link" href="${url}" target="_blank" rel="noopener" title="${esc(T('partners_visit'))}">${inner}</a>`
        : `<div class="pt-card">${inner}</div>`;
    };

    // Hech bir hamkorda davlat / tavsif / havola bo'lmasa (admin faqat nomni
    // kiritgan) batafsil karta ichi bo'm-bo'sh qoladi: keng qatorlar yarim
    // bo'sh ko'rinadi. Shunday holatda ro'yxat "logotip devori" ko'rinishiga
    // o'tadi — oltiburchak tepada, nom ostida, qatorda ko'proq element. Admin
    // bironta maydonni to'ldirishi bilan batafsil ko'rinish o'zi qaytadi
    // (uslublar — page-hamkorlar.css, `.pt-wall`).
    const rich = list.some(p => (p.country || '').trim()
      || (Site.mlGet(p.descr) || '').trim()
      || (p.url && p.url !== '#'));
    elGrid.classList.toggle('pt-wall', !rich);

    elGrid.innerHTML = list.map(card).join('');

    Site.initReveal();
  }});
