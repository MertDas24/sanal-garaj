import { useEffect, useState } from 'react';
interface Report { measuredAt: string; browser: string; method: string; rows: { vehicleId: string; modelReadyMs: number; heapUsedBytes?: number | null; renderer: { geometries: number; textures: number } }[] }
export function BenchmarkSummary() {
  const [report, setReport] = useState<Report | null>(null), [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}benchmarks/workshop.json`, { signal: controller.signal }).then(async (r) => {
      if (!r.ok) throw new Error('Ölçüm dosyası yok'); const data = await r.json() as Report;
      if (!Array.isArray(data.rows) || !data.rows.every((row) => Number.isFinite(row.modelReadyMs) && row.renderer && Number.isFinite(row.renderer.geometries))) throw new Error('Ölçüm geçersiz');
      setReport(data);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, []);
  if (!report) return <p className="muted small" role="status">{failed ? 'Ölçüm kaydı yüklenemedi.' : 'Ölçüm kaydı yükleniyor…'}</p>;
  return <div><p className="muted small">{new Date(report.measuredAt).toLocaleDateString('tr-TR')} · Chrome {report.browser}</p><div className="table-wrap"><table><caption>Yerel geliştirme ölçümü — araç başına tek örnek</caption><thead><tr><th scope="col">Araç</th><th scope="col">Panel hazır</th><th scope="col">JS heap</th><th scope="col">Geometri</th><th scope="col">Doku</th></tr></thead><tbody>{report.rows.map((row) => <tr key={row.vehicleId}><th scope="row" translate="no">{row.vehicleId}</th><td>{(row.modelReadyMs / 1000).toFixed(2)} sn</td><td>{row.heapUsedBytes ? `${(row.heapUsedBytes / 1048576).toFixed(1)} MiB` : 'Bildirilmedi'}</td><td>{row.renderer.geometries}</td><td>{row.renderer.textures}</td></tr>)}</tbody></table></div><p className="muted small">{report.method} Heap, tarayıcının bildirdiği yaklaşık JS belleğidir; toplam RAM/GPU belleği değildir.</p></div>;
}
