/* Kebab Empire — arayüz: dükkân: sabah hazırlığı, canlı servis, tezgâh, kapanış, olay kartı. */
(function () {
  const UI = KE.UI, H = UI.H, SCREENS = UI.SCREENS, A = UI.A, C = UI.C;
  const { esc, IC, MODE, B, prod, pn, stars, roleName, bar, moodCls, avatar, queueModal, npc, donut, track } = H;

  /* ---------- Dükkân ---------- */
  SCREENS.shop = () => KE.G.phase === 'morning' ? morningView() : serviceView();

  function morningView() {
    const b = B(); const M = MODE();
    const st = KE.branchStaff(KE.G, b);
    const exp = KE.expectedCustomers(KE.G, b);
    const amb = KE.ambience(KE.G, b);
    const stations = KE.equip(KE.G, b, 'cook').stations;
    const cooks = st.filter(KE.isCook);
    const warn = [];
    if (!cooks.length) warn.push(['crit', 'Bu şubede usta yok. Usta Pazarı\'ndan birini al; ustasız şube bugün kapalı kalır.']);
    if (cooks.length > stations) warn.push(['warn', `${cooks.length} pişirmeci var ama ${stations} ocak yeri var. Fazlası mola dönüşümünde işe yarar.`]);
    if (st.length && !st.some((s) => s.pos === 'kasa')) warn.push(['crit', 'Kasada kimse yok. Kimse sipariş alamaz; bir kasiyer ya da garson/komiyi kasaya ver.']);
    if (st.length && !st.some((s) => s.pos === 'servis')) warn.push(['crit', 'Serviste kimse yok. Hazır yemekler tezgâhta soğur.']);
    if (b.cleanliness < 40) warn.push(['warn', 'Temizlik puanı düşük. Denetimde ceza riski var.']);
    if (KE.G.cash < 0) warn.push(['crit', 'Kasa eksiye düştü. Ay sonunda maaşlar gecikirse SGK teşviki kaybolur.']);
    const closedBranches = KE.G.branches.filter((x) => x.id !== b.id && !KE.branchStaff(KE.G, x).some(KE.isCook));
    if (closedBranches.length) warn.push(['warn', 'Ustasız şube bugün kapalı kalacak: ' + closedBranches.map((x) => esc(x.name)).join(', ')]);
    const low = Object.entries(M.ingredients).filter(([k]) => b.usage[k] > 0 && (b.stock[k] || 0) / b.usage[k] < 0.9).map(([, ing]) => ing.name);
    if (low.length) warn.push(['warn', `Stok bir günü karşılamıyor: ${low.join(', ')}. Hal'den ek alım yap ya da sabah siparişini "Bol" yap.`]);
    const dishCards = M.products.concat([M.drink]).map((p) => {
      const isDrink = p.id === M.drink.id;
      const mp = KE.marketPrice(KE.G, p), price = b.prices[p.id], cost = KE.productCost(KE.G, b, p);
      const best = isDrink ? null : KE.bestStar(KE.G, b, p.id);
      const recipeLock = !isDrink && KE.isLocked(KE.G, p);
      const locked = !isDrink && (recipeLock || (p.requiresSpec && best < 1));
      const on = isDrink || b.menu[p.id];
      const margin = (price / 1.1 - cost) / (price / 1.1);
      const ratio = price / mp;
      return `<article class="dishcard ${on && !locked ? '' : 'off'}">
        <div class="dc-art">${KE.ART.dish(p.id)}${!isDrink ? `<label class="switch" title="Menüde"><input type="checkbox" id="menu-${p.id}" data-c="menuToggle" data-p="${p.id}" ${b.menu[p.id] ? 'checked' : ''} ${locked ? 'disabled' : ''} aria-label="${p.name} menüde"><i></i></label>` : ''}</div>
        <div class="dc-b"><h4>${p.name}</h4>${isDrink ? '<small class="muted">Müşterilerin çoğu yanında alır</small>' : locked ? `<small class="lock">${IC('lock')}${recipeLock ? `İtibar ${p.unlock} olunca açılır` : 'Bu ürünü bilen usta yok'}</small>` : `<span class="dc-star">${stars(best)}<small>en iyi usta</small></span>`}
          <div class="stepper"><button data-a="price" data-p="${p.id}" data-d="-1" aria-label="Fiyatı düşür">${IC('minus')}</button><input id="price-${p.id}" value="${price}" data-c="priceSet" data-p="${p.id}" inputmode="numeric" aria-label="${p.name} fiyatı"><span>₺</span><button data-a="price" data-p="${p.id}" data-d="1" aria-label="Fiyatı artır">${IC('plus')}</button></div>
          <div class="chips"><span class="chip ${ratio > 1.15 ? 'rd' : ratio < 0.97 ? 'gr' : ''}">Piyasa ${KE.tl(mp)}${Math.abs(ratio - 1) >= 0.01 ? ` · ${ratio > 1 ? '+' : ''}${Math.round((ratio - 1) * 100)}%` : ''}</span><span class="chip ${margin < 0.45 ? 'or' : ''}">Kâr %${Math.round(margin * 100)}</span></div>
          </div></article>`;
    }).join('');
    return `<main class="screen">
      <div class="pagehead"><div class="ph-t"><span class="kicker">Sabah hazırlığı · ${KE.weekday(KE.G.day)}</span><h1>${esc(b.name)}</h1><p class="ph-facts"><span>${IC('map')}${KE.district(b).name}</span><span>${IC('users')}~${Math.round(exp)} müşteri</span><span>${IC('fire')}${Math.min(stations, cooks.length)}/${stations} ocak</span><span>${IC('table')}${KE.tableCount(KE.G, b)} masa</span>${amb.concept ? `<span>${IC('star')}${amb.concept.name}</span>` : ''}</p></div>
        <div class="row"><button class="btn ghost" data-a="quickDay" title="Servisi izlemeden günü tamamla">${IC('ff')}Hızlı gün</button><button class="btn big green" data-a="openShop">${IC('store')}${KE.G.branches.length > 1 ? 'Bütün şubelerde kepengi aç' : 'Kepengi aç'}</button></div></div>
      ${(() => { const sp = KE.specialDay(KE.G.day); return sp ? `<section class="special sp-${sp.theme || 'cuma'}"><span class="sp-badge">${IC(sp.id === 'mac' ? 'fire' : sp.id === 'cuma' ? 'users' : 'star')}</span><div><span class="kicker">Bugün özel gün</span><h2>${sp.name}</h2><p>${sp.desc}</p></div></section>` : ''; })()}
      ${(KE.G.daily || []).length ? `<section class="panel daypanel"><div class="sechead"><h2>Günün hedefleri</h2><span class="muted small">Tutturduğun her hedef ek para ve biraz itibar getirir.</span></div>${dailyHtml(false)}</section>` : ''}
      ${warn.length ? `<div class="alerts">${warn.map(([c, w]) => `<div class="alert ${c}">${IC(c === 'crit' ? 'bolt' : 'clock')}<span>${w}</span></div>`).join('')}</div>` : ''}
      <section class="panel"><div class="sechead"><h2>Ekip ve açılış görevleri</h2><button class="btn sm ghost" data-a="go" data-s="lonca">${IC('users')}Personeli yönet</button></div>
        ${crewPanel(b, false)}</section>
      <section class="panel"><div class="sechead"><h2>Menü ve fiyatlar</h2><span class="muted small">Fiyatlar KDV dahil. Pahalı fiyat öğrenci ve işçiyi kaçırır; gurmeler ve plaza çalışanları fiyata pek bakmaz.</span></div>
        <div class="dishgrid">${dishCards}</div></section>

    </main>`;
  }

  /* Günün hedefleri */
  function dailyHtml(live) {
    const list = live ? KE.dailyProgress(KE.G, false) : (KE.G.daily || []).map((g) => Object.assign({}, g, { p: 0, state: 'open' }));
    if (!list.length) return '';
    return `<div class="daily">${list.map((g) => `<div class="dg ${g.state} ${g.bonus ? 'bonus' : ''}"><i>${IC(g.state === 'done' || g.state === 'ok' ? 'check' : g.state === 'fail' ? 'bolt' : 'target')}</i><span><b>${g.text}</b>${live && ['served', 'tips', 'match', 'player'].includes(g.kind) ? bar(g.p * 100, g.state === 'done' ? 'ok' : 'or') : ''}</span><em>+${KE.tl(g.reward)}</em></div>`).join('')}</div>`;
  }

  /* Ekip paneli: görev seçimi (sabah ve servis) */
  const POS_IC = { ocak: 'fire', kasa: 'cash', servis: 'tray', temizlik: 'broom', paket: 'scooter', yonetim: 'chart', mola: 'pause' };
  function crewPanel(b, live) {
    const st = KE.branchStaff(KE.G, b);
    const mgr = st.find((s) => s.role === 'mudur');
    const L = KE.G.live && KE.G.live[b.id];
    const order = { usta: 0, cirak: 1, kasiyer: 2, garson: 3, temizlik: 4, kurye: 5, mudur: 6 };
    const cooking = live ? KE.cookingStaff(KE.G, b) : [];
    const rows = st.slice().sort((a, c) => order[a.role] - order[c.role]).map((s) => {
      const t = s.task;
      let act = s.pos === 'mola' ? 'Molada, dinleniyor' : t ? (KE.TASK_NAMES[t.type] + (t.type === 'cook' && L ? ': ' + pn((L.tickets.find((k) => k.id === t.ref) || {}).pid) : '')) : live ? 'Boşta' : 'Hazır';
      if (live && KE.isCook(s) && s.pos === 'ocak' && !cooking.includes(s)) act = 'Ocak yeri yok';
      return `<div class="crew ${s.pos === 'mola' ? 'resting' : ''}">
        <span class="avatar">${KE.portrait(KE.staffLook(s), { mood: KE.moodFromValue(s.morale), label: s.name })}</span>
        <div class="crew-id"><b>${esc(s.name)}</b><small>${roleName(s)} · <span class="act">${act}</span></small>
          <div class="crew-bars"><span title="Enerji ${Math.round(s.energy)}">${IC('bolt')}${bar(s.energy, s.energy < 25 ? 'crit' : s.energy < 50 ? 'warn' : 'ok')}</span><span title="Moral ${Math.round(s.morale)}">${IC('heart')}${bar(s.morale, moodCls(s.morale))}</span></div></div>
        <div class="seg" role="group" aria-label="${esc(s.name)} görevi">${KE.POSITIONS[s.role].map((p) => `<button class="${s.pos === p ? 'on' : ''}" data-a="setPos" data-id="${s.id}" data-p="${p}" title="${KE.POS_NAMES[p]}" aria-pressed="${s.pos === p}">${IC(POS_IC[p])}<span>${KE.POS_NAMES[p]}</span></button>`).join('')}</div>
      </div>`;
    }).join('');
    return `<div class="crewhead"><label class="switch lbl"><input type="checkbox" id="auto-${b.id}" data-c="autoStaff" data-b="${b.id}" ${b.autoStaff ? 'checked' : ''}><i></i><span><b>Otomatik ekip yönetimi</b><small>${mgr ? `Müdür ${esc(mgr.name)} yoğunluğa göre görev ve mola düzenler.` : KE.G.branches.length >= 2 ? 'Müdür yok: yalnızca bitkin düşenleri molaya gönderir. Görevleri sen ayarla.' : 'Bitkin düşenleri molaya gönderir. Görevleri sen ayarla.'}</small></span></label></div>
      <div class="crewlist">${rows || '<p class="muted">Bu şubede henüz kimse yok.</p>'}</div>`;
  }

  function serviceView() {
    const b = B();
    const closing = KE.G.phase === 'closing';
    const L = KE.G.live && KE.G.live[b.id];
    return `<main class="screen wide">
      <div class="servgrid">
        <div class="stagewrap">${KE.SCENE.html(KE.G, b)}<div id="tezgah"></div></div>
        <section class="panel crewcell"><div class="sechead"><h2>Ekip</h2></div><div id="crew">${crewPanel(b, true)}</div></section>
        <aside class="stack side">
          <div class="panel clockpanel"><div class="row between"><div><small class="muted">${esc(b.name)}</small><div class="bigclock" id="clock">${L ? KE.clock(Math.min(L.minute, KE.MINUTES)) : '23:00'}</div></div><div class="jar" title="Bahşiş kavanozu"><i id="jar"></i></div></div>
            ${closing ? `<button class="btn big green block" data-a="showClosing">${IC('chart')}Kapanış raporu</button>` : `<div class="speed seg" role="group" aria-label="Oyun hızı">${[[0, 'stop', 'Dur'], [1, 'play', '1×'], [2, 'ff', '2×'], [4, 'ff', '4×']].map(([v, ic, l]) => `<button class="${KE.G.speed === v ? 'on' : ''}" data-a="speed" data-v="${v}">${IC(ic)}<span>${l}</span></button>`).join('')}</div>`}
          </div>
          <div class="panel" id="livestats"></div>
          ${closing ? '' : `<div class="panel stack"><button class="btn gold block" id="tezgahBtn" data-a="tezgah">${IC('chef')}<span>${L && L.player.active ? 'Tezgâhtan çık' : 'Tezgâha geç'}</span></button><button class="btn sm ghost block" data-a="fastForward">${IC('ff')}Günü hızlı bitir</button></div>`}
          ${(KE.G.daily || []).length && !closing ? '<div class="panel"><h3>Günün hedefleri</h3><div id="dailylive"></div></div>' : ''}
          ${KE.G.branches.length > 1 ? '<div class="panel"><h3>Bütün şubeler</h3><div id="branchlive"></div></div>' : ''}
        </aside>
      </div></main>`;
  }

  /* ---------- Canlı döngü ---------- */
  let acc = 0, lastT = 0;
  UI.startLoop = function () {
    if (UI.timer) return;
    lastT = performance.now();
    UI.timer = setInterval(loop, 50);
  };
  function loop() {
    const now = performance.now();
    const dt = Math.min(200, now - lastT); lastT = now;
    if (!KE.G || KE.G.phase !== 'service' || !KE.G.live) return;
    if (document.querySelector('.modal-bg') || document.querySelector('.tut')) return;
    if (!KE.G.speed) return;
    acc += dt * KE.G.speed;
    let ticked = false;
    while (acc >= KE.MINUTE_MS) { acc -= KE.MINUTE_MS; KE.tickAll(KE.G); ticked = true; if (KE.allDone(KE.G)) break; }
    if (ticked) {
      const L = KE.G.live[KE.G.activeBranch];
      if (L && L.player.active && L.player.tid == null && KE.act(KE.G, 'ptake')) renderTezgah();
      UI.sceneTick();
    }
    if (KE.allDone(KE.G)) {
      KE.finishService(KE.G);
      UI.render();
      showClosing();
    }
  }
  let tickN = 0;
  UI.sceneTick = function (force) {
    if (!KE.G.live) return;
    const b = B(), L = KE.G.live[b.id];
    tickN++;
    if (force || tickN % 2 === 0) UI.refreshBars();
    const c = document.getElementById('tb-clock');
    if (c && L) c.textContent = KE.clock(Math.min(L.minute, KE.MINUTES));
    if (UI.screen === 'map') { if (force || tickN % 12 === 0) { UI.mapRefresh(); const cp = document.querySelector('.citypanel'); if (cp) cp.outerHTML = H.cityPanel(H.cityTasks()); } return; }
    if (UI.screen !== 'shop' || !L) return;
    KE.SCENE.update(KE.G, b, L);
    const rush = { 120: 'Öğle yoğunluğu başladı!', 540: 'Akşam yoğunluğu başladı!', 720: 'Son siparişler!' };
    Object.keys(rush).forEach((m) => { if (L.minute >= +m && (UI.lastMin == null || UI.lastMin < +m) && UI.lastMinB === b.id) banner(rush[m]); });
    UI.lastMin = L.minute; UI.lastMinB = b.id;
    const ck = document.getElementById('clock');
    if (ck) ck.textContent = KE.clock(Math.min(L.minute, KE.MINUTES));
    const S = L.stats;
    const jar = document.getElementById('jar');
    if (jar) jar.style.height = Math.min(100, S.tips / Math.max(1, L.expected * 9) * 100) + '%';
    const ls = document.getElementById('livestats');
    if (ls) {
      const outs = Object.keys(S.stockouts);
      const sat = S.satN ? S.satSum / S.satN : 0;
      ls.innerHTML = `<div class="minikpis"><div><small>Ciro</small><b>${KE.tl(S.revenue)}</b></div><div><small>Bahşiş</small><b>${KE.tl(S.tips)}</b></div><div><small>Servis</small><b>${S.served}</b></div><div><small>Kaçan</small><b class="${S.lost ? 'neg' : ''}">${S.lost}</b></div></div>
        <div class="statl"><span>Memnuniyet</span>${bar(sat, sat < 60 ? 'crit' : sat < 72 ? 'warn' : 'ok')}<b>${S.satN ? Math.round(sat) : '–'}</b></div>
        ${outs.length ? `<div class="alert crit sm">${IC('bolt')}<span>Biten: ${outs.map(pn).join(', ')}</span></div>` : ''}`;
    }
    const dl = document.getElementById('dailylive');
    if (dl && (force || tickN % 3 === 0)) {
      const html = dailyHtml(true);
      const doneNow = (html.match(/dg done/g) || []).length;
      if (UI.dailyDone != null && doneNow > UI.dailyDone) { UI.toast('Günün hedefi tamam!', 'gold'); }
      UI.dailyDone = doneNow;
      dl.innerHTML = html;
    }
    const bl = document.getElementById('branchlive');
    if (bl) bl.innerHTML = KE.G.branches.map((x) => { const l = KE.G.live[x.id]; const s2 = l.stats; return `<button class="blrow ${x.id === b.id ? 'on' : ''}" data-a="viewBranch" data-id="${x.id}"><b>${esc(x.name)}</b><span>${l.closed ? 'Kapalı' : l.done ? 'Kapandı' : `${l.queue.length} sırada`}</span><span>${KE.tl(s2.revenue)}</span><span>${s2.satN ? '%' + Math.round(s2.satSum / s2.satN) : '–'}</span></button>`; }).join('');
    if (force || tickN % 3 === 0) {
      const cr = document.getElementById('crew');
      if (cr && !(UI.crewHover && Date.now() - UI.crewHover < 1500)) cr.innerHTML = crewPanel(b, true);
    }
    const tb = document.getElementById('tezgahBtn');
    if (tb) tb.querySelector('span').textContent = L.player.active ? 'Tezgâhtan çık' : 'Tezgâha geç';
  };
  function banner(text) {
    const st = document.getElementById('stage');
    if (!st) return;
    const d = document.createElement('div');
    d.className = 'st-banner'; d.textContent = text; KE.SND.play('banner');
    st.appendChild(d);
    setTimeout(() => d.remove(), 3200);
  }
  UI.confetti = function () {
    const box = document.createElement('div');
    box.className = 'confetti';
    const cols = ['#ffc93c', '#d7263d', '#23a26d', '#2f6fb5', '#f28c28'];
    for (let i = 0; i < 46; i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + '%'; p.style.background = cols[i % 5]; p.style.animationDelay = Math.random() * 0.4 + 's'; p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px'); box.appendChild(p); }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2400);
  };
  function renderTezgah() {
    const box = document.getElementById('tezgah');
    if (!box || !KE.G.live) return;
    const L = KE.G.live[KE.G.activeBranch];
    if (!L) return;
    const P = L.player;
    if (!P.active) { box.innerHTML = ''; return; }
    const t = P.tid != null ? L.tickets.find((x) => x.id === P.tid) : null;
    if (!t) { box.innerHTML = `<div class="tezgah idle">${IC('chef')}<b>Tezgâhtasın.</b><span class="muted">Mutfağa sipariş düşünce burada belirecek.</span></div>`; return; }
    const p = prod(t.pid);
    box.innerHTML = `<div class="tezgah"><div class="tz-dish">${KE.ART.dish(p.id)}</div><div class="tz-b"><div class="row between"><div><span class="kicker">${t.paket ? 'Paket sipariş' : 'Masa siparişi'}</span><h3>${p.name}${t.count > 1 ? ' ×' + t.count : ''}</h3></div><span class="chip ${P.errors ? 'rd' : 'gr'}">Hata ${P.errors}</span></div>
      <ol class="tz-steps">${p.steps.map((s, i) => `<li class="${i < P.step ? 'done' : i === P.step ? 'now' : ''}">${i < P.step ? s : i + 1}</li>`).join('')}</ol>
      <div class="tz-opts" id="stepbtns">${P.opts.map((o) => { const used = p.steps.indexOf(o) > -1 && p.steps.indexOf(o) < P.step; return `<button class="btn sm ${used ? 'ghost' : 'blue'}" data-a="step" data-l="${esc(o)}" ${used ? 'disabled' : ''}>${esc(o)}</button>`; }).join('')}</div></div></div>`;
  }

  /* ---------- Kapanış ---------- */
  function showClosing() {
    const S0 = KE.G.lastSummary;
    const rule = UI.todayRule || KE.G.tipRule;
    const tab = UI.closeTab && S0.branches[UI.closeTab] ? UI.closeTab : KE.G.activeBranch;
    const b = KE.G.branches.find((x) => x.id === tab);
    const sum = S0.branches[b.id], S = sum.stats;
    const prods = Object.entries(S.byProduct).sort((a, c) => c[1] - a[1]);
    const maxP = Math.max(1, ...prods.map((x) => x[1]));
    const tot = KE.G.branches.reduce((a, x) => a + S0.branches[x.id].stats.revenue, 0);
    const tips = KE.G.branches.reduce((a, x) => a + S0.branches[x.id].stats.tips, 0);
    const preview = KE.tipShares(KE.G, b, rule, S.tips);
    const html = `<div class="mhead split"><div><span class="kicker">${KE.dateStr(KE.G.day)} · ${KE.weekday(KE.G.day)}</span><h2>Gün sonu raporu</h2></div>${npc('zeynep', sum.sat > 75 ? 'Güzel bir gün, patron. Rakamlar yüz güldürüyor.' : 'Rakamlara birlikte bakalım; düzeltecek şeyler var.')}</div>
      ${KE.G.branches.length > 1 ? `<div class="kpis"><div class="kpi">${IC('coin')}<small>Bütün şubeler ciro</small><b>${KE.tl(tot)}</b></div><div class="kpi">${IC('gift')}<small>Bütün şubeler bahşiş</small><b>${KE.tl(tips)}</b></div></div>
        <div class="tabs">${KE.G.branches.map((x) => `<button class="tab ${x.id === tab ? 'on' : ''}" data-a="closeTab" data-id="${x.id}">${esc(x.name)}</button>`).join('')}</div>` : ''}
      <div class="kpis">
        <div class="kpi">${IC('coin')}<small>Ciro</small><b>${KE.tl(S.revenue)}</b></div>
        <div class="kpi">${IC('users')}<small>Müşteri</small><b>${S.served}</b></div>
        <div class="kpi">${IC('heart')}<small>Memnuniyet</small><b>%${Math.round(sum.sat)}</b></div>
        <div class="kpi">${IC('gift')}<small>Bahşiş</small><b>${KE.tl(S.tips)}</b></div>
      </div>
      ${advice(b, S).map((a) => `<div class="alert ${a[0]}">${IC(a[0] === 'ok' ? 'check' : 'bolt')}<span>${a[1]}</span></div>`).join('')}
      <div><h4>Satılan ürünler</h4><div class="prodbars">${prods.map(([pid, n]) => `<div class="pbar">${KE.ART.dish(pid)}<span>${pn(pid)}</span>${bar(n / maxP * 100, 'or')}<b>${n}</b></div>`).join('') || '<p class="muted">Satış yok</p>'}</div></div>
      <section class="tipbox"><h3>${IC('gift')}Bahşiş dağıtımı <small class="muted">Bütün şubelerde uygulanır</small></h3>
        <div class="seg wide">${Object.entries(KE.TIP_RULES).map(([k, r]) => `<button class="${rule === k ? 'on' : ''}" data-a="tipToday" data-r="${k}"><span>${r.name}${k === KE.G.tipRule ? ' (varsayılan)' : ''}</span></button>`).join('')}</div>
        <p class="small">${KE.TIP_RULES[rule].desc}${rule !== KE.G.tipRule ? ` <b>Yalnızca bugün için.</b> <button class="btn xs ghost" data-a="tipRule" data-r="${rule}">Hep böyle yap</button>` : ''}</p>
        <div class="shares">${preview.map(([s, v]) => `<div class="share"><span class="avatar sm">${KE.portrait(KE.staffLook(s), { mood: KE.moodFromValue(s.morale) })}</span><span><b>${esc(s.name)}</b><small>${roleName(s)} · ${Math.round(s.servedToday)} iş</small></span><b class="num">${KE.tl(v)}</b></div>`).join('')}</div></section>
      <div class="acts"><button class="btn big green" data-a="finalize">${IC('check')}Bahşişi dağıt ve günü kapat</button></div>`;
    document.querySelectorAll('.modal-bg').forEach((m) => m.remove());
    UI.modal(html, { wide: true });
  }

  /* Kapanışta yalnızca harekete geçirilebilir öneriler */
  function advice(b, S) {
    const out = [];
    const st = KE.branchStaff(KE.G, b);
    const lost = [[S.lostWait, 'beklemekten sıkılıp gitti', 'Kasaya ikinci bir kişi ver ya da yoğun saatte molaları kaldır.'],
      [S.lostFood, 'yemeğini beklerken kalktı', 'Mutfak yetişmiyor: bir usta ya da çırak al, ocak sayısını artır.'],
      [S.lostFull, 'yer bulamadı', 'Kuyruk ya da masa yetmiyor: Mobilya ve Dekor\'dan salonu büyüt.'],
      [S.lostPrice, 'fiyatı görünce döndü', 'Bazı ürünler piyasanın çok üstünde; fiyatı biraz indir.'],
      [S.lostStock, 'istediğini bulamadı', 'Stok bitti: Hal\'de sabah siparişini "Bol" yap.']].sort((a, c) => c[0] - a[0]);
    if (lost[0][0] >= 3) out.push(['crit', `<b>${lost[0][0]} müşteri ${lost[0][1]}.</b> ${lost[0][2]}`]);
    if (S.cold >= 3) out.push(['warn', `<b>${S.cold} tabak tezgâhta soğudu.</b> Servise bir komi/garson daha ver.`]);
    const tired = st.filter((s) => s.minEnergy < 15);
    if (tired.length) out.push(['warn', `<b>${tired.map((s) => esc(s.name)).join(', ')} bitkin düştü.</b> Sakin saatlerde molaya gönder.`]);
    if (!out.length) out.push(['ok', 'Bugün işler tıkırındaydı. Kimse eli boş dönmedi.']);
    return out.slice(0, 2);
  }

  function afterDay(out) {
    UI.todayRule = null; UI.closeTab = null;
    const ups = out.levelUps.map((u) => `<li>${KE.ART.dish(u.pid)}<span><b>${esc(u.name)}</b> ${pn(u.pid)} yapımında ${stars(u.star)}${u.mentor ? ` <small>(${esc(u.mentor)} sayesinde)</small>` : ''}</span></li>`).join('');
    const quits = out.quits.map((q) => `<li class="neg">${IC('bolt')}<span><b>${esc(q.name)}</b> (${esc(q.branch)}) istifa etti.</span></li>`).join('');
    const goals = (out.goals || []).map((g) => `<li class="pos">${IC('star')}<span>Hedef tamamlandı: <b>${g.name}</b> · ödül ${KE.tl(g.reward)}</span></li>`).join('');
    const farm = out.farm && out.farm.done.length ? `<li>${IC('truck')}<span>Çiftlikten kesimhaneye: ${out.farm.done.map((d) => `${d.heads} ${KE.FARM[d.kind].unit} ${KE.FARM[d.kind].name.toLowerCase()} → ${Object.entries(d.got).map(([k, v]) => KE.num(v, 0) + ' kg ' + KE.MODES[KE.G.mode].ingredients[k].name.toLowerCase()).join(', ')}`).join('; ')}</span></li>` : '';
    const tot = Object.values(out.branches).reduce((a, e) => a + e.net, 0);
    const staff = KE.G.staff.slice(0, 12);
    const pn2 = (pid) => (KE.MODES[KE.G.mode].products.find((p) => p.id === pid) || {}).name;
    const extra = [
      out.contract ? `<li class="pos">${IC('truck')}<span><b>${esc(out.contract.name)}</b> teslim edildi: ${out.contract.qty} porsiyon · net ${KE.tl(out.contract.net)}, itibar +1.</span></li>` : '',
      out.signature ? `<li class="pos">${IC('chef')}<span>Ar-Ge mutfağı bitirdi: <b>${esc(pn2(out.signature.pid))}</b> · <b>${KE.SIGNATURE.names[out.signature.level - 1]}</b> (seviye ${out.signature.level}/3)</span></li>` : '',
      out.weeklyDone ? `<li class="pos">${IC('target')}<span>Haftalık meydan okuma tamam: <b>${esc(out.weeklyDone.text)}</b> · ödül ${KE.tl(out.weeklyDone.reward)}, itibar +1.</span></li>` : '',
      out.weeklyEnd && !out.weeklyEnd.done && !out.weeklyDone ? `<li class="neg">${IC('target')}<span>Haftalık meydan okuma kaçtı: ${esc(out.weeklyEnd.text)}.</span></li>` : ''
    ].join('');
    /* 3+ şubede gün sonu kısa özet: hikâye ve moral satırı yerine sayılar */
    const compact = KE.G.branches.length >= 3;
    const regs = {};
    (out.regulars || []).forEach((x) => { regs[x.id] = (regs[x.id] || 0) + x.gain; });
    const regHtml = Object.entries(regs).map(([id, g]) => { const R = KE.REGULARS.find((x) => x.id === id); const r = KE.G.regulars[id]; return `<li class="${g < 0 ? 'neg' : ''}"><span class="avatar sm">${KE.portrait(R.look || KE.CAST[R.cast].look, { mood: g < 0 ? 'sad' : 'happy' })}</span><span><b>${R.name}</b> uğradı. ${g > 0 ? 'Çok memnun kaldı' : g < 0 ? 'Kırıldı' : 'İdare etti'} · ${hearts(r.loyalty)}${r.praised === KE.G.day - 1 ? ' <b>Mahallede dükkânı övüyor!</b>' : ''}</span></li>`; }).join('');
    const brRows = compact ? `<div class="tablewrap"><table class="fin"><thead><tr><th>Şube</th><th class="r">Müşteri</th><th class="r">Ciro</th><th class="r">Net</th><th class="r">Memnuniyet</th></tr></thead><tbody>${KE.G.branches.map((b) => { const e = out.branches[b.id]; return e ? `<tr><td><b>${esc(b.name)}</b></td><td class="r">${e.served}</td><td class="r">${KE.tl(e.revenue)}</td><td class="r ${e.net >= 0 ? 'pos' : 'neg'}">${KE.tl(e.net)}</td><td class="r">%${Math.round(e.sat)}</td></tr>` : ''; }).join('')}</tbody></table></div>` : '';
    const html = `<div class="mhead"><span class="kicker">${KE.dateStr(KE.G.day - 1)}</span><h2>${compact ? 'Gün özeti' : 'Günlük'}</h2></div>
      ${compact ? brRows : `<div class="journal">${H.sentences(out.journal)}</div>`}
      <div class="kpis"><div class="kpi">${IC('chart')}<small>Günlük net (tahmini)</small><b class="${tot >= 0 ? 'pos' : 'neg'}">${KE.tl(tot)}</b></div><div class="kpi">${IC('star')}<small>İtibar</small><b>${Math.round(KE.G.reputation)}</b></div><div class="kpi">${IC('coin')}<small>Kasa</small><b>${KE.tl(KE.G.cash)}</b></div></div>
      ${compact ? '' : `<h4>Ekibin morali</h4>`}<div class="moodrow" ${compact ? 'hidden' : ''}>${staff.map((s) => `<div class="mood">${avatar(KE.staffLook(s), KE.moodFromValue(s.morale), s.name)}<small>${esc(s.name.replace(' Usta', ''))}</small><b class="${(s.moraleDelta || 0) >= 0 ? 'pos' : 'neg'}">${(s.moraleDelta || 0) >= 0 ? '+' : ''}${KE.num(s.moraleDelta || 0, 1)}</b><em>${KE.tl(s.tipsToday || 0)}</em></div>`).join('')}</div>
      ${(out.daily || []).length ? `<h4>Günün hedefleri</h4><div class="daily">${out.daily.map((g) => `<div class="dg ${g.state}"><i>${IC(g.state === 'done' ? 'check' : 'bolt')}</i><span><b>${g.text}</b></span><em>${g.state === 'done' ? '+' + KE.tl(g.reward) : 'Olmadı'}</em></div>`).join('')}</div>` : ''}
      ${ups || quits || goals || farm || regHtml || extra ? `<ul class="events">${goals}${extra}${regHtml}${farm}${ups}${quits}</ul>` : ''}
      <div class="acts"><button class="btn big green" data-a="closeAfterDay">${IC('play')}Yeni güne başla</button></div>`;
    UI.modal(html, { wide: true });
    (out.unlocks || []).forEach((p) => queueModal(() => { UI.modal(`<div class="unlock"><span class="kicker">İtibar ${p.unlock} · Yeni tarif</span><div class="ul-dish">${KE.ART.dish(p.id)}</div><h2>${p.name} menüde!</h2><p class="lead">Bütün şubelerin menüsüne eklendi. Onu seven müşteriler kapıda.</p><div class="acts center"><button class="btn big green" data-a="closeModal">${IC('check')}Harika</button></div></div>`); UI.confetti(); KE.SND.play('goal'); }));
    if (out.champions) queueModal(() => { UI.modal(`<div class="mhead"><span class="kicker">Ay sonu</span><h2>Semt şampiyonluğu</h2><p class="muted">Ayın memnuniyet ortalaması "Lüks Kebap"ın semtteki çıtasını geçen şube şampiyon olur: bir ay boyunca müşteri +%6, itibar +2.</p></div>
      <div class="champs">${out.champions.map((c) => `<div class="champ ${c.won ? 'won' : ''}"><span class="cup">${IC(c.won ? 'crown' : 'bolt')}</span><span><b>${esc(c.name)}</b><small>${c.district} · memnuniyet %${Math.round(c.sat)} / çıta %${c.bar}</small></span><em>${c.won ? 'Şampiyon!' : c.served < 250 ? 'Yetersiz müşteri' : 'Lüks Kebap kazandı'}</em></div>`).join('')}</div>
      <div class="acts"><button class="btn big green" data-a="closeModal">Tamam</button></div>`); if (out.champions.some((c) => c.won)) { UI.confetti(); KE.SND.play('goal'); } });
    if (out.month) queueModal(() => UI.modal(monthReportHtml(out.month) + `<div class="acts"><button class="btn big green" data-a="closeModal">Tamam</button></div>`, { wide: true }));
    (out.eras || []).forEach((e) => queueModal(() => { UI.modal(eraHtml(e), { cls: 'eramodal' }); UI.confetti(); KE.SND.play('goal'); track('era', { era: e.n, day: KE.G.day - 1 }); }));
    if (out.weeklyEnd && KE.G.branches.length >= 2) queueModal(() => UI.modal(weekReportHtml() + `<div class="acts"><button class="btn big green" data-a="closeModal">Tamam</button></div>`, { wide: true }));
    if (out.news) queueModal(() => UI.modal(newsHtml(out.news) + `<div class="acts"><button class="btn big green" data-a="closeModal">Gazeteyi katla</button></div>`, { wide: true }));
  }

  function eraHtml(e) {
    const opened = KE.placesOfEra(e.n).map((id) => KE.MAP.place(id)).filter(Boolean);
    const extra = { 3: ['Büyük yatırımlar: imza tarif, amiral dükkân, toplu siparişler'], 4: ['"Lüks Kebap"ı satın alma teklifi (Merkez Ofis)'] }[e.n] || [];
    return `<div class="unlock era-up"><span class="kicker">Yeni dönem · ${e.n}/${KE.ERAS.length}</span><div class="era-big">${e.n}</div><h2>${esc(e.name)}</h2><p class="lead">${esc(e.story)}</p>
      ${opened.length || extra.length ? `<div class="era-open">${opened.map((p) => `<span class="eo" style="--c:${p.color}">${IC(p.icon)}<b>${esc(p.name)}</b> açıldı</span>`).join('')}${extra.map((x) => `<span class="eo" style="--c:#7a1f3d">${IC('star')}<b>${esc(x)}</b></span>`).join('')}</div>` : ''}
      ${e.req.length ? `<p class="small muted">Sıradaki döneme geçmek için:</p><div class="chips center">${e.req.map((r) => `<span class="chip">${esc(r.label)}</span>`).join('')}</div>` : ''}
      <div class="acts center"><button class="btn big green" data-a="closeModal">${IC('play')}Devam</button></div></div>`;
  }
  /* Haftalık rapor: son 7 günün şube şube toplamı */
  function weekReportHtml() {
    const G = KE.G, from = G.day - 7;
    const rows = G.branches.map((b) => { const ds = G.ledger.days.filter((d) => d.branchId === b.id && d.day >= from); const prev = G.ledger.days.filter((d) => d.branchId === b.id && d.day >= from - 7 && d.day < from); const rev = ds.reduce((a, d) => a + d.revenue, 0), pr = prev.reduce((a, d) => a + d.revenue, 0); const served = ds.reduce((a, d) => a + d.served, 0); return { b, rev, net: ds.reduce((a, d) => a + d.net, 0), served, sat: served ? ds.reduce((a, d) => a + d.sat * d.served, 0) / served : 0, tr: pr ? rev / pr - 1 : null }; });
    const best = rows.slice().sort((a, c) => c.net - a.net)[0], worst = rows.slice().sort((a, c) => a.net - c.net)[0];
    return `<div class="mhead"><span class="kicker">${KE.dateStr(from)} – ${KE.dateStr(G.day - 1)}</span><h2>Haftalık rapor</h2></div>
      <div class="kpis"><div class="kpi">${IC('coin')}<small>Haftalık ciro</small><b>${KE.tl(rows.reduce((a, r) => a + r.rev, 0))}</b></div><div class="kpi">${IC('chart')}<small>Haftalık net</small><b class="${rows.reduce((a, r) => a + r.net, 0) >= 0 ? 'pos' : 'neg'}">${KE.tl(rows.reduce((a, r) => a + r.net, 0))}</b></div><div class="kpi">${IC('star')}<small>En iyi şube</small><b>${esc(best.b.name)}</b></div></div>
      <div class="tablewrap"><table class="fin"><thead><tr><th>Şube</th><th class="r">Müşteri</th><th class="r">Ciro</th><th class="r">Geçen haftaya göre</th><th class="r">Net</th><th class="r">Memnuniyet</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td><b>${esc(r.b.name)}</b>${KE.isManaged(G, r.b) ? ' <small class="muted">müdürlü</small>' : ''}</td><td class="r">${r.served}</td><td class="r">${KE.tl(r.rev)}</td><td class="r ${r.tr == null ? '' : r.tr >= 0 ? 'pos' : 'neg'}">${r.tr == null ? '—' : (r.tr >= 0 ? '+' : '') + Math.round(r.tr * 100) + '%'}</td><td class="r ${r.net >= 0 ? 'pos' : 'neg'}">${KE.tl(r.net)}</td><td class="r">%${Math.round(r.sat)}</td></tr>`).join('')}</tbody></table></div>
      ${worst.net < 0 ? `<div class="alert warn">${IC('bolt')}<span><b>${esc(worst.b.name)}</b> bu hafta zarar etti. Kapanış önerilerine ve kadrosuna bak.</span></div>` : ''}`;
  }
  function hearts(n) { let h = '<span class="hearts" aria-label="Gönül ' + n + '/10">'; for (let i = 0; i < 5; i++) h += `<i style="--f:${Math.max(0, Math.min(1, n / 2 - i)) * 100}%">♥</i>`; return h + '</span>'; }
  function newsHtml(n) {
    return `<div class="paper"><div class="mast">Mahalle Postası</div><div class="mastline"><span>Sayı ${n.issue}</span><span>${n.date}</span><span>15 ₺</span></div>
      <div class="cols2">${n.headlines.map((h, i) => `<article class="${i === 0 ? 'lead' : ''}"><h4>${esc(h.title)}</h4><p>${esc(h.body)}</p></article>`).join('')}</div></div>`;
  }
  function monthReportHtml(m) {
    const line = (l, v, cls) => `<tr class="${cls || ''}"><td>${l}</td><td class="r">${KE.tl(v)}</td></tr>`;
    const parts = [{ l: 'Malzeme', v: m.purchases, c: '#f28c28' }, { l: 'Personel', v: m.personnel, c: '#7a1f3d' }, { l: 'Kira', v: m.rent, c: '#2f6fb5' }, { l: 'KDV', v: m.kdv, c: '#8e7cc3' }, { l: 'Fatura', v: m.util, c: '#23a26d' }, { l: 'Diğer', v: m.accountant + m.loan + (m.ads || 0) + (m.fines || 0) + Math.max(0, m.other || 0) + (m.farm || 0) + (m.farmFixed || 0), c: '#9a8b7a' }];
    return `<div class="mhead"><span class="kicker">Aylık kapanış</span><h2>${m.name} bilançosu</h2></div>
      <div class="kpis"><div class="kpi">${IC('coin')}<small>Ciro (KDV dahil)</small><b>${KE.tl(m.revenue)}</b></div><div class="kpi">${IC('users')}<small>Müşteri</small><b>${KE.num(m.customers)}</b></div><div class="kpi">${IC('chef')}<small>Personel maliyeti</small><b>${KE.tl(m.personnel)}</b></div><div class="kpi">${IC('chart')}<small>Aylık net</small><b class="${m.net >= 0 ? 'pos' : 'neg'}">${KE.tl(m.net)}</b></div></div>
      <div class="cols2"><div class="tablewrap"><table class="fin"><tbody>
        ${line('Brüt ciro (KDV dahil)', m.revenue)}${line('− Hesaplanan KDV (%10)', -m.kdvOut)}${line('+ İndirilecek KDV (gıda alımları, %1)', m.kdvIn)}${line('= Ödenecek KDV', -m.kdv, 'sub')}
        ${line('− Malzeme ve sarf', -m.purchases)}${line('− Personel (bordro toplam maliyeti)', -m.personnel)}${line('− Kira (ev sahibine net)', -m.rentNet)}${line('− Kira stopajı (%20)', -m.stopaj)}
        ${line('− Elektrik, su, doğalgaz, internet', -m.util)}${line('− Muhasebeci', -m.accountant)}${m.loan ? line('− Kredi taksitleri', -m.loan) : ''}${m.ads ? line('− Reklam', -m.ads) : ''}${m.fines ? line('− İdari para cezaları', -m.fines) : ''}${m.farm ? line('− Çiftlik: hayvan ve yem', -m.farm) : ''}${m.farmFixed ? line('− Çiftlik işletme gideri', -m.farmFixed) : ''}${m.other ? line('− Diğer giderler / gelirler', -m.other) : ''}
        ${line('= Aylık net sonuç', m.net, 'total')}${m.capex ? line('Yatırım harcamaları (ekipman, dekor, şube)', m.capex, 'muted') : ''}${line('Dağıtılan bahşiş', m.tips, 'muted')}
      </tbody></table></div><div class="stack">${donut(parts, 'Giderler')}
        <h4>Şube bazında</h4>${m.branches.map((b) => `<div class="kpi">${IC('store')}<small>${esc(b.name)}</small><b class="${b.result >= 0 ? 'pos' : 'neg'}">${KE.tl(b.result)}</b><em class="tiny">Ciro ${KE.tl(b.revenue)} · personel ${KE.tl(b.staffCost)} · kira ${KE.tl(b.rent)}</em></div>`).join('')}
        ${m.bonus ? `<div class="chip gd">${m.bonus} ikramiyesi ödendi</div>` : ''}</div></div>
      <h4>Bordro</h4>${payrollTable(m.payroll)}`;
  }
  function payrollTable(rows) {
    const tot = (k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
    const cols = [['base', 'Temel brüt'], ['fm', 'Fazla mesai'], ['brut', 'Toplam brüt'], ['sgkI', 'SGK işçi %14'], ['issI', 'İşsizlik işçi %1'], ['gv', 'Gelir vergisi'], ['damga', 'Damga'], ['net', 'Net ele geçen'], ['sgkV', 'SGK işveren'], ['issV', 'İşsizlik işveren %2'], ['yol', 'Yol'], ['ikramiye', 'İkramiye'], ['total', 'Toplam maliyet'], ['tips', 'Bahşiş (ay)']];
    return `<div class="tablewrap"><table class="fin wide"><thead><tr><th>Çalışan</th><th>Rol</th>${cols.map((c) => `<th class="r">${c[1]}</th>`).join('')}</tr></thead><tbody>
      ${rows.map((r) => `<tr><td><b>${esc(r.name)}</b></td><td>${r.role === 'usta' ? 'Usta' : r.role === 'garson' ? 'Garson / Komi' : KE.ROLES[r.role].name}</td>${cols.map((c) => `<td class="r ${c[0] === 'net' || c[0] === 'total' ? 'em' : ''}">${KE.tl(r[c[0]] || 0)}</td>`).join('')}</tr>`).join('')}
      <tr class="total"><td>Toplam</td><td></td>${cols.map((c) => `<td class="r">${KE.tl(tot(c[0]))}</td>`).join('')}</tr></tbody></table></div>
      <p class="tiny muted">Fazla mesai haftada yaklaşık 10 saat, %50 zamlı varsayılır. Gelir vergisi kümülatif matraha göre dilimli hesaplanır; asgari ücrete isabet eden gelir ve damga vergisi istisna edilir. SGK işveren payında 5 puanlık hazine teşviki primler zamanında ödendiğinde düşülür. Oranlar 2026 için tahmini, ayar tablosundan güncellenebilir.</p>`;
  }

  /* ---------- Olay kartı ---------- */
  function showEvent() {
    const e = KE.G.pendingEvent;
    if (!e) return;
    let look, name;
    if (e.whoStaff) { const s = KE.G.staff.find((x) => x.id === e.whoStaff); if (s) { look = KE.staffLook(s); name = s.name; } }
    if (!look && e.who && KE.CAST[e.who]) { look = KE.CAST[e.who].look; name = KE.CAST[e.who].name; }
    if (!look) { look = KE.CAST.ayse.look; name = 'Ayşe Teyze'; }
    UI.modal(`<div class="evcard"><div class="ev-fig">${KE.figure(look, { mood: 'neutral', label: name })}</div><div class="stack"><span class="kicker ${e.rival ? 'rv' : ''}">${e.rival ? `${IC('fire')}Rakip hamlesi ${e.rival}/${KE.RIVAL_ARC.length}` : e.story ? `${IC('heart')}Müdavim hikâyesi` : 'Olay'} · ${esc(name)}</span><h2>${esc(e.title)}</h2><p class="lead">${esc(e.text)}</p>
      <div class="choices">${e.choices.map((c, i) => `<button class="choice c${i}" data-a="eventChoice" data-i="${i}"><b>${esc(c.label)}</b><small>${esc(c.desc)}</small></button>`).join('')}</div></div></div>`, { cls: 'event' });
  }

  Object.assign(H, { crewPanel, banner, renderTezgah, showClosing, afterDay, hearts, newsHtml, monthReportHtml, payrollTable, showEvent });
})();
