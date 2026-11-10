const pw = require('playwright');
const fs = require('fs');
(async () => {
  const b = await pw.chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:4173/');
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(400);
  await p.evaluate(async () => {
    window.__cat = {};
    KE.I18N.register('xx', {});
    KE.I18N.langs.xx = 'xx';
    KE.I18N.collect = (k, c) => {
      window.__cat[k] = window.__cat[k] || c;
    };
    await KE.I18N.set('xx');
  });
  for (const mode of ['doner', 'kebap']) {
    await p.evaluate((mode) => {
      const sweep = () => {
        document.querySelectorAll('.modal-bg').forEach((m) => m.remove());
      };
      KE.G = KE.newGame({
        mode,
        district: 'kadiceşme',
        master: KE.MASTER_TEMPLATES[mode][0],
        owner: 'Deniz',
        shopName: mode === 'doner' ? 'Yaprak Döner' : 'Köz Ocakbaşı',
        tut: false
      });
      const G = KE.G;
      const UI = KE.UI,
        A = UI.A,
        H = UI.H;
      UI.go('map');
      sweep();
      A.places();
      sweep();
      // dönem 1 kilitli yerler
      UI.go('subeler');
      sweep();
      G.era = 3;
      G.cash = 9e7;
      UI.go('subeler');
      A.signature();
      sweep();
      A.flagship();
      sweep();
      const o = KE.contractOffers(G)[0];
      A.contract({ id: o.id });
      sweep();
      UI.go('map');
      KE.startService(G);
      KE.finishService(G);
      const out = KE.finalizeDay(G);
      out.eras = KE.ERAS.slice(1);
      out.contract = Object.assign({ net: 120000 }, o);
      out.signature = { pid: KE.MODES[mode].products[0].id, level: 1 };
      out.weeklyDone = { text: 'Bu hafta 300 müşteriye servis yap', reward: 30000 };
      out.weeklyEnd = { text: 'Bu hafta 300 müşteriye servis yap', reward: 30000, done: false };
      ['besiktepe', 'sultanpazari'].forEach((d) => KE.openBranch(G, d));
      for (let i = 0; i < 8; i++) {
        KE.startService(G);
        KE.finishService(G);
        KE.finalizeDay(G);
      }
      H.afterDay(
        Object.assign(out, {
          branches: Object.fromEntries(G.branches.map((b) => [b.id, { served: 10, revenue: 1000, net: 100, sat: 80 }]))
        })
      );
      for (let i = 0; i < 12; i++) {
        const m = document.querySelector('.modal-bg');
        if (!m) break;
        UI.closeModal();
      }
      sweep();
      G.weekly = null;
      KE.makeWeekly(G);
      UI.go('map');
      G.era = 4;
      G.flags.empire = G.day;
      A.empireEnding();
      A.newGeneration();
      sweep();
      UI.ng = { mode, legacy: UI.heir, owner: '', shopName: '' };
      UI.go('newMode');
      UI.ng.district = 'kadiceşme';
      UI.go('newMaster');
      UI.hallAdd(G);
      UI.go('title');
      A.race();
      sweep();
      const RG = KE.newRace(KE.raceWeek(new Date()), 'D');
      KE.G = RG;
      UI.go('shop');
      for (let i = 0; i < 7; i++) {
        if (RG.pendingEvent) KE.resolveEvent(RG, 0);
        KE.startService(RG);
        KE.finishService(RG);
        KE.finalizeDay(RG);
      }
      UI.raceCheck();
      sweep();
      KE.SAVE.clearRace();
      KE.G = G;
      KE.G = G;
      UI.go('map');
      // stok tahmini, kalabalık gün, dolu kadro
      const b0 = G.branches[0];
      G.phase = 'morning';
      G.mods.push({ key: 'traffic', mult: 1.5, days: 2, label: 'Kampanya' });
      Object.keys(b0.stock).forEach((k) => {
        b0.stock[k] = 0;
      });
      G.lastSummary = G.lastSummary || { day: G.day - 1, branches: {} };
      UI.go('hal');
      UI.go('map');
      UI.adviceCard();
      A.topUpToday({ id: b0.id });
      A.stockLevel({ v: 1.15 });
      A.stockLevel({ v: 1.5 });
      ['usta', 'kasiyer', 'temizlik', 'mudur'].forEach((r) => {
        while (KE.canHire(G, b0, r).ok) {
          const w = r === 'usta' ? KE.randomMaster(G) : KE.randomWorker(G, r);
          w.branchId = b0.id;
          G.staff.push(w);
        }
        G.activeBranch = b0.id;
        A.capFull({ r });
        sweep();
      });
      UI.go('lonca');
      UI.go('buro');
      UI.go('guide');
      // yeni: kontrol listesi, pano, geri al, yönlendirme, ajans tahmini, gün ortası, kurye, kapanış özeti, müfettiş, hızlı hafta
      G.mods = G.mods.filter((m) => m.key !== 'traffic');
      UI.go('shop');
      localStorage.setItem('kebab-empire-crewview', 'pano');
      UI.render();
      UI.crewPick = KE.branchStaff(G, b0)[0].id;
      UI.render();
      UI.crewPick = null;
      localStorage.setItem('kebab-empire-crewview', 'liste');
      UI.snapUndo('x');
      G.cash -= 1;
      UI.undoChip();
      A.undo();
      KE.G = G;
      A.guideLevel();
      sweep();
      A.menu();
      sweep();
      G.inspect = { bid: b0.id };
      UI.go('map');
      UI.adviceCard();
      G.inspect = null;
      G.pendingEvent = null;
      UI.go('ajans');
      KE.MIDS.forEach((M) => {
        const st = KE.branchStaff(G, b0).filter((x) => ['kasiyer', 'garson'].includes(x.role));
        G.phase = 'service';
        G.live = {};
        G.branches.forEach((x) => {
          G.live[x.id] = KE.newLive(G, x);
        });
        G.mid = { id: M.id, bid: b0.id, minute: 0, sid: st[0] && st[0].id, choice: null };
        H.showMid();
        sweep();
        KE.resolveMid(G, 0);
      });
      UI.go('shop');
      UI.courierHtml();
      Object.keys(b0.stock).forEach((k) => {
        b0.stock[k] = 0;
      });
      UI.courierHtml();
      G.live[b0.id].courier = true;
      UI.courierHtml();
      KE.finishService(G);
      H.showClosing();
      sweep();
      const fo = KE.finalizeDay(G);
      fo.inspect = { pass: true, stars: 1, branch: b0.name, sat: 90, lost: 5 };
      H.afterDay(fo);
      sweep();
      fo.inspect.pass = false;
      H.afterDay(fo);
      sweep();
      while (G.branches.length < KE.DISTRICTS.length) {
        const d = KE.DISTRICTS.find((x) => !G.branches.some((y) => y.district === x.id));
        KE.openBranch(G, d.id);
      }
      UI.go('shop');
      UI.go('map');
      // rezervasyon, müfettiş, vakıf, huylar, kapanış notları
      G.era = 3;
      G.cash = 9e7;
      G.phase = 'morning';
      UI.go('dekor');
      KE.buyReservation(G, b0);
      UI.go('dekor');
      A.toggleRes({ id: b0.id });
      A.toggleRes({ id: b0.id });
      G.inspectNext = { bid: b0.id, day: G.day + 1 };
      G.inspect = { bid: b0.id };
      UI.adviceCard();
      UI.go('map');
      G.inspect = null;
      G.inspectNext = null;
      b0.bolNote = true;
      b0.reservation = false;
      G.reputation = 90;
      G.lastSummary = {
        day: G.day - 1,
        branches: {
          [b0.id]: {
            stats: { arrivals: 100, lostWait: 20, lostFull: 10, lostFood: 0, served: 70, revenue: 7000, stockouts: {} },
            sat: 80
          }
        }
      };
      UI.adviceCard();
      b0.reservation = true;
      b0.bolNote = false;
      UI.go('subeler');
      KE.donate(G, 'okul');
      UI.go('subeler');
      Object.keys(KE.HUYS).forEach((k) => {
        KE.I18N.t(KE.HUYS[k].name);
        KE.I18N.t(KE.HUYS[k].desc);
      });
      UI.go('lonca');
      const fo2 = {
        levelUps: [],
        quits: [],
        branches: {},
        tipWishEnd: { rule: 'usta', hits: 1, days: 7, missed: true }
      };
      H.afterDay(fo2);
      sweep();
      fo2.tipWishEnd.missed = false;
      H.afterDay(fo2);
      sweep();
      G.phase = 'service';
      G.live = {};
      G.branches.forEach((x) => {
        G.live[x.id] = KE.newLive(G, x);
      });
      G.live[b0.id].stats.turned = 12;
      G.live[b0.id].stats.lostWait = 9;
      G.live[b0.id].stats.served = 50;
      G.live[b0.id].stats.revenue = 5000;
      G.mid = { id: 'ariza', bid: b0.id, minute: 0, choice: 0, byMgr: true, late: true };
      KE.finishService(G);
      H.showClosing();
      sweep();
      G.phase = 'morning';
      KE.MIDS.forEach((M) => {
        G.phase = 'service';
        G.live = {};
        G.branches.forEach((x) => {
          G.live[x.id] = KE.newLive(G, x);
        });
        const mg = KE.randomWorker(G, 'mudur');
        mg.branchId = b0.id;
        G.staff.push(mg);
        G.mid = { id: M.id, bid: b0.id, minute: 0, choice: null };
        H.showMid();
        sweep();
        G.staff = G.staff.filter((x) => x !== mg);
      });
      G.phase = 'morning';
      G.live = null;
      ['ustaIzin', 'ustaKavga', 'ustaTeklif'].forEach((id) => {
        const e = KE.EVENTS.find((x) => x.id === id);
        try {
          const c = e.build(G);
          KE.I18N.t(c.title);
          KE.I18N.t(c.text);
          c.choices.forEach((ch) => {
            KE.I18N.t(ch.label);
            KE.I18N.t(ch.desc);
            KE.I18N.t(ch.run(G, c.ctx));
          });
        } catch (x) {
          console.log('ev', id, x.message);
        }
      });
      // rakip hamleleri ve hikâyeler
      KE.EVENTS.filter((e) => e.arc || e.story || e.id === 'rakipSemt').forEach((e) => {
        try {
          const c = e.build(G);
          KE.I18N.t(c.title);
          KE.I18N.t(c.text);
          c.choices.forEach((ch) => {
            KE.I18N.t(ch.label);
            KE.I18N.t(ch.desc);
          });
        } catch (x) {
          /* yok */
        }
      });
      KE.G.pendingEvent = { id: 'rk_fiyat', who: 'rakip', title: 'x', text: 'y', rival: 2, choices: [] };
      H.showEvent();
      sweep();
      KE.G.pendingEvent = null;
    }, mode);
    await p.waitForTimeout(300);
  }
  const cat = await p.evaluate(() => window.__cat);
  const f = 'locales_src/catalog.json';
  const prev = JSON.parse(fs.readFileSync(f, 'utf8'));
  fs.writeFileSync(f, JSON.stringify(Object.assign(prev, cat), null, 1));
  console.log('collected', Object.keys(cat).length, errs.join('\n') || 'NO ERRORS');
  await b.close();
})();
