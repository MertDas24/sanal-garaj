// Node 24: node scripts/benchmark-decals.mjs
// Sentetik 115.200 üçgenli yüzey; tüm site/gerçek cihaz hızı olarak yorumlanmaz.
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { projectDecal } from '../src/three/workshopGeometry.ts';

const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 8, 240, 240));
mesh.rotation.x = -Math.PI / 2; mesh.updateMatrixWorld();
const position = new THREE.Vector3(), orientation = new THREE.Euler(-Math.PI / 2, 0, 0.1), size = new THREE.Vector3(0.4, 3, 0.2);
const results = { triangles: 115200, method: 'Bir ısınma turundan sonra beş turun ortancası, milisaniye.' };
try {
  for (const [label, build] of [['baselineMs', (...args) => new DecalGeometry(...args)], ['optimizedMs', projectDecal]]) {
    const times = [];
    for (let i = 0; i < 6; i++) {
      const start = performance.now(), geometry = build(mesh, position, orientation, size);
      times.push(performance.now() - start); geometry.dispose();
    }
    results[label] = times.slice(1).sort((a, b) => a - b)[2];
  }
  console.log(JSON.stringify(results, null, 2));
} finally { mesh.geometry.dispose(); mesh.material.dispose(); }
