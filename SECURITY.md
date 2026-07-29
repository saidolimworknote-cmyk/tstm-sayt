# TSTM — xavfsizlik arxitekturasi

Bu hujjat loyihada qo'llanilgan himoya choralarini va ularning kodda qayerda
joylashganini tavsiflaydi. O'rnatish qadamlari: [DEPLOY.md](DEPLOY.md)

**Texnologiya:** PHP 8 + MySQL/MariaDB (PDO), sof JavaScript (framework yo'q),
Apache. Server tomonda shablon dvigateli yo'q — sahifalar statik HTML, kontent
`api.php` orqali JSON ko'rinishida olinadi.

---

## 1. Autentifikatsiya

| Chora | Amalga oshirish |
|---|---|
| Parol saqlash | `password_hash(PASSWORD_DEFAULT)` — bcrypt. Ochiq parol hech qayerda saqlanmaydi |
| Parol tekshirish | `password_verify()` — vaqt bo'yicha barqaror taqqoslash |
| Parol koddami? | **Yo'q.** Barcha maxfiy qiymatlar `config.php` da, u git'ga tushmaydi (`.gitignore`) va veb orqali ochilmaydi (`.htaccess`) |
| Minimal uzunlik | 12 belgi, tekshiruv **serverda** (`api.php` → `change_password`) |
| Brute-force himoyasi | IP bo'yicha 5 xato urinishdan keyin 10 daqiqa blok (`login_attempts` jadvali) |
| Sessiya | PHP sessiyasi; kirishda `session_regenerate_id(true)` — sessiya fiksatsiyasiga qarshi |
| Cookie | `HttpOnly`, `SameSite=Lax`, HTTPS'da avtomatik `Secure` |

Parol xeshi va admin login nomi **hech qachon** klientga yuborilmaydi —
`db.php` → `db_load_all()` ga qarang.

## 2. Ruxsatlar va maxfiylik

`api.php` dagi har bir yozuv amali `require_auth()` va `require_csrf()` bilan
himoyalangan. Ommaviy (autentifikatsiyasiz) amallar faqat: `load`, `message`,
`subscribe`, `view`, `views`, `csrf`, `session`.

**Shaxsiy ma'lumot ajratilgan.** `load` amali ommaviy, lekin quyidagi bo'limlar
faqat tizimga kirgan adminga to'liq qaytadi, boshqalarga **bo'sh massiv**:

- `messages` — fuqarolar murojaatlari
- `subscribers` — obunachilar e-pochtasi
- `users` — admin foydalanuvchilar

Ro'yxat: `db.php` → `$PRIVATE_COLLS`. Yangi shaxsiy bo'lim qo'shilsa,
u ham shu ro'yxatga kiritilishi shart.

## 3. SQL in'yeksiya

Barcha so'rovlar PDO **prepared statement** orqali, `ATTR_EMULATE_PREPARES =
false`. Foydalanuvchi ma'lumoti hech qachon SQL matniga qo'shilmaydi.

Jadval nomlari SQL'ga qo'shiladi, lekin ular faqat kodda e'lon qilingan
`$SCHEMA` massividan olinadi va kirish qiymati avval `isset($SCHEMA[$coll])`
bilan tekshiriladi — tashqaridan ixtiyoriy nom kelolmaydi.

## 4. XSS (skript in'yeksiyasi)

Uch qatlamli himoya:

**a) Matn chiqarish.** Barcha matn `esc()` orqali chiqadi (`&`, `<`, `>`, `"`).

**b) URL chiqarish.** `src` / `href` atributiga tushadigan har bir saqlangan
qiymat `safeUrl()` dan o'tadi (`site-common.js`, `admin-ui.js`):

- `javascript:`, `vbscript:`, `file:` sxemalari bloklanadi
- rasm bo'lmagan `data:` bloklanadi
- ko'rinmas belgilar bilan niqoblash (`java\tscript:`) hisobga olingan
- natija `esc()` qilinadi — qiymat atributdan chiqib `onerror=` qo'sha olmaydi

**c) DOM API.** `data-*` atributidan o'qilgan qiymat **hech qachon** HTML
matniga qaytarilmaydi. `dataset` qiymatni dekodlangan holda beradi, ya'ni uni
`innerHTML` shabloniga qo'yish escape'ni bekor qilardi. Bunday joylarda
element `document.createElement` + `replaceChildren` bilan quriladi
(`page-media.js` — lightbox va video).

**Foydalanuvchi kiritmasi.** Murojaat va obuna shakllari serverda
`strip_tags()` + uzunlik chegarasi bilan tozalanadi, e-pochta
`FILTER_VALIDATE_EMAIL` bilan tekshiriladi.

## 5. CSRF

Sessiyaga bog'langan 32-baytli tasodifiy token (`random_bytes`). Har bir yozuv
so'rovi `X-CSRF-Token` sarlavhasi bilan keladi, server `hash_equals()` bilan
solishtiradi. Qo'shimcha qatlam: `SameSite=Lax` cookie'si begona saytdan
yuborilgan POST so'roviga umuman qo'shilmaydi.

## 6. Fayl yuklash

| Tur | Tekshiruv |
|---|---|
| Rasm | MIME `getimagesizefromstring()` bilan tasdiqlanadi; faqat png/jpg/webp/gif; **SVG ataylab rad etiladi** (ichida skript bo'lishi mumkin); ≤ 12 MB |
| Hujjat | Kengaytma/MIME'ga ishonilmaydi — **fayl imzosi (magic bytes)** tekshiriladi: `%PDF-`, OLE2, ZIP; ≤ 30 MB |
| Infografika (HTML) | ≤ 3 MB |

Fayl nomini foydalanuvchi belgilamaydi — server `img_<sana>_<hash>.<ext>`
ko'rinishida o'zi yaratadi (yo'l bo'ylab chiqish — path traversal — mumkin emas).

`uploads/.htaccess`:
- PHP dvigateli o'chirilgan, skript kengaytmalari bloklangan
- yuklangan HTML fayllarga `Content-Security-Policy: sandbox` beriladi —
  fayl **alohida (opaque) origin**ga tushadi va saytning cookie'siga,
  `localStorage`iga va API'siga tegolmaydi

## 7. Content-Security-Policy

Sayt bo'ylab CSP `.htaccess` da. **`script-src` da `'unsafe-inline'` ham,
`'unsafe-eval'` ham YO'Q** — barcha sahifa skriptlari alohida `.js` fayllarga
ko'chirilgan (`page-*.js`), inline hodisa handlerlari (`onclick=`) hodisa
delegatsiyasiga o'tkazilgan.

```
default-src 'self';
script-src  'self' + Google Translate hostlari;
style-src   'self' 'unsafe-inline' + Google Fonts;
img-src     'self' data: blob: + YouTube/Google;
frame-src   'self' + YouTube, Google Maps;
connect-src 'self' + translate.googleapis.com;
object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'
```

> `style-src` da `'unsafe-inline'` qolgan, chunki sahifalarda inline `style=""`
> atributlari ko'p. Bu XSS uchun yo'l ochmaydi (CSS kod ishga tushira olmaydi),
> faqat vizual buzish xavfi bor — u ham `script-src` yopiq bo'lgani uchun
> amalda foydasiz.

Boshqa sarlavhalar: `X-Content-Type-Options: nosniff`,
`X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy` (geolokatsiya/mikrofon/kamera o'chirilgan).

## 8. Spam va resurs himoyasi

| Amal | Chegara |
|---|---|
| Murojaat yuborish | 1 IP — 10 daqiqada 5 ta |
| Obuna bo'lish | 1 IP — 10 daqiqada 3 ta |
| Kirish urinishi | 1 IP — 5 ta, so'ng 10 daqiqa blok |
| Ko'rishlar hisoblagichi | faqat bazada **mavjud** yozuv uchun ishlaydi |

Jadvallar cheksiz o'smaydi: `messages` — oxirgi 5000 ta, `audit_log` — 180 kun,
`msg_throttle` — 1 kun, `views` — mavjud yozuvlar bilan cheklangan.

## 9. Audit izi

`audit_log` jadvali har bir admin amalini yozadi: `action`, `coll`, `item_id`,
`ip`, `at`. Kirishlar, o'zgartirishlar, o'chirishlar va parol almashtirish
qamrab olingan.

## 10. Klient tomonga ishonmaslik (F12 / DevTools masalasi)

**Savol:** brauzerning ishlab chiquvchi vositalari (F12) orqali sahifa kodini
o'zgartirib qoidalarni chetlab o'tish mumkinmi?

**Javob:** yo'q — chunki loyihada **hech qanday qaror klient tomonda qabul
qilinmaydi**. Brauzerdagi JavaScript faqat serverdan kelgan ma'lumotni
ko'rsatadi. Har bir tekshiruv serverda takrorlanadi:

| Klient nima "aytishi" mumkin | Server nima qiladi |
|---|---|
| «men adminman» (sessionStorage) | PHP sessiyasini tekshiradi — mos kelmasa 401 |
| «bu yozuvni saqla» | sessiya + CSRF tokenini talab qiladi |
| «menga murojaatlar ro'yxatini ber» | sessiyasiz bo'sh massiv qaytaradi |
| «parol to'g'ri edi» | e'tiborga olinmaydi; parol serverda bcrypt bilan solishtiriladi |
| «bu maqola 10 000 marta ko'rilgan» | IP bo'yicha tezlik chegarasi qo'llaydi |
| «bu foydalanuvchining paroli — X» | `save` amalida klient `auth` bloki butunlay tashlab yuboriladi |

**Tekshirilgan.** Hujum simulyatsiyasi o'tkazildi: brauzer konsolidan
`sessionStorage`ga admin bayrog'i qo'yildi. Natija — server sessiyani tan
olmadi, shaxsiy bo'limlar bo'sh keldi, parol xeshi chiqmadi, yozuv amali
haqiqiy CSRF tokeni bilan ham 401 qaytardi. Topilgan yagona kamchilik —
admin panelining bo'sh qobig'i ochilib qolishi — `Store.verifySession()`
bilan yopildi: panel endi server tasdiqlagandan keyingina ko'rsatiladi.

### F12 ATAYLAB bloklanmagan

Loyihada o'ng tugmani bloklash, `debugger` tuzoqlari yoki klavish ushlash
kabi «DevTools himoyasi» **qasddan qo'llanilmagan**. Sabablari:

1. **Samarasiz.** Bunday himoya JavaScriptni o'chirish, `curl`/Postman
   ishlatish yoki boshqa brauzerdan kirish bilan bir necha soniyada chetlab
   o'tiladi. U faqat oddiy foydalanuvchini bezovta qiladi, hujumchini emas.
2. **Zararli.** Ekran o'quvchi va boshqa yordamchi texnologiyalar shu
   mexanizmlarga tayanadi — ularni to'sish davlat resurslariga qo'yiladigan
   qulaylik (accessibility) talabini buzadi.
3. **Noto'g'ri joyda himoya.** Kod foydalanuvchining qurilmasida ishlaydi,
   ya'ni u yerda hech narsani sir tutib bo'lmaydi. Yagona ishonchli chegara —
   server. Klientni «qulflashga» sarflangan kuch shu chegarani mustahkamlashga
   sarflangani ma'qul.

> Amaliy misol: agar sayt «kursni tugatdim» degan xabarni klientdan qabul
> qilib sertifikat bersa, uni F12 bloklash qutqarmaydi — foydalanuvchi
> so'rovni to'g'ridan-to'g'ri yuboradi. To'g'ri yechim — tugallanishni
> serverda qayd etish. Shu loyihada barcha holat ma'lumotlari (kontent,
> huquqlar, hisoblagichlar) faqat serverda va MySQL'da saqlanadi.

## 11. Ma'lum cheklovlar

Halol bo'lish uchun — hozircha bajarilmagan, lekin bilib turilgan narsalar:

1. **`style-src 'unsafe-inline'`** — 7-bo'limga qarang. Olib tashlash uchun
   yuzlab inline `style=""` atributini CSS sinflariga ko'chirish kerak.
2. **Ko'p foydalanuvchili rollar yo'q** — bitta admin hisobi. `users` jadvali
   bor, lekin u ma'lumotnoma sifatida ishlatiladi, kirish huquqini bermaydi.
3. **Ikki bosqichli autentifikatsiya (2FA) yo'q.**
4. **Fayllarga antivirus tekshiruvi yo'q** — yuklangan PDF/Word fayllar imzosi
   bo'yicha tekshiriladi, lekin ichidagi zararli makros aniqlanmaydi.
