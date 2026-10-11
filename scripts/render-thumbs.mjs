// Katalog küçük resimlerini uygulamanın kendi 3D görüntüleyicisiyle üretir (public/thumbs/<modelId>.jpg).
// Önce geliştirme sunucusunu başlatın:  npx vite --port 5199
// Kullanım: node scripts/render-thumbs.mjs [modelId ...]
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.env.THUMB_BASE ?? 'http://localhost:5199/';
const catalog = fs.readFileSync(new URL('../src/data/catalog.ts', import.meta.url), 'utf8');
const pairs = [...catalog.matchAll(/id: '([^']+)'[^}]*?modelId: '([^']+)'/g)].map((m) => ({ vehicle: m[1], model: m[2] }));
const only = process.argv.slice(2);
fs.mkdirSync(new URL('../public/thumbs/', import.meta.url), { recursive: true });

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
for (const { vehicle, model } of pairs) {
  if (only.length && !only.includes(model)) continue;
  await page.goto('about:blank');
  await page.goto(`${BASE}#/arac/${vehicle}`);
  await page.waitForSelector('.viewer__overlay', { state: 'detached', timeout: 30000 });
  await page.addStyleTag({ content: '.viewer__tools{display:none!important}' });
  await page.waitForTimeout(600);
  const viewer = page.locator('.viewer');
  const box = await viewer.boundingBox();
  // 16:10 orta kırpım
  const h = Math.min(box.height, box.width / 1.6);
  const w = h * 1.6;
  await page.screenshot({
    path: `public/thumbs/${model}.jpg`, type: 'jpeg', quality: 80,
    clip: { x: box.x + (box.width - w) / 2, y: box.y + (box.height - h) / 2 + h * 0.04, width: w, height: h * 0.92 },
  });
  console.log('✓', model);
}
await browser.close();
