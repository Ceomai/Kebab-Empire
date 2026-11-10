import { describe, it, expect } from 'vitest';
import { loadGame, newGame } from './load.js';

const FILES = ['data', 'util', 'calendar', 'characters', 'economy', 'sim', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify'];
/* Oyuncu hiç dokunmadan 100 gün: değişmez kurallar her gün tutmalı */
function run(mode, seed, days, check) {
  const { KE } = loadGame(FILES);
  const G = KE.newGame({ mode, district: 'kadiceşme', master: KE.MASTER_TEMPLATES[mode][0], owner: 'T', shopName: 'T', seed });
  for (let d = 0; d < days; d++) {
    if (G.pendingEvent) KE.resolveEvent(G, d % G.pendingEvent.choices.length);
    KE.startService(G);
    let g = 0; while (!KE.allDone(G) && g++ < 1500) { KE.tickAll(G); if (g % 30 === 0) check.tick(KE, G); }
    KE.finishService(G);
    check.day(KE, G);
    KE.finalizeDay(G);
  }
  return G;
}

describe('değişmez kurallar (100 gün, oyuncusuz)', () => {
  for (const mode of ['doner', 'kebap']) for (const seed of [3, 17, 41]) {
    it(`${mode} tohum ${seed}: ustalı şube sıfır müşteri yapmaz, kasa ve servis boş kalmaz, para sayısal`, () => {
      const bad = [];
      run(mode, seed, 100, {
        tick: (KE, G) => G.branches.forEach((b) => {
          const L = G.live[b.id]; if (!L || L.done || !b.autoStaff) return;
          const fr = KE.branchStaff(G, b).filter((s) => (s.role === 'kasiyer' || s.role === 'garson') && s.pos !== 'mola' && !s.home);
          if (fr.length && !fr.some((s) => s.pos === 'kasa')) bad.push(`gün ${G.day} ${b.name}: kasa boş`);
          if (fr.length >= 2 && !fr.some((s) => s.pos === 'servis')) bad.push(`gün ${G.day} ${b.name}: servis boş`);
        }),
        day: (KE, G) => {
          if (!Number.isFinite(G.cash) || !Number.isFinite(G.reputation)) bad.push(`gün ${G.day}: sayı bozuk`);
          G.branches.forEach((b) => { const S = G.lastSummary.branches[b.id].stats; const L = G.live[b.id]; if (!L.closed && S.arrivals > 20 && S.served === 0) bad.push(`gün ${G.day} ${b.name}: sıfır müşteri`); });
        }
      });
      expect(bad.slice(0, 5)).toEqual([]);
    }, 120000);
  }
});
