import { describe, it, expect } from 'vitest';
import { loadGame, newGame, playDays } from './load.js';

describe('sunucu doğrulaması', () => {
  it('dürüst sonucu doğrular, şişirilmiş sonucu reddeder', () => {
    const { KE } = loadGame(['data', 'util', 'calendar', 'characters', 'economy', 'sim/rng', 'sim/staff', 'sim/branch', 'sim/morning', 'sim/service', 'sim/player', 'sim/close', 'sim/replay', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify']);
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
    const { KE: SRV } = loadGame(['data', 'util', 'calendar', 'characters', 'economy', 'sim/rng', 'sim/staff', 'sim/branch', 'sim/morning', 'sim/service', 'sim/player', 'sim/close', 'sim/replay', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify']);
    expect(SRV.verifyDay(env, log, 'esit', claim).ok).toBe(true);
    expect(SRV.verifyDay(env, log, 'esit', Object.assign({}, claim, { revenue: claim.revenue * 3 })).ok).toBe(false);
    expect(SRV.verifyDay(env, log, 'esit', Object.assign({}, claim, { day: claim.day + 1 })).ok).toBe(false);
  });
  it('edge paketi Node içinde çalışır', async () => {
    const mod = await import('../supabase/functions/verify-day/game.js');
    expect(typeof mod.GAME.verifyDay).toBe('function');
  });
});

describe('sıralama zinciri', () => {
  const files = ['data', 'util', 'calendar', 'characters', 'economy', 'sim/rng', 'sim/staff', 'sim/branch', 'sim/morning', 'sim/service', 'sim/player', 'sim/close', 'sim/replay', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify'];
  const dayRun = (KE, G) => { KE.startService(G); let n = 0; while (!KE.allDone(G) && n++ < 2000) KE.tickAll(G); KE.finishService(G); const log = G.dayLog.slice(); KE.finalizeDay(G, 'esit'); const c = { day: G.day - 1, served: 0, revenue: 0, reputation: G.reputation }; Object.values(G.lastSummary.branches).forEach((b) => { c.served += b.stats.served; c.revenue += b.stats.revenue; }); return { log, claim: c }; };
  const env = (KE, G) => JSON.parse(JSON.stringify(KE.SAVE.envelope(G)));
  it('dürüst ardışık günler zinciri geçer, sonraki halka sunucunun ürettiği durumdan devam eder', () => {
    const { KE } = loadGame(files);
    const { KE: SRV } = loadGame(files);
    const G = KE.newGame({ mode: 'doner', district: 'kadiceşme', master: KE.MASTER_TEMPLATES.doner[0], owner: 'T', shopName: 'T', seed: 31 });
    let prevEnd = null;
    for (let d = 0; d < 4; d++) {
      if (G.pendingEvent) KE.resolveEvent(G, 0);
      if (d === 2) { G.cash -= 5000; G.branches[0].prices[KE.MODES.doner.products[0].id] += 10; }
      const m = env(KE, G); const { log, claim } = dayRun(KE, G);
      const r = SRV.verifyChain(prevEnd, m, log, 'esit', claim);
      expect(r.ok, r.note).toBe(true);
      prevEnd = r.end;
    }
  });
  it('kasası şişirilmiş sabah kaydı reddedilir', () => {
    const { KE } = loadGame(files);
    const G = KE.newGame({ mode: 'kebap', district: 'kulealti', master: KE.MASTER_TEMPLATES.kebap[0], owner: 'T', shopName: 'T', seed: 32 });
    const m1 = env(KE, G); const a = dayRun(KE, G);
    const r1 = KE.verifyChain(null, m1, a.log, 'esit', a.claim); expect(r1.ok).toBe(true);
    if (G.pendingEvent) KE.resolveEvent(G, 0);
    G.cash += 5000000;
    const m2 = env(KE, G); const b = dayRun(KE, G);
    const r2 = KE.verifyChain(r1.end, m2, b.log, 'esit', b.claim);
    expect(r2.ok).toBe(false); expect(r2.note).toMatch(/kasa/);
  });
  it('yıldızı elle artırılmış usta ve ortadan başlayan oyun reddedilir', () => {
    const { KE } = loadGame(files);
    const G = KE.newGame({ mode: 'doner', district: 'kadiceşme', master: KE.MASTER_TEMPLATES.doner[0], owner: 'T', shopName: 'T', seed: 33 });
    const m1 = env(KE, G); const a = dayRun(KE, G);
    const r1 = KE.verifyChain(null, m1, a.log, 'esit', a.claim);
    if (G.pendingEvent) KE.resolveEvent(G, 0);
    const u = G.staff.find((x) => Object.values(x.spec || {}).some((v) => v < 5)); const pid = Object.keys(u.spec).find((k) => u.spec[k] < 5); u.spec[pid] = 5;
    const m2 = env(KE, G);
    expect(KE.chainCheck(r1.end, m2).ok).toBe(false);
    expect(KE.chainCheck(null, m2).note).toMatch(/zincir yok/);
  });
});
