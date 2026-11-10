/* Sabah ekonomisi motor işlevleri: her biri { ok, msg } döndürür, parayı kontrol eder ve yan etkileri uygular */
import { describe, it, expect } from 'vitest';
import { loadGame, newGame, playDays } from './load.js';

const NO_CASH = 'Kasada yeterli para yok.';
const fresh = (mode = 'doner') => { const { KE } = loadGame(); const G = newGame(KE, mode); return { KE, G, b: G.branches[0] }; };
const extras = (G) => Object.assign({ ads: 0, capex: 0, fines: 0, other: 0, farm: 0 }, G.monthExtras);

describe('sabah ekonomisi: tek kaynaklı sabitler', () => {
  it('KE.FRESH yeni oyunun kasası ve itibarıdır', () => {
    const { KE } = loadGame();
    expect(KE.FRESH).toEqual({ cash: 450000, reputation: 30 });
    const mk = () => KE.newGame({ mode: 'doner', district: 'kadiceşme', master: KE.MASTER_TEMPLATES.doner[0], owner: 'T', shopName: 'T', seed: 77 });
    const a = mk();
    expect(a.reputation).toBe(KE.FRESH.reputation);
    KE.FRESH.cash += 1000;
    const b = mk();
    expect(b.cash - a.cash).toBeCloseTo(1000, 6); // açılış stoku düşüldükten sonra fark aynen kalır
  });
  it('maliyet formülleri', () => {
    const { KE, G } = fresh();
    G.priceIndex = 1.25;
    expect(KE.payoffCost({ monthly: 10000, remaining: 7 })).toBe(Math.round(10000 * 7 * 0.93));
    expect(KE.hygieneCost(G)).toBe(15000);
    expect(KE.centralCost(G)).toBe(562500);
    expect(KE.CAMPAIGNS.map((c) => c.id)).toEqual(['ilan', 'sosyal', 'radyo', 'blog', 'tadim', 'tabela']);
    expect(KE.campaignCost(G, KE.CAMPAIGNS[0])).toBe(7500);
  });
  it('quickWeekOpen yalnızca bütün semtlerde şube varken açılır', () => {
    const { KE, G } = fresh();
    expect(KE.quickWeekOpen(G)).toBe(false);
    G.branches = KE.DISTRICTS.map(() => G.branches[0]);
    expect(KE.quickWeekOpen(G)).toBe(true);
  });
});

describe('sabah ekonomisi: işe alma ve çıkarma', () => {
  it('usta pazarından işe alma ücreti öder, kadroya ekler, pazardan çıkarır', () => {
    const { KE, G, b } = fresh();
    G.staff = G.staff.filter((s) => !KE.isCook(s)); // mutfakta yer aç
    const s = G.market.find((x) => x.fee > 0);
    const fee = s.fee, cash = G.cash, other = extras(G).other;
    const r = KE.hireMaster(G, b, s.id);
    expect(r.ok).toBe(true);
    expect(r.msg).toBe(`${s.name} ekibe katıldı!`);
    expect(G.cash).toBe(cash - fee);
    expect(extras(G).other).toBe(other + fee);
    expect(G.staff.includes(s)).toBe(true);
    expect(s.branchId).toBe(b.id); expect(s.hiredDay).toBe(G.day); expect(s.fee).toBeUndefined();
    expect(G.market.some((x) => x.id === s.id)).toBe(false);
  });
  it('usta ücreti kasayı aşarsa ya da mutfak doluysa işe alınmaz', () => {
    const { KE, G, b } = fresh();
    G.staff = G.staff.filter((s) => !KE.isCook(s));
    const s = G.market.find((x) => x.fee > 0);
    G.cash = s.fee - 1;
    const r = KE.hireMaster(G, b, s.id);
    expect(r).toMatchObject({ ok: false, msg: NO_CASH });
    expect(G.cash).toBe(s.fee - 1); expect(G.market.includes(s)).toBe(true);
    // mutfak kadrosu dolu
    G.cash = 1e9;
    let guard = 0;
    while (KE.canHire(G, b, 'usta').ok && G.market.length && guard++ < 20) KE.hireMaster(G, b, G.market[0].id);
    const nxt = G.market[0];
    if (nxt) {
      const ch = KE.canHire(G, b, nxt.role || 'usta');
      const r2 = KE.hireMaster(G, b, nxt.id);
      expect(r2.ok).toBe(false);
      expect(r2.msg).toBe(`Mutfak kadrosu dolu: ${ch.used}/${ch.cap}`);
      expect(r2.hint).toBe(ch.hint);
    }
    expect(KE.hireMaster(G, b, 'yok').ok).toBe(false);
  });
  it('iş ilanından işe alma ücretsizdir; grup doluysa reddedilir', () => {
    const { KE, G, b } = fresh();
    const w = G.workers[0];
    const cash = G.cash;
    const ch = KE.canHire(G, b, w.role);
    const r = KE.hireWorker(G, b, w.id);
    if (ch.ok) {
      expect(r).toMatchObject({ ok: true, msg: `${w.name} işe başladı.` });
      expect(G.cash).toBe(cash);
      expect(G.workers.includes(w)).toBe(false); expect(w.branchId).toBe(b.id);
    } else {
      expect(r.msg).toBe(`${KE.STAFF_GROUPS[ch.group].name} kadrosu dolu: ${ch.used}/${ch.cap}`);
    }
  });
  it('işten çıkarma iki haftalık ücret öder, mentoru temizler, şube moralini düşürür (kasa eksiye düşse de)', () => {
    const { KE, G } = fresh();
    const usta = G.staff.find((x) => x.role === 'usta');
    const w = G.staff.find((x) => x.role === 'cirak');
    w.mentorId = usta.id; w.morale = 50;
    G.cash = 100;
    const other = extras(G).other;
    const r = KE.fireStaff(G, usta.id);
    expect(r).toMatchObject({ ok: true, msg: `${usta.name} ayrıldı.`, cost: usta.wage / 2 });
    expect(G.cash).toBe(100 - usta.wage / 2);
    expect(extras(G).other).toBe(other + usta.wage / 2);
    expect(G.staff.includes(usta)).toBe(false);
    expect(w.mentorId).toBe(null); expect(w.morale).toBe(46);
    expect(KE.fireStaff(G, 'yok').ok).toBe(false);
  });
});

describe('sabah ekonomisi: kıyafet, ekipman, dekor', () => {
  it('kıyafet: kasa, capex, moral; kasa denetimi yok (önceki davranış), ücretsiz önlük her zaman', () => {
    const { KE, G } = fresh();
    const s = G.staff[0]; s.morale = 60;
    const c = KE.COSTUMES.find((x) => x.id === 'sef');
    const cash = G.cash, capex = extras(G).capex;
    const r = KE.buyCostume(G, s.id, 'sef');
    expect(r).toMatchObject({ ok: true, msg: `${s.name} yeni kıyafetine bayıldı!` });
    expect(G.cash).toBe(cash - c.cost); expect(extras(G).capex).toBe(capex + c.cost);
    expect(s.costume).toBe('sef'); expect(s.morale).toBe(60 + c.morale);
    G.cash = 10;
    const y = KE.COSTUMES.find((x) => x.id === 'yoresel');
    expect(KE.buyCostume(G, s.id, 'yoresel').ok).toBe(true);
    expect(s.costume).toBe('yoresel'); expect(G.cash).toBe(10 - y.cost);
    G.cash = -500;
    expect(KE.buyCostume(G, s.id, 'temel').ok).toBe(true);
    expect(G.cash).toBe(-500);
  });
  it('ekipman yükseltme: bedel, seviye, servis sırasında masa eşitleme', () => {
    const { KE, G, b } = fresh();
    G.priceIndex = 1.1;
    const next = KE.MODES.doner.equipment.service.levels[b.equipment.service + 1];
    const cost = next.cost * G.priceIndex;
    expect(KE.upgradeCost(G, b, 'service')).toBe(cost);
    G.cash = cost - 1;
    expect(KE.upgradeEquipment(G, b, 'service')).toMatchObject({ ok: false, msg: NO_CASH });
    G.cash = cost + 1000;
    G.live = { [b.id]: { tables: [{ id: 0, occ: null, dirty: false, by: null }] } };
    const capex = extras(G).capex, lv = b.equipment.service;
    const r = KE.upgradeEquipment(G, b, 'service');
    expect(r).toMatchObject({ ok: true, msg: `${next.name} kuruldu. Dükkân değişti!` });
    expect(G.cash).toBeCloseTo(1000, 6); expect(extras(G).capex).toBeCloseTo(capex + cost, 6);
    expect(b.equipment.service).toBe(lv + 1);
    expect(G.live[b.id].tables.length).toBe(KE.tableCount(G, b));
    expect(G.live[b.id].tables.at(-1).id).toBe(G.live[b.id].tables.length - 1);
  });
  it('dekor: bedel, liste, dış masalar masayı artırır, aynı dekor iki kez alınmaz', () => {
    const { KE, G, b } = fresh();
    const it = KE.DECOR.find((x) => x.id === 'dismasa');
    const cash = G.cash;
    G.live = { [b.id]: { tables: [] } };
    const r = KE.buyDecor(G, b, 'dismasa');
    expect(r.ok).toBe(true);
    expect(r.msg).toBe(r.concept ? `Konsept açıldı: ${r.concept.name}!` : `${it.name} yerleştirildi.`);
    expect(G.cash).toBe(cash - it.cost);
    expect(b.decor).toContain('dismasa');
    expect(G.live[b.id].tables.length).toBe(KE.tableCount(G, b));
    expect(KE.buyDecor(G, b, 'dismasa')).toMatchObject({ ok: false, msg: 'Bu şubede zaten var.' });
    G.cash = 0;
    expect(KE.buyDecor(G, b, 'mermer')).toMatchObject({ ok: false, msg: NO_CASH });
    expect(b.decor).not.toContain('mermer');
  });
  it('konsept açılınca mesaj konsepti söyler', () => {
    const { KE, G, b } = fresh();
    G.cash = 1e9;
    let r;
    for (const id of ['cini', 'bakir', 'nostalji', 'kilim']) { r = KE.buyDecor(G, b, id); if (r.concept) break; }
    const amb = KE.ambience(G, b);
    if (amb.concept) expect(r.msg).toBe(`Konsept açıldı: ${amb.concept.name}!`);
  });
});

describe('sabah ekonomisi: banka', () => {
  it('kredi çekme: teklif listeden, kasaya geçer, en fazla 3', () => {
    const { KE, G } = fresh();
    const o = KE.loanOffers(G)[0], cash = G.cash;
    const r = KE.takeLoan(G, o.amount, o.months);
    expect(r).toMatchObject({ ok: true, msg: `${KE.tl(o.amount)} hesabına geçti.` });
    expect(G.cash).toBe(cash + o.amount);
    expect(G.loans).toEqual([{ amount: o.amount, monthly: o.monthly, remaining: o.months }]);
    expect(KE.takeLoan(G, o.amount + 1, o.months).ok).toBe(false);
    KE.takeLoan(G, o.amount, o.months); KE.takeLoan(G, o.amount, o.months);
    const r4 = KE.takeLoan(G, o.amount, o.months);
    expect(r4.ok).toBe(false); expect(G.loans.length).toBe(3);
  });
  it('erken kapatma: bedel kasadan, gider defterine, kredi listeden çıkar; para yetmezse olmaz', () => {
    const { KE, G } = fresh();
    const o = KE.loanOffers(G)[1];
    KE.takeLoan(G, o.amount, o.months);
    const pay = KE.payoffCost(G.loans[0]);
    G.cash = pay - 1;
    expect(KE.payoffLoan(G, 0)).toMatchObject({ ok: false, msg: NO_CASH });
    expect(G.loans.length).toBe(1);
    G.cash = pay + 10;
    const other = extras(G).other;
    expect(KE.payoffLoan(G, 0)).toMatchObject({ ok: true, msg: 'Kredi kapatıldı.', cost: pay });
    expect(G.cash).toBe(10); expect(extras(G).other).toBe(other + pay); expect(G.loans.length).toBe(0);
    expect(KE.payoffLoan(G, 0).ok).toBe(false);
  });
});

describe('sabah ekonomisi: belediye, ajans, merkezi mutfak', () => {
  it('hijyen: temizlik +30 (en fazla 100), bedel diğer giderlere', () => {
    const { KE, G, b } = fresh();
    b.cleanliness = 50; const cash = G.cash, other = extras(G).other;
    expect(KE.deepClean(G, b)).toMatchObject({ ok: true, msg: 'Dükkân pırıl pırıl.' });
    expect(b.cleanliness).toBe(80); expect(G.cash).toBe(cash - 12000); expect(extras(G).other).toBe(other + 12000);
    KE.deepClean(G, b); expect(b.cleanliness).toBe(100);
    G.cash = 11999; b.cleanliness = 50;
    expect(KE.deepClean(G, b).ok).toBe(true);
    expect(G.cash).toBe(-1); expect(b.cleanliness).toBe(80);
  });
  it('kampanya: reklam gideri, etkiler, tabela kalıcı ve bir kez; blog itibarı', () => {
    const { KE, G, b } = fresh();
    const c = KE.CAMPAIGNS.find((x) => x.id === 'sosyal');
    const cash = G.cash, ads = extras(G).ads;
    expect(KE.startCampaign(G, b, 'sosyal')).toMatchObject({ ok: true, msg: `${c.name} başladı.` });
    expect(G.cash).toBe(cash - c.cost); expect(extras(G).ads).toBe(ads + c.cost);
    expect(G.mods.filter((m) => m.camp === 'sosyal').map((m) => [m.key, m.mult, m.days])).toEqual(c.mods.map(([k, m]) => [k, m, c.days]));
    expect(KE.startCampaign(G, b, 'tabela')).toMatchObject({ ok: true, msg: 'Yeni tabela gece gündüz parlıyor.' });
    expect(b.signBoost).toBe(1.06);
    expect(KE.startCampaign(G, b, 'tabela').ok).toBe(false);
    const rep = G.reputation;
    const best = Math.max(...KE.MODES.doner.products.map((p) => KE.bestStar(G, b, p.id)));
    KE.startCampaign(G, b, 'blog');
    expect(G.reputation).toBe(Math.min(100, rep + (best >= 4 ? 4 : 1)));
    G.cash = 0;
    expect(KE.startCampaign(G, b, 'radyo')).toMatchObject({ ok: false, msg: NO_CASH });
    expect(G.mods.some((m) => m.camp === 'radyo')).toBe(false);
  });
  it('merkezi mutfak: capex, bayrak, bir kez; para yetmezse olmaz', () => {
    const { KE, G } = fresh();
    G.cash = 449999;
    expect(KE.buildCentralKitchen(G)).toMatchObject({ ok: false, msg: NO_CASH });
    expect(G.centralKitchen).toBe(false);
    G.cash = 500000; const capex = extras(G).capex;
    expect(KE.buildCentralKitchen(G)).toMatchObject({ ok: true, msg: 'Merkezi mutfak kuruldu.' });
    expect(G.cash).toBe(50000); expect(extras(G).capex).toBe(capex + 450000); expect(G.centralKitchen).toBe(true);
    expect(KE.buildCentralKitchen(G).ok).toBe(false); expect(G.cash).toBe(50000);
  });
});

describe('sıralama zinciri: kredi erken kapatma', () => {
  const files = ['data', 'util', 'calendar', 'characters', 'economy', 'sim/rng', 'sim/staff', 'sim/branch', 'sim/morning', 'sim/service', 'sim/player', 'sim/close', 'sim/replay', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify'];
  const dayRun = (KE, G) => { KE.startService(G); let n = 0; while (!KE.allDone(G) && n++ < 2000) KE.tickAll(G); KE.finishService(G); const log = G.dayLog.slice(); KE.finalizeDay(G, 'esit'); const c = { day: G.day - 1, served: 0, revenue: 0, reputation: G.reputation }; Object.values(G.lastSummary.branches).forEach((b) => { c.served += b.stats.served; c.revenue += b.stats.revenue; }); return { log, claim: c }; };
  const env = (KE, G) => JSON.parse(JSON.stringify(KE.SAVE.envelope(G)));
  /* zarfı aç, değiştir, yeniden mühürle (sağlama toplamı tutsun: kötü niyetli istemci de bunu yapabilir) */
  const reenv = (KE, e, f) => { const g = KE.SAVE.open(JSON.parse(JSON.stringify(e))); f(g); return env(KE, g); };
  it('dürüst erken kapatma zinciri geçer; ödemeden silinen kredi reddedilir', () => {
    const { KE } = loadGame(files);
    const { KE: SRV } = loadGame(files);
    const G = KE.newGame({ mode: 'doner', district: 'kadiceşme', master: KE.MASTER_TEMPLATES.doner[0], owner: 'T', shopName: 'T', seed: 41 });
    let prevEnd = null;
    // gün 1: düz; gün 2 sabahı: kredi çek; gün 3 sabahı: erken kapat
    for (let d = 0; d < 3; d++) {
      if (G.pendingEvent) KE.resolveEvent(G, 0);
      if (d === 1) { const o = KE.loanOffers(G)[0]; expect(KE.takeLoan(G, o.amount, o.months).ok).toBe(true); }
      if (d === 2) {
        expect(G.loans.length).toBe(1);
        // sessiz silme: aynı sabah, kasaya dokunmadan
        const cheat = reenv(KE, env(KE, G), (g) => { g.loans = []; });
        const bad = SRV.chainCheck(prevEnd, cheat);
        expect(bad.ok).toBe(false); expect(bad.note).toMatch(/kredi silinmiş/);
        expect(KE.payoffLoan(G, 0).ok).toBe(true);
        expect(G.loans.length).toBe(0);
      }
      const m = env(KE, G); const { log, claim } = dayRun(KE, G);
      const r = SRV.verifyChain(prevEnd, m, log, 'esit', claim);
      expect(r.ok, r.note).toBe(true);
      prevEnd = r.end;
    }
  });
  it('kapatma bedelinin bir kısmı ödenmişse yine reddedilir; vadesi biten kredi serbestçe düşer', () => {
    const { KE } = loadGame(files);
    const G = KE.newGame({ mode: 'doner', district: 'kadiceşme', master: KE.MASTER_TEMPLATES.doner[0], owner: 'T', shopName: 'T', seed: 42 });
    const m1 = env(KE, G); const a = dayRun(KE, G);
    const r1 = KE.verifyChain(null, m1, a.log, 'esit', a.claim); expect(r1.ok, r1.note).toBe(true);
    // önceki gün sonuna bir kredi koy (sunucunun saklayacağı durum)
    const prev = reenv(KE, r1.end, (g) => { g.loans = [{ amount: 300000, monthly: 30000, remaining: 5 }]; });
    const P = KE.SAVE.open(JSON.parse(JSON.stringify(prev)));
    const pay = KE.payoffCost(P.loans[0]);
    const cur = (cashDelta, loans) => reenv(KE, prev, (g) => { g.cash += cashDelta; g.loans = loans; });
    expect(KE.chainCheck(prev, cur(-pay, [])).ok).toBe(true);
    expect(KE.chainCheck(prev, cur(-pay + 1000, [])).note).toMatch(/kredi silinmiş/);
    expect(KE.chainCheck(prev, cur(0, [])).note).toMatch(/kredi silinmiş/);
    expect(KE.chainCheck(prev, cur(0, P.loans)).ok).toBe(true);
    // kalan taksiti 0 olan kredi (ay kapanışında biten) bedelsiz düşebilir
    const prev0 = reenv(KE, prev, (g) => { g.loans[0].remaining = 0; });
    expect(KE.chainCheck(prev0, reenv(KE, prev0, (g) => { g.loans = []; })).ok).toBe(true);
  });
});

describe('verifyChain günü bir kez oynatır', () => {
  it('end durumu verifyDay ile aynı gün sonudur', () => {
    const files = ['data', 'util', 'calendar', 'characters', 'economy', 'sim/rng', 'sim/staff', 'sim/branch', 'sim/morning', 'sim/service', 'sim/player', 'sim/close', 'sim/replay', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify'];
    const { KE } = loadGame(files);
    const G = playDays(KE, KE.newGame({ mode: 'kebap', district: 'kulealti', master: KE.MASTER_TEMPLATES.kebap[0], owner: 'T', shopName: 'T', seed: 43 }), 0);
    const m = JSON.parse(JSON.stringify(KE.SAVE.envelope(G)));
    let calls = 0; const orig = KE.replayService; KE.replayService = (...x) => { calls++; return orig(...x); };
    KE.startService(G); let n = 0; while (!KE.allDone(G) && n++ < 2000) KE.tickAll(G); KE.finishService(G);
    const log = G.dayLog.slice(); KE.finalizeDay(G, 'esit');
    const claim = { day: 1, served: 0, revenue: 0, reputation: G.reputation };
    Object.values(G.lastSummary.branches).forEach((b) => { claim.served += b.stats.served; claim.revenue += b.stats.revenue; });
    calls = 0;
    const r = KE.verifyChain(null, m, log, 'esit', claim);
    expect(r.ok, r.note).toBe(true);
    expect(calls).toBe(1);
    expect(r.end.game.day).toBe(G.day);
    expect(r.end.game.cash).toBeCloseTo(G.cash, 6);
    KE.replayService = orig;
  });
});
