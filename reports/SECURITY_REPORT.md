# Güvenlik raporu

Kapsam: istemci (tarayıcı/PWA/Android WebView), Supabase veritabanı kuralları (RLS), edge function `verify-day`, bağımlılıklar. Yıkıcı test yapılmadı; canlı Supabase projesine ve gerçek kullanıcı verisine dokunulmadı. Gizli anahtar bu rapora yazılmadı.

## Mimari ve güven sınırı

- Oyun tamamen istemcide çalışır. Kayıt tarayıcı deposunda (localStorage) durur. Oyuncu kendi kaydını değiştirebilir; bu tek kişilik oyunda risk değildir.
- Güven gerektiren tek yer sıralamalar. Sıralamaya yalnızca sunucuda yeniden oynatılarak doğrulanmış günler girer. Sunucu, sabah kaydını ve oyuncunun hamle günlüğünü aynı motorla yeniden oynatır. Zincir kontrolü, her sabahın bir önceki doğrulanmış gün sonundan türediğini denetler: kasa, itibar, usta yıldızı ve geçmiş açıklanamayan biçimde artamaz.
- Bulut isteğe bağlıdır. `VITE_SUPABASE_URL` tanımlı değilse hiçbir ağ isteği yapılmaz; oturum anonim Supabase hesabıdır.

## Bulgular

| No | Önem | Bulgu | Durum |
| --- | --- | --- | --- |
| SEC-01 | Kritik | Sınırsız fiyatla sınırsız ciro (oyun içi ekonomi + sıralama hilesi) | Düzeltildi (BUG-01) |
| SEC-02 | Yüksek | Yarış sıralamasına rastgele tohumlu oyun sokulabiliyordu | Düzeltildi (BUG-02). Edge function'ın yeniden dağıtılması gerekir |
| SEC-03 | Orta | Hamle günlüğü boyutu sınırsız (sunucuda işlemci tüketimi) | Düzeltildi (BUG-05). Migration 0004'ün uygulanması gerekir |
| SEC-04 | Düşük | Edge function iç hata metnini döndürüyordu; `id` doğrulanmıyordu | Düzeltildi (BUG-07) |
| SEC-05 | Düşük | Yeniden oynatmada prototip adlı hamleler | Düzeltildi (BUG-08) |
| SEC-06 | Düşük | İçerik güvenlik politikası (CSP) yoktu | Eklendi: yalnızca kendi kaynağı ve Supabase; satır içi betik yok |
| SEC-07 | Bilgi | Geliştirme bağımlılıklarında 12 bilinen açık (2 düşük, 10 orta: `deepmerge`, `glob`, `minimatch`). Hepsi derleme araçlarının (PWA eklentisi) alt bağımlılıkları; oyuncuya giden koda girmiyor. Çalışma zamanı bağımlılıklarında açık yok (`npm audit --omit=dev`: 0) | Açık; `npm audit fix --force` derleme zincirini kırabileceği için uygulanmadı |
| SEC-08 | Bilgi | Personel görünümü tohumsuz `Math.random` ile üretiliyor; yarışta herkes aynı yüzleri görmeyebilir | Kabul edildi; doğrulamayı etkilemez |

## Veritabanı (RLS) — gerçek PostgreSQL üzerinde çalıştırıldı

`tests/db/rls-test.sh` geçici bir PostgreSQL 16 veritabanı kurar. Supabase'in kimlik katmanını küçük bir iskeletle taklit eder (`tests/db/supabase-shim.sql`), dört migration'ın hepsini uygular ve iki kullanıcı, anonim kullanıcı ve servis rolüyle 40 senaryo dener. **Sonuç: 40/40 geçti.**

Doğrulananlar:
- Kullanıcılar birbirinin profilini, bulut kaydını, gün sonuçlarını ve ölçümlerini göremez, değiştiremez.
- Kimse sonucunu "doğrulanmış" ekleyemez ya da sonradan doğrulanmış yapamaz; sonuç satırları kullanıcı tarafından silinemez.
- Ciro, mod, yarış kimliği, hamle günlüğü ve kayıt boyutu sınırları veritabanında da uygulanır.
- Aynı gün iki kez gönderilemez.
- Sıralama görünümleri kullanıcı kimliği sızdırmaz; yarış günleri aylık sıralamaya ve semt şampiyonluğuna karışmaz.
- Huni görünümü ve zincir durumu oyunculara kapalıdır.
- Ölçüm yalnızca rıza veren kullanıcıdan ve yalnızca kendi adına eklenir.
- `delete_my_data` yalnızca çağıranın verisini siler; anonim çağıramaz.

## İstemci

- **XSS:** Arayüz `innerHTML` ile çiziliyor (26 yer). Bütün kullanıcı kaynaklı metinler (`owner`, dükkân adı, başka oyuncuların takma adları) `esc()` ile kaçışlı. Veritabanı takma adı yalnızca harf, rakam ve `._-` ile sınırlıyor. Kayıtta HTML ve emoji içeren ad testle denendi: metin olarak kalıyor. Arayüz ajanı alanlara `<script>`, 300 karakterlik metin ve emoji yazdı; sayfa hatası çıkmadı.
- **Yerel depo:** Hassas veri yok. Kayıt, dil ve ayar tercihleri, rıza ve Supabase oturum anahtarları (Supabase istemcisinin standart davranışı) tutuluyor.
- **Bilgi sızıntısı:** Üretim derlemesinde kaynak haritası (`.map`) yalnızca PWA servis çalışanı için üretiliyor.

## Yapılamayanlar

- Edge function Deno ile yerelde çalıştırılamadı (Deno kurulu değil). İçindeki doğrulama mantığı oyunla aynı kod olduğu için birim testleriyle sınandı (`tests/verify.test.js`, `tests/security.test.js`, `tests/midday.test.js`); HTTP katmanı yalnızca kod incelemesiyle denetlendi.
- Canlı Supabase projesine karşı test yapılmadı (kural gereği).
- Android APK gerçek cihazda ya da emülatörde çalıştırılmadı (bu ortamda emülatör yok).

## Dağıtım için yapılacaklar

1. `supabase/migrations/0003_race_and_funnel.sql` ve `0004_log_limits.sql` canlı veritabanına uygulanmalı (CI'da Supabase adımı atlanıyor).
2. `verify-day` edge function'ı yeniden dağıtılmalı (yarış ve günlük kontrolleri).
