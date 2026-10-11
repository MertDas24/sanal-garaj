import { describe, expect, it } from 'vitest';
import { editorHash, parseHash } from './router';

describe('parseHash', () => {
  it('sayfaları tanır', () => {
    expect(parseHash('').name).toBe('catalog');
    expect(parseHash('#/').name).toBe('catalog');
    expect(parseHash('#/tasarimlarim').name).toBe('saved');
    expect(parseHash('#/foto').name).toBe('photo');
    expect(parseHash('#/kendi-modelin').name).toBe('custom');
    expect(parseHash('#/kaynaklar').name).toBe('credits');
    expect(parseHash('#/yok').name).toBe('notfound');
  });
  it('düzenleyici rotasını ve sorguyu ayrıştırır', () => {
    const r = parseHash(editorHash('toyota-ae86', new URLSearchParams({ p: 'ff0000', h: '-20' })));
    expect(r).toMatchObject({ name: 'editor', vehicleId: 'toyota-ae86' });
    if (r.name === 'editor') expect(r.query.get('h')).toBe('-20');
  });
});
