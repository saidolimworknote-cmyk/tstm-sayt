/* ============================================================
   TSTM — global inline search (har sahifada, o'tmasdan ishlaydi)
   Qidiruv belgisini bosganda kengayadi, yozilganda jonli natija chiqaradi.
   Window.TSTMSearch.open() / .toggle() bilan ochiladi.
   ============================================================ */
(function (w) {
  var lang = (function(){ try { return localStorage.getItem('tstm_site_lang') || 'uz'; } catch{ return 'uz'; } })();
  function T(k){ return (w.I18N ? w.I18N.t(k) : k); }
  function mlGet(v){ if(v && typeof v==='object') return v[lang]||v.uz||v.ru||v.en||''; return v||''; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];}); }
  // Kategoriyalar bazada xom o'zbekcha yorliq bo'lib turadi ('Diplomatiya'), saytda esa
  // I18N.tl() orqali tarjima ko'rinadi ('Дипломатия'). Shuning uchun:
  //   catLabel — ko'rinadigan (tarjima) shakl: chiplar shuni ko'rsatadi va shuni qidiradi
  //   catText  — indeks uchun xom + tarjima: foydalanuvchi ikkalasini ham qidira olsin
  function catLabel(c){
    var raw = mlGet(c); if(!raw) return '';
    return (w.I18N && w.I18N.tl) ? (w.I18N.tl(raw) || raw) : raw;
  }
  function catText(c){
    var raw = mlGet(c); if(!raw) return '';
    var tr = catLabel(c);
    return (tr && tr !== raw) ? (raw + ' ' + tr) : raw;
  }
  var fold = function(s){ return String(s||'').toLocaleLowerCase('uz').replace(/[ʻʼ'`'']/g,"'"); };
  // ko'p so'zli highlight — barcha token mosliklarini belgilaydi
  function hlTokens(text, tokens){
    var raw=String(text||'');
    if(!tokens || !tokens.length) return esc(raw);
    var low=fold(raw), marks=[];
    tokens.forEach(function(tk){ if(!tk) return; var from=0, idx;
      while((idx=low.indexOf(tk,from))!==-1){ marks.push([idx, idx+tk.length]); from=idx+tk.length; }
    });
    if(!marks.length) return esc(raw);
    marks.sort(function(a,b){ return a[0]-b[0]; });
    var merged=[marks[0].slice()];
    for(var i=1;i<marks.length;i++){ var last=merged[merged.length-1];
      if(marks[i][0]<=last[1]) last[1]=Math.max(last[1],marks[i][1]); else merged.push(marks[i].slice()); }
    var out='', cur=0;
    merged.forEach(function(m){ out+=esc(raw.slice(cur,m[0]))+'<mark>'+esc(raw.slice(m[0],m[1]))+'</mark>'; cur=m[1]; });
    out+=esc(raw.slice(cur)); return out;
  }
  // matndagi mos kelgan joy atrofidan qisqa parcha (kontekst) ajratadi
  function makeSnippet(text, tokens){
    var raw=String(text||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
    if(!raw) return '';
    var low=fold(raw), pos=-1;
    (tokens||[]).forEach(function(tk){ if(!tk) return; var p=low.indexOf(tk); if(p>-1 && (pos===-1||p<pos)) pos=p; });
    if(pos===-1) return raw.slice(0,150)+(raw.length>150?'…':'');
    var start=Math.max(0, pos-45), snip=raw.slice(start, start+170);
    if(start>0) snip='…'+snip;
    if(start+170<raw.length) snip=snip+'…';
    return snip;
  }

  function buildIndex(){
    var items=[]; if(!w.Store) return items;
    try{
      Store.all('news').filter(function(n){return n.status==='published';}).forEach(function(n){
        items.push({kind:'news',kl:T('search_k_news'),title:n.title,text:n.excerpt||n.body,href:'yangilik.html?id='+n.id,cover:n.cover||'',date:n.date||'',cat:n.category||''});
      });
      // "Bizning ekspertlar OAVlarda". Nashr nomi `cat` ga tushadi (natija
      // kartasida ham ko'rinadi), ekspert ismi esa `extra` ga — u faqat
      // qidiruv maydoniga qo'shiladi, snippetni ifloslantirmaydi.
      Store.all('mediaPosts').filter(function(p){return p.status==='published';}).forEach(function(p){
        items.push({kind:'oav',kl:T('search_k_oav'),title:p.title,text:p.excerpt||p.body,
          extra:p.expert||'',href:'sharh.html?id='+p.id,cover:p.cover||'',date:p.date||'',cat:p.outlet||''});
      });
      Store.all('publications').filter(function(p){return p.status==='published';}).forEach(function(p){
        // `disp` — qisqa (displey) sarlavha: natija kartasida shu ko'rsatiladi,
        // qidiruv esa ikkala sarlavhani ham qamraydi (pastdagi titleLow qarang).
        items.push({kind:'pub',kl:T('search_k_pub'),title:p.title,disp:p.shortTitle||'',text:p.desc,href:'nashr.html?id='+p.id,cover:p.cover||'',date:p.year||'',cat:p.category||''});
      });
      Store.all('events').filter(function(e){return e.status==='published';}).forEach(function(e){
        items.push({kind:'event',kl:T('search_k_event'),title:e.title,text:e.body,href:'tadbirlar.html',cover:e.cover||'',date:e.date||'',cat:e.type||''});
      });
      Store.all('pages').filter(function(p){return p.status==='published';}).forEach(function(p){
        items.push({kind:'page',kl:T('search_k_page'),title:p.title,text:p.body,href:'biz-kimmiz.html?slug='+encodeURIComponent(p.slug),cover:'',date:'',cat:''});
      });
      Store.all('experts').forEach(function(e){
        items.push({kind:'expert',kl:T('search_k_expert'),title:e.name,text:e.role,href:'expert.html?id='+e.id,cover:e.photo||'',date:'',cat:''});
      });
    }catch{}
    return items;
  }

  var built=false, el, input, resBox, chipsEl, INDEX=[], activeIdx=0, activeKind='';
  var phSvg='<div class="gs-ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m3 17 5-4 4 3 3-3 6 5"/></svg></div>';
  var arrowSvg='<svg class="gs-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var clockSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var fireSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3c1 3-1 4-1 6a3 3 0 0 0 6 0c0-1 0-2-1-3 2 1 4 4 4 7a8 8 0 1 1-16 0c0-4 3-6 4-8 1 2 2 2 3 1 1-1 1-1 1-3z" stroke-linejoin="round"/></svg>';

  // kategoriyalar (yuqoridagi qatorda chip sifatida chiqadi)
  var KINDS=[
    {k:'news',   t:'search_k_news'},
    {k:'oav',    t:'search_k_oav'},
    {k:'pub',    t:'search_k_pub'},
    {k:'event',  t:'search_k_event'},
    {k:'expert', t:'search_k_expert'},
    {k:'page',   t:'search_k_page'}
  ];
  // so'nggi qidiruvlar (localStorage)
  var RKEY='tstm_recent_search';
  function getRecent(){ try{ var a=JSON.parse(localStorage.getItem(RKEY)||'[]'); return Array.isArray(a)?a:[]; }catch{ return []; } }
  function saveRecent(q){ q=String(q||'').trim(); if(!q) return;
    try{ var a=getRecent().filter(function(x){ return fold(x)!==fold(q); }); a.unshift(q); localStorage.setItem(RKEY, JSON.stringify(a.slice(0,6))); }catch{} }
  function clearRecent(){ try{ localStorage.removeItem(RKEY); }catch{} }
  // ommabop kalit so'zlar — kontentdagi kategoriyalardan avtomatik
  function popularKeywords(){
    // Ko'rinadigan (tarjima) shaklni sanaymiz — chip saytdagi yorliq bilan bir xil
    // bo'lsin va bosilganda o'sha so'z qidirilsin (indeks ikkalasini ham biladi).
    var counts={}; INDEX.forEach(function(it){ var c=catLabel(it.cat).trim(); if(c) counts[c]=(counts[c]||0)+1; });
    return Object.keys(counts).sort(function(a,b){ return counts[b]-counts[a]; }).slice(0,6);
  }

  function fmtDate(d){ if(!d) return ''; var p=String(d).split('-'); return p.length===3?(p[2]+'.'+p[1]+'.'+p[0]):String(d); }

  function build(){
    if(built) return; built=true;
    el=document.createElement('div'); el.className='gs-ov'; el.id='gsOv';
    el.innerHTML =
      '<div class="gs-bar"><div class="gs-inner">'
      + '<svg class="gs-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3" stroke-linecap="round"/></svg>'
      + '<input type="text" id="gsInput" autocomplete="off" placeholder="'+esc(T('search_ph'))+'" aria-label="'+esc(T('search_title'))+'">'
      + '<button class="gs-x" id="gsClose" aria-label="'+esc(T('close')||'Yopish')+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'
      + '</div><div class="gs-chips" id="gsChips"></div><div class="gs-res" id="gsRes"></div></div>';
    document.body.appendChild(el);
    input=el.querySelector('#gsInput'); resBox=el.querySelector('#gsRes'); chipsEl=el.querySelector('#gsChips');
    el.querySelector('#gsClose').addEventListener('click', close);
    el.addEventListener('click', function(e){ if(e.target===el) close(); });
    input.addEventListener('input', refresh);
    input.addEventListener('keydown', function(e){
      if(e.key==='Escape'){ close(); return; }
      var cards=resBox.querySelectorAll('a.gs-card');
      if(e.key==='ArrowDown'){ e.preventDefault(); if(cards.length) setActive(activeIdx+1); }
      else if(e.key==='ArrowUp'){ e.preventDefault(); if(cards.length) setActive(activeIdx-1); }
      else if(e.key==='Enter'){ e.preventDefault(); var c=cards[activeIdx]||cards[0]; if(c){ saveRecent(input.value); location.href=c.getAttribute('href'); } }
    });
    // kategoriya chiplari (yuqoridagi qatorda filtrlash)
    chipsEl.addEventListener('click', function(e){
      var c=e.target.closest ? e.target.closest('.gs-chip') : null; if(!c) return;
      activeKind=c.getAttribute('data-kind')||'';
      renderChips(); refresh(); input.focus();
    });
    // natijalar/tavsiyalar bloki ichidagi bosishlar
    resBox.addEventListener('click', function(e){
      var clr=e.target.closest ? e.target.closest('[data-clear]') : null;
      if(clr){ e.preventDefault(); clearRecent(); refresh(); input.focus(); return; }
      var q=e.target.closest ? e.target.closest('[data-q]') : null;
      if(q){ e.preventDefault(); input.value=q.getAttribute('data-q'); refresh(); input.focus(); return; }
      var card=e.target.closest ? e.target.closest('a.gs-card') : null;
      if(card){ saveRecent(input.value); } // navigatsiya href orqali davom etadi
    });
    // sichqoncha bilan ustiga borilganda ham o'sha natija tanlanadi
    resBox.addEventListener('mousemove', function(e){
      var card=e.target.closest ? e.target.closest('a.gs-card') : null;
      if(!card) return; var i=parseInt(card.getAttribute('data-idx'),10);
      if(!isNaN(i) && i!==activeIdx) setActive(i);
    });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && el.classList.contains('open')) close(); });
  }

  function renderChips(){
    if(!chipsEl) return;
    var counts={}; INDEX.forEach(function(it){ counts[it.kind]=(counts[it.kind]||0)+1; });
    var html='<button class="gs-chip'+(activeKind===''?' on':'')+'" data-kind="">'+esc(T('f_all'))+'</button>';
    KINDS.forEach(function(kd){ if(!counts[kd.k]) return;
      html+='<button class="gs-chip'+(activeKind===kd.k?' on':'')+'" data-kind="'+kd.k+'">'+esc(T(kd.t))+' <span class="gs-chip-n">'+counts[kd.k]+'</span></button>';
    });
    chipsEl.innerHTML=html;
  }

  function setActive(idx){
    var cards=resBox.querySelectorAll('a.gs-card'); if(!cards.length) return;
    activeIdx=(idx+cards.length)%cards.length;
    for(var i=0;i<cards.length;i++) cards[i].classList.toggle('active', i===activeIdx);
    cards[activeIdx].scrollIntoView({block:'nearest'});
  }
  // markaziy ko'rsatuvchi: yozilgan bo'lsa — qidiruv; bo'sh + kategoriya — ko'rib chiqish; bo'sh — tavsiyalar
  function refresh(){
    var tokens=fold(input.value).split(/\s+/).filter(Boolean);
    resBox.classList.add('show'); activeIdx=0;
    if(!tokens.length){
      if(activeKind) renderList(browseKind(activeKind), []);
      else renderEmpty();
      return;
    }
    // AND qidiruv: har bir so'z sarlavha yoki matnda bo'lishi shart. Sarlavhadagi moslik ustunroq.
    var hits=INDEX.map(function(it){
        if(activeKind && it.kind!==activeKind) return null;
        // kategoriya ham qidiriladi — "ommabop kalit so'zlar" aynan kategoriyalardan
        // yasaladi, indeksda bo'lmasa ular bosilganda hech narsa topilmasdi
        // `extra` — snippetda ko'rinmaydigan, faqat qidiriladigan qo'shimcha
        // matn (masalan ekspert ismi). Bo'lmasa e'tiborsiz qoladi.
        var titleLow=fold(mlGet(it.title))+' '+fold(mlGet(it.disp||'')), hay=titleLow+' '+fold(mlGet(it.text))+' '+fold(catText(it.cat))+' '+fold(it.extra||'');
        if(!tokens.every(function(tk){ return hay.indexOf(tk)>-1; })) return null;
        var score=0; tokens.forEach(function(tk){ if(titleLow.indexOf(tk)>-1) score+=2; });
        return {it:it, score:score};
      }).filter(Boolean)
      .sort(function(a,b){ return b.score-a.score; })
      .slice(0,10).map(function(x){ return x.it; });
    if(!hits.length){
      resBox.innerHTML='<div class="gs-empty">“'+esc(input.value)+'” '+esc(T('search_none'))+'</div>';
      return;
    }
    renderList(hits, tokens);
  }

  // tanlangan kategoriyadagi eng so'nggi materiallar (bo'sh qidiruvda ko'rib chiqish)
  function browseKind(k){
    return INDEX.filter(function(it){ return it.kind===k; })
      .sort(function(a,b){ return String(b.date||'').localeCompare(String(a.date||'')); })
      .slice(0,10);
  }

  function renderList(hits, tokens){
    if(!hits.length){ resBox.innerHTML='<div class="gs-empty">'+esc(T('search_none'))+'</div>'; return; }
    resBox.innerHTML='<div class="gs-count">'+hits.length+' '+esc(T('search_results'))+'</div>'
      + hits.map(function(h,idx){
          var snip=makeSnippet(mlGet(h.text), tokens);
          return '<a class="gs-card'+(idx===0?' active':'')+'" data-idx="'+idx+'" href="'+h.href+'">'
            + '<div class="gs-thumb">'+(h.cover?'<img src="'+h.cover+'" alt="">':phSvg)+'</div>'
            + '<div class="gs-meta"><div class="gs-k">'+esc(h.kl)+(h.cat?' · '+esc(w.I18N?w.I18N.tl(h.cat):h.cat):'')+(h.date?' · '+esc(fmtDate(h.date)):'')+'</div>'
            + '<div class="gs-t">'+hlTokens(mlGet(h.disp||'')||mlGet(h.title),tokens)+'</div>'
            + (snip?'<div class="gs-snip">'+hlTokens(snip,tokens)+'</div>':'')
            + '</div>'
            + arrowSvg+'</a>';
        }).join('');
  }

  // bo'sh oyna: so'nggi qidiruvlar + ommabop kalit so'zlar
  function renderEmpty(){
    var rec=getRecent(), pop=popularKeywords(), html='';
    if(rec.length){
      html+='<div class="gs-sect"><div class="gs-sect-h"><span>'+esc(T('search_recent'))+'</span>'
          + '<button class="gs-clear" data-clear type="button">'+esc(T('search_clear'))+'</button></div><div class="gs-qwrap">'
          + rec.map(function(q){ return '<button class="gs-q" type="button" data-q="'+esc(q)+'">'+clockSvg+esc(q)+'</button>'; }).join('')
          + '</div></div>';
    }
    if(pop.length){
      html+='<div class="gs-sect"><div class="gs-sect-h"><span>'+esc(T('search_popular'))+'</span></div><div class="gs-qwrap">'
          + pop.map(function(q){ return '<button class="gs-q" type="button" data-q="'+esc(q)+'">'+fireSvg+esc(q)+'</button>'; }).join('')
          + '</div></div>';
    }
    if(!html) html='<div class="gs-empty">'+esc(T('search_hint'))+'</div>';
    resBox.innerHTML=html;
  }

  function open(){
    build();
    INDEX=buildIndex();
    activeKind=''; input.value='';
    el.classList.add('open');
    document.body.style.overflow='hidden';
    renderChips(); refresh();
    setTimeout(function(){ input.focus(); }, 120);
  }
  function close(){
    if(!el) return;
    el.classList.remove('open');
    document.body.style.overflow='';
    input.value=''; activeKind=''; resBox.classList.remove('show'); resBox.innerHTML='';
  }
  function toggle(){ if(el && el.classList.contains('open')) close(); else open(); }

  // qidiruv ikonkalarini ushlaymiz — EVENT DELEGATION.
  // Dinamik yuklanadigan header'lar uchun ham ishonchli (setTimeout'ga bog'liq emas).
  document.addEventListener('click', function(e){
    var t = e.target;
    var trig = t && t.closest ? t.closest('[data-gs-open]') : null;
    if(!trig) return;
    e.preventDefault();
    open();
  }, true);

  // orqaga moslik uchun (delegation hammasini o'zi hal qiladi)
  function wire(){}

  // #search yoki ?gs=1 bilan kelinsa — qidiruv panelini avtomatik ochamiz
  // (eski qidiruv havolalari / yo'naltirishlar uchun ishonchli, 404 bermaydi)
  function maybeAutoOpen(){
    try{ if(location.hash==='#search' || /[?&]gs=1(&|$)/.test(location.search)) setTimeout(open, 60); }catch{}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', maybeAutoOpen); else maybeAutoOpen();

  w.TSTMSearch={ open:open, close:close, toggle:toggle, wire:wire };

  /* Sahifa tepasidagi o'qish jarayoni chizig'i (#scrollProgress) OLIB TASHLANDI —
     yorqin moviy rangi rasmiy sayt uslubiga to'g'ri kelmasdi. U shu yerda
     yaratilib, har scroll'da kengligi yangilanardi; CSS'i site.css va home.css
     da edi. Qaytarilsa, uchala joy birga tiklanishi kerak. */
})(window);
