/* Kebab Empire — simülasyon motoru
   Bütün şubeler aynı anda, dakika dakika çalışır.
   Akış: müşteri gelir → kasada sipariş verir (kasiyer/garson) → usta pişirir → komi/garson masaya götürür
   → müşteri yer, bahşiş bırakır ve çıkar → masa toplanır. Ustalar yalnızca pişirir. */
(function () {
  /* ---------- Tohumlu rastgelelik ----------
     Oyun sonucunu etkileyen her rastgele karar KE.rand() ile verilir. Akış her gün ve evre için
     oyunun tohumundan yeniden kurulur; aynı tohum + aynı oyuncu hamleleri = birebir aynı gün. */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  KE.mix = mix;
  function mix(...xs) { let h = 2166136261; xs.forEach((x) => { String(x).split('').forEach((c) => { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }); h ^= 0x9e37; }); return h >>> 0; }
  let stream = mulberry32(1);
  KE.RNG = { seed: (G, tag) => { stream = mulberry32(mix(G.seed || 1, G.day, tag)); }, raw: (n) => { stream = mulberry32(n); } };
  KE.rand = () => stream();
  const rnd = (a, b) => a + KE.rand() * (b - a);
  const pick = (a) => a[Math.floor(KE.rand() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const MODE = (G) => KE.MODES[G.mode];
  KE.STAR_NEED = [0, 40, 120, 300, 650, 1300];
  KE.MINUTES = (KE.CLOSE_HOUR - KE.OPEN_HOUR) * 60;
  KE.MINUTE_MS = 400; // 1× hızda bir oyun dakikası

  /* ---------- Görevler ve pozisyonlar ---------- */
  KE.POSITIONS = {
    usta: ['ocak', 'mola'], cirak: ['ocak', 'mola'],
    kasiyer: ['kasa', 'servis', 'mola'], garson: ['servis', 'kasa', 'mola'],
    temizlik: ['temizlik', 'servis', 'mola'], kurye: ['paket', 'mola'],
    mudur: ['yonetim', 'kasa', 'servis', 'mola']
  };
  KE.POS_NAMES = { ocak: 'Ocakbaşı', kasa: 'Kasa', servis: 'Servis', temizlik: 'Temizlik', paket: 'Paket', yonetim: 'Yönetim', mola: 'Mola' };
  KE.TASK_NAMES = { cook: 'Pişiriyor', order: 'Sipariş alıyor', deliver: 'Servis ediyor', clear: 'Masa topluyor', clean: 'Temizlik', paket: 'Paket yolda' };

  /* ---------- Personel üretimi ---------- */
  KE.wageFor = (spec, role) => {
    if (role === 'cirak') return KE.ECON.asgariBrut;
    const stars = Object.values(spec);
    const max = Math.max(1, ...stars);
    return Math.round((40000 + 9500 * (max - 1) + 3500 * (stars.length - 1)) / 500) * 500;
  };
  KE.makeStaff = function (G, o) {
    const id = 's' + (G.nextId++);
    const gender = o.gender || (KE.rand() < 0.8 ? 'e' : 'k');
    const age = o.age || pick(['genc', 'orta', 'orta', 'yasli']);
    const s = {
      id, name: o.name, role: o.role, region: o.region || pick(Object.keys(KE.REGIONS)), gender, age,
      spec: Object.assign({}, o.spec || {}), xp: {}, speed: o.speed || 1, quality: o.quality || 0.8, consistency: o.consistency || 0.8,
      waste: o.waste || 0.6, teach: o.teach || 0.5, friendly: o.friendly || rnd(0.4, 0.9), skill: o.skill || rnd(0.4, 0.9),
      trait: o.trait || null, wage: o.wage || KE.wageFor(o.spec || {}, o.role), morale: o.morale || 66, costume: 'temel',
      branchId: o.branchId, look: o.look || KE.randomLook(gender, age), cumBase: 0, tipsMonth: 0, tipsTotal: 0, hiredDay: G.day,
      mentorId: null, servedToday: 0, servedTotal: 0, energy: 100, pos: null, task: null
    };
    if (s.look.gender !== gender) s.look = KE.randomLook(gender, age);
    s.pos = KE.POSITIONS[s.role][0];
    return s;
  };
  KE.isCook = (s) => s.role === 'usta' || s.role === 'cirak';

  /* ---------- Kadro sınırı: dükkân büyüdükçe artar ----------
     Mutfak (usta + çırak): ocak yeri + 1 · Salon (kasiyer + garson/komi): masa sayısının yarısı
     Destek (kurye + temizlik): salon seviyesi + 1 · Müdür: 1. Sınırı ocak ve salon yükseltmeleri açar. */
  KE.STAFF_GROUPS = {
    mutfak: { name: 'Mutfak', roles: ['usta', 'cirak'], up: 'cook' },
    salon: { name: 'Salon', roles: ['kasiyer', 'garson'], up: 'service' },
    destek: { name: 'Paket ve temizlik', roles: ['kurye', 'temizlik'], up: 'service' },
    yonetim: { name: 'Yönetim', roles: ['mudur'], up: null }
  };
  KE.staffGroup = (role) => Object.keys(KE.STAFF_GROUPS).find((g) => KE.STAFF_GROUPS[g].roles.includes(role));
  KE.staffCapsAt = (G, b, eq) => {
    const M = KE.MODES[G.mode].equipment;
    const st = M.cook.levels[eq.cook].stations, tables = M.service.levels[eq.service].tables;
    const fl = b && b.flagship ? 1 : 0;
    return { mutfak: st + 1 + fl, salon: Math.ceil((tables + 4 * fl) / 2), destek: eq.service + 1, yonetim: 1 };
  };
  KE.staffCaps = (G, b) => KE.staffCapsAt(G, b, b.equipment);
  /** Bu şubede bu rolden biri daha çalışabilir mi? { ok, group, used, cap, hint } */
  KE.canHire = function (G, b, role, exceptId) {
    const group = KE.staffGroup(role);
    const cap = KE.staffCaps(G, b)[group];
    const used = KE.branchStaff(G, b).filter((s) => s.id !== exceptId && KE.staffGroup(s.role) === group).length;
    const g = KE.STAFF_GROUPS[group];
    let hint = '';
    if (used >= cap && g.up) {
      const eq = KE.MODES[G.mode].equipment[g.up];
      const next = eq.levels[b.equipment[g.up] + 1];
      hint = next ? (g.up === 'cook' ? 'Yer açmak için Mobilya ve Dekor\'dan ocağı büyüt ya da kadrodan birini çıkar.' : 'Yer açmak için Mobilya ve Dekor\'dan salonu büyüt ya da kadrodan birini çıkar.') : 'Bu şube en büyük hâlinde: kadrodan birini çıkar ya da başka şubeye ata.';
    } else if (used >= cap) hint = 'Her şubede bir müdür olabilir. Yenisini almak için mevcut müdürü çıkar.';
    return { ok: used < cap, group, used, cap, hint };
  };
  KE.roleName = (G, s) => s.role === 'usta' ? KE.MODES[G.mode].cookRole : s.role === 'garson' ? (G.mode === 'doner' ? 'Komi' : 'Garson') : KE.ROLES[s.role].name;

  KE.randomMaster = function (G) {
    const mode = MODE(G);
    const prods = mode.products.map((p) => p.id);
    const n = pick([1, 1, 2, 2, 2, 3]);
    const spec = {};
    const lvl = KE.rand();
    for (let i = 0; i < n; i++) {
      const p = pick(prods);
      spec[p] = clamp(Math.round(rnd(1.6, lvl < 0.15 ? 5.4 : lvl < 0.5 ? 4.4 : 3.6)), 1, 5);
    }
    const gender = KE.rand() < 0.78 ? 'e' : 'k';
    const max = Math.max(...Object.values(spec));
    const role = max <= 2 && KE.rand() < 0.6 ? 'cirak' : 'usta';
    const taken = new Set(G.staff.map((x) => x.name.replace(/^Çırak /, '').replace(/ Usta$/, '')).concat((G.market || []).map((x) => x.name.replace(/^Çırak /, '').replace(/ Usta$/, ''))));
    let first = pick(KE.NAMES[gender]);
    for (let i = 0; i < 12 && taken.has(first); i++) first = pick(KE.NAMES[gender]);
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
    const gender = KE.rand() < 0.6 ? 'e' : 'k';
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
      v: 3, seed: seed0, actionLog: [], saveId: 'g' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36), mode: opts.mode, owner: opts.owner || 'Patron', shopName: opts.shopName, day: 1, cash: 450000, reputation: 30,
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

  KE.refreshMarket = function (G) {
    const used = new Set(G.staff.map((s) => s.name));
    const tmpl = KE.MASTER_TEMPLATES[G.mode].filter((t) => !used.has(t.name) && t.role !== 'cirak');
    G.market = [];
    if (tmpl.length && KE.rand() < 0.7) {
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
    ['kasiyer', 'garson', 'garson', 'kurye', 'temizlik', 'mudur', 'kasiyer', 'kurye'].forEach((r) => G.workers.push(KE.randomWorker(G, r)));
  };

  /* ---------- Sabah: çiftlikten sevkiyat ve stok tamamlama ---------- */
  /* Müdürlü şube kendi sabah ayarını yapar: stok seviyesi dünkü bitenlere ve fireye, fiyatlar haftada bir piyasaya göre */
  KE.isManaged = (G, b) => b.managed !== false && KE.branchStaff(G, b).some((s) => s.role === 'mudur');
  function manage(G, b) {
    const sum = G.lastSummary && G.lastSummary.day === G.day - 1 && G.lastSummary.branches[b.id];
    const notes = [];
    if (sum) {
      const so = Object.keys(sum.stats.stockouts || {}).length;
      if (so && b.stockLevel < 1.5) { b.stockLevel = Math.min(1.5, Math.round((b.stockLevel + 0.1) * 100) / 100); notes.push('stok'); }
      else if (!so && sum.wasteVal > sum.stats.revenue * 0.04 && b.stockLevel > 1.15) { b.stockLevel = Math.max(1.15, Math.round((b.stockLevel - 0.05) * 100) / 100); notes.push('fire'); }
    }
    if (G.day % 7 === 1) {
      let moved = false;
      /* hedef: piyasa × müşterinin katlanacağı prim (itibar, imza tarif, amiral dükkân) */
      const prem = Math.max(1, Math.min(1.15, KE.priceTolerance(G, b) - 0.02));
      MODE(G).products.forEach((p) => { if (b.prices[p.id] == null) return; const np = Math.round((b.prices[p.id] + KE.marketPrice(G, p) * prem) / 2 / 5) * 5; if (np !== b.prices[p.id]) { b.prices[p.id] = np; moved = true; } });
      if (moved) notes.push('fiyat');
    }
    /* müdür: kapasite yetmiyorsa ve yer varsa bürodan bir kasiyer ya da garson alır */
    if (sum && sum.stats.arrivals > 40 && KE.lostShare(sum.stats) >= 0.15 && G.cash > 1500000) {
      const st = KE.branchStaff(G, b), front = st.filter((s) => s.role === 'kasiyer' || s.role === 'garson');
      const role = front.filter((s) => s.role === 'kasiyer').length <= front.filter((s) => s.role === 'garson').length ? 'kasiyer' : 'garson';
      const w = (G.workers || []).filter((x) => x.role === role || (x.role === 'kasiyer' || x.role === 'garson')).sort((a, c) => (c.speed || 0) - (a.speed || 0))[0];
      if (w && KE.canHire(G, b, w.role).ok) { w.branchId = b.id; w.hiredDay = G.day; G.staff.push(w); G.workers = G.workers.filter((x) => x !== w); notes.push('eleman'); b.mgrHired = w.name; }
    }
    b.managedNote = notes;
  }
  /* Bugünün talebi / son günlerin ortalaması. Sabah siparişi buna göre büyür ya da küçülür. */
  /* özel günün saatlik çarpanları (cuma öğlesi, maç akşamı) dahil günlük müşteri tahmini */
  KE.forecastCustomers = function (G, b) {
    const sp = KE.specialDay(G.day), C = KE.HOUR_CURVE;
    const sum = Object.values(C).reduce((a, v) => a + v, 0);
    const h = sp && sp.hours ? Object.keys(C).reduce((a, k) => a + C[k] * (sp.hours[k] || 1), 0) / sum : 1;
    return KE.expectedCustomers(G, b) * h;
  };
  KE.demandFactor = function (G, b) {
    const h = (b.expHist || []).slice(0, -1);
    if (h.length < 2) return 1;
    const avg = h.reduce((a, x) => a + x, 0) / h.length;
    return avg > 0 ? Math.round(Math.max(0.85, Math.min(1.6, KE.forecastCustomers(G, b) / avg)) * 100) / 100 : 1;
  };
  KE.stockNeed = (G, b, k, f) => (b.usage[k] || 0) * b.stockLevel * (f == null ? KE.demandFactor(G, b) : f);
  function fillStock(G, b, f) {
    let cost = 0, farm = 0;
    Object.keys(b.usage).forEach((k) => {
      let need = Math.max(0, KE.stockNeed(G, b, k, f) - (b.stock[k] || 0));
      if (need > 0 && G.farm && G.farm.store[k] > 0) {
        const take = Math.min(need, G.farm.store[k]);
        G.farm.store[k] -= take; b.stock[k] = (b.stock[k] || 0) + take; need -= take; farm += take; G.farm.bonus = G.farm.bonus || {}; G.farm.bonus[k] = true; G.farm.shipped += take;
      }
      if (need > 0) { cost += need * KE.ingPrice(G, b, k); b.stock[k] = (b.stock[k] || 0) + need; }
    });
    G.cash -= cost;
    return { cost, farm };
  }
  /* Sabah, kepenk açılmadan: bugünün ihtiyacına göre eksikleri tamamla (kampanya, stok ayarı sonrası) */
  KE.shortfall = function (G, b) {
    const f = KE.demandFactor(G, b);
    let cost = 0; const items = [];
    Object.keys(b.usage).forEach((k) => { const q = KE.stockNeed(G, b, k, f) - (b.stock[k] || 0); if (q > 0.01) { items.push(k); cost += q * KE.ingPrice(G, b, k); } });
    return { cost, items, factor: f };
  };
  KE.topUpToday = function (G, b) {
    if (G.phase !== 'morning') return 0;
    const r = fillStock(G, b, KE.demandFactor(G, b));
    G.today[b.id].purchases += r.cost; G.today[b.id].farmKg = (G.today[b.id].farmKg || 0) + r.farm;
    return r.cost;
  };
  KE.morning = function (G) {
    KE.RNG.seed(G, 'morning');
    G.today = {};
    if (G.farm) G.farm.bonus = {};
    G.branches.forEach((b) => { if (KE.isManaged(G, b)) manage(G, b); else b.managedNote = null; });
    /* dün acil kurye çağrıldıysa sabah siparişi kendiliğinden "Bol"a geçer */
    G.branches.forEach((b) => { b.bolNote = false; if (b.courierUsed) { b.courierUsed = false; if (b.stockLevel < 1.5) { b.stockLevel = 1.5; b.bolNote = true; } } });
    G.branches.forEach((b) => {
      /* talep tahmini: bugünün beklenen müşterisi son günlerin ortalamasına göre (özel gün, hafta sonu, kampanya) */
      const e = KE.forecastCustomers(G, b);
      b.expHist = (b.expHist || []).concat([Math.round(e * 10) / 10]).slice(-8);
      const r = fillStock(G, b, KE.demandFactor(G, b));
      G.today[b.id] = { purchases: r.cost, farmKg: r.farm };
    });
    KE.makeDaily(G);
    if (!G.weekly) KE.makeWeekly(G);
    if (!G.regulars) { G.regulars = {}; KE.REGULARS.forEach((r) => { G.regulars[r.id] = { loyalty: 0, visits: 0 }; }); }
    G.regularVisits = [];
    const openB = G.branches.filter((b) => KE.branchStaff(G, b).some(KE.isCook));
    if (openB.length) KE.REGULARS.forEach((r) => {
      const st = G.regulars[r.id];
      if (KE.rand() < 0.3 + st.loyalty * 0.04) G.regularVisits.push({ rid: r.id, branchId: openB[st.visits % openB.length === 0 ? 0 : Math.floor(KE.rand() * openB.length)].id, minute: 60 + Math.floor(KE.rand() * 600) });
    });
    G.staff.forEach((s) => { s.energy = 100; s.task = null; if (s.prevPos) { s.pos = s.prevPos; delete s.prevPos; } if (!KE.POSITIONS[s.role].includes(s.pos) || s.pos === 'mola') s.pos = KE.POSITIONS[s.role][0]; });
    /* ekip bu hafta hangi bahşiş kuralını istiyor */
    if (!G.tipWish || G.tipWish.until < G.day) {
      const st = G.staff, cir = st.filter((s) => s.role === 'cirak' && s.mentorId).length, usta = st.filter((s) => s.role === 'usta').length;
      /* "Eşit" zaten varsayılan: seyrek istenir; çıraklı ekipler ustaya ağırlık, kalabalık ekipler performans ister */
      const opts = ['esit', 'performans', 'performans'].concat(cir ? ['usta', 'usta'] : ['usta']).concat(usta >= 3 ? ['usta'] : []).concat(st.length >= 8 ? ['performans'] : []);
      let left = 0; while (left < 6 && !KE.isWeekEnd(G.day + left)) left++;
      G.tipWish = { rule: opts[Math.floor(KE.rand() * opts.length)], until: G.day + left, days: 0, hits: 0 };
    }
    /* rehber müfettişi: tepedeki zincire habersiz gelir */
    /* müfettiş bir gün önceden belirlenir: rezervasyonlu şubeye gelecekse defterde adı görünür */
    G.inspect = G.inspectNext && G.inspectNext.day === G.day && G.branches.some((x) => x.id === G.inspectNext.bid) ? { bid: G.inspectNext.bid } : null;
    if (G.inspectNext && G.inspectNext.day <= G.day) G.inspectNext = null;
    if (!G.inspect && !G.inspectNext && (G.era || 1) >= 3 && G.reputation >= 88 && (G.stars || 0) < 3 && G.day - (G.lastInspect || 0) > 45 && openB.length && KE.rand() < 0.06) {
      G.inspectNext = { bid: openB[Math.floor(KE.rand() * openB.length)].id, day: G.day + 1 }; G.lastInspect = G.day + 1;
    }
    G.phase = 'morning';
  };
  KE.buyExtra = function (G, b, k, qty) {
    const c = qty * KE.ingPrice(G, b, k);
    G.cash -= c; b.stock[k] = (b.stock[k] || 0) + qty;
    G.today[b.id].purchases += c;
    return c;
  };

  /* ---------- Günün hedefleri ---------- */
  KE.makeDaily = function (G) {
    const open = G.branches.filter((b) => KE.branchStaff(G, b).some(KE.isCook));
    const exp = open.reduce((a, b) => a + KE.expectedCustomers(G, b), 0);
    if (!exp) { G.daily = []; return; }
    const reward = Math.round(5000 * G.priceIndex * (1 + 0.6 * (open.length - 1)) / 500) * 500;
    const pool = [
      { kind: 'served', target: Math.max(20, Math.round(exp * 0.92 / 5) * 5), text: (t) => `${t} müşteriye servis yap` },
      { kind: 'sat', target: 78, text: (t) => `Ortalama memnuniyet %${t} ve üstü` },
      { kind: 'nocold', target: 0, text: () => 'Tezgâhta hiç tabak soğumasın' },
      { kind: 'lost', target: 4, text: (t) => `En fazla ${t} müşteri kaçır` },
      { kind: 'tips', target: Math.max(500, Math.round(exp * 14 * G.priceIndex / 100) * 100), text: (t) => `${KE.tl(t)} bahşiş topla` },
      { kind: 'match', target: Math.max(4, Math.round(exp * 0.08)), text: (t) => `${t} kez "Ellerine sağlık!" duy` }
    ];
    const others = pool.slice(1).sort(() => KE.rand() - 0.5).slice(0, 2);
    G.daily = [pool[0]].concat(others).map((g) => ({ kind: g.kind, target: g.target, text: g.text(g.target), reward }));
    /* bonus: tezgâha geçip kendin hazırla (isteğe bağlı) */
    G.daily.push({ kind: 'player', target: 6, text: 'Bonus: tezgâhta kendin 6 sipariş hazırla', reward: reward * 2, bonus: true });
  };
  function dailyTotals(G) {
    const t = { served: 0, satS: 0, satN: 0, cold: 0, lost: 0, tips: 0, match: 0, player: 0 };
    G.branches.forEach((b) => {
      const S = G.live && G.live[b.id] ? G.live[b.id].stats : (G.lastSummary && G.lastSummary.branches[b.id] ? G.lastSummary.branches[b.id].stats : null);
      if (!S) return;
      t.served += S.served; t.satS += S.satSum; t.satN += S.satN; t.cold += S.cold; t.lost += S.lost; t.tips += S.tips; t.match += S.matches; t.player += S.playerServed || 0;
    });
    return t;
  }
  /* Her hedef için: değer, ilerleme (0–1) ve durum (açık, tamam, kaçtı) */
  KE.dailyProgress = function (G, final) {
    const t = dailyTotals(G);
    return (G.daily || []).map((g) => {
      let v, p, state;
      if (g.kind === 'served') { v = t.served; p = v / g.target; state = v >= g.target ? 'done' : 'open'; }
      else if (g.kind === 'tips') { v = t.tips; p = v / g.target; state = v >= g.target ? 'done' : 'open'; }
      else if (g.kind === 'match') { v = t.match; p = v / g.target; state = v >= g.target ? 'done' : 'open'; }
      else if (g.kind === 'player') { v = t.player; p = v / g.target; state = v >= g.target ? 'done' : 'open'; }
      else if (g.kind === 'sat') { v = t.satN ? t.satS / t.satN : 0; p = t.satN ? v / g.target : 0; state = !t.satN ? 'open' : v >= g.target ? (final ? 'done' : 'ok') : 'open'; }
      else if (g.kind === 'nocold') { v = t.cold; p = v ? 0 : 1; state = v > 0 ? 'fail' : final ? 'done' : 'ok'; }
      else { v = t.lost; p = Math.max(0, 1 - v / (g.target + 1)); state = v > g.target ? 'fail' : final ? 'done' : 'ok'; }
      if (final && state !== 'done') state = 'fail';
      return Object.assign({}, g, { value: v, p: Math.max(0, Math.min(1, p)), state });
    });
  };

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

  const prodOf = (G, pid) => MODE(G).products.find((x) => x.id === pid);
  function availableProducts(G, b) { return MODE(G).products.filter((p) => KE.canMake(G, b, p)); }

  function chooseType(G, b, hour) {
    const d = KE.district(b);
    const mode = MODE(G);
    const weights = [];
    Object.entries(KE.CUSTOMER_TYPES).forEach(([t, ct]) => {
      let w = (d.mix[t] || 0.1) * ((ct.hours && ct.hours[hour]) || 1);
      if (KE.isWeekend(G.day) && ct.weekend) w *= ct.weekend;
      let best = 0;
      (mode.favorites[t] || []).forEach((pid) => { const p = prodOf(G, pid); if (p && KE.canMake(G, b, p)) best = Math.max(best, Math.max(1, KE.bestStar(G, b, pid))); });
      w *= Math.max(0.6, 1 + 0.15 * (best - 2));
      if (t === 'gurme') w *= best >= 5 ? 1.6 : best >= 4 ? 1 : 0.25;
      w *= KE.modVal(G, 'type:' + t);
      const sp = KE.specialDay(G.day);
      if (sp && sp.types[t]) w *= sp.types[t];
      weights.push([t, w]);
    });
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
    const tr = KE.TRAITS[s.trait] || {};
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
    const tr = KE.TRAITS[s.trait] || {};
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
      const tr = KE.TRAITS[s.trait] || {};
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
    if (server) { const tr = KE.TRAITS[server.trait] || {}; mul *= (1 + (tr.tip || 0)) * (0.7 + server.friendly * 0.6) * (0.8 + server.morale / 250); }
    if (cook) { const tr = KE.TRAITS[cook.trait] || {}; mul *= 1 + (tr.tip || 0) * 0.5; if (cook.costume === 'yoresel' && c.match) mul *= 1.12; }
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
    playerTick(G, b, L);
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

  /* ---------- Oyuncu tezgâhta ----------
     Overcooked usulü: oyuncu aynı anda 2 (hazırlık ekipmanı 2+ ise 3) sipariş tutar. Her tarif adımı bir
     istasyonda yapılır; istasyona dokunmak, o istasyonu sıradaki adım olarak bekleyen siparişi (önce seçili olanı)
     ilerletir. Ateş istasyonu süreli: et ateşe konur, pişince alınır; geç kalınırsa yanar. Hatasız ve hızlı
     siparişler kombo yapar. Bütün süreler oyun dakikasıyla ölçülür, böylece günlük yeniden oynatılabilir. */
  const pslots = (P) => P.slots || (P.slots = []);
  KE.playerCap = (G, b) => (b.equipment.prep >= 2 ? 3 : 2);
  /* oyuncu bu kadar dakika hiçbir istasyona dokunmazsa elindeki (dokunulmamış) fişler ustalara döner ve oyuncu,
     bir istasyona dokunana dek yeni fiş almaz. Çalışan oyuncunun bekleyen ikinci fişi geri alınmaz. */
  KE.PLAYER_IDLE = 12;
  /* slot görünümü eski alanlara yansır (tid/step/errors): sahne, testler ve eski günlükler bunlara bakar */
  function pmirror(P) {
    const sl = pslots(P);
    if (P.sel == null || P.sel >= sl.length) P.sel = 0;
    const s = sl[P.sel];
    P.tid = s ? s.tid : null; P.step = s ? s.step : 0; P.errors = s ? s.errors : 0; P.start = s ? s.start : 0;
  }
  /* fişi ustalara geri ver; hiç dokunulmamışsa malzemesi depoya döner (çifte harcama olmasın) */
  function prelease(G, b, L, sl) {
    const t = L.tickets.find((x) => x.id === sl.tid);
    if (t && t.state === 'cook' && t.cook === 'player') {
      t.state = 'wait'; t.cook = null;
      if (sl.step === 0 && sl.fire == null) { const p = prodOf(G, t.pid); Object.entries(p.ing).forEach(([k, q]) => { b.stock[k] = (b.stock[k] || 0) + q * t.count; }); }
    }
    const P = L.player;
    P.slots.splice(P.slots.indexOf(sl), 1);
  }
  KE.playerToggle = function (G, on) {
    const b = G.branches.find((x) => x.id === G.activeBranch);
    const L = G.live[b.id];
    const P = L.player;
    on = !!on;
    if (on === !!P.active) return;
    if (!on) pslots(P).slice().forEach((sl) => prelease(G, b, L, sl));
    Object.assign(P, { active: on, slots: [], sel: 0, combo: on ? P.combo || 0 : 0, tap: L.minute, afk: false });
    if (on && !P.quest) newQuest(G, b, P);
    pmirror(P);
  };
  KE.playerTake = function (G) {
    const b = G.branches.find((x) => x.id === G.activeBranch);
    const L = G.live[b.id];
    const P = L.player;
    /* eli boşsa hemen fiş gelir; ikinci/üçüncü fiş yalnızca son 2 dakikada istasyona dokunan (hızlı çalışan) oyuncuya */
    if (!P.active || pslots(P).length >= KE.playerCap(G, b) || P.afk || (pslots(P).length && L.minute - (P.tap || 0) > 2)) return null;
    const t = L.tickets.find((x) => x.state === 'wait' && !x.noPlayer);
    if (!t) return null;
    const p = prodOf(G, t.pid);
    if (!KE.hasStock(b, p, t.count)) return null;
    Object.entries(p.ing).forEach(([k, q]) => { b.stock[k] -= q * t.count; });
    t.state = 'cook'; t.cook = 'player';
    flagTicket(G, L, t);
    P.slots.push({ tid: t.id, step: 0, errors: 0, start: L.minute, fire: null, fst: null, burnt: 0, touch: L.minute });
    pmirror(P);
    return t;
  };
  KE.playerSelect = function (G, i) {
    const P = G.live[G.activeBranch].player;
    if (Number.isInteger(i) && i >= 0 && i < pslots(P).length) P.sel = i;
    pmirror(P);
  };
  /* Pişme süreleri (dakika): ürünün hazırlık süresinin yarısı, en az 2; pişince 5 dakika içinde alınmalı */
  KE.fireTimes = (p) => ({ cook: Math.max(2, Math.round(p.prep * 0.5)), grace: 5 });
  /* süreli istasyonlar: ateş (ürüne göre) ve fritöz (patates hep 3 dk, 4 dk içinde alınmalı) */
  KE.TIMED = { ates: (p) => KE.fireTimes(p), fritoz: () => ({ cook: 3, grace: 4 }) };
  const timedOf = (sl, p) => KE.TIMED[sl.fst || 'ates'](p || { prep: 4 });
  /* menü siparişinde ürünün tarifine "Patates" (fritöz) eklenir */
  KE.ticketSteps = (G, t) => { const p = prodOf(G, t.pid); return t.menu ? p.steps.concat(['Patates']) : p.steps; };
  /* Özel fişler oyuncunun aldığı anda belirlenir (fiş numarası ve güne göre, rastgelelik yok: yeniden oynatılır).
     Menü: + patates, bitince menü bahşişi. Acele: hızlı biterse acele bahşişi. Gurme müşteri: hatasız biterse itibar. */
  function flagTicket(G, L, t) {
    if (t.flagged) return;
    t.flagged = true;
    t.menu = (t.id * 7 + G.day * 3) % 4 === 0;
    t.rush = !t.menu && (t.id * 13 + G.day) % 6 === 0;
    const c = t.cid != null ? L.custs[t.cid] : null;
    t.gurme = !!(c && c.type === 'gurme');
  }
  /* Tezgâh görevi: art arda N siparişi hatasız bitir, ödül bahşiş kavanozuna */
  function newQuest(G, b, P) {
    const n = (P.questN = (P.questN || 0) + 1);
    const ps = MODE(G).products.filter((x) => b.menu[x.id]);
    const avg = ps.reduce((a, x) => a + (b.prices[x.id] || x.base), 0) / Math.max(1, ps.length);
    const need = 3 + (n % 3);
    P.quest = { need, done: 0, reward: Math.round((avg * need * 0.5) / 5) * 5 };
  }
  KE.playerQuestNew = newQuest;
  function pfinish(G, b, L, sl, p, t) {
    const P = L.player;
    const took = L.minute - sl.start;
    const par = p.prep + (t.menu ? 3 : 0);
    const slow = took > par * 2.6 ? 1 : took > par * 1.7 ? 0.4 : 0;
    const clean = !sl.errors && !sl.burnt && !slow;
    const combo = clean ? Math.min(5, (P.combo || 0) + 1) : 0;
    t.state = 'ready'; t.readyAt = L.minute; t.cookId = 'player'; t.cookName = G.owner;
    t.q = clamp(5 - sl.errors * 0.9 - sl.burnt * 1.4 - slow + Math.min(0.6, 0.15 * combo) + KE.TIERS[b.tier].quality + (KE.equip(G, b, 'prep').quality || 0), 0, 6);
    P.combo = combo; P.best = Math.max(P.best || 0, combo); P.done = (P.done || 0) + 1;
    L.fx.push({ t: 'ready', sid: 'player', pid: t.pid });
    if (combo >= 2) L.fx.push({ t: 'combo', sid: 'player', text: 'Kombo ×' + combo });
    /* özel fiş ödülleri */
    const price = (b.prices[t.pid] || p.base) * t.count, S = L.stats;
    const bonus = (f, text) => { const v = Math.round((price * f) / 5) * 5; if (v > 0) { S.tips += v; S.tezgahBonus = (S.tezgahBonus || 0) + v; L.fx.push({ t: 'tip', sid: 'player', text: text + ' +' + KE.tl(v) }); } };
    if (t.menu) bonus(0.25, 'Menü');
    if (t.rush && took <= par * 1.25 && !sl.errors) bonus(0.3, 'Acele');
    if (t.gurme) {
      if (clean) { S.repDelta += 0.05; L.fx.push({ t: 'regular', sid: 'player', text: 'Gurme beğendi!' }); }
      else S.repDelta -= 0.02;
    }
    if (P.quest) {
      if (clean) P.quest.done++; else P.quest.done = 0;
      if (P.quest.done >= P.quest.need) {
        S.tips += P.quest.reward; S.tezgahBonus = (S.tezgahBonus || 0) + P.quest.reward; P.questsDone = (P.questsDone || 0) + 1;
        L.fx.push({ t: 'regular', sid: 'player', text: 'Görev tamam! +' + KE.tl(P.quest.reward) });
        newQuest(G, b, P);
      }
    }
    P.slots.splice(P.slots.indexOf(sl), 1);
    if (P.sel >= P.slots.length) P.sel = 0;
  }
  /** İstasyona dokun: sonuç { ok, done?, fire?, wait?, burnt? } */
  KE.playerStation = function (G, st) {
    const b = G.branches.find((x) => x.id === G.activeBranch);
    const L = G.live[b.id];
    const P = L.player;
    const sl = pslots(P);
    if (!P.active || !KE.STATIONS.some((x) => x.id === st)) return { ok: false, none: true };
    /* herhangi bir dokunuş oyuncunun başında olduğunu gösterir: boşta işareti kalkar, eli boşsa hemen fiş alır */
    P.tap = L.minute;
    if (P.afk) { P.afk = false; while (KE.playerTake(G)); pmirror(P); return { ok: true, woke: true }; }
    if (!sl.length) { pmirror(P); return { ok: false, none: true }; }
    const order = sl.map((_, i) => (i + (P.sel || 0)) % sl.length);
    let res = null;
    /* süreli istasyonda (ateş, fritöz) önce pişmiş olanı al */
    if (KE.TIMED[st]) for (const i of order) {
      const s = sl[i];
      if (s.fire == null || (s.fst || 'ates') !== st) continue;
      if (L.minute < s.fire) { res = res || { ok: true, wait: true }; continue; }
      const t = L.tickets.find((x) => x.id === s.tid);
      const p = t && prodOf(G, t.pid);
      const burnt = L.minute > s.fire + timedOf(s, p).grace;
      if (burnt) s.burnt++;
      s.fire = null; s.fst = null; s.step++; s.touch = L.minute;
      P.sel = i;
      if (t && s.step >= KE.ticketSteps(G, t).length) { pfinish(G, b, L, s, p, t); pmirror(P); return { ok: true, done: true, burnt }; }
      pmirror(P);
      return { ok: true, burnt };
    }
    for (const i of order) {
      const s = sl[i];
      if (s.fire != null) continue;
      const t = L.tickets.find((x) => x.id === s.tid);
      if (!t) continue;
      const p = prodOf(G, t.pid), steps = KE.ticketSteps(G, t);
      if (KE.stepStation(steps[s.step]) !== st) continue;
      P.sel = i; s.touch = L.minute;
      if (KE.TIMED[st]) { s.fst = st; s.fire = L.minute + KE.TIMED[st](p).cook; pmirror(P); return { ok: true, fire: true }; }
      s.step++;
      if (s.step >= steps.length) { pfinish(G, b, L, s, p, t); pmirror(P); return { ok: true, done: true }; }
      pmirror(P);
      return { ok: true };
    }
    if (res) return res;
    const s = sl[P.sel || 0];
    if (s) s.errors++;
    P.combo = 0;
    if (P.quest) P.quest.done = 0;
    pmirror(P);
    return { ok: false };
  };
  /* eski hamle: adım adı → istasyonu */
  KE.playerStep = (G, label) => KE.playerStation(G, KE.stepStation(label));
  /* her dakika: ateşte unutulan yanar, bekleyen müşteri giderse sipariş düşer */
  function playerTick(G, b, L) {
    const P = L.player;
    if (!P.active || !P.slots || !P.slots.length) return;
    P.slots.slice().forEach((s) => {
      const t = L.tickets.find((x) => x.id === s.tid);
      if (!t || t.state !== 'cook') { P.slots.splice(P.slots.indexOf(s), 1); return; }
      const p = prodOf(G, t.pid);
      /* el sürülmeyen fiş ustalara döner: başlanmamışsa 4 dakika, yarım kalmışsa 20 dakika sonra (paket de dahil) */
      /* başlanmamış fişin müşterisi sabırsızlanıyorsa ustalara devret (yavaş oyuncu müşteri kaçırmasın) */
      const cu = t.cid != null ? L.custs[t.cid] : null;
      if (s.fire == null && cu && s.step === 0 && cu.wait > cu.patience * 1.2) { prelease(G, b, L, s); t.noPlayer = true; return; }
      if (s.fire == null && L.minute - (P.tap || 0) >= KE.PLAYER_IDLE && L.minute - s.touch >= (s.step === 0 ? KE.PLAYER_IDLE : KE.PLAYER_IDLE * 3)) { prelease(G, b, L, s); P.afk = true; return; }
      if (s.fire != null && L.minute > s.fire + timedOf(s, p).grace + 4) {
        /* kömür oldu: malzeme gitti, sipariş baştan ustaya döner */
        P.slots.splice(P.slots.indexOf(s), 1);
        t.state = 'wait'; t.cook = null; t.noPlayer = true; P.combo = 0; P.burned = (P.burned || 0) + 1;
        L.fx.push({ t: 'bad', sid: 'player', text: 'Yandı!' });
      }
    });
    pmirror(P);
  }
  KE.playerTick = playerTick;

  /* ---------- Gün kapanışı ---------- */
  KE.fastForward = function (G) {
    if (G.live[G.activeBranch] && G.live[G.activeBranch].player.active) KE.playerToggle(G, false);
    let guard = 0;
    while (!KE.allDone(G) && guard++ < 1200) KE.tickAll(G);
  };
  KE.finishService = function (G) {
    KE.fastForward(G);
    G.phase = 'closing';
    const summary = { day: G.day, branches: {} };
    G.branches.forEach((b) => {
      const L = G.live[b.id];
      const S = L.stats;
      const st = KE.branchStaff(G, b);
      const cold = KE.equip(G, b, 'cold');
      const cooks = st.filter(KE.isCook);
      const wasteMul = cooks.length ? cooks.reduce((a, s) => a + s.waste, 0) / cooks.length : 1;
      let wasteVal = 0;
      Object.keys(b.stock).forEach((k) => {
        const lost = b.stock[k] * cold.waste * wasteMul;
        wasteVal += lost * KE.ingPrice(G, b, k);
        b.stock[k] -= lost;
      });
      const usedToday = {};
      Object.keys(b.usage).forEach((k) => { usedToday[k] = 0; });
      Object.entries(S.byProduct).forEach(([pid, n]) => { const p = prodOf(G, pid); if (p) Object.entries(p.ing).forEach(([k, q]) => { usedToday[k] += q * n; }); });
      Object.entries(MODE(G).drink.ing).forEach(([k, q]) => { usedToday[k] += q * S.served * MODE(G).drinkRate; });
      /* stok bittiyse talep o günkü satıştan büyüktür: tahmini düşürme, yukarı çek (aksi hâlde stok-müşteri sarmalı) */
      const short = Object.keys(S.stockouts).length > 0;
      Object.keys(b.usage).forEach((k) => { b.usage[k] = short ? Math.max(b.usage[k], usedToday[k] * 1.3) : b.usage[k] * 0.6 + usedToday[k] * 0.4; });
      summary.branches[b.id] = { name: b.name, stats: S, paket: S.paket, paketRev: S.paketRev, wasteVal, purchases: G.today[b.id].purchases, sat: S.satN ? S.satSum / S.satN : 0, expected: L.expected };
    });
    G.lastSummary = summary;
    return summary;
  };

  KE.TIP_RULES = {
    esit: { name: 'Eşit paylaşım', desc: 'Kavanoz herkese eşit bölünür. Ekip morali dengeli artar.' },
    usta: { name: 'Ustaya ağırlık', desc: 'Ustalar iki pay alır. Ustalar keyiflenir, çıraklar ustalarından %30 daha hızlı öğrenir; diğerleri biraz bozulur.' },
    performans: { name: 'Performansa göre', desc: 'Kim çok iş çıkardıysa o çok alır. Rekabet yaratır.' },
    kasa: { name: 'Kasaya al', desc: 'Bahşiş işletmeye kalır. Ekip ay sonu primi sözüyle idare eder; kısa vadede nakit sağlar ama moral ve itibar zamanla düşer.' }
  };
  KE.tipShares = function (G, b, rule, jar) {
    const st = KE.branchStaff(G, b);
    if (rule === 'kasa' || !st.length) return st.map((s) => [s, 0]);
    const w = st.map((s) => [s, rule === 'usta' ? (s.role === 'usta' ? 2 : 1) : rule === 'performans' ? Math.max(0.2, s.servedToday) : 1]);
    const tot = w.reduce((a, x) => a + x[1], 0);
    return w.map(([s, v]) => [s, jar * v / tot]);
  };
  KE.finalizeDay = function (G, todayRule) {
    KE.RNG.seed(G, 'close');
    G.actionLog = (G.actionLog || []).concat([{ day: G.day, log: G.dayLog || [] }]).slice(-7);
    G.dayLog = [];
    const S0 = G.lastSummary;
    const out = { levelUps: [], quits: [], branches: {} };
    if (G.inspect && S0.branches[G.inspect.bid]) {
      const sm = S0.branches[G.inspect.bid], st = sm.stats, b = G.branches.find((x) => x.id === G.inspect.bid);
      const lost = st.arrivals ? KE.lostShare(st) : 1;
      const pass = sm.sat >= KE.INSPECT.sat && lost < KE.INSPECT.lost;
      if (pass) { G.stars = (G.stars || 0) + 1; G.reputation = Math.min(100, G.reputation + 3); } else G.reputation = Math.max(0, G.reputation - 5);
      out.inspect = { pass, stars: G.stars || 0, branch: b ? b.name : '', sat: Math.round(sm.sat), lost: Math.round(lost * 100) };
      G.inspect = null;
    }
    /* ekibin bahşiş isteği: hafta sonunda günlerin yarısında bile karşılanmadıysa ekip küser */
    const TW = G.tipWish;
    if (TW) {
      TW.days = (TW.days || 0) + 1; if ((todayRule || G.tipRule) === TW.rule) TW.hits = (TW.hits || 0) + 1;
      TW.missed = G.day >= TW.until && TW.hits * 2 < TW.days;
      if (G.day >= TW.until) out.tipWishEnd = { rule: TW.rule, hits: TW.hits, days: TW.days, missed: TW.missed };
    }
    G.branches.forEach((b) => {
      const sum = S0.branches[b.id];
      const S = sum.stats;
      const st = KE.branchStaff(G, b);
      const rule = todayRule || G.tipRule;
      if (rule === 'kasa') G.cash += S.tips;
      const shares = {};
      KE.tipShares(G, b, rule, S.tips).forEach(([s, v]) => { shares[s.id] = v; });
      const perf = st.slice().sort((a, c) => c.servedToday - a.servedToday);
      const amb = KE.ambience(G, b);
      const limit = G.mode === 'doner' ? 70 : 60;
      st.forEach((s) => {
        const tr = KE.TRAITS[s.trait] || {};
        const before = s.morale;
        let dm = (62 - s.morale) * 0.1;
        const share = shares[s.id] || 0;
        s.tipsMonth += share; s.tipsTotal += share; s.tipsToday = share;
        dm += Math.min(5, share / (s.wage / 30) * 6);
        /* kasaya alınan bahşiş: ekip payını görmez ama ay sonu primi sözüyle moralin bir kısmı korunur */
        if (rule === 'kasa') dm += Math.min(5, (S.tips / Math.max(1, st.length)) / (s.wage / 30) * 6) * 0.6 - 0.5;
        if (rule === 'usta') dm += s.role === 'usta' ? 3 : -1;
        if (rule === 'performans') dm += s === perf[0] ? 4 : s === perf[perf.length - 1] ? -2.5 : 0.5;
        if (G.tipWish && rule === G.tipWish.rule) dm += 1.5;
        if (G.tipWish && G.tipWish.missed) dm -= 2;
        if (s.servedToday > limit * 1.6) dm -= 5; else if (s.servedToday > limit) dm -= 2;
        if (s.minEnergy < 10) dm -= 6; else if (s.minEnergy < 25) dm -= 3; else if (s.minEnergy > 55) dm += 1;
        b.decor.forEach((id) => { const d = KE.DECOR.find((x) => x.id === id); if (d && d.morale) dm += d.morale * 0.5; });
        dm += KE.COSTUMES.find((x) => x.id === s.costume).morale * 0.06;
        if (amb.concept && s.costume !== 'temel') dm += 0.6;
        if (G.payLate) dm -= 3;
        if (dm < 0 && tr.moraleStable) dm *= 1 - tr.moraleStable;
        if (dm < 0 && KE.huyOf(s) === 'sadik') dm *= 0.7;
        s.morale = clamp(s.morale + dm, 0, 100);
        s.moraleDelta = s.morale - before;
        if (s.levelUps && s.levelUps.length) { s.levelUps.forEach((u) => out.levelUps.push({ name: s.name, pid: u.pid, star: u.star })); s.levelUps = []; }
      });
      st.filter((s) => s.mentorId).forEach((c) => {
        const m = st.find((x) => x.id === c.mentorId);
        if (!m) { c.mentorId = null; return; }
        const tm = KE.TRAITS[m.trait] || {}, tc = KE.TRAITS[c.trait] || {};
        Object.entries(m.spec).forEach(([pid, star]) => {
          if ((c.spec[pid] || 0) >= star - 1) return;
          if (KE.gainXp(c, pid, m.teach * 4 * (1 + (tm.teachBonus || 0)) * (1 + (tc.xp || 0)) * (rule === 'usta' ? 1.3 : 1))) out.levelUps.push({ name: c.name, pid, star: c.spec[pid], mentor: m.name });
        });
      });
      st.forEach((s) => { if (s.morale < 18 && KE.rand() < 0.3) { out.quits.push({ name: s.name, role: s.role, branch: b.name }); s.quit = true; } });
      b.cleanliness = clamp(b.cleanliness - 3, 5, 100);
      const fixed = (b.rent + KE.utilities(G, b) + st.reduce((a, s) => a + s.wage * (1 + KE.ECON.fazlaMesaiOrani) * 1.2 + KE.ECON.yolYardimiAylik, 0)) / 30;
      const sarf = S.revenue * KE.ECON.sarfOrani;
      G.cash -= sarf;
      const purchases = sum.purchases + sarf;
      G.cash += S.revenue;
      const entry = {
        day: G.day, date: KE.dateStr(G.day), month: KE.monthKey(G.day), branchId: b.id, revenue: S.revenue, card: S.card, cash: S.cash,
        purchases, sarf, waste: sum.wasteVal, tips: S.tips, tipRule: rule, served: S.served, lost: S.lost, arrivals: S.arrivals, sat: sum.sat,
        byProduct: S.byProduct, hourly: S.hourly, hourlyCust: S.hourlyCust, paket: S.paket, paketRev: S.paketRev, fixed, farmKg: G.today[b.id].farmKg || 0,
        net: S.revenue / (1 + KE.ECON.kdvRestoran) - purchases - fixed, stockouts: S.stockouts
      };
      G.ledger.days.push(entry);
      b.history.push({ day: G.day, revenue: S.revenue, net: entry.net, sat: sum.sat });
      out.branches[b.id] = entry;
    });
    G.staff = G.staff.filter((s) => !s.quit);
    const totalRep = G.branches.reduce((a, b) => a + S0.branches[b.id].stats.repDelta, 0);
    let dRep = clamp(totalRep, -2, 1.5);
    if (dRep > 0 && G.reputation > 55) dRep *= Math.max(0.08, 1 - (G.reputation - 55) / 50);
    G.reputation = clamp(G.reputation + dRep, 0, 100);
    /* tepede kalmak emek ister: 70'in üstünde itibar her gün biraz aşınır */
    if (G.reputation > 70) G.reputation = clamp(G.reputation - (G.reputation - 70) * (G.reputation - 70) / 600 * (1 - 0.25 * KE.charityLv(G, 'asevi')), 0, 100);
    out.journal = KE.writeJournal(G, S0, out);
    G.journal.unshift({ day: G.day, date: KE.dateStr(G.day), text: out.journal });
    if (G.journal.length > 60) G.journal.length = 60;
    G.mods.forEach((m) => { m.days -= 1; }); G.mods = G.mods.filter((m) => m.days > 0);
    if (KE.farmDay) out.farm = KE.farmDay(G);
    out.daily = KE.dailyProgress(G, true);
    out.daily.forEach((g) => { if (g.state === 'done') { G.cash += g.reward; G.reputation = clamp(G.reputation + (G.reputation > 70 ? 0.05 : 0.4), 0, 100); } });
    out.unlocks = [];
    KE.MODES[G.mode].products.filter((p) => p.unlock && !G.flags['tarif_' + p.id] && G.reputation >= p.unlock).forEach((p) => {
      G.flags['tarif_' + p.id] = true; out.unlocks.push(p);
      G.branches.forEach((b) => { b.menu[p.id] = true; b.prices[p.id] = KE.marketPrice(G, p); Object.entries(p.ing).forEach(([k, q]) => { b.usage[k] = Math.max(b.usage[k] || 0, KE.expectedCustomers(G, b) * 0.1 * q); }); });
    });
    out.regulars = [];
    G.branches.forEach((b) => (S0.branches[b.id].stats.regulars || []).forEach((x) => out.regulars.push(x)));
    /* toplu sipariş teslimi, imza tarifin bitmesi, haftalık meydan okuma */
    if (G.contract && G.contract.day === G.day) {
      const c = G.contract, net = c.pay - c.cost;
      G.cash += net; KE.addExtra(G, 'other', -net);
      const cb = G.branches.find((x) => x.id === c.branchId) || G.branches[0];
      KE.branchStaff(G, cb).forEach((s) => { s.morale = clamp(s.morale - c.morale, 0, 100); });
      G.reputation = clamp(G.reputation + 1, 0, 100);
      G.flags.contracts = (G.flags.contracts || 0) + 1;
      out.contract = Object.assign({ net }, c); G.contract = null;
    }
    if (G.sigWork && G.day >= G.sigWork.ready) { G.signature = { pid: G.sigWork.pid, level: G.sigWork.level }; out.signature = G.signature; G.sigWork = null; }
    if (G.weekly) {
      const W = G.weekly, a = W.acc;
      G.branches.forEach((b) => { const S = S0.branches[b.id].stats; a.served += S.served; a.match += S.matches; a.player += S.playerServed || 0; a.tips += S.tips; a.satS += S.satSum; a.satN += S.satN; });
      const val = W.kind === 'sat' ? (a.satN ? a.satS / a.satN : 0) : a[W.kind];
      W.value = val;
      const end = KE.isWeekEnd(G.day);
      if (!W.done && val >= W.target && (W.kind !== 'sat' || end)) { W.done = true; G.cash += W.reward; G.reputation = clamp(G.reputation + 1, 0, 100); out.weeklyDone = Object.assign({}, W); }
      if (end) { out.weeklyEnd = Object.assign({}, W); G.weekly = null; }
    }
    if (G.day >= 7 && G.ledger.days.filter((d) => d.day > G.day - 7).reduce((x, d) => x + d.net, 0) > 0) G.flags.profitWeek = G.flags.profitWeek || G.day;
    if (KE.isMonthEnd(G.day)) out.champions = KE.championship(G);
    out.goals = KE.checkGoals(G);
    out.eras = KE.advanceEra(G);
    if (KE.isMonthEnd(G.day)) out.month = KE.closeMonth(G, G.day);
    if (KE.isWeekEnd(G.day)) { out.news = KE.writeNews(G); G.news.unshift(out.news); KE.refreshMarket(G); KE.refreshWorkers(G); if (!G.flags.empire) G.rival.power += 3; }
    if (G.tipWish && G.tipWish.missed) G.tipWish.missed = false;
    KE.compactLedger(G);
    G.payLate = G.cash < 0;
    G.day += 1;
    G.pendingEvent = KE.rollEvent(G);
    G.live = null;
    KE.morning(G);
    return out;
  };

  /* Kayıt büyümesin: ayrıntılı gün satırları son 12 hafta ve içinde bulunulan ay için tutulur,
     eskileri ömür boyu toplamlara (arşiv) katlanır; aylık özetler zaten ayrı saklanır.
     Gün kapanışında yapılır, sunucunun yeniden oynatmasıyla birebir aynıdır. */
  KE.LEDGER_KEEP = 84;
  KE.compactLedger = function (G) {
    const cut = G.day - KE.LEDGER_KEEP, cur = KE.monthKey(G.day);
    const old = (d) => d.day <= cut && d.month !== cur;
    if (G.ledger.days.length && old(G.ledger.days[0])) {
      const A = G.ledger.archive = G.ledger.archive || { days: 0, revenue: 0, served: 0, tips: 0, byProduct: {} };
      G.ledger.days.filter(old).forEach((d) => { A.days++; A.revenue += d.revenue || 0; A.served += d.served || 0; A.tips += d.tips || 0; Object.entries(d.byProduct || {}).forEach(([k, v]) => { A.byProduct[k] = (A.byProduct[k] || 0) + v; }); });
      G.ledger.days = G.ledger.days.filter((d) => !old(d));
    }
    G.branches.forEach((b) => { if (b.history && b.history.length > 120) b.history = b.history.slice(-120); });
    if (G.news && G.news.length > 26) G.news = G.news.slice(0, 26);
    if (G.eventLog && G.eventLog.length > 400) G.eventLog = G.eventLog.slice(-400);
  };

  KE.gainXp = function (s, pid, amt) {
    if (!amt) return false;
    const cur = s.spec[pid] || 0;
    if (cur >= 5) return false;
    s.xp[pid] = (s.xp[pid] || 0) + amt;
    const need = KE.STAR_NEED[cur + 1];
    if (s.xp[pid] >= need) { s.xp[pid] -= need; s.spec[pid] = cur + 1; s.levelUps = (s.levelUps || []).concat([{ pid, star: cur + 1 }]); return true; }
    return false;
  };

  /* Ay sonu semt şampiyonluğu: şubenin ay ortalaması memnuniyeti "Lüks Kebap"ın semtteki çıtasını geçerse */
  KE.championship = function (G) {
    const key = KE.monthKey(G.day);
    let repWins = 0;
    return G.branches.map((b) => {
      const days = G.ledger.days.filter((d) => d.month === key && d.branchId === b.id);
      const served = days.reduce((a, d) => a + d.served, 0);
      const sat = served ? days.reduce((a, d) => a + d.sat * d.served, 0) / served : 0;
      const bar = Math.round(Math.min(86, (G.mode === 'kebap' ? 68 : 72) + G.rival.power * 0.08) + (G.rival.district === b.district ? 4 : 0) - (b.flagship ? 3 : 0));
      const won = served >= 250 && sat >= bar;
      if (won) { b.championUntil = G.day + 30; b.champions = (b.champions || 0) + 1; G.flags.champ = true; if (repWins++ < 3) G.reputation = clamp(G.reputation + 1, 0, 100); }
      return { id: b.id, name: b.name, district: KE.district(b).name, sat, bar, won, served };
    });
  };

  /* ---------- Oyuncu hamleleri: kayıt ve yeniden oynatma ----------
     Servis sırasında sonucu etkileyen her oyuncu hamlesi { m: dakika, a: ad, x: argümanlar } olarak
     günlüğe yazılır. Sabah durumu + tohum + günlük ile gün birebir yeniden oynatılabilir. */
  const ACTS = {
    setPos: (G, sid, pos) => { const s = G.staff.find((x) => x.id === sid); if (s) KE.setPos(G, s, pos); const b = s && G.branches.find((x) => x.id === s.branchId); if (b && G.phase === 'service') b.autoStaff = false; },
    autoStaff: (G, bid, on) => { const b = G.branches.find((x) => x.id === bid); if (b) b.autoStaff = !!on; },
    active: (G, bid) => { if (bid !== G.activeBranch && G.live && G.live[G.activeBranch] && G.live[G.activeBranch].player.active) KE.playerToggle(G, false); G.activeBranch = bid; },
    ptoggle: (G, on) => KE.playerToggle(G, !!on),
    ptake: (G) => KE.playerTake(G),
    pstep: (G, label) => KE.playerStep(G, label),
    pst: (G, st) => KE.playerStation(G, st),
    psel: (G, i) => KE.playerSelect(G, i),
    mid: (G, i) => KE.resolveMid(G, i),
    courier: (G, bid) => KE.courier(G, G.branches.find((x) => x.id === bid))
  };
  /* servis saati: kapalı (ustasız) şubenin dakikası 0'da kalır, açık olanlardan okunur */
  /* günü bitmiş şubenin saati durur; günlük dakikası hâlâ çalışan bir şubeden okunmalı, yoksa gün sonundaki
     hamleler yeniden oynatmada erken uygulanır */
  const clockL = (G) => { const ls = G.branches.map((b) => G.live[b.id]).filter((L) => L && !L.closed); return ls.find((L) => !L.done) || ls[0] || G.live[G.branches[0].id]; };
  KE.act = function (G, a, ...x) {
    const L = G.phase === 'service' && G.live ? clockL(G) : null;
    const m = L ? L.minute : 0;
    const r = ACTS[a](G, ...x);
    if (L && (a !== 'ptake' || r)) (G.dayLog = G.dayLog || []).push({ m, a, x });
    return r;
  };
  /* Sabah durumundaki (servis öncesi) bir oyunu, günlükteki hamlelerle sonuna kadar oynatır */
  KE.replayService = function (G, log) {
    KE.startService(G);
    const q = (log || []).slice();
    let guard = 0;
    while (!KE.allDone(G) && guard++ < 2000) {
      const m = clockL(G).minute;
      while (q.length && q[0].m <= m) { const e = q.shift(); if (Object.prototype.hasOwnProperty.call(ACTS, e.a)) ACTS[e.a](G, ...(Array.isArray(e.x) ? e.x : [])); }
      KE.tickAll(G);
    }
    KE.finishService(G);
    return G.lastSummary;
  };
})();
