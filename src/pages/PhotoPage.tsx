import { useCallback, useEffect, useRef, useState } from 'react';
import { floodSelect, paintMask, recolor } from '../lib/recolor';
import { downloadBlob } from '../lib/image';
import { PAINT_SWATCHES } from '../lib/design';
import { useToast } from '../components/useToast';
import { detectCar, selectBodyPaint } from '../lib/autoSelect';

// "Fotoğrafta dene": kullanıcının fotoğrafı cihazdan çıkmaz. Seçim (otomatik algılama, sihirli değnek,
// fırça) ve yeniden renklendirme tamamen tarayıcıda yapılır. Otomatik algılama modeli bu siteden yüklenir.

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_SIDE = 1600;
type Tool = 'wand' | 'brush' | 'erase';

export default function PhotoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const srcRef = useRef<ImageData | null>(null);
  const outRef = useRef<ImageData | null>(null);
  const maskRef = useRef<Uint8Array | null>(null);
  const drawing = useRef(false);
  const [loaded, setLoaded] = useState<{ w: number; h: number; name: string } | null>(null);
  const [tool, setTool] = useState<Tool>('wand');
  const [tolerance, setTolerance] = useState(18);
  const [brush, setBrush] = useState(24);
  const [color, setColor] = useState('#1d4fb8');
  const [strength, setStrength] = useState(0.9);
  const [showMask, setShowMask] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const carMaskRef = useRef<Uint8Array | null>(null);
  const [auto, setAuto] = useState<'idle' | 'loading' | 'done'>('idle');
  const [autoTol, setAutoTol] = useState(22);
  const { toast, show } = useToast();

  const render = useCallback(() => {
    const c = canvasRef.current, src = srcRef.current, out = outRef.current, mask = maskRef.current;
    if (!c || !src || !out || !mask) return;
    const g = c.getContext('2d')!;
    if (showOriginal) { g.putImageData(src, 0, 0); return; }
    recolor(src, mask, color, strength, out);
    if (showMask) {
      const d = out.data;
      for (let p = 0; p < mask.length; p++) {
        if (!mask[p]) continue;
        const a = (mask[p] / 255) * 0.35, i = p * 4;
        d[i] += (40 - d[i]) * a; d[i + 1] += (220 - d[i + 1]) * a; d[i + 2] += (255 - d[i + 2]) * a;
      }
    }
    g.putImageData(out, 0, 0);
  }, [color, strength, showMask, showOriginal]);

  useEffect(render, [render, selected]);

  const countMask = () => {
    const m = maskRef.current;
    let n = 0;
    if (m) for (let i = 0; i < m.length; i++) if (m[i] > 127) n++;
    setSelected(n);
  };

  const onFile = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setError('Yalnızca JPEG, PNG veya WebP fotoğraf yükleyebilirsiniz.'); return; }
    if (file.size > MAX_BYTES) { setError('Fotoğraf 25 MB’den büyük olamaz.'); return; }
    try {
      const bmp = await createImageBitmap(file);
      const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
      const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
      const c = canvasRef.current!;
      c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true })!;
      g.drawImage(bmp, 0, 0, w, h);
      bmp.close();
      srcRef.current = g.getImageData(0, 0, w, h);
      outRef.current = g.createImageData(w, h);
      maskRef.current = new Uint8Array(w * h);
      carMaskRef.current = null;
      setAuto('idle');
      setSelected(0);
      setLoaded({ w, h, name: file.name.replace(/\.[^.]+$/, '') });
    } catch {
      setError('Fotoğraf açılamadı. Dosya bozuk veya desteklenmeyen biçimde olabilir.');
    }
  };

  const toImage = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.round(((e.clientX - r.left) / r.width) * e.currentTarget.width),
      y: Math.round(((e.clientY - r.top) / r.height) * e.currentTarget.height),
      scale: e.currentTarget.width / r.width,
    };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const src = srcRef.current, mask = maskRef.current;
    if (!src || !mask || showOriginal) return;
    const { x, y, scale } = toImage(e);
    if (x < 0 || y < 0 || x >= src.width || y >= src.height) return;
    if (tool === 'wand') {
      const n = floodSelect(src, x, y, tolerance, mask);
      if (n < 20) show('Çok küçük bir alan seçildi; toleransı artırmayı deneyin.', 'error');
      countMask();
      return;
    }
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    paintMask(mask, src.width, src.height, x, y, brush * scale, tool === 'erase');
    render();
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !srcRef.current || !maskRef.current) return;
    const { x, y, scale } = toImage(e);
    paintMask(maskRef.current, srcRef.current.width, srcRef.current.height, x, y, brush * scale, tool === 'erase');
    render();
  };
  const onUp = () => {
    if (drawing.current) { drawing.current = false; countMask(); }
  };

  const clearMask = () => { maskRef.current?.fill(0); countMask(); };

  const applyAuto = (tol: number) => {
    const src = srcRef.current, mask = maskRef.current, car = carMaskRef.current;
    if (!src || !mask || !car) return;
    const r = selectBodyPaint(src, car, tol, mask);
    countMask();
    return r;
  };

  const runAuto = async () => {
    const src = srcRef.current;
    if (!src) return;
    setAuto('loading');
    try {
      carMaskRef.current = await detectCar(src);
      const r = applyAuto(autoTol);
      if (!r || r.carPixels < 500) {
        setAuto('idle');
        show('Fotoğrafta araç algılanamadı. Sihirli değnek veya fırçayla seçebilirsiniz.', 'error');
        return;
      }
      setAuto('done');
      show('Araç gövdesi seçildi. Gerekirse toleransı ayarlayın veya fırçayla düzeltin.');
    } catch (e) {
      console.error(e);
      setAuto('idle');
      show('Otomatik algılama başlatılamadı (tarayıcı desteklemiyor olabilir).', 'error');
    }
  };

  const download = () => {
    const src = srcRef.current, mask = maskRef.current, out = outRef.current;
    if (!src || !mask || !out) return;
    recolor(src, mask, color, strength, out);
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    c.getContext('2d')!.putImageData(out, 0, 0);
    c.toBlob((b) => { if (b) { downloadBlob(b, `${loaded?.name ?? 'foto'}-yeni-renk.png`); show('Görüntü indirildi.'); } }, 'image/png');
  };

  return (
    <section className="page photo">
      <h1>Fotoğraf üzerinde dene</h1>
      <p className="muted">
        Kendi aracınızın fotoğrafını yükleyin, boyalı yüzeyleri seçin ve yeni rengi önizleyin. Fotoğrafınız
        <strong> cihazınızdan çıkmaz</strong>; tüm işlem tarayıcıda yapılır. Bu bir 2D renk değiştirme aracıdır:
        fotoğraftan 3D model üretmez. Gövdeyi otomatik seçtirebilir veya kendiniz seçebilirsiniz.
      </p>

      <div className="photo__layout">
        <div className="photo__stage">
          <canvas
            ref={canvasRef}
            className={loaded ? 'photo__canvas' : 'photo__canvas photo__canvas--empty'}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            aria-label="Fotoğraf düzenleme alanı"
          />
          {!loaded && (
            <label className="dropzone">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onFile(e.target.files?.[0])} />
              <strong>Fotoğraf seç</strong>
              <span className="muted small">JPEG, PNG veya WebP · en fazla 25 MB</span>
            </label>
          )}
          {error && <p className="error" role="alert">{error}</p>}
        </div>

        <div className="panel photo__panel">
          {loaded ? (
            <>
              <section className="panel__section">
                <h2 className="panel__title">1 · Alanı seç</h2>
                <button className="btn" onClick={runAuto} disabled={auto === 'loading'}>
                  {auto === 'loading' ? 'Araç algılanıyor…' : 'Aracı otomatik seç (deneysel)'}
                </button>
                {auto === 'done' && (
                  <label className="range">
                    <span className="range__head"><span className="field-label">Gövde rengi toleransı</span><output>{autoTol}</output></span>
                    <input
                      type="range" min={8} max={50} value={autoTol}
                      onChange={(e) => { const v = Number(e.target.value); setAutoTol(v); applyAuto(v); }}
                    />
                  </label>
                )}
                <p className="muted small">
                  Otomatik seçim tarayıcınızda çalışan bir görüntü bölütleme modeliyle (DeepLab v3) yapılır; ilk
                  kullanımda yaklaşık 16 MB bu siteden indirilir. Fotoğrafınız hiçbir sunucuya gönderilmez.
                </p>
                <div className="segmented" role="radiogroup" aria-label="Seçim aracı">
                  <button role="radio" aria-checked={tool === 'wand'} onClick={() => setTool('wand')}>Sihirli değnek</button>
                  <button role="radio" aria-checked={tool === 'brush'} onClick={() => setTool('brush')}>Fırça</button>
                  <button role="radio" aria-checked={tool === 'erase'} onClick={() => setTool('erase')}>Silgi</button>
                </div>
                {tool === 'wand' ? (
                  <label className="range">
                    <span className="range__head"><span className="field-label">Tolerans</span><output>{tolerance}</output></span>
                    <input type="range" min={4} max={60} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} />
                  </label>
                ) : (
                  <label className="range">
                    <span className="range__head"><span className="field-label">Fırça boyutu</span><output>{brush} px</output></span>
                    <input type="range" min={4} max={80} value={brush} onChange={(e) => setBrush(Number(e.target.value))} />
                  </label>
                )}
                <p className="muted small">
                  {tool === 'wand' ? 'Boyalı yüzeye dokunun; her dokunuş seçime eklenir.' : 'Seçime eklemek veya çıkarmak için fotoğraf üzerinde sürükleyin.'}
                  {' '}Seçili alan: {selected.toLocaleString('tr-TR')} piksel.
                </p>
                <div className="row">
                  <button className="btn btn--small" onClick={clearMask} disabled={!selected}>Seçimi temizle</button>
                  <label className="toggle small">
                    <input type="checkbox" checked={showMask} onChange={(e) => setShowMask(e.target.checked)} />
                    <span>Seçimi vurgula</span>
                  </label>
                </div>
              </section>
              <section className="panel__section">
                <h2 className="panel__title">2 · Rengi seç</h2>
                <div className="swatches" role="radiogroup" aria-label="Yeni renk">
                  {PAINT_SWATCHES.map((s) => (
                    <button key={s.hex} role="radio" aria-checked={color === s.hex} className="swatch" style={{ background: s.hex }} aria-label={s.name} title={s.name} onClick={() => setColor(s.hex)} />
                  ))}
                </div>
                <label className="color-input">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                  <span>Özel renk <code>{color.toUpperCase()}</code></span>
                </label>
                <label className="range">
                  <span className="range__head"><span className="field-label">Etki</span><output>%{Math.round(strength * 100)}</output></span>
                  <input type="range" min={0.2} max={1} step={0.05} value={strength} onChange={(e) => setStrength(Number(e.target.value))} />
                </label>
              </section>
              <div className="panel-actions">
                <button
                  className="btn"
                  aria-pressed={showOriginal}
                  onClick={() => setShowOriginal((v) => !v)}
                >
                  {showOriginal ? 'Yeni rengi göster' : 'Orijinali göster'}
                </button>
                <button className="btn btn--primary" onClick={download} disabled={!selected}>Görüntü indir</button>
                <label className="btn btn--ghost file-btn">
                  Başka fotoğraf
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onFile(e.target.files?.[0])} />
                </label>
              </div>
            </>
          ) : (
            <section className="panel__section">
              <h2 className="panel__title">Nasıl çalışır?</h2>
              <ol className="steps small">
                <li>Aracınızın net, iyi ışıklı bir fotoğrafını seçin.</li>
                <li>“Aracı otomatik seç” veya “Sihirli değnek” ile boyalı yüzeyleri seçin; fırça ve silgiyle düzeltin.</li>
                <li>Yeni rengi seçin; gölgeler ve yansımalar korunur.</li>
                <li>Sonucu PNG olarak indirin.</li>
              </ol>
              <p className="muted small">
                İsterseniz aracı otomatik seçtirebilirsiniz; algılama da tamamen tarayıcınızda çalışır.
              </p>
            </section>
          )}
        </div>
      </div>
      {toast}
    </section>
  );
}
