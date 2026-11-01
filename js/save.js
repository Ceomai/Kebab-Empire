/* Kebab Empire — kayıt sistemi
   Zarf: { v, app, savedAt, day, sum, game }. Eski kayıtlar sürüm sürüm göç ettirilir.
   Ana kayıt bozulursa son sağlam yedekten açılır. Dosyaya dışa/içe aktarma ve bulut kaydı aynı zarfı kullanır. */
(function () {
  const S = KE.SAVE = {};
  S.KEY = 'kebab-empire-save-v2';
  S.BACKUP = 'kebab-empire-save-backup';
  S.VERSION = 3;
  S.APP = 'kebab-empire';

  /* Basit sağlama toplamı (FNV-1a): bozulmayı ve elle oynanmış dosyayı fark etmek için */
  S.hash = function (str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  };

  /* Göçler: MIGRATIONS[n] oyunu n. sürümden n+1'e taşır */
  const MIGRATIONS = {
    /* 1 → 2: zarfsız eski kayıtlar; eksik alanları tamamla */
    1: (g) => {
      if (g.tut == null) g.tut = 99;
      if (!g.regulars) { g.regulars = {}; KE.REGULARS.forEach((r) => { g.regulars[r.id] = { loyalty: 0, visits: 0 }; }); }
      (g.staff || []).forEach((s) => { if (s.energy == null) s.energy = 100; if (!s.pos) s.pos = KE.POSITIONS[s.role][0]; });
      return g;
    },
    /* 2 → 3: tohumlu rastgelelik ve eylem günlüğü */
    2: (g) => {
      if (g.seed == null) g.seed = Math.floor(Math.random() * 2147483646) + 1;
      if (!g.actionLog) g.actionLog = [];
      if (!g.saveId) g.saveId = 'g' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
      return g;
    }
  };
  S.migrate = function (g, from) {
    let v = from || 1;
    while (v < S.VERSION) { if (MIGRATIONS[v]) g = MIGRATIONS[v](g); v++; }
    return g;
  };

  /* Yüklemeden sonra her zaman yapılan tutarlılık düzeltmeleri */
  S.normalize = function (g) {
    KE.CAL.applyYear(KE.dateOf(g.day).getUTCFullYear());
    if (g.phase === 'service') g.phase = 'morning';
    if (g.phase === 'closing' && !g.lastSummary) g.phase = 'morning';
    g.live = null;
    (g.staff || []).forEach((s) => { s.task = null; if (s.energy == null) s.energy = 100; if (!s.pos) s.pos = KE.POSITIONS[s.role][0]; });
    return g;
  };
  S.valid = (g) => !!(g && typeof g === 'object' && Array.isArray(g.branches) && g.branches.length && Array.isArray(g.staff) && typeof g.day === 'number' && g.mode && KE.MODES[g.mode]);

  S.envelope = function (G) {
    const game = Object.assign({}, G, { live: null });
    const body = JSON.stringify(game);
    return { v: S.VERSION, app: S.APP, savedAt: new Date().toISOString(), day: G.day, sum: S.hash(body), game };
  };
  /* Zarf ya da çıplak oyun: sürümü bul, göç ettir, doğrula */
  S.open = function (data) {
    if (!data || typeof data !== 'object') throw new Error('Kayıt okunamadı.');
    let g, v;
    if (data.app === S.APP && data.game) {
      g = data.game; v = data.v || 2;
      if (data.sum && S.hash(JSON.stringify(g)) !== data.sum) throw new Error('Kayıt dosyası bozulmuş ya da elle değiştirilmiş.');
      if (v > S.VERSION) throw new Error('Bu kayıt oyunun daha yeni bir sürümünden. Sayfayı yenileyip tekrar dene.');
    } else { g = data; v = 1; }
    g = S.migrate(g, v);
    if (!S.valid(g)) throw new Error('Kayıtta oyun bilgisi eksik.');
    return S.normalize(g);
  };

  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* yok say */ } }
  };
  S.lastError = null;

  S.write = function (G) {
    const env = S.envelope(G);
    const txt = JSON.stringify(env);
    /* Gün değiştiyse eski sağlam kaydı yedeğe al */
    const prev = store.get(S.KEY);
    if (prev) { try { const p = JSON.parse(prev); if ((p.day || (p.game && p.game.day)) !== G.day) store.set(S.BACKUP, prev); } catch (e) { /* bozuk eskiyi yedeklemeyiz */ } }
    if (!store.set(S.KEY, txt)) { S.lastError = 'quota'; return false; }
    S.lastError = null;
    if (KE.CLOUD && KE.CLOUD.queueSave) KE.CLOUD.queueSave(env);
    return true;
  };
  /* { game, from: 'main'|'backup', warning } ya da null */
  S.read = function () {
    for (const [k, from] of [[S.KEY, 'main'], [S.BACKUP, 'backup']]) {
      const raw = store.get(k);
      if (!raw) continue;
      try { return { game: S.open(JSON.parse(raw)), from, warning: from === 'backup' ? 'Son kayıt bozuktu; bir önceki günün yedeğinden açıldı.' : null }; }
      catch (e) { S.lastError = e.message; }
    }
    return null;
  };
  S.exists = () => !!(store.get(S.KEY) || store.get(S.BACKUP));
  S.clear = () => { store.del(S.KEY); store.del(S.BACKUP); };

  /* Dosyaya dışa aktarma */
  S.exportFile = function (G) {
    const env = S.envelope(G);
    const blob = new Blob([JSON.stringify(env, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    const name = (G.shopName || 'kebab-empire').toLowerCase().replace(/[^a-z0-9ğüşıöç]+/gi, '-');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}-gun-${G.day}.kebab.json`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  /* Dosyadan içe aktarma: Promise<game> */
  S.importFile = function () {
    return new Promise((resolve, reject) => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.json,application/json';
      inp.onchange = () => {
        const f = inp.files && inp.files[0];
        if (!f) return reject(new Error('Dosya seçilmedi.'));
        if (f.size > 5e6) return reject(new Error('Dosya çok büyük.'));
        const r = new FileReader();
        r.onload = () => { try { resolve(S.open(JSON.parse(r.result))); } catch (e) { reject(e); } };
        r.onerror = () => reject(new Error('Dosya okunamadı.'));
        r.readAsText(f);
      };
      inp.click();
    });
  };
})();
