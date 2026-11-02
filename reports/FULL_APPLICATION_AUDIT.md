# Kebab Empire — tam uygulama denetimi

Tarih: 1–2 Kasım 2026 · Sürüm: `main` (bu rapordan sonraki commit) · Ayrıntılar: [TEST_COVERAGE](TEST_COVERAGE.md) · [BUGS_AND_FIXES](BUGS_AND_FIXES.md) · [PERFORMANCE_REPORT](PERFORMANCE_REPORT.md) · [SECURITY_REPORT](SECURITY_REPORT.md)

## 1. Genel sağlık puanı: 84 / 100

Denetimde 1 kritik, 4 yüksek, 2 orta ve 2 düşük önemde hata bulundu; hepsi düzeltildi ve testle korunuyor. Test edilen kapsamda bilinen kritik ya da yüksek önemde açık hata kalmadı. Puanı aşağı çeken etkenler:
- Gerçek cihazda test yapılmadı.
- Veritabanı değişikliklerinin canlıya henüz uygulanmamış olması.
- Kalan orta ve düşük maddeler.

| Alan | Puan | Not |
| --- | --- | --- |
| İş mantığı ve veri bütünlüğü | 90 | Fuzz ve değişmez kurallar temiz; kritik fiyat açığı kapandı |
| Güvenlik | 85 | RLS 40/40; yarış ve günlük doğrulaması eklendi; canlıya dağıtım bekliyor |
| Kararlılık | 92 | 2 tur × 20 profil, 4.329 tık, 0 hata |
| Performans | 82 | Kayıt büyümesi giderildi; yedi şubeli hızlı hafta gerçek telefonda ölçülmeli |
| Arayüz / erişilebilirlik | 80 | Taşma yok, dokunma hedefleri düzeltildi; sanal klavye ve ekran okuyucu test edilmedi |
| Test altyapısı | 85 | Kalıcı takımlar ve betikler; satır kapsam ölçümü yok |

## 2. Mimari

- **İstemci:** Vanilla JavaScript, global `KE` ad alanı, ~7.400 satır. Vite derlemesi, PWA (servis çalışanı, çevrimdışı), Capacitor 7 ile Android APK. Dosyalar:
  - Oyun motoru: `sim.js`, `midday.js`, `progress.js`.
  - Diğer motor modülleri: `economy.js`, `farm.js`, `narrative.js`.
  - Kayıt: `save.js`. Doğrulama: `verify.js`.
  - Arayüz: `js/ui/*`, 20 ekran ve 115 eylem işleyicisi.
- **Determinizm:** Oyun her gün ve evre için tohumlu rastgelelikle oynanır. Oyuncunun servis hamleleri günlüğe yazılır; aynı tohum ve aynı hamleler birebir aynı günü üretir. Bu, 6 saat diliminde doğrulandı.
- **Depolama:** localStorage'da ana kayıt, yedek ve ayrı yarış kaydı; ayrıca 12 ayar anahtarı.
- **Backend (isteğe bağlı):** Supabase.
  - Anonim kimlik.
  - 6 tablo: `profiles`, `saves`, `day_results`, `events`, `errors`, `remote_config`.
  - `chain_state` tablosu.
  - 4 görünüm: `leaderboard_month`, `district_champions`, `leaderboard_race`, `funnel_days`.
  - Edge function `verify-day`: sabah kaydını hamle günlüğüyle yeniden oynatıp sıralama için doğrular.
- **Dış bağımlılıklar:** çalışma zamanında yalnızca `@supabase/supabase-js` ve yazı tipleri. Bildirim, zamanlanmış görev ya da arka plan işi yok. Bulut açıkken ölçüm olayları 20 saniyede bir gönderiliyor.

## 3. Test özeti

| | Sayı |
| --- | --- |
| Yürütülen otomatik test | 97 birim + 40 veritabanı + 154 görsel görünüm + 5 çalışma zamanı + 2 tur × 20 profil (4.329 tık) + uçtan uca |
| Geçen | Hepsi (son koşu) |
| Başarısız | 0 (son koşu) |
| Engellenen | 7 test türü: gerçek Android, gerçek iOS, Deno edge function, canlı Supabase, çok cihazlı bulut çakışması, sanal klavye, satır kapsam ölçümü |
| Ek simülasyon | 720 fuzz oyun günü (her CI'da) + ~26.000 oyun günlük denge simülasyonu |

## 4. Bulunan ve düzeltilen hatalar

| Önem | Sayı | Maddeler |
| --- | --- | --- |
| Kritik | 1 | Sınırsız fiyatla sınırsız ciro |
| Yüksek | 4 | Yarış sıralamasına sahte oyun; kayıt dosyasının sınırsız büyümesi (depolama kotası, bulut ve doğrulama sınırları); iki sekmede veri kaybı; denetim sırasında kırılan derleme (gönderilmeden yakalandı) |
| Orta | 2 | Sınırsız hamle günlüğü; 21–22 px dokunma hedefleri |
| Düşük | 2 | Edge function hata sızıntısı + girdi doğrulaması; prototip adlı hamle |

Ayrıntı, kök neden ve testler: [BUGS_AND_FIXES.md](BUGS_AND_FIXES.md). Ek sağlamlaştırmalar:
- İçerik güvenlik politikası (CSP) eklendi.
- "Haftayı hızlı geç" günler arasında arayüze nefes aldırıyor.

## 5. Kalan sorunlar

| Önem | Madde | Neden düzeltilmedi |
| --- | --- | --- |
| Orta | Migration 0003 ve 0004 ile edge function güncellemesi canlıya uygulanmadı | CI'da Supabase adımı atlanıyor; canlı veritabanına dokunmak bu denetimin kapsamı dışında. Uygulanana kadar yarış sıralaması ve yeni sınırlar sunucuda etkin değil |
| Orta | Gerçek cihaz testi yok | Ortamda emülatör yok |
| Düşük | Geliştirme bağımlılıklarında 12 bilinen açık (derleme araçları) | Zorla güncelleme derleme zincirini kırabilir; oyuncuya giden kodu etkilemiyor |
| Düşük | Bulut kaydı her kullanıcı için tek satır; iki cihazda aynı anda oynanırsa son yazan kazanır | Yüklemede seçim penceresi var; tam birleştirme tasarım kararı gerektirir |
| Düşük | CSP Supabase'i `*.supabase.co` alan adıyla varsayıyor | Özel alan adı kullanılırsa CSP güncellenmeli |
| Bilgi | Personel görünümü tohumsuz rastgele | Oyun sonucunu etkilemiyor |

## 6. Güvenlik

Kritik fiyat açığı ve yarış sıralaması hilesi kapatıldı. RLS gerçek veritabanında 40 senaryoyla doğrulandı: kullanıcılar arası veri sızıntısı yok, sonuç satırları istemci tarafından doğrulanmış yapılamıyor. XSS yüzeyi kaçışlı; CSP eklendi. Çalışma zamanı bağımlılıklarında bilinen açık yok. Ayrıntı: [SECURITY_REPORT.md](SECURITY_REPORT.md).

## 7. Performans

- Açılış: 280–512 ms soğuk, 154–216 ms sıcak (bulut konteyneri, Chromium).
- Yedi şubeyle bir oyun günü 200–400 ms.
- 730. gündeki kayıt 3,6 MB'tan 0,73 MB'a, açılışı 410 ms'den 83 ms'ye indi.
- 60 günlük oturumda bellek sızıntısı yok.

Ayrıntı: [PERFORMANCE_REPORT.md](PERFORMANCE_REPORT.md).

## 8. Veri bütünlüğü

- Kayıt gidiş-dönüşü (yaz → aç) her 7 günde bir birebir aynı (fuzz).
- Bozuk ana kayıt yedekten açılıyor; ikisi de bozuksa çökme yok.
- Depolama doluysa yazma başarısız dönüyor ve oyuncu uyarılıyor.
- Ömür boyu toplamlar kırpma sonrası doğru.
- İki sekme ilerlemeyi ezemiyor.
- Sunucu yeniden oynatması rastgele eylemli günlerde tuttu.

## 9. Arayüz ve cihaz uyumu

7 cihaz boyutunda (320×568 ile 1366×768 arası, dikey ve yatay) 154 görünüm tarandı:
- Ekran dışına taşan öğe, kesilen yazı ya da gerçek çakışma yok.
- Dokunma hedefleri telefonda en az 32 piksel, her boyutta en az 28 piksel.

Profiller dil (TR/EN/DE), ekran döndürme, geri tuşu ve yeniden açma senaryolarında hatasız.

## 10. Test edilemeyen alanlar

Gerçek Android/iOS cihaz, Deno edge function, canlı Supabase, iki cihazda eşzamanlı bulut, sanal klavye, ekran okuyucu ile gezinme, satır kapsam yüzdesi.

## 11. Önerilen sonraki adımlar

1. Migration 0003 ve 0004'ü canlı Supabase'e uygula; `verify-day`'i yeniden dağıt. Ardından yarış sıralamasını aç.
2. APK'yı en az bir orta sınıf Android telefonda dene: haftayı hızlı geç süresi, yakınlaştırma, çekmece, klavye.
3. CI'a `npm run audit:db` ve kısa bir profil koşusu ekle (ör. 3 profil × 40 adım).
4. Ana paketi parçalara böl (217 KB gzip).
5. Ekran okuyucu (TalkBack) ile bir tur.

## 12. Üretime hazırlık

- **Web/PWA (bulutsuz, tek oyunculu):** hazır. Bilinen kritik/yüksek hata yok; çevrimdışı çalışıyor; kayıt güvenli.
- **Sıralama ve haftalık yarış:** migration ve edge function canlıya dağıtıldıktan sonra hazır. O zamana kadar yarış yalnızca cihazda puan tutuyor.
- **Android APK:** gerçek cihaz testinden sonra mağazaya hazır sayılmalı. Şu an hata ayıklama (debug) imzalı derleniyor; mağaza için sürüm imzası gerekiyor.

## Denetimin kendisi hakkında

Çalıştırılmadan "geçti" denen test yok. Sayıların hepsi bu oturumdaki koşulardan. Yanlış alarm olduğu doğrulanan bulgular (saat dilimi, bellek sızıntısı, çakışma uyarıları) ayrıca [BUGS_AND_FIXES.md](BUGS_AND_FIXES.md) içinde listelendi.
