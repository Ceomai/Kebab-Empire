/* 365 günlük denge simülasyonu: basit bir oyuncu politikasıyla aylık özet */
const fs = require('fs'),
  vm = require('vm'),
  path = require('path');
const root = path.join(__dirname, '..', 'js') + '/';
function load() {
  const ctx = { console, Intl, Math, Date, JSON };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of [
    'data',
    'util',
    'calendar',
    'characters',
    'economy',
    'sim/rng',
    'sim/staff',
    'sim/branch',
    'sim/morning',
    'sim/service',
    'sim/player',
    'sim/close',
    'sim/replay',
    'midday',
    'progress',
    'farm',
    'narrative'
  ])
    vm.runInContext(fs.readFileSync(root + f + '.js', 'utf8'), ctx, { filename: f });
  return ctx.KE;
}
const DAYS = +(process.env.DAYS || 365);
for (const mode of (process.env.MODES || 'doner,kebap').split(','))
  for (const farm of process.env.FARM === '0' ? [false] : [false, true]) {
    const KE = load();
    const G = KE.newGame({
      mode,
      district: 'kadiceşme',
      master: KE.MASTER_TEMPLATES[mode][0],
      owner: 'T',
      shopName: 'T',
      seed: +(process.env.SEED || 99)
    });
    const lazy = process.env.POLICY === 'tembel';
    const rows = [];
    let opened = 1;
    for (let d = 0; d < DAYS; d++) {
      if (G.pendingEvent) {
        const n = G.pendingEvent.choices.length;
        KE.resolveEvent(G, (d * 7 + 3) % n);
      }
      // ustasız şubeye usta al (gerçek oyuncu böyle yapar)
      G.branches.forEach((b) => {
        if (!KE.branchStaff(G, b).some(KE.isCook) && G.market.length) {
          const m = G.market.shift();
          m.branchId = b.id;
          G.staff.push(m);
        }
      });
      // politika: nakit yettikçe şube aç, çiftlik al
      const nextD = ['besiktepe', 'sultanpazari', 'bostansahil', 'kulealti', 'merterli', 'kampustepe'][opened - 1];
      if (nextD && G.cash > 1800000 + opened * 600000 && G.phase === 'morning') {
        const b = KE.openBranch(G, nextD);
        opened++;
        const add = (s) => {
          s.branchId = b.id;
          G.staff.push(s);
        };
        if (G.market.length) add(G.market.shift());
        add(KE.randomWorker(G, 'kasiyer'));
        add(KE.randomWorker(G, mode === 'kebap' ? 'garson' : 'garson'));
        add(KE.randomWorker(G, 'mudur'));
      }
      if (farm && !G.farm && G.cash > 2500000) KE.buyFarm(G);
      // iyi oyuncu: fiyatları ayda bir piyasaya çek, kaybedilen müşteri çoksa ön ekibi büyüt
      if (!lazy && d % 30 === 0)
        G.branches.forEach((b) =>
          Object.values(KE.MODES[mode].products).forEach((p) => {
            if (b.prices[p.id] != null) b.prices[p.id] = KE.marketPrice(G, p);
          })
        );
      if (G.lastSummary && d % 7 === 0)
        G.branches.forEach((b) => {
          const x = G.lastSummary.branches[b.id];
          if (!x) return;
          const S = x.stats;
          const st = KE.branchStaff(G, b);
          const front = st.filter((s) => !KE.isCook(s) && s.role !== 'mudur').length;
          // kadro sınırı doluysa önce dükkânı büyüt (ocak / salon yükseltmesi)
          const grow = (k) => {
            const lv = KE.MODES[mode].equipment[k].levels[b.equipment[k] + 1];
            if (lv && G.cash > lv.cost * G.priceIndex * 3) {
              const c = lv.cost * G.priceIndex;
              G.cash -= c;
              KE.addExtra(G, 'capex', c);
              b.equipment[k]++;
            }
          };
          if (
            S.arrivals > 40 &&
            (S.lostWait + S.lostFull + S.lostFood) / S.arrivals > 0.15 &&
            front < 4 &&
            G.cash > 400000
          ) {
            const r = front % 2 ? 'kasiyer' : 'garson';
            if (!KE.canHire(G, b, r).ok) grow('service');
            if (KE.canHire(G, b, r).ok) {
              const w = KE.randomWorker(G, r);
              w.branchId = b.id;
              G.staff.push(w);
            }
          }
          if (
            S.arrivals > 40 &&
            S.lostFood / S.arrivals > 0.06 &&
            st.filter(KE.isCook).length < 3 &&
            G.market.length &&
            G.cash > 600000
          ) {
            if (!KE.canHire(G, b, 'usta').ok) grow('cook');
            if (KE.canHire(G, b, 'usta').ok) {
              const m = G.market.shift();
              m.branchId = b.id;
              G.staff.push(m);
            }
          }
        });
      // yeni sistemler: erken ekipman, 3. dönemde imza tarif, toplu sipariş ve amiral dükkân
      G.branches.forEach((b) =>
        ['service', 'cook'].forEach((k) => {
          const lv = KE.MODES[mode].equipment[k].levels[b.equipment[k] + 1];
          if (lv && G.cash > lv.cost * G.priceIndex * (lazy ? 8 : 4) + 300000) {
            const c = lv.cost * G.priceIndex;
            G.cash -= c;
            KE.addExtra(G, 'capex', c);
            b.equipment[k]++;
          }
        })
      );
      // rezervasyon: kapasite kaybı yüksek şubeye defter (politika POLICY=tembel ise yok)
      if (process.env.POLICY !== 'tembel' && (G.era || 1) >= 2 && G.lastSummary)
        G.branches.forEach((b) => {
          const x = G.lastSummary.branches[b.id];
          if (
            !b.reservation &&
            x &&
            x.stats.arrivals > 40 &&
            KE.lostShare(x.stats) >= 0.15 &&
            G.cash > KE.reservationCost(G) * 4
          )
            KE.buyReservation(G, b);
        });
      if ((G.era || 1) >= 3) {
        const sc = KE.signatureCost(G);
        if (sc && !G.sigWork && G.cash > sc * 3)
          KE.startSignature(G, G.signature && !G.signature.family ? G.signature.pid : KE.MODES[mode].products[0].id);
        const o = KE.contractOffers(G)[0];
        if (o && !KE.contractTaken(G)) KE.acceptContract(G, o.id, G.branches[0].id);
        if (!G.branches.some((b) => b.flagship) && G.cash > KE.flagshipCost(G) * 3)
          KE.buildFlagship(G, G.branches[0].id);
      }
      if (G.phase === 'morning' && KE.empireStatus(G).ready && !G.flags.empire) {
        KE.buyRival(G);
        rows.push(`*** İMPARATOR: gün ${G.day} (${KE.dateStr(G.day)})`);
        if (process.env.STOP) break;
      }
      KE.startService(G);
      let g = 0;
      while (!KE.allDone(G) && g++ < 1500) KE.tickAll(G);
      KE.finishService(G);
      const out = KE.finalizeDay(G);
      (out.eras || []).forEach((e) => rows.push(`--- dönem ${e.n} (${e.name}): gün ${G.day - 1}`));
      if (out.inspect)
        rows.push(
          '    müfettiş ' +
            (out.inspect.pass ? 'GEÇTİ' : 'kaldı') +
            ` memnuniyet ${out.inspect.sat} kayıp %${out.inspect.lost}`
        );
      if (process.env.DEBUG && out.month)
        rows.push(
          '    şartlar: ' +
            KE.eraStatus(G)
              .req.map((r) => r.id + (r.ok ? '+' : '-'))
              .join(' ') +
            ' taç:' +
            G.branches.filter((b) => b.champions).length +
            ' ay-ciro:' +
            Math.round(out.month.revenue / 1e6) +
            'M'
        );
      const emp = KE.empireStatus(G);
      if (out.month)
        rows.push(
          `${out.month.name.padEnd(13)} ciro ${String(Math.round(out.month.revenue / 1000)).padStart(6)}B net ${String(Math.round(out.month.net / 1000)).padStart(6)}B pers ${String(Math.round(out.month.personnel / 1000)).padStart(5)}B çiftlik ${String(Math.round((out.month.farm || 0) / 1000)).padStart(4)}B | kasa ${String(Math.round(G.cash / 1000)).padStart(7)}B şube ${G.branches.length} itibar ${G.reputation.toFixed(0)} pİndeks ${G.priceIndex.toFixed(2)} | taç ${G.branches.filter((b) => b.champions).length} düello ${G.rival.wins || 0}-${G.rival.losses || 0} güç ${Math.round(G.rival.power)}`
        );
    }
    console.log(`\n== ${mode} ${farm ? '+çiftlik' : ''}`);
    rows.forEach((r) => console.log(r));
  }
