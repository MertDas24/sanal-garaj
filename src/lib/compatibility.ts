import type { PowertrainDesign } from './powertrain';

/** Üretici kaynakları: temel motor verisi; parça montaj uygunluğu iddiası içermez. */
export const ENGINE_REFERENCES: Record<string, { label: string; layout: string; naturallyAspirated: boolean | null; url: string }> = {
  'toyota-ae86': { label: 'Japonya AE86: 4A-GEU, 1.587 cm³, sıralı 4; pazar/varyant doğrulanmalı.', layout: 'i4', naturallyAspirated: null, url: 'https://www.toyota-global.com/company/history_of_toyota/75years/vehicle_lineage/car/id60009032/' },
  'bmw-m3-e30': { label: 'M3 E30: S14, atmosferik sıralı 4; hacim yıl ve versiyona göre değişir.', layout: 'i4', naturallyAspirated: true, url: 'https://www.bmw-m.com/en/topics/magazine-article-pool/bmw-m3-e30-portraet.html' },
};
export function checkPowertrain(plan: PowertrainDesign, vehicleId: string): string[] {
  const messages: string[] = [];
  const ref = ENGINE_REFERENCES[vehicleId];
  if (plan.layout !== 'stock') messages.push('Motor dönüşümü: bağlantılar, kontrol sistemi, soğutma ve aktarma için araç bazında mühendislik doğrulaması gerekiyor.');
  const noBoost = plan.aspiration === 'stock' && ref?.naturallyAspirated && plan.layout === 'stock';
  if (noBoost && [plan.intercooler, plan.boostControl, plan.blowoff, plan.downpipe].some((v) => v !== 'stock')) messages.push('Üretici verisindeki motor atmosferik. Seçilen basınç/turbo hattı parçaları için ayrıca aşırı besleme dönüşümü tanımlanmalı.');
  if (plan.aspiration !== 'stock' && plan.ecu === 'stock') messages.push('Aşırı besleme planında yakıt ve ateşleme kalibrasyonu belirtilmedi; fabrika ECU uygunluğu bilinmiyor.');
  if (['e85', 'flex'].includes(plan.fuel) && [plan.injectors, plan.pump, plan.ecu].some((v) => v === 'stock')) messages.push('Yakıt dönüşümünde enjektör/pompa malzeme uygunluğu ve ECU kalibrasyonu ayrıca doğrulanmalı.');
  if (plan.transmission === 'auto' && (plan.clutch !== 'stock' || plan.flywheel !== 'stock')) messages.push('Otomatik şanzıman ile seçilen manuel debriyaj/volan planı birlikte doğrulanmalı; aktarma türü belirsiz.');
  if (plan.layout === 'electric' && [plan.electricMotor, plan.inverter, plan.battery].some((v) => v === 'stock')) messages.push('Elektrikli dönüşüm planında motor, inverter veya batarya seçimi eksik.');
  if (plan.drivetrain !== 'stock') messages.push('Çekiş dönüşümü şasi, aks, şaft ve diferansiyel yerleşimi doğrulaması gerektirir.');
  return messages;
}
