import { Wind, Database } from 'lucide-react';
import { WeatherIcon } from './WeatherIcon';
import {
  formatTemp,
  formatSpeed,
  getUnitLabel,
  getWindDirection,
  type UnitSystem,
} from '../utils/units';
import { getWeatherDescription } from '../utils/weatherCodes';
import type { WeatherData } from '../api/weather';

interface CurrentWeatherProps {
  data: WeatherData;
  unitSystem: UnitSystem;
}

export function CurrentWeather({ data, unitSystem }: CurrentWeatherProps) {
  const current = data.current;

  // Apparent temp / Feels like
  // Find current hour index
  const curIndex = data.hourly.time.findIndex((t) => t === current.time);
  const apparentTemp =
    curIndex !== -1 ? data.hourly.apparent_temperature[curIndex] : current.temperature_2m;

  return (
    <div className="flex w-full flex-col items-start">
      {/* Big Thin Temp with aligned unit */}
      <div className="flex items-center gap-6">
        <div className="flex items-start">
          <h1 className="text-box-trim-cap text-[7rem] leading-none font-thin tracking-tighter text-white md:text-[8rem]">
            {formatTemp(current.temperature_2m, unitSystem)}
          </h1>
          <div className="flex">
            <span className="text-box-trim-cap text-3xl font-light text-blue-100/90 md:text-4xl">
              {getUnitLabel('temp', unitSystem)}
            </span>
          </div>
        </div>
        <WeatherIcon
          code={current.weather_code}
          isDay={current.is_day}
          className="h-26 w-26 text-blue-100/80 md:h-30 md:w-30"
          strokeWidth={1.5}
        />
      </div>

      {/* Feels Like - Increased spacing */}
      <div
        className={`mt-2 mb-4 text-sm font-medium tracking-widest text-blue-200/60 uppercase ${formatTemp(current.temperature_2m, unitSystem) === formatTemp(apparentTemp, unitSystem) ? 'invisible' : ''}`}
      >
        Feels Like {formatTemp(apparentTemp, unitSystem)}°
      </div>

      {/* Condition Text - Large, readable */}
      <div className="mb-4 max-w-lg text-3xl leading-tight font-light tracking-tight text-white/95 md:text-5xl">
        {getWeatherDescription(current.weather_code)} now.
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-3 text-xs font-semibold tracking-widest text-blue-200/60 uppercase">
        <div className="flex items-center gap-1.5">
          <Wind className="h-3 w-3 text-blue-200/40" />
          <span>
            {formatSpeed(current.wind_speed_10m, unitSystem)} {getUnitLabel('speed', unitSystem)}{' '}
            {getWindDirection(current.wind_direction_10m)}
            {current.wind_gusts_10m && current.wind_gusts_10m > current.wind_speed_10m && (
              <span className="ml-1 opacity-60">
                (Gusts {formatSpeed(current.wind_gusts_10m, unitSystem)}{' '}
                {getUnitLabel('speed', unitSystem)})
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Database className="h-3 w-3 text-blue-200/40" />
          <span>Open Meteo</span>
        </div>
      </div>
    </div>
  );
}
