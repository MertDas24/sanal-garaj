# Güvenlik politikası

## Mimari özeti
- Sanal Garaj **statik** bir sitedir: sunucu, veritabanı, hesap sistemi veya API anahtarı yoktur.
- Kullanıcı verisi (kayıtlı tasarımlar) yalnızca tarayıcının yerel depolamasında tutulur; yüklenen fotoğraf ve
  GLB dosyaları **cihazdan çıkmaz** (uçtan uca testle doğrulanır).
- Tüm varlıklar (modeller, HDRI, yapay zekâ modeli, WASM) sitenin kendisinden sunulur; harici CDN yoktur.

## Uygulanan önlemler
- **İçerik Güvenliği Politikası (CSP):** betik ve ağ istekleri yalnızca sitenin kendisine; `object-src 'none'`,
  `base-uri 'self'`, `form-action 'none'` (bkz. `vite.config.ts`).
- **Girdi doğrulama:** paylaşım bağlantısındaki tüm değerler beyaz listeyle doğrulanır ve sınırlanır
  (`src/lib/design.ts`); yerel depolamadaki kayıtlar okunurken sıkı biçimde doğrulanır (`src/lib/storage.ts`).
- **Yerel GLB görüntüleyici:** yalnızca `glTF` başlıklı tek dosya, en fazla 50 MB; dosya içinden harici adreslere
  istek engellenir.
- **Fotoğraf:** yalnızca JPEG/PNG/WebP, en fazla 25 MB.
- **Model hattı:** indirilen glTF dosyalarındaki göreli yollar `..` ve şema içeremez; gömülü kaynak adresi
  doğrulanır.
- **Bağımlılıklar:** CI her çalıştırmada `npm audit --audit-level=high` çalıştırır; Dependabot haftalık güncelleme
  önerir. GitHub gizli bilgi taraması ve itme koruması açıktır.
- **CI izinleri:** iş akışı varsayılan olarak salt okunur; yayın adımı yalnızca Pages yazma iznine sahiptir.

## Açık bildirme
Bir güvenlik açığı bulduysanız lütfen herkese açık issue açmak yerine GitHub’ın
**Security → Report a vulnerability** (özel güvenlik bildirimi) özelliğini kullanın.
