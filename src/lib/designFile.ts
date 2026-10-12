import { findVehicle } from '../data/catalog';
import { findModel } from '../data/models';
import { defaultDesign, sanitizeDesign, FINISH_LABELS, RIM_STYLE_LABELS, WRAP_LABELS, RIM_FINISH_LABELS, TINT_LABELS, SPOILER_LABELS, type Design } from './design';
import { findEnv, type EnvId } from '../three/scenes';
import { powertrainSummary } from './powertrain';

export const MAX_DESIGN_FILE_BYTES = 128 * 1024;
export function parseDesignFile(text: string): { vehicleId: string; design: Design; environment: EnvId } {
  if (text.length > MAX_DESIGN_FILE_BYTES) throw new Error('Tasarım dosyası en fazla 128 KB olabilir.');
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new Error('Dosya geçerli JSON içermiyor.'); }
  if (!data || typeof data !== 'object') throw new Error('Geçersiz tasarım dosyası.');
  const d = data as Record<string, unknown>;
  if (d.format !== 'sanal-garaj' || d.version !== 1) throw new Error('Desteklenmeyen tasarım dosyası sürümü.');
  const vehicle = typeof d.vehicleId === 'string' ? findVehicle(d.vehicleId) : undefined;
  const model = findModel(vehicle?.modelId);
  if (!vehicle || !model) throw new Error('Dosyadaki araç bu katalogda bulunmuyor.');
  if (!d.design || typeof d.design !== 'object' || Array.isArray(d.design)) throw new Error('Tasarım ayarları eksik.');
  return {
    vehicleId: vehicle.id,
    // Ek geometri yetenekleri model yüklenince gerçek ölçümlerle tekrar doğrulanır.
    design: sanitizeDesign(d.design, defaultDesign('#cccccc', model.features.spoiler === 'builtin'), { ...model.features, stance: true, wrap: true, underglow: true }),
    environment: findEnv(typeof d.environment === 'string' ? d.environment : null).id,
  };
}
export function serializeDesignFile(vehicleId: string, design: Design, environment: EnvId): string {
  const vehicle = findVehicle(vehicleId);
  const model = findModel(vehicle?.modelId);
  return JSON.stringify({ format: 'sanal-garaj', version: 1, vehicleId, environment, design,
    source: model?.source, note: 'Görsel tasarım; mekanik uyumluluk veya performans simülasyonu değildir.' }, null, 2);
}
export function designSummary(d: Design, base: Design): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const add = (key: keyof Design, label: string, value: string) => { if (d[key] !== base[key]) rows.push({ label, value }); };
  add('paint', 'Gövde rengi', d.paint.toUpperCase()); add('finish', 'Boya yüzeyi', FINISH_LABELS[d.finish]);
  add('wrap', 'Kaplama', WRAP_LABELS[d.wrap]);
  if (d.wrap !== 'none') add('wrapColor', 'Kaplama rengi', d.wrapColor.toUpperCase());
  add('rimStyle', 'Jant', RIM_STYLE_LABELS[d.rimStyle]); add('rimColor', 'Jant rengi', d.rimColor?.toUpperCase() ?? 'Orijinal');
  add('rimFinish', 'Jant yüzeyi', RIM_FINISH_LABELS[d.rimFinish]);
  if (d.rimStyle !== 'original') add('rimScale', 'Eklenti jant çapı', `%${d.rimScale}`);
  add('wheelWidth', 'Tekerlek genişliği', `%${d.wheelWidth}`); add('offsetMm', 'Dışa açılma', `${d.offsetMm} mm`);
  add('frontCamber', 'Ön kamber', `${d.frontCamber}°`); add('rearCamber', 'Arka kamber', `${d.rearCamber}°`);
  add('heightMm', 'Yükseklik', `${d.heightMm} mm`); add('tint', 'Cam filmi', TINT_LABELS[d.tint]);
  add('caliper', 'Kaliper', d.caliper?.toUpperCase() ?? 'Orijinal');
  add('spoiler', 'Spoiler', d.spoiler ? 'Açık' : 'Kapalı');
  if (d.spoiler) add('spoilerStyle', 'Kanat tasarımı', SPOILER_LABELS[d.spoilerStyle]);
  add('lip', 'Ön splitter', d.lip ? 'Açık' : 'Kapalı');
  if (d.lip) add('lipExtension', 'Splitter uzantısı', `%${d.lipExtension}`);
  if (d.lip || d.spoiler) add('partColor', 'Aero yüzeyi', d.partColor === 'carbon' ? 'Karbon siyah' : 'Gövde rengi');
  add('underglow', 'Alt aydınlatma', d.underglow ? 'Açık' : 'Kapalı');
  if (d.underglow) add('glowColor', 'LED rengi', d.glowColor.toUpperCase());
  rows.push(...powertrainSummary(d.powertrain).map((row) => ({ label: `Motor planı · ${row.label}`, value: row.value })));
  return rows;
}
