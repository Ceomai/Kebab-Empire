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
| `tagline` | Başlık ekranındaki şerit | `"Usta Dürüm'ün mutfağına hoş geldin"` |
| `logoUrl` / `logoSvg` | Logo: dosya yolu (`public/` altına göre) ya da satır içi SVG | `"brands/usta-durum/logo.svg"` |
| `colors` | Ana renkler: `primary`, `primaryDeep`, `accent`, `accentDeep`, `wine`, `flame`, `mint`, `mintDeep`, `paper`, `ink` | `{ "primary": "#1e6b45" }` |
| `rival` | Oyundaki rakip zincirin adı (varsayılan "Lüks Kebap") | `"Altın Şiş"` |
| `shopName` | Dükkân adı sabitlenir; yeni şubeler "Marka Semt" diye adlanır | `"Usta Dürüm"` |
| `products` | Ürünlerin görünen adları (ürün kimliğine göre) | `{ "et_durum": "Usta Et Dürüm" }` |
| `promo` | Gün sonu kuponu: `title`, `text`, `code`, `afterDay` (kaçıncı günden sonra), `needGoals` (günün hedefleri tamamlanınca), `url`, `urlLabel`, `terms` | bkz. örnek dosya |
| `orderUrl`, `orderLabel` | Menüde "Sipariş ver" bağlantısı (zincirin sipariş sitesi) | `"https://..."` |
| `app` | Uygulama: `id` (paket kimliği, örn. `com.zincir.oyun`), `name`, `themeColor`, `background`, `description` | bkz. örnek dosya |

Ürün kimlikleri: döner modunda `tavuk_durum, et_durum, ekmek_arasi, iskender, pilav_ustu, tavuk_porsiyon, cag, tantuni, kunefe`; kebap modunda `adana, urfa, kuzu_sis, beyti, ali_nazik, lahmacun, ciger, icli_kofte, kunefe`.

## Simgeler (telefon uygulaması)

- Android: `brands/<id>/android-res/` içine `mipmap-mdpi … mipmap-xxxhdpi` klasörleri (Android Studio → Image Asset ile üretilebilir). `npm run brand <id>` bunları projeye kopyalar.
- iOS: `brands/<id>/ios-icon.png` (1024×1024, saydamsız PNG).
- Web/PWA simgeleri `public/icons/` altında; markalı yayında onları da değiştir.

## Markalı yayında unutulmaması gerekenler

- **Gizlilik politikası:** zincirin adıyla ayrı bir sayfa gerekir (`public/privacy.html` örnek alınabilir). Mağaza formlarında o adres kullanılır.
- **Mağaza hesabı:** uygulama zincirin kendi Google/Apple geliştirici hesabından yayınlanmalı.
- **Kupon:** kod sabittir ve oyunda herkese aynı görünür; kasada "günde bir" gibi kuralları zincir uygular. Kişiye özel ya da tek kullanımlık kupon istenirse sunucu tarafı (kupon üretme ve doğrulama) ayrı bir iş kalemidir.
- **Metinler:** olay ve rehber metinlerinde "Lüks Kebap" ve "Kebab Empire" kendiliğinden markanınkilerle değişir. Başka bir metin değişikliği (örneğin semt adları) ayrı iş kalemidir.
