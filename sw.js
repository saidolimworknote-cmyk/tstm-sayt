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
  uz: { title: 'Markazda yangilik', body: 'Yangi materialni o‘qish uchun bosing' },
  ru: { title: 'Новость центра', body: 'Нажмите, чтобы прочитать' },
  en: { title: 'Center update', body: 'Tap to read the latest' }
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
      const news = (data.news || [])
        .filter(n => n && n.status === 'published')
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
      const n = news[0];
      if (n) {
        title = pick(n.title, lang);
        body = pick(n.excerpt, lang) || pick(n.category, lang) || '';
        url = 'yangilik.html?id=' + encodeURIComponent(n.id);
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
