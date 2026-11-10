/* Kebab Empire — kayıt sistemi
   Zarf: { v, app, savedAt, day, sum, game }. Eski kayıtlar sürüm sürüm göç ettirilir.
   Ana kayıt bozulursa son sağlam yedekten açılır. Dosyaya dışa/içe aktarma ve bulut kaydı aynı zarfı kullanır. */
(function () {
  const S = (KE.SAVE = /** @type {KE_SAVE} */ ({}));
  S.KEY = 'kebab-empire-save-v2';
  S.BACKUP = 'kebab-empire-save-backup';
  S.RACE_KEY = 'kebab-empire-race';
  /* bu sekmenin kimliği: başka sekmenin yazdığı kaydı kendi yazdığımızdan ayırmak için */
  S.TAB = 't' + Math.random().toString(36).slice(2, 9);
  S.VERSION = 4;
  S.APP = 'kebab-empire';

  /* Basit sağlama toplamı (FNV-1a): bozulmayı ve elle oynanmış dosyayı fark etmek için */
  S.hash = function (str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  };

  /* Göçler: MIGRATIONS[n] oyunu n. sürümden n+1'e taşır */
  /** @type {Record<number, (g: any) => any>} */
  const MIGRATIONS = {
    /* 1 → 2: zarfsız eski kayıtlar; eksik alanları tamamla */
    1: (g) => {
      if (g.tut == null) g.tut = 99;
      if (!g.regulars) {
        g.regulars = {};
        KE.REGULARS.forEach((r) => {
          g.regulars[r.id] = { loyalty: 0, visits: 0 };
        });
      }
      (g.staff || []).forEach((/** @type {Staff} */ s) => {
        if (s.energy == null) s.energy = 100;
        if (!s.pos) s.pos = KE.POSITIONS[s.role][0];
      });
      return g;
    },
    /* 2 → 3: tohumlu rastgelelik ve eylem günlüğü */
    2: (g) => {
      if (g.seed == null) g.seed = Math.floor(Math.random() * 2147483646) + 1;
      if (!g.actionLog) g.actionLog = [];
      if (!g.saveId) g.saveId = 'g' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
      return g;
    },
    /* 3 → 4: dönemler, rakip hikâyesi, haftalık meydan okuma, nesil. Eski oyun ulaştığı döneme sessizce yerleşir. */
    3: (g) => {
      g.gen = g.gen || 1;
      g.stories = g.stories || {};
      g.weekly = g.weekly || null;
      g.flags = g.flags || {};
      g.rival = Object.assign({ power: 20, district: null }, g.rival || {});
      if (g.rival.stage == null) g.rival.stage = g.day > 40 ? 1 : 0;
      if (!g.era) {
        g.era = 1;
        try {
          KE.advanceEra(g);
        } catch (e) {
          /* eksik veri: 1. dönemde kal */
        }
      }
      return g;
    }
  };
  S.migrate = function (g, from) {
    let v = from || 1;
    while (v < S.VERSION) {
      if (MIGRATIONS[v]) g = MIGRATIONS[v](g);
      v++;
    }
    return g;
  };

  /* Yüklemeden sonra her zaman yapılan tutarlılık düzeltmeleri */
  S.normalize = function (g) {
    KE.CAL.applyYear(KE.dateOf(g.day).getUTCFullYear());
    if (g.phase === 'service') g.phase = 'morning';
    if (g.phase === 'closing' && !g.lastSummary) g.phase = 'morning';
    g.live = null;
    (g.staff || []).forEach((/** @type {Staff} */ s) => {
      s.task = null;
      if (s.energy == null) s.energy = 100;
      if (!s.pos) s.pos = KE.POSITIONS[s.role][0];
    });
    /* Dönemlerden önce başlamış oyunlar (dönem kaydı yok): imza tarif şartı o sistemden önce
       ilerlemiş zincirlere sayılmaz; oyun ulaştığı döneme yerleşir, imparatorluk kurulmuşsa son dönemdedir. */
    if (g.flags && !g.eraLog) {
      g.eraLog = {};
      if ((g.branches || []).length >= 5 || g.flags.empire) g.flags.legacyImza = true;
      g.era = g.era || 1;
      if (KE.advanceEra) {
        try {
          KE.advanceEra(g);
        } catch (e) {
          /* eksik veri */
        }
      }
    }
    if (g.flags && g.flags.empire && (g.era || 1) < 4) g.era = 4;
    (g.branches || []).forEach((/** @type {Branch} */ b) => {
      if (b.stockLevel < 1.15) b.stockLevel = 1.15;
    });
    return g;
  };
  S.valid = (g) =>
    !!(
      g &&
      typeof g === 'object' &&
      Array.isArray(g.branches) &&
      g.branches.length &&
      Array.isArray(g.staff) &&
      typeof g.day === 'number' &&
      g.mode &&
      KE.MODES[g.mode]
    );

  S.envelope = function (G) {
    const body = JSON.stringify(Object.assign({}, G, { live: null }));
    /* zarf oyunun anlık kopyasını taşır: bulut kaydı birkaç saniye sonra gönderilir ve bu arada
       canlı oyun (şubeler, ekip) değişebilir; ortak nesneler sağlama toplamını bozardı */
    const game = JSON.parse(body);
    return {
      v: S.VERSION,
      app: S.APP,
      savedAt: new Date().toISOString(),
      day: G.day,
      tab: S.TAB,
      sum: S.hash(body),
      game
    };
  };
  /* Zarf ya da çıplak oyun: sürümü bul, göç ettir, doğrula */
  S.open = function (data) {
    if (!data || typeof data !== 'object') throw new Error('Kayıt okunamadı.');
    let g, v;
    if (data.app === S.APP && data.game) {
      g = data.game;
      v = data.v || 2;
      if (data.sum && S.hash(JSON.stringify(g)) !== data.sum)
        throw new Error('Kayıt dosyası bozulmuş ya da elle değiştirilmiş.');
      if (v > S.VERSION) throw new Error('Bu kayıt oyunun daha yeni bir sürümünden. Sayfayı yenileyip tekrar dene.');
    } else {
      g = data;
      v = 1;
    }
    g = S.migrate(g, v);
    if (!S.valid(g)) throw new Error('Kayıtta oyun bilgisi eksik.');
    return S.normalize(g);
  };

  const store = {
    get: (/** @type {string} */ k) => {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set: (/** @type {string} */ k, /** @type {string} */ v) => {
      try {
        localStorage.setItem(k, v);
        return true;
      } catch (e) {
        return false;
      }
    },
    del: (/** @type {string} */ k) => {
      try {
        localStorage.removeItem(k);
      } catch (e) {
        /* yok say */
      }
    }
  };
  S.lastError = null;

  /* Son yazdığımız kaydın metni ve künyesi: bir sonraki yazışta eski kaydı yeniden ayrıştırmamak için.
     Yuvadaki metin bununla birebir aynı değilse (başka sekme, elle değişiklik) eskisi gibi ayrıştırılır. */
  /** @type {{ txt: string; p: any } | null} */
  let last = null;
  S.write = function (G) {
    /* zarf, JSON.stringify(S.envelope(G)) ile bayt bayt aynıdır; oyun gövdesi bir kez dizgeye çevrilir */
    const body = JSON.stringify(Object.assign({}, G, { live: null }));
    const head = {
      v: S.VERSION,
      app: S.APP,
      savedAt: new Date().toISOString(),
      day: G.day,
      tab: S.TAB,
      sum: S.hash(body)
    };
    const txt = JSON.stringify(head).slice(0, -1) + ',"game":' + body + '}';
    /* haftalık yarış ayrı yuvada durur: ana oyunun kaydına dokunmaz, buluta kayıt olarak gitmez */
    if (G.race) {
      if (!store.set(S.RACE_KEY, txt)) {
        S.lastError = 'quota';
        return false;
      }
      S.lastError = null;
      return true;
    }
    /* Gün değiştiyse eski sağlam kaydı yedeğe al */
    const prev = store.get(S.KEY);
    if (prev) {
      let p = null;
      if (last && last.txt === prev) p = last.p;
      else {
        try {
          const o = JSON.parse(prev);
          p = o && { day: o.day, game: o.game && { day: o.game.day, saveId: o.game.saveId } };
        } catch (e) {
          /* bozuk eskiyi yedeklemeyiz */
        }
      }
      /* aynı oyunun daha ileri bir gününü eski bir günle ezme (ör. başka sekmede ilerlemiş oyun) */
      if (p && p.game && p.game.saveId === G.saveId && p.day > G.day && !S.allowRewind) {
        S.lastError = 'stale';
        return false;
      }
      if (p && (p.day || (p.game && p.game.day)) !== G.day) store.set(S.BACKUP, prev);
    }
    S.allowRewind = false;
    if (!store.set(S.KEY, txt)) {
      last = null;
      S.lastError = 'quota';
      return false;
    }
    last = { txt, p: { day: G.day, game: { day: G.day, saveId: G.saveId } } };
    S.lastError = null;
    if (KE.CLOUD && KE.CLOUD.queueSave && KE.CLOUD.ready)
      KE.CLOUD.queueSave(Object.assign(head, { game: JSON.parse(body) }));
    return true;
  };
  /* { game, from: 'main'|'backup', warning } ya da null */
  S.read = function () {
    for (const [k, from] of [
      [S.KEY, 'main'],
      [S.BACKUP, 'backup']
    ]) {
      const raw = store.get(k);
      if (!raw) continue;
      try {
        return {
          game: S.open(JSON.parse(raw)),
          from,
          warning: from === 'backup' ? 'Son kayıt bozuktu; bir önceki günün yedeğinden açıldı.' : null
        };
      } catch (e) {
        S.lastError = e.message;
      }
    }
    return null;
  };
  S.readRace = function () {
    const raw = store.get(S.RACE_KEY);
    if (!raw) return null;
    try {
      return S.open(JSON.parse(raw));
    } catch (e) {
      return null;
    }
  };
  S.clearRace = () => store.del(S.RACE_KEY);
  S.exists = () => !!(store.get(S.KEY) || store.get(S.BACKUP));
  S.clear = () => {
    store.del(S.KEY);
    store.del(S.BACKUP);
  };

  /* Dosyaya dışa aktarma */
  S.exportFile = function (G) {
    const env = S.envelope(G);
    const blob = new Blob([JSON.stringify(env, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    const name = (G.shopName || 'kebab-empire').toLowerCase().replace(/[^a-z0-9ğüşıöç]+/gi, '-');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}-gun-${G.day}.kebab.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  };
  /* Dosyadan içe aktarma: Promise<game> */
  S.importFile = function () {
    return new Promise((resolve, reject) => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.json,application/json';
      inp.onchange = () => {
        const f = inp.files && inp.files[0];
        if (!f) return reject(new Error('Dosya seçilmedi.'));
        if (f.size > 5e6) return reject(new Error('Dosya çok büyük.'));
        const r = new FileReader();
        r.onload = () => {
          try {
            resolve(S.open(JSON.parse(String(r.result))));
          } catch (e) {
            reject(e);
          }
        };
        r.onerror = () => reject(new Error('Dosya okunamadı.'));
        r.readAsText(f);
      };
      inp.click();
    });
  };
})();
