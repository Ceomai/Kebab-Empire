/* Kebab Empire — marka ayarı
   Oyunun bir zincire özel sürümü için tek yer: oyun adı, logo, renkler, rakip zincirin adı, ürün adları,
   dükkân adı, kampanya kuponu ve sipariş bağlantısı. Değerler derleme sırasında brands/<id>.json dosyasından
   gelir (BRAND=<id> npm run build); tanımlı değilse varsayılan Kebab Empire kimliği kullanılır.
   Oyun ekonomisine (fiyatlar, malzeme, denge) dokunmaz: yalnızca görünüm ve metin değişir, böylece
   denge ve sunucu doğrulaması bütün markalarda aynı kalır. */
(function () {
  /** @type {any} */
  const D = {
    id: 'default', gameName: 'Kebab Empire', nameParts: ['Kebab', 'Empire'], rival: 'Lüks Kebap',
    colors: {}, logoSvg: null, logoUrl: null, shopName: null, products: {}, promo: null, orderUrl: null, orderLabel: 'Sipariş ver'
  };
  /* derleme sırasında Vite __BRAND__ sabitini koyar; testlerde ve sunucuda yoktur */
  // eslint-disable-next-line no-undef
  const injected = typeof __BRAND__ !== 'undefined' ? __BRAND__ : null;
  /** @type {any} */
  const B = KE.BRAND = Object.assign({}, D, injected || {});
  if (!Array.isArray(B.nameParts) || !B.nameParts.length) B.nameParts = [B.gameName];
  B.isDefault = B.id === 'default';

  /* ürün adları (yalnızca görünen ad; ürün kimliği, fiyat ve tarif aynı kalır) */
  if (KE.MODES) Object.values(KE.MODES).forEach((m) => m.products.forEach((p) => { if (B.products[p.id]) p.name = String(B.products[p.id]).slice(0, 28); }));

  /* ekrandaki metinlerde varsayılan adların yerine markanınkiler (i18n katmanı her metni buradan geçirir) */
  B.swaps = [];
  if (B.rival && B.rival !== D.rival) B.swaps.push([D.rival, B.rival]);
  if (B.gameName && B.gameName !== D.gameName) B.swaps.push([D.gameName, B.gameName]);
  B.swap = (s) => { if (!B.swaps.length || !s) return s; for (const [a, b] of B.swaps) if (s.indexOf(a) >= 0) s = s.split(a).join(b); return s; };

  /* şube adı: marka adı tanımlıysa "Marka Semt", değilse oyunun kendi adlandırması */
  B.branchName = (districtName, fallback) => (B.shopName ? `${B.shopName} ${districtName}` : fallback);

  /* renkler: CSS değişkenleri (style.css :root) üzerine yazılır */
  const CSS_VARS = { flame: '--kor', primary: '--biber', primaryDeep: '--biber-deep', accent: '--altin', accentDeep: '--altin-deep', wine: '--sumak', mint: '--nane', mintDeep: '--nane-deep', paper: '--kagit', ink: '--murekkep' };
  B.applyColors = () => {
    if (typeof document === 'undefined') return;
    const r = document.documentElement.style;
    Object.entries(B.colors || {}).forEach(([k, v]) => { if (CSS_VARS[k] && /^#[0-9a-f]{3,8}$/i.test(v)) r.setProperty(CSS_VARS[k], v); });
    if (!B.isDefault) document.title = B.gameName;
  };
  /* kupon: bu oyun günü için gösterilmeli mi (gün ve günlük hedeflere göre) */
  B.promoFor = (G, goalsDone, goalsTotal) => {
    const P = B.promo;
    if (!P || !P.code || !G) return null;
    if (G.day < (P.afterDay || 1)) return null;
    if (P.needGoals !== false && goalsTotal && goalsDone < goalsTotal) return null;
    return P;
  };
  B.applyColors();
})();
