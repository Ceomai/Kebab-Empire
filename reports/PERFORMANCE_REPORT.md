# Performans raporu

Bütün ölçümler bu denetimde gerçekten çalıştırıldı. Ortam: Linux bulut konteyneri, 4 çekirdek, Chromium (Playwright), Node 22. Gerçek telefon değil. Telefondaki süreler işlemciye göre 2–4 kat uzun olabilir.

## Açılış

| Ölçüm | Değer | Kaynak |
| --- | --- | --- |
| Soğuk açılış (sayfa → ana menü düğmesi) | 280–512 ms | `scripts/audit/runtime.cjs` (3 koşu) |
| Sıcak açılış (yenileme, servis çalışanı önbelleği) | 154–216 ms | aynı |
| `DOMContentLoaded` / `load` | 38 / 44 ms | Navigation Timing |
| Ana JS paketi | 688 KB (gzip 217 KB) | `dist/assets` |
| CSS | 119 KB (gzip 26 KB) | `dist/assets` |
| Dil dosyaları (yalnızca seçilen dil indirilir) | en/de ~210 KB | `dist/locales` |

## Oyun motoru

Ölçüm: tek tohum, 730 gün; 30. günden sonra 7 şube.

| Oyun günü | Şube | Bir günün simülasyonu | Kayıt boyutu (önce → şimdi) | Kayıt açma (önce → şimdi) |
| --- | --- | --- | --- | --- |
| 1 | 1 | 63 ms | 17 KB | 3 ms |
| 100 | 7 | 165–200 ms | 494 → 485 KB | 67 → 57 ms |
| 365 | 7 | 262–284 ms | 1.796 → 614 KB | 241 → 80 ms |
| 730 | 7 | 190–199 ms | 3.590 → 734 KB | 410 → 83 ms |

- Yedi şubeyle bir oyun günü ~200–400 ms sürüyor. Canlı serviste bu süre 13 saatlik oyun günü boyunca dakika dakika dağılıyor; "hızlı gün" ise tek seferde yapıyor.
- **Darboğaz bulundu ve giderildi (BUG-03):** kayıt boyutu oyun süresiyle doğrusal büyüyordu. Şimdi ~600–750 KB'ta sabitleniyor. Her gün sonu kaydında yapılan `JSON.stringify` + yazma süresi de buna bağlı olarak sınırlı kalıyor.

## Uzun oturum ve bellek

Senaryo: 60 oyun günü hızlı geçildi, her gün 5 ekran gezildi (300 ekran çizimi).

| Ölçüm | Başta | Sonda |
| --- | --- | --- |
| JS yığını (çöp toplama sonrası) | 2,4 MB | 6,0 MB |
| Olay dinleyicileri | 30–31 | 30–31 |
| Belgedeki öğe sayısı (40 gün sonra) | 1.753 | 1.766 |
| Toplam süre | — | ~20 s (gün başına ~335 ms, ekran çizimleri dahil) |

Sızıntı yok. Ham DOM düğüm sayacı çöp toplama öncesi yüksek görünüyordu; toplama sonrası geri iniyor, belge büyümüyor.

## Çok tohumlu denge koşuları (motor yükü)

- `scripts/sim-multi.cjs` ile 2 mod × 2 politika × 10 tohum, ardından 2 × 8 tohum yıllık simülasyon (toplam 72 yıl, yaklaşık 26.000 oyun günü) koşturuldu. Hata ya da çökme yok.
- Fuzz testi her CI koşusunda 720 oyun günü rastgele eylemle oynuyor (`tests/fuzz.test.js`).

## Ağ

- İnternet kesikken gün oynandı. Sayfa yenilendiğinde uygulama servis çalışanı önbelleğinden açıldı ve kayıttan devam etti.
- Bulut kapalıyken hiç ağ isteği yapılmıyor. Açıkken ölçüm olayları 20 saniyede bir toplu gönderiliyor (`src/cloud.js`).

## Öneriler

1. Ana JS paketi 217 KB (gzip). Yer ekranları (çiftlik, ajans, belediye) ayrı parçalara bölünürse ilk açılış hızlanır; zorunlu değil.
2. Yedi şubede günlük simülasyon gerçek telefonda 1 saniyeye yaklaşabilir. "Haftayı hızlı geç" 7 günü tek seferde yaptığı için orta sınıf telefonda birkaç saniye donma olabilir. İleride günler arasında ekranı güncellemek (`setTimeout` ile bölmek) iyi olur.
3. Gerçek Android cihazda ölçüm yapılmalı (bu ortamda yapılamadı).
