/* Marka ayarını telefon uygulamalarına uygular: uygulama adı, paket kimliği (Android applicationId,
   iOS bundle id) ve varsa simgeler. Web tarafı derlemede kendiliğinden uygulanır (BRAND=<id> npm run build).
   Kullanım:  node scripts/brand-apply.cjs <marka-id>      (geri dönmek için: node scripts/brand-apply.cjs default)
   Simgeler (isteğe bağlı): brands/<id>/android-res/  → android/app/src/main/res/ üstüne kopyalanır (mipmap-* klasörleri)
                            brands/<id>/ios-icon.png  → iOS uygulama simgesi (1024×1024, saydamsız PNG) */
const fs = require('fs');
const path = require('path');

const id = process.argv[2];
if (!id) { console.error('Kullanım: node scripts/brand-apply.cjs <marka-id>'); process.exit(1); }
const file = path.join('brands', id + '.json');
if (!fs.existsSync(file)) { console.error('Marka dosyası yok: ' + file); process.exit(1); }
const B = JSON.parse(fs.readFileSync(file, 'utf8'));
const app = Object.assign({ id: 'com.ceomai.kebabempire', name: 'Kebab Empire' }, B.app || {});
if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,}$/.test(app.id)) { console.error('Geçersiz paket kimliği: ' + app.id + ' (örnek: com.firma.oyun)'); process.exit(1); }
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, "\\'");
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
  .replace(/(<string name="app_name">)[^<]*(<\/string>)/, `$1${xml(app.name)}$2`)
  .replace(/(<string name="title_activity_main">)[^<]*(<\/string>)/, `$1${xml(app.name)}$2`)
  .replace(/(<string name="package_name">)[^<]*(<\/string>)/, `$1${app.id}$2`)
  .replace(/(<string name="custom_url_scheme">)[^<]*(<\/string>)/, `$1${app.id}$2`));
edit('android/app/build.gradle', (s) => s.replace(/applicationId "[^"]*"/, `applicationId "${app.id}"`));
/* iOS */
edit('ios/App/App/Info.plist', (s) => s.replace(/(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/, `$1${xml(app.name)}$2`));
edit('ios/App/App.xcodeproj/project.pbxproj', (s) => s.replace(/PRODUCT_BUNDLE_IDENTIFIER = [^;]*;/g, `PRODUCT_BUNDLE_IDENTIFIER = ${app.id};`));

/* Simgeler */
const ares = path.join('brands', id, 'android-res');
if (fs.existsSync(ares)) {
  fs.cpSync(ares, 'android/app/src/main/res', { recursive: true });
  changed.push('android/app/src/main/res (simgeler)');
}
const iicon = path.join('brands', id, 'ios-icon.png');
if (fs.existsSync(iicon)) {
  fs.copyFileSync(iicon, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
  changed.push('iOS uygulama simgesi');
}

console.log(`Marka "${id}" uygulandı: ${app.name} (${app.id})`);
changed.forEach((c) => console.log('  · ' + c));
console.log(`Sonra: BRAND=${id} npm run cap:sync`);
