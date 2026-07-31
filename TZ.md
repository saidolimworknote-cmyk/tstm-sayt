# TEXNIK TOPSHIRIQ (TZ)

## Tashqi siyosiy tadqiqotlar va xalqaro tashabbuslar markazi (TSTM) rasmiy veb-sayti va boshqaruv tizimi

**Hujjat turi:** Avtomatlashtirilgan tizimga texnik topshiriq
**Standart:** GOST 34.602-89 «Техническое задание на создание автоматизированной системы» tuzilishi asosida
**Versiya:** 1.0
**Sana:** 2026-07-30
**Holat:** Tizim ishlab chiqilgan va sinovdan o'tkazilgan (as-built spetsifikatsiya)

---

## 1. UMUMIY MA'LUMOTLAR

### 1.1. Tizim nomi
To'liq nom: **«Tashqi siyosiy tadqiqotlar va xalqaro tashabbuslar markazi rasmiy veb-sayti va kontentni boshqarish tizimi»**.
Qisqartma: **TSTM veb-tizimi**.

### 1.2. Buyurtmachi va ishlab chiquvchi
- **Buyurtmachi:** Tashqi siyosiy tadqiqotlar va xalqaro tashabbuslar markazi.
- **Nazorat qiluvchi organ:** UzInfocom (davlat axborot texnologiyalari kompaniyasi) — xavfsizlik va sifat auditi.

### 1.3. Tizimning ishlash asoslari
Tizim mahalliy server muhitida (XAMPP — Apache + PHP + MariaDB) ishlaydi. Hostingga chiqarish uchun barcha talablar `.htaccess` va `DEPLOY.md` da tayyorlangan (HTTPS/HSTS bloklari izohli holatda).

### 1.4. Ishlarni bajarish rejasi
Tizim to'liq ishlab chiqilgan. Ushbu TZ mavjud tizimni rasmiylashtiradi va keyingi rivojlantirish/qabul qilish uchun asos bo'ladi.

---

## 2. TIZIM YARATISH MAQSADI VA VAZIFALARI

### 2.1. Tizimning vazifasi (naznacheniye)
Tizim quyidagilar uchun mo'ljallangan:
- Markaz faoliyati, tadqiqotlari, nashrlari, yangiliklari va tadbirlarini jamoatchilikka **uch tilda** (o'zbek, rus, ingliz) yetkazish;
- Markaz kontentini texnik bilimsiz xodim tomonidan **boshqaruv paneli** orqali mustaqil tahrirlash;
- Fuqarolar va tashkilotlar bilan **qayta aloqa** (murojaat formasi, yangiliklar obunasi);
- Davlat axborot resurslariga qo'yiladigan **xavfsizlik va imkoniyati cheklangan foydalanuvchilar** talablariga muvofiqlik.

### 2.2. Tizim yaratish maqsadlari (tseli)
| # | Maqsad | O'lchanadigan ko'rsatkich |
|---|--------|---------------------------|
| 1 | Kontentni markazlashtirilgan boshqarish | Barcha kontent bitta boshqaruv panelidan tahrirlanadi |
| 2 | Ko'p tillilik | UZ/RU/EN — har bir kontent birligi 3 tilda |
| 3 | Axborot xavfsizligi | SQLi/XSS/CSRF himoyasi, shifrlangan parol, audit jurnali |
| 4 | Imkoniyati cheklangan foydalanuvchilar uchun qulaylik | Maxsus rejim (kontrast, shrift, skrin-rider) |
| 5 | Ishonchlilik | Xatoga chidamli render, ma'lumotlar bazasi tranzaksiyalari |

---

## 3. AVTOMATLASHTIRISH OBYEKTLARI TAVSIFI

### 3.1. Avtomatlashtiriladigan jarayonlar
- Yangilik, tadbir, nashr, tadqiqot yo'nalishi, ekspert ma'lumotlarini yaratish/tahrirlash/o'chirish;
- Bosh sahifa hero-slayderi, hamkorlar, statistika va matnlarini boshqarish;
- Media (fotogalereya, video, infografika) joylash;
- Fuqaro murojaatlari va obunachilarni qabul qilish va ko'rish;
- Foydalanuvchi (admin) autentifikatsiyasi va amallar jurnali.

### 3.2. Foydalanuvchilar toifalari
| Toifa | Huquqlar | Autentifikatsiya |
|-------|----------|------------------|
| **Anonim tashrifchi** | Ommaviy kontentni ko'rish, qidiruv, murojaat/obuna yuborish | Talab qilinmaydi |
| **Administrator** | Barcha kontentni CRUD, sozlamalar, audit jurnali | Login + parol (bcrypt), sessiya |

---

## 4. TIZIMGA QO'YILADIGAN TALABLAR

### 4.1. Tizimga umumiy talablar

#### 4.1.1. Arxitektura
- **Backend:** PHP 8.2 (protsedural), yagona kirish nuqtasi `api.php` (`action=` marshrutlash).
- **Ma'lumotlar bazasi:** MariaDB/MySQL, PDO + prepared statements, tranzaksiyalar.
- **Frontend:** Vanilla JavaScript (framework yo'q), sahifa-bo'yicha `page-*.js` modullar.
- **Server:** Apache (`.htaccess` bilan marshrutlash va xavfsizlik).
- **Granular saqlash:** har bir yozuv alohida `upsert`/`remove` endpoint orqali — bir vaqtda ikki admin ishlaganda ma'lumot yo'qolmaydi (concurrency-safe).

#### 4.1.2. Ishonchlilik
- Ma'lumotlar bazasi bilan ishlash tranzaksiyalar ichida (atomiklik).
- Frontend render har bosqichda `try/catch` bilan himoyalangan: ma'lumot-JS yiqilsa ham kontent ko'rinadi (opacity:0 da qolib ketmaydi).
- Baza va jadvallar birinchi ishga tushirishda avtomatik yaratiladi (`db.php` → `provision`).
- **Diagnostika (`diag.js`):** brauzerdagi JS xatolari, ushlanmagan promise'lar, tarmoq xatolari (fetch/XHR/404) va serverdagi PHP xatolari avtomatik qayd etiladi. Har bir yozuvga **sabab** va **yechim** tavsiyasi biriktiriladi; bir xil xato takrorlansa yangi qator ochilmay, hisoblagich oshadi. Administrator ularni panelda va admin bo'limida ko'radi.

#### 4.1.3. Kengaytiriluvchanlik
- Yangi kontent turi qo'shish `$SCHEMA` (db.php) ga bitta yozuv qo'shish bilan amalga oshadi.
- Migratsiya mexanizmi (`ensure_cols`) mavjud jadvallarga yangi ustun qo'shadi.

#### 4.1.4. Kod sifati
- Statik tahlil: `eslint.config.mjs` (JS) va `.stylelintrc.json` (CSS) — ikkalasi loyiha ildizida va hech qanday npm paketiga bog'liq emas.
- Tekshiruv: `npx eslint .` va `npx stylelint "*.css"` — **0 ta xato, 0 ta ogohlantirish**.
- Bo'sh `catch {}` bloklari ataylab qo'llaniladi (yuqoridagi «xatoga chidamli render» tamoyili) va konfiguratsiyada `allowEmptyCatch` bilan hujjatlashtirilgan.
- Uslub fayllari: `site.css` (12 ta ichki sahifa) va `home.css` (faqat bosh sahifa, mustaqil nusxa). Bosh sahifa uslublari inline `<style>` blokidan alohida faylga chiqarildi — HTML 71 KB → 24 KB, uslub alohida keshlanadi. Ko'chirish vizual jihatdan **piksel-aniq bir xil** ekani avtomatik solishtiruv bilan tasdiqlangan.

### 4.2. Funksiyalarga talablar

#### 4.2.1. Ommaviy qism (sayt)
| Funksiya | Tavsif | Holat |
|----------|--------|-------|
| Bosh sahifa | Hero-slayder, statistika, yo'nalishlar, yangiliklar, nashrlar, ekspertlar, hamkorlar | ✅ |
| Yangiliklar | Ro'yxat + filtr (kategoriya) + batafsil sahifa + ko'rishlar hisoblagichi | ✅ |
| Nashrlar | Ro'yxat + qidiruv + filtr + PDF/Word yuklab olish | ✅ |
| Tadbirlar / Tadqiqotlar | Ro'yxat va batafsil | ✅ |
| Rahbariyat / Ekspertlar | Jamoa ro'yxati + ekspert profili | ✅ |
| Media | Fotoalbom (2 bosqichli), video, interaktiv infografika | ✅ |
| Aloqa | Kontakt ma'lumotlari + murojaat formasi + Google xarita | ✅ |
| Global qidiruv | Barcha kontent bo'yicha, kategoriya filtri, natija ajratish (highlight) | ✅ |
| Ko'p tillilik | UZ/RU/EN almashtirish (navigatsiya, kontent, sahifa sarlavhasi) | ✅ |

#### 4.2.2. Boshqaruv paneli (admin)
| Funksiya | Tavsif | Holat |
|----------|--------|-------|
| Autentifikatsiya | Login/parol, bcrypt, brute-force himoyasi (5 urinish → 10 daqiqa blok) | ✅ |
| Boshqaruv paneli (dashboard) | Statistika, grafiklar, so'nggi faoliyat | ✅ |
| Kontent CRUD | Yangilik/tadbir/nashr/sahifa/ekspert/hamkor/hero/media — yaratish, tahrir, o'chirish | ✅ |
| Boy-matn muharrir | WYSIWYG (sarlavha, ro'yxat, havola, rasm, formatlash) | ✅ |
| Ko'p tilli tahrir | Har maydon UZ/RU/EN + avto-tarjima | ✅ |
| Rasm/hujjat yuklash | PNG/JPG/WEBP/GIF; PDF/DOC/DOCX (fayl imzosi bo'yicha tekshiruv) | ✅ |
| Murojaatlar | Fuqaro xabarlarini ko'rish, o'qilgan deb belgilash | ✅ |
| **Audit loglar** | Kim/qachon/nima o'zgartirdi jurnali (filtr bilan, o'qish uchun) | ✅ |
| **Xatoliklar (diagnostika)** | Sayt va server xatolari — sababi, yechimi, takrorlanish soni; "hal qilindi" belgisi | ✅ |
| Sozlamalar | Sayt nomi, tillar, tema, statistika, parol almashtirish | ✅ |

### 4.3. Ta'minot turlariga talablar

#### 4.3.1. Axborot xavfsizligiga talablar (ASOSIY)
| Tahdid | Himoya chorasi | Holat |
|--------|----------------|-------|
| **SQL-injection** | Barcha so'rovlar PDO **prepared statement**; foydalanuvchi kiritmasi hech qachon SQL'ga to'g'ridan-to'g'ri qo'shilmaydi | ✅ Sinovdan o'tgan |
| **XSS (Cross-Site Scripting)** | Barcha chiqish `esc()` bilan kodlanadi; `src`/`href` `safeUrl()` filtridan o'tadi (`javascript:` bloklanadi); **CSP** `script-src 'self'` (`unsafe-inline`/`unsafe-eval` YO'Q) | ✅ Sinovdan o'tgan |
| **CSRF (Cross-Site Request Forgery)** | Yozuv amallari `X-CSRF-Token` sarlavhasini talab qiladi (sessiyaga bog'langan, `hash_equals`) | ✅ Sinovdan o'tgan |
| **Parolning ochiq saqlanishi** | Parol **bcrypt** (`$2y$`, cost 10) xesh holida; koddа va hujjatда yo'q; `config.php` git'ga tushmaydi | ✅ Sinovdan o'tgan |
| **Sessiya himoyasi** | Cookie `HttpOnly` + `SameSite=Lax` (+ `Secure` HTTPS'da); kirishda `session_regenerate_id` (fiksatsiyaga qarshi) | ✅ Sinovdan o'tgan |
| **Brute-force** | IP bo'yicha 5 xato urinish → 10 daqiqa blok (`login_attempts` jadvali) | ✅ |
| **Maxfiy fayllarга kirish** | `config.php`, `db.php`, `seed.php`, `*.json` — `.htaccess` orqali **403** | ✅ Sinovdan o'tgan |
| **Yuklangan fayl orqali hujum** | Faqat rasm (magic-byte tekshiruvi), SVG taqiqlangan; hujjatlar fayl imzosi bo'yicha; `uploads/` da PHP o'chirilgan; yuklangan HTML **CSP sandbox** (opaque origin) | ✅ Sinovdan o'tgan |
| **Shaxsiy ma'lumot oqishi** | Fuqaro murojaatlari, obunachilar, foydalanuvchilar ommaviy API'da **bo'sh** qaytadi (`$PRIVATE_COLLS`) | ✅ Sinovdan o'tgan |
| **Amallarni kuzatish (audit)** | Har bir admin amali (`login`/`upsert`/`remove`/`settings`/`change_password`) `audit_log` jadvaliga action+bo'lim+ID+IP+vaqt bilan yoziladi | ✅ Sinovdan o'tgan |
| **Axborot oqishi (xato)** | `error_reporting(0)` — server xatolari foydalanuvchiga chiqmaydi; ular ko'rinmay yo'qolmasligi uchun `error_log` jadvaliga yoziladi va faqat adminga ko'rsatiladi | ✅ |
| **Diagnostika panelining oshkorligi** | Panel faqat admin sessiyasida yoki `?debug=1` bilan ochiladi; oddiy tashrifchi hech narsa ko'rmaydi. Jurnalда IP saqlanmaydi | ✅ Sinovdan o'tgan |

**Xavfsizlik sarlavhalari (HTTP headers):** `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.

#### 4.3.2. Imkoniyati cheklangan foydalanuvchilar uchun talablar (davlat standarti)
«Maxsus rejim» (Версия для слабовидящих) mavjud va quyidagilarni ta'minlaydi:
- Ko'rinish rejimlari: **Normal / Yuqori kontrast / Grayscale / Rasmsiz**;
- **Shrift o'lchamini** o'zgartirish (85%–150%);
- Sahifa **masshtabi**;
- **Skrin-rider** (matnni ovoz bilan o'qish — erkak/ayol ovoz);
- **Google-tarjima** 14 tilda (uz, ru, en, kk, ky, tg, tr, ar, zh, fr, de, es, ko, ja);
- O'qish rejimi va standart holatga qaytarish.

#### 4.3.3. Ko'p tillilikka talablar
- Interfeys va kontent: **o'zbek, rus, ingliz**;
- Har bir kontent birligi boshqaruv panelida 3 tilda tahrirlanadi (avto-tarjima yordami bilan);
- Til tanlash sahifa sarlavhasi, navigatsiya va butun kontentga ta'sir qiladi.

#### 4.3.4. Texnik ta'minotga talablar
- Server: Apache 2.4+, PHP 8.2+, MariaDB 10.4+ (yoki MySQL mos versiya);
- Brauzerlar: zamonaviy Chrome, Firefox, Edge, Safari (mobil va desktop);
- Responsive dizayn: mobil (≥360px), planshet, desktop.

#### 4.3.5. Ma'lumotlar ta'minotiga talablar
Ma'lumotlar bazasi **`tstm`**, 18 jadval:
`news`, `events`, `experts`, `publications`, `hero_slides`, `partners`, `pages`, `media` (kontent);
`users`, `messages`, `subscribers` (shaxsiy);
`settings`, `auth`, `views`, `login_attempts`, `msg_throttle`, `audit_log`, `error_log` (tizim).
Ko'p tilli maydonlar `LONGTEXT` (JSON), filtrlanadigan maydonlar (`status`, `date`, `category`) alohida ustun + indeks.

---

## 5. ISHLAR TARKIBI VA BAJARILISH BOSQICHLARI

| Bosqich | Ish | Holat |
|---------|-----|-------|
| 1 | Arxitektura va ma'lumotlar bazasi loyihalash | ✅ Bajarilgan |
| 2 | Ommaviy sayt (13 sahifa) | ✅ Bajarilgan |
| 3 | Boshqaruv paneli (CRUD, sozlamalar) | ✅ Bajarilgan |
| 4 | Ko'p tillilik va imkoniyati cheklanganlar rejimi | ✅ Bajarilgan |
| 5 | Xavfsizlik qattiqlashtirish (SQLi/XSS/CSRF/CSP) | ✅ Bajarilgan |
| 6 | Audit jurnali va viewer | ✅ Bajarilgan |
| 7 | Diagnostika tizimi (xato yig'ish, sabab tahlili, admin bo'limi) | ✅ Bajarilgan |
| 8 | Sinov (avtomatik + jonli brauzer + statik tahlil) | ✅ Bajarilgan |
| 9 | Hostingga chiqarish (HTTPS/HSTS) | ⏳ Tayyor (DEPLOY.md), buyurtmachi qaroriga ko'ra |

---

## 6. NAZORAT VA QABUL QILISH TARTIBI

### 6.1. Sinov turlari (o'tkazilgan)
- **Avtomatik HTTP xavfsizlik sinovi:** 48/48 tekshiruv o'tdi (auth chegarasi, CSRF, maxfiy fayllar, SQLi, IDOR, sarlavhalar, cookie).
- **XSS render sinovi:** payload'lar bilan (headless + iframe harness) — barcha kontekst xavfsiz.
- **Jonli brauzer sinovi (Chrome):** barcha sahifalar, forma, qidiruv, til, tema, maxsus rejim, admin CRUD, audit — konsol xatosi 0, tarmoq xatosi 0.

### 6.2. Qabul mezonlari
| Mezon | Talab | Natija |
|-------|-------|--------|
| Konsol/tarmoq xatolari | 0 | ✅ 0 (13 sahifa, avtomatik brauzer sinovi) |
| Statik tahlil (ESLint + Stylelint) | 0 xato / 0 ogohlantirish | ✅ 0 |
| Xavfsizlik tekshiruvlari | 100% | ✅ 48/48 |
| Ko'p tillilik | UZ/RU/EN | ✅ |
| Maxsus rejim | ishlaydi | ✅ |
| Audit jurnali | yoziladi + ko'rinadi | ✅ |
| Parol shifrlash | bcrypt | ✅ |

---

## 7. HUJJATLASHTIRISHGA TALABLAR

Loyiha bilan birga quyidagi hujjatlar mavjud:
- **README.md** — o'rnatish va ishga tushirish qo'llanmasi;
- **SECURITY.md** — xavfsizlik arxitekturasi, himoya choralari, ma'lum cheklovlar;
- **DEPLOY.md** — hostingga chiqarish cheklisti (baza, HTTPS/HSTS, fayl huquqlari);
- **TZ.md** — ushbu texnik topshiriq;
- **config.sample.php** — maxfiy sozlamalar namunasi.

---

## 8. ISHLAB CHIQISH MANBALARI

- GOST 34.602-89 «Техническое задание на создание автоматизированной системы»;
- O'zbekiston Respublikasida davlat organlari veb-saytlariga qo'yiladigan talablar (imkoniyati cheklangan foydalanuvchilar uchun maxsus versiya);
- OWASP Top 10 (veb-ilova xavfsizligi tavsiyalari);
- Mavjud ishlab chiqilgan tizim kodi va sinov natijalari.

---

## ILOVA A. TIZIM FAYLLAR TARKIBI (qisqacha)

```
BACKEND:   api.php, db.php, seed.php, config.php (git'da yo'q), index.php
FRONTEND:  Bosh sahifa - Hi-Fi.html + 12 ichki HTML sahifa
SKRIPTLAR: page-*.js (sahifa modullari), site-common.js, i18n.js, a11y.js, search.js
DIAGNOSTIKA: diag.js (xato yig'uvchi va panel)
ADMIN:     admin.html, admin-ui.js, admin-store.js
USLUB:     site.css (ichki sahifalar), home.css (bosh sahifa)
XAVFSIZLIK: .htaccess, uploads/.htaccess
KOD SIFATI: eslint.config.mjs, .stylelintrc.json
HUJJAT:    README.md, SECURITY.md, DEPLOY.md, TZ.md
```

---

*Ushbu hujjat mavjud, ishlab chiqilgan va sinovdan o'tkazilgan tizim asosida tuzildi (as-built). Har qanday keyingi o'zgarish ushbu TZ ga muvofiq hujjatlashtirilishi lozim.*
