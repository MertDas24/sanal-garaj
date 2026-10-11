import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { RimStyle } from '../lib/design';

// Uygulamanın ürettiği basit eklenti parçaları (spoiler, ön lip, jant tasarımları).
// Konumları aracın gövdesine ışın atılarak bulunur; uygun yüzey bulunamazsa parça üretilmez (null)
// ve düzenleyicide o seçenek kapatılır.

const ray = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0);
const BACK = new THREE.Vector3(0, 0, -1);

function castDown(body: THREE.Object3D, x: number, z: number, top: number) {
  ray.set(new THREE.Vector3(x, top, z), DOWN);
  const hit = ray.intersectObject(body, true)[0];
  if (!hit) return null;
  const n = hit.face?.normal.clone().transformDirection(hit.object.matrixWorld) ?? new THREE.Vector3(0, 1, 0);
  return { y: hit.point.y, ny: Math.abs(n.y) };
}

/** Bagaj kapağının arka kenarına yerleştirilen kanat tipi spoiler. */
export function buildSpoiler(body: THREE.Object3D, box: THREE.Box3, mat: THREE.Material): THREE.Group | null {
  const len = box.max.z - box.min.z;
  const width = box.max.x - box.min.x;
  const top = box.max.y + 1;
  // Arkadan öne doğru tara: yatay bir bagaj yüzeyi ara (çatıdan alçak olmalı)
  let found: { z: number; y: number } | null = null;
  for (let t = 0.03; t <= 0.2; t += 0.01) {
    const z = box.min.z + t * len;
    const hits = [-0.25, 0, 0.25].map((k) => castDown(body, k * width, z, top));
    if (hits.some((h) => !h)) continue;
    const ys = hits.map((h) => h!.y);
    const flat = hits.every((h) => h!.ny > 0.75) && Math.max(...ys) - Math.min(...ys) < 0.06;
    if (flat && ys[1] < box.max.y - 0.2) { found = { z: z + 0.04 * len, y: ys[1] }; break; }
  }
  if (!found) return null;
  const deck = castDown(body, 0, found.z, top);
  const y = deck ? deck.y : found.y;

  const span = width * 0.78;
  const chord = Math.min(0.24, len * 0.05);
  const standH = 0.1;
  const g = new THREE.Group();
  g.name = 'addon-spoiler';
  const wing = new THREE.Mesh(new THREE.BoxGeometry(span, 0.022, chord), mat);
  wing.position.set(0, y + standH, found.z);
  wing.rotation.x = -0.12;
  g.add(wing);
  for (const s of [-1, 1]) {
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.03, standH, chord * 0.55), mat);
    stand.position.set(s * span * 0.32, y + standH / 2, found.z);
    g.add(stand);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.07, chord * 1.1), mat);
    plate.position.set(s * span / 2, y + standH + 0.015, found.z);
    g.add(plate);
  }
  g.traverse((m) => { if ((m as THREE.Mesh).isMesh) (m as THREE.Mesh).castShadow = true; });
  return g;
}

/** Ön tamponun altına yerleştirilen ince splitter / lip. */
export function buildFrontLip(body: THREE.Object3D, box: THREE.Box3, mat: THREE.Material): THREE.Group | null {
  const len = box.max.z - box.min.z;
  const width = box.max.x - box.min.x;
  // Tamponun önünde birkaç x konumunda, aşağıdan yukarı tarayarak ön yüzeye çarpan en alçak ışını bul.
  // Izgara/hava girişi açıklıklarından geçip içeri giden ışınlar (ön %15'in gerisinde) sayılmaz.
  const samples: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i <= 8; i++) {
    const x = (-0.35 + (0.7 * i) / 8) * width;
    for (let y = 0.03; y < 0.55; y += 0.01) {
      ray.set(new THREE.Vector3(x, y, box.max.z + 1), BACK);
      const hit = ray.intersectObject(body, true)[0];
      if (hit && hit.point.z > box.max.z - len * 0.15) { samples.push({ x, y, z: hit.point.z }); break; }
    }
  }
  if (samples.length < 6) return null;
  const median = (v: number[]) => [...v].sort((p, q) => p - q)[Math.floor(v.length / 2)];
  const lipY = median(samples.map((p) => p.y));
  if (lipY < 0.05) return null;
  const near = samples.filter((p) => p.y <= lipY + 0.06);
  const lipZ = median(near.map((p) => p.z));
  const half = Math.min(width * 0.45, Math.max(...near.map((p) => Math.abs(p.x))) * 1.12);
  if (half < width * 0.25) return null;

  const g = new THREE.Group();
  g.name = 'addon-lip';
  const depth = 0.1;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(half * 2, 0.018, depth), mat);
  plate.position.set(0, lipY - 0.008, lipZ - depth / 2 + 0.04);
  g.add(plate);
  for (const s of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.035, depth * 0.8), mat);
    fin.position.set(s * half, lipY + 0.006, plate.position.z);
    g.add(fin);
  }
  return g;
}

/** Jant tasarımı: +X yönüne bakan, YZ düzleminde bir jant yüzü. */
export function buildRim(style: RimStyle, r: number, mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.name = `rim-${style}`;
  const parts: THREE.BufferGeometry[] = [];
  const faceDepth = Math.max(0.012, r * 0.06);

  // Dış çember (jant dudağı)
  const lipRing = new THREE.TorusGeometry(r * 0.95, r * 0.05, 8, 40);
  lipRing.rotateY(Math.PI / 2);
  parts.push(lipRing);
  // İç namlu (jantın arkasını kapatır)
  const barrel = new THREE.CylinderGeometry(r * 0.93, r * 0.93, r * 0.5, 32, 1, true);
  barrel.rotateZ(Math.PI / 2);
  barrel.translate(-r * 0.25, 0, 0);
  parts.push(barrel);
  // Göbek
  const hub = new THREE.CylinderGeometry(r * 0.2, r * 0.22, faceDepth * 1.6, 20);
  hub.rotateZ(Math.PI / 2);
  parts.push(hub);

  const spoke = (count: number, w: number, offset = 0) => {
    for (let i = 0; i < count; i++) {
      const a = offset + (i / count) * Math.PI * 2;
      const s = new THREE.BoxGeometry(faceDepth, r * 0.78, w);
      s.translate(0, r * 0.55, 0);
      s.rotateX(a);
      parts.push(s);
    }
  };

  if (style === 'spoke5') {
    spoke(5, r * 0.22);
  } else if (style === 'multi') {
    spoke(10, r * 0.07);
    spoke(10, r * 0.07, Math.PI / 10 + 0.06);
  } else if (style === 'dish') {
    const disc = new THREE.CylinderGeometry(r * 0.9, r * 0.9, faceDepth * 0.6, 40);
    disc.rotateZ(Math.PI / 2);
    disc.translate(-faceDepth * 0.4, 0, 0);
    parts.push(disc);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const bolt = new THREE.CylinderGeometry(r * 0.035, r * 0.035, faceDepth * 1.4, 8);
      bolt.rotateZ(Math.PI / 2);
      bolt.translate(0, Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3);
      parts.push(bolt);
    }
  }

  const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()), false);
  parts.forEach((p) => p.dispose());
  if (merged) {
    merged.computeVertexNormals();
    g.add(new THREE.Mesh(merged, mat));
  }
  return g;
}
