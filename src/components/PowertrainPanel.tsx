import { useState } from 'react';
import { POWERTRAIN_FIELDS, POWERTRAIN_GROUPS, POWERTRAIN_KEYS, defaultPowertrain, isPowertrainFieldEnabled, powertrainSummary, sanitizePowertrain, type PowertrainDesign, type PowertrainKey } from '../lib/powertrain';

export function PowertrainPanel({ plan, onChange }: { plan: PowertrainDesign; onChange(plan: PowertrainDesign): void }) {
  const count = powertrainSummary(plan).length;
  const [expanded, setExpanded] = useState(() => new Set(POWERTRAIN_GROUPS.filter((group, index) =>
    index === 0 || POWERTRAIN_KEYS.some((key) => POWERTRAIN_FIELDS[key].group === group && plan[key] !== 'stock'))));
  const set = (key: PowertrainKey, value: string) => onChange(sanitizePowertrain({ ...plan, [key]: value }));
  return <section className="panel__section powertrain-panel" id="mod-motor">
    <h2 className="panel__title" tabIndex={-1}>Motor ve aktarma planı</h2>
    <p className="muted small">{POWERTRAIN_KEYS.length} parça kategorisi · {count} planlanan değişiklik</p>
    <p className="model-note small">Bu bölüm parça seçim planıdır. Seçimler kayıt, dosya ve paylaşım bağlantısına eklenir. Motor içi 3D görüntü, güç/tork artışı veya araç uyumluluğu hesaplanmaz.</p>
    <label className="field"><span className="field-label">Motor değişimi</span>
      <select aria-label="Motor değişimi" value={plan.layout} onChange={(e) => set('layout', e.target.value)}>
        {Object.entries(POWERTRAIN_FIELDS.layout.options).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
    {POWERTRAIN_GROUPS.map((group) => {
      const keys = POWERTRAIN_KEYS.filter((key) => key !== 'layout' && POWERTRAIN_FIELDS[key].group === group);
      const active = keys.filter((key) => plan[key] !== 'stock').length;
      return <details key={group} className="powertrain-group" open={expanded.has(group)} onToggle={(e) => {
        const open = e.currentTarget.open;
        setExpanded((previous) => {
          if (previous.has(group) === open) return previous;
          const next = new Set(previous); if (open) next.add(group); else next.delete(group); return next;
        });
      }}>
        <summary>{group} <span className="muted small">{active ? `${active} seçim` : `${keys.length} seçenek`}</span></summary>
        {keys.map((key) => {
          const field = POWERTRAIN_FIELDS[key]; const enabled = isPowertrainFieldEnabled(key, plan);
          return <label className="field" key={key}>
            <span className="field-label">{field.label}</span>
            <select aria-label={field.label} value={plan[key]} disabled={!enabled} onChange={(e) => set(key, e.target.value)}>
              {Object.entries(field.options).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
            {!enabled && <span className="muted small">{field.group === 'Elektrikli dönüşüm' ? 'Motor değişiminden elektrikli dönüşüm seçildiğinde açılır.' : 'Elektrikli dönüşüm planında bu içten yanmalı motor parçası kullanılmaz.'}</span>}
          </label>;
        })}
      </details>;
    })}
    <button className="btn btn--small" disabled={!count} onClick={() => onChange(defaultPowertrain())}>Motor planını sıfırla</button>
  </section>;
}
