/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

/**
 * İçerik Güvenliği Politikası (CSP) — yalnızca üretim derlemesine eklenir (geliştirme sunucusunun anlık
 * yenileme betikleri satır içi çalışır). GitHub Pages HTTP başlığı ayarlamaya izin vermediği için meta etiketiyle.
 *  - Betikler yalnızca sitenin kendisinden; WebAssembly (MediaPipe) için 'wasm-unsafe-eval'
 *  - Ağ istekleri yalnızca sitenin kendisine (modeller, HDRI, bölütleme modeli); harici sunucu yok
 *  - Stil: React satır içi style öznitelikleri için 'unsafe-inline' (yalnızca stil; betik değil)
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "connect-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "font-src 'self'",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  'upgrade-insecure-requests',
].join('; ');

function securityHeaders(): Plugin {
  return {
    name: 'sanal-garaj-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
    },
  };
}

/**
 * Çevrimdışı kullanım: derlenen dosyaların listesiyle dist/sw.js üretir (bkz. scripts/sw.template.js).
 * Sürüm, dosya adlarındaki içerik hash'lerinden türetilir; yeni yayın eski kabuk önbelleğini siler.
 */
function serviceWorker(): Plugin {
  return {
    name: 'sanal-garaj-sw',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map')).sort();
      const precache = ['./', ...files, 'favicon.svg', 'manifest.webmanifest', 'icons/icon-192.png'];
      const hash = createHash('sha256');
      for (const f of files) {
        const item = bundle[f];
        hash.update(f).update(item.type === 'chunk' ? item.code : typeof item.source === 'string' ? item.source : Buffer.from(item.source));
      }
      const source = readFileSync('scripts/sw.template.js', 'utf8')
        .replace('__VERSION__', hash.digest('hex').slice(0, 12))
        .replace('__PRECACHE__', JSON.stringify(precache));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

// base './' : site herhangi bir alt dizinde (ör. GitHub Pages proje sayfası) çalışır.
export default defineConfig({
  base: './',
  plugins: [react(), securityHeaders(), serviceWorker()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (/node_modules[\\/](three|three-stdlib|@react-three)[\\/]/.test(id)) return 'three';
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
