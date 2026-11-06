# Google Play ve App Store'a yükleme rehberi

Son güncelleme: 6 Kasım 2026. Bu dosya, mağaza yüklemesi için depoda hazır olanları ve **yalnızca senin yapabileceğin** adımları listeler.

## Depoda hazır olanlar

| Konu | Durum |
|---|---|
| Android hedef API | **36 (Android 16)**: Play'in 31 Ağustos 2026'dan beri yeni uygulamalar ve güncellemeler için istediği seviye. Capacitor 8'e geçildi. |
| Android kenardan kenara ekran | Android 15+ zorunlu kenardan kenara düzen için Capacitor `adjustMarginsForEdgeToEdge: auto` açık: durum çubuğu ve gezinme çubuğu oyunun üstüne binmez. |
| Play paketi (AAB) | CI, imza sırları tanımlıysa her ana dal gönderiminde imzalı `kebab-empire.aab` üretir (Actions → çalışma → Artifacts). |
| iOS projesi | `ios/` Capacitor 8 (Swift Package Manager). Simge ve açılış görseli oyunun logosu. `ITSAppUsesNonExemptEncryption = false` (ihracat sorusu çıkmaz). CI her gönderimde imzasız simülatör derlemesiyle projenin derlendiğini doğrular. |
| Gizlilik politikası | https://ceomai.github.io/Kebab-Empire/privacy.html (TR/EN/DE). Oyun içinden de bağlantı var. |
| Hesap/veri silme | Oyun içinde Menü → Hesap ve gizlilik → bulut verilerini sil (Apple'ın hesap silme kuralı ve Play'in veri silme sorusu için). |
| Yedekleme | Uygulama içinde tarayıcı indirmesi çalışmadığı için yedek, kopyalanabilir kod olarak verilir; geri yüklemede yapıştırılır. |
| Ekran görüntüleri | `store/tr/` (ve `node scripts/store-assets.cjs en` ile `store/en/`): Play telefon 1080×1920, App Store iPhone 6,9" 1320×2868, iPad 13" 2064×2752, Play öne çıkan görsel 1024×500. |

## Senin yapman gerekenler

### Google Play
1. **Play Console hesabı** aç (tek seferlik 25 $). Kişisel hesaplarda yayından önce 12 test kullanıcısıyla 14 günlük kapalı test istenebilir; Console ne isterse onu izle.
2. **Yükleme anahtarı (keystore) oluştur** — kendi bilgisayarında, Java kurulu ise:
   ```bash
   keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```
   Bu dosyayı ve parolaları kaybetme; güvenli bir yerde yedekle. Play App Signing açık olacağı için asıl imza anahtarını Google tutar, bu yalnızca yükleme anahtarıdır.
3. **GitHub sırlarını ekle** (depo → Settings → Secrets and variables → Actions → New repository secret):
   - `ANDROID_KEYSTORE_BASE64`: `base64 -w0 upload.jks` çıktısı (macOS'ta `base64 -i upload.jks`)
   - `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (örnekte `upload`), `ANDROID_KEY_PASSWORD`
4. Ana dala bir gönderim yap (ya da Actions'tan CI'ı yeniden çalıştır). Çalışmanın **Artifacts** bölümünden `kebab-empire-play-aab` indir.
5. Play Console'da uygulamayı oluştur, AAB'yi yükle ve aşağıdaki formları doldur.

### App Store
1. **Apple Developer Program** (yıllık 99 $) ve bir **Mac + Xcode** gerekiyor; iOS uygulaması yalnızca Xcode'dan imzalanıp yüklenebilir.
2. Mac'te: `npm ci && npm run build && npx cap sync ios && npx cap open ios`.
3. Xcode'da: App hedefi → Signing & Capabilities → takımını seç (Bundle ID `com.ceomai.kebabempire`). Product → Archive → Distribute App → App Store Connect.
4. App Store Connect'te uygulamayı oluştur, ekran görüntülerini (`store/tr/appstore-*`) ve metinleri ekle, incelemeye gönder.

## Mağaza formları için cevaplar

**Kategori:** Oyun → Simülasyon (Play: Simulation; App Store: Games / Simulation, ikincil Strategy).

**Yaş derecelendirmesi (Play IARC / Apple):** şiddet yok, kan yok, cinsellik yok, küfür yok, alkol/tütün/uyuşturucu yok, kumar ya da benzetilmiş kumar yok, kullanıcılar arası sohbet yok, satın alma yok, reklam yok. Beklenen sonuç: PEGI 3 / Everyone / Apple 4+. Bulut açıkken oyuncunun seçtiği takma ad sıralamada görünür; IARC'deki "kullanıcı etkileşimi / paylaşılan içerik" sorusunda bunu belirt.

**Play Veri güvenliği (Data safety):** şu anki canlı sürümde bulut kapalı (Supabase ayarlı değil), yani **uygulama hiçbir veri toplamıyor ve paylaşmıyor**. Bulutu ileride açarsan formu güncelle: "Uygulama etkinliği (oyun içi olaylar), isteğe bağlı, şifreli aktarım, kullanıcı silme isteyebilir" ve "Uygulama bilgisi ve performansı (çökme kayıtları)".

**Apple App Privacy:** bulut kapalıyken "Data Not Collected". Bulut açılınca "Gameplay Content" ve "Product Interaction", izlemede kullanılmıyor, kimliğe bağlı değil (anonim hesap).

**Gizlilik politikası adresi:** https://ceomai.github.io/Kebab-Empire/privacy.html

## Mağaza metinleri

**Kısa açıklama (Play, en çok 80 karakter)**
- TR: Döner dükkânından imparatorluğa: tezgâhta pişir, ekibini yönet, şubeler aç.
- EN: From one döner shop to an empire: cook at the counter, run a crew, expand.

**Tam açıklama (TR)**

Kebab Empire'da küçük bir döner dükkânıyla başlarsın. Sabah Hal'den malzeme alır, ekibini yerleştirir, fiyatları ayarlar ve kepengi açarsın. Müşteriler kapıdan girer, kasada sipariş verir, ustaların pişirir, garsonların masaya taşır.

İstersen tezgâha kendin geçersin: lavaşı ızgarada ısıt, döneri kes, menülere patates kızart, acele siparişleri süresinde bitir. Hatasız ve hızlı çalıştıkça kombo yaparsın, bahşişler artar.

Günler geçtikçe ustalar yetişir, müdavimler gelir, rakip zincir hamle yapar. İtibar kazan, yeni semtlerde şube aç, çiftliğini kur, toplu siparişler al ve İstanbul'un kebap imparatoru ol.

- Gerçekçi işletme: stok, fiyat, bordro, vergi, kira ve krediler
- Döner ve kebap olmak üzere iki ayrı oyun tarzı
- Tezgâhta hızlı, dokunmatik mutfak oyunu
- 7 şube, dönemler, rakip hikâyesi ve müdavimler
- Reklamsız, internet gerektirmez; Türkçe, İngilizce ve Almanca

**Full description (EN)**

Kebab Empire starts you off with one small döner shop. In the morning you buy supplies at the market, place your crew, set your prices and open the shutters. Customers walk in, order at the till, your cooks prepare the food and your waiters carry it to the tables.

Step up to the counter yourself whenever you like: warm the lavash on the grill, slice the döner, fry the fries for meal orders and finish rush tickets in time. Work fast and flawless to build combos and bigger tips.

Over the days your cooks learn, regulars return and a rival chain makes its moves. Earn reputation, open branches in new districts, build your farm, take bulk orders and become Istanbul's kebab emperor.

- Real business management: stock, prices, payroll, taxes, rent and loans
- Two ways to play: döner shop or kebab grill
- A fast, touch-friendly kitchen game at the counter
- 7 branches, eras, a rival storyline and regular customers
- No ads, works offline; English, Turkish and German

## Gerçek cihazda son kontrol (yüklemeden önce önerilir)

Bu ortamda emülatör ya da gerçek cihaz yok; şunları bir Android telefonda ve (Mac'te) bir iPhone simülatöründe dene:
- Durum çubuğu ve alt gezinme çubuğu üst çubuğu ya da tezgâh panelini örtüyor mu
- Geri tuşu: ekranlar arasında geri gidiyor, ana menüde uygulamadan çıkıyor
- Uygulamayı arka plana alıp dönünce oyun duruyor ve kaldığı yerden devam ediyor
- Ses ilk dokunuştan sonra başlıyor
- Yedek kodu kopyala → yeni kurulumda yapıştır → oyun aynen geliyor
