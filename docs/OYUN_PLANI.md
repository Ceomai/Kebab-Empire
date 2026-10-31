# Kebab Empire: Oyun Tasarım Planı

Bu belge, oyunun bütün sistemlerini ve geliştirme sırasını tanımlar. İşletme yönetimi türünün bilinen döngüsünden esinlenir: personel al, ekipman yükselt, şube aç. Bütün mekanikler ve içerik ise döner/kebap dünyası için özgün olarak tasarlanmıştır.

---

## 1. Oyunun özü

- **Tür:** 2D işletme simülasyonu. Renkli ve animasyonlu, çizgi film tarzında.
- **Platform:** Tarayıcı. Masaüstü ve telefon uyumlu, kayıt tarayıcıda tutulur.
- **Amaç:** Tek bir küçük dükkândan başlayıp şehre yayılan bir zincir kurmak.

## 2. Açılış akışı

1. **Açılış ekranı:** Logo animasyonu ve "Yeni Oyun / Devam Et".
2. **Mod seçimi:** Dönerci ya da Kebapçı.
3. **Semt seçimi:** Hayali İstanbul haritasından ilk dükkânın semti seçilir. Seçim dükkânın görünümünü değiştirmez; bütün semtlerde aynı başlangıç dükkânı açılır. Semt; müşteri karışımını, kirayı ve rakip sayısını belirler. Bu yüzden seçim ekranında her semtin bir bilgi kartı gösterilir.
4. **İlk usta seçimi:** Bütçeye uygun 3 aday ustadan biri seçilir.
5. **Giriş hikâyesi:** Babadan kalan dükkânın açılışı.
6. **1. gün başlar.**

## 3. Modlar: Dönerci ve Kebapçı

| Alan | Dönerci | Kebapçı |
|---|---|---|
| Ürünler | Tavuk ve et döner, dürüm, iskender, porsiyon | Adana, Urfa, şiş, beyti, ali nazik, lahmacun, ciğer |
| Ana ekipman | Döner ocağı, kesme bıçağı, kesim robotu | Mangal, ocakbaşı tezgâhı, lahmacun fırını |
| Hız ve kâr | Hızlı servis, çok müşteri, düşük kâr payı | Yavaş servis, masaya oturan müşteri, yüksek kâr payı |
| Kritik kaynak | Et yaprağı hazırlığı, döner çubuğu kapasitesi | Kömür, kıyma kalitesi, usta becerisi |
| Personel | Dönerci ustası, kasiyer, paketçi, kurye | Kebap ustası, mangalcı, lahmacuncu, garson, komi |
| Müşteri tipi | Öğrenci, işçi, gece çıkışı, paket sipariş | Aile, iş yemeği, özel gün sofraları |
| Dekor | Modern ve neon, sokak büfesi | Ahşap, bakır, yer sofrası, çini |
| Rastgele olaylar | Gece yarısı yoğunluğu, maç günü | Düğün siparişi, iftar, kömür krizi |

Oyun tek bir motor üzerinde çalışır. Her mod kendi veri dosyasıyla gelir: menü, ekipman, personel, olaylar ve metinler. Böylece ileride yeni modlar (lahmacuncu, pideci...) kolayca eklenebilir.

## 4. Harita: İstanbul'dan esinlenen hayali şehir

Kuşbakışı, canlı bir harita. Ortasından bir boğaz geçer; Avrupa ve Anadolu yakaları, köprüler, vapur ve martı animasyonları vardır. Gündüz ve gece döngüsü işler.

### Semtler

| Semt | Esinlendiği yer | Müşteri profili | Kira |
|---|---|---|---|
| Kadıçeşme | Kadıköy | Öğrenci, gece çıkışı, genç | Orta |
| Sultanpazarı | Eminönü / Sultanahmet | Turist, gurme, esnaf | Yüksek |
| Kulealtı | Levent / Maslak | Beyaz yaka, hızlı öğle yemeği | Çok yüksek |
| Bostansahil | Caddebostan | Aile, hafta sonu kalabalığı | Yüksek |
| Merterli Sanayi | Merter / İkitelli | İşçi, inşaat ekibi | Düşük |
| Kampüstepe | Avcılar / Beyazıt | Öğrenci | Düşük |
| Beşiktepe | Beşiktaş | Karışık, maç günü yoğunluğu | Orta-Yüksek |

### Haritadaki noktalar

- **Dükkânım:** Restoranın içi ve servis.
- **Hal ve kasap:** Malzeme alımı, tedarikçi pazarlığı, kalite seçimi.
- **Muhasebe ofisi:** Bütçe, bordro, raporlar, bahşiş kuralı.
- **Usta Pazarı / Lonca:** Usta transferi, teklif ve pazarlık.
- **İş ve İşçi Bulma Kurumu:** Diğer personelin alımı, eğitimi, işten çıkarılması.
- **Terzi:** Kostüm satın alma.
- **Mobilyacı ve dekoratör:** Dekor ve ekipman.
- **Banka:** Kredi, faiz, şube yatırımı.
- **Belediye:** Ruhsat, denetim, ceza, harç.
- **Reklam ajansı:** Tabela, sosyal medya, el ilanı kampanyaları.
- **Mahalle kahvesi:** Hikâye olayları, söylentiler, rakip haberleri.
- **Şube arsaları:** Henüz açılmamış semtler.

## 5. Oyun döngüsü

**Gün (yaklaşık 3–5 dakika):**
- **Sabah hazırlığı:** Stok kontrolü, vardiya ataması, fiyat ayarı.
- **Servis:** Varsayılan olarak personel servisi yürütür. Oyuncu istediği an "Tezgâha geç" düğmesiyle siparişleri kendisi hazırlayabilir: döner kesme, şiş çevirme, dürüm sarma gibi mini oyunlar. Oyuncu tezgâhtayken o pozisyondaki çalışan mola verir ve morali hafifçe artar. Oyuncunun hızlı ve doğru servisi bahşişe yansır.
- **Kapanış:** Günlük rapor, bahşiş dağıtımı ve gün sonu günlüğü.

**Hafta sonu:** Haftalık bilanço, personel değerlendirmesi, mahalle gazetesi, zaman zaman rakip hamlesi.

**Ay sonu:** Maaşlar, SGK, kira, faturalar, vergiler. Ardından aylık kâr/zarar tablosu ve büyüme kararları.

## 6. Usta sistemi

Her usta bir ya da birkaç **uzmanlık ürünü** ile gelir. Uzmanlık o ürünün kalitesini, onu seven müşterileri dükkâna çekmeyi, bahşişi ve maliyeti etkiler.

### Usta kartı

- **İsim ve uzmanlık ürünleri:** Kartta önce bunlar görünür. Her ürün ★1–5 arası.
- **Kimlik:** Memleket ve deneyim yılı. Yöre; portredeki kıyafete, diyaloglardaki konuşma tarzına ve konsept uyumuna yansır. Tek başına bir yetenek bonusu vermez.
- **Yetenekler:** Hız, kalite, tutarlılık (hata oranı), fire kontrolü, öğretme.
- **Kişilik özelliği:** Örnekler: Mükemmeliyetçi (yavaş ama kaliteli), Gösterişçi (müşteri izlerken bahşiş artar), Huysuz (moral düşünce kalitesi sert düşer).
- **Maliyet:** Maaş beklentisi ve işe alım (transfer) bedeli.

Örnek kart:

> **Halil Usta**: Urfa ★5 · Ciğer ★5
> *Memleket: Şanlıurfa · 22 yıllık ocakbaşı ustası*

### Dönerci ustaları (örnekler)

| Usta | Uzmanlık | Artı | Eksi | Maliyet |
|---|---|---|---|---|
| İsmail Usta (Bursa) | İskender ★5, yaprak döner ★4 | Aileleri ve iskender severleri çeker | Yavaş, tereyağı maliyeti yüksek | Yüksek |
| Kadir Usta (Erzurum) | Cağ kebabı ★5 | Nadir ürün, gurme müşteri, yüksek bahşiş | Tek ürüne odaklı | Yüksek |
| Selim Usta | Tavuk döner ★4, dürüm ★4 | Çok hızlı, öğrencileri çeker | Et dönerde ★2 | Orta |
| Çırak Burak | Dürüm ★2 | Ucuz, gelişime açık | Hata oranı yüksek | Düşük |

### Kebapçı ustaları (örnekler)

| Usta | Uzmanlık | Artı | Eksi | Maliyet |
|---|---|---|---|---|
| Mahmut Usta (Adana) | Adana ★5 | Acı severleri ve gece müşterisini çeker | Gösterişçi, sahne ister | Yüksek |
| Halil Usta (Şanlıurfa) | Urfa ★5, ciğer ★5 | Sabah ciğer servisini açar | Kömürü çok yakar | Yüksek |
| Hüseyin Usta (Gaziantep) | Ali nazik ★4, beyti ★4, lahmacun ★5 | Çok yönlü | Orta hız | Orta-Yüksek |
| Ramazan Usta | Kuzu şiş ★4 | Tutarlı, fire az | Diğer ürünlerde zayıf | Orta |

### Usta gelişimi

- Usta bir ürünü pişirdikçe o üründe deneyim kazanır. Belli eşiklerde yıldızı artar.
- **Usta-çırak bağı:** Ustanın yanına verilen çırak uzmanlığı yavaşça öğrenir. Uzun vadede ucuza usta yetiştirmenin yolu budur.
- **Rekabet riski:** Mutsuz bir usta rakipten teklif alabilir.

## 7. Müşteri tercih sistemi

Her müşterinin bir **favori ürünü**, bir **fiyat hassasiyeti**, bir **sabır süresi** ve bir **bahşiş eğilimi** vardır.

| Müşteri tipi | Favori | Sabır | Bahşiş eğilimi |
|---|---|---|---|
| Öğrenci | Tavuk dürüm, lahmacun | Orta | Düşük |
| Beyaz yaka | İskender, beyti | Düşük | Orta |
| Aile | Karışık porsiyon | Yüksek | Orta |
| Gurme / yemek yazarı | Cağ, Urfa, ciğer | Yüksek | Çok yüksek, itibar etkisi |
| Turist | İskender, Adana | Orta | Yüksek |
| İnşaat ekibi | Et döner, ayran | Düşük | Düşük, kalabalık gelir |
| Gece çıkışı | Dürüm, Adana | Düşük | Orta |

### Çekim

- Dükkânda bir ürünün ★4 ve üstü ustası varsa, o ürünü seven müşterilerin gelme olasılığı artar:
  `gelme olasılığı = taban × (1 + 0.15 × (yıldız − 2))`
- ★5 usta "ünlü usta" etiketini açar. Gazeteye haber olur ve başka semtlerden müşteri gelir.
- **Eşleşme bonusu:** Müşterinin favori ürününü uzman usta hazırlarsa "Ellerine sağlık!" animasyonu çıkar; memnuniyet ve bahşiş artar.

### Memnuniyet

```
Memnuniyet = Ürün kalitesi (usta yıldızı + malzeme kalitesi)
           + Hız (bekleme süresi ile sabrın karşılaştırması)
           + Ortam (dekor puanı + temizlik)
           + Servis (servis yapan çalışanın morali)
           − Fiyat algısı (fiyat ile müşterinin hassasiyeti)
```

## 8. Bahşiş sistemi

- `Bahşiş = Hesap × Bahşiş eğilimi × Memnuniyet çarpanı × Eşleşme bonusu`
- Bahşiş kavanozu tezgâhta görünür ve gün boyunca dolar.
- **Varsayılan kural:** Muhasebe ofisinden kalıcı bir dağıtım kuralı seçilir ve her gün kendiliğinden uygulanır. Gün sonu ekranındaki "Bugünlük değiştir" seçeneğiyle o güne özel başka bir kural seçilebilir.
- **Kurallar:**
  - **Eşit paylaşım:** Ekip morali dengeli artar.
  - **Ustaya ağırlık:** Usta sadakati artar; diğerlerinin morali biraz düşer.
  - **Performansa göre:** En çok servis yapan daha fazla alır; rekabet yaratır.
  - **Kasaya al:** Kısa vadede para kazanırsın; moral sert düşer, olay kartı tetiklenebilir.
- Bahşişler bordroda ayrı bir satırda görünür.

## 9. Çalışan morali

Her çalışanın 0–100 arası bir moral çubuğu ve buna göre değişen yüz ifadesi vardır.

| Morali artıran | Morali düşüren |
|---|---|
| Adil bahşiş payı | Bahşişe el koyma |
| Zamanında maaş ve zam | Maaş gecikmesi |
| Yeni kostüm | Fazla mesai, yorgunluk |
| Dinlenme odası, klima | Sıcak mutfak, kötü ekipman |
| Eğitim ve terfi | Haksız uyarı |
| Bayram ikramiyesi | Sürekli yoğun vardiya |

- **Yüksek moral (>75):** Hız +%10, kalite bonusu, güler yüz ve bahşiş artışı.
- **Düşük moral (<30):** Hata ve fire artar, geç kalma görülür, istifa ya da rakibe geçme riski doğar.

Bu bir döngüdür: mutlu çalışan, memnun müşteri getirir; memnun müşteri daha çok bahşiş bırakır; bahşiş çalışanı daha da mutlu eder.

## 10. Diğer çalışanlar

- **Kasiyer:** Hız, hata payı, güler yüz.
- **Garson** (kebapçıda öne çıkar): Hız, sohbet becerisi (bahşişi artırır), aynı anda bakabildiği masa sayısı.
- **Paketçi ve kurye:** Hız, kaza riski, paket sipariş puanı.
- **Bulaşıkçı ve temizlikçi:** Temizlik puanı; denetimi etkiler.
- **Lahmacuncu / pideci** (kebapçı): Fırın verimi.
- **Şube müdürü:** Yönetim becerisi; arka plan simülasyonunu etkiler.

## 11. Ekonomi, bütçe ve bordro

Değerler Türkiye'ye yakın tutulur. Bütün oranlar tek bir ayar tablosunda yer alır ve kodlamaya başlarken 2026'nın güncel değerleriyle karşılaştırılıp yuvarlanır.

**Günlük defter:** Ciro (nakit ve kart), ürün bazlı satışlar, malzeme maliyeti (et, ekmek, lavaş, sebze, kömür, gaz), fire oranı, bahşiş toplamı, günlük net.

**Haftalık rapor:** En çok satan ürünler, saat bazlı yoğunluk, memnuniyet trendi, tedarikçi borçları.

**Aylık bordro (her çalışan için):**
- Brüt maaş
- SGK işçi payı ve işsizlik sigortası işçi payı
- Gelir vergisi (kademeli dilimler) ve asgari ücret istisnası
- Damga vergisi
- Net maaş
- SGK işveren payı ve işsizlik sigortası işveren payı
- Fazla mesai, bayram ikramiyesi, yemek ve yol yardımı, kostüm yardımı
- Bahşiş payı (ayrı satır)
- Toplam işveren maliyeti

**Aylık gider tablosu:** Kira ve kira stopajı, elektrik, su, doğalgaz, internet, KDV, muhasebeci ücreti, belediye harçları, kredi taksiti, ekipman amortismanı, transfer bedelleri.

**Grafikler:** Ciro ve gider çizgileri, maliyet dağılımı, kâr marjı göstergesi.

**Dinamikler:** Malzeme fiyatları her ay enflasyonla artar. Yılbaşında asgari ücret zammı olayı tetiklenir.

## 12. Kostüm, dekor ve ekipman

**Kostümler:** temel önlük → markalı önlük → şef ceketi → yöresel kostüm.
- Yöresel kostüm örnekleri: Urfalı ustaya puşi ve yelek, Adanalı ustaya şalvar ve kuşak, iskender ustasına klasik beyaz ceket ve papyon.
- Etkileri: moral, konsept puanı, kostüme uygun ürünlerde ek bahşiş.
- Bazı kostümler yalnızca başarımla açılır.

**Ekipman:**

| Kategori | Dönerci | Kebapçı | Etki |
|---|---|---|---|
| Pişirme | Gazlı ocak → elektrikli → çift ocak | Kömür mangalı → bakır ocakbaşı → odun fırını | Kapasite, kalite |
| Hazırlık | Kıyma makinesi, döner kesme robotu | Zırh (el kıyması) tezgâhı | Hız, ustaya bonus |
| Soğutma | Tezgâh altı → soğuk oda | Aynı | Fire azalır |
| Servis | Self servis tezgâh, sipariş ekranı | Masa düzeni, yer sofrası köşesi | Kapasite, ortam |

**Dekor:** Çini pano, bakır sahan duvarı, neon tabela, nostaljik fotoğraflar, bitkiler, dış masalar ve benzeri. Her öğenin bir tarzı vardır: modern, geleneksel, sokak ya da lüks. Tarzlar uyumluysa konsept bonusu açılır. Örneğin geleneksel dekor, yöresel kostüm ve Urfalı usta bir aradaysa "Otantik Ocakbaşı" etiketi gelir; gurme ve turist çekimi artar.

## 13. Şubeler

- Haritadaki diğer semtlerde yeni şubeler açılır. Her semtin müşteri profili, kirası ve rakip yoğunluğu farklıdır.
- Oyuncu hangi şubedeyse orası canlı oynanır. Diğerleri **arka planda simüle edilir**. Simülasyonun sonucunu şube müdürünün becerisi, şubedeki ustaların uzmanlığı ve semtin müşteri profili belirler.
- Gün sonunda her şube için bir özet kartı gösterilir: ciro, bahşiş, moral, olaylar. Kritik olaylar oyuncuya karar için gelir; örneğin bir ustanın istifa etmek üzere olması.
- Ustalar şubeler arasında transfer edilebilir.
- Her şubenin kendi konsepti olabilir. İstenirse bütün şubelerde tek tip zincir kimliği kurulur: tedarik avantajı sağlar ama yerel bonuslar kaybedilir.
- **Merkezi mutfak:** Döner ya da kıyma merkezde hazırlanıp şubelere dağıtılır. Maliyet düşer, tazelik puanı biraz azalır.
- Muhasebe ofisinde şube bazlı ve konsolide raporlar bulunur.

## 14. Anlatı ve metin

- **Gün sonu günlüğü:** İşletme sahibinin ağzından, günün gerçek verilerinden şablonlarla üretilen kısa bir paragraf.
  > *"Bugün Hasan Usta yine erkenden gelmiş, ocağı yakmıştı. Öğlen inşaat ekibi akın etti; tavuk döner 13:40'ta bitti..."*
- **Olay kartları:** 2–3 seçenekli kararlar. Sonuçları sonraki günlere yansır. Örnekler:
  - Mahmut Usta'ya rakipten teklif geldi.
  - Bahşiş kavanozu kayboldu.
  - Ünlü bir yemek yazarı Urfa kebabını övdü.
  - Çırak Burak ilk ★3 dürümünü yaptı.
  - Belediye denetimi kapıda.
- **Mahalle gazetesi:** Haftalık manşetler.
- **Hikâye hattı:** Babadan kalan dükkândan başlayıp ilk şubeye, ödüllere ve bir finale uzanan ara hedefler.

## 15. Karakterler

Yuvarlak hatlı, sıcak renkli, ifadeli yüzleri olan çizgi film karakterleri. Temsil saygılıdır ve karikatüre kaçmaz.

| Karakter | Rol | Görsel ve kültürel detay |
|---|---|---|
| Hasan Usta | Kıdemli usta | Gür bıyık, beyaz önlük. Sabırlı, usta-çırak geleneğinden |
| Zeynep Hanım | Muhasebeci | Gözlük, klasör. Titiz, rakamlarla konuşur |
| Mehmet | Çırak / komi | Genç, kasket, enerjik. Hatalarıyla öğrenir |
| Ayşe Teyze | Müdavim | Başörtüsü, alışveriş filesi. Mahallenin sesi |
| Kasap Rıza | Tedarikçi | Kasap önlüğü. Pazarlıkçı ama sözünün eri |
| Bülent Bey | Belediye müfettişi | Takım elbise, evrak çantası. Kuralcı |
| Kurye Emre | Paket servis | Kask, mont, telefon |
| "Lüks Kebap" sahibi | Rakip | Şık ceket, altın saat. Rekabetçi |
| Müşteriler | Çeşitli | Farklı yaş, giyim ve kültürlerden rastgele kombinasyonlar |

**Teknik:** Katmanlı SVG parçaları (yüz, saç, kıyafet, aksesuar). Göz kırpma, konuşma, sevinme ve kızma animasyonları. Müşteriler bu parçaların rastgele birleşimleriyle üretilir.

## 16. Görsel kimlik

- **Renkler:** Közlenmiş turuncu, biber kırmızısı, sumak bordosu, nane yeşili, çini mavisi.
- **Yazı tipleri:** Tabela havasında karakterli bir başlık fontu ve okunaklı bir gövde fontu.
- **Desen ve detay:** Çini motifleri, el yazısı tabela detayları.
- **Animasyon:** Dönen döner, köz, duman, yükselen para sayaçları.

## 17. Teknik mimari

Tarayıcıda çalışan HTML5 oyunu (Canvas ve SVG), harici kütüphane gerektirmez.

| Modül | Görev |
|---|---|
| Oyun durumu ve kayıt | Tek durum nesnesi, tarayıcıda kayıt |
| Zaman motoru | Gün, hafta, ay döngüsü |
| Ekonomi ve bordro | Ciro, gider, vergi, bordro hesapları; ayar tablosu |
| Müşteri simülasyonu | Geliş, tercih, memnuniyet, bahşiş |
| Personel ve usta | Yetenek, uzmanlık, moral, gelişim |
| Şube simülasyonu | Arka planda çalışan şubeler |
| Olay ve metin motoru | Olay kartları, günlük, gazete |
| Karakter oluşturucu | SVG parça sistemi ve animasyonlar |
| Sahneler ve arayüz | Harita, dükkân, ofis ekranları, tezgâh mini oyunları |

Moda özel içerik ayrı veri nesnelerinde tutulur.

## 18. Geliştirme aşamaları

1. **Çekirdek:** Açılış akışı, harita menüsü, gün döngüsü, usta ve müşteri tercih sistemi, personel servisi.
2. **Ekonomi:** Günlük, haftalık ve aylık raporlar, Türkiye bordrosu, bahşiş ve moral döngüsü, grafikler.
3. **Karakterler:** SVG karakter oluşturucu, yöresel kıyafetler, diyaloglar, usta pazarı.
4. **Anlatı ve kişiselleştirme:** Gün sonu günlükleri, olay kartları, gazete, kostüm, dekor, ekipman.
5. **Büyüme:** Şubeler, arka plan simülasyonu, merkezi mutfak, konsolide raporlar.
6. **Tezgâh ve cila:** Tezgâh mini oyunları, animasyonlar, ses efektleri, denge ayarları, telefon uyumu.

## 19. Karar kaydı

| Konu | Karar |
|---|---|
| Servis | Varsayılan personel servisi; oyuncu istediğinde tezgâha geçer |
| Ekonomi | Türkiye değerlerine yakın, yuvarlanmış oranlar |
| Harita | İstanbul'dan esinlenen hayali şehir ve semtler |
| Başlangıç semti | Oyuncu seçer; dükkânın görünümünü etkilemez |
| Bahşiş dağıtımı | Varsayılan kural, gün sonunda o güne özel değiştirilebilir |
| Usta kimliği | İsim ve uzmanlıkla tanımlanır; yöre kimlik kartında yer alır |
| Şubeler | Oyuncunun bulunmadığı şubeler arka planda simüle edilir |
