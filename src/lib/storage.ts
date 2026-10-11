import type { Design } from './design';

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
}

const KEY = 'sanal-garaj:tasarimlar:v1';
export const MAX_SAVED = 30;

export function loadSaved(): SavedDesign[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is SavedDesign =>
        !!s && typeof s.id === 'string' && typeof s.vehicleId === 'string' && typeof s.name === 'string' && typeof s.design === 'object',
    );
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
