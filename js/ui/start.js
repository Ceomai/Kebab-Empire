/* Kebab Empire — arayüz: açılış ve yeni oyun ekranları. */
(function () {
  const UI = KE.UI, H = UI.H, SCREENS = UI.SCREENS, A = UI.A, C = UI.C;
  const { esc, IC, pn, stars, bar, moodCls } = H;

  /* =================== EKRANLAR =================== */

  function skyline(w, h, seed, col, hi) {
    let r = seed; const rnd = () => (r = r * 16807 % 2147483647) / 2147483647;
    let x = 0, d = '';
    while (x < w) {
      const t = rnd();
      if (t < 0.12) { const R = 26 + rnd() * 30; d += `<rect x="${x}" y="${h - 40}" width="${R * 2 + 20}" height="40"/><path d="M${x + 10} ${h - 40} a${R} ${R} 0 0 1 ${R * 2} 0z"/><rect x="${x + 8 + R - 2}" y="${h - 40 - R - 14}" width="4" height="14"/>`; d += `<rect x="${x - 4}" y="${h - 40 - R * 2.4}" width="7" height="${R * 2.4}"/><path d="M${x - 4} ${h - 40 - R * 2.4} l3.5 -16 l3.5 16z"/><rect x="${x + R * 2 + 18}" y="${h - 40 - R * 2.4}" width="7" height="${R * 2.4}"/><path d="M${x + R * 2 + 18} ${h - 40 - R * 2.4} l3.5 -16 l3.5 16z"/>`; x += R * 2 + 34; }
      else if (t < 0.18) { d += `<rect x="${x}" y="${h - 120}" width="26" height="120"/><path d="M${x - 3} ${h - 120} l16 -34 l16 34z"/>`; x += 34; }
      else { const bw = 22 + rnd() * 40, bh = 30 + rnd() * 70; d += `<rect x="${x}" y="${h - bh}" width="${bw}" height="${bh}" rx="2"/>`; if (rnd() < 0.5) d += `<path d="M${x - 2} ${h - bh} l${bw / 2 + 2} -${10 + rnd() * 8} l${bw / 2 + 2} ${10 + rnd() * 8}z"/>`; x += bw + 2 + rnd() * 6; }
    }
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g fill="${col}">${d}</g>${hi ? `<g fill="${hi}" opacity=".5">${d.replace(/<path[^>]*>/g, '')}</g>` : ''}</svg>`;
  }
  SCREENS.title = () => {
    const has = UI.hasSave();
    if (!UI.heroCast) {
      UI.heroCast = {
        usta: { look: Object.assign(KE.randomLook('e', 'orta'), { facial: 'gurbiyik', skin: '#d9a273', hairColor: '#2b1d14', head: 'none' }), region: 'Adana', costume: 'yoresel', role: 'usta' },
        komi: { look: Object.assign(KE.randomLook('k', 'genc'), { head: 'none', hair: 'topuz', skin: '#e8b98f' }), region: 'İstanbul', costume: 'markali', role: 'garson' },
        walkers: ['ogrenci', 'turist', 'aile', 'isci', 'gece', 'beyaz'].map((t) => KE.customerLook(t))
      };
    }
    const hc = UI.heroCast;
    return `<main class="title2">
      <div class="t-sky"><div class="t-rays"></div><div class="t-sun"></div></div>
      <div class="t-cloud c1"></div><div class="t-cloud c2"></div><div class="t-cloud c3"></div>
      <div class="t-sky-far">${skyline(1600, 220, 7, '#9cc9ea')}</div>
      <div class="t-sky-near">${skyline(1600, 200, 31, '#6aa2d3')}</div>
      <div class="t-sea"><div class="t-ferry"><svg viewBox="0 0 90 40" aria-hidden="true"><path d="M4 22 h82 l-10 14 h-62z" fill="#fff"/><rect x="18" y="8" width="54" height="14" rx="3" fill="#d7263d"/><rect x="40" y="0" width="8" height="10" fill="#2c3e50"/><g fill="#bde3f7"><rect x="23" y="12" width="7" height="6"/><rect x="34" y="12" width="7" height="6"/><rect x="49" y="12" width="7" height="6"/><rect x="60" y="12" width="7" height="6"/></g></svg></div><div class="t-gulls">⌒⌒ ⌒</div></div>
      <div class="t-street"><div class="t-walk w1">${KE.figure(hc.walkers[0], { pose: 'walk', mood: 'happy' })}</div><div class="t-walk w2">${KE.figure(hc.walkers[1], { pose: 'walk', mood: 'happy' })}</div><div class="t-walk w3">${KE.figure(hc.walkers[2], { pose: 'walk', mood: 'happy' })}</div><div class="t-walk w4">${KE.figure(hc.walkers[3], { pose: 'walk', mood: 'happy' })}</div></div>
      <div class="t-shop">
        <div class="t-store">${KE.ART.storefront('Kebab Empire', '#d7263d', true)}</div>
        <div class="t-doner">${KE.ART.doner('et')}</div>
        <div class="t-fig f1">${KE.figure(KE.staffLook(hc.usta), { mood: 'happy' })}</div>
        <div class="t-fig f2">${KE.figure(KE.staffLook(hc.komi), { mood: 'happy', tray: true, trayDish: KE.ART.dish('iskender') })}</div>
      </div>
      <div class="t-dish d1">${KE.ART.dish('adana')}</div><div class="t-dish d2">${KE.ART.dish('lahmacun')}</div><div class="t-dish d3">${KE.ART.dish('et_durum')}</div><div class="t-dish d4">${KE.ART.dish('kunefe')}</div>
      <div class="t-front">
        <div class="t-logo"><span class="t-mark">${KE.ART.logo()}</span><h1><span>Kebab</span><em>Empire</em></h1><span class="t-ribbon">Döner ve kebap işletme oyunu</span></div>
        <div class="t-cta">${has ? `<button class="btn big green" data-a="continue">${IC('play')}Devam et</button>` : ''}<button class="btn big ${has ? 'gold' : 'green'}" data-a="newgame">${IC('plus')}Yeni oyun</button><button class="btn big ghost" data-a="guide">${IC('book')}Kılavuz</button><button class="btn big ghost round langbtn" data-a="lang" aria-label="Dil / Language" title="Dil / Language">${(KE.I18N ? KE.I18N.lang : 'tr').toUpperCase()}</button><button class="btn big ghost round" data-a="importSave" aria-label="Yedek dosyasından yükle" title="Yedek dosyasından yükle">${IC('arrow')}</button><button class="btn big ghost round" data-a="sound" aria-label="Ses">${IC(KE.SND.on ? 'sound' : 'mute')}</button></div>
        ${(() => { const h = UI.hall ? UI.hall() : []; return h.length ? `<div class="t-hall"><span class="kicker">${IC('crown')}Şeref kürsüsü</span>${h.slice(0, 3).map((x) => `<span><b>${esc(x.shop)}</b> · ${x.gen}. kuşak · ${x.days} günde imparator</span>`).join('')}</div>` : ''; })()}
      </div>
    </main>`;
  };

  function steps(n) {
    return `<ol class="steps">${['Mod', 'Semt', 'Usta'].map((l, i) => `<li class="${i + 1 < n ? 'done' : i + 1 === n ? 'on' : ''}"><i>${i + 1 < n ? '✓' : i + 1}</i>${l}</li>`).join('')}</ol>`;
  }
  SCREENS.newMode = () => {
    const ng = UI.ng;
    const card = (m) => {
      const M = KE.MODES[m];
      const dishes = M.products.slice(0, 5).map((p) => `<span>${KE.ART.dish(p.id)}</span>`).join('');
      const facts = m === 'doner'
        ? [['users', 'Kalabalık kuyruk, hızlı servis'], ['coin', 'Düşük kâr payı, çok müşteri'], ['queue', 'Öğrenci, işçi, gece çıkışı']]
        : [['table', 'Masaya oturan müşteri, uzun pişirme'], ['star', 'Yüksek hesap, yüksek bahşiş'], ['heart', 'Aileler, gurmeler, turistler']];
      return `<button class="modecard ${ng.mode === m ? 'sel' : ''}" data-a="pickMode" data-m="${m}">
        <div class="mc-art ${m}">${m === 'doner' ? KE.ART.doner('et') + KE.ART.doner('tavuk') : KE.ART.mangal(3) + '<span class="smoke s1"></span><span class="smoke s2"></span>'}</div>
        <div class="mc-body"><h3>${M.name}</h3><p>${M.tagline}</p><ul>${facts.map(([ic, t]) => `<li>${IC(ic)}${t}</li>`).join('')}</ul><div class="mc-dishes">${dishes}</div></div>
        ${ng.mode === m ? `<span class="mc-check">${IC('check')}</span>` : ''}</button>`;
    };
    const saved = UI.hasSave() && !ng.legacy ? KE.SAVE.read() : null;
    const lg = ng.legacy;
    return `<main class="screen narrow">${steps(1)}
      ${lg ? `<div class="note heirnote">${IC('users')}<span><b>${lg.gen}. kuşak.</b> ${esc(lg.from)} imparatorluğunun torunu olarak yeni bir mahallede başlıyorsun. ${lg.heirName ? esc(lg.heirName) + "'nın ustalığı ilk ustana geçecek." : ''} Rakip bu sefer daha güçlü.</span></div>` : ''}<div class="row between"><h1 class="stitle">Ne olacaksın?</h1><button class="btn sm ghost" data-a="backToTitle">${IC('arrow')}Ana menü</button></div>
      ${saved ? `<div class="note savednote">${IC('store')}<span><b>${esc(saved.game.shopName || 'Kayıtlı oyun')}</b> · ${KE.dateStr(saved.game.day)} kayıtlı duruyor. Yeni oyunu başlatana kadar silinmez; istersen geri dönüp devam edebilirsin.</span><button class="btn sm green" data-a="continue">${IC('play')}Kayıtlı oyuna dön</button></div>` : ''}
      <div class="modecards">${lg ? card(lg.mode) : card('doner') + card('kebap')}</div>
      <div class="panel formrow">
        <label class="field">Adın<input id="ng-owner" value="${esc(ng.owner || '')}" placeholder="Örn. Deniz" maxlength="24" autocomplete="off"></label>
        <label class="field grow">Dükkânının adı<input id="ng-shop" value="${esc(ng.shopName || '')}" placeholder="${ng.mode === 'kebap' ? 'Örn. Köz Ocakbaşı' : 'Örn. Yaprak Döner'}" maxlength="26" autocomplete="off"></label>
        <button class="btn big green" data-a="ngStep" data-to="newDistrict" ${ng.mode ? '' : 'disabled'}>Devam ${IC('play')}</button>
      </div></main>`;
  };

  SCREENS.newDistrict = () => {
    const ng = UI.ng;
    const d = KE.DISTRICTS.find((x) => x.id === ng.district);
    const mix = (dd) => Object.entries(dd.mix).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => `<span class="chip bl">${KE.CUSTOMER_TYPES[t].name}</span>`).join('');
    return `<main class="screen">${steps(2)}<div class="row between"><h1 class="stitle">İlk dükkânın hangi semtte?</h1><button class="btn sm ghost" data-a="ngStep" data-to="newMode">${IC('arrow')}Geri</button></div>
      <div class="pickmap">
        <div class="mapframe">${KE.MAP.render({ pick: true })}</div>
        <aside class="panel dcard">${d ? `<span class="kicker">${d.side} yakası · ${d.inspired} esintisi</span><h2>${d.name}</h2><p>${d.desc}</p>
          <div class="facts"><div><small>Aylık kira</small><b>${KE.tl(d.rent)}</b></div><div><small>Yaya trafiği</small><b>${d.traffic}</b></div><div><small>Rakip</small><b>${d.rivals}</b></div></div>
          <div><small class="muted">Baskın müşteri</small><div class="chips">${mix(d)}</div></div>
          <p class="small muted">Semt dükkânın görünümünü değiştirmez. Müşteri karışımını, kirayı ve rekabeti belirler.</p>
          <button class="btn big green block" data-a="ngStep" data-to="newMaster">Burada aç ${IC('play')}</button>`
          : `<span class="kicker">Haritadan seç</span><h2>Yedi semt, yedi ayrı müşteri</h2><p>Bir semtin üstüne tıkla. Öğrenci yokuşundan plaza öğle arasına, sahil ailelerinden tarihi çarşının turistlerine kadar her semtin derdi ayrı.</p>`}
          <div class="dlist">${KE.DISTRICTS.map((x) => `<button class="dl ${x.id === ng.district ? 'sel' : ''}" data-a="pickDistrict" data-d="${x.id}"><b>${x.name}</b><small>${KE.tl(x.rent)} · ${Object.entries(x.mix).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => KE.CUSTOMER_TYPES[t].name).join(', ')}</small></button>`).join('')}</div>
        </aside></div></main>`;
  };

  function statl(l, v) { return `<div class="statl"><span>${l}</span>${bar(v * 100, v < 0.5 ? 'crit' : v < 0.75 ? 'warn' : 'ok')}<b>${Math.round(v * 100)}</b></div>`; }
  function masterCard(s, opts) {
    opts = opts || {};
    const tr = KE.TRAITS[s.trait];
    const specs = Object.entries(s.spec).sort((a, b) => b[1] - a[1]);
    return `<article class="card person ${opts.sel ? 'sel' : ''}">
      <div class="pc-top"><div class="pc-fig">${KE.figure(KE.staffLook(s), { mood: KE.moodFromValue(s.morale), label: s.name })}</div>
        <div class="pc-id"><h3>${esc(s.name)}</h3><div class="chips"><span class="chip or">${s.role === 'cirak' ? 'Çırak' : 'Usta'}</span><span class="chip">${s.region}</span>${tr ? `<span class="chip gd" title="${esc(tr.desc)}">${tr.name}</span>` : ''}</div>
        ${opts.own ? `<div class="statl"><span>Moral</span>${bar(s.morale, moodCls(s.morale))}<b>${Math.round(s.morale)}</b></div>` : ''}
        <div class="specs">${specs.map(([pid, st]) => `<div class="spec">${KE.ART.dish(pid)}<span><b>${pn(pid)}</b>${stars(st)}${opts.own && st < 5 ? `<em class="xp">${bar((s.xp[pid] || 0) / KE.STAR_NEED[st + 1] * 100, 'thin')}</em>` : ''}</span></div>`).join('') || '<span class="muted small">Henüz uzmanlık yok</span>'}</div></div></div>
      <div class="pc-stats">${statl('Hız', (s.speed - 0.6) / 0.8)}${statl('Kalite', (s.quality + s.consistency) / 2)}${statl('Fire kontrol', 1.2 - s.waste)}</div>
      ${tr ? `<p class="small muted">${tr.desc}</p>` : ''}${opts.extra || ''}
      <div class="pc-foot"><div class="price"><b>${KE.tl(s.wage)}</b><small>brüt / ay${s.fee ? ` · transfer ${KE.tl(s.fee)}` : ''}</small></div><div class="row">${opts.actions || ''}</div></div>
    </article>`;
  }

  SCREENS.newMaster = () => {
    const ng = UI.ng;
    if (!ng.masters) {
      const t = KE.MASTER_TEMPLATES[ng.mode].filter((x) => x.role !== 'cirak').slice().sort(() => Math.random() - 0.5).slice(0, 3);
      const fakeG = { nextId: 900, day: 1, mode: ng.mode };
      ng.masters = t.map((x) => Object.assign(KE.makeStaff(fakeG, Object.assign({}, x, { role: 'usta' })), { tmpl: x }));
      /* yeni nesil: ustalar ailenin ocak bilgisini devralır */
      if (ng.legacy && ng.legacy.spec) ng.masters.forEach((m) => { m.spec = Object.assign({}, ng.legacy.spec); m.wage = KE.wageFor(m.spec, 'usta'); });
    }
    return `<main class="screen">${steps(3)}<div class="row between"><h1 class="stitle">Ocağın başına kim geçecek?</h1><button class="btn sm ghost" data-a="ngStep" data-to="newDistrict">${IC('arrow')}Geri</button></div>
      ${ng.legacy && ng.legacy.spec ? `<p class="note heirnote">${IC('star')}<span>Hangi ustayı seçersen seç, ${esc(KE.ek(ng.legacy.heirName || 'aile ustası', 'in'))} uzmanlıkları ona geçer.</span></p>` : ''}
      <p class="lead light">Usta yalnızca pişirir; uzman olduğu ürünü seven müşteriyi dükkâna çeker. Yanına bir çırak, bir kasiyer ve bir ${ng.mode === 'kebap' ? 'garson' : 'komi'} veriliyor.</p>
      <div class="grid g3">${ng.masters.map((s, i) => masterCard(s, { sel: ng.master === i, actions: `<button class="btn ${ng.master === i ? 'green' : ''}" data-a="pickMaster" data-i="${i}">${ng.master === i ? IC('check') + 'Seçildi' : 'Bu usta'}</button>` })).join('')}</div>
      <div class="row end"><button class="btn big green" data-a="startGame" ${ng.master == null ? 'disabled' : ''}>Kepengi kaldır ${IC('play')}</button></div></main>`;
  };


  /* =================== OYUN KILAVUZU ===================
     Ana menüden ve oyun içi menüden açılır. Her bölüm: simge, başlık, kısa giriş, maddeler. */
  const GUIDE = [
    { id: 'baslangic', ic: 'play', t: 'İlk adımlar', lead: 'Babadan kalan küçük bir dükkânla başlarsın. Amaç önce mahallede tutunmak, sonra şubeleşmek, en sonunda rakip zincir "Lüks Kebap"ı satın alıp şehrin tek kebap imparatoru olmak.', items: [
      'Önce modunu seç: <b>Döner</b> kalabalık ve hızlı servis, düşük kâr payı demek; <b>Kebap</b> masaya oturan müşteri, uzun pişirme ve yüksek hesap demek.',
      'Semtin müşteri karışımını, kirayı ve rekabeti belirler. Kampüstepe öğrenci, Kulealtı plaza çalışanı, Sultanpazarı turist, Bostansahil aile doludur.',
      'İlk ustanı seç. Usta yalnızca pişirir; uzman olduğu ürünü seven müşteriyi dükkâna çeker. Yanına bir çırak, bir kasiyer ve bir komi/garson verilir.',
      'İlk gün kısa bir rehber çıkar. İstersen atlayabilirsin; bu kılavuz her zaman ana menüde ve oyun içi menüde durur.'
    ] },
    { id: 'gun', ic: 'clock', t: 'Bir günün akışı', lead: 'Her gün üç evreden oluşur: sabah hazırlığı, servis ve kapanış.', items: [
      '<b>Sabah:</b> Haritada yerleri gez (hal, usta pazarı, eleman bürosu…), fiyatları ve görevleri ayarla. Olay kartı gelirse kararını ver.',
      '<b>Açılış kontrolü:</b> Dükkân ekranının başındaki dört madde (ekip, stok, fiyat, bekleyen karar) yeşilse kepengi açmaya hazırsın; eksik olanın yanındaki düğme tek dokunuşla düzeltir.',
      '<b>Geri al:</b> Sabah, kepengi açmadan yaptığın son işlemi (işe alım, fiyat, satın alma, görev değişikliği) ekranın altındaki "Geri al" düğmesiyle geri alabilirsin.',
      '<b>Servis (10:00–23:00):</b> Dükkânda müşteriler gelir, sipariş verir, yer ve gider. Hızı 1×, 2× ya da 4× yapabilir, istediğin an "Günü hızlı bitir" ile günü sonlandırabilirsin.',
      '<b>Kapanış:</b> Günün raporunu görürsün, bahşişin nasıl dağıtılacağını seçersin ve günlüğünü okursun.',
      '<b>Hızlı gün:</b> Servisi izlemek istemediğin günlerde sabah ekranındaki "Hızlı gün" düğmesi servisi atlayıp doğrudan sonuca geçer.',
      '<b>Haftayı hızlı geç:</b> Yedi semtin hepsinde şube açtıktan sonra açılır. Haftanın kalanını tek tuşla geçer; biri istifa ederse, ay kapanırsa, yeni döneme geçersen, müfettiş gelirse ya da bir karar beklerse durur.',
      '<b>Yönlendirme düzeyi:</b> Menüden "Bugün ne yapmalıyım?" kartının ne kadar konuşacağını seçebilirsin: Çok, Az (yalnızca acil uyarılar) ya da Sessiz.',
      'Oyun her gün sonunda tarayıcıya kaydedilir. Menüden dosyaya yedek alabilir, başka cihazda yükleyebilirsin.'
    ] },
    { id: 'servis', ic: 'store', t: 'Servis ve tezgâh', lead: 'Müşteri kapıdan girer, kasada sipariş verir, usta pişirir, komi/garson yemeği masaya götürür, müşteri yer ve bahşiş bırakır.', items: [
      'Kuyruk uzarsa müşteriler beklemekten sıkılıp gider; yemek gecikirse masada kalkarlar; yer yoksa kapıdan döner.',
      'Sahnedeki yoğunluk göstergesi kırmızıya dönen yeri gösterir: kuyruk uzarsa kasaya, tabak beklerse servise bir kişi daha ver.',
      '<b>Tezgâh:</b> İstersen tezgâha geçip siparişleri kendin hazırlarsın. Adımları doğru sırayla seç; hızlı ve hatasız olursan kalite artar. Her gün tezgâhta 6 sipariş hazırlamak bonus hedeftir (iki kat ödül).',
      'Bir müşterinin en sevdiği ürünü o ürünün uzmanı pişirirse "Ellerine sağlık!" der; memnuniyet ve bahşiş artar.',
      '<b>Gün ortası kararları:</b> Bazı günler servis sırasında küçük bir olay çıkar: turist otobüsü, sönen ocak, fenalaşan bir çalışan, bastıran sağanak. Oyun durur ve seçim yaparsın; karar vermezsen 40 dakika sonra güvenli seçenek uygulanır.',
      '<b>Acil kurye:</b> Servis sırasında malzeme bitmek üzereyse yan paneldeki "Acil kurye" düğmesi eksikleri normal fiyatın 1,5 katına hemen getirir. Günde bir kez kullanılabilir.',
      '<b>Ekip panosu:</b> Ekip panelinde "Pano" görünümüne geçersen görevleri sütun sütun görürsün. Bir kişiye dokun, sonra gideceği sütuna dokun; masaüstünde sürükleyip bırakabilirsin.',
    ] },
    { id: 'ekip', ic: 'users', t: 'Ekip, roller ve moral', lead: 'Her rolün tek bir işi vardır; doğru kişiyi doğru göreve vermek servisin hızını belirler.', items: [
      '<b>Usta / çırak:</b> Pişirir. Yıldızları (★1–5) ürün bazındadır ve pişirdikçe artar. Çırağı bir ustanın yanına mentor olarak verirsen ondan öğrenir; 3 yıldıza ulaşınca usta yapabilirsin.',
      '<b>Kasiyer:</b> Sipariş ve ödeme alır. <b>Komi/garson:</b> Yemeği masaya götürür, masaları toplar.',
      '<b>Temizlik görevlisi:</b> Salonu temiz tutar. Ölçümlerimizde memnuniyeti yaklaşık 8 puan artıran en verimli işe alımdır.',
      '<b>Kurye:</b> Paket siparişleri getirir. Mutfağa ek iş yükler; ancak mutfakta boş kapasite varsa kâr getirir.',
      '<b>Şube müdürü:</b> İkinci şubeyle birlikte görünür. Ekibi yoğunluğa göre kendisi yönetir ve sabah stok ile fiyat ayarlarını yapar.',
      '<b>Moral:</b> Bahşiş, kostüm, dinlenme odası ve molalar morali artırır; aşırı yorgunluk ve geciken maaş düşürür. Morali 18\'in altına düşen çalışan istifa edebilir.',
      '<b>Mola:</b> Enerjisi biten çalışanı sakin saatte molaya gönder. Otomatik ekip yönetimi açıksa bunu kendisi yapar ve hiçbir görevi tamamen boş bırakmaz.',
      '<b>Ustaların huyları:</b> Ustalar zaman zaman izin ister, çıraklarıyla atışır ya da başka yerden teklif alır. Verdiğin karar moralini ve sadakatini etkiler.',
    ] },
    { id: 'kadro', ic: 'lock', t: 'Kadro sınırı ve dükkânı büyütmek', lead: 'Bir şubede çalışabilecek kişi sayısı dükkânın büyüklüğüne bağlıdır.', items: [
      '<b>Mutfak</b> (usta + çırak): ocak yeri + 1. <b>Salon</b> (kasiyer + garson): masa sayısının yarısı. <b>Paket ve temizlik:</b> salon seviyesi + 1. <b>Müdür:</b> 1.',
      'Sınırı Mobilya ve Dekor\'daki ocak ve salon yükseltmeleri açar. Ekipman kartları, yükseltmenin kaç kişilik yer açacağını yazar.',
      '<b>Kadro doluysa işe alım yapılamaz.</b> Yeni birini almak için önce yer aç ya da sabah Kadrom sekmesinden birini çıkar. Birden çok şuben varsa birini boş yeri olan şubeye de atayabilirsin.',
      'Ocak yükseltmesi ancak o ocağı kullanacak pişirmecin varsa müşteri getirir; boş ocak yeri işe yaramaz.',
      'Hazırlık ekipmanı pişirmeyi hızlandırır, soğutma fireyi azaltır; ikisi de mutfak darboğaz olduğunda fark yaratır.'
    ] },
    { id: 'fiyat', ic: 'coin', t: 'Menü ve fiyatlar', lead: 'Fiyat, kâr ile müşteri arasında bir denge kurar.', items: [
      'Her ürünün bir piyasa fiyatı vardır ve enflasyonla birlikte her ay artar. Fiyatlarını güncellemezsen kâr payın sessizce erir; dükkân ekranı bunu uyarır ve tek tuşla piyasaya çekebilirsin.',
      'Piyasanın üstündeki fiyat, müşteriyi tipine göre kaçırır: öğrenci ve inşaat ekibi en hassas, gurme ve turist en az hassastır.',
      'İtibar yükseldikçe müşteriler daha yüksek fiyata katlanır (itibar 90\'da yaklaşık %10). İmza tarif de bu toleransı artırır.',
      'Piyasanın altındaki fiyat kapıya biraz daha fazla müşteri getirir ve memnuniyeti artırır; ama dükkânın zaten doluysa gelenler kapıdan döner.',
      'Bazı ürünler itibar arttıkça açılır; bazıları ise yalnızca o ürünü bilen bir usta varsa menüye girebilir.'
    ] },
    { id: 'tedarik', ic: 'cart', t: 'Hal, stok ve tedarik', lead: 'Kasap Rıza her sabah stoğu son günlerin kullanımına ve bugünün beklenen kalabalığına göre tamamlar.', items: [
      '<b>Bugünün tahmini:</b> Hal ekranının başında bugün kaç müşteri beklendiği yazar. Hafta sonu, maç akşamı, bayram ya da reklam kampanyası günü "kalabalık gün" olarak işaretlenir; Rıza siparişi kendiliğinden büyütür, sakin günde küçültür.',
      '<b>Sabah verilen sipariş bugüne yansır:</b> Kepengi açmadan önce sipariş ayarını değiştirir ya da kampanya başlatırsan, "Bugünün ihtiyacına tamamla" düğmesi eksikleri hemen getirir. Danışman kartı da eksik olduğunda uyarır.',
      '<b>Sabah siparişi:</b> "Normal" çoğu gün yeterlidir. Dün ürünler akşam olmadan bittiyse "Bol"a geç; fire biraz artar ama kaçan satış azalır.',
      'Gün içinde bir ürünün malzemesi biterse o ürün satılamaz; günlükte hangi saatte bittiği yazar.',
      '<b>Tedarik kalitesi:</b> Ucuz malzeme kâr payını artırır ama memnuniyeti ve itibarı düşürür. Premium malzeme pahalıdır ama memnuniyeti belirgin artırır.',
      'Hal ekranından gün içinde ek alım da yapabilirsin.'
    ] },
    { id: 'kapasite', ic: 'queue', t: 'Kapasite: en önemli darboğaz', lead: 'Gelen her müşteriye hizmet edemezsin. Hizmet alamadan gidenlerin oranı, büyümenin en net göstergesidir.', items: [
      'Dükkânın sabah ekranında "Kapasite: dün %x kaçtı" yazar. Bu oran %12\'yi geçerse uyarı çıkar.',
      'Kapasite doluyken reklam, dekor ya da indirim gibi müşteri getiren her şey büyük ölçüde boşa gider: gelenler kapıdan döner.',
      'Kapasiteyi artırmanın yolları: kasaya ve servise kişi eklemek, boş ocak yerine pişirmeci almak, salonu büyütmek.',
      'Kapanış raporundaki öneriler, o gün en çok müşteriyi neden kaybettiğini ve ne yapacağını söyler.'
    ] },
    { id: 'bahsis', ic: 'gift', t: 'Bahşiş kuralları', lead: 'Kapanışta bahşiş kavanozunu nasıl dağıtacağını seçersin; bu seçim ekibin moralini belirler.', items: [
      '<b>Eşit paylaşım:</b> Herkese eşit; moral dengeli artar.',
      '<b>Ustaya ağırlık:</b> Ustalar iki pay alır, keyiflenir; çıraklar ustalarından %30 daha hızlı öğrenir. Diğerleri biraz bozulur.',
      '<b>Performansa göre:</b> Kim çok iş çıkardıysa o çok alır; çalışkanlar mutlu olur.',
      '<b>Kasaya al:</b> Bahşiş işletmeye kalır, ekip ay sonu primi sözüyle idare eder. Kısa vadede nakit sağlar; uzun süre yapılırsa moral, hız ve itibar düşer.',
      '<b>Ekibin isteği:</b> Ekip her hafta bir kural ister (kapanış ekranında yazar). O kuralı seçtiğin her gün herkesin morali biraz daha artar; çırakları mentorlu ekipler çoğunlukla "Ustaya ağırlık" ister.',
    ] },
    { id: 'temizlik', ic: 'broom', t: 'Temizlik ve denetim', lead: 'Temizlik her müşteriyle düşer; temizlik görevlisi ve masa toplamak yükseltir.', items: [
      'Belediye denetiminde temizlik 55\'in altındaysa ceza yersin (Muhtar Kemal Bey hikâyesini tamamlarsan eşik 45\'e iner).',
      'Temizlik memnuniyeti doğrudan etkiler; 35\'in altında ekip de yavaşlar.',
      'Belediye ekranından hijyen eğitimi ve derin temizlik satın alabilirsin.'
    ] },
    { id: 'donemler', ic: 'target', t: 'Dönemler', lead: 'Oyun dört dönemden oluşur. Her dönemin şartları tamamlanınca yeni yerler ve özellikler açılır.', items: [
      '<b>1. Mahalle dükkânı:</b> Bir haftayı ve bir ayı kârla kapat, itibarı 40\'a çıkar, bir ekipmanı yükselt.',
      '<b>2. Semtin yıldızı:</b> Reklam Ajansı ve Merkez Ofis (yeni şube açma) açılır. Geçmek için: dört şube, ayda 5 milyon ₺ ciro, itibar 65.',
      '<b>3. Şehrin zinciri:</b> Besi çiftliği ve büyük yatırımlar açılır. Geçmek için: altı şube, iki semt tacı (dönerde üç), imza tarifin 2. seviyesi, on toplu sipariş.',
      '<b>4. İmparatorluk yolu:</b> "Lüks Kebap"ı satın alma teklifi açılır.',
      '<b>Rehber yıldızı:</b> 3. dönemden sonra itibarın 88\'in üstündeyse rehber müfettişi habersiz bir şubeye gelir (danışman kartı o sabah haber verir). Memnuniyet %84 ve kaçan müşteri %10\'un altındaysa zincir bir yıldız kazanır (en çok 3): her yıldız müşteriyi ve fiyat toleransını kalıcı olarak %3 artırır. Başarısız ziyaret itibar götürür.',
      'Haritadaki şehir panelinde içinde bulunduğun dönem ve eksik şartlar görünür; bir şarta dokununca ilgili yere gidersin.'
    ] },
    { id: 'subeler', ic: 'store', t: 'Şubeler ve Merkez Ofis', lead: 'Yeni şubeleri Merkez Ofis\'ten açarsın. Bütün şubeler aynı anda çalışır; şube şeridinden canlı izlersin.', items: [
      'Yeni şubeye Usta Pazarı\'ndan bir usta, Eleman Bürosu\'ndan kasiyer ve komi/garson al. Ustasız şube kepenk açamaz.',
      '<b>Müdürlü şube:</b> Müdürün olan şube sabah stok seviyesini dünkü satışa, fiyatları haftada bir piyasaya göre kendisi ayarlar. İstersen şube kartından kapatabilirsin.',
      '<b>Merkezi mutfak:</b> Üç şubeden sonra açılır, bütün şubelerde malzeme maliyetini %12 düşürür ve yaklaşık iki ayda kendini öder.',
      'Üç ve daha fazla şubede gün sonu, uzun günlük yerine şube şube bir özet tablo olur; her hafta sonunda haftalık rapor gelir.'
    ] },
    { id: 'sampiyon', ic: 'crown', t: 'Semt şampiyonluğu', lead: 'Her ay sonunda, ayın memnuniyet ortalaması "Lüks Kebap"ın o semtteki çıtasını geçen şube semt şampiyonu olur.', items: [
      'Şampiyon şube bir ay boyunca %6 daha fazla müşteri çeker; itibar da artar.',
      'Rakip güçlendikçe çıta yükselir; rakibin yerleştiği semtte çıta ayrıca 4 puan yüksektir.',
      'Ay içinde en az 250 müşteriye hizmet etmek gerekir.'
    ] },
    { id: 'rakip', ic: 'fire', t: 'Rakip: Cüneyt Bey ve "Lüks Kebap"', lead: 'Rakip oyun boyunca altı hamle yapar: semtine şube açar, fiyat savaşı başlatır, ustanı kapmaya çalışır, tacına göz diker, karalama kampanyası yürütür ve sonunda zincirini satın almayı teklif eder.', items: [
      'Her hamlede bir seçim yaparsın; seçimin "kazandın / kaybettin" olarak sayılır ve rakibin gücünü değiştirir.',
      'Rakip gücü, semt şampiyonluğu çıtasını yükseltir. Merkez Ofis\'teki rakip panelinde karneni ve sıradaki hamleyi görürsün.',
      'Gazete, rakip hamlesinden sonraki hafta olayı manşete taşır.'
    ] },
    { id: 'mudavim', ic: 'heart', t: 'Müdavimler ve hikâyeleri', lead: 'Altı müdavim dükkânına düzenli uğrar. Sevdikleri yemeği iyi yaparsan gönülleri (kalpleri) dolar.', items: [
      '5 kalpte arkadaşlarını getirirler, 8 kalpte mahallede seni överler; gazeteye bile çıkarlar.',
      'Avukat Selin, Emekli Kemal Bey ve Öğrenci Elif\'in üçer bölümlük hikâyeleri vardır: gönül 3, 6 ve 8 kalbe ulaştıkça yeni bölüm gelir.',
      'Hikâyelerin sonu kalıcı ödüller getirir: Selin cezaları yarıya indirir, Kemal Bey denetimde yanında olur, Elif öğrencileri getirir.',
      'Mahalle Kahvesi\'nde müdavimlerini, hedeflerini, günlük arşivini ve gazeteyi görürsün.'
    ] },
    { id: 'hedefler', ic: 'star', t: 'Günlük, haftalık ve büyük hedefler', lead: 'Her gün, her hafta ve oyun boyunca tutturabileceğin hedefler vardır.', items: [
      '<b>Günün hedefleri:</b> Her sabah üç küçük hedef ve bir bonus hedef gelir. Tutturdukça ek para ve biraz itibar kazanırsın; ödül şube sayısıyla büyür.',
      '<b>Haftalık meydan okuma:</b> Şehir panelinde ilerleme çubuğuyla görünür; ödülü büyüktür.',
      '<b>Hedefler:</b> Mahalle Kahvesi\'ndeki hedefler (ikinci şube, milyonluk ay, üç taç…) ödülleriyle birlikte enflasyon ve zincirin büyüklüğüyle büyür.',
      '<b>İtibar:</b> 70\'in üstünde her gün biraz aşınır; tepede kalmak için memnuniyeti yüksek tutmak gerekir.'
    ] },
    { id: 'yatirim', ic: 'chart', t: 'Büyük yatırımlar (3. dönem)', lead: 'Kasadaki parayı büyümeye çevirmenin yolları Merkez Ofis\'tedir.', items: [
      '<b>İmza tarif:</b> Bir ürünü zincirin imzası yaparsın (3 seviye, her biri 10 gün sürer). Her seviye bütün şubelerde müşteriyi %8 artırır ve müşterilerin fiyata toleransını %4 yükseltir.',
      '<b>Amiral dükkân:</b> Bir şubeyi şehrin simgesi yaparsın: +4 masa, +1 ocak yeri ve daha uzun kuyrukla kapasitesi büyür, müşteriler orada %10 daha yüksek fiyata katlanır. O şubede müşteri %15, diğer şubelerde %5 artar; semt tacı çıtası 3 puan düşer.',
      '<b>Toplu siparişler:</b> Her hafta stadyum, düğün, festival gibi üç teklif gelir; haftada biri kabul edilir. Gün sonunda teslim edilir, iyi para getirir ama ekibin morali düşer.',
      '<b>Besi çiftliği:</b> Kendi etini yetiştirirsin; çiftlik eti haldekinden yaklaşık %25 ucuzdur. Ağılları büyüttükçe daha çok şubeyi besler.'
    ] },
    { id: 'para', ic: 'coin', t: 'Para, banka ve muhasebe', lead: 'Ay sonunda kira, bordro, vergiler ve faturalar ödenir; Muhasebe ekranında her kalemi görürsün.', items: [
      'Bordro gerçekçi hesaplanır: SGK, gelir vergisi, damga vergisi ve işveren payları ayrı ayrı gösterilir. Maaşlar gecikirse SGK teşviki kaybolur.',
      '<b>Banka:</b> Nakit sıkışırsa esnaf kredisi alabilirsin (aylık %3,4 faiz). Krediyi erken kapatırsan indirim yapılır.',
      'Çalışanlar zaman zaman zam ister; bir kişiye en fazla 60 günde bir zam yapılabilir ve her rolün bir maaş tavanı vardır.',
      'Reklam Ajansı\'nda kampanyalar müşteri getirir; ama dükkânın doluysa önce kapasiteyi büyüt. Her kampanya kartı, dünkü rakamlarına göre tahmini kârı ya da zararı gösterir.',
      '<b>Tadım menüsü (kebap):</b> Müşteri sayısını değil hesap ortalamasını artırır; dükkânın dolu olduğu günlerde de kazandırır.'
    ] },
    { id: 'son', ic: 'crown', t: 'İmparatorluk ve yeni nesil', lead: 'Son hedef: "Lüks Kebap" zincirini satın alıp şehrin tek kebap imparatoru olmak.', items: [
      'Şartlar: 4. dönem, yedi semtin hepsinde şube, üç semt tacı, itibar 80 ve satın alma bedeli (enflasyonla artar).',
      'Satın alınca rakip oyundan çıkar, müşterileri sana gelir; oyun "Kebap İmparatoru" unvanıyla sürer.',
      '<b>Yeni nesil:</b> Final ekranından torununla yeni bir mahallede sıfırdan başlayabilirsin. En iyi ustanın uzmanlıkları ve aile tarifin miras kalır; rakip daha güçlü başlar.',
      'Biten imparatorluklar ana menüdeki şeref kürsüsüne yazılır.'
    ] },
    { id: 'ipucu', ic: 'bolt', t: 'İpuçları', lead: 'Deneyimli patronlardan kısa notlar:', items: [
      'İlk alımın temizlik görevlisi olsun; ucuzdur ve memnuniyeti hemen yükseltir.',
      'Kapanış raporunu oku: en çok müşteriyi nerede kaybettiğini ve ne yapacağını söyler.',
      'Fiyatlarını ayda bir kontrol et ya da şubelere müdür al; enflasyon sessizce kâr payını yer.',
      'Reklam vermeden önce kapasite oranına bak; %12\'nin üstündeyse önce ekibi ya da salonu büyüt.',
      'Çırakları iyi bir ustanın yanına mentor olarak ver; ustalar hem ucuzlar hem sadık olur.',
      'Rakibin hamlelerine karşı müdavimlerini sıcak tut: sadık müdavimler taç savaşında seni korur.'
    ] }
  ];
  SCREENS.guide = () => {
    const back = KE.G && UI.guideFrom ? UI.guideFrom : 'title';
    return `<main class="screen guide">
      <div class="pagehead"><button class="btn sm ghost" data-a="go" data-s="${back}">${IC('arrow')}${back === 'title' ? 'Ana menü' : 'Geri'}</button><div class="ph-t"><span class="kicker">Oyun kılavuzu</span><h1>Kebab Empire nasıl oynanır?</h1><p>Dükkânını yönetmek için bilmen gereken her şey, konu konu.</p></div></div>
      <nav class="guide-toc" aria-label="Konular">${GUIDE.map((s) => `<a href="#g-${s.id}" class="chip">${s.t}</a>`).join('')}</nav>
      <div class="guide-list">${GUIDE.map((s) => `<section class="panel guide-sec" id="g-${s.id}"><div class="gs-h"><span class="gs-ic">${IC(s.ic)}</span><h2>${s.t}</h2></div><p class="lead">${s.lead}</p><ul class="gs-items">${s.items.map((x) => `<li>${x}</li>`).join('')}</ul></section>`).join('')}</div>
      <div class="row center"><button class="btn big green" data-a="go" data-s="${back}">${IC('check')}Anladım</button></div></main>`;
  };
  A.guide = () => { UI.guideFrom = KE.G && UI.screen !== 'title' ? UI.screen : null; document.querySelectorAll('.modal-bg').forEach((m) => m.remove()); UI.go('guide'); };

  Object.assign(H, { statl, masterCard });
})();
