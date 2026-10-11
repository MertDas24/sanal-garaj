// Fotoğraf üzerinde yerel renk değiştirme yardımcıları. Tüm işlem tarayıcıda yapılır.

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hue2rgb(p: number, q: number, t: number) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
}

/** sRGB -> CIE Lab (D65) */
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const R = lin(r), G = lin(g), B = lin(b);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/**
 * Sihirli değnek: tıklanan noktadan başlayıp renk olarak benzer, bitişik pikselleri seçer.
 * Boya yüzeyindeki gölgeler seçimi bölmesin diye açıklık (L) farkı daha az ağırlıklıdır.
 */
export function floodSelect(img: ImageData, sx: number, sy: number, tolerance: number, mask: Uint8Array): number {
  const { width: w, height: h, data } = img;
  const i0 = (sy * w + sx) * 4;
  const [L0, a0, b0] = rgbToLab(data[i0], data[i0 + 1], data[i0 + 2]);
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let sp = 0, count = 0;
  stack[sp++] = sy * w + sx;
  seen[sy * w + sx] = 1;
  const tol2 = tolerance * tolerance;
  while (sp > 0) {
    const p = stack[--sp];
    const i = p * 4;
    const [L, a, b] = rgbToLab(data[i], data[i + 1], data[i + 2]);
    const d2 = (a - a0) ** 2 + (b - b0) ** 2 + 0.25 * (L - L0) ** 2;
    if (d2 > tol2) continue;
    mask[p] = 255;
    count++;
    const x = p % w, y = (p - x) / w;
    if (x > 0 && !seen[p - 1]) { seen[p - 1] = 1; stack[sp++] = p - 1; }
    if (x < w - 1 && !seen[p + 1]) { seen[p + 1] = 1; stack[sp++] = p + 1; }
    if (y > 0 && !seen[p - w]) { seen[p - w] = 1; stack[sp++] = p - w; }
    if (y < h - 1 && !seen[p + w]) { seen[p + w] = 1; stack[sp++] = p + w; }
  }
  return count;
}

/** Yumuşak kenarlı fırça; erase=true ise seçimden çıkarır. */
export function paintMask(mask: Uint8Array, w: number, h: number, cx: number, cy: number, radius: number, erase: boolean) {
  const r2 = radius * radius;
  const x0 = Math.max(0, Math.floor(cx - radius)), x1 = Math.min(w - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius)), y1 = Math.min(h - 1, Math.ceil(cy + radius));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d2 = (x - cx) ** 2 + (y - cy) ** 2;
      if (d2 > r2) continue;
      const soft = Math.min(1, (1 - Math.sqrt(d2) / radius) * 3);
      const v = Math.round(soft * 255);
      const p = y * w + x;
      mask[p] = erase ? Math.min(mask[p], 255 - v) : Math.max(mask[p], v);
    }
  }
}

/**
 * Seçili pikselleri hedef renge çevirir. Ton ve doygunluk hedeften alınır, açıklık farkları
 * (gölge, yansıma) korunur; çok parlak yansımalar beyazımsı kalır.
 */
export function recolor(src: ImageData, mask: Uint8Array, hex: string, strength: number, out: ImageData) {
  const s = src.data, o = out.data;
  o.set(s);
  const [tr, tg, tb] = hexToRgb(hex);
  const [th, ts, tl] = rgbToHsl(tr, tg, tb);
  let sum = 0, n = 0;
  for (let p = 0; p < mask.length; p++) {
    if (mask[p] > 127) { const i = p * 4; sum += rgbToHsl(s[i], s[i + 1], s[i + 2])[2]; n++; }
  }
  if (!n) return;
  const meanL = sum / n;
  for (let p = 0; p < mask.length; p++) {
    const m = mask[p];
    if (!m) continue;
    const i = p * 4;
    const l = rgbToHsl(s[i], s[i + 1], s[i + 2])[2];
    const nl = Math.min(1, Math.max(0, l + (tl - meanL)));
    const highlight = Math.min(1, Math.max(0, (l - 0.82) / 0.15));
    const [r, g, b] = hslToRgb(th, ts * (1 - highlight), nl * (1 - highlight) + l * highlight);
    const a = (m / 255) * strength;
    o[i] = s[i] + (r - s[i]) * a;
    o[i + 1] = s[i + 1] + (g - s[i + 1]) * a;
    o[i + 2] = s[i + 2] + (b - s[i + 2]) * a;
  }
}
