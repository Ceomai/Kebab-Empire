import { describe, it, expect } from 'vitest';
import { loadGame, newGame } from './load.js';

/* Ay sonu kapanışı, bahşiş paylaşımı, semt şampiyonluğu ve defter sıkıştırma */
const monthEnd = (KE, from) => { let d = from; while (!KE.isMonthEnd(d)) d++; return d; };
const row = (KE, day, branchId, o = {}) => Object.assign({ day, month: KE.monthKey(day), branchId, revenue: 10000, purchases: 3000, tips: 200, served: 100, sat: 80, byProduct: { et_durum: 10 } }, o);

describe('ay sonu kapanışı (KE.closeMonth)', () => {
  it('maaşları, kirayı, faturaları ve kredi taksitlerini kasadan düşer', () => {
    const { KE } = loadGame();
    const G = newGame(KE);
    const day = monthEnd(KE, G.day);
    G.day = day;
    G.ledger.days = [row(KE, day - 1, 'b1'), row(KE, day, 'b1')];
    G.loans = [{ amount: 300000, monthly: 12000, remaining: 5 }, { amount: 100000, monthly: 4000, remaining: 1 }];
    const monthNo = KE.dateOf(day).getUTCMonth() + 1;
    const bonus = !!KE.bonusMonths[KE.monthKey(day)];
    const expectedPersonnel = G.staff.reduce((a, s) => a + KE.payroll(G, s, monthNo, { bonus }).total, 0);
    const cash0 = G.cash, pi0 = G.priceIndex;
    const r = KE.closeMonth(G, day);
    expect(r.personnel).toBeCloseTo(expectedPersonnel, 6);
    expect(r.payroll.length).toBe(G.staff.length);
    expect(r.loan).toBe(16000);
    expect(r.rent).toBe(G.branches[0].rent);
    expect(r.revenue).toBe(20000);
    expect(r.customers).toBe(200);
    const opex = r.personnel + r.rent + r.util + r.accountant + r.kdv + r.loan + r.farmFixed;
    expect(G.cash).toBeCloseTo(cash0 - opex, 6);
    expect(G.ledger.months.at(-1)).toBe(r);
    expect(G.priceIndex).toBeGreaterThan(pi0);
    expect(G.monthExtras).toEqual({ ads: 0, capex: 0, fines: 0, other: 0, farm: 0 });
  });
  it('kredi taksiti bir azalır; kalan 0 olan kredi listeden düşer ve bir daha tahsil edilmez', () => {
    const { KE } = loadGame();
    const G = newGame(KE);
    let day = monthEnd(KE, G.day);
    G.loans = [{ amount: 300000, monthly: 12000, remaining: 2 }, { amount: 100000, monthly: 4000, remaining: 1 }];
    KE.closeMonth(G, day);
    expect(G.loans).toEqual([{ amount: 300000, monthly: 12000, remaining: 1 }]);
    day = monthEnd(KE, day + 1);
    const r2 = KE.closeMonth(G, day);
    expect(r2.loan).toBe(12000);
    expect(G.loans).toEqual([]);
    day = monthEnd(KE, day + 1);
    expect(KE.closeMonth(G, day).loan).toBe(0);
  });
  it('kalan taksiti 0 olan (bozuk) kredi tahsil edilmez ve temizlenir', () => {
    const { KE } = loadGame();
    const G = newGame(KE);
    G.loans = [{ amount: 1, monthly: 9999, remaining: 0 }];
    expect(KE.closeMonth(G, monthEnd(KE, G.day)).loan).toBe(0);
    expect(G.loans).toEqual([]);
  });
  it('ayın bahşiş sayaçları sıfırlanır, maaş matrahı birikir', () => {
    const { KE } = loadGame();
    const G = newGame(KE);
    G.staff.forEach((s) => { s.tipsMonth = 500; });
    KE.closeMonth(G, monthEnd(KE, G.day));
    G.staff.forEach((s) => { expect(s.tipsMonth).toBe(0); expect(s.cumBase).toBeGreaterThan(0); });
  });
});

describe('bahşiş paylaşımı (KE.tipShares)', () => {
  const setup = () => {
    const { KE } = loadGame();
    const G = newGame(KE);
    const b = G.branches[0];
    /* usta, çırak, kasiyer, garson */
    G.staff.forEach((s, i) => { s.servedToday = [30, 0, 10, 60][i]; });
    return { KE, G, b, share: (rule, jar) => KE.tipShares(G, b, rule, jar).map(([s, v]) => [s.role, v]) };
  };
  it('eşit: herkes aynı payı alır, toplam kavanoza eşittir', () => {
    const { share } = setup();
    const r = share('esit', 1000);
    expect(r.map((x) => x[1])).toEqual([250, 250, 250, 250]);
  });
  it('ustaya ağırlık: usta iki pay alır', () => {
    const { share } = setup();
    const r = Object.fromEntries(share('usta', 1000));
    expect(r.usta).toBeCloseTo(400, 6);
    expect(r.cirak).toBeCloseTo(200, 6);
    expect(r.kasiyer).toBeCloseTo(200, 6);
    expect(r.garson).toBeCloseTo(200, 6);
  });
  it('performans: hizmet sayısıyla orantılı, hiç iş yapmayan en az 0,2 ağırlık alır', () => {
    const { share } = setup();
    const r = Object.fromEntries(share('performans', 1000));
    const tot = 30 + 0.2 + 10 + 60;
    expect(r.usta).toBeCloseTo(1000 * 30 / tot, 6);
    expect(r.cirak).toBeCloseTo(1000 * 0.2 / tot, 6);
    expect(r.garson).toBeCloseTo(1000 * 60 / tot, 6);
    expect(Object.values(r).reduce((a, v) => a + v, 0)).toBeCloseTo(1000, 6);
  });
  it('kasaya al: kimse pay almaz', () => {
    const { share } = setup();
    expect(share('kasa', 1000).map((x) => x[1])).toEqual([0, 0, 0, 0]);
  });
  it('şubede ekip yoksa boş liste döner', () => {
    const { KE, G, b } = setup();
    G.staff = [];
    expect(KE.tipShares(G, b, 'esit', 1000)).toEqual([]);
  });
});

describe('semt şampiyonluğu (KE.championship)', () => {
  const setup = (rows) => {
    const { KE } = loadGame();
    const G = newGame(KE);
    G.day = monthEnd(KE, G.day);
    G.ledger.days = rows(KE, G.day);
    return { KE, G };
  };
  it('yeterli müşteri ve çıtayı geçen memnuniyet şampiyonluk getirir', () => {
    const { KE, G } = setup((KE, d) => [row(KE, d - 1, 'b1', { served: 150, sat: 95 }), row(KE, d, 'b1', { served: 150, sat: 95 })]);
    const rep0 = G.reputation;
    const [r] = KE.championship(G);
    expect(r.won).toBe(true);
    expect(r.served).toBe(300);
    expect(r.sat).toBeCloseTo(95, 6);
    expect(G.branches[0].championUntil).toBe(G.day + 30);
    expect(G.branches[0].champions).toBe(1);
    expect(G.flags.champ).toBe(true);
    expect(G.reputation).toBe(rep0 + 1);
  });
  it('250 müşterinin altında kazanılmaz', () => {
    const { KE, G } = setup((KE, d) => [row(KE, d, 'b1', { served: 249, sat: 99 })]);
    expect(KE.championship(G)[0].won).toBe(false);
    expect(G.branches[0].champions).toBeUndefined();
  });
  it('çıtanın altındaki memnuniyetle kazanılmaz; müşteri ağırlıklı ortalama kullanılır', () => {
    const { KE, G } = setup((KE, d) => [row(KE, d - 1, 'b1', { served: 290, sat: 50 }), row(KE, d, 'b1', { served: 10, sat: 100 })]);
    const [r] = KE.championship(G);
    expect(r.sat).toBeCloseTo((290 * 50 + 10 * 100) / 300, 6);
    expect(r.won).toBe(false);
  });
  it('geçen ayın satırları sayılmaz', () => {
    const { KE, G } = setup((KE, d) => [row(KE, d, 'b1', { served: 100, sat: 95, month: '1999-01' }), row(KE, d, 'b1', { served: 200, sat: 95 })]);
    const [r] = KE.championship(G);
    expect(r.served).toBe(200);
    expect(r.won).toBe(false);
  });
  it('itibar 100\'ü geçmez', () => {
    const { KE, G } = setup((KE, d) => [row(KE, d, 'b1', { served: 300, sat: 99 })]);
    G.reputation = 100;
    KE.championship(G);
    expect(G.reputation).toBe(100);
  });
});

describe('defter sıkıştırma (KE.compactLedger)', () => {
  const setup = () => { const { KE } = loadGame(); const G = newGame(KE); return { KE, G }; };
  it('boş defterde arşiv açmaz', () => {
    const { KE, G } = setup();
    G.day = 400; G.ledger.days = [];
    KE.compactLedger(G);
    expect(G.ledger.archive).toBeUndefined();
    expect(G.ledger.days).toEqual([]);
  });
  it('en eski satır yeni ise hiçbir şeye dokunmaz', () => {
    const { KE, G } = setup();
    G.day = 100;
    G.ledger.days = [row(KE, 100 - KE.LEDGER_KEEP + 1, 'b1'), row(KE, 100, 'b1')];
    KE.compactLedger(G);
    expect(G.ledger.days.length).toBe(2);
    expect(G.ledger.archive).toBeUndefined();
  });
  it('tam sınırdaki gün (day = bugün − 84) arşive katlanır, toplamlar ve ürün sayıları korunur', () => {
    const { KE, G } = setup();
    G.day = 200;
    const cut = 200 - KE.LEDGER_KEEP;
    G.ledger.days = [row(KE, cut - 1, 'b1', { revenue: 100, served: 5, tips: 1, byProduct: { a: 2 } }), row(KE, cut, 'b1', { revenue: 50, served: 3, tips: 2, byProduct: { a: 1, b: 4 } }), row(KE, cut + 1, 'b1')];
    KE.compactLedger(G);
    expect(G.ledger.days.map((d) => d.day)).toEqual([cut + 1]);
    expect(G.ledger.archive).toEqual({ days: 2, revenue: 150, served: 8, tips: 3, byProduct: { a: 3, b: 4 } });
  });
  it('içinde bulunulan aya ait satırlar eski olsa da tutulur', () => {
    const { KE, G } = setup();
    G.day = 200;
    G.ledger.days = [row(KE, 9, 'b1'), row(KE, 10, 'b1', { month: KE.monthKey(200) })];
    KE.compactLedger(G);
    expect(G.ledger.days.map((d) => d.day)).toEqual([10]);
    expect(G.ledger.archive.days).toBe(1);
  });
  it('var olan arşive ekler; ikinci çağrı bir şey değiştirmez; eksik alanlar 0 sayılır', () => {
    const { KE, G } = setup();
    G.day = 300;
    G.ledger.archive = { days: 10, revenue: 1000, served: 50, tips: 5, byProduct: { a: 1 } };
    G.ledger.days = [{ day: 1, month: KE.monthKey(1), branchId: 'b1' }, row(KE, 299, 'b1')];
    KE.compactLedger(G);
    const snap = JSON.stringify(G.ledger);
    expect(G.ledger.archive).toEqual({ days: 11, revenue: 1000, served: 50, tips: 5, byProduct: { a: 1 } });
    KE.compactLedger(G);
    expect(JSON.stringify(G.ledger)).toBe(snap);
  });
  it('şube geçmişini 120, haberleri 26, olay günlüğünü 400 kayıtla sınırlar', () => {
    const { KE, G } = setup();
    G.branches[0].history = Array.from({ length: 130 }, (_, i) => i);
    G.news = Array.from({ length: 30 }, (_, i) => i);
    G.eventLog = Array.from({ length: 410 }, (_, i) => i);
    KE.compactLedger(G);
    expect(G.branches[0].history.length).toBe(120);
    expect(G.branches[0].history[0]).toBe(10);
    expect(G.news).toEqual(Array.from({ length: 26 }, (_, i) => i));
    expect(G.eventLog.length).toBe(400);
    expect(G.eventLog[0]).toBe(10);
  });
});
