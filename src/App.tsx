import { lazy, Suspense, useEffect } from 'react';
import { useRoute } from './lib/router';
import { Header } from './components/Header';
import { CatalogPage } from './pages/CatalogPage';
import { CreditsPage } from './pages/CreditsPage';
import { SavedPage } from './pages/SavedPage';
import { AboutPage } from './pages/AboutPage';

// 3D içeren sayfalar ayrı paketlerde: katalog açılırken Three.js indirilmez
const EditorPage = lazy(() => import('./pages/EditorPage'));
const CustomModelPage = lazy(() => import('./pages/CustomModelPage'));
const PhotoPage = lazy(() => import('./pages/PhotoPage'));

export default function App() {
  const route = useRoute();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.name]);

  return (
    <div className="app">
      <a className="skip-link" href="#icerik" onClick={(event) => { event.preventDefault(); document.getElementById('icerik')?.focus(); }}>İçeriğe geç</a>
      <Header route={route} />
      <main id="icerik" tabIndex={-1} className={route.name === 'editor' ? 'main main--editor' : 'main'}>
        <Suspense fallback={<div className="page-loading" role="status">Yükleniyor…</div>}>
          {route.name === 'catalog' && <CatalogPage />}
          {route.name === 'editor' && <EditorPage key={route.vehicleId} vehicleId={route.vehicleId} query={route.query} />}
          {route.name === 'saved' && <SavedPage />}
          {route.name === 'photo' && <PhotoPage />}
          {route.name === 'custom' && <CustomModelPage />}
          {route.name === 'credits' && <CreditsPage />}
          {route.name === 'about' && <AboutPage />}
          {route.name === 'notfound' && (
            <section className="page empty-state">
              <h1>Sayfa bulunamadı</h1>
              <p>Aradığınız sayfa mevcut değil.</p>
              <a className="btn btn--primary" href="#/">Kataloğa dön</a>
            </section>
          )}
        </Suspense>
      </main>
    </div>
  );
}
