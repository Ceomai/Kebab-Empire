// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';

const ctl = { fail: false, throws: false, saveRow: null, upserts: [] };
const table = (name) => {
  const res = () => (ctl.throws ? Promise.reject(new Error('ağ yok')) : Promise.resolve(ctl.fail ? { error: { message: 'boom' } } : { error: null, data: name === 'saves' ? ctl.saveRow : [] }));
  const q = {
    upsert: (row) => { if (name === 'saves') ctl.upserts.push(row); return name === 'saves' ? res() : Promise.resolve({ error: null }); },
    insert: () => Promise.resolve({ error: null }),
    select: () => q, eq: () => q, order: () => q,
    limit: () => res(), maybeSingle: () => res()
  };
  return q;
};
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getSession: () => Promise.resolve({ data: { session: { user: { id: 'u1' } } } }) },
    from: table
  })
}));

let C;
beforeAll(async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon');
  localStorage.setItem('kebab-empire-consent', JSON.stringify({ cloud: true, analytics: false, at: 'x' }));
  window.KE = {};
  await import('../src/cloud.js');
  C = window.KE.CLOUD;
  await C.init();
});

describe('bulut hata durumları', () => {
  it('başarılı yazma true döner', async () => {
    expect(C.ready).toBe(true);
    C.queueSave({ v: 4, day: 3, game: { saveId: 'g' } });
    expect(await C.flushSave()).toBe(true);
    expect(ctl.upserts.length).toBe(1);
  });
  it('yazılamayan kayıt sırada kalır ve sonra gönderilir', async () => {
    ctl.throws = true;
    C.queueSave({ v: 4, day: 4, game: { saveId: 'g' } });
    expect(await C.flushSave()).toBe(false);
    expect(C.lastError).toMatch(/ağ yok/);
    ctl.throws = false; ctl.fail = true;
    expect(await C.flushSave()).toBe(false);
    ctl.fail = false;
    expect(await C.flushSave()).toBe(true);
    expect(ctl.upserts.at(-1).day).toBe(4);
  });
  it('kayıt okuma: hata ile kayıt yok ayrılır', async () => {
    ctl.saveRow = null;
    expect(await C.loadSave()).toBeNull();
    ctl.fail = true;
    expect((await C.loadSave()).error).toBeTruthy();
    ctl.fail = false; ctl.throws = true;
    expect((await C.loadSave()).error).toBeTruthy();
    ctl.throws = false;
  });
  it('sıralama: boş liste döner, hata fırlatır', async () => {
    expect(await C.leaderboard('2026-03', 'doner')).toEqual([]);
    ctl.fail = true;
    await expect(C.leaderboard('2026-03', 'doner')).rejects.toThrow();
    ctl.fail = false; ctl.throws = true;
    await expect(C.raceBoard('2026-W10')).rejects.toThrow();
    ctl.throws = false;
  });
});
