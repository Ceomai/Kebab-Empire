/* Kebab Empire — ekonomi: para biçimi, takvim, fiyatlar, bordro, aylık kapanış */
(function () {
  const E = () => KE.ECON;
  /* Sayı ve para biçimi seçili dile göre (para birimi her dilde TL) */
  const LOC = { tr: 'tr-TR', en: 'en-GB', de: 'de-DE' };
  KE.locale = () => LOC[(KE.I18N && KE.I18N.lang) || 'tr'] || 'tr-TR';
  const fmts = {};
  const fmt = (d) => { const k = KE.locale() + d; return fmts[k] || (fmts[k] = new Intl.NumberFormat(KE.locale(), { maximumFractionDigits: d, minimumFractionDigits: d })); };
  KE.tl = (v) => (v < 0 ? '−' : '') + fmt(0).format(Math.round(Math.abs(v))) + ' ₺';
  KE.num = (v, d) => fmt(d || 0).format(v);
  /* yüzde, dile göre: TR "%74", EN "74%", DE "74 %"; v yüzde değeri (74), sign: işaretli (+12%) */
  const pfmts = {};
  KE.pct = (v, sign, d) => { const k = KE.locale() + (sign ? 's' : '') + (d || 0); const f = pfmts[k] || (pfmts[k] = new Intl.NumberFormat(KE.locale(), { style: 'percent', maximumFractionDigits: d || 0, minimumFractionDigits: d || 0, signDisplay: sign ? 'exceptZero' : 'auto' })); return f.format((+v || 0) / 100); };
  KE.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- Takvim: 1. gün = 2 Mart 2026 Pazartesi ---------- */
  const START = Date.UTC(2026, 2, 2);
  const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  KE.AYLAR = AYLAR;
  KE.dateOf = (day) => new Date(START + (day - 1) * 86400000);
  KE.dateStr = (day) => { const d = KE.dateOf(day); return `${d.getUTCDate()}${KE.locale() === 'de-DE' ? '.' : ''} ${AYLAR[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  KE.weekday = (day) => GUNLER[KE.dateOf(day).getUTCDay()];
  KE.isWeekend = (day) => { const w = KE.dateOf(day).getUTCDay(); return w === 0 || w === 6; };
  KE.isMonthEnd = (day) => KE.dateOf(day + 1).getUTCMonth() !== KE.dateOf(day).getUTCMonth();
  KE.isWeekEnd = (day) => KE.dateOf(day).getUTCDay() === 0;
  KE.monthKey = (day) => { const d = KE.dateOf(day); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'); };
  KE.monthName = (key) => { const [y, m] = key.split('-'); return AYLAR[+m - 1] + ' ' + y; };
  /* Bayramlar ve resmî tatiller calendar.js'te hesaplanır */
  KE.holidayOf = (day) => KE.CAL.holidayOn(KE.dateOf(day).getTime());
  KE.religiousHolidayOf = (day) => KE.CAL.religiousOn(KE.dateOf(day).getTime());
  KE.bonusMonths = new Proxy({}, { get: (_, key) => (typeof key === 'string' && /^\d{4}-\d{2}$/.test(key) ? KE.CAL.bonusMonth(key) : undefined) });

  /* ---------- Fiyatlar ---------- */
  KE.TIERS = [
    { name: 'Ekonomik', mul: 0.82, quality: -0.6, desc: 'Ucuz ama müşteri farkı anlar.' },
    { name: 'Standart', mul: 1.0, quality: 0, desc: 'Mahallenin alıştığı kalite.' },
    { name: 'Premium', mul: 1.3, quality: 0.7, desc: 'Seçme et, günlük sebze. Gurmeler bayılır.' }
  ];
  KE.modVal = (G, key) => G.mods.filter((m) => m.key === key).reduce((a, m) => a * m.mult, 1);
  KE.ingPrice = (G, b, key) => {
    const ing = KE.MODES[G.mode].ingredients[key];
    return ing.price * G.priceIndex * KE.TIERS[b.tier].mul * KE.modVal(G, 'ing:' + key) * KE.modVal(G, 'ing') * (G.centralKitchen ? 0.88 : 1);
  };
  KE.productCost = (G, b, p) => Object.entries(p.ing).reduce((a, [k, q]) => a + q * KE.ingPrice(G, b, k), 0);
  KE.marketPrice = (G, p) => Math.round(p.base * G.priceIndex / 5) * 5;

  /* ---------- Gelir vergisi ---------- */
  function taxOn(cum) {
    let tax = 0, prev = 0;
    for (const [lim, rate] of E().gvDilim) {
      if (cum <= prev) break;
      tax += (Math.min(cum, lim) - prev) * rate;
      prev = lim;
    }
    return tax;
  }
  KE.taxOn = taxOn;

  /* Bir çalışanın aylık bordrosu. monthNo: yıl içindeki ay (1–12). commit=true ise kümülatif matrah güncellenir. */
  KE.payroll = function (G, s, monthNo, opts) {
    opts = opts || {};
    const e = E();
    const fm = Math.round(s.wage * e.fazlaMesaiOrani);
    const brut = s.wage + fm;
    const sgkI = brut * e.sgkIsci, issI = brut * e.issizlikIsci;
    const matrah = brut - sgkI - issI;
    const cum = s.cumBase || 0;
    let gv = taxOn(cum + matrah) - taxOn(cum);
    const aMatrah = e.asgariBrut * (1 - e.sgkIsci - e.issizlikIsci);
    const aCum = aMatrah * (monthNo - 1);
    const gvIstisna = Math.min(gv, taxOn(aCum + aMatrah) - taxOn(aCum));
    gv = Math.max(0, gv - gvIstisna);
    const damga = Math.max(0, brut * e.damga - e.asgariBrut * e.damga);
    const net = brut - sgkI - issI - gv - damga;
    const tesvik = G.payLate ? 0 : e.hazineTesvik;
    const sgkV = brut * (e.sgkIsveren - tesvik), issV = brut * e.issizlikIsveren;
    const yol = e.yolYardimiAylik;
    const ikramiye = opts.bonus ? Math.round(brut * e.bayramIkramiye) : 0;
    const total = brut + sgkV + issV + yol + ikramiye;
    if (opts.commit) s.cumBase = cum + matrah;
    return { id: s.id, name: s.name, role: s.role, base: s.wage, fm, brut, sgkI, issI, matrah, gv, gvIstisna, damga, net, sgkV, issV, tesvik: brut * tesvik, yol, ikramiye, tips: s.tipsMonth || 0, total };
  };

  KE.utilities = (G, b) => {
    const eq = b.equipment;
    return Math.round((26000 + eq.cook * 7500 + eq.cold * 3500 + eq.service * 2500 + (b.decor.includes('klima') ? 2500 : 0)) * G.priceIndex);
  };

  /* Ay sonu kapanışı. Nakitten düşer, ay raporunu döndürür. */
  KE.closeMonth = function (G, day) {
    const key = KE.monthKey(day);
    const monthNo = KE.dateOf(day).getUTCMonth() + 1;
    const bonus = !!KE.bonusMonths[key];
    const days = G.ledger.days.filter((d) => d.month === key);
    const sum = (f) => days.reduce((a, d) => a + (f(d) || 0), 0);
    const revenue = sum((d) => d.revenue), purchases = sum((d) => d.purchases), tips = sum((d) => d.tips);
    const extras = G.monthExtras || {};
    const kdvOut = revenue * E().kdvRestoran / (1 + E().kdvRestoran);
    const kdvIn = purchases * E().kdvGida / (1 + E().kdvGida);
    const kdv = Math.max(0, kdvOut - kdvIn);
    const payroll = G.staff.map((s) => KE.payroll(G, s, monthNo, { commit: true, bonus }));
    const personnel = payroll.reduce((a, p) => a + p.total, 0);
    const branches = G.branches.map((b) => {
      const bd = days.filter((d) => d.branchId === b.id);
      const bs = (f) => bd.reduce((a, d) => a + (f(d) || 0), 0);
      const staffCost = payroll.filter((p) => G.staff.find((s) => s.id === p.id).branchId === b.id).reduce((a, p) => a + p.total, 0);
      const rent = b.rent;
      const util = KE.utilities(G, b);
      const rev = bs((d) => d.revenue), pur = bs((d) => d.purchases);
      return { id: b.id, name: b.name, revenue: rev, purchases: pur, tips: bs((d) => d.tips), customers: bs((d) => d.served), rent, util, staffCost,
        result: rev / (1 + E().kdvRestoran) - pur - staffCost - rent - util };
    });
    const rent = branches.reduce((a, b) => a + b.rent, 0);
    const util = branches.reduce((a, b) => a + b.util, 0);
    const accountant = E().muhasebeci + Math.max(0, G.branches.length - 1) * 2500;
    const farmFixed = G.farm ? Math.round(KE.FARM_MONTHLY * G.priceIndex) : 0;
    const loan = G.loans.reduce((a, l) => a + (l.remaining > 0 ? l.monthly : 0), 0);
    const opex = personnel + rent + util + accountant + kdv + loan + farmFixed;
    const report = {
      key, name: KE.monthName(key), bonus: bonus ? KE.bonusMonths[key] : null, revenue, purchases, tips, kdvOut, kdvIn, kdv,
      payroll, personnel, farmFixed, farm: extras.farm || 0, rent, rentNet: rent * (1 - E().kiraStopaj), stopaj: rent * E().kiraStopaj, util, accountant, loan,
      ads: extras.ads || 0, capex: extras.capex || 0, fines: extras.fines || 0, other: extras.other || 0,
      branches, customers: sum((d) => d.served),
      net: revenue - kdv - purchases - personnel - rent - util - accountant - loan - farmFixed - (extras.farm || 0) - (extras.ads || 0) - (extras.fines || 0) - (extras.other || 0)
    };
    G.cash -= opex;
    G.loans.forEach((l) => { if (l.remaining > 0) { l.remaining -= 1; } });
    G.loans = G.loans.filter((l) => l.remaining > 0);
    G.staff.forEach((s) => { s.tipsMonth = 0; });
    if (monthNo === 12) G.staff.forEach((s) => { s.cumBase = 0; });
    G.ledger.months.push(report);
    G.monthExtras = { ads: 0, capex: 0, fines: 0, other: 0, farm: 0 };
    G.priceIndex *= 1 + E().aylikEnflasyon;
    if (monthNo === 12) { KE.CAL.applyYear(KE.dateOf(day + 1).getUTCFullYear()); G.staff.forEach((s) => { if (s.wage < KE.ECON.asgariBrut) s.wage = KE.ECON.asgariBrut; }); }
    return report;
  };

  KE.addExtra = (G, key, amt) => { G.monthExtras = G.monthExtras || {}; G.monthExtras[key] = (G.monthExtras[key] || 0) + amt; };

  /* Kredi: anüite */
  KE.loanOffer = (amount, months, rate) => {
    const m = amount * rate / (1 - Math.pow(1 + rate, -months));
    return { amount, months, rate, monthly: Math.round(m), total: Math.round(m * months) };
  };
  /* Bankanın bugünkü kredi teklifleri (arayüz ve sunucu doğrulaması aynı listeyi kullanır) */
  KE.LOAN_RATE = 0.034;
  KE.loanOffers = (G) => [[300000, 12], [750000, 24], [1500000, 36]].map(([a, m]) => KE.loanOffer(Math.round(a * G.priceIndex / 1000) * 1000, m, KE.LOAN_RATE));
  KE.LOAN_MAX = 3;
  /* Krediyi erken kapatma bedeli: kalan taksitlerin %93'ü (arayüz, motor ve sunucu zinciri aynı formülü kullanır) */
  KE.payoffCost = (l) => Math.round(l.monthly * l.remaining * 0.93);
  /* Bankanın bugünkü tekliflerinden birini kullan (en fazla 3 kredi) */
  KE.takeLoan = function (G, amount, months) {
    const o = KE.loanOffers(G).find((x) => x.amount === amount && x.months === months);
    if (!o) return { ok: false };
    if (G.loans.length >= KE.LOAN_MAX) return { ok: false, msg: 'En fazla 3 kredi kullanabilirsin.' };
    G.loans.push({ amount: o.amount, monthly: o.monthly, remaining: o.months });
    G.cash += o.amount;
    return { ok: true, msg: `${KE.tl(o.amount)} hesabına geçti.`, amount: o.amount };
  };
  /* Krediyi erken kapat: bedel kasadan düşer, kredi listeden çıkar */
  KE.payoffLoan = function (G, i) {
    const l = G.loans[i];
    if (!l) return { ok: false };
    const pay = KE.payoffCost(l);
    if (G.cash < pay) return { ok: false, msg: 'Kasada yeterli para yok.' };
    G.cash -= pay; KE.addExtra(G, 'other', pay);
    G.loans.splice(i, 1);
    return { ok: true, msg: 'Kredi kapatıldı.', cost: pay };
  };
})();
