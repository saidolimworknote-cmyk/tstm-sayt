# TSTM — Tashqi siyosiy tadqiqotlar va xalqaro tashabbuslar markazi sayti

Sayt + boshqaruv paneli (admin). XAMPP'da ishlash uchun PHP backend bilan.

## 🗂️ Loyiha tuzilishi

2026-08-20 da fayllar papkalarga ajratildi (ilgari 104 tasi ham ildizda yotardi).

```
sayt/
├── index.html            bosh sahifa
├── *.html                ichki sahifalar (28 ta) — bularning nomi = sayt MANZILI
│
├── api.php               yagona backend kirish nuqtasi (?action=...)
├── db.php                MySQL qatlami: $SCHEMA, jadvallar, kesh
├── seed.php              bo'sh bazaning boshlang'ich kontenti
├── config.php            baza logini/paroli (git'ga TUSHMAYDI)
│
├── css/                  barcha uslublar (19 fayl)
├── js/                   barcha skriptlar (26 fayl)
├── img/                  logotiplar (6 fayl)
├── fonts/                Montserrat (woff2)
├── uploads/              admin yuklagan rasm va hujjatlar
│
├── docs/                 SECURITY.md · DEPLOY.md · TZ.md · TOPSHIRISH.md
├── tools/                deploy.ps1 · backup.ps1 · restore.ps1 · koch.ps1 · ORNAT.*
├── tests/                smoke.ps1 (avtomatik tekshiruv)
├── backups/              SQL zaxiralar (git'ga TUSHMAYDI)
│
├── .htaccess             butun xavfsizlik qatlami (CSP, to'siqlar, gzip, kesh)
├── sw.js                 Service Worker
├── robots.txt  sitemap.xml
└── README.md             shu fayl
```

### Nega ayrim fayllar ildizda QOLDI

Bular papkaga ko'chirilsa sayt buziladi — ko'chirmang:

| Fayl | Sabab |
|------|-------|
| `index.html` | `.htaccess` dagi `DirectoryIndex` uni ildizdan qidiradi |
| `*.html` (sahifalar) | Fayl nomi = sayt manzili. Ko'chirilsa barcha havola, `sitemap.xml` va qidiruv indeksi buziladi |
| `sw.js` | Service Worker faqat O'ZI turgan papka va undan pastini boshqara oladi. `js/` ga ko'chsa push-bildirishnoma butun sayt uchun ishlamay qoladi |
| `api.php`, `db.php`, `seed.php`, `config.php` | Butun frontend `api.php?action=...` ga murojaat qiladi |
| `robots.txt`, `sitemap.xml` | Standart bo'yicha faqat ildizda o'qiladi |
| `.htaccess` | Apache uni papka bo'yicha qo'llaydi |
| `uploads/` | Yuklangan fayl yo'llari BAZADA `uploads/...` ko'rinishida saqlangan |

### Qayerni o'zgartirsam nima buziladi

| O'zgartirdim | Yodda tuting |
|--------------|--------------|
| `css/*.css` yoki `js/*.js` | HTML'dagi `?v=N` raqamini oshiring, aks holda tashrifchida eski nusxa qoladi |
| `css/print.css` | Uning versiyasi HTML'da EMAS — `js/site-common.js` dagi `abs('css/print.css?v=N')` da |
| `js/site-common.js` → `NAV` | Bosh sahifa menyusi `index.html` ichida QO'LDA yozilgan — ikkalasini birga yangilang |
| `js/i18n.js` | Bosh sahifa ham, ichki sahifalar ham shu fayldan matn oladi |
| `css/site.css` | Faqat ichki sahifalar. Bosh sahifa — `css/home.css` (mustaqil nusxa) |
| `db.php` → `$SCHEMA` | Yangi ustun qo'shsangiz `CREATE TABLE` va `migrate()` ni ham yangilang |
| `tools/` yoki `docs/` | Bu papkalar serverga CHIQMAYDI (`deploy.ps1` ularni chetlab o'tadi) |

## 📦 Tarkibi
- **index.html** — saytning bosh sahifasi (2026-08-10 gacha `Bosh sahifa - Hi-Fi.html`
  deb atalardi; eski nom va uni yo'naltiruvchi `index.php` olib tashlangan)
- Ichki sahifalar: `yangiliklar.html`, `yangilik.html`, `tadbirlar.html`, `nashrlar.html`,
  `tadqiqotlar.html`, `biz-kimmiz.html`, `rahbariyat.html`, `ekspertlar.html`, `hamkorlar.html`,
  `media.html`, `aloqa.html`,
  `oav.html` + `sharh.html` — «Bizning ekspertlar OAVlarda» (ro'yxat va bitta sharh;
  admin'da **Ekspertlar OAVda** bo'limi, `media_posts` jadvali)
- `tadbir.html` — bitta voqeaning doimiy sahifasi (`tadbir.html?id=...`): to'liq
  matn, sana/vaqt/manzil jadvali, chop etish, havola, ulashish va «Taqvimga
  qo'shish» (.ics fayli brauzerda yasaladi). Ilgari voqealar faqat ro'yxatlarda
  ko'rinardi va tavsif 150 belgida kesilib, hech qachon to'liq o'qilmasdi.
- `markaz-haqida.html` — **yo'naltiruvchi** sahifa (`biz-kimmiz.html` ga). 2026-08-19 da
  «Markaz haqida» menyu bandi sahifasiz guruhga aylantirilgan, hub sahifaning butun
  kontenti esa `biz-kimmiz.html` ga ko'chirilgan. Fayl o'chirilmadi — eski havolalar
  va qidiruv indeksi shu manzilga ishora qiladi (batafsili faylning o'zida yozilgan).
- `maqolalar.html`, `maruzalar.html`, `tahlillar.html`, `kitoblar.html` — «Tadqiqotlar»
  menyusining alohida sahifalari (2026-08-12 gacha bu menyu «Tahlillar» deb
  atalgan va `hisobotlar.html` bo'lgan — u endi `tahlillar.html`). To'rttasi ham
  `page-nashrlar.js` ni ishlatadi; sahifa qaysi bo'lim ekani
  `<main data-pkind="articles">` atributida yoziladi (CSP inline skriptga
  ruxsat bermagani uchun sozlama DOM orqali uzatiladi). Atributga turlar
  ro'yxati EMAS, bo'lim identifikatori beriladi — `articles`, `lectures`,
  `reports`, `books`. Qaysi `publications.type` qiymatlari qaysi bo'limga
  tushishi `js/content-kinds.js` dagi `PUB_KINDS` jadvalida, ya'ni BITTA joyda
  turadi (aniq nom bo'yicha moslik, topilmasa — regex bo'yicha).
- `rahbariyat.html` va `ekspertlar.html` — ikkalasi `page-rahbariyat.js` ni
  ishlatadi. Kimni ko'rsatish `<div id="grid" data-kind="Rahbariyat">` orqali
  hal qilinadi; xodimning bo'limi admin'da **Ekspertlar → Bo'lim** maydonida
  belgilanadi (`experts.kind` ustuni; bo'sh qolsa — ekspert).
- **admin.html** — boshqaruv paneli (login bilan)
- `api.php` — PHP backend (ma'lumotlarni **MySQL/MariaDB**'da saqlaydi)
- `db.php` — MySQL qatlami (PDO, jadval sxemasi, avtomatik yaratish)
- `config.sample.php` — maxfiy sozlamalar namunasi (baza logini/paroli).
  Undan `config.php` yasaladi; `config.php` git'ga **tushmaydi**
- `page-*.js` — har bir sahifaning skripti (CSP talabi bilan HTML'dan ajratilgan)
- `subscribe.js` + `subscribe.css` — obuna (push-bildirishnoma) oynasi; **barcha**
  sahifaga ulanadi, jumladan bosh sahifaga ham
- `seed.php` — bo'sh bazani to'ldiruvchi standart boshlang'ich kontent
- `.htaccess` — Apache sozlamalari (`DirectoryIndex index.html index.php`, ya'ni
  papka manzili to'g'ridan-to'g'ri `index.html` ni ochadi — alohida yo'naltiruvchi
  `index.php` YO'Q va kerak emas)
- `robots.txt`, `sitemap.xml` — qidiruv tizimlari (SEO) uchun
- `js/`, `css/`, `img/` — kod va resurslar (qarang: yuqoridagi "Loyiha tuzilishi")

> **Eslatma (SEO):** `robots.txt` va `sitemap.xml` ichida `SIZNING-DOMENINGIZ.uz`
> placeholderi bor — hostingga chiqarganingizda uni haqiqiy domeningizga almashtiring.

---

## 🚀 XAMPP'da ishga tushirish

1. **XAMPP**'ni o'rnating, **Apache** va **MySQL**'ni ishga tushiring (Start).
2. Loyiha papkasini XAMPP'ning **`htdocs`** papkasiga qo'ying. Ikki yo'l bor:
   - **ko'chirish:** `C:\xampp\htdocs\sayt`;
   - **junction (tavsiya etiladi):** papka ish stolida qolib, htdocs'da unga
     ishorat turadi — bitta nusxa bo'lgani uchun tahrir darhol saytda ko'rinadi:
     ```
     mklink /J C:\xampp\htdocs\sayt C:\Users\<siz>\Desktop\sayt
     ```
     (`mklink /J` uchun administrator huquqi shart emas.)
3. *(Ixtiyoriy)* `config.sample.php` ni `config.php` deb nusxalang. Mahalliy
   XAMPP uchun shart emas — `config.php` bo'lmasa standart qiymatlar
   (`root`, parolsiz) ishlatiladi.
4. Brauzerda oching:
   - **Sayt:** `http://localhost/sayt/`
   - **Admin panel:** `http://localhost/sayt/admin.html`

> Manzilning oxirgi qismi — htdocs ichidagi **papka nomi**. Yuqoridagi misolda u
> `sayt`; boshqacha nomlasangiz manzil ham shunga qarab o'zgaradi.
> `tools\ISHGA_TUSHIRISH.bat` `/sayt/` ni ochadi.

---

## 🔐 Admin panelga kirish

**Manzil:** `http://localhost/sayt/admin.html` · **Login:** `markaz_admini`

Parol **kodda saqlanmaydi** va bu hujjatda ham yozilmaydi — u serverda faqat
bcrypt xesh holida (`auth` jadvali) turadi. Parolni saytga mas'ul shaxsdan
so'rang.

**Parolni almashtirish:** Admin panel → Sozlamalar → «Xavfsizlik — kirish
paroli». Kamida 12 belgi.

**Butunlay yangi (bo'sh) bazani birinchi marta ochish:** `config.php` dagi
`admin_bootstrap_password` ga vaqtincha kuchli parol yozing, tizimga kiring
(parol avtomatik xeshlanib saqlanadi), so'ng bu qatorni qaytib bo'shating.

---

## 💾 Ma'lumotlar qanday saqlanadi?

- PHP + MySQL (XAMPP) ishlaganda — barcha kontent **`tstm` MySQL bazasi**ga yoziladi.
  Admin'da qilingan har qanday o'zgarish **barcha tashrifchilarga** ko'rinadi.
- Baza va jadvallar **birinchi ochilishda avtomatik yaratiladi** (`db.php`) va
  `seed.php`dagi standart kontent bilan to'ldiriladi. Parol xeshi **bo'sh** qoladi —
  birinchi kirish `config.php` dagi `admin_bootstrap_password` orqali bo'ladi.
  > Ilgari bu yerda `data.json` dan import bo'lardi (MySQL'ga ko'chish yo'li).
  > 2026-08-07 da olib tashlandi: migratsiya 2026-07-29 da tugagan, fayl esa
  > 8-iyulda muzlab qolib, eskirgan kontentni va **almashtirilgan parolni**
  > tiklab yuborishi mumkin edi. Ma'lumotni tiklashning yagona to'g'ri yo'li —
  > `restore.ps1` (SQL zaxirasidan). Eski fayl `backups\legacy\` da arxivda.
- Ma'lumot bazasidan tashqari **hech qanday sozlash shart emas** — XAMPP'da MySQL
  ishlab tursa kifoya. Baza login/parolini `config.php` dan o'zgartiring
  (namunasi: `config.sample.php`).
- Agar fayllar PHP'siz (`file://`) ochilsa — ma'lumotlar brauzerning
  o'zida (localStorage) saqlanadi (faqat sinov uchun).

### Ma'lumotlarni saqlash — arxitektura
- Har bir yozuv **alohida** (granular) endpoint orqali saqlanadi (`upsert`/`remove`) —
  bir vaqtda ikki admin ishlaganda ma'lumot yo'qolmaydi (concurrency xavfsiz).
- Yozuv amallari **CSRF token** bilan himoyalangan; barcha so'rovlar PDO
  **prepared statement** va **tranzaksiya** orqali bajariladi (SQL-injection'dan xoli).

### Ma'lumotni boshlang'ich holatga qaytarish
Admin → Sozlamalar → "Barcha ma'lumotlarni tiklash" (parol saqlanadi).
Yoki bazani butunlay tozalash: `DROP DATABASE tstm;` — keyingi ochilishda qaytadan yaratiladi.

---

## 🖼️ Rasmlar
Rasmlar admin panel orqali yuklanadi va serverdagi **`uploads/`** papkasiga fayl qilib
saqlanadi (bazada faqat yo'li turadi). Katta fayllar uchun `.htaccess`'da yuklash
limiti 64MB qilib qo'yilgan. Faqat PNG/JPG/WEBP/GIF qabul qilinadi.

---

## 🌐 Tillar
Sayt 3 tilli: **UZ / RU / EN**. Har bir kontent admin panelda 3 tilda tahrirlanadi.

---

## 🗄️ Ma'lumotlar bazasi (MySQL)
- Baza nomi: **`tstm`** (avtomatik yaratiladi). Jadvallar: `news`, `media_posts`, `events`,
  `experts`, `publications`, `hero_slides`, `partners`, `pages`, `media`, `users`, `messages`,
  `settings`, `auth`, `views`, `login_attempts`, `audit_log`.
- **Yangi bo'lim qo'shish** (naqsh — `media_posts` shu tarzda qo'shilgan): `db.php` da
  `$SCHEMA` ga yozuv + `CREATE TABLE` + `$COLL_ORDER`; `admin-ui.js` da `C` konfiguratsiyasi
  + `NAV` guruhi; sayt tomonida sahifa va `page-*.js`. `api.php` ga tegish SHART EMAS —
  u hamma narsani `$SCHEMA` dan oladi. Kolleksiya kaliti faqat HARFLARDAN iborat bo'lsin
  (`mediaPosts`, `media_posts` emas) — ko'rishlar hisoblagichi kalitni `[^a-z]/i` bilan
  filtrlaydi.
- Ko'p tilli maydonlar (`title`, `body`, …) `LONGTEXT`da JSON sifatida, filtrlanadigan
  maydonlar (`status`, `date`, `category`, …) alohida ustunlarda **indeks** bilan saqlanadi.
- Baza login/parolini o'zgartirish: **`config.php`** (`db_host`, `db_name`, `db_user`,
  `db_pass`). Bu fayl git'ga tushmaydi; namunasi — `config.sample.php`.
- Jadvallar ro'yxatiga `subscribers` va `msg_throttle` ham kiradi.
- **Ustun qo'shish:** `db.php` da uchta joy — `$SCHEMA`, `CREATE TABLE` va
  `migrate()` ichidagi `ensure_cols()`. Uchinchisi mavjud bazalarni yangilaydi.
  Naqsh: `events.cover` (2026-08-19).

> ⚠️ **Kesh va sxema.** Ommaviy javob `cache_public.json` da keshlanadi va u
> odatda faqat admin kontentni o'zgartirganda yangilanadi. Jadvalga yangi ustun
> qo'shilganda esa kesh eski shaklni saqlab turadi va yangi maydon saytda «yo'q»
> bo'lib ko'rinardi. Shuning uchun `provision()` sxemani qayta qurgan joyda
> `cache_invalidate()` ham chaqiriladi (db.php o'zgarganda bir marta).

---

## 🔒 Xavfsizlik

To'liq tavsif — **[SECURITY.md](docs/SECURITY.md)** (arxitektura, himoya choralari,
ma'lum cheklovlar).

Hostingga chiqarish cheklisti — **[DEPLOY.md](docs/DEPLOY.md)** (baza foydalanuvchisi,
HTTPS/HSTS, fayl huquqlari, tekshiruv ro'yxati).

Qisqacha:

- Parol **koddan tashqarida** (`config.php`, git'ga tushmaydi), serverda bcrypt xesh
- Yozuv amallari: sessiya + **CSRF token**; barcha so'rovlar **PDO prepared statement**
- **CSP** yoqilgan — `script-src` da `'unsafe-inline'` va `'unsafe-eval'` yo'q
- `src`/`href` ga tushadigan barcha qiymatlar `safeUrl()` filtridan o'tadi
- Fuqarolar murojaatlari, obunachilar va foydalanuvchilar ommaviy API'da **bo'sh** qaytadi
- Login urinishlari cheklangan (5 xato → 10 daqiqa blok); aloqa formasi spamdan himoyalangan
- Rasm yuklash faqat PNG/JPG/WEBP/GIF (SVG ataylab o'chirilgan); hujjatlar **fayl imzosi** bo'yicha tekshiriladi
- `config.php`, `db.php`, `seed.php`, `*.json` — `.htaccess` orqali tashqaridan yopiq
- Admin amallari (kirish/chiqish, tahrir, o'chirish, **fayl yuklash**, parol almashtirish) `audit_log` jadvalida qayd etiladi

---

## 🔔 Bildirishnomaga obuna

Tashrifchi **e-pochta qoldirmaydi** — bitta tugma bosadi va brauzer o'zi xabar
beradi. Serverda shaxsiy ma'lumot saqlanmaydi.

**Qanday ishlaydi:**

1. Tashrifchi sahifaning ~40% ini o'qigach (yoki 25 soniyadan keyin) taklif
   oynasi chiqadi — «Obuna bo'lish» va «Keyinroq».
2. «Obuna bo'lish» bosilsa brauzerning o'z ruxsat oynasi chiqadi.
3. Ruxsat berilsa, `sw.js` (Service Worker) ro'yxatdan o'tadi va obuna
   `push_subs` jadvaliga yoziladi.
4. Admin panel → **Bildirishnoma** → «Yuborish». Server barcha obunachilarga
   "turtki" yuboradi, `sw.js` esa **eng so'nggi e'lon qilingan yangilikni**
   API'dan olib, tashrifchining tilida ko'rsatadi.

> Xabar matni yuborishdan oldin yozilmaydi — u yuborilgan paytda aniqlanadi.
> Shuning uchun tartib: avval yangilikni «e'lon qilingan» holatida saqlang,
> keyin yuboring.

**Taklif oynasi nega darhol chiqmaydi:** brauzer ruxsatini foydalanuvchi bir
marta rad etsa, uni qayta so'rab bo'lmaydi — u qo'lda sozlamalardan yoqishi
kerak bo'ladi. Shuning uchun avval o'z oynamizda tushuntiramiz va faqat rozi
bo'lgandagina brauzerga o'tkazamiz.

**Oyna kodi qayerda:** `subscribe.js` + `subscribe.css` — ikkalasi ham **barcha**
sahifaga ulanadi (bosh sahifa ham). Bosh sahifa `site-common.js`/`site.css` ni
yuklamaydi, shuning uchun oyna mantiqi ham, uslubi ham shu ikki mustaqil faylda
turadi. **Nusxa ko'chirmang** — ilgari bosh sahifada alohida nusxa bo'lgani
uchun push versiyasiga o'tilganda u yangilanmay qolgan va tashrifchi hamon eski
e-pochta so'raydigan oynani ko'rgan edi.

> ⚠️ **HTTPS majburiy.** Push API xavfsiz ulanishsiz ishlamaydi (`localhost` —
> ishlab chiqish uchun istisno). `http://` da obuna oynasi umuman ko'rinmaydi.

---

## 🩺 Diagnostika ("nima xato ketdi?")

Sayt o'zi xatolarni yig'adi va **sababini o'zbek tilida** tushuntiradi — F12 ochish shart emas.

**Panelni ochish** (pastki o'ng burchakda):

| Kim | Qanday |
|-----|--------|
| Administrator | Admin panelga kirgach avtomatik ko'rinadi |
| Ishlab chiquvchi | Istalgan sahifa manziliga `?debug=1` qo'shing — masalan `media.html?debug=1` |
| Oddiy tashrifchi | **Ko'rinmaydi** (lekin xatolar baribir jimgina yozib boriladi) |

`?debug=1` sessiya davomida eslab qolinadi; `?debug=0` o'chiradi.

**Nimalarni ushlaydi:** JS xatolari, ushlanmagan promise'lar, tarmoq xatolari
(fetch/XHR, 404, 401/403/500), yuklanmagan rasm/skript, `console` chiqishi va
serverdagi PHP xatolari.

**Har bir xatoda:** xabar, fayl va qator, **SABAB** va **YECHIM** tavsiyasi,
texnik tafsilot (stack). ⧉ tugmasi hammasini matn holida nusxalaydi.

**Tarixni ko'rish:** admin panel → **Xatoliklar**. Bir xil xato takrorlansa
yangi qator ochilmaydi — "N marta" hisoblagichi oshadi. Tuzatgach «Hal qilindi»
deb belgilash mumkin.

> Jurnalda **IP saqlanmaydi** va xato matnlari oddiy tashrifchiga hech qachon
> ko'rsatilmaydi (`error_reporting(0)` kuchda qoladi).

---

## 🧹 Kod sifati

```bash
npx eslint .              # JS  — 0 xato, 0 ogohlantirish
npx stylelint "css/*.css"     # CSS — 0 xato
```

Konfiguratsiyalar — `eslint.config.mjs` va `.stylelintrc.json`. Ikkalasi ham
**mustaqil**: hech qanday npm paketiga bog'liq emas (loyihada `package.json` va
build bosqichi yo'q).

Ikkala konfiguratsiya ham faqat **haqiqiy xato** ushlaydigan qoidalarni yoqadi.
Format didi ataylab tekshirilmaydi — CSS bu loyihada ixcham yoziladi (bitta
selektor = bitta qator), bo'sh `catch {}` esa «xatoga chidamli render» tamoyilining
bir qismi. Har bir o'chirilgan qoidaning sababi konfiguratsiya ichida izohlangan.

> ⚠️ `-webkit-backdrop-filter` va `-webkit-mask-image` prefikslarini **olib
> tashlamang** — Safari/iOS uchun hozir ham zarur, autoprefixer esa yo'q.

### Navigatsiya

Menyu 4 ta ochiluvchi band + «Aloqa» dan iborat. Manba — `site-common.js` dagi
`NAV` massivi; bosh sahifadagi menyu esa `index.html` ichida QO'LDA yozilgan
alohida nusxa (bosh sahifa `site-common.js` ni yuklamaydi) — **ikkalasini birga
yangilang**.

- **«Markaz haqida» bandi sahifa emas** (`NAV[].group === true`): bosilganda
  hech qayerga o'tmaydi, faqat ostidagi 4 bo'lim ochiladi. HTML'da u `<a>` emas,
  `<span role="button">` bo'lib chiziladi va `.item.is-group` sinfini oladi.
  Bosish mantiqi ikki joyda: `site-common.js` → `renderHeader` va
  `page-home.js` (bosh sahifa uchun nusxa).
- **Bo'lim ichi navigatsiyasi** (`.secnav`) — banner ostidagi yopishqoq qator:
  sahifasiz guruhning 4 sahifasi o'rtasida yurish uchun. `site-common.js` →
  `renderSectionNav` uni `NAV` dan o'zi quradi, HTML'ga qo'shish shart emas.
  Header balandligi `--hdr-h` o'zgaruvchisiga o'lchab yoziladi.

> ⚠️ `.secnav` yopishishi uchun `body.inner` da `overflow-x:clip` turadi
> (`overflow-x:hidden` skroll konteyner yaratib, `position:sticky` ni o'ldiradi).
> Bu qatorni `hidden` ga qaytarmang.

### Voqealar bo'limi — har bir sahifa o'z formatida

Beshta sahifa bitta skriptni (`page-tadbirlar.js`) ishlatadi, lekin **bir xil
ko'rinmaydi**: format `<main data-ekind="...">` atributida e'lon qilinadi
(CSP inline skriptga ruxsat bermaydi).

| Sahifa | `data-ekind` | Format | Nega shunday |
|--------|--------------|--------|--------------|
| `uchrashuvlar.html` | `meet` | rasmiy reyestr: `sana \| mavzu \| manzil` | Uchrashuv qayd etiladi, o'qilmaydi — sana bo'yicha kuzatish oson bo'lsin |
| `davra-suhbatlari.html` | `round` | muhokama kartalari (yirik mavzu + tavsif) | Bu yerda «nima haqida» muhimroq |
| `konferensiyalar.html` | `conf` | post kartalari, yangidan eskiga | Kelgusi/o'tgan AJRATILMAYDI (2026-08-20) — markaz bo'lajak yig'ilishlarni oldindan e'lon qilmaydi |
| `markaz-hayoti.html` | `life` | foto lenta | Ichki hayot — vizual janr |
| `tadbirlar.html` | *(yo'q)* | umumiy taqvim | Butun bo'lim bir joyda |

- Voqea turi (`events.type`) qaysi bo'limga tegishli ekani **bitta joyda**:
  `js/content-kinds.js` → `EVENT_KINDS`. `admin-ui.js` dagi tur ro'yxatiga yangi
  qiymat qo'shsangiz shu yerga ham qo'shing, aks holda voqea faqat
  `tadbirlar.html` da ko'rinadi. Admin panel ham xuddi shu jadvaldan o'qiydi —
  ro'yxatdagi «Saytda» ustuni va formadagi izoh shundan chiqadi.
- **Rasm to'plami (slayder).** Har bir voqeaga **10 tagacha rasm** biriktiriladi
  (admin → voqea formasi → «Rasmlar (slayder uchun)»). Ular voqeaning
  o'z sahifasida (`tadbir.html`) slayder bo'lib chiqadi: yon strelkalar,
  nuqtalar, klaviatura strelkalari va telefonda barmoq bilan surish; rasm
  bosilsa to'liq ekranda ochiladi. Ro'yxatdagi kartada esa faqat muqova va
  «N ta rasm» belgisi ko'rinadi — 10 ta karta × 10 ta rasm sahifani
  og'irlashtirmasin.
  > Muqova (`cover`) alohida maydon bo'lib qoladi va slayderda BIRINCHI
  > bo'lib ko'rsatiladi (agar to'plamda takrorlanmasa). Ya'ni faqat muqova
  > qo'yilgan eski voqealar avvalgidek ko'rinaveradi.
  > Tartib admin panelda rasmni **sudrab** o'zgartiriladi.
  > Ma'lumot: `events.photos` — `[{url}]`, `media.photos` bilan bir xil shakl.
- O'tgan voqealar **yil bo'yicha arxiv**da. Yil filtri faqat bir nechta yil
  to'planganda chiqadi (bitta yilda u hech narsani filtrlamaydi).
- Uslublar — `page-tadbirlar.css` (voqea sahifasi ham shu faylni ulaydi).

### Tadqiqotlar bo'limi — har bir sahifa o'z formatida

Voqealar bo'limidagi bilan bir xil naqsh: beshta sahifa `page-nashrlar.js` ni
ishlatadi, format esa `<main data-pkind="...">` da e'lon qilinadi.

| Sahifa | `data-pkind` | Format | Nega shunday |
|--------|--------------|--------|--------------|
| `maqolalar.html` | `articles` | o'qish ro'yxati (keng qator, annotatsiya bilan) | Maqola matn janri — sarlavha va matn asosiy, muqova yordamchi |
| `maruzalar.html` | `lectures` | ma'ruzachi tepada bo'lgan kartalar | «Kim aytdi» sarlavhadan kam ahamiyatli emas |
| `tahlillar.html` | `reports` | muqovali kartalar + hudud/muallif | Rasmiy tahliliy mahsulot — muqova va PDF asosiy |
| `kitoblar.html` | `books` | kitob javoni (tik 3:4 muqova, 4 tadan) | Muqova kitobning taniqlik belgisi |
| `nashrlar.html` | *(yo'q)* | muqovali kartalar | Butun bo'limning umumiy ro'yxati |

> ⚠️ **Tur → bo'lim mosligi `js/content-kinds.js` dagi `PUB_KINDS` da** — bitta joyda.
> `admin-ui.js` dagi nashr turlari ro'yxatiga yangi qiymat qo'shsangiz shu
> yerga ham qo'shing.
>
> **Nega kerak bo'ldi:** 2026-08-12 da menyudagi «Hisobotlar» «Tahlillar» deb
> qayta nomlangan va sahifa `Tahlil` turini filtrlaydigan qilingan, lekin
> bazadagi yozuvlar `Hisobot` turida qolgan. Natijada `tahlillar.html`
> **butunlay bo'sh** turardi va 7 ta nashrdan **4 tasi** hech bir kichik
> sahifada ko'rinmasdi. `PUB_KINDS` eskirgan nomlarni ham qabul qiladi.

Boshqaruv qatori (qidiruv / tur / saralash / toifa chiplari) ma'lumot
miqdoriga moslashadi — Hamkorlar sahifasidagi qoida: har bir element faqat
haqiqatan foydali bo'lganda ko'rinadi (ostonalar `page-nashrlar.js` boshida).

### «Sahifalar» kolleksiyasi — hammasi ham saytda chizilmaydi

Admin'dagi **Sahifalar** jadvali erkin matn saqlaydi, lekin sayt uni faqat
`biz-kimmiz.html` dagi **uchta** blokda ko'rsatadi. Moslik `page-biz-kimmiz.js`
dagi `fill()` chaqiruvlarida:

| Sahifadagi bo'lim | Qabul qilinadigan slug | Element |
|-------------------|------------------------|---------|
| Maqsad va vazifalar | `maqsad` | `#goalSec` |
| Markaz haqida | `markaz-haqida` | `#aboutBodySec` |
| Bizning yo'limiz | `biz-kimmiz` yoki `tarix` | `#whoStorySec` |

Har bir bo'lim bir nechta slug qabul qiladi — birinchi TO'LDIRILGANI ishlatiladi.
Matn bo'sh bo'lsa bo'lim butunlay chizilmaydi (bo'sh va'da qoldirilmaydi).

Ro'yxatda YO'Q sluglar (`rahbariyat`, `tuzilma`) — eski importdan qolgan
yozuvlar: ular saytda hech qayerda ko'rinmaydi. `rahbariyat.html` odamlar
ro'yxatini `experts` jadvalidan oladi, `pages` dan emas.

> ⚠️ Bu jadval **ikki joyda** takrorlanadi: `page-biz-kimmiz.js` → `fill()` va
> `search.js` → `PAGE_ANCHORS`. Yangi slug qo'shsangiz ikkalasini ham
> yangilang. Qidiruv indeksiga faqat shu jadvaldagi VA matni bo'sh bo'lmagan
> yozuvlar tushadi — aks holda tashrifchi hech narsa ko'rsatmaydigan sahifaga
> tushardi. Natija havolasi bo'lim langariga boradi (`biz-kimmiz.html#goalSec`),
> shuning uchun `page-biz-kimmiz.js` matn chizilgach langarga o'zi skroll
> qiladi — bo'limlar boshida `is-hidden` bo'lgani uchun brauzer buni o'zi
> qila olmaydi.

### Uslub fayllari

| Fayl | Kim ishlatadi |
|------|---------------|
| `site.css` | Barcha ichki sahifalar (12 ta) |
| `home.css` | **Faqat** bosh sahifa — mustaqil nusxa, `site.css` ni ulamaydi |
| `subscribe.css` | **Hamma** sahifa — obuna oynasi (ikkala olamda bir xil ko'rinsin) |

Bosh sahifaning uslublari ilgari HTML ichida inline `<style>` blokida turardi
(663 qator). Alohida faylga chiqarildi: HTML 71 KB → 24 KB, uslub endi alohida
keshlanadi. Bosh sahifadagi o'zgarish ichki sahifalarga **o'tmaydi** va aksincha —
umumiy o'zgarish ikkala faylda ham qilinishi kerak.

### Chop etish (print)

Ikkita mustaqil yo'l bor va **ikkalasi ham bir xil rasmiy blank** (letterhead)
bilan chiqadi:

| Yo'l | Qanday ishga tushadi | Uslub fayli |
|------|----------------------|-------------|
| «Chop etish» tugmasi | `Site.printDoc()` — kontent yashirin iframe ichida qaytadan, toza tartibda quriladi | `print.css` |
| Brauzerning o'zi (Ctrl+P) | sahifadagi `.print-head` / `.print-title` / `.print-foot` bloklari | `site.css` → `@media print` |

- **Markaz nomi HAMISHA admin sozlamasidan** (`settings.siteName`) olinadi —
  manba bitta: `site-common.js` → `printHeadHTML()` va `printFootHTML()`.
  Nomni bu yerdan tashqarida qo'lda yasamang.
  > 2026-08-20 gacha blank to'rtta `page-*.js` da alohida-alohida yasalar va
  > nomni i18n'dagi qotib qolgan `T('org_name')` dan olardi. Natijada admin
  > nomni almashtirsa ham qog'ozda **eski** nom chiqaverardi, ruschada esa
  > nomning faqat yarmi («ЦЕНТР ВНЕШНЕПОЛИТИЧЕСКИХ / Исследований»).
- Blank barcha ichki sahifaga `initPage()` → `injectPrintFrame()` orqali
  qo'yiladi. Batafsil sahifalar (`yangilik`, `tadbir`, `nashr`, `sharh`) uni
  o'zi qo'yadi — o'sha yerda funksiya ikkinchi nusxa yasamaydi.
  > Ro'yxat sahifalari o'z CSS'ida chop etishda `header, footer, .page-banner`
  > ni yashiradi. Ilgari ular blanksiz chiqar, ya'ni qog'ozda na idora nomi,
  > na sahifa sarlavhasi qolardi. Endi sarlavha `.print-title` dan chiqadi.
- **Bosh sahifa alohida:** `home.css` dagi `@media print`. U hujjat emas,
  shuning uchun blank qurilmaydi — aylanuvchi hero slayderi va bezaklar olib
  tashlanib, mazmun oq qog'ozda o'qiladigan holga keltiriladi.
- `print.css` HTML'ga `<link>` bilan ulanmaydi (uni `printDoc()` iframe ichida
  yuklaydi), shuning uchun uni o'zgartirsangiz **versiyani `site-common.js` dagi
  `print.css?v=N` da qo'lda oshiring**.

### Admin panel — sayt menyusining nusxasi

Yon menyu (`js/admin-ui.js` → `NAV`) **saytning menyusi bilan bir xil** tartibda
va bir xil nomlar bilan guruhlangan. Har bandning ostida u saytda **qaysi
sahifada** ko'rinishi yozilgan.

| Admin guruhi | Saytdagi menyu | Ichida |
|---|---|---|
| Markaz haqida | Markaz haqida | Markaz matnlari · Rahbariyat · Ekspertlar · Hamkorlar |
| Voqealar | Voqealar | Yangiliklar · Uchrashuvlar · Davra suhbatlari · Konferensiyalar · Markaz hayoti · Barchasi |
| Tadqiqotlar | Tadqiqotlar | Maqolalar · Ma'ruzalar · Tahlillar · Kitoblar · Barchasi |
| Media | Media | Ekspertlar OAVda · Media kutubxona |
| Bosh sahifa | — | Hero slayder |
| Tizim | — | Murojaatlar · Obunachilar · Foydalanuvchilar · Audit · Xatoliklar · Bildirishnoma · Sozlamalar |

> ⚠️ Saytdagi menyuni (`js/site-common.js` → `NAV`) o'zgartirsangiz admindagi
> guruhlarni ham yangilang — ular ataylab bir-birining ko'zgusi.

**Bo'limlar saytdagi sahifalarning o'zi.** «Voqealar» va «Tadqiqotlar» adminda
bitta ro'yxat emas — saytdagi sahifalarning har biri alohida bo'lim:

- «Tahlillar» ni bosasiz → faqat tahlillar chiqadi, tugma «Yangi tahlil»
  bo'ladi va yangi yozuvning **turi oldindan qo'yiladi**. Ya'ni qayerga
  qo'shayotganingiz va u qayerda chiqishi bir xil nom bilan ataladi.
- Sarlavha ostida **«saytda ko'rish ↗»** havolasi — qo'shgan narsangizni
  darhol o'z ko'zingiz bilan tekshirasiz.
- Yon menyudagi raqam ham o'sha bo'limniki (Tahlillar 3, Kitoblar 2 …).
- **«Barchasi»** bandi bitta jadvalning to'liq ro'yxati — umumiy ko'rish va
  qidiruv uchun. Faqat shu yerda «Saytda» ustuni ko'rinadi.
- Xuddi shu naqsh **Rahbariyat / Ekspertlar** uchun ham: bitta `experts`
  jadvali, bo'limni `kind` maydoni belgilaydi (`Rahbariyat` bo'lmagan har bir
  xodim ekspert hisoblanadi — maydon bo'sh qolsa ham). Bu ikkisida
  «Barchasi» bandi YO'Q: har bir xodim ikki bo'limdan birida albatta
  ko'rinadi, ya'ni "hech qayerga tushmadi" holati bo'lmaydi.
- Manzillar: `#/publications/k/reports`, `#/events/k/conf`, `#/experts/k/leadership`.
  Bo'lim ichida ochilgan tahrir «Orqaga»da o'sha bo'limga qaytadi.

> Turni o'zgartirsangiz (masalan «Tahlillar»da turib «Maqola» tanlasangiz),
> saqlagandan keyin **Maqolalar** ro'yxati ochiladi — yozuv endi o'sha yerda.
> Aks holda «saqladim, lekin ro'yxatda yo'q» degan holat chiqardi.

Baza o'zgarmadi: bu bitta jadval (`publications` / `events`) va `type`
ustuni — bo'limlar faqat admin ko'rinishi.

**«Saytda» ustuni va tur izohi.** Voqea va nashrning turi bitta satr bo'lib
saqlanadi, sayt esa uni 4 tadan sahifaga taqsimlaydi. Admin buni endi ko'radi:

- ro'yxatda **«Saytda»** ustuni — yozuv qaysi bo'limda chiqishini aytadi;
- formada tur tanlanganda ostida darhol `Saytda: Ma'ruzalar · maruzalar.html`
  deb yoziladi.

Moslik jadvali — **`js/content-kinds.js`**, bitta joyda. Uni sayt ham
(`site-common.js` orqali), admin ham o'qiydi — shuning uchun ular hech qachon
ajralib ketmaydi. **Yangi tur qo'shsangiz** `admin-ui.js` dagi `opts` ga ham,
`content-kinds.js` dagi `types` ga ham qo'shing; aks holda yozuv faqat umumiy
sahifada (`tadbirlar.html` / `nashrlar.html`) ko'rinadi.

> **Eski qiymatlar yo'qolmaydi.** Yozuvning saqlangan turi ro'yxatda bo'lmasa
> (masalan `Hisobot` — 2026-08-12 gacha ishlatilgan nom), u ro'yxatga
> «(eski nom)» belgisi bilan qo'shiladi. Ilgari `<select>` birinchi variantni
> tanlab qo'yardi va yozuvni ochib saqlagan odam turini bilmagan holda
> o'zgartirib yuborardi.

**«Sahifalar» kolleksiyasi yon menyudan olib tashlandi** (2026-08-20). Saytda
undan faqat uchta yozuv chiziladi va uchalasi ham endi **Markaz matnlari**
sahifasida tahrirlanadi (Markaz haqida · Maqsad va vazifalar · Bizning
yo'limiz). Ro'yxatning o'zi `#/pages` manzilida qoladi, lekin u yerda yozilgan
boshqa slug saytda hech qayerda ko'rinmaydi — shuning uchun menyuda yo'q.
