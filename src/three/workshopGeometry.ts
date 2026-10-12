import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import type { WrapStyle } from '../lib/design';

/** Kaplamalar yalnızca CG_paint yüzeylerine projekte edilir; cam ve trim seçilmez. */
export function buildWrap(meshes: THREE.Mesh[], box: THREE.Box3, style: WrapStyle, material: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  group.name = `wrap-${style}`;
  if (style === 'none') return group;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const bands = style === 'double' ? [-0.095, 0.095] : [0];
  for (const band of bands) {
    const p = center.clone();
    const extent = new THREE.Vector3(size.x * (style === 'double' ? 0.11 : 0.16), size.z * 1.02, size.y * 0.8);
    p.x += size.x * band;
    p.y = box.max.y - size.y * 0.3;
    if (style === 'hood') {
      extent.set(size.x * 0.72, size.z * 0.24, size.y * 0.7);
      p.z = box.max.z - size.z * 0.18;
    } else if (style === 'roof') {
      extent.set(size.x * 0.72, size.z * 0.42, size.y * 0.2);
      p.y = box.max.y - size.y * 0.04;
    }
    for (const mesh of meshes) {
      const projected = new DecalGeometry(mesh, p, new THREE.Euler(-Math.PI / 2, 0, 0), extent);
      const pos = projected.getAttribute('position');
      const norm = projected.getAttribute('normal');
      const points: number[] = [], normals: number[] = [];
      for (let i = 0; i < pos.count; i += 3) {
        if ([0, 1, 2].some((j) => norm.getY(i + j) < 0.45)) continue;
        for (let j = 0; j < 3; j++) {
          const n = new THREE.Vector3().fromBufferAttribute(norm, i + j);
          const v = new THREE.Vector3().fromBufferAttribute(pos, i + j).addScaledVector(n, 0.002);
          points.push(v.x, v.y, v.z); normals.push(n.x, n.y, n.z);
        }
      }
      projected.dispose();
      if (!points.length) continue;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      group.add(new THREE.Mesh(geometry, material));
    }
  }
  return group;
}

export function buildUnderglow(box: THREE.Box3, material: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  group.name = 'underglow';
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  for (const sign of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.012, size.z * 0.5), material);
    rail.position.set(center.x + sign * size.x * 0.35, 0.055, center.z);
    group.add(rail);
    const light = new THREE.PointLight('#ffffff', 1, 2, 2);
    light.position.copy(rail.position); light.position.y = 0.045;
    group.add(light);
  }
  return group;
}
