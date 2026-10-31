/* Kebab Empire — arayüz: ekranlar, HUD, modallar, dükkân sahnesi */
(function () {
  const UI = KE.UI = {};
  const app = () => document.getElementById('app');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = KE.clamp;
  const SAVE_KEY = 'kebab-empire-save-v1';
  let G = null;
  let screen = 'title', params = {};
  UI.ng = {};
  const MODE = () => KE.MODES[G ? G.mode : UI.ng.mode];
  const B = () => G.branches.find((b) => b.id === G.activeBranch);
  const prod = (pid) => MODE().products.find((p) => p.id === pid) || (MODE().drink.id === pid ? MODE().drink : null);
  const pn = (pid) => (prod(pid) || { name: pid }).name;
  const stars = (n, max) => { n = Math.round(n || 0); max = max || 5; let s = '<span class="stars">'; for (let i = 1; i <= max; i++) s += i <= n ? '★' : '<span class="off">★</span>'; return s + '</span>'; };
  const pct = (v) => Math.round(v * 100) + '%';
  const roleName = (s) => s.role === 'usta' ? MODE().cookRole : KE.ROLES[s.role].name;

  /* ---------- Kayıt ---------- */
  UI.save = function () {
    if (!G) return;
    try {
      G.econAsgari = KE.ECON.asgariBrut;
      const copy = Object.assign({}, G, { live: null });
      localStorage.setItem(SAVE_KEY, JSON.stringify(copy));
    } catch (e) { /* tarayıcı depolaması yoksa sessizce geç */ }
  };
  UI.load = function () {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const g = JSON.parse(raw);
      if (g.econAsgari) KE.ECON.asgariBrut = g.econAsgari;
      if (g.phase === 'service') { g.phase = 'morning'; }
      if (g.phase === 'closing' && !g.lastSummary) g.phase = 'morning';
      return g;
    } catch (e) { return null; }
  };
  UI.hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };

  /* ---------- Toast ---------- */
  UI.toast = function (msg, kind) {
    const box = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 3800);
  };

  /* ---------- Modal ---------- */
  let modalQueue = [];
  UI.modal = function (html, opts) {
    opts = opts || {};
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(bg);
    const f = bg.querySelector('button, input, select');
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

  /* ---------- Yönlendirme ---------- */
  UI.go = function (s, p) {
    if (UI.timer && s !== 'shop') { /* servis durur */ }
    screen = s; params = p || {};
    UI.render();
    window.scrollTo(0, 0);
  };
  UI.render = function () {
    const fn = SCREENS[screen] || SCREENS.title;
    const inGame = G && !['title', 'newMode', 'newDistrict', 'newMaster'].includes(screen);
    app().innerHTML = (inGame ? hud() : '') + fn();
    if (screen === 'shop' && G && G.phase === 'service') UI.sceneInit();
    if (G && G.phase !== 'service') UI.save();
    if (inGame && !UI.holdEvent && G.pendingEvent && G.phase === 'morning' && !document.querySelector('.modal-bg')) showEvent();
  };

  /* ---------- HUD ---------- */
  function hud() {
    const hol = KE.holidayOf(G.day);
    const phase = { morning: 'Sabah hazırlığı', service: 'Servis', closing: 'Kapanış' }[G.phase];
    const branchSel = G.branches.length > 1
      ? `<label class="sr"><select id="hud-branch" data-c="switchBranch" aria-label="Aktif şube" ${G.phase !== 'morning' ? 'disabled' : ''}>${G.branches.map((b) => `<option value="${b.id}" ${b.id === G.activeBranch ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label>` : `<span class="chip">${esc(B().name)}</span>`;
    return `<header class="hud">
      <button class="logo" data-a="go" data-s="map" title="Haritaya dön">Kebab Empire</button>
      <span class="chip">${KE.dateStr(G.day)} · ${KE.weekday(G.day)}${hol ? ' · ' + hol : ''}</span>
      <span class="chip">${phase}</span>
      <span class="chip ${G.cash < 0 ? 'neg' : ''}">Kasa <b class="num">${KE.tl(G.cash)}</b></span>
      <span class="chip" title="İtibar ${Math.round(G.reputation)}/100">İtibar <span class="repbar"><i style="width:${G.reputation}%"></i></span> <b class="num">${Math.round(G.reputation)}</b></span>
      ${branchSel}
      <span class="spacer"></span>
      <button class="btn sm gold" data-a="go" data-s="map">Harita</button>
      <button class="btn sm" data-a="go" data-s="shop">Dükkân</button>
      <button class="btn sm blue" data-a="go" data-s="office">Muhasebe</button>
      <button class="btn sm ghost" data-a="menu">Menü</button>
    </header>`;
  }

  function npcHead(key, text) {
    const c = KE.CAST[key];
    return `<div class="npc"><div class="avatar xl">${KE.portrait(c.look, { mood: 'happy', label: c.name })}</div>
      <div class="bubble"><span class="who">${c.name} · ${c.role}</span>${esc(text || KE.line(key))}</div></div>`;
  }
  function back(title, extra) {
    return `<div class="backbar"><button class="btn sm ghost" data-a="go" data-s="map">← Harita</button><h2>${title}</h2>${extra || ''}</div>`;
  }
  function needMorning() {
    return G.phase !== 'morning' ? `<div class="panel small"><b>Not:</b> Personel transferi, işten çıkarma ve şube değiştirme yalnızca sabah hazırlığında yapılabilir.</div>` : '';
  }

  /* ---------- Grafikler ---------- */
  function lineChart(series, labels, opts) {
    opts = opts || {};
    const W = 640, H = opts.h || 220, pl = 64, pr = 12, pt = 12, pb = 26;
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
      g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="#e3d3b8" stroke-width="1"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${KE.num(v >= 1000 || v <= -1000 ? v / 1000 : v)}${Math.abs(max) >= 1000 ? 'B' : ''}</text>`;
    }
    if (min < 0) g += `<line x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}" stroke="#6b5546" stroke-width="1.2"/>`;
    const step = Math.max(1, Math.ceil(n / 8));
    labels.forEach((l, i) => { if (i % step === 0 || i === n - 1) g += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`; });
    series.forEach((s) => {
      if (!s.values.length) return;
      const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
      if (s.area) g += `<polygon points="${x(0)},${y(Math.max(0, min))} ${pts} ${x(s.values.length - 1)},${y(Math.max(0, min))}" fill="${s.color}" opacity=".14"/>`;
      g += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
      const li = s.values.length - 1;
      g += `<circle cx="${x(li)}" cy="${y(s.values[li])}" r="4" fill="${s.color}"/>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || 'grafik')}">${g}</svg>
      <div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`;
  }
  function barChart(values, labels, opts) {
    opts = opts || {};
    const W = 640, H = opts.h || 180, pl = 54, pr = 8, pt = 10, pb = 24;
    const max = Math.max(1, ...values);
    const n = values.length, bw = (W - pl - pr) / n;
    let g = '';
    for (let k = 0; k <= 3; k++) { const v = max * k / 3, yy = pt + (H - pt - pb) * (1 - k / 3); g += `<line x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}" stroke="#e3d3b8"/><text x="${pl - 6}" y="${yy + 4}" text-anchor="end">${opts.money ? KE.num(v / 1000) + 'B' : KE.num(v)}</text>`; }
    values.forEach((v, i) => {
      const h = (H - pt - pb) * v / max;
      g += `<rect x="${pl + i * bw + bw * 0.15}" y="${H - pb - h}" width="${bw * 0.7}" height="${Math.max(0, h)}" rx="3" fill="${opts.color || '#f28c28'}"/>`;
      g += `<text x="${pl + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(labels[i])}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || 'grafik')}">${g}</svg>`;
  }

  /* ---------- Ekranlar ---------- */
  const SCREENS = {};

  SCREENS.title = () => {
    const has = UI.hasSave();
    return `<main class="title-screen">
      <div class="row" style="gap:40px;justify-content:center;align-items:flex-end">
        <div class="doner"><div class="spit"></div><div class="cone"></div><div class="heat"></div></div>
        <div class="mangal"><div class="smoke" style="left:30px"></div><div class="smoke" style="left:90px;animation-delay:1.4s"></div><div class="skewer"></div><div class="skewer s2"></div><div class="coals"></div><div class="box"></div></div>
      </div>
      <h1>Kebab<br>Empire</h1>
      <p>Babandan kalan küçük dükkânın kepengini kaldır. Ustanı seç, ocağı yak, mahallenin gönlünü kazan ve şehre yayılan bir zincir kur.</p>
      <div class="row" style="justify-content:center">
        ${has ? '<button class="btn big green" data-a="continue">Devam et</button>' : ''}
        <button class="btn big" data-a="newgame">Yeni oyun</button>
      </div>
      <p class="small" style="opacity:.75">Kayıt bu tarayıcıda tutulur.</p>
    </main>`;
  };

  SCREENS.newMode = () => {
    const ng = UI.ng;
    const card = (m) => {
      const M = KE.MODES[m];
      const list = m === 'doner'
        ? ['Hızlı servis, kalabalık kuyruk', 'Düşük kâr payı, çok müşteri', 'Öğrenciler, işçiler ve gece çıkışı', 'İskender, dürüm, cağ kebabı']
        : ['Masaya oturan müşteri, uzun pişirme', 'Yüksek hesap, yüksek bahşiş', 'Aileler, gurmeler ve turistler', 'Adana, Urfa, ciğer, lahmacun'];
      return `<button class="modecard ${ng.mode === m ? 'sel' : ''}" data-a="pickMode" data-m="${m}">
        <div style="height:130px;display:flex;align-items:flex-end;justify-content:center">${m === 'doner' ? '<div class="doner"><div class="spit"></div><div class="cone"></div><div class="heat"></div></div>' : '<div class="mangal"><div class="smoke" style="left:30px"></div><div class="smoke" style="left:90px;animation-delay:1.4s"></div><div class="skewer"></div><div class="skewer s2"></div><div class="coals"></div><div class="box"></div></div>'}</div>
        <h3>${M.name}</h3><p class="muted">${M.tagline}</p><ul>${list.map((x) => `<li>${x}</li>`).join('')}</ul></button>`;
    };
    return `<main class="screen">
      <div class="backbar"><h2>1. Ne olacaksın?</h2></div>
      <div class="modecards">${card('doner')}${card('kebap')}</div>
      <div class="panel row" style="align-items:flex-end">
        <label class="field" style="flex:1;min-width:180px">Adın<input id="ng-owner" value="${esc(ng.owner || '')}" placeholder="Örn. Deniz" maxlength="24"></label>
        <label class="field" style="flex:2;min-width:220px">Dükkânının adı<input id="ng-shop" value="${esc(ng.shopName || '')}" placeholder="${ng.mode === 'kebap' ? 'Örn. Köz Ocakbaşı' : 'Örn. Yaprak Döner'}" maxlength="28"></label>
        <button class="btn big green" data-a="ngStep" data-to="newDistrict" ${ng.mode ? '' : 'disabled'}>Devam →</button>
      </div>
    </main>`;
  };

  SCREENS.newDistrict = () => {
    const ng = UI.ng;
    const d = KE.DISTRICTS.find((x) => x.id === ng.district);
    const mixTop = (dd) => Object.entries(dd.mix).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => `<span class="tag bl">${KE.CUSTOMER_TYPES[t].name}</span>`).join(' ');
    return `<main class="screen">
      <div class="backbar"><button class="btn sm ghost" data-a="ngStep" data-to="newMode">← Geri</button><h2>2. İlk dükkânın hangi semtte?</h2></div>
      <div class="cols">
        <div class="panel" style="padding:8px">${mapSvg({ pick: true })}</div>
        <div class="stack">
          ${d ? `<div class="panel stack"><span class="eyebrow">${d.side} yakası · ${d.inspired} esintisi</span><h3 style="font-size:28px">${d.name}</h3><p>${d.desc}</p>
            <div class="kpis"><div class="kpi"><div class="l">Aylık kira</div><div class="v">${KE.tl(d.rent)}</div></div><div class="kpi"><div class="l">Yaya trafiği</div><div class="v">${d.traffic}</div></div><div class="kpi"><div class="l">Rakip</div><div class="v">${d.rivals}</div></div></div>
            <div><b>Baskın müşteri:</b><div class="row" style="margin-top:4px">${mixTop(d)}</div></div>
            <p class="small muted">Semt dükkânının görünümünü değiştirmez. Müşteri karışımını, kirayı ve rekabeti belirler.</p>
            <button class="btn big green" data-a="ngStep" data-to="newMaster">Bu semtte aç →</button></div>`
            : '<div class="panel"><h3>Haritadan bir semt seç</h3><p>Her semtin müşteri profili, kirası ve rakip sayısı farklı. İlk dükkânını nerede açacağına sen karar ver.</p></div>'}
          <div class="panel"><table><thead><tr><th>Semt</th><th class="r">Kira</th><th>Müşteri</th></tr></thead><tbody>
            ${KE.DISTRICTS.map((x) => `<tr class="click" data-a="pickDistrict" data-d="${x.id}"><td><b>${x.name}</b></td><td class="r">${KE.tl(x.rent)}</td><td class="small">${Object.entries(x.mix).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => KE.CUSTOMER_TYPES[t].name).join(', ')}</td></tr>`).join('')}
          </tbody></table></div>
        </div>
      </div>
    </main>`;
  };

  function masterCard(s, opts) {
    opts = opts || {};
    const tr = KE.TRAITS[s.trait];
    const look = KE.staffLook(s);
    const specs = Object.entries(s.spec).sort((a, b) => b[1] - a[1]);
    const statl = (l, v) => `<div class="statline"><span>${l}</span><div class="bar ${v < 0.5 ? 'rd' : v < 0.75 ? 'or' : ''}"><i style="width:${clamp(v, 0, 1) * 100}%"></i></div><span class="num">${Math.round(v * 100)}</span></div>`;
    return `<div class="card ${opts.sel ? 'sel' : ''}">
      <div class="head"><div class="avatar lg">${KE.portrait(look, { mood: KE.moodFromValue(s.morale), label: s.name })}</div>
        <div class="stack" style="gap:4px"><h4>${esc(s.name)}</h4><div class="row" style="gap:6px"><span class="tag or">${s.role === 'cirak' ? 'Çırak' : 'Usta'}</span><span class="tag">Memleket: ${s.region}</span></div>
        ${opts.own ? `<div class="statline" style="grid-template-columns:52px 1fr 34px"><span>Moral</span><div class="bar ${s.morale < 35 ? 'rd' : s.morale < 60 ? 'or' : ''}"><i style="width:${s.morale}%"></i></div><span class="num">${Math.round(s.morale)}</span></div>` : ''}</div></div>
      <div class="stack" style="gap:4px">${specs.map(([pid, st]) => `<div class="row between"><span><b>${pn(pid)}</b></span><span>${stars(st)}${opts.own && st < 5 ? ` <span class="tiny muted">${Math.round(s.xp[pid] || 0)}/${KE.STAR_NEED[st + 1]}</span>` : ''}</span></div>`).join('') || '<span class="muted small">Henüz uzmanlık yok</span>'}</div>
      <div class="stack" style="gap:3px">${statl('Hız', (s.speed - 0.6) / 0.8)}${statl('Kalite', s.quality)}${statl('Tutarlılık', s.consistency)}${statl('Fire kontrol', 1.2 - s.waste)}${statl('Öğretme', s.teach)}</div>
      ${tr ? `<div class="small"><span class="tag gd">${tr.name}</span> ${tr.desc}</div>` : ''}
      ${opts.extra || ''}
      <div class="foot"><div class="small"><b class="num">${KE.tl(s.wage)}</b> brüt/ay${s.fee ? ` · transfer <b class="num">${KE.tl(s.fee)}</b>` : ''}</div>${opts.actions || ''}</div>
    </div>`;
  }
  UI.masterCard = masterCard;

  SCREENS.newMaster = () => {
    const ng = UI.ng;
    if (!ng.masters) {
      const t = KE.MASTER_TEMPLATES[ng.mode].filter((x) => x.role !== 'cirak').slice().sort(() => Math.random() - 0.5).slice(0, 3);
      const fakeG = { nextId: 900, day: 1, mode: ng.mode };
      ng.masters = t.map((x) => Object.assign(KE.makeStaff(fakeG, Object.assign({}, x, { role: 'usta' })), { tmpl: x }));
    }
    const M = KE.MODES[ng.mode];
    return `<main class="screen">
      <div class="backbar"><button class="btn sm ghost" data-a="ngStep" data-to="newDistrict">← Geri</button><h2>3. Ocağın başına kim geçecek?</h2></div>
      <div class="panel small">Usta, dükkânın kalbidir. Uzman olduğu ürünü seven müşteriler gelir, daha çok beğenir ve daha çok bahşiş bırakır. Pahalı usta güçlüdür ama maaşı da yüksektir. Yanına bir çırak ve ${ng.mode === 'kebap' ? 'bir garsonla bir kasiyer' : 'bir kasiyer'} veriliyor.</div>
      <div class="grid wide">${ng.masters.map((s, i) => masterCard(s, { sel: ng.master === i, actions: `<button class="btn ${ng.master === i ? 'green' : ''}" data-a="pickMaster" data-i="${i}">${ng.master === i ? 'Seçildi' : 'Bu usta'}</button>` })).join('')}</div>
      <div class="row" style="justify-content:flex-end"><button class="btn big green" data-a="startGame" ${ng.master == null ? 'disabled' : ''}>Kepengi kaldır (${M.name})</button></div>
    </main>`;
  };

  /* ---------- Harita ---------- */
  const PLACES = [
    { id: 'hal', name: 'Hal ve Kasap', x: 255, y: 235, color: '#c0392b', icon: 'M-9 4 h18 l-3 -10 h-12z M-6 -8 a6 6 0 0 1 12 0' },
    { id: 'office', name: 'Muhasebe', x: 330, y: 478, color: '#1f618d', icon: 'M-8 -9 h16 v18 h-16z M-5 -5 h10 M-5 -1 h10 M-5 3 h6' },
    { id: 'lonca', name: 'Usta Pazarı', x: 355, y: 300, color: '#7d3c98', icon: 'M-8 6 l3 -12 l5 6 l5 -6 l3 12z' },
    { id: 'buro', name: 'Eleman Bürosu', x: 205, y: 405, color: '#16a085', icon: 'M0 -9 a4 4 0 1 1 -0.1 0 M-8 8 q8 -14 16 0z' },
    { id: 'terzi', name: 'Terzi', x: 430, y: 228, color: '#d35400', icon: 'M-8 -6 l5 -3 q3 3 6 0 l5 3 l-3 4 l-2 -1 v11 h-6 v-11 l-2 1z' },
    { id: 'dekor', name: 'Mobilya ve Dekor', x: 300, y: 150, color: '#117a65', icon: 'M-8 2 h16 v5 h-16z M-6 2 v-8 h12 v8 M-6 7 v3 M6 7 v3' },
    { id: 'banka', name: 'Banka', x: 385, y: 80, color: '#b7950b', icon: 'M-9 -2 l9 -7 l9 7z M-7 -1 v8 M-2 -1 v8 M2 -1 v8 M7 -1 v8 M-9 8 h18' },
    { id: 'belediye', name: 'Belediye', x: 140, y: 215, color: '#2e4053', icon: 'M-8 8 v-10 h16 v10z M-3 8 v-5 h6 v5 M0 -2 v-7 l6 2 l-6 2' },
    { id: 'ajans', name: 'Reklam Ajansı', x: 720, y: 250, color: '#e74c3c', icon: 'M-8 -3 l12 -6 v18 l-12 -6z M-8 -3 v6 M4 -2 q5 2 0 4' },
    { id: 'kahve', name: 'Mahalle Kahvesi', x: 810, y: 360, color: '#6e2c00', icon: 'M-7 -4 h12 v7 a6 6 0 0 1 -12 0z M5 -2 q5 0 0 5 M-4 -8 q2 -2 0 -4 M0 -8 q2 -2 0 -4' },
    { id: 'subeler', name: 'Şube Yönetimi', x: 640, y: 545, color: '#d7263d', icon: 'M-9 8 v-9 l9 -7 l9 7 v9z M-3 8 v-6 h6 v6' }
  ];
  function mapSvg(opts) {
    opts = opts || {};
    const owned = G ? G.branches.map((b) => b.district) : [];
    const activeD = G ? B().district : null;
    const strait = 'M655 0 C 620 70, 590 120, 600 180 C 610 240, 585 280, 600 330 C 612 370, 585 410, 560 445';
    let s = `<svg class="map" viewBox="0 0 900 600" role="img" aria-label="Şehir haritası">
      <defs><linearGradient id="landA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3efc0"/><stop offset="1" stop-color="#cfe3a4"/></linearGradient>
      <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4aa3e8"/><stop offset="1" stop-color="#2a78c2"/></linearGradient></defs>
      <rect width="900" height="600" fill="url(#landA)"/>
      <path d="M655 -10 C 700 0, 760 0, 900 0 L900 -10Z" fill="url(#sea)"/>
      <path d="M0 565 Q 200 525 420 478 Q 520 455 560 442 Q 700 470 900 560 L900 600 L0 600Z" fill="url(#sea)"/>
      <path d="${strait}" fill="none" stroke="url(#sea)" stroke-width="46" stroke-linecap="round"/>
      <path d="M590 370 Q 520 352 455 338 Q 395 326 352 300" fill="none" stroke="#3b8fd9" stroke-width="20" stroke-linecap="round"/>
      <g opacity=".55" stroke="#fff" stroke-width="2" fill="none"><path class="wave" d="M120 560 q10 -6 20 0 q10 6 20 0"/><path class="wave" d="M330 520 q10 -6 20 0 q10 6 20 0"/><path class="wave" d="M720 540 q10 -6 20 0 q10 6 20 0"/><path class="wave" d="M480 570 q10 -6 20 0 q10 6 20 0"/></g>
      <g stroke="#8d6e63" stroke-width="7" stroke-linecap="round"><line x1="560" y1="190" x2="640" y2="178"/><line x1="560" y1="300" x2="640" y2="310"/></g>
      <g stroke="#d7263d" stroke-width="3"><line x1="575" y1="170" x2="575" y2="200"/><line x1="625" y1="165" x2="625" y2="192"/><line x1="575" y1="288" x2="575" y2="314"/><line x1="625" y1="294" x2="625" y2="320"/></g>
      <g fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="1 9" stroke-linecap="round" opacity=".8"><path d="M120 300 Q 300 360 520 330 T 880 300"/><path d="M80 150 Q 300 120 480 180 T 880 140"/></g>
      <g><g><path d="M-14 0 h28 l-5 7 h-18z" fill="#fdfefe"/><rect x="-7" y="-7" width="14" height="7" rx="2" fill="#d7263d"/><rect x="-2" y="-13" width="3" height="6" fill="#2c3e50"/></g>
        <animateMotion dur="38s" repeatCount="indefinite" rotate="0" path="${strait}"/></g>
      <g class="cloud"><ellipse cx="80" cy="60" rx="46" ry="16" fill="#fff" opacity=".8"/><ellipse cx="110" cy="50" rx="30" ry="14" fill="#fff" opacity=".8"/></g>
      <g class="cloud c2"><ellipse cx="60" cy="120" rx="40" ry="13" fill="#fff" opacity=".7"/><ellipse cx="88" cy="112" rx="24" ry="12" fill="#fff" opacity=".7"/></g>
      <g class="gull" fill="none" stroke="#2c3e50" stroke-width="2"><path d="M0 200 q6 -6 12 0 q6 -6 12 0"/><path d="M30 214 q5 -5 10 0 q5 -5 10 0"/></g>
      <text x="330" y="545" class="dlbl" style="font-size:15px">Marmara</text><text x="545" y="40" class="dlbl" style="font-size:14px">Boğaz</text>
      <text x="40" y="40" class="dlbl" style="font-size:16px">Avrupa yakası</text><text x="720" y="40" class="dlbl" style="font-size:16px">Anadolu yakası</text>`;
    const buildings = [[200, 300], [260, 330], [330, 390], [470, 120], [500, 140], [450, 160], [700, 400], [760, 470], [520, 250], [120, 450], [150, 470], [440, 420]];
    buildings.forEach(([bx, by], i) => { s += `<g opacity=".35"><rect x="${bx}" y="${by}" width="14" height="${18 + (i % 3) * 8}" fill="#8e7a68"/><rect x="${bx + 16}" y="${by + 6}" width="12" height="${12 + (i % 2) * 8}" fill="#a0897a"/></g>`; });
    KE.DISTRICTS.forEach((d) => {
      const own = owned.includes(d.id), act = d.id === activeD, sel = opts.pick && UI.ng.district === d.id;
      const action = opts.pick ? `data-a="pickDistrict" data-d="${d.id}"` : (own ? (act ? 'data-a="go" data-s="shop"' : `data-a="go" data-s="subeler" data-d="${d.id}"`) : `data-a="go" data-s="subeler" data-d="${d.id}"`);
      s += `<g class="place" ${action} tabindex="0" role="button" aria-label="${d.name}">
        ${act || sel ? `<circle class="pulse" cx="${d.x}" cy="${d.y}" r="16" fill="${sel ? '#ffc93c' : '#d7263d'}"/>` : ''}
        <g class="badge"><path d="M${d.x} ${d.y + 4} l-12 -18 a15 15 0 1 1 24 0z" fill="${own ? '#d7263d' : sel ? '#ffc93c' : '#fffaf1'}" stroke="${own ? '#8f1424' : '#6b5546'}" stroke-width="2.5"/>
        <circle cx="${d.x}" cy="${d.y - 20}" r="5.5" fill="${own ? '#ffc93c' : '#6b5546'}"/></g>
        <text x="${d.x}" y="${d.y + 22}" text-anchor="middle" class="dlbl">${d.name}${act ? ' (Dükkânım)' : own ? ' (Şube)' : ''}</text></g>`;
    });
    if (!opts.pick) {
      PLACES.forEach((p) => {
        s += `<g class="place" data-a="go" data-s="${p.id}" tabindex="0" role="button" aria-label="${p.name}">
          <g class="badge"><rect x="${p.x - 22}" y="${p.y - 22}" width="44" height="44" rx="12" fill="${p.color}" stroke="#fff" stroke-width="3"/>
          <g transform="translate(${p.x},${p.y})" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="${p.icon}"/></g></g>
          <text x="${p.x}" y="${p.y + 38}" text-anchor="middle" class="lbl">${p.name}</text></g>`;
      });
    }
    if (G && !opts.pick) s += `<rect width="900" height="600" fill="#0b2a52" opacity="${G.phase === 'closing' ? 0.28 : 0}" pointer-events="none"/>`;
    return s + '</svg>';
  }

  SCREENS.map = () => {
    const tip = G.phase === 'morning' ? `Günaydın ${esc(G.owner)}! Hazırlıkları bitirince dükkâna geçip kepengi aç.` : G.phase === 'service' ? 'Servis devam ediyor. Dükkâna dönünce zaman yeniden akar.' : 'Gün bitti. Dükkânda kapanış raporu seni bekliyor.';
    return `<main class="screen full"><div class="mapwrap">${mapSvg()}<div class="maptip">${tip} <button class="btn sm green" data-a="go" data-s="shop">Dükkâna git</button></div></div></main>`;
  };

  /* ---------- Dükkân ---------- */
  SCREENS.shop = () => {
    if (G.phase === 'morning') return morningView();
    return `<main class="screen">${sceneHtml()}</main>`;
  };

  function morningView() {
    const b = B();
    const M = MODE();
    const st = KE.branchStaff(G, b);
    const exp = KE.expectedCustomers(G, b);
    const amb = KE.ambience(G, b);
    const rows = M.products.map((p) => {
      const mp = KE.marketPrice(G, p), price = b.prices[p.id], cost = KE.productCost(G, b, p);
      const can = KE.canMake(G, b, p) || (!b.menu[p.id] && (!p.requiresSpec || KE.bestStar(G, b, p.id) >= 1));
      const best = KE.bestStar(G, b, p.id);
      const margin = (price / 1.1 - cost) / (price / 1.1);
      const ratio = price / mp;
      return `<tr>
        <td><input type="checkbox" class="toggle" id="menu-${p.id}" data-c="menuToggle" data-p="${p.id}" ${b.menu[p.id] ? 'checked' : ''} ${p.requiresSpec && best < 1 ? 'disabled' : ''} aria-label="${p.name} menüde"></td>
        <td><b>${p.name}</b>${p.requiresSpec ? ' <span class="tag gd">Uzman ister</span>' : ''}${p.requiresSpec && best < 1 ? '<div class="tiny muted">Bu ürünü bilen bir usta yok</div>' : ''}</td>
        <td>${stars(best)}</td>
        <td class="r">${KE.tl(mp)}</td>
        <td class="r"><span class="price-ctl"><button class="btn sm ghost" data-a="price" data-p="${p.id}" data-d="-1" aria-label="Fiyatı düşür">−</button><input id="price-${p.id}" class="num" value="${price}" data-c="priceSet" data-p="${p.id}" inputmode="numeric" aria-label="${p.name} fiyatı"><button class="btn sm ghost" data-a="price" data-p="${p.id}" data-d="1" aria-label="Fiyatı artır">+</button></span></td>
        <td class="r ${ratio > 1.15 ? 'negv' : ratio < 0.95 ? 'pos' : ''}">${ratio > 1 ? '+' : ''}${Math.round((ratio - 1) * 100)}%</td>
        <td class="r">${KE.tl(cost)}</td>
        <td class="r ${margin < 0.45 ? 'negv' : 'pos'}">${Math.round(margin * 100)}%</td>
      </tr>`;
    }).join('');
    const ingRows = Object.entries(M.ingredients).map(([k, ing]) => {
      const days = b.usage[k] > 0 ? b.stock[k] / b.usage[k] : 9;
      return `<tr><td>${ing.name}</td><td class="r">${KE.num(b.stock[k] || 0, ing.unit === 'kg' ? 1 : 0)} ${ing.unit}</td><td class="r">${KE.num(b.usage[k] || 0, ing.unit === 'kg' ? 1 : 0)}</td><td>${days < 0.9 ? '<span class="tag rd">Az</span>' : days < 1.05 ? '<span class="tag or">Sınırda</span>' : '<span class="tag gr">Yeterli</span>'}</td></tr>`;
    }).join('');
    const stations = KE.equip(G, b, 'cook').stations;
    const cooks = st.filter(KE.isCook);
    const front = st.filter((s) => s.role === 'kasiyer' || s.role === 'garson');
    const warn = [];
    if (cooks.length > stations) warn.push(`${cooks.length} pişirmeci var ama ${stations} ocak yeri var. Fazlası yedekte bekler.`);
    if (!front.length) warn.push('Kasiyer ya da garson yok: ustalar sipariş de alacak ve %25 yavaşlayacak.');
    if (G.mode === 'kebap' && !st.some((s) => s.role === 'garson')) warn.push('Garson yok: masalardaki müşteriler daha sabırsız ve daha az bahşiş bırakır.');
    if (b.cleanliness < 40) warn.push('Temizlik puanı düşük. Denetim gelirse ceza yiyebilirsin.');
    if (G.cash < 0) warn.push('Kasa eksiye düştü. Ay sonunda maaşlar gecikirse SGK teşviki kaybolur ve moral düşer.');
    const mods = G.mods.filter((m) => m.label);
    return `<main class="screen">
      <div class="backbar"><h2>Sabah hazırlığı · ${esc(b.name)}</h2><span class="spacer" style="flex:1"></span>
        <button class="btn big green" data-a="openShop">Kepengi aç (10:00)</button></div>
      ${warn.length ? `<div class="panel" style="border-left:6px solid var(--biber)"><b>Dikkat:</b><ul style="margin:4px 0 0">${warn.map((w) => `<li>${w}</li>`).join('')}</ul></div>` : ''}
      <div class="cols">
        <div class="stack">
          <div class="panel"><div class="row between"><h3>Menü ve fiyatlar</h3><span class="small muted">Fiyatlar KDV dahil · piyasa fiyatı enflasyonla artar</span></div>
            <div class="tablewrap"><table><thead><tr><th></th><th>Ürün</th><th>En iyi usta</th><th class="r">Piyasa</th><th class="r">Senin fiyatın</th><th class="r">Fark</th><th class="r">Maliyet</th><th class="r">Brüt marj</th></tr></thead><tbody>${rows}
            <tr><td></td><td><b>${M.drink.name}</b></td><td></td><td class="r">${KE.tl(KE.marketPrice(G, M.drink))}</td><td class="r"><span class="price-ctl"><button class="btn sm ghost" data-a="price" data-p="${M.drink.id}" data-d="-1" aria-label="Fiyatı düşür">−</button><input id="price-${M.drink.id}" class="num" value="${b.prices[M.drink.id]}" data-c="priceSet" data-p="${M.drink.id}" aria-label="İçecek fiyatı"><button class="btn sm ghost" data-a="price" data-p="${M.drink.id}" data-d="1" aria-label="Fiyatı artır">+</button></span></td><td></td><td class="r">${KE.tl(KE.productCost(G, b, M.drink))}</td><td></td></tr>
            </tbody></table></div>
            <p class="small muted">Pahalı fiyat, fiyata duyarlı müşterileri (öğrenci, işçi) kaçırır. Gurmeler ve plaza çalışanları fiyata pek bakmaz.</p></div>
          <div class="panel"><div class="row between"><h3>Bugünkü vardiya</h3><button class="btn sm ghost" data-a="go" data-s="lonca">Personeli yönet</button></div>
            <div class="grid">${st.map((s) => staffMini(s)).join('')}</div></div>
        </div>
        <div class="stack">
          <div class="panel stack"><h3>Bugün beklenen</h3>
            <div class="kpis"><div class="kpi"><div class="l">Müşteri</div><div class="v">~${Math.round(exp)}</div></div><div class="kpi"><div class="l">Ocak yeri</div><div class="v">${Math.min(stations, cooks.length)}/${stations}</div></div><div class="kpi"><div class="l">Temizlik</div><div class="v">${Math.round(b.cleanliness)}</div></div><div class="kpi"><div class="l">Ortam</div><div class="v">${amb.score}</div></div></div>
            ${amb.concept ? `<div><span class="tag gd">Konsept: ${amb.concept.name}</span></div>` : ''}
            ${mods.length ? `<div class="small"><b>Etkin durumlar:</b> ${mods.map((m) => `<span class="tag bl">${m.label} (${m.days} gün)</span>`).join(' ')}</div>` : ''}
          </div>
          <div class="panel"><div class="row between"><h3>Stok</h3><button class="btn sm ghost" data-a="go" data-s="hal">Hal'e git</button></div>
            <p class="small muted">Kasap Rıza her sabah stoğu "${b.stockLevel <= 0.9 ? 'Az' : b.stockLevel >= 1.4 ? 'Bol' : 'Normal'}" seviyesine tamamladı: ${KE.tl(G.today[b.id].purchases)}.</p>
            <div class="tablewrap"><table><thead><tr><th>Malzeme</th><th class="r">Stok</th><th class="r">Günlük</th><th></th></tr></thead><tbody>${ingRows}</tbody></table></div></div>
          <div class="panel stack"><h3>Kısayollar</h3><div class="row"><button class="btn sm blue" data-a="go" data-s="office">Muhasebe</button><button class="btn sm ghost" data-a="go" data-s="dekor">Ekipman</button><button class="btn sm ghost" data-a="go" data-s="terzi">Terzi</button><button class="btn sm ghost" data-a="go" data-s="ajans">Reklam</button></div></div>
        </div>
      </div>
    </main>`;
  }
  function staffMini(s) {
    const look = KE.staffLook(s);
    const top = Object.entries(s.spec).sort((a, b) => b[1] - a[1]).slice(0, 2);
    return `<div class="card" style="gap:6px"><div class="head"><div class="avatar">${KE.portrait(look, { mood: KE.moodFromValue(s.morale), label: s.name })}</div>
      <div class="stack" style="gap:2px;min-width:0"><b style="font-family:var(--f-display);font-size:16px">${esc(s.name)}</b><span class="small muted">${roleName(s)} · ${s.region}</span>
      <div class="statline" style="grid-template-columns:40px 1fr 28px"><span class="tiny">Moral</span><div class="bar ${s.morale < 35 ? 'rd' : s.morale < 60 ? 'or' : ''}"><i style="width:${s.morale}%"></i></div><span class="tiny num">${Math.round(s.morale)}</span></div></div></div>
      ${top.length ? `<div class="small">${top.map(([pid, v]) => `${pn(pid)} ${stars(v)}`).join('<br>')}</div>` : ''}</div>`;
  }

  /* Dükkân sahnesi */
  const DECOR_ICON = {
    cini: '<rect x="4" y="4" width="32" height="32" rx="4" fill="#1f618d"/><circle cx="20" cy="20" r="8" fill="#fff"/><circle cx="20" cy="20" r="4" fill="#d7263d"/><path d="M4 4 l8 8 M36 4 l-8 8 M4 36 l8 -8 M36 36 l-8 -8" stroke="#5dade2" stroke-width="2"/>',
    bakir: '<ellipse cx="13" cy="24" rx="9" ry="6" fill="#ca6f1e"/><ellipse cx="28" cy="18" rx="8" ry="5" fill="#e59866"/><path d="M28 13 v-6" stroke="#935116" stroke-width="2"/>',
    nostalji: '<rect x="5" y="6" width="30" height="26" fill="#fdfefe" stroke="#6e2c00" stroke-width="3"/><rect x="10" y="11" width="20" height="14" fill="#909497"/><circle cx="20" cy="17" r="4" fill="#d5d8dc"/>',
    kilim: '<rect x="4" y="10" width="32" height="22" fill="#922b21"/><path d="M8 21 l6 -6 l6 6 l6 -6 l6 6 M8 21 l6 6 l6 -6 l6 6 l6 -6" stroke="#f4d03f" stroke-width="2" fill="none"/>',
    neon: '<rect x="3" y="8" width="34" height="22" rx="5" fill="#17202a"/><text x="20" y="24" text-anchor="middle" font-size="10" font-weight="800" fill="#ff4fd8" font-family="sans-serif">AÇIK</text>',
    grafiti: '<rect x="3" y="3" width="34" height="34" rx="4" fill="#f9e79f"/><path d="M8 28 q6 -16 12 -6 q6 10 12 -12" stroke="#e74c3c" stroke-width="4" fill="none"/><circle cx="12" cy="12" r="4" fill="#3498db"/>',
    taburet: '<rect x="4" y="10" width="32" height="5" fill="#6e2c00"/><path d="M10 18 v16 M20 18 v16 M30 18 v16" stroke="#2c3e50" stroke-width="3"/><circle cx="10" cy="18" r="4" fill="#d7263d"/><circle cx="20" cy="18" r="4" fill="#d7263d"/><circle cx="30" cy="18" r="4" fill="#d7263d"/>',
    menuekran: '<rect x="3" y="6" width="34" height="24" rx="3" fill="#212f3d"/><rect x="6" y="9" width="12" height="8" fill="#f39c12"/><rect x="21" y="9" width="13" height="8" fill="#e74c3c"/><rect x="6" y="20" width="28" height="3" fill="#7fb3d5"/>',
    bitki: '<rect x="13" y="26" width="14" height="10" fill="#a04000"/><path d="M20 26 q-12 -6 -8 -18 q6 6 8 18 q2 -14 10 -18 q2 12 -10 18" fill="#27ae60"/>',
    aydinlatma: '<path d="M12 2 v10 M28 2 v10" stroke="#2c3e50" stroke-width="2"/><path d="M5 22 q7 -12 14 0z M21 22 q7 -12 14 0z" fill="#f5b041"/><circle cx="12" cy="24" r="3" fill="#fef9e7"/><circle cx="28" cy="24" r="3" fill="#fef9e7"/>',
    mermer: '<rect x="3" y="12" width="34" height="16" rx="2" fill="#f8f9f9" stroke="#d4ac0d" stroke-width="2"/><path d="M6 16 q8 6 14 0 t14 4" stroke="#b3b6b7" fill="none"/>',
    kadife: '<rect x="5" y="14" width="30" height="16" rx="6" fill="#922b21"/><rect x="5" y="8" width="30" height="10" rx="5" fill="#a93226"/><path d="M8 30 v5 M32 30 v5" stroke="#d4ac0d" stroke-width="3"/>',
    dismasa: '<circle cx="20" cy="16" r="12" fill="#fdfefe" stroke="#d7263d" stroke-width="3"/><path d="M20 28 v8 M12 36 h16" stroke="#566573" stroke-width="3"/>',
    dinlenme: '<rect x="4" y="18" width="32" height="12" rx="4" fill="#5dade2"/><rect x="4" y="12" width="10" height="10" rx="3" fill="#3498db"/><path d="M26 6 q4 4 0 8 M30 6 q4 4 0 8" stroke="#85929e" stroke-width="2" fill="none"/>',
    klima: '<rect x="3" y="8" width="34" height="14" rx="3" fill="#fdfefe" stroke="#aab7b8" stroke-width="2"/><path d="M10 26 q2 4 0 8 M20 26 q2 4 0 8 M30 26 q2 4 0 8" stroke="#5dade2" stroke-width="2" fill="none"/>'
  };
  const STYLE_BG = { geleneksel: '#fdebd0', sokak: '#e8daef', modern: '#d6eaf8', 'lüks': '#fcf3cf', personel: '#e5e8e8' };
  function decorHtml(b) {
    return b.decor.map((id) => { const d = KE.DECOR.find((x) => x.id === id); return `<div class="decor-item" style="background:${STYLE_BG[d.style]}" title="${d.name}"><svg viewBox="0 0 40 40">${DECOR_ICON[id] || ''}</svg></div>`; }).join('');
  }
  function equipArt(b) {
    if (G.mode === 'doner') {
      const n = Math.min(2, 1 + Math.floor(b.equipment.cook / 2));
      let h = '';
      for (let i = 0; i < n; i++) h += `<div class="doner ${i % 2 ? 'chicken' : ''}" style="margin:0 8px"><div class="spit"></div><div class="cone"></div><div class="heat"></div></div>`;
      return h;
    }
    return `<div class="mangal"><div class="smoke" style="left:30px"></div><div class="smoke" style="left:90px;animation-delay:1.4s"></div><div class="skewer"></div><div class="skewer s2"></div><div class="coals"></div><div class="box"></div></div>`;
  }
  function sceneHtml() {
    const b = B();
    const lux = b.decor.filter((id) => (KE.DECOR.find((d) => d.id === id) || {}).style === 'lüks').length >= 2;
    const closing = G.phase === 'closing';
    return `<div class="shop">
      <div class="scene mode-${G.mode} ${lux ? 'lux' : ''}" id="scene">
        <div class="wall"><div class="sign">${esc(b.name)}</div>${decorHtml(b)}</div>
        <div class="kitchen"><div class="equipart">${equipArt(b)}</div><div id="stations" class="row" style="align-items:flex-end;justify-content:center"></div><div id="emptyst" class="row"></div></div>
        <div class="counter"></div>
        <div class="floor"><div class="queue" id="queue"></div></div>
        <div id="tezgah"></div>
        ${closing ? '<div class="closed-overlay">Kepenk indi</div>' : ''}
      </div>
      <aside class="side">
        <div class="panel stack"><div class="row between"><div class="clock" id="clock">${closing ? '23:00' : '10:00'}</div><div class="jar" title="Bahşiş kavanozu"><i id="jar" style="height:0%"></i></div></div>
          ${closing ? '<button class="btn big green" data-a="showClosing">Kapanış raporu</button>' : `<div class="speed" role="group" aria-label="Oyun hızı">
            ${[0, 1, 2, 4].map((v) => `<button class="btn sm ${G.speed === v ? 'on' : 'ghost'}" data-a="speed" data-v="${v}">${v === 0 ? 'Dur' : v + '×'}</button>`).join('')}</div>`}
        </div>
        <div class="panel stack" id="livestats"></div>
        ${closing ? '' : `<div class="panel stack"><button class="btn gold" id="tezgahBtn" data-a="tezgah">Tezgâha geç</button>
          <p class="tiny muted">Tezgâhtayken siparişleri kendin hazırlarsın. Doğru ve hızlı hazırlanan sipariş daha çok bahşiş getirir; bir çalışan da mola verir.</p>
          <button class="btn sm ghost" data-a="fastForward">Günü hızlı bitir</button></div>`}
      </aside>
    </div>`;
  }

  /* Canlı sahne güncelleme */
  let loopAcc = 0, lastT = 0;
  UI.sceneInit = function () {
    const st = document.getElementById('stations');
    if (st) st.innerHTML = '';
    const q = document.getElementById('queue');
    if (q) q.innerHTML = '';
    UI.sceneUpdate();
    renderTezgah();
  };
  UI.startLoop = function () {
    if (UI.timer) return;
    lastT = performance.now();
    UI.timer = setInterval(loop, 50);
  };
  function loop() {
    const now = performance.now();
    const dt = Math.min(200, now - lastT); lastT = now;
    if (!G || G.phase !== 'service' || screen !== 'shop' || document.querySelector('.modal-bg')) return;
    const b = B(), L = G.live[b.id];
    if (!G.speed) return;
    loopAcc += dt * G.speed;
    let ticked = false;
    while (loopAcc >= 250) {
      loopAcc -= 250;
      KE.tick(G, b, L, false);
      ticked = true;
      if (L.done) break;
    }
    if (ticked) {
      if (L.player.active && !L.player.order && KE.playerTake(G)) renderTezgah();
      UI.sceneUpdate();
    }
    if (L.done) {
      KE.finishService(G);
      UI.render();
      showClosing();
    }
  }
  UI.sceneUpdate = function () {
    const b = B(), L = G.live && G.live[b.id];
    if (!L) return;
    const stWrap = document.getElementById('stations');
    if (!stWrap) return;
    const cooks = KE.activeCooks(G, b);
    const breakers = KE.branchStaff(G, b).filter((s) => s.onBreak);
    const want = cooks.map((s) => s.id).concat(breakers.map((s) => s.id));
    if (L.player.active) want.push('player');
    [...stWrap.children].forEach((el) => { if (!want.includes(el.dataset.id)) el.remove(); });
    want.forEach((id) => {
      let el = stWrap.querySelector(`[data-id="${id}"]`);
      const s = id === 'player' ? null : G.staff.find((x) => x.id === id);
      const mood = s ? KE.moodFromValue(s.morale) : 'happy';
      if (!el) {
        el = document.createElement('div');
        el.className = 'station' + (id === 'player' ? ' player' : '');
        el.dataset.id = id;
        el.innerHTML = `<div class="job"></div><div class="pt"></div><div class="nm"></div><div class="prog"><i></i></div>`;
        stWrap.appendChild(el);
      }
      if (el.dataset.mood !== mood) {
        const look = s ? KE.staffLook(s) : ownerLook();
        el.querySelector('.pt').innerHTML = KE.portrait(look, { mood, label: s ? s.name : G.owner });
        el.dataset.mood = mood;
      }
      el.querySelector('.nm').textContent = s ? s.name : G.owner + ' (sen)';
      el.classList.toggle('break', !!(s && s.onBreak));
      const job = s ? L.cooks[s.id] : null;
      const c = job ? L.queue.find((x) => x.id === job.cid) : (id === 'player' && L.player.order ? L.queue.find((x) => x.id === L.player.order) : null);
      el.querySelector('.job').textContent = s && s.onBreak ? 'Molada' : c ? pn(c.pid) + (c.count > 1 ? ' ×' + c.count : '') : 'Hazır';
      el.querySelector('.prog i').style.width = job ? (100 * (1 - job.remain / job.total)) + '%' : '0%';
    });
    const empty = KE.equip(G, b, 'cook').stations - cooks.length - (L.player.active ? 0 : 0);
    const es = document.getElementById('emptyst');
    if (es) es.innerHTML = empty > 0 ? new Array(empty).fill('<div class="station empty">Boş ocak<br>usta al</div>').join('') : '';
    /* müşteriler */
    const q = document.getElementById('queue');
    const scene = document.getElementById('scene');
    const ids = L.queue.map((c) => String(c.id));
    L.fx.forEach((f) => {
      let anchor = f.cid ? q.querySelector(`[data-id="${f.cid}"]`) : null;
      if (!anchor && f.cook) anchor = stWrap.querySelector(`[data-id="${f.cook}"]`);
      const sr = scene.getBoundingClientRect();
      const r = anchor ? anchor.getBoundingClientRect() : { left: sr.left + sr.width / 2, top: sr.top + sr.height * 0.7, width: 0 };
      const x = r.left - sr.left + (r.width || 0) / 2 - 30, y = r.top - sr.top;
      if (f.t === 'served') {
        spawnFx(scene, x, y, '+' + KE.tl(f.pay), '');
        if (f.tip > 0) setTimeout(() => spawnFx(scene, x + 10, y - 18, 'Bahşiş +' + KE.tl(f.tip), 'tip'), 250);
        spawnFx(scene, x - 10, y + 20, f.text, f.match ? 'match' : f.sat < 50 ? 'bad' : '');
      } else spawnFx(scene, x, y, f.text, 'bad');
    });
    L.fx = [];
    [...q.children].forEach((el) => { if (!ids.includes(el.dataset.id)) el.remove(); });
    const shown = L.queue.slice(0, 14);
    shown.forEach((c) => {
      let el = q.querySelector(`[data-id="${c.id}"]`);
      const ratio = c.cookId || c.player ? 1 : clamp(1 - c.wait / c.patience, 0, 1);
      const mood = ratio < 0.3 ? 'angry' : ratio < 0.6 ? 'neutral' : 'happy';
      if (!el) {
        el = document.createElement('div');
        el.className = 'cust'; el.dataset.id = c.id;
        el.innerHTML = `${c.count > 1 ? `<span class="grp">×${c.count}</span>` : ''}<div class="pt"></div><div class="order"></div><div class="pat"><i></i></div>`;
        q.appendChild(el);
      }
      if (el.dataset.mood !== mood && c.look) { el.querySelector('.pt').innerHTML = KE.portrait(c.look, { mood, label: KE.CUSTOMER_TYPES[c.type].name }); el.dataset.mood = mood; }
      const o = el.querySelector('.order');
      o.textContent = pn(c.pid);
      o.className = 'order' + (c.player ? ' me' : c.cookId ? ' cook' : '');
      const bar = el.querySelector('.pat i');
      bar.style.width = (ratio * 100) + '%';
      bar.style.background = ratio < 0.3 ? 'var(--biber)' : ratio < 0.6 ? 'var(--kor)' : 'var(--nane)';
    });
    /* yan panel */
    const S = L.stats;
    const clockEl = document.getElementById('clock');
    if (clockEl) clockEl.textContent = KE.clock(Math.min(L.minute, KE.MINUTES));
    const jar = document.getElementById('jar');
    if (jar) jar.style.height = Math.min(100, S.tips / Math.max(1, L.expected * 9) * 100) + '%';
    const ls = document.getElementById('livestats');
    if (ls) {
      const outs = Object.keys(S.stockouts);
      ls.innerHTML = `<div class="kpis" style="grid-template-columns:1fr 1fr"><div class="kpi"><div class="l">Ciro</div><div class="v">${KE.tl(S.revenue)}</div></div><div class="kpi"><div class="l">Bahşiş</div><div class="v">${KE.tl(S.tips)}</div></div><div class="kpi"><div class="l">Servis</div><div class="v">${S.served}</div></div><div class="kpi"><div class="l">Kaçan</div><div class="v" style="color:${S.lost ? 'var(--biber)' : 'inherit'}">${S.lost}</div></div></div>
        <div class="statline" style="grid-template-columns:90px 1fr 34px"><span>Memnuniyet</span><div class="bar"><i style="width:${S.satN ? S.satSum / S.satN : 0}%"></i></div><span class="num">${S.satN ? Math.round(S.satSum / S.satN) : '–'}</span></div>
        <div class="small">Sırada: <b>${L.queue.length}</b> · Eşleşme: <b>${S.matches}</b>${outs.length ? `<br><span class="negv">Biten: ${outs.map(pn).join(', ')}</span>` : ''}</div>`;
    }
    const tb = document.getElementById('tezgahBtn');
    if (tb) { tb.textContent = L.player.active ? 'Tezgâhtan çık' : 'Tezgâha geç'; }
  };
  function spawnFx(scene, x, y, text, cls) {
    const f = document.createElement('div');
    f.className = 'fx ' + (cls || '');
    f.style.left = Math.max(4, x) + 'px'; f.style.top = Math.max(4, y) + 'px';
    f.textContent = text;
    scene.appendChild(f);
    setTimeout(() => f.remove(), 1500);
  }
  function ownerLook() {
    if (!G.ownerLook) G.ownerLook = Object.assign(KE.randomLook(Math.random() < 0.5 ? 'e' : 'k', 'orta'), { outfit: 'onluk', outfitColor: '#d7263d', shirt: '#fdfefe', logo: true, accent: '#ffc93c', head: 'none' });
    return G.ownerLook;
  }
  function renderTezgah() {
    const box = document.getElementById('tezgah');
    if (!box || !G.live) return;
    const L = G.live[B().id];
    const P = L.player;
    if (!P.active) { box.innerHTML = ''; return; }
    const c = P.order ? L.queue.find((x) => x.id === P.order) : null;
    if (!c) { box.innerHTML = `<div class="tezgah"><b>Tezgâhtasın.</b> <span class="muted">Sıradaki sipariş gelince burada belirecek.</span></div>`; return; }
    const p = prod(c.pid);
    box.innerHTML = `<div class="tezgah"><div class="row between"><div><span class="eyebrow">Sipariş</span><h3 style="font-size:22px">${p.name}${c.count > 1 ? ' ×' + c.count : ''}</h3><span class="small muted">${KE.CUSTOMER_TYPES[c.type].name} müşteri · Hata: ${P.errors}</span></div>
      <div class="done-steps">${p.steps.map((s, i) => `<span class="tag ${i < P.step ? 'gr' : ''}">${i + 1}. ${i < P.step ? s : '?'}</span>`).join('')}</div></div>
      <div class="steps" id="stepbtns">${P.opts.map((o) => `<button class="btn sm ${p.steps.indexOf(o) > -1 && p.steps.indexOf(o) < P.step ? 'ghost' : 'blue'}" data-a="step" data-l="${esc(o)}" ${p.steps.indexOf(o) > -1 && p.steps.indexOf(o) < P.step ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
      <span class="tiny muted">Adımları doğru sırayla seç.</span></div>`;
  }

  /* ---------- Kapanış ---------- */
  function showClosing() {
    const S0 = G.lastSummary;
    const b = B();
    const sum = S0.branches[b.id];
    const S = sum.stats;
    const st = KE.branchStaff(G, b);
    const rule = UI.todayRule || G.tipRule;
    const prods = Object.entries(S.byProduct).sort((a, c) => c[1] - a[1]);
    const maxP = Math.max(1, ...prods.map((x) => x[1]));
    const others = G.branches.filter((x) => x.id !== b.id);
    const preview = (() => {
      if (rule === 'kasa' || !st.length) return st.map((s) => [s, 0]);
      const w = st.map((s) => [s, rule === 'usta' ? (s.role === 'usta' ? 2 : 1) : rule === 'performans' ? Math.max(0.2, s.servedToday) : 1]);
      const tot = w.reduce((a, x) => a + x[1], 0);
      return w.map(([s, v]) => [s, S.tips * v / tot]);
    })();
    const html = `<div class="row between"><div><span class="eyebrow">${KE.dateStr(G.day)} · ${KE.weekday(G.day)}</span><h2>Gün sonu raporu</h2></div><div class="avatar lg">${KE.portrait(KE.CAST.zeynep.look, { mood: sum.sat > 70 ? 'happy' : 'neutral', label: 'Zeynep Hanım' })}</div></div>
      <div class="kpis">
        <div class="kpi"><div class="l">Ciro (KDV dahil)</div><div class="v">${KE.tl(S.revenue)}</div></div>
        <div class="kpi"><div class="l">Malzeme alımı</div><div class="v">${KE.tl(sum.purchases)}</div></div>
        <div class="kpi"><div class="l">Müşteri</div><div class="v">${S.served}</div></div>
        <div class="kpi"><div class="l">Memnuniyet</div><div class="v">%${Math.round(sum.sat)}</div></div>
        <div class="kpi"><div class="l">Bahşiş kavanozu</div><div class="v">${KE.tl(S.tips)}</div></div>
        <div class="kpi"><div class="l">Fire</div><div class="v">${KE.tl(sum.wasteVal)}</div></div>
      </div>
      <div class="small">Kaçan müşteri: <b>${S.lost}</b> (bekleme ${S.lostWait}, fiyat ${S.lostPrice}, yer yok ${S.lostFull}, stok ${S.lostStock})${sum.paket ? ` · Paket servis: <b>${sum.paket}</b> sipariş, ${KE.tl(sum.paketRev)}` : ''} · Uzman eşleşmesi: <b>${S.matches}</b></div>
      <div class="cols"><div><h4 style="margin-bottom:4px">Saatlik ciro</h4>${barChart(S.hourly, S.hourly.map((_, i) => String(KE.OPEN_HOUR + i)), { money: true, h: 150, label: 'Saatlik ciro' })}</div>
        <div><h4 style="margin-bottom:6px">Satılan ürünler</h4>${prods.map(([pid, n]) => `<div class="statline" style="grid-template-columns:110px 1fr 34px"><span class="small">${pn(pid)}</span><div class="bar or"><i style="width:${n / maxP * 100}%"></i></div><span class="num small">${n}</span></div>`).join('') || '<span class="muted">Satış yok</span>'}</div></div>
      ${others.length ? `<div><h4 style="margin-bottom:6px">Diğer şubeler (arka planda yönetildi)</h4><div class="grid">${others.map((o) => { const os = S0.branches[o.id]; const mgr = KE.branchStaff(G, o).find((s) => s.role === 'mudur'); return `<div class="kpi"><div class="l">${esc(o.name)}</div><div class="v">${KE.tl(os.stats.revenue)}</div><div class="small">${os.stats.served} müşteri · %${Math.round(os.sat)} memnuniyet · bahşiş ${KE.tl(os.stats.tips)}<br>${mgr ? 'Müdür: ' + esc(mgr.name) : '<span class="negv">Müdür yok</span>'}</div></div>`; }).join('')}</div></div>` : ''}
      <div class="panel" style="background:var(--kagit-2);box-shadow:none"><h3>Bahşiş dağıtımı</h3>
        <div class="row">${Object.entries(KE.TIP_RULES).map(([k, r]) => `<button class="btn sm ${rule === k ? 'green' : 'ghost'}" data-a="tipToday" data-r="${k}">${r.name}${k === G.tipRule ? ' (varsayılan)' : ''}</button>`).join('')}</div>
        <p class="small">${KE.TIP_RULES[rule].desc} ${rule !== G.tipRule ? '<b>Yalnızca bugün için geçerli.</b>' : ''}</p>
        <div class="tablewrap"><table><thead><tr><th>Çalışan</th><th>Rol</th><th class="r">Servis</th><th class="r">Bahşiş payı</th></tr></thead><tbody>${preview.map(([s, v]) => `<tr><td>${esc(s.name)}</td><td>${roleName(s)}</td><td class="r">${Math.round(s.servedToday)}</td><td class="r">${KE.tl(v)}</td></tr>`).join('')}</tbody></table></div>
      </div>
      <div class="acts"><button class="btn big green" data-a="finalize">Bahşişi dağıt ve günü kapat</button></div>`;
    document.querySelectorAll('.modal-bg').forEach((m) => m.remove());
    UI.modal(html, { wide: true });
  }
  UI.showClosing = showClosing;

  function afterDay(out) {
    UI.todayRule = null;
    const ups = out.levelUps.map((u) => `<li><b>${esc(u.name)}</b> ${pn(u.pid)} yapımında ${stars(u.star)} seviyesine çıktı${u.mentor ? ` (${esc(u.mentor)} sayesinde)` : ''}.</li>`).join('');
    const quits = out.quits.map((q) => `<li class="negv">${esc(q.name)} (${q.branch}) istifa etti.</li>`).join('');
    const goals = (out.goals || []).map((g) => `<li class="pos">Hedef tamamlandı: <b>${g.name}</b> · ödül ${KE.tl(g.reward)}</li>`).join('');
    const b = B();
    const st = KE.branchStaff(G, b);
    const ent = out.branches[b.id];
    const html = `<span class="eyebrow">${KE.dateStr(G.day - 1)}</span><h2>Günlük</h2>
      <div class="journal">${esc(out.journal)}</div>
      <div class="kpis"><div class="kpi"><div class="l">Günlük net (tahmini)</div><div class="v ${ent.net >= 0 ? 'pos' : 'negv'}">${KE.tl(ent.net)}</div><div class="tiny muted">Ciro (KDV hariç) − malzeme − günlük sabit gider payı ${KE.tl(ent.fixed)}</div></div><div class="kpi"><div class="l">İtibar</div><div class="v">${Math.round(G.reputation)}</div></div><div class="kpi"><div class="l">Kasa</div><div class="v">${KE.tl(G.cash)}</div></div></div>
      <div><h4 style="margin-bottom:6px">Ekibin morali</h4><div class="row">${st.map((s) => `<div class="stack" style="align-items:center;gap:0;width:86px"><div class="avatar">${KE.portrait(KE.staffLook(s), { mood: KE.moodFromValue(s.morale), label: s.name })}</div><span class="tiny" style="text-align:center">${esc(s.name)}</span><span class="tiny ${s.moraleDelta >= 0 ? 'pos' : 'negv'}">${s.moraleDelta >= 0 ? '+' : ''}${KE.num(s.moraleDelta || 0, 1)} · ${KE.tl(s.tipsToday || 0)}</span></div>`).join('')}</div></div>
      ${ups || quits || goals ? `<ul>${goals}${ups}${quits}</ul>` : ''}
      <div class="acts"><button class="btn big green" data-a="closeAfterDay">Yeni güne başla</button></div>`;
    UI.modal(html, { wide: true });
    if (out.month) queueModal(() => UI.modal(monthReportHtml(out.month) + '<div class="acts"><button class="btn big green" data-a="closeModal">Tamam</button></div>', { wide: true }));
    if (out.news) queueModal(() => UI.modal(newsHtml(out.news) + '<div class="acts"><button class="btn big green" data-a="closeModal">Gazeteyi katla</button></div>', { wide: true }));
  }

  function newsHtml(n) {
    return `<div class="paper"><div class="mast">Mahalle Postası</div><div class="row between tiny" style="border-bottom:1px solid #b9ab8f;padding:4px 0"><span>Sayı ${n.issue}</span><span>${n.date}</span><span>Fiyatı: 15 ₺</span></div>
      <div class="cols2">${n.headlines.map((h) => `<article><h4>${esc(h.title)}</h4><p class="small">${esc(h.body)}</p></article>`).join('')}</div></div>`;
  }
  function monthReportHtml(m) {
    const line = (l, v, cls) => `<tr class="${cls || ''}"><td>${l}</td><td class="r">${KE.tl(v)}</td></tr>`;
    return `<span class="eyebrow">Aylık kapanış</span><h2>${m.name} bilançosu</h2>
      <div class="kpis"><div class="kpi"><div class="l">Ciro (KDV dahil)</div><div class="v">${KE.tl(m.revenue)}</div></div><div class="kpi"><div class="l">Müşteri</div><div class="v">${KE.num(m.customers)}</div></div><div class="kpi"><div class="l">Personel maliyeti</div><div class="v">${KE.tl(m.personnel)}</div></div><div class="kpi"><div class="l">Aylık net</div><div class="v ${m.net >= 0 ? 'pos' : 'negv'}">${KE.tl(m.net)}</div></div></div>
      <div class="cols"><div class="tablewrap"><table><tbody>
        ${line('Brüt ciro (KDV dahil)', m.revenue)}${line('− Hesaplanan KDV (%10)', -m.kdvOut)}${line('+ İndirilecek KDV (gıda alımları, %1)', m.kdvIn)}${line('= Ödenecek KDV', -m.kdv, 'total')}
        ${line('− Malzeme alımları', -m.purchases)}${line('− Personel (bordro toplam maliyeti)', -m.personnel)}${line('− Kira (ev sahibine net)', -m.rentNet)}${line('− Kira stopajı (%20, vergi dairesine)', -m.stopaj)}
        ${line('− Elektrik, su, doğalgaz, internet', -m.util)}${line('− Muhasebeci', -m.accountant)}${m.loan ? line('− Kredi taksitleri', -m.loan) : ''}${m.ads ? line('− Reklam', -m.ads) : ''}${m.fines ? line('− İdari para cezaları', -m.fines) : ''}${m.other ? line('− Diğer giderler / gelirler', -m.other) : ''}
        ${line('= Aylık net sonuç', m.net, 'total')}
        ${m.capex ? line('Yatırım harcamaları (ekipman, dekor, şube)', m.capex) : ''}
        ${line('Bahşişler (çalışanlara dağıtıldı)', m.tips)}
      </tbody></table></div>
      <div class="stack"><h4>Şube bazında</h4>${m.branches.map((b) => `<div class="kpi"><div class="l">${esc(b.name)}</div><div class="v ${b.result >= 0 ? 'pos' : 'negv'}">${KE.tl(b.result)}</div><div class="tiny muted">Ciro ${KE.tl(b.revenue)} · personel ${KE.tl(b.staffCost)} · kira ${KE.tl(b.rent)}</div></div>`).join('')}
      ${m.bonus ? `<div class="tag gd">${m.bonus} ikramiyesi ödendi</div>` : ''}</div></div>
      <h4>Bordro</h4>${payrollTable(m.payroll)}`;
  }
  function payrollTable(rows) {
    const tot = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
    const cols = [['base', 'Temel brüt'], ['fm', 'Fazla mesai'], ['brut', 'Toplam brüt'], ['sgkI', 'SGK işçi %14'], ['issI', 'İşsizlik işçi %1'], ['gv', 'Gelir vergisi'], ['damga', 'Damga'], ['net', 'Net ele geçen'], ['sgkV', 'SGK işveren'], ['issV', 'İşsizlik işveren %2'], ['yol', 'Yol'], ['ikramiye', 'İkramiye'], ['total', 'Toplam maliyet'], ['tips', 'Bahşiş (ay)']];
    return `<div class="tablewrap"><table><thead><tr><th>Çalışan</th><th>Rol</th>${cols.map((c) => `<th class="r">${c[1]}</th>`).join('')}</tr></thead><tbody>
      ${rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${r.role === 'usta' ? 'Usta' : KE.ROLES[r.role].name}</td>${cols.map((c) => `<td class="r">${KE.tl(r[c[0]])}</td>`).join('')}</tr>`).join('')}
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
    UI.modal(`<span class="eyebrow">Olay</span><div class="evcard"><div class="avatar">${KE.portrait(look, { mood: 'neutral', label: name })}</div><div class="stack"><h2>${esc(e.title)}</h2><p>${esc(e.text)}</p></div></div>
      <div class="stack">${e.choices.map((c, i) => `<button class="btn choice ${i === 0 ? 'green' : i === 1 ? 'blue' : 'ghost'}" data-a="eventChoice" data-i="${i}">${esc(c.label)}<small>${esc(c.desc)}</small></button>`).join('')}</div>`);
  }

  /* ---------- Muhasebe ---------- */
  SCREENS.office = () => {
    const tab = params.tab || 'ozet';
    const tabs = [['ozet', 'Özet'], ['gunluk', 'Günlük'], ['haftalik', 'Haftalık'], ['aylik', 'Aylık'], ['bordro', 'Bordro'], ['bahsis', 'Bahşiş kuralı'], ['subeler', 'Şubeler']];
    return `<main class="screen">${back('Muhasebe Ofisi')}
      ${npcHead('zeynep')}
      <div><div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-a="go" data-s="office" data-tab="${k}">${l}</button>`).join('')}</div>
      <div class="panel tabbody stack">${OFFICE[tab]()}</div></div></main>`;
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
    const days = G.ledger.days;
    const byDay = {};
    days.forEach((d) => { byDay[d.day] = byDay[d.day] || { rev: 0, net: 0, pur: 0 }; byDay[d.day].rev += d.revenue; byDay[d.day].net += d.net; byDay[d.day].pur += d.purchases; });
    const keys = Object.keys(byDay).map(Number).sort((a, b) => a - b).slice(-30);
    const mtd = monthToDate();
    const personnel = mtd.pay.reduce((a, p) => a + p.total, 0);
    const rent = G.branches.reduce((a, b) => a + b.rent, 0);
    const util = G.branches.reduce((a, b) => a + KE.utilities(G, b), 0);
    return `<div class="kpis">
        <div class="kpi"><div class="l">Kasa</div><div class="v">${KE.tl(G.cash)}</div></div>
        <div class="kpi"><div class="l">${KE.monthName(mtd.key)} cirosu</div><div class="v">${KE.tl(mtd.rev)}</div></div>
        <div class="kpi"><div class="l">Ay içi malzeme</div><div class="v">${KE.tl(mtd.pur)}</div></div>
        <div class="kpi"><div class="l">Aylık bordro (tahmini)</div><div class="v">${KE.tl(personnel)}</div></div>
        <div class="kpi"><div class="l">Kira + fatura</div><div class="v">${KE.tl(rent + util)}</div></div>
        <div class="kpi"><div class="l">Kredi borcu</div><div class="v">${KE.tl(G.loans.reduce((a, l) => a + l.monthly * l.remaining, 0))}</div></div>
      </div>
      <h3>Son ${keys.length} gün</h3>
      ${keys.length ? lineChart([{ name: 'Ciro', color: '#f28c28', values: keys.map((k) => byDay[k].rev), area: true }, { name: 'Malzeme', color: '#2f6fb5', values: keys.map((k) => byDay[k].pur) }, { name: 'Günlük net (sabit gider payı düşülmüş)', color: '#23a26d', values: keys.map((k) => byDay[k].net) }], keys.map((k) => { const d = KE.dateOf(k); return d.getUTCDate() + '/' + (d.getUTCMonth() + 1); }), { label: 'Günlük ciro ve net' }) : '<p class="muted">Henüz kapanmış gün yok. İlk günü bitirince grafikler burada görünecek.</p>'}
      <p class="small muted">Ay sonu kapanışında bordro, kira, stopaj, faturalar, KDV ve kredi taksitleri kasadan düşülür. Ayın son günü: ${KE.dateStr(G.day + [...Array(31).keys()].find((i) => KE.isMonthEnd(G.day + i)))}.</p>`;
  };
  OFFICE.gunluk = () => {
    const days = G.ledger.days.slice().reverse().slice(0, 40);
    const sel = params.day ? G.ledger.days.filter((d) => d.day === +params.day) : null;
    let detail = '';
    if (sel && sel.length) {
      const d = sel.find((x) => x.branchId === (params.b || sel[0].branchId)) || sel[0];
      const prods = Object.entries(d.byProduct).sort((a, c) => c[1] - a[1]);
      detail = `<div class="panel" style="background:var(--kagit-2);box-shadow:none"><h3>${d.date} · ${esc((G.branches.find((b) => b.id === d.branchId) || {}).name || '')}</h3>
        <div class="cols"><div>${barChart(d.hourly, d.hourly.map((_, i) => String(KE.OPEN_HOUR + i)), { money: true, h: 150, label: 'Saatlik ciro' })}</div>
        <div class="tablewrap"><table><tbody>
          <tr><td>Ciro (kart / nakit)</td><td class="r">${KE.tl(d.card)} / ${KE.tl(d.cash)}</td></tr>
          <tr><td>Paket servis</td><td class="r">${d.paket} sipariş · ${KE.tl(d.paketRev)}</td></tr>
          <tr><td>Malzeme alımı (sarf dahil)</td><td class="r">${KE.tl(d.purchases)}</td></tr><tr><td>Ambalaj ve sarf</td><td class="r">${KE.tl(d.sarf || 0)}</td></tr>
          <tr><td>Fire</td><td class="r">${KE.tl(d.waste)}</td></tr>
          <tr><td>Günlük sabit gider payı</td><td class="r">${KE.tl(d.fixed)}</td></tr>
          <tr><td>Bahşiş (${KE.TIP_RULES[d.tipRule].name})</td><td class="r">${KE.tl(d.tips)}</td></tr>
          <tr class="total"><td>Günlük net</td><td class="r">${KE.tl(d.net)}</td></tr>
        </tbody></table></div></div>
        <div class="row" style="margin-top:8px">${prods.map(([pid, n]) => `<span class="tag or">${pn(pid)}: ${n}</span>`).join(' ')}</div></div>`;
    }
    return `${detail}<div class="tablewrap"><table><thead><tr><th>Tarih</th><th>Şube</th><th class="r">Müşteri</th><th class="r">Kaçan</th><th class="r">Ciro</th><th class="r">Malzeme</th><th class="r">Bahşiş</th><th class="r">Memnuniyet</th><th class="r">Net</th></tr></thead><tbody>
      ${days.map((d) => `<tr class="click" data-a="go" data-s="office" data-tab="gunluk" data-day="${d.day}" data-b="${d.branchId}"><td>${d.date}</td><td>${esc((G.branches.find((b) => b.id === d.branchId) || {}).name || '')}</td><td class="r">${d.served}</td><td class="r">${d.lost}</td><td class="r">${KE.tl(d.revenue)}</td><td class="r">${KE.tl(d.purchases)}</td><td class="r">${KE.tl(d.tips)}</td><td class="r">%${Math.round(d.sat)}</td><td class="r ${d.net >= 0 ? 'pos' : 'negv'}">${KE.tl(d.net)}</td></tr>`).join('') || '<tr><td colspan="9" class="muted">Henüz kayıt yok.</td></tr>'}
    </tbody></table></div><p class="small muted">Bir satıra tıklayınca o günün saatlik dökümü açılır.</p>`;
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
      <div class="tablewrap"><table><thead><tr><th>Hafta</th><th>Başlangıç</th><th class="r">Müşteri</th><th class="r">Kaçan</th><th class="r">Ciro</th><th class="r">Malzeme</th><th class="r">Bahşiş</th><th class="r">Memnuniyet</th><th>En çok satan</th><th class="r">Net</th></tr></thead><tbody>
      ${list.map((w) => { const top = Object.entries(w.prods).sort((a, b) => b[1] - a[1])[0]; return `<tr><td>${w.w}. hafta</td><td>${KE.dateStr(w.start)}</td><td class="r">${w.served}</td><td class="r">${w.lost}</td><td class="r">${KE.tl(w.rev)}</td><td class="r">${KE.tl(w.pur)}</td><td class="r">${KE.tl(w.tips)}</td><td class="r">%${w.satN ? Math.round(w.satS / w.satN) : 0}</td><td>${top ? pn(top[0]) : '–'}</td><td class="r ${w.net >= 0 ? 'pos' : 'negv'}">${KE.tl(w.net)}</td></tr>`; }).join('') || '<tr><td colspan="10" class="muted">Henüz kayıt yok.</td></tr>'}
      </tbody></table></div>`;
  };
  OFFICE.aylik = () => {
    const ms = G.ledger.months;
    if (params.m != null && ms[+params.m]) return `<button class="btn sm ghost" data-a="go" data-s="office" data-tab="aylik">← Bütün aylar</button>` + monthReportHtml(ms[+params.m]);
    const mtd = monthToDate();
    const personnel = mtd.pay.reduce((a, p) => a + p.total, 0);
    const rent = G.branches.reduce((a, b) => a + b.rent, 0), util = G.branches.reduce((a, b) => a + KE.utilities(G, b), 0);
    const kdv = Math.max(0, mtd.rev * 0.1 / 1.1 - mtd.pur * 0.01 / 1.01);
    return `<div class="panel" style="background:var(--kagit-2);box-shadow:none"><h3>${KE.monthName(mtd.key)} (devam ediyor, tahmini)</h3>
      <div class="kpis"><div class="kpi"><div class="l">Ciro (şimdiye kadar)</div><div class="v">${KE.tl(mtd.rev)}</div></div><div class="kpi"><div class="l">Malzeme</div><div class="v">${KE.tl(mtd.pur)}</div></div><div class="kpi"><div class="l">KDV (tahmini)</div><div class="v">${KE.tl(kdv)}</div></div><div class="kpi"><div class="l">Ay sonu sabit gider</div><div class="v">${KE.tl(personnel + rent + util + KE.ECON.muhasebeci)}</div></div></div></div>
      <div class="tablewrap"><table><thead><tr><th>Ay</th><th class="r">Ciro</th><th class="r">KDV</th><th class="r">Malzeme</th><th class="r">Personel</th><th class="r">Kira</th><th class="r">Fatura</th><th class="r">Net</th></tr></thead><tbody>
      ${ms.map((m, i) => `<tr class="click" data-a="go" data-s="office" data-tab="aylik" data-m="${i}"><td><b>${m.name}</b></td><td class="r">${KE.tl(m.revenue)}</td><td class="r">${KE.tl(m.kdv)}</td><td class="r">${KE.tl(m.purchases)}</td><td class="r">${KE.tl(m.personnel)}</td><td class="r">${KE.tl(m.rent)}</td><td class="r">${KE.tl(m.util)}</td><td class="r ${m.net >= 0 ? 'pos' : 'negv'}">${KE.tl(m.net)}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">İlk ay sonu kapanışından sonra raporlar burada listelenir.</td></tr>'}
      </tbody></table></div>`;
  };
  OFFICE.bordro = () => {
    const mtd = monthToDate();
    return `<h3>${KE.monthName(mtd.key)} bordrosu (önizleme)</h3><p class="small">Asgari ücret (brüt): <b>${KE.tl(KE.ECON.asgariBrut)}</b> · ${KE.bonusMonths[mtd.key] ? `<span class="tag gd">Bu ay ${KE.bonusMonths[mtd.key]} ikramiyesi var</span>` : ''} ${G.payLate ? '<span class="tag rd">Kasa eksi: SGK teşviki kaybedildi</span>' : '<span class="tag gr">5 puanlık SGK teşviki uygulanıyor</span>'}</p>
      ${payrollTable(mtd.pay)}`;
  };
  OFFICE.bahsis = () => `<p>Varsayılan kural her gün kendiliğinden uygulanır. Gün sonu raporunda yalnızca o gün için başka bir kural seçebilirsin.</p>
    <div class="grid">${Object.entries(KE.TIP_RULES).map(([k, r]) => `<div class="card ${G.tipRule === k ? 'sel' : ''}"><h4 style="font-family:var(--f-display);font-size:19px">${r.name}</h4><p class="small">${r.desc}</p><div class="foot"><span></span><button class="btn sm ${G.tipRule === k ? 'green' : ''}" data-a="tipRule" data-r="${k}">${G.tipRule === k ? 'Varsayılan' : 'Varsayılan yap'}</button></div></div>`).join('')}</div>`;
  OFFICE.subeler = () => {
    const mtd = monthToDate();
    return `<div class="tablewrap"><table><thead><tr><th>Şube</th><th>Semt</th><th class="r">Personel</th><th class="r">Ay içi ciro</th><th class="r">Ay içi müşteri</th><th class="r">Kira</th><th class="r">Fatura</th><th class="r">Bordro</th><th>Müdür</th></tr></thead><tbody>
      ${G.branches.map((b) => { const bd = mtd.days.filter((d) => d.branchId === b.id); const st = KE.branchStaff(G, b); const pay = mtd.pay.filter((p) => st.some((s) => s.id === p.id)).reduce((a, p) => a + p.total, 0); const mgr = st.find((s) => s.role === 'mudur'); return `<tr><td><b>${esc(b.name)}</b></td><td>${KE.district(b).name}</td><td class="r">${st.length}</td><td class="r">${KE.tl(bd.reduce((a, d) => a + d.revenue, 0))}</td><td class="r">${bd.reduce((a, d) => a + d.served, 0)}</td><td class="r">${KE.tl(b.rent)}</td><td class="r">${KE.tl(KE.utilities(G, b))}</td><td class="r">${KE.tl(pay)}</td><td>${mgr ? esc(mgr.name) : '–'}</td></tr>`; }).join('')}
      </tbody></table></div>`;
  };

  /* ---------- Hal ---------- */
  SCREENS.hal = () => {
    const b = B(); const M = MODE();
    const mods = G.mods.filter((m) => m.key.startsWith('ing'));
    return `<main class="screen">${back('Hal ve Kasap · ' + esc(b.name))}${npcHead('riza')}
      <div class="panel"><h3>Tedarik kalitesi</h3><div class="grid">${KE.TIERS.map((t, i) => `<div class="card ${b.tier === i ? 'sel' : ''}"><h4 style="font-family:var(--f-display);font-size:20px">${t.name}</h4><p class="small">${t.desc}</p><div class="small">Fiyat ×${t.mul} · kalite ${t.quality >= 0 ? '+' : ''}${t.quality}</div><div class="foot"><span></span><button class="btn sm ${b.tier === i ? 'green' : ''}" data-a="tier" data-i="${i}">${b.tier === i ? 'Seçili' : 'Bununla çalış'}</button></div></div>`).join('')}</div></div>
      <div class="panel"><div class="row between"><h3>Otomatik sabah siparişi</h3><div class="row">${[[0.85, 'Az'], [1.15, 'Normal'], [1.5, 'Bol']].map(([v, l]) => `<button class="btn sm ${Math.abs(b.stockLevel - v) < 0.01 ? 'green' : 'ghost'}" data-a="stockLevel" data-v="${v}">${l}</button>`).join('')}</div></div>
        <p class="small muted">Rıza her sabah stoğu son günlerin ortalama kullanımının bu katına tamamlar. Az stok fireyi azaltır ama ürün bitebilir; bol stok fireyi artırır.</p>
        ${mods.length ? `<p class="small"><b>Fiyat etkileri:</b> ${mods.map((m) => `<span class="tag rd">${m.label} ×${m.mult} (${m.days} gün)</span>`).join(' ')}</p>` : ''}
        <div class="tablewrap"><table><thead><tr><th>Malzeme</th><th class="r">Birim fiyat</th><th class="r">Stok</th><th class="r">Günlük kullanım</th><th>Ek alım</th></tr></thead><tbody>
        ${Object.entries(M.ingredients).map(([k, ing]) => { const u = b.usage[k] || 0; const step = ing.unit === 'kg' ? Math.max(1, Math.round(u * 0.25)) : Math.max(10, Math.round(u * 0.25 / 10) * 10); return `<tr><td>${ing.name}</td><td class="r">${KE.tl(KE.ingPrice(G, b, k))}/${ing.unit}</td><td class="r">${KE.num(b.stock[k] || 0, ing.unit === 'kg' ? 1 : 0)} ${ing.unit}</td><td class="r">${KE.num(u, ing.unit === 'kg' ? 1 : 0)} ${ing.unit}</td><td><button class="btn sm ghost" data-a="buy" data-k="${k}" data-q="${step}">+${step} ${ing.unit} (${KE.tl(step * KE.ingPrice(G, b, k))})</button></td></tr>`; }).join('')}
        </tbody></table></div></div>
      <div class="panel row between"><div><h3>Pazarlık</h3><p class="small">Haftada bir kez Rıza'yla pazarlık edebilirsin. Şansın yaver giderse 5 gün boyunca malzemede indirim alırsın.</p></div><button class="btn" data-a="haggle" ${G.flags.haggleWeek === Math.floor(G.day / 7) ? 'disabled' : ''}>Pazarlık et</button></div>
    </main>`;
  };

  /* ---------- Usta pazarı ---------- */
  SCREENS.lonca = () => {
    const b = B();
    const mine = G.staff.filter(KE.isCook);
    const tab = params.tab || 'pazar';
    const cookActions = (s) => {
      const same = KE.branchStaff(G, G.branches.find((x) => x.id === s.branchId)).filter((x) => x.role === 'usta' && x.id !== s.id);
      let a = `<button class="btn sm ghost" data-a="raise" data-id="${s.id}">%10 zam</button>`;
      if (s.role === 'cirak') {
        a += same.length ? `<select class="btn sm ghost" data-c="mentor" data-id="${s.id}" aria-label="Mentor seç"><option value="">Mentor: ${s.mentorId ? esc((G.staff.find((x) => x.id === s.mentorId) || {}).name || 'yok') : 'yok'}</option>${same.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select>` : '';
        if (Object.values(s.spec).some((v) => v >= 3)) a += `<button class="btn sm gold" data-a="promote" data-id="${s.id}">Ustalığa terfi</button>`;
      }
      if (G.branches.length > 1 && G.phase === 'morning') a += `<select class="btn sm ghost" data-c="transfer" data-id="${s.id}" aria-label="Şubeye gönder"><option value="">Şube: ${esc(G.branches.find((x) => x.id === s.branchId).name)}</option>${G.branches.filter((x) => x.id !== s.branchId).map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>`;
      if (G.phase === 'morning') a += `<button class="btn sm red" data-a="fire" data-id="${s.id}">İşten çıkar</button>`;
      return a;
    };
    return `<main class="screen">${back('Usta Pazarı')}${npcHead('lonca')}
      <div><div class="tabs"><button class="tab ${tab === 'pazar' ? 'on' : ''}" data-a="go" data-s="lonca" data-tab="pazar">Pazardaki ustalar</button><button class="tab ${tab === 'kadro' ? 'on' : ''}" data-a="go" data-s="lonca" data-tab="kadro">Kadrom (${mine.length})</button></div>
      <div class="panel tabbody stack">${tab === 'pazar'
        ? `<p class="small">Pazar her pazar akşamı yenilenir. İşe aldığın usta <b>${esc(b.name)}</b> şubesine başlar. Ocak yeri: ${KE.equip(G, b, 'cook').stations}, şu an ${KE.branchStaff(G, b).filter(KE.isCook).length} pişirmeci.</p>
          <div class="grid wide">${G.market.map((s) => masterCard(s, { actions: `<button class="btn green" data-a="hireMaster" data-id="${s.id}" ${G.cash < s.fee ? 'disabled' : ''}>İşe al${s.fee ? ' · ' + KE.tl(s.fee) : ''}</button>` })).join('') || '<p class="muted">Pazarda şu an kimse yok.</p>'}</div>`
        : `${needMorning()}<div class="grid wide">${mine.map((s) => masterCard(s, { own: true, extra: `<div class="small muted">Şube: ${esc(G.branches.find((x) => x.id === s.branchId).name)} · toplam ${s.servedTotal} porsiyon · bahşiş bu ay ${KE.tl(s.tipsMonth)}${s.mentorId ? ` · mentor: ${esc((G.staff.find((x) => x.id === s.mentorId) || {}).name || '')}` : ''}</div>`, actions: `<div class="row" style="gap:6px">${cookActions(s)}</div>` })).join('')}</div>`}
      </div></div></main>`;
  };

  /* ---------- Eleman bürosu ---------- */
  SCREENS.buro = () => {
    const b = B();
    const mine = G.staff.filter((s) => !KE.isCook(s));
    const wcard = (s, own) => {
      const look = KE.staffLook(s); const tr = KE.TRAITS[s.trait];
      const statl = (l, v) => `<div class="statline"><span>${l}</span><div class="bar ${v < 0.5 ? 'rd' : v < 0.75 ? 'or' : ''}"><i style="width:${clamp(v, 0, 1) * 100}%"></i></div><span class="num">${Math.round(v * 100)}</span></div>`;
      let acts = '';
      if (own) {
        acts = `<button class="btn sm ghost" data-a="raise" data-id="${s.id}">%10 zam</button>`;
        if (G.branches.length > 1 && G.phase === 'morning') acts += `<select class="btn sm ghost" data-c="transfer" data-id="${s.id}" aria-label="Şubeye gönder"><option value="">Şube: ${esc(G.branches.find((x) => x.id === s.branchId).name)}</option>${G.branches.filter((x) => x.id !== s.branchId).map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>`;
        if (G.phase === 'morning') acts += `<button class="btn sm red" data-a="fire" data-id="${s.id}">İşten çıkar</button>`;
      } else acts = `<button class="btn green" data-a="hireWorker" data-id="${s.id}">İşe al</button>`;
      return `<div class="card"><div class="head"><div class="avatar lg">${KE.portrait(look, { mood: KE.moodFromValue(s.morale), label: s.name })}</div><div class="stack" style="gap:3px"><h4>${esc(s.name)}</h4><span class="tag bl">${KE.ROLES[s.role].name}</span>${own ? `<span class="small muted">${esc(G.branches.find((x) => x.id === s.branchId).name)} · moral ${Math.round(s.morale)}</span>` : ''}</div></div>
        <p class="small muted">${KE.ROLES[s.role].desc}</p>
        <div class="stack" style="gap:3px">${statl('Hız', (s.speed - 0.6) / 0.8)}${statl('Güler yüz', s.friendly)}${s.role === 'mudur' ? statl('Yönetim', s.skill) : ''}</div>
        ${tr ? `<div class="small"><span class="tag gd">${tr.name}</span> ${tr.desc}</div>` : ''}
        <div class="foot"><span class="small"><b>${KE.tl(s.wage)}</b> brüt/ay</span><div class="row" style="gap:6px">${acts}</div></div></div>`;
    };
    return `<main class="screen">${back('Eleman Bürosu')}${npcHead('buro')}
      <div class="panel"><h3>Adaylar</h3><p class="small">İşe aldığın kişi <b>${esc(b.name)}</b> şubesinde başlar. Müdür, başında olmadığın şubeyi yönetir. Liste her pazar yenilenir.</p><div class="grid">${G.workers.map((s) => wcard(s, false)).join('')}</div></div>
      <div class="panel"><h3>Kadro (ustalar hariç)</h3>${needMorning()}<div class="grid">${mine.map((s) => wcard(s, true)).join('') || '<p class="muted">Henüz kimse yok.</p>'}</div></div>
    </main>`;
  };

  /* ---------- Terzi ---------- */
  SCREENS.terzi = () => {
    const staff = G.staff;
    return `<main class="screen">${back('Terzi Nuri')}${npcHead('terzi')}
      <div class="panel"><div class="grid">${KE.COSTUMES.map((c) => `<div class="kpi"><div class="l">${c.name}</div><div class="v">${c.cost ? KE.tl(c.cost) : 'Ücretsiz'}</div><div class="small">${c.desc} Moral +${c.morale}.</div></div>`).join('')}</div></div>
      <div class="grid wide">${staff.map((s) => {
        const reg = KE.REGIONS[s.region] || KE.REGIONS['İstanbul'];
        return `<div class="card"><div class="head"><div class="avatar xl">${KE.portrait(KE.staffLook(s), { mood: KE.moodFromValue(s.morale), label: s.name })}</div><div class="stack" style="gap:3px"><h4>${esc(s.name)}</h4><span class="small muted">${roleName(s)} · ${esc(G.branches.find((x) => x.id === s.branchId).name)}</span><span class="tag">Memleket: ${s.region}</span><span class="tiny muted">Yöresel kostüm: ${reg.note}</span></div></div>
          <div class="row" style="gap:6px">${KE.COSTUMES.map((c) => `<button class="btn sm ${s.costume === c.id ? 'green' : 'ghost'}" data-a="costume" data-id="${s.id}" data-c="${c.id}" ${s.costume === c.id ? 'disabled' : ''}>${c.name}${c.cost && s.costume !== c.id ? ' · ' + KE.tl(c.cost) : ''}</button>`).join('')}</div></div>`;
      }).join('')}</div></main>`;
  };

  /* ---------- Mobilya, ekipman ve dekor ---------- */
  SCREENS.dekor = () => {
    const b = B(); const M = MODE();
    const amb = KE.ambience(G, b);
    const styles = {};
    b.decor.forEach((id) => { const d = KE.DECOR.find((x) => x.id === id); if (d.style !== 'personel') styles[d.style] = (styles[d.style] || 0) + 1; });
    const eqDesc = (k, lv) => k === 'cook' ? `${lv.stations} ocak yeri` : k === 'prep' ? `Hız ×${lv.speed}${lv.quality ? `, kalite +${lv.quality}` : ''}` : k === 'cold' ? `Günlük fire %${KE.num(lv.waste * 100, 1)}` : `Sabır ×${lv.patience}, kuyruk ${lv.queue}`;
    return `<main class="screen">${back('Mobilya ve Dekor · ' + esc(b.name))}${npcHead('dekor')}
      <div class="panel"><h3>Ekipman</h3><div class="grid">${Object.entries(M.equipment).map(([k, eq]) => {
        const cur = eq.levels[b.equipment[k]], next = eq.levels[b.equipment[k] + 1];
        return `<div class="card"><span class="eyebrow">${eq.name}</span><h4 style="font-family:var(--f-display);font-size:19px">${cur.name}</h4><div class="small">${eqDesc(k, cur)}</div>
          ${next ? `<div class="small" style="border-top:1px dashed var(--cizgi);padding-top:6px">Sonraki: <b>${next.name}</b><br>${eqDesc(k, next)}</div><div class="foot"><b>${KE.tl(next.cost * G.priceIndex)}</b><button class="btn sm green" data-a="upgrade" data-k="${k}" ${G.cash < next.cost * G.priceIndex ? 'disabled' : ''}>Yükselt</button></div>` : '<span class="tag gr">En üst seviye</span>'}</div>`;
      }).join('')}</div></div>
      <div class="panel"><div class="row between"><h3>Dekor</h3><div class="row">${Object.entries(styles).map(([s, n]) => `<span class="tag ${n >= 3 ? 'gd' : ''}">${s}: ${n}/3</span>`).join('')}${amb.concept ? `<span class="tag gd">Konsept: ${amb.concept.name}</span>` : ''}</div></div>
        <p class="small muted">Ortam puanı müşteri sayısını ve memnuniyeti artırır. Aynı tarzdan 3 parça konsept bonusunu açar; çalışanların kostümleri konsepti güçlendirir. Geleneksel konsepte yöresel kostüm ek güç katar.</p>
        <div class="grid">${KE.DECOR.map((d) => { const own = b.decor.includes(d.id); return `<div class="card" style="gap:6px"><div class="head"><div class="decor-item" style="background:${STYLE_BG[d.style]}"><svg viewBox="0 0 40 40">${DECOR_ICON[d.id] || ''}</svg></div><div class="stack" style="gap:2px"><b style="font-family:var(--f-display);font-size:16px">${d.name}</b><span class="tag">${d.style}</span></div></div><p class="small">${d.desc}</p><div class="foot"><span class="small">Ortam +${d.ambience}${d.morale ? ` · moral +${d.morale}/gün` : ''}</span>${own ? '<span class="tag gr">Dükkânda</span>' : `<button class="btn sm green" data-a="buyDecor" data-id="${d.id}" ${G.cash < d.cost * G.priceIndex ? 'disabled' : ''}>${KE.tl(d.cost * G.priceIndex)}</button>`}</div></div>`; }).join('')}</div></div>
    </main>`;
  };

  /* ---------- Banka ---------- */
  SCREENS.banka = () => {
    const offers = [[250000, 12], [500000, 12], [500000, 24], [1000000, 24], [2000000, 36]].map(([a, m]) => KE.loanOffer(Math.round(a * G.priceIndex / 1000) * 1000, m, 0.034));
    return `<main class="screen">${back('Banka')}${npcHead('banker')}
      <div class="panel"><h3>Esnaf kredisi teklifleri</h3><p class="small muted">Aylık %3,4 faiz, eşit taksit. Taksitler ay sonu kapanışında kasadan düşer.</p>
        <div class="tablewrap"><table><thead><tr><th class="r">Tutar</th><th class="r">Vade</th><th class="r">Aylık taksit</th><th class="r">Toplam geri ödeme</th><th></th></tr></thead><tbody>
        ${offers.map((o, i) => `<tr><td class="r"><b>${KE.tl(o.amount)}</b></td><td class="r">${o.months} ay</td><td class="r">${KE.tl(o.monthly)}</td><td class="r">${KE.tl(o.total)}</td><td><button class="btn sm green" data-a="loan" data-amt="${o.amount}" data-m="${o.months}" ${G.loans.length >= 3 ? 'disabled' : ''}>Kullan</button></td></tr>`).join('')}
        </tbody></table></div>${G.loans.length >= 3 ? '<p class="small negv">En fazla 3 kredi kullanabilirsin.</p>' : ''}</div>
      <div class="panel"><h3>Kredilerim</h3><div class="tablewrap"><table><thead><tr><th class="r">Tutar</th><th class="r">Taksit</th><th class="r">Kalan taksit</th><th class="r">Kapama bedeli</th><th></th></tr></thead><tbody>
        ${G.loans.map((l, i) => { const pay = Math.round(l.monthly * l.remaining * 0.93); return `<tr><td class="r">${KE.tl(l.amount)}</td><td class="r">${KE.tl(l.monthly)}</td><td class="r">${l.remaining}</td><td class="r">${KE.tl(pay)}</td><td><button class="btn sm ghost" data-a="payoff" data-i="${i}" ${G.cash < pay ? 'disabled' : ''}>Erken kapat</button></td></tr>`; }).join('') || '<tr><td colspan="5" class="muted">Kredi yok.</td></tr>'}
      </tbody></table></div></div></main>`;
  };

  /* ---------- Belediye ---------- */
  SCREENS.belediye = () => {
    const fines = G.ledger.months.reduce((a, m) => a + (m.fines || 0), 0) + (G.monthExtras.fines || 0);
    return `<main class="screen">${back('Belediye')}${npcHead('bulent')}
      <div class="grid">${G.branches.map((b) => `<div class="card"><h4 style="font-family:var(--f-display);font-size:19px">${esc(b.name)}</h4>
        <div class="statline" style="grid-template-columns:80px 1fr 34px"><span>Temizlik</span><div class="bar ${b.cleanliness < 40 ? 'rd' : b.cleanliness < 60 ? 'or' : ''}"><i style="width:${b.cleanliness}%"></i></div><span class="num">${Math.round(b.cleanliness)}</span></div>
        <div class="small">İşyeri açma ve çalışma ruhsatı: <span class="tag gr">Geçerli</span><br>Temizlik görevlisi: ${KE.branchStaff(G, b).filter((s) => s.role === 'temizlik').length}</div>
        <div class="foot"><span class="small">Hijyen eğitimi ve derin temizlik</span><button class="btn sm green" data-a="hygiene" data-id="${b.id}">${KE.tl(12000 * G.priceIndex)}</button></div></div>`).join('')}</div>
      <div class="panel"><h3>Bilgi</h3><ul class="small"><li>Temizlik puanı her gün müşteri sayısına göre düşer; temizlik görevlisi her gün yükseltir.</li><li>Denetimde puan 55'in altındaysa idari para cezası kesilir ve itibar düşer.</li><li>Bugüne kadar ödenen cezalar: <b>${KE.tl(fines)}</b></li></ul></div></main>`;
  };

  /* ---------- Reklam ajansı ---------- */
  const CAMPAIGNS = [
    { id: 'ilan', name: 'El ilanı dağıtımı', cost: 9000, days: 4, desc: 'Sanayi ve konut sokaklarına ilan. Müşteri +%12, işçi ve aile +%30.', mods: [['traffic', 1.12], ['type:isci', 1.3], ['type:aile', 1.3]] },
    { id: 'sosyal', name: 'Sosyal medya kampanyası', cost: 22000, days: 7, desc: 'Kısa videolar ve fenomen paylaşımları. Müşteri +%18, öğrenci ve gece +%50.', mods: [['traffic', 1.18], ['type:ogrenci', 1.5], ['type:gece', 1.5]] },
    { id: 'radyo', name: 'Radyo reklamı', cost: 35000, days: 7, desc: 'Sabah trafiğinde jingle. Bütün şubelerde müşteri +%10, beyaz yaka +%30.', mods: [['traffic', 1.1], ['type:beyaz', 1.3]] },
    { id: 'blog', name: 'Gurme blog daveti', cost: 15000, days: 5, desc: 'Yemek yazarlarına tadım. Gurme +%60. Usta ★4 ve üstüyse itibar +4.', mods: [['type:gurme', 1.6]], rep: true },
    { id: 'tabela', name: 'Işıklı tabela yenileme', cost: 30000, days: 0, desc: 'Aktif şubede kalıcı olarak müşteri +%6. Şube başına bir kez.', sign: true }
  ];
  SCREENS.ajans = () => {
    const b = B();
    const active = G.mods.filter((m) => m.camp);
    const seen = {};
    return `<main class="screen">${back('Reklam Ajansı')}${npcHead('ajans')}
      ${active.length ? `<div class="panel"><h3>Süren kampanyalar</h3><div class="row">${active.filter((m) => { if (seen[m.camp]) return false; seen[m.camp] = 1; return true; }).map((m) => `<span class="tag bl">${m.label} · ${m.days} gün</span>`).join('')}</div></div>` : ''}
      <div class="grid">${CAMPAIGNS.map((c) => { const cost = Math.round(c.cost * G.priceIndex); const done = c.sign && b.signBoost; const running = active.some((m) => m.camp === c.id); return `<div class="card"><h4 style="font-family:var(--f-display);font-size:20px">${c.name}</h4><p class="small">${c.desc}</p><div class="foot"><span class="small">${c.days ? c.days + ' gün' : 'Kalıcı'}</span>${done ? '<span class="tag gr">Yapıldı</span>' : running ? '<span class="tag bl">Sürüyor</span>' : `<button class="btn sm green" data-a="campaign" data-id="${c.id}" ${G.cash < cost ? 'disabled' : ''}>${KE.tl(cost)}</button>`}</div></div>`; }).join('')}</div></main>`;
  };

  /* ---------- Mahalle kahvesi ---------- */
  SCREENS.kahve = () => {
    const news = G.news[0];
    const rumors = [
      `Usta pazarında bu hafta ${G.market.length} usta var. ${G.market.find((s) => Math.max(...Object.values(s.spec)) >= 5) ? 'Aralarında ★5 bir usta olduğu konuşuluyor!' : 'Ama ★5 ustası yok diyorlar.'}`,
      `"Lüks Kebap"ın gücü ${G.rival.power}. ${G.rival.district ? KE.DISTRICTS.find((d) => d.id === G.rival.district).name + "'de dükkân açtılar." : 'Henüz senin semtinde değiller.'}`,
      `Halde fiyat endeksi başlangıca göre %${Math.round((G.priceIndex - 1) * 100)} yukarıda.`
    ];
    return `<main class="screen">${back('Mahalle Kahvesi')}${npcHead('ayse')}
      <div class="cols"><div class="stack">
        <div class="panel"><h3>Hedefler</h3><div class="stack">${KE.GOALS.map((g) => `<div class="row between" style="border-bottom:1px solid var(--cizgi);padding-bottom:6px"><div><b>${G.goals[g.id] ? '✓ ' : ''}${g.name}</b><div class="small muted">${g.desc}</div></div><span class="tag ${G.goals[g.id] ? 'gr' : 'gd'}">${G.goals[g.id] ? KE.dateStr(G.goals[g.id]) : 'Ödül ' + KE.tl(g.reward)}</span></div>`).join('')}</div></div>
        <div class="panel"><h3>Günlük arşivi</h3><div class="stack">${G.journal.slice(0, 8).map((j) => `<div><span class="eyebrow">${j.date}</span><div class="journal" style="font-size:16px">${esc(j.text)}</div></div>`).join('') || '<p class="muted">İlk gün bittiğinde günlüğün burada birikecek.</p>'}</div></div>
      </div><div class="stack">
        <div class="panel"><h3>Kahvede konuşulanlar</h3><ul class="small">${rumors.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
          <div class="npc" style="margin-top:6px"><div class="avatar">${KE.portrait(KE.CAST.rakip.look, { mood: 'happy', label: 'Cüneyt Bey' })}</div><div class="bubble small"><span class="who">Cüneyt Bey</span>${esc(KE.line('rakip'))}</div></div></div>
        ${news ? `<div class="panel">${newsHtml(news)}</div>` : '<div class="panel"><h3>Mahalle Postası</h3><p class="muted">Gazete her pazar akşamı çıkar.</p></div>'}
      </div></div></main>`;
  };

  /* ---------- Şubeler ---------- */
  SCREENS.subeler = () => {
    const sel = params.d ? KE.DISTRICTS.find((x) => x.id === params.d) : null;
    const cards = KE.DISTRICTS.map((d) => {
      const b = G.branches.find((x) => x.district === d.id);
      if (b) {
        const h = b.history.slice(-7);
        const st = KE.branchStaff(G, b);
        const mgr = st.find((s) => s.role === 'mudur');
        return `<div class="card ${sel && sel.id === d.id ? 'sel' : ''}"><span class="eyebrow">${d.name}${b.id === G.activeBranch ? ' · Şu an buradasın' : ''}</span><h4 style="font-family:var(--f-display);font-size:20px">${esc(b.name)}</h4>
          <div class="small">Personel: ${st.length} · Müdür: ${mgr ? esc(mgr.name) : '<span class="negv">yok</span>'} · Temizlik ${Math.round(b.cleanliness)}</div>
          ${h.length > 1 ? lineChart([{ name: 'Son 7 gün ciro', color: '#f28c28', values: h.map((x) => x.revenue), area: true }], h.map((x) => String(KE.dateOf(x.day).getUTCDate())), { h: 120, label: 'Şube cirosu' }) : '<p class="small muted">Henüz yeterli veri yok.</p>'}
          <div class="foot"><span></span>${b.id !== G.activeBranch ? `<button class="btn sm green" data-a="switchTo" data-id="${b.id}" ${G.phase !== 'morning' ? 'disabled' : ''}>Bu şubeye geç</button>` : '<button class="btn sm" data-a="go" data-s="shop">Dükkâna git</button>'}</div></div>`;
      }
      const cost = KE.branchCost(G, d);
      return `<div class="card ${sel && sel.id === d.id ? 'sel' : ''}"><span class="eyebrow">${d.side} yakası</span><h4 style="font-family:var(--f-display);font-size:20px">${d.name}</h4><p class="small">${d.desc}</p>
        <div class="small">Kira ${KE.tl(d.rent * G.priceIndex)} · trafik ${d.traffic} · rakip ${d.rivals}<br>${Object.entries(d.mix).sort((a, c) => c[1] - a[1]).slice(0, 3).map(([t]) => KE.CUSTOMER_TYPES[t].name).join(', ')}</div>
        <div class="foot"><span class="small">Açılış: <b>${KE.tl(cost)}</b><br><span class="tiny muted">3 aylık kira depozitosu + tadilat ve ekipman</span></span><button class="btn sm green" data-a="openBranch" data-d="${d.id}" ${G.cash < cost || G.phase !== 'morning' ? 'disabled' : ''}>Şube aç</button></div></div>`;
    }).join('');
    return `<main class="screen">${back('Şube Yönetimi')}
      <div class="panel small">Başında olmadığın şubeler arka planda kendi kendine çalışır. Sonucu şube müdürünün yönetim becerisi, ustaların uzmanlığı ve semtin müşteri profili belirler. Yeni şubeye Usta Pazarı'ndan ve Eleman Bürosu'ndan personel almayı unutma: personelsiz şube satış yapamaz. Şube açmak ve şube değiştirmek sabah hazırlığında yapılır.</div>
      ${G.branches.length >= 3 ? `<div class="panel row between"><div><h3>Merkezi mutfak</h3><p class="small">Döner ve kıyma merkezde hazırlanıp şubelere dağıtılır. Malzeme maliyeti %12 düşer.</p></div>${G.centralKitchen ? '<span class="tag gr">Kuruldu</span>' : `<button class="btn green" data-a="central" ${G.cash < 450000 * G.priceIndex ? 'disabled' : ''}>${KE.tl(450000 * G.priceIndex)}</button>`}</div>` : ''}
      <div class="grid wide">${cards}</div></main>`;
  };

  /* ---------- Eylemler ---------- */
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
    G = KE.newGame({ mode: ng.mode, district: ng.district, master: Object.assign({}, m.tmpl, { look: m.look, gender: m.gender, age: m.age }), owner: ng.owner || 'Patron', shopName: ng.shopName || null });
    KE.G = G;
    UI.go('map');
    const usta = G.staff[0];
    UI.modal(`<span class="eyebrow">Hikâye</span><h2>Babadan kalan dükkân</h2>
      <div class="evcard"><div class="avatar">${KE.portrait(KE.staffLook(usta), { mood: 'happy', label: usta.name })}</div>
      <div class="journal">Babamın ${KE.district(B()).name}'deki küçük dükkânının anahtarını avucumda sıktım. Paslı kepengi kaldırdığımda içeri sabah güneşi doldu. ${esc(usta.name)} önlüğünü bağlarken gülümsedi: "Baban bu ocağın başında otuz yıl ekmek çıkardı. Biz de çıkaracağız." Kasada ${KE.tl(G.cash)} var. Önce bir menü, sonra bir mahalle, sonra bütün şehir.</div></div>
      <ul class="small"><li>Haritadaki binalara tıklayarak hal, muhasebe, usta pazarı ve diğer yerlere git.</li><li>Dükkânda sabah fiyatları ayarla, sonra kepengi aç. Servisi personel yürütür; istersen tezgâha geç.</li><li>Gün sonunda bahşişi dağıt, günlüğünü oku. Ay sonunda bordro ve giderler kasadan düşer.</li></ul>
      <div class="acts"><button class="btn big green" data-a="closeModal">Haydi bismillah</button></div>`);
  };
  A.closeModal = () => UI.closeModal();
  A.menu = () => UI.modal(`<h2>Menü</h2><p>Oyun her gün sonunda bu tarayıcıya otomatik kaydedilir.</p>
    <div class="stack"><button class="btn green" data-a="saveNow">Şimdi kaydet</button><button class="btn ghost" data-a="toTitle">Ana menüye dön</button><button class="btn red" data-a="confirmNew">Yeni oyun başlat</button><button class="btn ghost" data-a="closeModal">Kapat</button></div>`);
  A.saveNow = () => { UI.save(); UI.closeModal(); UI.toast('Kaydedildi.', 'good'); };
  A.toTitle = () => { UI.save(); UI.closeModal(); UI.go('title'); };
  A.confirmNew = () => { UI.closeModal(); UI.modal(`<h2>Emin misin?</h2><p>Kayıtlı oyunun silinecek ve yeni bir oyun başlayacak.</p><div class="acts"><button class="btn ghost" data-a="closeModal">Vazgeç</button><button class="btn red" data-a="doNew">Evet, sıfırdan başla</button></div>`); };
  A.doNew = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* yok say */ } G = null; UI.closeModal(); UI.ng = {}; UI.go('newMode'); };

  A.openShop = () => {
    const b = B();
    if (!KE.branchStaff(G, b).some(KE.isCook)) { UI.toast('Bu şubede hiç usta yok. Usta Pazarı\'ndan birini işe al.', 'bad'); return; }
    KE.startService(G);
    if (!G.speed) G.speed = 1;
    UI.render();
    UI.startLoop();
  };
  A.speed = (d) => { G.speed = +d.v; document.querySelectorAll('.speed .btn').forEach((x) => { x.classList.toggle('on', +x.dataset.v === G.speed); x.classList.toggle('ghost', +x.dataset.v !== G.speed); }); };
  A.tezgah = () => { const L = G.live[B().id]; KE.playerToggle(G, !L.player.active); if (L.player.active) KE.playerTake(G); renderTezgah(); UI.sceneUpdate(); };
  A.step = (d, el) => {
    const r = KE.playerStep(G, d.l);
    if (r.ok === false) { const box = document.getElementById('stepbtns'); if (box) { box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); } UI.sceneUpdate(); renderTezgah(); return; }
    if (r.done) KE.playerTake(G);
    renderTezgah(); UI.sceneUpdate();
  };
  A.fastForward = () => { KE.fastForward(G); KE.finishService(G); UI.render(); showClosing(); };
  A.showClosing = () => showClosing();
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
    UI.modal(`<h2>Sonuç</h2><p>${esc(msg)}</p><div class="acts"><button class="btn green" data-a="closeModalRender">Tamam</button></div>`);
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
  A.haggle = () => {
    G.flags.haggleWeek = Math.floor(G.day / 7);
    if (Math.random() < 0.5) { G.mods.push({ key: 'ing', mult: 0.92, days: 5, label: 'Pazarlık indirimi' }); UI.toast('Rıza: "Peki, senin hatırına %8 indirim."', 'good'); }
    else UI.toast('Rıza: "Kardeşim bu fiyata ben zarar ederim."', 'bad');
    UI.render();
  };
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
  A.promote = (d) => { const s = G.staff.find((x) => x.id === d.id); s.role = 'usta'; s.name = s.name.replace(/^Çırak /, '') + (s.name.includes('Usta') ? '' : ' Usta'); s.wage = Math.max(s.wage, KE.wageFor(s.spec, 'usta')); s.morale = clamp(s.morale + 25, 0, 100); s.mentorId = null; G.staff.forEach((x) => { if (x.mentorId === s.id) x.mentorId = null; }); UI.toast(`${s.name} artık usta!`, 'gold'); UI.render(); };
  A.fire = (d) => {
    const s = G.staff.find((x) => x.id === d.id);
    UI.modal(`<h2>${esc(s.name)} işten çıkarılsın mı?</h2><p>İhbar süresi yerine iki haftalık brüt ücret ödenir: <b>${KE.tl(s.wage / 2)}</b>. Ekibin geri kalanının morali biraz düşer.</p><div class="acts"><button class="btn ghost" data-a="closeModal">Vazgeç</button><button class="btn red" data-a="doFire" data-id="${s.id}">İşten çıkar</button></div>`);
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
    UI.toast(`${next.name} kuruldu.`, 'good'); UI.render();
  };
  A.buyDecor = (d) => {
    const b = B(); const it = KE.DECOR.find((x) => x.id === d.id); const cost = it.cost * G.priceIndex;
    G.cash -= cost; KE.addExtra(G, 'capex', cost); b.decor.push(it.id);
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
  A.openBranch = (d) => {
    const b = KE.openBranch(G, d.d);
    KE.checkGoals(G);
    UI.toast(`${b.name} açıldı! Personel almayı unutma.`, 'gold');
    UI.render();
  };
  A.switchTo = (d) => { G.activeBranch = d.id; UI.toast('Artık ' + B().name + ' şubesindesin.'); UI.go('shop'); };
  A.central = () => { const c = 450000 * G.priceIndex; G.cash -= c; KE.addExtra(G, 'capex', c); G.centralKitchen = true; UI.toast('Merkezi mutfak kuruldu.', 'gold'); UI.render(); };
  A.tipRule = (d) => { G.tipRule = d.r; UI.render(); };

  /* change olayları */
  const C = {};
  C.switchBranch = (el) => { G.activeBranch = el.value; UI.render(); };
  C.menuToggle = (el) => { B().menu[el.dataset.p] = el.checked; };
  C.priceSet = (el) => { const v = parseInt(el.value.replace(/\D/g, ''), 10); if (v > 0) B().prices[el.dataset.p] = v; UI.render(); };
  C.mentor = (el) => { const s = G.staff.find((x) => x.id === el.dataset.id); s.mentorId = el.value || null; if (el.value) UI.toast(`${s.name} artık ${G.staff.find((x) => x.id === el.value).name}'nın yanında çalışıyor.`, 'good'); UI.render(); };
  C.transfer = (el) => { if (!el.value) return; const s = G.staff.find((x) => x.id === el.dataset.id); s.branchId = el.value; s.mentorId = null; G.staff.forEach((x) => { if (x.mentorId === s.id) x.mentorId = null; }); UI.toast(`${s.name} ${G.branches.find((b) => b.id === el.value).name} şubesine geçti.`); UI.render(); };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    if (el.tagName === 'SELECT') return;
    const fn = A[el.dataset.a];
    if (fn) { e.preventDefault(); fn(Object.assign({}, el.dataset), el, e); }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('g.place[data-a]')) { e.preventDefault(); const fn = A[e.target.dataset.a]; if (fn) fn(Object.assign({}, e.target.dataset)); }
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-c]');
    if (!el) return;
    const fn = C[el.dataset.c];
    if (fn) fn(el, e);
  });

  UI.boot = function () {
    UI.go('title');
  };
})();
