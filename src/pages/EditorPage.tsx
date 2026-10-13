import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEnvironment, useGLTF, useProgress } from '@react-three/drei';
import { findVehicle, modelName } from '../data/catalog';
import { findModel, LICENSE_LABELS, modelUrl, type ModelFeatures } from '../data/models';
import {
  decodeDesign, defaultDesign, encodeDesign, sanitizeDesign, type Design,
} from '../lib/design';
import { absoluteUrl, editorHash, replaceHash } from '../lib/router';
import { hasWebGL } from '../lib/webgl';
import { captionImage, downloadBlob, makeThumb, slugify } from '../lib/image';
import { loadSaved, saveDesign } from '../lib/storage';
import { CarViewer, type ViewerHandle } from '../three/CarViewer';
import { startPathTrace, type PathTraceSession } from '../three/pathTrace';
import { ENVIRONMENTS, findEnv, PT_QUALITY, type EnvId, type PtQuality, type ShotId } from '../three/scenes';
import { SceneControls } from '../components/SceneControls';
import { EditorPanel } from '../components/EditorPanel';
import { NoWebGL } from '../components/NoWebGL';
import { useToast } from '../components/useToast';
import { useDesignHistory } from '../lib/useDesignHistory';
import { DesignWorkbench } from '../components/DesignWorkbench';
import { StudioPanel } from '../components/StudioPanel';
import { ArPanel } from '../components/ArPanel';
import { PerformancePanel } from '../components/PerformancePanel';
import { designSummary } from '../lib/designFile';
import type { RenderQuality } from '../lib/quality';
import { tr } from '../i18n';
const EngineWorkshop = lazy(() => import('../components/EngineWorkshop'));


function withEnv(q: URLSearchParams, env: EnvId, engineOpen = false): URLSearchParams {
  if (env !== ENVIRONMENTS[0].id) q.set('env', env);
  if (engineOpen) q.set('motor3d', '1');
  return q;
}

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
        <h1 translate="no">{vehicle.make} {modelName(vehicle)}</h1>
        <p>Bu araç için lisansı doğrulanmış bir 3D model henüz yok; bu nedenle düzenleyici açılamıyor.</p>
        {vehicle.note && <p className="muted">{vehicle.note}</p>}
        <a className="btn btn--primary" href="#/">Kataloğa dön</a>
      </section>
    );
  }
  if (!hasWebGL()) return <NoWebGL />;
  return <Editor vehicleId={vehicle.id} title={`${vehicle.make} ${modelName(vehicle)}`} year={vehicle.year} note={vehicle.note} modelId={model.id} query={query} />;
}

function Editor({ vehicleId, title, year, note, modelId, query }: {
  vehicleId: string; title: string; year: string; note?: string; modelId: string; query: URLSearchParams;
}) {
  const model = findModel(modelId)!;
  const viewer = useRef<ViewerHandle>(null);
  const [initialQuery] = useState(query);
  const [engineOpen, setEngineOpen] = useState(() => query.get('motor3d') === '1');
  const engineHost = useRef<HTMLElement>(null);
  const [base, setBase] = useState<Design | null>(null);
  const { design, setDesign, reset: resetHistory, undo, redo, canUndo, canRedo } = useDesignHistory();
  const lastDesign = useRef<Design | null>(null);
  useEffect(() => { if (design) lastDesign.current = design; }, [design]);
  const [features, setFeatures] = useState<ModelFeatures>(model.features);
  const [error, setError] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [savedOptions, setSavedOptions] = useState(() => loadSaved().filter((s) => s.vehicleId === vehicleId));
  const [compareId, setCompareId] = useState('factory');
  const [renderQuality, setRenderQuality] = useState<RenderQuality>('auto');
  const [split, setSplit] = useState(0.5);
  const { toast, show } = useToast();
  const [photoreal, setPhotoreal] = useState(false);
  const [ptProgress, setPtProgress] = useState({ samples: 0, done: false });
  const ptHost = useRef<HTMLDivElement>(null);
  const ptSession = useRef<PathTraceSession | null>(null);
  const [envId, setEnvId] = useState<EnvId>(() => findEnv(query.get('env')).id);
  const [shot, setShot] = useState<ShotId>('front34');
  const [quality, setQuality] = useState<PtQuality>('normal');
  const [denoise, setDenoise] = useState(true);
  const PT_SAMPLES = PT_QUALITY[quality].samples;
  const env = findEnv(envId);
  const modelReady = !!design;
  const visualSignature = useMemo(() => { if (!design) return ''; const { powertrain: _plan, ...visual } = design; return JSON.stringify(visual); }, [design]);
  const beforeDesign = compareId === 'factory' ? base : savedOptions.find((s) => s.id === compareId)?.design ?? base;
  const differences = design && beforeDesign ? designSummary(design, beforeDesign) : [];
  useEffect(() => {
    if (modelReady && !photoreal) viewer.current?.setShot(shot);
    // Tasarım değişikliklerinde kullanıcının serbest kamerayı kaybetmemesi için yalnızca hazır olma durumu izlenir.
  }, [shot, photoreal, modelReady]);

  // Fotogerçekçi mod: ayrı bir WebGL bağlamında ışık izleme; tasarım değişince baştan hesaplanır
  useEffect(() => {
    if (!photoreal || !visualSignature) return;
    // Tasarımın etkileşimli sahneye uygulanması için bir kare bekle
    const id = requestAnimationFrame(() => {
      const snap = viewer.current?.snapshot();
      const host = ptHost.current;
      if (!snap || !host) return;
      setPtProgress({ samples: 0, done: false });
      try {
        const session = startPathTrace({
          ...snap,
          maxSamples: PT_SAMPLES,
          env,
          shot,
          denoise,
          onProgress: (samples, done) => setPtProgress({ samples, done }),
          onError: () => { setPhotoreal(false); show('Fotogerçekçi görüntü başlatılamadı.', 'error'); },
        });
        host.appendChild(session.canvas);
        ptSession.current = session;
      } catch {
        setPhotoreal(false); show('Fotogerçekçi görüntü başlatılamadı.', 'error');
      }
    });
    return () => {
      cancelAnimationFrame(id);
      ptSession.current?.canvas.remove();
      ptSession.current?.stop();
      ptSession.current = null;
    };
  }, [photoreal, visualSignature, show, PT_SAMPLES, env, shot, denoise]);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const { progress } = useProgress();

  const onReady = useCallback((info: { features: ModelFeatures; originalPaint: string; originalRim: string | null }) => {
    const b = defaultDesign(info.originalPaint, info.features.spoiler === 'builtin');
    b.decalRegion = (info.features.decalRegions?.[0] as Design['decalRegion']) ?? 'hood';
    if (import.meta.env.DEV) (window as unknown as { __features?: ModelFeatures }).__features = info.features;
    setFeatures(info.features);
    setBase(b);
    resetHistory(sanitizeDesign(lastDesign.current ?? decodeDesign(initialQuery), b, info.features));
  }, [initialQuery, resetHistory]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable || target?.matches('textarea, input:not([type="range"]):not([type="color"])')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const onError = useCallback((e: Error) => {
    console.error(e);
    const contextLost = e.message.includes('bağlam');
    const message = contextLost ? 'Grafik bağlamı kaybedildi. Açık sekmeleri azaltın ve tekrar deneyin.' : e.message.startsWith('Ortam:') ? 'Ortam ışığı dosyası yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.' : '3D model yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.';
    // Hata sahneyi kapatır; kapanıştaki bağlam kaybı asıl dosya hatasının üstüne yazmamalı.
    setError((previous) => contextLost && previous ? previous : message);
  }, [setError]);

  // Adres çubuğu her zaman paylaşılabilir güncel tasarımı gösterir
  useEffect(() => {
    if (design && base) replaceHash(editorHash(vehicleId, withEnv(encodeDesign(design, base), envId, engineOpen)));
  }, [design, base, vehicleId, envId, engineOpen]);

  const shareUrl = useMemo(
    () => (design && base ? absoluteUrl(editorHash(vehicleId, withEnv(encodeDesign(design, base), envId, engineOpen))) : ''),
    [design, base, vehicleId, envId, engineOpen],
  );

  const attribution = `3D model: “${model.source.title}” — ${model.source.author}, ${LICENSE_LABELS[model.source.license]} · ${model.source.url}`;

  const handleDownload = async () => {
    const data = photoreal && ptSession.current ? ptSession.current.canvas.toDataURL('image/png') : viewer.current?.capture();
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
      window.prompt(tr('Bağlantıyı kopyalayın:'), shareUrl);
    }
  };

  const handleSave = async () => {
    if (!design) return;
    const data = viewer.current?.capture();
    const thumb = data ? await makeThumb(data) : null;
    const date = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const r = saveDesign({ vehicleId, name: `${title} · ${date}`, design, thumb, environment: envId });
    if (r.ok) { setSavedOptions(loadSaved().filter((s) => s.vehicleId === vehicleId)); show('Tasarım bu cihaza kaydedildi.', 'ok', { href: '#/tasarimlarim', label: 'Tasarımlarım' }); }
    else show(r.reason === 'full' ? 'Kayıt sınırına ulaşıldı (30). Eski tasarımlardan silin.' : 'Tarayıcı depolaması kullanılamıyor (gizli mod olabilir).', 'error');
  };

  const ready = !!design && !!base;
  useEffect(() => {
    if (!ready || !engineOpen) return;
    const frame = requestAnimationFrame(() => { engineHost.current?.scrollIntoView({ block: 'start' }); engineHost.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true }); });
    return () => cancelAnimationFrame(frame);
  }, [ready, engineOpen]);
  const openEngine = () => { setPhotoreal(false); setEngineOpen(true); };

  return (
    <div className="editor">
      <div className={`editor__stage${engineOpen ? ' editor__stage--engine' : ''}`}>
        <div className="stage__head">
          <div>
            <h1 className="stage__title" translate="no">{title}</h1>
            <p className="muted stage__sub"><span translate="no">{year}</span>{note && <> · <span>{note}</span></>}</p>
          </div>
          <div className="stage-actions"><button className="btn btn--small" disabled={!ready} aria-expanded={engineOpen} aria-controls="motor-3d" onClick={() => { if (engineOpen) setEngineOpen(false); else openEngine(); }}>{engineOpen ? 'Motor atölyesini kapat' : 'Motor 3D atölyesi'}</button><a className="btn btn--ghost btn--small" href={`#/karsilastir?a=${encodeURIComponent(vehicleId)}`}>Karşılaştır</a><a className="btn btn--ghost btn--small" href="#/">← Katalog</a></div>
        </div>
        <div className="viewer">
          {!error && (
            <CarViewer
              key={retry}
              ref={viewer}
              url={modelUrl(model)}
              features={model.features}
              triangles={model.triangles}
              modelId={modelId}
              renderQuality={renderQuality}
              envFile={env.file}
              design={design ?? base ?? defaultDesign('#cccccc', false)}
              compare={comparing && beforeDesign && !photoreal ? { before: sanitizeDesign(beforeDesign, base!, features), split } : null}
              onReady={onReady}
              onError={onError}
            />
          )}
          {!ready && !error && (
            <div className="viewer__overlay" role="status" aria-live="polite">
              <div className="loader">
                <div className="loader__bar"><span style={{ width: `${Math.round(progress)}%` }} /></div>
                <p>{`3D model yükleniyor… %${Math.round(progress)}`}</p>
                <p className="muted small">{(model.bytes / 1024).toFixed(0)} KB · {model.triangles.toLocaleString('tr-TR')} üçgen</p>
              </div>
            </div>
          )}
          {error && (
            <div className="viewer__overlay" role="alert">
              <div className="loader">
                <p>{error}</p>
                <button className="btn btn--primary" onClick={() => { if (error.startsWith('Ortam')) useEnvironment.clear({ files: `${import.meta.env.BASE_URL}env/${env.file}` }); useGLTF.clear(modelUrl(model)); setError(null); setRetry((n) => n + 1); }}>Tekrar dene</button>
              </div>
            </div>
          )}
          <div ref={ptHost} className={photoreal ? 'pt-host pt-host--on' : 'pt-host'} aria-hidden={!photoreal} />
          {ready && photoreal && (
            <div className="pt-status" role="status" aria-live="polite">
              <div className="loader__bar"><span style={{ width: `${Math.round((ptProgress.samples / PT_SAMPLES) * 100)}%` }} /></div>
              <p className="small">
                {ptProgress.done
                  ? 'Fotogerçekçi görüntü hazır.'
                  : `Işık izleniyor… ${ptProgress.samples}/${PT_SAMPLES} örnek (görüntü giderek netleşir)`}
              </p>
            </div>
          )}
          {ready && comparing && !photoreal && (
            <div className="compare">
              <span className="compare__label compare__label--left">{compareId === 'factory' ? 'Önce' : 'Kayıt A'}</span>
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
              {!photoreal && (
                <>
                  <button className="btn btn--small" onClick={() => viewer.current?.resetCamera()}>Kamerayı sıfırla</button>
                  <button className="btn btn--small" aria-pressed={comparing} onClick={() => setComparing((v) => !v)}>
                    {comparing ? 'Karşılaştırmayı kapat' : 'Önce / Sonra'}
                  </button>
                </>
              )}
              <button
                className="btn btn--small"
                aria-pressed={photoreal}
                onClick={() => { setEngineOpen(false); setPtProgress({ samples: 0, done: false }); setPhotoreal((v) => !v); }}
                title="Seçili açıdan ışık izleme ile fotoğraf gerçekliğinde görüntü hesaplar"
              >
                {photoreal ? 'Etkileşimli görünüme dön' : 'Fotogerçekçi görüntü'}
              </button>
            </div>
          )}
        </div>
        <p className="attribution small">
          3D model: <a href={model.source.url} target="_blank" rel="noopener noreferrer" translate="no">“{model.source.title}”</a> — <span translate="no">{model.source.author} ({model.source.site})</span>,{' '}
          <a href={model.source.licenseUrl} target="_blank" rel="noopener noreferrer license">{LICENSE_LABELS[model.source.license]}</a>.{' '}
          {model.triangles < 30_000 ? 'Düşük poligonlu modeldir; derleme' : 'Derleme'} sırasında ölçeklendi, yönlendirildi ve sıkıştırıldı.
        </p>
        {ready && engineOpen && <section ref={engineHost} id="motor-3d" className="engine-workshop" aria-label="Motor 3D atölyesi"><div className="stage__head"><h2 tabIndex={-1}>Motor 3D atölyesi</h2><button className="btn btn--small" onClick={() => { setEngineOpen(false); document.querySelector<HTMLButtonElement>('[aria-controls="motor-3d"]')?.focus(); }}>Araç görünümüne dön</button></div><Suspense fallback={<p role="status">Motor atölyesi hazırlanıyor…</p>}><EngineWorkshop plan={design!.powertrain} vehicleId={vehicleId} title={title} onChange={(plan) => setDesign(sanitizeDesign({ ...design!, powertrain: plan }, base!, features))} /></Suspense></section>}
      </div>

      <aside className="editor__panel" aria-label="Düzenleme paneli">
        {ready ? (
          <>
            <DesignWorkbench design={design!} base={base!} vehicleId={vehicleId} title={title} environment={envId} undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo} />
            <EditorPanel vehicleId={vehicleId} design={design!} base={base!} features={features} notes={model.notes} onOpenEngine={openEngine} onChange={(d) => setDesign(sanitizeDesign(d, base!, features))} />
            <SceneControls
              env={envId} onEnv={setEnvId}
              shot={shot} onShot={setShot}
              quality={quality} onQuality={setQuality}
              denoise={denoise} onDenoise={setDenoise}
              photoreal={photoreal}
            />
            <section className="panel__section"><h2 className="panel__title">Kayıtlı tasarım karşılaştırması</h2>
              <label className="field"><span>Sol görünüm (A)</span><select aria-label="Sol görünüm (A)" value={compareId} onChange={(e) => { setCompareId(e.target.value); setComparing(true); }}><option value="factory">Fabrika tasarımı</option>{savedOptions.map((s) => <option key={s.id} value={s.id} translate="no">{s.name}</option>)}</select></label>
              <label className="field"><span>Sağ görünüm (B)</span><select aria-label="Sağ görünüm (B)" value="" onChange={(e) => { const item = savedOptions.find((s) => s.id === e.target.value); if (item) { setDesign(sanitizeDesign(item.design, base!, features)); setComparing(true); } }}><option value="">Mevcut tasarım / kayıt seç</option>{savedOptions.map((s) => <option key={s.id} value={s.id} translate="no">{s.name}</option>)}</select></label>
              <p className="muted small">Aynı aracın iki tasarımı tek kamera ile eşzamanlı karşılaştırılır. Ortam ışığı ortaktır. Farklı araç kayıtları listelenmez.</p>
              {comparing && <details><summary>{`${differences.length} tasarım farkı`}</summary><ul>{differences.map((row) => <li key={row.label}>{row.label}: {row.value}</li>)}</ul></details>}
            </section>
            <section className="panel__section"><h2 className="panel__title">Grafik kalitesi</h2><label className="field"><span>Etkileşimli görüntü</span><select aria-label="Etkileşimli görüntü" value={renderQuality} onChange={(e) => setRenderQuality(e.target.value as RenderQuality)}><option value="auto">Cihaza göre otomatik</option><option value="low">Hafif (yansıtıcı zemin kapalı)</option><option value="high">Yüksek</option></select></label><p className="muted small">Otomatik seçim ekran, giriş yöntemi, işlemci ve varsa cihaz belleğine göre yapılır. Işık izleme kalitesi ayrı ayarlanır.</p></section>
            <StudioPanel viewer={viewer} title={title} attribution={attribution} disabled={photoreal || comparing} />
            <ArPanel viewer={viewer} title={title} attribution={attribution} designKey={visualSignature} disabled={photoreal || comparing} />
            <PerformancePanel viewer={viewer} vehicleId={vehicleId} />
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
