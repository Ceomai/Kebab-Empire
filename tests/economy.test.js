import { describe, it, expect } from 'vitest';
import { loadGame } from './load.js';
const { KE } = loadGame();
KE.CAL.applyYear(2026);
const G = { payLate: false };
const worker = (wage, cumBase = 0) => ({ id: 1, name: 'T', role: 'usta', wage, cumBase });
const zeroOT = () => {
  const o = KE.ECON.fazlaMesaiOrani;
  KE.ECON.fazlaMesaiOrani = 0;
  return () => {
    KE.ECON.fazlaMesaiOrani = o;
  };
};

describe('gelir vergisi dilimleri', () => {
  it('kümülatif dilimleri doğru uygular', () => {
    expect(KE.taxOn(100000)).toBeCloseTo(15000, 6);
    expect(KE.taxOn(190000)).toBeCloseTo(28500, 6);
    expect(KE.taxOn(400000)).toBeCloseTo(28500 + 210000 * 0.2, 6);
    expect(KE.taxOn(1500000)).toBeCloseTo(28500 + 42000 + 1100000 * 0.27, 6);
  });
});

describe('bordro (2026)', () => {
  it('asgari ücretli: gelir ve damga vergisi istisnası, net = brüt × %85', () => {
    const undo = zeroOT();
    const p = KE.payroll(G, worker(33030), 1);
    undo();
    expect(p.gv).toBe(0);
    expect(p.damga).toBe(0);
    expect(p.net).toBeCloseTo(33030 * 0.85, 2);
  });
  it('işveren maliyeti: %20,75 SGK − 5 puan teşvik + %2 işsizlik', () => {
    const undo = zeroOT();
    const p = KE.payroll(G, worker(50000), 1);
    undo();
    expect(p.sgkV + p.issV).toBeCloseTo(50000 * (0.2075 - 0.05 + 0.02), 2);
    expect(KE.payroll({ payLate: true }, worker(50000), 1).tesvik).toBe(0);
  });
  it('asgari ücreti aşan kısım vergilenir; istisna yalnızca asgari ücret kadar', () => {
    const undo = zeroOT();
    const p = KE.payroll(G, worker(60000), 1);
    undo();
    const matrah = 60000 * 0.85;
    expect(p.gv).toBeCloseTo(KE.taxOn(matrah) - KE.taxOn(33030 * 0.85), 2);
    expect(p.damga).toBeCloseTo((60000 - 33030) * 0.00759, 2);
  });
  it('yıl içinde matrah birikince üst dilime geçer (aralık ayı daha çok vergi)', () => {
    const undo = zeroOT();
    const jan = KE.payroll(G, worker(120000, 0), 1);
    const dec = KE.payroll(G, worker(120000, 120000 * 0.85 * 11), 12);
    undo();
    expect(dec.gv).toBeGreaterThan(jan.gv);
    expect(dec.net).toBeLessThan(jan.net);
  });
  it('bayram ikramiyesi brütün yarısı kadar maliyet ekler', () => {
    const a = KE.payroll(G, worker(40000), 3, { bonus: true }),
      b = KE.payroll(G, worker(40000), 3);
    expect(a.total - b.total).toBe(Math.round(a.brut * 0.5));
  });
});

describe('yıl değişimi', () => {
  it("2027 için asgari ücret ve dilimler artar, 2026'ya dönünce geri gelir", () => {
    KE.CAL.applyYear(2027);
    expect(KE.ECON.asgariBrut).toBeGreaterThan(33030);
    KE.CAL.applyYear(2026);
    expect(KE.ECON.asgariBrut).toBe(33030);
  });
});
