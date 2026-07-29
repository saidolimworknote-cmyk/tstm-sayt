<?php
/* ============================================================
   TSTM — mahalliy sozlamalar NAMUNASI
   ------------------------------------------------------------
   Bu faylni `config.php` nomi bilan NUSXALANG va o'z qiymatlaringizni
   yozing. `config.php` git'ga TUSHMAYDI (.gitignore) va veb orqali
   ochilmaydi (.htaccess) — baza paroli shu tarzda koddan ajratilgan.

       cp config.sample.php config.php

   config.php bo'lmasa, quyidagi standart XAMPP qiymatlari ishlatiladi,
   ya'ni mahalliy ishlab chiqish hech narsa sozlamasdan ishlayveradi.
   ============================================================ */

return [
  /* -------------------- Ma'lumotlar bazasi -------------------- */
  'db_host' => '127.0.0.1',
  'db_port' => '3306',
  'db_name' => 'tstm',
  'db_user' => 'root',
  // XAMPP'da odatda bo'sh. HOSTINGDA albatta o'zingizning kuchli
  // parolingizni qo'ying va `root` emas, faqat shu bazaga huquqi bor
  // alohida foydalanuvchi yarating.
  'db_pass' => '',

  /* -------------------- Admin (faqat BIRINCHI ishga tushirish) --------------------
     Baza butunlay bo'sh bo'lganda birinchi marta kirish uchun. Login qilingan
     zahoti parol bcrypt bilan xeshlanadi va bazaga yoziladi — shundan keyin
     bu qiymat umuman ishlatilmaydi.

     BO'SH QOLDIRILSA — parolsiz kirish MUMKIN EMAS. Aynan shuning uchun
     standart parol kod ichida saqlanmaydi: repoga kirgan har bir odam uni
     ko'rib, yangi o'rnatilgan saytga kira olardi.

     Birinchi o'rnatishda shu yerga vaqtinchalik kuchli parol yozing, tizimga
     kiring, admin panelidan parolni almashtiring va bu qatorni bo'shating.
  ------------------------------------------------------------------------------ */
  'admin_user' => 'markaz_admini',
  'admin_bootstrap_password' => '',
];
