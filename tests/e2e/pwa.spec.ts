import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('manifest, ikonlar ve derlemede üretilen service worker geçerli', async ({ request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest).toMatchObject({ short_name: 'Sanal Garaj', display: 'standalone', start_url: './', lang: 'tr' });
  for (const icon of manifest.icons) expect((await request.get(`/${icon.src}`)).status()).toBe(200);
  expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true);
  const sw = await (await request.get('/sw.js')).text();
  expect(sw).not.toContain('__PRECACHE__');
  expect(sw).not.toContain('__VERSION__');
  expect(sw).toMatch(/"index\.html"/);
  expect(sw).toMatch(/"assets\/EditorPage-[\w-]+\.js"/);
});

test('açılan araç çevrimdışı tekrar açılır; katalog ve Hakkında durumu doğru gösterir', async ({ page, context }) => {
  test.setTimeout(180_000);
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await page.goto('/#/arac/toyota-ae86');
  await expect(page.locator('.viewer__overlay')).toHaveCount(0, { timeout: 60_000 });
  // Önbelleğe yazma, gövde tamamen okunduktan sonra biter
  await expect.poll(() => page.evaluate(async () => (await (await caches.open('sg-runtime-v1')).keys()).some((r) => r.url.endsWith('.glb'))), { timeout: 30_000 }).toBe(true);
  await page.goto('/#/');
  const ae86 = page.locator('.card', { hasText: 'AE86' });
  await expect(ae86).toContainText('Çevrimdışı hazır');

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.offline-banner')).toBeVisible();
  await expect(ae86).toContainText('Çevrimdışı hazır');
  await expect(page.locator('.card', { hasText: 'Çevrimdışı açılamaz' }).first()).toBeVisible();
  await ae86.locator('a').click();
  await expect(page.locator('.viewer__overlay')).toHaveCount(0, { timeout: 60_000 });
  await expect(page.locator('.viewer canvas')).toBeVisible();

  await page.goto('/#/hakkinda');
  await expect(page.locator('#uygulama')).toContainText('1/');
  await page.getByRole('button', { name: 'Çevrimdışı verileri sil' }).click();
  await expect(page.locator('#uygulama')).toContainText('Çevrimdışı model verileri silindi.');
  await expect(page.locator('#uygulama')).toContainText('0/');
  await context.setOffline(false);
});
