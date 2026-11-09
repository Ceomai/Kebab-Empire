/* Marka ayarını telefon uygulamalarına uygular: uygulama adı, paket kimliği (Android applicationId,
   iOS bundle id) ve varsa simgeler. Web tarafı derlemede kendiliğinden uygulanır (BRAND=<id> npm run build).
   Kullanım:  node scripts/brand-apply.cjs <marka-id>      (geri dönmek için: node scripts/brand-apply.cjs default)
   Simgeler (isteğe bağlı): brands/<id>/android-res/  → android/app/src/main/res/ üstüne kopyalanır (mipmap-* klasörleri)
                            brands/<id>/ios-icon.png  → iOS uygulama simgesi (1024×1024, saydamsız PNG) */
const fs = require('fs');
const path = require('path');
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

/* Simgeler (ayarlardan önce yapılır; bir sorun olursa uygulama kimliğine dokunulmadan durur).
   Markanın üzerine yazdığı özgün dosyalar önce .brand-backup/ altına alınır, kopyalanan her dosya
   .brand-applied.json kaydına dosyaya dokunmadan ÖNCE yazılır. Bir sonraki çalıştırmada (başka marka ya da
   "default") yalnızca kayıttaki dosyalar geri alınır: yedeği olan özgün hâline döner, yedeği olmayan (markanın
   eklediği) dosya silinir. Git gerekmez; kaydın dışındaki hiçbir dosyaya dokunulmaz. Yarıda kalan bir çalıştırma
   da kayıttan geri alınabilir. */
const LOG = '.brand-applied.json';
const BAK = '.brand-backup';
const IOS_ICON = 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png';
const SAFE = (f) => typeof f === 'string' && !f.includes('..') && (f === IOS_ICON || /^android\/app\/src\/main\/res\/(mipmap|drawable)[^/]*\/[^/]+$/.test(f));
const fail = (msg) => { console.error('Hata: ' + msg + '\nHiçbir dosya değiştirilmedi.'); process.exit(1); };

if (!fs.existsSync(LOG) && fs.existsSync(BAK)) fail(`${BAK}/ var ama ${LOG} yok. Önceki bir çalıştırmadan kalmış olabilir: içindeki özgün simgeleri kontrol edip elle geri yükle, sonra klasörü sil.`);
if (fs.existsSync(LOG)) {
  let prev;
  try { prev = JSON.parse(fs.readFileSync(LOG, 'utf8')); } catch (e) { fail(`${LOG} okunamadı.`); }
  const files = (prev && Array.isArray(prev.files) ? prev.files : []).filter((it) => it && SAFE(it.file));
  /* önce bütün yedekler yerinde mi: eksikse hiçbir şeye dokunmadan dur */
  const missing = files.filter((it) => it.backup && !fs.existsSync(path.join(BAK, it.file)));
  if (missing.length) fail(`şu özgün simgelerin yedeği ${BAK}/ altında yok: ${missing.map((it) => it.file).join(', ')}. Kayıt ve yedek korunuyor; bu dosyaları elle geri yükle.`);
  for (const it of files) {
    if (it.backup) fs.copyFileSync(path.join(BAK, it.file), it.file);
    else if (fs.existsSync(it.file)) { fs.rmSync(it.file); const d = path.dirname(it.file); if (fs.existsSync(d) && !fs.readdirSync(d).length) fs.rmdirSync(d); }
  }
  fs.rmSync(LOG); fs.rmSync(BAK, { recursive: true, force: true });
  if (files.length) changed.push(`önceki markanın ${files.length} simge dosyası geri alındı`);
}

/* kopyalanacakları önceden topla */
const plan = [];
const RES = 'android/app/src/main/res';
const ares = path.join('brands', id, 'android-res');
if (fs.existsSync(ares) && fs.existsSync(RES)) {
  for (const d of fs.readdirSync(ares, { withFileTypes: true })) {
    if (!d.isDirectory() || !/^(mipmap|drawable)/.test(d.name)) { console.warn('Atlandı (yalnızca mipmap-* ve drawable* klasörleri kopyalanır): ' + path.join(ares, d.name)); continue; }
    for (const f of fs.readdirSync(path.join(ares, d.name), { withFileTypes: true })) {
      if (!f.isFile()) { console.warn('Atlandı (kaynak klasöründe alt klasör olamaz): ' + path.join(ares, d.name, f.name)); continue; }
      plan.push([path.join(ares, d.name, f.name), `${RES}/${d.name}/${f.name}`]);
    }
  }
}
const iicon = path.join('brands', id, 'ios-icon.png');
if (fs.existsSync(iicon) && fs.existsSync(path.dirname(IOS_ICON))) plan.push([iicon, IOS_ICON]);
plan.forEach(([, dst]) => { if (fs.existsSync(dst) && !fs.statSync(dst).isFile()) fail(`${dst} bir dosya değil.`); });

if (plan.length) {
  const log = { id, files: [] };
  const saveLog = () => fs.writeFileSync(LOG, JSON.stringify(log, null, 2) + '\n');
  saveLog();
  for (const [src, dst] of plan) {
    const hadOriginal = fs.existsSync(dst);
    if (hadOriginal) {
      const b = path.join(BAK, dst);
      if (!fs.existsSync(b)) { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(dst, b); } // var olan yedeğin üzerine asla yazılmaz
    }
    log.files.push({ file: dst, backup: hadOriginal }); saveLog(); // dosyaya dokunmadan önce kayda geçer
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
  changed.push(`${plan.length} simge dosyası kopyalandı (geri dönmek için: npm run brand default)`);
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

console.log(`Marka "${id}" uygulandı: ${app.name} (${app.id})`);
changed.forEach((c) => console.log('  · ' + c));
console.log(`Sonra: BRAND=${id} npm run cap:sync`);
