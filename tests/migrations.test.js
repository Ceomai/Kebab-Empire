import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { loadGame, newGame } from './load.js';
import { buildEdgeBundle, EDGE_OUT } from '../scripts/build-edge.mjs';

/* Kayıt göçleri sürüm sürüm: küçük, elle yazılmış örnek nesnelerle */
describe('kayıt göçleri (KE.SAVE.migrate)', () => {
  const { KE } = loadGame();
  const S = KE.SAVE;
  it('şu anki sürüm 4', () => {
    expect(S.VERSION).toBe(4);
  });
  it('1 → 2: eğitim, müdavimler, enerji ve pozisyon tamamlanır', () => {
    const g = {
      day: 3,
      staff: [
        { id: 1, role: 'usta' },
        { id: 2, role: 'garson', energy: 40, pos: 'x' }
      ]
    };
    const out = S.migrate(g, 1);
    expect(out.tut).toBe(99);
    expect(Object.keys(out.regulars).length).toBe(KE.REGULARS.length);
    expect(out.regulars[KE.REGULARS[0].id]).toEqual({ loyalty: 0, visits: 0 });
    expect(out.staff[0].energy).toBe(100);
    expect(out.staff[0].pos).toBe(KE.POSITIONS.usta[0]);
    expect(out.staff[1].energy).toBe(40);
    expect(out.staff[1].pos).toBe('x');
  });
  it('1 → 2 var olan alanları ezmez', () => {
    const g = { tut: 3, regulars: { a: 1 }, staff: [] };
    const out = S.migrate(g, 1);
    expect(out.tut).toBe(3);
    expect(out.regulars).toEqual({ a: 1 });
  });
  it('2 → 3: tohum, eylem günlüğü ve kayıt kimliği eklenir; varsa korunur', () => {
    const out = S.migrate({ day: 5 }, 2);
    expect(out.seed).toBeGreaterThan(0);
    expect(out.seed).toBeLessThan(2147483647);
    expect(out.actionLog).toEqual([]);
    expect(out.saveId).toMatch(/^g/);
    expect(out.tut).toBeUndefined(); /* 1 → 2 adımı çalışmaz */
    const kept = S.migrate({ seed: 7, actionLog: [1], saveId: 'gx' }, 2);
    expect([kept.seed, kept.actionLog, kept.saveId]).toEqual([7, [1], 'gx']);
  });
  it('3 → 4: nesil, hikâyeler, bayraklar ve rakip; 40. günden sonra rakip sahnededir', () => {
    const out = S.migrate({ day: 50, rival: { power: 33 } }, 3);
    expect(out.gen).toBe(1);
    expect(out.stories).toEqual({});
    expect(out.weekly).toBeNull();
    expect(out.flags).toEqual({});
    expect(out.rival).toEqual({ power: 33, district: null, stage: 1 });
    expect(out.era).toBeGreaterThanOrEqual(1);
    expect(out.seed).toBeUndefined(); /* 2 → 3 adımı çalışmaz */
    expect(S.migrate({ day: 10 }, 3).rival).toEqual({ power: 20, district: null, stage: 0 });
  });
  it('4 (güncel): göç dokunmaz', () => {
    const g = { day: 1, x: 1 };
    expect(S.migrate(g, 4)).toEqual({ day: 1, x: 1 });
  });
  it('1 → 4 zinciri bütün adımları sırayla uygular', () => {
    const out = S.migrate({ day: 2, staff: [] }, 1);
    expect(out.tut).toBe(99);
    expect(out.seed).toBeGreaterThan(0);
    expect(out.gen).toBe(1);
    expect(out.rival.stage).toBe(0);
  });
});

describe('KE.SAVE.open', () => {
  const env = (KE, g, v) => ({
    v,
    app: KE.SAVE.APP,
    savedAt: '2026-01-01T00:00:00Z',
    day: g.day,
    sum: KE.SAVE.hash(JSON.stringify(g)),
    game: g
  });
  it('2. sürüm zarfını açar ve 4. sürüme göç ettirir', () => {
    const { KE } = loadGame();
    const g = JSON.parse(JSON.stringify(Object.assign({}, newGame(KE), { live: null })));
    delete g.seed;
    delete g.actionLog;
    delete g.gen;
    delete g.stories;
    const G = KE.SAVE.open(env(KE, g, 2));
    expect(G.seed).toBeGreaterThan(0);
    expect(G.actionLog).toEqual([]);
    expect(G.gen).toBe(1);
    expect(G.stories).toEqual({});
  });
  it('sağlama toplamı tutmayan zarfı reddeder', () => {
    const { KE } = loadGame();
    const g = JSON.parse(JSON.stringify(Object.assign({}, newGame(KE), { live: null })));
    const e = env(KE, g, 4);
    e.sum = 'deadbeef';
    expect(() => KE.SAVE.open(e)).toThrow(/bozulmuş/);
  });
  it('oyun bilgisi eksik kaydı reddeder', () => {
    const { KE } = loadGame();
    expect(() => KE.SAVE.open({ day: 1 })).toThrow(/eksik/);
    expect(() => KE.SAVE.open(null)).toThrow(/okunamadı/);
  });
});

describe('sunucu doğrulayıcı paketi', () => {
  it('supabase/functions/verify-day/game.js motor dosyalarıyla güncel', () => {
    expect(fs.readFileSync(EDGE_OUT, 'utf8') === buildEdgeBundle()).toBe(true);
    expect(path.basename(EDGE_OUT)).toBe('game.js');
  });
});
