/* Kebab Empire — simülasyon motoru (1/8): tohumlu rastgelelik
   Motor dosyaları sırayla yüklenir: rng → staff → branch → morning → service → player → close → replay.
   Bütün şubeler aynı anda, dakika dakika çalışır.
   Akış: müşteri gelir → kasada sipariş verir (kasiyer/garson) → usta pişirir → komi/garson masaya götürür
   → müşteri yer, bahşiş bırakır ve çıkar → masa toplanır. Ustalar yalnızca pişirir. */
(function () {
  /* ---------- Tohumlu rastgelelik ----------
     Oyun sonucunu etkileyen her rastgele karar KE.rand() ile verilir. Akış her gün ve evre için
     oyunun tohumundan yeniden kurulur; aynı tohum + aynı oyuncu hamleleri = birebir aynı gün. */
  function mulberry32(/** @type {number} */ a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  KE.mix = mix;
  function mix(/** @type {any[]} */ ...xs) {
    let h = 2166136261;
    xs.forEach((x) => {
      String(x)
        .split('')
        .forEach((c) => {
          h ^= c.charCodeAt(0);
          h = Math.imul(h, 16777619);
        });
      h ^= 0x9e37;
    });
    return h >>> 0;
  }
  let stream = mulberry32(1);
  KE.RNG = {
    seed: (G, tag) => {
      stream = mulberry32(mix(G.seed || 1, G.day, tag));
    },
    raw: (n) => {
      stream = mulberry32(n);
    }
  };
  KE.rand = () => stream();
})();
