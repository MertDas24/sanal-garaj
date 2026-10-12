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

### Yayın doğrulaması (2. oturum)
- GitHub Actions: lint/tip/birim/derleme, uçtan uca testler (Chromium) ve Pages yayını başarılı.
- Canlı sitede masaüstü ve mobil görünümde 35 katalog kartı, 29 “3D model hazır”; sayfa hatası ve 4xx/5xx yok.
  BMW M3 (E30) paylaşım bağlantısıyla (mavi, metalik) doğru açıldı. Algılama modeli, WASM ve HDRI dosyaları
  siteden sunuluyor (harici CDN yok).


---

## 2026-10-12 — 3. oturum: “3D model bekleniyor” kartlarının giderilmesi

**Katkı:** Claude.

**Kullanıcı isteği:** “Bazı araçlar hâlâ bekleniyor diyor, düzeltebilirsen düzelt.”

### Yapılanlar
- GitHub’da bu 6 araç için özel arama yapıldı (passat, golf, egea, tipo, g20, m340i, 330i, w206, c-class, corolla 2019/2020/e210).
- **Volkswagen Passat:** “Volkswagen Passat” (I3D, Sketchfab, CC BY 4.0) bulundu ve eklendi. Açıklamada özgün çalışma
  (“One of my first car models”). Model bir 2004 Passat (B5.5) olduğu için katalog kaydı **Passat (B5.5), 2001–2005**
  olarak düzeltildi (B8 değil). Boya ve jant ayrıştırması görsel olarak doğrulandı.
- **Reddedilen:** “VW Golf 2” (glebchik20): tek araç değil, direğe çarpmış hasarlı araçlardan oluşan kaza sahnesi.
  “Wv Golf”: Sketchfab’da kaldırılmış (404).
- **Katalogdan çıkarılanlar:** Toyota Corolla Sedan (2019–), BMW 3 Serisi (G20), Mercedes-Benz C-Serisi (W206),
  Fiat Egea Sedan, Volkswagen Golf (1. nesil). Hesap gerektirmeyen, lisansı doğrulanabilir ücretsiz model yok;
  sahte veya başka aracın modeli gösterilmez, bu yüzden “bekleniyor” kartı yerine katalogdan çıkarıldılar.
  Uygun model bulunursa `src/data/catalog.ts` içine geri eklenebilir (veri yapısı modelsiz araçları hâlâ destekler).
- Modelsiz araç kalmadığında “Yalnızca 3D modeli olanlar” filtresi ve ilgili metinler otomatik gizlenir.

### Durum
- Katalog **30 araç, 30’unda gerçek 3D model** (12 yüksek detaylı, 18 düşük poligonlu). Maliyet: 0 TL.

### Bu araçlar için gelecekte ücretsiz seçenek
- Kullanıcı ücretsiz bir Sketchfab hesabı açıp API anahtarını yalnızca kendi bilgisayarında `.env.local` içinde
  tutarsa, daha önce bulunan CC BY adaylar indirilebilir: “low-poly Volkswagen Passat B8” (D_U), “Fiat Egea”
  (SuperScriptDEV2), “2020_bmw_m340i_xdrive” (007). Her biri yine aynı kaynak/açıklama kontrolünden geçmeli.


---

## 2026-10-12 — 4. oturum: “gerçek gibi duran” modeller ve fotogerçekçi görüntü

**Katkı:** Claude.

**Kullanıcı isteği:** Modeller “gerçek gibi durmuyor”; ücretsiz yollarla gerçekçi hale getirilmesi.

### Yapılanlar
1. **Katalog tamamen yüksek detaylı modellere geçirildi.** Düşük poligonlu (kil maket gibi duran) 18 Poly Pizza
   modeli katalogdan ve depodan kaldırıldı; yerine lisansı doğrulanmış 15 yeni Sketchfab modeli eklendi.
   Katalog: **26 araç, tamamı yüksek detaylı** (8 sedan, 3 hatchback, 6 coupe, 2 SUV/arazi, 7 spor).
2. **Fotogerçekçi görüntü modu:** three-gpu-pathtracer (MIT) ile ışık izleme. Stüdyo fonu (zeminden duvara
   kıvrılan cyclorama, kameranın karşısına döner), tepe ışığı (softbox), HDRI. Ayrı WebGL bağlamında çalışır;
   300 örnek, görüntü adım adım netleşir; “Görüntü indir” bu modda ışık izlenmiş kareyi indirir.
3. Model hattına **otomatik tekerlek ayırma** (lastik malzemesinden 4 tekerlek kümesi + silindir içi üçgenler),
   **dokulu gövde boyama** (paintKeepMap) ve **dokulu gövdeyi düz boyaya çevirme** (paintColor) eklendi.
4. Testler: 15 birim + 18 uçtan uca (yeni: fotogerçekçi mod) geçiyor.

### Sorunlar ve çözümleri
- Işık izlemede örnek sayısı artsa da kaybolmayan labirent desenli gürültü: düşük sekme ayarından (6/4)
  kaynaklanıyordu; kütüphane varsayılanlarına dönüldü.
- Sıkıştırılmış (quantize) köşe verileri ışık izleyicinin BVH’sini bozuyordu: çalışma zamanında float32’ye açılıyor.
- drei’nin ortam dokusu ışık izleyicide bozuk piksel üretiyordu: HDRI ayrıca yükleniyor.

### Yeni modeller (Sketchfab, CC BY 4.0, ücretsiz)
| Araç | Kaynak başlık | Yazar |
|---|---|---|
| Dodge Challenger SRT | ( FREE ) Dodge Challenger SRT | SDC PERFORMANCE™️ |
| Jaguar XJ (X350) | 2005 Jaguar XJ6 TDVi (X350) | Fishboe |
| Aston Martin DB11 V12 | 2017 Aston Martin DB11 | Hari Prasath R |
| Lamborghini Gallardo | Lamborghini Gallardo 2010 | Artem P (fren parçaları: Velstyde) |
| Chevrolet Corvette Stingray (C7) | Chevrolet Corvette (C7) | Martin Trafas |
| Fiat Uno | Fiat Uno 2001 | B.M.A |
| Hyundai Accent (LC) | Hyundai Accent (TaGAZ) 2004 | panderlaike_design |
| Ferrari 488 Pista (geniş gövde) | Ferrari 488 Pista Widebody | Dev365TH |
| Hudson Hornet | 800 Follower Special Hudson Hornet Downloadable | Libau Media |
| Chevrolet Malibu 1965 | '65 Chevy Malibu | Joko_P |
| Willys MB Jeep | Willy Jeep | AnilG |
| Lamborghini Centenario | ( FREE ) Lamborghini Centenario LP-770 | SDC PERFORMANCE™️ |
| Nissan GT-R (R35) | Nissan GTR R35 | Ciasny |
| Honda Civic Type R (FL5) | Custom Honda Civic Type-R (2024) | Jumping Jax |
| Opel Calibra | Opel Calibra 1990 | Luquita |
Maliyet: 0 TL.

### Elenenler (neden)
- Mercedes 300 SL (vecarz): vecarz hesabı başka yazarların modellerini yeniden yayımladığını açıklamalarında
  belirtiyor; bu modelde özgün yazar belirsiz → çıkarıldı.
- 1967 Ford Mustang (Mark Peters): gövde rengi siyah tabanlı dokuya işlenmiş, boya değiştirilemiyor.
- David_Holiday “Dodge Challenger SRT”: SDC modelinin birebir kopyası. Lamborghini Urus (Kapi9526): açıklama
  başka siteden kopya. Kia Sportage (xnova360): kaynak belirsiz. Ayrıca açıklamasız ve aktarma şüphesi olan
  hesaplar (Lexyc16, Black Snow, Mona x Supercars, DisneyCars, Nieve5677) kullanılmadı.

### Bilinen sınırlamalar
- Fotogerçekçi mod ekran kartına göre 10 saniye – 2 dakika sürer (tümleşik Intel GPU’da ~2,5 dk/500 örnek ölçüldü).
- DB11, Fiat Uno, Malibu, Willys, GT-R ve birkaç modelde jant rengi/modeli kapalı (jantlar ayrı malzeme değil).
- Willys’in haki dokusu üzerine uygulanan renkler koyu çıkar; Hudson yarış dekoru boyanın üzerinde kalır.

### Sonraki adımlar
- Kalan adaylardan (Corvette C8, BMW M4, Tesla Model 3/Roadster vb.) açıklaması temiz olanları ekleyerek SUV ve
  hatchback sayısını artırmak.
- Fotogerçekçi mod için kamera açısı önayarları (ön 3/4, yan, arka 3/4).

### Yayın doğrulaması (4. oturum)
- İlk gönderimde CI’daki fotogerçekçi mod testi, ekran kartı olmayan bulut makinesinde (yazılımsal WebGL) zaman
  aşımına uğradı ve yayın otomatik olarak durdu. Test CI için gevşetildi (başlar/kapanır kontrolü; ilerleme
  kontrolü yerelde). Sonraki çalıştırmada tüm adımlar ve Pages yayını başarılı.
- Canlı sitede masaüstü ve mobil: 26 kart, 26’sı “3D model hazır”, hata yok. Aston Martin DB11 için fotogerçekçi
  görüntü canlı sitede ~110 saniyede (tümleşik Intel GPU) tamamlandı.

### Yayın doğrulaması (5. oturum)
- CI: güvenlik taraması, lint, birim, derleme, uçtan uca testler ve Pages yayını başarılı.
- Canlı sitede: 26 araç, CSP etiketi mevcut, Open Graph kapak görseli erişilebilir (200, image/jpeg),
  gün batımı + koyu cam + sarı kaliper + sedef boyalı Gallardo için fotogerçekçi görüntü tamamlandı,
  Hakkında sayfası açılıyor; konsolda CSP ihlali, hata veya 4xx/5xx yanıt yok.

---

## 2026-10-12 — Codex: kayıtlı tasarımların doğrulanması

**Katkı: Codex.** Özel görev verilmediğinden mevcut kaydetme/paylaşma akışı dar kapsamda incelendi. Başlangıçta çalışma ağacı temizdi; son Claude notunda eş zamanlı devam eden iş belirtilmiyordu.

### Tamamlanan işler ve kanıt
- `loadSaved` yalnızca boya rengini doğrulayıp diğer tasarım alanlarını olduğu gibi kabul ediyordu. Örneğin `rimColor: 42` içeren kayıt, `encodeDesignFull` içindeki `.slice(1)` çağrısını bozabiliyordu. Artık kayıtlar bağlantı üretilmeden önce mevcut `sanitizeDesign` ile tamamlanıyor ve doğrulanıyor; geçerli renkler küçük harfe çevriliyor.
- Yükseklik doğrulamasında `Number` yalnızca sayı veya metin için çağrılıyor. `{ toString: null, valueOf: null }` gibi JSON nesneleri istisna üretmiyor; boolean/null değerler sayıya çevrilmiyor.
- Üç regresyon testi: bozuk kayıtların bağlantı üretmesi, geçerli tüm tasarım ayarlarının kayıt → bağlantı → açılış boyunca korunması ve geçersiz yükseklik türlerinin reddedilmesi.
- Mimari korunarak mevcut doğrulayıcı kullanıldı. Model desteği düzenleyicide tekrar doğrulanıyor; kayıt okuma özgün depolamaya yazmıyor.

### Kontroller
- `npm run lint`: başarılı çıkış; `EditorPage.tsx` içinde önceden var olan iki React memoization uyarısı devam ediyor.
- `npx tsc -b`, `npm test` (21 test), `npm run build`, `git diff --check`: geçti.
- `$env:PW_CHANNEL='chrome'; npm run e2e`: son derlemeyle 21/21 test geçti (masaüstü ve mobil; ışık izleme ilerlemesi, kaydet/aç/sil, paylaşım, WebGL yokluğu, fotoğraf gizliliği ve yerel GLB dahil).
- Test çıktısında 21 kontrolün tamamı `ok` oldu; ancak çalıştırıcı testlerden sonra kapanmadı ve sonuç özeti/başarılı çıkış kodu vermedi. Bekleme sonrası Ctrl+C ile durduruldu. Dolayısıyla E2E komutunun temiz çıkışı doğrulanmış sayılmaz; Windows süreç kapanışı ayrıca incelenmeli, gönderim/yayın öncesi komutun normal tamamlanması sağlanmalı.
- Varsayılan Playwright Chromium sürümü 1248 gerekiyor, bilgisayarda 1243 mevcut; kurulu Chrome için `PW_CHANNEL=chrome` kullanıldı. İlk Chrome denemesinde önceki test süreci kapatılırken ortak önizleme sunucusu da durdu ve kalan testlerde `ERR_CONNECTION_REFUSED` oluştu; paket son derlemeyle tek süreçte yeniden çalıştırıldı.

### Kaynaklar, maliyet ve yayın
- Yeni 3D model eklenmedi; kaynak ve lisans kayıtları değiştirilmedi, bu oturumda lisanslar internetten yeniden doğrulanmadı. Maliyet: 0 TL.
- Commit, gönderim veya yayın yapılmadı. Mevcut depo: https://github.com/MertDas24/sanal-garaj ; mevcut site: https://mertdas24.github.io/sanal-garaj/ .

### Eksikler ve sonraki adımlar
- Bu çalışma tüm araçların boya bölgelerini görsel olarak yeniden doğrulamaz; GPU bellek/FPS ölçümü ve tüm katalog araçları için yükleme testi ayrıca yapılabilir.
- Claude için: mevcut memoization uyarıları ayrı dar kapsamlı incelemede değerlendirilebilir. Önceki model çeşitliliği hedefi korunuyor.

---

## 2026-10-12 — Codex: kapsamlı görsel modifikasyon atölyesi ve portfolyo geliştirmesi

**Katkı: Codex.** Kullanıcı görsel modifikasyon kapsamının ve portfolyo değerinin genişletilmesini istedi. Claude'un React/R3F/statik site mimarisi korundu; önceki Codex değişiklikleri silinmedi. Yeni bağımlılık veya servis eklenmedi.

### Tamamlanan işler
- Jant: petek, türbin, çift 6 kollu ile toplam altı eklenti tasarım; krom/saten/mat yüzey; eklenti jant yüzünün %85–115 çap ayarı (lastik iç çapına göre sınırlanır). Orijinal jantın çapı değiştirilmez.
- Duruş: dört güvenilir tekerlekte %90–115 genişlik, 0–25 mm dışa açılma, ayrı ön/arka −8°–0° kamber. Dönme merkezleri lastik geometrisinden ölçülür; eklenti jant aynı merkezi, eğimi ve genişliği izler. Lastiğin düşey izdüşümü dikkate alınır; çamurluk çakışması/fizik simülasyonu yapılmaz.
- Kaplama: tek/çift şerit, kaput/tavan kaplama ve özel renk. Three.js `DecalGeometry` ile yalnızca `CG_paint` üst yüzeylerine projeksiyon yapılır; cam/lastik/trim seçilmez. Geometrisi boş çıkan seçenekler kapalıdır. Kaput/tavan bölgesi yaklaşık geometrik sınırdır, panel bazlı elle hazırlanmış maske değildir.
- Aero: uygulamanın ürettiği kanatta Spor/GT/alçak kanat biçimi, splitter uzantısı %80–150. Modelin kendi spoiler geometrisi değiştirilmez.
- LED: gövde altına ışık yayan şerit geometrisi ve özel renk. Etkileşimli görünümde noktasal ışık, ışık izlemede emissive geometri kullanılır.
- Üç yeni hazır paket (Uzun Yol, Gösteri, Kulüp Sporu); toplam yedi paket. Paket seçimi fabrika tasarımından başlar, önceki paketin artık ayarları taşınmaz.
- 50 adımlık geri al/ileri al ve klavye kısayolları; bölümlere hızlı geçiş; etkin modifikasyon listesi ve TXT indirme.
- Sürüm/katalog doğrulamalı, 128 KB sınırlandırılmış JSON tasarım dosyası indirme/açma. Dosyada tasarım, ortam ve model atfı bulunur; dosya tarayıcıdan dışarı gönderilmez. Kaydedilen tasarımlar artık HDRI ortamını da korur; eski kayıtlarda garaj varsayılanı kullanılır.
- Kamera önayarları etkileşimli sahnede de çalışır; 3D görünüme odaklanınca ok tuşları, +/− ve Home kullanılabilir. Renk/jant/kaplama gruplarında ok tuşları ve Home/End seçimi desteklenir.
- Desteklenmeyen kontroller gizlenmek yerine native disabled fieldset içinde gerekçeleriyle gösterilir. Motor/turbo/ECU, mekanik aktarma, araca özel gövde parçaları ve iç mekân kitleri için eksik veri/geometri açıklandı; güç, fiyat veya uyumluluk sonucu uydurulmadı.
- Katalogda gerçek bir örnek tasarım bağlantısı; Hakkında sayfasında geometri, ürün deneyimi ve gizlilik anlatımı. README güncellendi.

### Bulunan sorunlar, kararlar ve kanıt
- İlk görsel taramada Prius/Passat/Centenario gibi kaynaklarda tekerlek sınırları tutarsızdı; örneğin Centenario'nun arka lastik yarıçapı yaklaşık 0,519 m iken merkez yüksekliği 0,373 m görünüyordu. Dört tekerlek, yarıçap tutarlılığı, dış sınır ve zemine oturma kontrolleriyle eklenti jant/duruş desteği sınırlandı. Jant rengi için mevcut ayrı malzeme desteği korunur.
- Final geometri denetiminde 26 araç yüklendi, sayfa hatası 0; duruş 18 araçta, eklenti jant tasarımı 13 araçta açıldı. Üç temas sayfasındaki 26 ön ¾ görüntü görsel olarak incelendi. Yerel kanıtlar: `lab-out/workshop/audit.json`, `contact-0.png`, `contact-1.png`, `contact-2.png`; bunlar geliştirme çıktısıdır, depoya girmez. Her kombinasyon ve kamera açısı için kapsamlı görsel doğrulama yapılmadı.
- GLTF yükleme hatası önbellekte kalabildiğinden “Tekrar dene” öncesinde `useGLTF.clear` çağrılıyor. 404 → gerçek yeniden indirme testi eklendi.
- Görüntüleyicinin gerektirdiği WebGL 2 kontrol ediliyor; yalnızca WebGL 1 bulunması yanlış başarı sayılmıyor. Işık izleme başlatılırken senkron hatalar da kullanıcı mesajına dönüyor.
- Jant birleştirmesinde geçici non-indexed geometriler de dispose ediliyor. Kaplama geometrileri bir kez hazırlanıp yeniden kullanılıyor; her karede oluşturulmuyor. Yeni parça geometrileri/malzemeleri runtime temizliğine kayıtlı. FPS/GPU bellek için sayısal performans ölçümü yapılmadı.
- Playwright derlemesi `pree2e` aşamasına taşındı; test sunucusu doğrudan Vite ile açılıyor. Kısıtlı Windows ortamında Playwright'ın sahip olduğu sunucuyu kapatma aşaması hâlâ takılabildiğinden ayrı terminalde açılan önizleme sunucusu yeniden kullanıldı; bu yöntemle çalıştırıcı normal sonuç özeti ve çıkış kodu verdi. README'de yöntem yazıldı.

### Değişen dosyalar
- Arayüz: `src/components/EditorPanel.tsx`, `DesignWorkbench.tsx`, `SceneControls.tsx`, `NoWebGL.tsx`; `src/pages/EditorPage.tsx`, `SavedPage.tsx`, `CatalogPage.tsx`, `AboutPage.tsx`; `src/styles.css`.
- Durum/veri: `src/lib/design.ts`, `designFile.ts`, `useDesignHistory.ts`, `storage.ts`, `webgl.ts`; `src/data/models.ts`.
- 3D: `src/three/carRuntime.ts`, `addons.ts`, `workshopGeometry.ts`, `CarViewer.tsx`.
- Test/altyapı: `src/lib/workshop.test.ts`, `src/three/carRuntime.test.ts`, `tests/e2e/app.spec.ts`, `package.json`, `playwright.config.ts`. Önceki oturumun `design.test.ts` ve `storage.test.ts` değişiklikleri korundu.
- Belgeler: `README.md`, `PROJE_NOTLARI.md`.

### Kontroller
- Lint: uyarısız geçti. Tip kontrolü, 30 birim testi, üretim derlemesi geçti. Diff boşluk kontrolü geçti.
- Final E2E: `$env:PW_CHANNEL='chrome'; npm run e2e` ile son derleme üzerinde **27/27 test geçti**, çalıştırıcı **çıkış kodu 0** ile normal tamamlandı (4,3 dakika). Kaplama + LED + kamber içeren ışık izleme, paylaşım, geri al/ileri al, JSON ve kayıt ortamı, 404 yeniden deneme, WebGL 2 ve mobil akışlar dahil. Önceki denemede kalan test özel anahtarın dekoratif katmanına takılıyordu; görünen etiket üzerinden etkileşimle düzeltildi.
- Masaüstü, panel ve mobil ekran görüntüleri ayrıca incelendi: `lab-out/workshop/desktop.png`, `panel.png`, `mobile.png`. Yerel inceleme için geliştirme sunucusu `http://localhost:5199/` adresinde açık bırakıldı; test önizleme sunucusu testler tamamlanınca kapatıldı.

### Kaynak, lisans, maliyet ve yayın
- Yeni model/harici görsel alınmadı. Mevcut Sketchfab CC BY 4.0 modelleri ve Poly Haven CC0 HDRI kaynakları korunuyor; lisanslar bu oturumda API üzerinden yeniden sorgulanmadı. Yeni parçalar proje kodunun ürettiği genel geometridir (proje kodu MIT). Maliyet: 0 TL.
- Commit/push/yayın yapılmadı. Depo: https://github.com/MertDas24/sanal-garaj ; mevcut canlı site: https://mertdas24.github.io/sanal-garaj/ . Bu oturumun değişiklikleri henüz canlı sitede değildir.

### Eksikler ve Claude için sonraki adımlar
- “Bir araçta olabilecek her modifikasyon” için araç bazında panel/bağlantı noktası, iç mekân ve kit geometrisi hazırlanmalı. Lisanslı tampon/geniş gövde/yan etek/difüzör/egzoz kitleri ayrı model hattı işi olarak ele alınmalı; mevcut 26 modelin her birine evrensel parça uygunluğu varsayılmamalı.
- Motor/turbo/ECU ve mekanik değişikliklerde önce fizik/uyumluluk veri kapsamı belirlenmeli; mevcut ürün görsel tasarım olarak kalıyor.
- Kaput/tavan için elle doğrulanmış panel maskeleri, hassas lastik geometrisi hatalarının model hattında giderilmesi, tüm açı/kombinasyonlar için görsel test ve ölçülmüş GPU/FPS profili sonraki kalite adımlarıdır.
- Serbest kamera açısı ve geri al geçmişi tasarım dosyasında saklanmaz; dosya tasarım ayarlarını ve ortamı taşır. Ortam değişikliği tasarım geri al geçmişine dahil değildir.
- Bu oturumun son E2E çıkışı doğrulandı. Windows'ta otomatik sunucu kapatma sınırı hâlâ mevcut; ayrı terminalde önizleme sunucusu kullanma yöntemi belgede anlatılıyor. Sonraki gönderim/yayın öncesinde yeni değişiklikler için kontroller tekrar geçmeli.

---

## 2026-10-12 — Codex: motor/aktarma planı ve ücretsiz halka açık yayın

**Katkı: Codex.** Kullanıcı motor modifikasyonlarının eklenmesini ve projenin başkalarıyla paylaşılabilir bir bağlantıyla ücretsiz yayınlanmasını istedi. Bu talep önceki oturumların yerel değişikliklerinin de mevcut GitHub Pages sitesine gönderilmesini kapsıyor.

### Tamamlanan işler ve kararlar
- Motor/aktarma parça planında **45 kategori**: motor değişimi; ECU; hacim, piston, biyel, krank, eksantrik, silindir kapağı, supap, conta/saplama, takoz; turbo/kompresör, emme, manifold, kelebek, intercooler, basınç/tahliye kontrolü; yakıt dönüşümü, enjektör, pompa, hat/regülatör, ateşleme, nitro, su/metanol; radyatör, fan/pompa, yağlama, karter havalandırma; manifold/downpipe/katalizör/egzoz; şanzıman, debriyaj, volan, diferansiyel, son dişli, şaft/aks, çekiş; elektrik motoru, inverter, batarya/soğutma ve rejenerasyon.
- Seçimler düzenlenebilir, geri alınabilir, kaydedilebilir, JSON ve modifikasyon listesine aktarılabilir ve `engine` paylaşım parametresiyle geri açılabilir. Her kategori/seçenek için enum doğrulaması, bilinmeyen alanların atılması ve bozuk/aşırı uzun parametre koruması var.
- Elektrikli dönüşümde içten yanmalı parçalar devre dışı bırakılır ve plandan temizlenir. Elektrikli parça seçenekleri yalnızca elektrikli dönüşüm planında açılır.
- **Dürüst kapsam:** modeller ayrı motor içi geometrisi veya doğrulanmış motor/uyumluluk verisi sunmuyor. Bu yüzden motor bölümü açıkça parça planıdır; 3D motor dönüşümü, gerçek ECU yazılımı, güç/tork/ivmelenme kazancı ve mekanik uygunluk sonucu üretilmez. Seçimlerin işe yarayan sonucu kaydedilebilir/paylaşılabilir yapılandırmadır.
- Katalog ve Hakkında sayfalarına **Siteyi paylaş** eklendi. Kalıcı Pages adresi kopyalanır veya kullanıcı isterse cihazın paylaşım menüsü açılır; panoya erişim yoksa bağlantı elle kopyalanabilir.
- Motor planı render varsayılanlarının her karede yeniden üretilmemesi için runtime varsayılanı bir kez hazırlanır. Önceki görsel atölye ve doğrulama düzeltmeleri korundu.
- E2E motor testi geri al sırasında açık kategorinin kapanmasını yakaladı; kategori açıklığı parça seçimlerinden bağımsız state ile korunacak şekilde düzeltildi.

### Dosyalar
- Yeni: `src/lib/powertrain.ts`, `src/lib/powertrain.test.ts`, `src/components/PowertrainPanel.tsx`, `src/components/ProjectShare.tsx`.
- Güncellenen: `src/lib/design.ts`, `designFile.ts`; `src/components/EditorPanel.tsx`, `DesignWorkbench.tsx`; `src/pages/CatalogPage.tsx`, `AboutPage.tsx`; `src/three/carRuntime.ts`; `src/styles.css`; `tests/e2e/app.spec.ts`; `README.md`, `PROJE_NOTLARI.md`. Önceki oturumun yayınlanmamış dosyaları da korunup bu yayın kapsamına alındı.

### Kontroller
- `npm run lint`: uyarısız geçti. `npx tsc -b`, `npm test` (**34 test**) ve üretim derlemesi geçti.
- `npm audit --audit-level=high`: **0 güvenlik açığı**. Yeni bağımlılık kurulmadı.
- E2E: motor kategorisi açıklık düzeltmesinden sonra **29/29 test geçti**, çıkış kodu 0 (4,1 dakika). İlk çalıştırmada 28 geçti; kalan test yukarıdaki geri al/kategori kapanışı sorununu gösterdi ve düzeltildi. Motor planı paylaşım/reload/kaydet/aç/geri al/elektrikli dönüşüm/sıfırlama ile site bağlantısı kopyalama doğrulandı.
- İlk yayın kontrolünde mevcut Pages adresi HTTP 200 döndü. Depo herkese açık, Pages yayın yöntemi GitHub Actions; mevcut GitHub oturumu kullanılabiliyor.

### Ücretsiz yayın, kaynaklar ve eksikler
- Depo: https://github.com/MertDas24/sanal-garaj . Kalıcı paylaşım adresi: https://mertdas24.github.io/sanal-garaj/ . Yeni servis/hesap, ücretli barındırma, alan adı, abonelik veya model satın alma yok; **maliyet 0 TL**.
- Kaynak modeller ve lisans kayıtları değiştirilmedi; yeni model indirilmedi. Mevcut Sketchfab CC BY 4.0 ve Poly Haven CC0 kaynakları korunuyor; bu oturumda lisanslar tekrar sorgulanmadı.
- **Yayın tamamlandı:** `6e5c856` commit'i main dalına gönderildi; https://github.com/MertDas24/sanal-garaj/actions/runs/38284602111 iş akışında güvenlik/lint/birim/derleme, **29/29 bulut E2E testi** ve GitHub Pages yayını başarılı. Kod yayını bu commit'e aittir. Anahtar/şifre bu nota yazılmadı; dış kişilere mesaj gönderilmedi.
- **Canlı tarayıcı doğrulaması:** 26 katalog kartı, Siteyi paylaş ile kalıcı URL kopyalama, V8 + bağımsız ECU + çift turbo planının bağlantıdan açılması ve tekrar paylaşılması doğrulandı. Mobil 390 px görünümde aynı plan geri açıldı; yatay taşma, sayfa hatası ve 4xx/5xx yanıt sayısı **0**. Motor paneli ekran görüntüsü ayrıca incelendi. Yerel kanıtlar: `lab-out/live-verification.json`, `lab-out/live-motor.png` (depoya girmez).
- Bu yayın sonucunu kaydeden sonraki commit yalnızca bu notu değiştirir; `[skip ci]` ile aynı kodun gereksiz yeniden yayını önlenir.
- Claude için: gerçek motor 3D görünümü/fizik simülasyonu ve araç bazında parça uyumluluğu ayrı veri/model geliştirmesi olarak kalıyor. Seçenekler kapsamlı bir genel plan kataloğudur; tüm araçlarda fiziksel montaj uygunluğu varsayılmaz.

## 2026-10-12 — Gelişmiş atölye, stüdyo ve portfolyo
Katkı: Codex. Ana mimari, mevcut model kataloğu/hazırlama hattı ve ilk uygulama: Claude. Oturum başında çalışma ağacı temizdi; kaynak modeller, model kaynak listesi ve önceki notlar korunmuştur.

### Tamamlanan işler ve kararlar
1. **Gövde kiti:** AE86, BMW M3 E30 ve Mercedes C 63 W204 için proje içinde özgün yan etek, difüzör, çift egzoz ucu, çamurluk ve ön tampon köşe uzantısı üretildi. Tekerlek ölçümleri ve gerçek gövde yüzeyine ışın göndererek bulunan bağlantılar kullanılır. İlk kutu temelli yerleşim görsel kontrolde açıkta kalmıştı; yüzeye bağlama ile düzeltildi. Orijinal tampon/egzoz korunur; eklentiler OEM kit veya fiziksel montaj şablonu değildir. Diğer araçlarda kit kapalı ve gerekçeli görünür.
2. **Kaplama editörü:** genişlik, yatay konum ve açı; kaput/tavan/sol-sağ kapı yazısı ve yerel logo. Yalnızca CG_paint üçgenleri kullanılır. Logo PNG/JPEG/WebP (girdi 2 MB sınırı) cihazda 128 px PNG'ye çevrilir (işlenmiş veri 16 KB sınırı). Logo dosyası yüklenmez; küçük görsel kayıt, JSON ve paylaşım bağlantısında taşınır. Paylaşılan bağlantı logoyu alıcıya açar ve uzayabilir; arayüzde belirtilmiştir. Geometrisi olmayan bölgeler kapatılır; desteklenmeyen URL bölgesindeki yazı/logo uygulanmaz.
3. **Kayıt A/B karşılaştırması:** aynı aracın kayıtları sol/sağ görünüme seçilebilir, tek kamera ve ortak ortamla karşılaştırılır. Görsel ve motor planı farkları listelenir; fabrika karşılaştırması korunur. Motor planındaki aynı seçimler artık fark olarak sayılmaz.
4. **Fotoğraf stüdyosu:** 1280/1920/2560 px gerçek yeniden render; 16:9, kare ve 4:5; dört açı panosu; gerçek sahneden 960×600, alt yazılı 6 saniye WebM tur videosu. Kamera ve render hedefi işlem sonunda geri yüklenir; video akışı/kaynakları kapatılır. Stüdyo etkileşimli sahneyi kullanır; fotogerçekçi çıktı mevcut indirme düğmesindedir. Yüksek DPR ekranlarda render hedefinin viewport'una tekrar DPR uygulanması giderildi; DPR 1/3 karşılaştırması geçti.
5. **Motor planı tutarlılığı:** turbo/ECU, yakıt, aktarma, elektrikli dönüşüm ve çekiş dönüşümü için eksik veya birlikte incelenmesi gereken seçimler açıklanır. AE86 (Japonya 4A-GEU/1.587 cm³/sıralı 4) ve M3 E30 için üretici kaynaklı temel kayıt eklendi. Motor içi 3D, güç artışı veya parça numarası/montaj uygunluğu sonucu sunulmaz. Toyota kaynağının doğrulamadığı aşırı besleme türü tahmin edilmedi (bilinmiyor).
6. **Performans ve erişilebilirlik:** otomatik/hafif/yüksek profil; gerçek WebGL bağlamı kaybında yeniden deneme ve tasarımın korunması; model ve ortam 404 için ayrı hata/önbellek temizliği. Radyo gruplarında tek Tab durağı ve ok/Home/End seçimi; anahtarların gerçek tıklama alanı; bölüm kısayollarında Kit/Stüdyo. Bozuk yüzde kodlu URL çökmesi giderildi. Motor planı değişikliği ışık izlemeyi yeniden başlatmaz; ilk tamamlanan ışık örneği hemen bildirilir. Kaplama ve logo önbellekleri sınırlıdır. Runtime kaynak geometrisini sahiplenip silmez; indeksiz float gövde yumuşatmasında da önce sahip olunan kopya kullanılır.
7. **Portfolyo:** Hakkında sayfasına mimari akışı/teknik kararlar, gerçek demo ve ölçüm tablosu eklendi. İndirme süresi, renderer kaynak adetleri ve destekleyen tarayıcıda yaklaşık JS heap raporu JSON olarak alınabilir. Heap toplam RAM/GPU belleği değildir; tek yerel ölçüm internet/mobil performansı olarak sunulmaz. `npm run benchmark -- http://localhost:4173` ölçümü/demoyu yeniden üretir; ölçülen beş kaynak dosyasının SHA-256 değerleri kayıtlıdır. Yeni bağımlılık kurulmadı.

### Dosyalar
- Yeni: `src/three/bodyKit.ts`, `studio.ts`; `src/lib/compatibility.ts`, `logo.ts`, `quality.ts`, `radioKeys.ts`, `expansion.test.ts`; `src/components/StudioPanel.tsx`, `PerformancePanel.tsx`, `BenchmarkSummary.tsx`; `scripts/benchmark-workshop.mjs`; `tests/e2e/workshop.spec.ts`; `public/demo/*`, `public/benchmarks/workshop.json`.
- Güncellenen: `src/three/carRuntime.ts`, `carRuntime.test.ts`, `workshopGeometry.ts`, `CarViewer.tsx`, `pathTrace.ts`; `src/lib/design.ts`, `designFile.ts`, `storage.ts`, `router.ts`; `src/data/models.ts` (yetenek tipi); `src/components/EditorPanel.tsx`, `PowertrainPanel.tsx`, `SceneControls.tsx`, `DesignWorkbench.tsx`; `src/pages/EditorPage.tsx`, `AboutPage.tsx`; `src/styles.css`; `tests/e2e/app.spec.ts`; `package.json`, `README.md`, bu not.
- Kaynak/reference dosyaları `scripts/model-sources.mjs`, `src/data/models.generated.json`, `src/data/catalog.ts`, `public/models/` ve mevcut lisans kayıtları değiştirilmedi.

### Kontrol kanıtları ve giderilen sorunlar
- `npm run lint`, `npx tsc -b`, `npm test` (**41 birim testi**) ve `npm run build` geçti. `npm audit --audit-level=high`: **0 açık**. `git diff --check` temiz.
- Tam E2E paketi genişletme sırasında **36/36** geçti. Son iki senaryo ayrıca geçti: desteklenmeyen yazı bölgeleri (Porsche 930) ve mobil DPR 1/3 stüdyo çıktısı. Son kaynaklarla **38 testlik** tam koşu/yayın sonucu aşağıdaki sonraki kayıtla tamamlanacaktır.
- İlk E2E koşuları somut sorunlar buldu: anahtar tıklama alanını süs öğesi örtüyordu; seçici etiketleri seçenek metniyle birleşiyordu; sahne kapanışının bağlam kaybı ilk dosya hatasını eziyordu. Düzeltilip tekrar denendi. Ortam hatasında da ilk hata korunur ve HDR önbelleği temizlenir. Işık izleme yazılımsal GPU'da dört örnek aralığı yüzünden uzun süre 0 gösterebiliyordu; ilk gerçek örnek raporlanır ve testin gözlem süresi yazılımsal derlemeye uygun tutulur. Motor planı değişince aynı ışık izleme tuvalinin kaldığı testle doğrulandı.
- **26/26 model** tarayıcı denetiminde açıldı, sayfa hatası **0**. Corolla E180, Porsche 930, Challenger ve Calibra'da bazı yazı bölgeleri uygun değil; kapalı gösterilir. Kitler yalnızca yukarıdaki üç araçta açılır.
- Üç kit × ön/yan/arka **dokuz görüntü** incelendi. PNG boyut/içerik ve WebM okunabilirlik kontrolleri geçti. Yerel kanıtlar: `lab-out/kit-contact.png`, `lab-out/workshop/audit.json`, `lab-out/final-studio.png`, `lab-out/final-about.png` (depoya girmez). Fontconfig'in yazılabilir önbellek uyarısı görsel üretimini engellemedi.
- Yayına giren gerçek demo/poster ve kaynak atıfları `public/demo/README.md`; ölçüm ham verisi `public/benchmarks/workshop.json` içindedir. Örnekler tek yerel oturum ölçümüdür; karşılaştırmalı cihaz testi/tepe GPU belleği ölçümü değildir.

### Kaynaklar, lisans ve maliyet
- Yeni dış 3D model veya doku indirilmedi. Üretilen eklenti kodu/geometrisi proje **MIT** lisansındadır. Mevcut araç modellerinin **CC BY 4.0** koşulları korunur; kaynak lisansları bu oturumda yeniden sorgulanmadı.
- Demo/poster aracı: [Toyota AE86 Sprinter Trueno Zenki — Martin Trafas](https://sketchfab.com/3d-models/a5737bf3cc9b4179a6e5ebe173ff70d9), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Ölçek/yön/sıkıştırma, boya, kaplama/yazı ve kit uyarlamaları belirtilmiştir. Ortam: Poly Haven Autoshop 01, **CC0**, Oliksiy Yakovlyev.
- Temel motor verileri: [Toyota araç tarihi/AE86](https://www.toyota-global.com/company/history_of_toyota/75years/vehicle_lineage/car/id60009032/), [BMW M3 E30](https://www.bmw-m.com/en/topics/magazine-article-pool/bmw-m3-e30-portraet.html). Üretici sayfaları 2026-10-12'de kontrol edildi; metin/görsel kopyalanmadı, kısa olgusal kayıt ve bağlantı kullanıldı.
- Yeni servis, hesap, abonelik, alan adı veya satın alma yok; proje için yeni maliyet **0 TL**. Mevcut herkese açık depo ve standart Ubuntu/Pages iş akışı korunuyor. [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) ve [standart public/Pages Actions ücretsiz kullanım koşulları](https://docs.github.com/en/billing/concepts/product-billing/github-actions) kontrol edildi.
- Depo: https://github.com/MertDas24/sanal-garaj . Mevcut canlı adres: https://mertdas24.github.io/sanal-garaj/ . Güncellemenin yayın sonucu sonraki tarihli kayda eklenecek. Gizli bilgi yazılmadı; dış kişilere mesaj gönderilmedi.

### Devam eden iş
- Codex: son tam 38 E2E testi, main gönderimi, GitHub Actions/Pages sonucunu izleme ve canlı kontrol. Bu süreçte aynı kaynak dosyalarında eşzamanlı değişiklik yapılmamalı.

### Sonraki adımlar / Claude'un karar alanı
- Kitleri diğer 23 araca genişletmek için her modelde ayrı yüzey/tekerlek ve ön-yan-arka görsel doğrulama yapın; mevcut üç model desteği tüm kataloğa uygulanmış gibi sunulmasın.
- Gerçek parça numarası/montaj verisi ve daha fazla üretici kaydı olmadan mekanik uygunluk veya güç kazancı eklemeyin. Motor içi geometri/fizik ve kapsamlı iç mekân değişimleri ayrı veri/model geliştirmesi gerektiriyor.
- Kaplama bölgeleri geometrik yaklaşımdır; gerçek panel sınırları veya üretime hazır kesim şablonu değildir. Çok ayrıntılı modellerde projeksiyon ve ışık izleme süresini fiziksel mobil cihazlarda ayrıca ölçün.
## 2026-10-12 — Yerel kontroller tamamlandı, yayın hazırlığı
Katkı: Codex.
- Son tam yerel E2E koşusu **38/38 geçti** (5,4 dakika); lint/tip kontrolü/derleme ve **41 birim testi** de geçti. Güvenlik taraması 0 açık verdi.
- Ek klavye kontrolü mevcut `İçeriğe geç` bağlantısının `#icerik` ile hash yönlendirmesini bozduğunu gösterdi. `src/App.tsx` içinde hash değiştirmeden ana içeriğe odak taşıma ve ana içerik için `tabIndex=-1` eklendi. Ayrı E2E testi geçti; toplam test listesi artık **39 senaryo**. Bu son değişiklikten sonra lint, tip kontrolü, 41 birim testi ve üretim derlemesi tekrar geçti.
- Son model/geometri/stüdyo düzeltmeleri ile mobil DPR, yüzeyi olmayan yazı bölgesi, kaynak geometri sahipliği, model/ortam yeniden denemesi ve ışık izleme oturumunun motor planı değişince korunması doğrulandı. Yeni sürüm için ücretli bağımlılık/hizmet veya model satın alınmadı.
- `public/benchmarks/workshop.json` ve gerçek demo güncel kaynaklarla üretildi; ölçüm dosyasındaki beş SHA-256 değeri ölçülen dosyalara aittir. Proje genelinde tek bir commit hash'i yerine ölçülen dosyalar açıkça listelenmiştir.

### Devam eden iş
- Codex: kontrolü geçmiş değişiklikleri main'e gönderme; GitHub Actions'taki 39 senaryonun ve Pages yayınının bitmesini izleme; canlı siteyi doğrulama.

### Sonraki adımlar
- Yayın sonucunu aşağıdaki yeni tarihli kayda ekleyin. Sonrasında Claude için veri/model kararları: diğer araç kitlerinin tek tek doğrulanması, üretici kayıtlarının genişletilmesi ve fiziksel mobil cihaz ölçümleri. Mekanik montaj veya güç kazancı bu sürümün kapsamı değildir.
## 2026-10-12 23:57 — Bulut E2E bekleme bütçeleri
Katkı: Codex.
- `f1c314b` main'e gönderildi. İş akışı https://github.com/MertDas24/sanal-garaj/actions/runs/38302633451 güvenlik/lint/41 birim/derleme adımlarını geçti; E2E **37/39** geçti ve Pages yayını yapılmadı. Önceki canlı sürüm korundu.
- İndirilen hata kanıtında logo durumu **“Logo cihazınızda işlendi.”** olarak mevcut: sonuç 20 saniyelik gözlem penceresinin sonrasında görünmüştü. JSON tasarım testi üç model açılışı yaptığı için toplam 60 saniyelik test bütçesinin sonunda üçüncü model henüz yükleniyordu (%0), model hata mesajı yoktu. Kanıtlar: `lab-out/ci-38302633451/` (depoya girmez).
- Yalnızca bu iki testin toplam bütçesi 180 saniye; logo sonucunun gözlem penceresi 60 saniye yapıldı. Hiçbir doğrulama kaldırılmadı, hata sonucu başarı sayılmadı; uygulama kodu aynı kaldı. Yazılımsal GPU'nun shader hazırlığı gerçek cihaz performansı olarak sunulmuyor.
- Lint/tip kontrolü/41 birim/derleme yeniden geçti. İki ilgili E2E testi birlikte **2/2 geçti** (1,1 dakika). Yeni main gönderimi ile bulut 39 senaryo ve yayın yeniden doğrulanacak.

### Devam eden iş
- Codex: yeni iş akışı/Pages sonucunu izleme ve canlı doğrulama.

### Sonraki adımlar
- Başarılı yayın ve canlı kontrol sonucunu yeni tarihli kayda ekleyin. Üç araç kitinin kapsamı, diğer motor verileri ve fiziksel cihaz ölçümleri için önceki kayıttaki Claude karar alanları geçerlidir.
## 2026-10-13 00:14 — Yayın ve canlı doğrulama tamamlandı
Katkı: Codex. Mevcut ana mimari ve lisanslı model hazırlama katkısı: Claude.
- Kod/atölye commit'i `f1c314b`; test bekleme düzeltmesi ve başarılı yayın commit'i `7d8cc2e`. https://github.com/MertDas24/sanal-garaj/actions/runs/38307574237 güvenlik/lint/tip/derleme, **41 birim testi**, **39/39 bulut E2E testi** ve GitHub Pages yayını ile başarılı tamamlandı. E2E 12,1 dakika sürdü; hiçbir test/doğrulama atlanmadı.
- **Canlı site:** https://mertdas24.github.io/sanal-garaj/ . **Depo:** https://github.com/MertDas24/sanal-garaj . Yeni servis/abonelik/satın alma yok; yeni proje maliyeti **0 TL**.
- Canlı tarayıcı kontrolü: **26 katalog aracı**; AE86 kitinin/kaplamasının/yazısının ve V8/ECU planının bağlantıdan açılması; paylaşım bağlantısının aynı ayarları taşıması; gerçek yeniden render ile PNG indirme; portfolyo ölçüm tablosu; **960×600 WebM demo** okunabilirliği doğrulandı. 390 px görünümde yazı/ayarlar geri açıldı; yatay taşma **yok**. Sayfa hataları ve 4xx/5xx yanıtları **0**.
- Canlı kanıt: `lab-out/live-workshop-verification.json`, `lab-out/live-workshop-studio.png` (depoya girmez). Canlı PNG ayrıca görsel olarak incelendi. Ölçüm kaydındaki beş kaynak SHA-256 değeri commit dosyalarıyla eşleşiyor.
- Bu sonuç kaydı yalnızca belgeyi değiştirir; `[skip ci]` ile aynı uygulamanın gereksiz yeniden yayını önlenir. Canlı uygulama sürümü `7d8cc2e` olarak kalır. Şifre/anahtar yazılmadı; dış kişilere mesaj gönderilmedi.

### Devam eden iş
- Yok. Bu oturumun yedi geliştirme başlığı ve yayın doğrulaması tamamlandı.

### Sonraki adımlar / Claude'un karar alanı
- Üç doğrulanmış kit (AE86, M3 E30, C 63 W204) dışındaki araçları tek tek görsel doğrulama ile genişletin; kit desteği tüm 26 araçta varmış gibi sunulmasın.
- Üretici kayıtlarını ve gerçek parça/montaj verisini genişletin. Mevcut motor bölümü tutarlılık kontrolü olan parça planıdır; güç kazancı, mekanik montaj ve motor içi 3D/fizik sonucu sunulmaz.
- Yaklaşık kaplama bölgeleri kesim/üretim şablonu değildir. Fiziksel mobil cihazlarda büyük model/kaplama ve ışık izleme performansını ayrıca ölçün. Mevcut ölçümler tek yerel oturumun süre/JS heap/kaynak adetleridir.