import * as THREE from 'three';
import { DenoiseMaterial, GradientEquirectTexture, WebGLPathTracer } from 'three-gpu-pathtracer';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { GenerateMeshBVHWorker } from 'three-mesh-bvh/worker';
import { envUrl, SHOTS, type EnvPreset, type ShotId } from './scenes';

// Fotogerçekçi görüntü: three-gpu-pathtracer ile ışık izleme.
// Etkileşimli görüntüleyiciden bağımsız, kendi WebGL bağlamında ve sade bir sahnede çalışır:
// aracın o anki hâlinin kopyası + stüdyo fonu ya da açık hava zemini + HDRI ortam ışığı.

const envCache = new Map<string, Promise<THREE.DataTexture>>();

function loadEnv(e: EnvPreset): Promise<THREE.DataTexture> {
  let p = envCache.get(e.id);
  if (!p) {
    p = new HDRLoader().loadAsync(envUrl(e)).then((t) => {
      t.mapping = THREE.EquirectangularReflectionMapping;
      return t;
    });
    p.catch(() => envCache.delete(e.id));
    envCache.set(e.id, p);
  }
  return p;
}

export interface PathTraceSession {
  canvas: HTMLCanvasElement;
  stop(): void;
}

export interface PathTraceOptions {
  /** Aracın sahnedeki nesnesi (kopyalanır; geometri ve malzemeler paylaşılır) */
  car: THREE.Object3D;
  camera: THREE.PerspectiveCamera;
  width: number;
  height: number;
  maxSamples: number;
  env: EnvPreset;
  shot: ShotId;
  /** Kenar korumalı gürültü giderme (örnek sayısı arttıkça etkisi azalır) */
  denoise: boolean;
  onProgress(samples: number, done: boolean): void;
  onError(e: unknown): void;
}

/** Seçilen açıya göre kamera konumu; 'free' ise etkileşimli kameranın kopyası. */
export function shotCamera(base: THREE.PerspectiveCamera, car: THREE.Object3D, shot: ShotId, aspect: number): THREE.PerspectiveCamera {
  const cam = base.clone();
  cam.aspect = aspect;
  const s = SHOTS.find((x) => x.id === shot);
  if (s && s.id !== 'free') {
    const box = new THREE.Box3().setFromObject(car);
    const size = box.getSize(new THREE.Vector3());
    const len = Math.max(size.x, size.z);
    const target = new THREE.Vector3(0, size.y * 0.42, 0);
    cam.fov = s.fov;
    // Araç kadraja sığsın: dar ekranlarda uzaklaş
    const fit = (len * s.dist * 32) / s.fov / Math.min(1, aspect / 1.4);
    const az = THREE.MathUtils.degToRad(s.az), el = THREE.MathUtils.degToRad(s.el);
    cam.position.set(Math.sin(az) * Math.cos(el) * fit, target.y + Math.sin(el) * fit, Math.cos(az) * Math.cos(el) * fit);
    cam.lookAt(target);
  }
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  return cam;
}

export function startPathTrace(o: PathTraceOptions): PathTraceSession {
  // Worker engellenmişse WebGL kaynakları ayırmadan anlaşılır hata akışına dön.
  const bvhWorker = new GenerateMeshBVHWorker();
  let workerDisposed = false;
  const disposeWorker = () => { if (!workerDisposed) { workerDisposed = true; bvhWorker.dispose(); } };
  const canvas = document.createElement('canvas');
  canvas.className = 'pt-canvas';
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }); }
  catch (error) { disposeWorker(); throw error; }
  renderer.setPixelRatio(1);
  renderer.setSize(o.width, o.height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const car = o.car.clone(true);
  const camera = shotCamera(o.camera, car, o.shot, o.width / o.height);

  const scene = new THREE.Scene();
  scene.add(car);
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  const floorMat = track(new THREE.MeshStandardMaterial({ color: o.env.floor, roughness: o.env.backdrop === 'studio' ? 0.45 : 0.7, metalness: 0 }));
  let background: THREE.Texture | null = null;
  if (o.env.backdrop === 'studio') {
    // Stüdyo fonu (cyclorama): zeminden duvara yumuşakça kıvrılan tek parça yüzey, kameranın karşısına döner
    const floor = new THREE.Mesh(track(cycloramaGeometry()), floorMat);
    floor.rotation.y = Math.atan2(camera.position.x, camera.position.z);
    scene.add(floor);
    const g = track(new GradientEquirectTexture(64));
    g.topColor.set('#07080a');
    g.bottomColor.set(o.env.floor);
    g.exponent = 4;
    g.update();
    background = g;
  } else {
    // Açık hava: geniş zemin, arka planda bulanık gökyüzü (HDRI'nin kendisi)
    const floor = new THREE.Mesh(track(new THREE.CircleGeometry(60, 64)), floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
  }
  if (o.env.softbox > 0) {
    // Tepe ışığı (softbox): aracın üstünde, aşağı bakan geniş alan ışığı — boyada uzun, yumuşak yansıma bandı
    const softbox = new THREE.RectAreaLight('#ffffff', o.env.softbox, 7, 3.2);
    softbox.position.set(0, 5.5, 0);
    softbox.lookAt(0, 0, 0);
    softbox.rotation.z = Math.atan2(camera.position.x, camera.position.z);
    scene.add(softbox);
  }

  const pt = new WebGLPathTracer(renderer);
  // Not: sekme sayıları kütüphane varsayılanlarında bırakıldı. Düşük değerlerde (ör. 6/4) tabakalı örnekleme
  // ilişkili örnekler üretip örnek sayısı artsa da kaybolmayan noktalı/labirent desenli gürültüye yol açıyor.
  pt.tiles.set(2, 2);
  pt.renderDelay = 0;
  pt.fadeDuration = 0;
  pt.minSamples = 1;
  // Derleme sırasında aynı sahne için ikinci, senkron raster shader derlemesi yapma.
  pt.rasterizeScene = false;

  if (o.denoise) {
    const denoise = new FullScreenQuad(new DenoiseMaterial({ map: undefined }));
    const dm = denoise.material as DenoiseMaterial & { map: THREE.Texture; sigma: number; threshold: number; kSigma: number; opacity: number };
    track({ dispose: () => { denoise.dispose(); dm.dispose(); } });
    pt.renderToCanvasCallback = (target, r, quad) => {
      dm.map = target.texture;
      // Az örnekte güçlü, örnek arttıkça hafif filtre
      dm.sigma = THREE.MathUtils.clamp(5 - Math.log2(pt.samples + 1) * 0.6, 1.2, 5);
      dm.threshold = 0.04;
      dm.kSigma = 1;
      dm.opacity = (quad.material as THREE.Material).opacity;
      const autoClear = r.autoClear;
      r.autoClear = false;
      denoise.render(r);
      r.autoClear = autoClear;
    };
  }

  let raf = 0;
  let stopped = false;
  let lastReported = -1;

  const loop = () => {
    if (stopped) return;
    const samples = Math.floor(pt.samples);
    const done = samples >= o.maxSamples;
    if (!done) pt.renderSample();
    // İlk tamamlanan örneği hemen bildir: yazılımsal WebGL'de dört örneği beklemek uzun süre 0 gösterir.
    if (samples !== lastReported && (done || samples === 1 || samples % 4 === 0)) {
      lastReported = samples;
      o.onProgress(samples, done);
    }
    if (!done) raf = requestAnimationFrame(loop);
  };

  pt.setBVHWorker(bvhWorker);
  loadEnv(o.env)
    .then(async (env) => {
      if (stopped) return;
      scene.environment = env;
      scene.environmentIntensity = o.env.intensity;
      if (background) {
        scene.background = background;
      } else {
        scene.background = env;
        scene.backgroundBlurriness = 0.25;
        scene.backgroundIntensity = 0.8;
      }
      // Büyük modelin BVH kurulumu arayüz iş parçacığını kilitlemesin.
      await pt.setSceneAsync(scene, camera);
      if (stopped) return;
      disposeWorker();
      raf = requestAnimationFrame(loop);
    })
    .catch((e) => { if (!stopped) o.onError(e); });

  return {
    canvas,
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      disposeWorker();
      pt.dispose();
      for (const d of disposables) d.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

/**
 * Fon geometrisi: kameraya doğru (+Z) uzanan zemin, arkada (-Z) yarıçaplı kavisle dikey duvara dönüşür.
 * Profil YZ düzleminde çizilip X boyunca uzatılır.
 */
function cycloramaGeometry(): THREE.BufferGeometry {
  const width = 60, front = 30, back = 7, radius = 6, height = 20, arcSteps = 24;
  const profile: [number, number][] = [[front, 0], [-back + radius, 0]];
  for (let i = 1; i <= arcSteps; i++) {
    const a = (i / arcSteps) * (Math.PI / 2);
    profile.push([-back + radius - Math.sin(a) * radius, radius - Math.cos(a) * radius]);
  }
  profile.push([-back, height]);
  const pos: number[] = [], idx: number[] = [], uv: number[] = [];
  profile.forEach(([z, y], i) => {
    pos.push(-width / 2, y, z, width / 2, y, z);
    uv.push(0, i / (profile.length - 1), 1, i / (profile.length - 1));
    if (i > 0) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
