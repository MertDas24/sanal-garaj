import { chromium } from '@playwright/test';
import fs from 'fs';
const cat = fs.readFileSync('src/data/catalog.ts', 'utf8');
const ids = [...cat.matchAll(/id: '([^']+)'[^}]*modelId: '([^']+)'/g)].map((m) => m[1]);
const b = await chromium.launch({ channel: 'chrome' });
const pg = await b.newPage({ viewport: { width: 1400, height: 900 } });
for (const id of ids) {
  await pg.goto('about:blank');
  await pg.goto(`http://localhost:5199/#/arac/${id}?s=1&l=1&pc=c`);
  try { await pg.waitForSelector('.viewer__overlay', { state: 'detached', timeout: 20000 }); } catch { console.log(id, 'TIMEOUT'); continue; }
  await pg.waitForTimeout(700);
  const f = await pg.evaluate(() => window.__features);
  console.log(id.padEnd(26), JSON.stringify(f));
  if (process.argv[2]) await pg.locator('.viewer').screenshot({ path: `lab-out/app/parts_${id}.png` });
}
await b.close();
