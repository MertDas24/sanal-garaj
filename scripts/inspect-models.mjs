import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import fs from 'fs'; import path from 'path';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const dir = process.argv[2]; const names = JSON.parse(fs.readFileSync(process.argv[3]));
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.glb'))) {
  const id = f.replace('.glb', ''); const meta = names.find(n => n.id === id);
  const doc = await io.read(path.join(dir, f)); const root = doc.getRoot();
  const b = getBounds(root.listScenes()[0]);
  const size = b.max.map((v, i) => (v - b.min[i]).toFixed(2));
  console.log(`\n=== ${id} ${meta?.title} size=${size} meshes=${root.listMeshes().length} nodes=${root.listNodes().length} tex=${root.listTextures().length}`);
  console.log('  mats:', root.listMaterials().map(m => `${m.getName()}[${m.getBaseColorFactor().slice(0,3).map(x=>x.toFixed(2))}${m.getBaseColorTexture()?' T':''}]`).join(', '));
  console.log('  nodes:', root.listNodes().filter(n=>n.getMesh()).slice(0, 40).map(n => n.getName()).join(', '));
}
