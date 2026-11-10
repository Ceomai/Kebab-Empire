/* Kebab Empire — simülasyon motoru (3/8): şube ve yeni oyun
   Şube kurulumu, ekipman/masa/ocak, ortam (dekor konsepti), menü, fiyat toleransı ve beklenen müşteri. */
(function () {
  const MODE = KE.U.mode;
  /* ---------- Şube ---------- */
  KE.makeBranch = function (G, districtId) {
    const d = KE.DISTRICTS.find((x) => x.id === districtId);
    const mode = MODE(G);
    const b = {
      id: 'b' + (G.nextId++), district: districtId, name: KE.BRAND ? KE.BRAND.branchName(d.name, d.name + ' ' + (G.mode === 'doner' ? 'Dönercisi' : 'Ocakbaşı')) : d.name + ' ' + (G.mode === 'doner' ? 'Dönercisi' : 'Ocakbaşı'),
      tier: 1, equipment: { cook: 0, prep: 0, cold: 0, service: 0 }, decor: [], prices: {}, menu: {}, stock: {}, usage: {},
      stockLevel: 1.15, cleanliness: 72, rent: Math.round(d.rent * G.priceIndex), openedDay: G.day, history: [], autoStaff: true
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
  KE.tableCount = (G, b) => KE.equip(G, b, 'service').tables + (b.decor.includes('dismasa') ? 2 : 0) + (b.flagship ? 4 : 0);
  /* ocak yeri: ekipman + amiral dükkânın fazladan ocağı */
  KE.stations = (G, b) => KE.equip(G, b, 'cook').stations + (b.flagship ? 1 : 0);

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

  KE.isLocked = (G, p) => !!(p.unlock && !(G.flags && G.flags['tarif_' + p.id]));
  KE.canMake = function (G, b, p) {
    if (!b.menu[p.id] || KE.isLocked(G, p)) return false;
    if (p.requiresSpec && !KE.branchStaff(G, b).some((s) => KE.isCook(s) && (s.spec[p.id] || 0) >= 1)) return false;
    return true;
  };
  KE.hasStock = (b, p, count) => Object.entries(p.ing).every(([k, q]) => (b.stock[k] || 0) >= q * count - 1e-9);
  KE.bestStar = function (G, b, pid) {
    let best = 0;
    KE.branchStaff(G, b).forEach((s) => { if (KE.isCook(s)) best = Math.max(best, s.spec[pid] || 0); });
    return best;
  };

  /* Menünün piyasaya göre ortalama fiyat oranı (1 = piyasa) ve itibara bağlı fiyat toleransı */
  KE.priceRatio = function (G, b) {
    const ps = MODE(G).products.filter((p) => b.menu[p.id] && !KE.isLocked(G, p) && b.prices[p.id] != null);
    return ps.length ? ps.reduce((a, p) => a + b.prices[p.id] / KE.marketPrice(G, p), 0) / ps.length : 1;
  };
  KE.charityLv = (G, id) => (G.charity && G.charity[id]) || 0;
  KE.priceTolerance = (G, b) => 1.02 + (G.stars || 0) * 0.03 + KE.charityLv(G, 'okul') * 0.01 + Math.max(0, G.reputation - 50) / 400 + (G.signature && !G.signature.family ? G.signature.level * 0.04 : 0) + (b && b.flagship ? 0.1 : 0);
  KE.expectedCustomers = function (G, b) {
    const d = KE.district(b);
    const mode = MODE(G);
    const repF = 0.45 + G.reputation / 100 * 0.9;
    const amb = KE.ambience(G, b);
    const ambF = 1 + Math.min(0.35, amb.score / 120) + (amb.concept ? 0.08 * amb.concept.power : 0);
    const wk = KE.isWeekend(G.day) ? 1.18 : 1;
    const hol = KE.holidayOf(G.day) ? 1.25 : 1;
    const emp = G.flags && G.flags.empire;
    const rival = 1 - Math.min(0.25, Math.max(0, d.rivals - (emp ? 1 : 0)) * 0.03 + (!emp && G.rival.district === d.id ? G.rival.power / 400 : 0));
    const ad = KE.modVal(G, 'traffic') * KE.modVal(G, 'traffic:' + b.id) * (b.signBoost || 1);
    const sp = KE.specialDay(G.day);
    const mac = sp && sp.id === 'mac' && b.district === 'besiktepe' ? 1.3 : 1;
    const loyal = 1 + 0.025 * Object.values(G.regulars || {}).filter((r) => r.loyalty >= 8).length;
    const champ = b.championUntil && G.day <= b.championUntil ? 1.06 : 1;
    const sig = 1 + (G.signature ? G.signature.level * KE.SIGNATURE.traffic : 0);
    /* ucuz fiyat kapıdan daha çok müşteri getirir, pahalı fiyat biraz azaltır (±%12) */
    const pr = 1 + Math.max(-0.12, Math.min(0.12, (1 - KE.priceRatio(G, b)) * 0.6));
    const flag = b.flagship ? KE.FLAGSHIP.traffic : G.branches.some((x) => x.flagship) ? KE.FLAGSHIP.chain : 1;
    return (1 + (G.stars || 0) * 0.03) * (1 + KE.charityLv(G, 'takim') * 0.02) * d.traffic * mode.trafficMul * repF * ambF * wk * rival * ad * mac * loyal * champ * sig * flag * pr * (emp ? 1.1 : 1) * (sp && sp.id === 'bayram' ? 1.15 : 1) * (hol && !sp ? 1.25 : 1);
  };

  /* ---------- Yeni oyun ---------- */
  KE.newGame = function (opts) {
    KE.CAL.applyYear(KE.dateOf(1).getUTCFullYear());
    const seed0 = opts.seed || (Math.floor(Math.random() * 2147483646) + 1);
    KE.RNG.raw(seed0);
    const G = {
      v: 3, seed: seed0, actionLog: [], saveId: 'g' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36), mode: opts.mode, owner: opts.owner || 'Patron', shopName: opts.shopName, day: 1, cash: KE.FRESH.cash, reputation: KE.FRESH.reputation,
      priceIndex: 1, nextId: 1, staff: [], branches: [], activeBranch: null, loans: [], mods: [], tipRule: 'esit',
      ledger: { days: [], months: [] }, monthExtras: { ads: 0, capex: 0, fines: 0, other: 0, farm: 0 }, journal: [], news: [], goals: {},
      phase: 'morning', rival: { power: 20, district: null }, market: [], workers: [], flags: {}, centralKitchen: false,
      eventLog: [], pendingEvent: null, payLate: false, lastSummary: null, speed: 1, farm: null, tut: opts.tut ? 0 : 99,
      era: 1, eraLog: { 1: 1 }, gen: 1, weekly: null, stories: {}
    };
    const lg = opts.legacy;
    if (lg) {
      G.gen = lg.gen; G.legacy = { gen: lg.gen, from: lg.from, owner: lg.owner };
      G.rival.power += 15 * (lg.gen - 1);
      if (lg.sigPid) G.signature = { pid: lg.sigPid, level: 1, family: true };
    }
    KE.G = G;
    G.regulars = {};
    KE.REGULARS.forEach((r) => { G.regulars[r.id] = { loyalty: 0, visits: 0 }; });
    const b = KE.makeBranch(G, opts.district);
    b.name = opts.shopName || b.name;
    G.branches.push(b); G.activeBranch = b.id;
    const t = opts.master;
    const m0 = KE.makeStaff(G, Object.assign({}, t, { role: t.role || 'usta', branchId: b.id }));
    if (lg && lg.spec) { m0.spec = Object.assign({}, lg.spec); m0.wage = KE.wageFor(m0.spec, 'usta'); m0.heir = true; }
    G.staff.push(m0);
    const cirak = KE.MASTER_TEMPLATES[G.mode].find((x) => x.role === 'cirak');
    G.staff.push(KE.makeStaff(G, Object.assign({}, cirak, { branchId: b.id, morale: 70 })));
    const ks = KE.randomWorker(G, 'kasiyer'); ks.branchId = b.id; G.staff.push(ks);
    const gs = KE.randomWorker(G, 'garson'); gs.branchId = b.id; G.staff.push(gs);
    KE.refreshMarket(G); KE.refreshWorkers(G);
    KE.morning(G);
    return G;
  };
})();
