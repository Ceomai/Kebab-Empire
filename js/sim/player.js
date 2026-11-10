/* Kebab Empire — simülasyon motoru (6/8): oyuncu tezgâhta */
(function () {
  const { clamp, mode: MODE, prod: prodOf } = KE.U;
  /* ---------- Oyuncu tezgâhta ----------
     Overcooked usulü: oyuncu aynı anda 2 (hazırlık ekipmanı 2+ ise 3) sipariş tutar. Her tarif adımı bir
     istasyonda yapılır; istasyona dokunmak, o istasyonu sıradaki adım olarak bekleyen siparişi (önce seçili olanı)
     ilerletir. Ateş istasyonu süreli: et ateşe konur, pişince alınır; geç kalınırsa yanar. Hatasız ve hızlı
     siparişler kombo yapar. Bütün süreler oyun dakikasıyla ölçülür, böylece günlük yeniden oynatılabilir. */
  const slotsOf = (/** @type {PlayerState} */ P) => P.slots || (P.slots = []);
  KE.playerCap = (G, b) => (b.equipment.prep >= 2 ? 3 : 2);
  /* oyuncu bu kadar dakika hiçbir istasyona dokunmazsa elindeki (dokunulmamış) fişler ustalara döner ve oyuncu,
     bir istasyona dokunana dek yeni fiş almaz. Çalışan oyuncunun bekleyen ikinci fişi geri alınmaz. */
  KE.PLAYER_IDLE = 12;
  /* slot görünümü eski alanlara yansır (tid/step/errors): sahne, testler ve eski günlükler bunlara bakar */
  function syncSelectedSlot(/** @type {PlayerState} */ P) {
    const sl = slotsOf(P);
    if (P.sel == null || P.sel >= sl.length) P.sel = 0;
    const s = sl[P.sel];
    P.tid = s ? s.tid : null; P.step = s ? s.step : 0; P.errors = s ? s.errors : 0; P.start = s ? s.start : 0;
  }
  /* fişi ustalara geri ver; hiç dokunulmamışsa malzemesi depoya döner (çifte harcama olmasın) */
  function releaseSlot(/** @type {Game} */ G, /** @type {Branch} */ b, /** @type {Live} */ L, /** @type {PlayerSlot} */ sl) {
    const t = L.tickets.find((x) => x.id === sl.tid);
    if (t && t.state === 'cook' && t.cook === 'player') {
      t.state = 'wait'; t.cook = null;
      if (sl.step === 0 && sl.fire == null) { const p = /** @type {Product} */ (prodOf(G, t.pid)); Object.entries(p.ing).forEach(([k, q]) => { b.stock[k] = (b.stock[k] || 0) + q * t.count; }); }
    }
    const P = L.player;
    P.slots.splice(P.slots.indexOf(sl), 1);
  }
  KE.playerToggle = function (G, on) {
    const b = /** @type {Branch} */ (G.branches.find((x) => x.id === G.activeBranch));
    const L = /** @type {Record<string, Live>} */ (G.live)[b.id];
    const P = L.player;
    on = !!on;
    if (on === !!P.active) return;
    if (!on) slotsOf(P).slice().forEach((/** @type {PlayerSlot} */ sl) => releaseSlot(G, b, L, sl));
    Object.assign(P, { active: on, slots: [], sel: 0, combo: on ? P.combo || 0 : 0, tap: L.minute, afk: false });
    if (on && !P.quest && (P.questsDone || 0) < KE.QUESTS_PER_DAY && b.id === KE.mainBranchId(G)) newQuest(G, b, P);
    syncSelectedSlot(P);
  };
  KE.playerTake = function (G) {
    const b = /** @type {Branch} */ (G.branches.find((x) => x.id === G.activeBranch));
    const L = /** @type {Record<string, Live>} */ (G.live)[b.id];
    const P = L.player;
    /* eli boşsa hemen fiş gelir; ikinci/üçüncü fiş yalnızca son 2 dakikada istasyona dokunan (hızlı çalışan) oyuncuya */
    if (!P.active || slotsOf(P).length >= KE.playerCap(G, b) || P.afk || (slotsOf(P).length && L.minute - (P.tap || 0) > 2)) return null;
    const t = L.tickets.find((x) => x.state === 'wait' && !x.noPlayer);
    if (!t) return null;
    const p = /** @type {Product} */ (prodOf(G, t.pid));
    if (!KE.hasStock(b, p, t.count)) return null;
    Object.entries(p.ing).forEach(([k, q]) => { b.stock[k] -= q * t.count; });
    t.state = 'cook'; t.cook = 'player';
    flagTicket(G, L, t);
    if (t.firstTake == null) t.firstTake = L.minute;
    P.slots.push({ tid: t.id, step: 0, errors: 0, start: L.minute, fire: null, fst: null, burnt: 0, touch: L.minute });
    syncSelectedSlot(P);
    return t;
  };
  KE.playerSelect = function (G, i) {
    const P = /** @type {Record<string, Live>} */ (G.live)[G.activeBranch].player;
    if (Number.isInteger(i) && i >= 0 && i < slotsOf(P).length) P.sel = i;
    syncSelectedSlot(P);
  };
  /* Pişme süreleri (dakika): ürünün hazırlık süresinin yarısı, en az 2; pişince 5 dakika içinde alınmalı */
  KE.fireTimes = (p) => ({ cook: Math.max(2, Math.round(p.prep * 0.5)), grace: 5 });
  /* süreli istasyonlar: ateş (ürüne göre) ve fritöz (patates hep 3 dk, 4 dk içinde alınmalı) */
  KE.TIMED = { ates: (p) => KE.fireTimes(p), fritoz: () => ({ cook: 3, grace: 4 }) };
  const timedOf = (/** @type {PlayerSlot} */ sl, /** @type {Product | undefined} */ p) => KE.TIMED[sl.fst || 'ates'](p || { prep: 4 });
  /* menü siparişinde ürünün tarifine "Patates" (fritöz) eklenir */
  KE.ticketSteps = (G, t) => { const p = /** @type {Product} */ (prodOf(G, t.pid)); return t.menu ? p.steps.concat(['Patates']) : p.steps; };
  /* Özel fişler oyuncunun aldığı anda belirlenir (fiş numarası ve güne göre, rastgelelik yok: yeniden oynatılır).
     Menü: + patates, bitince menü bahşişi. Acele: hızlı biterse acele bahşişi. Gurme müşteri: hatasız biterse itibar. */
  function flagTicket(/** @type {Game} */ G, /** @type {Live} */ L, /** @type {Ticket} */ t) {
    if (t.flagged) return;
    t.flagged = true;
    t.menu = (t.id * 7 + G.day * 3) % 4 === 0;
    t.rush = !t.menu && (t.id * 13 + G.day) % 6 === 0;
    const c = t.cid != null ? L.custs[t.cid] : null;
    t.gurme = !!(c && c.type === 'gurme');
  }
  /* Tezgâh görevi: art arda N siparişi hatasız bitir, ödül bahşiş kavanozuna */
  KE.QUESTS_PER_DAY = 3;
  /* Görevler yalnızca ana şubede: oyuncu başına günde tek sınır. Ana şube sabah değiştirilebilir. */
  KE.mainBranchId = (G) => (G.branches.some((x) => x.id === G.mainBranch) ? G.mainBranch : G.branches[0].id);
  KE.setMainBranch = function (G, bid) {
    if (G.phase !== 'morning' || !G.branches.some((x) => x.id === bid)) return false;
    G.mainBranch = bid;
    return true;
  };
  function newQuest(/** @type {Game} */ G, /** @type {Branch} */ b, /** @type {PlayerState} */ P) {
    /* günde en fazla 3 görev ve yalnızca ana şubede: tezgâh ödülü sınırsız büyümesin */
    if ((P.questsDone || 0) >= KE.QUESTS_PER_DAY || b.id !== KE.mainBranchId(G)) { P.quest = null; return; }
    const n = (P.questN = (P.questN || 0) + 1);
    const ps = MODE(G).products.filter((x) => b.menu[x.id]);
    const avg = ps.reduce((a, x) => a + (b.prices[x.id] || x.base), 0) / Math.max(1, ps.length);
    const need = 3 + (n % 3);
    P.quest = { need, done: 0, reward: Math.round((avg * need * 0.4) / 5) * 5 };
  }
  function finishSlot(/** @type {Game} */ G, /** @type {Branch} */ b, /** @type {Live} */ L, /** @type {PlayerSlot} */ sl, /** @type {Product} */ p, /** @type {Ticket} */ t) {
    const P = L.player;
    const took = L.minute - sl.start;
    const par = p.prep + (t.menu ? 3 : 0);
    const slow = took > par * 2.6 ? 1 : took > par * 1.7 ? 0.4 : 0;
    const clean = !sl.errors && !sl.burnt && !slow;
    const combo = clean ? Math.min(5, (P.combo || 0) + 1) : 0;
    t.state = 'ready'; t.readyAt = L.minute; t.cookId = 'player'; t.cookName = G.owner;
    t.q = clamp(5 - sl.errors * 0.9 - sl.burnt * 1.4 - slow + Math.min(0.6, 0.15 * combo) + KE.TIERS[b.tier].quality + (KE.equip(G, b, 'prep').quality || 0), 0, 6);
    P.combo = combo; P.best = Math.max(P.best || 0, combo); P.done = (P.done || 0) + 1;
    L.fx.push({ t: 'ready', sid: 'player', pid: t.pid });
    if (combo >= 2) L.fx.push({ t: 'combo', sid: 'player', text: 'Kombo ×' + combo });
    /* özel fiş ödülleri */
    const price = (b.prices[t.pid] || p.base) * t.count, S = L.stats;
    const bonus = (/** @type {number} */ f, /** @type {string} */ text) => { const v = Math.round((price * f) / 5) * 5; if (v > 0) { S.tips += v; S.tezgahBonus = (S.tezgahBonus || 0) + v; L.fx.push({ t: 'tip', sid: 'player', text: text + ' +' + KE.tl(v) }); } };
    if (t.menu) bonus(0.25, 'Menü');
    if (t.rush && L.minute - (t.firstTake != null ? t.firstTake : sl.start) <= par * 1.25 && !sl.errors) bonus(0.3, 'Acele');
    if (t.gurme) {
      if (clean) { S.repDelta += 0.05; L.fx.push({ t: 'regular', sid: 'player', text: 'Gurme beğendi!' }); }
      else S.repDelta -= 0.02;
    }
    if (P.quest) {
      if (clean) P.quest.done++; else P.quest.done = 0;
      if (P.quest.done >= P.quest.need) {
        S.tips += P.quest.reward; S.tezgahBonus = (S.tezgahBonus || 0) + P.quest.reward; P.questsDone = (P.questsDone || 0) + 1;
        L.fx.push({ t: 'regular', sid: 'player', text: 'Görev tamam! +' + KE.tl(P.quest.reward) });
        newQuest(G, b, P);
      }
    }
    P.slots.splice(P.slots.indexOf(sl), 1);
    if (P.sel >= P.slots.length) P.sel = 0;
  }
  /** İstasyona dokun: sonuç { ok, done?, fire?, wait?, burnt? } */
  KE.playerStation = function (G, st) {
    const b = /** @type {Branch} */ (G.branches.find((x) => x.id === G.activeBranch));
    const L = /** @type {Record<string, Live>} */ (G.live)[b.id];
    const P = L.player;
    const sl = slotsOf(P);
    if (!P.active || !KE.STATIONS.some((x) => x.id === st)) return { ok: false, none: true };
    /* herhangi bir dokunuş oyuncunun başında olduğunu gösterir: boşta işareti kalkar, eli boşsa hemen fiş alır */
    P.tap = L.minute;
    if (P.afk) { P.afk = false; while (KE.playerTake(G)); syncSelectedSlot(P); return { ok: true, woke: true }; }
    if (!sl.length) { syncSelectedSlot(P); return { ok: false, none: true }; }
    const order = sl.map((_, i) => (i + (P.sel || 0)) % sl.length);
    let res = null;
    /* süreli istasyonda (ateş, fritöz) önce pişmiş olanı al */
    if (KE.TIMED[st]) for (const i of order) {
      const s = sl[i];
      if (s.fire == null || (s.fst || 'ates') !== st) continue;
      if (L.minute < s.fire) { res = res || { ok: true, wait: true }; continue; }
      const t = L.tickets.find((x) => x.id === s.tid);
      const p = t && prodOf(G, t.pid);
      const burnt = L.minute > s.fire + timedOf(s, p).grace;
      if (burnt) s.burnt++;
      s.fire = null; s.fst = null; s.step++; s.touch = L.minute;
      P.sel = i;
      if (t && s.step >= KE.ticketSteps(G, t).length) { finishSlot(G, b, L, s, /** @type {Product} */ (p), t); syncSelectedSlot(P); return { ok: true, done: true, burnt }; }
      syncSelectedSlot(P);
      return { ok: true, burnt };
    }
    for (const i of order) {
      const s = sl[i];
      if (s.fire != null) continue;
      const t = L.tickets.find((x) => x.id === s.tid);
      if (!t) continue;
      const p = /** @type {Product} */ (prodOf(G, t.pid)), steps = KE.ticketSteps(G, t);
      if (KE.stepStation(steps[s.step]) !== st) continue;
      P.sel = i; s.touch = L.minute;
      if (KE.TIMED[st]) { s.fst = st; s.fire = L.minute + KE.TIMED[st](p).cook; syncSelectedSlot(P); return { ok: true, fire: true }; }
      s.step++;
      if (s.step >= steps.length) { finishSlot(G, b, L, s, p, t); syncSelectedSlot(P); return { ok: true, done: true }; }
      syncSelectedSlot(P);
      return { ok: true };
    }
    if (res) return res;
    const s = sl[P.sel || 0];
    if (s) s.errors++;
    P.combo = 0;
    if (P.quest) P.quest.done = 0;
    syncSelectedSlot(P);
    return { ok: false };
  };
  /* eski hamle: adım adı → istasyonu */
  KE.playerStep = (G, label) => KE.playerStation(G, KE.stepStation(label));
  /* her dakika: ateşte unutulan yanar, bekleyen müşteri giderse sipariş düşer */
  function playerTick(/** @type {Game} */ G, /** @type {Branch} */ b, /** @type {Live} */ L) {
    const P = L.player;
    if (!P.active || !P.slots || !P.slots.length) return;
    P.slots.slice().forEach((s) => {
      const t = L.tickets.find((x) => x.id === s.tid);
      if (!t || t.state !== 'cook') { P.slots.splice(P.slots.indexOf(s), 1); return; }
      const p = prodOf(G, t.pid);
      /* el sürülmeyen fiş ustalara döner: başlanmamışsa 4 dakika, yarım kalmışsa 20 dakika sonra (paket de dahil) */
      /* başlanmamış fişin müşterisi sabırsızlanıyorsa ustalara devret (yavaş oyuncu müşteri kaçırmasın) */
      const cu = t.cid != null ? L.custs[t.cid] : null;
      if (s.fire == null && cu && s.step === 0 && cu.wait > cu.patience * 1.2) { releaseSlot(G, b, L, s); t.noPlayer = true; return; }
      if (s.fire == null && L.minute - (P.tap || 0) >= KE.PLAYER_IDLE && L.minute - s.touch >= (s.step === 0 ? KE.PLAYER_IDLE : KE.PLAYER_IDLE * 3)) { releaseSlot(G, b, L, s); P.afk = true; return; }
      if (s.fire != null && L.minute > s.fire + timedOf(s, p).grace + 4) {
        /* kömür oldu: malzeme gitti, sipariş baştan ustaya döner */
        P.slots.splice(P.slots.indexOf(s), 1);
        t.state = 'wait'; t.cook = null; t.noPlayer = true; P.combo = 0; P.burned = (P.burned || 0) + 1;
        L.fx.push({ t: 'bad', sid: 'player', text: 'Yandı!' });
      }
    });
    syncSelectedSlot(P);
  }
  KE.playerTick = playerTick;
})();
