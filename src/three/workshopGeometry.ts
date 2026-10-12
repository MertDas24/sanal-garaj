import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import type { WrapStyle } from '../lib/design';

/** Kaplamalar yalnızca CG_paint yüzeylerine projekte edilir; cam ve trim seçilmez. */
export function buildWrap(meshes: THREE.Mesh[], box: THREE.Box3, style: WrapStyle, material: THREE.Material, settings = { width: 100, offset: 0, rotation: 0 }): THREE.Group {
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
    p.x += size.x * settings.offset / 100;
    p.y = box.max.y - size.y * 0.3;
    if (style === 'hood') {
      extent.set(size.x * 0.72, size.z * 0.24, size.y * 0.7);
      p.z = box.max.z - size.z * 0.18;
    } else if (style === 'roof') {
      extent.set(size.x * 0.72, size.z * 0.42, size.y * 0.2);
      p.y = box.max.y - size.y * 0.04;
    }
    extent.x *= settings.width / 100;
    for (const mesh of meshes) {
      const projected = new DecalGeometry(mesh, p, new THREE.Euler(-Math.PI / 2, 0, THREE.MathUtils.degToRad(settings.rotation)), extent);
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

/** Metin/logo katmanı da yalnızca boya geometrisini kullanır. UV dokusu projeksiyondan korunur. */
export function buildDecal(meshes: THREE.Mesh[], box: THREE.Box3, region: 'hood' | 'roof' | 'left' | 'right', material: THREE.Material) {
  const group = new THREE.Group(); group.name = 'custom-decal';
  const size = box.getSize(new THREE.Vector3()), p = box.getCenter(new THREE.Vector3());
  const side = region === 'left' || region === 'right';
  const orientation = side ? new THREE.Euler(0, region === 'left' ? -Math.PI / 2 : Math.PI / 2, 0) : new THREE.Euler(-Math.PI / 2, 0, 0);
  const extent = side ? new THREE.Vector3(size.z * 0.32, size.y * 0.23, size.x * 0.18) : new THREE.Vector3(size.x * 0.55, size.z * 0.13, size.y * (region === 'hood' ? 0.7 : 0.22));
  if (side) { p.x = region === 'left' ? box.min.x : box.max.x; p.y = box.min.y + size.y * 0.44; }
  else { p.y = box.max.y - size.y * (region === 'hood' ? 0.3 : 0.04); if (region === 'hood') p.z = box.max.z - size.z * 0.18; }
  for (const mesh of meshes) {
    const projected = new DecalGeometry(mesh, p, orientation, extent);
    const pos = projected.getAttribute('position'), norm = projected.getAttribute('normal'), uv = projected.getAttribute('uv');
    const points: number[] = [], normals: number[] = [], uvs: number[] = [];
    for (let i = 0; i < pos.count; i += 3) {
      if ([0, 1, 2].some((j) => side ? norm.getX(i + j) * (region === 'left' ? -1 : 1) < 0.45 : norm.getY(i + j) < 0.45)) continue;
      for (let j = 0; j < 3; j++) {
        const n = new THREE.Vector3().fromBufferAttribute(norm, i + j), v = new THREE.Vector3().fromBufferAttribute(pos, i + j).addScaledVector(n, 0.003);
        points.push(v.x, v.y, v.z); normals.push(n.x, n.y, n.z); uvs.push(uv.getX(i + j), uv.getY(i + j));
      }
    }
    projected.dispose();
    if (!points.length) continue;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3)); geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    group.add(new THREE.Mesh(geometry, material));
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
