# Test kapsamı

Bu dosyadaki her sayı bu denetimde gerçekten çalıştırılmış testlerden gelir. Satır/dal kapsamı yüzdesi ölçülmedi (kapsam aracı kurulu değil); kapsam aşağıda özellik bazında verilmiştir.

## Otomatik test takımı (kalıcı, tekrar çalıştırılabilir)

| Takım | Komut | Ne sınar | Son sonuç |
| --- | --- | --- | --- |
| Birim + entegrasyon (Vitest) | `npm test` | 18 dosya: motor, ekonomi, takvim, kayıt, doğrulama, i18n, ilerleme, imparatorluk, kadro, stok, gün ortası, rezervasyon, yarış, vakıf, güvenlik, depolama, değişmez kurallar, fuzz | **97/97 geçti** |
| Motor fuzz | `tests/fuzz.test.js` (npm test içinde) | 2 mod × 6 tohum × 60 gün = 720 oyun günü; her sabah 0–6 rastgele eylem (20 eylem türü), serviste rastgele hamle; her gün sayılar, referanslar, sınırlar; kayıt gidiş-dönüş; sunucu yeniden oynatması | 12/12 geçti |
| Değişmez kurallar | `tests/invariants.test.js` | 2 mod × 3 tohum × 100 gün oyuncusuz: ustalı şube sıfır müşteri yapmaz, kasa/servis boş kalmaz, sayılar sonlu | 6/6 geçti |
| Veritabanı RLS | `npm run audit:db` | Gerçek PostgreSQL 16 + bütün migration'lar; 2 kullanıcı + anonim + servis rolüyle 40 senaryo | **40/40 geçti** |
| Uçtan uca (Playwright) | `npm run e2e` | Yeni oyun kurulumu, öğretici, servis, tezgâh, kapanış, ekranlar; CI'da Chromium + Firefox + WebKit | Geçti (yerelde Chromium; CI'da 3 tarayıcı) |
| Arayüz profilleri | `npm run audit:personas` | 20 oyuncu profili, tohumlu rastgele etkileşim | **20 profil, 2.808 tık, 29 yenileme: 0 hata, 0 anomali** |
| Arayüz profilleri (son regresyon, öğe bazlı taşma denetimiyle) | aynı, 80 adım | Bütün düzeltmelerden sonra | **20 profil, 1.521 tık: 0 hata, 0 anomali** |
| Görsel | `npm run audit:visual` | 7 cihaz boyutu × 16 ekran + 6 pencere = 154 görünüm | 0 taşma, 0 kesik yazı, 24 px altı dokunma hedefi 0 |
| Çalışma zamanı | `npm run audit:runtime` | Açılış, 60 günlük oturum, çevrimdışı, iki sekme, art arda tıklama | 5/5 senaryo beklenen sonuç |
| Denge | `npm run sim:multi` | Çok tohumlu yıllık simülasyon | 72 yıllık koşu, çökme yok |

Toplam: **97 birim testi + 40 veritabanı testi + 2 × 20 profil (4.329 tık) + 154 görsel görünüm + 5 çalışma zamanı senaryosu + uçtan uca test**, hepsi geçti. Başarısız test yok. Engellenen testler aşağıda.

## Arayüz profilleri

| Profil | Ekran | Ne yapar |
| --- | --- | --- |
| yeni-oyuncu | 390×844 | Arayüzden yeni oyun kurar |
| donen-oyuncu | 390×844 | 40 günlük kayıttan devam eder, 25 adımda bir yeniler |
| kisa-oturum | 390×844 | 8 adımda bırakır |
| hizli-gezinen | 390×844 | Adımlar arası 20 ms |
| hata-yapip-duzelten | 390×844 | Sık sık "geri al" |
| zayif-baglanti | 390×844 | İnternet periyodik olarak kesilir |
| kapat-ac | 390×844 | 6 adımda bir sayfayı yeniler |
| uzun-gecmis | 390×844 | 180 günlük, 5 şubeli kayıt |
| kucuk-ekran | 360×640 | |
| yatay-ekran | 844×390 | |
| tablet | 820×1180 | |
| masaustu | 1440×900 | |
| ekran-donduren | dikey ↔ yatay | 10 adımda bir döner |
| emoji-adli | 390×844 | Adlarda 40 emoji, HTML ve tırnak |
| ingilizce / almanca | 390×844 / 360×640 | Diğer diller |
| kebapci | 390×844 | Kebap modu, 60 günlük kayıt |
| yaris | 390×844 | Haftanın yarışı |
| geri-tusu | 390×844 | Tarayıcı geri tuşu |
| imparator | 390×844 | İmparatorluk sonrası oyun |

Her adımda alanlara rastgele girdi yazıldı: boş, 0, −5, 99999999999, emoji, 300 karakter, `<script>`, Arapça rakam. Her adımdan sonra denetlenenler: sayfa hatası, konsol hatası, ekranda `NaN`/`undefined`/`[object Object]`/`Infinity`, ekran dışına taşan öğe, oyun durumu (sonlu kasa ve itibar, şubesiz personel). Profil sonunda kalıcılık denetlendi: kaydedilen gün yenilemeden sonra aynı.

**Denetleyicinin kendisi de sınandı:** `NaN` enjekte edildiğinde ve sayfa hatası fırlatıldığında yakaladı. İlk sürüm yatay taşmayı kaçırıyordu (sayfa `overflow-x: clip` ile kırpılı); öğe bazlı ölçüme geçirildi.

## Özellik envanteri ve kapsam

| Alan | Özellikler | Nasıl sınandı |
| --- | --- | --- |
| Oyun kurulumu | Mod, semt, usta seçimi, ad girişi, öğretici | e2e, profiller (yeni-oyuncu, emoji-adli) |
| Sabah | Ekip yerleşimi (liste + pano), fiyat/menü, açılış kontrolü, danışman, geri al | Profiller, fuzz (fiyat, menü, görev) |
| Servis | Dakika dakika simülasyon, hız, tezgâh, gün ortası kararları, acil kurye | e2e (tezgâh), fuzz (rastgele hamleler), `midday.test.js` |
| Kapanış | Bahşiş kuralları, özet, günlük, hedefler | Birim, profiller |
| Kadro | İşe alım/kovma/zam/terfi/mentor/transfer, kadro sınırı | `staffcap.test.js`, fuzz, art arda tık testi |
| Tedarik | Hal, talebe göre sipariş, tamamlama, çiftlik | `stock.test.js`, fuzz |
| Yatırımlar | Ekipman, dekor, rezervasyon, imza tarif, amiral dükkân, toplu sipariş, vakıf | `progress.test.js`, `reservation.test.js`, fuzz |
| İlerleme | Dönemler, rakip hikâyesi, müdavimler, imparatorluk, yeni nesil | `progress.test.js`, `empire.test.js`, sim-multi |
| Yarış | Ortak tohum, ayrı kayıt, sıralama, sunucu doğrulaması | `reservation.test.js`, `security.test.js`, yaris profili, RLS |
| Kayıt | Yazma, yedek, bozuk kayıt, kota, sürüm göçü, dışa/içe aktarma, iki sekme, kırpma | `save.test.js`, `storage.test.js`, çalışma zamanı |
| Bulut | Kimlik, kayıt, gün sonucu, sıralama, ölçüm, veri silme | RLS testi (gerçek PostgreSQL); istemci `cloud.test.js` |
| Sunucu doğrulaması | Yeniden oynatma, zincir, yarış, günlük sınırı | `verify.test.js`, `security.test.js`, fuzz (her 10 günde bir) |
| i18n | TR/EN/DE, sayı/tarih biçimleri | `i18n.test.js`, profiller (ingilizce, almanca) |
| Mobil arayüz | Çekmece, yakınlaştırma, yatay/dikey, dokunma hedefleri | Görsel tarama, profiller, ayrı yakınlaştırma testi |
| PWA / çevrimdışı | Servis çalışanı, çevrimdışı yeniden açılış | Çalışma zamanı |
| Saat dilimi | 6 saat diliminde birebir aynı oyun durumu | Ayrı karşılaştırma koşusu; testler 5 saat diliminde |

## Engellenen ya da yapılamayan testler

| Test | Neden |
| --- | --- |
| Gerçek Android cihaz / emülatör | Bu ortamda emülatör yok; APK yalnızca CI'da derleniyor |
| Gerçek iOS Safari | Yalnızca masaüstü WebKit (CI) |
| Edge function (Deno) çalıştırma | Deno kurulu değil; mantık birim testleriyle, HTTP katmanı kod incelemesiyle |
| Canlı Supabase | Kural gereği dokunulmadı; yerel PostgreSQL ile taklit edildi |
| Çok cihazlı bulut çakışması | Canlı Supabase gerektirir; istemcideki seçim penceresi kod incelemesiyle |
| Klavye açılması (sanal klavye) | Masaüstü tarayıcıda taklit edilemiyor |
| Satır/dal kapsam yüzdesi | Kapsam aracı kurulu değil; özellik bazında kapsam verildi |
