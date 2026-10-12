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
  { id: 'toyota-ae86', make: 'Toyota', model: 'Sprinter Trueno (AE86)', year: '1983–1987', category: 'coupe', modelId: 'toyota-ae86-trueno-zenki' },
  { id: 'ford-model-t', make: 'Ford', model: 'Model T', year: '1908–1927', category: 'sedan', modelId: 'ford-model-t' },
  { id: 'nissan-skyline-gt-r-r34', make: 'Nissan', model: 'Skyline GT-R (R34)', year: '1999–2002', category: 'spor', modelId: 'nissan-skyline-gtr-r34' },
  { id: 'nissan-180sx', make: 'Nissan', model: '180SX', year: '1989–1998', category: 'coupe', modelId: 'nissan-180sx' },
  { id: 'jeep-wrangler-unlimited', make: 'Jeep', model: 'Wrangler Unlimited (JK)', year: '2007–2018', category: 'suv', modelId: 'jeep-wrangler-unlimited' },
  { id: 'nissan-terrano', make: 'Nissan', model: 'Terrano (1. nesil)', year: '1986–1995', category: 'suv', modelId: 'nissan-terrano' },
  { id: 'chevrolet-camaro-2010', make: 'Chevrolet', model: 'Camaro (5. nesil)', year: '2010–2015', category: 'coupe', modelId: 'chevrolet-camaro-2010' },

  // Yüksek detaylı modeller (Sketchfab, CC BY 4.0)
  { id: 'mercedes-e-serisi-w212', make: 'Mercedes-Benz', model: 'E-Serisi (W212)', year: '2013–2016', category: 'sedan', modelId: 'mercedes-e-class-w212' },
  { id: 'toyota-corolla-e180', make: 'Toyota', model: 'Corolla (E180)', year: '2013–2019', category: 'sedan', modelId: 'toyota-corolla-e180' },
  { id: 'mercedes-c63-amg-w204', make: 'Mercedes-Benz', model: 'C 63 AMG (W204)', year: '2011–2014', category: 'sedan', modelId: 'mercedes-c63-amg-w204' },
  { id: 'toyota-crown-sedan', make: 'Toyota', model: 'Crown Sedan Super Deluxe', year: '1995–2017', category: 'sedan', modelId: 'toyota-crown-super-deluxe' },
  { id: 'toyota-prius-xw30', make: 'Toyota', model: 'Prius (XW30)', year: '2009–2015', category: 'hatchback', modelId: 'toyota-prius-2012' },
  { id: 'mercedes-300-ce-c124', make: 'Mercedes-Benz', model: '300 CE (C124)', year: '1987–1993', category: 'coupe', modelId: 'mercedes-300ce-w124' },
  { id: 'bmw-m3-e30', make: 'BMW', model: 'M3 (E30)', year: '1986–1991', category: 'coupe', modelId: 'bmw-m3-e30' },
  { id: 'toyota-land-cruiser-j200', make: 'Toyota', model: 'Land Cruiser (J200)', year: '2016–2021', category: 'suv', modelId: 'toyota-land-cruiser-200' },
  { id: 'porsche-911-turbo-930', make: 'Porsche', model: '911 Turbo (930)', year: '1975–1989', category: 'spor', modelId: 'porsche-911-930-turbo' },
  { id: 'mercedes-300-sl-gullwing', make: 'Mercedes-Benz', model: '300 SL Gullwing (W198)', year: '1954–1957', category: 'spor', modelId: 'mercedes-300sl-gullwing' },

  { id: 'volkswagen-passat-b55', make: 'Volkswagen', model: 'Passat (B5.5)', year: '2001–2005', category: 'sedan', modelId: 'volkswagen-passat-b55' },
];

export function findVehicle(id: string): Vehicle | undefined {
  return CATALOG.find((v) => v.id === id);
}
