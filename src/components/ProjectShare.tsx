import { useState } from 'react';
import { useToast } from './useToast';

export const PUBLIC_SITE_URL = 'https://mertdas24.github.io/sanal-garaj/';
export function ProjectShare() {
  const [manual, setManual] = useState(false);
  const { toast, show } = useToast();
  return <div className="project-share">
    <button className="btn" onClick={async () => {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        try { await navigator.share({ title: 'Sanal Garaj', url: PUBLIC_SITE_URL }); return; }
        catch (error) { if (error instanceof Error && error.name === 'AbortError') return; }
      }
      try { await navigator.clipboard.writeText(PUBLIC_SITE_URL); show('Sitenin bağlantısı panoya kopyalandı.'); }
      catch { setManual(true); }
    }}>Siteyi paylaş</button>
    {manual && <label className="field"><span className="field-label">Paylaşılabilir site bağlantısı</span><input readOnly value={PUBLIC_SITE_URL} onFocus={(e) => e.target.select()} autoFocus /></label>}
    {toast}
  </div>;
}
