/* Kebab Empire — simülasyon motoru (4/8): sabah
   Müdürlü şubenin sabah ayarı, talep tahmini, stok tamamlama (çiftlik sevkiyatı dahil), sabah hazırlığı ve günün hedefleri. */
(function () {
  const MODE = KE.U.mode;
  /* ---------- Sabah: çiftlikten sevkiyat ve stok tamamlama ---------- */
  /* Müdürlü şube kendi sabah ayarını yapar: stok seviyesi dünkü bitenlere ve fireye, fiyatlar haftada bir piyasaya göre */
  KE.isManaged = (G, b) => b.managed !== false && KE.branchStaff(G, b).some((s) => s.role === 'mudur');
  function manage(/** @type {Game} */ G, /** @type {Branch} */ b) {
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
    /** @type {number[]} */
    const h = (b.expHist || []).slice(0, -1);
    if (h.length < 2) return 1;
    const avg = h.reduce((a, x) => a + x, 0) / h.length;
    return avg > 0 ? Math.round(Math.max(0.85, Math.min(1.6, KE.forecastCustomers(G, b) / avg)) * 100) / 100 : 1;
  };
  KE.stockNeed = (G, b, k, f) => (b.usage[k] || 0) * b.stockLevel * (f == null ? KE.demandFactor(G, b) : f);
  function fillStock(/** @type {Game} */ G, /** @type {Branch} */ b, /** @type {number | undefined} */ f) {
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
    let cost = 0; const items = /** @type {string[]} */ ([]);
    Object.keys(b.usage).forEach((k) => { const q = KE.stockNeed(G, b, k, f) - (b.stock[k] || 0); if (q > 0.01) { items.push(k); cost += q * KE.ingPrice(G, b, k); } });
    return { cost, items, factor: f };
  };
  /* Sabah kontrol listesi için gerçekçi stok tahmini (motoru değiştirmez, zar atmaz; yalnızca okur).
     Saat saat: gelen grup sayısı (servisin geliş hızı, özel günün saatleri) × o saatin müşteri tipleri (KE.typeWeights:
     hafta sonu, özel gün, kampanya/olay çarpanları) × tiplerin ürün olasılığı (KE.productOdds) × grup büyüklüğü.
     Ürün karışımı son 7 günün gerçek satışına göre düzeltilir (yoksa dün, o da yoksa yalnızca model).
     Her malzeme, onu kullanan bütün ürünlerin reçetesinden (p.ing) toplanır; ayran gibi içecek de eklenir.
     Birikmiş ihtiyaç × güvenlik payı stoğu aştığı saat bitiş saatidir; pay akşama doğru büyür (geç bitişler daha çok kaçıyordu). */
  /* Paylar: "Dengeli" ayar (kullanıcı seçimi; hedef: biten günlerin ~%75'i uyarılsın, stok bitmeyen günlerde yanlış alarm ~%40).
     6 tohum × 2 mod × 1/3 şube, 3240 şube-günü; 3/7/11 tohumlarında tarandı, 19/23/31'de doğrulandı.
     Ölçülen (6 tohum): biten günlerde uyarı %76,1 (döner %71,3, kebap %80,5; 17:00 sonrası bitişler %75,3),
     bitmeyen günlerde yanlış alarm %40,9, doğru malzeme %62,2 (held-out 19/23/31: %76,3 / %42,1). Önceki ayar (akşam 0,07, Z 1,75) %87,3 yakalıyor ama yanlış alarm %54,3'tü. */
  KE.STOCK_SAFETY = 1.0;
  KE.STOCK_EVENING = 0.11; // kapanışa doğru eklenen pay (15:00'ten 23:00'e doğrusal)
  KE.STOCK_EVENING_FROM = 15;
  KE.STOCK_HIST_DAYS = 7;
  KE.STOCK_Z = 1.25; // Poisson sapması katsayısı (az satılan malzemede güvenlik payı)
  KE.STOCK_CONV = 0.8; // geçmiş yoksa gelenin yiyen payı (ölçülen ortalama)
  KE.stockForecast = function (G, b) {
    const M = MODE(G), C = KE.HOUR_CURVE;
    const on = M.products.filter((p) => KE.canMake(G, b, p));
    const hours = Object.keys(C).map(Number).sort((a, c) => a - c);
    const cSum = Object.values(C).reduce((a, v) => a + v, 0);
    const types = Object.keys(KE.CUSTOMER_TYPES);
    const odds = /** @type {Record<string, NumMap>} */ ({}); types.forEach((t) => { odds[t] = KE.productOdds(G, b, t); });
    /* bir gün için saat saat ürün başına porsiyon (grup başına değil, gelen müşteri hızı × karışım) */
    /* saat başına grup başı porsiyon karışımı; yalnızca hafta sonu ve özel güne bağlı olduğundan önbelleklenir */
    /** @type {Record<string, NumMap>} */
    const memo = {};
    const mixAt = (/** @type {number} */ h, /** @type {number} */ day, /** @type {SpecialDay | null} */ sp) => {
      const key = h + '|' + KE.isWeekend(day) + '|' + (sp ? sp.id : '');
      if (memo[key]) return memo[key];
      const tw = KE.typeWeights(G, b, h, day), tot = tw.reduce((a, x) => a + x[1], 0) || 1, out = /** @type {NumMap} */ ({});
      on.forEach((p) => { out[p.id] = 0; });
      tw.forEach(([t, w]) => { const n = w / tot * KE.groupMean(t); on.forEach((p) => { out[p.id] += n * (odds[t][p.id] || 0); }); });
      return (memo[key] = out);
    };
    const model = (/** @type {number} */ day, /** @type {number} */ groups) => {
      const sp = KE.specialDay(day);
      return hours.map((h) => {
        const g = groups * C[h] * (sp && sp.hours && sp.hours[h] ? sp.hours[h] : 1) / cSum, mx = mixAt(h, day, sp), out = /** @type {NumMap} */ ({});
        on.forEach((p) => { out[p.id] = g * mx[p.id]; });
        return out;
      });
    };
    const share = (/** @type {NumMap[]} */ rows) => { const s = /** @type {NumMap} */ ({}); let t = 0; on.forEach((p) => { s[p.id] = rows.reduce((a, r) => a + (r[p.id] || 0), 0); t += s[p.id]; }); on.forEach((p) => { s[p.id] = t ? s[p.id] / t : 0; }); return { s, t }; };
    /* son 7 günün satışları (gün satırları şube başına; ayrıntısı arşive katlanmış satır varsa atlanır) */
    const rows = G.ledger.days.filter((d) => d.branchId === b.id && d.day < G.day && d.day >= G.day - KE.STOCK_HIST_DAYS && d.byProduct);
    let hist = share(rows.map((d) => d.byProduct)), ref = /** @type {{ s: NumMap; t: number } | null} */ (null);
    if (hist.t >= 20) ref = share(rows.map((d) => share(model(d.day, 1)).s));
    else {
      const sum = G.lastSummary && G.lastSummary.branches && G.lastSummary.branches[b.id];
      hist = share([(sum && sum.stats && sum.stats.byProduct) || {}]);
      if (hist.t >= 20) ref = share([share(model(G.day - 1, 1)).s]);
    }
    const res = KE.resOn && KE.resOn(b) ? 0.97 : 1;
    const today = model(G.day, KE.expectedCustomers(G, b) * res);
    /* geçmiş karışım / modelin o günler için beklediği karışım: modelin göremediği tercihleri (fiyat, alışkanlık) taşır */
    /** @type {NumMap} */
    const adj = {};
    on.forEach((p) => { adj[p.id] = ref && ref.s[p.id] > 0 ? Math.max(0.4, Math.min(2.5, hist.s[p.id] / ref.s[p.id])) : 1; });
    /* düzeltme yalnızca karışımı değiştirir, toplam porsiyonu değil */
    const ts = share(today).s, norm = on.reduce((a, p) => a + ts[p.id] * adj[p.id], 0) || 1;
    on.forEach((p) => { adj[p.id] /= norm; });
    /* gelenin ne kadarı gerçekten yiyor (fiyat, kuyruk, dolu masa kaçırır): stok bitmeyen son günlerin servis/geliş oranı */
    const clean = rows.filter((d) => d.arrivals > 0 && !Object.keys(d.stockouts || {}).length);
    const arr = clean.reduce((a, d) => a + d.arrivals, 0);
    const conv = arr >= 30 ? Math.max(0.5, Math.min(1, clean.reduce((a, d) => a + d.served, 0) / arr)) : KE.STOCK_CONV;
    /* paket siparişi: kuryeli şubede gün boyu eşit dağılan ürünler */
    const kur = KE.branchStaff(G, b).filter((s) => s.role === 'kurye').length;
    const paket = kur ? KE.expectedCustomers(G, b) * 0.16 * (0.6 + G.reputation / 100) * Math.min(1.6, 0.8 + kur * 0.4) : 0;
    const byHour = today.map((o, i) => {
      const r = /** @type {NumMap} */ ({}); let n = 0;
      on.forEach((p) => { const w = o[p.id] * adj[p.id] * conv; r[p.id] = w + paket * C[hours[i]] / cSum / (on.length || 1); n += w; });
      return { r, drinks: n * M.drinkRate };
    });
    const tot = /** @type {NumMap} */ ({}); on.forEach((p) => { tot[p.id] = byHour.reduce((a, x) => a + x.r[p.id], 0); });
    const top = on.slice().sort((a, c) => tot[c.id] - tot[a.id])[0];
    /** @type {{ k: string; need: number; have: number; outHour: number | null; risk: number; hourly: number[]; hourlyVar: number[] }[]} */
    const items = [];
    Object.keys(b.usage).forEach((k) => {
      const have = b.stock[k] || 0;
      const per = byHour.map((x) => on.reduce((a, p) => a + x.r[p.id] * (p.ing[k] || 0), 0) + x.drinks * (M.drink.ing[k] || 0));
      /* sayım belirsizliği: az satılan malzemede göreli sapma büyük (porsiyon sayısı ~ Poisson) */
      const vr = byHour.map((x) => on.reduce((a, p) => a + x.r[p.id] * (p.ing[k] || 0) ** 2, 0) + x.drinks * (M.drink.ing[k] || 0) ** 2);
      const need = per.reduce((a, x) => a + x, 0);
      if (need <= 0) return;
      let acc = 0, av = 0, outHour = null, risk = 0;
      for (let i = 0; i < hours.length; i++) {
        acc += per[i]; av += vr[i];
        const m = KE.STOCK_SAFETY * (1 + KE.STOCK_EVENING * Math.max(0, (hours[i] + 1 - KE.STOCK_EVENING_FROM) / (KE.CLOSE_HOUR - KE.STOCK_EVENING_FROM)));
        const want = acc * m + KE.STOCK_Z * Math.sqrt(av);
        if (want > have + 1e-9) { outHour = hours[i]; risk = want / (have || 1e-9); break; }
      }
      items.push({ k, need, have, outHour, risk, hourly: per, hourlyVar: vr });
    });
    const short = items.filter((x) => x.outHour != null).sort((a, c) => a.outHour - c.outHour || c.risk - a.risk);
    return { customers: KE.forecastCustomers(G, b), top: top ? top.id : null, products: tot, drinks: byHour.reduce((a, x) => a + x.drinks, 0), items, short, ok: !short.length };
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
    /** @type {{ kind: string; target: number; text: (t: number) => string }[]} */
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
  function dailyTotals(/** @type {Game} */ G) {
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
    return (G.daily || []).map((/** @type {any} */ g) => {
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
})();
