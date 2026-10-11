// Marka/model kataloğu. 3D model dosyalarından bağımsızdır:
// modelId, src/data/models.generated.json içindeki bir kayda işaret eder ya da null'dır.
// modelId null olan araçlar katalogda "3D model bekleniyor" olarak gösterilir ve düzenleyicide açılmaz.

export type Category = 'sedan' | 'hatchback' | 'coupe' | 'suv' | 'spor' | 'pickup';

export const CATEGORY_LABELS: Record<Category, string> = {
  sedan: 'Sedan',
  hatchback: 'Hatchback',
  coupe: 'Coupe',
  suv: 'SUV',
  spor: 'Spor',
  pickup: 'Pick-up',
};

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  /** Model yılı ya da üretim aralığı */
  year: string;
  category: Category;
  modelId: string | null;
  /** Kimlik belirsizliği vb. kullanıcıya gösterilecek kısa not */
  note?: string;
}

export const CATALOG: Vehicle[] = [
  { id: 'dodge-challenger-srt', make: 'Dodge', model: 'Challenger SRT', year: '2015', category: 'coupe', modelId: 'dodge-challenger-2015' },
  { id: 'delorean-dmc-12', make: 'DeLorean', model: 'DMC-12', year: '1981–1983', category: 'spor', modelId: 'delorean-dmc12' },
  {
    id: 'volkswagen-golf-mk1', make: 'Volkswagen', model: 'Golf (1. nesil)', year: '1974–1983', category: 'hatchback', modelId: null,
    note: 'Bulunan açık lisanslı model aşırı stilize olduğu (gerçek oranlara uymadığı) için kullanılmadı.',
  },
  { id: 'mini-klasik', make: 'Mini', model: 'Cooper (klasik)', year: '1959–2000', category: 'hatchback', modelId: 'mini-classic' },
  {
    id: 'rolls-royce-klasik', make: 'Rolls-Royce', model: 'Klasik coupe', year: 'Belirtilmemiş', category: 'coupe', modelId: 'rolls-royce-classic',
    note: 'Model kaynağı hangi Rolls-Royce modeli olduğunu belirtmiyor.',
  },
  { id: 'dodge-charger-1969', make: 'Dodge', model: 'Charger (2. nesil)', year: '1968–1970', category: 'coupe', modelId: 'dodge-charger-1969' },
  { id: 'mitsubishi-l200', make: 'Mitsubishi', model: 'L200 (3. nesil)', year: '1996–2005', category: 'pickup', modelId: 'mitsubishi-l200' },
  { id: 'chevrolet-camaro-zl1', make: 'Chevrolet', model: 'Camaro ZL1', year: '2017', category: 'spor', modelId: 'chevrolet-camaro-zl1-2017' },
  { id: 'toyota-hilux-1997', make: 'Toyota', model: 'Hilux', year: '1997', category: 'pickup', modelId: 'toyota-hilux-1997' },
  { id: 'range-rover-classic', make: 'Land Rover', model: 'Range Rover Classic', year: '1970–1996', category: 'suv', modelId: 'range-rover-classic' },
  { id: 'mazda3-hatchback', make: 'Mazda', model: 'Mazda3 Hatchback', year: '2019–', category: 'hatchback', modelId: 'mazda3-hatchback-2019' },
  { id: 'tesla-cybertruck', make: 'Tesla', model: 'Cybertruck', year: '2023–', category: 'pickup', modelId: 'tesla-cybertruck' },
  { id: 'mazda-rx-7-fc', make: 'Mazda', model: 'RX-7 (FC)', year: '1985–1992', category: 'spor', modelId: 'mazda-rx7-fc' },
  { id: 'toyota-ae86', make: 'Toyota', model: 'Sprinter Trueno (AE86)', year: '1983–1987', category: 'coupe', modelId: 'toyota-ae86' },
  { id: 'ford-model-t', make: 'Ford', model: 'Model T', year: '1908–1927', category: 'sedan', modelId: 'ford-model-t' },
  { id: 'nissan-skyline-gt-r-r34', make: 'Nissan', model: 'Skyline GT-R (R34)', year: '1999–2002', category: 'spor', modelId: 'nissan-skyline-gtr-r34' },
  { id: 'nissan-180sx', make: 'Nissan', model: '180SX', year: '1989–1998', category: 'coupe', modelId: 'nissan-180sx' },
  { id: 'jeep-wrangler-unlimited', make: 'Jeep', model: 'Wrangler Unlimited (JK)', year: '2007–2018', category: 'suv', modelId: 'jeep-wrangler-unlimited' },
  { id: 'nissan-terrano', make: 'Nissan', model: 'Terrano (1. nesil)', year: '1986–1995', category: 'suv', modelId: 'nissan-terrano' },
  { id: 'chevrolet-camaro-2010', make: 'Chevrolet', model: 'Camaro (5. nesil)', year: '2010–2015', category: 'coupe', modelId: 'chevrolet-camaro-2010' },

  // Lisansı doğrulanmış uygun bir 3D model henüz bulunamayan araçlar
  { id: 'toyota-corolla-sedan', make: 'Toyota', model: 'Corolla Sedan', year: '2019–', category: 'sedan', modelId: null },
  { id: 'bmw-3-serisi-g20', make: 'BMW', model: '3 Serisi (G20)', year: '2019–', category: 'sedan', modelId: null },
  { id: 'mercedes-c-serisi-w206', make: 'Mercedes-Benz', model: 'C-Serisi (W206)', year: '2021–', category: 'sedan', modelId: null },
  { id: 'volkswagen-passat-b8', make: 'Volkswagen', model: 'Passat (B8)', year: '2015–2023', category: 'sedan', modelId: null },
  { id: 'fiat-egea-sedan', make: 'Fiat', model: 'Egea Sedan', year: '2015–', category: 'sedan', modelId: null },
];

export function findVehicle(id: string): Vehicle | undefined {
  return CATALOG.find((v) => v.id === id);
}
