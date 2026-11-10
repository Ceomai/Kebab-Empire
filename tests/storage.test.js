import { describe, it, expect } from 'vitest';
import { loadGame, newGame } from './load.js';

const FILES = ['data', 'util', 'calendar', 'characters', 'economy', 'sim/rng', 'sim/staff', 'sim/branch', 'sim/morning', 'sim/service', 'sim/player', 'sim/close', 'sim/replay', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify'];
describe('kayıt boyutu ve depolama', () => {
  it('defter kırpılır ama ömür boyu toplamlar korunur, kayıt büyümez', () => {
    const { KE } = loadGame(FILES);
    const G = newGame(KE);
    let rev = 0, served = 0;
    const sizes = [];
    for (let d = 1; d <= 260; d++) {
      if (G.pendingEvent) KE.resolveEvent(G, 0);
      KE.startService(G); KE.finishService(G);
      Object.values(G.lastSummary.branches).forEach((b) => { rev += b.stats.revenue; served += b.stats.served; });
      KE.finalizeDay(G);
      if (d === 130 || d === 260) sizes.push(JSON.stringify(KE.SAVE.envelope(G)).length);
    }
    const L = KE.lifetime(G);
    expect(L.revenue).toBeCloseTo(rev, 0);
    expect(L.served).toBe(served);
    expect(G.ledger.days.every((d) => d.day > G.day - KE.LEDGER_KEEP - 31)).toBe(true);
    expect(sizes[1]).toBeLessThan(sizes[0] * 1.35);
  }, 120000);
  it('depolama doluysa yazma başarısız döner ve hata bildirilir (sessiz kayıp yok)', () => {
    const { KE, store } = loadGame(FILES, { quota: 1000 });
    const G = newGame(KE);
    expect(KE.SAVE.write(G)).toBe(false);
    expect(KE.SAVE.lastError).toBe('quota');
    expect(store[KE.SAVE.KEY]).toBeUndefined();
  });
  it('bozuk ana kayıt yedekten açılır, ikisi de bozuksa null döner (çökmez)', () => {
    const { KE, store } = loadGame(FILES);
    const G = newGame(KE);
    KE.SAVE.write(G); G.day = 2; KE.SAVE.write(G);
    store[KE.SAVE.KEY] = '{bozuk';
    const r = KE.SAVE.read();
    expect(r.from).toBe('backup');
    store[KE.SAVE.BACKUP] = JSON.stringify({ app: 'kebab-empire', v: 4, sum: 'deadbeef', game: { day: 1 } });
    expect(KE.SAVE.read()).toBeNull();
    expect(() => KE.SAVE.open({ app: 'kebab-empire', v: 99, game: G })).toThrow();
    expect(() => KE.SAVE.open(null)).toThrow();
    expect(() => KE.SAVE.open({ branches: 'x' })).toThrow();
  });
});

describe('iki sekme / eski kopya', () => {
  it('aynı oyunun ileri günü eski günle ezilmez; bilerek geri yükleme serbest', () => {
    const { KE } = loadGame(FILES);
    const G = newGame(KE);
    const old = JSON.parse(JSON.stringify(G));
    G.day = 5; expect(KE.SAVE.write(G)).toBe(true);
    expect(KE.SAVE.write(old)).toBe(false);
    expect(KE.SAVE.lastError).toBe('stale');
    expect(KE.SAVE.read().game.day).toBe(5);
    KE.SAVE.allowRewind = true;
    expect(KE.SAVE.write(old)).toBe(true);
    expect(KE.SAVE.read().game.day).toBe(1);
    const other = newGame(KE); expect(KE.SAVE.write(other)).toBe(true);
  });
});
