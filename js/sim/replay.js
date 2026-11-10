/* Kebab Empire — simülasyon motoru (8/8): oyuncu hamlelerinin kaydı ve yeniden oynatma */
(function () {
  /* ---------- Oyuncu hamleleri: kayıt ve yeniden oynatma ----------
     Servis sırasında sonucu etkileyen her oyuncu hamlesi { m: dakika, a: ad, x: argümanlar } olarak
     günlüğe yazılır. Sabah durumu + tohum + günlük ile gün birebir yeniden oynatılabilir. */
  /** @type {Record<string, (G: Game, ...x: any[]) => any>} */
  const ACTS = {
    setPos: (G, sid, pos) => { const s = G.staff.find((x) => x.id === sid); if (s) KE.setPos(G, s, pos); const b = s && G.branches.find((x) => x.id === s.branchId); if (b && G.phase === 'service') b.autoStaff = false; },
    autoStaff: (G, bid, on) => { const b = G.branches.find((x) => x.id === bid); if (b) b.autoStaff = !!on; },
    active: (G, bid) => { if (bid !== G.activeBranch && G.live && G.live[G.activeBranch] && G.live[G.activeBranch].player.active) KE.playerToggle(G, false); G.activeBranch = bid; },
    ptoggle: (G, on) => KE.playerToggle(G, !!on),
    ptake: (G) => KE.playerTake(G),
    pstep: (G, label) => KE.playerStep(G, label),
    pst: (G, st) => KE.playerStation(G, st),
    psel: (G, i) => KE.playerSelect(G, i),
    mid: (G, i) => KE.resolveMid(G, i),
    courier: (G, bid) => KE.courier(G, /** @type {Branch} */ (G.branches.find((x) => x.id === bid)))
  };
  /* servis saati: kapalı (ustasız) şubenin dakikası 0'da kalır, açık olanlardan okunur */
  /* günü bitmiş şubenin saati durur; günlük dakikası hâlâ çalışan bir şubeden okunmalı, yoksa gün sonundaki
     hamleler yeniden oynatmada erken uygulanır */
  const clockL = (/** @type {Game} */ G) => { const ls = G.branches.map((b) => /** @type {Record<string, Live>} */ (G.live)[b.id]).filter((L) => L && !L.closed); return ls.find((L) => !L.done) || ls[0] || /** @type {Record<string, Live>} */ (G.live)[G.branches[0].id]; };
  KE.act = function (G, a, ...x) {
    const L = G.phase === 'service' && G.live ? clockL(G) : null;
    const m = L ? L.minute : 0;
    const r = ACTS[a](G, ...x);
    if (L && (a !== 'ptake' || r)) (G.dayLog = G.dayLog || []).push({ m, a, x });
    return r;
  };
  /* Sabah durumundaki (servis öncesi) bir oyunu, günlükteki hamlelerle sonuna kadar oynatır */
  KE.replayService = function (G, log) {
    KE.startService(G);
    const q = (log || []).slice();
    let guard = 0;
    while (!KE.allDone(G) && guard++ < 2000) {
      const m = clockL(G).minute;
      while (q.length && q[0].m <= m) { const e = q.shift(); if (Object.prototype.hasOwnProperty.call(ACTS, e.a)) ACTS[e.a](G, ...(Array.isArray(e.x) ? e.x : [])); }
      KE.tickAll(G);
    }
    KE.finishService(G);
    return G.lastSummary;
  };
})();
