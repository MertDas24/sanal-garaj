import { useState } from 'react';
import type { ViewerHandle } from '../three/CarViewer';
import { videoSupported } from '../three/studio';
import { captionImage, downloadBlob, slugify } from '../lib/image';
import type { ShotId } from '../three/scenes';
import { tr } from '../i18n';

export function StudioPanel({ viewer, title, attribution, disabled }: { viewer: React.RefObject<ViewerHandle | null>; title: string; attribution: string; disabled: boolean }) {
  const [ratio, setRatio] = useState('landscape'), [width, setWidth] = useState(1920), [busy, setBusy] = useState(false), [status, setStatus] = useState('');
  const action = async (type: 'single' | 'sheet' | 'video') => {
    setBusy(true); setStatus('Hazırlanıyor…');
    const camera = viewer.current?.snapshot()?.camera, position = camera?.position.clone(), quaternion = camera?.quaternion.clone(), fov = camera?.fov;
    try {
      const v = viewer.current; if (!v) throw new Error('Model hazır değil.');
      if (type === 'video') downloadBlob(await v.video(`${title} · Sanal Garaj`, attribution), `${slugify(title)}-tur.webm`);
      else {
        const height = Math.round(width * (ratio === 'square' ? 1 : ratio === 'portrait' ? 1.25 : 9 / 16));
        let data: string | null;
        if (type === 'single') data = v.studio(width, height);
        else {
          const sheet = document.createElement('canvas'); sheet.width = width; sheet.height = height;
          const ctx = sheet.getContext('2d')!;
          const shots: ShotId[] = ['front34', 'side', 'rear34', 'top'];
          for (let i = 0; i < shots.length; i++) {
            v.setShot(shots[i]); await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
            const image = new Image(); image.src = v.studio(Math.floor(width / 2), Math.floor(height / 2))!; await image.decode();
            ctx.drawImage(image, (i % 2) * width / 2, Math.floor(i / 2) * height / 2); ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.fillText(tr(['Ön ¾', 'Yan', 'Arka ¾', 'Kuş bakışı'][i]), (i % 2) * width / 2 + 14, Math.floor(i / 2) * height / 2 + 24);
          }
          data = sheet.toDataURL('image/png');
        }
        if (!data) throw new Error('Görüntü alınamadı.');
        downloadBlob(await captionImage(data, `${title} · Sanal Garaj`, attribution), `${slugify(title)}-${type === 'sheet' ? 'dort-aci' : 'studyo'}.png`);
      }
      setStatus('Dosya hazır ve indirildi.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Dosya oluşturulamadı.'); }
    finally { if (camera && position && quaternion && fov) { camera.position.copy(position); camera.quaternion.copy(quaternion); camera.fov = fov; camera.updateProjectionMatrix(); } setBusy(false); }
  };
  return <section className="panel__section" id="mod-studyo"><h2 className="panel__title" tabIndex={-1}>Fotoğraf stüdyosu</h2>
    <label className="field"><span>Görüntü oranı</span><select aria-label="Görüntü oranı" value={ratio} onChange={(e) => setRatio(e.target.value)}><option value="landscape">16:9 yatay</option><option value="square">1:1 kare</option><option value="portrait">4:5 dikey</option></select></label>
    <label className="field"><span>Çıktı genişliği</span><select aria-label="Çıktı genişliği" value={width} onChange={(e) => setWidth(Number(e.target.value))}><option value={1280}>1280 px</option><option value={1920}>1920 px</option><option value={2560}>2560 px</option></select></label>
    <fieldset className="control-group" disabled={disabled || busy}><div className="studio-actions"><button className="btn" onClick={() => action('single')}>Stüdyo PNG indir</button><button className="btn" onClick={() => action('sheet')}>Dört açı panosu indir</button><button className="btn" disabled={!videoSupported()} onClick={() => action('video')}>6 saniyelik tur videosu</button></div></fieldset>
    <p className="muted small">Etkileşimli sahne yeniden render edilir; model atfı eklenir. Dört açı ve video için kamera otomatik hareket eder. İşlem cihazınızda yapılır.</p>
    {disabled && <p className="muted small">Stüdyo için fotogerçekçi modu ve karşılaştırmayı kapatın.</p>}
    {!videoSupported() && <p className="muted small">Tarayıcınız WebM kaydını desteklemiyor.</p>}
    <p className="small" role="status">{status}</p>
  </section>;
}
