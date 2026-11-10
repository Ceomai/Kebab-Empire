/* Kebab Empire — simülasyon motoru (2/8): personel
   Pozisyonlar, çalışan üretimi, kadro sınırı, usta/eleman pazarı ve tecrübe (yıldız) kazanımı. */
(function () {
  const { clamp, rnd, pick, mode: MODE } = KE.U;
  KE.STAR_NEED = [0, 40, 120, 300, 650, 1300];

  /* ---------- Görevler ve pozisyonlar ---------- */
  KE.POSITIONS = {
    usta: ['ocak', 'mola'], cirak: ['ocak', 'mola'],
    kasiyer: ['kasa', 'servis', 'mola'], garson: ['servis', 'kasa', 'mola'],
    temizlik: ['temizlik', 'servis', 'mola'], kurye: ['paket', 'mola'],
    mudur: ['yonetim', 'kasa', 'servis', 'mola']
  };
  KE.POS_NAMES = { ocak: 'Ocakbaşı', kasa: 'Kasa', servis: 'Servis', temizlik: 'Temizlik', paket: 'Paket', yonetim: 'Yönetim', mola: 'Mola' };
  KE.TASK_NAMES = { cook: 'Pişiriyor', order: 'Sipariş alıyor', deliver: 'Servis ediyor', clear: 'Masa topluyor', clean: 'Temizlik', paket: 'Paket yolda' };

  /* ---------- Personel üretimi ---------- */
  KE.wageFor = (spec, role) => {
    if (role === 'cirak') return KE.ECON.asgariBrut;
    const stars = Object.values(spec);
    const max = Math.max(1, ...stars);
    return Math.round((40000 + 9500 * (max - 1) + 3500 * (stars.length - 1)) / 500) * 500;
  };
  KE.makeStaff = function (G, o) {
    const id = 's' + (G.nextId++);
    const gender = o.gender || (KE.rand() < 0.8 ? 'e' : 'k');
    const age = o.age || pick(['genc', 'orta', 'orta', 'yasli']);
    /** @type {Staff} */
    const s = {
      id, name: o.name, role: /** @type {string} */ (o.role), region: o.region || pick(Object.keys(KE.REGIONS)), gender, age,
      spec: Object.assign({}, o.spec || {}), xp: {}, speed: o.speed || 1, quality: o.quality || 0.8, consistency: o.consistency || 0.8,
      waste: o.waste || 0.6, teach: o.teach || 0.5, friendly: o.friendly || rnd(0.4, 0.9), skill: o.skill || rnd(0.4, 0.9),
      trait: o.trait || null, wage: o.wage || KE.wageFor(o.spec || {}, /** @type {string} */ (o.role)), morale: o.morale || 66, costume: 'temel',
      branchId: o.branchId, look: o.look || KE.randomLook(gender, age), cumBase: 0, tipsMonth: 0, tipsTotal: 0, hiredDay: G.day,
      mentorId: null, servedToday: 0, servedTotal: 0, energy: 100, pos: null, task: null
    };
    if (s.look.gender !== gender) s.look = KE.randomLook(gender, age);
    s.pos = KE.POSITIONS[s.role][0];
    return s;
  };
  KE.isCook = (s) => s.role === 'usta' || s.role === 'cirak';

  /* ---------- Kadro sınırı: dükkân büyüdükçe artar ----------
     Mutfak (usta + çırak): ocak yeri + 1 · Salon (kasiyer + garson/komi): masa sayısının yarısı
     Destek (kurye + temizlik): salon seviyesi + 1 · Müdür: 1. Sınırı ocak ve salon yükseltmeleri açar. */
  KE.STAFF_GROUPS = {
    mutfak: { name: 'Mutfak', roles: ['usta', 'cirak'], up: 'cook' },
    salon: { name: 'Salon', roles: ['kasiyer', 'garson'], up: 'service' },
    destek: { name: 'Paket ve temizlik', roles: ['kurye', 'temizlik'], up: 'service' },
    yonetim: { name: 'Yönetim', roles: ['mudur'], up: null }
  };
  KE.staffGroup = (role) => Object.keys(KE.STAFF_GROUPS).find((g) => KE.STAFF_GROUPS[g].roles.includes(role));
  KE.staffCapsAt = (G, b, eq) => {
    const M = KE.MODES[G.mode].equipment;
    const st = M.cook.levels[eq.cook].stations, tables = M.service.levels[eq.service].tables;
    const fl = b && b.flagship ? 1 : 0;
    return { mutfak: st + 1 + fl, salon: Math.ceil((tables + 4 * fl) / 2), destek: eq.service + 1, yonetim: 1 };
  };
  KE.staffCaps = (G, b) => KE.staffCapsAt(G, b, b.equipment);
  /** Bu şubede bu rolden biri daha çalışabilir mi? { ok, group, used, cap, hint } */
  KE.canHire = function (G, b, role, exceptId) {
    const group = /** @type {string} */ (KE.staffGroup(role));
    const cap = KE.staffCaps(G, b)[group];
    const used = KE.branchStaff(G, b).filter((s) => s.id !== exceptId && KE.staffGroup(s.role) === group).length;
    const g = KE.STAFF_GROUPS[group];
    let hint = '';
    if (used >= cap && g.up) {
      const eq = KE.MODES[G.mode].equipment[g.up];
      const next = eq.levels[b.equipment[g.up] + 1];
      hint = next ? (g.up === 'cook' ? 'Yer açmak için Mobilya ve Dekor\'dan ocağı büyüt ya da kadrodan birini çıkar.' : 'Yer açmak için Mobilya ve Dekor\'dan salonu büyüt ya da kadrodan birini çıkar.') : 'Bu şube en büyük hâlinde: kadrodan birini çıkar ya da başka şubeye ata.';
    } else if (used >= cap) hint = 'Her şubede bir müdür olabilir. Yenisini almak için mevcut müdürü çıkar.';
    return { ok: used < cap, group, used, cap, hint };
  };
  KE.roleName = (G, s) => s.role === 'usta' ? KE.MODES[G.mode].cookRole : s.role === 'garson' ? (G.mode === 'doner' ? 'Komi' : 'Garson') : KE.ROLES[s.role].name;

  KE.randomMaster = function (G) {
    const mode = MODE(G);
    const prods = mode.products.map((p) => p.id);
    const n = pick([1, 1, 2, 2, 2, 3]);
    /** @type {Record<string, number>} */
    const spec = {};
    const lvl = KE.rand();
    for (let i = 0; i < n; i++) {
      const p = pick(prods);
      spec[p] = clamp(Math.round(rnd(1.6, lvl < 0.15 ? 5.4 : lvl < 0.5 ? 4.4 : 3.6)), 1, 5);
    }
    const gender = KE.rand() < 0.78 ? 'e' : 'k';
    const max = Math.max(...Object.values(spec));
    const role = max <= 2 && KE.rand() < 0.6 ? 'cirak' : 'usta';
    const taken = new Set(G.staff.map((x) => x.name.replace(/^Çırak /, '').replace(/ Usta$/, '')).concat((G.market || []).map((x) => x.name.replace(/^Çırak /, '').replace(/ Usta$/, ''))));
    let first = pick(KE.NAMES[gender]);
    for (let i = 0; i < 12 && taken.has(first); i++) first = pick(KE.NAMES[gender]);
    const s = KE.makeStaff(G, {
      name: role === 'cirak' ? 'Çırak ' + first : first + ' Usta', role, gender, spec,
      age: role === 'cirak' ? 'genc' : pick(['orta', 'orta', 'yasli', 'genc']),
      speed: rnd(0.8, 1.25), quality: rnd(0.6, 0.98), consistency: rnd(0.6, 0.97), waste: rnd(0.35, 1.1), teach: rnd(0.2, 0.95),
      trait: pick(['mukemmel', 'gosterisci', 'hizli', 'sabirli', 'huysuz', 'hevesli', 'sohbet', null])
    });
    s.fee = role === 'cirak' ? 0 : Math.round(s.wage * (0.3 + max * 0.18) / 500) * 500;
    return s;
  };
  KE.randomWorker = function (G, role) {
    const gender = KE.rand() < 0.6 ? 'e' : 'k';
    const first = pick(KE.NAMES[gender]);
    const s = KE.makeStaff(G, {
      name: first, role, gender, age: role === 'mudur' ? pick(['orta', 'yasli']) : pick(['genc', 'genc', 'orta']),
      speed: rnd(0.8, 1.25), friendly: rnd(0.3, 1), skill: rnd(0.3, 1), trait: pick(['sohbet', 'hizli', 'sabirli', 'huysuz', null, null])
    });
    const base = /** @type {number} */ (KE.ROLES[role].baseWage);
    s.wage = Math.max(KE.ECON.asgariBrut, Math.round(base * (0.85 + (role === 'mudur' ? s.skill : s.friendly) * 0.3) / 500) * 500);
    return s;
  };

  KE.refreshMarket = function (G) {
    const used = new Set(G.staff.map((s) => s.name));
    const tmpl = KE.MASTER_TEMPLATES[G.mode].filter((t) => !used.has(t.name) && t.role !== 'cirak');
    G.market = [];
    if (tmpl.length && KE.rand() < 0.7) {
      const t = pick(tmpl);
      const s = KE.makeStaff(G, Object.assign({}, t, { role: 'usta' }));
      const max = Math.max(...Object.values(s.spec));
      s.fee = Math.round(s.wage * (0.3 + max * 0.18) / 500) * 500;
      G.market.push(s);
    }
    while (G.market.length < 5) G.market.push(KE.randomMaster(G));
  };
  KE.refreshWorkers = function (G) {
    G.workers = [];
    ['kasiyer', 'garson', 'garson', 'kurye', 'temizlik', 'mudur', 'kasiyer', 'kurye'].forEach((r) => G.workers.push(KE.randomWorker(G, r)));
  };

  KE.gainXp = function (s, pid, amt) {
    if (!amt) return false;
    const cur = s.spec[pid] || 0;
    if (cur >= 5) return false;
    s.xp[pid] = (s.xp[pid] || 0) + amt;
    const need = KE.STAR_NEED[cur + 1];
    if (s.xp[pid] >= need) { s.xp[pid] -= need; s.spec[pid] = cur + 1; s.levelUps = (s.levelUps || []).concat([{ pid, star: cur + 1 }]); return true; }
    return false;
  };
})();
