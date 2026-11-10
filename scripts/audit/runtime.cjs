/* Tarayıcıda çalışma zamanı denetimi: açılış süresi, uzun oturumda bellek, çevrimdışı oynama,
   iki sekme çakışması, hızlı art arda tıklama. Kullanım: node scripts/audit/runtime.cjs */
const pw = require('playwright');
const URL = process.env.URL || 'http://localhost:4173/';
(async () => {
  const br = await pw.chromium.launch();
  const res = {};
  /* 1) açılış süresi (soğuk ve sıcak) */
  {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const page = await ctx.newPage();
    const t0 = Date.now();
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForSelector('[data-a="newgame"]');
    res.coldStartMs = Date.now() - t0;
    const t1 = Date.now();
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('[data-a="newgame"]');
    res.warmStartMs = Date.now() - t1;
    const nav = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: Math.round(n.domContentLoadedEventEnd),
        load: Math.round(n.loadEventEnd),
        transferKB: Math.round(
          performance.getEntriesByType('resource').reduce((a, r) => a + (r.transferSize || 0), 0) / 1024
        )
      };
    });
    res.navigation = nav;
    await ctx.close();
  }
  /* 2) uzun oturum: 60 gün hızlı gün + ekran gezintisi, bellek ölçümü */
  {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.clear();
      const G = KE.newGame({
        mode: 'doner',
        district: 'kadiceşme',
        master: KE.MASTER_TEMPLATES.doner[0],
        owner: 'U',
        shopName: 'U',
        seed: 9
      });
      G.tut = 99;
      KE.G = G;
      KE.UI.go('map');
    });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Performance.enable');
    const heap = async () => {
      await cdp.send('HeapProfiler.collectGarbage').catch(() => {});
      const m = await cdp.send('Performance.getMetrics');
      const g = (n) => (m.metrics.find((x) => x.name === n) || {}).value;
      return {
        heapMB: +(g('JSHeapUsedSize') / 1048576).toFixed(1),
        nodes: g('Nodes'),
        listeners: g('JSEventListeners')
      };
    };
    const h0 = await heap();
    const t0 = Date.now();
    for (let d = 0; d < 60; d++) {
      await page.evaluate(() => {
        const G = KE.G;
        if (G.pendingEvent) KE.resolveEvent(G, 0);
        G.pendingEvent = null;
        KE.UI.A.quickDay();
      });
      await page.evaluate(() => {
        document.querySelectorAll('.modal-bg').forEach((m) => m.remove());
        KE.UI.A.finalize();
        document.querySelectorAll('.modal-bg').forEach((m) => m.remove());
      });
      for (const s of ['map', 'shop', 'hal', 'office', 'lonca']) await page.evaluate((s) => KE.UI.go(s), s);
    }
    const h1 = await heap();
    res.longSession = {
      days: 60,
      screenVisits: 300,
      ms: Date.now() - t0,
      before: h0,
      after: h1,
      errors: errs.slice(0, 3),
      dayReached: await page.evaluate(() => KE.G.day)
    };
    await ctx.close();
  }
  /* 3) çevrimdışı: sayfa yüklendikten sonra internet kesik, bir gün oyna, kaydet, yenile */
  {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, serviceWorkers: 'allow' });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(URL);
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      localStorage.clear();
      const G = KE.newGame({
        mode: 'kebap',
        district: 'kadiceşme',
        master: KE.MASTER_TEMPLATES.kebap[0],
        owner: 'O',
        shopName: 'O',
        seed: 3
      });
      G.tut = 99;
      KE.G = G;
      KE.UI.go('shop');
    });
    await ctx.setOffline(true);
    await page.evaluate(() => {
      KE.UI.A.quickDay();
      document.querySelectorAll('.modal-bg').forEach((m) => m.remove());
      KE.UI.A.finalize();
    });
    const day = await page.evaluate(() => KE.G.day);
    let reloadOk = false;
    try {
      await page.reload({ timeout: 8000 });
      await page.waitForSelector('[data-a="continue"]', { timeout: 5000 });
      await page.click('[data-a="continue"]');
      reloadOk = (await page.evaluate(() => KE.G && KE.G.day)) === day;
    } catch (e) {
      reloadOk = 'hata: ' + e.message.slice(0, 80);
    }
    res.offline = { playedDayOffline: day === 2, reloadOfflineFromServiceWorker: reloadOk, errors: errs.slice(0, 3) };
    await ctx.close();
  }
  /* 4) iki sekme: aynı kayıt iki sekmede, ikisi de oynar — hangisi kazanır, kayıt bozulur mu */
  {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
    const a = await ctx.newPage();
    await a.goto(URL);
    await a.evaluate(() => {
      localStorage.clear();
      const G = KE.newGame({
        mode: 'doner',
        district: 'kadiceşme',
        master: KE.MASTER_TEMPLATES.doner[0],
        owner: 'T',
        shopName: 'T',
        seed: 5
      });
      G.tut = 99;
      KE.SAVE.write(G);
    });
    const b = await ctx.newPage();
    await b.goto(URL);
    for (const p of [a, b]) {
      await p.reload();
      await p.click('[data-a="continue"]');
    }
    await a.evaluate(() => {
      for (let i = 0; i < 3; i++) {
        KE.UI.A.quickDay();
        KE.UI.A.finalize();
        document.querySelectorAll('.modal-bg').forEach((m) => m.remove());
      }
    });
    await b.evaluate(() => {
      KE.UI.A.quickDay();
      KE.UI.A.finalize();
      document.querySelectorAll('.modal-bg').forEach((m) => m.remove());
    });
    const saved = await a.evaluate(() => {
      const r = KE.SAVE.read();
      return r && r.game.day;
    });
    res.twoTabs = {
      tabA_day: await a.evaluate(() => KE.G.day),
      tabB_day: await b.evaluate(() => KE.G.day),
      savedDay: saved
    };
    await ctx.close();
  }
  /* 5) hızlı art arda tıklama: aynı işe alım düğmesine 10 kez */
  {
    const ctx = await br.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(URL);
    await page.evaluate(() => {
      localStorage.clear();
      const G = KE.newGame({
        mode: 'doner',
        district: 'kadiceşme',
        master: KE.MASTER_TEMPLATES.doner[0],
        owner: 'T',
        shopName: 'T',
        seed: 5
      });
      G.tut = 99;
      G.cash = 1e7;
      KE.G = G;
      KE.UI.go('buro');
    });
    const before = await page.evaluate(() => ({ staff: KE.G.staff.length, cash: KE.G.cash }));
    const sel = '[data-a="hireWorker"]';
    for (let i = 0; i < 10; i++) await page.click(sel, { timeout: 1000 }).catch(() => {});
    const after = await page.evaluate(() => ({
      staff: KE.G.staff.length,
      cash: KE.G.cash,
      ids: new Set(KE.G.staff.map((s) => s.id)).size,
      caps: KE.G.branches.map((b) =>
        ['salon', 'destek', 'yonetim'].map(
          (g) =>
            KE.branchStaff(KE.G, b).filter((s) => KE.staffGroup(s.role) === g).length + '/' + KE.staffCaps(KE.G, b)[g]
        )
      )
    }));
    res.rapidClicks = { before, after, errors: errs.slice(0, 3) };
    await ctx.close();
  }
  await br.close();
  console.log(JSON.stringify(res, null, 1));
})();
