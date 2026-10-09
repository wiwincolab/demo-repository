export const TOWN_LAYOUT_CHANNEL = 'chictrip-town-layout-v1';
export const TOWN_LAYOUT_KEY = 'chictrip:town-layout:v1';

/** One tile id per cell, with no missing, duplicate, or unknown tiles. */
export function isTownLayout(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === 9 &&
    value.every((id) => Number.isInteger(id) && id >= 0 && id < 9) &&
    new Set(value).size === 9;
}
