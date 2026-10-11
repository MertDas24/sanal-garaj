// Ham model dosyalarını indirir, temizler, kanonik malzeme/düğüm adlarına çevirir,
// gerçek ölçüye getirir ve sıkıştırarak public/models/ altına yazar.
// Ayrıca src/data/models.generated.json manifestini üretir.
//
// Kullanım: npm run models            (tümü)
//           npm run models -- <id>    (tek model)
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, quantize, meshopt, getBounds, clearNodeParent } from '@gltf-transform/functions';
import { PropertyType } from '@gltf-transform/core';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODEL_SOURCES } from './model-sources.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.model-cache');
const OUT = path.join(ROOT, 'public', 'models');
const MANIFEST = path.join(ROOT, 'src', 'data', 'models.generated.json');
const ROLE_NAMES = { paint: 'CG_paint', glass: 'CG_glass', tire: 'CG_tire', rim: 'CG_rim' };

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

async function fetchRaw(src) {
  const file = path.join(CACHE, `${src.id}.glb`);
  if (!fs.existsSync(file)) {
    const res = await fetch(src.download);
    if (!res.ok) throw new Error(`${src.id}: indirme başarısız (${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.subarray(0, 4).toString('ascii') !== 'glTF') throw new Error(`${src.id}: GLB değil`);
    fs.writeFileSync(file, buf);
  }
  return file;
}

/** Doku paletinde tutulan gövde rengini (UV hücreleri) ayrı CG_paint malzemesine taşır. */
function paletteSplit(doc, src) {
  const { nodes: onlyNodes } = src.paletteSplit;
  const cells = process.env.PALETTE_OVERRIDE ? JSON.parse(process.env.PALETTE_OVERRIDE) : src.paletteSplit.cells;
  // Hücre: [sütun, satır] veya [sütun, satır, minY]; minY, düğümün yerel Y aralığında 0..1 arası alt sınırdır
  // (ör. aynı palet rengini paylaşan alçak plakaları dışarıda bırakmak için).
  const cellMin = new Map(cells.map(([c, r, minY = 0]) => [`${c},${r}`, minY]));
  const hex = src.paletteSplit.color ?? '#cccccc';
  const lin = [1, 3, 5].map((i) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  const paint = doc.createMaterial('CG_paint').setBaseColorFactor([...lin, 1]).setRoughnessFactor(0.5);
  let moved = 0;
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh || (onlyNodes && !onlyNodes.includes(node.getName()))) continue;
    for (const prim of mesh.listPrimitives()) {
      const mat = prim.getMaterial();
      const uv = prim.getAttribute('TEXCOORD_0');
      const p = [];
      if (!mat?.getBaseColorTexture() || !uv) continue;
      const idx = prim.getIndices();
      const count = idx ? idx.getCount() : prim.getAttribute('POSITION').getCount();
      const pos = prim.getAttribute('POSITION');
      const wm = node.getWorldMatrix();
      const worldY = (vi) => { pos.getElement(vi, p); return wm[1] * p[0] + wm[5] * p[1] + wm[9] * p[2] + wm[13]; };
      let yMin = Infinity, yMax = -Infinity;
      for (let vi = 0; vi < pos.getCount(); vi++) { const wy = worldY(vi); yMin = Math.min(yMin, wy); yMax = Math.max(yMax, wy); }
      const keep = [], take = [];
      const t = [];
      for (let i = 0; i < count; i += 3) {
        let u = 0, v = 0, y = 0;
        const tri = [];
        for (let k = 0; k < 3; k++) {
          const vi = idx ? idx.getScalar(i + k) : i + k;
          tri.push(vi);
          uv.getElement(vi, t);
          u += t[0] / 3; v += t[1] / 3;
          y += worldY(vi) / 3;
        }
        const cell = `${Math.floor((u - Math.floor(u)) * 8)},${Math.floor((v - Math.floor(v)) * 8)}`;
        const minY = cellMin.get(cell);
        const hit = minY !== undefined && (y - yMin) / (yMax - yMin || 1) >= minY;
        (hit ? take : keep).push(...tri);
      }
      if (!take.length) continue;
      moved += take.length / 3;
      const mk = (arr) => doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(arr)).setBuffer(doc.getRoot().listBuffers()[0]);
      const painted = doc.createPrimitive().setMaterial(paint).setIndices(mk(take)).setMode(prim.getMode());
      for (const sem of prim.listSemantics()) painted.setAttribute(sem, prim.getAttribute(sem));
      mesh.addPrimitive(painted);
      if (keep.length) prim.setIndices(mk(keep));
      else prim.dispose();
    }
  }
  if (!moved) throw new Error(`${src.id}: palet bölmede hiç üçgen bulunamadı`);
  return moved;
}

function countTriangles(doc) {
  let n = 0;
  for (const node of doc.getRoot().listNodes()) {
    for (const p of node.getMesh()?.listPrimitives() ?? []) {
      n += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
    }
  }
  return Math.round(n);
}

async function buildOne(src) {
  const doc = await io.read(await fetchRaw(src));
  const root = doc.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const byName = (name) => {
    const found = root.listNodes().filter((n) => n.getName() === name);
    if (found.length !== 1) throw new Error(`${src.id}: düğüm "${name}" bulunamadı veya birden fazla (${found.length})`);
    return found[0];
  };

  for (const name of src.removeNodes ?? []) byName(name).dispose();
  if (src.paletteSplit) paletteSplit(doc, src);

  // Kanonik malzeme adları.
  // Jant ve lastik rolleri yalnızca tekerlek düğümlerindeki kullanıma uygulanır: aynı malzeme gövdede de
  // kullanılıyorsa (ör. pencere çerçevesi, ızgara) tekerlek kullanımı için klonlanır.
  const wheelPrims = new Set(
    (src.wheelNodes ?? []).flatMap((name) => {
      const out = [];
      byName(name).traverse((n) => out.push(...(n.getMesh()?.listPrimitives() ?? [])));
      return out;
    }),
  );
  const roles = {};
  for (const [role, names] of Object.entries(src.materials ?? {})) {
    const wheelOnly = (role === 'rim' || role === 'tire') && wheelPrims.size > 0;
    for (const name of names) {
      const mats = root.listMaterials().filter((m) => m.getName() === name);
      if (!mats.length) throw new Error(`${src.id}: malzeme "${name}" bulunamadı`);
      for (const m of mats) {
        if (!wheelOnly) { m.setName(ROLE_NAMES[role]); continue; }
        const users = m.listParents().filter((p) => p.propertyType === PropertyType.PRIMITIVE);
        if (users.every((p) => wheelPrims.has(p))) { m.setName(ROLE_NAMES[role]); continue; }
        const clone = m.clone().setName(ROLE_NAMES[role]);
        for (const p of users) if (wheelPrims.has(p)) p.setMaterial(clone);
      }
    }
  }
  for (const m of root.listMaterials()) {
    const role = Object.entries(ROLE_NAMES).find(([, v]) => v === m.getName())?.[0];
    if (role && m.listParents().some((p) => p.propertyType === PropertyType.PRIMITIVE)) roles[role] = true;
  }

  // Düğüm yapısı: CG_root -> [CG_body, CG_wheel_*]
  const wheels = (src.wheelNodes ?? []).map(byName);
  for (const w of wheels) clearNodeParent(w);
  const parts = {};
  for (const [kind, names] of Object.entries(src.partNodes ?? {})) {
    names.map(byName).forEach((n) => n.setName(`CG_part_${kind}`));
    parts[kind] = true;
  }
  const body = doc.createNode('CG_body');
  for (const child of scene.listChildren()) {
    if (!wheels.includes(child)) { scene.removeChild(child); body.addChild(child); }
  }
  const cgRoot = doc.createNode('CG_root').addChild(body);
  wheels.forEach((w, i) => { scene.removeChild(w); w.setName(`CG_wheel_${i}`); cgRoot.addChild(w); });
  scene.addChild(cgRoot);

  // Yönlendirme ve gerçek ölçü
  const q = [0, Math.sin(src.rotateY / 2), 0, Math.cos(src.rotateY / 2)];
  cgRoot.setRotation(q);
  let b = getBounds(scene);
  const scale = src.lengthM / (b.max[2] - b.min[2]);
  cgRoot.setScale([scale, scale, scale]);
  b = getBounds(scene);
  cgRoot.setTranslation([-(b.min[0] + b.max[0]) / 2, -b.min[1], -(b.min[2] + b.max[2]) / 2]);
  b = getBounds(scene);
  const size = b.max.map((v, i) => +(v - b.min[i]).toFixed(3));
  const widthRatio = size[0] / size[2];
  if (widthRatio > 0.8) throw new Error(`${src.id}: genişlik/uzunluk oranı ${widthRatio.toFixed(2)} — yön (rotateY) hatalı olabilir`);

  // Optimizasyon (malzemeler birleştirilmez: rol adları korunmalı)
  await doc.transform(
    prune(),
    dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.MESH, PropertyType.TEXTURE] }),
    weld(),
    quantize(),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  );
  const outFile = path.join(OUT, `${src.id}.glb`);
  await io.write(outFile, doc);
  const bytes = fs.statSync(outFile).size;

  const has = { ...roles, wheels: wheels.length };
  return {
    id: src.id,
    file: `models/${src.id}.glb`,
    bytes,
    triangles: countTriangles(doc),
    size,
    source: src.source,
    features: {
      paint: !!roles.paint,
      rimColor: !!roles.rim && wheels.length >= 4,
      rimStyle: !!roles.rim && wheels.length >= 4,
      rideHeight: wheels.length >= 4,
      spoiler: parts.spoiler ? 'builtin' : src.mods?.spoiler ? 'addon' : false,
      frontLip: src.mods?.frontLip ? 'addon' : false,
    },
    materials: has,
    notes: src.notes ?? null,
  };
}

const only = process.argv[2];
const prev = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : [];
const results = [];
let failed = 0;
for (const src of MODEL_SOURCES) {
  if (only && src.id !== only) { const p = prev.find((m) => m.id === src.id); if (p) results.push(p); continue; }
  try {
    const r = await buildOne(src);
    results.push(r);
    console.log(`✓ ${r.id.padEnd(28)} ${(r.bytes / 1024).toFixed(0).padStart(5)} KB  ${String(r.triangles).padStart(6)} üçgen  ${JSON.stringify(r.features)}`);
  } catch (e) {
    failed++;
    console.error(`✗ ${src.id}: ${e.message}`);
  }
}
fs.writeFileSync(MANIFEST, JSON.stringify(results, null, 2) + '\n');
writeCredits(results);
console.log(`\n${results.length} model manifeste yazıldı → ${path.relative(ROOT, MANIFEST)}`);
if (failed) process.exit(1);

/** Model atıflarını CREDITS.md dosyasına yazar (CC BY gereği: başlık, yazar, kaynak, lisans, değişiklik bildirimi). */
function writeCredits(models) {
  const label = { 'CC-BY-3.0': 'CC BY 3.0', 'CC-BY-4.0': 'CC BY 4.0', 'CC0-1.0': 'CC0 1.0' };
  const rows = models.map((m) =>
    `| \`${m.file}\` | [${m.source.title}](${m.source.url}) | ${m.source.author} | ${m.source.site} | [${label[m.source.license]}](${m.source.licenseUrl}) | ${(m.bytes / 1024).toFixed(0)} KB |`);
  const text = [
    '# 3D model kaynakları ve lisanslar',
    '',
    'Bu dosya `npm run models` tarafından otomatik üretilir; elle düzenlemeyin (kaynak: `scripts/model-sources.mjs`).',
    '',
    'Aşağıdaki modeller açık lisanslıdır ve ücretsizdir (satın alma yapılmamıştır). **Değişiklikler:** her model gerçek',
    'araç uzunluğuna ölçeklendi, yönlendirildi, malzemeleri yeniden adlandırıldı/ayrıştırıldı (gövde boyası, cam, lastik, jant),',
    'gereksiz sahne parçaları kaldırıldı ve meshopt ile sıkıştırıldı.',
    '',
    '| Dosya | Kaynak model | Yazar | Site | Lisans | Boyut |',
    '|---|---|---|---|---|---|',
    ...rows,
    '',
    'Marka ve model adları ilgili şirketlerin tescilli markalarıdır ve yalnızca aracı tanımlamak için kullanılır.',
    'Açık lisans, model dosyasının telif hakkını kapsar; marka ve tasarım hakları ayrıdır.',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'CREDITS.md'), text);
}
