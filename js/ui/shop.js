/* Kebab Empire — arayüz: dükkân: sabah hazırlığı, canlı servis, tezgâh, kapanış, olay kartı. */
(function () {
  const UI = KE.UI, H = UI.H, SCREENS = UI.SCREENS, A = UI.A, C = UI.C;
  const { esc, IC, MODE, B, prod, pn, stars, roleName, bar, moodCls, avatar, queueModal, npc, donut, track } = H;
  const { clamp } = KE.U;

  /* ---------- Dükkân ---------- */
  SCREENS.shop = () => KE.G.phase === 'morning' ? morningView() : serviceView();

  function morningView() {
    const b = B(); const M = MODE();
    const st = KE.branchStaff(KE.G, b);
    const exp = KE.expectedCustomers(KE.G, b);
    const amb = KE.ambience(KE.G, b);
    const stations = KE.stations(KE.G, b);
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
    /* kapasite: dün gelenlerin ne kadarı hizmet alamadan gitti */
    const ys = KE.G.lastSummary && KE.G.lastSummary.branches[b.id] && KE.G.lastSummary.branches[b.id].stats;
    const capLost = ys && ys.arrivals > 20 ? (ys.lostWait + ys.lostFull + ys.lostFood) / ys.arrivals : 0;
    if (capLost >= 0.12) warn.push([capLost >= 0.2 ? 'crit' : 'warn', `Dün gelen her 100 müşteriden ${Math.round(capLost * 100)} tanesi kapasite yetmediği için hizmet alamadan gitti. Reklamdan önce kapasiteyi büyüt: kasaya ve servise kişi, ocak yerine pişirmeci ya da salonu büyüt.`]);
    /* enflasyon: fiyatlar piyasanın gerisinde kaldıysa */
    const pr = KE.priceRatio(KE.G, b);
    if (pr < 0.95) warn.push(['warn', `Fiyatların piyasanın ortalama ${KE.pct(Math.round((1 - pr) * 100))} altında; enflasyon maliyetleri artırıyor. <button class="btn xs green" data-a="pricesToMarket">Fiyatları piyasaya çek</button>`]);
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
          <div class="chips"><span class="chip ${ratio > 1.15 ? 'rd' : ratio < 0.97 ? 'gr' : ''}">Piyasa ${KE.tl(mp)}${Math.abs(ratio - 1) >= 0.01 ? ` · ${KE.pct(Math.round((ratio - 1) * 100), 1)}` : ''}</span><span class="chip ${margin < 0.45 ? 'or' : ''}">Kâr ${KE.pct(Math.round(margin * 100))}</span></div>
          </div></article>`;
    }).join('');
    return `<main class="screen">
      <div class="pagehead"><div class="ph-t"><span class="kicker">Sabah hazırlığı · ${KE.weekday(KE.G.day)}</span><h1>${esc(b.name)}</h1><p class="ph-facts"><span>${IC('map')}${KE.district(b).name}</span><span>${IC('users')}~${Math.round(exp)} müşteri</span>${ys && ys.arrivals > 20 ? `<span class="${capLost >= 0.12 ? 'neg' : ''}" title="Dün kapasite yetmediği için hizmet alamadan gidenler">${IC('queue')}Kapasite: dün ${KE.pct(Math.round(capLost * 100))} kaçtı</span>` : ''}<span>${IC('fire')}${Math.min(stations, cooks.length)}/${stations} ocak</span><span>${IC('table')}${KE.tableCount(KE.G, b)} masa</span>${amb.concept ? `<span>${IC('star')}${amb.concept.name}</span>` : ''}</p></div>
        <div class="row">${KE.G.day > 2 ? `<button class="btn ghost" data-a="quickDay" title="Servisi izlemeden günü tamamla">${IC('ff')}Hızlı gün</button>` : ''}${KE.quickWeekOpen(KE.G) ? `<button class="btn ghost" data-a="quickWeek" title="Haftanın kalanını hızlı geç; önemli bir şey olursa durur">${IC('ff')}Haftayı hızlı geç</button>` : ''}<button class="btn big green ${checklistOk() ? 'ready' : ''}" data-a="openShop">${IC('store')}${KE.G.branches.length > 1 ? 'Bütün şubelerde kepengi aç' : 'Kepengi aç'}</button></div></div>
      ${checklist()}
      ${(() => { const sp = KE.specialDay(KE.G.day); return sp ? `<section class="special sp-${sp.theme || 'cuma'}"><span class="sp-badge">${IC(sp.id === 'mac' ? 'fire' : sp.id === 'cuma' ? 'users' : 'star')}</span><div><span class="kicker">Bugün özel gün</span><h2>${sp.name}</h2><p>${sp.desc}</p></div></section>` : ''; })()}
      ${(KE.G.daily || []).length ? `<section class="panel daypanel"><div class="sechead"><h2>Günün hedefleri</h2><span class="muted small">Tutturduğun her hedef ek para ve biraz itibar getirir.</span></div>${dailyHtml(false)}</section>` : ''}
      ${warn.length ? `<div class="alerts">${warn.map(([c, w]) => `<div class="alert ${c}">${IC(c === 'crit' ? 'bolt' : 'clock')}<span>${w}</span></div>`).join('')}</div>` : ''}
      <section class="panel"><div class="sechead"><h2>Ekip ve açılış görevleri</h2><button class="btn sm ghost" data-a="go" data-s="lonca">${IC('users')}Personeli yönet</button></div>
        ${crewPanel(b, false)}</section>
      <section class="panel"><div class="sechead"><h2>Menü ve fiyatlar</h2><span class="muted small">Fiyatlar KDV dahil. Pahalı fiyat öğrenci ve işçiyi kaçırır; gurmeler ve plaza çalışanları fiyata pek bakmaz.</span></div>
        <div class="dishgrid">${dishCards}</div></section>

    </main>`;
  }

  /* ---------- Sabah kontrol listesi: dört madde yeşilse kepenk hazır ---------- */
  /* aynı çizimde iki kez istenir (kepenk düğmesi + liste): stok tahmini bir kez hesaplansın */
  let checksMemo = null;
  function checks() {
    if (checksMemo) return checksMemo;
    checksMemo = checksNow();
    queueMicrotask(() => { checksMemo = null; });
    return checksMemo;
  }
  function checksNow() {
    const G = KE.G, out = [];
    const open = G.branches.filter((b) => KE.branchStaff(G, b).some(KE.isCook));
    const crewBad = G.branches.filter((b) => { const st = KE.branchStaff(G, b); return !st.some(KE.isCook) || !st.some((s) => s.pos === 'kasa') || (st.filter((s) => !KE.isCook(s)).length > 1 && !st.some((s) => s.pos === 'servis')); });
    out.push({ id: 'ekip', ic: 'users', ok: !crewBad.length, label: crewBad.length ? 'Ekip eksik' : 'Ekip yerinde', bad: crewBad.length ? (G.branches.length > 1 ? crewBad.map((b) => b.name).join(', ') + ': ' : '') + 'usta, kasa ya da servis boş' : '', btn: crewBad.length ? ['Ekibe git', `data-a="viewBranch" data-id="${crewBad[0].id}"`] : null });
    const short = open.map((b) => [b, KE.shortfall(G, b)]).filter(([, x]) => x.items.length);
    const cost = short.reduce((a, [, x]) => a + x.cost, 0);
    /* sabah siparişi tamamsa bile gerçekçi tahmin (saatlik müşteri tipi karışımı, son 7 günün satışı, malzeme bazında ihtiyaç, akşam payı) */
    const fc = short.length ? null : open.map((b) => /** @type {[Branch, ReturnType<KENamespace['stockForecast']>]} */ ([b, KE.stockForecast(G, b)])).find(([, f]) => !f.ok);
    const ing = (k) => (MODE().ingredients[k] || { name: k }).name;
    if (short.length) out.push({ id: 'stok', ic: 'cart', ok: false, label: 'Stok bugüne yetmez', bad: `${short.reduce((a, [, x]) => a + x.items.length, 0)} malzeme eksik`, btn: [`Tamamla · ${KE.tl(cost)}`, 'data-a="topUpAll"'] });
    else if (fc) {
      const [fb, f] = fc, first = f.short[0];
      out.push({ id: 'stok', ic: 'cart', ok: false, label: 'Stok akşama yetmeyebilir', bad: (G.branches.length > 1 ? fb.name + ': ' : '') + `${ing(first.k)} ${KE.clock((first.outHour - KE.OPEN_HOUR) * 60)} civarı biter` + (f.top ? ` · en çok satan: ${pn(f.top)}` : ''), btn: fb.stockLevel < 1.5 && !KE.isManaged(G, fb) ? ['Bol sipariş', `data-a="advBol" data-id="${fb.id}"`] : ['Hal', 'data-a="go" data-s="hal"'] });
    } else out.push({ id: 'stok', ic: 'cart', ok: true, label: 'Stok bugüne yeter', bad: '', btn: null });
    const cheap = G.branches.filter((b) => !KE.isManaged(G, b) && KE.priceRatio(G, b) < 0.95), dear = G.branches.filter((b) => KE.priceRatio(G, b) > KE.priceTolerance(G, b) + 0.05);
    out.push({ id: 'fiyat', ic: 'coin', ok: !cheap.length && !dear.length, label: cheap.length || dear.length ? 'Fiyatları gözden geçir' : 'Fiyatlar güncel', bad: cheap.length ? 'piyasanın gerisinde' : dear.length ? 'müşteriyi kaçıracak kadar pahalı' : '', btn: cheap.length || dear.length ? ['Piyasaya çek', `data-a="advPrices" data-id="${(cheap[0] || dear[0]).id}"`] : null });
    out.push({ id: 'olay', ic: 'bolt', ok: !G.pendingEvent, label: G.pendingEvent ? 'Bekleyen bir karar var' : 'Bekleyen karar yok', bad: G.pendingEvent ? 'olay kartı cevap bekliyor' : '', btn: G.pendingEvent ? ['Kartı aç', 'data-a="showEventCard"'] : null });
    return out;
  }
  function checklistOk() { return checks().every((c) => c.ok); }
  function checklist() {
    const list = checks(), all = list.every((c) => c.ok);
    return `<section class="checklist ${all ? 'allok' : ''}"><span class="kicker">${IC('check')}Açılış kontrolü${all ? ' · hepsi tamam, kepengi açabilirsin' : ''}</span><div class="ck-grid">${list.map((c) => `<div class="ck ${c.ok ? 'ok' : 'no'}"><i>${IC(c.ok ? 'check' : c.ic)}</i><span><b>${c.label}</b>${c.ok ? '' : `<small>${esc(c.bad)}</small>`}</span>${c.btn ? `<button class="btn xs gold" ${c.btn[1]}>${esc(c.btn[0])}</button>` : ''}</div>`).join('')}</div></section>`;
  }
  A.topUpAll = () => { let c = 0; KE.G.branches.forEach((b) => { c += KE.topUpToday(KE.G, b); }); UI.toast(c ? `Bugünün ihtiyacı tamamlandı: ${KE.tl(c)}.` : 'Stok bugüne zaten yetiyor.', 'good'); UI.render(); };
  A.showEventCard = () => H.showEvent();

  /* Günün hedefleri */
  function dailyHtml(live) {
    const list = live ? KE.dailyProgress(KE.G, false) : (KE.G.daily || []).map((g) => Object.assign({}, g, { p: 0, state: 'open' }));
    if (!list.length) return '';
    return `<div class="daily">${list.map((g) => `<div class="dg ${g.state} ${g.bonus ? 'bonus' : ''}"><i>${IC(g.state === 'done' || g.state === 'ok' ? 'check' : g.state === 'fail' ? 'bolt' : 'target')}</i><span><b>${g.text}</b>${live && ['served', 'tips', 'match', 'player'].includes(g.kind) ? bar(g.p * 100, g.state === 'done' ? 'ok' : 'or') : ''}</span><em>+${KE.tl(g.reward)}</em></div>`).join('')}</div>`;
  }

  /* Ekip paneli: görev seçimi (sabah ve servis) */
  const POS_IC = { ocak: 'fire', kasa: 'cash', servis: 'tray', temizlik: 'broom', paket: 'scooter', yonetim: 'chart', mola: 'pause' };
  /* Ekip panosu: görevler sütun sütun; bir kişiye dokun, sonra gideceği sütuna (masaüstünde sürükle-bırak da olur) */
  function crewBoard(b, live) {
    const st = KE.branchStaff(KE.G, b);
    const cols = ['ocak', 'kasa', 'servis', 'temizlik', 'paket', 'yonetim', 'mola'].filter((p) => p === 'mola' || st.some((s) => KE.POSITIONS[s.role].includes(p)));
    const pick = UI.crewPick && st.find((s) => s.id === UI.crewPick);
    const cooking = live ? KE.cookingStaff(KE.G, b) : [];
    return `<div class="crewboard ${pick ? 'picking' : ''}">${cols.map((p) => {
      const can = pick && KE.POSITIONS[pick.role].includes(p) && pick.pos !== p;
      const here = st.filter((s) => s.pos === p);
      return `<div class="cb-col ${can ? 'drop' : ''} ${pick && !can && pick.pos !== p ? 'dim' : ''}" data-a="${can ? 'boardDrop' : 'noop'}" data-p="${p}" data-col="${p}"><div class="cb-h">${IC(POS_IC[p])}<b>${KE.POS_NAMES[p]}</b><small>${here.length}${p === 'ocak' ? '/' + KE.stations(KE.G, b) : ''}</small></div>
        ${here.map((s) => `<button class="cb-chip ${UI.crewPick === s.id ? 'sel' : ''} ${live && p === 'ocak' && !cooking.includes(s) ? 'idle' : ''}" draggable="true" data-a="boardPick" data-id="${s.id}" title="${esc(roleName(s))}"><span class="avatar xs">${KE.portrait(KE.staffLook(s), { mood: KE.moodFromValue(s.morale) })}</span><span><b>${esc(s.name.replace(' Usta', ''))}</b><i class="cb-e" style="width:${Math.round(s.energy)}%"></i></span></button>`).join('') || '<small class="muted cb-empty">boş</small>'}
      </div>`;
    }).join('')}</div><p class="tiny muted">${pick ? `<b>${esc(pick.name)}</b> seçildi: gideceği sütuna dokun.` : 'Bir kişiye dokun, sonra görev sütununa dokun. Masaüstünde sürükleyip bırakabilirsin.'}</p>`;
  }
  A.noop = () => { if (UI.crewPick) { UI.crewPick = null; refreshCrew(); } };
  A.boardPick = (d) => { UI.crewPick = UI.crewPick === d.id ? null : d.id; refreshCrew(); };
  A.boardDrop = (d) => { const id = UI.crewPick; UI.crewPick = null; if (id) A.setPos({ id, p: d.p }); else refreshCrew(); };
  A.crewView = (d) => { try { localStorage.setItem('kebab-empire-crewview', d.v); } catch (e) { /* yok */ } UI.crewPick = null; refreshCrew(true); };
  const crewViewPref = () => { try { return localStorage.getItem('kebab-empire-crewview') || 'liste'; } catch (e) { return 'liste'; } };
  function refreshCrew(full) {
    const cr = document.getElementById('crew');
    if (cr && KE.G.phase !== 'morning' && !full) UI.patch(cr, crewPanel(B(), true)); else UI.render();
  }
  document.addEventListener('dragstart', (e) => { const el = /** @type {any} */ (e.target).closest && /** @type {any} */ (e.target).closest('.cb-chip'); if (el) { UI.crewPick = el.dataset.id; e.dataTransfer.setData('text/plain', el.dataset.id); } });
  document.addEventListener('dragover', (e) => { const col = /** @type {any} */ (e.target).closest && /** @type {any} */ (e.target).closest('.cb-col'); if (col) e.preventDefault(); });
  document.addEventListener('drop', (e) => {
    const col = /** @type {any} */ (e.target).closest && /** @type {any} */ (e.target).closest('.cb-col'); if (!col) return;
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || UI.crewPick; UI.crewPick = null;
    const s = KE.staffById(KE.G, id);
    if (s && KE.POSITIONS[s.role].includes(col.dataset.col) && s.pos !== col.dataset.col) { UI.snapUndo(s.name + ' → ' + KE.POS_NAMES[col.dataset.col]); A.setPos({ id, p: col.dataset.col }); UI.undoChip(); } else refreshCrew();
  });
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
    const view = crewViewPref();
    const tog = `<div class="seg crewview">${[['liste', 'Liste'], ['pano', 'Pano']].map(([v, l]) => `<button class="${view === v ? 'on' : ''}" data-a="crewView" data-v="${v}"><span>${l}</span></button>`).join('')}</div>`;
    return `<div class="crewhead">${tog}<label class="switch lbl"><input type="checkbox" id="auto-${b.id}" data-c="autoStaff" data-b="${b.id}" ${b.autoStaff ? 'checked' : ''}><i></i><span><b>Otomatik ekip yönetimi</b><small>${mgr ? `Müdür ${esc(mgr.name)} yoğunluğa göre görev ve mola düzenler.` : KE.G.branches.length >= 2 ? 'Müdür yok: yalnızca bitkin düşenleri molaya gönderir. Görevleri sen ayarla.' : 'Bitkin düşenleri molaya gönderir. Görevleri sen ayarla.'}</small></span></label></div>
      ${view === 'pano' && st.length ? crewBoard(b, live) : `<div class="crewlist">${rows || '<p class="muted">Bu şubede henüz kimse yok.</p>'}</div>`}`;
  }

  function serviceView() {
    const b = B();
    const closing = KE.G.phase === 'closing';
    const L = KE.G.live && KE.G.live[b.id];
    return `<main class="screen wide svc">
      <div class="servgrid">
        <div class="stagewrap">${KE.SCENE.html(KE.G, b)}<div id="tezgah"></div></div>
        <section class="panel crewcell"><div class="sechead"><h2>Ekip</h2></div><div id="crew">${crewPanel(b, true)}</div></section>
        <aside class="stack side">
          <div class="panel clockpanel"><div class="row between"><div><small class="muted">${esc(b.name)}</small><div class="bigclock" id="clock">${L ? KE.clock(Math.min(L.minute, KE.MINUTES)) : '23:00'}</div></div><div class="jar" title="Bahşiş kavanozu"><i id="jar"></i></div></div>
            ${closing ? `<button class="btn big green block" data-a="showClosing">${IC('chart')}Kapanış raporu</button>` : `<div class="speed seg" role="group" aria-label="Oyun hızı">${[[0, 'stop', 'Dur'], [1, 'play', '1×'], [2, 'ff', '2×'], [4, 'ff', '4×']].map(([v, ic, l]) => `<button class="${KE.G.speed === v ? 'on' : ''} ${v ? '' : 'sp-stop'}" data-a="speed" data-v="${v}" aria-pressed="${KE.G.speed === v}">${IC(ic)}<span>${l}</span></button>`).join('')}</div>`}
          </div>
          <div class="panel" id="livestats"></div>
          ${closing ? '' : `<div class="panel stack"><button class="btn gold block" id="tezgahBtn" data-a="tezgah">${IC('chef')}<span>${L && L.player.active ? 'Tezgâhtan çık' : 'Tezgâha geç'}</span></button><button class="btn sm ghost block" data-a="fastForward">${IC('ff')}Günü hızlı bitir</button><div id="courierbox">${UI.courierHtml()}</div></div>`}
          ${(KE.G.daily || []).length && !closing ? '<div class="panel"><h3>Günün hedefleri</h3><div id="dailylive"></div></div>' : ''}
          ${KE.G.branches.length > 1 ? '<div class="panel"><h3>Bütün şubeler</h3><div id="branchlive"></div></div>' : ''}
        </aside>
      </div></main>`;
  }

  /* ---------- Canlı döngü ---------- */
  let acc = 0, lastT = 0;
  /* 50 ms'lik döngü yalnızca servis sürerken ve sayfa görünürken çalışır */
  UI.startLoop = function () {
    if (UI.timer || document.visibilityState === 'hidden' || !KE.G || KE.G.phase !== 'service') return;
    lastT = performance.now();
    UI.timer = setInterval(loop, 50);
  };
  UI.stopLoop = function () { if (UI.timer) { clearInterval(UI.timer); UI.timer = null; } };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') UI.stopLoop(); else UI.startLoop(); });
  /* görünmeyen şubelerin efektleri birikmesin (efekt yalnızca sunumdur; motor okumaz) */
  const FX_KEEP = 10;
  function trimFx() {
    Object.keys(KE.G.live).forEach((id) => {
      const L = KE.G.live[id];
      if (L && L.fx && L.fx.length > FX_KEEP && (id !== KE.G.activeBranch || UI.screen !== 'shop')) L.fx.splice(0, L.fx.length - FX_KEEP);
    });
  }
  function loop() {
    const now = performance.now();
    const dt = Math.min(200, now - lastT); lastT = now;
    if (!KE.G || KE.G.phase !== 'service' || !KE.G.live) { UI.stopLoop(); return; }
    if (document.querySelector('.modal-bg') || document.querySelector('.tut')) return;
    if (!KE.G.speed) return;
    acc += dt * KE.G.speed;
    let ticked = false;
    while (acc >= KE.MINUTE_MS) { acc -= KE.MINUTE_MS; KE.tickAll(KE.G); ticked = true; if (KE.allDone(KE.G) || KE.midPending(KE.G)) break; }
    if (ticked) trimFx();
    if (KE.midPending(KE.G)) { acc = 0; showMid(); return; }
    if (ticked) {
      const L = KE.G.live[KE.G.activeBranch];
      if (L && L.player.active) { while (KE.act(KE.G, 'ptake')); renderTezgah(); }
      UI.sceneTick();
    }
    if (KE.allDone(KE.G)) {
      KE.finishService(KE.G);
      UI.stopLoop();
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
      UI.patch(ls, `<div class="minikpis"><div><small>Ciro</small><b>${KE.tl(S.revenue)}</b></div><div><small>Bahşiş</small><b>${KE.tl(S.tips)}</b></div><div><small>Servis</small><b>${S.served}</b></div><div><small>Kaçan</small><b class="${S.lost ? 'neg' : ''}">${S.lost}</b></div></div>
        <div class="statl"><span>Memnuniyet</span>${bar(sat, sat < 60 ? 'crit' : sat < 72 ? 'warn' : 'ok')}<b>${S.satN ? Math.round(sat) : '–'}</b></div>
        ${outs.length ? `<div class="alert crit sm">${IC('bolt')}<span>Biten: ${outs.map(pn).join(', ')}</span></div>` : ''}`);
    }
    const dl = document.getElementById('dailylive');
    if (dl && (force || tickN % 3 === 0)) {
      const html = dailyHtml(true);
      const doneNow = (html.match(/dg done/g) || []).length;
      if (UI.dailyDone != null && doneNow > UI.dailyDone) { UI.toast('Günün hedefi tamam!', 'gold'); }
      UI.dailyDone = doneNow;
      UI.patch(dl, html);
    }
    const bl = document.getElementById('branchlive');
    if (bl) UI.patch(bl, KE.G.branches.map((x) => { const l = KE.G.live[x.id]; const s2 = l.stats; return `<button class="blrow ${x.id === b.id ? 'on' : ''}" data-a="viewBranch" data-id="${x.id}"><b>${esc(x.name)}</b><span>${l.closed ? 'Kapalı' : l.done ? 'Kapandı' : `${l.queue.length} sırada`}</span><span>${KE.tl(s2.revenue)}</span><span>${s2.satN ? '%' + Math.round(s2.satSum / s2.satN) : '–'}</span></button>`; }).join(''));
    if (force || tickN % 3 === 0) {
      const cr = document.getElementById('crew');
      if (cr && !(UI.crewHover && Date.now() - UI.crewHover < 1500)) UI.patch(cr, crewPanel(b, true));
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
  /* Konfeti: en çok 20 parça; servis sürerken (sahne oynarken) ve hareketi azaltta yok; üst üste tetiklenmez */
  UI.confetti = function () {
    if (UI.calm() || (KE.G && KE.G.phase === 'service') || document.querySelector('.confetti')) return;
    const box = document.createElement('div');
    box.className = 'confetti';
    const cols = ['var(--altin)', 'var(--biber)', 'var(--nane)', 'var(--cini-light)', 'var(--kor)'];
    for (let i = 0; i < 20; i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + '%'; p.style.background = cols[i % 5]; p.style.animationDelay = Math.random() * 0.4 + 's'; p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px'); box.appendChild(p); }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2400);
  };
  /* Tezgâh: üstte sipariş rayı (2-3 fiş), altta 6 büyük istasyon. Sıradaki adım hangi istasyondaysa o parlar. */
  let tzLast = {};
  /* fişin rayda ilk görüldüğü an: yeni fiş 220 ms boyunca giriş hareketini sürdürür (her dakika yeniden çizilse de) */
  let tzBorn = {};
  const TZ_IN = 220;
  /* h: ResizeObserver'ın verdiği yerleşim yüksekliği (giriş animasyonunun ölçeği karışmaz); yoksa ölçülür */
  const tzHeight = (el, h) => {
    if (h == null) h = el && el.isConnected ? el.getBoundingClientRect().height : 0;
    if (h && Math.abs(h - (UI.tzh || 0)) > 2) { UI.tzh = h; document.documentElement.style.setProperty('--tzh', Math.round(h) + 'px'); }
  };
  let tzObserved = null;
  const tzRO = typeof ResizeObserver === 'function' ? new ResizeObserver((list) => { const e = list[list.length - 1]; const bb = e.borderBoxSize && e.borderBoxSize[0]; tzHeight(e.target, bb ? bb.blockSize : e.target.getBoundingClientRect().height); tzHide.layout(); }) : null;

  /* Tezgâh açıkken sayfa düzeni sınıflarla seçilir: main.tzm (servis ekranı), body.tzpg (bildirimler). Eskiden
     main:has(.stagewrap.tzon) / body:has(...) idi; :has() her oyun dakikasındaki yüzlerce DOM değişikliğinde body ve
     main için yeniden denetleniyor, main'in bütün alt ağacının stilini yeniden hesaplatıyordu. */
  function tzMark(wrap, on) {
    wrap.classList.toggle('tzon', on);
    const main = wrap.closest('main');
    if (main) main.classList.toggle('tzm', on);
    document.body.classList.toggle('tzpg', on);
    tzHide.set(on ? wrap : null);
  }
  /* yeniden çizimde (ekran değişti) servis ekranı kalktıysa sayfa sınıfı ve duraklatmalar da kalkar */
  UI.tzSync = function () {
    if (document.querySelector('main.tzm')) return;
    document.body.classList.remove('tzpg');
    tzHide.set(null);
  };

  /* Tezgâh açıkken görünmeyen parçaların süsleme animasyonları durur. Panelin örttüğü ya da kırpılarak dışarıda kalan
     öğe çizilmez ama animasyonu her karede çalışmaya (stil, birleştirme, kare üretimi) devam ederdi. Adaylar: sahnenin
     sabit parçaları (ocaklar, tabela, pencere, süs), ustaların gözleri (dikey kırpmada baş görünmeyebilir) ve sahnenin
     altındaki yan paneller (telefonda panelin altında kalır). Görünürlüğü IntersectionObserver hesaplar: kök, görüntü
     alanından sabit panelin kapladığı kenar şeridi çıkarılmış alandır (panel boyu değişince, ResizeObserver'dan, bir kez
     yeniden kurulur); kırpma (sahne penceresi) ve kaydırma tarayıcının kendi yerleşiminden gelir, her karede ölçüm yok.
     Tamamen görünmeyen öğe data-tzh alır: CSS animasyonları duraklar, geçişler anlık olur, SVG saati durur. Görünür
     olunca ya da panel kapanınca hemen kalkar; görünen hiçbir şey değişmez. */
  const tzHide = (() => {
    const IO = /** @type {any} */ (window).IntersectionObserver;
    let wrap = null, io = null, margin = '', seen = new WeakSet();
    const SEL = '.st-equip > *, .st-sign, .st-window, .st-bunting, #st-cooks .ke-eye, .servgrid > .crewcell, .servgrid > .side > *';
    /* göz bir figürün parçası: duraklatma figürün (varlığın) kendisine yazılır, figür her dakika yamalansa da kalır */
    const owner = (el) => el.closest('.ent') || el;
    const svgs = (el) => el.querySelectorAll('svg');
    function hide(el, on) {
      const o = owner(el);
      if (on === o.hasAttribute('data-tzh')) return;
      if (on) o.setAttribute('data-tzh', ''); else o.removeAttribute('data-tzh');
      /* SMIL (ör. mangal kömürü) CSS ile durmaz; hareketi azaltta zaten duruktur, o zaman dokunulmaz */
      if (!UI.calm()) svgs(o).forEach((s) => { const v = /** @type {any} */ (s); if (!v.pauseAnimations || !s.querySelector('animate, animateTransform, animateMotion')) return; if (on) v.pauseAnimations(); else v.unpauseAnimations(); });
    }
    function onSeen(list) {
      list.forEach((e) => {
        /* kaldırılan figürün gözü: gözlemden çıkar */
        if (!e.target.isConnected) { io.unobserve(e.target); seen.delete(e.target); return; }
        hide(e.target, !e.isIntersecting);
      });
    }
    /* sabit panelin kapladığı kenar şeridi: altta tam genişlik (dikey telefon) ya da sağda tam yükseklik (yatay) */
    function band() {
      const tz = wrap && wrap.querySelector('.tz2');
      if (!tz || getComputedStyle(tz).position !== 'fixed') return '0px';
      const r = tz.getBoundingClientRect(), W = innerWidth, Hh = innerHeight;
      /* altındaki alt sekme de sabit: şerit panelin üst kenarından ekranın altına kadar */
      if (r.left <= 1 && r.right >= W - 1 && r.top > Hh / 2) return `0px 0px ${-Math.round(Hh - r.top)}px 0px`;
      if (r.top <= 1 && r.bottom >= Hh - 1 && r.right >= W - 1) return `0px ${-Math.max(0, Math.round(W - r.left))}px 0px 0px`;
      return '0px';
    }
    /* all: bütün adaylar (açılışta / kök değişince); yoksa yalnızca usta gözleri (oyuncu ustası tezgâhla gelir,
       figürler her dakika güncellenir; sahnenin sabit parçaları ve paneller yeniden çizime kadar aynı düğümlerdir) */
    function observe(all) {
      if (!io || !wrap) return;
      (all ? (wrap.closest('main') || wrap) : wrap).querySelectorAll(all ? SEL : '#st-cooks .ke-eye').forEach((el) => { if (!seen.has(el)) { seen.add(el); io.observe(el); } });
    }
    function rebuild() {
      if (io) io.disconnect();
      seen = new WeakSet();
      io = new IO(onSeen, { rootMargin: margin });
      observe(true);
    }
    function clear() {
      if (io) { io.disconnect(); io = null; }
      document.querySelectorAll('[data-tzh]').forEach((el) => hide(el, false));
    }
    return {
      set(w) {
        if (!IO) return;
        if (!w) { wrap = null; clear(); return; }
        if (w !== wrap) { clear(); wrap = w; margin = band(); rebuild(); } else observe();
      },
      /* panel boyu / ekran değişti: kök şeridi bir kez yeniden hesapla */
      layout() {
        if (!io || !wrap) return;
        const m = band();
        if (m !== margin) { margin = m; rebuild(); }
      }
    };
  })();
  addEventListener('resize', () => tzHide.layout());
  function renderTezgah() {
    const box = document.getElementById('tezgah');
    const wrap = document.querySelector('.stagewrap');
    if (!box || !KE.G.live) return;
    const G = KE.G, L = G.live[G.activeBranch];
    if (!L) return;
    const P = L.player;
    if (wrap) tzMark(wrap, !!P.active);
    if (!P.active) { box.innerHTML = ''; tzBorn = {}; return; }
    const b = B(), cap = KE.playerCap(G, b), slots = P.slots || [];
    const need = {}, want = {};
    /* istasyon düğmesinde kategori yerine o an gereken malzemenin adı yazar. Sıra, dokununca motorun yapacağıyla
       aynıdır: seçili fişten başlayıp sırayla; ateşte önce pişmiş olan alınır */
    const order = slots.map((_, i) => (i + (P.sel || 0)) % slots.length);
    order.forEach((i) => {
      const sl = slots[i], t = L.tickets.find((x) => x.id === sl.tid);
      if (!t) return;
      const steps = KE.ticketSteps(G, t);
      if (sl.fire != null) { const fs = sl.fst || 'ates'; if (L.minute >= sl.fire) (want[fs] = want[fs] || []).push({ l: steps[sl.step], take: true }); return; }
      const st = KE.stepStation(steps[sl.step]);
      (want[st] = want[st] || []).push({ l: steps[sl.step] });
    });
    Object.keys(KE.TIMED).forEach((k) => { if (want[k]) want[k].sort((a, b) => (b.take ? 1 : 0) - (a.take ? 1 : 0)); });
    const now = Date.now(), calmNow = UI.calm(), born = {};
    const cards = slots.map((sl, i) => {
      const t = L.tickets.find((x) => x.id === sl.tid);
      if (!t) return '';
      born[t.id] = tzBorn[t.id] || now;
      const age = now - born[t.id];
      const enter = !calmNow && age < TZ_IN ? ` enter" style="animation-delay:-${age}ms` : '';
      const p = prod(t.pid), c = t.cid != null ? L.custs[t.cid] : null, steps = KE.ticketSteps(G, t);
      const fs = sl.fst || 'ates';
      const st = sl.fire != null ? fs : KE.stepStation(steps[sl.step]);
      let fire = '';
      if (sl.fire != null) {
        const ft = KE.TIMED[fs](p);
        const left = sl.fire - L.minute;
        const ph = left > 0 ? 'cook' : L.minute > sl.fire + ft.grace ? 'burn' : L.minute > sl.fire + ft.grace - 2 ? 'warn' : 'done';
        const pct = left > 0 ? Math.round((1 - left / ft.cook) * 100) : 100;
        /* kalan süre oyun dakikası: pişerken hazır olmasına, hazırken yanmasına kalan */
        const mins = ph === 'cook' ? left : ph === 'burn' ? 0 : sl.fire + ft.grace - L.minute;
        fire = `<span class="tz-fire ${ph} f-${fs}" style="--p:${pct}">${IC(fs === 'fritoz' ? 'fries' : 'fire')}<b>${ph === 'cook' ? (fs === 'fritoz' ? 'Kızarıyor' : 'Pişiyor') : ph === 'burn' ? 'Yanıyor!' : 'Al!'}</b>${mins > 0 ? `<em>${mins} dk</em>` : ''}</span>`;
        if (ph !== 'cook') need[fs] = Math.max(need[fs] || 0, i === P.sel ? 2 : 1);
      } else need[st] = Math.max(need[st] || 0, i === P.sel ? 2 : 1);
      /* özel fiş etiketleri: menü (+patates), acele (süre), gurme */
      const rushLeft = t.rush ? Math.ceil(p.prep * 1.25 - (L.minute - (t.firstTake != null ? t.firstTake : sl.start))) : 0;
      const tags = (t.menu ? `<span class="tz-tag menu">${IC('fries')}Menü</span>` : '') + (t.rush ? `<span class="tz-tag rush ${rushLeft <= 0 ? 'late' : ''}">${IC('bolt')}${rushLeft > 0 ? `Acele ${rushLeft} dk` : 'Acele'}</span>` : '') + (t.gurme ? `<span class="tz-tag gurme">${IC('star')}Gurme</span>` : '');
      const pat = c ? clamp(1 - c.wait / (c.patience * 2.6), 0, 1) : 1;
      return `<button class="tz-card ${i === P.sel ? 'sel' : ''} ${sl.errors ? 'err' : ''}${enter}" data-a="psel" data-i="${i}" data-tid="${t.id}" aria-label="${esc(p.name)}">
        <span class="tz-cd">${KE.ART.dish(p.id)}${t.count > 1 ? `<b>×${t.count}</b>` : ''}</span>
        <span class="tz-cb"><b class="tz-cn">${esc(p.name)}${t.paket ? ' · paket' : ''}</b>${tags || fire ? `<span class="tz-tags">${fire}${tags}</span>` : ''}
          <span class="tz-rec">${steps.map((x, k) => { const sid = KE.stepStation(x); const S = KE.STATIONS.find((y) => y.id === sid); return `<i class="${k < sl.step ? 'done' : k === sl.step ? 'now' : ''} s-${sid}">${IC(k < sl.step ? 'check' : S.ic)}<em>${esc(x)}</em></i>`; }).join('')}</span></span>
        <span class="tz-pat"><i style="width:${Math.round(pat * 100)}%" class="${pat < 0.3 ? 'crit' : pat < 0.6 ? 'warn' : ''}"></i></span></button>`;
    }).join('') + Array.from({ length: Math.max(0, cap - slots.length) }, () => `<div class="tz-card empty">${IC('clock')}<span>${P.afk ? 'Mola verdin. Bir istasyona dokun, fiş gelsin.' : 'Sipariş bekleniyor'}</span></div>`).join('');
    const stations = KE.STATIONS.map((S) => {
      const w = want[S.id] || [], f = w[0];
      /* "+ ikinci" ayrı düğümde: çeviri malzeme adını tek başına bulur */
      const sub = f ? (f.take ? esc('Al!') : w[1] ? `+ <span>${esc(w[1].l)}</span>` : f.l !== S.name ? esc(S.name) : '') : '';
      return `<button class="tz-st s-${S.id} ${need[S.id] === 2 ? 'hot' : need[S.id] ? 'warm' : ''} ${f ? 'has' : ''} ${f && f.take ? 'take' : ''}" data-a="pst" data-s="${S.id}" aria-label="${esc(f ? f.l : S.name)}">${IC(S.ic)}<span class="tz-sl"><b>${esc(f ? f.l : S.name)}</b>${sub ? `<small>${sub}</small>` : ''}</span><kbd>${S.key}</kbd></button>`;
    }).join('');
    const Q = P.quest;
    const notMain = G.branches.length > 1 && b.id !== KE.mainBranchId(G);
    const quest = notMain ? `<span class="tz-quest off">${IC('target')}<span>Görevler ana şubede</span></span>` : Q ? `<span class="tz-quest" title="Art arda hatasız siparişler">${IC('target')}<span>Görev</span><i class="tz-qbar">${Array.from({ length: Q.need }, (_, k) => `<em class="${k < Q.done ? 'on' : ''}"></em>`).join('')}</i><b>+${KE.tl(Q.reward)}</b></span>` : '';
    /* başlık satırı hep görünür: kombo, görev ve sağ kenarda (başparmak tarafı) duraklat / hız / günü bitir / çık */
    const spd = G.speed || 0, nextSp = spd === 1 ? 2 : spd === 2 ? 4 : 1;
    const ctl = `<span class="tz-ctl">
      <button class="tz-ib tz-pause ${spd ? '' : 'on'}" data-a="speed" data-v="${spd ? 0 : 1}" aria-pressed="${!spd}" aria-label="${spd ? 'Dur' : 'Devam'}" title="${spd ? 'Dur' : 'Devam'}">${IC(spd ? 'stop' : 'play')}</button>
      <button class="tz-ib tz-spd" data-a="speed" data-v="${nextSp}" aria-label="Oyun hızı" title="Oyun hızı"><b>${spd || 1}×</b></button>
      <button class="tz-ib tz-ff" data-a="fastForward" aria-label="Günü hızlı bitir" title="Günü hızlı bitir">${IC('ff')}</button>
      <button class="tz-ib tz-x" data-a="tezgah" aria-label="Tezgâhtan çık" title="Tezgâhtan çık">${IC('x')}</button></span>`;
    const top = `<span class="kicker">${IC('chef')}Tezgâh</span>${quest}<span class="tz-stats"><span class="chip tz-combo ${P.combo >= 2 ? 'gold' : ''}">Kombo ×${P.combo || 0}</span><span class="chip tz-done">Hazır ${P.done || 0}</span>${P.burned ? `<span class="chip rd">Yanan ${P.burned}</span>` : ''}</span>${ctl}`;
    /* panel her dakika yenilenir; yalnızca değişen parça yeniden çizilir, istasyon düğmeleri gereksiz yere değişmez
       (parmağın altındaki düğme kaybolmasın) */
    if (!box.querySelector('.tz2')) { box.innerHTML = '<div class="tz2"><div class="tz-top"></div><div class="tz-rail"></div><div class="tz-sts" id="stepbtns"></div></div>'; tzLast = {}; }
    box.firstElementChild.classList.toggle('onfire', (P.combo || 0) >= 3);
    tzBorn = born;
    [['.tz-top', top], ['.tz-rail', cards], ['.tz-sts', stations]].forEach(([sel, html]) => {
      if (tzLast[sel] === html) return;
      const el = box.querySelector(sel);
      /* biten / raydan kalkan fiş: eski kartın kopyası aynı yerde kısa bir çıkış oynar (yalnızca o an ölçülür) */
      const ghosts = [];
      if (sel === '.tz-rail' && !calmNow) el.querySelectorAll('.tz-card[data-tid]:not(.leave)').forEach((c) => {
        const h = /** @type {HTMLElement} */ (c);
        if (born[h.dataset.tid]) return;
        const g = /** @type {HTMLElement} */ (h.cloneNode(true));
        g.className = 'tz-card leave'; g.removeAttribute('data-a'); g.removeAttribute('data-tid'); g.setAttribute('aria-hidden', 'true'); g.removeAttribute('style');
        g.style.left = h.offsetLeft + 'px'; g.style.top = h.offsetTop + 'px'; g.style.width = h.offsetWidth + 'px'; g.style.height = h.offsetHeight + 'px';
        ghosts.push(g);
      });
      el.innerHTML = html; tzLast[sel] = html;
      ghosts.forEach((g) => { el.appendChild(g); const rm = () => g.remove(); g.addEventListener('animationend', rm); setTimeout(rm, 400); });
    });
    /* sabit panelin yüksekliği: sahne kırpması ve sayfa boşluğu buna göre. Her dakika DOM yazımından sonra ölçmek
       zorunlu yerleşim demekti: ResizeObserver panel boyu değişince (boyamadan önce) bildirir. */
    const tz = box.firstElementChild;
    if (tzRO) { if (tz && tzObserved !== tz) { tzObserved = tz; tzRO.disconnect(); tzRO.observe(tz); } }
    else tzHeight(tz);
  }

  /* ---------- Gün ortası kararı ---------- */
  function showMid() {
    const G = KE.G, M = G.mid, D = KE.MIDS.find((x) => x.id === M.id), b = G.branches.find((x) => x.id === M.bid);
    UI.modal(`<div class="mhead"><span class="kicker">${IC(D.ic)}${G.branches.length > 1 ? esc(b.name) + ' · ' : ''}${KE.clock(G.live[b.id].minute)}</span><h2>${esc(D.title)}</h2><p class="lead">${esc(D.text(G, b, M))}</p></div>
      <div class="choices">${D.choices(G).map((c, i) => `<button class="choice" data-a="midChoice" data-i="${i}"><b>${esc(c.label)}</b><small>${esc(c.desc)}</small></button>`).join('')}</div>
      <p class="tiny muted">${KE.branchStaff(G, b).some((s) => s.role === 'mudur') ? `Karar vermezsen ${KE.MID_WAIT} dakika sonra müdür "${esc(D.choices(G)[D.mgr].label)}" der.` : `Karar vermezsen ${KE.MID_WAIT} dakika sonra "${esc(D.choices(G)[D.def].label)}" uygulanır.`}</p>`, { cls: 'midev' });
  }
  H.showMid = showMid;

  /* ---------- Kapanış ---------- */
  function showClosing() {
    const S0 = KE.G.lastSummary;
    const rule = UI.todayRule || KE.G.tipRule;
    const tab = UI.closeTab && S0.branches[UI.closeTab] ? UI.closeTab : KE.G.activeBranch;
    const b = KE.branchById(KE.G, tab);
    const sum = S0.branches[b.id], S = sum.stats;
    const prods = Object.entries(S.byProduct).sort((a, c) => c[1] - a[1]);
    const maxP = Math.max(1, ...prods.map((x) => x[1]));
    const tot = KE.G.branches.reduce((a, x) => a + S0.branches[x.id].stats.revenue, 0);
    const tips = KE.G.branches.reduce((a, x) => a + S0.branches[x.id].stats.tips, 0);
    const preview = KE.tipShares(KE.G, b, rule, S.tips);
    const html = `<div class="mhead split"><div><span class="kicker">${KE.dateStr(KE.G.day)} · ${KE.weekday(KE.G.day)}</span><h2>Gün sonu raporu</h2></div>${npc('zeynep', sum.sat > 75 ? 'Güzel bir gün, patron. Rakamlar yüz güldürüyor.' : 'Rakamlara birlikte bakalım; düzeltecek şeyler var.')}</div>
      ${KE.G.branches.length > 1 ? `<div class="kpis"><div class="kpi">${IC('coin')}<small>Bütün şubeler ciro</small><b>${KE.tl(tot)}</b></div><div class="kpi">${IC('gift')}<small>Bütün şubeler bahşiş</small><b>${KE.tl(tips)}</b></div></div>
        <div class="tabs">${KE.G.branches.map((x) => `<button class="tab ${x.id === tab ? 'on' : ''}" data-a="closeTab" data-id="${x.id}">${esc(x.name)}</button>`).join('')}</div>` : ''}
      ${closeSummary(b, S, sum)}
      ${promoCard(S0)}
      <details class="closedet"><summary>${IC('chart')}Ayrıntılar: rakamlar, satılan ürünler, kim ne kadar bahşiş alır</summary></details>
      <section class="tipbox"><h3>${IC('gift')}Bahşiş dağıtımı <small class="muted">Bütün şubelerde uygulanır</small></h3>
        <div class="seg wide">${Object.entries(KE.TIP_RULES).map(([k, r]) => `<button class="${rule === k ? 'on' : ''}" data-a="tipToday" data-r="${k}"><span>${r.name}${k === KE.G.tipRule ? ' (varsayılan)' : ''}</span></button>`).join('')}</div>
        <p class="small">${KE.TIP_RULES[rule].desc}${rule !== KE.G.tipRule ? ` <b>Yalnızca bugün için.</b> <button class="btn xs ghost" data-a="tipRule" data-r="${rule}">Hep böyle yap</button>` : ''}</p>
        ${KE.G.tipWish ? `<p class="small tipwish ${rule === KE.G.tipWish.rule ? 'ok' : ''}">${IC('heart')}<span>Ekip bu hafta <b>${KE.TIP_RULES[KE.G.tipWish.rule].name}</b> istiyor. Bu kuralı seçtiğin her gün herkesin morali biraz daha artar.</span></p>` : ''}</section>
      <div class="acts"><button class="btn big green" data-a="finalize">${IC('check')}Bahşişi dağıt ve günü kapat</button></div>`;
    document.querySelectorAll('.modal-bg').forEach((m) => m.remove());
    UI.modal(html, { wide: true });
    /* iki aşamalı çizim: özet hemen, kapalı "Ayrıntılar" bölümünün içi (ürün çubukları, bahşiş payları, portreler)
       ilk boyamadan sonra eklenir; uzun tek görev ikiye bölünür, son DOM aynıdır */
    const det = document.querySelector('.modal .closedet');
    const fill = () => { const d = /** @type {any} */ (det); if (d && d.isConnected && !d._filled) { d._filled = true; d.insertAdjacentHTML('beforeend', detailsHtml()); } };
    if (det) { det.addEventListener('toggle', fill, { once: true }); requestAnimationFrame(() => setTimeout(fill, 0)); }
    function detailsHtml() {
      return `<div class="kpis">
        <div class="kpi">${IC('coin')}<small>Ciro</small><b>${KE.tl(S.revenue)}</b></div>
        <div class="kpi">${IC('users')}<small>Müşteri</small><b>${S.served}</b></div>
        <div class="kpi">${IC('heart')}<small>Memnuniyet</small><b>${KE.pct(Math.round(sum.sat))}</b></div>
        <div class="kpi">${IC('gift')}<small>Bahşiş</small><b>${KE.tl(S.tips)}</b></div>
      </div>
      ${advice(b, S).slice(1).map((a) => `<div class="alert ${a[0]}">${IC(a[0] === 'ok' ? 'check' : 'bolt')}<span>${a[1]}</span></div>`).join('')}
      <div><h4>Satılan ürünler</h4><div class="prodbars">${prods.map(([pid, n]) => `<div class="pbar">${KE.ART.dish(pid)}<span>${pn(pid)}</span>${bar(n / maxP * 100, 'or')}<b>${n}</b></div>`).join('') || '<p class="muted">Satış yok</p>'}</div></div>
      <div class="shares">${preview.map(([s, v]) => `<div class="share"><span class="avatar sm">${KE.portrait(KE.staffLook(s), { mood: KE.moodFromValue(s.morale) })}</span><span><b>${esc(s.name)}</b><small>${roleName(s)} · ${Math.round(s.servedToday)} iş</small></span><b class="num">${KE.tl(v)}</b></div>`).join('')}</div>`;
    }
  }

  /* Kapanış: üç satırlık özet (kazanç, en büyük kayıp, yarın için tek öneri) */
  /* Marka kuponu (marka ayarında tanımlıysa): günün hedefleri tamamlanınca kapanışta çıkar */
  function promoCard(S0) {
    const BR = KE.BRAND;
    if (!BR || !BR.promo) return '';
    /* kapanışta günün özeti henüz yok (finalizeDay'de dolar): hedefleri canlı sayaçlardan, gün bitmiş sayarak hesapla.
       Bonus (tezgâh) hedefi isteğe bağlı olduğu için kupon şartına girmez. */
    const goals = KE.dailyProgress(KE.G, true).filter((g) => !g.bonus);
    const P = BR.promoFor(KE.G, goals.filter((g) => g.state === 'done').length, goals.length);
    if (!P) return '';
    return `<section class="promo"><div class="promo-ic">${IC('gift')}</div><div class="promo-b"><span class="kicker"${P.title ? ' translate="no"' : ''}>${esc(BR.text(P.title) || 'Ödül kuponu')}</span><p translate="no">${esc(BR.text(P.text))}</p>
      <div class="promo-code"><b id="promocode" translate="no">${esc(P.code)}</b><button class="btn sm" data-a="copyPromo">${IC('check')}Kopyala</button>${P.url ? `<a class="btn sm green" href="${esc(P.url)}" target="_blank" rel="noopener"${P.urlLabel || BR.hasOrderLabel ? ' translate="no"' : ''}>${esc(BR.text(P.urlLabel) || BR.text(BR.orderLabel) || 'Sipariş ver')}</a>` : ''}</div>
      ${P.terms ? `<small class="muted" translate="no">${esc(BR.text(P.terms))}</small>` : ''}</div></section>`;
  }
  function closeSummary(b, S, sum) {
    const lostAll = S.lostWait + S.lostFull + S.lostFood + S.lostPrice + S.lostStock;
    const big = [[S.lostWait, 'kuyrukta bekleyemedi'], [S.lostFood, 'yemeğini bekleyemedi'], [S.lostFull, 'yer bulamadı'], [S.lostPrice, 'fiyatı pahalı buldu'], [S.lostStock, 'istediğini bulamadı']].sort((a, c) => c[0] - a[0])[0];
    const adv = advice(b, S)[0];
    const pct = S.arrivals ? Math.round(lostAll / S.arrivals * 100) : 0;
    const capLoss = S.lostWait + S.lostFull + S.lostFood, avg = S.served ? S.revenue / S.served : 0;
    const M = KE.G.mid;
    return `<div class="closesum">
      <div class="cs-row">${IC('coin')}<span><small>Bugün</small><b>${KE.tl(S.revenue)} ciro · ${S.served} müşteri · memnuniyet ${KE.pct(Math.round(sum.sat))}</b></span></div>
      <div class="cs-row ${pct >= 12 ? 'bad' : ''}">${IC('queue')}<span><small>En büyük kayıp</small><b>${big[0] >= 3 ? `${big[0]} müşteri ${big[1]} (gelenlerin %${KE.ekSayi(String(pct), 'i')} kaçtı)` : 'Kayda değer kayıp yok'}</b>${capLoss >= 3 && avg ? `<em class="cs-note">Kapasite yetmediği için kaçanların değeri yaklaşık ${KE.tl(Math.round(capLoss * avg / 100) * 100)}.</em>` : ''}${S.turned ? `<em class="cs-note">Rezervasyon: ${S.turned} kişi başka saate yönlendirildi (kaçmış sayılmaz).</em>` : ''}</span></div>
      <div class="cs-row ${adv[0]}">${IC(adv[0] === 'ok' ? 'check' : 'bolt')}<span><small>Yarın için</small><b>${adv[1]}</b></span></div>
      ${M && M.choice != null && M.bid === b.id ? `<div class="cs-row">${IC((KE.MIDS.find((x) => x.id === M.id) || {}).ic || 'bolt')}<span><small>${M.byMgr ? 'Gün ortası · müdür karar verdi' : 'Gün ortası'}</small><b><span>${esc(KE.MIDS.find((x) => x.id === M.id).title)}</span> → <span>${esc(KE.MIDS.find((x) => x.id === M.id).choices(KE.G)[M.choice].label)}</span></b>${M.late ? '<em class="cs-note">Tamirci trafiğe takıldı; ocak bir saat soğuk kaldı.</em>' : ''}</span></div>` : ''}
    </div>`;
  }
  /* Kapanışta yalnızca harekete geçirilebilir öneriler */
  function advice(b, S) {
    const out = [];
    const st = KE.branchStaff(KE.G, b);
    const freeSt = KE.stations(KE.G, b) - st.filter(KE.isCook).length;
    const lost = [[S.lostWait, 'beklemekten sıkılıp gitti', KE.canHire(KE.G, b, 'kasiyer').ok ? 'Kasaya ya da servise bir kişi daha al; yoğun saatte molaları azalt.' : 'Salon kadrosu dolu: önce salonu büyüt, sonra eleman al.'],
      [S.lostFood, 'yemeğini beklerken kalktı', freeSt > 0 && KE.canHire(KE.G, b, 'usta').ok ? `Mutfak yetişmiyor: ${freeSt} ocak yeri boş, bir pişirmeci al.` : 'Mutfak yetişmiyor: önce ocağı büyüt, sonra pişirmeci al.'],
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
      out.tipWishEnd ? (out.tipWishEnd.missed ? `<li class="neg">${IC('heart')}<span>Ekip bu hafta <b>${KE.TIP_RULES[out.tipWishEnd.rule].name}</b> istemişti; ${out.tipWishEnd.days} günün ${out.tipWishEnd.hits}'inde uygulandı. Biraz küstüler: herkesin morali −2.</span></li>` : `<li class="pos">${IC('heart')}<span>Ekibin haftalık isteği karşılandı (${out.tipWishEnd.days} günün ${out.tipWishEnd.hits}'inde ${KE.TIP_RULES[out.tipWishEnd.rule].name}).</span></li>`) : '',
      out.inspect ? (out.inspect.pass ? `<li class="pos">${IC('star')}<span><b>Rehber yıldızı!</b> Müfettiş ${esc(out.inspect.branch)} şubesinden memnun ayrıldı (memnuniyet ${KE.pct(out.inspect.sat)}). Zincirin ${out.inspect.stars}. yıldızı: müşteri ve fiyat toleransı kalıcı olarak +%3, itibar +3.</span></li>` : `<li class="neg">${IC('star')}<span><b>Rehber müfettişi memnun kalmadı.</b> ${esc(out.inspect.branch)}: memnuniyet ${KE.pct(out.inspect.sat)}, kaçan müşteri ${KE.pct(out.inspect.lost)}. Yıldız için %84 memnuniyet ve %10'dan az kayıp gerekir. İtibar −5.</span></li>`) : '',
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
    const brRows = compact ? `<div class="tablewrap"><table class="fin"><thead><tr><th>Şube</th><th class="r">Müşteri</th><th class="r">Ciro</th><th class="r">Net</th><th class="r">Memnuniyet</th></tr></thead><tbody>${KE.G.branches.map((b) => { const e = out.branches[b.id]; return e ? `<tr><td><b>${esc(b.name)}</b></td><td class="r">${e.served}</td><td class="r">${KE.tl(e.revenue)}</td><td class="r ${e.net >= 0 ? 'pos' : 'neg'}">${KE.tl(e.net)}</td><td class="r">${KE.pct(Math.round(e.sat))}</td></tr>` : ''; }).join('')}</tbody></table></div>` : '';
    const html = `<div class="mhead"><span class="kicker">${KE.dateStr(KE.G.day - 1)}</span><h2 data-trc="journal">${compact ? 'Gün özeti' : 'Günlük'}</h2></div>
      ${compact ? brRows : `<div class="journal">${H.sentences(out.journal)}</div>`}
      <div class="kpis"><div class="kpi">${IC('chart')}<small>Günlük net (tahmini)</small><b class="${tot >= 0 ? 'pos' : 'neg'}">${KE.tl(tot)}</b></div><div class="kpi">${IC('star')}<small>İtibar</small><b>${Math.round(KE.G.reputation)}</b></div><div class="kpi">${IC('coin')}<small>Kasa</small><b>${KE.tl(KE.G.cash)}</b></div></div>
      ${compact ? '' : `<h4>Ekibin morali</h4>`}<div class="moodrow" ${compact ? 'hidden' : ''}>${staff.map((s) => `<div class="mood">${avatar(KE.staffLook(s), KE.moodFromValue(s.morale), s.name)}<small>${esc(s.name.replace(' Usta', ''))}</small><b class="${(s.moraleDelta || 0) >= 0 ? 'pos' : 'neg'}">${(s.moraleDelta || 0) >= 0 ? '+' : ''}${KE.num(s.moraleDelta || 0, 1)}</b><em>${KE.tl(s.tipsToday || 0)}</em></div>`).join('')}</div>
      ${(out.daily || []).length ? `<h4>Günün hedefleri</h4><div class="daily">${out.daily.map((g) => `<div class="dg ${g.state}"><i>${IC(g.state === 'done' ? 'check' : 'bolt')}</i><span><b>${g.text}</b></span><em>${g.state === 'done' ? '+' + KE.tl(g.reward) : 'Olmadı'}</em></div>`).join('')}</div>` : ''}
      ${ups || quits || goals || farm || regHtml || extra ? `<ul class="events">${goals}${extra}${regHtml}${farm}${ups}${quits}</ul>` : ''}
      <div class="acts"><button class="btn big green" data-a="closeAfterDay">${IC('play')}Yeni güne başla</button></div>`;
    UI.modal(html, { wide: true });
    (out.unlocks || []).forEach((p) => queueModal(() => { UI.modal(`<div class="unlock"><span class="kicker">İtibar ${p.unlock} · Yeni tarif</span><div class="ul-dish">${KE.ART.dish(p.id)}</div><h2>${p.name} menüde!</h2><p class="lead">Bütün şubelerin menüsüne eklendi. Onu seven müşteriler kapıda.</p><div class="acts center"><button class="btn big green" data-a="closeModal">${IC('check')}Harika</button></div></div>`); UI.confetti(); KE.SND.play('goal'); }));
    if (out.champions) queueModal(() => { UI.modal(`<div class="mhead"><span class="kicker">Ay sonu</span><h2>Semt şampiyonluğu</h2><p class="muted">Ayın memnuniyet ortalaması "Lüks Kebap"ın semtteki çıtasını geçen şube şampiyon olur: bir ay boyunca müşteri +%6, itibar +2.</p></div>
      <div class="champs">${out.champions.map((c) => `<div class="champ ${c.won ? 'won' : ''}"><span class="cup">${IC(c.won ? 'crown' : 'bolt')}</span><span><b>${esc(c.name)}</b><small>${c.district} · memnuniyet ${KE.pct(Math.round(c.sat))} / çıta ${KE.pct(c.bar)}</small></span><em>${c.won ? 'Şampiyon!' : c.served < 250 ? 'Yetersiz müşteri' : 'Lüks Kebap kazandı'}</em></div>`).join('')}</div>
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
      ${opened.length || extra.length ? `<div class="era-open">${opened.map((p) => `<span class="eo" style="--c:${p.color}">${IC(p.icon)}<b>${esc(p.name)}</b> açıldı</span>`).join('')}${extra.map((x) => `<span class="eo" style="--c:var(--sumak)">${IC('star')}<b>${esc(x)}</b></span>`).join('')}</div>` : ''}
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
      ${rows.map((r) => `<tr><td><b>${esc(r.b.name)}</b>${KE.isManaged(G, r.b) ? ' <small class="muted">müdürlü</small>' : ''}</td><td class="r">${r.served}</td><td class="r">${KE.tl(r.rev)}</td><td class="r ${r.tr == null ? '' : r.tr >= 0 ? 'pos' : 'neg'}">${r.tr == null ? '—' : (r.tr >= 0 ? '+' : '') + Math.round(r.tr * 100) + '%'}</td><td class="r ${r.net >= 0 ? 'pos' : 'neg'}">${KE.tl(r.net)}</td><td class="r">${KE.pct(Math.round(r.sat))}</td></tr>`).join('')}</tbody></table></div>
      ${worst.net < 0 ? `<div class="alert warn">${IC('bolt')}<span><b>${esc(worst.b.name)}</b> bu hafta zarar etti. Kapanış önerilerine ve kadrosuna bak.</span></div>` : ''}`;
  }
  function hearts(n) { let h = '<span class="hearts" aria-label="Gönül ' + n + '/10">'; for (let i = 0; i < 5; i++) h += `<i style="--f:${Math.max(0, Math.min(1, n / 2 - i)) * 100}%">♥</i>`; return h + '</span>'; }
  function newsHtml(n) {
    return `<div class="paper"><div class="mast">Mahalle Postası</div><div class="mastline"><span>Sayı ${n.issue}</span><span>${n.date}</span><span>15 ₺</span></div>
      <div class="cols2">${n.headlines.map((h, i) => `<article class="${i === 0 ? 'lead' : ''}"><h4>${esc(h.title)}</h4><p>${esc(h.body)}</p></article>`).join('')}</div></div>`;
  }
  function monthReportHtml(m) {
    const line = (l, v, cls) => `<tr class="${cls || ''}"><td>${l}</td><td class="r">${KE.tl(v)}</td></tr>`;
    const parts = [{ l: 'Malzeme', v: m.purchases, c: 'var(--kor)' }, { l: 'Personel', v: m.personnel, c: 'var(--sumak)' }, { l: 'Kira', v: m.rent, c: 'var(--cini-light)' }, { l: 'KDV', v: m.kdv, c: '#8e7cc3' }, { l: 'Fatura', v: m.util, c: 'var(--nane)' }, { l: 'Diğer', v: m.accountant + m.loan + (m.ads || 0) + (m.fines || 0) + Math.max(0, m.other || 0) + (m.farm || 0) + (m.farmFixed || 0), c: '#9a8b7a' }];
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
    if (e.whoStaff) { const s = KE.staffById(KE.G, e.whoStaff); if (s) { look = KE.staffLook(s); name = s.name; } }
    if (!look && e.who && KE.CAST[e.who]) { look = KE.CAST[e.who].look; name = KE.CAST[e.who].name; }
    if (!look) { look = KE.CAST.ayse.look; name = 'Ayşe Teyze'; }
    UI.modal(`<div class="evcard"><div class="ev-fig">${KE.figure(look, { mood: 'neutral', label: name })}</div><div class="stack"><span class="kicker ${e.rival ? 'rv' : ''}">${e.rival ? `${IC('fire')}Rakip hamlesi ${e.rival}/${KE.RIVAL_ARC.length}` : e.story ? `${IC('heart')}Müdavim hikâyesi` : 'Olay'} · ${esc(name)}</span><h2>${esc(e.title)}</h2><p class="lead">${esc(e.text)}</p>
      <div class="choices">${e.choices.map((c, i) => `<button class="choice c${i}" data-a="eventChoice" data-i="${i}"><b>${esc(c.label)}</b><small>${esc(c.desc)}</small></button>`).join('')}</div></div></div>`, { cls: 'event' });
  }

  Object.assign(H, { crewPanel, banner, renderTezgah, showClosing, afterDay, hearts, newsHtml, monthReportHtml, payrollTable, showEvent });
})();
