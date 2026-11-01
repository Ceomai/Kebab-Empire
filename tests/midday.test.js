import { describe, it, expect } from 'vitest';
import { loadGame, newGame, playDays } from './load.js';

const FILES = ['data', 'calendar', 'characters', 'economy', 'sim', 'farm', 'narrative', 'save', 'verify'];
/* gün ortası olayı çıkan bir sabaha kadar oyna */
function dayWithMid(KE) {
  const G = playDays(KE, newGame(KE), 4);
  for (let i = 0; i < 40; i++) {
    if (G.pendingEvent) KE.resolveEvent(G, 0);
    const probe = JSON.parse(JSON.stringify(G));
    KE.pickMid(probe);
    if (probe.mid) return G;
    KE.startService(G); KE.finishService(G); KE.finalizeDay(G, 'esit');
  }
  return null;
}
function play(KE, G, choice, courier) {
  KE.startService(G);
  let n = 0;
  while (!KE.allDone(G) && n++ < 2000) {
    if (KE.midPending(G) && choice != null) KE.act(G, 'mid', choice);
    const L = G.live[G.branches[0].id];
    if (courier && L.minute === 400) KE.act(G, 'courier', G.branches[0].id);
    KE.tickAll(G);
  }
  KE.finishService(G);
}

describe('gün ortası kararları ve acil kurye', () => {
  it('oyuncunun kararı ve kurye sunucuda aynen yeniden oynanır', () => {
    const { KE } = loadGame(FILES);
    const G = dayWithMid(KE);
    expect(G).not.toBeNull();
    const env = JSON.parse(JSON.stringify(KE.SAVE.envelope(G)));
    Object.keys(G.branches[0].stock).forEach((k) => { G.branches[0].stock[k] *= 0.5; });
    env.game = JSON.parse(JSON.stringify(G)); env.sum = null;
    play(KE, G, 0, true);
    expect(G.mid.choice).toBe(0);
    const log = G.dayLog.slice();
    expect(log.some((e) => e.a === 'mid')).toBe(true);
    KE.finalizeDay(G, 'esit');
    const claim = { day: env.game.day, served: 0, revenue: 0, reputation: G.reputation };
    Object.values(G.lastSummary.branches).forEach((b) => { claim.served += b.stats.served; claim.revenue += b.stats.revenue; });
    const { KE: SRV } = loadGame(FILES);
    expect(SRV.verifyDay(env, log, 'esit', claim).ok).toBe(true);
  });
  it('karar verilmezse süre dolunca güvenli seçenek uygulanır', () => {
    const { KE } = loadGame(FILES);
    const G = dayWithMid(KE);
    play(KE, G, null, false);
    const D = KE.MIDS.find((x) => x.id === G.mid.id);
    expect(G.mid.choice).toBe(D.def);
    expect(G.mid.at).toBeGreaterThanOrEqual(G.mid.minute + KE.MID_WAIT);
  });
  it('kurye günde bir kez gelir ve 1,5 kat öder', () => {
    const { KE } = loadGame(FILES);
    const G = playDays(KE, newGame(KE), 2);
    if (G.pendingEvent) KE.resolveEvent(G, 0);
    const b = G.branches[0];
    KE.startService(G);
    Object.keys(b.stock).forEach((k) => { b.stock[k] = 0; });
    const need = KE.courierNeed(G, b);
    const cash = G.cash;
    expect(KE.courier(G, b)).toBeCloseTo(need.cost, 0);
    expect(G.cash).toBeCloseTo(cash - need.cost, 0);
    expect(KE.courier(G, b)).toBe(0);
  });
});
