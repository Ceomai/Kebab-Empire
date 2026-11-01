/* Kebab Empire — arayüz: ana menü: şehir haritası ve sağ panel. */
(function () {
  const UI = KE.UI, H = UI.H, SCREENS = UI.SCREENS, A = UI.A, C = UI.C;
  const { esc, IC, MODE, B } = H;

  /* ---------- Harita: sağ panel (hedef halkası, saate göre işler, yerler) ---------- */
  function cityTasks() {
    const out = [];
    const b = B();
    const add = (id, title, sub, when, urgent) => { if (!out.some((t) => t.id === id)) out.push({ id, title, sub, when, urgent }); };
    if (KE.G.cash < 0) add('banka', 'Kasa eksiye düştü', 'Kredi teklifine bak, maaşlar gecikmesin', 'now', true);
    const noCook = KE.G.branches.filter((x) => !KE.branchStaff(KE.G, x).some(KE.isCook));
    if (noCook.length) add('lonca', 'Ustasız şube var', `${noCook.map((x) => x.name).join(', ')} bugün kapalı kalır`, 'now', true);
    if (KE.G.phase === 'morning' && b) {
      const M2 = MODE();
      const low = Object.entries(M2.ingredients).filter(([k]) => b.usage[k] > 0 && (b.stock[k] || 0) / b.usage[k] < 0.9).map(([, ing]) => ing.name);
      if (low.length) add('hal', 'Stok bir güne yetmiyor', low.slice(0, 3).join(', ') + (low.length > 3 ? '…' : ''), 'now', true);
    }
    if (KE.G.phase === 'service') {
      const tired = KE.G.staff.filter((s) => s.energy < 30 && s.pos !== 'mola');
      if (tired.length) add('buro', `${tired[0].name.split(' ')[0]} yoruldu`, tired.length > 1 ? `${tired.length} kişi dinlenmek istiyor` : 'Molaya gönder ya da yardımcı al', 'now');
    }
    const regs = (KE.G.regularVisits || []).filter((v) => !KE.G.live || !KE.G.live[v.branchId] || KE.G.live[v.branchId].minute < v.minute);
    if (regs.length) {
      const R0 = KE.REGULARS.find((r) => r.id === regs[0].rid);
      const hr = KE.OPEN_HOUR + regs[0].minute / 60;
      add('kahve', `${R0 ? R0.name : 'Bir müdavim'} bugün uğrayacak`, regs.length > 1 ? `${regs.length} müdavim bekleniyor, iyi ağırla` : 'Müdavimi memnun et, sadakati artsın', hr < 13 ? 'now' : hr < 17 ? 'pm' : 'eve');
      out[out.length - 1].time = KE.clock(regs[0].minute);
    }
    const sp = KE.specialDay(KE.G.day);
    if (sp && sp.id === 'mac') add('ajans', 'Akşam maç var', 'Kalabalık gelir; ekibi ve stoku hazırla', 'eve');
    if (sp && sp.id !== 'mac') add('ajans', sp.name, sp.desc, 'pm');
    let left = 99; for (let k = 0; k < 32; k++) if (KE.isMonthEnd(KE.G.day + k)) { left = k; break; }
    if (left <= 3) add('office', left ? `Ay sonuna ${left} gün` : 'Bugün ay sonu', 'Maaş, SGK ve kira ödenecek', 'eve');
    if (!KE.G.farm && KE.G.day >= 10 && KE.G.cash > 3000000) add('ciftlik', 'Çiftlik satılık', 'Kendi etini yetiştir, maliyet düşsün', 'pm');
    const ord = { now: 0, pm: 1, eve: 2 };
    return out.slice(0, 4).sort((a, c) => ord[a.when] - ord[c.when]).map((t, i) => Object.assign(t, { n: i + 1, color: KE.MAP.place(t.id).color }));
  }
  function mapOpts(tasks) {
    tasks = tasks || cityTasks();
    const TL = { now: 'Şimdi', pm: 'Öğleden sonra', eve: 'Akşam' };
    const fw = Math.max(320, window.innerWidth - (window.innerWidth > 1000 ? 380 : 0)), fh = Math.max(600, window.innerHeight - 128);
    const phone = window.innerWidth <= 760;
    return { fill: true, par: phone ? 'xMidYMid meet' : window.innerWidth > 1000 && fw / fh < 1400 / 860 ? 'xMidYMin meet' : 'xMidYMid slice', tasks: tasks.map((t) => ({ id: t.id, n: t.n, color: t.color, label: t.time || TL[t.when].replace('Öğleden sonra', 'Öğleden s.') })), route: UI.mapRoute || (tasks[0] && tasks[0].id) };
  }
  function goalRing() {
    const prog = KE.dailyProgress(KE.G, false);
    const live = KE.G.phase !== 'morning';
    const served = KE.G.live ? KE.G.branches.reduce((a, b) => a + (KE.G.live[b.id] ? KE.G.live[b.id].stats.served : 0), 0) : 0;
    const tips = KE.G.live ? KE.G.branches.reduce((a, b) => a + (KE.G.live[b.id] ? KE.G.live[b.id].stats.tips : 0), 0) : 0;
    const sg = prog.find((g) => g.kind === 'served');
    const exp = Math.round(KE.G.branches.reduce((a, b) => a + (KE.branchStaff(KE.G, b).some(KE.isCook) ? KE.expectedCustomers(KE.G, b) : 0), 0));
    const target = sg ? sg.target : exp;
    const val = live ? served : 0;
    const f = target ? Math.min(1, val / target) : 0;
    const R = 44, C = 2 * Math.PI * R;
    const done = prog.filter((g) => g.state === 'done').length;
    return `<div class="cp-goal"><svg viewBox="0 0 112 112" class="gring" aria-label="Günlük hedef ${val}/${target}"><circle cx="56" cy="56" r="${R}" fill="none" stroke="#efe0bf" stroke-width="12"/><circle cx="56" cy="56" r="${R}" fill="none" stroke="#ffc93c" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(C * f).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 56 56)"/><text x="56" y="58" text-anchor="middle" class="r1">${val}</text><text x="56" y="76" text-anchor="middle" class="r2">/ ${target}</text></svg>
      <div class="cp-stats"><span class="k">${live ? 'Bugün' : 'Beklenen'}</span>
        <div><i style="background:#3b8ee0"></i><span>Müşteri</span><b>${live ? served : exp}</b></div>
        <div><i style="background:#2ecc71"></i><span>Bahşiş</span><b>${live ? KE.tl(tips) : '—'}</b></div>
        <div><i style="background:#e8553d"></i><span>Hedefler</span><b>${done}/${prog.length || 0}</b></div></div></div>`;
  }
  function cityPanel(tasks) {
    const groups = [['now', 'Şimdi', '#e8553d'], ['pm', 'Öğleden sonra', '#16a085'], ['eve', 'Akşam', '#6c5fb0']];
    const clockNow = KE.G.phase === 'service' && KE.G.live && KE.G.live[KE.G.activeBranch] ? KE.clock(Math.min(KE.G.live[KE.G.activeBranch].minute, KE.MINUTES)) : KE.G.phase === 'closing' ? '23:00' : '08:30';
    const taskHtml = tasks.length ? groups.map(([k, l, c]) => {
      const ts = tasks.filter((t) => t.when === k); if (!ts.length) return '';
      return `<div class="cp-grp"><div class="cp-gh" style="--c:${c}"><i></i><span>${l}</span><em>${k === 'now' ? clockNow : ts[0].time || (k === 'pm' ? '14:00' : '19:00')}</em></div>
        ${ts.map((t) => { const p = KE.MAP.place(t.id); return `<button class="cp-task ${t.urgent ? 'urg' : ''} ${UI.mapRoute === t.id ? 'on' : ''}" data-a="go" data-s="${t.id}" data-route="${t.id}" style="--c:${t.color}"><span class="cp-ic">${IC(p.icon)}<b>${t.n}</b></span><span class="cp-tt"><b>${esc(t.title)}</b><small>${esc(t.sub)}</small></span>${t.urgent ? '<em class="cp-urg">Acil</em>' : ''}</button>`; }).join('')}</div>`;
    }).join('') : `<div class="cp-empty">${IC('check')}<span>Bugün acil bir iş yok. Dükkâna geçip kepengi aç ya da yerleri gez.</span></div>`;
    const act = KE.G.phase === 'morning' ? ['store', KE.G.branches.length > 1 ? 'Dükkâna geç, kepenkleri aç' : 'Dükkâna geç, kepengi aç'] : KE.G.phase === 'service' ? ['eye', 'Dükkâna bak'] : ['chart', 'Kapanış raporuna git'];
    return `<aside class="citypanel"><div class="cp-in">
      <div class="cp-head"><span class="kicker">${KE.weekday(KE.G.day)} · ${clockNow}</span><h2>${esc(B().name)}</h2></div>
      ${goalRing()}
      <div class="cp-sec">Yapılacaklar</div><div class="cp-tasks">${taskHtml}</div>
      <div class="cp-sec">Yerler</div>
      <div class="cp-places">${KE.MAP.PLACES.map((p) => { const t = tasks.find((x) => x.id === p.id); return `<button class="cp-pl" data-a="go" data-s="${p.id}" data-route="${p.id}" style="--c:${p.color}" title="${esc(p.name)}" aria-label="${esc(p.name)}">${IC(p.icon)}${t ? `<b>${t.n}</b>` : ''}</button>`; }).join('')}</div>
      <button class="btn big green block" data-a="go" data-s="shop">${IC(act[0])}${act[1]}</button>
    </div></aside>`;
  }
  SCREENS.map = () => {
    const tasks = cityTasks();
    return `<main class="mapscreen2"><div class="mapframe big" id="cityframe"></div>${cityPanel(tasks)}</main>`;
  };
  UI.mapRefresh = function () {
    const f = document.getElementById('cityframe');
    if (f) KE.MAP.update(f, mapOpts());
  };
  /* Haritayı yerleştir; telefonda aktif dükkânı ortala */
  UI.mapMount = function () {
    const f = document.getElementById('cityframe');
    if (!f) return;
    KE.MAP.mount(f, mapOpts());
    if (UI.a11y && UI.a11y.calm) f.querySelectorAll('svg').forEach((sv) => { if (/** @type {any} */ (sv).pauseAnimations) /** @type {any} */ (sv).pauseAnimations(); });
    if (f.scrollWidth > f.clientWidth + 4 && KE.G) {
      const P = KE.MAP.POS[B().district] || { x: 700, y: 430 };
      const sv = f.querySelector('svg');
      const k = sv.getBoundingClientRect().width / 1400;
      f.scrollLeft = Math.max(0, P.x * k - f.clientWidth / 2);
      f.scrollTop = Math.max(0, P.y * k - f.clientHeight / 2);
    }
  };
  let rsz = 0;
  window.addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(() => UI.mapRefresh(), 200); });
  document.addEventListener('mouseover', (e) => {
    const t = /** @type {any} */ (e.target).closest && /** @type {any} */ (e.target).closest('.citypanel [data-route]');
    if (!t || UI.mapRoute === t.dataset.route) return;
    UI.mapRoute = t.dataset.route;
    UI.mapRefresh();
  });

  Object.assign(H, { cityTasks, cityPanel });
})();
