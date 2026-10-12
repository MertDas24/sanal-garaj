import { expect, test } from '@playwright/test';

test('shader hazırlığı sırasında katalog kullanılabilir; ayrılan model sonradan açılmaz', async ({ page }) => {
  await page.addInitScript(() => {
    const state = { hold: true, polls: 0 };
    Object.assign(window, { __shaderPreparation: state });
    for (const Context of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const getExtension = Context.prototype.getExtension;
      const getParameter = Context.prototype.getProgramParameter;
      Context.prototype.getExtension = function (name: string) {
        if (name === 'KHR_parallel_shader_compile') return { COMPLETION_STATUS_KHR: 0x91b1 };
        return getExtension.call(this, name);
      };
      Context.prototype.getProgramParameter = function (program: WebGLProgram, parameter: number) {
        // Sürücü hızına bağlı kalmadan asenkron hazırlığın bekleme dalını sınar.
        if (parameter === 0x91b1) { state.polls++; return !state.hold; }
        return getParameter.call(this, program, parameter);
      };
    }
  });
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/arac/bmw-m3-e30');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __shaderPreparation: { polls: number } }).__shaderPreparation.polls)).toBeGreaterThan(0);
  await expect(page.locator('.workbench')).toHaveCount(0);
  await page.getByRole('link', { name: '← Katalog', exact: true }).click({ timeout: 5000 });
  await page.evaluate(() => { (window as unknown as { __shaderPreparation: { hold: boolean } }).__shaderPreparation.hold = false; });
  await expect(page).toHaveURL(/#\/$/); await expect(page.locator('.workbench')).toHaveCount(0);
  await page.evaluate(() => { location.hash = '/arac/bmw-m3-e30'; });
  await expect(page.locator('.workbench')).toBeVisible({ timeout: 30_000 });
  expect(errors).toEqual([]);
});
