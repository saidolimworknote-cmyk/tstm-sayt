<?php
/* ==================================================================
   TSTM — sahifa bannerlarini yasash
   ------------------------------------------------------------------
   `img/banners/<kalit>.svg` fayllarini qaytadan chizadi.

   Ishga tushirish:  php tools\bannerlar-yasa.php

   NEGA GENERATOR, NEGA QO'LDA CHIZILGAN 10 TA FAYL EMAS
   10 ta bannerning foni, to'ri, globusi va ranglari BIR XIL bo'lishi
   kerak — ular bitta oila. Qo'lda yozilsa, palitra bir marta o'zgarganda
   10 ta faylni qo'lda tahrirlash kerak bo'lardi va ular asta-sekin
   bir-biridan uzoqlashardi. Bu yerda umumiy qism bitta joyda: pastdagi
   `ramka()`. Har bo'lim faqat O'Z motivini beradi.

   QAT'IY QOIDALAR (buzilsa banner ishlamay qoladi)
   1) RASM ICHIDA MATN YO'Q. Sayt uch tilli (uz/ru/en) — rasmga yozilgan
      so'z tarjima qilinmaydi va ruscha sahifada o'zbekcha bo'lib qolardi.
   2) MOTIV O'NGDA. site.css dagi `.page-banner.has-img::after` chap 62%
      ni qoraytiradi (sarlavha o'qilishi uchun). Chapga chizilgan narsa
      shunchaki ko'rinmaydi.
   3) XAVFSIZ MAYDON: x 980..1400, y 100..315. Banner `background-size:cover`
      bilan qo'yiladi, ya'ni RASM KESILADI. O'lchangan: 1440px keng ekranda
      y 55..364 ko'rinadi, 1920px da esa y 94..326 — kesishmasi shu.
      Undan tashqariga chiqqan detal ba'zi ekranlarda yo'qoladi.

   QATLAMLAR (2026-08-24, ikkinchi tahrir)
   Birinchi tahrirda har banner bitta yolg'iz belgidan iborat edi va
   juda quruq ko'rindi. Endi uch qatlam bor:
     1) FON     — gradient, mayda to'r;
     2) GLOBUS  — o'ng chetdan kirib kelayotgan orfografik globus simtori.
                  Markaz tashqi siyosat bilan shug'ullanadi: bu shakl
                  o'nta bannerni bitta mavzuga bog'laydi;
     3) MOTIV   — bo'limning o'z infografikasi + bitta ikkinchi darajali
                  bo'lak (soat, donut, natijalar ro'yxati...). Aynan shu
                  ikkinchi bo'lak chizmani "belgi"dan "infografika"ga
                  aylantiradi.
   ================================================================== */

$KENG = 1600;
$BAL  = 420;

/* --- Palitra. Sayt o'zgaruvchilaridan olingan (css/site.css):
       --footer #0D4483, --accent2 #1492e6. Fon quyuq — banner ustidagi
       oq sarlavha va gradient bilan bir jinsli ko'rinishi uchun. ------ */
$FON1 = '#071528';   // chap yuqori — eng quyuq
$FON2 = '#0b2a4e';   // o'rta
$FON3 = '#11467f';   // o'ng past — sayt ko'ki
$CHIZ = '#9ecdf0';   // chiziqlar (och havorang)
$URG  = '#2f9be0';   // urg'u to'ldirish
$URG2 = '#7fd1ff';   // yorqin urg'u

/* --- Globus simtori (o'ng chetda) ---------------------------------
   Orfografik proyeksiya: meridianlar — bir xil markazli ellipslar,
   parallellar — doira ichidagi gorizontal vatarlar. Markaz ATAYLAB
   tuvaldan tashqarida: to'liq shar emas, chetdan kirib kelayotgan
   yoy kerak — u motivga xalaqit bermaydi, faqat chuqurlik beradi. */
function globus(): string {
  $cx = 1720; $cy = 210; $R = 430;
  $o = "  <g stroke=\"CHIZ\" fill=\"none\" opacity=\".17\">\n";
  $o .= "    <circle cx=\"{$cx}\" cy=\"{$cy}\" r=\"{$R}\" stroke-width=\"1.6\"/>\n";
  foreach ([400, 320, 200, 70] as $rx) {
    $o .= "    <ellipse cx=\"{$cx}\" cy=\"{$cy}\" rx=\"{$rx}\" ry=\"{$R}\" stroke-width=\"1.1\"/>\n";
  }
  // parallellar: markazdan dy uzoqlikdagi vatar yarim uzunligi = sqrt(R^2-dy^2)
  foreach ([0, 89, -89, 182, -182, 275, -275] as $dy) {
    $yarim = (int) round(sqrt($R * $R - $dy * $dy));
    $y = $cy + $dy;
    $x1 = $cx - $yarim;
    $o .= "    <path d=\"M{$x1} {$y}h" . (2 * $yarim) . "\" stroke-width=\"1.1\"/>\n";
  }
  $o .= "  </g>\n";
  return $o;
}

/* Umumiy ramka: fon, to'r, globus, yorug'lik, ajratuvchi chiziq.
   $motiv — bo'limga xos chizma. */
function ramka(string $motiv): string {
  global $KENG, $BAL, $FON1, $FON2, $FON3, $CHIZ;
  $glob = globus();
  return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {$KENG} {$BAL}" width="{$KENG}" height="{$BAL}" role="presentation" aria-hidden="true">
<defs>
  <linearGradient id="fon" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="{$FON1}"/>
    <stop offset=".55" stop-color="{$FON2}"/>
    <stop offset="1" stop-color="{$FON3}"/>
  </linearGradient>
  <pattern id="tur" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M40 0H0V40" fill="none" stroke="{$CHIZ}" stroke-width=".7" opacity=".075"/>
  </pattern>
  <radialGradient id="nur" cx=".735" cy=".5" r=".33">
    <stop offset="0" stop-color="{$CHIZ}" stop-opacity=".22"/>
    <stop offset="1" stop-color="{$CHIZ}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="{$KENG}" height="{$BAL}" fill="url(#fon)"/>
<rect width="{$KENG}" height="{$BAL}" fill="url(#tur)"/>
{$glob}
<rect width="{$KENG}" height="{$BAL}" fill="url(#nur)"/>
<!-- Matn zonasi bilan chizma zonasini ajratuvchi ingichka chiziq. -->
<g stroke="{$CHIZ}" fill="none" opacity=".16">
  <path d="M944 118v184" stroke-width="1.2"/>
  <rect x="940" y="206" width="8" height="8" fill="{$CHIZ}" stroke="none"/>
</g>
<g fill="none" stroke="{$CHIZ}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
{$motiv}
</g>
</svg>
SVG;
}

/* Yordamchi: matn qatorlarini taqlid qiluvchi cho'ziq to'rtburchaklar.
   Hujjat/karta ichidagi "matn" shunday ko'rsatiladi — haqiqiy harf yozib
   bo'lmaydi (1-qoida). */
function qatorlar(float $x, float $y, array $kengliklar, float $qadam = 20, float $qal = 5, string $op = '.42'): string {
  $o = '';
  foreach ($kengliklar as $i => $w) {
    $yy = $y + $i * $qadam;
    $o .= "  <rect x=\"{$x}\" y=\"{$yy}\" width=\"{$w}\" height=\"{$qal}\" rx=\"" . ($qal / 2) . "\" fill=\"CHIZ\" opacity=\"{$op}\" stroke=\"none\"/>\n";
  }
  return $o;
}

$MOTIVLAR = [];

/* ---- Tadbirlar: taqvim + kun tartibi + soat ------------------------ */
$MOTIVLAR['events'] = function () {
  $o  = "  <rect x=\"986\" y=\"110\" width=\"214\" height=\"196\" rx=\"10\" opacity=\".8\"/>\n";
  $o .= "  <path d=\"M986 156h214\" opacity=\".55\"/>\n";
  foreach ([1026, 1093, 1160] as $x) {
    $o .= "  <path d=\"M{$x} 98v22\" stroke-width=\"5\" opacity=\".7\"/>\n";
  }
  // hafta kunlari — sarlavha ostidagi mayda chiziqchalar
  for ($c = 0; $c < 5; $c++) {
    $x = 1014 + $c * 42;
    $o .= "  <path d=\"M{$x} 168h14\" stroke-width=\"2\" opacity=\".3\"/>\n";
  }
  // kunlar to'ri
  $n = 0;
  for ($r = 0; $r < 4; $r++) {
    for ($c = 0; $c < 5; $c++) {
      $x = 1021 + $c * 42; $y = 190 + $r * 30; $n++;
      if ($n === 13) continue; // tanlangan kun alohida chiziladi
      $o .= "  <circle cx=\"{$x}\" cy=\"{$y}\" r=\"3.6\" fill=\"CHIZ\" opacity=\".36\" stroke=\"none\"/>\n";
    }
  }
  $o .= "  <circle cx=\"1105\" cy=\"250\" r=\"13\" fill=\"URG\" stroke=\"none\"/>\n";
  // soat — taqvim burchagini bosib turadi: "sana + vaqt"
  $o .= "  <circle cx=\"1200\" cy=\"126\" r=\"25\" fill=\"#0b2a4e\" stroke=\"none\"/>\n";
  $o .= "  <circle cx=\"1200\" cy=\"126\" r=\"25\" stroke=\"URG2\" stroke-width=\"2.2\" opacity=\".9\"/>\n";
  $o .= "  <path d=\"M1200 111v15l11 7\" stroke=\"URG2\" stroke-width=\"2.2\"/>\n";
  // kun tartibi
  $o .= "  <path d=\"M1256 132v168\" opacity=\".4\"/>\n";
  foreach ([[142, 100], [194, 74], [246, 116], [296, 66]] as $i => [$y, $w]) {
    $urg = $i === 2;
    $o .= "  <circle cx=\"1256\" cy=\"{$y}\" r=\"" . ($urg ? '7' : '6') . "\" fill=\"" . ($urg ? 'URG2' : 'CHIZ') . "\" stroke=\"none\" opacity=\"" . ($urg ? '1' : '.34') . "\"/>\n";
    $yy = $y - 5;
    $o .= "  <rect x=\"1278\" y=\"{$yy}\" width=\"{$w}\" height=\"10\" rx=\"5\" fill=\"CHIZ\" opacity=\"" . ($urg ? '.5' : '.28') . "\" stroke=\"none\"/>\n";
    if ($urg) { $o .= "  <path d=\"M1278 262h74\" opacity=\".22\" stroke-width=\"1.4\"/>\n"; }
  }
  return $o;
};

/* ---- Nashrlar: taxlangan hujjatlar + ustunlar + donut --------------- */
$MOTIVLAR['pubs'] = function () {
  $o  = "  <rect x=\"1000\" y=\"150\" width=\"188\" height=\"158\" rx=\"7\" opacity=\".22\"/>\n";
  $o .= "  <rect x=\"1020\" y=\"131\" width=\"188\" height=\"158\" rx=\"7\" opacity=\".4\"/>\n";
  $o .= "  <rect x=\"1040\" y=\"110\" width=\"200\" height=\"192\" rx=\"7\" opacity=\".9\"/>\n";
  $o .= qatorlar(1062, 138, [152, 120, 144]);
  foreach ([[1064, 34], [1096, 58], [1128, 44], [1160, 74]] as [$x, $h]) {
    $y = 272 - $h;
    $urg = $h === 74;
    $o .= "  <rect x=\"{$x}\" y=\"{$y}\" width=\"16\" height=\"{$h}\" rx=\"3\" fill=\"" . ($urg ? 'URG' : 'CHIZ') . "\" opacity=\"" . ($urg ? '1' : '.32') . "\" stroke=\"none\"/>\n";
  }
  $o .= "  <path d=\"M1062 280h156\" opacity=\".28\"/>\n";
  $o .= "  <path d=\"M1196 110v56l-18-13-18 13v-56\" fill=\"URG2\" opacity=\".9\" stroke=\"none\"/>\n";
  // donut — nashrlar tarkibi. Hujjatga ingichka chiziq bilan bog'langan.
  $o .= "  <path d=\"M1240 172h44\" opacity=\".28\" stroke-dasharray=\"3 5\" stroke-width=\"1.4\"/>\n";
  $o .= "  <circle cx=\"1330\" cy=\"172\" r=\"44\" opacity=\".26\" stroke-width=\"14\"/>\n";
  $o .= "  <path d=\"M1330 128a44 44 0 0 1 38 66\" stroke=\"URG\" stroke-width=\"14\" opacity=\".95\"/>\n";
  $o .= "  <path d=\"M1368 194a44 44 0 0 1-25 21\" stroke=\"URG2\" stroke-width=\"14\" opacity=\".8\"/>\n";
  $o .= qatorlar(1292, 240, [76, 52], 18, 5, '.3');
  return $o;
};

/* ---- Tadqiqotlar: o'qlar, egri chiziq, cho'qqi belgisi -------------- */
$MOTIVLAR['research'] = function () {
  $nuqta = [[1000, 262], [1058, 234], [1116, 248], [1174, 194], [1232, 208], [1290, 152], [1348, 128]];
  $p = implode(' ', array_map(fn($n) => "{$n[0]},{$n[1]}", $nuqta));
  $o  = "  <path d=\"M1000 108v188h352\" opacity=\".45\"/>\n";
  foreach ([156, 202, 248] as $y) {
    $o .= "  <path d=\"M1006 {$y}h346\" opacity=\".13\" stroke-dasharray=\"3 9\"/>\n";
    $o .= "  <path d=\"M994 {$y}h8\" opacity=\".3\" stroke-width=\"1.6\"/>\n";
  }
  for ($i = 0; $i < 7; $i++) {
    $x = 1012 + $i * 48; $h = 22 + (($i * 13) % 34);
    $y = 296 - $h;
    $o .= "  <rect x=\"{$x}\" y=\"{$y}\" width=\"15\" height=\"{$h}\" fill=\"CHIZ\" opacity=\".11\" stroke=\"none\"/>\n";
    $xt = $x + 7;
    $o .= "  <path d=\"M{$xt} 296v7\" opacity=\".26\" stroke-width=\"1.4\"/>\n";
  }
  $o .= "  <path d=\"M1000,296 L{$p} 1348,296 Z\" fill=\"URG\" opacity=\".14\" stroke=\"none\"/>\n";
  $o .= "  <polyline points=\"{$p}\" stroke=\"URG2\" stroke-width=\"2.6\"/>\n";
  foreach ($nuqta as $n) {
    $o .= "  <circle cx=\"{$n[0]}\" cy=\"{$n[1]}\" r=\"4.4\" fill=\"URG2\" stroke=\"none\" opacity=\".75\"/>\n";
  }
  // cho'qqi: romb belgi + o'qqacha tushuvchi punktir
  $o .= "  <path d=\"M1348 128v168\" opacity=\".26\" stroke-dasharray=\"3 6\" stroke-width=\"1.4\"/>\n";
  $o .= "  <path d=\"M1348 114l13 14-13 14-13-14z\" fill=\"URG2\" stroke=\"none\"/>\n";
  $o .= "  <circle cx=\"1290\" cy=\"152\" r=\"11\" stroke=\"URG2\" stroke-width=\"2.2\"/>\n";
  return $o;
};

/* ---- Markaz haqida: peshtoq (institutsional belgi) ------------------ */
$MOTIVLAR['about'] = function () {
  $o  = "  <path d=\"M1180 108l138 68h-276z\" opacity=\".85\"/>\n";
  // Peshtoq o'rtasidagi zamka toshi. Uchburchak emas, trapetsiya: to'la
  // uchburchak peshtoq ichida "tog'"ga o'xshab qolgan edi.
  $o .= "  <path d=\"M1168 148h24l7 28h-38z\" fill=\"URG\" opacity=\".85\" stroke=\"none\"/>\n";
  $o .= "  <rect x=\"1040\" y=\"180\" width=\"280\" height=\"16\" rx=\"3\" opacity=\".85\"/>\n";
  $o .= "  <path d=\"M1046 200h268\" opacity=\".3\" stroke-width=\"1.4\"/>\n";
  foreach ([1062, 1119, 1176, 1233, 1290] as $x) {
    $o .= "  <rect x=\"{$x}\" y=\"206\" width=\"24\" height=\"78\" rx=\"3\" opacity=\".8\"/>\n";
    $a = $x + 8; $b = $x + 16;
    $o .= "  <path d=\"M{$a} 214v62M{$b} 214v62\" opacity=\".26\" stroke-width=\"1.4\"/>\n";
  }
  // uch pog'onali poydevor — binoga vazn beradi
  foreach ([[1030, 288, 300], [1018, 298, 324], [1006, 308, 348]] as [$x, $y, $w]) {
    $o .= "  <rect x=\"{$x}\" y=\"{$y}\" width=\"{$w}\" height=\"10\" rx=\"2\" opacity=\".7\"/>\n";
  }
  return $o;
};

/* ---- Rahbariyat: tashkiliy tuzilma ---------------------------------- */
$MOTIVLAR['leadership'] = function () {
  $o  = "  <rect x=\"1136\" y=\"108\" width=\"88\" height=\"46\" rx=\"9\" fill=\"URG\" stroke=\"none\"/>\n";
  $o .= "  <circle cx=\"1180\" cy=\"131\" r=\"9\" fill=\"#071528\" opacity=\".55\" stroke=\"none\"/>\n";
  $o .= "  <path d=\"M1180 154v20M1070 174h220M1070 174v22M1290 174v22\" opacity=\".5\"/>\n";
  foreach ([1070, 1290] as $x) {
    $a = $x - 42;
    $o .= "  <rect x=\"{$a}\" y=\"196\" width=\"84\" height=\"42\" rx=\"8\" opacity=\".85\"/>\n";
    $o .= "  <circle cx=\"{$x}\" cy=\"217\" r=\"8\" fill=\"CHIZ\" opacity=\".45\" stroke=\"none\"/>\n";
  }
  // ikki o'rinbosar o'rtasidagi gorizontal aloqa (punktir — bo'ysunish emas)
  $o .= "  <path d=\"M1112 217h136\" opacity=\".22\" stroke-dasharray=\"4 6\" stroke-width=\"1.4\"/>\n";
  $o .= "  <path d=\"M1070 238v16M1290 238v16M1016 254h108M1236 254h108M1016 254v18M1124 254v18M1236 254v18M1344 254v18\" opacity=\".4\"/>\n";
  foreach ([1016, 1124, 1236, 1344] as $x) {
    $a = $x - 33;
    $o .= "  <rect x=\"{$a}\" y=\"272\" width=\"66\" height=\"34\" rx=\"7\" opacity=\".5\"/>\n";
    $o .= "  <circle cx=\"{$x}\" cy=\"289\" r=\"6\" fill=\"CHIZ\" opacity=\".3\" stroke=\"none\"/>\n";
  }
  return $o;
};

/* ---- Ekspertlar: tugunlar tarmog'i + ixtisos ustunchalari ------------ */
$MOTIVLAR['experts'] = function () {
  $cx = 1180; $cy = 208; $r = 112;
  $joy = [];
  foreach ([0, 60, 120, 180, 240, 300] as $b) {
    $rad = deg2rad($b - 90);
    $joy[] = [round($cx + $r * cos($rad), 1), round($cy + $r * sin($rad), 1)];
  }
  $o = "  <circle cx=\"{$cx}\" cy=\"{$cy}\" r=\"146\" opacity=\".09\" stroke-dasharray=\"2 10\"/>\n";
  foreach ($joy as $j) {
    $o .= "  <path d=\"M{$cx} {$cy}L{$j[0]} {$j[1]}\" opacity=\".24\" stroke-width=\"1.5\"/>\n";
    $mx = round(($cx + $j[0]) / 2, 1); $my = round(($cy + $j[1]) / 2, 1);
    $o .= "  <circle cx=\"{$mx}\" cy=\"{$my}\" r=\"2.4\" fill=\"CHIZ\" opacity=\".35\" stroke=\"none\"/>\n";
  }
  $o .= "  <circle cx=\"{$cx}\" cy=\"{$cy}\" r=\"44\" fill=\"#0b2a4e\" stroke=\"none\"/>\n";
  $o .= "  <circle cx=\"{$cx}\" cy=\"{$cy}\" r=\"44\" stroke-width=\"2.4\"/>\n";
  $o .= "  <circle cx=\"{$cx}\" cy=\"196\" r=\"11.5\" stroke=\"URG2\" stroke-width=\"2.2\"/>\n";
  $o .= "  <path d=\"M1159 230a21 21 0 0 1 42 0\" stroke=\"URG2\" stroke-width=\"2.2\"/>\n";
  foreach ($joy as $i => $j) {
    $urg = ($i === 1 || $i === 4);
    $o .= "  <circle cx=\"{$j[0]}\" cy=\"{$j[1]}\" r=\"26\" fill=\"" . ($urg ? 'URG' : '#0b2a4e') . "\" fill-opacity=\"" . ($urg ? '.9' : '1') . "\" stroke=\"CHIZ\" stroke-width=\"1.8\" opacity=\".9\"/>\n";
    $hy = $j[1] - 6;
    $o .= "  <circle cx=\"{$j[0]}\" cy=\"{$hy}\" r=\"6.5\" stroke-width=\"1.6\" opacity=\".75\"/>\n";
    $ax = $j[0] - 11.5; $ay = $j[1] + 13.5;
    $o .= "  <path d=\"M{$ax} {$ay}a11.5 11.5 0 0 1 23 0\" stroke-width=\"1.6\" opacity=\".75\"/>\n";
  }
  // tanlangan ekspert — punktir halqa + ixtisos ustunchalari
  $t = $joy[0];
  $o .= "  <circle cx=\"{$t[0]}\" cy=\"{$t[1]}\" r=\"36\" stroke=\"URG2\" stroke-width=\"1.6\" opacity=\".55\" stroke-dasharray=\"3 6\"/>\n";
  // ixtisos ustunchalari — pastki o'ng burchakda, xavfsiz maydon ichida
  // (ilgari y=84 dan boshlanardi va keng ekranda kesilib ketardi).
  foreach ([[1320, 16], [1334, 27], [1348, 38]] as [$x, $h]) {
    $y = 300 - $h;
    $o .= "  <rect x=\"{$x}\" y=\"{$y}\" width=\"8\" height=\"{$h}\" rx=\"2\" fill=\"URG2\" opacity=\".6\" stroke=\"none\"/>\n";
  }
  $o .= "  <path d=\"M1314 304h48\" opacity=\".24\" stroke-width=\"1.4\"/>\n";
  return $o;
};

/* ---- Media: ijro tugmasi, vaqt chizig'i, tovush to'lqini ------------- */
$MOTIVLAR['media'] = function () {
  $o  = "  <circle cx=\"1096\" cy=\"196\" r=\"86\" opacity=\".11\" stroke-dasharray=\"2 10\"/>\n";
  $o .= "  <circle cx=\"1096\" cy=\"196\" r=\"60\" stroke-width=\"2.6\" opacity=\".9\"/>\n";
  $o .= "  <path d=\"M1080 168l46 28-46 28z\" fill=\"URG2\" stroke=\"none\"/>\n";
  // vaqt chizig'i — ijro tugmasi ostida
  $o .= "  <path d=\"M1024 292h144\" opacity=\".26\" stroke-width=\"4\"/>\n";
  $o .= "  <path d=\"M1024 292h58\" stroke=\"URG\" stroke-width=\"4\"/>\n";
  $o .= "  <circle cx=\"1082\" cy=\"292\" r=\"7\" fill=\"URG2\" stroke=\"none\"/>\n";
  foreach ([1024, 1060, 1096, 1132, 1168] as $x) {
    $o .= "  <path d=\"M{$x} 302v7\" opacity=\".24\" stroke-width=\"1.4\"/>\n";
  }
  // tovush to'lqini
  for ($i = 0; $i < 12; $i++) {
    $h = [30, 54, 82, 42, 68, 108, 52, 88, 34, 60, 44, 26][$i];
    $x = 1210 + $i * 15;
    $y = 196 - $h / 2;
    $urg = ($i === 5);
    $o .= "  <rect x=\"{$x}\" y=\"{$y}\" width=\"6\" height=\"{$h}\" rx=\"3\" fill=\"" . ($urg ? 'URG2' : 'CHIZ') . "\" opacity=\"" . ($urg ? '.95' : '.38') . "\" stroke=\"none\"/>\n";
  }
  $o .= "  <path d=\"M1204 196h188\" opacity=\".16\" stroke-width=\"1.4\"/>\n";
  return $o;
};

/* ---- Aloqa: nishon + joy belgisi + yo'nalish ------------------------ */
$MOTIVLAR['contact'] = function () {
  $o  = "  <path d=\"M1064 206h56M1240 206h56M1180 122v34M1180 256v34\" opacity=\".3\" stroke-dasharray=\"6 6\"/>\n";
  foreach ([[104, '.16'], [72, '.24'], [40, '.34']] as [$r, $op]) {
    $o .= "  <circle cx=\"1180\" cy=\"206\" r=\"{$r}\" opacity=\"{$op}\"/>\n";
  }
  // joy belgisi
  $o .= "  <path d=\"M1180 132c-26 0-46 20-46 45 0 33 46 78 46 78s46-45 46-78c0-25-20-45-46-45z\" fill=\"URG\" stroke=\"none\"/>\n";
  $o .= "  <circle cx=\"1180\" cy=\"177\" r=\"15\" fill=\"#071528\" opacity=\".78\" stroke=\"none\"/>\n";
  $o .= "  <ellipse cx=\"1180\" cy=\"272\" rx=\"52\" ry=\"13\" opacity=\".26\"/>\n";
  // yo'nalish: chapdagi nuqtadan belgigacha punktir yoy
  $o .= "  <path d=\"M1000 288q86 26 132-46\" opacity=\".34\" stroke-dasharray=\"4 7\" stroke-width=\"1.8\"/>\n";
  $o .= "  <circle cx=\"1000\" cy=\"288\" r=\"6\" fill=\"URG2\" stroke=\"none\" opacity=\".85\"/>\n";
  // aloqa kartasi — o'ngda
  $o .= "  <rect x=\"1300\" y=\"150\" width=\"92\" height=\"112\" rx=\"8\" opacity=\".45\"/>\n";
  $o .= qatorlar(1318, 172, [56, 40, 48], 20, 5, '.3');
  $o .= "  <path d=\"M1318 240h56\" opacity=\".22\" stroke-width=\"1.4\"/>\n";
  return $o;
};

/* ---- Qidiruv: ma'lumot to'ri, lupa, natijalar ------------------------ */
$MOTIVLAR['search'] = function () {
  $o = '';
  $urg = [[2, 0], [0, 2], [3, 3]];
  for ($r = 0; $r < 4; $r++) {
    for ($c = 0; $c < 5; $c++) {
      $x = 988 + $c * 40; $y = 112 + $r * 40;
      $bor = in_array([$c, $r], $urg, true);
      $f = $bor ? "fill=\"URG\" fill-opacity=\".85\" stroke=\"none\"" : "opacity=\".28\" stroke-width=\"1.6\"";
      $o .= "  <rect x=\"{$x}\" y=\"{$y}\" width=\"28\" height=\"28\" rx=\"4\" {$f}/>\n";
    }
  }
  $o .= "  <circle cx=\"1196\" cy=\"208\" r=\"62\" fill=\"#071528\" fill-opacity=\".45\" stroke=\"CHIZ\" stroke-width=\"3.4\"/>\n";
  $o .= "  <path d=\"M1240 252l44 44\" stroke-width=\"12\" opacity=\".9\"/>\n";
  $o .= "  <path d=\"M1174 210l16 17 30-36\" stroke=\"URG2\" stroke-width=\"3.4\" opacity=\".95\"/>\n";
  // topilgan natijalar ro'yxati
  foreach ([132, 186, 240] as $i => $y) {
    $op = $i === 0 ? '.5' : '.26';
    $o .= "  <rect x=\"1300\" y=\"{$y}\" width=\"12\" height=\"12\" rx=\"3\" fill=\"" . ($i === 0 ? 'URG2' : 'CHIZ') . "\" opacity=\"{$op}\" stroke=\"none\"/>\n";
    $o .= qatorlar(1322, $y, [70 - $i * 8, 46], 16, 5, $op);
  }
  return $o;
};

/* ---- OAVlarda: manba -> to'lqin -> nashrlar -------------------------- */
$MOTIVLAR['oav'] = function () {
  $o  = "  <circle cx=\"1006\" cy=\"208\" r=\"26\" fill=\"URG\" stroke=\"none\"/>\n";
  $o .= "  <circle cx=\"1006\" cy=\"208\" r=\"9\" fill=\"#071528\" opacity=\".6\" stroke=\"none\"/>\n";
  foreach ([[62, '.5'], [92, '.32'], [122, '.19']] as [$r, $op]) {
    $rad = deg2rad(56);
    $x  = round(1006 + $r * cos($rad), 1);
    $y1 = round(208 - $r * sin($rad), 1);
    $y2 = round(208 + $r * sin($rad), 1);
    $o .= "  <path d=\"M{$x} {$y1}A{$r} {$r} 0 0 1 {$x} {$y2}\" opacity=\"{$op}\" stroke-width=\"2.4\"/>\n";
  }
  foreach ([112, 214] as $i => $y) {
    $op = $i ? '.5' : '.85';
    $o .= "  <rect x=\"1180\" y=\"{$y}\" width=\"204\" height=\"88\" rx=\"8\" opacity=\"{$op}\"/>\n";
    $ly = $y + 22;
    $o .= qatorlar(1204, $ly, [152, 118, 84], 20, 5, $i ? '.26' : '.4');
    $by = $y + 16;
    $o .= "  <rect x=\"1180\" y=\"{$by}\" width=\"4\" height=\"56\" rx=\"2\" fill=\"URG2\" opacity=\"" . ($i ? '.4' : '.9') . "\" stroke=\"none\"/>\n";
    // to'lqindan kartaga ingichka ulanish
    $cy = $y + 44;
    $o .= "  <path d=\"M1140 208L1180 {$cy}\" opacity=\".2\" stroke-dasharray=\"3 5\" stroke-width=\"1.4\"/>\n";
  }
  return $o;
};

/* ---- Yozish -------------------------------------------------------- */
$papka = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'img' . DIRECTORY_SEPARATOR . 'banners';
if (!is_dir($papka)) { mkdir($papka, 0775, true); }

foreach ($MOTIVLAR as $kalit => $fn) {
  // Motivlar rang nomlarini ramziy yozadi (CHIZ/URG/URG2) — shu yerda
  // bitta joyda haqiqiy qiymatga almashtiriladi. Palitra o'zgarsa,
  // yuqoridagi uchta o'zgaruvchi yetarli.
  $svg = ramka(strtr($fn(), ['CHIZ' => $CHIZ, 'URG2' => $URG2, 'URG' => $URG]));
  $yol = $papka . DIRECTORY_SEPARATOR . $kalit . '.svg';
  file_put_contents($yol, $svg);
  printf("  %-14s %6d bayt\n", $kalit . '.svg', strlen($svg));
}
echo "\nTayyor: img/banners/ (" . count($MOTIVLAR) . " ta)\n";
