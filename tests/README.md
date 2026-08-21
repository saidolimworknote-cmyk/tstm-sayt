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

**Nimani tekshiradi (43 ta test):**

| Bo'lim | Tekshiruv |
|--------|-----------|
| 1. Sahifalar | 11 ta asosiy sahifa 200 qaytaradi |
| 2. API kontrakti | `load` haqiqiy JSON, kerakli kalitlar bor, **maxfiy bo'limlar (users/messages/subscribers) anonimda bo'sh**, parol xeshi sizmaydi |
| 3. Xavfsizlik sarlavhalari | CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, admin noindex |
| 4. Maxfiy fayllar | config.php, db.php, data.json va h.k. HTTP orqali 403/404 |
| 5. Fayl yuklash | uploads/ da PHP bajarilmaydi (RCE himoyasi) |
| 6. Auth | anonim upsert/remove rad etiladi |
| 7. Kirish validatsiyasi | yaroqsiz email, SSRF endpoint, maxfiy item rad etiladi |

**Chiqish kodi:** `0` = hammasi o'tdi, `1` = kamida bittasi yiqildi (CI uchun mos).

## Qo'lda test qilinadigan qismlar

Quyidagilar avtomatik testda yo'q (admin paroli yoki brauzer kerak):

- **Admin CRUD** — login qilib yozuv qo'shish/tahrirlash/o'chirish.
- **Brute-force qulfi** — 5 marta noto'g'ri parol → 429 (login_attempts jadvalini
  keyin tozalash kerak).
- **Saqlangan XSS render** — admin panelda murojaat matni `esc()` bilan
  chiqishini brauzerda ko'zdan kechirish (kod darajasida tasdiqlangan).
