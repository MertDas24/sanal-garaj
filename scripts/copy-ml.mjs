// MediaPipe WASM dosyalarını public/ml/wasm altına kopyalar (sitenin kendisinden sunulur; harici CDN yok).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const dst = path.join(root, 'public', 'ml', 'wasm');
fs.mkdirSync(dst, { recursive: true });
for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm', 'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm']) {
  fs.copyFileSync(path.join(src, f), path.join(dst, f));
}
console.log('MediaPipe WASM kopyalandı →', path.relative(root, dst));
