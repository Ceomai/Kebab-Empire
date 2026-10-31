/* Kebab Empire — şehir haritası
   İstanbul'dan esinlenen hayali şehir: boğaz, haliç, iki yaka, adalar, iki asma köprü.
   Binalar izometrik olarak üretilir (her semtin kendi karakteri ve deterministik tohumu var).
   Şubesi olmayan semtler soluk ve tıklanamaz; tesisler ve dükkânlar tıklanabilir. */
(function () {
  const M = KE.MAP = {};
  const INK = '#3b2417';
  const OL = `stroke="${INK}" stroke-opacity=".16" stroke-width=".8" stroke-linejoin="round"`;
  const shade = (h, a) => KE.shade(h, a);
  function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; }

  /* Semt konumları (1400×860 tuval) */
  M.POS = {
    kulealti: { x: 560, y: 165 }, besiktepe: { x: 640, y: 292 }, sultanpazari: { x: 515, y: 535 },
    merterli: { x: 240, y: 430 }, kampustepe: { x: 120, y: 600 }, 'kadiceşme': { x: 905, y: 545 }, bostansahil: { x: 1130, y: 585 }
  };
  M.PLACES = [
    { id: 'hal', name: 'Hal ve Kasap', x: 345, y: 300, roof: '#c0392b', wall: '#f3d9b1', icon: 'cart', kind: 'hall' },
    { id: 'lonca', name: 'Usta Pazarı', x: 395, y: 600, roof: '#7d3c98', wall: '#f5e1c8', icon: 'chef', kind: 'arcade' },
    { id: 'office', name: 'Muhasebe', x: 655, y: 392, roof: '#1f618d', wall: '#e8edf2', icon: 'chart', kind: 'office' },
    { id: 'buro', name: 'Eleman Bürosu', x: 170, y: 300, roof: '#16a085', wall: '#eaf4f0', icon: 'users', kind: 'office' },
    { id: 'terzi', name: 'Terzi', x: 410, y: 395, roof: '#d35400', wall: '#fbe3cf', icon: 'tray', kind: 'shop' },
    { id: 'dekor', name: 'Mobilya ve Dekor', x: 405, y: 200, roof: '#117a65', wall: '#e3efe9', icon: 'store', kind: 'workshop' },
    { id: 'banka', name: 'Banka', x: 700, y: 95, roof: '#b7950b', wall: '#f7f3e6', icon: 'coin', kind: 'bank' },
    { id: 'belediye', name: 'Belediye', x: 215, y: 165, roof: '#2e4053', wall: '#eef0f2', icon: 'map', kind: 'hall2' },
    { id: 'ajans', name: 'Reklam Ajansı', x: 930, y: 265, roof: '#e74c3c', wall: '#fdeae6', icon: 'fire', kind: 'billboard' },
    { id: 'kahve', name: 'Mahalle Kahvesi', x: 1020, y: 430, roof: '#6e2c00', wall: '#f6e3c5', icon: 'heart', kind: 'cafe' },
    { id: 'subeler', name: 'Merkez Ofis', x: 1190, y: 420, roof: '#7a1f3d', wall: '#f3e6ea', icon: 'store', kind: 'hq' },
    { id: 'ciftlik', name: 'Besi Çiftliği', x: 1215, y: 150, roof: '#b83227', wall: '#f4ece1', icon: 'cow', kind: 'farm' }
  ];

  /* ---------- İzometrik çizim yardımcıları ---------- */
  let winBuf = [];
  function box(x, y, w, d, h, wall, roof, o) {
    o = o || {};
    const F = [x, y], R = [x + w, y - w / 2], Lp = [x - d, y - d / 2], Bk = [x + w - d, y - w / 2 - d / 2];
    const up = (p, k) => `${p[0]},${p[1] - k}`;
    let s = '';
    s += `<polygon points="${Lp},${F},${up(F, h)},${up(Lp, h)}" fill="${shade(wall, -28)}" ${OL}/>`;
    s += `<polygon points="${F},${R},${up(R, h)},${up(F, h)}" fill="${wall}" ${OL}/>`;
    if (o.windows !== false && h > 10) {
      const rows = Math.max(1, Math.floor((h - 6) / (o.floor || 9)));
      const cols = Math.max(1, Math.floor(w / 9));
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const u0 = (c + 0.3) / cols, u1 = (c + 0.75) / cols;
        const v0 = 4 + r * (o.floor || 9), v1 = v0 + (o.floor || 9) * 0.5;
        const P = (u, v) => `${x + w * u},${y - w / 2 * u - v}`;
        const wp = `<polygon class="win" points="${P(u0, v0)},${P(u1, v0)},${P(u1, v1)},${P(u0, v1)}"/>`;
        s += wp; if ((c + r * 3 + Math.round(x)) % 3) winBuf.push(wp);
      }
      const lr = Math.max(1, Math.floor((h - 6) / (o.floor || 9))), lc = Math.max(1, Math.floor(d / 10));
      for (let r = 0; r < lr; r++) for (let c = 0; c < lc; c++) {
        const u0 = (c + 0.3) / lc, u1 = (c + 0.7) / lc;
        const v0 = 4 + r * (o.floor || 9), v1 = v0 + (o.floor || 9) * 0.5;
        const P = (u, v) => `${x - d * u},${y - d / 2 * u - v}`;
        const wp = `<polygon class="win dim" points="${P(u0, v0)},${P(u1, v0)},${P(u1, v1)},${P(u0, v1)}"/>`;
        s += wp; if ((c + r + Math.round(y)) % 4 === 0) winBuf.push(wp);
      }
    }
    if (o.pitch) {
      const rh = o.pitch;
      const mL = [(Lp[0] + F[0]) / 2, (Lp[1] + F[1]) / 2 - h - rh], mR = [(Bk[0] + R[0]) / 2, (Bk[1] + R[1]) / 2 - h - rh];
      s += `<polygon points="${up(Lp, h)},${up(Bk, h)},${mR},${mL}" fill="${shade(roof, -25)}" ${OL}/>`;
      s += `<polygon points="${up(Lp, h)},${up(F, h)},${mL}" fill="${shade(wall, -12)}" ${OL}/>`;
      s += `<polygon points="${up(F, h)},${up(R, h)},${mR},${mL}" fill="${roof}" ${OL}/>`;
      s += `<path d="M${mL} L${mR}" stroke="${shade(roof, -40)}" stroke-width="1.4"/>`;
    } else {
      s += `<polygon points="${up(F, h)},${up(R, h)},${up(Bk, h)},${up(Lp, h)}" fill="${roof}" ${OL}/>`;
    }
    return s;
  }
  function tree(x, y, r, c) {
    c = c || '#4f9d4a';
    return `<ellipse cx="${x + 2}" cy="${y + 2}" rx="${r * 0.9}" ry="${r * 0.45}" fill="#2d5a1c" opacity=".22"/><g class="tr"><path d="M${x} ${y} v-${r * 0.7}" stroke="#7a5230" stroke-width="2.4"/><circle cx="${x}" cy="${y - r * 1.1}" r="${r}" fill="${c}"/><circle cx="${x + r * 0.3}" cy="${y - r * 0.85}" r="${r * 0.7}" fill="${shade(c, -22)}" opacity=".55"/><circle cx="${x - r * 0.35}" cy="${y - r * 1.4}" r="${r * 0.45}" fill="#fff" opacity=".28"/></g>`;
  }
  function cypress(x, y, h) { return `<ellipse cx="${x + 2}" cy="${y + 1}" rx="4" ry="2" fill="#000" opacity=".15"/><path d="M${x} ${y} q-5 -${h * 0.5} 0 -${h} q5 ${h * 0.5} 0 ${h}z" fill="#2f6b3a" ${OL}/>`; }
  function dome(x, y, r, c) { return `<path d="M${x - r} ${y} a${r} ${r * 0.95} 0 0 1 ${r * 2} 0z" fill="${c || '#9aa6ad'}" ${OL}/><path d="M${x} ${y - r * 0.95} v-${r * 0.4}" stroke="#d4ac0d" stroke-width="2"/><circle cx="${x}" cy="${y - r * 1.4}" r="1.8" fill="#d4ac0d"/>`; }
  function minaret(x, y, h) { return `<rect x="${x - 3}" y="${y - h}" width="6" height="${h}" fill="#f3efe6" ${OL}/><rect x="${x - 4.5}" y="${y - h * 0.7}" width="9" height="3" fill="#e1d9c7" ${OL}/><path d="M${x - 3} ${y - h} l3 -12 l3 12z" fill="#7f8c8d" ${OL}/>`; }
  function smoke(x, y) { return `<g class="chim-smoke"><circle cx="${x}" cy="${y}" r="4"/><circle cx="${x + 2}" cy="${y - 2}" r="5"/><circle cx="${x - 1}" cy="${y - 4}" r="6"/></g>`; }

  /* ---------- Semt kümeleri ---------- */
  const PAL = ['#f6e3c5', '#f2c6a0', '#efd9b4', '#dfe7ee', '#f3d9d0', '#e9e1cf', '#f7ead7', '#e5d3bd'];
  const ROOFS = ['#c0533a', '#b8462e', '#d06a46', '#a9432f'];
  function cluster(id) {
    const P = M.POS[id];
    const r = rng(id.split('').reduce((a, c) => a + c.charCodeAt(0) * 31, 7));
    const items = [];
    const add = (dx, dy, fn) => items.push({ y: P.y + dy, s: fn(P.x + dx, P.y + dy) });
    const houses = (n, spread, opts) => {
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2, rad = Math.sqrt(r()) * spread;
        const dx = Math.cos(a) * rad * 1.5, dy = Math.sin(a) * rad * 0.8;
        if (Math.abs(dx) < 22 && Math.abs(dy) < 14) continue;
        const w = 14 + r() * 12, d = 10 + r() * 10, h = (opts.hmin || 12) + r() * (opts.hvar || 12);
        const wall = PAL[Math.floor(r() * PAL.length)], roof = opts.roof || ROOFS[Math.floor(r() * ROOFS.length)];
        add(dx, dy, (x, y) => box(x, y, w, d, h, wall, roof, { pitch: opts.flat ? 0 : 6 + r() * 4, floor: 8 }));
      }
    };
    switch (id) {
      case 'kulealti':
        for (let i = 0; i < 9; i++) {
          const dx = (i % 3 - 1) * 46 + (r() - 0.5) * 14, dy = (Math.floor(i / 3) - 1) * 30 + (r() - 0.5) * 10;
          const h = 50 + r() * 90, w = 20 + r() * 8;
          const glass = ['#7fb3d5', '#5d8aa8', '#85c1e9', '#a9cce3', '#6c8ea4'][i % 5];
          add(dx, dy, (x, y) => box(x, y, w, w * 0.8, h, glass, shade(glass, 30), { floor: 6 }) + `<path d="M${x + 3} ${y - 6} L${x + 3} ${y - h + 4}" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>`);
        }
        break;
      case 'besiktepe':
        add(-40, -10, (x, y) => `<ellipse cx="${x}" cy="${y}" rx="44" ry="24" fill="#d5d8dc" ${OL}/><ellipse cx="${x}" cy="${y - 6}" rx="44" ry="24" fill="#2c3e50" ${OL}/><ellipse cx="${x}" cy="${y - 6}" rx="34" ry="16" fill="#58a83a"/><path d="M${x - 34} ${y - 6} h68 M${x} ${y - 22} v32" stroke="#fff" stroke-width="1.2" opacity=".8"/><ellipse cx="${x}" cy="${y - 6}" rx="8" ry="4" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/><path d="M${x - 44} ${y - 6} q44 -40 88 0" fill="none" stroke="#e5e8e8" stroke-width="2" opacity=".6"/>`);
        houses(12, 52, {});
        add(58, 28, (x, y) => `<rect x="${x - 4}" y="${y - 4}" width="34" height="8" fill="#8d6e63" ${OL}/><path d="M${x} ${y + 4} v8 M${x + 26} ${y + 4} v8" stroke="#6d4c41" stroke-width="3"/>`);
        break;
      case 'sultanpazari':
        add(0, -8, (x, y) => box(x - 20, y + 20, 48, 34, 16, '#efe6d2', '#d9cdb5', { windows: false }) + dome(x - 4, y - 12, 22, '#a5b1b8') + dome(x - 26, y - 4, 9, '#a5b1b8') + dome(x + 18, y - 4, 9, '#a5b1b8') + minaret(x - 48, y + 14, 58) + minaret(x + 44, y + 6, 58));
        for (let i = 0; i < 4; i++) add(-70 + i * 16, 36, (x, y) => dome(x, y, 7, '#b0a089'));
        houses(14, 56, { hmin: 10, hvar: 8 });
        add(-80, -30, (x) => cypress(x, P.y - 30, 22));
        add(70, -24, (x) => cypress(x, P.y - 24, 20));
        break;
      case 'merterli':
        for (let i = 0; i < 7; i++) {
          const dx = (i % 4 - 1.5) * 42 + (r() - 0.5) * 10, dy = (Math.floor(i / 4) - 0.5) * 42;
          add(dx, dy, (x, y) => {
            let s = box(x, y, 34, 22, 16, ['#d5d8dc', '#cacfd2', '#e5e7e9'][i % 3], '#95a5a6', { windows: false });
            for (let k = 0; k < 3; k++) s += `<polygon points="${x + k * 11},${y - 16 - k * 5.5} ${x + k * 11 + 11},${y - 16 - (k + 1) * 5.5} ${x + k * 11 + 11},${y - 24 - (k + 1) * 5.5}" fill="#7f8c8d" ${OL}/>`;
            if (i % 2 === 0) s += `<rect x="${x - 14}" y="${y - 46}" width="6" height="34" fill="#a04000" ${OL}/>` + smoke(x - 11, y - 50);
            return s;
          });
        }
        houses(6, 70, { flat: true, hmin: 10, hvar: 6, roof: '#b2babb' });
        break;
      case 'kampustepe':
        add(0, -6, (x, y) => box(x - 10, y + 10, 60, 26, 22, '#f2e3d0', '#a93226', { pitch: 9, floor: 9 }) + `<rect x="${x + 2}" y="${y - 48}" width="10" height="26" fill="#f2e3d0" ${OL}/><path d="M${x} ${y - 48} l7 -10 l7 10z" fill="#a93226" ${OL}/><circle cx="${x + 7}" cy="${y - 40}" r="3" fill="#fff" ${OL}/>`);
        add(-62, 30, (x, y) => `<ellipse cx="${x}" cy="${y}" rx="30" ry="12" fill="#c0392b" opacity=".75"/><ellipse cx="${x}" cy="${y}" rx="22" ry="7" fill="#58a83a"/>`);
        houses(8, 58, { hmin: 14, hvar: 10 });
        for (let i = 0; i < 7; i++) add(-60 + i * 22, -42 + (i % 2) * 8, (x, y) => tree(x, y, 6));
        break;
      case 'kadiceşme':
        houses(20, 60, { hmin: 10, hvar: 14 });
        add(-10, 34, (x, y) => `<rect x="${x - 4}" y="${y - 30}" width="8" height="30" fill="#f3efe6" ${OL}/><path d="M${x - 6} ${y - 30} l6 -10 l6 10z" fill="#7a1f3d" ${OL}/><circle cx="${x}" cy="${y - 22}" r="3" fill="#fff" ${OL}/>`);
        add(-70, 52, (x, y) => `<rect x="${x}" y="${y - 4}" width="40" height="8" fill="#8d6e63" ${OL}/><path d="M${x + 4} ${y + 4} v8 M${x + 34} ${y + 4} v8" stroke="#6d4c41" stroke-width="3"/>`);
        break;
      case 'bostansahil':
        for (let i = 0; i < 8; i++) {
          const dx = (i % 4 - 1.5) * 34 + (r() - 0.5) * 8, dy = (Math.floor(i / 4) - 0.6) * 34;
          add(dx, dy, (x, y) => box(x, y, 22, 16, 30 + r() * 20, PAL[i % PAL.length], '#e5e8e8', { floor: 7 }));
        }
        for (let i = 0; i < 9; i++) add(-90 + i * 22, 44, (x, y) => tree(x, y, 6, '#5aaa4f'));
        break;
    }
    items.sort((a, c) => a.y - c.y);
    return items.map((i) => i.s).join('');
  }

  /* ---------- Tesis binaları ---------- */
  function facility(p) {
    const x = p.x, y = p.y;
    let b = '';
    switch (p.kind) {
      case 'hall': b = box(x - 24, y + 8, 56, 32, 18, p.wall, p.roof, { pitch: 0, windows: false }) + `<path d="M${x - 50} ${y - 22} q28 -20 56 -28 q28 6 30 14" fill="${p.roof}" ${OL}/><g fill="#fff" opacity=".9"><rect x="${x - 18}" y="${y - 8}" width="8" height="10"/><rect x="${x - 4}" y="${y - 15}" width="8" height="10"/><rect x="${x + 10}" y="${y - 22}" width="8" height="10"/></g>`; break;
      case 'arcade': b = box(x - 20, y + 8, 48, 30, 20, p.wall, p.roof, { pitch: 10, windows: false }) + [0, 1, 2, 3].map((i) => `<path d="M${x - 16 + i * 11} ${y + 4 - i * 5.5} v-10 a4 4 0 0 1 8 -4 v10z" fill="#5b2c6f" opacity=".8"/>`).join('') + `<rect x="${x - 8}" y="${y - 52}" width="3" height="26" fill="#6e2c00"/><path d="M${x - 5} ${y - 52} h18 l-4 6 l4 6 h-18z" fill="${p.roof}"><animate attributeName="d" values="M${x - 5} ${y - 52} h18 l-4 6 l4 6 h-18z;M${x - 5} ${y - 52} h16 l-2 6 l6 6 h-20z;M${x - 5} ${y - 52} h18 l-4 6 l4 6 h-18z" dur="2.4s" repeatCount="indefinite"/></path>`; break;
      case 'office': b = box(x - 14, y + 8, 30, 26, 46, p.wall, p.roof, { floor: 8 }); break;
      case 'shop': b = box(x - 16, y + 8, 34, 26, 22, p.wall, p.roof, { pitch: 8, windows: false }) + [0, 1, 2, 3].map((i) => `<polygon points="${x - 16 + i * 8.5},${y - 6 - i * 4.25} ${x - 16 + (i + 1) * 8.5},${y - 6 - (i + 1) * 4.25} ${x - 16 + (i + 1) * 8.5},${y + 2 - (i + 1) * 4.25} ${x - 16 + i * 8.5},${y + 2 - i * 4.25}" fill="${i % 2 ? '#fff' : p.roof}" ${OL}/>`).join(''); break;
      case 'workshop': b = box(x - 22, y + 8, 46, 30, 18, p.wall, p.roof, { windows: false }) + [0, 1, 2].map((k) => `<polygon points="${x - 22 + k * 15},${y - 10 - k * 7.5} ${x - 7 + k * 15},${y - 17.5 - k * 7.5} ${x - 7 + k * 15},${y - 27 - k * 7.5}" fill="${shade(p.roof, -20)}" ${OL}/>`).join(''); break;
      case 'bank': b = box(x - 18, y + 8, 40, 28, 26, p.wall, '#e8e2cf', { windows: false }) + [0, 1, 2, 3].map((i) => `<rect x="${x - 15 + i * 10}" y="${y - 20 - i * 5}" width="4" height="24" fill="#fdfefe" ${OL}/>`).join('') + `<polygon points="${x - 20},${y - 18} ${x + 24},${y - 40} ${x + 2},${y - 44}" fill="${p.roof}" ${OL}/>`; break;
      case 'hall2': b = box(x - 22, y + 8, 46, 30, 24, p.wall, p.roof, { pitch: 8, floor: 9 }) + `<rect x="${x - 4}" y="${y - 70}" width="12" height="40" fill="${p.wall}" ${OL}/><path d="M${x - 6} ${y - 70} l8 -12 l8 12z" fill="${p.roof}" ${OL}/><circle cx="${x + 2}" cy="${y - 58}" r="4" fill="#fff" ${OL}/><path d="M${x + 2} ${y - 58} v-3 M${x + 2} ${y - 58} h2" stroke="${INK}"/>`; break;
      case 'billboard': b = box(x - 14, y + 8, 30, 24, 30, p.wall, p.roof, { floor: 8 }) + `<path d="M${x + 4} ${y - 30} v-16 M${x + 22} ${y - 38} v-16" stroke="#566573" stroke-width="2"/><polygon points="${x - 6},${y - 44} ${x + 32},${y - 63} ${x + 32},${y - 43} ${x - 6},${y - 24}" fill="#ffc93c" ${OL}/><text x="${x + 13}" y="${y - 38}" font-size="8" font-weight="800" fill="#d7263d" transform="rotate(-27 ${x + 13} ${y - 38})" text-anchor="middle" font-family="sans-serif">REKLAM</text>`; break;
      case 'cafe': b = box(x - 16, y + 8, 32, 24, 18, p.wall, p.roof, { pitch: 8, windows: false }) + [0, 1].map((i) => `<g><path d="M${x + 24 + i * 16} ${y + 8 + i * 6} v-14" stroke="#566573" stroke-width="1.6"/><path d="M${x + 14 + i * 16} ${y - 4 + i * 6} q10 -9 20 0z" fill="${i ? '#d7263d' : '#ffc93c'}" ${OL}/><ellipse cx="${x + 24 + i * 16}" cy="${y + 8 + i * 6}" rx="6" ry="2.5" fill="#fff" ${OL}/></g>`).join(''); break;
      case 'hq': b = box(x - 16, y + 8, 34, 28, 58, p.wall, p.roof, { floor: 8 }) + `<path d="M${x + 1} ${y - 58} v-18" stroke="#566573" stroke-width="2"/><path d="M${x + 1} ${y - 76} h14 l-3 4 l3 4 h-14z" fill="#d7263d"><animate attributeName="d" values="M${x + 1} ${y - 76} h14 l-3 4 l3 4 h-14z;M${x + 1} ${y - 76} h12 l-1 4 l5 4 h-16z;M${x + 1} ${y - 76} h14 l-3 4 l3 4 h-14z" dur="2s" repeatCount="indefinite"/></path>`; break;
      case 'farm': {
        let f = '';
        for (let i = 0; i < 4; i++) f += `<polygon points="${x - 120 + i * 30},${y + 50 - i * 15} ${x - 70 + i * 30},${y + 25 - i * 15} ${x - 40 + i * 30},${y + 40 - i * 15} ${x - 90 + i * 30},${y + 65 - i * 15}" fill="${['#d4c06a', '#9cc46b', '#c9b25a', '#8dbb5e'][i]}" opacity=".9"/>`;
        b = f + `<path d="M${x - 60} ${y + 34} l70 -35 l40 20" stroke="#a87a4f" stroke-width="2" stroke-dasharray="2 5" fill="none"/>` + box(x - 16, y + 10, 34, 26, 22, '#b83227', '#8e2219', { pitch: 12, windows: false }) + `<rect x="${x + 22}" y="${y - 40}" width="14" height="40" rx="7" fill="#cfd8dc" ${OL}/><path d="M${x + 22} ${y - 34} q7 -10 14 0" fill="#90a4ae" ${OL}/>` +
          `<g class="map-cow"><ellipse cx="${x - 50}" cy="${y + 34}" rx="7" ry="4" fill="#8b5a3c"/><circle cx="${x - 43}" cy="${y + 31}" r="3" fill="#8b5a3c"/></g><g class="map-cow c2"><ellipse cx="${x - 70}" cy="${y + 20}" rx="6" ry="4" fill="#fbf8f1" ${OL}/></g>`;
        break;
      }
    }
    return b;
  }

  /* ---------- Ana çizim ---------- */
  M.render = function (opts) {
    opts = opts || {};
    winBuf = [];
    const G = KE.G;
    const owned = G ? G.branches.map((b) => b.district) : [];
    const pick = !!opts.pick;
    const phase = G ? G.phase : 'morning';
    const strait = 'M795 -30 C 765 70, 735 160, 748 250 C 762 330, 722 400, 736 470 C 745 520, 712 565, 700 620';
    const halic = 'M738 452 C 680 440, 620 452, 560 432 C 520 418, 480 404, 440 404';
    const sea = 'M0 690 C 180 680, 300 660, 420 655 C 540 650, 640 630, 700 600 L 760 596 C 840 620, 920 660, 1020 668 C 1160 682, 1290 696, 1400 688 L1400 860 L0 860Z';
    const roads = [
      'M0 365 C 200 345, 380 340, 560 345 S 680 368, 704 372', 'M822 380 C 950 380, 1150 382, 1400 372',
      'M0 210 C 250 192, 470 176, 712 176', 'M828 162 C 1000 152, 1200 140, 1400 150',
      'M0 645 C 200 628, 380 610, 520 598 S 640 570, 690 530', 'M300 0 C 288 200, 322 420, 302 655',
      'M1010 0 C 990 200, 1030 450, 1008 662', 'M790 520 C 900 600, 1050 630, 1400 650', 'M585 392 L 592 468'
    ];
    let s = `<svg preserveAspectRatio="${opts.fill ? 'xMidYMid slice' : 'xMidYMid meet'}" class="citymap ${phase === 'closing' ? 'night' : phase === 'service' ? 'noon' : 'morning'} ${pick ? 'picking' : ''}" viewBox="0 0 1400 860" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" role="img" aria-label="Şehir haritası">
    <defs>
      <linearGradient id="mLand" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8efa6"/><stop offset=".55" stop-color="#c3e48e"/><stop offset="1" stop-color="#aed877"/></linearGradient>
      <linearGradient id="mSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#36b4e8"/><stop offset="1" stop-color="#1d82c9"/></linearGradient>
      <pattern id="mWave" width="60" height="30" patternUnits="userSpaceOnUse"><animateTransform attributeName="patternTransform" type="translate" from="0 0" to="60 0" dur="7s" repeatCount="indefinite"/><path d="M6 18 q6 -5 12 0 q6 5 12 0" stroke="#fff" stroke-opacity=".22" stroke-width="1.6" fill="none"/><path d="M36 6 q5 -4 10 0" stroke="#fff" stroke-opacity=".16" stroke-width="1.4" fill="none"/></pattern>
      <pattern id="mGrass" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="8" cy="10" r="1.3" fill="#9fbe6c" opacity=".55"/><circle cx="28" cy="26" r="1.1" fill="#9fbe6c" opacity=".5"/><path d="M18 34 l2 -4 l2 4" stroke="#a9c777" stroke-width="1" fill="none" opacity=".6"/></pattern>
      <filter id="mMute"><feColorMatrix type="saturate" values="0.35"/><feComponentTransfer><feFuncR type="linear" slope=".85" intercept=".12"/><feFuncG type="linear" slope=".85" intercept=".12"/><feFuncB type="linear" slope=".85" intercept=".12"/><feFuncA type="linear" slope=".8"/></feComponentTransfer></filter>
      <filter id="mShadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#0b2a52" flood-opacity=".35"/></filter>
      <radialGradient id="mHill"><stop offset="0" stop-color="#b3d77c"/><stop offset="1" stop-color="#b3d77c" stop-opacity="0"/></radialGradient>
      <filter id="mGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <radialGradient id="mSun" cx=".85" cy="0" r="1"><stop offset="0" stop-color="#fff6d5" stop-opacity=".55"/><stop offset=".5" stop-color="#fff6d5" stop-opacity="0"/></radialGradient>
      <linearGradient id="mNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1d3d" stop-opacity=".62"/><stop offset="1" stop-color="#1a1240" stop-opacity=".5"/></linearGradient>
    </defs>
    <rect width="1400" height="860" fill="url(#mLand)"/><rect width="1400" height="860" fill="url(#mGrass)"/>
    ${[[200, 120, 260], [1180, 260, 240], [420, 300, 180], [980, 520, 220], [120, 520, 170], [700, 60, 150]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#mHill)" opacity=".7"/>`).join('')}`;
    /* parklar ve ormanlar */
    const forest = [[80, 60, 70, 40], [1300, 260, 60, 45], [880, 120, 50, 26], [70, 470, 40, 22], [1250, 560, 50, 24], [760, 40, 30, 16]];
    forest.forEach(([fx, fy, rx, ry]) => { s += `<ellipse cx="${fx}" cy="${fy}" rx="${rx}" ry="${ry}" fill="#a7cb79" opacity=".8"/>`; });
    const tr = rng(99);
    const trees = [];
    forest.forEach(([fx, fy, rx, ry]) => { for (let i = 0; i < Math.round(rx / 6); i++) { const a = tr() * 6.28, d = Math.sqrt(tr()); trees.push([fx + Math.cos(a) * rx * d * 0.85, fy + Math.sin(a) * ry * d * 0.85, 6 + tr() * 4]); } });
    /* su */
    s += `<path d="${sea}" fill="#f1dca6" stroke="#f1dca6" stroke-width="28" stroke-linejoin="round"/>`;
    s += `<path d="${strait}" fill="none" stroke="#f1dca6" stroke-width="96" stroke-linecap="round"/><path d="${halic}" fill="none" stroke="#f1dca6" stroke-width="52" stroke-linecap="round"/>`;
    s += `<path d="${sea}" fill="#7cc8ec" stroke="#7cc8ec" stroke-width="12" stroke-linejoin="round"/>`;
    s += `<path d="${strait}" fill="none" stroke="#7cc8ec" stroke-width="82" stroke-linecap="round"/><path d="${halic}" fill="none" stroke="#7cc8ec" stroke-width="40" stroke-linecap="round"/>`;
    s += `<g><path d="${sea}" fill="url(#mSea)"/><path d="${strait}" fill="none" stroke="url(#mSea)" stroke-width="72" stroke-linecap="round"/><path d="${halic}" fill="none" stroke="#3592d8" stroke-width="32" stroke-linecap="round"/></g>`;
    s += `<path d="${sea}" fill="url(#mWave)"/><path d="${strait}" fill="none" stroke="url(#mWave)" stroke-width="72"/>`;
    s += `<path class="foam" d="${sea}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="14 18" stroke-linecap="round" opacity=".55"/>`;
    /* adalar ve kule */
    [[1000, 780, 46, 18], [1110, 805, 34, 14], [1200, 772, 24, 10], [880, 820, 20, 9]].forEach(([ix, iy, rx, ry]) => {
      s += `<ellipse cx="${ix}" cy="${iy + 4}" rx="${rx + 6}" ry="${ry + 4}" fill="#7cc8ec"/><ellipse cx="${ix}" cy="${iy}" rx="${rx}" ry="${ry}" fill="#f1dca6"/><ellipse cx="${ix}" cy="${iy - 3}" rx="${rx - 6}" ry="${ry - 4}" fill="#b9d68c"/>`;
      for (let k = 0; k < rx / 10; k++) s += tree(ix - rx / 2 + k * 10 + 4, iy, 5, '#5aaa4f');
    });
    s += `<g><ellipse cx="772" cy="562" rx="16" ry="7" fill="#f1dca6"/><rect x="766" y="532" width="12" height="28" fill="#f3efe6" ${OL}/><path d="M764 532 l8 -12 l8 12z" fill="#5b7f95" ${OL}/><rect x="769" y="540" width="6" height="7" class="win"/></g>`;
    /* yollar */
    roads.forEach((d) => { s += `<path d="${d}" fill="none" stroke="#c9b993" stroke-width="13" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fbf5e6" stroke-width="9" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#e0c98f" stroke-width="1.2" stroke-dasharray="8 8"/>`; });
    /* köprüler */
    const bridge = (x1, y1, x2, y2) => {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const tx1 = x1 + (x2 - x1) * 0.22, ty1 = y1 + (y2 - y1) * 0.22, tx2 = x1 + (x2 - x1) * 0.78, ty2 = y1 + (y2 - y1) * 0.78;
      return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#7b6a58" stroke-width="13" stroke-linecap="round"/><path d="M${x1} ${y1} L${x2} ${y2}" stroke="#e9e2d2" stroke-width="9" stroke-linecap="round"/>
        <path d="M${x1} ${y1 - 2} Q${tx1} ${ty1 - 34} ${mx} ${my - 8} Q${tx2} ${ty2 - 34} ${x2} ${y2 - 2}" stroke="#c0392b" stroke-width="2" fill="none"/>
        <rect x="${tx1 - 3}" y="${ty1 - 40}" width="6" height="40" fill="#c0392b" ${OL}/><rect x="${tx2 - 3}" y="${ty2 - 40}" width="6" height="40" fill="#c0392b" ${OL}/>
        ${[0.32, 0.42, 0.5, 0.58, 0.68].map((t) => { const px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t; return `<path d="M${px} ${py} v-${12 - Math.abs(t - 0.5) * 30}" stroke="#c0392b" stroke-width=".8"/>`; }).join('')}`;
    };
    s += bridge(700, 177, 836, 160) + bridge(700, 372, 826, 380);
    /* arabalar ve vapurlar */
    const carCol = ['#d7263d', '#2f6fb5', '#ffc93c', '#fdfefe', '#23a26d'];
    roads.slice(0, 8).forEach((d, i) => { s += `<rect x="-4" y="-2.5" width="8" height="5" rx="1.5" fill="${carCol[i % 5]}" ${OL}><animateMotion dur="${18 + i * 4}s" repeatCount="indefinite" rotate="auto" path="${d}" begin="-${i * 3}s"/></rect>`; });
    const ferry = (path, dur, beg) => `<g><path d="M-14 0 h28 l-5 7 h-18z" fill="#fdfefe" ${OL}/><rect x="-8" y="-7" width="16" height="7" rx="2" fill="#d7263d" ${OL}/><rect x="-2" y="-13" width="3" height="6" fill="#2c3e50"/><path d="M-20 6 q-8 2 -16 0" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none"/><animateMotion dur="${dur}s" repeatCount="indefinite" path="${path}" begin="${beg}s"/></g>`;
    s += ferry(strait, 46, 0) + ferry('M560 640 C 680 600, 800 600, 900 640 C 980 680, 1060 730, 1000 780', 40, -12) + ferry('M720 470 C 650 455, 560 440, 470 410', 30, -8);
    /* ağaçlar (ilk katman) */
    trees.sort((a, b) => a[1] - b[1]).forEach(([x, y, r2]) => { s += tree(x, y, r2); });
    /* semtler */
    KE.DISTRICTS.forEach((d) => {
      const own = owned.includes(d.id);
      const active = pick || own;
      const sel = pick && KE.UI && KE.UI.ng && KE.UI.ng.district === d.id;
      s += `<g class="district ${active ? '' : 'muted'} ${sel ? 'sel' : ''}" ${active ? '' : 'filter="url(#mMute)"'}>${cluster(d.id)}</g>`;
    });
    /* tesisler */
    if (!pick) {
      M.PLACES.forEach((p) => {
        const locked = p.id === 'ciftlik' && G && !G.farm;
        const lbl = p.name + (locked ? ' · satılık' : '');
        const W = lbl.length * 7.4 + 26;
        s += `<g class="place fac" data-a="go" data-s="${p.id}" tabindex="0" role="button" aria-label="${p.name}">
          <ellipse cx="${p.x}" cy="${p.y + 10}" rx="52" ry="34" fill="#000" opacity="0"/>
          <g class="lift">${facility(p)}</g>
          <g class="poi" style="animation-delay:-${(p.x % 7) * 0.4}s"><g transform="translate(${p.x} ${p.y - 86})" filter="url(#mShadow)">
            <path d="M0 30 l-9 -12 h18z" fill="${p.roof}"/><circle r="22" fill="#fff"/><circle r="18" fill="${p.roof}"/><circle r="18" fill="url(#mSun)" opacity=".5"/>
            <g transform="translate(-13 -13) scale(1.08)" color="#fff">${KE.ART.icon(p.icon).replace('<svg ', '<svg width="24" height="24" ')}</g>${locked ? `<circle cx="16" cy="-14" r="8" fill="#ffc93c" stroke="#fff" stroke-width="2"/><text x="16" y="-10.5" text-anchor="middle" class="poi-tag">₺</text>` : ''}</g></g>
          <ellipse class="poi-shadow" cx="${p.x}" cy="${p.y - 47}" rx="9" ry="3" fill="#0b2a52" opacity=".18"/>
          <g transform="translate(${p.x} ${p.y + 32})"><rect x="${-W / 2}" y="-12" width="${W}" height="24" rx="12" fill="#fff" filter="url(#mShadow)"/><text y="4.5" text-anchor="middle" class="plbl">${lbl}</text></g></g>`;
      });
    }
    /* semt etiketleri ve dükkânlar */
    KE.DISTRICTS.forEach((d) => {
      const P = M.POS[d.id];
      const b = G && G.branches.find((x) => x.district === d.id);
      if (pick) {
        const sel = KE.UI.ng.district === d.id;
        s += `<g class="place dpick ${sel ? 'sel' : ''}" data-a="pickDistrict" data-d="${d.id}" tabindex="0" role="button" aria-label="${d.name}">
          <ellipse cx="${P.x}" cy="${P.y}" rx="110" ry="62" fill="${sel ? '#ffc93c' : '#fff'}" opacity="${sel ? 0.28 : 0.001}" class="hl"/>
          <g transform="translate(${P.x} ${P.y + 70})"><rect x="-${d.name.length * 5 + 16}" y="-16" width="${d.name.length * 10 + 32}" height="32" rx="16" fill="${sel ? '#d7263d' : '#fffaf1'}" ${OL}/><text y="6" text-anchor="middle" class="dlbl ${sel ? 'on' : ''}">${d.name}</text></g></g>`;
      } else if (b) {
        const L = G.live && G.live[b.id];
        const act = b.id === G.activeBranch;
        const status = G.phase === 'service' && L ? (L.done ? 'Kapandı' : `${L.queue.length} sırada · ${KE.tl(L.stats.revenue)}`) : G.phase === 'closing' ? 'Kepenk indi' : 'Hazırlık';
        const champ = b.championUntil && G.day <= b.championUntil;
        const NW = Math.max(b.name.length * 8.6, status.length * 6.4) + 30;
        s += `<g class="place shopmark ${act ? 'act' : ''}" data-a="viewBranch" data-id="${b.id}" tabindex="0" role="button" aria-label="${b.name}">
          <ellipse cx="${P.x}" cy="${P.y + 14}" rx="70" ry="40" fill="#000" opacity="0"/>
          ${act ? `<ellipse class="halo" cx="${P.x + 2}" cy="${P.y + 6}" rx="46" ry="22" fill="#ffc93c" opacity=".45"/>` : ''}
          <g class="lift">${box(P.x - 16, P.y + 14, 40, 28, 28, '#fff3dc', '#d7263d', { windows: false })}
          ${[0, 1, 2, 3, 4].map((i) => `<polygon points="${P.x - 16 + i * 8},${P.y - 2 - i * 4} ${P.x - 16 + (i + 1) * 8},${P.y - 2 - (i + 1) * 4} ${P.x - 16 + (i + 1) * 8},${P.y + 7 - (i + 1) * 4} ${P.x - 16 + i * 8},${P.y + 7 - i * 4}" fill="${i % 2 ? '#fff' : '#d7263d'}"/>`).join('')}
          <polygon points="${P.x - 12},${P.y + 8} ${P.x + 18},${P.y - 7} ${P.x + 18},${P.y + 3} ${P.x - 12},${P.y + 18}" fill="#ffe39a" opacity=".9"/>
          <path d="M${P.x + 28} ${P.y - 26} v-30" stroke="#566573" stroke-width="2.5"/><path d="M${P.x + 28} ${P.y - 56} h20 l-5 6 l5 6 h-20z" fill="#d7263d"><animate attributeName="d" values="M${P.x + 28} ${P.y - 56} h20 l-5 6 l5 6 h-20z;M${P.x + 28} ${P.y - 56} h18 l-2 6 l6 6 h-22z;M${P.x + 28} ${P.y - 56} h20 l-5 6 l5 6 h-20z" dur="1.6s" repeatCount="indefinite"/></path></g>
          <g class="poi big"><g transform="translate(${P.x} ${P.y - 92})" filter="url(#mShadow)">
            <rect x="${-NW / 2}" y="-24" width="${NW}" height="44" rx="22" fill="${act ? '#d7263d' : '#fff'}"/><path d="M-9 19 l9 11 l9 -11z" fill="${act ? '#d7263d' : '#fff'}"/>
            <text y="-3" text-anchor="middle" class="shopname ${act ? 'on' : ''}">${b.name}</text><text y="13" text-anchor="middle" class="shopstat ${act ? 'on' : ''}">${status}</text>
            ${champ ? `<g transform="translate(${NW / 2 - 6} -24)"><circle r="14" fill="#ffc93c" stroke="#fff" stroke-width="3"/><g transform="translate(-9 -9) scale(.75)" color="#7a1f3d">${KE.ART.icon('crown').replace('<svg ', '<svg width="24" height="24" ')}</g></g>` : ''}</g></g></g>`;
      } else {
        s += `<g class="dname muted" pointer-events="none"><text x="${P.x}" y="${P.y + 72}" text-anchor="middle" class="dlbl mute">${d.name}</text></g>`;
      }
    });
    /* bulutlar ve martılar */
    const cloud = (x, y, k, dur, beg) => `<g class="cloud" style="animation-duration:${dur}s;animation-delay:${beg}s"><g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="10" cy="40" rx="50" ry="10" fill="#1d3b5a" opacity=".1"/><g fill="#fff" opacity=".92"><ellipse cx="0" cy="0" rx="40" ry="14"/><ellipse cx="22" cy="-8" rx="24" ry="14"/><ellipse cx="-18" cy="-4" rx="18" ry="11"/></g></g></g>`;
    s += `<g class="blimp"><g transform="translate(0 70)" filter="url(#mShadow)"><ellipse cx="0" cy="0" rx="58" ry="18" fill="#d7263d"/><ellipse cx="-6" cy="-6" rx="44" ry="7" fill="#fff" opacity=".25"/><path d="M50 0 l18 -14 v28z" fill="#9c1527"/><rect x="-14" y="16" width="28" height="9" rx="3" fill="#2c3e50"/><text y="5" text-anchor="middle" class="blimp-t">KEBAB EMPIRE</text></g><path d="M-62 70 q-30 6 -60 0" stroke="#fff" stroke-width="2" stroke-dasharray="4 5" fill="none" opacity=".7"/></g>`;
    s += cloud(-120, 90, 1, 90, 0) + cloud(-120, 520, 0.8, 120, -60) + cloud(-120, 300, 1.2, 140, -30);
    s += `<g class="gulls" fill="none" stroke="#2c3e50" stroke-width="2" stroke-linecap="round"><path d="M0 0 q6 -6 12 0 q6 -6 12 0"/><path d="M26 12 q5 -5 10 0 q5 -5 10 0"/><path d="M8 22 q4 -4 8 0 q4 -4 8 0"/></g>`;
    /* yaka adları */
    s += `<text x="150" y="40" class="side">AVRUPA YAKASI</text><text x="1240" y="40" class="side" text-anchor="middle">ANADOLU YAKASI</text><text x="420" y="770" class="sea">Marmara</text><text x="772" y="250" class="sea" transform="rotate(-80 772 250)">Boğaz</text><text x="600" y="455" class="sea small">Haliç</text>`;
    s += `<rect width="1400" height="860" fill="url(#mSun)" pointer-events="none"/>`;
    if (phase === 'closing') s += `<rect width="1400" height="860" fill="url(#mNight)" pointer-events="none"/><g class="lights" pointer-events="none">${winBuf.join('')}</g>`;
    return s + '</svg>';
  };
})();
