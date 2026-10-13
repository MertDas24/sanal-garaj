import { CATALOG } from '../data/catalog';
import { MODELS } from '../data/models';
import { ENVIRONMENTS } from '../three/scenes';
import { ProjectShare } from '../components/ProjectShare';
import { OfflinePanel } from '../components/OfflinePanel';
import { BenchmarkSummary } from '../components/BenchmarkSummary';

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
      <div className="portfolio-grid">
        <article><span className="eyebrow">GEOMETRİ</span><h3>Modeli anlayan modifikasyonlar</h3><p>Kaplamalar yalnızca gövde yüzeylerine projekte edilir. Tekerlekler kendi merkezlerinde kamber alır; üretilen jantlar aynı dönüşümü izler. Uygun geometri bulunmadığında seçenek kapatılır.</p></article>
        <article><span className="eyebrow">ÜRÜN DENEYİMİ</span><h3>Tasarımın her adımı sende</h3><p>50 adımlık geri al/ileri al, modifikasyon listesi, sürümlü JSON dosyaları ve paylaşım bağlantıları. Tasarımı kaydetmek için hesap gerekmez.</p></article>
        <article><span className="eyebrow">GİZLİLİK</span><h3>Cihaz içinde çalışan garaj</h3><p>Fotoğraflar, yerel modeller ve tasarım dosyaları tarayıcıda işlenir. Sunucu, kullanıcı hesabı ve ücretli API bulunmaz.</p></article>
      </div>
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
      <h3>Mimari ve teknik kararlar</h3>
      <div className="architecture" aria-label="Uygulama veri akışı">
        <div><strong>Kaynak doğrulama</strong><span>CC BY / CC0 → model hazırlama → kanonik GLB</span></div><span aria-hidden="true">↓</span>
        <div><strong>Statik katalog</strong><span>Seçilen araç → tembel 3D paket yükleme</span></div><span aria-hidden="true">↓</span>
        <div><strong>Doğrulanan tasarım</strong><span>Sanitize → boya / geometri / kamera → WebGL2</span></div><span aria-hidden="true">↓</span>
        <div><strong>Cihazda çıktı</strong><span>Yerel kayıt · URL · JSON · PNG · WebM</span></div>
      </div>
      <p>En önemli geometri kararı: boya yalnızca kanonik gövde malzemesine uygulanır. Kit bağlantıları gerçek model yüzeyinden ölçülür; kaplamalar boya üçgenlerine projekte edilir. Desteklenmeyen modellerde ilgili kontroller gerekçesiyle kapatılır.</p>
      <p>Önemli kaynak yönetimi kararı: sabit sahne talep üzerine çizilir, kaplama geometrileri sınırlı önbellekte tutulur, çıktı render hedefleri işlem sonunda temizlenir. Yalnızca motor parça planını değiştirmek ışık izlemeyi yeniden başlatmaz.</p>
      <h3>Ölçülebilir portfolyo</h3>
      <BenchmarkSummary />
      <p>Düzenleyicideki “Performans ölçümü ve rapor” aracından kendi oturumunuzun indirme süreleri ve renderer kaynak adetlerini JSON olarak alabilirsiniz. Sonuçlar donanım ve önbelleğe bağlıdır; geometri/doku adetleri bellek boyutu olarak sunulmaz.</p>
      <p><a href={`${import.meta.env.BASE_URL}benchmarks/workshop.json`} target="_blank" rel="noopener noreferrer">Tarihli geliştirme ölçümü (JSON)</a></p>
      <video className="about__demo" controls preload="none" poster={`${import.meta.env.BASE_URL}demo/poster.jpg`} aria-label="Gerçek 3D sahneden kaydedilmiş Sanal Garaj turu" src={`${import.meta.env.BASE_URL}demo/garaj-turu.webm`} />
      <p className="small muted">Demo ve poster: <a href="https://sketchfab.com/3d-models/a5737bf3cc9b4179a6e5ebe173ff70d9" target="_blank" rel="noopener noreferrer" translate="no">Toyota AE86 Sprinter Trueno Zenki — Martin Trafas</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer license">CC BY 4.0</a>. Ölçek/yön/sıkıştırma, boya, kaplama ve üretilen eklenti kit uygulanmıştır. Video gerçek model sahnesinden uygulamanın kendi kaydedicisiyle oluşturuldu.</p>
      <h3>Motor ve aktarma planı</h3>
      <p>Motor değişimi, iç aksam, turbo/kompresör, ECU, yakıt, egzoz, soğutma ve aktarma seçenekleri tasarımın
        parça planına eklenir; kayıt, dosya ve bağlantı üzerinden taşınır. “Motor 3D atölyesi” bu planı genel,
        prosedürel bir 3D şemada canlı gösterir. Bu şema aracın gerçek motor modeli değildir; güç ölçümü veya fizik
        simülasyonu yapılmaz.</p>
      <h3>Artırılmış gerçeklik</h3>
      <p>Tasarım, Android Chrome’da WebXR ile, iPhone/iPad’de AR Quick Look ile kamera görüntüsüne gerçek boyutunda
        yerleştirilebilir. GLB/USDZ dönüşümü tarayıcıda yapılır; dosya sunucuya gönderilmez.</p>
      <p className="tags">
        {['React 19', 'TypeScript', 'Vite', 'Three.js', 'React Three Fiber', 'three-gpu-pathtracer', 'glTF-Transform', 'meshoptimizer', 'MediaPipe', 'Vitest', 'Playwright', 'GitHub Actions'].map((t) => (
          <span key={t} className="chip chip--static" translate="no">{t}</span>
        ))}
      </p>
      <ProjectShare />
      <OfflinePanel />

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
