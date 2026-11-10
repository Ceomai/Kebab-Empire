import { describe, it, expect } from 'vitest';
import { loadGame, newGame, playDays } from './load.js';

describe('talebe göre sabah siparişi', () => {
  const files = [
    'data',
    'util',
    'calendar',
    'characters',
    'economy',
    'sim/rng',
    'sim/staff',
    'sim/branch',
    'sim/morning',
    'sim/service',
    'sim/player',
    'sim/close',
    'sim/replay',
    'midday',
    'progress',
    'farm',
    'narrative',
    'save',
    'verify'
  ];
  it('kampanya sabahı tahmini büyütür, eksik çıkar ve tamamlanınca kapanır', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    const b = G.branches[0];
    b.expHist = [100, 100, 100, 100];
    b.usage = Object.fromEntries(Object.keys(b.usage).map((k) => [k, 10]));
    Object.keys(b.usage).forEach((k) => {
      b.stock[k] = 10 * b.stockLevel;
    });
    const base = KE.forecastCustomers(G, b);
    b.expHist = [base, base, base, base];
    expect(KE.shortfall(G, b).items.length).toBe(0);
    G.mods.push({ key: 'traffic', mult: 1.4, days: 3, label: 'Kampanya' });
    expect(KE.demandFactor(G, b)).toBeGreaterThan(1.3);
    const sh = KE.shortfall(G, b);
    expect(sh.items.length).toBeGreaterThan(0);
    const cash = G.cash;
    const c = KE.topUpToday(G, b);
    expect(c).toBeCloseTo(sh.cost, 0);
    expect(G.cash).toBeCloseTo(cash - c, 0);
    expect(KE.shortfall(G, b).items.length).toBe(0);
  });
  it('kepenk açıldıktan sonra tamamlama yapılmaz', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    G.phase = 'service';
    expect(KE.topUpToday(G, G.branches[0])).toBe(0);
  });
  it('dolu kadro ipucu çıkarmayı da söyler', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    const b = G.branches[0];
    while (KE.canHire(G, b, 'kasiyer').ok) {
      const w = KE.randomWorker(G, 'kasiyer');
      w.branchId = b.id;
      G.staff.push(w);
    }
    expect(KE.canHire(G, b, 'kasiyer').hint).toMatch(/çıkar/);
  });
});

describe('sabah stok tahmini (kontrol listesi)', () => {
  const files = [
    'data',
    'util',
    'calendar',
    'characters',
    'economy',
    'sim/rng',
    'sim/staff',
    'sim/branch',
    'sim/morning',
    'sim/service',
    'sim/player',
    'sim/close',
    'sim/replay',
    'midday',
    'progress',
    'farm',
    'narrative',
    'save',
    'verify'
  ];
  it('ilk gün sabah siparişi tamam görünse de gerçekçi tahmin eksik bulur; bol stokla tamamdır; motor durumu değişmez', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    const b = G.branches[0];
    expect(KE.shortfall(G, b).items.length).toBe(0);
    const before = JSON.stringify(G);
    const f = KE.stockForecast(G, b);
    expect(JSON.stringify(G)).toBe(before);
    expect(f.ok).toBe(false);
    expect(f.short[0].outHour).toBeGreaterThanOrEqual(KE.OPEN_HOUR);
    expect(f.short[0].outHour).toBeLessThan(KE.CLOSE_HOUR);
    expect(f.top).toBeTruthy();
    Object.keys(b.stock).forEach((k) => {
      b.stock[k] = 1e6;
    });
    expect(KE.stockForecast(G, b).ok).toBe(true);
  });
  it('dünkü en çok satan ürün karışımı belirler', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    const b = G.branches[0];
    const p = KE.MODES[G.mode].products[1];
    G.lastSummary = { day: G.day - 1, branches: { [b.id]: { stats: { byProduct: { [p.id]: 50 } } } } };
    expect(KE.stockForecast(G, b).top).toBe(p.id);
  });
  const hist = (G, b, rows) => {
    G.ledger.days = rows.map(([day, byProduct]) => ({ day, branchId: b.id, byProduct }));
  };
  it('ortak malzeme: lavaş, onu kullanan bütün ürünlerin porsiyonlarından toplanır', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    const b = G.branches[0],
      M = KE.MODES[G.mode];
    const f = KE.stockForecast(G, b);
    const users = M.products.filter((p) => f.products[p.id] > 0 && p.ing.lavas);
    expect(users.length).toBeGreaterThan(1);
    const need = (k) => f.items.find((x) => x.k === k).need;
    const sum = (k) =>
      M.products.reduce((a, p) => a + (f.products[p.id] || 0) * (p.ing[k] || 0), 0) + f.drinks * (M.drink.ing[k] || 0);
    ['lavas', 'et', 'tavuk', 'sebze', 'ayran'].forEach((k) => expect(need(k)).toBeCloseTo(sum(k), 6));
    /* tek bir ürüne yetecek kadar lavaş varsa bile hepsine yetmez: eksik çıkar */
    Object.keys(b.stock).forEach((k) => {
      b.stock[k] = 1e6;
    });
    b.stock.lavas = Math.max(...users.map((p) => f.products[p.id])) * 1.1;
    const g = KE.stockForecast(G, b);
    expect(g.short.map((x) => x.k)).toEqual(['lavas']);
  });
  it('ürün karışımı son 7 günün satışından gelir; daha eski günler ve tek bir dün yanıltmaz', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    const b = G.branches[0],
      P = KE.MODES[G.mode].products;
    G.day = 20;
    const a = P[3].id,
      c = P[0].id; // iskender, tavuk dürüm
    /* son 7 gün iskender ağırlıklı; dün (lastSummary) ve 8+ gün önce tavuk dürüm */
    hist(
      G,
      b,
      [
        [10, { [c]: 900 }],
        [11, { [c]: 900 }],
        [12, { [c]: 900 }]
      ]
        .concat([13, 14, 15, 16, 17, 18].map((d) => [d, { [a]: 80, [c]: 10 }]))
        .concat([[19, { [c]: 60, [a]: 20 }]])
    );
    G.lastSummary = { day: 19, branches: { [b.id]: { stats: { byProduct: { [c]: 60, [a]: 20 } } } } };
    expect(KE.stockForecast(G, b).top).toBe(a);
    /* geçmiş yoksa düne bakar */
    G.ledger.days = [];
    expect(KE.stockForecast(G, b).top).toBe(c);
  });
  it('akşam payı: kapanışa yetecek kadar stok sınırda ise uyarı akşam saatine düşer, payı sıfırlayınca kalkar', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    const b = G.branches[0];
    expect(KE.STOCK_EVENING).toBeGreaterThan(0.05);
    const Z = KE.STOCK_Z;
    KE.STOCK_Z = 0; // yalnızca akşam payını sına
    const f = KE.stockForecast(G, b);
    f.items.forEach((x) => {
      b.stock[x.k] = x.need * KE.STOCK_SAFETY * 1.03;
    });
    const g = KE.stockForecast(G, b);
    expect(g.ok).toBe(false);
    expect(g.short[0].outHour).toBeGreaterThanOrEqual(18);
    const E = KE.STOCK_EVENING;
    KE.STOCK_EVENING = 0;
    expect(KE.stockForecast(G, b).ok).toBe(true);
    KE.STOCK_EVENING = E;
    KE.STOCK_Z = Z;
  });
  it('salt okur: durum değişmez, zar atılmaz (oyun sonucu etkilenmez)', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    playDays(KE, G, 3);
    const r0 = KE.rand;
    let n = 0;
    KE.rand = () => {
      n++;
      return r0();
    };
    const before = JSON.stringify(G);
    G.branches.forEach((b) => KE.stockForecast(G, b));
    expect(JSON.stringify(G)).toBe(before);
    expect(n).toBe(0);
    KE.rand = r0;
  });
  it('bugünün kampanyası müşteri sayısını ve ürün karışımını tip ağırlıklarından değiştirir', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    const b = G.branches[0];
    const base = KE.stockForecast(G, b);
    G.mods.push({ key: 'type:gurme', mult: 6, days: 3, label: 'Blog' });
    G.mods.push({ key: 'traffic', mult: 1.3, days: 3, label: 'Kampanya' });
    const f = KE.stockForecast(G, b);
    const tot = (x) => Object.values(x.products).reduce((a, v) => a + v, 0);
    expect(tot(f)).toBeGreaterThan(tot(base) * 1.2);
    expect(f.products.iskender / tot(f)).toBeGreaterThan(base.products.iskender / tot(base));
  });
});
