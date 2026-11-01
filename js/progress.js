/* Kebab Empire — uzun vadeli ilerleme: imparatorluk, dönemler, büyük yatırımlar (imza tarif,
   amiral dükkân, toplu siparişler), vakıf ve haftalık meydan okuma. */
(function () {
  const KE = window.KE;
  const rnd = (a, b) => a + KE.rand() * (b - a);
  const pick = (a) => a[Math.floor(KE.rand() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const MODE = (G) => KE.MODES[G.mode];
  const mix = KE.mix;

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
  /* Hedef ödülü enflasyonla ve zincirin büyüklüğüyle büyür */
  KE.goalReward = (G, g) => Math.round((g.reward || 0) * G.priceIndex * (1 + 0.5 * (G.branches.length - 1)) / 1000) * 1000;
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
    KE.GOALS.forEach((g) => { if (!G.goals[g.id] && test[g.id] && test[g.id]()) { G.goals[g.id] = G.day; const r = KE.goalReward(G, g); G.cash += r; done.push(Object.assign({}, g, { reward: r })); } });
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
    ay1: (G) => G.ledger.months.some((m) => m.net > 0),
    rep40: (G) => G.reputation >= 40,
    upg: (G) => G.branches.some((b) => Object.values(b.equipment).some((v) => v > 0)),
    sampiyon: (G) => !!G.flags.champ,
    sube3: (G) => G.branches.length >= 3,
    sube4: (G) => G.branches.length >= 4,
    ciro5m: (G) => G.ledger.months.some((m) => m.revenue >= 5000000),
    ciro3m: (G) => G.ledger.months.some((m) => m.revenue >= 3000000),
    rep65: (G) => G.reputation >= 65,
    sube6: (G) => G.branches.length >= 6,
    taclar2: (G) => G.branches.filter((b) => (b.champions || 0) > 0).length >= 2 || !!G.flags.legacyImza,
    taclar3: (G) => G.branches.filter((b) => (b.champions || 0) > 0).length >= 3 || !!G.flags.legacyImza,
    imza2: (G) => !!(G.signature && !G.signature.family && G.signature.level >= 2) || !!G.flags.legacyImza,
    kontrat6: (G) => (G.flags.contracts || 0) >= 10 || !!G.flags.legacyImza,
    imza: (G) => !!(G.signature && !G.signature.family) || !!G.flags.legacyImza
  };
  KE.eraStatus = function (G) {
    const n = G.era || 1, cur = KE.ERAS[n - 1];
    const req = cur.req.filter((r) => !r.mode || r.mode === G.mode).map((r) => Object.assign({}, r, { ok: !!ERA_TEST[r.id](G) }));
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
      const pay = Math.round(qty * KE.marketPrice(G, p) * 1.5 / 1000) * 1000;
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

  /* ---------- Vakıf ve sponsorluk ---------- */
  KE.charityCost = (G, id) => { const c = KE.CHARITY.find((x) => x.id === id), lv = KE.charityLv(G, id); return lv >= c.cost.length ? null : Math.round(c.cost.at(lv) * G.priceIndex / 10000) * 10000; };
  KE.donate = function (G, id) {
    if ((G.era || 1) < 3) return { ok: false, msg: 'Vakıf 3. dönemde açılır.' };
    if (G.phase !== 'morning') return { ok: false, msg: 'Bağış sabah yapılır.' };
    const cost = KE.charityCost(G, id);
    if (cost == null) return { ok: false, msg: 'Bu bağış en üst seviyede.' };
    if (G.cash < cost) return { ok: false, msg: 'Kasada yeterli para yok.' };
    G.cash -= cost; KE.addExtra(G, 'other', cost);
    G.charity = G.charity || {}; G.charity[id] = KE.charityLv(G, id) + 1;
    G.flags.donated = (G.flags.donated || 0) + cost;
    if (id === 'okul') G.reputation = clamp(G.reputation + 3, 0, 100);
    if (id === 'asevi') G.staff.forEach((s) => { s.morale = clamp(s.morale + 3, 0, 100); });
    return { ok: true, cost, level: G.charity[id] };
  };
})();
