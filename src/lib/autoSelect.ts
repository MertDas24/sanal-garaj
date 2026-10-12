// Fotoğrafta aracın boyalı gövdesini otomatik seçme (deneysel).
// 1) MediaPipe Image Segmenter + DeepLab v3 (PASCAL VOC) ile "araba" piksellerini bulur.
// 2) Bu pikseller içinde en baskın rengi (gövde boyası) bulur; cam, lastik, far gibi farklı renkli
//    bölgeleri dışarıda bırakır.
// Model ve WASM dosyaları bu sitenin kendisinden yüklenir; fotoğraf cihazdan çıkmaz.

import type { ImageSegmenter } from '@mediapipe/tasks-vision';
import { rgbToLab } from './recolor';

const CAR = 7; // PASCAL VOC: 6 otobüs, 7 araba
const BUS = 6;

let segmenterPromise: Promise<ImageSegmenter> | null = null;

function getSegmenter(): Promise<ImageSegmenter> {
  segmenterPromise ??= (async () => {
    const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
    const base = new URL(`${import.meta.env.BASE_URL}ml/`, window.location.href).href;
    const fileset = await FilesetResolver.forVisionTasks(`${base}wasm`);
    return ImageSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: `${base}deeplab_v3.tflite` },
      runningMode: 'IMAGE',
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    });
  })();
  segmenterPromise.catch(() => { segmenterPromise = null; });
  return segmenterPromise;
}

export interface AutoSelectResult {
  /** Seçilen gövde piksel sayısı */
  bodyPixels: number;
  /** Algılanan araç piksel sayısı */
  carPixels: number;
}

/** Araç maskesini çıkarır (görüntü boyutunda, 1 = araç). */
export async function detectCar(img: ImageData): Promise<Uint8Array> {
  const seg = await getSegmenter();
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d')!.putImageData(img, 0, 0);
  return new Promise<Uint8Array>((resolve, reject) => {
    try {
      seg.segment(canvas, (result) => {
        const cat = result.categoryMask;
        if (!cat) { reject(new Error('Maske üretilemedi')); return; }
        const src = cat.getAsUint8Array();
        const w = cat.width, h = cat.height;
        const out = new Uint8Array(img.width * img.height);
        // Maske görüntüden farklı boyuttaysa en yakın komşu ile ölçekle
        for (let y = 0; y < img.height; y++) {
          const sy = Math.min(h - 1, Math.floor((y / img.height) * h));
          for (let x = 0; x < img.width; x++) {
            const sx = Math.min(w - 1, Math.floor((x / img.width) * w));
            const c = src[sy * w + sx];
            out[y * img.width + x] = c === CAR || c === BUS ? 1 : 0;
          }
        }
        cat.close();
        resolve(out);
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Araç maskesi içinde gövde boyasını seçer ve `mask` dizisine (0..255) yazar.
 * tolerance: renkli boyada ton açısı farkı (derece), gri tonlarda açıklık farkı (≈ 8–50).
 */
export function selectBodyPaint(img: ImageData, car: Uint8Array, tolerance: number, mask: Uint8Array): AutoSelectResult {
  const { data } = img;
  const n = car.length;
  // Baskın rengi bul: (a, b, L) için kaba 3B histogram
  const BIN = 8;
  const hist = new Map<number, { count: number; L: number; a: number; b: number }>();
  const labs = new Float32Array(n * 3);
  let carPixels = 0;
  for (let p = 0; p < n; p++) {
    if (!car[p]) continue;
    carPixels++;
    const i = p * 4;
    const [L, a, b] = rgbToLab(data[i], data[i + 1], data[i + 2]);
    labs[p * 3] = L; labs[p * 3 + 1] = a; labs[p * 3 + 2] = b;
    if (L < 8 || L > 97) continue; // saf siyah/beyaz (gölge, yansıma) baskın rengi belirlemesin
    const key = (Math.floor(a / BIN) + 32) * 10_000 + (Math.floor(b / BIN) + 32) * 100 + Math.floor(L / 20);
    const e = hist.get(key) ?? { count: 0, L: 0, a: 0, b: 0 };
    e.count++; e.L += L; e.a += a; e.b += b;
    hist.set(key, e);
  }
  mask.fill(0);
  if (!carPixels || !hist.size) return { bodyPixels: 0, carPixels };
  let best = { count: 0, L: 0, a: 0, b: 0 };
  for (const e of hist.values()) if (e.count > best.count) best = e;
  const L0 = best.L / best.count, a0 = best.a / best.count, b0 = best.b / best.count;
  const chroma0 = Math.hypot(a0, b0);
  const hue0 = Math.atan2(b0, a0);
  const raw = new Uint8Array(n);
  if (chroma0 > 12) {
    // Renkli boya: ton açısı benzer ve yeterince doygun pikseller (gölge ve parlama farkı serbest)
    const hueTol = (tolerance * Math.PI) / 180;
    for (let p = 0; p < n; p++) {
      if (!car[p]) continue;
      const L = labs[p * 3], a = labs[p * 3 + 1], b = labs[p * 3 + 2];
      const c = Math.hypot(a, b);
      let dh = Math.abs(Math.atan2(b, a) - hue0);
      if (dh > Math.PI) dh = 2 * Math.PI - dh;
      if (L > 6 && c > chroma0 * 0.3 && dh <= hueTol) raw[p] = 1;
    }
  } else {
    // Gri / siyah / beyaz boya: düşük doygunluk ve benzer açıklık
    for (let p = 0; p < n; p++) {
      if (!car[p]) continue;
      const c = Math.hypot(labs[p * 3 + 1], labs[p * 3 + 2]);
      if (c < 14 && Math.abs(labs[p * 3] - L0) <= tolerance) raw[p] = 1;
    }
  }
  // Çoğunluk filtresi: küçük delikleri kapatır, tek tük pikselleri temizler (araç maskesi dışına taşmaz)
  const r = Math.max(2, Math.round(Math.min(img.width, img.height) / 300));
  const smooth = majority(raw, img.width, img.height, r);
  let bodyPixels = 0;
  for (let p = 0; p < n; p++) {
    if (car[p] && smooth[p]) { mask[p] = 255; bodyPixels++; }
  }
  return { bodyPixels, carPixels };
}

function majority(src: Uint8Array, w: number, h: number, r: number): Uint8Array {
  // Bütünleşik görüntü ile (2r+1)² pencere toplamı
  const I = new Uint32Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += src[y * w + x];
      I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + row;
    }
  }
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
      const sum = I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0];
      out[y * w + x] = sum * 2 > (x1 - x0) * (y1 - y0) ? 1 : 0;
    }
  }
  return out;
}
