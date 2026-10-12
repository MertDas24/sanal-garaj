import { ENGINE_REFERENCES } from './compatibility';
import { POWERTRAIN_FIELDS, POWERTRAIN_KEYS, isPowertrainFieldEnabled, sanitizePowertrain, type PowertrainDesign, type PowertrainKey } from './powertrain';

export function engineSpec(input: PowertrainDesign, vehicleId: string) {
  const plan = sanitizePowertrain(input);
  const layout = plan.layout === 'stock' ? ENGINE_REFERENCES[vehicleId]?.layout ?? 'unknown' : plan.layout;
  const cylinders = ({ i4: 4, i6: 6, v6: 6, v8: 8, v10: 10, v12: 12 } as Record<string, number>)[layout] ?? 0;
  return { plan, layout, cylinders, banks: layout.startsWith('v') ? 2 : 1,
    motors: layout === 'electric' ? ({ stock: 1, single: 1, dual: 2, triple: 3 }[plan.electricMotor]) : 0,
    label: layout === 'unknown' ? 'Temel motor düzeni doğrulanmadı; bir motor düzeni seçin.' :
      layout === 'electric' ? 'Elektrikli dönüşüm şeması' : layout === 'rotary' ? 'Rotary motor şeması' : `${cylinders} silindirli ${layout.startsWith('v') ? 'V' : 'sıralı'} motor şeması`,
    basis: plan.layout === 'stock' && ENGINE_REFERENCES[vehicleId] ? ENGINE_REFERENCES[vehicleId].label : 'Genel, prosedürel şema; bu aracın gerçek motor modeli değildir.' };
}

export type EngineShape = 'box' | 'disc' | 'tank' | 'fins' | 'turbo' | 'pipe' | 'gear';
export function engineParts(input: PowertrainDesign) {
  const plan = sanitizePowertrain(input);
  return POWERTRAIN_KEYS.map((key) => {
    const field = POWERTRAIN_FIELDS[key], options = Object.keys(field.options);
    let shape: EngineShape = 'box';
    if (['pistons', 'pump', 'nitrous', 'waterMeth', 'breather', 'electricMotor'].includes(key)) shape = 'tank';
    if (['crank', 'cams', 'throttle', 'valves', 'clutch', 'flywheel', 'fans'].includes(key)) shape = 'disc';
    if (['radiator', 'intercooler', 'oil', 'batteryCooling'].includes(key)) shape = 'fins';
    if (key === 'aspiration') shape = ['stock', 'supercharger'].includes(plan.aspiration) ? 'box' : 'turbo';
    if (['intake', 'manifold', 'rail', 'exhaustManifold', 'downpipe', 'catalyst', 'exhaust', 'driveshaft'].includes(key)) shape = 'pipe';
    if (['transmission', 'differential', 'finalDrive', 'rods'].includes(key)) shape = 'gear';
    return { key, label: field.label, group: field.group, value: plan[key],
      valueLabel: (field.options as Record<string, string>)[plan[key]], enabled: isPowertrainFieldEnabled(key, plan),
      changed: plan[key] !== 'stock', variant: options.indexOf(plan[key]), shape };
  });
}
export type EnginePart = ReturnType<typeof engineParts>[number];
export function turboCount(plan: PowertrainDesign): number {
  if (plan.layout === 'electric' || plan.aspiration === 'stock' || plan.aspiration === 'supercharger') return 0;
  return ['twin', 'sequential'].includes(plan.aspiration) ? 2 : 1;
}
export function enginePartValue(plan: PowertrainDesign, key: PowertrainKey): string {
  return (POWERTRAIN_FIELDS[key].options as Record<string, string>)[plan[key]];
}
