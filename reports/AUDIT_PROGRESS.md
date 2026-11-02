# Denetim ilerleme kaydı

Oturum kesilirse buradan devam edilir. Tarih: 2026-11-01.

## Tamamlanan
- [x] F1 Mimari ve envanter: 20 ekran, 115 eylem işleyicisi, 107 arayüz eylem bağlantısı, 15 localStorage anahtarı, 5 Supabase tablosu + 4 görünüm, 1 edge function.
- [x] Ölü düğme statik taraması: işleyicisi olmayan `data-a` yok.
- [x] RLS incelemesi (migrations 0001–0003).
- [x] BUG-01 (kritik) sınırsız fiyat ile sınırsız ciro — düzeltildi, `tests/security.test.js`.
- [x] BUG-02 (yüksek) yarış sıralamasına rastgele tohumlu oyun sokulabiliyordu — `KE.raceCheck`, edge function.
- [x] BUG-03 (orta) hamle günlüğü boyutu sınırsızdı — `KE.logCheck`, migration 0004.
- [x] BUG-04 (düşük) yeniden oynatmada prototip adlı hamle — `hasOwnProperty`.
- [x] BUG-05 (düşük) edge function iç hata metnini istemciye döndürüyordu.

## Sırada
- [ ] Motor fuzz testi (rastgele eylemler, değişmezler, kayıt gidiş-dönüş, doğrulama)
- [ ] Playwright persona + rastgele tıklama ajanı (mobil/masaüstü)
- [ ] Kayıt bozulması, uzun/emoji girdi, saat dilimi
- [ ] Çevrimdışı, çoklu sekme, yeniden açma
- [ ] Performans: açılış, gün süresi, kayıt boyutu/kota, bellek
- [ ] npm audit
- [ ] Raporlar
