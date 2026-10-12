import { Component, useEffect, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as Controls } from 'three-stdlib';
import * as THREE from 'three';
import { engineSpec, turboCount, type EnginePart } from '../lib/engineScene';
import type { PowertrainDesign, PowertrainKey } from '../lib/powertrain';

interface Props {
  plan: PowertrainDesign; vehicleId: string; parts: EnginePart[]; selected: PowertrainKey;
  onSelect(key: PowertrainKey): void; running: boolean; speed: number; cutaway: boolean; exploded: boolean;
  cameraView: 'perspective' | 'top' | 'side'; reset: number; onCanvas(canvas: HTMLCanvasElement): void; onError(message: string): void;
}
const metallic = { metalness: 0.6, roughness: 0.36 };
function Surface({ color = '#8995a3' }: { color?: string }) { return <meshStandardMaterial color={color} {...metallic} />; }

function Part({ part, selected, onSelect, position }: { part: EnginePart; selected: boolean; onSelect(): void; position: [number, number, number] }) {
  const color = selected ? '#35ddb1' : part.changed ? '#edaf59' : '#65798c';
  const size = 1 + part.variant * 0.07;
  return <group name={`engine-part-${part.key}`} position={position} scale={size} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
    <mesh position={[0, -0.25, 0]}><boxGeometry args={[0.72, 0.045, 0.62]} /><meshStandardMaterial color={selected ? '#267965' : '#202d3b'} /></mesh>
    {part.shape === 'box' && <mesh><boxGeometry args={[0.5, 0.3, 0.4]} /><Surface color={color} /></mesh>}
    {part.shape === 'tank' && <><mesh><cylinderGeometry args={[0.18, 0.18, 0.5, 16]} /><Surface color={color} /></mesh><mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.07, 0.07, 0.12, 12]} /><Surface /></mesh></>}
    {(part.shape === 'disc' || part.shape === 'gear') && <><mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.27, 0.27, 0.15, part.shape === 'gear' ? 12 : 24]} /><Surface color={color} /></mesh><mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]}><torusGeometry args={[0.15, 0.04, 8, 20]} /><Surface /></mesh></>}
    {part.shape === 'fins' && <><mesh><boxGeometry args={[0.58, 0.38, 0.16]} /><Surface color={color} /></mesh>{Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[-0.245 + i * 0.07, 0, 0.095]}><boxGeometry args={[0.025, 0.35, 0.03]} /><Surface color="#bec9cf" /></mesh>)}</>}
    {part.shape === 'pipe' && <><mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.09, 0.09, 0.6, 12]} /><Surface color={color} /></mesh><mesh position={[0.28, 0.12, 0]}><cylinderGeometry args={[0.09, 0.09, 0.3, 12]} /><Surface color={color} /></mesh></>}
    {part.shape === 'turbo' && <><mesh><torusGeometry args={[0.2, 0.09, 10, 24]} /><Surface color={color} /></mesh><mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.1, 0.16, 0.22, 12]} /><Surface color="#b6c9d5" /></mesh></>}
  </group>;
}

function Assembly({ plan, vehicleId, running, speed, cutaway, exploded, onSelect, selected }: Props) {
  const spec = engineSpec(plan, vehicleId), motion = useRef<THREE.Group>(null), phase = useRef(0);
  const length = spec.cylinders / spec.banks * 0.29 + 0.18;
  const color = (key: PowertrainKey, stock = '#94a8b7') => selected === key ? '#35ddb1' : plan[key] === 'stock' ? stock : '#edaf59';
  const { invalidate } = useThree();
  useEffect(() => { invalidate(); }, [plan, running, cutaway, exploded, invalidate]);
  useFrame((_, dt) => {
    if (!running || document.hidden || !motion.current) return;
    phase.current += Math.min(dt, 0.05) * speed * 2;
    motion.current.traverse((child) => {
      if (child.userData.piston) child.position.y = 0.1 + Math.cos(phase.current + child.userData.phase) * (plan.displacement === 'stroke' || plan.displacement === 'both' ? 0.2 : 0.14);
      if (child.userData.spin) child.rotation.z = phase.current;
    });
    invalidate();
  });
  const click = (key: PowertrainKey) => (event: { stopPropagation(): void }) => { event.stopPropagation(); onSelect(key); };
  return <group name={`engine-layout-${spec.layout}`} position={[0, 0.1, 0]}>
    <mesh position={[0, -0.5, 0]}><boxGeometry args={[2.1, 0.12, 2.8]} /><Surface color={selected === 'layout' ? '#265850' : '#263749'} /></mesh>
    {spec.layout === 'unknown' && <mesh onClick={click('layout')}><boxGeometry args={[1.1, 0.6, 1.6]} /><meshStandardMaterial color="#607385" wireframe /></mesh>}
    {spec.cylinders > 0 && <>
      {!cutaway && <mesh onClick={click('layout')} position={[0, 0.2, 0]}><boxGeometry args={[spec.banks === 2 ? 1.3 : 0.7, 0.65, spec.cylinders / spec.banks * 0.29]} /><Surface color="#3d5163" /></mesh>}
      <group ref={motion}>
        <group userData={{ spin: true }} onClick={click('crank')}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.085, 0.085, length, 16]} /><Surface color={color('crank')} /></mesh>
          {Array.from({ length: spec.cylinders / spec.banks }, (_, i) => <mesh key={i} position={[0.12, 0, (i - (spec.cylinders / spec.banks - 1) / 2) * 0.29]}><boxGeometry args={[0.3, 0.18, 0.1]} /><Surface /></mesh>)}
        </group>
        {Array.from({ length: spec.cylinders }, (_, i) => {
          const bank = spec.banks === 2 ? i % 2 * 2 - 1 : 0, row = Math.floor(i / spec.banks), perBank = spec.cylinders / spec.banks;
          return <group key={i} position={[bank * 0.38, 0.1, (row - (perBank - 1) / 2) * 0.29]} rotation={[0, 0, -bank * Math.PI / 6]} userData={{ piston: true, phase: i * Math.PI }}>
            <mesh position={[0, 0.3, 0]} onClick={click('pistons')}><cylinderGeometry args={[plan.displacement === 'bore' || plan.displacement === 'both' ? 0.125 : 0.105, 0.105, 0.15, 16]} /><Surface color={color('pistons', '#c0cbd3')} /></mesh>
            <mesh position={[0, 0.1, 0]} onClick={click('rods')}><boxGeometry args={[0.065, 0.28, plan.rods === 'stock' ? 0.065 : 0.09]} /><Surface color={color('rods')} /></mesh>
          </group>;
        })}
      </group>
      {Array.from({ length: spec.cylinders }, (_, i) => {
        const bank = spec.banks === 2 ? i % 2 * 2 - 1 : 0, row = Math.floor(i / spec.banks);
        return <group key={i} position={[bank * 0.38, 0, (row - (spec.cylinders / spec.banks - 1) / 2) * 0.29]} rotation={[0, 0, -bank * Math.PI / 6]}>
          <mesh position={[0, 0.4, 0]} onClick={click('displacement')}><cylinderGeometry args={[0.135, 0.135, 0.42, 16, 1, true]} /><meshStandardMaterial color="#78a1b9" transparent opacity={cutaway ? 0.16 : 0.85} side={THREE.DoubleSide} {...metallic} /></mesh>
          {[0.2, 0.62].map((y) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.135, 0.014, 8, 20]} /><Surface /></mesh>)}
          {[-1, 1].map((side) => <mesh key={side} position={[side * 0.06, exploded ? 1.4 : 0.84, 0]} onClick={click('valves')}><cylinderGeometry args={[0.023, 0.045, 0.14, 10]} /><Surface color={color('valves')} /></mesh>)}
        </group>;
      })}
      {Array.from({ length: spec.banks }, (_, i) => <mesh key={i} position={[spec.banks === 2 ? (i * 2 - 1) * 0.35 : 0, exploded ? 1.2 : 0.75, 0]} onClick={click('head')}><boxGeometry args={[0.55, 0.18, spec.cylinders / spec.banks * 0.3]} /><meshStandardMaterial color={color('head')} transparent opacity={cutaway ? 0.3 : 1} {...metallic} /></mesh>)}
      {Array.from({ length: spec.banks }, (_, i) => <group key={i} position={[spec.banks === 2 ? (i * 2 - 1) * 0.35 : 0, exploded ? 1.6 : 0.94, 0]} onClick={click('cams')}>{[-0.13, 0.13].map((x) => <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.035, 0.035, length, 12]} /><Surface color={color('cams')} /></mesh>)}</group>)}
    </>}
    {spec.layout === 'rotary' && <group ref={motion}><mesh onClick={click('layout')}><torusGeometry args={[0.55, 0.1, 12, 32]} /><Surface /></mesh><group userData={{ spin: true }}><mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.4, 0.4, 0.22, 3]} /><Surface color="#e7b35f" /></mesh></group></group>}
    {spec.layout === 'electric' && <>
      <group ref={motion}>{Array.from({ length: spec.motors }, (_, i) => <group key={i} position={[(i - (spec.motors - 1) / 2) * 0.75, 0.2, 0]} onClick={click('electricMotor')}><mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.3, 0.3, 0.7, 20]} /><Surface color="#347b94" /></mesh><group position={[0, 0, 0.48]} userData={{ spin: true }}><mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.08, 0.08, 0.3, 12]} /><Surface color="#e7b35f" /></mesh>{[0, 1, 2].map((blade) => <mesh key={blade} rotation={[0, 0, blade * Math.PI * 2 / 3]}><boxGeometry args={[0.34, 0.045, 0.06]} /><Surface color="#e7b35f" /></mesh>)}</group></group>)}</group>
      <group position={[0, exploded ? -1 : -0.2, 1.05]} onClick={click('battery')}>{Array.from({ length: plan.battery === 'capacity' ? 18 : 12 }, (_, i) => <mesh key={i} position={[(i % 6 - 2.5) * 0.23, 0, Math.floor(i / 6) * 0.17]}><boxGeometry args={[0.2, 0.15, 0.14]} /><Surface color={plan.battery === 'stock' ? '#576d83' : '#4cbeb2'} /></mesh>)}</group>
    </>}
    {Array.from({ length: turboCount(plan) }, (_, i) => <group key={i} position={[(i === 0 ? 1 : -1) * (spec.banks === 2 ? 1.35 : 1), 0.4, 0.3]} onClick={click('aspiration')}><mesh><torusGeometry args={[0.21, 0.1, 12, 24]} /><Surface color="#edaf59" /></mesh><mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.13, 0.08, 0.2, 16]} /><Surface /></mesh></group>)}
    {['supercharger', 'twincharged'].includes(plan.aspiration) && spec.layout !== 'electric' && <mesh position={[0, exploded ? 1.8 : 1, 0]} onClick={click('aspiration')}><boxGeometry args={[0.48, 0.25, 0.75]} /><Surface color="#edaf59" /></mesh>}
  </group>;
}

function Scene(props: Props) {
  const { cameraView, reset, onCanvas, onError } = props;
  const controls = useRef<Controls>(null), { camera, gl, invalidate, size } = useThree();
  const fit = Math.max(1, size.height / Math.max(size.width, 1) * 1.25);
  useEffect(() => {
    camera.position.set(...({ perspective: [2.7, 2, 3.5], top: [0, 8.3, -1.09], side: [4.5, 1.6, 0.1] }[cameraView] as [number, number, number])).multiplyScalar(fit);
    controls.current?.target.set(0, 0.2, cameraView === 'top' ? -1.1 : -0.5); controls.current?.update(); invalidate();
  }, [cameraView, reset, camera, invalidate, fit]);
  useEffect(() => {
    onCanvas(gl.domElement);
    const lost = (event: Event) => { event.preventDefault(); if (gl.domElement.isConnected) onError('Motor görünümünün grafik bağlamı kaybedildi. Atölyeyi kapatıp yeniden açın.'); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    const key = (event: KeyboardEvent) => {
      if (!controls.current || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', '=', 'Home'].includes(event.key)) return;
      event.preventDefault(); const target = controls.current.target;
      const s = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
      if (event.key === 'ArrowLeft') s.theta -= 0.15; if (event.key === 'ArrowRight') s.theta += 0.15;
      if (event.key === 'ArrowUp') s.phi -= 0.1; if (event.key === 'ArrowDown') s.phi += 0.1;
      if (event.key === '+' || event.key === '=') s.radius *= 0.9; if (event.key === '-') s.radius *= 1.1;
      if (event.key === 'Home') { camera.position.set(2.7, 2, 3.5).multiplyScalar(fit); target.set(0, 0.2, -0.5); }
      else { s.phi = THREE.MathUtils.clamp(s.phi, 0.05, Math.PI / 2); s.radius = THREE.MathUtils.clamp(s.radius, 3, 12); camera.position.setFromSpherical(s).add(target); }
      controls.current.update(); invalidate();
    };
    gl.domElement.addEventListener('keydown', key);
    return () => { gl.domElement.removeEventListener('webglcontextlost', lost); gl.domElement.removeEventListener('keydown', key); };
  }, [gl, camera, invalidate, onCanvas, onError, fit]);
  const parts = props.parts.filter((p) => p.key !== 'layout' && p.enabled);
  return <>
    <color attach="background" args={['#101c2a']} /><ambientLight intensity={1.4} /><directionalLight position={[4, 7, 5]} intensity={3} /><directionalLight position={[-4, 2, -3]} intensity={1.5} color="#83bfff" />
    <Assembly {...props} />
    {parts.map((part, i) => <Part key={part.key} part={part} selected={props.selected === part.key} onSelect={() => props.onSelect(part.key)} position={[(i % 4 - 1.5) * 1.05, -0.15, -2 - Math.floor(i / 4) * 0.8]} />)}
    <gridHelper args={[12, 24, '#38516a', '#1c3146']} position={[0, -0.6, 0]} />
    <OrbitControls ref={controls} makeDefault enablePan={false} minDistance={3} maxDistance={12} maxPolarAngle={Math.PI / 2} />
  </>;
}
class EngineBoundary extends Component<{ children: ReactNode; onError(message: string): void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError('Motor 3D görünümü başlatılamadı. Atölyeyi kapatıp yeniden açın.'); }
  render() { return this.state.failed ? null : this.props.children; }
}
export default function EngineViewer(props: Props) {
  return <EngineBoundary onError={props.onError}><Canvas frameloop="demand" dpr={[1, 1.25]} camera={{ position: [2.7, 2, 3.5], fov: 35 }} gl={{ antialias: true, preserveDrawingBuffer: true }} tabIndex={0} aria-label="Şematik motorun 3D görünümü. Ok tuşlarıyla döndürün, artı eksi ile yakınlaştırın, Home ile sıfırlayın." role="img"><Scene {...props} /></Canvas></EngineBoundary>;
}
