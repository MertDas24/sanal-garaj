export type RenderQuality = 'auto' | 'low' | 'high';
export function chooseQuality(mode: RenderQuality, cores: number, memory: number, coarse: boolean): boolean {
  return mode === 'high' || mode === 'auto' && !coarse && cores >= 6 && memory >= 4;
}
