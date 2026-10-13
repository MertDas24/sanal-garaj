import { expect, type Page } from '@playwright/test';

// Arayüz metni toplayıcı: dil desteğinin kapsamını ölçmek için tüm sayfa ve durumları gezer.
// translate="no" ile işaretli alanlar (araç/marka adları, model yazarları, kullanıcı içeriği) atlanır.

export async function collectTexts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out = new Set<string>();
    const skip = (el: Element | null) => !el || !!el.closest('script, style, [translate="no"]');
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const text = node.data.trim();
      if (text && !skip(node.parentElement)) out.add(text);
    }
    for (const el of document.querySelectorAll('[aria-label], [title], [placeholder], [alt]')) {
      if (skip(el)) continue;
      for (const name of ['aria-label', 'title', 'placeholder', 'alt']) {
        const value = el.getAttribute(name)?.trim();
        if (value) out.add(value);
      }
    }
    out.add(document.title);
    return [...out];
  });
}

async function editorReady(page: Page) {
  await expect(page.locator('.workbench')).toBeVisible({ timeout: 60_000 });
}
async function openAllDetails(page: Page) {
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
}

/** Sayfa/durum listesi; her adımdan sonra metinler toplanır. */
export async function crawl(page: Page, onStep: (name: string) => Promise<void>) {
  const step = (name: string) => onStep(name);
  const go = async (url: string) => {
    await page.goto('about:blank'); await page.goto(url);
    await expect(page.locator('main h1').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.page-loading')).toHaveCount(0);
  };
  await go('/#/'); await expect(page.locator('.grid > li').first()).toBeVisible(); await step('katalog');
  await page.getByPlaceholder(/./).first().fill('zzzz'); await step('katalog-bos');
  await go('/#/arac/toyota-ae86'); await editorReady(page); await openAllDetails(page); await step('editor');
  await page.getByRole('button', { name: /Önce \/ Sonra|Before \/ after/ }).click(); await step('editor-karsilastirma');
  await go('/#/arac/toyota-ae86?motor3d=1'); await editorReady(page); await expect(page.locator('.engine-canvas')).toBeVisible(); await step('motor');
  await go('/#/arac/mercedes-c63-amg-w204?motor3d=1'); await editorReady(page); await expect(page.locator('.engine-canvas')).toBeVisible(); await step('motor-bilinmeyen');
  for (const id of ['skoda-octavia-1u', 'willys-mb', 'ford-mustang-shelby-gt500', 'toyota-crown-sedan']) {
    await go(`/#/arac/${id}`); await editorReady(page); await openAllDetails(page); await step(`editor-${id}`);
  }
  await go('/#/karsilastir'); await expect(page.locator('.compare-side .viewer__overlay')).toHaveCount(0, { timeout: 60_000 }); await step('karsilastir');
  await go('/#/tasarimlarim'); await step('kayitlar-bos');
  await go('/#/arac/bmw-m3-e30'); await editorReady(page);
  await page.locator('.panel-actions .btn--primary').click(); await step('kaydet-bildirim');
  await go('/#/tasarimlarim'); await step('kayitlar');
  await go('/#/foto'); await step('foto');
  await go('/#/kendi-modelin'); await openAllDetails(page); await step('kendi-modelin');
  await go('/#/kaynaklar'); await step('kaynaklar');
  await go('/#/hakkinda'); await step('hakkinda');
  await go('/#/yok-boyle-sayfa'); await step('404');
  await go('/#/arac/yok-boyle-arac'); await step('arac-yok');
}
