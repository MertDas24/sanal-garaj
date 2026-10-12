import { beforeEach, describe, expect, it } from 'vitest';
import { loadSaved } from './storage';

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
});
