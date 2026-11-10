/* Arayüz denetimi: 20 oyuncu profili, rastgele ama tohumlu etkileşim (Playwright).
   Her adımdan sonra: sayfa hatası, ekranda NaN/undefined/[object, yatay taşma, oyun durumu bozulması.
   Kullanım: npx vite preview --port 4173 & ; node scripts/audit/personas.cjs [adım=120] [çıktı klasörü]
   Çıktı: JSON özet stdout'a, hata ekran görüntüleri klasöre. */
const pw = require('playwright');
const fs = require('fs');
const STEPS = +(process.argv[2] || 120);
const OUT = process.argv[3] || 'reports/screens';
const URL = process.env.URL || 'http://localhost:4173/';
fs.mkdirSync(OUT, { recursive: true });
const PHONE = { width: 390, height: 844 },
  SMALL = { width: 360, height: 640 },
  LAND = { width: 844, height: 390 },
  TAB = { width: 820, height: 1180 },
  DESK = { width: 1440, height: 900 };
const P = [
  { id: 'yeni-oyuncu', vp: PHONE, start: 'ui', tut: true },
  { id: 'donen-oyuncu', vp: PHONE, start: 'save', days: 40, reloadEvery: 25 },
  { id: 'kisa-oturum', vp: PHONE, start: 'ui', steps: 8 },
  { id: 'hizli-gezinen', vp: PHONE, start: 'save', days: 20, fast: true },
  { id: 'hata-yapip-duzelten', vp: PHONE, start: 'save', days: 15, undo: true },
  { id: 'zayif-baglanti', vp: PHONE, start: 'save', days: 15, offline: true },
  { id: 'kapat-ac', vp: PHONE, start: 'save', days: 10, reloadEvery: 6 },
  { id: 'uzun-gecmis', vp: PHONE, start: 'save', days: 180, big: true },
  { id: 'kucuk-ekran', vp: SMALL, start: 'save', days: 30 },
  { id: 'yatay-ekran', vp: LAND, start: 'save', days: 30 },
  { id: 'tablet', vp: TAB, start: 'save', days: 30 },
  { id: 'masaustu', vp: DESK, start: 'save', days: 30 },
  { id: 'ekran-donduren', vp: PHONE, start: 'save', days: 25, rotate: true },
  { id: 'emoji-adli', vp: PHONE, start: 'ui', names: ['🥙🔥'.repeat(20), '<b>x</b>"\'&;'.repeat(5)] },
  { id: 'ingilizce', vp: PHONE, start: 'save', days: 20, lang: 'en' },
  { id: 'almanca', vp: SMALL, start: 'save', days: 20, lang: 'de' },
  { id: 'kebapci', vp: PHONE, start: 'save', days: 60, mode: 'kebap' },
  { id: 'yaris', vp: PHONE, start: 'race' },
  { id: 'geri-tusu', vp: PHONE, start: 'save', days: 12, back: true },
  { id: 'imparator', vp: PHONE, start: 'save', days: 30, empire: true }
];
function prng(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const SKIP = new Set([
  'importSave',
  'exportSave',
  'linkMail',
  'deleteData',
  'deleteDataYes',
  'useCloud',
  'cloudLoad',
  'consentSave',
  'privacy',
  'legal'
]);
(async () => {
  const br = await pw.chromium.launch();
  const all = [];
  const [from, to] = (process.env.PERSONAS || '0-' + (P.length - 1)).split('-').map(Number);
  for (let pi = from; pi <= Math.min(to, P.length - 1); pi++) {
    const p = P[pi],
      r = prng(1000 + pi * 97);
    const ctx = await br.newContext({
      viewport: p.vp,
      isMobile: p.vp.width < 900,
      hasTouch: p.vp.width < 900,
      acceptDownloads: false
    });
    const page = await ctx.newPage();
    const rep = { persona: p.id, steps: 0, clicks: 0, errors: [], anomalies: [], reloads: 0 };
    page.on('pageerror', (e) => rep.errors.push('pageerror: ' + e.message.slice(0, 200)));
    page.on('console', (m) => {
      if (m.type() === 'error' && !/fonts|ERR_|Failed to load resource|sw\.js/.test(m.text()))
        rep.errors.push('console: ' + m.text().slice(0, 200));
    });
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    await page.goto(URL);
    await page.evaluate((lang) => {
      localStorage.clear();
      localStorage.setItem('kebab-empire-lang', lang);
    }, p.lang || 'tr');
    if (p.start === 'save') {
      await page.evaluate((o) => {
        const G = KE.newGame({
          mode: o.mode || 'doner',
          district: 'kadiceşme',
          master: KE.MASTER_TEMPLATES[o.mode || 'doner'][0],
          owner: 'Persona',
          shopName: 'Persona Dükkânı',
          seed: 777
        });
        G.tut = 99;
        for (let i = 0; i < o.days; i++) {
          if (G.pendingEvent) KE.resolveEvent(G, i % G.pendingEvent.choices.length);
          if (o.big && i === 20) {
            G.era = 3;
            G.cash += 3e7;
            ['besiktepe', 'sultanpazari', 'bostansahil', 'kulealti'].forEach((d) => {
              const b = KE.openBranch(G, d);
              const m = KE.randomMaster(G);
              m.branchId = b.id;
              G.staff.push(m);
              const w = KE.randomWorker(G, 'kasiyer');
              w.branchId = b.id;
              G.staff.push(w);
            });
          }
          KE.startService(G);
          KE.finishService(G);
          KE.finalizeDay(G);
        }
        if (o.empire) {
          G.era = 4;
          G.flags.empire = G.day;
          G.cash = 2e8;
        }
        KE.SAVE.write(G);
      }, p);
    }
    await page.reload();
    await page.waitForTimeout(500);
    if (p.start === 'save') {
      await page.click('[data-a="continue"]').catch(() => {});
    }
    if (p.start === 'race') {
      await page.click('[data-a="race"]').catch(() => {});
      await page.waitForTimeout(200);
      await page.click('[data-a="raceStart"]').catch(() => {});
    }
    if (p.start === 'ui') {
      await page.click('[data-a="newgame"]').catch(() => {});
      await page.click('[data-a="pickMode"][data-m="doner"]').catch(() => {});
      const names = p.names || ['Ali', 'Yaprak Döner'];
      await page.fill('#ng-owner', names[0]).catch(() => {});
      await page.fill('#ng-shop', names[1]).catch(() => {});
      await page.click('[data-a="ngStep"][data-to="newDistrict"]').catch(() => {});
      await page.click('.dl[data-d="kadiceşme"]').catch(() => {});
      await page.click('[data-a="ngStep"][data-to="newMaster"]').catch(() => {});
      await page.click('[data-a="pickMaster"][data-i="0"]').catch(() => {});
      await page.click('[data-a="startGame"]').catch(() => {});
      await page.waitForTimeout(300);
    }
    const steps = p.steps || STEPS;
    let shot = 0;
    for (let s = 0; s < steps; s++) {
      rep.steps++;
      try {
        if (p.reloadEvery && s && s % p.reloadEvery === 0) {
          await page.reload();
          rep.reloads++;
          await page.waitForTimeout(300);
          await page.click('[data-a="continue"]', { timeout: 800 }).catch(() => {});
          continue;
        }
        if (p.offline && s % 15 === 5) await ctx.setOffline(true);
        if (p.offline && s % 15 === 12) await ctx.setOffline(false);
        if (p.rotate && s % 10 === 9) await page.setViewportSize(page.viewportSize().width < 600 ? LAND : PHONE);
        if (p.back && s % 7 === 6) {
          await page.goBack().catch(() => {});
          continue;
        }
        if (p.undo && s % 9 === 8) {
          await page.click('#undochip', { timeout: 300 }).catch(() => {});
        }
        /* görünür, tıklanabilir öğeleri tek çağrıda işaretle */
        const n = await page.evaluate(
          (skip) => {
            let i = 0;
            document.querySelectorAll('[data-audit-i]').forEach((e) => e.removeAttribute('data-audit-i'));
            document.querySelectorAll('[data-a]:not([disabled])').forEach((e) => {
              if (skip.includes(e.dataset.a)) return;
              const r = e.getBoundingClientRect();
              if (r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight * 3)
                e.setAttribute('data-audit-i', String(i++));
            });
            return i;
          },
          [...SKIP]
        );
        const vis = Array.from({ length: n }, (_, i) => `[data-audit-i="${i}"]`);
        const inputs = await page.$$('input[type=text], input:not([type]), input[type=number]');
        if (inputs.length && r() < 0.12) {
          const inp = inputs[Math.floor(r() * inputs.length)];
          const txt = ['', '0', '-5', '99999999999', '🥙🥙🥙', 'x'.repeat(300), '<script>', '١٢٣'][Math.floor(r() * 8)];
          await inp.fill(txt).catch(() => {});
          await inp.dispatchEvent('change').catch(() => {});
        }
        if (!vis.length) {
          await page.waitForTimeout(100);
          continue;
        }
        const el = vis[Math.floor(r() * vis.length)];
        await page.click(el, { timeout: 1500 }).catch(() => {});
        rep.clicks++;
        if (p.fast) await page.waitForTimeout(20);
        else await page.waitForTimeout(80);
        /* servisteyse hızlandır ve biraz bekle */
        await page.evaluate(() => {
          if (KE.G && KE.G.phase === 'service') KE.G.speed = 4;
        });
        const st = await page.evaluate(() => {
          const out = [];
          const txt = document.body.innerText || '';
          for (const bad of ['NaN', 'undefined', '[object Object]', 'Infinity', 'null ₺'])
            if (txt.includes(bad))
              out.push(
                'ekranda "' +
                  bad +
                  '": …' +
                  txt.slice(Math.max(0, txt.indexOf(bad) - 40), txt.indexOf(bad) + 20).replace(/\s+/g, ' ') +
                  '…'
              );
          if (document.documentElement.scrollWidth > innerWidth + 1)
            out.push('yatay taşma ' + document.documentElement.scrollWidth + '>' + innerWidth);
          /* sayfa kırpıldığı için (overflow-x: clip) öğeleri tek tek ölç; bilerek kaydırılan şeritler hariç */
          const scr = (e) =>
            e.closest('.guide-toc,.tb-row,.branchbar,.mapframe,.tabs,.seg.wide,table,.stagewrap,.title2,.sheet-grid');
          for (const e of document.querySelectorAll('button, .btn, .card, .panel, h1, h2, h3, p')) {
            const r = e.getBoundingClientRect();
            if (r.width && r.right > innerWidth + 1 && !scr(e) && getComputedStyle(e).position !== 'fixed') {
              out.push('ekran dışına taşan öğe: ' + (e.textContent || '').trim().slice(0, 30));
              break;
            }
          }
          const G = KE.G;
          if (G) {
            if (!Number.isFinite(G.cash)) out.push('kasa sayı değil');
            if (!Number.isFinite(G.reputation)) out.push('itibar sayı değil');
            if (G.staff.some((x) => !G.branches.some((b) => b.id === x.branchId))) out.push('şubesiz personel');
          }
          return { out, screen: KE.UI && KE.UI.screen, phase: G && G.phase };
        });
        st.out.forEach((a) => {
          const key = a.slice(0, 60);
          if (!rep.anomalies.some((x) => x.startsWith(key))) rep.anomalies.push(a + ` [${st.screen}/${st.phase}]`);
        });
        if ((st.out.length || rep.errors.length) && shot < 3) {
          shot++;
          await page.screenshot({ path: `${OUT}/${p.id}-${s}.png` }).catch(() => {});
        }
      } catch (e) {
        rep.errors.push('runner: ' + String(e.message || e).slice(0, 160));
      }
    }
    await ctx.setOffline(false).catch(() => {});
    /* kalıcılık: yeniden aç, oyun aynı günde mi */
    const before = await page
      .evaluate(() => (KE.G && !KE.G.race ? { day: KE.G.day, phase: KE.G.phase } : null))
      .catch(() => null);
    if (before && before.phase === 'morning') {
      await page.evaluate(() => KE.UI.save());
      await page.reload();
      await page.waitForTimeout(300);
      await page.click('[data-a="continue"]').catch(() => {});
      const after = await page.evaluate(() => KE.G && KE.G.day).catch(() => null);
      if (after !== before.day) rep.anomalies.push(`kalıcılık: gün ${before.day} kaydedildi, ${after} açıldı`);
    }
    rep.errors = [...new Set(rep.errors)].slice(0, 8);
    all.push(rep);
    fs.writeFileSync(`${OUT}/personas-${from}-${to}.json`, JSON.stringify(all, null, 1));
    process.stderr.write(`${p.id}: ${rep.clicks} tık, ${rep.errors.length} hata, ${rep.anomalies.length} anomali\n`);
    await ctx.close();
  }
  await br.close();
  console.log(JSON.stringify(all, null, 1));
})();
