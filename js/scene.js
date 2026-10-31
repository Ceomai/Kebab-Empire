/* Kebab Empire — dükkân sahnesi
   16:9 sahne; bütün konumlar sahne genişliğine göre yüzde. Varlıklar (müşteri, personel, tabak) anahtarlı DOM öğeleri;
   simülasyon her dakika konumları günceller, CSS geçişleri yürüyüşü yumuşatır. */
(function () {
  const S = KE.SCENE = {};
  const A = () => KE.ART;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const DOOR = { x: 94, y: 74 };
  const KASA = { x: 66, y: 50 };
  const QUEUE0 = { x: 68, y: 76 };
  const PASS_END = { x: 60, y: 68 };

  S.tablePos = function (n) {
    const pos = [];
    const rows = n > 5 ? 2 : 1;
    const perRow = Math.ceil(n / rows);
    for (let i = 0; i < n; i++) {
      const r = rows === 1 ? 0 : Math.floor(i / perRow);
      const c = i % perRow;
      const span = 50 / perRow;
      pos.push({ x: 5 + span * c + span / 2 + (r % 2 ? span * 0.25 : 0), y: rows === 1 ? 86 : (r === 0 ? 78 : 94) });
    }
    return pos;
  };
  function stationX(G, i, n) { return G.mode === 'doner' ? 12 + i * (50 / Math.max(1, n)) : 10 + i * (48 / Math.max(1, n)) + 3; }

  /* Statik iskelet */
  S.html = function (G, b) {
    const M = KE.MODES[G.mode];
    const stations = KE.equip(G, b, 'cook').stations;
    const amb = KE.ambience(G, b);
    const lux = b.decor.filter((id) => (KE.DECOR.find((d) => d.id === id) || {}).style === 'lüks').length >= 2;
    const menuItems = M.products.filter((p) => b.menu[p.id]).slice(0, 7);
    let equipment = '';
    if (G.mode === 'doner') {
      for (let i = 0; i < stations; i++) equipment += `<div class="eq-doner" style="left:${stationX(G, i, stations) - 7}%">${A().doner(i % 2 ? 'tavuk' : 'et')}</div>`;
    } else equipment = `<div class="eq-mangal">${A().mangal(Math.min(4, stations + 1))}${A().smoke()}</div>`;
    const wallDecor = b.decor.filter((id) => !['dismasa', 'dinlenme', 'klima', 'taburet', 'kadife', 'mermer'].includes(id)).slice(0, 5);
    return `<div class="stage mode-${G.mode} ${lux ? 'lux' : ''} ${amb.concept ? 'concept-' + amb.concept.style : ''}" id="stage">
      <div class="st-wall"><div class="st-tiles"></div>
        <div class="st-sign">${KE.ART.logo()}<span>${b.name}</span></div>
        <div class="st-menu"><div class="st-menu-h">MENÜ</div><div class="st-menu-items">${menuItems.map((p) => `<div class="mi">${A().dish(p.id)}<b>${KE.tl(b.prices[p.id]).replace(' ₺', '')}</b></div>`).join('')}</div></div>
        <div class="st-decor">${wallDecor.map((id) => `<div class="wd">${A().decor(id)}</div>`).join('')}</div>
        <div class="st-window"><div class="st-street"></div></div>
        <div class="st-lamp l1">${A().lamp()}</div><div class="st-lamp l2">${A().lamp()}</div>
        <div class="st-clock"><i class="hh" id="st-hh"></i><i class="mm" id="st-mm"></i></div>
        <div class="st-shelf">${['#c0392b', '#e67e22', '#7d3c98', '#27ae60', '#d4ac0d'].map((c, i) => `<span class="jar" style="--c:${c};--h:${[70, 90, 60, 80, 75][i]}%"></span>`).join('')}</div>
      </div>
      <div class="st-back"></div>
      <div class="st-equip">${equipment}</div>
      <div class="st-floor"></div>
      <div class="st-door">${A().door()}</div>
      ${b.decor.includes('bitki') ? `<div class="st-plant">${A().plant()}</div>` : ''}
      <div class="st-layer" id="st-tables"></div>
      <div class="st-layer" id="st-cooks"></div>
      <div class="st-counter"><div class="st-counter-top"></div><div class="st-counter-front"></div></div>
      <div class="st-register">${A().register()}</div>
      <div class="st-salad">${['#e2412d', '#5cb85c', '#c84bc0', '#f1c40f'].map((c) => `<span style="--c:${c}"></span>`).join('')}</div>
      <div class="st-layer" id="st-pass"></div>
      <div class="st-layer" id="st-people"></div>
      <div class="st-layer" id="st-fx"></div>
      <div class="st-hud" id="st-hud"></div>
      ${G.phase === 'closing' ? '<div class="st-closed"><span>Kepenk indi</span></div>' : ''}
    </div>`;
  };

  const ent = {};
  let stageId = null;
  S.reset = function () { Object.keys(ent).forEach((k) => delete ent[k]); stageId = null; };

  function place(layer, key, html, x, y, cls, z, from) {
    let e = ent[key];
    const L = document.getElementById(layer);
    if (!L) return null;
    if (!e || !e.el.isConnected) {
      const el = document.createElement('div');
      el.className = 'ent ' + (cls || '');
      el.style.left = (from ? from.x : x) + '%';
      el.style.top = (from ? from.y : y) + '%';
      L.appendChild(el);
      e = ent[key] = { el, html: null, x, y };
      requestAnimationFrame(() => { el.style.left = x + '%'; el.style.top = y + '%'; });
    }
    if (e.el.parentNode !== L) L.appendChild(e.el);
    if (html != null && e.html !== html) { e.el.innerHTML = html; e.html = html; }
    if (e.x !== x || e.y !== y) {
      const dx = x - e.x;
      e.el.classList.toggle('flip', dx < -0.5);
      e.el.style.left = x + '%'; e.el.style.top = y + '%';
      e.moving = Math.abs(dx) + Math.abs(y - e.y) > 0.6;
      e.x = x; e.y = y;
    }
    if (cls != null) e.el.className = 'ent ' + cls + (e.el.classList.contains('flip') ? ' flip' : '');
    e.el.style.zIndex = z != null ? z : Math.round(y * 10);
    e.seen = true;
    return e;
  }
  function sweep(prefix, onGone) {
    Object.keys(ent).forEach((k) => {
      if (!k.startsWith(prefix)) return;
      const e = ent[k];
      if (!e.seen) { if (onGone) onGone(k, e); else e.el.remove(); delete ent[k]; }
      else e.seen = false;
    });
  }
  const patRing = (r) => `<i class="ring" style="--p:${Math.round(clamp(r, 0, 1) * 100)}"></i>`;

  /* Her dakika: sahneyi simülasyonla eşitle */
  S.update = function (G, b, L) {
    const stage = document.getElementById('stage');
    if (!stage) return;
    if (stageId !== b.id) { S.reset(); stageId = b.id; }
    const M = KE.MODES[G.mode];
    const st = KE.branchStaff(G, b);
    const stations = KE.equip(G, b, 'cook').stations;
    const cooking = KE.cookingStaff(G, b);
    const tablePos = S.tablePos(L.tables.length);
    const speed = G.speed || 1;
    stage.style.setProperty('--walk', Math.max(0.25, 0.9 / speed) + 's');

    /* masalar */
    L.tables.forEach((t, i) => {
      const p = tablePos[i];
      const html = `<div class="tbl ${t.dirty ? 'dirty' : ''}">${A().table(t.dirty, G.mode)}</div>${t.dirty ? '<span class="tag-dirty">Kirli</span>' : ''}`;
      place('st-tables', 't' + i, html, p.x, p.y, 'table', Math.round(p.y * 10) - 2);
    });
    sweep('t');

    /* ustalar */
    const cookList = st.filter(KE.isCook);
    const shown = cooking.slice();
    if (L.player.active) shown.push({ id: 'player' });
    shown.forEach((s, i) => {
      const x = stationX(G, i, Math.max(stations, shown.length));
      const isP = s.id === 'player';
      const look = isP ? ownerLook(G) : KE.staffLook(s);
      const task = isP ? (L.player.tid != null ? { type: 'cook', ref: L.player.tid, remain: 1, total: 2 } : null) : s.task;
      const t = task ? L.tickets.find((k) => k.id === task.ref) : null;
      const mood = isP ? 'happy' : KE.moodFromValue(s.morale);
      const bubble = t ? `<div class="cook-bubble">${A().dish(t.pid)}<i class="ring" style="--p:${Math.round((1 - task.remain / task.total) * 100)}"></i></div>` : '';
      const html = `${bubble}<div class="fig">${KE.figure(look, { mood, label: isP ? G.owner : s.name })}</div><span class="nm ${isP ? 'me' : ''}">${isP ? G.owner : s.name.replace(' Usta', '')}</span>`;
      place('st-cooks', 'c' + s.id, html, x, 59, 'cook', 100);
    });
    sweep('c');

    /* tezgâhtaki hazır tabaklar */
    const ready = L.tickets.filter((t) => t.state === 'ready');
    ready.slice(0, 9).forEach((t, i) => {
      const cold = L.minute - t.readyAt > 3;
      const taken = !!t.by;
      const html = `<div class="plate ${cold ? 'cold' : ''} ${t.paket ? 'bag' : ''}">${t.paket ? '<span class="bagic">PAKET</span>' : A().dish(t.pid)}${!cold && !t.paket ? '<span class="steam"></span>' : ''}${t.count > 1 ? `<b class="x">×${t.count}</b>` : ''}</div>`;
      place('st-pass', 'p' + t.id, html, 7 + i * 5.4, 52, 'dish' + (taken ? ' taken' : ''), 420);
    });
    sweep('p');

    /* ön personel */
    const front = st.filter((s) => !KE.isCook(s) && s.pos !== 'mola' && s.pos !== 'yonetim');
    let kasaN = 0, idleN = 0;
    front.forEach((s) => {
      let x, y, pose = 'stand', tray = null, z = null, cls = 'staff';
      const task = s.task;
      let layer = 'st-people';
      if (s.pos === 'kasa') { x = KASA.x - kasaN * 5.5; y = 59; kasaN++; z = 300; cls += ' behind'; layer = 'st-cooks'; }
      else if (s.pos === 'paket') {
        if (task && task.type === 'paket') { const ph = 1 - task.remain / task.total; if (ph > 0.12 && ph < 0.9) { x = 104; y = 74; } else { x = DOOR.x - 2; y = 70; pose = 'walk'; } }
        else { x = 86; y = 64; }
      } else if (task && task.type === 'deliver') {
        const t = L.tickets.find((k) => k.id === task.ref);
        const c = t && L.custs[t.cid];
        const ph = 1 - task.remain / task.total;
        if (ph < 0.3) { x = PASS_END.x - 4; y = 64; }
        else if (c && c.table != null) { const tp = tablePos[c.table]; x = tp.x + 5.5; y = tp.y + 1; pose = 'walk'; }
        else { x = 61; y = 68; pose = 'walk'; }
        tray = t ? t.pid : null;
      } else if (task && task.type === 'clear') { const tp = tablePos[task.ref] || PASS_END; x = tp.x + 5.5; y = tp.y + 1; pose = 'walk'; }
      else if (task && task.type === 'clean') { x = 20 + ((L.minute * 7 + s.id.length * 13) % 40); y = 70; pose = 'walk'; }
      else { x = PASS_END.x + idleN * 3.5; y = PASS_END.y; idleN++; }
      const look = KE.staffLook(s);
      const html = `<div class="fig">${KE.figure(look, { mood: KE.moodFromValue(s.morale), pose, tray: !!tray, trayDish: tray ? A().dish(tray) : null, label: s.name })}</div>${s.energy < 25 ? '<span class="tired">Yorgun</span>' : ''}`;
      const e = place(layer, 's' + s.id, html, x, y, cls, z);
      if (e) e.el.classList.toggle('moving', !!e.moving);
    });

    /* müşteriler */
    const qIndex = {};
    L.queue.forEach((id, i) => { qIndex[id] = i; });
    let pickN = 0;
    Object.values(L.custs).forEach((c) => {
      let x, y, html, cls = 'cust';
      const fig = (pose, mood) => `<div class="fig">${KE.figure(c.look, { mood, pose, label: KE.CUSTOMER_TYPES[c.type].name })}</div>`;
      const ratio = c.state === 'eat' ? 1 : clamp(1 - c.wait / (c.state === 'queue' ? c.patience : c.patience * 1.9), 0, 1);
      const mood = c.state === 'eat' ? (c.sat > 80 ? 'happy' : c.sat > 55 ? 'neutral' : 'sad') : ratio < 0.3 ? 'angry' : ratio < 0.6 ? 'neutral' : 'happy';
      const bubble = c.state === 'eat' ? '' : `<div class="order-bubble ${c.ordering ? 'talk' : ''}">${A().dish(c.pid)}${patRing(ratio)}${c.count > 1 ? `<b>×${c.count}</b>` : ''}</div>`;
      if (c.state === 'queue') {
        const i = qIndex[c.id] || 0;
        if (i < 6) { x = QUEUE0.x + i * 4.6; y = QUEUE0.y + (i % 2) * 1.5; }
        else { x = 99; y = 74; }
        html = bubble + fig(c.wait < 1 ? 'walk' : 'stand', mood);
      } else if (c.state === 'pickup') {
        x = 57 - pickN * 3.6; y = 70; pickN++;
        html = bubble + fig('stand', mood);
      } else {
        const tp = S.tablePos(L.tables.length)[c.table] || { x: 30, y: 80 };
        x = tp.x - 1.5; y = tp.y - 4.2; cls = 'cust seated';
        html = bubble + `<div class="bust">${KE.portrait(c.look, { mood, label: KE.CUSTOMER_TYPES[c.type].name })}</div>` + (c.state === 'eat' ? `<div class="eating">${A().dish(c.pid)}</div>` : '') + (c.count > 1 ? `<div class="bust b2">${KE.portrait(c.look2 || (c.look2 = KE.customerLook(c.type)), { mood })}</div>` : '');
      }
      const e = place('st-people', 'u' + c.id, html, x, y, cls, c.state === 'eat' || c.state === 'seat' ? Math.round((S.tablePos(L.tables.length)[c.table] || { y: 80 }).y * 10) - 4 : null, DOOR);
      if (e && c.state === 'queue') e.el.classList.toggle('moving', !!e.moving);
    });
    sweep('s');
    sweep('u', (k, e) => {
      e.el.classList.add('leaving');
      e.el.style.left = DOOR.x + 6 + '%'; e.el.style.top = DOOR.y + '%';
      const f = e.el.querySelector('.fig');
      if (f) f.firstChild && f.firstChild.classList && f.firstChild.classList.add('walking');
      setTimeout(() => e.el.remove(), 1200);
    });

    /* efektler */
    const fxL = document.getElementById('st-fx');
    L.fx.forEach((f) => {
      let x = 50, y = 50;
      const e = f.cid != null ? ent['u' + f.cid] : f.sid ? ent['c' + f.sid] : null;
      if (e) { x = e.x; y = e.y - 4; }
      if (f.t === 'pay') coinFly(stage, x, y);
      const cls = f.t === 'bad' ? 'bad' : f.t === 'tip' ? 'tip' : f.t === 'pay' ? 'pay' : f.match ? 'match' : f.t === 'ready' ? 'ready' : '';
      const text = f.t === 'ready' ? 'Hazır!' : f.text;
      if (!text || f.t === 'pass') return;
      const d = document.createElement('div');
      d.className = 'fx ' + cls;
      d.style.left = x + '%'; d.style.top = y + '%';
      d.textContent = text;
      fxL.appendChild(d);
      setTimeout(() => d.remove(), 1600);
    });
    L.fx = [];

    /* duvar saati ve para efekti */
    const hh = document.getElementById('st-hh'), mm = document.getElementById('st-mm');
    const tmin = KE.OPEN_HOUR * 60 + Math.min(L.minute, KE.MINUTES);
    if (hh) { hh.style.transform = `rotate(${(tmin / 60 % 12) * 30}deg)`; mm.style.transform = `rotate(${(tmin % 60) * 6}deg)`; }
    /* yoğunluk göstergeleri */
    const waitT = L.tickets.filter((t) => t.state === 'wait').length;
    const readyT = ready.filter((t) => !t.paket).length;
    const dirty = L.tables.filter((t) => t.dirty).length, occ = L.tables.filter((t) => t.occ != null).length;
    const lvl = (v, a, c) => v >= c ? 'crit' : v >= a ? 'warn' : 'ok';
    const hud = document.getElementById('st-hud');
    if (hud) hud.innerHTML = [
      ['queue', 'Kuyruk', L.queue.length, lvl(L.queue.length, 3, 6)],
      ['fire', 'Mutfakta', waitT, lvl(waitT, 3, 6)],
      ['tray', 'Bekleyen tabak', readyT, lvl(readyT, 2, 4)],
      ['table', 'Masa', `${occ}/${L.tables.length}`, lvl(occ / Math.max(1, L.tables.length), 0.75, 1)],
      ['broom', 'Kirli', dirty, lvl(dirty, 2, 3)]
    ].map(([ic, l, v, c]) => `<span class="hchip ${c}" title="${l}">${KE.ART.icon(ic)}<b>${v}</b><em>${l}</em></span>`).join('');
  };

  let lastCoin = 0;
  function coinFly(stage, x, y) {
    const now = Date.now();
    if (now - lastCoin < 350) return;
    lastCoin = now;
    const target = document.getElementById('tb-today');
    if (!target) return;
    const sr = stage.getBoundingClientRect(), tr = target.getBoundingClientRect();
    const c = document.createElement('div');
    c.className = 'coinfly';
    c.style.left = (sr.left + sr.width * x / 100) + 'px'; c.style.top = (sr.top + sr.height * y / 100) + 'px';
    document.body.appendChild(c);
    requestAnimationFrame(() => requestAnimationFrame(() => { c.style.left = (tr.left + 10) + 'px'; c.style.top = (tr.top + 6) + 'px'; c.style.transform = 'scale(.5)'; c.style.opacity = '.4'; }));
    setTimeout(() => c.remove(), 900);
  }
  function ownerLook(G) {
    if (!G.ownerLook) G.ownerLook = Object.assign(KE.randomLook(Math.random() < 0.5 ? 'e' : 'k', 'orta'), { outfit: 'onluk', outfitColor: '#d7263d', shirt: '#fdfefe', logo: true, accent: '#ffc93c', head: 'none' });
    return G.ownerLook;
  }
  S.ownerLook = ownerLook;
})();
