import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';

async function openCar(page: Page, hash = '#/arac/toyota-ae86?p=b3121b') {
  await page.goto(`/${hash}`);
  await expect(page.locator('.viewer__overlay')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.locator('#mod-ar')).toBeVisible();
}

function glbJson(buffer: Buffer) {
  expect(buffer.subarray(0, 4).toString()).toBe('glTF');
  const length = buffer.readUInt32LE(12);
  return JSON.parse(buffer.subarray(20, 20 + length).toString('utf8'));
}

test('masaüstünde AR gerekçesiyle kapalı; GLB mevcut tasarımı ve atfı taşır', async ({ page }) => {
  test.setTimeout(120_000);
  await openCar(page);
  await expect(page.locator('#mod-ar').getByRole('button', { name: "AR'da gör" })).toBeDisabled();
  await expect(page.locator('#ar-reason')).toContainText('AR desteklemiyor');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '3D dosyası indir (GLB)' }).click()]);
  expect(download.suggestedFilename()).toMatch(/ae86-sanal-garaj.glb$/);
  const json = glbJson(fs.readFileSync((await download.path())!));
  expect(json.meshes.length).toBeGreaterThan(3);
  const paint = json.materials.find((m: { name: string }) => m.name === 'CG_paint');
  const [r, g, b] = paint.pbrMetallicRoughness.baseColorFactor;
  expect(r).toBeGreaterThan(0.3); expect(g).toBeLessThan(0.05); expect(b).toBeLessThan(0.05);
  expect(JSON.stringify(json.nodes)).toContain('CC BY');
  expect(json.images.length).toBeGreaterThan(10);
  expect(json.images.every((i: { mimeType: string }) => ['image/jpeg', 'image/png'].includes(i.mimeType))).toBe(true);
  await expect(page.locator('#mod-ar .ar-status')).toContainText('GLB dosyası indirildi');
});

test('USDZ dosyası geçerli bir paket olarak indirilir', async ({ page }) => {
  test.setTimeout(120_000);
  await openCar(page);
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'iPhone için USDZ indir' }).click()]);
  const buffer = fs.readFileSync((await download.path())!);
  expect(buffer.subarray(0, 2).toString()).toBe('PK');
  expect(buffer.includes(Buffer.from('.usda'))).toBe(true);
  expect(buffer.length).toBeGreaterThan(100_000);
});

test('iPhone Quick Look: hazırlanan bağlantı rel=ar ve görsel ilk çocuk taşır', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    const original = DOMTokenList.prototype.supports;
    DOMTokenList.prototype.supports = function (token: string) { return token === 'ar' || original.call(this, token); };
  });
  await openCar(page);
  await page.getByRole('button', { name: 'AR için hazırla' }).click();
  const link = page.getByRole('link', { name: "AR'da aç" });
  await expect(link).toBeVisible({ timeout: 60_000 });
  await expect(link).toHaveAttribute('rel', 'ar');
  expect(await link.getAttribute('href')).toMatch(/^blob:.*#allowsContentScaling=0$/);
  expect(await link.evaluate((a) => a.firstElementChild?.tagName)).toBe('IMG');
  // Tasarım değişince eski dosya geçersiz olur
  await page.getByRole('radiogroup', { name: 'Gövde rengi' }).getByRole('radio').first().click();
  await expect(page.getByRole('button', { name: 'AR için hazırla' })).toBeVisible();
});

test('WebXR destekli cihazda AR düğmesi açılır; reddedilen oturum açık hata verir', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'xr', { configurable: true, value: {
      isSessionSupported: async (mode: string) => mode === 'immersive-ar',
      requestSession: async () => { throw new DOMException('Kamera izni reddedildi', 'NotAllowedError'); },
    } });
  });
  await openCar(page);
  const button = page.locator('#mod-ar').getByRole('button', { name: "AR'da gör" });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.locator('#mod-ar')).toContainText('AR başlatılamadı: Kamera izni reddedildi');
  await expect(page.locator('.ar-overlay')).toBeHidden();
  await expect(button).toBeEnabled();
});
