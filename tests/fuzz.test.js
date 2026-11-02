/* Motor fuzz testi: rastgele (ama tohumlu, tekrarlanabilir) oyuncu eylemleriyle çok gün oynar,
   her gün değişmez kuralları denetler. Hata bulunursa tohum ve gün mesajda yazar. */
import { describe, it, expect } from 'vitest';
import { loadGame } from './load.js';

const FILES = ['data', 'calendar', 'characters', 'economy', 'sim', 'midday', 'progress', 'farm', 'narrative', 'save', 'verify'];
function prng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function morningActions(KE, G, r) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  const n = Math.floor(r() * 7);
  for (let i = 0; i < n; i++) {
    const b = pick(G.branches), M = KE.MODES[G.mode];
    switch (Math.floor(r() * 20)) {
      case 0: { const s = pick(G.market || []); if (s && KE.canHire(G, b, s.role || 'usta').ok) { s.branchId = b.id; G.cash -= s.fee || 0; delete s.fee; G.staff.push(s); G.market = G.market.filter((x) => x !== s); } break; }
      case 1: { const s = pick(G.workers || []); if (s && KE.canHire(G, b, s.role).ok) { s.branchId = b.id; G.staff.push(s); G.workers = G.workers.filter((x) => x !== s); } break; }
      case 2: { const s = pick(G.staff); if (s && G.staff.length > 2) { G.cash -= s.wage / 2; G.staff = G.staff.filter((x) => x !== s); G.staff.forEach((x) => { if (x.mentorId === s.id) x.mentorId = null; }); } break; }
      case 3: { const s = pick(G.staff); if (s) { s.wage = Math.round(s.wage * 1.1 / 100) * 100; s.morale = Math.min(100, s.morale + 12); } break; }
      case 4: { const p = pick(M.products); if (b.prices[p.id] != null) { const cap = Math.round(KE.marketPrice(G, p) * 3 / 5) * 5; b.prices[p.id] = Math.max(5, Math.min(cap, Math.round(b.prices[p.id] * (0.3 + r() * 3)))); } break; }
      case 5: { const p = pick(M.products); b.menu[p.id] = r() < 0.5; break; }
      case 6: b.tier = Math.floor(r() * KE.TIERS.length); break;
      case 7: b.stockLevel = pick([1.15, 1.5]); KE.topUpToday(G, b); break;
      case 8: { const k = pick(Object.keys(b.usage)); KE.buyExtra(G, b, k, Math.round(r() * 30)); break; }
      case 9: { const s = pick(G.staff); if (s) { const pos = KE.POSITIONS[s.role]; KE.setPos(G, s, pick(pos)); } break; }
      case 10: { const k = pick(Object.keys(M.equipment)); const nx = M.equipment[k].levels[b.equipment[k] + 1]; if (nx && G.cash > nx.cost * G.priceIndex) { G.cash -= nx.cost * G.priceIndex; b.equipment[k]++; } break; }
      case 11: { const d = KE.DECOR.find((x) => !b.decor.includes(x.id)); if (d && G.cash > d.cost * G.priceIndex) { G.cash -= d.cost * G.priceIndex; b.decor.push(d.id); } break; }
      case 12: if (G.loans.length < 3 && r() < 0.3) { const o = KE.loanOffer(200000, 12, 0.034); G.loans.push({ amount: o.amount, monthly: o.monthly, remaining: o.months }); G.cash += o.amount; } break;
      case 13: { const d = KE.DISTRICTS.find((x) => !G.branches.some((y) => y.district === x.id)); if (d && G.cash > 2e6 && G.branches.length < 4) { const nb = KE.openBranch(G, d.id); const m = G.market.shift(); if (m) { m.branchId = nb.id; G.staff.push(m); } const w = KE.randomWorker(G, 'kasiyer'); w.branchId = nb.id; G.staff.push(w); } break; }
      case 14: { const s = pick(G.staff); const ob = pick(G.branches); if (s && ob.id !== s.branchId && KE.canHire(G, ob, s.role).ok) s.branchId = ob.id; break; }
      case 15: KE.donate(G, pick(KE.CHARITY).id); break;
      case 16: if (!b.reservation) KE.buyReservation(G, b); else b.resOn = r() < 0.5; break;
      case 17: b.autoStaff = r() < 0.8; break;
      case 18: { const o = KE.contractOffers(G)[0]; if (o && !KE.contractTaken(G)) KE.acceptContract(G, o.id, b.id); break; }
      case 19: G.tipRule = pick(Object.keys(KE.TIP_RULES)); break;
    }
  }
}
function check(KE, G, where) {
  const bad = [];
  const fin = (v, n) => { if (!Number.isFinite(v)) bad.push(`${n}=${v}`); };
  fin(G.cash, 'kasa'); fin(G.reputation, 'itibar'); fin(G.priceIndex, 'enflasyon');
  if (G.reputation < 0 || G.reputation > 100) bad.push('itibar sınır dışı ' + G.reputation);
  const ids = new Set(G.branches.map((b) => b.id)), sids = new Set(G.staff.map((s) => s.id));
  if (sids.size !== G.staff.length) bad.push('yinelenen personel kimliği');
  G.staff.forEach((s) => {
    if (!ids.has(s.branchId)) bad.push(`${s.name}: şubesi yok`);
    if (s.mentorId && !sids.has(s.mentorId)) bad.push(`${s.name}: mentor yok`);
    fin(s.morale, s.name + '.moral'); fin(s.energy, s.name + '.enerji'); fin(s.wage, s.name + '.maaş');
    if (s.morale < 0 || s.morale > 100 || s.energy < 0 || s.energy > 100) bad.push(`${s.name}: moral/enerji sınır dışı`);
  });
  G.branches.forEach((b) => {
    Object.entries(b.stock).forEach(([k, v]) => { fin(v, b.name + '.stok.' + k); if (v < -1e-6) bad.push(`${b.name}: eksi stok ${k}=${v}`); });
    Object.entries(b.prices).forEach(([k, v]) => fin(v, b.name + '.fiyat.' + k));
  });
  G.ledger.days.slice(-G.branches.length).forEach((d) => ['revenue', 'net', 'served', 'arrivals', 'purchases'].forEach((k) => fin(d[k], 'defter.' + k)));
  if (bad.length) throw new Error(where + ': ' + bad.slice(0, 5).join(' | '));
}

describe('motor fuzz: rastgele eylemlerle 60 gün', () => {
  for (const mode of ['doner', 'kebap']) for (const seed of [11, 29, 47, 83, 101, 131]) {
    it(`${mode} tohum ${seed}`, () => {
      const { KE } = loadGame(FILES), { KE: SRV } = loadGame(FILES);
      const r = prng(seed * 7919);
      const G = KE.newGame({ mode, district: KE.DISTRICTS.at(seed % KE.DISTRICTS.length).id, master: KE.MASTER_TEMPLATES[mode][0], owner: 'Fuzz 🥙', shopName: 'Çok "uzun" <adlı> dükkân '.repeat(3), seed });
      G.tut = 99;
      for (let d = 0; d < 60; d++) {
        if (G.pendingEvent) KE.resolveEvent(G, Math.floor(r() * G.pendingEvent.choices.length));
        if (d === 30) { G.era = 3; G.cash += 4e6; }
        morningActions(KE, G, r);
        check(KE, G, `${mode}/${seed} gün ${G.day} sabah`);
        const env = d % 10 === 9 ? JSON.parse(JSON.stringify(KE.SAVE.envelope(G))) : null;
        /* kayıt gidiş-dönüş */
        if (d % 7 === 3) { const back = KE.SAVE.open(JSON.parse(JSON.stringify(KE.SAVE.envelope(G)))); expect(JSON.stringify(Object.assign({}, back, { live: null }))).toBe(JSON.stringify(Object.assign({}, G, { live: null }))); }
        KE.startService(G);
        let g = 0;
        while (!KE.allDone(G) && g++ < 2000) {
          if (KE.midPending(G)) KE.act(G, 'mid', Math.floor(r() * 2));
          const x = r();
          if (x < 0.01) { const s = G.staff[Math.floor(r() * G.staff.length)]; if (s) KE.act(G, 'setPos', s.id, KE.POSITIONS[s.role][Math.floor(r() * KE.POSITIONS[s.role].length)]); }
          else if (x < 0.012) KE.act(G, 'courier', G.branches[Math.floor(r() * G.branches.length)].id);
          else if (x < 0.015) KE.act(G, 'ptoggle', r() < 0.5);
          else if (x < 0.02) KE.act(G, 'ptake');
          else if (x < 0.06) KE.act(G, 'pst', KE.STATIONS[Math.floor(r() * KE.STATIONS.length)].id);
          else if (x < 0.065) KE.act(G, 'psel', Math.floor(r() * 3));
          KE.tickAll(G);
        }
        KE.finishService(G);
        const log = G.dayLog.slice(), rule = G.tipRule;
        KE.finalizeDay(G, rule);
        check(KE, G, `${mode}/${seed} gün ${G.day - 1} kapanış`);
        if (env) {
          const S = G.lastSummary, claim = { day: env.game.day, served: 0, revenue: 0, reputation: G.reputation };
          Object.values(S.branches).forEach((b) => { claim.served += b.stats.served; claim.revenue += b.stats.revenue; });
          const v = SRV.verifyDay(env, log, rule, claim);
          if (!v.ok) throw new Error(`${mode}/${seed} gün ${env.game.day}: sunucu doğrulaması tutmadı: ${v.note}`);
        }
      }
    }, 180000);
  }
});
