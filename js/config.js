/* Kebab Empire — uzaktan ayar
   Yeni sürüm çıkmadan denge ve takvim ayarı değiştirmek için. Önce yerel önbellek, sonra
   config.json (yayınla birlikte gelir) ve varsa Supabase'deki remote_config satırı uygulanır.
   Yalnızca beyaz listedeki anahtarlar kabul edilir; bilinmeyen anahtar yok sayılır. */
(function () {
  /** @type {any} */
  const CFG = KE.CONFIG = { applied: null, version: 0 };
  const CACHE = 'kebab-empire-config';
  const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);
  const num = (v, lo, hi) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi;

  /* anahtar → uygulayıcı */
  const APPLY = {
    econYears: (v) => { if (!isObj(v)) return; Object.entries(v).forEach(([y, e]) => { if (!/^\d{4}$/.test(y) || !isObj(e) || !num(e.asgariBrut, 10000, 1e7)) return; const dil = Array.isArray(e.gvDilim) ? e.gvDilim.map(([l, r]) => [l == null ? Infinity : l, r]) : KE.CAL.econYear(+y).gvDilim; KE.CAL.ECON_YEARS[y] = { asgariBrut: e.asgariBrut, gvDilim: dil }; }); },
    econGrowth: (v) => { if (num(v, 1, 3)) KE.CAL.ECON_GROWTH = v; },
    hijriOverrides: (v) => { if (!isObj(v)) return; Object.entries(v).forEach(([k, d]) => { if (/^H\d{4}-\d{1,2}$/.test(k) && /^\d{4}-\d{2}-\d{2}$/.test(d)) KE.CAL.OVERRIDES[k] = d; }); },
    ramazanRate: (v) => { if (isObj(v)) Object.entries(v).forEach(([k, x]) => { if (k in KE.RAMAZAN_RATE && num(x, 0, 10)) KE.RAMAZAN_RATE[k] = x; }); },
    trafficMul: (v) => { if (isObj(v)) Object.entries(v).forEach(([m, x]) => { if (KE.MODES[m] && num(x, 0.1, 5)) KE.MODES[m].trafficMul = x; }); },
    monthlyInflation: (v) => { if (num(v, 0, 0.2)) KE.ECON.aylikEnflasyon = v; },
    message: (v) => { if (typeof v === 'string' && v.length < 300) CFG.message = v; }
  };
  CFG.apply = function (c) {
    if (!isObj(c)) return false;
    Object.entries(c).forEach(([k, v]) => { if (APPLY[k]) { try { APPLY[k](v); } catch (e) { /* bozuk alanı atla */ } } });
    if (num(c.version, 0, 1e9)) CFG.version = c.version;
    CFG.applied = c;
    return true;
  };
  CFG.load = async function () {
    try { const cached = JSON.parse(localStorage.getItem(CACHE) || 'null'); if (cached) CFG.apply(cached); } catch (e) { /* yok */ }
    const sources = [];
    try { const r = await fetch('config.json', { cache: 'no-cache' }); if (r.ok) sources.push(await r.json()); } catch (e) { /* çevrimdışı */ }
    if (KE.CLOUD && KE.CLOUD.fetchConfig) { try { const rc = await KE.CLOUD.fetchConfig(); if (rc) sources.push(rc); } catch (e) { /* yok */ } }
    const best = sources.filter(isObj).sort((a, b) => (a.version || 0) - (b.version || 0)).pop();
    if (best && (best.version || 0) >= CFG.version) { CFG.apply(best); try { localStorage.setItem(CACHE, JSON.stringify(best)); } catch (e) { /* yok */ } }
    return CFG.applied;
  };
})();
