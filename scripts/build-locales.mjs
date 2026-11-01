/* Çeviri sözlüklerini üretir: locales_src/translations.json (Türkçe kalıp → { en, de })
   ve toplanan katalogdan public/locales/en.json, de.json. Eksik çevirileri listeler. */
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'locales_src');
const T = fs.existsSync(path.join(src, 'translations.json')) ? JSON.parse(fs.readFileSync(path.join(src, 'translations.json'), 'utf8')) : {};
// eski sıra numaralı tsv dosyalarını içe al (bir kez)
const keysFile = path.join(src, 'keys.json');
if (fs.existsSync(keysFile)) {
  const keys = JSON.parse(fs.readFileSync(keysFile, 'utf8'));
  for (const f of fs.readdirSync(src).filter((f) => /^t\d+\.tsv$/.test(f))) {
    fs.readFileSync(path.join(src, f), 'utf8').split('\n').filter(Boolean).forEach((line) => {
      const [i, en, de] = line.split('\t');
      if (keys[+i] != null && en) T[keys[+i]] = { en, de: de || en };
    });
  }
}
// yeni satırlar: tr<TAB>en<TAB>de
for (const f of fs.readdirSync(src).filter((f) => /^x\d+\.tsv$/.test(f))) {
  fs.readFileSync(path.join(src, f), 'utf8').split('\n').filter(Boolean).forEach((line) => {
    const [tr, en, de] = line.split('\t');
    if (tr && en) T[tr] = { en, de: de || en };
  });
}
for (const k of Object.keys(T)) { const c = k.replace(/[\u0001\u0002]/g, ''); if (c !== k) { if (!T[c]) T[c] = T[k]; delete T[k]; } }
fs.writeFileSync(path.join(src, 'translations.json'), JSON.stringify(T, null, 1));
const catFile = path.join(src, 'catalog.json');
const cat = fs.existsSync(catFile) ? Object.keys(JSON.parse(fs.readFileSync(catFile, 'utf8'))) : Object.keys(T);
fs.mkdirSync(path.join(root, 'public/locales'), { recursive: true });
for (const lang of ['en', 'de']) {
  const out = {};
  Object.entries(T).forEach(([k, v]) => { out[k] = v[lang]; });
  fs.writeFileSync(path.join(root, 'public/locales', lang + '.json'), JSON.stringify(out));
}
const skip = (k) => /^[{}0-9 .,:·\-–—/+%₺×~()]*$/.test(k) || /^[a-z_]+$/.test(k);
const missing = cat.filter((k) => !T[k] && !skip(k));
fs.writeFileSync(path.join(src, 'missing.txt'), missing.join('\n'));
console.log('çeviri', Object.keys(T).length, '· katalog', cat.length, '· eksik', missing.length);
