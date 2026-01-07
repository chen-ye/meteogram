import axios from 'axios';

// https://open-meteo.com/en/docs
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export interface WeatherData {
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    rain: number[];
    showers: number[];
    snowfall: number[];
    weathercode: number[];
    cloudcover: number[];
    windspeed_10m: number[];
    winddirection_10m: number[];
    apparent_temperature: number[];
    dewpoint_2m: number[];
    pressure_msl: number[];
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
    windgusts?: number;
  };
  utc_offset_seconds: number;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = {
    latitude: lat,
    longitude: lon,
    hourly: 'temperature_2m,precipitation,rain,showers,snowfall,weathercode,cloudcover,windspeed_10m,winddirection_10m,apparent_temperature,dewpoint_2m,pressure_msl',
    daily: 'sunrise,sunset',
    current: 'temperature_2m,wind_speed_10m,wind_direction_10m,weather_code,wind_gusts_10m',
    timezone: 'auto',
    forecast_days: 5,
  };

  const response = await axios.get(BASE_URL, { params });

  // Transform new "current" format to match our existing structure or update structure
  // OpenMeteo's 'current_weather=true' is legacy. 'current=...' returns a 'current' object.
  // We should switch to utilizing the 'current' object properly or stick to legacy if easier.
  // Legacy 'current_weather' doesn't support gusts easily. Let's switch to 'current'.

  const data = response.data;
  return {
      ...data,
      current_weather: {
          temperature: data.current.temperature_2m,
          windspeed: data.current.wind_speed_10m,
          winddirection: data.current.wind_direction_10m,
          weathercode: data.current.weather_code,
          time: data.current.time,
          windgusts: data.current.wind_gusts_10m
      }
  };
}
