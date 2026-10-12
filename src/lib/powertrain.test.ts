import { describe, expect, it } from 'vitest';
import { defaultPowertrain, sanitizePowertrain, encodePowertrain, decodePowertrain, POWERTRAIN_KEYS, POWERTRAIN_FIELDS, powertrainSummary } from './powertrain';
import { defaultDesign, sanitizeDesign, decodeDesign, encodeDesignFull } from './design';
import { serializeDesignFile, parseDesignFile, designSummary } from './designFile';

const features = { paint: true, rimColor: true, rimStyle: true, rideHeight: true, spoiler: 'addon', frontLip: 'addon', windowTint: true, caliperColor: true } as const;
describe('motor ve aktarma planı', () => {
  it('her parça kategorisinin tüm seçenekleri doğrulanır ve taşınır', () => {
    expect(POWERTRAIN_KEYS.length).toBeGreaterThanOrEqual(40);
    for (const key of POWERTRAIN_KEYS) for (const value of Object.keys(POWERTRAIN_FIELDS[key].options)) {
      const electric = POWERTRAIN_FIELDS[key].group === 'Elektrikli dönüşüm';
      const input = { ...defaultPowertrain(), ...(electric ? { layout: 'electric' } : {}), [key]: value };
      const clean = sanitizePowertrain(input);
      expect(clean[key], `${key}:${value}`).toBe(value);
      expect(decodePowertrain(encodePowertrain(clean))).toEqual(clean);
    }
  });
  it('elektrikli dönüşümde içten yanmalı parçalar temizlenir', () => {
    const clean = sanitizePowertrain({ layout: 'electric', aspiration: 'twin', cams: 'race', nitrous: 'wet', clutch: 'twin', electricMotor: 'dual', battery: 'power' });
    expect(clean).toMatchObject({ aspiration: 'stock', cams: 'stock', nitrous: 'stock', clutch: 'stock', electricMotor: 'dual', battery: 'power' });
    expect(sanitizePowertrain({ ...clean, layout: 'v8' })).toMatchObject({ electricMotor: 'stock', battery: 'stock' });
  });
  it('bozuk, aşırı uzun ve bilinmeyen değerler varsayılana döner', () => {
    for (const bad of [null, 'text', [], { layout: '<script>', ecu: {}, aspiration: 'constructor', fakePart: true }]) expect(sanitizePowertrain(bad)).toEqual(defaultPowertrain());
    expect(decodePowertrain('{bad')).toEqual(defaultPowertrain());
    expect(decodePowertrain(' '.repeat(8193))).toEqual(defaultPowertrain());
    expect(encodePowertrain(defaultPowertrain())).toBe('{}');
  });
  it('paylaşım, JSON ve modifikasyon listesi aynı motor planını korur', () => {
    const base = defaultDesign('#112233', false);
    const design = { ...base, powertrain: sanitizePowertrain({ layout: 'v8', ecu: 'standalone', aspiration: 'supercharger', exhaust: 'valved', differential: 'lsd15' }) };
    expect(sanitizeDesign(decodeDesign(encodeDesignFull(design)), base, features)).toEqual(design);
    expect(parseDesignFile(serializeDesignFile('toyota-ae86', design, 'studio')).design).toEqual(design);
    expect(designSummary(design, base)).toContainEqual({ label: 'Motor planı · Turbo / kompresör', value: 'Mekanik kompresör' });
    expect(powertrainSummary(defaultPowertrain())).toEqual([]);
  });
});
