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
  };
  utc_offset_seconds: number;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = {
    latitude: lat,
    longitude: lon,
    hourly: 'temperature_2m,precipitation,rain,showers,snowfall,weathercode,cloudcover,windspeed_10m,winddirection_10m,apparent_temperature,dewpoint_2m,pressure_msl',
    daily: 'sunrise,sunset',
    current_weather: true,
    timezone: 'auto',
    forecast_days: 5,
  };

  const response = await axios.get<WeatherData>(BASE_URL, { params });
  return response.data;
}
