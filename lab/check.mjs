import { chromium } from '@playwright/test';
// usage: node lab/check.mjs <out.png> <hash> [w h] [clickSelector...]
const [out, hash, w = '1400', h = '900', ...clicks] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome' });
const pg = await b.newPage({ viewport: { width: +w, height: +h } });
const logs = [];
pg.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
pg.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await pg.goto('http://localhost:5199/' + hash);
await pg.waitForTimeout(1500);
try { await pg.waitForSelector('.viewer__overlay', { state: 'detached', timeout: 20000 }); } catch {}
for (const c of clicks) { await pg.click(c); await pg.waitForTimeout(400); }
await pg.waitForTimeout(800);
await pg.screenshot({ path: out, fullPage: false });
console.log(logs.slice(0, 15).join('\n') || 'no console errors');
console.log('url:', pg.url());
await b.close();
