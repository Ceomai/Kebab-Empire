# Supabase kurulumu

Oyun Supabase olmadan da tamamen çalışır (her şey tarayıcıya kaydedilir). Bulut kaydı, şehir sıralaması,
kullanım ölçümü ve hata raporu için:

1. [supabase.com](https://supabase.com) üzerinde yeni proje aç. **Bölge: Frankfurt (eu-central-1)** — KVKK için AB bölgesi.
2. **Authentication → Providers → Anonymous sign-ins**: aç. (E-posta bağlama için Email sağlayıcısı da açık kalsın.)
3. Şemayı yükle: Supabase CLI ile
   ```bash
   supabase link --project-ref <proje-ref>
   supabase db push
   ```
   ya da `supabase/migrations/0001_init.sql` dosyasını SQL Editor'da çalıştır.
4. Doğrulama fonksiyonunu yayınla:
   ```bash
   node scripts/build-edge.mjs
   supabase functions deploy verify-day
   ```
5. İsteğe bağlı: **Database → Extensions → pg_cron** aç ve eski ölçümleri her gece sil:
   ```sql
   select cron.schedule('telemetri-temizligi', '17 3 * * *', 'select public.purge_old_telemetry()');
   ```
6. GitHub deposunda **Settings → Secrets and variables → Actions → Variables** altına ekle:
   - `VITE_SUPABASE_URL` = `https://<proje-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = Project Settings → API → `anon` anahtarı (herkese açık anahtardır; güvenlik RLS ile sağlanır)

   Yerelde denemek için aynı değerleri `.env.local` dosyasına yaz (git'e girmez).

## Tablolar

| Tablo / görünüm | Ne tutar | Kim okur / yazar |
|---|---|---|
| `profiles` | takma ad, ölçüm rızası | yalnızca sahibi |
| `saves` | tek bulut kayıt yuvası (≤2 MB) | yalnızca sahibi |
| `day_results` | gün sonucu; doğrulanana kadar sabah kaydı + hamle günlüğü | sahibi ekler; `verified` alanını yalnızca `verify-day` değiştirir |
| `leaderboard_month`, `district_champions` | doğrulanmış günlerden aylık sıralama | herkes okur (takma adla) |
| `events` | kullanım ölçümü | yalnızca rıza verenler ekler; kimse okuyamaz (panelden bakılır) |
| `errors` | hata raporu (kişisel veri yok) | herkes ekler; kimse okuyamaz |
| `remote_config` | uzaktan denge/takvim ayarı | herkes okur; panelden değişir |

`delete_my_data()` çağrısı oyuncunun bütün bulut verisini ve anonim hesabını siler (oyunda: Menü → Hesap ve gizlilik).

## Hile önleme

Sıralamaya yalnızca **doğrulanmış** günler girer. İstemci gün sonunda sabah kaydını, servis sırasındaki
hamle günlüğünü ve iddia ettiği sonucu gönderir. `verify-day` aynı oyun motoruyla günü tohumdan yeniden
oynatır; müşteri sayısı, ciro ve itibar birebir tutmazsa sonuç sıralamaya girmez. Sabah kaydı ve günlük
doğrulamadan sonra silinir.

Sınır: sabah kaydının kendisi (kasa, ekip vb.) istemcide değiştirilmiş olabilir. Bunu kapatmak için bir sonraki
adım, bulut kaydını gün gün zincirlemek (her sabah kaydının bir önceki doğrulanmış günün sonucundan
türediğini kontrol etmek) olacaktır.
