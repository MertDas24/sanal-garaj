import { useRef, useState } from 'react';
import type { Design } from '../lib/design';
import { encodeDesignFull } from '../lib/design';
import { designSummary, MAX_DESIGN_FILE_BYTES, parseDesignFile, serializeDesignFile } from '../lib/designFile';
import { downloadBlob, slugify } from '../lib/image';
import { editorHash } from '../lib/router';
import type { EnvId } from '../three/scenes';

export function DesignWorkbench({ design, base, vehicleId, title, environment, undo, redo, canUndo, canRedo }: {
  design: Design; base: Design; vehicleId: string; title: string; environment: EnvId;
  undo(): void; redo(): void; canUndo: boolean; canRedo: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const rows = designSummary(design, base);
  return <section className="workbench" aria-label="Tasarım çalışma alanı">
    <div className="workbench__head"><span className="eyebrow">TASARIM ATÖLYESİ</span><span className="chip chip--static">{rows.length} değişiklik</span></div>
    <div className="row">
      <button className="btn btn--small" disabled={!canUndo} onClick={undo} title="Ctrl/Cmd + Z">Geri al</button>
      <button className="btn btn--small" disabled={!canRedo} onClick={redo} title="Ctrl/Cmd + Shift + Z">İleri al</button>
    </div>
    <nav className="workshop-nav" aria-label="Modifikasyon bölümlerine git">
      {[
        ['Motor', 'motor'], ['Boya', 'gövde-boyası'], ['Kaplama', 'kaplama-ve-yarış-şeritleri'], ['Jant', 'jantlar'],
        ['Duruş', 'tekerlek-duruşu'], ['Kit', 'gövde-kiti'], ['Aero', 'aerodinamik-parçalar'], ['LED', 'alt-aydınlatma'], ['Stüdyo', 'studyo'],
      ].map(([label, id]) => <button className="chip" key={id} onClick={() => {
        const section = document.getElementById(`mod-${id}`);
        section?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        section?.querySelector('h2')?.focus({ preventScroll: true });
      }}>{label}</button>)}
    </nav>
    <details className="build-sheet"><summary>Modifikasyon listesi</summary>
      {rows.length ? <dl>{rows.map((r) => <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}</dl> : <p className="muted small">Fabrika görünümü. Bir renk veya parça seçerek başlayın.</p>}
      <p className="muted small">Görsel tasarım; güç, fiyat ve mekanik uygunluk hesaplanmaz.</p>
      <button className="btn btn--small" onClick={() => {
        const lines = [title, 'Sanal Garaj · Modifikasyon listesi', '', ...rows.map((r) => `${r.label}: ${r.value}`), '', 'Görsel tasarım; mekanik uyumluluk ve performans simülasyonu değildir.'];
        downloadBlob(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }), `${slugify(title)}-modifikasyonlar.txt`);
      }}>Listeyi indir</button>
    </details>
    <div className="row workbench__files">
      <button className="btn btn--small" onClick={() => downloadBlob(new Blob([serializeDesignFile(vehicleId, design, environment)], { type: 'application/json' }), `${slugify(title)}-tasarim.json`)}>Tasarım dosyasını indir</button>
      <button className="btn btn--small" onClick={() => input.current?.click()}>Dosyadan tasarım aç</button>
    </div>
    <input ref={input} className="sr-only" tabIndex={-1} type="file" accept=".json,application/json" aria-label="Tasarım dosyası" onChange={async (e) => {
      const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
      try {
        if (file.size > MAX_DESIGN_FILE_BYTES) throw new Error('Tasarım dosyası en fazla 128 KB olabilir.');
        const result = parseDesignFile(await file.text());
        const q = encodeDesignFull(result.design); q.set('env', result.environment);
        const hash = editorHash(result.vehicleId, q);
        // Aynı araçta da dışarıdan gelen tasarımın yeniden uygulanmasını sağla.
        window.location.hash = hash;
        window.location.reload();
      } catch (error) { setMessage(error instanceof Error ? error.message : 'Dosya okunamadı.'); }
    }} />
    {message && <p className="error small" role="alert">{message}</p>}
    <p className="muted small">Dosyalar cihazınızda işlenir. Tasarımınızı başka tarayıcıya taşıyabilirsiniz.</p>
  </section>;
}
