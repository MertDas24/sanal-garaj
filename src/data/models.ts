import generated from './models.generated.json';

export interface ModelSource {
  title: string;
  author: string;
  site: string;
  url: string;
  license: 'CC-BY-3.0' | 'CC-BY-4.0' | 'CC0-1.0';
  licenseUrl: string;
  /** Dosyanın indirildiği herkese açık kopya (Sketchfab dışa aktarımının GitHub kopyası) */
  mirror?: string;
}

export interface ModelFeatures {
  paint: boolean;
  rimColor: boolean;
  rimStyle: boolean;
  rideHeight: boolean;
  /** builtin: modelin kendi parçası açılıp kapatılır; addon: uygulamanın ürettiği parça eklenir */
  spoiler: 'builtin' | 'addon' | false;
  frontLip: 'addon' | false;
  /** Cam filmi (camlar ayrı malzeme ise) */
  windowTint: boolean;
  /** Fren kaliperi rengi (kaliper ayrı malzeme ise) */
  caliperColor: boolean;
  /** Çalışma zamanında geometri üzerinden doğrulanan ek yetenekler. */
  stance?: boolean;
  wrap?: boolean;
  wrapStyles?: string[];
  underglow?: boolean;
  bodyKit?: boolean;
  decalRegions?: string[];
}

export interface ModelAsset {
  id: string;
  file: string;
  bytes: number;
  triangles: number;
  size: [number, number, number];
  source: ModelSource;
  features: ModelFeatures;
  notes: string | null;
}

export const MODELS = generated as unknown as ModelAsset[];

export function findModel(id: string | null | undefined): ModelAsset | undefined {
  return id ? MODELS.find((m) => m.id === id) : undefined;
}

export const LICENSE_LABELS: Record<ModelSource['license'], string> = {
  'CC-BY-3.0': 'CC BY 3.0',
  'CC-BY-4.0': 'CC BY 4.0',
  'CC0-1.0': 'CC0 1.0',
};

export function modelUrl(m: ModelAsset): string {
  return `${import.meta.env.BASE_URL}${m.file}`;
}

export function thumbUrl(m: ModelAsset): string {
  return `${import.meta.env.BASE_URL}thumbs/${m.id}.jpg`;
}
