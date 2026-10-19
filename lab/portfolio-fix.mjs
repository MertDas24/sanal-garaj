import { chromium, devices } from '@playwright/test';
const OUT = process.argv[2];
const BASE = 'https://mertdas24.github.io/sanal-garaj/';
const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=vulkan'] });
// Tembel yüklenen görselleri yükle: sayfayı sonuna kadar kaydır, tüm img'lerin bitmesini bekle
const loadImages = async (pg) => {
  await pg.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await pg.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 60000 });
  await pg.waitForTimeout(800);
};
const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5, reducedMotion: 'reduce' });
const pg = await ctx.newPage();
await pg.goto(BASE); await loadImages(pg);
await pg.screenshot({ path: `${OUT}/01-katalog.png` });
await pg.screenshot({ path: `${OUT}/02-katalog-tam-sayfa.png`, fullPage: true }); console.log('✓ katalog');
await pg.goto(BASE + '#/karsilastir?a=lamborghini-gallardo&b=aston-martin-db11');
await pg.waitForFunction(() => document.querySelectorAll('canvas').length >= 2 && ![...document.querySelectorAll('*')].some((e) => e.children.length === 0 && /3D model yükleniyor/.test(e.textContent ?? '')), null, { timeout: 120000 });
await pg.waitForTimeout(2500);
await pg.screenshot({ path: `${OUT}/09-karsilastir.png` }); console.log('✓ karşılaştır');
await pg.goto(BASE + '#/hakkinda'); await loadImages(pg);
await pg.screenshot({ path: `${OUT}/11-hakkinda.png` }); console.log('✓ hakkında');
await ctx.close();
const m = await b.newContext({ ...devices['Pixel 7'], reducedMotion: 'reduce' });
const mp = await m.newPage();
await mp.goto(BASE + '#/arac/bmw-m3-e30?p=b3121b&f=g&rs=spoke5&rc=c9a227');
await mp.waitForSelector('.viewer canvas', { timeout: 90000 });
await mp.waitForSelector('.viewer__overlay', { state: 'detached', timeout: 90000 });
await mp.waitForTimeout(1500);
await mp.screenshot({ path: `${OUT}/14-mobil-duzenleyici.png` });
await mp.screenshot({ path: `${OUT}/15-mobil-duzenleyici-tam.png`, fullPage: true }); console.log('✓ mobil');
await b.close();
