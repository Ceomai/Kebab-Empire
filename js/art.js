/* Kebab Empire — vektör çizim kütüphanesi
   Bütün görseller SVG: yemekler, ocaklar, sahne mobilyası, çiftlik hayvanları, harita binaları, arayüz ikonları.
   Tek çizgi dili: koyu kahve, yarı saydam kontur; yumuşak gölge; sıcak ışık. */
(function () {
  /** @type {any} */
  const A = KE.ART = {};
  let uid = 0;
  const id = (p) => (p || 'k') + (++uid);
  const INK = '#3b2417';
  const OL = `stroke="${INK}" stroke-opacity=".55" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"`;
  const svg = (vb, body, cls, label) => `<svg class="${cls || ''}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"'}>${body}</svg>`;

  /* ---------------- Yemekler (64×64) ---------------- */
  const plate = (rx, ry, cy) => `<ellipse cx="32" cy="${cy + 3}" rx="${rx}" ry="${ry}" fill="#000" opacity=".12"/><ellipse cx="32" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fbfaf6" ${OL}/><ellipse cx="32" cy="${cy - 1}" rx="${rx - 5}" ry="${ry - 3}" fill="#efe9dc"/>`;
  const lavas = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#f1d199" ${OL}/><g fill="#c98d3f" opacity=".55"><circle cx="${x + w * 0.25}" cy="${y + h * 0.35}" r="1.4"/><circle cx="${x + w * 0.6}" cy="${y + h * 0.6}" r="1.6"/><circle cx="${x + w * 0.8}" cy="${y + h * 0.3}" r="1.2"/></g>`;
  const pepper = (x, y, r) => `<path d="M${x} ${y} q8 -6 16 -1 q-6 7 -16 1z" fill="#3f9b3a" transform="rotate(${r || 0} ${x} ${y})" ${OL}/><path d="M${x + 2} ${y - 1} q6 -3 11 -1" stroke="#9fd86b" stroke-width="1.2" fill="none" transform="rotate(${r || 0} ${x} ${y})"/>`;
  const tomato = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r || 5}" fill="#e2412d" ${OL}/><path d="M${x - 2} ${y - (r || 5) + 1} l2 2 l2 -2" stroke="#2f7a2a" stroke-width="1.6" fill="none"/><circle cx="${x - 1.5}" cy="${y - 1.5}" r="1.3" fill="#fff" opacity=".6"/>`;
  const parsley = (x, y) => `<g fill="#4caf50"><circle cx="${x}" cy="${y}" r="2.2"/><circle cx="${x + 3}" cy="${y + 1}" r="2"/><circle cx="${x + 1}" cy="${y + 3}" r="2"/></g>`;
  const meatStrips = (x, y, w, c1, c2) => { let s = ''; for (let i = 0; i < 5; i++) s += `<path d="M${x + i * w / 5} ${y + (i % 2) * 2} q${w / 10} -4 ${w / 5} 0 l-1 6 q-${w / 10} 3 -${w / 5} 0z" fill="${i % 2 ? c1 : c2}" ${OL}/>`; return s; };
  const wrap = (fill1, fill2) => `<g transform="rotate(-24 32 34)"><rect x="20" y="10" width="24" height="44" rx="11" fill="#f1d199" ${OL}/>
      <path d="M21 18 q11 -10 22 0 l0 6 q-11 -5 -22 0z" fill="${fill1}"/><circle cx="26" cy="15" r="2.6" fill="#e2412d"/><circle cx="37" cy="14" r="2.4" fill="#5cb85c"/><circle cx="31" cy="13" r="2.4" fill="${fill2}"/>
      <path d="M19 34 h26 v15 a11 11 0 0 1 -26 0z" fill="#fff" ${OL}/><path d="M19 38 h26 M19 43 h26" stroke="#d7263d" stroke-width="2.4"/></g>`;
  const DISH = {
    tavuk_durum: () => wrap('#e9b85a', '#f2cf7d'),
    et_durum: () => wrap('#8a4520', '#a55a2c'),
    ekmek_arasi: () => `<ellipse cx="32" cy="50" rx="24" ry="4" fill="#000" opacity=".12"/><path d="M8 38 q2 -22 24 -24 q22 2 24 24 q-24 8 -48 0z" fill="#e0a85c" ${OL}/><path d="M12 34 q20 -12 40 0" stroke="#b9782f" stroke-width="2" fill="none"/>
      <path d="M9 40 q23 9 46 0 l-1 6 q-22 8 -44 0z" fill="#8a4520" ${OL}/><path d="M12 41 q20 7 40 0" stroke="#e2412d" stroke-width="3" fill="none"/><path d="M14 43 q18 5 36 0" stroke="#5cb85c" stroke-width="2" fill="none"/>`,
    iskender: () => plate(28, 15, 40) + `<path d="M12 40 q20 -10 40 0 q-20 9 -40 0z" fill="#e6b067" ${OL}/>${meatStrips(14, 33, 30, '#8a4520', '#a55a2c')}
      <path d="M14 38 q14 -6 30 -1" stroke="#c0392b" stroke-width="4" fill="none" opacity=".85"/><ellipse cx="47" cy="42" rx="8" ry="5" fill="#fff" ${OL}/><path d="M18 34 q6 -3 12 0" stroke="#fff6c8" stroke-width="2" opacity=".8"/>${pepper(36, 46, -10)}`,
    pilav_ustu: () => plate(27, 14, 41) + `<path d="M12 42 q20 -18 40 0 q-20 8 -40 0z" fill="#fffdf6" ${OL}/><g fill="#efe6cf">${'<circle cx="18" cy="40" r="1.2"/><circle cx="24" cy="36" r="1.2"/><circle cx="40" cy="37" r="1.2"/><circle cx="46" cy="41" r="1.2"/>'}</g>${meatStrips(18, 30, 28, '#8a4520', '#a55a2c')}${pepper(14, 46, 10)}`,
    tavuk_porsiyon: () => plate(27, 14, 41) + `<path d="M10 42 q11 -14 22 0 q-11 6 -22 0z" fill="#fffdf6" ${OL}/>${meatStrips(28, 33, 24, '#e2a64b', '#f2c46d')}<g>${tomato(18, 46, 3.5)}<path d="M40 46 q5 -4 10 0 q-5 3 -10 0z" fill="#7cc35d" ${OL}/></g>`,
    cag: () => `<ellipse cx="32" cy="52" rx="26" ry="5" fill="#000" opacity=".12"/>${lavas(6, 36, 52, 14)}<path d="M2 32 h60" stroke="#9aa3ab" stroke-width="2.5" stroke-linecap="round"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${10 + i * 7}" y="24" width="8" height="15" rx="3" fill="${i % 2 ? '#7b3d1b' : '#9a5328'}" ${OL}/>`).join('')}<path d="M8 50 q6 -4 12 0 M42 50 q6 -4 12 0" stroke="#c84bc0" stroke-width="2" fill="none"/>`,
    adana: () => `<ellipse cx="32" cy="52" rx="27" ry="5" fill="#000" opacity=".12"/>${lavas(4, 34, 56, 16)}<path d="M2 36 h60" stroke="#9aa3ab" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M10 36 q2 -6 7 -4 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q5 -2 6 4 q-2 5 -6 3 q-4 3 -8 0 q-4 3 -8 0 q-4 3 -8 0 q-4 3 -8 0 q-5 3 -7 -3z" fill="#a8441f" ${OL}/>
      <g fill="#e2412d" opacity=".9"><circle cx="16" cy="33" r=".9"/><circle cx="26" cy="35" r=".9"/><circle cx="36" cy="33" r=".9"/><circle cx="46" cy="35" r=".9"/></g>${tomato(12, 47, 4)}${pepper(40, 48, -6)}`,
    urfa: () => `<ellipse cx="32" cy="52" rx="27" ry="5" fill="#000" opacity=".12"/>${lavas(4, 34, 56, 16)}<path d="M2 36 h60" stroke="#9aa3ab" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M10 36 q2 -6 7 -4 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q5 -2 6 4 q-2 5 -6 3 q-4 3 -8 0 q-4 3 -8 0 q-4 3 -8 0 q-4 3 -8 0 q-5 3 -7 -3z" fill="#7d4527" ${OL}/>${pepper(10, 48, 4)}${pepper(36, 48, -4)}<path d="M28 44 q4 -3 8 0" stroke="#c84bc0" stroke-width="2" fill="none"/>`,
    kuzu_sis: () => `<ellipse cx="32" cy="52" rx="27" ry="5" fill="#000" opacity=".12"/>${lavas(4, 36, 56, 14)}<path d="M2 32 h60" stroke="#9aa3ab" stroke-width="2.5" stroke-linecap="round"/>
      ${[0, 1, 2, 3, 4].map((i) => `<rect x="${9 + i * 9.5}" y="25" width="9" height="13" rx="2.5" fill="${['#8a4520', '#9a5328', '#7b3d1b', '#9a5328', '#8a4520'][i]}" ${OL}/><path d="M${11 + i * 9.5} 28 l4 0" stroke="#5a2a10" stroke-width="1.4"/>`).join('')}${tomato(50, 46, 4)}${parsley(12, 45)}`,
    beyti: () => plate(28, 15, 40) + [0, 1, 2, 3].map((i) => `<g transform="translate(${10 + i * 11} 30)"><ellipse cx="5" cy="6" rx="6" ry="6.5" fill="#f1d199" ${OL}/><circle cx="5" cy="6" r="3.2" fill="#8a4520"/></g>`).join('') + `<path d="M10 44 q22 6 44 0" stroke="#c0392b" stroke-width="3.5" fill="none"/><ellipse cx="50" cy="45" rx="6" ry="4" fill="#fff" ${OL}/>`,
    ali_nazik: () => plate(28, 15, 40) + `<path d="M10 41 q22 -14 44 0 q-22 9 -44 0z" fill="#efe3c6" ${OL}/><path d="M14 40 q18 -9 36 0" stroke="#8a6a8a" stroke-width="2" opacity=".5" fill="none"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${17 + i * 6}" y="${31 + (i % 2) * 2}" width="6" height="6" rx="2" fill="#8a4520" ${OL}/>`).join('')}<path d="M20 36 q8 -2 16 0" stroke="#f1c40f" stroke-width="1.6" opacity=".9"/>`,
    lahmacun: () => `<ellipse cx="32" cy="36" rx="28" ry="20" fill="#000" opacity=".12"/><ellipse cx="32" cy="33" rx="28" ry="20" fill="#e9c27e" ${OL}/><ellipse cx="32" cy="33" rx="24" ry="16" fill="#c0492b"/>
      <g fill="#8a2c1a" opacity=".7"><circle cx="24" cy="28" r="1.6"/><circle cx="36" cy="26" r="1.4"/><circle cx="42" cy="36" r="1.6"/><circle cx="28" cy="38" r="1.4"/><circle cx="20" cy="35" r="1.2"/></g>${parsley(36, 30)}${parsley(22, 32)}
      <path d="M46 40 a7 7 0 0 1 10 -6 l-5 6z" fill="#f7e55c" ${OL}/>`,
    ciger: () => `<ellipse cx="32" cy="52" rx="27" ry="5" fill="#000" opacity=".12"/>${lavas(4, 36, 56, 14)}<path d="M2 31 h60" stroke="#9aa3ab" stroke-width="2.5" stroke-linecap="round"/>
      ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${8 + i * 7}" y="26" width="6.5" height="10" rx="2" fill="${i % 3 === 2 ? '#fdfefe' : '#5d2a1a'}" ${OL}/>`).join('')}${parsley(14, 45)}${parsley(44, 46)}`,
    tantuni: () => `<g transform="rotate(-18 32 34)"><rect x="18" y="12" width="28" height="42" rx="12" fill="#f3d9a5" ${OL}/><path d="M20 22 q12 -10 24 0 l0 5 q-12 -5 -24 0z" fill="#9c4a22"/>
      <g stroke="#7a3315" stroke-width="2.2" stroke-linecap="round"><path d="M24 17 l4 3 M30 15 l3 4 M36 16 l2 4"/></g>${parsley(26, 15)}<circle cx="38" cy="14" r="2.4" fill="#e2412d"/>
      <path d="M17 36 h30 v14 a12 12 0 0 1 -30 0z" fill="#fdfefe" ${OL}/><path d="M17 40 h30" stroke="#f28c28" stroke-width="2.6"/><path d="M17 45 h30" stroke="#23a26d" stroke-width="2.6"/></g>`,
    kunefe: () => `<ellipse cx="32" cy="44" rx="27" ry="12" fill="#000" opacity=".12"/><ellipse cx="32" cy="41" rx="27" ry="12" fill="#b87333" ${OL}/><ellipse cx="32" cy="38" rx="23" ry="9.5" fill="#e8892c" ${OL}/>
      <path d="M14 37 q6 -4 12 0 t12 0 t12 0" stroke="#c76a12" stroke-width="1.6" fill="none"/><path d="M16 40 q6 -3 12 0 t12 0 t10 0" stroke="#f6b04f" stroke-width="1.3" fill="none"/>
      <g fill="#7cc35d"><circle cx="26" cy="35" r="1.8"/><circle cx="32" cy="33" r="1.6"/><circle cx="38" cy="36" r="1.8"/><circle cx="30" cy="39" r="1.5"/><circle cx="35" cy="40" r="1.4"/></g>
      <path d="M20 33 q8 -3 14 -1" stroke="#fff6c8" stroke-width="2" fill="none" opacity=".8"/>`,
    icli_kofte: () => plate(26, 13, 42) + [[20, 38], [34, 34], [44, 40]].map(([x, y]) => `<g transform="rotate(-20 ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="9" ry="6" fill="#a8541f" ${OL}/><path d="M${x - 8} ${y} q8 -5 16 0" stroke="#d07a3a" stroke-width="1.6" fill="none"/></g>`).join('') + `<path d="M48 48 a5 5 0 0 1 8 -4 l-4 5z" fill="#f7e55c" ${OL}/>${parsley(14, 46)}`,
    ayran: () => `<ellipse cx="32" cy="58" rx="13" ry="3" fill="#000" opacity=".14"/><path d="M19 16 h26 l-3 40 h-20z" fill="#b87333" ${OL}/><path d="M21 22 h22" stroke="#e8a26a" stroke-width="2"/><path d="M19 16 h26 l-1 6 h-24z" fill="#fff" ${OL}/>
      <path d="M20 16 q4 -7 8 -1 q3 -6 7 0 q4 -6 9 1z" fill="#fff" ${OL}/><path d="M41 20 v30" stroke="#f3c08a" stroke-width="2" opacity=".6"/>`
  };
  A.dish = (pid, cls) => svg('0 0 64 64', (DISH[pid] || DISH.ayran)(), 'dish ' + (cls || ''), '');

  /* ---------------- Döner ocağı ---------------- */
  A.doner = function (kind) {
    const g = id('dg'), c = id('dc');
    const meat = kind === 'tavuk' ? ['#c98b3a', '#e7b261', '#b77a2c'] : ['#7a3a18', '#a1552a', '#5f2c12'];
    return svg('0 0 120 190', `<defs>
      <linearGradient id="${g}" x1="0" x2="1"><stop offset="0" stop-color="${meat[2]}"/><stop offset=".45" stop-color="${meat[1]}"/><stop offset="1" stop-color="${meat[2]}"/></linearGradient>
      <pattern id="${c}" width="16" height="10" patternUnits="userSpaceOnUse"><rect width="16" height="10" fill="url(#${g})"/><path d="M0 5 q4 -3 8 0 t8 0" stroke="${meat[0]}" stroke-width="2" fill="none" opacity=".7"/>
        <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="16 0" dur="1.8s" repeatCount="indefinite"/></pattern>
      <linearGradient id="${g}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a3c"/><stop offset=".5" stop-color="#ffd34d"/><stop offset="1" stop-color="#ff7a2c"/></linearGradient></defs>
      <rect x="24" y="174" width="72" height="10" rx="3" fill="#7f8c8d" ${OL}/><rect x="28" y="160" width="64" height="16" rx="4" fill="#b2bec3" ${OL}/>
      <path d="M58 8 v162" stroke="#95a5a6" stroke-width="5" stroke-linecap="round"/><circle cx="58" cy="10" r="5" fill="#bdc3c7" ${OL}/>
      <path d="M30 26 L86 26 L72 150 L44 150 Z" fill="url(#${c})" ${OL}/>
      <path d="M34 30 L42 146" stroke="#fff" stroke-width="3" opacity=".18" stroke-linecap="round"/>
      <rect x="96" y="30" width="16" height="118" rx="5" fill="#2d3436" ${OL}/>
      <rect x="99" y="36" width="10" height="106" rx="4" fill="url(#${g}h)"><animate attributeName="opacity" values=".8;1;.85;1;.8" dur="1.6s" repeatCount="indefinite"/></rect>
      <ellipse cx="92" cy="90" rx="10" ry="60" fill="#ff8a3a" opacity=".18"><animate attributeName="opacity" values=".12;.25;.12" dur="1.6s" repeatCount="indefinite"/></ellipse>`, 'art-doner');
  };
  /* ---------------- Mangal ---------------- */
  A.mangal = function (n) {
    n = n || 3;
    const w = 60 + n * 46, g = id('mg');
    let sk = '';
    for (let i = 0; i < n; i++) {
      const x = 22 + i * 46;
      sk += `<g><path d="M${x - 6} 46 h52" stroke="#9aa3ab" stroke-width="3" stroke-linecap="round"/><path d="M${x} 46 q3 -7 8 -4 q5 -5 10 0 q5 -5 10 0 q5 -3 8 4 q-3 6 -8 3 q-5 4 -10 0 q-5 4 -10 0 q-6 4 -8 -3z" fill="${i % 2 ? '#8a3c1a' : '#a64a22'}" ${OL}/></g>`;
    }
    let coals = '';
    for (let i = 0; i < n * 6; i++) coals += `<circle cx="${18 + i * (w - 36) / (n * 6)}" cy="${62 + (i % 3)}" r="${3.5 + (i % 2)}" fill="${['#ffcf3c', '#ff7b2c', '#ff5a1f'][i % 3]}"><animate attributeName="opacity" values="1;.55;1" dur="${1 + (i % 4) * 0.3}s" repeatCount="indefinite"/></circle>`;
    return svg(`0 0 ${w} 110`, `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d6d7e"/><stop offset="1" stop-color="#2c3e50"/></linearGradient></defs>
      <ellipse cx="${w / 2}" cy="60" rx="${w / 2 - 10}" ry="16" fill="#ff7b2c" opacity=".25"><animate attributeName="opacity" values=".18;.32;.18" dur="1.4s" repeatCount="indefinite"/></ellipse>
      <rect x="8" y="56" width="${w - 16}" height="16" rx="4" fill="#2b1a10"/>${coals}${sk}
      <rect x="4" y="70" width="${w - 8}" height="22" rx="5" fill="url(#${g})" ${OL}/><path d="M14 92 v14 M${w - 14} 92 v14" stroke="#2c3e50" stroke-width="5" stroke-linecap="round"/>`, 'art-mangal');
  };
  A.smoke = () => `<span class="smoke s1"></span><span class="smoke s2"></span><span class="smoke s3"></span>`;

  /* ---------------- Sahne mobilyası ---------------- */
  A.table = function (dirty, mode) {
    const top = mode === 'kebap' ? '#8e5a35' : '#c08850';
    return svg('0 0 120 70', `<ellipse cx="60" cy="62" rx="46" ry="7" fill="#000" opacity=".15"/>
      <path d="M56 30 v30 M64 30 v30" stroke="#5b3a22" stroke-width="5"/>
      <ellipse cx="60" cy="30" rx="54" ry="16" fill="${top}" ${OL}/><ellipse cx="60" cy="27" rx="54" ry="16" fill="${mode === 'kebap' ? '#a86c42' : '#d9a066'}" ${OL}/>
      <ellipse cx="60" cy="25" rx="40" ry="10" fill="none" stroke="#fff" stroke-opacity=".15" stroke-width="2"/>
      ${dirty ? `<ellipse cx="40" cy="26" rx="10" ry="4" fill="#f4f1ea" ${OL}/><ellipse cx="74" cy="28" rx="9" ry="3.6" fill="#f4f1ea" ${OL}/><circle cx="44" cy="25" r="1.4" fill="#a0522d"/><circle cx="72" cy="27" r="1.2" fill="#c0392b"/><path d="M84 22 l8 -3" stroke="#95a5a6" stroke-width="2"/>` : ''}`, 'art-table');
  };
  A.register = () => svg('0 0 80 60', `<rect x="6" y="30" width="68" height="26" rx="5" fill="#34495e" ${OL}/><rect x="14" y="6" width="40" height="26" rx="4" fill="#2c3e50" ${OL}/><rect x="18" y="10" width="32" height="14" rx="2" fill="#7bed9f"/><text x="34" y="21" text-anchor="middle" font-size="9" font-family="monospace" fill="#145a32">₺</text><g fill="#bdc3c7"><rect x="14" y="36" width="8" height="5" rx="1"/><rect x="26" y="36" width="8" height="5" rx="1"/><rect x="38" y="36" width="8" height="5" rx="1"/><rect x="14" y="44" width="8" height="5" rx="1"/><rect x="26" y="44" width="8" height="5" rx="1"/><rect x="38" y="44" width="8" height="5" rx="1"/></g><rect x="54" y="36" width="14" height="14" rx="2" fill="#d7263d"/>`, 'art-register');
  A.door = () => svg('0 0 60 120', `<rect x="2" y="2" width="56" height="116" rx="4" fill="#6e4a2f" ${OL}/><rect x="8" y="8" width="44" height="58" rx="3" fill="#bde3f7" ${OL}/><path d="M12 14 l14 0 M12 20 l8 0" stroke="#fff" stroke-width="2" opacity=".7"/><circle cx="46" cy="74" r="3" fill="#f1c40f"/><rect x="14" y="84" width="32" height="10" rx="2" fill="#d7263d"/><text x="30" y="92" text-anchor="middle" font-size="7" font-weight="800" fill="#fff" font-family="sans-serif">AÇIK</text>`, 'art-door');
  A.lamp = () => svg('0 0 40 60', `<path d="M20 0 v22" stroke="#2c3e50" stroke-width="2"/><path d="M6 36 q14 -22 28 0z" fill="#d35400" ${OL}/><ellipse cx="20" cy="37" rx="8" ry="3" fill="#fff6c8"/><ellipse cx="20" cy="50" rx="18" ry="10" fill="#ffe08a" opacity=".25"/>`, 'art-lamp');
  A.plant = () => svg('0 0 50 80', `<path d="M14 56 h22 l-3 22 h-16z" fill="#c0703a" ${OL}/><g fill="#3fa34d" ${OL}><path d="M25 56 q-18 -10 -14 -34 q12 10 14 34z"/><path d="M25 56 q16 -12 14 -36 q-14 10 -14 36z"/><path d="M25 56 q-2 -26 0 -48 q6 22 0 48z" fill="#2e8b3e"/></g>`, 'art-plant');

  /* Duvar dekorları */
  const DEC = {
    cini: `<rect x="2" y="2" width="56" height="56" rx="4" fill="#fdfefe" ${OL}/><rect x="6" y="6" width="48" height="48" fill="#1f5f9e"/><circle cx="30" cy="30" r="14" fill="#fdfefe"/><path d="M30 18 q5 7 0 12 q-5 -5 0 -12z M30 42 q5 -7 0 -12 q-5 5 0 12z M18 30 q7 -5 12 0 q-5 5 -12 0z M42 30 q-7 -5 -12 0 q5 5 12 0z" fill="#d7263d"/><circle cx="30" cy="30" r="3" fill="#2a9d8f"/><path d="M6 6 l10 10 M54 6 l-10 10 M6 54 l10 -10 M54 54 l-10 -10" stroke="#6fb3e0" stroke-width="2.5"/>`,
    bakir: `<ellipse cx="18" cy="38" rx="14" ry="9" fill="#c46f2c" ${OL}/><ellipse cx="18" cy="35" rx="10" ry="4" fill="#e59866"/><ellipse cx="42" cy="26" rx="12" ry="8" fill="#d68a4d" ${OL}/><path d="M42 18 v-12" stroke="#8a4b1c" stroke-width="3"/><ellipse cx="42" cy="24" rx="8" ry="3" fill="#f5b98a"/>`,
    nostalji: `<rect x="4" y="6" width="52" height="46" rx="2" fill="#6e2c00" ${OL}/><rect x="9" y="11" width="42" height="36" fill="#d9cdb8"/><path d="M9 40 l12 -12 l9 8 l8 -6 l13 10 v7 h-42z" fill="#7f7466"/><circle cx="40" cy="20" r="4" fill="#efe6d2"/>`,
    kilim: `<rect x="2" y="10" width="56" height="40" rx="2" fill="#a93226" ${OL}/><path d="M8 30 l8 -12 l8 12 l8 -12 l8 12 l8 -12 l6 9 M8 30 l8 12 l8 -12 l8 12 l8 -12 l8 12 l6 -9" stroke="#f4d03f" stroke-width="2.5" fill="none"/><path d="M2 14 h56 M2 46 h56" stroke="#1f5f9e" stroke-width="3"/>`,
    neon: `<rect x="2" y="12" width="56" height="34" rx="8" fill="#17202a" ${OL}/><text x="30" y="34" text-anchor="middle" font-size="13" font-weight="900" font-family="sans-serif" fill="#ff4fd8" style="filter:drop-shadow(0 0 3px #ff4fd8)">7/24</text>`,
    grafiti: `<rect x="2" y="2" width="56" height="56" rx="4" fill="#fbe7a1" ${OL}/><path d="M8 46 q10 -26 20 -10 q10 16 22 -18" stroke="#e74c3c" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="16" cy="16" r="7" fill="#3498db"/><path d="M38 44 l10 6" stroke="#27ae60" stroke-width="5" stroke-linecap="round"/>`,
    taburet: `<rect x="2" y="16" width="56" height="7" rx="3" fill="#6e2c00" ${OL}/><g stroke="#2c3e50" stroke-width="3"><path d="M14 30 v26 M30 30 v26 M46 30 v26"/></g><g fill="#d7263d" ${OL}><ellipse cx="14" cy="30" rx="7" ry="3.5"/><ellipse cx="30" cy="30" rx="7" ry="3.5"/><ellipse cx="46" cy="30" rx="7" ry="3.5"/></g>`,
    menuekran: `<rect x="2" y="8" width="56" height="40" rx="4" fill="#1b2631" ${OL}/><rect x="7" y="13" width="20" height="14" rx="2" fill="#f39c12"/><rect x="31" y="13" width="22" height="14" rx="2" fill="#e74c3c"/><rect x="7" y="31" width="46" height="4" rx="2" fill="#5dade2"/><rect x="7" y="38" width="30" height="4" rx="2" fill="#5dade2"/>`,
    bitki: `<path d="M18 40 h24 l-3 18 h-18z" fill="#c0703a" ${OL}/><g fill="#3fa34d" ${OL}><path d="M30 40 q-20 -6 -16 -30 q14 8 16 30z"/><path d="M30 40 q18 -8 14 -32 q-14 8 -14 32z"/><path d="M30 40 q-2 -22 0 -38 q6 18 0 38z" fill="#2e8b3e"/></g>`,
    aydinlatma: `<path d="M16 0 v18 M44 0 v18" stroke="#2c3e50" stroke-width="2"/><path d="M4 32 q12 -22 24 0z M32 32 q12 -22 24 0z" fill="#e67e22" ${OL}/><ellipse cx="16" cy="33" rx="6" ry="2.5" fill="#fff6c8"/><ellipse cx="44" cy="33" rx="6" ry="2.5" fill="#fff6c8"/><ellipse cx="16" cy="46" rx="14" ry="8" fill="#ffe08a" opacity=".3"/><ellipse cx="44" cy="46" rx="14" ry="8" fill="#ffe08a" opacity=".3"/>`,
    mermer: `<rect x="2" y="18" width="56" height="26" rx="3" fill="#f8f9f9" ${OL}/><path d="M6 24 q12 8 22 0 t26 6 M8 36 q14 -6 24 2" stroke="#b3b6b7" fill="none"/><rect x="2" y="42" width="56" height="5" fill="#d4ac0d"/>`,
    kadife: `<rect x="6" y="14" width="48" height="22" rx="8" fill="#a93226" ${OL}/><rect x="4" y="30" width="52" height="16" rx="6" fill="#922b21" ${OL}/><path d="M10 46 v8 M50 46 v8" stroke="#d4ac0d" stroke-width="4" stroke-linecap="round"/>`,
    dismasa: `<circle cx="30" cy="26" r="20" fill="#fdfefe" ${OL}/><path d="M10 26 a20 20 0 0 1 40 0" fill="#d7263d"/><path d="M30 6 v40 M30 46 v12 M18 58 h24" stroke="#566573" stroke-width="3"/>`,
    dinlenme: `<rect x="4" y="28" width="52" height="18" rx="6" fill="#5dade2" ${OL}/><rect x="4" y="18" width="16" height="16" rx="5" fill="#2e86c1" ${OL}/><path d="M40 8 q5 5 0 10 M46 8 q5 5 0 10" stroke="#85929e" stroke-width="2.5" fill="none"/>`,
    klima: `<rect x="2" y="10" width="56" height="20" rx="4" fill="#fdfefe" ${OL}/><path d="M8 24 h44" stroke="#aab7b8" stroke-width="2"/><path d="M14 36 q3 6 0 12 M30 36 q3 6 0 12 M46 36 q3 6 0 12" stroke="#5dade2" stroke-width="2.5" fill="none"/>`
  };
  A.decor = (did) => svg('0 0 60 60', DEC[did] || '', 'art-decor', '');

  /* ---------------- Çiftlik hayvanları ---------------- */
  A.animal = function (kind, opts) {
    opts = opts || {};
    const legs = (xs, y, len, c) => xs.map((x, i) => `<path class="leg l${i % 2}" d="M${x} ${y} v${len}" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`).join('');
    if (kind === 'dana') return svg('0 0 120 90', `<ellipse cx="60" cy="84" rx="40" ry="5" fill="#000" opacity=".15"/>
      ${legs([36, 46, 76, 86], 58, 22, '#5a3a24')}<ellipse cx="62" cy="48" rx="36" ry="20" fill="#8b5a3c" ${OL}/><path d="M44 36 q10 -6 16 4 q-6 10 -16 4z" fill="#f4ece1"/><path d="M70 52 q12 -4 16 6 q-10 6 -16 -6z" fill="#f4ece1"/>
      <path d="M26 46 q-8 4 -4 12" stroke="#5a3a24" stroke-width="3" fill="none"/><g class="head"><ellipse cx="96" cy="38" rx="14" ry="11" fill="#8b5a3c" ${OL}/><ellipse cx="106" cy="44" rx="8" ry="6" fill="#f2c4a6" ${OL}/><circle cx="104" cy="44" r="1.2" fill="${INK}"/><circle cx="109" cy="44" r="1.2" fill="${INK}"/><circle cx="95" cy="34" r="2" fill="${INK}"/><path d="M86 28 l-6 -6 M100 26 l2 -8" stroke="#e8dcc8" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="84" cy="34" rx="5" ry="3" fill="#6e4530"/></g>`, 'art-animal dana');
    if (kind === 'kuzu') return svg('0 0 100 80', `<ellipse cx="50" cy="75" rx="30" ry="4" fill="#000" opacity=".15"/>${legs([32, 40, 60, 68], 50, 20, '#3b2a20')}
      <g fill="#fbf8f1" ${OL}><circle cx="34" cy="40" r="12"/><circle cx="48" cy="34" r="13"/><circle cx="62" cy="38" r="12"/><circle cx="44" cy="48" r="12"/><circle cx="58" cy="48" r="11"/></g>
      <g class="head"><ellipse cx="78" cy="38" rx="10" ry="9" fill="#4a3428" ${OL}/><ellipse cx="72" cy="34" rx="5" ry="3" fill="#4a3428"/><circle cx="80" cy="36" r="1.6" fill="#fff"/><circle cx="72" cy="28" r="6" fill="#fbf8f1" ${OL}/></g>`, 'art-animal kuzu');
    return svg('0 0 70 70', `<ellipse cx="34" cy="66" rx="18" ry="3" fill="#000" opacity=".15"/>${legs([30, 38], 50, 13, '#e67e22')}
      <ellipse cx="34" cy="40" rx="20" ry="15" fill="#fdfefe" ${OL}/><path d="M18 38 q-8 -8 -4 -16 q6 6 8 14z" fill="#f2f3f4" ${OL}/><path d="M28 40 q8 6 16 0" stroke="#d5d8dc" stroke-width="2" fill="none"/>
      <g class="head"><circle cx="52" cy="26" r="9" fill="#fdfefe" ${OL}/><path d="M48 18 q2 -6 5 -2 q2 -5 5 0 q2 4 -2 6z" fill="#e74c3c"/><path d="M60 26 l6 2 l-6 2z" fill="#f39c12"/><circle cx="54" cy="24" r="1.4" fill="${INK}"/><path d="M57 31 q2 4 -1 5" stroke="#e74c3c" stroke-width="3" fill="none"/></g>`, 'art-animal tavuk');
  };
  A.barn = () => svg('0 0 200 170', `<ellipse cx="100" cy="160" rx="96" ry="8" fill="#000" opacity=".15"/><rect x="150" y="30" width="34" height="126" rx="16" fill="#cfd8dc" ${OL}/><path d="M150 46 q17 -26 34 0" fill="#90a4ae" ${OL}/><path d="M150 70 h34 M150 96 h34 M150 122 h34" stroke="#90a4ae" stroke-width="2"/>
    <path d="M14 70 l66 -48 l66 48 v86 h-132z" fill="#b83227" ${OL}/><path d="M6 74 l74 -58 l74 58" fill="none" stroke="#f4f1ea" stroke-width="7" stroke-linejoin="round"/><rect x="52" y="96" width="56" height="60" fill="#8e2219" ${OL}/><path d="M52 96 l56 60 M108 96 l-56 60" stroke="#f4f1ea" stroke-width="4"/><rect x="64" y="50" width="32" height="22" fill="#f4f1ea" ${OL}/><path d="M80 50 v22 M64 61 h32" stroke="#b83227" stroke-width="2"/>`, 'art-barn');
  A.truck = (label) => svg('0 0 140 80', `<ellipse cx="70" cy="74" rx="62" ry="4" fill="#000" opacity=".15"/><rect x="4" y="16" width="86" height="46" rx="5" fill="#fdfefe" ${OL}/><text x="47" y="44" text-anchor="middle" font-size="11" font-weight="800" fill="#d7263d" font-family="sans-serif">${label || 'TAZE ET'}</text><path d="M90 30 h26 l18 18 v14 h-44z" fill="#d7263d" ${OL}/><path d="M96 34 h18 l11 12 h-29z" fill="#bde3f7"/><g fill="#2c3e50"><circle cx="28" cy="64" r="9"/><circle cx="110" cy="64" r="9"/></g><g fill="#bdc3c7"><circle cx="28" cy="64" r="3.5"/><circle cx="110" cy="64" r="3.5"/></g>`, 'art-truck');
  A.fence = (w) => { let s = ''; for (let x = 0; x <= w; x += 16) s += `<rect x="${x}" y="6" width="5" height="26" rx="2" fill="#c49a6c" ${OL}/>`; return svg(`0 0 ${w + 6} 34`, `<path d="M0 14 h${w + 6} M0 24 h${w + 6}" stroke="#a87a4f" stroke-width="4"/>${s}`, 'art-fence'); };

  /* ---------------- Arayüz ikonları (24×24, çizgi) ---------------- */
  const IC = {
    fries: '<path d="M6 10 h12 l-1.6 10 a1.5 1.5 0 0 1 -1.5 1.3 h-5.8 a1.5 1.5 0 0 1 -1.5 -1.3z"/><path d="M8 10 l-1 -6 M11 10 v-7 M14 10 l1 -6 M16.5 10 l1.5 -4"/>',
    bread: '<path d="M5 10 a7 4.5 0 0 1 14 0 v8 a1.5 1.5 0 0 1 -1.5 1.5 h-11 a1.5 1.5 0 0 1 -1.5 -1.5z"/><path d="M9 11 l1.5 -2 M13 11 l1.5 -2"/>',
    meat: '<path d="M14.5 4.5 a5.5 5.5 0 0 1 3 9 l-5 5 a3.5 3.5 0 0 1 -5 -5 l5 -5 a5.5 5.5 0 0 1 2 -4z"/><circle cx="15" cy="9" r="1.6"/><path d="M7.5 16.5 l-3 3"/>',
    drop: '<path d="M12 3.5 c3 4.5 5.5 7.5 5.5 10.5 a5.5 5.5 0 0 1 -11 0 c0 -3 2.5 -6 5.5 -10.5z"/><path d="M9.5 14.5 a2.5 2.5 0 0 0 2.5 2.5"/>',
    sound: '<path d="M4 9 h4 l5 -4 v14 l-5 -4 h-4z"/><path d="M16 9 q2 3 0 6 M18.5 7 q4 5 0 10"/>',
    mute: '<path d="M4 9 h4 l5 -4 v14 l-5 -4 h-4z"/><path d="M16 9 l5 6 M21 9 l-5 6"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    crown: '<path d="M4 17 l1.5 -9 l4.5 4 l2 -6 l2 6 l4.5 -4 l1.5 9z"/><path d="M4 20 h16"/>',
    cart: '<path d="M3 5 h2.5 l2 10 h10 l2 -7 h-13"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M9.5 9.5 h3.5 a2.2 2.2 0 0 1 0 4.4 h-3 M11 7.5 v9"/>',
    star: '<path d="M12 3.5 l2.6 5.3 5.9 .9 -4.3 4.1 1 5.8 -5.2 -2.7 -5.2 2.7 1 -5.8 -4.3 -4.1 5.9 -.9z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5 v5 l3 2"/>',
    users: '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19 q5.5 -8 11 0"/><circle cx="16.5" cy="8.5" r="2.6"/><path d="M15 13.5 q4 -1 6 4"/>',
    chef: '<path d="M7 13 h10 v6 h-10z"/><path d="M7 13 a3.5 3.5 0 0 1 1 -6.8 a4 4 0 0 1 8 0 a3.5 3.5 0 0 1 1 6.8"/>',
    tray: '<path d="M3.5 16 h17"/><path d="M5 16 a7 7 0 0 1 14 0"/><path d="M12 7 v2"/>',
    broom: '<path d="M15 3 l-4 9"/><path d="M8 11 l6 3 -2 7 q-6 -1 -8 -5z"/>',
    scooter: '<circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M6 17 h8 l3 -8 h3 M14 9 h-5 v4"/>',
    pause: '<path d="M6 19 q1 -6 6 -6 q5 0 6 6"/><path d="M8 9 q0 -4 4 -4 q4 0 4 4"/><path d="M16 4 q2 1 1 3"/>',
    table: '<ellipse cx="12" cy="9" rx="8.5" ry="3"/><path d="M12 12 v8 M8 20 h8"/>',
    fire: '<path d="M12 21 c-4 0 -6 -3 -6 -6 c0 -4 4 -6 4 -10 c3 2 4 4 4 6 c1 -1 1.5 -2 1.5 -3 c2 2 2.5 4 2.5 7 c0 3 -2 6 -6 6z"/>',
    queue: '<circle cx="5" cy="8" r="2"/><circle cx="12" cy="8" r="2"/><circle cx="19" cy="8" r="2"/><path d="M2.5 16 q2.5 -4 5 0 M9.5 16 q2.5 -4 5 0 M16.5 16 q2.5 -4 5 0"/>',
    cash: '<rect x="3" y="7" width="18" height="11" rx="2"/><circle cx="12" cy="12.5" r="2.5"/><path d="M3 10.5 h2 M19 14.5 h2"/>',
    heart: '<path d="M12 20 s-7 -4.5 -7 -10 a4 4 0 0 1 7 -2.5 a4 4 0 0 1 7 2.5 c0 5.5 -7 10 -7 10z"/>',
    bolt: '<path d="M13 3 l-7 10 h5 l-1 8 7 -10 h-5z"/>',
    store: '<path d="M4 10 v10 h16 v-10"/><path d="M3 10 l2 -6 h14 l2 6 q-2 2 -4.5 0 q-2.5 2 -4.5 0 q-2 2 -4.5 0 q-2.5 2 -4.5 0z"/><path d="M10 20 v-5 h4 v5"/>',
    map: '<path d="M3 6 l6 -2 6 2 6 -2 v14 l-6 2 -6 -2 -6 2z M9 4 v14 M15 6 v14"/>',
    chart: '<path d="M4 20 v-16 M4 20 h16"/><path d="M7 15 l4 -4 3 3 5 -6"/>',
    menu: '<path d="M4 7 h16 M4 12 h16 M4 17 h16"/>',
    check: '<path d="M5 12.5 l4.5 4.5 l9.5 -10"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11 v-3 a4 4 0 0 1 8 0 v3"/>',
    play: '<path d="M8 5 l11 7 -11 7z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    ff: '<path d="M4 6 l8 6 -8 6z M12 6 l8 6 -8 6z"/>',
    swap: '<path d="M4 8 h14 l-3 -3 M20 16 h-14 l3 3"/>',
    leaf: '<path d="M5 19 q0 -12 14 -14 q0 14 -14 14z M5 19 l7 -7"/>',
    cow: '<path d="M6 9 q-3 -1 -3 -4 M18 9 q3 -1 3 -4"/><rect x="6" y="7" width="12" height="11" rx="5"/><ellipse cx="12" cy="16" rx="4" ry="2.5"/><circle cx="9.5" cy="11" r=".6"/><circle cx="14.5" cy="11" r=".6"/>',
    truck: '<rect x="2.5" y="7" width="11" height="9" rx="1"/><path d="M13.5 10 h4 l3 3 v3 h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    plus: '<path d="M12 5 v14 M5 12 h14"/>',
    book: '<path d="M4 5.5 q4 -2 8 0.5 q4 -2.5 8 -0.5 v13 q-4 -2 -8 0.5 q-4 -2.5 -8 -0.5z"/><path d="M12 6 v13"/>',
    pin: '<path d="M12 21 s-6.5 -6 -6.5 -11 a6.5 6.5 0 0 1 13 0 c0 5 -6.5 11 -6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    x: '<path d="M6 6 l12 12 M18 6 l-12 12"/>',
    minus: '<path d="M5 12 h14"/>',
    arrow: '<path d="M14 6 l-6 6 6 6"/>',
    eye: '<path d="M2.5 12 q9.5 -10 19 0 q-9.5 10 -19 0z"/><circle cx="12" cy="12" r="2.8"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M4 13 h16 M12 9 v11 M12 9 q-5 -6 -6 -1 q0 2 6 1 q6 1 6 -1 q-1 -5 -6 1"/>'
  };
  A.icon = (name, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[name] || ''}</svg>`;

  /* ---------------- Logo ---------------- */
  A.logo = () => svg('0 0 64 64', `<circle cx="32" cy="32" r="30" fill="#7a1f3d"/><circle cx="32" cy="32" r="26" fill="none" stroke="#ffc93c" stroke-width="2" stroke-dasharray="3 3"/>
    <path d="M32 10 v42" stroke="#cfd6dc" stroke-width="3" stroke-linecap="round"/><path d="M20 16 L44 16 L38 46 L26 46 Z" fill="#b5541f" stroke="#3b2417" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M22 22 h20 M23 28 h18 M24 34 h16 M25 40 h14" stroke="#7a3a18" stroke-width="2"/><path d="M48 18 v28" stroke="#ff9a3c" stroke-width="4" stroke-linecap="round"/>`, 'logo-mark', 'Kebab Empire');

  /* marka ayarı: zincirin logosu (satır içi SVG ya da görsel dosyası) varsayılan logonun yerine geçer */
  const baseLogo = A.logo;
  A.logo = () => {
    const BR = KE.BRAND;
    /* satır içi SVG bile <img> olarak çizilir: görsel olarak yüklenen SVG betik çalıştıramaz, sayfaya HTML ekleyemez */
    if (BR && BR.logoSvg) return `<img class="logo-mark" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(String(BR.logoSvg))}" alt="">`;
    if (BR && BR.logoUrl) return `<img class="logo-mark" src="${String(BR.logoUrl).replace(/"/g, '')}" alt="">`;
    return baseLogo();
  };

  /* ---------------- Vitrin (şube kartları ve harita için) ---------------- */
  A.storefront = (name, color, open) => svg('0 0 120 90', `<rect x="6" y="20" width="108" height="66" rx="4" fill="#fbe9cf" ${OL}/><rect x="6" y="8" width="108" height="20" rx="4" fill="${color || '#d7263d'}" ${OL}/>
    <text x="60" y="22" text-anchor="middle" font-size="10" font-weight="800" fill="#fff" font-family="Baloo 2, sans-serif">${String(name || '').slice(0, 18).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))}</text>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${6 + i * 18} 28 h18 v8 q-9 6 -18 0z" fill="${i % 2 ? '#fff' : (color || '#d7263d')}" ${OL}/>`).join('')}
    <rect x="16" y="44" width="40" height="30" rx="2" fill="${open ? '#ffe9a8' : '#bcd3e6'}" ${OL}/><rect x="66" y="44" width="36" height="42" rx="2" fill="#7b4a2c" ${OL}/><rect x="72" y="50" width="24" height="16" rx="2" fill="${open ? '#ffe9a8' : '#bcd3e6'}"/><circle cx="96" cy="68" r="1.8" fill="#f1c40f"/>`, 'art-store');
})();
