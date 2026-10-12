import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import sharp from 'sharp';
async function ready(page: import('@playwright/test').Page) {
  await page.goto('/#/arac/toyota-ae86');
  await expect(page.locator('.workbench')).toBeVisible({ timeout: 30000 });
}
test('içeriğe geç bağlantısı hash rotasını bozmadan odağı taşır', async ({ page }) => {
  await page.goto('/'); const url = page.url();
  await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'İçeriğe geç', exact: true })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.getByRole('main')).toBeFocused(); await expect(page).toHaveURL(url);
  await expect(page.getByRole('heading', { name: 'Aracını seç', exact: false })).toBeVisible();
});
test('kit, metin, logo ve şerit ayarları paylaşım/kayıtta korunur', async ({ page }) => {
  test.setTimeout(180000);
  await ready(page);
  await page.getByRole('switch', { name: 'Yan etek', exact: true }).check();
  await page.getByRole('switch', { name: 'Arka difüzör', exact: true }).check();
  await page.getByRole('radio', { name: 'Çift şerit', exact: true }).click();
  await page.getByLabel('Şerit / kaplama genişliği').fill('70');
  await page.getByLabel('Kaplama yatay konumu').fill('12');
  await page.getByLabel('Gövde yazısı', { exact: true }).fill('Türkçe Garaj');
  await page.getByLabel('Yazı bölgesi', { exact: true }).selectOption('right');
  const png = await sharp({ create: { width: 32, height: 32, channels: 4, background: '#ff0000' } }).png().toBuffer();
  await page.getByLabel('Yerel logo yükle (PNG/JPEG/WebP)').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png });
  // İlk saydam yazı/logo materyalinin shader'ı yazılımsal GPU'da ana iş parçacığını uzun süre meşgul edebilir.
  await expect(page.getByText('Logo cihazınızda işlendi.')).toBeVisible({ timeout: 60000 });
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await page.reload(); await expect(page.locator('.workbench')).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Yan etek', exact: true })).toBeChecked();
  await expect(page.getByLabel('Gövde yazısı', { exact: true })).toHaveValue('Türkçe Garaj');
  await expect(page.getByRole('button', { name: 'Logoyu kaldır' })).toBeEnabled();
  await page.getByLabel('Sol görünüm (A)').selectOption({ index: 1 });
  await expect(page.locator('.compare')).toBeVisible();
  await page.getByRole('radio', { name: 'Mavi', exact: true }).first().click();
  await expect(page.getByText(/tasarım farkı/)).toBeVisible();
});
test('stüdyo gerçek boyutlu PNG ve dört açı panosu üretir, video oynar', async ({ page }) => {
  test.setTimeout(120000); await ready(page);
  await page.getByLabel('Çıktı genişliği').selectOption('1280');
  await page.getByLabel('Görüntü oranı').selectOption('square');
  for (const name of ['Stüdyo PNG indir', 'Dört açı panosu indir']) {
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name, exact: true }).click()]);
    const buffer = fs.readFileSync((await download.path())!); const metadata = await sharp(buffer).metadata();
    expect(metadata.width).toBe(1280); expect(metadata.height).toBeGreaterThan(1280);
    const stats = await sharp(buffer).stats(); expect(stats.channels[0].stdev).toBeGreaterThan(5);
  }
  const [video] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '6 saniyelik tur videosu' }).click()]);
  const buffer = fs.readFileSync((await video.path())!); expect(buffer.length).toBeGreaterThan(10000);
  const dimensions = await page.evaluate(async (base64) => {
    const blob = await (await fetch(`data:video/webm;base64,${base64}`)).blob(), url = URL.createObjectURL(blob), video = document.createElement('video');
    video.src = url; await new Promise<void>((resolve, reject) => { video.onloadeddata = () => resolve(); video.onerror = () => reject(new Error('Video okunamadı')); });
    const size = [video.videoWidth, video.videoHeight]; URL.revokeObjectURL(url); return size;
  }, buffer.toString('base64'));
  expect(dimensions).toEqual([960, 600]);
});
test('grafik bağlamı kaybı hata ve tekrar deneme sunar', async ({ page }) => {
  await ready(page);
  await page.getByLabel('Gövde yazısı', { exact: true }).fill('KORUNDU');
  await page.locator('.viewer canvas').evaluate((canvas) => {
    const extension = (canvas as HTMLCanvasElement).getContext('webgl2')?.getExtension('WEBGL_lose_context');
    if (!extension) throw new Error('Test tarayıcısı bağlam kaybı uzantısını desteklemiyor.'); extension.loseContext();
  });
  await expect(page.getByText(/Grafik bağlamı kaybedildi/)).toBeVisible();
  await page.getByRole('button', { name: 'Tekrar dene', exact: true }).click();
  await expect(page.locator('.workbench')).toBeVisible(); await expect(page.locator('.viewer__overlay')).toHaveCount(0);
  await expect(page.getByLabel('Gövde yazısı', { exact: true })).toHaveValue('KORUNDU');
});
test('ortam dosyası 404 sonrası önbellek temizlenerek yeniden yüklenir', async ({ page }) => {
  let attempts = 0;
  await page.route('**/env/autoshop_01_1k.hdr', async (route) => { attempts++; if (attempts === 1) await route.fulfill({ status: 404, body: 'Not found' }); else await route.continue(); });
  await page.goto('/#/arac/toyota-ae86'); await expect(page.getByRole('alert')).toContainText('Ortam ışığı dosyası yüklenemedi');
  await page.getByRole('button', { name: 'Tekrar dene', exact: true }).click(); await expect(page.locator('.workbench')).toBeVisible(); await expect(page.locator('.viewer__overlay')).toHaveCount(0); expect(attempts).toBe(2);
});
test('radyo grupları tek Tab durağı ve ok tuşlarıyla çalışır', async ({ page }) => {
  await ready(page);
  for (const label of ['Gövde rengi', 'Kaplama tasarımı', 'Fotogerçekçi kalite']) {
    const group = page.getByRole('radiogroup', { name: label, exact: true });
    await expect(group.locator('[tabindex="0"]')).toHaveCount(1);
    const current = group.locator('[tabindex="0"]'); await current.focus(); await current.press('ArrowRight');
    await expect(group.locator('[aria-checked="true"]')).toHaveCount(1);
    await expect(group.locator('[tabindex="0"]')).toBeFocused();
  }
});
test('performans raporu seçilen modeli ve ölçüm sınırlarını taşır', async ({ page }) => {
  await ready(page); await page.getByText('Performans ölçümü ve rapor', { exact: true }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Ölçüm JSON indir', exact: true }).click()]);
  const report = JSON.parse(fs.readFileSync((await download.path())!, 'utf8'));
  expect(report.vehicleId).toBe('toyota-ae86'); expect(report.resources).toHaveLength(1); expect(report.resources[0].file).toBe('toyota-ae86-trueno-zenki.glb');
  expect(report.renderer.geometries).toBeGreaterThan(0); expect(report.heapUsedBytes === null || report.heapUsedBytes > 0).toBe(true);
  expect(report.note).toContain('toplam RAM/GPU belleği değildir');
});
test('yazı/logo için yüzeyi olmayan bölgeler kapalıdır ve URL seçimi uygulanmaz', async ({ page }) => {
  await page.goto('/#/arac/porsche-911-turbo-930?text=GARAJ&region=left'); await expect(page.locator('.workbench')).toBeVisible({ timeout: 30000 });
  const region = page.getByLabel('Yazı bölgesi', { exact: true });
  await expect(region.locator('option[value="left"]')).toHaveJSProperty('disabled', true); await expect(region.locator('option[value="roof"]')).toHaveJSProperty('disabled', true);
  await expect(region).toHaveValue('hood'); await expect(page.getByLabel('Gövde yazısı', { exact: true })).toHaveValue('');
  await expect(page.getByRole('switch', { name: 'Yan etek', exact: true })).toBeDisabled();
});
test('yeni atölye kontrolleri mobilde etiketli ve taşmasız @mobil', async ({ page }) => {
  await ready(page); await page.getByLabel('Gövde yazısı', { exact: true }).fill('MOBİL');
  await page.getByLabel('Etkileşimli görüntü', { exact: true }).selectOption('low');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await expect(page.getByRole('switch', { name: 'Yan etek', exact: true })).toBeEnabled();
});
test('stüdyo çıktısı mobil ekran piksel yoğunluğundan etkilenmez @mobil', async ({ browser }, info) => {
  test.setTimeout(120000); const pixels: Buffer[] = [];
  for (const dpr of [1, 3]) {
    const context = await browser.newContext({ viewport: { width: 600, height: 800 }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage(); await page.goto(new URL('#/arac/toyota-ae86', info.project.use.baseURL).href); await expect(page.locator('.workbench')).toBeVisible({ timeout: 30000 });
      await page.getByRole('button', { name: 'Kamerayı sıfırla', exact: true }).click();
      await page.getByLabel('Çıktı genişliği').selectOption('1280');
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Stüdyo PNG indir', exact: true }).click()]);
      const png = fs.readFileSync((await download.path())!); await info.attach(`mobil-dpr-${dpr}`, { body: png, contentType: 'image/png' });
      pixels.push(await sharp(png).extract({ left: 0, top: 0, width: 1280, height: 720 }).resize(64, 36).removeAlpha().raw().toBuffer());
    } finally { await context.close(); }
  }
  const difference = pixels[0].reduce((total, value, i) => total + Math.abs(value - pixels[1][i]), 0) / pixels[0].length;
  expect(difference).toBeLessThan(4);
});
