# AGENTS.md — Sanal Garaj (Codex ve diğer kodlama ajanları için devir notu)

Bu dosya, projede çalışacak yardımcı ajanlar (ör. Codex) içindir. Ana geliştirici Claude’dur; Claude’un kullanım
limiti dolduğunda Codex aynı kurallarla devam eder. Önce `README.md` ve `PROJE_NOTLARI.md` dosyalarını okuyun.

## Ürün kuralları (pazarlık konusu değil)
- **Hiçbir ücretli hizmet, satın alma veya abonelik kullanılmaz.** Proje bir portfolyo çalışmasıdır.
- **Gizli anahtar yok:** tarayıcı koduna, depoya veya `PROJE_NOTLARI.md` dosyasına anahtar/şifre yazılmaz.
- **Dürüstlük:** sahte 3D görüntü, başka aracın modelini gösteren katalog kartı veya çalışmayan düğme yok.
  Desteklenmeyen seçenek gizlenmez; gerekçesiyle kapalı gösterilir.
- **Lisans:** yalnızca CC0 veya CC BY (3.0/4.0) modeller. Kaynağın lisansı herkese açık bir sayfadan doğrulanır
  (Sketchfab için `https://api.sketchfab.com/v3/models/<uid>`), yazar ve adres `scripts/model-sources.mjs` içine
  yazılır. NonCommercial, “Standard/Editorial”, oyundan çıkarılmış (NFS, Forza, GTA, Assetto vb.) veya kaynağı
  belirsiz dosyalar kullanılmaz. Kısa sürede çok sayıda marka aracı yükleyen ve aktarma şüphesi taşıyan hesaplar
  (ör. Mona x Supercars, DisneyCars, Lexyc16, Black Snow) kullanılmaz.
- **Gizlilik:** kullanıcı fotoğrafı ve yüklenen GLB dosyası tarayıcıdan dışarı gönderilmez.
- Arayüz dili **Türkçe** (varsayılan); İngilizce seçeneği vardır. Yeni arayüz metni eklerken `src/i18n/en.ts` sözlüğüne
  İngilizcesini de ekleyin (araç/yazar adları ve kullanıcı içeriği `translate="no"`); `i18n.spec.ts` eksikleri yakalar. Erişilebilirlik: klavye ile kullanılabilir kontroller, `aria-*` etiketleri, görünür odak.

## Komutlar
```bash
npm install
npm run dev            # geliştirme sunucusu
npm run lint           # oxlint
npx tsc -b             # tip kontrolü
npm test               # vitest birim testleri
npm run e2e            # Playwright (ilk kez: npx playwright install chromium) — PW_CHANNEL=chrome ile yerel Chrome
npm run models [-- id] # model işleme hattı → public/models, src/data/models.generated.json, CREDITS.md
node scripts/render-thumbs.mjs [modelId]   # katalog küçük resmi (önce: npx vite --port 5199)
```
Teslim öncesi şunların hepsi geçmeli: `npm run lint`, `npx tsc -b`, `npm test`, `npm run build`, `npm run e2e`.

## Mimari özeti
- Statik site (Vite + React + TypeScript + React Three Fiber). Sunucu/veritabanı/hesap yok. GitHub Pages’e
  `.github/workflows/deploy.yml` ile yayınlanır (testler geçmezse yayın yapılmaz).
- `src/data/catalog.ts` (marka/model/yıl) ile model dosyaları (`scripts/model-sources.mjs`) **ayrıdır**.
- Fotogerçekçi mod: `src/three/pathTrace.ts` (three-gpu-pathtracer). Ayrı bir WebGL bağlamında, stüdyo fonu +
  tepe ışığı + HDRI ile çalışır. Uyarı: `bounces`/`transmissiveBounces` kütüphane varsayılanlarında kalmalı;
  düşük değerler örnek sayısı artsa da kaybolmayan labirent desenli gürültü üretir. Etkileşimli sahnedeki drei
  ortam dokusu da ışık izleyicide bozuk piksel üretir; HDRI ayrıca yüklenir.
- Katalogda yalnızca gerçekçi (yüksek detaylı) modeller kullanılır; düşük poligonlu modeller 2026-10-12’de kaldırıldı.
- Model hattı her modele kanonik adlar verir: düğümler `CG_root > CG_body, CG_wheel_<n>, CG_part_<tür>`;
  malzemeler `CG_paint`, `CG_glass`, `CG_tire`, `CG_rim`. Uygulama (`src/three/carRuntime.ts`) yalnızca bu adlara
  güvenir; boya yalnızca `CG_paint`e uygulanır.
- Tasarım ayarları `src/lib/design.ts` içinde doğrulanır (`sanitizeDesign`); paylaşım bağlantısı buradan kodlanır.
- “Fotoğrafta dene” otomatik seçimi tarayıcıda MediaPipe + DeepLab v3 ile çalışır (`src/lib/autoSelect.ts`);
  model `public/ml/` altında, WASM `scripts/copy-ml.mjs` ile kopyalanır.

## Yeni model ekleme (özet; ayrıntı README’de)
1. Lisansı doğrula → `scripts/model-sources.mjs` kaydı (indirme adresi, kaynak, `rotateY`, `lengthM`,
   malzeme rolleri, tekerlekler için çoğunlukla `autoWheels: [lastik malzemesi]`, gerekirse `simplify`).
   Aday arama: GitHub kod aramasında `"sketchfab.com/3d-models" "CC-BY-4.0" <marka> filename:scene.gltf`;
   her adayın lisansı ve açıklaması `https://api.sketchfab.com/v3/models/<uid>` ile kontrol edilir (yavaş tempo;
   429 yanıtında bekleyin).
2. `npm run models -- <id>`.
3. **Görsel doğrulama zorunlu:** `npx vite --port 5199` açıkken
   `node lab/shoot.mjs lab-out /models/<id>.glb:CG_paint` → macenta alan yalnızca gövde olmalı (cam, lastik,
   far, iç mekân boyanmamalı). `:CG_rim` ile jantları kontrol et. Önü +Z’ye bakmalı (küçük resimde araç önden-
   sağdan görünür).
4. `src/data/catalog.ts` kaydı, `node scripts/render-thumbs.mjs <id>`, testler.

## Çalışma düzeni
- Her oturum sonunda `PROJE_NOTLARI.md` dosyasına **tarihli** bir kayıt ekleyin (eski kayıtları silmeyin):
  yapılanlar, kararlar ve gerekçeleri, sorunlar, eksikler, sonraki adımlar, model kaynak/lisansları.
  Kaydın başında katkıyı belirtin: “Katkı: Codex”.
- Commit mesajları Türkçe ve açıklayıcı olsun. `main` dalına gönderim yayını tetikler; yalnızca testler
  yereldeyken geçtiyse gönderin.
- Claude ile aynı dosyalarda eş zamanlı değişiklik yapmayın; Claude’un devam eden işi `PROJE_NOTLARI.md`
  içindeki son kayıtta “Devam eden iş” başlığı altında yazılıdır.

## Açık görev listesi (öncelik sırasıyla)
`PROJE_NOTLARI.md` dosyasındaki son kaydın “Sonraki adımlar” bölümüne bakın; o liste güncel kaynaktır.
