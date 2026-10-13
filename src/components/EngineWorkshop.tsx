import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { engineParts, engineSpec } from '../lib/engineScene';
import { POWERTRAIN_FIELDS, POWERTRAIN_GROUPS, POWERTRAIN_KEYS, isPowertrainFieldEnabled, sanitizePowertrain, type PowertrainDesign, type PowertrainKey } from '../lib/powertrain';
import { captionImage, downloadBlob, slugify } from '../lib/image';
import { tr } from '../i18n';
const EngineViewer = lazy(() => import('../three/EngineViewer'));

export default function EngineWorkshop({ plan, vehicleId, title, onChange }: { plan: PowertrainDesign; vehicleId: string; title: string; onChange(plan: PowertrainDesign): void }) {
  const [selected, setSelected] = useState<PowertrainKey>('layout');
  const [running, setRunning] = useState(false), [speed, setSpeed] = useState(2);
  const [cutaway, setCutaway] = useState(true), [exploded, setExploded] = useState(false);
  const [cameraView, setCameraView] = useState<'perspective' | 'top' | 'side'>('perspective');
  const [reset, setReset] = useState(0), [error, setError] = useState(''), [downloadStatus, setDownloadStatus] = useState('');
  const [canvasReady, setCanvasReady] = useState(false);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const onCanvas = useCallback((element: HTMLCanvasElement) => { canvas.current = element; setCanvasReady(true); }, []);
  const spec = useMemo(() => engineSpec(plan, vehicleId), [plan, vehicleId]);
  const parts = useMemo(() => engineParts(plan), [plan]);
  const effectiveSelected = isPowertrainFieldEnabled(selected, plan) ? selected : 'layout';
  const group = effectiveSelected === 'layout' && spec.layout === 'electric' ? 'Elektrikli dönüşüm' : POWERTRAIN_FIELDS[effectiveSelected].group;
  const visibleParts = parts.filter((p) => p.group === group);
  const current = parts.find((p) => p.key === effectiveSelected)!;
  useEffect(() => {
    const stop = () => { if (document.hidden) setRunning(false); };
    document.addEventListener('visibilitychange', stop);
    return () => { document.removeEventListener('visibilitychange', stop); canvas.current = null; };
  }, []);
  const effectiveRunning = running && !error && spec.layout !== 'unknown';
  const download = async () => {
    try {
      if (!canvas.current || error) throw new Error('Görünüm hazır değil.');
      const blob = await captionImage(canvas.current.toDataURL('image/png'), `${title} · ${tr('Şematik motor')}`, tr('Prosedürel geometri: Sanal Garaj / Codex · MIT. Gerçek araç motoru, montaj veya güç simülasyonu değildir.'));
      downloadBlob(blob, `${slugify(title)}-motor-semasi.png`); setDownloadStatus('Motor şeması indirildi.');
    } catch { setDownloadStatus('Motor görüntüsü alınamadı.'); }
  };
  return <>
    <p className="model-note small">Canlı, prosedürel 3D şema. Parçalar eğitim ve görsel planlama için üretilmiştir; bu aracın gerçek motor modeli, motor bölmesi yerleşimi veya güç/tork simülasyonu değildir. Parça kartları temsili ölçek kullanır.</p>
    <p className="engine-layout-label" role="status">{spec.label}</p><p className="muted small">{spec.basis}</p>
    <div className="engine-toolbar">
      <button className="btn btn--small" aria-pressed={effectiveRunning} disabled={!!error || spec.layout === 'unknown'} onClick={() => setRunning((v) => !v)}>{effectiveRunning ? 'Animasyonu durdur' : 'Motor hareketini göster'}</button>
      <label className="field"><span>Animasyon hızı (gerçek devir değil)</span><input aria-label="Motor animasyon hızı" type="range" min={1} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} /></label>
      <button className="btn btn--small" aria-pressed={cutaway} onClick={() => setCutaway((v) => !v)}>İç parçaları göster</button>
      <button className="btn btn--small" aria-pressed={exploded} onClick={() => setExploded((v) => !v)}>Ayrıştırılmış görünüm</button>
      <label className="field"><span>Motor kamerası</span><select aria-label="Motor kamerası" value={cameraView} onChange={(e) => setCameraView(e.target.value as typeof cameraView)}><option value="perspective">Genel</option><option value="top">Üst</option><option value="side">Yan</option></select></label>
      <button className="btn btn--small" onClick={() => setReset((n) => n + 1)}>Motor kamerasını sıfırla</button>
    </div>
    <div className="engine-canvas" data-layout={spec.layout} data-cylinders={spec.cylinders} data-motors={spec.motors} data-running={effectiveRunning}>
      {error ? <p role="alert">{error}</p> : <Suspense fallback={<p role="status">Motor atölyesi hazırlanıyor…</p>}><EngineViewer plan={plan} vehicleId={vehicleId} parts={visibleParts} selected={effectiveSelected} onSelect={setSelected} running={effectiveRunning} speed={speed} cutaway={cutaway} exploded={exploded} cameraView={cameraView} reset={reset} onCanvas={onCanvas} onError={setError} /></Suspense>}
    </div>
    <div className="engine-groups" role="group" aria-label="Motor görsel sistemleri">
      {POWERTRAIN_GROUPS.map((g) => <button className="btn btn--small" key={g} aria-pressed={g === group} disabled={!parts.some((p) => p.group === g && p.enabled)} onClick={() => setSelected(parts.find((p) => p.group === g && p.enabled)!.key)}>{g}</button>)}
    </div>
    <div className="engine-part-controls">
      <label className="field"><span>İncelenen motor parçası</span><select aria-label="İncelenen motor parçası" value={effectiveSelected} onChange={(e) => setSelected(e.target.value as PowertrainKey)}>{parts.map((p) => <option key={p.key} value={p.key} disabled={!p.enabled}>{p.label}{p.changed ? ' · değiştirildi' : ''}{!p.enabled ? ' · bu motor düzeninde kapalı' : ''}</option>)}</select></label>
      <label className="field"><span>{current.label}</span><select aria-label={`Motor 3D: ${current.label}`} value={plan[effectiveSelected]} onChange={(e) => onChange(sanitizePowertrain({ ...plan, [effectiveSelected]: e.target.value }))}>{Object.entries(POWERTRAIN_FIELDS[effectiveSelected].options).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <p className="small">{current.valueLabel} · {current.changed ? 'Altın: değiştirilmiş parça.' : 'Gri: fabrika / değişiklik yok.'} Yeşil: incelenen parça.</p>
    </div>
    <div className="engine-parts" aria-label="Görünümdeki parça seçimleri">{visibleParts.filter((p) => p.enabled).map((p) => <button key={p.key} className={`engine-part${p.changed ? ' engine-part--changed' : ''}`} aria-pressed={p.key === effectiveSelected} onClick={() => setSelected(p.key)}><strong>{p.label}</strong><span>{p.valueLabel}</span></button>)}</div>
    <p className="muted small">{POWERTRAIN_KEYS.length} kategori aynı tasarım planına bağlıdır. Değişiklikler anında uygulanır; geri al, kayıt, JSON ve paylaşımda korunur. Sesi veya fiziksel motor çalışmasını taklit etmez. Animasyon siz başlatınca çalışır, sekme gizlenince durur.</p>
    <button className="btn btn--small" disabled={!canvasReady || !!error} onClick={download}>Motor şeması PNG indir</button><span className="small" role="status">{downloadStatus}</span>
  </>;
}
