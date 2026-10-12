import { expect, test } from '@playwright/test';

async function openEngine(page: import('@playwright/test').Page, vehicle = 'toyota-ae86') {
  await page.goto(`/#/arac/${vehicle}`);
  await expect(page.locator('.workbench')).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Motor 3D atölyesi', exact: true }).click();
  await expect(page.locator('.engine-canvas canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Motor şeması PNG indir' })).toBeEnabled();
}
test('motor 3D gerçek çizimi değişir; V8/turbo paylaşımından aynı plan geri açılır', async ({ page }) => {
  test.setTimeout(120000); await openEngine(page);
  await expect(page.locator('.engine-canvas')).toHaveAttribute('data-cylinders', '4');
  const before = await page.locator('.engine-canvas canvas').evaluate((c) => (c as HTMLCanvasElement).toDataURL());
  await page.getByLabel('Motor 3D: Motor değişimi', { exact: true }).selectOption('v8');
  await expect(page.locator('.engine-canvas')).toHaveAttribute('data-cylinders', '8');
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
  const after = await page.locator('.engine-canvas canvas').evaluate((c) => (c as HTMLCanvasElement).toDataURL()); expect(after).not.toBe(before);
  await page.getByLabel('İncelenen motor parçası').selectOption('aspiration');
  await page.getByLabel('Motor 3D: Turbo / kompresör', { exact: true }).selectOption('twin');
  await expect(page.getByLabel('Turbo / kompresör', { exact: true })).toHaveValue('twin');
  await page.getByRole('button', { name: 'Bağlantıyı paylaş', exact: true }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText()); expect(link).toContain('motor3d=1');
  await page.goto(link); await expect(page.locator('.engine-canvas')).toHaveAttribute('data-layout', 'v8', { timeout: 30000 });
  await expect(page.getByLabel('Motor değişimi', { exact: true })).toHaveValue('v8');
  await page.getByLabel('İncelenen motor parçası').selectOption('aspiration'); await expect(page.getByLabel('Motor 3D: Turbo / kompresör', { exact: true })).toHaveValue('twin');
});
test('motor animasyonu gerçek kare üretir, durunca sabit kalır; elektrikli dönüşüm ve kapatma çalışır', async ({ page }) => {
  test.setTimeout(120000); await openEngine(page);
  const image = () => page.locator('.engine-canvas canvas').evaluate((c) => (c as HTMLCanvasElement).toDataURL());
  await page.getByRole('button', { name: 'Motor hareketini göster' }).click(); const before = await image();
  await expect.poll(image).not.toBe(before);
  await page.getByRole('button', { name: 'Animasyonu durdur' }).click();
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
  const paused = await image(); await page.waitForTimeout(250); expect(await image()).toBe(paused);
  await page.getByLabel('Motor 3D: Motor değişimi', { exact: true }).selectOption('electric');
  await page.getByLabel('İncelenen motor parçası').selectOption('electricMotor'); await page.getByLabel('Motor 3D: Elektrik motoru', { exact: true }).selectOption('triple');
  await expect(page.locator('.engine-canvas')).toHaveAttribute('data-motors', '3');
  await expect(page.getByLabel('İncelenen motor parçası').locator('option[value="pistons"]')).toHaveJSProperty('disabled', true);
  await page.getByRole('button', { name: 'Araç görünümüne dön' }).click(); await expect(page.locator('.engine-canvas')).toHaveCount(0); await expect(page.locator('.viewer canvas')).toBeVisible();
});
test('doğrulanmamış fabrika motoru uydurulmaz; motor PNG ve klavye kontrolü çalışır', async ({ page }) => {
  await openEngine(page, 'mercedes-c63-amg-w204');
  await expect(page.locator('.engine-canvas')).toHaveAttribute('data-layout', 'unknown');
  await expect(page.getByRole('button', { name: 'Motor hareketini göster' })).toBeDisabled();
  await page.getByLabel('Motor 3D: Motor değişimi', { exact: true }).selectOption('v8');
  await page.locator('.engine-canvas canvas').focus(); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Home');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Motor şeması PNG indir' }).click()]);
  expect(download.suggestedFilename()).toContain('motor-semasi.png'); expect(await download.failure()).toBeNull();
});
test('motor atölyesi mobilde taşmaz ve seçimi canlı değiştirir @mobil', async ({ page }) => {
  await openEngine(page);
  await page.getByLabel('Motor 3D: Motor değişimi', { exact: true }).selectOption('rotary');
  await expect(page.locator('.engine-canvas')).toHaveAttribute('data-layout', 'rotary');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
  await page.getByRole('button', { name: 'Araç görünümüne dön' }).click(); await expect(page.locator('.engine-canvas')).toHaveCount(0);
});
test('motor bağlam hatası araç tasarımını bozmaz; kapatıp yeniden açılabilir', async ({ page }) => {
  await openEngine(page);
  await page.locator('.engine-canvas canvas').evaluate((canvas) => {
    const gl = (canvas as HTMLCanvasElement).getContext('webgl2'); gl?.getExtension('WEBGL_lose_context')?.loseContext();
  });
  await expect(page.locator('.engine-workshop [role="alert"]')).toContainText('grafik bağlamı kaybedildi');
  await expect(page.getByLabel('Motor değişimi', { exact: true })).toHaveValue('stock');
  await page.getByRole('button', { name: 'Araç görünümüne dön' }).click();
  await page.getByRole('button', { name: 'Motor 3D atölyesi', exact: true }).click();
  await expect(page.locator('.engine-canvas canvas')).toBeVisible(); await expect(page.locator('.engine-workshop [role="alert"]')).toHaveCount(0);
});
