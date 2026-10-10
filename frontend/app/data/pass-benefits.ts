import rawBenefits from './pass-benefits.json' with { type: 'json' };
import type { Point } from '../utils/map.ts';

export interface PassBenefitPlace {
  id: string; name: string; at: Point; passIds: string[];
  benefit: 'included' | 'discount' | 'choice';
  note: string; source: string; positionSource: string;
  status: 'open' | 'temporarily-closed'; checkedAt: string;
}
export const passBenefitPlaces = rawBenefits as PassBenefitPlace[];
export const benefitLabels = { included: '方案內免費／限次', discount: '折扣／特典', choice: '套票擇一使用' };
export function benefitsForPass(id?: string): PassBenefitPlace[] {
  return id ? passBenefitPlaces.filter(place => place.passIds.includes(id)) : [];
}
// A 120 m location frame helps find a venue; it is not a park/property boundary.
export function benefitLocationFrame(at: Point): Point[] {
  const lat = 120 / 111320, lon = lat / Math.cos(at[1]! * Math.PI / 180);
  return [[at[0]! - lon, at[1]! - lat], [at[0]! + lon, at[1]! - lat], [at[0]! + lon, at[1]! + lat], [at[0]! - lon, at[1]! + lat]];
}
