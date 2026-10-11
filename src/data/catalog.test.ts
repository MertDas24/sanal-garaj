import { describe, expect, it } from 'vitest';
import { CATALOG } from './catalog';
import { MODELS, findModel } from './models';
import fs from 'node:fs';

describe('katalog ve model kayıtları', () => {
  it('25 araç, benzersiz kimlikler', () => {
    expect(CATALOG).toHaveLength(25);
    expect(new Set(CATALOG.map((v) => v.id)).size).toBe(25);
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
  it('model dosyaları makul boyutta (< 1 MB)', () => {
    for (const m of MODELS) expect(m.bytes).toBeLessThan(1024 * 1024);
  });
});
