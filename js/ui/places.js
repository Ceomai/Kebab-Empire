/* Kebab Empire — arayüz: şehirdeki yerler: hal, usta pazarı, büro, terzi, dekor, banka, belediye, ajans, kahve, merkez ofis, çiftlik. */
(function () {
  const UI = KE.UI, H = UI.H, SCREENS = UI.SCREENS, A = UI.A, C = UI.C;
  const { esc, clamp, IC, MODE, B, pn, roleName, bar, CL, head, morningOnly, lineChart } = H;

  /* ---------- Hal ---------- */
  SCREENS.hal = () => {
    const b = B(); const M = MODE();
    const mods = KE.G.mods.filter((m) => m.key.startsWith('ing'));
    return `<main class="screen">${head('Hal ve Kasap', esc(b.name) + ' için tedarik', null, 'riza')}
      <section class="panel"><div class="sechead"><h2>Tedarik kalitesi</h2></div><div class="grid g3">${KE.TIERS.map((t, i) => `<button class="optcard ${b.tier === i ? 'sel' : ''}" data-a="tier" data-i="${i}">${IC(i === 2 ? 'star' : i === 1 ? 'check' : 'coin')}<b>${t.name}</b><small>${t.desc}</small><span class="chips"><span class="chip">Fiyat ×${t.mul}</span><span class="chip ${t.quality > 0 ? 'gr' : t.quality < 0 ? 'rd' : ''}">Kalite ${t.quality >= 0 ? '+' : ''}${t.quality}</span></span></button>`).join('')}</div></section>
      <section class="panel"><div class="sechead"><h2>Otomatik sabah siparişi</h2><div class="seg">${/** @type {Array<[number, string]>} */ ([[1.15, 'Normal'], [1.5, 'Bol']]).map(([v, l]) => `<button class="${Math.abs(b.stockLevel - v) < 0.01 ? 'on' : ''}" data-a="stockLevel" data-v="${v}"><span>${l}</span></button>`).join('')}</div></div>
        <p class="small muted">Rıza her sabah stoğu son günlerin kullanımına göre tamamlar. "Normal" her gün için yeterli; "Bol" yalnızca maç, bayram ve kampanya günlerinde işe yarar, diğer günler fazlası fire olur. Çiftliğin varsa et önce çiftlik deposundan gelir.</p>
        ${mods.length ? `<div class="chips">${mods.map((m) => `<span class="chip rd">${m.label} ×${m.mult} · ${m.days} gün</span>`).join('')}</div>` : ''}
        <div class="inggrid">${Object.entries(M.ingredients).map(([k, ing]) => { const u = b.usage[k] || 0; const step = ing.unit === 'kg' ? Math.max(1, Math.round(u * 0.25)) : Math.max(10, Math.round(u * 0.25 / 10) * 10); const days = u ? (b.stock[k] || 0) / u : 9; return `<div class="ing"><div class="ing-t"><b>${ing.name}</b><small>${KE.tl(KE.ingPrice(KE.G, b, k))}/${ing.unit}</small></div>${bar(clamp(days / 1.5 * 100, 0, 100), days < 0.9 ? 'crit' : days < 1.05 ? 'warn' : 'ok')}<div class="row between"><small class="muted">${KE.num(b.stock[k] || 0, ing.unit === 'kg' ? 1 : 0)} / günlük ${KE.num(u, ing.unit === 'kg' ? 1 : 0)} ${ing.unit}</small><button class="btn xs ghost" data-a="buy" data-k="${k}" data-q="${step}">+${step} ${ing.unit}</button></div></div>`; }).join('')}</div></section>

    </main>`;
  };

  /* ---------- Usta pazarı ---------- */
  /* Şubenin kadro doluluğu: grup başına kullanılan / sınır */
  function capBar(b, groups) {
    const caps = KE.staffCaps(KE.G, b);
    return `<div class="capbar"><span class="cap-l">${IC('users')}<b>${esc(b.name)}</b> kadro</span>${groups.map((g) => {
      const used = KE.branchStaff(KE.G, b).filter((s) => KE.staffGroup(s.role) === g).length;
      const full = used >= caps[g];
      return `<span class="cap ${full ? 'full' : ''}"><small>${KE.STAFF_GROUPS[g].name}</small><b>${used}/${caps[g]}</b></span>`;
    }).join('')}<span class="cap-h">Dükkânın ocağı ve salonu büyüdükçe kadro genişler.</span></div>`;
  }
  const hireBtn = (b, s, label, extraDisabled) => {
    const ch = KE.canHire(KE.G, b, s.role || 'usta');
    if (!ch.ok) return `<button class="btn ghost" disabled title="${esc(ch.hint)}">${IC('lock')}${KE.STAFF_GROUPS[ch.group].name} dolu</button>`;
    return `<button class="btn green" data-a="${s.role === 'usta' || s.role === 'cirak' ? 'hireMaster' : 'hireWorker'}" data-id="${s.id}" ${extraDisabled ? 'disabled' : ''}>${label}</button>`;
  };
  SCREENS.lonca = () => {
    const b = B();
    const mine = KE.G.staff.filter(KE.isCook);
    const tab = UI.params.tab || 'pazar';
    const actions = (s) => {
      let a = `<button class="btn xs ghost" data-a="raise" data-id="${s.id}">${IC('coin')}%10 zam</button>`;
      if (s.role === 'cirak') {
        a += `<button class="btn xs ghost" data-a="pickMentor" data-id="${s.id}">${IC('chef')}${s.mentorId ? 'Mentor: ' + esc(((KE.G.staff.find((x) => x.id === s.mentorId) || {}).name || '').replace(' Usta', '')) : 'Mentor seç'}</button>`;
        if (Object.values(s.spec).some((v) => v >= 3)) a += `<button class="btn xs gold" data-a="promote" data-id="${s.id}">${IC('star')}Terfi</button>`;
      }
      if (KE.G.branches.length > 1 && KE.G.phase === 'morning') a += `<button class="btn xs ghost" data-a="pickTransfer" data-id="${s.id}">${IC('swap')}Şube</button>`;
      if (KE.G.phase === 'morning') a += `<button class="btn xs red" data-a="fire" data-id="${s.id}">Çıkar</button>`;
      return a;
    };
    return `<main class="screen">${head('Usta Pazarı', 'Pazar her pazar akşamı yenilenir', null, 'lonca')}
      <div class="tabs"><button class="tab ${tab === 'pazar' ? 'on' : ''}" data-a="go" data-s="lonca" data-tab="pazar">Pazardaki ustalar</button><button class="tab ${tab === 'kadro' ? 'on' : ''}" data-a="go" data-s="lonca" data-tab="kadro">Kadrom (${mine.length})</button></div>
      <section class="panel tabbody">${tab === 'pazar'
        ? `<p class="small muted">İşe aldığın usta <b>${esc(b.name)}</b> şubesine başlar (şube şeridinden değiştirebilirsin). Pişirme yeri: ${KE.equip(KE.G, b, 'cook').stations}.</p>${capBar(b, ['mutfak'])}
          <div class="grid g3">${KE.G.market.map((s) => H.masterCard(s, { actions: hireBtn(b, s, `İşe al${s.fee ? ' · ' + KE.tl(s.fee) : ''}`, KE.G.cash < (s.fee || 0)) })).join('') || '<p class="muted">Pazarda şu an kimse yok.</p>'}</div>`
        : `${morningOnly()}<div class="grid g3">${mine.map((s) => H.masterCard(s, { own: true, extra: `<p class="tiny muted">${esc(KE.G.branches.find((x) => x.id === s.branchId).name)} · toplam ${s.servedTotal} porsiyon · bu ay bahşiş ${KE.tl(s.tipsMonth)}</p>`, actions: actions(s) })).join('')}</div>`}
      </section></main>`;
  };

  /* ---------- Eleman bürosu ---------- */
  function workerCard(s, own, b) {
    const tr = KE.TRAITS[s.trait];
    let acts;
    if (own) {
      acts = `<button class="btn xs ghost" data-a="raise" data-id="${s.id}">${IC('coin')}%10 zam</button>`;
      if (KE.G.branches.length > 1 && KE.G.phase === 'morning') acts += `<button class="btn xs ghost" data-a="pickTransfer" data-id="${s.id}">${IC('swap')}Şube</button>`;
      if (KE.G.phase === 'morning') acts += `<button class="btn xs red" data-a="fire" data-id="${s.id}">Çıkar</button>`;
    } else acts = hireBtn(b, s, 'İşe al');
    return `<article class="card person">
      <div class="pc-top"><div class="pc-fig">${KE.figure(KE.staffLook(s), { mood: KE.moodFromValue(s.morale), label: s.name })}</div>
        <div class="pc-id"><h3>${esc(s.name)}</h3><div class="chips"><span class="chip bl">${roleName(s)}</span>${tr ? `<span class="chip gd" title="${esc(tr.desc)}">${tr.name}</span>` : ''}</div>
        ${own ? `<small class="muted">${esc(KE.G.branches.find((x) => x.id === s.branchId).name)} · moral ${Math.round(s.morale)}</small>` : ''}
        <div class="pc-stats">${H.statl('Hız', (s.speed - 0.6) / 0.8)}${H.statl('Güler yüz', s.friendly)}${s.role === 'mudur' ? H.statl('Yönetim', s.skill) : ''}</div></div></div>
      <div class="pc-foot"><div class="price"><b>${KE.tl(s.wage)}</b><small>brüt / ay</small></div><div class="row">${acts}</div></div></article>`;
  }
  SCREENS.buro = () => {
    const b = B();
    /* şube müdürü ikinci şubeyle anlam kazanır; o zamana kadar listede yok */
    const multi = KE.G.branches.length >= 2 || KE.G.staff.some((s) => s.role === 'mudur');
    const mine = KE.G.staff.filter((s) => !KE.isCook(s));
    return `<main class="screen">${head('Eleman Bürosu', 'Kasa, servis, temizlik, paket ve yönetim ekibi', null, 'buro')}
      <section class="panel"><div class="sechead"><h2>Adaylar</h2><span class="small muted">İşe aldığın kişi <b>${esc(b.name)}</b> şubesinde başlar. Liste her pazar yenilenir.</span></div>
        ${capBar(b, multi ? ['salon', 'destek', 'yonetim'] : ['salon', 'destek'])}<div class="rolekey">${['kasiyer', 'garson', 'temizlik', 'kurye'].concat(multi ? ['mudur'] : []).map((r) => `<span><b>${r === 'garson' ? (KE.G.mode === 'doner' ? 'Komi' : 'Garson') : KE.ROLES[r].name}</b>${KE.ROLES[r].desc}</span>`).join('')}</div><div class="grid g3">${KE.G.workers.filter((s) => multi || s.role !== 'mudur').map((s) => workerCard(s, false, b)).join('')}</div></section>
      <section class="panel"><div class="sechead"><h2>Kadro (ustalar hariç)</h2></div>${morningOnly()}<div class="grid g3">${mine.map((s) => workerCard(s, true)).join('') || '<p class="muted">Henüz kimse yok.</p>'}</div></section></main>`;
  };

  /* ---------- Terzi ---------- */
  SCREENS.terzi = () => `<main class="screen">${head('Terzi Nuri', 'Ekibine yakışanı giydir', null, 'terzi')}
    <div class="note">${IC('heart')}<span>Kostüm morali yükseltir. Yöresel kostüm, çalışanın memleketine göre dikilir ve uyumlu ürünlerde ek bahşiş getirir.</span></div>
    <div class="grid g2">${KE.G.staff.map((s) => {
      const reg = KE.REGIONS[s.region] || KE.REGIONS['İstanbul'];
      return `<article class="card wardrobe"><div class="wr-id"><b>${esc(s.name)}</b><small>${roleName(s)} · ${esc(KE.G.branches.find((x) => x.id === s.branchId).name)} · Memleket: ${s.region} (${reg.note})</small></div>
        <div class="wr-figs">${KE.COSTUMES.map((c) => `<button class="wr-opt ${s.costume === c.id ? 'sel' : ''}" data-a="costume" data-id="${s.id}" data-c="${c.id}" ${s.costume === c.id ? 'disabled' : ''} aria-label="${c.name}">${KE.figure(KE.staffLook(Object.assign({}, s, { costume: c.id })), { mood: s.costume === c.id ? 'happy' : 'neutral' })}<small>${c.name}${c.cost && s.costume !== c.id ? '<br><b>' + KE.tl(c.cost) + '</b>' : s.costume === c.id ? '<br><b>Giyiyor</b>' : ''}</small></button>`).join('')}</div></article>`;
    }).join('')}</div></main>`;

  /* ---------- Mobilya, ekipman, dekor ---------- */
  SCREENS.dekor = () => {
    const b = B(); const M = MODE();
    const amb = KE.ambience(KE.G, b);
    const styles = {};
    b.decor.forEach((id) => { const d = KE.DECOR.find((x) => x.id === id); if (d.style !== 'personel') styles[d.style] = (styles[d.style] || 0) + 1; });
    const capAt = (k, i) => KE.staffCapsAt(KE.G, b, Object.assign({}, b.equipment, { [k]: i }));
    const eqDesc = (k, lv, i) => k === 'cook' ? `${lv.stations} ocak yeri · mutfak kadrosu ${capAt(k, i).mutfak}` : k === 'prep' ? `Hız ×${lv.speed}${lv.quality ? `, kalite +${lv.quality}` : ''}` : k === 'cold' ? `Günlük fire %${KE.num(lv.waste * 100, 1)}` : `${lv.tables} masa, kuyruk ${lv.queue}, sabır ×${lv.patience} · salon kadrosu ${capAt(k, i).salon}, paket/temizlik ${capAt(k, i).destek}`;
    const eqIc = { cook: 'fire', prep: 'chef', cold: 'leaf', service: 'table' };
    return `<main class="screen">${head('Mobilya ve Dekor', esc(b.name), null, 'dekor')}
      <section class="panel"><div class="sechead"><h2>Ekipman</h2></div><div class="grid g4">${Object.entries(M.equipment).map(([k, eq]) => {
        const lvl = b.equipment[k], cur = eq.levels[lvl], next = eq.levels[lvl + 1];
        return `<article class="card eq"><div class="row between"><span class="kicker">${IC(eqIc[k])}${eq.name}</span><span class="lvl">${eq.levels.map((_, i) => `<i class="${i <= lvl ? 'on' : ''}"></i>`).join('')}</span></div><h3>${cur.name}</h3><p class="small">${eqDesc(k, cur, lvl)}</p>${k === 'cook' && KE.branchStaff(KE.G, b).filter(KE.isCook).length < cur.stations ? `<div class="alert warn">${IC('bolt')}<span>Şu an ${cur.stations - KE.branchStaff(KE.G, b).filter(KE.isCook).length} ocak yeri boş. Yükseltmeden önce Usta Pazarı'ndan pişirmeci al; boş ocak müşteri getirmez.</span></div>` : ''}
          ${next ? `<div class="eq-next"><small class="muted">Sonraki</small><b>${next.name}</b><small>${eqDesc(k, next, lvl + 1)}</small></div><div class="pc-foot"><b>${KE.tl(next.cost * KE.G.priceIndex)}</b><button class="btn sm green" data-a="upgrade" data-k="${k}" ${KE.G.cash < next.cost * KE.G.priceIndex ? 'disabled' : ''}>Yükselt</button></div>` : `<span class="chip gr">${IC('check')}En üst seviye</span>`}</article>`;
      }).join('')}</div></section>
      <section class="panel"><div class="sechead"><h2>Dekor</h2><div class="chips">${Object.entries(styles).map(([s, n]) => `<span class="chip ${n >= 3 ? 'gd' : ''}">${s}: ${n}/3</span>`).join('')}${amb.concept ? `<span class="chip gd">${IC('star')}Konsept: ${amb.concept.name}</span>` : ''}</div></div>
        <p class="small muted">Ortam puanı müşteri sayısını ve memnuniyeti artırır. Aynı tarzdan 3 parça konsept bonusunu açar; kostümler konsepti güçlendirir.</p>
        <div class="grid g4">${KE.DECOR.map((d) => { const own = b.decor.includes(d.id); return `<article class="card decor ${own ? 'owned' : ''}"><div class="dec-art st-${d.style === 'lüks' ? 'luks' : d.style}">${KE.ART.decor(d.id)}</div><div><b>${d.name}</b><div class="chips"><span class="chip">${d.style}</span><span class="chip">Ortam +${d.ambience}</span>${d.morale ? `<span class="chip gr">Moral +${d.morale}/gün</span>` : ''}</div><p class="small muted">${d.desc}</p></div><div class="pc-foot">${own ? `<span class="chip gr">${IC('check')}Dükkânda</span>` : `<b>${KE.tl(d.cost * KE.G.priceIndex)}</b><button class="btn sm green" data-a="buyDecor" data-id="${d.id}" ${KE.G.cash < d.cost * KE.G.priceIndex ? 'disabled' : ''}>Al</button>`}</div></article>`; }).join('')}</div></section></main>`;
  };

  /* ---------- Banka ---------- */
  SCREENS.banka = () => {
    const offers = [[300000, 12], [750000, 24], [1500000, 36]].map(([a, m]) => KE.loanOffer(Math.round(a * KE.G.priceIndex / 1000) * 1000, m, 0.034));
    return `<main class="screen">${head('Banka', 'Esnaf kredisi · aylık %3,4 faiz, eşit taksit', null, 'banker')}
      <section class="panel"><div class="sechead"><h2>Kredi teklifleri</h2></div><div class="grid g3">${offers.map((o) => `<article class="card loan"><small class="muted">${o.months} ay vade</small><b class="big">${KE.tl(o.amount)}</b><div class="statl"><span>Taksit</span><b>${KE.tl(o.monthly)}</b></div><div class="statl"><span>Toplam</span><b>${KE.tl(o.total)}</b></div><button class="btn sm green block" data-a="loan" data-amt="${o.amount}" data-m="${o.months}" ${KE.G.loans.length >= 3 ? 'disabled' : ''}>Kullan</button></article>`).join('')}</div>${KE.G.loans.length >= 3 ? '<p class="small neg">En fazla 3 kredi kullanabilirsin.</p>' : ''}</section>
      <section class="panel"><div class="sechead"><h2>Kredilerim</h2></div><div class="grid g3">${KE.G.loans.map((l, i) => { const pay = Math.round(l.monthly * l.remaining * 0.93); return `<article class="card loan"><b class="big">${KE.tl(l.amount)}</b><div class="statl"><span>Taksit</span><b>${KE.tl(l.monthly)}</b></div><div class="statl"><span>Kalan</span><b>${l.remaining} ay</b></div><button class="btn sm ghost block" data-a="payoff" data-i="${i}" ${KE.G.cash < pay ? 'disabled' : ''}>Erken kapat · ${KE.tl(pay)}</button></article>`; }).join('') || '<p class="muted">Kredi yok.</p>'}</div></section></main>`;
  };

  /* ---------- Belediye ---------- */
  SCREENS.belediye = () => {
    const fines = KE.G.ledger.months.reduce((a, m) => a + (m.fines || 0), 0) + (KE.G.monthExtras.fines || 0);
    return `<main class="screen">${head('Belediye', 'Ruhsat, hijyen ve denetim', null, 'bulent')}
      <div class="grid g3">${KE.G.branches.map((b) => `<article class="card"><h3>${esc(b.name)}</h3><div class="statl"><span>Temizlik</span>${bar(b.cleanliness, b.cleanliness < 40 ? 'crit' : b.cleanliness < 60 ? 'warn' : 'ok')}<b>${Math.round(b.cleanliness)}</b></div>
        <p class="small muted">${b.cleanliness < (KE.G.flags.muhtar ? 45 : 55) ? 'Denetim gelirse ceza yersin.' : 'Denetimden rahat geçer.'}</p>
        <div class="pc-foot"><span class="small">Hijyen eğitimi ve derin temizlik</span><button class="btn sm green" data-a="hygiene" data-id="${b.id}">${KE.tl(12000 * KE.G.priceIndex)}</button></div></article>`).join('')}</div>
      <div class="note">${IC('broom')}<span>Temizlik her müşteriyle düşer; masa toplamak ve temizlik görevlisi yükseltir. Denetimde ${KE.G.flags.muhtar ? 45 : 55}'in altı cezadır${KE.G.flags.muhtar ? ' (Muhtar Kemal Bey sayesinde)' : ''}. Bugüne kadar ödenen ceza: ${KE.tl(fines)}</span></div></main>`;
  };

  /* ---------- Reklam ajansı ---------- */
  const CAMPAIGNS = [
    { id: 'ilan', name: 'El ilanı dağıtımı', cost: 9000, days: 4, icon: 'map', desc: 'Sanayi ve konut sokaklarına ilan. Müşteri +%12, işçi ve aile +%30.', mods: [['traffic', 1.12], ['type:isci', 1.3], ['type:aile', 1.3]] },
    { id: 'sosyal', name: 'Sosyal medya kampanyası', cost: 22000, days: 7, icon: 'heart', desc: 'Kısa videolar ve fenomen paylaşımları. Müşteri +%18, öğrenci ve gece +%50.', mods: [['traffic', 1.18], ['type:ogrenci', 1.5], ['type:gece', 1.5]] },
    { id: 'radyo', name: 'Radyo reklamı', cost: 35000, days: 7, icon: 'bolt', desc: 'Sabah trafiğinde jingle. Bütün şubelerde müşteri +%10, beyaz yaka +%30.', mods: [['traffic', 1.1], ['type:beyaz', 1.3]] },
    { id: 'blog', name: 'Gurme blog daveti', cost: 15000, days: 5, icon: 'star', desc: 'Yemek yazarlarına tadım. Gurme +%60. Usta ★4 ve üstüyse itibar +4.', mods: [['type:gurme', 1.6]], rep: true },
    { id: 'tabela', name: 'Işıklı tabela yenileme', cost: 30000, days: 0, icon: 'store', desc: 'Seçili şubede kalıcı olarak müşteri +%6. Şube başına bir kez.', sign: true }
  ];
  SCREENS.ajans = () => {
    const b = B();
    const active = KE.G.mods.filter((m) => m.camp);
    const ys = KE.G.lastSummary && KE.G.lastSummary.branches[b.id] && KE.G.lastSummary.branches[b.id].stats;
    const capLost = ys && ys.arrivals > 20 ? (ys.lostWait + ys.lostFull + ys.lostFood) / ys.arrivals : 0;
    return `<main class="screen">${head('Reklam Ajansı', 'Doğru semte doğru kampanya', null, 'ajans')}
      ${capLost >= 0.12 ? `<div class="alert warn">${IC('queue')}<span><b>Dükkân zaten dolu:</b> dün gelenlerin %${KE.ekSayi(String(Math.round(capLost * 100)), 'i')} kapasite yetmediği için gitti. Reklamın getireceği müşterilerin çoğu da kapıdan dönecek; önce ekibi ya da salonu büyüt.</span></div>` : ''}
      <div class="grid g3">${CAMPAIGNS.map((c) => { const cost = Math.round(c.cost * KE.G.priceIndex); const done = c.sign && b.signBoost; const run = active.find((m) => m.camp === c.id); return `<article class="card"><span class="kicker">${IC(c.icon)}${c.days ? c.days + ' gün' : 'Kalıcı'}</span><h3>${c.name}</h3><p class="small">${c.desc}</p><div class="pc-foot">${done ? `<span class="chip gr">${IC('check')}Yapıldı</span>` : run ? `<span class="chip bl">Sürüyor · ${run.days} gün</span>` : `<b>${KE.tl(cost)}</b><button class="btn sm green" data-a="campaign" data-id="${c.id}" ${KE.G.cash < cost ? 'disabled' : ''}>Başlat</button>`}</div></article>`; }).join('')}</div></main>`;
  };

  /* ---------- Mahalle kahvesi ---------- */
  SCREENS.kahve = () => {
    const news = KE.G.news[0];

    const done = Object.keys(KE.G.goals).length;
    return `<main class="screen">${head('Mahalle Kahvesi', 'Hedefler, müdavimler, günlük ve gazete', null, 'ayse')}
      <div class="cols2"><div class="stack">
        <section class="panel"><div class="sechead"><h2>Hedefler</h2><span class="chip gd">${done} / ${KE.GOALS.length}</span></div><div class="goals">${KE.GOALS.map((g) => `<div class="goal ${KE.G.goals[g.id] ? 'done' : ''}"><i>${KE.G.goals[g.id] ? IC('check') : IC('star')}</i><span><b>${g.name}</b><small>${g.desc}</small></span><em>${KE.G.goals[g.id] ? KE.dateStr(KE.G.goals[g.id]) : g.final ? 'Unvan' : KE.tl(KE.goalReward(KE.G, g))}</em></div>`).join('')}</div></section>
        <section class="panel"><h2>Günlük arşivi</h2><div class="stack">${KE.G.journal.slice(0, 6).map((j) => `<div><span class="kicker">${j.date}</span><div class="journal sm">${H.sentences(j.text)}</div></div>`).join('') || '<p class="muted">İlk gün bittiğinde günlüğün burada birikecek.</p>'}</div></section>
      </div><div class="stack">
        <section class="panel"><div class="sechead"><h2>Müdavimler</h2><span class="small muted">Sevdiği yemeği iyi yap, gönlü dolsun. 5 kalpte arkadaşını getirir, 8'de mahallede seni över.</span></div><div class="regs">${KE.REGULARS.map((R) => { const r = KE.G.regulars[R.id]; const pid = R.fav[KE.G.mode]; return `<div class="reg"><span class="avatar lg">${KE.portrait(R.look || KE.CAST[R.cast].look, { mood: r.loyalty >= 5 ? 'happy' : 'neutral' })}</span><span class="reg-t"><b>${R.name}</b><small>${KE.CUSTOMER_TYPES[R.type].name} · ${r.visits} ziyaret</small>${H.hearts(r.loyalty)}</span><span class="reg-fav">${KE.ART.dish(pid)}<small>${pn(pid)}</small></span></div>`; }).join('')}</div></section>

        ${news ? `<section class="panel">${H.newsHtml(news)}</section>` : '<section class="panel"><h2>Mahalle Postası</h2><p class="muted">Gazete her pazar akşamı çıkar.</p></section>'}
      </div></div></main>`;
  };

  /* ---------- Şubeler (Merkez Ofis) ---------- */
  /* Oyun sonu: imparatorluk yolu */
  /* Rakip: düello karnesi ve sıradaki hamle */
  function rivalPanel() {
    const G = KE.G, R = G.rival || {};
    if (G.flags.empire) return '';
    const nx = KE.rivalNext(G);
    const steps = KE.RIVAL_ARC.map((a, i) => `<i class="${i < (R.stage || 0) ? 'on' : ''}"></i>`).join('');
    return `<section class="panel rivalp"><span class="avatar lg">${KE.portrait(KE.CAST.rakip.look, { mood: 'neutral', label: KE.CAST.rakip.name })}</span>
      <div><span class="kicker">Rakip · ${esc(KE.CAST.rakip.name)}</span><h2>"Lüks Kebap" ile hesaplaşma</h2>
        <p class="small muted">${nx ? (nx.due ? 'Cüneyt Bey yeni bir hamle hazırlıyor; her sabah kapıda olabilir.' : `Sıradaki hamle ${nx.era > (G.era || 1) ? nx.era + '. dönemde' : 'yakında'}.`) : 'Cüneyt Bey bütün kozlarını oynadı. Son söz senin.'} Rakip güçlendikçe semt şampiyonluğu çıtası yükselir.</p>
        <div class="rv-row"><span class="lvl">${steps}</span><span class="chip gr">${IC('check')}Kazandığın: ${R.wins || 0}</span><span class="chip rd">${IC('bolt')}Kaybettiğin: ${R.losses || 0}</span><span class="chip">Rakip gücü ${Math.round(R.power || 0)}</span></div></div></section>`;
  }
  /* 3. dönem: imza tarif, amiral dükkân, toplu siparişler */
  function investPanel() {
    const G = KE.G;
    if ((G.era || 1) < 3) return `<section class="panel invest locked"><div class="sechead"><h2>${IC('lock')}Büyük yatırımlar</h2><span class="muted small">3. dönemde (Şehrin zinciri) açılır: imza tarif, amiral dükkân, toplu siparişler.</span></div></section>`;
    const sig = G.signature && !G.signature.family ? G.signature : null, cost = KE.signatureCost(G), pn2 = (pid) => (KE.MODES[G.mode].products.find((p) => p.id === pid) || {}).name;
    const sigBox = `<article class="card inv"><span class="kicker">${IC('chef')}Ar-Ge mutfağı</span><h3>İmza tarif</h3>
      <p class="small">${sig ? `<b>${esc(pn2(sig.pid))}</b> · ${KE.SIGNATURE.names[sig.level - 1]} (seviye ${sig.level}/3). Her şubede müşteri +%${Math.round(sig.level * KE.SIGNATURE.traffic * 100)}; müşteriler fiyatına %${sig.level * 4} daha fazla katlanır.` : G.signature && G.signature.family ? `Aile tarifi <b>${esc(pn2(G.signature.pid))}</b> menüde. Kendi imza tarifini geliştir.` : 'Bir ürünü zincirin imzası yap: her şubede müşteri artar, o ürün daha çok satılır.'}</p>
      ${G.sigWork ? `<span class="chip or">${IC('clock')}Hazırlanıyor: ${Math.max(0, G.sigWork.ready - G.day)} gün kaldı</span>` : cost == null ? `<span class="chip gr">${IC('check')}Efsane seviyede</span>` : `<div class="pc-foot"><b>${KE.tl(cost)}</b><button class="btn sm green" data-a="signature" ${G.cash < cost ? 'disabled' : ''}>${sig ? 'Geliştir' : 'Tarif seç'}</button></div>`}</article>`;
    const fl = G.branches.find((b) => b.flagship);
    const flBox = `<article class="card inv"><span class="kicker">${IC('star')}Amiral dükkân</span><h3>${fl ? esc(fl.name) : 'Zincirin vitrini'}</h3>
      <p class="small">${fl ? 'Amiral dükkânda müşteri +%40, zincirin diğer şubelerinde +%8; şampiyonluk çıtası 3 puan aşağıda.' : 'Bir şubeni şehrin simgesine dönüştür: o şubede müşteri +%40, bütün zincirde +%8, semt tacını korumak kolaylaşır.'}</p>
      ${fl ? `<span class="chip gr">${IC('check')}Açıldı</span>` : `<div class="pc-foot"><b>${KE.tl(KE.flagshipCost(G))}</b><button class="btn sm green" data-a="flagship" ${G.cash < KE.flagshipCost(G) || G.phase !== 'morning' ? 'disabled' : ''}>Şube seç</button></div>`}</article>`;
    const taken = KE.contractTaken(G);
    const offers = KE.contractOffers(G);
    const ctBox = `<article class="card inv wide"><span class="kicker">${IC('truck')}Toplu siparişler · haftada bir</span><h3>Bu haftanın teklifleri</h3>
      ${G.contract ? `<p class="small"><b>${esc(G.contract.name)}</b> bugün akşam teslim edilecek (${G.contract.qty} porsiyon).</p>` : taken ? '<p class="small muted">Bu haftanın siparişi teslim edildi. Yeni teklifler pazartesi.</p>' : ''}
      <div class="offers">${offers.map((o) => `<div class="offer"><span><b>${esc(o.name)}</b><small>${esc(o.who)} · ${o.qty} × ${esc(pn2(o.pid))}</small></span><span class="o-pay"><b>+${KE.tl(o.pay - o.cost)}</b><small>ekip morali −${o.morale}</small></span><button class="btn xs green" data-a="contract" data-id="${o.id}" ${taken || G.contract || G.phase !== 'morning' ? 'disabled' : ''}>Kabul et</button></div>`).join('')}</div></article>`;
    return `<section class="panel invest"><div class="sechead"><h2>${IC('coin')}Büyük yatırımlar</h2><span class="muted small">Kasadaki parayı büyümeye çevir.</span></div><div class="grid g3">${sigBox}${flBox}${ctBox}</div></section>`;
  }
  function empirePanel() {
    const G = KE.G, st = KE.empireStatus(G);
    if (st.done) return `<section class="panel empire done"><span class="emp-crown">${IC('crown')}</span><div><span class="kicker">${KE.dateStr(G.flags.empire)}</span><h2>Şehrin Kebap İmparatoru</h2><p class="muted">"Lüks Kebap" artık zincirinin bir parçası. Rakip yok, şehir senin. Oyun sürüyor: yeni rekorların peşinden git.</p></div><button class="btn sm gold" data-a="empireEnding">${IC('star')}Hikâyeyi yeniden gör</button></section>`;
    const rows = st.req.map((r) => `<div class="emp-req ${r.ok ? 'ok' : ''}"><i>${IC(r.ok ? 'check' : r.id === 'cash' ? 'coin' : r.id === 'crowns' ? 'crown' : r.id === 'rep' ? 'star' : 'store')}</i><span><b>${r.label}</b><small>${r.money ? KE.tl(r.have) + ' / ' + KE.tl(r.need) : r.have + ' / ' + r.need}</small><span class="gauge ${r.ok ? 'ok' : 'or'}"><i style="width:${Math.round(r.p * 100)}%"></i></span></span></div>`).join('');
    return `<section class="panel empire"><div class="sechead"><h2>${IC('crown')} İmparatorluk yolu</h2><span class="muted small">Son hedef: rakip zincir "Lüks Kebap"ı satın al, şehrin tek kebap imparatoru ol.</span></div>
      <div class="emp-grid">${rows}</div>
      <div class="row between emp-foot"><p class="small muted">${st.ready ? 'Bütün şartlar tamam. Cüneyt Bey teklifini bekliyor.' : 'Şartlar tamamlanınca teklif verebilirsin. Satın alma sabah hazırlığında yapılır.'}</p><button class="btn ${st.ready ? 'gold' : 'ghost'}" data-a="buyRival" ${st.ready && G.phase === 'morning' ? '' : 'disabled'}>${IC('crown')}Teklif ver · ${KE.tl(st.price)}</button></div></section>`;
  }
  SCREENS.subeler = () => {
    const cards = KE.DISTRICTS.map((d) => {
      const b = KE.G.branches.find((x) => x.district === d.id);
      if (b) {
        const h = b.history.slice(-7);
        const st = KE.branchStaff(KE.G, b);
        const mgr = st.find((s) => s.role === 'mudur');
        return `<article class="card branch ${b.id === KE.G.activeBranch ? 'sel' : ''}"><div class="br-art">${KE.ART.storefront(b.name, '#d7263d', true)}</div><span class="kicker">${d.name}</span><h3>${esc(b.name)}</h3>
          <div class="chips"><span class="chip">${st.length} kişi</span><span class="chip ${mgr ? 'gr' : 'rd'}">${mgr ? 'Müdür: ' + esc(mgr.name) : 'Müdür yok'}</span><span class="chip">Temizlik ${Math.round(b.cleanliness)}</span>${b.flagship ? `<span class="chip gd">${IC('star')}Amiral</span>` : ''}</div>
          ${mgr ? `<label class="managed"><input type="checkbox" data-a="toggleManaged" data-id="${b.id}" ${b.managed !== false ? 'checked' : ''}><span><b>Müdür yönetsin</b><small>Sabah stok seviyesini dünkü satışa, fiyatları haftada bir piyasaya göre kendisi ayarlar.${b.managedNote && b.managedNote.length ? ' Bugün: ' + b.managedNote.map((n) => ({ stok: 'stok artırıldı', fire: 'fire için stok azaltıldı', fiyat: 'fiyatlar güncellendi' })[n]).join(', ') + '.' : ''}</small></span></label>` : (KE.G.branches.length >= 2 ? '<p class="tiny muted">Müdür alırsan şubenin sabah ayarlarını o yapar.</p>' : '')}
          ${h.length > 1 ? lineChart([{ name: 'Son 7 gün ciro', color: '#f28c28', values: h.map((x) => x.revenue), area: true }], h.map((x) => String(KE.dateOf(x.day).getUTCDate())), { h: 120, label: 'Şube cirosu' }) : '<p class="small muted">Henüz yeterli veri yok.</p>'}
          <div class="pc-foot">${b.id !== KE.G.activeBranch ? `<button class="btn sm green" data-a="viewBranch" data-id="${b.id}">${IC('eye')}Bu şubeye geç</button>` : `<button class="btn sm" data-a="go" data-s="shop">${IC('store')}Dükkâna git</button>`}</div></article>`;
      }
      const cost = KE.branchCost(KE.G, d);
      return `<article class="card branch new"><span class="kicker">${d.side} yakası · ${d.inspired} esintisi</span><h3>${d.name}</h3><p class="small">${d.desc}</p>
        <div class="chips"><span class="chip">Kira ${KE.tl(d.rent * KE.G.priceIndex)}</span><span class="chip">Trafik ${d.traffic}</span><span class="chip">Rakip ${d.rivals}</span></div>
        <div class="chips">${Object.entries(d.mix).sort((a, c) => c[1] - a[1]).slice(0, 3).map(([t]) => `<span class="chip bl">${KE.CUSTOMER_TYPES[t].name}</span>`).join('')}</div>
        <div class="pc-foot"><div class="price"><b>${KE.tl(cost)}</b><small>3 aylık depozito + tadilat ve ekipman</small></div><button class="btn sm green" data-a="openBranch" data-d="${d.id}" ${KE.G.cash < cost || KE.G.phase !== 'morning' ? 'disabled' : ''}>Şube aç</button></div></article>`;
    }).join('');
    return `<main class="screen">${head('Merkez Ofis', 'Şubeler aynı anda çalışır; şube şeridinden canlı izleyebilirsin')}
      ${morningOnly()}
      ${(KE.G.era || 1) >= 3 || KE.G.flags.empire ? empirePanel() : ''}
      ${rivalPanel()}
      ${investPanel()}
      <div class="note">${IC('users')}<span>Yeni şubeye Usta Pazarı'ndan bir usta, Eleman Bürosu'ndan kasiyer ve komi/garson al. Müdür, ekibi yoğunluğa göre kendisi yönetir. Ustasız şube kepenk açamaz.</span></div>
      ${KE.G.branches.length >= 3 ? `<section class="panel row between"><div><h2>Merkezi mutfak</h2><p class="small muted">Döner ve kıyma merkezde hazırlanıp şubelere dağıtılır. Malzeme maliyeti %12 düşer.</p></div>${KE.G.centralKitchen ? `<span class="chip gr">${IC('check')}Kuruldu</span>` : `<button class="btn green" data-a="central" ${KE.G.cash < 450000 * KE.G.priceIndex ? 'disabled' : ''}>${KE.tl(450000 * KE.G.priceIndex)}</button>`}</section>` : ''}
      <div class="grid g3">${cards}</div>
      ${CL() ? `<section class="panel" id="cityrank"><div class="sechead"><h2>Şehir sıralaması</h2><span class="muted small">Bu ay, doğrulanmış günlere göre bütün oyuncular</span></div><p class="small muted">Yükleniyor…</p></section>` : ''}</main>`;
  };
  /* Şehir sıralaması (bulut açıksa, sayfa çizildikten sonra doldurulur) */
  UI.fillRanking = async function () {
    const box = document.getElementById('cityrank'); const cl = CL();
    if (!box || !cl) return;
    if (!cl.ready) { box.querySelector('p').innerHTML = `Sıralamaya katılmak için bulut kaydını aç. <button class="btn xs" data-a="privacy">Hesap ve gizlilik</button>`; return; }
    const month = KE.monthKey(KE.G.day);
    const [rows, champs] = await Promise.all([cl.leaderboard(month, KE.G.mode), cl.champions(month)]);
    if (!document.getElementById('cityrank')) return;
    box.querySelector('p').outerHTML = (rows.length ? `<ol class="rank">${rows.map((r, i) => `<li class="${r.is_me ? 'me' : ''}"><b>${i + 1}</b><span>${esc(r.display_name)}</span><em>${KE.tl(r.revenue)}</em><small>${r.days} gün · itibar ${r.reputation}</small></li>`).join('')}</ol>` : '<p class="small muted">Bu ay henüz doğrulanmış sonuç yok. Günü bitirdiğinde sonucun buraya gelir.</p>')
      + (champs.length ? `<h3>Semt şampiyonları</h3><div class="chips">${champs.map((c) => `<span class="chip gd">${esc((KE.DISTRICTS.find((d) => d.id === c.district) || {}).name || c.district)}: ${esc(c.display_name)}</span>`).join('')}</div>` : '');
  };
  /* KVKK aydınlatma ve rıza */
  UI.privacyModal = function (first) {
    const cl = CL(); if (!cl) { UI.toast('Bu sürümde bulut bağlantısı yok; oyun yalnızca bu cihazda kaydedilir.'); return; }
    const c = cl.consent() || {};
    UI.modal(`<div class="mhead"><h2>${first ? 'Hoş geldin!' : 'Hesap ve gizlilik'}</h2><p class="muted">Oyun her zaman bu cihaza kaydedilir. Aşağıdakiler isteğe bağlıdır; istediğin zaman kapatabilirsin.</p></div>
      <div class="stack">
        <label class="switch lbl"><input type="checkbox" id="cs-cloud" ${c.cloud ? 'checked' : ''}><i></i><span><b>Bulut kaydı ve şehir sıralaması</b><small>Anonim bir hesap açılır. Kaydın bulutta yedeklenir, gün sonuçların takma adınla sıralamaya girer. E-posta istenmez.</small></span></label>
        <label class="field">Sıralamada görünecek takma ad<input id="cs-name" maxlength="24" value="${esc(c.name || (KE.G && KE.G.owner) || '')}" placeholder="Örn. Deniz Usta"></label>
        <label class="switch lbl"><input type="checkbox" id="cs-an" ${c.analytics ? 'checked' : ''}><i></i><span><b>Kullanım istatistikleri</b><small>Hangi ekranların kullanıldığı ve oyunun nerede zorlandığı gibi bilgiler. Kişisel veri, konum ya da reklam kimliği toplanmaz.</small></span></label>
        <p class="tiny muted">Veriler Supabase üzerinde AB bölgesinde tutulur; ölçümler 180 günde silinir. Hata raporları kişisel veri içermez. Ayrıntılar oyunun gizlilik metninde.</p>
        ${!first && c.cloud ? `<div class="row"><input id="cs-mail" type="email" class="grow inp" placeholder="E-posta (başka cihazda devam için)"><button class="btn sm ghost" data-a="linkMail">Bağla</button></div><div class="row"><button class="btn sm ghost" data-a="cloudLoad">${IC('arrow')}Buluttaki kaydı yükle</button><button class="btn sm red" data-a="deleteData">Bütün verilerimi sil</button></div>` : ''}
      </div><div class="acts">${first ? '<button class="btn ghost" data-a="consentNone">Hiçbirini istemiyorum</button>' : '<button class="btn ghost" data-a="closeModal">Kapat</button>'}<button class="btn green" data-a="consentSave">Kaydet</button></div>`);
  };

  /* ---------- Besi çiftliği ---------- */
  function farmScene(empty) {
    let animals = '';
    if (!empty) {
      const F = KE.G.farm;
      let i = 0;
      KE.farmKinds(KE.G).forEach((k) => {
        const heads = KE.penHeads(F.pens[k]);
        const show = k === 'tavuk' ? Math.min(10, Math.ceil(heads / 25)) : Math.min(8, heads);
        for (let n = 0; n < show; n++, i++) {
          const zone = { dana: [30, 50], kuzu: [54, 72], tavuk: [76, 92] }[k];
          const x = zone[0] + ((n * 37 + i * 11) % (zone[1] - zone[0]));
          const y = 70 + ((n * 23 + i * 7) % 20);
          animals += `<div class="fa ${k}" style="left:${x}%;top:${y}%;--d:-${((n * 3.1 + i * 1.3) % 14).toFixed(1)}s;z-index:${Math.round(y)}">${KE.ART.animal(k)}</div>`;
        }
      });
    } else animals = `<div class="fa dana" style="left:18%;top:64%">${KE.ART.animal('dana')}</div><div class="fa kuzu" style="left:46%;top:70%">${KE.ART.animal('kuzu')}</div>`;
    return `<div class="farm"><div class="f-sky"></div><div class="f-hills"></div><div class="f-field"></div>
      <div class="f-barn">${KE.ART.barn()}</div><div class="f-fence a">${KE.ART.fence(300)}</div><div class="f-fence b">${KE.ART.fence(300)}</div>
      ${animals}<div class="f-truck">${KE.ART.truck(KE.G && KE.G.farm ? 'TAZE ET' : 'SATILIK')}</div></div>`;
  }
  SCREENS.ciftlik = () => {
    if (!KE.G.farm) {
      const cost = KE.farmCost(KE.G);
      return `<main class="screen">${head('Besi Çiftliği', 'Kendi etini kendin yetiştir')}
        <section class="farmhero"><div class="fh-scene">${farmScene(true)}</div><div class="fh-copy"><span class="kicker">Satılık · Yeşilova</span><h2>Kendi etimiz, kendi lezzetimiz</h2>
          <p>Çiftlikte ${KE.farmKinds(KE.G).map((k) => KE.FARM[k].name.toLowerCase()).join(', ')} yetiştirirsin. Olgunlaşan hayvanlar kesimhaneye gider, et her sabah şubelere sevk edilir. Kendi etimizle pişen tabaklarda kalite artar, et maliyeti düşer.</p>
          <ul class="chk">${KE.farmKinds(KE.G).map((k) => `<li>${IC('cow')}<span><b>${KE.FARM[k].name}</b> · ${KE.FARM[k].days} günde büyür · yaklaşık ${KE.tl(KE.farmCostPerKg(KE.G, k))}/kg</span></li>`).join('')}</ul>
          <div class="row"><div class="price"><b>${KE.tl(cost)}</b><small>+ aylık ${KE.tl(KE.FARM_MONTHLY * KE.G.priceIndex)} işletme gideri</small></div><button class="btn big green" data-a="buyFarm" ${KE.G.cash < cost ? 'disabled' : ''}>${IC('check')}Çiftliği satın al</button></div></div></section></main>`;
    }
    const F = KE.G.farm;
    const ingName = (k) => KE.MODES[KE.G.mode].ingredients[k].name;
    return `<main class="screen">${head('Besi Çiftliği', 'Yeşilova · ' + (F.auto ? 'otomatik besi açık' : 'elle yönetim'))}
      <section class="farmhero live"><div class="fh-scene">${farmScene(false)}</div></section>
      <div class="kpis"><div class="kpi">${IC('truck')}<small>Bugüne kadar sevk</small><b>${KE.num(F.shipped, 0)} kg</b></div>
        ${Object.entries(F.store).filter(([, v]) => v > 0.05).map(([k, v]) => `<div class="kpi">${IC('leaf')}<small>Depoda ${ingName(k).toLowerCase()}</small><b>${KE.num(v, 1)} kg</b></div>`).join('')}
        <div class="kpi"><label class="switch lbl"><input type="checkbox" data-c="farmAuto" ${F.auto ? 'checked' : ''}><i></i><span><b>Otomatik besi</b><small>Olgunlaşanı keser, talebe göre yenisini alır</small></span></label></div></div>
      <div class="grid g3">${KE.farmKinds(KE.G).map((k) => {
        const D = KE.FARM[k], pen = F.pens[k], heads = KE.penHeads(pen), cap = KE.penCap(k, pen);
        const ready = pen.batches.filter((x) => x.age >= D.days).reduce((a, x) => a + x.count, 0);
        const up = D.upCost[pen.level + 1];
        return `<article class="card pen"><div class="pen-art">${KE.ART.animal(k)}</div><div class="row between"><h3>${D.name}</h3><span class="chip">${heads} / ${cap} ${D.unit}</span></div><p class="small muted">${D.desc}</p>
          <div class="batches">${pen.batches.map((x) => `<div class="batch"><span>${x.count} ${D.unit}</span>${bar(x.age / D.days * 100, x.age >= D.days ? 'ok' : 'or')}<small>${x.age >= D.days ? 'Hazır' : `${D.days - x.age} gün`}</small></div>`).join('') || '<p class="small muted">Ağıl boş.</p>'}</div>
          <div class="chips"><span class="chip">Yavru ${KE.tl(KE.animalPrice(KE.G, k) * D.batch)}${D.batch > 1 ? ' / ' + D.batch : ''}</span><span class="chip">Yem ${KE.tl(D.feed * KE.G.priceIndex)}/${D.unit}/gün</span><span class="chip gr">${KE.tl(KE.farmCostPerKg(KE.G, k))}/kg</span></div>
          <div class="pc-foot"><div class="row"><button class="btn sm green" data-a="buyAnimal" data-k="${k}" ${heads + D.batch > cap ? 'disabled' : ''}>${IC('plus')}Yavru al</button>${ready ? `<button class="btn sm gold" data-a="slaughter" data-k="${k}">${IC('truck')}Kesimhaneye (${ready})</button>` : ''}${up ? `<button class="btn sm ghost" data-a="upgradePen" data-k="${k}" ${KE.G.cash < up * KE.G.priceIndex ? 'disabled' : ''}>Ağılı büyüt · ${KE.tl(up * KE.G.priceIndex)}</button>` : ''}</div></div></article>`;
      }).join('')}</div></main>`;
  };

  Object.assign(H, { CAMPAIGNS });
})();
