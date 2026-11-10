/* Kebab Empire — ortak yardımcılar (KE.U)
   Motor ve arayüz dosyalarının hepsi buradakileri kullanır; aynı küçük işlevler dosya dosya yeniden yazılmaz.
   DİKKAT — rastgelelik kaynağı: KE.U.rnd ve KE.U.pick oyunun tohumlu akışından (KE.rand, js/sim/rng.js) çeker;
   oyun sonucunu etkileyen her karar bunlarla verilir. Yalnızca görünüşü etkileyen seçimler (kıyafet, saç rengi…)
   tohumsuz Math.random kullanır (bkz. characters.js pickCosmetic), yoksa yeniden oynatma bozulur. */
window.KE = window.KE || {};
(function () {
  /** v değerini [a, b] aralığına sıkıştırır
   * @param {number} v
   * @param {number} a alt sınır
   * @param {number} b üst sınır
   * @returns {number}
   */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  KE.U = {
    clamp,
    /** [a, b) aralığında tohumlu rastgele sayı
     * @param {number} a
     * @param {number} b
     * @returns {number}
     */
    rnd: (a, b) => a + KE.rand() * (b - a),
    /** dizinin tohumlu rastgele bir elemanı
     * @template T
     * @param {T[]} a
     * @returns {T}
     */
    pick: (a) => a[Math.floor(KE.rand() * a.length)],
    /** oyunun mod verisi (döner / kebap)
     * @param {Game} G
     * @returns {any} KE.MODES[G.mode]: products, equipment…
     */
    mode: (G) => KE.MODES[G.mode],
    /** ürün kimliğinden ürün verisi
     * @param {Game} G
     * @param {string} pid ürün kimliği
     * @returns {any} ürün (bulunamazsa undefined)
     */
    prod: (G, pid) => KE.MODES[G.mode].products.find((x) => x.id === pid)
  };
  /* Kimlikten şube / çalışan: bulunamazsa null döner (eski ya da silinmiş kimlik hata fırlatmasın) */
  /** @type {(G: Game, id: string) => Branch | null} */
  KE.branchById = (G, id) => (G && G.branches.find((x) => x.id === id)) || null;
  /** @type {(G: Game, id: string) => Staff | null} */
  KE.staffById = (G, id) => (G && G.staff.find((x) => x.id === id)) || null;
})();
