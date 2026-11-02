import { describe, it, expect } from 'vitest';
import { loadGame, playDays } from './load.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
function setup(mode = 'doner', seed = 77) {
  const { KE } = loadGame();
  const G = playDays(KE, KE.newGame({ mode, district: 'kadiceşme', master: KE.MASTER_TEMPLATES[mode][0], owner: 'T', shopName: 'T', seed }), 2);
  if (G.pendingEvent) KE.resolveEvent(G, 0);
  return { KE, G };
}
/* oyuncu tezgâhta, en az n fiş tutana dek oyna */
function toOrders(KE, G, n) {
  KE.startService(G);
  KE.act(G, 'ptoggle', true);
  const L = G.live[G.activeBranch];
  let g = 0;
  while (L.player.slots.length < n && g++ < 600) { KE.tickAll(G); while (KE.act(G, 'ptake')); }
  return L;
}
const prodOf = (KE, G, pid) => KE.MODES[G.mode].products.find((p) => p.id === pid);
const nextSt = (KE, G, L, sl) => { const t = L.tickets.find((x) => x.id === sl.tid); return KE.stepStation(prodOf(KE, G, t.pid).steps[sl.step]); };

describe('tezgâh: istasyonlar ve aynı anda birden çok sipariş', () => {
  it('her tarif adımının bir istasyonu var', () => {
    const { KE } = loadGame();
    ['doner', 'kebap'].forEach((m) => KE.MODES[m].products.forEach((p) => p.steps.forEach((s) => expect(KE.STEP_STATION[s], `${p.id}: ${s}`).toBeTruthy())));
  });
  it('oyuncu kapasite kadar fiş tutar (2, hazırlık ekipmanı 2+ ise 3)', () => {
    const { KE, G } = setup();
    const cap = KE.playerCap(G, G.branches[0]);
    const L = toOrders(KE, G, cap);
    expect(cap).toBe(2);
    expect(L.player.slots.length).toBe(cap);
    expect(KE.act(G, 'ptake')).toBeFalsy();
    expect(L.player.tid).toBe(L.player.slots[0].tid);
  });
  it('doğru istasyon ilerletir, yanlış istasyon hata ve kombo sıfırlar', () => {
    const { KE, G } = setup();
    const L = toOrders(KE, G, 1);
    const sl = L.player.slots[0];
    const need = nextSt(KE, G, L, sl);
    const wrong = KE.STATIONS.find((s) => s.id !== need && s.id !== 'ates').id;
    L.player.combo = 3;
    expect(KE.act(G, 'pst', wrong).ok).toBe(false);
    expect(sl.errors).toBe(1); expect(L.player.combo).toBe(0);
    expect(KE.act(G, 'pst', need).ok).toBe(true);
    expect(sl.step === 1 || sl.fire != null).toBe(true);
  });
  it('ateş: pişene kadar beklenir, zamanında alınırsa hatasız, unutulursa yanar ve sipariş ustaya döner', () => {
    const { KE, G } = setup('kebap', 5);
    const L = toOrders(KE, G, 1);
    const sl = L.player.slots[0];
    const t = L.tickets.find((x) => x.id === sl.tid), p = prodOf(KE, G, t.pid);
    /* ateş adımına kadar ilerle */
    let g = 0;
    while (nextSt(KE, G, L, sl) !== 'ates' && g++ < 10) KE.act(G, 'pst', nextSt(KE, G, L, sl));
    expect(KE.act(G, 'pst', 'ates').fire).toBe(true);
    const r = KE.act(G, 'pst', 'ates');
    expect(r.wait).toBe(true); expect(sl.errors).toBe(0);
    const ft = KE.fireTimes(p);
    const snap = clone(G);
    for (let i = 0; i < ft.cook; i++) KE.tickAll(G);
    const r2 = KE.act(G, 'pst', 'ates');
    expect(r2.ok).toBe(true); expect(r2.burnt).toBe(false); expect(sl.fire).toBe(null);
    /* aynı durumdan: ateşte unut */
    const G2 = clone(snap);
    const L2 = G2.live[G2.activeBranch];
    for (let i = 0; i < ft.cook + ft.grace + 6; i++) KE.tickAll(G2);
    expect(L2.player.slots.find((s) => s.tid === t.id)).toBeFalsy();
    expect(L2.player.burned).toBe(1);
    const t2 = L2.tickets.find((x) => x.id === t.id);
    if (t2) expect(t2.cook === 'player').toBe(false);
  });
  it('hatasız siparişler kombo yapar ve kaliteyi artırır', () => {
    const { KE, G } = setup();
    const L = toOrders(KE, G, 1);
    let done = 0, g = 0;
    while (done < 3 && g++ < 300) {
      const sl = L.player.slots[0];
      if (!sl) { KE.tickAll(G); while (KE.act(G, 'ptake')); continue; }
      if (sl.fire != null) { KE.tickAll(G); const r = KE.act(G, 'pst', 'ates'); if (r.done) { done++; while (KE.act(G, 'ptake')); } continue; }
      KE.act(G, 'psel', 0);
      const r = KE.act(G, 'pst', nextSt(KE, G, L, sl));
      if (r.done) { done++; while (KE.act(G, 'ptake')); }
    }
    expect(done).toBe(3);
    expect(L.player.combo).toBeGreaterThanOrEqual(2);
    const ready = L.tickets.filter((t) => t.cookId === 'player');
    ready.forEach((t) => expect(t.q).toBeGreaterThanOrEqual(4.5));
  });
  it('istasyon hamleleri günlükten birebir yeniden oynatılır', () => {
    const { KE, G } = setup('kebap', 21);
    const morning = clone(Object.assign({}, G, { live: null }));
    KE.startService(G);
    let n = 0;
    while (!KE.allDone(G) && n++ < 2000) {
      const L = G.live[G.activeBranch];
      const m = L.minute;
      if (m === 150) KE.act(G, 'ptoggle', true);
      if (m > 150 && m < 360) {
        while (KE.act(G, 'ptake'));
        const sl = L.player.slots[(m >> 3) % 2] || L.player.slots[0];
        if (sl) { if (m % 7 === 0) KE.act(G, 'psel', 1); KE.act(G, 'pst', sl.fire != null ? 'ates' : m % 11 === 0 ? 'sos' : nextSt(KE, G, L, sl)); }
      }
      if (m === 360) KE.act(G, 'ptoggle', false);
      KE.tickAll(G);
    }
    KE.finishService(G);
    const S1 = G.lastSummary, log = G.dayLog.slice();
    expect(log.some((e) => e.a === 'pst')).toBe(true);
    const { KE: KE2 } = loadGame();
    const S2 = KE2.replayService(morning, log);
    const key = (S) => Object.values(S.branches).map((b) => [b.stats.served, b.stats.lost, Math.round(b.stats.revenue), b.stats.playerServed]);
    expect(key(S2)).toEqual(key(S1));
    expect(S1.branches[G.branches[0].id].stats.playerServed).toBeGreaterThan(0);
  });
  it('bekleyen müşteri sabrı bitince oyuncunun fişi de düşer (sonsuz bekleme yok)', () => {
    const { KE, G } = setup();
    const L = toOrders(KE, G, 1);
    const sl = L.player.slots[0];
    const t = L.tickets.find((x) => x.id === sl.tid);
    const c = L.custs[t.cid];
    if (!c) return;
    for (let i = 0; i < Math.ceil(c.patience * 2.7) + 2; i++) KE.tickAll(G);
    expect(L.custs[c.id]).toBeFalsy();
    expect(L.player.slots.find((s) => s.tid === t.id)).toBeFalsy();
  });
});
