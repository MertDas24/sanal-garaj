import { CATALOG, modelName } from '../data/catalog';
import { LICENSE_LABELS, MODELS } from '../data/models';

export function CreditsPage() {
  const missing = CATALOG.filter((v) => !v.modelId);
  return (
    <section className="page prose">
      <h1>Model kaynakları ve lisanslar</h1>
      <p>
        Sanal Garaj’daki tüm 3D araç modelleri, yeniden dağıtıma ve değiştirmeye izin veren açık lisanslarla yayımlanmış
        dosyalardır. Her model, kaynağında yazarı ve lisansı doğrulanarak eklenmiştir. Modeller derleme sırasında
        ölçeklendirildi, yönlendirildi, malzemeleri yeniden adlandırıldı/ayrıştırıldı ve sıkıştırıldı (CC BY lisansının
        gerektirdiği “değişiklik yapıldı” bildirimi).
      </p>

      <div className="table-wrap">
        <table>
          <caption className="sr-only">3D model kaynakları</caption>
          <thead>
            <tr>
              <th scope="col">Katalogdaki araç</th>
              <th scope="col">Kaynak model</th>
              <th scope="col">Yazar</th>
              <th scope="col">Lisans</th>
              <th scope="col">Boyut</th>
            </tr>
          </thead>
          <tbody>
            {MODELS.map((m) => {
              const v = CATALOG.find((c) => c.modelId === m.id);
              return (
                <tr key={m.id}>
                  <td translate="no">{v ? `${v.make} ${modelName(v)}` : m.id}</td>
                  <td>
                    <a href={m.source.url} target="_blank" rel="noopener noreferrer" translate="no">{m.source.title}</a> <span className="muted" translate="no">({m.source.site})</span>
                    {m.source.mirror && <> · <a href={m.source.mirror} target="_blank" rel="noopener noreferrer" className="small">indirilen kopya</a></>}
                  </td>
                  <td translate="no">{m.source.author}</td>
                  <td><a href={m.source.licenseUrl} target="_blank" rel="noopener noreferrer license">{LICENSE_LABELS[m.source.license]}</a></td>
                  <td className="nowrap">{(m.bytes / 1024).toFixed(0)} KB</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="small muted">
        Sketchfab modelleri, Sketchfab dışa aktarımının GitHub’daki herkese açık kopyalarından indirildi (Sketchfab
        doğrudan indirme için hesap ister). Her kopyanın içine gömülü kaynak adresi derleme sırasında Sketchfab
        sayfasıyla karşılaştırıldı; lisans Sketchfab’ın herkese açık API’sinden doğrulandı.
      </p>

      <h2>Diğer varlıklar</h2>
      <ul>
        <li>
          Ortam ışığı: <a href="https://polyhaven.com/a/autoshop_01" target="_blank" rel="noopener noreferrer">Poly Haven — Autoshop 01</a>,
          Oliksiy Yakovlyev, CC0.
        </li>
        <li>
          Fotoğrafta otomatik seçim: MediaPipe Image Segmenter ve DeepLab v3 modeli (Google), Apache 2.0. Model ve
          çalışma dosyaları bu siteden yüklenir; fotoğraflar hiçbir sunucuya gönderilmez.
        </li>
      </ul>

      {missing.length > 0 && <>
      <h2>3D modeli olmayan araçlar</h2>
      <p>
        Aşağıdaki araçlar katalogda yer alır ancak lisansı doğrulanmış, indirilebilir bir 3D model henüz bulunamadı.
        Bu araçlar düzenleyicide açılmaz; başka bir aracın modeli yerlerine gösterilmez.
      </p>
      <ul>
        {missing.map((v) => <li key={v.id} translate="no">{v.make} {modelName(v)} ({v.year})</li>)}
      </ul>
      </>}

      <h2>Marka uyarısı</h2>
      <p>
        Marka ve model adları yalnızca araçları tanımlamak için kullanılır; ilgili şirketlerin tescilli markalarıdır.
        Sanal Garaj bu şirketlerle bağlantılı değildir ve onlar tarafından desteklenmez. Açık lisanslı model dosyaları
        telif hakkını kapsar; marka ve tasarım hakları ayrıdır.
      </p>

      <h2>Yazılım</h2>
      <p>
        Three.js, React Three Fiber, drei (MIT), React (MIT), glTF-Transform, meshoptimizer ve three-gpu-pathtracer (MIT), MediaPipe Tasks
        Vision (Apache 2.0) kullanılmıştır.
      </p>
    </section>
  );
}
