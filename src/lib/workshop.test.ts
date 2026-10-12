import { describe, expect, it } from 'vitest';
import { defaultDesign, sanitizeDesign, encodeDesignFull, decodeDesign } from './design';
import { parseDesignFile, serializeDesignFile, designSummary } from './designFile';
import { moveHistory, pushHistory, type DesignHistory } from './useDesignHistory';

const base = defaultDesign('#112233', false);
const features = { paint: true, rimColor: true, rimStyle: true, rideHeight: true, spoiler: 'addon', frontLip: 'addon', windowTint: true, caliperColor: true, stance: true, wrap: true, underglow: true } as const;
const modified = { ...base, wrap: 'double' as const, wrapColor: '#c4161c', rimStyle: 'mesh' as const, rimFinish: 'chrome' as const, rimScale: 110, wheelWidth: 112, offsetMm: 15, frontCamber: -3, rearCamber: -4.5, spoiler: true, spoilerStyle: 'gt' as const, lip: true, lipExtension: 140, underglow: true, glowColor: '#9b59ff' };

describe('atölye tasarım doğrulaması', () => {
  it('tüm yeni ayarlar paylaşım bağlantısında korunur', () => {
    expect(sanitizeDesign(decodeDesign(encodeDesignFull(modified)), base, features)).toEqual(modified);
  });
  it('güvensiz değerleri sınırlar ve desteklenmeyen seçenekleri kapatır', () => {
    const d = sanitizeDesign({ offsetMm: 999, frontCamber: -90, wheelWidth: 300, rimScale: -2, lipExtension: 999, wrapColor: 'javascript:1' }, base, features);
    expect(d).toMatchObject({ offsetMm: 25, frontCamber: -8, wheelWidth: 115, rimScale: 85, lipExtension: 150, wrapColor: base.wrapColor });
    expect(sanitizeDesign(modified, base, { ...features, stance: false, wrap: false, underglow: false, rimStyle: false, spoiler: false, frontLip: false })).toMatchObject({ wrap: 'none', offsetMm: 0, frontCamber: 0, underglow: false, spoilerStyle: 'sport', lipExtension: 100, rimScale: 100 });
    expect(sanitizeDesign({ wrap: 'roof' }, base, { ...features, wrapStyles: ['hood'] }).wrap).toBe('none');
    expect(() => sanitizeDesign({ wrap: { toString: null }, frontCamber: { valueOf: null } }, base, features)).not.toThrow();
  });
  it('JSON dosyası geçerli ayarları ve ortamı taşır, sürüm ve araç doğrulanır', () => {
    const result = parseDesignFile(serializeDesignFile('toyota-ae86', modified, 'sunset'));
    expect(result).toEqual({ vehicleId: 'toyota-ae86', design: modified, environment: 'sunset' });
    for (const text of ['{broken', '{}', JSON.stringify({ format: 'sanal-garaj', version: 2 }), JSON.stringify({ format: 'sanal-garaj', version: 1, vehicleId: '../x' }), 'a'.repeat(128 * 1024 + 1)]) expect(() => parseDesignFile(text)).toThrow();
  });
  it('modifikasyon listesinde etkin ayarları gösterir', () => {
    expect(designSummary(base, base)).toEqual([]);
    expect(designSummary(modified, base)).toContainEqual({ label: 'Kaplama', value: 'Çift şerit' });
    expect(designSummary({ ...base, glowColor: '#ffffff' }, base)).toEqual([]);
  });
});

describe('tasarım geçmişi', () => {
  it('geri/ileri alır, yeni seçim ileri geçmişini siler ve 50 adımla sınırlar', () => {
    const initial: DesignHistory = { past: [], present: base, future: [] };
    const changed = pushHistory(initial, modified);
    expect(moveHistory(changed, 'undo').present).toEqual(base);
    expect(moveHistory(moveHistory(changed, 'undo'), 'redo').present).toEqual(modified);
    expect(pushHistory(moveHistory(changed, 'undo'), { ...base, paint: '#ffffff' }).future).toEqual([]);
    let history = initial;
    for (let i = 0; i < 80; i++) history = pushHistory(history, { ...base, offsetMm: i });
    expect(history.past).toHaveLength(50);
    expect(pushHistory(changed, modified)).toBe(changed);
  });
});
