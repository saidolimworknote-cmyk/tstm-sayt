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
| Parol koddami? | **Yo'q.** Barcha maxfiy qiymatlar `backend/config.php` da, u git'ga tushmaydi (`.gitignore`) va veb orqali ochilmaydi (`.htaccess`) |
| Minimal uzunlik | 12 belgi, tekshiruv **serverda** (`api.php` → `change_password`) |
| Brute-force himoyasi | IP bo'yicha 5 xato urinishdan keyin 10 daqiqa blok (`login_attempts` jadvali) |
| Sessiya | PHP sessiyasi; kirishda `session_regenerate_id(true)` — sessiya fiksatsiyasiga qarshi |
| Cookie | `HttpOnly`, `SameSite=Lax`, HTTPS'da avtomatik `Secure` |
| Ikki bosqichli autentifikatsiya (2FA) | Ixtiyoriy, TOTP (RFC 6238, 30s/6 xona) — istalgan standart autentifikator ilovasi (Google Authenticator, Authy va h.k.) bilan ishlaydi. Yoqish/o'chirish: admin panel → Sozlamalar → Xavfsizlik |

Parol xeshi va admin login nomi **hech qachon** klientga yuborilmaydi —
`backend/db.php` → `db_load_all()` ga qarang. Xuddi shu qoida 2FA maxfiy
kalitiga (`totp_secret`) ham tegishli: u faqat sozlash paytida (`2fa_setup`)
bir marta ADMIN SESSIYASIGA qaytariladi, boshqa hech qanday javobda
ko'rinmaydi.

2FA ikki bosqichli kirish oqimi bilan ishlaydi: parol to'g'ri bo'lsa-da, 2FA
yoqilgan bo'lsa sessiya HALI admin deb belgilanmaydi — faqat 5 daqiqalik
oraliq holat (`login_2fa` amali kod so'raydi) saqlanadi. Kod ham, zaxira kod
ham xuddi parol kabi bir xil IP-bo'yicha brute-force hisoblagichi ostida
(5 urinish → 10 daqiqa blok). Telefon yo'qolgan holat uchun 2FA yoqilganda
8 ta bir martalik zaxira kod beriladi (faqat o'sha daqiqada, ochiq matnda —
bazada faqat SHA-256 xeshi saqlanadi, ishlatilgach darhol bekor qilinadi).

### 1.1. Ko'p hisobli kirish — rollar (2026-09-02)

Ikki turdagi hisob bor, ikkalasi ham bir xil `login`/`login_2fa` oqimidan
o'tadi:

| | Asosiy administrator | Xodim hisobi |
|---|---|---|
| Qayerda | `auth` jadvali, yagona qator (id=1) | `users` jadvali (admin panel → Foydalanuvchilar) |
| Rol | Har doim `admin`, o'zgartirib bo'lmaydi | Rol ustunidan: Administrator/Muharrir/Moderator |
| Yaratish/o'chirish | Yo'q — bootstrap hisobi, doim mavjud | Admin panelda, faqat admin roli |
| Parol o'rnatish | O'zi, joriy parolni bilib (`change_password`) | Admin tomonidan (`account_set_password`) — birinchi marta shu orqali, aks holda parolsiz kirib bo'lmaydi |
| 2FA | O'zi yoqadi/o'chiradi | O'zi yoqadi/o'chiradi; admin majburan o'chira oladi (`account_reset_2fa`, telefon yo'qolib zaxira kod ham tugagan holat uchun) |

**Ruxsat darajalari** (`api.php` → `require_role()`, standart — noma'lum
rolga/kolleksiyaga eng kam huquq beriladi):

| Rol | Kirish |
|---|---|
| `admin` | Hammasi: sozlamalar, tiklash, foydalanuvchilar, audit, xatoliklar, push, barcha kontent |
| `editor` (Muharrir) | Kontent kolleksiyalari (yangilik, tadbir, ekspert, nashr va h.k.) + murojaat/obunachilar |
| `moderator` | Faqat murojaat/obunachilarni belgilash-o'chirish |

Interfeys darajasida (`admin-ui.js` → `canAccess()`) ruxsat yo'q bo'limlar
yon menyudan yashiriladi va to'g'ridan-to'g'ri manzil bilan kirilsa ham
(masalan `#/settings`) boshqaruv paneliga qaytariladi — lekin bu FAQAT
qulaylik uchun, haqiqiy tekshiruv har doim serverda.

`users` jadvalidagi `password_hash`/`totp_*` ustunlari `$SCHEMA`da ATAYLAB
yo'q, shuning uchun umumiy `coll_upsert`/`db_export` orqali ular hech qachon
o'qilmaydi/yozilmaydi va klientga hech qachon chiqmaydi — xuddi asosiy
administratorning parol xeshi kabi.

## 2. Ruxsatlar va maxfiylik

`api.php` dagi har bir yozuv amali `require_auth()` va `require_csrf()` bilan
himoyalangan; ko'pchiligi (kontent kolleksiyalari, sozlamalar, tiklash,
foydalanuvchilar) qo'shimcha `require_role()` bilan ham — 1.1-bo'limga
qarang. Ommaviy (autentifikatsiyasiz) amallar faqat: `load`, `message`,
`subscribe`, `view`, `views`, `csrf`, `session`.

**Shaxsiy ma'lumot ajratilgan.** `load` amali ommaviy, lekin quyidagi bo'limlar
faqat tizimga kirgan adminga to'liq qaytadi, boshqalarga **bo'sh massiv**:

- `messages` — fuqarolar murojaatlari
- `subscribers` — obunachilar e-pochtasi
- `users` — admin foydalanuvchilar

Ro'yxat: `backend/db.php` → `$PRIVATE_COLLS`. Yangi shaxsiy bo'lim qo'shilsa,
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
| Hujjat | Kengaytma/MIME'ga ishonilmaydi — **fayl imzosi (magic bytes)** tekshiriladi: `%PDF-`, OLE2, ZIP; ≤ 30 MB; **antivirus (VirusTotal, ixtiyoriy)** — quyiga qarang |
| Infografika (HTML) | ≤ 3 MB |

Fayl nomini foydalanuvchi belgilamaydi — server `img_<sana>_<hash>.<ext>`
ko'rinishida o'zi yaratadi (yo'l bo'ylab chiqish — path traversal — mumkin emas).

### 6.1. Antivirus (VirusTotal, ixtiyoriy — 2026-09-02)

`backend/config.php`da `virustotal_api_key` berilgan bo'lsa, har bir yuklangan
PDF/Word hujjat saqlanishdan OLDIN VirusTotal'ga yuboriladi
(`backend/virustotal.php` → `vt_scan_file()`). Natija:

- **Zararli topilsa** — fayl saqlanmaydi, `422 malicious_file` qaytadi,
  audit jurnaliga `upload_blocked` yozuvi tushadi.
- **Tekshiruv vaqt ichida (25s) tugamasa yoki VirusTotal ishlamasa** — fayl
  baribir qabul qilinadi (imzo tekshiruvi baribir o'tgan), lekin
  "Xatoliklar" jurnaliga ogohlantirish yoziladi. Tashqi xizmatning
  sekinligi/ishdan chiqishi butun yuklash funksiyasini to'xtatib
  qo'ymasligi kerak.
- **Kalit berilmagan bo'lsa** — bu bosqich sezilmay o'tkazib yuboriladi,
  faqat yuqoridagi imzo tekshiruvi ishlaydi (standart holat).

Rasm yuklashda ISHLATILMAYDI — VirusTotal bepul limiti (4 so'rov/daqiqa) tez
tugab qolardi, rasm esa hujjatga qaraganda ancha ko'p yuklanadi. Rasmlar
uchun asosiy himoya baribir kifoya: qat'iy MIME tekshiruvi, SVG rad etilishi,
`uploads/`da PHP bajarilmasligi.

`uploads/.htaccess`:
- PHP dvigateli o'chirilgan, skript kengaytmalari bloklangan
- yuklangan HTML fayllarga `Content-Security-Policy: sandbox` beriladi —
  fayl **alohida (opaque) origin**ga tushadi va saytning cookie'siga,
  `localStorage`iga va API'siga tegolmaydi

## 7. Content-Security-Policy

Sayt bo'ylab CSP `.htaccess` da. **`script-src` da `'unsafe-inline'` ham,
`'unsafe-eval'` ham YO'Q** — barcha sahifa skriptlari alohida `.js` fayllarga
ko'chirilgan (`page-*.js`), inline hodisa handlerlari (`onclick=`) hodisa
delegatsiyasiga o'tkazilgan. **`style-src`da ham `'unsafe-inline'` YO'Q**
(2026-08-03'dan beri) — barcha inline `style=""` atributlari va `<style>`
bloklari tashqi CSS fayllarga yoki `.style` DOM API'ga ko'chirilgan; admin
panel ham xuddi shu qat'iy qoida ostida (qarang: `.htaccess`dagi CSP
sarlavhasi yonidagi izoh).

```
default-src 'self';
script-src  'self' + Google Translate hostlari;
style-src   'self' + Google (Translate vidjeti uchun);
font-src    'self' data:;
img-src     'self' data: blob: + Google (xarita/Translate);
frame-src   'self' + YouTube (faqat youtube-nocookie.com), Google Maps;
connect-src 'self' + translate.googleapis.com;
object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'
```

> Shriftlar 2026-08-11'dan o'z serverimizda (`fonts/*.woff2`) — CSP'da Google
> Fonts umuman yo'q. YouTube video muqovalari ham server orqali uzatiladi
> (`backend/thumbs.php`), shuning uchun `img-src`da YouTube domenlari yo'q —
> tashrifchi "play" bosmaguncha YouTube'ga umuman murojaat qilinmaydi.

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

## 11. robots.txt — bu himoya EMAS

Tez-tez uchraydigan tushunmovchilik: internetdagi maslahatlarda «himoya» sifatida
quyidagiga o'xshash namuna tarqalgan:

```
User-agent: *
Disallow: /admin/
Disallow: /private-files/
Disallow: /drafts/
```

**Bu himoya emas.** `robots.txt` — qidiruv robotlariga *iltimos*, to'siq emas:

| Nima qiladi | Nima QILMAYDI |
|-------------|---------------|
| Halol robotlarga (Google, Yandex) "bu yerni indekslama" deydi | Kirishni **to'smaydi** — manzilni brauzerga yozgan har kim ochadi |
| SEO gigiyenasi: keraksiz sahifalar indeksda chiqmaydi | Yomon niyatli botni **to'xtatmaydi** — u e'tiborsiz qoldiradi |

Bundan tashqari `robots.txt` **har kimga ochiq** (`saytingiz.uz/robots.txt`).
Maxfiy yo'lni u yerga yozish uni yashirmaydi — aksincha, hujumchiga tayyor
ro'yxat berib qo'yadi. Buni pentestchilar birinchi navbatda o'qiydi.

### Bu loyihada haqiqiy himoya qanday qurilgan

| Nima himoyalangan | Qanday | Tekshiruv |
|-------------------|--------|-----------|
| `backend/` (config.php, db.php, seed.php) | `.htaccess` → **404** (butun papka) va qo'shimcha ravishda fayl nomi bo'yicha **403** | `curl -I .../backend/config.php` |
| `*.json` (kesh, ma'lumot), `*.md`, `*.log`, `*.bak` | `.htaccess` → **403** | `curl -I .../cache_public.json` |
| Admin amallari (audit, xatoliklar, CRUD) | Sessiya + CSRF → **401/403** | `curl .../api.php?action=audit_log` |
| Fuqaro murojaatlari, obunachilar, foydalanuvchilar | `$PRIVATE_COLLS` — ommaviy API'da **bo'sh** | 2-bo'limga qarang |
| `admin.html` qidiruv natijalarida chiqmasligi | `X-Robots-Tag: noindex` (HTTP sarlavhasi) | `curl -I .../admin.html` |
| `uploads/` ichida kod ishga tushishi | `uploads/.htaccess` — PHP o'chirilgan, CSP sandbox | 6-bo'limga qarang |

> **Nega `X-Robots-Tag` robots.txt dan kuchli:** `robots.txt` faqat sahifani
> **o'qishni** (crawl) to'xtatadi. Agar boshqa saytda admin sahifasiga havola
> bo'lsa, Google uni o'qimasdan turib ham manzilni natijalarga qo'shishi mumkin.
> `noindex` sarlavhasi esa indeksdan butunlay chiqaradi.

### `uploads/` ataylab ochiq

Ilgari `robots.txt` da `Disallow: /uploads/` bor edi. U olib tashlandi: markaz
nashrlari (PDF/Word) o'sha papkada saqlanadi va ularni to'sish markazning asosiy
vazifasiga — tadqiqotlarni jamoatchilikka yetkazishga — qarshi ishlardi
(hujjatlar Google'da topilmay qolardi).

Bu xavfsiz, chunki `uploads/` da **maxfiy ma'lumot saqlanmaydi**: murojaatlar,
obunachilar va foydalanuvchilar bazada turadi. Agar kelajakda u yerga ichki
hujjat qo'yish kerak bo'lsa — uni `uploads/` ga **umuman qo'ymaslik** kerak,
`robots.txt` ga yozish yetarli emas.

## 12. Ma'lum cheklovlar

Halol bo'lish uchun — hozircha bajarilmagan yoki to'liq emas, lekin bilib
turilgan narsalar:

1. **VirusTotal API kaliti standart holatda bo'sh** (6.1-bo'lim) — kalit
   qo'yilmaguncha yuklangan hujjatlar faqat imzo (magic bytes) bo'yicha
   tekshiriladi, haqiqiy antivirus skaneri ishlamaydi. Bepul kalit olish va
   `backend/config.php`ga qo'yish — sayt egasining o'zi bajaradigan qadam
   (`config.sample.php`da yo'riqnoma bor).
2. **ClamAV integratsiyasi yo'q** — VirusTotal o'rniga/ustiga mahalliy
   skaner kerak bo'lsa, bu hosting `shell_exec` yoki ClamAV daemon'ga
   ruxsat berishini talab qiladi (ko'p shared hosting bermaydi) — hozircha
   amalga oshirilmagan.

Bajarilgan (avval shu yerda ro'yxatda edi):

- ~~`style-src 'unsafe-inline'`~~ — 2026-08-03'da olib tashlangan (7-bo'lim).
- ~~2FA yo'q~~ — 2026-09-02'da qo'shildi (1-bo'lim): TOTP, ixtiyoriy,
  admin panel → Sozlamalar → Xavfsizlik orqali yoqiladi.
- ~~Ko'p foydalanuvchili rollar yo'q~~ — 2026-09-02'da qo'shildi (1.1-bo'lim):
  Administrator/Muharrir/Moderator, admin panel → Foydalanuvchilar orqali
  boshqariladi.
- ~~Yuklangan fayllarga antivirus tekshiruvi yo'q~~ — 2026-09-02'da
  VirusTotal integratsiyasi qo'shildi (6.1-bo'lim), ixtiyoriy (API kalit
  bilan yoqiladi).
