import { describe, it, expect } from 'vitest';
import { loadGame, newGame, playDays } from './load.js';

describe('oyun sonu: imparatorluk', () => {
  const files = ['data', 'calendar', 'characters', 'economy', 'sim', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify'];
  const ready = (KE, G) => { ['besiktepe', 'sultanpazari', 'kulealti', 'bostansahil', 'merterli', 'kampustepe'].forEach((d) => KE.openBranch(G, d)); G.branches.slice(0, KE.EMPIRE.crowns).forEach((b) => { b.champions = 1; }); G.reputation = KE.EMPIRE.reputation + 5; G.cash = 2 * KE.empirePrice(G); G.era = 4; };
  it('şartlar tamamlanmadan satın alınamaz', () => {
    const { KE } = loadGame(files);
    const G = playDays(KE, newGame(KE), 2);
    const st = KE.empireStatus(G);
    expect(st.ready).toBe(false);
    expect(st.req.map((r) => r.id)).toEqual(['era', 'branches', 'crowns', 'rep', 'cash']);
    expect(KE.buyRival(G).ok).toBe(false);
  });
  it('satın alınca rakip kalkar, unvan hedefi tamamlanır, oyun sürer', () => {
    const { KE } = loadGame(files);
    const G = playDays(KE, newGame(KE), 2);
    ready(KE, G);
    const price = KE.empirePrice(G), before = G.cash;
    const r = KE.buyRival(G);
    expect(r.ok).toBe(true);
    expect(G.goals.imparator).toBe(G.day);
    expect(Math.round(before - G.cash)).toBeLessThanOrEqual(price);
    expect(G.rival.power).toBe(0);
    expect(KE.EVENTS.find((e) => e.id === 'rakipTeklif').when(G)).toBe(false);
    expect(r.life.branches).toBe(7);
    expect(KE.buyRival(G).ok).toBe(false);
    playDays(KE, G, 3);
    expect(Number.isFinite(G.cash)).toBe(true);
  });
  it('satın alma günü sıralama zincirini kırmaz', () => {
    const { KE } = loadGame(files);
    const G = playDays(KE, newGame(KE), 2);
    if (G.pendingEvent) KE.resolveEvent(G, 0);
    ready(KE, G);
    const prev = JSON.parse(JSON.stringify(KE.SAVE.envelope(G)));
    KE.buyRival(G);
    const cur = JSON.parse(JSON.stringify(KE.SAVE.envelope(G)));
    expect(KE.chainCheck(prev, cur).ok).toBe(true);
  });
});
