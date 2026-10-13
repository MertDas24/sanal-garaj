import { useEffect, useState } from 'react';

// Hash tabanlı basit yönlendirme: statik barındırmada (GitHub Pages) sunucu ayarı gerektirmez.
//   #/                 katalog
//   #/arac/<id>?...    düzenleyici (sorgu = tasarım ayarları)
//   #/karsilastir?a=&b= iki aracı yan yana karşılaştırma
//   #/tasarimlarim     kayıtlı tasarımlar
//   #/foto             fotoğraf üzerinde dene
//   #/kendi-modelin    yerel GLB görüntüleyici
//   #/kaynaklar        model kaynakları ve lisanslar
//   #/hakkinda         proje tanıtımı

export type Route =
  | { name: 'catalog' }
  | { name: 'editor'; vehicleId: string; query: URLSearchParams }
  | { name: 'compare'; query: URLSearchParams }
  | { name: 'saved' }
  | { name: 'photo' }
  | { name: 'custom' }
  | { name: 'credits' }
  | { name: 'about' }
  | { name: 'notfound' };

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  let parts: string[];
  try { parts = path.split('/').filter(Boolean).map(decodeURIComponent); } catch { return { name: 'notfound' }; }
  if (parts.length === 0) return { name: 'catalog' };
  if (parts[0] === 'arac' && parts[1]) return { name: 'editor', vehicleId: parts[1], query: new URLSearchParams(qs) };
  if (parts[0] === 'karsilastir') return { name: 'compare', query: new URLSearchParams(qs) };
  if (parts[0] === 'tasarimlarim') return { name: 'saved' };
  if (parts[0] === 'foto') return { name: 'photo' };
  if (parts[0] === 'kendi-modelin') return { name: 'custom' };
  if (parts[0] === 'kaynaklar') return { name: 'credits' };
  if (parts[0] === 'hakkinda') return { name: 'about' };
  return { name: 'notfound' };
}

export function editorHash(vehicleId: string, query?: URLSearchParams): string {
  const qs = query?.toString();
  return `#/arac/${encodeURIComponent(vehicleId)}${qs ? `?${qs}` : ''}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

/** Adres çubuğunu geçmişe kayıt eklemeden günceller (hashchange tetiklemez). */
export function replaceHash(hash: string): void {
  const url = `${window.location.pathname}${window.location.search}${hash}`;
  window.history.replaceState(window.history.state, '', url);
}

export function absoluteUrl(hash: string): string {
  return `${window.location.origin}${window.location.pathname}${hash}`;
}
