/* Kebab Empire — derleme girişi.
   Oyun dosyaları window.KE ad alanını sırayla doldurur; sıra önemlidir. */
import '../css/style.css';
import '../js/data.js';
import '../js/calendar.js';
import '../js/characters.js';
import '../js/art.js';
import '../js/sound.js';
import '../js/economy.js';
import '../js/sim.js';
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

KE.CLOUD.init().finally(() => KE.CONFIG.load());
if (KE.I18N.preferred() !== 'tr') KE.I18N.set(KE.I18N.preferred());

registerSW({
  immediate: true,
  onNeedRefresh() { if (window.KE && KE.UI && KE.UI.toast) KE.UI.toast('Yeni sürüm hazır. Sayfayı yenileyince yüklenecek.'); },
  onOfflineReady() { if (window.KE && KE.UI && KE.UI.toast) KE.UI.toast('Oyun artık internetsiz de açılır.'); }
});
