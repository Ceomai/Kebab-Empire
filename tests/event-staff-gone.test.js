import { describe, it, expect } from 'vitest';
import { loadGame } from './load.js';

describe('olay kartı: andığı personel artık yoksa', () => {
  it('kart beklerken personel işten çıkarılırsa çözümleme çökmez, kart kapanır', () => {
    const { KE } = loadGame();
    const G = KE.newGame({
      mode: 'doner',
      district: 'kadiceşme',
      shopName: 'T',
      owner: 'T',
      master: KE.MASTER_TEMPLATES.doner[0],
      seed: 5
    });
    const usta = G.staff.find((s) => s.role === 'usta');
    usta.morale = 40;
    usta.hiredDay = -100;
    G.pendingEvent = { id: 'rakipTeklif', ctx: { sid: usta.id } };
    G.staff = G.staff.filter((s) => s.id !== usta.id);
    const cash = G.cash;
    expect(() => KE.resolveEvent(G, 0)).not.toThrow();
    expect(G.pendingEvent).toBe(null);
    expect(G.cash).toBe(cash);
  });
  it('personel yerindeyse kart eskisi gibi uygulanır', () => {
    const { KE } = loadGame();
    const G = KE.newGame({
      mode: 'doner',
      district: 'kadiceşme',
      shopName: 'T',
      owner: 'T',
      master: KE.MASTER_TEMPLATES.doner[0],
      seed: 5
    });
    const usta = G.staff.find((s) => s.role === 'usta');
    usta.morale = 40;
    usta.hiredDay = -100;
    G.pendingEvent = { id: 'rakipTeklif', ctx: { sid: usta.id } };
    const msg = KE.resolveEvent(G, 0);
    expect(typeof msg).toBe('string');
    expect(G.pendingEvent).toBe(null);
  });
});
