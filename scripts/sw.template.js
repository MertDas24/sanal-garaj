// Sanal Garaj service worker — derleme sırasında vite.config.ts tarafından dist/sw.js olarak üretilir.
// Strateji:
//  - Uygulama kabuğu (index.html + hash'li JS/CSS) kurulumda önbelleğe alınır.
//  - Hash'li dosyalar değişmez: önce önbellek.
//  - Diğer her şey (sayfa, modeller, küçük resimler, ortam ışığı, ML modeli): önce ağ; ağ yoksa önbellek.
//    Böylece çevrimiçiyken güncellemeler gecikmez, çevrimdışıyken daha önce açılan araçlar çalışır.
// Hiçbir istek başka bir sunucuya yönlendirilmez; yalnızca sitenin kendi dosyaları saklanır.
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const SHELL = `sg-shell-${VERSION}`;
const RUNTIME = 'sg-runtime-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('sg-shell-') && k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});


const scope = new URL(self.registration.scope);
const isHashed = (url) => url.pathname.startsWith(`${scope.pathname}assets/`);

async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) (await caches.open(RUNTIME)).put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName = RUNTIME) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') (await caches.open(cacheName)).put(request, response.clone());
    return response;
  } catch (error) {
    const hit = await caches.match(request, { ignoreSearch: request.mode === 'navigate' });
    if (hit) return hit;
    if (request.mode === 'navigate') {
      const shell = await caches.match(new URL('index.html', scope).href) ?? await caches.match(scope.href);
      if (shell) return shell;
    }
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  if (url.pathname.endsWith('/sw.js')) return;
  if (isHashed(url)) event.respondWith(cacheFirst(request));
  else event.respondWith(networkFirst(request, request.mode === 'navigate' ? SHELL : RUNTIME));
});
