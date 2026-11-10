/* Testler için oyun dosyalarını DOM'suz bir bağlamda yükler */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root = path.resolve(import.meta.dirname, '..', 'js');
export function loadGame(files = ['data', 'util', 'calendar', 'characters', 'economy', 'sim', 'midday', 'progress', 'farm', 'narrative', 'save'], opts = {}) {
  const store = {};
  const ctx = { console, Intl, Math, Date, JSON, setTimeout, clearTimeout,
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { if (opts.quota != null && String(v).length > opts.quota) throw new Error('QuotaExceededError'); store[k] = String(v); }, removeItem: (k) => { delete store[k]; } } };
  Object.assign(ctx, opts.globals || {});
  ctx.window = ctx; vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
  return { KE: ctx.KE, store };
}
export function playDays(KE, G, n) {
  for (let d = 0; d < n; d++) {
    if (G.pendingEvent) KE.resolveEvent(G, 0);
    KE.startService(G);
    let g = 0; while (!KE.allDone(G) && g++ < 1500) KE.tickAll(G);
    KE.finishService(G);
    KE.finalizeDay(G);
  }
  return G;
}
export const newGame = (KE, mode = 'doner', district = 'kadiceşme') => KE.newGame({ mode, district, master: KE.MASTER_TEMPLATES[mode][0], owner: 'T', shopName: 'Test Döner' });
