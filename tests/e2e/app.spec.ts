import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';

async function waitForModel(page: Page) {
  await expect(page.locator('.viewer canvas')).toBeVisible();
  await expect(page.locator('.viewer__overlay')).toHaveCount(0, { timeout: 30_000 });
}

test.describe('Katalog', () => {
  test('en az 25 araç, gerçek model sayısı ve arama/filtre', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Aracını seç');
    const total = await page.locator('.grid > li').count();
    expect(total).toBeGreaterThanOrEqual(25);
    await expect(page.locator('.catalog__intro')).toContainText(`Katalogda ${total} araç`);
    const ready = await page.locator('.card__status--ok').count();
    await expect(page.locator('.catalog__intro strong')).toHaveText(String(ready));
    await expect(page.locator('.card__status--missing')).toHaveCount(total - ready);

    const search = page.getByPlaceholder('Marka, model veya yıl ara');
    await search.fill('mercedes');
    await expect(page.locator('.grid > li')).toHaveCount(3);
    await search.fill('');
    await page.getByRole('button', { name: 'Sedan', exact: true }).click();
    await expect(page.locator('.grid > li .badge').first()).toHaveText('Sedan');
    // Modelsiz araç varsa filtre görünür ve onları gizler
    const filter = page.getByLabel('Yalnızca 3D modeli olanlar');
    if (await filter.count()) {
      await filter.check();
      await expect(page.locator('.card__status--missing')).toHaveCount(0);
    }
  });

  test('modelsiz kartlar bağlantı içermez; bilinmeyen araç bağlantısı anlaşılır mesaj verir', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.card--disabled a')).toHaveCount(0);
    await page.goto('/#/arac/olmayan-arac');
    await expect(page.getByRole('heading', { name: 'Araç bulunamadı' })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
  });

  test('yalnızca seçilen aracın modeli indirilir', async ({ page }) => {
    const glbs: string[] = [];
    page.on('request', (r) => { if (r.url().endsWith('.glb')) glbs.push(r.url()); });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(glbs).toHaveLength(0);
    await page.locator('a[href="#/arac/volkswagen-passat-b55"]').click();
    await waitForModel(page);
    expect(glbs).toHaveLength(1);
    expect(glbs[0]).toContain('volkswagen-passat-b55.glb');
  });
});

test.describe('Düzenleyici', () => {
  test('renk, yüzey, jant, yükseklik ve parçalar; adres güncellenir', async ({ page }) => {
    await page.goto('/#/arac/toyota-ae86');
    await waitForModel(page);
    await page.getByRole('radiogroup', { name: 'Gövde rengi' }).getByRole('radio', { name: 'Mavi', exact: true }).click();
    await page.getByRole('radio', { name: 'Metalik' }).click();
    await page.getByRole('radio', { name: 'Altın' }).click();
    await page.getByRole('radio', { name: '5 kollu' }).click();
    await page.getByLabel('Yükseklik').fill('-25');
    await page.getByText('Arka kanat spoiler').click();
    await page.getByText('Ön lip / splitter').click();
    await expect(page).toHaveURL(/p=1d4fb8/);
    const url = page.url();
    for (const part of ['f=x', 'rc=c9a227', 'rs=spoke5', 'h=-25', 's=1', 'l=1']) expect(url).toContain(part);
    await expect(page.locator('.range output')).toHaveText('-25 mm');
  });

  test('desteklenmeyen seçenekler gerekçeyle kapalı gösterilir', async ({ page }) => {
    await page.goto('/#/arac/mercedes-300-ce-c124');
    await waitForModel(page);
    await expect(page.getByText('jantlar lastik veya gövdeyle aynı parçada')).toBeVisible();
    await expect(page.getByText('yükseklik ayarlanamaz')).toBeVisible();
    await expect(page.getByRole('radio', { name: '5 kollu' })).toHaveCount(0);
  });

  test('paylaşım bağlantısındaki geçersiz değerler güvenli sınırlarla uygulanır', async ({ page }) => {
    await page.goto('/#/arac/toyota-ae86?p=zz%3Cscript%3E&h=999&rs=evil&f=x&s=1');
    await waitForModel(page);
    await expect(page.locator('.range output')).toHaveText('+40 mm');
    await expect(page.getByRole('radiogroup', { name: 'Jant modeli' }).getByRole('radio', { name: 'Orijinal' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('radio', { name: 'Metalik' })).toHaveAttribute('aria-checked', 'true');
    expect(page.url()).not.toContain('script');
  });

  test('paylaş: bağlantı panoya kopyalanır ve aynı tasarımı açar', async ({ page, context }) => {
    await page.goto('/#/arac/toyota-ae86');
    await waitForModel(page);
    await page.getByRole('radio', { name: 'Kırmızı' }).click();
    await page.getByRole('button', { name: 'Bağlantıyı paylaş' }).click();
    await expect(page.getByText('panoya kopyalandı')).toBeVisible();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    expect(link).toContain('#/arac/toyota-ae86?');
    expect(link).toContain('p=b3121b');
    const p2 = await context.newPage();
    await p2.goto(link);
    await waitForModel(p2);
    await expect(p2.getByRole('radio', { name: 'Kırmızı' })).toHaveAttribute('aria-checked', 'true');
  });

  test('görüntü indir: alt yazılı PNG', async ({ page }) => {
    await page.goto('/#/arac/bmw-m3-e30');
    await waitForModel(page);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Görüntü indir' }).click()]);
    expect(dl.suggestedFilename()).toBe('bmw-m3-e30-sanal-garaj.png');
    const buf = fs.readFileSync((await dl.path())!);
    expect(buf.subarray(1, 4).toString()).toBe('PNG');
    expect(buf.length).toBeGreaterThan(20_000);
  });

  test('kaydet → Tasarımlarım → aç → sil', async ({ page }) => {
    await page.goto('/#/arac/toyota-corolla-e180');
    await waitForModel(page);
    await page.getByRole('radio', { name: 'Yeşil' }).click();
    await page.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.getByText('bu cihaza kaydedildi')).toBeVisible();
    await page.goto('/#/tasarimlarim');
    await expect(page.locator('.grid > li')).toHaveCount(1);
    await expect(page.locator('.card__title')).toContainText('Toyota Corolla');
    await page.getByRole('link', { name: 'Aç', exact: true }).click();
    await waitForModel(page);
    await expect(page.getByRole('radio', { name: 'Yeşil' })).toHaveAttribute('aria-checked', 'true');
    await page.goto('/#/tasarimlarim');
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Sil' }).click();
    await expect(page.getByText('Henüz kayıtlı tasarım yok')).toBeVisible();
  });

  test('önce/sonra karşılaştırması ve kamera sıfırlama', async ({ page }) => {
    await page.goto('/#/arac/porsche-911-turbo-930?p=f2c40f');
    await waitForModel(page);
    await page.getByRole('button', { name: 'Önce / Sonra' }).click();
    await expect(page.getByText('Önce', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Karşılaştırma ayırıcısı')).toBeVisible();
    await page.getByRole('button', { name: 'Karşılaştırmayı kapat' }).click();
    await page.getByRole('button', { name: 'Kamerayı sıfırla' }).click();
  });

  test('fotogerçekçi görüntü: ışık izleme başlar, ilerler ve kapatılabilir', async ({ page }) => {
    // Ekran kartı olmayan CI ortamında (yazılımsal WebGL) gölgelendirici derlemesi dakikalar sürebilir
    test.setTimeout(240_000);
    await page.goto('/#/arac/bmw-m3-e30');
    await waitForModel(page);
    await page.getByRole('button', { name: 'Fotogerçekçi görüntü' }).click();
    await expect(page.locator('.pt-host--on canvas')).toBeVisible();
    await expect(page.locator('.pt-status')).toBeVisible();
    if (!process.env.CI) {
      await expect(page.locator('.pt-status')).toContainText(/Işık izleniyor… [1-9]\d*\//, { timeout: 60_000 });
    }
    await expect(page.getByRole('button', { name: 'Kamerayı sıfırla' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Etkileşimli görünüme dön' }).click({ timeout: 180_000 });
    await expect(page.locator('.pt-host--on')).toHaveCount(0, { timeout: 60_000 });
    await expect(page.getByRole('button', { name: 'Kamerayı sıfırla' })).toBeVisible();
  });

  test('WebGL yoksa anlaşılır mesaj gösterilir', async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        value(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
          if (/webgl/.test(type)) return null;
          return (orig as (...a: unknown[]) => unknown).call(this, type, ...rest);
        },
      });
    });
    await page.goto('/#/arac/volkswagen-passat-b55');
    await expect(page.getByRole('heading', { name: '3D görüntüleme desteklenmiyor' })).toBeVisible();
  });
});

test.describe('Fotoğraf ve yerel model', () => {
  test('fotoğraf yerelde yeniden renklendirilir ve dışarı gönderilmez', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (r) => {
      const u = r.url();
      if (!u.startsWith('http://localhost:4173') && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u);
    });
    await page.goto('/#/foto');
    // Test fotoğrafı: ortada kırmızı degrade "gövde", çevresi gri
    const png = await page.evaluate(() => {
      const c = document.createElement('canvas');
      c.width = 400; c.height = 300;
      const g = c.getContext('2d')!;
      g.fillStyle = '#888'; g.fillRect(0, 0, 400, 300);
      const grad = g.createLinearGradient(0, 40, 0, 180);
      grad.addColorStop(0, '#d02020'); grad.addColorStop(1, '#801010');
      g.fillStyle = grad; g.fillRect(50, 40, 300, 140);
      return c.toDataURL('image/png').split(',')[1];
    });
    await page.locator('input[type=file]').first().setInputFiles({ name: 'araba.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
    const canvas = page.locator('.photo__canvas');
    await expect(canvas).toBeVisible();
    const box = (await canvas.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.35);
    await expect(page.getByText(/Seçili alan: [1-9]/)).toBeVisible();
    await page.getByLabel('Seçimi vurgula').uncheck();
    await page.getByRole('radio', { name: 'Mavi', exact: true }).click();
    const px = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('.photo__canvas')!;
      return Array.from(c.getContext('2d')!.getImageData(200, 100, 1, 1).data);
    });
    expect(px[2]).toBeGreaterThan(px[0]); // kırmızı alan maviye döndü
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Görüntü indir' }).click()]);
    expect(dl.suggestedFilename()).toBe('araba-yeni-renk.png');
    expect(external).toHaveLength(0);
  });

  test('otomatik seçim tarayıcıda çalışır, dış sunucuya istek atmaz', async ({ page }) => {
    test.setTimeout(120_000);
    const external: string[] = [];
    page.on('request', (r) => {
      const u = r.url();
      if (!u.startsWith('http://localhost:4173') && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u);
    });
    await page.goto('/#/foto');
    const png = await page.evaluate(() => {
      const c = document.createElement('canvas');
      c.width = 320; c.height = 200;
      const g = c.getContext('2d')!;
      g.fillStyle = '#5a7a3a'; g.fillRect(0, 0, 320, 200);
      return c.toDataURL('image/png').split(',')[1];
    });
    await page.locator('input[type=file]').first().setInputFiles({ name: 'cimen.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
    await page.getByRole('button', { name: 'Aracı otomatik seç (deneysel)' }).click();
    // Araç olmayan görselde dürüst sonuç: "algılanamadı" (veya tarayıcı desteklemiyorsa açık hata)
    await expect(page.getByText(/araç algılanamadı|Otomatik algılama başlatılamadı/)).toBeVisible({ timeout: 90_000 });
    expect(external).toHaveLength(0);
  });

  test('yerel GLB açılır, malzeme rengi değiştirilebilir', async ({ page }) => {
    await page.goto('/#/kendi-modelin');
    await page.locator('input[type=file]').first().setInputFiles('public/models/volkswagen-passat-b55.glb');
    await expect(page.locator('.viewer--custom canvas')).toBeVisible();
    await expect(page.getByText(/üçgen · \d+ malzeme/)).toBeVisible();
    await page.getByRole('combobox').selectOption({ label: 'CG_paint' });
  });

  test('GLB olmayan dosya reddedilir', async ({ page }) => {
    await page.goto('/#/kendi-modelin');
    await page.locator('input[type=file]').first().setInputFiles({ name: 'x.glb', mimeType: 'model/gltf-binary', buffer: Buffer.from('not a model') });
    await expect(page.getByRole('alert')).toContainText('Model açılamadı');
  });
});

test.describe('Mobil', () => {
  test('sayfalar yatay taşma olmadan çalışır, menü açılır @mobil', async ({ page }) => {
    for (const hash of ['/', '/#/arac/volkswagen-passat-b55', '/#/foto', '/#/kaynaklar', '/#/tasarimlarim']) {
      await page.goto(hash);
      if (hash.includes('arac')) await waitForModel(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, hash).toBeLessThanOrEqual(0);
    }
    await page.goto('/');
    await page.getByRole('button', { name: 'Menü' }).click();
    await page.getByRole('link', { name: 'Kaynaklar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Model kaynakları ve lisanslar' })).toBeVisible();
  });

  test('dokunmatik ekranda renk değişimi @mobil', async ({ page }) => {
    await page.goto('/#/arac/volkswagen-passat-b55');
    await waitForModel(page);
    await page.getByRole('radio', { name: 'Turuncu' }).tap();
    await expect(page).toHaveURL(/p=e8650f/);
  });
});
