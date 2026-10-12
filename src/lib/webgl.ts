let cached: boolean | null = null;

/** Three.js görüntüleyicisinin gerektirdiği WebGL 2 desteğini bir kez sınar. */
export function hasWebGL(): boolean {
  if (cached !== null) return cached;
  try {
    const c = document.createElement('canvas');
    const ctx = c.getContext('webgl2');
    cached = !!ctx;
    (ctx as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}
