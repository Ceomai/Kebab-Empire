/* Kebab Empire — simülasyon motoru (5/8): servis
   Müşteri gelişi, sipariş seçimi, çalışanların görevleri, memnuniyet/bahşiş, otomatik ekip ve dakikalık adım. */
(function () {
  const { clamp, rnd, pick, mode: MODE, prod: prodOf } = KE.U;
  KE.MINUTES = (KE.CLOSE_HOUR - KE.OPEN_HOUR) * 60;
  KE.MINUTE_MS = 400; // 1× hızda bir oyun dakikası

  /* ---------- Servis ---------- */
  KE.startService = function (G) {
    KE.pickMid(G);
    KE.RNG.seed(G, 'svc');
    G.dayLog = [];
    G.phase = 'service';
    G.live = {};
    G.branches.forEach((b) => {
      const L = G.live[b.id] = KE.newLive(G, b);
      if (!KE.branchStaff(G, b).some(KE.isCook)) { L.done = true; L.closed = true; }
    });
  };
  KE.newLive = function (G, b) {
    KE.branchStaff(G, b).forEach((s) => { s.servedToday = 0; s.tipsToday = 0; s.tasksToday = 0; s.minEnergy = 100; s.task = null; s.home = s.offDay === G.day; if (s.home) s.pos = 'mola'; });
    const expected = KE.expectedCustomers(G, b);
    const curveSum = Object.values(KE.HOUR_CURVE).reduce((a, v) => a + v, 0);
    const tables = [];
    for (let i = 0; i < KE.tableCount(G, b); i++) tables.push({ id: i, occ: null, dirty: false, by: null });
    return {
      branchId: b.id, minute: 0, custs: {}, queue: [], tickets: [], tables, nextId: 1, spawnAcc: 0, paketAcc: 0, expected, curveSum,
      stats: { arrivals: 0, served: 0, lost: 0, lostPrice: 0, lostWait: 0, lostFull: 0, lostStock: 0, lostFood: 0, revenue: 0, card: 0, cash: 0, tips: 0,
        satSum: 0, satN: 0, matches: 0, byProduct: {}, hourly: new Array(14).fill(0), hourlyCust: new Array(14).fill(0), stockouts: {}, byType: {},
        repDelta: 0, best: null, playerServed: 0, gurmeHappy: 0, paket: 0, paketRev: 0, cold: 0 },
      fx: [], player: { active: false, tid: null, step: 0, errors: 0, start: 0, slots: [], sel: 0, combo: 0 }, done: false,
      special: KE.specialDay(G.day)
    };
  };

  function availableProducts(G, b) { return MODE(G).products.filter((p) => KE.canMake(G, b, p)); }

  /* Saat başına müşteri tipi ağırlıkları (zar atmaz). Servis bunu kullanır; sabah stok tahmini de aynısını okur.
     day verilirse o günün hafta sonu/özel gün etkisiyle hesaplanır (varsayılan bugün). */
  KE.typeWeights = function (G, b, hour, day) {
    const d = KE.district(b);
    const mode = MODE(G);
    const D = day == null ? G.day : day;
    const sp = KE.specialDay(D), wkEnd = KE.isWeekend(D);
    const weights = [];
    Object.entries(KE.CUSTOMER_TYPES).forEach(([t, ct]) => {
      let w = (d.mix[t] || 0.1) * ((ct.hours && ct.hours[hour]) || 1);
      if (wkEnd && ct.weekend) w *= ct.weekend;
      let best = 0;
      (mode.favorites[t] || []).forEach((pid) => { const p = prodOf(G, pid); if (p && KE.canMake(G, b, p)) best = Math.max(best, Math.max(1, KE.bestStar(G, b, pid))); });
      w *= Math.max(0.6, 1 + 0.15 * (best - 2));
      if (t === 'gurme') w *= best >= 5 ? 1.6 : best >= 4 ? 1 : 0.25;
      w *= KE.modVal(G, 'type:' + t);
      if (sp && sp.types[t]) w *= sp.types[t];
      weights.push([t, w]);
    });
    return weights;
  };
  function chooseType(G, b, hour) {
    const weights = KE.typeWeights(G, b, hour);
    let r = KE.rand() * weights.reduce((a, x) => a + x[1], 0);
    for (const [t, w] of weights) { if ((r -= w) <= 0) return t; }
    return weights[0][0];
  }
  function chooseProduct(G, b, type, count) {
    const avail = availableProducts(G, b);
    if (!avail.length) return { p: null };
    const favs = (MODE(G).favorites[type] || []).map((id) => avail.find((p) => p.id === id)).filter(Boolean);
    let p = null;
    if (favs.length && KE.rand() < 0.72) {
      const w = favs.map((_, i) => 3 - i); let r = KE.rand() * w.reduce((a, x) => a + x, 0);
      for (let i = 0; i < favs.length; i++) { if ((r -= w[i]) <= 0) { p = favs[i]; break; } }
    }
    if (!p && G.signature && KE.rand() < 0.08 * G.signature.level) p = avail.find((x) => x.id === G.signature.pid) || null;
    if (!p) p = pick(avail);
    if (!KE.hasStock(b, p, count)) {
      const alt = avail.filter((x) => KE.hasStock(b, x, count));
      return { p: alt.length ? pick(alt) : null, stockMiss: p };
    }
    return { p };
  }
  /* chooseProduct'ın beklenen ürün olasılıkları (zar atmaz, stok yeterli varsayılır): favori %72, imza tarif, kalanı eşit.
     Sabah stok tahmini bunu okur; chooseProduct değişirse bu da birlikte güncellenmeli. */
  KE.productOdds = function (G, b, type) {
    const avail = availableProducts(G, b), out = {};
    if (!avail.length) return out;
    avail.forEach((p) => { out[p.id] = 0; });
    const favs = (MODE(G).favorites[type] || []).map((id) => avail.find((p) => p.id === id)).filter(Boolean);
    let rest = 1;
    if (favs.length) {
      const w = favs.map((_, i) => 3 - i), ws = w.reduce((a, x) => a + x, 0);
      favs.forEach((p, i) => { out[p.id] += 0.72 * w[i] / ws; });
      rest = 0.28;
    }
    const sig = G.signature && avail.find((x) => x.id === G.signature.pid);
    if (sig) { const q = Math.min(1, 0.08 * G.signature.level); out[sig.id] += rest * q; rest *= 1 - q; }
    avail.forEach((p) => { out[p.id] += rest / avail.length; });
    return out;
  };
  /* bir müşteri grubunun ortalama kişi sayısı (spawn: grup tipinde %55 ihtimalle [a,b] aralığında yuvarlanmış) */
  KE.groupMean = (type) => { const g = KE.CUSTOMER_TYPES[type].group; return g ? 0.45 + 0.55 * (g[0] + g[1]) / 2 : 1; };
  function lose(L, c, reason, text) {
    L.stats.lost += c.count; L.stats[reason] += c.count;
    if (c.regular && KE.G && KE.G.regulars) { const r = KE.G.regulars[c.regular]; r.loyalty = Math.max(0, r.loyalty - 2); (L.stats.regulars = L.stats.regulars || []).push({ id: c.regular, gain: -2 }); }
    if (text) L.fx.push({ t: 'bad', cid: c.id, text });
  }

  function spawn(G, b, L) {
    const hour = KE.OPEN_HOUR + Math.floor(L.minute / 60);
    const spH = L.special && L.special.hours[hour] ? L.special.hours[hour] : 1;
    const burst = (L.boost && L.minute < L.boost.until ? L.boost.mult : 1) * (L.rain && L.minute < L.rain.until ? L.rain.mult : 1);
    const res = KE.resOn(b);
    /* rezervasyonlu şube: kapıdan gelenin bir kısmı yer ayırtmadan gelmez (×0,97) */
    const rate = L.expected * (KE.HOUR_CURVE[hour] || 0.3) * spH * burst * (res ? 0.97 : 1) / L.curveSum / 60;
    (G.regularVisits || []).filter((v) => v.branchId === b.id && v.minute === L.minute).forEach((v) => spawnRegular(G, b, L, v.rid));
    L.spawnAcc += rate * rnd(0.6, 1.4);
    while (L.spawnAcc >= 1) {
      L.spawnAcc -= 1;
      const type = chooseType(G, b, hour);
      const ct = KE.CUSTOMER_TYPES[type];
      const count = ct.group && KE.rand() < 0.55 ? Math.round(rnd(ct.group[0], ct.group[1])) : 1;
      L.stats.arrivals += count;
      const id = L.nextId++;
      const c = { id, type, count, look: KE.customerLook(type), arrive: L.minute };
      if (L.queue.length >= KE.equip(G, b, 'service').queue + (b.flagship ? 4 : 0)) {
        /* rezervasyonda dolu saat önceden söylenir: kaçan müşteri sayılmaz, kibarca başka saate yönlendirilir */
        if (res) { L.stats.turned = (L.stats.turned || 0) + c.count; L.fx.push({ t: 'pass', cid: id }); continue; }
        lose(L, c, 'lostFull', 'Çok kalabalık!'); L.fx.push({ t: 'pass', cid: id }); continue;
      }
      const ch = chooseProduct(G, b, type, count);
      if (ch.stockMiss && L.stats.stockouts[ch.stockMiss.id] == null) L.stats.stockouts[ch.stockMiss.id] = L.minute;
      if (!ch.p) { lose(L, c, 'lostStock', 'Hepsi bitmiş!'); continue; }
      const p = ch.p;
      const price = b.prices[p.id];
      const ratio = price / KE.marketPrice(G, p);
      /* fiyat: piyasanın üstü, müşteri tipine göre kademeli kaçırır; itibar yüksekse tolerans artar */
      /* piyasanın 2,5 katından pahalıya hiç kimse almaz (sınırsız fiyat açığı kapalı) */
      const pLeave = ratio >= 2.5 ? 1 : Math.min(0.95, Math.max(0, (ratio - KE.priceTolerance(G, b)) * 3.5 * ct.priceSens));
      if (pLeave > 0 && KE.rand() < pLeave) { lose(L, c, 'lostPrice', 'Çok pahalı!'); L.fx.push({ t: 'pass', cid: id }); continue; }
      const take = (ct.takeaway || 0) * (G.mode === 'kebap' ? 0.4 : 1);
      Object.assign(c, {
        pid: p.id, price, ratio, state: 'queue', wait: 0, takeaway: KE.rand() < take,
        patience: ct.patience * KE.equip(G, b, 'service').patience * (G.mode === 'kebap' ? 1.5 : 1) * KE.modVal(G, 'patience') * (res ? 1.6 : 1),
        eat: (ct.eat || 15) * (G.mode === 'kebap' ? 1.6 : 1) * rnd(0.8, 1.2)
      });
      L.custs[id] = c; L.queue.push(id);
    }
  }
  function spawnRegular(G, b, L, rid) {
    const R = KE.REGULARS.find((x) => x.id === rid);
    const st = G.regulars[rid];
    const ct = KE.CUSTOMER_TYPES[R.type];
    const count = st.loyalty >= 5 ? 2 : 1;
    let p = KE.MODES[G.mode].products.find((x) => x.id === R.fav[G.mode]);
    if (!p || !KE.canMake(G, b, p) || !KE.hasStock(b, p, count)) { const ch = chooseProduct(G, b, R.type, count); p = ch.p; }
    if (!p) return;
    /* müdavim de fiyata bakar: piyasanın iki katından pahalıysa o gün gelmez, gönlü biraz kırılır */
    if (b.prices[p.id] / KE.marketPrice(G, p) > 2) { st.loyalty = Math.max(0, st.loyalty - 1); return; }
    const look = R.look || KE.CAST[R.cast].look;
    const id = L.nextId++;
    L.stats.arrivals += count;
    L.custs[id] = { id, type: R.type, count, look, arrive: L.minute, pid: p.id, price: b.prices[p.id], ratio: 1, state: 'queue', wait: 0, takeaway: false,
      patience: ct.patience * 1.4 * KE.equip(G, b, 'service').patience, eat: (ct.eat || 15) * (G.mode === 'kebap' ? 1.6 : 1), regular: rid };
    L.queue.push(id);
    L.fx.push({ t: 'regular', cid: id, text: R.name + ' geldi!' });
  }
  function spawnPaket(G, b, L) {
    const kuryes = KE.branchStaff(G, b).filter((s) => s.role === 'kurye').length;
    if (!kuryes || L.minute > KE.MINUTES - 30) return;
    const hour = KE.OPEN_HOUR + Math.floor(L.minute / 60);
    L.paketAcc += L.expected * 0.16 * (0.6 + G.reputation / 100) * (KE.HOUR_CURVE[hour] || 0.3) / L.curveSum / 60 * Math.min(1.6, 0.8 + kuryes * 0.4);
    while (L.paketAcc >= 1) {
      L.paketAcc -= 1;
      const avail = availableProducts(G, b).filter((p) => KE.hasStock(b, p, 1) && b.prices[p.id] / KE.marketPrice(G, p) <= 1.6);
      if (!avail.length) return;
      const p = pick(avail);
      L.tickets.push({ id: L.nextId++, cid: null, pid: p.id, count: 1, state: 'wait', paket: true, created: L.minute });
    }
  }

  /* Hız: çalışanın bir dakikada yaptığı iş */
  KE.staffRate = function (G, b, s) {
    const tr = /** @type {Partial<Trait>} */ (KE.TRAITS[s.trait] || {});
    const e = s.energy;
    const energyMul = e >= 45 ? 1 : 0.62 + e / 45 * 0.38;
    const mgr = KE.branchStaff(G, b).find((x) => x.role === 'mudur' && x.pos === 'yonetim');
    let r = s.speed * (1 + (tr.speed || 0)) * (0.82 + s.morale * 0.0036) * energyMul * (mgr ? 1.03 + mgr.skill * 0.06 : 1) * (b.cleanliness < 35 ? 0.93 : 1);
    if (KE.isCook(s)) r *= KE.equip(G, b, 'prep').speed;
    return r;
  };
  KE.cookingStaff = function (G, b) {
    const L = G.live && G.live[b.id];
    const down = L && L.stationDown && (L.stationDownUntil == null || L.minute < L.stationDownUntil) ? L.stationDown : 0;
    const stations = Math.max(1, KE.stations(G, b) - down);
    return KE.branchStaff(G, b).filter((s) => KE.isCook(s) && s.pos === 'ocak').slice(0, stations);
  };

  function cookQuality(G, b, s, pid) {
    const tier = KE.TIERS[b.tier], prep = KE.equip(G, b, 'prep');
    const tr = /** @type {Partial<Trait>} */ (KE.TRAITS[s.trait] || {});
    const star = Math.max(1, s.spec[pid] || 0);
    let q = star + tier.quality + (prep.quality || 0) + (tr.quality || 0) + (1 - s.consistency) * rnd(-2, 0.6) + (s.quality - 0.8);
    if (tr.grumpy && s.morale < 40) q -= 1.2;
    if (s.morale < 30) q -= 0.5;
    if (s.energy < 20) q -= 0.4;
    if (G.farm && G.farm.bonus && Object.keys(prodOf(G, pid).ing).some((k) => G.farm.bonus[k])) q += 0.25;
    return clamp(q, 0, 6);
  }

  function findTask(G, b, L, s, cooking) {
    const T = (type, ref, work) => ({ type, ref, remain: work, total: work });
    if (s.pos === 'ocak') {
      if (!cooking.includes(s)) return null;
      /* oyuncu tezgâhtaysa ve elinde boş yer varsa yeni fiş önce ona düşer */
      const pfree = L.player.active && !L.player.afk && (!(L.player.slots || []).length || L.minute - (L.player.tap || 0) <= 2) && (L.player.slots || []).length < KE.playerCap(G, b);
      const waiting = L.tickets.filter((t) => t.state === 'wait' && !(pfree && L.minute - t.created < 2));
      let best = null, score = -1e9;
      waiting.slice(0, 5).forEach((t, i) => {
        const p = prodOf(G, t.pid), star = s.spec[t.pid] || 0;
        if (p.requiresSpec && star < 1) return;
        const sc = star * 2 - i * 1.4 + (L.minute - t.created) / 4;
        if (sc > score) { score = sc; best = t; }
      });
      if (!best) return null;
      const p = prodOf(G, best.pid);
      if (!KE.hasStock(b, p, best.count)) {
        if (L.stats.stockouts[p.id] == null) L.stats.stockouts[p.id] = L.minute;
        cancelTicket(G, b, L, best, p.name + ' bitti!');
        return null;
      }
      Object.entries(p.ing).forEach(([k, q]) => { b.stock[k] -= q * best.count; });
      best.state = 'cook'; best.cook = s.id;
      return T('cook', best.id, p.prep * (1 + 0.45 * (best.count - 1)));
    }
    if (s.pos === 'kasa') {
      const free = L.tables.find((t) => !t.occ && !t.dirty);
      const id = L.queue.find((cid) => { const c = L.custs[cid]; return c && !c.ordering && (c.takeaway || free); });
      if (id == null) return null;
      const c = L.custs[id];
      c.ordering = s.id;
      if (!c.takeaway) { free.occ = c.id; c.table = free.id; }
      return T('order', id, 0.9 + 0.25 * (c.count - 1));
    }
    if (s.pos === 'servis' || s.pos === 'temizlik') {
      if (s.pos === 'servis') {
        const ready = L.tickets.filter((t) => t.state === 'ready' && !t.paket && !t.by).sort((a, c) => a.readyAt - c.readyAt)[0];
        if (ready) { ready.by = s.id; return T('deliver', ready.id, 1.4); }
      }
      const dirty = L.tables.find((t) => t.dirty && !t.by);
      if (dirty) { dirty.by = s.id; return T('clear', dirty.id, 1); }
      if (s.pos === 'temizlik') return T('clean', null, 6);
      return null;
    }
    if (s.pos === 'paket') {
      const ready = L.tickets.find((t) => t.state === 'ready' && t.paket && !t.by);
      if (ready) { ready.by = s.id; return T('paket', ready.id, 20); }
      return null;
    }
    return null;
  }

  function cancelTicket(G, b, L, t, text) {
    L.tickets.splice(L.tickets.indexOf(t), 1);
    if (t.cid != null) {
      const c = L.custs[t.cid];
      if (c) { refund(L, c); lose(L, c, 'lostStock', text); removeCust(L, c, false); }
    }
  }
  function refund(L, c) {
    if (c.paid) { L.stats.revenue -= c.paid; L.stats.card -= c.paid; const h = Math.min(13, Math.floor(c.orderedAt / 60)); L.stats.hourly[h] -= c.paid; c.paid = 0; }
  }
  function removeCust(L, c, dirty) {
    if (c.table != null) { const t = L.tables[c.table]; if (t) { t.occ = null; t.dirty = !!dirty; t.by = null; } }
    const qi = L.queue.indexOf(c.id); if (qi > -1) L.queue.splice(qi, 1);
    delete L.custs[c.id];
  }

  function finishTask(G, b, L, s, task) {
    const S = L.stats;
    s.tasksToday++;
    if (task.type === 'cook') {
      const t = L.tickets.find((x) => x.id === task.ref);
      if (!t) return;
      t.state = 'ready'; t.readyAt = L.minute; t.q = cookQuality(G, b, s, t.pid); t.cookName = s.name; t.cookId = s.id;
      const tr = /** @type {Partial<Trait>} */ (KE.TRAITS[s.trait] || {});
      const p = prodOf(G, t.pid);
      KE.gainXp(s, t.pid, t.count * (1 + (tr.xp || 0)) * (p.requiresSpec && !s.spec[t.pid] ? 0 : 1));
      s.servedToday += t.count; s.servedTotal += t.count;
      L.fx.push({ t: 'ready', sid: s.id, pid: t.pid });
    } else if (task.type === 'order') {
      const c = L.custs[task.ref];
      if (!c) return;
      const qi = L.queue.indexOf(c.id); if (qi > -1) L.queue.splice(qi, 1);
      const p = prodOf(G, c.pid);
      if (!KE.hasStock(b, p, c.count)) {
        const alt = availableProducts(G, b).filter((x) => KE.hasStock(b, x, c.count));
        if (L.stats.stockouts[p.id] == null) L.stats.stockouts[p.id] = L.minute;
        if (!alt.length) { lose(L, c, 'lostStock', p.name + ' kalmamış!'); removeCust(L, c, false); return; }
        c.pid = pick(alt).id; c.price = b.prices[c.pid]; c.ratio = c.price / KE.marketPrice(G, prodOf(G, c.pid));
      }
      const drinks = KE.rand() < MODE(G).drinkRate ? c.count : 0;
      if (drinks) Object.entries(MODE(G).drink.ing).forEach(([k, q]) => { b.stock[k] = Math.max(0, (b.stock[k] || 0) - q * drinks); });
      const pay = (c.price * c.count + drinks * b.prices[MODE(G).drink.id]) * KE.modVal(G, 'spend') * (KE.resOn(b) ? 1.05 : 1);
      c.paid = pay; c.orderedAt = L.minute; c.orderBy = s.id; c.state = c.takeaway ? 'pickup' : 'seat'; c.wait = 0;
      S.revenue += pay;
      if (KE.rand() < 0.66) S.card += pay; else S.cash += pay;
      const h = Math.min(13, Math.floor(L.minute / 60));
      S.hourly[h] += pay; S.hourlyCust[h] += c.count;
      L.tickets.push({ id: L.nextId++, cid: c.id, pid: c.pid, count: c.count, state: 'wait', created: L.minute });
      s.servedToday += c.count * 0.5;
      L.fx.push({ t: 'pay', cid: c.id, text: '+' + KE.tl(pay) });
    } else if (task.type === 'deliver') {
      const t = L.tickets.find((x) => x.id === task.ref);
      if (!t) return;
      L.tickets.splice(L.tickets.indexOf(t), 1);
      const c = L.custs[t.cid];
      if (!c) return;
      serveCustomer(G, b, L, c, t, s);
      s.servedToday += c.count;
    } else if (task.type === 'clear') {
      const t = L.tables[task.ref];
      if (t) { t.dirty = false; t.by = null; }
      b.cleanliness = clamp(b.cleanliness + 0.15, 0, 100);
    } else if (task.type === 'clean') {
      b.cleanliness = clamp(b.cleanliness + 1.2, 0, 100);
    } else if (task.type === 'paket') {
      const t = L.tickets.find((x) => x.id === task.ref);
      if (!t) return;
      L.tickets.splice(L.tickets.indexOf(t), 1);
      const pay = b.prices[t.pid];
      S.revenue += pay; S.card += pay; S.paket += 1; S.paketRev += pay;
      S.byProduct[t.pid] = (S.byProduct[t.pid] || 0) + 1;
      const h = Math.min(13, Math.floor(L.minute / 60)); S.hourly[h] += pay;
      S.repDelta += ((t.q || 3) - 3) * 0.02;
      s.servedToday += 1;
    }
  }

  /* Müşteriye yemeği ver: memnuniyet ve itibar */
  function serveCustomer(G, b, L, c, t, server) {
    const mode = MODE(G);
    const ct = KE.CUSTOMER_TYPES[c.type];
    const S = L.stats;
    const coolWait = L.minute - t.readyAt;
    let q = (t.q == null ? 3 : t.q) - Math.max(0, coolWait - 3) * 0.22;
    if (coolWait > 3) S.cold += 1;
    const st = KE.branchStaff(G, b);
    const amb = KE.ambience(G, b);
    const orderer = st.find((x) => x.id === c.orderBy);
    const friendly = ((orderer ? orderer.friendly * (0.7 + orderer.morale / 200) : 0.4) + server.friendly * (0.7 + server.morale / 200)) / 2;
    const total = L.minute - c.arrive;
    const speedScore = 16 * clamp(1 - total / (c.patience * 2.2), -0.6, 1);
    /* müşterinin katlandığı prim (itibar, imza, amiral) memnuniyeti düşürmez */
    const er = c.ratio - (KE.priceTolerance(G, b) - 1.02);
    const pricePen = er > 1 ? (er - 1) * 70 * ct.priceSens : -(1 - er) * 25 * ct.priceSens;
    const star = t.cookId === 'player' ? 4 : ((st.find((x) => x.id === t.cookId) || { spec: {} }).spec[c.pid] || 1);
    const match = (mode.favorites[c.type] || []).includes(c.pid) && star >= 4 && q >= 4;
    let sat = 35 + q * 8.5 + speedScore + Math.min(10, amb.score / 5) + (amb.concept ? 4 * amb.concept.power : 0) + friendly * 7 + (b.cleanliness - 50) / 10 - pricePen + (match ? 8 : 0);
    sat = clamp(sat, 0, 100);
    c.sat = sat; c.match = match; c.server = server.id; c.cookId = t.cookId; c.served = L.minute;
    S.served += c.count; S.satSum += sat * c.count; S.satN += c.count;
    S.byProduct[c.pid] = (S.byProduct[c.pid] || 0) + c.count;
    S.byType[c.type] = (S.byType[c.type] || 0) + c.count;
    S.repDelta += (sat - 67) / 2600 * c.count * (c.type === 'gurme' ? 3 : 1);
    if (match) S.matches += c.count;
    if (c.type === 'gurme' && sat > 85) S.gurmeHappy++;
    if (t.cookId === 'player') S.playerServed += c.count;
    L.fx.push({ t: 'served', cid: c.id, sat, match, text: match ? 'Ellerine sağlık!' : sat > 84 ? 'Harika!' : sat > 62 ? 'Güzel' : sat > 45 ? 'İdare eder' : 'Bir daha gelmem' });
    if (c.regular) {
      const R = KE.REGULARS.find((x) => x.id === c.regular), r = G.regulars[c.regular];
      const gain = sat > 84 ? 2 : sat > 66 ? 1 : sat < 52 ? -2 : 0;
      const before = r.loyalty;
      r.loyalty = clamp(r.loyalty + gain, 0, 10); r.visits++;
      if (before < 8 && r.loyalty >= 8) { G.reputation = clamp(G.reputation + 1.5, 0, 100); r.praised = G.day; }
      (S.regulars = S.regulars || []).push({ id: c.regular, gain });
      L.fx.push({ t: 'regular', cid: c.id, text: gain >= 0 ? R.says[Math.floor(KE.rand() * R.says.length)] : 'Bu sefer olmadı evladım…' });
    }
    if (c.takeaway) { leave(G, b, L, c); }
    else { c.state = 'eat'; c.eatLeft = c.eat; }
  }
  function leave(G, b, L, c) {
    const ct = KE.CUSTOMER_TYPES[c.type];
    const st = KE.branchStaff(G, b);
    const server = st.find((x) => x.id === c.server);
    const cook = st.find((x) => x.id === c.cookId);
    const sat = c.sat || 0;
    const satMul = sat < 50 ? 0 : sat < 68 ? 0.45 : sat < 84 ? 1 : 1.7;
    let mul = satMul * (c.match ? 1.4 : 1);
    if (server) { const tr = /** @type {Partial<Trait>} */ (KE.TRAITS[server.trait] || {}); mul *= (1 + (tr.tip || 0)) * (0.7 + server.friendly * 0.6) * (0.8 + server.morale / 250); }
    if (cook) { const tr = /** @type {Partial<Trait>} */ (KE.TRAITS[cook.trait] || {}); mul *= 1 + (tr.tip || 0) * 0.5; if (cook.costume === 'yoresel' && c.match) mul *= 1.12; }
    if (c.cookId === 'player') mul *= 1.25;
    if (L.special && L.special.tip) mul *= L.special.tip;
    if (c.regular) mul *= 1.3;
    const tip = Math.round((c.paid || 0) * ct.tip * mul / 5) * 5;
    L.stats.tips += tip;
    if (!L.stats.best || tip > L.stats.best.tip) L.stats.best = { tip, type: c.type, pid: c.pid };
    if (tip > 0) L.fx.push({ t: 'tip', cid: c.id, text: 'Bahşiş ' + KE.tl(tip) });
    b.cleanliness = clamp(b.cleanliness - 0.25 * c.count, 0, 100);
    removeCust(L, c, !c.takeaway);
  }

  /* Pozisyon değiştir: elindeki iş bırakılır */
  KE.setPos = function (G, s, pos) {
    if (!KE.POSITIONS[s.role].includes(pos)) return;
    const L = G.live && G.live[s.branchId];
    if (L && s.task) releaseTask(L, s);
    s.pos = pos;
  };
  function releaseTask(L, s) {
    const t = s.task;
    s.task = null;
    if (!t) return;
    if (t.type === 'cook') { const k = L.tickets.find((x) => x.id === t.ref); if (k) { k.state = 'wait'; k.cook = null; } }
    if (t.type === 'deliver' || t.type === 'paket') { const k = L.tickets.find((x) => x.id === t.ref); if (k) k.by = null; }
    if (t.type === 'clear') { const k = L.tables[t.ref]; if (k) k.by = null; }
    if (t.type === 'order') { const c = L.custs[t.ref]; if (c) { c.ordering = null; if (c.table != null) { L.tables[c.table].occ = null; c.table = null; } } }
  }

  /* Otomatik ekip yönetimi: müdür varsa sık ve akıllı, yoksa yalnızca yorgunluğa bakar */
  function autoStaff(G, b, L) {
    const st = KE.branchStaff(G, b);
    const mgr = st.find((s) => s.role === 'mudur');
    const every = mgr ? 8 : 30;
    if (L.minute % every !== 0) return;
    const hour = KE.OPEN_HOUR + Math.floor(L.minute / 60);
    const peak = (KE.HOUR_CURVE[hour] || 0) >= 1;
    const cooks = st.filter(KE.isCook);
    const pending = L.tickets.filter((t) => t.state === 'wait').length;
    /* aynı işi yapan başka biri çalışıyorsa molaya gönder (müdürsüz şubede de bir görev hiç boş kalmaz) */
    const sameJob = (s, x) => (KE.isCook(s) ? KE.isCook(x) : x.role === s.role);
    st.forEach((s) => { if (s.energy < (mgr ? 22 : 12) && s.pos !== 'mola') { const same = st.filter((x) => sameJob(s, x) && x !== s && x.pos !== 'mola'); if (same.length || (mgr && !peak)) KE.setPos(G, s, 'mola'); } });
    st.forEach((s) => { if (s.pos === 'mola' && !s.home && s.energy >= (mgr ? 85 : 80)) KE.setPos(G, s, KE.POSITIONS[s.role][0]); });
    /* müdür olmasa da: kasada iki kişi varken servis boş kalmaz, kasa boşken servisteki biri kasaya geçer */
    const fr = st.filter((s) => (s.role === 'kasiyer' || s.role === 'garson') && s.pos !== 'mola' && !s.home);
    const ks = fr.filter((s) => s.pos === 'kasa'), sv = fr.filter((s) => s.pos === 'servis');
    if (!ks.length && sv.length > 0 && fr.length) { const x = sv.find((s) => s.role === 'kasiyer') || sv.find((s) => !s.task) || sv[0]; KE.setPos(G, x, 'kasa'); }
    else if (!sv.length && ks.length > 1) { const x = ks.find((s) => s.role === 'garson' && !s.task) || ks.find((s) => s.role === 'garson') || ks[ks.length - 1]; if (KE.POSITIONS[x.role].includes('servis')) { KE.setPos(G, x, 'servis'); } }
    if (!mgr) return;
    const stations = KE.stations(G, b);
    const working = cooks.filter((s) => s.pos === 'ocak');
    if (pending >= 2 || peak) cooks.filter((s) => s.pos === 'mola' && !s.home && s.energy > 40).slice(0, Math.max(0, stations - working.length)).forEach((s) => KE.setPos(G, s, 'ocak'));
    else if (working.length > 1 && pending === 0) { const tired = working.filter((s) => !s.task).sort((a, c) => a.energy - c.energy)[0]; if (tired && tired.energy < 70) KE.setPos(G, tired, 'mola'); }
    const front = st.filter((s) => ['kasiyer', 'garson', 'mudur'].includes(s.role) && s.pos !== 'mola' && s.role !== 'mudur');
    const queue = L.queue.length, ready = L.tickets.filter((t) => t.state === 'ready' && !t.paket).length, dirty = L.tables.filter((t) => t.dirty).length;
    const kasa = front.filter((s) => s.pos === 'kasa'), servis = front.filter((s) => s.pos === 'servis');
    if (!kasa.length && front.length) KE.setPos(G, front.find((s) => s.role === 'kasiyer') || front[0], 'kasa');
    else if (!servis.length && front.length > 1) KE.setPos(G, front.find((s) => s.pos === 'kasa' && s.role === 'garson') || kasa[kasa.length - 1], 'servis');
    else if (ready + dirty > 3 && kasa.length > 1) KE.setPos(G, kasa.find((s) => !s.task) || kasa[0], 'servis');
    else if (queue > 4 && servis.length > 1 && ready + dirty < 2) KE.setPos(G, servis.find((s) => !s.task) || servis[0], 'kasa');
  }

  /* Bir dakikalık adım */
  KE.tick = function (G, b, L) {
    if (L.done) return;
    const closing = L.minute >= KE.MINUTES - 20;
    if (!closing) { spawn(G, b, L); spawnPaket(G, b, L); }
    if (b.autoStaff) autoStaff(G, b, L);
    if (L.player.active && b.id === G.activeBranch) while (KE.playerTake(G));
    const st = KE.branchStaff(G, b);
    const cooking = KE.cookingStaff(G, b);
    st.forEach((s) => {
      if (s.pos === 'mola') { s.energy = Math.min(100, s.energy + 0.75); return; }
      if (s.task) {
        s.task.remain -= KE.staffRate(G, b, s);
        if (s.task.remain <= 0) { const t = s.task; s.task = null; finishTask(G, b, L, s, t); }
      }
      if (!s.task) s.task = findTask(G, b, L, s, cooking);
      const drain = s.task ? (KE.isCook(s) ? 0.115 : s.task.type === 'paket' ? 0.08 : 0.1) : 0.025;
      s.energy = Math.max(0, s.energy - drain * (G.mode === 'kebap' && KE.isCook(s) ? 1.15 : 1));
      s.minEnergy = Math.min(s.minEnergy, s.energy);
    });
    Object.values(L.custs).forEach((c) => {
      if (c.state === 'queue') {
        c.wait++;
        if (!c.ordering && c.wait > c.patience) { lose(L, c, 'lostWait', 'Bekletmeyin bizi!'); L.stats.repDelta -= 0.015 * c.count; removeCust(L, c, false); }
      } else if (c.state === 'seat' || c.state === 'pickup') {
        c.wait++;
        if (c.wait > c.patience * 1.9) {
          const t = L.tickets.find((x) => x.cid === c.id);
          if (t && t.state === 'cook' && !(t.cook === 'player' && c.wait > c.patience * 2.6)) return;
          if (t) L.tickets.splice(L.tickets.indexOf(t), 1);
          st.forEach((s) => { if (s.task && s.task.type === 'deliver' && t && s.task.ref === t.id) s.task = null; });
          refund(L, c); lose(L, c, 'lostFood', 'Yemek gelmedi!'); L.stats.repDelta -= 0.08 * c.count; removeCust(L, c, false);
        }
      } else if (c.state === 'eat') {
        c.eatLeft -= 1;
        if (c.eatLeft <= 0) leave(G, b, L, c);
      }
    });
    KE.playerTick(G, b, L);
    L.minute += 1;
    const busy = L.queue.length || Object.values(L.custs).some((c) => c.state !== 'eat') || L.tickets.some((t) => !t.paket || t.by);
    if (L.minute >= KE.MINUTES && !busy) {
      Object.values(L.custs).forEach((c) => leave(G, b, L, c));
      L.tickets = []; L.done = true;
    } else if (L.minute >= KE.MINUTES + 60) {
      Object.values(L.custs).forEach((c) => { if (c.state === 'eat') leave(G, b, L, c); else { refund(L, c); lose(L, c, 'lostWait', null); removeCust(L, c, false); } });
      L.tickets = []; L.done = true;
    }
    if (L.done) st.forEach((s) => { s.task = null; });
  };
  KE.tickAll = function (G) {
    const M = G.mid;
    if (M && M.choice == null) {
      const L = G.live[M.bid];
      if (L && L.minute >= M.minute + KE.MID_WAIT) {
        /* süre doldu: müdürü olan şubede kararı müdür verir (en iyi seçenek), yoksa güvenli seçenek */
        const D = KE.MIDS.find((x) => x.id === M.id), b = G.branches.find((x) => x.id === M.bid);
        const mgr = b && KE.branchStaff(G, b).some((s) => s.role === 'mudur');
        KE.resolveMid(G, mgr ? D.mgr : D.def); if (mgr) M.byMgr = true;
      }
    }
    G.branches.forEach((b) => { const L = G.live[b.id]; if (L) KE.tick(G, b, L); });
  };
  KE.allDone = (G) => G.branches.every((b) => !G.live[b.id] || G.live[b.id].done);
})();
