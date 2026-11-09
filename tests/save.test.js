import { describe, it, expect } from 'vitest';
import { loadGame, newGame, playDays } from './load.js';

describe('kayıt sistemi', () => {
  it('yazılan kayıt aynı oyunu geri verir', () => {
    const { KE } = loadGame();
    const G = playDays(KE, newGame(KE), 2);
    expect(KE.SAVE.write(G)).toBe(true);
    const r = KE.SAVE.read();
    expect(r.from).toBe('main');
    expect(r.game.day).toBe(G.day);
    expect(Math.round(r.game.cash)).toBe(Math.round(G.cash));
  });
  it('zarfsız eski kaydı göç ettirir', () => {
    const { KE, store } = loadGame();
    const G = newGame(KE);
    const legacy = JSON.parse(JSON.stringify(Object.assign({}, G, { live: null })));
    delete legacy.regulars; delete legacy.tut; delete legacy.seed;
    store[KE.SAVE.KEY] = JSON.stringify(legacy);
    const r = KE.SAVE.read();
    expect(r.game.regulars).toBeTruthy();
    expect(r.game.seed).toBeGreaterThan(0);
    expect(r.game.tut).toBe(99);
  });
  it('ana kayıt bozulursa yedekten açar', () => {
    const { KE, store } = loadGame();
    const G = newGame(KE);
    KE.SAVE.write(G);
    playDays(KE, G, 1);
    KE.SAVE.write(G);
    store[KE.SAVE.KEY] = store[KE.SAVE.KEY].slice(0, 200);
    const r = KE.SAVE.read();
    expect(r.from).toBe('backup');
    expect(r.warning).toMatch(/yedeğinden/);
  });
  it('elle değiştirilmiş dosyayı reddeder', () => {
    const { KE } = loadGame();
    const env = KE.SAVE.envelope(newGame(KE));
    env.game.cash = 999999999;
    expect(() => KE.SAVE.open(env)).toThrow(/bozulmuş/);
  });
  it('gelecekteki sürümü reddeder', () => {
    const { KE } = loadGame();
    const env = KE.SAVE.envelope(newGame(KE));
    env.v = 99;
    expect(() => KE.SAVE.open(env)).toThrow(/daha yeni/);
  });
  it('yazılan metin JSON.stringify(zarf) ile bayt bayt aynı; yedek ve eski gün koruması önbellekle de çalışır', () => {
    const { KE, store } = loadGame();
    const G = playDays(KE, newGame(KE), 2);
    KE.SAVE.write(G);
    const env = JSON.parse(store[KE.SAVE.KEY]);
    expect(store[KE.SAVE.KEY]).toBe(JSON.stringify(Object.assign(KE.SAVE.envelope(G), { savedAt: env.savedAt })));
    /* aynı gün: yedek alınmaz; gün değişince bir önceki kayıt yedeğe geçer */
    KE.SAVE.write(G);
    expect(store[KE.SAVE.BACKUP]).toBeUndefined();
    const day = G.day; playDays(KE, G, 1); KE.SAVE.write(G);
    expect(JSON.parse(store[KE.SAVE.BACKUP]).day).toBe(day);
    /* yuva başka biri tarafından (başka sekme) daha ileri bir günle yazıldıysa eski gün onu ezmez */
    const ahead = JSON.parse(store[KE.SAVE.KEY]); ahead.day = G.day + 5; store[KE.SAVE.KEY] = JSON.stringify(ahead);
    expect(KE.SAVE.write(G)).toBe(false);
    expect(KE.SAVE.lastError).toBe('stale');
  });
});
