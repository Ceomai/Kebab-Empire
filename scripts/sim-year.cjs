/* 365 günlük denge simülasyonu: basit bir oyuncu politikasıyla aylık özet */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..', 'js') + '/';
function load() { const ctx = { console, Intl, Math, Date, JSON }; ctx.window = ctx; vm.createContext(ctx); for (const f of ['data', 'calendar', 'characters', 'economy', 'sim', 'farm', 'narrative']) vm.runInContext(fs.readFileSync(root + f + '.js', 'utf8'), ctx, { filename: f }); return ctx.KE; }
const DAYS = +(process.env.DAYS || 365);
for (const mode of (process.env.MODES || 'doner,kebap').split(',')) for (const farm of [false, true]) {
  const KE = load();
  const G = KE.newGame({ mode, district: 'kadiceşme', master: KE.MASTER_TEMPLATES[mode][0], owner: 'T', shopName: 'T', seed: 99 });
  const rows = []; let opened = 1;
  for (let d = 0; d < DAYS; d++) {
    if (G.pendingEvent) { const n = G.pendingEvent.choices.length; KE.resolveEvent(G, (d * 7 + 3) % n); }
    // ustasız şubeye usta al (gerçek oyuncu böyle yapar)
    G.branches.forEach((b) => { if (!KE.branchStaff(G, b).some(KE.isCook) && G.market.length) { const m = G.market.shift(); m.branchId = b.id; G.staff.push(m); } });
    // politika: nakit yettikçe şube aç, çiftlik al
    const nextD = ['besiktepe', 'sultanpazari', 'bostansahil'][opened - 1];
    if (nextD && G.cash > 1800000 + opened * 600000 && G.phase === 'morning') {
      const b = KE.openBranch(G, nextD); opened++;
      const add = (s) => { s.branchId = b.id; G.staff.push(s); };
      if (G.market.length) add(G.market.shift()); add(KE.randomWorker(G, 'kasiyer')); add(KE.randomWorker(G, mode === 'kebap' ? 'garson' : 'garson')); add(KE.randomWorker(G, 'mudur'));
    }
    if (farm && !G.farm && G.cash > 2500000) KE.buyFarm(G);
    KE.startService(G); let g = 0; while (!KE.allDone(G) && g++ < 1500) KE.tickAll(G);
    KE.finishService(G);
    const out = KE.finalizeDay(G);
    if (out.month) rows.push(`${out.month.name.padEnd(13)} ciro ${String(Math.round(out.month.revenue / 1000)).padStart(6)}B net ${String(Math.round(out.month.net / 1000)).padStart(6)}B pers ${String(Math.round(out.month.personnel / 1000)).padStart(5)}B çiftlik ${String(Math.round((out.month.farm || 0) / 1000)).padStart(4)}B | kasa ${String(Math.round(G.cash / 1000)).padStart(7)}B şube ${G.branches.length} itibar ${G.reputation.toFixed(0)} pİndeks ${G.priceIndex.toFixed(2)}`);
  }
  console.log(`\n== ${mode} ${farm ? '+çiftlik' : ''}`); rows.forEach((r) => console.log(r));
}
