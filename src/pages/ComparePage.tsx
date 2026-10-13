import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG, CATEGORY_LABELS, findVehicle, modelName } from '../data/catalog';
import { findModel, LICENSE_LABELS, modelUrl, type ModelAsset, type ModelFeatures } from '../data/models';
import { defaultDesign, sanitizeDesign, type Design } from '../lib/design';
import { editorHash, replaceHash } from '../lib/router';
import { loadSaved } from '../lib/storage';
import { hasWebGL } from '../lib/webgl';
import { ENGINE_REFERENCES } from '../lib/compatibility';
import { CarViewer, type ViewerHandle } from '../three/CarViewer';
import { SHOTS, type ShotId } from '../three/scenes';
import { NoWebGL } from '../components/NoWebGL';

// İki farklı aracı yan yana, aynı kamera açısı ve ortam ışığıyla karşılaştırır.
//   #/karsilastir?a=<araç>&b=<araç>

const VEHICLES = CATALOG.filter((v) => findModel(v.modelId));
const FEATURE_LABELS: [keyof ModelFeatures, string][] = [
  ['paint', 'Gövde boyası'], ['rimStyle', 'Jant tasarımı'], ['rideHeight', 'Sürüş yüksekliği'], ['windowTint', 'Cam filmi'],
  ['caliperColor', 'Kaliper rengi'], ['stance', 'Tekerlek duruşu'], ['wrap', 'Kaplama'], ['bodyKit', 'Gövde kiti'], ['underglow', 'Alt ışık'],
];
const shots = SHOTS.filter((s) => s.id !== 'free');
const m = (v: number) => `${v.toFixed(2).replace('.', ',')} m`;

function pick(id: string | null, fallback: string, other?: string): string {
  if (id && VEHICLES.some((v) => v.id === id) && id !== other) return id;
  return VEHICLES.find((v) => v.id !== other && v.id === fallback)?.id ?? VEHICLES.find((v) => v.id !== other)!.id;
}

export default function ComparePage({ query }: { query: URLSearchParams }) {
  const [a, setA] = useState(() => pick(query.get('a'), 'toyota-ae86'));
  const [b, setB] = useState(() => pick(query.get('b'), 'bmw-m3-e30', pick(query.get('a'), 'toyota-ae86')));
  const [shot, setShot] = useState<ShotId>('front34');
  const [features, setFeatures] = useState<Record<string, ModelFeatures>>({});
  useEffect(() => { replaceHash(`#/karsilastir?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`); }, [a, b]);
  const onFeatures = useCallback((id: string, f: ModelFeatures) => setFeatures((prev) => ({ ...prev, [id]: f })), []);
  if (!hasWebGL()) return <NoWebGL />;

  const sides = [{ key: 'A', id: a, set: setA, other: b }, { key: 'B', id: b, set: setB, other: a }];
  const va = findVehicle(a)!, vb = findVehicle(b)!, ma = findModel(va.modelId)!, mb = findModel(vb.modelId)!;
  const row = (label: string, fa: (x: ModelAsset, id: string) => string, names = false) => <tr key={label}><th scope="row">{label}</th><td translate={names ? 'no' : undefined}>{fa(ma, a)}</td><td translate={names ? 'no' : undefined}>{fa(mb, b)}</td></tr>;

  return <section className="page compare-page">
    <h1>Araç karşılaştır</h1>
    <p className="muted">İki aracı aynı kamera açısı ve aynı ortam ışığıyla yan yana inceleyin. Kayıtlı tasarımlarınızı da seçebilirsiniz.</p>
    <div className="compare-toolbar">
      <label className="field"><span>Kamera açısı (ikisine birden)</span>
        <select aria-label="Kamera açısı (ikisine birden)" value={shot} onChange={(e) => setShot(e.target.value as ShotId)}>{shots.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
      </label>
      <button className="btn" onClick={() => { setA(b); setB(a); }}>Tarafları değiştir</button>
    </div>
    <div className="compare-grid">
      {sides.map((s) => <CompareSide key={`${s.key}-${s.id}`} side={s.key} vehicleId={s.id} other={s.other} onVehicle={s.set} shot={shot} onFeatures={onFeatures} />)}
    </div>
    <table className="compare-table">
      <caption>Karşılaştırma tablosu</caption>
      <thead><tr><th scope="col">Özellik</th><th scope="col">A · <span translate="no">{va.make} {modelName(va)}</span></th><th scope="col">B · <span translate="no">{vb.make} {modelName(vb)}</span></th></tr></thead>
      <tbody>
        {row('Model yılı', (_, id) => findVehicle(id)!.year, true)}
        {row('Gövde tipi', (_, id) => CATEGORY_LABELS[findVehicle(id)!.category])}
        {row('Uzunluk', (x) => m(x.size[2]))}
        {row('Genişlik × yükseklik (model kutusu)', (x) => `${m(x.size[0])} × ${m(x.size[1])}`)}
        {row('Fabrika motoru', (_, id) => ENGINE_REFERENCES[id]?.label ?? 'Doğrulanmış kayıt yok')}
        {row('3D model detayı', (x) => `${x.triangles.toLocaleString('tr-TR')} üçgen · ${(x.bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`)}
        {row('Desteklenen modifikasyonlar', (x, id) => {
          const f = features[id] ?? x.features;
          return FEATURE_LABELS.filter(([k]) => f[k]).map(([, l]) => l).join(', ') || '—';
        })}
        {row('Model kaynağı', (x) => `${x.source.author} · ${LICENSE_LABELS[x.source.license]}`, true)}
      </tbody>
    </table>
    <p className="muted small">Uzunluk, modelin derlemede ölçeklendiği gerçek araç uzunluğudur. Genişlik ve yükseklik 3D modelin sınır kutusudur (aynalar dahil); resmi teknik veri değildir. Desteklenen modifikasyonlar, model yüklenince geometri üzerinden doğrulanmış listedir. Güç, ağırlık veya performans karşılaştırması yapılmaz.</p>
  </section>;
}

function CompareSide({ side, vehicleId, other, onVehicle, shot, onFeatures }: {
  side: string; vehicleId: string; other: string; onVehicle(id: string): void; shot: ShotId; onFeatures(id: string, f: ModelFeatures): void;
}) {
  const vehicle = findVehicle(vehicleId)!, model = findModel(vehicle.modelId)!;
  const viewer = useRef<ViewerHandle>(null);
  const saved = useMemo(() => loadSaved().filter((s) => s.vehicleId === vehicleId), [vehicleId]);
  const [savedId, setSavedId] = useState('factory');
  const [state, setState] = useState<{ base: Design; features: ModelFeatures } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => { if (state) viewer.current?.setShot(shot); }, [shot, state]);

  const onReady = useCallback((info: { features: ModelFeatures; originalPaint: string }) => {
    setState({ base: defaultDesign(info.originalPaint, info.features.spoiler === 'builtin'), features: info.features });
    onFeatures(vehicleId, info.features);
  }, [vehicleId, onFeatures]);
  const onError = useCallback(() => setError('3D model yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.'), [setError]);

  const chosen = saved.find((s) => s.id === savedId)?.design;
  const design = state ? sanitizeDesign(chosen ?? state.base, state.base, state.features) : defaultDesign('#cccccc', false);
  const title = `${vehicle.make} ${modelName(vehicle)}`;

  return <article className="compare-side" aria-label={`${side} tarafı: ${title}`}>
    <div className="compare-side__controls">
      <label className="field"><span>Araç {side}</span>
        <select aria-label={`Araç ${side}`} value={vehicleId} onChange={(e) => onVehicle(e.target.value)}>
          {VEHICLES.map((v) => <option key={v.id} value={v.id} disabled={v.id === other} translate="no">{v.make} {modelName(v)} ({v.year})</option>)}
        </select>
      </label>
      <label className="field"><span>Tasarım {side}</span>
        <select aria-label={`Tasarım ${side}`} value={savedId} onChange={(e) => setSavedId(e.target.value)} disabled={!saved.length}>
          <option value="factory">Fabrika görünümü</option>
          {saved.map((s) => <option key={s.id} value={s.id} translate="no">{s.name}</option>)}
        </select>
      </label>
    </div>
    <div className="viewer compare-side__viewer">
      {!error && <CarViewer key={retry} ref={viewer} url={modelUrl(model)} features={model.features} triangles={model.triangles} modelId={model.id}
        renderQuality="low" design={design} compare={null} onReady={onReady} onError={onError} />}
      {!state && !error && <div className="viewer__overlay" role="status"><p>3D model yükleniyor…</p></div>}
      {error && <div className="viewer__overlay" role="alert"><div><p>{error}</p><button className="btn btn--primary" onClick={() => { setError(null); setRetry((n) => n + 1); }}>Tekrar dene</button></div></div>}
    </div>
    <p className="small"><a href={editorHash(vehicleId)}><span translate="no">{title}</span> düzenleyicide aç</a>{!saved.length && <span className="muted"> · Bu araç için kayıtlı tasarım yok</span>}</p>
  </article>;
}
