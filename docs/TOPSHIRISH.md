# TSTM sayti — serverga o'rnatish uchun topshiriq

**Kimga:** saytni hostingga joylashtiruvchi mutaxassislarga
**Nima:** Tashqi siyosiy tadqiqotlar va xalqaro tashabbuslar markazi sayti
**Sana:** 2026-08-10

---

## 1. Topshirilayotgan fayllar

| Fayl | Hajmi | Nima |
|---|---|---|
| `tstm-<sana>.zip` | ~7.1 MB | Saytning to'liq fayllari (125 ta) |
| `hosting-import.sql` | ~1.4 MB | Baza dumpi (kontent) |

> ⚠️ `hosting-import.sql` — **maxfiy fayl**: ichida admin parolining bcrypt
> xeshi bor. Import qilingach serverdan o'chiring va ochiq kanal orqali
> uzatmang.

Sayt **tayyor holatda**: kompilyatsiya, `npm`, `composer`, build bosqichi
**yo'q**. Fayllarni joyiga qo'yish, bazani import qilish va bitta konfiguratsiya
faylini yaratish kifoya.

---

## 2. Server talablari

### 2.1. PHP

- **Versiya: 8.2** (kod aynan PHP 8.2.12 da ishlab chiqilgan va sinalgan;
  barcha sahifa va API nuqtalari `error_reporting(E_ALL)` ostida aylantirilib,
  birorta `deprecated`/`warning`/`notice` bermasligi tasdiqlangan).
- **Kengaytmalar:** `pdo_mysql`, `mbstring`, `openssl`, `curl`
  (`json`, `hash`, `session` — PHP 8 yadrosida).
- **Kerak EMAS:** `gd`, `zip`, `intl`, `imagick`, `fileinfo`.

### 2.2. `php.ini`

```ini
post_max_size = 48M
upload_max_filesize = 48M
memory_limit = 256M
max_execution_time = 60
display_errors = Off
```

> `48M` — texnik talab, xohish emas. Fayl serverga `base64` ko'rinishida
> yuboriladi va hajmi ~33% oshadi. Kod hujjat uchun 30 MB gacha ruxsat beradi
> (rasm uchun 12 MB), 30 MB fayl esa so'rov tanasida ~40 MB bo'ladi. Chegara
> pastroq bo'lsa PHP so'rovni **kod ishga tushishidan oldin** rad etadi va
> foydalanuvchi sababi tushunarsiz xato ko'radi.

### 2.3. Ma'lumotlar bazasi

- MySQL 5.7+ yoki MariaDB 10.3+
- Kodlash: **`utf8mb4` / `utf8mb4_unicode_ci`** (o'zbek apostroflari va
  kirill matni uchun majburiy)

### 2.4. Veb-server — ⚠️ ENG MUHIM BAND

Saytning **butun xavfsizlik konfiguratsiyasi** `.htaccess` faylida:
Content-Security-Policy va boshqa himoya sarlavhalari, `backend/config.php`/`backend/db.php`
kabi ichki fayllarni tashqaridan ochishni taqiqlash, `uploads/` ichida PHP
bajarilishining oldini olish, gzip siqish va brauzer keshi.

- **Apache bo'lsa:** `AllowOverride All` yoqilgan bo'lishi shart. Aks holda
  `.htaccess` umuman o'qilmaydi.
- **Nginx bo'lsa:** `.htaccess` **e'tiborsiz qoldiriladi**. Sayt tashqaridan
  ishlayotgandek ko'rinadi, lekin **hech qanday xato bermay** yuqoridagi
  himoyalarning hammasi yo'qoladi.

  👉 **Iltimos, veb-server turini bizga xabar qiling.** Nginx bo'lsa biz
  `.htaccess` ning to'liq ekvivalentini Nginx sintaksisida tayyorlab beramiz.

### 2.5. Joylashuv va protokol

- Sayt **domen ildizida** turishi shart (`example.uz/`), ichki papkada emas
  (`example.uz/tstm/` — **yaramaydi**). Sabab: `sw.js` (Service Worker)
  faqat o'zi joylashgan papka va undan pastini boshqara oladi; ichki papkada
  push-bildirishnoma butun sayt uchun ishlamay qoladi.
- **HTTPS majburiy.** Push API brauzer standarti bo'yicha faqat xavfsiz
  ulanishda ishlaydi; `http://` da obuna oynasi umuman ko'rinmaydi.

---

## 3. O'rnatish qadamlari

### 3.1. Bazani yaratish

```sql
CREATE DATABASE tstm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'tstm_app'@'localhost' IDENTIFIED BY 'KUCHLI_PAROL';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX
  ON tstm.* TO 'tstm_app'@'localhost';

FLUSH PRIVILEGES;
```

> **`CREATE` va `ALTER` ni olib tashlamang.** Ilova jadval sxemasini o'zi
> boshqaradi: birinchi ishga tushishda yaratadi, `backend/db.php` yangilanganda
> migratsiya qiladi. Kundalik ishda bu huquqlar **ishlatilmaydi** — sxema
> dolzarbligi bitta `SELECT` bilan aniqlanadi (`schema_meta` jadvali), DDL
> umuman bajarilmaydi.
>
> `DROP`, `GRANT`, `FILE` huquqlari **kerak emas**.

### 3.2. Kontentni import qilish

```bash
mysql -u tstm_app -p tstm < hosting-import.sql
```

Dumpda `CREATE DATABASE` va `USE` **yo'q** — shuning uchun u istalgan nomdagi
bazaga tushadi (masalan `u12345_tstm`).

**Tekshiring:** 22 ta jadval; `news` — 6, `publications` — 7, `experts` — 4,
`pages` — 5 yozuv; o'zbekcha apostroflar (`bo'yicha`) va kirill matni buzilmagan.

### 3.3. Fayllarni ochish

Arxivni domen ildiziga (`public_html/` yoki `www/`) oching.

> Arxiv ichida **ikkita `.htaccess`** bor: ildizda va `uploads/` ichida.
> Ikkalasi ham nuqta bilan boshlanadi — ba'zi FTP mijozlari va fayl
> menejerlari bunday fayllarni yashiradi. **Ochilgandan keyin ikkalasi ham
> joyida ekanini alohida tekshiring** (`uploads/` haqiqiy papka bo'lishi
> kerak, `uploads\.htaccess` nomli yagona fayl emas).

### 3.4. `backend/config.php` yaratish

Sayt ildizidagi `backend/` papkasida `config.php` fayli yarating (arxivda **yo'q** — har bir muhitda
o'ziniki bo'ladi):

```php
<?php
return [
  'db_host' => 'localhost',
  'db_port' => '3306',
  'db_name' => 'tstm',
  'db_user' => 'tstm_app',
  'db_pass' => 'KUCHLI_PAROL',

  'admin_user' => 'markaz_admini',
  'admin_bootstrap_password' => '',   // bo'sh qoldiring
];
```

`admin_bootstrap_password` **bo'sh qolishi kerak**: admin parolining xeshi
`auth` jadvali bilan birga import qilinadi, ya'ni mavjud parol ishlayveradi.
(Bu qiymat faqat butunlay bo'sh bazani birinchi marta ochish uchun.)

Namuna: arxivdagi `backend/config.sample.php`.

### 3.5. Fayl huquqlari

| Yo'l | Huquq | Nima uchun |
|---|---|---|
| `backend/config.php` | `640` | Baza paroli — faqat veb-server o'qisin |
| `uploads/` | `755`, veb-server **yoza oladi** | Admin panel orqali yuklanadigan rasm/hujjatlar |
| sayt ildizi | veb-server **yoza oladi** | `cache_public.json` keshi shu yerda yasaladi |

> Ildizga yozib bo'lmasa sayt **ishlayveradi**, lekin har so'rov javobni
> qaytadan yig'adi (sezilarli sekinlashuv).

### 3.6. HTTPS

1. SSL sertifikat o'rnating.
2. `.htaccess` faylining boshidagi HTTPS bloki (10–16-qatorlar) **izohga
   olingan** — sertifikat ishlagach `#` belgilarini olib tashlang.
3. HSTS (23–25-qatorlar) — avval `max-age=300` bilan sinang, 1–2 kun muammo
   bo'lmasa `31536000` ga ko'taring.

> Tartib muhim: HSTS ni sertifikatdan oldin yoqib, keyin sertifikatda muammo
> chiqsa, sayt umuman ochilmay qoladi.

### 3.7. Import faylini o'chirish

`hosting-import.sql` ni serverdan o'chiring (ichida parol xeshi bor).

---

## 4. O'rnatgandan keyingi tekshiruv

**200 qaytarishi kerak:**

```
/                        -> bosh sahifa (yo'naltirishsiz)
/api.php?action=load     -> JSON, ichida kontent
/robots.txt  /sitemap.xml
```

`/api.php?action=load` javobida `messages`, `subscribers`, `users` — **bo'sh
massiv**, `passwordHash` esa **umuman bo'lmasligi** kerak.

**403 yoki 404 qaytarishi SHART** (ochilib qolmasin):

```
/backend/config.php   /backend/config.sample.php
/backend/db.php       /backend/seed.php
/.htaccess    /.git/config         /uploads/  (papka ro'yxati ko'rinmasin)
```

**Javob sarlavhalari** (DevTools -> Network -> Response Headers):

```
Content-Security-Policy      (ichida 'unsafe-inline' BO'LMASIN)
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy
Strict-Transport-Security    (HTTPS yoqilgandan keyin)
Content-Encoding: gzip       (CSS/JS uchun)
```

Bu sarlavhalar **404 javoblarda ham** bo'lishi kerak — mavjud bo'lmagan
manzilni ochib tekshiring. Bo'lmasa `.htaccess` o'qilmayapti (2.4-bandga
qarang).

---

## 5. Kim nima qiladi

| Ish | Kim |
|---|---|
| Sayt fayllari va baza dumpi | ✅ Tayyorlandi, topshirilmoqda |
| PHP 8.2 mosligi | ✅ Tekshirildi va tasdiqlandi |
| Domen, DNS, SSL sertifikat | Hosting tomoni |
| PHP/MySQL sozlamalari (2.2, 2.3) | Hosting tomoni |
| Nginx konfiguratsiyasi (agar kerak bo'lsa) | So'rov bo'yicha tayyorlab beramiz |
| Zaxira nusxa (cron + `mysqldump`) | Hosting tomoni bilan kelishiladi |
| Admin parolini almashtirish | Sayt egasi, o'rnatilgandan keyin darhol |

---

## 6. Biz uchun qaytariladigan ma'lumot

O'rnatish tugagach quyidagilarni xabar qiling:

1. **Veb-server turi** — Apache yoki Nginx (2.4-band).
2. **PHP versiyasi** — o'rnatilgan aniq versiya.
3. **Sayt manzili** — boshqaruv paneli `<domen>/admin.html` da.
4. **Zaxira** qanday tashkil etilgani.

Boshqaruv paneliga birinchi kirishdan so'ng parol **darhol almashtiriladi**
(Sozlamalar -> Xavfsizlik).

---

## 7. Qo'shimcha hujjatlar

Arxivda yo'q, lekin so'rov bo'yicha beriladi:

- `DEPLOY.md` — kengaytirilgan o'rnatish va xavfsizlik cheklisti
- `SECURITY.md` — loyihaning texnik xavfsizlik holati
- `tests/smoke.ps1` — 52 bandli avtomatik tekshiruv (sayt buzilmaganini va
  himoyalar joyida ekanini tekshiradi)
