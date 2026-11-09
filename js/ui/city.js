/* Kebab Empire — arayüz: ana menü: şehir haritası ve sağ panel. */
(function () {
  const UI = KE.UI, H = UI.H, SCREENS = UI.SCREENS, A = UI.A, C = UI.C;
  const { esc, IC, MODE, B } = H;

  /* ---------- Harita: sağ panel (hedef halkası, saate göre işler, yerler) ---------- */
  function cityTasks() {
    const out = [];
    const b = B();
    const add = (id, title, sub, when, urgent) => { if (!out.some((t) => t.id === id)) out.push({ id, title, sub, when, urgent }); };
    const es = KE.eraStatus(KE.G);
    const miss = es.next && es.req.find((r) => !r.ok);
    if (miss && KE.placeOpen(KE.G, ERA_PLACE[miss.id])) add(ERA_PLACE[miss.id], miss.label, 'Dönem hedefi: sıradaki döneme geçmek için', 'pm');
    const emp = KE.empireStatus(KE.G);
    if (emp.ready && !emp.done) add('subeler', '"Lüks Kebap" satılık!', 'Bütün şartlar tamam: Merkez Ofis\'ten teklifini ver', 'now', true);
    if (KE.G.cash < 0) add('banka', 'Kasa eksiye düştü', 'Kredi teklifine bak, maaşlar gecikmesin', 'now', true);
    const noCook = KE.G.branches.filter((x) => !KE.branchStaff(KE.G, x).some(KE.isCook));
    if (noCook.length) add('lonca', 'Ustasız şube var', `${noCook.map((x) => x.name).join(', ')} bugün kapalı kalır`, 'now', true);
    if (KE.G.phase === 'morning' && b) {
      const M2 = MODE();
      const low = Object.entries(M2.ingredients).filter(([k]) => b.usage[k] > 0 && (b.stock[k] || 0) / b.usage[k] < 0.9).map(([, ing]) => ing.name);
      if (low.length) add('hal', 'Stok bir güne yetmiyor', low.slice(0, 3).join(', ') + (low.length > 3 ? '…' : ''), 'now', true);
    }
    if (KE.G.phase === 'service') {
      const tired = KE.G.staff.filter((s) => s.energy < 30 && s.pos !== 'mola');
      if (tired.length) add('buro', `${tired[0].name.split(' ')[0]} yoruldu`, tired.length > 1 ? `${tired.length} kişi dinlenmek istiyor` : 'Molaya gönder ya da yardımcı al', 'now');
    }
    const regs = (KE.G.regularVisits || []).filter((v) => !KE.G.live || !KE.G.live[v.branchId] || KE.G.live[v.branchId].minute < v.minute);
    if (regs.length) {
      const R0 = KE.REGULARS.find((r) => r.id === regs[0].rid);
      const hr = KE.OPEN_HOUR + regs[0].minute / 60;
      add('kahve', `${R0 ? R0.name : 'Bir müdavim'} bugün uğrayacak`, regs.length > 1 ? `${regs.length} müdavim bekleniyor, iyi ağırla` : 'Müdavimi memnun et, sadakati artsın', hr < 13 ? 'now' : hr < 17 ? 'pm' : 'eve');
      out[out.length - 1].time = KE.clock(regs[0].minute);
    }
    const sp = KE.specialDay(KE.G.day);
    if (sp && sp.id === 'mac') add('ajans', 'Akşam maç var', 'Kalabalık gelir; ekibi ve stoku hazırla', 'eve');
    if (sp && sp.id !== 'mac') add('ajans', sp.name, sp.desc, 'pm');
    let left = 99; for (let k = 0; k < 32; k++) if (KE.isMonthEnd(KE.G.day + k)) { left = k; break; }
    if (left <= 3) add('office', left ? `Ay sonuna ${left} gün` : 'Bugün ay sonu', 'Maaş, SGK ve kira ödenecek', 'eve');
    if (!KE.G.farm && KE.G.day >= 10 && KE.G.cash > 3000000) add('ciftlik', 'Çiftlik satılık', 'Kendi etini yetiştir, maliyet düşsün', 'pm');
    const ord = { now: 0, pm: 1, eve: 2 };
    return out.slice(0, 4).sort((a, c) => ord[a.when] - ord[c.when]).map((t, i) => Object.assign(t, { n: i + 1, color: KE.MAP.place(t.id).color }));
  }
  function mapOpts(tasks) {
    tasks = tasks || cityTasks();
    const TL = { now: 'Şimdi', pm: 'Öğleden sonra', eve: 'Akşam' };
    const fw = Math.max(320, window.innerWidth - (window.innerWidth > 1000 ? 380 : 0)), fh = Math.max(600, window.innerHeight - 128);
    const phone = window.innerWidth <= 760 || (window.innerHeight <= 520 && window.innerWidth > window.innerHeight);
    return { fill: true, par: phone ? 'xMidYMid meet' : window.innerWidth > 1000 && fw / fh < 1400 / 860 ? 'xMidYMin meet' : 'xMidYMid slice', tasks: tasks.map((t) => ({ id: t.id, n: t.n, color: t.color, label: t.time || TL[t.when].replace('Öğleden sonra', 'Öğleden s.') })), route: UI.mapRoute || (tasks[0] && tasks[0].id) };
  }
  function goalRing() {
    const prog = KE.dailyProgress(KE.G, false).filter((g) => !g.bonus);
    const live = KE.G.phase !== 'morning';
    const served = KE.G.live ? KE.G.branches.reduce((a, b) => a + (KE.G.live[b.id] ? KE.G.live[b.id].stats.served : 0), 0) : 0;
    const tips = KE.G.live ? KE.G.branches.reduce((a, b) => a + (KE.G.live[b.id] ? KE.G.live[b.id].stats.tips : 0), 0) : 0;
    const sg = prog.find((g) => g.kind === 'served');
    const exp = Math.round(KE.G.branches.reduce((a, b) => a + (KE.branchStaff(KE.G, b).some(KE.isCook) ? KE.expectedCustomers(KE.G, b) : 0), 0));
    const target = sg ? sg.target : exp;
    const val = live ? served : 0;
    const f = target ? Math.min(1, val / target) : 0;
    const R = 44, C = 2 * Math.PI * R;
    const done = prog.filter((g) => g.state === 'done').length;
    return `<div class="cp-goal"><svg viewBox="0 0 112 112" class="gring" aria-label="Günlük hedef ${val}/${target}"><circle cx="56" cy="56" r="${R}" fill="none" stroke="#efe0bf" stroke-width="12"/><circle cx="56" cy="56" r="${R}" fill="none" style="stroke:var(--altin)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(C * f).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 56 56)"/><text x="56" y="58" text-anchor="middle" class="r1">${val}</text><text x="56" y="76" text-anchor="middle" class="r2">/ ${target}</text></svg>
      <div class="cp-stats"><span class="k">${live ? 'Bugün' : 'Beklenen'}</span>
        <div><i style="background:#3b8ee0"></i><span>Müşteri</span><b>${live ? served : exp}</b></div>
        <div><i style="background:#2ecc71"></i><span>Bahşiş</span><b>${live ? KE.tl(tips) : '—'}</b></div>
        <div><i style="background:#e8553d"></i><span>Hedefler</span><b>${done}/${prog.length || 0}</b></div></div></div>`;
  }
  function cityPanel(tasks) {
    const groups = [['now', 'Şimdi', '#e8553d'], ['pm', 'Öğleden sonra', '#16a085'], ['eve', 'Akşam', '#6c5fb0']];
    const clockNow = KE.G.phase === 'service' && KE.G.live && KE.G.live[KE.G.activeBranch] ? KE.clock(Math.min(KE.G.live[KE.G.activeBranch].minute, KE.MINUTES)) : KE.G.phase === 'closing' ? '23:00' : '08:30';
    const taskHtml = tasks.length ? groups.map(([k, l, c]) => {
      const ts = tasks.filter((t) => t.when === k); if (!ts.length) return '';
      return `<div class="cp-grp"><div class="cp-gh" style="--c:${c}"><i></i><span>${l}</span><em>${k === 'now' ? clockNow : ts[0].time || (k === 'pm' ? '14:00' : '19:00')}</em></div>
        ${ts.map((t) => { const p = KE.MAP.place(t.id); return `<button class="cp-task ${t.urgent ? 'urg' : ''} ${UI.mapRoute === t.id ? 'on' : ''}" data-a="go" data-s="${t.id}" data-route="${t.id}" style="--c:${t.color}"><span class="cp-ic">${IC(p.icon)}<b>${t.n}</b></span><span class="cp-tt"><b>${esc(t.title)}</b><small>${esc(t.sub)}</small></span>${t.urgent ? '<em class="cp-urg">Acil</em>' : ''}</button>`; }).join('')}</div>`;
    }).join('') : `<div class="cp-empty">${IC('check')}<span>Bugün acil bir iş yok. Dükkâna geçip kepengi aç ya da yerleri gez.</span></div>`;
    const act = KE.G.phase === 'morning' ? ['store', KE.G.branches.length > 1 ? 'Dükkâna geç, kepenkleri aç' : 'Dükkâna geç, kepengi aç'] : KE.G.phase === 'service' ? ['eye', 'Dükkâna bak'] : ['chart', 'Kapanış raporuna git'];
    const st = UI.sheetState();
    return `<aside class="citypanel"><button class="sheet-handle" data-a="sheetToggle" aria-label="${st === 'max' ? 'Paneli küçült' : 'Paneli büyüt'}" aria-expanded="${st !== 'min'}"><i></i></button><div class="cp-in">
      <div class="cp-head"><span class="cp-ht"><span class="kicker">${KE.weekday(KE.G.day)} · ${clockNow}</span><h2>${esc(B().name)}</h2></span><button class="btn green cp-go" data-a="go" data-s="shop">${IC(act[0])}<span>${KE.G.phase === 'morning' ? 'Dükkâna geç' : KE.G.phase === 'service' ? 'Dükkâna bak' : 'Kapanış'}</span></button></div>
      ${UI.adviceCard(false)}
      ${goalRing()}
      ${eraCard()}${weeklyCard()}
      <div class="cp-sec">Yapılacaklar</div><div class="cp-tasks">${taskHtml}</div>
      <div class="cp-placewrap"><div class="cp-sec">Yerler</div>
      <div class="cp-places">${KE.MAP.PLACES.map((p) => { const t = tasks.find((x) => x.id === p.id); const lk = !KE.placeOpen(KE.G, p.id); return `<button class="cp-pl ${lk ? 'lk' : ''}" data-a="go" data-s="${p.id}" data-route="${p.id}" style="--c:${lk ? '#a99a88' : p.color}" title="${esc(p.name)}${lk ? ' · ' + KE.PLACE_ERA[p.id] + '. dönem' : ''}" aria-label="${esc(p.name)}">${IC(lk ? 'lock' : p.icon)}${t ? `<b>${t.n}</b>` : ''}<small class="cp-pn">${esc(p.name)}</small></button>`; }).join('')}</div></div>
      <button class="btn big green block cp-main" data-a="go" data-s="shop">${IC(act[0])}${act[1]}</button>
      ${KE.G.phase === 'morning' ? `${KE.G.day > 2 ? `<button class="btn ghost block quickday" data-a="quickDay" title="Servisi izlemeden günü tamamla">${IC('ff')}Hızlı gün: servisi atla, sonuca geç</button>` : ''}${KE.quickWeekOpen(KE.G) ? `<button class="btn ghost block quickday" data-a="quickWeek">${IC('ff')}Haftayı hızlı geç (önemli bir şey olursa durur)</button>` : ''}` : ''}
    </div></aside>`;
  }

  /* ---------- Danışman: "Bugün ne yapmalıyım?" ----------
     Durumu tarayıp en önemli üç öneriyi, gerekçesi ve tek dokunuşluk eylemiyle sıralar. */
  UI.advice = function () {
    const G = KE.G, out = [];
    const add = (pri, ic, title, why, btn, attrs) => out.push({ pri, ic, title, why, btn, attrs });
    const morning = G.phase === 'morning';
    G.branches.forEach((b) => {
      const st = KE.branchStaff(G, b), multi = G.branches.length > 1, nm = multi ? b.name + ': ' : '';
      if (!st.some(KE.isCook)) { add(0, 'chef', nm + 'ustasız şube', 'Usta olmadan kepenk açılmaz; bugün kapalı kalır.', 'Usta Pazarı', 'data-a="go" data-s="lonca"'); return; }
      if (morning && !st.some((s) => s.pos === 'kasa')) add(0, 'cash', nm + 'kasada kimse yok', 'Sipariş alınamaz. Bir kasiyer ya da garsonu kasaya ver.', 'Ekibi düzenle', `data-a="viewBranch" data-id="${b.id}"`);
      if (morning && !st.some((s) => s.pos === 'servis') && st.filter((s) => !KE.isCook(s)).length > 1) add(0, 'tray', nm + 'serviste kimse yok', 'Hazır yemekler tezgâhta soğur.', 'Ekibi düzenle', `data-a="viewBranch" data-id="${b.id}"`);
      if (morning) {
        /* sabah siparişi o güne yansır: kalabalık gün ya da kampanya sonrası eksik varsa tek dokunuşla tamamla */
        const sh = KE.shortfall(G, b);
        if (sh.items.length) add(1, 'cart', nm + 'stok bugüne yetmeyecek', (() => { const n = sh.items.map((k) => KE.MODES[G.mode].ingredients[k].name); return n.length > 2 ? `${n.length} malzeme beklenen kalabalığa yetmez.` : n.length === 2 ? `${n[0]} ve ${n[1]} beklenen kalabalığa yetmez.` : `${n[0]} beklenen kalabalığa yetmez.`; })() + '|Sabah eksiği tamamlarsan ürünler gün ortasında bitmez.', `Tamamla · ${KE.tl(sh.cost)}`, `data-a="topUpToday" data-id="${b.id}"`);
        if (b.bolNote) add(2, 'truck', nm + 'sabah siparişi "Bol"a çekildi', 'Dün acil kurye çağrıldı; bugün stok daha bol geldi. Fire artarsa Hal\'den "Normal"e dön.', 'Hal', 'data-a="go" data-s="hal"');
        const yso = G.lastSummary && G.lastSummary.branches[b.id] && Object.entries(G.lastSummary.branches[b.id].stats.stockouts || {}).filter(([, m]) => m < 600);
        if (!sh.items.length && yso && yso.length >= 2 && b.stockLevel < 1.5 && !KE.isManaged(G, b)) add(1, 'cart', nm + 'dün ürün bitti', `${yso.length} ürün akşam saatlerinden önce tükendi. Sabah siparişini "Bol"a çevir; fark bugüne hemen yansır.`, 'Bol sipariş', `data-a="advBol" data-id="${b.id}"`);
        if (sh.factor >= 1.15) {
          const front = st.filter((s) => s.pos === 'kasa' || s.pos === 'servis').length;
          add(sh.items.length ? 2 : 1, 'users', nm + `bugün kalabalık (${KE.pct(Math.round((sh.factor - 1) * 100), 1)})`, (front < 2 ? 'Kasada ve serviste tek kişi var; kuyruk uzar.|' : '') + 'Kimseyi molaya gönderme; stok ve ekip hazır olsun.', 'Hal tahmini', 'data-a="go" data-s="hal"');
        }
      }
      const ys = G.lastSummary && G.lastSummary.branches[b.id] && G.lastSummary.branches[b.id].stats;
      if (ys && ys.arrivals > 20) {
        const lost = (ys.lostWait + ys.lostFull + ys.lostFood) / ys.arrivals;
        if (lost >= 0.12) {
          const cooks = st.filter(KE.isCook).length, stn = KE.stations(G, b);
          const pct = `Dün gelenlerin %${KE.ekSayi(String(Math.round(lost * 100)), 'i')} hizmet alamadan gitti.` + '|';
          if (ys.lostFood >= ys.lostWait && ys.lostFood >= ys.lostFull) {
            if (cooks < stn && KE.canHire(G, b, 'usta').ok) add(1, 'chef', nm + 'mutfak yetişmiyor', pct + ` ${stn - cooks} ocak yeri boş: bir pişirmeci al.`, 'Usta Pazarı', 'data-a="go" data-s="lonca"');
            else add(1, 'fire', nm + 'mutfak yetişmiyor', pct + ' Ocağı büyüt, sonra pişirmeci al.', 'Mobilya ve Dekor', 'data-a="go" data-s="dekor"');
          } else if (ys.lostFull > ys.lostWait) add(1, 'table', nm + 'yer yetmiyor', pct + ' Salonu büyüt: masa ve kuyruk yeri artar.', 'Mobilya ve Dekor', 'data-a="go" data-s="dekor"');
          else if (KE.canHire(G, b, 'kasiyer').ok) add(1, 'users', nm + 'kuyruk eriyemiyor', pct + ' Kasaya ya da servise bir kişi daha al.', 'Eleman Bürosu', 'data-a="go" data-s="buro"');
          else add(1, 'table', nm + 'kuyruk eriyemiyor', pct + ' Salon kadrosu dolu: salonu büyüt, sonra eleman al.', 'Mobilya ve Dekor', 'data-a="go" data-s="dekor"');
        }
      }
      if (morning && !KE.isManaged(G, b) && KE.priceRatio(G, b) < 0.95) add(1, 'coin', nm + 'fiyatlar enflasyonun gerisinde', `Fiyatların piyasanın ${KE.pct(Math.round((1 - KE.priceRatio(G, b)) * 100))} altında; kâr payın eriyor.`, 'Fiyatları güncelle', `data-a="advPrices" data-id="${b.id}"`);
      if (b.cleanliness < 50 && !st.some((s) => s.role === 'temizlik') && KE.canHire(G, b, 'temizlik').ok) add(1, 'broom', nm + 'temizlik düşük', 'Memnuniyet düşer, denetimde ceza riski var. Temizlikçi en verimli işe alımdır.', 'Eleman Bürosu', 'data-a="go" data-s="buro"');
      const sad = st.filter((s) => s.morale < 35);
      if (sad.length) add(1, 'heart', nm + `${sad[0].name} çok mutsuz`, 'Moral 18\'in altına inerse istifa eder. Zam, mola ya da kostüm moral yükseltir.', KE.isCook(sad[0]) ? 'Usta Pazarı' : 'Eleman Bürosu', `data-a="go" data-s="${KE.isCook(sad[0]) ? 'lonca' : 'buro'}"`);
    });
    const sp2 = morning && KE.specialDay(G.day + 1);
    /* her hafta gelen cuma bilinir; yalnızca maç ve bayram önceden haber verilir */
    if (sp2 && sp2.id !== 'cuma') add(2, 'star', `Yarın ${sp2.name}`, 'Kalabalık bekleniyor. Rıza siparişi kendisi artırır; ekibi tam kadro hazırla.', 'Hal tahmini', 'data-a="go" data-s="hal"');
    /* müfettiş yalnızca rezervasyonlu şubede önceden görünür; öteki şubelere habersiz gelir */
    const need = `Yıldız için memnuniyet ${KE.pct(KE.INSPECT.sat)} ve kaçan müşteri %${Math.round(KE.INSPECT.lost * 100)}'in altında olmalı.`;
    if (morning && G.inspect) { const ib = G.branches.find((x) => x.id === G.inspect.bid); if (ib && KE.resOn(ib)) add(0, 'star', `Rehber müfettişi bugün ${ib.name} şubesinde`, `Defterdeki "R. Güler" adına iki kişilik masa o.|${need} Ekibi tam kadro koy, stoğu tamamla.`, 'Şubeye git', `data-a="viewBranch" data-id="${ib.id}"`); }
    if (morning && G.inspectNext) { const ib = G.branches.find((x) => x.id === G.inspectNext.bid); if (ib && KE.resOn(ib)) add(1, 'book', `Yarın ${ib.name} defterinde tanıdık bir isim`, `"R. Güler" adına iki kişilik akşam masası: rehber müfettişi olabilir.|${need} Bugünden ekibi ve stoğu hazırla.`, 'Şubeye git', `data-a="viewBranch" data-id="${ib.id}"`); }
    if (morning && (G.era || 1) >= KE.RESERVATION.era && G.reputation >= 80) {
      const nb = G.branches.find((b) => { const ys = G.lastSummary && G.lastSummary.branches[b.id] && G.lastSummary.branches[b.id].stats; return !b.reservation && ys && ys.arrivals > 40 && KE.lostShare(ys) >= 0.15; });
      if (nb) add(2, 'book', `${nb.name}: rezervasyon defteri`, 'Dolu saatte gelen müşteri kaçmaz, başka saate yönlendirilir. Rehber müfettişi de önceden görünür.', 'Mobilya ve Dekor', `data-a="viewDekor" data-id="${nb.id}"`);
    }
    if (G.cash < 0) add(0, 'coin', 'Kasa eksiye düştü', 'Maaşlar gecikirse SGK teşviki kaybolur. Kısa vadeli bir kredi çek.', 'Banka', 'data-a="go" data-s="banka"');
    const es = KE.eraStatus(G), miss = es.next && es.req.find((r) => !r.ok);
    /* dönem hedefi: şarta göre yapılacak somut iş */
    const ERA_ACT = { hafta: ['shop', 'Kepengi aç', 'Her gün kârlı kapat: fiyatları ve stoku dengede tut.'], ay1: ['shop', 'Kepengi aç', 'Ay sonuna kadar kârda kal: giderleri kontrol et.'], rep40: ['shop', 'Kepengi aç', 'Memnun müşteri itibar getirir: kuyruğu kısa, tabağı sıcak tut.'], upg: ['dekor', 'Mobilya ve Dekor', 'Salonu büyütmek en çok getiren ilk yatırımdır.'], sampiyon: ['subeler', 'Merkez Ofis', 'Ay sonunda semtin memnuniyet çıtasını geç.'], sube3: ['subeler', 'Merkez Ofis', 'Yeni şube aç; ona usta ve ekip al.'], sube4: ['subeler', 'Merkez Ofis', 'Yeni şube aç; ona usta ve ekip al.'], ciro5m: ['shop', 'Kepengi aç', 'Ciro için kapasiteyi ve şubeleri büyüt.'], ciro4m: ['shop', 'Kepengi aç', 'Ciro için kapasiteyi ve şubeleri büyüt.'], ciro3m: ['shop', 'Kepengi aç', 'Ciro için kapasiteyi ve şubeleri büyüt.'], rep65: ['shop', 'Kepengi aç', 'Memnuniyeti yüksek tut; hikâye ve olay kartları da itibar getirir.'], sube6: ['subeler', 'Merkez Ofis', 'Yeni şube aç.'], taclar2: ['subeler', 'Merkez Ofis', 'İki ayrı semtte ay sonu çıtasını geç; amiral dükkân yardımcı olur.'], taclar3: ['subeler', 'Merkez Ofis', 'Üç ayrı semtte ay sonu çıtasını geç; amiral dükkân yardımcı olur.'], imza2: ['subeler', 'Merkez Ofis', 'Ar-Ge mutfağında imza tarifi geliştir.'], kontrat6: ['subeler', 'Merkez Ofis', 'Her hafta bir toplu sipariş al.'] };
    if (miss) { const ea = ERA_ACT[miss.id] || [ERA_PLACE[miss.id], 'Oraya git', '']; if (KE.placeOpen(G, ea[0])) add(2, 'target', miss.label, 'Dönem hedefi|' + (ea[2] || `${es.next.name} dönemine geçmek için.`), ea[1], `data-a="go" data-s="${ea[0]}"`); }
    if (morning && (G.era || 1) >= 3 && !KE.contractTaken(G) && !G.contract) add(2, 'truck', 'Bu haftanın toplu siparişi bekliyor', 'Haftada bir alınır; iyi para getirir.', 'Merkez Ofis', 'data-a="go" data-s="subeler"');
    if (morning && (G.era || 1) >= 3 && !G.sigWork && KE.signatureCost(G) != null && G.cash > KE.signatureCost(G) * 2) add(2, 'chef', 'İmza tarifini geliştir', 'Bütün şubelerde müşteri ve fiyat primi getirir.', 'Merkez Ofis', 'data-a="go" data-s="subeler"');
    const emp = KE.empireStatus(G);
    if (emp.ready && !emp.done) add(0, 'crown', '"Lüks Kebap" satılık!', 'Bütün şartlar tamam; teklifini ver.', 'Merkez Ofis', 'data-a="go" data-s="subeler"');
    out.sort((a, c) => a.pri - c.pri);
    if (!out.length && morning) add(3, 'check', 'Her şey yolunda', 'Ekibin hazır, stok yeterli. Kepengi aç ya da günü hızlı geç.', 'Kepengi aç', 'data-a="go" data-s="shop"');
    return out.slice(0, 3);
  };
  UI.adviceCard = function (compact) {
    const lvl = UI.guideLevel ? UI.guideLevel() : 'cok';
    if (lvl === 'kapali') return '';
    const list = UI.advice().filter((x) => lvl === 'cok' || x.pri === 0 || (x.pri === 1 && x.ic === 'cart'));
    if (!list.length) return '';
    return `<div class="advice ${compact ? 'compact' : ''}"><span class="kicker">${IC('bolt')}Bugün ne yapmalıyım?</span>${list.map((a) => `<div class="adv p${a.pri}"><span class="adv-ic">${IC(a.ic)}</span><span class="adv-t"><b>${(() => { const i = a.title.indexOf(': '); return i > 0 ? `<span>${esc(a.title.slice(0, i + 1))}</span> <span>${esc(a.title.slice(i + 2))}</span>` : esc(a.title); })()}</b><small>${a.why.split('|').map((w) => `<span>${esc(w.replace(/^ +/, ''))}</span>`).join(' ')}</small></span><button class="btn xs ${a.pri === 0 ? 'red' : a.pri === 1 ? 'gold' : 'ghost'}" ${a.attrs}>${esc(a.btn)}</button></div>`).join('')}</div>`;
  };
  A.viewDekor = (d) => { KE.G.activeBranch = d.id; UI.go('dekor'); };
  A.advBol = (d) => { KE.G.activeBranch = d.id; A.stockLevel({ v: 1.5 }); };
  A.advPrices = (d) => { KE.G.activeBranch = d.id; A.pricesToMarket(); };
  UI.cityTasks = () => (KE.G ? cityTasks() : []);
  /* Telefon: bütün yerler, adları ve bekleyen işleriyle tek bir alt pencerede */
  A.places = () => {
    const tasks = cityTasks();
    const groups = [...new Set(KE.MAP.PLACES.map((p) => p.group))];
    UI.modal(`<div class="sheet-h"><h2>Yerler</h2><button class="sheet-x" data-a="closeModal" aria-label="Kapat">${IC('x')}</button></div>
      ${groups.map((g) => `<div class="sheet-g">${g}</div><div class="sheet-grid">${KE.MAP.PLACES.filter((p) => p.group === g).map((p) => { const t = tasks.find((x) => x.id === p.id); const lk = !KE.placeOpen(KE.G, p.id); return `<button class="sheet-pl ${UI.screen === p.id ? 'on' : ''} ${t && t.urgent ? 'urg' : ''} ${lk ? 'lk' : ''}" data-a="goSheet" data-s="${p.id}" style="--c:${lk ? '#a99a88' : p.color}"><span class="sp-ic">${IC(lk ? 'lock' : p.icon)}${t ? `<b>${t.n}</b>` : ''}</span><span class="sp-t"><b>${esc(p.name)}</b>${lk ? `<small>${KE.PLACE_ERA[p.id]}. dönemde açılır</small>` : t ? `<small>${esc(t.title)}</small>` : ''}</span></button>`; }).join('')}</div>`).join('')}`, { cls: 'sheet' });
  };
  A.goSheet = (d) => { if (!KE.placeOpen(KE.G, d.s)) { UI.go(d.s); return; } UI.closeModal(); UI.go(d.s); };
  /* Dönem kartı: hangi bölümdesin, sıradaki için ne lazım */
  const ERA_PLACE = { hafta: 'office', rep40: 'kahve', upg: 'dekor', sampiyon: 'subeler', sube3: 'subeler', ciro3m: 'office', sube4: 'subeler', ciro5m: 'office', ciro4m: 'office', rep65: 'ajans', sube6: 'subeler', taclar2: 'subeler', taclar3: 'subeler', imza2: 'subeler', kontrat6: 'subeler', ay1: 'office' };
  function eraCard() {
    const st = KE.eraStatus(KE.G);
    if (!st.next) return `<div class="cp-era last"><span class="era-n">${st.era}</span><span class="era-t"><small>${st.era}. dönem</small><b>${st.cur.name}</b><em>${KE.G.flags.empire ? 'İmparatorluk kuruldu.' : 'Son hedef Merkez Ofis\'te.'}</em></span></div>`;
    return `<div class="cp-era"><span class="era-n">${st.era}</span><span class="era-t"><small>${st.era}. dönem · sıradaki: <i>${st.next.name}</i></small><b>${st.cur.name}</b></span>
      <div class="era-req">${st.req.map((r) => `<button class="${r.ok ? 'ok' : ''}" data-a="go" data-s="${ERA_PLACE[r.id] || 'map'}">${IC(r.ok ? 'check' : 'target')}<span>${esc(r.label)}</span></button>`).join('')}</div></div>`;
  }
  function weeklyCard() {
    const W = KE.G.weekly;
    if (!W) return '';
    const p = Math.max(0, Math.min(1, (W.value || 0) / W.target));
    return `<div class="cp-week ${W.done ? 'done' : ''}"><span class="kicker">${IC('target')}Haftalık meydan okuma · ödül ${KE.tl(W.reward)}</span><b>${esc(W.text)}</b><span class="gauge ${W.done ? 'ok' : 'or'}"><i style="width:${Math.round(p * 100)}%"></i></span><small>${W.done ? 'Tamamlandı!' : W.kind === 'sat' ? 'Şu an %' + Math.round(W.value || 0) : (W.kind === 'tips' ? KE.tl(W.value || 0) : Math.round(W.value || 0)) + ' / ' + (W.kind === 'tips' ? KE.tl(W.target) : W.target)}</small></div>`;
  }
  /* Telefon: şehir paneli üç kademeli çekmece (küçük / yarım / büyük); harita kalan alanı doldurur */
  const SHEET_KEY = 'kebab-empire-sheet';
  UI.sheetState = () => { try { return localStorage.getItem(SHEET_KEY) || 'mid'; } catch (e) { return 'mid'; } };
  A.sheetToggle = () => {
    const cur = UI.sheetState(), land = window.innerHeight <= 520 && window.innerWidth > window.innerHeight;
    const next = land ? (cur === 'min' ? 'mid' : 'min') : ({ min: 'mid', mid: 'max', max: 'min' })[cur] || 'mid';
    try { localStorage.setItem(SHEET_KEY, next); } catch (e) { /* yok */ }
    const ms = document.querySelector('.mapscreen2');
    if (!ms) return;
    ms.classList.remove('sheet-min', 'sheet-mid', 'sheet-max'); ms.classList.add('sheet-' + next);
    const h = ms.querySelector('.sheet-handle'); if (h) { h.setAttribute('aria-expanded', String(next !== 'min')); h.setAttribute('aria-label', next === 'max' ? 'Paneli küçült' : 'Paneli büyüt'); }
    setTimeout(() => UI.mapMount(), 280);
  };
  /* ---------- Harita yakınlaştırma (telefon): iki parmak ya da +/− ----------
     Yakınlaştırma CSS değişkeni --mz ile haritanın boyunu büyütür; parmakların ortasındaki nokta yerinde kalır. */
  const ZOOM_KEY = 'kebab-empire-mapzoom', ZMIN = 1, ZMAX = 3;
  UI.mapZoom = (() => { try { return Math.min(ZMAX, Math.max(ZMIN, +localStorage.getItem(ZOOM_KEY) || 1)); } catch (e) { return 1; } })();
  function setZoom(f, z, cx, cy) {
    z = Math.min(ZMAX, Math.max(ZMIN, z));
    const z0 = UI.mapZoom || 1;
    if (cx == null) { cx = f.clientWidth / 2; cy = f.clientHeight / 2; }
    const px = (f.scrollLeft + cx) / z0, py = (f.scrollTop + cy) / z0;
    UI.mapZoom = z;
    f.style.setProperty('--mz', String(z));
    f.scrollLeft = Math.max(0, px * z - cx); f.scrollTop = Math.max(0, py * z - cy);
    const zb = document.querySelectorAll('.mapzoom button');
    if (zb.length === 2) { /** @type {any} */ (zb[0]).disabled = z >= ZMAX - 0.01; /** @type {any} */ (zb[1]).disabled = z <= ZMIN + 0.01; }    UI.mapLabels(f);
  }
  /* Harita yazıları viewBox biriminde: ekranda 11 px'in altına düşerse etiketler büyütülür (en çok 2,2 kat);
     o da yetmezse (telefonda tam harita) gizlenir, yakınlaştırınca geri gelir. Yer adları alt paneldeki düğmelerde de yazar. */
  UI.mapLabels = function (f) {
    f = f || document.getElementById('cityframe');
    if (!f) return;
    f.querySelectorAll('svg.citymap').forEach((sv) => {
      const vb = /** @type {any} */ (sv).viewBox && /** @type {any} */ (sv).viewBox.baseVal;
      const r = sv.getBoundingClientRect();
      if (!vb || !vb.width || !r.width) return;
      const k = (/slice/.test(sv.getAttribute('preserveAspectRatio') || '') ? Math.max : Math.min)(r.width / vb.width, r.height / vb.height);
      const lk = 11.5 / (13.5 * k);
      sv.classList.toggle('nolbl', lk > 2.2);
      /** @type {any} */ (sv).style.setProperty('--lk', String(Math.max(1, Math.min(2.2, lk)).toFixed(2)));
    });
  };
  const saveZoom = () => { try { localStorage.setItem(ZOOM_KEY, String(Math.round(UI.mapZoom * 100) / 100)); } catch (e) { /* yok */ } };
  A.mapZoom = (d) => { const f = document.getElementById('cityframe'); if (!f) return; setZoom(f, UI.mapZoom * (+d.d > 0 ? 1.35 : 1 / 1.35)); saveZoom(); };
  function bindPinch(f) {
    let p = null;
    const pts = (e) => { const r = f.getBoundingClientRect(), a = e.touches[0], b = e.touches[1]; return { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), x: (a.clientX + b.clientX) / 2 - r.left, y: (a.clientY + b.clientY) / 2 - r.top }; };
    f.addEventListener('touchstart', (e) => { if (e.touches.length === 2) { const q = pts(e); p = { d0: q.d, z0: UI.mapZoom }; } }, { passive: true });
    f.addEventListener('touchmove', (e) => { if (!p || e.touches.length !== 2) return; e.preventDefault(); const q = pts(e); setZoom(f, p.z0 * q.d / Math.max(1, p.d0), q.x, q.y); }, { passive: false });
    f.addEventListener('touchend', (e) => { if (p && e.touches.length < 2) { p = null; saveZoom(); } });
    /* masaüstünde Ctrl + tekerlek */
    f.addEventListener('wheel', (e) => { if (!e.ctrlKey) return; e.preventDefault(); const r = f.getBoundingClientRect(); setZoom(f, UI.mapZoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX - r.left, e.clientY - r.top); saveZoom(); }, { passive: false });
  }
  UI.mapZoomInit = function (f) { f.style.setProperty('--mz', String(UI.mapZoom)); bindPinch(f); setZoom(f, UI.mapZoom, 0, 0); };
  SCREENS.map = () => {
    const tasks = cityTasks();
    return `<main class="mapscreen2 sheet-${UI.sheetState()}"><div class="mapframe big" id="cityframe"></div><div class="mapzoom" role="group" aria-label="Harita yakınlaştırma"><button data-a="mapZoom" data-d="1" aria-label="Yakınlaştır">${IC('plus')}</button><button data-a="mapZoom" data-d="-1" aria-label="Uzaklaştır">${IC('minus')}</button></div>${cityPanel(tasks)}</main>`;
  };
  let mapRs = null;
  window.addEventListener('resize', () => { clearTimeout(mapRs); mapRs = setTimeout(() => { if (UI.screen === 'map') UI.mapRefresh(); }, 250); });
  UI.mapRefresh = function () {
    const f = document.getElementById('cityframe');
    if (f) KE.MAP.update(f, mapOpts());
  };
  /* Haritayı yerleştir; telefonda aktif dükkânı ortala */
  UI.mapMount = function () {
    const f = document.getElementById('cityframe');
    if (!f) return;
    KE.MAP.mount(f, mapOpts());
    if (window.innerWidth <= 760 || (window.innerHeight <= 520 && window.innerWidth > window.innerHeight)) UI.mapZoomInit(f);
    UI.mapLabels(f);
    /* üst çubuk / alt sekme ölçüleri (layoutVars) yerleşince harita son boyunu alır: dokunma alanları ona göre yeniden */
    requestAnimationFrame(() => { if (UI.screen === 'map') UI.mapRefresh(); });
    if (UI.a11y && UI.a11y.calm) f.querySelectorAll('svg').forEach((sv) => { if (/** @type {any} */ (sv).pauseAnimations) /** @type {any} */ (sv).pauseAnimations(); });
    if (f.scrollWidth > f.clientWidth + 4 && KE.G) {
      const P = KE.MAP.POS[B().district] || { x: 700, y: 430 };
      const sv = f.querySelector('svg');
      const k = sv.getBoundingClientRect().width / 1400;
      f.scrollLeft = Math.max(0, P.x * k - f.clientWidth / 2);
      f.scrollTop = Math.max(0, P.y * k - f.clientHeight / 2);
    }
  };
  let rsz = 0;
  window.addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(() => UI.mapRefresh(), 200); });
  document.addEventListener('mouseover', (e) => {
    const t = /** @type {any} */ (e.target).closest && /** @type {any} */ (e.target).closest('.citypanel [data-route]');
    if (!t || UI.mapRoute === t.dataset.route) return;
    UI.mapRoute = t.dataset.route;
    UI.mapRefresh();
  });

  Object.assign(H, { cityTasks, cityPanel });
})();
