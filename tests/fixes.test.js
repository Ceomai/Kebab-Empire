import { describe, it, expect } from 'vitest';
import { loadGame, newGame, playDays } from './load.js';

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
const clone = (o) => JSON.parse(JSON.stringify(o));

describe('kayıt zarfı anlık kopyadır', () => {
  it('zarf alındıktan sonra oyun değişse de sağlama toplamı geçerli kalır', () => {
    const { KE } = loadGame();
    const G = playDays(KE, newGame(KE), 1);
    const env = KE.SAVE.envelope(G);
    // bulut kaydı 4 sn sonra gönderilir; bu arada servis şubeleri ve ekibi değiştirir
    G.branches[0].cleanliness = 3;
    G.branches[0].prices.x = 999;
    G.staff[0].morale = 1;
    G.staff[0].wage += 5000;
    G.cash += 12345;
    G.day += 1;
    expect(env.game.branches[0].cleanliness).not.toBe(3);
    expect(env.game.staff[0].morale).not.toBe(1);
    expect(env.day).toBe(G.day - 1);
    expect(() => KE.SAVE.open(clone(env))).not.toThrow();
    expect(KE.SAVE.hash(JSON.stringify(env.game))).toBe(env.sum);
  });
});

describe('zam kuralı', () => {
  it('60 gün dolmadan ve tavanda zam verilmez; verilince moral artar', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    const s = G.staff[0];
    s.hiredDay = G.day;
    s.morale = 50;
    const w0 = s.wage;
    let r = KE.raiseStaff(G, s);
    expect(r.ok).toBe(false);
    expect(KE.canRaise(G, s)).toBe(false);
    expect(KE.raiseBlock(G, s)).toMatch(/Zam için 60 gün daha/);
    expect(s.wage).toBe(w0);
    G.day += 60;
    expect(KE.canRaise(G, s)).toBe(true);
    r = KE.raiseStaff(G, s);
    expect(r.ok).toBe(true);
    expect(s.wage).toBeGreaterThan(w0);
    expect(s.raisedDay).toBe(G.day);
    expect(s.morale).toBe(62);
    // hemen ikinci zam olmaz
    expect(KE.raiseStaff(G, s).ok).toBe(false);
    // tavandaki maaş
    G.day += 60;
    s.wage = 1e9;
    expect(KE.raiseBlock(G, s)).toBe('Tavan maaşta');
    expect(KE.raiseStaff(G, s).ok).toBe(false);
    expect(s.wage).toBe(1e9);
  });
  it('zam rol tavanını aşmaz', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    const s = G.staff[0];
    s.hiredDay = 1;
    G.day = 100;
    const cap = Math.round((KE.ECON.asgariBrut * 3.0 * G.priceIndex) / 100) * 100;
    s.role = 'usta';
    s.wage = cap - 100;
    expect(KE.raiseStaff(G, s).ok).toBe(true);
    expect(s.wage).toBe(cap);
  });
});

describe('kredi doğrulaması', () => {
  const setup = () => {
    const { KE } = loadGame(files);
    const G = KE.newGame({
      mode: 'doner',
      district: 'kadiceşme',
      master: KE.MASTER_TEMPLATES.doner[0],
      owner: 'T',
      shopName: 'T',
      seed: 7
    });
    playDays(KE, G, 2);
    if (G.pendingEvent) KE.resolveEvent(G, 0);
    return { KE, G, prev: clone(KE.SAVE.envelope(G)) };
  };
  it('teklif listesi arayüzün kullandığı üç teklif', () => {
    const { KE, G } = setup();
    const o = KE.loanOffers(G);
    expect(o.length).toBe(3);
    expect(o.map((x) => x.months)).toEqual([12, 24, 36]);
    expect(o[0]).toEqual(KE.loanOffer(Math.round((300000 * G.priceIndex) / 1000) * 1000, 12, 0.034));
  });
  it('dürüst kredi zinciri geçer', () => {
    const { KE, G, prev } = setup();
    const o = KE.loanOffers(G)[1];
    G.loans.push({ amount: o.amount, monthly: o.monthly, remaining: o.months });
    G.cash += o.amount;
    expect(KE.chainCheck(prev, clone(KE.SAVE.envelope(G)))).toEqual({ ok: true });
  });
  it('aynı teklifi iki kez almak da geçer', () => {
    const { KE, G, prev } = setup();
    const o = KE.loanOffers(G)[0];
    for (let i = 0; i < 2; i++) {
      G.loans.push({ amount: o.amount, monthly: o.monthly, remaining: o.months });
      G.cash += o.amount;
    }
    expect(KE.chainCheck(prev, clone(KE.SAVE.envelope(G))).ok).toBe(true);
  });
  it('uydurma kredi reddedilir', () => {
    const { KE, G, prev } = setup();
    G.loans.push({ amount: 1e9, monthly: 0, remaining: 12 });
    G.cash += 1e9;
    const r = KE.chainCheck(prev, clone(KE.SAVE.envelope(G)));
    expect(r.ok).toBe(false);
    expect(r.note).toMatch(/kredi teklifle uyuşmuyor/);
  });
  it('taksiti oynanmış teklif reddedilir', () => {
    const { KE, G, prev } = setup();
    const o = KE.loanOffers(G)[2];
    G.loans.push({ amount: o.amount, monthly: 1, remaining: o.months });
    G.cash += o.amount;
    expect(KE.chainCheck(prev, clone(KE.SAVE.envelope(G))).ok).toBe(false);
  });
});
