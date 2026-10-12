import { beforeEach, describe, expect, it } from 'vitest';
import { loadSaved } from './storage';
import { decodeDesign, defaultDesign, encodeDesignFull, sanitizeDesign } from './design';

const KEY = 'sanal-garaj:tasarimlar:v1';
const mem = new Map<string, string>();
globalThis.localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
} as Storage;

describe('kayıtlı tasarım doğrulaması', () => {
  beforeEach(() => mem.clear());
  it('bozuk veya kötü niyetli kayıtları atar', () => {
    const ok = { id: 'a', vehicleId: 'bmw-m3-e30', name: 'Benim', createdAt: 1, design: { paint: '#ff0000' }, thumb: 'javascript:alert(1)' };
    mem.set(KEY, JSON.stringify([ok, { id: 'b', vehicleId: '../x', name: 'x', createdAt: 1, design: { paint: '#ff0000' } }, { id: 'c' }, null, 'yazı']));
    const list = loadSaved();
    expect(list).toHaveLength(1);
    expect(list[0].thumb).toBeNull();
  });
  it('geçersiz JSON boş liste döndürür', () => {
    mem.set(KEY, '{bozuk');
    expect(loadSaved()).toEqual([]);
  });
  it('bozuk tasarım alanları kayıtlı tasarımların bağlantılarını bozmaz', () => {
    mem.set(KEY, JSON.stringify([{
      id: 'a', vehicleId: 'bmw-m3-e30', name: 'Benim', createdAt: 1,
      design: { paint: '#AABBCC', rimColor: 42, caliper: {}, finish: 'chrome', tint: [], heightMm: 999 },
    }]));
    const [saved] = loadSaved();
    expect(saved.design).toEqual({ ...defaultDesign('#aabbcc', false), heightMm: 40 });
    expect(() => encodeDesignFull(saved.design)).not.toThrow();
  });
  it('geçerli tüm ayarlar kayıttan paylaşım bağlantısına aynı şekilde taşınır', () => {
    const features = {
      paint: true, rimColor: true, rimStyle: true, rideHeight: true,
      spoiler: 'addon', frontLip: 'addon', windowTint: true, caliperColor: true,
    } as const;
    const design = {
      ...defaultDesign('#aabbcc', true), finish: 'pearl' as const, rimColor: '#c9a227',
      rimStyle: 'multi' as const, heightMm: -25, lip: true, partColor: 'carbon' as const,
      tint: 'dark' as const, caliper: '#c4161c',
    };
    mem.set(KEY, JSON.stringify([{ id: 'a', vehicleId: 'bmw-m3-e30', name: 'Benim', createdAt: 1, design }]));
    const [saved] = loadSaved();
    expect(saved.design).toEqual(design);
    expect(sanitizeDesign(decodeDesign(encodeDesignFull(saved.design)), defaultDesign('#000000', false), features)).toEqual(design);
  });
});
