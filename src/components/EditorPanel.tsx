import { useId } from 'react';
import { PowertrainPanel } from './PowertrainPanel';
import type { ModelFeatures } from '../data/models';
import {
  PRESETS, sanitizeDesign, CALIPER_SWATCHES, FINISH_LABELS, HEIGHT_MAX_MM, HEIGHT_MIN_MM, PAINT_SWATCHES, RIM_STYLE_LABELS, RIM_SWATCHES,
  TINT_LABELS, type Design, type Finish, type RimStyle, type WindowTint,
  WRAP_LABELS, RIM_FINISH_LABELS, SPOILER_LABELS, type WrapStyle, type RimFinish, type SpoilerStyle,
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
      <section className="panel__section">
        <h2 className="panel__title">Hazır paketler</h2>
        <div className="presets">
          {PRESETS.map((p) => (
            <button key={p.id} className="preset" onClick={() => onChange(sanitizeDesign({ ...base, ...p.design }, base, f))}>
              <strong>{p.label}</strong>
              <span>{p.hint}</span>
            </button>
          ))}
        </div>
        <p className="muted small">Paketler modelin desteklemediği ayarları atlar; sonra istediğiniz gibi değiştirebilirsiniz.</p>
      </section>

      <PowertrainPanel plan={design.powertrain} onChange={(plan) => set('powertrain', plan)} />

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

      <Section title="Kaplama ve yarış şeritleri" disabled={!f.wrap} reason="Bu modelde kaplama için uygun, ayrı gövde yüzeyi bulunamadı.">
        <Segmented<WrapStyle> label="Kaplama tasarımı" value={design.wrap} onPick={(v) => set('wrap', v)}
          options={(Object.keys(WRAP_LABELS) as WrapStyle[]).map((value) => ({ value, label: WRAP_LABELS[value], disabled: value !== 'none' && !!f.wrapStyles && !f.wrapStyles.includes(value) }))} />
        <label className="color-input"><input type="color" value={design.wrapColor} onChange={(e) => set('wrapColor', e.target.value)} /><span>Kaplama rengi</span></label>
        <p className="muted small">Üst gövde yüzeylerine geometrik kaplama; camlar ve trim korunur. Kaput/tavan alanı modelin geometrisine göre yaklaşık belirlenir.</p>
      </Section>

      <Section title="Jantlar" disabled={!f.rimColor && !f.rimStyle} reason="Bu modelde jantlar ayrı ve tutarlı bir malzeme olarak ayrılamadı; jant değişikliği desteklenmiyor.">
        <fieldset className="control-group" disabled={!f.rimColor} aria-label="Jant renk seçenekleri">
          <Swatches
            label="Jant rengi"
            options={[{ name: 'Orijinal', hex: '' }, ...RIM_SWATCHES]}
            value={design.rimColor ?? ''}
            onPick={(hex) => set('rimColor', hex || null)}
          />
        </fieldset>
        <fieldset className="control-group" disabled={!f.rimStyle} aria-label="Jant model seçenekleri">
          <Segmented<RimStyle>
            label="Jant modeli"
            options={(Object.keys(RIM_STYLE_LABELS) as RimStyle[]).map((k) => ({ value: k, label: RIM_STYLE_LABELS[k] }))}
            value={design.rimStyle}
            onPick={(v) => set('rimStyle', v)}
          />
        </fieldset>
        <Segmented<RimFinish> label="Jant yüzeyi" value={design.rimFinish} onPick={(v) => set('rimFinish', v)}
          options={(Object.keys(RIM_FINISH_LABELS) as RimFinish[]).map((value) => ({ value, label: RIM_FINISH_LABELS[value] }))} />
        <Range label="Eklenti jant çapı" min={85} max={115} step={1} value={design.rimScale} unit="%" disabled={!f.rimStyle || design.rimStyle === 'original'} format={(v) => `%${v}`} onValue={(v) => set('rimScale', v)} />
        <p className="muted small">Çap, üretilen jant yüzünü değiştirir; lastik dış çapı korunur ve jant lastiğin içine sığacak şekilde sınırlanır. Orijinal jantta ölçü değişmez.</p>
      </Section>

      <Section title="Tekerlek duruşu" disabled={!f.stance} reason="Dört ayrı tekerlek ve güvenilir merkez ölçüleri bulunamadı.">
        <Range label="Tekerlek genişliği" min={90} max={115} step={1} value={design.wheelWidth} unit="%" format={(v) => `%${v}`} onValue={(v) => set('wheelWidth', v)} />
        <Range label="Dışa açılma" min={0} max={25} step={1} value={design.offsetMm} format={(v) => `${v} mm`} onValue={(v) => set('offsetMm', v)} />
        <Range label="Ön kamber" min={-8} max={0} step={0.5} value={design.frontCamber} unit="°" format={(v) => `${v}°`} onValue={(v) => set('frontCamber', v)} />
        <Range label="Arka kamber" min={-8} max={0} step={0.5} value={design.rearCamber} unit="°" format={(v) => `${v}°`} onValue={(v) => set('rearCamber', v)} />
        <p className="muted small">Görsel duruş denemesi. Çamurluk/lastik çakışması ve mekanik uygunluk hesaplanmaz.</p>
      </Section>

      <Section title="Cam filmi" disabled={!f.windowTint} reason="Bu modelde camlar ayrı bir malzeme değil; cam filmi uygulanamıyor.">
        <Segmented<WindowTint>
          label="Film koyuluğu"
          options={(Object.keys(TINT_LABELS) as WindowTint[]).map((k) => ({ value: k, label: TINT_LABELS[k] }))}
          value={design.tint}
          onPick={(v) => set('tint', v)}
        />
      </Section>

      <Section title="Fren kaliperi" disabled={!f.caliperColor} reason="Bu modelde fren kaliperleri ayrı bir parça değil.">
        <Swatches
          label="Kaliper rengi"
          options={[{ name: 'Orijinal', hex: '' }, ...CALIPER_SWATCHES]}
          value={design.caliper ?? ''}
          onPick={(hex) => set('caliper', hex || null)}
        />
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
        <fieldset className="control-group" disabled={!f.spoiler} aria-label="Spoiler seçenekleri">
          <Toggle
            label={f.spoiler === 'builtin' ? 'Arka spoiler (modelin kendi parçası)' : 'Arka kanat spoiler'}
            checked={design.spoiler}
            onToggle={(v) => set('spoiler', v)}
          />
        </fieldset>
        <fieldset className="control-group" disabled={!f.frontLip} aria-label="Splitter seçenekleri">
          <Toggle label="Ön lip / splitter" checked={design.lip} onToggle={(v) => set('lip', v)} />
          <Range label="Splitter uzantısı" min={80} max={150} step={5} value={design.lipExtension} unit="%" format={(v) => `%${v}`} onValue={(v) => set('lipExtension', v)} />
        </fieldset>
        <fieldset className="control-group" disabled={f.spoiler !== 'addon'} aria-label="Kanat tasarım seçenekleri">
          <Segmented<SpoilerStyle> label="Kanat tasarımı" value={design.spoilerStyle} onPick={(v) => set('spoilerStyle', v)} options={(Object.keys(SPOILER_LABELS) as SpoilerStyle[]).map((value) => ({ value, label: SPOILER_LABELS[value] }))} />
          {f.spoiler !== 'addon' && <p className="muted small">Kanat tasarımı yalnızca uygulamanın ürettiği eklenti spoiler için değiştirilebilir.</p>}
        </fieldset>
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

      <Section title="Alt aydınlatma" disabled={!f.underglow} reason="Bu modelin alt gövde ölçüleri aydınlatma yerleşimine uygun değil.">
        <Toggle label="LED alt aydınlatma" checked={design.underglow} onToggle={(v) => set('underglow', v)} />
        <label className="color-input"><input type="color" value={design.glowColor} onChange={(e) => set('glowColor', e.target.value)} /><span>LED rengi</span></label>
        <p className="muted small">Gövde altında üretilen ışık şeritleri. Etkileşimli modda noktasal ışık, ışık izlemede ışık yayan geometri kullanılır.</p>
      </Section>

      <details className="panel__section capability-notes">
        <summary>Diğer modifikasyonlar ve model sınırları</summary>
        <p className="muted small">Bu garaj görsel tasarım içindir. Aşağıdaki seçenekler henüz desteklenmiyor:</p>
        {[
          ['Motor içi 3D görünüm / güç ölçümü', 'Motor ve aktarma planındaki seçimler saklanır; ayrı motor geometrisi ve sürüş fiziği simülasyonu yok.'],
          ['Fren kiti geometrisi', 'Araç bazında fren diski ve bağlantı ölçüleri yok. Kaliper rengi ayrı desteklenir.'],
          ['Geniş gövde / tampon / yan etek / difüzör', 'Araca özel, lisanslı ve yerleşimi doğrulanmış parça geometrisi gerekiyor.'],
          ['Egzoz geometrisi / far / stop / ayna / panjur', 'Egzoz seçimi motor planında saklanır; bu parçaların 3D geometrileri tüm modellerde ayrı ve doğrulanmış düğümlere sahip değil.'],
          ['Koltuk / direksiyon / takla kafesi / ses sistemi', 'İç mekân parçaları ve bağlantı noktaları ayrı hazırlanmalı.'],
          ['Lastik deseni / fren diski / hava süspansiyonu', 'Ayrı lastik/diski değiştirme ve hareketli süspansiyon geometrisi gerekiyor.'],
        ].map(([name, reason]) => <div key={name} className="unsupported-item"><button className="btn btn--small" disabled>{name}</button><p className="muted small">{reason}</p></div>)}
      </details>

      {notes && <p className="model-note small">{notes}</p>}

      <button className="btn btn--ghost btn--small" disabled={!changed} onClick={() => onChange(base)}>
        Tüm değişiklikleri sıfırla
      </button>
    </div>
  );
}

function Section({ title, disabled, reason, children }: { title: string; disabled: boolean; reason: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <section className="panel__section" id={`mod-${title.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, '-')}`}>
      <h2 className="panel__title" tabIndex={-1}>{title}</h2>
      {disabled && <p id={id} className="muted small unsupported">{reason}</p>}
      <fieldset className="control-group" disabled={disabled} aria-label={title} aria-describedby={disabled ? id : undefined}>{children}</fieldset>
    </section>
  );
}

function Swatches({ label, options, value, onPick }: { label: string; options: { name: string; hex: string }[]; value: string; onPick(hex: string): void }) {
  return (
    <div className="swatches" role="radiogroup" aria-label={label} onKeyDown={radioKeys}>
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

function Segmented<T extends string>({ label, options, value, onPick }: { label: string; options: { value: T; label: string; disabled?: boolean }[]; value: T; onPick(v: T): void }) {
  return (
    <div className="segmented-wrap">
      <span className="field-label">{label}</span>
      <div className="segmented" role="radiogroup" aria-label={label} onKeyDown={radioKeys}>
        {options.map((o) => (
          <button key={o.value} role="radio" disabled={o.disabled} title={o.disabled ? 'Bu modelde uygun yüzey bulunamadı.' : undefined} aria-checked={value === o.value} onClick={() => onPick(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function radioKeys(e: React.KeyboardEvent<HTMLDivElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
  const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="radio"]')].filter((b) => !b.matches(':disabled'));
  const current = buttons.indexOf(e.target as HTMLButtonElement);
  if (current < 0 || !buttons.length) return;
  e.preventDefault();
  const index = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 :
    (current + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length;
  buttons[index].focus(); buttons[index].click();
}

function Range({ label, min, max, step, value, format, onValue, unit = 'mm', disabled = false }: {
  label: string; min: number; max: number; step: number; value: number; format(v: number): string; onValue(v: number): void; unit?: string; disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={label === 'Yükseklik' ? 'range' : 'tuning-range'}>
      <div className="range__head">
        <label htmlFor={id} className="field-label">{label}</label>
        <output htmlFor={id}>{format(value)}</output>
      </div>
      <input id={id} type="range" disabled={disabled} aria-valuetext={format(value)} min={min} max={max} step={step} value={value} onChange={(e) => onValue(Number(e.target.value))} />
      <div className="range__scale muted small"><span>{min} {unit}</span><span>{max} {unit}</span></div>
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
