const { chromium } = require('playwright');
const OUT = process.argv[3] || '.';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await page.goto(process.env.URL || 'http://localhost:4173/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const shot = (n, full) => page.screenshot({ path: OUT + '/' + n + '.png', fullPage: !!full });
  const click = async (sel) => { await page.click(sel); await page.waitForTimeout(200); };
  const mode = process.argv[2] || 'doner';
  await page.waitForTimeout(500);
  await shot('01-title');
  await click('[data-a="newgame"]');
  await click(`[data-a="pickMode"][data-m="${mode}"]`);
  await page.fill('#ng-owner', 'Deniz'); await page.fill('#ng-shop', mode === 'doner' ? 'Yaprak Döner' : 'Köz Ocakbaşı');
  await shot('02-mode');
  await click('[data-a="ngStep"][data-to="newDistrict"]');
  await click('.dl[data-d="kadiceşme"]');
  await shot('03-district');
  await click('[data-a="ngStep"][data-to="newMaster"]');
  await click('[data-a="pickMaster"][data-i="0"]');
  await shot('04-master');
  await click('[data-a="startGame"]');
  await page.waitForTimeout(300);
  await shot('05-intro');
  await click('.modal [data-a="closeModal"]');
  await page.waitForTimeout(400);
  await shot('06-map');
  for (const s of ['hal', 'lonca', 'buro', 'terzi', 'dekor', 'banka', 'belediye', 'ajans', 'kahve', 'subeler', 'ciftlik', 'office']) {
    await page.evaluate((s) => KE.UI.go(s), s); await page.waitForTimeout(120);
    await shot('07-' + s, true);
  }
  await page.evaluate(() => KE.UI.go('shop')); await page.waitForTimeout(700);
  await shot('08a-tut');
  await click('[data-a="tutNext"]'); await page.waitForTimeout(600); await shot('08b-tut');
  await page.evaluate(() => { KE.G.tut = 4; });
  await shot('08-morning', true);
  await click('[data-a="openShop"]');
  await page.waitForTimeout(700); await shot('08c-tut-service');
  await click('[data-a="tutSkip"]');
  await click('[data-a="speed"][data-v="4"]');
  await page.waitForTimeout(9000);
  await shot('09-service');
  await click('[data-a="speed"][data-v="1"]');
  await page.waitForTimeout(2500);
  await shot('10-service-1x');
  await click('[data-a="tezgah"]');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 6; i++) {
    const st = await page.evaluate(() => { const G = KE.G; const L = G.live[G.activeBranch]; const P = L.player; if (P.tid == null) return null; const t = L.tickets.find(x => x.id === P.tid); const p = KE.MODES[G.mode].products.find(x => x.id === t.pid); return p.steps[P.step]; });
    if (!st) { await page.waitForTimeout(600); continue; }
    if (i === 2) await shot('11-tezgah');
    await page.click(`[data-a="step"][data-l="${st}"]`); await page.waitForTimeout(100);
  }
  await click('[data-a="tezgah"]');
  await click('[data-a="setPos"][data-p="mola"]');
  await page.waitForTimeout(500);
  await page.evaluate(() => KE.UI.go('map')); await page.waitForTimeout(600); await shot('12-map-service');
  await page.evaluate(() => KE.UI.go('shop')); await page.waitForTimeout(300);
  await click('[data-a="fastForward"]');
  await page.waitForTimeout(400);
  await shot('13-closing', true);
  await click('[data-a="tipToday"][data-r="performans"]');
  await click('[data-a="finalize"]');
  await page.waitForTimeout(300);
  await shot('14-journal');
  await click('[data-a="closeAfterDay"]');
  await page.evaluate(() => document.querySelectorAll('.modal-bg').forEach(m => m.remove()));
  // Hızlı günler, şube ve çiftlik
  await page.evaluate(() => {
    const G = KE.G;
    G.cash += 3000000;
    const b = KE.openBranch(G, 'besiktepe');
    const add = (s) => { s.branchId = b.id; G.staff.push(s); };
    add(G.market[0]); add(KE.randomWorker(G, 'kasiyer')); add(KE.randomWorker(G, 'garson')); add(KE.randomWorker(G, 'mudur'));
    KE.buyFarm(G); KE.farmKinds(G).forEach(k => { KE.buyAnimals(G, k); KE.buyAnimals(G, k); });
    G.activeBranch = G.branches[0].id;
  });
  for (let d = 0; d < 30; d++) {
    await page.evaluate(() => { document.querySelectorAll('.modal-bg').forEach(m => m.remove()); const G = KE.G; if (G.pendingEvent) KE.resolveEvent(G, 0); KE.startService(G); KE.finishService(G); KE.finalizeDay(G); });
  }
  await page.evaluate(() => { KE.UI.go('ciftlik'); }); await page.waitForTimeout(300); await shot('15-farm', true);
  await page.evaluate(() => KE.UI.go('office', { tab: 'aylik', m: 0 })); await page.waitForTimeout(200); await shot('16-month', true);
  await page.evaluate(() => KE.UI.go('map')); await page.waitForTimeout(300); await shot('17-map2');
  await page.evaluate(() => { KE.G.pendingEvent = null; KE.UI.go('shop'); document.querySelectorAll('.modal-bg').forEach(m => m.remove()); }); await page.waitForTimeout(200);
  await click('[data-a="openShop"]');
  await click('[data-a="speed"][data-v="2"]');
  await page.waitForTimeout(7000);
  await shot('18-service2');
  await page.click('.branchbar .btab:nth-child(2)'); await page.waitForTimeout(3000);
  await shot('19-branch2');
  await page.evaluate(() => { const G = KE.G; G.speed = 0; });
  await page.evaluate(() => { const G = KE.G; G.pendingEvent = null; for (let i = 0; i < 100 && !G.pendingEvent; i++) { G.eventLog = []; G.pendingEvent = KE.rollEvent(G); } });
  await page.setViewportSize({ width: 400, height: 860 });
  await page.waitForTimeout(400);
  await shot('20-mobile-service', true);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  await page.evaluate(() => KE.UI.go('map')); await page.waitForTimeout(300); await shot('21-mobile-map');
  const sw2 = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log('scrollWidth', sw, sw2);
  console.log(errors.length ? [...new Set(errors)].join('\n') : 'NO ERRORS');
  await browser.close();
})();
