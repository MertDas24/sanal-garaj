import { defaultDesign, sanitizeDesign, type Design } from './design';
import { findEnv, type EnvId } from '../three/scenes';

// Tasarımlar yalnızca bu cihazdaki tarayıcı depolamasında tutulur (hesap/sunucu yok).
// Depolama kapalı veya dolu olabilir; tüm erişimler hata yakalar.

export interface SavedDesign {
  id: string;
  vehicleId: string;
  name: string;
  createdAt: number;
  design: Design;
  /** Küçük JPEG önizleme (data URL) */
  thumb: string | null;
  environment?: EnvId;
}

const KEY = 'sanal-garaj:tasarimlar:v1';
export const MAX_SAVED = 30;

export function loadSaved(): SavedDesign[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // Depolama dışarıdan değiştirilebilir: her kaydı sıkı doğrula, şüpheli alanları at
    return parsed.filter(
      (s): s is SavedDesign =>
        !!s && typeof s === 'object' &&
        typeof s.id === 'string' && s.id.length <= 40 &&
        typeof s.vehicleId === 'string' && /^[a-z0-9-]{1,64}$/.test(s.vehicleId) &&
        typeof s.name === 'string' && s.name.length <= 120 &&
        typeof s.createdAt === 'number' &&
        !!s.design && typeof s.design === 'object' && typeof s.design.paint === 'string' && /^#[0-9a-f]{6}$/i.test(s.design.paint),
    ).map((s) => ({
      ...s,
      environment: findEnv(s.environment).id,
      // Bağlantı üretilmeden önce eksik/eski alanları tamamla ve bozuk değerleri temizle.
      // Modelin gerçek desteği düzenleyicide ayrıca kontrol edilir.
      design: sanitizeDesign(s.design, defaultDesign(s.design.paint.toLowerCase(), false), {
        paint: true, rimColor: true, rimStyle: true, rideHeight: true,
        spoiler: 'addon', frontLip: 'addon', windowTint: true, caliperColor: true,
        stance: true, wrap: true, underglow: true,
      }),
      // Önizleme yalnızca kendi ürettiğimiz JPEG veri adresi olabilir
      thumb: typeof s.thumb === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(s.thumb) ? s.thumb : null,
    }));
  } catch {
    return [];
  }
}

function write(list: SavedDesign[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export type SaveResult = { ok: true; item: SavedDesign } | { ok: false; reason: 'full' | 'storage' };

export function saveDesign(entry: Omit<SavedDesign, 'id' | 'createdAt'>): SaveResult {
  const list = loadSaved();
  if (list.length >= MAX_SAVED) return { ok: false, reason: 'full' };
  const item: SavedDesign = { ...entry, id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now() };
  if (write([item, ...list])) return { ok: true, item };
  // Önizleme görseli kotayı aşmış olabilir: görselsiz bir kez daha dene
  const lite = { ...item, thumb: null };
  return write([lite, ...list]) ? { ok: true, item: lite } : { ok: false, reason: 'storage' };
}

export function deleteSaved(id: string): void {
  write(loadSaved().filter((s) => s.id !== id));
}

export function renameSaved(id: string, name: string): void {
  write(loadSaved().map((s) => (s.id === id ? { ...s, name } : s)));
}
