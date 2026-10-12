import { describe, expect, it } from 'vitest';
import { decodeDesign, defaultDesign, encodeDesign, encodeDesignFull, normalizeHex, sanitizeDesign } from './design';
import type { ModelFeatures } from '../data/models';

const ALL: ModelFeatures = { paint: true, rimColor: true, rimStyle: true, rideHeight: true, spoiler: 'addon', frontLip: 'addon', windowTint: true, caliperColor: true };
const NONE: ModelFeatures = { paint: true, rimColor: false, rimStyle: false, rideHeight: false, spoiler: false, frontLip: false, windowTint: false, caliperColor: false };
const base = defaultDesign('#112233', false);

describe('normalizeHex', () => {
  it('kabul eder ve küçük harfe çevirir', () => {
    expect(normalizeHex('AABBCC')).toBe('#aabbcc');
    expect(normalizeHex('#a1b2c3')).toBe('#a1b2c3');
  });
  it('geçersizleri reddeder', () => {
    for (const v of ['', '#abc', 'zzzzzz', '#12345g', 'javascript:alert(1)', 12, null]) expect(normalizeHex(v)).toBeNull();
  });
});

describe('sanitizeDesign', () => {
  it('yüksekliği sınırlar ve yuvarlar', () => {
    expect(sanitizeDesign({ heightMm: 999 }, base, ALL).heightMm).toBe(40);
    expect(sanitizeDesign({ heightMm: '-120' }, base, ALL).heightMm).toBe(-40);
    expect(sanitizeDesign({ heightMm: '12.6' }, base, ALL).heightMm).toBe(13);
    expect(sanitizeDesign({ heightMm: 'NaN' }, base, ALL).heightMm).toBe(0);
  });
  it('geçersiz değerlerde varsayılana döner', () => {
    const d = sanitizeDesign({ paint: 'kırmızı', finish: 'chrome', rimStyle: '<script>', partColor: 'gold' }, base, ALL);
    expect(d).toEqual(base);
  });
  it('yükseklik için nesne, boolean ve null değerlerini dönüştürmez', () => {
    const raised = { ...base, heightMm: 20 };
    for (const heightMm of [null, true, [], {}, { toString: null, valueOf: null }]) {
      expect(sanitizeDesign({ heightMm }, raised, ALL).heightMm).toBe(20);
    }
  });
  it('modelin desteklemediği seçenekleri kapatır', () => {
    const d = sanitizeDesign({ rimColor: 'ff0000', rimStyle: 'dish', heightMm: 30, spoiler: true, lip: true, tint: 'dark', caliper: 'ff0000' }, base, NONE);
    expect(d.tint).toBe('stock');
    expect(d.caliper).toBeNull();
    expect(d.rimColor).toBeNull();
    expect(d.rimStyle).toBe('original');
    expect(d.heightMm).toBe(0);
    expect(d.spoiler).toBe(false);
    expect(d.lip).toBe(false);
  });
});

describe('paylaşım bağlantısı', () => {
  it('kodla → çöz → doğrula sonucu aynı tasarımı verir', () => {
    const d = { ...base, paint: '#ff0000', finish: 'metallic' as const, rimColor: '#c9a227', rimStyle: 'spoke5' as const, heightMm: -25, spoiler: true, lip: true, partColor: 'carbon' as const, tint: 'dark' as const, caliper: '#c4161c' };
    const q = encodeDesign(d, base);
    expect(sanitizeDesign(decodeDesign(new URLSearchParams(q.toString())), base, ALL)).toEqual(d);
  });
  it('varsayılan tasarım boş sorgu üretir', () => {
    expect(encodeDesign(base, base).toString()).toBe('');
  });
  it('tam kodlama varsayılanlardan bağımsız çözülür', () => {
    const d = { ...base, paint: '#00ff00', spoiler: true };
    const other = defaultDesign('#999999', false);
    expect(sanitizeDesign(decodeDesign(encodeDesignFull(d)), other, ALL)).toEqual(d);
  });
});

describe('yeni ayarlar', () => {
  const F = { paint: true, rimColor: true, rimStyle: true, rideHeight: true, spoiler: 'addon', frontLip: 'addon', windowTint: true, caliperColor: true } as const;
  const b = defaultDesign('#112233', false);
  it('sedef ve saten yüzeyler kabul edilir, geçersiz film reddedilir', () => {
    expect(sanitizeDesign({ finish: 'pearl' }, b, F).finish).toBe('pearl');
    expect(sanitizeDesign({ finish: 'satin' }, b, F).finish).toBe('satin');
    expect(sanitizeDesign({ tint: 'opak' }, b, F).tint).toBe('stock');
    expect(sanitizeDesign({ caliper: 'javascript:1' }, b, F).caliper).toBeNull();
  });
});
