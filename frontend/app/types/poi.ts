export type PoiCountry = 'JP' | 'KR' | 'TW';
export interface PoiRegion {
  id: string; country: PoiCountry; name: string; bbox: number[];
  status: 'ready' | 'pending' | 'failed'; count: number; photoCount: number;
  fetchedAt: string | null; file: string | null; error?: string;
}
export interface Poi {
  id: string; country: PoiCountry; name: string; localName: string;
  names: Record<string,string>; category: string; categoryLabel: string; at: number[];
  description: string | null; address: string | null; website: string | null;
  phone: string | null; openingHours: string | null; fee: string | null; wheelchair: string | null;
  wikidata: string | null; wikipedia: string | null; commonsFile: string | null;
  wikidataMismatch?: 'human';
  imageStatus: 'available' | 'pending' | 'unavailable';
  photo: {src: string; original: string; source: string; credit: string; license: string; licenseUrl: string; width: number; height: number; licenseStatus?: 'unspecified'; provider?: string; retrievedAt?: string; thumbnailOf?: string} | null;
  source: {provider:string; url:string; license:string; licenseUrl:string}; fetchedAt:string;
}
export interface PoiCatalog {
  schemaVersion: number; generatedAt: string; coverage: string;
  totalUnique: number; totalWithPhoto: number; regions: PoiRegion[];
  sources: {name:string; url:string; license:string}[];
}
export interface PoiSnapshot {schemaVersion: number; region: PoiRegion; fetchedAt: string; osmTimestamp: string | null; pois: Poi[]}
