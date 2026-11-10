# Döner ve kebap zincirlerine satış rehberi

Amaç: oyunun zincire özel sürümünü (bkz. `docs/MARKA.md`) **ücretli pilot → yıllık lisans ve bakım** modeliyle satmak.

## 1. İdeal müşteri

Önceliği şu özelliklere göre ver (çoğu ne kadar uyuyorsa o kadar iyi):

- **5–100 şubeli** bölgesel ya da ulusal zincir veya franchise markası. Tek dükkânın bütçesi yetmez, dev zincirler de ajanssız konuşmaz.
- Instagram ve TikTok'ta **aktif**, kampanya yapan, genç kitleye hitap eden.
- **Kendi sipariş sitesi ya da uygulaması** olan (kupon ve sipariş bağlantısının değeri artar).
- **Büyüme dönemindeki** markalar: yeni şube ve franchise açan, yeni şehre giren.
- Almanya'da Türk kökenli döner zincirleri (Almanca çeviri hazır).

## 2. Nereden bulunur

| Kaynak                           | Ne yaparsın                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Google Haritalar                 | Büyük şehirlerde "döner", "dürüm", "kebap" ara. Aynı adla 5+ şubesi olanları listeye al.                                           |
| Yemek siparişi uygulamaları      | Aynı markanın kaç şubesi listelendiğine bak. Şube sayısı ve yayıldığı şehirler hakkında hızlı fikir verir.                         |
| Franchise dernekleri ve fuarları | Franchise veren markalar büyüme ve pazarlama odaklıdır. Dernek üye listeleri ve fuar katılımcı listeleri iyi kaynaktır.            |
| LinkedIn                         | Marka adı ile "pazarlama müdürü", "marka müdürü", "dijital pazarlama" ara. Karar vericiyi buradan bul.                             |
| Instagram                        | Markanın hesabındaki iletişim bilgisi; ayrıca hangi ajansla çalıştıklarını gönderilerdeki etiketlerden görebilirsin.               |
| Reklam ve dijital ajanslar       | Restoran markalarıyla çalışan ajanslar oyunu kendi müşterilerine "kampanya fikri" olarak götürebilir. Ajansa gelir payı teklif et. |

**Hedef liste (tablo sütunları):** Marka · şehir · şube sayısı · sipariş sitesi/uygulaması var mı · Instagram takipçisi · karar verici (ad, unvan, LinkedIn) · e-posta/telefon · ilk temas tarihi · durum (ulaşıldı / cevap / demo / teklif / pilot / kaybedildi) · not.

İlk hedef: **30–50 markalık liste**, bunlardan öncelikli **10–15**.

## 3. Hazırlık (görüşmeden önce)

1. **Markalı demo:** Hedef markanın renk ve logosuyla `brands/<marka>.json` hazırla, `BRAND=<marka> npm run build` ile derle, telefonda göster. Markayı izinsiz yayına koyma; demoyu yalnızca görüşmede kullan.
2. **60 saniyelik ekran kaydı:** başlık ekranı → tezgâhta dürüm hazırlama → gün sonu kuponu.
3. **Tek sayfalık tanıtım:** ne olduğu, zincire faydası, nasıl çalıştığı, pilot teklifi, iletişim.
4. **Varsa veri:** Android'de yayındaysan indirme, geri dönüş ve oturum süresi. Gerçek veri en güçlü argümandır.

## 4. Mesaj şablonları

**İlk e-posta (pazarlama müdürüne)**

> Konu: [Marka] için kendi döner oyununuz: müşteriyi şubeye getiren bir kampanya fikri
>
> Merhaba [Ad] Bey/Hanım,
>
> Döner dükkânı işletme oyunu Kebab Empire'ın geliştiricisiyim. Oyunu [Marka]'nın logosu, renkleri ve ürünleriyle size özel bir sürüme dönüştürebiliyorum: oyuncu tezgâhta [Marka] dürümü hazırlıyor, günün hedeflerini tamamlayınca şubelerinizde geçerli bir indirim kodu kazanıyor.
>
> 60 saniyelik demoyu buraya bıraktım: [bağlantı]. [Marka]'ya özel hazırladığım sürümü 15 dakikada telefonda göstermek isterim. Önümüzdeki hafta uygun olduğunuz bir zaman var mı?
>
> Saygılarımla,
> [Ad Soyad] · [telefon]

**LinkedIn bağlantı notu (300 karakter)**

> Merhaba [Ad], döner işletme oyunu geliştiriyorum ve [Marka]'ya özel, kupon kazandıran markalı bir sürüm hazırladım. 60 sn'lik demoyu paylaşmak isterim; uygunsa bağlanalım.

**Instagram / WhatsApp (kısa)**

> Merhaba, [Marka] için kendi döner oyununuzu hazırladım: oyuncular oyunda dürüm yapıp şubelerinizde geçerli indirim kodu kazanıyor. 60 sn'lik demoyu pazarlama ekibinize iletebilir miyim?

**Takip (4–5 gün sonra)**

> Merhaba [Ad] Bey/Hanım, geçen hafta [Marka]'ya özel oyun demosu için yazmıştım. Kısa bir görüşme yerine isterseniz demoyu telefonunuza yükleyip deneyebileceğiniz bir bağlantı da gönderebilirim.

**Son takip (10 gün sonra)**

> Merhaba, bu dönem gündeminizde değilse anlıyorum. Bir sonraki kampanya planlamanızda hatırlatmamı ister misiniz? Uygun gördüğünüz bir ay söylerseniz o zaman yazarım.

**Almanca kısa e-posta**

> Betreff: Ein eigenes Döner-Spiel für [Marke]
>
> Guten Tag [Name], ich entwickle das Döner-Managementspiel Kebab Empire und kann daraus eine Version im Design von [Marke] machen: Spieler bereiten an der Theke Ihre Dürüm zu und erhalten für erfüllte Tagesziele einen Rabattcode für Ihre Filialen. Eine 60-Sekunden-Demo: [Link]. Hätten Sie nächste Woche 15 Minuten Zeit?

## 5. 15 dakikalık görüşme akışı

1. **2 dk – Onların derdi:** "Genç müşteriye ulaşmakta ve tekrar gelmesini sağlamakta en çok neyi deniyorsunuz?" Dinle, not al.
2. **5 dk – Demo:** Kendi logolarıyla başlık ekranı → tezgâhta kendi ürünleri → gün sonu kuponu → menüdeki "Sipariş ver" bağlantısı.
3. **3 dk – Nasıl çalışır:** Uygulama kendi mağaza hesaplarından yayınlanır. Bakım ve mağaza güncellemeleri sende. Ekonomi ve oynanış hazır; uyarlama birkaç haftalık iş.
4. **3 dk – Teklif:** Önce ücretli pilot (3 ay, bir kampanyayla). Başarı ölçütlerini birlikte belirleyin: indirme, kupon kullanımı, sosyal medya etkileşimi.
5. **2 dk – Sonraki adım:** Yazılı teklif tarihi ve kararı kimin vereceği.

## 6. Sık itirazlar

| İtiraz                   | Cevap                                                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| "Kimse indirmez."        | Oyunu kampanyanın parçası yapıyoruz: şubede QR, sosyal medya, kupon. Pilotun amacı da bunu düşük maliyetle ölçmek.                           |
| "Pahalı."                | Sıfırdan bir oyun yaptırmanın küçük bir kısmı; oyun hazır, yalnızca markanıza uyarlanıyor. Pilotla başlayıp sonuca göre devam edebilirsiniz. |
| "Bakımını kim yapacak?"  | Yıllık bakım sözleşmesi: mağaza güncellemeleri, hata düzeltme, kampanya değişiklikleri; yanıt süreleri sözleşmede yazılı.                    |
| "Verilerimiz?"           | Oyun varsayılan olarak veri toplamıyor. Kupon ya da sadakat entegrasyonu istenirse KVKK sözleşmesiyle, sizin sorumluluğunuzda kurulur.       |
| "Ajansımızla konuşalım." | Memnuniyetle; ajansınızla birlikte çalışabilir, onlara da kampanya malzemesi sağlayabilirim.                                                 |

## 7. Teklif yapısı (rakamları her zincire göre ayarla)

- **Pilot (3 ay):** markalı sürüm, iki mağazada yayın, bir kupon kampanyası, aylık rapor. Sabit ücret; pilot başarılıysa ücretin bir kısmı yıllık lisanstan düşülür.
- **Yıllık lisans ve bakım:** kurulum sonrası yıllık ücret, aylık saat kotası, kapsam dışı işler için saatlik ücret.
- **Ek işler:** kişiye özel ya da tek kullanımlık kupon sistemi, sadakat programı entegrasyonu, gerçek şube haritası, sezon kampanyaları.

Fiyat aralıkları ve sözleşme maddeleri için bu sohbetteki "zincire satış" önerilerine bak; imzadan önce bir bilişim avukatına danış.

## 8. Haftalık çalışma ritmi

- **Pazartesi:** listeye 10 yeni marka ekle, karar vericileri bul.
- **Salı–Çarşamba:** 10–15 ilk mesaj, bekleyenlere takip.
- **Perşembe:** cevap verenlerle demo görüşmeleri.
- **Cuma:** teklif yaz, listeyi güncelle, ne işe yarayıp yaramadığına bak (hangi mesaj, hangi kanal cevap getirdi).

Soğuk mesajlarda cevap oranı genelde düşüktür; birkaç hafta boyunca düzenli gönderim gerekir. Hangi kanalın ve hangi mesajın daha çok cevap getirdiğini kendi listende ölçerek mesajı iyileştir.

## 9. Dikkat

- Bir markanın adını ya da logosunu, izni olmadan herkese açık bir yerde (mağaza, sosyal medya, web) kullanma. Demolar yalnızca görüşmede gösterilir.
- Görüşmeden önce gizlilik sözleşmesi (NDA) istenirse kabul et; kodun sahipliği sözleşmede netleşene kadar kaynak kodu paylaşma.
- Rakip iki zincirle aynı anda görüşebilirsin. Münhasırlık ancak sözleşmeyle ve karşılığında daha yüksek fiyatla verilir.
