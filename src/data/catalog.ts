// Marka/model kataloğu. 3D model dosyalarından bağımsızdır:
// modelId, src/data/models.generated.json içindeki bir kayda işaret eder ya da null'dır.
// modelId null olan araçlar katalogda "3D model bekleniyor" olarak gösterilir ve düzenleyicide açılmaz.

export type Category = 'sedan' | 'hatchback' | 'coupe' | 'suv' | 'spor';

export const CATEGORY_LABELS: Record<Category, string> = {
  sedan: 'Sedan',
  hatchback: 'Hatchback',
  coupe: 'Coupe',
  suv: 'SUV / Arazi',
  spor: 'Spor',
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
  // Sedan
  { id: 'mercedes-e-serisi-w212', make: 'Mercedes-Benz', model: 'E-Serisi (W212)', year: '2013–2016', category: 'sedan', modelId: 'mercedes-e-class-w212' },
  { id: 'mercedes-c63-amg-w204', make: 'Mercedes-Benz', model: 'C 63 AMG (W204)', year: '2011–2014', category: 'sedan', modelId: 'mercedes-c63-amg-w204' },
  { id: 'toyota-corolla-e180', make: 'Toyota', model: 'Corolla (E180)', year: '2013–2019', category: 'sedan', modelId: 'toyota-corolla-e180' },
  { id: 'toyota-crown-sedan', make: 'Toyota', model: 'Crown Sedan Super Deluxe', year: '1995–2017', category: 'sedan', modelId: 'toyota-crown-super-deluxe' },
  { id: 'skoda-octavia-1u', make: 'Škoda', model: 'Octavia (1U)', year: '2000–2010', category: 'sedan', modelId: 'skoda-octavia-1u' },
  { id: 'volkswagen-passat-b55', make: 'Volkswagen', model: 'Passat (B5.5)', year: '2001–2005', category: 'sedan', modelId: 'volkswagen-passat-b55' },
  { id: 'jaguar-xj-x350', make: 'Jaguar', model: 'XJ (X350)', year: '2003–2009', category: 'sedan', modelId: 'jaguar-xj-x350' },
  { id: 'hyundai-accent-lc', make: 'Hyundai', model: 'Accent (LC)', year: '2004', category: 'sedan', modelId: 'hyundai-accent-tagaz',
    note: 'Rusya’da TaGAZ tarafından üretilen sürüm.' },
  { id: 'hudson-hornet-1951', make: 'Hudson', model: 'Hornet', year: '1951–1954', category: 'sedan', modelId: 'hudson-hornet-1951',
    note: '“Fabulous Hudson Hornet” yarış dekoruyla.' },
  // Hatchback
  { id: 'toyota-prius-xw30', make: 'Toyota', model: 'Prius (XW30)', year: '2009–2015', category: 'hatchback', modelId: 'toyota-prius-2012' },
  { id: 'fiat-uno-2001', make: 'Fiat', model: 'Uno', year: '2001', category: 'hatchback', modelId: 'fiat-uno-2001' },
  { id: 'honda-civic-type-r-fl5', make: 'Honda', model: 'Civic Type R (FL5)', year: '2023–', category: 'hatchback', modelId: 'honda-civic-type-r-fl5',
    note: 'Kaynak modelde özel (modifiyeli) görünüm.' },
  // Coupe
  { id: 'dodge-challenger-srt', make: 'Dodge', model: 'Challenger SRT', year: '2015–2023', category: 'coupe', modelId: 'dodge-challenger-srt-hellcat' },
  { id: 'chevrolet-malibu-1965', make: 'Chevrolet', model: 'Malibu', year: '1965', category: 'coupe', modelId: 'chevrolet-malibu-1965' },
  { id: 'mercedes-300-ce-c124', make: 'Mercedes-Benz', model: '300 CE (C124)', year: '1987–1993', category: 'coupe', modelId: 'mercedes-300ce-w124' },
  { id: 'bmw-m3-e30', make: 'BMW', model: 'M3 (E30)', year: '1986–1991', category: 'coupe', modelId: 'bmw-m3-e30' },
  { id: 'toyota-ae86', make: 'Toyota', model: 'Sprinter Trueno (AE86)', year: '1983–1987', category: 'coupe', modelId: 'toyota-ae86-trueno-zenki' },
  { id: 'opel-calibra', make: 'Opel', model: 'Calibra', year: '1990–1997', category: 'coupe', modelId: 'opel-calibra-1990' },
  { id: 'ford-mustang-shelby-gt500', make: 'Ford', model: 'Mustang Shelby GT500 (S550)', year: '2020–2022', category: 'coupe', modelId: 'ford-mustang-shelby-gt500' },
  { id: 'audi-rs5-b9', make: 'Audi', model: 'RS 5 Coupé (B9)', year: '2018', category: 'coupe', modelId: 'audi-rs5-2018' },
  // SUV ve arazi
  { id: 'toyota-land-cruiser-j200', make: 'Toyota', model: 'Land Cruiser (J200)', year: '2016–2021', category: 'suv', modelId: 'toyota-land-cruiser-200' },
  { id: 'willys-mb', make: 'Willys', model: 'MB Jeep', year: '1941–1945', category: 'suv', modelId: 'willys-mb-jeep' },
  // Spor
  { id: 'porsche-911-turbo-930', make: 'Porsche', model: '911 Turbo (930)', year: '1975–1989', category: 'spor', modelId: 'porsche-911-930-turbo' },
  { id: 'aston-martin-db11', make: 'Aston Martin', model: 'DB11 V12', year: '2017', category: 'spor', modelId: 'aston-martin-db11' },
  { id: 'lamborghini-gallardo', make: 'Lamborghini', model: 'Gallardo', year: '2010', category: 'spor', modelId: 'lamborghini-gallardo-2010' },
  { id: 'lamborghini-centenario', make: 'Lamborghini', model: 'Centenario LP 770-4', year: '2016–2017', category: 'spor', modelId: 'lamborghini-centenario' },
  { id: 'chevrolet-corvette-c7', make: 'Chevrolet', model: 'Corvette Stingray (C7)', year: '2014–2019', category: 'spor', modelId: 'chevrolet-corvette-c7' },
  { id: 'ferrari-488-pista', make: 'Ferrari', model: '488 Pista (geniş gövde)', year: '2018–2020', category: 'spor', modelId: 'ferrari-488-pista-widebody',
    note: 'Kaynak modelde geniş gövde kiti var.' },
  { id: 'nissan-gt-r-r35', make: 'Nissan', model: 'GT-R (R35)', year: '2017–', category: 'spor', modelId: 'nissan-gt-r-r35' },
];

export function findVehicle(id: string): Vehicle | undefined {
  return CATALOG.find((v) => v.id === id);
}
