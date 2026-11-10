/* Kebab Empire — şehir haritası ("Canlı İstanbul")
   Günümüz İstanbul'una yakın, yukarıdan bakışlı şehir planı: Boğaz, Haliç, Marmara kıyısı,
   Adalar, köprüler ve simge yapılar. Zemin bir kez üretilip saklanır; tesis rozetleri,
   dükkânlar, iş etiketleri ve rota her çizimde üstüne eklenir. */
(function () {
  const M = (KE.MAP = /** @type {KE_MAP} */ ({}));
  const f1 = (n) => Math.round(n * 10) / 10;

  /* Dükkân konumları (1400×860) */
  M.POS = {
    'kadiceşme': { x: 906, y: 542 },
    kulealti: { x: 470, y: 128 },
    besiktepe: { x: 600, y: 246 },
    sultanpazari: { x: 578, y: 630 },
    merterli: { x: 140, y: 432 },
    kampustepe: { x: 232, y: 604 },
    bostansahil: { x: 1262, y: 592 }
  };
  M.PLACES = [
    { id: 'hal', name: 'Hal ve Kasap', x: 345, y: 296, color: '#e8553d', icon: 'cart', group: 'Çarşı' },
    { id: 'lonca', name: 'Usta Pazarı', x: 395, y: 596, color: '#8e44ad', icon: 'chef', group: 'Çarşı' },
    { id: 'terzi', name: 'Terzi', x: 410, y: 391, color: '#f28c28', icon: 'tray', group: 'Çarşı' },
    { id: 'dekor', name: 'Mobilya ve Dekor', x: 405, y: 196, color: '#117a65', icon: 'table', group: 'Çarşı' },
    { id: 'banka', name: 'Banka', x: 700, y: 91, color: '#d4a21a', icon: 'coin', group: 'Resmî' },
    { id: 'belediye', name: 'Belediye', x: 215, y: 161, color: '#34495e', icon: 'map', group: 'Resmî' },
    { id: 'office', name: 'Muhasebe', x: 655, y: 388, color: '#2f6fb5', icon: 'chart', group: 'Resmî' },
    { id: 'kahve', name: 'Mahalle Kahvesi', x: 1020, y: 426, color: '#8e4a22', icon: 'heart', group: 'Mahalle' },
    { id: 'ajans', name: 'Reklam Ajansı', x: 930, y: 261, color: '#e63946', icon: 'fire', group: 'Mahalle' },
    { id: 'buro', name: 'Eleman Bürosu', x: 170, y: 296, color: '#16a085', icon: 'users', group: 'Mahalle' },
    { id: 'subeler', name: 'Merkez Ofis', x: 1190, y: 416, color: '#7a1f3d', icon: 'store', group: 'Şirket' },
    { id: 'ciftlik', name: 'Besi Çiftliği', x: 1215, y: 146, color: '#b83227', icon: 'cow', group: 'Şirket' }
  ];
  M.place = (id) => M.PLACES.find((p) => p.id === id);
  /** @type {Array<[number, number, string, string]>} */
  const LABELS = [
    [470, 196, 'Kulealtı', 'kulealti'],
    [608, 346, 'Beşiktepe', 'besiktepe'],
    [515, 602, 'Sultanpazarı', 'sultanpazari'],
    [244, 500, 'Merterli Sanayi', 'merterli'],
    [130, 652, 'Kampüstepe', 'kampustepe'],
    [1146, 622, 'Bostansahil', 'bostansahil'],
    [880, 602, 'Kadıçeşme', 'kadiceşme']
  ];

  /* ---------- Coğrafya ---------- */
  const STRAIT = 'M795 -30 C 765 70, 735 160, 748 250 C 762 330, 722 400, 736 470 C 745 520, 712 565, 700 620';
  const HALIC = 'M738 452 C 680 440, 620 452, 560 432 C 520 418, 480 404, 440 404';
  const COAST =
    'M0 702 C 90 696, 170 688, 250 684 C 330 680, 380 672, 430 668 C 500 662, 560 656, 610 648 C 650 642, 680 628, 690 612 L 755 600 C 780 604, 795 616, 808 632 C 822 650, 842 690, 870 692 C 896 694, 900 668, 926 664 C 956 660, 974 690, 1000 706 C 1022 716, 1044 694, 1084 686 C 1180 678, 1290 692, 1400 686';
  const SEA = COAST + ' L1400 860 L0 860Z';
  const ROADS = [
    'M0 365 C 200 345, 380 340, 560 345 S 680 368, 704 372',
    'M822 380 C 950 380, 1150 382, 1400 372',
    'M0 210 C 250 192, 470 176, 712 176',
    'M828 162 C 1000 152, 1200 140, 1400 150',
    'M0 645 C 200 628, 380 610, 520 598 S 640 570, 690 530',
    'M300 0 C 288 200, 322 420, 302 655',
    'M1010 0 C 990 200, 1030 450, 1008 662',
    'M790 520 C 900 600, 1050 630, 1400 650'
  ];

  function sample(d, step) {
    step = step || 4;
    const t = d.match(/[MCSL]|-?\d+\.?\d*/g);
    let i = 0,
      cx = 0,
      cy = 0,
      px = 0,
      py = 0,
      cmd;
    const out = [];
    const num = () => +t[i++];
    const cub = (x0, y0, x1, y1, x2, y2, x3, y3) => {
      const n = Math.max(4, Math.ceil(Math.hypot(x3 - x0, y3 - y0) / step));
      for (let k = 1; k <= n; k++) {
        const s = k / n,
          a = (1 - s) ** 3,
          b = 3 * (1 - s) ** 2 * s,
          c = 3 * (1 - s) * s * s,
          e = s ** 3;
        out.push([a * x0 + b * x1 + c * x2 + e * x3, a * y0 + b * y1 + c * y2 + e * y3]);
      }
    };
    while (i < t.length) {
      if (/[MCSL]/.test(t[i])) cmd = t[i++];
      if (cmd === 'M') {
        cx = num();
        cy = num();
        out.push([cx, cy]);
        px = cx;
        py = cy;
      } else if (cmd === 'L') {
        const x = num(),
          y = num();
        cub(cx, cy, cx, cy, x, y, x, y);
        cx = x;
        cy = y;
        px = cx;
        py = cy;
      } else if (cmd === 'C') {
        const a = [num(), num(), num(), num(), num(), num()];
        cub(cx, cy, ...a);
        px = a[2];
        py = a[3];
        cx = a[4];
        cy = a[5];
      } else if (cmd === 'S') {
        const x1 = 2 * cx - px,
          y1 = 2 * cy - py,
          a = [num(), num(), num(), num()];
        cub(cx, cy, x1, y1, ...a);
        px = a[0];
        py = a[1];
        cx = a[2];
        cy = a[3];
      }
    }
    return out;
  }

  /* ---------- Zemin (bir kez üretilir) ---------- */
  let BASE = null;
  function buildBase() {
    let seed = 7;
    const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const sS = sample(STRAIT, 3),
      sH = sample(HALIC, 3),
      sC = sample(COAST, 3),
      sR = ROADS.map((r) => sample(r, 6)).flat();
    const near = (pts, x, y, r) => pts.some((p) => Math.hypot(p[0] - x, p[1] - y) < r);
    const coastY = (x) => {
      let b = sC[0];
      for (const p of sC) if (Math.abs(p[0] - x) < Math.abs(b[0] - x)) b = p;
      return b[1];
    };
    const isWater = (x, y, mg) => y > coastY(x) - mg || near(sS, x, y, 37 + mg) || near(sH, x, y, 17 + mg);
    const EX = [
      [495, 25, 650, 172],
      [555, 265, 662, 330],
      [648, 322, 714, 358],
      [522, 320, 568, 414],
      [440, 440, 708, 562],
      [762, 552, 826, 598],
      [812, 262, 918, 408],
      [1048, 276, 1148, 378],
      [192, 372, 298, 460],
      [86, 540, 182, 630],
      [1078, 505, 1212, 598],
      [924, 610, 996, 656],
      [0, 0, 470, 118],
      [1070, 0, 1400, 262],
      [1040, 0, 1070, 90]
    ];
    M.PLACES.forEach((p) => {
      const hw = Math.max(p.name.length * 7.4 + 26, 52) / 2 + 8;
      EX.push([p.x - hw, p.y - 40, p.x + hw, p.y + 64]);
    });
    Object.values(M.POS).forEach((p) => EX.push([p.x - 50, p.y - 50, p.x + 70, p.y + 40]));
    LABELS.forEach((l) => EX.push([l[0] - 62, l[1] - 18, l[0] + 62, l[1] + 8]));
    const inEX = (x, y) => EX.some((e) => x > e[0] && x < e[2] && y > e[1] && y < e[3]);

    function blocks(id, rot) {
      let r = `<pattern id="${id}" width="150" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})"><rect width="150" height="120" fill="#ece2cb"/>`;
      let y = 3;
      while (y < 117) {
        const h = Math.min(117 - y, 14 + R() * 14);
        let x = 3;
        while (x < 147) {
          const w = Math.min(147 - x, 14 + R() * 26);
          const c = R();
          if (w > 6 && h > 6)
            r += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w - 4)}" height="${f1(h - 4)}" rx="2" fill="${c < 0.66 ? '#fbf5e8' : c < 0.84 ? '#f4dccb' : '#e6ecef'}"/>`;
          x += w;
        }
        y += h;
      }
      return r + '</pattern>';
    }
    const AP = [
      ['#fbe3c9', '#e8c49e'],
      ['#d9ecf6', '#b5d3e6'],
      ['#f8d4d4', '#e3b0b0'],
      ['#fff5d6', '#e9d9a8'],
      ['#e3f0d8', '#c3d9b2']
    ];
    function aptSym(i, fl) {
      const [fc, sc] = AP[i % AP.length];
      const h = fl * 5 + 4,
        w = 16;
      let s = `<symbol id="kmap${i}_${fl}" viewBox="0 0 24 ${h + 8}"><path d="M3 ${h + 6} h${w} l4 -3 v-${h} l-4 3z" fill="${sc}"/><rect x="3" y="5" width="${w}" height="${h + 1}" fill="${fc}"/><path d="M3 5 l4 -3 h${w} l-4 3z" fill="#fff" opacity=".8"/>`;
      for (let r = 0; r < fl; r++)
        for (let c = 0; c < 3; c++) s += `<rect class="win" x="${5 + c * 5}" y="${8 + r * 5}" width="3" height="2.6"/>`;
      return s + '<rect x="9" y="1" width="4" height="3" fill="#9aa5ab"/></symbol>';
    }
    let syms = '';
    const aptIds = [];
    for (let i = 0; i < 5; i++)
      for (const fl of [3, 5, 7]) {
        syms += aptSym(i, fl);
        aptIds.push([`kmap${i}_${fl}`, fl * 5 + 12]);
      }
    const pts = [];
    let tries = 0;
    while (pts.length < 110 && tries < 20000) {
      tries++;
      const x = 20 + R() * 1360,
        y = 40 + R() * 660;
      if (isWater(x, y, 10) || inEX(x, y) || near(sR, x, y, 11)) continue;
      if (y < 150 && R() < 0.5) continue;
      if (pts.some((p) => Math.hypot(p[0] - x, p[1] - y) < 30)) continue;
      pts.push([x, y]);
    }
    pts.sort((a, b) => a[1] - b[1]);
    const apts = pts
      .map(([x, y]) => {
        const [id, h] = aptIds[Math.floor(R() * aptIds.length)];
        return `<use href="#${id}" x="${f1(x - 12)}" y="${f1(y - h)}" width="24" height="${h + 8}"/>`;
      })
      .join('');
    const yc = ['#f4b6a6', '#f6e0a8', '#bfe0f0', '#fff', '#d98a62', '#e9c7e8'];
    let yal = '';
    for (let k = 6; k < sS.length - 6; k += 5) {
      const [x, y] = sS[k],
        [x2, y2] = sS[k + 1];
      if (y < 10 || y > 335 || (y > 140 && y < 200)) continue;
      const dx = x2 - x,
        dy = y2 - y,
        L = Math.hypot(dx, dy),
        nx = -dy / L,
        ny = dx / L;
      for (const sd of [-1, 1]) {
        const px = x + nx * 44 * sd,
          py = y + ny * 44 * sd;
        if (inEX(px, py) || R() < 0.25) continue;
        const c = yc[Math.floor(R() * yc.length)];
        yal += `<g transform="translate(${f1(px)} ${f1(py)})"><rect x="-6" y="-9" width="12" height="9" fill="${c}"/><path d="M-7.5 -9 l7.5 -5 l7.5 5z" fill="#b5523b"/><rect class="win" x="-3.5" y="-6" width="2.5" height="2.5"/><rect class="win" x="1" y="-6" width="2.5" height="2.5"/></g>`;
      }
    }
    const fc = ['#bfe08a', '#d9e68e', '#a8d070', '#e8d98a', '#c9e3a0', '#b4d67c'];
    let fields = '';
    for (let gx = 1080; gx < 1400; gx += 58)
      for (let gy = -10; gy < 250; gy += 46) {
        if (Math.abs(gy + 20 - 146) < 14) continue;
        fields += `<rect x="${f1(gx + R() * 4)}" y="${f1(gy + R() * 4)}" width="${f1(50 + R() * 6)}" height="${f1(38 + R() * 5)}" rx="3" fill="${fc[Math.floor(R() * fc.length)]}" transform="rotate(-4 ${gx} ${gy})"/>`;
      }
    const isl = [
      ['Kınalıada', 1000, 752, 'M-20 -6 C-14 -14 4 -16 16 -10 C24 -4 20 8 8 11 C-6 14 -24 6 -20 -6Z'],
      ['Burgazada', 1078, 774, 'M-18 -10 C-6 -20 14 -18 20 -6 C26 6 14 18 0 18 C-14 18 -26 4 -18 -10Z'],
      [
        'Heybeliada',
        1168,
        790,
        'M-34 -8 C-28 -20 -10 -18 -2 -12 C6 -22 26 -20 34 -8 C40 4 30 18 14 16 C4 22 -10 22 -20 16 C-34 14 -40 2 -34 -8Z'
      ],
      [
        'Büyükada',
        1290,
        808,
        'M-30 -26 C-18 -40 10 -38 22 -26 C34 -14 30 0 36 12 C40 26 26 40 6 38 C-12 36 -22 26 -28 12 C-34 0 -40 -14 -30 -26Z'
      ],
      ['Sedef', 1378, 770, 'M-12 -4 C-6 -9 8 -8 12 -2 C14 4 4 8 -4 7 C-12 6 -16 1 -12 -4Z']
    ];
    let islands = '';
    for (const [n, x, y, d] of isl) {
      const big = n === 'Büyükada' || n === 'Heybeliada';
      islands += `<g transform="translate(${x} ${y})"><path d="${d}" fill="#dff3fb" stroke="#dff3fb" stroke-width="12" stroke-linejoin="round" opacity=".8"/><path d="${d}" fill="#e9e0c4" stroke="#e9e0c4" stroke-width="4"/><path d="${d}" fill="#9fd07a" transform="scale(.9)"/>`;
      const np = big ? 8 : 3;
      for (let i = 0; i < np; i++) {
        const px = (R() - 0.4) * (big ? 44 : 20),
          py = (R() - 0.2) * (big ? 40 : 14);
        islands += `<g transform="translate(${f1(px)} ${f1(py)})"><rect x="-.8" y="-2" width="1.6" height="5" fill="#6b4a2b"/><ellipse cx="0" cy="-3" rx="5" ry="3" fill="#3f8f3a"/></g>`;
      }
      const nh = big ? 6 : n === 'Sedef' ? 1 : 3;
      for (let i = 0; i < nh; i++) {
        const hx = (i - (nh - 1) / 2) * 7 + (R() - 0.5) * 3,
          hy = (big ? -22 : -6) + Math.abs(i - (nh - 1) / 2) * 2.4;
        islands += `<g transform="translate(${f1(hx)} ${f1(hy)})"><rect x="-3" y="-4" width="6" height="5" fill="${['#fff', '#f6e0a8', '#f4b6a6', '#d9ecf6'][i % 4]}"/><path d="M-4 -4 l4 -3 l4 3z" fill="#c4553b"/></g>`;
      }
      if (n === 'Büyükada')
        islands +=
          '<g transform="translate(14 22)"><rect x="-3" y="-6" width="6" height="6" fill="#fff"/><path d="M-4 -6 l4 -4 l4 4z" fill="#c4553b"/></g>';
      if (n === 'Heybeliada')
        islands += '<rect x="-30" y="2" width="16" height="7" fill="#f3efe6" stroke="#b9b2a2" stroke-width=".6"/>';
      islands += '</g>';
    }
    const tower = (x, y, w, h, c1, c2, spire) =>
      `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c1}"/><path d="M${x + w} ${y} l6 -4 v${h} l-6 4z" fill="${c2}"/><path d="M${x} ${y} l6 -4 h${w} l-6 4z" fill="#eef8ff"/>${[...Array(Math.floor(h / 7))].map((_, i) => `<path class="twl" d="M${x + 2} ${y + 5 + i * 7} h${w - 4}" stroke="#fff" stroke-width="1" opacity=".55"/>`).join('')}<rect x="${x + 2}" y="${y + 2}" width="3" height="${h - 4}" fill="#fff" opacity=".35"/>${spire ? `<path d="M${x + w / 2 + 3} ${y - 4} v-18" stroke="#9fb3c2" stroke-width="2"/><circle cx="${x + w / 2 + 3}" cy="${y - 22}" r="1.6" fill="#e63946" class="blink"/>` : ''}</g>`;
    const ferry = (c, dur, path) =>
      `<g><g transform="translate(-18 -8)"><path d="M0 10 h36 l-5 7 h-26z" fill="#fff"/><rect x="6" y="2" width="24" height="8" rx="2" fill="#f4f1ea" stroke="#c9c2b4" stroke-width=".6"/><rect x="6" y="5" width="24" height="2" fill="${c}"/><rect x="16" y="-4" width="4" height="6" fill="#2c3e50"/></g><animateMotion dur="${dur}s" repeatCount="indefinite" rotate="auto" path="${path}"/></g>`;
    const car = (c, dur, path, del) =>
      `<g><rect x="-5" y="-2.6" width="10" height="5.2" rx="1.6" fill="${c}"/><animateMotion dur="${dur}s" begin="${del || 0}s" repeatCount="indefinite" rotate="auto" path="${path}"/></g>`;
    const gull = (d, dur, del) =>
      `<g><path class="gl" d="M-6 0 q3 -4 6 0 q3 -4 6 0" stroke="#fff" stroke-width="1.8" fill="none" style="animation-delay:${del}s"/><animateMotion dur="${dur}s" repeatCount="indefinite" path="${d}"/></g>`;

    return `<defs>
${blocks('kmCityE', -6)}${blocks('kmCityA', 10)}
<pattern id="kmForest" width="26" height="22" patternUnits="userSpaceOnUse"><rect width="26" height="22" fill="#86c260"/><circle cx="6" cy="6" r="6" fill="#5fa846"/><circle cx="19" cy="15" r="6.5" fill="#56a03f"/><circle cx="4" cy="5" r="2" fill="#a6d886"/><circle cx="17" cy="13" r="2" fill="#a6d886"/></pattern>
<linearGradient id="kmSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3cc0ee"/><stop offset=".55" stop-color="#1e95d8"/><stop offset="1" stop-color="#1477c2"/></linearGradient>
<linearGradient id="kmNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1d3d" stop-opacity=".6"/><stop offset="1" stop-color="#1a1240" stop-opacity=".5"/></linearGradient>
<filter id="kmDs" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#163a5c" flood-opacity=".35"/></filter>
<filter id="kmSs" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="1.5" dy="2" stdDeviation="1.2" flood-color="#3d2a10" flood-opacity=".28"/></filter>
<radialGradient id="kmGlow"><stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#ffe066" stop-opacity="0"/></radialGradient>
<clipPath id="kmCE"><rect width="752" height="860"/></clipPath><clipPath id="kmCA"><rect x="730" width="670" height="860"/></clipPath><clipPath id="kmCN"><rect width="1400" height="330"/></clipPath>
${syms}
</defs>
<rect width="1400" height="860" fill="#ece2cb"/>
<rect width="1400" height="860" fill="url(#kmCityE)" clip-path="url(#kmCE)"/>
<rect width="1400" height="860" fill="url(#kmCityA)" clip-path="url(#kmCA)"/>
<path d="M0 0 H490 C 470 40, 440 70, 380 92 C 330 110, 300 96, 250 112 C 190 130, 130 116, 80 128 C 40 136, 16 130, 0 136Z" fill="url(#kmForest)"/>
<path d="M1040 0 H1400 V262 C 1330 270, 1250 258, 1180 266 C 1120 272, 1080 250, 1066 210 C 1056 160, 1070 100, 1040 0Z" fill="#cfe7a0"/>
<g>${fields}</g>
<path d="${STRAIT}" fill="none" stroke="#9ccf6e" stroke-width="150" clip-path="url(#kmCN)"/>
<path d="${STRAIT}" fill="none" stroke="url(#kmForest)" stroke-width="128" clip-path="url(#kmCN)" opacity=".55"/>
<g fill="#9ccf6e"><ellipse cx="636" cy="238" rx="30" ry="20"/><path d="M660 470 C 690 470, 700 500, 700 532 C 680 540, 662 528, 656 506 Z"/><ellipse cx="864" cy="368" rx="46" ry="32"/><ellipse cx="790" cy="440" rx="16" ry="30"/><ellipse cx="1036" cy="618" rx="22" ry="14"/></g>
<g fill="url(#kmForest)" opacity=".7"><ellipse cx="636" cy="238" rx="26" ry="16"/><ellipse cx="864" cy="372" rx="38" ry="24"/><ellipse cx="790" cy="440" rx="12" ry="24"/></g>
<path d="${COAST}" fill="none" stroke="#a8d77a" stroke-width="40" stroke-linejoin="round"/>
<path d="${STRAIT}" fill="none" stroke="#e2e8e4" stroke-width="88" stroke-linecap="round"/>
<path d="${HALIC}" fill="none" stroke="#e2e8e4" stroke-width="48" stroke-linecap="round"/>
<path d="${SEA}" fill="#e2e8e4" stroke="#e2e8e4" stroke-width="14" stroke-linejoin="round"/>
<path d="${SEA}" fill="#8fdcf5" stroke="#8fdcf5" stroke-width="6" stroke-linejoin="round"/>
<path d="${STRAIT}" fill="none" stroke="#8fdcf5" stroke-width="80" stroke-linecap="round"/>
<path d="${HALIC}" fill="none" stroke="#8fdcf5" stroke-width="40" stroke-linecap="round"/>
<path d="${SEA}" fill="url(#kmSea)"/><rect x="-600" y="858" width="2600" height="900" fill="#1477c2"/>
<path d="${STRAIT}" fill="none" stroke="#2fb2ea" stroke-width="72" stroke-linecap="round"/>
<path d="${HALIC}" fill="none" stroke="#30ade6" stroke-width="32" stroke-linecap="round"/>
<path d="${COAST}" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="12 20" opacity=".6" class="wv" transform="translate(0 12)"/>
<g stroke="#fff" stroke-width="2" fill="none" opacity=".4" stroke-linecap="round"><path d="M140 770 q8 -6 16 0 q8 6 16 0"/><path d="M420 740 q8 -6 16 0 q8 6 16 0"/><path d="M640 810 q8 -6 16 0 q8 6 16 0"/><path d="M870 760 q8 -6 16 0 q8 6 16 0"/><path d="M300 830 q8 -6 16 0 q8 6 16 0"/></g>
<path d="M818 628 C 790 640, 760 640, 740 630" stroke="#e2e8e4" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="740" cy="630" r="3" fill="#e63946"/>
${islands}
<g filter="url(#kmSs)"><ellipse cx="752" cy="548" rx="13" ry="6" fill="#e2e8e4"/><rect x="745" y="530" width="14" height="16" fill="#fbf4e6"/><rect x="749" y="516" width="6" height="16" fill="#fbf4e6"/><path d="M748 517 l4 -9 l4 9z" fill="#5d8aa8"/><rect x="759" y="537" width="7" height="9" fill="#f0e6d2"/></g>
<g fill="none" stroke-linecap="round"><g stroke="#e0b96a" stroke-width="12">${ROADS.map((d) => `<path d="${d}"/>`).join('')}</g><g stroke="#ffe6a0" stroke-width="8">${ROADS.map((d) => `<path d="${d}"/>`).join('')}</g></g>
${car('#e63946', 16, ROADS[0])}${car('#3b8ee0', 22, ROADS[0], -9)}${car('#ffc93c', 20, ROADS[3])}${car('#fff', 26, ROADS[7])}${car('#2ecc71', 24, ROADS[5], -6)}${car('#e67e22', 28, ROADS[6])}
<g><path d="M696 177 L840 160" stroke="#9aa3a8" stroke-width="13" stroke-linecap="round"/><path d="M696 177 L840 160" stroke="#f3f0e8" stroke-width="8" stroke-linecap="round"/><path d="M706 170 Q 768 126 830 158" stroke="#c9302c" stroke-width="2.4" fill="none"/><path d="M729 168 v-38 M806 160 v-38" stroke="#c9302c" stroke-width="6" stroke-linecap="round"/></g>
<g><path d="M696 372 L830 380" stroke="#9aa3a8" stroke-width="13" stroke-linecap="round"/><path d="M696 372 L830 380" stroke="#f3f0e8" stroke-width="8" stroke-linecap="round"/><path d="M706 366 Q 764 322 820 374" stroke="#c9302c" stroke-width="2.4" fill="none"/><path d="M729 370 v-38 M796 374 v-38" stroke="#c9302c" stroke-width="6" stroke-linecap="round"/></g>
<g class="brl"><circle cx="729" cy="130" r="2.4"/><circle cx="806" cy="122" r="2.4"/><circle cx="729" cy="332" r="2.4"/><circle cx="796" cy="336" r="2.4"/></g>
${car('#e63946', 7, 'M700 176 L836 161')}${car('#fff', 8, 'M836 379 L700 373')}${car('#ffc93c', 9, 'M700 373 L826 380', -4)}
<g stroke-linecap="round"><path d="M708 428 L706 466" stroke="#9aa3a8" stroke-width="9"/><path d="M708 428 L706 466" stroke="#f3f0e8" stroke-width="5"/><path d="M641 426 L640 466" stroke="#9aa3a8" stroke-width="7"/><path d="M641 426 L640 466" stroke="#f3f0e8" stroke-width="3.5"/><path d="M641 446 l-8 -10 M641 446 l8 -10 M641 446 v-14" stroke="#fff" stroke-width="1.4"/></g>
${ferry('#e8553d', 44, STRAIT)}${ferry('#2f6fb5', 22, 'M806 616 C 770 598, 742 530, 722 470')}${ferry('#e8553d', 30, 'M1088 692 C 1130 716, 1190 752, 1250 774')}${ferry('#16a085', 38, 'M724 604 C 820 690, 930 730, 990 742')}
<g><g transform="translate(-26 -6)"><path d="M0 6 h52 l-6 8 h-40z" fill="#3b4a5a"/><rect x="8" y="0" width="34" height="6" fill="#e8553d"/><rect x="12" y="1" width="6" height="5" fill="#2f6fb5"/><rect x="20" y="1" width="6" height="5" fill="#ffc93c"/><rect x="28" y="1" width="6" height="5" fill="#16a085"/></g><animateMotion dur="90s" repeatCount="indefinite" rotate="auto" path="M-60 820 C 300 800, 700 820, 1460 770"/></g>
${gull('M100 760 C 300 700, 500 760, 700 700 S 1000 720, 1300 680', 30, 0)}${gull('M1300 700 C 1100 740, 900 690, 760 640 S 500 600, 200 660', 36, -0.4)}
<g filter="url(#kmSs)">${yal}</g>
<g filter="url(#kmSs)">${apts}</g>
<g filter="url(#kmSs)">
${tower(502, 74, 22, 92, '#8fd0f2', '#5fa8d6')}${tower(530, 44, 26, 122, '#6fbfe8', '#4a98c9', true)}${tower(562, 82, 22, 84, '#a9dcf5', '#76b5de')}${tower(590, 62, 20, 104, '#7ec7c4', '#4fa3a0')}${tower(616, 98, 20, 68, '#b5d8ee', '#88b7d6')}
<ellipse cx="610" cy="300" rx="44" ry="24" fill="#2c3e50"/><ellipse cx="610" cy="298" rx="34" ry="16" fill="#58a83a"/><path d="M576 298 h68 M610 282 v32" stroke="#fff" stroke-width="1.4"/><path d="M566 300 a44 24 0 0 1 88 0" stroke="#1a1a1a" stroke-width="3" fill="none"/>
<rect x="652" y="336" width="58" height="14" fill="#fbf7ee"/><rect x="672" y="330" width="18" height="20" fill="#fbf7ee"/><path d="M672 330 q9 -8 18 0z" fill="#b8c4cb"/>
<rect x="684" y="384" width="14" height="10" fill="#fbf7ee"/><path d="M684 384 a7 7 0 0 1 14 0z" fill="#b8c4cb"/><rect x="681" y="374" width="2" height="20" fill="#fbf7ee"/><rect x="699" y="374" width="2" height="20" fill="#fbf7ee"/>
<rect x="534" y="360" width="20" height="48" rx="3" fill="#efe2c8"/><rect x="532" y="358" width="24" height="5" fill="#d9c7a5"/><path d="M530 360 l14 -28 l14 28z" fill="#5d7f95"/><g class="win"><rect x="538" y="370" width="4" height="6"/><rect x="546" y="370" width="4" height="6"/><rect x="538" y="386" width="4" height="6"/><rect x="546" y="386" width="4" height="6"/></g>
<rect x="470" y="520" width="104" height="34" rx="4" fill="#f4ecdc"/><path d="M482 522 a40 38 0 0 1 80 0z" fill="#b8c4cb"/><path d="M504 500 a18 16 0 0 1 36 0z" fill="#a7b4bc"/><path d="M474 522 a10 9 0 0 1 20 0z M550 522 a10 9 0 0 1 20 0z" fill="#a7b4bc"/><rect x="520" y="474" width="4" height="12" fill="#d4ac0d"/>
<g fill="#f4ecdc">${[452, 464, 582, 594].map((x) => `<rect x="${x}" y="${x % 2 ? 476 : 468}" width="7" height="86"/>`).join('')}<rect x="466" y="500" width="6" height="56"/><rect x="574" y="500" width="6" height="56"/></g>
<g fill="#8fa1ab">${[452, 464, 582, 594].map((x) => `<path d="M${x} ${x % 2 ? 476 : 468} l3.5 -18 l3.5 18z"/>`).join('')}<path d="M466 500 l3 -14 l3 14z M574 500 l3 -14 l3 14z"/></g>
<rect x="608" y="514" width="40" height="34" fill="#e9b49a"/><path d="M612 516 a16 16 0 0 1 32 0z" fill="#9fb0b8"/><rect x="604" y="496" width="5" height="52" fill="#e9b49a"/><rect x="647" y="496" width="5" height="52" fill="#e9b49a"/><path d="M604 496 l2.5 -12 l2.5 12z M647 496 l2.5 -12 l2.5 12z" fill="#8fa1ab"/>
<rect x="666" y="496" width="26" height="10" fill="#fbf4e6"/><rect x="674" y="486" width="8" height="12" fill="#fbf4e6"/><path d="M673 486 l5 -9 l5 9z" fill="#7d8f99"/>
<rect x="772" y="568" width="44" height="22" fill="#e9c9a4"/><rect x="772" y="560" width="9" height="30" fill="#e4bf96"/><rect x="807" y="560" width="9" height="30" fill="#e4bf96"/><path d="M771 560 l5.5 -9 l5.5 9z M806 560 l5.5 -9 l5.5 9z" fill="#5d6d7a"/><path d="M781 568 l13 -8 l13 8z" fill="#5d6d7a"/><g class="win"><rect x="785" y="574" width="4" height="8"/><rect x="792" y="574" width="4" height="8"/><rect x="799" y="574" width="4" height="8"/></g>
<path d="M850 392 l3 -96 h4 l3 96z" fill="#e8eef2"/><ellipse cx="855" cy="318" rx="9" ry="6" fill="#cfdbe3"/><ellipse cx="855" cy="306" rx="6" ry="4" fill="#cfdbe3"/><path d="M855 296 v-26" stroke="#d0d8de" stroke-width="2"/><circle cx="855" cy="270" r="1.8" fill="#e63946" class="blink"/>
<rect x="872" y="380" width="34" height="16" fill="#f4f1ea"/><path d="M876 382 a13 12 0 0 1 26 0z" fill="#b8c4cb"/><g fill="#f4f1ea"><rect x="866" y="356" width="3" height="40"/><rect x="909" y="356" width="3" height="40"/><rect x="870" y="362" width="3" height="34"/><rect x="905" y="362" width="3" height="34"/></g>
${tower(1056, 300, 20, 72, '#9cd3f0', '#68aed8')}${tower(1080, 282, 22, 90, '#7fc3ea', '#4c9bcc', true)}${tower(1106, 312, 18, 60, '#b4def4', '#82bde0')}${tower(1126, 326, 16, 46, '#8fd0f2', '#5fa8d6')}
<rect x="200" y="420" width="70" height="34" rx="3" fill="#d5dade"/><path d="M200 420 l12 -14 v14 l12 -14 v14 l12 -14 v14 l12 -14 v14 l12 -14 v14 l10 -12 v12z" fill="#95a5a6"/><rect x="276" y="384" width="10" height="70" fill="#b4542a"/><g class="smk" fill="#fff"><circle cx="281" cy="378" r="5"/><circle cx="284" cy="372" r="6"/><circle cx="280" cy="366" r="7"/></g>
<rect x="96" y="590" width="74" height="34" rx="3" fill="#f6e6d3"/><path d="M92 592 l41 -20 l41 20z" fill="#a93226"/><rect x="126" y="556" width="14" height="22" fill="#f6e6d3"/><path d="M124 558 l9 -12 l9 12z" fill="#a93226"/><circle cx="133" cy="566" r="3.5" fill="#fff" stroke="#a93226" stroke-width="1"/>
${tower(1086, 536, 20, 56, '#f3d3c0', '#d9ab92')}${tower(1112, 516, 22, 76, '#e6ecef', '#bcc8cf', true)}${tower(1140, 532, 20, 60, '#f6e0a8', '#d9bf7a')}${tower(1166, 524, 20, 68, '#d9ecf6', '#a9cbe0')}${tower(1190, 544, 16, 48, '#f3d3c0', '#d9ab92')}
<ellipse cx="960" cy="634" rx="32" ry="16" fill="#1f3a6b"/><ellipse cx="960" cy="633" rx="23" ry="10" fill="#58a83a"/><path d="M937 633 h46" stroke="#fff" stroke-width="1"/><path d="M928 634 a32 16 0 0 1 64 0" stroke="#ffd500" stroke-width="2.5" fill="none"/>
</g>
<g class="km-water" font-family="Nunito, sans-serif" font-weight="800"><text x="300" y="812" fill="#0f5f95" opacity=".55" letter-spacing="7" font-size="13">MARMARA DENİZİ</text><text x="784" y="96" transform="rotate(-78 784 96)" fill="#fff" opacity=".75" letter-spacing="4" font-size="10.5">İSTANBUL BOĞAZI</text><text x="545" y="440" fill="#fff" opacity=".75" letter-spacing="3" font-size="10.5">HALİÇ</text></g>
<g font-family="Nunito, sans-serif" font-weight="800" fill="#2d5a7a" font-size="10.5" text-anchor="middle" paint-order="stroke" stroke="#e8f7fd" stroke-width="3" stroke-linejoin="round"><text x="986" y="776">Kınalıada</text><text x="1066" y="804">Burgazada</text><text x="1168" y="824">Heybeliada</text><text x="1252" y="842" text-anchor="end">Büyükada</text><text x="752" y="566" font-size="9.5">Kız Kulesi</text></g>
<g font-family="Nunito, sans-serif" font-size="12.5" font-weight="800" fill="#7a6a4a" opacity=".6" letter-spacing="5"><text x="40" y="404" transform="rotate(-90 40 404)">AVRUPA YAKASI</text><text x="1372" y="300" transform="rotate(90 1372 300)">ANADOLU YAKASI</text></g>`;
  }

  /* ---------- Rota: dükkândan yere (gerekirse köprüden) ---------- */
  M.routePath = function (from, to) {
    const side = (p) => (p.x > 745 ? 'A' : 'E');
    if (side(from) === side(to)) {
      const mx = (from.x + to.x) / 2,
        my = (from.y + to.y) / 2 - 40;
      return `M${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
    }
    const br =
      Math.abs((from.y + to.y) / 2 - 170) < Math.abs((from.y + to.y) / 2 - 376)
        ? [
            [836, 161],
            [700, 176]
          ]
        : [
            [826, 380],
            [700, 372]
          ];
    const [a, b] = side(from) === 'A' ? br : [br[1], br[0]];
    return `M${from.x} ${from.y} C ${from.x} ${(from.y + a[1]) / 2}, ${a[0] + 20} ${a[1]}, ${a[0]} ${a[1]} L ${b[0]} ${b[1]} C ${b[0] - 20 * (side(from) === 'A' ? 1 : -1)} ${b[1]}, ${to.x} ${(b[1] + to.y) / 2}, ${to.x} ${to.y}`;
  };

  const esc = (s) =>
    String(s == null ? '' : s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  const iconAt = (name, x, y, size, color) =>
    KE.ART.icon(name).replace(
      '<svg ',
      `<svg x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" style="color:${color || '#fff'}" `
    );

  function shopMark(P, b, act, status, champ) {
    const dx = P.x - 906,
      dy = P.y - 542;
    const NW = Math.max(b.name.length * 8.6, status.length * 6.2) + 34;
    const px = P.x - 24;
    return `<g class="place shopmark ${act ? 'act' : ''}" data-a="viewBranch" data-id="${b.id}" tabindex="0" role="button" aria-label="${esc(b.name)}">
      ${act ? `<ellipse class="halo" cx="${P.x}" cy="${P.y + 18}" rx="70" ry="30" fill="url(#kmGlow)"/>` : ''}
      <g transform="translate(${dx} ${dy})"><rect x="866" y="484" width="108" height="92" fill="transparent"/><g class="lift" filter="url(#kmDs)"><rect x="880" y="522" width="52" height="40" rx="6" fill="#fff3df"/><path d="M876 526 h60 v8 q-5 6 -10 0 q-5 6 -10 0 q-5 6 -10 0 q-5 6 -10 0 q-5 6 -10 0 q-5 6 -10 0z" fill="#d7263d"/><rect class="shopwin" x="888" y="540" width="16" height="14" rx="2" fill="#ffe89a"/><rect x="910" y="538" width="14" height="24" rx="2" fill="#8a4e24"/><path d="M940 524 v-30" stroke="#5a3b1a" stroke-width="3"/><path d="M941 494 h22 l-5 6 l5 6 h-22z" fill="#ffc93c"/></g>
      <g filter="url(#kmDs)"><rect x="${px - NW / 2}" y="${P.y - 102}" width="${NW}" height="46" rx="23" fill="${act ? '#d7263d' : '#fff'}"/><path d="M${P.x - 8} ${P.y - 56} l8 9 l8 -9z" fill="${act ? '#d7263d' : '#fff'}"/>
      <text x="${px}" y="${P.y - 80}" text-anchor="middle" class="shopname ${act ? 'on' : ''}">${esc(b.name)}</text><text x="${px}" y="${P.y - 64}" text-anchor="middle" class="shopstat ${act ? 'on' : ''}">${esc(status)}</text>
      ${champ ? `<g transform="translate(${px + NW / 2 - 6} ${P.y - 102})"><circle r="14" fill="#ffc93c" stroke="#fff" stroke-width="3"/>${iconAt('crown', 0, 0, 18, '#7a1f3d')}</g>` : ''}</g></g></g>`;
  }

  /* Görünmez dokunma alanı: pimin çevresinde kare; yakın pimlerle çakışan kısım ortadan bölünür (Voronoi),
     böylece iki pim arasında dokunulan yer hangisinin merkezine yakınsa ona gider. Alan .lift dışında durur:
     üzerine gelince kalkan çizim dokunma alanını oynatmaz (titreme olmaz). */
  let hitHalf = 30;
  function hitPoly(i) {
    const c = M.PLACES[i],
      h = hitHalf;
    let poly = [
      [c.x - h, c.y - h],
      [c.x + h, c.y - h],
      [c.x + h, c.y + h],
      [c.x - h, c.y + h]
    ];
    M.PLACES.forEach((q, j) => {
      if (j === i || Math.abs(q.x - c.x) > 2 * h || Math.abs(q.y - c.y) > 2 * h) return;
      const nx = q.x - c.x,
        ny = q.y - c.y,
        mx = (q.x + c.x) / 2,
        my = (q.y + c.y) / 2;
      const side = (pt) => (pt[0] - mx) * nx + (pt[1] - my) * ny; /* <= 0: c tarafı */
      const out = [];
      poly.forEach((a, k) => {
        const b = poly[(k + 1) % poly.length],
          sa = side(a),
          sb = side(b);
        if (sa <= 0) out.push(a);
        if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
          const t = sa / (sa - sb);
          out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        }
      });
      poly = out;
    });
    return poly.map((pt) => pt[0].toFixed(1) + ',' + pt[1].toFixed(1)).join(' ');
  }

  /* opts: pick (semt seçimi), fill, tasks [{id, n, label, color}], route (yer id), focus (yer id) */
  const DLBLS = () =>
    `<g class="dlbls" font-family="Nunito, sans-serif" font-size="14.5" font-weight="800" text-anchor="middle" paint-order="stroke" stroke="#fffaf0" stroke-width="4" stroke-linejoin="round">${LABELS.map((l) => `<text x="${l[0]}" y="${l[1]}" class="dlbl" fill="#5b4a2e">${l[2]}</text>`).join('')}</g>`;
  const svgOpen = (opts, cls) =>
    `<svg preserveAspectRatio="${opts.par || (opts.fill ? 'xMidYMid slice' : 'xMidYMid meet')}" class="citymap ${cls || ''}" viewBox="0 0 1400 860" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Şehir haritası">`;
  /* Tek parça çizim (semt seçimi gibi bir kez çizilen yerler için) */
  M.render = function (opts) {
    opts = opts || {};
    if (!BASE) BASE = buildBase();
    const night = KE.G && KE.G.phase === 'closing' && !opts.pick;
    return (
      svgOpen(opts, (night ? 'night ' : '') + (opts.pick ? 'picking' : '')) +
      BASE +
      (opts.pick ? '' : DLBLS()) +
      M.overlay(opts) +
      '</svg>'
    );
  };
  /* Katmanlı çizim: zemin bir kez ayrıştırılır ve saklanır, yalnızca üst katman güncellenir */
  let baseEl = null;
  M.mount = function (frame, opts) {
    if (!BASE) BASE = buildBase();
    if (!baseEl) {
      const t = document.createElement('div');
      t.innerHTML = svgOpen(opts, 'base') + BASE + DLBLS() + '</svg>';
      baseEl = t.firstChild;
    }
    frame.classList.add('layered');
    frame.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'mapinner';
    inner.appendChild(baseEl);
    const ov = document.createElement('div');
    ov.innerHTML = svgOpen(opts, 'overlay') + '</svg>';
    inner.appendChild(ov.firstChild);
    frame.appendChild(inner);
    M.update(frame, opts);
  };
  M.update = function (frame, opts) {
    const base = frame.querySelector('svg.base'),
      ov = frame.querySelector('svg.overlay');
    if (!base || !ov) return M.mount(frame, opts);
    const par = opts.par || (opts.fill ? 'xMidYMid slice' : 'xMidYMid meet');
    [base, ov].forEach((el) => {
      if (el.getAttribute('preserveAspectRatio') !== par) el.setAttribute('preserveAspectRatio', par);
    });
    const night = KE.G && KE.G.phase === 'closing';
    base.classList.toggle('night', !!night);
    ov.classList.toggle('night', !!night);
    /* üst katman değişmediyse yeniden yazılmaz (rAF / yeniden boyutlama yenilemeleri çoğu zaman aynı çizimi üretir) */
    const html = M.overlay(opts),
      O = /** @type {any} */ (ov);
    if (O._h !== html || ov.childNodes.length === 0) {
      ov.innerHTML = html;
      O._h = html;
    }
    /* dokunma alanı ekranda en az 48 px olsun: bir pimin ekrandaki boyundan ölçek bulunur (yakınlaştırmasız, --mz = 1),
       viewBox birimine çevrilir; değiştiyse katman bir kez yeniden çizilir */
    const pin = ov.querySelector('g.place.fac .lift rect');
    const w = pin ? pin.getBoundingClientRect().width : 0;
    if (w) {
      const k = w / 52 / (parseFloat(frame.style.getPropertyValue('--mz')) || 1);
      const h = Math.round(Math.max(30, Math.min(90, 24 / Math.max(0.05, k))));
      if (Math.abs(h - hitHalf) > 2) {
        hitHalf = h;
        const h2 = M.overlay(opts);
        ov.innerHTML = h2;
        O._h = h2;
      }
    }
  };
  /* Üst katman: tesisler, dükkânlar, iş etiketleri, rota, bulutlar (ve seçim modunda semtler) */
  M.overlay = function (opts) {
    const G = KE.G;
    const pick = !!opts.pick;
    const phase = G ? G.phase : 'morning';
    let s = '';
    if (phase === 'closing' && !pick)
      s += '<rect width="1400" height="860" fill="url(#kmNight)" pointer-events="none"/>';

    if (pick) {
      KE.DISTRICTS.forEach((d) => {
        const P = M.POS[d.id],
          sel = KE.UI.ng.district === d.id;
        const W = d.name.length * 9.4 + 40;
        s += `<g class="place dpick ${sel ? 'sel' : ''}" data-a="pickDistrict" data-d="${d.id}" tabindex="0" role="button" aria-label="${esc(d.name)}">
          <circle cx="${P.x}" cy="${P.y}" r="${sel ? 40 : 30}" fill="${sel ? '#d7263d' : '#fff'}" opacity="${sel ? 0.25 : 0.35}" class="${sel ? 'pulse' : ''}"/>
          <g filter="url(#kmDs)"><circle cx="${P.x}" cy="${P.y}" r="14" fill="${sel ? '#d7263d' : '#fff'}" stroke="${sel ? '#fff' : '#d7263d'}" stroke-width="4"/>
          <rect x="${P.x - W / 2}" y="${P.y - 60}" width="${W}" height="34" rx="17" fill="${sel ? '#d7263d' : '#fffaf0'}"/><path d="M${P.x - 7} ${P.y - 26} l7 8 l7 -8z" fill="${sel ? '#d7263d' : '#fffaf0'}"/>
          <text x="${P.x}" y="${P.y - 37}" text-anchor="middle" class="pickname ${sel ? 'on' : ''}">${esc(d.name)}</text></g></g>`;
      });
      return s;
    }

    /* rota */
    const act = G && G.branches.find((b) => b.id === G.activeBranch);
    if (opts.route && act) {
      const p = M.place(opts.route),
        from = M.POS[act.district];
      if (p && from) {
        const d = M.routePath(from, p);
        s += `<path d="${d}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".9"/><path class="march" d="${d}" fill="none" stroke="${p.color}" stroke-width="5" stroke-dasharray="2 10" stroke-linecap="round"/>`;
      }
    }
    /* tesis rozetleri */
    M.PLACES.forEach((p, i) => {
      const eraLock = G && KE.placeOpen && !KE.placeOpen(G, p.id);
      const locked = !eraLock && p.id === 'ciftlik' && G && !G.farm;
      const lbl = p.name + (eraLock ? ` · ${KE.PLACE_ERA[p.id]}. dönem` : locked ? ' · satılık' : '');
      const W = lbl.length * 7.3 + 26;
      const foc = opts.focus === p.id || opts.route === p.id;
      s += `<g class="place fac ${foc ? 'foc' : ''} ${eraLock ? 'eralock' : ''}" data-a="go" data-s="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)}">
        ${foc ? `<circle cx="${p.x}" cy="${p.y}" r="34" fill="${p.color}" opacity=".45" class="pulse"/>` : ''}
        <polygon class="hit" points="${hitPoly(i)}" fill="transparent"/>
        <g class="lift"><g filter="url(#kmDs)"><rect x="${p.x - 26}" y="${p.y - 26}" width="52" height="52" rx="14" fill="${eraLock ? '#a99a88' : p.color}" stroke="#fff" stroke-width="4"/>${iconAt(eraLock ? 'lock' : p.icon, p.x, p.y, 28)}
        <g class="plg"><rect x="${p.x - W / 2}" y="${p.y + 34}" width="${W}" height="24" rx="12" fill="#fff"/><text x="${p.x}" y="${p.y + 51}" text-anchor="middle" class="plbl">${esc(lbl)}</text></g></g>
        ${locked ? `<circle cx="${p.x + 24}" cy="${p.y - 24}" r="10" fill="#ffc93c" stroke="#fff" stroke-width="2.5"/><text x="${p.x + 24}" y="${p.y - 20}" text-anchor="middle" class="poi-tag">₺</text>` : ''}</g></g>`;
    });
    /* iş etiketleri */
    (opts.tasks || []).forEach((t) => {
      const p = M.place(t.id);
      if (!p) return;
      const w = t.label.length * 6.6 + 40,
        x = p.x + 18,
        y = p.y - 34;
      s += `<g class="tasktag" pointer-events="none" filter="url(#kmDs)"><rect x="${x}" y="${y - 11}" width="${w}" height="22" rx="11" fill="#fff" stroke="${t.color}" stroke-width="2"/><circle cx="${x + 11}" cy="${y}" r="9" fill="${t.color}"/><text x="${x + 11}" y="${y + 4}" text-anchor="middle" class="tnum">${t.n}</text><text x="${x + 25}" y="${y + 4}" class="tlbl">${esc(t.label)}</text></g>`;
    });
    /* dükkânlar */
    if (G)
      G.branches.forEach((b) => {
        const P = M.POS[b.district];
        if (!P) return;
        const L = G.live && G.live[b.id];
        const status =
          G.phase === 'service' && L
            ? L.closed
              ? 'Ustası yok, kapalı'
              : L.done
                ? 'Kapandı'
                : `Açık · ${L.queue.length} sırada · ${KE.tl(L.stats.revenue)}`
            : G.phase === 'closing'
              ? 'Kepenk indi'
              : 'Sabah hazırlığı';
        s += shopMark(P, b, b.id === G.activeBranch, status, b.championUntil && G.day <= b.championUntil);
      });
    /* bulutlar */
    s +=
      '<g class="cl" pointer-events="none"><g fill="#fff" opacity=".75"><ellipse cx="100" cy="110" rx="60" ry="16"/><ellipse cx="128" cy="98" rx="34" ry="16"/></g><ellipse cx="110" cy="190" rx="56" ry="9" fill="#1d4a6b" opacity=".07"/></g><g class="cl cl2" pointer-events="none"><g fill="#fff" opacity=".7"><ellipse cx="200" cy="470" rx="64" ry="16"/><ellipse cx="230" cy="456" rx="38" ry="18"/></g></g>';
    return s;
  };
})();
