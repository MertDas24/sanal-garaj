# Sanal Garaj — 3D araç kişiselleştirme

Tarayıcıda çalışan, hesap gerektirmeyen bir otomobil kişiselleştirme uygulaması. Bir araç seçin, gerçek zamanlı 3D
olarak döndürüp inceleyin; gövde rengini, yüzeyi (parlak/mat/metalik), jant rengini ve jant modelini, sürüş
yüksekliğini ve desteklenen araçlarda spoiler/ön lip parçalarını değiştirin. Tasarımınızı cihazınıza kaydedin,
bağlantı olarak paylaşın veya PNG olarak indirin.

- **Canlı site:** https://mertdas24.github.io/sanal-garaj/
- **Depo:** https://github.com/MertDas24/sanal-garaj

## Durum (dürüst özet)

| | |
|---|---|
| Katalogdaki araç | **35** (sedan, hatchback, coupe, SUV, spor, pick-up) |
| Gerçek, lisansı doğrulanmış 3D modeli olan | **29** — 11’i yüksek detaylı (Sketchfab, CC BY 4.0), 18’i düşük poligonlu (Poly Pizza, CC BY 3.0) |
| 3D modeli olmayan (düzenleyicide açılmaz) | 6 — Toyota Corolla Sedan (2019–), BMW 3 Serisi (G20), Mercedes-Benz C-Serisi (W206), Volkswagen Passat (B8), Fiat Egea Sedan, Volkswagen Golf (1. nesil) |
| Model boyutu | 18 KB – 4,3 MB (toplam ≈ 26 MB; yalnızca seçilen araç indirilir) |

Her araç kendi modelini kullanır; aynı model başka bir araç için gösterilmez. Modeli olmayan araçlar katalogda
“3D model bekleniyor” olarak işaretlidir. Modifikasyonlar yalnızca modelin gerçekten desteklediği yerde açıktır
(ör. tekerlekleri gövdeyle tek parça olan modellerde yükseklik ve jant ayarı kapalıdır ve nedeni yazılır).

## Özellikler

- **Katalog:** arama (marka/model/yıl), kategori filtreleri, “yalnızca 3D modeli olanlar” filtresi.
- **3D düzenleyici:** döndürme, yakınlaştırma, kamerayı sıfırlama; yükleme ilerlemesi ve hata/yeniden deneme.
- **Boya:** hazır renkler + özel renk, parlak/mat/metalik yüzey. Boya yalnızca gövde malzemesine uygulanır;
  cam, lastik, far vb. etkilenmez (her modelde görsel olarak doğrulandı).
- **Jantlar:** jant rengi ve 3 jant tasarımı (5 kollu, çok kollu, çanak) — jantı ayrı malzeme olan modellerde.
- **Sürüş yüksekliği:** −40 mm … +40 mm — tekerlekleri ayrı parça olan modellerde.
- **Aero parçalar:** arka kanat spoiler ve ön lip (uygulamanın ürettiği genel parçalar; yerleşimi her modelde
  gövdeye ışın atılarak bulunur ve görsel olarak doğrulandı). Chevrolet Camaro’nun kendi spoileri açılıp kapatılabilir.
- **Önce / Sonra:** aynı kamera açısından, kaydırılabilir ayırıcıyla orijinal ve düzenlenmiş görünüm.
- **Kaydet:** tasarımlar tarayıcı depolamasında (cihazda) tutulur; hesap yok.
- **Paylaş:** tüm ayarlar bağlantıya yazılır (`#/arac/<id>?p=…&f=…`). Gelen değerler doğrulanır, sınırlanır ve
  modelin desteklemediği seçenekler yok sayılır.
- **Görüntü indir:** aracın adı ve CC BY atfı alt yazılı PNG.
- **Gerçekçi görüntü:** HDRI oto atölyesi ortam ışığı (Poly Haven, CC0), yansıtıcı zemin (masaüstü), temas
  gölgesi, yarı saydam renkli cam, gerçekçi lastik/jant malzemeleri; düşük poligonlu modellerde gövde yüzeyleri
  keskin kenarları koruyarak yumuşatılır.
- **Fotoğrafta dene:** kendi fotoğrafınızda aracı **otomatik seçme (deneysel)** veya sihirli değnek + fırça ile
  seçme, gölgeleri koruyarak yeniden renklendirme. Otomatik seçim tarayıcıda çalışan bir bölütleme modeliyle
  (MediaPipe + DeepLab v3, Apache 2.0) yapılır; model bu siteden yüklenir, **fotoğraf hiçbir yere gönderilmez**,
  ücretli servis yoktur. Fotoğraftan 3D model üretmez.
- **Kendi modelin:** yerel `.glb` dosyasını yalnızca tarayıcıda açma, döndürme ve seçilen malzemeyi boyama
  (en fazla 50 MB, tek dosya; Draco/KTX2 desteklenmez; dosya içinden harici adreslere istek engellenir).
- **WebGL yoksa** anlaşılır bir mesaj gösterilir. Türkçe arayüz, klavye ile erişilebilir kontroller, mobil düzen.

## Teknoloji

React 19 + TypeScript + Vite, Three.js / React Three Fiber / drei. Sunucu, veritabanı veya hesap sistemi yok;
site tamamen statiktir. Modeller [glTF-Transform](https://gltf-transform.dev/) ile işlenip
[meshopt](https://github.com/zeux/meshoptimizer) ile sıkıştırılır. Yalnızca seçilen aracın modeli indirilir;
3D kütüphanesi de katalog sayfasında yüklenmez (ayrı paket).

## Kurulum ve çalıştırma

Gereksinim: Node.js 22 veya üzeri.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # üretim derlemesi -> dist/
npm run preview      # derlemeyi yerelde sun
```

Ortam değişkeni veya gizli anahtar gerekmez. `.env.example` yalnızca isteğe bağlı geliştirme araçlarını açıklar.

### Testler

```bash
npm run lint         # oxlint
npm test             # birim testleri (vitest): doğrulama, paylaşım bağlantısı, katalog/model kayıtları
npm run e2e          # uçtan uca testler (Playwright, masaüstü + mobil); ilk seferde: npx playwright install chromium
PW_CHANNEL=chrome npm run e2e   # kurulu Chrome ile
```

Uçtan uca testler katalog, arama/filtre, yalnızca seçilen modelin indirilmesi, boya/jant/yükseklik/parçalar,
geçersiz paylaşım değerlerinin sınırlanması, paylaşım bağlantısı, PNG indirme, kaydet/aç/sil, önce/sonra,
WebGL yok mesajı, fotoğrafın dışarı gönderilmemesi, yerel GLB ve mobil yatay taşma kontrollerini kapsar.

## Proje yapısı

```
scripts/
  model-sources.mjs     # 3D model kaynak kayıtları (indirme adresi, yazar, lisans, malzeme eşlemesi)
  build-models.mjs      # indir → temizle → kanonik adlandır → ölçekle → sıkıştır; manifest + CREDITS.md üretir
  render-thumbs.mjs     # katalog küçük resimlerini uygulamanın kendi görüntüleyicisiyle üretir
  inspect-models.mjs    # GLB dosyalarının malzeme/düğüm dökümü
src/
  data/catalog.ts               # marka/model kataloğu (model dosyalarından bağımsız)
  data/models.generated.json    # üretilmiş model manifesti (boyut, üçgen, lisans, desteklenen özellikler)
  three/carRuntime.ts           # modeli kanonik adlara göre hazırlar, tasarımı uygular
  three/addons.ts               # spoiler, ön lip, jant tasarımları
  three/CarViewer.tsx           # R3F sahnesi, önce/sonra çizimi, ekran görüntüsü
  lib/design.ts                 # tasarım türü, doğrulama, paylaşım kodlaması
  pages/                        # katalog, düzenleyici, tasarımlarım, fotoğraf, kendi modelin, kaynaklar
scripts/model-sources-sketchfab.mjs  # yüksek detaylı (Sketchfab) model kayıtları
scripts/copy-ml.mjs             # MediaPipe WASM dosyalarını public/ml/wasm altına kopyalar (dev/build öncesi otomatik)
src/lib/autoSelect.ts           # fotoğrafta otomatik araç/gövde seçimi
public/models/                  # sıkıştırılmış GLB dosyaları (toplam ≈ 26 MB)
public/env/                     # HDRI ortam ışığı
public/ml/                      # DeepLab v3 modeli (WASM derlemede kopyalanır)
public/thumbs/                  # katalog küçük resimleri
lab/                            # yalnızca geliştirme: model inceleme sayfası ve ekran görüntüsü betikleri
```

## Yeni araç / model ekleme

Katalog ile model dosyaları ayrı yönetilir.

1. **Kaynağı ve lisansı doğrulayın.** Yalnızca yeniden dağıtıma izin veren lisanslar (CC0, CC BY) ve yazarı belli
   kaynaklar. Oyunlardan çıkarılmış (“ripped”) veya lisansı belirsiz dosyaları kullanmayın.
2. **`scripts/model-sources.mjs`** dosyasına bir kayıt ekleyin: `id`, `download`, `source` (başlık, yazar, site,
   adres, lisans), `rotateY` (önü +Z’ye çevirir), `lengthM` (gerçek uzunluk). Malzeme adlarını görmek için:
   `node scripts/inspect-models.mjs <klasör> <ad-listesi.json>`.
3. **Malzeme rollerini eşleyin:** `materials.paint` (gövde), `glass`, `tire`, `rim`. Tekerlekler ayrı düğümse
   `wheelNodes`. Gövde rengi doku paletindeyse `paletteSplit`. Araca ait olmayan parçalar için `removeNodes`.
4. `npm run models -- <id>` ile derleyin. Betik, malzeme/düğüm bulunamazsa veya yön hatalı görünürse hata verir.
5. **Görsel doğrulama:** `npx vite --port 5199` çalışırken
   `node lab/shoot.mjs lab-out /models/<id>.glb:CG_paint` → boyanacak alan macenta görünür; camın, lastiğin,
   farların boyanmadığını kontrol edin. Jant için `:CG_rim`.
6. Eklenti parça desteğini (`mods.spoiler`, `mods.frontLip`) yalnızca görsel kontrol sonrası açın.
7. **`src/data/catalog.ts`** içinde aracı ekleyin veya mevcut aracın `modelId` alanını doldurun.
8. Küçük resim: `node scripts/render-thumbs.mjs <id>`; ardından `npm test` (kayıt tutarlılığı) ve `npm run e2e`.

`CREDITS.md` ve uygulamadaki “Kaynaklar” sayfası manifestten otomatik güncellenir.

## Lisanslar ve atıflar

- **Kod:** MIT (bkz. `LICENSE`).
- **3D modeller:** her biri kendi lisansıyla — tam liste [CREDITS.md](CREDITS.md) ve uygulamadaki “Kaynaklar”
  sayfasında. Düşük poligonlu modeller [Poly Pizza](https://poly.pizza) (CC BY 3.0); yüksek detaylı modeller
  [Sketchfab](https://sketchfab.com) yazarlarının **CC BY 4.0** modelleridir. Sketchfab hesap gerektirdiği için
  dosyalar, Sketchfab dışa aktarımının GitHub’daki herkese açık kopyalarından indirilir; her kopyanın içine gömülü
  kaynak adresi Sketchfab kaydıyla karşılaştırılır ve lisans Sketchfab API’sinden doğrulanır. Hiçbir ücret
  ödenmemiştir. Düzenleyicide ve indirilen görsellerde ilgili modelin atfı gösterilir.
- **Ortam ışığı:** Poly Haven “Autoshop 01” (CC0). **Bölütleme modeli:** MediaPipe DeepLab v3 (Apache 2.0).
- Marka ve model adları ilgili şirketlere aittir; proje bu şirketlerle bağlantılı değildir.

## Yardımcı ajanlar (Codex)

Codex veya başka bir kodlama ajanı için kurallar, komutlar ve görev listesi [AGENTS.md](AGENTS.md) dosyasındadır.

## Yayınlama

Site statiktir; `dist/` klasörü herhangi bir statik barındırmada çalışır (hash tabanlı yönlendirme, `base: './'`).

**GitHub Pages (kurulu yöntem):** `.github/workflows/deploy.yml` her `main` gönderiminde lint, birim testleri,
derleme ve uçtan uca testleri çalıştırır; hepsi geçerse `dist/` klasörünü GitHub Pages’e yayınlar.
Depo ayarlarında *Settings → Pages → Source: GitHub Actions* seçili olmalıdır.

**Model dosyalarının barındırılması:** sıkıştırılmış (meshopt + WebP doku) modellerin toplamı ≈ 26 MB, en büyüğü
4,3 MB; GitHub’ın dosya başına 100 MB ve depo önerisi 1 GB sınırlarının çok altında olduğu için doğrudan depoda ve
Pages üzerinde tutulur. Git LFS veya ücretli CDN gerekmez. Ham kaynak dosyalar (`.model-cache/`) depoya girmez.

## Bilinen sınırlamalar

- 18 araç hâlâ düşük poligonlu modelle gösterilir (görüntü iyileştirmeleriyle); yüksek detaylı CC BY karşılıkları
  bulundukça değiştirilecek (bkz. `PROJE_NOTLARI.md`).
- 6 katalog aracının uygun modeli yoktur.
- Fotoğrafta otomatik seçim deneyseldir: aracı bulur ve baskın boya rengini seçer; ön/arka uçlarda eksik kalan
  bölgeler fırçayla tamamlanabilir. Çok renkli (ör. iki tonlu) araçlarda yalnızca baskın renk seçilir.
- Tasarımlar yalnızca o tarayıcıda saklanır; cihazlar arası eşitleme yoktur (paylaşım bağlantısı kullanılabilir).
