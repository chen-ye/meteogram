import { parseISO } from 'date-fns';
import { bisector } from 'd3-array';
import type { HourlyDataPoint } from './types';

// Accessors
export const getDate = (d: { time: string }) => parseISO(d.time);
export const getTemp = (d: HourlyDataPoint) => d.temperature_2m;
export const getDewPoint = (d: HourlyDataPoint) => d.dewpoint_2m;
export const getPrecip = (d: HourlyDataPoint) => d.precipitation;
export const getCloud = (d: HourlyDataPoint) => d.cloudcover;
export const getWindSpeed = (d: HourlyDataPoint) => d.windspeed_10m;
export const getSnowRatio = (
  d: Pick<HourlyDataPoint, 'precipitation' | 'rain' | 'showers' | 'snowfall'>,
) => {
  if (d.precipitation <= 0) return 0;
  const liquid = d.rain + d.showers;
  return Math.max(0, Math.min(1, 1 - liquid / d.precipitation));
};

// Simple seeded PRNG (Linear Congruential Generator)
export function seededRandom(seed: number) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// String hash for seeding
export function getSeedFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Bisector
export const bisectDate = bisector<{ time: string }, Date>((d) => parseISO(d.time)).left;

// Constants
export const MARGIN = { top: 60, right: 0, bottom: 40, left: 0 } as const;
