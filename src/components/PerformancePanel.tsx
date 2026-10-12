import { useState } from 'react';
import type { ViewerHandle } from '../three/CarViewer';
import { downloadBlob } from '../lib/image';
import { findVehicle } from '../data/catalog';
import { findModel } from '../data/models';
export function PerformancePanel({ viewer, vehicleId }: { viewer: React.RefObject<ViewerHandle | null>; vehicleId: string }) {
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const measure = () => {
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    const model = findModel(findVehicle(vehicleId)?.modelId);
    const glb = performance.getEntriesByType('resource').filter((e) => model && e.name.endsWith(`/${model.file}`)) as PerformanceResourceTiming[];
    const result = { vehicleId, measuredAt: new Date().toISOString(), renderer: viewer.current?.metrics(), heapUsedBytes: memory && Number.isFinite(memory.usedJSHeapSize) ? memory.usedJSHeapSize : null,
      resources: glb.map((e) => ({ file: e.name.split('/').pop(), durationMs: Math.round(e.duration), transferredBytes: e.transferSize, decodedBytes: e.decodedBodySize })),
      note: 'Bu oturumun ölçümü; önbellek ve cihaz sonucu etkiler. Heap, destekleyen tarayıcının bildirdiği yaklaşık JS belleğidir; toplam RAM/GPU belleği değildir. Geometri/doku adetleri GPU bellek baytı değildir. Çizim sayısı son render çağrısına aittir.' };
    setReport(result); return result;
  };
  return <details className="panel__section"><summary>Performans ölçümü ve rapor</summary><p className="muted small">Seçilen modelin indirme süresi ve renderer kaynak adetleri. Sonuç bu cihazdaki oturuma aittir.</p><button className="btn btn--small" onClick={measure}>Bu oturumu ölç</button>{report && <pre className="metrics-report">{JSON.stringify(report, null, 2)}</pre>}<button className="btn btn--small" onClick={() => downloadBlob(new Blob([JSON.stringify(measure(), null, 2)], { type: 'application/json' }), 'sanal-garaj-performans.json')}>Ölçüm JSON indir</button></details>;
}
