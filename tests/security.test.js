import { describe, it, expect } from 'vitest';
import { loadGame, newGame, playDays } from './load.js';

const FILES = ['data', 'util', 'calendar', 'characters', 'economy', 'sim/rng', 'sim/staff', 'sim/branch', 'sim/morning', 'sim/service', 'sim/player', 'sim/close', 'sim/replay', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify'];
const day = (KE, G) => { KE.startService(G); KE.finishService(G); const S = G.lastSummary.branches[G.branches[0].id].stats; KE.finalizeDay(G, 'esit'); return S; };

describe('güvenlik ve hile açıkları (regresyon)', () => {
  it('aşırı fiyat sınırsız ciro getirmez (müdavim ve paket dahil)', () => {
    const { KE } = loadGame(FILES);
    const G = playDays(KE, newGame(KE), 3);
    if (G.pendingEvent) KE.resolveEvent(G, 0);
    const b = G.branches[0];
    const k = KE.randomWorker(G, 'kurye'); k.branchId = b.id; G.staff.push(k);
    Object.keys(b.prices).forEach((p) => { b.prices[p] *= 1e6; });
    Object.keys(G.regulars).forEach((r) => { G.regulars[r].loyalty = 10; });
    const S = day(KE, G);
    expect(S.served).toBe(0);
    expect(S.revenue).toBe(0);
  });
  it('yarış sıralamasına yalnızca o haftanın tohumuyla başlamış yarış girer', () => {
    const { KE } = loadGame(FILES);
    const now = new Date(Date.UTC(2026, 10, 2));
    const week = KE.raceWeek(now);
    const R = KE.newRace(week, 'A');
    expect(KE.raceCheck(week, KE.SAVE.envelope(R), now).ok).toBe(true);
    const N = newGame(KE);
    expect(KE.raceCheck(week, KE.SAVE.envelope(N), now).ok).toBe(false);
    const fake = KE.newRace(week, 'A'); fake.seed += 1;
    expect(KE.raceCheck(week, KE.SAVE.envelope(fake), now).ok).toBe(false);
    expect(KE.raceCheck('2020-W01', KE.SAVE.envelope(KE.newRace('2020-W01', 'A')), now).ok).toBe(false);
  });
  it('hamle günlüğü biçim ve boyut denetimi', () => {
    const { KE } = loadGame(FILES);
    expect(KE.logCheck([{ m: 3, a: 'setPos', x: ['s1', 'kasa'] }]).ok).toBe(true);
    expect(KE.logCheck({}).ok).toBe(false);
    expect(KE.logCheck(new Array(KE.LOG_MAX + 1).fill({ m: 1, a: 'ptake' })).ok).toBe(false);
    expect(KE.logCheck([{ m: 'x', a: 'ptake' }]).ok).toBe(false);
    expect(KE.logCheck([{ m: 1, a: 'mid', x: 'zz' }]).ok).toBe(false);
  });
  it('yeniden oynatma bilinmeyen ya da prototip adlı hamleyle çökmez ve sonucu değiştirmez', () => {
    const { KE } = loadGame(FILES);
    const G = playDays(KE, newGame(KE), 2);
    if (G.pendingEvent) KE.resolveEvent(G, 0);
    const A = JSON.parse(JSON.stringify(G)), B = JSON.parse(JSON.stringify(G));
    const sa = KE.replayService(A, []);
    const sb = KE.replayService(B, [{ m: 5, a: '__proto__', x: [1] }, { m: 6, a: 'constructor' }, { m: 7, a: 'toString' }, { m: 8, a: 'yok' }]);
    expect(sb.branches[B.branches[0].id].stats.revenue).toBe(sa.branches[A.branches[0].id].stats.revenue);
  });
  it('oyuncu adındaki HTML kayıtta metin olarak kalır (kaçışsız çizilmez)', () => {
    const { KE } = loadGame(FILES);
    const G = KE.newGame({ mode: 'doner', district: 'kadiceşme', master: KE.MASTER_TEMPLATES.doner[0], owner: '<img src=x onerror=alert(1)>', shopName: '"><script>alert(1)</script>🥙' });
    const back = KE.SAVE.open(JSON.parse(JSON.stringify(KE.SAVE.envelope(G))));
    expect(back.shopName).toBe('"><script>alert(1)</script>🥙');
  });
});
