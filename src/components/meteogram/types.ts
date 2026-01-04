import type { WeatherData } from '../../api/weather';
import { type UnitSystem } from '../../utils/units';

export interface MeteogramProps {
  data: WeatherData;
  width: number;
  height: number;
  unitSystem: UnitSystem;
}

export interface HourlyDataPoint {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  dewpoint_2m: number;
  precipitation: number;
  cloudcover: number;
  windspeed_10m: number;
  winddirection_10m: number;
}
