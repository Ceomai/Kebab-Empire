import { describe, it, expect } from 'vitest';
import { loadGame, newGame, playDays } from './load.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
function playWithActions(KE, G) {
  KE.startService(G);
  const st = G.staff.filter((s) => !KE.isCook(s));
  let n = 0;
  while (!KE.allDone(G) && n++ < 2000) {
    const m = G.live[G.branches[0].id].minute;
    if (m === 120) KE.act(G, 'setPos', st[0].id, 'servis');
    if (m === 200) KE.act(G, 'ptoggle', true);
    if (m >= 200 && m < 320) {
      const L = G.live[G.activeBranch];
      if (L.player.tid == null) KE.act(G, 'ptake');
      else { const t = L.tickets.find((x) => x.id === L.player.tid); const p = KE.MODES[G.mode].products.find((x) => x.id === t.pid); KE.act(G, 'pstep', p.steps[L.player.step]); }
    }
    if (m === 320) KE.act(G, 'ptoggle', false);
    if (m === 400) KE.act(G, 'setPos', st[0].id, 'kasa');
    KE.tickAll(G);
  }
  KE.finishService(G);
  return G.lastSummary;
}
const key = (S) => Object.values(S.branches).map((b) => [b.stats.served, b.stats.lost, Math.round(b.stats.revenue), Math.round(b.stats.tips), b.stats.playerServed]);

describe('tohumlu simülasyon', () => {
  it('aynı tohum ve aynı hamlelerle gün birebir aynı biter', () => {
    const { KE } = loadGame();
    const G = playDays(KE, KE.newGame({ mode: 'doner', district: 'kadiceşme', master: KE.MASTER_TEMPLATES.doner[0], owner: 'T', shopName: 'T', seed: 12345 }), 3);
    if (G.pendingEvent) KE.resolveEvent(G, 0);
    const morning = clone(Object.assign({}, G, { live: null }));
    const S1 = playWithActions(KE, G);
    const log = G.dayLog.slice();
    expect(log.length).toBeGreaterThanOrEqual(3);
    const { KE: KE2 } = loadGame();
    const S2 = KE2.replayService(morning, log);
    expect(key(S2)).toEqual(key(S1));
  });
  it('aynı tohumla iki ayrı oyun aynı ilerler; farklı tohum farklı', () => {
    const run = (seed) => { const { KE } = loadGame(); const G = playDays(KE, KE.newGame({ mode: 'kebap', district: 'kulealti', master: KE.MASTER_TEMPLATES.kebap[0], owner: 'T', shopName: 'T', seed }), 5); return [Math.round(G.cash), G.reputation.toFixed(3)]; };
    expect(run(777)).toEqual(run(777));
    expect(run(777)).not.toEqual(run(778));
  });
});
