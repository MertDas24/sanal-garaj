import type { ModelFeatures } from '../data/models';
import { defaultPowertrain, sanitizePowertrain, encodePowertrain, decodePowertrain, type PowertrainDesign } from './powertrain';

export type Finish = 'gloss' | 'metallic' | 'pearl' | 'satin' | 'matte';
export type RimStyle = 'original' | 'spoke5' | 'multi' | 'dish' | 'mesh' | 'turbine' | 'split6';
export type WrapStyle = 'none' | 'single' | 'double' | 'hood' | 'roof';
export type RimFinish = 'satin' | 'chrome' | 'matte';
export type SpoilerStyle = 'sport' | 'gt' | 'ducktail';
export type PartColor = 'body' | 'carbon';
export type WindowTint = 'stock' | 'light' | 'medium' | 'dark';

export interface Design {
  paint: string;
  finish: Finish;
  /** Jant rengi; null = modelin orijinal jant rengi */
  rimColor: string | null;
  rimStyle: RimStyle;
  /** Sürüş yüksekliği farkı (mm) */
  heightMm: number;
  spoiler: boolean;
  lip: boolean;
  partColor: PartColor;
  /** Cam filmi */
  tint: WindowTint;
  /** Fren kaliperi rengi; null = orijinal */
  caliper: string | null;
  wrap: WrapStyle;
  wrapColor: string;
  rimFinish: RimFinish;
  rimScale: number;
  wheelWidth: number;
  offsetMm: number;
  frontCamber: number;
  rearCamber: number;
  spoilerStyle: SpoilerStyle;
  lipExtension: number;
  underglow: boolean;
  glowColor: string;
  powertrain: PowertrainDesign;
}

export const WRAP_LABELS: Record<WrapStyle, string> = { none: 'Kapalı', single: 'Tek şerit', double: 'Çift şerit', hood: 'Kaput kaplama', roof: 'Tavan kaplama' };
export const RIM_FINISH_LABELS: Record<RimFinish, string> = { satin: 'Saten', chrome: 'Krom', matte: 'Mat' };
export const SPOILER_LABELS: Record<SpoilerStyle, string> = { sport: 'Spor', gt: 'GT kanat', ducktail: 'Alçak kanat' };

export const HEIGHT_MIN_MM = -40;
export const HEIGHT_MAX_MM = 40;

export const TINT_LABELS: Record<WindowTint, string> = { stock: 'Fabrika', light: 'Açık', medium: 'Orta', dark: 'Koyu' };
const TINTS: WindowTint[] = ['stock', 'light', 'medium', 'dark'];

export const FINISH_LABELS: Record<Finish, string> = { gloss: 'Parlak', metallic: 'Metalik', pearl: 'Sedef', satin: 'Saten', matte: 'Mat' };
export const RIM_STYLE_LABELS: Record<RimStyle, string> = {
  original: 'Orijinal',
  spoke5: '5 kollu',
  multi: 'Çok kollu',
  dish: 'Çanak',
  mesh: 'Petek',
  turbine: 'Türbin',
  split6: 'Çift 6 kollu',
};

const HEX = /^#[0-9a-f]{6}$/;
const FINISHES: Finish[] = ['gloss', 'metallic', 'pearl', 'satin', 'matte'];
const RIM_STYLES = Object.keys(RIM_STYLE_LABELS) as RimStyle[];

export function normalizeHex(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  let v = value.trim().toLowerCase();
  if (!v.startsWith('#')) v = `#${v}`;
  return HEX.test(v) ? v : null;
}

/** Modelin açılış (fabrika) görünümü. paint/rim renkleri modelden okunur. */
export function defaultDesign(originalPaint: string, builtinSpoiler: boolean): Design {
  return {
    paint: originalPaint,
    finish: 'gloss',
    rimColor: null,
    rimStyle: 'original',
    heightMm: 0,
    spoiler: builtinSpoiler,
    lip: false,
    partColor: 'body',
    tint: 'stock',
    caliper: null,
    wrap: 'none', wrapColor: '#151515', rimFinish: 'satin', rimScale: 100,
    wheelWidth: 100, offsetMm: 0, frontCamber: 0, rearCamber: 0,
    spoilerStyle: 'sport', lipExtension: 100, underglow: false, glowColor: '#4cc3ff',
    powertrain: defaultPowertrain(),
  };
}

/**
 * Dışarıdan gelen (paylaşım bağlantısı, kayıtlı tasarım) ayarları doğrular:
 * geçersiz değerler varsayılana döner, sayılar sınırlanır, modelin desteklemediği seçenekler kapatılır.
 */
export function sanitizeDesign(input: Partial<Record<keyof Design, unknown>>, base: Design, f: ModelFeatures): Design {
  const d: Design = { ...base };
  d.powertrain = sanitizePowertrain(input.powertrain ?? base.powertrain);
  if (f.paint) d.paint = normalizeHex(input.paint) ?? base.paint;
  if (f.paint && FINISHES.includes(input.finish as Finish)) d.finish = input.finish as Finish;
  if (f.rimColor) d.rimColor = input.rimColor === null ? null : (normalizeHex(input.rimColor) ?? base.rimColor);
  if (f.rimStyle && RIM_STYLES.includes(input.rimStyle as RimStyle)) d.rimStyle = input.rimStyle as RimStyle;
  if (f.rideHeight && (typeof input.heightMm === 'number' || typeof input.heightMm === 'string')) {
    const h = Number(input.heightMm);
    if (Number.isFinite(h)) d.heightMm = Math.round(Math.min(HEIGHT_MAX_MM, Math.max(HEIGHT_MIN_MM, h)));
  }
  if (f.spoiler && typeof input.spoiler === 'boolean') d.spoiler = input.spoiler;
  if (f.frontLip && typeof input.lip === 'boolean') d.lip = input.lip;
  if (input.partColor === 'body' || input.partColor === 'carbon') d.partColor = input.partColor;
  if (f.windowTint && TINTS.includes(input.tint as WindowTint)) d.tint = input.tint as WindowTint;
  if (f.caliperColor) d.caliper = input.caliper === null ? null : (normalizeHex(input.caliper) ?? base.caliper);
  const number = (key: keyof Design, min: number, max: number, step = 1) => {
    const v = input[key];
    if ((typeof v === 'number' || typeof v === 'string') && String(v).trim() !== '' && Number.isFinite(Number(v))) {
      Object.assign(d, { [key]: Math.round(Math.max(min, Math.min(max, Number(v))) / step) * step });
    }
  };
  if (f.wrap) {
    if (typeof input.wrap === 'string' && Object.hasOwn(WRAP_LABELS, input.wrap) &&
      (input.wrap === 'none' || !f.wrapStyles || f.wrapStyles.includes(input.wrap))) d.wrap = input.wrap as WrapStyle;
    d.wrapColor = normalizeHex(input.wrapColor) ?? base.wrapColor;
  }
  if (f.rimColor && typeof input.rimFinish === 'string' && Object.hasOwn(RIM_FINISH_LABELS, input.rimFinish)) d.rimFinish = input.rimFinish as RimFinish;
  if (f.rimStyle) number('rimScale', 85, 115);
  if (f.stance) {
    number('wheelWidth', 90, 115); number('offsetMm', 0, 25);
    number('frontCamber', -8, 0, 0.5); number('rearCamber', -8, 0, 0.5);
  }
  if (f.spoiler === 'addon' && typeof input.spoilerStyle === 'string' && Object.hasOwn(SPOILER_LABELS, input.spoilerStyle)) d.spoilerStyle = input.spoilerStyle as SpoilerStyle;
  if (f.frontLip) number('lipExtension', 80, 150);
  if (f.underglow) {
    if (typeof input.underglow === 'boolean') d.underglow = input.underglow;
    d.glowColor = normalizeHex(input.glowColor) ?? base.glowColor;
  }
  return d;
}

// ---- Paylaşım bağlantısı: kısa, okunabilir sorgu parametreleri ----

const FINISH_CODES: Record<Finish, string> = { gloss: 'g', matte: 'm', metallic: 'x', pearl: 'p', satin: 's' };
const EXTRA_CODES = {
  wrap: 'w', wrapColor: 'wc', rimFinish: 'rf', rimScale: 'rz', wheelWidth: 'ww',
  offsetMm: 'of', frontCamber: 'cf', rearCamber: 'cr', spoilerStyle: 'ss',
  lipExtension: 'le', underglow: 'ug', glowColor: 'gc',
} as const;
function encodeExtras(q: URLSearchParams, d: Design) {
  const defaults = defaultDesign(d.paint, false);
  for (const [key, code] of Object.entries(EXTRA_CODES)) {
    const k = key as keyof typeof EXTRA_CODES;
    if (d[k] !== undefined && d[k] !== defaults[k]) q.set(code, String(d[k]));
  }
  const engine = encodePowertrain(d.powertrain);
  if (engine !== '{}') q.set('engine', engine);
}

export function encodeDesign(d: Design, base: Design): URLSearchParams {
  const q = new URLSearchParams();
  if (d.paint !== base.paint) q.set('p', d.paint.slice(1));
  if (d.finish !== base.finish) q.set('f', FINISH_CODES[d.finish]);
  if (d.rimColor) q.set('rc', d.rimColor.slice(1));
  if (d.rimStyle !== 'original') q.set('rs', d.rimStyle);
  if (d.heightMm) q.set('h', String(d.heightMm));
  if (d.spoiler !== base.spoiler) q.set('s', d.spoiler ? '1' : '0');
  if (d.lip) q.set('l', '1');
  if (d.partColor !== 'body') q.set('pc', 'c');
  if (d.tint !== 'stock') q.set('wt', d.tint);
  if (d.caliper) q.set('cc', d.caliper.slice(1));
  encodeExtras(q, d);
  return q;
}

/** Tüm ayarları açıkça yazar (kayıtlı tasarımları açarken; varsayılanlar bilinmeden). */
export function encodeDesignFull(d: Design): URLSearchParams {
  const q = new URLSearchParams({ p: d.paint.slice(1), f: FINISH_CODES[d.finish], s: d.spoiler ? '1' : '0' });
  if (d.rimColor) q.set('rc', d.rimColor.slice(1));
  if (d.rimStyle !== 'original') q.set('rs', d.rimStyle);
  if (d.heightMm) q.set('h', String(d.heightMm));
  if (d.lip) q.set('l', '1');
  if (d.partColor !== 'body') q.set('pc', 'c');
  if (d.tint !== 'stock') q.set('wt', d.tint);
  if (d.caliper) q.set('cc', d.caliper.slice(1));
  encodeExtras(q, d);
  return q;
}

export function decodeDesign(q: URLSearchParams): Partial<Record<keyof Design, unknown>> {
  const out: Partial<Record<keyof Design, unknown>> = {};
  const engine = q.get('engine');
  if (engine !== null) out.powertrain = decodePowertrain(engine);
  const p = q.get('p');
  if (p) out.paint = p;
  const f = q.get('f');
  if (f) out.finish = (Object.keys(FINISH_CODES) as Finish[]).find((k) => FINISH_CODES[k] === f);
  const rc = q.get('rc');
  if (rc) out.rimColor = rc;
  const rs = q.get('rs');
  if (rs) out.rimStyle = rs;
  const h = q.get('h');
  if (h !== null) out.heightMm = h;
  const s = q.get('s');
  if (s === '1' || s === '0') out.spoiler = s === '1';
  if (q.get('l') === '1') out.lip = true;
  if (q.get('pc') === 'c') out.partColor = 'carbon';
  const wt = q.get('wt');
  if (wt) out.tint = wt;
  const cc = q.get('cc');
  if (cc) out.caliper = cc;
  for (const [key, code] of Object.entries(EXTRA_CODES)) {
    const value = q.get(code);
    if (value !== null) out[key as keyof typeof EXTRA_CODES] = key === 'underglow' ? value === 'true' : value;
  }
  return out;
}

export const PAINT_SWATCHES: { name: string; hex: string }[] = [
  { name: 'Beyaz', hex: '#f2f2f0' },
  { name: 'Gümüş', hex: '#b8bcc2' },
  { name: 'Antrasit', hex: '#3b3f45' },
  { name: 'Siyah', hex: '#111214' },
  { name: 'Kırmızı', hex: '#b3121b' },
  { name: 'Turuncu', hex: '#e8650f' },
  { name: 'Sarı', hex: '#f2c40f' },
  { name: 'Yeşil', hex: '#1f6b3a' },
  { name: 'Mavi', hex: '#1d4fb8' },
  { name: 'Gece mavisi', hex: '#14213d' },
  { name: 'Mor', hex: '#5b2a86' },
  { name: 'Bronz', hex: '#8c6239' },
];

export const CALIPER_SWATCHES: { name: string; hex: string }[] = [
  { name: 'Kırmızı', hex: '#c4161c' },
  { name: 'Sarı', hex: '#f2c40f' },
  { name: 'Turuncu', hex: '#ef6a10' },
  { name: 'Mavi', hex: '#1f5fd1' },
  { name: 'Yeşil', hex: '#2f9e44' },
  { name: 'Siyah', hex: '#151515' },
  { name: 'Gümüş', hex: '#b9bcc2' },
];

/** Hazır paketler: modelin desteklemediği ayarlar uygulanırken otomatik atlanır (sanitizeDesign). */
export const PRESETS: { id: string; label: string; hint: string; design: Partial<Design> }[] = [
  { id: 'sokak', label: 'Sokak', hint: 'Saten siyah, koyu cam, alçak', design: { paint: '#111214', finish: 'satin', rimStyle: 'spoke5', rimColor: '#141414', heightMm: -20, tint: 'dark', caliper: '#c4161c', lip: false, partColor: 'carbon' } },
  { id: 'pist', label: 'Pist', hint: 'Sarı, aero parçalar, en alçak', design: { paint: '#f2c40f', finish: 'gloss', rimStyle: 'multi', rimColor: '#141414', heightMm: -40, spoiler: true, lip: true, partColor: 'carbon', tint: 'medium', caliper: '#1f5fd1' } },
  { id: 'klasik', label: 'Klasik', hint: 'Gece mavisi metalik, fabrika', design: { paint: '#14213d', finish: 'metallic', rimStyle: 'original', rimColor: null, heightMm: 0, lip: false, tint: 'stock', caliper: null } },
  { id: 'gece', label: 'Gece', hint: 'Mor sedef, altın jant', design: { paint: '#5b2a86', finish: 'pearl', rimColor: '#c9a227', heightMm: -30, tint: 'dark', caliper: '#c9a227' } },
  { id: 'touring', label: 'Uzun Yol', hint: 'Gümüş metalik, türbin jant, hafif alçak', design: { paint: '#b8bcc2', finish: 'metallic', rimStyle: 'turbine', rimFinish: 'chrome', heightMm: -10, tint: 'light' } },
  { id: 'show', label: 'Gösteri', hint: 'Mavi sedef, petek jant, LED ışık', design: { paint: '#1d4fb8', finish: 'pearl', rimStyle: 'mesh', rimColor: '#c9a227', frontCamber: -4, rearCamber: -5, offsetMm: 15, heightMm: -30, underglow: true, glowColor: '#9b59ff', wrap: 'roof' } },
  { id: 'clubsport', label: 'Kulüp Sporu', hint: 'Beyaz, çift şerit, GT kanat', design: { paint: '#f2f2f0', finish: 'gloss', rimStyle: 'split6', rimColor: '#141414', wrap: 'double', wrapColor: '#b3121b', spoiler: true, spoilerStyle: 'gt', lip: true, lipExtension: 130, partColor: 'carbon', frontCamber: -2, rearCamber: -1.5, heightMm: -20 } },
];

export const RIM_SWATCHES: { name: string; hex: string }[] = [
  { name: 'Gümüş', hex: '#c9ccd1' },
  { name: 'Grafit', hex: '#4a4d52' },
  { name: 'Siyah', hex: '#141414' },
  { name: 'Bronz', hex: '#9a7440' },
  { name: 'Altın', hex: '#c9a227' },
  { name: 'Beyaz', hex: '#efefef' },
];
