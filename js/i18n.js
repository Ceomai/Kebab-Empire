/* Kebab Empire — çok dil (Türkçe asıl; İngilizce ve Almanca çeviri)
   Arayüz metinleri kod içinde Türkçe üretilir. Bu katman ekrana eklenen her metni sözlükten geçirir:
   sayılar, paralar ve bilinen adlar (yemek, malzeme, semt, ay, gün…) yer tutucuya çevrilir, kalıp
   sözlükte aranır, yer tutucular çevrilmiş hâlleriyle geri konur. Sözlükte olmayan metin Türkçe kalır.
   Böylece "12 müşteri" ile "40 müşteri" tek bir kalıptan ("{0} müşteri") çevrilir. */
(function () {
  const I = KE.I18N = /** @type {KE_I18N} */ ({ lang: 'tr', dict: {}, langs: { tr: 'Türkçe', en: 'English', de: 'Deutsch' }, collect: null });
  const LANG_KEY = 'kebab-empire-lang';
  const NUM = /[−-]?\d[\d.,]*(?:\s?[₺%])?|%\s?\d[\d.,]*/g;
  const TR = /[A-Za-zÇĞİÖŞÜçğıöşü]/;
  let entities = null; // [{ s, re }] uzun olan önce

  /* Bilinen adlar: çevrilebilen tek kelimelik ya da kısa adlar */
  function buildEntities() {
    const set = new Set();
    Object.values(KE.MODES).forEach((m) => { m.products.forEach((p) => set.add(p.name)); set.add(m.drink.name); Object.values(m.ingredients).forEach((g) => set.add(g.name)); });
    KE.DISTRICTS.forEach((d) => set.add(d.name));
    Object.values(KE.CUSTOMER_TYPES).forEach((c) => set.add(c.name));
    (KE.AYLAR || []).forEach((a) => set.add(a));
    ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'].forEach((g) => set.add(g));
    if (KE.MAP) KE.MAP.PLACES.forEach((p) => set.add(p.name));
    if (KE.G) { KE.G.staff.forEach((s) => set.add(s.name)); KE.G.branches.forEach((b) => set.add(b.name)); if (KE.G.owner) set.add(KE.G.owner); }
    if (KE.REGULARS) KE.REGULARS.forEach((r) => set.add(r.name));
    if (KE.REGIONS) Object.entries(KE.REGIONS).forEach(([k, r]) => { set.add(k); if (r.note) set.add(r.note); });
    if (KE.MASTER_TEMPLATES) Object.values(KE.MASTER_TEMPLATES).flat().forEach((t) => t.name && set.add(t.name));
    if (KE.CAST) Object.values(KE.CAST).forEach((c) => set.add(c.name));
    const list = [...set].filter((s) => s && s.length > 1).sort((a, b) => b.length - a.length);
    entities = list.map((s) => ({ s, re: new RegExp('(^|[^A-Za-zÇĞİÖŞÜçğıöşü])(' + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?=$|[^A-Za-zÇĞİÖŞÜçğıöşü])', 'g') }));
  }
  I.refreshEntities = () => { entities = null; trCache.clear(); };

  /* Metni kalıba çevir: { key, parts } — parts yer tutucuların asıl değerleri */
  let sig = '';
  const gameSig = () => (KE.G ? KE.G.saveId + ':' + KE.G.staff.map((x) => x.id).join(',') + ':' + KE.G.branches.length + ':' + KE.G.owner : '');
  /* Oyundaki adlar (ekip, şube, sahip) yalnızca bir eylemden ya da çizimden sonra değişebilir: imza her çağrıda
     değil, oyun nesnesi ya da arayüzün değişiklik sayacı (KE.UI.mutSeq) değiştiğinde yeniden hesaplanır.
     Adlar değiştiyse varlık listesi ve çeviri önbelleği sıfırlanır. */
  let sigG = null, sigSeq = -1;
  const checkSig = () => {
    const seq = KE.UI ? KE.UI.mutSeq : -2;
    /* arayüz yoksa (testler, sunucu) sayaç da yok: imza her seferinde hesaplanır */
    if (KE.UI && sigG === KE.G && sigSeq === seq && entities) return;
    sigG = KE.G; sigSeq = seq;
    const g = gameSig();
    if (!entities || g !== sig) { sig = g; buildEntities(); trCache.clear(); }
  };
  /* tr() sonuçları (dil, bağlam, metin) için önbellekte; sözlük değişince ya da sınır aşılınca boşalır */
  const trCache = new Map();
  let trCacheDict = null;
  const TR_CACHE_MAX = 4000;
  I.normalize = function (text) {
    checkSig();
    const parts = [];
    let s = text;
    const mark = (v) => { parts.push(v); return '\u0001' + String.fromCharCode(0xE000 + parts.length - 1) + '\u0002'; };
    entities.forEach(({ s: name, re }) => { if (s.indexOf(name) >= 0) s = s.replace(re, (m, pre, n) => pre + mark(n)); });
    s = s.replace(NUM, (m) => mark(m));
    // yer tutucuları görünme sırasına göre {0}, {1}… yap
    const order = [];
    const key = s.replace(/\u0001([\uE000-\uF8FF])\u0002/g, (m, c) => { order.push(parts[c.charCodeAt(0) - 0xE000]); return '{' + (order.length - 1) + '}'; });
    return { key, parts: order };
  };
  const word = (v) => (I.dict[v] != null ? I.dict[v] : v);
  /* Türkçe ekler isme göre değişir (Burak'ın / Usta'nın): sözlükte ekin kalıbıyla da ara */
  const canon = (k) => k.replace(/\}'n?[ıiuü]n(?=[^a-zçğıöşü]|$)/g, "}'İN").replace(/\}'[ny]?[ıiuü](?=[^a-zçğıöşü]|$)/g, "}'I").replace(/\}'n?[dt][ae]n(?=[^a-zçğıöşü]|$)/g, "}'DEN").replace(/\}'n?[dt][ae](ki)?(?=[^a-zçğıöşü]|$)/g, "}'DE$1").replace(/\}'[yn]?[ae](?=[^a-zçğıöşü]|$)/g, "}'E");
  let canonFor = null, canonMap = null;
  const canonDict = () => { if (canonFor !== I.dict) { canonFor = I.dict; canonMap = {}; Object.keys(I.dict).forEach((k) => { if (k.includes("}'")) canonMap[canon(k)] = I.dict[k]; }); } return canonMap; };
  /* marka ayarı: rakip zincir ve oyun adı markanınkiyle değişir (her dilde, çeviriden sonra) */
  const brandSwap = (s) => (KE.BRAND && KE.BRAND.swaps && KE.BRAND.swaps.length ? KE.BRAND.swap(s) : s);
  const branded = () => !!(KE.BRAND && KE.BRAND.swaps && KE.BRAND.swaps.length);
  /* bağlam: aynı Türkçe sözcük farklı anlamdaysa (gezinmedeki "Menü" ↔ tezgâhtaki "Menü" fişi) öğe
     data-trc="bağlam" taşır; sözlükte önce "bağlam|metin" anahtarı aranır */
  I.t = function (text, ctx) { return brandSwap(tr(text, ctx)); };
  function tr(text, ctx) {
    if (I.lang === 'tr' || !text || !TR.test(text)) return text;
    if (I.collect) return trRaw(text, ctx);
    checkSig();
    if (trCacheDict !== I.dict) { trCacheDict = I.dict; trCache.clear(); }
    const k = ctx ? ctx + '\u0000' + text : text;
    let v = trCache.get(k);
    if (v === undefined) {
      v = trRaw(text, ctx);
      if (trCache.size >= TR_CACHE_MAX) trCache.clear();
      trCache.set(k, v);
    }
    return v;
  }
  function trRaw(text, ctx) {
    const lead = text.match(/^\s*/)[0], trail = text.match(/\s*$/)[0];
    const core = text.trim();
    if (!core) return text;
    if (ctx && I.dict[ctx + '|' + core] != null) return lead + I.dict[ctx + '|' + core] + trail;
    if (I.dict[core] != null) return lead + I.dict[core] + trail;
    const { key, parts } = I.normalize(core);
    if (I.collect) I.collect(key, core);
    let tpl = I.dict[key];
    if (tpl == null && /\}'/.test(key)) tpl = canonDict()[canon(key)];
    if (tpl == null && parts.length && /^[{}\d\s.,:;·\-–—/+%₺×~()]*$/.test(key)) tpl = key; // yalnızca yer tutucu: adları çevir
    if (tpl == null) return text;
    return lead + tpl.replace(/\{(\d+)\}/g, (m, i) => (parts[+i] != null ? word(parts[+i]) : m)) + trail;
  }

  /* ---------- DOM: eklenen ve değişen metinleri çevir ---------- */
  const orig = new WeakMap();
  /* çevrilmiş bir metin düğümünün asıl (Türkçe) metni; çevrilmemişse null. Canlı panel güncellemesi (UI.patch)
     aynı kaynağı yeniden yazıp çeviriyi boşuna tetiklemesin diye */
  I.srcOf = (n) => { const o = orig.get(n); return o && o.out === n.nodeValue ? o.tr : null; };
  const ATTRS = ['placeholder', 'title', 'aria-label'];
  function doText(n) {
    const cur = n.nodeValue;
    let src = orig.get(n);
    if (src == null || (src.out !== cur)) src = { tr: cur };
    const p = n.parentNode;
    const out = I.t(src.tr, p && p.dataset ? p.dataset.trc : undefined);
    src.out = out;
    orig.set(n, src);
    if (out !== cur) n.nodeValue = out;
  }
  function doEl(el) {
    ATTRS.forEach((a) => { if (el.hasAttribute && el.hasAttribute(a)) { const k = 'data-tr-' + a; const v = el.getAttribute(a); const base = el.getAttribute(k) && I.t(el.getAttribute(k), el.dataset ? el.dataset.trc : undefined) === v ? el.getAttribute(k) : v; if (!el.hasAttribute(k)) el.setAttribute(k, base); const out = I.t(base, el.dataset ? el.dataset.trc : undefined); if (out !== v) el.setAttribute(a, out); } });
  }
  /* translate="no" (marka adı, slogan, kupon): çevrilmez, yalnızca marka adı değişimi uygulanmaz */
  const noTr = (el) => !!(el && el.closest && el.closest('[translate="no"]'));
  function walk(root) {
    if (root.nodeType === 3) { if (!/^(SCRIPT|STYLE)$/.test(root.parentNode && root.parentNode.nodeName) && !noTr(root.parentNode)) doText(root); return; }
    if (root.nodeType !== 1 || /^(SCRIPT|STYLE)$/.test(root.nodeName)) return;
    doEl(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = tw.nextNode())) { if (n.nodeType === 3) { if (!/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName) && !noTr(n.parentNode)) doText(n); } else doEl(n); }
  }
  let obs = null;
  function observe() {
    if (obs || (I.lang === 'tr' && !branded())) return;
    obs = new MutationObserver((ms) => {
      if (I.lang === 'tr' && !branded()) return;
      ms.forEach((m) => {
        if (m.type === 'characterData') { if (!noTr(m.target.parentNode)) doText(m.target); }
        else if (m.type === 'attributes') doEl(m.target);
        else m.addedNodes.forEach(walk);
      });
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  /* ---------- Dil seçimi ---------- */
  const DICTS = {};
  I.register = (lang, dict) => { DICTS[lang] = dict; };
  I.set = async function (lang) {
    if (!I.langs[lang]) lang = 'tr';
    if (lang !== 'tr' && !DICTS[lang]) {
      try { const r = await fetch(`locales/${lang}.json`); DICTS[lang] = await r.json(); } catch (e) { lang = 'tr'; }
    }
    const was = I.lang;
    I.lang = lang; I.dict = DICTS[lang] || {};
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* yok */ }
    document.documentElement.lang = lang;
    entities = null; trCache.clear();
    if (lang !== 'tr' || branded()) { observe(); walk(document.body); }
    else if (was !== 'tr' && KE.UI && KE.UI.render) KE.UI.render();
    if (was !== lang && lang !== 'tr' && KE.UI && KE.UI.render) KE.UI.render();
  };
  I.preferred = function () {
    try { const s = localStorage.getItem(LANG_KEY); if (s && I.langs[s]) return s; } catch (e) { /* yok */ }
    const n = (navigator.language || 'tr').slice(0, 2);
    return I.langs[n] ? n : 'tr';
  };
})();
