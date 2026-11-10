/* Kebab Empire — besi çiftliği */
(function () {
  const { clamp } = KE.U;
  KE.farmKinds = (G) => Object.keys(KE.FARM).filter((k) => !KE.FARM[k].modes || KE.FARM[k].modes.includes(G.mode));
  KE.farmCost = (G) => Math.round(KE.FARM_COST * G.priceIndex / 1000) * 1000;
  KE.buyFarm = function (G) {
    const cost = KE.farmCost(G);
    G.cash -= cost; KE.addExtra(G, 'capex', cost);
    G.farm = { pens: {}, store: {}, auto: true, bonus: {}, shipped: 0, opened: G.day };
    KE.farmKinds(G).forEach((k) => { /** @type {FarmState} */ (G.farm).pens[k] = { level: 0, batches: [] }; });
  };
  KE.penHeads = (pen) => pen.batches.reduce((a, x) => a + x.count, 0);
  KE.penCap = (kind, pen) => KE.FARM[kind].caps[pen.level];
  KE.animalPrice = (G, kind) => Math.round(KE.FARM[kind].young * G.priceIndex);
  KE.buyAnimals = function (G, kind) {
    const F = KE.FARM[kind], pen = /** @type {FarmState} */ (G.farm).pens[kind];
    const n = Math.min(F.batch, KE.penCap(kind, pen) - KE.penHeads(pen));
    if (n <= 0) return 0;
    const cost = KE.animalPrice(G, kind) * n;
    G.cash -= cost; KE.addExtra(G, 'farm', cost);
    pen.batches.push({ count: n, age: 0 });
    return cost;
  };
  KE.upgradePen = function (G, kind) {
    const pen = /** @type {FarmState} */ (G.farm).pens[kind];
    const cost = Math.round(KE.FARM[kind].upCost[pen.level + 1] * G.priceIndex);
    G.cash -= cost; KE.addExtra(G, 'capex', cost);
    pen.level += 1;
  };
  KE.batchYield = function (G, kind, count) {
    const y = KE.FARM[kind].yield[G.mode] || {};
    /** @type {Record<string, number>} */
    const out = {};
    Object.entries(y).forEach(([k, v]) => { out[k] = v * count; });
    return out;
  };
  KE.slaughter = function (G, kind) {
    const pen = /** @type {FarmState} */ (G.farm).pens[kind];
    const F = KE.FARM[kind];
    const ready = pen.batches.filter((x) => x.age >= F.days);
    let heads = 0;
    /** @type {Record<string, number>} */
    const got = {};
    ready.forEach((x) => {
      heads += x.count;
      Object.entries(KE.batchYield(G, kind, x.count)).forEach(([k, v]) => { /** @type {FarmState} */ (G.farm).store[k] = (/** @type {FarmState} */ (G.farm).store[k] || 0) + v; got[k] = (got[k] || 0) + v; });
    });
    pen.batches = pen.batches.filter((x) => x.age < F.days);
    return { heads, got };
  };
  /* Gün sonunda: yem, büyüme, otomatik kesim ve yeniden alım */
  KE.farmDay = function (G) {
    if (!G.farm) return null;
    let feed = 0;
    /** @type {any[]} */
    const done = [];
    KE.farmKinds(G).forEach((kind) => {
      const pen = /** @type {FarmState} */ (G.farm).pens[kind], F = KE.FARM[kind];
      pen.batches.forEach((x) => { x.age += 1; feed += x.count * F.feed * G.priceIndex; });
      if (/** @type {FarmState} */ (G.farm).auto) {
        const r = KE.slaughter(G, kind);
        if (r.heads) done.push({ kind, heads: r.heads, got: r.got });
        /* talebe göre alım: depodaki + yetişmekte olan et, (büyüme süresi + 2) günlük talebi karşılamıyorsa yeni parti al */
        const y = KE.batchYield(G, kind, 1);
        let guard = 0;
        while (guard++ < 30 && KE.penHeads(pen) + F.batch <= KE.penCap(kind, pen) && G.cash > 250000) {
          const main = Object.keys(y).sort((a, c) => y[c] - y[a])[0];
          const short = [main].some((k) => {
            const demand = G.branches.reduce((a, b) => a + (b.usage[k] || 0), 0);
            const pipe = (/** @type {FarmState} */ (G.farm).store[k] || 0) + pen.batches.reduce((a, x) => a + x.count * y[k], 0);
            return pipe < demand * (F.days + 2);
          });
          if (!short) break;
          KE.buyAnimals(G, kind);
        }
      }
    });
    G.cash -= feed; KE.addExtra(G, 'farm', feed);
    return { feed, done };
  };
  KE.farmCostPerKg = function (G, kind) {
    const F = KE.FARM[kind];
    const y = Object.values(F.yield[G.mode] || {}).reduce((a, v) => a + v, 0);
    return y ? (F.young + F.feed * F.days) * G.priceIndex / y : 0;
  };
})();
