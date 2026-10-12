import * as THREE from 'three';
import type { ModelFeatures } from '../data/models';
import type { Design, Finish, RimStyle } from '../lib/design';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildFrontLip, buildRim, buildSpoiler } from './addons';

/** Bu açıdan küçük kenarlar yumuşatılır; daha keskin kenarlar (panel hatları) korunur. */
const CREASE = THREE.MathUtils.degToRad(35);
/** Bu üçgen sayısının altındaki (düşük poligonlu) modellerde boya yüzeyleri yumuşatılır. */
const SMOOTH_BELOW_TRIANGLES = 60_000;

// Derleme betiği her modele şu kanonik adları verir (scripts/build-models.mjs):
//   düğümler:  CG_root > CG_body, CG_wheel_<n>, (CG_part_spoiler)
//   malzemeler: CG_paint, CG_rim, CG_tire, CG_glass
// Boyama yalnızca CG_paint malzemesine uygulanır; cam, lastik ve diğer parçalar değişmez.

export interface CarRuntime {
  object: THREE.Group;
  /** Desteklenen özellikler (model manifesti ∧ çalışma zamanında yerleşim başarısı) */
  features: ModelFeatures;
  originalPaint: string;
  originalRim: string | null;
  apply(d: Design): void;
  dispose(): void;
}

interface WheelInfo {
  center: THREE.Vector3;
  radius: number;
  rimRadius: number;
  outerX: number;
  rimMeshes: THREE.Mesh[];
}

const FINISH_PARAMS: Record<Finish, Partial<THREE.MeshPhysicalMaterialParameters>> = {
  gloss: { roughness: 0.3, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.06 },
  metallic: { roughness: 0.34, metalness: 0.72, clearcoat: 1, clearcoatRoughness: 0.12 },
  matte: { roughness: 0.82, metalness: 0.04, clearcoat: 0, clearcoatRoughness: 1 },
};

const CARBON = new THREE.Color('#16171a');

/**
 * Sıkıştırılmış (KHR_mesh_quantization: normalize int8/int16) köşe verilerini float32'ye açar.
 * Işık izleyicinin hızlandırma yapısı (BVH) yalnızca düz float verilerle güvenilir çalışır.
 */
function dequantize(geom: THREE.BufferGeometry): THREE.BufferGeometry {
  const needs = Object.values(geom.attributes).some(
    (a) => a.normalized || (a as THREE.InterleavedBufferAttribute).isInterleavedBufferAttribute || !(a.array instanceof Float32Array),
  );
  if (!needs) return geom;
  const out = new THREE.BufferGeometry();
  for (const [name, attr] of Object.entries(geom.attributes)) {
    const n = attr.count, size = attr.itemSize;
    const arr = new Float32Array(n * size);
    for (let i = 0; i < n; i++) for (let k = 0; k < size; k++) arr[i * size + k] = attr.getComponent(i, k);
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  if (geom.index) out.setIndex(new THREE.BufferAttribute(new Uint32Array(geom.index.array), 1));
  for (const g of geom.groups) out.addGroup(g.start, g.count, g.materialIndex);
  out.boundingBox = geom.boundingBox;
  out.boundingSphere = geom.boundingSphere;
  return out;
}

export function createCarRuntime(source: THREE.Object3D, features: ModelFeatures, triangles = 0): CarRuntime {
  const object = new THREE.Group();
  object.name = 'car';
  const scene = source.clone(true);
  object.add(scene);
  object.updateMatrixWorld(true);

  const cgRoot = scene.getObjectByName('CG_root');
  const body = scene.getObjectByName('CG_body');
  if (!cgRoot || !body) throw new Error('Model kanonik yapıda değil (CG_root/CG_body yok)');
  const rootScale = cgRoot.scale.y || 1;
  const bodyBaseY = body.position.y;

  const created: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T) => (created.push(x), x);

  // --- Malzemeler ---
  let originalPaint = '#cccccc';
  let originalRim: string | null = null;
  const paintMat = track(new THREE.MeshPhysicalMaterial({ name: 'CG_paint' }));
  const rimMat = track(new THREE.MeshStandardMaterial({ name: 'CG_rim', metalness: 0.7, roughness: 0.32 }));
  const partMat = track(new THREE.MeshPhysicalMaterial({ name: 'CG_part' }));
  // Cam: koyu renkli, yarı saydam, ortamı yansıtan
  const glassMat = track(new THREE.MeshPhysicalMaterial({
    name: 'CG_glass', color: '#0d1217', roughness: 0.03, metalness: 0, transparent: true, opacity: 0.5,
    clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false,
  }));
  const tireClones = new Map<string, THREE.MeshStandardMaterial>();
  const rimOriginal = new Map<THREE.Mesh, THREE.Material>();
  const rimMeshes: THREE.Mesh[] = [];
  const wheelObjects: THREE.Object3D[] = [];
  let paintFound = false;

  scene.traverse((o) => {
    if (o.name.startsWith('CG_wheel_')) wheelObjects.push(o);
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.geometry = track(dequantize(mesh.geometry));
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (Array.isArray(mat)) return;
    if (mat.name === 'CG_paint') {
      if (!paintFound) {
        originalPaint = `#${mat.color.getHexString()}`;
        paintFound = true;
        // Yüzey ayrıntısı veren dokular korunur. Renk dokusu (map) normalde alınmaz; model "keepMap" ile
        // işaretlendiyse (açık tabanlı gövde dokusu) korunur ve seçilen renk dokuyla çarpılır.
        if (mat.normalMap) { paintMat.normalMap = mat.normalMap; paintMat.normalScale.copy(mat.normalScale); }
        if (mat.userData?.keepMap && mat.map) { paintMat.map = mat.map; originalPaint = '#ffffff'; }
        if (mat.aoMap) paintMat.aoMap = mat.aoMap;
      }
      mesh.material = paintMat;
      if (triangles && triangles < SMOOTH_BELOW_TRIANGLES) mesh.geometry = track(toCreasedNormals(mesh.geometry, CREASE));
    } else if (mat.name === 'CG_glass') {
      mesh.material = glassMat;
      mesh.castShadow = false;
      mesh.renderOrder = 2;
    } else if (mat.name === 'CG_tire') {
      let t = tireClones.get(mat.uuid);
      if (!t) {
        t = track(mat.clone());
        t.roughness = Math.max(t.roughness, 0.88);
        t.metalness = 0;
        if (!t.map && t.color.getHSL({ h: 0, s: 0, l: 0 }).l > 0.12) t.color.set('#17181a');
        tireClones.set(mat.uuid, t);
      }
      mesh.material = t;
    } else if (mat.name === 'CG_rim') {
      if (!originalRim) originalRim = `#${mat.color.getHexString()}`;
      rimOriginal.set(mesh, mat);
      rimMeshes.push(mesh);
    }
  });
  rimMat.color.set(originalRim ?? '#c0c0c0');

  const builtinSpoiler = scene.getObjectByName('CG_part_spoiler') ?? null;

  // --- Ölçümler (sahne uzayı: metre, ön +Z, zemin y=0) ---
  object.updateMatrixWorld(true);
  const bodyBox = new THREE.Box3().setFromObject(body);

  // Tekerlekler: aynı merkeze yakın düğümler (ör. ayrı jant + lastik düğümü) tek tekerlekte toplanır
  const clusters: { box: THREE.Box3; objs: THREE.Object3D[] }[] = [];
  for (const w of wheelObjects) {
    const box = new THREE.Box3().setFromObject(w);
    const c = box.getCenter(new THREE.Vector3());
    const hit = clusters.find((k) => k.box.getCenter(new THREE.Vector3()).distanceTo(c) < 0.25);
    if (hit) { hit.box.union(box); hit.objs.push(w); } else clusters.push({ box, objs: [w] });
  }
  const wheels: WheelInfo[] = clusters.map(({ box, objs }) => {
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const myRims = rimMeshes.filter((m) => objs.some((w) => isDescendant(m, w)));
    let rimRadius = Math.max(size.y, size.z) * 0.5 * 0.66;
    if (myRims.length) {
      const rb = new THREE.Box3();
      myRims.forEach((m) => rb.expandByObject(m));
      const rs = rb.getSize(new THREE.Vector3());
      rimRadius = Math.min(rimRadius * 1.25, Math.max(rs.y, rs.z) * 0.5);
    }
    return {
      center,
      radius: Math.max(size.y, size.z) / 2,
      rimRadius,
      outerX: center.x >= 0 ? box.max.x : box.min.x,
      rimMeshes: myRims,
    };
  });

  // --- Ek parçalar ---
  const f: ModelFeatures = { ...features };
  const bodyParts = new THREE.Group();
  bodyParts.name = 'body-addons';
  object.add(bodyParts);

  let spoiler: THREE.Object3D | null = null;
  if (f.spoiler === 'builtin' && !builtinSpoiler) f.spoiler = false;
  if (f.spoiler === 'addon') {
    spoiler = buildSpoiler(body, bodyBox, partMat);
    if (spoiler) bodyParts.add(spoiler);
    else f.spoiler = false;
  }
  let lip: THREE.Object3D | null = null;
  if (f.frontLip === 'addon') {
    lip = buildFrontLip(body, bodyBox, partMat);
    if (lip) bodyParts.add(lip);
    else f.frontLip = false;
  }
  for (const o of [spoiler, lip]) o?.traverse((m) => { if ((m as THREE.Mesh).isMesh) track((m as THREE.Mesh).geometry); });

  if (wheels.length < 4) { f.rideHeight = false; f.rimStyle = false; f.rimColor = false; }
  if (!rimMeshes.length) { f.rimStyle = false; f.rimColor = false; }
  if (!paintFound) f.paint = false;

  // Jant modelleri tembel üretilir
  const rimSets = new Map<RimStyle, THREE.Group>();
  const rimGroup = new THREE.Group();
  rimGroup.name = 'rims';
  object.add(rimGroup);
  const getRimSet = (style: RimStyle) => {
    let set = rimSets.get(style);
    if (!set) {
      set = new THREE.Group();
      for (const w of wheels) {
        const rim = buildRim(style, w.rimRadius, rimMat);
        rim.position.set(w.outerX - Math.sign(w.center.x || 1) * Math.max(0.012, w.radius * 0.04), w.center.y, w.center.z);
        if (w.center.x < 0) rim.rotation.y = Math.PI;
        rim.traverse((m) => { if ((m as THREE.Mesh).isMesh) { track((m as THREE.Mesh).geometry); (m as THREE.Mesh).castShadow = true; } });
        set.add(rim);
      }
      rimSets.set(style, set);
      rimGroup.add(set);
    }
    return set;
  };

  const apply = (d: Design) => {
    if (f.paint) {
      paintMat.color.set(d.paint);
      Object.assign(paintMat, FINISH_PARAMS[d.finish]);
    } else {
      paintMat.color.set(originalPaint);
      Object.assign(paintMat, FINISH_PARAMS.gloss);
    }
    const customRimColor = f.rimColor && d.rimColor ? d.rimColor : null;
    rimMat.color.set(customRimColor ?? originalRim ?? '#c0c0c0');

    const style: RimStyle = f.rimStyle ? d.rimStyle : 'original';
    for (const w of wheels) for (const m of w.rimMeshes) m.visible = style === 'original';
    if (style !== 'original') getRimSet(style);
    rimSets.forEach((set, k) => { set.visible = k === style; });
    // Orijinal jant: renk seçilmediyse modelin kendi (dokulu olabilir) malzemesi, seçildiyse jant rengi
    for (const m of rimMeshes) m.material = customRimColor ? rimMat : rimOriginal.get(m)!;

    const h = f.rideHeight ? d.heightMm / 1000 : 0;
    body.position.y = bodyBaseY + h / rootScale;
    bodyParts.position.y = h;

    if (builtinSpoiler) builtinSpoiler.visible = f.spoiler === 'builtin' ? d.spoiler : true;
    if (spoiler) spoiler.visible = f.spoiler === 'addon' && d.spoiler;
    if (lip) lip.visible = f.frontLip === 'addon' && d.lip;

    if (d.partColor === 'carbon') {
      partMat.color.copy(CARBON);
      Object.assign(partMat, { roughness: 0.45, metalness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    } else {
      partMat.color.copy(paintMat.color);
      Object.assign(partMat, FINISH_PARAMS[f.paint ? d.finish : 'gloss']);
    }
  };

  return {
    object,
    features: f,
    originalPaint,
    originalRim,
    apply,
    // GPU kaynaklarını serbest bırakır; nesne ağacına dokunmaz (React StrictMode'da efekt
    // yeniden çalışırsa three.js kaynakları bir sonraki çizimde otomatik yeniden yükler).
    dispose() {
      for (const c of created) c.dispose();
    },
  };
}

function isDescendant(o: THREE.Object3D, ancestor: THREE.Object3D): boolean {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (p === ancestor) return true;
  return false;
}

export function carDimensions(o: THREE.Object3D): THREE.Vector3 {
  return new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3());
}
