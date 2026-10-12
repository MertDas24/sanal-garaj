import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { projectDecal } from './workshopGeometry';

describe('kaplama projektörünün üçgen elemesi', () => {
  it.each([false, true])('kesilen yüzey ve UV değerleri korunur (indeksiz: %s)', (nonIndexed) => {
    const box = new THREE.BoxGeometry(4, 2, 7, 12, 8, 16);
    const geometry = nonIndexed ? box.toNonIndexed() : box;
    const mesh = new THREE.Mesh(geometry); mesh.position.set(0.3, 0.7, -0.2); mesh.rotation.y = 0.3; mesh.scale.set(1.1, 0.8, 1); mesh.updateMatrixWorld();
    const position = new THREE.Vector3(0.2, 1.5, 0.4), orientation = new THREE.Euler(-Math.PI / 2, 0, 0.2), size = new THREE.Vector3(0.8, 3, 1.2);
    const index = geometry.index, sourcePositions = geometry.getAttribute('position').array.slice();
    const baseline = new DecalGeometry(mesh, position, orientation, size), optimized = projectDecal(mesh, position, orientation, size);
    expect(baseline.getAttribute('position').count).toBeGreaterThan(0);
    for (const name of ['position', 'normal', 'uv']) expect(Array.from(optimized.getAttribute(name).array)).toEqual(Array.from(baseline.getAttribute(name).array));
    expect(geometry.index).toBe(index); expect(geometry.getAttribute('position').array).toEqual(sourcePositions);
    baseline.dispose(); optimized.dispose(); geometry.dispose(); if (nonIndexed) box.dispose();
  });
  it('üç köşesi dışarıda olsa bile kutuyu kesen üçgeni korur', () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([-3, -3, 0, 3, -3, 0, 0, 3, 0], 3)); geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry), position = new THREE.Vector3(), orientation = new THREE.Euler(), size = new THREE.Vector3(1, 1, 1);
    const result = projectDecal(mesh, position, orientation, size);
    expect(result.getAttribute('position').count).toBeGreaterThan(0); result.dispose(); geometry.dispose();
  });
});
