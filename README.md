# Kebab Empire

Döner ve kebap dünyasında geçen, renkli ve animasyonlu bir işletme simülasyonu. Mahallede tek bir dükkânla başlarsın. İstanbul'dan esinlenen bir şehirde şubeden şubeye büyüyerek bir zincir kurarsın.

## Nasıl oynanır

Oyun her `main` gönderiminde otomatik derlenip **GitHub Pages**'te yayınlanır (depo ayarlarında Pages → Source: *GitHub Actions* seçili olmalı). Telefona uygulama gibi kurulabilir ve internetsiz de açılır (PWA).

Geliştirme:

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # birim, denge, determinizm, kayıt, takvim, çeviri, bulut testleri
npm run typecheck    # JSDoc / checkJs tip kontrolü
npm run build        # dist/ (küçültülmüş, ~120 KB gzip)
npm run e2e          # derlenmiş oyunu Chromium'da baştan sona oynar (önce: npx vite preview --port 4173)
```

## Mimari

| Katman | Dosyalar | Not |
|---|---|---|
| Veri | `js/data.js`, `js/calendar.js` | Ürünler, semtler, ustalar; hicri takvimden Ramazan/bayram, İstanbul iftar saati, yıllık asgari ücret ve vergi dilimleri |
| Motor | `js/economy.js`, `js/sim/*.js`, `js/farm.js`, `js/narrative.js` | DOM'suz; tohumlu rastgelelik (`KE.rand`), oyuncu hamle günlüğü ve birebir yeniden oynatma (`KE.replayService`) |
| Kayıt ve ayar | `js/save.js`, `js/config.js` | Sürümlü kayıt + göçler, günlük yedek, dosyaya dışa/içe aktarma; uzaktan denge ayarı (`public/config.json`, Supabase `remote_config`) |
| Arayüz | `js/ui/*.js`, `js/map.js`, `js/scene.js`, `js/art.js`, `js/characters.js` | Katmanlı şehir haritası (zemin bir kez çizilir), sahne, ekranlar |
| Çok dil | `js/i18n.js`, `public/locales/`, `locales_src/` | Türkçe asıl; İngilizce ve Almanca. Ekrana gelen metin kalıp sözlüğünden geçer |
| Bulut | `src/cloud.js`, `supabase/` | Anonim hesap, bulut kaydı, doğrulanmış şehir sıralaması, ölçüm ve hata raporu; ayrıntılar `docs/SUPABASE.md`, gizlilik `docs/GIZLILIK.md` |
| Sunucu doğrulaması | `js/verify.js`, `supabase/functions/verify-day` | Gün sonucu sunucuda aynı motorla yeniden oynatılır; tutmayan sonuç sıralamaya girmez |

### Oyunun akışı

1. **Mod seç:** Dönerci ya da kebapçı. Menü, ekipman, müşteri ve olaylar bu seçime göre değişir.
2. **Semt seç:** İlk dükkânın semtini haritadan seçersin. Semt; müşteri karışımını, kirayı ve rakip sayısını belirler.
3. **Usta seç:** Üç adaydan biri ocağın başına geçer. Yanına bir çırak ve ön tezgâh personeli verilir.
4. **Sabah hazırlığı:** Menüyü ve fiyatları ayarla, stoğu ve vardiyayı kontrol et.
5. **Servis (10:00–23:00):** Bütün şubeler aynı anda açılır. Müşteri kapıdan girer, kasada sipariş verir, usta pişirir, komi/garson tabağı masaya götürür, müşteri yer, bahşiş bırakır ve çıkar; masa toplanır. Şube şeridinden şubeler arasında canlı geçiş yapabilir, ekibin görevini (ocak, kasa, servis, temizlik, paket, mola) yoğunluğa göre değiştirebilirsin. İstersen "Tezgâha geç" diyerek siparişleri kendin hazırlarsın.
6. **Kapanış:** Gün sonu raporu, bahşiş dağıtımı, gün sonu günlüğü ve ekibin moral değişimi.
7. **Hafta ve ay sonu:** Pazar akşamı mahalle gazetesi çıkar, usta pazarı yenilenir. Ay sonunda bordro, kira, stopaj, faturalar, KDV ve kredi taksitleri kasadan düşer.

## Sistemler

| Sistem | Ne yapar |
|---|---|
| Müdavimler | Altı isimli müdavim (Ayşe Teyze, öğrenci Elif, şantiye şefi Hakan…) belli günlerde gelir. Sevdiği yemeği iyi yaparsan gönlü dolar: 5 kalpte arkadaşını getirir, 8'de mahallede dükkânı över. |
| Yeni tarifler | İtibar 40 ve 60'ta yeni ürünler açılır: dönercide tantuni ve künefe, kebapçıda içli köfte ve künefe. |
| Özel günler | Ramazan'da iftar kalabalığı, bayramda aile akını ve bol bahşiş, maç akşamı gece yoğunluğu, cuma öğle kalabalığı. Dükkân da süslenir. |
| Semt şampiyonluğu | Ay sonunda memnuniyet ortalaması "Lüks Kebap"ın çıtasını geçen şube bir ay boyunca taç takar: müşteri +%6, itibar +2. |
| Günün hedefleri | Her sabah üç küçük hedef (müşteri sayısı, memnuniyet, soğuyan tabak, bahşiş gibi). Tutturulan her hedef ek para ve itibar getirir. |
| Ses | Kasa, zil, eşleşme arpeji, yoğun saat afişi ve hicaz makamında hafif bir fon ezgisi; hepsi tarayıcıda sentezlenir. Üst çubuktaki düğmeyle açılıp kapanır. |
| İlk gün rehberi | Yeni oyunda sekiz adımlık kısa bir rehber ekibi, fiyatları, yoğunluk göstergesini ve molayı gösterir. |
| Görünür gelişim | Ekipman yükseldikçe dükkân değişir: ışıklı ve sonra yaldızlı tabela, içecek dolabı, yeni zemin, daha çok ocak ve masa. |
| Servis akışı | Ustalar yalnızca pişirir. Kasa sipariş ve ödemeyi alır, komi/garson hazır tabağı masaya götürür ve masaları toplar. Tezgâhta bekleyen tabak soğur, kirli masa yeni müşteri almaz. Çalışanların enerjisi iş yaptıkça düşer, molada dolar. |
| Otomatik ekip | Her şubede açılıp kapanabilir. Müdür varsa yoğunluğa göre görev ve mola düzenler; yoksa yalnızca bitkin düşenleri molaya gönderir. |
| Besi çiftliği | Dana, kuzu ve (dönercide) tavuk yetiştirilir. Olgunlaşan hayvan kesimhaneye gider, et her sabah şubelere sevk edilir; maliyet düşer, kalite artar. |
| Usta ve uzmanlık | Her ustanın ürün bazında ★1–5 uzmanlığı, hız, kalite, tutarlılık, fire ve öğretme değerleri, bir kişilik özelliği ve memleketi vardır. Ustalar pişirdikçe deneyim kazanır. |
| Müşteri tercihleri | Yedi müşteri tipinin favori ürünü, sabrı, fiyat hassasiyeti ve bahşiş eğilimi vardır. Uzman usta, o ürünü seven müşterileri dükkâna çeker. |
| Eşleşme bonusu | Müşterinin favori ürününü ★4+ usta hazırlarsa "Ellerine sağlık!" der: memnuniyet ve bahşiş artar. |
| Bahşiş ve moral | Varsayılan dağıtım kuralı her gün uygulanır; gün sonunda o güne özel değiştirilebilir. Bahşiş, iş yükü, kostüm, dinlenme odası ve zamlar morali etkiler. Moral hız, kalite ve bahşişe yansır. Morali çok düşen çalışan istifa edebilir. |
| Usta-çırak | Çırak bir ustanın yanına verilirse onun uzmanlıklarını öğrenir ve zamanla ustalığa terfi eder. |
| Ekonomi | Türkiye'ye yakın, yuvarlanmış 2026 değerleri: SGK işçi/işveren payları, işsizlik sigortası, kümülatif gelir vergisi dilimleri, asgari ücret istisnası, damga vergisi, 5 puanlık SGK teşviki, fazla mesai, bayram ikramiyesi, %10 KDV, kira stopajı. Bütün oranlar `js/data.js` içindeki `KE.ECON` tablosundadır. |
| Raporlar | Günlük, haftalık ve aylık raporlar, bordro önizlemesi, şube bazında ve konsolide tablolar, grafikler. |
| Kişiselleştirme | Dört kostüm seviyesi (yöresel kostüm çalışanın memleketine göre), 15 dekor öğesi, dört ekipman kategorisi. Aynı tarzdan üç dekor konsept bonusunu açar. |
| Şubeler | Yedi semtte şube açılabilir. Oyuncunun başında olmadığı şubeler arka planda simüle edilir; sonucu şube müdürü, ustalar ve semtin müşteri profili belirler. Üç şubeden sonra merkezi mutfak kurulabilir. |
| Anlatı | Günün verilerinden yazılan gün sonu günlüğü, 15 olay kartı, haftalık mahalle gazetesi, karakter replikleri ve dokuz hikâye hedefi. |
| Görseller | Bütün görseller vektör (SVG): yemek çizimleri, döner ocağı, mangal, izometrik şehir haritası, dükkân iç mekânı, çiftlik hayvanları. Karakterler tam boy çizilir, yürür, tepsi taşır; yüz ifadesi moral ve sabra göre değişir; yöresel başlıklar (puşi, takke, kalpak) ve kostümler vardır. |

## Dosya yapısı

```
index.html          Giriş sayfası
css/style.css       Görsel kimlik ve bileşenler
js/data.js          Bütün oyun verisi: modlar, ürünler, ustalar, semtler, dekor, ekonomi ayarları
js/characters.js    SVG karakter oluşturucu (portre ve tam boy) ve sabit hikâye karakterleri
js/sound.js         Sentezlenen sesler ve fon müziği
js/art.js           Vektör çizim kütüphanesi: yemekler, ocaklar, mobilya, hayvanlar, ikonlar
js/map.js           İzometrik şehir haritası
js/scene.js         Dükkân iç mekânı ve canlı servis sahnesi
js/farm.js          Besi çiftliği
js/economy.js       Para biçimi, takvim, fiyatlar, bordro, aylık kapanış, kredi
js/sim/*.js         Eşzamanlı şube simülasyonu (rng, staff, branch, morning, service, player, close, replay)
js/narrative.js     Günlük, gazete, olay kartları, replikler
js/ui.js            Ekranlar, harita, dükkân sahnesi, modallar
js/main.js          Açılış
docs/OYUN_PLANI.md  Tasarım belgesi
```

## Belgeler

- [Oyun Tasarım Planı](docs/OYUN_PLANI.md)
