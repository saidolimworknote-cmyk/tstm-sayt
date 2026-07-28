# TSTM — Tashqi siyosiy tadqiqotlar va xalqaro tashabbuslar markazi sayti

Sayt + boshqaruv paneli (admin). XAMPP'da ishlash uchun PHP backend bilan.

## 📦 Tarkibi
- **Bosh sahifa - Hi-Fi.html** — saytning bosh sahifasi
- Ichki sahifalar: `yangiliklar.html`, `yangilik.html`, `tadbirlar.html`, `nashrlar.html`,
  `tadqiqotlar.html`, `markaz-haqida.html`, `rahbariyat.html`, `media.html`, `aloqa.html`
- **admin.html** — boshqaruv paneli (login bilan)
- `api.php` — PHP backend (ma'lumotlarni **MySQL/MariaDB**'da saqlaydi)
- `db.php` — MySQL qatlami (PDO, jadval sxemasi, avtomatik yaratish)
- `seed.php` — standart boshlang'ich kontent (data.json bo'lmasa)
- `index.php` — bosh sahifaga yo'naltiradi
- `.htaccess` — Apache sozlamalari
- `robots.txt`, `sitemap.xml` — qidiruv tizimlari (SEO) uchun
- `*.js`, `site.css`, `logo-*.png` — kod va resurslar

> **Eslatma (SEO):** `robots.txt` va `sitemap.xml` ichida `SIZNING-DOMENINGIZ.uz`
> placeholderi bor — hostingga chiqarganingizda uni haqiqiy domeningizga almashtiring.

---

## 🚀 XAMPP'da ishga tushirish

1. **XAMPP**'ni o'rnating va **Apache**'ni ishga tushiring (Start).
2. Ushbu `tstm-sayt` papkasini XAMPP'ning **`htdocs`** papkasiga ko'chiring.
   Masalan: `C:\xampp\htdocs\tstm-sayt`
3. Brauzerda oching:
   - **Sayt:** `http://localhost/tstm-sayt/`
   - **Admin panel:** `http://localhost/tstm-sayt/admin.html`

> `http://localhost/tstm-sayt/` ochilganda `index.php` avtomatik bosh sahifaga olib boradi.

---

## 🔐 Admin panelga kirish

- **Login:** `markaz_admini`
- **Parol:** `PAROL-TARIXDAN-OLIB-TASHLANDI`

> Parolni o'zgartirish: `api.php` faylidagi `$DEFAULT_PASS` qiymatini (yoki birinchi
> ishga tushgandan keyin `data.json` ichidagi `auth` qismini) tahrirlang.

---

## 💾 Ma'lumotlar qanday saqlanadi?

- PHP + MySQL (XAMPP) ishlaganda — barcha kontent **`tstm` MySQL bazasi**ga yoziladi.
  Admin'da qilingan har qanday o'zgarish **barcha tashrifchilarga** ko'rinadi.
- Baza va jadvallar **birinchi ochilishda avtomatik yaratiladi** (`db.php`).
  Agar loyihada eski `data.json` bo'lsa — u avtomatik MySQL'ga **import qilinadi**
  (kontent + parol xeshi saqlanadi). Bo'lmasa — `seed.php`dagi standart kontent.
- Ma'lumot bazasidan tashqari **hech qanday sozlash shart emas** — XAMPP'da MySQL
  ishlab tursa kifoya. Baza login/parolini `db.php` boshidagi sozlamalardan o'zgartiring.
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
- Baza login/parolini o'zgartirish: **`db.php`** boshidagi `$DB_HOST/$DB_NAME/$DB_USER/$DB_PASS`.

---

## 🔒 Xavfsizlik — hostingga chiqarishdan oldin

- **Standart parolni albatta almashtiring.** Admin panelga kirib, parolni o'zgartiring
  (yoki `change_password` endpoint orqali). Parol serverda faqat **bcrypt xesh** holida
  (`auth` jadvali) saqlanadi — oddiy matnda hech qachon yozilmaydi.
- **Baza parolini qo'ying.** Hostingda `db.php`dagi `$DB_PASS`ni bo'sh qoldirmang.
- Yozuv amallari **CSRF token** bilan himoyalangan (faqat login qilgan admin + to'g'ri token).
- Barcha so'rovlar **PDO prepared statement** — SQL-injection mumkin emas.
- Login urinishlari cheklangan (1 soat ichida 5 marta xato — 10 daqiqaga bloklanadi).
- Aloqa formasi spamdan himoyalangan: bitta IP 10 daqiqada eng ko'pi 5 ta xabar;
  bo'sh murojaatlar rad etiladi; jami 5000 tadan oshmaydi.
- Rasm yuklash faqat PNG/JPG/WEBP/GIF (SVG ataylab o'chirilgan — XSS xavfi).
- `db.php`, `seed.php`, `*.json` fayllari `.htaccess` orqali tashqaridan to'g'ridan-to'g'ri
  ochilishdan himoyalangan.
- Admin amallari (`upsert`/`remove`/`login`/…) `audit_log` jadvalida qayd etiladi.
