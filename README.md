# Kebab Empire

Döner ve kebap dünyasında geçen, renkli ve animasyonlu bir işletme simülasyonu. Mahallede tek bir dükkânla başlarsın. İstanbul'dan esinlenen bir şehirde şubeden şubeye büyüyerek bir zincir kurarsın.

## Nasıl oynanır

Kurulum gerekmez. `index.html` dosyasını bir tarayıcıda açman yeterli. Oyun kayıtları tarayıcıda tutulur.

Yerel bir sunucuyla açmak istersen:

```bash
python3 -m http.server 8000
```

Sonra tarayıcıda `http://localhost:8000` adresine git.

### Oyunun akışı

1. **Mod seç:** Dönerci ya da kebapçı. Menü, ekipman, müşteri ve olaylar bu seçime göre değişir.
2. **Semt seç:** İlk dükkânın semtini haritadan seçersin. Semt; müşteri karışımını, kirayı ve rakip sayısını belirler.
3. **Usta seç:** Üç adaydan biri ocağın başına geçer. Yanına bir çırak ve ön tezgâh personeli verilir.
4. **Sabah hazırlığı:** Menüyü ve fiyatları ayarla, stoğu ve vardiyayı kontrol et.
5. **Servis (10:00–23:00):** Servisi personel yürütür. İstersen "Tezgâha geç" diyerek siparişleri kendin hazırlarsın. Hız 1×, 2× ve 4× arasında değiştirilebilir.
6. **Kapanış:** Gün sonu raporu, bahşiş dağıtımı, gün sonu günlüğü ve ekibin moral değişimi.
7. **Hafta ve ay sonu:** Pazar akşamı mahalle gazetesi çıkar, usta pazarı yenilenir. Ay sonunda bordro, kira, stopaj, faturalar, KDV ve kredi taksitleri kasadan düşer.

## Sistemler

| Sistem | Ne yapar |
|---|---|
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
| Karakterler | Katmanlı SVG karakterler: ten, saç, bıyık/sakal, gözlük, başörtüsü ve yöresel başlıklar (puşi, takke, kalpak). Yüz ifadesi moral ve sabra göre değişir. |

## Dosya yapısı

```
index.html          Giriş sayfası
css/style.css       Görsel kimlik ve bileşenler
js/data.js          Bütün oyun verisi: modlar, ürünler, ustalar, semtler, dekor, ekonomi ayarları
js/characters.js    SVG karakter oluşturucu ve sabit hikâye karakterleri
js/economy.js       Para biçimi, takvim, fiyatlar, bordro, aylık kapanış, kredi
js/sim.js           Servis simülasyonu, gün kapanışı, bahşiş/moral, şubeler, hedefler
js/narrative.js     Günlük, gazete, olay kartları, replikler
js/ui.js            Ekranlar, harita, dükkân sahnesi, modallar
js/main.js          Açılış
docs/OYUN_PLANI.md  Tasarım belgesi
```

## Belgeler

- [Oyun Tasarım Planı](docs/OYUN_PLANI.md)
