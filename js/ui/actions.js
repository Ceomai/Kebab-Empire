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
    KE.G = KE.newGame({ tut: !ng.legacy, mode: ng.mode, district: ng.district, master: Object.assign({}, m.tmpl, { look: m.look, gender: m.gender, age: m.age }), owner: ng.owner || 'Patron', shopName: ng.shopName || null, legacy: ng.legacy || null });
   
    track('game_start', { mode: KE.G.mode, district: KE.G.branches[0].district });
    UI.go('map');
    const usta = KE.G.staff[0];
    UI.modal(`<div class="evcard"><div class="ev-fig">${KE.figure(KE.staffLook(usta), { mood: 'happy', label: usta.name })}</div><div class="stack"><span class="kicker">Hikâye</span><h2>Babadan kalan dükkân</h2>
      <div class="journal">Babamın ${KE.ek(KE.district(B()).name, 'de')}ki küçük dükkânının anahtarını avucumda sıktım. Paslı kepengi kaldırdığımda içeri sabah güneşi doldu. ${esc(usta.name)} önlüğünü bağlarken gülümsedi: "Baban bu ocağın başında otuz yıl ekmek çıkardı. Biz de çıkaracağız." Kasada ${KE.tl(KE.G.cash)} var. Önce bir menü, sonra bir mahalle, sonra bütün şehir.</div>
      <ul class="chk"><li>${IC('map')}<span>Haritadaki binalara tıklayarak hal, muhasebe ve usta pazarına gidersin. Merkez Ofis ve çiftlik ileriki dönemlerde açılır.</span></li><li>${IC('users')}<span>Usta yalnızca pişirir. Kasa sipariş alır, komi/garson yemeği masaya götürür. Görevleri ve molaları sen ayarlarsın.</span></li><li>${IC('chart')}<span>Gün sonunda bahşişi dağıtır, ay sonunda bordroyu ve vergileri ödersin.</span></li></ul>
      <div class="acts"><button class="btn big green" data-a="closeModal">Haydi bismillah</button></div></div></div>`, { cls: 'event' });
  };
  A.closeModal = () => UI.closeModal();
  A.soundMenu = () => { KE.SND.toggle(); UI.closeModal(); A.menu(); UI.toast(KE.SND.on ? 'Ses ve müzik açık.' : 'Ses kapalı.'); };
  A.sound = (d, el) => { KE.SND.toggle(); el.innerHTML = IC(KE.SND.on ? 'sound' : 'mute'); el.classList.toggle('on2', KE.SND.on); el.setAttribute('aria-label', KE.SND.on ? 'Sesi kapat' : 'Sesi aç'); UI.toast(KE.SND.on ? 'Ses ve müzik açık.' : 'Ses kapalı.'); };
  A.menu = () => UI.modal(`<div class="mhead"><h2>Menü</h2><p class="muted">Oyun her gün sonunda bu tarayıcıya kaydedilir.</p></div>
    <div class="stack"><button class="btn green" data-a="saveNow">${IC('check')}Şimdi kaydet</button><div class="row"><button class="btn ghost grow" data-a="exportSave">${IC('arrow')}Dosyaya yedekle</button><button class="btn ghost grow" data-a="importSave">${IC('plus')}Dosyadan yükle</button></div><button class="btn ghost" data-a="guide">${IC('book')}Oyun kılavuzu</button><button class="btn ghost" data-a="soundMenu">${IC(KE.SND.on ? 'sound' : 'mute')}${KE.SND.on ? 'Ses ve müzik açık · kapat' : 'Ses kapalı · aç'}</button><button class="btn ghost" data-a="guideLevel">${IC('bolt')}<span>Yönlendirme düzeyi:</span> <b>${({ cok: 'Çok', az: 'Az', kapali: 'Sessiz' })[UI.guideLevel()]}</b></button><button class="btn ghost" data-a="view">${IC('eye')}Görünüm ve yazı boyutu</button><button class="btn ghost" data-a="legal">${IC('lock')}Gizlilik ve koşullar</button><button class="btn ghost" data-a="lang">${IC('map')}Dil / Language</button><button class="btn ghost" data-a="privacy">${IC('lock')}Hesap ve gizlilik</button><button class="btn ghost" data-a="toTitle">${IC('arrow')}Ana menüye dön</button><button class="btn red" data-a="confirmNew">${IC('plus')}Yeni oyun başlat</button><button class="btn ghost" data-a="closeModal">Kapat</button></div>`);
  /* Yönlendirme düzeyi: yeni oyuncu her şeyi görür, deneyimli oyuncu yalnızca acil uyarıları */
  UI.guideLevel = () => { try { return localStorage.getItem('kebab-empire-guide') || 'cok'; } catch (e) { return 'cok'; } };
  A.guideLevel = () => UI.modal(`<div class="mhead"><h2>Yönlendirme düzeyi</h2><p class="muted">"Bugün ne yapmalıyım?" kartı ve öneriler ne kadar konuşsun?</p></div>
    <div class="choices">${[['cok', 'Çok', 'Bütün öneriler ve ipuçları (yeni başlayanlar için).'], ['az', 'Az', 'Yalnızca acil uyarılar: ustasız şube, boş kasa, eksik stok, eksi kasa.'], ['kapali', 'Sessiz', 'Danışman kartı gizlenir. Sabah kontrol listesi kalır.']].map(([k, l, d]) => `<button class="choice ${UI.guideLevel() === k ? 'sel' : ''}" data-a="setGuide" data-v="${k}"><b>${l}</b><small>${d}</small></button>`).join('')}</div>`);
  A.setGuide = (d) => { try { localStorage.setItem('kebab-empire-guide', d.v); } catch (e) { /* yok */ } UI.closeModal(); UI.render(); UI.toast(({ cok: 'Yönlendirme: Çok', az: 'Yönlendirme: Az', kapali: 'Yönlendirme: Sessiz' })[d.v]); };
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
    UI.dailyDone = null; UI.quickDayRun = false;
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
  A.midChoice = (d) => {
    const M = KE.act(KE.G, 'mid', +d.i);
    UI.closeModal();
    if (M) { const D = KE.MIDS.find((x) => x.id === M.id); UI.toast(D.choices(KE.G)[M.choice].label + '.', 'good'); }
    UI.render();
  };
  A.courier = (d) => {
    const c = KE.act(KE.G, 'courier', d.id || KE.G.activeBranch);
    UI.toast(c ? `Acil kurye yola çıktı: ${KE.tl(c)}. Biten malzemeler geldi.` : 'Kuryeye gerek yok.', c ? 'good' : '');
    UI.render();
  };
  A.fastForward = () => { KE.finishService(KE.G); UI.render(); H.showClosing(); };
  A.showClosing = () => H.showClosing();
  A.closeTab = (d) => { UI.closeTab = d.id; H.showClosing(); };
  A.tipToday = (d) => { UI.todayRule = d.r; H.showClosing(); };
  /* Günü kapat: hesap, bulut doğrulaması, ölçüm (normal kapanış ve hızlı hafta ortak) */
  function closeDayCore() {
    const S0 = KE.G.lastSummary, morning = UI.morningEnv; UI.morningEnv = null;
    const out = KE.finalizeDay(KE.G, UI.todayRule);
    const tot = { served: 0, revenue: 0 }; Object.values(S0.branches).forEach((x) => { tot.served += x.stats.served; tot.revenue += x.stats.revenue; });
    track('day_end', { day: S0.day, served: tot.served, revenue: Math.round(tot.revenue), branches: KE.G.branches.length, rep: Math.round(KE.G.reputation), era: KE.G.era || 1, gen: KE.G.gen || 1, rival: (KE.G.rival && KE.G.rival.stage) || 0, quick: !!UI.quickDayRun });
    if (morning && KE.CLOUD.ready) {
      const lg = (KE.G.actionLog || []).slice(-1)[0];
      KE.CLOUD.submitDay({ saveId: KE.G.saveId, day: S0.day, month: KE.monthKey(S0.day), mode: KE.G.mode, district: KE.G.branches[0].district, served: tot.served, revenue: tot.revenue, reputation: KE.G.reputation, morning, todayRule: UI.todayRule || KE.G.tipRule, log: lg && lg.day === S0.day ? lg.log : [], race: KE.G.race ? KE.G.race.week : null });
    }
    return out;
  }
  A.finalize = () => {
    const out = closeDayCore();
    document.querySelectorAll('.modal-bg').forEach((m) => m.remove());
    UI.holdEvent = true;
    UI.go('shop');
    if (UI.raceCheck()) return;
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
  A.pricesToMarket = () => { const b = B(); const M = MODE(); M.products.concat([M.drink]).forEach((p) => { if (b.prices[p.id] != null) b.prices[p.id] = KE.marketPrice(KE.G, p); }); UI.toast('Fiyatlar piyasa fiyatına çekildi.', 'good'); UI.render(); };
  A.tier = (d) => { B().tier = +d.i; UI.render(); UI.toast('Tedarik kalitesi: ' + KE.TIERS[+d.i].name, 'good'); };
  /* sabah verilen sipariş o güne hemen yansır */
  A.stockLevel = (d) => {
    B().stockLevel = +d.v;
    const c = KE.topUpToday(KE.G, B());
    if (c > 0) UI.toast(`Rıza bugün için ${KE.tl(c)} ek malzeme getirdi.`);
    UI.render();
  };
  A.topUpToday = (d) => {
    const b = d && d.id ? KE.G.branches.find((x) => x.id === d.id) : B();
    const c = KE.topUpToday(KE.G, b);
    UI.toast(c > 0 ? `${b.name}: bugünün ihtiyacı tamamlandı (${KE.tl(c)}).` : 'Stok bugüne zaten yetiyor.');
    UI.render();
  };
  A.buy = (d) => { const c = KE.buyExtra(KE.G, B(), d.k, +d.q); UI.toast(`${KE.tl(c)} malzeme alındı.`); UI.render(); };
  A.capFull = (d) => {
    const ch = KE.canHire(KE.G, B(), d.r);
    UI.modal(`<h2>${KE.STAFF_GROUPS[ch.group].name} kadrosu dolu (${ch.used}/${ch.cap})</h2><p>${ch.hint}</p><div class="row end"><button class="btn ghost" data-a="closeModal">Tamam</button>${KE.STAFF_GROUPS[ch.group].up ? '<button class="btn gold" data-a="goSheet" data-s="dekor">Mobilya ve Dekor</button>' : ''}<button class="btn red" data-a="goKadro" data-g="${ch.group}">Kadroya git</button></div>`);
  };
  A.goKadro = (d) => { UI.closeModal(); if (d.g === 'mutfak') UI.go('lonca', { tab: 'kadro' }); else { UI.go('buro'); setTimeout(() => { const e = document.getElementById('kadro'); if (e) e.scrollIntoView({ behavior: 'smooth' }); }, 60); } };
  A.hireMaster = (d) => {
    const s = KE.G.market.find((x) => x.id === d.id);
    if (!s) return;
    const ch = KE.canHire(KE.G, B(), s.role || 'usta');
    if (!ch.ok) { UI.toast(`Mutfak kadrosu dolu: ${ch.used}/${ch.cap}`, 'bad'); UI.toast(ch.hint); return; }
    KE.G.cash -= s.fee || 0; if (s.fee) KE.addExtra(KE.G, 'other', s.fee);
    s.branchId = KE.G.activeBranch; s.hiredDay = KE.G.day; delete s.fee;
    KE.G.staff.push(s); KE.G.market = KE.G.market.filter((x) => x.id !== s.id);
    UI.toast(`${s.name} ekibe katıldı!`, 'good'); UI.render();
  };
  A.hireWorker = (d) => {
    const s = KE.G.workers.find((x) => x.id === d.id);
    if (!s) return;
    const ch = KE.canHire(KE.G, B(), s.role);
    if (!ch.ok) { UI.toast(`${KE.STAFF_GROUPS[ch.group].name} kadrosu dolu: ${ch.used}/${ch.cap}`, 'bad'); UI.toast(ch.hint); return; }
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
    UI.picker(`${s.name} kimin yanında yetişsin?`, 'Çırak, mentorünün uzmanlıklarını her gün biraz öğrenir.', [{ id: null, label: 'Mentor yok', sub: 'Kendi başına öğrensin', sel: !s.mentorId }].concat(ustas.map((u) => ({ id: u.id, label: u.name, sub: `Öğretme ${Math.round(u.teach * 100)} · ${Object.entries(u.spec).map(([p, v]) => pn(p) + ' ★' + v).join(', ')}`, art: `<span class="avatar">${KE.portrait(KE.staffLook(u), { mood: 'happy' })}</span>`, sel: s.mentorId === u.id }))), (o) => { s.mentorId = o.id; if (o.id) UI.toast(`${s.name} artık ${KE.ek(o.label, 'in')} yanında.`, 'good'); UI.render(); });
  };
  A.pickTransfer = (d) => {
    const s = KE.G.staff.find((x) => x.id === d.id);
    UI.picker(`${s.name} hangi şubede çalışsın?`, null, KE.G.branches.map((b) => { const ch = KE.canHire(KE.G, b, s.role, s.id); return { id: b.id, label: b.name, disabled: b.id !== s.branchId && !ch.ok, sub: `${KE.district(b).name} · ${KE.STAFF_GROUPS[ch.group].name} ${ch.used}/${ch.cap}${b.id !== s.branchId && !ch.ok ? ' · dolu' : ''}`, art: `<span class="pick-store">${KE.ART.storefront('', '#d7263d', true)}</span>`, sel: b.id === s.branchId }; }), (o) => {
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
    if (!fn) return;
    e.preventDefault();
    if (KE.G && KE.G.phase === 'morning' && UNDOABLE.has(el.dataset.a)) snap(el);
    fn(Object.assign({}, el.dataset), el, e);
    UI.undoChip();
  });
  /* ---------- Geri al: sabah, kepenk açılmadan yapılan son işlem ---------- */
  const UNDOABLE = new Set(['setPos', 'boardDrop', 'topUpAll', 'price', 'pricesToMarket', 'tier', 'stockLevel', 'topUpToday', 'buy', 'hireMaster', 'hireWorker', 'raise', 'promote', 'pickMentor', 'doFire', 'costume', 'upgrade', 'buyDecor', 'hygiene', 'campaign', 'openBranch', 'central', 'buyAnimal', 'upgradePen', 'toggleManaged', 'donate', 'buyRes', 'toggleRes', 'advBol', 'advPrices', 'buyFarm', 'loan', 'payoff', 'tipRule']);
  function snap(el) {
    const who = el.dataset.a === 'boardDrop' && KE.G.staff.find((x) => x.id === UI.crewPick);
    const label = who ? who.name + ' → ' + KE.POS_NAMES[el.dataset.p] : String(el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 36);
    UI.undo = { g: JSON.stringify(KE.G), label, day: KE.G.day, cash: KE.G.cash };
  }
  UI.snapUndo = (label) => { if (KE.G && KE.G.phase === 'morning') UI.undo = { g: JSON.stringify(KE.G), label, day: KE.G.day }; };
  UI.undoChip = function () {
    let chip = document.getElementById('undochip');
    const u = UI.undo, G = KE.G;
    const ok = u && G && G.phase === 'morning' && G.day === u.day && UI.screen !== 'title' && JSON.stringify(G) !== u.g;
    if (!ok) { if (chip) chip.remove(); if (u && G && (G.phase !== 'morning' || G.day !== u.day)) UI.undo = null; return; }
    if (!chip) { chip = document.createElement('button'); chip.id = 'undochip'; chip.className = 'undochip'; chip.dataset.a = 'undo'; document.body.appendChild(chip); }
    chip.innerHTML = `${IC('arrow')}<span><b>Geri al</b>${u.label ? ' <small>· ' + esc(u.label) + '</small>' : ''}</span>`;
  };
  A.undo = () => {
    const u = UI.undo;
    if (!u || !KE.G || KE.G.phase !== 'morning' || KE.G.day !== u.day) { UI.undo = null; return; }
    KE.G = JSON.parse(u.g); UI.undo = null;
    UI.closeModal(); UI.render(); UI.toast('Son işlem geri alındı.', 'good');
  };
  document.addEventListener('pointerover', (e) => { if (/** @type {any} */ (e.target).closest && /** @type {any} */ (e.target).closest('#crew')) UI.crewHover = Date.now(); });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && /** @type {any} */ (e.target).matches && /** @type {any} */ (e.target).matches('g.place[data-a]')) { e.preventDefault(); const fn = A[/** @type {any} */ (e.target).dataset.a]; if (fn) fn(Object.assign({}, /** @type {any} */ (e.target).dataset)); }
    if (e.key === 'Escape' && document.querySelector('.modal-bg .acts [data-a="closeModal"]')) UI.closeModal();
  });
  document.addEventListener('change', (e) => {
    if (KE.G && KE.G.phase === 'morning' && /** @type {any} */ (e.target).dataset && /** @type {any} */ (e.target).dataset.c) { const t = /** @type {any} */ (e.target); UI.undo = { g: JSON.stringify(Object.assign({}, KE.G)), label: t.dataset.c === 'priceSet' ? 'fiyat değişikliği' : 'ayar', day: KE.G.day }; }
    const el = /** @type {any} */ (e.target).closest('[data-c]');
    if (!el) return;
    const fn = C[el.dataset.c];
    if (fn) fn(el, e);
  });

  /* Oyun sonu: Lüks Kebap'ı satın al */
  A.buyRival = () => {
    const st = KE.empireStatus(KE.G);
    if (!st.ready) return;
    UI.modal(`<div class="mhead"><span class="kicker">${IC('crown')} Son hamle</span><h2>"Lüks Kebap"a teklif ver</h2><p>Cüneyt Bey'in bütün zincirini ${KE.tl(st.price)} karşılığında satın alacaksın. Rakip ortadan kalkar, onun müşterileri sana gelir ve oyun "Kebap İmparatoru" unvanıyla devam eder.</p></div>
      <div class="acts"><button class="btn ghost" data-a="closeModal">Biraz daha bekle</button><button class="btn gold" data-a="buyRivalYes">${IC('crown')}Teklifi ver</button></div>`);
  };
  A.buyRivalYes = () => {
    const r = KE.buyRival(KE.G);
    UI.closeModal();
    if (!r.ok) { UI.toast(r.msg, 'bad'); return; }
    track('empire', { day: KE.G.day, branches: KE.G.branches.length, gen: KE.G.gen || 1 });
    UI.hallAdd(KE.G);
    UI.save(); UI.render();
    UI.empireEnding(r.life);
  };
  A.empireEnding = () => UI.empireEnding(KE.lifetime(KE.G));

  /* ---------- Şeref kürsüsü ve yeni nesil ---------- */
  const HALL_KEY = 'kebab-empire-hall';
  UI.hall = () => { try { return JSON.parse(localStorage.getItem(HALL_KEY) || '[]'); } catch (e) { return []; } };
  UI.hallAdd = function (G) {
    const h = UI.hall();
    if (h.some((x) => x.saveId === G.saveId)) return;
    h.unshift({ saveId: G.saveId, shop: G.shopName || G.branches[0].name, owner: G.owner, mode: G.mode, gen: G.gen || 1, days: G.day - 1, date: new Date().toISOString().slice(0, 10), duels: (G.rival && G.rival.wins) || 0, donated: (G.flags && G.flags.donated) || 0, stars: G.stars || 0 });
    try { localStorage.setItem(HALL_KEY, JSON.stringify(h.slice(0, 20))); } catch (e) { /* yok */ }
  };
  A.newGeneration = () => {
    const G = KE.G;
    const heir = G.staff.filter((s) => s.role === 'usta').sort((a, c) => Object.values(c.spec).reduce((x, y) => x + y, 0) - Object.values(a.spec).reduce((x, y) => x + y, 0))[0];
    const sig = G.signature && !G.signature.family ? G.signature : null;
    UI.closeModal();
    UI.modal(`<div class="mhead"><span class="kicker">${IC('users')} ${(G.gen || 1) + 1}. kuşak</span><h2>Yeni nesil</h2><p>İmparatorluk ${esc(G.shopName || G.branches[0].name)} adıyla şeref kürsüsüne yazılır. Torunun yeni bir mahallede, küçük bir dükkânla sıfırdan başlar.</p></div>
      <ul class="chk"><li>${IC('chef')}<span><b>Mirasın:</b> ${heir ? `${esc(KE.ek(heir.name, 'in'))} bütün uzmanlıkları ilk ustana geçer` : 'ailenin ocak bilgisi'}${sig ? `, aile tarifi ${esc(KE.MODES[G.mode].products.find((p) => p.id === sig.pid).name)} ilk günden menüde öne çıkar` : ''}.</span></li>
      <li>${IC('fire')}<span><b>Zorluk:</b> "Lüks Kebap" Cüneyt Bey'in oğluna geçti; rakip bu sefer daha güçlü başlar.</span></li>
      <li>${IC('lock')}<span>Kayıtlı oyunun silinmez; ana menüden yedeğini alabilirsin. Yeni nesli başlattığında kayıt yuvası yeni oyuna geçer.</span></li></ul>
      <div class="acts"><button class="btn ghost" data-a="closeModal">Vazgeç</button><button class="btn gold" data-a="newGenYes">${IC('play')}Yeni nesli başlat</button></div>`);
    UI.heir = { gen: (G.gen || 1) + 1, from: G.shopName || G.branches[0].name, owner: G.owner, spec: heir ? Object.assign({}, heir.spec) : null, heirName: heir ? heir.name : null, sigPid: sig ? sig.pid : null, mode: G.mode };
  };
  A.newGenYes = () => {
    const lg = UI.heir; if (!lg) return;
    UI.hallAdd(KE.G); UI.save();
    track('new_gen', { gen: lg.gen });
    KE.G = null; UI.closeModal();
    UI.ng = { mode: lg.mode, legacy: lg, owner: '', shopName: '' };
    UI.go('newMode');
  };

  /* ---------- Otomasyon ve büyük yatırımlar ---------- */
  A.quickDay = () => {
    const G = KE.G;
    if (G.phase !== 'morning') return;
    if (!G.branches.some((b) => KE.branchStaff(G, b).some(KE.isCook))) { UI.toast('Hiçbir şubede usta yok. Usta Pazarı\'ndan birini işe al.', 'bad'); return; }
    if (G.pendingEvent) { H.showEvent(); return; }
    UI.dailyDone = null;
    UI.morningEnv = H.CL() && KE.CLOUD.ready ? JSON.parse(JSON.stringify(KE.SAVE.envelope(G))) : null;
    KE.startService(G);
    KE.finishService(G);
    UI.quickDayRun = true;
    track('quick_day', { day: G.day });
    UI.go('shop');
    H.showClosing();
  };
  /* Geç oyun: bütün semtlerde şube açıldıktan sonra haftayı tek tuşla geç; önemli bir şey olursa durur */
  KE.quickWeekOpen = (G) => G.branches.length >= KE.DISTRICTS.length;
  A.quickWeek = () => {
    const G = KE.G;
    if (G.phase !== 'morning' || !KE.quickWeekOpen(G)) return;
    if (G.pendingEvent) { H.showEvent(); return; }
    const agg = { revenue: 0, net: 0, served: 0 };
    let n = 0, out = null, why = '';
    while (n < 7) {
      UI.morningEnv = H.CL() && KE.CLOUD.ready ? JSON.parse(JSON.stringify(KE.SAVE.envelope(G))) : null;
      UI.todayRule = null; UI.quickDayRun = true;
      KE.startService(G); KE.finishService(G);
      out = closeDayCore(); n++;
      Object.values(out.branches).forEach((e) => { agg.revenue += e.revenue; agg.net += e.net; agg.served += e.served; });
      if (out.quits.length) { why = `${out.quits[0].name} istifa etti.`; break; }
      if (out.eras && out.eras.length) { why = 'Yeni döneme geçtin!'; break; }
      if (out.inspect) { why = 'Rehber müfettişi geldi.'; break; }
      if (out.month) { why = 'Ay kapandı.'; break; }
      if (G.pendingEvent) { why = 'Bir karar seni bekliyor.'; break; }
      if (G.cash < 0) { why = 'Kasa eksiye düştü.'; break; }
      if (KE.isWeekEnd(G.day - 1)) break;
    }
    track('quick_week', { day: G.day, n });
    UI.holdEvent = true;
    UI.go('shop');
    H.afterDay(out);
    UI.toast(`${n} gün geçti: ${agg.served} müşteri, ciro ${KE.tl(agg.revenue)}, net ${KE.tl(agg.net)}.`, 'gold');
    if (why) UI.toast('Durdum: ' + why);
  };
  A.donate = (d) => { const r = KE.donate(KE.G, d.id); if (!r.ok) { UI.toast(r.msg, 'bad'); return; } const c = KE.CHARITY.find((x) => x.id === d.id); track('donate', { id: d.id, level: r.level, day: KE.G.day }); UI.toast(`${c.name}: seviye ${r.level}. Mahalle bunu konuşacak.`, 'gold'); UI.render(); };
  A.buyRes = (d) => { const b = KE.G.branches.find((x) => x.id === d.id); const r = KE.buyReservation(KE.G, b); if (!r.ok) { UI.toast(r.msg, 'bad'); return; } track('reservation', { day: KE.G.day }); UI.toast(`${b.name}: rezervasyon defteri hazır.`, 'gold'); UI.render(); };
  A.toggleRes = (d) => { const b = KE.G.branches.find((x) => x.id === d.id); if (!b || KE.G.phase !== 'morning') return; b.resOn = !KE.resOn(b); UI.toast(b.resOn ? `${b.name}: bugün rezervasyonla çalışıyor.` : `${b.name}: rezervasyon kapalı, kapı herkese açık.`); UI.render(); };
  /* ---------- Haftanın yarışı ---------- */
  const RACE_BEST = 'kebab-empire-race-best';
  const raceBest = () => { try { return JSON.parse(localStorage.getItem(RACE_BEST) || '{}'); } catch (e) { return {}; } };
  A.race = async () => {
    const week = KE.raceWeek(new Date()), R = KE.raceSetup(week), best = raceBest()[week];
    const cur = KE.SAVE.readRace(), going = cur && cur.race && cur.race.week === week && !KE.raceOver(cur);
    const masters = KE.MASTER_TEMPLATES[R.mode].filter((t) => t.role !== 'cirak');
    UI.modal(`<div class="mhead"><span class="kicker">${IC('target')}Haftanın yarışı · ${week}</span><h2>Herkes aynı dükkânla, aynı günlerle</h2>
      <p>Bu hafta bütün oyuncular aynı semtte, aynı ustayla, aynı tohumla <b>${KE.RACE_DAYS} gün</b> oynar: müşteriler, olaylar ve fiyatlar herkes için aynı gelir. Fark senin kararlarında. Puan: ${KE.RACE_DAYS} günün toplam cirosu.</p></div>
      <div class="chips"><span class="chip or">${R.mode === 'doner' ? 'Döner' : 'Kebap'}</span><span class="chip">${esc(KE.DISTRICTS.find((x) => x.id === R.district).name)}</span><span class="chip">${esc(masters.at(R.master).name)}</span>${best ? `<span class="chip gd">${IC('star')}En iyin: ${KE.tl(best)}</span>` : ''}</div>
      <p class="small muted">Yarış ayrı kaydedilir, ana oyununa dokunmaz.${H.CL() && KE.CLOUD.ready ? ' Bulut açık: günlerin sunucuda doğrulanır ve haftalık sıralamaya girer.' : ' Bulut kaydı kapalıysa puanın yalnızca bu cihazda tutulur.'}</p>
      <div id="raceboard" class="raceboard"></div>
      <div class="acts"><button class="btn ghost" data-a="closeModal">Kapat</button>${going ? `<button class="btn gold" data-a="raceContinue">${IC('play')}Devam et (${cur.day}. gün)</button>` : ''}<button class="btn green" data-a="raceStart">${IC('play')}${going ? 'Baştan başla' : 'Başla'}</button></div>`);
    const cl = KE.CLOUD;
    if (H.CL() && cl.ready && cl.raceBoard) {
      const rows = await cl.raceBoard(week);
      const el = document.getElementById('raceboard');
      if (el && rows.length) el.innerHTML = `<h4>Sıralama</h4><ol>${rows.map((r) => `<li class="${r.is_me ? 'me' : ''}"><b>${esc(r.display_name)}</b><span>${KE.tl(r.revenue)}</span><small>${r.days}/${KE.RACE_DAYS} gün</small></li>`).join('')}</ol>`;
    }
  };
  A.raceStart = () => {
    if (KE.G && !KE.G.race) UI.save();
    const owner = (KE.G && !KE.G.race && KE.G.owner) || (UI.hall()[0] || {}).owner || 'Patron';
    KE.G = KE.newRace(KE.raceWeek(new Date()), owner);
    UI.closeModal(); UI.save(); track('race_start', { week: KE.G.race.week });
    UI.go('shop'); UI.toast('Yarış başladı: 7 gün, puan toplam ciro.', 'gold');
  };
  A.raceContinue = () => { const g = KE.SAVE.readRace(); if (!g) return; if (KE.G && !KE.G.race) UI.save(); KE.G = g; UI.closeModal(); UI.go('shop'); };
  /* gün kapanınca: yarış bittiyse sonuç */
  UI.raceCheck = function () {
    const G = KE.G;
    if (!G || !KE.raceOver(G)) return false;
    const score = KE.raceScore(G), week = G.race.week, all = raceBest(), prev = all[week] || 0;
    if (score > prev) { all[week] = score; try { localStorage.setItem(RACE_BEST, JSON.stringify(all)); } catch (e) { /* yok */ } }
    track('race_end', { week, score });
    UI.modal(`<div class="mhead"><span class="kicker">${IC('target')}Haftanın yarışı · ${week}</span><h2>${KE.RACE_DAYS} gün bitti</h2><p class="lead">Toplam ciro: <b>${KE.tl(score)}</b>${score > prev ? (prev ? ` · yeni rekorun! (önceki ${KE.tl(prev)})` : ' · ilk puanın') : ` · en iyin ${KE.tl(prev)}`}</p></div>
      <div id="raceboard" class="raceboard"></div>
      <div class="acts"><button class="btn green" data-a="raceDone">${IC('arrow')}Ana menüye dön</button></div>`);
    const cl = KE.CLOUD;
    if (H.CL() && cl.ready && cl.raceBoard) cl.raceBoard(week).then((rows) => { const el = document.getElementById('raceboard'); if (el && rows.length) el.innerHTML = `<h4>Sıralama</h4><ol>${rows.map((r) => `<li class="${r.is_me ? 'me' : ''}"><b>${esc(r.display_name)}</b><span>${KE.tl(r.revenue)}</span><small>${r.days}/${KE.RACE_DAYS} gün</small></li>`).join('')}</ol>`; });
    return true;
  };
  A.raceDone = () => { KE.SAVE.clearRace(); KE.G = null; UI.closeModal(); UI.go('title'); };
  A.toggleManaged = (d) => { const b = KE.G.branches.find((x) => x.id === d.id); if (!b) return; b.managed = b.managed === false; UI.toast(b.managed ? `${b.name}: müdür sabah stok ve fiyatı kendisi ayarlayacak.` : `${b.name}: sabah ayarları artık sende.`); UI.render(); };
  A.signature = () => {
    const G = KE.G;
    const cur = G.signature && !G.signature.family ? G.signature : null;
    const go = (pid) => { const r = KE.startSignature(G, pid); if (!r.ok) { UI.toast(r.msg, 'bad'); return; } track('signature', { pid, level: G.sigWork.level }); UI.toast(`Ar-Ge mutfağı çalışıyor: ${KE.SIGNATURE.days} gün sonra hazır.`, 'good'); UI.render(); };
    if (cur) { go(cur.pid); return; }
    UI.picker('Hangi ürün imza tarifin olsun?', 'İmza tarif her şubede müşteriyi artırır ve o ürünü daha çok sattırır. Bir kez seçilir, sonra geliştirilir.', KE.MODES[G.mode].products.filter((p) => !KE.isLocked(G, p)).map((p) => ({ id: p.id, label: p.name, sub: 'Piyasa ' + KE.tl(KE.marketPrice(G, p)), art: `<span class="pick-dish">${KE.ART.dish(p.id)}</span>` })), (o) => go(o.id));
  };
  A.flagship = () => {
    const G = KE.G;
    UI.picker('Hangi şube amiral dükkân olsun?', `Amiral dükkân ${KE.tl(KE.flagshipCost(G))}: o şubeye +4 masa ve +1 ocak yeri, müşteriler %10 daha yüksek fiyata katlanır; o şubede müşteri +%15, zincirde +%5, semt şampiyonluğu çıtası 3 puan düşer.`, G.branches.map((b) => ({ id: b.id, label: b.name, sub: KE.district(b).name, art: `<span class="pick-store">${KE.ART.storefront('', '#d7263d', true)}</span>` })), (o) => { const r = KE.buildFlagship(G, o.id); if (!r.ok) { UI.toast(r.msg, 'bad'); return; } track('flagship', { day: G.day }); UI.toast(`${o.label} artık zincirin amiral dükkânı!`, 'gold'); if (UI.confetti) UI.confetti(); UI.render(); });
  };
  A.contract = (d) => {
    const G = KE.G;
    const o = KE.contractOffers(G).find((x) => x.id === d.id);
    if (!o) return;
    const opts = G.branches.filter((b) => KE.branchStaff(G, b).some(KE.isCook)).map((b) => ({ id: b.id, label: b.name, sub: `${KE.branchStaff(G, b).filter(KE.isCook).length} pişirmeci · ekip morali −${o.morale}`, art: `<span class="pick-store">${KE.ART.storefront('', '#d7263d', true)}</span>`, sel: b.id === G.activeBranch }));
    UI.picker(`${o.name}: hangi şube hazırlasın?`, `${o.qty} porsiyon ${KE.MODES[G.mode].products.find((p) => p.id === o.pid).name} · ödeme ${KE.tl(o.pay)} · malzeme ~${KE.tl(o.cost)}. Gün sonunda teslim edilir.`, opts, (b) => { const r = KE.acceptContract(G, o.id, b.id); if (!r.ok) { UI.toast(r.msg, 'bad'); return; } track('contract', { kind: o.kind, day: G.day }); UI.toast(`${o.name} anlaşması imzalandı; ${b.label} akşama teslim edecek.`, 'good'); UI.render(); });
  };
  UI.empireEnding = function (life) {
    const G = KE.G;
    const stat = (ic, l, v) => `<div class="kpi"><i>${IC(ic)}</i><span><small>${l}</small><b>${v}</b></span></div>`;
    const best = life.bestProduct ? (KE.MODES[G.mode].products.find((p) => p.id === life.bestProduct) || {}).name : null;
    UI.modal(`<div class="ending"><div class="end-crown">${IC('crown')}</div><span class="kicker">${KE.dateStr(G.flags.empire || G.day)}</span><h2>Şehrin Kebap İmparatoru</h2>
      <p class="end-story">Cüneyt Bey anahtarları masaya bıraktı: "Ocağın hakkını verdin." Babamdan kalan küçük dükkânın paslı kepengini kaldırdığım sabahtan bu yana ${life.days} gün geçti. Şimdi şehrin her semtinde tabelamız yanıyor; ustalarım, çıraklarım, mahallelim aynı sofrada. İmparatorluk kuruldu, ama ocak hiç sönmeyecek.</p>
      ${life.duels ? `<p class="end-duel">${IC('fire')}Cüneyt Bey'le ${life.duels + (life.duelsLost || 0)} hesaplaşmanın ${life.duels} tanesini sen kazandın.</p>` : ''}
      <div class="end-stats">${stat('chart', 'Toplam ciro', KE.tl(life.revenue))}${stat('users', 'Doyurulan müşteri', KE.num(life.served))}${stat('gift', 'Toplanan bahşiş', KE.tl(life.tips))}${stat('store', 'Şube', life.branches)}${stat('crown', 'Şampiyonluk tacı', life.crowns)}${best ? stat('star', 'En sevilen', `${esc(best)} · ${KE.num(life.bestCount)}`) : ''}</div>
      <div class="acts"><button class="btn ghost" data-a="newgame">${IC('plus')}Yeni imparatorluk kur</button><button class="btn gold" data-a="newGeneration">${IC('users')}Yeni nesil: ${(G.gen || 1) + 1}. kuşak</button><button class="btn big green" data-a="closeModal">${IC('play')}Oyuna devam et</button></div></div>`, { cls: 'endingmodal', wide: true });
    if (UI.confetti) { UI.confetti(); setTimeout(UI.confetti, 900); }
    if (KE.SND) KE.SND.play('goal');
  };
  /* Görünüm: yazı boyutu ve hareket */
  const A11Y_KEY = 'kebab-empire-a11y';
  UI.a11y = (() => { try { return JSON.parse(localStorage.getItem(A11Y_KEY) || '{}'); } catch (e) { return {}; } })();
  UI.applyA11y = function () {
    const z = UI.a11y.zoom || 1;
    document.documentElement.style.setProperty('--zoom', String(z));
    document.body.classList.toggle('zoomed', z !== 1);
    document.body.classList.toggle('calm', !!UI.a11y.calm);
  };
  A.view = () => {
    UI.closeModal();
    UI.picker('Görünüm', 'Yazı boyutu ve hareket ayarı. Seçim bu cihazda saklanır.', [
      { label: 'Normal yazı', sub: 'Varsayılan', key: 'z1', sel: (UI.a11y.zoom || 1) === 1 },
      { label: 'Büyük yazı', sub: '%15 daha büyük', key: 'z115', sel: UI.a11y.zoom === 1.15 },
      { label: 'Çok büyük yazı', sub: '%30 daha büyük', key: 'z13', sel: UI.a11y.zoom === 1.3 },
      { label: UI.a11y.calm ? 'Hareketleri aç' : 'Hareketleri azalt', sub: 'Bulut, dalga, zıplayan rozetler ve yürüyüş animasyonları', key: 'calm' }
    ], (o) => {
      if (o.key === 'calm') UI.a11y.calm = !UI.a11y.calm; else UI.a11y.zoom = { z1: 1, z115: 1.15, z13: 1.3 }[o.key];
      try { localStorage.setItem(A11Y_KEY, JSON.stringify(UI.a11y)); } catch (e) { /* yok */ }
      UI.applyA11y(); UI.render();
    });
  };
  /* Gizlilik ve kullanım koşulları (özet; tam metin docs/ klasöründe) */
  A.legal = () => {
    UI.closeModal();
    const mail = KE.CONTACT ? `<a href="mailto:${esc(KE.CONTACT)}">${esc(KE.CONTACT)}</a>` : 'oyunun yayın sayfasındaki iletişim adresi';
    UI.modal(`<div class="mhead"><h2>Gizlilik ve koşullar</h2></div><div class="stack legal">
      <h3>Gizlilik</h3>
      <p>Oyun varsayılan olarak hiçbir veri göndermez; kaydın yalnızca bu cihazda tutulur. Yazı tipleri ve bütün dosyalar oyunla birlikte gelir, üçüncü taraf sunuculara istek yapılmaz.</p>
      <p>Bulut kaydını açarsan anonim bir hesap oluşur; kaydın, takma adın ve gün sonuçların Avrupa Birliği'ndeki sunucularda tutulur. Kullanım istatistiklerine ayrıca izin verirsen hangi ekranların açıldığı gibi oyun içi olaylar kaydedilir ve 180 günde silinir. Hata raporları kişisel veri içermez.</p>
      <p>Menü → Hesap ve gizlilik ekranından rızalarını geri alabilir ve bütün bulut verilerini silebilirsin.</p>
      <h3>Kullanım koşulları</h3>
      <p>Kebab Empire ücretsiz bir eğlence oyunudur. Oyundaki semtler, kişiler, dükkânlar ve rakamlar kurgudur; vergi ve bordro hesapları gerçeğe yakın tahminlerdir, mali tavsiye değildir.</p>
      <p>Şehir sıralamasında hile yapmak, başkasını taklit eden ya da hakaret içeren takma ad kullanmak yasaktır; bu durumda sonuçlar ve hesap silinebilir.</p>
      <p>İletişim: ${mail}</p>
    </div><div class="acts"><button class="btn green" data-a="closeModal">Tamam</button></div>`);
  };
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
  UI.boot = function () { UI.applyA11y(); UI.go('title'); if (CL() && KE.CLOUD.needsConsent()) setTimeout(() => UI.privacyModal(true), 900); };
})();
