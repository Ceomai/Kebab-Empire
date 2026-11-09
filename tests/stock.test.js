import { describe, it, expect } from 'vitest';
import { loadGame, newGame } from './load.js';

describe('talebe göre sabah siparişi', () => {
  const files = ['data', 'calendar', 'characters', 'economy', 'sim', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify'];
  it('kampanya sabahı tahmini büyütür, eksik çıkar ve tamamlanınca kapanır', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    const b = G.branches[0];
    b.expHist = [100, 100, 100, 100];
    b.usage = Object.fromEntries(Object.keys(b.usage).map((k) => [k, 10]));
    Object.keys(b.usage).forEach((k) => { b.stock[k] = 10 * b.stockLevel; });
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
    while (KE.canHire(G, b, 'kasiyer').ok) { const w = KE.randomWorker(G, 'kasiyer'); w.branchId = b.id; G.staff.push(w); }
    expect(KE.canHire(G, b, 'kasiyer').hint).toMatch(/çıkar/);
  });
});

describe('sabah stok tahmini (kontrol listesi)', () => {
  const files = ['data', 'calendar', 'characters', 'economy', 'sim', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify'];
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
    Object.keys(b.stock).forEach((k) => { b.stock[k] = 1e6; });
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
});
