import { chromium } from '@playwright/test';
// usage: node lab/shoot.mjs <outdir> id[:hl1,hl2][@ry] ...
const [out, ...specs] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=d3d11', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1200, height: 400 } });
for (const s of specs) {
  const [idhl, ry = '0'] = s.split('@'); const [id, hl = ''] = idhl.split(':');
  const url = `http://localhost:5199/lab/index.html?f=${id.includes('/') ? id : '/_raw/' + id + '.glb'}&hl=${encodeURIComponent(hl)}&ry=${ry}`;
  await pg.goto(url); await pg.waitForFunction(() => document.title !== '', null, { timeout: 30000 });
  const parts = id.split('/');
  const file = parts.pop();
  const name = (file === 'scene.gltf' ? parts.pop().slice(0, 8) : file.replace('.glb', '')) + (hl ? '_hl' : '');
  await pg.screenshot({ path: `${out}/${name}.png` }); console.log(name, await pg.title());
}
await b.close();
