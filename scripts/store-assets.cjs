/* Mağaza görselleri: Google Play ve App Store ekran görüntüleri + Play öne çıkan görseli (1024×500).
   Kullanım: npm run build && npx vite preview --port 4173 &  →  node scripts/store-assets.cjs [tr|en]
   Çıktı: store/<dil>/... (depoda tutulur, mağazaya elle yüklenir) */
const pw = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.URL || 'http://localhost:4173/';
const LANG = process.argv[2] || 'tr';
const OUT = path.join('store', LANG);
fs.mkdirSync(OUT, { recursive: true });
/* hedef piksel boyutu = görünüm × ölçek */
const DEVICES = {
  'play-phone': { w: 360, h: 640, s: 3 }, // 1080×1920
  'appstore-iphone-6.9': { w: 440, h: 956, s: 3 }, // 1320×2868
  'appstore-ipad-13': { w: 1032, h: 1376, s: 2 } // 2064×2752
};
const SHOTS = ['map', 'service', 'counter', 'morning', 'closing'];

async function setup(page) {
  await page.goto(URL);
  await page.evaluate((l) => {
    localStorage.clear();
    localStorage.setItem('kebab-empire-lang', l);
  }, LANG);
  await page.reload();
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const G = KE.newGame({
      mode: 'doner',
      district: 'kadiceşme',
      master: KE.MASTER_TEMPLATES.doner[0],
      owner: 'Ali',
      shopName: 'Ali Usta Döner',
      seed: 21
    });
    G.tut = 99;
    KE.G = G;
    for (let i = 0; i < 12; i++) {
      if (G.pendingEvent) KE.resolveEvent(G, 0);
      KE.startService(G);
      KE.finishService(G);
      KE.finalizeDay(G);
    }
    G.cash = Math.max(G.cash, 4e6);
    G.era = Math.max(G.era || 1, 2);
    KE.openBranch(G, 'besiktepe');
    G.pendingEvent = null;
    KE.UI.holdEvent = true;
  });
}
async function shot(page, name, file) {
  await page.evaluate(() => document.querySelectorAll('.modal-bg, .toast').forEach((m) => m.remove()));
  if (name === 'map') {
    await page.evaluate(() => KE.UI.go('map'));
    await page.waitForTimeout(700);
  }
  if (name === 'morning') {
    await page.evaluate(() => {
      const G = KE.G;
      G.phase = 'morning';
      G.live = null;
      KE.UI.go('shop');
    });
    await page.waitForTimeout(500);
  }
  if (name === 'service' || name === 'counter') {
    await page.evaluate(() => {
      const G = KE.G;
      if (G.phase !== 'service') KE.startService(G);
      G.speed = 4;
      KE.UI.go('shop');
      KE.UI.startLoop();
    });
    await page.waitForTimeout(name === 'service' ? 9000 : 6000);
    await page.evaluate(() => {
      KE.G.speed = 1;
    });
    if (name === 'counter') {
      await page.evaluate(() => {
        const L = KE.G.live[KE.G.activeBranch];
        if (!L.player.active) KE.UI.A.tezgah();
      });
      await page.waitForTimeout(2500);
    }
    await page.evaluate(() => scrollTo(0, 0));
  }
  if (name === 'closing') {
    await page.evaluate(() => {
      const G = KE.G;
      if (G.phase !== 'service' || !G.live) {
        KE.startService(G);
        KE.UI.go('shop');
      }
      const L = G.live[G.activeBranch];
      if (L.player.active) KE.UI.A.tezgah();
      KE.UI.A.fastForward();
    });
    await page.waitForTimeout(1200);
  }
  await page.waitForTimeout(300);
  await page.screenshot({ path: file });
}
(async () => {
  const br = await pw.chromium.launch();
  for (const [dev, d] of Object.entries(DEVICES)) {
    const ctx = await br.newContext({
      viewport: { width: d.w, height: d.h },
      deviceScaleFactor: d.s,
      isMobile: d.w < 900,
      hasTouch: true
    });
    const page = await ctx.newPage();
    await setup(page);
    let i = 1;
    for (const s of SHOTS) await shot(page, s, path.join(OUT, `${dev}-${i++}-${s}.png`));
    await ctx.close();
  }
  /* Play öne çıkan görseli: logo, ad, döner şişleri */
  const page = await br.newPage({ viewport: { width: 1024, height: 500 } });
  await page.goto(URL);
  await page.waitForTimeout(800);
  const tag = LANG === 'en' ? 'Build your döner empire, one wrap at a time' : 'Döner imparatorluğunu dürüm dürüm kur';
  await page.evaluate((tag) => {
    document.body.innerHTML = `<div style="width:1024px;height:500px;display:flex;align-items:center;gap:40px;padding:0 60px;box-sizing:border-box;background:radial-gradient(ellipse at 30% 40%,#a8343f,#4a1220 70%);font-family:'Baloo 2',sans-serif;color:#fff">
      <div style="width:190px;flex:none">${KE.ART.logo()}</div>
      <div style="flex:1"><div style="font-size:84px;font-weight:800;line-height:1;color:#ffc93c;text-shadow:0 6px 0 #6e1424">Kebab Empire</div>
      <div style="font-size:30px;margin-top:14px;font-family:Nunito,sans-serif;font-weight:800">${tag}</div></div>
      <div style="display:flex;gap:10px;height:300px">${KE.ART.doner('et')}${KE.ART.doner('tavuk')}</div></div>`;
    document.querySelectorAll('svg').forEach((s) => {
      s.style.height = '100%';
      s.style.width = 'auto';
    });
  }, tag);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'play-feature-graphic-1024x500.png') });
  await br.close();
  console.log('store/' + LANG + ' hazır');
})();
