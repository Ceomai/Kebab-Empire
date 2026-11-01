/* 365 günlük denge simülasyonu: basit bir oyuncu politikasıyla aylık özet */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..', 'js') + '/';
function load() { const ctx = { console, Intl, Math, Date, JSON }; ctx.window = ctx; vm.createContext(ctx); for (const f of ['data', 'calendar', 'characters', 'economy', 'sim', 'farm', 'narrative']) vm.runInContext(fs.readFileSync(root + f + '.js', 'utf8'), ctx, { filename: f }); return ctx.KE; }
const DAYS = +(process.env.DAYS || 365);
for (const mode of (process.env.MODES || 'doner,kebap').split(',')) for (const farm of (process.env.FARM === '0' ? [false] : [false, true])) {
  const KE = load();
  const G = KE.newGame({ mode, district: 'kadiceşme', master: KE.MASTER_TEMPLATES[mode][0], owner: 'T', shopName: 'T', seed: 99 });
  const rows = []; let opened = 1;
  for (let d = 0; d < DAYS; d++) {
    if (G.pendingEvent) { const n = G.pendingEvent.choices.length; KE.resolveEvent(G, (d * 7 + 3) % n); }
    // ustasız şubeye usta al (gerçek oyuncu böyle yapar)
    G.branches.forEach((b) => { if (!KE.branchStaff(G, b).some(KE.isCook) && G.market.length) { const m = G.market.shift(); m.branchId = b.id; G.staff.push(m); } });
    // politika: nakit yettikçe şube aç, çiftlik al
    const nextD = ['besiktepe', 'sultanpazari', 'bostansahil', 'kulealti', 'merterli', 'kampustepe'][opened - 1];
    if (nextD && G.cash > 1800000 + opened * 600000 && G.phase === 'morning') {
      const b = KE.openBranch(G, nextD); opened++;
      const add = (s) => { s.branchId = b.id; G.staff.push(s); };
      if (G.market.length) add(G.market.shift()); add(KE.randomWorker(G, 'kasiyer')); add(KE.randomWorker(G, mode === 'kebap' ? 'garson' : 'garson')); add(KE.randomWorker(G, 'mudur'));
    }
    if (farm && !G.farm && G.cash > 2500000) KE.buyFarm(G);
    // iyi oyuncu: fiyatları ayda bir piyasaya çek, kaybedilen müşteri çoksa ön ekibi büyüt
    if (d % 30 === 0) G.branches.forEach((b) => Object.values(KE.MODES[mode].products).forEach((p) => { if (b.prices[p.id] != null) b.prices[p.id] = KE.marketPrice(G, p); }));
    if (G.lastSummary && d % 7 === 0) G.branches.forEach((b) => { const x = G.lastSummary.branches[b.id]; if (!x) return; const S = x.stats; const st = KE.branchStaff(G, b); const front = st.filter((s) => !KE.isCook(s) && s.role !== 'mudur').length;
      // kadro sınırı doluysa önce dükkânı büyüt (ocak / salon yükseltmesi)
      const grow = (k) => { const lv = KE.MODES[mode].equipment[k].levels[b.equipment[k] + 1]; if (lv && G.cash > lv.cost * G.priceIndex * 3) { const c = lv.cost * G.priceIndex; G.cash -= c; KE.addExtra(G, 'capex', c); b.equipment[k]++; } };
      if (S.arrivals > 40 && (S.lostWait + S.lostFull + S.lostFood) / S.arrivals > 0.15 && front < 4 && G.cash > 400000) { const r = front % 2 ? 'kasiyer' : 'garson'; if (!KE.canHire(G, b, r).ok) grow('service'); if (KE.canHire(G, b, r).ok) { const w = KE.randomWorker(G, r); w.branchId = b.id; G.staff.push(w); } }
      if (S.arrivals > 40 && S.lostFood / S.arrivals > 0.06 && st.filter(KE.isCook).length < 3 && G.market.length && G.cash > 600000) { if (!KE.canHire(G, b, 'usta').ok) grow('cook'); if (KE.canHire(G, b, 'usta').ok) { const m = G.market.shift(); m.branchId = b.id; G.staff.push(m); } } });
    if (G.phase === 'morning' && KE.empireStatus(G).ready && !G.flags.empire) { KE.buyRival(G); rows.push(`*** İMPARATOR: gün ${G.day} (${KE.dateStr(G.day)})`); }
    KE.startService(G); let g = 0; while (!KE.allDone(G) && g++ < 1500) KE.tickAll(G);
    KE.finishService(G);
    const out = KE.finalizeDay(G);
    const emp = KE.empireStatus(G); if (out.month) rows.push(`${out.month.name.padEnd(13)} ciro ${String(Math.round(out.month.revenue / 1000)).padStart(6)}B net ${String(Math.round(out.month.net / 1000)).padStart(6)}B pers ${String(Math.round(out.month.personnel / 1000)).padStart(5)}B çiftlik ${String(Math.round((out.month.farm || 0) / 1000)).padStart(4)}B | kasa ${String(Math.round(G.cash / 1000)).padStart(7)}B şube ${G.branches.length} itibar ${G.reputation.toFixed(0)} pİndeks ${G.priceIndex.toFixed(2)} | taç ${emp.req[1].have} itibar ${emp.req[2].have}`);
  }
  console.log(`\n== ${mode} ${farm ? '+çiftlik' : ''}`); rows.forEach((r) => console.log(r));
}
