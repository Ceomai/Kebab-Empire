/* Kebab Empire — simülasyon motoru (7/8): servis sonu ve gün kapanışı */
(function () {
  const { clamp, mode: MODE, prod: prodOf } = KE.U;
  /* ---------- Servis sonu: kalan dakikaları hızla oynat, fire ve tüketimi hesapla ---------- */
  KE.fastForward = function (G) {
    if (/** @type {Record<string, Live>} */ (G.live)[G.activeBranch] && /** @type {Record<string, Live>} */ (G.live)[G.activeBranch].player.active) KE.playerToggle(G, false);
    let guard = 0;
    while (!KE.allDone(G) && guard++ < 1200) KE.tickAll(G);
  };
  KE.finishService = function (G) {
    KE.fastForward(G);
    G.phase = 'closing';
    /** @type {DaySummary} */
    const summary = { day: G.day, branches: {} };
    G.branches.forEach((b) => {
      const L = /** @type {Record<string, Live>} */ (G.live)[b.id];
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
      /** @type {Record<string, number>} */
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
    if (rule === 'kasa' || !st.length) return st.map((s) => /** @type {[Staff, number]} */ ([s, 0]));
    const w = st.map((s) => /** @type {[Staff, number]} */ ([s, rule === 'usta' ? (s.role === 'usta' ? 2 : 1) : rule === 'performans' ? Math.max(0.2, s.servedToday) : 1]));
    const tot = w.reduce((a, x) => a + x[1], 0);
    return w.map(([s, v]) => /** @type {[Staff, number]} */ ([s, jar * v / tot]));
  };
  /* ---------- Gün kapanışı: KE.finalizeDay ----------
     Alt adımlar aşağıda tanımlı sırayla çağrılır. Sıra önemlidir: tohumlu akış ('close') bu sırayla tüketilir
     (ör. istifa zarları şube sırasıyla atılır) ve sunucu aynı sırayla yeniden oynatır; adımların yeri değişmemeli.

     Geç bağlanan bağımlılıklar: aşağıdakiler motor dosyalarından SONRA yüklenen dosyalarda tanımlıdır ve
     yalnızca gün kapanışında çağrılır (yüklenirken değil), bu yüzden doğrudan KE üzerinden okunur:
       narrative.js → KE.writeJournal, KE.writeNews, KE.rollEvent
       progress.js  → KE.checkGoals, KE.advanceEra
       midday.js    → KE.lostShare
       farm.js      → KE.farmDay  (İSTEĞE BAĞLI: çiftlik dosyası yüklenmemişse adım atlanır)
     Zorunlu olanlar eksikse oyun yüklenişi hatalıdır; KE.closeDeps() hangilerinin eksik olduğunu söyler. */
  /** @type {Record<string, string>} */
  const LATE = { writeJournal: 'narrative', writeNews: 'narrative', rollEvent: 'narrative', checkGoals: 'progress', advanceEra: 'progress', lostShare: 'midday' };
  KE.closeDeps = () => /** @type {(keyof KENamespace)[]} */ (Object.keys(LATE)).filter((k) => typeof KE[k] !== 'function').map((k) => 'KE.' + k + ' (' + LATE[k] + '.js)');

  /* 1. Günün hamle günlüğünü sakla, kapanış akışını tohumla */
  function beginClose(/** @type {Game} */ G) {
    KE.RNG.seed(G, 'close');
    G.actionLog = (G.actionLog || []).concat([{ day: G.day, log: G.dayLog || [] }]).slice(-7);
    G.dayLog = [];
  }
  /* 2. Rehber müfettişinin kararı (yıldız ya da itibar kaybı) */
  function inspectorVerdict(/** @type {Game} */ G, /** @type {DaySummary} */ S0, /** @type {DayResult} */ out) {
    if (!(G.inspect && S0.branches[G.inspect.bid])) return;
    const sm = S0.branches[G.inspect.bid], st = sm.stats, b = G.branches.find((x) => x.id === G.inspect.bid);
    const lost = st.arrivals ? KE.lostShare(st) : 1;
    const pass = sm.sat >= KE.INSPECT.sat && lost < KE.INSPECT.lost;
    if (pass) { G.stars = (G.stars || 0) + 1; G.reputation = Math.min(100, G.reputation + 3); } else G.reputation = Math.max(0, G.reputation - 5);
    out.inspect = { pass, stars: G.stars || 0, branch: b ? b.name : '', sat: Math.round(sm.sat), lost: Math.round(lost * 100) };
    G.inspect = null;
  }
  /* 3. Ekibin bahşiş isteği: hafta sonunda günlerin yarısında bile karşılanmadıysa ekip küser */
  function tallyTipWish(/** @type {Game} */ G, /** @type {string} */ rule, /** @type {DayResult} */ out) {
    const TW = G.tipWish;
    if (!TW) return;
    TW.days = (TW.days || 0) + 1; if (rule === TW.rule) TW.hits = (TW.hits || 0) + 1;
    TW.missed = G.day >= TW.until && TW.hits * 2 < TW.days;
    if (G.day >= TW.until) out.tipWishEnd = { rule: TW.rule, hits: TW.hits, days: TW.days, missed: TW.missed };
  }
  /* 4a. Bahşiş paylaşımı ve günlük moral değişimi */
  function tipsAndMorale(/** @type {Game} */ G, /** @type {Branch} */ b, /** @type {Staff[]} */ st, /** @type {DayStats} */ S, /** @type {string} */ rule, /** @type {DayResult} */ out) {
    if (rule === 'kasa') G.cash += S.tips;
    /** @type {Record<string, number>} */
    const shares = {};
    KE.tipShares(G, b, rule, S.tips).forEach(([s, v]) => { shares[s.id] = v; });
    const perf = st.slice().sort((a, c) => c.servedToday - a.servedToday);
    const amb = KE.ambience(G, b);
    const limit = G.mode === 'doner' ? 70 : 60;
    st.forEach((s) => {
      const tr = /** @type {Partial<Trait>} */ (KE.TRAITS[s.trait] || {});
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
      dm += /** @type {Costume} */ (KE.COSTUMES.find((x) => x.id === s.costume)).morale * 0.06;
      if (amb.concept && s.costume !== 'temel') dm += 0.6;
      if (G.payLate) dm -= 3;
      if (dm < 0 && tr.moraleStable) dm *= 1 - tr.moraleStable;
      if (dm < 0 && KE.huyOf(s) === 'sadik') dm *= 0.7;
      s.morale = clamp(s.morale + dm, 0, 100);
      s.moraleDelta = s.morale - before;
      if (s.levelUps && s.levelUps.length) { s.levelUps.forEach((/** @type {{ pid: string; star: number }} */ u) => out.levelUps.push({ name: s.name, pid: u.pid, star: u.star })); s.levelUps = []; }
    });
  }
  /* 4b. Çıraklar mentor ustalarından öğrenir */
  function mentorApprentices(/** @type {Staff[]} */ st, /** @type {string} */ rule, /** @type {DayResult} */ out) {
    st.filter((s) => s.mentorId).forEach((c) => {
      const m = st.find((x) => x.id === c.mentorId);
      if (!m) { c.mentorId = null; return; }
      const tm = /** @type {Partial<Trait>} */ (KE.TRAITS[m.trait] || {}), tc = /** @type {Partial<Trait>} */ (KE.TRAITS[c.trait] || {});
      Object.entries(m.spec).forEach(([pid, star]) => {
        if ((c.spec[pid] || 0) >= star - 1) return;
        if (KE.gainXp(c, pid, m.teach * 4 * (1 + (tm.teachBonus || 0)) * (1 + (tc.xp || 0)) * (rule === 'usta' ? 1.3 : 1))) out.levelUps.push({ name: c.name, pid, star: c.spec[pid], mentor: m.name });
      });
    });
  }
  /* 4c. Morali dibe vuran istifa eder (tohumlu zar) */
  function rollQuits(/** @type {Branch} */ b, /** @type {Staff[]} */ st, /** @type {DayResult} */ out) {
    st.forEach((s) => { if (s.morale < 18 && KE.rand() < 0.3) { out.quits.push({ name: s.name, role: s.role, branch: b.name }); s.quit = true; } });
  }
  /* 4d. Kasa ve defter: ciro, sarf, sabit giderin günlük payı, şube geçmişi */
  function bookDay(/** @type {Game} */ G, /** @type {Branch} */ b, /** @type {Staff[]} */ st, /** @type {DaySummary["branches"][string]} */ sum, /** @type {string} */ rule, /** @type {DayResult} */ out) {
    const S = sum.stats;
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
  }
  /* 4. Her şube sırayla kapanır */
  function closeBranch(/** @type {Game} */ G, /** @type {Branch} */ b, /** @type {DaySummary} */ S0, /** @type {string} */ rule, /** @type {DayResult} */ out) {
    const sum = S0.branches[b.id];
    const st = KE.branchStaff(G, b);
    tipsAndMorale(G, b, st, sum.stats, rule, out);
    mentorApprentices(st, rule, out);
    rollQuits(b, st, out);
    b.cleanliness = clamp(b.cleanliness - 3, 5, 100);
    bookDay(G, b, st, sum, rule, out);
  }
  /* 5. İstifa edenler ayrılır, günün itibar değişimi uygulanır */
  function applyReputation(/** @type {Game} */ G, /** @type {DaySummary} */ S0) {
    G.staff = G.staff.filter((s) => !s.quit);
    const totalRep = G.branches.reduce((a, b) => a + S0.branches[b.id].stats.repDelta, 0);
    let dRep = clamp(totalRep, -2, 1.5);
    if (dRep > 0 && G.reputation > 55) dRep *= Math.max(0.08, 1 - (G.reputation - 55) / 50);
    G.reputation = clamp(G.reputation + dRep, 0, 100);
    /* tepede kalmak emek ister: 70'in üstünde itibar her gün biraz aşınır */
    if (G.reputation > 70) G.reputation = clamp(G.reputation - (G.reputation - 70) * (G.reputation - 70) / 600 * (1 - 0.25 * KE.charityLv(G, 'asevi')), 0, 100);
  }
  /* 6. Gün sonu günlüğü (narrative.js) */
  function journal(/** @type {Game} */ G, /** @type {DaySummary} */ S0, /** @type {DayResult} */ out) {
    out.journal = KE.writeJournal(G, S0, out);
    G.journal.unshift({ day: G.day, date: KE.dateStr(G.day), text: out.journal });
    if (G.journal.length > 60) G.journal.length = 60;
  }
  /* 7. Günlük işler: geçici etkiler, çiftlik, günün hedefleri, yeni tarifler, müdavimler */
  function dailyTicks(/** @type {Game} */ G, /** @type {DaySummary} */ S0, /** @type {DayResult} */ out) {
    G.mods.forEach((m) => { m.days -= 1; }); G.mods = G.mods.filter((m) => m.days > 0);
    if (KE.farmDay) out.farm = KE.farmDay(G); /* isteğe bağlı: farm.js yüklüyse */
    out.daily = KE.dailyProgress(G, true);
    out.daily.forEach((/** @type {any} */ g) => { if (g.state === 'done') { G.cash += g.reward; G.reputation = clamp(G.reputation + (G.reputation > 70 ? 0.05 : 0.4), 0, 100); } });
    out.unlocks = [];
    KE.MODES[G.mode].products.filter((p) => p.unlock && !G.flags['tarif_' + p.id] && G.reputation >= p.unlock).forEach((p) => {
      G.flags['tarif_' + p.id] = true; out.unlocks.push(p);
      G.branches.forEach((b) => { b.menu[p.id] = true; b.prices[p.id] = KE.marketPrice(G, p); Object.entries(p.ing).forEach(([k, q]) => { b.usage[k] = Math.max(b.usage[k] || 0, KE.expectedCustomers(G, b) * 0.1 * q); }); });
    });
    out.regulars = [];
    G.branches.forEach((b) => (S0.branches[b.id].stats.regulars || []).forEach((/** @type {any} */ x) => out.regulars.push(x)));
  }
  /* 8. Toplu sipariş teslimi ve imza tarifin bitmesi */
  function deliveries(/** @type {Game} */ G, /** @type {DayResult} */ out) {
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
  }
  /* 9. Haftalık meydan okuma */
  function weeklyChallenge(/** @type {Game} */ G, /** @type {DaySummary} */ S0, /** @type {DayResult} */ out) {
    if (!G.weekly) return;
    const W = G.weekly, a = W.acc;
    G.branches.forEach((b) => { const S = S0.branches[b.id].stats; a.served += S.served; a.match += S.matches; a.player += S.playerServed || 0; a.tips += S.tips; a.satS += S.satSum; a.satN += S.satN; });
    const val = W.kind === 'sat' ? (a.satN ? a.satS / a.satN : 0) : a[W.kind];
    W.value = val;
    const end = KE.isWeekEnd(G.day);
    if (!W.done && val >= W.target && (W.kind !== 'sat' || end)) { W.done = true; G.cash += W.reward; G.reputation = clamp(G.reputation + 1, 0, 100); out.weeklyDone = Object.assign({}, W); }
    if (end) { out.weeklyEnd = Object.assign({}, W); G.weekly = null; }
  }
  /* 10. Dönem işleri: kârlı hafta, ay sonu şampiyonluğu, hedefler, dönemler, ay kapanışı, hafta sonu gazetesi ve pazar */
  function periodTicks(/** @type {Game} */ G, /** @type {DayResult} */ out) {
    if (G.day >= 7 && G.ledger.days.filter((d) => d.day > G.day - 7).reduce((x, d) => x + d.net, 0) > 0) G.flags.profitWeek = G.flags.profitWeek || G.day;
    if (KE.isMonthEnd(G.day)) out.champions = KE.championship(G);
    out.goals = KE.checkGoals(G);
    out.eras = KE.advanceEra(G);
    if (KE.isMonthEnd(G.day)) out.month = KE.closeMonth(G, G.day);
    if (KE.isWeekEnd(G.day)) { out.news = KE.writeNews(G); G.news.unshift(out.news); KE.refreshMarket(G); KE.refreshWorkers(G); if (!G.flags.empire) G.rival.power += 3; }
  }
  /* 11. Ertesi güne geç: kayıt sıkıştırma, yeni gün, olay kartı, sabah */
  function nextMorning(/** @type {Game} */ G) {
    if (G.tipWish && G.tipWish.missed) G.tipWish.missed = false;
    KE.compactLedger(G);
    G.payLate = G.cash < 0;
    G.day += 1;
    G.pendingEvent = KE.rollEvent(G);
    G.live = null;
    KE.morning(G);
  }
  KE.finalizeDay = function (G, todayRule) {
    beginClose(G);
    const S0 = G.lastSummary;
    /** @type {DayResult} */
    const out = { levelUps: [], quits: [], branches: {} };
    const rule = todayRule || G.tipRule;
    inspectorVerdict(G, S0, out);
    tallyTipWish(G, rule, out);
    G.branches.forEach((b) => closeBranch(G, b, S0, rule, out));
    applyReputation(G, S0);
    journal(G, S0, out);
    dailyTicks(G, S0, out);
    deliveries(G, out);
    weeklyChallenge(G, S0, out);
    periodTicks(G, out);
    nextMorning(G);
    return out;
  };

  /* Kayıt büyümesin: ayrıntılı gün satırları son 12 hafta ve içinde bulunulan ay için tutulur,
     eskileri ömür boyu toplamlara (arşiv) katlanır; aylık özetler zaten ayrı saklanır.
     Gün kapanışında yapılır, sunucunun yeniden oynatmasıyla birebir aynıdır. */
  KE.LEDGER_KEEP = 84;
  KE.compactLedger = function (G) {
    const cut = G.day - KE.LEDGER_KEEP, cur = KE.monthKey(G.day);
    const old = (/** @type {any} */ d) => d.day <= cut && d.month !== cur;
    if (G.ledger.days.length && old(G.ledger.days[0])) {
      const A = G.ledger.archive = G.ledger.archive || { days: 0, revenue: 0, served: 0, tips: 0, byProduct: {} };
      G.ledger.days.filter(old).forEach((d) => { A.days++; A.revenue += d.revenue || 0; A.served += d.served || 0; A.tips += d.tips || 0; Object.entries(d.byProduct || {}).forEach(([k, v]) => { A.byProduct[k] = (A.byProduct[k] || 0) + v; }); });
      G.ledger.days = G.ledger.days.filter((d) => !old(d));
    }
    G.branches.forEach((b) => { if (b.history && b.history.length > 120) b.history = b.history.slice(-120); });
    if (G.news && G.news.length > 26) G.news = G.news.slice(0, 26);
    if (G.eventLog && G.eventLog.length > 400) G.eventLog = G.eventLog.slice(-400);
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
      return { id: b.id, name: b.name, district: /** @type {District} */ (KE.district(b)).name, sat, bar, won, served };
    });
  };
})();
