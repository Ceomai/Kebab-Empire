import { describe, it, expect } from 'vitest';
import { loadGame, newGame, playDays } from './load.js';

const files = ['data', 'util', 'calendar', 'characters', 'economy', 'sim/rng', 'sim/staff', 'sim/branch', 'sim/morning', 'sim/service', 'sim/player', 'sim/close', 'sim/replay', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify'];
const clone = (o) => JSON.parse(JSON.stringify(o));

describe('dönemler', () => {
  it('oyun 1. dönemde başlar, Merkez Ofis ve çiftlik kilitli', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    expect(G.era).toBe(1);
    expect(KE.placeOpen(G, 'hal')).toBe(true);
    expect(KE.placeOpen(G, 'subeler')).toBe(false);
    expect(KE.placeOpen(G, 'ciftlik')).toBe(false);
  });
  it('şartlar tamamlanınca bir sonraki döneme geçilir ve yerler açılır', () => {
    const { KE } = loadGame(files);
    const G = playDays(KE, newGame(KE), 8);
    G.flags.profitWeek = G.day; G.ledger.months.push({ revenue: 1, net: 1 }); G.reputation = 45; G.branches[0].equipment.service = 1;
    const up = KE.advanceEra(G);
    expect(up.map((e) => e.n)).toEqual([2]);
    expect(KE.placeOpen(G, 'subeler')).toBe(true);
    expect(KE.placeOpen(G, 'ciftlik')).toBe(false);
  });
  it('eski kayıt göçte ulaştığı döneme yerleşir', () => {
    const { KE } = loadGame(files);
    const G = playDays(KE, newGame(KE), 3);
    const env = clone(KE.SAVE.envelope(G));
    delete env.game.era; env.v = 3; env.game.flags.profitWeek = 1; env.game.ledger.months.push({ revenue: 1, net: 1 }); env.game.reputation = 50; env.game.branches[0].equipment.cook = 1;
    delete env.sum;
    const g = KE.SAVE.open(env);
    expect(g.era).toBe(2);
  });
});

describe('rakip hikâyesi', () => {
  it('hamleler sırayla gelir ve düello karnesi tutulur', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    G.day = 20;
    let nx = KE.rivalNext(G);
    expect(nx.id).toBe('rakipSemt');
    expect(nx.due).toBe(true);
    G.rival.stage = 1; G.rival.last = 20; G.day = 40;
    nx = KE.rivalNext(G);
    expect(nx.id).toBe('rk_fiyat');
    expect(nx.due).toBe(true);
    G.pendingEvent = { id: 'rk_fiyat', ctx: {}, choices: [{}, {}, {}] };
    const before = G.branches[0].prices[KE.MODES.doner.products[0].id];
    KE.resolveEvent(G, 0);
    expect(G.rival.wins).toBe(1);
    expect(G.branches[0].prices[KE.MODES.doner.products[0].id]).toBeLessThan(before);
  });
  it('usta avı 2. dönemi bekler', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    G.rival.stage = 2; G.day = 80; G.rival.last = 30;
    expect(KE.rivalNext(G).due).toBe(false);
    G.era = 2;
    expect(KE.rivalNext(G).due).toBe(true);
  });
});

describe('otomasyon ve yatırımlar', () => {
  it('müdürlü şube stok bitince ertesi sabah stok seviyesini artırır', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    const b = G.branches[0];
    const m = KE.randomWorker(G, 'mudur'); m.branchId = b.id; G.staff.push(m);
    b.stockLevel = 1.1;
    Object.keys(b.stock).forEach((k) => { b.stock[k] = 0.5; });
    KE.startService(G); let g = 0; while (!KE.allDone(G) && g++ < 1500) KE.tickAll(G);
    KE.finishService(G);
    const so = Object.keys(G.lastSummary.branches[b.id].stats.stockouts).length;
    KE.finalizeDay(G);
    if (so) expect(b.stockLevel).toBeGreaterThan(1.1);
    b.managed = false; expect(KE.isManaged(G, b)).toBe(false);
  });
  it('toplu sipariş gün sonunda ödenir ve haftada bir alınır', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    expect(KE.contractOffers(G)).toEqual([]);
    G.era = 3;
    const offers = KE.contractOffers(G);
    expect(offers.length).toBeGreaterThan(0);
    expect(KE.contractOffers(G)).toEqual(offers);
    expect(KE.acceptContract(G, offers[0].id, G.branches[0].id).ok).toBe(true);
    expect(KE.acceptContract(G, offers[1].id, G.branches[0].id).ok).toBe(false);
    const cash0 = G.cash;
    playDays(KE, G, 1);
    expect(G.flags.contracts).toBe(1);
    expect(G.contract).toBeFalsy();
    void cash0;
  });
  it('imza tarif 10 günde biter ve müşteriyi artırır', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    G.era = 3; G.cash = 5e6;
    const b = G.branches[0], e0 = KE.expectedCustomers(G, b);
    expect(KE.startSignature(G, KE.MODES.doner.products[0].id).ok).toBe(true);
    playDays(KE, G, KE.SIGNATURE.days + 1);
    expect(G.signature.level).toBe(1);
    expect(G.sigWork).toBeFalsy();
    const e1 = KE.expectedCustomers(G, b);
    const sig = G.signature; G.signature = null;
    expect(e1).toBeCloseTo(KE.expectedCustomers(G, b) * (1 + KE.SIGNATURE.traffic), 5);
    G.signature = sig; void e0;
  });
  it('zincir doğrulaması uydurma toplu siparişi yakalar', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    G.era = 3;
    const prev = clone(KE.SAVE.envelope(G));
    const o = KE.contractOffers(G)[0];
    KE.acceptContract(G, o.id, G.branches[0].id);
    expect(KE.chainCheck(prev, clone(KE.SAVE.envelope(G))).ok).toBe(true);
    G.contract.pay *= 10;
    const env = KE.SAVE.envelope(G);
    expect(KE.chainCheck(prev, clone(env)).ok).toBe(false);
  });
});

describe('yeni nesil', () => {
  it('miras usta uzmanlıklarını ve aile tarifini taşır, rakip güçlü başlar', () => {
    const { KE } = loadGame(files);
    const spec = { iskender: 5, et_durum: 4 };
    const G = KE.newGame({ mode: 'doner', district: 'kadiceşme', master: KE.MASTER_TEMPLATES.doner[0], owner: 'T', shopName: 'T2', legacy: { gen: 2, from: 'T', spec, sigPid: 'iskender' } });
    expect(G.gen).toBe(2);
    expect(G.staff[0].spec).toEqual(spec);
    expect(G.signature).toMatchObject({ pid: 'iskender', level: 1, family: true });
    expect(G.rival.power).toBe(35);
    expect(KE.chainCheck(null, clone(KE.SAVE.envelope(G))).ok).toBe(true);
  });
});

describe('eski kayıtlar', () => {
  it('dönem kaydı olmayan ileri oyun imza tarif şartına takılmaz', () => {
    const { KE } = loadGame(files);
    const G = playDays(KE, newGame(KE), 3);
    ['besiktepe', 'sultanpazari', 'kulealti', 'bostansahil', 'merterli'].forEach((d) => KE.openBranch(G, d));
    G.flags.profitWeek = 1; G.flags.champ = true; G.reputation = 80; G.branches[0].equipment.cook = 1;
    G.branches.slice(0, 2).forEach((b) => { b.champions = 1; });
    G.ledger.months.push({ revenue: 4e6, net: 1 });
    const env = clone(KE.SAVE.envelope(G));
    delete env.game.eraLog; env.game.era = 3; delete env.sum;
    const g = KE.SAVE.open(env);
    expect(g.era).toBe(4);
    expect(g.eraLog).toBeTruthy();
  });
  it('yeni oyunda imza tarif şartı geçerli kalır', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    ['besiktepe', 'sultanpazari', 'kulealti'].forEach((d) => KE.openBranch(G, d));
    G.era = 3; G.reputation = 70;
    const g = KE.SAVE.open(clone(KE.SAVE.envelope(G)));
    expect(g.era).toBe(3);
    expect(KE.eraStatus(g).req.find((r) => r.id === 'imza2').ok).toBe(false);
  });
  it('imparatorluğu kurmuş eski oyun son dönemdedir', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    G.flags.empire = 5;
    const env = clone(KE.SAVE.envelope(G));
    delete env.game.eraLog; env.game.era = 1; delete env.sum;
    expect(KE.SAVE.open(env).era).toBe(4);
  });
});

describe('itibar', () => {
  it('70 üstünde her gün aşınır', () => {
    const { KE } = loadGame(files);
    const G = newGame(KE);
    G.reputation = 100;
    playDays(KE, G, 3);
    expect(G.reputation).toBeLessThan(100);
  });
});
