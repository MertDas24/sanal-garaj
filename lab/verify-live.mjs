import { chromium, devices } from '@playwright/test';
const BASE = process.argv[2] ?? 'https://mertdas24.github.io/sanal-garaj/';
const b = await chromium.launch({ channel: 'chrome' });
for (const [label, opts] of [['masaüstü', { viewport: { width: 1400, height: 900 } }], ['mobil', devices['Pixel 7']]]) {
  const ctx = await b.newContext(opts);
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  pg.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
  await pg.goto(BASE);
  const cards = await pg.locator('.grid > li').count();
  const ready = await pg.locator('.card__status--ok').count();
  await pg.goto(BASE + '#/arac/bmw-m3-e30?p=1d4fb8&f=x');
  await pg.waitForSelector('.viewer canvas', { timeout: 60000 });
  await pg.waitForSelector('.viewer__overlay', { state: 'detached', timeout: 60000 });
  await pg.waitForTimeout(800);
  await pg.screenshot({ path: `lab-out/app/live_${label}.png` });
  console.log(label, { cards, ready, errors: errs });
  await ctx.close();
}
await b.close();
