import { describe, it, expect } from 'vitest';
import { loadGame, playDays } from './load.js';

describe('denge (20 gün)', () => {
  for (const mode of ['doner', 'kebap'])
    for (const district of ['kadiceşme', 'sultanpazari']) {
      it(`${mode} / ${district}: oyun sürdürülebilir kalır`, () => {
        const { KE } = loadGame();
        const G = KE.newGame({
          mode,
          district,
          master: KE.MASTER_TEMPLATES[mode][0],
          owner: 'T',
          shopName: 'T',
          seed: 4242
        });
        playDays(KE, G, 20);
        const days = G.ledger.days.slice(-10);
        const served = days.reduce((a, d) => a + (d.served || 0), 0);
        expect(Number.isFinite(G.cash)).toBe(true);
        expect(G.cash).toBeGreaterThan(0);
        expect(G.reputation).toBeGreaterThan(10);
        expect(served).toBeGreaterThan(0);
      });
    }
});
