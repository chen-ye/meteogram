import { createElement, useMemo } from 'react';
import type { LucideProps } from 'lucide-react';
import { getWeatherIcon } from '../utils/weatherCodes';

interface WeatherIconProps extends LucideProps {
  code: number;
  isDay: number | boolean;
}

export function WeatherIcon({ code, isDay, className, ...props }: WeatherIconProps) {
  const iconComponent = useMemo(() => getWeatherIcon(code, isDay), [code, isDay]);
  return createElement(iconComponent, { className, ...props });
}
