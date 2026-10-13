import * as THREE from 'three';

// Artırılmış gerçeklik (AR) ve 3D dosya dışa aktarımı.
//  - Android / Chrome: WebXR "immersive-ar" + zemin algılama (hit-test), bkz. arSession.ts
//  - iPhone / iPad Safari: AR Quick Look; tasarım cihazda USDZ dosyasına dönüştürülür
// Hiçbir dosya sunucuya gönderilmez; dönüşüm tarayıcıda yapılır.

export type ArMode = 'webxr' | 'quicklook' | 'none';

export async function detectArMode(): Promise<ArMode> {
  try {
    if (await navigator.xr?.isSessionSupported('immersive-ar')) return 'webxr';
  } catch { /* izin politikası veya desteklenmeyen tarayıcı */ }
  const anchor = document.createElement('a');
  if (anchor.relList?.supports?.('ar')) return 'quicklook';
  return 'none';
}

/** Aracın o anki (tasarım uygulanmış) hâlinin, sahne dönüşümünden bağımsız kopyası. Malzeme/geometri paylaşılır. */
export function exportClone(car: THREE.Object3D, attribution?: Record<string, string>): THREE.Object3D {
  const copy = car.clone(true);
  copy.position.set(0, 0, 0); copy.rotation.set(0, 0, 0); copy.scale.set(1, 1, 1);
  copy.visible = true;
  copy.userData = attribution ? { ...attribution } : {};
  // Çalışma zamanı yardımcı verileri dosyaya yazılmasın
  copy.traverse((o) => { if (o !== copy) o.userData = {}; });
  // Dokular, saydamlık taşımıyorsa JPEG olarak yazılır: PNG'ye göre çok daha hızlı kodlanır, Quick Look da destekler.
  // Canlı sahnenin malzemeleri değişmesin diye kopyalanır (görüntü verisi paylaşılır).
  const materials = new Map<THREE.Material, THREE.Material>();
  copy.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const convert = (source: THREE.Material) => {
      let material = materials.get(source);
      if (!material) {
        material = source.clone();
        const record = material as unknown as Record<string, unknown>;
        for (const [key, value] of Object.entries(record)) {
          if (!(value instanceof THREE.Texture)) continue;
          const texture = value.clone();
          const alpha = key === 'map' && (material.transparent || material.alphaTest > 0) || key === 'alphaMap';
          texture.userData = { ...texture.userData, mimeType: alpha ? 'image/png' : 'image/jpeg' };
          record[key] = texture;
        }
        materials.set(source, material);
      }
      return material;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material);
  });
  copy.updateMatrixWorld(true);
  return copy;
}

export async function toGlb(object: THREE.Object3D): Promise<Blob> {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
  const result = await new GLTFExporter().parseAsync(object, { binary: true, onlyVisible: true, maxTextureSize: 2048 });
  if (!(result instanceof ArrayBuffer)) throw new Error('GLB oluşturulamadı.');
  return new Blob([result], { type: 'model/gltf-binary' });
}

export async function toUsdz(object: THREE.Object3D): Promise<Blob> {
  const { USDZExporter } = await import('three/examples/jsm/exporters/USDZExporter.js');
  const data = await new USDZExporter().parseAsync(object, {
    quickLookCompatible: true,
    maxTextureSize: 1024,
    ar: { anchoring: { type: 'plane' }, planeAnchoring: { alignment: 'horizontal' } },
  });
  return new Blob([data as Uint8Array<ArrayBuffer>], { type: 'model/vnd.usdz+zip' });
}
