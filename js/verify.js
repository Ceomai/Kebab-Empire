/* Kebab Empire — gün doğrulama (sunucuda ve testte aynı kod)
   Sabah durumu + oyuncu hamleleri + bahşiş kuralı ile günü yeniden oynatır ve iddia edilen
   sonucu karşılaştırır. Rastgelelik tohumlu olduğundan sonuç birebir aynı çıkmalıdır. */
(function () {
  KE.verifyDay = function (morningEnvelope, log, todayRule, claim) {
    let G;
    try { G = KE.SAVE.open(morningEnvelope); } catch (e) { return { ok: false, note: 'sabah kaydı açılamadı: ' + e.message }; }
    if (G.phase !== 'morning') return { ok: false, note: 'kayıt sabah evresinde değil' };
    if (claim.day != null && claim.day !== G.day) return { ok: false, note: 'gün uyuşmuyor' };
    const S = KE.replayService(G, log || []);
    KE.finalizeDay(G, todayRule || G.tipRule);
    const got = { served: 0, revenue: 0 };
    Object.values(S.branches).forEach((b) => { got.served += b.stats.served; got.revenue += b.stats.revenue; });
    got.revenue = Math.round(got.revenue);
    got.reputation = Math.round(G.reputation * 10) / 10;
    const same = got.served === claim.served && Math.abs(got.revenue - Math.round(claim.revenue)) <= 1 && Math.abs(got.reputation - Math.round(claim.reputation * 10) / 10) <= 0.1;
    return { ok: same, got, note: same ? 'doğrulandı' : `uyuşmadı: sunucu ${JSON.stringify(got)}` };
  };
})();
