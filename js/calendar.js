/* Kebab Empire — takvim: dini ve resmî bayramlar, Ramazan, iftar saati, yıllık ekonomi ayarları.
   Hiçbir tarih elle yazılmaz: hicri tarihler tablo usulü (aritmetik) hicri takvimden, iftar saati
   İstanbul'un gün batımından hesaplanır. Diyanet'in ilan ettiği tarihlerle bir gün kayma olabilecek
   yıllar için KE.CAL.OVERRIDES kullanılır (uzaktan ayarla da güncellenebilir). */
(function () {
  const C = KE.CAL = /** @type {KE_CAL} */ ({});
  const DAY = 86400000;
  const iso = (/** @type {number} */ t) => new Date(t).toISOString().slice(0, 10);

  /* ---------- Hicri ↔ Miladi (tablo usulü, 30 yıllık döngü) ---------- */
  const EPOCH = 1948439.5; // 1 Muharrem 1 (Julyen gün sayısı)
  const jdToMs = (/** @type {number} */ jd) => (jd - 2440587.5) * DAY;
  const msToJd = (/** @type {number} */ ms) => ms / DAY + 2440587.5;
  C.hijriToUtc = (y, m, d) => jdToMs(d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + EPOCH - 1);
  C.utcToHijri = function (ms) {
    const jd = Math.floor(msToJd(ms)) + 0.5;
    const y = Math.floor((30 * (jd - EPOCH) + 10646) / 10631);
    const m = Math.min(12, Math.ceil((jd - (29 + C.hijriToJd(y, 1, 1))) / 29.5) + 1);
    const d = jd - C.hijriToJd(y, m, 1) + 1;
    return { y, m, d };
  };
  C.hijriToJd = (y, m, d) => d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + EPOCH - 1;

  /* Diyanet takvimiyle bilinen farklar: { 'H1447-9': '2026-02-19' } biçiminde ayın ilk günü */
  C.OVERRIDES = {
    'H1447-9': '2026-02-19', 'H1447-10': '2026-03-20', 'H1447-12': '2026-05-18',
    'H1448-9': '2027-02-08', 'H1448-10': '2027-03-09', 'H1448-12': '2027-05-07'
  };
  /* Hicri ayın ilk gününün UTC zaman damgası */
  C.monthStart = function (hy, hm) {
    const o = C.OVERRIDES['H' + hy + '-' + hm];
    return o ? Date.parse(o + 'T00:00:00Z') : C.hijriToUtc(hy, hm, 1);
  };

  /* ---------- Bir yılın bayram ve tatil tablosu (önbellekli) ---------- */
  const NATIONAL = [['01-01', 'Yılbaşı'], ['04-23', 'Ulusal Egemenlik ve Çocuk Bayramı'], ['05-01', 'Emek ve Dayanışma Günü'], ['05-19', 'Gençlik ve Spor Bayramı'], ['07-15', 'Demokrasi ve Millî Birlik Günü'], ['08-30', 'Zafer Bayramı'], ['10-29', 'Cumhuriyet Bayramı']];
  /** @type {Record<number, CalYear>} */
  const cache = {};
  C.year = function (gy) {
    if (cache[gy]) return cache[gy];
    /** @type {CalYear} */
    const out = { holidays: {}, religious: {}, ramazans: [] };
    NATIONAL.forEach(([md, n]) => { out.holidays[gy + '-' + md] = n; });
    const lo = Date.UTC(gy, 0, 1), hi = Date.UTC(gy + 1, 0, 1);
    const h0 = C.utcToHijri(lo).y;
    for (let hy = h0 - 1; hy <= h0 + 1; hy++) {
      const ram = C.monthStart(hy, 9), sev = C.monthStart(hy, 10), zil = C.monthStart(hy, 12);
      if (ram < hi && sev > lo) out.ramazans.push({ start: iso(ram), end: iso(sev - DAY) });
      for (let i = 0; i < 3; i++) { const t = sev + i * DAY; if (t >= lo && t < hi) out.religious[iso(t)] = out.holidays[iso(t)] = 'Ramazan Bayramı'; }
      for (let i = 9; i < 13; i++) { const t = zil + i * DAY; if (t >= lo && t < hi) out.religious[iso(t)] = out.holidays[iso(t)] = 'Kurban Bayramı'; }
    }
    out.ramazan = out.ramazans.find((r) => r.start.slice(0, 4) === String(gy)) || out.ramazans[0] || null;
    return (cache[gy] = out);
  };
  C.holidayOn = (t) => C.year(new Date(t).getUTCFullYear()).holidays[iso(t)] || null;
  C.religiousOn = (t) => C.year(new Date(t).getUTCFullYear()).religious[iso(t)] || null;
  /* Ramazan'daysa { start, end, dayNo } */
  C.ramazanOn = function (t) {
    const s = iso(t);
    for (const r of C.year(new Date(t).getUTCFullYear()).ramazans) {
      if (s >= r.start && s <= r.end) return Object.assign({ dayNo: Math.round((Date.parse(s) - Date.parse(r.start)) / DAY) + 1 }, r);
    }
    return null;
  };
  /* Ayda bayram var mı (ikramiye için): ay anahtarı → bayram adı */
  C.bonusMonth = function (key) {
    const [y, m] = key.split('-').map(Number);
    const hol = C.year(y).religious;
    const k = Object.keys(hol).find((d) => +d.slice(5, 7) === m);
    return k ? hol[k] : null;
  };

  /* ---------- Gün batımı (NOAA yaklaşımı), İstanbul: 41.01K, 28.98D, UTC+3 ---------- */
  C.LAT = 41.0082; C.LON = 28.9784; C.TZ = 3;
  C.sunsetMinute = function (t) {
    const d = new Date(t);
    const start = Date.UTC(d.getUTCFullYear(), 0, 0);
    const n = Math.floor((t - start) / DAY);
    const rad = Math.PI / 180;
    const g = 2 * Math.PI / 365 * (n - 1 + 0.5);
    const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(C.LAT * rad) * Math.cos(decl)) - Math.tan(C.LAT * rad) * Math.tan(decl)) / rad;
    const utcMin = 720 - 4 * (C.LON - ha) - eq;
    return Math.round(utcMin + C.TZ * 60 + 2); // +2 dk Diyanet temkini
  };

  /* ---------- Yıllık ekonomi ayarları ----------
     Bilinen yıllar elle; sonrası son bilinen yıldan yıllık artışla türetilir. */
  C.ECON_YEARS = {
    2026: { asgariBrut: 33030, gvDilim: [[190000, 0.15], [400000, 0.20], [1500000, 0.27], [5300000, 0.35], [Infinity, 0.40]] }
  };
  C.ECON_GROWTH = 1.27; // bilinmeyen yıllar için asgari ücret ve dilim artışı
  C.econYear = function (y) {
    if (C.ECON_YEARS[y]) return C.ECON_YEARS[y];
    const known = Object.keys(C.ECON_YEARS).map(Number).filter((k) => k < y).sort((a, b) => b - a)[0] || 2026;
    const base = C.ECON_YEARS[known], k = Math.pow(C.ECON_GROWTH, y - known);
    return { asgariBrut: Math.round(base.asgariBrut * k / 10) * 10, gvDilim: base.gvDilim.map(([lim, r]) => [lim === Infinity ? Infinity : Math.round(lim * k / 1000) * 1000, r]) };
  };
  /* Oyunun içinde bulunduğu yılın ayarlarını KE.ECON'a uygula */
  C.applyYear = function (y) {
    const e = C.econYear(y);
    KE.ECON.asgariBrut = e.asgariBrut;
    KE.ECON.gvDilim = e.gvDilim;
    KE.ECON.year = y;
  };
})();
