import { expect, test } from '@playwright/test';
import { collectTexts, crawl } from './i18n-crawl';

const english = () => localStorage.setItem('sanal-garaj:dil', 'en');

test('İngilizce arayüzde tüm sayfa ve durumlarda çevrilmemiş metin kalmaz', async ({ page }) => {
  test.setTimeout(300_000);
  await page.addInitScript(english);
  const missing = new Map<string, string>(), turkish = new Map<string, string>();
  await crawl(page, async (step) => {
    const left = await page.evaluate(() => (window as unknown as { __sanalGarajI18n: { missing(): string[] } }).__sanalGarajI18n.missing());
    for (const text of left) missing.set(text, step);
    for (const text of await collectTexts(page)) if (/[ğüşıöçĞÜŞİÖÇ]/.test(text)) turkish.set(text, step);
  });
  expect([...missing.entries()]).toEqual([]);
  expect([...turkish.entries()]).toEqual([]);
});

test('dil düğmesi İngilizceye geçer, tercihi saklar ve Türkçeye döner', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.getByRole('link', { name: 'Katalog', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'EN: Switch to English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pick your car, customise it in the garage');
  await expect(page).toHaveTitle('Sanal Garaj — 3D car customisation');
  await page.reload();
  await expect(page.getByRole('link', { name: 'Catalog', exact: true })).toBeVisible();
  await page.goto('/#/arac/toyota-ae86');
  await expect(page.locator('.workbench')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
  await expect(page.locator('.workbench .chip').first()).toHaveText(/^\d+ changes?$/);
  await page.getByRole('button', { name: 'TR: Türkçeye geç' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.getByRole('button', { name: 'Kaydet', exact: true })).toBeVisible({ timeout: 60_000 });
});

test('İngilizce arayüz mobilde taşmaz @mobil', async ({ page }) => {
  await page.addInitScript(english);
  for (const url of ['/#/', '/#/arac/toyota-ae86', '/#/hakkinda']) {
    await page.goto(url);
    await expect(page.locator('main h1').first()).toBeVisible({ timeout: 60_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), url).toBe(false);
  }
});
