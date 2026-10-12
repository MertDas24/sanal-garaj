// npm run benchmark -- http://localhost:4173 (önce npm run build && npm run preview)
// Gerçek tarayıcı ölçümü ve uygulamanın kendi kaydedicisinden demo; uydurma skor yok.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
const base = process.argv[2] ?? 'http://localhost:4173';
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome', args: ['--use-angle=d3d11'] });
const rows = [];
const sourceFiles = ['src/three/CarViewer.tsx', 'src/three/carRuntime.ts', 'src/three/bodyKit.ts', 'src/three/workshopGeometry.ts', 'src/components/PerformancePanel.tsx'];
const sourceSha256 = Object.fromEntries(await Promise.all(sourceFiles.map(async (file) => [file, createHash('sha256').update(await fs.readFile(file)).digest('hex')])));
try {
  for (const vehicleId of ['toyota-ae86', 'bmw-m3-e30', 'mercedes-c63-amg-w204']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const start = performance.now();
    await page.goto(`${base}/#/arac/${vehicleId}?ks=true&kd=true&kf=true&kb=true&pc=c&w=double&wc=%23b3121b&text=SANAL%20GARAJ&region=right`);
    await page.waitForSelector('.workbench', { timeout: 60000 });
    const modelReadyMs = Math.round(performance.now() - start);
    await page.getByText('Performans ölçümü ve rapor', { exact: true }).click();
    await page.getByRole('button', { name: 'Bu oturumu ölç', exact: true }).click();
    const runtime = JSON.parse(await page.locator('.metrics-report').innerText());
    rows.push({ vehicleId, modelReadyMs, ...runtime, errors });
    if (vehicleId === 'toyota-ae86') {
      await fs.mkdir('public/demo', { recursive: true });
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '6 saniyelik tur videosu' }).click()]);
      await download.saveAs('public/demo/garaj-turu.webm');
      await page.getByLabel('Kamera açısı').selectOption('front34');
      await page.locator('.viewer').screenshot({ path: 'lab-out/portfolio-poster.png' });
      await sharp('lab-out/portfolio-poster.png').resize(960).jpeg({ quality: 80 }).toFile('public/demo/poster.jpg');
    }
    await context.close();
  }
  const report = { measuredAt: new Date().toISOString(), browser: browser.version(), requestedBackend: 'Chrome / ANGLE D3D11', viewport: '1440×960', sourceSha256, method: 'Her araç yeni tarayıcı bağlamında, soğuk HTTP önbelleğiyle bir kez açıldı. Süre navigasyondan düzenleme panelinin hazır olmasına kadardır. Yerel sunucu; gerçek internet ve mobil cihaz performansı temsil edilmez. Donanım ve eşzamanlı sistem işleri sonucu etkiler.', rows };
  await fs.mkdir('public/benchmarks', { recursive: true }); await fs.writeFile('public/benchmarks/workshop.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
