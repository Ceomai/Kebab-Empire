# Hatalar ve düzeltmeler

Denetim tarihi: 1–2 Kasım 2026. Her hata yeniden üretildi, kök nedeni bulundu, düzeltildi ve kalıcı bir testle korundu. "Test" sütunundaki dosyalar `npm test` ile her CI koşusunda çalışır.

| No | Önem | Hata | Kök neden | Düzeltme | Test |
| --- | --- | --- | --- | --- | --- |
| BUG-01 | Kritik | Fiyat piyasanın 1 milyon katına yazılınca dükkân tek günde 3 milyar ₺ ciro yapıyor | Fiyat kutusu her pozitif sayıyı kabul ediyordu; müşterinin fiyattan kaçma olasılığı %95'te kesiliyordu (%5 her fiyata alıyordu); müdavimler ve paket siparişler fiyata hiç bakmıyordu | Fiyat 5 ₺ ile piyasanın 3 katı arasına sınırlı; kapıdan gelen 2,5 kattan, müdavim 2 kattan, paket 1,6 kattan pahalıya almıyor. Normal fiyatta sonuçlar birebir aynı | `tests/security.test.js` |
| BUG-02 | Yüksek | Haftalık yarış sıralamasına sıradan bir oyun sokulabiliyordu | Sunucu günlerin kendi içinde tutarlılığını doğruluyor, oyunun o haftanın yarış tohumuyla başladığını doğrulamıyordu; oyuncu istediği kadar yeni oyun açıp en şanslı tohumu gönderebilirdi | `KE.raceCheck`: tohum, mod, semt, hafta ve 7 gün sınırı; edge function her yarış gününde çağırır | `tests/security.test.js` |
| BUG-03 | Yüksek | Kayıt dosyası sınırsız büyüyordu: 7 şubeyle 365. günde ~1,8 MB, 730. günde ~3,6 MB | Muhasebe defteri her şubenin her gününü saatlik ayrıntısıyla sonsuza dek tutuyordu. Ana kayıt + yedek ile tarayıcı kotası (Safari ~5 MB) yaklaşık 1 oyun yılında dolar; bulut kaydı ve sunucu doğrulaması 2 MB sınırına ~400. günde takılırdı | Ayrıntılı satırlar son 12 hafta + içinde bulunulan ay; eskileri ömür boyu toplamlara (arşiv) katlanıyor. Şube geçmişi 120 gün, gazete 26 sayı, olay günlüğü 400 kayıt. Gün kapanışında yapıldığı için sunucu yeniden oynatmasıyla aynı. 730. günde 0,73 MB | `tests/storage.test.js` |
| BUG-04 | Yüksek | Oyun iki sekmede açıkken geride kalan sekme ilerlemeyi siliyordu (4. gün → 2. gün) | Kayıt "son yazan kazanır" mantığıyla çalışıyordu | Kayıt, aynı oyunun ileri bir gününü eski bir günle ezmeyi reddediyor; sekmeler `storage` olayıyla haberleşiyor, geride kalan sekme yazmayı bırakıp "güncel kaydı aç" diyor. Dosyadan ya da buluttan bilerek eski kayıt yüklemek serbest | `tests/storage.test.js`, `scripts/audit/runtime.cjs` |
| BUG-05 | Orta | Hamle günlüğünün boyutu sınırsızdı | Sunucu doğrulaması günlüğü yeniden oynatıyor; çok büyük bir günlük işlemciyi gereksiz yorabilirdi | `KE.logCheck` (biçim + en çok 20.000 hamle), veritabanında migration 0004 (en çok 20.000 öğe, 1 MB) | `tests/security.test.js`, `tests/db/rls-test.sh` |
| BUG-06 | Orta | Dokunma hedefleri 21–22 piksel (öneri kartı düğmeleri, kontrol listesi, çekmece tutamağı) | Küçük düğme stilleri masaüstü için tasarlanmıştı | Telefonda küçük düğmeler en az 32 px, normal düğmeler 40 px, çekmece tutamağı 28 px; her boyutta en az 28 px | `scripts/audit/visual.cjs` |
| BUG-07 | Düşük | Edge function iç hata metnini istemciye döndürüyordu; istek kimliği doğrulanmıyordu | `String(e)` doğrudan yanıta yazılıyordu | Genel hata mesajı + sunucu günlüğü; `id` pozitif tam sayı değilse 400 | Kod incelemesi (Deno yerelde yok) |
| BUG-08 | Düşük | Yeniden oynatmada `__proto__`, `constructor` gibi adlı hamleler nesnenin prototip fonksiyonlarını çağırabiliyordu | `ACTS[e.a]` kontrolü kalıtılmış özellikleri de kabul ediyordu | `hasOwnProperty` + argümanlar dizi değilse yok sayılıyor | `tests/security.test.js` |
| BUG-09 | Yüksek (gönderilmeden yakalandı) | Denetim sırasında yaptığım bir düzenleme (buluttan yükleme satırında tırnak hatası) derlemeyi kırdı | Toplu metin değişikliği; birim testleri kaynak dosyaları yüklediği için derleme hatasını görmedi | Düzeltildi; doğrulama döngüsüne `npm run build` eklendi | CI derleme adımı |

## Ek sağlamlaştırmalar

- **İçerik güvenlik politikası (CSP):** yalnızca kendi kaynağı ve Supabase; satır içi betik ve `eval` yok. Uçtan uca testte CSP ihlali yok.
- **Haftayı hızlı geç:** yedi günü tek seferde hesaplıyordu; telefonda ekran birkaç saniye donabilirdi. Artık günler arasında arayüze nefes aldırıyor ve ilerleme gösteriyor; olay kartında durma davranışı korunuyor.

## Bu denetimden önce bulunup düzeltilmiş olanlar

Aynı oturumun önceki aşamalarında, denge simülasyonu sırasında bulunup gönderilenler: fenalaşan tek kasiyer eve gidince şubenin 9 gün sıfır müşteriyle kapanması, müdürsüz şubede kasa/servisin boş kalması, acil kuryenin günün kalanına bakmaması, sunucu doğrulama paketinin güncellenmeyi unutulması (CI yakaladı).

## Hata olmadığı doğrulananlar (yanlış alarm)

- **Saat dilimi:** aynı tohumla oynanan 45 günün oyun durumu 6 saat diliminde (UTC, Los Angeles, Auckland, Kalküta, İstanbul, St. John's) bütün sayısal alanlarda birebir aynı. Farklı çıkan tek şey personelin görünümü; o bilerek tohumsuz rastgele üretiliyor ve doğrulamayı etkilemiyor.
- **Bellek sızıntısı:** 40 gün ve 200 ekran geçişinden sonra belgedeki düğüm sayısı aynı (1.753 → 1.766), çöp toplama sonrası bellek geri iniyor.
- **Art arda tıklama:** aynı işe alım düğmesine 10 hızlı tık tek işe alım yapıyor.
- **Görsel çakışma uyarılarının çoğu:** ilk taramadaki 369 "üst üste düğme" uyarısı, sabit alt çubuğun ve açık pencerelerin arkadaki kaydırılmış içerikle kesişmesiydi. Ölçüm yalnızca üstte kalan düğmeleri sayacak şekilde düzeltildi.
