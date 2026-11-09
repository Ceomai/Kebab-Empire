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
    // okul bağışı sabah itibar verir (seviye başına +3); bağış seviyesi geri gidemez
    const okul = ((Cu.charity || {}).okul || 0) - ((P.charity || {}).okul || 0);
    if (Object.entries(P.charity || {}).some(([k, v]) => ((Cu.charity || {})[k] || 0) < v)) return bad('bağış geri alınmış');
    if (okul > 0) maxRep += 3 * okul;
    if ((Cu.loans || []).length < (P.loans || []).length) return bad('kredi silinmiş');
    // yeni krediler (öncekilerle eşleşmeyenler) bankanın o günkü tekliflerinden biri olmalı
    const oldLoans = (P.loans || []).slice(), offers = KE.loanOffers(P);
    const same = (a, b) => a.amount === b.amount && a.monthly === b.monthly && a.remaining === b.remaining;
    let newLoans = 0;
    for (const l of Cu.loans || []) {
      const i = oldLoans.findIndex((o) => same(o, l));
      if (i >= 0) { oldLoans.splice(i, 1); continue; }
      if (!offers.some((o) => o.amount === l.amount && o.monthly === l.monthly && o.months === l.remaining)) return bad('kredi teklifle uyuşmuyor');
      newLoans += l.amount;
    }
    const goalCash = Object.keys(Cu.goals || {}).filter((k) => !(P.goals || {})[k]).reduce((a, k) => a + KE.goalReward(Cu, KE.GOALS.find((g) => g.id === k) || {}), 0);
    if (Cu.cash > maxCash + newLoans + goalCash + 1) return bad('kasa açıklanamayan biçimde arttı');
    if (Cu.reputation > maxRep + 0.6) return bad('itibar artmış');
    if (Cu.contract && JSON.stringify(Cu.contract) !== JSON.stringify(P.contract)) {
      const o = KE.contractOffers(P).find((x) => x.id === Cu.contract.id);
      if (!o || o.pay !== Cu.contract.pay || o.cost !== Cu.contract.cost || o.qty !== Cu.contract.qty || Cu.contract.day !== Cu.day || KE.contractTaken(P)) return bad('toplu sipariş uydurulmuş');
    }
    if ((Cu.era || 1) !== (P.era || 1)) return bad('dönem değişmiş');
    if (Cu.weekly && P.weekly && JSON.stringify(Cu.weekly) !== JSON.stringify(P.weekly)) return bad('haftalık hedef değişmiş');
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
  /* Haftalık yarış: gün gerçekten o haftanın tohumuyla, o semtte ve o modda başlamış bir yarış oyunundan mı?
     (yoksa oyuncu sıradan bir oyunun en iyi tohumunu yarışa sokabilirdi) */
  KE.raceCheck = function (race, morningEnv, now) {
    if (!race) return { ok: true };
    const g = morningEnv && morningEnv.game;
    if (!g || !g.race || g.race.week !== race) return { ok: false, note: 'yarış kaydı değil' };
    const R = KE.raceSetup(race);
    if (g.seed !== R.seed || g.mode !== R.mode || !g.branches || !g.branches[0] || g.branches[0].district !== R.district) return { ok: false, note: 'yarış tohumu uyuşmuyor' };
    if (g.day > KE.RACE_DAYS) return { ok: false, note: 'yarış 7 günle sınırlı' };
    if (now) { const cur = KE.raceWeek(now), prev = KE.raceWeek(new Date(now.getTime() - 7 * 864e5)); if (race !== cur && race !== prev) return { ok: false, note: 'yarış haftası geçti' }; }
    return { ok: true };
  };
  /* Hamle günlüğü: biçim ve boyut sınırı (sunucuyu ağır yeniden oynatmaya zorlamasın) */
  KE.LOG_MAX = 20000;
  KE.logCheck = function (log) {
    if (log == null) return { ok: true };
    if (!Array.isArray(log)) return { ok: false, note: 'günlük dizi değil' };
    if (log.length > KE.LOG_MAX) return { ok: false, note: 'günlük çok uzun' };
    for (const e of log) if (!e || typeof e !== 'object' || typeof e.m !== 'number' || typeof e.a !== 'string' || (e.x != null && !Array.isArray(e.x))) return { ok: false, note: 'günlük kaydı bozuk' };
    return { ok: true };
  };
  KE.verifyChain = function (prevEnd, morningEnv, log, todayRule, claim, race, now) {
    const lc = KE.logCheck(log);
    if (!lc.ok) return lc;
    const rc = KE.raceCheck(race, morningEnv, now);
    if (!rc.ok) return rc;
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
