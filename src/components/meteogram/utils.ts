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

// Bisector
export const bisectDate = bisector<{ time: string }, Date>((d) => parseISO(d.time)).left;

// Constants
export const MARGIN = { top: 60, right: 0, bottom: 40, left: 0 };
