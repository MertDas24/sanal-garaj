// Ham model dosyalarını indirir, temizler, kanonik malzeme/düğüm adlarına çevirir,
// gerçek ölçüye getirir ve sıkıştırarak public/models/ altına yazar.
// Ayrıca src/data/models.generated.json manifestini üretir.
//
// Kullanım: npm run models            (tümü)
//           npm run models -- <id>    (tek model)
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, quantize, meshopt, getBounds, clearNodeParent, simplify, textureCompress } from '@gltf-transform/functions';
import { PropertyType } from '@gltf-transform/core';
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODEL_SOURCES as BASE_SOURCES } from './model-sources.mjs';
import { SKETCHFAB_SOURCES } from './model-sources-sketchfab.mjs';

const MODEL_SOURCES = [...BASE_SOURCES, ...SKETCHFAB_SOURCES];

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.model-cache');
const OUT = path.join(ROOT, 'public', 'models');
const MANIFEST = path.join(ROOT, 'src', 'data', 'models.generated.json');
const ROLE_NAMES = { paint: 'CG_paint', glass: 'CG_glass', tire: 'CG_tire', rim: 'CG_rim' };

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
await MeshoptSimplifier.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

/**
 * Ham dosyayı önbelleğe indirir. GLB tek dosyadır; .gltf ise yanındaki .bin ve doku dosyaları da
 * aynı göreli yollarla indirilir (yalnızca aynı sunucu ve klasör altından, "../" içeren yollar reddedilir).
 */
async function fetchRaw(src) {
  if (src.download.endsWith('.gltf')) return fetchGltf(src);
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

async function fetchGltf(src) {
  const dir = path.join(CACHE, src.id);
  const file = path.join(dir, 'scene.gltf');
  if (fs.existsSync(path.join(dir, '.complete'))) return file;
  fs.mkdirSync(dir, { recursive: true });
  const get = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${src.id}: indirme başarısız (${res.status}) ${url}`);
    return Buffer.from(await res.arrayBuffer());
  };
  const json = JSON.parse((await get(src.download)).toString('utf8'));
  const base = src.download.slice(0, src.download.lastIndexOf('/') + 1);
  const uris = [...(json.buffers ?? []), ...(json.images ?? [])].map((x) => x.uri).filter((u) => u && !u.startsWith('data:'));
  for (const uri of uris) {
    const rel = decodeURIComponent(uri);
    if (rel.includes('..') || /^[a-z]+:/i.test(rel)) throw new Error(`${src.id}: güvensiz göreli yol ${uri}`);
    const out = path.join(dir, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, await get(base + uri));
  }
  fs.writeFileSync(file, JSON.stringify(json));
  // Gömülü kaynak bilgisini doğrula: dosyadaki Sketchfab adresi kayıttaki adresle aynı olmalı
  const extras = json.asset?.extras ?? {};
  if (src.source.url && extras.source && !extras.source.includes(src.source.url.match(/[0-9a-f]{32}/)?.[0] ?? '#')) {
    throw new Error(`${src.id}: dosyadaki kaynak (${extras.source}) kayıtla uyuşmuyor`);
  }
  fs.writeFileSync(path.join(dir, '.complete'), '');
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
  // Dört tekerleği tek düğümde tutan modellerde tekerlekleri çeyreklere ayır
  const quadrantWheels = (src.wheelQuadrants ?? []).flatMap((name) => {
    const meshNodes = [];
    byName(name).traverse((n) => { if (n.getMesh()) meshNodes.push(n); });
    return meshNodes.flatMap((n) => splitByQuadrant(doc, scene, n));
  });
  const wheelNodeList = [...(src.wheelNodes ?? []).map(byName), ...quadrantWheels, ...wheelsByMaterial(root, src.wheelMaterials ?? [])];

  // Kanonik malzeme adları.
  // Jant ve lastik rolleri yalnızca tekerlek düğümlerindeki kullanıma uygulanır: aynı malzeme gövdede de
  // kullanılıyorsa (ör. pencere çerçevesi, ızgara) tekerlek kullanımı için klonlanır.
  const primsUnder = (nodes) => {
    const out = new Set();
    for (const n of nodes) n.traverse((c) => (c.getMesh()?.listPrimitives() ?? []).forEach((p) => out.add(p)));
    return out;
  };
  const wheelPrims = primsUnder(wheelNodeList);
  // Bir rol girdisi "malzeme" ya da "malzeme@düğüm" biçimindedir; ikincisinde rol yalnızca o düğümün
  // altındaki kullanıma uygulanır (aynı malzeme iç mekânda veya farlarda da kullanılıyorsa).
  const roles = {};
  for (const [role, names] of Object.entries(src.materials ?? {})) {
    const wheelOnly = (role === 'rim' || role === 'tire') && wheelPrims.size > 0;
    for (const entry of names) {
      const [name, nodeName] = entry.split('@');
      const mats = root.listMaterials().filter((m) => m.getName() === name);
      if (!mats.length) throw new Error(`${src.id}: malzeme "${name}" bulunamadı`);
      const allowed = nodeName ? primsUnder([byName(nodeName)]) : wheelOnly ? wheelPrims : null;
      for (const m of mats) {
        const users = m.listParents().filter((p) => p.propertyType === PropertyType.PRIMITIVE);
        if (!allowed || users.every((p) => allowed.has(p))) { m.setName(ROLE_NAMES[role]); continue; }
        const clone = m.clone().setName(ROLE_NAMES[role]);
        for (const p of users) if (allowed.has(p)) p.setMaterial(clone);
      }
    }
  }
  for (const m of root.listMaterials()) {
    const role = Object.entries(ROLE_NAMES).find(([, v]) => v === m.getName())?.[0];
    if (role && m.listParents().some((p) => p.propertyType === PropertyType.PRIMITIVE)) roles[role] = true;
  }

  // Düğüm yapısı: CG_root -> [CG_body, CG_wheel_*]
  const wheels = wheelNodeList;
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
  const before = countTriangles(doc);
  await doc.transform(
    prune(),
    dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.MESH, PropertyType.TEXTURE] }),
    weld(),
    ...(src.simplify ? [simplify({ simplifier: MeshoptSimplifier, ratio: src.simplify, error: 0.0008, lockBorder: true })] : []),
    ...(root.listTextures().length
      ? [textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [src.textureSize ?? 1024, src.textureSize ?? 1024], quality: 82 })]
      : []),
    prune(),
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
    sourceTriangles: before,
    size,
    source: { ...src.source, ...(src.download.includes('raw.githubusercontent.com') ? { mirror: src.download } : {}) },
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
    'Sketchfab modelleri, Sketchfab dışa aktarımının GitHub’daki herkese açık kopyalarından indirilmiştir; her kopyanın içindeki',
    'gömülü kaynak adresi derleme sırasında yukarıdaki Sketchfab adresiyle karşılaştırılır ve lisans Sketchfab API’sinden doğrulanır.',
    '',
    '## Diğer varlıklar',
    '',
    '| Dosya | Kaynak | Yazar | Lisans |',
    '|---|---|---|---|',
    '| `env/autoshop_01_1k.hdr` | [Poly Haven — Autoshop 01](https://polyhaven.com/a/autoshop_01) | Oliksiy Yakovlyev | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |',
    '| `ml/deeplab_v3.tflite` | [MediaPipe Image Segmenter — DeepLab v3](https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter) | Google | [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) |',
    '| `ml/wasm/*` (derlemede kopyalanır) | [@mediapipe/tasks-vision](https://www.npmjs.com/package/@mediapipe/tasks-vision) | Google | [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) |',
    '',
    'Marka ve model adları ilgili şirketlerin tescilli markalarıdır ve yalnızca aracı tanımlamak için kullanılır.',
    'Açık lisans, model dosyasının telif hakkını kapsar; marka ve tasarım hakları ayrıdır.',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'CREDITS.md'), text);
}

/**
 * Dört tekerleği tek düğümde tutan bir ağı, üçgen merkezlerinin (dünya uzayında) aracın merkezine göre
 * hangi çeyrekte olduğuna bakarak 4 ayrı düğüme böler. Yeni düğümler sahne köküne, aynı dünya dönüşümüyle eklenir.
 */
function splitByQuadrant(doc, scene, node) {
  const mesh = node.getMesh();
  if (!mesh) throw new Error(`çeyrek bölme: "${node.getName()}" düğümünde ağ yok`);
  const sceneBox = getBounds(scene);
  const cx = (sceneBox.min[0] + sceneBox.max[0]) / 2, cz = (sceneBox.min[2] + sceneBox.max[2]) / 2;
  const wm = node.getWorldMatrix();
  const buffer = doc.getRoot().listBuffers()[0];
  const quads = [0, 1, 2, 3].map(() => doc.createMesh(`${mesh.getName()}_q`));
  const p = [];
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION');
    const idx = prim.getIndices();
    const count = idx ? idx.getCount() : pos.getCount();
    const lists = [[], [], [], []];
    for (let i = 0; i < count; i += 3) {
      let x = 0, z = 0;
      const tri = [];
      for (let k = 0; k < 3; k++) {
        const vi = idx ? idx.getScalar(i + k) : i + k;
        tri.push(vi);
        pos.getElement(vi, p);
        x += (wm[0] * p[0] + wm[4] * p[1] + wm[8] * p[2] + wm[12]) / 3;
        z += (wm[2] * p[0] + wm[6] * p[1] + wm[10] * p[2] + wm[14]) / 3;
      }
      lists[(x > cx ? 1 : 0) + (z > cz ? 2 : 0)].push(...tri);
    }
    lists.forEach((list, q) => {
      if (!list.length) return;
      const np = doc.createPrimitive().setMaterial(prim.getMaterial()).setMode(prim.getMode())
        .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(list)).setBuffer(buffer));
      for (const sem of prim.listSemantics()) np.setAttribute(sem, prim.getAttribute(sem));
      quads[q].addPrimitive(np);
    });
  }
  const out = [];
  quads.forEach((m, q) => {
    if (!m.listPrimitives().length) { m.dispose(); return; }
    const n = doc.createNode(`${node.getName()}__q${q}`).setMesh(m).setMatrix(wm);
    scene.addChild(n);
    out.push(n);
  });
  node.dispose();
  return out;
}

/**
 * Verilen malzemeleri kullanan ağ düğümlerini bulur, merkezlerine göre tekerleklere gruplar ve en alçaktaki
 * 4 tekerleğin düğümlerini döndürür (stepne gibi fazladan tekerlekler gövdede kalır).
 */
function wheelsByMaterial(root, names) {
  if (!names.length) return [];
  const nodes = root.listNodes().filter((n) => n.getMesh()?.listPrimitives().some((p) => names.includes(p.getMaterial()?.getName())));
  const clusters = [];
  for (const n of nodes) {
    const b = getBounds(n);
    const c = b.min.map((v, i) => (v + b.max[i]) / 2);
    const r = Math.max(b.max[1] - b.min[1], b.max[2] - b.min[2]) / 2;
    const hit = clusters.find((k) => Math.hypot(k.c[0] - c[0], k.c[1] - c[1], k.c[2] - c[2]) < Math.max(k.r, r) * 0.9);
    if (hit) hit.nodes.push(n); else clusters.push({ c, r, nodes: [n] });
  }
  if (clusters.length < 4) throw new Error(`tekerlek malzemelerinden yalnızca ${clusters.length} tekerlek bulundu`);
  clusters.sort((a, b) => a.c[1] - b.c[1]);
  return clusters.slice(0, 4).flatMap((k) => k.nodes);
}
