/* Marka dosyası denetimi: derlemede (vite.config.js), uygulama betiğinde (brand-apply.cjs) ve testlerde kullanılır.
   Marka metinleri sayfaya HTML olarak girdiği için burada sıkı tutulur: metinlerde < > yok, bağlantılar yalnızca https,
   logo ya da dosya yolu (public/ altında) ya da betik içermeyen bir SVG. Hata varsa açıklamalı bir liste döner. */
const fs = require('fs');
const path = require('path');

const ID_RE = /^[a-z0-9][a-z0-9-]{0,40}$/;
const APP_ID_RE = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
const HEX_RE = /^#[0-9a-f]{3,8}$/i;
const LANGS = ['tr', 'en', 'de'];

function validateBrand(B, fileId, opts = {}) {
  const errs = [];
  const root = opts.root || process.cwd();
  if (!B || typeof B !== 'object' || Array.isArray(B)) return ['Marka dosyası bir JSON nesnesi olmalı'];
  if (!ID_RE.test(String(fileId || ''))) errs.push(`Geçersiz marka kimliği "${fileId}" (yalnızca küçük harf, rakam ve tire)`);
  if (B.id !== fileId) errs.push(`"id" alanı dosya adıyla aynı olmalı: "${B.id}" ≠ "${fileId}"`);

  const plain = (v, where, max = 200) => {
    if (typeof v !== 'string') { errs.push(`${where}: metin olmalı`); return; }
    if (/[<>]/.test(v)) errs.push(`${where}: < ve > karakterleri kullanılamaz`);
    if (/[\u0000-\u001f\u007f]/.test(v)) errs.push(`${where}: kontrol karakteri içeriyor`);
    if (v.length > max) errs.push(`${where}: en fazla ${max} karakter`);
  };
  /* metin ya da dile göre { tr, en, de } */
  const text = (v, where, max) => {
    if (v == null) return;
    if (typeof v === 'object' && !Array.isArray(v)) {
      const keys = Object.keys(v);
      if (!keys.length) errs.push(`${where}: boş`);
      keys.forEach((k) => { if (!LANGS.includes(k)) errs.push(`${where}.${k}: bilinmeyen dil (tr, en, de)`); else plain(v[k], `${where}.${k}`, max); });
      return;
    }
    plain(v, where, max);
  };
  const url = (v, where) => {
    if (v == null) return;
    if (typeof v !== 'string' || !/^https:\/\/[^\s"'<>`]+$/.test(v)) errs.push(`${where}: yalnızca https:// ile başlayan bir adres`);
  };

  if (!B.gameName) errs.push('"gameName" zorunlu');
  else plain(B.gameName, 'gameName', 40);
  if (B.nameParts != null) {
    if (!Array.isArray(B.nameParts) || !B.nameParts.length || B.nameParts.length > 3) errs.push('nameParts: 1–3 parçalık liste olmalı');
    else B.nameParts.forEach((p, i) => plain(p, `nameParts[${i}]`, 24));
  }
  if (B.rival != null) { plain(B.rival, 'rival', 30); if (B.rival !== 'Lüks Kebap' && String(B.rival).includes('Lüks Kebap')) errs.push('rival: yeni ad "Lüks Kebap" içeremez'); }
  if (B.gameName && B.gameName !== 'Kebab Empire' && String(B.gameName).includes('Kebab Empire')) errs.push('gameName: yeni ad "Kebab Empire" içeremez');
  if (B.shopName != null) plain(B.shopName, 'shopName', 24);
  text(B.tagline, 'tagline', 80);
  text(B.orderLabel, 'orderLabel', 30);
  url(B.orderUrl, 'orderUrl');
  if (B.products != null) {
    if (typeof B.products !== 'object' || Array.isArray(B.products)) errs.push('products: nesne olmalı');
    else Object.entries(B.products).forEach(([k, v]) => plain(v, `products.${k}`, 28));
  }
  if (B.colors != null) Object.entries(B.colors).forEach(([k, v]) => { if (!HEX_RE.test(String(v))) errs.push(`colors.${k}: #rrggbb biçiminde olmalı`); });
  if (B.promo != null) {
    const P = B.promo;
    if (!P.code) errs.push('promo.code zorunlu');
    else { plain(P.code, 'promo.code', 24); if (!/^[A-Za-z0-9_-]+$/.test(P.code)) errs.push('promo.code: yalnızca harf, rakam, - ve _'); }
    text(P.title, 'promo.title', 60); text(P.text, 'promo.text', 240); text(P.urlLabel, 'promo.urlLabel', 30); text(P.terms, 'promo.terms', 240);
    url(P.url, 'promo.url');
    if (P.afterDay != null && !(Number.isInteger(P.afterDay) && P.afterDay >= 1)) errs.push('promo.afterDay: 1 ya da daha büyük tam sayı');
  }
  if (B.logoUrl != null) {
    const u = String(B.logoUrl);
    if (!/^[a-z0-9][a-z0-9/_.-]*\.(svg|png|webp)$/i.test(u) || u.includes('..')) errs.push('logoUrl: public/ altında bir .svg/.png/.webp dosya yolu olmalı');
    else if (!fs.existsSync(path.join(root, 'public', u))) errs.push(`logoUrl: public/${u} bulunamadı`);
  }
  if (B.logoSvg != null) {
    const s = String(B.logoSvg);
    if (!/^\s*<svg[\s>]/i.test(s)) errs.push('logoSvg: <svg ile başlamalı');
    /* oyun SVG'yi <img> olarak çizer (betik çalışmaz); yine de açıkça zararlı içerik reddedilir */
    if (!/<\/svg>\s*$/i.test(s)) errs.push('logoSvg: </svg> ile bitmeli');
    if (/<script|<foreignobject|<iframe|<object|<embed|<meta|<base|[\s/"']on[a-z]+\s*=|javascript:/i.test(s)) errs.push('logoSvg: betik, olay özniteliği ya da gömülü nesne içeremez (logoUrl ile dosya kullan)');
    if (s.length > 20000) errs.push('logoSvg: en fazla 20 KB');
  }
  if (B.app != null) {
    const A = B.app;
    if (A.id != null && !APP_ID_RE.test(String(A.id))) errs.push(`app.id: geçersiz paket kimliği "${A.id}" (örnek: com.firma.oyun)`);
    if (A.name != null) plain(A.name, 'app.name', 30);
    if (A.description != null) plain(A.description, 'app.description', 200);
    ['themeColor', 'background'].forEach((k) => { if (A[k] != null && !HEX_RE.test(String(A[k]))) errs.push(`app.${k}: #rrggbb biçiminde olmalı`); });
  }
  return errs;
}

/* dosyayı okur ve denetler; hata varsa açıklamayla fırlatır */
function loadBrand(id, opts = {}) {
  const root = opts.root || process.cwd();
  if (!ID_RE.test(String(id || ''))) throw new Error(`Geçersiz marka kimliği "${id}" (yalnızca küçük harf, rakam ve tire)`);
  const file = path.join(root, 'brands', id + '.json');
  if (!fs.existsSync(file)) throw new Error('Marka dosyası bulunamadı: brands/' + id + '.json');
  const B = JSON.parse(fs.readFileSync(file, 'utf8'));
  const errs = validateBrand(B, id, { root });
  if (errs.length) throw new Error(`brands/${id}.json geçersiz:\n  - ` + errs.join('\n  - '));
  return B;
}

module.exports = { validateBrand, loadBrand, ID_RE };
