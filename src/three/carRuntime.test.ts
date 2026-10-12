import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createCarRuntime } from './carRuntime';
import { defaultDesign } from '../lib/design';

function fixture(tireRadius = 0.3, triangles = 0, nonIndexed = false) {
  const source = new THREE.Group();
  const root = new THREE.Group(); root.name = 'CG_root'; source.add(root);
  const body = new THREE.Group(); body.name = 'CG_body'; root.add(body);
  const paint = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 4), new THREE.MeshStandardMaterial({ name: 'CG_paint', color: '#ff0000' }));
  paint.position.y = 0.8; body.add(paint);
  if (nonIndexed) { const original = paint.geometry; paint.geometry = original.toNonIndexed(); original.dispose(); }
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 1), new THREE.MeshStandardMaterial({ name: 'CG_glass', color: '#123456' }));
  glass.position.y = 1.3; body.add(glass);
  for (const x of [-0.9, 0.9]) for (const z of [-1.3, 1.3]) {
    const wheel = new THREE.Group(); wheel.name = `CG_wheel_${x}_${z}`; wheel.position.set(x, 0.3, z); root.add(wheel);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius, tireRadius, 0.2, 16), new THREE.MeshStandardMaterial({ name: 'CG_tire', color: '#111111' }));
    tire.rotation.z = Math.PI / 2; wheel.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 16), new THREE.MeshStandardMaterial({ name: 'CG_rim', color: '#aaaaaa' }));
    rim.rotation.z = Math.PI / 2; rim.position.x = Math.sign(x) * 0.105; wheel.add(rim);
  }
  const features = { paint: true, rimColor: true, rimStyle: true, rideHeight: true, spoiler: false, frontLip: false, windowTint: true, caliperColor: false } as const;
  return { source, runtime: createCarRuntime(source, features, triangles), paint };
}

describe('3D atölye geometrisi', () => {
  it('runtime temizliği kaynak modelin paylaşılan geometrisini silmez', () => {
    const { runtime, paint } = fixture(); let disposed = 0;
    paint.geometry.addEventListener('dispose', () => disposed++);
    runtime.dispose(); expect(disposed).toBe(0);
  });
  it('indeksiz float gövde yumuşatılırken kaynak geometrisi silinmez', () => {
    const { runtime, paint } = fixture(0.3, 50000, true); let disposed = 0;
    paint.geometry.addEventListener('dispose', () => disposed++);
    runtime.dispose(); expect(disposed).toBe(0);
  });
  it('özel kaplama önbelleği sınırlıdır; tekrar çizim ve yükseklik geometrileri çoğaltmaz', () => {
    const { runtime } = fixture(), base = defaultDesign(runtime.originalPaint, false);
    const design = { ...base, wrap: 'double' as const, wrapWidth: 70, heightMm: -20 };
    runtime.apply(design);
    const group = runtime.object.getObjectByName('body-addons')!;
    const first = group.children.filter((o) => o.name === 'wrap-double').at(-1)!;
    runtime.apply({ ...design, heightMm: 20 }); expect(group.children).toContain(first);
    for (let width = 40; width < 100; width += 5) runtime.apply({ ...design, wrapWidth: width });
    expect(group.children.filter((o) => o.name === 'wrap-double').length).toBeLessThanOrEqual(5);
    runtime.dispose();
  });
  it('boya ve kaplama camı/lastiği değiştirmez; kaynak model korunur', () => {
    const { source, runtime, paint } = fixture();
    const base = defaultDesign(runtime.originalPaint, false);
    expect(runtime.features.stance).toBe(true);
    runtime.apply({ ...base, paint: '#00ff00', wrap: 'double', wrapColor: '#ffffff' });
    const wrap = runtime.object.getObjectByName('wrap-double')!;
    expect(wrap.visible).toBe(true); expect(wrap.children.length).toBeGreaterThan(0);
    expect(paint.material.color.getHexString()).toBe('ff0000');
    runtime.object.traverse((o) => {
      if (!(o instanceof THREE.Mesh) || Array.isArray(o.material)) return;
      if (o.material.name === 'CG_glass') expect((o.material as THREE.MeshStandardMaterial).color.getHexString()).toBe('0d1217');
      if (o.material.name === 'CG_tire') expect((o.material as THREE.MeshStandardMaterial).color.getHexString()).toBe('111111');
    });
    expect(source.getObjectByName('CG_wheel_0.9_1.3')?.parent?.name).toBe('CG_root');
    runtime.dispose();
  });
  it('kamber, genişlik ve eklenti jant aynı merkezi izler ve sıfırlanır', () => {
    const { runtime } = fixture();
    const base = defaultDesign(runtime.originalPaint, false);
    runtime.apply({ ...base, rimStyle: 'mesh', frontCamber: -4, rearCamber: -2, wheelWidth: 110, offsetMm: 20, rimScale: 110 });
    const wheel = runtime.object.getObjectByName('CG_wheel_0.9_1.3')!;
    const pivot = wheel.parent!;
    expect(pivot.position.x).toBeCloseTo(0.92); expect(pivot.rotation.z).toBeCloseTo(THREE.MathUtils.degToRad(4));
    const rims = runtime.object.getObjectByName('rims')!;
    const mounts = rims.children[0].children;
    expect(mounts.some((m) => m.position.distanceTo(pivot.position) < 0.001 && m.rotation.z === pivot.rotation.z)).toBe(true);
    runtime.apply(base);
    expect(pivot.position.x).toBeCloseTo(0.9); expect(pivot.rotation.z).toBeCloseTo(0); expect(pivot.scale.x).toBe(1);
    expect(rims.children[0].visible).toBe(false); runtime.dispose();
  });
  it('tekrar uygulama yeni kaplama geometrisi üretmez; aydınlatma sıfırlanır', () => {
    const { runtime } = fixture(); const base = defaultDesign(runtime.originalPaint, false);
    runtime.apply({ ...base, wrap: 'hood', underglow: true });
    const wrap = runtime.object.getObjectByName('wrap-hood');
    for (let i = 0; i < 10; i++) runtime.apply({ ...base, wrap: 'hood', underglow: true });
    expect(runtime.object.getObjectByName('wrap-hood')).toBe(wrap);
    expect(runtime.object.getObjectByName('underglow')?.visible).toBe(true);
    runtime.apply(base); expect(runtime.object.getObjectByName('underglow')?.visible).toBe(false); runtime.dispose();
  });
  it('yere oturmayan tekerlek ölçümüyle kamber veya eklenti jant sunmaz', () => {
    const { runtime } = fixture(0.43);
    expect(runtime.features.stance).toBe(false); expect(runtime.features.rimStyle).toBe(false);
    runtime.apply({ ...defaultDesign(runtime.originalPaint, false), frontCamber: -8, rimStyle: 'mesh' });
    expect(runtime.object.getObjectByName('rims')?.children).toHaveLength(0); runtime.dispose();
  });
});
