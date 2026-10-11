// Görüntü yardımcıları: alt yazılı PNG oluşturma, küçük önizleme, indirme.

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Görüntü okunamadı'));
    img.src = src;
  });
}

/** 3D görüntünün altına araç adı ve (CC BY gereği) model atfı ekler. */
export async function captionImage(dataUrl: string, title: string, attribution: string): Promise<Blob> {
  const img = await loadImage(dataUrl);
  const bar = Math.round(Math.max(56, img.height * 0.09));
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height + bar;
  const g = c.getContext('2d');
  if (!g) throw new Error('Tuval desteklenmiyor');
  g.fillStyle = '#101216';
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(img, 0, 0);
  const pad = Math.round(bar * 0.28);
  g.fillStyle = '#f1f3f6';
  g.font = `600 ${Math.round(bar * 0.3)}px system-ui, sans-serif`;
  g.textBaseline = 'top';
  g.fillText(title, pad, img.height + pad * 0.7);
  g.fillStyle = '#9aa3af';
  g.font = `${Math.round(bar * 0.2)}px system-ui, sans-serif`;
  g.fillText(attribution, pad, img.height + pad * 0.7 + bar * 0.38, c.width - pad * 2);
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG oluşturulamadı'))), 'image/png'));
}

export async function makeThumb(dataUrl: string, width = 320): Promise<string | null> {
  try {
    const img = await loadImage(dataUrl);
    const c = document.createElement('canvas');
    c.width = width;
    c.height = Math.round((img.height / img.width) * width);
    c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.72);
  } catch {
    return null;
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function slugify(s: string): string {
  const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
  return s
    .toLowerCase()
    .replace(/[çğıöşü]/g, (ch) => map[ch] ?? ch)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
