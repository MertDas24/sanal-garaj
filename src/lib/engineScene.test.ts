import { expect, it } from 'vitest';
import { defaultPowertrain, POWERTRAIN_KEYS } from './powertrain';
import { engineParts, engineSpec, turboCount } from './engineScene';
it('bilinmeyen fabrika motoruna silindir düzeni uydurmaz; üretici kaydı kullanılabilir', () => {
  expect(engineSpec(defaultPowertrain(), 'mercedes-c63-amg-w204').layout).toBe('unknown');
  expect(engineSpec(defaultPowertrain(), 'toyota-ae86').cylinders).toBe(4);
  expect(engineSpec({ ...defaultPowertrain(), layout: 'v12' }, 'toyota-ae86')).toMatchObject({ cylinders: 12, banks: 2 });
});
it('45 kategoriyi değişiklik durumuyla eşler; elektrikli şemaya içten yanmalı parça taşımaz', () => {
  const plan = { ...defaultPowertrain(), layout: 'electric' as const, electricMotor: 'triple' as const, aspiration: 'twin' as const };
  const parts = engineParts(plan);
  expect(parts.map((p) => p.key)).toEqual(POWERTRAIN_KEYS);
  expect(parts.find((p) => p.key === 'aspiration')).toMatchObject({ enabled: false, changed: false });
  expect(engineSpec(plan, '')).toMatchObject({ motors: 3, cylinders: 0 });
  expect(turboCount(engineSpec(plan, '').plan)).toBe(0);
});
it('tek/çift turbo ve fabrika seçimi farklı görsel sistem üretir', () => {
  const base = defaultPowertrain();
  expect(turboCount(base)).toBe(0);
  expect(turboCount({ ...base, aspiration: 'single' })).toBe(1);
  expect(turboCount({ ...base, aspiration: 'twin' })).toBe(2);
  expect(engineParts(base).find((p) => p.key === 'aspiration')?.shape).toBe('box');
  expect(engineParts({ ...base, aspiration: 'single' }).find((p) => p.key === 'aspiration')).toMatchObject({ shape: 'turbo', changed: true });
});
