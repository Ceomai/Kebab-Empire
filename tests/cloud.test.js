// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';

const calls = [];
const table = (name) => {
  const q = {
    _name: name,
    upsert: (row) => {
      calls.push(['upsert', name, row]);
      return Promise.resolve({ error: null });
    },
    insert: (row) => {
      calls.push(['insert', name, row]);
      const p = Promise.resolve({ error: null });
      p.select = () => ({ single: () => Promise.resolve({ data: { id: 7 }, error: null }) });
      return p;
    },
    select: () => q,
    eq: () => q,
    order: () => q,
    limit: () => Promise.resolve({ data: [{ display_name: 'Deniz', revenue: 1, is_me: true }] }),
    maybeSingle: () => Promise.resolve({ data: null })
  };
  return q;
};
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      signInAnonymously: () => {
        calls.push(['anon']);
        return Promise.resolve({ data: { user: { id: 'u1' } }, error: null });
      },
      updateUser: () => Promise.resolve({ error: null }),
      signOut: () => Promise.resolve({})
    },
    from: table,
    rpc: (n) => {
      calls.push(['rpc', n]);
      return Promise.resolve({ error: null });
    },
    functions: {
      invoke: (n, o) => {
        calls.push(['invoke', n, o.body]);
        return Promise.resolve({ data: { ok: true } });
      }
    }
  })
}));

let C;
beforeAll(async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon');
  window.KE = {};
  await import('../src/cloud.js');
  C = window.KE.CLOUD;
  await C.init();
});

describe('bulut istemcisi', () => {
  it('rıza yokken hiçbir şey göndermez', () => {
    expect(C.enabled).toBe(true);
    expect(C.needsConsent()).toBe(true);
    expect(C.ready).toBe(false);
    C.track('screen', { s: 'map' });
    C.queueSave({ v: 3, day: 1, game: { saveId: 'g' } });
    expect(calls.filter((c) => c[0] !== 'anon').length).toBe(0);
  });
  it('rıza verilince anonim hesap açar ve profil yazar; ölçüm ayrı rıza ister', async () => {
    await C.setConsent({ cloud: true, analytics: false, name: 'Deniz' });
    expect(calls.some((c) => c[0] === 'anon')).toBe(true);
    const prof = calls.find((c) => c[1] === 'profiles');
    expect(prof[2]).toMatchObject({ id: 'u1', display_name: 'Deniz', consent_analytics: false });
    C.track('screen', {});
    await C.flushEvents();
    expect(calls.some((c) => c[1] === 'events')).toBe(false);
    await C.setConsent({ cloud: true, analytics: true, name: 'Deniz' });
    C.track('screen', { s: 'map' });
    await C.flushEvents();
    expect(calls.find((c) => c[1] === 'events')[2][0]).toMatchObject({ name: 'screen', user_id: 'u1' });
  });
  it('gün sonucunu yazar ve doğrulamayı çağırır', async () => {
    const r = await C.submitDay({
      saveId: 'g',
      day: 3,
      month: '2026-03',
      mode: 'doner',
      district: 'kadiceşme',
      served: 90,
      revenue: 33000.4,
      reputation: 31.27,
      morning: { v: 3 },
      todayRule: 'esit',
      log: []
    });
    expect(r).toEqual({ ok: true });
    const ins = calls.find((c) => c[1] === 'day_results')[2];
    expect(ins).toMatchObject({ user_id: 'u1', revenue: 33000, reputation: 31.3, served: 90 });
    expect(calls.find((c) => c[0] === 'invoke')).toEqual(['invoke', 'verify-day', { id: 7 }]);
  });
  it('verilerimi sil: rpc çağırır, rızayı temizler', async () => {
    await C.deleteMyData();
    expect(calls.some((c) => c[0] === 'rpc' && c[1] === 'delete_my_data')).toBe(true);
    expect(C.consent()).toBeNull();
    expect(C.ready).toBe(false);
  });
});
