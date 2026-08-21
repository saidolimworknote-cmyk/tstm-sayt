/* sw.js — Service Worker (push-bildirishnomalar uchun).
 *
 * MUHIM: bu fayl sayt ILDIZIDA turishi shart. Service worker faqat o'zi
 * joylashgan papka va undan pastdagi sahifalarni boshqara oladi ("scope").
 * Uni papkaga ko'chirsangiz, obuna butun sayt uchun ishlamay qoladi.
 *
 * NEGA PAYLOADSIZ: server bo'sh "turtki" yuboradi, xabar matni bu yerda
 * API'dan olinadi. Sabab — payloadli push RFC 8291 shifrlashini talab qiladi
 * (ECDH + HKDF + AES128GCM), uni kutubxonasiz PHP'da amalga oshirish juda
 * murakkab. Bu yondashuv standart va keng qo'llaniladi.
 *
 * Qurilma push kelganda albatta onlayn bo'ladi (push aynan tarmoq orqali
 * keladi), shuning uchun bu yerdagi fetch xavfsiz.
 */

const API = 'api.php';
const FALLBACK = {
  uz: { title: 'Markazda yangi nashr', body: 'Yangi materialni o‘qish uchun bosing' },
  ru: { title: 'Новое издание центра', body: 'Нажмите, чтобы прочитать' },
  en: { title: 'New publication', body: 'Tap to read the latest' }
};

self.addEventListener('install', (e) => {
  // Yangi versiya darhol kuchga kirsin (eski SW kutib turmasin)
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  event.waitUntil(showLatest());
});

async function showLatest() {
  let title = '';
  let body = '';
  let url = './';
  let lang = 'uz';

  try {
    // Tilni oxirgi ochilgan sahifadan olamiz (obuna bo'lganda saqlangan)
    const cache = await caches.open('tstm-push');
    const langRes = await cache.match('lang');
    if (langRes) lang = (await langRes.text()) || 'uz';
  } catch { /* til aniqlanmadi — uz qoladi */ }

  try {
    const res = await fetch(API + '?action=load', { credentials: 'omit' });
    if (res.ok) {
      const data = await res.json();
      /* Manba: so'nggi e'lon qilingan NASHR.
         2026-08-22 gacha yangilik olinardi, lekin "Yangiliklar" bo'limi
         saytdan butunlay olib tashlandi. Nashrga o'tish obuna oynasidagi
         VA'DAGA ham mos: "Markaz yangi tahlil yoki nashr e'lon qilganda
         brauzeringiz sizga xabar beradi" (i18n.js -> sub_text).
         Nashrda `date` yo'q — faqat `year`; teng yillar ichida ro'yxatdagi
         keyingi yozuv yangiroq hisoblanadi. */
      const pubs = (data.publications || [])
        .map((p, i) => ({ p: p, i: i }))
        .filter(x => x.p && x.p.status === 'published')
        .sort((a, b) => String(b.p.year || '').localeCompare(String(a.p.year || '')) || (b.i - a.i));
      const n = pubs.length ? pubs[0].p : null;
      if (n) {
        title = pick(n.shortTitle, lang) || pick(n.title, lang);
        body = pick(n.desc, lang) || pick(n.type, lang) || '';
        url = 'nashr.html?id=' + encodeURIComponent(n.id);
      }
    }
  } catch { /* tarmoq muammosi — quyida zaxira matn ishlatiladi */ }

  const fb = FALLBACK[lang] || FALLBACK.uz;
  if (!title) { title = fb.title; body = fb.body; }

  return self.registration.showNotification(title, {
    body: body.slice(0, 160),
    icon: 'logo-mark.png',
    badge: 'logo-mark.png',
    lang: lang,
    tag: 'tstm-news',        // bir xil tag — bildirishnomalar to'planib ketmaydi
    renotify: true,
    data: { url: url }
  });
}

// Ko'p tilli maydondan joriy tildagi matnni oladi
function pick(v, lang) {
  if (!v) return '';
  if (typeof v === 'object') return v[lang] || v.uz || v.ru || v.en || '';
  return String(v);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Sayt allaqachon ochiq bo'lsa — o'sha oynani ishlatamiz, yangisini ochmaymiz
    for (const c of all) {
      if (c.url.indexOf(self.registration.scope) === 0) {
        await c.navigate(target).catch(() => {});
        return c.focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});
