// Ortam ışıkları (HDRI, hepsi Poly Haven / CC0) ve fotogerçekçi mod kamera açıları.

export type EnvId = 'garage' | 'studio' | 'neon' | 'sunset' | 'overcast' | 'night';

export interface EnvPreset {
  id: EnvId;
  label: string;
  file: string;
  title: string;
  author: string;
  url: string;
  /** studio: zeminden duvara kıvrılan fon; outdoor: geniş zemin + bulanık gökyüzü arka planı */
  backdrop: 'studio' | 'outdoor';
  /** Fotogerçekçi modda ortam ışığı çarpanı */
  intensity: number;
  /** Fotogerçekçi modda tepe ışığı (softbox) gücü; 0 = yok */
  softbox: number;
  /** Fon / zemin rengi */
  floor: string;
}

const PH = (id: string) => `https://polyhaven.com/a/${id}`;

export const ENVIRONMENTS: EnvPreset[] = [
  { id: 'garage', label: 'Garaj', file: 'autoshop_01_1k.hdr', title: 'Autoshop 01', author: 'Oliksiy Yakovlyev', url: PH('autoshop_01'), backdrop: 'studio', intensity: 1.3, softbox: 5, floor: '#2b2e33' },
  { id: 'studio', label: 'Stüdyo', file: 'studio_small_09_1k.hdr', title: 'Studio Small 09', author: 'Sergej Majboroda', url: PH('studio_small_09'), backdrop: 'studio', intensity: 1.1, softbox: 6, floor: '#3a3c40' },
  { id: 'neon', label: 'Neon stüdyo', file: 'neon_photostudio_1k.hdr', title: 'Neon Photostudio', author: 'Sergej Majboroda', url: PH('neon_photostudio'), backdrop: 'studio', intensity: 1.2, softbox: 2, floor: '#1d1e24' },
  { id: 'sunset', label: 'Gün batımı', file: 'venice_sunset_1k.hdr', title: 'Venice Sunset', author: 'Greg Zaal', url: PH('venice_sunset'), backdrop: 'outdoor', intensity: 1, softbox: 0, floor: '#3b3530' },
  { id: 'overcast', label: 'Bulutlu şehir', file: 'potsdamer_platz_1k.hdr', title: 'Potsdamer Platz', author: 'Greg Zaal', url: PH('potsdamer_platz'), backdrop: 'outdoor', intensity: 1, softbox: 0, floor: '#46484c' },
  { id: 'night', label: 'Şehir gecesi', file: 'shanghai_bund_1k.hdr', title: 'Shanghai Bund', author: 'Greg Zaal', url: PH('shanghai_bund'), backdrop: 'outdoor', intensity: 1.6, softbox: 1.5, floor: '#1a1b1f' },
];

export function envUrl(e: EnvPreset): string {
  return `${import.meta.env.BASE_URL}env/${e.file}`;
}

export function findEnv(id: string | null | undefined): EnvPreset {
  return ENVIRONMENTS.find((e) => e.id === id) ?? ENVIRONMENTS[0];
}

export type ShotId = 'free' | 'front34' | 'side' | 'rear34' | 'low' | 'top';

/** Kamera açıları: aracın önü +Z. azimut (derece, +Z'den saat yönünün tersine), yükseklik açısı, uzaklık çarpanı */
export const SHOTS: { id: ShotId; label: string; az: number; el: number; dist: number; fov: number }[] = [
  { id: 'free', label: 'Serbest (mevcut açı)', az: 0, el: 0, dist: 0, fov: 0 },
  { id: 'front34', label: 'Ön ¾', az: 38, el: 12, dist: 1.35, fov: 32 },
  { id: 'side', label: 'Yan', az: 90, el: 4, dist: 1.45, fov: 28 },
  { id: 'rear34', label: 'Arka ¾', az: 145, el: 14, dist: 1.35, fov: 32 },
  { id: 'low', label: 'Alçak açı', az: 30, el: 2, dist: 1.05, fov: 40 },
  { id: 'top', label: 'Kuş bakışı', az: 40, el: 48, dist: 1.6, fov: 30 },
];

export type PtQuality = 'fast' | 'normal' | 'high';

export const PT_QUALITY: Record<PtQuality, { label: string; samples: number }> = {
  fast: { label: 'Hızlı', samples: 96 },
  normal: { label: 'Normal', samples: 300 },
  high: { label: 'Yüksek', samples: 900 },
};
