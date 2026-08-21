# TSTM — testlar

Sayt ishlashini va asosiy xavfsizlik himoyalarini tekshiruvchi avtomatik
testlar. Har o'zgarishdan keyin ishga tushiring.

## smoke.ps1

Ommaviy (autentifikatsiyasiz) yuzani tekshiradi — parol talab qilmaydi, shuning
uchun istalgan vaqtda xavfsiz ishga tushirsa bo'ladi.

```powershell
# Avval saytni ishga tushiring: tools\ISHGA_TUSHIRISH.bat
powershell -ExecutionPolicy Bypass -File tests\smoke.ps1

# boshqa manzil bilan (masalan 8000 band bo'lib, sayt 8001 da ochilgan bo'lsa):
powershell -ExecutionPolicy Bypass -File tests\smoke.ps1 -Base http://localhost:8001
```

**Nimani tekshiradi (104 ta test):**

| Bo'lim | Tekshiruv |
|--------|-----------|
| 1. Sahifalar | 24 ta sahifa (admin.html bilan) 200 qaytaradi |
| 2. API kontrakti | `load` haqiqiy JSON, kerakli kalitlar bor, **maxfiy bo'limlar (users/messages/subscribers) anonimda bo'sh**, parol xeshi sizmaydi |
| 3. Xavfsizlik sarlavhalari | CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, admin noindex |
| 4. Maxfiy fayllar | config.php, db.php, data.json va h.k. HTTP orqali 403/404 |
| 5. Fayl yuklash | uploads/ da PHP bajarilmaydi (RCE himoyasi) |
| 6. Auth | anonim upsert/remove rad etiladi |
| 7. Kirish validatsiyasi | yaroqsiz email, SSRF endpoint, maxfiy item rad etiladi |
| 8. Menyu havolalari | menyudagi 20 ta havola boshi berk ko'chaga olib bormaydi |
| 9. Menyuning ikki nusxasi | `site-common.js` → `NAV` dagi HAR BIR havola `index.html` dagi qo'lda yozilgan menyuda ham bormi |
| 10. Admin menyusi | `menyu-mos.js` ni chaqiradi (node bo'lmasa o'tkazib yuboriladi) |

**Chiqish kodi:** `0` = hammasi o'tdi, `1` = kamida bittasi yiqildi (CI uchun mos).

## menyu-mos.js

Admin panelning yon menyusi sayt menyusiga mos keladimi. HTTP emas — MANBA
fayllarni o'qiydi, shuning uchun sayt ishlab turmasa ham ishlaydi.

```powershell
node tests\menyu-mos.js
```

| Bo'lim | Tekshiruv |
|--------|-----------|
| A | Admin panelning har bir kontent bo'limi ko'rsatgan sayt sahifasi diskda bormi |
| B | O'sha sahifa sayt MENYUSIDA ham bormi — tashrifchi uni topa oladimi |
| C | Sayt menyusida bor, lekin admin'da bo'limi yo'q sahifalar (eslatma sifatida) |

> **Nega kerak bo'ldi:** menyu uch joyda yashaydi (`site-common.js` → `NAV`,
> `index.html`, `admin-ui.js` → `NAV`) va ular ayrilib ketganda hech qanday
> xato chiqmaydi. 2026-08-22 gacha admin panelda «Yangiliklar» bo'limi bor edi,
> saytning menyusida esa unday band yo'q edi — kontent qo'ygan odam uni saytdan
> topa olmasdi. O'sha bo'lim butunlay olib tashlandi.
>
> QOIDA: sayt — etalon. Admin panelda saytda muqobili YO'Q kontent bo'limi
> bo'lmasligi kerak; bu skript shuni qo'riqlaydi.

## Qo'lda test qilinadigan qismlar

Quyidagilar avtomatik testda yo'q (admin paroli yoki brauzer kerak):

- **Admin CRUD** — login qilib yozuv qo'shish/tahrirlash/o'chirish.
- **Brute-force qulfi** — 5 marta noto'g'ri parol → 429 (login_attempts jadvalini
  keyin tozalash kerak).
- **Saqlangan XSS render** — admin panelda murojaat matni `esc()` bilan
  chiqishini brauzerda ko'zdan kechirish (kod darajasida tasdiqlangan).
