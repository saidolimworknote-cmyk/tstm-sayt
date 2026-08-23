/* biz-kimmiz.html sahifasining skripti.

   2026-08-23 da sahifa ikki bosqichda qayta yozildi:
     1) o'nta bo'lim (bayonot, faoliyat kartalari, uslubiyat bosqichlari,
        tamoyillar, raqamlar, CTA) olib tashlandi — bitta matn qoldi;
     2) matn KODDAN BAZAGA ko'chirildi. Endi u admin panel -> Markaz haqida ->
        "Biz kimmiz" da tahrirlanadi (`pages` jadvali, slug `biz-kimmiz`).

   Nega bazada: bu MARKAZ HAQIDAGI KONTENT, sayt interfeysi emas. Kontentni
   egasi o'zi, admin panel orqali, uch tilda (avto-tarjima bilan) tahrirlashi
   kerak — kod tahrirlash uchun dasturchi kerak bo'lardi. Shu sababli i18n.js
   da bu matnning nusxasi ATAYLAB saqlanmaydi: ikkita manba bo'lsa ular
   albatta bir-biridan chetga chiqadi.

   Eski `tarix` slug'i ham qabul qilinadi: baza eski zaxiradan tiklanganda
   matn o'sha nom ostida turgan bo'lishi mumkin. Birinchi TO'LDIRILGANI
   ishlatiladi. */
  Site.initPage({ active:'about', render(){
    const T = Site.t, esc = Site.esc;
    const el = document.getElementById('whoText');
    if(!el) return;

    // Matni bor-yo'qligini teg'larsiz tekshiramiz: muharrir bo'sh blokni
    // ham "<p><br></p>" ko'rinishida saqlab qo'yishi mumkin, u esa matn emas.
    const hasText = (html) => String(html || '').replace(/<[^>]*>/g, '').replace(/ /g, ' ').trim() !== '';

    const published = Store.all('pages').filter(p => p.status === 'published');
    const pg = ['biz-kimmiz', 'tarix']
      .map(slug => published.find(p => p.slug === slug))
      .find(p => p && hasText(Site.mlGet(p.body)));

    if(!pg){
      el.innerHTML = `<div class="empty"><div class="t">${esc(T('who_empty'))}</div></div>`;
      Site.initReveal();
      return;
    }

    const title = String(Site.mlGet(pg.title) || '').trim();
    // Matn admin muharriridan keladigan HTML (p / h2 / h3 / ro'yxat / iqtibos /
    // havola) — shuning uchun innerHTML. Uslublari: page-biz-kimmiz.css.
    el.innerHTML = (title ? `<h2>${esc(title)}</h2>` : '')
      + `<div class="who-body">${Site.mlGet(pg.body)}</div>`;

    Site.initReveal();
  }});
