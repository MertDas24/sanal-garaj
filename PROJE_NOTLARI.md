# Proje Notları — Sanal Garaj

Bu dosya projenin çalışma günlüğüdür. Her çalışma oturumunun sonunda tarihli bir kayıt eklenir; önceki kayıtlar
silinmez. Şifre, erişim anahtarı veya başka gizli bilgi bu dosyaya yazılmaz.

**Bağlantılar**
- Depo: https://github.com/MertDas24/sanal-garaj
- Canlı site: https://mertdas24.github.io/sanal-garaj/

---

## 2026-10-12 — 1. oturum: ilk sürüm

**Katkı:** Bu oturumdaki tüm araştırma, mimari, kod, model işleme, test ve yayınlama işleri Claude (ana geliştirici)
tarafından yapıldı. **Codex bu ortamda kullanılamadı** (Codex CLI kurulu değil, bağlı bir Codex aracı/eklentisi
yok); bu yüzden Codex’e görev verilemedi. Kod inceleme, test, erişilebilirlik ve performans kontrolleri Claude
tarafından otomatik testler ve ekran görüntüsü incelemeleriyle yapıldı. Codex bağlandığında önerilen görevler
aşağıda “Sonraki adımlar” bölümündedir.

### Tamamlanan işler
- React 19 + TypeScript + Vite + Three.js/React Three Fiber ile statik web uygulaması (Türkçe arayüz, koyu tema).
- 25 araçlık katalog: arama, kategori filtreleri, “yalnızca 3D modeli olanlar” filtresi.
- **19 araç için gerçek, lisansı doğrulanmış 3D model**; 6 araç “3D model bekleniyor” olarak işaretli ve açılmıyor.
- 3D düzenleyici: döndürme/yakınlaştırma/kamera sıfırlama, gövde rengi, parlak/mat/metalik, jant rengi,
  3 jant tasarımı, −40…+40 mm sürüş yüksekliği, spoiler ve ön lip (desteklenen modellerde), önce/sonra karşılaştırma.
- Kaydetme (cihazda, localStorage), paylaşım bağlantısı (doğrulanan ve sınırlanan parametreler), alt yazılı PNG indirme.
- “Fotoğrafta dene”: tarayıcı içinde sihirli değnek + fırça ile seçim ve gölgeleri koruyan yeniden renklendirme.
- “Kendi modelin”: yerel .glb görüntüleme (yüklenmez, harici istekler engellenir, 50 MB sınırı).
- Model işleme hattı (`scripts/build-models.mjs`): indirme, temizleme, kanonik malzeme adları, gerçek ölçüye
  ölçekleme, yönlendirme, meshopt sıkıştırma, manifest ve CREDITS.md üretimi.
- Testler: 14 birim testi (vitest), 16 uçtan uca test (Playwright, masaüstü + mobil) — hepsi geçiyor.
- GitHub Actions: lint + birim test + derleme + uçtan uca test → GitHub Pages’e yayın.

### Kararlar ve gerekçeleri
- **Statik site, sunucu/hesap/veritabanı yok:** ilk sürüm kapsamı için gerekmiyor; ücretsiz ve bakım gerektirmez.
- **GitHub Pages:** GitHub hesabı zaten bağlıydı, ücretsiz, Actions ile otomatik yayın. Hash tabanlı yönlendirme
  sunucu ayarı gerektirmez.
- **Modeller depoda:** sıkıştırılmış 19 model toplam ≈ 2,9 MB; Git LFS veya CDN gereksiz.
- **Model kaynağı Poly Pizza:** hesap gerektirmeden indirilebilen, lisansı (CC BY 3.0) sayfada açıkça belirtilen,
  gerçek araç adlı modeller burada bulundu. Sketchfab’da daha kaliteli CC BY modeller var ama indirme için hesap
  belirteci gerekiyor (aşağıya bakın).
- **Katalog ve model dosyaları ayrı:** `src/data/catalog.ts` (marka/model/yıl) ↔ `scripts/model-sources.mjs`
  (dosya, lisans, malzeme eşlemesi). Bir model iki araçta kullanılamaz (birim testi denetler).
- **Malzeme ayrıştırması doğrulandı:** her modelde boyanacak alan macenta vurgulanarak üç açıdan görsel kontrol
  yapıldı; cam, lastik, far ve tamponlar boyanmıyor. Gövde rengi doku paletinde olan iki modelde (Range Rover,
  AE86) gövde üçgenleri UV hücresine göre ayrı malzemeye bölündü. Jant malzemesini gövdeyle paylaşan modellerde
  (L200, Hilux) jant rolü yalnızca tekerlek düğümlerine uygulandı.
- **Modifikasyonlar modele göre sınırlı:** tekerlekleri gövdeyle tek parça olan modellerde yükseklik/jant kapalı
  ve nedeni yazılıyor. Spoiler/lip yalnızca yerleşimi görsel olarak doğrulanan 9 modelde açık; parçalar
  uygulamanın ürettiği genel tasarımlar olduğu arayüzde belirtiliyor.
- **Fotoğraf düzenleme yerel:** dış servis kurulmadan sahte “otomatik algılama” düğmesi gösterilmedi.

### Reddedilen / kullanılmayan modeller (neden)
- Ferrari 458 (three.js örnek deposu): özgün Sketchfab sayfası kaldırılmış, lisans doğrulanamadı.
- Poly Pizza “Ferrari F40”: kabin yapısı F40’a uymuyor.
- Poly Pizza “MK Golf”: aşırı stilize, gerçek oranlara uymuyor (Golf Mk1 bu yüzden modelsiz).
- “1975 Bricklin SV1”: sahnede araçla ilgisiz nesneler; “Camaro SS LP”: malzemeler boş; “Taxi”, “Endurance Race
  Car”: belirli bir gerçek araç değil; jacobleee05 “Camaro”: başka bir yazarın modelinin kopyası.

### Kullanılan 3D model kaynakları
Tamamı Poly Pizza, **CC BY 3.0**, **ücretsiz** (satın alma yapılmadı). Tam liste: `CREDITS.md`.

| Araç | Kaynak başlık | Yazar |
|---|---|---|
| Dodge Challenger SRT (2015) | 2015 Dodge Challenger | Grzybek |
| DeLorean DMC-12 | DeLorean DMC-12 | David Sirera |
| Mini Cooper (klasik) | Low Poly Mini Cooper | Gilang Romadhan |
| Rolls-Royce klasik coupe | Rolls Royce | David Sirera |
| Dodge Charger (2. nesil) | Dodge Charger | David Sirera |
| Mitsubishi L200 | Mitsubishi L200 | Muhammad Reyhan |
| Chevrolet Camaro ZL1 (2017) | Camaro ZL1 2017 | Kris Tong |
| Toyota Hilux (1997) | Toyota Hilux 97 | Muhammad Reyhan |
| Range Rover Classic | Range Rover | IvOfficial |
| Mazda3 Hatchback | Sports Hatchback | ReppenThe303 |
| Tesla Cybertruck | Cybertruck | Mobolaji |
| Mazda RX-7 (FC) | Mazda RX-7 | IvOfficial |
| Toyota Sprinter Trueno (AE86) | Toyota AE86 | IvOfficial |
| Ford Model T | Ford Model T | Bruno Oliveira |
| Nissan Skyline GT-R (R34) | Nissan GTR | David Sirera |
| Nissan 180SX | 1994 Nissan 180MX | Grzybek |
| Jeep Wrangler Unlimited (JK) | Mom's Wrangler | Anonim (Poly by Google arşivi) |
| Nissan Terrano (1. nesil) | Terrano | Muhammad Reyhan |
| Chevrolet Camaro (5. nesil) | Chevrolet Camaro | PuKkBuMXDD |

Not: Rolls-Royce modelinin hangi model olduğu kaynakta belirtilmiyor; Jeep modelinin yazarı “Anonymous”.
Marka/tasarım hakları dosya lisansından ayrıdır; arayüzde marka uyarısı var.

### Karşılaşılan sorunlar
- Sketchfab indirme API’si hesap belirteci istiyor (401) → hesapsız indirme yapılamadı.
- React StrictMode’da efekt temizliği 3D nesneyi boşaltıyor ve önbelleği temizleyip yarış durumu yaratıyordu
  (araç ara sıra görünmüyordu) → temizlik yıkıcı olmayan ve ertelenmiş hale getirildi.
- Bazı modellerde ön/arka yönü ve palet hücreleri yanlış tahmin edilmişti → görsel kontrolle düzeltildi.

### Eksikler (tamamlanamayanlar)
- 6 katalog aracında model yok: Toyota Corolla Sedan, BMW 3 Serisi (G20), Mercedes-Benz C-Serisi (W206),
  Volkswagen Passat (B8), Fiat Egea Sedan, Volkswagen Golf (1. nesil).
- Modeller düşük poligonlu; “gerçekçi” görünüm için daha yüksek kaliteli modeller gerekir.
- Fotoğrafta otomatik araç/gövde algılama yok (harici servis gerektirir, kurulmadı).

### Seçenekler ve maliyetler (onay bekleyen — hiçbir satın alma yapılmadı)
1. **Sketchfab (ücretsiz, hesap gerekli):** Ücretsiz bir Sketchfab hesabı açıp API belirtecini yalnızca yerelde
   `.env.local` içinde tutarsanız, eksik araçlar için CC BY modeller indirilebilir. Ön araştırmada bulunan
   **doğrulanmamış** adaylar (her birinin “oyundan çıkarılmış” olmadığı ayrıca kontrol edilmeli):
   - Volkswagen Passat B8 — “low-poly Volkswagen Passat B8” (D_U), CC BY, ~12,6 bin yüz
   - Fiat Egea — “Fiat Egea” (SuperScriptDEV2), CC BY, ~397 bin yüz (sadeleştirme gerekir)
   - BMW 3 Serisi G20 — “2020_bmw_m340i_xdrive” (007), CC BY, ~104 bin yüz
   - Volkswagen Golf Mk1 — “Volkswagen Golf mk1 [Tuning]” (Black Snow), CC BY, ~250 bin yüz
   - Toyota Corolla — bulunan CC BY adaylar farklı nesiller (E180 2014, E80); 2019 sedan için uygun aday yok
   - Mercedes C-Serisi W206 — uygun CC BY aday bulunamadı (yalnızca W202/W203)
2. **Ücretli model mağazaları (CGTrader, TurboSquid, Sketchfab Store):** tahmini araç başına 15–150 USD;
   25 araç için kabaca 400–3.750 USD. Dikkat: standart lisansların çoğu ham dosyanın yeniden dağıtımını yasaklar;
   web’de GLB olarak sunmak dosyayı indirilebilir kılar, bu yüzden “gerçek zamanlı/web uygulaması” kullanımına
   izin veren lisans gerekir. Fiyat ve koşullar satın almadan önce tek tek doğrulanmalı.
3. **Fotoğrafta otomatik gövde algılama:** küçük bir sunucu aracı (ör. Cloudflare Worker, ücretsiz katman) +
   segmentasyon modeli sunan bir API (ör. Replicate üzerinde SAM tabanlı model). Tahmini maliyet görüntü başına
   ~0,001–0,01 USD. Veri akışı: kullanıcı açıkça “Otomatik algıla”ya basarsa fotoğraf sunucu aracına → API’ye
   gider, maske geri döner, saklanmaz. API anahtarı yalnızca sunucu aracında tutulur, tarayıcıya konmaz.

### Sonraki adımlar
- Sizden: Sketchfab hesabı/belirteci veya ücretli model bütçesi kararı; fotoğraf için harici servis kararı.
- Codex bağlanırsa önerilen sınırlı görevler (her biri ayrı dosyalarda, çakışmasız):
  1. Erişilebilirlik incelemesi — `src/components/EditorPanel.tsx`, `src/styles.css`; kabul: axe taramasında
     kritik hata yok, tüm kontroller klavyeyle kullanılabilir.
  2. Performans incelemesi — `src/three/*`; kabul: mobilde 30+ FPS, sayfadan çıkınca GPU belleği serbest.
  3. Test genişletme — `tests/e2e/`; kabul: her katalog aracı için yükleme duman testi.
  4. Dokümantasyon kontrolü — `README.md`; kabul: kurulum adımları temiz bir makinede birebir çalışıyor.

### Yayın doğrulaması (2026-10-12)
- Depo oluşturuldu: https://github.com/MertDas24/sanal-garaj (herkese açık; GitHub Pages ücretsiz planda bunu gerektirir).
- GitHub Pages “GitHub Actions” kaynağıyla etkinleştirildi. İlk iş akışında lint, birim testleri, derleme ve
  uçtan uca testler (CI’da Chromium) geçti; site yayınlandı.
- Canlı site https://mertdas24.github.io/sanal-garaj/ gerçek tarayıcıyla (masaüstü + mobil görünüm) açıldı:
  25 katalog kartı, 19 “3D model hazır”, paylaşım bağlantısıyla düzenleyici (AE86, mavi metalik) doğru yüklendi,
  sayfa hatası veya 4xx/5xx yanıt yok.
- Not: GitHub, kullanılan bazı Actions sürümlerinin Node.js 20 tabanlı olduğu için uyarı veriyor; şu an çalışıyor,
  ileride eylem sürümleri güncellenmeli.


---

## 2026-10-12 — 2. oturum: gerçekçilik, yeni araçlar, otomatik seçim, Codex devri

**Katkı:** Claude (ana geliştirici). Codex bu oturumda kullanılmadı; Claude’un limiti dolduğunda devralması için
`AGENTS.md` hazırlandı.

### Kullanıcı kararları (bu oturumun başında)
1. Modeli olmayan 6 araç şimdilik olduğu gibi kalacak; mümkünse başka araçlar eklenecek.
2. **Hiçbir şeye ücret ödenmeyecek** (portfolyo projesi).
3. Fotoğraf için otomatik algılama yazılabiliyorsa yazılacak, ücretli servis kullanılmayacak.
4. Codex, Claude’un limiti dolunca devreye girecek. Modeller ücretsiz yollarla daha gerçekçi hale getirilecek.

### Tamamlanan işler
- **10 yeni araç** (katalog 25 → 35, gerçek modelli araç 19 → 29) ve **AE86’nın yüksek detaylı modele geçirilmesi**.
  Yeni modeller Sketchfab yazarlarının CC BY 4.0 modelleri (aşağıdaki tablo).
- **Görüntü kalitesi:** Poly Haven CC0 HDRI ortam ışığı, masaüstünde yansıtıcı zemin, temas gölgesi, renkli yarı
  saydam cam, gerçekçi lastik malzemesi, orijinal (dokulu) jantların korunması; düşük poligonlu modellerde boya
  yüzeylerine keskin kenarları koruyan yumuşak normaller (35°). Mobilde daha hafif zemin ve piksel oranı.
- **Fotoğrafta otomatik seçim (ücretsiz, sunucusuz):** MediaPipe Image Segmenter + DeepLab v3 tarayıcıda çalışır;
  araç maskesi içinde baskın boya rengini ton açısına göre seçer, çoğunluk filtresiyle boşlukları kapatır.
  Model (2,7 MB) ve WASM (≈13 MB) bu siteden yüklenir; fotoğraf hiçbir yere gönderilmez (uçtan uca testle
  doğrulandı). CC0 test fotoğraflarında (AMC Rebel, Peugeot iOn) gövde büyük ölçüde doğru seçildi.
- **Model hattı:** .gltf + dış dosya indirme (yol güvenliği kontrolüyle), gömülü kaynak adresi doğrulaması,
  meshoptimizer ile sadeleştirme, WebP doku sıkıştırma (sharp), düğüme sınırlı malzeme rolleri
  (`malzeme@düğüm`), malzemeye göre tekerlek bulma (stepne otomatik hariç), tek düğümdeki 4 tekerleği
  çeyreklere bölme.
- `AGENTS.md`: Codex için kurallar, komutlar, model ekleme ve görsel doğrulama adımları.
- Testler: 15 birim + 17 uçtan uca test geçiyor (yeni: otomatik seçimin dış istek atmadığı testi).

### Kararlar ve gerekçeleri
- **Sketchfab’a hesapsız erişim:** Sketchfab indirme için hesap ister. Bunun yerine, Sketchfab dışa aktarımlarının
  GitHub’daki herkese açık kopyaları kullanıldı (CC BY yeniden dağıtıma izin verir). Güvence için: (1) dosyanın
  içindeki gömülü kaynak adresi Sketchfab kaydıyla eşleşmeli, (2) lisans Sketchfab API’sinden “CC Attribution”
  olarak doğrulanmalı, (3) oyun kaynağı ibaresi (NFS, Forza, GTA, Assetto…) ve aktarma şüphesi olan hesaplar
  (Mona x Supercars, DisneyCars, Lexyc16, Black Snow) elendi.
- **Bölütleme için DeepLab v3 (MediaPipe):** Apache 2.0, küçük, tamamen istemci tarafı; SegFormer gibi
  alternatiflerin ağırlık lisansları ticari olmayan kullanımla sınırlı olabildiği için tercih edilmedi.
- **AE86:** aynı araç için yüksek detaylı model bulunduğundan düşük poligonlu model kaldırıldı (bir araç = bir model).
- **Golf Mk1 ve diğer 5 araç** kullanıcı isteğiyle beklemede.

### Yeni 3D model kaynakları (Sketchfab, CC BY 4.0, ücretsiz)
| Araç | Kaynak başlık | Yazar |
|---|---|---|
| Mercedes-Benz E-Serisi (W212) | Mercedes E Class W212 | Peter_D |
| Toyota Corolla (E180) | 2014 Toyota Corolla E180 EU (with interior) | Armored Wave |
| Mercedes-Benz C 63 AMG (W204) | Mercedes Benz C63 AMG | LuizZed36 |
| Toyota Crown Sedan Super Deluxe | Toyota Crown Super Deluxe Mild Hybrid | Andrasfi Games |
| Toyota Prius (XW30) | Toyota Prius 2012 | Doz3 |
| Mercedes-Benz 300 CE (C124) | Mercedes w124 300ce | timmiethizz |
| BMW M3 (E30) | [FREE] BMW M3 E30 | Martin Trafas |
| Toyota Land Cruiser (J200) | Toyota_land_cruiser | Jean Wally’s™ |
| Porsche 911 Turbo (930) | FREE 1975 Porsche 911 (930) Turbo | Lionsharp Studios |
| Mercedes-Benz 300 SL Gullwing | Mercedes-Benz 300sl Gullwing | vecarz |
| Toyota Sprinter Trueno (AE86) | Toyota AE86 Sprinter Trueno Zenki | Martin Trafas |
Diğer: Poly Haven “Autoshop 01” HDRI (Oliksiy Yakovlyev, CC0); MediaPipe DeepLab v3 (Google, Apache 2.0).
Maliyet: 0 TL.

### Kaynak açıklaması kontrolü (yayından önce)
Kullanılan her Sketchfab modelinin açıklaması API’den okunup “yeniden yükleme / oyundan aktarma / başkasının
modeli” ibaresi için kontrol edildi. Sonuç: W212, Corolla E180, Crown, 930 Turbo, AE86, M3 E30, Prius ve 300 SL
(vecarz stüdyosu) özgün çalışma olarak tanımlanıyor; C 63 AMG, 300 CE ve Land Cruiser açıklamasız (olumsuz ibare
yok). **Çıkarılanlar:** “2000 Audi A4” (açıklamada “Free REUPLOAD” — asıl kaynak belirsiz) ve “Honda Integra (DB8)”
(dışarıda bırakılan Lexyc16 hesabının modelinden türetilmiş). Bu iki araç katalogdan da kaldırıldı.

### Elenen adaylar (neden)
- Toyota Supra (Willy Decarpentrie): dosyada renk/doku bilgisi kayıp. Porsche 911 (Philipp Busse): tüm araç tek
  doku atlasında, gövde ayrılamıyor. Toyota Corolla E70: boya dokuya gömülü. “Porsche Macan - Kaban”: karikatür.

### Karşılaşılan sorunlar
- Sketchfab API saatlik hız sınırı (429): 604 adayın yalnızca ilk 200’ü doğrulanabildi; kalanlar (VW, Lamborghini,
  Ferrari, Tesla, Jeep, Land Rover, Volvo, Dodge, Mini vb.) sonraki oturumda.
- Land Cruiser’da ön ızgara gövdeyle aynı parçada (gövde rengini alır; arayüzde not var); jantlar farklı
  malzemelerde olduğu için jant seçenekleri kapalı.

### Eksikler
- 18 araç hâlâ düşük poligonlu modelle (görüntü iyileştirmeleriyle) gösteriliyor.
- 6 araç modelsiz (beklemede).

### Sonraki adımlar (Claude veya Codex)
1. Sketchfab doğrulamasını kalan ~400 aday için tamamla (yavaş tempo: istek başına ≥1,5 sn; 429’da bekle).
   Betikler bu oturumda geçici klasördeydi; mantık `AGENTS.md` ve bu kayıtta anlatılıyor.
2. Mevcut düşük poligonlu araçların (Challenger, Charger, Camaro, R34, RX-7, Cybertruck, Wrangler, Range Rover…)
   yüksek detaylı CC BY karşılıklarını bul, aynı kurallarla değiştir.
3. Fotoğraf otomatik seçiminde ön/arka uç kenarlarını iyileştir (maske kenarında renk tabanlı büyütme).
4. GitHub Actions eylem sürümlerini Node 24 uyumlu sürümlere güncelle.
