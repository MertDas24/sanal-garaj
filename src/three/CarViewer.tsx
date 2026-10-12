import { Component, Suspense, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, MeshReflectorMaterial, OrbitControls, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { ModelFeatures } from '../data/models';
import type { Design } from '../lib/design';
import { createCarRuntime, type CarRuntime } from './carRuntime';

export interface ViewerHandle {
  resetCamera(): void;
  /** Mevcut kamera açısından PNG veri adresi */
  capture(): string | null;
  /** Işık izleme için aracın o anki nesnesi, kamera ve görüntü boyutu */
  snapshot(): { car: THREE.Object3D; camera: THREE.PerspectiveCamera; width: number; height: number } | null;
}

export interface ViewerProps {
  url: string;
  features: ModelFeatures;
  triangles: number;
  design: Design;
  compare: { before: Design; split: number } | null;
  onReady(info: { features: ModelFeatures; originalPaint: string; originalRim: string | null }): void;
  onError(err: Error): void;
}

// Ortam ışığı: Poly Haven "Autoshop 01" (CC0, Oliksiy Yakovlyev) — sitenin kendisinden yüklenir
const HDRI = `${import.meta.env.BASE_URL}env/autoshop_01_1k.hdr`;

/** Güçlü cihazlarda yansıtıcı zemin; dokunmatik/küçük ekranlarda daha hafif zemin. */
function highQuality(): boolean {
  if (typeof window === 'undefined') return false;
  return !window.matchMedia('(pointer: coarse)').matches && window.innerWidth >= 900;
}

export const CarViewer = forwardRef<ViewerHandle, ViewerProps>(function CarViewer(props, ref) {
  const hq = useMemo(() => highQuality(), []);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const invalidateRef = useRef<() => void>(() => {});
  const stateRef = useRef<{ scene: THREE.Scene; camera: THREE.Camera } | null>(null);

  useImperativeHandle(ref, () => ({
    resetCamera() {
      controlsRef.current?.reset();
      invalidateRef.current();
    },
    snapshot() {
      const st = stateRef.current;
      const car = st?.scene.getObjectByName('car');
      const canvas = glRef.current?.domElement;
      if (!st || !car || !canvas) return null;
      return { car, camera: st.camera as THREE.PerspectiveCamera, width: canvas.clientWidth, height: canvas.clientHeight };
    },
    capture() {
      try {
        return glRef.current?.domElement.toDataURL('image/png') ?? null;
      } catch {
        return null;
      }
    },
  }));

  return (
    <Canvas
      className="viewer-canvas"
      shadows
      dpr={hq ? [1, 2] : [1, 1.5]}
      frameloop="demand"
      gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }}
      camera={{ fov: 35, near: 0.1, far: 100, position: [5, 2, 5] }}
      onCreated={({ gl, invalidate, scene, camera }) => {
        glRef.current = gl;
        stateRef.current = { scene, camera };
        invalidateRef.current = invalidate;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
      aria-label="Aracın etkileşimli 3D görünümü. Sürükleyerek döndürün, tekerlek veya iki parmakla yakınlaştırın."
      role="img"
    >
      <color attach="background" args={['#101216']} />
      <fog attach="fog" args={['#101216', 14, 30]} />
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0005}
      />
      <Environment files={HDRI} environmentIntensity={1.1} />
      <mesh rotation-x={-Math.PI / 2} position-y={-0.002} receiveShadow>
        <circleGeometry args={[14, 64]} />
        {hq ? (
          <MeshReflectorMaterial
            color="#15171b"
            roughness={0.85}
            metalness={0.1}
            blur={[400, 120]}
            resolution={512}
            mixBlur={1}
            mixStrength={1.6}
            mirror={0.4}
            depthScale={0.6}
            minDepthThreshold={0.6}
            maxDepthThreshold={1.2}
          />
        ) : (
          <meshStandardMaterial color="#17191e" roughness={0.9} metalness={0} />
        )}
      </mesh>
      <gridHelper args={[28, 28, '#272a31', '#1d2026']} position-y={0.001} />
      <ContactShadows position={[0, 0.003, 0]} scale={12} far={2.5} blur={2.4} opacity={0.75} resolution={512} frames={Infinity} />
      <ModelErrorBoundary onError={props.onError}>
        <Suspense fallback={null}>
          <Car {...props} controlsRef={controlsRef} />
        </Suspense>
      </ModelErrorBoundary>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.12}
        maxPolarAngle={Math.PI / 2 - 0.04}
        minPolarAngle={0.15}
      />
    </Canvas>
  );
});

function Car({
  url, features, triangles, design, compare, onReady, controlsRef,
}: ViewerProps & { controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const gltf = useGLTF(url, false, true);
  const { camera, invalidate } = useThree();
  const runtime = useMemo<CarRuntime>(() => createCarRuntime(gltf.scene, features, triangles), [gltf, features, triangles]);

  useEffect(() => {
    const size = new THREE.Box3().setFromObject(runtime.object).getSize(new THREE.Vector3());
    const len = Math.max(size.x, size.z);
    const target = new THREE.Vector3(0, size.y * 0.42, 0);
    // Dar (dikey) ekranlarda aracın tamamı görünsün diye kamerayı uzaklaştır
    const aspect = (camera as THREE.PerspectiveCamera).aspect || 1.5;
    const k = aspect < 1.3 ? Math.min(2, (1.3 / aspect) ** 0.75) : 1;
    camera.position.set(len * 1.1 * k, len * 0.42 * k, len * 1.2 * k);
    camera.lookAt(target);
    const c = controlsRef.current;
    if (c) {
      c.target.copy(target);
      c.minDistance = len * 0.55;
      c.maxDistance = len * 2.4 * k;
      c.update();
      c.saveState();
    }
    onReady({ features: runtime.features, originalPaint: runtime.originalPaint, originalRim: runtime.originalRim });
    invalidate();
    return () => {
      runtime.dispose();
    };
    // onReady kasıtlı olarak bağımlılık değil: yalnızca model değiştiğinde çağrılır
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtime]);

  useEffect(() => {
    // StrictMode'daki sahte unmount/mount döngüsünde temizlik iptal edilir
    window.clearTimeout(pendingDispose.get(url));
    return () => { pendingDispose.set(url, window.setTimeout(() => disposeGltf(gltf.scene, url), 0)); };
  }, [gltf, url]);

  useEffect(() => { invalidate(); }, [design, compare, invalidate]);

  // Önce/sonra karşılaştırması: aynı kamera ile ekranın iki yarısı farklı ayarlarla çizilir
  useFrame(({ gl, scene, camera: cam, size }) => {
    if (!compare) {
      runtime.apply(design);
      gl.render(scene, cam);
      return;
    }
    const sx = Math.round(size.width * compare.split);
    gl.setScissorTest(true);
    runtime.apply(compare.before);
    gl.setScissor(0, 0, sx, size.height);
    gl.render(scene, cam);
    runtime.apply(design);
    gl.setScissor(sx, 0, size.width - sx, size.height);
    gl.render(scene, cam);
    gl.setScissorTest(false);
  }, 1);

  return <primitive object={runtime.object} />;
}

const pendingDispose = new Map<string, number>();

/** Model sayfadan çıkınca GPU kaynaklarını ve glTF önbelleğini temizler. */
function disposeGltf(scene: THREE.Object3D, url: string) {
  pendingDispose.delete(url);
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry.dispose();
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
      for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
      mat.dispose();
    }
  });
  useGLTF.clear(url);
}

class ModelErrorBoundary extends Component<{ onError(e: Error): void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
