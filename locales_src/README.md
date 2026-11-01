# Çeviriler

- `translations.json`: Türkçe kalıp → `{ en, de }`. Kalıplarda `{0}`, `{1}` sayı, para ya da bilinen ad (yemek, semt, ay…) yer tutucusudur.
- Yeni metinleri toplamak: `npm run build && npx vite preview --port 4173 &` sonra
  `COLLECT=locales_src/catalog.json node scripts/e2e.cjs doner` ve `… kebap`.
- `node scripts/build-locales.mjs` → `public/locales/en.json`, `de.json` üretir ve `missing.txt`'e eksikleri yazar.
- Yeni çeviri eklemek: `x*.tsv` dosyasına `türkçe<TAB>english<TAB>deutsch` satırı ekle ve betiği çalıştır.
- Özel isimler (usta adları, semtler, adalar) bilerek çevrilmez.
