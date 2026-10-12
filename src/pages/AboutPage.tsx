import { CATALOG } from '../data/catalog';
import { MODELS } from '../data/models';
import { ENVIRONMENTS } from '../three/scenes';

const REPO = 'https://github.com/MertDas24/sanal-garaj';

export function AboutPage() {
  const tris = MODELS.reduce((a, m) => a + m.triangles, 0);
  return (
    <section className="page prose about">
      <h1>Sanal Garaj nasıl yapıldı?</h1>
      <p className="lead">
        Sanal Garaj, tarayıcıda çalışan, hesap ve sunucu gerektirmeyen bir 3D araç kişiselleştirme uygulaması.
        {` ${CATALOG.length}`} gerçekçi araç modeli, ışık izleme ile fotogerçekçi görüntü, cihaz içinde yapay zekâ ile
        fotoğrafta renk değiştirme ve paylaşılabilir tasarımlar sunuyor. Tamamı ücretsiz ve açık lisanslı
        kaynaklarla hazırlandı.
      </p>
      <img className="about__hero" src={`${import.meta.env.BASE_URL}og-image.jpg`} alt="Sanal Garaj’da ışık izleme ile hesaplanmış turuncu Lamborghini Gallardo" width={1200} height={630} />

      <div className="stats" role="list">
        <div role="listitem"><strong>{CATALOG.length}</strong><span>araç</span></div>
        <div role="listitem"><strong>{(tris / 1e6).toFixed(1)} M</strong><span>üçgen</span></div>
        <div role="listitem"><strong>{ENVIRONMENTS.length}</strong><span>ortam ışığı</span></div>
        <div role="listitem"><strong>0 ₺</strong><span>lisans maliyeti</span></div>
      </div>

      <h2>Öne çıkan teknikler</h2>
      <ul>
        <li>
          <strong>Işık izleme (path tracing):</strong> “Fotogerçekçi görüntü”, seçilen açıyı fiziksel ışık yollarını
          izleyerek hesaplar; stüdyo fonu, tepe ışığı, HDRI ortamları ve kenar korumalı gürültü giderme ile
          saniyeler içinde stüdyo fotoğrafı kalitesine ulaşır (three-gpu-pathtracer).
        </li>
        <li>
          <strong>Otomatik model hazırlama hattı:</strong> Her model indirilir, kaynak bilgisi dosyanın içinden
          doğrulanır, gerçek ölçüsüne getirilir, gövde/cam/lastik/jant/kaliper malzemeleri ayrıştırılır, tekerlekler
          lastik geometrisinden otomatik ayrılır, sadeleştirilir ve meshopt + WebP ile sıkıştırılır (glTF-Transform).
        </li>
        <li>
          <strong>Cihaz içinde yapay zekâ:</strong> “Fotoğrafta dene”, DeepLab v3 bölütleme modelini tarayıcıda
          çalıştırarak aracı bulur ve gövde rengini seçer; fotoğraf hiçbir sunucuya gönderilmez (MediaPipe).
        </li>
        <li>
          <strong>Paylaşılabilir durum:</strong> Tüm tasarım ayarları bağlantıya yazılır; gelen değerler doğrulanır,
          sınırlanır ve yalnızca modelin desteklediği seçenekler uygulanır.
        </li>
        <li>
          <strong>Performans:</strong> Yalnızca seçilen aracın modeli indirilir; 3D kütüphanesi katalogda yüklenmez;
          sayfadan çıkınca GPU kaynakları serbest bırakılır.
        </li>
        <li>
          <strong>Güvenlik ve gizlilik:</strong> Sıkı İçerik Güvenliği Politikası (yalnızca sitenin kendisinden
          betik ve veri), gizli anahtar yok, sunucu yok, kullanıcı verisi yalnızca cihazda.
        </li>
        <li>
          <strong>Kalite güvencesi:</strong> Birim testleri (Vitest) ve masaüstü + mobil uçtan uca testler
          (Playwright); testler geçmeden yayın yapılmaz (GitHub Actions → GitHub Pages).
        </li>
      </ul>

      <h2>Teknoloji</h2>
      <p className="tags">
        {['React 19', 'TypeScript', 'Vite', 'Three.js', 'React Three Fiber', 'three-gpu-pathtracer', 'glTF-Transform', 'meshoptimizer', 'MediaPipe', 'Vitest', 'Playwright', 'GitHub Actions'].map((t) => (
          <span key={t} className="chip chip--static">{t}</span>
        ))}
      </p>

      <h2>Kaynaklar</h2>
      <p>
        Tüm 3D modeller Sketchfab yazarlarının CC BY 4.0 lisanslı çalışmalarıdır; ortam ışıkları Poly Haven’dan
        (CC0). Ayrıntılı liste için <a href="#/kaynaklar">Kaynaklar</a> sayfasına bakın.
      </p>
      <p>
        <a className="btn btn--primary" href={REPO} target="_blank" rel="noopener noreferrer">Kaynak kodu (GitHub)</a>{' '}
        <a className="btn" href="#/">Garaja git</a>
      </p>
    </section>
  );
}
