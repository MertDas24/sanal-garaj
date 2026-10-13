import { describe, expect, it } from 'vitest';
import { EN, EN_PATTERNS, enNumber } from './en';
import { POWERTRAIN_FIELDS, POWERTRAIN_GROUPS, POWERTRAIN_KEYS, defaultPowertrain } from '../lib/powertrain';
import { CALIPER_SWATCHES, FINISH_LABELS, PAINT_SWATCHES, PRESETS, RIM_FINISH_LABELS, RIM_STYLE_LABELS, RIM_SWATCHES, SPOILER_LABELS, TINT_LABELS, WRAP_LABELS, defaultDesign } from '../lib/design';
import { checkPowertrain, ENGINE_REFERENCES } from '../lib/compatibility';
import { designSummary } from '../lib/designFile';
import { CATALOG, CATEGORY_LABELS } from '../data/catalog';
import { MODELS } from '../data/models';
import { ENVIRONMENTS, SHOTS } from '../three/scenes';

// Arayüzde koşula bağlı görünen, veriden gelen metinler: tarayıcı taraması her durumu göremediği için
// sözlükte karşılıkları doğrudan veriler üzerinden denetlenir.
const translates = (text: string) => EN[text] !== undefined || EN_PATTERNS.some(([p, r]) => { const m = text.match(p); return !!m && (typeof r === 'string' || r(...m) !== undefined); });

describe('İngilizce sözlük kapsamı', () => {
  it('motor planının 45 kategorisi, grupları ve tüm seçenekleri', () => {
    const texts = POWERTRAIN_KEYS.flatMap((key) => [POWERTRAIN_FIELDS[key].label, ...Object.values(POWERTRAIN_FIELDS[key].options as Record<string, string>)]);
    expect([...POWERTRAIN_GROUPS, ...texts].filter((t) => !translates(t))).toEqual([]);
  });
  it('tasarım etiketleri, renkler, paketler, ortamlar ve kamera açıları', () => {
    const texts = [
      ...Object.values(WRAP_LABELS), ...Object.values(RIM_FINISH_LABELS), ...Object.values(SPOILER_LABELS), ...Object.values(TINT_LABELS),
      ...Object.values(FINISH_LABELS), ...Object.values(RIM_STYLE_LABELS), ...Object.values(CATEGORY_LABELS),
      ...[...PAINT_SWATCHES, ...CALIPER_SWATCHES, ...RIM_SWATCHES].map((s) => s.name),
      ...PRESETS.flatMap((p) => [p.label, p.hint]), ...ENVIRONMENTS.map((e) => e.label), ...SHOTS.map((s) => s.label),
    ];
    expect(texts.filter((t) => !translates(t))).toEqual([]);
  });
  it('uyumluluk uyarıları, motor kayıtları, katalog ve model notları', () => {
    const plans = [
      { ...defaultPowertrain(), layout: 'v8' as const, aspiration: 'single' as const, fuel: 'e85' as const, transmission: 'automatic' as const, clutch: 'sport' as const, drivetrain: 'awd' as const },
      { ...defaultPowertrain(), layout: 'electric' as const },
      { ...defaultPowertrain(), intercooler: 'front' as const },
    ];
    const warnings = plans.flatMap((plan) => [...checkPowertrain(plan, 'bmw-m3-e30'), ...checkPowertrain(plan, 'toyota-ae86')]);
    const texts = [...warnings, ...Object.values(ENGINE_REFERENCES).map((r) => r.label), ...CATALOG.flatMap((v) => v.note ?? []), ...MODELS.flatMap((m) => m.notes ?? [])];
    expect(texts.filter((t) => !translates(t))).toEqual([]);
  });
  it('modifikasyon listesindeki tüm satırlar', () => {
    const base = defaultDesign('#ffffff', false);
    const all = { ...base, paint: '#ff0000', finish: 'pearl' as const, wrap: 'double' as const, skirts: true, diffuser: true, exhaustTips: true, fenders: true, bumper: true,
      wrapWidth: 120, wrapOffset: 10, wrapRotation: 5, decalText: 'X', rimStyle: 'turbine' as const, rimColor: '#111111', rimFinish: 'chrome' as const, rimScale: 105,
      powertrain: { ...defaultPowertrain(), aspiration: 'twin' as const } };
    const rows = designSummary(all, base);
    expect(rows.length).toBeGreaterThan(10);
    expect(rows.filter((r) => !translates(r.label)).map((r) => r.label)).toEqual([]);
  });
  it('Türkçe sayı biçimi İngilizceye çevrilir', () => {
    expect(enNumber('197.630 üçgen · 3,8 MB')).toBe('197,630 üçgen · 3.8 MB');
    expect(enNumber('1,91 m × 1,27 m')).toBe('1.91 m × 1.27 m');
  });
});
