// Uygulama (PWA) ikonlarını public/favicon.svg dosyasından üretir: node scripts/make-icons.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync('public/favicon.svg');
const out = 'public/icons';
for (const size of [192, 512]) await sharp(svg, { density: 1200 }).resize(size, size).png().toFile(`${out}/icon-${size}.png`);
await sharp(svg, { density: 1200 }).resize(180, 180).flatten({ background: '#101216' }).png().toFile(`${out}/apple-touch-icon.png`);
// Maskelenebilir ikon: işletim sistemi kenarları kırpabileceği için çizim güvenli alanda (%70) tutulur
const inner = await sharp(svg, { density: 1200 }).resize(358, 358).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#101216' } })
  .composite([{ input: inner, gravity: 'center' }]).png().toFile(`${out}/icon-maskable-512.png`);
console.log('ikonlar üretildi');
