/** Dosya yerel olarak rasterize edilir; kaynak adları ve metadata taşınmaz. */
export async function readLocalLogo(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error('Logo PNG, JPEG veya WebP olmalı; en fazla 2 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const scale = Math.min(128 / bitmap.width, 128 / bitmap.height), w = bitmap.width * scale, h = bitmap.height * scale;
    ctx.drawImage(bitmap, (128 - w) / 2, (128 - h) / 2, w, h);
    const png = canvas.toDataURL('image/png');
    if (png.length > 16000) throw new Error('Bu logo fazla karmaşık; daha sade bir görsel seçin (işlenmiş sınır 16 KB).');
    return png;
  } finally { bitmap.close(); }
}
export function sanitizeLogo(value: unknown): string {
  return typeof value === 'string' && value.length <= 16000 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value) ? value : '';
}
