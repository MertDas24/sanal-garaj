import { useId } from 'react';
import type { ModelFeatures } from '../data/models';
import {
  FINISH_LABELS, HEIGHT_MAX_MM, HEIGHT_MIN_MM, PAINT_SWATCHES, RIM_STYLE_LABELS, RIM_SWATCHES,
  type Design, type Finish, type RimStyle,
} from '../lib/design';

interface Props {
  design: Design;
  base: Design;
  features: ModelFeatures;
  notes: string | null;
  onChange(d: Design): void;
}

export function EditorPanel({ design, base, features: f, notes, onChange }: Props) {
  const set = <K extends keyof Design>(k: K, v: Design[K]) => onChange({ ...design, [k]: v });
  const changed = JSON.stringify(design) !== JSON.stringify(base);

  return (
    <div className="panel">
      <Section title="Gövde boyası" disabled={!f.paint} reason="Bu modelde gövde boyası ayrı bir malzeme değil.">
        <Swatches
          label="Gövde rengi"
          options={[{ name: 'Orijinal', hex: base.paint }, ...PAINT_SWATCHES]}
          value={design.paint}
          onPick={(hex) => set('paint', hex)}
        />
        <label className="color-input">
          <input type="color" value={design.paint} onChange={(e) => set('paint', e.target.value)} />
          <span>Özel renk <code>{design.paint.toUpperCase()}</code></span>
        </label>
        <Segmented<Finish>
          label="Yüzey"
          options={(Object.keys(FINISH_LABELS) as Finish[]).map((k) => ({ value: k, label: FINISH_LABELS[k] }))}
          value={design.finish}
          onPick={(v) => set('finish', v)}
        />
      </Section>

      <Section title="Jantlar" disabled={!f.rimColor && !f.rimStyle} reason="Bu modelde jantlar lastik veya gövdeyle aynı parçada; jant değişikliği desteklenmiyor.">
        {f.rimColor && (
          <Swatches
            label="Jant rengi"
            options={[{ name: 'Orijinal', hex: '' }, ...RIM_SWATCHES]}
            value={design.rimColor ?? ''}
            onPick={(hex) => set('rimColor', hex || null)}
          />
        )}
        {f.rimStyle && (
          <Segmented<RimStyle>
            label="Jant modeli"
            options={(Object.keys(RIM_STYLE_LABELS) as RimStyle[]).map((k) => ({ value: k, label: RIM_STYLE_LABELS[k] }))}
            value={design.rimStyle}
            onPick={(v) => set('rimStyle', v)}
          />
        )}
      </Section>

      <Section title="Sürüş yüksekliği" disabled={!f.rideHeight} reason="Bu modelde tekerlekler gövdeyle tek parça; yükseklik ayarlanamaz.">
        <Range
          label="Yükseklik"
          min={HEIGHT_MIN_MM}
          max={HEIGHT_MAX_MM}
          step={5}
          value={design.heightMm}
          format={(v) => (v === 0 ? 'Standart' : `${v > 0 ? '+' : ''}${v} mm`)}
          onValue={(v) => set('heightMm', v)}
        />
      </Section>

      <Section title="Aerodinamik parçalar" disabled={!f.spoiler && !f.frontLip} reason="Bu model için parça yerleşimi doğrulanmadı; eklenti parça sunulmuyor.">
        {f.spoiler && (
          <Toggle
            label={f.spoiler === 'builtin' ? 'Arka spoiler (modelin kendi parçası)' : 'Arka kanat spoiler'}
            checked={design.spoiler}
            onToggle={(v) => set('spoiler', v)}
          />
        )}
        {f.frontLip && <Toggle label="Ön lip / splitter" checked={design.lip} onToggle={(v) => set('lip', v)} />}
        {(f.spoiler === 'addon' || f.frontLip) && (
          <Segmented<'body' | 'carbon'>
            label="Eklenti parça rengi"
            options={[{ value: 'body', label: 'Gövde rengi' }, { value: 'carbon', label: 'Karbon siyah' }]}
            value={design.partColor}
            onPick={(v) => set('partColor', v)}
          />
        )}
        {(f.spoiler === 'addon' || f.frontLip) && (
          <p className="muted small">Eklenti parçalar uygulama tarafından üretilen genel tasarımlardır; aracın orijinal parçası değildir.</p>
        )}
      </Section>

      {notes && <p className="model-note small">{notes}</p>}

      <button className="btn btn--ghost btn--small" disabled={!changed} onClick={() => onChange(base)}>
        Tüm değişiklikleri sıfırla
      </button>
    </div>
  );
}

function Section({ title, disabled, reason, children }: { title: string; disabled: boolean; reason: string; children: React.ReactNode }) {
  return (
    <section className="panel__section">
      <h2 className="panel__title">{title}</h2>
      {disabled ? <p className="muted small unsupported">{reason}</p> : children}
    </section>
  );
}

function Swatches({ label, options, value, onPick }: { label: string; options: { name: string; hex: string }[]; value: string; onPick(hex: string): void }) {
  return (
    <div className="swatches" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.name}
          role="radio"
          aria-checked={value === o.hex}
          className={o.hex ? 'swatch' : 'swatch swatch--original'}
          style={o.hex ? { background: o.hex } : undefined}
          title={o.name}
          aria-label={o.name}
          onClick={() => onPick(o.hex)}
        />
      ))}
    </div>
  );
}

function Segmented<T extends string>({ label, options, value, onPick }: { label: string; options: { value: T; label: string }[]; value: T; onPick(v: T): void }) {
  return (
    <div className="segmented-wrap">
      <span className="field-label">{label}</span>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onPick(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Range({ label, min, max, step, value, format, onValue }: {
  label: string; min: number; max: number; step: number; value: number; format(v: number): string; onValue(v: number): void;
}) {
  const id = useId();
  return (
    <div className="range">
      <div className="range__head">
        <label htmlFor={id} className="field-label">{label}</label>
        <output htmlFor={id}>{format(value)}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onValue(Number(e.target.value))} />
      <div className="range__scale muted small"><span>{min} mm</span><span>+{max} mm</span></div>
    </div>
  );
}

function Toggle({ label, checked, onToggle }: { label: string; checked: boolean; onToggle(v: boolean): void }) {
  return (
    <label className="switch">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onToggle(e.target.checked)} />
      <span className="switch__track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}
