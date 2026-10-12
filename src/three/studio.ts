import * as THREE from 'three';

/** Görüntüyü yeniden render eder; ekran görüntüsünü büyütmez. Ana render hedefi ve kamera geri yüklenir. */
export function renderStudio(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, width: number, height: number): string {
  const target = new THREE.WebGLRenderTarget(width, height, { samples: 4, type: THREE.UnsignedByteType });
  target.texture.colorSpace = THREE.SRGBColorSpace;
  const oldTarget = gl.getRenderTarget(), oldAspect = camera.aspect;
  const oldPosition = camera.position.clone();
  const viewport = gl.getViewport(new THREE.Vector4()), scissor = gl.getScissor(new THREE.Vector4()), scissorTest = gl.getScissorTest();
  try {
    camera.aspect = width / height;
    const car = scene.getObjectByName('car');
    if (car && camera.aspect < oldAspect) { const center = new THREE.Box3().setFromObject(car).getCenter(new THREE.Vector3()); camera.position.sub(center).multiplyScalar(oldAspect / camera.aspect).add(center); }
    // Render hedefi kendi piksel viewport'unu kurar; setViewport burada ekran DPR'sini tekrar çarpar.
    camera.updateProjectionMatrix(); gl.setScissorTest(false); gl.setRenderTarget(target); gl.render(scene, camera);
    const pixels = new Uint8Array(width * height * 4); gl.readRenderTargetPixels(target, 0, 0, width, height, pixels);
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d')!; const image = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) image.data.set(pixels.subarray((height - y - 1) * width * 4, (height - y) * width * 4), y * width * 4);
    ctx.putImageData(image, 0, 0); return canvas.toDataURL('image/png');
  } finally {
    gl.setRenderTarget(oldTarget); gl.setViewport(viewport); gl.setScissor(scissor); gl.setScissorTest(scissorTest); camera.aspect = oldAspect; camera.position.copy(oldPosition); camera.updateProjectionMatrix(); target.dispose();
  }
}

export function videoSupported(): boolean {
  return typeof MediaRecorder !== 'undefined' && ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].some((t) => MediaRecorder.isTypeSupported(t));
}
export async function recordTurntable(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, target: THREE.Vector3, caption: string, attribution: string, signal: AbortSignal): Promise<Blob> {
  if (!videoSupported()) throw new Error('Bu tarayıcı WebM video kaydını desteklemiyor.');
  const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 600;
  const ctx = canvas.getContext('2d')!, stream = canvas.captureStream(24);
  const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t))!;
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
  const chunks: Blob[] = []; recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const stopped = new Promise<Blob>((resolve, reject) => { recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType })); recorder.onerror = () => reject(new Error('Video kaydı başarısız.')); });
  const position = camera.position.clone(), quaternion = camera.quaternion.clone();
  const offset = position.clone().sub(target), axis = new THREE.Vector3(0, 1, 0), start = performance.now();
  recorder.start();
  let frameId = 0;
  let abort: () => void = () => {};
  try {
    await new Promise<void>((resolve, reject) => {
      abort = () => { cancelAnimationFrame(frameId); reject(new Error('Video kaydı iptal edildi.')); };
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) { abort(); return; }
      const frame = () => {
        try {
          const progress = Math.min(1, (performance.now() - start) / 6000);
          camera.position.copy(offset).applyAxisAngle(axis, progress * Math.PI * 2).add(target); camera.lookAt(target);
          gl.render(scene, camera); ctx.fillStyle = '#101216'; ctx.fillRect(0, 0, 960, 600);
          const scale = Math.min(960 / gl.domElement.width, 540 / gl.domElement.height), w = gl.domElement.width * scale, h = gl.domElement.height * scale;
          ctx.drawImage(gl.domElement, (960 - w) / 2, (540 - h) / 2, w, h);
          ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.fillText(caption, 18, 564, 920); ctx.font = '12px sans-serif'; ctx.fillText(attribution, 18, 586, 920);
          if (progress === 1) resolve(); else frameId = requestAnimationFrame(frame);
        } catch (e) { reject(e); }
      }; frame();
    });
    recorder.stop(); return await stopped;
  } finally {
    signal.removeEventListener('abort', abort); cancelAnimationFrame(frameId);
    if (recorder.state !== 'inactive') recorder.stop(); stream.getTracks().forEach((t) => t.stop()); camera.position.copy(position); camera.quaternion.copy(quaternion); if (!signal.aborted) gl.render(scene, camera);
  }
}
