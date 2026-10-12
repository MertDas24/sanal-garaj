export function NoWebGL() {
  return (
    <section className="page empty-state" role="alert">
      <h1>3D görüntüleme desteklenmiyor</h1>
      <p>
        Tarayıcınız veya cihazınız WebGL 2 desteği sunmuyor ya da bu destek kapatılmış. 3D düzenleyiciyi kullanmak için
        güncel bir Chrome, Edge, Firefox veya Safari sürümü deneyin ve donanım hızlandırmanın açık olduğundan emin olun.
      </p>
      <p>Katalog, kayıtlı tasarımlar ve “Fotoğrafta dene” bölümü WebGL olmadan da çalışır.</p>
      <a className="btn btn--primary" href="#/">Kataloğa dön</a>
    </section>
  );
}
