/* Kebab Empire — servisin içindeki kararlar ve hizmetler: gün ortası olayları, acil kurye,
   rezervasyon defteri ve haftalık yarış. Motor (sim.js) bunları KE üzerinden çağırır. */
(function () {
  const KE = window.KE;
  const { clamp, rnd, pick, mode: MODE } = KE.U;
  const mix = KE.mix;

  /* ---------- Gün ortası kararları ----------
     Servisin ortasında küçük bir olay: oyuncu seçer ya da süre dolunca güvenli seçenek uygulanır.
     Seçim eylem günlüğüne yazılır, sunucu aynı dakikada aynı seçimi yeniden oynatır. */
  KE.MID_WAIT = 40;
  const frontOf = (G, b) => KE.branchStaff(G, b).filter((s) => ['kasiyer', 'garson'].includes(s.role));
  KE.MIDS = [
    { id: 'otobus', def: 1, mgr: 0, ic: 'users', title: 'Turist otobüsü kapıda',
      text: (G, b) => `Bir rehber, ${b.name} önünde durdu: "Kırk kişilik grubum aç, alabilir misiniz?"`,
      choices: () => [{ label: 'Buyursunlar', desc: 'Yarım saat kapı hiç durmaz (müşteri ×2,2). Yetişemezsen kaçanlar itibar götürür.' }, { label: 'Kibarca geri çevir', desc: 'Gün normal akışında sürer.' }] },
    { id: 'ariza', def: 1, mgr: 0, ic: 'fire', title: 'Ocaklardan biri söndü', cond: (G, b) => KE.stations(G, b) >= 2,
      text: () => 'Tüp bağlantısı kaçırıyor; ocak kendiliğinden söndü. Usta ellerini sildi, sana bakıyor.',
      choices: (G) => [{ label: 'Tamirci çağır · ' + KE.tl(KE.midCost(G, 'ariza')), desc: 'Çoğu zaman on dakikada gelir; bazen trafiğe takılır ve ocak bir saat soğuk kalır.' }, { label: 'İdare edelim', desc: 'Kapanışa kadar bir ocak eksik pişirilir.' }] },
    { id: 'fenalik', def: 0, mgr: 0, ic: 'heart', title: 'Bir çalışan fenalaştı', cond: (G, b) => frontOf(G, b).length >= 3,
      text: (G, b, M) => { const s = G.staff.find((x) => x.id === M.sid); return `${s ? s.name : 'Kasiyer'} bembeyaz oldu, tezgâha tutundu: "Bir şeyim yok patron, geçer."`; },
      choices: () => [{ label: 'Eve gönder', desc: 'Bugün çalışmaz; ekip bunu görür, herkesin morali +4.' }, { label: 'Biraz dayansın', desc: 'Çalışmaya devam eder ama morali −10, enerjisi −30.' }] },
    { id: 'yagmur', def: 1, mgr: 0, ic: 'clock', title: 'Sağanak bastırdı',
      text: (G, b) => `${b.name} önünde sokak bir anda boşaldı; yoldan geçenler saçak altına kaçıyor.`,
      choices: (G) => [{ label: 'Tente aç, çay ikram et · ' + KE.tl(KE.midCost(G, 'yagmur')), desc: 'İki saat boyunca müşteri yalnızca %15 azalır; bugün gelecek müdavimlerin gönlü +1.' }, { label: 'Bekleyelim', desc: 'İki saat boyunca müşteri %40 azalır.' }] }
  ];
  KE.midCost = (G, id) => Math.round((id === 'ariza' ? 4500 : 2500) * G.priceIndex / 100) * 100;
  KE.pickMid = function (G) {
    KE.RNG.seed(G, 'mid');
    G.mid = null;
    const open = G.branches.filter((b) => KE.branchStaff(G, b).some(KE.isCook));
    if (G.day <= 3 || !open.length || KE.rand() >= 0.35) return;
    const b = open[Math.floor(KE.rand() * open.length)];
    const opts = KE.MIDS.filter((m) => !m.cond || m.cond(G, b));
    const m = opts[Math.floor(KE.rand() * opts.length)];
    const fr = frontOf(G, b);
    G.mid = { id: m.id, bid: b.id, minute: 150 + Math.floor(KE.rand() * 420), sid: m.id === 'fenalik' ? fr[Math.floor(KE.rand() * fr.length)].id : null, choice: null };
  };
  KE.midPending = (G) => { const M = G.mid; const L = M && G.live && G.live[M.bid]; return !!(M && M.choice == null && L && !L.done && L.minute >= M.minute); };
  KE.resolveMid = function (G, i) {
    const M = G.mid; const L = M && G.live && G.live[M.bid];
    if (!M || M.choice != null || !L) return null;
    M.choice = i; M.at = L.minute;
    const b = G.branches.find((x) => x.id === M.bid);
    const pay = (c) => { G.cash -= c; KE.addExtra(G, 'other', c); };
    if (M.id === 'otobus' && i === 0) L.boost = { until: L.minute + 30, mult: 2.2 };
    if (M.id === 'ariza') {
      if (i === 0) { pay(KE.midCost(G, 'ariza')); if (KE.rand() < 0.3) { M.late = true; L.stationDown = 1; L.stationDownUntil = L.minute + 60; } }
      else L.stationDown = 1;
    }
    if (M.id === 'fenalik') {
      const s = G.staff.find((x) => x.id === M.sid);
      if (s && i === 0) {
        s.home = true; KE.setPos(G, s, 'mola');
        KE.branchStaff(G, b).forEach((x) => { if (x !== s) x.morale = clamp(x.morale + 4, 0, 100); });
        /* kasa boş kalmasın: servisteki biri kasaya geçer */
        const st = KE.branchStaff(G, b);
        if (!st.some((x) => x.pos === 'kasa')) { const r = st.find((x) => !x.home && KE.POSITIONS[x.role].includes('kasa')); if (r) { r.prevPos = r.pos; KE.setPos(G, r, 'kasa'); } }
      }
      if (s && i === 1) { s.morale = clamp(s.morale - 10, 0, 100); s.energy = Math.max(0, s.energy - 30); }
    }
    if (M.id === 'yagmur') {
      if (i === 0) { pay(KE.midCost(G, 'yagmur')); (G.regularVisits || []).filter((v) => v.branchId === M.bid && v.minute >= L.minute).forEach((v) => { const r = G.regulars[v.rid]; if (r) r.loyalty = clamp(r.loyalty + 1, 0, 10); }); }
      L.rain = { until: L.minute + 120, mult: i === 0 ? 0.85 : 0.6 };
    }
    return M;
  };
  /* Acil kurye: gün ortasında biten malzemeyi 1,5 katı fiyatına getirir (günde bir kez) */
  /* günün kalanında beklenen talebin payı (saatlik eğriye göre) */
  const restShare = (L) => {
    const C = KE.HOUR_CURVE, sum = Object.values(C).reduce((a, v) => a + v, 0);
    const h = KE.OPEN_HOUR + (L ? L.minute : 0) / 60;
    return Object.keys(C).reduce((a, k) => a + C[k] * Math.max(0, Math.min(1, +k + 1 - h)), 0) / sum;
  };
  KE.courierMul = (G) => G.mode === 'doner' ? 1.3 : 1.5;
  KE.courierNeed = function (G, b) {
    let cost = 0; const items = {};
    const L = G.live && G.live[b.id], rest = restShare(L), f = KE.demandFactor(G, b);
    Object.keys(b.usage).forEach((k) => {
      const want = b.usage[k] * f * rest * 1.1, have = b.stock[k] || 0;
      /* yalnızca günün kalanına yetmeyecek malzeme, kalanın ihtiyacı kadar */
      if (have < want * 0.6) { const q = want - have; items[k] = q; cost += q * KE.ingPrice(G, b, k) * KE.courierMul(G); }
    });
    return { cost, items };
  };
  KE.courier = function (G, b) {
    const L = b && G.live && G.live[b.id];
    if (!L || L.courier || L.done) return 0;
    const n = KE.courierNeed(G, b);
    if (!n.cost) return 0;
    Object.entries(n.items).forEach(([k, q]) => { b.stock[k] = (b.stock[k] || 0) + q; });
    G.cash -= n.cost; G.today[b.id].purchases += n.cost; L.courier = true; b.courierUsed = true;
    return n.cost;
  };

  /* ---------- Rezervasyon defteri ----------
     Şube başına bir kez alınır, sabah açılıp kapatılabilir. Açıkken: dolu saatte gelen müşteri kaçmış sayılmaz
     (başka saate yönlendirilir), yer ayırtan müşteri daha sabırlıdır, masada biraz daha çok harcar;
     ama yer ayırtmadan gelen kalabalığın bir kısmı hiç gelmez. Rehber müfettişi de yer ayırtır: bir gün önceden görünür. */
  KE.RESERVATION = { cost: 180000, era: 2 };
  KE.resOn = (b) => !!(b && b.reservation && b.resOn !== false);
  KE.reservationCost = (G) => Math.round(KE.RESERVATION.cost * G.priceIndex / 1000) * 1000;
  KE.buyReservation = function (G, b) {
    if ((G.era || 1) < KE.RESERVATION.era) return { ok: false, msg: 'Rezervasyon defteri 2. dönemde açılır.' };
    if (b.reservation) return { ok: false, msg: 'Bu şubede zaten var.' };
    const c = KE.reservationCost(G);
    if (G.cash < c) return { ok: false, msg: 'Kasada yeterli para yok.' };
    G.cash -= c; KE.addExtra(G, 'capex', c); b.reservation = true; b.resOn = true;
    return { ok: true, cost: c };
  };
  KE.INSPECT = { sat: 84, lost: 0.15 };
  /* müfettişin saydığı kayıp: beklemekten, yer bulamadan ya da yemek gelmeden gidenler (rezervasyonla yönlendirilenler sayılmaz) */
  KE.lostShare = (st) => st.arrivals ? (st.lostWait + st.lostFull + st.lostFood) / st.arrivals : 0;


  /* ---------- Haftalık yarış: herkes aynı hafta aynı tohumla, aynı semtte, aynı ustayla 7 gün oynar ---------- */
  KE.RACE_DAYS = 7;
  KE.raceWeek = function (now) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const wd = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - wd);
    const y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const w = Math.ceil(((d.getTime() - y0.getTime()) / 864e5 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(w).padStart(2, '0')}`;
  };
  KE.raceSetup = function (week) {
    let h = 7; for (let i = 0; i < week.length; i++) h = (h * 131 + week.charCodeAt(i)) % 2147483629;
    const n = Number(week.slice(-2));
    const mode = n % 2 ? 'kebap' : 'doner';
    const masters = KE.MASTER_TEMPLATES[mode].filter((t) => t.role !== 'cirak');
    return { week, seed: h + 1, mode, district: KE.DISTRICTS.at((n * 3) % KE.DISTRICTS.length).id, master: (n * 5) % masters.length };
  };
  KE.newRace = function (week, owner) {
    const R = KE.raceSetup(week);
    const masters = KE.MASTER_TEMPLATES[R.mode].filter((t) => t.role !== 'cirak');
    const G = KE.newGame({ mode: R.mode, district: R.district, master: masters.at(R.master), seed: R.seed, owner: owner || 'Patron', shopName: 'Yarış Dükkânı' });
    G.race = { week, days: KE.RACE_DAYS }; G.tut = 99;
    return G;
  };
  KE.raceScore = (G) => Math.round(G.ledger.days.filter((d) => d.day <= KE.RACE_DAYS).reduce((a, d) => a + d.revenue, 0));
  KE.raceOver = (G) => !!(G.race && G.day > KE.RACE_DAYS);

})();
