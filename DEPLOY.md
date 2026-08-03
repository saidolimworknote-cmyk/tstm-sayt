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

## 2b. PHP sozlamalari (php.ini)

- [ ] `post_max_size` va `upload_max_filesize` — **kamida 48M**.

      ⚠️ Bu MUHIM: fayl serverga `base64` ko'rinishida yuboriladi va hajmi ~33%
      oshadi. Kod 30 MB gacha hujjatga ruxsat beradi, lekin 30 MB fayl so'rov
      tanasida ~40 MB bo'ladi. `post_max_size = 40M` bo'lsa PHP so'rovni **kod
      ishga tushishidan oldin** rad etadi va foydalanuvchi tushunarsiz xato
      ko'radi. 48M zaxira beradi.

- [ ] `memory_limit` — kamida `256M` (o'lchangan sarf 6 MB/so'rov, lekin Word
      matni joylashtirilgan yirik nashrlar uchun zaxira kerak).
- [ ] `display_errors = Off` (kodda `error_reporting(0)` bor, lekin server
      darajasida ham yopilishi kerak).
- [ ] `max_execution_time` — kamida 60.

## 2c. Tezlik: siqish va kesh

Bu ikki blok `.htaccess` ga qo'shilmasa sayt **ishlaydi, lekin sezilarli sekin**.

- [ ] **gzip siqish yoqilgan** (`mod_deflate`). O'lchangan tejov: CSS/JS/HTML
      **316 KB → 90 KB (72%)**.

      ```apache
      <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml
        AddOutputFilterByType DEFLATE application/javascript application/json
        AddOutputFilterByType DEFLATE image/svg+xml
      </IfModule>
      ```

- [ ] **Statik fayllar uchun kesh sarlavhalari** (`mod_expires`).

      Loyihada `?v=` versiyalash sxemasi bor (fayl o'zgarganda raqam oshadi),
      lekin u faqat brauzer fayllarni **keshlasa** ma'noga ega. Kesh sarlavhasi
      bo'lmasa takroriy tashrifchi har safar hamma narsani qayta yuklaydi.

      ```apache
      <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType text/css              "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
        ExpiresByType image/png             "access plus 6 months"
        ExpiresByType image/jpeg            "access plus 6 months"
        ExpiresByType image/webp            "access plus 6 months"
        ExpiresDefault                      "access plus 1 day"
      </IfModule>
      ```

      > `1 year` xavfsiz: fayl o'zgarganda `?v=` raqami oshadi va brauzer uni
      > **yangi manzil** deb biladi. HTML esa keshlanmaydi (`ExpiresDefault`
      > 1 kun) — shuning uchun yangi versiya raqami darhol yetib boradi.

- [ ] Tekshiruv: `curl -sI -H "Accept-Encoding: gzip" https://saytingiz.uz/site.css`
      javobida `Content-Encoding: gzip` va `Cache-Control`/`Expires` bo'lsin.

## 3. HTTPS

> ⚠️ **HTTPS bu yerda ixtiyoriy emas.** Push-bildirishnomaga obuna (Service
> Worker + Push API) brauzer standarti bo'yicha faqat xavfsiz ulanishda
> ishlaydi. `http://` da obuna oynasi umuman ko'rinmaydi va admin paneldagi
> «Bildirishnoma» bo'limi foydasiz qoladi.

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

## 4c. Infratuzilma va tarmoq (hosting muhitida)

> Bu bandlar **serverdan tashqarida** — domen, tarmoq, DNS provayder darajasida
> hal qilinadi va mahalliy (XAMPP) muhitda sinab bo'lmaydi. Sayt hostingga
> chiqarilganda bajariladi. UzInfocom infratuzilmasida joylashtirilsa,
> ularning ko'pi platforma darajasida ta'minlanadi — u holda «kim javobgar»
> ustunini ular bilan aniqlashtiring.

### DNS va domen
- [ ] Domen (`*.uz`) UzInfocom/CCTLD orqali ro'yxatdan o'tgan.
- [ ] DNS yozuvlari: `A`/`AAAA` (server IP), `www` → asosiy domen (CNAME yoki A).
- [ ] `CAA` yozuvi — faqat ishlatilayotgan sertifikat markazi (masalan Let's
      Encrypt) sertifikat bera olsin (`0 issue "letsencrypt.org"`).
- [ ] TTL joylashuvdan oldin past (300s), barqarorlashgach oshiriladi.
- [ ] DNSSEC yoqilgan (provayder qo'llasa) — DNS soxtalashtirishga qarshi.

### DDoS va tarmoq himoyasi
- [ ] Server old tomonida qalqon (reverse proxy / WAF — masalan Cloudflare yoki
      UzInfocom shlyuzi). Sayt IP'si to'g'ridan-to'g'ri commsiz ochiq turmasin.
- [ ] Firewall: faqat 80/443 ochiq. MySQL porti (3306) **tashqaridan yopiq** —
      faqat `localhost`. SSH (22) faqat ma'lum IP'lardan.
- [ ] Fail2ban yoki shunga o'xshash — takroriy suiiste'mol IP'larini bloklaydi.
      (Ilova darajasidagi brute-force qulfi allaqachon bor — bu qo'shimcha qatlam.)
- [ ] Apache `mod_evasive` yoki proksi darajasida so'rov tezligi cheklovi.

### CDN va yetkazib berish (ixtiyoriy — trafik o'ssagina)
- [ ] Statik resurslar (rasm, CSS, JS) CDN orqali. `.htaccess` da 1 yillik kesh
      va `ETag` allaqachon sozlangan — CDN ularni to'g'ri o'qiydi.
- [ ] Faqat statik content keshlansin; `api.php` va `admin.html` **hech qachon**
      CDN keshiga tushmasin (ular `Cache-Control: no-store` beradi).
- [ ] TSTM auditoriyasi asosan O'zbekistonda — CDN mahalliy tugun (PoP) bilan
      bo'lsa foydali, aks holda shart emas.

### Monitoring va ogohlantirish
- [ ] Uptime kuzatuvchi (masalan UptimeRobot yoki mahalliy Zabbix) — `/` va
      `/api.php?action=load` har 5 daqiqada tekshiriladi, uzilishda SMS/email.
- [ ] Disk to'lishi kuzatiladi — `uploads/` va MySQL o'sishi (80% da ogohlantirish).
- [ ] `audit_log` va `error_log` jadvallari muntazam ko'riladi (admin panel →
      Audit / Xatoliklar bo'limlari) — shubhali kirish yoki ko'p xatoliklar.
- [ ] Server jurnallari (Apache `error.log`, `access.log`) saqlanadi va aylanadi
      (`logrotate`).

### Masshtablash (kelajakda, agar trafik o'ssa)
- [ ] Sayt hozir **bitta serverda** yetarli (yuk testi: statik ~900 req/s,
      keshli API ~55 req/s bitta mashinada — real serverda yuqoriroq).
- [ ] O'sish bo'lsa birinchi qadam: PHP OPcache yoqish + MariaDB xotira sozlash
      (`innodb_buffer_pool_size`), keyin ko'proq RAM. Gorizontal masshtablash
      (bir necha server) hozir kerak emas.
- [ ] Statsiz joylashtirish: sessiya fayllari serverda saqlanadi. Agar bir
      nechta serverga o'tilsa, sessiyani umumiy omborga (Redis/DB) ko'chirish
      kerak bo'ladi — hozir bitta server uchun bu shart emas.

## 5. Muntazam ish (oyiga bir marta)

- [ ] **To'liq zaxira olingan** (baza + yuklangan fayllar):

      ```powershell
      powershell -ExecutionPolicy Bypass -File backup.ps1
      ```

      Natija: `backups\tstm-YYYYMMDD-HHmmss\` ichida `database.sql` +
      `uploads.zip` + `meta.txt`. Skript oxirgi 14 ta zaxirani saqlaydi,
      eskisini avtomatik o'chiradi. **Nusxani boshqa diskka/joyga ham
      ko'chiring** — bitta serverdagi zaxira ofat (disk nosozligi) da yordam
      bermaydi.

- [ ] PHP va MySQL yangilanishlari o'rnatilgan.
- [ ] `audit_log` jadvalidagi kirish urinishlari ko'rib chiqilgan
      (shubhali IP bormi?):

      ```sql
      SELECT ip, COUNT(*) c, MAX(at) oxirgi
      FROM audit_log WHERE action = 'login'
      GROUP BY ip ORDER BY c DESC LIMIT 20;
      ```

## 5b. Ofatdan tiklash (zaxiradan qaytarish)

Server buzilsa yoki ma'lumot yo'qolsa, eng oxirgi zaxiradan tiklang:

```powershell
# Eng oxirgi zaxirani asl bazaga tiklaydi (uploads bilan). Tasdiqlash so'raydi.
powershell -ExecutionPolicy Bypass -File restore.ps1

# Aniq bir zaxiradan:
powershell -ExecutionPolicy Bypass -File restore.ps1 -From "backups\tstm-20260803-095616"
```

> **Zaxirani muntazam sinab turing.** Tiklashni haqiqiy bazaga tegmasdan sinov
> bazasida tekshirish mumkin (asl ma'lumot xavfsiz qoladi):
>
> ```powershell
> powershell -ExecutionPolicy Bypass -File restore.ps1 -Db tstm_restore_test -Force
> # yozuvlar soni asl bazaga mos kelishini tekshiring, so'ng:
> # DROP DATABASE tstm_restore_test;
> ```
>
> Sinalmagan zaxira — zaxira emas. Bu loyihada tiklash 12 jadval bo'yicha
> muvaffaqiyatli sinovdan o'tgan (2026-08-03).

## 6. Sayt yangilanganda (kesh qoidasi)

`.js` yoki `.css` faylni o'zgartirsangiz, uni chaqiruvchi HTML'dagi `?v=` raqamini
oshiring — aks holda foydalanuvchilarda eski nusxa qolib ketadi:

```html
<script src="site-common.js?v=64"></script>   <!-- 64 -> 65 -->
```
