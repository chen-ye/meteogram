import useSWR from 'swr';
import { fetchWeather, type WeatherData } from '../api/weather';
export type { WeatherData };

export function useWeather(lat?: number, lon?: number) {
  const { data, error, isLoading } = useSWR<WeatherData>(
    lat && lon ? ['weather', lat, lon] : null,
    () => fetchWeather(lat!, lon!)
  );

  return {
    weather: data,
    isLoading,
    isError: error,
  };
}
