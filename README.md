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
| Katalogdaki araç | **26** (8 sedan, 3 hatchback, 6 coupe, 2 SUV/arazi, 7 spor) |
| Gerçek, lisansı doğrulanmış 3D modeli olan | **26 (tamamı)** — hepsi yüksek detaylı (19 bin – 300 bin üçgen), Sketchfab yazarlarının CC BY 4.0 modelleri |
| Model boyutu | 0,4 – 4,3 MB (toplam ≈ 57 MB; yalnızca seçilen araç indirilir) |
| Fotogerçekçi görüntü | Işık izleme (path tracing) ile stüdyo fotoğrafı kalitesinde kare; tarayıcıda, ücretsiz |

Her araç kendi modelini kullanır; aynı model başka bir araç için gösterilmez. Katalog veri yapısı modelsiz araçları
da destekler (“3D model bekleniyor” olarak işaretlenir, düzenleyicide açılmaz); şu an böyle bir araç yok. Modifikasyonlar yalnızca modelin gerçekten desteklediği yerde açıktır
(ör. tekerlekleri gövdeyle tek parça olan modellerde yükseklik ve jant ayarı kapalıdır ve nedeni yazılır).

## Özellikler

- **Katalog:** arama (marka/model/yıl), kategori filtreleri, “yalnızca 3D modeli olanlar” filtresi.
- **3D düzenleyici:** döndürme, yakınlaştırma, kamerayı sıfırlama; yükleme ilerlemesi ve hata/yeniden deneme.
- **Boya:** hazır renkler + özel renk, parlak/mat/metalik yüzey. Boya yalnızca gövde malzemesine uygulanır;
  cam, lastik, far vb. etkilenmez (her modelde görsel olarak doğrulandı).
- **Jantlar:** jant rengi, yüzeyi ve tasarımı — jantı ayrı malzeme olan modellerde.
- **Tasarım atölyesi:** orijinal + 6 eklenti jant tasarımı (5 kollu, çok kollu, çanak, petek, türbin, çift 6 kollu),
  saten/krom/mat jant yüzeyi ve eklenti jant çapı (%85–115; lastik içine sığacak şekilde sınırlanır).
- **Tekerlek duruşu:** uygun dört tekerlek bulunan modellerde genişlik (%90–115), dışa açılma (0–25 mm), ön/arka
  kamber (−8°–0°). Merkezler lastik geometrisinden ölçülür; tekerlek ve eklenti jant aynı dönüşümü izler.
- **Kaplama:** tek/çift yarış şeridi, kaput/tavan kaplama ve özel kaplama rengi. Geometri yalnızca `CG_paint`
  yüzeylerine projekte edilir; cam/trim kaplanmaz. Uygun yüzey bulunmayan seçenekler gerekçesiyle kapalıdır.
- **Aero ve ışık:** eklenti kanatta Spor/GT/alçak tasarım, splitter uzantısı (%80–150), özel renkli LED alt
  aydınlatma. Işık izlemede LED şeritleri ışık yayan geometri olarak hesaplanır.
- **Çalışma akışı:** 50 adım geri al/ileri al (Ctrl/Cmd+Z, Shift+Z veya Ctrl/Cmd+Y), modifikasyon listesi ve TXT
  indirme, sürümlü JSON tasarım dosyası dışa/içe aktarma (128 KB sınırı; yalnızca cihazda işlenir).
  Kaydedilen tasarımlar seçilen HDRI ortamını da geri açar. Yedi hazır paket fabrika ayarlarından başlar.
- **Motor ve aktarma parça planı:** 45 kategoride motor değişimi, ECU, piston/biyel/krank/eksantrik/supap,
  turbo/kompresör, emme/intercooler/basınç kontrolü, yakıt/ateşleme/nitro, egzoz, soğutma/yağlama,
  şanzıman/debriyaj/diferansiyel/şaft ve elektrikli dönüşüm seçenekleri. Seçimler geri al, kayıt, paylaşım,
  JSON ve modifikasyon listesinde korunur. Elektrikli planda içten yanmalı parçalar kapatılır.
  Ayrı Motor 3D atölyesi bu planın prosedürel şemasını canlı gösterir; araca özgü gerçek motor modeli,
  güç/tork kazancı veya araç uyumluluğu hesaplamaz.
- **Motor 3D atölyesi:** araç ekranındaki “Motor 3D atölyesi” veya motor panelindeki “Motoru 3D incele”
  ile açılır. Sıralı/V/rotary/elektrikli düzen, piston-biyel-krank, turbo/kompresör ve motor/batarya sayısı
  seçime göre değişir. 45 kategorinin şematik parça kartları seçilebilir; altın değişiklik, yeşil seçim,
  gri fabrika/değişiklik yok durumudur. Parça kartları montaj konumu veya ölçü/üretim şablonu değildir.
  İç parça/ayrıştırılmış görünüm, üç kamera, klavye kontrolü ve şematik PNG çıktısı bulunur.
  Animasyon başlangıçta durur, isteğe bağlı çalışır ve sekme gizlenince durur; gösterilen hız gerçek devir değildir.
  Doğrulanmamış fabrika motoruna düzen uydurulmaz; kullanıcı bir düzen seçebilir. Paylaşım bağlantısındaki
  `motor3d=1` aynı motor planıyla atölyeyi açar. Kod/geometri proje MIT lisansıyla üretildi; harici motor
  dosyası veya ücretli hizmet kullanılmaz. Görüntüleyici yalnızca atölye açılınca indirilir.
- **Siteyi paylaş:** katalog ve Hakkında sayfasındaki düğme kalıcı, halka açık GitHub Pages bağlantısını
  kopyalar veya cihazın paylaşım menüsünü açar. Kullanıcı hesabı ve ücretli hizmet gerekmez.
- **Kamera:** altı kamera seçeneği etkileşimli ve fotogerçekçi modda kullanılabilir. 3D görünüme odaklanınca
  ok tuşları döndürür, +/− yakınlaştırır, Home sıfırlar. Renk/jant seçimlerinde ok tuşları ve Home/End desteklenir.
- **Sürüş yüksekliği:** −40 mm … +40 mm — tekerlekleri ayrı parça olan modellerde.
- **Aero parçalar:** arka kanat spoiler ve ön lip (uygulamanın ürettiği genel parçalar; yerleşimi her modelde
  gövdeye ışın atılarak bulunur ve görsel olarak doğrulandı). Chevrolet Camaro’nun kendi spoileri açılıp kapatılabilir.
- **Önce / Sonra:** aynı kamera açısından, kaydırılabilir ayırıcıyla orijinal ve düzenlenmiş görünüm.
- **Kaydet:** tasarımlar tarayıcı depolamasında (cihazda) tutulur; hesap yok.
- **Paylaş:** tüm ayarlar bağlantıya yazılır (`#/arac/<id>?p=…&f=…`). Gelen değerler doğrulanır, sınırlanır ve
  modelin desteklemediği seçenekler yok sayılır.
- **Görüntü indir:** aracın adı ve CC BY atfı alt yazılı PNG.
- **Artırılmış gerçeklik (AR):** düzenleyicideki AR bölümü mevcut tasarımı gerçek boyutunda kamera görüntüsüne
  yerleştirir. Android Chrome’da WebXR (zemin algılama, dokunarak yerleştirme/taşıma, ±15° döndürme), iPhone/iPad
  Safari’de AR Quick Look (tasarım cihazda USDZ’ye dönüştürülür). Desteklemeyen cihazda düğme gerekçesiyle kapalıdır.
  Tüm cihazlarda mevcut tasarım GLB veya USDZ olarak indirilebilir; dönüşüm tarayıcıda yapılır, dosya gönderilmez.
  Dosyalar model atfını taşır (GLB düğüm verisi); paylaşırken CC BY atfı korunmalıdır.
- **Fotogerçekçi görüntü:** düzenleyicideki “Fotogerçekçi görüntü” düğmesi, seçili açıyı ışık izleme
  (three-gpu-pathtracer, MIT) ile hesaplar: stüdyo fonu, tepe ışığı (softbox), HDRI ortam ışığı, gerçek
  yansıma ve yumuşak gölgeler. Görüntü saniyeler içinde belirir ve 300 örneğe kadar netleşir (ekran kartına göre
  ~10 sn – 2 dk). Bu moddayken “Görüntü indir” ışık izlenmiş kareyi indirir.
- **Etkileşimli görüntü:** HDRI oto atölyesi ortam ışığı (Poly Haven, CC0), yansıtıcı zemin (masaüstü), temas
  gölgesi, yarı saydam renkli cam, gerçekçi lastik/jant malzemeleri.
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
  three/pathTrace.ts            # fotogerçekçi mod: ışık izleme, stüdyo fonu ve tepe ışığı
  lib/design.ts                 # tasarım türü, doğrulama, paylaşım kodlaması
  pages/                        # katalog, düzenleyici, tasarımlarım, fotoğraf, kendi modelin, kaynaklar
scripts/copy-ml.mjs             # MediaPipe WASM dosyalarını public/ml/wasm altına kopyalar (dev/build öncesi otomatik)
src/lib/autoSelect.ts           # fotoğrafta otomatik araç/gövde seçimi
public/models/                  # sıkıştırılmış GLB dosyaları (toplam ≈ 57 MB)
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
  sayfasında. Tüm modeller [Sketchfab](https://sketchfab.com) yazarlarının **CC BY 4.0** modelleridir. Sketchfab
  hesap gerektirdiği için dosyalar, Sketchfab dışa aktarımının GitHub’daki herkese açık kopyalarından indirilir;
  her kopyanın içine gömülü kaynak adresi Sketchfab kaydıyla karşılaştırılır, lisans Sketchfab API’sinden
  doğrulanır ve model açıklaması yeniden yükleme / oyundan aktarma ibaresine karşı incelenir. Hiçbir ücret
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

**Model dosyalarının barındırılması:** sıkıştırılmış (meshopt + WebP doku) modellerin toplamı ≈ 57 MB, en büyüğü
4,3 MB; GitHub’ın dosya başına 100 MB ve depo önerisi 1 GB sınırlarının çok altında olduğu için doğrudan depoda ve
Pages üzerinde tutulur. Git LFS veya ücretli CDN gerekmez. Ham kaynak dosyalar (`.model-cache/`) depoya girmez.

## Bilinen sınırlamalar

- Proje görsel kişiselleştirme ve parça planlama aracıdır. Motor/aktarma seçenekleri plan olarak saklanır;
  motor içi 3D görünüm, sürüş fiziği, iç mekân kitleri ve far geometrisi değişimi
  henüz uygulanmaz; gerekçeleri arayüzde görünür. AE86, M3 E30 ve C 63 W204 için özgün yan etek,
  difüzör, çamurluk/ön tampon uzantıları ve egzoz uçları hazırlanmıştır. Orijinal tampon/egzoz korunur;
  bunlar görsel eklentidir, OEM kit veya fiziksel montaj şablonu değildir.
  Bunlar için ayrı hazırlanmış, lisansı doğrulanmış parça geometrisi ve/veya fizik/uyumluluk verisi gerekir.
- Kamber ve dışa açılma mekanik uygunluk ya da çamurluk çakışmasını hesaplamaz. Kaput/tavan kaplaması yaklaşık
  geometrik bölgeyi kullanır; modeldeki bütün panel sınırları semantik olarak tanımlı değildir.
- Prius ve Passat dahil güvenilir olmayan tekerlek ölçümlerinde eklenti jant tasarımı ve duruş ayarları kapanır;
  desteklenen jant rengi korunur. Aynı dosyadaki dokulu dekor (ör. Hudson) boya/kaplama altında korunabilir.
- Fotoğrafta otomatik seçim deneyseldir: aracı bulur ve baskın boya rengini seçer; ön/arka uçlarda eksik kalan
  bölgeler fırçayla tamamlanabilir. Çok renkli (ör. iki tonlu) araçlarda yalnızca baskın renk seçilir.
- Tasarımlar yalnızca o tarayıcıda saklanır; cihazlar arası eşitleme yoktur (paylaşım bağlantısı ve JSON dosyası kullanılabilir).

## Gelişmiş atölye ve portfolyo

- Kaplama genişliği/konumu/açısı, kaput/tavan/kapı yazısı ve yerel logo. Logo PNG/JPEG/WebP olabilir
  (girdi en fazla 2 MB); cihazda 128 px PNG’ye dönüştürülür (en fazla 16 KB). Küçük görsel veri URL,
  kayıt ve JSON'a dahil edilir; paylaşım bağlantısı uzayabilir. Yükleme sunucuya gönderilmez.
- Aynı aracın kayıtlı A/B tasarımlarını tek kamera, ortak ortam ve fark listesiyle karşılaştırma.
- Fotoğraf stüdyosu: 1280/1920/2560 px yeniden render, 16:9/1:1/4:5, dört açı panosu ve
  960×600 alt yazılı 6 saniye WebM tur videosu. PNG boyuna model atıf şeridi eklenir.
  Stüdyo etkileşimli sahneyi kullanır; ışık izleme çıktısı mevcut Görüntü indir düğmesinden alınır.
- Motor planı tutarlılığı: ECU/yakıt/aktarma/elektrikli dönüşüm bağımlılıkları. AE86 ve M3 E30
  temel motor kayıtları üretici kaynaklarına bağlıdır; bilinmeyen araçta fabrika motoru tahmin edilmez.
  “Çelişki yok” ifadesi montaj uyumluluğu anlamına gelmez. Güç artışı hesaplanmaz.
- Otomatik/hafif/yüksek grafik profili, WebGL bağlam kaybında anlaşılır yeniden deneme, radyo
  kontrollerinde tek Tab durağı ve ok tuşları. Kalite otomatiği cihaz ipuçlarına dayanır; FPS garantisi yok.
- Hakkında sayfasında mimari akışı, teknik kararlar, gerçek tur videosu ve tarihlenmiş ölçüm dosyası.
  Düzenleyicide oturum ölçümü JSON olarak indirilebilir; destekleyen tarayıcıda yaklaşık JS heap ölçümü
  de alınır. Bu değer toplam RAM/GPU belleği değildir; kaynak adetleri de GPU bellek baytı değildir.

Ölçümü ve demoyu yeniden üretmek için önizleme sunucusu açıkken `npm run benchmark -- http://localhost:4173`
çalıştırın (yerel Chrome; `PW_CHANNEL` değiştirilebilir). Sonuç `public/benchmarks/workshop.json`, video ve
poster `public/demo/` altına yazılır. Yerel sunucu ölçümü internet/mobil performansını temsil etmez.
Üretilen kit kodu proje MIT lisansındadır; mevcut araç modellerinin CC BY şartları çıktılarda korunur.

Kaplama projeksiyonu kutu dışındaki üçgenleri kesmeden önce eler; kamera hareketlerinde aynı tasarımın
malzeme/matris hazırlığı tekrarlanmaz. Fotogerçekçi sahnenin BVH kurulumu yerel Web Worker'da yapılır;
hazırlık iptal edilince worker kapatılır. İlk araç çizimi paralel shader hazırlığını bekler; yazılımsal GPU
algılanırsa otomatik profil hafif görünümü seçer. Elle seçilen yüksek profil korunur. GPU gölgelendirici
derlemesi ve gerçek ışık izleme hâlâ cihaz gücüne ve paralel derleme desteğine bağlıdır.
Kesme hesabını ayrı ölçmek için Node 24 ile `node scripts/benchmark-decals.mjs` çalıştırılabilir:
115.200 üçgenli sentetik yüzeyde eski/yeni yöntemlerin beş tur ortancasıdır; tüm site hızını ölçmez.

### Windows üzerinde uçtan uca test

Playwright'ın istediği Chromium sürümü kurulu değilse PowerShell'de `$env:PW_CHANNEL='chrome'; npm run e2e`
ile yerel Chrome kullanılabilir. Derleme `pree2e` aşamasında yapılır, önizleme sunucusu doğrudan Vite ile açılır.
Kısıtlı bir ortamda test sunucusunun kapanışı takılırsa `npm run build` sonrasında ayrı terminalde
`node node_modules/vite/bin/vite.js preview --port 4173 --strictPort` çalıştırın; testler mevcut sunucuyu kullanır.
