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
Tizim mahalliy server muhitida ishlaydi: PHP 8.3 va MariaDB 11.4 LTS loyihaning o'zida (`runtime\`) keladi, `tools\ISHGA_TUSHIRISH.bat` ikkalasini ko'taradi. Hech narsa o'rnatish talab qilinmaydi (2026-08-21 gacha XAMPP — Apache + PHP + MariaDB — talab qilinardi). Hostingga chiqarish uchun barcha talablar `.htaccess` va `DEPLOY.md` da tayyorlangan (HTTPS/HSTS bloklari izohli holatda).

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
- Tekshiruv: `npx eslint .` va `npx stylelint "css/*.css"` — **0 ta xato, 0 ta ogohlantirish**.
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
| **Bildirishnomaga obuna** | Brauzer push-bildirishnomasi. E-pochta so'ralmaydi, shaxsiy ma'lumot saqlanmaydi. Taklif oynasi o'qish boshlangach chiqadi | ✅ (HTTPS talab qiladi) |
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
| **Bildirishnoma** | Obunachilar soni; bir bosishda barcha obunachilarga so'nggi yangilik haqida xabar | ✅ |
| Sozlamalar | Sayt nomi, aloqa (manzil/e-pochta/telefon/xarita/ish vaqti), 6 ta ijtimoiy tarmoq, logotiplar, tillar, tema, banner fonlari, statistika, footer matni va huquqiy havolalari, parol almashtirish | ✅ |

### 4.3. Ta'minot turlariga talablar

#### 4.3.1. Axborot xavfsizligiga talablar (ASOSIY)
| Tahdid | Himoya chorasi | Holat |
|--------|----------------|-------|
| **SQL-injection** | Barcha so'rovlar PDO **prepared statement**; foydalanuvchi kiritmasi hech qachon SQL'ga to'g'ridan-to'g'ri qo'shilmaydi | ✅ Sinovdan o'tgan |
| **XSS (Cross-Site Scripting)** | Barcha chiqish `esc()` bilan kodlanadi; `src`/`href` `safeUrl()` filtridan o'tadi (`javascript:` bloklanadi); **CSP** `script-src 'self'` (`unsafe-inline`/`unsafe-eval` YO'Q) | ✅ Sinovdan o'tgan |
| **CSRF (Cross-Site Request Forgery)** | Yozuv amallari `X-CSRF-Token` sarlavhasini talab qiladi (sessiyaga bog'langan, `hash_equals`) | ✅ Sinovdan o'tgan |
| **Parolning ochiq saqlanishi** | Parol **bcrypt** (`$2y$`, cost 10) xesh holida; koddа va hujjatда yo'q; `backend/config.php` git'ga tushmaydi | ✅ Sinovdan o'tgan |
| **Sessiya himoyasi** | Cookie `HttpOnly` + `SameSite=Lax` (+ `Secure` HTTPS'da); kirishda `session_regenerate_id` (fiksatsiyaga qarshi) | ✅ Sinovdan o'tgan |
| **Brute-force** | IP bo'yicha 5 xato urinish → 10 daqiqa blok (`login_attempts` jadvali) | ✅ |
| **Maxfiy fayllarга kirish** | `backend/` (config.php, db.php, seed.php), `*.json` — `.htaccess` orqali **403** | ✅ Sinovdan o'tgan |
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

Quyidagi ko'rsatkichlar **taxminiy emas** — ishlab chiqilgan tizimning haqiqiy
o'lchovlari asosida hisoblangan (o'lchov sanasi: 2026-07-31).

##### 4.3.4.1. Dasturiy ta'minot

| Komponent | Minimal | Tavsiya etiladi | Izoh |
|-----------|---------|-----------------|------|
| Operatsion tizim | Linux (Ubuntu 22.04 / Debian 12 / AlmaLinux 9) | Ubuntu 22.04 LTS | Windows Server ham mumkin, lekin `.htaccess` va fayl huquqlari Linux uchun sozlangan |
| Veb-server | Apache 2.4 | Apache 2.4 + `mod_deflate`, `mod_expires`, `mod_headers`, `mod_rewrite` | `.htaccess` ishlashi uchun `AllowOverride All` shart |
| PHP | 8.2 | 8.2 yoki 8.3 | Kengaytmalar: `pdo_mysql`, `mbstring`, `json`, `session`, `fileinfo`, `gd` yoki `exif` |
| Ma'lumotlar bazasi | MariaDB 10.4 / MySQL 8.0 | MariaDB 10.11 LTS | InnoDB, `utf8mb4_unicode_ci` |
| TLS sertifikati | — | Let's Encrypt (bepul, avto-yangilanish) | Davlat resursi uchun HTTPS majburiy |

**PHP sozlamalari (php.ini) — majburiy qiymatlar:**

| Parametr | Talab | Sabab |
|----------|-------|-------|
| `memory_limit` | ≥ 256M | O'lchangan eng yuqori sarf — 6 MB/so'rov, lekin Word matni joylashtirilgan yirik nashrlar uchun zaxira kerak |
| `post_max_size` | **≥ 48M** | Fayl base64 ko'rinishida yuboriladi va hajmi ~33% oshadi: 30 MB hujjat → ~40 MB so'rov tanasi. 40M chegarasi **yetarli emas** |
| `upload_max_filesize` | ≥ 48M | Yuqoridagi bilan bir xil |
| `max_execution_time` | ≥ 60 | Yirik fayl yuklash |
| `display_errors` | `Off` | Axborot oqishining oldini olish (kodda ham `error_reporting(0)`) |
| `session.cookie_httponly` | `On` | Sessiya o'g'irlanishiga qarshi |

##### 4.3.4.2. Apparat resurslari

| Resurs | Minimal | **Tavsiya etiladi** | Zaxira bilan |
|--------|---------|---------------------|--------------|
| Protsessor | 2 vCPU | **2–4 vCPU** | 4 vCPU |
| Operativ xotira (RAM) | 2 GB | **4 GB** | 8 GB |
| Disk (SSD) | 20 GB | **40 GB** | 80 GB |
| Tarmoq kanali | 10 Mbit/s | **100 Mbit/s** | 100 Mbit/s |

**RAM taqsimoti (4 GB konfiguratsiyasida):**

| Iste'molchi | Hajm | Izoh |
|-------------|------|------|
| Operatsion tizim | 300–500 MB | Minimal Linux server |
| MariaDB | 1–1.5 GB | InnoDB buffer pool ~1 GB (baza kichik, lekin kesh tezlikni oshiradi) |
| Apache + PHP | 400–800 MB | Har bir ishchi jarayon ~20–25 MB; 20–30 parallel so'rov |
| Zaxira (kesh, tepalik yuk) | ~1 GB | Trafik ko'tarilishi va zaxira nusxa olish uchun |

> **2 GB nima uchun minimal:** tizim ishlaydi, lekin MariaDB buffer pool'i kichik
> bo'ladi va bir vaqtda 30+ tashrifchi bo'lganda javob sekinlashadi. Ishlab
> turgan davlat resursi uchun **4 GB** tavsiya etiladi.

##### 4.3.4.3. Disk hajmi hisob-kitobi

**Hozirgi holat (o'lchangan):**

| Element | Hajm |
|---------|------|
| Dastur kodi, uslublar, logotiplar | 1.8 MB |
| Yuklangan fayllar (`uploads/`, 106 fayl) | 21.4 MB |
| Ma'lumotlar bazasi (`tstm`, 18 jadval) | 2.3 MB |
| **Jami** | **~26 MB** |

**Bir kontent birligining o'rtacha "og'irligi" (o'lchangan):**

| Kontent turi | Bazada | Fayllarda | Jami |
|--------------|--------|-----------|------|
| Nashr (3 tilda, Word matni bilan) | 188 KB | PDF ~450 KB + muqova ~190 KB | **~830 KB** |
| Yangilik | 1.4 KB | muqova rasm ~190 KB | **~190 KB** |
| Tadbir | ~1 KB | rasm ~190 KB | **~190 KB** |
| Albomdagi bitta surat | — | ~190 KB | **~190 KB** |
| Interaktiv infografika | ~1 KB | ~5 KB | **~6 KB** |

> Eng ko'p joy **nashrlar** va **fotoalbomlar** egallaydi. Nashrning matni
> bazada uch tilda saqlanadi (LONGTEXT), shuning uchun bitta nashr bazada
> ~188 KB joy oladi — bu boshqa kontent turlaridan 100 barobar ko'p.

**O'sish prognozi.** Quyidagi jadval markazning **o'rtacha faolligi** uchun
hisoblangan: oyiga 6 ta yangilik, 2–3 ta nashr, 2 ta tadbir va 2 ta fotoalbom
(har birida ~15 surat).

| Muddat | Yangilik | Nashr | Albom surati | `uploads/` | Baza | **Jami** |
|--------|----------|-------|--------------|-----------|------|----------|
| Hozir | 6 | 7 | ~90 | 21 MB | 2 MB | **26 MB** |
| 1 yil | +72 | +30 | +360 | ~125 MB | ~10 MB | **~140 MB** |
| 3 yil | +216 | +90 | +1080 | ~335 MB | ~25 MB | **~365 MB** |
| 5 yil | +360 | +150 | +1800 | ~545 MB | ~40 MB | **~590 MB** |

**Disk hajmi to'liq hisobi (5 yillik istiqbol):**

| Element | Hajm |
|---------|------|
| Operatsion tizim + Apache + PHP + MariaDB | ~8 GB |
| Sayt fayllari va yuklangan kontent (5 yil) | ~0.6 GB |
| Ma'lumotlar bazasi | ~0.05 GB |
| **Zaxira nusxalar** (kunlik 7 + oylik 12, siqilgan) | ~3–5 GB |
| Jurnal fayllari (Apache access/error, 1 yil) | ~2–3 GB |
| Vaqtinchalik fayllar, tizim yangilanishlari zaxirasi | ~5 GB |
| **Jami** | **~20 GB** |

> **20 GB — minimal, 40 GB — tavsiya etiladi.** Farq zaxira nusxalar chuqurligi
> va kutilmagan o'sish (masalan yirik videoarxiv yoki skanerlangan hujjatlar
> joylash) uchun. Video **saytga yuklanmaydi** — YouTube havolasi orqali
> ko'rsatiladi, shuning uchun disk sarfiga ta'sir qilmaydi.

##### 4.3.4.4. Tarmoq trafigi

**Sahifa og'irligi (o'lchangan):**

| Holat | Siqishsiz | **gzip bilan** |
|-------|-----------|----------------|
| Barcha CSS + JS (birinchi tashrif) | 316 KB | **90 KB** (72% tejov) |
| Bosh sahifa HTML | 23 KB | **5 KB** |
| Rasmlar (hero + kartalar) | ~600 KB | ~600 KB (allaqachon siqilgan) |
| **Birinchi tashrif jami** | ~940 KB | **~700 KB** |
| **Takroriy tashrif** (CSS/JS keshdan) | ~50 KB | ~30 KB |

> ✅ **`mod_deflate` yoqilgan** — `.htaccess` da gzip bloki bor va u ishlayapti
> (tekshirildi: `site.css` uchun javob `Content-Encoding: gzip`). Matnli fayllar
> **72% kichikroq** uzatiladi. Hostingda ham shu holat saqlanishi kerak —
> Apache'da `mod_deflate` moduli yoqiq bo'lsin (qarang: DEPLOY.md, 6-bo'lim).

**Oylik trafik prognozi:**

| Kunlik tashrif | Oylik trafik (gzip bilan) | Oylik trafik (siqishsiz) |
|----------------|---------------------------|--------------------------|
| 100 | ~2 GB | ~3 GB |
| 300 | ~6 GB | ~8,5 GB |
| 1000 | ~20 GB | ~28 GB |
| 3000 (tepalik) | ~60 GB | ~85 GB |

Hisobda qidiruv robotlari (Google, Yandex) va RSS/sitemap so'rovlari uchun
~20% qo'shilgan. **100 Mbit/s kanal** 3000 kunlik tashrifni ham bemalol
ko'taradi; cheklov odatda kanal emas, oylik trafik kvotasi bo'ladi —
hosting tarifida **kamida 50 GB/oy** bo'lishi tavsiya etiladi.

##### 4.3.4.5. Bir vaqtda xizmat ko'rsatiladigan foydalanuvchilar soni

O'lchov mahalliy muhitda (Windows, 4 yadro; o'sha paytda XAMPP/Apache) `ab` (Apache Bench) bilan
o'tkazilgan. **Haqiqiy Linux serverda ko'rsatkichlar 2–3 barobar yuqori bo'ladi**
— Windows'dagi Apache MPM sezilarli sekinroq ishlaydi.

**O'lchangan o'tkazuvchanlik:**

| So'rov turi | So'rov/sekund | Javob vaqti (95%) |
|-------------|---------------|-------------------|
| Statik fayl (CSS/JS/rasm) | ~2500 | < 10 ms |
| `api.php?action=load` (optimallashtirilgandan **keyin**) | **~190** | 160 ms (25 parallel) |
| `api.php?action=load` (optimallashtirishdan **oldin**) | ~65 | 205 ms |

**Bu nechta foydalanuvchi degani.** Tashrifchi sahifani ochib, o'rtacha 30–60
soniya o'qiydi va shundan keyin keyingi sahifaga o'tadi. Ya'ni bitta faol
tashrifchi taxminan **1 so'rov / 40 soniya** hosil qiladi.

| Ko'rsatkich | Mahalliy o'lchov | Linux VPS (kutilgan) |
|-------------|------------------|----------------------|
| Bir vaqtda saytni **o'qiyotgan** foydalanuvchi | **~7 000** | ~15 000 |
| Bir soniyada sahifa ochilishi (tepalik) | ~190 | ~400 |
| Xatosiz ko'targan parallel ulanish | 50 | 100+ |

> Amalda cheklov odatda **tepalik** bo'ladi: masalan rasmiy e'lon chiqqanda yoki
> ijtimoiy tarmoqdan havola tarqalganda hammasi bir vaqtda kiradi. Yuqoridagi
> konfiguratsiya (4 GB RAM, 2–4 vCPU) sekundiga ~400 sahifa ochilishini
> ko'taradi — bu markaz miqyosidagi resurs uchun katta zaxira.

**Nima qilingani (optimallashtirish tarixi).** Dastlab har bir sahifa ochilishida
`api.php` **1.33 MB** JSON qaytarardi va uni har safar qaytadan yasardi. Uch
o'zgarish kiritildi:

| Chora | Ta'sir |
|-------|--------|
| Og'ir maydonlarni ommaviy javobdan chiqarish (`$HEAVY_FIELDS`) | Javob 1.33 MB → 200 KB (**86%**) |
| Ommaviy javobni fayl keshiga olish (`cache_public.json`) | So'rov narxi ~43 ms → ~0.1 ms |
| Oddiy tashrifchi uchun sessiyani ochmaslik | c=10 da 139 → 171 so'rov/sek |
| gzip siqish + brauzer keshi (`.htaccess`) | Trafik **72%** kamaydi |
| PHP OPcache yoqildi | Skript har so'rovda qayta kompilyatsiya qilinmaydi |

> **Eng muhimi — kelajakdagi o'sish.** Ilgari javob hajmi kontent bilan chiziqli
> o'sardi: 150 ta nashrda u ~28 MB bo'lardi va sayt amalda ishlamay qolardi.
> Endi nashr matni ommaviy javobga umuman tushmaydi (batafsil sahifa uni alohida
> `action=item` so'rovi bilan oladi), shuning uchun javob hajmi kontent
> o'sganda ham deyarli o'zgarmaydi.

##### 4.3.4.6. Klient tomoni (tashrifchi qurilmasi)

| Talab | Qiymat |
|-------|--------|
| Brauzerlar | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ (mobil va desktop) |
| Ekran kengligi | 360 px dan boshlab (responsive: mobil / planshet / desktop) |
| JavaScript | **Majburiy** — kontent `page-*.js` orqali render qilinadi |
| Internet tezligi | 1 Mbit/s da sahifa ~2–3 soniyada ochiladi (gzip bilan) |
| Maxsus dasturiy ta'minot | **Talab qilinmaydi** — brauzerdan boshqa hech narsa kerak emas |

> Brauzer talablari `backdrop-filter`, `color-mix()` va CSS `aspect-ratio`
> qo'llanilishi bilan bog'liq. Eskiroq brauzerlarda sayt **ochiladi va o'qiladi**,
> lekin ayrim vizual effektlar (shaffof panellar, yumshoq soyalar) ko'rinmaydi.

##### 4.3.4.7. Zaxiralash va tiklash

| Element | Chastota | Saqlash muddati | Hajm (siqilgan) |
|---------|----------|-----------------|-----------------|
| Ma'lumotlar bazasi (`mysqldump`) | Kunlik | 7 kun + 12 oy | ~5 MB/nusxa |
| `uploads/` papkasi | Haftalik (inkremental) | 3 oy | ~100–500 MB |
| Dastur kodi | Har o'zgarishda (git) | Cheksiz | ~2 MB |
| `backend/config.php` (maxfiy) | Qo'lda, alohida saqlanadi | — | < 1 KB |

Tiklash vaqti (RTO): baza ~2 daqiqa, to'liq tizim ~30 daqiqa.

##### 4.3.4.8. Hosting turini tanlash

| Variant | Mosligi | Izoh |
|---------|---------|------|
| **VPS / VDS** (2–4 vCPU, 4 GB RAM, 40 GB SSD) | ✅ **Tavsiya etiladi** | To'liq nazorat, `.htaccess`, PHP sozlamalari va zaxiralashni o'zingiz boshqarasiz |
| Umumiy hosting (shared) | ⚠️ Shartli | `AllowOverride All`, PHP 8.2, `post_max_size` 48M va MySQL bazasi berilsa ishlaydi |
| Davlat bulut infratuzilmasi (UzInfocom) | ✅ Mos | Yuqoridagi minimal talablar qanoatlantirilsa |
| Statik hosting (Netlify, GitHub Pages) | ❌ **Mos emas** | PHP va MySQL yo'q — tizim ishlamaydi |

**Xulosa — buyurtma uchun qisqa spetsifikatsiya:**

> Linux VPS: **2–4 vCPU, 4 GB RAM, 40 GB SSD, 100 Mbit/s, 50 GB/oy trafik**,
> Apache 2.4 + PHP 8.2 + MariaDB 10.11, TLS sertifikati, kunlik zaxiralash.
> Bu konfiguratsiya kamida **5 yillik o'sishni** zaxira bilan qoplaydi.

#### 4.3.5. Ma'lumotlar ta'minotiga talablar
> ⚠️ **Push-bildirishnoma HTTPS talab qiladi.** Brauzer standarti bo'yicha
> Service Worker va Push API faqat xavfsiz ulanishda ishlaydi (`localhost` —
> ishlab chiqish uchun istisno). Sayt `http://` bilan chiqarilsa obuna oynasi
> umuman ko'rinmaydi va bo'lim ishlamaydi. `.htaccess` dagi HTTPS bloki
> yoqilishi shart — qarang: DEPLOY.md, 3-bo'lim.

Ma'lumotlar bazasi **`tstm`**, 20 jadval:
`news`, `events`, `experts`, `publications`, `hero_slides`, `partners`, `pages`, `media` (kontent);
`users`, `messages`, `subscribers` (shaxsiy);
`settings`, `auth`, `views`, `login_attempts`, `msg_throttle`, `audit_log`, `error_log`,
`push_subs`, `push_vapid` (tizim).

> `push_subs` da **shaxsiy ma'lumot yo'q**: `endpoint` — brauzer bergan anonim
> manzil, `p256dh`/`auth` — shifrlash kalitlari. Ular orqali foydalanuvchini
> aniqlab bo'lmaydi. Bu e-pochta yig'ishdan farqli o'laroq shaxsiy ma'lumotlarni
> qayta ishlash majburiyatini umuman keltirib chiqarmaydi.
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
- **backend/config.sample.php** — maxfiy sozlamalar namunasi.

---

## 8. ISHLAB CHIQISH MANBALARI

- GOST 34.602-89 «Техническое задание на создание автоматизированной системы»;
- O'zbekiston Respublikasida davlat organlari veb-saytlariga qo'yiladigan talablar (imkoniyati cheklangan foydalanuvchilar uchun maxsus versiya);
- OWASP Top 10 (veb-ilova xavfsizligi tavsiyalari);
- Mavjud ishlab chiqilgan tizim kodi va sinov natijalari.

---

## ILOVA A. TIZIM FAYLLAR TARKIBI (qisqacha)

```
ILDIZ:     index.html (bosh sahifa) + 28 ta ichki HTML sahifa
           api.php (yagona kirish nuqtasi)
           .htaccess, router.php, sw.js, robots.txt, sitemap.xml
backend/   db.php, seed.php, config.sample.php
           config.php (git'da yo'q) — tashqaridan OCHILMAYDI
css/       site.css (ichki sahifalar), home.css (bosh sahifa),
           print.css (chop etish), admin.css, page-*.css
js/        site-common.js, i18n.js, a11y.js, search.js, subscribe.js,
           page-*.js (sahifa modullari), diag.js (diagnostika),
           admin-ui.js, admin-store.js
img/       logo-*.png        fonts/  Montserrat (woff2)
uploads/   yuklangan fayllar + uploads/.htaccess
docs/      SECURITY.md, DEPLOY.md, TZ.md, TOPSHIRISH.md  (README.md ildizda)
tools/     deploy.ps1, backup.ps1, restore.ps1, koch.ps1, ORNAT.*
tests/     smoke.ps1
KOD SIFATI: eslint.config.mjs, .stylelintrc.json (ildizda)

Papkalarga ajratish 2026-08-20 da bajarildi. Ildizda qolgan fayllar ATAYLAB
shunday: `index.html` — DirectoryIndex; `*.html` — fayl nomi sayt manzili;
`sw.js` — Service Worker qamrovi faqat o'z papkasidan pastga tarqaladi;
`robots.txt`/`sitemap.xml` — standart bo'yicha faqat ildizda o'qiladi.
```

---

*Ushbu hujjat mavjud, ishlab chiqilgan va sinovdan o'tkazilgan tizim asosida tuzildi (as-built). Har qanday keyingi o'zgarish ushbu TZ ga muvofiq hujjatlashtirilishi lozim.*
