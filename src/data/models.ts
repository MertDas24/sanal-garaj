import generated from './models.generated.json';

export interface ModelSource {
  title: string;
  author: string;
  site: string;
  url: string;
  license: 'CC-BY-3.0' | 'CC-BY-4.0' | 'CC0-1.0';
  licenseUrl: string;
}

export interface ModelFeatures {
  paint: boolean;
  rimColor: boolean;
  rimStyle: boolean;
  rideHeight: boolean;
  /** builtin: modelin kendi parçası açılıp kapatılır; addon: uygulamanın ürettiği parça eklenir */
  spoiler: 'builtin' | 'addon' | false;
  frontLip: 'addon' | false;
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
