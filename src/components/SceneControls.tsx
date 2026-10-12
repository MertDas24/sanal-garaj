import { ENVIRONMENTS, PT_QUALITY, SHOTS, type EnvId, type PtQuality, type ShotId } from '../three/scenes';

interface Props {
  env: EnvId;
  onEnv(v: EnvId): void;
  shot: ShotId;
  onShot(v: ShotId): void;
  quality: PtQuality;
  onQuality(v: PtQuality): void;
  denoise: boolean;
  onDenoise(v: boolean): void;
  photoreal: boolean;
}

/** Ortam ışığı ve fotogerçekçi görüntü ayarları. */
export function SceneControls(p: Props) {
  return (
    <section className="panel__section scene-controls" aria-label="Sahne ve fotoğraf ayarları">
      <h2 className="panel__title">Sahne ve fotoğraf</h2>
      <label className="field">
        <span className="field-label">Ortam ışığı</span>
        <select value={p.env} onChange={(e) => p.onEnv(e.target.value as EnvId)}>
          {ENVIRONMENTS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Fotoğraf açısı (fotogerçekçi mod)</span>
        <select value={p.shot} onChange={(e) => p.onShot(e.target.value as ShotId)}>
          {SHOTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </label>
      <div className="segmented-wrap">
        <span className="field-label">Kalite</span>
        <div className="segmented" role="radiogroup" aria-label="Fotogerçekçi kalite">
          {(Object.keys(PT_QUALITY) as PtQuality[]).map((q) => (
            <button key={q} role="radio" aria-checked={p.quality === q} onClick={() => p.onQuality(q)}>
              {PT_QUALITY[q].label}
            </button>
          ))}
        </div>
      </div>
      <label className="switch">
        <input type="checkbox" role="switch" checked={p.denoise} onChange={(e) => p.onDenoise(e.target.checked)} />
        <span className="switch__track" aria-hidden="true" />
        <span>Gürültü giderme</span>
      </label>
      <p className="muted small">
        {p.photoreal
          ? 'Ayar değişince fotogerçekçi görüntü baştan hesaplanır.'
          : 'Fotogerçekçi görüntü için görüntüleyicideki düğmeyi kullanın. “Yüksek” kalite birkaç dakika sürebilir.'}
      </p>
    </section>
  );
}
