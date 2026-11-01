/* Kebab Empire — anlatı: gün sonu günlüğü, mahalle gazetesi, olay kartları, karakter repliği */
(function () {
  const pick = (a) => a[Math.floor(KE.rand() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pname = (G, pid) => { const m = KE.MODES[G.mode]; const p = m.products.find((x) => x.id === pid); return p ? p.name : m.drink.name; };
  const clock = (min) => { const h = KE.OPEN_HOUR + Math.floor(min / 60), m = min % 60; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); };
  KE.clock = clock;

  /* ---------- Gün sonu günlüğü ---------- */
  KE.writeJournal = function (G, S0, out) {
    const b = G.branches.find((x) => x.id === G.activeBranch);
    const sum = S0.branches[b.id];
    const S = sum.stats;
    const st = KE.branchStaff(G, b);
    const cooks = st.filter(KE.isCook).sort((a, c) => c.servedToday - a.servedToday);
    const lead = cooks[0];
    const parts = [];
    const wd = KE.weekday(G.day);
    const hol = KE.holidayOf(G.day);
    const weather = pick(['Hava güneşliydi', 'Sabah çiseledi, öğlene doğru açtı', 'Lodos vardı, martılar alçaktan uçuyordu', 'Serin ama berrak bir gündü', 'Boğazdan ılık bir rüzgâr esiyordu', 'Gökyüzü kurşuni, sokak ıslaktı']);
    parts.push(hol ? `${hol}, ${wd}. Sokaklar bayramlıklarla doluydu.` : `${wd}. ${weather}.`);
    if (lead) {
      const opener = G.mode === 'doner'
        ? pick([`${lead.name} sabah erkenden gelip ocağı yaktı, ilk yaprağı ustalıkla kesti.`, `${lead.name} döneri şişe dizerken radyoda eski bir şarkı çalıyordu.`, `${lead.name} bıçağı bileyleyip "Haydi bismillah" dedi.`])
        : pick([`${lead.name} kömürü erkenden tutuşturdu, köz kıvamını bekledi.`, `${lead.name} zırhla kıymayı çekerken dükkâna mis gibi kokular yayıldı.`, `${lead.name} şişleri sıraya dizip "Bugün işimiz rast gitsin" dedi.`]);
      parts.push(opener);
    }
    const peakH = S.hourlyCust.indexOf(Math.max(...S.hourlyCust));
    if (S.served > 0) {
      const topType = Object.entries(S.byType).sort((a, c) => c[1] - a[1])[0];
      const typeLine = topType ? { ogrenci: 'öğrenciler akın etti', beyaz: 'plaza çalışanları öğle arasında kapıyı aşındırdı', aile: 'aileler masaları doldurdu', gurme: 'gurmeler tabakları fotoğrafladı', turist: 'turistler haritalarıyla kapıda belirdi', isci: 'inşaat ekibi kalabalık geldi', gece: 'gece çıkışı kalabalığı dükkânı doldurdu' }[topType[0]] : 'müşteriler geldi';
      parts.push(`En yoğun saat ${KE.OPEN_HOUR + peakH}:00 civarıydı; ${typeLine}.`);
    } else parts.push('Kapıdan neredeyse kimse girmedi. Sessizlik insanın içine işliyordu.');
    const so = Object.entries(S.stockouts || {}).sort((a, c) => a[1] - c[1]);
    if (so.length) parts.push(`${pname(G, so[0][0])} ${clock(so[0][1])}'da bitti${so.length > 1 ? `, ardından ${pname(G, so[1][0])} da tükendi` : ''}. Yarın stoğu artırmak lazım.`);
    const top = Object.entries(S.byProduct).sort((a, c) => c[1] - a[1])[0];
    if (top) parts.push(`Günün yıldızı ${pname(G, top[0])} oldu: ${top[1]} porsiyon.`);
    if (S.matches > 3 && lead) parts.push(`"Ellerine sağlık usta!" sesi gün boyu ${S.matches} kez yankılandı.`);
    if (S.best && S.best.tip > 0) parts.push(`En cömert bahşişi bir ${KE.CUSTOMER_TYPES[S.best.type].name.toLowerCase()} müşteri bıraktı: ${KE.tl(S.best.tip)}.`);
    if (S.lostWait > 4) parts.push(`${S.lostWait} müşteri beklemekten sıkılıp gitti; kapıdan çıkarken söylendiklerini duydum.`);
    if (S.lostPrice > 4) parts.push(`${S.lostPrice} kişi menüye bakıp "Bu ne fiyat!" diyerek döndü.`);
    if (S.playerServed) parts.push(`Bugün ${S.playerServed} siparişi tezgâha geçip kendi ellerimle hazırladım.`);
    if (S.gurmeHappy) parts.push('Bir gurme çıkarken defterine bir şeyler not etti, gülümsüyordu.');
    if (out.levelUps.length) { const u = out.levelUps[0]; parts.push(`${u.name} ${pname(G, u.pid)} yapımında ustalaştı (★${u.star})${u.mentor ? `; ${u.mentor}'nın emeği büyük` : ''}.`); }
    if (out.quits.length) parts.push(`Akşam ${out.quits[0].name} önlüğünü çıkarıp "Ben bu işi bırakıyorum" dedi. Moral meselesini hafife almamalıydım.`);
    const sat = sum.sat;
    parts.push(sat > 80 ? 'Kepenk inerken içim rahattı; mahalle memnun.' : sat > 65 ? 'Fena bir gün değildi, ama daha iyisini yapabiliriz.' : sat > 0 ? 'Kepenk indirirken kafamda yarın neyi düzelteceğimin listesi vardı.' : 'Yarın her şey farklı olacak.');
    return parts.join(' ');
  };

  /* ---------- Mahalle gazetesi ---------- */
  KE.writeNews = function (G) {
    const week = G.ledger.days.filter((d) => d.day > G.day - 7);
    const rev = week.reduce((a, d) => a + d.revenue, 0);
    const sat = week.length ? week.reduce((a, d) => a + d.sat, 0) / week.length : 0;
    const b = G.branches[0];
    const h = [];
    if (sat > 80) h.push({ title: `${b.name} mahallenin dilinde`, body: `Haftanın memnuniyet ortalaması %${Math.round(sat)}. Komşular "Böyle ${G.mode === 'doner' ? 'döner' : 'kebap'} yıllardır yenmedi" diyor.` });
    else if (sat > 60) h.push({ title: `${b.name} istikrarlı bir hafta geçirdi`, body: `Haftalık ciro ${KE.tl(rev)}. Esnaf, dükkânın kendini toparladığını söylüyor.` });
    else h.push({ title: `${b.name} zorlu bir hafta geçirdi`, body: 'Müşteriler bekleme sürelerinden ve fiyatlardan şikâyetçi. Esnaf "Toparlanırlar" diyor.' });
    const champ = G.branches.find((x) => x.championUntil && x.championUntil - G.day >= 23);
    if (champ) h.unshift({ title: `${KE.district(champ).name}'nin şampiyonu: ${champ.name}`, body: '"Lüks Kebap" bu ay semtte geride kaldı. Komşular kutlamaya pide getirdi.' });
    const praised = KE.REGULARS.find((R) => G.regulars && G.regulars[R.id] && G.regulars[R.id].praised > G.day - 7);
    if (praised) h.push({ title: `${praised.name}: "Şehrin en güzel sofrası"`, body: `Yıllardır müdavim olan ${praised.name}, dükkânı herkese öneriyor.` });
    const st5 = G.staff.find((s) => Object.values(s.spec).some((v) => v >= 5));
    if (st5) h.push({ title: `Usta sohbeti: ${st5.name}`, body: `${st5.region} kökenli usta, mesleğin inceliklerini anlattı: "Sabır, köz ve iyi malzeme. Gerisi el alışkanlığı."` });
    const city = [
      { title: 'Vapur seferlerine yaz tarifesi', body: 'Belediye yeni seferlerin iskele çevresindeki esnafa canlılık getireceğini açıkladı.' },
      { title: 'Halde et fiyatları yine hareketli', body: `Toptancılar kırmızı ette aylık %${KE.num(KE.ECON.aylikEnflasyon * 100, 1)} civarı artış bekliyor.` },
      { title: 'Beşiktepe\'de derbi heyecanı', body: 'Maç günü stat çevresindeki dükkânlar gece yarısına kadar açık kalacak.' },
      { title: 'Sultanpazarı\'nda turist rekoru', body: 'Tarihi çarşıyı bu hafta on binlerce ziyaretçi gezdi.' },
      { title: 'Kampüstepe\'de final haftası', body: 'Öğrenciler kütüphaneden çıkmıyor; gece paket siparişleri patladı.' },
      { title: 'Asgari ücret tartışması sürüyor', body: 'Esnaf temsilcileri yeni yılda bordro maliyetlerinin artacağını hatırlattı.' }
    ];
    h.push(pick(city));
    const rivalLines = [
      { title: '"Lüks Kebap" yeni şube peşinde', body: 'Cüneyt Bey zincirini büyütmek için semt semt dolaşıyor.' },
      { title: 'Rakipten indirim kampanyası', body: '"Lüks Kebap" bu hafta öğrencilere %20 indirim yaptı.' }
    ];
    h.push(pick(rivalLines));
    return { day: G.day, date: KE.dateStr(G.day), issue: Math.ceil(G.day / 7), headlines: h };
  };

  /* ---------- Olay kartları ---------- */
  const ev = [];
  const branch = (G) => G.branches.find((x) => x.id === G.activeBranch);
  const staffOf = (G) => KE.branchStaff(G, branch(G));
  /* Zam: kişi başı 60 günde bir, rol tavanını aşmadan */
  const RAISE_CAP = { usta: 3.0, mudur: 2.4, cirak: 1.35, kasiyer: 1.6, garson: 1.6, temizlik: 1.45, kurye: 1.55 };
  const canRaise = (G, s) => G.day - (s.raisedDay || s.hiredDay || 0) >= 60 && s.wage < KE.ECON.asgariBrut * (RAISE_CAP[s.role] || 1.6) * G.priceIndex;
  const raise = (G, x, k) => { x.wage = Math.min(Math.round(x.wage * k / 100) * 100, Math.round(KE.ECON.asgariBrut * (RAISE_CAP[x.role] || 1.6) * G.priceIndex / 100) * 100); x.raisedDay = G.day; };
  KE.canRaise = canRaise;

  ev.push({ id: 'rakipTeklif', who: 'rakip', w: 1.2,
    when: (G) => staffOf(G).some((s) => s.role === 'usta' && s.morale < 55 && canRaise(G, s)),
    build: (G) => { const s = staffOf(G).filter((x) => x.role === 'usta' && canRaise(G, x)).sort((a, c) => a.morale - c.morale)[0];
      return { title: `${s.name}'ya rakipten teklif!`, text: `"Lüks Kebap" sahibi Cüneyt Bey, ${s.name}'ya %30 daha fazla maaş teklif etmiş. Usta kararsız görünüyor ve seninle konuşmak istiyor.`, ctx: { sid: s.id },
        choices: [
          { label: 'Maaşına %15 zam yap', desc: 'Moral +22, maaş +%15', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); raise(G, x, 1.15); x.morale = clamp(x.morale + 22, 0, 100); return `${x.name} kaldı: "Bu dükkân benim de dükkânım."`; } },
          { label: 'Oturup gönlünü al', desc: '%55 ihtimalle kalır', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); if (KE.rand() < 0.55) { x.morale = clamp(x.morale + 10, 0, 100); return `Uzun bir çay sohbeti işe yaradı. ${x.name} kalıyor.`; } G.staff = G.staff.filter((y) => y.id !== x.id); G.rival.power += 8; return `${x.name} teşekkür edip rakibe geçti. Ocağın başı boş kaldı.`; } },
          { label: 'Gitmek isteyen gider', desc: 'Usta ayrılır', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); G.staff = G.staff.filter((y) => y.id !== x.id); G.rival.power += 8; return `${x.name} ayrıldı. Usta pazarında yeni birini bulmalısın.`; } }
        ] }; } });

  ev.push({ id: 'denetim', who: 'bulent', w: 1,
    build: (G) => { const b = branch(G);
      return { title: 'Belediye denetimi kapıda', text: `Bülent Bey evrak çantasıyla içeri girdi: "Rutin hijyen denetimi." Temizlik puanın şu an ${Math.round(b.cleanliness)}.`, ctx: {},
        choices: [
          { label: 'Denetime hemen gir', desc: 'Temizlik puanına göre sonuç', run: (G) => { const b = branch(G); if (b.cleanliness >= 55) { G.reputation = clamp(G.reputation + 2, 0, 100); return '"Her şey yolunda, kolay gelsin." Denetimden temiz çıktın. İtibar +2.'; } const fine = Math.round(18000 * G.priceIndex); G.cash -= fine; KE.addExtra(G, 'fines', fine); G.reputation = clamp(G.reputation - 3, 0, 100); return `Tezgâh altı ve davlumbazda eksikler bulundu. ${KE.tl(fine)} idari para cezası. İtibar −3.`; } },
          { label: 'Yarım saat bekletip acil temizlik yap', desc: `${KE.tl(6000)} ekstra mesai`, run: (G) => { const b = branch(G); G.cash -= 6000; KE.addExtra(G, 'other', 6000); b.cleanliness = clamp(b.cleanliness + 25, 0, 100); if (b.cleanliness >= 55) return 'Ekip seferber oldu. Denetim sorunsuz geçti.'; const fine = Math.round(9000 * G.priceIndex); G.cash -= fine; KE.addExtra(G, 'fines', fine); return `Yetişmedi. Daha hafif bir ceza: ${KE.tl(fine)}.`; } }
        ] }; } });

  ev.push({ id: 'yemekYazari', who: 'ayse', w: 0.8,
    when: (G) => G.mode && KE.MODES[G.mode].products.some((p) => KE.bestStar(G, branch(G), p.id) >= 4),
    build: (G) => { const b = branch(G); const p = KE.MODES[G.mode].products.filter((x) => KE.bestStar(G, b, x.id) >= 4).sort((a, c) => KE.bestStar(G, b, c.id) - KE.bestStar(G, b, a.id))[0];
      return { title: 'Ünlü yemek yazarı geldi!', text: `Ayşe Teyze fısıldadı: "Bak bak, köşedeki masada oturan o meşhur yemek yazarı!" Yazar ${p.name} sipariş etti ve tabağı silip süpürdü.`, ctx: { pid: p.id },
        choices: [
          { label: 'İkramımızdır deyip künefe gönder', desc: `${KE.tl(400)}, itibar +6, 5 gün gurme akını`, run: (G) => { G.cash -= 400; G.reputation = clamp(G.reputation + 6, 0, 100); G.mods.push({ key: 'type:gurme', mult: 2.2, days: 5, label: 'Yemek yazısı' }); return 'Ertesi gün köşe yazısı çıktı: "Şehrin en dürüst lezzeti." Gurmeler yolda.'; } },
          { label: 'Normal davran', desc: 'İtibar +3', run: (G) => { G.reputation = clamp(G.reputation + 3, 0, 100); G.mods.push({ key: 'type:gurme', mult: 1.5, days: 3, label: 'Yemek yazısı' }); return 'Yazı kısa ama olumlu çıktı.'; } }
        ] }; } });

  ev.push({ id: 'kavanoz', who: 'zeynep', w: 0.6,
    build: (G) => ({ title: 'Bahşiş kavanozu kayboldu', text: 'Zeynep Hanım kasayı sayarken fark etti: dün akşamki bahşiş kavanozu yerinde yok. Ekip birbirine kuşkuyla bakıyor.', ctx: {},
      choices: [
        { label: 'Kasadan herkese öde', desc: `${KE.tl(4500)}, moral +6`, run: (G) => { G.cash -= 4500; KE.addExtra(G, 'other', 4500); staffOf(G).forEach((s) => { s.morale = clamp(s.morale + 6, 0, 100); }); return '"Patron bizi yarı yolda bırakmadı." Ekip rahatladı.'; } },
        { label: 'Soruşturma başlat', desc: 'Moral −5, kavanoz belki bulunur', run: (G) => { staffOf(G).forEach((s) => { s.morale = clamp(s.morale - 5, 0, 100); }); return KE.rand() < 0.5 ? 'Kavanoz depoda, un çuvallarının arkasında bulundu. Komi yanlışlıkla kaldırmış.' : 'Kavanoz bulunamadı. Ortam gergin.'; } },
        { label: 'Boş ver', desc: 'Moral −8', run: (G) => { staffOf(G).forEach((s) => { s.morale = clamp(s.morale - 8, 0, 100); }); return 'Ekip sessizce işine döndü ama kırgınlar.'; } }
      ] }) });

  ev.push({ id: 'zamTalebi', who: null, w: 1,
    when: (G) => staffOf(G).some((s) => s.morale < 62 && G.day - s.hiredDay > 10 && canRaise(G, s)),
    build: (G) => { const s = staffOf(G).filter((x) => x.morale < 62 && G.day - x.hiredDay > 10 && canRaise(G, x)).sort((a, c) => a.morale - c.morale)[0];
      return { title: `${s.name} zam istiyor`, text: `${s.name}: "Patron, kira arttı, mutfak masrafı arttı. Bir el atabilir misin?" Brüt maaşı şu an ${KE.tl(s.wage)}.`, ctx: { sid: s.id }, who: s,
        choices: [
          { label: '%10 zam yap', desc: 'Moral +18', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); raise(G, x, 1.1); x.morale = clamp(x.morale + 18, 0, 100); return `${x.name}: "Sağ ol patron, hakkını helal et."`; } },
          { label: 'Şimdilik olmaz', desc: 'Moral −10', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); x.morale = clamp(x.morale - 10, 0, 100); return `${x.name} başını öne eğdi: "Anladım."`; } }
        ] }; } });

  ev.push({ id: 'etZammi', who: 'riza', w: 1,
    build: (G) => ({ title: 'Kasap Rıza\'dan zam haberi', text: '"Kusura bakma kardeşim, halde fiyatlar uçtu. Bu hafta et kalemlerine %15 zam yapmak zorundayım."', ctx: {},
      choices: [
        { label: 'Pazarlık et', desc: '%50 ihtimalle %5\'e iner', run: (G) => { if (KE.rand() < 0.5) { G.mods.push({ key: 'ing', mult: 1.05, days: 7, label: 'Et zammı' }); return '"Senin hatırın için %5 olsun." Rıza sözünün eri.'; } G.mods.push({ key: 'ing', mult: 1.15, days: 7, label: 'Et zammı' }); return '"Elimden gelen bu kadar." Zam %15 kaldı.'; } },
        { label: 'Kabul et', desc: '7 gün malzeme +%15, ilişki iyi', run: (G) => { G.mods.push({ key: 'ing', mult: 1.12, days: 7, label: 'Et zammı' }); return 'Rıza memnun. "Senin için en iyi parçaları ayıracağım." Zam %12\'de kaldı.'; } }
      ] }) });

  ev.push({ id: 'influencer', who: 'ajans', w: 0.7,
    build: (G) => ({ title: 'Sosyal medya fenomeni geldi', text: 'Yüz binlerce takipçisi olan bir fenomen telefonunu tezgâha doğrulttu: "Bugün bu dükkânı deniyoruz!"', ctx: {},
      choices: [
        { label: 'Ustayı kameraya çıkar', desc: 'Kalite iyiyse 5 gün +%30 müşteri', run: (G) => { const b = branch(G); const best = Math.max(...KE.MODES[G.mode].products.map((p) => KE.bestStar(G, b, p.id))); if (best >= 3) { G.mods.push({ key: 'traffic', mult: 1.3, days: 5, label: 'Viral video' }); G.mods.push({ key: 'type:ogrenci', mult: 1.4, days: 5, label: 'Viral video' }); G.reputation = clamp(G.reputation + 3, 0, 100); return 'Video bir gecede milyon izlendi. Kuyruk sokağın köşesine kadar uzayacak.'; } G.reputation = clamp(G.reputation - 3, 0, 100); return '"Eh işte..." yorumu viral oldu. İtibar −3.'; } },
        { label: 'Kibarca reddet', desc: 'Bir şey olmaz', run: () => 'Fenomen omuz silkip başka dükkâna gitti.' }
      ] }) });

  ev.push({ id: 'cirakHata', who: null, w: 0.8,
    when: (G) => staffOf(G).some((s) => s.role === 'cirak'),
    build: (G) => { const c = staffOf(G).find((s) => s.role === 'cirak');
      return { title: `${c.name} bir tepsi yaktı`, text: `${c.name} dalgınlıkla ${G.mode === 'doner' ? 'pilav tenceresini' : 'bir şiş dolusu kebabı'} yaktı. Mutfak duman içinde, herkes sana bakıyor.`, ctx: { sid: c.id }, who: c,
        choices: [
          { label: 'Ustanın yanına ver, öğret', desc: 'En iyi usta mentor olur, moral +4', run: (G, ctx) => { const x = G.staff.find((y) => y.id === ctx.sid); const m = staffOf(G).filter((s) => s.role === 'usta').sort((a, c) => c.teach - a.teach)[0]; if (m) { x.mentorId = m.id; x.morale = clamp(x.morale + 4, 0, 100); return `${m.name} çırağın omzuna dokundu: "Gel bakalım, köz böyle okunur."`; } return 'Ortada öğretecek usta yok. Bir usta işe al.'; } },
          { label: 'Sert uyar', desc: 'Moral −10, hata payı düşer', run: (G, ctx) => { const x = G.staff.find((y) => y.id === ctx.sid); x.morale = clamp(x.morale - 10, 0, 100); x.consistency = Math.min(0.95, x.consistency + 0.05); return `${x.name} kızardı, bir daha olmayacağına söz verdi.`; } }
        ] }; } });

  ev.push({ id: 'macGunu', who: null, w: 0.7, mode: 'doner',
    build: (G) => ({ title: 'Yarın derbi var!', text: 'Beşiktepe\'de büyük maç. Taraftarlar maç öncesi ve sonrası sokaklara taşacak. Gece kalabalığı bekleniyor.', ctx: {},
      choices: [
        { label: 'Stoku ikiye katla', desc: 'Gece müşterisi +%120, 1 gün', run: (G) => { G.branches.forEach((b) => { b.stockBoost = 1; Object.keys(b.usage).forEach((k) => { b.stock[k] += b.usage[k] * 0.6; G.cash -= b.usage[k] * 0.6 * KE.ingPrice(G, b, k); }); }); G.mods.push({ key: 'type:gece', mult: 2.2, days: 1, label: 'Derbi' }); G.mods.push({ key: 'traffic', mult: 1.2, days: 1, label: 'Derbi' }); return 'Depo tıklım tıklım. Haydi bakalım!'; } },
        { label: 'Normal hazırlan', desc: 'Gece müşterisi +%120 ama stok normal', run: (G) => { G.mods.push({ key: 'type:gece', mult: 2.2, days: 1, label: 'Derbi' }); G.mods.push({ key: 'traffic', mult: 1.2, days: 1, label: 'Derbi' }); return 'Bakalım stok yetecek mi...'; } }
      ] }) });

  ev.push({ id: 'dugun', who: null, w: 0.7, mode: 'kebap',
    build: (G) => { const amt = Math.round(160 * 620 * G.priceIndex * 0.85);
      return { title: 'Düğün siparişi', text: `Mahalleden bir aile kızlarının kına gecesi için 160 porsiyon kebap istiyor. Teklif: ${KE.tl(amt)}. Ekip gece yarısına kadar çalışmak zorunda kalacak.`, ctx: { amt },
        choices: [
          { label: 'Kabul et', desc: 'Büyük ciro, moral −8, itibar +4', run: (G, c) => { const b = branch(G); const cost = 160 * KE.productCost(G, b, KE.MODES.kebap.products[0]); G.cash += c.amt - cost; KE.addExtra(G, 'other', -(c.amt - cost)); staffOf(G).forEach((s) => { s.morale = clamp(s.morale - 8, 0, 100); }); G.reputation = clamp(G.reputation + 4, 0, 100); return `Kına gecesi efsane oldu. Net kazanç ${KE.tl(c.amt - cost)}. Ekip yorgun ama gururlu.`; } },
          { label: 'Kibarca reddet', desc: 'Bir şey olmaz', run: () => 'Aile anlayışla karşıladı, başka bir ocakbaşına gittiler.' }
        ] }; } });

  ev.push({ id: 'komurKrizi', who: 'riza', w: 0.6, mode: 'kebap',
    build: (G) => ({ title: 'Kömür krizi', text: 'Toptancıda mangal kömürü kalmadı. Elde kalanların fiyatı iki katına çıktı.', ctx: {},
      choices: [
        { label: 'Pahalı da olsa kömür al', desc: '7 gün kömür ×2', run: (G) => { G.mods.push({ key: 'ing:komur', mult: 2, days: 7, label: 'Kömür krizi' }); return 'Közün tadından taviz yok.'; } },
        { label: 'Bir haftalığına gaza geç', desc: '7 gün müşteri memnuniyeti düşer', run: (G) => { G.mods.push({ key: 'patience', mult: 0.85, days: 7, label: 'Gazlı ocak' }); G.reputation = clamp(G.reputation - 2, 0, 100); return 'Müdavimler farkı hemen anladı: "Usta, bunda köz tadı yok."'; } }
      ] }) });

  ev.push({ id: 'ogrenciIndirim', who: null, w: 0.6,
    when: (G) => ['kampustepe', 'kadiceşme', 'besiktepe'].includes(branch(G).district),
    build: (G) => ({ title: 'Öğrenci birliği teklifi', text: 'Üniversitenin öğrenci kulübü bir anlaşma öneriyor: öğrenci kartına %10 indirim, karşılığında kampüs panolarında reklam.', ctx: {},
      choices: [
        { label: 'Anlaşmayı imzala', desc: '14 gün öğrenci +%60, fiyat algısı iyileşir', run: (G) => { G.mods.push({ key: 'type:ogrenci', mult: 1.6, days: 14, label: 'Öğrenci anlaşması' }); G.mods.push({ key: 'ing', mult: 1.03, days: 14, label: 'Öğrenci indirimi' }); return 'Kampüs panolarında logon parlıyor.'; } },
        { label: 'Teşekkürler, gerek yok', desc: 'Bir şey olmaz', run: () => 'Kulüp başkanı kartını bırakıp gitti.' }
      ] }) });

  ev.push({ id: 'rakipSemt', who: 'rakip', w: 0.5,
    when: (G) => G.rival.district !== branch(G).district && G.day > 10,
    build: (G) => ({ title: '"Lüks Kebap" semtine geliyor', text: 'Cüneyt Bey sokağın karşısındaki dükkânı kiralamış. Altın harfli tabelası şimdiden asıldı. "Bu semtte yer var mı bakalım" diyor sırıtarak.', ctx: {},
      choices: [
        { label: 'Reklama yüklen', desc: `${KE.tl(25000)}, 7 gün müşteri +%15`, run: (G) => { G.rival.district = branch(G).district; G.cash -= 25000; KE.addExtra(G, 'ads', 25000); G.mods.push({ key: 'traffic', mult: 1.15, days: 7, label: 'Karşı kampanya' }); return 'Mahalleyi el ilanıyla donattık. "Asıl lezzet burada!"'; } },
        { label: 'Kalitemize güveniyoruz', desc: 'Rakip semtte, müşteri biraz azalır', run: (G) => { G.rival.district = branch(G).district; return 'Müdavimler sözünü verdi: "Biz seni bırakmayız."'; } }
      ] }) });

  /* ---------- Ek olaylar ---------- */
  const pay = (G, amt) => { G.cash -= amt; KE.addExtra(G, 'other', amt); };
  const earn = (G, amt) => { G.cash += amt; KE.addExtra(G, 'other', -amt); };
  const moraleAll = (G, d) => staffOf(G).forEach((s) => { s.morale = clamp(s.morale + d, 0, 100); });
  const rep = (G, d) => { G.reputation = clamp(G.reputation + d, 0, 100); };
  const P = (G, v) => Math.round(v * G.priceIndex / 100) * 100;

  ev.push({ id: 'elektrik', who: 'emre', w: 0.7,
    build: (G) => ({ title: 'Elektrik kesintisi', text: 'Sokakta trafo arızası var; elektrik akşama kadar gelmeyebilir. Emre bir jeneratörcünün numarasını buldu.', ctx: {},
      choices: [
        { label: 'Jeneratör kirala', desc: `${KE.tl(P(G, 9000))}, servis aksamaz`, run: (G) => { pay(G, P(G, 9000)); return 'Jeneratör homurdandı ama dükkân ışıl ışıl. Komşular bile sıraya girdi.'; } },
        { label: 'Bekle, gelince açarız', desc: '1 gün müşteri −%35', run: (G) => { G.mods.push({ key: 'traffic:' + branch(G).id, mult: 0.65, days: 1, label: 'Elektrik kesintisi' }); return 'Öğlen boyunca karanlıkta bekledik; elektrik ikindiye doğru geldi.'; } }
      ] }) });

  ev.push({ id: 'turOtobusu', who: 'ajans', w: 0.6, when: (G) => ['sultanpazari', 'besiktepe', 'kadiceşme'].includes(branch(G).district),
    build: (G) => ({ title: 'Tur otobüsü kapıda', text: 'Bir tur rehberi, kırk kişilik grubunu yarın öğlen dükkâna getirmek istiyor. Tek şartı: grup menüsünde %15 indirim.', ctx: {},
      choices: [
        { label: 'Grup menüsünü kabul et', desc: '1 gün turist +%180, itibar +2', run: (G) => { G.mods.push({ key: 'type:turist', mult: 2.8, days: 1, label: 'Tur grubu' }); rep(G, 2); return 'Kırk kişi kırk ayrı dilde "çok güzel" dedi. Rehber her hafta geleceğini söyledi.'; } },
        { label: 'Bu sefer olmaz', desc: 'Bir şey olmaz', run: () => 'Rehber kartını bıraktı, karşıdaki lokantaya yöneldi.' }
      ] }) });

  ev.push({ id: 'mahalleTakimi', who: 'ayse', w: 0.6,
    build: (G) => ({ title: 'Mahalle takımına sponsor', text: 'Ayşe Teyze\'nin torununun oynadığı mahalle futbol takımının forması yok. Dükkânın adı forma göğsünde yazsın mı?', ctx: {},
      choices: [
        { label: 'Formaları biz yaptıralım', desc: `${KE.tl(P(G, 12000))}, itibar +4, 10 gün aile +%20`, run: (G) => { pay(G, P(G, 12000)); rep(G, 4); G.mods.push({ key: 'type:aile', mult: 1.2, days: 10, label: 'Forma sponsoru' }); return 'Çocuklar ilk maçı formalarla kazandı. Veliler maçtan sonra dükkâna akın etti.'; } },
        { label: 'Bir kasa ayran gönder', desc: `${KE.tl(P(G, 1500))}, itibar +1`, run: (G) => { pay(G, P(G, 1500)); rep(G, 1); return 'Ayranlar devre arasında bitti. Teşekkür kartı geldi.'; } }
      ] }) });

  ev.push({ id: 'ustaHasta', who: null, w: 0.7, when: (G) => staffOf(G).some((s) => KE.isCook(s)),
    build: (G) => { const s = staffOf(G).filter(KE.isCook).sort((a, c) => a.energy - c.energy)[0];
      return { title: `${s.name} hastalandı`, text: `${s.name} sabah ateşler içinde geldi: "Bir şeyim yok usta, çalışırım." Sesi kısık, gözleri yorgun.`, ctx: { sid: s.id }, who: s,
        choices: [
          { label: 'Eve gönder, dinlensin', desc: 'Bugün ustasız çalışırsın, moral +10', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); x.morale = clamp(x.morale + 10, 0, 100); x.pos = 'mola'; G.mods.push({ key: 'traffic:' + branch(G).id, mult: 0.85, days: 1, label: 'Usta hasta' }); return `${x.name} gönülsüzce gitti. Ertesi gün turp gibi döndü.`; } },
          { label: 'Bugün idare etsin', desc: 'Moral −8, kalite düşebilir', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); x.morale = clamp(x.morale - 8, 0, 100); x.energy = Math.min(x.energy, 55); return `${x.name} gün boyu öksürerek çalıştı. Ekip biraz kırgın.`; } }
        ] }; } });

  ev.push({ id: 'kiraArtisi', who: 'zeynep', w: 0.45, when: (G) => G.day > 40,
    build: (G) => { const b = branch(G); const inc = Math.round(b.rent * 0.25 / 1000) * 1000;
      return { title: 'Ev sahibi kira artışı istiyor', text: `Ev sahibi telefonda: "Piyasa uçtu, kirayı ${KE.tl(inc)} artırmam lazım." Zeynep Hanım sözleşmeye bakıyor: yıllık artış TÜFE ile sınırlı.`, ctx: { inc },
        choices: [
          { label: 'Sözleşmeyi hatırlat', desc: 'Kira %10 artar, ev sahibi biraz bozulur', run: (G) => { const b = branch(G); b.rent = Math.round(b.rent * 1.1 / 1000) * 1000; return 'Ev sahibi homurdandı ama sözleşmeye uydu. Kira %10 arttı.'; } },
          { label: 'İstediğini ver', desc: `Kira +${KE.tl(inc)}, itibar +1 (iyi komşu)`, run: (G, c) => { const b = branch(G); b.rent += c.inc; rep(G, 1); return 'Ev sahibi memnun, kapının önüne iki saksı çiçek bıraktı.'; } }
        ] }; } });

  ev.push({ id: 'dolapArizasi', who: 'emre', w: 0.55,
    build: (G) => ({ title: 'Soğutucu arızalandı', text: 'Sabah dolabın içi ılıktı. Servisçi bugün gelebilir ama acil ücret istiyor.', ctx: {},
      choices: [
        { label: 'Acil servisi çağır', desc: `${KE.tl(P(G, 7500))}`, run: (G) => { pay(G, P(G, 7500)); return 'Kompresör değişti, dolap yine buz gibi.'; } },
        { label: 'Yarına kadar idare et', desc: 'Stokun %30\'u bozulur', run: (G) => { const b = branch(G); Object.keys(b.stock).forEach((k) => { b.stock[k] *= 0.7; }); return 'Etin bir kısmını atmak zorunda kaldık. Ders aldık.'; } }
      ] }) });

  ev.push({ id: 'tvProgrami', who: 'ajans', w: 0.4, when: (G) => G.reputation >= 45,
    build: (G) => ({ title: 'Televizyondan davet', text: 'Sabah kuşağındaki yemek programı ustanı canlı yayına çağırıyor. Bir günlüğüne dükkândan ayrılması gerekecek.', ctx: {},
      choices: [
        { label: 'Ustayı yayına gönder', desc: 'Bugün müşteri −%15, sonra 7 gün +%30, itibar +5', run: (G) => { G.mods.push({ key: 'traffic:' + branch(G).id, mult: 0.85, days: 1, label: 'Usta televizyonda' }); G.mods.push({ key: 'traffic', mult: 1.3, days: 8, label: 'Televizyon etkisi' }); rep(G, 5); return 'Usta kameraya göz kırptı, telefonlar susmadı. "Televizyondaki dükkân burası mı?"'; } },
        { label: 'Dükkân boş kalmaz', desc: 'Bir şey olmaz', run: () => 'Yapımcı başka bir ustayı aradı.' }
      ] }) });

  ev.push({ id: 'komsuSikayet', who: 'bulent', w: 0.55,
    build: (G) => ({ title: 'Komşudan duman şikâyeti', text: 'Üst kattaki komşu belediyeye dilekçe vermiş: "Davlumbazın dumanı camımdan giriyor." Bülent Bey uyarıyor.', ctx: {},
      choices: [
        { label: 'Karbon filtre taktır', desc: `${KE.tl(P(G, 14000))}, temizlik +10`, run: (G) => { pay(G, P(G, 14000)); const b = branch(G); b.cleanliness = clamp(b.cleanliness + 10, 0, 100); return 'Filtre takıldı, komşu bir tabak baklava getirdi.'; } },
        { label: 'Komşuya bir tepsi gönder', desc: `${KE.tl(P(G, 800))}, %50 ihtimalle ceza`, run: (G) => { pay(G, P(G, 800)); if (KE.rand() < 0.5) return 'Komşu yumuşadı, dilekçesini geri çekti.'; const fine = P(G, 9000); G.cash -= fine; KE.addExtra(G, 'fines', fine); return `Dilekçe işleme girdi: ${KE.tl(fine)} ceza.`; } }
      ] }) });

  ev.push({ id: 'stajyer', who: 'buro', w: 0.5,
    build: (G) => ({ title: 'Meslek lisesinden stajyer', text: 'Aşçılık bölümünden bir öğrenci staj yeri arıyor. Okul öğle yemeğini ve sigortayı karşılıyor.', ctx: {},
      choices: [
        { label: 'Stajyeri al', desc: 'Ekip morali +5, 15 gün servis hızlanır', run: (G) => { moraleAll(G, 5); G.mods.push({ key: 'patience', mult: 1.1, days: 15, label: 'Stajyer desteği' }); return 'Stajyer ilk gün tabak taşıdı, ikinci gün soğan doğradı. Ekip ona abilik yapıyor.'; } },
        { label: 'Şu an bakamayız', desc: 'Bir şey olmaz', run: () => 'Okula teşekkür edip başka dönem için söz verdin.' }
      ] }) });

  ev.push({ id: 'toptanFirsat', who: 'riza', w: 0.6,
    build: (G) => { const amt = P(G, 20000);
      return { title: 'Toptan alım fırsatı', text: `Rıza: "Elimde fazla mal var. İki haftalık siparişini peşin ödersen %12 indirim yaparım." Peşinat: ${KE.tl(amt)}.`, ctx: { amt },
        choices: [
          { label: 'Peşin öde', desc: `${KE.tl(amt)}, 14 gün malzeme −%12`, run: (G, c) => { pay(G, c.amt); G.mods.push({ key: 'ing', mult: 0.88, days: 14, label: 'Toptan alım' }); return 'Depo doldu, maliyetler düştü. Rıza memnun.'; } },
          { label: 'Nakit elde kalsın', desc: 'Bir şey olmaz', run: () => 'Rıza omuz silkti: "Sen bilirsin kardeşim."' }
        ] }; } });

  ev.push({ id: 'cuzdan', who: null, w: 0.5,
    build: (G) => ({ title: 'Masada unutulan cüzdan', text: 'Kapanışta bir masanın altında dolu bir cüzdan bulundu. İçinde bir kimlik ve epey nakit var.', ctx: {},
      choices: [
        { label: 'Sahibini bul, teslim et', desc: 'İtibar +3, ekip morali +4', run: (G) => { rep(G, 3); moraleAll(G, 4); return 'Sahibi ertesi gün çiçekle geldi; mahallede hikâyesi anlatılıyor.'; } },
        { label: 'Karakola bırak', desc: 'İtibar +1', run: (G) => { rep(G, 1); return 'Tutanak tutuldu, cüzdan sahibine ulaştı.'; } }
      ] }) });

  ev.push({ id: 'sokakKedisi', who: 'ayse', w: 0.5,
    build: (G) => ({ title: 'Dükkânın kedisi', text: 'Bir sokak kedisi birkaç gündür kapının önünde uyuyor. Müşteriler fotoğrafını çekiyor, bazıları sevmiyor.', ctx: {},
      choices: [
        { label: 'Mama kabı koy, adını Köfte koy', desc: '10 gün öğrenci ve turist +%15', run: (G) => { G.mods.push({ key: 'type:ogrenci', mult: 1.15, days: 10, label: 'Kedi Köfte' }); G.mods.push({ key: 'type:turist', mult: 1.15, days: 10, label: 'Kedi Köfte' }); return 'Köfte artık dükkânın maskotu. Sosyal medyada kendi hesabı bile var.'; } },
        { label: 'Hayvanseverlere haber ver', desc: 'İtibar +1', run: (G) => { rep(G, 1); return 'Gönüllüler kediyi aşılattı, yakındaki parka bir kulübe kurdu.'; } }
      ] }) });

  ev.push({ id: 'yolCalismasi', who: 'bulent', w: 0.5,
    build: (G) => ({ title: 'Kapının önünde yol çalışması', text: 'Belediye kaldırımı söktü; bir hafta sürecekmiş. Yaya trafiği düşecek.', ctx: {},
      choices: [
        { label: 'Yön tabelası ve paket kampanyası', desc: `${KE.tl(P(G, 5000))}, kayıp yarıya iner`, run: (G) => { pay(G, P(G, 5000)); G.mods.push({ key: 'traffic:' + branch(G).id, mult: 0.88, days: 6, label: 'Yol çalışması' }); return '"Kazıya rağmen açığız!" tabelası işe yaradı.'; } },
        { label: 'Sabret', desc: '6 gün müşteri −%25', run: (G) => { G.mods.push({ key: 'traffic:' + branch(G).id, mult: 0.75, days: 6, label: 'Yol çalışması' }); return 'Toz toprak içinde bir hafta geçti.'; } }
      ] }) });

  ev.push({ id: 'vergiDenetimi', who: 'zeynep', w: 0.4, when: (G) => G.day > 30,
    build: (G) => ({ title: 'Vergi incelemesi', text: 'Vergi müfettişi son üç ayın kayıtlarını istiyor. Zeynep Hanım: "Defterler tamam ama bir hafta mesai lazım."', ctx: {},
      choices: [
        { label: 'Muhasebeciye ek mesai öde', desc: `${KE.tl(P(G, 8000))}, sorunsuz`, run: (G) => { pay(G, P(G, 8000)); return 'İnceleme temiz kapandı. Müfettiş giderken "Defterleriniz örnek" dedi.'; } },
        { label: 'Kendin hazırla', desc: '%40 ihtimalle usulsüzlük cezası', run: (G) => { if (KE.rand() < 0.6) return 'Gece yarılarına kadar fatura sıraladın; inceleme temiz çıktı.'; const fine = P(G, 15000); G.cash -= fine; KE.addExtra(G, 'fines', fine); return `Birkaç fiş eksik çıktı: ${KE.tl(fine)} usulsüzlük cezası.`; } }
      ] }) });

  ev.push({ id: 'yeniTarif', who: 'lonca', w: 0.5, when: (G) => staffOf(G).some(KE.isCook),
    build: (G) => { const s = staffOf(G).filter(KE.isCook).sort((a, c) => c.morale - a.morale)[0];
      return { title: `${s.name}'nın yeni tarif fikri`, text: `${s.name}: "Memleketin usulü bir sos denesek? Bir hafta tadım yaparız, beğenilirse menüde kalır."`, ctx: { sid: s.id }, who: s,
        choices: [
          { label: 'Dene, malzemesini al', desc: `${KE.tl(P(G, 4000))}, usta morali +15, 7 gün gurme +%40`, run: (G, c) => { pay(G, P(G, 4000)); const x = G.staff.find((y) => y.id === c.sid); x.morale = clamp(x.morale + 15, 0, 100); G.mods.push({ key: 'type:gurme', mult: 1.4, days: 7, label: 'Yeni sos' }); return 'Sos tuttu! Gurmeler tarifini soruyor, usta sır vermiyor.'; } },
          { label: 'Klasikten şaşmayalım', desc: 'Usta morali −5', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); x.morale = clamp(x.morale - 5, 0, 100); return 'Usta "Peki" dedi ama biraz bozuldu.'; } }
        ] }; } });

  ev.push({ id: 'kermes', who: 'ayse', w: 0.5,
    build: (G) => ({ title: 'Okul kermesi', text: 'Mahalle okulu kütüphane için kermes düzenliyor. Ayşe Teyze dükkândan bir stant bekliyor.', ctx: {},
      choices: [
        { label: 'Stant kur, gelir okula', desc: `${KE.tl(P(G, 6000))} malzeme, itibar +4, 7 gün aile +%15`, run: (G) => { pay(G, P(G, 6000)); rep(G, 4); G.mods.push({ key: 'type:aile', mult: 1.15, days: 7, label: 'Kermes' }); return 'Stant ilk bir saatte tükendi. Okul müdürü teşekkür plaketi gönderdi.'; } },
        { label: 'Bağış yap', desc: `${KE.tl(P(G, 2500))}, itibar +2`, run: (G) => { pay(G, P(G, 2500)); rep(G, 2); return 'Bağış makbuzu panoya asıldı.'; } }
      ] }) });

  ev.push({ id: 'gazeteRoportaj', who: 'ajans', w: 0.5, when: (G) => G.reputation >= 35,
    build: (G) => ({ title: 'Yerel gazeteden röportaj', text: 'Mahalle gazetesi "Esnafın hikâyesi" köşesi için seninle konuşmak istiyor. Fotoğraf için ekibin de gelmesini istiyorlar.', ctx: {},
      choices: [
        { label: 'Ekiple birlikte poz ver', desc: 'Ekip morali +8, 7 gün müşteri +%10', run: (G) => { moraleAll(G, 8); G.mods.push({ key: 'traffic', mult: 1.1, days: 7, label: 'Gazete röportajı' }); return 'Fotoğraf kasanın arkasına asıldı. Ekip gururlu.'; } },
        { label: 'Yalnız konuş', desc: '7 gün müşteri +%6', run: (G) => { G.mods.push({ key: 'traffic', mult: 1.06, days: 7, label: 'Gazete röportajı' }); return 'Röportaj çıktı; birkaç yeni yüz "Gazetede gördük" dedi.'; } }
      ] }) });

  ev.push({ id: 'paketPlatform', who: 'emre', w: 0.45, when: (G) => G.staff.some((s) => s.role === 'kurye'),
    build: (G) => ({ title: 'Paket platformu teklifi', text: 'Bir sipariş uygulaması dükkânı ana sayfada öne çıkarmayı teklif ediyor: bir hafta boyunca, cironun %8\'i komisyon.', ctx: {},
      choices: [
        { label: 'Öne çıkalım', desc: '7 gün müşteri +%18, malzeme +%8', run: (G) => { G.mods.push({ key: 'traffic', mult: 1.18, days: 7, label: 'Platform vitrini' }); G.mods.push({ key: 'ing', mult: 1.08, days: 7, label: 'Platform komisyonu' }); return 'Telefonlar ve tabletler aynı anda ötüyor. Emre motoru hiç durdurmadı.'; } },
        { label: 'Kendi müşterimiz yeter', desc: 'Bir şey olmaz', run: () => 'Uygulamanın satış temsilcisi bir broşür bıraktı.' }
      ] }) });

  ev.push({ id: 'ustaYarismasi', who: 'lonca', w: 0.4, when: (G) => G.mode && KE.MODES[G.mode].products.some((p) => KE.bestStar(G, branch(G), p.id) >= 3),
    build: (G) => ({ title: 'Ustalar yarışması', text: 'Lonca bu ay şehrin ustalarını yarıştırıyor. Katılım ücreti var; birinci olanın dükkânı bütün şehirde konuşulacak.', ctx: {},
      choices: [
        { label: 'Ustamızı yarıştıralım', desc: `${KE.tl(P(G, 5000))}, yıldıza göre şans`, run: (G) => { pay(G, P(G, 5000)); const b = branch(G); const best = Math.max(...KE.MODES[G.mode].products.map((p) => KE.bestStar(G, b, p.id))); if (KE.rand() < 0.15 + best * 0.12) { rep(G, 7); G.mods.push({ key: 'traffic', mult: 1.2, days: 10, label: 'Yarışma birinciliği' }); moraleAll(G, 10); return 'Birinci olduk! Kupa vitrinde, kuyruk sokağın sonunda.'; } rep(G, 1); return 'Kıl payı ikinci olduk. Jüri "Seneye sizi bekleriz" dedi.'; } },
        { label: 'Bu yıl izleyelim', desc: 'Bir şey olmaz', run: () => 'Yarışmayı tribünden izledin; rakiplerin tekniklerini not ettin.' }
      ] }) });

  KE.EVENTS = ev;
  KE.rollEvent = function (G) {
    if (G.day < 3 || KE.rand() > 0.42) return null;
    const pool = ev.filter((e) => (!e.mode || e.mode === G.mode) && (!e.when || e.when(G)) && G.eventLog.slice(-4).indexOf(e.id) === -1);
    if (!pool.length) return null;
    let tot = pool.reduce((a, e) => a + e.w, 0), r = KE.rand() * tot;
    let e = pool[0];
    for (const x of pool) { if ((r -= x.w) <= 0) { e = x; break; } }
    const card = e.build(G);
    G.eventLog.push(e.id);
    return { id: e.id, who: e.who, title: card.title, text: card.text, ctx: card.ctx, whoStaff: card.who ? card.who.id : null, choices: card.choices.map((c) => ({ label: c.label, desc: c.desc })) };
  };
  KE.resolveEvent = function (G, idx) {
    KE.RNG.seed(G, 'event' + idx);
    const pe = G.pendingEvent;
    if (!pe) return '';
    const e = ev.find((x) => x.id === pe.id);
    let card;
    try { card = e.build(G); } catch (err) { card = null; }
    let msg = '';
    if (card && card.choices[idx]) msg = card.choices[idx].run(G, pe.ctx) || '';
    G.pendingEvent = null;
    return msg;
  };

  /* ---------- Karakter replikleri ---------- */
  KE.LINES = {
    zeynep: ['Rakamlar yalan söylemez, patron. Ama bazen insanı üzer.', 'Bordroyu hazırladım. SGK primlerini gününde yatırırsak 5 puanlık teşviki kaçırmayız.', 'Fireyi azaltırsak ay sonunda fark edersin.', 'KDV beyannamesi ayın 28\'inde, unutmayalım.'],
    ayse: ['Evladım, dürümün tuzu tam kararında. Ellerine sağlık.', 'Benim zamanımda döner odun ateşinde pişerdi, ama seninki de fena değil.', 'Fiyatları biraz yükseltmişsin gibi, emekliyiz biz.', 'Ustana iyi bak, iyi usta altın değerindedir.'],
    riza: ['En iyi parçayı sana ayırdım kardeşim.', 'Premium etle ustan şov yapar, söyleyeyim.', 'Halde fiyatlar her hafta oynuyor, ben ne yapayım.', 'Otomatik siparişini her sabah yediye kadar getiriyorum.'],
    bulent: ['Tezgâh altı temizliği her gün yapılacak.', 'Davlumbaz filtreleri haftada bir değişmeli.', 'Personelin portör muayeneleri tam mı?'],
    emre: ['Abi paketler sıcak gidiyor, müşteri memnun.', 'Yağmurlu günler bizim bayramımız.', 'Motorun lastiği eskidi, ama idare ederiz.'],
    banker: ['Esnaf kredisinde aylık faiz şu an %3,4 civarında.', 'Nakit akışı her şeydir. Şube açmadan önce üç aylık kira kenarda olmalı.'],
    ajans: ['Doğru semte doğru kampanya, kuyruğun yarısı reklamdan gelir.', 'Gençlere sosyal medya, ailelere tabela, işçilere el ilanı.'],
    terzi: ['Yöresel kostüm ustanın memleketine göre dikilir; kumaşı ben seçerim.', 'Güzel giyinen usta daha çok bahşiş alır, otuz yıllık tecrübe.'],
    dekor: ['Aynı tarzdan üç parça koyarsan dükkânın bir kimliği olur.', 'Mermer pahalıdır ama gurmeler görünce gözleri parlar.'],
    buro: ['Kasiyer olmazsa ustalar hem sipariş alır hem pişirir; her şey yavaşlar.', 'Temizlikçi masrafına bakma, denetim cezası daha pahalı.'],
    lonca: ['Her usta bir ekoldür. Uzmanlığına göre müşteri gelir.', 'Çırağı iyi bir ustanın yanına ver, üç ayda adam olur.', 'Pazarda her pazartesi yeni ustalar olur.'],
    rakip: ['Bu şehirde tek bir kebap imparatorluğu olur, o da benimki.', 'Ustanı bir gün ben de isterim, haberin olsun.']
  };
  KE.line = (who) => pick(KE.LINES[who] || ['...']);
})();
