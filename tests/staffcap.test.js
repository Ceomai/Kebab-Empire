import { describe, it, expect } from 'vitest';
import { loadGame, newGame } from './load.js';

describe('kadro sınırı dükkânla büyür', () => {
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
  it('başlangıç kadrosu sınırın içinde, salon dolu', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    const b = G.branches[0];
    expect(KE.canHire(G, b, 'usta').ok).toBe(true);
    const sal = KE.canHire(G, b, 'garson');
    expect(sal.used).toBeLessThanOrEqual(sal.cap);
    expect(KE.canHire(G, b, 'mudur').cap).toBe(1);
  });
  it('ocak ve salon yükseltmeleri sınırı artırır', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    const b = G.branches[0];
    const c0 = KE.staffCaps(G, b);
    b.equipment.cook += 1;
    b.equipment.service += 1;
    const c1 = KE.staffCaps(G, b);
    expect(c1.mutfak).toBe(c0.mutfak + 1);
    expect(c1.salon).toBeGreaterThan(c0.salon);
    expect(c1.destek).toBe(c0.destek + 1);
  });
  it('dolu grupta işe alım reddedilir ve ipucu yükseltmeyi gösterir', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    const b = G.branches[0];
    while (KE.canHire(G, b, 'kasiyer').ok) {
      const w = KE.randomWorker(G, 'kasiyer');
      w.branchId = b.id;
      G.staff.push(w);
    }
    const ch = KE.canHire(G, b, 'garson');
    expect(ch.ok).toBe(false);
    expect(ch.hint).toMatch(/Mobilya ve Dekor/);
  });
});
