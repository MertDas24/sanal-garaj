// Bir glTF/GLB dosyasının malzemelerini (üçgen sayısı, renk, doku, kullanıldığı düğümler) listeler.
// Kullanım: node scripts/inspect-materials.mjs <dosya> [...]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
for (const file of process.argv.slice(2)) {
  const doc = await io.read(file);
  const out = new Map();
  for (const n of doc.getRoot().listNodes()) {
    for (const p of n.getMesh()?.listPrimitives() ?? []) {
      const m = p.getMaterial();
      const k = m?.getName() ?? '(yok)';
      const tri = (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3;
      const e = out.get(k) ?? { tri: 0, nodes: new Set(), c: m?.getBaseColorFactor().slice(0, 3).map((x) => x.toFixed(2)).join(','), tex: !!m?.getBaseColorTexture(), a: m?.getAlphaMode(), mr: m ? `${m.getMetallicFactor().toFixed(1)}/${m.getRoughnessFactor().toFixed(1)}` : '' };
      e.tri += tri; e.nodes.add(n.getName());
      out.set(k, e);
    }
  }
  console.log(`\n=== ${file}`);
  for (const [k, e] of [...out].sort((a, b) => b[1].tri - a[1].tri)) {
    console.log(`  ${k.padEnd(34)} ${String(Math.round(e.tri)).padStart(7)} [${e.c}]${e.tex ? ' T' : ''}${e.a !== 'OPAQUE' ? ' ' + e.a : ''} m/r ${e.mr} | ${[...e.nodes].slice(0, 5).join(', ')}${e.nodes.size > 5 ? ` …(+${e.nodes.size - 5})` : ''}`);
  }
}
