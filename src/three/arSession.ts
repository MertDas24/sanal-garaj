import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface ArSessionOptions {
  /** exportClone ile hazırlanmış araç (metre ölçeği, zemin y=0, ön +Z) */
  car: THREE.Object3D;
  /** Oturum boyunca kamera görüntüsünün üstünde gösterilen arayüz kökü */
  overlay: HTMLElement;
  onStatus(message: string): void;
  onEnd(): void;
}

export interface ArSessionHandle {
  rotate(degrees: number): void;
  end(): void;
}

/**
 * WebXR "immersive-ar" oturumu: zemin bulunur, dokunulan yere araç gerçek boyutunda yerleştirilir.
 * Kullanıcı etkileşimi içinde çağrılmalıdır (tarayıcı izin ister).
 */
export async function startArSession({ car, overlay, onStatus, onEnd }: ArSessionOptions): Promise<ArSessionHandle> {
  if (!navigator.xr) throw new Error('Bu tarayıcı WebXR desteklemiyor.');
  const session = await navigator.xr.requestSession('immersive-ar', {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: overlay },
  });

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envTarget = pmrem.fromScene(room, 0.04);
  scene.environment = envTarget.texture;
  scene.add(new THREE.HemisphereLight('#ffffff', '#555555', 1));
  const sun = new THREE.DirectionalLight('#ffffff', 1.5); sun.position.set(2, 6, 3); scene.add(sun);

  const camera = new THREE.PerspectiveCamera();
  const holder = new THREE.Group();
  holder.add(car); holder.visible = false; scene.add(holder);

  const ringGeometry = new THREE.RingGeometry(0.22, 0.28, 40).rotateX(-Math.PI / 2);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: '#35ddb1' });
  const reticle = new THREE.Mesh(ringGeometry, ringMaterial);
  reticle.matrixAutoUpdate = false; reticle.visible = false; scene.add(reticle);

  let hitSource: XRHitTestSource | undefined;
  let ended = false;
  // Arayüz düğmelerine dokunmak aracı taşımasın
  const keepUi = (event: Event) => event.preventDefault();
  overlay.addEventListener('beforexrselect', keepUi);
  const cleanup = () => {
    if (ended) return;
    ended = true;
    renderer.setAnimationLoop(null);
    overlay.removeEventListener('beforexrselect', keepUi);
    hitSource?.cancel();
    holder.remove(car);
    ringGeometry.dispose(); ringMaterial.dispose(); envTarget.dispose(); pmrem.dispose(); room.dispose();
    renderer.dispose();
    onEnd();
  };
  session.addEventListener('end', cleanup);

  try {
    await renderer.xr.setSession(session);
    const viewer = await session.requestReferenceSpace('viewer');
    hitSource = await session.requestHitTestSource?.({ space: viewer });
    if (!hitSource) throw new Error('Zemin algılama başlatılamadı.');
  } catch (error) {
    await session.end().catch(() => {});
    throw error;
  }
  onStatus('Telefonu yavaşça gezdirerek zemini tarayın.');

  let foundOnce = false;
  renderer.setAnimationLoop((_, frame?: XRFrame) => {
    const space = renderer.xr.getReferenceSpace();
    if (frame && hitSource && space) {
      const pose = frame.getHitTestResults(hitSource)[0]?.getPose(space);
      reticle.visible = !!pose;
      if (pose) {
        reticle.matrix.fromArray(pose.transform.matrix);
        if (!foundOnce) { foundOnce = true; onStatus('Zemin bulundu. Aracı koymak için halkaya dokunun.'); }
      }
    }
    renderer.render(scene, camera);
  });

  session.addEventListener('select', () => {
    if (!reticle.visible) return;
    const position = new THREE.Vector3();
    reticle.matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3());
    holder.position.copy(position);
    if (!holder.visible) {
      // Aracın önü kullanıcıya dönük yerleşir
      const view = renderer.xr.getCamera().position;
      holder.rotation.y = Math.atan2(view.x - position.x, view.z - position.z);
      holder.visible = true;
    }
    onStatus('Araç gerçek boyutunda yerleştirildi. Taşımak için başka bir noktaya dokunun.');
  });

  return {
    rotate(degrees) { holder.rotation.y += THREE.MathUtils.degToRad(degrees); },
    end() { session.end().catch(cleanup); },
  };
}
