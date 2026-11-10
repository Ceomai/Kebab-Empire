import { describe, it, expect } from 'vitest';
import { loadGame, newGame, playDays } from './load.js';

const FILES = ['data', 'util', 'calendar', 'characters', 'economy', 'sim/rng', 'sim/staff', 'sim/branch', 'sim/morning', 'sim/service', 'sim/player', 'sim/close', 'sim/replay', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify'];
const clone = (o) => JSON.parse(JSON.stringify(o));
function day(KE, G) { KE.startService(G); KE.finishService(G); const S = G.lastSummary.branches[G.branches[0].id].stats; KE.finalizeDay(G, 'esit'); return S; }

describe('rezervasyon defteri ve rehber müfettişi', () => {
  it('dolu saatte gelen müşteri kaçmış sayılmaz, kayıp oranı düşer', () => {
    const { KE } = loadGame(FILES);
    const G = playDays(KE, newGame(KE), 12);
    if (G.pendingEvent) KE.resolveEvent(G, 0);
    G.era = 2; G.cash = 5e6; G.mods.push({ key: 'traffic', mult: 2.2, days: 30, label: 'kalabalık' });
    const A = clone(G), B = clone(G);
    expect(KE.buyReservation(B, B.branches[0]).ok).toBe(true);
    let la = 0, lb = 0, turned = 0;
    for (let i = 0; i < 6; i++) { if (A.pendingEvent) KE.resolveEvent(A, 0); if (B.pendingEvent) KE.resolveEvent(B, 0); const a = day(KE, A), b = day(KE, B); la += KE.lostShare(a); lb += KE.lostShare(b); turned += b.turned || 0; }
    expect(turned).toBeGreaterThan(0);
    expect(lb).toBeLessThan(la);
  }, 60000);
  it('müfettiş bir gün önceden belirlenir ve ertesi sabah gelir', () => {
    const { KE } = loadGame(FILES);
    const G = playDays(KE, newGame(KE), 3);
    G.era = 3; G.reputation = 95; G.lastInspect = -100;
    let seen = null;
    for (let i = 0; i < 200 && !seen; i++) { if (G.pendingEvent) KE.resolveEvent(G, 0); if (G.inspectNext) seen = { next: G.inspectNext.day }; day(KE, G); G.reputation = 95; }
    expect(seen).not.toBeNull();
    expect(G.day).toBeGreaterThanOrEqual(seen.next);
  }, 60000);
  it('rezervasyon günü sunucuda aynen doğrulanır', () => {
    const { KE } = loadGame(FILES);
    const G = playDays(KE, newGame(KE), 5);
    if (G.pendingEvent) KE.resolveEvent(G, 0);
    G.era = 2; G.cash = 5e6; KE.buyReservation(G, G.branches[0]); G.mods.push({ key: 'traffic', mult: 2, days: 5, label: 'k' });
    const env = JSON.parse(JSON.stringify(KE.SAVE.envelope(G)));
    KE.startService(G); KE.finishService(G); const log = G.dayLog.slice(); KE.finalizeDay(G, 'esit');
    const claim = { day: env.game.day, served: 0, revenue: 0, reputation: G.reputation };
    Object.values(G.lastSummary.branches).forEach((b) => { claim.served += b.stats.served; claim.revenue += b.stats.revenue; });
    const { KE: SRV } = loadGame(FILES);
    expect(SRV.verifyDay(env, log, 'esit', claim).ok).toBe(true);
  }, 60000);
});

describe('haftalık yarış ve vakıf', () => {
  it('aynı hafta herkes için aynı başlangıç ve aynı gün sonuçları', () => {
    const { KE } = loadGame(FILES), { KE: K2 } = loadGame(FILES);
    const A = KE.newRace('2026-W45', 'A'), B = K2.newRace('2026-W45', 'B');
    expect(A.seed).toBe(B.seed); expect(A.mode).toBe(B.mode); expect(A.branches[0].district).toBe(B.branches[0].district);
    for (let i = 0; i < KE.RACE_DAYS; i++) { [[KE, A], [K2, B]].forEach(([k, g]) => { if (g.pendingEvent) k.resolveEvent(g, 0); day(k, g); }); }
    expect(KE.raceOver(A)).toBe(true);
    expect(KE.raceScore(A)).toBe(K2.raceScore(B));
    expect(KE.raceSetup('2026-W46').mode).not.toBe(KE.raceSetup('2026-W45').mode);
  }, 60000);
  it('yarış ana kaydın üstüne yazmaz', () => {
    const { KE, store } = loadGame(FILES);
    const G = newGame(KE); KE.SAVE.write(G);
    const R = KE.newRace('2026-W45', 'A'); KE.SAVE.write(R);
    expect(KE.SAVE.read().game.race).toBeFalsy();
    expect(KE.SAVE.readRace().race.week).toBe('2026-W45');
    expect(Object.keys(store)).toContain(KE.SAVE.RACE_KEY);
  }, 60000);
  it('bağış parayı alır, seviyeyi ve kalıcı etkiyi verir', () => {
    const { KE } = loadGame(FILES);
    const G = newGame(KE); G.era = 3; G.cash = 1e8;
    const b = G.branches[0], e0 = KE.expectedCustomers(G, b), t0 = KE.priceTolerance(G, b), r0 = G.reputation;
    expect(KE.donate(G, 'takim').ok).toBe(true);
    expect(KE.expectedCustomers(G, b)).toBeCloseTo(e0 * 1.02, 5);
    expect(KE.donate(G, 'okul').ok).toBe(true);
    expect(KE.priceTolerance(G, b)).toBeCloseTo(t0 + 0.01, 5);
    expect(G.reputation).toBeCloseTo(r0 + 3, 5);
    G.charity.asevi = 3; expect(KE.donate(G, 'asevi').ok).toBe(false);
  }, 60000);
});

describe('zincir kontrolü ve bağış', () => {
  it('sabah okul bağışı zinciri kırmaz, uydurulmuş itibar kırar', () => {
    const { KE } = loadGame(FILES);
    const G = playDays(KE, newGame(KE), 3);
    G.era = 3; G.cash = 1e8;
    const prev = JSON.parse(JSON.stringify(KE.SAVE.envelope(G)));
    if (G.pendingEvent) { G.pendingEvent = null; }
    const P2 = JSON.parse(JSON.stringify(prev)); P2.game.pendingEvent = null; P2.sum = null;
    const g = KE.SAVE.open(JSON.parse(JSON.stringify(P2)));
    expect(KE.donate(g, 'okul').ok).toBe(true);
    expect(KE.chainCheck(P2, KE.SAVE.envelope(g)).ok).toBe(true);
    const h = KE.SAVE.open(JSON.parse(JSON.stringify(P2))); h.reputation += 3;
    expect(KE.chainCheck(P2, KE.SAVE.envelope(h)).ok).toBe(false);
  }, 60000);
});
