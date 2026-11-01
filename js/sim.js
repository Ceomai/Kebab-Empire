/* Kebab Empire — simülasyon motoru
   Bütün şubeler aynı anda, dakika dakika çalışır.
   Akış: müşteri gelir → kasada sipariş verir (kasiyer/garson) → usta pişirir → komi/garson masaya götürür
   → müşteri yer, bahşiş bırakır ve çıkar → masa toplanır. Ustalar yalnızca pişirir. */
(function () {
  /* ---------- Tohumlu rastgelelik ----------
     Oyun sonucunu etkileyen her rastgele karar KE.rand() ile verilir. Akış her gün ve evre için
     oyunun tohumundan yeniden kurulur; aynı tohum + aynı oyuncu hamleleri = birebir aynı gün. */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
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
    return { mutfak: st + 1, salon: Math.ceil(tables / 2), destek: eq.service + 1, yonetim: 1 };
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
      hint = next ? (g.up === 'cook' ? 'Mobilya ve Dekor\'dan ocağı büyütürsen yer açılır.' : 'Mobilya ve Dekor\'dan salonu büyütürsen yer açılır.') : 'Bu şube en büyük hâlinde; başka şubeye yerleştir.';
    } else if (used >= cap) hint = 'Her şubede bir müdür olabilir.';
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
  KE.tableCount = (G, b) => KE.equip(G, b, 'service').tables + (b.decor.includes('dismasa') ? 2 : 0);

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
    const flag = b.flagship ? KE.FLAGSHIP.traffic : 1;
    return d.traffic * mode.trafficMul * repF * ambF * wk * rival * ad * mac * loyal * champ * sig * flag * (emp ? 1.1 : 1) * (sp && sp.id === 'bayram' ? 1.15 : 1) * (hol && !sp ? 1.25 : 1);
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
      else if (!so && sum.wasteVal > sum.stats.revenue * 0.04 && b.stockLevel > 1) { b.stockLevel = Math.max(1, Math.round((b.stockLevel - 0.05) * 100) / 100); notes.push('fire'); }
    }
    if (G.day % 7 === 1) {
      let moved = false;
      MODE(G).products.forEach((p) => { if (b.prices[p.id] == null) return; const np = Math.round((b.prices[p.id] + KE.marketPrice(G, p)) / 2 / 5) * 5; if (np !== b.prices[p.id]) { b.prices[p.id] = np; moved = true; } });
      if (moved) notes.push('fiyat');
    }
    b.managedNote = notes;
  }
  KE.morning = function (G) {
    KE.RNG.seed(G, 'morning');
    G.today = {};
    if (G.farm) G.farm.bonus = {};
    G.branches.forEach((b) => { if (KE.isManaged(G, b)) manage(G, b); else b.managedNote = null; });
    G.branches.forEach((b) => {
      let cost = 0, farm = 0;
      Object.keys(b.usage).forEach((k) => {
        const target = b.usage[k] * b.stockLevel;
        let need = Math.max(0, target - (b.stock[k] || 0));
        if (need > 0 && G.farm && G.farm.store[k] > 0) {
          const take = Math.min(need, G.farm.store[k]);
          G.farm.store[k] -= take; b.stock[k] = (b.stock[k] || 0) + take; need -= take; farm += take; G.farm.bonus[k] = true; G.farm.shipped += take;
        }
        if (need > 0) { cost += need * KE.ingPrice(G, b, k); b.stock[k] = (b.stock[k] || 0) + need; }
      });
      G.cash -= cost;
      G.today[b.id] = { purchases: cost, farmKg: farm };
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
    G.staff.forEach((s) => { s.energy = 100; s.task = null; if (!KE.POSITIONS[s.role].includes(s.pos) || s.pos === 'mola') s.pos = KE.POSITIONS[s.role][0]; });
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
    const reward = Math.round(5000 * G.priceIndex / 500) * 500;
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
    KE.branchStaff(G, b).forEach((s) => { s.servedToday = 0; s.tipsToday = 0; s.tasksToday = 0; s.minEnergy = 100; s.task = null; });
    const expected = KE.expectedCustomers(G, b);
    const curveSum = Object.values(KE.HOUR_CURVE).reduce((a, v) => a + v, 0);
    const tables = [];
    for (let i = 0; i < KE.tableCount(G, b); i++) tables.push({ id: i, occ: null, dirty: false, by: null });
    return {
      branchId: b.id, minute: 0, custs: {}, queue: [], tickets: [], tables, nextId: 1, spawnAcc: 0, paketAcc: 0, expected, curveSum,
      stats: { arrivals: 0, served: 0, lost: 0, lostPrice: 0, lostWait: 0, lostFull: 0, lostStock: 0, lostFood: 0, revenue: 0, card: 0, cash: 0, tips: 0,
        satSum: 0, satN: 0, matches: 0, byProduct: {}, hourly: new Array(14).fill(0), hourlyCust: new Array(14).fill(0), stockouts: {}, byType: {},
        repDelta: 0, best: null, playerServed: 0, gurmeHappy: 0, paket: 0, paketRev: 0, cold: 0 },
      fx: [], player: { active: false, tid: null, step: 0, errors: 0, start: 0, opts: [] }, done: false,
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
    const rate = L.expected * (KE.HOUR_CURVE[hour] || 0.3) * spH / L.curveSum / 60;
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
      if (L.queue.length >= KE.equip(G, b, 'service').queue) { lose(L, c, 'lostFull', 'Çok kalabalık!'); L.fx.push({ t: 'pass', cid: id }); continue; }
      const ch = chooseProduct(G, b, type, count);
      if (ch.stockMiss && L.stats.stockouts[ch.stockMiss.id] == null) L.stats.stockouts[ch.stockMiss.id] = L.minute;
      if (!ch.p) { lose(L, c, 'lostStock', 'Hepsi bitmiş!'); continue; }
      const p = ch.p;
      const price = b.prices[p.id];
      const ratio = price / KE.marketPrice(G, p);
      if (ratio > 1.08 + (1 - ct.priceSens) * 0.6 && KE.rand() < 0.85) { lose(L, c, 'lostPrice', 'Çok pahalı!'); L.fx.push({ t: 'pass', cid: id }); continue; }
      const take = (ct.takeaway || 0) * (G.mode === 'kebap' ? 0.4 : 1);
      Object.assign(c, {
        pid: p.id, price, ratio, state: 'queue', wait: 0, takeaway: KE.rand() < take,
        patience: ct.patience * KE.equip(G, b, 'service').patience * (G.mode === 'kebap' ? 1.5 : 1) * KE.modVal(G, 'patience'),
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
      const avail = availableProducts(G, b).filter((p) => KE.hasStock(b, p, 1));
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
    const stations = KE.equip(G, b, 'cook').stations;
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
      const waiting = L.tickets.filter((t) => t.state === 'wait');
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
      const pay = c.price * c.count + drinks * b.prices[MODE(G).drink.id];
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
    const pricePen = c.ratio > 1 ? (c.ratio - 1) * 70 * ct.priceSens : -(1 - c.ratio) * 25 * ct.priceSens;
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
    st.forEach((s) => { if (s.energy < (mgr ? 22 : 12) && s.pos !== 'mola') { const same = st.filter((x) => x.role === s.role && x !== s && x.pos !== 'mola'); if (same.length || !peak) KE.setPos(G, s, 'mola'); } });
    st.forEach((s) => { if (s.pos === 'mola' && s.energy >= (mgr ? 85 : 95)) KE.setPos(G, s, KE.POSITIONS[s.role][0]); });
    if (!mgr) return;
    const stations = KE.equip(G, b, 'cook').stations;
    const working = cooks.filter((s) => s.pos === 'ocak');
    if (pending >= 2 || peak) cooks.filter((s) => s.pos === 'mola' && s.energy > 40).slice(0, Math.max(0, stations - working.length)).forEach((s) => KE.setPos(G, s, 'ocak'));
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
        if (!c.ordering && c.wait > c.patience) { lose(L, c, 'lostWait', 'Bekletmeyin bizi!'); L.stats.repDelta -= 0.05 * c.count; removeCust(L, c, false); }
      } else if (c.state === 'seat' || c.state === 'pickup') {
        c.wait++;
        if (c.wait > c.patience * 1.9) {
          const t = L.tickets.find((x) => x.cid === c.id);
          if (t && t.state === 'cook') return;
          if (t) L.tickets.splice(L.tickets.indexOf(t), 1);
          st.forEach((s) => { if (s.task && s.task.type === 'deliver' && t && s.task.ref === t.id) s.task = null; });
          refund(L, c); lose(L, c, 'lostFood', 'Yemek gelmedi!'); L.stats.repDelta -= 0.15 * c.count; removeCust(L, c, false);
        }
      } else if (c.state === 'eat') {
        c.eatLeft -= 1;
        if (c.eatLeft <= 0) leave(G, b, L, c);
      }
    });
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
  KE.tickAll = function (G) { G.branches.forEach((b) => { const L = G.live[b.id]; if (L) KE.tick(G, b, L); }); };
  KE.allDone = (G) => G.branches.every((b) => !G.live[b.id] || G.live[b.id].done);

  /* ---------- Oyuncu tezgâhta ---------- */
  KE.playerToggle = function (G, on) {
    const L = G.live[G.activeBranch];
    if (!on && L.player.tid != null) { const t = L.tickets.find((x) => x.id === L.player.tid); if (t) { t.state = 'wait'; t.cook = null; } }
    Object.assign(L.player, { active: on, tid: null });
  };
  KE.playerTake = function (G) {
    const b = G.branches.find((x) => x.id === G.activeBranch);
    const L = G.live[b.id];
    if (!L.player.active || L.player.tid != null) return null;
    const t = L.tickets.find((x) => x.state === 'wait');
    if (!t) return null;
    const p = prodOf(G, t.pid);
    if (!KE.hasStock(b, p, t.count)) return null;
    Object.entries(p.ing).forEach(([k, q]) => { b.stock[k] -= q * t.count; });
    t.state = 'cook'; t.cook = 'player';
    const decoys = MODE(G).products.filter((x) => x.id !== p.id).flatMap((x) => x.steps).filter((s) => !p.steps.includes(s));
    const vpick = (a) => a[Math.floor(Math.random() * a.length)];
    const opts = p.steps.concat([vpick(decoys), vpick(decoys)]).filter((v, i, a) => a.indexOf(v) === i).sort(() => Math.random() - 0.5);
    Object.assign(L.player, { tid: t.id, step: 0, errors: 0, start: L.minute, opts });
    return t;
  };
  KE.playerStep = function (G, label) {
    const b = G.branches.find((x) => x.id === G.activeBranch);
    const L = G.live[b.id];
    const P = L.player;
    const t = L.tickets.find((x) => x.id === P.tid);
    if (!t) { P.tid = null; return { done: true }; }
    const p = prodOf(G, t.pid);
    if (p.steps[P.step] === label) {
      P.step++;
      if (P.step >= p.steps.length) {
        const took = L.minute - P.start;
        const slow = took > p.prep * 2 ? 1 : took > p.prep * 1.3 ? 0.4 : 0;
        t.state = 'ready'; t.readyAt = L.minute; t.cookId = 'player'; t.cookName = G.owner;
        t.q = clamp(5 - P.errors * 0.9 - slow + KE.TIERS[b.tier].quality + (KE.equip(G, b, 'prep').quality || 0), 0, 6);
        L.fx.push({ t: 'ready', sid: 'player', pid: t.pid });
        P.tid = null;
        return { done: true, ok: true };
      }
      return { ok: true };
    }
    P.errors++;
    return { ok: false };
  };

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
      const lostDemand = Object.keys(S.stockouts).length ? 1.15 : 1;
      Object.keys(b.usage).forEach((k) => { b.usage[k] = b.usage[k] * 0.6 + usedToday[k] * lostDemand * 0.4; });
      summary.branches[b.id] = { name: b.name, stats: S, paket: S.paket, paketRev: S.paketRev, wasteVal, purchases: G.today[b.id].purchases, sat: S.satN ? S.satSum / S.satN : 0, expected: L.expected };
    });
    G.lastSummary = summary;
    return summary;
  };

  KE.TIP_RULES = {
    esit: { name: 'Eşit paylaşım', desc: 'Kavanoz herkese eşit bölünür. Ekip morali dengeli artar.' },
    usta: { name: 'Ustaya ağırlık', desc: 'Ustalar iki pay alır. Usta sadakati artar, diğerleri biraz bozulur.' },
    performans: { name: 'Performansa göre', desc: 'Kim çok iş çıkardıysa o çok alır. Rekabet yaratır.' },
    kasa: { name: 'Kasaya al', desc: 'Bahşiş işletmeye kalır. Moral sert düşer.' }
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
      const limit = G.mode === 'doner' ? 70 : 40;
      st.forEach((s) => {
        const tr = KE.TRAITS[s.trait] || {};
        const before = s.morale;
        let dm = (62 - s.morale) * 0.1;
        const share = shares[s.id] || 0;
        s.tipsMonth += share; s.tipsTotal += share; s.tipsToday = share;
        dm += Math.min(5, share / (s.wage / 30) * 6);
        if (rule === 'kasa') dm -= 11;
        if (rule === 'usta') dm += s.role === 'usta' ? 3 : -2;
        if (rule === 'performans') dm += s === perf[0] ? 4 : s === perf[perf.length - 1] ? -2.5 : 0.5;
        if (s.servedToday > limit * 1.6) dm -= 5; else if (s.servedToday > limit) dm -= 2;
        if (s.minEnergy < 10) dm -= 6; else if (s.minEnergy < 25) dm -= 3; else if (s.minEnergy > 55) dm += 1;
        b.decor.forEach((id) => { const d = KE.DECOR.find((x) => x.id === id); if (d && d.morale) dm += d.morale * 0.5; });
        dm += KE.COSTUMES.find((x) => x.id === s.costume).morale * 0.06;
        if (amb.concept && s.costume !== 'temel') dm += 0.6;
        if (G.payLate) dm -= 3;
        if (dm < 0 && tr.moraleStable) dm *= 1 - tr.moraleStable;
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
          if (KE.gainXp(c, pid, m.teach * 4 * (1 + (tm.teachBonus || 0)) * (1 + (tc.xp || 0)))) out.levelUps.push({ name: c.name, pid, star: c.spec[pid], mentor: m.name });
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
    if (G.reputation > 70) G.reputation = clamp(G.reputation - (G.reputation - 70) / 55, 0, 100);
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
    G.payLate = G.cash < 0;
    G.day += 1;
    G.pendingEvent = KE.rollEvent(G);
    G.live = null;
    KE.morning(G);
    return out;
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
      const bar = Math.round(Math.min(90, 72 + G.rival.power * 0.08) + (G.rival.district === b.district ? 4 : 0) - (b.flagship ? 3 : 0));
      const won = served >= 250 && sat >= bar;
      if (won) { b.championUntil = G.day + 30; b.champions = (b.champions || 0) + 1; G.flags.champ = true; if (repWins++ < 3) G.reputation = clamp(G.reputation + 1, 0, 100); }
      return { id: b.id, name: b.name, district: KE.district(b).name, sat, bar, won, served };
    });
  };

  /* ---------- Oyun sonu: imparatorluk ---------- */
  KE.empirePrice = (G) => Math.round(KE.EMPIRE.price * G.priceIndex / 100000) * 100000;
  KE.empireStatus = function (G) {
    const E = KE.EMPIRE, price = KE.empirePrice(G);
    const crowns = G.branches.filter((b) => (b.champions || 0) > 0).length;
    const req = [
      { id: 'branches', label: 'Her semtte bir dükkân', have: G.branches.length, need: E.branches },
      { id: 'crowns', label: 'Semt şampiyonluğu tacı', have: crowns, need: E.crowns },
      { id: 'rep', label: 'İtibar', have: Math.round(G.reputation), need: E.reputation },
      { id: 'cash', label: 'Satın alma bedeli', have: Math.max(0, Math.round(G.cash)), need: price, money: true }
    ];
    if ((G.era || 1) < 4) req.unshift({ id: 'era', label: 'İmparatorluk yolu dönemi', have: G.era || 1, need: 4 });
    req.forEach((r) => { r.ok = r.have >= r.need; r.p = Math.min(1, r.have / r.need); });
    return { req, price, ready: req.every((r) => r.ok), done: !!(G.flags && G.flags.empire) };
  };
  /* Bütün oyun boyunca toplamlar (bitiş ekranı için) */
  KE.lifetime = function (G) {
    const days = G.ledger.days;
    const byProduct = {};
    days.forEach((d) => Object.entries(d.byProduct || {}).forEach(([k, v]) => { byProduct[k] = (byProduct[k] || 0) + v; }));
    const best = Object.entries(byProduct).sort((a, c) => c[1] - a[1])[0];
    return { days: G.day - 1, revenue: days.reduce((a, d) => a + (d.revenue || 0), 0), served: days.reduce((a, d) => a + (d.served || 0), 0), tips: days.reduce((a, d) => a + (d.tips || 0), 0), branches: G.branches.length, staff: G.staff.length, crowns: G.branches.reduce((a, b) => a + (b.champions || 0), 0), duels: (G.rival && G.rival.wins) || 0, duelsLost: (G.rival && G.rival.losses) || 0, gen: G.gen || 1, bestProduct: best ? best[0] : null, bestCount: best ? best[1] : 0 };
  };
  KE.buyRival = function (G) {
    const st = KE.empireStatus(G);
    if (st.done) return { ok: false, msg: 'Zincir zaten senin.' };
    if (!st.ready || G.phase !== 'morning') return { ok: false, msg: 'Şartlar henüz tamam değil.' };
    G.cash -= st.price;
    KE.addExtra(G, 'capex', st.price);
    G.flags.empire = G.day;
    G.rival.power = 0; G.rival.district = null;
    G.reputation = clamp(G.reputation + 5, 0, 100);
    G.staff.forEach((s) => { s.morale = clamp(s.morale + 15, 0, 100); });
    const goals = KE.checkGoals(G);
    return { ok: true, goals, life: KE.lifetime(G) };
  };
  KE.checkGoals = function (G) {
    const done = [];
    const test = {
      ilkhafta: () => G.day >= 7 && G.ledger.days.filter((d) => d.day <= 7).reduce((a, d) => a + d.net, 0) > 0,
      itibar50: () => G.reputation >= 50,
      usta5: () => !!G.flags.promoted,
      kostum: () => G.staff.length > 0 && G.staff.every((s) => s.costume !== 'temel'),
      konsept: () => G.branches.some((b) => KE.ambience(G, b).concept),
      sube2: () => G.branches.length >= 2,
      ciftlik: () => !!G.farm,
      sampiyon: () => !!G.flags.champ,
      ciro1m: () => G.ledger.months.some((m) => m.revenue >= 1000000),
      itibar80: () => G.reputation >= 80,
      sube4: () => G.branches.length >= 4,
      taclar3: () => G.branches.filter((b) => (b.champions || 0) > 0).length >= 3,
      sube7: () => G.branches.length >= KE.DISTRICTS.length,
      imparator: () => !!(G.flags && G.flags.empire)
    };
    KE.GOALS.forEach((g) => { if (!G.goals[g.id] && test[g.id] && test[g.id]()) { G.goals[g.id] = G.day; G.cash += g.reward; done.push(g); } });
    return done;
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
    G.today[b.id] = { purchases: c, farmKg: 0 };
    return b;
  };
  KE.branchCost = (G, d) => Math.round((d.rent * 3 + 350000) * G.priceIndex / 1000) * 1000;
  /* ---------- Dönemler ---------- */
  const ERA_TEST = {
    hafta: (G) => !!(G.flags.profitWeek || (G.goals && G.goals.ilkhafta)),
    rep40: (G) => G.reputation >= 40,
    upg: (G) => G.branches.some((b) => Object.values(b.equipment).some((v) => v > 0)),
    taclar2: (G) => G.branches.filter((b) => (b.champions || 0) > 0).length >= 2,
    sube3: (G) => G.branches.length >= 3,
    ciro3m: (G) => G.ledger.months.some((m) => m.revenue >= 3000000),
    rep65: (G) => G.reputation >= 65,
    sube5: (G) => G.branches.length >= 5,
    imza2: (G) => !!(G.signature && !G.signature.family && G.signature.level >= 2) || !!G.flags.legacyImza,
    kontrat4: (G) => (G.flags.contracts || 0) >= 4 || !!G.flags.legacyImza,
    imza: (G) => !!(G.signature && !G.signature.family) || !!G.flags.legacyImza
  };
  KE.eraStatus = function (G) {
    const n = G.era || 1, cur = KE.ERAS[n - 1];
    const req = cur.req.map((r) => Object.assign({}, r, { ok: !!ERA_TEST[r.id](G) }));
    return { era: n, cur, next: KE.ERAS[n] || null, req, ready: req.length > 0 && req.every((r) => r.ok) };
  };
  KE.advanceEra = function (G) {
    const out = [];
    while ((G.era || 1) < KE.ERAS.length && KE.eraStatus(G).ready) { G.era = (G.era || 1) + 1; (G.eraLog = G.eraLog || {})[G.era] = G.day; out.push(KE.ERAS[G.era - 1]); }
    return out;
  };
  KE.placeOpen = (G, id) => !G || (G.era || 1) >= (KE.PLACE_ERA[id] || 1);
  KE.placesOfEra = (n) => Object.keys(KE.PLACE_ERA).filter((k) => KE.PLACE_ERA[k] === n);

  /* ---------- Büyük yatırımlar (3. dönemden itibaren) ---------- */
  KE.signatureCost = function (G) {
    const lv = G.signature && !G.signature.family ? G.signature.level : 0;
    return lv >= KE.SIGNATURE.cost.length ? null : Math.round(KE.SIGNATURE.cost[lv] * G.priceIndex / 1000) * 1000;
  };
  KE.startSignature = function (G, pid) {
    if ((G.era || 1) < 3) return { ok: false, msg: 'İmza tarif 3. dönemde açılır.' };
    if (G.sigWork) return { ok: false, msg: 'Ar-Ge mutfağı zaten çalışıyor.' };
    const cost = KE.signatureCost(G);
    if (cost == null) return { ok: false, msg: 'Tarif zaten efsane seviyesinde.' };
    if (G.signature && !G.signature.family && G.signature.pid !== pid) return { ok: false, msg: 'İmza tarif bir kez seçilir.' };
    if (G.cash < cost) return { ok: false, msg: 'Kasa yetmiyor.' };
    G.cash -= cost; KE.addExtra(G, 'capex', cost);
    const lv = G.signature && !G.signature.family ? G.signature.level : 0;
    G.sigWork = { pid, level: lv + 1, ready: G.day + KE.SIGNATURE.days };
    return { ok: true };
  };
  KE.flagshipCost = (G) => Math.round(KE.FLAGSHIP.cost * G.priceIndex / 1000) * 1000;
  KE.buildFlagship = function (G, bid) {
    if ((G.era || 1) < 3) return { ok: false, msg: 'Amiral dükkân 3. dönemde açılır.' };
    if (G.branches.some((b) => b.flagship)) return { ok: false, msg: 'Zaten bir amiral dükkânın var.' };
    const b = G.branches.find((x) => x.id === bid); const cost = KE.flagshipCost(G);
    if (!b || G.cash < cost) return { ok: false, msg: 'Kasa yetmiyor.' };
    G.cash -= cost; KE.addExtra(G, 'capex', cost); b.flagship = G.day;
    return { ok: true };
  };
  /* Haftalık toplu sipariş teklifleri: oyunun tohumundan ve haftasından türetilir (her yerde aynı) */
  const weekOf = (G) => Math.floor((G.day - 1) / 7);
  KE.contractOffers = function (G) {
    if ((G.era || 1) < 3 || !G.branches.length) return [];
    const wk = weekOf(G), prods = MODE(G).products.filter((p) => !KE.isLocked(G, p)), b0 = G.branches[0];
    const seen = {};
    return [0, 1, 2, 3].map((i) => {
      const h = mix(G.seed, wk, 'ct', i);
      const k = KE.CONTRACT_KINDS[h % KE.CONTRACT_KINDS.length];
      if (seen[k.id]) return null; seen[k.id] = 1;
      const qty = Math.round((k.qty[0] + ((h >>> 8) % 1000) / 1000 * (k.qty[1] - k.qty[0])) / 10) * 10;
      const p = prods[(h >>> 4) % prods.length];
      const pay = Math.round(qty * KE.marketPrice(G, p) * 0.8 / 1000) * 1000;
      const cost = Math.round(qty * KE.productCost(G, b0, p) / 1000) * 1000;
      return { id: wk + '-' + i, kind: k.id, name: k.name, who: k.who, pid: p.id, qty, pay, cost, morale: k.morale };
    }).filter(Boolean).slice(0, 3);
  };
  KE.contractTaken = (G) => G.contractWeek === weekOf(G);
  KE.acceptContract = function (G, id, bid) {
    if (G.phase !== 'morning') return { ok: false, msg: 'Toplu sipariş sabah kabul edilir.' };
    if (KE.contractTaken(G)) return { ok: false, msg: 'Bu hafta zaten bir toplu sipariş aldın.' };
    const o = KE.contractOffers(G).find((x) => x.id === id);
    const b = G.branches.find((x) => x.id === bid) || G.branches[0];
    if (!o) return { ok: false, msg: 'Teklif bulunamadı.' };
    if (!KE.branchStaff(G, b).some(KE.isCook)) return { ok: false, msg: 'Bu şubede usta yok.' };
    G.contract = Object.assign({}, o, { day: G.day, branchId: b.id }); G.contractWeek = weekOf(G);
    return { ok: true };
  };

  /* ---------- Haftalık meydan okuma ---------- */
  KE.makeWeekly = function (G) {
    const open = G.branches.filter((b) => KE.branchStaff(G, b).some(KE.isCook));
    if (!open.length) { G.weekly = null; return; }
    let left = 1; while (left < 7 && !KE.isWeekEnd(G.day + left - 1)) left++;
    const exp = open.reduce((a, b) => a + KE.expectedCustomers(G, b), 0) * left;
    const kinds = KE.WEEKLY_KINDS.filter((x) => G.day > 7 || x.kind !== 'player');
    const k = kinds[mix(G.seed, G.day, 'wk') % kinds.length];
    const target = { served: Math.round(exp * 0.95 / 10) * 10, match: Math.max(10, Math.round(exp * 0.09)), player: Math.max(6, left * 3), tips: Math.round(exp * 18 * G.priceIndex / 500) * 500, sat: 82 }[k.kind];
    const reward = Math.round(30000 * G.priceIndex * (1 + 0.3 * (open.length - 1)) / 1000) * 1000;
    G.weekly = { start: G.day, kind: k.kind, target, text: k.text.replace('{t}', k.kind === 'tips' ? KE.tl(target) : String(target)), reward, value: 0, done: false, acc: { served: 0, match: 0, player: 0, tips: 0, satS: 0, satN: 0 } };
  };

  /* ---------- Oyuncu hamleleri: kayıt ve yeniden oynatma ----------
     Servis sırasında sonucu etkileyen her oyuncu hamlesi { m: dakika, a: ad, x: argümanlar } olarak
     günlüğe yazılır. Sabah durumu + tohum + günlük ile gün birebir yeniden oynatılabilir. */
  const ACTS = {
    setPos: (G, sid, pos) => { const s = G.staff.find((x) => x.id === sid); if (s) KE.setPos(G, s, pos); const b = s && G.branches.find((x) => x.id === s.branchId); if (b && G.phase === 'service') b.autoStaff = false; },
    autoStaff: (G, bid, on) => { const b = G.branches.find((x) => x.id === bid); if (b) b.autoStaff = !!on; },
    active: (G, bid) => { if (G.live && G.live[G.activeBranch] && G.live[G.activeBranch].player.active) KE.playerToggle(G, false); G.activeBranch = bid; },
    ptoggle: (G, on) => KE.playerToggle(G, !!on),
    ptake: (G) => KE.playerTake(G),
    pstep: (G, label) => KE.playerStep(G, label)
  };
  KE.act = function (G, a, ...x) {
    const L = G.phase === 'service' && G.live ? G.live[G.branches[0].id] : null;
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
      const m = G.live[G.branches[0].id].minute;
      while (q.length && q[0].m <= m) { const e = q.shift(); if (ACTS[e.a]) ACTS[e.a](G, ...(e.x || [])); }
      KE.tickAll(G);
    }
    KE.finishService(G);
    return G.lastSummary;
  };
})();
