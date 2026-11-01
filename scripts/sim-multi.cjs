/* Çok tohumlu denge ölçümü: her mod × politika × tohum için yıllık simülasyonu koşturur,
   dönem günlerinin ve imparatorluk gününün medyanını ve aralığını yazar.
   Kullanım: node scripts/sim-multi.cjs  (SEEDS=10 POLICIES=dikkatli,tembel MODES=doner,kebap JOBS=4) */
const { execFile } = require('child_process');
const path = require('path');
const SEEDS = +(process.env.SEEDS || 10), JOBS = +(process.env.JOBS || 4);
const modes = (process.env.MODES || 'doner,kebap').split(','), pols = (process.env.POLICIES || 'dikkatli,tembel').split(',');
const runs = [];
modes.forEach((m) => pols.forEach((p) => { for (let i = 0; i < SEEDS; i++) runs.push({ m, p, seed: 1000 + i * 37 }); }));
const res = [];
const one = (r) => new Promise((ok) => execFile('node', [path.join(__dirname, 'sim-year.cjs')], { env: Object.assign({}, process.env, { MODES: r.m, FARM: '0', SEED: String(r.seed), POLICY: r.p, STOP: '1', DAYS: '450' }), maxBuffer: 1 << 24 }, (e, out) => {
  const g = (re) => { const x = out.match(re); return x ? +x[1] : null; };
  res.push(Object.assign({}, r, { e2: g(/dönem 2 .*gün (\d+)/), e3: g(/dönem 3 .*gün (\d+)/), e4: g(/dönem 4 .*gün (\d+)/), emp: g(/İMPARATOR: gün (\d+)/), insp: (out.match(/müfettiş /g) || []).length, pass: (out.match(/müfettiş GEÇTİ/g) || []).length }));
  process.stderr.write('.'); ok();
}));
(async () => {
  const q = runs.slice();
  await Promise.all(Array.from({ length: JOBS }, async () => { while (q.length) await one(q.shift()); }));
  const med = (a) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : null; };
  const rng = (a) => { const b = a.filter((x) => x != null); return b.length ? `${Math.min(...b)}–${Math.max(...b)}` : '—'; };
  console.log('\nmod     politika   n   2.dönem      3.dönem      4.dönem      imparatorluk   ulaşamayan  müfettiş(geçti/ziyaret)');
  modes.forEach((m) => pols.forEach((p) => {
    const R = res.filter((x) => x.m === m && x.p === p);
    const col = (k) => `${String(med(R.map((x) => x[k]))).padStart(3)} (${rng(R.map((x) => x[k]))})`.padEnd(13);
    console.log(`${m.padEnd(7)} ${p.padEnd(9)} ${String(R.length).padStart(2)}  ${col('e2')}${col('e3')}${col('e4')}${col('emp')}  ${String(R.filter((x) => x.emp == null).length).padStart(5)}       ${R.reduce((a, x) => a + x.pass, 0)}/${R.reduce((a, x) => a + x.insp, 0)}`);
  }));
})();
