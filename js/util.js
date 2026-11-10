/* Kebab Empire — ortak yardımcılar (KE.U)
   Motor ve arayüz dosyalarının hepsi buradakileri kullanır; aynı küçük işlevler dosya dosya yeniden yazılmaz.
   DİKKAT — rastgelelik kaynağı: KE.U.rnd ve KE.U.pick oyunun tohumlu akışından (KE.rand, js/sim/rng.js) çeker;
   oyun sonucunu etkileyen her karar bunlarla verilir. Yalnızca görünüşü etkileyen seçimler (kıyafet, saç rengi…)
   tohumsuz Math.random kullanır (bkz. characters.js pickCosmetic), yoksa yeniden oynatma bozulur. */
window.KE = window.KE || {};
(function () {
  /** v değerini [a, b] aralığına sıkıştırır */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  KE.U = {
    clamp,
    /** [a, b) aralığında tohumlu rastgele sayı */
    rnd: (a, b) => a + KE.rand() * (b - a),
    /** dizinin tohumlu rastgele bir elemanı */
    pick: (a) => a[Math.floor(KE.rand() * a.length)],
    /** oyunun mod verisi (döner / kebap) */
    mode: (G) => KE.MODES[G.mode],
    /** ürün kimliğinden ürün verisi */
    prod: (G, pid) => KE.MODES[G.mode].products.find((x) => x.id === pid)
  };
  /* Kimlikten şube / çalışan: bulunamazsa null döner (eski ya da silinmiş kimlik hata fırlatmasın) */
  KE.branchById = (G, id) => (G && G.branches.find((x) => x.id === id)) || null;
  KE.staffById = (G, id) => (G && G.staff.find((x) => x.id === id)) || null;
})();
