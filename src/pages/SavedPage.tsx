import { useState } from 'react';
import { findVehicle } from '../data/catalog';
import { encodeDesignFull } from '../lib/design';
import { editorHash } from '../lib/router';
import { deleteSaved, loadSaved, renameSaved, type SavedDesign } from '../lib/storage';
import { findEnv } from '../three/scenes';

// Düzenleyici açılınca ayarlar modelin desteklediği seçeneklere göre yeniden doğrulanır.
const openHash = (s: SavedDesign) => {
  const q = encodeDesignFull(s.design);
  q.set('env', findEnv(s.environment).id);
  return editorHash(s.vehicleId, q);
};

export function SavedPage() {
  const [items, setItems] = useState(loadSaved);
  const [editing, setEditing] = useState<string | null>(null);

  const refresh = () => setItems(loadSaved());

  return (
    <section className="page">
      <h1>Tasarımlarım</h1>
      <p className="muted">
        Tasarımlar yalnızca bu cihazda, tarayıcı depolamasında saklanır. Tarayıcı verilerini silerseniz veya başka bir
        cihaz kullanırsanız görünmezler; kalıcı paylaşım için “Bağlantıyı paylaş” özelliğini kullanın.
      </p>
      {items.length === 0 ? (
        <div className="empty-state">
          <h2>Henüz kayıtlı tasarım yok</h2>
          <p>Katalogdan bir araç seçin, düzenleyin ve “Kaydet” düğmesine basın.</p>
          <a className="btn btn--primary" href="#/">Kataloğa git</a>
        </div>
      ) : (
        <ul className="grid">
          {items.map((s) => {
            const v = findVehicle(s.vehicleId);
            return (
              <li key={s.id} className="card">
                <a className="card__link" href={openHash(s)}>
                  <div className="card__media">
                    {s.thumb ? <img src={s.thumb} alt="" width={320} height={200} /> : <div className="card__placeholder" />}
                  </div>
                </a>
                <div className="card__body">
                  {editing === s.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const name = String(new FormData(e.currentTarget).get('name') ?? '').trim().slice(0, 80);
                        if (name) renameSaved(s.id, name);
                        setEditing(null);
                        refresh();
                      }}
                    >
                      <label className="sr-only" htmlFor={`ad-${s.id}`}>Tasarım adı</label>
                      <input id={`ad-${s.id}`} name="name" defaultValue={s.name} maxLength={80} autoFocus />
                      <button className="btn btn--small" type="submit">Kaydet</button>
                    </form>
                  ) : (
                    <h2 className="card__title">{s.name}</h2>
                  )}
                  <p className="card__meta">{v ? `${v.make} ${v.model}` : 'Katalogda olmayan araç'}</p>
                  <div className="card__actions">
                    <a className="btn btn--small btn--primary" href={openHash(s)}>Aç</a>
                    <button className="btn btn--small" onClick={() => setEditing(s.id)}>Yeniden adlandır</button>
                    <button
                      className="btn btn--small btn--danger"
                      onClick={() => {
                        if (window.confirm(`“${s.name}” silinsin mi?`)) { deleteSaved(s.id); refresh(); }
                      }}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
