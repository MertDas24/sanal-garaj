import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { hasWebGL } from '../lib/webgl';
import { NoWebGL } from '../components/NoWebGL';

// Kullanıcının kendi .glb dosyasını yalnızca bu tarayıcıda görüntüler. Dosya hiçbir yere gönderilmez.
// Güvenlik ve uygulanabilirlik sınırları:
//  - yalnızca tek dosyalı .glb (harici dosya isteyen .gltf desteklenmez), en fazla 50 MB
//  - dosya içinden harici adreslere istek atılmaz (yalnızca gömülü/blob/data kaynaklar)
//  - Draco / KTX2 sıkıştırması desteklenmez (çözücüler harici sunucudan yüklenmek zorunda kalırdı)

const MAX_BYTES = 50 * 1024 * 1024;

interface Loaded { scene: THREE.Group; name: string; materials: THREE.MeshStandardMaterial[]; triangles: number }

export default function CustomModelPage() {
  const [model, setModel] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paintIdx, setPaintIdx] = useState<number>(-1);
  const [color, setColor] = useState('#b3121b');
  const originals = useRef(new Map<THREE.Material, THREE.Color>());

  useEffect(() => () => { if (model) disposeScene(model.scene); }, [model]);

  const onFile = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!/\.glb$/i.test(file.name)) { setError('Yalnızca .glb dosyaları desteklenir. .gltf dosyalarını tek bir .glb olarak dışa aktarın.'); return; }
    if (file.size > MAX_BYTES) { setError('Dosya 50 MB’den büyük olamaz.'); return; }
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      if (new TextDecoder().decode(new Uint8Array(buf, 0, 4)) !== 'glTF') throw new Error('GLB başlığı geçersiz');
      const manager = new THREE.LoadingManager();
      manager.setURLModifier((url) => (/^(blob:|data:)/.test(url) ? url : 'data:,engellendi'));
      const loader = new GLTFLoader(manager);
      loader.setMeshoptDecoder(MeshoptDecoder);
      const gltf = await loader.parseAsync(buf, '');
      const scene = gltf.scene;
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const k = 4.4 / Math.max(size.x, size.y, size.z, 1e-6);
      scene.scale.setScalar(k);
      const c = box.getCenter(new THREE.Vector3());
      scene.position.set(-c.x * k, -box.min.y * k, -c.z * k);
      const mats = new Set<THREE.MeshStandardMaterial>();
      let tris = 0;
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        m.castShadow = true;
        tris += (m.geometry.index?.count ?? m.geometry.attributes.position.count) / 3;
        for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
          if ((mat as THREE.MeshStandardMaterial).color) mats.add(mat as THREE.MeshStandardMaterial);
        }
      });
      originals.current = new Map([...mats].map((m) => [m, m.color.clone()]));
      setModel({ scene, name: file.name, materials: [...mats], triangles: Math.round(tris) });
      setPaintIdx(-1);
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      setError(
        /draco|ktx2|basisu/i.test(msg)
          ? 'Bu dosya Draco/KTX2 sıkıştırması kullanıyor; bu sıkıştırma türleri desteklenmiyor.'
          : 'Model açılamadı. Dosya bozuk, harici dosyalara bağlı veya desteklenmeyen bir özellik kullanıyor olabilir.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!model) return;
    model.materials.forEach((m, i) => m.color.copy(i === paintIdx ? new THREE.Color(color) : originals.current.get(m)!));
  }, [model, paintIdx, color]);

  const webgl = useMemo(() => hasWebGL(), []);
  if (!webgl) return <NoWebGL />;

  return (
    <section className="page">
      <h1>Kendi 3D modelini görüntüle</h1>
      <p className="muted">
        Bilgisayarınızdaki bir <strong>.glb</strong> dosyasını açıp döndürebilir ve seçtiğiniz bir malzemenin rengini
        değiştirebilirsiniz. Dosya <strong>sunucuya yüklenmez</strong>, yalnızca bu tarayıcıda açılır ve sayfadan
        çıkınca bellekten silinir.
      </p>
      <details className="limits">
        <summary>Destek sınırları</summary>
        <ul className="small">
          <li>Tek dosyalı .glb, en fazla 50 MB. Harici doku/bin dosyası isteyen .gltf desteklenmez.</li>
          <li>Draco ve KTX2 sıkıştırması desteklenmez; meshopt sıkıştırması desteklenir.</li>
          <li>Jant, yükseklik ve aero parçaları gibi araç düzenlemeleri yalnızca katalogdaki hazırlanmış modellerde vardır.</li>
          <li>Hangi malzemenin gövde boyası olduğunu modelden bilemeyiz; listeden siz seçersiniz.</li>
        </ul>
      </details>

      <div className="custom__layout">
        <div className="viewer viewer--custom">
          {model ? (
            <Canvas shadows dpr={[1, 2]} camera={{ fov: 35, position: [6, 2.6, 6.5] }} aria-label="Yüklenen modelin 3D görünümü" role="img">
              <color attach="background" args={['#101216']} />
              <hemisphereLight args={['#d9e2ff', '#1a1c20', 0.7]} />
              <directionalLight position={[4, 8, 5]} intensity={1.5} castShadow />
              <Environment resolution={256} frames={1}>
                <Lightformer form="rect" intensity={2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
                <Lightformer form="rect" intensity={1} position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
              </Environment>
              <mesh rotation-x={-Math.PI / 2} receiveShadow>
                <circleGeometry args={[12, 64]} />
                <meshStandardMaterial color="#17191e" roughness={0.9} />
              </mesh>
              <primitive object={model.scene} />
              <OrbitControls makeDefault enablePan={false} target={[0, 0.9, 0]} maxPolarAngle={Math.PI / 2 - 0.04} />
            </Canvas>
          ) : (
            <label className="dropzone">
              <input type="file" accept=".glb,model/gltf-binary" onChange={(e) => onFile(e.target.files?.[0])} />
              <strong>{loading ? 'Açılıyor…' : '.glb dosyası seç'}</strong>
              <span className="muted small">En fazla 50 MB</span>
            </label>
          )}
        </div>
        <div className="panel">
          {error && <p className="error" role="alert">{error}</p>}
          {model ? (
            <>
              <section className="panel__section">
                <h2 className="panel__title" translate="no">{model.name}</h2>
                <p className="muted small">{model.triangles.toLocaleString('tr-TR')} üçgen · {model.materials.length} malzeme</p>
              </section>
              <section className="panel__section">
                <h2 className="panel__title">Boyanacak malzeme</h2>
                <label className="field">
                  <span className="sr-only">Malzeme</span>
                  <select value={paintIdx} onChange={(e) => setPaintIdx(Number(e.target.value))}>
                    <option value={-1}>Seçilmedi (orijinal renkler)</option>
                    {model.materials.map((m, i) => <option key={m.uuid} value={i} translate={m.name ? 'no' : undefined}>{m.name || `Malzeme ${i + 1}`}</option>)}
                  </select>
                </label>
                <label className="color-input">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} disabled={paintIdx < 0} />
                  <span>Renk <code>{color.toUpperCase()}</code></span>
                </label>
              </section>
              <label className="btn file-btn">
                Başka dosya aç
                <input type="file" accept=".glb,model/gltf-binary" onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
            </>
          ) : (
            <p className="muted small">Bir .glb dosyası seçtiğinizde ayarlar burada görünecek.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function disposeScene(scene: THREE.Object3D) {
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry.dispose();
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
      for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
      mat.dispose();
    }
  });
}
