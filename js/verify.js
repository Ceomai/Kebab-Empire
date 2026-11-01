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
  /* ---------- Zincir: sabah kaydı bir önceki doğrulanmış günün sonundan mı türedi? ----------
     Sabah oyuncunun yapabildikleri: harcamak, kredi çekmek, olay kartını çözmek, hedef ödülü almak,
     işe almak/çıkarmak, fiyat ve menü ayarı. Bunların hiçbiri kasayı ya da itibarı aşağıdaki
     sınırların üstüne çıkaramaz; ustaların yıldızı ve deneyimi sabah artamaz; geçmiş değişemez. */
  const clone = (o) => JSON.parse(JSON.stringify(o));
  KE.FRESH = { cash: 450000, reputation: 30 };
  KE.chainCheck = function (prevEnv, curEnv) {
    let P, Cu;
    try { Cu = KE.SAVE.open(clone(curEnv)); } catch (e) { return { ok: false, note: 'sabah kaydı açılamadı' }; }
    if (!prevEnv) {
      // zincirin ilk halkası: yeni başlamış bir oyun olmalı
      if (Cu.day !== 1) return { ok: false, note: 'zincir yok: sıralama yalnızca bulut açıkken başlanan oyunlarda geçerli' };
      if (Cu.cash > KE.FRESH.cash + 1 || Cu.reputation > KE.FRESH.reputation || Cu.ledger.days.length || Cu.branches.length !== 1) return { ok: false, note: 'ilk gün kaydı yeni oyun değil' };
      return { ok: true };
    }
    try { P = KE.SAVE.open(clone(prevEnv)); } catch (e) { return { ok: false, note: 'önceki gün açılamadı' }; }
    const bad = (n) => ({ ok: false, note: 'zincir kırık: ' + n });
    if (P.seed !== Cu.seed || P.saveId !== Cu.saveId || P.mode !== Cu.mode) return bad('farklı oyun');
    if (P.day !== Cu.day) return bad('gün atlanmış');
    // olay kartı en iyi seçenekle ne kadar kazandırabilirdi?
    let maxCash = P.cash, maxRep = P.reputation;
    if (P.pendingEvent) {
      P.pendingEvent.choices.forEach((_, i) => { const g = KE.SAVE.open(clone(prevEnv)); try { KE.resolveEvent(g, i); } catch (e) { /* yok */ } maxCash = Math.max(maxCash, g.cash); maxRep = Math.max(maxRep, g.reputation); });
    }
    if (Cu.flags && Cu.flags.empire && !(P.flags && P.flags.empire)) maxRep += 5; // imparatorluk satın alımı
    const newLoans = (Cu.loans || []).slice((P.loans || []).length).reduce((a, l) => a + (l.amount || 0), 0);
    if ((Cu.loans || []).length < (P.loans || []).length) return bad('kredi silinmiş');
    const goalCash = Object.keys(Cu.goals || {}).filter((k) => !(P.goals || {})[k]).reduce((a, k) => a + ((KE.GOALS.find((g) => g.id === k) || {}).reward || 0), 0);
    if (Cu.cash > maxCash + newLoans + goalCash + 1) return bad('kasa açıklanamayan biçimde arttı');
    if (Cu.reputation > maxRep + 0.6) return bad('itibar artmış');
    if (Cu.ledger.days.length !== P.ledger.days.length || JSON.stringify(Cu.ledger.days.slice(-1)) !== JSON.stringify(P.ledger.days.slice(-1))) return bad('geçmiş değişmiş');
    for (const s of Cu.staff) {
      const o = P.staff.find((x) => x.id === s.id);
      if (!o) continue;
      for (const [pid, st] of Object.entries(s.spec || {})) if (st > ((o.spec || {})[pid] || 0)) return bad('usta yıldızı artmış');
      for (const [pid, xp] of Object.entries(s.xp || {})) if (xp > ((o.xp || {})[pid] || 0) + 1e-6) return bad('deneyim artmış');
      for (const k of ['speed', 'quality', 'consistency', 'skill', 'friendly']) if ((s[k] || 0) > (o[k] || 0) + 1e-9) return bad('yetenek artmış');
    }
    return { ok: true };
  };
  /* Doğrulama + zincir; başarıda bir sonraki halkanın başlangıcı olacak gün sonu kaydını döndürür */
  KE.verifyChain = function (prevEnd, morningEnv, log, todayRule, claim) {
    const c = KE.chainCheck(prevEnd, morningEnv);
    if (!c.ok) return c;
    const G = KE.SAVE.open(clone(morningEnv));
    const r = KE.verifyDay(morningEnv, log, todayRule, claim);
    if (!r.ok) return r;
    // gün sonu durumu (ertesi sabah, oyuncu müdahalesinden önce)
    const S = KE.replayService(G, log || []); void S;
    KE.finalizeDay(G, todayRule || G.tipRule);
    return Object.assign(r, { end: KE.SAVE.envelope(G) });
  };
})();
