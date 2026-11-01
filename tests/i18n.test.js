import { describe, it, expect } from 'vitest';
import { loadGame } from './load.js';

describe('çeviri katmanı', () => {
  const { KE } = loadGame(['data', 'calendar', 'characters', 'economy', 'sim', 'midday', 'progress', 'farm', 'narrative', 'i18n']);
  it('sayıları ve adları yer tutucuya çevirir', () => {
    const r = KE.I18N.normalize('Günün yıldızı İskender oldu: 17 porsiyon.');
    expect(r.key).toBe('Günün yıldızı {0} oldu: {1} porsiyon.');
    expect(r.parts).toEqual(['İskender', '17']);
    expect(KE.I18N.normalize('Yaprak için 12.450 ₺ ve 3 kg').key).toBe('Yaprak için {0} ve {1} kg');
  });
  it('kalıbı çevirip yer tutucuları çevrilmiş adlarla doldurur', () => {
    KE.I18N.lang = 'en';
    KE.I18N.dict = { 'Günün yıldızı {0} oldu: {1} porsiyon.': 'Star of the day: {0}, {1} portions.', 'İskender': 'İskender', 'Tavuk Dürüm': 'Chicken Dürüm', '{0} müşteri': '{0} customers' };
    expect(KE.I18N.t('Günün yıldızı Tavuk Dürüm oldu: 9 porsiyon.')).toBe('Star of the day: Chicken Dürüm, 9 portions.');
    expect(KE.I18N.t('  12 müşteri ')).toBe('  12 customers ');
    expect(KE.I18N.t('Sözlükte olmayan metin')).toBe('Sözlükte olmayan metin');
    KE.I18N.lang = 'tr';
  });
});
