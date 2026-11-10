/* Kebab Empire — arayüz: muhasebe ofisi. */
(function () {
  const UI = KE.UI,
    H = UI.H,
    SCREENS = UI.SCREENS,
    A = UI.A,
    C = UI.C;
  const { esc, IC, pn, head, lineChart, barChart, empty } = H;

  /* ---------- Muhasebe ---------- */
  SCREENS.office = () => {
    const tab = UI.params.tab || 'ozet';
    const tabs = [
      ['ozet', 'Özet'],
      ['gunluk', 'Günlük'],
      ['haftalik', 'Haftalık'],
      ['aylik', 'Aylık'],
      ['bordro', 'Bordro']
    ];
    return `<main class="screen">${head('Muhasebe Ofisi', 'Günlük, haftalık ve aylık rakamlar; bordro ve vergiler', null, 'zeynep')}
      <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-a="go" data-s="office" data-tab="${k}">${l}</button>`).join('')}</div>
      <section class="panel tabbody">${OFFICE[tab]()}</section></main>`;
  };
  const OFFICE = {};
  function monthToDate() {
    const key = KE.monthKey(KE.G.day);
    const days = KE.G.ledger.days.filter((d) => d.month === key);
    const monthNo = KE.dateOf(KE.G.day).getUTCMonth() + 1;
    const pay = KE.G.staff.map((s) => KE.payroll(KE.G, s, monthNo, { bonus: !!KE.bonusMonths[key] }));
    return {
      key,
      days,
      pay,
      rev: days.reduce((a, d) => a + d.revenue, 0),
      pur: days.reduce((a, d) => a + d.purchases, 0),
      tips: days.reduce((a, d) => a + d.tips, 0)
    };
  }
  OFFICE.ozet = () => {
    const byDay = {};
    KE.G.ledger.days.forEach((d) => {
      byDay[d.day] = byDay[d.day] || { rev: 0, net: 0, pur: 0 };
      byDay[d.day].rev += d.revenue;
      byDay[d.day].net += d.net;
      byDay[d.day].pur += d.purchases;
    });
    const keys = Object.keys(byDay)
      .map(Number)
      .sort((a, b) => a - b)
      .slice(-30);
    const mtd = monthToDate();
    const personnel = mtd.pay.reduce((a, p) => a + p.total, 0);
    const rent = KE.G.branches.reduce((a, b) => a + b.rent, 0);
    const util = KE.G.branches.reduce((a, b) => a + KE.utilities(KE.G, b), 0);
    const monthEnd = KE.G.day + [...Array(32).keys()].find((i) => KE.isMonthEnd(KE.G.day + i));
    return `<div class="kpis">
        <div class="kpi">${IC('coin')}<small>Kasa</small><b>${KE.tl(KE.G.cash)}</b></div>
        <div class="kpi">${IC('chart')}<small>${KE.monthName(mtd.key)} cirosu</small><b>${KE.tl(mtd.rev)}</b></div>
        <div class="kpi">${IC('cart')}<small>Ay içi malzeme</small><b>${KE.tl(mtd.pur)}</b></div>
        <div class="kpi">${IC('users')}<small>Aylık bordro (tahmini)</small><b>${KE.tl(personnel)}</b></div>
        <div class="kpi">${IC('store')}<small>Kira ve fatura</small><b>${KE.tl(rent + util)}</b></div>
        ${KE.G.loans.length ? `<div class="kpi">${IC('lock')}<small>Kredi borcu</small><b>${KE.tl(KE.G.loans.reduce((a, l) => a + l.monthly * l.remaining, 0))}</b></div>` : ''}
      </div>
      ${keys.length ? `<h3>Son ${keys.length} gün</h3>` : empty('Grafik, ilk günü kapattıktan sonra burada görünür.', 'chart')}
      ${
        keys.length
          ? lineChart(
              [
                { name: 'Ciro', color: 'var(--kor)', values: keys.map((k) => byDay[k].rev), area: true },
                { name: 'Malzeme', color: 'var(--cini-light)', values: keys.map((k) => byDay[k].pur) },
                { name: 'Günlük net', color: 'var(--nane)', values: keys.map((k) => byDay[k].net) }
              ],
              keys.map((k) => {
                const d = KE.dateOf(k);
                return d.getUTCDate() + '/' + (d.getUTCMonth() + 1);
              }),
              { label: 'Günlük ciro ve net' }
            )
          : '<p class="muted">İlk günü bitirince grafikler burada görünecek.</p>'
      }
      <p class="small muted">Ay sonu (${KE.dateStr(monthEnd)}) kapanışında bordro, kira, stopaj, faturalar, KDV, çiftlik gideri ve kredi taksitleri kasadan düşer.</p>`;
  };
  OFFICE.gunluk = () => {
    const days = KE.G.ledger.days.slice().reverse().slice(0, 40);
    const sel = UI.params.day ? KE.G.ledger.days.filter((d) => d.day === +UI.params.day) : null;
    let detail = '';
    if (sel && sel.length) {
      const d = sel.find((x) => x.branchId === (UI.params.b || sel[0].branchId)) || sel[0];
      const prods = Object.entries(d.byProduct).sort((a, c) => c[1] - a[1]);
      detail = `<div class="subpanel"><h3>${d.date} · ${esc((KE.G.branches.find((b) => b.id === d.branchId) || {}).name || '')}</h3>
        <div class="cols2"><div>${barChart(
          d.hourly.slice(0, 13),
          d.hourly.slice(0, 13).map((_, i) => String(KE.OPEN_HOUR + i)),
          { money: true, h: 150, label: 'Saatlik ciro' }
        )}</div>
        <table class="fin"><tbody>
          <tr><td>Ciro (kart / nakit)</td><td class="r">${KE.tl(d.card)} / ${KE.tl(d.cash)}</td></tr><tr><td>Paket servis</td><td class="r">${d.paket} sipariş · ${KE.tl(d.paketRev)}</td></tr>
          <tr><td>Malzeme (sarf dahil)</td><td class="r">${KE.tl(d.purchases)}</td></tr><tr><td>Ambalaj ve sarf</td><td class="r">${KE.tl(d.sarf || 0)}</td></tr><tr><td>Fire</td><td class="r">${KE.tl(d.waste)}</td></tr>
          <tr><td>Günlük sabit gider payı</td><td class="r">${KE.tl(d.fixed)}</td></tr><tr><td>Bahşiş (${KE.TIP_RULES[d.tipRule].name})</td><td class="r">${KE.tl(d.tips)}</td></tr>${d.farmKg ? `<tr><td>Çiftlikten gelen et</td><td class="r">${KE.num(d.farmKg, 0)} kg</td></tr>` : ''}
          <tr class="total"><td>Günlük net</td><td class="r">${KE.tl(d.net)}</td></tr></tbody></table></div>
        <div class="chips">${prods.map(([pid, n]) => `<span class="chip or">${pn(pid)}: ${n}</span>`).join('')}</div></div>`;
    }
    if (!days.length) return empty('Henüz kapanmış gün yok. İlk günü kapatınca her günün dökümü burada listelenir.');
    return `${detail}<div class="tablewrap"><table class="fin"><thead><tr><th>Tarih</th><th>Şube</th><th class="r">Müşteri</th><th class="r">Kaçan</th><th class="r">Ciro</th><th class="r">Malzeme</th><th class="r">Bahşiş</th><th class="r">Memnuniyet</th><th class="r">Net</th></tr></thead><tbody>
      ${days.map((d) => `<tr class="click" data-a="go" data-s="office" data-tab="gunluk" data-day="${d.day}" data-b="${d.branchId}"><td>${d.date}</td><td>${esc((KE.G.branches.find((b) => b.id === d.branchId) || {}).name || '')}</td><td class="r">${d.served}</td><td class="r">${d.lost}</td><td class="r">${KE.tl(d.revenue)}</td><td class="r">${KE.tl(d.purchases)}</td><td class="r">${KE.tl(d.tips)}</td><td class="r">${KE.pct(Math.round(d.sat))}</td><td class="r ${d.net >= 0 ? 'pos' : 'neg'}">${KE.tl(d.net)}</td></tr>`).join('') || '<tr><td colspan="9" class="muted">Henüz kayıt yok.</td></tr>'}
    </tbody></table></div><p class="small muted">Bir satıra tıklayınca o günün dökümü açılır.</p>`;
  };
  OFFICE.haftalik = () => {
    const weeks = {};
    KE.G.ledger.days.forEach((d) => {
      const w = Math.floor((d.day - 1) / 7) + 1;
      const W = (weeks[w] = weeks[w] || {
        w,
        start: (w - 1) * 7 + 1,
        rev: 0,
        pur: 0,
        tips: 0,
        served: 0,
        lost: 0,
        satS: 0,
        satN: 0,
        net: 0,
        prods: {}
      });
      W.rev += d.revenue;
      W.pur += d.purchases;
      W.tips += d.tips;
      W.served += d.served;
      W.lost += d.lost;
      W.satS += d.sat * d.served;
      W.satN += d.served;
      W.net += d.net;
      Object.entries(d.byProduct).forEach(([p, n]) => {
        W.prods[p] = (W.prods[p] || 0) + n;
      });
    });
    const list = Object.values(weeks).sort((a, b) => b.w - a.w);
    const asc = list.slice().reverse();
    if (!list.length) return empty('Haftalık rapor, ilk günü kapattıktan sonra burada görünür.');
    return `${
      asc.length > 1
        ? lineChart(
            [
              { name: 'Haftalık ciro', color: 'var(--kor)', values: asc.map((w) => w.rev), area: true },
              { name: 'Haftalık net', color: 'var(--nane)', values: asc.map((w) => w.net) }
            ],
            asc.map((w) => w.w + '. hf'),
            { label: 'Haftalık ciro' }
          )
        : ''
    }
      <div class="tablewrap"><table class="fin"><thead><tr><th>Hafta</th><th>Başlangıç</th><th class="r">Müşteri</th><th class="r">Kaçan</th><th class="r">Ciro</th><th class="r">Malzeme</th><th class="r">Bahşiş</th><th class="r">Memnuniyet</th><th>En çok satan</th><th class="r">Net</th></tr></thead><tbody>
      ${
        list
          .map((w) => {
            const top = Object.entries(w.prods).sort((a, b) => b[1] - a[1])[0];
            return `<tr><td>${w.w}. hafta</td><td>${KE.dateStr(w.start)}</td><td class="r">${w.served}</td><td class="r">${w.lost}</td><td class="r">${KE.tl(w.rev)}</td><td class="r">${KE.tl(w.pur)}</td><td class="r">${KE.tl(w.tips)}</td><td class="r">${KE.pct(w.satN ? Math.round(w.satS / w.satN) : 0)}</td><td>${top ? pn(top[0]) : '–'}</td><td class="r ${w.net >= 0 ? 'pos' : 'neg'}">${KE.tl(w.net)}</td></tr>`;
          })
          .join('') || '<tr><td colspan="10" class="muted">Henüz kayıt yok.</td></tr>'
      }
      </tbody></table></div>`;
  };
  OFFICE.aylik = () => {
    const ms = KE.G.ledger.months;
    if (UI.params.m != null && ms[+UI.params.m])
      return (
        `<button class="btn sm ghost" data-a="go" data-s="office" data-tab="aylik">${IC('arrow')}Bütün aylar</button>` +
        H.monthReportHtml(ms[+UI.params.m])
      );
    const mtd = monthToDate();
    const personnel = mtd.pay.reduce((a, p) => a + p.total, 0);
    const rent = KE.G.branches.reduce((a, b) => a + b.rent, 0),
      util = KE.G.branches.reduce((a, b) => a + KE.utilities(KE.G, b), 0);
    const kdv = Math.max(0, (mtd.rev * 0.1) / 1.1 - (mtd.pur * 0.01) / 1.01);
    return `<div class="subpanel"><h3>${KE.monthName(mtd.key)} (devam ediyor, tahmini)</h3>
      <div class="kpis"><div class="kpi">${IC('coin')}<small>Ciro (şimdiye kadar)</small><b>${KE.tl(mtd.rev)}</b></div><div class="kpi">${IC('cart')}<small>Malzeme</small><b>${KE.tl(mtd.pur)}</b></div><div class="kpi">${IC('chart')}<small>KDV (tahmini)</small><b>${KE.tl(kdv)}</b></div><div class="kpi">${IC('users')}<small>Ay sonu sabit gider</small><b>${KE.tl(personnel + rent + util + KE.ECON.muhasebeci + (KE.G.farm ? KE.FARM_MONTHLY * KE.G.priceIndex : 0))}</b></div></div></div>
${
  !ms.length
    ? empty('Aylık raporlar ay sonu kapanışından sonra burada listelenir.')
    : `<div class="tablewrap"><table class="fin"><thead><tr><th>Ay</th><th class="r">Ciro</th><th class="r">KDV</th><th class="r">Malzeme</th><th class="r">Personel</th><th class="r">Kira</th><th class="r">Fatura</th><th class="r">Net</th></tr></thead><tbody>
      ${ms.map((m, i) => `<tr class="click" data-a="go" data-s="office" data-tab="aylik" data-m="${i}"><td><b>${m.name}</b></td><td class="r">${KE.tl(m.revenue)}</td><td class="r">${KE.tl(m.kdv)}</td><td class="r">${KE.tl(m.purchases)}</td><td class="r">${KE.tl(m.personnel)}</td><td class="r">${KE.tl(m.rent)}</td><td class="r">${KE.tl(m.util)}</td><td class="r ${m.net >= 0 ? 'pos' : 'neg'}">${KE.tl(m.net)}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">İlk ay sonu kapanışından sonra raporlar burada listelenir.</td></tr>'}
      </tbody></table></div>`
}`;
  };
  OFFICE.bordro = () => {
    const mtd = monthToDate();
    return `<div class="sechead"><h3>${KE.monthName(mtd.key)} bordrosu (önizleme)</h3><div class="chips"><span class="chip">Asgari ücret (brüt) ${KE.tl(KE.ECON.asgariBrut)}</span>${KE.bonusMonths[mtd.key] ? `<span class="chip gd">Bu ay ${KE.bonusMonths[mtd.key]} ikramiyesi var</span>` : ''}${KE.G.payLate ? '<span class="chip rd">Kasa eksi: SGK teşviki kaybedildi</span>' : '<span class="chip gr">5 puanlık SGK teşviki uygulanıyor</span>'}</div></div>${H.payrollTable(mtd.pay)}`;
  };
})();
