# TSTM — Tashqi siyosiy tadqiqotlar va xalqaro tashabbuslar markazi sayti

Sayt + boshqaruv paneli (admin). XAMPP'da ishlash uchun PHP backend bilan.

## 📦 Tarkibi
- **Bosh sahifa - Hi-Fi.html** — saytning bosh sahifasi
- Ichki sahifalar: `yangiliklar.html`, `yangilik.html`, `tadbirlar.html`, `nashrlar.html`,
  `tadqiqotlar.html`, `markaz-haqida.html`, `rahbariyat.html`, `media.html`, `aloqa.html`
- **admin.html** — boshqaruv paneli (login bilan)
- `api.php` — PHP backend (ma'lumotlarni **MySQL/MariaDB**'da saqlaydi)
- `db.php` — MySQL qatlami (PDO, jadval sxemasi, avtomatik yaratish)
- `config.sample.php` — maxfiy sozlamalar namunasi (baza logini/paroli).
  Undan `config.php` yasaladi; `config.php` git'ga **tushmaydi**
- `page-*.js` — har bir sahifaning skripti (CSP talabi bilan HTML'dan ajratilgan)
- `seed.php` — standart boshlang'ich kontent (data.json bo'lmasa)
- `index.php` — bosh sahifaga yo'naltiradi
- `.htaccess` — Apache sozlamalari
- `robots.txt`, `sitemap.xml` — qidiruv tizimlari (SEO) uchun
- `*.js`, `site.css`, `logo-*.png` — kod va resurslar

> **Eslatma (SEO):** `robots.txt` va `sitemap.xml` ichida `SIZNING-DOMENINGIZ.uz`
> placeholderi bor — hostingga chiqarganingizda uni haqiqiy domeningizga almashtiring.

---

## 🚀 XAMPP'da ishga tushirish

1. **XAMPP**'ni o'rnating, **Apache** va **MySQL**'ni ishga tushiring (Start).
2. Ushbu `tstm-sayt` papkasini XAMPP'ning **`htdocs`** papkasiga ko'chiring.
   Masalan: `C:\xampp\htdocs\tstm-sayt`
3. *(Ixtiyoriy)* `config.sample.php` ni `config.php` deb nusxalang. Mahalliy
   XAMPP uchun shart emas — `config.php` bo'lmasa standart qiymatlar
   (`root`, parolsiz) ishlatiladi.
4. Brauzerda oching:
   - **Sayt:** `http://localhost/tstm-sayt/`
   - **Admin panel:** `http://localhost/tstm-sayt/admin.html`

> `http://localhost/tstm-sayt/` ochilganda `index.php` avtomatik bosh sahifaga olib boradi.

---

## 🔐 Admin panelga kirish

**Manzil:** `http://localhost/tstm-sayt/admin.html` · **Login:** `markaz_admini`

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
- Baza va jadvallar **birinchi ochilishda avtomatik yaratiladi** (`db.php`).
  Agar loyihada eski `data.json` bo'lsa — u avtomatik MySQL'ga **import qilinadi**
  (kontent + parol xeshi saqlanadi). Bo'lmasa — `seed.php`dagi standart kontent.
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
- Baza nomi: **`tstm`** (avtomatik yaratiladi). Jadvallar: `news`, `events`, `experts`,
  `publications`, `hero_slides`, `partners`, `pages`, `media`, `users`, `messages`,
  `settings`, `auth`, `views`, `login_attempts`, `audit_log`.
- Ko'p tilli maydonlar (`title`, `body`, …) `LONGTEXT`da JSON sifatida, filtrlanadigan
  maydonlar (`status`, `date`, `category`, …) alohida ustunlarda **indeks** bilan saqlanadi.
- Baza login/parolini o'zgartirish: **`config.php`** (`db_host`, `db_name`, `db_user`,
  `db_pass`). Bu fayl git'ga tushmaydi; namunasi — `config.sample.php`.
- Jadvallar ro'yxatiga `subscribers` va `msg_throttle` ham kiradi.

---

## 🔒 Xavfsizlik

To'liq tavsif — **[SECURITY.md](SECURITY.md)** (arxitektura, himoya choralari,
ma'lum cheklovlar).

Hostingga chiqarish cheklisti — **[DEPLOY.md](DEPLOY.md)** (baza foydalanuvchisi,
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
npx stylelint "*.css"     # CSS — 0 xato
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

### Uslub fayllari

| Fayl | Kim ishlatadi |
|------|---------------|
| `site.css` | Barcha ichki sahifalar (12 ta) |
| `home.css` | **Faqat** bosh sahifa — mustaqil nusxa, `site.css` ni ulamaydi |

Bosh sahifaning uslublari ilgari HTML ichida inline `<style>` blokida turardi
(663 qator). Alohida faylga chiqarildi: HTML 71 KB → 24 KB, uslub endi alohida
keshlanadi. Bosh sahifadagi o'zgarish ichki sahifalarga **o'tmaydi** va aksincha —
umumiy o'zgarish ikkala faylda ham qilinishi kerak.
