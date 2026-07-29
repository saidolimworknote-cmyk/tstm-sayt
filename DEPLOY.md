# TSTM — hostingga chiqarish va xavfsizlik cheklisti

Bu hujjat saytni haqiqiy serverga o'rnatishda bajarilishi shart bo'lgan
qadamlarni sanaydi. Har bir band `[ ]` — bajarilgach `[x]` qiling.

Loyihaning texnik xavfsizlik holati: [SECURITY.md](SECURITY.md)

---

## 1. Serverga qo'yishdan oldin

- [ ] **`config.php` yaratilgan.** `config.sample.php` dan nusxalang:
      `cp config.sample.php config.php`
      Bu fayl git'ga tushmaydi va veb orqali ochilmaydi — baza paroli shu yerda.

- [ ] **Baza uchun alohida foydalanuvchi yaratilgan** (`root` ISHLATILMAYDI).
      MySQL'da bir marta bajaring (parolni o'zingiznikiga almashtiring):

      ```sql
      CREATE DATABASE IF NOT EXISTS tstm
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

      CREATE USER 'tstm_app'@'localhost'
        IDENTIFIED BY 'BU_YERGA_KUCHLI_PAROL';

      -- Faqat kerakli huquqlar. DROP/GRANT/FILE berilmaydi.
      GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX
        ON tstm.* TO 'tstm_app'@'localhost';

      FLUSH PRIVILEGES;
      ```

      Keyin `config.php` da: `'db_user' => 'tstm_app'`, `'db_pass' => '...'`.

      > `CREATE`/`ALTER` kerak, chunki `db.php` jadvallarni birinchi ishga
      > tushishda o'zi yaratadi va migratsiya qiladi. Jadvallar bir marta
      > yaratilgach bu ikki huquqni olib tashlashingiz mumkin.

- [ ] **Admin paroli almashtirilgan.** Kamida 12 belgi.
      Admin panel → Sozlamalar → «Xavfsizlik — kirish paroli».

- [ ] **`config.php` dagi `admin_bootstrap_password` bo'sh.**
      U faqat butunlay yangi (bo'sh) bazani birinchi marta ochish uchun kerak.
      Kirgandan keyin darhol bo'shatiladi.

## 2. Fayl huquqlari

- [ ] `config.php` — faqat veb-server o'qiy oladi (`chmod 640`, egasi veb-server).
- [ ] `uploads/` — veb-server yoza oladi (`chmod 755`), lekin ichida PHP
      ishlamaydi (buni `uploads/.htaccess` ta'minlaydi — u ham ko'chirilsin!).
- [ ] `.htaccess` fayllari serverga ko'chirilgan (FTP ba'zan nuqta bilan
      boshlanadigan fayllarni yashiradi — alohida tekshiring).
- [ ] Apache'da `AllowOverride All` yoqilgan, aks holda `.htaccess` umuman
      o'qilmaydi va **barcha himoya qoidalari ishlamaydi**.

## 3. HTTPS

- [ ] SSL sertifikat o'rnatilgan (Let's Encrypt bepul).
- [ ] `.htaccess` boshidagi HTTPS bloki yoqilgan (`#` lar olib tashlangan).
- [ ] HSTS avval `max-age=300` bilan sinalgan, so'ng `31536000` ga ko'tarilgan.
- [ ] `https://saytingiz.uz` ochilishi tekshirilgan, `http://` avtomatik
      `https://` ga o'tayotgani tasdiqlangan.

## 4. O'rnatgandan keyin tekshirish

Quyidagi manzillar **403 yoki 404** qaytarishi shart (ochilib qolmasin):

- [ ] `/config.php`
- [ ] `/config.sample.php`
- [ ] `/db.php`
- [ ] `/seed.php`
- [ ] `/data.json`
- [ ] `/.htaccess`
- [ ] `/.git/config`
- [ ] `/uploads/` (papka ro'yxati ko'rinmasin)

Quyidagilar **200** qaytarishi shart:

- [ ] `/` (bosh sahifaga yo'naltiradi)
- [ ] `/api.php?action=load` — ichida `messages`, `subscribers`, `users`
      **bo'sh massiv** bo'lishi va `passwordHash` **umuman bo'lmasligi** kerak.
- [ ] `/robots.txt`, `/sitemap.xml`

Xavfsizlik sarlavhalari (brauzer DevTools → Network → Response Headers):

- [ ] `Content-Security-Policy` bor va ichida `'unsafe-inline'` **yo'q**
- [ ] `X-Frame-Options: SAMEORIGIN`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Strict-Transport-Security` (HTTPS yoqilgandan keyin)

## 5. Muntazam ish (oyiga bir marta)

- [ ] Admin panel → Sozlamalar → ma'lumotlar zaxirasi olingan.
- [ ] MySQL zaxirasi: `mysqldump -u tstm_app -p tstm > zaxira_YYYY-MM-DD.sql`
- [ ] PHP va MySQL yangilanishlari o'rnatilgan.
- [ ] `audit_log` jadvalidagi kirish urinishlari ko'rib chiqilgan
      (shubhali IP bormi?):

      ```sql
      SELECT ip, COUNT(*) c, MAX(at) oxirgi
      FROM audit_log WHERE action = 'login'
      GROUP BY ip ORDER BY c DESC LIMIT 20;
      ```

## 6. Sayt yangilanganda (kesh qoidasi)

`.js` yoki `.css` faylni o'zgartirsangiz, uni chaqiruvchi HTML'dagi `?v=` raqamini
oshiring — aks holda foydalanuvchilarda eski nusxa qolib ketadi:

```html
<script src="site-common.js?v=64"></script>   <!-- 64 -> 65 -->
```
