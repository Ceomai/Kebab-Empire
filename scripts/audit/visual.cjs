/* Görsel denetim: cihaz boyutları × ekranlar/pencereler. Taşma, kesilen yazı, üst üste binen
   ve çok küçük dokunma hedefleri. Kullanım: node scripts/audit/visual.cjs [ekran görüntüsü klasörü] */
const pw = require('playwright');
const fs = require('fs');
const OUT = process.argv[2] || 'reports/screens';
fs.mkdirSync(OUT, { recursive: true });
const DEV = { se: [320, 568], s: [360, 640], p: [390, 844], pm: [430, 932], tab: [768, 1024], land: [844, 390], desk: [1366, 768] };
const SCREENS = ['title', 'map', 'shop', 'hal', 'lonca', 'buro', 'terzi', 'dekor', 'banka', 'belediye', 'ajans', 'kahve', 'office', 'subeler', 'ciftlik', 'guide'];
const MODALS = ['menu', 'closing', 'event', 'mid', 'places', 'race'];
(async () => {
  const br = await pw.chromium.launch();
  const out = { checked: 0, issues: [] };
  for (const [dn, [w, h]] of Object.entries(DEV)) {
    const ctx = await br.newContext({ viewport: { width: w, height: h }, isMobile: w < 900, hasTouch: w < 900 });
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(process.env.URL || 'http://localhost:4173/');
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('kebab-empire-lang', 'tr'); });
    await page.reload(); await page.waitForTimeout(1200);
    await page.evaluate(() => { const G = KE.newGame({ mode: 'kebap', district: 'kadiceşme', master: KE.MASTER_TEMPLATES.kebap[0], owner: 'Denetçi', shopName: 'Uzun Adlı Köz Ocakbaşı Lokantası', seed: 12 }); G.tut = 99; KE.G = G; G.cash = 9e7; G.era = 4; for (let i = 0; i < 8; i++) { if (G.pendingEvent) KE.resolveEvent(G, 0); KE.startService(G); KE.finishService(G); KE.finalizeDay(G); } ['besiktepe', 'sultanpazari'].forEach((d) => KE.openBranch(G, d)); KE.buyFarm(G); });
    const audit = async (name) => {
      out.checked++;
      const r = await page.evaluate(() => {
        const W = innerWidth, H = innerHeight, issues = [];
        const vis = (e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.visibility !== 'hidden' && c.display !== 'none' && c.opacity !== '0'; };
        const scroller = (e) => e.closest('.guide-toc,.tb-row,.branchbar,.mapframe,.tabs,.seg.wide,.guide-nav,.chips.scroll,.sheet-grid,table,.tablewrap,.t-sky,.t-street,.t-sea,.title2 .t-shop,.stagewrap');
        if (document.documentElement.scrollWidth > W + 1) issues.push('sayfa yatay taşıyor ' + document.documentElement.scrollWidth);
        document.querySelectorAll('button, a, .btn, .chip, h1, h2, h3, b, small, .kpi, .cs-row, label').forEach((e) => {
          if (!vis(e) || scroller(e)) return;
          const r = e.getBoundingClientRect(), c = getComputedStyle(e);
          if (r.right > W + 1 && c.position !== 'fixed') issues.push('ekran dışına taşıyor: ' + (e.textContent || e.className).trim().slice(0, 30));
          if ((c.overflow === 'hidden' || c.overflowX === 'hidden' || c.overflowX === 'clip') && c.whiteSpace === 'nowrap' && c.textOverflow !== 'ellipsis' && e.scrollWidth > e.clientWidth + 2) issues.push('yazı kesiliyor: ' + e.textContent.trim().slice(0, 30));
        });
        /* yalnızca gerçekten görünen (üstte kalan) düğmeler: arkada kalan içerik çakışma sayılmaz */
        const onTop = (e) => { const r = e.getBoundingClientRect(); const x = Math.min(W - 1, Math.max(0, r.left + r.width / 2)), y = Math.min(H - 1, Math.max(0, r.top + r.height / 2)); const t = document.elementFromPoint(x, y); return t && (t === e || e.contains(t)); };
        const btns = [...document.querySelectorAll('[data-a]:not([disabled])')].filter((e) => vis(e) && !e.closest('svg') && !e.classList.contains('cb-col') && !e.matches('.dl, .place, .cp-pl') && onTop(e));
        btns.forEach((e) => { const r = e.getBoundingClientRect(); if ((r.width < 28 || r.height < 28) && r.top < H && r.bottom > 0 && !scroller(e)) issues.push('küçük dokunma hedefi ' + Math.round(r.width) + '×' + Math.round(r.height) + ': ' + ((e.getAttribute('aria-label') || e.textContent).trim().slice(0, 24))); });
        for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) {
          const a = btns.at(i), b = btns.at(j); if (a.contains(b) || b.contains(a)) continue;
          const A = a.getBoundingClientRect(), B = b.getBoundingClientRect();
          const ix = Math.max(0, Math.min(A.right, B.right) - Math.max(A.left, B.left)), iy = Math.max(0, Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top));
          if (ix * iy > 0.3 * Math.min(A.width * A.height, B.width * B.height) && A.top < H && A.bottom > 0) issues.push('üst üste düğme: ' + (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 18) + ' / ' + (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 18));
        }
        return [...new Set(issues)].slice(0, 12);
      });
      if (r.length) { out.issues.push({ device: dn, view: name, issues: r }); await page.screenshot({ path: `${OUT}/v-${dn}-${name}.png` }); }
    };
    for (const s of SCREENS) { await page.evaluate((s) => { KE.G.pendingEvent = null; KE.UI.holdEvent = true; document.querySelectorAll('.modal-bg').forEach((m) => m.remove()); if (s === 'title') { KE.UI.go('title'); } else KE.UI.go(s); }, s); await page.waitForTimeout(250); await audit(s); }
    for (const m of MODALS) {
      await page.evaluate((m) => {
        document.querySelectorAll('.modal-bg').forEach((x) => x.remove());
        const G = KE.G, UI = KE.UI;
        UI.go('shop');
        if (m === 'menu') UI.A.menu();
        if (m === 'places') UI.A.places();
        if (m === 'race') UI.A.race();
        if (m === 'event') { G.pendingEvent = KE.rollEvent(Object.assign(G, {})) || { id: 'x', title: 'Deneme olayı uzun başlık', text: 'Metin '.repeat(30), choices: [{ label: 'Bir', desc: 'Açıklama '.repeat(6) }, { label: 'İki', desc: 'Kısa' }] }; UI.H.showEvent(); }
        if (m === 'mid') { G.phase = 'service'; G.live = {}; G.branches.forEach((x) => { G.live[x.id] = KE.newLive(G, x); }); G.mid = { id: 'otobus', bid: G.branches[0].id, minute: 0, choice: null }; UI.H.showMid(); }
        if (m === 'closing') { G.phase = 'morning'; G.live = null; KE.startService(G); KE.finishService(G); UI.H.showClosing(); }
      }, m);
      await page.waitForTimeout(250); await audit('modal-' + m);
      await page.evaluate(() => { const G = KE.G; if (G.phase !== 'morning') { G.phase = 'morning'; G.live = null; G.mid = null; } G.pendingEvent = null; });
    }
    if (errs.length) out.issues.push({ device: dn, view: 'sayfa hatası', issues: errs.slice(0, 3) });
    await ctx.close();
  }
  await br.close();
  console.log(JSON.stringify(out, null, 1));
})();
