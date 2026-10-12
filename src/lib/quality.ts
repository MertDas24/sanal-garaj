export type RenderQuality = 'auto' | 'low' | 'high';
export function chooseQuality(mode: RenderQuality, cores: number, memory: number, coarse: boolean, softwareRenderer = false): boolean {
  return mode === 'high' || mode === 'auto' && !softwareRenderer && !coarse && cores >= 6 && memory >= 4;
}
export function isSoftwareRenderer(name: string): boolean {
  return /swiftshader|llvmpipe|softpipe|software renderer|microsoft basic render/i.test(name);
}
