import { expect, test, type Page } from '@playwright/test';

async function ready(page: Page) {
  await expect(page.locator('.compare-side .viewer canvas')).toHaveCount(2);
  await expect(page.locator('.compare-side .viewer__overlay')).toHaveCount(0, { timeout: 60_000 });
}
const frame = (page: Page, i: number) => page.locator('.compare-side canvas').nth(i).evaluate((c) => (c as HTMLCanvasElement).toDataURL());

test('iki farklı araç yan yana; açı, taraf değiştirme ve bağlantı çalışır', async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto('/#/karsilastir?a=toyota-ae86&b=nissan-gt-r-r35');
  await ready(page);
  await expect(page.locator('.compare-table thead')).toContainText('AE86');
  await expect(page.locator('.compare-table thead')).toContainText('GT-R');
  await expect(page.getByLabel('Araç B').locator('option[value="toyota-ae86"]')).toHaveJSProperty('disabled', true);
  const before = await frame(page, 0);
  await page.getByLabel('Kamera açısı (ikisine birden)').selectOption('side');
  await expect.poll(() => frame(page, 0)).not.toBe(before);
  await page.getByRole('button', { name: 'Tarafları değiştir' }).click();
  await expect(page).toHaveURL(/a=nissan-gt-r-r35&b=toyota-ae86/);
  await ready(page);
  await page.getByLabel('Araç B').selectOption('bmw-m3-e30');
  await expect(page).toHaveURL(/b=bmw-m3-e30/);
  await ready(page);
  await expect(page.locator('.compare-table tbody')).toContainText('4,35 m');
});

test('geçersiz araç kimliği katalogdaki araca döner; kayıtlı tasarım seçilebilir', async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto('/#/arac/bmw-m3-e30?p=1f5fbf');
  await expect(page.locator('.viewer__overlay')).toHaveCount(0, { timeout: 60_000 });
  await page.getByRole('button', { name: 'Kaydet' }).click();
  await page.locator('.stage-actions').getByRole('link', { name: 'Karşılaştır', exact: true }).click();
  await expect(page).toHaveURL(/karsilastir\?a=bmw-m3-e30&b=/);
  await page.goto('/#/karsilastir?a=bmw-m3-e30&b=yok-boyle-arac');
  await ready(page);
  await expect(page.getByLabel('Araç B')).not.toHaveValue('yok-boyle-arac');
  const design = page.getByLabel('Tasarım A');
  await expect(design).toBeEnabled();
  const before = await frame(page, 0);
  await design.selectOption({ index: 1 });
  await expect.poll(() => frame(page, 0)).not.toBe(before);
});

test('karşılaştırma mobilde taşmaz @mobil', async ({ page }) => {
  await page.goto('/#/karsilastir');
  await ready(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
});
