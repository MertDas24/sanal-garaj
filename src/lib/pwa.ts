import { useEffect, useState } from 'react';

// Çevrimdışı kullanım ve uygulama olarak yükleme (PWA). Service worker yalnızca üretim derlemesinde kaydedilir
// (dist/sw.js derleme sırasında üretilir; bkz. vite.config.ts ve scripts/sw.template.js).

export const RUNTIME_CACHE = 'sg-runtime-v1';

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => { /* çevrimdışı destek isteğe bağlıdır */ });
  });
}

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => { deferred = null; listeners.forEach((l) => l()); });
}

export function isStandalone(): boolean {
  return matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Tarayıcının yükleme isteği hazırsa çağrılabilir bir fonksiyon döner. */
export function useInstallPrompt(): (() => Promise<boolean>) | null {
  const [, force] = useState(0);
  useEffect(() => { const l = () => force((n) => n + 1); listeners.add(l); return () => { listeners.delete(l); }; }, []);
  if (!deferred) return null;
  return async () => {
    const event = deferred; if (!event) return false;
    deferred = null; listeners.forEach((l) => l());
    await event.prompt();
    return (await event.userChoice).outcome === 'accepted';
  };
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

/** Çevrimdışı önbellekte bulunan dosyaların yol adları (ör. /sanal-garaj/models/x.glb). */
export async function cachedPaths(): Promise<Set<string>> {
  if (!('caches' in window)) return new Set();
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    return new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
  } catch { return new Set(); }
}

export async function storageUsage(): Promise<{ usage: number; quota: number } | null> {
  try {
    const e = await navigator.storage?.estimate();
    return e ? { usage: e.usage ?? 0, quota: e.quota ?? 0 } : null;
  } catch { return null; }
}

export async function clearOfflineData(): Promise<void> {
  if ('caches' in window) await caches.delete(RUNTIME_CACHE);
}
