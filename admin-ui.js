/* ============================================================
   TSTM Admin — UI engine (router + CRUD + editor)
   ============================================================ */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // src/href atributiga qo'yiladigan saqlangan qiymatlar shu yerdan o'tadi:
  // `javascript:` kabi sxemalar bloklanadi, qolgani esc() qilinadi — qiymat
  // ichidagi qo'shtirnoq atributdan chiqib onerror= qo'sha olmasin.
  const safeUrl = (u) => {
    const s = String(u == null ? '' : u).trim();
    if (!s) return '';
    const probe = s.split('').filter(ch => ch > ' ').join('').toLowerCase();
    if (/^(javascript|vbscript|file):/.test(probe)) return '';
    if (/^data:/.test(probe) && !/^data:image\//.test(probe)) return '';
    return esc(s);
  };
  const mlGet = (v) => (v && typeof v === 'object') ? (v.uz || v.ru || v.en || '') : (v || '');
  const fmtDate = (d) => { if (!d) return '—'; const [y, m, day] = d.split('-'); return day + '.' + m + '.' + y; };

  // Rasmni canvas orqali kichraytirib (JPEG) dataURL qaytaradi — data.json shishib ketmasligi uchun
  function resizeImage(file, maxDim, cb) {
    if (!file || !/^image\//.test(file.type)) { cb(''); return; }
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        const m = maxDim || 1600;
        if (w > m || h > m) { const r = Math.min(m / w, m / h); w = Math.round(w * r); h = Math.round(h * r); }
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        let out;
        try { out = cv.toDataURL('image/jpeg', 0.82); } catch { out = rd.result; }
        // PNG shaffoflik kerak bo'lsa (logo) — asl saqlanadi
        cb(out || rd.result);
      };
      img.onerror = () => cb(rd.result);
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  }

  const ICON = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    news: '<path d="M5 3h11l3 3v15H5z"/><path d="M9 8h7M9 12h7M9 16h4"/>',
    mic: '<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
    events: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
    pub: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/>',
    pages: '<path d="M3 4h13l5 5v11H3z"/><path d="M16 4v5h5"/>',
    hero: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="m6 14 3-3 3 3 3-4 3 4"/><circle cx="9" cy="9" r="1.3"/>',
    experts: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 6.5a3 3 0 0 1 0 5.5M17 20a5 5 0 0 0-3-4.6"/>',
    partners: '<path d="m11 17 2 2 8-8-3-3-2 2"/><path d="m13 11-3-3-7 7 3 3 2-2"/><path d="m8 14 2 2"/>',
    media: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m3 17 5-4 4 3 3-3 6 5"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="18" cy="9" r="2.4"/><path d="M16 20a4.5 4.5 0 0 1 5.5-4.4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 17 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/>', eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', upload: '<path d="M12 16V4m0 0 4 4m-4-4-4 4"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
    play: '<path d="M6 4l14 8-14 8z"/>',
    bold: '<path d="M6 4h7a4 4 0 0 1 0 8H6zM6 12h8a4 4 0 0 1 0 8H6z"/>', italic: '<path d="M19 4h-9M14 20H5M15 4 9 20"/>',
    ul: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', ol: '<path d="M10 6h11M10 12h11M10 18h11M4 4v4M4 8H3m1 0H3"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>', heading: '<path d="M6 4v16M18 4v16M6 12h12"/>',
    more: '<circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
    pdf: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 13h2a1.5 1.5 0 0 0 0-3H8zM8 16v-3M13 13h2M13 16v-6h2.5"/>',
    box: '<path d="M21 8 12 3 3 8l9 5 9-5ZM3 8v8l9 5 9-5V8"/>', empty: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14h8"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    underline: '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M4 21h16"/>',
    strike: '<path d="M4 12h16"/><path d="M17.5 7A4 4 0 0 0 14 5h-3a3 3 0 0 0-1 5.8"/><path d="M7 17a3.5 3.5 0 0 0 3.5 2H13a3.5 3.5 0 0 0 1.5-6.7"/>',
    quote: '<path d="M6 8H4v6h4v-4M8 8c0 3-1 4.5-3 5.5M18 8h-2v6h4v-4M20 8c0 3-1 4.5-3 5.5"/>',
    alignLeft: '<path d="M4 6h16M4 12h10M4 18h13"/>', alignCenter: '<path d="M4 6h16M7 12h10M6 18h12"/>', alignRight: '<path d="M4 6h16M10 12h10M7 18h13"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10H9"/>', redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h6"/>',
    clearFormat: '<path d="M6 5h11M9 5l-3 14M13 12l6 6M19 12l-6 6"/>',
    views: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    draft: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    audit: '<path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    bug: '<path d="M12 20a6 6 0 0 0 6-6v-3a6 6 0 0 0-12 0v3a6 6 0 0 0 6 6Z"/><path d="M9 7a3 3 0 0 1 6 0"/><path d="M3 13h3M18 13h3M4.5 7.5 7 9M19.5 7.5 17 9M4.5 18.5 7 17M19.5 18.5 17 17"/>'
  };
  const ic = (n, sw) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw || 1.7}" stroke-linecap="round" stroke-linejoin="round">${ICON[n] || ''}</svg>`;

  const STLABEL = { published: 'Nashr etilgan', draft: 'Qoralama', active: 'Faol', inactive: 'Nofaol', unsubscribed: 'Bekor qilgan' };

  /* -------------------- Collection configs -------------------- */
  const C = {
    news: {
      label: 'Yangiliklar', singular: 'yangilik', icon: 'news', status: true, search: 'title',
      columns: [{ k: 'title', label: 'Sarlavha', ml: 1, thumb: 'cover' }, { k: 'category', label: 'Kategoriya' }, { k: 'date', label: 'Sana', type: 'date' }, { k: 'status', label: 'Holat', type: 'status' }],
      fields: [
        { k: 'title', label: 'Sarlavha', type: 'text', ml: 1, req: 1 },
        { k: 'excerpt', label: 'Qisqa anons', type: 'textarea', ml: 1 },
        { k: 'body', label: 'Maqola matni', type: 'rich', ml: 1 },
        { k: 'category', label: 'Mavzu (kategoriya)', type: 'select', side: 1, opts: ['Diplomatiya', 'Tahlil', 'Tadbir', 'Hamkorlik', 'Nashr', 'Iqtisodiyot', 'Xavfsizlik', 'Energetika'] },
        { k: 'region', label: 'Hudud', type: 'select', side: 1, opts: ['', 'Markaziy Osiyo', 'Janubiy Osiyo', 'Yevropa', 'Yaqin Sharq', 'Global'] },
        { k: 'author', label: 'Muallif (ekspert)', type: 'text', side: 1 },
        { k: 'date', label: 'Sana', type: 'date', side: 1 },
        { k: 'cover', label: 'Muqova rasmi', type: 'image', side: 1 },
        { k: 'status', label: 'Holat', type: 'status', side: 1 }
      ]
    },
    // "Bizning ekspertlar OAVlarda" — sayt tomonida oav.html / sharh.html.
    // Yangilikka o'xshaydi, farqi: ekspert / OAV nomi / asl manba havolasi.
    mediaPosts: {
      label: 'Ekspertlar OAVda', singular: 'sharh', icon: 'mic', status: true, search: 'title',
      columns: [{ k: 'title', label: 'Sarlavha', ml: 1, thumb: 'cover' }, { k: 'expert', label: 'Ekspert' }, { k: 'outlet', label: 'OAV' }, { k: 'date', label: 'Sana', type: 'date' }, { k: 'status', label: 'Holat', type: 'status' }],
      fields: [
        { k: 'title', label: 'Sarlavha', type: 'text', ml: 1, req: 1 },
        { k: 'excerpt', label: 'Qisqa anons', type: 'textarea', ml: 1 },
        { k: 'body', label: 'Sharh matni', type: 'rich', ml: 1 },
        { k: 'expert', label: 'Ekspert', type: 'text', side: 1, ph: 'F.I.Sh.' },
        { k: 'outlet', label: 'OAV nomi', type: 'text', side: 1, ph: 'Gazeta.uz' },
        { k: 'source', label: 'Asl havola (URL)', type: 'text', side: 1, ph: 'https://...' },
        { k: 'category', label: 'Mavzu', type: 'select', side: 1, opts: ['', 'Tashqi siyosat', 'Iqtisodiyot', 'Xavfsizlik', 'Markaziy Osiyo', 'Diplomatiya', 'Energetika'] },
        { k: 'date', label: 'Sana', type: 'date', side: 1 },
        { k: 'cover', label: 'Muqova rasmi', type: 'image', side: 1 },
        { k: 'status', label: 'Holat', type: 'status', side: 1 }
      ]
    },
    events: {
      label: 'Tadbirlar', singular: 'tadbir', icon: 'events', status: true, search: 'title',
      columns: [{ k: 'title', label: 'Tadbir', ml: 1 }, { k: 'date', label: 'Sana', type: 'date' }, { k: 'time', label: 'Vaqt' }, { k: 'type', label: 'Turi' }, { k: 'status', label: 'Holat', type: 'status' }],
      fields: [
        { k: 'title', label: 'Tadbir nomi', type: 'text', ml: 1, req: 1 },
        { k: 'body', label: 'Tavsif', type: 'rich', ml: 1 },
        { k: 'date', label: 'Sana', type: 'date', side: 1 },
        { k: 'time', label: 'Boshlanish vaqti', type: 'text', side: 1, ph: '10:00' },
        { k: 'location', label: 'Manzil', type: 'text', ml: 1, side: 1 },
        { k: 'type', label: 'Turi', type: 'select', side: 1, opts: ['Konferensiya', 'Davra suhbati', "Ta'lim dasturi", 'Brifing', 'Taqdimot', 'Forum'] },
        { k: 'status', label: 'Holat', type: 'status', side: 1 }
      ]
    },
    publications: {
      label: 'Nashrlar', singular: 'nashr', icon: 'pub', status: true, search: 'title',
      columns: [{ k: 'title', label: 'Nashr', ml: 1, thumb: 'cover' }, { k: 'type', label: 'Turi' }, { k: 'year', label: 'Yil' }, { k: 'status', label: 'Holat', type: 'status' }],
      fields: [
        { k: 'title', label: 'To\'liq sarlavha', type: 'text', ml: 1, req: 1 },
        { k: 'shortTitle', label: 'Qisqa sarlavha (ixtiyoriy)', type: 'text', ml: 1, ph: 'Banner va ro\'yxatda ko\'rinadi — bo\'sh qolsa to\'liq sarlavha ishlatiladi' },
        { k: 'desc', label: 'Tavsif / annotatsiya', type: 'rich', ml: 1 },
        { k: 'type', label: 'Turi', type: 'select', side: 1, opts: ['Hisobot', 'Tahliliy sharh', 'Monografiya', 'Maqola', "Statistik to'plam"] },
        { k: 'category', label: 'Mavzu (yo\'nalish)', type: 'select', side: 1, opts: ['Tashqi siyosat', 'Iqtisodiyot', 'Xavfsizlik', 'Markaziy Osiyo', 'Diplomatiya', 'Energetika'] },
        { k: 'region', label: 'Hudud', type: 'select', side: 1, opts: ['', 'Markaziy Osiyo', 'Janubiy Osiyo', 'Yevropa', 'Yaqin Sharq', 'Global'] },
        { k: 'author', label: 'Muallif (ekspert)', type: 'text', side: 1 },
        { k: 'year', label: 'Yil', type: 'text', side: 1, ph: '2026' },
        { k: 'cover', label: 'Muqova', type: 'image', side: 1 },
        { k: 'pdf', label: 'Fayl (PDF yoki Word)', type: 'file', side: 1 },
        { k: 'status', label: 'Holat', type: 'status', side: 1 }
      ]
    },
    pages: {
      label: 'Sahifalar', singular: 'sahifa', icon: 'pages', status: true, search: 'title',
      columns: [{ k: 'title', label: 'Sahifa', ml: 1 }, { k: 'slug', label: 'Manzil (slug)' }, { k: 'status', label: 'Holat', type: 'status' }],
      fields: [
        { k: 'title', label: 'Sahifa nomi', type: 'text', ml: 1, req: 1 },
        { k: 'body', label: 'Matn', type: 'rich', ml: 1 },
        { k: 'slug', label: 'Manzil (slug)', type: 'text', side: 1, ph: 'markaz-haqida' },
        { k: 'status', label: 'Holat', type: 'status', side: 1 }
      ]
    },
    heroSlides: {
      label: 'Hero slayder', singular: 'slayd', icon: 'hero', status: true, sort: 'order',
      columns: [{ k: 'order', label: '#' }, { k: 'headline', label: 'Sarlavha', ml: 1, thumb: 'image' }, { k: 'category', label: 'Yorliq', ml: 1 }, { k: 'status', label: 'Holat', type: 'status' }],
      fields: [
        { k: 'headline', label: 'Sarlavha', type: 'text', ml: 1, req: 1 },
        { k: 'category', label: 'Yorliq (kategoriya)', type: 'text', ml: 1 },
        { k: 'image', label: 'Slayd rasmi', type: 'image', side: 1 },
        { k: 'link', label: 'Havola (URL)', type: 'text', side: 1, ph: '#' },
        { k: 'order', label: 'Tartib raqami', type: 'number', side: 1 },
        { k: 'status', label: 'Holat', type: 'status', side: 1 }
      ]
    },
    experts: {
      label: 'Ekspertlar', singular: 'ekspert', icon: 'experts', sort: 'order',
      columns: [{ k: 'name', label: 'Ism', ml: 1, thumb: 'photo' }, { k: 'role', label: 'Lavozim', ml: 1 }, { k: 'expertise', label: 'Ekspertiza', ml: 1 }],
      fields: [
        { k: 'name', label: 'Ism familiya', type: 'text', ml: 1, req: 1 },
        { k: 'role', label: 'Lavozim', type: 'text', ml: 1 },
        { k: 'sub', label: 'Ilmiy daraja / mutaxassislik', type: 'text', ml: 1 },
        { k: 'expertise', label: 'Ekspertiza yo\'nalishlari', type: 'text', ml: 1, ph: 'Tashqi siyosat, Xavfsizlik, Markaziy Osiyo' },
        { k: 'bio', label: 'Qisqacha biografiya', type: 'rich', ml: 1 },
        { k: 'photo', label: 'Portret', type: 'image', side: 1 },
        { k: 'phone', label: 'Telefon', type: 'text', side: 1, ph: '+998 71 000 00 00' },
        { k: 'email', label: 'E-pochta', type: 'text', side: 1, ph: 'ism@markaz.uz' },
        { k: 'url', label: 'Veb-sayt / havola', type: 'text', side: 1, ph: 'https://' },
        { k: 'hours', label: 'Qabul vaqti', type: 'text', side: 1, ph: 'Dushanba 10:00–12:00' },
        { k: 'order', label: 'Tartib', type: 'number', side: 1 }
      ]
    },
    partners: {
      label: 'Hamkorlar', singular: 'hamkor', icon: 'partners',
      columns: [{ k: 'name', label: 'Tashkilot', thumb: 'logo' }, { k: 'url', label: 'Veb-sayt' }],
      fields: [
        { k: 'name', label: 'Tashkilot nomi', type: 'text', req: 1 },
        { k: 'logo', label: 'Logotip', type: 'image', side: 1 },
        { k: 'url', label: 'Veb-sayt (URL)', type: 'text', side: 1, ph: 'https://' }
      ]
    },
    subscribers: {
      label: 'Obunachilar', singular: 'obunachi', icon: 'mail', status: true,
      statusOpts: ['active', 'unsubscribed'], search: 'email',
      columns: [{ k: 'email', label: 'E-pochta' }, { k: 'date', label: 'Obuna sanasi' }, { k: 'lang', label: 'Til' }, { k: 'status', label: 'Holat', type: 'status' }],
      fields: [
        { k: 'email', label: 'E-pochta', type: 'text', req: 1, ph: 'ism@misol.uz' },
        { k: 'lang', label: 'Sayt tili', type: 'select', side: 1, opts: ['', 'uz', 'ru', 'en'] },
        { k: 'status', label: 'Holat', type: 'status', side: 1, statusOpts: ['active', 'unsubscribed'] },
        { k: 'date', label: 'Obuna sanasi', type: 'date', side: 1 }
      ]
    },
    users: {
      label: 'Foydalanuvchilar', singular: 'foydalanuvchi', icon: 'users', status: true, statusOpts: ['active', 'inactive'], search: 'name',
      columns: [{ k: 'name', label: 'Ism' }, { k: 'login', label: 'Login' }, { k: 'role', label: 'Rol' }, { k: 'status', label: 'Holat', type: 'status' }],
      fields: [
        { k: 'name', label: 'To\'liq ism', type: 'text', req: 1 },
        { k: 'login', label: 'Login', type: 'text', req: 1 },
        { k: 'email', label: 'E-pochta', type: 'text' },
        { k: 'role', label: 'Rol', type: 'select', side: 1, opts: ['Administrator', 'Muharrir', 'Moderator'] },
        { k: 'status', label: 'Holat', type: 'status', side: 1, statusOpts: ['active', 'inactive'] }
      ]
    }
  };

  const NAV = [
    { group: 'Asosiy', items: [{ key: 'dashboard', label: 'Boshqaruv paneli', icon: 'dashboard', view: 'dashboard' }] },
    { group: 'Kontent', items: ['news', 'mediaPosts', 'events', 'publications', 'pages'] },
    { group: 'Sayt elementlari', items: ['heroSlides', 'experts', 'partners', { key: 'media', label: 'Media kutubxona', icon: 'media', view: 'media' }, { key: 'aboutPage', label: 'Markaz haqida', icon: 'pages', view: 'aboutPage' }] },
    { group: 'Tizim', items: [{ key: 'messages', label: 'Murojaatlar', icon: 'mail', view: 'messages' }, 'subscribers', 'users', { key: 'audit', label: 'Audit loglar', icon: 'audit', view: 'audit' }, { key: 'errors', label: 'Xatoliklar', icon: 'bug', view: 'errors' }, { key: 'push', label: 'Bildirishnoma', icon: 'bell', view: 'push' }, { key: 'settings', label: 'Sozlamalar', icon: 'settings', view: 'settings' }] }
  ];

  /* -------------------- State / boot -------------------- */
  let state = { view: 'dashboard', coll: null, q: '', statusFilter: '' };
  let gsr = null, gsrActive = -1; // global qidiruv dropdown

  function logoSrc() {
    const s = Store.settings();
    const lg = (s.logos && (s.logos.uz || s.logos.ru || s.logos.en)) || s.logo;
    if (lg) return lg;
    return (document.documentElement.getAttribute('data-theme') === 'dark') ? 'logo-mark-white.png' : 'logo-mark.png';
  }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    $('#themeIcon').innerHTML = t === 'dark' ? ICON.sun : ICON.moon;
    $('#themeLabel').textContent = t === 'dark' ? 'Yorug\' rejim' : 'Quyuq rejim';
    $('#sbLogo').src = logoSrc(); $('#loginLogo').src = (t === 'dark' ? 'logo-tstm-white.png' : 'logo-tstm.png');
    if (Store.settings().logo) { $('#sbLogo').src = Store.settings().logo; }
  }

  function boot() {
    applyTheme(Store.settings().theme || 'light');
    // Faqat login qilingan holatda ko'rsatamiz — login qilinmasdan oldingi fonda ishlaydigan
    // avtomatik sxema-tuzatish urinishi endi serverda bloklanadi (xavfsizlik), bu normal holat,
    // xato sifatida ko'rsatilmasligi kerak.
    window.addEventListener('tstm-save-failed', () => { if (Store.isAuthed()) toast('Saqlashda xato — fayl juda katta bo\'lishi mumkin. Kichikroq rasm yuklang.', 1); });
    // login
    $('#loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const u = $('#lu').value, p = $('#lp').value;
      const btn = $('#loginForm button[type=submit]');
      if (btn) btn.disabled = true;
      Promise.resolve(Store.checkLogin(u, p)).then((ok) => {
        if (ok) { Store.login(); showApp(); }
        else { $('#loginErr').classList.add('show'); }
      }).finally(() => { if (btn) btn.disabled = false; });
    });
    $('#themeToggle').addEventListener('click', () => {
      const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      Store.setSettings({ theme: t }); applyTheme(t);
    });
    $('#burger').addEventListener('click', () => {
      if (window.matchMedia('(max-width:820px)').matches) {
        $('#sidebar').classList.toggle('open');
      } else {
        document.body.classList.toggle('sb-collapsed');
      }
    });
    $('#userChip').addEventListener('click', userMenu);
    // Global qidiruv — barcha bo'limlar bo'yicha (dropdown), istalgan sahifadan
    const gsBox = document.querySelector('.search');
    gsr = document.createElement('div'); gsr.className = 'gsr'; gsBox.appendChild(gsr);
    const gsInput = $('#globalSearch');
    gsInput.addEventListener('input', (e) => {
      state.q = e.target.value;
      if (C[state.coll]) render();        // joriy ro'yxatni ham jonli filtrlaydi
      renderGSR(e.target.value);           // global natijalar dropdown
    });
    gsInput.addEventListener('keydown', gsrKeydown);
    gsInput.addEventListener('focus', (e) => { if (e.target.value.trim()) renderGSR(e.target.value); });
    document.addEventListener('click', (e) => { if (!gsBox.contains(e.target)) hideGSR(); });
    // Bildirishnomalar (bell)
    const nb = $('#notifBtn');
    if (nb) {
      nb.addEventListener('click', (e) => { e.stopPropagation(); toggleNotifPanel(); });
      nb.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleNotifPanel(); } });
      document.addEventListener('click', (e) => { if (!nb.contains(e.target)) toggleNotifPanel(false); });
    }
    window.addEventListener('hashchange', route);

    // Navigatsiya tugmalari (`data-go="#/..."`). Ilgari bular inline
    // `onclick="location.hash='...'"` edi — inline handler CSP tomonidan
    // bloklanadi ('unsafe-inline' siz), shuning uchun delegatsiyaga o'tkazildi.
    // Delegatsiya document darajasida: tugmalar har render'da qayta yaratiladi,
    // ya'ni ularga alohida listener bog'lab bo'lmaydi.
    document.addEventListener('click', (e) => {
      const g = e.target.closest('[data-go]');
      if (g) location.hash = g.getAttribute('data-go');
    });

    // Panelni SERVER tasdiqlagandan keyingina ko'rsatamiz. sessionStorage
    // bayrog'ini brauzer konsolidan qo'lda yozib qo'yish mumkin — u yolg'iz
    // o'zi yetarli asos emas. Qarang: admin-store.js -> verifySession().
    Store.verifySession().then(function (ok) {
      if (ok) showApp(); else $('#login').classList.add('show');
    });
  }

  function showApp() {
    $('#login').classList.remove('show');
    $('#app').classList.add('show');
    const name = Store.raw().auth.username;
    $('#userChip .un').textContent = 'Administrator';
    $('#userChip .ur').textContent = name;
    $('#userChip .avatar').textContent = 'A';
    renderSidebar();
    if (!location.hash) { try { history.replaceState(null, '', '#/dashboard'); } catch {} }
    route();
    // Kirganda majburiy bildirishnomalar
    const nlist = updateNotifBadge();
    const ndot = nlist.filter(x => x.dot).length;
    if (ndot > 0) setTimeout(() => toast('🔔 Sizda ' + ndot + ' ta yangi bildirishnoma bor'), 700);
  }

  /* -------------------- Sidebar -------------------- */
  function renderSidebar() {
    const counts = {}; Object.keys(C).forEach(k => counts[k] = Store.all(k).length);
    let h = '';
    NAV.forEach(g => {
      h += `<div class="sb-group">${g.group}</div>`;
      g.items.forEach(it => {
        const o = typeof it === 'string' ? { key: it, label: C[it].label, icon: C[it].icon, view: 'list', coll: it } : it;
        let ct = o.coll ? `<span class="ct">${counts[o.coll]}</span>` : '';
        if (o.key === 'messages') {
          const unread = Store.all('messages').filter(m => !m.read).length;
          ct = unread ? `<span class="ct a-accent-chip">${unread}</span>` : '';
        }
        h += `<div class="sb-item" data-key="${o.key}" data-view="${o.view}" ${o.coll ? `data-coll="${o.coll}"` : ''}>${ic(o.icon)}<span>${o.label}</span>${ct}</div>`;
      });
    });
    $('#sbNav').innerHTML = h;
    $$('#sbNav .sb-item').forEach(el => el.addEventListener('click', () => {
      const coll = el.dataset.coll;
      location.hash = coll ? `#/${coll}` : `#/${el.dataset.key}`;
      $('#sidebar').classList.remove('open');
    }));
    updateNotifBadge();
  }
  function setActive(key) {
    $$('#sbNav .sb-item').forEach(el => el.classList.toggle('active', el.dataset.key === key));
  }

  /* -------------------- Global qidiruv (barcha bo'limlar) -------------------- */
  function hlEsc(text, q) {
    const raw = String(text || ''); if (!q) return esc(raw);
    const low = raw.toLowerCase(), ql = String(q).toLowerCase();
    let out = '', last = 0, idx;
    while ((idx = low.indexOf(ql, last)) !== -1) { out += esc(raw.slice(last, idx)) + '<mark>' + esc(raw.slice(idx, idx + ql.length)) + '</mark>'; last = idx + ql.length; }
    return out + esc(raw.slice(last));
  }
  function adminSearch(q) {
    q = String(q || '').trim().toLowerCase(); if (!q) return [];
    const out = [];
    Object.keys(C).forEach(coll => {
      const tk = C[coll].columns[0].k;
      Store.all(coll).forEach(it => {
        const title = mlGet(it[tk]) || '';
        const extra = [it.category, it.type, it.year, it.slug, it.login, it.email, it.author, mlGet(it.role), mlGet(it.sub)].filter(Boolean).join(' ');
        if ((title + ' ' + extra).toLowerCase().indexOf(q) > -1) out.push({ coll, id: it.id, title: title || '(nomsiz)' });
      });
    });
    return out.slice(0, 40);
  }
  function renderGSR(q) {
    if (!gsr) return;
    if (!String(q || '').trim()) { hideGSR(); return; }
    const results = adminSearch(q); gsrActive = -1;
    if (!results.length) { gsr.innerHTML = '<div class="gsr-empty">“' + esc(q) + '” bo‘yicha natija topilmadi</div>'; gsr.classList.add('show'); return; }
    const groups = {}; results.forEach(r => { (groups[r.coll] = groups[r.coll] || []).push(r); });
    let html = '';
    Object.keys(groups).forEach(coll => {
      html += '<div class="gsr-group">' + esc(C[coll].label) + '</div>';
      groups[coll].forEach(r => {
        html += '<div class="gsr-item" data-coll="' + coll + '" data-id="' + esc(r.id) + '"><span class="gi">' + ic(C[coll].icon) + '</span>'
          + '<div class="gtx"><div class="gt">' + hlEsc(r.title, q) + '</div><div class="gm">' + esc(C[coll].singular) + '</div></div></div>';
      });
    });
    gsr.innerHTML = html; gsr.classList.add('show');
    $$('.gsr-item', gsr).forEach(el => el.onclick = () => gotoEdit(el.dataset.coll, el.dataset.id));
  }
  function hideGSR() { if (gsr) { gsr.classList.remove('show'); gsr.innerHTML = ''; } gsrActive = -1; }
  function gotoEdit(coll, id) { hideGSR(); const gi = $('#globalSearch'); if (gi) gi.value = ''; state.q = ''; location.hash = '#/' + coll + '/edit/' + id; }
  function gsrKeydown(e) {
    if (e.key === 'Escape') { hideGSR(); return; }
    const items = gsr ? $$('.gsr-item', gsr) : [];
    if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length) { gsrActive = (gsrActive + 1) % items.length; setGsrActive(items); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length) { gsrActive = (gsrActive - 1 + items.length) % items.length; setGsrActive(items); } }
    else if (e.key === 'Enter') { const el = items[gsrActive] || items[0]; if (el) { e.preventDefault(); gotoEdit(el.dataset.coll, el.dataset.id); } }
  }
  function setGsrActive(items) { items.forEach((el, i) => el.classList.toggle('active', i === gsrActive)); if (items[gsrActive]) items[gsrActive].scrollIntoView({ block: 'nearest' }); }

  /* -------------------- Bildirishnomalar (notifications) -------------------- */
  function buildNotifications() {
    const list = [];
    const today = new Date().toISOString().slice(0, 10);
    const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    // yangi (o'qilmagan) murojaatlar
    Store.all('messages').filter(m => !m.read).slice(0, 8).forEach(m => {
      list.push({ icon: 'mail', dot: true, title: 'Yangi murojaat', sub: (m.name || '—') + (m.subject ? ' · ' + m.subject : ''), href: '#/messages' });
    });
    // yaqin 7 kundagi tadbirlar
    Store.all('events').filter(e => e.date && e.date >= today && e.date <= in7).forEach(e => {
      list.push({ icon: 'events', dot: true, title: 'Yaqin tadbir', sub: (mlGet(e.title) || '(nomsiz)') + ' · ' + fmtDate(e.date), href: '#/events/edit/' + e.id });
    });
    // e'lon qilinmagan qoralamalar (eslatma)
    [['news', Store.all('news')], ['mediaPosts', Store.all('mediaPosts')], ['publications', Store.all('publications')], ['pages', Store.all('pages')], ['events', Store.all('events')]].forEach(([coll, arr]) => {
      arr.filter(x => x.status === 'draft').slice(0, 4).forEach(x => {
        list.push({ icon: 'draft', title: 'Qoralama', sub: (mlGet(x[C[coll].columns[0].k]) || '(nomsiz)') + ' — ' + C[coll].singular, href: '#/' + coll + '/edit/' + x.id });
      });
    });
    return list;
  }
  function updateNotifBadge() {
    const list = buildNotifications();
    const cnt = list.filter(x => x.dot).length;
    const b = $('#notifBadge');
    if (b) { if (cnt > 0) { b.textContent = cnt > 99 ? '99+' : cnt; b.hidden = false; } else { b.hidden = true; } }
    return list;
  }
  function renderNotifPanel() {
    const p = $('#notifPanel'); if (!p) return;
    const list = buildNotifications();
    const body = list.length
      ? list.map(i => `<a class="notif-item${i.dot ? ' dot' : ''}" href="${i.href}"><span class="ni">${ic(i.icon)}</span><div class="a-minw0"><div class="nt">${esc(i.title)}</div><div class="ns">${esc(i.sub)}</div></div></a>`).join('')
      : '<div class="notif-empty">Yangi bildirishnoma yo\'q ✅</div>';
    p.innerHTML = `<div class="nph"><b>Bildirishnomalar</b><span class="t-sub mono">${list.length}</span></div>${body}`;
    $$('.notif-item', p).forEach(a => a.addEventListener('click', () => p.classList.remove('show')));
  }
  function toggleNotifPanel(force) {
    const p = $('#notifPanel'); if (!p) return;
    const show = force !== undefined ? force : !p.classList.contains('show');
    if (show) { renderNotifPanel(); p.classList.add('show'); } else p.classList.remove('show');
  }

  /* -------------------- Router -------------------- */
  function route() {
    const parts = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/');
    const v = parts[0];
    state.q = ''; $('#globalSearch').value = ''; hideGSR();
    if (C[v]) {
      state.view = parts[1] === 'new' ? 'new' : parts[1] === 'edit' ? 'edit' : 'list';
      state.coll = v; state.editId = parts[2] || null; state.statusFilter = '';
      setActive(v);
    } else {
      state.view = v; state.coll = null; setActive(v);
    }
    render();
    document.querySelector('.content').scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function render() {
    const c = $('#content');
    if (state.view === 'dashboard') return viewDashboard(c);
    if (state.view === 'media') return viewMedia(c);
    if (state.view === 'messages') return viewMessages(c);
    if (state.view === 'audit') return viewAudit(c);
    if (state.view === 'errors') return viewErrors(c);
    if (state.view === 'push') return viewPush(c);
    if (state.view === 'aboutPage') return viewAboutPage(c);
    if (state.view === 'settings') return viewSettings(c);
    if (state.coll) {
      if (state.view === 'list') return viewList(c);
      return viewForm(c);
    }
    c.innerHTML = '';
  }

  function setTitle(t) { try { document.title = 'TSTM — ' + t; } catch {} const el = $('#pageTitle'); if (el) el.textContent = t; }

  /* ==================== DASHBOARD (statistika paneli) ==================== */
  function fetchViews(cb) {
    try {
      const x = new XMLHttpRequest();
      x.open('GET', 'api.php?action=views', true);
      x.onreadystatechange = function () { if (x.readyState === 4) { try { cb(JSON.parse(x.responseText || '{}') || {}); } catch { cb({}); } } };
      x.send(null);
    } catch { cb({}); }
  }
  function viewDashboard(c) {
    setTitle('Boshqaruv paneli');
    const n = Store.all('news'), ev = Store.all('events'), ex = Store.all('experts'), pb = Store.all('publications'),
      pg = Store.all('pages'), pt = Store.all('partners'), msgs = Store.all('messages'), mp = Store.all('mediaPosts');
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = ev.filter(e => e.date >= today);
    const unread = msgs.filter(m => !m.read).length;
    const cards = [
      { ic: 'news', v: n.length, l: 'Yangiliklar', tr: n.filter(x => x.status === 'published').length + ' ta nashr etilgan' },
      { ic: 'mic', v: mp.length, l: 'Ekspertlar OAVda', tr: mp.filter(x => x.status === 'published').length + ' ta nashr etilgan', href: '#/mediaPosts' },
      { ic: 'events', v: upcoming.length, l: 'Kelgusi tadbirlar', tr: ev.length + ' ta jami' },
      { ic: 'pub', v: pb.length, l: 'Nashrlar', tr: pb.filter(x => x.status === 'published').length + ' ta ochiq' },
      { ic: 'experts', v: ex.length, l: 'Ekspertlar', tr: pt.length + ' ta hamkor' },
      { ic: 'mail', v: msgs.length, l: 'Murojaatlar', tr: unread ? unread + ' ta yangi xabar' : 'Yangi xabar yo\'q', accent: unread > 0, href: '#/messages' },
      { ic: 'views', v: '<span id="statViewsV">…</span>', l: 'Jami ko\'rishlar', tr: 'Saytdagi barcha sahifalar' }
    ];
    // chart — news by category
    const cats = {}; n.forEach(x => cats[x.category] = (cats[x.category] || 0) + 1);
    const centries = Object.entries(cats).sort((a, b) => b[1] - a[1]); const max = Math.max(1, ...centries.map(e => e[1]));
    let chart = centries.map(([k, v]) => `<div class="bar"><div class="fill" data-h="${(v / max) * 100}" title="${v}"></div><div class="lb">${esc(k)}</div></div>`).join('');
    if (!chart) chart = '<div class="empty">Ma\'lumot yo\'q</div>';
    const recent = n.slice(0, 5);
    const recentMsgs = msgs.slice(0, 5);

    // id -> {coll,title} indeks (eng ko'p ko'rilganlarni aniqlash uchun)
    const idx = {};
    [['news', n], ['mediaPosts', mp], ['publications', pb], ['events', ev], ['experts', ex], ['pages', pg]].forEach(([coll, arr]) =>
      arr.forEach(it => { idx[it.id] = { coll, title: mlGet(it[C[coll].columns[0].k]) || '(nomsiz)' }; }));

    c.innerHTML = `
      <div class="page-head"><div><div class="h">Xush kelibsiz 👋</div><div class="d">TSTM sayti kontentini shu yerdan boshqaring</div></div><div class="sp"></div>
        <button class="btn primary" data-go="#/news/new">${ic('plus')} Yangi yangilik</button></div>
      <div class="stat-grid">${cards.map(s => {
        const inner = `<div class="ico">${ic(s.ic)}</div><div class="v">${s.v}</div><div class="l">${s.l}</div><div class="tr">${s.tr}</div>`;
        return s.href ? `<a class="stat-card${s.accent ? ' accent' : ''} a-nodec" href="${s.href}">${inner}</a>`
          : `<div class="stat-card">${inner}</div>`;
      }).join('')}</div>
      <div class="two-col">
        <div class="card a-p22">
          <div class="a-fac-mb6"><b class="a-serif17">Yangiliklar — kategoriya bo'yicha</b></div>
          <div class="chart">${chart}</div>
        </div>
        <div class="card a-p6">
          <div class="a-cardhead"><b class="a-serif17">So'nggi yangiliklar</b><a class="btn ghost sm" href="#/news">Barchasi</a></div>
          ${recent.map(r => `<a href="#/news/edit/${r.id}" class="a-listrow">
            <div class="a-flex1"><div class="t-title a-t135-ellip">${esc(mlGet(r.title))}</div>
            <div class="t-sub">${esc(r.category)} · ${fmtDate(r.date)}</div></div>
            <span class="badge ${r.status}">${STLABEL[r.status]}</span></a>`).join('') || '<div class="empty">Yangilik yo\'q</div>'}
        </div>
      </div>
      <div class="two-col a-mt20">
        <div class="card a-p6">
          <div class="a-cardhead"><b class="a-serif17">Eng ko'p ko'rilgan</b><span class="t-sub a-mono">${ic('views')}</span></div>
          <div id="topViewed"><div class="empty a-p20">Yuklanmoqda…</div></div>
        </div>
        <div class="card a-p6">
          <div class="a-cardhead"><b class="a-serif17">So'nggi murojaatlar</b><a class="btn ghost sm" href="#/messages">Barchasi</a></div>
          ${recentMsgs.map(m => `<a href="#/messages" class="a-listrow">
            ${m.read ? '' : '<span class="a-dot"></span>'}
            <div class="a-flex1"><div class="t-title a-t135-ellip">${esc(m.name || '—')}${m.subject ? ' · ' + esc(m.subject) : ''}</div>
            <div class="t-sub a-ellip">${esc((m.text || '').slice(0, 60))}</div></div>
            <span class="t-sub mono a-flexnone">${fmtDate(m.date)}</span></a>`).join('') || '<div class="empty a-p20">Murojaat yo\'q</div>'}
        </div>
      </div>
      <div class="card a-mt20-p22">
        <b class="a-serif17-mb14">Tezkor amallar</b>
        <div class="a-flexwrap10">
          <button class="btn" data-go="#/events/new">${ic('events')} Tadbir qo'shish</button>
          <button class="btn" data-go="#/publications/new">${ic('pub')} Nashr yuklash</button>
          <button class="btn" data-go="#/heroSlides">${ic('hero')} Hero slayder</button>
          <button class="btn" data-go="#/experts/new">${ic('experts')} Ekspert qo'shish</button>
          <button class="btn" data-go="#/settings">${ic('settings')} Sozlamalar</button>
        </div>
      </div>`;

    // chart ustunlari balandligi (dinamik) — inline style o'rniga .style (CSP).
    c.querySelectorAll('.chart .fill').forEach(el => { el.style.height = el.dataset.h + '%'; });

    // ko'rishlar (async) — jami son + eng ko'p ko'rilganlar
    fetchViews(v => {
      let total = 0; Object.keys(v).forEach(k => total += (+v[k] || 0));
      const tv = document.getElementById('statViewsV'); if (tv) tv.textContent = total.toLocaleString('ru-RU');
      const rows = Object.keys(v).map(k => ({ id: k.split(':')[1] || '', cnt: +v[k] || 0 }))
        .filter(r => idx[r.id]).sort((a, b) => b.cnt - a.cnt).slice(0, 6);
      const box = document.getElementById('topViewed'); if (!box) return;
      box.innerHTML = rows.length ? rows.map(r => {
        const it = idx[r.id];
        return `<a href="#/${it.coll}/edit/${r.id}" class="a-listrow">
          <div class="a-flex1"><div class="t-title a-t135-ellip">${esc(it.title)}</div>
          <div class="t-sub">${esc(C[it.coll].singular)}</div></div>
          <span class="badge published a-chip-soft">${ic('views')} ${r.cnt}</span></a>`;
      }).join('') : '<div class="empty a-p20">Hali ko\'rishlar yo\'q</div>';
    });
  }

  /* ==================== LIST ==================== */
  function viewList(c) {
    const cfg = C[state.coll]; setTitle(cfg.label);
    let items = Store.all(state.coll);
    if (cfg.sort) items.sort((a, b) => (a[cfg.sort] || 0) - (b[cfg.sort] || 0));
    if (cfg.status && state.statusFilter) items = items.filter(x => x.status === state.statusFilter);
    if (state.q && cfg.search) {
      const q = state.q.toLowerCase();
      items = items.filter(x => { const f = x[cfg.search]; return mlGet(f).toLowerCase().includes(q) || String(x.login || '').toLowerCase().includes(q); });
    }
    const sopts = cfg.statusOpts || ['published', 'draft'];
    const filters = cfg.status ? `<div class="filterbar">
        <button class="chip ${state.statusFilter === '' ? 'on' : ''}" data-f="">Hammasi</button>
        ${sopts.map(s => `<button class="chip ${state.statusFilter === s ? 'on' : ''}" data-f="${s}">${STLABEL[s]}</button>`).join('')}
      </div>` : '';

    const head = cfg.columns.map(col => `<th${col.type === 'status' ? ' class="a-w140"' : ''}>${col.label}</th>`).join('') + '<th class="a-w96r">Amal</th>';
    const rows = items.map(x => {
      const tds = cfg.columns.map(col => {
        let val = x[col.k];
        if (col.type === 'status') return `<td><span class="badge ${val}">${STLABEL[val] || val}</span></td>`;
        if (col.type === 'date') return `<td class="mono a-t125-ink2">${fmtDate(val)}</td>`;
        let disp = col.ml ? mlGet(val) : (val || '—');
        if (col.thumb) {
          const img = x[col.thumb];
          const t = img ? `<img class="thumb" src="${safeUrl(img)}">` : `<div class="thumb a-center-muted">${ic(cfg.icon)}</div>`;
          return `<td><div class="a-fac-g12">${t}<span class="t-title a-mw340-ellip">${esc(disp)}</span></div></td>`;
        }
        return `<td><span class="${col.k === cfg.columns[0].k ? 't-title' : ''}">${esc(disp)}</span></td>`;
      }).join('');
      return `<tr data-id="${x.id}">${tds}<td><div class="row-act">
        <button class="icon-btn" data-act="edit" title="Tahrirlash">${ic('edit')}</button>
        <button class="icon-btn" data-act="del" title="O'chirish">${ic('trash')}</button></div></td></tr>`;
    }).join('');

    c.innerHTML = `
      <div class="page-head"><div><div class="h">${cfg.label}</div><div class="d">${items.length} ta yozuv</div></div><div class="sp"></div>
        <button class="btn primary" id="addBtn">${ic('plus')} Yangi ${esc(cfg.singular)}</button></div>
      <div class="toolbar-row">${filters}</div>
      <div class="card">
        ${items.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`
        : `<div class="empty">${ic('empty')}<div class="t">Hozircha yozuv yo'q</div><div>Yangi ${esc(cfg.singular)} qo'shish uchun yuqoridagi tugmani bosing</div></div>`}
      </div>`;

    $('#addBtn').onclick = () => location.hash = `#/${state.coll}/new`;
    $$('.chip[data-f]').forEach(b => b.onclick = () => { state.statusFilter = b.dataset.f; render(); });
    $$('#content tbody tr').forEach(tr => {
      const id = tr.dataset.id;
      tr.querySelector('[data-act=edit]').onclick = () => location.hash = `#/${state.coll}/edit/${id}`;
      tr.querySelector('[data-act=del]').onclick = (e) => { e.stopPropagation(); confirmDelete(state.coll, id); };
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', (e) => { if (!e.target.closest('.row-act')) location.hash = `#/${state.coll}/edit/${id}`; });
    });
  }

  /* ==================== FORM ==================== */
  let editors = [];
  function viewForm(c) {
    const cfg = C[state.coll];
    const item = state.view === 'edit' ? (Store.find(state.coll, state.editId) || {}) : {};
    const isNew = state.view !== 'edit';
    setTitle((isNew ? 'Yangi ' : 'Tahrirlash — ') + cfg.singular);
    editors = [];
    const hasML = cfg.fields.some(f => f.ml);
    const main = cfg.fields.filter(f => !f.side);
    const side = cfg.fields.filter(f => f.side);

    const langBar = hasML ? `<div class="langtabs" id="langTabs">
      <button type="button" data-l="uz" class="on">UZ</button><button type="button" data-l="ru">RU</button><button type="button" data-l="en">EN</button></div><button type="button" class="btn sm ghost a-ml10" id="autoTr" title="Bir tilni to'ldiring — bir bosishda qolgan 2 tilga avtomatik tarjima qiladi (manba avtomatik aniqlanadi)">⇄ Avto-tarjima</button>` : '';

    c.innerHTML = `
      <div class="page-head">
        <button class="btn ghost" data-go="#/${state.coll}">${ic('back')} Orqaga</button>
        <div><div class="h">${isNew ? 'Yangi ' + esc(cfg.singular) : esc(mlGet(item[cfg.fields[0].k]) || 'Tahrirlash')}</div>
        <div class="d">${cfg.label}</div></div><div class="sp"></div>${langBar}</div>
      <form id="entForm">
        <div class="${side.length ? 'two-col' : ''}">
          <div class="card a-p24">${main.map(f => fieldHTML(f, item)).join('')}</div>
          ${side.length ? `<div class="card a-p22">${side.map(f => fieldHTML(f, item)).join('')}</div>` : ''}
        </div>
        <div class="form-actions">
          <button class="btn primary" type="submit">${ic('save')} Saqlash</button>
          <button class="btn ghost" type="button" data-go="#/${state.coll}">Bekor qilish</button>
          <div class="sp"></div>
          ${!isNew ? `<button class="btn danger" type="button" id="delBtn">${ic('trash')} O'chirish</button>` : ''}
        </div>
      </form>`;

    // init editors
    editors.forEach(e => e.init());
    // lang tabs
    if (hasML) {
      const setLang = (l) => {
        $$('#langTabs button').forEach(b => b.classList.toggle('on', b.dataset.l === l));
        $$('#entForm .lang-pane').forEach(p => p.classList.toggle('on', p.dataset.lang === l));
      };
      $$('#langTabs button').forEach(b => b.onclick = () => setLang(b.dataset.l));
      setLang('uz');
      const autoBtn = $('#autoTr');
      if (autoBtn) autoBtn.onclick = () => autoTranslateForm(autoBtn);
    }
    // uploaders
    $$('#entForm [data-upload]').forEach(wireUploader);
    // submit
    $('#entForm').addEventListener('submit', (e) => { e.preventDefault(); if (pendingUploads > 0) { toast('Rasm yuklanmoqda, biroz kuting…', 1); return; } saveForm(cfg, item, isNew); });
    if (!isNew) $('#delBtn').onclick = () => confirmDelete(state.coll, item.id);
  }

  // ===== AVTO-TARJIMA (Google, bepul, kalitsiz) =====
  async function gtranslate(text, sl, tl) {
    text = String(text || '');
    if (!text.trim()) return text;
    const parts = text.match(/[\s\S]{1,1200}/g) || [text];
    let out = '';
    for (let i = 0; i < parts.length; i++) {
      const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + sl + '&tl=' + tl + '&dt=t&q=' + encodeURIComponent(parts[i]);
      try { const r = await fetch(url); const j = await r.json(); out += (j && j[0]) ? j[0].map(x => x[0]).join('') : parts[i]; }
      catch { out += parts[i]; }
    }
    return out;
  }
  // HTML ichidagi faqat matnni tarjima qiladi — teglar/formatlash saqlanadi
  async function translateHTML(html, sl, tl) {
    const tmp = document.createElement('div'); tmp.innerHTML = html;
    const walker = document.createTreeWalker(tmp, NodeFilter.SHOW_TEXT, null);
    const nodes = []; while (walker.nextNode()) { if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode); }
    for (let i = 0; i < nodes.length; i++) { nodes[i].nodeValue = await gtranslate(nodes[i].nodeValue, sl, tl); }
    return tmp.innerHTML;
  }
  // Butun formani uch tilga tarjima qiladi — MANBA AVTOMATIK aniqlanadi.
  // Har maydon uchun matn bor birinchi til (ustuvorlik: faol til -> uz -> ru -> en)
  // manba bo'ladi, qolgan 2 til yoziladi. Ya'ni qaysi tabда turishingizdan qat'i
  // nazar, bir bosishда to'ldirilgan tildan boshqalarga o'giradi.
  async function autoTranslateForm(btn) {
    const activeBtn = $('#langTabs button.on');
    const active = activeBtn ? activeBtn.dataset.l : 'uz';
    const LANGS = ['uz', 'ru', 'en'];
    const order = [active, ...LANGS.filter(l => l !== active)];
    const fields = $$('#entForm .field[data-ml]');
    if (!fields.length) return;
    const getVal = el => el ? (el.classList.contains('editor-area') ? el.innerHTML : el.value) : '';
    const setVal = (el, v) => { if (!el) return; if (el.classList.contains('editor-area')) el.innerHTML = v; else el.value = v; };
    const orig = btn.innerHTML; btn.disabled = true; btn.innerHTML = 'Tarjima qilinmoqda…';
    let filled = 0;
    try {
      for (const field of fields) {
        const panes = {};
        LANGS.forEach(l => { panes[l] = field.querySelector('.lang-pane[data-lang="' + l + '"] [data-in]'); });
        let src = null;
        for (const l of order) { if (panes[l] && String(getVal(panes[l])).trim()) { src = l; break; } }
        if (!src) continue; // bu maydon hech bir tilda to'ldirilmagan — o'tkazamiz
        const srcVal = getVal(panes[src]);
        const rich = panes[src].classList.contains('editor-area');
        for (const tl of LANGS) {
          if (tl === src || !panes[tl]) continue;
          const tr = rich ? await translateHTML(srcVal, src, tl) : await gtranslate(srcVal, src, tl);
          setVal(panes[tl], tr);
          filled++;
        }
      }
      if (!filled) toast('Avval kamida bitta tilda maydonlarni to\'ldiring — keyin avto-tarjima qolgan tillarni yozadi.', 1);
      else toast('Avto-tarjima tayyor: ' + filled + ' ta maydon boshqa tillarga o\'girildi. Tekshirib, saqlang.');
    } catch { toast('Tarjimada xatolik yuz berdi', 1); }
    btn.disabled = false; btn.innerHTML = orig;
  }

  // Umumiy avto-tarjima: `.lang-pane[data-lang]` guruhlaridan iborat istalgan konteyner
  // (entForm, Sozlamalar, Markaz haqida, albom) uchun ishlaydi.
  function autoTrButton(id) {
    return `<button type="button" class="btn sm ghost a-ml10" id="${id}" title="Bir tilni to'ldiring — bir bosishda qolgan 2 tilga avtomatik tarjima qiladi (manba avtomatik aniqlanadi)">⇄ Avto-tarjima</button>`;
  }
  function paneEditable(pane) {
    const rich = pane.querySelector('.editor-area, [contenteditable="true"]');
    if (rich) return { get: () => rich.innerHTML, set: (v) => { rich.innerHTML = v; }, rich: true };
    const inp = pane.querySelector('[data-in], textarea, input:not([type=hidden])');
    if (inp) return { get: () => inp.value, set: (v) => { inp.value = v; }, rich: false };
    return null;
  }
  async function autoTranslatePanes(root, src, btn) {
    const panes = $$('.lang-pane', root);
    if (!panes.length) { toast('Tarjima uchun maydon topilmadi', 1); return; }
    const LANGS = ['uz', 'ru', 'en'];
    const order = [src, ...LANGS.filter(l => l !== src)]; // manba ustuvorligi (faol til birinchi)
    const groups = new Map();
    panes.forEach(p => { const k = p.parentElement; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); });
    const orig = btn.innerHTML; btn.disabled = true; btn.innerHTML = 'Tarjima qilinmoqda…';
    let filled = 0;
    try {
      for (const grp of groups.values()) {
        const ed = {};
        LANGS.forEach(l => { const p = grp.find(x => x.dataset.lang === l); ed[l] = p ? paneEditable(p) : null; });
        // Manba: shu guruhда matn bor birinchi til (faol til -> uz -> ru -> en)
        let s = null;
        for (const l of order) { if (ed[l] && String(ed[l].get()).trim()) { s = l; break; } }
        if (!s) continue;
        const srcVal = ed[s].get();
        for (const tl of LANGS) {
          if (tl === s || !ed[tl]) continue;
          ed[tl].set(ed[s].rich ? await translateHTML(srcVal, s, tl) : await gtranslate(srcVal, s, tl));
          filled++;
        }
      }
      if (!filled) toast('Avval kamida bitta tilda to\'ldiring — keyin avto-tarjima ishlaydi.', 1);
      else toast('Avto-tarjima tayyor: ' + filled + ' ta maydon o\'girildi. Tekshirib, saqlang.');
    } catch { toast('Tarjimada xatolik yuz berdi', 1); }
    btn.disabled = false; btn.innerHTML = orig;
  }

  // ===== OMMAVIY (BULK) AVTO-TARJIMA =====
  // Barcha kontentdagi BO'SH en/ru ko'p tilli maydonlarni o'zbekchadan to'ldiradi.
  // Mavjud tarjimalarga tegmaydi (idempotent — qayta ishga tushirsa xavfsiz).
  async function bulkFillTranslations(btn, log) {
    const SKIP = new Set(['name']); // shaxs ismi tarjima qilinmaydi
    const cols = ['news', 'mediaPosts', 'events', 'experts', 'publications', 'pages', 'media', 'heroSlides'];
    const data = {}; let total = 0;
    cols.forEach(c => { try { data[c] = Store.all(c); } catch { data[c] = []; } total += data[c].length; });
    if (!total) { toast('Tarjima uchun kontent topilmadi', 1); return; }
    const orig = btn.innerHTML; btn.disabled = true;
    let done = 0, filled = 0;
    try {
      for (const c of cols) {
        for (const it of data[c]) {
          let changed = false;
          for (const k in it) {
            if (SKIP.has(k)) continue;
            const v = it[k];
            if (v && typeof v === 'object' && typeof v.uz === 'string') {
              const uz = v.uz.trim(); if (!uz) continue;
              const isHTML = /<[a-z][\s\S]*>/i.test(uz);
              // faqat haqiqiy tarjima qaytsa yozamiz (rate-limit'da uz matni yozilib qolmasin)
              const tr = async (to) => { const r = isHTML ? await translateHTML(uz, 'uz', to) : await gtranslate(uz, 'uz', to); return (r && String(r).trim() && String(r).trim() !== uz) ? r : ''; };
              if (!v.ru || !String(v.ru).trim()) { const r = await tr('ru'); if (r) { v.ru = r; changed = true; filled++; } }
              if (!v.en || !String(v.en).trim()) { const r = await tr('en'); if (r) { v.en = r; changed = true; filled++; } }
            }
          }
          if (changed) { try { await Promise.resolve(Store.upsert(c, it)); } catch {} }
          done++;
          btn.innerHTML = 'Tarjima: ' + done + '/' + total;
          if (log) log.textContent = done + '/' + total + ' yozuv · ' + filled + ' maydon to\'ldirildi';
        }
      }
      toast('Ommaviy tarjima yakunlandi: ' + filled + ' maydon to\'ldirildi. Saytni tekshiring.');
    } catch { toast('Tarjimada xatolik yuz berdi', 1); }
    btn.disabled = false; btn.innerHTML = orig;
  }

  function fieldHTML(f, item) {
    const val = item[f.k];
    const lab = `<label>${esc(f.label)}${f.req ? ' <span class="req">*</span>' : ''}</label>`;
    if (f.type === 'status') {
      const opts = f.statusOpts || (C[state.coll].statusOpts) || ['published', 'draft'];
      const cur = val || opts[0];
      return `<div class="field" data-k="${f.k}" data-type="status">${lab}
        <select class="ctl">${opts.map(o => `<option value="${o}" ${o === cur ? 'selected' : ''}>${STLABEL[o]}</option>`).join('')}</select></div>`;
    }
    if (f.type === 'image' || f.type === 'file') {
      const isImg = f.type === 'image';
      const prev = isImg
        ? (val ? `<img class="prev" src="${safeUrl(val)}">` : `<div class="prev">${ic('image')}</div>`)
        : `<div class="prev">${ic('pdf')}</div>`;
      const cur = (!isImg && val) ? `<div class="hint" data-fname>Joriy: ${esc(val)}</div>` : '<div class="hint" data-fname></div>';
      return `<div class="field" data-k="${f.k}" data-type="${f.type}" data-upload>${lab}
        <div class="uploader ${isImg ? '' : ''}">${prev}
          <div><button type="button" class="btn sm" data-pick>${ic('upload')} ${isImg ? 'Rasm tanlash' : 'Fayl tanlash'}</button>
          ${val && isImg ? '<button type="button" class="btn sm ghost" data-clear>O\'chirish</button>' : ''}
          ${cur}</div>
          <input type="file" accept="${isImg ? 'image/*' : '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'}" hidden data-input>
          <input type="hidden" data-val value="${esc(val || '')}"></div></div>`;
    }
    // ML or simple
    const render1 = (lang) => {
      const v = f.ml ? ((val && val[lang]) || '') : (val || '');
      if (f.type === 'textarea') return `<textarea class="ctl" data-in placeholder="${esc(f.ph || '')}">${esc(v)}</textarea>`;
      if (f.type === 'rich') {
        const id = 'ed' + Math.random().toString(36).slice(2, 8);
        editors.push({ id, init: () => initEditor(id) });
        return `<div class="editor" data-editor="${id}">${editorTB()}
          <div class="editor-area" contenteditable="true" data-in data-ph="${esc(f.ph || 'Matn kiriting...')}">${v}</div></div>`;
      }
      const type = f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text';
      return `<input class="ctl" type="${type}" data-in value="${esc(v)}" placeholder="${esc(f.ph || '')}">`;
    };
    if (f.ml) {
      return `<div class="field" data-k="${f.k}" data-type="${f.type}" data-ml>${lab}
        ${['uz', 'ru', 'en'].map(l => `<div class="lang-pane ${l === 'uz' ? 'on' : ''}" data-lang="${l}">${render1(l)}</div>`).join('')}</div>`;
    }
    return `<div class="field" data-k="${f.k}" data-type="${f.type}">${lab}${
      f.type === 'select' ? `<select class="ctl" data-in>${(f.opts || []).map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>` : render1()
    }</div>`;
  }

  // Umumiy, kengaytirilgan matn muharriri asboblar paneli
  function editorTB() {
    return `<div class="editor-tb">
      <button type="button" data-cmd="undo" title="Orqaga (Ctrl+Z)">${ic('undo')}</button>
      <button type="button" data-cmd="redo" title="Oldinga (Ctrl+Y)">${ic('redo')}</button>
      <span class="sep"></span>
      <button type="button" data-cmd="bold" title="Qalin (Ctrl+B)">${ic('bold')}</button>
      <button type="button" data-cmd="italic" title="Kursiv (Ctrl+I)">${ic('italic')}</button>
      <button type="button" data-cmd="underline" title="Tagchiziq (Ctrl+U)">${ic('underline')}</button>
      <button type="button" data-cmd="strikeThrough" title="Chizilgan">${ic('strike')}</button>
      <span class="sep"></span>
      <button type="button" class="txt" data-cmd="formatBlock" data-arg="h2" title="Katta sarlavha">H2</button>
      <button type="button" class="txt" data-cmd="formatBlock" data-arg="h3" title="Sarlavha">H3</button>
      <button type="button" data-cmd="formatBlock" data-arg="blockquote" title="Sitata (iqtibos)">${ic('quote')}</button>
      <button type="button" data-cmd="insertUnorderedList" title="Belgili ro'yxat">${ic('ul')}</button>
      <button type="button" data-cmd="insertOrderedList" title="Raqamli ro'yxat">${ic('ol')}</button>
      <span class="sep"></span>
      <button type="button" data-cmd="justifyLeft" title="Chapga">${ic('alignLeft')}</button>
      <button type="button" data-cmd="justifyCenter" title="Markazga">${ic('alignCenter')}</button>
      <button type="button" data-cmd="justifyRight" title="O'ngga">${ic('alignRight')}</button>
      <span class="sep"></span>
      <button type="button" data-cmd="createLink" title="Havola qo'shish">${ic('link')}</button>
      <button type="button" data-cmd="insertImage" title="Rasm (URL orqali)">${ic('image')}</button>
      <button type="button" data-cmd="removeFormat" title="Formatni tozalash">${ic('clearFormat')}</button>
    </div>`;
  }

  function initEditor(id) {
    const wrap = $(`[data-editor="${id}"]`); if (!wrap) return;
    wireEditor(wrap);
  }
  // Har qanday .editor konteyneriga muharrir tugmalarini ulaydi (form + Markaz haqida uchun umumiy)
  function wireEditor(wrap) {
    const area = $('.editor-area', wrap); if (!area) return;
    // ro'yxatlar/sitata to'g'ri <p> ichida chiqishi uchun
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch {}
    const sync = () => {
      $$('.editor-tb button[data-cmd]', wrap).forEach(b => {
        const cmd = b.dataset.cmd;
        if (['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList', 'justifyLeft', 'justifyCenter', 'justifyRight'].indexOf(cmd) < 0) return;
        try { b.classList.toggle('on', document.queryCommandState(cmd)); } catch {}
      });
    };
    $$('.editor-tb button', wrap).forEach(b => b.onclick = () => {
      area.focus();
      const cmd = b.dataset.cmd;
      if (cmd === 'createLink') { const u = prompt('Havola manzili (URL):', 'https://'); if (u) document.execCommand(cmd, false, u); }
      else if (cmd === 'insertImage') { const u = prompt('Rasm manzili (URL):', 'https://'); if (u) document.execCommand(cmd, false, u); }
      else if (cmd === 'formatBlock') document.execCommand(cmd, false, b.dataset.arg);
      else document.execCommand(cmd, false, null);
      sync();
    });
    area.addEventListener('keyup', sync);
    area.addEventListener('mouseup', sync);
  }

  let pendingUploads = 0;
  function uploadBusy(delta) {
    pendingUploads = Math.max(0, pendingUploads + delta);
    const btn = $('#entForm button[type=submit]');
    if (btn) {
      btn.disabled = pendingUploads > 0;
      btn.innerHTML = pendingUploads > 0 ? (ic('upload') + ' Fayl yuklanmoqda…') : (ic('save') + ' Saqlash');
    }
  }
  function wireUploader(field) {
    const input = $('[data-input]', field), valEl = $('[data-val]', field), pick = $('[data-pick]', field);
    const type = field.dataset.type;
    pick.onclick = () => input.click();
    const clr = $('[data-clear]', field); if (clr) clr.onclick = () => { valEl.value = ''; const img = $('.prev', field); if (img.tagName === 'IMG') img.outerHTML = `<div class="prev">${ic('image')}</div>`; };
    input.onchange = () => {
      const f = input.files[0]; if (!f) return;
      if (type === 'file') {
        if (!/\.(pdf|docx?)$/i.test(f.name)) { toast('Faqat PDF yoki Word (.doc/.docx) fayl qabul qilinadi', 1); input.value = ''; return; }
        const fn = $('[data-fname]', field);
        uploadBusy(1);
        if (fn) fn.textContent = 'Yuklanmoqda: ' + f.name + '…';
        const rd = new FileReader();
        rd.onload = () => {
          Store.uploadPdf(rd.result, (path, err) => {
            uploadBusy(-1);
            if (err || !path) {
              if (fn) fn.textContent = valEl.value ? 'Joriy: ' + valEl.value : '';
              const msg = /not a valid/.test(err || '') ? 'Fayl haqiqiy PDF yoki Word hujjati emas' : err === 'too large' ? 'Fayl juda katta (30MB dan oshmasin)' : 'Fayl yuklashda xatolik yuz berdi';
              toast(msg, 1);
              input.value = '';
              return;
            }
            valEl.value = path;
            if (fn) fn.textContent = 'Yuklandi: ' + f.name;
            toast('Fayl yuklandi');
          });
        };
        rd.onerror = () => { uploadBusy(-1); toast('Faylni o\'qib bo\'lmadi', 1); };
        rd.readAsDataURL(f);
        return;
      }
      uploadBusy(1);
      let prev = $('.prev', field);
      if (prev.tagName !== 'IMG') { prev.innerHTML = ic('upload'); prev.style.opacity = '.5'; }
      resizeImage(f, 1400, (url) => {
        Store.uploadImage(url, (saved) => {
          valEl.value = saved;
          let prev2 = $('.prev', field);
          if (prev2.tagName === 'IMG') { prev2.src = saved; prev2.style.opacity = ''; }
          else { prev2.outerHTML = `<img class="prev" src="${safeUrl(saved)}">`; }
          uploadBusy(-1);
        });
      });
    };
  }

  function saveForm(cfg, item, isNew) {
    const obj = Object.assign({}, item);
    let missing = false;
    $$('#entForm .field').forEach(fl => {
      const k = fl.dataset.k; if (!k) return;
      const f = cfg.fields.find(x => x.k === k);
      const type = fl.dataset.type;
      if (type === 'image' || type === 'file' || type === 'status') {
        const v = type === 'status' ? $('select.ctl', fl).value : $('[data-val]', fl).value;
        obj[k] = v;
      } else if (fl.hasAttribute('data-ml')) {
        const o = {};
        $$('.lang-pane', fl).forEach(p => { const inp = $('[data-in]', p); o[p.dataset.lang] = type === 'rich' ? inp.innerHTML : inp.value; });
        obj[k] = o;
        if (f.req && !o.uz.trim()) missing = true;
      } else {
        const inp = $('[data-in]', fl);
        obj[k] = type === 'number' ? (parseInt(inp.value) || 0) : inp.value;
        if (f.req && !String(inp.value).trim()) missing = true;
      }
    });
    if (missing) { toast('Majburiy (*) maydonlarni to\'ldiring', 1); return; }
    Store.upsert(state.coll, obj);
    renderSidebar(); setActive(state.coll);
    toast(isNew ? 'Qo\'shildi' : 'Saqlandi');
    location.hash = `#/${state.coll}`;
  }

  /* ==================== MESSAGES (foydalanuvchi murojaatlari) ==================== */
  function viewMessages(c) {
    setTitle('Murojaatlar');
    let items = Store.all('messages').slice().reverse();
    const unread = items.filter(m => !m.read).length;
    c.innerHTML = `
      <div class="page-head"><div><div class="h">Murojaatlar</div><div class="d">${items.length} ta xabar${unread ? ` · ${unread} ta yangi` : ''}</div></div><div class="sp"></div>
        ${items.length ? `<button class="btn ghost" id="markAll">Hammasini o'qilgan deb belgilash</button>` : ''}</div>
      <div class="card">
        ${items.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>
            <th class="a-w30"></th><th>Yuboruvchi</th><th>Mavzu</th><th>Xabar</th><th class="a-w110">Sana</th><th class="a-w60r">Amal</th>
          </tr></thead><tbody>${items.map(m => `
            <tr data-id="${m.id}" class="${m.read ? '' : 'a-unread'}">
              <td>${m.read ? '' : '<span class="a-dot-ib"></span>'}</td>
              <td><div class="t-title">${esc(m.name || '—')}</div><div class="t-sub">${esc(m.email || '')}</div></td>
              <td>${esc(m.subject || '—')}</td>
              <td><div class="t-sub a-mw360-ellip">${esc(m.text || '')}</div></td>
              <td class="mono a-t12-ink2">${fmtDate(m.date)}</td>
              <td><div class="row-act"><button class="icon-btn" data-act="del" title="O'chirish">${ic('trash')}</button></div></td>
            </tr>`).join('')}</tbody></table></div>`
        : `<div class="empty">${ic('mail')}<div class="t">Hozircha murojaat yo'q</div><div>Saytdagi "Aloqa" bo'limidan yuborilgan xabarlar shu yerda ko'rinadi</div></div>`}
      </div>`;
    $$('#content tbody tr').forEach(tr => {
      const id = tr.dataset.id;
      const m = Store.find('messages', id);
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', (e) => {
        if (e.target.closest('.row-act')) return;
        if (m && !m.read) { m.read = true; Store.upsert('messages', m); renderSidebar(); }
        openMessage(m);
      });
      tr.querySelector('[data-act=del]').onclick = (e) => { e.stopPropagation(); Store.remove('messages', id); render(); toast('O\'chirildi'); };
    });
    const ma = $('#markAll');
    if (ma) ma.onclick = () => { Store.all('messages').forEach(m => { if (!m.read) { m.read = true; Store.upsert('messages', m); } }); renderSidebar(); render(); toast('Belgilandi'); };
  }
  function openMessage(m) {
    if (!m) return;
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal a-mw520">
      <h3>${esc(m.subject || 'Murojaat')}</h3>
      <div class="a-meta-row">
        <span><b>${esc(m.name || '—')}</b></span><span class="mono a-muted">${esc(m.email || '')}</span><span class="mono a-muted">${fmtDate(m.date)}</span>
      </div>
      <p class="a-msgbody">${esc(m.text || '')}</p>
      <div class="acts">
        ${m.email ? `<a class="btn" href="mailto:${esc(m.email)}?subject=Re: ${encodeURIComponent(m.subject || '')}">${ic('mail')} Javob yozish</a>` : ''}
        <button class="btn ghost" data-close>Yopish</button>
      </div></div>`;
    document.body.appendChild(bg);
    bg.querySelector('[data-close]').onclick = () => bg.remove();
    bg.onclick = (e) => { if (e.target === bg) bg.remove(); };
  }

  /* ==================== AUDIT LOGLAR (o'qish uchun — davlat auditi jurnali) ==================== */
  // Amal nomlari uchun o'qishli yorliqlar
  const AUDIT_LBL = {
    login: 'Kirish', logout: 'Chiqish', upsert: 'Qo\'shish/tahrir', remove: 'O\'chirish',
    settings: 'Sozlama', save: 'To\'liq saqlash', reset: 'Tiklash', change_password: 'Parol almashtirish',
    upload: 'Fayl yuklash'
  };
  // Yuklangan fayl turlari uchun "Bo'lim" ustunidagi o'qishli nomlar
  const AUDIT_COLL = { image: 'Rasm', document: 'Hujjat', infographic: 'Infografika' };
  // Amal turiga rang (badge)
  const AUDIT_TONE = {
    login: '#1d6a94', logout: '#6b7280', upsert: '#2e7d6b', remove: '#9a3b52',
    settings: '#8a5a2b', save: '#5b5ea6', reset: '#9a3b52', change_password: '#9a3b52',
    upload: '#4a6fa5'
  };
  function auditTs(s) {
    // "2026-07-30 11:14:31" -> "30.06.2026 11:14" (server DATE emas, TIMESTAMP)
    if (!s) return '—';
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    return m ? `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}` : esc(String(s));
  }
  let auditFilter = '';
  function viewAudit(c) {
    setTitle('Audit loglar');
    c.innerHTML = `
      <div class="page-head"><div><div class="h">Audit loglar</div>
        <div class="d">Kim, qachon, nima o'zgartirdi — tizim faoliyati jurnali (faqat o'qish uchun)</div></div><div class="sp"></div></div>
      <div class="card"><div class="empty">${ic('audit')}<div class="t">Yuklanmoqda…</div></div></div>`;
    Store.auditLog({ limit: 300, act: auditFilter }).then(function (res) {
      if (!res || !res.ok) {
        c.querySelector('.card').innerHTML = `<div class="empty">${ic('audit')}<div class="t">Jurnalni yuklab bo'lmadi</div><div>Server bilan aloqa yo'q yoki sessiya tugagan</div></div>`;
        return;
      }
      const rows = res.rows || [];
      const acts = res.actions || [];
      const chips = ['<button class="btn ' + (auditFilter === '' ? 'primary' : 'ghost') + ' sm" data-af="">Hammasi</button>']
        .concat(acts.map(function (a) {
          return '<button class="btn ' + (auditFilter === a ? 'primary' : 'ghost') + ' sm" data-af="' + esc(a) + '">' + esc(AUDIT_LBL[a] || a) + '</button>';
        })).join(' ');
      c.innerHTML = `
        <div class="page-head"><div><div class="h">Audit loglar</div>
          <div class="d">Jami ${res.total} yozuv${auditFilter ? ` · filtr: ${esc(AUDIT_LBL[auditFilter] || auditFilter)}` : ''} · so'nggi ${rows.length} ta ko'rsatilmoqda</div></div><div class="sp"></div></div>
        <div class="a-flexwrap8-mb14">${chips}</div>
        <div class="card">
          ${rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>
              <th class="a-w150">Amal</th><th class="a-w130">Bo'lim</th><th>Yozuv ID</th><th class="a-w120">IP</th><th class="a-w150">Vaqt</th>
            </tr></thead><tbody>${rows.map(function (r) {
              const tone = AUDIT_TONE[r.action] || '#6b7280';
              return `<tr>
                <td><span class="badge" data-tone="${tone}">${esc(AUDIT_LBL[r.action] || r.action)}</span></td>
                <td class="t-sub">${r.coll ? esc(AUDIT_COLL[r.coll] || r.coll) : '<span class="a-muted">—</span>'}</td>
                <td class="mono a-t12-ink2">${r.item_id ? esc(r.item_id) : '<span class="a-muted">—</span>'}</td>
                <td class="mono a-t12-ink2">${esc(r.ip || '—')}</td>
                <td class="mono a-t12-ink2">${auditTs(r.at)}</td>
              </tr>`;
            }).join('')}</tbody></table></div>`
          : `<div class="empty">${ic('audit')}<div class="t">Jurnal bo'sh</div><div>Hali hech qanday amal qayd etilmagan</div></div>`}
        </div>`;
      // Dinamik "tone" rangi (inline style o'rniga .style — CSP).
      $$('#content .badge[data-tone]').forEach(function (el) { var t = el.dataset.tone; el.style.background = t + '1a'; el.style.color = t; el.style.border = '1px solid ' + t + '44'; });
      $$('#content [data-af]').forEach(function (b) {
        b.onclick = function () { auditFilter = b.getAttribute('data-af'); viewAudit(c); };
      });
    });
  }

  /* ==================== XATOLIKLAR (diagnostika jurnali) ====================
     Saytda va serverda yuz bergan xatolar. Har bir yozuvda SABAB va YECHIM
     ko'rsatiladi. Bir xil xato takrorlansa yangi qator ochilmaydi — `hits`
     oshadi (shuning uchun "12 marta" kabi ko'rsatkich bor). */
  const ERR_LBL = {
    error: 'JS xatosi', net: 'Tarmoq', server: 'Server', client: 'Brauzer',
    'php': 'PHP', 'php-warn': 'PHP ogohlantirish', 'php-fatal': 'PHP halokatli', warn: 'Ogohlantirish'
  };
  const ERR_TONE = {
    error: '#9a3b52', 'php-fatal': '#9a3b52', server: '#9a3b52',
    net: '#2f5f9e', client: '#2f5f9e',
    'php': '#8a5a2b', 'php-warn': '#8a5a2b', warn: '#8a5a2b'
  };
  function errTs(s) {
    if (!s) return '—';
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    return m ? `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}` : esc(String(s));
  }
  let errFilter = '', errShowResolved = false;
  function viewErrors(c) {
    setTitle('Xatoliklar');
    c.innerHTML = `
      <div class="page-head"><div><div class="h">Xatoliklar</div>
        <div class="d">Saytda va serverda yuz bergan xatolar — sababi va yechimi bilan</div></div><div class="sp"></div></div>
      <div class="card"><div class="empty">${ic('bug')}<div class="t">Yuklanmoqda…</div></div></div>`;
    Store.errorLog({ limit: 200, kind: errFilter, resolved: errShowResolved }).then(function (res) {
      if (!res || !res.ok) {
        c.querySelector('.card').innerHTML = `<div class="empty">${ic('bug')}<div class="t">Jurnalni yuklab bo'lmadi</div><div>Server bilan aloqa yo'q yoki sessiya tugagan</div></div>`;
        return;
      }
      const rows = res.rows || [], kinds = res.kinds || [];
      const chips = ['<button class="btn ' + (errFilter === '' ? 'primary' : 'ghost') + ' sm" data-ef="">Hammasi</button>']
        .concat(kinds.map(function (k) {
          return '<button class="btn ' + (errFilter === k ? 'primary' : 'ghost') + ' sm" data-ef="' + esc(k) + '">' + esc(ERR_LBL[k] || k) + '</button>';
        })).join(' ');
      c.innerHTML = `
        <div class="page-head"><div><div class="h">Xatoliklar</div>
          <div class="d">${res.open} ta hal qilinmagan · jami ${res.total} ta turdagi xato${errShowResolved ? ' · hal qilinganlar ham ko\'rsatilmoqda' : ''}</div></div>
          <div class="sp"></div>
          ${rows.length ? `<button class="btn ghost" id="errResolveAll">${ic('check') || ''} Hammasini hal qilindi deb belgilash</button>` : ''}
        </div>
        <div class="a-flexwrap8-ac-mb14">
          ${chips}
          <span class="a-flex1-only"></span>
          <label class="a-checklabel">
            <input type="checkbox" id="errShowRes" ${errShowResolved ? 'checked' : ''}> Hal qilinganlarni ko'rsatish
          </label>
        </div>
        ${rows.length ? rows.map(function (r) {
          const tone = ERR_TONE[r.kind] || '#6b7280';
          const loc = r.source ? esc(r.source) + (r.line ? ':' + r.line + (r.col ? ':' + r.col : '') : '') : '';
          return `<div class="card a-errcard${r.resolved == 1 ? ' a-resolved' : ''}">
            <div class="a-fas-g12-wrap">
              <span class="badge a-flex0" data-tone="${tone}">${esc(ERR_LBL[r.kind] || r.kind)}</span>
              <div class="a-flex300">
                <div class="a-errtitle">${esc(r.message)}</div>
                <div class="mono a-t12-muted-mt4">
                  ${loc ? loc + ' · ' : ''}${r.page ? esc(r.page) + ' · ' : ''}${errTs(r.last_at)}
                  ${r.hits > 1 ? ` · <b data-tonec="${tone}">${r.hits} marta</b>` : ''}
                </div>
                ${r.cause ? `<div class="a-errbox">
                    <b class="a-accent">SABAB:</b> ${esc(r.cause)}</div>` : ''}
                ${r.stack ? `<details class="a-mt7"><summary class="a-summary">Texnik tafsilot (stack)</summary>
                    <pre class="a-stack">${esc(r.stack)}</pre></details>` : ''}
              </div>
              ${r.resolved == 1 ? '' : `<button class="btn sm ghost a-flex0" data-err-res="${r.id}">Hal qilindi</button>`}
            </div>
          </div>`;
        }).join('')
        : `<div class="card"><div class="empty">${ic('bug')}<div class="t">Xato yo'q</div><div>Tizim toza ishlayapti — hech qanday xato qayd etilmagan</div></div></div>`}`;

      // Dinamik "tone" rangi (inline style o'rniga .style — CSP).
      $$('#content .badge[data-tone]').forEach(function (el) { var t = el.dataset.tone; el.style.background = t + '1a'; el.style.color = t; el.style.border = '1px solid ' + t + '44'; });
      $$('#content [data-tonec]').forEach(function (el) { el.style.color = el.dataset.tonec; });
      $$('#content [data-ef]').forEach(function (b) {
        b.onclick = function () { errFilter = b.getAttribute('data-ef'); viewErrors(c); };
      });
      const cb = $('#errShowRes');
      if (cb) cb.onchange = function () { errShowResolved = cb.checked; viewErrors(c); };
      $$('#content [data-err-res]').forEach(function (b) {
        b.onclick = function () {
          b.disabled = true;
          Store.errorResolve(b.getAttribute('data-err-res')).then(function (r) {
            if (r.ok) { toast('Hal qilindi deb belgilandi'); viewErrors(c); }
            else { b.disabled = false; toast('Belgilab bo\'lmadi', 1); }
          });
        };
      });
      const ra = $('#errResolveAll');
      if (ra) ra.onclick = function () {
        ra.disabled = true;
        Store.errorResolve('all').then(function (r) {
          if (r.ok) { toast('Barcha xatolar hal qilindi deb belgilandi'); viewErrors(c); }
          else { ra.disabled = false; toast('Amal bajarilmadi', 1); }
        });
      };
    });
  }

  /* ==================== BILDIRISHNOMA (push) ====================
     Saytga obuna bo'lgan brauzerlarga "turtki" yuboradi. Xabar matni bu yerda
     yozilmaydi — service worker (sw.js) uni yuborilgan paytda API'dan oladi va
     ENG SO'NGGI e'lon qilingan yangilikni ko'rsatadi.

     Ya'ni tartib: avval yangilikni "e'lon qilingan" holatida saqlang, keyin shu
     yerdan yuboring. */
  function viewPush(c) {
    setTitle('Bildirishnoma');
    c.innerHTML = `
      <div class="page-head"><div><div class="h">Bildirishnoma</div>
        <div class="d">Obuna bo'lgan tashrifchilarga so'nggi yangilik haqida xabar yuborish</div></div><div class="sp"></div></div>
      <div class="card"><div class="empty">${ic('bell')}<div class="t">Yuklanmoqda…</div></div></div>`;

    Store.pushStats().then(function (st) {
      const n = (st && st.count) || 0;
      const latest = Store.all('news')
        .filter(x => x.status === 'published')
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0];

      c.innerHTML = `
        <div class="page-head"><div><div class="h">Bildirishnoma</div>
          <div class="d">Obuna bo'lgan tashrifchilarga so'nggi yangilik haqida xabar yuborish</div></div><div class="sp"></div></div>

        <div class="two-col a-g14-start">
          <div class="card a-p20">
            <div class="mono a-kicker">Obunachilar</div>
            <div class="a-bignum">${n}</div>
            <div class="a-t13-muted">brauzer obuna bo'lgan</div>
            ${!st || !st.ready ? `<div class="a-note">
              Kalitlar hali yaratilmagan — birinchi obuna bo'lganda avtomatik yaratiladi.</div>` : ''}
          </div>

          <div class="card a-p20">
            <div class="mono a-kicker">Nima yuboriladi</div>
            ${latest ? `
              <div class="a-cardtitle">${esc(mlGet(latest.title))}</div>
              <div class="mono a-t12-muted">${latest.date ? fmtDate(latest.date) : ''}${latest.category ? ' · ' + esc(mlGet(latest.category)) : ''}</div>
            ` : `<div class="a-mt8-muted13">E'lon qilingan yangilik yo'q — avval yangilik qo'shing.</div>`}
            <div class="a-mt12-note">
              Matn yuborish paytida aniqlanadi: tashrifchi eng so'nggi e'lon qilingan yangilikni o'z tilida oladi.
            </div>
          </div>
        </div>

        <div class="card a-mt14-p20">
          <div class="form-actions a-m0">
            <button class="btn primary" id="pushSend" ${(!n || !latest) ? 'disabled' : ''}>${ic('bell')} Bildirishnoma yuborish</button>
            <div class="sp"></div>
          </div>
          <div id="pushRes" class="a-mt12"></div>
          ${!n ? `<div class="a-mt10-muted13">Hali obunachi yo'q. Saytga kirib, taklif oynasida «Obuna bo'lish»ni bosib sinab ko'rishingiz mumkin.</div>` : ''}
          ${n && !latest ? `<div class="a-mt10-muted13">Yuborish uchun kamida bitta e'lon qilingan yangilik bo'lishi kerak.</div>` : ''}
        </div>

        <div class="card a-mt14-p1820">
          <div class="a-t13-ink2-lh">
            <b class="a-ink">Eslatma.</b> Bildirishnoma faqat <b>HTTPS</b> orqali ishlaydi
            (<code>localhost</code> — sinov uchun istisno). Sayt hostingga <code>http://</code> bilan
            chiqarilsa, obuna oynasi umuman ko'rinmaydi. <code>.htaccess</code> dagi HTTPS bloki
            yoqilishi shart — qarang: DEPLOY.md.
          </div>
        </div>`;

      const btn = $('#pushSend');
      if (btn) btn.onclick = function () {
        btn.disabled = true;
        const res = $('#pushRes');
        res.innerHTML = `<div class="a-t13-muted">Yuborilmoqda…</div>`;
        Store.pushSend().then(function (r) {
          if (!r || !r.ok) {
            res.innerHTML = `<div class="a-danger13">Yuborib bo'lmadi (${esc((r && r.error) || 'xato')})</div>`;
            btn.disabled = false;
            return;
          }
          res.innerHTML = `<div class="a-flexwrap16-13">
            <span class="a-green"><b>${r.sent}</b> ta yuborildi</span>
            ${r.gone ? `<span class="a-muted"><b>${r.gone}</b> ta eskirgan obuna o'chirildi</span>` : ''}
            ${r.failed ? `<span class="a-brown"><b>${r.failed}</b> ta yetmadi</span>` : ''}
          </div>`;
          toast('Bildirishnoma yuborildi: ' + r.sent + ' ta');
          setTimeout(function () { viewPush(c); }, 1800);
        });
      };
    });
  }

  /* ==================== MARKAZ HAQIDA (bosh sahifa intro + Markaz haqida/Maqsad sahifalari) ==================== */
  function viewAboutPage(c) {
    setTitle('Markaz haqida');
    const s = Store.settings();
    const intro = Object.assign({ uz: '', ru: '', en: '' }, s.aboutIntro || {});
    const DEF_INTRO = { uz: "Markaz dalillarga asoslangan mustaqil tahlil orqali davlat siyosati va jamoatchilik uchun ishonchli ekspert bilim manbai bo'lib xizmat qiladi.", ru: '', en: '' };
    ['uz','ru','en'].forEach(l => { if (!intro[l]) intro[l] = DEF_INTRO[l] || ''; });

    let pages = Store.all('pages');
    let aboutPg = pages.find(p => p.slug === 'markaz-haqida');
    let goalPg = pages.find(p => p.slug === 'maqsad');
    if (!aboutPg) aboutPg = { title: Store.ml('Markaz haqida','O centre','About'), slug: 'markaz-haqida', body: Store.ml('','',''), status: 'published' };
    if (!goalPg) goalPg = { title: Store.ml('Maqsad va vazifalar','Tseli i zadachi','Mission'), slug: 'maqsad', body: Store.ml('','',''), status: 'published' };

    aboutEditors = [];
    function richBlock(idPrefix, val) {
      return ['uz','ru','en'].map(l => {
        const id = idPrefix + '_' + l;
        aboutEditors.push(id);
        const v = (val && val[l]) || '';
        return `<div class="lang-pane ${l==='uz'?'on':''}" data-lang="${l}">
          <div class="editor" data-editor="${id}">${editorTB()}
            <div class="editor-area" contenteditable="true" data-in data-ph="Matn kiriting...">${v}</div>
          </div></div>`;
      }).join('');
    }
    function textBlock(idPrefix, val) {
      return ['uz','ru','en'].map(l => `<div class="lang-pane ${l==='uz'?'on':''}" data-lang="${l}"><textarea class="ctl a-mh70" id="${idPrefix}_${l}">${esc((val&&val[l])||'')}</textarea></div>`).join('');
    }

    c.innerHTML = `
      <div class="page-head"><div><div class="h">Markaz haqida</div><div class="d">Bosh sahifa kirish jumlasi va "Markaz haqida" sahifasidagi matnlar</div></div><div class="sp"></div>
        <div class="langtabs" id="setLang"><button type="button" data-l="uz" class="on">UZ</button><button type="button" data-l="ru">RU</button><button type="button" data-l="en">EN</button></div>${autoTrButton('aboutAutoTr')}</div>
      <div class="card a-p24-mb20">
        <b class="a-serif17-mb6">1) Kirish jumlasi (bosh sahifa)</b>
        <div class="a-muted13-mb14">Bosh sahifadagi "Markaz haqida" bo'limining katta sarlavhasi.</div>
        ${textBlock('introTxt', intro)}
      </div>
      <div class="card a-p24-mb20">
        <b class="a-serif17-mb6">2) Markaz haqida — batafsil ma'lumot</b>
        <div class="a-muted13-mb14">"Markaz haqida" sahifasidagi asosiy matn.</div>
        ${richBlock('aboutBody', aboutPg.body)}
      </div>
      <div class="card a-p24-mb20">
        <b class="a-serif17-mb6">3) Maqsad va vazifalar</b>
        <div class="a-muted13-mb14">"Markaz haqida" sahifasidagi "Maqsad va vazifalar" bo'limi matni.</div>
        ${richBlock('goalBody', goalPg.body)}
      </div>
      <div class="form-actions"><button class="btn primary" id="aboutSave">${ic('save')} Saqlash</button><div class="sp"></div></div>`;

    aboutEditors.forEach(id => initEditor(id));
    const setLang = (l) => { $$('#setLang button').forEach(b => b.classList.toggle('on', b.dataset.l === l)); $$('#content .lang-pane').forEach(p => p.classList.toggle('on', p.dataset.lang === l)); };
    $$('#setLang button').forEach(b => b.onclick = () => setLang(b.dataset.l));
    $('#aboutAutoTr').onclick = () => { const b = $('#setLang button.on'); autoTranslatePanes($('#content'), b ? b.dataset.l : 'uz', $('#aboutAutoTr')); };

    $('#aboutSave').onclick = () => {
      const newIntro = {}; ['uz','ru','en'].forEach(l => newIntro[l] = ($('#introTxt_'+l)||{}).value || '');
      Store.setSettings({ aboutIntro: newIntro });
      const grabRich = (prefix) => { const o = {}; ['uz','ru','en'].forEach(l => { const el = $(`[data-editor="${prefix}_${l}"] .editor-area`); o[l] = el ? el.innerHTML : ''; }); return o; };
      aboutPg.body = grabRich('aboutBody'); Store.upsert('pages', aboutPg);
      goalPg.body = grabRich('goalBody'); Store.upsert('pages', goalPg);
      renderSidebar();
      toast('Saqlandi');
    };
  }
  let aboutEditors = [];

  /* ==================== MEDIA ==================== */
  const MEDIA_TABS = { photo: 'Fotogalereya', video: 'Videomateriallar', info: 'Infografika' };
  function ytId(url) {
    const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : '';
  }
  function videoThumb(item) {
    if (item.thumb) return item.thumb;
    const id = ytId(item.url);
    return id ? 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg' : '';
  }
  let mediaTab = 'photo';
  let albumEditId = null;
  function mediaCounts(all) {
    const counts = { photo: 0, video: 0, info: 0 };
    all.forEach(m => { const t = m.type || 'photo'; if (t === 'album') counts.photo++; else if (counts[t] !== undefined) counts[t]++; });
    return counts;
  }
  // Foto tabi = albomlar (isrs.uz uslubi). Video/Infografika esa oldingicha tekis ro'yxat.
  function viewMedia(c) {
    if (mediaTab === 'photo') return viewAlbums(c);
    setTitle('Media kutubxona');
    const all = Store.all('media');
    const counts = mediaCounts(all);
    const items = all.filter(m => (m.type || 'photo') === mediaTab);
    const addLabel = mediaTab === 'video' ? 'Video qo\'shish' : 'Infografika (HTML) yuklash';

    function tile(m) {
      if ((m.type || 'photo') === 'video') {
        const th = videoThumb(m);
        return `<div class="media-item video" data-id="${m.id}">
          <div class="thumb">${th ? `<img src="${safeUrl(th)}">` : `<div class="vthumb">${ic('media')}</div>`}<div class="vbadge">${ic('play')}</div></div>
          <div class="info">
            <div class="nm">${esc(mlGet(m.title) || m.url)}</div>
            <div class="meta"><span class="tag">${ic('play')} Video</span>${m.date ? `<span>${fmtDate(m.date)}</span>` : ''}${m.url ? `<span class="url" title="${esc(m.url)}">${esc(m.url)}</span>` : ''}</div>
          </div>
          <div class="row-act"><button class="icon-btn" data-act="open" title="Ochish">${ic('eye')}</button><button class="icon-btn" data-act="del" title="O'chirish">${ic('trash')}</button></div>
        </div>`;
      }
      return `<div class="media-item info" data-id="${m.id}">
        <div class="thumb"><div class="vthumb a-grad">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 16v-3M12 16V9M16 16v-5" stroke-linecap="round"/></svg>
        </div></div>
        <div class="info">
          <div class="nm">${esc(mlGet(m.title) || m.name || 'Infografika')}</div>
          <div class="meta"><span class="tag">Interaktiv infografika</span>${m.date ? `<span>${fmtDate(m.date)}</span>` : ''}${m.name ? `<span class="url" title="${esc(m.name)}">${esc(m.name)}</span>` : ''}</div>
        </div>
        <div class="row-act"><button class="icon-btn" data-act="open" title="Ochish">${ic('eye')}</button><button class="icon-btn" data-act="del" title="O'chirish">${ic('trash')}</button></div>
      </div>`;
    }

    c.innerHTML = `
      <div class="page-head"><div><div class="h">Media kutubxona</div><div class="d">${items.length} ta ${mediaTab==='video'?'video':'infografika'}</div></div><div class="sp"></div>
        <button class="btn primary" id="addBtn">${ic(mediaTab==='video'?'plus':'upload')} ${addLabel}</button>
        <input type="file" accept=".html,.htm,text/html" hidden id="htmlInput"></div>
      <div class="toolbar-row"><div class="filterbar">
        ${Object.keys(MEDIA_TABS).map(k => `<button class="chip ${k===mediaTab?'on':''}" data-mt="${k}">${MEDIA_TABS[k]} <span class="a-op6">${counts[k]||0}</span></button>`).join('')}
      </div></div>
      <div class="card a-p20">
        ${items.length ? `<div class="media-grid">${items.map(tile).join('')}</div>`
        : `<div class="empty">${ic('media')}<div class="t">Bu bo'limda fayl yo'q</div><div>${mediaTab==='video'?'Video havolasini qo\'shish':'Fayl yuklash'} uchun yuqoridagi tugmani bosing</div></div>`}
      </div>`;

    $$('.chip[data-mt]').forEach(b => b.onclick = () => { mediaTab = b.dataset.mt; render(); });
    $('#addBtn').onclick = () => { if (mediaTab === 'video') videoModal(); else $('#htmlInput').click(); };
    const htmlInput = $('#htmlInput');
    if (htmlInput) htmlInput.onchange = (e) => {
      const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
      if (!/\.html?$/i.test(f.name)) { toast('Faqat .html fayl yuklang', 1); return; }
      if (f.size > 3 * 1024 * 1024) { toast('Fayl juda katta (max 3MB)', 1); return; }
      const rd = new FileReader();
      rd.onload = () => {
        Store.uploadHtml(rd.result, f.name, (saved) => {
          if (!saved) { toast('Yuklashda xato (server?)', 1); return; }
          Store.upsert('media', { type: 'info', kind: 'html', name: f.name, title: Store.ml(f.name.replace(/\.[^.]+$/, ''), '', ''), url: saved, date: new Date().toISOString().slice(0, 10) });
          renderSidebar(); render(); toast('Infografika yuklandi');
        });
      };
      rd.readAsText(f);
    };
    $$('.media-item').forEach(el => {
      const id = el.dataset.id;
      el.querySelector('[data-act=del]').onclick = () => { Store.remove('media', id); renderSidebar(); render(); toast('O\'chirildi'); };
      const op = el.querySelector('[data-act=open]'); if (op) op.onclick = () => { const m = Store.find('media', id); if (m) window.open(m.url, '_blank'); };
    });
  }

  // ---- Foto albomlari ro'yxati ----
  function albumTile(a) {
    const photos = Array.isArray(a.photos) ? a.photos : [];
    const cover = a.cover || (photos[0] && photos[0].url) || '';
    return `<div class="media-item album" data-id="${a.id}">
      <div class="thumb">${cover ? `<img src="${safeUrl(cover)}">` : `<div class="vthumb">${ic('media')}</div>`}<div class="cnt-badge">${photos.length}</div></div>
      <div class="info">
        <div class="nm">${esc(mlGet(a.title) || 'Albom')}</div>
        <div class="meta"><span class="tag">${ic('media')} Fotoalbom</span><span>${photos.length} ta rasm</span>${a.date ? `<span>${fmtDate(a.date)}</span>` : ''}</div>
      </div>
      <div class="row-act"><button class="icon-btn" data-act="edit" title="Ochish / tahrirlash">${ic('edit')}</button><button class="icon-btn" data-act="del" title="O'chirish">${ic('trash')}</button></div>
    </div>`;
  }
  function viewAlbums(c) {
    if (albumEditId) {
      const al = Store.find('media', albumEditId);
      if (al && al.type === 'album') return albumEditor(c, al);
      albumEditId = null;
    }
    setTitle('Media kutubxona');
    const all = Store.all('media');
    const counts = mediaCounts(all);
    const albums = all.filter(m => m.type === 'album');
    c.innerHTML = `
      <div class="page-head"><div><div class="h">Media kutubxona</div><div class="d">${albums.length} ta albom</div></div><div class="sp"></div>
        <button class="btn primary" id="newAlbumBtn">${ic('plus')} Albom yaratish</button></div>
      <div class="toolbar-row"><div class="filterbar">
        ${Object.keys(MEDIA_TABS).map(k => `<button class="chip ${k===mediaTab?'on':''}" data-mt="${k}">${MEDIA_TABS[k]} <span class="a-op6">${counts[k]||0}</span></button>`).join('')}
      </div></div>
      <div class="card a-p20">
        ${albums.length ? `<div class="media-grid">${albums.map(albumTile).join('')}</div>`
        : `<div class="empty">${ic('media')}<div class="t">Hali albom yo'q</div><div>Birinchi albomni yaratish uchun yuqoridagi tugmani bosing</div></div>`}
      </div>`;
    $$('.chip[data-mt]').forEach(b => b.onclick = () => { mediaTab = b.dataset.mt; render(); });
    $('#newAlbumBtn').onclick = () => albumModal();
    $$('.media-item').forEach(el => {
      const id = el.dataset.id;
      el.querySelector('[data-act=edit]').onclick = () => { albumEditId = id; render(); };
      el.querySelector('[data-act=del]').onclick = () => {
        if (!confirm('Shu albom va undagi barcha rasmlar ro\'yxati o\'chiriladi. Davom etamizmi?')) return;
        Store.remove('media', id); renderSidebar(); render(); toast('Albom o\'chirildi');
      };
    });
  }
  function albumModal() {
    const today = new Date().toISOString().slice(0, 10);
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal"><h3>Yangi albom</h3>
      <p>Albom sarlavhasi va sanasini kiriting — keyin ichiga rasm yuklaysiz.</p>
      <div class="field"><label>Albom nomi <span class="a-red">*</span></label><input class="ctl" id="alTitle" placeholder="Masalan: Termiz dialogi 2026"></div>
      <div class="field"><label>Sana</label><input class="ctl" type="date" id="alDate" value="${today}"></div>
      <div class="acts"><button class="btn ghost" data-no>Bekor qilish</button><button class="btn primary" data-yes>${ic('plus')} Yaratish</button></div></div>`;
    document.body.appendChild(bg);
    bg.querySelector('[data-no]').onclick = () => bg.remove();
    bg.onclick = (e) => { if (e.target === bg) bg.remove(); };
    bg.querySelector('[data-yes]').onclick = () => {
      const title = $('#alTitle', bg).value.trim();
      if (!title) { toast('Albom nomini kiriting', 1); return; }
      const date = $('#alDate', bg).value || today;
      const al = Store.upsert('media', { type: 'album', title: Store.ml(title, '', ''), date, cover: '', photos: [] });
      bg.remove(); albumEditId = al.id; renderSidebar(); render(); toast('Albom yaratildi — endi rasm qo\'shing');
    };
  }
  // ---- Albom tahrirlagichi: rasm yuklash, muqova tanlash, o'chirish ----
  function albumEditor(c, al) {
    setTitle('Albom: ' + (mlGet(al.title) || ''));
    const mlT = (al.title && typeof al.title === 'object') ? al.title : { uz: al.title || '', ru: '', en: '' };
    const photos = Array.isArray(al.photos) ? al.photos : [];
    const cover = al.cover || (photos[0] && photos[0].url) || '';
    function photoTile(p, i) {
      const isCover = cover && p.url === cover;
      return `<div class="media-item a-pointer" data-idx="${i}" title="Muqova qilish uchun bosing">
        <img src="${safeUrl(p.url)}">
        ${isCover ? `<div class="a-badge-abs">MUQOVA</div>` : ''}
        <div class="ov"><button class="icon-btn" data-act="del" title="O'chirish">${ic('trash')}</button></div>
      </div>`;
    }
    c.innerHTML = `
      <div class="page-head"><button class="btn ghost" id="backAlbums">${ic('back')} Albomlar</button><div class="sp"></div>
        <button class="btn primary" id="addPhotos">${ic('upload')} Rasm qo'shish</button>
        <input type="file" accept="image/*" multiple hidden id="alUp"></div>
      <div class="card a-p22-mb16">
        <div class="a-fac-g0-mb14">
          <div class="langtabs" id="albLang"><button type="button" data-l="uz" class="on">UZ</button><button type="button" data-l="ru">RU</button><button type="button" data-l="en">EN</button></div>${autoTrButton('albAutoTr')}
        </div>
        <div class="a-grid21">
          <div class="field" data-ml id="metaTitle"><label>Albom nomi</label>
            ${['uz','ru','en'].map(l => `<div class="lang-pane ${l==='uz'?'on':''}" data-lang="${l}"><input class="ctl" data-in value="${esc((mlT && mlT[l]) || '')}" placeholder="${l.toUpperCase()}"></div>`).join('')}
          </div>
          <div class="field"><label>Sana</label><input class="ctl" type="date" id="eDate" value="${esc(al.date || '')}"></div>
        </div>
        <button class="btn" id="saveMeta">${ic('save')} Saqlash</button>
      </div>
      <div class="card a-p20">
        <div class="d a-mb12">${photos.length} ta rasm${photos.length ? ' · muqovani belgilash uchun rasm ustiga bosing' : ''}</div>
        ${photos.length ? `<div class="media-grid">${photos.map(photoTile).join('')}</div>`
        : `<div class="empty">${ic('image')}<div class="t">Albom bo'sh</div><div>Yuqoridagi "Rasm qo'shish" tugmasi orqali rasm yuklang</div></div>`}
      </div>`;
    $('#backAlbums').onclick = () => { albumEditId = null; render(); };
    $('#addPhotos').onclick = () => $('#alUp').click();
    const albSetLang = (l) => { $$('#albLang button').forEach(b => b.classList.toggle('on', b.dataset.l === l)); $$('#metaTitle .lang-pane').forEach(p => p.classList.toggle('on', p.dataset.lang === l)); };
    $$('#albLang button').forEach(b => b.onclick = () => albSetLang(b.dataset.l));
    $('#albAutoTr').onclick = () => { const b = $('#albLang button.on'); autoTranslatePanes($('#metaTitle'), b ? b.dataset.l : 'uz', $('#albAutoTr')); };
    $('#saveMeta').onclick = () => {
      const cur = Store.find('media', al.id); if (!cur) return;
      const t = {}; $$('#metaTitle .lang-pane').forEach(p => { const i = p.querySelector('[data-in]'); t[p.dataset.lang] = i ? i.value.trim() : ''; });
      cur.title = { uz: t.uz || '', ru: t.ru || '', en: t.en || '' };
      cur.date = $('#eDate').value || cur.date;
      Store.upsert('media', cur); renderSidebar(); render(); toast('Saqlandi');
    };
    $('#alUp').onchange = (e) => {
      const files = [...e.target.files]; e.target.value = ''; if (!files.length) return;
      const cur = Store.find('media', al.id); if (!cur) return;
      if (!Array.isArray(cur.photos)) cur.photos = [];
      let done = 0;
      files.forEach(f => resizeImage(f, 1600, (url) => Store.uploadImage(url, (saved) => {
        cur.photos.push({ url: saved, title: Store.ml('', '', '') });
        done++;
        if (done === files.length) { Store.upsert('media', cur); render(); toast(files.length + ' ta rasm qo\'shildi'); }
      })));
    };
    $$('.media-item[data-idx]').forEach(el => {
      const idx = +el.dataset.idx;
      el.onclick = () => { const cur = Store.find('media', al.id); if (!cur || !cur.photos[idx]) return; cur.cover = cur.photos[idx].url; Store.upsert('media', cur); render(); toast('Muqova belgilandi'); };
      const del = el.querySelector('[data-act=del]');
      if (del) del.onclick = (ev) => {
        ev.stopPropagation();
        const cur = Store.find('media', al.id); if (!cur) return;
        const removed = cur.photos.splice(idx, 1)[0];
        if (removed && cur.cover === removed.url) cur.cover = '';
        Store.upsert('media', cur); render(); toast('Rasm o\'chirildi');
      };
    });
  }
  function videoModal() {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal"><h3>Video qo'shish</h3>
      <p>YouTube havolasini joylashtiring \u2014 video va muqova avtomatik olinadi.</p>
      <div class="field"><label>Video sarlavhasi</label><input class="ctl" id="vTitle" placeholder="Masalan: Markaz konferensiyasi 2026"></div>
      <div class="field"><label>YouTube havola <span class="req">*</span></label><input class="ctl" id="vUrl" placeholder="https://youtube.com/watch?v=..."></div>
      <div class="acts"><button class="btn ghost" data-no>Bekor qilish</button><button class="btn primary" data-yes>${ic('plus')} Qo'shish</button></div></div>`;
    document.body.appendChild(bg);
    bg.querySelector('[data-no]').onclick = () => bg.remove();
    bg.onclick = (e) => { if (e.target === bg) bg.remove(); };
    bg.querySelector('[data-yes]').onclick = () => {
      const url = $('#vUrl', bg).value.trim(); const title = $('#vTitle', bg).value.trim();
      if (!url || !ytId(url)) { toast('To\'g\'ri YouTube havolasini kiriting', 1); return; }
      Store.upsert('media', { type: 'video', url, title: Store.ml(title, '', ''), date: new Date().toISOString().slice(0, 10) });
      bg.remove(); renderSidebar(); render(); toast('Video qo\'shildi');
    };
  }

  /* ==================== SETTINGS ==================== */
  function viewSettings(c) {
    setTitle('Sozlamalar');
    const s = Store.settings();
    const mlField = (k, label, val) => `<div class="field" data-k="${k}" data-ml><label>${label}</label>
      ${['uz', 'ru', 'en'].map(l => `<div class="lang-pane ${l === 'uz' ? 'on' : ''}" data-lang="${l}"><input class="ctl" data-in value="${esc((val && val[l]) || '')}" placeholder="${l.toUpperCase()}"></div>`).join('')}</div>`;
    c.innerHTML = `
      <div class="page-head"><div><div class="h">Sozlamalar</div><div class="d">Sayt va tizim sozlamalari</div></div><div class="sp"></div>
        <div class="langtabs" id="setLang"><button type="button" data-l="uz" class="on">UZ</button><button type="button" data-l="ru">RU</button><button type="button" data-l="en">EN</button></div>${autoTrButton('setAutoTr')}</div>
      <div class="two-col">
        <div>
          <div class="card a-p24-mb20"><b class="a-serif17-mb18">Sayt ma'lumotlari</b>
            ${mlField('siteName', 'Markaz nomi', s.siteName)}
            <div class="field"><label>Qisqa nom</label><input class="ctl" id="setShort" value="${esc(s.shortName)}"></div>
            ${mlField('address', 'Manzil', s.address)}
            <div class="grid2"><div class="field"><label>E-pochta</label><input class="ctl" id="setEmail" value="${esc(s.email)}"></div>
            <div class="field"><label>Telefon</label><input class="ctl" id="setPhone" value="${esc(s.phone)}"></div></div>
            <div class="field"><label>Xarita joyi (aloqa sahifasi)</label><input class="ctl" id="setMap" value="${esc(s.mapQuery || '')}" placeholder="41.310961,69.246750">
              <div class="a-t12-muted-mt5">Google Maps koordinatasi <b>"kenglik,uzunlik"</b> (aniq pin uchun tavsiya etiladi) yoki to'liq manzil matni.</div></div>
          </div>
          <div class="card a-p24"><b class="a-serif17-mb18">Ijtimoiy tarmoqlar</b>
            <div class="grid2">
              <div class="field"><label>Telegram</label><input class="ctl" id="soc_telegram" value="${esc(s.social.telegram)}"></div>
              <div class="field"><label>YouTube</label><input class="ctl" id="soc_youtube" value="${esc(s.social.youtube)}"></div>
              <div class="field"><label>Facebook</label><input class="ctl" id="soc_facebook" value="${esc(s.social.facebook)}"></div>
              <div class="field"><label>X (Twitter)</label><input class="ctl" id="soc_x" value="${esc(s.social.x)}"></div>
            </div>
          </div>
        </div>
        <div>
          <div class="card a-p24-mb20"><b class="a-serif17-mb6">Logotip (3 tilda)</b>
            <div class="a-muted125-mb16">Har bir til uchun alohida logotip. Til almashtirilganda mos logotip ko'rsatiladi.</div>
            <div id="logoGrid"></div>
          </div>
          <div class="card a-p24-mb20"><b class="a-serif17-mb14">Tillar</b>
            ${['uz', 'ru', 'en'].map(l => `<div class="a-fac-sb-p8"><span>${({ uz: "O'zbek", ru: 'Rus', en: 'Ingliz' })[l]}</span>
              <label class="switch"><input type="checkbox" data-lang-tog="${l}" ${s.langs[l] ? 'checked' : ''}><span class="sl"></span></label></div>`).join('')}
          </div>
          <div class="card a-p24"><b class="a-serif17-mb14">Ko'rinish</b>
            <div class="field"><label>Standart tema</label><select class="ctl" id="setTheme"><option value="light" ${s.theme === 'light' ? 'selected' : ''}>Yorug'</option><option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>Quyuq</option></select></div>
          </div>
        </div>
      </div>
      <div class="card a-p24-mt20"><b class="a-serif17-mb6">Sahifa banner fonlari</b>
        <div class="a-muted13-mb20">Har bir bo'lim sarlavhasi ortidagi fon rasmi. Bo'sh qoldirilsa standart to'q ko'k fon ishlatiladi.</div>
        <div class="banner-grid" id="bannerGrid"></div>
      </div>
      <div class="card a-p24-mt20"><b class="a-serif17-mb6">Statistika (bosh sahifa)</b>
        <div class="a-muted13-mb18">Bosh sahifadagi raqamlar. Matn 3 tilda (tepadagi UZ/RU/EN tab orqali almashtiriladi).</div>
        <div id="statsGrid"></div>
      </div>
      <div class="card a-p24-mt20"><b class="a-serif17-mb6">Kontent tarjimasi (EN / RU)</b>
        <div class="a-muted13-mb16">Barcha yangilik, tadbir, nashr, ekspert va sahifalardagi <b>bo'sh</b> ingliz/rus maydonlarini o'zbek matnidan avtomatik to'ldiradi (Google). Mavjud tarjimalar o'zgarmaydi. Yakunida saytda tekshirib chiqing.</div>
        <div class="a-fac-g14-wrap">
          <button type="button" class="btn" id="bulkTr">⇄ Bo'sh tarjimalarni to'ldirish</button>
          <span id="bulkTrLog" class="a-t13-muted"></span>
        </div>
      </div>
      <div class="card a-p24-mt20"><b class="a-serif17-mb6">Xavfsizlik — kirish paroli</b>
        <div class="a-muted13-mb16">Parol serverda bcrypt bilan xeshlanadi va hech qayerda ochiq saqlanmaydi. Kamida <b>12 ta belgi</b> bo'lishi shart; harf, raqam va belgilar aralashmasi tavsiya etiladi.</div>
        <div class="a-grid-auto">
          <div class="field"><label>Joriy parol</label><input class="ctl" type="password" id="pwCur" autocomplete="current-password"></div>
          <div class="field"><label>Yangi parol</label><input class="ctl" type="password" id="pwNew" autocomplete="new-password"></div>
          <div class="field"><label>Yangi parolni takrorlang</label><input class="ctl" type="password" id="pwNew2" autocomplete="new-password"></div>
        </div>
        <div class="a-fac-g14-wrap-mt16">
          <button type="button" class="btn" id="pwSave">${ic('save')} Parolni almashtirish</button>
          <span id="pwMsg" class="a-t13"></span>
        </div>
      </div>
      <div class="form-actions"><button class="btn primary" id="setSave">${ic('save')} Sozlamalarni saqlash</button><div class="sp"></div>
        <button class="btn danger" id="setReset">${ic('trash')} Barcha ma'lumotlarni tiklash</button></div>`;

    // banners
    const BSEC = { news:'Yangiliklar', events:'Tadbirlar', pubs:'Nashrlar', research:'Tadqiqotlar', about:'Markaz haqida', leadership:'Rahbariyat', media:'Media', contact:'Aloqa', search:'Qidiruv' };
    const banners = Object.assign({}, s.banners || {});
    $('#bannerGrid').innerHTML = Object.keys(BSEC).map(k => `
      <div class="banner-cell" data-bk="${k}">
        <div class="bprev">${banners[k]?'':ic('image')}</div>
        <div class="binfo"><div class="blabel">${BSEC[k]}</div>
          <div class="bacts"><button type="button" class="btn sm" data-bpick>${ic('upload')} Rasm</button>${banners[k]?`<button type="button" class="btn sm ghost" data-bclear>O'chirish</button>`:''}</div></div>
        <input type="file" accept="image/*" hidden data-binput>
      </div>`).join('');
    $$('#bannerGrid .banner-cell').forEach(cell => {
      const k = cell.dataset.bk, inp = $('[data-binput]', cell), prev = $('.bprev', cell);
      // dastlabki fon rasmi (inline style o'rniga .style — CSP)
      if (banners[k]) prev.style.backgroundImage = `url(${banners[k]})`;
      $('[data-bpick]', cell).onclick = () => inp.click();
      inp.onchange = (e) => { const f = e.target.files[0]; if (!f) return; resizeImage(f, 1800, (url) => { Store.uploadImage(url, (saved) => { banners[k] = saved; prev.style.backgroundImage = `url(${saved})`; prev.innerHTML = ''; }); }); };
      const clr = $('[data-bclear]', cell); if (clr) clr.onclick = () => { delete banners[k]; prev.style.backgroundImage = ''; prev.innerHTML = ic('image'); clr.remove(); };
    });

    // stats editor
    const statsData = JSON.parse(JSON.stringify((s.stats && s.stats.length) ? s.stats : [
      { n:'0', c:{uz:'',ru:'',en:''} },{ n:'0', c:{uz:'',ru:'',en:''} },{ n:'0', c:{uz:'',ru:'',en:''} },{ n:'0', c:{uz:'',ru:'',en:''} }
    ]));
    function renderStats(){
      $('#statsGrid').innerHTML = statsData.map((st,i)=>`
        <div class="a-fas-g12-mb12" data-si="${i}">
          <input class="ctl a-w110-none" data-sn value="${esc(st.n)}" placeholder="300+">
          ${['uz','ru','en'].map(l=>`<div class="lang-pane ${l==='uz'?'on':''} a-flex1-only" data-lang="${l}"><input class="ctl" data-sc="${l}" value="${esc((st.c&&st.c[l])||'')}" placeholder="Izoh (${l.toUpperCase()})"></div>`).join('')}
          <button type="button" class="btn ghost sm a-flexnone" data-sdel>${ic('trash')}</button>
        </div>`).join('') +
        `<button type="button" class="btn sm" id="statAdd">${ic('plus')} Qator qo'shish</button>`;
      $$('#statsGrid [data-si]').forEach(row=>{
        const i = +row.dataset.si;
        $('[data-sn]',row).oninput = e=> statsData[i].n = e.target.value;
        $$('[data-sc]',row).forEach(inp=> inp.oninput = e=>{ statsData[i].c[inp.dataset.sc] = e.target.value; });
        $('[data-sdel]',row).onclick = ()=>{ statsData.splice(i,1); renderStats(); setLang(curLang()); };
      });
      $('#statAdd').onclick = ()=>{ statsData.push({n:'0',c:{uz:'',ru:'',en:''}}); renderStats(); setLang(curLang()); };
    }
    function curLang(){ const b=$$('#setLang button').find(x=>x.classList.contains('on')); return b?b.dataset.l:'uz'; }
    // lang tabs
    const setLang = (l) => { $$('#setLang button').forEach(b => b.classList.toggle('on', b.dataset.l === l)); $$('#content .lang-pane').forEach(p => p.classList.toggle('on', p.dataset.lang === l)); };
    $$('#setLang button').forEach(b => b.onclick = () => setLang(b.dataset.l));
    $('#setAutoTr').onclick = () => autoTranslatePanes($('#content'), curLang(), $('#setAutoTr'));
    renderStats();
    // logo
    // logo (3 tilli)
    const DEF_LOGO = { uz: 'logo-tstm.png', ru: 'logo-tstm.png', en: 'logo-tstm.png' };
    const LGL = { uz: "O'zbek", ru: 'Rus', en: 'Ingliz' };
    const logos = Object.assign({ uz: '', ru: '', en: '' }, s.logos || {});
    if (!logos.uz && s.logo) logos.uz = s.logo; // orqaga moslik
    $('#logoGrid').innerHTML = ['uz', 'ru', 'en'].map(l => `
      <div class="uploader tall a-mb12" data-lk="${l}">
        <img class="prev" src="${safeUrl(logos[l] || DEF_LOGO[l])}">
        <div><div class="a-fw6-13-mb6">${LGL[l]}</div>
          <button type="button" class="btn sm" data-lpick>${ic('upload')} Tanlash</button>
          ${logos[l] ? `<button type="button" class="btn sm ghost" data-lclear>O'chirish</button>` : ''}
          <input type="file" accept="image/*" hidden data-linput></div>
      </div>`).join('');
    $$('#logoGrid .uploader').forEach(cell => {
      const l = cell.dataset.lk, inp = $('[data-linput]', cell), prev = $('.prev', cell);
      $('[data-lpick]', cell).onclick = () => inp.click();
      inp.onchange = (e) => { const f = e.target.files[0]; if (!f) return; resizeImage(f, 700, (url) => { Store.uploadImage(url, (saved) => { logos[l] = saved; prev.src = saved; }); }); };
      const clr = $('[data-lclear]', cell); if (clr) clr.onclick = () => { logos[l] = ''; prev.src = DEF_LOGO[l]; clr.remove(); };
    });
    // theme live preview
    $('#setTheme').onchange = (e) => { applyTheme(e.target.value); };
    // save
    $('#setSave').onclick = () => {
      const getML = (k) => { const o = {}; $$(`[data-k="${k}"] .lang-pane`).forEach(p => o[p.dataset.lang] = $('[data-in]', p).value); return o; };
      const upd = {
        siteName: getML('siteName'), address: getML('address'),
        shortName: $('#setShort').value, email: $('#setEmail').value, phone: $('#setPhone').value,
        mapQuery: $('#setMap').value,
        social: { telegram: $('#soc_telegram').value, youtube: $('#soc_youtube').value, facebook: $('#soc_facebook').value, x: $('#soc_x').value },
        langs: { uz: $('[data-lang-tog=uz]').checked, ru: $('[data-lang-tog=ru]').checked, en: $('[data-lang-tog=en]').checked },
        theme: $('#setTheme').value
      };
      // Hech bo'lmasa bitta til qolishi shart — aks holda saytda til almashtirgich
      // bo'sh qolib, tashrifchi hech qanday tilni tanlay olmaydi.
      if (!upd.langs.uz && !upd.langs.ru && !upd.langs.en) {
        toast('Kamida bitta til yoqilgan bo\'lishi kerak', 1); return;
      }
      const lp = $('#logoPrev'); if (lp && lp.dataset.new) upd.logo = lp.dataset.new;
      upd.logos = logos;
      if (logos.uz) upd.logo = logos.uz; // orqaga moslik
      upd.banners = banners;
      upd.stats = statsData;
      Store.setSettings(upd); applyTheme(upd.theme); toast('Sozlamalar saqlandi');
    };
    // ---- Parolni almashtirish ----
    // api.php'da `change_password` amali ancha vaqtdan beri bor edi, lekin uni
    // chaqiradigan interfeys yo'q edi — ya'ni parolni panel orqali umuman
    // almashtirib bo'lmasdi. Shu bo'shliq to'ldirildi.
    $('#pwSave').onclick = () => {
      const msg = $('#pwMsg');
      const cur = $('#pwCur').value, nw = $('#pwNew').value, nw2 = $('#pwNew2').value;
      const say = (t, bad) => { msg.textContent = t; msg.style.color = bad ? 'var(--danger, #c0392b)' : 'var(--ok, #1e8449)'; };
      if (!cur) return say('Joriy parolni kiriting', 1);
      if (nw.length < 12) return say('Yangi parol kamida 12 ta belgidan iborat bo\'lsin', 1);
      if (nw !== nw2) return say('Yangi parol takrori mos kelmadi', 1);
      if (nw === cur) return say('Yangi parol eskisidan farq qilishi kerak', 1);
      $('#pwSave').disabled = true; say('Yuborilmoqda…');
      Store.changePassword(cur, nw).then(r => {
        $('#pwSave').disabled = false;
        if (r && r.ok) {
          $('#pwCur').value = $('#pwNew').value = $('#pwNew2').value = '';
          say('Parol almashtirildi. Keyingi kirishda yangisini ishlating.');
          toast('Parol almashtirildi');
        } else {
          const e = r && r.error;
          say(e === 'wrong_current' ? 'Joriy parol noto\'g\'ri'
            : e === 'weak' ? 'Parol juda qisqa'
            : 'Almashtirib bo\'lmadi — qayta urinib ko\'ring', 1);
        }
      });
    };

    $('#setReset').onclick = () => confirmModal('Ma\'lumotlarni tiklash', 'Barcha o\'zgarishlar o\'chiriladi va boshlang\'ich holatga qaytadi. Davom etasizmi?', () => { Store.reset(); applyTheme(Store.settings().theme); renderSidebar(); location.hash = '#/dashboard'; toast('Ma\'lumotlar tiklandi'); });
    { const bt = $('#bulkTr'); if (bt) bt.onclick = () => confirmModal('Kontent tarjimasi', 'Barcha kontentdagi bo\'sh EN/RU maydonlari o\'zbekchadan avtomatik to\'ldiriladi. Bu bir necha daqiqa olishi mumkin. Davom etasizmi?', () => bulkFillTranslations(bt, $('#bulkTrLog'))); }
  }

  /* ==================== Helpers: menu / modal / toast ==================== */
  function userMenu() {
    if ($('.menu')) { $('.menu').remove(); return; }
    const m = document.createElement('div'); m.className = 'menu';
    m.style.cssText = 'top:58px;right:26px';
    m.innerHTML = `<button id="mProfile">${ic('users')} Profil</button><button id="mSite">${ic('eye')} Saytni ko'rish</button><div class="sep"></div><button class="danger" id="mOut">${ic('logout')} Chiqish</button>`;
    document.body.appendChild(m);
    $('#mProfile', m).onclick = () => { m.remove(); location.hash = '#/users'; };
    $('#mSite', m).onclick = () => { m.remove(); window.open('Bosh sahifa - Hi-Fi.html', '_blank'); };
    $('#mOut', m).onclick = () => { Store.logout(); m.remove(); $('#app').classList.remove('show'); $('#login').classList.add('show'); $('#lp').value = ''; location.hash = ''; };
    setTimeout(() => document.addEventListener('click', function h(e) { if (!m.contains(e.target) && !$('#userChip').contains(e.target)) { m.remove(); document.removeEventListener('click', h); } }), 0);
  }

  function confirmDelete(coll, id) {
    confirmModal('O\'chirishni tasdiqlang', 'Bu yozuv butunlay o\'chiriladi. Davom etasizmi?', () => {
      Store.remove(coll, id); renderSidebar(); setActive(coll);
      if (state.view !== 'list') location.hash = `#/${coll}`; else render();
      toast('O\'chirildi');
    });
  }
  function confirmModal(title, msg, onYes) {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal"><h3>${esc(title)}</h3><p>${esc(msg)}</p><div class="acts"><button class="btn ghost" data-no>Bekor qilish</button><button class="btn danger" data-yes>Ha, davom etish</button></div></div>`;
    document.body.appendChild(bg);
    bg.querySelector('[data-no]').onclick = () => bg.remove();
    bg.onclick = (e) => { if (e.target === bg) bg.remove(); };
    bg.querySelector('[data-yes]').onclick = () => { bg.remove(); onYes(); };
  }
  function toast(msg, err) {
    const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : '');
    t.innerHTML = ic(err ? 'x' : 'check') + '<span>' + esc(msg) + '</span>';
    $('#toasts').appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; t.style.transition = '.25s'; setTimeout(() => t.remove(), 260); }, 2400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
