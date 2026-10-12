import type { ModelFeatures } from '../data/models';

export type Finish = 'gloss' | 'metallic' | 'pearl' | 'satin' | 'matte';
export type RimStyle = 'original' | 'spoke5' | 'multi' | 'dish';
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
}

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
};

const HEX = /^#[0-9a-f]{6}$/;
const FINISHES: Finish[] = ['gloss', 'metallic', 'pearl', 'satin', 'matte'];
const RIM_STYLES: RimStyle[] = ['original', 'spoke5', 'multi', 'dish'];

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
  };
}

/**
 * Dışarıdan gelen (paylaşım bağlantısı, kayıtlı tasarım) ayarları doğrular:
 * geçersiz değerler varsayılana döner, sayılar sınırlanır, modelin desteklemediği seçenekler kapatılır.
 */
export function sanitizeDesign(input: Partial<Record<keyof Design, unknown>>, base: Design, f: ModelFeatures): Design {
  const d: Design = { ...base };
  if (f.paint) d.paint = normalizeHex(input.paint) ?? base.paint;
  if (f.paint && FINISHES.includes(input.finish as Finish)) d.finish = input.finish as Finish;
  if (f.rimColor) d.rimColor = input.rimColor === null ? null : (normalizeHex(input.rimColor) ?? base.rimColor);
  if (f.rimStyle && RIM_STYLES.includes(input.rimStyle as RimStyle)) d.rimStyle = input.rimStyle as RimStyle;
  if (f.rideHeight) {
    const h = Number(input.heightMm);
    if (Number.isFinite(h)) d.heightMm = Math.round(Math.min(HEIGHT_MAX_MM, Math.max(HEIGHT_MIN_MM, h)));
  }
  if (f.spoiler && typeof input.spoiler === 'boolean') d.spoiler = input.spoiler;
  if (f.frontLip && typeof input.lip === 'boolean') d.lip = input.lip;
  if (input.partColor === 'body' || input.partColor === 'carbon') d.partColor = input.partColor;
  if (f.windowTint && TINTS.includes(input.tint as WindowTint)) d.tint = input.tint as WindowTint;
  if (f.caliperColor) d.caliper = input.caliper === null ? null : (normalizeHex(input.caliper) ?? base.caliper);
  return d;
}

// ---- Paylaşım bağlantısı: kısa, okunabilir sorgu parametreleri ----

const FINISH_CODES: Record<Finish, string> = { gloss: 'g', matte: 'm', metallic: 'x', pearl: 'p', satin: 's' };

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
  return q;
}

export function decodeDesign(q: URLSearchParams): Partial<Record<keyof Design, unknown>> {
  const out: Partial<Record<keyof Design, unknown>> = {};
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
];

export const RIM_SWATCHES: { name: string; hex: string }[] = [
  { name: 'Gümüş', hex: '#c9ccd1' },
  { name: 'Grafit', hex: '#4a4d52' },
  { name: 'Siyah', hex: '#141414' },
  { name: 'Bronz', hex: '#9a7440' },
  { name: 'Altın', hex: '#c9a227' },
  { name: 'Beyaz', hex: '#efefef' },
];
