const pw = require('playwright');
const BROWSER = process.env.BROWSER || 'chromium';
const OUT = process.argv[3] || require('fs').mkdtempSync(require('os').tmpdir() + '/ke-e2e-');
(async () => {
  const browser = await pw[BROWSER].launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await page.goto(process.env.URL || 'http://localhost:4173/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  if (process.env.COLLECT) {
    await page.waitForTimeout(300);
    await page.evaluate(async () => { window.__cat = {}; KE.I18N.register('xx', {}); KE.I18N.langs.xx = 'xx'; KE.I18N.collect = (k, c) => { window.__cat[k] = window.__cat[k] || c; }; await KE.I18N.set('xx'); });
  }
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
  for (let i = 0; i < 4; i++) { await click('[data-a="tutNext"]'); await page.waitForTimeout(250); }
  await page.evaluate(() => { KE.G.era = 4; });
  for (const s of ['hal', 'lonca', 'buro', 'terzi', 'dekor', 'banka', 'belediye', 'ajans', 'kahve', 'subeler', 'ciftlik', 'office']) {
    await page.evaluate((s) => KE.UI.go(s), s); await page.waitForTimeout(120);
    await shot('07-' + s, true);
  }
  await page.evaluate(() => KE.UI.go('shop')); await page.waitForTimeout(700);
  await shot('08a-tut');
  await click('[data-a="tutNext"]'); await page.waitForTimeout(600); await shot('08b-tut');
  await page.evaluate(() => { KE.G.tut = 8; });
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
  if (process.env.COLLECT) {
    await page.evaluate(() => {
      const I = KE.I18N, add = (s) => { if (typeof s === 'string' && /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(s)) I.t(s); };
      const raw = (s) => { if (typeof s === 'string' && s.trim()) window.__cat[s.trim()] = s.trim(); };
      // adlar: tam eşleşme anahtarı olarak
      I.refreshEntities(); I.normalize('x');
      Object.values(KE.MODES).forEach((m) => { m.products.forEach((p) => raw(p.name)); raw(m.drink.name); Object.values(m.ingredients).forEach((g) => raw(g.name)); });
      Object.values(KE.CUSTOMER_TYPES).forEach((c) => raw(c.name)); (KE.AYLAR || []).forEach(raw); ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'].forEach(raw);
      KE.MAP.PLACES.forEach((p) => raw(p.name)); KE.DISTRICTS.forEach((d) => raw(d.name));
      // veri metinleri
      const walk = (o, d) => { if (d > 6 || o == null) return; if (typeof o === 'string') return add(o); if (Array.isArray(o)) return o.forEach((x) => walk(x, d + 1)); if (typeof o === 'object') Object.entries(o).forEach(([k, v]) => { if (!/^(id|look|icon|color|c|theme|pid|steps|fav|kind|type|cast|outfit|hair|facial|head|skin|hairColor|outfitColor|accent|gender|age|scarf|roof|wall)$/.test(k)) walk(v, d + 1); }); };
      ['MODES', 'DISTRICTS', 'TRAITS', 'COSTUMES', 'DECOR', 'GOALS', 'SPECIAL', 'REGULARS', 'LINES', 'CUSTOMER_TYPES', 'ROLES', 'TIERS', 'REGIONS', 'CAST', 'POSITIONS'].forEach((k) => walk(KE[k], 0));
      // rehber, ayarlar, yasal metin, bulut çakışması
      (KE.UI.TUT || []).forEach((t) => add(t.text));
      ['view', 'legal', 'lang'].forEach((a) => { try { KE.UI.A[a](); I.t(''); document.querySelectorAll('.modal-bg').forEach((m) => { const tw = document.createTreeWalker(m, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) add(n.nodeValue); m.querySelectorAll('[title],[aria-label],[placeholder]').forEach((e) => ['title', 'aria-label', 'placeholder'].forEach((k) => e.getAttribute(k) && add(e.getAttribute(k)))); m.remove(); }); } catch (x) { /* yok */ } });
      // olay kartları ve seçim sonuçları (kopya oyun üzerinde)
      const G0 = KE.G; const env = JSON.parse(JSON.stringify(KE.SAVE.envelope(G0)));
      (KE.EVENTS || []).forEach((e) => {
        try {
          const g = KE.SAVE.open(JSON.parse(JSON.stringify(env)));
          const card = e.build(g); add(card.title); add(card.text);
          card.choices.forEach((c, i) => { add(c.label); add(c.desc); const g2 = KE.SAVE.open(JSON.parse(JSON.stringify(env))); const c2 = e.build(g2); try { add(c2.choices[i].run(g2, c2.ctx)); } catch (x) { /* yok */ } });
        } catch (x) { /* bu oyunda kurulamayan olay */ }
      });
    });
    const cat = await page.evaluate(() => window.__cat);
    const fs = require('fs'); const prev = fs.existsSync(process.env.COLLECT) ? JSON.parse(fs.readFileSync(process.env.COLLECT, 'utf8')) : {};
    fs.writeFileSync(process.env.COLLECT, JSON.stringify(Object.assign(prev, cat), null, 1));
    console.log('collected', Object.keys(cat).length);
  }
  console.log(errors.length ? [...new Set(errors)].join('\n') : 'NO ERRORS');
  await browser.close();
  if (errors.length) process.exit(1);
})();
