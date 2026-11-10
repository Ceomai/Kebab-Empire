import { describe, it, expect } from 'vitest';
import { loadGame } from './load.js';
const { KE } = loadGame();
const T = (s) => Date.parse(s + 'T00:00:00Z');

describe('takvim', () => {
  it('2026 Ramazan ve bayramları Diyanet takvimiyle uyuşur', () => {
    const y = KE.CAL.year(2026);
    expect(y.ramazan).toEqual({ start: '2026-02-19', end: '2026-03-19' });
    expect(y.religious['2026-03-20']).toBe('Ramazan Bayramı');
    expect(y.religious['2026-03-22']).toBe('Ramazan Bayramı');
    expect(y.religious['2026-03-23']).toBeUndefined();
    expect(y.religious['2026-05-27']).toBe('Kurban Bayramı');
    expect(y.religious['2026-05-30']).toBe('Kurban Bayramı');
  });
  it('hicri aylar 29–30 gün, Ramazanlar art arda 354–355 gün arayla', () => {
    for (let hy = 1449; hy <= 1470; hy++) {
      const len = (KE.CAL.monthStart(hy, 10) - KE.CAL.monthStart(hy, 9)) / 864e5;
      expect(len).toBeGreaterThanOrEqual(29); expect(len).toBeLessThanOrEqual(30);
      const gap = (KE.CAL.monthStart(hy + 1, 9) - KE.CAL.monthStart(hy, 9)) / 864e5;
      expect(gap).toBeGreaterThanOrEqual(353); expect(gap).toBeLessThanOrEqual(356);
    }
  });
  it('bir yılda iki Ramazan başlangıcı olabilir (2030)', () => {
    expect(KE.CAL.year(2030).ramazans.length).toBe(2);
    expect(KE.CAL.ramazanOn(T('2030-12-28'))).toBeTruthy();
    expect(KE.CAL.ramazanOn(T('2030-01-10'))).toBeTruthy();
    expect(KE.CAL.ramazanOn(T('2030-07-10'))).toBeNull();
  });
  it('resmî tatiller her yıl var', () => {
    expect(KE.CAL.holidayOn(T('2031-10-29'))).toBe('Cumhuriyet Bayramı');
    expect(KE.CAL.religiousOn(T('2031-10-29'))).toBeNull();
  });
  it('İstanbul gün batımı (kalıcı UTC+3) gerçek değerlere yakın', () => {
    const m = (s) => KE.CAL.sunsetMinute(T(s));
    expect(Math.abs(m('2025-03-01') - (18 * 60 + 55))).toBeLessThanOrEqual(4); // Diyanet 2025 ilk iftar
    expect(Math.abs(m('2026-06-21') - (20 * 60 + 40))).toBeLessThanOrEqual(5);
    expect(Math.abs(m('2026-12-21') - (17 * 60 + 40))).toBeLessThanOrEqual(5);
  });
  it('ekonomi yıl yıl türetilir', () => {
    expect(KE.CAL.econYear(2026).asgariBrut).toBe(33030);
    const e = KE.CAL.econYear(2028);
    expect(e.asgariBrut).toBeGreaterThan(50000);
    expect(e.gvDilim[0][0]).toBeGreaterThan(190000);
  });
  it('bayram ikramiyesi ayları hesaplanır', () => {
    expect(KE.bonusMonths['2026-03']).toBe('Ramazan Bayramı');
    expect(KE.bonusMonths['2026-04']).toBeNull();
    expect(KE.bonusMonths['2030-02']).toBe('Ramazan Bayramı');
  });
});

describe('uzaktan ayar', () => {
  it('yalnızca beyaz listedeki ve geçerli değerleri uygular', () => {
    const { KE } = loadGame(['data', 'util', 'calendar', 'characters', 'economy', 'sim/rng', 'sim/staff', 'sim/branch', 'sim/morning', 'sim/service', 'sim/player', 'sim/close', 'sim/replay', 'midday', 'progress', 'config']);
    KE.CONFIG.apply({ version: 5, econYears: { 2027: { asgariBrut: 42000, gvDilim: [[250000, 0.15], [null, 0.4]] } }, trafficMul: { doner: 99 }, evil: 'x' });
    expect(KE.CAL.econYear(2027).asgariBrut).toBe(42000);
    expect(KE.CAL.econYear(2027).gvDilim[1][0]).toBe(Infinity);
    expect(KE.MODES.doner.trafficMul).not.toBe(99);
    expect(KE.CONFIG.version).toBe(5);
  });
});
