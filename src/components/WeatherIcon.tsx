import { useMemo } from 'react';

// Import raw SVGs
import clearDay from '@bybas/weather-icons/production/line/all/clear-day.svg?raw';
import clearNight from '@bybas/weather-icons/production/line/all/clear-night.svg?raw';
import partlyCloudyDay from '@bybas/weather-icons/production/line/all/partly-cloudy-day.svg?raw';
import partlyCloudyNight from '@bybas/weather-icons/production/line/all/partly-cloudy-night.svg?raw';
import cloudy from '@bybas/weather-icons/production/line/all/cloudy.svg?raw';
import overcastDay from '@bybas/weather-icons/production/line/all/overcast-day.svg?raw';
import overcastNight from '@bybas/weather-icons/production/line/all/overcast-night.svg?raw';
import fogDay from '@bybas/weather-icons/production/line/all/fog-day.svg?raw';
import fogNight from '@bybas/weather-icons/production/line/all/fog-night.svg?raw';
import partlyCloudyDayDrizzle from '@bybas/weather-icons/production/line/all/partly-cloudy-day-drizzle.svg?raw';
import partlyCloudyNightDrizzle from '@bybas/weather-icons/production/line/all/partly-cloudy-night-drizzle.svg?raw';
import partlyCloudyDayRain from '@bybas/weather-icons/production/line/all/partly-cloudy-day-rain.svg?raw';
import partlyCloudyNightRain from '@bybas/weather-icons/production/line/all/partly-cloudy-night-rain.svg?raw';
import partlyCloudyDaySnow from '@bybas/weather-icons/production/line/all/partly-cloudy-day-snow.svg?raw';
import partlyCloudyNightSnow from '@bybas/weather-icons/production/line/all/partly-cloudy-night-snow.svg?raw';
import thunderstormDay from '@bybas/weather-icons/production/line/all/thunderstorms-day.svg?raw';
import thunderstormNight from '@bybas/weather-icons/production/line/all/thunderstorms-night.svg?raw';
import thunderstormDayRain from '@bybas/weather-icons/production/line/all/thunderstorms-day-rain.svg?raw';
import thunderstormNightRain from '@bybas/weather-icons/production/line/all/thunderstorms-night-rain.svg?raw';
import sleet from '@bybas/weather-icons/production/line/all/sleet.svg?raw';
import hail from '@bybas/weather-icons/production/line/all/hail.svg?raw';

// Import Tailwind colors
import colors from 'tailwindcss/colors';
import { WMO } from '../utils/weatherCodes';

// Color replacements mapping
const COLOR_MAP: Record<string, string> = {
  '#e5e7eb': 'currentColor', // Cloud/Grey -> Current Color
  '#f59e0b': colors.yellow[400], // Sun/Lightning/Amber -> Tailwind yellow-400
  '#2885c7': colors.blue[400], // Rain/Blue -> Tailwind blue-400
  '#72b9d5': colors.sky[100], // Clear Night/Moon -> Tailwind sky-100
  '#d1d5db': colors.slate[400], // Fog/Grey -> Tailwind slate-400
  '#72b8d4': colors.blue[200], // Snow/Ice -> Tailwind blue-200
  '#9ca3af': colors.gray[400], // Overcast Grey -> Tailwind gray-400
};

function getMeteocon(code: number, isDay: boolean): string {
  switch (code) {
    case WMO.ClearSky:
      return isDay ? clearDay : clearNight;
    case WMO.MainlyClear:
    case WMO.PartlyCloudy:
      return isDay ? partlyCloudyDay : partlyCloudyNight;
    case WMO.Overcast:
      return isDay ? overcastDay : overcastNight;
    case WMO.Fog:
    case WMO.DepositingRimeFog:
      return isDay ? fogDay : fogNight;
    case WMO.LightDrizzle:
    case WMO.ModerateDrizzle:
    case WMO.DenseDrizzle:
      return isDay ? partlyCloudyDayDrizzle : partlyCloudyNightDrizzle;
    case WMO.LightFreezingDrizzle:
    case WMO.DenseFreezingDrizzle:
      return sleet; // Freezing drizzle
    case WMO.SlightRain:
    case WMO.ModerateRain:
    case WMO.HeavyRain:
      return isDay ? partlyCloudyDayRain : partlyCloudyNightRain;
    case WMO.LightFreezingRain:
    case WMO.HeavyFreezingRain:
      return sleet; // Freezing rain
    case WMO.SlightSnowFall:
    case WMO.ModerateSnowFall:
    case WMO.HeavySnowFall:
      return isDay ? partlyCloudyDaySnow : partlyCloudyNightSnow;
    case WMO.SnowGrains:
      return hail; // Snow grains
    case WMO.SlightRainShowers:
    case WMO.ModerateRainShowers:
    case WMO.ViolentRainShowers:
      return isDay ? partlyCloudyDayRain : partlyCloudyNightRain;
    case WMO.SlightSnowShowers:
    case WMO.HeavySnowShowers:
      return isDay ? partlyCloudyDaySnow : partlyCloudyNightSnow;
    case WMO.Thunderstorm:
      return isDay ? thunderstormDay : thunderstormNight;
    case WMO.ThunderstormSlightHail:
    case WMO.ThunderstormHeavyHail:
      return isDay ? thunderstormDayRain : thunderstormNightRain;
    default:
      return cloudy;
  }
}

interface WeatherIconProps {
  code: number;
  isDay: number | boolean;
  className?: string;
  strokeWidth?: number; // Meteocons don't really support strokeWidth prop easily via string replace, but we can try
}

export function WeatherIcon({ code, isDay, className }: WeatherIconProps) {
  const isDayBool = typeof isDay === 'number' ? isDay === 1 : isDay;

  const svgHtml = useMemo(() => {
    let raw = getMeteocon(code, isDayBool);

    // Replace hex colors with Tailwind equivalents
    Object.entries(COLOR_MAP).forEach(([hex, replacement]) => {
      raw = raw.replaceAll(hex, replacement);
    });

    return raw;
  }, [code, isDayBool]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: svgHtml }} />;
}
