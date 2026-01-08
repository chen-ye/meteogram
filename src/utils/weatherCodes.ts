import type { ComponentType } from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  type LucideProps,
} from 'lucide-react';

export const WMO = {
  ClearSky: 0,
  MainlyClear: 1,
  PartlyCloudy: 2,
  Overcast: 3,
  Fog: 45,
  DepositingRimeFog: 48,
  LightDrizzle: 51,
  ModerateDrizzle: 53,
  DenseDrizzle: 55,
  LightFreezingDrizzle: 56,
  DenseFreezingDrizzle: 57,
  SlightRain: 61,
  ModerateRain: 63,
  HeavyRain: 65,
  LightFreezingRain: 66,
  HeavyFreezingRain: 67,
  SlightSnowFall: 71,
  ModerateSnowFall: 73,
  HeavySnowFall: 75,
  SnowGrains: 77,
  SlightRainShowers: 80,
  ModerateRainShowers: 81,
  ViolentRainShowers: 82,
  SlightSnowShowers: 85,
  HeavySnowShowers: 86,
  Thunderstorm: 95,
  ThunderstormSlightHail: 96,
  ThunderstormHeavyHail: 99,
} as const;

export function getWeatherDescription(code: number): string {
  switch (code) {
    case WMO.ClearSky:
      return 'Clear sky';
    case WMO.MainlyClear:
      return 'Mainly clear';
    case WMO.PartlyCloudy:
      return 'Partly cloudy';
    case WMO.Overcast:
      return 'Overcast';
    case WMO.Fog:
      return 'Fog';
    case WMO.DepositingRimeFog:
      return 'Depositing rime fog';
    case WMO.LightDrizzle:
      return 'Light drizzle';
    case WMO.ModerateDrizzle:
      return 'Moderate drizzle';
    case WMO.DenseDrizzle:
      return 'Dense drizzle';
    case WMO.LightFreezingDrizzle:
      return 'Light freezing drizzle';
    case WMO.DenseFreezingDrizzle:
      return 'Dense freezing drizzle';
    case WMO.SlightRain:
      return 'Slight rain';
    case WMO.ModerateRain:
      return 'Moderate rain';
    case WMO.HeavyRain:
      return 'Heavy rain';
    case WMO.LightFreezingRain:
      return 'Light freezing rain';
    case WMO.HeavyFreezingRain:
      return 'Heavy freezing rain';
    case WMO.SlightSnowFall:
      return 'Slight snow fall';
    case WMO.ModerateSnowFall:
      return 'Moderate snow fall';
    case WMO.HeavySnowFall:
      return 'Heavy snow fall';
    case WMO.SnowGrains:
      return 'Snow grains';
    case WMO.SlightRainShowers:
      return 'Slight rain showers';
    case WMO.ModerateRainShowers:
      return 'Moderate rain showers';
    case WMO.ViolentRainShowers:
      return 'Violent rain showers';
    case WMO.SlightSnowShowers:
      return 'Slight snow showers';
    case WMO.HeavySnowShowers:
      return 'Heavy snow showers';
    case WMO.Thunderstorm:
      return 'Thunderstorm';
    case WMO.ThunderstormSlightHail:
      return 'Thunderstorm with slight hail';
    case WMO.ThunderstormHeavyHail:
      return 'Thunderstorm with heavy hail';
    default:
      return 'Unknown';
  }
}

export function getWeatherIcon(code: number, isDay: number | boolean): ComponentType<LucideProps> {
  const isDayBool = typeof isDay === 'number' ? isDay === 1 : isDay;

  switch (code) {
    case 0:
      return isDayBool ? Sun : Moon;
    case 1:
    case 2:
      return isDayBool ? CloudSun : CloudMoon;
    case 3:
      return Cloud;
    case 45:
    case 48:
      return CloudFog;
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return CloudDrizzle;
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return CloudRain;
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return CloudSnow;
    case 95:
    case 96:
    case 99:
      return CloudLightning;
    default:
      return Cloud;
  }
}
