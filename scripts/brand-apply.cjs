/* Marka ayarını telefon uygulamalarına uygular: uygulama adı, paket kimliği (Android applicationId,
   iOS bundle id) ve varsa simgeler. Web tarafı derlemede kendiliğinden uygulanır (BRAND=<id> npm run build).
   Kullanım:  node scripts/brand-apply.cjs <marka-id>      (geri dönmek için: node scripts/brand-apply.cjs default)
   Simgeler (isteğe bağlı): brands/<id>/android-res/  → android/app/src/main/res/ üstüne kopyalanır (mipmap-* klasörleri)
                            brands/<id>/ios-icon.png  → iOS uygulama simgesi (1024×1024, saydamsız PNG) */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadBrand } = require('./brand-validate.cjs');

const id = process.argv[2];
if (!id) { console.error('Kullanım: node scripts/brand-apply.cjs <marka-id>'); process.exit(1); }
let B;
try { B = loadBrand(id); } catch (e) { console.error(e.message); process.exit(1); }
const app = Object.assign({ id: 'com.ceomai.kebabempire', name: 'Kebab Empire' }, B.app || {});
if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,}$/.test(app.id)) { console.error('Geçersiz paket kimliği: ' + app.id + ' (örnek: com.firma.oyun)'); process.exit(1); }
/* XML kaçışı; Android strings.xml ayrıca ' ve " için ters bölü ister, iOS plist istemez */
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const androidStr = (s) => xml(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
const changed = [];
function edit(p, fn) {
  if (!fs.existsSync(p)) return;
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  if (after !== before) { fs.writeFileSync(p, after); changed.push(p); }
}

/* Capacitor ayarı */
edit('capacitor.config.json', (s) => { const c = JSON.parse(s); c.appId = app.id; c.appName = app.name; return JSON.stringify(c, null, 2) + '\n'; });
/* Android */
edit('android/app/src/main/res/values/strings.xml', (s) => s
  .replace(/(<string name="app_name">)[^<]*(<\/string>)/, () => `<string name="app_name">${androidStr(app.name)}</string>`)
  .replace(/(<string name="title_activity_main">)[^<]*(<\/string>)/, () => `<string name="title_activity_main">${androidStr(app.name)}</string>`)
  .replace(/(<string name="package_name">)[^<]*(<\/string>)/, `$1${app.id}$2`)
  .replace(/(<string name="custom_url_scheme">)[^<]*(<\/string>)/, `$1${app.id}$2`));
edit('android/app/build.gradle', (s) => s.replace(/applicationId "[^"]*"/, `applicationId "${app.id}"`));
/* iOS */
edit('ios/App/App/Info.plist', (s) => s.replace(/(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/, (m, a, b) => a + xml(app.name) + b));
edit('ios/App/App.xcodeproj/project.pbxproj', (s) => s.replace(/PRODUCT_BUNDLE_IDENTIFIER = [^;]*;/g, `PRODUCT_BUNDLE_IDENTIFIER = ${app.id};`));

/* Simgeler: markanın kopyaladığı dosyalar .brand-applied.json kaydına yazılır. Bir sonraki çalıştırmada
   (başka marka ya da "default") yalnızca bu dosyalar geri alınır: depoda olan dosya git'teki hâline döner,
   depoda olmayan (markanın eklediği) dosya silinir. Kaydın dışındaki hiçbir dosyaya dokunulmaz. */
const LOG = '.brand-applied.json';
const tracked = (f) => { try { execFileSync('git', ['ls-files', '--error-unmatch', '--', f], { stdio: 'ignore' }); return true; } catch (e) { return false; } };
if (fs.existsSync(LOG)) {
  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(LOG, 'utf8')); } catch (e) { prev = null; }
  const files = prev && Array.isArray(prev.files) ? prev.files : [];
  let failed = 0;
  for (const f of files) {
    /* yalnızca simge ve açılış klasörlerindeki göreli yollar */
    if (typeof f !== 'string' || f.includes('..') || !/^(android\/app\/src\/main\/res\/(mipmap|drawable)[^/]*\/|ios\/App\/App\/Assets\.xcassets\/AppIcon\.appiconset\/)[^/]+$/.test(f)) continue;
    if (tracked(f)) { try { execFileSync('git', ['checkout', '--', f], { stdio: 'ignore' }); } catch (e) { failed++; } }
    else if (fs.existsSync(f)) { fs.rmSync(f); const d = path.dirname(f); if (fs.existsSync(d) && !fs.readdirSync(d).length) fs.rmdirSync(d); }
  }
  if (failed) console.warn(`Uyarı: ${failed} simge dosyası git ile geri alınamadı.`);
  fs.rmSync(LOG);
  if (files.length) changed.push(`önceki markanın ${files.length} simge dosyası geri alındı`);
}
const copied = [];
const copyTree = (src, dst) => {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s2 = path.join(src, e.name), d2 = dst + '/' + e.name;
    if (e.isDirectory()) { if (!/^(mipmap|drawable)/.test(e.name) && dst.endsWith('/res')) { console.warn('Atlandı (yalnızca mipmap-* ve drawable-* kopyalanır): ' + s2); continue; } fs.mkdirSync(d2, { recursive: true }); copyTree(s2, d2); }
    else if (e.isFile() && !dst.endsWith('/res')) { fs.copyFileSync(s2, d2); copied.push(d2); }
  }
};
const ares = path.join('brands', id, 'android-res');
if (fs.existsSync(ares) && fs.existsSync('android/app/src/main/res')) {
  copyTree(ares, 'android/app/src/main/res');
  changed.push('android/app/src/main/res (simgeler; geri dönmek için: npm run brand default)');
}
const IOS_ICON = 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png';
const iicon = path.join('brands', id, 'ios-icon.png');
if (fs.existsSync(iicon) && fs.existsSync(path.dirname(IOS_ICON))) {
  fs.copyFileSync(iicon, IOS_ICON); copied.push(IOS_ICON);
  changed.push('iOS uygulama simgesi');
}
if (copied.length) fs.writeFileSync(LOG, JSON.stringify({ id, files: copied }, null, 2) + '\n');

console.log(`Marka "${id}" uygulandı: ${app.name} (${app.id})`);
changed.forEach((c) => console.log('  · ' + c));
console.log(`Sonra: BRAND=${id} npm run cap:sync`);
