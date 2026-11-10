/* Kebab Empire — SVG karakter oluşturucu
   Katmanlı parçalar: saç (arka), gövde ve kıyafet, boyun, kulak, yüz, saç (ön), kaş, göz, burun, ağız, bıyık/sakal, gözlük, başlık.
   KE.portrait: göğüs hizası portre. KE.figure: tam boy (yürür, tepsi taşır).
   Çizgi dili: yarı saydam koyu kahve kontur, yumuşak ten gölgesi, saçta parlama. */
(function () {
  let uid = 0;
  /* görünüş seçimi: tohumsuz Math.random (oyun sonucunu etkilemez, yeniden oynatmaya girmez) */
  const pickCosmetic = (a) => a[Math.floor(Math.random() * a.length)];
  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };
  const INK = '#3b2417';
  const OL = `stroke="${INK}" stroke-opacity=".5" stroke-width="1.5" stroke-linejoin="round"`;

  function hairBack(l) {
    const c = l.hairColor;
    if (l.head === 'basortusu') return '';
    if (l.hair === 'uzun') return `<path d="M33 52 Q29 22 60 20 Q91 22 87 52 L91 102 Q60 112 29 102 Z" fill="${shade(c, -12)}" ${OL}/>`;
    if (l.hair === 'topuz') return `<circle cx="60" cy="21" r="10.5" fill="${c}" ${OL}/><path d="M54 17 q6 -4 12 0" stroke="${shade(c, 45)}" stroke-width="2" fill="none" opacity=".7"/>`;
    return '';
  }
  function hairFront(l) {
    const c = l.hairColor, hl = shade(c, 50);
    if (['basortusu', 'pusi', 'kalpak', 'kask', 'sefsapka', 'baret'].includes(l.head) && l.hair !== 'uzun') {
      return l.head === 'sefsapka' || l.head === 'kalpak' ? `<path d="M36 53 Q37 44 42 42 L42 53Z M84 53 Q83 44 78 42 L78 53Z" fill="${c}"/>` : '';
    }
    const shine = (d) => `<path d="${d}" stroke="${hl}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/>`;
    switch (l.hair) {
      case 'kel': return `<path d="M35 57 Q34 46 39 41 L42 59Z M85 57 Q86 46 81 41 L78 59Z" fill="${c}" ${OL}/><ellipse cx="52" cy="34" rx="7" ry="3" fill="#fff" opacity=".22"/>`;
      case 'dalgali': return `<path d="M34 55 Q28 29 50 25 Q60 19 72 25 Q92 29 86 55 Q83 42 76 40 Q72 47 64 41 Q58 47 50 41 Q44 47 38 43 Z" fill="${c}" ${OL}/>` + shine('M48 29 q8 -4 16 0');
      case 'uzun': return `<path d="M35 53 Q35 27 60 26 Q85 27 85 53 Q78 35 62 37 Q50 37 42 44 Z" fill="${c}" ${OL}/>` + shine('M46 32 q10 -5 22 -1');
      case 'topuz': return `<path d="M35 53 Q35 27 60 27 Q85 27 85 53 Q80 37 60 36 Q40 37 35 53Z" fill="${c}" ${OL}/>` + shine('M46 32 q12 -5 26 0');
      case 'yan': return `<path d="M34 55 Q33 27 62 26 Q87 28 86 53 Q82 37 70 35 Q52 33 44 39 Q38 43 34 55Z" fill="${c}" ${OL}/>` + shine('M50 30 q12 -4 24 1');
      default: return `<path d="M35 53 Q34 27 60 26 Q86 27 85 53 Q81 37 60 35 Q39 37 35 53Z" fill="${c}" ${OL}/>` + shine('M46 31 q12 -5 26 0');
    }
  }
  function headwear(l, id) {
    const a = l.accent || '#c0392b';
    switch (l.head) {
      case 'sefsapka':
        return `<path d="M38 44 L82 44 L80 34 Q91 26 83 15 Q77 5 66 11 Q60 1 52 9 Q41 3 37 15 Q29 26 40 34Z" fill="#fdfefe" ${OL}/><rect x="38" y="37" width="44" height="8" rx="2" fill="#eef1f2" ${OL}/><path d="M50 14 q4 8 2 18 M66 12 q-2 10 0 20" stroke="#dfe4e6" stroke-width="2" fill="none"/>`;
      case 'kasket': { const h = l.hatColor || '#5d4037'; return `<path d="M34 47 Q34 25 60 24 Q86 25 86 45 Q70 38 50 40 Z" fill="${h}" ${OL}/><path d="M33 47 Q26 50 30 52 Q46 47 60 46 Q48 44 33 47Z" fill="${shade(h, -25)}" ${OL}/><path d="M40 40 Q60 33 82 40" stroke="${shade(h, 30)}" fill="none" stroke-width="1.5"/>`; }
      case 'bone': { const h = l.hatColor || '#2471a3'; return `<path d="M35 47 Q35 23 60 23 Q85 23 85 47 Z" fill="${h}" ${OL}/><path d="M60 47 Q79 44 98 51 Q85 56 60 51Z" fill="${shade(h, -25)}" ${OL}/><circle cx="60" cy="24" r="2.5" fill="${shade(h, 30)}"/>`; }
      case 'gunes': { const h = l.hatColor || '#f5cba7'; return `<ellipse cx="60" cy="37" rx="39" ry="7.5" fill="${h}" ${OL}/><path d="M40 37 Q40 17 60 17 Q80 17 80 37Z" fill="${h}" ${OL}/><rect x="40" y="31" width="40" height="5" fill="${a}"/>`; }
      case 'baret': return `<path d="M33 46 Q33 19 60 19 Q87 19 87 46Z" fill="#f4d03f" ${OL}/><rect x="29" y="43" width="62" height="6" rx="3" fill="#d4ac0d" ${OL}/><path d="M60 19 V44" stroke="#d4ac0d" stroke-width="4"/><path d="M44 28 q6 -6 12 -6" stroke="#fff" stroke-width="2.5" fill="none" opacity=".6"/>`;
      case 'kask': { const h = l.hatColor || '#c0392b'; return `<path d="M29 62 Q27 16 60 16 Q93 16 91 62 L82 62 Q82 40 60 40 Q38 40 38 62Z" fill="${h}" ${OL}/><path d="M38 47 Q60 39 82 47" stroke="#fdfefe" stroke-width="3" fill="none" opacity=".75"/><path d="M42 26 q8 -6 18 -6" stroke="#fff" stroke-width="3" fill="none" opacity=".4"/>`; }
      case 'takke': return `<path d="M37 41 Q39 23 60 23 Q81 23 83 41 Z" fill="${a}" ${OL}/><path d="M39 37 h42" stroke="${shade(a, 60)}" stroke-width="2" stroke-dasharray="3 2"/><path d="M48 30 l4 -3 l4 3 l4 -3 l4 3 l4 -3 l4 3" stroke="${shade(a, 60)}" stroke-width="1.4" fill="none"/>`;
      case 'kalpak': return `<path d="M35 45 L37 17 Q60 9 83 17 L85 45 Q60 39 35 45Z" fill="#2c2420" ${OL}/><path d="M38 23 Q60 17 82 23 M37 31 Q60 25 83 31 M37 39 Q60 33 83 39" stroke="#4d3d33" fill="none" stroke-width="1.6"/>`;
      case 'pusi': {
        const pid = 'p' + id;
        return `<defs><pattern id="${pid}" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#fdfefe"/><rect width="3" height="3" fill="#b03a2e"/><rect x="3" y="3" width="3" height="3" fill="#b03a2e"/></pattern></defs>` +
          `<path d="M32 55 Q29 21 60 19 Q91 21 88 55 Q84 40 60 38 Q36 40 32 55Z" fill="url(#${pid})" ${OL}/><path d="M33 47 Q60 35 87 47" stroke="#7b241c" stroke-width="3.5" fill="none"/><path d="M84 50 q8 10 4 24" stroke="#b03a2e" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      }
      case 'basortusu': {
        const c = l.scarf || '#8e44ad';
        return `<path d="M29 60 Q25 16 60 16 Q95 16 91 60 Q93 88 80 98 Q70 106 60 106 Q50 106 40 98 Q27 88 29 60 Z M38 57 Q40 32 60 32 Q80 32 82 57 Q82 79 72 87 Q60 93 48 87 Q38 79 38 57Z" fill="${c}" fill-rule="evenodd" ${OL}/>` +
          `<path d="M42 28 Q60 21 78 28" stroke="${shade(c, 45)}" stroke-width="1.6" fill="none" stroke-dasharray="2 3"/><path d="M36 40 q-3 20 4 40" stroke="${shade(c, -30)}" stroke-width="2" fill="none" opacity=".5"/>`;
      }
      default: return '';
    }
  }
  function face(l, mood, gid) {
    const dark = '#2a1a12';
    const browY = l.head === 'basortusu' ? 47 : 46;
    let brows, mouth, extra = '';
    if (mood === 'happy') {
      brows = `<path d="M45 ${browY} Q51 ${browY - 4.5} 56 ${browY - 0.5}" /><path d="M64 ${browY - 0.5} Q69 ${browY - 4.5} 75 ${browY}" />`;
      mouth = `<path d="M50 71 Q60 83 70 71 Q60 75 50 71Z" fill="#8e2a22" stroke="${dark}" stroke-width="1.4"/><path d="M53 72.5 Q60 74.5 67 72.5" stroke="#fdfefe" stroke-width="2.2" fill="none"/><path d="M55 78 q5 2.5 10 0" stroke="#e57373" stroke-width="2" fill="none"/>`;
    } else if (mood === 'sad') {
      brows = `<path d="M45 ${browY - 2.5} L56 ${browY + 1}" /><path d="M64 ${browY + 1} L75 ${browY - 2.5}" />`;
      mouth = `<path d="M52 77 Q60 70.5 68 77" fill="none" stroke="${dark}" stroke-width="2"/>`;
    } else if (mood === 'angry') {
      brows = `<path d="M45 ${browY - 3.5} L56 ${browY + 2}" /><path d="M64 ${browY + 2} L75 ${browY - 3.5}" />`;
      mouth = `<path d="M52 76 Q60 71 68 76 L52 76Z" fill="#8e2a22" stroke="${dark}" stroke-width="1.6"/>`;
      extra = `<path d="M78 40 l5 -3 m-3 6 l6 -1" stroke="#e74c3c" stroke-width="1.8"/>`;
    } else {
      brows = `<path d="M45 ${browY} L56 ${browY - 1.2}" /><path d="M64 ${browY - 1.2} L75 ${browY}" />`;
      mouth = `<path d="M53 73.5 Q60 77 67 73.5" fill="none" stroke="${dark}" stroke-width="2"/>`;
    }
    const browColor = l.age === 'yasli' ? '#8d8d8d' : shade(l.hairColor || dark, -10);
    const hc = l.age === 'yasli' ? '#c9c9c9' : (l.hairColor || dark);
    let fh = '';
    if (l.facial === 'biyik') fh = `<path d="M49 69 Q54 64 60 67 Q66 64 71 69 Q66 72 60 70 Q54 72 49 69Z" fill="${hc}" ${OL}/>`;
    if (l.facial === 'gurbiyik') fh = `<path d="M44 71 Q51 61 60 66 Q69 61 76 71 Q73 76 66 72.5 Q60 71.5 54 72.5 Q47 76 44 71Z" fill="${hc}" ${OL}/>`;
    if (l.facial === 'sakal') fh = `<path d="M36 60 Q37 90 60 94 Q83 90 84 60 Q81 75 72 79 Q60 85 48 79 Q39 75 36 60Z" fill="${hc}" ${OL}/><path d="M50 69 Q55 65 60 67 Q65 65 70 69 Q65 71 60 70 Q55 71 50 69Z" fill="${hc}"/>`;
    if (l.facial === 'kirli') fh = `<path d="M38 62 Q40 89 60 92 Q80 89 82 62 Q80 81 60 85 Q40 81 38 62Z" fill="${hc}" opacity=".28"/>`;
    const wr = l.age === 'yasli' ? `<path d="M48 40 Q60 37 72 40 M50 36.5 Q60 34 70 36.5" stroke="#00000026" fill="none"/><path d="M42 58 l-3 2 M78 58 l3 2 M46 63 q-2 3 -1 5 M74 63 q2 3 1 5" stroke="#00000033" fill="none"/>` : '';
    const lash = l.gender === 'k' ? `<path d="M47 53 l-2 -2 M73 53 l2 -2" stroke="${dark}" stroke-width="1.4"/>` : '';
    const glasses = l.glasses ? `<g fill="#ffffff22" stroke="#2c3e50" stroke-width="1.9"><rect x="43.5" y="50" width="15" height="12" rx="5"/><rect x="61.5" y="50" width="15" height="12" rx="5"/><path d="M58.5 55 h3 M43.5 54 l-7 -2 M76.5 54 l7 -2" fill="none"/></g>` : '';
    return `<ellipse cx="45" cy="66" rx="4.8" ry="3" fill="#f07c6c" opacity="${mood === 'happy' ? 0.42 : 0.2}"/><ellipse cx="75" cy="66" rx="4.8" ry="3" fill="#f07c6c" opacity="${mood === 'happy' ? 0.42 : 0.2}"/>` +
      `<g stroke="${browColor}" stroke-width="2.8" fill="none" stroke-linecap="round">${brows}</g>` +
      `<g class="ke-eye"><ellipse cx="51" cy="56" rx="2.9" ry="3.5" fill="${dark}"/><ellipse cx="69" cy="56" rx="2.9" ry="3.5" fill="${dark}"/><circle cx="52.1" cy="54.8" r="1.1" fill="#fff"/><circle cx="70.1" cy="54.8" r="1.1" fill="#fff"/></g>${lash}` +
      `<path d="M60 58 Q56.5 65.5 59 67.5 Q62 68.6 64 66.6" fill="none" stroke="${shade(l.skin, -55)}" stroke-width="1.7" stroke-linecap="round"/>` +
      extra + wr + fh + mouth + glasses;
  }
  function headGroup(l, id, mood) {
    const skin = l.skin, gid = 'sk' + id;
    return `<defs><radialGradient id="${gid}" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="${shade(skin, 14)}"/><stop offset=".75" stop-color="${skin}"/><stop offset="1" stop-color="${shade(skin, -22)}"/></radialGradient></defs>` +
      `<ellipse cx="35.5" cy="58" rx="5.2" ry="7.2" fill="${shade(skin, -12)}" ${OL}/><ellipse cx="84.5" cy="58" rx="5.2" ry="7.2" fill="${shade(skin, -12)}" ${OL}/><path d="M35 55 q2 3 0 6 M85 55 q-2 3 0 6" stroke="${shade(skin, -45)}" stroke-width="1.2" fill="none"/>` +
      `<ellipse cx="60" cy="56" rx="24.5" ry="27.5" fill="url(#${gid})" ${OL}/>` +
      hairFront(l) + face(l, mood, gid) + headwear(l, id);
  }

  /* ---------- Göğüs portresi: kıyafet ---------- */
  function outfit(l) {
    const o = l.outfit, c = l.outfitColor || '#c0392b', a = l.accent || '#f4d03f';
    const torso = (fill) => `<path d="M8 132 Q10 100 40 92 L80 92 Q110 100 112 132 Z" fill="${fill}" ${OL}/><path d="M20 132 Q22 108 38 100" stroke="#000" stroke-opacity=".08" stroke-width="8" fill="none"/>`;
    const collar = (fill) => `<path d="M47 92 L60 106 L73 92 L68 90 L60 99 L52 90Z" fill="${fill}" ${OL}/>`;
    switch (o) {
      case 'onluk':
        return torso(l.shirt || '#ecf0f1') + collar(shade(l.shirt || '#ecf0f1', -25)) +
          `<path d="M40 104 L80 104 L85 132 L35 132Z" fill="${c}" ${OL}/><path d="M42 104 L48 92 M78 104 L72 92" stroke="${c}" stroke-width="3.5"/><path d="M44 116 h32" stroke="#000" stroke-opacity=".08" stroke-width="2"/>` +
          (l.logo ? `<circle cx="60" cy="117" r="7.5" fill="${a}" ${OL}/><path d="M56 117 h8 M60 113 v8" stroke="${c}" stroke-width="2"/>` : '');
      case 'sef':
        return torso('#fbfcfc') + `<path d="M47 92 L60 101 L73 92" fill="none" stroke="#d5d8dc" stroke-width="3.5"/><path d="M60 101 L60 132" stroke="#e5e8e8" stroke-width="2"/>` +
          `<g fill="${a}"><circle cx="52" cy="108" r="2.2"/><circle cx="52" cy="119" r="2.2"/><circle cx="68" cy="108" r="2.2"/><circle cx="68" cy="119" r="2.2"/></g><path d="M44 94 h32" stroke="${a}" stroke-width="2.5"/>`;
      case 'yelek':
        return torso('#f4f6f6') + collar('#d5dbdb') +
          `<path d="M14 132 Q16 102 40 94 L54 132Z" fill="${c}" ${OL}/><path d="M106 132 Q104 102 80 94 L66 132Z" fill="${c}" ${OL}/>` +
          `<g fill="${a}"><circle cx="34" cy="108" r="1.8"/><circle cx="40" cy="116" r="1.8"/><circle cx="44" cy="125" r="1.8"/><circle cx="86" cy="108" r="1.8"/><circle cx="80" cy="116" r="1.8"/><circle cx="76" cy="125" r="1.8"/></g>` +
          `<path d="M28 104 Q38 112 46 130 M92 104 Q82 112 74 130" stroke="${a}" stroke-width="1.4" fill="none" opacity=".8"/>`;
      case 'salvar':
        return torso('#fdfefe') + collar('#d5dbdb') +
          `<path d="M16 132 Q18 104 40 95 L50 132Z" fill="#1c2833" ${OL}/><path d="M104 132 Q102 104 80 95 L70 132Z" fill="#1c2833" ${OL}/>` +
          `<rect x="22" y="121" width="76" height="11" fill="${c}" ${OL}/><path d="M22 125 h76 M22 129 h76" stroke="${a}" stroke-width="1.2"/>`;
      case 'beyazceket':
        return torso('#fbfcfc') + `<path d="M46 92 L58 116 L52 132 M74 92 L62 116 L68 132" stroke="#c9cdce" stroke-width="2" fill="none"/>` +
          `<path d="M51 95 L60 100 L51 105Z M69 95 L60 100 L69 105Z" fill="${a}" ${OL}/><circle cx="60" cy="100" r="2.2" fill="${shade(a, -30)}"/>`;
      case 'gomlek':
        return torso(c) + `<path d="M46 92 L60 104 L74 92 L70 89 L60 98 L50 89Z" fill="${shade(c, 25)}" ${OL}/><path d="M60 104 V132" stroke="${shade(c, -30)}" stroke-width="1.5"/>` +
          `<g fill="${shade(c, -40)}"><circle cx="60" cy="112" r="1.4"/><circle cx="60" cy="122" r="1.4"/></g><path d="M34 112 h12 v8 h-12z" fill="none" stroke="${shade(c, -25)}" stroke-width="1.2"/>`;
      case 'takim':
        return torso(c) + `<path d="M48 92 L60 120 L72 92Z" fill="#fdfefe" ${OL}/><path d="M58 98 L62 98 L63.5 118 L60 122 L56.5 118Z" fill="${a}" ${OL}/>` +
          `<path d="M46 92 L58 122 M74 92 L62 122" stroke="${shade(c, -35)}" stroke-width="2.4"/><path d="M84 108 h10" stroke="#fdfefe" stroke-width="3"/>`;
      case 'mont':
        return torso(c) + `<path d="M44 92 Q60 102 76 92 L76 99 Q60 109 44 99Z" fill="${shade(c, -30)}" ${OL}/><path d="M60 103 V132" stroke="${shade(c, 45)}" stroke-width="2.4"/>` +
          `<rect x="28" y="112" width="13" height="3.5" rx="1.5" fill="${a}"/><rect x="79" y="112" width="13" height="3.5" rx="1.5" fill="${a}"/>`;
      case 'reflektif':
        return torso('#5d6d7e') + `<path d="M24 132 Q26 104 44 96 L76 96 Q94 104 96 132Z" fill="#f39c12" ${OL}/>` +
          `<rect x="26" y="114" width="68" height="5.5" fill="#f7f9f9" opacity=".95"/><path d="M60 96 V132" stroke="#d68910" stroke-width="2"/>`;
      case 'hirka':
        return torso(c) + `<path d="M50 92 Q60 100 70 92 L66 132 L54 132Z" fill="${l.shirt || '#f2f3f4'}" ${OL}/>` +
          `<g fill="${shade(c, -40)}"><circle cx="52" cy="110" r="1.6"/><circle cx="53" cy="122" r="1.6"/></g><path d="M24 118 q8 4 16 0" stroke="${shade(c, 30)}" stroke-width="1.6" fill="none"/>`;
      default:
        return torso(c) + `<path d="M48 92 Q60 102 72 92" fill="none" stroke="${shade(c, -35)}" stroke-width="3"/>` +
          (l.print ? `<circle cx="60" cy="117" r="8.5" fill="none" stroke="${a}" stroke-width="2.6"/><path d="M56 117 l3 3 l5 -6" stroke="${a}" stroke-width="2" fill="none"/>` : '');
    }
  }

  KE.portrait = function (l, opts) {
    opts = opts || {};
    const id = ++uid;
    const mood = opts.mood || 'neutral';
    const neck = shade(l.skin, -20);
    const camera = l.camera ? `<path d="M40 94 L60 118 L80 94" stroke="#212f3d" stroke-width="2" fill="none"/><rect x="51" y="113" width="18" height="12" rx="2" fill="#212f3d"/><circle cx="60" cy="119" r="4" fill="#85929e" stroke="#212f3d"/>` : '';
    const scarfNeck = l.neckScarf ? `<path d="M44 90 Q60 100 76 90 L78 98 Q60 108 42 98Z" fill="${l.neckScarf}" ${OL}/>` : '';
    return `<svg class="ke-portrait ${opts.cls || ''}" viewBox="0 0 120 132" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" role="img" aria-label="${opts.label || 'karakter'}">` +
      hairBack(l) + outfit(l) +
      `<path d="M50 76 h20 v16 q-10 6 -20 0z" fill="${neck}"/><path d="M50 80 q10 6 20 0" stroke="#000" stroke-opacity=".12" stroke-width="4" fill="none"/>` +
      scarfNeck + camera + headGroup(l, id, mood) + `</svg>`;
  };

  /* ---------- Tam boy figür ---------- */
  function bodyOutfit(l, pose) {
    const o = l.outfit, c = l.outfitColor || '#c0392b', a = l.accent || '#f4d03f';
    const pants = o === 'salvar' ? '#1c2833' : o === 'takim' ? shade(c, -10) : o === 'reflektif' ? '#34495e' : l.pants || '#3d4b5c';
    const shirt = ['onluk', 'yelek', 'salvar'].includes(o) ? (l.shirt || '#f4f6f6') : o === 'sef' || o === 'beyazceket' ? '#fbfcfc' : o === 'reflektif' ? '#5d6d7e' : c;
    const sleeve = o === 'tisort' ? 'short' : 'long';
    const skin = l.skin;
    const walk = pose === 'walk';
    let s = '';
    /* bacaklar */
    if (l.skirt) {
      s += `<path d="M34 170 L86 170 L94 236 L26 236Z" fill="${l.skirtColor || shade(c, -20)}" ${OL}/><g class="legs"><ellipse cx="46" cy="241" rx="9" ry="4.5" fill="#2c2420"/><ellipse cx="74" cy="241" rx="9" ry="4.5" fill="#2c2420"/></g>`;
    } else {
      const wide = o === 'salvar';
      s += `<g class="leg legL"><path d="M${wide ? 30 : 37} 168 h${wide ? 30 : 22} l-2 64 h-17z" fill="${pants}" ${OL}/><ellipse cx="47" cy="236" rx="11" ry="5" fill="#2c2420" ${OL}/></g>`;
      s += `<g class="leg legR"><path d="M${wide ? 60 : 61} 168 h${wide ? 30 : 22} l-3 64 h-17z" fill="${shade(pants, -8)}" ${OL}/><ellipse cx="74" cy="236" rx="11" ry="5" fill="#2c2420" ${OL}/></g>`;
    }
    /* gövde */
    s += `<path d="M28 104 Q30 94 44 92 L76 92 Q90 94 92 104 L94 174 Q60 182 26 174 Z" fill="${shirt}" ${OL}/>`;
    switch (o) {
      case 'onluk': s += `<path d="M38 106 L82 106 L86 ${l.skirt ? 200 : 214} L34 ${l.skirt ? 200 : 214}Z" fill="${c}" ${OL}/><path d="M40 106 L47 93 M80 106 L73 93" stroke="${c}" stroke-width="3.5"/><path d="M36 150 h48" stroke="#000" stroke-opacity=".1" stroke-width="3"/>` + (l.logo ? `<circle cx="60" cy="126" r="8" fill="${a}" ${OL}/><path d="M56 126 h8 M60 122 v8" stroke="${c}" stroke-width="2"/>` : ''); break;
      case 'sef': s += `<path d="M60 100 V176" stroke="#e1e5e6" stroke-width="2"/><g fill="${a}"><circle cx="51" cy="114" r="2.2"/><circle cx="51" cy="130" r="2.2"/><circle cx="51" cy="146" r="2.2"/><circle cx="69" cy="114" r="2.2"/><circle cx="69" cy="130" r="2.2"/><circle cx="69" cy="146" r="2.2"/></g>`; break;
      case 'yelek': s += `<path d="M28 104 Q30 94 44 92 L54 172 L27 172Z" fill="${c}" ${OL}/><path d="M92 104 Q90 94 76 92 L66 172 L93 172Z" fill="${c}" ${OL}/><path d="M33 110 Q42 130 46 166 M87 110 Q78 130 74 166" stroke="${a}" stroke-width="1.6" fill="none"/>`; break;
      case 'salvar': s += `<path d="M28 104 Q30 94 44 92 L50 150 L28 150Z" fill="#1c2833" ${OL}/><path d="M92 104 Q90 94 76 92 L70 150 L92 150Z" fill="#1c2833" ${OL}/><rect x="25" y="156" width="70" height="16" rx="3" fill="${c}" ${OL}/><path d="M25 161 h70 M25 166 h70" stroke="${a}" stroke-width="1.4"/><path d="M84 168 l6 18 l-8 -2z" fill="${c}"/>`; break;
      case 'beyazceket': s += `<path d="M46 92 L58 130 L52 176 M74 92 L62 130 L68 176" stroke="#c9cdce" stroke-width="2" fill="none"/><path d="M51 96 L60 101 L51 106Z M69 96 L60 101 L69 106Z" fill="${a}" ${OL}/>`; break;
      case 'takim': s += `<path d="M48 92 L60 128 L72 92Z" fill="#fdfefe"/><path d="M58 98 L62 98 L63.5 124 L60 128 L56.5 124Z" fill="${a}"/><path d="M46 92 L58 132 L56 176 M74 92 L62 132 L64 176" stroke="${shade(c, -35)}" stroke-width="2.4" fill="none"/>`; break;
      case 'mont': s += `<path d="M60 100 V176" stroke="${shade(c, 45)}" stroke-width="2.6"/><path d="M28 150 h64" stroke="${shade(c, -25)}" stroke-width="2"/><rect x="30" y="118" width="13" height="4" rx="1.5" fill="${a}"/><rect x="77" y="118" width="13" height="4" rx="1.5" fill="${a}"/>`; break;
      case 'reflektif': s += `<path d="M30 100 L90 100 L92 172 L28 172Z" fill="#f39c12" ${OL}/><rect x="29" y="126" width="62" height="6" fill="#fdfefe"/><rect x="29" y="148" width="62" height="6" fill="#fdfefe"/>`; break;
      case 'hirka': s += `<path d="M28 104 Q30 94 44 92 L54 196 L24 194Z" fill="${c}" ${OL}/><path d="M92 104 Q90 94 76 92 L66 196 L96 194Z" fill="${c}" ${OL}/>`; break;
      case 'gomlek': s += `<path d="M46 92 L60 104 L74 92 L70 89 L60 98 L50 89Z" fill="${shade(c, 25)}" ${OL}/><path d="M60 104 V174" stroke="${shade(c, -30)}" stroke-width="1.5"/><rect x="26" y="166" width="68" height="7" fill="#3b2a20" opacity=".85"/>`; break;
      default: s += (l.print ? `<circle cx="60" cy="128" r="10" fill="none" stroke="${a}" stroke-width="3"/>` : '');
    }
    return { legsTorso: s, shirt, sleeve, skin, walk };
  }
  KE.figure = function (l, opts) {
    opts = opts || {};
    const id = ++uid;
    const mood = opts.mood || 'neutral';
    const pose = opts.pose || 'stand';
    const B = bodyOutfit(l, pose);
    const arm = (side, up) => {
      const sx = side === 'L' ? 30 : 90;
      const ex = side === 'L' ? 22 : 98;
      const col = (l.outfit === 'yelek' || l.outfit === 'onluk' || l.outfit === 'salvar') ? B.shirt : (l.outfit === 'reflektif' ? '#5d6d7e' : B.shirt);
      if (up) return `<path d="M${sx} 104 Q104 118 100 134" stroke="${col}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M${sx} 104 Q104 118 100 134" stroke="${INK}" stroke-opacity=".25" stroke-width="15" fill="none" stroke-linecap="round" style="mix-blend-mode:multiply"/><circle cx="100" cy="136" r="6" fill="${B.skin}" ${OL}/>`;
      const short = B.sleeve === 'short';
      return `<g class="arm arm${side}"><path d="M${sx} 104 L${ex} 164" stroke="${short ? B.skin : col}" stroke-width="12" stroke-linecap="round"/>${short ? `<path d="M${sx} 104 L${(sx + ex) / 2} 128" stroke="${col}" stroke-width="13" stroke-linecap="round"/>` : ''}<circle cx="${ex}" cy="167" r="6" fill="${B.skin}" ${OL}/></g>`;
    };
    const tray = opts.tray ? `<g class="tray"><ellipse cx="102" cy="132" rx="22" ry="5" fill="#bdc3c7" ${OL}/>${opts.trayDish ? `<g transform="translate(86 104) scale(.5)">${opts.trayDish}</g>` : ''}</g>` : '';
    return `<svg class="ke-figure ${pose === 'walk' ? 'walking' : ''} ${opts.cls || ''}" viewBox="0 -4 124 252" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" role="img" aria-label="${opts.label || 'karakter'}">` +
      `<ellipse cx="60" cy="242" rx="34" ry="6" fill="#000" opacity=".16"/>` +
      hairBack(l) + arm('L') + (opts.tray ? '' : arm('R')) + B.legsTorso +
      `<path d="M50 76 h20 v16 q-10 6 -20 0z" fill="${shade(l.skin, -20)}"/>` +
      (opts.tray ? arm('R', true) + tray : '') +
      headGroup(l, id, mood) + `</svg>`;
  };
  KE.moodFromValue = (v) => v >= 72 ? 'happy' : v >= 45 ? 'neutral' : v >= 25 ? 'sad' : 'angry';

  /* Görünüm üreticiler */
  KE.randomLook = function (gender, age, extra) {
    const male = gender === 'e';
    const l = {
      gender, age,
      skin: pickCosmetic(KE.SKINS),
      hairColor: age === 'yasli' ? pickCosmetic(['#9e9e9e', '#bdbdbd', '#d0d0d0']) : pickCosmetic(KE.HAIR_COLORS.slice(0, 5)),
      hair: male ? pickCosmetic(age === 'yasli' ? ['kel', 'kisa', 'kel'] : ['kisa', 'dalgali', 'yan', 'kisa']) : pickCosmetic(['uzun', 'topuz', 'uzun', 'dalgali']),
      facial: male ? pickCosmetic(age === 'genc' ? ['none', 'none', 'kirli', 'biyik'] : ['biyik', 'gurbiyik', 'sakal', 'kirli', 'none']) : 'none',
      glasses: Math.random() < (age === 'yasli' ? 0.45 : 0.15),
      head: 'none', outfit: 'tisort', outfitColor: pickCosmetic(['#c0392b', '#2471a3', '#229954', '#d68910', '#7d3c98', '#1abc9c', '#34495e']),
      accent: pickCosmetic(['#f4d03f', '#fdfefe', '#ec7063', '#5dade2'])
    };
    l.pants = pickCosmetic(['#2e3b4e', '#3d4b5c', '#4a3b2f', '#22313f', '#5b6770', '#1f4e79']);
    if (!male && age !== 'genc' && Math.random() < 0.5) { l.skirt = true; l.skirtColor = pickCosmetic(['#5b2c6f', '#1a5276', '#7b241c', '#4d5656', '#145a32']); }
    if (!male && Math.random() < 0.45) { l.head = 'basortusu'; l.scarf = pickCosmetic(['#8e44ad', '#16a085', '#c0392b', '#2e86c1', '#d35400', '#784212', '#1f618d', '#b7950b']); }
    return Object.assign(l, extra || {});
  };

  KE.customerLook = function (type) {
    const r = Math.random();
    let gender = r < 0.55 ? 'e' : 'k', age = pickCosmetic(['genc', 'orta', 'orta', 'yasli']);
    if (type === 'ogrenci' || type === 'gece') age = 'genc';
    if (type === 'isci') gender = Math.random() < 0.9 ? 'e' : 'k';
    const l = KE.randomLook(gender, age);
    switch (type) {
      case 'ogrenci': l.outfit = pickCosmetic(['tisort', 'mont', 'tisort']); l.print = true; if (l.head === 'none' && Math.random() < 0.3) { l.head = 'bone'; l.hatColor = pickCosmetic(['#2471a3', '#c0392b', '#1e8449', '#212f3d']); } break;
      case 'beyaz': l.outfit = pickCosmetic(['takim', 'gomlek']); l.outfitColor = pickCosmetic(['#1b2631', '#2e4053', '#5d6d7e', '#aed6f1', '#fdfefe']); l.accent = pickCosmetic(['#922b21', '#1f618d', '#7d3c98']); l.glasses = Math.random() < 0.35; break;
      case 'aile': l.outfit = pickCosmetic(['gomlek', 'hirka', 'tisort']); l.age = age === 'genc' ? 'orta' : age; break;
      case 'gurme': l.outfit = pickCosmetic(['gomlek', 'takim']); l.glasses = true; l.outfitColor = pickCosmetic(['#4a235a', '#0e6655', '#6e2c00', '#1b2631']); l.neckScarf = Math.random() < 0.5 ? '#c0392b' : null; break;
      case 'turist': l.skin = pickCosmetic(['#f5dcc4', '#f3d2b3', '#e8b98f', '#8a5634', '#c68b5c']); l.hairColor = pickCosmetic(['#e3c16f', '#b5651d', '#2b1d14', '#d4a76a']); if (l.head === 'basortusu') l.head = 'none'; if (Math.random() < 0.5) { l.head = 'gunes'; l.hatColor = pickCosmetic(['#f5cba7', '#fdebd0', '#d5f5e3']); } l.camera = Math.random() < 0.6; l.outfit = pickCosmetic(['tisort', 'gomlek']); l.outfitColor = pickCosmetic(['#48c9b0', '#f5b041', '#5dade2', '#f1948a']); break;
      case 'isci': l.outfit = 'reflektif'; if (Math.random() < 0.6 && l.head !== 'basortusu') l.head = 'baret'; break;
      case 'gece': l.outfit = pickCosmetic(['mont', 'tisort']); l.outfitColor = pickCosmetic(['#17202a', '#512e5f', '#7b241c', '#0b5345']); l.print = true; break;
    }
    return l;
  };

  /* Çalışan görünümü: rol + kostüm + yöre */
  KE.staffLook = function (s) {
    const l = Object.assign({}, s.look);
    const reg = KE.REGIONS[s.region] || KE.REGIONS['İstanbul'];
    const brand = '#c0392b';
    l.head = l.head === 'basortusu' ? 'basortusu' : 'none';
    const keepScarf = l.head === 'basortusu';
    switch (s.costume) {
      case 'yoresel':
        l.outfit = reg.outfit; l.outfitColor = reg.color; l.accent = reg.accent;
        if (!keepScarf && reg.head !== 'none') l.head = reg.head;
        break;
      case 'sef':
        l.outfit = 'sef'; l.accent = brand; if (!keepScarf) l.head = 'sefsapka'; break;
      case 'markali':
        l.outfit = 'onluk'; l.outfitColor = brand; l.accent = '#f4d03f'; l.logo = true; l.shirt = '#fdfefe'; break;
      default:
        l.outfit = 'onluk'; l.outfitColor = '#f2f3f4'; l.shirt = s.role === 'temizlik' ? '#5dade2' : '#d6eaf8'; l.logo = false;
    }
    if (s.costume === 'temel' || s.costume === 'markali') {
      if (s.role === 'kurye') { l.outfit = 'mont'; l.outfitColor = s.costume === 'markali' ? brand : '#e67e22'; l.accent = '#f4d03f'; }
      if (s.role === 'mudur') { l.outfit = 'takim'; l.outfitColor = '#1b2631'; l.accent = brand; }
      if (s.role === 'kasiyer' || s.role === 'garson') { l.outfit = 'gomlek'; l.outfitColor = s.costume === 'markali' ? brand : '#34495e'; }
    }
    return l;
  };

  /* Sabit hikâye karakterleri */
  KE.CAST = {
    zeynep: { name: 'Zeynep Hanım', role: 'Muhasebeci', look: { gender: 'k', age: 'orta', skin: '#e8b98f', hairColor: '#2b1d14', hair: 'topuz', facial: 'none', glasses: true, head: 'none', outfit: 'gomlek', outfitColor: '#1f618d' } },
    ayse: { name: 'Ayşe Teyze', role: 'Müdavim', look: { gender: 'k', age: 'yasli', skin: '#e8b98f', hairColor: '#bdbdbd', hair: 'uzun', facial: 'none', glasses: true, head: 'basortusu', scarf: '#7d3c98', outfit: 'hirka', outfitColor: '#922b21', shirt: '#f5eef8' } },
    riza: { name: 'Kasap Rıza', role: 'Tedarikçi', look: { gender: 'e', age: 'orta', skin: '#d9a273', hairColor: '#1c1410', hair: 'kisa', facial: 'gurbiyik', glasses: false, head: 'none', outfit: 'onluk', outfitColor: '#fbfcfc', shirt: '#c0392b' } },
    bulent: { name: 'Bülent Bey', role: 'Belediye müfettişi', look: { gender: 'e', age: 'orta', skin: '#f3d2b3', hairColor: '#4a2f1d', hair: 'yan', facial: 'biyik', glasses: true, head: 'none', outfit: 'takim', outfitColor: '#5d6d7e', accent: '#1f618d' } },
    emre: { name: 'Kurye Emre', role: 'Kurye', look: { gender: 'e', age: 'genc', skin: '#c68b5c', hairColor: '#1c1410', hair: 'kisa', facial: 'kirli', glasses: false, head: 'kask', hatColor: '#e74c3c', outfit: 'mont', outfitColor: '#e67e22', accent: '#f4d03f' } },
    rakip: { name: 'Cüneyt Bey', role: '"Lüks Kebap" sahibi', look: { gender: 'e', age: 'orta', skin: '#f3d2b3', hairColor: '#1c1410', hair: 'yan', facial: 'kirli', glasses: false, head: 'none', outfit: 'takim', outfitColor: '#4a235a', accent: '#d4ac0d' } },
    banker: { name: 'Sevim Hanım', role: 'Banka şube müdürü', look: { gender: 'k', age: 'orta', skin: '#f3d2b3', hairColor: '#6b4423', hair: 'uzun', facial: 'none', glasses: false, head: 'none', outfit: 'takim', outfitColor: '#1b4f72', accent: '#fdfefe' } },
    ajans: { name: 'Deniz', role: 'Reklam ajansı', look: { gender: 'e', age: 'genc', skin: '#e8b98f', hairColor: '#2b1d14', hair: 'dalgali', facial: 'kirli', glasses: true, head: 'none', outfit: 'tisort', outfitColor: '#f39c12', accent: '#fdfefe', print: true } },
    terzi: { name: 'Terzi Nuri', role: 'Terzi', look: { gender: 'e', age: 'yasli', skin: '#e8b98f', hairColor: '#d0d0d0', hair: 'kel', facial: 'biyik', glasses: true, head: 'none', outfit: 'yelek', outfitColor: '#6e2c00', accent: '#f5cba7' } },
    dekor: { name: 'Gül Hanım', role: 'Dekoratör', look: { gender: 'k', age: 'orta', skin: '#c68b5c', hairColor: '#1c1410', hair: 'dalgali', facial: 'none', glasses: false, head: 'none', outfit: 'gomlek', outfitColor: '#117a65' } },
    buro: { name: 'Tuğba Hanım', role: 'Eleman bürosu', look: { gender: 'k', age: 'genc', skin: '#e8b98f', hairColor: '#4a2f1d', hair: 'topuz', facial: 'none', glasses: true, head: 'basortusu', scarf: '#1f618d', outfit: 'gomlek', outfitColor: '#fdfefe' } },
    lonca: { name: 'Lonca Şeyhi Rauf Usta', role: 'Usta pazarı', look: { gender: 'e', age: 'yasli', skin: '#d9a273', hairColor: '#d0d0d0', hair: 'kel', facial: 'sakal', glasses: false, head: 'takke', accent: '#7d6608', outfit: 'yelek', outfitColor: '#4a235a' } }
  };
  /* Aynı görünüş + aynı ayarlar için çizimi bir kez üret (sahne her dakika yeniden sorar) */
  const memo = (fn) => { const cache = new Map(); return function (l, opts) { const k = JSON.stringify([l, opts || null]); let v = cache.get(k); if (v === undefined) { v = fn(l, opts); if (cache.size > 400) cache.clear(); cache.set(k, v); } return v; }; };
  KE.portrait = memo(KE.portrait);
  KE.figure = memo(KE.figure);
})();

/* ---------- Ustaların huyu: kimliğinden türetilir (kayda yazılmaz, her yerde aynı çıkar) ---------- */
KE.HUYS = {
  izinci: { name: 'Ailesine düşkün', desc: 'Ara sıra izin ister; izin verilirse çok sevinir.' },
  hirsli: { name: 'Hırslı', desc: 'Başka yerlerin tekliflerini dinler, yarışmalara can atar.' },
  sadik: { name: 'Sadık', desc: 'Başka yere gözü yok; morali zor bozulur.' }
};
KE.huyOf = function (s) {
  if (!s || !(s.role === 'usta' || s.role === 'cirak')) return null;
  const id = String(s.id || s.name || '');
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973;
  return ['izinci', 'hirsli', 'sadik'][h % 3];
};
