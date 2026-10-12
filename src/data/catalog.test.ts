import { describe, expect, it } from 'vitest';
import { CATALOG } from './catalog';
import { MODELS, findModel } from './models';
import fs from 'node:fs';

describe('katalog ve model kayıtları', () => {
  it('en az 25 araç, benzersiz kimlikler', () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(25);
    expect(new Set(CATALOG.map((v) => v.id)).size).toBe(CATALOG.length);
  });
  it('her model dosyası katalogda bir araca bağlı (kullanılmayan model yok)', () => {
    for (const m of MODELS) expect(CATALOG.some((v) => v.modelId === m.id), m.id).toBe(true);
  });
  it('her modelId gerçek bir model dosyasına karşılık gelir ve bir model iki araçta kullanılmaz', () => {
    const used = CATALOG.filter((v) => v.modelId).map((v) => v.modelId!);
    expect(new Set(used).size).toBe(used.length);
    for (const id of used) {
      const m = findModel(id);
      expect(m, id).toBeDefined();
      expect(fs.existsSync(`public/${m!.file}`), m!.file).toBe(true);
      expect(fs.existsSync(`public/thumbs/${m!.id}.jpg`), `${m!.id} küçük resmi`).toBe(true);
    }
  });
  it('her modelin kaynak ve lisans kaydı var', () => {
    for (const m of MODELS) {
      expect(m.source.author.length).toBeGreaterThan(0);
      expect(m.source.url).toMatch(/^https:\/\//);
      expect(['CC-BY-3.0', 'CC-BY-4.0', 'CC0-1.0']).toContain(m.source.license);
      expect(m.features.paint).toBe(true);
    }
  });
  it('model dosyaları makul boyutta (< 6 MB)', () => {
    for (const m of MODELS) expect(m.bytes, m.id).toBeLessThan(6 * 1024 * 1024);
  });
});
