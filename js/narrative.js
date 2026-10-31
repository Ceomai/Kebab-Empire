/* Kebab Empire — anlatı: gün sonu günlüğü, mahalle gazetesi, olay kartları, karakter repliği */
(function () {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
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

  ev.push({ id: 'rakipTeklif', who: 'rakip', w: 1.2,
    when: (G) => staffOf(G).some((s) => s.role === 'usta' && s.morale < 55),
    build: (G) => { const s = staffOf(G).filter((x) => x.role === 'usta').sort((a, c) => a.morale - c.morale)[0];
      return { title: `${s.name}'ya rakipten teklif!`, text: `"Lüks Kebap" sahibi Cüneyt Bey, ${s.name}'ya %30 daha fazla maaş teklif etmiş. Usta kararsız görünüyor ve seninle konuşmak istiyor.`, ctx: { sid: s.id },
        choices: [
          { label: 'Maaşına %15 zam yap', desc: 'Moral +22, maaş +%15', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); x.wage = Math.round(x.wage * 1.15 / 100) * 100; x.morale = clamp(x.morale + 22, 0, 100); return `${x.name} kaldı: "Bu dükkân benim de dükkânım."`; } },
          { label: 'Oturup gönlünü al', desc: '%55 ihtimalle kalır', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); if (Math.random() < 0.55) { x.morale = clamp(x.morale + 10, 0, 100); return `Uzun bir çay sohbeti işe yaradı. ${x.name} kalıyor.`; } G.staff = G.staff.filter((y) => y.id !== x.id); G.rival.power += 8; return `${x.name} teşekkür edip rakibe geçti. Ocağın başı boş kaldı.`; } },
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
        { label: 'Soruşturma başlat', desc: 'Moral −5, kavanoz belki bulunur', run: (G) => { staffOf(G).forEach((s) => { s.morale = clamp(s.morale - 5, 0, 100); }); return Math.random() < 0.5 ? 'Kavanoz depoda, un çuvallarının arkasında bulundu. Komi yanlışlıkla kaldırmış.' : 'Kavanoz bulunamadı. Ortam gergin.'; } },
        { label: 'Boş ver', desc: 'Moral −8', run: (G) => { staffOf(G).forEach((s) => { s.morale = clamp(s.morale - 8, 0, 100); }); return 'Ekip sessizce işine döndü ama kırgınlar.'; } }
      ] }) });

  ev.push({ id: 'zamTalebi', who: null, w: 1,
    when: (G) => staffOf(G).some((s) => s.morale < 62 && G.day - s.hiredDay > 10),
    build: (G) => { const s = staffOf(G).filter((x) => x.morale < 62).sort((a, c) => a.morale - c.morale)[0];
      return { title: `${s.name} zam istiyor`, text: `${s.name}: "Patron, kira arttı, mutfak masrafı arttı. Bir el atabilir misin?" Brüt maaşı şu an ${KE.tl(s.wage)}.`, ctx: { sid: s.id }, who: s,
        choices: [
          { label: '%10 zam yap', desc: 'Moral +18', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); x.wage = Math.round(x.wage * 1.1 / 100) * 100; x.morale = clamp(x.morale + 18, 0, 100); return `${x.name}: "Sağ ol patron, hakkını helal et."`; } },
          { label: 'Şimdilik olmaz', desc: 'Moral −10', run: (G, c) => { const x = G.staff.find((y) => y.id === c.sid); x.morale = clamp(x.morale - 10, 0, 100); return `${x.name} başını öne eğdi: "Anladım."`; } }
        ] }; } });

  ev.push({ id: 'etZammi', who: 'riza', w: 1,
    build: (G) => ({ title: 'Kasap Rıza\'dan zam haberi', text: '"Kusura bakma kardeşim, halde fiyatlar uçtu. Bu hafta et kalemlerine %15 zam yapmak zorundayım."', ctx: {},
      choices: [
        { label: 'Pazarlık et', desc: '%50 ihtimalle %5\'e iner', run: (G) => { if (Math.random() < 0.5) { G.mods.push({ key: 'ing', mult: 1.05, days: 7, label: 'Et zammı' }); return '"Senin hatırın için %5 olsun." Rıza sözünün eri.'; } G.mods.push({ key: 'ing', mult: 1.15, days: 7, label: 'Et zammı' }); return '"Elimden gelen bu kadar." Zam %15 kaldı.'; } },
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

  ev.push({ id: 'iftar', who: 'ayse', w: 0.5,
    build: (G) => ({ title: 'Mahalle sofrası', text: 'Ayşe Teyze mahallede ihtiyaç sahipleri için bir sofra kuruluyor, dükkândan da katkı bekliyor.', ctx: {},
      choices: [
        { label: '50 porsiyon gönder', desc: `${KE.tl(9000)}, itibar +5, moral +3`, run: (G) => { G.cash -= 9000; KE.addExtra(G, 'other', 9000); G.reputation = clamp(G.reputation + 5, 0, 100); staffOf(G).forEach((s) => { s.morale = clamp(s.morale + 3, 0, 100); }); return 'Ayşe Teyze dualar etti. Mahallede adın hayırla anılıyor.'; } },
        { label: 'Bu sefer olmaz', desc: 'İtibar −1', run: (G) => { G.reputation = clamp(G.reputation - 1, 0, 100); return 'Ayşe Teyze bozulmadı ama biraz kırıldı.'; } }
      ] }) });

  ev.push({ id: 'yagmur', who: 'emre', w: 0.8,
    build: (G) => ({ title: 'Sağanak geliyor', text: 'Meteoroloji yarın için sarı kod verdi. Kurye Emre: "Abi yarın herkes evden sipariş verir, kapıya kimse gelmez."', ctx: {},
      choices: [
        { label: 'Tamam, hazırlıklıyız', desc: 'Yarın kapı müşterisi −%25', run: (G) => { G.mods.push({ key: 'traffic', mult: 0.75, days: 1, label: 'Sağanak' }); return 'Kepenk önüne kum torbası koyduk.'; } }
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

  KE.EVENTS = ev;
  KE.rollEvent = function (G) {
    if (G.day < 3 || Math.random() > 0.42) return null;
    const pool = ev.filter((e) => (!e.mode || e.mode === G.mode) && (!e.when || e.when(G)) && G.eventLog.slice(-4).indexOf(e.id) === -1);
    if (!pool.length) return null;
    let tot = pool.reduce((a, e) => a + e.w, 0), r = Math.random() * tot;
    let e = pool[0];
    for (const x of pool) { if ((r -= x.w) <= 0) { e = x; break; } }
    const card = e.build(G);
    G.eventLog.push(e.id);
    return { id: e.id, who: e.who, title: card.title, text: card.text, ctx: card.ctx, whoStaff: card.who ? card.who.id : null, choices: card.choices.map((c) => ({ label: c.label, desc: c.desc })) };
  };
  KE.resolveEvent = function (G, idx) {
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
