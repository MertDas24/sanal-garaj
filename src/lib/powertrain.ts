// Motor/aktarma için paylaşılabilir parça planı. Güç veya araç uyumluluğu hesaplanmaz.
const STOCK = 'Fabrika / değişiklik yok';
export const POWERTRAIN_FIELDS = {
  layout: { group: 'Motor ve iç aksam', label: 'Motor değişimi', options: { stock: STOCK, i4: 'Sıralı 4', i6: 'Sıralı 6', v6: 'V6', v8: 'V8', v10: 'V10', v12: 'V12', rotary: 'Rotary', electric: 'Elektrikli dönüşüm' } },
  ecu: { group: 'Motor ve iç aksam', label: 'ECU / motor yönetimi', options: { stock: STOCK, remap: 'Yazılım kalibrasyonu', piggyback: 'Ek kontrol ünitesi', standalone: 'Bağımsız ECU' } },
  displacement: { group: 'Motor ve iç aksam', label: 'Hacim değişimi', options: { stock: STOCK, bore: 'Silindir çapı büyütme', stroke: 'Strok artırma', both: 'Çap ve strok' } },
  pistons: { group: 'Motor ve iç aksam', label: 'Piston', options: { stock: STOCK, forged: 'Dövme piston', high: 'Yüksek sıkıştırma', low: 'Düşük sıkıştırma' } },
  rods: { group: 'Motor ve iç aksam', label: 'Biyel kolu', options: { stock: STOCK, forged: 'Dövme biyel', billet: 'İşlenmiş biyel' } },
  crank: { group: 'Motor ve iç aksam', label: 'Krank mili', options: { stock: STOCK, forged: 'Dövme krank', stroker: 'Stroker krank' } },
  cams: { group: 'Motor ve iç aksam', label: 'Eksantrik mili', options: { stock: STOCK, mild: 'Cadde profili', sport: 'Spor profil', race: 'Pist profili' } },
  head: { group: 'Motor ve iç aksam', label: 'Silindir kapağı', options: { stock: STOCK, ported: 'Port işleme', cnc: 'CNC port işleme', upgraded: 'Performans kapağı' } },
  valves: { group: 'Motor ve iç aksam', label: 'Supap ve yaylar', options: { stock: STOCK, springs: 'Güçlendirilmiş yay', lightweight: 'Hafif supap takımı', complete: 'Komple supap takımı' } },
  gasket: { group: 'Motor ve iç aksam', label: 'Conta ve bağlantılar', options: { stock: STOCK, mls: 'Çok katmanlı conta', studs: 'Güçlendirilmiş saplama', both: 'Conta ve saplama' } },
  mounts: { group: 'Motor ve iç aksam', label: 'Motor takozları', options: { stock: STOCK, reinforced: 'Güçlendirilmiş', track: 'Pist tipi' } },
  aspiration: { group: 'Hava ve aşırı besleme', label: 'Turbo / kompresör', options: { stock: STOCK, single: 'Tek turbo', twin: 'Çift turbo', twinscroll: 'Twin-scroll turbo', sequential: 'Sıralı çift turbo', supercharger: 'Mekanik kompresör', twincharged: 'Turbo + kompresör' } },
  intake: { group: 'Hava ve aşırı besleme', label: 'Hava filtresi ve emme', options: { stock: STOCK, panel: 'Panel filtre', cold: 'Soğuk hava emişi', ram: 'Ram-air emiş', itb: 'Bağımsız gaz kelebekleri' } },
  manifold: { group: 'Hava ve aşırı besleme', label: 'Emme manifoldu', options: { stock: STOCK, ported: 'Port işleme', performance: 'Performans manifoldu', variable: 'Değişken uzunluk' } },
  throttle: { group: 'Hava ve aşırı besleme', label: 'Gaz kelebeği', options: { stock: STOCK, enlarged: 'Büyük çap', electronic: 'Elektronik kelebek' } },
  intercooler: { group: 'Hava ve aşırı besleme', label: 'Intercooler', options: { stock: STOCK, front: 'Ön yerleşimli hava-hava', top: 'Üst yerleşimli hava-hava', water: 'Su-hava' } },
  boostControl: { group: 'Hava ve aşırı besleme', label: 'Basınç kontrolü', options: { stock: STOCK, wastegate: 'Harici wastegate', electronic: 'Elektronik kontrol', complete: 'Wastegate ve kontrol' } },
  blowoff: { group: 'Hava ve aşırı besleme', label: 'Tahliye valfi', options: { stock: STOCK, recirculating: 'Geri dönüşlü valf', atmospheric: 'Atmosferik valf' } },
  fuel: { group: 'Yakıt ve ateşleme', label: 'Yakıt dönüşüm planı', options: { stock: STOCK, e85: 'E85 dönüşümü', flex: 'Esnek yakıt sistemi' } },
  injectors: { group: 'Yakıt ve ateşleme', label: 'Enjektör', options: { stock: STOCK, highflow: 'Yüksek debi', direct: 'Direkt enjeksiyon sistemi' } },
  pump: { group: 'Yakıt ve ateşleme', label: 'Yakıt pompası', options: { stock: STOCK, upgraded: 'Yükseltilmiş pompa', dual: 'Çift pompa' } },
  rail: { group: 'Yakıt ve ateşleme', label: 'Yakıt hattı / regülatör', options: { stock: STOCK, rail: 'Performans yakıt hattı', regulator: 'Ayarlanabilir regülatör', complete: 'Komple yakıt sistemi' } },
  ignition: { group: 'Yakıt ve ateşleme', label: 'Ateşleme', options: { stock: STOCK, coils: 'Bobin takımı', plugs: 'Buji takımı', complete: 'Bobin ve buji takımı' } },
  nitrous: { group: 'Yakıt ve ateşleme', label: 'Nitro sistemi', options: { stock: STOCK, wet: 'Islak sistem', dry: 'Kuru sistem', direct: 'Doğrudan port sistemi' } },
  waterMeth: { group: 'Yakıt ve ateşleme', label: 'Su / metanol enjeksiyonu', options: { stock: STOCK, single: 'Tek kademeli', progressive: 'Kademeli sistem' } },
  radiator: { group: 'Soğutma ve yağlama', label: 'Radyatör', options: { stock: STOCK, aluminum: 'Alüminyum radyatör', larger: 'Büyük hacimli radyatör' } },
  fans: { group: 'Soğutma ve yağlama', label: 'Soğutma fanı / pompa', options: { stock: STOCK, fans: 'Fan takımı', pump: 'Pompa yükseltmesi', complete: 'Fan ve pompa' } },
  oil: { group: 'Soğutma ve yağlama', label: 'Yağlama sistemi', options: { stock: STOCK, cooler: 'Yağ soğutucu', baffled: 'Bölmeli karter', drysump: 'Kuru karter' } },
  breather: { group: 'Soğutma ve yağlama', label: 'Karter havalandırma', options: { stock: STOCK, catchcan: 'Yağ ayırıcı', upgraded: 'Havalandırma sistemi' } },
  exhaustManifold: { group: 'Egzoz sistemi', label: 'Egzoz manifoldu', options: { stock: STOCK, tubular: 'Borulu manifold', equal: 'Eşit uzunluklu manifold' } },
  downpipe: { group: 'Egzoz sistemi', label: 'Downpipe', options: { stock: STOCK, upgraded: 'Performans downpipe' } },
  catalyst: { group: 'Egzoz sistemi', label: 'Katalizör', options: { stock: STOCK, sport: 'Spor katalizör' } },
  exhaust: { group: 'Egzoz sistemi', label: 'Egzoz hattı', options: { stock: STOCK, catback: 'Katalizör sonrası hat', valved: 'Valfli egzoz', titanium: 'Titanyum hat' } },
  transmission: { group: 'Aktarma organları', label: 'Şanzıman', options: { stock: STOCK, manual: 'Manuel dönüşüm', auto: 'Otomatik dönüşüm', dct: 'Çift kavrama', sequential: 'Sıralı yarış şanzımanı' } },
  clutch: { group: 'Aktarma organları', label: 'Debriyaj', options: { stock: STOCK, sport: 'Spor kavrama', twin: 'Çift disk', triple: 'Üç disk' } },
  flywheel: { group: 'Aktarma organları', label: 'Volan', options: { stock: STOCK, lightweight: 'Hafif volan', reinforced: 'Güçlendirilmiş volan' } },
  differential: { group: 'Aktarma organları', label: 'Diferansiyel', options: { stock: STOCK, lsd1: '1 yollu LSD', lsd15: '1,5 yollu LSD', lsd2: '2 yollu LSD', electronic: 'Elektronik kilit' } },
  finalDrive: { group: 'Aktarma organları', label: 'Son dişli', options: { stock: STOCK, short: 'Kısa oran planı', long: 'Uzun oran planı' } },
  driveshaft: { group: 'Aktarma organları', label: 'Şaft ve akslar', options: { stock: STOCK, reinforced: 'Güçlendirilmiş', carbon: 'Karbon şaft' } },
  drivetrain: { group: 'Aktarma organları', label: 'Çekiş dönüşümü', options: { stock: STOCK, fwd: 'Önden çekiş', rwd: 'Arkadan itiş', awd: 'Dört tekerlekten çekiş' } },
  electricMotor: { group: 'Elektrikli dönüşüm', label: 'Elektrik motoru', options: { stock: STOCK, single: 'Tek motor', dual: 'Çift motor', triple: 'Üç motor' } },
  inverter: { group: 'Elektrikli dönüşüm', label: 'İnverter / kontrolcü', options: { stock: STOCK, upgraded: 'Performans kontrolcüsü' } },
  battery: { group: 'Elektrikli dönüşüm', label: 'Batarya', options: { stock: STOCK, capacity: 'Kapasite odaklı paket', power: 'Güç odaklı paket' } },
  batteryCooling: { group: 'Elektrikli dönüşüm', label: 'Batarya soğutması', options: { stock: STOCK, liquid: 'Sıvı soğutma', upgraded: 'Isıl yönetim yükseltmesi' } },
  regen: { group: 'Elektrikli dönüşüm', label: 'Rejeneratif fren planı', options: { stock: STOCK, light: 'Hafif geri kazanım', strong: 'Yüksek geri kazanım' } },
} as const;

export type PowertrainKey = keyof typeof POWERTRAIN_FIELDS;
export type PowertrainDesign = { [K in PowertrainKey]: keyof (typeof POWERTRAIN_FIELDS)[K]['options'] };
export const POWERTRAIN_KEYS = Object.keys(POWERTRAIN_FIELDS) as PowertrainKey[];
export const POWERTRAIN_GROUPS = [...new Set(POWERTRAIN_KEYS.map((key) => POWERTRAIN_FIELDS[key].group))];
export function defaultPowertrain(): PowertrainDesign {
  return Object.fromEntries(POWERTRAIN_KEYS.map((key) => [key, 'stock'])) as PowertrainDesign;
}
export function isPowertrainFieldEnabled(key: PowertrainKey, plan: PowertrainDesign): boolean {
  const group = POWERTRAIN_FIELDS[key].group;
  if (key === 'layout') return true;
  if (group === 'Elektrikli dönüşüm') return plan.layout === 'electric';
  return plan.layout !== 'electric' || group === 'Aktarma organları' && !['clutch', 'flywheel'].includes(key);
}
export function sanitizePowertrain(input: unknown): PowertrainDesign {
  const result = defaultPowertrain();
  if (!input || typeof input !== 'object' || Array.isArray(input)) return result;
  const raw = input as Record<string, unknown>;
  for (const key of POWERTRAIN_KEYS) {
    const value = raw[key];
    if (typeof value === 'string' && Object.hasOwn(POWERTRAIN_FIELDS[key].options, value)) Object.assign(result, { [key]: value });
  }
  for (const key of POWERTRAIN_KEYS) if (!isPowertrainFieldEnabled(key, result)) Object.assign(result, { [key]: 'stock' });
  return result;
}
export function powertrainSummary(plan: PowertrainDesign): { label: string; value: string }[] {
  const clean = sanitizePowertrain(plan);
  return POWERTRAIN_KEYS.filter((key) => clean[key] !== 'stock').map((key) => ({
    label: POWERTRAIN_FIELDS[key].label,
    value: (POWERTRAIN_FIELDS[key].options as Record<string, string>)[clean[key]],
  }));
}
/** Bağlantılarda yalnızca değişen alanlar saklanır. */
export function encodePowertrain(plan: PowertrainDesign): string {
  const clean = sanitizePowertrain(plan);
  return JSON.stringify(Object.fromEntries(POWERTRAIN_KEYS.filter((key) => clean[key] !== 'stock').map((key) => [key, clean[key]])));
}
export function decodePowertrain(value: string): PowertrainDesign {
  if (value.length > 8192) return defaultPowertrain();
  try { return sanitizePowertrain(JSON.parse(value)); } catch { return defaultPowertrain(); }
}
