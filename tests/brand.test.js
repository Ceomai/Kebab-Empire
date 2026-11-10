import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { loadGame, playDays } from './load.js';
const { validateBrand } = createRequire(import.meta.url)('../scripts/brand-validate.cjs');

const FILES = ['data', 'util', 'brand', 'calendar', 'characters', 'economy', 'sim', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify'];
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
  it('Türkçe ekler yeni ada göre kurulur', () => {
    const { KE } = loadGame(FILES, { globals: { __BRAND__: demo } });
    const sw = KE.BRAND.swap;
    expect(sw('"Lüks Kebap"ı satın al')).toBe('"Altın Şiş"i satın al');
    expect(sw('"Lüks Kebap"ın çıtası')).toBe('"Altın Şiş"in çıtası');
    expect(sw('"Lüks Kebap"a teklif ver')).toBe('"Altın Şiş"e teklif ver');
    expect(sw('"Lüks Kebap" seni fark etti')).toBe('"Altın Şiş" seni fark etti');
    expect(sw("Kebab Empire'ın dünyası")).toBe("Usta Dürüm Oyunu'nun dünyası");
    const { KE: K2 } = loadGame(FILES, { globals: { __BRAND__: Object.assign({}, demo, { rival: 'Kral Döner' }) } });
    expect(K2.BRAND.swap('"Lüks Kebap"ı geride bırak')).toBe('"Kral Döner"i geride bırak');
    expect(K2.BRAND.swap('"Lüks Kebap"a teklif ver')).toBe('"Kral Döner"e teklif ver');
    expect(K2.BRAND.swap('"Lüks Kebap"tan kaç')).toBe('"Kral Döner"den kaç');
    expect(K2.BRAND.swap('Lüks Kebap ve Lüks Kebap')).toBe('Kral Döner ve Kral Döner');
    /* yeni ad eskisini içerse de tek kez değişir */
    const { KE: K3 } = loadGame(FILES, { globals: { __BRAND__: Object.assign({}, demo, { rival: 'Lüks Kebap Plus' }) } });
    expect(K3.BRAND.swap('"Lüks Kebap"ı geç')).toBe('"Lüks Kebap Plus"u geç');
  });
  it('satır içi logo <img> olarak çizilir (sayfaya HTML eklenmez)', () => {
    const { KE } = loadGame(['data', 'util', 'brand', 'art'], { globals: { __BRAND__: Object.assign({}, demo, { logoUrl: null, logoSvg: '<svg xmlns="http://www.w3.org/2000/svg"><meta http-equiv="refresh"></svg>' }) } });
    const html = KE.ART.logo();
    expect(html.startsWith('<img class="logo-mark" src="data:image/svg+xml')).toBe(true);
    expect(html).not.toMatch(/<meta|<svg/);
  });
  it('metin alanları dile göre yazılabilir', () => {
    const { KE } = loadGame(FILES, { globals: { __BRAND__: demo } });
    expect(KE.BRAND.text('Merhaba')).toBe('Merhaba');
    expect(KE.BRAND.text({ tr: 'Merhaba', en: 'Hello' })).toBe('Merhaba');
    expect(KE.BRAND.text(null)).toBe('');
  });
  it('kapanışta kupon şartı: hedefler gün içi sayaçlardan hesaplanır, bonus hedef sayılmaz', () => {
    const { KE } = loadGame(FILES, { globals: { __BRAND__: demo } });
    const G = KE.newGame({ mode: 'doner', district: 'kadiceşme', master: KE.MASTER_TEMPLATES.doner[0], owner: 'T', shopName: 'X', seed: 5 });
    playDays(KE, G, 2);
    if (G.pendingEvent) KE.resolveEvent(G, 0);
    KE.startService(G);
    let g = 0; while (!KE.allDone(G) && g++ < 1500) KE.tickAll(G);
    KE.finishService(G);
    // kapanış ekranı anı: lastSummary.daily dünden kalma, canlı hedefler bugünün
    const goals = KE.dailyProgress(G, true).filter((x) => !x.bonus);
    expect(goals.length).toBeGreaterThan(0);
    goals.forEach((x) => expect(['done', 'fail']).toContain(x.state));
    const done = goals.filter((x) => x.state === 'done').length;
    expect(!!KE.BRAND.promoFor(G, done, goals.length)).toBe(done === goals.length);
  });
  it('bütün marka dosyaları geçerli', () => {
    for (const f of fs.readdirSync(new URL('../brands/', import.meta.url))) {
      if (!f.endsWith('.json')) continue;
      const b = JSON.parse(fs.readFileSync(new URL('../brands/' + f, import.meta.url), 'utf8'));
      expect(b.id + '.json').toBe(f);
      expect(validateBrand(b, f.slice(0, -5))).toEqual([]);
      if (b.app && b.app.id) expect(b.app.id).toMatch(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/);
      Object.values(b.colors || {}).forEach((c) => expect(c).toMatch(/^#[0-9a-f]{3,8}$/i));
    }
  });
  it('denetim: zararlı ya da hatalı marka dosyaları derlemeden reddedilir', () => {
    const bad = (patch, id = 'usta-durum') => validateBrand(Object.assign({}, demo, patch), id);
    expect(bad({}, '../package').length).toBeGreaterThan(0);
    expect(bad({ id: 'baska' }).join()).toMatch(/dosya adıyla/);
    expect(bad({ gameName: '' }).join()).toMatch(/gameName/);
    expect(bad({ gameName: '<img src=x onerror=alert(1)>' }).join()).toMatch(/gameName/);
    expect(bad({ products: { et_durum: 'Et <b>Dürüm</b>' } }).join()).toMatch(/products/);
    expect(bad({ orderUrl: 'javascript:alert(1)' }).join()).toMatch(/orderUrl/);
    expect(bad({ orderUrl: 'http://ornek.com' }).join()).toMatch(/orderUrl/);
    expect(bad({ promo: Object.assign({}, demo.promo, { url: 'data:text/html,x' }) }).join()).toMatch(/promo.url/);
    expect(bad({ logoUrl: '../../etc/passwd.svg' }).join()).toMatch(/logoUrl/);
    expect(bad({ logoUrl: null, logoSvg: '<svg onload="alert(1)"></svg>' }).join()).toMatch(/logoSvg/);
    expect(bad({ logoUrl: null, logoSvg: '<svg><script>alert(1)</script></svg>' }).join()).toMatch(/logoSvg/);
    expect(bad({ logoUrl: null, logoSvg: '<svg><use href="#a"/></svg>' })).toEqual([]);
    expect(bad({ logoUrl: null, logoSvg: "<svg><image href = '#x'/></svg>" })).toEqual([]);
    expect(bad({ logoUrl: null, logoSvg: "<svg><meta http-equiv='refresh' content='0;url=x'></svg>" }).join()).toMatch(/logoSvg/);
    expect(bad({ logoUrl: null, logoSvg: '<svg><img/src=x/onerror=alert(1)></svg>' }).join()).toMatch(/logoSvg/);
    expect(bad({ logoUrl: null, logoSvg: '<svg></svg><div>x</div>' }).join()).toMatch(/logoSvg/);
    expect(bad({ rival: 'Lüks Kebap Plus' }).join()).toMatch(/rival/);
    expect(bad({ colors: { primary: 'red;}' } }).join()).toMatch(/colors/);
    expect(bad({ tagline: { tr: 'Merhaba', en: 'Hello' } })).toEqual([]);
    expect(bad({ tagline: { xx: 'Hi' } }).join()).toMatch(/tagline/);
  });
});
