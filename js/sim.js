/* Kebab Empire — simülasyon motoru
   Yeni oyun, personel üretimi, dakikalık servis simülasyonu, gün kapanışı, bahşiş/moral, şube simülasyonu. */
(function () {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const MODE = (G) => KE.MODES[G.mode];
  KE.STAR_NEED = [0, 40, 120, 300, 650, 1300]; // bir sonraki yıldıza gereken deneyim
  KE.MINUTES = (KE.CLOSE_HOUR - KE.OPEN_HOUR) * 60;

  /* ---------- Personel üretimi ---------- */
  KE.wageFor = (spec, role) => {
    if (role === 'cirak') return KE.ECON.asgariBrut;
    const stars = Object.values(spec);
    const max = Math.max(1, ...stars);
    return Math.round((40000 + 9500 * (max - 1) + 3500 * (stars.length - 1)) / 500) * 500;
  };
  KE.makeStaff = function (G, o) {
    const id = 's' + (G.nextId++);
    const gender = o.gender || (Math.random() < 0.8 ? 'e' : 'k');
    const age = o.age || pick(['genc', 'orta', 'orta', 'yasli']);
    const s = {
      id, name: o.name, role: o.role, region: o.region || pick(Object.keys(KE.REGIONS)), gender, age,
      spec: Object.assign({}, o.spec || {}), xp: {}, speed: o.speed || 1, quality: o.quality || 0.8, consistency: o.consistency || 0.8,
      waste: o.waste || 0.6, teach: o.teach || 0.5, friendly: o.friendly || rnd(0.4, 0.9), skill: o.skill || rnd(0.4, 0.9),
      trait: o.trait || null, wage: o.wage || KE.wageFor(o.spec || {}, o.role), morale: o.morale || 66, costume: 'temel',
      branchId: o.branchId, look: o.look || KE.randomLook(gender, age), cumBase: 0, tipsMonth: 0, tipsTotal: 0, hiredDay: G.day,
      mentorId: null, servedToday: 0, servedTotal: 0, onBreak: false
    };
    if (s.look.gender !== gender) s.look = KE.randomLook(gender, age);
    return s;
  };
  KE.isCook = (s) => s.role === 'usta' || s.role === 'cirak';

  KE.randomMaster = function (G) {
    const mode = MODE(G);
    const prods = mode.products.map((p) => p.id);
    const n = pick([1, 1, 2, 2, 2, 3]);
    const spec = {};
    const lvl = Math.random();
    for (let i = 0; i < n; i++) {
      const p = pick(prods);
      spec[p] = clamp(Math.round(rnd(1.6, lvl < 0.15 ? 5.4 : lvl < 0.5 ? 4.4 : 3.6)), 1, 5);
    }
    const gender = Math.random() < 0.78 ? 'e' : 'k';
    const max = Math.max(...Object.values(spec));
    const role = max <= 2 && Math.random() < 0.6 ? 'cirak' : 'usta';
    const first = pick(KE.NAMES[gender]);
    const s = KE.makeStaff(G, {
      name: role === 'cirak' ? 'Çırak ' + first : first + ' Usta', role, gender, spec,
      age: role === 'cirak' ? 'genc' : pick(['orta', 'orta', 'yasli', 'genc']),
      speed: rnd(0.8, 1.25), quality: rnd(0.6, 0.98), consistency: rnd(0.6, 0.97), waste: rnd(0.35, 1.1), teach: rnd(0.2, 0.95),
      trait: pick(['mukemmel', 'gosterisci', 'hizli', 'sabirli', 'huysuz', 'hevesli', 'sohbet', null])
    });
    s.fee = role === 'cirak' ? 0 : Math.round(s.wage * (0.3 + max * 0.18) / 500) * 500;
    return s;
  };
  KE.randomWorker = function (G, role) {
    const gender = Math.random() < 0.6 ? 'e' : 'k';
    const first = pick(KE.NAMES[gender]);
    const s = KE.makeStaff(G, {
      name: first, role, gender, age: role === 'mudur' ? pick(['orta', 'yasli']) : pick(['genc', 'genc', 'orta']),
      speed: rnd(0.8, 1.25), friendly: rnd(0.3, 1), skill: rnd(0.3, 1), trait: pick(['sohbet', 'hizli', 'sabirli', 'huysuz', null, null])
    });
    const base = KE.ROLES[role].baseWage;
    s.wage = Math.max(KE.ECON.asgariBrut, Math.round(base * (0.85 + (role === 'mudur' ? s.skill : s.friendly) * 0.3) / 500) * 500);
    return s;
  };

  /* ---------- Şube ---------- */
  KE.makeBranch = function (G, districtId) {
    const d = KE.DISTRICTS.find((x) => x.id === districtId);
    const mode = MODE(G);
    const b = {
      id: 'b' + (G.nextId++), district: districtId, name: d.name + ' ' + (G.mode === 'doner' ? 'Dönercisi' : 'Ocakbaşı'),
      tier: 1, equipment: { cook: 0, prep: 0, cold: 0, service: 0 }, decor: [], prices: {}, menu: {}, stock: {}, usage: {},
      stockLevel: 1.15, cleanliness: 72, rent: Math.round(d.rent * G.priceIndex), openedDay: G.day, managerId: null, history: []
    };
    mode.products.forEach((p) => { b.prices[p.id] = KE.marketPrice(G, p); b.menu[p.id] = true; });
    b.prices[mode.drink.id] = KE.marketPrice(G, mode.drink);
    const est = d.traffic * mode.trafficMul * 0.75;
    Object.keys(mode.ingredients).forEach((k) => {
      let per = 0;
      mode.products.forEach((p) => { per += (p.ing[k] || 0) / mode.products.length; });
      per += (mode.drink.ing[k] || 0) * mode.drinkRate;
      b.usage[k] = per * est * 1.2;
      b.stock[k] = 0;
    });
    return b;
  };
  KE.district = (b) => KE.DISTRICTS.find((x) => x.id === b.district);
  KE.branchStaff = (G, b) => G.staff.filter((s) => s.branchId === b.id);
  KE.equip = (G, b, k) => MODE(G).equipment[k].levels[b.equipment[k]];

  KE.ambience = function (G, b) {
    let a = 0; const styles = {};
    b.decor.forEach((id) => { const d = KE.DECOR.find((x) => x.id === id); if (!d) return; a += d.ambience; if (d.style !== 'personel') styles[d.style] = (styles[d.style] || 0) + 1; });
    let concept = null;
    const top = Object.entries(styles).sort((x, y) => y[1] - x[1])[0];
    if (top && top[1] >= 3) {
      const names = { geleneksel: G.mode === 'kebap' ? 'Otantik Ocakbaşı' : 'Esnaf Lokantası Ruhu', sokak: 'Sokak Lezzeti', modern: 'Modern Büfe', 'lüks': 'Lüks Salon' };
      concept = { style: top[0], name: names[top[0]] };
      const st = KE.branchStaff(G, b);
      const costumed = st.filter((s) => s.costume !== 'temel').length;
      const yoresel = st.filter((s) => s.costume === 'yoresel').length;
      concept.power = 1 + (st.length ? costumed / st.length : 0) * 0.5 + (top[0] === 'geleneksel' && yoresel ? 0.4 : 0);
    }
    return { score: a, concept };
  };

  /* Bir ürün şubede yapılabilir mi? */
  KE.canMake = function (G, b, p) {
    if (!b.menu[p.id]) return false;
    if (p.requiresSpec && !KE.branchStaff(G, b).some((s) => KE.isCook(s) && (s.spec[p.id] || 0) >= 1)) return false;
    return true;
  };
  KE.hasStock = (b, p, count) => Object.entries(p.ing).every(([k, q]) => (b.stock[k] || 0) >= q * count - 1e-9);
  KE.bestStar = function (G, b, pid) {
    let best = 0;
    KE.branchStaff(G, b).forEach((s) => { if (KE.isCook(s)) best = Math.max(best, s.spec[pid] || 0); });
    return best;
  };

  KE.expectedCustomers = function (G, b) {
    const d = KE.district(b);
    const mode = MODE(G);
    const repF = 0.45 + G.reputation / 100 * 0.9;
    const amb = KE.ambience(G, b);
    const ambF = 1 + Math.min(0.35, amb.score / 120) + (amb.concept ? 0.08 * amb.concept.power : 0);
    const wk = KE.isWeekend(G.day) ? 1.18 : 1;
    const hol = KE.holidayOf(G.day) ? 1.25 : 1;
    const rival = 1 - Math.min(0.25, d.rivals * 0.03 + (G.rival.district === d.id ? G.rival.power / 400 : 0));
    const ad = KE.modVal(G, 'traffic') * KE.modVal(G, 'traffic:' + b.id) * (b.signBoost || 1);
    return d.traffic * mode.trafficMul * repF * ambF * wk * hol * rival * ad;
  };

  /* ---------- Yeni oyun ---------- */
  KE.newGame = function (opts) {
    const G = {
      v: 1, mode: opts.mode, owner: opts.owner || 'Patron', shopName: opts.shopName, day: 1, cash: 380000, reputation: 30,
      priceIndex: 1, nextId: 1, staff: [], branches: [], activeBranch: null, loans: [], mods: [], tipRule: 'esit',
      ledger: { days: [], months: [] }, monthExtras: { ads: 0, capex: 0, fines: 0, other: 0 }, journal: [], news: [], goals: {},
      phase: 'morning', rival: { power: 20, district: null }, market: [], workers: [], flags: {}, centralKitchen: false,
      eventLog: [], pendingEvent: null, payLate: false, achievements: [], lastSummary: null, speed: 1
    };
    const b = KE.makeBranch(G, opts.district);
    b.name = opts.shopName || b.name;
    G.branches.push(b); G.activeBranch = b.id;
    const t = opts.master;
    const usta = KE.makeStaff(G, Object.assign({}, t, { role: t.role || 'usta', branchId: b.id }));
    G.staff.push(usta);
    const tmpl = KE.MASTER_TEMPLATES[G.mode];
    const cirak = tmpl.find((x) => x.role === 'cirak');
    G.staff.push(KE.makeStaff(G, Object.assign({}, cirak, { branchId: b.id, morale: 70 })));
    const k = KE.randomWorker(G, G.mode === 'kebap' ? 'garson' : 'kasiyer');
    k.branchId = b.id; k.name = G.mode === 'kebap' ? 'Garson ' + k.name : k.name; G.staff.push(k);
    if (G.mode === 'kebap') { const ks = KE.randomWorker(G, 'kasiyer'); ks.branchId = b.id; G.staff.push(ks); }
    KE.refreshMarket(G); KE.refreshWorkers(G);
    KE.morning(G);
    return G;
  };

  KE.refreshMarket = function (G) {
    const used = new Set(G.staff.map((s) => s.name));
    const tmpl = KE.MASTER_TEMPLATES[G.mode].filter((t) => !used.has(t.name) && t.role !== 'cirak');
    G.market = [];
    if (tmpl.length && Math.random() < 0.7) {
      const t = pick(tmpl);
      const s = KE.makeStaff(G, Object.assign({}, t, { role: 'usta' }));
      const max = Math.max(...Object.values(s.spec));
      s.fee = Math.round(s.wage * (0.3 + max * 0.18) / 500) * 500;
      G.market.push(s);
    }
    while (G.market.length < 5) G.market.push(KE.randomMaster(G));
  };
  KE.refreshWorkers = function (G) {
    G.workers = [];
    const roles = ['kasiyer', 'garson', 'kurye', 'temizlik', 'mudur', 'kasiyer', 'garson', 'kurye'];
    roles.forEach((r) => G.workers.push(KE.randomWorker(G, r)));
  };

  /* ---------- Sabah: stok tamamlama ---------- */
  KE.morning = function (G) {
    G.today = {};
    G.branches.forEach((b) => {
      let cost = 0;
      Object.keys(b.usage).forEach((k) => {
        const target = b.usage[k] * b.stockLevel;
        const need = Math.max(0, target - (b.stock[k] || 0));
        if (need > 0) { cost += need * KE.ingPrice(G, b, k); b.stock[k] = (b.stock[k] || 0) + need; }
      });
      G.cash -= cost;
      G.today[b.id] = { purchases: cost };
    });
    G.phase = 'morning';
  };
  KE.buyExtra = function (G, b, k, qty) {
    const c = qty * KE.ingPrice(G, b, k);
    G.cash -= c; b.stock[k] = (b.stock[k] || 0) + qty;
    G.today[b.id].purchases += c;
    return c;
  };

  /* ---------- Servis simülasyonu ---------- */
  KE.startService = function (G) {
    G.phase = 'service';
    G.live = {};
    G.branches.forEach((b) => { G.live[b.id] = KE.newLive(G, b); });
  };
  KE.newLive = function (G, b) {
    const st = KE.branchStaff(G, b);
    st.forEach((s) => { s.servedToday = 0; s.onBreak = false; s.tipsToday = 0; });
    const expected = KE.expectedCustomers(G, b);
    const curveSum = Object.values(KE.HOUR_CURVE).reduce((a, v) => a + v, 0);
    return {
      branchId: b.id, minute: 0, queue: [], cooks: {}, nextCust: 1, spawnAcc: 0, expected, curveSum,
      stats: { arrivals: 0, served: 0, lost: 0, lostPrice: 0, lostWait: 0, lostFull: 0, lostStock: 0, revenue: 0, card: 0, cash: 0, tips: 0,
        satSum: 0, satN: 0, matches: 0, byProduct: {}, hourly: new Array(13).fill(0), hourlyCust: new Array(13).fill(0), stockouts: {}, byType: {},
        repDelta: 0, best: null, playerServed: 0, gurmeHappy: 0 },
      fx: [], player: { active: false, order: null, step: 0, errors: 0, start: 0, opts: [] }, done: false
    };
  };

  function availableProducts(G, b) {
    return MODE(G).products.filter((p) => KE.canMake(G, b, p));
  }
  function chooseType(G, b, hour) {
    const d = KE.district(b);
    const mode = MODE(G);
    const weights = [];
    Object.entries(KE.CUSTOMER_TYPES).forEach(([t, ct]) => {
      let w = (d.mix[t] || 0.1) * ((ct.hours && ct.hours[hour]) || 1);
      if (KE.isWeekend(G.day) && ct.weekend) w *= ct.weekend;
      const favs = mode.favorites[t] || [];
      let best = 0; favs.forEach((pid) => { const p = mode.products.find((x) => x.id === pid); if (p && KE.canMake(G, b, p)) best = Math.max(best, Math.max(1, KE.bestStar(G, b, pid))); });
      w *= Math.max(0.6, 1 + 0.15 * (best - 2));
      if (t === 'gurme') w *= best >= 5 ? 1.6 : best >= 4 ? 1 : 0.25;
      w *= KE.modVal(G, 'type:' + t);
      weights.push([t, w]);
    });
    let tot = weights.reduce((a, x) => a + x[1], 0), r = Math.random() * tot;
    for (const [t, w] of weights) { if ((r -= w) <= 0) return t; }
    return weights[0][0];
  }
  function chooseProduct(G, b, type, count) {
    const mode = MODE(G);
    const avail = availableProducts(G, b);
    if (!avail.length) return null;
    const favs = (mode.favorites[type] || []).map((id) => avail.find((p) => p.id === id)).filter(Boolean);
    let p = null;
    if (favs.length && Math.random() < 0.72) {
      const w = favs.map((_, i) => 3 - i); let r = Math.random() * w.reduce((a, x) => a + x, 0);
      for (let i = 0; i < favs.length; i++) { if ((r -= w[i]) <= 0) { p = favs[i]; break; } }
    }
    if (!p) p = pick(avail);
    if (!KE.hasStock(b, p, count)) {
      const alt = avail.filter((x) => KE.hasStock(b, x, count));
      return alt.length ? { p: pick(alt), stockMiss: p } : { p: null, stockMiss: p };
    }
    return { p };
  }

  function spawn(G, b, L, headless) {
    const hour = KE.OPEN_HOUR + Math.floor(L.minute / 60);
    const rate = L.expected * (KE.HOUR_CURVE[hour] || 0.3) / L.curveSum / 60;
    L.spawnAcc += rate * rnd(0.6, 1.4);
    while (L.spawnAcc >= 1) {
      L.spawnAcc -= 1;
      const type = chooseType(G, b, hour);
      const ct = KE.CUSTOMER_TYPES[type];
      const count = ct.group && Math.random() < 0.55 ? Math.round(rnd(ct.group[0], ct.group[1])) : 1;
      L.stats.arrivals += count;
      const svc = KE.equip(G, b, 'service');
      const queueCap = svc.queue + (b.decor.includes('dismasa') ? 2 : 0);
      if (L.queue.length >= queueCap) { L.stats.lost += count; L.stats.lostFull += count; if (!headless) L.fx.push({ t: 'leave', text: 'Yer yok!' }); continue; }
      const ch = chooseProduct(G, b, type, count);
      if (ch && ch.stockMiss && !L.stats.stockouts[ch.stockMiss.id]) L.stats.stockouts[ch.stockMiss.id] = L.minute;
      if (!ch || !ch.p) { L.stats.lost += count; L.stats.lostStock += count; if (!headless) L.fx.push({ t: 'leave', text: 'Bitmiş mi?!' }); continue; }
      const p = ch.p;
      const price = b.prices[p.id];
      const ratio = price / KE.marketPrice(G, p);
      const threshold = 1.08 + (1 - ct.priceSens) * 0.6;
      if (ratio > threshold && Math.random() < 0.85) { L.stats.lost += count; L.stats.lostPrice += count; if (!headless) L.fx.push({ t: 'leave', text: 'Çok pahalı!' }); continue; }
      const st = KE.branchStaff(G, b);
      const garson = st.some((s) => s.role === 'garson');
      const mgr = b.id !== G.activeBranch && headless ? (st.find((s) => s.role === 'mudur') || null) : null;
      let patience = ct.patience * svc.patience * (G.mode === 'kebap' ? 1.7 : 1) * KE.modVal(G, 'patience');
      if (G.mode === 'kebap' && !garson) patience *= 0.8;
      if (headless && b.id !== G.activeBranch) patience *= mgr ? 0.95 + mgr.skill * 0.1 : 0.85;
      const c = { id: L.nextCust++, type, count, pid: p.id, price, ratio, patience, wait: 0, cookId: null, look: headless ? null : KE.customerLook(type), arrive: L.minute };
      L.queue.push(c);
    }
  }

  function cookSpeed(G, b, s) {
    const tr = KE.TRAITS[s.trait] || {};
    const prep = KE.equip(G, b, 'prep');
    const hasKasiyer = KE.branchStaff(G, b).some((x) => x.role === 'kasiyer' || x.role === 'garson');
    return s.speed * (1 + (tr.speed || 0)) * prep.speed * (0.82 + s.morale * 0.0036) * (hasKasiyer ? 1 : 0.75) * (b.cleanliness < 35 ? 0.92 : 1);
  }
  KE.cookSpeed = cookSpeed;

  function activeCooks(G, b) {
    const stations = KE.equip(G, b, 'cook').stations;
    return KE.branchStaff(G, b).filter((s) => KE.isCook(s) && !s.onBreak)
      .sort((a, c) => (Math.max(0, ...Object.values(c.spec)) - Math.max(0, ...Object.values(a.spec))) || (c.speed - a.speed)).slice(0, stations);
  }
  KE.activeCooks = activeCooks;

  function assign(G, b, L) {
    const cooks = activeCooks(G, b);
    const mode = MODE(G);
    cooks.forEach((s) => {
      if (L.cooks[s.id]) return;
      const waiting = L.queue.filter((c) => !c.cookId && !c.player);
      if (!waiting.length) return;
      let best = null, bestScore = -1;
      waiting.slice(0, 4).forEach((c, i) => {
        const p = mode.products.find((x) => x.id === c.pid);
        const star = s.spec[c.pid] || 0;
        if (p.requiresSpec && star < 1) return;
        const sc = star * 2 - i * 1.2 + (c.wait / c.patience) * 4;
        if (sc > bestScore) { bestScore = sc; best = c; }
      });
      if (!best) return;
      const p = mode.products.find((x) => x.id === best.pid);
      if (!KE.hasStock(b, p, best.count)) {
        if (!L.stats.stockouts[p.id]) L.stats.stockouts[p.id] = L.minute;
        L.queue.splice(L.queue.indexOf(best), 1); L.stats.lost += best.count; L.stats.lostStock += best.count;
        L.fx.push({ t: 'leave', text: p.name + ' bitti!' });
        return;
      }
      Object.entries(p.ing).forEach(([k, q]) => { b.stock[k] -= q * best.count; });
      best.cookId = s.id;
      const dur = p.prep * (1 + 0.45 * (best.count - 1)) / cookSpeed(G, b, s);
      L.cooks[s.id] = { cid: best.id, remain: dur, total: dur };
    });
  }

  /* Siparişi tamamla: kalite, memnuniyet, ödeme, bahşiş */
  function complete(G, b, L, c, cook, opts) {
    opts = opts || {};
    const mode = MODE(G);
    const p = mode.products.find((x) => x.id === c.pid);
    const ct = KE.CUSTOMER_TYPES[c.type];
    const st = KE.branchStaff(G, b);
    const tier = KE.TIERS[b.tier];
    const prep = KE.equip(G, b, 'prep');
    let star, quality;
    if (cook === 'player') {
      star = 4;
      quality = clamp(5 - opts.errors * 0.9 - opts.slow + tier.quality + (prep.quality || 0), 0, 6);
    } else {
      const tr = KE.TRAITS[cook.trait] || {};
      star = Math.max(p.requiresSpec ? 1 : 1, cook.spec[c.pid] || 0);
      const noise = (1 - cook.consistency) * rnd(-2, 0.6);
      quality = star + tier.quality + (prep.quality || 0) + (tr.quality || 0) + noise + (cook.quality - 0.8);
      if (tr.grumpy && cook.morale < 40) quality -= 1.2;
      if (cook.morale < 30) quality -= 0.5;
      quality = clamp(quality, 0, 6);
    }
    const amb = KE.ambience(G, b);
    const front = st.filter((s) => s.role === 'kasiyer' || s.role === 'garson');
    const friendly = front.length ? front.reduce((a, s) => a + s.friendly * (0.7 + s.morale / 200), 0) / front.length : 0.3;
    const totalWait = c.wait;
    const speedScore = 16 * clamp(1 - totalWait / (c.patience * 1.6), -0.5, 1);
    const pricePen = c.ratio > 1 ? (c.ratio - 1) * 70 * ct.priceSens : -(1 - c.ratio) * 25 * ct.priceSens;
    const isFav = (mode.favorites[c.type] || []).includes(c.pid);
    const match = isFav && star >= 4 && quality >= 4;
    let sat = 30 + quality * 8.5 + speedScore + Math.min(10, amb.score / 5) + (amb.concept ? 4 * amb.concept.power : 0) + friendly * 7 + (b.cleanliness - 50) / 10 - pricePen + (match ? 8 : 0);
    if (G.mode === 'kebap' && !st.some((s) => s.role === 'garson')) sat -= 6;
    if (b.id !== G.activeBranch) { const mgr = st.find((s) => s.role === 'mudur'); sat += mgr ? (mgr.skill - 0.5) * 10 : -7; }
    sat = clamp(sat, 0, 100);
    const drinks = Math.random() < mode.drinkRate ? c.count : 0;
    const pay = c.price * c.count + drinks * b.prices[mode.drink.id];
    if (drinks) Object.entries(mode.drink.ing).forEach(([k, q]) => { b.stock[k] = Math.max(0, (b.stock[k] || 0) - q * drinks); });
    const satMul = sat < 50 ? 0 : sat < 68 ? 0.45 : sat < 84 ? 1 : 1.7;
    let tipMul = satMul * (match ? 1.4 : 1) * (0.7 + friendly * 0.6);
    if (cook !== 'player') {
      const tr = KE.TRAITS[cook.trait] || {};
      tipMul *= 1 + (tr.tip || 0);
      tipMul *= 0.8 + cook.morale / 250;
      if (cook.costume === 'yoresel' && match) tipMul *= 1.12;
    } else tipMul *= 1.25;
    front.forEach((s) => { const tr = KE.TRAITS[s.trait] || {}; tipMul *= 1 + (tr.tip || 0) / Math.max(1, front.length); });
    const tip = Math.round(pay * ct.tip * tipMul / 5) * 5;
    const S = L.stats;
    S.served += c.count; S.revenue += pay; S.tips += tip;
    if (Math.random() < 0.66) S.card += pay; else S.cash += pay;
    S.satSum += sat * c.count; S.satN += c.count;
    S.byProduct[c.pid] = (S.byProduct[c.pid] || 0) + c.count;
    S.byType[c.type] = (S.byType[c.type] || 0) + c.count;
    const h = Math.min(12, Math.floor(L.minute / 60));
    S.hourly[h] += pay; S.hourlyCust[h] += c.count;
    S.repDelta += (sat - 70) / 2600 * c.count * (c.type === 'gurme' ? 3 : 1);
    if (match) S.matches += c.count;
    if (c.type === 'gurme' && sat > 85) S.gurmeHappy++;
    if (!S.best || tip > S.best.tip) S.best = { tip, type: c.type, pid: c.pid, cook: cook === 'player' ? G.owner : cook.name };
    if (cook !== 'player') {
      cook.servedToday += c.count; cook.servedTotal += c.count;
      const tr = KE.TRAITS[cook.trait] || {};
      KE.gainXp(cook, c.pid, c.count * (1 + (tr.xp || 0)) * (p.requiresSpec && !(cook.spec[c.pid]) ? 0 : 1));
    } else S.playerServed += c.count;
    front.forEach((s) => { s.servedToday += c.count / front.length; });
    if (!opts.headless) L.fx.push({ t: 'served', cid: c.id, tip, pay, match, sat, cook: cook === 'player' ? 'player' : cook.id, text: match ? 'Ellerine sağlık!' : sat > 84 ? 'Harika!' : sat > 62 ? 'Güzel' : sat > 45 ? 'İdare eder' : 'Bir daha gelmem' });
  }

  KE.gainXp = function (s, pid, amt) {
    if (!amt) return false;
    const cur = s.spec[pid] || 0;
    if (cur >= 5) return false;
    s.xp[pid] = (s.xp[pid] || 0) + amt;
    const need = KE.STAR_NEED[cur + 1];
    if (s.xp[pid] >= need) { s.xp[pid] -= need; s.spec[pid] = cur + 1; s.levelUps = (s.levelUps || []).concat([{ pid, star: cur + 1 }]); return true; }
    return false;
  };

  /* Bir dakikalık adım */
  KE.tick = function (G, b, L, headless) {
    if (L.done) return;
    if (L.minute < KE.MINUTES - 15) spawn(G, b, L, headless);
    assign(G, b, L);
    const st = KE.branchStaff(G, b);
    Object.entries(L.cooks).forEach(([sid, job]) => {
      job.remain -= 1;
      if (job.remain <= 0) {
        const c = L.queue.find((x) => x.id === job.cid);
        const cook = st.find((s) => s.id === sid);
        delete L.cooks[sid];
        if (c && cook) { L.queue.splice(L.queue.indexOf(c), 1); complete(G, b, L, c, cook, { headless }); }
      }
    });
    for (let i = L.queue.length - 1; i >= 0; i--) {
      const c = L.queue[i];
      c.wait += 1;
      if (!c.cookId && !c.player && c.wait > c.patience) {
        L.queue.splice(i, 1); L.stats.lost += c.count; L.stats.lostWait += c.count; L.stats.repDelta -= 0.12 * c.count;
        if (!headless) L.fx.push({ t: 'leave', cid: c.id, text: 'Bekletmeyin bizi!' });
      }
    }
    L.minute += 1;
    if (L.minute >= KE.MINUTES && !L.queue.some((c) => c.cookId || c.player)) {
      L.queue.forEach((c) => { L.stats.lost += c.count; });
      L.queue = []; L.done = true;
    }
  };

  /* Oyuncu tezgâhta */
  KE.playerToggle = function (G, on) {
    const b = G.branches.find((x) => x.id === G.activeBranch);
    const L = G.live[b.id];
    L.player.active = on;
    KE.branchStaff(G, b).forEach((s) => { s.onBreak = false; });
    if (on) {
      const cooks = KE.branchStaff(G, b).filter(KE.isCook).sort((a, c) => Math.max(0, ...Object.values(a.spec)) - Math.max(0, ...Object.values(c.spec)));
      const stations = KE.equip(G, b, 'cook').stations;
      if (cooks.length >= stations && cooks[0] && !L.cooks[cooks[0].id]) { cooks[0].onBreak = true; cooks[0].hadBreak = true; }
    } else if (L.player.order) {
      const c = L.queue.find((x) => x.id === L.player.order);
      if (c) c.player = false;
      L.player.order = null;
    }
  };
  KE.playerTake = function (G) {
    const b = G.branches.find((x) => x.id === G.activeBranch);
    const L = G.live[b.id];
    if (!L.player.active || L.player.order) return null;
    const c = L.queue.find((x) => !x.cookId && !x.player);
    if (!c) return null;
    const p = MODE(G).products.find((x) => x.id === c.pid);
    if (!KE.hasStock(b, p, c.count)) return null;
    Object.entries(p.ing).forEach(([k, q]) => { b.stock[k] -= q * c.count; });
    c.player = true;
    const decoys = MODE(G).products.filter((x) => x.id !== p.id).flatMap((x) => x.steps).filter((s) => !p.steps.includes(s));
    const opts = p.steps.concat([pick(decoys), pick(decoys)]).filter((v, i, a) => a.indexOf(v) === i).sort(() => Math.random() - 0.5);
    Object.assign(L.player, { order: c.id, step: 0, errors: 0, start: L.minute, opts });
    return c;
  };
  KE.playerStep = function (G, label) {
    const b = G.branches.find((x) => x.id === G.activeBranch);
    const L = G.live[b.id];
    const P = L.player;
    const c = L.queue.find((x) => x.id === P.order);
    if (!c) { P.order = null; return { done: true }; }
    const p = MODE(G).products.find((x) => x.id === c.pid);
    if (p.steps[P.step] === label) {
      P.step++;
      if (P.step >= p.steps.length) {
        const took = L.minute - P.start;
        const slow = took > p.prep * 2 ? 1 : took > p.prep * 1.3 ? 0.4 : 0;
        L.queue.splice(L.queue.indexOf(c), 1);
        complete(G, b, L, c, 'player', { errors: P.errors, slow });
        P.order = null;
        return { done: true, ok: true };
      }
      return { ok: true };
    }
    P.errors++;
    return { ok: false };
  };

  /* Servisi bitir: arka plan şubeleri çalıştır, özet üret */
  KE.finishService = function (G) {
    G.branches.forEach((b) => {
      const L = G.live[b.id];
      let guard = 0;
      while (!L.done && guard++ < 2000) KE.tick(G, b, L, b.id !== G.activeBranch || L.fast);
    });
    G.phase = 'closing';
    const summary = { day: G.day, branches: {} };
    G.branches.forEach((b) => {
      const L = G.live[b.id];
      const S = L.stats;
      const st = KE.branchStaff(G, b);
      /* paket servis */
      const couriers = st.filter((s) => s.role === 'kurye');
      let paket = 0, paketRev = 0;
      if (couriers.length) {
        const cap = couriers.reduce((a, s) => a + 30 * s.speed * (0.8 + s.morale / 250), 0);
        const demand = L.expected * 0.2 * (0.6 + G.reputation / 100);
        const avail = availableProducts(G, b).filter((p) => KE.hasStock(b, p, 1));
        paket = Math.floor(Math.min(cap, demand));
        for (let i = 0; i < paket && avail.length; i++) {
          const p = pick(avail);
          if (!KE.hasStock(b, p, 1)) continue;
          Object.entries(p.ing).forEach(([k, q]) => { b.stock[k] -= q; });
          paketRev += b.prices[p.id];
          S.byProduct[p.id] = (S.byProduct[p.id] || 0) + 1;
        }
        S.revenue += paketRev; S.card += paketRev;
      }
      /* fire */
      const cold = KE.equip(G, b, 'cold');
      const cooks = st.filter(KE.isCook);
      const wasteMul = cooks.length ? cooks.reduce((a, s) => a + s.waste, 0) / cooks.length : 1;
      let wasteVal = 0;
      Object.keys(b.stock).forEach((k) => {
        const lost = b.stock[k] * cold.waste * wasteMul;
        wasteVal += lost * KE.ingPrice(G, b, k);
        b.stock[k] -= lost;
      });
      /* kullanım ortalaması (stok hedefi için) */
      const usedToday = {};
      Object.keys(b.usage).forEach((k) => { usedToday[k] = 0; });
      Object.entries(S.byProduct).forEach(([pid, n]) => {
        const p = MODE(G).products.find((x) => x.id === pid);
        if (p) Object.entries(p.ing).forEach(([k, q]) => { usedToday[k] += q * n; });
      });
      Object.entries(MODE(G).drink.ing).forEach(([k, q]) => { usedToday[k] += q * S.served * MODE(G).drinkRate; });
      Object.keys(b.usage).forEach((k) => {
        const lostDemand = S.stockouts && Object.keys(S.stockouts).length ? 1.15 : 1;
        b.usage[k] = b.usage[k] * 0.6 + usedToday[k] * lostDemand * 0.4;
      });
      summary.branches[b.id] = {
        name: b.name, stats: S, paket, paketRev, wasteVal, purchases: G.today[b.id].purchases,
        sat: S.satN ? S.satSum / S.satN : 0, expected: L.expected
      };
    });
    G.lastSummary = summary;
    return summary;
  };

  /* Günü kesinleştir: bahşiş, moral, deneyim, itibar, defter */
  KE.TIP_RULES = {
    esit: { name: 'Eşit paylaşım', desc: 'Kavanoz herkese eşit bölünür. Ekip morali dengeli artar.' },
    usta: { name: 'Ustaya ağırlık', desc: 'Ustalar iki pay alır. Usta sadakati artar, diğerleri biraz bozulur.' },
    performans: { name: 'Performansa göre', desc: 'Kim çok servis yaptıysa o çok alır. Rekabet yaratır.' },
    kasa: { name: 'Kasaya al', desc: 'Bahşiş işletmeye kalır. Moral sert düşer.' }
  };
  KE.finalizeDay = function (G, todayRule) {
    const S0 = G.lastSummary;
    const out = { levelUps: [], quits: [], branches: {} };
    const sabit = {};
    G.branches.forEach((b) => {
      const sum = S0.branches[b.id];
      const S = sum.stats;
      const st = KE.branchStaff(G, b);
      const rule = b.id === G.activeBranch ? (todayRule || G.tipRule) : G.tipRule;
      const jar = S.tips;
      const shares = {};
      if (rule === 'kasa') { G.cash += jar; }
      else if (st.length) {
        let weights = st.map((s) => [s, rule === 'usta' ? (s.role === 'usta' ? 2 : 1) : rule === 'performans' ? Math.max(0.2, s.servedToday) : 1]);
        const tot = weights.reduce((a, w) => a + w[1], 0);
        weights.forEach(([s, w]) => { shares[s.id] = jar * w / tot; });
      }
      const perfSorted = st.slice().sort((a, c) => c.servedToday - a.servedToday);
      const amb = KE.ambience(G, b);
      const workloadLimit = G.mode === 'doner' ? 60 : 30;
      st.forEach((s) => {
        const tr = KE.TRAITS[s.trait] || {};
        const before = s.morale;
        let dm = (62 - s.morale) * 0.1;
        const share = shares[s.id] || 0;
        s.tipsMonth += share; s.tipsTotal += share; s.tipsToday = share;
        const dailyWage = s.wage / 30;
        dm += Math.min(5, share / dailyWage * 6);
        if (rule === 'kasa') dm -= 11;
        if (rule === 'usta') dm += s.role === 'usta' ? 3 : -2;
        if (rule === 'performans') dm += s === perfSorted[0] ? 4 : s === perfSorted[perfSorted.length - 1] ? -2.5 : 0.5;
        if (KE.isCook(s) && s.servedToday > workloadLimit * 1.6) dm -= 6;
        else if (KE.isCook(s) && s.servedToday > workloadLimit) dm -= 3;
        b.decor.forEach((id) => { const d = KE.DECOR.find((x) => x.id === id); if (d && d.morale) dm += d.morale * 0.5; });
        const cos = KE.COSTUMES.find((x) => x.id === s.costume);
        dm += cos.morale * 0.06;
        if (s.hadBreak) { dm += 2; s.hadBreak = false; }
        if (amb.concept && s.costume !== 'temel') dm += 0.6;
        if (G.payLate) dm -= 3;
        if (dm < 0 && tr.moraleStable) dm *= 1 - tr.moraleStable;
        s.morale = clamp(s.morale + dm, 0, 100);
        s.moraleDelta = s.morale - before;
        if (s.levelUps && s.levelUps.length) { s.levelUps.forEach((u) => out.levelUps.push({ name: s.name, pid: u.pid, star: u.star })); s.levelUps = []; }
      });
      /* usta-çırak */
      st.filter((s) => s.mentorId).forEach((c) => {
        const m = st.find((x) => x.id === c.mentorId);
        if (!m) { c.mentorId = null; return; }
        const tm = KE.TRAITS[m.trait] || {}, tc = KE.TRAITS[c.trait] || {};
        Object.entries(m.spec).forEach(([pid, star]) => {
          if ((c.spec[pid] || 0) >= star - 1) return;
          if (KE.gainXp(c, pid, m.teach * 4 * (1 + (tm.teachBonus || 0)) * (1 + (tc.xp || 0)))) out.levelUps.push({ name: c.name, pid, star: c.spec[pid], mentor: m.name });
        });
      });
      /* istifa */
      st.forEach((s) => {
        if (s.morale < 18 && Math.random() < 0.3) { out.quits.push({ name: s.name, role: s.role, branch: b.name }); s.quit = true; }
      });
      /* temizlik */
      const cleaners = st.filter((s) => s.role === 'temizlik');
      b.cleanliness = clamp(b.cleanliness - S.served / 22 + cleaners.reduce((a, s) => a + 14 * (0.7 + s.morale / 200), 0) + 4, 5, 100);
      /* defter */
      const fixed = (b.rent + KE.utilities(G, b) + st.reduce((a, s) => a + s.wage * (1 + KE.ECON.fazlaMesaiOrani) * 1.2 + KE.ECON.yolYardimiAylik, 0)) / 30;
      sabit[b.id] = fixed;
      const sarf = S.revenue * KE.ECON.sarfOrani;
      G.cash -= sarf;
      const purchases = sum.purchases + sarf;
      G.cash += S.revenue;
      const entry = {
        day: G.day, date: KE.dateStr(G.day), month: KE.monthKey(G.day), branchId: b.id, revenue: S.revenue, card: S.card, cash: S.cash,
        purchases, sarf, waste: sum.wasteVal, tips: S.tips, tipRule: rule, served: S.served, lost: S.lost, arrivals: S.arrivals, sat: sum.sat,
        byProduct: S.byProduct, hourly: S.hourly, hourlyCust: S.hourlyCust, paket: sum.paket, paketRev: sum.paketRev, fixed,
        net: S.revenue / (1 + KE.ECON.kdvRestoran) - purchases - fixed, stockouts: S.stockouts
      };
      G.ledger.days.push(entry);
      b.history.push({ day: G.day, revenue: S.revenue, net: entry.net, sat: sum.sat });
      out.branches[b.id] = entry;
    });
    G.staff = G.staff.filter((s) => !s.quit);
    /* itibar */
    const totalRep = G.branches.reduce((a, b) => a + S0.branches[b.id].stats.repDelta, 0);
    let dRep = clamp(totalRep, -2, 1.5);
    if (dRep > 0 && G.reputation > 55) dRep *= Math.max(0.15, 1 - (G.reputation - 55) / 55);
    G.reputation = clamp(G.reputation + dRep, 0, 100);
    /* hedefler, olaylar, günlük */
    out.journal = KE.writeJournal(G, S0, out);
    G.journal.unshift({ day: G.day, date: KE.dateStr(G.day), text: out.journal });
    if (G.journal.length > 60) G.journal.length = 60;
    G.mods.forEach((m) => { m.days -= 1; }); G.mods = G.mods.filter((m) => m.days > 0);
    out.goals = KE.checkGoals(G);
    if (KE.isMonthEnd(G.day)) out.month = KE.closeMonth(G, G.day);
    if (KE.isWeekEnd(G.day)) { out.news = KE.writeNews(G); G.news.unshift(out.news); KE.refreshMarket(G); KE.refreshWorkers(G); G.rival.power += 3; }
    G.payLate = G.cash < 0;
    G.day += 1;
    G.pendingEvent = KE.rollEvent(G);
    G.live = null;
    KE.morning(G);
    return out;
  };

  KE.checkGoals = function (G) {
    const done = [];
    const test = {
      ilkhafta: () => G.day >= 7 && G.ledger.days.filter((d) => d.day <= 7).reduce((a, d) => a + d.net, 0) > 0,
      itibar50: () => G.reputation >= 50,
      usta5: () => G.staff.some((s) => Object.values(s.spec).some((v) => v >= 5)),
      kostum: () => G.staff.length > 0 && G.staff.every((s) => s.costume !== 'temel'),
      konsept: () => G.branches.some((b) => KE.ambience(G, b).concept),
      sube2: () => G.branches.length >= 2,
      ciro1m: () => G.ledger.months.some((m) => m.revenue >= 1000000),
      itibar80: () => G.reputation >= 80,
      sube4: () => G.branches.length >= 4
    };
    KE.GOALS.forEach((g) => {
      if (!G.goals[g.id] && test[g.id] && test[g.id]()) { G.goals[g.id] = G.day; G.cash += g.reward; done.push(g); }
    });
    return done;
  };

  /* Hızlı geç: aktif şubeyi de arka planda oynat */
  KE.fastForward = function (G) {
    const b = G.branches.find((x) => x.id === G.activeBranch);
    const L = G.live[b.id];
    L.fast = true;
    if (L.player.active) KE.playerToggle(G, false);
    let guard = 0;
    while (!L.done && guard++ < 2000) KE.tick(G, b, L, true);
  };

  KE.openBranch = function (G, districtId) {
    const d = KE.DISTRICTS.find((x) => x.id === districtId);
    const cost = KE.branchCost(G, d);
    const b = KE.makeBranch(G, districtId);
    G.branches.push(b);
    G.cash -= cost;
    KE.addExtra(G, 'capex', cost);
    let c = 0;
    Object.keys(b.usage).forEach((k) => { const q = b.usage[k] * b.stockLevel; c += q * KE.ingPrice(G, b, k); b.stock[k] = q; });
    G.cash -= c;
    G.today[b.id] = { purchases: c };
    return b;
  };
  KE.branchCost = (G, d) => Math.round((d.rent * 3 + 350000) * G.priceIndex / 1000) * 1000;
})();
