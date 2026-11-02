/* Kebab Empire — arayüz: çekirdek: durum, kayıt, rehber, bildirim, modal, yönlendirme, üst çubuk, ortak parçalar, grafikler.
   Diğer arayüz dosyaları paylaşılan parçalara KE.UI.H üzerinden erişir. */
(function () {
  /** @type {any} */
  const UI = KE.UI = {};
  /** @type {any} */
  const H = UI.H = {};
  /** @type {any} */
  const SCREENS = UI.SCREENS = {}, A = UI.A = {}, C = UI.C = {};
  UI.screen = 'title'; UI.params = {};
  const app = () => document.getElementById('app');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = KE.clamp;
  const IC = (n, c) => KE.ART.icon(n, c);
  UI.ng = {};
  const MODE = () => KE.MODES[KE.G ? KE.G.mode : UI.ng.mode];
  const B = () => KE.G.branches.find((b) => b.id === KE.G.activeBranch);
  const prod = (pid) => MODE().products.find((p) => p.id === pid) || (MODE().drink.id === pid ? MODE().drink : null);
  const pn = (pid) => (prod(pid) || { name: pid }).name;
  const stars = (n) => { n = Math.round(n || 0); let s = '<span class="stars" aria-label="' + n + ' yıldız">'; for (let i = 1; i <= 5; i++) s += `<i class="${i <= n ? 'on' : ''}">★</i>`; return s + '</span>'; };
  const roleName = (s) => KE.roleName(KE.G, s);
  const bar = (v, cls) => `<span class="gauge ${cls || ''}"><i style="width:${clamp(v, 0, 100)}%"></i></span>`;
  const moodCls = (v) => v < 35 ? 'crit' : v < 60 ? 'warn' : 'ok';
  const CL = () => (KE.CLOUD && KE.CLOUD.enabled ? KE.CLOUD : null);
  const track = (n, p) => { if (KE.CLOUD && KE.CLOUD.track) KE.CLOUD.track(n, p); };
  const avatar = (look, mood, label, size) => `<span class="avatar ${size || ''}">${KE.portrait(look, { mood, label })}</span>`;

  /* ---------- Kayıt (ayrıntılar save.js'te) ---------- */
  UI.save = function () {
    if (!KE.G || UI.staleTab) return;
    if (!KE.SAVE.write(KE.G) && KE.SAVE.lastError === 'stale' && !UI.staleTab) { UI.staleTab = true; UI.modal(`<div class="mhead"><h2>Oyun başka bir sekmede ilerledi</h2><p>Bu oyunun daha ileri bir günü kayıtlı. İlerlemen kaybolmasın diye bu sekme kayıt yapmıyor.</p></div><div class="acts"><button class="btn green" data-a="reloadTab">Güncel kaydı aç</button></div>`); return; }
    if (!KE.SAVE.write(KE.G) && KE.SAVE.lastError === 'quota' && !UI.quotaWarned) { UI.quotaWarned = true; UI.toast('Tarayıcı depolaması dolu; oyun kaydedilemedi. Menüden dosyaya yedekle.', 'bad'); }
  };
  /* Aynı oyun iki sekmede açıksa: başka sekme kaydı ilerletince bu sekme yazmayı bırakır ve uyarır
     (yoksa geride kalan sekme ilerlemeyi ezer) */
  window.addEventListener('storage', (e) => {
    if (e.key !== KE.SAVE.KEY || !e.newValue || !KE.G || KE.G.race || UI.staleTab) return;
    let env = null; try { env = JSON.parse(e.newValue); } catch (x) { return; }
    if (!env || env.tab === KE.SAVE.TAB) return;
    const other = env.game || {};
    /* yalnızca aynı oyun başka sekmede daha ileri bir güne taşındıysa bu sekme geride kalmıştır */
    if (other.saveId !== KE.G.saveId || !(other.day > KE.G.day)) return;
    UI.staleTab = true;
    UI.modal(`<div class="mhead"><h2>Oyun başka bir sekmede ilerledi</h2><p>Bu oyunu aynı anda başka bir sekmede ya da pencerede de oynuyorsun. İlerlemen kaybolmasın diye bu sekme artık kayıt yapmıyor.</p></div><div class="acts"><button class="btn green" data-a="reloadTab">Güncel kaydı aç</button></div>`);
  });
  UI.A.reloadTab = () => { try { location.reload(); } catch (x) { /* yok */ } };
  UI.load = function () {
    const r = KE.SAVE.read();
    if (!r) return null;
    if (r.warning) setTimeout(() => UI.toast(r.warning, 'bad'), 400);
    return r.game;
  };
  UI.hasSave = () => KE.SAVE.exists();

  /* ---------- İlk gün rehberi ---------- */
  const TUT = [
    { phase: 'morning', screen: 'map', sel: '.cp-goal', text: 'Burası şehir haritası, ana menün. Sağ üstte günün hedefi ve sayıları var.' },
    { phase: 'morning', screen: 'map', sel: '.cp-tasks', text: 'Yapılacaklar saate göre dizilir. Bir işe dokununca haritada dükkânından oraya rota çizilir; tıklayınca oraya gidersin.' },
    { phase: 'morning', screen: 'map', sel: '.cp-places', text: 'Hal, usta pazarı, banka… Şehirdeki bütün yerler burada. Numaralı olanlarda seni bekleyen iş var; kilitli olanlar ileriki dönemlerde açılır.' },
    { phase: 'morning', screen: 'map', sel: '.citypanel .btn.big', text: 'Şimdi dükkâna geçelim.' },
    { phase: 'morning', sel: '.daypanel', text: 'Her gün üç küçük hedefin ve bir bonus hedefin olur. Tutturdukça ek para ve itibar gelir.' },
    { phase: 'morning', sel: '.crewlist', text: 'Ekibin burada. Usta yalnızca pişirir; kasiyer sipariş alır, komi yemeği masaya götürür. Görevi bu düğmelerle değiştirirsin.' },
    { phase: 'morning', sel: '.dishgrid', text: 'Fiyatları buradan ayarla. Piyasanın çok üstü öğrenciyi ve işçiyi kaçırır.' },
    { phase: 'morning', sel: '[data-a="openShop"]', text: 'Hazırsan kepengi aç. Bütün şubeler aynı anda çalışır.' },
    { phase: 'service', sel: '.stagewrap', text: 'Müşteri kapıdan girer, kasada öder, usta pişirir, komi masaya götürür. Yemek bitince bahşiş kavanoza düşer.' },
    { phase: 'service', sel: '.st-hud', text: 'Yoğunluk göstergesi. Kırmızıya dönen yere bir kişi daha ver: kuyruk uzarsa kasaya, tabak beklerse servise.' },
    { phase: 'service', sel: '#crew', text: 'Yorulan çalışanı sakin saatte molaya gönder, yoğun saatte geri çağır. İstersen otomatik yönetimi açık bırak.' },
    { phase: 'service', sel: '#tezgahBtn', text: 'İstersen tezgâha geçip siparişleri kendin hazırlarsın: adımları doğru sırayla seç, hızlı ve hatasız olursa kalite artar.' },
    { phase: 'service', sel: '.speed', text: 'Hızı buradan ayarla. Gün bitince bahşişi nasıl dağıtacağını seçip günlüğünü okuyacaksın. Kolay gelsin!' }
  ];
  UI.TUT = TUT;
  UI.tutor = function () {
    document.querySelectorAll('.tut').forEach((x) => x.remove());
    document.querySelectorAll('.tut-hl').forEach((x) => x.classList.remove('tut-hl'));
    if (!KE.G || KE.G.tut == null || KE.G.tut >= TUT.length || document.querySelector('.modal-bg')) return;
    const st = TUT[KE.G.tut];
    if (st.phase !== KE.G.phase || UI.screen !== (st.screen || 'shop')) return;
    const el = document.querySelector(st.sel);
    if (!el) return;
    el.classList.add('tut-hl');
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const box = document.createElement('div');
    box.className = 'tut';
    box.innerHTML = `<div class="tut-in"><span class="kicker">İlk gün · ${KE.G.tut + 1}/${TUT.length}</span><p>${st.text}</p><div class="row end"><button class="btn xs ghost" data-a="tutSkip">Rehberi geç</button><button class="btn sm green" data-a="tutNext">${KE.G.tut === TUT.length - 1 ? 'Başlayalım' : 'Anladım'}</button></div></div>`;
    document.body.appendChild(box);
    const place = () => {
      if (!box.isConnected) return;
      const r = el.getBoundingClientRect();
      const bw = Math.min(340, window.innerWidth - 32);
      box.style.width = bw + 'px';
      let top = r.bottom + 12;
      if (top + box.offsetHeight > window.innerHeight - 10) top = Math.max(10, r.top - box.offsetHeight - 12);
      if (top < 10) top = Math.min(window.innerHeight - box.offsetHeight - 10, r.top + 12);
      box.style.top = top + 'px';
      box.style.left = Math.max(16, Math.min(window.innerWidth - bw - 16, r.left + r.width / 2 - bw / 2)) + 'px';
    };
    place(); setTimeout(place, 400);
  };
  window.addEventListener('resize', () => { if (document.querySelector('.tut')) UI.tutor(); });

  /* ---------- Bildirim ---------- */
  UI.toast = function (msg, kind) {
    const box = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.innerHTML = (kind === 'gold' ? IC('star') : kind === 'bad' ? IC('bolt') : IC('check')) + `<span>${esc(msg)}</span>`;
    box.appendChild(t);
    if (kind === 'gold' && UI.confetti) { UI.confetti(); KE.SND.play('goal'); }
    setTimeout(() => t.classList.add('out'), 3400);
    setTimeout(() => t.remove(), 3800);
  };

  /* ---------- Modal ---------- */
  let modalQueue = [];
  UI.modal = function (html, opts) {
    opts = opts || {};
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''} ${opts.cls || ''}" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(bg);
    const f = bg.querySelector('button, input');
    if (f) /** @type {HTMLElement} */ (f).focus({ preventScroll: true });
    return bg;
  };
  UI.closeModal = function () {
    const m = document.querySelectorAll('.modal-bg');
    if (m.length) m[m.length - 1].remove();
    if (!document.querySelector('.modal-bg')) {
      if (modalQueue.length) modalQueue.shift()();
      else if (UI.holdEvent) { UI.holdEvent = false; if (KE.G && KE.G.pendingEvent && KE.G.phase === 'morning') H.showEvent(); }
      if (!document.querySelector('.modal-bg')) setTimeout(UI.tutor, 80);
    }
  };
  const queueModal = (fn) => { if (document.querySelector('.modal-bg')) modalQueue.push(fn); else fn(); };

  /* Seçici: select yerine kartlı seçim penceresi */
  H.pickCb = null;
  UI.picker = function (title, sub, options, cb) {
    H.pickCb = cb;
    UI.pickOptions = options;
    UI.modal(`<div class="mhead"><h2>${esc(title)}</h2>${sub ? `<p class="muted">${esc(sub)}</p>` : ''}</div>
      <div class="pickgrid">${options.map((o, i) => `<button class="pickopt ${o.sel ? 'sel' : ''}" data-a="pickOpt" data-i="${i}" ${o.disabled ? 'disabled' : ''}>${o.art || ''}<span class="po-t"><b>${esc(o.label)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</span>${o.sel ? `<span class="po-sel">${IC('check')}</span>` : ''}</button>`).join('')}</div>
      <div class="acts"><button class="btn ghost" data-a="closeModal">Vazgeç</button></div>`);
  };

  /* ---------- Yönlendirme ---------- */
  /* Telefonun geri tuşu / geri kaydırma: ekranlar tarayıcı geçmişine yazılır. Geri gelince önce açık
     pencere kapanır, sonra bir önceki ekrana dönülür; oyun sayfadan çıkmaz. */
  const histOk = (() => { try { return !!(window.history && history.pushState); } catch (e) { return false; } })();
  UI.go = function (s, p, o) {
    if (KE.G && KE.placeOpen && !KE.placeOpen(KE.G, s)) {
      const pl = KE.MAP.place(s);
      UI.toast(`${pl ? pl.name : 'Bu yer'} ${KE.PLACE_ERA[s]}. dönemde açılır.`, 'bad');
      return;
    }
    const prev = UI.screen;
    UI.screen = s; UI.params = p || {}; UI.render(); window.scrollTo(0, 0);
    if (!histOk || (o && o.pop)) return;
    const st = { ke: s, p: UI.params };
    try { if (prev === s || !history.state || !history.state.ke) history.replaceState(st, ''); else history.pushState(st, ''); } catch (e) { /* yok */ }
  };
  if (histOk) window.addEventListener('popstate', (e) => {
    const st = e.state;
    const m = document.querySelector('.modal-bg');
    const keep = () => { try { history.pushState({ ke: UI.screen, p: UI.params }, ''); } catch (x) { /* yok */ } };
    if (m) { if (m.querySelector('.acts [data-a="closeModal"], .sheet-x')) UI.closeModal(); keep(); return; }
    if (!KE.G || ['title', 'newMode', 'newDistrict', 'newMaster'].includes(UI.screen)) return;
    if (st && st.ke && SCREENS[st.ke]) { UI.go(st.ke, st.p, { pop: true }); return; }
    if (UI.screen !== 'map') { UI.go('map', {}, { pop: true }); keep(); } else keep();
  });
  UI.render = function () {
    const fn = SCREENS[UI.screen] || SCREENS.title;
    const inGame = KE.G && !['title', 'newMode', 'newDistrict', 'newMaster'].includes(UI.screen);
    app().innerHTML = (inGame ? topbar() : '') + fn();
    if (UI.screen === 'map') UI.mapMount();
    if (UI.screen === 'subeler') UI.fillRanking();
    if (KE.G && UI.lastTracked !== UI.screen) { UI.lastTracked = UI.screen; track('screen', { s: UI.screen, day: KE.G.day }); }
    if (UI.screen === 'shop' && KE.G && KE.G.phase !== 'morning') { KE.SCENE.reset(); if (KE.G.live) UI.sceneTick(true); H.renderTezgah(); }
    if (KE.G && KE.G.phase !== 'service') UI.save();
    if (inGame) setTimeout(UI.tutor, 60);
    if (inGame && !UI.holdEvent && KE.G.pendingEvent && KE.G.phase === 'morning' && !document.querySelector('.modal-bg')) H.showEvent();
    if (UI.undoChip) UI.undoChip();
    UI.layoutVars();
  };
  /* Telefon düzeni: üst çubuk ve alt sekme yüksekliği CSS'e aktarılır, harita ekranı tam bu kadar yer kaplar;
     servis sahnesi ekran genişliğine sığar */
  UI.layoutVars = function () {
    const r = document.documentElement.style;
    const tb = document.querySelector('.topbar'), tab = document.querySelector('.tabbar');
    r.setProperty('--tbh', (tb ? tb.getBoundingClientRect().height : 0) + 'px');
    const tabH = tab && getComputedStyle(tab).display !== 'none' && tab.getBoundingClientRect().width > tab.getBoundingClientRect().height ? tab.getBoundingClientRect().height : 0;
    r.setProperty('--tabh', tabH + 'px');
  };
  window.addEventListener('resize', () => UI.layoutVars());

  /* ---------- Üst çubuk ve şube şeridi ---------- */
  function topbar() {
    const hol = KE.holidayOf(KE.G.day);
    const phase = { morning: 'Sabah hazırlığı', service: 'Servis', closing: 'Kapanış' }[KE.G.phase];
    const rep = KE.G.reputation / 20;
    let st = '';
    for (let i = 0; i < 5; i++) st += `<i style="--f:${clamp(rep - i, 0, 1) * 100}%">★</i>`;
    const live = KE.G.live;
    const clock = KE.G.phase === 'service' && live && live[KE.G.activeBranch] ? KE.clock(Math.min(live[KE.G.activeBranch].minute, KE.MINUTES)) : KE.G.phase === 'closing' ? '23:00' : '08:30';
    const nav = [['map', 'map', 'Harita'], ['shop', 'store', 'Dükkân'], ['office', 'chart', 'Muhasebe']];
    return `<header class="topbar">
      <div class="tb-row">
        <button class="brand" data-a="go" data-s="map" aria-label="Haritaya dön">${KE.ART.logo()}<span>Kebab<b>Empire</b></span>${KE.G.flags && KE.G.flags.empire ? `<span class="brand-crown" title="Kebap İmparatoru">${IC('crown')}</span>` : ''}</button>
        ${KE.G.race ? `<div class="tb-race" title="Haftanın yarışı">${IC('target')}<b>Yarış</b><small>${Math.min(KE.G.day, KE.RACE_DAYS)}/${KE.RACE_DAYS}. gün</small></div>` : ''}
        <div class="tb-date"><span class="tb-day">${KE.dateStr(KE.G.day)}</span><span class="tb-sub">${KE.weekday(KE.G.day)}${hol ? ' · ' + hol : ''}</span></div>
        <div class="tb-clock ${KE.G.phase}">${IC('clock')}<b id="tb-clock">${clock}</b><span>${phase}</span></div>
        <div class="tb-money ${KE.G.cash < 0 ? 'neg' : ''}">${IC('coin')}<span class="tbm"><b>${KE.tl(KE.G.cash)}</b>${KE.G.phase === 'service' ? `<small id="tb-today">Bugün +${KE.tl(todayRevenue())}</small>` : ''}</span></div>
        <div class="tb-rep" title="İtibar ${Math.round(KE.G.reputation)}/100"><span class="repstars">${st}</span><small>İtibar ${Math.round(KE.G.reputation)}</small></div>
        <nav class="tb-nav">${nav.map(([s, ic, l]) => `<button class="navbtn ${UI.screen === s ? 'on' : ''}" data-a="go" data-s="${s}">${IC(ic)}<span>${l}</span></button>`).join('')}<button class="navbtn snd ${KE.SND.on ? 'on2' : ''}" data-a="sound" aria-label="${KE.SND.on ? 'Sesi kapat' : 'Sesi aç'}" title="${KE.SND.on ? 'Sesi kapat' : 'Sesi aç'}">${IC(KE.SND.on ? 'sound' : 'mute')}</button><button class="navbtn" data-a="menu" aria-label="Menü">${IC('menu')}</button></nav>
      </div>
      <div class="branchbar" role="tablist" aria-label="Şubeler">${branchTabs()}</div>
    </header>${tabbar()}`;
  }
  /* Telefon: alt sekme çubuğu (yatay ekranda sol şerit) */
  const PLACE_SCREENS = () => KE.MAP.PLACES.map((p) => p.id).filter((id) => id !== 'office');
  function tabbar() {
    const n = UI.cityTasks ? UI.cityTasks().length : 0;
    const inPlace = PLACE_SCREENS().includes(UI.screen);
    const t = (on, a, extra, ic, l, badge) => `<button class="tbb ${on ? 'on' : ''}" data-a="${a}" ${extra}>${IC(ic)}${badge ? `<b class="tbb-n">${badge}</b>` : ''}<span>${l}</span></button>`;
    return `<nav class="tabbar" aria-label="Gezinme">
      ${t(UI.screen === 'map', 'go', 'data-s="map"', 'map', 'Harita')}
      ${t(UI.screen === 'shop', 'go', 'data-s="shop"', 'store', 'Dükkân')}
      ${t(inPlace, 'places', '', 'pin', 'Yerler', n)}
      ${t(UI.screen === 'office', 'go', 'data-s="office"', 'chart', 'Muhasebe')}
      ${t(false, 'menu', '', 'menu', 'Menü')}
    </nav>`;
  }
  function branchTabs() {
    return KE.G.branches.map((b) => branchTab(b)).join('') + (KE.placeOpen(KE.G, 'subeler') && KE.G.branches.length < KE.DISTRICTS.length ? `<button class="btab add" data-a="go" data-s="subeler">${IC('plus')}<span>Şube aç</span></button>` : '');
  }
  /* Şube sağlığı: ekip, stok, fiyat için üç küçük renkli nokta */
  function health(b) {
    const G = KE.G, st = KE.branchStaff(G, b), L = G.live && G.live[b.id];
    const ys = G.lastSummary && G.lastSummary.branches && G.lastSummary.branches[b.id] && G.lastSummary.branches[b.id].stats;
    const lost = ys && ys.arrivals > 20 ? (ys.lostWait + ys.lostFull + ys.lostFood) / ys.arrivals : 0;
    const crew = !st.some(KE.isCook) ? ['r', 'Ustasız'] : lost >= 0.12 ? ['y', 'Ekip yetişmiyor'] : ['g', 'Ekip yeterli'];
    let stock;
    if (G.phase === 'service' && L) { const so = Object.keys(L.stats.stockouts).length; stock = so ? ['r', so + ' ürün bitti'] : ['g', 'Stok yeterli']; }
    else { const sh = G.phase === 'morning' && G.today && G.today[b.id] ? KE.shortfall(G, b) : { items: [] }; stock = sh.items.length > 2 ? ['r', 'Stok eksik'] : sh.items.length ? ['y', 'Stok az eksik'] : ['g', 'Stok yeterli']; }
    const r = KE.priceRatio(G, b), tol = KE.priceTolerance(G, b);
    const price = r > tol + 0.05 ? ['r', 'Fiyat pahalı'] : r < 0.95 ? ['y', 'Fiyat piyasanın altında'] : ['g', 'Fiyat dengede'];
    return `<span class="hdots">${[['users', crew], ['cart', stock], ['coin', price]].map(([, [c, t]]) => `<i class="hd ${c}" title="${t}"></i>`).join('')}</span>`;
  }
  function branchTab(b) {
    const L = KE.G.live && KE.G.live[b.id];
    const act = b.id === KE.G.activeBranch;
    let status = 'Hazırlık', dot = 'idle';
    if (KE.G.phase === 'service' && L) { if (L.closed) { status = 'Ustası yok, kapalı'; dot = 'off'; } else if (L.done) { status = 'Kapandı'; dot = 'off'; } else { status = `${L.queue.length} sırada · ${KE.tl(L.stats.revenue)}`; dot = L.queue.length > 5 ? 'busy' : 'open'; } }
    if (KE.G.phase === 'closing') { status = 'Kepenk indi'; dot = 'off'; }
    if (KE.isManaged(KE.G, b) && KE.G.phase === 'morning') status = 'Müdür hazırlıyor';
    return `<button class="btab ${act ? 'on' : ''}" role="tab" aria-selected="${act}" data-a="viewBranch" data-id="${b.id}"><span class="btab-art">${KE.ART.storefront('', act ? '#d7263d' : '#9a8b7a', KE.G.phase === 'service')}</span><span class="btab-t"><b>${esc(b.name)}${b.championUntil && KE.G.day <= b.championUntil ? ` <span class="crownic" title="Semt şampiyonu">${IC('crown')}</span>` : ''}</b><small><i class="dot ${dot}"></i>${status}</small></span>${KE.G.branches.length > 1 ? health(b) : ''}</button>`;
  }
  function todayRevenue() { return KE.G.live ? KE.G.branches.reduce((a, b) => a + (KE.G.live[b.id] ? KE.G.live[b.id].stats.revenue : 0), 0) : 0; }
  UI.refreshBars = function () {
    const td = document.getElementById('tb-today');
    if (td) { const t = 'Bugün +' + KE.tl(todayRevenue()); if (td.textContent !== t) { td.textContent = t; td.classList.remove('bump'); void td.offsetWidth; td.classList.add('bump'); } }
    const bb = document.querySelector('.branchbar');
    if (bb) bb.innerHTML = branchTabs();
    const m = document.querySelector('.tb-money b');
    if (m) m.textContent = KE.tl(KE.G.cash);
    const cb = document.getElementById('courierbox');
    if (cb) cb.innerHTML = UI.courierHtml();
  };
  /* Acil kurye: servis sırasında malzeme bitmek üzereyse (günde bir kez) */
  UI.courierHtml = function () {
    const G = KE.G, b = G.branches.find((x) => x.id === G.activeBranch), L = G.live && G.live[b.id];
    if (!L || L.done || G.phase !== 'service') return '';
    if (L.courier) return `<p class="tiny muted">${IC('truck')}Acil kurye bugün kullanıldı.</p>`;
    const n = KE.courierNeed(G, b);
    if (!n.cost) return '';
    const so = Object.keys(L.stats.stockouts).length;
    return `<div class="courier ${so ? 'urgent' : ''}"><small>${so ? `${so} ürün bitti.` : 'Bazı malzemeler bitmek üzere.'} Rıza'nın çırağı motorla getirebilir (normal fiyatın 1,5 katı).</small><button class="btn sm gold block" data-a="courier" data-id="${b.id}">${IC('truck')}Acil kurye · ${KE.tl(n.cost)}</button></div>`;
  };

  function npc(key, text) {
    const c = KE.CAST[key];
    return `<div class="npc"><div class="npc-fig">${KE.figure(c.look, { mood: 'happy', label: c.name })}</div>
      <div class="bubble"><span class="who">${c.name}<em>${c.role}</em></span>${esc(text || KE.line(key))}</div></div>`;
  }
  function npcMini(k) { return `<span class="avatar sm">${KE.portrait(KE.CAST[k].look, { mood: 'happy' })}</span>`; }
  function head(title, sub, extra, who) {
    const c = who && KE.CAST[who];
    const pl = KE.MAP.place(UI.screen);
    return `<div class="pagehead ${pl ? 'placehead' : ''}" ${pl ? `style="--pc:${pl.color}"` : ''}><button class="btn sm ghost" data-a="go" data-s="map">${IC('arrow')}Harita</button>${pl ? `<span class="ph-ic">${IC(pl.icon)}</span>` : ''}<div class="ph-t">${pl ? `<span class="kicker">${pl.group}</span>` : ''}<h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${extra || ''}${c ? `<div class="ph-npc"><div class="bubble"><span class="who">${c.name}</span>${esc(KE.line(who))}</div><span class="avatar lg">${KE.portrait(c.look, { mood: 'happy', label: c.name })}</span></div>` : ''}</div>`;
  }
  /* Günlük paragrafını cümle cümle sar (çeviri katmanı cümle kalıplarını tanısın) */
  const sentences = (txt) => String(txt || '').split(/(?<=[.!?…])\s+(?=[A-ZÇĞİÖŞÜ"“0-9])/).map((x) => `<span>${esc(x)}</span>`).join(' ');
  const morningOnly = () => KE.G.phase !== 'morning' ? `<div class="note">${IC('clock')}<span>Transfer, işten çıkarma ve şube açma sabah hazırlığında yapılır.</span></div>` : '';

  /* ---------- Grafikler ---------- */
  function lineChart(series, labels, opts) {
    opts = opts || {};
    const W = 640, H = opts.h || 220, pl = 58, pr = 14, pt = 12, pb = 26;
    const all = series.flatMap((s) => s.values);
    let max = Math.max(1, ...all), min = Math.min(0, ...all);
    const mag = Math.pow(10, Math.floor(Math.log10(max - min || 1)));
    max = Math.ceil(max / mag) * mag; min = Math.floor(min / mag) * mag;
    const n = labels.length;
    const x = (i) => pl + (n <= 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (n - 1));
    const y = (v) => pt + (H - pt - pb) * (1 - (v - min) / (max - min || 1));
    let g = '';
    for (let k = 0; k <= 4; k++) {
      const v = min + (max - min) * k / 4;
      g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${KE.num(Math.abs(max) >= 1000 ? v / 1000 : v)}${Math.abs(max) >= 1000 ? ' B' : ''}</text>`;
    }
    if (min < 0) g += `<line x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}" class="zero"/>`;
    const step = Math.max(1, Math.ceil(n / 8));
    labels.forEach((l, i) => { if (i % step === 0 || i === n - 1) g += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`; });
    series.forEach((s) => {
      if (!s.values.length) return;
      const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
      if (s.area) g += `<polygon points="${x(0)},${y(Math.max(0, min))} ${pts} ${x(s.values.length - 1)},${y(Math.max(0, min))}" fill="${s.color}" opacity=".14"/>`;
      g += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`;
      const li = s.values.length - 1;
      g += `<circle cx="${x(li)}" cy="${y(s.values[li])}" r="4.5" fill="${s.color}" stroke="#fff" stroke-width="2"/>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || 'grafik')}">${g}</svg>
      <div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`;
  }
  function barChart(values, labels, opts) {
    opts = opts || {};
    const W = 640, H = opts.h || 180, pl = 50, pr = 8, pt = 10, pb = 24;
    const max = Math.max(1, ...values);
    const n = values.length, bw = (W - pl - pr) / n;
    let g = '';
    for (let k = 0; k <= 3; k++) { const v = max * k / 3, yy = pt + (H - pt - pb) * (1 - k / 3); g += `<line x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}" class="grid"/><text x="${pl - 6}" y="${yy + 4}" text-anchor="end">${opts.money ? KE.num(v / 1000) + ' B' : KE.num(v)}</text>`; }
    const mi = values.indexOf(max);
    values.forEach((v, i) => {
      const h = (H - pt - pb) * Math.max(0, v) / max;
      g += `<rect x="${pl + i * bw + bw * 0.16}" y="${H - pb - h}" width="${bw * 0.68}" height="${h}" rx="4" fill="${i === mi ? '#d7263d' : (opts.color || '#f28c28')}"/>`;
      g += `<text x="${pl + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(labels[i])}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || 'grafik')}">${g}</svg>`;
  }
  function donut(parts, label) {
    const tot = parts.reduce((a, p) => a + Math.max(0, p.v), 0) || 1;
    let acc = 0, segs = '';
    const R = 54, C = 2 * Math.PI * R;
    parts.forEach((p) => { const f = Math.max(0, p.v) / tot; segs += `<circle cx="70" cy="70" r="${R}" fill="none" stroke="${p.c}" stroke-width="22" stroke-dasharray="${f * C} ${C}" stroke-dashoffset="${-acc * C}" transform="rotate(-90 70 70)"/>`; acc += f; });
    return `<div class="donut"><svg viewBox="0 0 140 140" role="img" aria-label="${esc(label)}">${segs}<text x="70" y="66" text-anchor="middle" class="d1">${esc(label)}</text><text x="70" y="84" text-anchor="middle" class="d2">${KE.tl(tot)}</text></svg>
      <ul>${parts.map((p) => `<li><i style="background:${p.c}"></i><span>${esc(p.l)}</span><b>${Math.round(Math.max(0, p.v) / tot * 100)}%</b></li>`).join('')}</ul></div>`;
  }

  Object.assign(H, { sentences, esc, clamp, IC, MODE, B, prod, pn, stars, roleName, bar, moodCls, CL, track, avatar, queueModal, npc, head, morningOnly, lineChart, barChart, donut });
})();
