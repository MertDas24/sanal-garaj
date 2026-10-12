import { useState } from 'react';
import { checkPowertrain, ENGINE_REFERENCES } from '../lib/compatibility';
import { POWERTRAIN_FIELDS, POWERTRAIN_GROUPS, POWERTRAIN_KEYS, defaultPowertrain, isPowertrainFieldEnabled, powertrainSummary, sanitizePowertrain, type PowertrainDesign, type PowertrainKey } from '../lib/powertrain';

export function PowertrainPanel({ plan, onChange, vehicleId = '', onOpen3D }: { plan: PowertrainDesign; onChange(plan: PowertrainDesign): void; vehicleId?: string; onOpen3D?(): void }) {
  const count = powertrainSummary(plan).length;
  const reference = ENGINE_REFERENCES[vehicleId], issues = checkPowertrain(plan, vehicleId);
  const [expanded, setExpanded] = useState(() => new Set(POWERTRAIN_GROUPS.filter((group, index) =>
    index === 0 || POWERTRAIN_KEYS.some((key) => POWERTRAIN_FIELDS[key].group === group && plan[key] !== 'stock'))));
  const set = (key: PowertrainKey, value: string) => onChange(sanitizePowertrain({ ...plan, [key]: value }));
  return <section className="panel__section powertrain-panel" id="mod-motor">
    <h2 className="panel__title" tabIndex={-1}>Motor ve aktarma planı</h2>
    <p className="muted small">{POWERTRAIN_KEYS.length} parça kategorisi · {count} planlanan değişiklik</p>
    <p className="model-note small">Bu bölüm parça seçim planıdır. Seçimler kayıt, dosya ve paylaşım bağlantısına eklenir. Motor 3D atölyesi genel şemayı canlı gösterir; güç/tork artışı veya araç uyumluluğu hesaplanmaz.</p>
    {onOpen3D && <button className="btn btn--small" onClick={onOpen3D}>Motoru 3D incele</button>}
    <div className="compatibility"><h3>Plan tutarlılığı</h3>{reference ? <p className="small">{reference.label} <a href={reference.url} target="_blank" rel="noopener noreferrer">Üretici kaynağı</a></p> : <p className="small muted">Bu araç için doğrulanmış temel motor kaydı henüz yok.</p>}<p className="small muted">Bu kontrol eksik veya birlikte incelenmesi gereken seçimleri bildirir. Parça numarası ve montaj ölçüsü verisi olmadan “uyumlu” sonucu verilmez.</p>{issues.length ? <ul>{issues.map((issue) => <li key={issue} className="small">{issue}</li>)}</ul> : <p className="small">Tanımlı kurallarda çelişki bulunmadı; mekanik uygunluk bilinmiyor.</p>}</div>
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
