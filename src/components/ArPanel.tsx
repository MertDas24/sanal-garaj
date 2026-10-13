import { useEffect, useRef, useState } from 'react';
import type { ViewerHandle } from '../three/CarViewer';
import { detectArMode, exportClone, toGlb, toUsdz, type ArMode } from '../three/arExport';
import type { ArSessionHandle } from '../three/arSession';
import { downloadBlob, slugify } from '../lib/image';

interface Props {
  viewer: React.RefObject<ViewerHandle | null>;
  title: string;
  attribution: string;
  /** Tasarım değişince hazırlanmış AR dosyası geçersiz olur */
  designKey: string;
  disabled: boolean;
}

export function ArPanel({ viewer, title, attribution, designKey, disabled }: Props) {
  const [mode, setMode] = useState<ArMode | null>(null);
  const [busy, setBusy] = useState(false), [status, setStatus] = useState('');
  const [quickLook, setQuickLook] = useState<{ url: string; key: string } | null>(null);
  const [inSession, setInSession] = useState(false), [arStatus, setArStatus] = useState('');
  const overlay = useRef<HTMLDivElement>(null), session = useRef<ArSessionHandle | null>(null);

  useEffect(() => {
    let alive = true;
    detectArMode().then((m) => {
      if (!alive) return;
      setMode(m);
      // Oturum kodu önceden indirilir; izin isteği dokunuşun hemen ardından gelmeli
      if (m === 'webxr') void import('../three/arSession');
    });
    return () => { alive = false; };
  }, []);
  useEffect(() => () => { if (quickLook) URL.revokeObjectURL(quickLook.url); }, [quickLook]);
  useEffect(() => () => session.current?.end(), []);

  const car = () => {
    const object = viewer.current?.snapshot()?.car;
    if (!object) throw new Error('Model hazır değil.');
    return exportClone(object, { title, attribution, generator: 'Sanal Garaj' });
  };

  const startWebXr = async () => {
    setStatus(''); setArStatus('AR başlatılıyor…');
    try {
      const { startArSession } = await import('../three/arSession');
      // Kök, oturum isteğinden önce görünür olmalı (dom-overlay)
      overlay.current!.hidden = false;
      setInSession(true);
      session.current = await startArSession({
        car: car(), overlay: overlay.current!, onStatus: setArStatus,
        onEnd: () => { session.current = null; if (overlay.current) overlay.current.hidden = true; setInSession(false); },
      });
    } catch (error) {
      overlay.current!.hidden = true;
      setInSession(false);
      setStatus(`AR başlatılamadı: ${error instanceof Error ? error.message : 'bilinmeyen hata'}. Kamera izni verildiğinden ve Google Play Hizmetleri (AR) yüklü olduğundan emin olun.`);
    }
  };

  const prepareQuickLook = async () => {
    setBusy(true); setStatus('iPhone/iPad için AR dosyası hazırlanıyor…');
    try {
      const blob = await toUsdz(car());
      setQuickLook({ url: URL.createObjectURL(blob), key: designKey });
      setStatus(`Hazır (${(blob.size / 1024 / 1024).toFixed(1)} MB). “AR'da aç” düğmesine dokunun.`);
    } catch { setStatus('AR dosyası oluşturulamadı.'); } finally { setBusy(false); }
  };

  const download = async (format: 'glb' | 'usdz') => {
    setBusy(true); setStatus('3D dosyası hazırlanıyor…');
    try {
      const blob = format === 'glb' ? await toGlb(car()) : await toUsdz(car());
      downloadBlob(blob, `${slugify(title)}-sanal-garaj.${format}`);
      setStatus(`${format.toUpperCase()} dosyası indirildi (${(blob.size / 1024 / 1024).toFixed(1)} MB).`);
    } catch { setStatus('3D dosyası oluşturulamadı.'); } finally { setBusy(false); }
  };

  const ready = quickLook && quickLook.key === designKey ? quickLook : null;
  return <section className="panel__section" id="mod-ar"><h2 className="panel__title" tabIndex={-1}>Artırılmış gerçeklik (AR)</h2>
    <p className="muted small">Tasarladığınız aracı telefon kamerasıyla gerçek ortama, gerçek boyutunda yerleştirin. Dönüşüm cihazınızda yapılır; görüntü veya dosya gönderilmez.</p>
    <fieldset className="control-group" disabled={disabled || busy || inSession}>
      <div className="studio-actions">
        {mode === 'webxr' && <button className="btn btn--primary" onClick={startWebXr}>AR'da gör</button>}
        {mode === 'quicklook' && (ready
          ? <a className="btn btn--primary ar-link" rel="ar" href={`${ready.url}#allowsContentScaling=0`}><img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={18} height={18} />AR'da aç</a>
          : <button className="btn btn--primary" onClick={prepareQuickLook}>AR için hazırla</button>)}
        {mode === 'none' && <button className="btn" disabled aria-describedby="ar-reason">AR'da gör</button>}
        <button className="btn" onClick={() => download('glb')}>3D dosyası indir (GLB)</button>
        <button className="btn" onClick={() => download('usdz')}>iPhone için USDZ indir</button>
      </div>
    </fieldset>
    {mode === null && <p className="muted small" role="status">AR desteği denetleniyor…</p>}
    {mode === 'none' && <p className="muted small" id="ar-reason">Bu cihaz veya tarayıcı AR desteklemiyor. Android'de Chrome (ARCore destekli cihaz), iPhone/iPad'de Safari gerekir. Burada 3D dosyayı indirip telefona aktarabilirsiniz.</p>}
    {disabled && <p className="muted small">AR ve dışa aktarma için fotogerçekçi modu ve karşılaştırmayı kapatın.</p>}
    <p className="muted small">Dosyalar mevcut tasarımı (boya, jant, kit, kaplama) içerir. Model lisansı gereği paylaşırken atfı koruyun: <span translate="no">{attribution}</span></p>
    <p className="small ar-status" role="status">{status}</p>
    <div ref={overlay} className={`ar-overlay${inSession ? ' ar-overlay--on' : ''}`} hidden={!inSession}>
      <p className="ar-overlay__status" role="status">{arStatus}</p>
      <div className="ar-overlay__actions">
        <button className="btn" onClick={() => session.current?.rotate(-15)} aria-label="Aracı sola döndür">↺ 15°</button>
        <button className="btn" onClick={() => session.current?.rotate(15)} aria-label="Aracı sağa döndür">↻ 15°</button>
        <button className="btn btn--primary" onClick={() => session.current?.end()}>AR'dan çık</button>
      </div>
    </div>
  </section>;
}
