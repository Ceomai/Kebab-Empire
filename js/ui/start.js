/* Kebab Empire — arayüz: açılış ve yeni oyun ekranları. */
(function () {
  const UI = KE.UI, H = UI.H, SCREENS = UI.SCREENS, A = UI.A, C = UI.C;
  const { esc, IC, pn, stars, bar, moodCls } = H;

  /* =================== EKRANLAR =================== */

  function skyline(w, h, seed, col, hi) {
    let r = seed; const rnd = () => (r = r * 16807 % 2147483647) / 2147483647;
    let x = 0, d = '';
    while (x < w) {
      const t = rnd();
      if (t < 0.12) { const R = 26 + rnd() * 30; d += `<rect x="${x}" y="${h - 40}" width="${R * 2 + 20}" height="40"/><path d="M${x + 10} ${h - 40} a${R} ${R} 0 0 1 ${R * 2} 0z"/><rect x="${x + 8 + R - 2}" y="${h - 40 - R - 14}" width="4" height="14"/>`; d += `<rect x="${x - 4}" y="${h - 40 - R * 2.4}" width="7" height="${R * 2.4}"/><path d="M${x - 4} ${h - 40 - R * 2.4} l3.5 -16 l3.5 16z"/><rect x="${x + R * 2 + 18}" y="${h - 40 - R * 2.4}" width="7" height="${R * 2.4}"/><path d="M${x + R * 2 + 18} ${h - 40 - R * 2.4} l3.5 -16 l3.5 16z"/>`; x += R * 2 + 34; }
      else if (t < 0.18) { d += `<rect x="${x}" y="${h - 120}" width="26" height="120"/><path d="M${x - 3} ${h - 120} l16 -34 l16 34z"/>`; x += 34; }
      else { const bw = 22 + rnd() * 40, bh = 30 + rnd() * 70; d += `<rect x="${x}" y="${h - bh}" width="${bw}" height="${bh}" rx="2"/>`; if (rnd() < 0.5) d += `<path d="M${x - 2} ${h - bh} l${bw / 2 + 2} -${10 + rnd() * 8} l${bw / 2 + 2} ${10 + rnd() * 8}z"/>`; x += bw + 2 + rnd() * 6; }
    }
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g fill="${col}">${d}</g>${hi ? `<g fill="${hi}" opacity=".5">${d.replace(/<path[^>]*>/g, '')}</g>` : ''}</svg>`;
  }
  SCREENS.title = () => {
    const has = UI.hasSave();
    if (!UI.heroCast) {
      UI.heroCast = {
        usta: { look: Object.assign(KE.randomLook('e', 'orta'), { facial: 'gurbiyik', skin: '#d9a273', hairColor: '#2b1d14', head: 'none' }), region: 'Adana', costume: 'yoresel', role: 'usta' },
        komi: { look: Object.assign(KE.randomLook('k', 'genc'), { head: 'none', hair: 'topuz', skin: '#e8b98f' }), region: 'İstanbul', costume: 'markali', role: 'garson' },
        walkers: ['ogrenci', 'turist', 'aile', 'isci', 'gece', 'beyaz'].map((t) => KE.customerLook(t))
      };
    }
    const hc = UI.heroCast;
    return `<main class="title2">
      <div class="t-sky"><div class="t-rays"></div><div class="t-sun"></div></div>
      <div class="t-cloud c1"></div><div class="t-cloud c2"></div><div class="t-cloud c3"></div>
      <div class="t-sky-far">${skyline(1600, 220, 7, '#9cc9ea')}</div>
      <div class="t-sky-near">${skyline(1600, 200, 31, '#6aa2d3')}</div>
      <div class="t-sea"><div class="t-ferry"><svg viewBox="0 0 90 40" aria-hidden="true"><path d="M4 22 h82 l-10 14 h-62z" fill="#fff"/><rect x="18" y="8" width="54" height="14" rx="3" fill="#d7263d"/><rect x="40" y="0" width="8" height="10" fill="#2c3e50"/><g fill="#bde3f7"><rect x="23" y="12" width="7" height="6"/><rect x="34" y="12" width="7" height="6"/><rect x="49" y="12" width="7" height="6"/><rect x="60" y="12" width="7" height="6"/></g></svg></div><div class="t-gulls">⌒⌒ ⌒</div></div>
      <div class="t-street"><div class="t-walk w1">${KE.figure(hc.walkers[0], { pose: 'walk', mood: 'happy' })}</div><div class="t-walk w2">${KE.figure(hc.walkers[1], { pose: 'walk', mood: 'happy' })}</div><div class="t-walk w3">${KE.figure(hc.walkers[2], { pose: 'walk', mood: 'happy' })}</div><div class="t-walk w4">${KE.figure(hc.walkers[3], { pose: 'walk', mood: 'happy' })}</div></div>
      <div class="t-shop">
        <div class="t-store">${KE.ART.storefront('Kebab Empire', '#d7263d', true)}</div>
        <div class="t-doner">${KE.ART.doner('et')}</div>
        <div class="t-fig f1">${KE.figure(KE.staffLook(hc.usta), { mood: 'happy' })}</div>
        <div class="t-fig f2">${KE.figure(KE.staffLook(hc.komi), { mood: 'happy', tray: true, trayDish: KE.ART.dish('iskender') })}</div>
      </div>
      <div class="t-dish d1">${KE.ART.dish('adana')}</div><div class="t-dish d2">${KE.ART.dish('lahmacun')}</div><div class="t-dish d3">${KE.ART.dish('et_durum')}</div><div class="t-dish d4">${KE.ART.dish('kunefe')}</div>
      <div class="t-front">
        <div class="t-logo"><span class="t-mark">${KE.ART.logo()}</span><h1><span>Kebab</span><em>Empire</em></h1><span class="t-ribbon">Döner ve kebap işletme oyunu</span></div>
        <div class="t-cta">${has ? `<button class="btn big green" data-a="continue">${IC('play')}Devam et</button>` : ''}<button class="btn big ${has ? 'gold' : 'green'}" data-a="newgame">${IC('plus')}Yeni oyun</button><button class="btn big ghost round langbtn" data-a="lang" aria-label="Dil / Language" title="Dil / Language">${(KE.I18N ? KE.I18N.lang : 'tr').toUpperCase()}</button><button class="btn big ghost round" data-a="importSave" aria-label="Yedek dosyasından yükle" title="Yedek dosyasından yükle">${IC('arrow')}</button><button class="btn big ghost round" data-a="sound" aria-label="Ses">${IC(KE.SND.on ? 'sound' : 'mute')}</button></div>
        ${(() => { const h = UI.hall ? UI.hall() : []; return h.length ? `<div class="t-hall"><span class="kicker">${IC('crown')}Şeref kürsüsü</span>${h.slice(0, 3).map((x) => `<span><b>${esc(x.shop)}</b> · ${x.gen}. kuşak · ${x.days} günde imparator</span>`).join('')}</div>` : ''; })()}
      </div>
    </main>`;
  };

  function steps(n) {
    return `<ol class="steps">${['Mod', 'Semt', 'Usta'].map((l, i) => `<li class="${i + 1 < n ? 'done' : i + 1 === n ? 'on' : ''}"><i>${i + 1 < n ? '✓' : i + 1}</i>${l}</li>`).join('')}</ol>`;
  }
  SCREENS.newMode = () => {
    const ng = UI.ng;
    const card = (m) => {
      const M = KE.MODES[m];
      const dishes = M.products.slice(0, 5).map((p) => `<span>${KE.ART.dish(p.id)}</span>`).join('');
      const facts = m === 'doner'
        ? [['users', 'Kalabalık kuyruk, hızlı servis'], ['coin', 'Düşük kâr payı, çok müşteri'], ['queue', 'Öğrenci, işçi, gece çıkışı']]
        : [['table', 'Masaya oturan müşteri, uzun pişirme'], ['star', 'Yüksek hesap, yüksek bahşiş'], ['heart', 'Aileler, gurmeler, turistler']];
      return `<button class="modecard ${ng.mode === m ? 'sel' : ''}" data-a="pickMode" data-m="${m}">
        <div class="mc-art ${m}">${m === 'doner' ? KE.ART.doner('et') + KE.ART.doner('tavuk') : KE.ART.mangal(3) + '<span class="smoke s1"></span><span class="smoke s2"></span>'}</div>
        <div class="mc-body"><h3>${M.name}</h3><p>${M.tagline}</p><ul>${facts.map(([ic, t]) => `<li>${IC(ic)}${t}</li>`).join('')}</ul><div class="mc-dishes">${dishes}</div></div>
        ${ng.mode === m ? `<span class="mc-check">${IC('check')}</span>` : ''}</button>`;
    };
    const saved = UI.hasSave() && !ng.legacy ? KE.SAVE.read() : null;
    const lg = ng.legacy;
    return `<main class="screen narrow">${steps(1)}
      ${lg ? `<div class="note heirnote">${IC('users')}<span><b>${lg.gen}. kuşak.</b> ${esc(lg.from)} imparatorluğunun torunu olarak yeni bir mahallede başlıyorsun. ${lg.heirName ? esc(lg.heirName) + "'nın ustalığı ilk ustana geçecek." : ''} Rakip bu sefer daha güçlü.</span></div>` : ''}<div class="row between"><h1 class="stitle">Ne olacaksın?</h1><button class="btn sm ghost" data-a="backToTitle">${IC('arrow')}Ana menü</button></div>
      ${saved ? `<div class="note savednote">${IC('store')}<span><b>${esc(saved.game.shopName || 'Kayıtlı oyun')}</b> · ${KE.dateStr(saved.game.day)} kayıtlı duruyor. Yeni oyunu başlatana kadar silinmez; istersen geri dönüp devam edebilirsin.</span><button class="btn sm green" data-a="continue">${IC('play')}Kayıtlı oyuna dön</button></div>` : ''}
      <div class="modecards">${lg ? card(lg.mode) : card('doner') + card('kebap')}</div>
      <div class="panel formrow">
        <label class="field">Adın<input id="ng-owner" value="${esc(ng.owner || '')}" placeholder="Örn. Deniz" maxlength="24" autocomplete="off"></label>
        <label class="field grow">Dükkânının adı<input id="ng-shop" value="${esc(ng.shopName || '')}" placeholder="${ng.mode === 'kebap' ? 'Örn. Köz Ocakbaşı' : 'Örn. Yaprak Döner'}" maxlength="26" autocomplete="off"></label>
        <button class="btn big green" data-a="ngStep" data-to="newDistrict" ${ng.mode ? '' : 'disabled'}>Devam ${IC('play')}</button>
      </div></main>`;
  };

  SCREENS.newDistrict = () => {
    const ng = UI.ng;
    const d = KE.DISTRICTS.find((x) => x.id === ng.district);
    const mix = (dd) => Object.entries(dd.mix).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => `<span class="chip bl">${KE.CUSTOMER_TYPES[t].name}</span>`).join('');
    return `<main class="screen">${steps(2)}<div class="row between"><h1 class="stitle">İlk dükkânın hangi semtte?</h1><button class="btn sm ghost" data-a="ngStep" data-to="newMode">${IC('arrow')}Geri</button></div>
      <div class="pickmap">
        <div class="mapframe">${KE.MAP.render({ pick: true })}</div>
        <aside class="panel dcard">${d ? `<span class="kicker">${d.side} yakası · ${d.inspired} esintisi</span><h2>${d.name}</h2><p>${d.desc}</p>
          <div class="facts"><div><small>Aylık kira</small><b>${KE.tl(d.rent)}</b></div><div><small>Yaya trafiği</small><b>${d.traffic}</b></div><div><small>Rakip</small><b>${d.rivals}</b></div></div>
          <div><small class="muted">Baskın müşteri</small><div class="chips">${mix(d)}</div></div>
          <p class="small muted">Semt dükkânın görünümünü değiştirmez. Müşteri karışımını, kirayı ve rekabeti belirler.</p>
          <button class="btn big green block" data-a="ngStep" data-to="newMaster">Burada aç ${IC('play')}</button>`
          : `<span class="kicker">Haritadan seç</span><h2>Yedi semt, yedi ayrı müşteri</h2><p>Bir semtin üstüne tıkla. Öğrenci yokuşundan plaza öğle arasına, sahil ailelerinden tarihi çarşının turistlerine kadar her semtin derdi ayrı.</p>`}
          <div class="dlist">${KE.DISTRICTS.map((x) => `<button class="dl ${x.id === ng.district ? 'sel' : ''}" data-a="pickDistrict" data-d="${x.id}"><b>${x.name}</b><small>${KE.tl(x.rent)} · ${Object.entries(x.mix).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => KE.CUSTOMER_TYPES[t].name).join(', ')}</small></button>`).join('')}</div>
        </aside></div></main>`;
  };

  function statl(l, v) { return `<div class="statl"><span>${l}</span>${bar(v * 100, v < 0.5 ? 'crit' : v < 0.75 ? 'warn' : 'ok')}<b>${Math.round(v * 100)}</b></div>`; }
  function masterCard(s, opts) {
    opts = opts || {};
    const tr = KE.TRAITS[s.trait];
    const specs = Object.entries(s.spec).sort((a, b) => b[1] - a[1]);
    return `<article class="card person ${opts.sel ? 'sel' : ''}">
      <div class="pc-top"><div class="pc-fig">${KE.figure(KE.staffLook(s), { mood: KE.moodFromValue(s.morale), label: s.name })}</div>
        <div class="pc-id"><h3>${esc(s.name)}</h3><div class="chips"><span class="chip or">${s.role === 'cirak' ? 'Çırak' : 'Usta'}</span><span class="chip">${s.region}</span>${tr ? `<span class="chip gd" title="${esc(tr.desc)}">${tr.name}</span>` : ''}</div>
        ${opts.own ? `<div class="statl"><span>Moral</span>${bar(s.morale, moodCls(s.morale))}<b>${Math.round(s.morale)}</b></div>` : ''}
        <div class="specs">${specs.map(([pid, st]) => `<div class="spec">${KE.ART.dish(pid)}<span><b>${pn(pid)}</b>${stars(st)}${opts.own && st < 5 ? `<em class="xp">${bar((s.xp[pid] || 0) / KE.STAR_NEED[st + 1] * 100, 'thin')}</em>` : ''}</span></div>`).join('') || '<span class="muted small">Henüz uzmanlık yok</span>'}</div></div></div>
      <div class="pc-stats">${statl('Hız', (s.speed - 0.6) / 0.8)}${statl('Kalite', (s.quality + s.consistency) / 2)}${statl('Fire kontrol', 1.2 - s.waste)}</div>
      ${tr ? `<p class="small muted">${tr.desc}</p>` : ''}${opts.extra || ''}
      <div class="pc-foot"><div class="price"><b>${KE.tl(s.wage)}</b><small>brüt / ay${s.fee ? ` · transfer ${KE.tl(s.fee)}` : ''}</small></div><div class="row">${opts.actions || ''}</div></div>
    </article>`;
  }

  SCREENS.newMaster = () => {
    const ng = UI.ng;
    if (!ng.masters) {
      const t = KE.MASTER_TEMPLATES[ng.mode].filter((x) => x.role !== 'cirak').slice().sort(() => Math.random() - 0.5).slice(0, 3);
      const fakeG = { nextId: 900, day: 1, mode: ng.mode };
      ng.masters = t.map((x) => Object.assign(KE.makeStaff(fakeG, Object.assign({}, x, { role: 'usta' })), { tmpl: x }));
      /* yeni nesil: ustalar ailenin ocak bilgisini devralır */
      if (ng.legacy && ng.legacy.spec) ng.masters.forEach((m) => { m.spec = Object.assign({}, ng.legacy.spec); m.wage = KE.wageFor(m.spec, 'usta'); });
    }
    return `<main class="screen">${steps(3)}<div class="row between"><h1 class="stitle">Ocağın başına kim geçecek?</h1><button class="btn sm ghost" data-a="ngStep" data-to="newDistrict">${IC('arrow')}Geri</button></div>
      ${ng.legacy && ng.legacy.spec ? `<p class="note heirnote">${IC('star')}<span>Hangi ustayı seçersen seç, ${esc(ng.legacy.heirName || 'aile ustası')}'nın uzmanlıkları ona geçer.</span></p>` : ''}
      <p class="lead light">Usta yalnızca pişirir; uzman olduğu ürünü seven müşteriyi dükkâna çeker. Yanına bir çırak, bir kasiyer ve bir ${ng.mode === 'kebap' ? 'garson' : 'komi'} veriliyor.</p>
      <div class="grid g3">${ng.masters.map((s, i) => masterCard(s, { sel: ng.master === i, actions: `<button class="btn ${ng.master === i ? 'green' : ''}" data-a="pickMaster" data-i="${i}">${ng.master === i ? IC('check') + 'Seçildi' : 'Bu usta'}</button>` })).join('')}</div>
      <div class="row end"><button class="btn big green" data-a="startGame" ${ng.master == null ? 'disabled' : ''}>Kepengi kaldır ${IC('play')}</button></div></main>`;
  };

  Object.assign(H, { statl, masterCard });
})();
