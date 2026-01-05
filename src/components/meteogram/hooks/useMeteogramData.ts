import { useMemo } from 'react';
import type { WeatherData } from '../../../api/weather';
import type { HourlyDataPoint } from '../types';

export function useMeteogramData(data: WeatherData): HourlyDataPoint[] {
  return useMemo(() => {
    return data.hourly.time.map((t: string, i: number) => ({
      time: t,
      temperature_2m: data.hourly.temperature_2m[i],
      apparent_temperature: data.hourly.apparent_temperature?.[i] ?? data.hourly.temperature_2m[i],
      dewpoint_2m: data.hourly.dewpoint_2m?.[i] ?? data.hourly.temperature_2m[i] - 5,
      precipitation: data.hourly.precipitation[i],
      rain: data.hourly.rain?.[i] || 0,
      showers: data.hourly.showers?.[i] || 0,
      snowfall: data.hourly.snowfall?.[i] || 0,
      cloudcover: data.hourly.cloudcover[i],
      windspeed_10m: data.hourly.windspeed_10m[i],
      winddirection_10m: data.hourly.winddirection_10m[i],
    }));
  }, [data]);
}
