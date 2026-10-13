import { useEffect, useMemo, useState } from 'react';
import { CATALOG, CATEGORY_LABELS, modelName, type Category } from '../data/catalog';
import { findModel, modelUrl, thumbUrl } from '../data/models';
import { cachedPaths, useOnline } from '../lib/pwa';
import { editorHash } from '../lib/router';
import { ProjectShare } from '../components/ProjectShare';

const ALL = 'all' as const;

function normalize(s: string) {
  return s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function CatalogPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | typeof ALL>(ALL);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const online = useOnline();
  const [cached, setCached] = useState<Set<string>>(() => new Set());
  useEffect(() => { let alive = true; cachedPaths().then((paths) => { if (alive) setCached(paths); }); return () => { alive = false; }; }, [online]);

  const available = CATALOG.filter((v) => findModel(v.modelId)).length;

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return CATALOG.filter((v) => {
      if (category !== ALL && v.category !== category) return false;
      if (onlyAvailable && !findModel(v.modelId)) return false;
      if (!q) return true;
      return normalize(`${v.make} ${v.model} ${v.modelEn ?? ''} ${v.year} ${CATEGORY_LABELS[v.category]}`).includes(q);
    }).sort((a, b) => Number(!!findModel(b.modelId)) - Number(!!findModel(a.modelId)));
  }, [query, category, onlyAvailable]);

  return (
    <section className="page catalog">
      <div className="catalog__intro">
        <h1>Aracını seç, garajda kişiselleştir</h1>
        <p className="muted">
          Katalogda {CATALOG.length} araç var; bunların <strong>{available}</strong> tanesi için lisansı doğrulanmış
          gerçek 3D model mevcut.
          {available < CATALOG.length && ' Diğerleri uygun model bulunana kadar düzenlenemez.'}{' '}
          <a href="#/kaynaklar">Model kaynakları ve lisanslar</a>
        </p>
      </div>

      <div className="garage-intro" aria-label="Garajda neler yapabilirsiniz">
        <div><span className="eyebrow">SENİN ARACIN. SENİN İMZAN.</span><h2>Fabrika çıkışından kendi tasarımına.</h2><p className="muted">Boya ve kaplama, jant ve duruş, aero parçalar, LED ışık; motor ve aktarma parça planı. Tasarla, karşılaştır, dosya olarak sakla ve paylaş.</p></div>
        <div className="row"><a className="btn btn--primary" href="#/arac/toyota-ae86?p=f2f2f0&rs=split6&w=double&wc=%23b3121b&s=1&ss=gt&l=1&pc=c&h=-20&cf=-2&cr=-1.5">Örnek tasarımı keşfet</a><ProjectShare /></div>
      </div>

      <div className="filters" role="search">
        <label className="field field--search">
          <span className="sr-only">Araç ara</span>
          <input
            type="search"
            placeholder="Marka, model veya yıl ara…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="chips" role="group" aria-label="Kategori">
          <button className="chip" aria-pressed={category === ALL} onClick={() => setCategory(ALL)}>Tümü</button>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
            <button key={c} className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        {available < CATALOG.length && (
          <label className="toggle">
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
            <span>Yalnızca 3D modeli olanlar</span>
          </label>
        )}
      </div>

      <p className="muted results-count" aria-live="polite">{`${results.length} araç listeleniyor`}</p>

      {results.length === 0 ? (
        <div className="empty-state">
          <h2>Sonuç yok</h2>
          <p>Aramanızı veya filtreleri değiştirmeyi deneyin.</p>
          <button className="btn" onClick={() => { setQuery(''); setCategory(ALL); setOnlyAvailable(false); }}>Filtreleri temizle</button>
        </div>
      ) : (
        <ul className="grid">
          {results.map((v) => {
            const model = findModel(v.modelId);
            const title = `${v.make} ${modelName(v)}`;
            const offlineReady = !!model && cached.has(new URL(modelUrl(model), location.href).pathname);
            const inner = (
              <>
                <div className="card__media">
                  {model ? (
                    <img src={thumbUrl(model)} alt="" loading="lazy" width={480} height={300} />
                  ) : (
                    <div className="card__placeholder" aria-hidden="true">
                      <svg width="56" height="56" viewBox="0 0 32 32"><path d="M4 20l3-7a4 4 0 0 1 3.7-2.5h10.6A4 4 0 0 1 25 13l3 7v5H4z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
                    </div>
                  )}
                  <span className="badge">{CATEGORY_LABELS[v.category]}</span>
                </div>
                <div className="card__body">
                  <h2 className="card__title" translate="no">{title}</h2>
                  <p className="card__meta" translate="no">{v.year}</p>
                  {model ? (
                    <p className="card__status card__status--ok">3D model hazır{offlineReady ? <span className="card__offline"> · Çevrimdışı hazır</span> : !online ? <span className="card__offline card__offline--no"> · Çevrimdışı açılamaz</span> : null}</p>
                  ) : (
                    <p className="card__status card__status--missing">3D model bekleniyor</p>
                  )}
                </div>
              </>
            );
            return (
              <li key={v.id} className={model ? 'card' : 'card card--disabled'}>
                {model ? (
                  <a className="card__link" href={editorHash(v.id)} aria-label={`${title}, ${v.year} — düzenleyicide aç`}>{inner}</a>
                ) : (
                  <div className="card__link" aria-label={`${title}, ${v.year} — 3D model henüz yok`}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
