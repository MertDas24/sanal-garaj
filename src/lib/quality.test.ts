import { expect, it } from 'vitest';
import { chooseQuality, isSoftwareRenderer } from './quality';
it('yazılımsal GPU güçlü CPU ipucuna rağmen otomatik yüksek profili kullanmaz', () => {
  expect(chooseQuality('auto', 16, 16, false, true)).toBe(false);
  expect(chooseQuality('auto', 16, 16, false, false)).toBe(true);
  expect(chooseQuality('high', 16, 16, false, true)).toBe(true);
  expect(chooseQuality('low', 16, 16, false, true)).toBe(false);
});
it('bilinen yazılımsal sürücüler algılanır, donanım isimleri yazılımsal sayılmaz', () => {
  for (const name of ['ANGLE (Google, Vulkan SwiftShader Device)', 'llvmpipe (LLVM)', 'softpipe', 'Microsoft Basic Render Driver']) expect(isSoftwareRenderer(name)).toBe(true);
  for (const name of ['ANGLE (Intel, UHD Graphics)', 'NVIDIA GeForce RTX', 'AMD Radeon', '']) expect(isSoftwareRenderer(name)).toBe(false);
});
