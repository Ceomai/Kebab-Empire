/* Kebab Empire — arayüz: çekirdek: durum, kayıt, rehber, bildirim, modal, yönlendirme, üst çubuk, ortak parçalar, grafikler.
   Diğer arayüz dosyaları paylaşılan parçalara KE.UI.H üzerinden erişir. */
(function () {
  /** @type {any} */
  const UI = KE.UI = {};
  /** @type {any} */
  const H = UI.H = {};
  /** @type {any} */
  const SCREENS = UI.SCREENS = {}, A = UI.A = {}, C = UI.C = {};
  UI.screen = 'title'; UI.params = {};
  const app = () => document.getElementById('app');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = KE.clamp;
  const IC = (n, c) => KE.ART.icon(n, c);
  UI.ng = {};
  const MODE = () => KE.MODES[KE.G ? KE.G.mode : UI.ng.mode];
  const B = () => KE.G.branches.find((b) => b.id === KE.G.activeBranch);
  const prod = (pid) => MODE().products.find((p) => p.id === pid) || (MODE().drink.id === pid ? MODE().drink : null);
  const pn = (pid) => (prod(pid) || { name: pid }).name;
  const stars = (n) => { n = Math.round(n || 0); let s = '<span class="stars" aria-label="' + n + ' yıldız">'; for (let i = 1; i <= 5; i++) s += `<i class="${i <= n ? 'on' : ''}">★</i>`; return s + '</span>'; };
  const roleName = (s) => KE.roleName(KE.G, s);
  const bar = (v, cls) => `<span class="gauge ${cls || ''}"><i style="width:${clamp(v, 0, 100)}%"></i></span>`;
  const moodCls = (v) => v < 35 ? 'crit' : v < 60 ? 'warn' : 'ok';
  const CL = () => (KE.CLOUD && KE.CLOUD.enabled ? KE.CLOUD : null);
  const track = (n, p) => { if (KE.CLOUD && KE.CLOUD.track) KE.CLOUD.track(n, p); };
  const avatar = (look, mood, label, size) => `<span class="avatar ${size || ''}">${KE.portrait(look, { mood, label })}</span>`;

  /* ---------- Canlı panel güncelleme ----------
     Servis sırasında saniyede birkaç kez yenilenen paneller (şube şeridi, ekip, canlı sayılar, sahne göstergesi):
     yeni HTML öncekiyle aynıysa hiçbir şey yapılmaz; farklıysa var olan düğümler korunur, yalnızca değişen yazı ve
     öznitelikler yazılır (vitrin / portre SVG'leri her seferinde yeniden kurulmaz, stil hesabı değişen düğümle sınırlı). */
  const patchTpl = document.createElement('template');
  /* çeviri katmanının eklediği data-tr-* (asıl metin) öznitelikleri korunur; çevrilmiş öznitelik/metin, asıl metni
     değişmediyse yeniden yazılmaz */
  const syncAttrs = (a, b) => {
    for (let i = a.attributes.length - 1; i >= 0; i--) { const n = a.attributes[i].name; if (!b.hasAttribute(n) && n.lastIndexOf('data-tr-', 0) !== 0) a.removeAttribute(n); }
    for (let i = 0; i < b.attributes.length; i++) { const at = b.attributes[i]; if (a.getAttribute(at.name) !== at.value && a.getAttribute('data-tr-' + at.name) !== at.value) a.setAttribute(at.name, at.value); }
  };
  const srcOf = (n) => (KE.I18N && KE.I18N.srcOf ? KE.I18N.srcOf(n) : null);
  const morph = (a, b) => {
    let an = a.firstChild, bn = b.firstChild;
    while (bn) {
      const bnext = bn.nextSibling;
      if (!an) a.appendChild(bn);
      else if (an.nodeType !== bn.nodeType || an.nodeName !== bn.nodeName) { const anext = an.nextSibling; a.replaceChild(bn, an); an = anext; }
      else {
        /* aynı alt ağaç (ör. değişmeyen portre SVG'si): tarayıcının kendi karşılaştırmasıyla atla */
        if (an.nodeType === 1) { if (!an.isEqualNode(bn)) { syncAttrs(an, bn); morph(an, bn); } } else if (an.nodeValue !== bn.nodeValue && srcOf(an) !== bn.nodeValue) an.nodeValue = bn.nodeValue;
        an = an.nextSibling;
      }
      bn = bnext;
    }
    while (an) { const nx = an.nextSibling; a.removeChild(an); an = nx; }
  };
  UI.patch = function (el, html) {
    if (!el) return;
    const E = /** @type {any} */ (el);
    if (E._ph === html) return;
    E._ph = html;
    if (!el.firstChild) { el.innerHTML = html; return; }
    patchTpl.innerHTML = html;
    morph(el, patchTpl.content);
  };

  /* ---------- Kayıt (ayrıntılar save.js'te) ---------- */
  /* Uygulama mı (Android/iOS), tarayıcı mı */
  UI.isNative = () => { try { const C = /** @type {any} */ (window).Capacitor; return !!(C && C.isNativePlatform && C.isNativePlatform()); } catch (e) { return false; } };

  /* ---------- Hareket ve dokunsal geri bildirim ---------- */
  /* Hareketi azalt: oyun içi ayar ya da sistem tercihi (prefers-reduced-motion). İkisi de body.calm'ı açar (UI.applyA11y). */
  const RM = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  UI.reduceMotionMQ = RM;
  UI.calm = () => !!((UI.a11y && UI.a11y.calm) || (RM && RM.matches));
  /* SVG içi SMIL hareketleri (haritadaki araba, vapur, martı; ocak alevi) CSS kurallarıyla durmaz: SVG'nin kendi saati
     duraklatılır. extra: hareketi azalt dışında da durdur (ör. harita bir süredir boşta). */
  UI.syncSvgMotion = function (root, extra) {
    const stop = UI.calm() || !!extra;
    const seen = new Set();
    (root || document).querySelectorAll('animateMotion, animate, animateTransform').forEach((a) => {
      let sv = /** @type {any} */ (a).ownerSVGElement;
      while (sv && sv.ownerSVGElement) sv = sv.ownerSVGElement;
      if (!sv || seen.has(sv) || !sv.pauseAnimations) return;
      seen.add(sv);
      if (stop) { if (!sv.animationsPaused()) sv.pauseAnimations(); } else if (sv.animationsPaused()) sv.unpauseAnimations();
    });
  };
  /* Ekran değişimi: View Transitions API varsa kısa çapraz geçiş (yalnızca kullanıcının açtığı ekran / sekme değişimi;
     servis sırasındaki dakika güncellemeleri buradan geçmez), yoksa ana içerik 150 ms'de belirir. Hareketi azaltta yok. */
  UI.transition = function (fn) {
    const doc = /** @type {any} */ (document);
    if (UI.calm()) { fn(); return; }
    if (typeof doc.startViewTransition === 'function' && !document.querySelector('.modal-bg')) {
      try { doc.startViewTransition(fn); return; } catch (e) { /* aşağıda düz çizim */ }
    }
    fn();
    const main = app() && /** @type {HTMLElement} */ (app().querySelector(':scope > main, :scope > section, :scope > div:not(.topbar)'));
    if (main && main.animate) main.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 150, easing: 'cubic-bezier(.2, .8, .2, 1)' });
  };
  /* Dokunsal geri bildirim: KE.haptic('light' | 'medium' | 'success' | 'warning' | 'error').
     Uygulamada @capacitor/haptics (src/main.js yalnızca uygulamada yükler, UI.nativeHaptics), tarayıcıda navigator.vibrate.
     Menü → Görünüm → Titreşim ile kapatılır; art arda gelen çağrılar 90 ms içinde birleşir. */
  const VIB = { light: 10, medium: 22, success: [14, 60, 22], warning: [30, 60, 30], error: [45, 40, 45] };
  let lastHaptic = 0;
  UI.hapticOn = () => !(UI.a11y && UI.a11y.haptic === false);
  KE.haptic = function (kind) {
    if (!UI.hapticOn()) return false;
    const now = Date.now();
    if (now - lastHaptic < 90) return false;
    lastHaptic = now;
    if (UI.nativeHaptics) { try { UI.nativeHaptics(kind); } catch (e) { /* yok */ } return true; }
    const nav = /** @type {any} */ (navigator);
    /* tarayıcı titreşimi kullanıcı sayfaya dokunmadan engeller (konsola uyarı yazar): o durumda hiç çağırma */
    if (!nav.vibrate || (nav.userActivation && !nav.userActivation.hasBeenActive)) return false;
    try { nav.vibrate(VIB[kind] || VIB.light); } catch (e) { /* yok */ }
    return true;
  };
  /* Ekran her çizildiğinde kayıt hemen yazılmaz (büyük oyunda tek yazış onlarca ms): UI.saveSoon kirli işaretler,
     yazış en geç ~1 sn sonra boşta yapılır. Gün geçişi, kepenk açılışı, uygulamadan çıkış ve sayfa gizlenince
     (visibilitychange / pagehide) bekleyen kayıt hemen yazılır: UI.flushSave. Açık çağrılar (UI.save) her zaman hemen yazar. */
  let saveTimer = 0, saveIdle = 0;
  const cancelSave = () => {
    UI.saveDirty = false;
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = 0; }
    if (saveIdle && window.cancelIdleCallback) window.cancelIdleCallback(saveIdle);
    saveIdle = 0;
  };
  UI.saveSoon = function () {
    if (!KE.G || UI.staleTab || KE.G.phase === 'service') return;
    UI.saveDirty = true;
    if (saveTimer || saveIdle) return;
    saveTimer = setTimeout(() => {
      saveTimer = 0;
      if (window.requestIdleCallback) saveIdle = window.requestIdleCallback(() => { saveIdle = 0; UI.flushSave(); }, { timeout: 1000 });
      else UI.flushSave();
    }, 1000);
  };
  UI.flushSave = function () { if (UI.saveDirty) UI.save(); };
  UI.save = function () {
    cancelSave();
    /* servis sırasında kayıt yok: kayıt sabah durumunu ve gün sonunu tutar; yarım gün kaydedilirse stok kaybolur */
    if (!KE.G || UI.staleTab || KE.G.phase === 'service') return;
    const ok = KE.SAVE.write(KE.G);
    if (!ok && KE.SAVE.lastError === 'stale' && !UI.staleTab) { UI.staleTab = true; UI.modal(`<div class="mhead"><h2>Oyun başka bir sekmede ilerledi</h2><p>Bu oyunun daha ileri bir günü kayıtlı. İlerlemen kaybolmasın diye bu sekme kayıt yapmıyor.</p></div><div class="acts"><button class="btn green" data-a="reloadTab">Güncel kaydı aç</button></div>`); return; }
    if (!ok && KE.SAVE.lastError === 'quota' && !UI.quotaWarned) { UI.quotaWarned = true; UI.toast('Tarayıcı depolaması dolu; oyun kaydedilemedi. Menüden dosyaya yedekle.', 'bad'); }
  };
  /* Aynı oyun iki sekmede açıksa: başka sekme kaydı ilerletince bu sekme yazmayı bırakır ve uyarır
     (yoksa geride kalan sekme ilerlemeyi ezer) */
  window.addEventListener('storage', (e) => {
    if (e.key !== KE.SAVE.KEY || !e.newValue || !KE.G || KE.G.race || UI.staleTab) return;
    let env = null; try { env = JSON.parse(e.newValue); } catch (x) { return; }
    if (!env || env.tab === KE.SAVE.TAB) return;
    const other = env.game || {};
    /* yalnızca aynı oyun başka sekmede daha ileri bir güne taşındıysa bu sekme geride kalmıştır */
    if (other.saveId !== KE.G.saveId || !(other.day > KE.G.day)) return;
    UI.staleTab = true;
    UI.modal(`<div class="mhead"><h2>Oyun başka bir sekmede ilerledi</h2><p>Bu oyunu aynı anda başka bir sekmede ya da pencerede de oynuyorsun. İlerlemen kaybolmasın diye bu sekme artık kayıt yapmıyor.</p></div><div class="acts"><button class="btn green" data-a="reloadTab">Güncel kaydı aç</button></div>`);
  });
  UI.A.reloadTab = () => { try { location.reload(); } catch (x) { /* yok */ } };
  UI.load = function () {
    const r = KE.SAVE.read();
    if (!r) return null;
    if (r.warning) setTimeout(() => UI.toast(r.warning, 'bad'), 400);
    return r.game;
  };
  UI.hasSave = () => KE.SAVE.exists();

  /* ---------- İlk gün rehberi ---------- */
  /* sel: öncelik sırasıyla seçiciler; görünen ilki işaretlenir (telefonda gizli olanın yerine görünen eşdeğeri) */
  const TUT = [
    { phase: 'morning', screen: 'map', sel: ['.cp-goal'], text: 'Burası şehir haritası, ana menün. Günün hedefi ve sayıları bu kartta.' },
    { phase: 'morning', screen: 'map', sel: ['.cp-tasks'], text: 'Yapılacaklar saate göre dizilir. Bir işe dokununca haritada dükkânından oraya rota çizilir; tıklayınca oraya gidersin.' },
    { phase: 'morning', screen: 'map', sel: ['.cp-places', '.tabbar [data-a="places"]'], text: 'Hal, usta pazarı, banka… Şehirdeki bütün yerler burada. Numaralı olanlarda seni bekleyen iş var; kilitli olanlar ileriki dönemlerde açılır.' },
    { phase: 'morning', screen: 'map', sel: ['.citypanel .btn.big', '.cp-go', '.tabbar [data-s="shop"]'], text: 'Şimdi dükkâna geçelim.' },
    { phase: 'morning', sel: ['.daypanel'], text: 'Her gün üç küçük hedefin ve bir bonus hedefin olur. Tutturdukça ek para ve itibar gelir.' },
    { phase: 'morning', sel: ['.crewlist', '.crewboard'], text: 'Ekibin burada. Usta yalnızca pişirir; kasiyer sipariş alır, komi yemeği masaya götürür. Görevi bu düğmelerle değiştirirsin.' },
    { phase: 'morning', sel: ['.dishgrid'], text: 'Fiyatları buradan ayarla. Piyasanın çok üstü öğrenciyi ve işçiyi kaçırır.' },
    { phase: 'morning', sel: ['.checklist'], text: 'Malzeme Hal\'den gelir: Rıza her sabah bugünün tahminine göre getirir. Açılış kontrolü stok akşama yetmeyecekse uyarır; o zaman siparişi "Bol"a çevir ya da Hal\'den ek al. Fazla stok fireye gider.' },
    { phase: 'morning', sel: ['[data-a="openShop"]'], text: 'Hazırsan kepengi aç. Bütün şubeler aynı anda çalışır.' },
    { phase: 'service', sel: ['.stagewrap'], text: 'Müşteri kapıdan girer, kasada öder, usta pişirir, komi masaya götürür. Yemek bitince bahşiş kavanoza düşer.' },
    { phase: 'service', sel: ['.st-hud'], text: 'Yoğunluk göstergesi. Kırmızıya dönen yere bir kişi daha ver: kuyruk uzarsa kasaya, tabak beklerse servise.' },
    { phase: 'service', sel: ['#crew'], text: 'Yorulan çalışanı sakin saatte molaya gönder, yoğun saatte geri çağır. İstersen otomatik yönetimi açık bırak.' },
    { phase: 'service', sel: ['#tezgahBtn'], text: 'İstersen tezgâha geçip siparişleri kendin hazırlarsın: parlayan istasyona dokun, ateştekini pişince al. Hatasız ve hızlı olursan kombo yapar, kaliteyi artırırsın.' },
    { phase: 'service', sel: ['.speed'], text: 'Hızı buradan ayarla. Gün bitince bahşişi nasıl dağıtacağını seçip günlüğünü okuyacaksın. Kolay gelsin!' }
  ];
  UI.TUT = TUT;
  const PHASES = ['morning', 'service', 'closing'];
  const visible = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  /* Rehber kilitlenmesin: oyun daha ileri bir aşamaya geçtiyse (sabah → servis) o aşamanın ilk adımına,
     aynı aşamada başka ekrandaysa o ekranın sıradaki adımına atlanır */
  function tutSync() {
    const G = KE.G, st = TUT[G.tut];
    if (!st) return;
    const pi = PHASES.indexOf(G.phase), si = PHASES.indexOf(st.phase);
    if (pi > si) { const j = TUT.findIndex((x, i) => i > G.tut && x.phase === G.phase); if (j >= 0) G.tut = j; return; }
    if (pi === si && UI.screen !== (st.screen || 'shop')) { const j = TUT.findIndex((x, i) => i > G.tut && x.phase === G.phase && (x.screen || 'shop') === UI.screen); if (j >= 0) G.tut = j; }
  }
  let tutEl = null, tutRaf = 0;
  UI.tutor = function () {
    document.querySelectorAll('.tut').forEach((x) => x.remove());
    document.querySelectorAll('.tut-hl').forEach((x) => x.classList.remove('tut-hl'));
    tutEl = null;
    if (!KE.G || KE.G.tut == null || KE.G.tut >= TUT.length || document.querySelector('.modal-bg')) return;
    tutSync();
    const st = TUT[KE.G.tut];
    if (!st || st.phase !== KE.G.phase || UI.screen !== (st.screen || 'shop')) return;
    /* telefonda harita çekmecesi kapalıysa hedef görünsün diye açılır */
    if (st.screen === 'map' && UI.screen === 'map' && document.querySelector('.mapscreen2.sheet-min') && st.sel[0] !== '.citypanel .btn.big' && UI.A.sheetToggle) { UI.A.sheetToggle(); setTimeout(UI.tutor, 320); return; }
    const el = st.sel.map((q) => document.querySelector(q)).find(visible) || null;
    if (!el) return;
    tutEl = el;
    el.classList.add('tut-hl');
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const box = document.createElement('div');
    box.className = 'tut';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-live', 'polite');
    box.innerHTML = `<div class="tut-in"><span class="kicker">İlk gün · ${KE.G.tut + 1}/${TUT.length}</span><p>${st.text}</p><div class="row end"><button class="btn xs ghost" data-a="tutSkip">Rehberi geç</button><button class="btn sm green" data-a="tutNext">${KE.G.tut === TUT.length - 1 ? 'Başlayalım' : 'Anladım'}</button></div></div>`;
    document.body.appendChild(box);
    tutPlace(); setTimeout(tutPlace, 400);
  };
  /* kutu her zaman ekranın içinde: hedefin altına, sığmazsa üstüne, o da olmazsa ekranın altına sabitlenir */
  function tutPlace() {
    const box = /** @type {HTMLElement} */ (document.querySelector('.tut'));
    if (!box || !tutEl || !tutEl.isConnected) return;
    const z = (UI.a11y && UI.a11y.zoom) || 1;
    const vw = window.innerWidth / z, vh = window.innerHeight / z;
    const r0 = tutEl.getBoundingClientRect();
    const r = { top: r0.top / z, bottom: r0.bottom / z, left: r0.left / z, width: r0.width / z };
    const tabH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tabh')) || 0;
    const bottomLimit = vh - 10 - tabH / z;
    const bw = Math.min(340, vw - 32);
    box.style.width = bw + 'px';
    const bh = box.offsetHeight;
    let top = r.bottom + 12;
    if (top + bh > bottomLimit) top = r.top - bh - 12;
    if (top < 10) top = bottomLimit - bh;
    top = Math.max(10, Math.min(bottomLimit - bh, top));
    box.style.top = top + 'px';
    box.style.left = Math.max(16, Math.min(vw - bw - 16, r.left + r.width / 2 - bw / 2)) + 'px';
  }
  const tutReplace = () => { if (tutRaf || !tutEl) return; tutRaf = requestAnimationFrame(() => { tutRaf = 0; tutPlace(); }); };
  window.addEventListener('scroll', tutReplace, { passive: true, capture: true });
  window.addEventListener('scrollend', tutReplace, { passive: true, capture: true });
  /* işaretli öğeye dokunmak da adımı ilerletir */
  document.addEventListener('click', (e) => {
    const t = /** @type {any} */ (e.target);
    if (!tutEl || !KE.G || KE.G.tut == null || KE.G.tut >= TUT.length || !t || !t.closest) return;
    if (t.closest('.tut') || !tutEl.contains(t)) return;
    const was = KE.G.tut;
    setTimeout(() => { if (KE.G && KE.G.tut === was) { KE.G.tut++; UI.tutor(); } }, 0);
  }, true);
  window.addEventListener('resize', () => { if (document.querySelector('.tut')) UI.tutor(); });

  /* ---------- Bildirim ---------- */
  UI.toast = function (msg, kind) {
    const box = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.innerHTML = (kind === 'gold' ? IC('star') : kind === 'bad' ? IC('bolt') : IC('check')) + `<span>${esc(msg)}</span>`;
    box.appendChild(t);
    if (kind === 'gold') { KE.haptic('success'); if (UI.confetti) UI.confetti(); KE.SND.play('goal'); }
    setTimeout(() => t.classList.add('out'), 3400);
    setTimeout(() => t.remove(), 3800);
  };

  /* ---------- Modal ---------- */
  let modalQueue = [], modalSeq = 0;
  /* Pencere türleri:
     - kapatılabilir (varsayılan, içinde "kapat/vazgeç/tamam" düğmesi varsa): sağ üstte 44 px X, arka plana dokunma
       ve Escape kapatır (hepsi pencerenin kendi kapatma düğmesine basar);
     - onay (opts.confirm: yıkıcı işlem): X yok, arka plan kapatmaz; Escape / geri tuşu yalnızca "Vazgeç"e basar;
     - zorunlu seçim (kapatma düğmesi olmayan: olay kartı, kapanış raporu): X yok, kapanmaz.
     Açıkken arka plan inert, Tab pencere içinde döner, kapanınca odak açan düğmeye döner. */
  const DISMISS = '[data-a="closeModal"], [data-a="closeModalRender"], .sheet-x';
  const topModal = () => { const m = document.querySelectorAll('.modal-bg'); return m.length ? /** @type {HTMLElement} */ (m[m.length - 1]) : null; };
  const syncInert = () => {
    const all = [...document.querySelectorAll('.modal-bg')], top = all[all.length - 1];
    const set = (el, on) => { if (el) { if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); } };
    set(app(), !!top); set(document.getElementById('undochip'), !!top);
    document.querySelectorAll('.tut').forEach((t) => set(t, !!top));
    all.forEach((m) => set(m, m !== top));
  };
  UI.modal = function (html, opts) {
    opts = opts || {};
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const id = 'mh' + (++modalSeq);
    bg.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''} ${opts.cls || ''}" role="dialog" aria-modal="true">${html}</div>`;
    const m = /** @type {HTMLElement} */ (bg.firstElementChild);
    const h = m.querySelector('h2, h1');
    if (h) { if (!h.id) h.id = id; m.setAttribute('aria-labelledby', h.id); }
    const dismiss = m.querySelector(DISMISS);
    const kind = opts.confirm ? 'confirm' : (opts.closable != null ? opts.closable : !!dismiss) ? 'close' : 'forced';
    bg.dataset.kind = kind;
    if (kind === 'close' && !m.querySelector('.sheet-x')) m.insertAdjacentHTML('afterbegin', `<button class="mx" data-a="modalX" aria-label="Kapat">${IC('x')}</button>`);
    /** @type {any} */ (bg)._opener = document.activeElement;
    document.body.appendChild(bg);
    syncInert();
    const f = m.querySelector('.acts .btn, button:not(.mx):not(.sheet-x), input') || m.querySelector('button');
    if (f) /** @type {HTMLElement} */ (f).focus({ preventScroll: true });
    UI.tutor();
    return bg;
  };
  /* Kullanıcı kapatmak istedi (X, Escape, arka plan, geri tuşu): pencerenin kendi kapatma eylemi çalışır.
     Zorunlu pencere kapanmaz; onay penceresinde yalnızca "Vazgeç". Kapandıysa true döner. */
  UI.dismissModal = function (how) {
    const bg = topModal();
    if (!bg) return false;
    const kind = bg.dataset.kind;
    if (kind === 'forced' || (kind === 'confirm' && how === 'backdrop')) return false;
    const d = /** @type {HTMLElement} */ (bg.querySelector('.modal ' + DISMISS.split(', ').join(', .modal ')));
    if (d) d.click(); else UI.closeModal();
    return true;
  };
  UI.A.modalX = () => UI.dismissModal('x');
  /* pencere hangi yoldan kaldırılırsa kaldırılsın (doğrudan .remove() dahil) arka planın inert durumu güncellenir */
  new MutationObserver(syncInert).observe(document.body, { childList: true });
  /* Kapanış hareketi: pencere hemen "kapalı" sayılır (sınıfı .modal-out olur: inert, tıklanmaz, sorgulara girmez),
     160 ms'de solup küçülür (telefon alt sayfası aşağı kayar), sonra DOM'dan çıkar. Arada açılan yeni pencere
     ve odak dönüşü bundan etkilenmez; aynı pencere iki kez kapatılamaz. */
  const SHEET_MQ = typeof matchMedia === 'function' ? matchMedia('(max-width: 760px), (max-height: 520px)') : null;
  function leaveModal(bg) {
    bg.classList.replace('modal-bg', 'modal-out');
    bg.setAttribute('inert', ''); bg.setAttribute('aria-hidden', 'true');
    const md = /** @type {HTMLElement} */ (bg.firstElementChild);
    if (UI.calm() || !md || typeof md.animate !== 'function') { bg.remove(); return; }
    const sheet = md.classList.contains('sheet') && SHEET_MQ && SHEET_MQ.matches;
    const opt = { duration: 160, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: /** @type {FillMode} */ ('forwards') };
    bg.animate([{ opacity: 1 }, { opacity: 0 }], opt);
    const a = md.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: sheet ? 'translateY(40px)' : 'translateY(6px) scale(.96)' }], opt);
    let gone = false;
    const done = () => { if (!gone) { gone = true; bg.remove(); } };
    a.finished.then(done, done);
    setTimeout(done, 400);
  }
  UI.closeModal = function () {
    const m = document.querySelectorAll('.modal-bg');
    let opener = null;
    if (m.length) { opener = /** @type {any} */ (m[m.length - 1])._opener; leaveModal(m[m.length - 1]); }
    syncInert();
    if (!document.querySelector('.modal-bg')) {
      if (modalQueue.length) modalQueue.shift()();
      else if (UI.holdEvent) { UI.holdEvent = false; if (KE.G && KE.G.pendingEvent && KE.G.phase === 'morning') H.showEvent(); }
      if (!document.querySelector('.modal-bg')) setTimeout(UI.tutor, 80);
    }
    if (!document.querySelector('.modal-bg') || opener && opener.closest && topModal() && topModal().contains(opener)) {
      if (opener && opener.isConnected && opener.focus) { try { opener.focus({ preventScroll: true }); } catch (x) { /* yok */ } }
    }
  };
  /* arka plana dokunma: yalnızca kapatılabilir pencere */
  document.addEventListener('click', (e) => {
    const t = /** @type {any} */ (e.target);
    if (t && t.classList && t.classList.contains('modal-bg') && t === topModal() && t.dataset.kind === 'close') UI.dismissModal('backdrop');
  });
  /* Tab pencerenin içinde döner; Escape kapatılabilir pencereyi kapatır, onayda "Vazgeç" */
  document.addEventListener('keydown', (e) => {
    const bg = topModal();
    if (!bg) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); UI.dismissModal('esc'); return; }
    if (e.key !== 'Tab') return;
    const f = [...bg.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => !(/** @type {any} */ (x).disabled) && /** @type {HTMLElement} */ (x).offsetParent !== null);
    if (!f.length) { e.preventDefault(); return; }
    const first = /** @type {HTMLElement} */ (f[0]), last = /** @type {HTMLElement} */ (f[f.length - 1]);
    if (!bg.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, true);
  const queueModal = (fn) => { if (document.querySelector('.modal-bg')) modalQueue.push(fn); else fn(); };

  /* Seçici: select yerine kartlı seçim penceresi */
  H.pickCb = null;
  UI.picker = function (title, sub, options, cb) {
    H.pickCb = cb;
    UI.pickOptions = options;
    UI.modal(`<div class="mhead"><h2>${esc(title)}</h2>${sub ? `<p class="muted">${esc(sub)}</p>` : ''}</div>
      <div class="pickgrid">${options.map((o, i) => `<button class="pickopt ${o.sel ? 'sel' : ''}" data-a="pickOpt" data-i="${i}" ${o.disabled ? 'disabled' : ''}>${o.art || ''}<span class="po-t"><b>${esc(o.label)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</span>${o.sel ? `<span class="po-sel">${IC('check')}</span>` : ''}</button>`).join('')}</div>
      <div class="acts"><button class="btn ghost" data-a="closeModal">Vazgeç</button></div>`);
  };

  /* ---------- Yönlendirme ---------- */
  /* Telefonun geri tuşu / geri kaydırma: ekranlar tarayıcı geçmişine yazılır. Geri gelince önce açık
     pencere kapanır, sonra bir önceki ekrana dönülür; oyun sayfadan çıkmaz. */
  const histOk = (() => { try { return !!(window.history && history.pushState); } catch (e) { return false; } })();
  UI.go = function (s, p, o) {
    if (KE.G && KE.placeOpen && !KE.placeOpen(KE.G, s)) {
      const pl = KE.MAP.place(s);
      UI.toast(`${pl ? pl.name : 'Bu yer'} ${KE.PLACE_ERA[s]}. dönemde açılır.`, 'bad');
      return;
    }
    const prev = UI.screen;
    UI.screen = s; UI.params = p || {}; UI.render(); window.scrollTo(0, 0);
    if (!histOk || (o && o.pop)) return;
    const st = { ke: s, p: UI.params };
    try { if (prev === s || !history.state || !history.state.ke) history.replaceState(st, ''); else history.pushState(st, ''); } catch (e) { /* yok */ }
  };
  if (histOk) window.addEventListener('popstate', (e) => {
    const st = e.state;
    const m = document.querySelector('.modal-bg');
    const keep = () => { try { history.pushState({ ke: UI.screen, p: UI.params }, ''); } catch (x) { /* yok */ } };
    if (m) { UI.dismissModal('back'); keep(); return; }
    if (!KE.G || ['title', 'newMode', 'newDistrict', 'newMaster'].includes(UI.screen)) return;
    if (st && st.ke && SCREENS[st.ke]) { UI.go(st.ke, st.p, { pop: true }); return; }
    /* haritada geri: tarayıcıda sayfada kal; uygulamada geçmişi bırak ki geri tuşu uygulamadan çıksın */
    if (UI.screen !== 'map') { UI.go('map', {}, { pop: true }); keep(); } else if (!UI.isNative()) keep();
  });
  /* Android geri tuşu (yalnızca uygulamada; src/main.js @capacitor/app ile bağlar):
     açık pencere varsa onu kapatır (kendi kapatma eylemiyle; zorunlu seçim ve onay asla kendiliğinden onaylanmaz),
     yoksa uygulama içi geçmişte bir geri gider, haritada / başlıkta çıkmak için onay sorar. */
  const SETUP_BACK = { newMode: 'title', newDistrict: 'newMode', newMaster: 'newDistrict' };
  UI.handleBack = function () {
    if (document.querySelector('.modal-bg')) { UI.dismissModal('back'); return 'modal'; }
    if (UI.screen === 'guide') { UI.go(UI.guideFrom || 'title'); return 'back'; }
    if (SETUP_BACK[UI.screen]) { UI.go(SETUP_BACK[UI.screen]); return 'back'; }
    if (KE.G && UI.screen !== 'map' && UI.screen !== 'title') {
      if (histOk && history.state && history.state.ke && history.length > 1) history.back(); else UI.go('map');
      return 'back';
    }
    UI.modal(`<div class="mhead"><h2>Oyundan çıkılsın mı?</h2><p>${KE.G && KE.G.phase === 'service' ? 'Servis sürüyor; bugünün sabahı kayıtlı, gün yarıda kalır.' : 'Oyunun kaydedilir; kaldığın yerden devam edersin.'}</p></div><div class="acts"><button class="btn ghost" data-a="closeModal">Vazgeç</button><button class="btn red" data-a="exitApp">Çık</button></div>`);
    return 'ask';
  };
  UI.A.exitApp = () => { UI.save(); UI.closeModal(); if (UI.nativeExit) UI.nativeExit(); };
  UI.render = function () {
    const fn = SCREENS[UI.screen] || SCREENS.title;
    const inGame = KE.G && !['title', 'newMode', 'newDistrict', 'newMaster'].includes(UI.screen);
    UI.mutSeq = (UI.mutSeq || 0) + 1;
    app().innerHTML = (inGame ? topbar() : '') + fn();
    if (UI.screen === 'map') UI.mapMount();
    if (UI.screen === 'subeler') UI.fillRanking();
    if (KE.G && UI.lastTracked !== UI.screen) { UI.lastTracked = UI.screen; track('screen', { s: UI.screen, day: KE.G.day }); }
    if (UI.screen === 'shop' && KE.G && KE.G.phase !== 'morning') { KE.SCENE.reset(); if (KE.G.live) UI.sceneTick(true); H.renderTezgah(); }
    if (KE.G && KE.G.phase !== 'service') UI.saveSoon();
    if (inGame) setTimeout(UI.tutor, 60);
    if (inGame && !UI.holdEvent && KE.G.pendingEvent && KE.G.phase === 'morning' && !document.querySelector('.modal-bg')) H.showEvent();
    if (UI.undoChip) UI.undoChip();
    UI.layoutVars();
    UI.syncSvgMotion(app(), UI.screen === 'map' && UI.mapIdle);
  };
  /* Telefon düzeni: üst çubuk ve alt sekme yüksekliği CSS'e aktarılır, harita ekranı tam bu kadar yer kaplar;
     servis sahnesi ekran genişliğine sığar */
  const lv = { tbh: -1, tabh: -1 };
  /* ölç ve yalnızca değiştiyse yaz (aynı değeri yazmak da stil hesabını yeniden tetikler); değişti mi döner */
  const measureBars = function () {
    const r = document.documentElement.style;
    const tb = document.querySelector('.topbar'), tab = document.querySelector('.tabbar');
    const tbh = tb ? tb.getBoundingClientRect().height : 0;
    let tabh = 0;
    if (tab && getComputedStyle(tab).display !== 'none') { const tr = tab.getBoundingClientRect(); if (tr.width > tr.height) tabh = tr.height; }
    const ch = tbh !== lv.tbh || tabh !== lv.tabh;
    if (tbh !== lv.tbh) r.setProperty('--tbh', tbh + 'px');
    if (tabh !== lv.tabh) r.setProperty('--tabh', tabh + 'px');
    lv.tbh = tbh; lv.tabh = tabh;
    return ch;
  };
  /* Her çizimden sonra zorunlu yerleşim ölçümü yerine ResizeObserver: üst çubuk / alt sekme yeniden oluşunca
     yalnızca gözlenen öğe değişir; ölçüm tarayıcının kendi yerleşiminden sonra, boyamadan önce yapılır.
     İlk çizimde (henüz değer yok) ve ResizeObserver olmayan tarayıcıda eşzamanlı ölçülür. */
  let barRO = null, barEls = [undefined, undefined];
  UI.layoutVars = function () {
    const RO = /** @type {any} */ (window).ResizeObserver;
    if (lv.tbh < 0 || !RO) { measureBars(); if (!RO) return; }
    const tb = document.querySelector('.topbar'), tab = document.querySelector('.tabbar');
    if (tb === barEls[0] && tab === barEls[1]) return;
    barEls = [tb, tab];
    if (!barRO) barRO = new RO(() => { if (measureBars() && UI.screen === 'map' && UI.mapRefresh) UI.mapRefresh(); });
    barRO.disconnect();
    if (tb) barRO.observe(tb);
    if (tab) barRO.observe(tab);
    if (!tb && !tab) measureBars();
  };
  window.addEventListener('resize', () => measureBars());
  /* Uygulama arka plana alınınca: servis dışında kaydet; serviste oyunu duraklat (telefon uygulamayı kapatabilir) */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden' || !KE.G) return;
    if (KE.G.phase !== 'service') { UI.save(); return; }
    if (KE.G.speed) { KE.G.speed = 0; UI.pausedByHide = true; }
  });
  /* sayfa kapanırken / uygulama öldürülmeden önce bekleyen kayıt yazılsın */
  window.addEventListener('pagehide', () => { if (UI.flushSave) UI.flushSave(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !UI.pausedByHide) return;
    UI.pausedByHide = false;
    if (KE.G && KE.G.phase === 'service') { UI.render(); UI.toast('Oyun duraklatıldı. Devam etmek için hızı seç.', 'good'); }
  });

  /* ---------- Üst çubuk ve şube şeridi ---------- */
  /* kısa gün adı (Cmt / Sat / Sa.): telefonda saatin yanında, tarih sütunu gizliyken */
  function shortWeekday(day) {
    try { return KE.dateOf(day).toLocaleDateString(KE.locale(), { weekday: 'short', timeZone: 'UTC' }); } catch (e) { return String(KE.weekday(day)).slice(0, 3); }
  }
  function topbar() {
    const hol = KE.holidayOf(KE.G.day);
    const phase = { morning: 'Sabah hazırlığı', service: 'Servis', closing: 'Kapanış' }[KE.G.phase];
    const rep = KE.G.reputation / 20;
    let st = '';
    for (let i = 0; i < 5; i++) st += `<i style="--f:${clamp(rep - i, 0, 1) * 100}%">★</i>`;
    const live = KE.G.live;
    const clock = KE.G.phase === 'service' && live && live[KE.G.activeBranch] ? KE.clock(Math.min(live[KE.G.activeBranch].minute, KE.MINUTES)) : KE.G.phase === 'closing' ? '23:00' : '08:30';
    const nav = [['map', 'map', 'Harita'], ['shop', 'store', 'Dükkân'], ['office', 'chart', 'Muhasebe']];
    return `<header class="topbar">
      <div class="tb-row">
        <button class="brand" data-a="go" data-s="map" aria-label="Haritaya dön">${KE.ART.logo()}<span translate="no">${(() => { const p = KE.BRAND ? KE.BRAND.nameParts : ['Kebab', 'Empire']; return esc(p[0]) + (p[1] ? `<b>${esc(p.slice(1).join(' '))}</b>` : ''); })()}</span>${KE.G.flags && KE.G.flags.empire ? `<span class="brand-crown" title="Kebap İmparatoru">${IC('crown')}</span>` : ''}</button>
        ${KE.G.race ? `<div class="tb-race" title="Haftanın yarışı">${IC('target')}<b>Yarış</b><small>${Math.min(KE.G.day, KE.RACE_DAYS)}/${KE.RACE_DAYS}. gün</small></div>` : ''}
        <div class="tb-date"><span class="tb-day">${KE.dateStr(KE.G.day)}</span><span class="tb-sub">${KE.weekday(KE.G.day)}${hol ? ' · ' + hol : ''}</span></div>
        <div class="tb-clock ${KE.G.phase}">${IC('clock')}<b id="tb-clock">${clock}</b><span>${phase}</span><small class="tb-dl"><span>${esc(shortWeekday(KE.G.day))}</span> · <span>G${KE.G.day}</span></small></div>
        <div class="tb-money ${KE.G.cash < 0 ? 'neg' : ''}">${IC('coin')}<span class="tbm"><b>${KE.tl(KE.G.cash)}</b>${KE.G.phase === 'service' ? `<small id="tb-today">Bugün +${KE.tl(todayRevenue())}</small>` : ''}</span></div>
        <div class="tb-rep" title="İtibar ${Math.round(KE.G.reputation)}/100"><span class="repstars">${st}</span><small>İtibar ${Math.round(KE.G.reputation)}</small></div>
        <nav class="tb-nav">${nav.map(([s, ic, l]) => `<button class="navbtn ${UI.screen === s ? 'on' : ''}" data-a="go" data-s="${s}" aria-label="${l}">${IC(ic)}<span>${l}</span></button>`).join('')}<button class="navbtn snd ${KE.SND.on ? 'on2' : ''}" data-a="sound" aria-label="${KE.SND.on ? 'Sesi kapat' : 'Sesi aç'}" title="${KE.SND.on ? 'Sesi kapat' : 'Sesi aç'}">${IC(KE.SND.on ? 'sound' : 'mute')}</button><button class="navbtn" data-a="menu" data-trc="nav" aria-label="Menü">${IC('menu')}</button></nav>
      </div>
      <div class="branchbar" role="tablist" aria-label="Şubeler">${branchTabs()}</div>
    </header>${tabbar()}`;
  }
  /* Telefon: alt sekme çubuğu (yatay ekranda sol şerit) */
  const PLACE_SCREENS = () => KE.MAP.PLACES.map((p) => p.id).filter((id) => id !== 'office');
  function tabbar() {
    const n = UI.cityTasks ? UI.cityTasks().length : 0;
    const inPlace = PLACE_SCREENS().includes(UI.screen);
    const t = (on, a, extra, ic, l, badge) => `<button class="tbb ${on ? 'on' : ''}" data-a="${a}" ${extra}>${IC(ic)}${badge ? `<b class="tbb-n">${badge}</b>` : ''}<span data-trc="nav">${l}</span></button>`;
    return `<nav class="tabbar" aria-label="Gezinme">
      ${t(UI.screen === 'map', 'go', 'data-s="map"', 'map', 'Harita')}
      ${t(UI.screen === 'shop', 'go', 'data-s="shop"', 'store', 'Dükkân')}
      ${t(inPlace, 'places', '', 'pin', 'Yerler', n)}
      ${t(UI.screen === 'office', 'go', 'data-s="office"', 'chart', 'Muhasebe')}
      ${t(false, 'menu', '', 'menu', 'Menü')}
    </nav>`;
  }
  function branchTabs() {
    return KE.G.branches.map((b) => branchTab(b)).join('') + (KE.placeOpen(KE.G, 'subeler') && KE.G.branches.length < KE.DISTRICTS.length ? `<button class="btab add" data-a="go" data-s="subeler">${IC('plus')}<span>Şube aç</span></button>` : '');
  }
  /* Şube sağlığı: ekip, stok, fiyat için üç küçük renkli nokta */
  function health(b) {
    const G = KE.G, st = KE.branchStaff(G, b), L = G.live && G.live[b.id];
    const ys = G.lastSummary && G.lastSummary.branches && G.lastSummary.branches[b.id] && G.lastSummary.branches[b.id].stats;
    const lost = ys && ys.arrivals > 20 ? (ys.lostWait + ys.lostFull + ys.lostFood) / ys.arrivals : 0;
    const crew = !st.some(KE.isCook) ? ['r', 'Ustasız'] : lost >= 0.12 ? ['y', 'Ekip yetişmiyor'] : ['g', 'Ekip yeterli'];
    let stock;
    if (G.phase === 'service' && L) { const so = Object.keys(L.stats.stockouts).length; stock = so ? ['r', so + ' ürün bitti'] : ['g', 'Stok yeterli']; }
    else { const sh = G.phase === 'morning' && G.today && G.today[b.id] ? KE.shortfall(G, b) : { items: [] }; stock = sh.items.length > 2 ? ['r', 'Stok eksik'] : sh.items.length ? ['y', 'Stok az eksik'] : ['g', 'Stok yeterli']; }
    const r = KE.priceRatio(G, b), tol = KE.priceTolerance(G, b);
    const price = r > tol + 0.05 ? ['r', 'Fiyat pahalı'] : r < 0.95 ? ['y', 'Fiyat piyasanın altında'] : ['g', 'Fiyat dengede'];
    return `<span class="hdots">${[['users', crew], ['cart', stock], ['coin', price]].map(([, [c, t]]) => `<i class="hd ${c}" title="${t}"></i>`).join('')}</span>`;
  }
  function branchTab(b) {
    const L = KE.G.live && KE.G.live[b.id];
    const act = b.id === KE.G.activeBranch;
    let status = 'Hazırlık', dot = 'idle';
    if (KE.G.phase === 'service' && L) { if (L.closed) { status = 'Ustası yok, kapalı'; dot = 'off'; } else if (L.done) { status = 'Kapandı'; dot = 'off'; } else { status = `${L.queue.length} sırada · ${KE.tl(L.stats.revenue)}`; dot = L.queue.length > 5 ? 'busy' : 'open'; } }
    if (KE.G.phase === 'closing') { status = 'Kepenk indi'; dot = 'off'; }
    if (KE.isManaged(KE.G, b) && KE.G.phase === 'morning') status = 'Müdür hazırlıyor';
    return `<button class="btab ${act ? 'on' : ''}" role="tab" aria-selected="${act}" data-a="viewBranch" data-id="${b.id}"><span class="btab-art">${KE.ART.storefront('', act ? '#d7263d' : '#9a8b7a', KE.G.phase === 'service')}</span><span class="btab-t"><b>${esc(b.name)}${b.championUntil && KE.G.day <= b.championUntil ? ` <span class="crownic" title="Semt şampiyonu">${IC('crown')}</span>` : ''}</b><small><i class="dot ${dot}"></i>${status}</small></span>${KE.G.branches.length > 1 ? health(b) : ''}</button>`;
  }
  function todayRevenue() { return KE.G.live ? KE.G.branches.reduce((a, b) => a + (KE.G.live[b.id] ? KE.G.live[b.id].stats.revenue : 0), 0) : 0; }
  UI.refreshBars = function () {
    const td = document.getElementById('tb-today');
    if (td) {
      const t = 'Bugün +' + KE.tl(todayRevenue());
      if (td.textContent !== t) {
        td.textContent = t;
        /* sayaç zıplaması: yeniden başlatmak için yerleşim zorlanmaz (eskiden offsetWidth), Web Animations ile */
        const tt = /** @type {any} */ (td);
        if (tt.animate && !UI.calm()) { if (tt._bump) tt._bump.cancel(); tt._bump = tt.animate([{ transform: 'none' }, { transform: 'scale(1.18)', color: '#fff', offset: 0.4 }, { transform: 'none' }], { duration: 350, easing: 'cubic-bezier(.2, .8, .2, 1)' }); }
      }
    }
    UI.patch(document.querySelector('.branchbar'), branchTabs());
    const m = document.querySelector('.tb-money b');
    if (m) m.textContent = KE.tl(KE.G.cash);
    UI.patch(document.getElementById('courierbox'), UI.courierHtml());
  };
  /* Acil kurye: servis sırasında malzeme bitmek üzereyse (günde bir kez) */
  UI.courierHtml = function () {
    const G = KE.G, b = G.branches.find((x) => x.id === G.activeBranch), L = G.live && G.live[b.id];
    if (!L || L.done || G.phase !== 'service') return '';
    if (L.courier) return `<p class="tiny muted">${IC('truck')}Acil kurye bugün kullanıldı.</p>`;
    const n = KE.courierNeed(G, b);
    if (!n.cost) return '';
    const so = Object.keys(L.stats.stockouts).length;
    return `<div class="courier ${so ? 'urgent' : ''}"><small>${so ? `${so} ürün bitti.` : 'Bazı malzemeler bitmek üzere.'} Rıza'nın çırağı motorla getirebilir (normal fiyatın 1,5 katı).</small><button class="btn sm gold block" data-a="courier" data-id="${b.id}">${IC('truck')}Acil kurye · ${KE.tl(n.cost)}</button></div>`;
  };

  function npc(key, text) {
    const c = KE.CAST[key];
    return `<div class="npc"><div class="npc-fig">${KE.figure(c.look, { mood: 'happy', label: c.name })}</div>
      <div class="bubble"><span class="who">${c.name}<em>${c.role}</em></span>${esc(text || KE.line(key))}</div></div>`;
  }
  function npcMini(k) { return `<span class="avatar sm">${KE.portrait(KE.CAST[k].look, { mood: 'happy' })}</span>`; }
  function head(title, sub, extra, who) {
    const c = who && KE.CAST[who];
    const pl = KE.MAP.place(UI.screen);
    return `<div class="pagehead ${pl ? 'placehead' : ''}" ${pl ? `style="--pc:${pl.color}"` : ''}><button class="btn sm ghost" data-a="go" data-s="map">${IC('arrow')}Harita</button>${pl ? `<span class="ph-ic">${IC(pl.icon)}</span>` : ''}<div class="ph-t">${pl ? `<span class="kicker">${pl.group}</span>` : ''}<h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${extra || ''}${c ? `<div class="ph-npc"><div class="bubble"><span class="who">${c.name}</span>${esc(KE.line(who))}</div><span class="avatar lg">${KE.portrait(c.look, { mood: 'happy', label: c.name })}</span></div>` : ''}</div>`;
  }
  /* Günlük paragrafını cümle cümle sar (çeviri katmanı cümle kalıplarını tanısın) */
  const sentences = (txt) => String(txt || '').split(/(?<=[.!?…])\s+(?=[A-ZÇĞİÖŞÜ"“0-9])/).map((x) => `<span>${esc(x)}</span>`).join(' ');
  const morningOnly = () => KE.G.phase !== 'morning' ? `<div class="note">${IC('clock')}<span>Transfer, işten çıkarma ve şube açma sabah hazırlığında yapılır.</span></div>` : '';

  /* ---------- Grafikler ---------- */
  function lineChart(series, labels, opts) {
    opts = opts || {};
    const W = 640, H = opts.h || 220, pl = 58, pr = 14, pt = 12, pb = 26;
    const all = series.flatMap((s) => s.values);
    let max = Math.max(1, ...all), min = Math.min(0, ...all);
    const mag = Math.pow(10, Math.floor(Math.log10(max - min || 1)));
    max = Math.ceil(max / mag) * mag; min = Math.floor(min / mag) * mag;
    const n = labels.length;
    const x = (i) => pl + (n <= 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (n - 1));
    const y = (v) => pt + (H - pt - pb) * (1 - (v - min) / (max - min || 1));
    let g = '';
    for (let k = 0; k <= 4; k++) {
      const v = min + (max - min) * k / 4;
      g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${KE.num(Math.abs(max) >= 1000 ? v / 1000 : v)}${Math.abs(max) >= 1000 ? ' B' : ''}</text>`;
    }
    if (min < 0) g += `<line x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}" class="zero"/>`;
    const step = Math.max(1, Math.ceil(n / 8));
    labels.forEach((l, i) => { if (i % step === 0 || i === n - 1) g += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`; });
    series.forEach((s) => {
      if (!s.values.length) return;
      const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
      if (s.area) g += `<polygon points="${x(0)},${y(Math.max(0, min))} ${pts} ${x(s.values.length - 1)},${y(Math.max(0, min))}" style="fill:${s.color}" opacity=".14"/>`;
      g += `<polyline points="${pts}" fill="none" style="stroke:${s.color}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`;
      const li = s.values.length - 1;
      g += `<circle cx="${x(li)}" cy="${y(s.values[li])}" r="4.5" style="fill:${s.color};stroke:var(--white)" stroke-width="2"/>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || 'grafik')}">${g}</svg>
      <div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`;
  }
  function barChart(values, labels, opts) {
    opts = opts || {};
    const W = 640, H = opts.h || 180, pl = 50, pr = 8, pt = 10, pb = 24;
    const max = Math.max(1, ...values);
    const n = values.length, bw = (W - pl - pr) / n;
    let g = '';
    for (let k = 0; k <= 3; k++) { const v = max * k / 3, yy = pt + (H - pt - pb) * (1 - k / 3); g += `<line x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}" class="grid"/><text x="${pl - 6}" y="${yy + 4}" text-anchor="end">${opts.money ? KE.num(v / 1000) + ' B' : KE.num(v)}</text>`; }
    const mi = values.indexOf(max);
    values.forEach((v, i) => {
      const h = (H - pt - pb) * Math.max(0, v) / max;
      g += `<rect x="${pl + i * bw + bw * 0.16}" y="${H - pb - h}" width="${bw * 0.68}" height="${h}" rx="4" style="fill:${i === mi ? 'var(--biber)' : (opts.color || 'var(--kor)')}"/>`;
      g += `<text x="${pl + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(labels[i])}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || 'grafik')}">${g}</svg>`;
  }
  function donut(parts, label) {
    const tot = parts.reduce((a, p) => a + Math.max(0, p.v), 0) || 1;
    let acc = 0, segs = '';
    const R = 54, C = 2 * Math.PI * R;
    parts.forEach((p) => { const f = Math.max(0, p.v) / tot; segs += `<circle cx="70" cy="70" r="${R}" fill="none" style="stroke:${p.c}" stroke-width="22" stroke-dasharray="${f * C} ${C}" stroke-dashoffset="${-acc * C}" transform="rotate(-90 70 70)"/>`; acc += f; });
    return `<div class="donut"><svg viewBox="0 0 140 140" role="img" aria-label="${esc(label)}">${segs}<text x="70" y="66" text-anchor="middle" class="d1">${esc(label)}</text><text x="70" y="84" text-anchor="middle" class="d2">${KE.tl(tot)}</text></svg>
      <ul>${parts.map((p) => `<li><i style="background:${p.c}"></i><span>${esc(p.l)}</span><b>${KE.pct(Math.round(Math.max(0, p.v) / tot * 100))}</b></li>`).join('')}</ul></div>`;
  }

  /* boş liste: kısa açıklama (boş alan bırakma) */
  const empty = (text, ic) => `<p class="empty">${IC(ic || 'clock')}<span>${esc(text)}</span></p>`;
  Object.assign(H, { empty, sentences, esc, clamp, IC, MODE, B, prod, pn, stars, roleName, bar, moodCls, CL, track, avatar, queueModal, npc, head, morningOnly, lineChart, barChart, donut });
})();
