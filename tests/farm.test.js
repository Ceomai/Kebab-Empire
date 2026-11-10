import { describe, it, expect } from 'vitest';
import { loadGame, newGame } from './load.js';

describe('besi çiftliği (js/farm.js)', () => {
  it('çiftlik almak bedeli kasadan düşer, yatırım olarak yazar ve moda göre ağılları açar', () => {
    const { KE } = loadGame();
    const G = newGame(KE);
    const cash0 = G.cash, cost = KE.farmCost(G);
    KE.buyFarm(G);
    expect(G.cash).toBe(cash0 - cost);
    expect(G.monthExtras.capex).toBe(cost);
    expect(Object.keys(G.farm.pens).sort()).toEqual(['dana', 'kuzu', 'tavuk']);
    expect(G.farm.opened).toBe(G.day);
    const K = newGame(KE, 'kebap');
    KE.buyFarm(K);
    expect(Object.keys(K.farm.pens).sort()).toEqual(['dana', 'kuzu']);
  });
  it('hayvan alımı ağıl kapasitesiyle sınırlı', () => {
    const { KE } = loadGame();
    const G = newGame(KE);
    KE.buyFarm(G);
    const pen = G.farm.pens.tavuk, F = KE.FARM.tavuk;
    let n = 0;
    while (KE.buyAnimals(G, 'tavuk') > 0 && n < 100) n++;
    expect(KE.penHeads(pen)).toBe(F.caps[0]);
    expect(n).toBe(F.caps[0] / F.batch);
    KE.upgradePen(G, 'tavuk');
    expect(KE.penCap('tavuk', pen)).toBe(F.caps[1]);
  });
  it('kesim yalnızca büyümesini tamamlamış partileri alır ve verimi depoya koyar', () => {
    const { KE } = loadGame();
    const G = newGame(KE);
    KE.buyFarm(G);
    const F = KE.FARM.dana, pen = G.farm.pens.dana;
    pen.batches = [{ count: 2, age: F.days }, { count: 1, age: F.days - 1 }, { count: 3, age: F.days + 5 }];
    const r = KE.slaughter(G, 'dana');
    expect(r.heads).toBe(5);
    expect(r.got).toEqual({ et: 5 * F.yield.doner.et });
    expect(G.farm.store.et).toBe(5 * F.yield.doner.et);
    expect(pen.batches).toEqual([{ count: 1, age: F.days - 1 }]);
    expect(KE.slaughter(G, 'dana')).toEqual({ heads: 0, got: {} });
  });
  it('gün sonu: hayvanlar büyür, yem parası düşer; otomatik kapalıyken kesim olmaz', () => {
    const { KE } = loadGame();
    const G = newGame(KE);
    KE.buyFarm(G);
    G.farm.auto = false;
    const F = KE.FARM.kuzu;
    G.farm.pens.kuzu.batches = [{ count: 4, age: F.days - 1 }];
    const cash0 = G.cash, extra0 = G.monthExtras.farm || 0;
    const r = KE.farmDay(G);
    const feed = 4 * F.feed * G.priceIndex;
    expect(r.feed).toBeCloseTo(feed, 6);
    expect(r.done).toEqual([]);
    expect(G.cash).toBeCloseTo(cash0 - feed, 6);
    expect(G.monthExtras.farm).toBeCloseTo(extra0 + feed, 6);
    expect(G.farm.pens.kuzu.batches[0].age).toBe(F.days);
  });
  it('gün sonu otomatik: olgun parti kesilir ve rapora yazılır', () => {
    const { KE } = loadGame();
    const G = newGame(KE);
    KE.buyFarm(G);
    G.cash = 0; /* yeniden alım yapılmasın */
    const F = KE.FARM.kuzu;
    G.farm.pens.kuzu.batches = [{ count: 3, age: F.days - 1 }];
    const r = KE.farmDay(G);
    expect(r.done).toEqual([{ kind: 'kuzu', heads: 3, got: { kuzu: 3 * F.yield.doner.kuzu } }]);
    expect(G.farm.pens.kuzu.batches).toEqual([]);
  });
  it('çiftliği olmayan oyunda gün sonu adımı hiçbir şey yapmaz', () => {
    const { KE } = loadGame();
    const G = newGame(KE);
    const cash0 = G.cash;
    expect(KE.farmDay(G)).toBeNull();
    expect(G.cash).toBe(cash0);
  });
  it('çiftlik varsa ay sonunda sabit gider yazılır', () => {
    const { KE } = loadGame();
    const G = newGame(KE);
    KE.buyFarm(G);
    let d = G.day; while (!KE.isMonthEnd(d)) d++;
    const r = KE.closeMonth(G, d);
    expect(r.farmFixed).toBe(Math.round(KE.FARM_MONTHLY * 1));
    expect(r.capex).toBe(KE.farmCost({ priceIndex: 1 }));
  });
});
