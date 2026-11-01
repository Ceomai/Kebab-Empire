/* A/B denge testi: aynı tohumla aynı oyunu bir seçenek açıkken ve kapalıyken oynatır, farkı ölçer.
   Kullanım: node scripts/ab-test.cjs [gün] [mod,mod] [tohum sayısı] */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..', 'js') + '/';
function load() { const ctx = { console, Intl, Math, Date, JSON }; ctx.window = ctx; vm.createContext(ctx); for (const f of ['data', 'calendar', 'characters', 'economy', 'sim', 'midday', 'progress', 'farm', 'narrative']) vm.runInContext(fs.readFileSync(root + f + '.js', 'utf8'), ctx, { filename: f }); return ctx.KE; }
const DAYS = +(process.argv[2] || 60), MODES = (process.argv[3] || 'doner,kebap').split(','), SEEDS = +(process.argv[4] || 3);
const hire = (KE, G, role) => { const w = KE.randomWorker(G, role); w.branchId = G.branches[0].id; G.staff.push(w); };
const VARIANTS = {
  base: null,
  temizlikci: (KE, G) => hire(KE, G, 'temizlik'),
  kurye: (KE, G) => hire(KE, G, 'kurye'),
  mudur_tek: (KE, G) => hire(KE, G, 'mudur'),
  tedarik_ucuz: (KE, G) => { G.branches[0].tier = 0; },
  tedarik_premium: (KE, G) => { G.branches[0].tier = 2; },
  stok_az: (KE, G) => { G.branches[0].stockLevel = 0.85; },
  stok_bol: (KE, G) => { G.branches[0].stockLevel = 1.5; },
  'fiyat_-10': (KE, G) => { const b = G.branches[0]; Object.keys(b.prices).forEach((k) => { b.prices[k] = Math.round(b.prices[k] * 0.9 / 5) * 5; }); },
  'fiyat_+10': (KE, G) => { const b = G.branches[0]; Object.keys(b.prices).forEach((k) => { b.prices[k] = Math.round(b.prices[k] * 1.1 / 5) * 5; }); },
  'fiyat_+25': (KE, G) => { const b = G.branches[0]; Object.keys(b.prices).forEach((k) => { b.prices[k] = Math.round(b.prices[k] * 1.25 / 5) * 5; }); },
  bahsis_usta: (KE, G) => { G.tipRule = 'usta'; },
  bahsis_perf: (KE, G) => { G.tipRule = 'performans'; },
  bahsis_kasa: (KE, G) => { G.tipRule = 'kasa'; },
  kostum_marka: (KE, G) => { G.staff.forEach((s) => { s.costume = 'markali'; }); G.cash -= 2400 * G.staff.length; },
  kostum_yoresel: (KE, G) => { G.staff.forEach((s) => { s.costume = 'yoresel'; }); G.cash -= 8500 * G.staff.length; },
  dekor_konsept: (KE, G) => { G.branches[0].decor.push('cini', 'bakir', 'nostalji'); G.cash -= 47000; },
  dekor_dinlenme: (KE, G) => { G.branches[0].decor.push('dinlenme', 'klima'); G.cash -= 54000; },
  ekip_hazirlik: (KE, G) => { G.branches[0].equipment.prep = 1; G.cash -= KE.MODES[G.mode].equipment.prep.levels[1].cost; },
  ekip_sogutma: (KE, G) => { G.branches[0].equipment.cold = 1; G.cash -= 25000; },
  ekip_ocak: (KE, G) => { G.branches[0].equipment.cook = 1; G.cash -= KE.MODES[G.mode].equipment.cook.levels[1].cost; },
  ekip_salon: (KE, G) => { G.branches[0].equipment.service = 1; G.cash -= KE.MODES[G.mode].equipment.service.levels[1].cost; },
  ocak_cirak: (KE, G) => { G.branches[0].equipment.cook = 1; G.cash -= KE.MODES[G.mode].equipment.cook.levels[1].cost; const m = G.market[0]; if (m) { m.branchId = G.branches[0].id; G.staff.push(m); } },
  salon_garson: (KE, G) => { G.branches[0].equipment.service = 1; G.cash -= KE.MODES[G.mode].equipment.service.levels[1].cost; hire(KE, G, 'garson'); },
  reklam_sosyal: 'weekly', tabela: (KE, G) => { G.branches[0].signBoost = 1.06; G.cash -= 20000; }
};
const run = (mode, seed, name) => {
  const KE = load();
  const G = KE.newGame({ mode, district: 'kadiceşme', master: KE.MASTER_TEMPLATES[mode][0], owner: 'T', shopName: 'T', seed });
  const v = VARIANTS[name];
  const cash0 = G.cash; let ads = 0;
  if (typeof v === 'function') v(KE, G);
  const tot = { served: 0, lost: 0, satS: 0, satN: 0, tips: 0, lostWait: 0, lostFood: 0, lostFull: 0, lostPrice: 0, lostStock: 0, paket: 0 };
  for (let d = 0; d < DAYS; d++) {
    if (process.env.NOEVENTS) G.pendingEvent = null;
    if (G.pendingEvent) KE.resolveEvent(G, (d * 7 + 3) % G.pendingEvent.choices.length);
    if (v === 'weekly' && d % 7 === 0) { const c = Math.round(14000 * G.priceIndex); G.cash -= c; ads += c; [['traffic', 1.18], ['type:ogrenci', 1.5], ['type:gece', 1.5]].forEach(([k, m]) => G.mods.push({ key: k, mult: m, days: 7 })); }
    KE.startService(G); let g = 0; while (!KE.allDone(G) && g++ < 1500) KE.tickAll(G); KE.finishService(G);
    G.branches.forEach((b) => { const S = G.lastSummary.branches[b.id].stats; Object.keys(tot).forEach((k) => { if (k === 'satS') tot.satS += S.satSum; else if (k === 'satN') tot.satN += S.satN; else tot[k] += S[k] || 0; }); });
    KE.finalizeDay(G);
  }
  const morale = G.staff.reduce((a, s) => a + s.morale, 0) / Math.max(1, G.staff.length);
  return { cash: G.cash - cash0, rep: G.reputation, served: tot.served, sat: tot.satN ? tot.satS / tot.satN : 0, lost: tot.lost, morale, quits: 0, tips: tot.tips, detail: tot };
};
for (const mode of MODES) {
  const rows = {};
  for (const name of Object.keys(VARIANTS).filter((n) => !process.env.ONLY || n === 'base' || process.env.ONLY.split(',').includes(n))) {
    const rs = []; for (let s = 1; s <= SEEDS; s++) rs.push(run(mode, 1000 + s * 17, name));
    const avg = (k) => rs.reduce((a, r) => a + r[k], 0) / rs.length;
    rows[name] = { cash: avg('cash'), rep: avg('rep'), served: avg('served'), sat: avg('sat'), lost: avg('lost'), morale: avg('morale') };
    if (process.env.DETAIL) { const dk = {}; rs.forEach((r) => Object.entries(r.detail).forEach(([k, v]) => { dk[k] = (dk[k] || 0) + v / rs.length; })); console.log(name, Object.entries(dk).map(([k, v]) => k + ':' + Math.round(v)).join(' ')); }
  }
  const B = rows.base;
  console.log(`\n== ${mode} · ${DAYS} gün · ${SEEDS} tohum ortalaması (fark = seçenek − temel)`);
  console.log('seçenek'.padEnd(16) + 'kasa farkı'.padStart(12) + 'itibar'.padStart(8) + 'müşteri'.padStart(9) + 'memnun.'.padStart(9) + 'kaçan'.padStart(8) + 'moral'.padStart(8));
  Object.entries(rows).forEach(([n, r]) => {
    const f = (v, b, d) => (n === 'base' ? v.toFixed(d) : ((v - b >= 0 ? '+' : '') + (v - b).toFixed(d)));
    console.log(n.padEnd(16) + f(r.cash / 1000, B.cash / 1000, 0).padStart(11) + 'B' + f(r.rep, B.rep, 1).padStart(8) + f(r.served, B.served, 0).padStart(9) + f(r.sat, B.sat, 1).padStart(9) + f(r.lost, B.lost, 0).padStart(8) + f(r.morale, B.morale, 1).padStart(8));
  });
}
