import * as THREE from 'three';

/** Proje içinde üretilen özgün görsel parçalar. OEM parçası veya montaj şablonu değildir. */
export const KIT_MODELS = ['toyota-ae86-trueno-zenki', 'bmw-m3-e30', 'mercedes-c63-amg-w204'];
export type KitPart = 'skirts' | 'diffuser' | 'exhaustTips' | 'fenders' | 'bumper';
export function buildBodyKit(box: THREE.Box3, wheels: { center: THREE.Vector3; radius: number; outerX: number }[], material: THREE.Material, body: THREE.Object3D) {
  const parts = new Map<KitPart, THREE.Group>();
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const chrome = new THREE.MeshStandardMaterial({ color: '#adb3bf', metalness: 1, roughness: 0.2 });
  const dark = new THREE.MeshStandardMaterial({ color: '#111216', roughness: 0.8 });
  const group = (key: KitPart) => { const g = new THREE.Group(); g.name = `kit-${key}`; g.visible = false; parts.set(key, g); return g; };
  const block = (g: THREE.Group, dimensions: number[], position: number[], mat = material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions as [number, number, number]), mat);
    mesh.position.set(...position as [number, number, number]); mesh.castShadow = true; g.add(mesh);
  };
  const front = Math.max(...wheels.map((w) => w.center.z));
  const rear = Math.min(...wheels.map((w) => w.center.z));
  const ground = Math.max(0.13, Math.min(...wheels.map((w) => w.radius)) * 0.5);
  const ray = new THREE.Raycaster();
  const mount = (x: number, z: number, direction: THREE.Vector3) => {
    for (let y = ground + 0.07; y < ground + 0.5; y += 0.025) {
      ray.set(new THREE.Vector3(x, y, z), direction);
      const hit = ray.intersectObject(body, true).find((h) => h.object instanceof THREE.Mesh && !Array.isArray(h.object.material) && h.object.material.name !== 'CG_glass');
      if (hit) return hit.point.clone();
    }
    return null;
  };
  const skirts = group('skirts');
  for (const side of [-1, 1]) {
    const point = mount(center.x + side * (size.x / 2 + 1), (front + rear) / 2, new THREE.Vector3(-side, 0, 0));
    if (point) block(skirts, [0.07, 0.055, front - rear - wheels[0].radius * 1.95], [point.x + side * 0.015, point.y - 0.02, (front + rear) / 2]);
  }
  const rearMount = mount(center.x, box.min.z - 1, new THREE.Vector3(0, 0, 1));
  const diffuser = group('diffuser');
  if (rearMount) {
    block(diffuser, [size.x * 0.68, 0.035, 0.18], [center.x, rearMount.y - 0.035, rearMount.z + 0.045]);
    for (const x of [-0.3, -0.1, 0.1, 0.3]) block(diffuser, [0.012, 0.07, 0.18], [center.x + size.x * x, rearMount.y - 0.055, rearMount.z + 0.045]);
  }
  const bumper = group('bumper');
  for (const side of [-1, 1]) {
    const point = mount(center.x + side * size.x * 0.32, box.max.z + 1, new THREE.Vector3(0, 0, -1));
    if (point) block(bumper, [size.x * 0.19, 0.055, 0.06], [point.x, point.y + 0.015, point.z + 0.015]);
  }
  const exhaust = group('exhaustTips');
  for (const side of [-1, 1]) {
    const point = mount(center.x + side * size.x * 0.32, box.min.z - 1, new THREE.Vector3(0, 0, 1));
    if (!point) continue;
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.18, 24, 1, true), chrome);
    tip.rotation.x = Math.PI / 2; tip.position.set(point.x, point.y - 0.025, point.z - 0.025); exhaust.add(tip);
    const opening = new THREE.Mesh(new THREE.CircleGeometry(0.038, 24), dark);
    opening.rotation.y = Math.PI; opening.position.copy(tip.position); opening.position.z -= 0.091; exhaust.add(opening);
  }
  const fenders = group('fenders');
  for (const wheel of wheels) {
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 21 }, (_, i) => {
      const angle = -0.12 + i / 20 * (Math.PI + 0.24);
      return new THREE.Vector3(wheel.outerX + Math.sign(wheel.center.x) * 0.015,
        wheel.center.y + Math.sin(angle) * (wheel.radius + 0.055), wheel.center.z + Math.cos(angle) * (wheel.radius + 0.055));
    }));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.025, 6, false), material); mesh.castShadow = true; fenders.add(mesh);
  }
  return { parts, materials: [chrome, dark] };
}
