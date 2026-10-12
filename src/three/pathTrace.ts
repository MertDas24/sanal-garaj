import * as THREE from 'three';
import { GradientEquirectTexture, WebGLPathTracer } from 'three-gpu-pathtracer';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

// Fotogerçekçi görüntü: three-gpu-pathtracer ile ışık izleme.
// Etkileşimli görüntüleyiciden bağımsız, kendi WebGL bağlamında ve sade bir sahnede çalışır:
// aracın o anki hâlinin kopyası + cilalı stüdyo zemini + HDRI ortam ışığı (arka planda bulanık).

const HDRI = `${import.meta.env.BASE_URL}env/autoshop_01_1k.hdr`;
let envPromise: Promise<THREE.DataTexture> | null = null;

function loadEnv(): Promise<THREE.DataTexture> {
  envPromise ??= new HDRLoader().loadAsync(HDRI).then((t) => {
    t.mapping = THREE.EquirectangularReflectionMapping;
    return t;
  });
  envPromise.catch(() => { envPromise = null; });
  return envPromise;
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
  onProgress(samples: number, done: boolean): void;
  onError(e: unknown): void;
}

export function startPathTrace(o: PathTraceOptions): PathTraceSession {
  const canvas = document.createElement('canvas');
  canvas.className = 'pt-canvas';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(o.width, o.height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  // Stüdyo fonu (cyclorama): zeminden duvara yumuşakça kıvrılan tek parça yüzey, kameranın karşısına döner
  const floorGeo = cycloramaGeometry();
  const floorMat = new THREE.MeshStandardMaterial({ color: '#2b2e33', roughness: 0.45, metalness: 0 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.y = Math.atan2(o.camera.position.x, o.camera.position.z);
  scene.add(floor);
  // Tepe ışığı (softbox): aracın üstünde, aşağı bakan geniş alan ışığı — boyada uzun, yumuşak yansıma bandı
  const softbox = new THREE.RectAreaLight('#ffffff', 5, 7, 3.2);
  softbox.position.set(0, 5.5, 0);
  softbox.lookAt(0, 0, 0);
  softbox.rotation.z = floor.rotation.y;
  scene.add(softbox);

  const car = o.car.clone(true);
  scene.add(car);

  const camera = o.camera.clone();
  camera.aspect = o.width / o.height;
  camera.updateProjectionMatrix();

  const background = new GradientEquirectTexture(64);
  background.topColor.set('#07080a');
  background.bottomColor.set('#3a3e44');
  background.exponent = 4;
  background.update();

  const pt = new WebGLPathTracer(renderer);
  // Not: sekme sayıları kütüphane varsayılanlarında bırakıldı. Düşük değerlerde (ör. 6/4) tabakalı örnekleme
  // ilişkili örnekler üretip örnek sayısı artsa da kaybolmayan noktalı/labirent desenli gürültüye yol açıyor.
  pt.tiles.set(2, 2);
  pt.renderDelay = 0;
  pt.fadeDuration = 0;
  pt.minSamples = 1;

  let raf = 0;
  let stopped = false;
  let lastReported = -1;

  const loop = () => {
    if (stopped) return;
    const samples = Math.floor(pt.samples);
    const done = samples >= o.maxSamples;
    if (!done) pt.renderSample();
    if (samples !== lastReported && (done || samples % 4 === 0)) {
      lastReported = samples;
      o.onProgress(samples, done);
    }
    if (!done) raf = requestAnimationFrame(loop);
  };

  loadEnv()
    .then((env) => {
      if (stopped) return;
      scene.environment = env;
      scene.environmentIntensity = 1.3;
      // Stüdyo arka planı: ufukta zeminin uzak tonuna, yukarıda koyuya geçen degrade (sert ufuk çizgisi yok)
      scene.background = background;
      pt.setScene(scene, camera);
      raf = requestAnimationFrame(loop);
    })
    .catch((e) => o.onError(e));

  return {
    canvas,
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      pt.dispose();
      background.dispose();
      floorGeo.dispose();
      floorMat.dispose();
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
