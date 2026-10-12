import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { findVehicle } from '../data/catalog';
import { findModel, LICENSE_LABELS, modelUrl, type ModelFeatures } from '../data/models';
import {
  decodeDesign, defaultDesign, encodeDesign, sanitizeDesign, type Design,
} from '../lib/design';
import { absoluteUrl, editorHash, replaceHash } from '../lib/router';
import { hasWebGL } from '../lib/webgl';
import { captionImage, downloadBlob, makeThumb, slugify } from '../lib/image';
import { saveDesign } from '../lib/storage';
import { CarViewer, type ViewerHandle } from '../three/CarViewer';
import { EditorPanel } from '../components/EditorPanel';
import { NoWebGL } from '../components/NoWebGL';
import { useToast } from '../components/useToast';

export default function EditorPage({ vehicleId, query }: { vehicleId: string; query: URLSearchParams }) {
  const vehicle = findVehicle(vehicleId);
  const model = findModel(vehicle?.modelId);

  if (!vehicle) {
    return (
      <section className="page empty-state">
        <h1>Araç bulunamadı</h1>
        <p>Bağlantıdaki araç katalogda yok. Bağlantı eksik ya da eski olabilir.</p>
        <a className="btn btn--primary" href="#/">Kataloğa dön</a>
      </section>
    );
  }
  if (!model) {
    return (
      <section className="page empty-state">
        <h1>{vehicle.make} {vehicle.model}</h1>
        <p>Bu araç için lisansı doğrulanmış bir 3D model henüz yok; bu nedenle düzenleyici açılamıyor.</p>
        {vehicle.note && <p className="muted">{vehicle.note}</p>}
        <a className="btn btn--primary" href="#/">Kataloğa dön</a>
      </section>
    );
  }
  if (!hasWebGL()) return <NoWebGL />;
  return <Editor vehicleId={vehicle.id} title={`${vehicle.make} ${vehicle.model}`} year={vehicle.year} note={vehicle.note} modelId={model.id} query={query} />;
}

function Editor({ vehicleId, title, year, note, modelId, query }: {
  vehicleId: string; title: string; year: string; note?: string; modelId: string; query: URLSearchParams;
}) {
  const model = findModel(modelId)!;
  const viewer = useRef<ViewerHandle>(null);
  const [initialQuery] = useState(query);
  const [base, setBase] = useState<Design | null>(null);
  const [design, setDesign] = useState<Design | null>(null);
  const [features, setFeatures] = useState<ModelFeatures>(model.features);
  const [error, setError] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [split, setSplit] = useState(0.5);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const { toast, show } = useToast();
  const { progress } = useProgress();

  const onReady = useCallback((info: { features: ModelFeatures; originalPaint: string; originalRim: string | null }) => {
    const b = defaultDesign(info.originalPaint, info.features.spoiler === 'builtin');
    if (import.meta.env.DEV) (window as unknown as { __features?: ModelFeatures }).__features = info.features;
    setFeatures(info.features);
    setBase(b);
    setDesign(sanitizeDesign(decodeDesign(initialQuery), b, info.features));
  }, [initialQuery]);

  const onError = useCallback((e: Error) => {
    console.error(e);
    setError('3D model yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.');
  }, []);

  // Adres çubuğu her zaman paylaşılabilir güncel tasarımı gösterir
  useEffect(() => {
    if (design && base) replaceHash(editorHash(vehicleId, encodeDesign(design, base)));
  }, [design, base, vehicleId]);

  const shareUrl = useMemo(
    () => (design && base ? absoluteUrl(editorHash(vehicleId, encodeDesign(design, base))) : ''),
    [design, base, vehicleId],
  );

  const attribution = `3D model: “${model.source.title}” — ${model.source.author} (${model.source.site}), ${LICENSE_LABELS[model.source.license]}`;

  const handleDownload = async () => {
    const data = viewer.current?.capture();
    if (!data) { show('Görüntü alınamadı.', 'error'); return; }
    setBusy(true);
    try {
      const blob = await captionImage(data, `${title} · Sanal Garaj`, attribution);
      downloadBlob(blob, `${slugify(title)}-sanal-garaj.png`);
      show('Görüntü indirildi.');
    } catch {
      show('Görüntü oluşturulamadı.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: `${title} — Sanal Garaj`, url: shareUrl });
        return;
      } catch { /* kullanıcı vazgeçti; panoya kopyalamayı dene */ }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      show('Paylaşım bağlantısı panoya kopyalandı.');
    } catch {
      window.prompt('Bağlantıyı kopyalayın:', shareUrl);
    }
  };

  const handleSave = async () => {
    if (!design) return;
    const data = viewer.current?.capture();
    const thumb = data ? await makeThumb(data) : null;
    const date = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const r = saveDesign({ vehicleId, name: `${title} · ${date}`, design, thumb });
    if (r.ok) show('Tasarım bu cihaza kaydedildi.', 'ok', { href: '#/tasarimlarim', label: 'Tasarımlarım' });
    else show(r.reason === 'full' ? 'Kayıt sınırına ulaşıldı (30). Eski tasarımlardan silin.' : 'Tarayıcı depolaması kullanılamıyor (gizli mod olabilir).', 'error');
  };

  const ready = !!design && !!base;

  return (
    <div className="editor">
      <div className="editor__stage">
        <div className="stage__head">
          <div>
            <h1 className="stage__title">{title}</h1>
            <p className="muted stage__sub">{year}{note ? ` · ${note}` : ''}</p>
          </div>
          <a className="btn btn--ghost btn--small" href="#/">← Katalog</a>
        </div>
        <div className="viewer">
          {!error && (
            <CarViewer
              key={retry}
              ref={viewer}
              url={modelUrl(model)}
              features={model.features}
              triangles={model.triangles}
              design={design ?? base ?? defaultDesign('#cccccc', false)}
              compare={comparing && base ? { before: base, split } : null}
              onReady={onReady}
              onError={onError}
            />
          )}
          {!ready && !error && (
            <div className="viewer__overlay" role="status" aria-live="polite">
              <div className="loader">
                <div className="loader__bar"><span style={{ width: `${Math.round(progress)}%` }} /></div>
                <p>3D model yükleniyor… %{Math.round(progress)}</p>
                <p className="muted small">{(model.bytes / 1024).toFixed(0)} KB · {model.triangles.toLocaleString('tr-TR')} üçgen</p>
              </div>
            </div>
          )}
          {error && (
            <div className="viewer__overlay" role="alert">
              <div className="loader">
                <p>{error}</p>
                <button className="btn btn--primary" onClick={() => { setError(null); setRetry((n) => n + 1); }}>Tekrar dene</button>
              </div>
            </div>
          )}
          {ready && comparing && (
            <div className="compare">
              <span className="compare__label compare__label--left">Önce</span>
              <span className="compare__label compare__label--right">Sonra</span>
              <div className="compare__line" style={{ left: `${split * 100}%` }} aria-hidden="true" />
              <label className="compare__slider">
                <span className="sr-only">Karşılaştırma ayırıcısı</span>
                <input type="range" min={0.05} max={0.95} step={0.01} value={split} onChange={(e) => setSplit(Number(e.target.value))} />
              </label>
            </div>
          )}
          {ready && (
            <div className="viewer__tools">
              <button className="btn btn--small" onClick={() => viewer.current?.resetCamera()}>Kamerayı sıfırla</button>
              <button className="btn btn--small" aria-pressed={comparing} onClick={() => setComparing((v) => !v)}>
                {comparing ? 'Karşılaştırmayı kapat' : 'Önce / Sonra'}
              </button>
            </div>
          )}
        </div>
        <p className="attribution small">
          3D model: <a href={model.source.url} target="_blank" rel="noopener noreferrer">“{model.source.title}”</a> — {model.source.author} ({model.source.site}),{' '}
          <a href={model.source.licenseUrl} target="_blank" rel="noopener noreferrer license">{LICENSE_LABELS[model.source.license]}</a>.{' '}
          {model.triangles < 30_000 ? 'Düşük poligonlu modeldir; derleme' : 'Derleme'} sırasında ölçeklendi, yönlendirildi ve sıkıştırıldı.
        </p>
      </div>

      <aside className="editor__panel" aria-label="Düzenleme paneli">
        {ready ? (
          <>
            <EditorPanel design={design!} base={base!} features={features} notes={model.notes} onChange={setDesign} />
            <div className="panel-actions">
              <button className="btn btn--primary" onClick={handleSave}>Kaydet</button>
              <button className="btn" onClick={handleShare}>Bağlantıyı paylaş</button>
              <button className="btn" onClick={handleDownload} disabled={busy}>{busy ? 'Hazırlanıyor…' : 'Görüntü indir'}</button>
            </div>
          </>
        ) : (
          <p className="muted panel-wait">{error ? 'Model yüklenemediği için düzenleme kapalı.' : 'Model yüklenince seçenekler burada görünecek.'}</p>
        )}
      </aside>
      {toast}
    </div>
  );
}
