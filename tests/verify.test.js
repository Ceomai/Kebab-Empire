import { describe, it, expect } from 'vitest';
import { loadGame, newGame, playDays } from './load.js';

describe('sunucu doğrulaması', () => {
  it('dürüst sonucu doğrular, şişirilmiş sonucu reddeder', () => {
    const { KE } = loadGame(['data', 'calendar', 'characters', 'economy', 'sim', 'farm', 'narrative', 'save', 'verify']);
    const G = playDays(KE, newGame(KE), 2);
    if (G.pendingEvent) KE.resolveEvent(G, 0);
    const env = JSON.parse(JSON.stringify(KE.SAVE.envelope(G)));
    KE.startService(G);
    let n = 0; while (!KE.allDone(G) && n++ < 2000) KE.tickAll(G);
    KE.finishService(G);
    const log = G.dayLog.slice();
    KE.finalizeDay(G, 'esit');
    const S = G.lastSummary;
    const claim = { day: env.day, served: 0, revenue: 0, reputation: G.reputation };
    Object.values(S.branches).forEach((b) => { claim.served += b.stats.served; claim.revenue += b.stats.revenue; });
    const { KE: SRV } = loadGame(['data', 'calendar', 'characters', 'economy', 'sim', 'farm', 'narrative', 'save', 'verify']);
    expect(SRV.verifyDay(env, log, 'esit', claim).ok).toBe(true);
    expect(SRV.verifyDay(env, log, 'esit', Object.assign({}, claim, { revenue: claim.revenue * 3 })).ok).toBe(false);
    expect(SRV.verifyDay(env, log, 'esit', Object.assign({}, claim, { day: claim.day + 1 })).ok).toBe(false);
  });
  it('edge paketi Node içinde çalışır', async () => {
    const mod = await import('../supabase/functions/verify-day/game.js');
    expect(typeof mod.GAME.verifyDay).toBe('function');
  });
});
