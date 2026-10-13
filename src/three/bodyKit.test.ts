import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildBodyKit } from './bodyKit';

const material = new THREE.MeshStandardMaterial();
function boxMesh(min: [number, number, number], max: [number, number, number]) {
  const size = new THREE.Vector3(...max).sub(new THREE.Vector3(...min));
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
  mesh.position.set((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
  return mesh;
}

describe('gövde kiti yerleşimi', () => {
  // Gövde 0,30 m'den başlar; aracın ortasında daha alçak bir taban plakası vardır.
  const body = new THREE.Group();
  body.add(boxMesh([-0.85, 0.3, -2], [0.85, 1.2, 2]));
  body.add(boxMesh([-0.4, 0.18, -1], [0.4, 0.24, 1]));
  body.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(body);
  const wheels = [-1, 1].flatMap((x) => [-1.3, 1.3].map((z) => ({ center: new THREE.Vector3(x * 0.8, 0.3, z), radius: 0.3, outerX: x * 0.9 })));
  const { parts } = buildBodyKit(box, wheels, material, body);
  const bounds = (key: Parameters<typeof parts.get>[0]) => new THREE.Box3().setFromObject(parts.get(key)!);

  it('arka parçalar tampona yerleşir; tabanın altından geçen ışın aracın ortasına çarpmaz', () => {
    expect(bounds('diffuser').max.z).toBeLessThan(-1.7);
    expect(bounds('exhaustTips').max.z).toBeLessThan(-1.7);
  });
  it('ön tampon uzantıları ön yüzeyde, yan etekler gövdenin yanında', () => {
    expect(bounds('bumper').min.z).toBeGreaterThan(1.7);
    expect(Math.abs(bounds('skirts').max.x)).toBeGreaterThan(0.8);
  });
});
