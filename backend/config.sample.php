<?php
/* ============================================================
   TSTM — mahalliy sozlamalar NAMUNASI
   ------------------------------------------------------------
   ODATDA BU FAYL SIZGA KERAK EMAS.

   `tools\ISHGA_TUSHIRISH.bat` birinchi ishga tushirishda `config.php`
   ni O'ZI yaratadi va baza parolini tasodifiy generatsiya qiladi.
   Ya'ni har kompyuterda o'z paroli bo'ladi va hech qanday parol
   repoga tushmaydi.

   Bu namuna ikki holat uchun:
     1) sozlamalarni QO'LDA o'zgartirmoqchi bo'lsangiz;
     2) HOSTINGGA chiqarganda — u yerda baza boshqacha bo'ladi.

   `config.php` git'ga TUSHMAYDI (.gitignore) va veb orqali
   ochilmaydi (.htaccess + router.php) — baza paroli shu tarzda
   koddan ajratilgan.

       cp config.sample.php config.php
   ============================================================ */

return [
  /* -------------------- Ma'lumotlar bazasi -------------------- */
  'db_host' => '127.0.0.1',

  /* Port 3307 — loyihaning O'Z MariaDB'si (`runtime\mysql`) shu portda
     ishlaydi. ATAYLAB 3306 EMAS: kompyuterda boshqa MySQL o'rnatilgan
     bo'lsa (yoki XAMPP qolgan bo'lsa) ular bir-biriga xalaqit bermaydi.
     Hostingda odatda 3306 bo'ladi. */
  'db_port' => '3307',

  'db_name' => 'tstm',

  /* `root` EMAS: faqat `tstm` bazasiga huquqi bor alohida foydalanuvchi.
     Shu tufayli sayt buzilgan taqdirda ham hujumchi boshqa bazalarga
     yoki server sozlamalariga tega olmaydi. */
  'db_user' => 'tstm',

  /* Parol. Mahalliyda uni ishga tushiruvchi tasodifiy yaratadi.
     HOSTINGDA albatta o'zingizning kuchli parolingizni qo'ying. */
  'db_pass' => '',

  /* -------------------- Admin (faqat BIRINCHI ishga tushirish) --------------------
     Baza butunlay bo'sh bo'lganda birinchi marta kirish uchun. Login qilingan
     zahoti parol bcrypt bilan xeshlanadi va bazaga yoziladi — shundan keyin
     bu qiymat umuman ishlatilmaydi.

     BO'SH QOLDIRILSA — parolsiz kirish MUMKIN EMAS. Aynan shuning uchun
     standart parol kod ichida saqlanmaydi: repoga kirgan har bir odam uni
     ko'rib, yangi o'rnatilgan saytga kira olardi.

     ODATDA BU QATORNI QO'LDA TO'LDIRISH SHART EMAS: `tools\ISHGA_TUSHIRISH.bat`
     birinchi ishga tushirishda config.php ni o'zi yaratadi, bu yerga tasodifiy
     parol yozadi va uni oynada bir marta KO'RSATADI. Shu parol bilan kiring va
     darhol o'zgartiring.

     ESLATMA: `auth` jadvali `data\baza.sql` eksportiga ATAYLAB tushmaydi —
     parol xeshi git orqali tarqalmasligi kerak. Ya'ni yangi kompyuterda eski
     parolingiz ISHLAMAYDI, u yerda kirish faqat shu bootstrap parol bilan
     boshlanadi. Parolni yo'qotsangiz: `auth` jadvalidagi qatorni o'chiring,
     shundan keyin bu qiymat yana ishlay boshlaydi.
  ------------------------------------------------------------------------------ */
  'admin_user' => 'markaz_admini',
  'admin_bootstrap_password' => '',
];
