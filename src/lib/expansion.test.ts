import { describe, expect, it } from 'vitest';
import { defaultDesign, sanitizeDesign, encodeDesignFull, decodeDesign } from './design';
import { defaultPowertrain } from './powertrain';
import { checkPowertrain } from './compatibility';
import { parseHash } from './router';
import { chooseQuality } from './quality';
import { parseDesignFile, serializeDesignFile } from './designFile';
const base = defaultDesign('#ffffff', false);
const features = { paint: true, rimColor: true, rimStyle: true, rideHeight: true, spoiler: 'addon', frontLip: 'addon', windowTint: true, caliperColor: true, wrap: true, bodyKit: true } as const;
describe('genişletilmiş atölye', () => {
  it('kit, kaplama ve yazıyı link/dosya üzerinden eksiksiz taşır', () => {
    const design = { ...base, skirts: true, diffuser: true, exhaustTips: true, fenders: true, bumper: true, wrapWidth: 70, wrapOffset: -15, wrapRotation: 12, decalText: 'Türkçe & garaj?', decalRegion: 'left' as const };
    expect(sanitizeDesign(decodeDesign(encodeDesignFull(design)), base, features)).toEqual(design);
    expect(parseDesignFile(serializeDesignFile('toyota-ae86', design, 'studio')).design).toEqual(design);
    expect(sanitizeDesign(design, base, { ...features, bodyKit: false })).toMatchObject({ skirts: false, diffuser: false, exhaustTips: false, fenders: false, bumper: false });
    expect(sanitizeDesign(design, base, { ...features, decalRegions: ['hood'] })).toMatchObject({ decalText: '', decalRegion: 'hood' });
  });
  it('logo/script, kontrol karakteri ve taşan sayıları temizler', () => {
    expect(sanitizeDesign({ decalLogo: 'data:image/svg+xml,<script/>', decalText: 'A\u0000B', wrapWidth: Infinity, wrapOffset: 999, wrapRotation: -999 }, base, features)).toMatchObject({ decalLogo: '', decalText: 'AB', wrapWidth: 100, wrapOffset: 25, wrapRotation: -30 });
    expect(parseHash('#/arac/%zz').name).toBe('notfound');
  });
  it('motor planında dönüşüm bağımlılıklarını belirtir; fabrika planına sorun üretmez', () => {
    expect(checkPowertrain(defaultPowertrain(), 'bmw-m3-e30')).toEqual([]);
    expect(checkPowertrain({ ...defaultPowertrain(), downpipe: 'upgraded' }, 'bmw-m3-e30').join(' ')).toContain('atmosferik');
    expect(checkPowertrain({ ...defaultPowertrain(), layout: 'electric' }, 'toyota-ae86').join(' ')).toContain('eksik');
    expect(checkPowertrain({ ...defaultPowertrain(), aspiration: 'twin', fuel: 'e85' }, 'unknown')).toHaveLength(2);
  });
  it('otomatik kalite düşük cihazda hafif, elle seçimde seçilen profil olur', () => {
    expect(chooseQuality('auto', 4, 2, false)).toBe(false); expect(chooseQuality('auto', 8, 8, false)).toBe(true);
    expect(chooseQuality('auto', 8, 8, true)).toBe(false); expect(chooseQuality('high', 2, 2, true)).toBe(true); expect(chooseQuality('low', 16, 16, false)).toBe(false);
  });
});
