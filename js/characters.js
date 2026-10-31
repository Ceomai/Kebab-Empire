/* Kebab Empire — SVG karakter oluşturucu
   Katmanlı parçalar: gövde/kıyafet, boyun, kulak, yüz, saç, kaş, göz, burun, ağız, bıyık/sakal, gözlük, başlık.
   Göz kırpma CSS ile yapılır (.ke-eye). Yüz ifadesi moral/memnuniyete göre değişir. */
(function () {
  let uid = 0;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  function hairBack(l) {
    const c = l.hairColor;
    if (l.head === 'basortusu') return '';
    if (l.hair === 'uzun') return `<path d="M33 52 Q30 24 60 22 Q90 24 87 52 L90 100 Q60 108 30 100 Z" fill="${c}"/>`;
    if (l.hair === 'topuz') return `<circle cx="60" cy="22" r="10" fill="${c}"/>`;
    return '';
  }
  function hairFront(l) {
    const c = l.hairColor;
    if (['basortusu', 'pusi', 'kalpak', 'kask', 'sefsapka'].includes(l.head) && l.hair !== 'uzun') {
      return l.head === 'sefsapka' || l.head === 'kalpak' ? `<path d="M36 52 Q37 44 42 42 L42 52Z M84 52 Q83 44 78 42 L78 52Z" fill="${c}"/>` : '';
    }
    switch (l.hair) {
      case 'kel': return `<path d="M35 56 Q35 46 39 42 L41 58Z M85 56 Q85 46 81 42 L79 58Z" fill="${c}"/>`;
      case 'dalgali': return `<path d="M35 54 Q30 30 50 26 Q60 20 72 26 Q90 30 85 54 Q82 42 76 40 Q72 46 64 40 Q58 46 50 40 Q44 46 38 42 Z" fill="${c}"/>`;
      case 'uzun': return `<path d="M36 52 Q36 28 60 27 Q84 28 84 52 Q78 36 62 38 Q50 38 42 44 Z" fill="${c}"/>`;
      case 'topuz': return `<path d="M36 52 Q36 28 60 28 Q84 28 84 52 Q80 38 60 37 Q40 38 36 52Z" fill="${c}"/>`;
      case 'yan': return `<path d="M35 54 Q34 28 62 27 Q86 29 85 52 Q82 38 70 36 Q52 34 44 40 Q38 44 35 54Z" fill="${c}"/>`;
      default: return `<path d="M36 52 Q35 28 60 27 Q85 28 84 52 Q81 38 60 36 Q39 38 36 52Z" fill="${c}"/>`;
    }
  }
  function outfit(l, id) {
    const o = l.outfit, c = l.outfitColor || '#c0392b', a = l.accent || '#f4d03f';
    const torso = (fill) => `<path d="M8 132 Q10 100 40 92 L80 92 Q110 100 112 132 Z" fill="${fill}"/>`;
    const shirtCollar = (fill) => `<path d="M47 92 L60 106 L73 92 L68 90 L60 99 L52 90Z" fill="${fill}"/>`;
    switch (o) {
      case 'onluk':
        return torso(l.shirt || '#ecf0f1') + shirtCollar(shade(l.shirt || '#ecf0f1', -25)) +
          `<path d="M40 104 L80 104 L84 132 L36 132Z" fill="${c}"/><path d="M42 104 L48 92 M78 104 L72 92" stroke="${c}" stroke-width="3"/>` +
          (l.logo ? `<circle cx="60" cy="116" r="7" fill="${a}"/><path d="M56 116 h8 M60 112 v8" stroke="${c}" stroke-width="2"/>` : '');
      case 'sef':
        return torso('#fbfcfc') + `<path d="M48 92 L60 100 L72 92" fill="none" stroke="#d5d8dc" stroke-width="3"/>` +
          `<g fill="${a}"><circle cx="52" cy="108" r="2"/><circle cx="52" cy="118" r="2"/><circle cx="68" cy="108" r="2"/><circle cx="68" cy="118" r="2"/></g>` +
          `<path d="M60 100 L60 132" stroke="#e5e8e8" stroke-width="2"/>`;
      case 'yelek':
        return torso('#f4f6f6') + shirtCollar('#d5dbdb') +
          `<path d="M14 132 Q16 102 40 94 L54 132Z" fill="${c}"/><path d="M106 132 Q104 102 80 94 L66 132Z" fill="${c}"/>` +
          `<g fill="${a}"><circle cx="34" cy="108" r="1.6"/><circle cx="40" cy="116" r="1.6"/><circle cx="44" cy="125" r="1.6"/><circle cx="86" cy="108" r="1.6"/><circle cx="80" cy="116" r="1.6"/><circle cx="76" cy="125" r="1.6"/></g>` +
          `<path d="M30 104 Q38 110 46 128 M90 104 Q82 110 74 128" stroke="${a}" stroke-width="1" fill="none" opacity=".7"/>`;
      case 'salvar':
        return torso('#fdfefe') + shirtCollar('#d5dbdb') +
          `<path d="M16 132 Q18 104 40 95 L50 132Z" fill="#1c2833"/><path d="M104 132 Q102 104 80 95 L70 132Z" fill="#1c2833"/>` +
          `<rect x="22" y="122" width="76" height="10" fill="${c}"/><path d="M22 125 h76 M22 129 h76" stroke="${a}" stroke-width="1"/>`;
      case 'beyazceket':
        return torso('#fbfcfc') + `<path d="M46 92 L58 116 L52 132 M74 92 L62 116 L68 132" stroke="#d0d3d4" stroke-width="2" fill="none"/>` +
          `<path d="M52 96 L60 100 L52 104Z M68 96 L60 100 L68 104Z" fill="${a}"/><circle cx="60" cy="100" r="2" fill="${shade(a, -30)}"/>`;
      case 'gomlek':
        return torso(c) + `<path d="M46 92 L60 104 L74 92 L70 89 L60 98 L50 89Z" fill="${shade(c, 25)}"/><path d="M60 104 V132" stroke="${shade(c, -30)}" stroke-width="1.5"/>` +
          `<g fill="${shade(c, -40)}"><circle cx="60" cy="112" r="1.3"/><circle cx="60" cy="122" r="1.3"/></g>`;
      case 'takim':
        return torso(c) + `<path d="M48 92 L60 120 L72 92Z" fill="#fdfefe"/><path d="M58 98 L62 98 L63 118 L60 122 L57 118Z" fill="${a}"/>` +
          `<path d="M46 92 L58 122 M74 92 L62 122" stroke="${shade(c, -35)}" stroke-width="2"/>`;
      case 'mont':
        return torso(c) + `<path d="M44 92 Q60 102 76 92 L76 98 Q60 108 44 98Z" fill="${shade(c, -30)}"/><path d="M60 102 V132" stroke="${shade(c, 40)}" stroke-width="2"/>` +
          `<rect x="30" y="112" width="12" height="3" rx="1" fill="${a}"/><rect x="78" y="112" width="12" height="3" rx="1" fill="${a}"/>`;
      case 'reflektif':
        return torso('#5d6d7e') + `<path d="M24 132 Q26 104 44 96 L76 96 Q94 104 96 132Z" fill="#f39c12"/>` +
          `<rect x="26" y="114" width="68" height="5" fill="#f7f9f9" opacity=".9"/><path d="M60 96 V132" stroke="#d68910" stroke-width="2"/>`;
      case 'hirka':
        return torso(c) + `<path d="M50 92 Q60 100 70 92 L66 132 L54 132Z" fill="${l.shirt || '#f2f3f4'}"/>` +
          `<g fill="${shade(c, -40)}"><circle cx="52" cy="110" r="1.5"/><circle cx="53" cy="122" r="1.5"/></g>`;
      case 'tisort':
      default:
        return torso(c) + `<path d="M48 92 Q60 102 72 92" fill="none" stroke="${shade(c, -35)}" stroke-width="3"/>` +
          (l.print ? `<circle cx="60" cy="116" r="8" fill="none" stroke="${a}" stroke-width="2.5"/>` : '');
    }
  }
  function headwear(l, id) {
    const a = l.accent || '#c0392b';
    switch (l.head) {
      case 'sefsapka':
        return `<path d="M38 44 L82 44 L80 34 Q90 26 82 16 Q76 6 66 12 Q60 2 52 10 Q42 4 38 16 Q30 26 40 34Z" fill="#fdfefe" stroke="#e5e7e9" stroke-width="1.5"/><rect x="38" y="38" width="44" height="7" fill="#f2f3f4"/>`;
      case 'kasket':
        return `<path d="M34 46 Q34 26 60 25 Q86 26 86 44 Q70 38 50 40 Z" fill="${l.hatColor || '#5d4037'}"/><path d="M34 46 Q28 48 30 50 Q46 46 60 45 Q50 44 34 46Z" fill="${shade(l.hatColor || '#5d4037', -25)}"/><path d="M38 44 Q60 36 84 42" stroke="${shade(l.hatColor || '#5d4037', 25)}" fill="none"/>`;
      case 'bone':
        return `<path d="M35 46 Q35 24 60 24 Q85 24 85 46 Z" fill="${l.hatColor || '#2471a3'}"/><path d="M60 46 Q78 44 96 50 Q84 54 60 50Z" fill="${shade(l.hatColor || '#2471a3', -25)}"/>`;
      case 'gunes':
        return `<ellipse cx="60" cy="36" rx="38" ry="7" fill="${l.hatColor || '#f5cba7'}"/><path d="M40 36 Q40 18 60 18 Q80 18 80 36Z" fill="${l.hatColor || '#f5cba7'}"/><rect x="40" y="31" width="40" height="4" fill="${a}"/>`;
      case 'baret':
        return `<path d="M34 44 Q34 20 60 20 Q86 20 86 44Z" fill="#f4d03f"/><rect x="30" y="42" width="60" height="5" rx="2" fill="#d4ac0d"/><path d="M60 20 V44" stroke="#d4ac0d" stroke-width="3"/>`;
      case 'kask':
        return `<path d="M30 60 Q28 18 60 18 Q92 18 90 60 L82 60 Q82 40 60 40 Q38 40 38 60Z" fill="${l.hatColor || '#c0392b'}"/><path d="M38 48 Q60 40 82 48" stroke="#fdfefe" stroke-width="3" fill="none" opacity=".7"/>`;
      case 'takke':
        return `<path d="M38 40 Q40 24 60 24 Q80 24 82 40 Z" fill="${a}"/><path d="M40 36 h40" stroke="${shade(a, 50)}" stroke-width="2" stroke-dasharray="3 2"/>`;
      case 'kalpak':
        return `<path d="M36 44 L38 18 Q60 10 82 18 L84 44 Q60 38 36 44Z" fill="#2c2420"/><path d="M38 24 Q60 18 82 24 M37 32 Q60 26 83 32" stroke="#4d3d33" fill="none"/>`;
      case 'pusi': {
        const pid = 'p' + id;
        return `<defs><pattern id="${pid}" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#fdfefe"/><rect width="3" height="3" fill="#b03a2e"/><rect x="3" y="3" width="3" height="3" fill="#b03a2e"/></pattern></defs>` +
          `<path d="M33 54 Q30 22 60 20 Q90 22 87 54 Q84 40 60 38 Q36 40 33 54Z" fill="url(#${pid})"/><path d="M34 46 Q60 36 86 46" stroke="#7b241c" stroke-width="3" fill="none"/>`;
      }
      case 'basortusu':
        return `<path d="M30 60 Q26 18 60 18 Q94 18 90 60 Q92 86 80 96 Q70 104 60 104 Q50 104 40 96 Q28 86 30 60 Z M38 56 Q40 32 60 32 Q80 32 82 56 Q82 78 72 86 Q60 92 48 86 Q38 78 38 56Z" fill="${l.scarf || '#8e44ad'}" fill-rule="evenodd"/>` +
          `<path d="M44 30 Q60 24 76 30" stroke="${shade(l.scarf || '#8e44ad', 40)}" stroke-width="1.5" fill="none" stroke-dasharray="2 3"/>`;
      default: return '';
    }
  }
  function face(l, mood) {
    const dark = '#2c1e16';
    const browY = l.head === 'basortusu' ? 47 : 46;
    let brows, mouth, extra = '';
    if (mood === 'happy') {
      brows = `<path d="M45 ${browY} Q51 ${browY - 4} 56 ${browY}" /><path d="M64 ${browY} Q69 ${browY - 4} 75 ${browY}" />`;
      mouth = `<path d="M50 72 Q60 82 70 72 Q60 76 50 72Z" fill="#7b241c" stroke="${dark}" stroke-width="1.5"/><path d="M53 73 Q60 75 67 73" stroke="#fdfefe" stroke-width="2" fill="none"/>`;
      extra = `<circle cx="45" cy="66" r="4" fill="#ec7063" opacity=".35"/><circle cx="75" cy="66" r="4" fill="#ec7063" opacity=".35"/>`;
    } else if (mood === 'sad') {
      brows = `<path d="M45 ${browY - 2} L56 ${browY + 1}" /><path d="M64 ${browY + 1} L75 ${browY - 2}" />`;
      mouth = `<path d="M52 77 Q60 70 68 77" fill="none" stroke="${dark}" stroke-width="2"/>`;
    } else if (mood === 'angry') {
      brows = `<path d="M45 ${browY - 3} L56 ${browY + 2}" /><path d="M64 ${browY + 2} L75 ${browY - 3}" />`;
      mouth = `<path d="M52 76 Q60 71 68 76" fill="none" stroke="${dark}" stroke-width="2.4"/>`;
    } else {
      brows = `<path d="M45 ${browY} L56 ${browY - 1}" /><path d="M64 ${browY - 1} L75 ${browY}" />`;
      mouth = `<path d="M53 74 Q60 76 67 74" fill="none" stroke="${dark}" stroke-width="2"/>`;
    }
    const browColor = l.age === 'yasli' ? '#9e9e9e' : (l.hairColor || dark);
    let fh = '';
    const hc = l.age === 'yasli' ? '#bdbdbd' : (l.hairColor || dark);
    if (l.facial === 'biyik') fh = `<path d="M49 69 Q54 64 60 67 Q66 64 71 69 Q66 72 60 70 Q54 72 49 69Z" fill="${hc}"/>`;
    if (l.facial === 'gurbiyik') fh = `<path d="M45 70 Q52 61 60 66 Q68 61 75 70 Q72 75 66 72 Q60 71 54 72 Q48 75 45 70Z" fill="${hc}"/>`;
    if (l.facial === 'sakal') fh = `<path d="M37 60 Q38 88 60 92 Q82 88 83 60 Q80 74 72 78 Q60 84 48 78 Q40 74 37 60Z" fill="${hc}"/><path d="M50 69 Q55 65 60 67 Q65 65 70 69 Q65 71 60 70 Q55 71 50 69Z" fill="${hc}"/>`;
    if (l.facial === 'kirli') fh = `<path d="M38 62 Q40 88 60 91 Q80 88 82 62 Q80 80 60 84 Q40 80 38 62Z" fill="${hc}" opacity=".3"/>`;
    const wrinkles = l.age === 'yasli' ? `<path d="M48 40 Q60 37 72 40 M50 37 Q60 34 70 37" stroke="#00000022" fill="none"/><path d="M42 58 l-3 2 M78 58 l3 2" stroke="#00000030"/>` : '';
    const glasses = l.glasses ? `<g fill="none" stroke="#2c3e50" stroke-width="1.8"><circle cx="51" cy="56" r="6.5"/><circle cx="69" cy="56" r="6.5"/><path d="M57.5 56 h5 M44.5 55 l-7 -2 M75.5 55 l7 -2"/></g>` : '';
    return `<g stroke="${browColor}" stroke-width="2.6" fill="none" stroke-linecap="round">${brows}</g>` +
      `<g class="ke-eye"><ellipse cx="51" cy="56" rx="2.7" ry="3.3" fill="${dark}"/><ellipse cx="69" cy="56" rx="2.7" ry="3.3" fill="${dark}"/><circle cx="52" cy="55" r=".9" fill="#fff"/><circle cx="70" cy="55" r=".9" fill="#fff"/></g>` +
      `<path d="M60 58 Q56 66 59 68 Q62 69 64 67" fill="none" stroke="${shade(l.skin, -50)}" stroke-width="1.6" stroke-linecap="round"/>` +
      extra + wrinkles + fh + mouth + glasses;
  }

  KE.portrait = function (l, opts) {
    opts = opts || {};
    const id = ++uid;
    const mood = opts.mood || 'neutral';
    const skin = l.skin;
    const neck = shade(skin, -18);
    const accessory = l.camera ? `<path d="M40 94 L60 118 L80 94" stroke="#212f3d" stroke-width="2" fill="none"/><rect x="52" y="114" width="16" height="11" rx="2" fill="#212f3d"/><circle cx="60" cy="119.5" r="3.5" fill="#85929e"/>` : '';
    const scarfNeck = l.neckScarf ? `<path d="M44 90 Q60 100 76 90 L78 98 Q60 108 42 98Z" fill="${l.neckScarf}"/>` : '';
    return `<svg class="ke-portrait ${opts.cls || ''}" viewBox="0 0 120 132" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${opts.label || 'karakter'}">` +
      hairBack(l) +
      outfit(l, id) +
      `<rect x="50" y="76" width="20" height="18" rx="6" fill="${neck}"/>` +
      scarfNeck + accessory +
      `<ellipse cx="36" cy="58" rx="5" ry="7" fill="${shade(skin, -10)}"/><ellipse cx="84" cy="58" rx="5" ry="7" fill="${shade(skin, -10)}"/>` +
      `<ellipse cx="60" cy="56" rx="24" ry="27" fill="${skin}"/>` +
      hairFront(l) + face(l, mood) + headwear(l, id) +
      `</svg>`;
  };

  KE.moodFromValue = (v) => v >= 72 ? 'happy' : v >= 45 ? 'neutral' : v >= 25 ? 'sad' : 'angry';

  /* Görünüm üreticiler */
  KE.randomLook = function (gender, age, extra) {
    const male = gender === 'e';
    const l = {
      gender, age,
      skin: pick(KE.SKINS),
      hairColor: age === 'yasli' ? pick(['#9e9e9e', '#bdbdbd', '#d0d0d0']) : pick(KE.HAIR_COLORS.slice(0, 5)),
      hair: male ? pick(age === 'yasli' ? ['kel', 'kisa', 'kel'] : ['kisa', 'dalgali', 'yan', 'kisa']) : pick(['uzun', 'topuz', 'uzun', 'dalgali']),
      facial: male ? pick(age === 'genc' ? ['none', 'none', 'kirli', 'biyik'] : ['biyik', 'gurbiyik', 'sakal', 'kirli', 'none']) : 'none',
      glasses: Math.random() < (age === 'yasli' ? 0.45 : 0.15),
      head: 'none', outfit: 'tisort', outfitColor: pick(['#c0392b', '#2471a3', '#229954', '#d68910', '#7d3c98', '#1abc9c', '#34495e']),
      accent: pick(['#f4d03f', '#fdfefe', '#ec7063', '#5dade2'])
    };
    if (!male && Math.random() < 0.45) { l.head = 'basortusu'; l.scarf = pick(['#8e44ad', '#16a085', '#c0392b', '#2e86c1', '#d35400', '#784212', '#1f618d', '#b7950b']); }
    return Object.assign(l, extra || {});
  };

  KE.customerLook = function (type) {
    const r = Math.random();
    let gender = r < 0.55 ? 'e' : 'k', age = pick(['genc', 'orta', 'orta', 'yasli']);
    if (type === 'ogrenci' || type === 'gece') age = 'genc';
    if (type === 'isci') gender = Math.random() < 0.9 ? 'e' : 'k';
    const l = KE.randomLook(gender, age);
    switch (type) {
      case 'ogrenci': l.outfit = pick(['tisort', 'mont', 'tisort']); l.print = true; if (l.head === 'none' && Math.random() < 0.3) { l.head = 'bone'; l.hatColor = pick(['#2471a3', '#c0392b', '#1e8449', '#212f3d']); } break;
      case 'beyaz': l.outfit = pick(['takim', 'gomlek']); l.outfitColor = pick(['#1b2631', '#2e4053', '#5d6d7e', '#aed6f1', '#fdfefe']); l.accent = pick(['#922b21', '#1f618d', '#7d3c98']); l.glasses = Math.random() < 0.35; break;
      case 'aile': l.outfit = pick(['gomlek', 'hirka', 'tisort']); l.age = age === 'genc' ? 'orta' : age; break;
      case 'gurme': l.outfit = pick(['gomlek', 'takim']); l.glasses = true; l.outfitColor = pick(['#4a235a', '#0e6655', '#6e2c00', '#1b2631']); l.neckScarf = Math.random() < 0.5 ? '#c0392b' : null; break;
      case 'turist': l.skin = pick(['#f5dcc4', '#f3d2b3', '#e8b98f', '#8a5634', '#c68b5c']); l.hairColor = pick(['#e3c16f', '#b5651d', '#2b1d14', '#d4a76a']); if (l.head === 'basortusu') l.head = 'none'; if (Math.random() < 0.5) { l.head = 'gunes'; l.hatColor = pick(['#f5cba7', '#fdebd0', '#d5f5e3']); } l.camera = Math.random() < 0.6; l.outfit = pick(['tisort', 'gomlek']); l.outfitColor = pick(['#48c9b0', '#f5b041', '#5dade2', '#f1948a']); break;
      case 'isci': l.outfit = 'reflektif'; if (Math.random() < 0.6 && l.head !== 'basortusu') l.head = 'baret'; break;
      case 'gece': l.outfit = pick(['mont', 'tisort']); l.outfitColor = pick(['#17202a', '#512e5f', '#7b241c', '#0b5345']); l.print = true; break;
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
    banker: { name: 'Selin Hanım', role: 'Banka şube müdürü', look: { gender: 'k', age: 'orta', skin: '#f3d2b3', hairColor: '#6b4423', hair: 'uzun', facial: 'none', glasses: false, head: 'none', outfit: 'takim', outfitColor: '#1b4f72', accent: '#fdfefe' } },
    ajans: { name: 'Deniz', role: 'Reklam ajansı', look: { gender: 'e', age: 'genc', skin: '#e8b98f', hairColor: '#2b1d14', hair: 'dalgali', facial: 'kirli', glasses: true, head: 'none', outfit: 'tisort', outfitColor: '#f39c12', accent: '#fdfefe', print: true } },
    terzi: { name: 'Terzi Nuri', role: 'Terzi', look: { gender: 'e', age: 'yasli', skin: '#e8b98f', hairColor: '#d0d0d0', hair: 'kel', facial: 'biyik', glasses: true, head: 'none', outfit: 'yelek', outfitColor: '#6e2c00', accent: '#f5cba7' } },
    dekor: { name: 'Gül Hanım', role: 'Dekoratör', look: { gender: 'k', age: 'orta', skin: '#c68b5c', hairColor: '#1c1410', hair: 'dalgali', facial: 'none', glasses: false, head: 'none', outfit: 'gomlek', outfitColor: '#117a65' } },
    buro: { name: 'Tuğba Hanım', role: 'Eleman bürosu', look: { gender: 'k', age: 'genc', skin: '#e8b98f', hairColor: '#4a2f1d', hair: 'topuz', facial: 'none', glasses: true, head: 'basortusu', scarf: '#1f618d', outfit: 'gomlek', outfitColor: '#fdfefe' } },
    lonca: { name: 'Lonca Şeyhi Rauf Usta', role: 'Usta pazarı', look: { gender: 'e', age: 'yasli', skin: '#d9a273', hairColor: '#d0d0d0', hair: 'kel', facial: 'sakal', glasses: false, head: 'takke', accent: '#7d6608', outfit: 'yelek', outfitColor: '#4a235a' } }
  };
})();
