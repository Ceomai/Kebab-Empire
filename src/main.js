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
import '../js/map.js';
import '../js/scene.js';
import '../js/ui.js';
import './cloud.js';
import '../js/main.js';
import { registerSW } from 'virtual:pwa-register';

KE.CLOUD.init().finally(() => KE.CONFIG.load());

registerSW({
  immediate: true,
  onNeedRefresh() { if (window.KE && KE.UI && KE.UI.toast) KE.UI.toast('Yeni sürüm hazır. Sayfayı yenileyince yüklenecek.'); },
  onOfflineReady() { if (window.KE && KE.UI && KE.UI.toast) KE.UI.toast('Oyun artık internetsiz de açılır.'); }
});
