/* Orta oyun A/B: 4 şubeli zincir, 120 gün. Yatırımların ve müdürün getirisini ölçer. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..', 'js') + '/';
function load() { const ctx = { console, Intl, Math, Date, JSON }; ctx.window = ctx; vm.createContext(ctx); for (const f of ['data', 'util', 'calendar', 'characters', 'economy', 'sim/rng', 'sim/staff', 'sim/branch', 'sim/morning', 'sim/service', 'sim/player', 'sim/close', 'sim/replay', 'midday', 'progress', 'farm', 'narrative']) vm.runInContext(fs.readFileSync(root + f + '.js', 'utf8'), ctx, { filename: f }); return ctx.KE; }
const DAYS = +(process.argv[2] || 120), MODES = (process.argv[3] || 'doner,kebap').split(','), SEEDS = +(process.argv[4] || 3);
function setup(KE, mode, seed, withMgr) {
  const G = KE.newGame({ mode, district: 'kadiceşme', master: KE.MASTER_TEMPLATES[mode][0], owner: 'T', shopName: 'T', seed });
  G.cash = 12e6; G.reputation = 60; G.era = 3;
  ['besiktepe', 'sultanpazari', 'bostansahil'].forEach((d) => { const b = KE.openBranch(G, d); const add = (s) => { s.branchId = b.id; G.staff.push(s); }; add(KE.randomMaster(G)); add(KE.randomMaster(G)); add(KE.randomWorker(G, 'kasiyer')); add(KE.randomWorker(G, 'garson')); });
  if (withMgr) G.branches.forEach((b) => { const m = KE.randomWorker(G, 'mudur'); m.branchId = b.id; G.staff.push(m); });
  G.branches.forEach((b) => { b.equipment.service = 1; b.equipment.cook = 1; });
  return G;
}
const V = {
  base: null,
  mudursuz: 'nomgr',
  mudur_kapali: (KE, G) => G.branches.forEach((b) => { b.managed = false; }),
  merkezi_mutfak: (KE, G) => { G.centralKitchen = true; G.cash -= 450000 * G.priceIndex; },
  ciftlik: (KE, G) => { KE.buyFarm(G); KE.farmKinds(G).forEach((k) => { KE.buyAnimals(G, k); KE.buyAnimals(G, k); }); },
  amiral: (KE, G) => { KE.buildFlagship(G, G.branches[0].id); const b = G.branches[0]; Object.keys(b.prices).forEach((k) => { b.prices[k] = Math.round(b.prices[k] * 1.08 / 5) * 5; }); },
  imza_1: (KE, G) => KE.startSignature(G, KE.MODES[G.mode].products[0].id),
  toplu_siparis: 'contract',
  tabela_hepsi: (KE, G) => G.branches.forEach((b) => { b.signBoost = 1.06; G.cash -= 30000; })
};
const run = (mode, seed, name) => {
  const KE = load();
  const G = setup(KE, mode, seed, V[name] !== 'nomgr');
  const cash0 = G.cash; const v = V[name];
  if (typeof v === 'function') v(KE, G);
  let served = 0, satS = 0, satN = 0;
  for (let d = 0; d < DAYS; d++) {
    if (process.env.NOEVENTS) G.pendingEvent = null;
    if (G.pendingEvent) KE.resolveEvent(G, (d * 7 + 3) % G.pendingEvent.choices.length);
    if (name === 'imza_1' && !G.sigWork && G.signature && G.signature.level === 1 && d === 30) KE.startSignature(G, G.signature.pid);
    if (name === 'imza_1' && d === 45) G.branches.forEach((b) => Object.keys(b.prices).forEach((k) => { b.prices[k] = Math.round(b.prices[k] * 1.06 / 5) * 5; }));
    if (v === 'contract' && !KE.contractTaken(G)) { const o = KE.contractOffers(G)[0]; if (o) KE.acceptContract(G, o.id, G.branches[0].id); }
    if (G.farm && d % 10 === 0) KE.farmKinds(G).forEach((k) => { if (G.cash > 2e6) KE.buyAnimals(G, k); });
    KE.startService(G); let g = 0; while (!KE.allDone(G) && g++ < 2000) KE.tickAll(G); KE.finishService(G);
    G.branches.forEach((b) => { const S = G.lastSummary.branches[b.id].stats; served += S.served; satS += S.satSum; satN += S.satN; });
    KE.finalizeDay(G);
  }
  return { cash: G.cash - cash0, rep: G.reputation, served, sat: satN ? satS / satN : 0 };
};
for (const mode of MODES) {
  const rows = {};
  for (const name of Object.keys(V).filter((n) => !process.env.ONLY || n === 'base' || process.env.ONLY.split(',').includes(n))) { const rs = []; for (let s = 1; s <= SEEDS; s++) rs.push(run(mode, 2000 + s * 31, name)); const avg = (k) => rs.reduce((a, r) => a + r[k], 0) / rs.length; rows[name] = { cash: avg('cash'), rep: avg('rep'), served: avg('served'), sat: avg('sat') }; }
  const B = rows.base;
  console.log(`\n== ${mode} · 4 şube · ${DAYS} gün · ${SEEDS} tohum`);
  Object.entries(rows).forEach(([n, r]) => { const f = (v, b, d) => (n === 'base' ? v.toFixed(d) : ((v - b >= 0 ? '+' : '') + (v - b).toFixed(d))); console.log(n.padEnd(16) + f(r.cash / 1e6, B.cash / 1e6, 2).padStart(9) + 'M' + f(r.rep, B.rep, 1).padStart(8) + f(r.served, B.served, 0).padStart(9) + f(r.sat, B.sat, 1).padStart(8)); });
}
