import { CATALOG } from '../data/catalog';
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
                  <td>{v ? `${v.make} ${v.model}` : m.id}</td>
                  <td><a href={m.source.url} target="_blank" rel="noopener noreferrer">{m.source.title}</a> <span className="muted">({m.source.site})</span></td>
                  <td>{m.source.author}</td>
                  <td><a href={m.source.licenseUrl} target="_blank" rel="noopener noreferrer license">{LICENSE_LABELS[m.source.license]}</a></td>
                  <td className="nowrap">{(m.bytes / 1024).toFixed(0)} KB</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2>3D modeli olmayan araçlar</h2>
      <p>
        Aşağıdaki araçlar katalogda yer alır ancak lisansı doğrulanmış, indirilebilir bir 3D model henüz bulunamadı.
        Bu araçlar düzenleyicide açılmaz; başka bir aracın modeli yerlerine gösterilmez.
      </p>
      <ul>
        {missing.map((v) => <li key={v.id}>{v.make} {v.model} ({v.year})</li>)}
      </ul>

      <h2>Marka uyarısı</h2>
      <p>
        Marka ve model adları yalnızca araçları tanımlamak için kullanılır; ilgili şirketlerin tescilli markalarıdır.
        Sanal Garaj bu şirketlerle bağlantılı değildir ve onlar tarafından desteklenmez. Açık lisanslı model dosyaları
        telif hakkını kapsar; marka ve tasarım hakları ayrıdır.
      </p>

      <h2>Yazılım</h2>
      <p>
        Three.js, React Three Fiber, drei (MIT), React (MIT), glTF-Transform ve meshoptimizer (MIT) kullanılmıştır.
      </p>
    </section>
  );
}
