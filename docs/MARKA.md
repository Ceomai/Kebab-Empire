# Marka ayarı: bir zincire özel sürüm

Oyunun görünen kimliği tek bir dosyadan değişir: `brands/<marka-id>.json`. Oyun ekonomisi (fiyatlar, malzemeler, denge, sunucu doğrulaması) **değişmez**; yalnızca ad, logo, renk ve metinler değişir. Bunu `tests/brand.test.js` her derlemede doğrular: markalı ve varsayılan oyun aynı tohumla birebir aynı sonucu verir.

Hazır örnek: `brands/usta-durum.json` (hayali "Usta Dürüm" markası, satış demosu için).

## Hızlı başlangıç

```bash
# 1) Marka dosyasını kopyala ve düzenle
cp brands/usta-durum.json brands/zincir-adi.json        # "id" alanını da "zincir-adi" yap

# 2) Logoyu koy (SVG önerilir, kare)
mkdir -p public/brands/zincir-adi && cp logo.svg public/brands/zincir-adi/logo.svg

# 3) Web sürümünü derle ve dene
BRAND=zincir-adi npm run build && npx vite preview

# 4) Telefon uygulaması için: ad, paket kimliği, simgeler
npm run brand zincir-adi && BRAND=zincir-adi npm run cap:sync

# Varsayılana dönmek için
npm run brand default
```

## Alanlar

| Alan | Ne yapar | Örnek |
|---|---|---|
| `id` | Dosya adıyla aynı olmalı | `"usta-durum"` |
| `gameName` | Oyunun adı: sekme başlığı, başlık ekranındaki tabela, metinlerde "Kebab Empire" geçen her yer | `"Usta Dürüm Oyunu"` |
| `nameParts` | Başlık ekranındaki iki renkli büyük yazı ve üst çubuk | `["Usta", "Dürüm"]` |
| `tagline` | Başlık ekranındaki şerit (dile göre yazılabilir, aşağıya bak) | `{ "tr": "...", "en": "...", "de": "..." }` |
| `logoUrl` / `logoSvg` | Logo: dosya yolu (`public/` altına göre) ya da satır içi SVG | `"brands/usta-durum/logo.svg"` |
| `colors` | Ana renkler: `primary`, `primaryDeep`, `accent`, `accentDeep`, `wine`, `flame`, `mint`, `mintDeep`, `paper`, `ink` | `{ "primary": "#1e6b45" }` |
| `rival` | Oyundaki rakip zincirin adı (varsayılan "Lüks Kebap") | `"Altın Şiş"` |
| `shopName` | Dükkân adı sabitlenir; yeni şubeler "Marka Semt" diye adlanır | `"Usta Dürüm"` |
| `products` | Ürünlerin görünen adları (ürün kimliğine göre) | `{ "et_durum": "Usta Et Dürüm" }` |
| `promo` | Gün sonu kuponu: `title`, `text`, `code`, `afterDay` (kaçıncı günden sonra), `needGoals` (günün bütün hedefleri tamamlanınca; isteğe bağlı tezgâh bonus hedefi sayılmaz), `url`, `urlLabel`, `terms` | bkz. örnek dosya |
| `orderUrl`, `orderLabel` | Menüde "Sipariş ver" bağlantısı (zincirin sipariş sitesi, yalnızca `https://`) | `"https://..."` |
| `app` | Uygulama: `id` (paket kimliği, örn. `com.zincir.oyun`), `name`, `themeColor`, `background`, `description` | bkz. örnek dosya |

**Dile göre metin:** `tagline`, `orderLabel` ve kuponun `title`, `text`, `urlLabel`, `terms` alanları ya tek bir metin ya da `{ "tr": "...", "en": "...", "de": "..." }` olabilir. Oyuncunun dili yoksa Türkçesi gösterilir. Marka adı, slogan ve kupon metinleri oyunun çeviri sözlüğünden geçmez (yani "Usta" İngilizcede "Master" olmaz).

**Türkçe ekler:** Oyun metinlerinde rakip ve oyun adından sonra gelen ekler yeni ada göre kurulur: `"Lüks Kebap"ı` → `"Altın Şiş"i`, `"Kral Döner"i`; `"Lüks Kebap"a` → `"Altın Şiş"e`.

**Denetim:** Derleme (`npm run build`) ve `npm run brand` marka dosyasını denetler, hatalıysa durur ve nedenini yazar:
- `id` dosya adıyla aynı; yalnızca küçük harf, rakam ve tire.
- `gameName` zorunlu. Metinlerde `<` ve `>` kullanılamaz.
- Bağlantılar (`orderUrl`, `promo.url`) yalnızca `https://`.
- Renkler `#rrggbb`. Kupon kodu yalnızca harf, rakam, `-` ve `_`.
- Logo: tercihen `logoUrl` ile `public/` altındaki bir dosya. `logoSvg` kullanılırsa betik, olay özniteliği (`onload` vb.) ya da dış bağlantı içeremez.

Ürün kimlikleri: döner modunda `tavuk_durum, et_durum, ekmek_arasi, iskender, pilav_ustu, tavuk_porsiyon, cag, tantuni, kunefe`; kebap modunda `adana, urfa, kuzu_sis, beyti, ali_nazik, lahmacun, ciger, icli_kofte, kunefe`.

## Simgeler (telefon uygulaması)

- Android: `brands/<id>/android-res/` içine `mipmap-mdpi … mipmap-xxxhdpi` klasörleri (Android Studio → Image Asset ile üretilebilir). `npm run brand <id>` bunları projeye kopyalar.
- iOS: `brands/<id>/ios-icon.png` (1024×1024, saydamsız PNG).
- Web/PWA simgeleri `public/icons/` altında; markalı yayında onları da değiştir.
- **Açılış ekranı (splash):** Android `android/app/src/main/res/drawable*/splash.png`, iOS `ios/App/App/Assets.xcassets/Splash.imageset/`. Marka betiği bunlara dokunmaz; markalı yayında elle değiştir.
- `npm run brand default` uygulama adını, paket kimliğini ve simgeleri (`mipmap-*` ve iOS AppIcon) depodaki özgün hâline döndürür (git gerekir). Elle değiştirdiğin açılış ekranlarını ayrıca geri al.

Markalı web derlemesinde sekme başlığı, iOS ana ekran adı (`apple-mobile-web-app-title`), açıklama ve tema rengi `index.html` içinde kendiliğinden markanınkiyle değişir.

## Markalı yayında unutulmaması gerekenler

- **Gizlilik politikası:** `public/privacy.html` Kebab Empire adını taşır ve markalı derlemede değişmez. Zincirin adıyla ayrı bir sayfa hazırla (örneğin `public/brands/<id>/privacy.html`, bu dosyayı örnek al; iletişim adresini zincirinkiyle değiştir). Mağaza formlarında o adres kullanılır.
- **Mağaza hesabı:** uygulama zincirin kendi Google/Apple geliştirici hesabından yayınlanmalı.
- **Kupon:** kod sabittir ve oyunda herkese aynı görünür; kasada "günde bir" gibi kuralları zincir uygular. Kişiye özel ya da tek kullanımlık kupon istenirse sunucu tarafı (kupon üretme ve doğrulama) ayrı bir iş kalemidir.
- **Metinler:** olay ve rehber metinlerinde "Lüks Kebap" ve "Kebab Empire" kendiliğinden markanınkilerle değişir. Başka bir metin değişikliği (örneğin semt adları) ayrı iş kalemidir.
