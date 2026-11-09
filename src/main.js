/* Kebab Empire — derleme girişi.
   Oyun dosyaları window.KE ad alanını sırayla doldurur; sıra önemlidir. */
/* Yazı tipleri pakete gömülü: Google sunucusuna istek gitmez (GDPR), ilk açılış da internetsiz çalışır */
import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-ext-600.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-ext-700.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/baloo-2/latin-ext-800.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-ext-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-ext-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-ext-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-ext-800.css';
import '@fontsource/kalam/latin-400.css';
import '@fontsource/kalam/latin-ext-400.css';
import '../css/style.css';
import '../js/data.js';
import '../js/brand.js';
import '../js/calendar.js';
import '../js/characters.js';
import '../js/art.js';
import '../js/sound.js';
import '../js/economy.js';
import '../js/sim.js';
import '../js/midday.js';
import '../js/progress.js';
import '../js/farm.js';
import '../js/narrative.js';
import '../js/save.js';
import '../js/config.js';
import '../js/i18n.js';
import '../js/map.js';
import '../js/scene.js';
import '../js/ui/core.js';
import '../js/ui/start.js';
import '../js/ui/city.js';
import '../js/ui/shop.js';
import '../js/ui/office.js';
import '../js/ui/places.js';
import '../js/ui/actions.js';
import './cloud.js';
import '../js/main.js';
import { registerSW } from 'virtual:pwa-register';

KE.CONTACT = import.meta.env.VITE_CONTACT_EMAIL || '';

KE.CLOUD.init().finally(() => { KE.CONFIG.load(); if (KE.UI.checkCloud) KE.UI.checkCloud(); });
if (KE.I18N.preferred() !== 'tr') KE.I18N.set(KE.I18N.preferred());
else if (KE.BRAND && KE.BRAND.swaps.length) KE.I18N.set('tr'); /* markalı sürüm: Türkçede de ad değişimi */

/* servis çalışanı yalnızca web sürümünde: uygulamanın dosyaları zaten cihazda, güncellemeyi mağaza yapar */
const native = (() => { try { const C = /** @type {any} */ (window).Capacitor; return !!(C && C.isNativePlatform && C.isNativePlatform()); } catch (e) { return false; } })();
/* Android geri tuşu: pencere kapat → geri git → çıkış onayı (ayrıntı: KE.UI.handleBack). Eklenti yalnızca uygulamada yüklenir. */
if (native) import('@capacitor/app').then(({ App }) => {
  KE.UI.nativeExit = () => App.exitApp();
  App.addListener('backButton', () => KE.UI.handleBack());
}).catch(() => { /* eklenti yoksa varsayılan davranış */ });
if (!native) registerSW({
  immediate: true,
  onNeedRefresh() { if (window.KE && KE.UI && KE.UI.toast) KE.UI.toast('Yeni sürüm hazır. Sayfayı yenileyince yüklenecek.'); },
  onOfflineReady() { if (window.KE && KE.UI && KE.UI.toast) KE.UI.toast('Oyun artık internetsiz de açılır.'); }
});
