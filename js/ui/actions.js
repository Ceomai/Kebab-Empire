/* Kebab Empire — arayüz: eylemler ve olay dinleyicileri. */
(function () {
  const UI = KE.UI, H = UI.H, SCREENS = UI.SCREENS, A = UI.A, C = UI.C;
  const { esc, clamp, IC, MODE, B, prod, pn, CL, track } = H;

  /* =================== EYLEMLER =================== */
  A.go = (d) => { const p = Object.assign({}, d); delete p.a; const s = p.s; delete p.s; UI.go(s, p); };
  A.newgame = () => { if (KE.G) UI.save(); KE.G = null; UI.ng = {}; UI.go('newMode'); };
  A.continue = () => { KE.G = UI.load(); if (!KE.G) { UI.toast('Kayıt bulunamadı.', 'bad'); return; } UI.go('map'); };
  A.pickMode = (d) => { readNg(); UI.ng.mode = d.m; UI.ng.masters = null; UI.ng.master = null; UI.render(); };
  A.ngStep = (d) => { readNg(); UI.go(d.to); };
  A.pickDistrict = (d) => { UI.ng.district = d.d; UI.render(); };
  A.pickMaster = (d) => { UI.ng.master = +d.i; UI.render(); };
  function readNg() { const o = document.getElementById('ng-owner'), s = document.getElementById('ng-shop'); if (o) UI.ng.owner = /** @type {HTMLInputElement} */ (o).value.trim(); if (s) UI.ng.shopName = /** @type {HTMLInputElement} */ (s).value.trim(); }
  A.startGame = () => {
    const ng = UI.ng;
    const m = ng.masters[ng.master];
    KE.G = KE.newGame({ tut: true, mode: ng.mode, district: ng.district, master: Object.assign({}, m.tmpl, { look: m.look, gender: m.gender, age: m.age }), owner: ng.owner || 'Patron', shopName: ng.shopName || null });
   
    track('game_start', { mode: KE.G.mode, district: KE.G.branches[0].district });
    UI.go('map');
    const usta = KE.G.staff[0];
    UI.modal(`<div class="evcard"><div class="ev-fig">${KE.figure(KE.staffLook(usta), { mood: 'happy', label: usta.name })}</div><div class="stack"><span class="kicker">Hikâye</span><h2>Babadan kalan dükkân</h2>
      <div class="journal">Babamın ${KE.district(B()).name}'deki küçük dükkânının anahtarını avucumda sıktım. Paslı kepengi kaldırdığımda içeri sabah güneşi doldu. ${esc(usta.name)} önlüğünü bağlarken gülümsedi: "Baban bu ocağın başında otuz yıl ekmek çıkardı. Biz de çıkaracağız." Kasada ${KE.tl(KE.G.cash)} var. Önce bir menü, sonra bir mahalle, sonra bütün şehir.</div>
      <ul class="chk"><li>${IC('map')}<span>Haritadaki binalara tıklayarak hal, muhasebe, usta pazarı ve çiftliğe gidersin.</span></li><li>${IC('users')}<span>Usta yalnızca pişirir. Kasa sipariş alır, komi/garson yemeği masaya götürür. Görevleri ve molaları sen ayarlarsın.</span></li><li>${IC('chart')}<span>Gün sonunda bahşişi dağıtır, ay sonunda bordroyu ve vergileri ödersin.</span></li></ul>
      <div class="acts"><button class="btn big green" data-a="closeModal">Haydi bismillah</button></div></div></div>`, { cls: 'event' });
  };
  A.closeModal = () => UI.closeModal();
  A.sound = (d, el) => { KE.SND.toggle(); el.innerHTML = IC(KE.SND.on ? 'sound' : 'mute'); el.classList.toggle('on2', KE.SND.on); el.setAttribute('aria-label', KE.SND.on ? 'Sesi kapat' : 'Sesi aç'); UI.toast(KE.SND.on ? 'Ses ve müzik açık.' : 'Ses kapalı.'); };
  A.menu = () => UI.modal(`<div class="mhead"><h2>Menü</h2><p class="muted">Oyun her gün sonunda bu tarayıcıya kaydedilir.</p></div>
    <div class="stack"><button class="btn green" data-a="saveNow">${IC('check')}Şimdi kaydet</button><div class="row"><button class="btn ghost grow" data-a="exportSave">${IC('arrow')}Dosyaya yedekle</button><button class="btn ghost grow" data-a="importSave">${IC('plus')}Dosyadan yükle</button></div><button class="btn ghost" data-a="lang">${IC('map')}Dil / Language</button><button class="btn ghost" data-a="privacy">${IC('lock')}Hesap ve gizlilik</button><button class="btn ghost" data-a="toTitle">${IC('arrow')}Ana menüye dön</button><button class="btn red" data-a="confirmNew">${IC('plus')}Yeni oyun başlat</button><button class="btn ghost" data-a="closeModal">Kapat</button></div>`);
  A.saveNow = () => { UI.save(); UI.closeModal(); UI.toast('Kaydedildi.', 'good'); };
  A.exportSave = () => { if (!KE.G) return; if (KE.G.phase === 'service') { UI.toast('Servis sırasında yedek alınamaz; gün bitince dene.', 'bad'); return; } KE.SAVE.exportFile(KE.G); UI.toast('Yedek dosyası indirildi.', 'good'); };
  A.importSave = () => {
    KE.SAVE.importFile().then((g) => { KE.G = g; UI.save(); UI.closeModal(); UI.go('map'); UI.toast(`${g.shopName} yüklendi · ${KE.dateStr(g.day)}`, 'good'); })
      .catch((e) => UI.toast(e.message, 'bad'));
  };
  A.toTitle = () => { UI.save(); UI.closeModal(); UI.go('title'); };
  A.confirmNew = () => { UI.closeModal(); UI.modal(`<div class="mhead"><h2>Emin misin?</h2><p>Yeni oyunun kurulumuna geçilecek. Kayıtlı oyunun, yeni oyunu başlatana kadar silinmez; kurulumdan vazgeçip devam edebilirsin.</p></div><div class="acts"><button class="btn ghost" data-a="closeModal">Vazgeç</button><button class="btn red" data-a="doNew">Yeni oyun kur</button></div>`); };
  A.doNew = () => { UI.save(); KE.G = null; UI.closeModal(); UI.ng = {}; UI.go('newMode'); };
  A.backToTitle = () => { UI.go('title'); };
  A.tutNext = () => { KE.G.tut++; if (KE.G.tut >= UI.TUT.length) track('tutorial_done', { day: KE.G.day }); UI.tutor(); };
  A.tutSkip = () => { track('tutorial_skip', { step: KE.G.tut }); KE.G.tut = 99; UI.tutor(); };
  A.pickOpt = (d) => { const o = UI.pickOptions[+d.i]; UI.closeModal(); if (H.pickCb) H.pickCb(o); };

  A.viewBranch = (d) => {
    if (KE.G.phase === 'service' && KE.G.live) KE.act(KE.G, 'active', d.id); else KE.G.activeBranch = d.id;
    if (['map', 'subeler', 'title'].includes(UI.screen)) UI.go('shop'); else UI.render();
  };
  A.openShop = () => {
    UI.dailyDone = null;
    if (!KE.G.branches.some((b) => KE.branchStaff(KE.G, b).some(KE.isCook))) { UI.toast('Hiçbir şubede usta yok. Usta Pazarı\'ndan birini işe al.', 'bad'); return; }
    UI.morningEnv = CL() && KE.CLOUD.ready ? JSON.parse(JSON.stringify(KE.SAVE.envelope(KE.G))) : null;
    KE.startService(KE.G);
    if (!KE.G.speed) KE.G.speed = 1;
    UI.render();
    UI.startLoop();
    const sp = KE.specialDay(KE.G.day);
    setTimeout(() => H.banner(sp ? sp.name + ' başladı!' : 'Kepenkler açıldı!'), 300);
  };
  A.speed = (d) => { KE.G.speed = +d.v; document.querySelectorAll('.speed button').forEach((x) => x.classList.toggle('on', +(/** @type {HTMLElement} */ (x)).dataset.v === KE.G.speed)); };
  A.setPos = (d) => {
    const s = KE.G.staff.find((x) => x.id === d.id);
    if (!s) return;
    const b = KE.G.branches.find((x) => x.id === s.branchId);
    const wasAuto = b.autoStaff && KE.G.phase === 'service';
    KE.act(KE.G, 'setPos', s.id, d.p);
    if (wasAuto) UI.toast('Görevleri elle ayarladın; otomatik ekip yönetimi kapatıldı.');
    UI.crewHover = 0;
    const cr = document.getElementById('crew');
    if (cr && KE.G.phase !== 'morning') cr.innerHTML = H.crewPanel(b, true); else UI.render();
  };
  A.tezgah = () => { const L = KE.G.live[KE.G.activeBranch]; KE.act(KE.G, 'ptoggle', !L.player.active); if (L.player.active) KE.act(KE.G, 'ptake'); H.renderTezgah(); UI.sceneTick(); };
  A.step = (d) => {
    const r = KE.act(KE.G, 'pstep', d.l);
    if (r.ok === false) { H.renderTezgah(); const box = document.getElementById('stepbtns'); if (box) { box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); } return; }
    if (r.done) KE.act(KE.G, 'ptake');
    H.renderTezgah(); UI.sceneTick();
  };
  A.fastForward = () => { KE.finishService(KE.G); UI.render(); H.showClosing(); };
  A.showClosing = () => H.showClosing();
  A.closeTab = (d) => { UI.closeTab = d.id; H.showClosing(); };
  A.tipToday = (d) => { UI.todayRule = d.r; H.showClosing(); };
  A.finalize = () => {
    const S0 = KE.G.lastSummary, morning = UI.morningEnv; UI.morningEnv = null;
    const out = KE.finalizeDay(KE.G, UI.todayRule);
    const tot = { served: 0, revenue: 0 }; Object.values(S0.branches).forEach((x) => { tot.served += x.stats.served; tot.revenue += x.stats.revenue; });
    track('day_end', { day: S0.day, served: tot.served, revenue: Math.round(tot.revenue), branches: KE.G.branches.length, rep: Math.round(KE.G.reputation) });
    if (morning && KE.CLOUD.ready) {
      const lg = (KE.G.actionLog || []).slice(-1)[0];
      KE.CLOUD.submitDay({ saveId: KE.G.saveId, day: S0.day, month: KE.monthKey(S0.day), mode: KE.G.mode, district: KE.G.branches[0].district, served: tot.served, revenue: tot.revenue, reputation: KE.G.reputation, morning, todayRule: UI.todayRule || KE.G.tipRule, log: lg && lg.day === S0.day ? lg.log : [] });
    }
    document.querySelectorAll('.modal-bg').forEach((m) => m.remove());
    UI.holdEvent = true;
    UI.go('shop');
    H.afterDay(out);
    (out.goals || []).forEach((g) => UI.toast('Hedef tamamlandı: ' + g.name, 'gold'));
  };
  A.closeAfterDay = () => { UI.render(); UI.closeModal(); };
  A.eventChoice = (d) => {
    const msg = KE.resolveEvent(KE.G, +d.i);
    UI.closeModal();
    UI.modal(`<div class="mhead"><span class="kicker">Sonuç</span><p class="lead">${esc(msg)}</p></div><div class="acts"><button class="btn green" data-a="closeModalRender">Tamam</button></div>`);
  };
  A.closeModalRender = () => { UI.render(); UI.closeModal(); };
  A.price = (d) => {
    const b = B(); const p = prod(d.p);
    const step = Math.max(5, Math.round(KE.marketPrice(KE.G, p) * 0.05 / 5) * 5);
    b.prices[d.p] = Math.max(5, b.prices[d.p] + step * +d.d);
    UI.render();
  };
  A.tier = (d) => { B().tier = +d.i; UI.render(); UI.toast('Tedarik kalitesi: ' + KE.TIERS[+d.i].name, 'good'); };
  A.stockLevel = (d) => { B().stockLevel = +d.v; UI.render(); };
  A.buy = (d) => { const c = KE.buyExtra(KE.G, B(), d.k, +d.q); UI.toast(`${KE.tl(c)} malzeme alındı.`); UI.render(); };
  A.hireMaster = (d) => {
    const s = KE.G.market.find((x) => x.id === d.id);
    if (!s) return;
    KE.G.cash -= s.fee || 0; if (s.fee) KE.addExtra(KE.G, 'other', s.fee);
    s.branchId = KE.G.activeBranch; s.hiredDay = KE.G.day; delete s.fee;
    KE.G.staff.push(s); KE.G.market = KE.G.market.filter((x) => x.id !== s.id);
    UI.toast(`${s.name} ekibe katıldı!`, 'good'); UI.render();
  };
  A.hireWorker = (d) => {
    const s = KE.G.workers.find((x) => x.id === d.id);
    if (!s) return;
    s.branchId = KE.G.activeBranch; s.hiredDay = KE.G.day;
    KE.G.staff.push(s); KE.G.workers = KE.G.workers.filter((x) => x.id !== s.id);
    UI.toast(`${s.name} işe başladı.`, 'good'); UI.render();
  };
  A.raise = (d) => { const s = KE.G.staff.find((x) => x.id === d.id); s.wage = Math.round(s.wage * 1.1 / 100) * 100; s.raisedDay = KE.G.day; s.morale = clamp(s.morale + 12, 0, 100); UI.toast(`${s.name}: "Sağ ol patron!" Yeni brüt: ${KE.tl(s.wage)}`, 'good'); UI.render(); };
  A.promote = (d) => { KE.G.flags.promoted = true; const s = KE.G.staff.find((x) => x.id === d.id); s.role = 'usta'; s.pos = 'ocak'; s.name = s.name.replace(/^Çırak /, '') + (s.name.includes('Usta') ? '' : ' Usta'); s.wage = Math.max(s.wage, KE.wageFor(s.spec, 'usta')); s.morale = clamp(s.morale + 25, 0, 100); s.mentorId = null; KE.checkGoals(KE.G).forEach((g) => UI.toast('Hedef tamamlandı: ' + g.name, 'gold')); UI.toast(`${s.name} artık usta!`, 'gold'); UI.render(); };
  A.pickMentor = (d) => {
    const s = KE.G.staff.find((x) => x.id === d.id);
    const ustas = KE.branchStaff(KE.G, KE.G.branches.find((x) => x.id === s.branchId)).filter((x) => x.role === 'usta');
    if (!ustas.length) { UI.toast('Bu şubede çırağa öğretecek usta yok.', 'bad'); return; }
    UI.picker(`${s.name} kimin yanında yetişsin?`, 'Çırak, mentorünün uzmanlıklarını her gün biraz öğrenir.', [{ id: null, label: 'Mentor yok', sub: 'Kendi başına öğrensin', sel: !s.mentorId }].concat(ustas.map((u) => ({ id: u.id, label: u.name, sub: `Öğretme ${Math.round(u.teach * 100)} · ${Object.entries(u.spec).map(([p, v]) => pn(p) + ' ★' + v).join(', ')}`, art: `<span class="avatar">${KE.portrait(KE.staffLook(u), { mood: 'happy' })}</span>`, sel: s.mentorId === u.id }))), (o) => { s.mentorId = o.id; if (o.id) UI.toast(`${s.name} artık ${o.label}'nın yanında.`, 'good'); UI.render(); });
  };
  A.pickTransfer = (d) => {
    const s = KE.G.staff.find((x) => x.id === d.id);
    UI.picker(`${s.name} hangi şubede çalışsın?`, null, KE.G.branches.map((b) => ({ id: b.id, label: b.name, sub: `${KE.district(b).name} · ${KE.branchStaff(KE.G, b).length} kişi`, art: `<span class="pick-store">${KE.ART.storefront('', '#d7263d', true)}</span>`, sel: b.id === s.branchId })), (o) => {
      if (o.id === s.branchId) return;
      s.branchId = o.id; s.mentorId = null; s.pos = KE.POSITIONS[s.role][0];
      KE.G.staff.forEach((x) => { if (x.mentorId === s.id) x.mentorId = null; });
      UI.toast(`${s.name} ${o.label} şubesine geçti.`); UI.render();
    });
  };
  A.fire = (d) => {
    const s = KE.G.staff.find((x) => x.id === d.id);
    UI.modal(`<div class="mhead"><h2>${esc(s.name)} işten çıkarılsın mı?</h2><p>İki haftalık brüt ücret ödenir: <b>${KE.tl(s.wage / 2)}</b>. Ekibin geri kalanının morali biraz düşer.</p></div><div class="acts"><button class="btn ghost" data-a="closeModal">Vazgeç</button><button class="btn red" data-a="doFire" data-id="${s.id}">İşten çıkar</button></div>`);
  };
  A.doFire = (d) => {
    const s = KE.G.staff.find((x) => x.id === d.id);
    KE.G.cash -= s.wage / 2; KE.addExtra(KE.G, 'other', s.wage / 2);
    KE.G.staff = KE.G.staff.filter((x) => x.id !== s.id);
    KE.G.staff.forEach((x) => { if (x.mentorId === s.id) x.mentorId = null; if (x.branchId === s.branchId) x.morale = clamp(x.morale - 4, 0, 100); });
    UI.closeModal(); UI.toast(`${s.name} ayrıldı.`); UI.render();
  };
  A.costume = (d) => {
    const s = KE.G.staff.find((x) => x.id === d.id); const c = KE.COSTUMES.find((x) => x.id === d.c);
    KE.G.cash -= c.cost; if (c.cost) KE.addExtra(KE.G, 'capex', c.cost);
    s.costume = c.id; s.morale = clamp(s.morale + c.morale, 0, 100);
    UI.toast(`${s.name} yeni kıyafetine bayıldı!`, 'good'); KE.checkGoals(KE.G); UI.render();
  };
  A.upgrade = (d) => {
    const b = B(); const eq = MODE().equipment[d.k]; const next = eq.levels[b.equipment[d.k] + 1];
    const cost = next.cost * KE.G.priceIndex;
    KE.G.cash -= cost; KE.addExtra(KE.G, 'capex', cost); b.equipment[d.k] += 1;
    if (KE.G.live && KE.G.live[b.id] && d.k === 'service') { const L = KE.G.live[b.id]; while (L.tables.length < KE.tableCount(KE.G, b)) L.tables.push({ id: L.tables.length, occ: null, dirty: false, by: null }); }
    UI.toast(`${next.name} kuruldu. Dükkân değişti!`, 'gold'); UI.render();
  };
  A.buyDecor = (d) => {
    const b = B(); const it = KE.DECOR.find((x) => x.id === d.id); const cost = it.cost * KE.G.priceIndex;
    KE.G.cash -= cost; KE.addExtra(KE.G, 'capex', cost); b.decor.push(it.id);
    if (it.id === 'dismasa' && KE.G.live && KE.G.live[b.id]) { const L = KE.G.live[b.id]; while (L.tables.length < KE.tableCount(KE.G, b)) L.tables.push({ id: L.tables.length, occ: null, dirty: false, by: null }); }
    const amb = KE.ambience(KE.G, b);
    UI.toast(amb.concept ? `Konsept açıldı: ${amb.concept.name}!` : `${it.name} yerleştirildi.`, amb.concept ? 'gold' : 'good');
    KE.checkGoals(KE.G); UI.render();
  };
  A.loan = (d) => { const o = KE.loanOffer(+d.amt, +d.m, 0.034); KE.G.loans.push({ amount: o.amount, monthly: o.monthly, remaining: o.months }); KE.G.cash += o.amount; UI.toast(`${KE.tl(o.amount)} hesabına geçti.`, 'good'); UI.render(); };
  A.payoff = (d) => { const l = KE.G.loans[+d.i]; const pay = Math.round(l.monthly * l.remaining * 0.93); KE.G.cash -= pay; KE.addExtra(KE.G, 'other', pay); KE.G.loans.splice(+d.i, 1); UI.toast('Kredi kapatıldı.', 'good'); UI.render(); };
  A.hygiene = (d) => { const b = KE.G.branches.find((x) => x.id === d.id); const c = 12000 * KE.G.priceIndex; KE.G.cash -= c; KE.addExtra(KE.G, 'other', c); b.cleanliness = clamp(b.cleanliness + 30, 0, 100); UI.toast('Dükkân pırıl pırıl.', 'good'); UI.render(); };
  A.campaign = (d) => {
    const c = H.CAMPAIGNS.find((x) => x.id === d.id); const b = B(); const cost = Math.round(c.cost * KE.G.priceIndex);
    KE.G.cash -= cost; KE.addExtra(KE.G, 'ads', cost);
    if (c.sign) { b.signBoost = 1.06; UI.toast('Yeni tabela gece gündüz parlıyor.', 'good'); UI.render(); return; }
    c.mods.forEach(([k, m]) => KE.G.mods.push({ key: k, mult: m, days: c.days, label: c.name, camp: c.id }));
    if (c.rep) { const best = Math.max(...MODE().products.map((p) => KE.bestStar(KE.G, b, p.id))); KE.G.reputation = clamp(KE.G.reputation + (best >= 4 ? 4 : 1), 0, 100); }
    UI.toast(`${c.name} başladı.`, 'good'); UI.render();
  };
  A.openBranch = (d) => { const b = KE.openBranch(KE.G, d.d); track('branch_open', { district: d.d, day: KE.G.day }); KE.G.activeBranch = b.id; KE.checkGoals(KE.G); UI.toast(`${b.name} açıldı! Şimdi usta ve ekip al.`, 'gold'); UI.render(); };
  A.central = () => { const c = 450000 * KE.G.priceIndex; KE.G.cash -= c; KE.addExtra(KE.G, 'capex', c); KE.G.centralKitchen = true; UI.toast('Merkezi mutfak kuruldu.', 'gold'); UI.render(); };
  A.tipRule = (d) => { KE.G.tipRule = d.r; UI.todayRule = null; if (KE.G.phase === 'closing' && document.querySelector('.tipbox')) H.showClosing(); else UI.render(); };
  A.buyFarm = () => { KE.buyFarm(KE.G); track('farm_buy', { day: KE.G.day }); KE.checkGoals(KE.G); UI.toast('Besi çiftliği artık senin!', 'gold'); UI.render(); };
  A.buyAnimal = (d) => { const c = KE.buyAnimals(KE.G, d.k); UI.toast(`${KE.FARM[d.k].name} alındı · ${KE.tl(c)}`, 'good'); UI.render(); };
  A.slaughter = (d) => { const r = KE.slaughter(KE.G, d.k); UI.toast(`${r.heads} ${KE.FARM[d.k].unit} kesimhaneye gitti: ${Object.values(r.got).map((v) => KE.num(v, 0) + ' kg').join(', ')}`, 'good'); UI.render(); };
  A.upgradePen = (d) => { KE.upgradePen(KE.G, d.k); UI.toast('Ağıl büyütüldü.', 'good'); UI.render(); };

  C.menuToggle = (el) => { B().menu[el.dataset.p] = el.checked; UI.render(); };
  C.priceSet = (el) => { const v = parseInt(el.value.replace(/\D/g, ''), 10); if (v > 0) B().prices[el.dataset.p] = v; UI.render(); };
  C.autoStaff = (el) => { const b = KE.G.branches.find((x) => x.id === el.dataset.b); KE.act(KE.G, 'autoStaff', b.id, el.checked); UI.toast(el.checked ? 'Otomatik ekip yönetimi açık.' : 'Ekibi artık sen yönetiyorsun.'); };
  C.farmAuto = (el) => { KE.G.farm.auto = el.checked; UI.render(); };

  document.addEventListener('click', (e) => {
    const el = /** @type {any} */ (e.target).closest('[data-a]');
    if (!el || el.disabled) return;
    const fn = A[el.dataset.a];
    if (fn) { e.preventDefault(); fn(Object.assign({}, el.dataset), el, e); }
  });
  document.addEventListener('pointerover', (e) => { if (/** @type {any} */ (e.target).closest && /** @type {any} */ (e.target).closest('#crew')) UI.crewHover = Date.now(); });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && /** @type {any} */ (e.target).matches && /** @type {any} */ (e.target).matches('g.place[data-a]')) { e.preventDefault(); const fn = A[/** @type {any} */ (e.target).dataset.a]; if (fn) fn(Object.assign({}, /** @type {any} */ (e.target).dataset)); }
    if (e.key === 'Escape' && document.querySelector('.modal-bg .acts [data-a="closeModal"]')) UI.closeModal();
  });
  document.addEventListener('change', (e) => {
    const el = /** @type {any} */ (e.target).closest('[data-c]');
    if (!el) return;
    const fn = C[el.dataset.c];
    if (fn) fn(el, e);
  });

  /* Dil seçimi */
  A.lang = () => {
    if (!KE.I18N) return;
    UI.closeModal();
    const cur = KE.I18N.lang;
    UI.picker('Dil / Language / Sprache', null, Object.entries(KE.I18N.langs).map(([k, v]) => ({ label: v, sub: k === 'tr' ? 'Asıl dil' : k === 'en' ? 'Kültürel terimler korunur (iftar, usta, döner)' : 'Kulturelle Begriffe bleiben erhalten', sel: k === cur, key: k })), (o) => { KE.I18N.set(o.key).then(() => UI.render()); });
  };
  /* İki cihaz: bulutta daha yeni ya da farklı bir kayıt varsa hangisiyle devam edileceğini sor */
  UI.checkCloud = async function () {
    const cl = CL(); if (!cl || !cl.ready || UI.cloudChecked) return;
    UI.cloudChecked = true;
    const r = await cl.loadSave(); if (!r || !r.save || !r.save.game) return;
    const local = KE.SAVE.read();
    const cg = r.save.game, lg = local && local.game;
    if (lg && lg.saveId === cg.saveId && lg.day >= cg.day) return;
    const card = (g, where, act) => `<button class="pickopt" data-a="${act}"><span class="po-t"><b>${esc(g.shopName || 'Kayıt')} · ${where}</b><small>${KE.dateStr(g.day)} · kasa ${KE.tl(g.cash)} · ${g.branches.length} şube</small></span></button>`;
    UI.pendingCloud = r.save;
    UI.modal(`<div class="mhead"><h2>${lg ? 'İki farklı kayıt var' : 'Bulutta kaydın var'}</h2><p class="muted">${lg ? 'Bu cihazdaki kayıt ile buluttaki kayıt farklı. Hangisiyle devam etmek istersin? Seçmediğin kayıt dosyaya yedeklenebilir.' : 'Başka bir cihazda oynadığın oyun bulutta duruyor.'}</p></div>
      <div class="pickgrid">${card(cg, 'bulut', 'useCloud')}${lg ? card(lg, 'bu cihaz', 'useLocal') : ''}</div>
      <div class="acts"><button class="btn ghost" data-a="closeModal">Şimdilik kapat</button></div>`);
  };
  A.useCloud = () => { try { const g = KE.SAVE.open(UI.pendingCloud); if (KE.G && KE.G.saveId !== g.saveId) KE.SAVE.exportFile(KE.G); KE.G = g; UI.save(); UI.closeModal(); UI.go('map'); UI.toast('Buluttaki oyun yüklendi.', 'good'); } catch (e) { UI.toast(e.message, 'bad'); } };
  A.useLocal = () => { const r = KE.SAVE.read(); UI.closeModal(); if (r) { KE.G = r.game; KE.CLOUD.queueSave(KE.SAVE.envelope(r.game)); KE.CLOUD.flushSave(); UI.toast('Bu cihazdaki kayıt buluta yazıldı.', 'good'); } };
  /* Hesap ve gizlilik */
  A.privacy = () => { UI.closeModal(); UI.privacyModal(false); };
  A.consentSave = async () => {
    const v = { cloud: /** @type {HTMLInputElement} */ (document.getElementById('cs-cloud')).checked, analytics: /** @type {HTMLInputElement} */ (document.getElementById('cs-an')).checked, name: /** @type {HTMLInputElement} */ (document.getElementById('cs-name')).value };
    try { await KE.CLOUD.setConsent(v); UI.closeModal(); UI.toast(v.cloud ? 'Bulut kaydı açık.' : 'Tercihin kaydedildi.', 'good'); if (v.cloud) { UI.cloudChecked = false; await UI.checkCloud(); } if (KE.G) UI.save(); } catch (e) { UI.toast('Bağlanılamadı: ' + e.message, 'bad'); }
  };
  A.consentNone = async () => { await KE.CLOUD.setConsent({ cloud: false, analytics: false }); UI.closeModal(); };
  A.linkMail = async () => { const m = /** @type {HTMLInputElement} */ (document.getElementById('cs-mail')).value.trim(); if (!/^\S+@\S+\.\S+$/.test(m)) { UI.toast('Geçerli bir e-posta yaz.', 'bad'); return; } try { await KE.CLOUD.linkEmail(m); UI.toast('Onay bağlantısı e-postana gönderildi.', 'good'); } catch (e) { UI.toast(e.message, 'bad'); } };
  A.cloudLoad = async () => {
    const r = await KE.CLOUD.loadSave(); if (!r) { UI.toast('Bulutta kayıt yok.', 'bad'); return; }
    try { const g = KE.SAVE.open(r.save); KE.G = g; UI.save(); UI.closeModal(); UI.go('map'); UI.toast(`Buluttan yüklendi · ${KE.dateStr(g.day)}`, 'good'); } catch (e) { UI.toast(e.message, 'bad'); }
  };
  A.deleteData = () => { UI.closeModal(); UI.modal(`<div class="mhead"><h2>Bütün bulut verilerin silinsin mi?</h2><p>Bulut kaydın, sıralama sonuçların, istatistiklerin ve anonim hesabın kalıcı olarak silinir. Bu cihazdaki oyun kalır.</p></div><div class="acts"><button class="btn ghost" data-a="closeModal">Vazgeç</button><button class="btn red" data-a="deleteDataYes">Evet, sil</button></div>`); };
  A.deleteDataYes = async () => { try { await KE.CLOUD.deleteMyData(); UI.closeModal(); UI.toast('Bulut verilerin silindi.', 'good'); } catch (e) { UI.toast(e.message, 'bad'); } };
  UI.boot = function () { UI.go('title'); if (CL() && KE.CLOUD.needsConsent()) setTimeout(() => UI.privacyModal(true), 900); };
})();
