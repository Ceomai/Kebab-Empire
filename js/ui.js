/* Kebab Empire — arayüz
   Ekranlar, üst çubuk, şube şeridi, modallar, seçiciler, canlı servis döngüsü. */
(function () {
  const UI = KE.UI = {};
  const app = () => document.getElementById('app');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = KE.clamp;
  const IC = (n, c) => KE.ART.icon(n, c);
  const SAVE_KEY = 'kebab-empire-save-v2';
  let G = null;
  let screen = 'title', params = {};
  UI.ng = {};
  const MODE = () => KE.MODES[G ? G.mode : UI.ng.mode];
  const B = () => G.branches.find((b) => b.id === G.activeBranch);
  const prod = (pid) => MODE().products.find((p) => p.id === pid) || (MODE().drink.id === pid ? MODE().drink : null);
  const pn = (pid) => (prod(pid) || { name: pid }).name;
  const stars = (n) => { n = Math.round(n || 0); let s = '<span class="stars" aria-label="' + n + ' yıldız">'; for (let i = 1; i <= 5; i++) s += `<i class="${i <= n ? 'on' : ''}">★</i>`; return s + '</span>'; };
  const roleName = (s) => KE.roleName(G, s);
  const bar = (v, cls) => `<span class="gauge ${cls || ''}"><i style="width:${clamp(v, 0, 100)}%"></i></span>`;
  const moodCls = (v) => v < 35 ? 'crit' : v < 60 ? 'warn' : 'ok';
  const avatar = (look, mood, label, size) => `<span class="avatar ${size || ''}">${KE.portrait(look, { mood, label })}</span>`;

  /* ---------- Kayıt ---------- */
  UI.save = function () {
    if (!G) return;
    try { G.econAsgari = KE.ECON.asgariBrut; localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign({}, G, { live: null }))); } catch (e) { /* depolama yoksa geç */ }
  };
  UI.load = function () {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const g = JSON.parse(raw);
      if (g.econAsgari) KE.ECON.asgariBrut = g.econAsgari;
      if (g.phase === 'service') g.phase = 'morning';
      if (g.phase === 'closing' && !g.lastSummary) g.phase = 'morning';
      if (g.tut == null) g.tut = 99;
      if (!g.regulars) { g.regulars = {}; KE.REGULARS.forEach((r) => { g.regulars[r.id] = { loyalty: 0, visits: 0 }; }); }
      g.staff.forEach((s) => { s.task = null; if (s.energy == null) s.energy = 100; if (!s.pos) s.pos = KE.POSITIONS[s.role][0]; });
      return g;
    } catch (e) { return null; }
  };
  UI.hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };

  /* ---------- İlk gün rehberi ---------- */
  const TUT = [
    { phase: 'morning', sel: '.daypanel', text: 'Her gün üç küçük hedefin olur. Tutturdukça ek para ve itibar gelir.' },
    { phase: 'morning', sel: '.crewlist', text: 'Ekibin burada. Usta yalnızca pişirir; kasiyer sipariş alır, komi yemeği masaya götürür. Görevi bu düğmelerle değiştirirsin.' },
    { phase: 'morning', sel: '.dishgrid', text: 'Fiyatları buradan ayarla. Piyasanın çok üstü öğrenciyi ve işçiyi kaçırır.' },
    { phase: 'morning', sel: '[data-a="openShop"]', text: 'Hazırsan kepengi aç. Bütün şubeler aynı anda çalışır.' },
    { phase: 'service', sel: '.stagewrap', text: 'Müşteri kapıdan girer, kasada öder, usta pişirir, komi masaya götürür. Yemek bitince bahşiş kavanoza düşer.' },
    { phase: 'service', sel: '.st-hud', text: 'Yoğunluk göstergesi. Kırmızıya dönen yere bir kişi daha ver: kuyruk uzarsa kasaya, tabak beklerse servise.' },
    { phase: 'service', sel: '#crew', text: 'Yorulan çalışanı sakin saatte molaya gönder, yoğun saatte geri çağır. İstersen otomatik yönetimi açık bırak.' },
    { phase: 'service', sel: '.speed', text: 'Hızı buradan ayarla. Gün bitince bahşişi dağıtıp günlüğünü okuyacaksın. Kolay gelsin!' }
  ];
  UI.tutor = function () {
    document.querySelectorAll('.tut').forEach((x) => x.remove());
    document.querySelectorAll('.tut-hl').forEach((x) => x.classList.remove('tut-hl'));
    if (!G || G.tut == null || G.tut >= TUT.length || screen !== 'shop' || document.querySelector('.modal-bg')) return;
    const st = TUT[G.tut];
    if (st.phase !== G.phase) return;
    const el = document.querySelector(st.sel);
    if (!el) return;
    el.classList.add('tut-hl');
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const box = document.createElement('div');
    box.className = 'tut';
    box.innerHTML = `<div class="tut-in"><span class="kicker">İlk gün · ${G.tut + 1}/${TUT.length}</span><p>${st.text}</p><div class="row end"><button class="btn xs ghost" data-a="tutSkip">Rehberi geç</button><button class="btn sm green" data-a="tutNext">${G.tut === TUT.length - 1 ? 'Başlayalım' : 'Anladım'}</button></div></div>`;
    document.body.appendChild(box);
    const place = () => {
      if (!box.isConnected) return;
      const r = el.getBoundingClientRect();
      const bw = Math.min(340, window.innerWidth - 32);
      box.style.width = bw + 'px';
      let top = r.bottom + 12;
      if (top + box.offsetHeight > window.innerHeight - 10) top = Math.max(10, r.top - box.offsetHeight - 12);
      if (top < 10) top = Math.min(window.innerHeight - box.offsetHeight - 10, r.top + 12);
      box.style.top = top + 'px';
      box.style.left = Math.max(16, Math.min(window.innerWidth - bw - 16, r.left + r.width / 2 - bw / 2)) + 'px';
    };
    place(); setTimeout(place, 400);
  };
  window.addEventListener('resize', () => { if (document.querySelector('.tut')) UI.tutor(); });

  /* ---------- Bildirim ---------- */
  UI.toast = function (msg, kind) {
    const box = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.innerHTML = (kind === 'gold' ? IC('star') : kind === 'bad' ? IC('bolt') : IC('check')) + `<span>${esc(msg)}</span>`;
    box.appendChild(t);
    if (kind === 'gold' && UI.confetti) { UI.confetti(); KE.SND.play('goal'); }
    setTimeout(() => t.classList.add('out'), 3400);
    setTimeout(() => t.remove(), 3800);
  };

  /* ---------- Modal ---------- */
  let modalQueue = [];
  UI.modal = function (html, opts) {
    opts = opts || {};
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''} ${opts.cls || ''}" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(bg);
    const f = bg.querySelector('button, input');
    if (f) f.focus({ preventScroll: true });
    return bg;
  };
  UI.closeModal = function () {
    const m = document.querySelectorAll('.modal-bg');
    if (m.length) m[m.length - 1].remove();
    if (!document.querySelector('.modal-bg')) {
      if (modalQueue.length) modalQueue.shift()();
      else if (UI.holdEvent) { UI.holdEvent = false; if (G && G.pendingEvent && G.phase === 'morning') showEvent(); }
    }
  };
  const queueModal = (fn) => { if (document.querySelector('.modal-bg')) modalQueue.push(fn); else fn(); };

  /* Seçici: select yerine kartlı seçim penceresi */
  let pickCb = null;
  UI.picker = function (title, sub, options, cb) {
    pickCb = cb;
    UI.pickOptions = options;
    UI.modal(`<div class="mhead"><h2>${esc(title)}</h2>${sub ? `<p class="muted">${esc(sub)}</p>` : ''}</div>
      <div class="pickgrid">${options.map((o, i) => `<button class="pickopt ${o.sel ? 'sel' : ''}" data-a="pickOpt" data-i="${i}" ${o.disabled ? 'disabled' : ''}>${o.art || ''}<span class="po-t"><b>${esc(o.label)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</span>${o.sel ? `<span class="po-sel">${IC('check')}</span>` : ''}</button>`).join('')}</div>
      <div class="acts"><button class="btn ghost" data-a="closeModal">Vazgeç</button></div>`);
  };

  /* ---------- Yönlendirme ---------- */
  UI.go = function (s, p) { screen = s; params = p || {}; UI.render(); window.scrollTo(0, 0); };
  UI.render = function () {
    KE.G = G;
    const fn = SCREENS[screen] || SCREENS.title;
    const inGame = G && !['title', 'newMode', 'newDistrict', 'newMaster'].includes(screen);
    app().innerHTML = (inGame ? topbar() : '') + fn();
    if (screen === 'shop' && G && G.phase !== 'morning') { KE.SCENE.reset(); if (G.live) UI.sceneTick(true); renderTezgah(); }
    if (G && G.phase !== 'service') UI.save();
    if (inGame) setTimeout(UI.tutor, 60);
    if (inGame && !UI.holdEvent && G.pendingEvent && G.phase === 'morning' && !document.querySelector('.modal-bg')) showEvent();
  };

  /* ---------- Üst çubuk ve şube şeridi ---------- */
  function topbar() {
    const hol = KE.holidayOf(G.day);
    const phase = { morning: 'Sabah hazırlığı', service: 'Servis', closing: 'Kapanış' }[G.phase];
    const rep = G.reputation / 20;
    let st = '';
    for (let i = 0; i < 5; i++) st += `<i style="--f:${clamp(rep - i, 0, 1) * 100}%">★</i>`;
    const live = G.live;
    const clock = G.phase === 'service' && live && live[G.activeBranch] ? KE.clock(Math.min(live[G.activeBranch].minute, KE.MINUTES)) : G.phase === 'closing' ? '23:00' : '08:30';
    const nav = [['map', 'map', 'Harita'], ['shop', 'store', 'Dükkân'], ['office', 'chart', 'Muhasebe']];
    return `<header class="topbar">
      <div class="tb-row">
        <button class="brand" data-a="go" data-s="map" aria-label="Haritaya dön">${KE.ART.logo()}<span>Kebab<b>Empire</b></span></button>
        <div class="tb-date"><span class="tb-day">${KE.dateStr(G.day)}</span><span class="tb-sub">${KE.weekday(G.day)}${hol ? ' · ' + hol : ''}</span></div>
        <div class="tb-clock ${G.phase}">${IC('clock')}<b id="tb-clock">${clock}</b><span>${phase}</span></div>
        <div class="tb-money ${G.cash < 0 ? 'neg' : ''}">${IC('coin')}<span class="tbm"><b>${KE.tl(G.cash)}</b>${G.phase === 'service' ? `<small id="tb-today">Bugün +${KE.tl(todayRevenue())}</small>` : ''}</span></div>
        <div class="tb-rep" title="İtibar ${Math.round(G.reputation)}/100"><span class="repstars">${st}</span><small>İtibar ${Math.round(G.reputation)}</small></div>
        <nav class="tb-nav">${nav.map(([s, ic, l]) => `<button class="navbtn ${screen === s ? 'on' : ''}" data-a="go" data-s="${s}">${IC(ic)}<span>${l}</span></button>`).join('')}<button class="navbtn snd ${KE.SND.on ? 'on2' : ''}" data-a="sound" aria-label="${KE.SND.on ? 'Sesi kapat' : 'Sesi aç'}" title="${KE.SND.on ? 'Sesi kapat' : 'Sesi aç'}">${IC(KE.SND.on ? 'sound' : 'mute')}</button><button class="navbtn" data-a="menu" aria-label="Menü">${IC('menu')}</button></nav>
      </div>
      <div class="branchbar" role="tablist" aria-label="Şubeler">${branchTabs()}</div>
    </header>`;
  }
  function branchTabs() {
    return G.branches.map((b) => branchTab(b)).join('') + `<button class="btab add" data-a="go" data-s="subeler">${IC('plus')}<span>Şube aç</span></button>`;
  }
  function branchTab(b) {
    const L = G.live && G.live[b.id];
    const act = b.id === G.activeBranch;
    let status = 'Hazırlık', dot = 'idle';
    if (G.phase === 'service' && L) { if (L.closed) { status = 'Ustası yok, kapalı'; dot = 'off'; } else if (L.done) { status = 'Kapandı'; dot = 'off'; } else { status = `${L.queue.length} sırada · ${KE.tl(L.stats.revenue)}`; dot = L.queue.length > 5 ? 'busy' : 'open'; } }
    if (G.phase === 'closing') { status = 'Kepenk indi'; dot = 'off'; }
    return `<button class="btab ${act ? 'on' : ''}" role="tab" aria-selected="${act}" data-a="viewBranch" data-id="${b.id}"><span class="btab-art">${KE.ART.storefront('', act ? '#d7263d' : '#9a8b7a', G.phase === 'service')}</span><span class="btab-t"><b>${esc(b.name)}${b.championUntil && G.day <= b.championUntil ? ` <span class="crownic" title="Semt şampiyonu">${IC('crown')}</span>` : ''}</b><small><i class="dot ${dot}"></i>${status}</small></span></button>`;
  }
  function todayRevenue() { return G.live ? G.branches.reduce((a, b) => a + (G.live[b.id] ? G.live[b.id].stats.revenue : 0), 0) : 0; }
  UI.refreshBars = function () {
    const td = document.getElementById('tb-today');
    if (td) { const t = 'Bugün +' + KE.tl(todayRevenue()); if (td.textContent !== t) { td.textContent = t; td.classList.remove('bump'); void td.offsetWidth; td.classList.add('bump'); } }
    const bb = document.querySelector('.branchbar');
    if (bb) bb.innerHTML = branchTabs();
    const m = document.querySelector('.tb-money b');
    if (m) m.textContent = KE.tl(G.cash);
  };

  function npc(key, text) {
    const c = KE.CAST[key];
    return `<div class="npc"><div class="npc-fig">${KE.figure(c.look, { mood: 'happy', label: c.name })}</div>
      <div class="bubble"><span class="who">${c.name}<em>${c.role}</em></span>${esc(text || KE.line(key))}</div></div>`;
  }
  function npcMini(k) { return `<span class="avatar sm">${KE.portrait(KE.CAST[k].look, { mood: 'happy' })}</span>`; }
  function head(title, sub, extra, who) {
    const c = who && KE.CAST[who];
    return `<div class="pagehead"><button class="btn sm ghost" data-a="go" data-s="map">${IC('arrow')}Harita</button><div class="ph-t"><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${extra || ''}${c ? `<div class="ph-npc"><div class="bubble"><span class="who">${c.name}</span>${esc(KE.line(who))}</div><span class="avatar lg">${KE.portrait(c.look, { mood: 'happy', label: c.name })}</span></div>` : ''}</div>`;
  }
  const morningOnly = () => G.phase !== 'morning' ? `<div class="note">${IC('clock')}<span>Transfer, işten çıkarma ve şube açma sabah hazırlığında yapılır.</span></div>` : '';

  /* ---------- Grafikler ---------- */
  function lineChart(series, labels, opts) {
    opts = opts || {};
    const W = 640, H = opts.h || 220, pl = 58, pr = 14, pt = 12, pb = 26;
    const all = series.flatMap((s) => s.values);
    let max = Math.max(1, ...all), min = Math.min(0, ...all);
    const mag = Math.pow(10, Math.floor(Math.log10(max - min || 1)));
    max = Math.ceil(max / mag) * mag; min = Math.floor(min / mag) * mag;
    const n = labels.length;
    const x = (i) => pl + (n <= 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (n - 1));
    const y = (v) => pt + (H - pt - pb) * (1 - (v - min) / (max - min || 1));
    let g = '';
    for (let k = 0; k <= 4; k++) {
      const v = min + (max - min) * k / 4;
      g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${KE.num(Math.abs(max) >= 1000 ? v / 1000 : v)}${Math.abs(max) >= 1000 ? ' B' : ''}</text>`;
    }
    if (min < 0) g += `<line x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}" class="zero"/>`;
    const step = Math.max(1, Math.ceil(n / 8));
    labels.forEach((l, i) => { if (i % step === 0 || i === n - 1) g += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`; });
    series.forEach((s) => {
      if (!s.values.length) return;
      const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
      if (s.area) g += `<polygon points="${x(0)},${y(Math.max(0, min))} ${pts} ${x(s.values.length - 1)},${y(Math.max(0, min))}" fill="${s.color}" opacity=".14"/>`;
      g += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`;
      const li = s.values.length - 1;
      g += `<circle cx="${x(li)}" cy="${y(s.values[li])}" r="4.5" fill="${s.color}" stroke="#fff" stroke-width="2"/>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || 'grafik')}">${g}</svg>
      <div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`;
  }
  function barChart(values, labels, opts) {
    opts = opts || {};
    const W = 640, H = opts.h || 180, pl = 50, pr = 8, pt = 10, pb = 24;
    const max = Math.max(1, ...values);
    const n = values.length, bw = (W - pl - pr) / n;
    let g = '';
    for (let k = 0; k <= 3; k++) { const v = max * k / 3, yy = pt + (H - pt - pb) * (1 - k / 3); g += `<line x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}" class="grid"/><text x="${pl - 6}" y="${yy + 4}" text-anchor="end">${opts.money ? KE.num(v / 1000) + ' B' : KE.num(v)}</text>`; }
    const mi = values.indexOf(max);
    values.forEach((v, i) => {
      const h = (H - pt - pb) * Math.max(0, v) / max;
      g += `<rect x="${pl + i * bw + bw * 0.16}" y="${H - pb - h}" width="${bw * 0.68}" height="${h}" rx="4" fill="${i === mi ? '#d7263d' : (opts.color || '#f28c28')}"/>`;
      g += `<text x="${pl + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(labels[i])}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || 'grafik')}">${g}</svg>`;
  }
  function donut(parts, label) {
    const tot = parts.reduce((a, p) => a + Math.max(0, p.v), 0) || 1;
    let acc = 0, segs = '';
    const R = 54, C = 2 * Math.PI * R;
    parts.forEach((p) => { const f = Math.max(0, p.v) / tot; segs += `<circle cx="70" cy="70" r="${R}" fill="none" stroke="${p.c}" stroke-width="22" stroke-dasharray="${f * C} ${C}" stroke-dashoffset="${-acc * C}" transform="rotate(-90 70 70)"/>`; acc += f; });
    return `<div class="donut"><svg viewBox="0 0 140 140" role="img" aria-label="${esc(label)}">${segs}<text x="70" y="66" text-anchor="middle" class="d1">${esc(label)}</text><text x="70" y="84" text-anchor="middle" class="d2">${KE.tl(tot)}</text></svg>
      <ul>${parts.map((p) => `<li><i style="background:${p.c}"></i><span>${esc(p.l)}</span><b>${Math.round(Math.max(0, p.v) / tot * 100)}%</b></li>`).join('')}</ul></div>`;
  }

  /* =================== EKRANLAR =================== */
  const SCREENS = {};

  function skyline(w, h, seed, col, hi) {
    let r = seed; const rnd = () => (r = r * 16807 % 2147483647) / 2147483647;
    let x = 0, d = '';
    while (x < w) {
      const t = rnd();
      if (t < 0.12) { const R = 26 + rnd() * 30; d += `<rect x="${x}" y="${h - 40}" width="${R * 2 + 20}" height="40"/><path d="M${x + 10} ${h - 40} a${R} ${R} 0 0 1 ${R * 2} 0z"/><rect x="${x + 8 + R - 2}" y="${h - 40 - R - 14}" width="4" height="14"/>`; d += `<rect x="${x - 4}" y="${h - 40 - R * 2.4}" width="7" height="${R * 2.4}"/><path d="M${x - 4} ${h - 40 - R * 2.4} l3.5 -16 l3.5 16z"/><rect x="${x + R * 2 + 18}" y="${h - 40 - R * 2.4}" width="7" height="${R * 2.4}"/><path d="M${x + R * 2 + 18} ${h - 40 - R * 2.4} l3.5 -16 l3.5 16z"/>`; x += R * 2 + 34; }
      else if (t < 0.18) { d += `<rect x="${x}" y="${h - 120}" width="26" height="120"/><path d="M${x - 3} ${h - 120} l16 -34 l16 34z"/>`; x += 34; }
      else { const bw = 22 + rnd() * 40, bh = 30 + rnd() * 70; d += `<rect x="${x}" y="${h - bh}" width="${bw}" height="${bh}" rx="2"/>`; if (rnd() < 0.5) d += `<path d="M${x - 2} ${h - bh} l${bw / 2 + 2} -${10 + rnd() * 8} l${bw / 2 + 2} ${10 + rnd() * 8}z"/>`; x += bw + 2 + rnd() * 6; }
    }
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g fill="${col}">${d}</g>${hi ? `<g fill="${hi}" opacity=".5">${d.replace(/<path[^>]*>/g, '')}</g>` : ''}</svg>`;
  }
  SCREENS.title = () => {
    const has = UI.hasSave();
    if (!UI.heroCast) {
      UI.heroCast = {
        usta: { look: Object.assign(KE.randomLook('e', 'orta'), { facial: 'gurbiyik', skin: '#d9a273', hairColor: '#2b1d14', head: 'none' }), region: 'Adana', costume: 'yoresel', role: 'usta' },
        komi: { look: Object.assign(KE.randomLook('k', 'genc'), { head: 'none', hair: 'topuz', skin: '#e8b98f' }), region: 'İstanbul', costume: 'markali', role: 'garson' },
        walkers: ['ogrenci', 'turist', 'aile', 'isci', 'gece', 'beyaz'].map((t) => KE.customerLook(t))
      };
    }
    const hc = UI.heroCast;
    return `<main class="title2">
      <div class="t-sky"><div class="t-rays"></div><div class="t-sun"></div></div>
      <div class="t-cloud c1"></div><div class="t-cloud c2"></div><div class="t-cloud c3"></div>
      <div class="t-sky-far">${skyline(1600, 220, 7, '#9cc9ea')}</div>
      <div class="t-sky-near">${skyline(1600, 200, 31, '#6aa2d3')}</div>
      <div class="t-sea"><div class="t-ferry"><svg viewBox="0 0 90 40" aria-hidden="true"><path d="M4 22 h82 l-10 14 h-62z" fill="#fff"/><rect x="18" y="8" width="54" height="14" rx="3" fill="#d7263d"/><rect x="40" y="0" width="8" height="10" fill="#2c3e50"/><g fill="#bde3f7"><rect x="23" y="12" width="7" height="6"/><rect x="34" y="12" width="7" height="6"/><rect x="49" y="12" width="7" height="6"/><rect x="60" y="12" width="7" height="6"/></g></svg></div><div class="t-gulls">⌒⌒ ⌒</div></div>
      <div class="t-street"><div class="t-walk w1">${KE.figure(hc.walkers[0], { pose: 'walk', mood: 'happy' })}</div><div class="t-walk w2">${KE.figure(hc.walkers[1], { pose: 'walk', mood: 'happy' })}</div><div class="t-walk w3">${KE.figure(hc.walkers[2], { pose: 'walk', mood: 'happy' })}</div><div class="t-walk w4">${KE.figure(hc.walkers[3], { pose: 'walk', mood: 'happy' })}</div></div>
      <div class="t-shop">
        <div class="t-store">${KE.ART.storefront('Kebab Empire', '#d7263d', true)}</div>
        <div class="t-doner">${KE.ART.doner('et')}</div>
        <div class="t-fig f1">${KE.figure(KE.staffLook(hc.usta), { mood: 'happy' })}</div>
        <div class="t-fig f2">${KE.figure(KE.staffLook(hc.komi), { mood: 'happy', tray: true, trayDish: KE.ART.dish('iskender') })}</div>
      </div>
      <div class="t-dish d1">${KE.ART.dish('adana')}</div><div class="t-dish d2">${KE.ART.dish('lahmacun')}</div><div class="t-dish d3">${KE.ART.dish('et_durum')}</div><div class="t-dish d4">${KE.ART.dish('kunefe')}</div>
      <div class="t-front">
        <div class="t-logo"><span class="t-mark">${KE.ART.logo()}</span><h1><span>Kebab</span><em>Empire</em></h1><span class="t-ribbon">Döner ve kebap işletme oyunu</span></div>
        <div class="t-cta">${has ? `<button class="btn big green" data-a="continue">${IC('play')}Devam et</button>` : ''}<button class="btn big ${has ? 'gold' : 'green'}" data-a="newgame">${IC('plus')}Yeni oyun</button><button class="btn big ghost round" data-a="sound" aria-label="Ses">${IC(KE.SND.on ? 'sound' : 'mute')}</button></div>
      </div>
    </main>`;
  };

  function steps(n) {
    return `<ol class="steps">${['Mod', 'Semt', 'Usta'].map((l, i) => `<li class="${i + 1 < n ? 'done' : i + 1 === n ? 'on' : ''}"><i>${i + 1 < n ? '✓' : i + 1}</i>${l}</li>`).join('')}</ol>`;
  }
  SCREENS.newMode = () => {
    const ng = UI.ng;
    const card = (m) => {
      const M = KE.MODES[m];
      const dishes = M.products.slice(0, 5).map((p) => `<span>${KE.ART.dish(p.id)}</span>`).join('');
      const facts = m === 'doner'
        ? [['users', 'Kalabalık kuyruk, hızlı servis'], ['coin', 'Düşük kâr payı, çok müşteri'], ['queue', 'Öğrenci, işçi, gece çıkışı']]
        : [['table', 'Masaya oturan müşteri, uzun pişirme'], ['star', 'Yüksek hesap, yüksek bahşiş'], ['heart', 'Aileler, gurmeler, turistler']];
      return `<button class="modecard ${ng.mode === m ? 'sel' : ''}" data-a="pickMode" data-m="${m}">
        <div class="mc-art ${m}">${m === 'doner' ? KE.ART.doner('et') + KE.ART.doner('tavuk') : KE.ART.mangal(3) + '<span class="smoke s1"></span><span class="smoke s2"></span>'}</div>
        <div class="mc-body"><h3>${M.name}</h3><p>${M.tagline}</p><ul>${facts.map(([ic, t]) => `<li>${IC(ic)}${t}</li>`).join('')}</ul><div class="mc-dishes">${dishes}</div></div>
        ${ng.mode === m ? `<span class="mc-check">${IC('check')}</span>` : ''}</button>`;
    };
    return `<main class="screen narrow">${steps(1)}<h1 class="stitle">Ne olacaksın?</h1>
      <div class="modecards">${card('doner')}${card('kebap')}</div>
      <div class="panel formrow">
        <label class="field">Adın<input id="ng-owner" value="${esc(ng.owner || '')}" placeholder="Örn. Deniz" maxlength="24" autocomplete="off"></label>
        <label class="field grow">Dükkânının adı<input id="ng-shop" value="${esc(ng.shopName || '')}" placeholder="${ng.mode === 'kebap' ? 'Örn. Köz Ocakbaşı' : 'Örn. Yaprak Döner'}" maxlength="26" autocomplete="off"></label>
        <button class="btn big green" data-a="ngStep" data-to="newDistrict" ${ng.mode ? '' : 'disabled'}>Devam ${IC('play')}</button>
      </div></main>`;
  };

  SCREENS.newDistrict = () => {
    const ng = UI.ng;
    const d = KE.DISTRICTS.find((x) => x.id === ng.district);
    const mix = (dd) => Object.entries(dd.mix).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => `<span class="chip bl">${KE.CUSTOMER_TYPES[t].name}</span>`).join('');
    return `<main class="screen">${steps(2)}<div class="row between"><h1 class="stitle">İlk dükkânın hangi semtte?</h1><button class="btn sm ghost" data-a="ngStep" data-to="newMode">${IC('arrow')}Geri</button></div>
      <div class="pickmap">
        <div class="mapframe">${KE.MAP.render({ pick: true })}</div>
        <aside class="panel dcard">${d ? `<span class="kicker">${d.side} yakası · ${d.inspired} esintisi</span><h2>${d.name}</h2><p>${d.desc}</p>
          <div class="facts"><div><small>Aylık kira</small><b>${KE.tl(d.rent)}</b></div><div><small>Yaya trafiği</small><b>${d.traffic}</b></div><div><small>Rakip</small><b>${d.rivals}</b></div></div>
          <div><small class="muted">Baskın müşteri</small><div class="chips">${mix(d)}</div></div>
          <p class="small muted">Semt dükkânın görünümünü değiştirmez. Müşteri karışımını, kirayı ve rekabeti belirler.</p>
          <button class="btn big green block" data-a="ngStep" data-to="newMaster">Burada aç ${IC('play')}</button>`
          : `<span class="kicker">Haritadan seç</span><h2>Yedi semt, yedi ayrı müşteri</h2><p>Bir semtin üstüne tıkla. Öğrenci yokuşundan plaza öğle arasına, sahil ailelerinden tarihi çarşının turistlerine kadar her semtin derdi ayrı.</p>`}
          <div class="dlist">${KE.DISTRICTS.map((x) => `<button class="dl ${x.id === ng.district ? 'sel' : ''}" data-a="pickDistrict" data-d="${x.id}"><b>${x.name}</b><small>${KE.tl(x.rent)} · ${Object.entries(x.mix).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => KE.CUSTOMER_TYPES[t].name).join(', ')}</small></button>`).join('')}</div>
        </aside></div></main>`;
  };

  function statl(l, v) { return `<div class="statl"><span>${l}</span>${bar(v * 100, v < 0.5 ? 'crit' : v < 0.75 ? 'warn' : 'ok')}<b>${Math.round(v * 100)}</b></div>`; }
  function masterCard(s, opts) {
    opts = opts || {};
    const tr = KE.TRAITS[s.trait];
    const specs = Object.entries(s.spec).sort((a, b) => b[1] - a[1]);
    return `<article class="card person ${opts.sel ? 'sel' : ''}">
      <div class="pc-top"><div class="pc-fig">${KE.figure(KE.staffLook(s), { mood: KE.moodFromValue(s.morale), label: s.name })}</div>
        <div class="pc-id"><h3>${esc(s.name)}</h3><div class="chips"><span class="chip or">${s.role === 'cirak' ? 'Çırak' : 'Usta'}</span><span class="chip">${s.region}</span>${tr ? `<span class="chip gd" title="${esc(tr.desc)}">${tr.name}</span>` : ''}</div>
        ${opts.own ? `<div class="statl"><span>Moral</span>${bar(s.morale, moodCls(s.morale))}<b>${Math.round(s.morale)}</b></div>` : ''}
        <div class="specs">${specs.map(([pid, st]) => `<div class="spec">${KE.ART.dish(pid)}<span><b>${pn(pid)}</b>${stars(st)}${opts.own && st < 5 ? `<em class="xp">${bar((s.xp[pid] || 0) / KE.STAR_NEED[st + 1] * 100, 'thin')}</em>` : ''}</span></div>`).join('') || '<span class="muted small">Henüz uzmanlık yok</span>'}</div></div></div>
      <div class="pc-stats">${statl('Hız', (s.speed - 0.6) / 0.8)}${statl('Kalite', (s.quality + s.consistency) / 2)}${statl('Fire kontrol', 1.2 - s.waste)}</div>
      ${tr ? `<p class="small muted">${tr.desc}</p>` : ''}${opts.extra || ''}
      <div class="pc-foot"><div class="price"><b>${KE.tl(s.wage)}</b><small>brüt / ay${s.fee ? ` · transfer ${KE.tl(s.fee)}` : ''}</small></div><div class="row">${opts.actions || ''}</div></div>
    </article>`;
  }

  SCREENS.newMaster = () => {
    const ng = UI.ng;
    if (!ng.masters) {
      const t = KE.MASTER_TEMPLATES[ng.mode].filter((x) => x.role !== 'cirak').slice().sort(() => Math.random() - 0.5).slice(0, 3);
      const fakeG = { nextId: 900, day: 1, mode: ng.mode };
      ng.masters = t.map((x) => Object.assign(KE.makeStaff(fakeG, Object.assign({}, x, { role: 'usta' })), { tmpl: x }));
    }
    return `<main class="screen">${steps(3)}<div class="row between"><h1 class="stitle">Ocağın başına kim geçecek?</h1><button class="btn sm ghost" data-a="ngStep" data-to="newDistrict">${IC('arrow')}Geri</button></div>
      <p class="lead light">Usta yalnızca pişirir; uzman olduğu ürünü seven müşteriyi dükkâna çeker. Yanına bir çırak, bir kasiyer ve bir ${ng.mode === 'kebap' ? 'garson' : 'komi'} veriliyor.</p>
      <div class="grid g3">${ng.masters.map((s, i) => masterCard(s, { sel: ng.master === i, actions: `<button class="btn ${ng.master === i ? 'green' : ''}" data-a="pickMaster" data-i="${i}">${ng.master === i ? IC('check') + 'Seçildi' : 'Bu usta'}</button>` })).join('')}</div>
      <div class="row end"><button class="btn big green" data-a="startGame" ${ng.master == null ? 'disabled' : ''}>Kepengi kaldır ${IC('play')}</button></div></main>`;
  };

  /* ---------- Harita ---------- */
  SCREENS.map = () => {
    const tip = G.phase === 'morning' ? `Günaydın ${esc(G.owner)}. Hazırlıklar bitince dükkâna geçip kepengi aç.` : G.phase === 'service' ? 'Bütün şubeler açık. Şube şeridinden dükkânlarına göz atabilirsin.' : 'Gün bitti. Dükkânda kapanış raporu seni bekliyor.';
    return `<main class="mapscreen"><div class="mapframe big">${KE.MAP.render({ fill: true })}</div>
      <div class="mapbar">${npcMini('ayse')}<span>${tip}</span><button class="btn green" data-a="go" data-s="shop">${IC('store')}Dükkâna git</button></div></main>`;
  };

  /* ---------- Dükkân ---------- */
  SCREENS.shop = () => G.phase === 'morning' ? morningView() : serviceView();

  function morningView() {
    const b = B(); const M = MODE();
    const st = KE.branchStaff(G, b);
    const exp = KE.expectedCustomers(G, b);
    const amb = KE.ambience(G, b);
    const stations = KE.equip(G, b, 'cook').stations;
    const cooks = st.filter(KE.isCook);
    const warn = [];
    if (!cooks.length) warn.push(['crit', 'Bu şubede usta yok. Usta Pazarı\'ndan birini al; ustasız şube bugün kapalı kalır.']);
    if (cooks.length > stations) warn.push(['warn', `${cooks.length} pişirmeci var ama ${stations} ocak yeri var. Fazlası mola dönüşümünde işe yarar.`]);
    if (st.length && !st.some((s) => s.pos === 'kasa')) warn.push(['crit', 'Kasada kimse yok. Kimse sipariş alamaz; bir kasiyer ya da garson/komiyi kasaya ver.']);
    if (st.length && !st.some((s) => s.pos === 'servis')) warn.push(['crit', 'Serviste kimse yok. Hazır yemekler tezgâhta soğur.']);
    if (b.cleanliness < 40) warn.push(['warn', 'Temizlik puanı düşük. Denetimde ceza riski var.']);
    if (G.cash < 0) warn.push(['crit', 'Kasa eksiye düştü. Ay sonunda maaşlar gecikirse SGK teşviki kaybolur.']);
    const closedBranches = G.branches.filter((x) => x.id !== b.id && !KE.branchStaff(G, x).some(KE.isCook));
    if (closedBranches.length) warn.push(['warn', 'Ustasız şube bugün kapalı kalacak: ' + closedBranches.map((x) => esc(x.name)).join(', ')]);
    const low = Object.entries(M.ingredients).filter(([k]) => b.usage[k] > 0 && (b.stock[k] || 0) / b.usage[k] < 0.9).map(([, ing]) => ing.name);
    if (low.length) warn.push(['warn', `Stok bir günü karşılamıyor: ${low.join(', ')}. Hal'den ek alım yap ya da sabah siparişini "Bol" yap.`]);
    const dishCards = M.products.concat([M.drink]).map((p) => {
      const isDrink = p.id === M.drink.id;
      const mp = KE.marketPrice(G, p), price = b.prices[p.id], cost = KE.productCost(G, b, p);
      const best = isDrink ? null : KE.bestStar(G, b, p.id);
      const recipeLock = !isDrink && KE.isLocked(G, p);
      const locked = !isDrink && (recipeLock || (p.requiresSpec && best < 1));
      const on = isDrink || b.menu[p.id];
      const margin = (price / 1.1 - cost) / (price / 1.1);
      const ratio = price / mp;
      return `<article class="dishcard ${on && !locked ? '' : 'off'}">
        <div class="dc-art">${KE.ART.dish(p.id)}${!isDrink ? `<label class="switch" title="Menüde"><input type="checkbox" id="menu-${p.id}" data-c="menuToggle" data-p="${p.id}" ${b.menu[p.id] ? 'checked' : ''} ${locked ? 'disabled' : ''} aria-label="${p.name} menüde"><i></i></label>` : ''}</div>
        <div class="dc-b"><h4>${p.name}</h4>${isDrink ? '<small class="muted">Müşterilerin çoğu yanında alır</small>' : locked ? `<small class="lock">${IC('lock')}${recipeLock ? `İtibar ${p.unlock} olunca açılır` : 'Bu ürünü bilen usta yok'}</small>` : `<span class="dc-star">${stars(best)}<small>en iyi usta</small></span>`}
          <div class="stepper"><button data-a="price" data-p="${p.id}" data-d="-1" aria-label="Fiyatı düşür">${IC('minus')}</button><input id="price-${p.id}" value="${price}" data-c="priceSet" data-p="${p.id}" inputmode="numeric" aria-label="${p.name} fiyatı"><span>₺</span><button data-a="price" data-p="${p.id}" data-d="1" aria-label="Fiyatı artır">${IC('plus')}</button></div>
          <div class="chips"><span class="chip ${ratio > 1.15 ? 'rd' : ratio < 0.97 ? 'gr' : ''}">Piyasa ${KE.tl(mp)}${Math.abs(ratio - 1) >= 0.01 ? ` · ${ratio > 1 ? '+' : ''}${Math.round((ratio - 1) * 100)}%` : ''}</span><span class="chip ${margin < 0.45 ? 'or' : ''}">Kâr %${Math.round(margin * 100)}</span></div>
          </div></article>`;
    }).join('');
    return `<main class="screen">
      <div class="pagehead"><div class="ph-t"><span class="kicker">Sabah hazırlığı · ${KE.weekday(G.day)}</span><h1>${esc(b.name)}</h1><p class="ph-facts"><span>${IC('map')}${KE.district(b).name}</span><span>${IC('users')}~${Math.round(exp)} müşteri</span><span>${IC('fire')}${Math.min(stations, cooks.length)}/${stations} ocak</span><span>${IC('table')}${KE.tableCount(G, b)} masa</span>${amb.concept ? `<span>${IC('star')}${amb.concept.name}</span>` : ''}</p></div>
        <button class="btn big green" data-a="openShop">${IC('store')}${G.branches.length > 1 ? 'Bütün şubelerde kepengi aç' : 'Kepengi aç'}</button></div>
      ${(() => { const sp = KE.specialDay(G.day); return sp ? `<section class="special sp-${sp.theme || 'cuma'}"><span class="sp-badge">${IC(sp.id === 'mac' ? 'fire' : sp.id === 'cuma' ? 'users' : 'star')}</span><div><span class="kicker">Bugün özel gün</span><h2>${sp.name}</h2><p>${sp.desc}</p></div></section>` : ''; })()}
      ${(G.daily || []).length ? `<section class="panel daypanel"><div class="sechead"><h2>Günün hedefleri</h2><span class="muted small">Tutturduğun her hedef ek para ve biraz itibar getirir.</span></div>${dailyHtml(false)}</section>` : ''}
      ${warn.length ? `<div class="alerts">${warn.map(([c, w]) => `<div class="alert ${c}">${IC(c === 'crit' ? 'bolt' : 'clock')}<span>${w}</span></div>`).join('')}</div>` : ''}
      <section class="panel"><div class="sechead"><h2>Ekip ve açılış görevleri</h2><button class="btn sm ghost" data-a="go" data-s="lonca">${IC('users')}Personeli yönet</button></div>
        ${crewPanel(b, false)}</section>
      <section class="panel"><div class="sechead"><h2>Menü ve fiyatlar</h2><span class="muted small">Fiyatlar KDV dahil. Pahalı fiyat öğrenci ve işçiyi kaçırır; gurmeler ve plaza çalışanları fiyata pek bakmaz.</span></div>
        <div class="dishgrid">${dishCards}</div></section>

    </main>`;
  }

  /* Günün hedefleri */
  function dailyHtml(live) {
    const list = live ? KE.dailyProgress(G, false) : (G.daily || []).map((g) => Object.assign({}, g, { p: 0, state: 'open' }));
    if (!list.length) return '';
    return `<div class="daily">${list.map((g) => `<div class="dg ${g.state}"><i>${IC(g.state === 'done' || g.state === 'ok' ? 'check' : g.state === 'fail' ? 'bolt' : 'target')}</i><span><b>${g.text}</b>${live && ['served', 'tips', 'match'].includes(g.kind) ? bar(g.p * 100, g.state === 'done' ? 'ok' : 'or') : ''}</span><em>+${KE.tl(g.reward)}</em></div>`).join('')}</div>`;
  }

  /* Ekip paneli: görev seçimi (sabah ve servis) */
  const POS_IC = { ocak: 'fire', kasa: 'cash', servis: 'tray', temizlik: 'broom', paket: 'scooter', yonetim: 'chart', mola: 'pause' };
  function crewPanel(b, live) {
    const st = KE.branchStaff(G, b);
    const mgr = st.find((s) => s.role === 'mudur');
    const L = G.live && G.live[b.id];
    const order = { usta: 0, cirak: 1, kasiyer: 2, garson: 3, temizlik: 4, kurye: 5, mudur: 6 };
    const cooking = live ? KE.cookingStaff(G, b) : [];
    const rows = st.slice().sort((a, c) => order[a.role] - order[c.role]).map((s) => {
      const t = s.task;
      let act = s.pos === 'mola' ? 'Molada, dinleniyor' : t ? (KE.TASK_NAMES[t.type] + (t.type === 'cook' && L ? ': ' + pn((L.tickets.find((k) => k.id === t.ref) || {}).pid) : '')) : live ? 'Boşta' : 'Hazır';
      if (live && KE.isCook(s) && s.pos === 'ocak' && !cooking.includes(s)) act = 'Ocak yeri yok';
      return `<div class="crew ${s.pos === 'mola' ? 'resting' : ''}">
        <span class="avatar">${KE.portrait(KE.staffLook(s), { mood: KE.moodFromValue(s.morale), label: s.name })}</span>
        <div class="crew-id"><b>${esc(s.name)}</b><small>${roleName(s)} · <span class="act">${act}</span></small>
          <div class="crew-bars"><span title="Enerji ${Math.round(s.energy)}">${IC('bolt')}${bar(s.energy, s.energy < 25 ? 'crit' : s.energy < 50 ? 'warn' : 'ok')}</span><span title="Moral ${Math.round(s.morale)}">${IC('heart')}${bar(s.morale, moodCls(s.morale))}</span></div></div>
        <div class="seg" role="group" aria-label="${esc(s.name)} görevi">${KE.POSITIONS[s.role].map((p) => `<button class="${s.pos === p ? 'on' : ''}" data-a="setPos" data-id="${s.id}" data-p="${p}" title="${KE.POS_NAMES[p]}" aria-pressed="${s.pos === p}">${IC(POS_IC[p])}<span>${KE.POS_NAMES[p]}</span></button>`).join('')}</div>
      </div>`;
    }).join('');
    return `<div class="crewhead"><label class="switch lbl"><input type="checkbox" id="auto-${b.id}" data-c="autoStaff" data-b="${b.id}" ${b.autoStaff ? 'checked' : ''}><i></i><span><b>Otomatik ekip yönetimi</b><small>${mgr ? `Müdür ${esc(mgr.name)} yoğunluğa göre görev ve mola düzenler.` : 'Müdür yok: yalnızca bitkin düşenleri molaya gönderir. Görevleri sen ayarla.'}</small></span></label></div>
      <div class="crewlist">${rows || '<p class="muted">Bu şubede henüz kimse yok.</p>'}</div>`;
  }

  function serviceView() {
    const b = B();
    const closing = G.phase === 'closing';
    const L = G.live && G.live[b.id];
    return `<main class="screen wide">
      <div class="servgrid">
        <div class="stagewrap">${KE.SCENE.html(G, b)}<div id="tezgah"></div></div>
        <section class="panel crewcell"><div class="sechead"><h2>Ekip</h2></div><div id="crew">${crewPanel(b, true)}</div></section>
        <aside class="stack side">
          <div class="panel clockpanel"><div class="row between"><div><small class="muted">${esc(b.name)}</small><div class="bigclock" id="clock">${L ? KE.clock(Math.min(L.minute, KE.MINUTES)) : '23:00'}</div></div><div class="jar" title="Bahşiş kavanozu"><i id="jar"></i></div></div>
            ${closing ? `<button class="btn big green block" data-a="showClosing">${IC('chart')}Kapanış raporu</button>` : `<div class="speed seg" role="group" aria-label="Oyun hızı">${[[0, 'stop', 'Dur'], [1, 'play', '1×'], [2, 'ff', '2×'], [4, 'ff', '4×']].map(([v, ic, l]) => `<button class="${G.speed === v ? 'on' : ''}" data-a="speed" data-v="${v}">${IC(ic)}<span>${l}</span></button>`).join('')}</div>`}
          </div>
          <div class="panel" id="livestats"></div>
          ${closing ? '' : `<div class="panel stack"><button class="btn gold block" id="tezgahBtn" data-a="tezgah">${IC('chef')}<span>${L && L.player.active ? 'Tezgâhtan çık' : 'Tezgâha geç'}</span></button><button class="btn sm ghost block" data-a="fastForward">${IC('ff')}Günü hızlı bitir</button></div>`}
          ${(G.daily || []).length && !closing ? '<div class="panel"><h3>Günün hedefleri</h3><div id="dailylive"></div></div>' : ''}
          ${G.branches.length > 1 ? '<div class="panel"><h3>Bütün şubeler</h3><div id="branchlive"></div></div>' : ''}
        </aside>
      </div></main>`;
  }

  /* ---------- Canlı döngü ---------- */
  let acc = 0, lastT = 0;
  UI.startLoop = function () {
    if (UI.timer) return;
    lastT = performance.now();
    UI.timer = setInterval(loop, 50);
  };
  function loop() {
    const now = performance.now();
    const dt = Math.min(200, now - lastT); lastT = now;
    if (!G || G.phase !== 'service' || !G.live) return;
    if (document.querySelector('.modal-bg') || document.querySelector('.tut')) return;
    if (!G.speed) return;
    acc += dt * G.speed;
    let ticked = false;
    while (acc >= KE.MINUTE_MS) { acc -= KE.MINUTE_MS; KE.tickAll(G); ticked = true; if (KE.allDone(G)) break; }
    if (ticked) {
      const L = G.live[G.activeBranch];
      if (L && L.player.active && L.player.tid == null && KE.playerTake(G)) renderTezgah();
      UI.sceneTick();
    }
    if (KE.allDone(G)) {
      KE.finishService(G);
      UI.render();
      showClosing();
    }
  }
  let tickN = 0;
  UI.sceneTick = function (force) {
    if (!G.live) return;
    const b = B(), L = G.live[b.id];
    tickN++;
    if (force || tickN % 2 === 0) UI.refreshBars();
    const c = document.getElementById('tb-clock');
    if (c && L) c.textContent = KE.clock(Math.min(L.minute, KE.MINUTES));
    if (screen === 'map') { const f = document.querySelector('.mapframe'); if (f && (force || tickN % 12 === 0)) f.innerHTML = KE.MAP.render({ fill: true }); return; }
    if (screen !== 'shop' || !L) return;
    KE.SCENE.update(G, b, L);
    const rush = { 120: 'Öğle yoğunluğu başladı!', 540: 'Akşam yoğunluğu başladı!', 720: 'Son siparişler!' };
    Object.keys(rush).forEach((m) => { if (L.minute >= +m && (UI.lastMin == null || UI.lastMin < +m) && UI.lastMinB === b.id) banner(rush[m]); });
    UI.lastMin = L.minute; UI.lastMinB = b.id;
    const ck = document.getElementById('clock');
    if (ck) ck.textContent = KE.clock(Math.min(L.minute, KE.MINUTES));
    const S = L.stats;
    const jar = document.getElementById('jar');
    if (jar) jar.style.height = Math.min(100, S.tips / Math.max(1, L.expected * 9) * 100) + '%';
    const ls = document.getElementById('livestats');
    if (ls) {
      const outs = Object.keys(S.stockouts);
      const sat = S.satN ? S.satSum / S.satN : 0;
      ls.innerHTML = `<div class="minikpis"><div><small>Ciro</small><b>${KE.tl(S.revenue)}</b></div><div><small>Bahşiş</small><b>${KE.tl(S.tips)}</b></div><div><small>Servis</small><b>${S.served}</b></div><div><small>Kaçan</small><b class="${S.lost ? 'neg' : ''}">${S.lost}</b></div></div>
        <div class="statl"><span>Memnuniyet</span>${bar(sat, sat < 60 ? 'crit' : sat < 72 ? 'warn' : 'ok')}<b>${S.satN ? Math.round(sat) : '–'}</b></div>
        ${outs.length ? `<div class="alert crit sm">${IC('bolt')}<span>Biten: ${outs.map(pn).join(', ')}</span></div>` : ''}`;
    }
    const dl = document.getElementById('dailylive');
    if (dl && (force || tickN % 3 === 0)) {
      const html = dailyHtml(true);
      const doneNow = (html.match(/dg done/g) || []).length;
      if (UI.dailyDone != null && doneNow > UI.dailyDone) { UI.toast('Günün hedefi tamam!', 'gold'); }
      UI.dailyDone = doneNow;
      dl.innerHTML = html;
    }
    const bl = document.getElementById('branchlive');
    if (bl) bl.innerHTML = G.branches.map((x) => { const l = G.live[x.id]; const s2 = l.stats; return `<button class="blrow ${x.id === b.id ? 'on' : ''}" data-a="viewBranch" data-id="${x.id}"><b>${esc(x.name)}</b><span>${l.closed ? 'Kapalı' : l.done ? 'Kapandı' : `${l.queue.length} sırada`}</span><span>${KE.tl(s2.revenue)}</span><span>${s2.satN ? '%' + Math.round(s2.satSum / s2.satN) : '–'}</span></button>`; }).join('');
    if (force || tickN % 3 === 0) {
      const cr = document.getElementById('crew');
      if (cr && !(UI.crewHover && Date.now() - UI.crewHover < 1500)) cr.innerHTML = crewPanel(b, true);
    }
    const tb = document.getElementById('tezgahBtn');
    if (tb) tb.querySelector('span').textContent = L.player.active ? 'Tezgâhtan çık' : 'Tezgâha geç';
  };
  function banner(text) {
    const st = document.getElementById('stage');
    if (!st) return;
    const d = document.createElement('div');
    d.className = 'st-banner'; d.textContent = text; KE.SND.play('banner');
    st.appendChild(d);
    setTimeout(() => d.remove(), 3200);
  }
  UI.confetti = function () {
    const box = document.createElement('div');
    box.className = 'confetti';
    const cols = ['#ffc93c', '#d7263d', '#23a26d', '#2f6fb5', '#f28c28'];
    for (let i = 0; i < 46; i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + '%'; p.style.background = cols[i % 5]; p.style.animationDelay = Math.random() * 0.4 + 's'; p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px'); box.appendChild(p); }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2400);
  };
  function renderTezgah() {
    const box = document.getElementById('tezgah');
    if (!box || !G.live) return;
    const L = G.live[G.activeBranch];
    if (!L) return;
    const P = L.player;
    if (!P.active) { box.innerHTML = ''; return; }
    const t = P.tid != null ? L.tickets.find((x) => x.id === P.tid) : null;
    if (!t) { box.innerHTML = `<div class="tezgah idle">${IC('chef')}<b>Tezgâhtasın.</b><span class="muted">Mutfağa sipariş düşünce burada belirecek.</span></div>`; return; }
    const p = prod(t.pid);
    box.innerHTML = `<div class="tezgah"><div class="tz-dish">${KE.ART.dish(p.id)}</div><div class="tz-b"><div class="row between"><div><span class="kicker">${t.paket ? 'Paket sipariş' : 'Masa siparişi'}</span><h3>${p.name}${t.count > 1 ? ' ×' + t.count : ''}</h3></div><span class="chip ${P.errors ? 'rd' : 'gr'}">Hata ${P.errors}</span></div>
      <ol class="tz-steps">${p.steps.map((s, i) => `<li class="${i < P.step ? 'done' : i === P.step ? 'now' : ''}">${i < P.step ? s : i + 1}</li>`).join('')}</ol>
      <div class="tz-opts" id="stepbtns">${P.opts.map((o) => { const used = p.steps.indexOf(o) > -1 && p.steps.indexOf(o) < P.step; return `<button class="btn sm ${used ? 'ghost' : 'blue'}" data-a="step" data-l="${esc(o)}" ${used ? 'disabled' : ''}>${esc(o)}</button>`; }).join('')}</div></div></div>`;
  }

  /* ---------- Kapanış ---------- */
  function showClosing() {
    const S0 = G.lastSummary;
    const rule = UI.todayRule || G.tipRule;
    const tab = UI.closeTab && S0.branches[UI.closeTab] ? UI.closeTab : G.activeBranch;
    const b = G.branches.find((x) => x.id === tab);
    const sum = S0.branches[b.id], S = sum.stats;
    const prods = Object.entries(S.byProduct).sort((a, c) => c[1] - a[1]);
    const maxP = Math.max(1, ...prods.map((x) => x[1]));
    const tot = G.branches.reduce((a, x) => a + S0.branches[x.id].stats.revenue, 0);
    const tips = G.branches.reduce((a, x) => a + S0.branches[x.id].stats.tips, 0);
    const preview = KE.tipShares(G, b, rule, S.tips);
    const html = `<div class="mhead split"><div><span class="kicker">${KE.dateStr(G.day)} · ${KE.weekday(G.day)}</span><h2>Gün sonu raporu</h2></div>${npc('zeynep', sum.sat > 75 ? 'Güzel bir gün, patron. Rakamlar yüz güldürüyor.' : 'Rakamlara birlikte bakalım; düzeltecek şeyler var.')}</div>
      ${G.branches.length > 1 ? `<div class="kpis"><div class="kpi">${IC('coin')}<small>Bütün şubeler ciro</small><b>${KE.tl(tot)}</b></div><div class="kpi">${IC('gift')}<small>Bütün şubeler bahşiş</small><b>${KE.tl(tips)}</b></div></div>
        <div class="tabs">${G.branches.map((x) => `<button class="tab ${x.id === tab ? 'on' : ''}" data-a="closeTab" data-id="${x.id}">${esc(x.name)}</button>`).join('')}</div>` : ''}
      <div class="kpis">
        <div class="kpi">${IC('coin')}<small>Ciro</small><b>${KE.tl(S.revenue)}</b></div>
        <div class="kpi">${IC('users')}<small>Müşteri</small><b>${S.served}</b></div>
        <div class="kpi">${IC('heart')}<small>Memnuniyet</small><b>%${Math.round(sum.sat)}</b></div>
        <div class="kpi">${IC('gift')}<small>Bahşiş</small><b>${KE.tl(S.tips)}</b></div>
      </div>
      ${advice(b, S).map((a) => `<div class="alert ${a[0]}">${IC(a[0] === 'ok' ? 'check' : 'bolt')}<span>${a[1]}</span></div>`).join('')}
      <div><h4>Satılan ürünler</h4><div class="prodbars">${prods.map(([pid, n]) => `<div class="pbar">${KE.ART.dish(pid)}<span>${pn(pid)}</span>${bar(n / maxP * 100, 'or')}<b>${n}</b></div>`).join('') || '<p class="muted">Satış yok</p>'}</div></div>
      <section class="tipbox"><h3>${IC('gift')}Bahşiş dağıtımı <small class="muted">Bütün şubelerde uygulanır</small></h3>
        <div class="seg wide">${Object.entries(KE.TIP_RULES).map(([k, r]) => `<button class="${rule === k ? 'on' : ''}" data-a="tipToday" data-r="${k}"><span>${r.name}${k === G.tipRule ? ' (varsayılan)' : ''}</span></button>`).join('')}</div>
        <p class="small">${KE.TIP_RULES[rule].desc}${rule !== G.tipRule ? ` <b>Yalnızca bugün için.</b> <button class="btn xs ghost" data-a="tipRule" data-r="${rule}">Hep böyle yap</button>` : ''}</p>
        <div class="shares">${preview.map(([s, v]) => `<div class="share"><span class="avatar sm">${KE.portrait(KE.staffLook(s), { mood: KE.moodFromValue(s.morale) })}</span><span><b>${esc(s.name)}</b><small>${roleName(s)} · ${Math.round(s.servedToday)} iş</small></span><b class="num">${KE.tl(v)}</b></div>`).join('')}</div></section>
      <div class="acts"><button class="btn big green" data-a="finalize">${IC('check')}Bahşişi dağıt ve günü kapat</button></div>`;
    document.querySelectorAll('.modal-bg').forEach((m) => m.remove());
    UI.modal(html, { wide: true });
  }

  /* Kapanışta yalnızca harekete geçirilebilir öneriler */
  function advice(b, S) {
    const out = [];
    const st = KE.branchStaff(G, b);
    const lost = [[S.lostWait, 'beklemekten sıkılıp gitti', 'Kasaya ikinci bir kişi ver ya da yoğun saatte molaları kaldır.'],
      [S.lostFood, 'yemeğini beklerken kalktı', 'Mutfak yetişmiyor: bir usta ya da çırak al, ocak sayısını artır.'],
      [S.lostFull, 'yer bulamadı', 'Kuyruk ya da masa yetmiyor: Mobilya ve Dekor\'dan salonu büyüt.'],
      [S.lostPrice, 'fiyatı görünce döndü', 'Bazı ürünler piyasanın çok üstünde; fiyatı biraz indir.'],
      [S.lostStock, 'istediğini bulamadı', 'Stok bitti: Hal\'de sabah siparişini "Bol" yap.']].sort((a, c) => c[0] - a[0]);
    if (lost[0][0] >= 3) out.push(['crit', `<b>${lost[0][0]} müşteri ${lost[0][1]}.</b> ${lost[0][2]}`]);
    if (S.cold >= 3) out.push(['warn', `<b>${S.cold} tabak tezgâhta soğudu.</b> Servise bir komi/garson daha ver.`]);
    const tired = st.filter((s) => s.minEnergy < 15);
    if (tired.length) out.push(['warn', `<b>${tired.map((s) => esc(s.name)).join(', ')} bitkin düştü.</b> Sakin saatlerde molaya gönder.`]);
    if (!out.length) out.push(['ok', 'Bugün işler tıkırındaydı. Kimse eli boş dönmedi.']);
    return out.slice(0, 2);
  }

  function afterDay(out) {
    UI.todayRule = null; UI.closeTab = null;
    const ups = out.levelUps.map((u) => `<li>${KE.ART.dish(u.pid)}<span><b>${esc(u.name)}</b> ${pn(u.pid)} yapımında ${stars(u.star)}${u.mentor ? ` <small>(${esc(u.mentor)} sayesinde)</small>` : ''}</span></li>`).join('');
    const quits = out.quits.map((q) => `<li class="neg">${IC('bolt')}<span><b>${esc(q.name)}</b> (${esc(q.branch)}) istifa etti.</span></li>`).join('');
    const goals = (out.goals || []).map((g) => `<li class="pos">${IC('star')}<span>Hedef tamamlandı: <b>${g.name}</b> · ödül ${KE.tl(g.reward)}</span></li>`).join('');
    const farm = out.farm && out.farm.done.length ? `<li>${IC('truck')}<span>Çiftlikten kesimhaneye: ${out.farm.done.map((d) => `${d.heads} ${KE.FARM[d.kind].unit} ${KE.FARM[d.kind].name.toLowerCase()} → ${Object.entries(d.got).map(([k, v]) => KE.num(v, 0) + ' kg ' + KE.MODES[G.mode].ingredients[k].name.toLowerCase()).join(', ')}`).join('; ')}</span></li>` : '';
    const tot = Object.values(out.branches).reduce((a, e) => a + e.net, 0);
    const staff = G.staff.slice(0, 12);
    const regs = {};
    (out.regulars || []).forEach((x) => { regs[x.id] = (regs[x.id] || 0) + x.gain; });
    const regHtml = Object.entries(regs).map(([id, g]) => { const R = KE.REGULARS.find((x) => x.id === id); const r = G.regulars[id]; return `<li class="${g < 0 ? 'neg' : ''}"><span class="avatar sm">${KE.portrait(R.look || KE.CAST[R.cast].look, { mood: g < 0 ? 'sad' : 'happy' })}</span><span><b>${R.name}</b> uğradı. ${g > 0 ? 'Çok memnun kaldı' : g < 0 ? 'Kırıldı' : 'İdare etti'} · ${hearts(r.loyalty)}${r.praised === G.day - 1 ? ' <b>Mahallede dükkânı övüyor!</b>' : ''}</span></li>`; }).join('');
    const html = `<div class="mhead"><span class="kicker">${KE.dateStr(G.day - 1)}</span><h2>Günlük</h2></div>
      <div class="journal">${esc(out.journal)}</div>
      <div class="kpis"><div class="kpi">${IC('chart')}<small>Günlük net (tahmini)</small><b class="${tot >= 0 ? 'pos' : 'neg'}">${KE.tl(tot)}</b></div><div class="kpi">${IC('star')}<small>İtibar</small><b>${Math.round(G.reputation)}</b></div><div class="kpi">${IC('coin')}<small>Kasa</small><b>${KE.tl(G.cash)}</b></div></div>
      <h4>Ekibin morali</h4><div class="moodrow">${staff.map((s) => `<div class="mood">${avatar(KE.staffLook(s), KE.moodFromValue(s.morale), s.name)}<small>${esc(s.name.replace(' Usta', ''))}</small><b class="${(s.moraleDelta || 0) >= 0 ? 'pos' : 'neg'}">${(s.moraleDelta || 0) >= 0 ? '+' : ''}${KE.num(s.moraleDelta || 0, 1)}</b><em>${KE.tl(s.tipsToday || 0)}</em></div>`).join('')}</div>
      ${(out.daily || []).length ? `<h4>Günün hedefleri</h4><div class="daily">${out.daily.map((g) => `<div class="dg ${g.state}"><i>${IC(g.state === 'done' ? 'check' : 'bolt')}</i><span><b>${g.text}</b></span><em>${g.state === 'done' ? '+' + KE.tl(g.reward) : 'Olmadı'}</em></div>`).join('')}</div>` : ''}
      ${ups || quits || goals || farm || regHtml ? `<ul class="events">${goals}${regHtml}${farm}${ups}${quits}</ul>` : ''}
      <div class="acts"><button class="btn big green" data-a="closeAfterDay">${IC('play')}Yeni güne başla</button></div>`;
    UI.modal(html, { wide: true });
    (out.unlocks || []).forEach((p) => queueModal(() => { UI.modal(`<div class="unlock"><span class="kicker">İtibar ${p.unlock} · Yeni tarif</span><div class="ul-dish">${KE.ART.dish(p.id)}</div><h2>${p.name} menüde!</h2><p class="lead">Bütün şubelerin menüsüne eklendi. Onu seven müşteriler kapıda.</p><div class="acts center"><button class="btn big green" data-a="closeModal">${IC('check')}Harika</button></div></div>`); UI.confetti(); KE.SND.play('goal'); }));
    if (out.champions) queueModal(() => { UI.modal(`<div class="mhead"><span class="kicker">Ay sonu</span><h2>Semt şampiyonluğu</h2><p class="muted">Ayın memnuniyet ortalaması "Lüks Kebap"ın semtteki çıtasını geçen şube şampiyon olur: bir ay boyunca müşteri +%6, itibar +2.</p></div>
      <div class="champs">${out.champions.map((c) => `<div class="champ ${c.won ? 'won' : ''}"><span class="cup">${IC(c.won ? 'crown' : 'bolt')}</span><span><b>${esc(c.name)}</b><small>${c.district} · memnuniyet %${Math.round(c.sat)} / çıta %${c.bar}</small></span><em>${c.won ? 'Şampiyon!' : c.served < 250 ? 'Yetersiz müşteri' : 'Lüks Kebap kazandı'}</em></div>`).join('')}</div>
      <div class="acts"><button class="btn big green" data-a="closeModal">Tamam</button></div>`); if (out.champions.some((c) => c.won)) { UI.confetti(); KE.SND.play('goal'); } });
    if (out.month) queueModal(() => UI.modal(monthReportHtml(out.month) + `<div class="acts"><button class="btn big green" data-a="closeModal">Tamam</button></div>`, { wide: true }));
    if (out.news) queueModal(() => UI.modal(newsHtml(out.news) + `<div class="acts"><button class="btn big green" data-a="closeModal">Gazeteyi katla</button></div>`, { wide: true }));
  }

  function hearts(n) { let h = '<span class="hearts" aria-label="Gönül ' + n + '/10">'; for (let i = 0; i < 5; i++) h += `<i style="--f:${Math.max(0, Math.min(1, n / 2 - i)) * 100}%">♥</i>`; return h + '</span>'; }
  function newsHtml(n) {
    return `<div class="paper"><div class="mast">Mahalle Postası</div><div class="mastline"><span>Sayı ${n.issue}</span><span>${n.date}</span><span>15 ₺</span></div>
      <div class="cols2">${n.headlines.map((h, i) => `<article class="${i === 0 ? 'lead' : ''}"><h4>${esc(h.title)}</h4><p>${esc(h.body)}</p></article>`).join('')}</div></div>`;
  }
  function monthReportHtml(m) {
    const line = (l, v, cls) => `<tr class="${cls || ''}"><td>${l}</td><td class="r">${KE.tl(v)}</td></tr>`;
    const parts = [{ l: 'Malzeme', v: m.purchases, c: '#f28c28' }, { l: 'Personel', v: m.personnel, c: '#7a1f3d' }, { l: 'Kira', v: m.rent, c: '#2f6fb5' }, { l: 'KDV', v: m.kdv, c: '#8e7cc3' }, { l: 'Fatura', v: m.util, c: '#23a26d' }, { l: 'Diğer', v: m.accountant + m.loan + (m.ads || 0) + (m.fines || 0) + Math.max(0, m.other || 0) + (m.farm || 0) + (m.farmFixed || 0), c: '#9a8b7a' }];
    return `<div class="mhead"><span class="kicker">Aylık kapanış</span><h2>${m.name} bilançosu</h2></div>
      <div class="kpis"><div class="kpi">${IC('coin')}<small>Ciro (KDV dahil)</small><b>${KE.tl(m.revenue)}</b></div><div class="kpi">${IC('users')}<small>Müşteri</small><b>${KE.num(m.customers)}</b></div><div class="kpi">${IC('chef')}<small>Personel maliyeti</small><b>${KE.tl(m.personnel)}</b></div><div class="kpi">${IC('chart')}<small>Aylık net</small><b class="${m.net >= 0 ? 'pos' : 'neg'}">${KE.tl(m.net)}</b></div></div>
      <div class="cols2"><div class="tablewrap"><table class="fin"><tbody>
        ${line('Brüt ciro (KDV dahil)', m.revenue)}${line('− Hesaplanan KDV (%10)', -m.kdvOut)}${line('+ İndirilecek KDV (gıda alımları, %1)', m.kdvIn)}${line('= Ödenecek KDV', -m.kdv, 'sub')}
        ${line('− Malzeme ve sarf', -m.purchases)}${line('− Personel (bordro toplam maliyeti)', -m.personnel)}${line('− Kira (ev sahibine net)', -m.rentNet)}${line('− Kira stopajı (%20)', -m.stopaj)}
        ${line('− Elektrik, su, doğalgaz, internet', -m.util)}${line('− Muhasebeci', -m.accountant)}${m.loan ? line('− Kredi taksitleri', -m.loan) : ''}${m.ads ? line('− Reklam', -m.ads) : ''}${m.fines ? line('− İdari para cezaları', -m.fines) : ''}${m.farm ? line('− Çiftlik: hayvan ve yem', -m.farm) : ''}${m.farmFixed ? line('− Çiftlik işletme gideri', -m.farmFixed) : ''}${m.other ? line('− Diğer giderler / gelirler', -m.other) : ''}
        ${line('= Aylık net sonuç', m.net, 'total')}${m.capex ? line('Yatırım harcamaları (ekipman, dekor, şube)', m.capex, 'muted') : ''}${line('Dağıtılan bahşiş', m.tips, 'muted')}
      </tbody></table></div><div class="stack">${donut(parts, 'Giderler')}
        <h4>Şube bazında</h4>${m.branches.map((b) => `<div class="kpi">${IC('store')}<small>${esc(b.name)}</small><b class="${b.result >= 0 ? 'pos' : 'neg'}">${KE.tl(b.result)}</b><em class="tiny">Ciro ${KE.tl(b.revenue)} · personel ${KE.tl(b.staffCost)} · kira ${KE.tl(b.rent)}</em></div>`).join('')}
        ${m.bonus ? `<div class="chip gd">${m.bonus} ikramiyesi ödendi</div>` : ''}</div></div>
      <h4>Bordro</h4>${payrollTable(m.payroll)}`;
  }
  function payrollTable(rows) {
    const tot = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
    const cols = [['base', 'Temel brüt'], ['fm', 'Fazla mesai'], ['brut', 'Toplam brüt'], ['sgkI', 'SGK işçi %14'], ['issI', 'İşsizlik işçi %1'], ['gv', 'Gelir vergisi'], ['damga', 'Damga'], ['net', 'Net ele geçen'], ['sgkV', 'SGK işveren'], ['issV', 'İşsizlik işveren %2'], ['yol', 'Yol'], ['ikramiye', 'İkramiye'], ['total', 'Toplam maliyet'], ['tips', 'Bahşiş (ay)']];
    return `<div class="tablewrap"><table class="fin wide"><thead><tr><th>Çalışan</th><th>Rol</th>${cols.map((c) => `<th class="r">${c[1]}</th>`).join('')}</tr></thead><tbody>
      ${rows.map((r) => `<tr><td><b>${esc(r.name)}</b></td><td>${r.role === 'usta' ? 'Usta' : r.role === 'garson' ? 'Garson / Komi' : KE.ROLES[r.role].name}</td>${cols.map((c) => `<td class="r ${c[0] === 'net' || c[0] === 'total' ? 'em' : ''}">${KE.tl(r[c[0]] || 0)}</td>`).join('')}</tr>`).join('')}
      <tr class="total"><td>Toplam</td><td></td>${cols.map((c) => `<td class="r">${KE.tl(tot(c[0]))}</td>`).join('')}</tr></tbody></table></div>
      <p class="tiny muted">Fazla mesai haftada yaklaşık 10 saat, %50 zamlı varsayılır. Gelir vergisi kümülatif matraha göre dilimli hesaplanır; asgari ücrete isabet eden gelir ve damga vergisi istisna edilir. SGK işveren payında 5 puanlık hazine teşviki primler zamanında ödendiğinde düşülür. Oranlar 2026 için tahmini, ayar tablosundan güncellenebilir.</p>`;
  }

  /* ---------- Olay kartı ---------- */
  function showEvent() {
    const e = G.pendingEvent;
    if (!e) return;
    let look, name;
    if (e.whoStaff) { const s = G.staff.find((x) => x.id === e.whoStaff); if (s) { look = KE.staffLook(s); name = s.name; } }
    if (!look && e.who && KE.CAST[e.who]) { look = KE.CAST[e.who].look; name = KE.CAST[e.who].name; }
    if (!look) { look = KE.CAST.ayse.look; name = 'Ayşe Teyze'; }
    UI.modal(`<div class="evcard"><div class="ev-fig">${KE.figure(look, { mood: 'neutral', label: name })}</div><div class="stack"><span class="kicker">Olay · ${esc(name)}</span><h2>${esc(e.title)}</h2><p class="lead">${esc(e.text)}</p>
      <div class="choices">${e.choices.map((c, i) => `<button class="choice c${i}" data-a="eventChoice" data-i="${i}"><b>${esc(c.label)}</b><small>${esc(c.desc)}</small></button>`).join('')}</div></div></div>`, { cls: 'event' });
  }

  /* ---------- Muhasebe ---------- */
  SCREENS.office = () => {
    const tab = params.tab || 'ozet';
    const tabs = [['ozet', 'Özet'], ['gunluk', 'Günlük'], ['haftalik', 'Haftalık'], ['aylik', 'Aylık'], ['bordro', 'Bordro']];
    return `<main class="screen">${head('Muhasebe Ofisi', 'Günlük, haftalık ve aylık rakamlar; bordro ve vergiler', null, 'zeynep')}
      <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-a="go" data-s="office" data-tab="${k}">${l}</button>`).join('')}</div>
      <section class="panel tabbody">${OFFICE[tab]()}</section></main>`;
  };
  const OFFICE = {};
  function monthToDate() {
    const key = KE.monthKey(G.day);
    const days = G.ledger.days.filter((d) => d.month === key);
    const monthNo = KE.dateOf(G.day).getUTCMonth() + 1;
    const pay = G.staff.map((s) => KE.payroll(G, s, monthNo, { bonus: !!KE.bonusMonths[key] }));
    return { key, days, pay, rev: days.reduce((a, d) => a + d.revenue, 0), pur: days.reduce((a, d) => a + d.purchases, 0), tips: days.reduce((a, d) => a + d.tips, 0) };
  }
  OFFICE.ozet = () => {
    const byDay = {};
    G.ledger.days.forEach((d) => { byDay[d.day] = byDay[d.day] || { rev: 0, net: 0, pur: 0 }; byDay[d.day].rev += d.revenue; byDay[d.day].net += d.net; byDay[d.day].pur += d.purchases; });
    const keys = Object.keys(byDay).map(Number).sort((a, b) => a - b).slice(-30);
    const mtd = monthToDate();
    const personnel = mtd.pay.reduce((a, p) => a + p.total, 0);
    const rent = G.branches.reduce((a, b) => a + b.rent, 0);
    const util = G.branches.reduce((a, b) => a + KE.utilities(G, b), 0);
    const monthEnd = G.day + [...Array(32).keys()].find((i) => KE.isMonthEnd(G.day + i));
    return `<div class="kpis">
        <div class="kpi">${IC('coin')}<small>Kasa</small><b>${KE.tl(G.cash)}</b></div>
        <div class="kpi">${IC('chart')}<small>${KE.monthName(mtd.key)} cirosu</small><b>${KE.tl(mtd.rev)}</b></div>
        <div class="kpi">${IC('cart')}<small>Ay içi malzeme</small><b>${KE.tl(mtd.pur)}</b></div>
        <div class="kpi">${IC('users')}<small>Aylık bordro (tahmini)</small><b>${KE.tl(personnel)}</b></div>
        <div class="kpi">${IC('store')}<small>Kira ve fatura</small><b>${KE.tl(rent + util)}</b></div>
        ${G.loans.length ? `<div class="kpi">${IC('lock')}<small>Kredi borcu</small><b>${KE.tl(G.loans.reduce((a, l) => a + l.monthly * l.remaining, 0))}</b></div>` : ''}
      </div>
      ${keys.length ? `<h3>Son ${keys.length} gün</h3>` : ''}
      ${keys.length ? lineChart([{ name: 'Ciro', color: '#f28c28', values: keys.map((k) => byDay[k].rev), area: true }, { name: 'Malzeme', color: '#2f6fb5', values: keys.map((k) => byDay[k].pur) }, { name: 'Günlük net', color: '#23a26d', values: keys.map((k) => byDay[k].net) }], keys.map((k) => { const d = KE.dateOf(k); return d.getUTCDate() + '/' + (d.getUTCMonth() + 1); }), { label: 'Günlük ciro ve net' }) : '<p class="muted">İlk günü bitirince grafikler burada görünecek.</p>'}
      <p class="small muted">Ay sonu (${KE.dateStr(monthEnd)}) kapanışında bordro, kira, stopaj, faturalar, KDV, çiftlik gideri ve kredi taksitleri kasadan düşer.</p>`;
  };
  OFFICE.gunluk = () => {
    const days = G.ledger.days.slice().reverse().slice(0, 40);
    const sel = params.day ? G.ledger.days.filter((d) => d.day === +params.day) : null;
    let detail = '';
    if (sel && sel.length) {
      const d = sel.find((x) => x.branchId === (params.b || sel[0].branchId)) || sel[0];
      const prods = Object.entries(d.byProduct).sort((a, c) => c[1] - a[1]);
      detail = `<div class="subpanel"><h3>${d.date} · ${esc((G.branches.find((b) => b.id === d.branchId) || {}).name || '')}</h3>
        <div class="cols2"><div>${barChart(d.hourly.slice(0, 13), d.hourly.slice(0, 13).map((_, i) => String(KE.OPEN_HOUR + i)), { money: true, h: 150, label: 'Saatlik ciro' })}</div>
        <table class="fin"><tbody>
          <tr><td>Ciro (kart / nakit)</td><td class="r">${KE.tl(d.card)} / ${KE.tl(d.cash)}</td></tr><tr><td>Paket servis</td><td class="r">${d.paket} sipariş · ${KE.tl(d.paketRev)}</td></tr>
          <tr><td>Malzeme (sarf dahil)</td><td class="r">${KE.tl(d.purchases)}</td></tr><tr><td>Ambalaj ve sarf</td><td class="r">${KE.tl(d.sarf || 0)}</td></tr><tr><td>Fire</td><td class="r">${KE.tl(d.waste)}</td></tr>
          <tr><td>Günlük sabit gider payı</td><td class="r">${KE.tl(d.fixed)}</td></tr><tr><td>Bahşiş (${KE.TIP_RULES[d.tipRule].name})</td><td class="r">${KE.tl(d.tips)}</td></tr>${d.farmKg ? `<tr><td>Çiftlikten gelen et</td><td class="r">${KE.num(d.farmKg, 0)} kg</td></tr>` : ''}
          <tr class="total"><td>Günlük net</td><td class="r">${KE.tl(d.net)}</td></tr></tbody></table></div>
        <div class="chips">${prods.map(([pid, n]) => `<span class="chip or">${pn(pid)}: ${n}</span>`).join('')}</div></div>`;
    }
    return `${detail}<div class="tablewrap"><table class="fin"><thead><tr><th>Tarih</th><th>Şube</th><th class="r">Müşteri</th><th class="r">Kaçan</th><th class="r">Ciro</th><th class="r">Malzeme</th><th class="r">Bahşiş</th><th class="r">Memnuniyet</th><th class="r">Net</th></tr></thead><tbody>
      ${days.map((d) => `<tr class="click" data-a="go" data-s="office" data-tab="gunluk" data-day="${d.day}" data-b="${d.branchId}"><td>${d.date}</td><td>${esc((G.branches.find((b) => b.id === d.branchId) || {}).name || '')}</td><td class="r">${d.served}</td><td class="r">${d.lost}</td><td class="r">${KE.tl(d.revenue)}</td><td class="r">${KE.tl(d.purchases)}</td><td class="r">${KE.tl(d.tips)}</td><td class="r">%${Math.round(d.sat)}</td><td class="r ${d.net >= 0 ? 'pos' : 'neg'}">${KE.tl(d.net)}</td></tr>`).join('') || '<tr><td colspan="9" class="muted">Henüz kayıt yok.</td></tr>'}
    </tbody></table></div><p class="small muted">Bir satıra tıklayınca o günün dökümü açılır.</p>`;
  };
  OFFICE.haftalik = () => {
    const weeks = {};
    G.ledger.days.forEach((d) => {
      const w = Math.floor((d.day - 1) / 7) + 1;
      const W = weeks[w] = weeks[w] || { w, start: (w - 1) * 7 + 1, rev: 0, pur: 0, tips: 0, served: 0, lost: 0, satS: 0, satN: 0, net: 0, prods: {} };
      W.rev += d.revenue; W.pur += d.purchases; W.tips += d.tips; W.served += d.served; W.lost += d.lost; W.satS += d.sat * d.served; W.satN += d.served; W.net += d.net;
      Object.entries(d.byProduct).forEach(([p, n]) => { W.prods[p] = (W.prods[p] || 0) + n; });
    });
    const list = Object.values(weeks).sort((a, b) => b.w - a.w);
    const asc = list.slice().reverse();
    return `${asc.length > 1 ? lineChart([{ name: 'Haftalık ciro', color: '#f28c28', values: asc.map((w) => w.rev), area: true }, { name: 'Haftalık net', color: '#23a26d', values: asc.map((w) => w.net) }], asc.map((w) => w.w + '. hf'), { label: 'Haftalık ciro' }) : ''}
      <div class="tablewrap"><table class="fin"><thead><tr><th>Hafta</th><th>Başlangıç</th><th class="r">Müşteri</th><th class="r">Kaçan</th><th class="r">Ciro</th><th class="r">Malzeme</th><th class="r">Bahşiş</th><th class="r">Memnuniyet</th><th>En çok satan</th><th class="r">Net</th></tr></thead><tbody>
      ${list.map((w) => { const top = Object.entries(w.prods).sort((a, b) => b[1] - a[1])[0]; return `<tr><td>${w.w}. hafta</td><td>${KE.dateStr(w.start)}</td><td class="r">${w.served}</td><td class="r">${w.lost}</td><td class="r">${KE.tl(w.rev)}</td><td class="r">${KE.tl(w.pur)}</td><td class="r">${KE.tl(w.tips)}</td><td class="r">%${w.satN ? Math.round(w.satS / w.satN) : 0}</td><td>${top ? pn(top[0]) : '–'}</td><td class="r ${w.net >= 0 ? 'pos' : 'neg'}">${KE.tl(w.net)}</td></tr>`; }).join('') || '<tr><td colspan="10" class="muted">Henüz kayıt yok.</td></tr>'}
      </tbody></table></div>`;
  };
  OFFICE.aylik = () => {
    const ms = G.ledger.months;
    if (params.m != null && ms[+params.m]) return `<button class="btn sm ghost" data-a="go" data-s="office" data-tab="aylik">${IC('arrow')}Bütün aylar</button>` + monthReportHtml(ms[+params.m]);
    const mtd = monthToDate();
    const personnel = mtd.pay.reduce((a, p) => a + p.total, 0);
    const rent = G.branches.reduce((a, b) => a + b.rent, 0), util = G.branches.reduce((a, b) => a + KE.utilities(G, b), 0);
    const kdv = Math.max(0, mtd.rev * 0.1 / 1.1 - mtd.pur * 0.01 / 1.01);
    return `<div class="subpanel"><h3>${KE.monthName(mtd.key)} (devam ediyor, tahmini)</h3>
      <div class="kpis"><div class="kpi">${IC('coin')}<small>Ciro (şimdiye kadar)</small><b>${KE.tl(mtd.rev)}</b></div><div class="kpi">${IC('cart')}<small>Malzeme</small><b>${KE.tl(mtd.pur)}</b></div><div class="kpi">${IC('chart')}<small>KDV (tahmini)</small><b>${KE.tl(kdv)}</b></div><div class="kpi">${IC('users')}<small>Ay sonu sabit gider</small><b>${KE.tl(personnel + rent + util + KE.ECON.muhasebeci + (G.farm ? KE.FARM_MONTHLY * G.priceIndex : 0))}</b></div></div></div>
      <div class="tablewrap"><table class="fin"><thead><tr><th>Ay</th><th class="r">Ciro</th><th class="r">KDV</th><th class="r">Malzeme</th><th class="r">Personel</th><th class="r">Kira</th><th class="r">Fatura</th><th class="r">Net</th></tr></thead><tbody>
      ${ms.map((m, i) => `<tr class="click" data-a="go" data-s="office" data-tab="aylik" data-m="${i}"><td><b>${m.name}</b></td><td class="r">${KE.tl(m.revenue)}</td><td class="r">${KE.tl(m.kdv)}</td><td class="r">${KE.tl(m.purchases)}</td><td class="r">${KE.tl(m.personnel)}</td><td class="r">${KE.tl(m.rent)}</td><td class="r">${KE.tl(m.util)}</td><td class="r ${m.net >= 0 ? 'pos' : 'neg'}">${KE.tl(m.net)}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">İlk ay sonu kapanışından sonra raporlar burada listelenir.</td></tr>'}
      </tbody></table></div>`;
  };
  OFFICE.bordro = () => {
    const mtd = monthToDate();
    return `<div class="sechead"><h3>${KE.monthName(mtd.key)} bordrosu (önizleme)</h3><div class="chips"><span class="chip">Asgari ücret (brüt) ${KE.tl(KE.ECON.asgariBrut)}</span>${KE.bonusMonths[mtd.key] ? `<span class="chip gd">Bu ay ${KE.bonusMonths[mtd.key]} ikramiyesi var</span>` : ''}${G.payLate ? '<span class="chip rd">Kasa eksi: SGK teşviki kaybedildi</span>' : '<span class="chip gr">5 puanlık SGK teşviki uygulanıyor</span>'}</div></div>${payrollTable(mtd.pay)}`;
  };
  /* ---------- Hal ---------- */
  SCREENS.hal = () => {
    const b = B(); const M = MODE();
    const mods = G.mods.filter((m) => m.key.startsWith('ing'));
    return `<main class="screen">${head('Hal ve Kasap', esc(b.name) + ' için tedarik', null, 'riza')}
      <section class="panel"><div class="sechead"><h2>Tedarik kalitesi</h2></div><div class="grid g3">${KE.TIERS.map((t, i) => `<button class="optcard ${b.tier === i ? 'sel' : ''}" data-a="tier" data-i="${i}">${IC(i === 2 ? 'star' : i === 1 ? 'check' : 'coin')}<b>${t.name}</b><small>${t.desc}</small><span class="chips"><span class="chip">Fiyat ×${t.mul}</span><span class="chip ${t.quality > 0 ? 'gr' : t.quality < 0 ? 'rd' : ''}">Kalite ${t.quality >= 0 ? '+' : ''}${t.quality}</span></span></button>`).join('')}</div></section>
      <section class="panel"><div class="sechead"><h2>Otomatik sabah siparişi</h2><div class="seg">${[[0.85, 'Az'], [1.15, 'Normal'], [1.5, 'Bol']].map(([v, l]) => `<button class="${Math.abs(b.stockLevel - v) < 0.01 ? 'on' : ''}" data-a="stockLevel" data-v="${v}"><span>${l}</span></button>`).join('')}</div></div>
        <p class="small muted">Rıza her sabah stoğu son günlerin ortalama kullanımının bu katına tamamlar. Çiftliğin varsa et önce çiftlik deposundan gelir.</p>
        ${mods.length ? `<div class="chips">${mods.map((m) => `<span class="chip rd">${m.label} ×${m.mult} · ${m.days} gün</span>`).join('')}</div>` : ''}
        <div class="inggrid">${Object.entries(M.ingredients).map(([k, ing]) => { const u = b.usage[k] || 0; const step = ing.unit === 'kg' ? Math.max(1, Math.round(u * 0.25)) : Math.max(10, Math.round(u * 0.25 / 10) * 10); const days = u ? (b.stock[k] || 0) / u : 9; return `<div class="ing"><div class="ing-t"><b>${ing.name}</b><small>${KE.tl(KE.ingPrice(G, b, k))}/${ing.unit}</small></div>${bar(clamp(days / 1.5 * 100, 0, 100), days < 0.9 ? 'crit' : days < 1.05 ? 'warn' : 'ok')}<div class="row between"><small class="muted">${KE.num(b.stock[k] || 0, ing.unit === 'kg' ? 1 : 0)} / günlük ${KE.num(u, ing.unit === 'kg' ? 1 : 0)} ${ing.unit}</small><button class="btn xs ghost" data-a="buy" data-k="${k}" data-q="${step}">+${step} ${ing.unit}</button></div></div>`; }).join('')}</div></section>

    </main>`;
  };

  /* ---------- Usta pazarı ---------- */
  SCREENS.lonca = () => {
    const b = B();
    const mine = G.staff.filter(KE.isCook);
    const tab = params.tab || 'pazar';
    const actions = (s) => {
      let a = `<button class="btn xs ghost" data-a="raise" data-id="${s.id}">${IC('coin')}%10 zam</button>`;
      if (s.role === 'cirak') {
        a += `<button class="btn xs ghost" data-a="pickMentor" data-id="${s.id}">${IC('chef')}${s.mentorId ? 'Mentor: ' + esc(((G.staff.find((x) => x.id === s.mentorId) || {}).name || '').replace(' Usta', '')) : 'Mentor seç'}</button>`;
        if (Object.values(s.spec).some((v) => v >= 3)) a += `<button class="btn xs gold" data-a="promote" data-id="${s.id}">${IC('star')}Terfi</button>`;
      }
      if (G.branches.length > 1 && G.phase === 'morning') a += `<button class="btn xs ghost" data-a="pickTransfer" data-id="${s.id}">${IC('swap')}Şube</button>`;
      if (G.phase === 'morning') a += `<button class="btn xs red" data-a="fire" data-id="${s.id}">Çıkar</button>`;
      return a;
    };
    return `<main class="screen">${head('Usta Pazarı', 'Pazar her pazar akşamı yenilenir', null, 'lonca')}
      <div class="tabs"><button class="tab ${tab === 'pazar' ? 'on' : ''}" data-a="go" data-s="lonca" data-tab="pazar">Pazardaki ustalar</button><button class="tab ${tab === 'kadro' ? 'on' : ''}" data-a="go" data-s="lonca" data-tab="kadro">Kadrom (${mine.length})</button></div>
      <section class="panel tabbody">${tab === 'pazar'
        ? `<p class="small muted">İşe aldığın usta <b>${esc(b.name)}</b> şubesine başlar (şube şeridinden değiştirebilirsin). Ocak yeri: ${KE.equip(G, b, 'cook').stations}, şu an ${KE.branchStaff(G, b).filter(KE.isCook).length} pişirmeci.</p>
          <div class="grid g3">${G.market.map((s) => masterCard(s, { actions: `<button class="btn green" data-a="hireMaster" data-id="${s.id}" ${G.cash < (s.fee || 0) ? 'disabled' : ''}>İşe al${s.fee ? ' · ' + KE.tl(s.fee) : ''}</button>` })).join('') || '<p class="muted">Pazarda şu an kimse yok.</p>'}</div>`
        : `${morningOnly()}<div class="grid g3">${mine.map((s) => masterCard(s, { own: true, extra: `<p class="tiny muted">${esc(G.branches.find((x) => x.id === s.branchId).name)} · toplam ${s.servedTotal} porsiyon · bu ay bahşiş ${KE.tl(s.tipsMonth)}</p>`, actions: actions(s) })).join('')}</div>`}
      </section></main>`;
  };

  /* ---------- Eleman bürosu ---------- */
  function workerCard(s, own) {
    const tr = KE.TRAITS[s.trait];
    let acts;
    if (own) {
      acts = `<button class="btn xs ghost" data-a="raise" data-id="${s.id}">${IC('coin')}%10 zam</button>`;
      if (G.branches.length > 1 && G.phase === 'morning') acts += `<button class="btn xs ghost" data-a="pickTransfer" data-id="${s.id}">${IC('swap')}Şube</button>`;
      if (G.phase === 'morning') acts += `<button class="btn xs red" data-a="fire" data-id="${s.id}">Çıkar</button>`;
    } else acts = `<button class="btn green" data-a="hireWorker" data-id="${s.id}">İşe al</button>`;
    return `<article class="card person">
      <div class="pc-top"><div class="pc-fig">${KE.figure(KE.staffLook(s), { mood: KE.moodFromValue(s.morale), label: s.name })}</div>
        <div class="pc-id"><h3>${esc(s.name)}</h3><div class="chips"><span class="chip bl">${roleName(s)}</span>${tr ? `<span class="chip gd" title="${esc(tr.desc)}">${tr.name}</span>` : ''}</div>
        ${own ? `<small class="muted">${esc(G.branches.find((x) => x.id === s.branchId).name)} · moral ${Math.round(s.morale)}</small>` : ''}
        <div class="pc-stats">${statl('Hız', (s.speed - 0.6) / 0.8)}${statl('Güler yüz', s.friendly)}${s.role === 'mudur' ? statl('Yönetim', s.skill) : ''}</div></div></div>
      <div class="pc-foot"><div class="price"><b>${KE.tl(s.wage)}</b><small>brüt / ay</small></div><div class="row">${acts}</div></div></article>`;
  }
  SCREENS.buro = () => {
    const b = B();
    const mine = G.staff.filter((s) => !KE.isCook(s));
    return `<main class="screen">${head('Eleman Bürosu', 'Kasa, servis, temizlik, paket ve yönetim ekibi', null, 'buro')}
      <section class="panel"><div class="sechead"><h2>Adaylar</h2><span class="small muted">İşe aldığın kişi <b>${esc(b.name)}</b> şubesinde başlar. Liste her pazar yenilenir.</span></div>
        <div class="rolekey">${['kasiyer', 'garson', 'temizlik', 'kurye', 'mudur'].map((r) => `<span><b>${r === 'garson' ? (G.mode === 'doner' ? 'Komi' : 'Garson') : KE.ROLES[r].name}</b>${KE.ROLES[r].desc}</span>`).join('')}</div><div class="grid g3">${G.workers.map((s) => workerCard(s, false)).join('')}</div></section>
      <section class="panel"><div class="sechead"><h2>Kadro (ustalar hariç)</h2></div>${morningOnly()}<div class="grid g3">${mine.map((s) => workerCard(s, true)).join('') || '<p class="muted">Henüz kimse yok.</p>'}</div></section></main>`;
  };

  /* ---------- Terzi ---------- */
  SCREENS.terzi = () => `<main class="screen">${head('Terzi Nuri', 'Ekibine yakışanı giydir', null, 'terzi')}
    <div class="note">${IC('heart')}<span>Kostüm morali yükseltir. Yöresel kostüm, çalışanın memleketine göre dikilir ve uyumlu ürünlerde ek bahşiş getirir.</span></div>
    <div class="grid g2">${G.staff.map((s) => {
      const reg = KE.REGIONS[s.region] || KE.REGIONS['İstanbul'];
      return `<article class="card wardrobe"><div class="wr-id"><b>${esc(s.name)}</b><small>${roleName(s)} · ${esc(G.branches.find((x) => x.id === s.branchId).name)} · Memleket: ${s.region} (${reg.note})</small></div>
        <div class="wr-figs">${KE.COSTUMES.map((c) => `<button class="wr-opt ${s.costume === c.id ? 'sel' : ''}" data-a="costume" data-id="${s.id}" data-c="${c.id}" ${s.costume === c.id ? 'disabled' : ''} aria-label="${c.name}">${KE.figure(KE.staffLook(Object.assign({}, s, { costume: c.id })), { mood: s.costume === c.id ? 'happy' : 'neutral' })}<small>${c.name}${c.cost && s.costume !== c.id ? '<br><b>' + KE.tl(c.cost) + '</b>' : s.costume === c.id ? '<br><b>Giyiyor</b>' : ''}</small></button>`).join('')}</div></article>`;
    }).join('')}</div></main>`;

  /* ---------- Mobilya, ekipman, dekor ---------- */
  SCREENS.dekor = () => {
    const b = B(); const M = MODE();
    const amb = KE.ambience(G, b);
    const styles = {};
    b.decor.forEach((id) => { const d = KE.DECOR.find((x) => x.id === id); if (d.style !== 'personel') styles[d.style] = (styles[d.style] || 0) + 1; });
    const eqDesc = (k, lv) => k === 'cook' ? `${lv.stations} ocak yeri` : k === 'prep' ? `Hız ×${lv.speed}${lv.quality ? `, kalite +${lv.quality}` : ''}` : k === 'cold' ? `Günlük fire %${KE.num(lv.waste * 100, 1)}` : `${lv.tables} masa, kuyruk ${lv.queue}, sabır ×${lv.patience}`;
    const eqIc = { cook: 'fire', prep: 'chef', cold: 'leaf', service: 'table' };
    return `<main class="screen">${head('Mobilya ve Dekor', esc(b.name), null, 'dekor')}
      <section class="panel"><div class="sechead"><h2>Ekipman</h2></div><div class="grid g4">${Object.entries(M.equipment).map(([k, eq]) => {
        const lvl = b.equipment[k], cur = eq.levels[lvl], next = eq.levels[lvl + 1];
        return `<article class="card eq"><div class="row between"><span class="kicker">${IC(eqIc[k])}${eq.name}</span><span class="lvl">${eq.levels.map((_, i) => `<i class="${i <= lvl ? 'on' : ''}"></i>`).join('')}</span></div><h3>${cur.name}</h3><p class="small">${eqDesc(k, cur)}</p>
          ${next ? `<div class="eq-next"><small class="muted">Sonraki</small><b>${next.name}</b><small>${eqDesc(k, next)}</small></div><div class="pc-foot"><b>${KE.tl(next.cost * G.priceIndex)}</b><button class="btn sm green" data-a="upgrade" data-k="${k}" ${G.cash < next.cost * G.priceIndex ? 'disabled' : ''}>Yükselt</button></div>` : `<span class="chip gr">${IC('check')}En üst seviye</span>`}</article>`;
      }).join('')}</div></section>
      <section class="panel"><div class="sechead"><h2>Dekor</h2><div class="chips">${Object.entries(styles).map(([s, n]) => `<span class="chip ${n >= 3 ? 'gd' : ''}">${s}: ${n}/3</span>`).join('')}${amb.concept ? `<span class="chip gd">${IC('star')}Konsept: ${amb.concept.name}</span>` : ''}</div></div>
        <p class="small muted">Ortam puanı müşteri sayısını ve memnuniyeti artırır. Aynı tarzdan 3 parça konsept bonusunu açar; kostümler konsepti güçlendirir.</p>
        <div class="grid g4">${KE.DECOR.map((d) => { const own = b.decor.includes(d.id); return `<article class="card decor ${own ? 'owned' : ''}"><div class="dec-art st-${d.style === 'lüks' ? 'luks' : d.style}">${KE.ART.decor(d.id)}</div><div><b>${d.name}</b><div class="chips"><span class="chip">${d.style}</span><span class="chip">Ortam +${d.ambience}</span>${d.morale ? `<span class="chip gr">Moral +${d.morale}/gün</span>` : ''}</div><p class="small muted">${d.desc}</p></div><div class="pc-foot">${own ? `<span class="chip gr">${IC('check')}Dükkânda</span>` : `<b>${KE.tl(d.cost * G.priceIndex)}</b><button class="btn sm green" data-a="buyDecor" data-id="${d.id}" ${G.cash < d.cost * G.priceIndex ? 'disabled' : ''}>Al</button>`}</div></article>`; }).join('')}</div></section></main>`;
  };

  /* ---------- Banka ---------- */
  SCREENS.banka = () => {
    const offers = [[300000, 12], [750000, 24], [1500000, 36]].map(([a, m]) => KE.loanOffer(Math.round(a * G.priceIndex / 1000) * 1000, m, 0.034));
    return `<main class="screen">${head('Banka', 'Esnaf kredisi · aylık %3,4 faiz, eşit taksit', null, 'banker')}
      <section class="panel"><div class="sechead"><h2>Kredi teklifleri</h2></div><div class="grid g3">${offers.map((o) => `<article class="card loan"><small class="muted">${o.months} ay vade</small><b class="big">${KE.tl(o.amount)}</b><div class="statl"><span>Taksit</span><b>${KE.tl(o.monthly)}</b></div><div class="statl"><span>Toplam</span><b>${KE.tl(o.total)}</b></div><button class="btn sm green block" data-a="loan" data-amt="${o.amount}" data-m="${o.months}" ${G.loans.length >= 3 ? 'disabled' : ''}>Kullan</button></article>`).join('')}</div>${G.loans.length >= 3 ? '<p class="small neg">En fazla 3 kredi kullanabilirsin.</p>' : ''}</section>
      <section class="panel"><div class="sechead"><h2>Kredilerim</h2></div><div class="grid g3">${G.loans.map((l, i) => { const pay = Math.round(l.monthly * l.remaining * 0.93); return `<article class="card loan"><b class="big">${KE.tl(l.amount)}</b><div class="statl"><span>Taksit</span><b>${KE.tl(l.monthly)}</b></div><div class="statl"><span>Kalan</span><b>${l.remaining} ay</b></div><button class="btn sm ghost block" data-a="payoff" data-i="${i}" ${G.cash < pay ? 'disabled' : ''}>Erken kapat · ${KE.tl(pay)}</button></article>`; }).join('') || '<p class="muted">Kredi yok.</p>'}</div></section></main>`;
  };

  /* ---------- Belediye ---------- */
  SCREENS.belediye = () => {
    const fines = G.ledger.months.reduce((a, m) => a + (m.fines || 0), 0) + (G.monthExtras.fines || 0);
    return `<main class="screen">${head('Belediye', 'Ruhsat, hijyen ve denetim', null, 'bulent')}
      <div class="grid g3">${G.branches.map((b) => `<article class="card"><h3>${esc(b.name)}</h3><div class="statl"><span>Temizlik</span>${bar(b.cleanliness, b.cleanliness < 40 ? 'crit' : b.cleanliness < 60 ? 'warn' : 'ok')}<b>${Math.round(b.cleanliness)}</b></div>
        <p class="small muted">${b.cleanliness < 55 ? 'Denetim gelirse ceza yersin.' : 'Denetimden rahat geçer.'}</p>
        <div class="pc-foot"><span class="small">Hijyen eğitimi ve derin temizlik</span><button class="btn sm green" data-a="hygiene" data-id="${b.id}">${KE.tl(12000 * G.priceIndex)}</button></div></article>`).join('')}</div>
      <div class="note">${IC('broom')}<span>Temizlik her müşteriyle düşer; masa toplamak ve temizlik görevlisi yükseltir. Denetimde 55'in altı cezadır. Bugüne kadar ödenen ceza: ${KE.tl(fines)}</span></div></main>`;
  };

  /* ---------- Reklam ajansı ---------- */
  const CAMPAIGNS = [
    { id: 'ilan', name: 'El ilanı dağıtımı', cost: 9000, days: 4, icon: 'map', desc: 'Sanayi ve konut sokaklarına ilan. Müşteri +%12, işçi ve aile +%30.', mods: [['traffic', 1.12], ['type:isci', 1.3], ['type:aile', 1.3]] },
    { id: 'sosyal', name: 'Sosyal medya kampanyası', cost: 22000, days: 7, icon: 'heart', desc: 'Kısa videolar ve fenomen paylaşımları. Müşteri +%18, öğrenci ve gece +%50.', mods: [['traffic', 1.18], ['type:ogrenci', 1.5], ['type:gece', 1.5]] },
    { id: 'radyo', name: 'Radyo reklamı', cost: 35000, days: 7, icon: 'bolt', desc: 'Sabah trafiğinde jingle. Bütün şubelerde müşteri +%10, beyaz yaka +%30.', mods: [['traffic', 1.1], ['type:beyaz', 1.3]] },
    { id: 'blog', name: 'Gurme blog daveti', cost: 15000, days: 5, icon: 'star', desc: 'Yemek yazarlarına tadım. Gurme +%60. Usta ★4 ve üstüyse itibar +4.', mods: [['type:gurme', 1.6]], rep: true },
    { id: 'tabela', name: 'Işıklı tabela yenileme', cost: 30000, days: 0, icon: 'store', desc: 'Seçili şubede kalıcı olarak müşteri +%6. Şube başına bir kez.', sign: true }
  ];
  SCREENS.ajans = () => {
    const b = B();
    const active = G.mods.filter((m) => m.camp);
    return `<main class="screen">${head('Reklam Ajansı', 'Doğru semte doğru kampanya', null, 'ajans')}
      <div class="grid g3">${CAMPAIGNS.map((c) => { const cost = Math.round(c.cost * G.priceIndex); const done = c.sign && b.signBoost; const run = active.find((m) => m.camp === c.id); return `<article class="card"><span class="kicker">${IC(c.icon)}${c.days ? c.days + ' gün' : 'Kalıcı'}</span><h3>${c.name}</h3><p class="small">${c.desc}</p><div class="pc-foot">${done ? `<span class="chip gr">${IC('check')}Yapıldı</span>` : run ? `<span class="chip bl">Sürüyor · ${run.days} gün</span>` : `<b>${KE.tl(cost)}</b><button class="btn sm green" data-a="campaign" data-id="${c.id}" ${G.cash < cost ? 'disabled' : ''}>Başlat</button>`}</div></article>`; }).join('')}</div></main>`;
  };

  /* ---------- Mahalle kahvesi ---------- */
  SCREENS.kahve = () => {
    const news = G.news[0];

    const done = Object.keys(G.goals).length;
    return `<main class="screen">${head('Mahalle Kahvesi', 'Hedefler, müdavimler, günlük ve gazete', null, 'ayse')}
      <div class="cols2"><div class="stack">
        <section class="panel"><div class="sechead"><h2>Hedefler</h2><span class="chip gd">${done} / ${KE.GOALS.length}</span></div><div class="goals">${KE.GOALS.map((g) => `<div class="goal ${G.goals[g.id] ? 'done' : ''}"><i>${G.goals[g.id] ? IC('check') : IC('star')}</i><span><b>${g.name}</b><small>${g.desc}</small></span><em>${G.goals[g.id] ? KE.dateStr(G.goals[g.id]) : KE.tl(g.reward)}</em></div>`).join('')}</div></section>
        <section class="panel"><h2>Günlük arşivi</h2><div class="stack">${G.journal.slice(0, 6).map((j) => `<div><span class="kicker">${j.date}</span><div class="journal sm">${esc(j.text)}</div></div>`).join('') || '<p class="muted">İlk gün bittiğinde günlüğün burada birikecek.</p>'}</div></section>
      </div><div class="stack">
        <section class="panel"><div class="sechead"><h2>Müdavimler</h2><span class="small muted">Sevdiği yemeği iyi yap, gönlü dolsun. 5 kalpte arkadaşını getirir, 8'de mahallede seni över.</span></div><div class="regs">${KE.REGULARS.map((R) => { const r = G.regulars[R.id]; const pid = R.fav[G.mode]; return `<div class="reg"><span class="avatar lg">${KE.portrait(R.look || KE.CAST[R.cast].look, { mood: r.loyalty >= 5 ? 'happy' : 'neutral' })}</span><span class="reg-t"><b>${R.name}</b><small>${KE.CUSTOMER_TYPES[R.type].name} · ${r.visits} ziyaret</small>${hearts(r.loyalty)}</span><span class="reg-fav">${KE.ART.dish(pid)}<small>${pn(pid)}</small></span></div>`; }).join('')}</div></section>

        ${news ? `<section class="panel">${newsHtml(news)}</section>` : '<section class="panel"><h2>Mahalle Postası</h2><p class="muted">Gazete her pazar akşamı çıkar.</p></section>'}
      </div></div></main>`;
  };

  /* ---------- Şubeler (Merkez Ofis) ---------- */
  SCREENS.subeler = () => {
    const cards = KE.DISTRICTS.map((d) => {
      const b = G.branches.find((x) => x.district === d.id);
      if (b) {
        const h = b.history.slice(-7);
        const st = KE.branchStaff(G, b);
        const mgr = st.find((s) => s.role === 'mudur');
        return `<article class="card branch ${b.id === G.activeBranch ? 'sel' : ''}"><div class="br-art">${KE.ART.storefront(b.name, '#d7263d', true)}</div><span class="kicker">${d.name}</span><h3>${esc(b.name)}</h3>
          <div class="chips"><span class="chip">${st.length} kişi</span><span class="chip ${mgr ? 'gr' : 'rd'}">${mgr ? 'Müdür: ' + esc(mgr.name) : 'Müdür yok'}</span><span class="chip">Temizlik ${Math.round(b.cleanliness)}</span></div>
          ${h.length > 1 ? lineChart([{ name: 'Son 7 gün ciro', color: '#f28c28', values: h.map((x) => x.revenue), area: true }], h.map((x) => String(KE.dateOf(x.day).getUTCDate())), { h: 120, label: 'Şube cirosu' }) : '<p class="small muted">Henüz yeterli veri yok.</p>'}
          <div class="pc-foot">${b.id !== G.activeBranch ? `<button class="btn sm green" data-a="viewBranch" data-id="${b.id}">${IC('eye')}Bu şubeye geç</button>` : `<button class="btn sm" data-a="go" data-s="shop">${IC('store')}Dükkâna git</button>`}</div></article>`;
      }
      const cost = KE.branchCost(G, d);
      return `<article class="card branch new"><span class="kicker">${d.side} yakası · ${d.inspired} esintisi</span><h3>${d.name}</h3><p class="small">${d.desc}</p>
        <div class="chips"><span class="chip">Kira ${KE.tl(d.rent * G.priceIndex)}</span><span class="chip">Trafik ${d.traffic}</span><span class="chip">Rakip ${d.rivals}</span></div>
        <div class="chips">${Object.entries(d.mix).sort((a, c) => c[1] - a[1]).slice(0, 3).map(([t]) => `<span class="chip bl">${KE.CUSTOMER_TYPES[t].name}</span>`).join('')}</div>
        <div class="pc-foot"><div class="price"><b>${KE.tl(cost)}</b><small>3 aylık depozito + tadilat ve ekipman</small></div><button class="btn sm green" data-a="openBranch" data-d="${d.id}" ${G.cash < cost || G.phase !== 'morning' ? 'disabled' : ''}>Şube aç</button></div></article>`;
    }).join('');
    return `<main class="screen">${head('Merkez Ofis', 'Şubeler aynı anda çalışır; şube şeridinden canlı izleyebilirsin')}
      ${morningOnly()}
      <div class="note">${IC('users')}<span>Yeni şubeye Usta Pazarı'ndan bir usta, Eleman Bürosu'ndan kasiyer ve komi/garson al. Müdür, ekibi yoğunluğa göre kendisi yönetir. Ustasız şube kepenk açamaz.</span></div>
      ${G.branches.length >= 3 ? `<section class="panel row between"><div><h2>Merkezi mutfak</h2><p class="small muted">Döner ve kıyma merkezde hazırlanıp şubelere dağıtılır. Malzeme maliyeti %12 düşer.</p></div>${G.centralKitchen ? `<span class="chip gr">${IC('check')}Kuruldu</span>` : `<button class="btn green" data-a="central" ${G.cash < 450000 * G.priceIndex ? 'disabled' : ''}>${KE.tl(450000 * G.priceIndex)}</button>`}</section>` : ''}
      <div class="grid g3">${cards}</div></main>`;
  };

  /* ---------- Besi çiftliği ---------- */
  function farmScene(empty) {
    let animals = '';
    if (!empty) {
      const F = G.farm;
      let i = 0;
      KE.farmKinds(G).forEach((k) => {
        const heads = KE.penHeads(F.pens[k]);
        const show = k === 'tavuk' ? Math.min(10, Math.ceil(heads / 25)) : Math.min(8, heads);
        for (let n = 0; n < show; n++, i++) {
          const zone = { dana: [6, 30], kuzu: [36, 60], tavuk: [66, 86] }[k];
          const x = zone[0] + ((n * 37 + i * 11) % (zone[1] - zone[0]));
          const y = 58 + ((n * 23 + i * 7) % 24);
          animals += `<div class="fa ${k}" style="left:${x}%;top:${y}%;animation-delay:-${(n * 1.7) % 9}s;z-index:${Math.round(y)}">${KE.ART.animal(k)}</div>`;
        }
      });
    } else animals = `<div class="fa dana" style="left:18%;top:64%">${KE.ART.animal('dana')}</div><div class="fa kuzu" style="left:46%;top:70%">${KE.ART.animal('kuzu')}</div>`;
    return `<div class="farm"><div class="f-sky"></div><div class="f-hills"></div><div class="f-field"></div>
      <div class="f-barn">${KE.ART.barn()}</div><div class="f-fence a">${KE.ART.fence(300)}</div><div class="f-fence b">${KE.ART.fence(300)}</div>
      ${animals}<div class="f-truck">${KE.ART.truck(G && G.farm ? 'TAZE ET' : 'SATILIK')}</div></div>`;
  }
  SCREENS.ciftlik = () => {
    if (!G.farm) {
      const cost = KE.farmCost(G);
      return `<main class="screen">${head('Besi Çiftliği', 'Kendi etini kendin yetiştir')}
        <section class="farmhero"><div class="fh-scene">${farmScene(true)}</div><div class="fh-copy"><span class="kicker">Satılık · Yeşilova</span><h2>Kendi etimiz, kendi lezzetimiz</h2>
          <p>Çiftlikte ${KE.farmKinds(G).map((k) => KE.FARM[k].name.toLowerCase()).join(', ')} yetiştirirsin. Olgunlaşan hayvanlar kesimhaneye gider, et her sabah şubelere sevk edilir. Kendi etimizle pişen tabaklarda kalite artar, et maliyeti düşer.</p>
          <ul class="chk">${KE.farmKinds(G).map((k) => `<li>${IC('cow')}<span><b>${KE.FARM[k].name}</b> · ${KE.FARM[k].days} günde büyür · yaklaşık ${KE.tl(KE.farmCostPerKg(G, k))}/kg</span></li>`).join('')}</ul>
          <div class="row"><div class="price"><b>${KE.tl(cost)}</b><small>+ aylık ${KE.tl(KE.FARM_MONTHLY * G.priceIndex)} işletme gideri</small></div><button class="btn big green" data-a="buyFarm" ${G.cash < cost ? 'disabled' : ''}>${IC('check')}Çiftliği satın al</button></div></div></section></main>`;
    }
    const F = G.farm;
    const ingName = (k) => KE.MODES[G.mode].ingredients[k].name;
    return `<main class="screen">${head('Besi Çiftliği', 'Yeşilova · ' + (F.auto ? 'otomatik besi açık' : 'elle yönetim'))}
      <section class="farmhero live"><div class="fh-scene">${farmScene(false)}</div></section>
      <div class="kpis"><div class="kpi">${IC('truck')}<small>Bugüne kadar sevk</small><b>${KE.num(F.shipped, 0)} kg</b></div>
        ${Object.entries(F.store).filter(([, v]) => v > 0.05).map(([k, v]) => `<div class="kpi">${IC('leaf')}<small>Depoda ${ingName(k).toLowerCase()}</small><b>${KE.num(v, 1)} kg</b></div>`).join('')}
        <div class="kpi"><label class="switch lbl"><input type="checkbox" data-c="farmAuto" ${F.auto ? 'checked' : ''}><i></i><span><b>Otomatik besi</b><small>Olgunlaşanı keser, talebe göre yenisini alır</small></span></label></div></div>
      <div class="grid g3">${KE.farmKinds(G).map((k) => {
        const D = KE.FARM[k], pen = F.pens[k], heads = KE.penHeads(pen), cap = KE.penCap(k, pen);
        const ready = pen.batches.filter((x) => x.age >= D.days).reduce((a, x) => a + x.count, 0);
        const up = D.upCost[pen.level + 1];
        return `<article class="card pen"><div class="pen-art">${KE.ART.animal(k)}</div><div class="row between"><h3>${D.name}</h3><span class="chip">${heads} / ${cap} ${D.unit}</span></div><p class="small muted">${D.desc}</p>
          <div class="batches">${pen.batches.map((x) => `<div class="batch"><span>${x.count} ${D.unit}</span>${bar(x.age / D.days * 100, x.age >= D.days ? 'ok' : 'or')}<small>${x.age >= D.days ? 'Hazır' : `${D.days - x.age} gün`}</small></div>`).join('') || '<p class="small muted">Ağıl boş.</p>'}</div>
          <div class="chips"><span class="chip">Yavru ${KE.tl(KE.animalPrice(G, k) * D.batch)}${D.batch > 1 ? ' / ' + D.batch : ''}</span><span class="chip">Yem ${KE.tl(D.feed * G.priceIndex)}/${D.unit}/gün</span><span class="chip gr">${KE.tl(KE.farmCostPerKg(G, k))}/kg</span></div>
          <div class="pc-foot"><div class="row"><button class="btn sm green" data-a="buyAnimal" data-k="${k}" ${heads + D.batch > cap ? 'disabled' : ''}>${IC('plus')}Yavru al</button>${ready ? `<button class="btn sm gold" data-a="slaughter" data-k="${k}">${IC('truck')}Kesimhaneye (${ready})</button>` : ''}${up ? `<button class="btn sm ghost" data-a="upgradePen" data-k="${k}" ${G.cash < up * G.priceIndex ? 'disabled' : ''}>Ağılı büyüt · ${KE.tl(up * G.priceIndex)}</button>` : ''}</div></div></article>`;
      }).join('')}</div></main>`;
  };

  /* =================== EYLEMLER =================== */
  const A = {};
  A.go = (d) => { const p = Object.assign({}, d); delete p.a; const s = p.s; delete p.s; UI.go(s, p); };
  A.newgame = () => { UI.ng = {}; UI.go('newMode'); };
  A.continue = () => { G = UI.load(); if (!G) { UI.toast('Kayıt bulunamadı.', 'bad'); return; } KE.G = G; UI.go('map'); };
  A.pickMode = (d) => { readNg(); UI.ng.mode = d.m; UI.ng.masters = null; UI.ng.master = null; UI.render(); };
  A.ngStep = (d) => { readNg(); UI.go(d.to); };
  A.pickDistrict = (d) => { UI.ng.district = d.d; UI.render(); };
  A.pickMaster = (d) => { UI.ng.master = +d.i; UI.render(); };
  function readNg() { const o = document.getElementById('ng-owner'), s = document.getElementById('ng-shop'); if (o) UI.ng.owner = o.value.trim(); if (s) UI.ng.shopName = s.value.trim(); }
  A.startGame = () => {
    const ng = UI.ng;
    const m = ng.masters[ng.master];
    G = KE.newGame({ tut: true, mode: ng.mode, district: ng.district, master: Object.assign({}, m.tmpl, { look: m.look, gender: m.gender, age: m.age }), owner: ng.owner || 'Patron', shopName: ng.shopName || null });
    KE.G = G;
    UI.go('map');
    const usta = G.staff[0];
    UI.modal(`<div class="evcard"><div class="ev-fig">${KE.figure(KE.staffLook(usta), { mood: 'happy', label: usta.name })}</div><div class="stack"><span class="kicker">Hikâye</span><h2>Babadan kalan dükkân</h2>
      <div class="journal">Babamın ${KE.district(B()).name}'deki küçük dükkânının anahtarını avucumda sıktım. Paslı kepengi kaldırdığımda içeri sabah güneşi doldu. ${esc(usta.name)} önlüğünü bağlarken gülümsedi: "Baban bu ocağın başında otuz yıl ekmek çıkardı. Biz de çıkaracağız." Kasada ${KE.tl(G.cash)} var. Önce bir menü, sonra bir mahalle, sonra bütün şehir.</div>
      <ul class="chk"><li>${IC('map')}<span>Haritadaki binalara tıklayarak hal, muhasebe, usta pazarı ve çiftliğe gidersin.</span></li><li>${IC('users')}<span>Usta yalnızca pişirir. Kasa sipariş alır, komi/garson yemeği masaya götürür. Görevleri ve molaları sen ayarlarsın.</span></li><li>${IC('chart')}<span>Gün sonunda bahşişi dağıtır, ay sonunda bordroyu ve vergileri ödersin.</span></li></ul>
      <div class="acts"><button class="btn big green" data-a="closeModal">Haydi bismillah</button></div></div></div>`, { cls: 'event' });
  };
  A.closeModal = () => UI.closeModal();
  A.sound = (d, el) => { KE.SND.toggle(); el.innerHTML = IC(KE.SND.on ? 'sound' : 'mute'); el.classList.toggle('on2', KE.SND.on); el.setAttribute('aria-label', KE.SND.on ? 'Sesi kapat' : 'Sesi aç'); UI.toast(KE.SND.on ? 'Ses ve müzik açık.' : 'Ses kapalı.'); };
  A.menu = () => UI.modal(`<div class="mhead"><h2>Menü</h2><p class="muted">Oyun her gün sonunda bu tarayıcıya kaydedilir.</p></div>
    <div class="stack"><button class="btn green" data-a="saveNow">${IC('check')}Şimdi kaydet</button><button class="btn ghost" data-a="toTitle">${IC('arrow')}Ana menüye dön</button><button class="btn red" data-a="confirmNew">${IC('plus')}Yeni oyun başlat</button><button class="btn ghost" data-a="closeModal">Kapat</button></div>`);
  A.saveNow = () => { UI.save(); UI.closeModal(); UI.toast('Kaydedildi.', 'good'); };
  A.toTitle = () => { UI.save(); UI.closeModal(); UI.go('title'); };
  A.confirmNew = () => { UI.closeModal(); UI.modal(`<div class="mhead"><h2>Emin misin?</h2><p>Kayıtlı oyun silinecek ve yeni bir oyun başlayacak.</p></div><div class="acts"><button class="btn ghost" data-a="closeModal">Vazgeç</button><button class="btn red" data-a="doNew">Evet, sıfırdan başla</button></div>`); };
  A.doNew = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* yok say */ } G = null; UI.closeModal(); UI.ng = {}; UI.go('newMode'); };
  A.tutNext = () => { G.tut++; UI.tutor(); };
  A.tutSkip = () => { G.tut = 99; UI.tutor(); };
  A.pickOpt = (d) => { const o = UI.pickOptions[+d.i]; UI.closeModal(); if (pickCb) pickCb(o); };

  A.viewBranch = (d) => {
    if (G.live && G.live[G.activeBranch] && G.live[G.activeBranch].player.active) KE.playerToggle(G, false);
    G.activeBranch = d.id;
    if (['map', 'subeler', 'title'].includes(screen)) UI.go('shop'); else UI.render();
  };
  A.openShop = () => {
    UI.dailyDone = null;
    if (!G.branches.some((b) => KE.branchStaff(G, b).some(KE.isCook))) { UI.toast('Hiçbir şubede usta yok. Usta Pazarı\'ndan birini işe al.', 'bad'); return; }
    KE.startService(G);
    if (!G.speed) G.speed = 1;
    UI.render();
    UI.startLoop();
    const sp = KE.specialDay(G.day);
    setTimeout(() => banner(sp ? sp.name + ' başladı!' : 'Kepenkler açıldı!'), 300);
  };
  A.speed = (d) => { G.speed = +d.v; document.querySelectorAll('.speed button').forEach((x) => x.classList.toggle('on', +x.dataset.v === G.speed)); };
  A.setPos = (d) => {
    const s = G.staff.find((x) => x.id === d.id);
    if (!s) return;
    KE.setPos(G, s, d.p);
    const b = G.branches.find((x) => x.id === s.branchId);
    if (b.autoStaff && G.phase === 'service') { b.autoStaff = false; UI.toast('Görevleri elle ayarladın; otomatik ekip yönetimi kapatıldı.'); }
    UI.crewHover = 0;
    const cr = document.getElementById('crew');
    if (cr && G.phase !== 'morning') cr.innerHTML = crewPanel(b, true); else UI.render();
  };
  A.tezgah = () => { const L = G.live[G.activeBranch]; KE.playerToggle(G, !L.player.active); if (L.player.active) KE.playerTake(G); renderTezgah(); UI.sceneTick(); };
  A.step = (d) => {
    const r = KE.playerStep(G, d.l);
    if (r.ok === false) { renderTezgah(); const box = document.getElementById('stepbtns'); if (box) { box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); } return; }
    if (r.done) KE.playerTake(G);
    renderTezgah(); UI.sceneTick();
  };
  A.fastForward = () => { KE.finishService(G); UI.render(); showClosing(); };
  A.showClosing = () => showClosing();
  A.closeTab = (d) => { UI.closeTab = d.id; showClosing(); };
  A.tipToday = (d) => { UI.todayRule = d.r; showClosing(); };
  A.finalize = () => {
    const out = KE.finalizeDay(G, UI.todayRule);
    document.querySelectorAll('.modal-bg').forEach((m) => m.remove());
    UI.holdEvent = true;
    UI.go('shop');
    afterDay(out);
    (out.goals || []).forEach((g) => UI.toast('Hedef tamamlandı: ' + g.name, 'gold'));
  };
  A.closeAfterDay = () => { UI.render(); UI.closeModal(); };
  A.eventChoice = (d) => {
    const msg = KE.resolveEvent(G, +d.i);
    UI.closeModal();
    UI.modal(`<div class="mhead"><span class="kicker">Sonuç</span><p class="lead">${esc(msg)}</p></div><div class="acts"><button class="btn green" data-a="closeModalRender">Tamam</button></div>`);
  };
  A.closeModalRender = () => { UI.render(); UI.closeModal(); };
  A.price = (d) => {
    const b = B(); const p = prod(d.p);
    const step = Math.max(5, Math.round(KE.marketPrice(G, p) * 0.05 / 5) * 5);
    b.prices[d.p] = Math.max(5, b.prices[d.p] + step * +d.d);
    UI.render();
  };
  A.tier = (d) => { B().tier = +d.i; UI.render(); UI.toast('Tedarik kalitesi: ' + KE.TIERS[+d.i].name, 'good'); };
  A.stockLevel = (d) => { B().stockLevel = +d.v; UI.render(); };
  A.buy = (d) => { const c = KE.buyExtra(G, B(), d.k, +d.q); UI.toast(`${KE.tl(c)} malzeme alındı.`); UI.render(); };
  A.hireMaster = (d) => {
    const s = G.market.find((x) => x.id === d.id);
    if (!s) return;
    G.cash -= s.fee || 0; if (s.fee) KE.addExtra(G, 'other', s.fee);
    s.branchId = G.activeBranch; s.hiredDay = G.day; delete s.fee;
    G.staff.push(s); G.market = G.market.filter((x) => x.id !== s.id);
    UI.toast(`${s.name} ekibe katıldı!`, 'good'); UI.render();
  };
  A.hireWorker = (d) => {
    const s = G.workers.find((x) => x.id === d.id);
    if (!s) return;
    s.branchId = G.activeBranch; s.hiredDay = G.day;
    G.staff.push(s); G.workers = G.workers.filter((x) => x.id !== s.id);
    UI.toast(`${s.name} işe başladı.`, 'good'); UI.render();
  };
  A.raise = (d) => { const s = G.staff.find((x) => x.id === d.id); s.wage = Math.round(s.wage * 1.1 / 100) * 100; s.morale = clamp(s.morale + 12, 0, 100); UI.toast(`${s.name}: "Sağ ol patron!" Yeni brüt: ${KE.tl(s.wage)}`, 'good'); UI.render(); };
  A.promote = (d) => { G.flags.promoted = true; const s = G.staff.find((x) => x.id === d.id); s.role = 'usta'; s.pos = 'ocak'; s.name = s.name.replace(/^Çırak /, '') + (s.name.includes('Usta') ? '' : ' Usta'); s.wage = Math.max(s.wage, KE.wageFor(s.spec, 'usta')); s.morale = clamp(s.morale + 25, 0, 100); s.mentorId = null; KE.checkGoals(G).forEach((g) => UI.toast('Hedef tamamlandı: ' + g.name, 'gold')); UI.toast(`${s.name} artık usta!`, 'gold'); UI.render(); };
  A.pickMentor = (d) => {
    const s = G.staff.find((x) => x.id === d.id);
    const ustas = KE.branchStaff(G, G.branches.find((x) => x.id === s.branchId)).filter((x) => x.role === 'usta');
    if (!ustas.length) { UI.toast('Bu şubede çırağa öğretecek usta yok.', 'bad'); return; }
    UI.picker(`${s.name} kimin yanında yetişsin?`, 'Çırak, mentorünün uzmanlıklarını her gün biraz öğrenir.', [{ id: null, label: 'Mentor yok', sub: 'Kendi başına öğrensin', sel: !s.mentorId }].concat(ustas.map((u) => ({ id: u.id, label: u.name, sub: `Öğretme ${Math.round(u.teach * 100)} · ${Object.entries(u.spec).map(([p, v]) => pn(p) + ' ★' + v).join(', ')}`, art: `<span class="avatar">${KE.portrait(KE.staffLook(u), { mood: 'happy' })}</span>`, sel: s.mentorId === u.id }))), (o) => { s.mentorId = o.id; if (o.id) UI.toast(`${s.name} artık ${o.label}'nın yanında.`, 'good'); UI.render(); });
  };
  A.pickTransfer = (d) => {
    const s = G.staff.find((x) => x.id === d.id);
    UI.picker(`${s.name} hangi şubede çalışsın?`, null, G.branches.map((b) => ({ id: b.id, label: b.name, sub: `${KE.district(b).name} · ${KE.branchStaff(G, b).length} kişi`, art: `<span class="pick-store">${KE.ART.storefront('', '#d7263d', true)}</span>`, sel: b.id === s.branchId })), (o) => {
      if (o.id === s.branchId) return;
      s.branchId = o.id; s.mentorId = null; s.pos = KE.POSITIONS[s.role][0];
      G.staff.forEach((x) => { if (x.mentorId === s.id) x.mentorId = null; });
      UI.toast(`${s.name} ${o.label} şubesine geçti.`); UI.render();
    });
  };
  A.fire = (d) => {
    const s = G.staff.find((x) => x.id === d.id);
    UI.modal(`<div class="mhead"><h2>${esc(s.name)} işten çıkarılsın mı?</h2><p>İki haftalık brüt ücret ödenir: <b>${KE.tl(s.wage / 2)}</b>. Ekibin geri kalanının morali biraz düşer.</p></div><div class="acts"><button class="btn ghost" data-a="closeModal">Vazgeç</button><button class="btn red" data-a="doFire" data-id="${s.id}">İşten çıkar</button></div>`);
  };
  A.doFire = (d) => {
    const s = G.staff.find((x) => x.id === d.id);
    G.cash -= s.wage / 2; KE.addExtra(G, 'other', s.wage / 2);
    G.staff = G.staff.filter((x) => x.id !== s.id);
    G.staff.forEach((x) => { if (x.mentorId === s.id) x.mentorId = null; if (x.branchId === s.branchId) x.morale = clamp(x.morale - 4, 0, 100); });
    UI.closeModal(); UI.toast(`${s.name} ayrıldı.`); UI.render();
  };
  A.costume = (d) => {
    const s = G.staff.find((x) => x.id === d.id); const c = KE.COSTUMES.find((x) => x.id === d.c);
    G.cash -= c.cost; if (c.cost) KE.addExtra(G, 'capex', c.cost);
    s.costume = c.id; s.morale = clamp(s.morale + c.morale, 0, 100);
    UI.toast(`${s.name} yeni kıyafetine bayıldı!`, 'good'); KE.checkGoals(G); UI.render();
  };
  A.upgrade = (d) => {
    const b = B(); const eq = MODE().equipment[d.k]; const next = eq.levels[b.equipment[d.k] + 1];
    const cost = next.cost * G.priceIndex;
    G.cash -= cost; KE.addExtra(G, 'capex', cost); b.equipment[d.k] += 1;
    if (G.live && G.live[b.id] && d.k === 'service') { const L = G.live[b.id]; while (L.tables.length < KE.tableCount(G, b)) L.tables.push({ id: L.tables.length, occ: null, dirty: false, by: null }); }
    UI.toast(`${next.name} kuruldu. Dükkân değişti!`, 'gold'); UI.render();
  };
  A.buyDecor = (d) => {
    const b = B(); const it = KE.DECOR.find((x) => x.id === d.id); const cost = it.cost * G.priceIndex;
    G.cash -= cost; KE.addExtra(G, 'capex', cost); b.decor.push(it.id);
    if (it.id === 'dismasa' && G.live && G.live[b.id]) { const L = G.live[b.id]; while (L.tables.length < KE.tableCount(G, b)) L.tables.push({ id: L.tables.length, occ: null, dirty: false, by: null }); }
    const amb = KE.ambience(G, b);
    UI.toast(amb.concept ? `Konsept açıldı: ${amb.concept.name}!` : `${it.name} yerleştirildi.`, amb.concept ? 'gold' : 'good');
    KE.checkGoals(G); UI.render();
  };
  A.loan = (d) => { const o = KE.loanOffer(+d.amt, +d.m, 0.034); G.loans.push({ amount: o.amount, monthly: o.monthly, remaining: o.months }); G.cash += o.amount; UI.toast(`${KE.tl(o.amount)} hesabına geçti.`, 'good'); UI.render(); };
  A.payoff = (d) => { const l = G.loans[+d.i]; const pay = Math.round(l.monthly * l.remaining * 0.93); G.cash -= pay; KE.addExtra(G, 'other', pay); G.loans.splice(+d.i, 1); UI.toast('Kredi kapatıldı.', 'good'); UI.render(); };
  A.hygiene = (d) => { const b = G.branches.find((x) => x.id === d.id); const c = 12000 * G.priceIndex; G.cash -= c; KE.addExtra(G, 'other', c); b.cleanliness = clamp(b.cleanliness + 30, 0, 100); UI.toast('Dükkân pırıl pırıl.', 'good'); UI.render(); };
  A.campaign = (d) => {
    const c = CAMPAIGNS.find((x) => x.id === d.id); const b = B(); const cost = Math.round(c.cost * G.priceIndex);
    G.cash -= cost; KE.addExtra(G, 'ads', cost);
    if (c.sign) { b.signBoost = 1.06; UI.toast('Yeni tabela gece gündüz parlıyor.', 'good'); UI.render(); return; }
    c.mods.forEach(([k, m]) => G.mods.push({ key: k, mult: m, days: c.days, label: c.name, camp: c.id }));
    if (c.rep) { const best = Math.max(...MODE().products.map((p) => KE.bestStar(G, b, p.id))); G.reputation = clamp(G.reputation + (best >= 4 ? 4 : 1), 0, 100); }
    UI.toast(`${c.name} başladı.`, 'good'); UI.render();
  };
  A.openBranch = (d) => { const b = KE.openBranch(G, d.d); G.activeBranch = b.id; KE.checkGoals(G); UI.toast(`${b.name} açıldı! Şimdi usta ve ekip al.`, 'gold'); UI.render(); };
  A.central = () => { const c = 450000 * G.priceIndex; G.cash -= c; KE.addExtra(G, 'capex', c); G.centralKitchen = true; UI.toast('Merkezi mutfak kuruldu.', 'gold'); UI.render(); };
  A.tipRule = (d) => { G.tipRule = d.r; UI.todayRule = null; if (G.phase === 'closing' && document.querySelector('.tipbox')) showClosing(); else UI.render(); };
  A.buyFarm = () => { KE.buyFarm(G); KE.checkGoals(G); UI.toast('Besi çiftliği artık senin!', 'gold'); UI.render(); };
  A.buyAnimal = (d) => { const c = KE.buyAnimals(G, d.k); UI.toast(`${KE.FARM[d.k].name} alındı · ${KE.tl(c)}`, 'good'); UI.render(); };
  A.slaughter = (d) => { const r = KE.slaughter(G, d.k); UI.toast(`${r.heads} ${KE.FARM[d.k].unit} kesimhaneye gitti: ${Object.values(r.got).map((v) => KE.num(v, 0) + ' kg').join(', ')}`, 'good'); UI.render(); };
  A.upgradePen = (d) => { KE.upgradePen(G, d.k); UI.toast('Ağıl büyütüldü.', 'good'); UI.render(); };

  const C = {};
  C.menuToggle = (el) => { B().menu[el.dataset.p] = el.checked; UI.render(); };
  C.priceSet = (el) => { const v = parseInt(el.value.replace(/\D/g, ''), 10); if (v > 0) B().prices[el.dataset.p] = v; UI.render(); };
  C.autoStaff = (el) => { const b = G.branches.find((x) => x.id === el.dataset.b); b.autoStaff = el.checked; UI.toast(el.checked ? 'Otomatik ekip yönetimi açık.' : 'Ekibi artık sen yönetiyorsun.'); };
  C.farmAuto = (el) => { G.farm.auto = el.checked; UI.render(); };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const fn = A[el.dataset.a];
    if (fn) { e.preventDefault(); fn(Object.assign({}, el.dataset), el, e); }
  });
  document.addEventListener('pointerover', (e) => { if (e.target.closest && e.target.closest('#crew')) UI.crewHover = Date.now(); });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('g.place[data-a]')) { e.preventDefault(); const fn = A[e.target.dataset.a]; if (fn) fn(Object.assign({}, e.target.dataset)); }
    if (e.key === 'Escape' && document.querySelector('.modal-bg .acts [data-a="closeModal"]')) UI.closeModal();
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-c]');
    if (!el) return;
    const fn = C[el.dataset.c];
    if (fn) fn(el, e);
  });

  UI.boot = function () { UI.go('title'); };
})();
