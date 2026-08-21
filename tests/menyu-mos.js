/* ==================================================================
   ADMIN YON MENYUSI SAYT MENYUSIGA MOS KELADIMI

   NEGA KERAK
     Menyu UCH joyda yashaydi:
       1) js/site-common.js -> NAV        (ichki sahifalarning menyusi)
       2) index.html                      (bosh sahifadagi QO'LDA yozilgan nusxa)
       3) js/admin-ui.js -> NAV           (admin panelning yon menyusi)
     Ular ayrilib ketganda hech qanday xato chiqmaydi — sayt ham, admin ham
     bemalol ishlayveradi. 2026-08-22 gacha aynan shunday bo'lgan: admin
     panelda "Yangiliklar" bo'limi bor edi, saytning menyusida esa unday band
     yo'q edi. Kontent qo'ygan odam uni saytdan topa olmasdi. O'sha bo'lim
     saytdan ham, admin'dan ham butunlay olib tashlandi; bu skript endi
     shunday nomuvofiqlik QAYTA paydo bo'lishining oldini oladi.

     QOIDA: sayt — etalon. Admin panelda saytda muqobili YO'Q kontent bo'limi
     bo'lmasligi kerak. Yangi bo'lim kerak bo'lsa, avval saytda sahifa va
     menyu bandi paydo bo'ladi, keyin admin'da.

     (1) va (2) ning mosligini `tests\smoke.ps1` -> [9] tekshiradi.
     Bu skript esa (3) ni (1) ga solishtiradi.

   NIMA TEKSHIRADI
     A) Admin panelning har bir KONTENT bo'limi saytning haqiqiy sahifasiga
        ishora qiladimi (fayl diskda bormi).
     B) O'sha sahifa sayt MENYUSIDA bormi — ya'ni tashrifchi uni topa oladimi.
     C) Sayt menyusidagi qaysi sahifa admin panelda boshqarilmaydi.

   ISHLATISH
     node tests\menyu-mos.js
   Chiqish kodi: 0 = mos, 1 = mos emas (CI uchun).
   ================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const R = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

let fail = 0, pass = 0;
const ok = (m) => { pass++; console.log('  [OK]   ' + m); };
const no = (m, d) => { fail++; console.log('  [XATO] ' + m + (d ? '  ' + d : '')); };

/* Manba fayldan `const NAME = <literal>` ni ajratib olib, qiymatga aylantiradi.
   Fayllarni import qilib bo'lmaydi: ikkalasi ham brauzer uchun yozilgan
   IIFE va ichkarisidagi o'zgaruvchilarni tashqariga chiqarmaydi. */
function literal(src, decl, endRe) {
  const i = src.indexOf(decl);
  if (i < 0) throw new Error(decl + ' topilmadi');
  const tail = src.slice(i + decl.length);
  const m = tail.match(endRe);
  if (!m) throw new Error(decl + ' oxiri topilmadi');
  return eval('(' + tail.slice(0, m.index + m[0].length).replace(/;$/, '') + ')');
}

// ---- 1. Sayt menyusi ----------------------------------------------
const siteSrc = R('js/site-common.js');
const siteNav = literal(siteSrc, 'const NAV = ', /\n  \];/);
const siteHrefs = new Set();
siteNav.forEach(n => {
  if (n.href) siteHrefs.add(n.href);
  (n.children || []).forEach(c => siteHrefs.add(c.href));
});

// ---- 2. Admin menyusi ---------------------------------------------
const adminSrc = R('js/admin-ui.js');
// `C` ichida ishlatiladigan yordamchi ro'yxat — u ham kerak
const PARTNER_CATS = literal(adminSrc, 'const PARTNER_CATS = ', /\];/);   // eslint-disable-line no-unused-vars
const adminNav = literal(adminSrc, 'const NAV = ', /\n  \];/);
const C = literal(adminSrc, 'const C = ', /\n  \};/);

const w = {};
new Function('window', R('js/content-kinds.js'))(w);
const CK = w.ContentKinds;

/* Yon menyuni yoyish — `admin-ui.js` -> renderSidebar bilan AYNI mantiq.
   `kindsOf` bitta band emas, bo'limlar ro'yxati (+ umumiy sahifa). */
const adminItems = [];
adminNav.forEach(g => {
  if (g.skip) return;
  g.items.forEach(it => {
    if (it && it.kindsOf) {
      const coll = it.kindsOf;
      CK.kindsOf(coll).forEach(k => adminItems.push({ g: g.group, label: k.label, page: k.page }));
      const fb = CK.fallbackPage(coll);
      if (fb) adminItems.push({ g: g.group, label: fb.label, page: fb.page });
      return;
    }
    const base = typeof it === 'string' ? { key: it } : it;
    const isColl = !!C[base.key] && !base.view;
    adminItems.push({
      g: g.group,
      label: isColl ? C[base.key].label : base.label,
      page: (C[base.key] && C[base.key].page) || base.page
        || (base.tab ? 'media.html?tab=' + base.tab : '')
    });
  });
});

/* Saytda sahifasi BO'LMASLIGI TABIIY bo'lgan guruhlar: boshqaruv vositalari
   (obunachilar, loglar, sozlamalar) va boshqaruv paneli. */
const ADMIN_ONLY = /^(Asosiy|Boshqaruv)/;
const content = adminItems.filter(x => !ADMIN_ONLY.test(x.g));

/* Sayt MENYUSIDA bo'lmasligi TABIIY bo'lgan sahifalar. `index.html` menyuda
   band emas (logotip orqali ochiladi), lekin hero slayder o'sha yerga
   tushadi — ya'ni admin bandining manzili to'g'ri. */
const MENYUSIZ_OK = new Set(['index.html']);

// ---- A. Sahifa diskda bormi ---------------------------------------
console.log('\n[A] Admin bo\'limlarining sayt sahifasi mavjudmi');
content.forEach(x => {
  if (!x.page) { no(`${x.g} -> ${x.label}`, 'sayt sahifasi ko\'rsatilmagan'); return; }
  const file = x.page.split('?')[0];
  if (fs.existsSync(path.join(ROOT, file))) ok(`${x.label}  ->  ${x.page}`);
  else no(`${x.label}  ->  ${x.page}`, 'bunday fayl yo\'q');
});

// ---- B. Sahifa sayt menyusida bormi -------------------------------
console.log('\n[B] O\'sha sahifa sayt menyusida ham bormi');
content.forEach(x => {
  if (!x.page) return;
  if (MENYUSIZ_OK.has(x.page) || siteHrefs.has(x.page)) ok(`${x.label}  ->  ${x.page}`);
  else no(`${x.label}  ->  ${x.page}`, 'sayt menyusida bunday band yo\'q (site-common.js -> NAV)');
});

// ---- C. Menyuda bor, lekin admin'da boshqarilmaydigan sahifalar ----
console.log('\n[C] Sayt menyusida bor, admin\'da bo\'limi yo\'q');
const adminPages = new Set(content.map(x => x.page).filter(Boolean));
const orphan = [...siteHrefs].filter(h => !adminPages.has(h)).sort();
if (!orphan.length) {
  ok('hammasi admin\'dan boshqariladi');
} else {
  // Bu XATO emas: `media.html` — bo'limlarni birlashtiruvchi sahifa, o'z
  // kontenti yo'q. Ro'yxat baribir chiqariladi — yangi "boshqarilmaydigan"
  // sahifa paydo bo'lsa ko'rinib tursin.
  console.log('  [ESLATMA] ' + orphan.join(', '));
  ok(`${orphan.length} ta sahifa (yuqorida) — bular kontent sahifasi emas`);
}

console.log('\n' + '='.repeat(60));
console.log(`NATIJA: ${pass} o'tdi, ${fail} yiqildi`);
process.exit(fail ? 1 : 0);
