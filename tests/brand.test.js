import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { loadGame, playDays } from './load.js';

const FILES = ['data', 'brand', 'calendar', 'characters', 'economy', 'sim', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify'];
const demo = JSON.parse(fs.readFileSync(new URL('../brands/usta-durum.json', import.meta.url), 'utf8'));

describe('marka ayarı', () => {
  it('varsayılan marka hiçbir şeyi değiştirmez', () => {
    const { KE } = loadGame(FILES);
    expect(KE.BRAND.isDefault).toBe(true);
    expect(KE.BRAND.swap('"Lüks Kebap" seni fark etti')).toBe('"Lüks Kebap" seni fark etti');
    expect(KE.MODES.doner.products.find((p) => p.id === 'et_durum').name).toBe('Et Dürüm');
  });
  it('markalı sürüm: ürün adları, rakip ve oyun adı değişir, şube adı markayla başlar', () => {
    const { KE } = loadGame(FILES, { globals: { __BRAND__: demo } });
    expect(KE.BRAND.id).toBe('usta-durum');
    expect(KE.MODES.doner.products.find((p) => p.id === 'et_durum').name).toBe('Usta Et Dürüm');
    expect(KE.BRAND.swap('"Lüks Kebap" zincirini satın al · Kebab Empire')).toBe('"Altın Şiş" zincirini satın al · Usta Dürüm Oyunu');
    const G = KE.newGame({ mode: 'doner', district: 'kadiceşme', master: KE.MASTER_TEMPLATES.doner[0], owner: 'T', shopName: 'Usta Dürüm', seed: 3 });
    G.cash = 9e7; G.era = 4;
    const b = KE.openBranch(G, 'besiktepe');
    expect(b.name.startsWith('Usta Dürüm ')).toBe(true);
  });
  it('marka ekonomiye dokunmaz: aynı tohumla markalı ve varsayılan oyun aynı sonucu verir', () => {
    const run = (globals) => {
      const { KE } = loadGame(FILES, { globals });
      const G = playDays(KE, KE.newGame({ mode: 'doner', district: 'kadiceşme', master: KE.MASTER_TEMPLATES.doner[0], owner: 'T', shopName: 'X', seed: 77 }), 5);
      return [Math.round(G.cash), Math.round(G.reputation * 100), G.ledger.days.map((d) => Math.round(d.revenue)).join(',')];
    };
    expect(run({ __BRAND__: demo })).toEqual(run({}));
  });
  it('kupon: gün ve hedef koşulu', () => {
    const { KE } = loadGame(FILES, { globals: { __BRAND__: demo } });
    expect(KE.BRAND.promoFor({ day: 1 }, 3, 3)).toBe(null);
    expect(KE.BRAND.promoFor({ day: 5 }, 2, 3)).toBe(null);
    expect(KE.BRAND.promoFor({ day: 5 }, 3, 3).code).toBe('OYUN15');
  });
  it('bütün marka dosyaları geçerli', () => {
    for (const f of fs.readdirSync(new URL('../brands/', import.meta.url))) {
      if (!f.endsWith('.json')) continue;
      const b = JSON.parse(fs.readFileSync(new URL('../brands/' + f, import.meta.url), 'utf8'));
      expect(b.id + '.json').toBe(f);
      if (b.app && b.app.id) expect(b.app.id).toMatch(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/);
      Object.values(b.colors || {}).forEach((c) => expect(c).toMatch(/^#[0-9a-f]{3,8}$/i));
    }
  });
});
