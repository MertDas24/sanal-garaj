// Canlı siteden portfolyo görselleri: node lab/portfolio-shots.mjs <çıktı klasörü>
import { chromium, devices } from '@playwright/test';
const OUT = process.argv[2];
const BASE = 'https://mertdas24.github.io/sanal-garaj/';
const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=vulkan'] });
const ready = async (pg) => {
  await pg.waitForSelector('.viewer canvas', { timeout: 90000 });
  await pg.waitForSelector('.viewer__overlay', { state: 'detached', timeout: 90000 });
};
const log = (n) => console.log('✓', n);
const fsx = await import('node:fs');
const have = (f) => fsx.existsSync(`${OUT}/${f}`);

// Masaüstü
const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5, reducedMotion: 'reduce' });
const pg = await ctx.newPage();
if (!have('01-katalog.png')) {
  await pg.goto(BASE); await pg.waitForTimeout(2500);
  await pg.screenshot({ path: `${OUT}/01-katalog.png` }); log('katalog');
  await pg.screenshot({ path: `${OUT}/02-katalog-tam-sayfa.png`, fullPage: true }); log('katalog tam');
}

const editor = async (file, hash, after) => {
  if (have(file)) return;
  await pg.goto(BASE + hash); await ready(pg); await pg.waitForTimeout(1500);
  if (after) await after();
  await pg.screenshot({ path: `${OUT}/${file}` }); log(file);
};
await editor('03-duzenleyici-gallardo.png', '#/arac/lamborghini-gallardo?p=e8650f&f=p&wt=dark&cc=f2c40f&env=studio');
await editor('04-duzenleyici-bmw-m3.png', '#/arac/bmw-m3-e30?p=1d4fb8&f=x&rs=spoke5&rc=c9a227&h=-30&env=garage');
await editor('05-once-sonra.png', '#/arac/porsche-911-turbo-930?p=f2c40f&f=g', async () => {
  await pg.getByRole('button', { name: 'Önce / Sonra' }).click(); await pg.waitForTimeout(800);
});

const photoreal = async (file, hash, shot) => {
  if (have(file)) return;
  await pg.goto(BASE + hash); await ready(pg);
  await pg.getByLabel('Kamera açısı').selectOption(shot);
  await pg.getByRole('radio', { name: 'Normal' }).click();
  await pg.getByRole('button', { name: 'Fotogerçekçi görüntü' }).click();
  await pg.waitForSelector('text=Fotogerçekçi görüntü hazır', { timeout: 600000 });
  await pg.screenshot({ path: `${OUT}/${file}` });
  const raw = await pg.evaluate(() => document.querySelector('.pt-canvas')?.toDataURL('image/png'));
  if (raw) (await import('node:fs')).writeFileSync(`${OUT}/${file.replace('.png', '-render.png')}`, Buffer.from(raw.split(',')[1], 'base64'));
  log(file);
};
await photoreal('06-fotogercekci-db11.png', '#/arac/aston-martin-db11?p=b8bcc2&f=x&env=studio', 'front34');
await photoreal('07-fotogercekci-gallardo-gunbatimi.png', '#/arac/lamborghini-gallardo?p=e8650f&f=p&cc=f2c40f&env=sunset', 'side');
await photoreal('08-fotogercekci-corvette-gece.png', '#/arac/chevrolet-corvette-c7?p=b3121b&f=x&env=night', 'front34');

await editor('09b-motor-atolyesi.png', '#/arac/chevrolet-corvette-c7?p=b3121b', async () => {
  await pg.locator('[aria-controls="motor-3d"]').first().click();
  await pg.waitForSelector('#motor-3d canvas', { timeout: 60000 }).catch(() => {});
  await pg.waitForTimeout(4000);
  await pg.locator('#motor-3d').scrollIntoViewIfNeeded();
});
for (const [file, hash] of [['09-karsilastir.png', '#/karsilastir'], ['10-fotografta-dene.png', '#/foto'], ['11-hakkinda.png', '#/hakkinda'], ['12-kaynaklar.png', '#/kaynaklar']]) {
  await pg.goto(BASE + hash); await pg.waitForTimeout(hash === '#/karsilastir' ? 9000 : 2000);
  await pg.screenshot({ path: `${OUT}/${file}` }); log(file);
}
await ctx.close();

// Mobil
const m = await b.newContext({ ...devices['Pixel 7'], reducedMotion: 'reduce' });
const mp = await m.newPage();
await mp.goto(BASE); await mp.waitForTimeout(2500);
await mp.screenshot({ path: `${OUT}/13-mobil-katalog.png` }); log('mobil katalog');
await mp.goto(BASE + '#/arac/mercedes-e-serisi-w212?p=111214&f=x&wt=medium'); await ready(mp); await mp.waitForTimeout(1500);
await mp.screenshot({ path: `${OUT}/14-mobil-duzenleyici.png` }); log('mobil düzenleyici');
await mp.screenshot({ path: `${OUT}/15-mobil-duzenleyici-tam.png`, fullPage: true }); log('mobil tam');
await b.close();
