import { useEffect, useState } from 'react';
import { MODELS, modelUrl } from '../data/models';
import { cachedPaths, clearOfflineData, isIos, isStandalone, storageUsage, useInstallPrompt } from '../lib/pwa';

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Uygulama olarak yükleme ve çevrimdışı veri yönetimi (Hakkında sayfası). */
export function OfflinePanel() {
  const install = useInstallPrompt();
  const [ready, setReady] = useState<number | null>(null);
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null);
  const [status, setStatus] = useState('');
  const [tick, setTick] = useState(0);
  const supported = 'serviceWorker' in navigator && 'caches' in window;

  useEffect(() => {
    let alive = true;
    Promise.all([cachedPaths(), storageUsage()]).then(([paths, u]) => {
      if (!alive) return;
      setReady(MODELS.filter((m) => paths.has(new URL(modelUrl(m), location.href).pathname)).length);
      setUsage(u);
    });
    return () => { alive = false; };
  }, [tick]);

  return <section className="offline-panel" id="uygulama">
    <h2>Uygulama ve çevrimdışı kullanım</h2>
    {!supported ? <p className="muted">Bu tarayıcı çevrimdışı kullanımı desteklemiyor.</p> : <>
      <p>Sanal Garaj telefona veya bilgisayara uygulama olarak yüklenebilir. Site bir kez açıldıktan sonra arayüz
        internetsiz de çalışır; açtığınız araçların 3D modelleri cihazda saklanır ve sonra çevrimdışı açılır.
        Çevrimiçiyken her zaman en yeni sürüm indirilir.</p>
      {isStandalone() ? <p className="small">Uygulama olarak açıldı.</p>
        : install ? <button className="btn btn--primary" onClick={async () => setStatus(await install() ? 'Uygulama yüklendi.' : 'Yükleme iptal edildi.')}>Uygulamayı yükle</button>
        : isIos() ? <p className="small">iPhone/iPad: Safari’de <strong>Paylaş</strong> → <strong>Ana Ekrana Ekle</strong>.</p>
        : <p className="small muted">Yükleme düğmesi tarayıcı izin verdiğinde görünür. Chrome/Edge adres çubuğundaki yükle simgesini de kullanabilirsiniz.</p>}
      <p className="small" aria-live="polite">
        {ready === null ? 'Çevrimdışı veriler denetleniyor…' : `${ready}/${MODELS.length} aracın modeli çevrimdışı hazır.`}
        {usage && usage.usage > 0 ? ` Sitenin cihazda kullandığı alan: ${mb(usage.usage)}.` : ''}
      </p>
      <button className="btn btn--small" disabled={!ready} onClick={async () => { await clearOfflineData(); setStatus('Çevrimdışı model verileri silindi.'); setTick((n) => n + 1); }}>Çevrimdışı verileri sil</button>
      <p className="small" role="status">{status}</p>
      <p className="muted small">Kaydettiğiniz tasarımlar ayrı tutulur ve bu düğmeyle silinmez.</p>
    </>}
  </section>;
}
